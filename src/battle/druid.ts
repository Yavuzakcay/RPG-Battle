/**
 * Görev DRUID (SRD 5.2.1; veriden, kodda sınıf adı yok):
 * - Wild Shape (`wild_shape` komutu; özellik etkisi `wildShape`): bonus eylemle Beast biçimine girme / bırakma. SRD 5.2.1:
 *   HP korunur, Druid seviyesi kadar geçici HP; AC, hız, uçuş, boyut, STR/DEX/CON ve saldırılar biçimden; büyü yapılamaz
 *   (Beast Spells hariç). Biçim olaydaki bilgilerle (`shape_changed`) reducer'da uygulanır, bırakınca eski değerler döner;
 *   Incapacitated ya da 0 HP'de biter (her komutun sonunda). Bilinen biçim sayısı ve en yüksek CR veride (`forms`).
 * - Wild Resurgence (`wild_resurgence`): kullanım yoksa slotla bir kullanım (turda bir); uzun dinlenmede bir kez kullanımla
 *   1. seviye slot.
 * - Land's Aid (`landsAid` etkisi): 60 ft içinde 10 ft küre, seçilen yaratıklar CON save, Necrotic; bir dost iyileşir.
 * Saf.
 */
import { featureLevel } from './classLevel';
import { karar104On } from './karar104Surum';
import { askChoice, askPicks } from '../rules/choice';
import { b94On } from './b94Surum';
import { healRoll } from './healMax';
import { globalRule } from './ruleControl';
import { spiderOver } from './karadul';
import { getMonster, type Monster } from '../data';
import { resolveSave } from '../rules/attack';
import { isIncapacitated } from '../rules/conditions';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { adjustDamage, halfDamage } from '../rules/damage';
import { applyHealing } from '../rules/damage';
import { creatureTypeAt, monsterAt, swimSpeedAt } from './srdD1';
import { bicimYuzmeOn, WS87_VERSION, ws87On } from './wildShape87Surum';
import { srdD3On } from './srdD3Surum';
import { ws92On } from './ws92Surum';
import { shapeMonsterPart } from './shapeMonster';
import { SKILLS, type Skill } from '../rules/skills';
import { CURRENT_RULES } from './ruleVersion';
import { fail, finish, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { monsterAvatar } from './avatar';
import { turnKey } from './economy';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant, type ShapeStats, type UsableFeature } from './types';

const crValue = (cr: string) => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));

/** Wild Shape özelliği (yoksa undefined). */
export const wildShapeFeature = (c: Combatant): UsableFeature | undefined => (c.features ?? []).find((f) => f.effect.kind === 'wildShape');

/** Seviyede biçim sınırları: bilinen biçim sayısı, en yüksek CR, uçuş. */
export function shapeLimits(f: UsableFeature, level: number): { known: number; maxCr: number; fly: boolean } | null {
  if (f.effect.kind !== 'wildShape') return null;
  const rows = Object.entries(f.effect.forms).filter(([l]) => level >= Number(l)).sort((a, b) => Number(b[0]) - Number(a[0]));
  const row = rows[0]?.[1];
  return row ? { known: row[0], maxCr: crValue(row[1]), fly: row[2] } : null;
}

/** Bu seviyede alınabilen Beast biçimleri (SRD canavarlarından). Görev D1: `v` kural sürümü (yoksa güncel tür). */
export function eligibleForms(monsters: Monster[], f: UsableFeature, level: number, v?: number): Monster[] {
  const lim = shapeLimits(f, level);
  if (!lim) return [];
  return monsters.filter((m) => creatureTypeAt(m.id, v) === 'beast' && crValue(m.cr) <= lim.maxCr && (lim.fly || !m.fly));
}

