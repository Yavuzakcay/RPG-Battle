/** Büyü yapma: slot harcama, saldırı ve save büyüleri, iyileştirme, durumlar. */
import { profileIn } from './zones';
import { sightConditions } from './sight';
import type { Ability } from '../rules/abilities';
import { attackDice, saveDice } from './effectDice';
import { saveMode, spellTimerEvents } from './durations';
import { getEnvironment, spells, type Spell, type SpellMechanics } from '../data';
import type { AreaShape } from '../rules/area';
import { autoFailsStrDexSave, attackSources, isAutoCritical } from '../rules/conditions';
import { adjustDamage, applyHealing, halfDamage } from '../rules/damage';
import { parseDice, rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { resolveAttack, resolveSave } from '../rules/attack';
import { combineModes, environmentSources, invertMode, type ModeSource } from '../rules/modes';
import { checkReach, spellReach } from './range';
import { heightOf } from './cover';
import { distance } from '../rules/hex';
import { hexLabel } from './movement';
import type { Cover } from '../map/terrain';
import { damageEffects } from './damage-effects';
import { atSlot, fail, finish, isTargetable, upcastDiceCount, withinFiveFt, type CommandResult, damageProfile } from './common';
import { elusiveFilter, saveDamage, traitSources } from './classTraits';
import { turnKey } from './economy';
import { concentrationEvent, spendSlot } from './slots';
import { executeSummon } from './summons';
import { teleportEvent, teleportProblem } from './teleport';
import { pickArea } from './areaAttack';
import { auraSave, hitExtras, weaponAttackEvents, weaponHexNear } from './features';
import { effectiveAc, smiteEvents, smiteProblem, wardSources } from './divine';
import { pushAwayEvents } from './forced';
import { applyEvents } from './reduce';
import { executeZoneCast, silencedAt } from './zones';
import { counterspellCheck, damagedReactions, hitReactions, targetedReactions } from './reactions';
import type { ActiveEffect, CommandWord, BattleEvent, BattleState, Combatant, Command, ExtraDamage } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Zar ifadesini kurar: cantrip seviye ölçeği ve büyü modifier'ı dahil. */
function damageExpr(m: SpellMechanics, actor: Combatant, tier: number, upcast = 0): string {
  const spec = parseDice(m.damage ?? '');
  const count = (m.scalesWithLevel ? spec.count * tier : spec.count) + upcastDiceCount(m, upcast);
  const bonus = spec.bonus + (m.addCastingMod ? actor.spellMod : 0);
  return `${count}d${spec.sides}${bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : String(bonus)}`;
}


const tierOf = (actor: Combatant) =>
  1 + (actor.level >= 5 ? 1 : 0) + (actor.level >= 11 ? 1 : 0) + (actor.level >= 17 ? 1 : 0);

const SHAPE_NAME: Record<AreaShape, string> = {
  sphere: 'küre', cube: 'küp', cone: 'koni', line: 'çizgi', emanation: 'yayılım', wall: 'duvar',
};


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
  const pick = pickArea(state, actor, area, spell.rangeFt, aim, 'büyü');
  if ('ok' in pick) return pick;
  const reached = pick.reached.map((x) => ({ c: x.c, lof: { blocked: false, cover: x.cover } }));
  if (named && !reached.some((x) => x.c.id === named.id)) {
    return fail(`${named.name} alanın dışında veya tam siper arkasında.`);
  }

  const slot = repeat ? repeatSlot(actor, spell) : spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...(repeat ? [] : concentrationEvent(state, actor, spell, slot.slotLevel))];
  const where = area.origin === 'point' && aim ? `, merkez ${hexLabel(aim)}` : '';
  events.push({
    type: 'spell_cast', actorId: actor.id, targetId: null, label: label ?? (repeat ? `${spell.name} (tekrar)` : spell.name), slotLevel: slot.slotLevel,
    note: `Alan: ${area.sizeFt} ft ${SHAPE_NAME[area.shape]}${where}; etkilenen: ${reached.map((x) => x.c.name).join(', ') || 'kimse'}.`,
  });

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
  const damage = m.damage ? rollDice(damageExpr(m, actor, tierOf(actor), upcast), rollTag(rng, { kind: 'damage', by: actor.id })) : { rolls: [] as number[], total: 0 };
  // Yayılım (Spirit Guardians): yapılınca içindekilere girer; yaratık turda bir kez save yapar.
  const aura = m.lingering === 'aura' ? { aura: { casterId: actor.id, turn: turnKey(state) } } : {};
  let current = applyEvents(state, events);
  for (const { c, lof } of reached) {
    const t = current.combatants[c.id];
    if (!t) continue;
    const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(t.conditions);
    const dexCover = ability === 'dex' ? lof.cover : 0;
    const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0, mode: saveMode(mode, t, ability), autoFail }, rollTag(rng, { by: t.id }));
    const amount = saveDamage(t, ability, save.success, damage.total, !!m.halfOnSave);
    const adjusted = amount > 0 ? adjustDamage(amount, m.damageType, profileIn(state, t)) : { amount: 0, note: null };
    const fx = damageEffects(t, adjusted.amount, m.damageType ?? '', false, rng);
    // Görev B3: başarısızlıkta süren etki varsa durumlar etkiyle gelir (Fear, Hypnotic Pattern).
    const fe = m.failEffect;
    const added = !save.success && !fe?.grants ? (m.conditions ?? []).filter((x) => !t.conditions.includes(x)) : [];
    const ev: BattleEvent = {
      type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name,
      ability, dc: actor.spellSaveDc ?? 0, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: damage.rolls, rawDamage: damage.total, appliedDamage: adjusted.amount, damageType: m.damageType ?? '',
      damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: added,
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
      ...aura, ...(save.extra ? { bonusDice: save.extra } : {}),
    };
    events.push(ev);
    current = applyEvents(current, [ev]);
    const timed = spellTimerEvents(current, spell.name, t.id, added, ability, actor.spellSaveDc ?? 0);
    events.push(...timed);
    current = applyEvents(current, timed);
    if (fe && !save.success && fx.hpAfter > 0) {
      const add: BattleEvent = { type: 'effect_added', targetId: t.id, effect: {
        id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + (fe.rounds ?? 10) - 1,
        ...(spell.concentration ? { concentration: spell.name } : {}), ...(fe.grants ? { grants: fe.grants } : {}),
        ...(fe.speedZero ? { speedZero: true } : {}), ...(fe.breakOnDamage ? { breakOnDamage: true } : {}), ...(fe.charm ? { charm: true } : {}),
        ...(fe.command ? { command: fe.command[0] as CommandWord } : {}), ...(fe.commandPersist ? { commandPersist: true } : {}),
        ...(fe.fleeDash ? { fleeDash: true } : {}), ...(fe.repeatSave ? { repeatSave: { ability, dc: actor.spellSaveDc ?? 0 } } : {}),
        // Görev B4: Faerie Fire (görünmez olamaz, saldırılar avantajlı, ışık).
        ...(fe.revealed ? { revealed: true } : {}), ...(fe.attackedAdv ? { attackedAdv: true } : {}), ...(fe.light !== undefined ? { light: fe.light } : {}),
      } };
      events.push(add);
      current = applyEvents(current, [add]);
    }
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (adjusted.amount > 0) {
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
  return finish(state, events);
}

