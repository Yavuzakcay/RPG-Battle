/**
 * Kuyruk 26 (H3): yükseklik katmanı. Harita JSON'unda isteğe bağlı `heights` (satır → sütun → seviye, −3..+8) ve `ramps`;
 * savaş durumuna `MapState.heights`/`ramps` olarak kopyalanır. Katman yoksa seviye zeminden gelir (H, h = 1; z = 2; diğerleri
 * 0) ve bu dosyanın mekanikleri hiç çalışmaz (eski haritalar birebir aynı). Mekanikler kural sürümü 6 ve Game Master
 * anahtarlarıyla (`data/kural-kontrol.json`, `heights: true` global kurallar):
 * - `heightMove`: bir seviye çıkmak 1 + `levelCost` hareket; 2+ seviye fark yürünmez (uçurum/duvar) — rampa/merdiven, tırmanma
 *   (`climb` komutu, Atletizm `climbDc`), aşağı atlama (gönüllü düşme) ya da uçuş/tırmanıcı ile aşılır. Yol bulma (oyuncu ve
 *   yapay zekâ) duvarı geçilmez sayar; yapay zekâ tırmanma komutu vermez.
 * - `heightFall`: düşülen seviye × `levelFt` için SRD düşme hasarı (10 ft başına 1d6, en çok 20d6, hasar alırsa Prone).
 * - `heightCombat`: yüksek zemin avantajı/dezavantajı katman seviyesiyle; 2+ seviye üstten menzilli saldırıda normal menzil
 *   +`rangeBonusHexes`; hedefin önündeki kenar (hedeften yüksek, saldırandan yüksek değil) yarım siper.
 * - `heightSight`: aradaki altıgen hem saldırandan hem hedeften yüksekse görüş kapalı.
 * - `heightShow`: yalnızca arayüz (katman renk tonu ve rampa okları).
 * Saf; zar atmaz.
 */
import { hexKey, neighbors, type Offset } from '../rules/hex';
import { terrainOf } from '../map/terrain';
import { globalRule } from './ruleControl';
import { k73cOn } from './k73cSurum';
import { body64At } from './bodyLeaf';
import dikeyData from '../../data/dikey.json';
import type { BattleState, Combatant } from './types';

type St = Pick<BattleState, 'map' | 'kuralSurumu'>;

/**
 * Kuyruk K71d (kural sürümü 59+; `harita/belgeler/K71D-DENETIM.md`): katman ile irtifa tek mutlak yükseklikte (zemin +
 * irtifa; `vertical.ts` `mutlakFt`), K8 yüksek zemin (mutlak zemin farkı ≥ 10 ft, iki uç yerde), K9 uzaklıkta zemin terimi,
 * katman uçurumunda SRD ft başına tırmanma. 58 ve altı birebir.
 */
export const KATMAN_VERSION = 59;
export const katmanOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= KATMAN_VERSION;
/**
 * Kuyruk K72 (kural sürümü 60+; `harita/belgeler/K72-DENETIM.md`): oda tavanı (`dikey.odalar`), sur üstünde durma
 * (`dikey.surUstu`, K5) ve çok katlı bina (`dikey.katlar`): tek "duruş yüzeyi" modeli (`stand.ts`). 59 ve altı birebir.
 */
export const K72_VERSION = 60;
export const k72On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K72_VERSION;
const HG = dikeyData.yuksekZemin;

/** Katman bu savaşta var mı (harita katmanı + kural sürümü 6). */
export const layerActive = (state: St): boolean => !!state.map?.heights && (state.kuralSurumu ?? 1) >= 6;

/** Altıgenin seviyesi: katmandan; katman yoksa zeminden (H, h = 1; z = 2). */
export function heightAt(state: Pick<BattleState, 'map'>, h: Offset): number {
  const layer = state.map?.heights;
  if (layer) return layer[h.row]?.[h.col] ?? 0;
  return terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#').height;
}

/** `from`dan `to`ya seviye farkı (pozitif: yukarı). */
export const heightDelta = (state: Pick<BattleState, 'map'>, from: Offset, to: Offset): number => heightAt(state, to) - heightAt(state, from);

