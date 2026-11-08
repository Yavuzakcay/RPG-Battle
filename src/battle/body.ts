/**
 * Görev A6: yaratığın haritadaki gövdesi (çok altıgenli boyut). `BattleState.multiHex` açıkken Large, Huge ve
 * Gargantuan yaratıklar birden çok altıgen kaplar (`src/rules/footprint.ts`, harita/belgeler/COKLU-ALTIGEN.md); kapalıyken
 * (varsayılan) ve Medium ve altında gövde tek altıgendir: bu modülün bütün yardımcıları eski hesapla birebir aynıdır.
 */
import { footprint, footprintDistance, type FootprintSize } from '../rules/footprint';
import { distance, sameHex, type Offset } from '../rules/hex';
import { ruleVersion } from './ruleVersion';
import type { BattleState, Combatant } from './types';

/** Kuyruk K69: test sayacı: çok altıgen yoluna kaç kez girildi (bayrak kapalıyken hiç artmamalı: hızlı yol). */
export const bodyStats = { multi: 0 };

/** Çok altıgen bayrakları (Kuyruk 43: `multiHexMax` klasik haritada Gargantuan'ı Huge şekline indirir). */
type MH = Pick<BattleState, 'multiHex' | 'multiHexMax'>;

/** Yaratığın bu savaştaki ayak izi boyutu. */
export function bodySize(state: MH, c: Pick<Combatant, 'size'>): FootprintSize {
  return c.size === 'G' && state.multiHexMax === 'H' ? 'H' : (c.size as FootprintSize);
}

/** Çok altıgen kuralı bu yaratıkta geçerli mi. */
export function isMultiHex(state: MH, c: Pick<Combatant, 'size'>): boolean {
  if (!state.multiHex) return false;
  const big = c.size === 'L' || c.size === 'H' || c.size === 'G';
  if (big) bodyStats.multi++;
  return big;
}

/** Yaratık `at` çapasında dursaydı kaplayacağı altıgenler. */
export function bodyAt(state: MH, c: Pick<Combatant, 'size'>, at: Offset): Offset[] {
  return isMultiHex(state, c) ? footprint(at, bodySize(state, c)) : [at];
}

/** Yaratığın kapladığı altıgenler (konumsuzsa boş). */
export function bodyOf(state: MH, c: Pick<Combatant, 'size' | 'pos'>): Offset[] {
  return c.pos ? bodyAt(state, c, c.pos) : [];
}

/** Altıgen bu yaratığın gövdesinde mi. */
export function covers(state: MH, c: Pick<Combatant, 'size' | 'pos'>, h: Offset): boolean {
  if (!c.pos) return false;
  if (!isMultiHex(state, c)) return sameHex(c.pos, h);
  return bodyOf(state, c).some((x) => sameHex(x, h));
}

/** İki yaratık arasındaki mesafe (altıgen): gövdelerin en yakın iki altıgeni arası; tek altıgenlide `distance`. */
export function gap(state: MH, a: Pick<Combatant, 'size' | 'pos'>, b: Pick<Combatant, 'size' | 'pos'>): number {
  if (!a.pos || !b.pos) return Infinity;
  if (!isMultiHex(state, a) && !isMultiHex(state, b)) return distance(a.pos, b.pos);
  return footprintDistance(bodyOf(state, a), bodyOf(state, b));
}

/** Yaratığın `at` çapasındaki gövdesi ile bir altıgen arası (`from`/`to` adımları için). */
export function gapAt(state: MH, c: Pick<Combatant, 'size'>, at: Offset, h: Offset): number {
  return isMultiHex(state, c) ? footprintDistance(bodyAt(state, c, at), [h]) : distance(at, h);
}

// --- Kuyruk K69 (kural sürümü 53): ortak ayak izi çözücüsü ------------------------------------------------------------
// Bütün yeni gövde denetimleri buradan geçer; bayrak kapalıyken ya da sürüm < 53'te çapa altıgeni (eski hesap aynen).

type MHV = MH & Pick<BattleState, 'kuralSurumu'>;

/** Çok altıgen K69 kuralları bu yaratıkta geçerli mi (bayrak açık, sürüm 53+, Large ve üstü). */
export const isMultiHex53 = (state: MHV, c: Pick<Combatant, 'size'>): boolean => !!state.multiHex && ruleVersion(state) >= 53 && isMultiHex(state, c);

/** Etkiye açık altıgenler: K69'da gövde, değilse yalnız çapa. */
export function footprintOf(state: MHV, c: Pick<Combatant, 'size' | 'pos'>): Offset[] {
  if (!c.pos) return [];
  return isMultiHex53(state, c) ? bodyAt(state, c, c.pos) : [c.pos];
}

/** Yaratık bu altıgen kümesine (`col,row` anahtarları) değiyor mu: K69'da gövdenin herhangi bir altıgeni, değilse çapa. */
export function touches(state: MHV, c: Pick<Combatant, 'size' | 'pos'>, keys: ReadonlySet<string>): boolean {
  if (!c.pos) return false;
  if (!isMultiHex53(state, c)) return keys.has(`${c.pos.col},${c.pos.row}`);
  return bodyAt(state, c, c.pos).some((h) => keys.has(`${h.col},${h.row}`));
}

/** Yaratığın bir altıgene uzaklığı (altıgen): K69'da gövdenin en yakın altıgeninden, değilse çapadan. */
export function reachToHex(state: MHV, c: Pick<Combatant, 'size' | 'pos'>, h: Offset): number {
  if (!c.pos) return Infinity;
  return isMultiHex53(state, c) ? footprintDistance(bodyAt(state, c, c.pos), [h]) : distance(c.pos, h);
}
