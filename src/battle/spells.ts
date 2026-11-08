/** Büyü yapma: slot harcama, saldırı ve save büyüleri, iyileştirme, durumlar. */
import { freeShapeArea } from './freeShape';
import { homeSide } from './allegiance';
import { possessedEffect, possessionEndEvents, possessionOn } from './possession';
import { possessorAt } from './possessionCore';
import { truesightSees } from './sight';
import { gazePos } from './chainPact';
import { lifeBondEvents } from './steed';
import { executeTerraform } from './terraform';
import { executeTelekinesis, telekinesisOn } from './telekinesis';
import { disperseEvents } from './surfaceMix';
import { polymorphEvents } from './polymorph';
import { newZoneId, profileIn } from './zones';
import { sightConditions } from './sight';
import { ABILITIES, type Ability } from '../rules/abilities';
import { attackDice, saveDice } from './effectDice';
import { saveMode, spellTimerEvents } from './durations';
import { getEnvironment, spells, type Spell, type SpellMechanics } from '../data';
import { ruleVersion } from './ruleVersion';
import type { AreaShape } from '../rules/area';
import { autoFailsStrDexSave, attackSources, isAutoCritical } from '../rules/conditions';
import { adjustDamage, applyHealing, halfDamage } from '../rules/damage';
import { formatDice, parseDice, rollD20, rollDie, rollDice, rollTag, type Rng } from '../rules/dice';
import { resolveAttack, resolveSave } from '../rules/attack';
import { combineModes, environmentSources, invertMode, type ModeSource } from '../rules/modes';
import { checkReach, spellReach } from './range';
import { heightOf } from './cover';
import { AXIAL_DIRECTIONS, distance, hexKey, neighbors, offsetToAxial, type Offset } from '../rules/hex';
import { hasDarkness, inShadowAt, litHexes, ruleOf } from './maprules';
import { globalRule } from './ruleControl';
import { after69, spells69Problem, wishProblem, wishSpell } from './spells69';
import { freeCastingEvents } from './boons';
import { overchannelAfter, overchannelProblem, overchannelRng } from './apex';
import { paketSpellBonus, paketSpellTransform } from './paket/core';
import { paketHealRoll } from './paket/p11';
import { fireStored, paketCast } from './paket/p11cast';
import { hexLabel, speedHexes } from './movement';
import type { Cover } from '../map/terrain';
import { damageEffects } from './damage-effects';
import { atSlot, fail, finish, isTargetable, upcastDiceCount, withinFiveFt, type CommandResult, damageProfile } from './common';
import { elusiveFilter, saveDamage, traitSources } from './classTraits';
import { turnKey } from './economy';
import { concentrationEvent, spendSlot } from './slots';
import { executeSummon } from './summons';
import { castBarrier } from './castBarrier';
import { teleportEvent, teleportProblem } from './teleport';
import { askChoice } from '../rules/choice';
import { gap } from './body';
import { areaReachesAltitude, levitateRiseEvents } from './altitude';
import { quakeCastEvents } from './quake';
import { executeLevitateObject, executeResizeObject, illusionEvents, recallBlade } from './s2spells';
import { dropEvents, handsOn, heldMetal, heldWeapons, touchesMetal, wearsMetal } from './heldItems';
import { OBJECTS } from './objectData';
import { surfaceEvent } from './surfaces';
import { withArrival } from './motion';
import { pickArea } from './areaAttack';
import { auraSave, hitExtras, weaponAttackEvents, weaponHexNear } from './features';
import { effectiveAc, smiteEvents, smiteProblem, wardSources } from './divine';
import { pushAwayEvents } from './forced';
import { applyEvents } from './reduce';
import { heldFollow, mechanicsAt } from './spellVersion';
import srdSpells from '../../data/srd/spells.json';
import { executeZoneCast, movableZoneOf, shiftZoneEvents, silencedAt, zoneHexes } from './zones';
import { executeFireHex, fireHexSpell } from './ignite';
import { cantripBonus, healBonus, healDice, healSelfAfter } from './cleric';
import { affinityBonus, castWithMetamagic, empowerRolls, innateFor, POINTS } from './sorcerer';
import { counterspellCheck, damagedReactions, hitReactions, targetedReactions } from './reactions';
import { resourceLeft } from './types';
import type { ActiveEffect, AttackOption, CommandWord, BattleEvent, BattleState, Combatant, Command, ExtraDamage, MapObject } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Zar ifadesini kurar: cantrip seviye ölçeği ve büyü modifier'ı dahil. */
/** Görev SORCERER: patlayan zar: `face` gelen her zar için ek zar (zincirleme), en çok `most` tane. */
function explodeRolls(rolls: number[], face: number, most: number, actor: Combatant, rng: Rng): number[] {
  const out: number[] = [];
  let pending = rolls.filter((x) => x === face).length;
  while (pending > 0 && out.length < most) {
    const v = rollDie(face, rollTag(rng, { kind: 'damage', by: actor.id }));
    out.push(v);
    pending += (v === face ? 1 : 0) - 1;
  }
  return out;
}

/** Büyü hasar zarı (Görev SORCERER: Empowered Spell en düşük zarları yeniden atar). */
function spellDamageRoll(expr: string, actor: Combatant, rng: Rng): { rolls: number[]; total: number } {
  const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }));
  if (!actor.traits?.includes('mm-empowered')) return d;
  const sides = parseDice(expr).sides;
  const rolls = empowerRolls(actor, d.rolls, sides, rng);
  return { rolls, total: d.total - d.rolls.reduce((n, x) => n + x, 0) + rolls.reduce((n, x) => n + x, 0) };
}

/** Kuyruk P12 (paket `buyuDegisimi.ikizOkul`; savaşçıda `pkTwinSchool`, sürüm 43+): bu okulun alansız, menzilli büyüsü bir hedef fazla. */
const schoolTwin = (actor: Combatant, spell: Spell): boolean => !!actor.pkTwinSchool && spell.school === actor.pkTwinSchool && !spell.area && spell.rangeFt > 0;

/** Görev WIZARD: Potent Cantrip (Evoker): save'li cantrip'te başarıda da yarı hasar. */
const potentCantrip = (actor: Combatant, spell: Spell) => spell.level === 0 && !!actor.traits?.includes('potent-cantrip');

function damageExpr(m: SpellMechanics, actor: Combatant, tier: number, upcast = 0, school?: string, name?: string): string {
  const spec = parseDice(m.damage ?? '');
  const count = (m.scalesWithLevel ? spec.count * tier : spec.count) + upcastDiceCount(m, upcast);
  // A1: sabit yukarı slot eki (Heal: slot seviyesi başına +10).
  const upFlat = m.upcast?.applied && m.upcast.dice && upcast > 0 && parseDice(m.upcast.dice).count === 0 ? parseDice(m.upcast.dice).bonus * upcast : 0;
  // Görev CLERIC: Potent Spellcasting (cantrip hasarına WIS; iyileştirme ve zaten değiştiricili cantrip'ler hariç).
  const bonus = spec.bonus + upFlat + (m.addCastingMod ? actor.spellMod : 0) + (m.scalesWithLevel && !m.addCastingMod && m.kind !== 'heal' ? cantripBonus(actor) : 0)
    // Görev WIZARD: Empowered Evocation (Evoker 10): Evocation büyüsünün hasarına INT (bir hasar zarına; burada toplama).
    + (school === 'Evocation' && m.kind !== 'heal' && !!actor.traits?.includes('empowered-evocation') ? Math.max(0, actor.spellMod) : 0)
    // Görev SORCERER: Elemental Affinity (Draconic): soyun hasar türündeki büyüye CHA.
    + (m.kind !== 'heal' ? affinityBonus(actor, m.damageType) : 0)
    // Görev P0: ek paket buyuDegisimi (hasar eklentisi).
    + (m.kind !== 'heal' && actor.paket ? paketSpellBonus(actor, m.damageType, school, name ? spells.find((s) => s.name === name)?.rangeFt : undefined, !!actor.paket.v42) : 0)
    // Görev WARLOCK: Agonizing Blast: seçilen cantrip'in hasar zarına (her ışına) büyü yeteneği.
    + (name && actor.cantripMods?.[name]?.ability && m.kind !== 'heal' ? actor.spellMod : 0);
  return formatDice(count, spec.sides, bonus);
}


const tierOf = (actor: Combatant) =>
  1 + (actor.level >= 5 ? 1 : 0) + (actor.level >= 11 ? 1 : 0) + (actor.level >= 17 ? 1 : 0);

const SHAPE_NAME: Record<AreaShape, string> = {
  sphere: 'küre', cube: 'küp', cone: 'koni', line: 'çizgi', emanation: 'yayılım', wall: 'duvar',
};


/** Başarısız save'in süren etkisi (alan ve tek hedef yolları; Görev B3, Kuyruk 19). */
function failEffectEvent(state: BattleState, actor: Combatant, spell: Spell, fe: NonNullable<SpellMechanics['failEffect']>, ability: Ability, targetId: string, choice?: string): BattleEvent {
  // Kuyruk 19: Contagion: seçilen yetenek (seçim yoksa hedefin en zayıf save'i).
  const tgt = state.combatants[targetId];
  const abil = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as Ability[];
  const disAb = fe.saveDisChoice ? (abil.includes(choice as Ability) ? choice as Ability : abil.reduce((a, b) => ((tgt?.saves[b] ?? 0) < (tgt?.saves[a] ?? 0) ? b : a), 'str' as Ability)) : undefined;
  return { type: 'effect_added', targetId, effect: {
    ...(disAb ? { saveDis: [disAb] } : {}), ...(fe.stubborn ? { stubborn: { ability: 'con' as Ability, dc: actor.spellSaveDc ?? 0 } } : {}),
    id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + (fe.rounds ?? 10) - 1,
    ...(spell.concentration ? { concentration: spell.name } : {}), ...(fe.grants ? { grants: fe.grants } : {}),
    ...(fe.speedZero ? { speedZero: true } : {}), ...(fe.breakOnDamage ? { breakOnDamage: fe.breakOnDamage } : {}), ...(fe.charm ? { charm: true } : {}),
    ...(fe.command ? { command: fe.command[0] as CommandWord } : {}), ...(fe.commandPersist ? { commandPersist: true } : {}),
    ...(fe.fleeDash ? { fleeDash: true } : {}),
    // Kuyruk 19: tur sonu save'i başarısızsa yinelenen hasar (Phantasmal Killer).
    ...(fe.repeatSave ? { repeatSave: { ability, dc: actor.spellSaveDc ?? 0, ...(fe.repeatFailDamage ? { failDamage: fe.repeatFailDamage } : {}), ...(fe.repeatTally ? { tally: { need: fe.repeatTally, s: 0, f: 0, ...(fe.tallyFailGrants ? { failGrants: fe.tallyFailGrants } : {}) } } : {}) } } : {}),
    // Görev B4: Faerie Fire (görünmez olamaz, saldırılar avantajlı, ışık).
    ...(fe.revealed ? { revealed: true } : {}), ...(fe.attackedAdv ? { attackedAdv: true } : {}), ...(fe.light !== undefined ? { light: fe.light } : {}), ...(fe.lightDim ? { lightDim: fe.lightDim } : {}),
    // Kuyruk 19: gecikmeli hasar (Vitriolic Sphere), saldırı ve yetenek kontrolünde dezavantaj (Phantasmal Killer).
    ...(fe.delayed ? { delayed: fe.delayed } : {}), ...(fe.attackDis ? { attackDis: fe.attackDis } : {}), ...(fe.checkDis ? { checkDis: fe.checkDis } : {}),
    ...(fe.compel ? { compel: {} } : {}), ...(fe.confused ? { confused: true } : {}), ...(fe.noBonus ? { noBonus: true } : {}),
    ...(fe.noReactions ? { noReactions: true } : {}),
    // Kuyruk A4: tekrar save yalnızca kaynağı göremezken (Fear); büyücünün sonraki turunun sonunda biter (Color Spray).
    ...(fe.repeatSaveUnseen ? { repeatSaveUnseen: true } : {}), ...(fe.untilSourceTurnEnd ? { endAfterSourceTurn: state.round } : {}),
    // Kuyruk A6: veride olduğu gibi yazılan alanlar (sarsarak uyandırma, yer bilgisi…).
    ...(fe.raw ? rawEffect(fe.raw, actor, actor.spellSaveDc ?? 0) : {}),
  } };
}

/**
 * Alan büyüsü (haritalı savaş). Noktadan çıkan alanlarda nokta menzil içinde ve büyücünün
 * görüşünde olmalı; büyücüden çıkanlarda nokta yalnızca yön verir. Alandaki yaratıklar
 * (büyücü dahil, "yalnızca düşmanlar" seçilmediyse) etkilenir; çıkış noktasından tam siper
 * arkasında kalanlar etkilenmez. Siper ve görüş çıkış noktasından hesaplanır; DEX save'ine
 * siper eklenir. Hasar bütün hedefler için bir kez atılır (SRD 5.2.1 save'li etkiler).
 */