/**
 * Biçim değerlerinin seçenekleri (kural sürümü 87, Görev WS87). `swimFt`: biçimin yüzme hızı (`bicimYuzme`; verilmezse alan
 * yazılmaz). `srd87`: SRD 5.2.1 aktarımı: `wild` (s.43: INT/WIS/CHA korunur; kurtarma yetkinliği ve diğer kurtarma ekleri
 * korunur, stat bloğundaki kurtarma yüksekse o), `poly` (s.153: bütün yetenekler ve kurtarmalar biçimin stat bloğundan).
 */
export interface ShapeOpts { swimFt?: number; srd87?: 'wild' | 'poly'; /** Görev D3 (89+): beceriler biçime göre (`wildSkills`). */ srd89?: boolean;
  /** Görev WS92 (92+): eşya kaynaşır (kurtarma eki düşer; s. 43 "Objects"), biçimin STR/DEX skoru. */ ws92?: boolean }

/**
 * Kural sürümü 87: seçili biçimlerden bu seviyede hâlâ alınabilenler (CR, uçuş, Beast türü sürümde). Geçersizler kayıtta
 * kalır, yalnız sayılmaz; seviye geri gelince yine geçerli. Oluşturucu `v` vermez (güncel tür).
 */
export function validKnownForms(ids: string[] | undefined, f: UsableFeature, level: number, v?: number): string[] {
  if (!ids?.length) return [];
  const ok = new Set(eligibleForms(ids.map((id) => getMonster(id)).filter((x): x is Monster => !!x), f, level, v).map((m) => m.id));
  return ids.filter((id) => ok.has(id));
}

/** Biçimin savaş değerleri (olaya yazılır; reducer bunları uygular). */
export function shapeStats(m: Monster, druid: Combatant, o: ShapeOpts = {}): ShapeStats {
  const mod = (n: number) => Math.floor((n - 10) / 2);
  const attacks: AttackOption[] = m.attacks.filter((a) => a.damageDice && !a.save && !a.recharge).map((a) => ({
    label: `${a.name} (${m.name})`, attackBonus: a.bonus, damage: a.damageDice as string, damageType: a.damageType ?? 'bludgeoning',
    ranged: !!a.ranged, spell: false, ...(a.ranged && a.range ? { range: a.range } : { reachFt: a.reachFt ?? 5 }),
    tag: `${m.name} ${a.name} ${a.damageType ?? ''}`.toLowerCase(), weaponId: `beast:${m.id}`, beast: { monster: m.id, attack: a.name },
  }));
  const multi = m.multiattack ? m.attacks.filter((a) => !a.recharge).reduce((n, a) => n + (a.repeat ?? 0), 0) : 1;
  const beastMods = { str: mod(m.abilities.str), dex: mod(m.abilities.dex), con: mod(m.abilities.con),
    int: mod(m.abilities.int), wis: mod(m.abilities.wis), cha: mod(m.abilities.cha) };
  const mods = o.srd87 === 'poly' ? beastMods : { ...druid.modifiers, str: beastMods.str, dex: beastMods.dex, con: beastMods.con };
  return {
    form: m.id, name: m.name, ac: m.ac, speed: m.speed, fly: m.fly ?? 0, size: m.size ?? druid.size, modifiers: mods,
    saves: o.srd87 === 'poly' ? { ...beastMods, ...m.saves } : o.srd87 === 'wild' ? wildSaves(m, druid, mods, !!o.ws92)
      : { ...druid.saves, str: mods.str, dex: mods.dex, con: mods.con },
    weaponOptions: attacks, attacksPerAction: Math.max(1, multi),
    avatar: monsterAvatar(m),
    ...(o.swimFt !== undefined ? { swimFt: o.swimFt } : {}),
    ...(o.srd89 && o.srd87 ? { skills: o.srd87 === 'poly' ? { ...(m.skills ?? {}) } : wildSkills(m, druid, mods) } : {}),
    // Görev WS92 (92+): STR/DEX skoru biçimden (s. 43 "Game Statistics"; atlama, taşıma, sürükleme).
    ...(o.ws92 ? { scores: { str: m.abilities.str, dex: m.abilities.dex } } : {}),
  };
}

