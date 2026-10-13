/**
 * İstekleri (komutları) doğrular ve çözümler: kim neyi yapabilir, zarlar, kurallar.
 * Sonuç olarak olaylar üretir. Bu kod "yetkili" tarafta (GM'in cihazı veya sunucu) çalışır.
 */
import { getEnvironment } from '../data';
import { attackSources, isAutoCritical, type Height } from '../rules/conditions';
import { adjustDamage } from '../rules/damage';
import { rollD20, rollDie, type Rng } from '../rules/dice';
import { resolveAttack } from '../rules/attack';
import { combineModes, environmentSources } from '../rules/modes';
import { checkActor, fail, finish, isTargetable, nextActor, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { executeMonsterAttack, executeMultiattack } from './monsters';
import { executeCast } from './spells';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

export type { CommandResult } from './common';
export { canControl, currentActorId } from './common';

/** Sırası gelen yaratığın tur başı olayları: Recharge zarları ve yenilenme. */
function startOfTurnEvents(c: Combatant, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (c.life === 'dying') {
    // Ölüm save'i: 20 ayağa kaldırır (1 HP), 1 iki başarısızlık, 10+ başarı, altı başarısızlık.
    const natural = rollD20('normal', rng).kept;
    let successes = c.deathSaves.successes;
    let failures = c.deathSaves.failures;
    let outcome: 'success' | 'failure' | 'stable' | 'dead' | 'revived';
    if (natural === 20) {
      outcome = 'revived';
    } else {
      if (natural === 1) failures += 2;
      else if (natural >= 10) successes += 1;
      else failures += 1;
      outcome = failures >= 3 ? 'dead' : successes >= 3 ? 'stable' : natural >= 10 ? 'success' : 'failure';
    }
    events.push({
      type: 'death_save', actorId: c.id, natural,
      successes: Math.min(3, successes), failures: Math.min(3, failures), outcome,
    });
  }
  for (const index of c.rechargeUsed) {
    const need = c.attacks[index]?.recharge ?? 6;
    const d6 = rollDie(6, rng);
    events.push({ type: 'recharge_rolled', actorId: c.id, attackIndex: index, d6, recharged: d6 >= need });
  }
  if (c.regeneration > 0 && (c.hp > 0 || c.regenPending)) {
    if (c.regenBlocked) {
      events.push({ type: 'regeneration', actorId: c.id, amount: 0, blocked: true, died: c.hp <= 0, hpAfter: c.hp });
    } else {
      const amount = Math.min(c.regeneration, c.maxHp - c.hp);
      events.push({ type: 'regeneration', actorId: c.id, amount, blocked: false, died: false, hpAfter: c.hp + amount });
    }
  }
  return events;
}

export function execute(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  if (state.status !== 'active') return fail('Savaş bitti.');

  if (cmd.type === 'set_condition') {
    if (!ctx.isGm) return fail('Yalnızca GM durum ekleyip kaldırabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    const events: BattleEvent[] = [
      { type: 'condition_changed', targetId: target.id, condition: cmd.condition, present: cmd.present, reason: 'GM' },
    ];
    return { ok: true, state: applyEvents(state, events), events };
  }

  const checked = checkActor(state, cmd.actorId, ctx, cmd.type !== 'end_turn');
  if (!checked.ok) return checked;
  const actor = checked.actor;
  const events: BattleEvent[] = [];

  if (cmd.type === 'end_turn') {
    let current = state;
    let from = actor.id;
    for (let guard = 0; guard < state.order.length; guard++) {
      const next = nextActor(current);
      const turnEnded: BattleEvent = { type: 'turn_ended', actorId: from, nextActorId: next.id, round: next.round };
      events.push(turnEnded);
      current = applyEvents(current, [turnEnded]);
      const nextCombatant = current.combatants[next.id];
      if (!nextCombatant) break;
      const start = startOfTurnEvents(nextCombatant, rng);
      events.push(...start);
      current = applyEvents(current, start);
      const after = current.combatants[next.id];
      // Yenilenemeyip ölen yaratığın turu atlanır.
      if (after && (after.hp > 0 || after.regenPending)) break;
      from = next.id;
    }
    return finish(state, events);
  }

  if (cmd.type === 'monster_attack') return executeMonsterAttack(state, actor, cmd.targetId, cmd.attackIndex, rng);
  if (cmd.type === 'multiattack') return executeMultiattack(state, actor, cmd.targetId, rng);

  if (cmd.type === 'stabilize') {
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Hedef bulunamadı.');
    if (target.id === actor.id) return fail('Kendini stabilize edemezsin.');
    if (target.life !== 'dying') return fail('Hedef ölmekte değil.');
    const roll = rollD20('normal', rng);
    const success = roll.kept === 20 || (roll.kept !== 1 && roll.kept + actor.modifiers.wis >= 10);
    events.push({ type: 'stabilized', actorId: actor.id, targetId: target.id, natural: roll.kept, success });
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (cmd.type === 'cast_spell') return executeCast(state, actor, cmd, rng);

  if (cmd.type === 'move') {
    if (actor.conditions.some((c) => c === 'Restrained' || c === 'Grappled')) {
      return fail('Hareket edemiyor (Restrained veya Grappled).');
    }
    const from = actor.height;
    const to: Height = cmd.toHeight;
    if (to === from) return fail('Zaten bu konumda.');
    if (to < from) {
      events.push({ type: 'height_changed', actorId: actor.id, from, to, moved: true, check: null });
    } else {
      const dc = 12 + 3 * (to - from - 1);
      const roll = rollD20('normal', rng);
      const total = roll.kept + actor.climbMod;
      const success = roll.kept === 20 || (roll.kept !== 1 && total >= dc);
      events.push({
        type: 'height_changed', actorId: actor.id, from, to, moved: success,
        check: { natural: roll.kept, total, dc },
      });
    }
    return { ok: true, state: applyEvents(state, events), events };
  }

  // Silah saldırısı
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendine saldıramazsın.');
  if (!isTargetable(target)) return fail('Hedef zaten düşmüş.');

  const env = getEnvironment(state.environmentId);
  const allyAlive = Object.values(state.combatants).some(
    (c) => c.id !== actor.id && c.side === actor.side && c.hp > 0,
  );
  const sources = [
    ...environmentSources(env, cmd.option.tag),
    ...attackSources({
      attackerConditions: actor.conditions,
      targetConditions: target.conditions,
      attackerHeight: actor.height,
      targetHeight: target.height,
      ranged: cmd.option.ranged,
      spell: cmd.option.spell,
      packTactics: actor.packTactics && allyAlive,
    }),
  ];
  const mode = combineModes(sources);
  const result = resolveAttack(
    {
      attackBonus: cmd.option.attackBonus,
      targetAc: target.ac,
      mode,
      damage: cmd.option.damage,
      autoCritical: isAutoCritical(target.conditions, cmd.option.ranged),
    },
    rng,
  );

  const rawDamage = result.damage?.total ?? 0;
  const adjusted = result.hit
    ? adjustDamage(rawDamage, cmd.option.damageType, {
        resistances: target.resistances,
        immunities: target.immunities,
        vulnerabilities: target.vulnerabilities,
      })
    : { amount: 0, note: null };

  const fx = damageEffects(target, adjusted.amount, cmd.option.damageType ?? '', result.critical, rng);
  events.push({
    type: 'attack_resolved',
    actorId: actor.id,
    targetId: target.id,
    label: cmd.option.label,
    mode,
    reasons: sources.map((s) => s.reason),
    d20: result.d20.rolls,
    natural: result.d20.kept,
    total: result.total,
    targetAc: target.ac,
    hit: result.hit,
    critical: result.critical,
    fumble: result.fumble,
    damageRolls: result.damage?.rolls ?? [],
    rawDamage,
    appliedDamage: adjusted.amount,
    damageType: cmd.option.damageType ?? '',
    damageNote: adjusted.note,
    targetHpAfter: fx.hpAfter,
    effects: fx.effects,
  });
  return finish(state, events);
}