/**
 * Haritasız savaşta yayılım (Spirit Guardians): büyücüyle aynı yükseklikteki düşmanlar
 * yayılımın içinde sayılır.
 */
function executeMaplessAura(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
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
export function executeCast(state: BattleState, actor: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  const spell = spells.find((s) => s.name === cmd.spellName);
  if (!spell) return fail(`Büyü bulunamadı: ${cmd.spellName}`);
  if (!actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  const watched = Object.values(state.combatants).some((c) => c.side !== actor.side && c.reactions?.some((r) => r.kind === 'counterspell'));
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
function healAmount(expr: string, actor: Combatant, target: Combatant, rng: Rng): number {
  if (target.effects?.some((e) => e.maxHeal)) return diceMax(expr);
  return rollDice(expr, rollTag(rng, { kind: 'heal', by: actor.id })).total;
}

function castSpell(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng, repeat = false): CommandResult {
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
  // Görev B2: Silence içinde sözlü bileşenli büyü yapılamaz.
  const hush = !spell.noVerbal && actor.pos ? silencedAt(state, actor.pos) : undefined;
  if (hush) return fail(`${hush.name}: sessizlikte sözlü (V) bileşenli büyü yapılamaz.`);
  // Görev B2: kalıcı zemin etkisi ve geçici engel (çağırmayla yürüyen alanlar `executeSummon`'da).
  if (m.zone && m.kind !== 'summon') return executeZoneCast(state, actor, cmd, spell, rng, repeat);
  if (m.calm) return executeCalm(state, actor, cmd, spell, rng);
  if (m.castOnly && !repeat) return executeCastOnly(state, actor, cmd, spell);
  if (m.weaponStrike) return executeTrueStrike(state, actor, cmd, spell, rng);
  if (m.kind === 'heal' && m.healTargets && cmd.targetIds) return executeHealMany(state, actor, cmd, spell, rng);
  if (m.kind === 'smite') return executeSmite(state, actor, cmd, spell, rng);
  if (m.kind === 'buff') return executeBuff(state, actor, cmd, spell);
  if (m.kind === 'effect') return executeEffect(state, actor, cmd, spell, rng);
  if (m.kind === 'summon') return executeSummon(state, actor, cmd, spell, rng);
  if (m.kind === 'teleport') return executeTeleport(state, actor, cmd, spell);
  if (m.kind === 'cure' || m.kind === 'revive') return executeRestore(state, actor, cmd, spell);
  if (m.kind === 'dispel') return executeDispel(state, actor, cmd, spell, rng);
  if (m.kind !== 'utility' && m.kind !== 'sleep' && !m.damage && !m.conditions && !m.pushFt && !m.failEffect) {
    return fail('Bu büyünün mekaniği tanımlı değil.');
  }

  // Haritalı savaşta alan büyüleri (save ve uyku) alandaki herkesi etkiler.
  if (state.map && spell.area && (m.kind === 'save' || m.kind === 'sleep')) {
    return executeAreaCast(state, actor, cmd, spell, rng, repeat);
  }
  if (!state.map && m.lingering === 'aura') return executeMaplessAura(state, actor, cmd, spell, rng);

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
    if (spell.rangeFt === 0) return fail(`${spell.name} yalnızca büyücüyü etkiler.`);
    const r = checkReach(state, actor, target, spellReach(spell));
    if (!r.ok) return r;
    rangeSources = r.sources;
    cover = r.cover;
  }

  const slot = repeat ? repeatSlot(actor, spell) : spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
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
    const hpAfter = applyHealing(target.hp, target.maxHp, healAmount(damageExpr(m, actor, tier, upcast), actor, target, rng));
    events.push({
      type: 'healed', actorId: actor.id, targetId: target.id, label: spell.name,
      amount: hpAfter - target.hp, targetHpAfter: hpAfter,
    });
    return finish(state, events);
  }

  if (m.kind === 'save') {
    const ability = m.save;
    if (!ability) return fail('Bu büyünün save türü tanımlı değil.');
    const reasons = environmentSources(env, tag);
    const mode = invertMode(combineModes(reasons)); // büyü avantajlıysa hedefin save'i dezavantajlı olur
    const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(target.conditions);
    const dexCover = ability === 'dex' ? cover : 0;
    const save = resolveSave({ extra: saveDice(target, ability), modifier: target.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0, mode: saveMode(mode, target, ability), autoFail }, rollTag(rng, { by: target.id }));
    let raw = 0;
    let rolls: number[] = [];
    if (m.damage) {
      const d = rollDice(damageExpr(m, actor, tier, upcast), rollTag(rng, { kind: 'damage', by: actor.id }));
      raw = d.total;
      rolls = d.rolls;
    }
    const amount = saveDamage(target, ability, save.success, raw, !!m.halfOnSave);
    const adjusted = amount > 0 ? adjustDamage(amount, m.damageType, profileIn(state, target)) : { amount: 0, note: null };
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
  for (let r = 0; r < rays; r++) {
    const t = current.combatants[target.id];
    if (!t || t.hp <= 0) break;
    const expr = damageExpr(m, actor, tier, upcast);
    let ev: BattleEvent;
    if (m.kind === 'attack') {
      const sources = [
        ...environmentSources(env, tag),
        ...attackSources({
          ...sightConditions(actor, t), attackerSide: actor.side,
          attackerHeight: heightOf(current, actor), targetHeight: heightOf(current, t), ranged: rangedSpell, spell: true,
          targetAsleep: t.asleep === true,
        }),
        ...rangeSources,
        ...wardSources(current, actor, t, { melee: !rangedSpell }),
        // Görev F: Precise Hunter (Steady Aim yalnızca silah saldırısında harcanır).
        ...traitSources(current, actor, t).filter((x) => x.reason !== 'Steady Aim'),
      ];
      const mode = combineModes(elusiveFilter(t, sources));
      const res = resolveAttack(
        { attackBonus: actor.spellAttack ?? 0, targetAc: effectiveAc(current, t) + cover, mode, damage: expr, autoCritical: isAutoCritical(t.conditions, withinFiveFt(current, actor, t, !rangedSpell)), extra: attackDice(actor) },
        rollTag(rng, { by: actor.id }),
      );
      const raw = res.damage?.total ?? 0;
      const adj = res.hit ? adjustDamage(raw, m.damageType, profileIn(state, t)) : { amount: 0, note: null };
      // Hunter's Mark: işaretli hedefe büyü saldırısı isabetinde de ek hasar.
      let bonus = res.hit ? hitExtras(current, actor, t, { mode, critical: res.critical }, rng) : { extras: [] as ExtraDamage[] };
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
        const a = adjustDamage(Math.floor(d.total / 2), m.damageType, profileIn(state, t));
        return { rolls: d.rolls, raw: Math.floor(d.total / 2), amount: a.amount, note: a.note };
      })() : null;
      const total = hit ? hr?.damage ?? 0 : miss?.amount ?? 0;
      if (hr?.events.length) { events.push(...hr.events); current = applyEvents(current, hr.events); }
      const fx = damageEffects(t, total, m.damageType ?? '', hit && res.critical, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: spell.name, mode,
        reasons: sources.map((s) => s.reason), d20: res.d20.rolls, natural: res.d20.kept, total: res.total,
        targetAc: hr?.ac ?? ac, hit, critical: hit && res.critical, fumble: res.fumble,
        damageRolls: hit ? res.damage?.rolls ?? [] : miss?.rolls ?? [], rawDamage: hit ? raw : miss?.raw ?? 0, appliedDamage: total,
        damageType: m.damageType ?? '', damageNote: hit ? adj.note : miss?.note ?? null, targetHpAfter: fx.hpAfter, effects: fx.effects,
        ...(cover === 2 || cover === 5 ? { cover } : {}),
        ...(bonus.extras.length > 0 ? { extra: bonus.extras } : {}),
        ...(hr?.reacted ? { reacted: hr.reacted } : {}),
        ...(res.extra ? { bonusDice: res.extra } : {}),
      };
    } else {
      const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }));
      const adj = guard?.blocked ? { amount: 0, note: null } : adjustDamage(d.total, m.damageType, profileIn(state, t));
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
    }
    // Hasar alanın tepkisi (Hellish Rebuke; Görev R1).
    if (ev.type === 'attack_resolved' && ev.appliedDamage > 0) {
      const back = damagedReactions(current, t.id, actor.id, rng);
      events.push(...back);
      current = applyEvents(current, back);
      if ((current.combatants[actor.id]?.hp ?? 0) <= 0) break;
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

/**
 * Görev B1: isabetten sonra hedefte kalan etki: gecikmeli hasar (Acid Arrow; hedefin sonraki turunun sonunda), save
 * başarısızsa saldırıları dezavantajlı (Heat Metal; büyücünün sonraki turunun başına dek); verilen hasarın bir kısmı
 * kadar büyücü iyileşir (Vampiric Touch).
 */
/** Gecikmeli hasar zarı yukarı slotla: büyünün uygulanan yukarı slot zarı (aynı zar boyunda) eklenir. */
function upcastDelayed(dice: string, m: SpellMechanics, upcast: number): string {
  const extra = upcastDiceCount(m, upcast);
  const d = parseDice(dice);
  return extra > 0 ? `${d.count + extra}d${d.sides}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : String(d.bonus)) : ''}` : dice;
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
    if (applies) {
      events.push({ type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 1,
        ...(a.attackDis ? { attackDis: a.attackDis } : {}), ...(a.untilSourceTurn ? { untilSourceTurn: true } : {}),
        // CILA: gecikmeli hasar da yukarı slotla artar (Acid Arrow: slot başına +1d4).
        ...(a.delayed ? { delayed: { ...a.delayed, dice: upcastDelayed(a.delayed.dice, m, upcast) } } : {}), ...(spell.concentration ? { concentration: spell.name } : {}),
        ...(a.revealed ? { revealed: true } : {}), ...(a.light !== undefined ? { light: a.light } : {}) } });
    }
  }
  const self = state.combatants[actor.id];
  if (m.drain && damage > 0 && self && self.hp > 0) {
    const hpAfter = applyHealing(self.hp, self.maxHp, Math.floor(damage * m.drain));
    events.push({ type: 'healed', actorId: actor.id, targetId: actor.id, label: spell.name, amount: hpAfter - self.hp, targetHpAfter: hpAfter });
  }
  return events;
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
      const r = checkReach(state, actor, t, spellReach(spell));
      if (!r.ok) return fail(`${t.name}: ${r.error}`);
    }
    targets.push(t);
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const upcast = (slot.slotLevel ?? spell.level) - spell.level;
  const events: BattleEvent[] = [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel,
    note: targets.map((x) => x.name).join(', ') }];
  const expr = damageExpr(m, actor, tierOf(actor), upcast);
  for (const t of targets) {
    const hpAfter = applyHealing(t.hp, t.maxHp, healAmount(expr, actor, t, rng));
    events.push({ type: 'healed', actorId: actor.id, targetId: t.id, label: spell.name, amount: hpAfter - t.hp, targetHpAfter: hpAfter });
  }
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
  const mod = actor.spellMod;
  const die = base.weaponDamage ?? base.damage;
  const option = { ...base, label: `${base.label} (${spell.name})`, attackBonus: actor.spellAttack ?? base.attackBonus, abilityMod: mod,
    damage: /^\d+d\d+$/.test(die) ? `${die}${mod === 0 ? '' : mod > 0 ? `+${mod}` : mod}` : base.damage, altDamageType: 'radiant' };
  const extra = spell.mechanics.weaponStrike?.extra[tierOf(actor) - 1] ?? '';
  const pre: BattleEvent[] = [{ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: null, note: base.label }];
  if (extra) pre.push({ type: 'effect_added', targetId: actor.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round, hitDie: extra, hitType: 'radiant' } });
  const mid = applyEvents(state, pre);
  const r = weaponAttackEvents(mid, mid.combatants[actor.id] as Combatant, mid.combatants[target.id] as Combatant, option, rng);
  if (!r.ok) return r;
  const events = [...pre, ...r.events];
  if (extra && applyEvents(state, events).combatants[actor.id]?.effects?.some((e) => e.id === spell.srd)) {
    events.push({ type: 'effect_ended', targetId: actor.id, effectId: spell.srd, name: spell.name, reason: 'used' });
  }
  return finish(state, events);
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
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const m = spell.mechanics;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: 'hazır: saldırı "Büyüyü sürdür" ile' }];
  if (m.selfLight !== undefined || spell.concentration) {
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
  if (!cmd.targetId) return fail('Hedef seçmelisin.');
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id !== actor.id) {
    const r = checkReach(state, actor, target, spellReach(spell));
    if (!r.ok) return r;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const effects = (target.effects ?? []).filter((e) => (spell.mechanics.curseOnly ? CURSES.includes(e.id) : e.id.startsWith('spells:')));
  const events: BattleEvent[] = [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel, note: effects.length ? effects.map((e) => e.name).join(', ') : 'kaldırılacak büyü yok' }];
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
  return finish(state, events);
}

