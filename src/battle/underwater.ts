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
import { altitudeOf, fissureDepthAt } from './altitude';
import { applyEvents } from './reduce';
import { registerCommandEnd } from './turnHooks';
import { k73cOn } from './k73cSurum';
import { breathesWater, breathLimit, deepWaterHex, submerged } from './underwaterCore';
import type { BattleEvent, BattleState } from './types';

export { DIVE_MAX_FT, SWIM_FACTOR, deepWaterHex, mapHasDeepWater, inWater, submerged, breathesWater, breathLimit } from './underwaterCore';

/**
 * Tur sonu (kendi turunun): batık ve su solumayan yaratığın nefes sayacı; süre bitince her tur sonu 1 Exhaustion (boğulma
 * seviyesi sayılır).
 */
export function breathTurnEndEvents(state: BattleState, id: string): BattleEvent[] {
  const c = state.combatants[id];
  if (!c || c.hp <= 0 || !submerged(state, c) || breathesWater(c)) return [];
  const used = (c.mapStatus.breath ?? 0) + 1;
  const limit = breathLimit(c);
  if (used <= limit) return [{ type: 'map_effect', rule: 'suAlti', targetId: id, text: `nefesini tutuyor (${used}/${limit} tur)`, mapStatus: { breath: used } }];
  const suff = (c.mapStatus.suffocation ?? 0) + 1;
  return [{ type: 'map_effect', rule: 'suAlti', targetId: id, text: `nefesi tükendi: boğuluyor (Exhaustion +1)`, mapStatus: { breath: used, suffocation: suff } },
    { type: 'exhaustion_changed', targetId: id, level: Math.min(6, (c.exhaustion ?? 0) + 1), reason: 'boğulma (su altı)' }];
}

/** Nefes alabilen (batık değil) yaratığın sayaçları sıfırlanır; boğulmadan gelen Exhaustion seviyeleri gider. */
export function breathRecoverEvents(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.mapStatus.breath && !c.mapStatus.suffocation) continue;
    if (submerged(state, c)) continue;
    const suff = c.mapStatus.suffocation ?? 0;
    out.push({ type: 'map_effect', rule: 'suAlti', targetId: c.id, text: suff ? 'nefes aldı (boğulma bitti)' : 'nefes aldı', mapStatus: { breath: 0, suffocation: 0 } });
    if (suff && c.hp > 0) out.push({ type: 'exhaustion_changed', targetId: c.id, level: Math.max(0, (c.exhaustion ?? 0) - suff), reason: 'nefes aldı' });
  }
  return out;
}

// Komut sonu (64+): batık sudan çıkmışsa irtifa 0; kendi turunu bitirenin nefesi; nefes alabilenin sayaçları.
registerCommandEnd((_before, next, _events, cmd) => {
  if (!k73cOn(next) || !next.map) return [];
  const out: BattleEvent[] = [];
  let s = next;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  for (const c of Object.values(next.combatants)) {
    // Eksi irtifadaki (kazan değil, yarıkta değil) yaratık derin sudan çıktıysa (itme, ışınlanma) yüzeye.
    if (!c.pos || altitudeOf(c) >= 0 || c.burrowed || deepWaterHex(next, c.pos) || fissureDepthAt(next, c.pos) > 0) continue;
    push([{ type: 'altitude_changed', targetId: c.id, altitudeFt: 0, label: 'sudan çıktı' }]);
  }
  if (cmd.type === 'end_turn') push(breathTurnEndEvents(s, cmd.actorId));
  push(breathRecoverEvents(s));
  return out;
});
