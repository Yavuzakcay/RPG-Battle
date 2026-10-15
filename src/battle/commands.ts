/**
 * İstekleri (komutları) doğrular ve çözümler: kim neyi yapabilir, zarlar, kurallar.
 * Sonuç olarak olaylar üretir. Bu kod "yetkili" tarafta (GM'in cihazı veya sunucu) çalışır.
 */
import type { Height } from '../rules/conditions';
import { rollD20, rollDie, type Rng } from '../rules/dice';
import { checkActor, fail, finish, nextActor, type CommandResult } from './common';
import {
  auraStepEvents, auraTurnEndEvents, executeActionSurge, executeFollowup, executeSecondWind, opportunityAttacks,
  weaponAttackEvents,
} from './features';
import { executeMonsterAttack, executeMultiattack } from './monsters';
import { executeJump, executeMove, executePlace, executeStartBattle } from './movement';
import { executeHide, executeSearch, revealEvent } from './stealth';
import { executeSkillCheck } from './checks';
import { economyCost, isReactionSpell } from './economy';
import { executeMapTrigger, roundStartMapEvents, turnEndMapEvents, turnStartMapEvents } from './maprules';
import { executeAttackGate, executeEscape, executeGate, executePull } from './mapcommands';
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
      // Canı doluysa yenilenecek bir şey yok: olay (ve günlük satırı) üretilmez.
      const amount = Math.min(c.regeneration, c.maxHp - c.hp);
      if (amount > 0) events.push({ type: 'regeneration', actorId: c.id, amount, blocked: false, died: false, hpAfter: c.hp + amount });
    }
  }
  return events;
}

/** Komutu çözer; komutu veren gizlenmişse ve komut onu ortaya çıkarıyorsa bunu da ekler. */
export function execute(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  // Eylem ekonomisi: komut çalışmadan önce harcanabilir mi bakılır, başarılıysa harcanır
  // (olay, komutun olaylarının ardına eklenir; ikisi farklı alanları değiştirir).
  let spent: BattleEvent | null = null;
  const actor = 'actorId' in cmd && state.status === 'active' ? state.combatants[cmd.actorId] : undefined;
  if (actor && cmd.type !== 'skill_check' && cmd.type !== 'place') {
    const cost = economyCost(state, actor, cmd);
    if (!cost.ok) return cost;
    spent = cost.event;
  }
  const result = executeCommand(state, cmd, ctx, rng);
  if (!result.ok) return result;
  let { state: next, events } = result;
  if (spent) {
    next = applyEvents(next, [spent]);
    events = [...events, spent];
  }
  const reveal = revealEvent(state, next, cmd);
  if (!reveal) return { ok: true, state: next, events };
  return { ok: true, state: applyEvents(next, [reveal]), events: [...events, reveal] };
}