export function executeRepeat(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const conc = actor.concentration;
  const spell = spells.find((s) => s.name === conc?.spell);
  const r = spell?.mechanics.repeat;
  if (!conc || !spell || !r) return fail('Tekrarlanacak bir konsantrasyon büyüsü yok.');
  if (conc.turn === turnKey(state) && !spell.mechanics.castOnly) return fail(`${spell.name} sonraki turlarda tekrarlanır.`);
  if (r.target === 'same' && targetId !== conc.targetId) {
    return fail(`${spell.name} yalnızca ilk hedefe (${state.combatants[conc.targetId ?? '']?.name ?? '?'}) tekrarlanır.`);
  }
  if (targetId === actor.id) return fail('Kendini hedefleyemezsin.');
  return castSpell(state, actor, { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId, slotLevel: conc.slotLevel }, spell, rng, true);
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
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
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
    if (t.side === actor.side) {
      for (const cond of ['Charmed', 'Frightened']) if (t.conditions.includes(cond)) evs.push({ type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name });
      evs.push({ type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 9, concentration: spell.name, immune: ['Charmed', 'Frightened'] } });
    } else {
      const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability) }, rollTag(rng, { by: t.id }));
      evs.push({ type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name, ability, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}) });
      if (!save.success) evs.push({ type: 'effect_added', targetId: t.id, effect: { id: spell.srd, name: spell.name, sourceId: actor.id, until: state.round + 9,
        concentration: spell.name, command: 'halt', commandPersist: true, breakOnDamage: true } });
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
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
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
      ongoing: { dice: `${count}d${parseDice(o.dice).sides}`, type: o.type, save: o.save, dc: actor.spellSaveDc ?? 10 },
      ...(spell.concentration ? { concentration: spell.name } : {}), ...(ss ? { grants: ss.grants } : {}),
    } });
  }
  return finish(state, events);
}

