/**
 * Görev A6: yaratığın haritadaki gövdesi (çok altıgenli boyut). `BattleState.multiHex` açıkken Large, Huge ve
 * Gargantuan yaratıklar birden çok altıgen kaplar (`src/rules/footprint.ts`, docs/harita/COKLU-ALTIGEN.md); kapalıyken
 * (varsayılan) ve Medium ve altında gövde tek altıgendir: bu modülün bütün yardımcıları eski hesapla birebir aynıdır.
 */
import { footprint, footprintDistance, type FootprintSize } from '../rules/footprint';
import { distance, sameHex, type Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

/** Çok altıgen kuralı bu yaratıkta geçerli mi. */
export function isMultiHex(state: Pick<BattleState, 'multiHex'>, c: Pick<Combatant, 'size'>): boolean {
  return !!state.multiHex && (c.size === 'L' || c.size === 'H' || c.size === 'G');
}

/** Yaratık `at` çapasında dursaydı kaplayacağı altıgenler. */
export function bodyAt(state: Pick<BattleState, 'multiHex'>, c: Pick<Combatant, 'size'>, at: Offset): Offset[] {
  return isMultiHex(state, c) ? footprint(at, c.size as FootprintSize) : [at];
}

/** Yaratığın kapladığı altıgenler (konumsuzsa boş). */
export function bodyOf(state: Pick<BattleState, 'multiHex'>, c: Pick<Combatant, 'size' | 'pos'>): Offset[] {
  return c.pos ? bodyAt(state, c, c.pos) : [];
}

/** Altıgen bu yaratığın gövdesinde mi. */
export function covers(state: Pick<BattleState, 'multiHex'>, c: Pick<Combatant, 'size' | 'pos'>, h: Offset): boolean {
  if (!c.pos) return false;
  if (!isMultiHex(state, c)) return sameHex(c.pos, h);
  return bodyOf(state, c).some((x) => sameHex(x, h));
}

/** İki yaratık arasındaki mesafe (altıgen): gövdelerin en yakın iki altıgeni arası; tek altıgenlide `distance`. */
export function gap(state: Pick<BattleState, 'multiHex'>, a: Pick<Combatant, 'size' | 'pos'>, b: Pick<Combatant, 'size' | 'pos'>): number {
  if (!a.pos || !b.pos) return Infinity;
  if (!isMultiHex(state, a) && !isMultiHex(state, b)) return distance(a.pos, b.pos);
  return footprintDistance(bodyOf(state, a), bodyOf(state, b));
}

/** Yaratığın `at` çapasındaki gövdesi ile bir altıgen arası (`from`/`to` adımları için). */
export function gapAt(state: Pick<BattleState, 'multiHex'>, c: Pick<Combatant, 'size'>, at: Offset, h: Offset): number {
  return isMultiHex(state, c) ? footprintDistance(bodyAt(state, c, at), [h]) : distance(at, h);
}