/** Rampa/merdiven: `ramps` listesi ya da basamak zemini (`l`). */
export function isRamp(state: Pick<BattleState, 'map'>, h: Offset): boolean {
  if (state.map?.ramps?.includes(hexKey(h))) return true;
  return terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#').stairs === true;
}

const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const active = (state: St, id: string) => (layerActive(state) ? globalRule(state, id) : undefined);

export const heightMoveRule = (state: St) => active(state, 'heightMove');
export const heightFallRule = (state: St) => active(state, 'heightFall');
export const heightCombatRule = (state: St) => active(state, 'heightCombat');
export const heightSightRule = (state: St) => active(state, 'heightSight');
export const heightShowRule = (state: St) => active(state, 'heightShow');

/** Bir seviyenin ft karşılığı (Game Master parametresi; anahtar kapalıyken de gösterim için). */
export const levelFeet = (state: Pick<BattleState, 'map'>): number => num(state.map?.ruleParams?.heightFall?.levelFt, 10);

/** Tırmanma DC'si ve seviye başına ek hareket. */
export const climbDc = (state: St): number => num(heightMoveRule(state)?.climbDc, 12);
export const levelCost = (state: St): number => num(heightMoveRule(state)?.levelCost, 1);

/** İki komşu altıgen arası doğrudan yürünebilir mi (2+ seviye ve rampa yok = duvar/uçurum). */
export function isCliff(state: Pick<BattleState, 'map'>, from: Offset, to: Offset): boolean {
  return Math.abs(heightDelta(state, from, to)) > 1 && !isRamp(state, from) && !isRamp(state, to);
}

/**
 * Yürüme adımının yükseklik kuralı (`moveCostFn` içinde): null = kural yok (eski davranış). Dönen işlev adımın ek maliyetini
 * verir; null = duvar (yürünmez). Uçan ve tırmanıcı (Spider Climb, `climber`) muaf.
 */
export function heightStepFn(state: St, exempt: boolean): ((h: Offset, prev: Offset) => number | null) | null {
  if (exempt || !heightMoveRule(state)) return null;
  const per = levelCost(state);
  return (h, prev) => {
    if (isCliff(state, prev, h)) return null;
    const up = heightDelta(state, prev, h);
    return up > 0 && !isRamp(state, h) && !isRamp(state, prev) ? per * up : 0;
  };
}

/**
 * Kuyruk K73c (sürüm 64+, çok altıgen): gövdenin adım maliyeti en yüksek ayak altından: çapa adımında gövdenin seviyesi
 * (ayak izinin en yükseği) 2+ artarsa geçilmez (uçurum), 1 artarsa `levelCost`; rampada normal. Tek altıgenlide `heightStepFn`.
 */
export function bodyHeightStepFn(state: St, exempt: boolean, c: { size?: Combatant['size'] }): ((h: Offset, prev: Offset) => number | null) | null {
  if (exempt || !heightMoveRule(state)) return null;
  const per = levelCost(state);
  return (h, prev) => {
    const up = bodyLevel(state, c, h) - bodyLevel(state, c, prev);
    if (up >= 2 && !isRamp(state, h) && !isRamp(state, prev)) return null;
    return up > 0 && !isRamp(state, h) && !isRamp(state, prev) ? per * up : 0;
  };
}

/** Komşu altıgenler arasında katmanın verdiği seviye (savaş kuralı açıksa; değilse zemin yüksekliği). */
export function combatHeightAt(state: St, h: Offset): number {
  if (heightCombatRule(state)) return heightAt(state, h);
  return terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#').height;
}

/**
 * 2+ seviye üstten menzilli saldırının normal menzil eki (ft). Kuyruk K71d (sürüm 59+, K8): iki uç yerdeyken (irtifa 0) ve
 * mutlak zemin farkı ≥ `yuksekZemin.menzilEkiFt` (20 ft) iken; havadaki, duvardaki sayılmaz.
 */
export function rangeBonusFt(state: St, from: Offset, to: Offset, who?: { a: Pick<Combatant, 'altitudeFt'>; t: Pick<Combatant, 'altitudeFt'> }): number {
  const r = heightCombatRule(state);
  if (!r) return 0;
  if (katmanOn(state)) {
    if ((who?.a.altitudeFt ?? 0) !== 0 || (who?.t.altitudeFt ?? 0) !== 0) return 0;
    if ((heightAt(state, from) - heightAt(state, to)) * levelFeet(state) < HG.menzilEkiFt) return 0;
    return num(r.rangeBonusHexes, 1) * 5;
  }
  if (heightAt(state, from) - heightAt(state, to) < 2) return 0;
  return num(r.rangeBonusHexes, 1) * 5;
}

