/** Tek cihazda oynanan savaş oturumu: durum, olay günlüğü ve komut gönderme. */
import { execute, type BattleEvent, type BattleState, type Command, type CommandContext } from '../battle';
import type { Rng } from '../rules/dice';
import { describeEvents } from './log';

export interface Session {
  state: BattleState;
  events: BattleEvent[];
  lines: string[];
  /** Son komutun reddedilme nedeni (başarılıysa null). */
  error: string | null;
}

export function createSession(state: BattleState, startEvents: BattleEvent[]): Session {
  return { state, events: [...startEvents], lines: describeEvents(startEvents, state), error: null };
}

/**
 * Tek cihazda herkesi sırayla biz yönetiyoruz: GM düşmanları, oyuncular kendi karakterlerini.
 * (Online sürümde bu bağlam sunucudan gelen gerçek kimliklerle değişecek.)
 */
export function contextFor(state: BattleState, actorId: string): CommandContext {
  const c = state.combatants[actorId];
  if (!c) return { playerId: null, isGm: false };
  return c.side === 'enemies' ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
}

export function dispatch(session: Session, cmd: Command, rng: Rng): Session {
  const ctx =
    cmd.type === 'set_condition' || cmd.type === 'adjust_hp'
      ? { playerId: 'gm', isGm: true }
      : contextFor(session.state, cmd.actorId);
  const result = execute(session.state, cmd, ctx, rng);
  if (!result.ok) return { ...session, error: result.error };
  return {
    state: result.state,
    events: [...session.events, ...result.events],
    // İsimler olayların ait olduğu durumdan okunur; savaşçılar silinmediği için son durum yeterli.
    lines: [...session.lines, ...describeEvents(result.events, result.state)],
    error: null,
  };
}