function executeAreaCast(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng, repeat = false, label?: string): CommandResult {
  const area = spell.area;
  const m = spell.mechanics;
  if (!area || !state.map || !actor.pos) return fail('Alan büyüsü yalnızca haritalı savaşta.');
  const named = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (cmd.targetId && !named) return fail('Hedef bulunamadı.');
  const aim = cmd.targetHex ?? named?.pos ?? null;
  // Alanın altıgenleri, nokta denetimi ve etkilenenler ortak seçicide (Görev R4: büyü, nefes, koni, çizgi aynı yol).
  // Kuyruk K65a (sürüm 49, `freeShape`): serbest şekil (Fire Storm): seçilen bitişik altıgenler (`targetHexes`; tek altıgen
  // seçildiyse `targetHex`); doğrulama ve etkilenenler `freeShape.ts`'te.
  const fs = m.freeShape;
  const pick0 = fs ? freeShapeArea(state, actor, spell, fs, cmd.targetHexes?.length ? cmd.targetHexes : aim ? [aim] : [])
    : pickArea(state, actor, area, spell.rangeFt, m.multiPoint && cmd.targetHexes?.length ? cmd.targetHexes[0] ?? aim : aim, 'büyü');
  if ('ok' in pick0) return pick0;
  // Kuyruk A8 (Meteor Swarm, `multiPoint`): birden çok merkez; altıgenler birleşir, her yaratık bir kez etkilenir.
  let pick = pick0;
  for (const at of m.multiPoint && !fs ? (cmd.targetHexes ?? []).slice(1, m.multiPoint) : []) {
    const p2 = pickArea(state, actor, area, spell.rangeFt, at, 'büyü');
    if ('ok' in p2) return p2;
    const seen = new Set(pick.reached.map((x) => x.c.id));
    const keys = new Set(pick.hexes.map((h) => `${h.col},${h.row}`));
    pick = { ...pick, hexes: [...pick.hexes, ...p2.hexes.filter((h) => !keys.has(`${h.col},${h.row}`))], reached: [...pick.reached, ...p2.reached.filter((x) => !seen.has(x.c.id))] };
  }
  // Görev WIZARD: Sculpt Spells (Evoker): Evocation alan büyüsünde 1 + büyü seviyesi kadar dost (büyücü dahil) etkilenmez.
  const sculpt = (spell.school === 'Evocation' && !!actor.traits?.includes('sculpt-spells') ? 1 + spell.level : 0)
    // Görev SORCERER: Careful Spell: CHA değiştiricisi kadar (en az 1) yaratık save'i otomatik geçer ve yarı hasar almaz.
    + (actor.traits?.includes('mm-careful') ? Math.max(1, actor.modifiers.cha) : 0);
  const spared = new Set(pick.reached.filter((x) => x.c.side === actor.side).slice(0, sculpt).map((x) => x.c.id));
  // Kuyruk S2 (sürüm 41): alanın ulaşmadığı irtifadaki yaratık etkilenmez.
  const reached = pick.reached.filter((x) => !spared.has(x.c.id) && (!spell.area || areaReachesAltitude(state, spell.area, x.c))).map((x) => ({ c: x.c, lof: { blocked: false, cover: x.cover } }));
  if (named && !reached.some((x) => x.c.id === named.id)) {
    return fail(`${named.name} alanın dışında veya tam siper arkasında.`);
  }

  const slot = repeat ? repeatSlot(actor, spell) : spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slot.slotLevel))];
  const where = area.origin === 'point' && aim ? `, merkez ${hexLabel(aim)}` : '';
  events.push({
    type: 'spell_cast', actorId: actor.id, targetId: null, label: label ?? (repeat ? `${spell.name} (tekrar)` : spell.name), slotLevel: slot.slotLevel,
    note: `Alan: ${fs ? `${pick.hexes.length} altıgen (serbest şekil)` : `${area.sizeFt} ft ${SHAPE_NAME[area.shape]}${where}`}; etkilenen: ${reached.map((x) => x.c.name).join(', ') || 'kimse'}.`,
    // Görev Y1: alanın altıgenleri ve hasar türü (yüzey tepkimeleri: tutuşma, buhar, donma, suda yıldırım).
    area: { hexes: pick.hexes, ...(m.damageType ? { damageType: m.damageType } : {}), dc: actor.spellSaveDc ?? 10,
      ...(m.damage ? { dice: m.damage } : {}), targetIds: reached.map((x) => x.c.id) },
  });
  // Kuyruk 19: Gust of Wind çizgisindeki gaz/buhar bulutlarını dağıtır (anahtar `gustDisperse`).
  if (m.disperses) events.push(...disperseEvents(applyEvents(state, events), pick.hexes));
  // Kuyruk 19: büyü süresince bonus eylemle yapılabilenler (Conjure Woodland Beings: Disengage; anahtar `spellsK19`).
  if (m.bonusGrant?.length && !repeat && globalRule(state, 'spellsK19')) {
    events.push({ type: 'effect_added', targetId: actor.id, effect: { id: `${spell.srd}:bonus`, name: spell.name, sourceId: actor.id,
      until: state.round + 99, ...(spell.concentration ? { concentration: spell.name } : {}), bonusGrant: m.bonusGrant } });
  }

  if (m.kind === 'sleep') {
    // Uyku: zar toplamı, HP'si en düşükten başlayarak yaratıkları uyutur.
    const roll = rollDice('5d8', rollTag(rng, { by: actor.id }));
    let pool = roll.total;
    events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: null,
      note: `Zar ${roll.rolls.join('+')} = ${roll.total}` });
    for (const { c } of [...reached].sort((a, b) => a.c.hp - b.c.hp)) {
      if (c.hp > pool) break;
      pool -= c.hp;
      if (!c.conditions.includes('Unconscious')) {
        events.push({ type: 'condition_changed', targetId: c.id, condition: 'Unconscious', present: true, reason: spell.name, sourceId: actor.id });
      }
    }
    return finish(state, events);
  }

  const ability = m.save;
  if (!ability) return fail('Bu büyünün save türü tanımlı değil.');
  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${spell.name} ${spell.text}`.toLowerCase();
  const reasons = environmentSources(env, tag);
  const mode = invertMode(combineModes(reasons));
  const upcast = (slot.slotLevel ?? spell.level) - spell.level;
  // Kuyruk 19: iki hasar türü (`split`; anahtar `spellsK19`): ana parça `damage`'ın yerine, ikinci parça ayrıca.
  const split = m.split && m.split.length === 2 && globalRule(state, 'spellsK19') ? m.split : null;
  const partExpr = (p: { dice: string; type: string; upcast?: string }) => damageExpr({ ...m, damage: p.dice, damageType: p.type, upcast: p.upcast ? { dice: p.upcast, applied: true } : undefined }, actor, tierOf(actor), upcast, spell.school, spell.name);
  const damageType = split ? split[0]!.type : m.damageType;
  const damage = split ? spellDamageRoll(partExpr(split[0]!), actor, rng)
    : m.damage ? spellDamageRoll(damageExpr(m, actor, tierOf(actor), upcast, spell.school, spell.name), actor, rng) : { rolls: [] as number[], total: 0 };
  const second = split ? { type: split[1]!.type, ...spellDamageRoll(partExpr(split[1]!), actor, rng) } : null;
  // Yayılım (Spirit Guardians): yapılınca içindekilere girer; yaratık turda bir kez save yapar.
  const aura = m.lingering === 'aura' ? { aura: { casterId: actor.id, turn: turnKey(state) } } : {};
  let current = applyEvents(state, events);
  for (const { c, lof } of reached) {
    const t = current.combatants[c.id];
    if (!t) continue;
    const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(t.conditions);
    const dexCover = ability === 'dex' ? lof.cover : 0;
    // Görev SORCERER: Heightened Spell: alandaki ilk düşmanın save'i dezavantajlı.
    const height = actor.traits?.includes('mm-heightened') && t.id === reached.find((x) => x.c.side !== actor.side)?.c.id;
    // Kuyruk A6 (Sleep, `sleeplessPass`): uyumayan yaratık (Elf Trance) ya da Exhaustion'a bağışık olan save'i kendiliğinden başarır.
    const sleepless = !!m.sleeplessPass && (t.raceId === 'elf' || (t.effects ?? []).some((e) => e.immune?.includes('Exhaustion')));
    // Kuyruk K63 (sürüm 47, `illusion`): Truesight'lı hedef görsel yanılsamaya karşı save'i otomatik geçer.
    const sleepOrSee = sleepless || !!m.illusion && truesightSees(state, t, actor);
    const save = sleepOrSee ? { d20: null, total: null, success: true } as ReturnType<typeof resolveSave>
      : resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0, mode: height ? 'disadvantage' : saveMode(mode, t, ability, actor), autoFail, against: [...(m.conditions ?? []), ...(m.failEffect?.grants ?? []), 'spell'] }, rollTag(rng, { by: t.id }));
    const amount = saveDamage(t, ability, save.success, damage.total, !!m.halfOnSave || potentCantrip(actor, spell));
    const adjusted = amount > 0 ? adjustDamage(amount, damageType, profileIn(state, t, true)) : { amount: 0, note: null };
    const amount2 = second ? saveDamage(t, ability, save.success, second.total, !!m.halfOnSave) : 0;
    const adjusted2 = second && amount2 > 0 ? adjustDamage(amount2, second.type, profileIn(state, t, true)) : { amount: 0, note: null };
    const fx = damageEffects(t, adjusted.amount + adjusted2.amount, damageType ?? '', false, rng);
    // Görev B3: başarısızlıkta süren etki varsa durumlar etkiyle gelir (Fear, Hypnotic Pattern).
    // Kuyruk 19: yeni eklenen başarısızlık etkisi anahtara bağlı (`failEffectGate`; Vitriolic Sphere'in gecikmeli asidi).
    const fe = m.failEffect && (!m.failEffectGate || globalRule(state, m.failEffectGate)) ? m.failEffect : undefined;
    const added = !save.success && !fe?.grants ? (m.conditions ?? []).filter((x) => !t.conditions.includes(x)) : [];
    const ev: BattleEvent = {
      type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name,
      ability, dc: actor.spellSaveDc ?? 0, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: damage.rolls, rawDamage: damage.total, appliedDamage: adjusted.amount + adjusted2.amount, damageType: damageType ?? '',
      damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: added,
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
      ...(second ? { secondary: { type: second.type, rolls: second.rolls, raw: second.total, applied: adjusted2.amount, note: adjusted2.note } } : {}),
      ...aura, ...(save.extra ? { bonusDice: save.extra } : {}),
    };
    events.push(ev);
    current = applyEvents(current, [ev]);
    const timed = spellTimerEvents(current, spell.name, t.id, added, ability, actor.spellSaveDc ?? 0);
    events.push(...timed);
    current = applyEvents(current, timed);
    if (fe && !save.success && fx.hpAfter > 0) {
      const add = failEffectEvent(state, actor, spell, fe, ability, t.id);
      events.push(add);
      current = applyEvents(current, [add]);
      // Kuyruk G6 (sürüm 43): Fear: korkan yaratık elindekini düşürür (el modeli).
      if (fe.dropHeld) current = pushDrops(current, events, t.id, spell.name);
    }
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (adjusted.amount + adjusted2.amount > 0) {
      const back = damagedReactions(current, t.id, actor.id, rng);
      events.push(...back);
      current = applyEvents(current, back);
    }
    // Başarısız save'de büyücüden uzağa itme (Thunderwave 10 ft): ortak zorunlu hareket.
    if (!save.success && m.pushFt && actor.pos) {
      const pushed = pushAwayEvents(current, actor.pos, t.id, m.pushFt, actor.id, rng);
      events.push(...pushed);
      current = applyEvents(current, pushed);
    }
  }
  // Kuyruk 19: büyüden sonra alanda kalan zemin (Ice Storm: büyücünün sonraki turunun sonuna dek zorlu arazi).
  if (m.aftermath && globalRule(state, 'spellsK19')) {
    events.push({ type: 'zone_created', zone: {
      id: newZoneId(current, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
      dc: actor.spellSaveDc ?? 10, slotLevel: slot.slotLevel ?? spell.level, hexes: pick.hexes,
      ...(m.aftermath.rounds !== undefined ? { until: state.round + m.aftermath.rounds - 1 } : {}),
    } });
  }
  return finish(state, events);
}

/**
 * Haritasız savaşta yayılım (Spirit Guardians): büyücüyle aynı yükseklikteki düşmanlar
 * yayılımın içinde sayılır.
 */
function executeMaplessAura(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel)];
  const inside = Object.values(state.combatants).filter((c) => c.side !== actor.side && isTargetable(c) && c.hp > 0 && c.height === actor.height);
  events.push({
    type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel,
    note: `Yayılım (aynı yükseklik): ${inside.map((c) => c.name).join(', ') || 'kimse'}.`,
  });
  let current = applyEvents(state, events);
  for (const v of inside) {
    const ev = auraSave(current, current.combatants[actor.id] as Combatant, current.combatants[v.id] as Combatant, rng);
    if (!ev) continue;
    events.push(ev);
    current = applyEvents(current, [ev]);
  }
  return finish(state, events);
}

/**
 * Büyü yapma. Counterspell (Görev R1): büyüyü görebilen bir düşmanın tepkisi varsa önce büyü zarsız denenir
 * (geçersiz komut boşa durdurulmasın), sonra tepki sorulur; durdurulursa eylem harcanır, slot harcanmaz.
 */
export function executeCast(state: BattleState, actor0: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  // Kuyruk 19 (görev 3): 6.–9. seviye büyüler (anahtar spells69; Antimagic Field içinde büyü yok) ve Wish.
  const sp0 = spells.find((x) => x.name === cmd.spellName);
  const bad69 = sp0 ? spells69Problem(state, actor0, sp0) : null;
  if (bad69) return fail(bad69);
  if (sp0 && (sp0.mechanics as { wish?: boolean }).wish && globalRule(state, 'spells69')) {
    const w = wishSpell(cmd.choice);
    if (!w) return fail(wishProblem(cmd.choice) as string);
    // Wish: seçilen büyü bileşensiz, kendi seviyesinde; 9. seviye slot harcanır.
    const slot = spendSlot(actor0, 9, cmd.slotLevel, 'Wish', cmd.free);
    if (!slot.ok) return slot;
    const caster = { ...actor0, spellNames: [...new Set([...actor0.spellNames, w.name])], atWill: { ...(actor0.atWill ?? {}), [w.name]: 'any' as const }, castLevels: { ...(actor0.castLevels ?? {}), [w.name]: w.level } };
    const st = { ...state, combatants: { ...state.combatants, [actor0.id]: caster } };
    const r = executeCastOver(st, caster, { ...cmd, spellName: w.name, choice: undefined, slotLevel: undefined }, rng);
    if (!r.ok) return r;
    return finish(state, [...slot.events, { type: 'spell_cast', actorId: actor0.id, targetId: null, label: 'Wish', slotLevel: 9, note: `Wish → ${w.name}` }, ...r.events]);
  }
  // Kuyruk 19 (SRD sihirli eşyalar): yüklü eşyadan (değnek, asa) yapılan büyü eşyanın DC'si ve saldırı bonusuyla.
  const res = actor0.freeSpells?.[cmd.spellName];
  const ic = res?.startsWith('item:') && cmd.slotLevel === undefined && (actor0.resources[res] ?? 0) > 0 ? actor0.itemCasts?.[res] : undefined;
  const actor00 = ic ? { ...actor0, ...(ic.dc !== undefined ? { spellSaveDc: ic.dc } : {}), ...(ic.attack !== undefined ? { spellAttack: ic.attack } : {}) } : actor0;
  const r0 = executeCastOver(state, actor00, cmd, rng);
  if (!r0.ok) return r0;
  // Kuyruk 19 (görev 3): 6.–9. seviye büyü kancaları (Power Word, Mass Heal, Chain Lightning, Globe…).
  const ev69 = sp0 ? after69(state, r0.state, actor00, sp0, r0.events, { ...(cmd.targetId ? { id: cmd.targetId } : {}), ...(cmd.targetHex ? { hex: cmd.targetHex } : {}), ...(cmd.choice ? { choice: cmd.choice } : {}) }, rng) : null;
  const r1 = ev69 ? finish(state, ev69) : r0;
  if (!r1.ok) return r1;
  // Kuyruk 19 (Thief 13 Use Magic Device; featuresK19): şarjlı eşyadan büyüde 1d6 = 6 ise şarj harcanmaz.
  const charge = actor00.traits?.includes('use-magic-device') && globalRule(state, 'featuresK19')
    ? r1.events.findIndex((e) => e.type === 'feature_used' && e.feature.startsWith('item:')) : -1;
  const r = charge >= 0 && rollDie(6, rollTag(rng, { by: actor00.id })) === 6
    ? finish(state, [...r1.events.map((e, i) => (i === charge && e.type === 'feature_used' ? { ...e, remaining: e.remaining + 1 } : e)), { type: 'map_note', text: `${actor00.name}: Use Magic Device — şarj harcanmadı.` }])
    : r1;
  if (!r.ok) return r;
  // Kuyruk 19 (Spell Recall): Free Casting: 1–4. seviye slot 1d4 tutarsa geri gelir.
  const extra = [...potentTempHpEvents(r.state, actor00.id, cmd.spellName),
    ...freeCastingEvents(r.state, actor00.id, r.events, () => rollDice('1d4', rollTag(rng, { by: actor00.id })).total)];
  return extra.length ? finish(state, [...r.events, ...extra]) : r;
}

/**
 * Kuyruk 19 (11–20): Improved Blessed Strikes (Cleric 14, Potent Spellcasting seçildiyse): hasar veren cantrip'ten
 * sonra kendine ya da 60 ft içindeki bir dosta 2 × WIS geçici HP (en çok yaralı, geçici HP'si daha az olan; `featuresK19`).
 */
function potentTempHpEvents(state: BattleState, actorId: string, spellName: string): BattleEvent[] {
  const a = state.combatants[actorId];
  const spell = spells.find((x) => x.name === spellName);
  if (!a || !spell || spell.level !== 0 || !spell.mechanics.damage || !globalRule(state, 'featuresK19')) return [];
  if (!a.traits?.includes('potent-spellcasting') || !a.traits.includes('improved-blessed-strikes')) return [];
  const amount = 2 * Math.max(0, a.modifiers.wis);
  if (amount <= 0) return [];
  const near = Object.values(state.combatants).filter((c) => c.side === a.side && c.hp > 0 && !c.civilian && !c.summon?.intangible && (c.tempHp ?? 0) < amount
    && (c.id === a.id || !state.map || (!!c.pos && !!a.pos && distance(c.pos, a.pos) <= 12)));
  const t = near.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  return t ? [{ type: 'temp_hp', targetId: t.id, amount, label: 'Potent Spellcasting' }] : [];
}

function executeCastOver(state: BattleState, actor00: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  // Kuyruk 19 (11–20): Overchannel (Evoker 14): hasar zarları en yüksek; ikinci kullanımdan sonra nekrotik bedel.
  if (!cmd.overchannel) return executeCastPlain(state, actor00, cmd, rng);
  const spell = spells.find((x) => x.name === cmd.spellName);
  if (!spell) return fail('Büyü bulunamadı.');
  const slotLevel = cmd.slotLevel ?? spell.level;
  const why = overchannelProblem(state, actor00, spell, slotLevel, cmd.free);
  if (why) return fail(why);
  const r = executeCastPlain(state, actor00, cmd, overchannelRng(rng, actor00.id));
  if (!r.ok) return r;
  const me = r.state.combatants[actor00.id] as Combatant;
  return finish(state, [...r.events, ...overchannelAfter(r.state, me, slotLevel, rng)]);
}

/** Kuyruk P11: saklı büyüyü ateşle (`spell_followup` `choice: 'sakli'`). */
export const executeFireStored = (state: BattleState, actor: Combatant, cmd: { targetId?: string; targetHex?: Offset }, rng: Rng): CommandResult =>
  fireStored(state, actor, cmd, (s, a, c) => withLifeBond(s, c, executeCastAt(s, a, c, rng)));

function executeCastPlain(state: BattleState, actor00: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  // Kuyruk P11: paket yapım genişletmeleri (saklama, çalınan/kopya büyü, yalnız kendine, konsantrasyonsuz, çağrıdan çıkış).
  const pk = paketCast(state, actor00, cmd, (s, a, c) => withLifeBond(s, c, executeCastAt(s, a, c, rng)));
  if (pk) return pk;
  const r = withLifeBond(state, cmd, executeCastAt(state, actor00, cmd, rng));
  // Kuyruk 19: Gaze of Two Minds: kendi yerinden olmuyorsa bağlı dostun yerinden (60 ft içindeyse).
  const gp = !r.ok && actor00.pos ? gazePos(state, actor00) : null;
  if (!gp) return r;
  const alt = executeCastAt({ ...state, combatants: { ...state.combatants, [actor00.id]: { ...actor00, pos: gp } } }, { ...actor00, pos: gp }, cmd, rng);
  if (!alt.ok) return r;
  // Durumda büyücü yine kendi yerinde (olaylar konum değiştirmez; baştan oynatma aynı).
  return finish(state, alt.events);
}

/** Kuyruk 19: başka bir büyünün hedefi olan yaratıkta "büyüyle biten" etki (Modify Memory) biter. */
function breakOnSpellEvents(after: BattleState, cmd: CastCommand): BattleEvent[] {
  const sp = spells.find((s) => s.name === cmd.spellName);
  const own = new Set([sp?.id, sp?.srd].filter(Boolean));
  const ids = [cmd.targetId, ...(cmd.targetIds ?? [])].filter((x): x is string => !!x);
  const out: BattleEvent[] = [];
  for (const id of ids) {
    for (const e of after.combatants[id]?.effects ?? []) {
      if (e.breakOnSpell && !own.has(e.id)) out.push({ type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'dispelled' });
    }
  }
  return out;
}

/** Kuyruk 19: Find Steed atının Life Bond'u (sahibe büyüyle gelen iyileşme ata da). */
function withLifeBond(state: BattleState, cmd: CastCommand, r: CommandResult): CommandResult {
  if (!r.ok) return r;
  const extra = [...lifeBondEvents(r.state, r.events, spells.find((s) => s.name === cmd.spellName)?.level ?? 0), ...breakOnSpellEvents(r.state, cmd)];
  return extra.length ? finish(state, [...r.events, ...extra]) : r;
}

function executeCastAt(state: BattleState, actor00: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  let spell0 = spells.find((s) => s.name === cmd.spellName);
  if (!spell0) return fail(`Büyü bulunamadı: ${cmd.spellName}`);
  // F1: büyüye özgü zorluk sınıfı/saldırı (Magic Initiate'in seçilen yeteneği) bu yapım için.
  const own = actor00.spellStats?.[spell0.name];
  const actor0 = own ? { ...actor00, spellSaveDc: own.dc, spellAttack: own.attack } : actor00;
  if (!actor0.spellNames.includes(spell0.name)) return fail('Bu büyüyü bilmiyor.');
  // Görev DRUID: Wild Shape biçiminde büyü yapılamaz (Beast Spells hariç; süren konsantrasyon bozulmaz).
  if (actor0.shape && !actor0.traits?.includes('beast-spells')) return fail('Wild Shape biçiminde büyü yapılamaz.');
  // Görev WARLOCK: yalnızca kendine slotsuz büyü (Armor of Shadows, Fiendish Vigor…): yukarı slot seçilmediyse.
  if (actor0.atWill?.[spell0.name] === 'self' && cmd.slotLevel === undefined && spell0.level > 0) {
    const ts = [...(cmd.targetIds ?? []), ...(cmd.targetId ? [cmd.targetId] : [])];
    if (ts.some((x) => x !== actor0.id)) return fail(`${spell0.name} slotsuz yalnızca kendine.`);
    // Kuyruk 19: One with Shadows (SRD 5.2.1): loş ışıkta ya da karanlıkta. Işıksız altıgen kavramı olmayan (gündüz)
    // haritada her yer aydınlık sayılır. Anahtar `oneWithShadows` (sürüm 16).
    if (actor0.traits?.includes('one-with-shadows') && spell0.name === 'Invisibility' && globalRule(state, 'oneWithShadows') && actor0.pos
      && !inShadowAt(state, actor0.pos)) return fail('One with Shadows: yalnızca loş ışıkta ya da karanlıkta (ışıksız altıgende).');
  }
  // Görev WARLOCK: Eldritch Spear (cantrip menzili).
  const reach = actor0.cantripMods?.[spell0.name]?.rangeFt;
  if (reach && spell0.level === 0) spell0 = { ...spell0, rangeFt: spell0.rangeFt + reach };
  // Görev P6: ek paket büyü dönüşümü (menzil eki, hasar türü).
  if (actor0.paket) spell0 = paketSpellTransform(actor0, spell0);
  // Görev SORCERER: Metamagic ve Innate Sorcery bu yapım için büyüyü ve büyücüyü dönüştürür; puan olayı başta.
  const mm = castWithMetamagic(state, actor0, spell0, cmd.metamagic, cmd.transmute);
  if ('ok' in mm) return mm;
  if (mm.events.length) {
    const s1 = applyEvents(state, mm.events);
    const a1 = { ...mm.actor, resources: (s1.combatants[actor0.id] as Combatant).resources };
    const r = executeCastWith(s1, a1, cmd, mm.spell, rng);
    return r.ok ? { ok: true, state: r.state, events: [...mm.events, ...r.events] } : r;
  }
  return executeCastWith(state, mm.actor, cmd, mm.spell, rng);
}

function executeCastWith(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  // Subtle Spell: bileşensiz büyü görülmez; Counterspell tetiklenmez.
  const watched = !cmd.metamagic?.includes('subtle') && Object.values(state.combatants).some((c) => c.side !== actor.side && c.reactions?.some((r) => r.kind === 'counterspell'))
    // Kuyruk P9: ek paket tepkisi `dusmanBuyuAtiyor` (büyü yapılırken kancası `registerCastHook`).
    || (!cmd.metamagic?.includes('subtle') && Object.values(state.combatants).some((c) => c.side !== actor.side && c.paket?.ozellikler.some((f) => f.ilkeller.some((p) => p.tur === 'tepki' && p.olay === 'dusmanBuyuAtiyor'))));
  if (!watched) return castSpell(state, actor, cmd, spell, rng);
  const dry = castSpell(state, actor, cmd, spell, () => 0.5);
  if (!dry.ok) return dry;
  const counter = counterspellCheck(state, actor, spell.name, spell.level, rng);
  if (counter.countered) {
    return finish(state, [...counter.events, { type: 'spell_cast', actorId: actor.id, targetId: cmd.targetId ?? null, label: spell.name, slotLevel: null,
      note: 'Counterspell ile durduruldu: büyü boşa gitti, slot harcanmadı.' }]);
  }
  const before = applyEvents(state, counter.events);
  const r = castSpell(before, before.combatants[actor.id] as Combatant, cmd, spell, rng);
  return r.ok ? { ok: true, state: r.state, events: [...counter.events, ...r.events] } : r;
}

/** Görev B1: süreli tekrarda slot harcanmaz; konsantrasyonun slot seviyesi geçerli. */
const repeatSlot = (actor: Combatant, spell: Spell) =>
  ({ ok: true as const, slotLevel: spell.level === 0 ? null : actor.concentration?.slotLevel ?? spell.level, events: [] as BattleEvent[] });

/** Görev B1: zar ifadesinin en yüksek değeri (Beacon of Hope: iyileştirme en yüksek). */
function diceMax(expr: string): number {
  const d = parseDice(expr);
  return d.count * d.sides + d.bonus;
}

/** İyileştirme zarı: hedefte Beacon of Hope varsa zar atılmaz, en yüksek değer (Görev B1). */
function healAmount(expr: string, actor: Combatant, target: Combatant, rng: Rng, state?: BattleState, info?: { events: BattleEvent[]; rolls?: number[]; changed?: string }): number {
  if (target.effects?.some((e) => e.maxHeal)) return diceMax(expr);
  // Kuyruk P11: paket iyileştirme zarı (`zarDegistir.kapsam: iyilestirme`; Supreme Healing'den önce değil: en yüksek değer zaten en iyisi).
  if (info && !/supreme-healing/.test((actor.traits ?? []).join(' '))) {
    const r = paketHealRoll(state, actor, expr, rng, info.events);
    if (r) { info.rolls = r.rolls; if (r.changed) info.changed = r.changed; return r.total; }
  }
  // Görev CLERIC: Supreme Healing (en yüksek değer) `healDice`'ta.
  return healDice(actor, expr, rng);
}

/** Kuyruk G6: yaratığın elindeki bütün silahları düşürür (olaylar sırayla uygulanır: yerdeki nesne kimlikleri çakışmaz). */
function pushDrops(state: BattleState, events: BattleEvent[], targetId: string, spellName: string): BattleState {
  let st = state;
  const t = st.combatants[targetId];
  if (!t || !handsOn(st)) return st;
  for (const id of heldWeapons(t)) {
    const evs = dropEvents(st, st.combatants[targetId] as Combatant, id, `${spellName}: korkuyla bıraktı`, true);
    events.push(...evs);
    st = applyEvents(st, evs);
  }
  return st;
}

/** Sonraki tamamlama blokları ve kural sürümleri (sırayla birleşir). */
const LATER = [['a6', 35], ['a7', 36], ['a8', 37], ['s1', 40], ['s2', 41], ['g6', 43], ['k61', 44], ['k62', 46], ['k63', 47], ['k64', 48], ['k65', 49], ['k66', 50], ['k67', 51]] as const;

function castSpell(state: BattleState, actor: Combatant, cmd: CastCommand, spell0: Spell, rng: Rng, repeat = false): CommandResult {
  // Kuyruk 19: tam SRD hâli (`upgrade`; anahtar `spellsK19`): eski sürümde eski mekanik.
  const spell = spell0.mechanics.upgrade && globalRule(state, 'spellsK19')
    ? { ...spell0, mechanics: { ...spell0.mechanics, ...spell0.mechanics.upgrade, upgrade: undefined } } : spell0;
  // Kuyruk A4 (kural sürümü 32): kısmi büyülerin tamamlanmış hâli (`a4`); eski sürümde eski mekanik.
  if (spell.mechanics.a4 && ruleVersion(state) >= 32) return castSpell(state, actor, cmd, { ...spell, mechanics: { ...spell.mechanics, ...spell.mechanics.a4, a4: undefined } }, rng, repeat);
  // Kuyruk A6 (kural sürümü 35): küçük kısmi büyülerin tamamlanmış hâli (`a6`).
  // SRD'nin oyuna sığmayan parçası yapınca günlüğe Game Master notu olarak (`sigmayan`; harita/belgeler/BUYU-SIGMAYAN.md).
  // Kuyruk A7/A8 (sürüm 36/37): aynı biçimde sonraki tamamlamalar (`a7`, `a8`), sırayla.
  // Kuyruk S1 (sürüm 40): sığmayan parçaların kapatılması (`s1`).
  const later = LATER.find(([k, v]) => spell.mechanics[k] && ruleVersion(state) >= v)?.[0];
  if (later) {
    const merged = { ...spell, mechanics: { ...spell.mechanics, ...spell.mechanics[later], [later]: undefined } };
    const r = castSpell(state, actor, cmd, merged, rng, repeat);
    if (!r.ok) return r;
    // Son blokta bir kez: kalıcı alan ve sığmayan parça ya da savaş dışı parçanın Game Master notu (`gmNoted`).
    const done = !LATER.some(([k, v]) => merged.mechanics[k] && ruleVersion(state) >= v);
    const extra: BattleEvent[] = done ? [...lingerZoneEvents(r.state, actor, merged, r.events), ...areaObjectEvents(r.state, actor, merged, r.events),
      // Kuyruk S2: Levitate yükselmesi, Phantasmal Force yanılsama alanı.
      ...(merged.mechanics.effect?.levitate ? levitateRiseEvents(r.state, r.events, cmd.altitudeFt) : []),
      ...(merged.mechanics.illusionAt ? illusionEvents(r.state, actor, merged, cmd, r.events) : []),
      // Kuyruk K66b (sürüm 50): Earthquake dökümde alandaki yapılara 50 Bludgeoning (çöküş, enkaz).
      ...(merged.mechanics.zone?.structures ? quakeCastEvents(r.state, r.events, rng) : [])] : [];
    const note = merged.mechanics.sigmayan ?? (merged.mechanics.gmNoted && !merged.mechanics.offCombat ? merged.mechanics.gmNote : undefined);
    if (done && note && !repeat) extra.push({ type: 'map_note', text: `Game Master notu — ${spell.name}: ${note}` });
    return extra.length ? finish(state, [...r.events, ...extra]) : r;
  }
  // Kuyruk A8 (sürüm 37, Slow): yavaşlatılmış büyücünün somatik (S) bileşenli büyüsü %25 (d4 = 1) başarısız; slot harcanır.
  if (!repeat && ruleVersion(state) >= 37 && actor.effects?.some((e) => e.slowed) && somaticOf(spell)) {
    const d = rollDie(4, rollTag(rng, { by: actor.id, kind: 'check' }));
    if (d === 1) {
      const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
      if (!slot.ok) return slot;
      return finish(state, [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: 'Slow: el hareketleri yetişmedi, büyü başarısız (d4 = 1)' }]);
    }
  }
  // Kuyruk A6 (Call Lightning, `stormBonus`): fırtınalı haritada (açık hava) büyü fırtınayı yönetir, hasar +zar.
  if (spell.mechanics.stormBonus && spell.mechanics.damage && ruleOf(state, 'storm')) {
    const d0 = parseDice(spell.mechanics.damage);
    const b = parseDice(spell.mechanics.stormBonus);
    return castSpell(state, actor, cmd, { ...spell, mechanics: { ...spell.mechanics, stormBonus: undefined, damage: formatDice(d0.count + b.count, d0.sides, d0.bonus) } }, rng, repeat);
  }
  // Görev B4: seçilebilen hasar türü (Sorcerous Burst).
  // CILA: seçilebilen durum (Blindness/Deafness: Blinded ya da Deafened).
  const cc = spell.mechanics.conditionChoices;
  if (cc && cmd.choice && cc.includes(cmd.choice) && spell.mechanics.conditions?.[0] !== cmd.choice) {
    return castSpell(state, actor, cmd, { ...spell, mechanics: { ...spell.mechanics, conditions: [cmd.choice] } }, rng, repeat);
  }
  const dc0 = spell.mechanics.damageChoices;
  if (dc0 && cmd.choice && dc0.includes(cmd.choice) && cmd.choice !== spell.mechanics.damageType) {
    return castSpell(state, actor, cmd, { ...spell, mechanics: { ...spell.mechanics, damageType: cmd.choice } }, rng, repeat);
  }
  const m = spell.mechanics;
  const barrier = castBarrier(state, actor, spell);
  if (barrier) return fail(barrier);
  // Kuyruk S1 (sürüm 40, Plane Shift `retreat`): büyücü ve el ele (zincirle bitişik) istekli dostlar haritadan ayrılır.
  if (m.retreat) return executeRetreat(state, actor, cmd, spell);
  // Kuyruk S2 (sürüm 41): taşınmayan nesneye Enlarge/Reduce ve Levitate (altıgen hedef, yaratık yok).
  if (m.resizeObjects && cmd.targetHex && !cmd.targetId && !cmd.targetIds?.length && !repeat) return executeResizeObject(state, actor, cmd, spell);
  if (m.levitateObject && cmd.targetHex && !cmd.targetId && !cmd.targetIds?.length && !repeat) return executeLevitateObject(state, actor, cmd, spell);
  // Kuyruk 40: yeni sistem gerektiren / karar bekleyen büyü ("çalışmıyor"): slot harcanmaz.
  if (m.unsupported) return fail(`${spell.name} savaşta çalışmıyor: ${m.unsupported}`);
  // Görev B2: kalıcı zemin etkisi ve geçici engel (çağırmayla yürüyen alanlar `executeSummon`'da).
  // Kuyruk 19: Telekinesis (yön, havaya kaldırma, nesne).
  if (telekinesisOn(state, spell)) return executeTelekinesis(state, actor, spell, { targetId: cmd.targetId, dest: cmd.targetHex, lift: cmd.choice === 'lift', slotLevel: cmd.slotLevel, free: cmd.free }, rng, repeat);
  // Kuyruk 19: harita dönüştüren büyü (Control Water'ın girdabı da alan yaratır, kendi yolundan).
  if (m.terraform && !repeat) return executeTerraform(state, actor, cmd, spell);
  if (m.zone && m.kind !== 'summon') return executeZoneCast(state, actor, cmd, spell, rng, repeat);
  if (m.calm) return executeCalm(state, actor, cmd, spell, rng);
  if (m.castOnly && !repeat) return executeCastOnly(state, actor, cmd, spell);
  if (m.weaponStrike) return executeTrueStrike(state, actor, cmd, spell, rng);
  if (m.kind === 'heal' && m.healTargets && cmd.targetIds) return executeHealMany(state, actor, cmd, spell, rng);
  if (m.kind === 'smite') return executeSmite(state, actor, cmd, spell, rng);
  if (m.kind === 'buff') return executeBuff(state, actor, cmd, spell, rng);
  // Kuyruk A7 (Light, Continual Flame; `objectLight`): haritadaki bir nesneye (taşınmayan ya da büyücünün taşıdığı).
  if (m.objectLight !== undefined && cmd.targetHex && !cmd.targetId && state.map) return executeObjectLight(state, actor, cmd, spell);
  if (m.kind === 'effect' && m.objectLight !== undefined && !m.objectLightKeep) {
    const r = executeEffect(state, actor, cmd, spell, rng);
    return r.ok ? finish(state, [...r.events, ...objectLightEnd(state, actor, spell)]) : r;
  }
  if (m.kind === 'effect') return executeEffect(state, actor, cmd, spell, rng);
  if (m.kind === 'summon') return executeSummon(state, actor, cmd, spell, rng);
  if (m.kind === 'teleport') return executeTeleport(state, actor, cmd, spell, rng);
  if (m.kind === 'cure' || m.kind === 'revive') return executeRestore(state, actor, cmd, spell, rng);
  if (m.kind === 'dispel') return executeDispel(state, actor, cmd, spell, rng);
  if (m.terraform) return executeTerraform(state, actor, cmd, spell);
  if (m.kind !== 'utility' && m.kind !== 'sleep' && !m.damage && !m.conditions && !m.pushFt && !m.failEffect) {
    return fail('Bu büyünün mekaniği tanımlı değil.');
  }

  // Haritalı savaşta alan büyüleri (save ve uyku) alandaki herkesi etkiler.
  if (state.map && spell.area && (m.kind === 'save' || m.kind === 'sleep')) {
    return executeAreaCast(state, actor, cmd, spell, rng, repeat);
  }
  if (!state.map && m.lingering === 'aura') return executeMaplessAura(state, actor, cmd, spell, rng);

  // Görev WIZARD: yukarı slotta ek hedefli tek hedef save büyüleri (Hold Person, Blindness/Deafness): yuva bir kez,
  // her hedef ayrı save. Hedefler birbirine 30 ft içinde (SRD) denetlenmez; her biri menzilde olmalı.
  // Kuyruk P12 (paket `buyuDegisimi.ikizOkul`, sürüm 43+): okulun tek hedefli büyüsü ikinci hedefe (aynı yol).
  if (m.kind === 'save' && !repeat && !spell.area && cmd.targetIds && cmd.targetIds.length > 1 && ((m.upcast?.applied && m.upcast.targets) || schoolTwin(actor, spell))) {
    return executeSaveMany(state, actor, cmd, spell, rng);
  }
  // Kuyruk 24c: yanıcı haneye ateşli büyü (gres, yağ, ağ, yanıcı nesne; Game Master mekaniği `greaseFlammable`).
  // Kuyruk A6: elde tutulan alev (Produce Flame) yanıcı altıgene de fırlatılır ("a creature or an object").
  if (!cmd.targetId && cmd.targetHex && state.map && (!repeat || m.held) && fireHexSpell(spell)) return executeFireHex(state, actor, cmd, spell, rng);
  let target: Combatant | undefined;
  if (m.kind !== 'utility') {
    if (!cmd.targetId) return fail('Hedef seçmelisin.');
    target = state.combatants[cmd.targetId];
    if (!target) return fail('Hedef bulunamadı.');
    if (!isTargetable(target)) return fail('Hedef ayakta değil.');
    if (m.kind !== 'heal' && target.id === actor.id) return fail('Kendini hedefleyemezsin.');
  }

  // Dokunma menzilli (5 ft) büyü saldırısı yakın dövüş, diğerleri menzilli saldırıdır.
  // Spiritual Weapon'ın gücü hedefin yanında belirir: yakın dövüş büyü saldırısı.
  const rangedSpell = spell.rangeFt > 5 && m.lingering !== 'weapon';
  // Menzil (haritalı savaş): menzilli büyü saldırısı yanında düşman varken dezavantajlı.
  let rangeSources: ModeSource[] = [];
  let cover: Cover = 0;
  if (target && target.id !== actor.id) {
    // A1: menzili "Self" olan ama bir yaratığı hedefleyen büyü (Eyebite) `targetFt` ile.
    if (spell.rangeFt === 0 && !m.targetFt) return fail(`${spell.name} yalnızca büyücüyü etkiler.`);
    const r = checkReach(state, actor, target, spellReach(m.targetFt ? { ...spell, rangeFt: m.targetFt } : spell, actor));
    if (!r.ok) return r;
    rangeSources = r.sources;
    cover = r.cover;
  }

  // Kuyruk S2 (Heat Metal): yalnız metal silah tutan ya da metal zırh giyen hedef (silahı bırakınca tekrar da tutmaz).
  if (m.metalDrop && target && !touchesMetal(target)) return fail(`${target.name} metal bir nesne tutmuyor ya da giymiyor.`);
  const slot = repeat ? repeatSlot(actor, spell) : spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const slotLevel = slot.slotLevel;
  const upcast = (slotLevel ?? spell.level) - spell.level;
  // Görev B1: aynı hedefe tekrarlanan büyü (Heat Metal) hedefi konsantrasyonda tutar.
  const linger = (m.kind === 'mark' || m.repeat?.target === 'same') && target ? { targetId: target.id }
    : m.lingering === 'weapon' && target ? (() => { const pos = weaponHexNear(state, target, actor.pos); return pos ? { pos } : {}; })()
      : {};
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slotLevel, linger))];

  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${spell.name} ${spell.text}`.toLowerCase();
  const tier = tierOf(actor);

  if (m.kind === 'utility' || !target) {
    events.push({
      type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel,
      note: m.offCombat ? `Savaş dışı, Game Master'a not: ${m.gmNote ?? spell.text}` : `Etki elle uygulanır: ${spell.text}`,
    });
    return finish(state, events);
  }

  if (m.kind === 'mark') {
    events.push({
      type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel,
      note: `${target.name} işaretlendi: her isabette +${m.damage ?? '1d6'} ${m.damageType ?? 'force'}.`,
    });
    // Kuyruk A4 (sürüm 32): Hex: seçilen yeteneğin kontrollerinde dezavantaj (seçim yoksa STR: İt, yakalama, kurtulma).
    if (m.markCheckDis) {
      for (const c of Object.values(state.combatants)) for (const e of c.effects ?? []) if (e.id === `${spell.srd}:check` && e.sourceId === actor.id) events.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'expired' });
      // Seçim yoksa hedefin savaşta kullandığı kontrol (STR ya da DEX: İt, yakalama, kurtulma) hangisi güçlüyse o.
      const ab = ABILITIES.includes(cmd.choice as Ability) ? cmd.choice as Ability : (target.saves.dex > target.saves.str ? 'dex' : 'str');
      events.push({ type: 'effect_added', targetId: target.id, effect: { id: `${spell.srd}:check`, name: `${spell.name} (${ab.toUpperCase()})`, sourceId: actor.id,
        until: state.round + 6000, concentration: spell.name, checkDis: [ab] } });
    }
    // Kuyruk 19 (featuresK19): Hunter's Lore: işaretli yaratığın bağışıklık, direnç ve zaafları bilinir (günlükte).
    if (actor.traits?.includes('hunters-lore') && globalRule(state, 'featuresK19')) {
      const list = (k: string, xs: string[]) => (xs.length ? `${k}: ${xs.join(', ')}` : '');
      const parts = [list('Bağışıklık', target.immunities), list('Direnç', target.resistances), list('Zaaf', target.vulnerabilities)].filter(Boolean);
      events.push({ type: 'map_note', text: `Hunter's Lore — ${target.name}: ${parts.length ? parts.join('; ') : 'bağışıklık, direnç ya da zaaf yok'}.` });
    }
    return finish(state, events);
  }

  if (m.kind === 'sleep') {
    const roll = rollDice('5d8', rollTag(rng, { by: actor.id }));
    const affected = target.hp <= roll.total;
    events.push({
      type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel,
      note: `Zar ${roll.rolls.join('+')} = ${roll.total}: ${target.name} ${affected ? 'uykuya daldı' : 'etkilenmedi'}`,
    });
    if (affected && !target.conditions.includes('Unconscious')) {
      events.push({ type: 'condition_changed', targetId: target.id, condition: 'Unconscious', present: true, reason: spell.name, sourceId: actor.id });
    }
    return finish(state, events);
  }

  if (m.kind === 'heal') {
    // Görev CLERIC: Disciple of Life (+2 + slot seviyesi), Blessed Healer (başkasını iyileştirince büyücüye).
    const slotLevel = spell.level > 0 ? spell.level + upcast : null;
    const hi: { events: BattleEvent[]; rolls?: number[]; changed?: string } = { events: [] };
    const hpAfter = applyHealing(target.hp, target.maxHp, healAmount(damageExpr(m, actor, tier, upcast, spell.school, spell.name), actor, target, rng, state, hi) + healBonus(actor, slotLevel));
    events.push(...hi.events, {
      type: 'healed', actorId: actor.id, targetId: target.id, label: spell.name,
      amount: hpAfter - target.hp, targetHpAfter: hpAfter, ...(hi.rolls ? { rolls: hi.rolls } : {}), ...(hi.changed ? { changed: hi.changed } : {}),
    });
    events.push(...healSelfAfter(actor, slotLevel, target.id !== actor.id, spell.name));
    return finish(state, events);
  }

  if (m.kind === 'save') {
    const ability = m.save;
    if (!ability) return fail('Bu büyünün save türü tanımlı değil.');
    const reasons = environmentSources(env, tag);
    // Görev SORCERER: Heightened Spell: hedefin save'i dezavantajlı.
    const mode = actor.traits?.includes('mm-heightened') ? 'disadvantage' as const : invertMode(combineModes(reasons)); // büyü avantajlıysa hedefin save'i dezavantajlı olur
    // Kuyruk 19: bazı türler save'i otomatik kaçırır (Blight: Plant; anahtar `spellsK19`).
    const typeFail = !!m.autoFailTypes?.length && globalRule(state, 'spellsK19') && m.autoFailTypes.includes((target.creatureType ?? '').toLowerCase());
    const autoFail = typeFail || ((ability === 'str' || ability === 'dex') && autoFailsStrDexSave(target.conditions));
    const dexCover = ability === 'dex' ? cover : 0;
    const save = resolveSave({ ...(m.illusion && truesightSees(state, target, actor) ? { autoSuccess: true } : {}), extra: saveDice(target, ability), modifier: target.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0,
      mode: saveMode(mode, target, ability, actor), autoFail, against: [...(m.conditions ?? []), ...(m.failEffect?.grants ?? []), 'spell'] }, rollTag(rng, { by: target.id }));
    let raw = 0;
    let rolls: number[] = [];
    if (m.damage) {
      const d = spellDamageRoll(damageExpr(m, actor, tier, upcast, spell.school, spell.name), actor, rng);
      raw = d.total;
      rolls = d.rolls;
    }
    const amount = saveDamage(target, ability, save.success, raw, !!m.halfOnSave || potentCantrip(actor, spell));
    const adjusted = amount > 0 ? adjustDamage(amount, m.damageType, profileIn(state, target, true)) : { amount: 0, note: null };
    const fx = damageEffects(target, adjusted.amount, m.damageType ?? '', false, rng);
    const added = !save.success ? (m.conditions ?? []).filter((c) => !target.conditions.includes(c)) : [];
    events.push({
      type: 'save_resolved', actorId: actor.id, targetId: target.id, label: spell.name,
      ability, dc: actor.spellSaveDc ?? 0, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: rolls, rawDamage: raw, appliedDamage: adjusted.amount, damageType: m.damageType ?? '',
      damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: added,
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
      ...(save.extra ? { bonusDice: save.extra } : {}),
    });
    events.push(...spellTimerEvents(state, spell.name, target.id, added, ability, actor.spellSaveDc ?? 0));
    // A1: save'i başaran bu büyüyle yeniden hedeflenemez (Eyebite; işaret konsantrasyonla biter).
    if (save.success && m.repeat?.noRetarget && spell.concentration) {
      events.push({ type: 'effect_added', targetId: target.id, effect: { id: `${spell.srd}:resisted`, name: spell.name, sourceId: actor.id, concentration: spell.name, resisted: spell.srd } });
    }
    // Kuyruk K61 (sürüm 44): başarılı save'in hafif etkisi (Flesh to Stone: hız 0, büyücünün sonraki turunun başına dek).
    if (save.success && m.successEffect) {
      events.push({ type: 'effect_added', targetId: target.id, effect: { id: `${spell.srd}:ok`, name: spell.name, sourceId: actor.id, until: state.round + 1, untilSourceTurn: true,
        ...(m.successEffect.speedZero ? { speedZero: true } : {}), ...(m.successEffect.icon ? { icon: m.successEffect.icon } : {}) } });
    }
    // Kuyruk 19: tek hedefli büyüde de başarısızlığın süren etkisi (Phantasmal Killer; anahtarlı ise `failEffectGate`).
    const fe1 = m.failEffect && (!m.failEffectGate || globalRule(state, m.failEffectGate)) ? m.failEffect : undefined;
    // Yinelenen hasar yukarı slotla büyür (büyünün kendi hasar ifadesi).
    const fe1u = fe1?.repeatFailDamage && m.damage ? { ...fe1, repeatFailDamage: { ...fe1.repeatFailDamage, dice: damageExpr(m, actor, tier, upcast, spell.school, spell.name) } } : fe1;
    if (fe1u && (m.failEffectGate || m.failEffectSingle) && !save.success && fx.hpAfter > 0) events.push(failEffectEvent(state, actor, spell, fe1u, ability, target.id, cmd.choice));
    // Kuyruk A2 (sürüm 30+): seçilen duruma bağlı süren etki (Eyebite: Asleep hasarla biter; Panicked her tur başı
    // büyücüden uzaklaşmak için Dash, Fear'in kaçış yolu). Durum etkinin `grants`'ı olur: etki düşünce durum da kalkar.
    const ce = !save.success && fx.hpAfter > 0 && ruleVersion(state) >= 30 ? m.choiceEffects?.[added[0] ?? ''] : undefined;
    if (ce) events.push(failEffectEvent(state, actor, spell, { rounds: 10, ...ce } as NonNullable<SpellMechanics['failEffect']>, ability, target.id, cmd.choice));
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (adjusted.amount > 0) events.push(...damagedReactions(applyEvents(state, events), target.id, actor.id, rng));
    return finish(state, events);
  }

  // Saldırı büyüleri (attack) ve otomatik isabet eden büyüler (auto): her ışın ayrı çözülür.
  // Görev K7: yukarı slotta ek ışın/dart (Magic Missile, Scorching Ray: slot başına +1; `upcast.rays`, uygulananlar).
  const rays = m.raysByLevel ? tier : (m.rays ?? 1) + (m.upcast?.applied && m.upcast.rays ? m.upcast.rays * upcast : 0);
  let current = applyEvents(state, events);
  // Otomatik isabet eden büyüyü kesen tepki (Shield → Magic Missile; Görev R1).
  const guard = m.kind === 'auto' ? targetedReactions(current, actor, target, rng, { srd: spell.srd, name: spell.name }) : null;
  if (guard?.events.length) { events.push(...guard.events); current = applyEvents(current, guard.events); }
  // Kuyruk 19 (srdK19): Redirect Attack büyü saldırı zarında da: ilk ışın yer değiştiren dosta gider.
  const redirected = m.kind === 'attack' && globalRule(state, 'srdK19') ? targetedReactions(current, actor, target, rng) : null;
  if (redirected?.events.length) { events.push(...redirected.events); current = applyEvents(current, redirected.events); }
  // Görev WIZARD: Chromatic Orb sıçraması: hasar zarlarından ikisi aynıysa küre hedefin 30 ft içindeki başka bir yaratığa
  // sıçrar (yeni saldırı); slot seviyesi kadar, her yaratık bir kez (SRD 5.2.1).
  let curId = redirected?.targetId ?? target.id;
  let raysLeft = rays;
  let leapsLeft = m.leap ? slotLevel ?? spell.level : 0;
  const struck = new Set<string>();
  let seekUsed = false;
  for (let r = 0; r < raysLeft; r++) {
    const t = current.combatants[curId];
    // Y2: 0 HP'de yenilenmeyi bekleyen yaratık (Troll) hedef olabilir: ateş/asit yenilenmeyi keser (Kuyruk 41b kuralı;
    // büyü saldırısı burada atılmadan bitiyordu, Mağara beraberlikleri).
    if (!t || (t.hp <= 0 && !t.regenPending)) break;
    struck.add(t.id);
    const expr = damageExpr(m, actor, tier, upcast, spell.school, spell.name);
    let ev: BattleEvent;
    if (m.kind === 'attack') {
      const sources = [
        ...environmentSources(env, tag),
        ...attackSources({
          ...sightConditions(actor, t, current, !rangedSpell), attackerSide: actor.side,
          attackerHeight: heightOf(current, actor), targetHeight: heightOf(current, t), ranged: rangedSpell, spell: true,
          targetAsleep: t.asleep === true,
        }),
        ...rangeSources,
        ...wardSources(current, actor, t, { melee: !rangedSpell, str: false }),
        // Görev F: Precise Hunter (Steady Aim yalnızca silah saldırısında harcanır).
        ...traitSources(current, actor, t).filter((x) => x.reason !== 'Steady Aim'),
        // Görev SORCERER: Innate Sorcery etkinken büyü saldırısında avantaj.
        ...(innateFor(current, actor, spell.name) ? [{ effect: 'advantage' as const, reason: 'Innate Sorcery' }] : []),
      ];
      const mode = combineModes(elusiveFilter(t, sources));
      const attackInput = { attackBonus: actor.spellAttack ?? 0, targetAc: effectiveAc(current, t) + cover, mode, damage: expr, autoCritical: isAutoCritical(t.conditions, withinFiveFt(current, actor, t, !rangedSpell)), extra: attackDice(actor) };
      let res = resolveAttack(attackInput, rollTag(rng, { by: actor.id }));
      // Kuyruk 19 (srdK19): Greater Magic Resistance (büyü saldırıları kendiliğinden ıskalar), Reflective Carapace (menzilli büyü saldırısı etkilemez).
      if (t.traits?.includes('greater-magic-resistance') || (rangedSpell && t.traits?.includes('reflective-carapace'))) res = { ...res, hit: false, critical: false, damage: null };
      // K11: Seeking Spell: ıskada 1 Sorcery Point ile d20 bir kez yeniden (yeni sonuç geçerli); büyünün ilk ıskasında.
      const points = resourceLeft(current.combatants[actor.id] as Combatant, POINTS);
      if (!res.hit && !seekUsed && actor.traits?.includes('mm-seeking') && points >= 1) {
        seekUsed = true;
        const pay: BattleEvent = { type: 'feature_used', actorId: actor.id, feature: POINTS, remaining: points - 1 };
        events.push(pay); current = applyEvents(current, [pay]);
        res = resolveAttack(attackInput, rollTag(rng, { by: actor.id }));
      }
      // Görev SORCERER: Empowered Spell büyü saldırısının hasar zarlarında da.
      const sides = parseDice(expr).sides;
      const rolls0 = res.damage?.rolls ?? [];
      const rolls1 = res.hit && actor.traits?.includes('mm-empowered') ? empowerRolls(actor, rolls0, sides, rng) : rolls0;
      const raw = (res.damage?.total ?? 0) - rolls0.reduce((n, x) => n + x, 0) + rolls1.reduce((n, x) => n + x, 0);
      const adj = res.hit ? adjustDamage(raw, m.damageType, profileIn(state, t, true)) : { amount: 0, note: null };
      // Hunter's Mark: işaretli hedefe büyü saldırısı isabetinde de ek hasar.
      let bonus = res.hit ? hitExtras(current, actor, t, { mode, critical: res.critical }, rng) : { extras: [] as ExtraDamage[] };
      // Görev SORCERER: patlayan zar (Sorcerous Burst): en yüksek yüzde ek zar, en çok büyü yeteneği değiştiricisi kadar.
      if (res.hit && m.explode) {
        const boom = explodeRolls(rolls1, m.explode, Math.max(0, actor.spellMod), actor, rng);
        if (boom.length) {
          const sum = boom.reduce((n, x) => n + x, 0);
          const a = adjustDamage(sum, m.damageType, profileIn(state, t, true));
          bonus = { ...bonus, extras: [...bonus.extras, { label: `${spell.name} (patlama)`, rolls: boom, raw: sum, applied: a.amount, type: m.damageType ?? '', note: a.note }] };
        }
      }
      const ac = effectiveAc(current, t) + cover;
      // Hedefin isabet tepkisi (Shield, Parry, Uncanny Dodge; Görev R1).
      const hr = res.hit ? hitReactions(current, {
        attacker: actor, target: t, label: spell.name, total: res.total, ac, critical: res.critical, melee: !rangedSpell, ranged: rangedSpell,
        damage: adj.amount + bonus.extras.reduce((n, x) => n + x.applied, 0), damageType: m.damageType ?? '',
      }, rng) : null;
      const hit = hr ? hr.hit : res.hit;
      if (!hit) bonus = { extras: [] };
      // Görev B1: ıskada yarı hasar (Acid Arrow).
      const miss = !hit && m.halfOnMiss ? (() => {
        const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }));
        const a = adjustDamage(Math.floor(d.total / 2), m.damageType, profileIn(state, t, true));
        return { rolls: d.rolls, raw: Math.floor(d.total / 2), amount: a.amount, note: a.note };
      })() : null;
      const total = hit ? hr?.damage ?? 0 : miss?.amount ?? 0;
      if (hr?.events.length) { events.push(...hr.events); current = applyEvents(current, hr.events); }
      const fx = damageEffects(t, total, m.damageType ?? '', hit && res.critical, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: spell.name, mode,
        reasons: sources.map((s) => s.reason), d20: res.d20.rolls, natural: res.d20.kept, total: res.total,
        targetAc: hr?.ac ?? ac, hit, critical: hit && res.critical, fumble: res.fumble,
        damageRolls: hit ? rolls1 : miss?.rolls ?? [], rawDamage: hit ? raw : miss?.raw ?? 0, appliedDamage: total,
        damageType: m.damageType ?? '', damageNote: hit ? adj.note : miss?.note ?? null, targetHpAfter: fx.hpAfter, effects: fx.effects,
        ...(cover === 2 || cover === 5 ? { cover } : {}),
        ...(bonus.extras.length > 0 ? { extra: bonus.extras } : {}),
        ...(hr?.reacted ? { reacted: hr.reacted } : {}),
        ...(res.extra ? { bonusDice: res.extra } : {}),
      };
    } else {
      const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }));
      const adj = guard?.blocked ? { amount: 0, note: null } : adjustDamage(d.total, m.damageType, profileIn(state, t, true));
      const fx = damageEffects(t, adj.amount, m.damageType ?? '', false, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: `${spell.name} (otomatik isabet)`,
        mode: 'normal', reasons: [], d20: [], natural: 0, total: 0, targetAc: t.ac, hit: true,
        critical: false, fumble: false, damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount,
        damageType: m.damageType ?? '', damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
        ...(guard?.blocked ? { reacted: { name: 'Shield', reduced: d.total } } : {}),
      };
    }
    events.push(ev);
    current = applyEvents(current, [ev]);
    // Görev B1: isabetten sonra kalan etki (Acid Arrow, Heat Metal) ve can emme (Vampiric Touch).
    if (ev.type === 'attack_resolved' && ev.hit) {
      const after = afterHitEvents(current, actor, t.id, spell, ev.appliedDamage, rng, upcast);
      events.push(...after);
      current = applyEvents(current, after);
      // Görev WARLOCK: Repelling Blast: isabette Large ve küçüğü düz geriye (her ışında).
      const push = actor.cantripMods?.[spell.name]?.pushFt;
      const hitT = current.combatants[t.id];
      if (push && actor.pos && hitT && hitT.hp > 0 && ['T', 'S', 'M', 'L'].includes(hitT.size ?? 'M')) {
        const pushed = pushAwayEvents(current, actor.pos, t.id, push, actor.id, rng);
        events.push(...pushed);
        current = applyEvents(current, pushed);
      }
    }
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (ev.type === 'attack_resolved' && ev.appliedDamage > 0) {
      const back = damagedReactions(current, t.id, actor.id, rng);
      events.push(...back);
      current = applyEvents(current, back);
      if ((current.combatants[actor.id]?.hp ?? 0) <= 0) break;
    }
    if (leapsLeft > 0 && ev.type === 'attack_resolved' && ev.hit && new Set(ev.damageRolls).size < ev.damageRolls.length) {
      const from = current.combatants[t.id];
      // Kuyruk A6 (sürüm 35, `leapPick`): sıçrama hedefi büyücünün seçimi (`targetIds` sırası; 30 ft içinde, dost da olabilir);
      // seçim yoksa en yakın düşman.
      const near = (c: Combatant) => !struck.has(c.id) && isTargetable(c) && c.hp > 0 && (!state.map || (!!c.pos && !!from?.pos && distance(c.pos, from.pos) * 5 <= 30));
      const picked = m.leapPick ? (cmd.targetIds ?? []).map((id) => current.combatants[id]).find((c): c is Combatant => !!c && c.id !== actor.id && near(c)) : undefined;
      const byDist = (a: Combatant, b: Combatant) => (from?.pos && a.pos && b.pos ? distance(a.pos, from.pos) - distance(b.pos, from.pos) : 0);
      const nearest = Object.values(current.combatants)
        .filter((c) => c.side !== actor.side && !struck.has(c.id) && isTargetable(c) && c.hp > 0 && (!state.map || (!!c.pos && !!from?.pos && distance(c.pos, from.pos) * 5 <= 30)))
        .sort(byDist)[0];
      // Kuyruk S1 (sürüm 40, `leapAsk`): komut sırası vermediyse sıçrama hedefi büyücüye sorulur (seçim istemi; 30 ft
      // içinde, dost da olabilir; öneri en yakın düşman; "Seçme" sıçramaz).
      let next: Combatant | undefined = picked ?? nearest;
      if (!picked && m.leapAsk) {
        const cands = Object.values(current.combatants).filter((c) => c.id !== actor.id && near(c)).sort(byDist);
        const id = askChoice(rng, { actorId: actor.id, sourceId: t.id, label: `${spell.name}: sıçrama hedefi`,
          options: cands.map((c) => ({ id: c.id, label: c.name })), suggested: nearest?.id ?? null });
        next = id ? current.combatants[id] : undefined;
      }
      if (next) { curId = next.id; leapsLeft--; raysLeft++; }
    }
  }
  // Görev B5 (Ice Knife): isabet ya da ıska, hedefin altıgeni ve çevresi (5 ft küre) save'li hasar; slot yeniden harcanmaz.
  const caster = current.combatants[actor.id];
  const at = current.combatants[target.id]?.pos;
  if (m.burst && state.map && at && caster && caster.hp > 0) {
    // Görev K9b: yukarı slotta patlamanın zarı artar (Ice Knife cold +1d6).
    const bd = atSlot(spell, spell.level + upcast).mechanics.burst ?? m.burst;
    const burst: Spell = { ...spell, area: { shape: 'sphere', sizeFt: 5, origin: 'point', targets: 'all' }, rangeFt: Math.max(spell.rangeFt, 1000),
      mechanics: { kind: 'save', save: bd.save, damage: bd.damage, damageType: bd.damageType } };
    const r = executeAreaCast(current, caster, { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex: at }, burst, rng, true, `${spell.name}: patlama`);
    if (r.ok) events.push(...r.events);
  }
  return finish(state, events);
}

