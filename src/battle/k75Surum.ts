/**
 * Kuyruk K75 (kural sürümü 79): küçük açıklar, tek sabit. Yaprak modül (yalnız tür bağı).
 * - Binek: `Combatant.egitimli` ("trained mount") bayrağı veriden (`Monster.egitimli`) kontrollü bineği belirler; yapay zekâ
 *   mevcut `mount`/`dismount` komutlarıyla, yalnız yakın dövüşçü biniciyi, bitişik eğitimli bineğe bindirir (`ai/k75.ts`).
 * - Diğer maddeler (Protection from Evil and Good, sinkMud, P9 tepki save'i, Control Water/flashFlood/boncuk) aynı sürüm
 *   kapısında; ayrıntı DECISIONS.md K75.
 * 78 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const K75_VERSION = 79;
export const k75On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= K75_VERSION;
