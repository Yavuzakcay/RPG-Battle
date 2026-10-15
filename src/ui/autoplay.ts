/** Düşman turlarını otomatik oynatan basit yapay zeka (GM yardımcısı). */
import { currentActorId, type BattleState, type Combatant, type Command } from '../battle';
import type { Rng } from '../rules/dice';
import { dispatch, type Session } from './session';

/** Hedef: ayakta duran parti üyesi, en düşük HP oranlısı. */
function pickTarget(state: BattleState): Combatant | undefined {
  return Object.values(state.combatants)
    .filter((c) => c.side === 'party' && c.hp > 0 && !c.hidden)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

/** Sırası gelen düşman için bir komut seçer; hedef veya saldırı yoksa turu bitirir. */
export function chooseEnemyCommand(state: BattleState): Command {
  const actorId = currentActorId(state);
  const actor = state.combatants[actorId];
  const end: Command = { type: 'end_turn', actorId };
  if (!actor || actor.side !== 'enemies' || state.status !== 'active') return end;
  const target = pickTarget(state);
  if (!target) return end;

  const ready = actor.attacks
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => a.damageDice !== undefined && !(a.recharge !== undefined && actor.rechargeUsed.includes(i)));
  const recharge = ready.find(({ a }) => a.recharge !== undefined && a.save !== undefined);
  if (recharge) return { type: 'monster_attack', actorId, targetId: target.id, attackIndex: recharge.i };
  if (actor.multiattack) return { type: 'multiattack', actorId, targetId: target.id };
  const first = ready[0];
  if (first) return { type: 'monster_attack', actorId, targetId: target.id, attackIndex: first.i };
  return end;
}

/** Sıra bir oyuncuya gelene veya savaş bitene kadar düşman turlarını oynatır. */
export function autoplayEnemyTurns(session: Session, rng: Rng): Session {
  let s = session;
  for (let guard = 0; guard < 40; guard++) {
    const st = s.state;
    if (st.status !== 'active') break;
    const actor = st.combatants[currentActorId(st)];
    if (!actor || actor.side !== 'enemies') break;
    const cmd = chooseEnemyCommand(st);
    if (cmd.type !== 'end_turn') {
      const played = dispatch(s, cmd, rng);
      if (played.error === null) s = played;
      if (s.state.status !== 'active') break;
    }
    const ended = dispatch(s, { type: 'end_turn', actorId: actor.id }, rng);
    if (ended.error !== null) return ended;
    s = ended;
  }
  return s;
}