/** Görev WIZARD: çok hedefli save büyüsü: yuva ve konsantrasyon bir kez, sonra her hedefe tek hedefli çözüm. */
function executeSaveMany(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const ids = [...new Set(cmd.targetIds ?? [])];
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const most = 1 + (level - spell.level + (actor.traits?.includes('mm-twinned') ? 1 : 0)) * (spell.mechanics.upcast?.targets ?? 0) + (schoolTwin(actor, spell) ? 1 : 0);
  if (ids.length > most) return fail(`${spell.name} ${level}. slotta en çok ${most} hedef.`);
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel)];
  let current = applyEvents(state, events);
  for (const id of ids) {
    const a = current.combatants[actor.id] as Combatant;
    const r = castSpell(current, a, { ...cmd, targetId: id, targetIds: undefined, slotLevel: level }, spell, rng, true);
    if (!r.ok) return fail(`${current.combatants[id]?.name ?? id}: ${r.error}`);
    events.push(...r.events);
    current = r.state;
  }
  return finish(state, events);
}

/**
 * Görev B1: isabetten sonra hedefte kalan etki: gecikmeli hasar (Acid Arrow; hedefin sonraki turunun sonunda), save
 * başarısızsa saldırıları dezavantajlı (Heat Metal; büyücünün sonraki turunun başına dek); verilen hasarın bir kısmı
 * kadar büyücü iyileşir (Vampiric Touch).
 */
