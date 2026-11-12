/**
 * Kuyruk K74: iki kural sürümü tek yerde. Yaprak modül (yalnız sight.ts'e bağlı).
 * - 75: Truesight motorun beş eski yolunda tek sorgudan (`truesightSees`): fırsat saldırısı görme, hareket algısı (fırsat
 *   saldırısı), Cleave ikinci hedefi, Superior Hunter's Prey ikinci hedefi, uyuyan ejderhanın Algı süzgeci. Hallow (Hallowed
 *   Ward) tek toplu koruma: SRD'nin altı türü birden (`data/k74.json` `hallow.turler`); Extra Effect kapsam dışı.
 * - 76: batıran çamurun (`sinkMud`) gerçek bedeli: başarısızlıkta Restrained + Atletizm kurtulması (`data/k74.json` `sinkMud`).
 */
import data from '../../data/k74.json';
import { truesightSees } from './sight';
import type { BattleState, Combatant } from './types';

export const K74_VERSION = 75;
export const K74B_VERSION = 76;
export const k74On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= K74_VERSION;
export const k74bOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= K74B_VERSION;
export const K74 = data;

/**
 * Gözlemci için gizlenmiş mi: sürüm 75+ Truesight menzilindeki gizlenmiş (Hide → Invisible) yaratık gizli sayılmaz.
 * 74 ve altı eski davranış (`hidden` bayrağı tek başına).
 */
export const hiddenTo = (state: Pick<BattleState, 'map' | 'kuralSurumu'>, observer: Combatant, target: Combatant): boolean =>
  !!target.hidden && !(k74On(state) && truesightSees(state, observer, target));