/** Etki büyüsünün hedef sayısı (yukarı slot başına `upcast.targets`). */
export function effectTargetCount(spell: Spell, slotLevel: number): number {
  const e = spell.mechanics.effect;
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
  const choice = cmd.choice ?? (variantKeys.length ? variantKeys[firstSide === actor.side ? 0 : 1] ?? variantKeys[0] : base.choices?.[0]);
  const allowed = base.choices ?? (variantKeys.length ? variantKeys : undefined);
  if (allowed && (!choice || !allowed.includes(choice))) return fail('Geçersiz seçim.');
  const spec = { ...base, ...(base.variants && choice ? base.variants[choice] : {}) };
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
    if (spec.needsHearing && t.conditions.includes('Deafened')) return fail(`${t.name} sağır (Deafened): ${spell.name} duyulmaz.`);
    if (t.id !== actor.id) {
      const r = checkReach(state, actor, t, spellReach(spell));
      if (!r.ok) return fail(`${t.name}: ${r.error}`);
    }
    targets.push(t);
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const slotLevel = slot.slotLevel ?? spell.level;
  if (targets.length > effectTargetCount(spell, slotLevel)) return fail(`${spell.name} en çok ${effectTargetCount(spell, slotLevel)} hedef.`);
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
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: targets.length === 1 ? (targets[0] as Combatant).id : null, label: spell.name,
    slotLevel: slot.slotLevel, note: `${targets.map((x) => x.name).join(', ')}${choice ? ` (${choice})` : ''}` });
  const dc = actor.spellSaveDc ?? 0;
  const resist = spec.resist === 'chosen' ? (choice ? [choice] : []) : spec.resist;
  const wo = spec.weaponOverride;
  const effect: ActiveEffect = {
    id: spell.srd, name: base.variants && choice ? `${spell.name} (${choice})` : spell.name, sourceId: actor.id, until: state.round + rounds - 1,
    ...(atLevel.concentration ? { concentration: spell.name } : {}),
    ...(spec.icon && base.variants ? { icon: spec.icon } : {}),
    ...(spec.dice ? { dice: { die: spec.dice.die, sign: spec.dice.sign, on: spec.dice.on, ...(spec.dice.skill === 'chosen' && choice ? { skill: choice } : {}), ...(spec.dice.single ? { single: true } : {}) } } : {}),
    ...(spec.reduce && choice ? { reduce: { die: spec.reduce.die, types: [choice] } } : {}),
    ...(spec.tempHp ? { tempHp: Math.max(0, actor.spellMod) } : {}),
    ...(spec.immune ? { immune: spec.immune } : {}),
    ...(spec.command && choice ? { command: choice as CommandWord } : {}),
    // Görev S1: uçuş, havada süzülme, yürüyememe, verilen durumlar, AC ve hız etkileri, eylemle biten.
    ...(spec.fly ? { fly: spec.fly } : {}), ...(spec.airborne ? { airborne: true } : {}), ...(spec.speedZero ? { speedZero: true } : {}),
    // Görev K9c: tırmanma ve büyülü zıplama.
    ...(spec.climb ? { climb: true } : {}), ...(spec.jumpFt ? { jumpFt: spec.jumpFt } : {}),
    ...(spec.grants ? { grants: spec.grants } : {}), ...(spec.ac ? { ac: spec.ac } : {}), ...(typeof spec.acMin === 'number' ? { acMin: spec.acMin } : {}),
    ...(spec.speedMult ? { speedMult: spec.speedMult } : {}), ...(spec.breakOnAct ? { breakOnAct: true } : {}),
    ...(spec.speedFt ? { speedFt: spec.speedFt } : {}),
    // Görev B1: save'ler, direnç, saldırı dezavantajları, hasar zarları, silah, tekrar save, yasaklar, Beacon of Hope, boyut.
    ...(spec.saveAdv ? { saveAdv: spec.saveAdv } : {}),
    ...(spec.saveDis === 'chosen' ? (choice ? { saveDis: [choice as Ability] } : {}) : spec.saveDis ? { saveDis: spec.saveDis } : {}),
    ...(resist?.length ? { resist } : {}), ...(spec.attackedDis ? { attackedDis: true } : {}), ...(spec.attackDis ? { attackDis: spec.attackDis } : {}),
    ...(spec.hitDie ? { hitDie: spec.hitDie } : {}), ...(spec.damagePenalty ? { damagePenalty: spec.damagePenalty } : {}),
    ...(wo ? { weaponOverride: { weapons: wo.weapons, die: wo.dice[Math.min(wo.dice.length, tierOf(actor)) - 1] as string, ...(wo.force ? { force: true } : {}),
      attack: actor.spellAttack ?? 0, mod: actor.spellMod } } : {}),
    ...(spec.repeatSave && m.save ? { repeatSave: { ability: m.save, dc } } : {}),
    ...(spec.noReactions ? { noReactions: true } : {}), ...(spec.noAttack ? { noAttack: true } : {}),
    ...(spec.deathSaveAdv ? { deathSaveAdv: true } : {}), ...(spec.maxHeal ? { maxHeal: true } : {}),
    ...(spec.size ? { size: spec.size } : {}), ...(spec.lethargy ? { lethargy: true } : {}), ...(spec.dropAtZero ? { dropAtZero: true } : {}),
    // Görev B3: büyüleme, hasarla bitme, hasarla yeniden save, süren zorlama, kaçış, koyanın turunda hasar, kopyalar.
    ...(spec.charm ? { charm: true } : {}), ...(spec.breakOnDamage ? { breakOnDamage: true } : {}),
    ...(spec.damageSave && m.save ? { damageSave: { ability: m.save, dc, ...(spec.damageSave.advantage ? { advantage: true } : {}) } } : {}),
    ...(spec.commandPersist ? { commandPersist: true } : {}), ...(spec.fleeDash ? { fleeDash: true } : {}),
    ...(spec.sourceTurnDamage ? { sourceTurnDamage: spec.sourceTurnDamage } : {}), ...(spec.images ? { images: spec.images } : {}),
    // Görev B4: ışık, görünmezlik.
    ...(spec.light !== undefined ? { light: spec.light } : {}), ...(spec.revealed ? { revealed: true } : {}),
    ...(spec.seeInvisible ? { seeInvisible: true } : {}), ...(spec.attackedAdv ? { attackedAdv: true } : {}),
    // Görev B5: karanlık görüş, kontrol avantajı, Stealth aurası.
    ...(spec.darkvision ? { darkvision: spec.darkvision } : {}), ...(spec.checkAdv === 'chosen' && choice ? { checkAdv: [choice as Ability] } : {}),
    ...(spec.stealthAura ? { stealthAura: spec.stealthAura } : {}),
    // CILA: Haste ek eylemi, Slow kısıtı ve DEX −2, kontrol dezavantajı (Ray of Enfeeblement).
    ...(spec.extraAction ? { extraAction: true } : {}), ...(spec.slowed ? { slowed: true } : {}),
    ...(spec.checkDis ? { checkDis: spec.checkDis } : {}), ...(spec.saveMod ? { saveMod: spec.saveMod } : {}),
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
      const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode(base0, t, ability), autoFail }, rollTag(rng, { by: t.id }));
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
      const roll = rollDice(spec.tempHpNow, rollTag(rng, { by: actor.id, kind: 'heal' })).total + (m.upcast?.hp ?? 0) * Math.max(0, slotLevel - spell.level);
      added.push({ type: 'temp_hp', targetId: t.id, amount: roll, label: spell.name });
    }
    else added.push({ type: 'effect_added', targetId: t.id, effect: { ...effect, ...(spec.command ? { until: state.round + 1 } : {}),
      // Mage Armor: AC tabanı 13 + hedefin DEX değiştiricisi.
      ...(spec.acMin === 'mageArmor' ? { acMin: 13 + t.modifiers.dex } : {}) } });
    // Görev B5: yapılınca kalkan durumlar (Protection from Poison: Poisoned).
    for (const cond of spec.cureOnCast ?? []) {
      if (t.conditions.includes(cond)) added.push({ type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name });
    }
    events.push(...added);
    current = applyEvents(current, added);
  }
  return finish(state, events);
}