/** Gecikmeli hasar zarı yukarı slotla: büyünün uygulanan yukarı slot zarı (aynı zar boyunda) eklenir. */
function upcastDelayed(dice: string, m: SpellMechanics, upcast: number): string {
  const extra = upcastDiceCount(m, upcast);
  const d = parseDice(dice);
  return extra > 0 ? formatDice(d.count + extra, d.sides, d.bonus) : dice;
}

function afterHitEvents(state: BattleState, actor: Combatant, targetId: string, spell: Spell, damage: number, rng: Rng, upcast = 0): BattleEvent[] {
  const m = spell.mechanics;
  const events: BattleEvent[] = [];
  const t = state.combatants[targetId];
  const a = m.afterHit;
  if (a && t && t.hp > 0) {
    let applies = true;
    if (a.save) {
      const dc = actor.spellSaveDc ?? 10;
      const save = resolveSave({ extra: saveDice(t, a.save), modifier: t.saves[a.save], dc, mode: saveMode('normal', t, a.save) }, rollTag(rng, { by: t.id }));
      events.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name, ability: a.save, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}) });
      applies = !save.success;
    }
    // Kuyruk S2 (sürüm 41, Heat Metal `metalDrop`): başarısız save'de tutan metal silahını bırakabilir (hedefe seçim
    // istemi; öneri: zırh da metal değilse bırak). Bırakırsa dezavantaj yok; giydiği metal zırh bırakılamaz.
    if (applies && m.metalDrop && heldMetal(t).length) {
      const item = heldMetal(t)[0] as string;
      const pick = askChoice(rng, { actorId: t.id, sourceId: actor.id, label: `${spell.name}: kızgın metal`,
        options: [{ id: 'drop', label: `${item} bırak` }, { id: 'keep', label: 'tut (dezavantaj)' }], suggested: wearsMetal(t) ? 'keep' : 'drop' });
      if (pick !== 'keep') { events.push(...dropEvents(state, t, item, `${spell.name}: kızgın metali bıraktı`)); applies = wearsMetal(t); }
    }
    if (applies) {
      events.push({ type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 1,
        ...(a.attackDis ? { attackDis: a.attackDis } : {}), ...(a.untilSourceTurn ? { untilSourceTurn: true } : {}), ...(a.grants ? { grants: a.grants } : {}),
        // Kuyruk A7 (Heat Metal): yetenek kontrollerinde de dezavantaj.
        ...(a.checkDis ? { checkDis: a.checkDis } : {}),
        // CILA: gecikmeli hasar da yukarı slotla artar (Acid Arrow: slot başına +1d4).
        ...(a.delayed ? { delayed: { ...a.delayed, dice: upcastDelayed(a.delayed.dice, m, upcast) } } : {}), ...(spell.concentration ? { concentration: spell.name } : {}),
        ...(a.revealed ? { revealed: true } : {}), ...(a.light !== undefined ? { light: a.light } : {}), ...(a.lightDim ? { lightDim: a.lightDim } : {}),
        // Kuyruk A4 (Starry Wisp): büyücünün sonraki turunun sonuna dek.
        ...(a.untilSourceTurnEnd ? { endAfterSourceTurn: state.round, until: state.round + 2 } : {}) } });
    }
  }
  const self = state.combatants[actor.id];
  if (m.drain && damage > 0 && self && self.hp > 0) {
    const hpAfter = applyHealing(self.hp, self.maxHp, Math.floor(damage * m.drain));
    events.push({ type: 'healed', actorId: actor.id, targetId: actor.id, label: spell.name, amount: hpAfter - self.hp, targetHpAfter: hpAfter });
  }
  return events;
}

