/**
 * Kuyruk KQ3 NA1 (kural sürümü 80): nesne ağırlığı ve taşıma, tek sabit. Yaprak modül (yalnız tür bağı).
 * - Nesnede ağırlık (`agirlikLb`, veriden; haritadaki nesnede ve Game Master komutuyla ezilir); taşıma kapasitesi STR × 15 lb (boyut ve
 *   Powerful Build çarpanıyla); kapasiteyi aşan nesne tek kişiye reddedilir, birden çok taşıyıcı ağırlığı paylaşır (hepsinin hızı yarıya);
 *   taşıyan düşer/Incapacitated/Prone olursa nesne düşer; ağırlık sınıfı ve fırlatma menzili ağırlıktan.
 * - Oda kuralı "Taşıma yükü: kapalı" iken ağırlık sınırı yok (`BattleState.tasima`).
 * 79 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const NA1_VERSION = 80;
export const nesneOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= NA1_VERSION;