/**
 * Görev S1: dostu iyileştiren büyüler. `cure`: ilk bulunan durumu kaldırır (Lesser Restoration); `revive: stabilize`
 * 0 HP'de ölmekte olanı stabil eder (Spare the Dying); `revive: revive` ölü dostu 1 HP ile kaldırır (Revivify; "son bir
 * dakikada ölmüş" denetimi yok, savaş bir dakikadan kısa sayılır).
 */
/** Görev B1 (Revivify): ölüm turu bilinmiyorsa (eski kayıt) ya da son 10 turdaysa. */
const withinMinute = (state: BattleState, c: Combatant) => c.diedRound === undefined || state.round - c.diedRound <= 10;

function executeRestore(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const m = spell.mechanics;
  // Revivify: ölü dost haritada çizilmez; hedefsiz yapılırsa dokunma menzilindeki ilk ölü dost.
  const t = cmd.targetId ? state.combatants[cmd.targetId]
    : m.revive === 'revive' ? Object.values(state.combatants).find((c) => c.side === actor.side && c.life === 'dead' && !c.summon && !c.civilian
      && withinMinute(state, c) && (!state.map || (!!c.pos && !!actor.pos && distance(c.pos, actor.pos) <= 1))) : undefined;
  if (!t) return fail(m.revive === 'revive' ? 'Dokunma menzilinde ölü dost yok.' : 'Hedef seçmelisin.');
  if (t.side !== actor.side || t.civilian && t.side !== 'party') return fail(`${spell.name} yalnızca dostlara.`);
  if (t.summon) return fail(`${spell.name} çağrılmış yaratığa yapılmaz.`);
  let ev: BattleEvent;
  if (m.kind === 'cure') {
    const cond = (m.cures ?? []).find((x) => t.conditions.includes(x));
    if (t.life === 'dead') return fail(`${t.name} ölü.`);
    if (!cond) return fail(`${t.name} üzerinde kaldırılacak durum yok (${(m.cures ?? []).join(', ')}).`);
    ev = { type: 'condition_changed', targetId: t.id, condition: cond, present: false, reason: spell.name };
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
    const r = checkReach(state, actor, { ...t, hp: Math.max(1, t.hp) }, spellReach(spell));
    if (!r.ok) return r;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  return finish(state, [...slot.events, { type: 'spell_cast', actorId: actor.id, targetId: t.id, label: spell.name, slotLevel: slot.slotLevel, note: t.name }, ev]);
}

/** Işınlanma büyüsü (Görev S1; Misty Step): büyücü görebildiği boş bir altıgene; fırsat saldırısı yok. */
function executeTeleport(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const spec = spell.mechanics.teleport;
  if (!spec) return fail('Bu büyünün ışınlanma verisi yok.');
  if (!cmd.targetHex) return fail('Işınlanılacak altıgeni seçmelisin.');
  const why = teleportProblem(state, actor, cmd.targetHex, spec);
  if (why) return fail(why);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: hexLabel(cmd.targetHex) },
    teleportEvent(actor, cmd.targetHex, spell.name)];
  return finish(state, events);
}

