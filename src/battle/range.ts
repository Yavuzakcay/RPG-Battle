/**
 * Haritalı savaşta menzil: yakın dövüş erişimi, menzilli silahların normal ve uzun
 * menzili, büyü menzili. Haritasız savaşta (veya konumu olmayan savaşçıda) hiçbir şey
 * denetlenmez, eski davranış aynen sürer. Mesafe altıgen cinsinden (1 altıgen = 5 ft).
 */
import { isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import type { Cover } from '../map/terrain';
import { fail, isTargetable, type Failure } from './common';
import { lineOfFire } from './cover';
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

export interface Targeting {
  ok: true;
  /** Menzilden gelen avantaj/dezavantaj kaynakları. */
  sources: ModeSource[];
  /** Hedefin siperi: saldırıda AC'ye, DEX save'ine eklenir. */
  cover: Cover;
}

/**
 * Menzili, görüş hattını ve siperi denetler. Geçerliyse menzilden gelen avantaj/dezavantaj
 * kaynaklarını ve hedefin siperini döndürür; haritasız savaşta hiçbir şey denetlenmez.
 */
export function checkReach(
  state: BattleState, attacker: Combatant, target: Combatant, reach: Reach,
): Targeting | Failure {
  if (!state.map || !attacker.pos || !target.pos) return { ok: true, sources: [], cover: 0 };
  const d = distance(attacker.pos, target.pos);
  const ft = d * 5;
  const sources: ModeSource[] = [];
  if (reach.kind === 'melee') {
    if (ft > reach.reachFt) return fail(`Hedef erişim dışında: ${feetText(d)}, erişim ${reach.reachFt} ft.`);
  } else if (reach.kind === 'effect') {
    if (ft > reach.rangeFt) return fail(`Hedef menzil dışında: ${feetText(d)}, menzil ${reach.rangeFt} ft.`);
  } else {
    if (ft > reach.longFt) return fail(`Hedef menzil dışında: ${feetText(d)}, en uzak menzil ${reach.longFt} ft.`);
    if (ft > reach.normalFt) sources.push({ effect: 'disadvantage', reason: 'Uzun menzil' });
    if (enemyAdjacent(state, attacker)) sources.push({ effect: 'disadvantage', reason: 'Yanında düşman (menzilli saldırı)' });
  }
  const lof = lineOfFire(state, attacker, target);
  if (lof.blocked) return fail(`Hedef görülemiyor: arada ${lof.blockedBy ?? 'engel'} var.`);
  return { ok: true, sources, cover: lof.cover };
}

/** Karakter saldırı seçeneğinin erişimi. Menzil bilgisi olmayan menzilli seçenek sınırsız sayılır. */
export function optionReach(o: { ranged: boolean; reachFt?: number; range?: [number, number] }): Reach {
  if (!o.ranged) return { kind: 'melee', reachFt: o.reachFt ?? 5 };
  const [normalFt, longFt] = o.range ?? [Infinity, Infinity];
  return { kind: 'ranged', normalFt, longFt };
}
