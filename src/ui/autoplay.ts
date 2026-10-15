/** Düşman turlarını otomatik oynatma (GM yardımcısı); kararları `battle/ai.ts` verir. */
import { currentActorId } from '../battle';
import { chooseEnemyCommand } from '../battle/ai';
import type { Rng } from '../rules/dice';
import { dispatch, type Session } from './session';

export { chooseEnemyCommand };

/** Bir düşmanın turunda en çok kaç komut denenir (yürü, saldır, yürü...). */
const MAX_STEPS = 6;

/** Sıra bir oyuncuya gelene veya savaş bitene kadar düşman turlarını oynatır. */
export function autoplayEnemyTurns(session: Session, rng: Rng): Session {
  let s = session;
  for (let guard = 0; guard < 40; guard++) {
    const st = s.state;
    if (st.status !== 'active') break;
    const actor = st.combatants[currentActorId(st)];
    if (!actor || actor.side !== 'enemies') break;
    for (let step = 0; step < MAX_STEPS; step++) {
      const cmd = chooseEnemyCommand(s.state);
      if (cmd.type === 'end_turn') break;
      const played = dispatch(s, cmd, rng);
      if (played.error !== null) break;
      s = played;
      if (s.state.status !== 'active' || currentActorId(s.state) !== actor.id) break;
    }
    if (s.state.status !== 'active') break;
    if (currentActorId(s.state) !== actor.id) continue;
    const ended = dispatch(s, { type: 'end_turn', actorId: actor.id }, rng);
    if (ended.error !== null) return ended;
    s = ended;
  }
  return s;
}
