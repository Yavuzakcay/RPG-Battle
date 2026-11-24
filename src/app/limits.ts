/** Uygulama sınırları (tek yerde). */

/** Partide ve kayıtlı karakter listesinde en fazla karakter sayısı. */
export const MAX_PARTY = 6;

/** Özel canavarın saldırı alanında en fazla karakter. */
export const CUSTOM_ATTACK_MAX = 300;

/** Özel canavarın adında en fazla karakter (Görev U): yeni girişte ve listeye eklerken; eski kayıtlardaki uzun adlar kırpılmaz. */
export const CUSTOM_NAME_MAX = 50;

/**
 * Karakter seviye sınırı (tek sabit): 20, SRD'nin tamamı. Kullanıcı kararı 2026-11-19: Kuyruk 38'in 5. seviye sınırı ve
 * "Üst seviye (6–20)" anahtarı kalktı; oluşturucu ve Serüven seviye atlaması her zaman 1–20.
 */
export const LEVEL_CAP = 20;

/**
 * Görev MC1: bir karakterde en çok sınıf sayısı (tek sabit; kullanıcı kararı K4, 2026-11-24). SRD 5.2.1'de sınıf sayısı
 * sınırı yok: ev kuralı, Dice & Hex ve Serüven'de aynı (harita/belgeler/MULTICLASS-PLAN.md).
 */
export const MAX_CLASSES = 3;
