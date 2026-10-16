/** Büyü yapma: slot harcama, saldırı ve save büyüleri, iyileştirme, durumlar. */
import { getEnvironment, spells, type Spell, type SpellMechanics } from '../data';
import { areaHexes, type AreaShape } from '../rules/area';
import { distance, isInside, sameHex, type Offset } from '../rules/hex';
import { autoFailsStrDexSave, attackSources, isAutoCritical } from '../rules/conditions';
import { adjustDamage, applyHealing, halfDamage } from '../rules/damage';
import { parseDice, rollDice, type Rng } from '../rules/dice';
import { resolveAttack, resolveSave } from '../rules/attack';
import { combineModes, environmentSources, invertMode, type ModeSource } from '../rules/modes';
import { checkReach, spellReach } from './range';
import { coverFrom, heightOf, sightBlockedBetween } from './cover';
import { hexLabel, terrainAt } from './movement';
import type { Cover } from '../map/terrain';
import { damageEffects } from './damage-effects';
import { fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { freeCast, turnKey } from './economy';
import { auraSave, hitExtras, weaponHexNear } from './features';
import { pushAwayEvents } from './forced';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Zar ifadesini kurar: cantrip seviye ölçeği ve büyü modifier'ı dahil. */
function damageExpr(m: SpellMechanics, actor: Combatant, tier: number, upcast = 0): string {
  const spec = parseDice(m.damage ?? '');
  const count = (m.scalesWithLevel ? spec.count * tier : spec.count) + (m.upcastDice ? upcast : 0);
  const bonus = spec.bonus + (m.addCastingMod ? actor.spellMod : 0);
  return `${count}d${spec.sides}${bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : String(bonus)}`;
}

const profileOf = (t: Combatant) => ({
  resistances: t.resistances,
  immunities: t.immunities,
  vulnerabilities: t.vulnerabilities,
});

const tierOf = (actor: Combatant) =>
  1 + (actor.level >= 5 ? 1 : 0) + (actor.level >= 11 ? 1 : 0) + (actor.level >= 17 ? 1 : 0);

/**
 * Büyü seviyesine (veya istenen daha yüksek seviyeye) uygun ilk dolu slotu harcar. Ranger
 * Hunter's Mark'ı Favored Enemy kullanımıyla slotsuz yapar (büyü seviyesinde sayılır).
 */
function spendSlot(actor: Combatant, level: number, wanted?: number, spellName = ''):
  { ok: true; slotLevel: number | null; events: BattleEvent[] } | Failure {
  if (level === 0) return { ok: true, slotLevel: null, events: [] };
  if (freeCast(actor, spellName, wanted)) {
    return {
      ok: true, slotLevel: level,
      events: [{ type: 'feature_used', actorId: actor.id, feature: 'favoredEnemy', remaining: actor.resources.favoredEnemy - 1 }],
    };
  }
  const from = Math.max(level, wanted ?? level);
  for (let i = from - 1; i < 9; i++) {
    if ((actor.spellSlots[i] ?? 0) > 0) {
      return {
        ok: true, slotLevel: i + 1,
        events: [{ type: 'slot_spent', actorId: actor.id, level: i + 1, remaining: (actor.spellSlots[i] ?? 1) - 1 }],
      };
    }
  }
  return fail('Uygun büyü slotu kalmadı.');
}

const SHAPE_NAME: Record<AreaShape, string> = {
  sphere: 'küre', cube: 'küp', cone: 'koni', line: 'çizgi', emanation: 'yayılım',
};

/** Konsantrasyon büyüsü başlıyor: önceki konsantrasyon biter (reducer). */
function concentrationEvent(state: BattleState, actor: Combatant, spell: Spell, slotLevel: number | null,
  extra: { targetId?: string; pos?: Offset } = {}): BattleEvent[] {
  if (!spell.concentration) return [];
  return [{ type: 'concentration_started', actorId: actor.id, spell: spell.name, slotLevel: slotLevel ?? spell.level, turn: turnKey(state), ...extra }];
}

/**
 * Alan büyüsü (haritalı savaş). Noktadan çıkan alanlarda nokta menzil içinde ve büyücünün
 * görüşünde olmalı; büyücüden çıkanlarda nokta yalnızca yön verir. Alandaki yaratıklar
 * (büyücü dahil, "yalnızca düşmanlar" seçilmediyse) etkilenir; çıkış noktasından tam siper
 * arkasında kalanlar etkilenmez. Siper ve görüş çıkış noktasından hesaplanır; DEX save'ine
 * siper eklenir. Hasar bütün hedefler için bir kez atılır (SRD 5.2.1 save'li etkiler).
 */
function executeAreaCast(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const area = spell.area;
  const m = spell.mechanics;
  if (!area || !state.map || !actor.pos) return fail('Alan büyüsü yalnızca haritalı savaşta.');
  const named = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (cmd.targetId && !named) return fail('Hedef bulunamadı.');
  const aim = cmd.targetHex ?? named?.pos ?? null;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  if (area.shape !== 'emanation') {
    if (!aim) return fail('Hedef altıgen seçmelisin.');
    if (!isInside(aim, size)) return fail('Hedef altıgen harita dışında.');
    if (area.origin === 'self' && sameHex(aim, actor.pos)) return fail('Yön için başka bir altıgen seçmelisin.');
  }
  if (area.origin === 'point' && aim) {
    const d = distance(actor.pos, aim);
    if (d * 5 > spell.rangeFt) return fail(`Nokta menzil dışında: ${d} altıgen (${d * 5} ft), menzil ${spell.rangeFt} ft.`);
    const t = terrainAt(state, aim);
    if (t.blocksSight || t.outOfBounds) return fail(`${hexLabel(aim)} noktasına büyü yapılamaz (${t.name}).`);
    const wall = sightBlockedBetween(state, actor.pos, aim);
    if (wall) return fail(`Nokta görülemiyor: arada ${wall} var.`);
  }
  const origin = area.origin === 'point' && aim ? aim : actor.pos;
  const hexes = areaHexes(area, actor.pos, aim, size);
  const inArea = (c: Combatant) => c.pos !== null && hexes.some((h) => sameHex(h, c.pos as Offset));
  const candidates = Object.values(state.combatants).filter(
    (c) => isTargetable(c) && inArea(c) && (area.targets === 'all' || c.side !== actor.side),
  );
  const reached = candidates
    .map((c) => ({ c, lof: coverFrom(state, origin, c, [actor.id]) }))
    .filter((x) => !x.lof.blocked);
  if (named && !reached.some((x) => x.c.id === named.id)) {
    return fail(`${named.name} alanın dışında veya tam siper arkasında.`);
  }

  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel)];
  const where = area.origin === 'point' && aim ? `, merkez ${hexLabel(aim)}` : '';
  events.push({
    type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel,
    note: `Alan: ${area.sizeFt} ft ${SHAPE_NAME[area.shape]}${where}; etkilenen: ${reached.map((x) => x.c.name).join(', ') || 'kimse'}.`,
  });

  if (m.kind === 'sleep') {
    // Uyku: zar toplamı, HP'si en düşükten başlayarak yaratıkları uyutur.
    const roll = rollDice('5d8', rng);
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
  const damage = m.damage ? rollDice(damageExpr(m, actor, tierOf(actor), upcast), rng) : { rolls: [] as number[], total: 0 };
  // Yayılım (Spirit Guardians): yapılınca içindekilere girer; yaratık turda bir kez save yapar.
  const aura = m.lingering === 'aura' ? { aura: { casterId: actor.id, turn: turnKey(state) } } : {};
  let current = applyEvents(state, events);
  for (const { c, lof } of reached) {
    const t = current.combatants[c.id];
    if (!t) continue;
    const autoFail = (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(t.conditions);
    const dexCover = ability === 'dex' ? lof.cover : 0;
    const save = resolveSave({ modifier: t.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0, mode, autoFail }, rng);
    const amount = !save.success ? damage.total : m.halfOnSave ? halfDamage(damage.total) : 0;
    const adjusted = amount > 0 ? adjustDamage(amount, m.damageType, profileOf(t)) : { amount: 0, note: null };
    const fx = damageEffects(t, adjusted.amount, m.damageType ?? '', false, rng);
    const added = !save.success ? (m.conditions ?? []).filter((x) => !t.conditions.includes(x)) : [];
    const ev: BattleEvent = {
      type: 'save_resolved', actorId: actor.id, targetId: t.id, label: spell.name,
      ability, dc: actor.spellSaveDc ?? 0, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: damage.rolls, rawDamage: damage.total, appliedDamage: adjusted.amount, damageType: m.damageType ?? '',
      damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: added,
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
      ...aura,
    };
    events.push(ev);
    current = applyEvents(current, [ev]);
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

export function executeCast(state: BattleState, actor: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  const spell = spells.find((s) => s.name === cmd.spellName);
  if (!spell) return fail(`Büyü bulunamadı: ${cmd.spellName}`);
  if (!actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  const m = spell.mechanics;
  if (m.kind !== 'utility' && m.kind !== 'sleep' && !m.damage && !m.conditions) {
    return fail('Bu büyünün mekaniği tanımlı değil.');
  }

  // Haritalı savaşta alan büyüleri (save ve uyku) alandaki herkesi etkiler.
  if (state.map && spell.area && (m.kind === 'save' || m.kind === 'sleep')) {
    return executeAreaCast(state, actor, cmd, spell, rng);
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

  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const slotLevel = slot.slotLevel;
  const upcast = (slotLevel ?? spell.level) - spell.level;
  const linger = m.kind === 'mark' && target ? { targetId: target.id }
    : m.lingering === 'weapon' && target ? (() => { const pos = weaponHexNear(state, target, actor.pos); return pos ? { pos } : {}; })()
      : {};
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, slotLevel, linger)];

  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${spell.name} ${spell.text}`.toLowerCase();
  const tier = tierOf(actor);

  if (m.kind === 'utility' || !target) {
    events.push({
      type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel,
      note: `Etki elle uygulanır: ${spell.text}`,
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
    const roll = rollDice('5d8', rng);
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
    const roll = rollDice(damageExpr(m, actor, tier), rng);
    const hpAfter = applyHealing(target.hp, target.maxHp, roll.total);
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
    const save = resolveSave({ modifier: target.saves[ability] + dexCover, dc: actor.spellSaveDc ?? 0, mode, autoFail }, rng);
    let raw = 0;
    let rolls: number[] = [];
    if (m.damage) {
      const d = rollDice(damageExpr(m, actor, tier, upcast), rng);
      raw = d.total;
      rolls = d.rolls;
    }
    const amount = !save.success ? raw : m.halfOnSave ? halfDamage(raw) : 0;
    const adjusted = amount > 0 ? adjustDamage(amount, m.damageType, profileOf(target)) : { amount: 0, note: null };
    const fx = damageEffects(target, adjusted.amount, m.damageType ?? '', false, rng);
    const added = !save.success ? (m.conditions ?? []).filter((c) => !target.conditions.includes(c)) : [];
    events.push({
      type: 'save_resolved', actorId: actor.id, targetId: target.id, label: spell.name,
      ability, dc: actor.spellSaveDc ?? 0, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: rolls, rawDamage: raw, appliedDamage: adjusted.amount, damageType: m.damageType ?? '',
      damageNote: adjusted.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: added,
      ...(dexCover === 2 || dexCover === 5 ? { cover: dexCover } : {}),
    });
    return finish(state, events);
  }

  // Saldırı büyüleri (attack) ve otomatik isabet eden büyüler (auto): her ışın ayrı çözülür.
  const rays = m.raysByLevel ? tier : (m.rays ?? 1);
  let current = applyEvents(state, events);
  for (let r = 0; r < rays; r++) {
    const t = current.combatants[target.id];
    if (!t || t.hp <= 0) break;
    const expr = damageExpr(m, actor, tier, upcast);
    let ev: BattleEvent;
    if (m.kind === 'attack') {
      const sources = [
        ...environmentSources(env, tag),
        ...attackSources({
          attackerConditions: actor.conditions, targetConditions: t.conditions,
          attackerHeight: heightOf(current, actor), targetHeight: heightOf(current, t), ranged: rangedSpell, spell: true,
          targetAsleep: t.asleep === true,
        }),
        ...rangeSources,
      ];
      const mode = combineModes(sources);
      const res = resolveAttack(
        { attackBonus: actor.spellAttack ?? 0, targetAc: t.ac + cover, mode, damage: expr, autoCritical: isAutoCritical(t.conditions, rangedSpell) },
        rng,
      );
      const raw = res.damage?.total ?? 0;
      const adj = res.hit ? adjustDamage(raw, m.damageType, profileOf(t)) : { amount: 0, note: null };
      // Hunter's Mark: işaretli hedefe büyü saldırısı isabetinde de ek hasar.
      const bonus = res.hit ? hitExtras(current, actor, t, { mode, critical: res.critical }, rng) : { extras: [] };
      const total = adj.amount + bonus.extras.reduce((n, x) => n + x.applied, 0);
      const fx = damageEffects(t, total, m.damageType ?? '', res.critical, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: spell.name, mode,
        reasons: sources.map((s) => s.reason), d20: res.d20.rolls, natural: res.d20.kept, total: res.total,
        targetAc: t.ac + cover, hit: res.hit, critical: res.critical, fumble: res.fumble,
        damageRolls: res.damage?.rolls ?? [], rawDamage: raw, appliedDamage: total,
        damageType: m.damageType ?? '', damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
        ...(cover === 2 || cover === 5 ? { cover } : {}),
        ...(bonus.extras.length > 0 ? { extra: bonus.extras } : {}),
      };
    } else {
      const d = rollDice(expr, rng);
      const adj = adjustDamage(d.total, m.damageType, profileOf(t));
      const fx = damageEffects(t, adj.amount, m.damageType ?? '', false, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: `${spell.name} (otomatik isabet)`,
        mode: 'normal', reasons: [], d20: [], natural: 0, total: 0, targetAc: t.ac, hit: true,
        critical: false, fumble: false, damageRolls: d.rolls, rawDamage: d.total, appliedDamage: adj.amount,
        damageType: m.damageType ?? '', damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
      };
    }
    events.push(ev);
    current = applyEvents(current, [ev]);
  }
  return finish(state, events);
}