/**
 * Kuyruk K71d (sürüm 59+, K8; ⚠ SRD'de yok, `heightCombat` ev kuralı): yüksek zemin. Yalnız katmanlı haritada, anahtar açıkken
 * ve iki uç yerdeyken (irtifa 0: havadaki uçan, duvardaki tırmanan, yarıktaki sayılmaz). Mutlak zemin farkı (ft) ≥
 * `yuksekZemin.avantajFt` (10): 1 saldıran yüksekte, −1 alçakta, 0 yok. Kural dışıysa (sürüm < 59, katmansız, anahtar kapalı)
 * null: çağıran eski seviye kuralını kullanır. `ft`: zemin farkı (saldıran − hedef).
 */
/** Kuyruk K73c (sürüm 64+): gövdenin katman seviyesi: çok altıgenlide ayak izinin en yükseği, değilse çapanın. */
function bodyLevel(state: St, c: { size?: Combatant['size'] }, at: Offset): number {
  const foot = body64At(state as Parameters<typeof body64At>[0], c.size, at);
  if (!foot) return heightAt(state, at);
  return Math.max(...foot.map((h) => heightAt(state, h)));
}

export function highGroundK8(state: St, a: Pick<Combatant, 'pos' | 'altitudeFt'> & { size?: Combatant['size'] }, t: Pick<Combatant, 'pos' | 'altitudeFt'> & { size?: Combatant['size'] }): { side: -1 | 0 | 1; ft: number; aloft?: true } | null {
  if (!katmanOn(state) || !heightCombatRule(state) || !a.pos || !t.pos) return null;
  // Kuyruk K73c (sürüm 64+): çok altıgenli gövdede en yüksek ayak altı (`vertical.ts` `bodyZeminFt` ile aynı tanım).
  const ft = (bodyLevel(state, a, a.pos) - bodyLevel(state, t, t.pos)) * levelFeet(state);
  if ((a.altitudeFt ?? 0) !== 0 || (t.altitudeFt ?? 0) !== 0) return { side: 0, ft, aloft: true };
  return { side: ft >= HG.avantajFt ? 1 : ft <= -HG.avantajFt ? -1 : 0, ft };
}

/** Görüş: yol üstündeki (uçlar hariç) altıgen iki uçtan da yüksekse kesen "yükselti"; kural kapalıysa null. */
export function heightSightBlock(state: St, path: Offset[]): string | null {
  if (path.length < 3 || !heightSightRule(state)) return null;
  const a = path[0] as Offset;
  const b = path[path.length - 1] as Offset;
  const top = Math.max(heightAt(state, a), heightAt(state, b));
  for (const h of path.slice(1, -1)) if (heightAt(state, h) > top) return 'yükselti';
  return null;
}

/** Kenar siperi: hedefin önündeki (çizgide son ara) altıgen hedeften yüksek, saldırandan yüksek değilse yarım siper. */
export function ledgeCover(state: St, path: Offset[]): boolean {
  if (path.length < 3 || !heightCombatRule(state)) return false;
  const a = path[0] as Offset;
  const t = path[path.length - 1] as Offset;
  const ledge = path[path.length - 2] as Offset;
  const l = heightAt(state, ledge);
  return l > heightAt(state, t) && heightAt(state, a) <= l;
}

/** Arayüz: rampa okları: rampanın seviye farklı komşularıyla kenarı, alçaktan yükseğe (`from` → `to`). */
export function rampEdges(state: St): Array<{ from: Offset; to: Offset }> {
  if (!heightShowRule(state) || !state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const out: Array<{ from: Offset; to: Offset }> = [];
  state.map.tiles.forEach((row, r) => [...row].forEach((_, c) => {
    const at = { col: c, row: r };
    if (!isRamp(state, at)) return;
    for (const n of neighbors(at, size)) {
      const d = heightDelta(state, at, n);
      if (d > 0) out.push({ from: at, to: n });
      else if (d < 0) out.push({ from: n, to: at });
    }
  }));
  return out;
}