/**
 * Görev D3 (sürüm 89; SRD 5.2.1 s. 43): "You also retain your skill ... proficiencies and use your Proficiency Bonus for
 * them, in addition to gaining the proficiencies of the creature. If a skill ... modifier in the Beast's stat block is higher
 * than yours, use the one in the stat block." Druid'in yetkin olduğu becerinin yetenek değiştiricisinin üstündeki eki
 * (yetkinlik, uzmanlık) biçimin değiştiricisine eklenir; stat bloğundaki beceri yüksekse o. Yetkin olunmayan beceri yine
 * biçimin değiştiricisinden (`skillBonus`).
 */
function wildSkills(m: Monster, druid: Combatant, mods: Combatant['modifiers']): Combatant['skills'] {
  // Biçimdeyken yeni biçim: Druid'in kendi değerleri `shape.prev`'te (önceki biçimin becerileri yetkinlik sayılmaz).
  const own = druid.shape?.prev.skills ?? druid.skills;
  const ownMods = druid.shape?.prev.modifiers ?? druid.modifiers;
  const out: Combatant['skills'] = {};
  for (const k of Object.keys(own) as Skill[]) {
    const v = own[k];
    if (v !== undefined) out[k] = mods[SKILLS[k].ability] + (v - ownMods[SKILLS[k].ability]);
  }
  for (const [k, v] of Object.entries(m.skills ?? {}) as Array<[Skill, number]>) out[k] = Math.max(out[k] ?? -Infinity, v);
  return out;
}

/**
 * SRD 5.2.1 s.43: kurtarma yetkinlikleri korunur (yaratığın yetkinliğinin üstüne), stat bloğundaki kurtarma yüksekse o.
 * Druid'in yetenek değiştiricisinin üstündeki kurtarma eki (yetkinlik, eşya, özellik) biçimin değiştiricisine eklenir.
 */
function wildSaves(m: Monster, druid: Combatant, mods: Combatant['modifiers'], ws92 = false): Combatant['saves'] {
  const out = { ...druid.saves };
  // Görev WS92 (92+; s. 43 "Objects"): eşya biçime kaynaşır (AC gibi kurtarma eki de işlemez; ⚠ "giyilir" seçeneği yok).
  const item = ws92 ? druid.itemSaveBonus ?? 0 : 0;
  for (const a of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const own = mods[a] + (druid.saves[a] - druid.modifiers[a]) - item;
    out[a] = Math.max(own, m.saves?.[a] ?? -Infinity);
  }
  return out;
}

/** Savaşın kural sürümüne göre biçim seçenekleri (87+: SRD aktarımı, anahtar açıksa yüzme hızı). */
export function shapeOptsAt(state: BattleState, m: Monster, kind: 'wild' | 'poly'): ShapeOpts {
  if (!ws87On(state)) return {};
  return { srd87: kind, ...(bicimYuzmeOn(state) ? { swimFt: swimSpeedAt(m.id, state.kuralSurumu ?? 1) ?? 0 } : {}),
    ...(srdD3On(state) ? { srd89: true } : {}), ...(ws92On(state) ? { ws92: true } : {}) };
}

export function wildShapeProblem(state: BattleState, actor: Combatant, form: string | undefined, monsters: Monster[]): string | null {
  const f = wildShapeFeature(actor);
  if (!f) return 'Wild Shape yok.';
  if (form === undefined) return actor.shape ? null : 'Biçimde değilsin.';
  if (isIncapacitated(actor.conditions)) return 'Incapacitated iken biçim değiştirilemez.';
  if (f.resource && resourceLeft(actor, f.resource) <= 0) return `${f.name}: kullanım kalmadı.`;
  const m = eligibleForms(monsters, f, featureLevel(actor, f.key), state.kuralSurumu ?? 1).find((x) => x.id === form);
  if (!m) return 'Bu biçim bu seviyede alınamaz.';
  // Kural sürümü 87: seviyede artık alınamayan ya da Beast olmayan seçili biçimler yok sayılır (kayıtta kalır).
  const known = ws87On(state) ? validKnownForms(actor.wildShapeForms, f, featureLevel(actor, f.key), state.kuralSurumu ?? 1) : actor.wildShapeForms ?? [];
  if (known.length && !known.includes(form)) return 'Bu biçim bilinen biçimlerin arasında değil.';
  return null;
}

