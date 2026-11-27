/** Tek cihazda oynanan savaş oturumu: durum, olay günlüğü ve komut gönderme. */
import { execute, type BattleEvent, type BattleState, type Command, type CommandContext } from '../battle';
import type { DiceRequest, Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { isRecording, type DiceGroup } from '../rules/manualDice';
import type { DiceRoll } from '../battle/types';
import { describeEvents } from './log';

export interface Session {
  state: BattleState;
  events: BattleEvent[];
  lines: string[];
  /** Son komutun reddedilme nedeni (başarılıysa null). */
  error: string | null;
}

/**
 * Görev ODA-1: dışarıdan beslenen (salt izlenen) oturum: çevrimiçi odada oyuncu sekmesi host'un savaşını izler. Savaş
 * ekranı aboneliği her yeni durumda oturumu değiştirir; kendisi olay üretmez, kaydetmez.
 */
export interface SessionWatch {
  current(): Session | null;
  subscribe(fn: (s: Session) => void): () => void;
  /** Görev ODA-2: bu cihaz kendi karakterlerini oynar (dokunma açık; komutlar host'a gider, `setDispatchSink`). */
  control?(): boolean;
  send?(cmd: Command): void;
  /** Görev ODA-2: host'un bu cihaza yolladığı zar/tepki istemleri. */
  prompts?(fn: (p: RemotePrompt) => void): () => void;
}

export type RemotePrompt =
  | { kind: 'dice'; id: string; request: DiceRequest; answer(values: number[] | null): void }
  | { kind: 'reaction'; id: string; request: ReactionRequest; answer(a: ReactionAnswer): void }
  | { kind: 'cancel'; id: string };

/**
 * Görev ODA-2: çevrimiçi odada oyuncu cihazı komutu kendisi çalıştırmaz; `dispatch` komutu buraya verir (host'a gider)
 * ve oturumu değiştirmeden döner. Durum host'tan gelen olaylarla değişir. Tek cihazda ve host'ta boş.
 */
let sink: ((cmd: Command) => void) | null = null;
export function setDispatchSink(f: ((cmd: Command) => void) | null): void { sink = f; }

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
  return c.side === 'enemies' || c.civilian ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
}

/** GM bağlamı (tek cihazda kurulumu GM yapar). */
export const GM_CONTEXT: CommandContext = { playerId: 'gm', isGm: true };

export function dispatch(session: Session, cmd: Command, rng: Rng, as?: CommandContext): Session {
  if (sink) { sink(cmd); return session.error ? { ...session, error: null } : session; }
  // GM komutları (savaşçıya bağlı olmayan ya da GM'in istediği kontroller).
  const ctx = as ?? (!('actorId' in cmd) || cmd.type === 'skill_check'
    ? GM_CONTEXT
    : contextFor(session.state, cmd.actorId));
  // Kaydedici Rng (arayüz): bu komutta atılan zarlar `dice_rolled` olayı olarak komutun olaylarının önüne yazılır.
  const before = isRecording(rng) ? rng.groups().length : 0;
  const result = execute(session.state, cmd, ctx, rng);
  if (!result.ok) return { ...session, error: result.error };
  const rolled = isRecording(rng) ? rng.groups().slice(before) : [];
  const events: BattleEvent[] = rolled.length ? [{ type: 'dice_rolled', rolls: rolled.map(diceRoll) }, ...result.events] : result.events;
  return {
    state: result.state,
    events: [...session.events, ...events],
    // İsimler olayların ait olduğu durumdan okunur; savaşçılar silinmediği için son durum yeterli.
    lines: [...session.lines, ...describeEvents(events, result.state)],
    error: null,
  };
}

/** Defterdeki zar grubu → olaydaki biçim (yalnızca gösterim ve kayıt alanları). */
export function diceRoll(g: DiceGroup): DiceRoll {
  return {
    sides: g.sides, values: g.values,
    ...(g.kind ? { kind: g.kind } : {}), ...(g.by ? { by: g.by } : {}), ...(g.bonus ? { bonus: g.bonus } : {}),
    ...(g.mode && g.mode !== 'normal' ? { mode: g.mode } : {}), ...(g.critical ? { critical: true } : {}), ...(g.manual ? { manual: true } : {}),
  };
}