/**
 * Kuyruk S1 (sürüm 40): alandaki taşınmayan nesneler. Faerie Fire (`outlineObjects`): nesne `outlined` olur (süre
 * boyunca ona saldırı avantajlı). Meteor Swarm (`ignitesObjects`): ateşli alandaki yanıcı nesnelerin altıgeni alev
 * yüzeyi olur (nesne verisinde `flammable`).
 */
function areaObjectEvents(state: BattleState, actor: Combatant, spell: Spell, events: BattleEvent[]): BattleEvent[] {
  const m = spell.mechanics;
  if ((!m.outlineObjects && !m.ignitesObjects) || !state.map?.objects?.length) return [];
  const areas = events.flatMap((e) => (e.type === 'spell_cast' && e.actorId === actor.id && e.area ? [e.area] : []));
  const inArea = (o: MapObject, fireOnly: boolean) => !o.carriedBy && areas.some((a) => (!fireOnly || a.damageType === 'fire') && a.hexes.some((h) => h.col === o.at.col && h.row === o.at.row));
  const out: BattleEvent[] = [];
  if (m.outlineObjects) {
    const rounds = m.failEffect?.rounds ?? 10;
    for (const o of state.map.objects) if (inArea(o, false)) out.push({ type: 'object_changed', objectId: o.id, label: `${spell.name}: ${OBJECTS[o.kind]?.tr ?? o.kind} parlıyor`, outlined: state.round + rounds - 1 });
  }
  if (m.ignitesObjects) {
    const burning = new Set((state.map.zones ?? []).filter((z) => z.surface === 'fire').flatMap((z) => z.hexes.map(hexKey)));
    const hexes = state.map.objects.filter((o) => inArea(o, true) && OBJECTS[o.kind]?.flammable && !burning.has(hexKey(o.at))).map((o) => o.at);
    const uniq = [...new Map(hexes.map((h) => [hexKey(h), h])).values()];
    if (uniq.length) out.push(surfaceEvent(state, 'fire', uniq, actor.id, actor.side));
  }
  return out;
}

/**
 * Kuyruk A6 (Gust of Wind, `lingerZone`): alan büyüsünün altıgenlerinde süren alan (konsantrasyon); aynı büyücünün
 * aynı büyüden önceki alanı biter (yeni yön).
 */
function lingerZoneEvents(state: BattleState, actor: Combatant, spell: Spell, events: BattleEvent[]): BattleEvent[] {
  const spec = spell.mechanics.lingerZone;
  const area = events.find((e): e is Extract<BattleEvent, { type: 'spell_cast' }> => e.type === 'spell_cast' && !!e.area?.hexes.length)?.area;
  if (!spec || !state.map || !area) return [];
  const out: BattleEvent[] = (state.map.zones ?? []).filter((z) => z.spellId === spell.id && z.casterId === actor.id)
    .map((z): BattleEvent => ({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' }));
  const caster = state.combatants[actor.id];
  out.push({ type: 'zone_created', zone: { id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
    dc: actor.spellSaveDc ?? 10, slotLevel: caster?.concentration?.slotLevel ?? spell.level, hexes: area.hexes, ...(spell.concentration ? { concentration: spell.name } : {}), spec,
    // Kuyruk S1: büyücüye bağlı çizgi (komut sonunda büyücüyle kayar; `anchorZones.ts`).
    ...(spec.followCaster && caster?.pos ? { center: caster.pos } : {}) } });
  return out;
}

/** Kuyruk A8: büyünün SRD bileşenlerinde somatik (S) var mı (data/srd/spells.json). */
const SOMATIC = new Map((srdSpells.spells as Array<{ id: string; components?: string }>).map((x) => [x.id, /(^|,\s*)S(,|$|\s)/.test(x.components ?? '')]));
const somaticOf = (spell: Spell): boolean => SOMATIC.get(spell.srd.replace('spells:', '')) ?? false;

/** Kuyruk A7: büyücünün bu büyüyle önceki nesne ışığı biter (Light: "ends if you cast it again"). */
function objectLightEnd(state: BattleState, actor: Combatant, spell: Spell, except?: string): BattleEvent[] {
  return (state.map?.objects ?? []).filter((o) => o.lightSpell === spell.id && o.lightBy === actor.id && o.id !== except)
    .map((o): BattleEvent => ({ type: 'object_changed', objectId: o.id, label: `${spell.name}: ışık söndü`, light: null }));
}

/**
 * Kuyruk A7: nesneye ışık (Light: 20 ft parlak; Continual Flame süresiz). Nesne başkası tarafından taşınmamalı; dokunma
 * (bitişik ya da büyücünün taşıdığı). Işık nesneyle gider (`litHexes`: taşıyanın yerinde). Light yeniden yapılınca
 * önceki ışık (nesne ya da etki) biter.
 */
function executeObjectLight(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const at = cmd.targetHex as Offset;
  const obj = (state.map?.objects ?? []).find((o) => (o.carriedBy ? o.carriedBy === actor.id && actor.pos && sameHexOf(actor.pos, at) : sameHexOf(o.at, at)));
  if (!obj) return fail(`${spell.name}: o altıgende (başkasının taşımadığı) bir nesne yok.`);
  if (obj.carriedBy && obj.carriedBy !== actor.id) return fail(`${spell.name}: başkasının taşıdığı nesneye yapılamaz.`);
  if (!obj.carriedBy && actor.pos && distance(actor.pos, obj.at) > 1) return fail(`${spell.name}: nesneye dokunmalısın (bitişik).`);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const m = spell.mechanics;
  const events: BattleEvent[] = [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: obj.kind }];
  if (!m.objectLightKeep) {
    events.push(...objectLightEnd(state, actor, spell, obj.id));
    for (const c of Object.values(state.combatants)) if (c.effects?.some((e) => e.id === spell.srd && e.sourceId === actor.id)) events.push({ type: 'effect_ended', targetId: c.id, effectId: spell.srd, name: spell.name, reason: 'expired' });
  }
  events.push({ type: 'object_changed', objectId: obj.id, label: `${spell.name}: ışık`, light: { r: m.objectLight ?? 4, spell: spell.id, by: actor.id } });
  return finish(state, events);
}
const sameHexOf = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;

/** Kuyruk A6: veride olduğu gibi yazılan etki alanları ("$caster", "$side", "$dc" yer tutucuları). */
export function rawEffect(raw: Record<string, unknown>, actor: Combatant, dc: number): Partial<ActiveEffect> {
  const sub = (v: unknown): unknown => (v === '$caster' ? actor.id : v === '$side' ? actor.side : v === '$dc' ? dc
    : Array.isArray(v) ? v.map(sub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(x)])) : v);
  return sub(raw) as Partial<ActiveEffect>;
}

/** Görev B1: çok hedefli iyileştirme (Mass Healing Word: en çok `healTargets` yaratık, her biri ayrı zar). */
function executeHealMany(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const m = spell.mechanics;
  const ids = [...new Set(cmd.targetIds ?? [])];
  if (ids.length === 0) return fail('Hedef seçmelisin.');
  if (ids.length > (m.healTargets ?? 1)) return fail(`${spell.name} en çok ${m.healTargets} hedef.`);
  const targets: Combatant[] = [];
  for (const id of ids) {
    const t = state.combatants[id];
    if (!t) return fail('Hedef bulunamadı.');
    if (!isTargetable(t)) return fail(`${t.name} ayakta değil.`);
    if (t.id !== actor.id) {
      const r = checkReach(state, actor, t, spellReach(spell, actor));
      if (!r.ok) return fail(`${t.name}: ${r.error}`);
    }
    targets.push(t);
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const upcast = (slot.slotLevel ?? spell.level) - spell.level;
  const events: BattleEvent[] = [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel,
    note: targets.map((x) => x.name).join(', ') }];
  const expr = damageExpr(m, actor, tierOf(actor), upcast, spell.school, spell.name);
  for (const t of targets) {
    const hi: { events: BattleEvent[]; rolls?: number[]; changed?: string } = { events: [] };
    const hpAfter = applyHealing(t.hp, t.maxHp, healAmount(expr, actor, t, rng, applyEvents(state, events.filter((e) => e.type === 'feature_used' || e.type === 'trait_turn')), hi) + healBonus(actor, slot.slotLevel));
    events.push(...hi.events, { type: 'healed', actorId: actor.id, targetId: t.id, label: spell.name, amount: hpAfter - t.hp, targetHpAfter: hpAfter,
      ...(hi.rolls ? { rolls: hi.rolls } : {}), ...(hi.changed ? { changed: hi.changed } : {}) });
  }
  // Blessed Healer: başkası iyileştiyse büyücü (kendisi hedefse onun iyileşmesinden sonra).
  const self = applyEvents(state, events).combatants[actor.id] as Combatant;
  events.push(...healSelfAfter(self, slot.slotLevel, targets.some((t) => t.id !== actor.id), spell.name));
  return finish(state, events);
}

/**
 * Görev B1: True Strike: elindeki silahla bir saldırı; saldırı ve hasarda büyü yeteneği, hasar Radiant olabilir;
 * 5., 11., 17. seviyede isabette ek Radiant zarı (tek seferlik etki olarak, saldırıdan sonra biter).
 */
function executeTrueStrike(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const target = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (!target) return fail('Hedef seçmelisin.');
  const weapons = actor.weaponOptions.filter((o) => !o.spell && !o.offhand && o.weaponId);
  const base = weapons.find((o) => o.label === cmd.choice) ?? weapons[0];
  if (!base) return fail(`${spell.name} için elde bir silah olmalı.`);
  // Görev SORCERER: büyü yeteneği STR/DEX'in yerine geçer; silahın büyülü bonusu saldırı ve hasarda kalır (SRD 5.2.1).
  const enchant = base.enchant ?? 0;
  const mod = actor.spellMod + enchant;
  const die = /^\d+d\d+/.exec(base.weaponDamage ?? base.damage)?.[0];
  const option: AttackOption = { ...base, label: `${base.label} (${spell.name})`, attackBonus: actor.spellAttack !== null ? actor.spellAttack + enchant : base.attackBonus,
    abilityMod: actor.spellMod, damage: die ? `${die}${mod === 0 ? '' : mod > 0 ? `+${mod}` : mod}` : base.damage, altDamageType: 'radiant' };
  // 5+ seviye ek Radiant zarı yalnızca bu saldırının isabetinde (hasar Radiant ya da silahın türü olsa da).
  const extra = spell.mechanics.weaponStrike?.extra[tierOf(actor) - 1] ?? '';
  if (extra) option.hitExtra = { label: spell.name, expr: extra, type: 'radiant' };
  const pre: BattleEvent[] = [{ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: null, note: base.label }];
  const mid = applyEvents(state, pre);
  const r = weaponAttackEvents(mid, mid.combatants[actor.id] as Combatant, mid.combatants[target.id] as Combatant, option, rng);
  if (!r.ok) return r;
  return finish(state, [...pre, ...r.events]);
}

/**
 * Görev B1: süreli tekrar (`spell_followup`): konsantrasyon sürerken sonraki turlarda büyünün etkisi slotsuz yeniden
 * (Heat Metal aynı hedefe bonus eylemle, Vampiric Touch ve Call Lightning eylemle, Gust of Wind bonus eylemle yeni yöne).
 */
/**
 * Görev B4 (Flame Blade): yapmak saldırı içermez: slot, konsantrasyon ve büyücüde ışık (`selfLight`). Saldırı
 * `spell_followup` ile (`repeat`), aynı turda da.
 */
function executeCastOnly(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  // Kuyruk A7 (Flame Blade, `freeHand`): boş el gerekir (yan el silahı ya da kalkan taşıyan yapamaz).
  if (spell.mechanics.freeHand && (actor.offHandOption || actor.shieldHeld)) return fail(`${spell.name} için boş bir el gerekir (yan el silahı ya da kalkan var).`);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const m = spell.mechanics;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: 'hazır: saldırı "Büyüyü sürdür" ile' }];
  if (m.held) {
    // Kuyruk A6 (Produce Flame): elde alev (konsantrasyonsuz, ışık); yeniden yapınca eskisi biter.
    const old = actor.effects?.find((e) => e.id === spell.srd);
    if (old) events.unshift({ type: 'effect_ended', targetId: actor.id, effectId: old.id, name: old.name, reason: 'expired' });
    events.push({ type: 'effect_added', targetId: actor.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + m.held - 1,
      held: { spell: spell.name, slotLevel: slot.slotLevel }, ...(m.selfLight !== undefined ? { light: m.selfLight } : {}) } });
  } else if (m.selfLight !== undefined || spell.concentration) {
    events.push({ type: 'effect_added', targetId: actor.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id,
      ...(spell.concentration ? { concentration: spell.name } : {}), ...(m.selfLight !== undefined ? { light: m.selfLight } : {}) } });
  }
  return finish(state, events);
}

/**
 * Görev B5: Dispel Magic (yaratıktaki süren büyü etkileri biter; slotun üstündeki seviyede büyü yeteneğiyle kontrol,
 * DC 10 + seviye) ve Remove Curse (`curseOnly`: yalnızca Bestow Curse).
 */
const CURSES = ['spells:bestow-curse'];
function executeDispel(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  // Görev WIZARD: altıgen hedef: o altıgendeki büyü alanları (Remove Curse yalnızca lanet).
  if (!cmd.targetId && cmd.targetHex && !spell.mechanics.curseOnly) return executeDispelZone(state, actor, cmd, spell, rng);
  if (!cmd.targetId) return fail('Hedef seçmelisin.');
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id !== actor.id) {
    const r = checkReach(state, actor, target, spellReach(spell, actor));
    if (!r.ok) return r;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  // Kuyruk A6 (sürüm 35, `curseAll`): bütün lanetler: lanet büyüleri (veride `curse`), lanetli etkiler (Mummy Rot) ve
  // hedefteki Hex (Hex'in koyanı konsantrasyonu biter).
  const curseAll = !!spell.mechanics.curseAll;
  const curseIds = curseAll ? new Set([...CURSES, ...spells.filter((x) => x.mechanics.curse).map((x) => x.srd), ...spells.filter((x) => x.mechanics.curse).map((x) => `${x.srd}:check`)]) : new Set(CURSES);
  const effects = (target.effects ?? []).filter((e) => (spell.mechanics.curseOnly ? curseIds.has(e.id) || (curseAll && !!e.curse) : e.id.startsWith('spells:')));
  const hexers = curseAll ? Object.values(state.combatants).filter((c) => c.concentration?.targetId === target.id && spells.find((x) => x.name === c.concentration?.spell)?.mechanics.curse) : [];
  const events: BattleEvent[] = [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel, note: effects.length ? effects.map((e) => e.name).join(', ') : 'kaldırılacak büyü yok' }];
  for (const h of hexers) events.push({ type: 'concentration_ended', actorId: h.id, label: `${h.concentration?.spell ?? ''} (${spell.name})` });
  for (const e of effects) {
    const lv = spells.find((x) => x.srd === e.id)?.level ?? 0;
    if (lv > level) {
      const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.spellMod }));
      const ok = roll.kept + actor.spellMod >= 10 + lv;
      events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: `${spell.name}: ${e.name}`, slotLevel: null,
        note: `kontrol ${roll.kept} + ${actor.spellMod} = ${roll.kept + actor.spellMod} / DC ${10 + lv}: ${ok ? 'kalktı' : 'kalmadı'}` });
      if (!ok) continue;
    }
    events.push({ type: 'effect_ended', targetId: target.id, effectId: e.id, name: e.name, reason: 'dispelled' });
  }
  if (!spell.mechanics.curseOnly) {
    // Görev WIZARD: büyüyle çağrılmış yaratık (Find Familiar, Summon Dragon…) kaybolur; silahtaki büyü güçlendirmesi kalkar.
    const ok = (lv: number, label: string) => {
      if (lv <= level) return true;
      const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.spellMod }));
      const pass = roll.kept + actor.spellMod >= 10 + lv;
      events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: `${spell.name}: ${label}`, slotLevel: null,
        note: `kontrol ${roll.kept} + ${actor.spellMod} = ${roll.kept + actor.spellMod} / DC ${10 + lv}: ${pass ? 'kalktı' : 'kalmadı'}` });
      return pass;
    };
    if (target.summon && !target.summon.gone && ok(target.summon.level, target.name)) {
      events.push({ type: 'summon_vanished', actorId: target.id, ownerId: target.summon.by, reason: 'dispelled' });
    }
    for (const b of target.buffs ?? []) {
      const lv = spells.find((x) => x.name === b.source)?.level;
      if (lv !== undefined && b.until >= state.round && ok(lv, b.source)) events.push({ type: 'buff_removed', targetId: target.id, source: b.source });
    }
  }
  return finish(state, events);
}

