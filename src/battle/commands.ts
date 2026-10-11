/**
 * İstekleri (komutları) doğrular ve çözümler: kim neyi yapabilir, zarlar, kurallar.
 * Sonuç olarak olaylar üretir. Bu kod "yetkili" tarafta (GM'in cihazı veya sunucu) çalışır.
 */
import { getEnvironment } from '../data';
import { attackSources, isAutoCritical, isIncapacitated, type Height } from '../rules/conditions';
import { adjustDamage, applyDamage } from '../rules/damage';
import { rollD20, type Rng } from '../rules/dice';
import { resolveAttack } from '../rules/attack';
import { combineModes, environmentSources } from '../rules/modes';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

export type CommandResult =
  | { ok: true; state: BattleState; events: BattleEvent[] }
  | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Bu kişi bu savaşçıyı yönetebilir mi? GM yalnızca düşmanları, oyuncu yalnızca kendi karakterini. */
export function canControl(c: Combatant, ctx: CommandContext): boolean {
  if (c.side === 'enemies') return ctx.isGm;
  return ctx.playerId !== null && c.ownerId === ctx.playerId;
}

export function currentActorId(state: BattleState): string {
  const id = state.order[state.turnIndex];
  if (!id) throw new Error('Sıra boş');
  return id;
}

/** Sıradaki ayakta yaratığı bulur; sıranın sonuna gelince tur sayısını artırır. */
function nextActor(state: BattleState): { id: string; round: number } {
  const n = state.order.length;
  let index = state.turnIndex;
  let round = state.round;
  for (let step = 0; step < n; step++) {
    index += 1;
    if (index >= n) {
      index = 0;
      round += 1;
    }
    const id = state.order[index];
    const c = id ? state.combatants[id] : undefined;
    if (id && c && c.hp > 0) return { id, round };
  }
  return { id: currentActorId(state), round };
}

/** Savaş bitti mi? Bir taraf tamamen düştüyse kazananı döndürür. */
function winnerOf(state: BattleState): 'party' | 'enemies' | null {
  const alive = (side: 'party' | 'enemies') =>
    Object.values(state.combatants).some((c) => c.side === side && c.hp > 0);
  if (!alive('enemies')) return 'party';
  if (!alive('party')) return 'enemies';
  return null;
}

export function execute(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  if (state.status !== 'active') return fail('Savaş bitti.');
  const actor = state.combatants[cmd.actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  if (currentActorId(state) !== actor.id) return fail('Sıra bu savaşçıda değil.');
  if (actor.hp <= 0) return fail('Bu savaşçı ayakta değil.');

  const events: BattleEvent[] = [];

  if (cmd.type === 'end_turn') {
    const next = nextActor(state);
    events.push({ type: 'turn_ended', actorId: actor.id, nextActorId: next.id, round: next.round });
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (isIncapacitated(actor.conditions)) {
    return fail(`Aksiyon yapamaz: ${actor.conditions.join(', ')}`);
  }

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
        type: 'height_changed',
        actorId: actor.id,
        from,
        to,
        moved: success,
        check: { natural: roll.kept, total, dc },
      });
    }
    return { ok: true, state: applyEvents(state, events), events };
  }

  // Saldırı
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendine saldıramazsın.');
  if (target.hp <= 0) return fail('Hedef zaten düşmüş.');

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
    targetHpAfter: applyDamage(target.hp, adjusted.amount),
  });

  let next = applyEvents(state, events);
  const winner = winnerOf(next);
  if (winner) {
    const finished: BattleEvent = { type: 'battle_finished', winner };
    events.push(finished);
    next = applyEvents(next, [finished]);
  }
  return { ok: true, state: next, events };
}
