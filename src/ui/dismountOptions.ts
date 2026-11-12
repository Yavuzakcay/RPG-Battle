/**
 * Kuyruk MB6 (yalnız arayüz; kural sürümü değişmez): havada inme irtifası seçenekleri. Motor sınırlarını (MB3 `mounted.ts`
 * `dismount69`) okur, yeni kural koymaz: uçabilen binici bineğinin bandının 5 ft yakınında (alt − 5 … alt + bineğin boyu),
 * 5 ft adımlarla, tavan/uçuş üst sınırının altında ve yerin altına inmeden irtifa seçebilir. Uçamayan binici için seçici
 * yoktur: havadaki binekten iner ve düşer. Saf.
 */
import { altitudeCapFt, bodyHeightFt } from '../battle/altitude';
import { binekMb3On } from '../battle/binekSurum';
import { flySpeed } from '../battle/flight';
import type { BattleState, Combatant } from '../battle/types';

export interface DismountOptions {
  /** Seçici gösterilsin mi (uçabilen binici, sürüm 69+, havada ya da bineğin 5 ft çevresinde seçenek var). */
  picker: boolean;
  /** Varsayılan irtifa (bineğinin irtifası). */
  defaultFt: number;
  /** Seçilebilir irtifalar (ft, yukarıdan aşağı). */
  levels: number[];
  /** Uçamayan binici havada iniyor: kısa uyarı gösterilsin (düşer). */
  fallWarning: boolean;
}

export function dismountOptions(state: BattleState, rider: Combatant): DismountOptions {
  const alt = rider.altitudeFt ?? 0;
  const none: DismountOptions = { picker: false, defaultFt: alt, levels: [], fallWarning: false };
  if (!rider.riding || !binekMb3On(state)) return none;
  const mount = state.combatants[rider.riding];
  if (!mount) return none;
  // Uçamayan binici: seçici yok, havadaki binekten iner ve düşer.
  if (flySpeed(rider) <= 0) return { ...none, fallWarning: alt > 0 };
  const lo = Math.max(Math.min(0, alt), alt - 5);
  const hi = alt + bodyHeightFt(mount);
  const cap = rider.pos ? altitudeCapFt(state, rider) : Infinity;
  const levels: number[] = [];
  for (let ft = hi - (hi % 5); ft >= lo; ft -= 5) if (ft <= 0 || ft <= cap) levels.push(ft);
  if (!levels.includes(alt)) levels.push(alt);
  levels.sort((a, b) => b - a);
  return { picker: levels.length > 1, defaultFt: alt, levels, fallWarning: false };
}