function executeCommand(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  if (state.status === 'finished') return fail('Savaş bitti.');
  if (cmd.type === 'place') return executePlace(state, cmd.actorId, cmd.at, ctx);
  if (cmd.type === 'start_battle') return executeStartBattle(state, ctx);
  if (state.status === 'setup') return fail('Savaş henüz başlamadı: önce herkes yerleşmeli ve GM başlatmalı.');

  if (cmd.type === 'set_condition') {
    if (!ctx.isGm) return fail('Yalnızca GM durum ekleyip kaldırabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    const events: BattleEvent[] = [
      { type: 'condition_changed', targetId: target.id, condition: cmd.condition, present: cmd.present, reason: 'GM' },
    ];
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (cmd.type === 'adjust_hp') {
    if (!ctx.isGm) return fail('Yalnızca GM HP ayarlayabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    if (!Number.isFinite(cmd.hp)) return fail('Geçersiz HP.');
    const hp = Math.max(0, Math.min(target.maxHp, Math.round(cmd.hp)));
    // Parti üyesi 0'a inerse ölmekte sayılır; düşman 0'da düşmüş olur.
    const life: Combatant['life'] = hp > 0 ? 'alive' : target.side === 'party' && !target.civilian ? 'dying' : target.life;
    const events: BattleEvent[] = [{ type: 'hp_adjusted', targetId: target.id, hpAfter: hp, life }];
    return finish(state, events);
  }

  if (cmd.type === 'skill_check') return executeSkillCheck(state, cmd.actorId, cmd.skill, cmd.dc, ctx.isGm, rng);
  if (cmd.type === 'map_trigger') return executeMapTrigger(state, cmd.rule, cmd.at, ctx.isGm, rng);
  if (cmd.type === 'gate') return executeGate(state, cmd.at, cmd.open, ctx.isGm);

  // Tepki büyüleri (Shield, Counterspell, Hellish Rebuke) başkasının turunda da yapılır.
  const outOfTurn = cmd.type === 'cast_spell' && isReactionSpell(cmd.spellName);
  const checked = checkActor(state, cmd.actorId, ctx, cmd.type !== 'end_turn', outOfTurn);
  if (!checked.ok) return checked;
  const actor = checked.actor;
  const events: BattleEvent[] = [];

  if (cmd.type === 'end_turn') {
    let current = state;
    let from = actor.id;
    // Tur sonu harita etkileri (sıcak, soğuk, alevde bitirme) sırası biten için.
    const ending = turnEndMapEvents(current, actor, rng);
    events.push(...ending);
    current = applyEvents(current, ending);
    // Turunu düşman yayılımında (Spirit Guardians) bitiren save yapar.
    const aura = auraTurnEndEvents(current, current.combatants[actor.id] as Combatant, rng);
    events.push(...aura);
    current = applyEvents(current, aura);
    for (let guard = 0; guard < state.order.length; guard++) {
      const next = nextActor(current);
      const turnEnded: BattleEvent = { type: 'turn_ended', actorId: from, nextActorId: next.id, round: next.round };
      events.push(turnEnded);
      const roundBefore = current.round;
      current = applyEvents(current, [turnEnded]);
      if (current.round > roundBefore) {
        const rising = roundStartMapEvents(current);
        events.push(...rising);
        current = applyEvents(current, rising);
      }
      const nextCombatant = current.combatants[next.id];
      if (!nextCombatant) break;
      const start = startOfTurnEvents(nextCombatant, rng);
      events.push(...start);
      current = applyEvents(current, start);
      const startMap = turnStartMapEvents(current, current.combatants[next.id] as Combatant, rng);
      events.push(...startMap);
      current = applyEvents(current, startMap);
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
  if (cmd.type === 'action_surge') return executeActionSurge(state, actor);
  if (cmd.type === 'second_wind') return executeSecondWind(state, actor, rng);
  if (cmd.type === 'spell_followup') return executeFollowup(state, actor, cmd.targetId, rng);

  if (cmd.type === 'move') return executeMove(state, actor, cmd.to, rng);
  if (cmd.type === 'jump') return executeJump(state, actor, cmd.to);
  if (cmd.type === 'hide') return executeHide(state, actor, rng);
  if (cmd.type === 'search') return executeSearch(state, actor, rng);
  if (cmd.type === 'pull') return executePull(state, actor, cmd.targetId, rng);
  if (cmd.type === 'escape') return executeEscape(state, actor, rng);
  if (cmd.type === 'attack_gate') return executeAttackGate(state, actor, cmd.at, cmd.option, rng);
  if (cmd.type === 'dash') {
    const dashed: BattleEvent[] = [{ type: 'dashed', actorId: actor.id }];
    return { ok: true, state: applyEvents(state, dashed), events: dashed };
  }
  if (cmd.type === 'disengage') {
    const done: BattleEvent[] = [{ type: 'disengaged', actorId: actor.id }];
    return { ok: true, state: applyEvents(state, done), events: done };
  }

  if (cmd.type === 'change_height') {
    if (state.map) return fail('Haritalı savaşta yükseklik altıgenden gelir.');
    if (actor.conditions.some((c) => c === 'Restrained' || c === 'Grappled')) {
      return fail('Hareket edemiyor (Restrained veya Grappled).');
    }
    const from = actor.height;
    const to: Height = cmd.toHeight;
    if (to === from) return fail('Zaten bu konumda.');
    let change: BattleEvent;
    if (to < from) {
      change = { type: 'height_changed', actorId: actor.id, from, to, moved: true, check: null };
    } else {
      const dc = 12 + 3 * (to - from - 1);
      const roll = rollD20('normal', rng);
      const total = roll.kept + actor.climbMod;
      const success = roll.kept === 20 || (roll.kept !== 1 && total >= dc);
      change = { type: 'height_changed', actorId: actor.id, from, to, moved: success, check: { natural: roll.kept, total, dc } };
    }
    if (change.type === 'height_changed' && change.moved) {
      // Haritasız savaşta aynı yükseklikteki düşmanlar "erişimde" sayılır: ayrılmadan hemen önce
      // fırsat saldırısı; düşerse yer değiştiremez.
      const opportunity = opportunityAttacks(state, actor.id, null, rng);
      events.push(...opportunity);
      if ((applyEvents(state, opportunity).combatants[actor.id]?.hp ?? 0) <= 0) return finish(state, events);
    }
    events.push(change);
    // Yükseklik değişince yayılıma (Spirit Guardians) giren veya yayılımı getiren büyücü.
    const moved = applyEvents(state, events);
    if (moved.combatants[actor.id]?.height !== from) events.push(...auraStepEvents(moved, actor.id, null, null, rng, from));
    return finish(state, events);
  }

  // Silah saldırısı
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  const r = weaponAttackEvents(state, actor, target, cmd.option, rng);
  if (!r.ok) return r;
  return finish(state, r.events);
}