/** Görev WIZARD: Dispel Magic altıgene: o altıgeni kaplayan büyü alanları biter (slotun üstündekinde yetenek kontrolü). */
function executeDispelZone(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const at = cmd.targetHex as NonNullable<CastCommand['targetHex']>;
  if (actor.pos && distance(actor.pos, at) * 5 > spell.rangeFt) return fail(`${spell.name} menzili ${spell.rangeFt} ft.`);
  const zones = (state.map?.zones ?? []).filter((z) => !z.cage && zoneHexes(state, z).some((h) => h.col === at.col && h.row === at.row));
  // Kuyruk A7 (sürüm 36): altıgendeki nesnede süren büyü (Light, Continual Flame ışığı) da kalkar.
  const lit = ruleVersion(state) >= 36 ? (state.map?.objects ?? []).filter((o) => !o.carriedBy && o.lightSpell && o.at.col === at.col && o.at.row === at.row) : [];
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const events: BattleEvent[] = [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: zones.length ? zones.map((z) => z.name).join(', ') : 'kaldırılacak büyü alanı yok' }];
  for (const o of lit) {
    const lv = spells.find((x) => x.id === o.lightSpell)?.level ?? 0;
    if (lv > level) {
      const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.spellMod }));
      const pass = roll.kept + actor.spellMod >= 10 + lv;
      events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: `${spell.name}: ${o.kind}`, slotLevel: null, note: `kontrol ${roll.kept + actor.spellMod} / DC ${10 + lv}: ${pass ? 'kalktı' : 'kalmadı'}` });
      if (!pass) continue;
    }
    events.push({ type: 'object_changed', objectId: o.id, label: `${spell.name}: ışık kalktı`, light: null });
  }
  for (const z of zones) {
    if (z.slotLevel > level) {
      const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.spellMod }));
      const pass = roll.kept + actor.spellMod >= 10 + z.slotLevel;
      events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: `${spell.name}: ${z.name}`, slotLevel: null,
        note: `kontrol ${roll.kept} + ${actor.spellMod} = ${roll.kept + actor.spellMod} / DC ${10 + z.slotLevel}: ${pass ? 'kalktı' : 'kalmadı'}` });
      if (!pass) continue;
    }
    events.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'dispelled' });
  }
  return finish(state, events);
}

/** Kuyruk 19: alanı taşıma (Faithful Hound: Magic eylemiyle 30 ft). */
export function executeZoneShift(state: BattleState, actor: Combatant, to: { col: number; row: number }): CommandResult {
  const m = movableZoneOf(state, actor);
  if (!m) return fail('Taşınacak alan yok.');
  const ft = m.spell.mechanics.repeat?.moveZoneFt || speedHexes(actor) * 10;
  // Kuyruk A7 (Dancing Lights): ışık büyünün menzili dışına taşınamaz (çıkarsa söner).
  if (ruleVersion(state) >= 36 && m.spell.rangeFt > 5 && actor.pos && distance(actor.pos, to) * 5 > m.spell.rangeFt) return fail(`${m.spell.name} menzili ${m.spell.rangeFt} ft.`);
  const evs = shiftZoneEvents(state, m.zone, to, ft);
  return typeof evs === 'string' ? fail(evs) : finish(state, [{ type: 'spell_cast', actorId: actor.id, targetId: null, label: `${m.spell.name} (taşındı)`, slotLevel: null, note: '' }, ...evs]);
}

export function executeRepeat(state: BattleState, actor: Combatant, targetId: string, rng: Rng, choice?: string, targetHex?: Offset): CommandResult {
  // Kuyruk A6: elde tutulan büyü (Produce Flame) de sürdürülür; tekrar alanları sürüme göre (`a4`/`a6`).
  const conc = heldFollow(state, actor) ?? actor.concentration;
  const spell = spells.find((s) => s.name === conc?.spell);
  const r = spell ? mechanicsAt(state, spell).repeat : undefined;
  if (!conc || !spell || !r) return fail('Tekrarlanacak bir konsantrasyon büyüsü yok.');
  if (r.moveZoneFt !== undefined) return fail(`${spell.name}: taşımak için bir altıgen seç.`);
  // Kuyruk 19: Compulsion: bonus eylemle yön (seçilen yaratığa doğru en yakın eksen); büyülenen her hedefe yazılır.
  if (r.direction) {
    if (!globalRule(state, 'spellsK19')) return fail(`${spell.name}: yön seçimi bu kural sürümünde yok.`);
    const to = state.combatants[targetId]?.pos;
    if (!to || !actor.pos || (to.col === actor.pos.col && to.row === actor.pos.row)) return fail('Yön için başka bir yaratık seç.');
    const a = offsetToAxial(actor.pos); const b = offsetToAxial(to);
    const v = { q: b.q - a.q, r: b.r - a.r };
    const dot = (d: { q: number; r: number }) => d.q * v.q + d.r * v.r + (-d.q - d.r) * (-v.q - v.r);
    const dir = AXIAL_DIRECTIONS.reduce((best, d, i) => (dot(d) > dot(AXIAL_DIRECTIONS[best] as { q: number; r: number }) ? i : best), 0);
    const evs: BattleEvent[] = Object.values(state.combatants).flatMap((c) => (c.effects ?? [])
      .filter((e) => e.id === spell.srd && e.sourceId === actor.id && e.compel)
      .map((e): BattleEvent => ({ type: 'effect_added', targetId: c.id, effect: { ...e, compel: { dir } } })));
    if (!evs.length) return fail(`${spell.name}: büyülenmiş hedef yok.`);
    return finish(state, evs);
  }
  // Kuyruk S2 (sürüm 41, Flame Blade): bırakılan bıçak bonus eylemle yeniden çağrılır.
  if (mechanicsAt(state, spell).bladeRecall) { const back = recallBlade(state, actor, spell); if (back) return back; }
  if (conc.turn === turnKey(state) && !mechanicsAt(state, spell).castOnly) return fail(`${spell.name} sonraki turlarda tekrarlanır.`);
  if (r.target === 'same' && targetId !== conc.targetId) {
    return fail(`${spell.name} yalnızca ilk hedefe (${state.combatants[conc.targetId ?? '']?.name ?? '?'}) tekrarlanır.`);
  }
  // Kuyruk A6 (Call Lightning, `repeat.point`): tekrar bulutun altındaki bir noktaya (altıgen).
  if (targetHex && ((r.point && spell.area) || mechanicsAt(state, spell).held)) {
    return castSpell(state, actor, { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex, slotLevel: conc.slotLevel }, spell, rng, true);
  }
  // Kuyruk S1 (sürüm 40, Alter Self `swapChoice`): sonraki turlarda Magic eylemiyle başka seçenek (seçim istemi; öneri
  // sıradaki seçenek). Etkinin süresi ve konsantrasyonu aynı; yalnızca seçeneğin alanları değişir.
  if (mechanicsAt(state, spell).swapChoice) return swapChoiceEvents(state, actor, spell, rng, choice);
  if (targetId === actor.id) return fail('Kendini hedefleyemezsin.');
  // A1 (Eyebite): bu büyüye karşı save'i başaranı yeniden hedefleyemez; seçilen etki ilk büyüdeki (ya da verilen) seçim.
  const tgt = state.combatants[targetId];
  if (r.noRetarget && tgt?.effects?.some((e) => e.resisted === spell.srd && e.sourceId === actor.id)) return fail(`${spell.name}: ${tgt.name} bu büyüye karşı save'i başardı, yeniden hedeflenemez.`);
  const cc = spell.mechanics.conditionChoices;
  const picked = choice && cc?.includes(choice) ? choice : cc ? conc.conditions?.find((x) => cc.includes(x.condition))?.condition : undefined;
  return castSpell(state, actor, { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId, slotLevel: conc.slotLevel, ...(picked ? { choice: picked } : {}) }, spell, rng, true);
}

/**
 * Kuyruk S1: Plane Shift: büyücü ve en çok `max` istekli dost (büyücüye ya da seçilen başka birine bitişik: el ele zincir)
 * haritadan ayrılır (`retreated`). Taraf boşalırsa savaş biter (`battle_finished.retreat`).
 */
function executeRetreat(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const spec = spell.mechanics.retreat as NonNullable<SpellMechanics['retreat']>;
  const side = (c: Combatant) => c.allegiance?.side ?? c.side;
  const ids = [...new Set([actor.id, ...(cmd.targetIds ?? (cmd.targetId ? [cmd.targetId] : []))])];
  if (ids.length - 1 > spec.max) return fail(`${spell.name}: en çok ${spec.max} dost.`);
  for (const id of ids) {
    const c = state.combatants[id];
    if (!c || c.hp <= 0 || c.offFloor) return fail('Hedef ayakta değil.');
    if (side(c) !== side(actor)) return fail(`${spell.name} yalnızca istekli dostları götürür.`);
  }
  if (state.map) {
    const linked = new Set([actor.id]);
    for (let grew = true; grew;) {
      grew = false;
      for (const id of ids) {
        if (linked.has(id)) continue;
        const c = state.combatants[id] as Combatant;
        if ([...linked].some((l) => gap(state, c, state.combatants[l] as Combatant) <= Math.max(1, Math.floor(spec.linkFt / 5)))) { linked.add(id); grew = true; }
      }
    }
    const loose = ids.find((id) => !linked.has(id));
    if (loose) return fail(`${state.combatants[loose]?.name ?? loose} el ele değil (büyücüye ya da zincire ${spec.linkFt} ft).`);
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  return finish(state, [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: ids.map((id) => state.combatants[id]?.name ?? id).join(', ') },
    { type: 'retreated', actorId: actor.id, ids, label: spell.name }]);
}

/** Kuyruk S1: Alter Self seçenek değiştirme (`spell_followup`, Magic eylemi). */
function swapChoiceEvents(state: BattleState, actor: Combatant, spell: Spell, rng: Rng, choice?: string): CommandResult {
  const base = mechanicsAt(state, spell).effect;
  const cur = actor.effects?.find((e) => e.id === spell.srd && e.sourceId === actor.id);
  if (!base?.variants || !cur) return fail(`${spell.name} üstünde değil.`);
  const keys = (base.choices ?? Object.keys(base.variants)).filter((k) => base.variants?.[k]);
  const now = keys.find((k) => cur.name === `${spell.name} (${k})`);
  const others = keys.filter((k) => k !== now);
  const pick = choice && others.includes(choice) ? choice
    : askChoice(rng, { actorId: actor.id, label: `${spell.name}: yeni seçenek`, options: others.map((k) => ({ id: k, label: k })),
      suggested: others[(Math.max(0, keys.indexOf(now ?? '')) % Math.max(1, others.length))] ?? null });
  if (!pick || !others.includes(pick)) return fail(`${spell.name}: seçenek seçilmedi.`);
  const v = base.variants[pick] ?? {};
  const wo = v.weaponOverride;
  const { weaponOverride: _w, swim: _s, ...rest } = cur;
  const effect: ActiveEffect = { ...rest, name: `${spell.name} (${pick})`, ...(v.icon ? { icon: v.icon } : {}), ...(v.swim ? { swim: true } : {}),
    ...(wo ? { weaponOverride: { weapons: wo.weapons, die: wo.dice[Math.min(wo.dice.length, tierOf(actor)) - 1] as string, ...(wo.force ? { force: true } : {}), ...(wo.type ? { type: wo.type } : {}),
      attack: actor.spellAttack ?? 0, mod: actor.spellMod } } : {}) };
  return finish(state, [{ type: 'spell_cast', actorId: actor.id, targetId: actor.id, label: `${spell.name} (seçenek: ${pick})`, slotLevel: null, note: '' },
    { type: 'effect_added', targetId: actor.id, effect }]);
}

/**
 * Görev B3: Calm Emotions. Alandaki Humanoid'ler (türsüz parti üyesi Humanoid): büyücünün dostları (isteyerek) Charmed ve
 * Frightened'a bağışık olur ve bu durumları kalkar; düşmanlar CHA save, başarısızsa kayıtsızlaşır (her turunu kaybeder,
 * hasar alınca biter). Konsantrasyon.
 */
function executeCalm(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  if (!spell.area) return fail(`${spell.name}: alan tanımı yok.`);
  const named = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  const pick = pickArea(state, actor, spell.area, spell.rangeFt, cmd.targetHex ?? named?.pos ?? null, 'büyü');
  if ('ok' in pick) return pick;
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: pick.reached.map((x) => x.c.name).join(', ') }];
  let current = applyEvents(state, events);
  const dc = actor.spellSaveDc ?? 10;
  const ability = spell.mechanics.save ?? 'cha';
  for (const { c } of pick.reached) {
    const t = current.combatants[c.id] as Combatant;
    if ((t.creatureType ?? 'humanoid') !== 'humanoid' || t.hp <= 0) continue;
    const evs: BattleEvent[] = [];
    // Kuyruk A6 (sürüm 35, `calmSaveAll`): dostlar da CHA save yapar (SRD'de isteyerek başarısız olma yok); başarısızsa
    // bağışıklık. Düşmana kayıtsızlık (`calmIndifferent`): büyücünün tarafına saldırmaz; kendisi ya da yanındaki dostu
    // hasar alınca biter.
    let allyFails = true;
    if (t.side === actor.side && spell.mechanics.calmSaveAll) {
      const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability) }, rollTag(rng, { by: t.id }));
      evs.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name, ability, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}) });
      allyFails = !save.success;
    }
    if (t.side === actor.side && !allyFails) { events.push(...evs); current = applyEvents(current, evs); continue; }
    if (t.side === actor.side) {
      // Kuyruk S1 (sürüm 40, `calmSuppress`): var olan Charmed/Frightened kalkmaz, bastırılır: büyü bitince geri gelir
      // (süreli olanın sayacı bu sırada da işler; etkiden gelen o etki sürüyorsa).
      const sup = spell.mechanics.calmSuppress ? ['Charmed', 'Frightened'].filter((cond) => t.conditions.includes(cond)).map((cond) => ({ condition: cond,
        ...(((tm) => (tm ? { timer: tm, round: state.round } : {}))((t.conditionTimers ?? []).find((x) => x.condition === cond))),
        ...((): { by?: string } => { const e = t.effects?.find((x) => x.grants?.includes(cond) || (cond === 'Charmed' && x.charm)); return e ? { by: e.id } : {}; })() })) : [];
      for (const cond of ['Charmed', 'Frightened']) if (t.conditions.includes(cond)) evs.push({ type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name });
      evs.push({ type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 9, concentration: spell.name, immune: ['Charmed', 'Frightened'], ...(sup.length ? { suppressed: sup } : {}) } });
    } else {
      const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability) }, rollTag(rng, { by: t.id }));
      evs.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name, ability, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}) });
      if (!save.success) evs.push({ type: 'effect_added', targetId: t.id, effect: spell.mechanics.calmIndifferent
        ? { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 9, concentration: spell.name, indifferentTo: actor.side, icon: '😶' }
        : { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 9, concentration: spell.name, command: 'halt', commandPersist: true, breakOnDamage: true } });
    }
    events.push(...evs);
    current = applyEvents(current, evs);
  }
  return finish(state, events);
}

/**
 * Smite büyüsü (Görev P-Paladin): bonus eylem, bu tur yakın dövüş silahıyla vurulan hedefe isabetin ek hasarı
 * (kritikse zarlar iki kat). Konsantrasyonlu olanlar (Shining Smite) hedefte koruma etkisi bırakır.
 */
function executeSmite(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const targetId = cmd.targetId ?? actor.economy.meleeHit?.targetId;
  const why = smiteProblem(actor, targetId);
  if (why) return fail(why);
  const target = targetId ? state.combatants[targetId] : undefined;
  if (!target || !isTargetable(target) || target.hp <= 0) return fail('Hedef ayakta değil.');
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const slotLevel = slot.slotLevel ?? spell.level;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slotLevel, { targetId: target.id })];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel, note: spell.text });
  events.push(...smiteEvents(applyEvents(state, events), actor, target, spell.name, slotLevel, rng));
  // Süregelen hasar (Searing Smite; Görev R2): hedefin her tur başında zar, ardından save; başarıda biter.
  const o = spell.mechanics.ongoing;
  const hit = applyEvents(state, events).combatants[target.id];
  // Görev B1: isabette save (Ensnaring Strike: STR, Large ve üstü avantajlı); başarıda süregelen etki yok.
  const ss = spell.mechanics.smiteSave;
  let caught = true;
  if (ss && hit && hit.hp > 0) {
    const big = ss.largeAdvantage && ['Large', 'Huge', 'Gargantuan'].includes(hit.size) ? 'advantage' : 'normal';
    const autoFail = (ss.ability === 'str' || ss.ability === 'dex') && autoFailsStrDexSave(hit.conditions);
    const dc = actor.spellSaveDc ?? 10;
    const save = resolveSave({ extra: saveDice(hit, ss.ability), modifier: hit.saves[ss.ability], dc, mode: saveMode(big, hit, ss.ability), autoFail }, rollTag(rng, { by: hit.id }));
    events.push({ type: 'save_resolved', actorId: actor.id, targetId: hit.id, label: spell.name, ability: ss.ability, dc, mode: big, reasons: big === 'advantage' ? [hit.size] : [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: hit.hp, effects: [], conditionsAdded: save.success ? [] : ss.grants.filter((g) => !hit.conditions.includes(g)),
      ...(save.extra ? { bonusDice: save.extra } : {}) });
    caught = !save.success;
  }
  if (o && hit && hit.hp > 0 && caught) {
    const count = parseDice(o.dice).count + Math.max(0, slotLevel - spell.level);
    events.push({ type: 'effect_added', targetId: target.id, effect: {
      id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + o.rounds - 1,
      ongoing: { dice: formatDice(count, parseDice(o.dice).sides, parseDice(o.dice).bonus), type: o.type, save: o.save, dc: actor.spellSaveDc ?? 10, ...(o.escape ? { noSave: true } : {}) },
      ...(spell.concentration ? { concentration: spell.name } : {}), ...(ss ? { grants: ss.grants } : {}),
      // Kuyruk A6 (Ensnaring Strike, `escape`): hedef ya da erişimindeki bir yaratık eylemle STR (Athletics) kontrolü.
      ...(o.escape ? { escapeCheck: { dc: actor.spellSaveDc ?? 10, allyHelp: true } } : {}),
    } });
  }
  // Kuyruk 19 (11–20): Smite of Protection (Devotion 15): Divine Smite'tan sonra Paladin ve aurasındaki dostlar sonraki
  // turunun başına dek yarım siperli.
  if (spell.id === 'divine-smite' && actor.traits?.includes('smite-of-protection') && globalRule(state, 'featuresK19')) {
    const radius = (actor.level ?? 0) >= 18 ? 6 : 2;
    for (const c of Object.values(state.combatants)) {
      if (c.side !== actor.side || c.hp <= 0 || (c.id !== actor.id && (!c.pos || !actor.pos || distance(c.pos, actor.pos) > radius))) continue;
      events.push({ type: 'effect_added', targetId: c.id, effect: { id: 'smite-of-protection', name: 'Smite of Protection', sourceId: actor.id, untilSourceTurn: true, halfCover: true, icon: '🛡' } });
    }
  }
  return finish(state, events);
}

/** Etki büyüsünün hedef sayısı (yukarı slot başına `upcast.targets`). */
export function effectTargetCount(spell: Spell, slotLevel: number): number {
  const e = spell.mechanics.effect;
  // Kuyruk S1: Plane Shift: büyücü ve en çok `max` dost.
  if (spell.mechanics.retreat) return spell.mechanics.retreat.max + 1;
  // Görev B1: çok hedefli iyileştirme (Mass Healing Word) aynı seçim kipinde.
  if (!e) return spell.mechanics.healTargets ?? 1;
  return e.targets + (spell.mechanics.upcast?.targets ?? 0) * Math.max(0, slotLevel - spell.level);
}

/**
 * Etki büyüsü (Görev R2; `kind: effect`): hedeflere süren etki koyar. Dost hedefler (Bless, Heroism, Guidance,
 * Resistance, Aid) etkiyi doğrudan alır; düşman hedefler (Bane, Command) büyünün save'ini yapar, başarısızsa alır.
 * Aynı büyücünün aynı büyüsünün önceki etkileri biter (konsantrasyon yeniden başladı).
 */