/** `wild_shape`: biçime gir (`form`) ya da bırak (`form` yok). Eylem ekonomisi `economy.ts`'te (bonus eylem). */
export function executeWildShape(state: BattleState, actor: Combatant, form: string | undefined): CommandResult {
  // Görev D1: biçimin değerleri savaşın kural sürümündeki veriden (85 ve altı: SRD düzeltmesi öncesi).
  const monsters = form ? [getMonster(form)].filter((x): x is Monster => !!x).map((m) => monsterAt(m, state.kuralSurumu ?? 1)) : [];
  const why = wildShapeProblem(state, actor, form, monsters);
  if (why) return fail(why);
  if (form === undefined) return finish(state, [{ type: 'shape_changed', actorId: actor.id, stats: null, reason: 'bıraktı' }]);
  const f = wildShapeFeature(actor) as UsableFeature;
  const stats0 = shapeStats(monsters[0] as Monster, actor.shape ? { ...actor, ...actor.shape.prev } : actor, shapeOptsAt(state, monsters[0] as Monster, 'wild'));
  // Görev WS91 (91+): stat bloğunun kalanı canavar kurulumunun geçişinden (`shapeMonster.ts`).
  const mp = shapeMonsterPart(state, actor, monsters[0] as Monster, 'wild');
  const stats: ShapeStats = mp ? { ...stats0, monster: mp.monster, attacks: mp.attacks, multiattack: false } : stats0;
  const events: BattleEvent[] = [];
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  events.push({ type: 'shape_changed', actorId: actor.id, stats });
  events.push({ type: 'temp_hp', targetId: actor.id, amount: featureLevel(actor, f.key), label: f.name });
  return finish(state, events);
}

/** Biçim biter: 0 HP ya da Incapacitated (her komutun sonunda). */
export function shapeCleanup(state: BattleState): BattleEvent[] {
  return Object.values(state.combatants).filter((c) => c.shape && !c.shape.possession && (c.hp <= 0 || (!c.shape.polymorph && isIncapacitated(c.conditions)) || polymorphOver(c) || spiderOver(c)))
    .map((c) => ({ type: 'shape_changed', actorId: c.id, stats: null, reason: c.hp <= 0 ? '0 HP' : polymorphOver(c) ? 'Polymorph bitti' : spiderOver(c) ? 'biçim canı bitti' : 'Incapacitated' }) as BattleEvent);
}

/** Kuyruk 18 H2: Polymorph biçimi geçici HP bitince ya da etki (konsantrasyon) kalkınca biter. */
function polymorphOver(c: Combatant): boolean {
  return !!c.shape?.polymorph && ((c.tempHp ?? 0) <= 0 || !c.effects?.some((e) => e.polymorph));
}

