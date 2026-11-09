/**
 * Kuyruk K71c (kural sürümü 58+; kullanıcı kararları, `harita/belgeler/K71C-DENETIM.md`): prizma hava ızgarası.
 *
 * - Her altıgenin üstünde 5 ft'lik düzeyler (prizma hücreleri): düzey = irtifa / 5, yer = 0. Düzey İŞARETLİ tamsayıdır:
 *   eksi düzey (yer altı; Earthquake yarığının eksi irtifası, ileride su altı) şemada ayrılır, davranışı yoktur (yalnız
 *   hücre sayımına girer).
 * - Yuvarlama: 5'in katı olmayan irtifa aşağı yuvarlanır (⌊irtifa / 5⌋; yaratığın ayaklarının bulunduğu hücre). Motor
 *   irtifayı sayı olarak tutmaya devam eder (ikinci harita verisi yok, kayıt biçimi aynı); komutlar 5'in katı ister.
 * - Yaratık ayak izi (çok altıgen dahil) × [düzey, düzey + boy − 1] hücrelerini kaplar; boy düzey olarak K68b boyundan:
 *   Tiny/Small/Medium 1, Large 2, Huge 3, Gargantuan 4.
 * - Aynı hücreyi iki yaratık paylaşamaz; hücreleri çakışmıyorsa aynı altıgende yerdeki ve havadaki yaratık durur.
 * - Uzaklık max(yatay, dikey) (K9): dikey bileşen bant aralığı (alt hücre − öbürünün üst hücresi) × 5 ft.
 * Hızlı yol: savaşta irtifası 0 olmayan yaratık yoksa çağıranlar eski kodu kullanır (`anyAloft`). Saf.
 */
import { bodyHeightFt } from './altitude';
import { ruleVersion } from './ruleVersion';
import type { BattleState, Combatant } from './types';

/** Kuyruk K71c: hava ızgarasının kural sürümü. */
export const CELLS_VERSION = 58;
export const cellsOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= CELLS_VERSION;

/** Bir düzeyin yüksekliği (ft). */
export const LEVEL_FT = 5;
/** İrtifa → düzey (işaretli; aşağı yuvarlama). */
export const levelOf = (ft: number): number => Math.floor(ft / LEVEL_FT);
/** Düzey → irtifa (ft). */
export const levelToFt = (level: number): number => level * LEVEL_FT;
/** 5'in katına oturtma (aşağı). */
export const snapFt = (ft: number): number => levelToFt(levelOf(ft));
/** Yaratığın boyu düzey olarak (en az 1). */
export const heightLevels = (c: Pick<Combatant, 'size'>): number => Math.max(1, Math.ceil(bodyHeightFt(c) / LEVEL_FT));

/** Düzey aralığı (iki uç dahil). */
export interface Band { lo: number; hi: number }
export const GROUND_BAND: Band = { lo: 0, hi: 0 };
/** Yaratığın kapladığı düzeyler (verilen irtifada; yoksa kendi irtifası). */
export const bandOf = (c: Pick<Combatant, 'size' | 'altitudeFt'>, altFt: number = c.altitudeFt ?? 0): Band => {
  const lo = levelOf(altFt);
  return { lo, hi: lo + heightLevels(c) - 1 };
};
export const bandsOverlap = (a: Band, b: Band): boolean => a.lo <= b.hi && b.lo <= a.hi;
/** İki bant arası düzey aralığı (çakışıyorsa 0). */
export const bandGap = (a: Band, b: Band): number => Math.max(0, b.lo - a.hi, a.lo - b.hi);

/** Sürüm 58+'da yaratığın kendi bandı (doluluk sorgusuna), öncesinde undefined (eski davranış). */
export const moverBand = (state: Pick<BattleState, 'kuralSurumu'>, c: Pick<Combatant, 'size' | 'altitudeFt'>): Band | undefined => (cellsOn(state) ? bandOf(c) : undefined);

/** Kuyruk K71c: hücre çözücüsünün tam yolu kaç kez çalıştı (testler; hızlı yolda artmaz). */
export const cellStats = { full: 0 };

/** Savaşta irtifası 0 olmayan (havada, duvarda ya da yarıkta) yaratık var mı. */
export function anyAloft(state: Pick<BattleState, 'combatants'>): boolean {
  for (const c of Object.values(state.combatants)) if (c.pos && (c.altitudeFt ?? 0) !== 0) return true;
  return false;
}

/**
 * Hücre doluluk çözücüsü (tek işlev, sürüm 58+): `c` yaratığı `probe` bandını kaplıyor mu. Sürüm 57 ve altında ya da hiç
 * havada yaratık yokken bant bakılmaz (her yaratık altıgenini doldurur; eski davranış).
 */
export function fillsBand(state: BattleState, c: Combatant, probe: Band | undefined): boolean {
  if (!cellsOn(state) || !probe) return true;
  if ((c.altitudeFt ?? 0) === 0 && probe.lo <= 0 && probe.hi >= 0) return true;
  cellStats.full++;
  return bandsOverlap(bandOf(c), probe);
}