/**
 * Güçlendirme büyüsü (Görev P-Paladin): `selfBuff` büyücünün silah saldırılarına süren etki (Divine Favor, Magic
 * Weapon); `ward` konsantrasyon hedefinde koruma (Shield of Faith, Protection from Evil and Good).
 */
function executeBuff(state: BattleState, actor: Combatant, cmd: CastCommand, spell0: Spell): CommandResult {
  // Görev K9b: yukarı slot bonus eşikleri (Magic Weapon +2 / +3) slot harcanınca uygulanır.
  const slot0 = spendSlot(actor, spell0.level, cmd.slotLevel, spell0.name);
  const spell = slot0.ok ? atSlot(spell0, slot0.slotLevel) : spell0;
  const m = spell.mechanics;
  let target: Combatant = actor;
  if (m.ward) {
    const t = cmd.targetId ? state.combatants[cmd.targetId] : actor;
    if (!t) return fail('Hedef bulunamadı.');
    if (t.side !== actor.side || !isTargetable(t) || t.hp <= 0) return fail('Yalnızca ayaktaki bir dosta (ya da kendine).');
    if (t.id !== actor.id) {
      const r = checkReach(state, actor, t, spellReach(spell));
      if (!r.ok) return r;
    }
    target = t;
  }
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel, m.ward ? { targetId: target.id } : {})];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel, note: spell.text });
  if (m.selfBuff) {
    const b = m.selfBuff;
    events.push({ type: 'buff_added', targetId: actor.id, buff: {
      source: spell.name, by: actor.id, until: state.round + b.rounds - 1,
      ...(b.attackBonus ? { attackBonus: b.attackBonus } : {}), ...(b.damageBonus ? { damageBonus: b.damageBonus } : {}),
      ...(b.extraDamage ? { extraDamage: b.extraDamage, damageType: b.damageType ?? '' } : {}),
    } });
  }
  return finish(state, events);
}