function executeEffect(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const m = spell.mechanics;
  const base = m.effect as NonNullable<typeof m.effect>;
  const ids = [...new Set(cmd.targetIds ?? (cmd.targetId ? [cmd.targetId] : base.side === 'ally' || base.self ? [actor.id] : []))];
  if (ids.length === 0) return fail('Hedef seçmelisin.');
  if (base.self && ids.some((id) => id !== actor.id)) return fail(`${spell.name} yalnızca büyücünün kendisine.`);
  // Görev B1: seçenekli biçim (Enlarge/Reduce): seçilmezse dosta ilki, düşmana ikincisi.
  const variantKeys = base.variants ? Object.keys(base.variants) : [];
  const firstSide = state.combatants[ids[0] as string]?.side;
  // Görev CLERIC: seçim listesi varsa (Bestow Curse) varsayılan ilk seçenek; yoksa biçim (Enlarge/Reduce) tarafa göre.
  const choice = cmd.choice ?? base.choices?.[0] ?? (variantKeys.length ? variantKeys[firstSide === actor.side ? 0 : 1] ?? variantKeys[0] : undefined);
  const allowed = base.choices ?? (variantKeys.length ? variantKeys : undefined);
  if (allowed && (!choice || !allowed.includes(choice))) return fail('Geçersiz seçim.');
  const spec = { ...base, ...(base.variants && choice && base.variants[choice] ? base.variants[choice] : {}) };
  const targets: Combatant[] = [];
  for (const id of ids) {
    const t = state.combatants[id];
    if (!t) return fail('Hedef bulunamadı.');
    if (!isTargetable(t) || t.hp <= 0) return fail(`${t.name} ayakta değil.`);
    if (spec.side === 'ally' && t.side !== actor.side) return fail(`${spell.name} yalnızca dostlara (ya da kendine).`);
    if (spec.side === 'enemy' && t.side === actor.side) return fail(`${spell.name} yalnızca düşmanlara.`);
    // Görev B3: yalnızca bu yaratık türleri (Charm Person: Humanoid; Animal Friendship: Beast); türsüz parti üyesi Humanoid.
    if (spec.onlyTypes && !spec.onlyTypes.includes(t.creatureType ?? 'humanoid')) return fail(`${spell.name} yalnızca: ${spec.onlyTypes.join(', ')}.`);
    // CILA: sözlü buyruk (Command, Suggestion) duyamayana (Deafened) işlemez.
    if (spec.noArmor && t.armored) return fail(`${t.name} zırh giyiyor: ${spell.name} yapılamaz.`);
    if (spec.needsHearing && (t.conditions.includes('Deafened') || t.silenced)) return fail(`${t.name} sağır (Deafened): ${spell.name} duyulmaz.`);
    if (t.id !== actor.id) {
      const r = checkReach(state, actor, t, spellReach(spell, actor));
      if (!r.ok) return fail(`${t.name}: ${r.error}`);
    }
    targets.push(t);
  }
  // Kuyruk A8 (Slow, `cubeFt`): hedefler bir küpe sığmalı (aralarındaki uzaklık küpün kenarını aşmaz).
  if (m.cubeFt && state.map && targets.some((a) => targets.some((b) => !!a.pos && !!b.pos && distance(a.pos, b.pos) * 5 > (m.cubeFt as number)))) {
    return fail(`${spell.name}: hedefler ${m.cubeFt} ft'lik bir küpün içinde olmalı.`);
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const slotLevel = slot.slotLevel ?? spell.level;
  // Görev SORCERER: Twinned Spell: hedef sayısında etkin seviye +1.
  const twin = actor.traits?.includes('mm-twinned') ? 1 : 0;
  // Kuyruk P12: okul ikiz büyüsü tek hedefli etkiye bir hedef ekler.
  const most = effectTargetCount(spell, slotLevel + twin) + (schoolTwin(actor, spell) && spec.targets === 1 ? 1 : 0);
  if (targets.length > most) return fail(`${spell.name} en çok ${most} hedef.`);
  // Görev K9b: yukarı slot süre ve konsantrasyon eşikleri (Bestow Curse).
  const atLevel = atSlot(spell, slotLevel);
  const rounds = atLevel.mechanics.effect?.rounds ?? spec.rounds;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, atLevel, slot.slotLevel)];
  // Önceki aynı büyünün etkileri biter (yeniden yapıldı).
  for (const c of Object.values(state.combatants)) {
    if (c.effects?.some((e) => e.id === spell.srd && e.sourceId === actor.id)) {
      events.push({ type: 'effect_ended', targetId: c.id, effectId: spell.srd, name: spell.name, reason: 'expired' });
    }
  }
  // Kuyruk A6 (Warding Bond, `bondRecast`): bağlı iki yaratıktan birine yeniden yapılınca (kim yaparsa) önceki bağ biter.
  if (spec.bond && spec.bondRecast) {
    const linked = new Set([actor.id, ...targets.map((x) => x.id)]);
    for (const c of Object.values(state.combatants)) for (const e of c.effects ?? []) {
      if (e.bondTo && e.sourceId !== actor.id && (linked.has(c.id) || linked.has(e.bondTo))) events.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'expired' });
    }
  }
  // Kuyruk 19: Mislead: büyücünün yerinde yanılsama ikizi (taşınır; onun gözünden görülür).
  if (m.decoy && actor.pos && state.map && globalRule(state, 'spellsK19')) {
    events.push({ type: 'zone_created', zone: { id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: `${spell.name} (ikiz)`, casterId: actor.id, side: actor.side,
      dc: 0, slotLevel: spell.level, hexes: [actor.pos], center: actor.pos, concentration: spell.name } });
  }
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: targets.length === 1 ? (targets[0] as Combatant).id : null, label: spell.name,
    slotLevel: slot.slotLevel, note: `${targets.map((x) => x.name).join(', ')}${choice ? ` (${choice})` : ''}` });
  const dc = actor.spellSaveDc ?? 0;
  const resist = spec.resist === 'chosen' ? (choice ? [choice] : []) : spec.resist;
  const wo = spec.weaponOverride;
  const effect: ActiveEffect = {
    id: spell.srd, name: base.variants && choice && base.variants[choice] ? `${spell.name} (${choice})` : spell.name, sourceId: actor.id, until: state.round + rounds - 1,
    ...(atLevel.concentration ? { concentration: spell.name } : {}),
    ...(spec.icon && base.variants && choice && base.variants[choice] ? { icon: spec.icon } : {}),
    ...(spec.dice ? { dice: { die: spec.dice.die, sign: spec.dice.sign, on: spec.dice.on, ...(spec.dice.skill === 'chosen' && choice ? { skill: choice } : {}), ...(spec.dice.single ? { single: true } : {}) } } : {}),
    ...(spec.reduce && choice ? { reduce: { die: spec.reduce.die, types: [choice] } } : {}),
    ...(spec.tempHp ? { tempHp: Math.max(0, actor.spellMod) } : {}),
    ...(spec.immune ? { immune: spec.immune } : {}),
    ...(spec.command && choice ? { command: choice as CommandWord } : {}),
    // Görev S1: uçuş, havada süzülme, yürüyememe, verilen durumlar, AC ve hız etkileri, eylemle biten.
    ...(spec.fly ? { fly: spec.fly } : {}), ...(spec.airborne ? { airborne: true } : {}), ...(spec.speedZero ? { speedZero: true } : {}),
    // Görev K9c: tırmanma ve büyülü zıplama.
    ...(spec.climb ? { climb: true } : {}), ...(spec.jumpFt ? { jumpFt: spec.jumpFt } : {}), ...(spec.waterWalk ? { waterWalk: true } : {}),
    ...(spec.auraLife ? { auraLife: spec.auraLife } : {}), ...(spec.freeMove ? { freeMove: true } : {}),
    ...(spec.retortDice && choice ? { retort: { dice: spec.retortDice, type: choice === 'cold' ? 'fire' : 'cold' } } : {}),
    // Görev CLERIC: Sanctuary (büyücünün DC'si), Warding Bond (bağ: büyücü), Bestow Curse seçenekleri (koyan: büyücü).
    ...(spec.sanctuary ? { sanctuary: { dc: actor.spellSaveDc ?? 10 } } : {}), ...(spec.bond ? { bondTo: actor.id } : {}),
    ...(spec.saveBonusAll ? { saveMod: { str: spec.saveBonusAll, dex: spec.saveBonusAll, con: spec.saveBonusAll, int: spec.saveBonusAll, wis: spec.saveBonusAll, cha: spec.saveBonusAll } } : {}),
    ...(spec.attackDisVs ? { attackDisVs: actor.id } : {}), ...(spec.turnSave ? { turnSave: { ability: spec.turnSave, dc: actor.spellSaveDc ?? 10 } } : {}),
    ...(spec.curseDamage ? { curseDamage: spec.curseDamage } : {}), ...(spec.blink ? { blink: true } : {}),
    ...(spec.grants ? { grants: spec.grants } : {}), ...(spec.ac ? { ac: spec.ac } : {}), ...(typeof spec.acMin === 'number' ? { acMin: spec.acMin } : {}),
    ...(spec.speedMult ? { speedMult: spec.speedMult } : {}), ...(spec.breakOnAct ? { breakOnAct: true } : {}),
    ...(spec.speedFt ? { speedFt: spec.speedFt } : {}), ...(spec.swim ? { swim: true } : {}),
    // Görev A5: ek bonus eylem.
    ...(spec.extraBonus ? { extraBonus: spec.extraBonus } : {}),
    // Görev A4: tasma (merkez: büyücü).
    ...(spec.leash ? { leash: { centerId: actor.id, radius: Math.floor(spec.leash.radiusFt / 5) } } : {}),
    // Görev A2: engelden geçme.
    ...(spec.phase ? { phase: spec.phase === true ? {} : spec.phase } : {}),
    // Görev B1: save'ler, direnç, saldırı dezavantajları, hasar zarları, silah, tekrar save, yasaklar, Beacon of Hope, boyut.
    ...(spec.saveAdv ? { saveAdv: spec.saveAdv } : {}),
    ...(spec.saveDis === 'chosen' ? (choice ? { saveDis: [choice as Ability] } : {}) : spec.saveDis ? { saveDis: spec.saveDis } : {}),
    ...(resist?.length ? { resist } : {}), ...(spec.attackedDis ? { attackedDis: true } : {}), ...(spec.attackDis ? { attackDis: spec.attackDis } : {}),
    ...(spec.hitDie ? { hitDie: spec.hitDie } : {}), ...(spec.damagePenalty ? { damagePenalty: spec.damagePenalty } : {}),
    ...(wo ? { weaponOverride: { weapons: wo.weapons, die: wo.dice[Math.min(wo.dice.length, tierOf(actor)) - 1] as string, ...(wo.force ? { force: true } : {}), ...(wo.type ? { type: wo.type } : {}),
      attack: actor.spellAttack ?? 0, mod: actor.spellMod } } : {}),
    ...(spec.repeatSave && m.save ? { repeatSave: { ability: m.save, dc } } : {}),
    ...(spec.disarmed ? { disarmed: true } : {}), ...(spec.levitate ? { levitate: true } : {}), ...(spec.shareSpace ? { shareSpace: true } : {}), ...(spec.squeeze ? { squeeze: true } : {}), ...(spec.noReactions ? { noReactions: true } : {}), ...(spec.noAttack ? { noAttack: true } : {}), ...(spec.noCastForm ? { noCastForm: true } : {}),
    ...(spec.deathSaveAdv ? { deathSaveAdv: true } : {}), ...(spec.maxHeal ? { maxHeal: true } : {}),
    ...(spec.size ? { size: spec.size } : {}), ...(spec.lethargy ? { lethargy: true } : {}), ...(spec.dropAtZero ? { dropAtZero: true } : {}), ...(spec.deathWard ? { deathWard: true } : {}),
    // K17 G1: Banishment (Ethereal gibi hedef alınamaz), Resilient Sphere (hasar bağışıklığı).
    ...(spec.banished ? { banished: true, ethereal: true } : {}), ...(spec.dominate ? { dominate: true, ...(spec.reactionLink ? { reactionLink: true } : {}) } : {}), ...(spec.polymorph ? { polymorph: true } : {}), ...(spec.sealed ? { sealed: true } : {}),
    // Görev B3: büyüleme, hasarla bitme, hasarla yeniden save, süren zorlama, kaçış, koyanın turunda hasar, kopyalar.
    ...(spec.charm ? { charm: true } : {}), ...(spec.breakOnDamage ? { breakOnDamage: spec.breakOnDamage } : {}), ...(spec.breakOnSpell ? { breakOnSpell: true } : {}),
    ...(spec.damageSave && m.save ? { damageSave: { ability: m.save, dc, ...(spec.damageSave.advantage ? { advantage: true } : {}) } } : {}),
    ...(spec.commandPersist ? { commandPersist: true } : {}), ...(spec.fleeDash ? { fleeDash: true } : {}),
    ...(spec.sourceTurnDamage ? { sourceTurnDamage: spec.sourceTurnDamage } : {}), ...(spec.images ? { images: spec.images } : {}),
    // Görev B4: ışık, görünmezlik.
    ...(spec.light !== undefined ? { light: spec.light } : {}), ...(spec.lightDim ? { lightDim: spec.lightDim } : {}), ...(spec.revealed ? { revealed: true } : {}),
    ...(spec.seeInvisible ? { seeInvisible: true } : {}), ...(spec.truesight ? { truesight: spec.truesight } : {}), ...(spec.attackedAdv ? { attackedAdv: true } : {}),
    // Görev B5: karanlık görüş, kontrol avantajı, Stealth aurası.
    ...(spec.darkvision ? { darkvision: spec.darkvision } : {}), ...(spec.checkAdv === 'chosen' && choice ? { checkAdv: [choice as Ability] } : {}),
    ...(spec.stealthAura ? { stealthAura: spec.stealthAura } : {}),
    // CILA: Haste ek eylemi, Slow kısıtı ve DEX −2, kontrol dezavantajı (Ray of Enfeeblement).
    ...(spec.extraAction ? { extraAction: true } : {}), ...(spec.slowed ? { slowed: true } : {}),
    ...(spec.checkDis === 'chosen' ? (ABILITIES.includes(choice as Ability) ? { checkDis: [choice as Ability] } : {}) : spec.checkDis ? { checkDis: spec.checkDis } : {}), ...(spec.saveMod ? { saveMod: spec.saveMod } : {}),
    // Kuyruk A4: duruma karşı save avantajı (Protection from Poison), Blindsight/Truesight'ın deldiği etki (Blur, Mirror Image),
    // büyücünün sonraki turunun sonunda biten etki.
    ...(spec.saveAdvAgainst ? { saveAdvAgainst: spec.saveAdvAgainst } : {}), ...(spec.sensesPierce ? { sensesPierce: true } : {}),
    ...(spec.untilSourceTurnEnd ? { endAfterSourceTurn: state.round } : {}),
    // Kuyruk A4 (Expeditious Retreat): süresince bonus eylemle Dash.
    ...(spec.bonusGrant ? { bonusGrant: spec.bonusGrant } : {}),
    ...(spec.blindRetort ? { blindRetort: { types: spec.blindRetort, dc } } : {}),
    // Kuyruk A6: veride olduğu gibi yazılan alanlar.
    ...(spec.raw ? rawEffect(spec.raw, actor, dc) : {}),
    // Kuyruk A7 (Dragon's Breath, `breathGrant`): dokunulan dosta nefes (seçilen tür, yukarı slot zarı, büyücünün DC'si).
    ...(spec.breathGrant ? { breath: { srd: spell.srd, resource: '', save: 'dex' as Ability, dc,
      dice: damageExpr(m, actor, tierOf(actor), slotLevel - spell.level, spell.school, spell.name), damageType: choice ?? m.damageType ?? 'fire',
      shapes: [{ shape: 'cone' as const, sizeFt: spec.breathGrant }] } } : {}),
  };
  let current = applyEvents(state, events);
  for (const t0 of targets) {
    const t = current.combatants[t0.id] as Combatant;
    let applies = true;
    const ability = m.save;
    const hostile = spec.side === 'enemy' || (spec.side === 'any' && t.side !== actor.side);
    if (hostile && ability) {
      const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(t.conditions);
      const base0 = spec.saveAdvantage ? 'advantage' : 'normal';
      const save = resolveSave({ ...(m.illusion && truesightSees(state, t, actor) ? { autoSuccess: true } : {}), extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode(base0, t, ability, actor), autoFail, against: [...(spec.grants ?? []), 'spell'] }, rollTag(rng, { by: t.id }));
      const ev: BattleEvent = {
        type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name, ability, dc, mode: base0, reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}),
      };
      events.push(ev);
      current = applyEvents(current, [ev]);
      applies = !save.success;
      // Görev B1: başarıda hafif etki (Ray of Enfeeblement: sonraki saldırısı dezavantajlı, büyücünün sonraki turuna dek).
      if (save.success && spec.onSave) {
        const light: BattleEvent = { type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 1,
          ...(spec.onSave.attackDis ? { attackDis: spec.onSave.attackDis } : {}), ...(spec.onSave.untilSourceTurn ? { untilSourceTurn: true } : {}),
          ...(spec.onSave.speedZero ? { speedZero: true } : {}), ...(spec.onSave.untilOwnTurnEnd ? { untilOwnTurnEnd: true } : {}),
          ...(spec.onSave.icon ? { icon: spec.onSave.icon } : {}) } };
        events.push(light);
        current = applyEvents(current, [light]);
      }
    }
    if (!applies) continue;
    const added: BattleEvent[] = [];
    if (spec.hpBonus) added.push({ type: 'hp_boosted', targetId: t.id, amount: spec.hpBonus + (m.upcast?.hp ?? 0) * Math.max(0, slotLevel - spell.level), label: spell.name });
    // Görev S1: anında geçici HP (False Life); geçici HP birikmez, büyüğü kalır (reducer).
    else if (spec.tempHpNow) {
      // Görev WARLOCK: Fiendish Vigor: Invocation'la slotsuz yapılınca zarın en yükseği.
      const vigor = !!actor.traits?.includes('fiendish-vigor') && !!actor.atWill?.[spell.name] && slotLevel === spell.level;
      const dice = parseDice(spec.tempHpNow);
      const roll = (vigor ? dice.count * dice.sides + dice.bonus : rollDice(spec.tempHpNow, rollTag(rng, { by: actor.id, kind: 'heal' })).total)
        + (m.upcast?.hp ?? 0) * Math.max(0, slotLevel - spell.level);
      added.push({ type: 'temp_hp', targetId: t.id, amount: roll, label: spell.name });
    }
    else added.push({ type: 'effect_added', targetId: t.id, effect: { ...effect, ...(spec.command ? { until: state.round + 1 } : {}),
      // Kuyruk 19: Banishment: yerli olmayan tam sürede geri dönmez.
      ...(spec.banished && globalRule(state, 'spellsK19') && EXTRAPLANAR.includes(t.creatureType ?? '') ? { banishForever: true } : {}),
      // Mage Armor: AC tabanı 13 + hedefin DEX değiştiricisi.
      ...(spec.acMin === 'mageArmor' ? { acMin: 13 + t.modifiers.dex } : {}) } });
    // Kuyruk 18 H2: Polymorph: biçim ve geçici HP (seçim `choice` = Beast kimliği).
    if (spec.polymorph) added.push(...polymorphEvents(current, actor, t, cmd.choice));
    // Görev B5: yapılınca kalkan durumlar (Protection from Poison: Poisoned).
    for (const cond of spec.cureOnCast ?? []) {
      if (t.conditions.includes(cond)) added.push({ type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name });
    }
    events.push(...added);
    current = applyEvents(current, added);
  }
  // Kuyruk A4 (Expeditious Retreat): yapıldığı bonus eylemin parçası olarak Dash.
  if (spec.dashOnCast) events.push({ type: 'dashed', actorId: actor.id });
  return finish(state, events);
}

