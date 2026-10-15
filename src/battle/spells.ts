/** Büyü yapma: slot harcama, saldırı ve save büyüleri, iyileştirme, durumlar. */
import { getEnvironment, spells, type SpellMechanics } from '../data';
import { autoFailsStrDexSave, attackSources, isAutoCritical } from '../rules/conditions';
import { adjustDamage, applyHealing, halfDamage } from '../rules/damage';
import { parseDice, rollDice, type Rng } from '../rules/dice';
import { resolveAttack, resolveSave } from '../rules/attack';
import { combineModes, environmentSources, invertMode, type ModeSource } from '../rules/modes';
import { checkReach } from './range';
import { damageEffects } from './damage-effects';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Zar ifadesini kurar: cantrip seviye ölçeği ve büyü modifier'ı dahil. */
function damageExpr(m: SpellMechanics, actor: Combatant, tier: number): string {
  const spec = parseDice(m.damage ?? '');
  const count = m.scalesWithLevel ? spec.count * tier : spec.count;
  const bonus = spec.bonus + (m.addCastingMod ? actor.spellMod : 0);
  return `${count}d${spec.sides}${bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : String(bonus)}`;
}

const profileOf = (t: Combatant) => ({
  resistances: t.resistances,
  immunities: t.immunities,
  vulnerabilities: t.vulnerabilities,
});

export function executeCast(state: BattleState, actor: Combatant, cmd: CastCommand, rng: Rng): CommandResult {
  const spell = spells.find((s) => s.name === cmd.spellName);
  if (!spell) return fail(`Büyü bulunamadı: ${cmd.spellName}`);
  if (!actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  const m = spell.mechanics;
  if (m.kind !== 'utility' && m.kind !== 'sleep' && !m.damage && !m.conditions) {
    return fail('Bu büyünün mekaniği tanımlı değil.');
  }

  let target: Combatant | undefined;
  if (m.kind !== 'utility') {
    if (!cmd.targetId) return fail('Hedef seçmelisin.');
    target = state.combatants[cmd.targetId];
    if (!target) return fail('Hedef bulunamadı.');
    if (!isTargetable(target)) return fail('Hedef ayakta değil.');
    if (m.kind !== 'heal' && target.id === actor.id) return fail('Kendini hedefleyemezsin.');
  }

  // Menzil (haritalı savaş): dokunma 5 ft, uzaktan saldırı büyüsü yanında düşman varken dezavantajlı.
  let rangeSources: ModeSource[] = [];
  if (target && target.id !== actor.id) {
    if (spell.rangeFt === 0) return fail(`${spell.name} yalnızca büyücüyü etkiler.`);
    const ranged = m.kind === 'attack' && spell.rangeFt > 5;
    const r = checkReach(state, actor, target, ranged
      ? { kind: 'ranged', normalFt: spell.rangeFt, longFt: spell.rangeFt }
      : { kind: 'effect', rangeFt: spell.rangeFt });
    if (!r.ok) return r;
    rangeSources = r.sources;
  }

  const events: BattleEvent[] = [];
  let slotLevel: number | null = null;
  if (spell.level > 0) {
    const from = Math.max(spell.level, cmd.slotLevel ?? spell.level);
    let idx = -1;
    for (let i = from - 1; i < 9; i++) {
      if ((actor.spellSlots[i] ?? 0) > 0) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return fail('Uygun büyü slotu kalmadı.');
    slotLevel = idx + 1;
    events.push({ type: 'slot_spent', actorId: actor.id, level: slotLevel, remaining: (actor.spellSlots[idx] ?? 1) - 1 });
  }

  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${spell.name} ${spell.text}`.toLowerCase();
  const tier = 1 + (actor.level >= 5 ? 1 : 0) + (actor.level >= 11 ? 1 : 0) + (actor.level >= 17 ? 1 : 0);

  if (m.kind === 'utility' || !target) {
    events.push({
      type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel,
      note: `Etki elle uygulanır: ${spell.text}`,
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
      events.push({ type: 'condition_changed', targetId: target.id, condition: 'Unconscious', present: true, reason: spell.name });
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
    const save = resolveSave({ modifier: target.saves[ability], dc: actor.spellSaveDc ?? 0, mode, autoFail }, rng);
    let raw = 0;
    let rolls: number[] = [];
    if (m.damage) {
      const d = rollDice(damageExpr(m, actor, tier), rng);
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
    });
    return finish(state, events);
  }

  // Saldırı büyüleri (attack) ve otomatik isabet eden büyüler (auto): her ışın ayrı çözülür.
  const rays = m.raysByLevel ? tier : (m.rays ?? 1);
  let current = applyEvents(state, events);
  for (let r = 0; r < rays; r++) {
    const t = current.combatants[target.id];
    if (!t || t.hp <= 0) break;
    const expr = damageExpr(m, actor, tier);
    let ev: BattleEvent;
    if (m.kind === 'attack') {
      const sources = [
        ...environmentSources(env, tag),
        ...attackSources({
          attackerConditions: actor.conditions, targetConditions: t.conditions,
          attackerHeight: actor.height, targetHeight: t.height, ranged: false, spell: true,
        }),
        ...rangeSources,
      ];
      const mode = combineModes(sources);
      const res = resolveAttack(
        { attackBonus: actor.spellAttack ?? 0, targetAc: t.ac, mode, damage: expr, autoCritical: isAutoCritical(t.conditions, false) },
        rng,
      );
      const raw = res.damage?.total ?? 0;
      const adj = res.hit ? adjustDamage(raw, m.damageType, profileOf(t)) : { amount: 0, note: null };
      const fx = damageEffects(t, adj.amount, m.damageType ?? '', res.critical, rng);
      ev = {
        type: 'attack_resolved', actorId: actor.id, targetId: t.id, label: spell.name, mode,
        reasons: sources.map((s) => s.reason), d20: res.d20.rolls, natural: res.d20.kept, total: res.total,
        targetAc: t.ac, hit: res.hit, critical: res.critical, fumble: res.fumble,
        damageRolls: res.damage?.rolls ?? [], rawDamage: raw, appliedDamage: adj.amount,
        damageType: m.damageType ?? '', damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
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