/** Wild Resurgence: `toShape` (kullanım yoksa en düşük slotla, turda bir) ya da `toSlot` (kullanımla 1. seviye slot, uzun dinlenmede bir). */
export function executeWildResurgence(state: BattleState, actor: Combatant, mode: 'toShape' | 'toSlot' | 'magician', uses = 1): CommandResult {
  const f = wildShapeFeature(actor);
  // Kuyruk 19 (11–20): Nature Magician (Archdruid 20): Wild Shape kullanımları tek slota (kullanım başına 2 seviye, en çok 9);
  // uzun dinlenmede bir (kaynak `natureMagician`), eylemsiz. `featuresK19`.
  if (mode === 'magician') {
    if (!f?.resource || !actor.traits?.includes('nature-magician') || !globalRule(state, 'featuresK19')) return fail('Nature Magician yok ya da kapalı.');
    const left = resourceLeft(actor, f.resource);
    const n = Math.max(1, Math.min(4, Math.floor(uses)));
    if (n > left) return fail(`${n} Wild Shape kullanımı gerekli (${left} var).`);
    if (resourceLeft(actor, 'natureMagician') <= 0) return fail('Bu dinlenmede kullanıldı.');
    return finish(state, [{ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: left - n },
      { type: 'feature_used', actorId: actor.id, feature: 'natureMagician', remaining: resourceLeft(actor, 'natureMagician') - 1 },
      { type: 'slot_created', actorId: actor.id, level: Math.min(9, 2 * n) }]);
  }
  if (!f?.resource || !actor.traits?.includes('wild-resurgence')) return fail('Wild Resurgence yok.');
  const left = resourceLeft(actor, f.resource);
  if (mode === 'toShape') {
    if (left > 0) return fail('Wild Shape kullanımın var.');
    if (actor.traitTurns?.['wild-resurgence'] === turnKey(state)) return fail('Wild Resurgence turda bir kez.');
    const i = actor.spellSlots.findIndex((n) => n > 0);
    if (i < 0) return fail('Harcanacak slot yok.');
    return finish(state, [{ type: 'slot_spent', actorId: actor.id, level: i + 1, remaining: (actor.spellSlots[i] ?? 1) - 1 },
      { type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: 1 },
      { type: 'trait_turn', actorId: actor.id, trait: 'wild-resurgence', key: turnKey(state) }]);
  }
  if (left <= 0) return fail('Wild Shape kullanımı yok.');
  if (resourceLeft(actor, 'wildResurgence') <= 0) return fail('Bu dinlenmede kullanıldı.');
  return finish(state, [{ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: left - 1 },
    { type: 'feature_used', actorId: actor.id, feature: 'wildResurgence', remaining: resourceLeft(actor, 'wildResurgence') - 1 },
    { type: 'slot_created', actorId: actor.id, level: 1 }]);
}

/** Land's Aid: nokta (altıgen) 60 ft içinde; 10 ft küre içindeki düşmanlar CON save (Necrotic, başarıda yarı), en yaralı dost iyileşir. */
export function landsAidProblem(state: BattleState, actor: Combatant, f: UsableFeature, to: Offset | undefined): string | null {
  const e = f.effect;
  if (e.kind !== 'landsAid') return null;
  if (f.resource && resourceLeft(actor, f.resource) <= 0) return `${f.name}: Wild Shape kullanımı kalmadı.`;
  if (!state.map) return null;
  if (!to) return 'Bir nokta seçmelisin.';
  if (actor.pos && distance(actor.pos, to) * 5 > e.rangeFt) return `${e.rangeFt} ft içinde olmalı.`;
  return null;
}