/**
 * Görev S1: dostu iyileştiren büyüler. `cure`: ilk bulunan durumu kaldırır (Lesser Restoration); `revive: stabilize`
 * 0 HP'de ölmekte olanı stabil eder (Spare the Dying); `revive: revive` ölü dostu 1 HP ile kaldırır (Revivify; "son bir
 * dakikada ölmüş" denetimi yok, savaş bir dakikadan kısa sayılır).
 */
/** Görev B1 (Revivify): ölüm turu bilinmiyorsa (eski kayıt) ya da son 10 turdaysa. */
const withinMinute = (state: BattleState, c: Combatant) => c.diedRound === undefined || state.round - c.diedRound <= 10;

function executeRestore(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const m = spell.mechanics;
  // Revivify: ölü dost haritada çizilmez; hedefsiz yapılırsa dokunma menzilindeki ilk ölü dost.
  const t = cmd.targetId ? state.combatants[cmd.targetId]
    : m.revive === 'revive' ? Object.values(state.combatants).find((c) => c.side === actor.side && c.life === 'dead' && !c.summon && !c.civilian
      && withinMinute(state, c) && (!state.map || (!!c.pos && !!actor.pos && distance(c.pos, actor.pos) <= 1))) : undefined;
  if (!t) return fail(m.revive === 'revive' ? 'Dokunma menzilinde ölü dost yok.' : 'Hedef seçmelisin.');
  if (t.side !== actor.side || t.civilian && t.side !== 'party') return fail(`${spell.name} yalnızca dostlara.`);
  if (t.summon) return fail(`${spell.name} çağrılmış yaratığa yapılmaz.`);
  let ev: BattleEvent;
  if (m.kind === 'cure' && m.restoreChoices && globalRule(state, 'spellsK19')) {
    if (t.life === 'dead') return fail(`${t.name} ölü.`);
    const opts = restoreOptions(t);
    const pick = !cmd.choice || cmd.choice === 'gr-auto' ? opts[0] : opts.find((o) => o.key === cmd.choice || o.key.startsWith(`${cmd.choice}:`));
    if (!pick) return fail(`${t.name} üzerinde kaldırılacak ${cmd.choice && cmd.choice !== 'gr-auto' ? 'bu' : 'bir'} etki yok.`);
    ev = pick.event(spell.name);
  } else if (m.kind === 'cure') {
    const cond = (m.cures ?? []).find((x) => t.conditions.includes(x));
    if (t.life === 'dead') return fail(`${t.name} ölü.`);
    if (!cond) return fail(`${t.name} üzerinde kaldırılacak durum yok (${(m.cures ?? []).join(', ')}).`);
    ev = { type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name };
    // Kuyruk 19: Contagion: verdiği durumu kaldırmak için hedef CON save'i başarmalı; başarıda hastalık da biter.
    const stub = (t.effects ?? []).find((e) => e.stubborn && e.grants?.includes(cond));
    if (stub?.stubborn) {
      const sv = stub.stubborn;
      const r = resolveSave({ extra: saveDice(t, sv.ability), modifier: t.saves[sv.ability], dc: sv.dc, mode: saveMode('normal', t, sv.ability) }, rollTag(rng, { by: t.id }));
      const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
      if (!slot.ok) return slot;
      const note: BattleEvent = { type: 'map_note', text: `${t.name}: ${stub.name} için ${sv.ability.toUpperCase()} save ${r.total}/${sv.dc} — ${r.success ? 'hastalık geçti' : `${cond} kalıyor`}` };
      return finish(state, [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: t.id, label: spell.name, slotLevel: slot.slotLevel, note: t.name }, note,
        ...(r.success ? [ev, { type: 'effect_ended', targetId: t.id, effectId: stub.id, name: stub.name, reason: 'dispelled' } as BattleEvent] : [])]);
    }
  } else if (m.revive === 'stabilize') {
    if (t.life !== 'dying') return fail(`${t.name} ölmekte değil.`);
    ev = { type: 'life_restored', targetId: t.id, hpAfter: 0, life: 'stable', label: spell.name };
  } else {
    if (t.life !== 'dead') return fail(`${t.name} ölü değil.`);
    // Görev B1: son bir dakika (10 tur) içinde ölmüş olmalı.
    if (!withinMinute(state, t)) return fail(`${t.name} bir dakikadan (10 tur) uzun süre önce öldü.`);
    ev = { type: 'life_restored', targetId: t.id, hpAfter: 1, life: 'alive', label: spell.name };
  }
  if (t.id !== actor.id) {
    const r = checkReach(state, actor, { ...t, hp: Math.max(1, t.hp) }, spellReach(spell, actor));
    if (!r.ok) return r;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  return finish(state, [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: t.id, label: spell.name, slotLevel: slot.slotLevel, note: t.name }, ev]);
}

/**
 * Kuyruk 19: Greater Restoration'ın kaldırabileceği etkiler (SRD 5.2.1 sırasıyla): 1 Exhaustion, Charmed, Petrified,
 * lanet (Bestow Curse), yetenek puanı azalması, HP maksimumu azalması. Anahtar seçimle eşleşir (`gr-ability:str`).
 */
function restoreOptions(t: Combatant): Array<{ key: string; event: (label: string) => BattleEvent }> {
  const out: Array<{ key: string; event: (label: string) => BattleEvent }> = [];
  if ((t.exhaustion ?? 0) > 0) out.push({ key: 'gr-exhaustion', event: (label) => ({ type: 'exhaustion_changed', targetId: t.id, level: (t.exhaustion ?? 0) - 1, reason: label }) });
  for (const c of ['Charmed', 'Petrified']) {
    if (t.conditions.includes(c)) out.push({ key: c, event: (label) => ({ type: 'condition_changed', targetId: t.id, condition: c, present: false, reason: label }) });
  }
  const curse = (t.effects ?? []).find((e) => CURSES.includes(e.id));
  if (curse) out.push({ key: 'gr-curse', event: () => ({ type: 'effect_ended', targetId: t.id, effectId: curse.id, name: curse.name ?? curse.id, reason: 'dispelled' }) });
  for (const ab of Object.keys(t.abilityLoss ?? {}) as Array<keyof Combatant['modifiers']>) {
    out.push({ key: `gr-ability:${ab}`, event: (label) => ({ type: 'drain_restored', targetId: t.id, what: ab, label }) });
  }
  if (t.maxHpLoss) out.push({ key: 'gr-maxhp', event: (label) => ({ type: 'drain_restored', targetId: t.id, what: 'maxHp', label }) });
  return out;
}

/** Işınlanma büyüsü (Görev S1; Misty Step): büyücü görebildiği boş bir altıgene; fırsat saldırısı yok. */
function executeTeleport(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const spec = spell.mechanics.teleport;
  if (!spec) return fail('Bu büyünün ışınlanma verisi yok.');
  if (!cmd.targetHex) return fail('Işınlanılacak altıgeni seçmelisin.');
  const why = teleportProblem(state, actor, cmd.targetHex, spec);
  if (why) return fail(why);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: hexLabel(cmd.targetHex) }];
  // Kuyruk 19: Dimension Door: 5 ft içindeki istekli dost varışın 5 ft yakınına; yer yoksa ikisi de 4d6 Force alır, ışınlanma olmaz.
  const ally = spec.companion && cmd.targetId && cmd.targetId !== actor.id && globalRule(state, 'spellsK19') ? state.combatants[cmd.targetId] : undefined;
  if (ally) {
    if (ally.side !== actor.side || !ally.pos || !actor.pos || ally.hp <= 0 || distance(ally.pos, actor.pos) > 1) return fail(`${spell.name}: yanında götürülecek dost 5 ft içinde olmalı.`);
    const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
    const spot = neighbors(cmd.targetHex, size).find((h) => !(h.col === actor.pos?.col && h.row === actor.pos?.row) && teleportProblem(state, ally, h, { ...spec, rangeFt: 10000, sight: false }) === null);
    if (!spot) {
      for (const who of [actor, ally]) {
        const d = rollDice('4d6', rollTag(rng, { kind: 'damage', by: actor.id }));
        const adj = adjustDamage(d.total, 'force', profileIn(state, who, true));
        const fx = damageEffects(who, adj.amount, 'force', false, rng);
        events.push({ type: 'effect_tick', targetId: who.id, effectId: spell.srd, name: `${spell.name} (yer yok)`, damageRolls: d.rolls, appliedDamage: adj.amount, damageType: 'force', targetHpAfter: fx.hpAfter, effects: fx.effects });
      }
      return finish(state, events);
    }
    events.push(...withArrival(state, events, [teleportEvent(actor, cmd.targetHex, spell.name), teleportEvent(ally, spot, spell.name)], rng));
    return finish(state, events);
  }
  events.push(...withArrival(state, events, [teleportEvent(actor, cmd.targetHex, spell.name)], rng));
  return finish(state, events);
}

/** Kuyruk 19: başka düzlemden gelen yaratık türleri (Banishment, Dispel Evil and Good). */
export const EXTRAPLANAR = ['aberration', 'celestial', 'elemental', 'fey', 'fiend'];

/**
 * Kuyruk 19: Dispel Evil and Good özel işlevleri (Magic eylemi, büyü biter): Break Enchantment (dokunulan dostta türlerden
 * gelen Charmed/Frightened kalkar) ya da Dismissal (5 ft içindeki türden yaratık CHA save; başarısızsa kendi düzlemine).
 */
export function dispelEvilSpellOf(state: BattleState, actor: Combatant): Spell | null {
  const sp = spells.find((x) => x.name === actor.concentration?.spell);
  return sp?.mechanics.endFunctions && globalRule(state, 'spellsK19') ? sp : null;
}
export function executeDispelEvil(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const sp = dispelEvilSpellOf(state, actor);
  const picked = state.combatants[targetId];
  // Kuyruk K64b (sürüm 48, "specifically target Undead"): Dismissal bedendeki ele geçirene ulaşır (konumu bedenin
  // altıgeni); ele geçiren seçilir ya da asıl tarafı büyücünün tarafı olmayan bir beden seçilirse ondaki ele geçirene.
  const viaBody = picked && sp && possessionOn(state) ? (picked.possessing ? picked
    : ((e) => (e && homeSide(picked) !== homeSide(actor) ? state.combatants[e.sourceId] : undefined))(possessedEffect(picked))) : undefined;
  const bodyAt = viaBody ? possessorAt(state, viaBody) : null;
  const t = viaBody && bodyAt ? { ...viaBody, pos: bodyAt } : picked;
  if (!sp || !t || !t.pos || !actor.pos || t.hp <= 0) return fail('Hedef yok.');
  if (distance(t.pos, actor.pos) > 1) return fail(`${sp.name}: hedef 5 ft içinde olmalı.`);
  const types = sp.mechanics.ward?.disadvantageFromTypes ?? [];
  const end: BattleEvent = { type: 'concentration_ended', actorId: actor.id, label: sp.name };
  // Kuyruk K64a (sürüm 48): Break Enchantment ele geçirmeyi de bitirir ("The target is no longer possessed"); ele
  // geçirilmiş dost bedeni ele geçirenin tarafında olduğu için asıl tarafa bakılır.
  const poss = possessionOn(state) ? possessedEffect(t) : undefined;
  if (poss && homeSide(t) === homeSide(actor) && types.includes(state.combatants[poss.sourceId]?.creatureType ?? '')) {
    return finish(state, [{ type: 'spell_cast', actorId: actor.id, targetId: t.id, label: `${sp.name}: Break Enchantment`, slotLevel: null, note: t.name },
      ...possessionEndEvents(state, t, 'dispel', poss.name), end]);
  }
  if (t.side === actor.side) {
    const evil = (id: string) => types.includes(state.combatants[id]?.creatureType ?? '');
    const effs = (t.effects ?? []).filter((e) => evil(e.sourceId) && (e.grants ?? []).some((g) => g === 'Charmed' || g === 'Frightened' || e.charm));
    const timed = (t.conditionTimers ?? []).filter((x) => (x.condition === 'Charmed' || x.condition === 'Frightened') && x.sourceId && evil(x.sourceId));
    if (!effs.length && !timed.length) return fail(`${t.name} üzerinde bu türlerden gelen Charmed/Frightened yok.`);
    return finish(state, [{ type: 'spell_cast', actorId: actor.id, targetId: t.id, label: `${sp.name}: Break Enchantment`, slotLevel: null, note: t.name },
      ...effs.map((e): BattleEvent => ({ type: 'effect_ended', targetId: t.id, effectId: e.id, name: e.name, reason: 'dispelled' })),
      ...timed.map((x): BattleEvent => ({ type: 'condition_changed', targetId: t.id, condition: x.condition, present: false, reason: sp.name })), end]);
  }
  if (!types.includes(t.creatureType ?? '')) return fail(`${sp.name}: Dismissal yalnızca ${types.join(', ')}.`);
  const r = resolveSave({ extra: saveDice(t, 'cha'), modifier: t.saves.cha, dc: actor.spellSaveDc ?? 10, mode: saveMode('normal', t, 'cha') }, rollTag(rng, { by: t.id }));
  return finish(state, [{ type: 'spell_cast', actorId: actor.id, targetId: t.id, label: `${sp.name}: Dismissal`, slotLevel: null, note: t.name },
    { type: 'map_note', text: `${t.name}: CHA save ${r.total}/${actor.spellSaveDc ?? 10} — ${r.success ? 'direndi' : 'kendi düzlemine gönderildi'}` },
    ...(r.success ? [] : [{ type: 'exiled', targetId: t.id, label: sp.name } as BattleEvent]),
    // Kuyruk K64b: sürgün edilen ele geçirenin bedeni serbest kalır (ele geçiren belirmez).
    ...(!r.success && viaBody && bodyAt ? possessionEndEvents(applyEvents(state, [{ type: 'exiled', targetId: t.id, label: sp.name }]), state.combatants[viaBody.possessing ?? ''] as Combatant, 'dispel', sp.name) : []), end]);
}

/** Kuyruk 19: Tree Stride sürerken her tur bir kez ağaçtan ağaca (5 ft hareket). */
export function strideSpellOf(state: BattleState, actor: Combatant): Spell | null {
  const sp = spells.find((x) => x.name === actor.concentration?.spell);
  return sp?.mechanics.teleport?.reuse && globalRule(state, 'spellsK19') ? sp : null;
}
export function executeStride(state: BattleState, actor: Combatant, to: Offset): CommandResult {
  const sp = strideSpellOf(state, actor);
  const spec = sp?.mechanics.teleport;
  if (!sp || !spec) return fail('Tree Stride sürmüyor.');
  if (actor.economy.treeStride) return fail(`${sp.name} bu tur kullanıldı.`);
  if (speedHexes(actor) - actor.movementUsed < 1) return fail(`${sp.name}: 5 ft hareket kalmadı.`);
  const why = teleportProblem(state, actor, to, spec);
  if (why) return fail(why);
  return finish(state, [{ ...teleportEvent(actor, to, sp.name), cost: 1, stride: true } as BattleEvent]);
}

/**
 * Güçlendirme büyüsü (Görev P-Paladin): `selfBuff` büyücünün silah saldırılarına süren etki (Divine Favor, Magic
 * Weapon); `ward` konsantrasyon hedefinde koruma (Shield of Faith, Protection from Evil and Good).
 */
function executeBuff(state: BattleState, actor: Combatant, cmd: CastCommand, spell0: Spell, rng?: Rng): CommandResult {
  // Görev K9b: yukarı slot bonus eşikleri (Magic Weapon +2 / +3) slot harcanınca uygulanır.
  const slot0 = spendSlot(actor, spell0.level, cmd.slotLevel, spell0.name, cmd.free);
  const spell = slot0.ok ? atSlot(spell0, slot0.slotLevel) : spell0;
  const m = spell.mechanics;
  let target: Combatant = actor;
  // Kuyruk A7 (Magic Weapon, `touchBuff`): dokunulan (dostun) silahı; büyücünün kendisi de olabilir.
  if (m.ward || m.touchBuff) {
    const t = cmd.targetId ? state.combatants[cmd.targetId] : actor;
    if (!t) return fail('Hedef bulunamadı.');
    if (t.side !== actor.side || !isTargetable(t) || t.hp <= 0) return fail('Yalnızca ayaktaki bir dosta (ya da kendine).');
    if (t.id !== actor.id) {
      const r = checkReach(state, actor, t, spellReach(spell, actor));
      if (!r.ok) return r;
    }
    target = t;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel, m.ward ? { targetId: target.id } : {})];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel, note: spell.text });
  if (m.selfBuff) {
    const b = m.selfBuff;
    // Kuyruk A7: dokunulan silah; yeniden yapınca önceki silahtaki biter.
    const to = m.touchBuff ? target : actor;
    if (m.touchBuff) for (const c of Object.values(state.combatants)) if (c.id !== to.id && (c.buffs ?? []).some((x) => x.source === spell.name && x.by === actor.id)) events.push({ type: 'buff_removed', targetId: c.id, source: spell.name });
    // Kuyruk S1 (sürüm 40, `enchantOne`): tek silah (komutun seçimi ya da seçim istemi; öneri ilk silah); başka bir
    // Magic Weapon'ın büyülediği silah yeniden büyülenmez.
    let enchantBy: string | undefined;
    if (m.enchantOne) {
      const taken = new Set((to.buffs ?? []).filter((x) => x.enchantBy && x.by !== actor.id).map((x) => x.enchantBy));
      const ws = [...new Map(to.weaponOptions.filter((o) => o.weaponId && o.weaponId !== 'unarmed-strike' && !o.spell && !taken.has(o.weaponId)).map((o) => [o.weaponId as string, o])).values()];
      // Silah kimliği olmayan savaşçıda (canavar, eski kayıt) güçlendirme bütün silah saldırılarına (eski davranış).
      enchantBy = !ws.length ? undefined : cmd.choice && ws.some((o) => o.weaponId === cmd.choice) ? cmd.choice
        : !rng ? ws[0]?.weaponId : askChoice(rng, { actorId: actor.id, label: `${spell.name}: silah`, options: ws.map((o) => ({ id: o.weaponId as string, label: o.label })), suggested: ws[0]?.weaponId ?? null }) ?? ws[0]?.weaponId;
    }
    events.push({ type: 'buff_added', targetId: to.id, buff: {
      source: spell.name, by: actor.id, until: state.round + b.rounds - 1, ...(enchantBy ? { enchantBy } : {}),
      ...(b.attackBonus ? { attackBonus: b.attackBonus } : {}), ...(b.damageBonus ? { damageBonus: b.damageBonus } : {}),
      ...(b.extraDamage ? { extraDamage: b.upcastDice && (slot.slotLevel ?? spell.level) > spell.level
        ? formatDice(parseDice(b.extraDamage).count + parseDice(b.upcastDice).count * ((slot.slotLevel ?? spell.level) - spell.level), parseDice(b.extraDamage).sides) : b.extraDamage, damageType: b.damageType ?? '' } : {}),
      ...(b.anyAttack ? { anyAttack: true } : {}), ...(b.withinFt ? { withinFt: b.withinFt } : {}), ...(b.extraTypes ? { extraTypes: b.extraTypes } : {}),
    } });
  }
  // Kuyruk 19: büyücüye bağlı yürüyen alan (Conjure Minor Elementals: düşmanlara zorlu arazi).
  if (m.buffZone && state.map) {
    events.push({ type: 'zone_created', zone: {
      id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side,
      dc: actor.spellSaveDc ?? 10, slotLevel: slot.slotLevel ?? spell.level, hexes: [], anchorId: actor.id, radius: m.buffZone.anchorSelf ?? 3,
      ...(spell.concentration ? { concentration: spell.name } : {}), ...(m.buffZone.rounds !== undefined ? { until: state.round + m.buffZone.rounds - 1 } : {}),
    } });
  }
  return finish(state, events);
}
