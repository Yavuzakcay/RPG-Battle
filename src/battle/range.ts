/**
 * Haritalı savaşta menzil: yakın dövüş erişimi, menzilli silahların normal ve uzun
 * menzili, büyü menzili. Haritasız savaşta (veya konumu olmayan savaşçıda) hiçbir şey
 * denetlenmez, eski davranış aynen sürer. Mesafe altıgen cinsinden (1 altıgen = 5 ft).
 */
import { isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { fail, isTargetable, type Failure } from './common';
import type { BattleState, Combatant } from './types';

/** Bir saldırının veya etkinin ulaşabildiği uzaklık. */
export type Reach =
  /** Yakın dövüş (ft): 5 = 1 altıgen, uzun erişim 10 = 2 altıgen. */
  | { kind: 'melee'; reachFt: number }
  /** Saldırı zarlı menzilli saldırı: normal menzil ötesi dezavantaj, uzun menzil ötesi yok. */
  | { kind: 'ranged'; normalFt: number; longFt: number }
  /** Saldırı zarı olmayan etki (save'li büyü, nefes, iyileştirme): yalnızca menzil sınırı. */
  | { kind: 'effect'; rangeFt: number };

/** Saldıranın yanında (1 altıgen) aksiyon yapabilen bir düşman var mı? */
export function enemyAdjacent(state: BattleState, c: Combatant): boolean {
  if (!c.pos) return false;
  const pos = c.pos;
  return Object.values(state.combatants).some(
    (o) => o.side !== c.side && o.pos !== null && isTargetable(o) && o.hp > 0 && !isIncapacitated(o.conditions)
      && distance(pos, o.pos) === 1,
  );
}

const feetText = (hexes: number) => `${hexes} altıgen (${hexes * 5} ft)`;

/** Menzili denetler; geçerliyse menzilden gelen avantaj/dezavantaj kaynaklarını döndürür. */
export function checkReach(
  state: BattleState, attacker: Combatant, target: Combatant, reach: Reach,
): { ok: true; sources: ModeSource[] } | Failure {
  if (!state.map || !attacker.pos || !target.pos) return { ok: true, sources: [] };
  const d = distance(attacker.pos, target.pos);
  const ft = d * 5;
  if (reach.kind === 'melee') {
    if (ft > reach.reachFt) return fail(`Hedef erişim dışında: ${feetText(d)}, erişim ${reach.reachFt} ft.`);
    return { ok: true, sources: [] };
  }
  if (reach.kind === 'effect') {
    if (ft > reach.rangeFt) return fail(`Hedef menzil dışında: ${feetText(d)}, menzil ${reach.rangeFt} ft.`);
    return { ok: true, sources: [] };
  }
  if (ft > reach.longFt) return fail(`Hedef menzil dışında: ${feetText(d)}, en uzak menzil ${reach.longFt} ft.`);
  const sources: ModeSource[] = [];
  if (ft > reach.normalFt) sources.push({ effect: 'disadvantage', reason: 'Uzun menzil' });
  if (enemyAdjacent(state, attacker)) sources.push({ effect: 'disadvantage', reason: 'Yanında düşman (menzilli saldırı)' });
  return { ok: true, sources };
}

/** Karakter saldırı seçeneğinin erişimi. Menzil bilgisi olmayan menzilli seçenek sınırsız sayılır. */
export function optionReach(o: { ranged: boolean; reachFt?: number; range?: [number, number] }): Reach {
  if (!o.ranged) return { kind: 'melee', reachFt: o.reachFt ?? 5 };
  const [normalFt, longFt] = o.range ?? [Infinity, Infinity];
  return { kind: 'ranged', normalFt, longFt };
}
