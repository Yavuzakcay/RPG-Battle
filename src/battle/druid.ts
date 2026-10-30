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
import { getMonster, type Monster } from '../data';
import { resolveSave } from '../rules/attack';
import { isIncapacitated } from '../rules/conditions';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
import { adjustDamage, halfDamage } from '../rules/damage';
import { applyHealing } from '../rules/damage';
import creatureTypes from '../../data/canavar-turleri.json';
import { fail, finish, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { monsterAvatar } from './avatar';
import { turnKey } from './economy';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant, type ShapeStats, type UsableFeature } from './types';

const TYPES = creatureTypes.types as Record<string, string>;
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

/** Bu seviyede alınabilen Beast biçimleri (SRD canavarlarından). */
export function eligibleForms(monsters: Monster[], f: UsableFeature, level: number): Monster[] {
  const lim = shapeLimits(f, level);
  if (!lim) return [];
  return monsters.filter((m) => TYPES[m.id] === 'beast' && crValue(m.cr) <= lim.maxCr && (lim.fly || !m.fly));
}

/** Biçimin savaş değerleri (olaya yazılır; reducer bunları uygular). */
export function shapeStats(m: Monster, druid: Combatant): ShapeStats {
  const mod = (n: number) => Math.floor((n - 10) / 2);
  const attacks: AttackOption[] = m.attacks.filter((a) => a.damageDice && !a.save && !a.recharge).map((a) => ({
    label: `${a.name} (${m.name})`, attackBonus: a.bonus, damage: a.damageDice as string, damageType: a.damageType ?? 'bludgeoning',
    ranged: !!a.ranged, spell: false, ...(a.ranged && a.range ? { range: a.range } : { reachFt: a.reachFt ?? 5 }),
    tag: `${m.name} ${a.name} ${a.damageType ?? ''}`.toLowerCase(), weaponId: `beast:${m.id}`, beast: { monster: m.id, attack: a.name },
  }));
  const multi = m.multiattack ? m.attacks.filter((a) => !a.recharge).reduce((n, a) => n + (a.repeat ?? 0), 0) : 1;
  const mods = { ...druid.modifiers, str: mod(m.abilities.str), dex: mod(m.abilities.dex), con: mod(m.abilities.con) };
  return {
    form: m.id, name: m.name, ac: m.ac, speed: m.speed, fly: m.fly ?? 0, size: m.size ?? druid.size, modifiers: mods,
    saves: { ...druid.saves, str: mods.str, dex: mods.dex, con: mods.con }, weaponOptions: attacks, attacksPerAction: Math.max(1, multi),
    avatar: monsterAvatar(m),
  };
}

export function wildShapeProblem(state: BattleState, actor: Combatant, form: string | undefined, monsters: Monster[]): string | null {
  const f = wildShapeFeature(actor);
  if (!f) return 'Wild Shape yok.';
  if (form === undefined) return actor.shape ? null : 'Biçimde değilsin.';
  if (isIncapacitated(actor.conditions)) return 'Incapacitated iken biçim değiştirilemez.';
  if (f.resource && resourceLeft(actor, f.resource) <= 0) return `${f.name}: kullanım kalmadı.`;
  const m = eligibleForms(monsters, f, actor.level).find((x) => x.id === form);
  if (!m) return 'Bu biçim bu seviyede alınamaz.';
  if (actor.wildShapeForms?.length && !actor.wildShapeForms.includes(form)) return 'Bu biçim bilinen biçimlerin arasında değil.';
  return null;
}

/** `wild_shape`: biçime gir (`form`) ya da bırak (`form` yok). Eylem ekonomisi `economy.ts`'te (bonus eylem). */
export function executeWildShape(state: BattleState, actor: Combatant, form: string | undefined): CommandResult {
  const monsters = form ? [getMonster(form)].filter((x): x is Monster => !!x) : [];
  const why = wildShapeProblem(state, actor, form, monsters);
  if (why) return fail(why);
  if (form === undefined) return finish(state, [{ type: 'shape_changed', actorId: actor.id, stats: null, reason: 'bıraktı' }]);
  const f = wildShapeFeature(actor) as UsableFeature;
  const stats = shapeStats(monsters[0] as Monster, actor.shape ? { ...actor, ...actor.shape.prev } : actor);
  const events: BattleEvent[] = [];
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  events.push({ type: 'shape_changed', actorId: actor.id, stats });
  events.push({ type: 'temp_hp', targetId: actor.id, amount: actor.level, label: f.name });
  return finish(state, events);
}

/** Biçim biter: 0 HP ya da Incapacitated (her komutun sonunda). */
export function shapeCleanup(state: BattleState): BattleEvent[] {
  return Object.values(state.combatants).filter((c) => c.shape && (c.hp <= 0 || isIncapacitated(c.conditions)))
    .map((c) => ({ type: 'shape_changed', actorId: c.id, stats: null, reason: c.hp <= 0 ? '0 HP' : 'Incapacitated' }) as BattleEvent);
}

/** Wild Resurgence: `toShape` (kullanım yoksa en düşük slotla, turda bir) ya da `toSlot` (kullanımla 1. seviye slot, uzun dinlenmede bir). */
export function executeWildResurgence(state: BattleState, actor: Combatant, mode: 'toShape' | 'toSlot'): CommandResult {
  const f = wildShapeFeature(actor);
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
  const n = Object.entries(e.dice).filter(([l]) => actor.level >= Number(l)).reduce((m, [, v]) => Math.max(m, v), 0);
  const inside = (c: Combatant) => !state.map || (!!to && !!c.pos && distance(c.pos, to) * 5 <= e.radiusFt);
  const living = Object.values(state.combatants).filter((c) => c.hp > 0 && !c.civilian && !c.summon?.gone && inside(c));
  const events: BattleEvent[] = [];
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: f.name, slotLevel: null, note: `10 ft küre, ${n}d6` });
  const dmg = rollDice(`${n}d6`, rollTag(rng, { kind: 'damage', by: actor.id }));
  for (const t of living.filter((c) => c.side !== actor.side)) {
    const save = resolveSave({ extra: saveDice(t, 'con'), modifier: t.saves.con, dc: actor.spellSaveDc ?? 0, mode: saveMode('normal', t, 'con') }, rollTag(rng, { by: t.id }));
    const raw = save.success ? halfDamage(dmg.total) : dmg.total;
    const adj = adjustDamage(raw, 'necrotic', t);
    const fx = damageEffects(t, adj.amount, 'necrotic', false, rng);
    events.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: 'con', dc: actor.spellSaveDc ?? 0, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: dmg.rolls, rawDamage: raw, appliedDamage: adj.amount, damageType: 'necrotic', damageNote: adj.note, targetHpAfter: fx.hpAfter,
      effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}) });
  }
  const ally = living.filter((c) => c.side === actor.side && c.hp < c.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (ally) {
    const heal = rollDice(`${n}d6`, rollTag(rng, { kind: 'heal', by: actor.id })).total;
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
export function availableForms(monsters: Monster[], c: Combatant): Monster[] {
  const f = wildShapeFeature(c);
  const lim = f ? shapeLimits(f, c.level) : null;
  if (!f || !lim) return [];
  const all = eligibleForms(monsters, f, c.level);
  if (c.wildShapeForms?.length) return all.filter((m) => c.wildShapeForms?.includes(m.id));
  return [...all].sort((a, b) => crValue(b.cr) - crValue(a.cr) || b.hp - a.hp).slice(0, lim.known);
}
