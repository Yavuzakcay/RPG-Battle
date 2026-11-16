/**
 * Kuyruk KQ6-8 (kural sürümü 82): yüzücü canavarlar suda. Tek sabit; yaprak modül.
 * - Yüzme hızı olan canavar (data/yuzme-hizi.json; derin-su.json yüzücü listeleriyle aynı küme) kurulumda su altıgenlerine
 *   konabilir (GM: her su altıgeni; oyuncu/otomatik: başlangıç bölgesine bitişik su altıgeni), savaşta su altıgenlerini
 *   (derin `w`, sığ `n`, nehir `R`) normal maliyetle geçer ve suda iken hızı max(yürüme, yüzme) olur (`Combatant.inWater`
 *   olaylardan türetilir; replay aynı). 81 ve altı: su altıgenine konulmaz, su zorlu zemin, hız yürüme hızı.
 */
import type { BattleState } from './types';

export const YUZME_VERSION = 82;
export const yuzmeOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= YUZME_VERSION;
/** Yüzme için su sayılan zemin harfleri (derin `w`, sığ `n`, nehir `R`). */
export const SWIM_TILES = new Set(['w', 'n', 'R']);
