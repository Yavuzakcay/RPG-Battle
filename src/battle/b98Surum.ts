/**
 * Görev B98 (kural sürümü 98; GENEL96 kalanlarıyla aynı sürüm): B94 ek görevi (SRD 5.2.1). Tek sabit; yaprak modül.
 * - Bardic Inspiration zarını alan yaratık d20 sonucunu görünce kullanıp kullanmayacağına karar verir (oyuncuya sorulur;
 *   yapay zekâ ve kancasız Rng eski davranışla kullanır).
 * - Thrown özelliğiyle fırlatılan Melee silah "Melee weapon" sayılır: Divine Smite (ve smite büyüleri) ile Radiant Strikes açılır.
 * - Lay On Hands herhangi bir yaratığa (SRD 5.2.1 s. 53 "touch a creature"; tür istisnası yok).
 * 97 ve altı (eski kayıt, replay) aynen. Ayrıntı DECISIONS.md "B98".
 */
import type { BattleState } from './types';

export const B98_VERSION = 98;
export const b98On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= B98_VERSION;
