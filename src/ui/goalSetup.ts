/**
 * Görev OD1C: savaş öncesi (kurulum aşaması) tamamlanan hedeflerin oturuma yazılması. Hedef motoruna dokunulmaz: hedefler
 * `battle_started` olayındaki başlangıç durumunda taşınır; kurulumda bu olay güncellenir ve durum yeniden türetilir (replay
 * aynı çıkar). Yalnız `status: 'setup'` oturumunda.
 */
import { replay } from '../battle';
import type { BattleEvent, Goals } from '../battle/types';
import { describeEvents } from './log';
import type { Session } from './session';

export function withGoals(session: Session, goals: Goals | null | undefined, note?: string): Session {
  if (session.state.status !== 'setup') return session;
  const noteEvent: BattleEvent[] = note ? [{ type: 'map_note', text: note } as BattleEvent] : [];
  const events = session.events.map((e): BattleEvent => {
    if (e.type !== 'battle_started') return e;
    const { goals: _old, ...rest } = e.state;
    return { ...e, state: { ...rest, ...(goals ? { goals } : {}) } };
  });
  // Kurulum olayları (yerleştirme, nesne) başlangıç durumunun üstüne yeniden oynatılır; not sona eklenir.
  const all = [...events, ...noteEvent];
  const state = replay(all);
  return { ...session, state, events: all, lines: [...session.lines, ...describeEvents(noteEvent, state)] };
}
