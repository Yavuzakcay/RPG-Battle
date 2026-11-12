/**
 * Kuyruk MB4: simülasyon için "binmiş başla" kurulumu (regresyon `binekMb4Regresyon.test.ts` ve `sim:yz-sure -- --binek`).
 * Partinin ilk üyesi savaş başında bir Warhorse'un üstünde; at sırada binicinin hemen ardında. Çok altıgen açıkken atın gövdesi
 * (Large, 3 altıgen) binicinin yerine ya da en yakın sığdığı çapaya konur, binici çapaya geçer.
 * Kuyruk MB2: `control` ile at kontrollü başlar (`controlledBy`, inisiyatifi binicininki; 74+'da kendi turu yok, 73 ve altında etkisiz).
 */
import { combatantFromMonster } from '../battle/create';
import { bodyFitProblem } from '../battle/movement';
import { getMonster } from '../data';
import { distance, type Offset } from '../rules/hex';
import type { BattleState, Combatant } from '../battle/types';

export function mountedStart(s: BattleState, opts: { control?: boolean } = {}): BattleState {
  const rider = Object.values(s.combatants).find((c) => c.side === 'party' && !c.civilian && c.pos) as Combatant;
  const horse = combatantFromMonster(getMonster('warhorse'), { id: 'binek-at' });
  let at = rider.pos as Offset;
  if (s.multiHex && s.map) {
    const rows = s.map.tiles.length, cols = s.map.tiles[0]?.length ?? 0;
    const cands: Offset[] = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) cands.push({ col, row });
    cands.sort((a, b) => distance(at, a) - distance(at, b));
    at = cands.find((h) => !bodyFitProblem(s, { ...horse, id: horse.id }, h, [rider.id])) ?? at;
  }
  const mount: Combatant = { ...horse, side: 'party', ownerId: rider.ownerId, pos: at, rider: rider.id,
    ...(opts.control ? { controlledBy: rider.id, initiative: rider.initiative } : {}) };
  const order = [...s.order];
  order.splice(order.indexOf(rider.id) + 1, 0, mount.id);
  return { ...s, order, combatants: { ...s.combatants, [rider.id]: { ...rider, pos: at, riding: mount.id }, [mount.id]: mount } };
}