export function executeLandsAid(state: BattleState, actor: Combatant, f: UsableFeature, to: Offset | undefined, rng: Rng): CommandResult {
  const why = landsAidProblem(state, actor, f, to);
  if (why) return fail(why);
  const e = f.effect;
  if (e.kind !== 'landsAid') return fail('Land\'s Aid yok.');
  const n = Object.entries(e.dice).filter(([l]) => featureLevel(actor, f.key) >= Number(l)).reduce((m, [, v]) => Math.max(m, v), 0);
  const inside = (c: Combatant) => !state.map || (!!to && !!c.pos && distance(c.pos, to) * 5 <= e.radiusFt);
  const living = Object.values(state.combatants).filter((c) => c.hp > 0 && !c.civilian && !c.summon?.gone && inside(c));
  const events: BattleEvent[] = [];
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: f.name, slotLevel: null, note: `10 ft küre, ${n}d6` });
  const dmg = rollDice(`${n}d6`, rollTag(rng, { kind: 'damage', by: actor.id }));
  // Görev KARAR104 (A5, 104+; SRD "each creature of your choice"): save atacaklar sırayla sorulur; öneri düşmanlar (eski davranış).
  const foes = living.filter((c) => c.side !== actor.side);
  const picked = karar104On(state) ? new Set(askPicks(rng, { actorId: actor.id, label: `${f.name}: hedef`, options: living.map((c) => ({ id: c.id, label: c.name })), suggested: foes.map((c) => c.id), max: living.length })) : null;
  for (const t of picked ? living.filter((c) => picked.has(c.id)) : foes) {
    const save = resolveSave({ extra: saveDice(t, 'con'), modifier: t.saves.con, dc: actor.spellSaveDc ?? 0, mode: saveMode('normal', t, 'con') }, rollTag(rng, { by: t.id }));
    const raw = save.success ? halfDamage(dmg.total) : dmg.total;
    const adj = adjustDamage(raw, 'necrotic', t);
    const fx = damageEffects(t, adj.amount, 'necrotic', false, rng);
    events.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: 'con', dc: actor.spellSaveDc ?? 0, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: dmg.rolls, rawDamage: raw, appliedDamage: adj.amount, damageType: 'necrotic', damageNote: adj.note, targetHpAfter: fx.hpAfter,
      effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}) });
  }
  // Görev B94 (sürüm 94+, SRD 5.2.1 s. 46 "One creature of your choice in that area regains HP"): 0 HP'deki (ölmemiş) dost da
  // iyileşir ve ayağa kalkar; en yaralı (0 HP önce).
  const healable = b94On(state) ? Object.values(state.combatants).filter((c) => c.hp <= 0 && c.life !== 'dead' && !c.civilian && !c.summon?.gone && inside(c)) : [];
  const ally0 = [...living, ...healable].filter((c) => c.side === actor.side && c.hp < c.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  // Görev KARAR104 (A5, 104+; "One creature of your choice in that area regains HP"): iyileşecek sorulur; öneri en yaralı dost.
  const healCands = [...living, ...healable].filter((c) => c.hp < c.maxHp);
  const healId = karar104On(state) ? askChoice(rng, { actorId: actor.id, label: `${f.name}: iyileşecek`, options: healCands.map((c) => ({ id: c.id, label: c.name })), suggested: ally0?.id ?? null }) : ally0?.id;
  const ally = healCands.find((c) => c.id === healId);
  if (ally) {
    const heal = healRoll(state, ally, `${n}d6`, rng, actor.id);
    const after = applyHealing(ally.hp, ally.maxHp, heal);
    events.push({ type: 'healed', actorId: actor.id, targetId: ally.id, label: f.name, amount: after - ally.hp, targetHpAfter: after });
  }
  return finish(state, events);
}

/** Archdruid: Evergreen Wild Shape: inisiyatifte kullanım yoksa bir kullanım. */
export function evergreenEvents(c: Combatant): BattleEvent[] {
  const f = wildShapeFeature(c);
  if (!f?.resource || !c.traits?.includes('evergreen-wild-shape') || resourceLeft(c, f.resource) > 0) return [];
  return [{ type: 'feature_used', actorId: c.id, feature: f.resource, remaining: 1 }];
}

/** Savaşta seçilebilen biçimler: bilinen biçimler (karakterde seçildiyse) ya da uygun olanlardan en yüksek CR'li ilk N. */
export function availableForms(monsters: Monster[], c: Combatant, v?: number): Monster[] {
  const f = wildShapeFeature(c);
  const lim = f ? shapeLimits(f, featureLevel(c, f.key)) : null;
  if (!f || !lim) return [];
  const all = eligibleForms(monsters, f, featureLevel(c, f.key), v);
  // Kural sürümü 87: geçersiz seçili biçimler sayılmaz; geçerli seçim kalmadıysa seçimsiz gibi en güçlüleri.
  const chosen = all.filter((m) => c.wildShapeForms?.includes(m.id));
  if (c.wildShapeForms?.length && (chosen.length || (v ?? CURRENT_RULES) < WS87_VERSION)) return chosen;
  return [...all].sort((a, b) => crValue(b.cr) - crValue(a.cr) || b.hp - a.hp).slice(0, lim.known);
}
