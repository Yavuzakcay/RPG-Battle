/**
 * Kuyruk K73c (kural sürümü 64+, Görev 2; `harita/belgeler/K73C-DENETIM.md` §2): tam SRD 5.2.1 su altı savaşı. Kullanıcı
 * kararı: tam SRD.
 *
 * Tasarım (K71c prizma ızgarası, K73b): derin su altıgeninde (`w`) irtifa 0 = yüzeyde yüzme, eksi irtifa = batık. Derin su
 * altıgeni su altı sayılır (63'teki `isUnderwater` aynen): oradaki uçmayan/süzülmeyen yaratık su altı savaş kurallarına girer.
 * - Silah (Impeded Weapons): yüzme hızı olmayanın Piercing olmayan yakın dövüş silahı dezavantajlı; menzilli silah normal
 *   menzil ötesinde otomatik ıska, içinde dezavantaj (`rules/modes.ts` `underwaterSources`). 64+'da hedef batıksa saldıran su
 *   dışında olsa da (mermi/silah suya girer); canavar saldırısında da yüzme hızı istisnası.
 * - Ateş direnci: su altındaki her şey (yüzeyde ve batık) ateşe dirençli (`auras.ts` `auraResistOf`).
 * - Nefes (Suffocation): batık ve su solumayan, 1 + CON dakika (en az 30 sn) tutar; bitince her tur sonu 1 Exhaustion; nefes
 *   alınca (batık değilken) bu seviyeler gider. Sayaçlar `mapStatus.breath`/`suffocation` (`map_effect`).
 * - Dalış/çıkış `vertical_move` (en çok `suAlti.derinlikFt`); yüzme hızı olmayanın 5 ft'i `yuzmeCarpani` altıgen. Batık
 *   yalnız derin su altıgenlerinde yürür; sudan çıkış yüzeyden.
 * Süzülen (U1a) ve uçan su altı sayılmaz. Sığ su/çamur ve batak sıvı değildir (K73b). Saf.
 */
import dikeyData from '../../data/dikey.json';
import { getMonster } from '../data';
import { terrainOf } from '../map/terrain';
import { isAirborne } from './flight';
import { k73cOn } from './k73cSurum';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const W = (dikeyData as unknown as { suAlti: { derinlikFt: number; yuzmeCarpani: number; dakikaTur: number; enAzTur: number; soluyanNotlar: string[] } }).suAlti;
export const DIVE_MAX_FT = W.derinlikFt;
export const SWIM_FACTOR = W.yuzmeCarpani;

/** Altıgen derin su mu (`movement.ts` `terrainAt` kuralı zemin harfinden gelir; nesne/duvar onu değiştirmez). */
export const deepWaterHex = (state: Pick<BattleState, 'map'>, h: Offset): boolean => terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#').rule === 'deepWater';

const WET = new WeakMap<readonly string[], boolean>();
/** Haritada derin su altıgeni var mı (zemin satırları başına önbellek; hızlı yol). */
export function mapHasDeepWater(state: BattleState): boolean {
  const tiles = state.map?.tiles;
  if (!tiles) return false;
  let v = WET.get(tiles);
  if (v === undefined) { v = tiles.some((row) => [...row].some((ch) => ch === 'w')); WET.set(tiles, v); }
  return v;
}

/** Derin suda, uçmayan (süzülen de değil): su altı savaş kuralları (yüzeyde ya da batık). */
export const inWater = (state: BattleState, c: Combatant): boolean => !!c.pos && mapHasDeepWater(state) && !isAirborne(c) && !c.burrowed && deepWaterHex(state, c.pos);

/** Batık mı (64+): derin suda eksi irtifa. */
export const submerged = (state: BattleState, c: Combatant | undefined): boolean =>
  !!c && k73cOn(state) && (c.altitudeFt ?? 0) < 0 && inWater(state, c);

const breathers = new Map<string, boolean>();
/** Su soluyor mu: canavar notunda Water Breathing / Amphibious / Hold Breath (savaş boyu yeter), ya da `waterBreathing` etkisi. */
export function breathesWater(c: Combatant): boolean {
  if (c.effects?.some((e) => e.id.includes('water-breathing'))) return true;
  if (!c.monsterId) return false;
  let b = breathers.get(c.monsterId);
  if (b === undefined) {
    let notes: string[] = [];
    try { notes = getMonster(c.monsterId).unsupported ?? []; } catch { notes = []; }
    b = notes.some((u) => W.soluyanNotlar.some((n) => u.includes(n)));
    breathers.set(c.monsterId, b);
  }
  return b;
}

/** Nefes tutma süresi (tur): (1 + CON) dakika, en az 30 sn. */
export const breathLimit = (c: Combatant): number => Math.max(W.enAzTur, (1 + c.modifiers.con) * W.dakikaTur);
