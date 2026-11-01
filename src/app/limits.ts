/** Uygulama sınırları (tek yerde). */

/** Partide ve kayıtlı karakter listesinde en fazla karakter sayısı. */
export const MAX_PARTY = 6;

/** Özel canavarın saldırı alanında en fazla karakter. */
export const CUSTOM_ATTACK_MAX = 300;

/** Özel canavarın adında en fazla karakter (Görev U): yeni girişte ve listeye eklerken; eski kayıtlardaki uzun adlar kırpılmaz. */
export const CUSTOM_NAME_MAX = 50;

/**
 * Kuyruk 38: seviye sınırı. Varsayılan 5 (Aşama 1); Game Master "Üst seviye (6–10)" açıkken 10. Eski kayıtlardaki daha
 * yüksek seviyeli karakterler yüklenir ve seviyeleri korunur (oluşturucu yalnızca yeni seçimi sınırlar).
 */
export const LEVEL_CAP = 5;
export const UPPER_LEVEL_CAP = 10;
export const levelCap = (upper: boolean): number => (upper ? UPPER_LEVEL_CAP : LEVEL_CAP);
