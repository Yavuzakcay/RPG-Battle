/**
 * Kuyruk B2: büyü betimlemeleri (data/buyu-betimleme.json). Yalnız görünüm: büyü verisindeki `text` (mekanik; ortam kuralı
 * anahtar sözcükle okur) ve motor buraya hiç bakmaz. Saf modül: dosya okumaz, veri parametre alır.
 * Yapı çok dilli genişlemeye hazır: `{ "<kimlik>": { "tr": "…", "en": "…" } }` (şimdilik yalnız `tr`).
 */
export type Lang = 'tr' | 'en';
export interface SpellDescription { tr?: string; en?: string }
export type SpellDescriptions = Record<string, SpellDescription>;

/** Betimleme başına en çok karakter (kart taşmasın). */
export const DESCRIPTION_MAX = 135;

/**
 * Veri erişimi: istenen dilin metni, yoksa Türkçe (`en` → `tr`). Yok ya da boşsa `undefined`.
 * Arayüz bunu doğrudan kullanmaz (EN modunda Türkçe betimleme gösterilmez): bkz. `descriptionShown`.
 */
export function betimlemeOf(table: SpellDescriptions, id: string, lang: Lang): string | undefined {
  const e = table[id];
  const text = e?.[lang] ?? e?.tr;
  return text && text.trim() ? text : undefined;
}

/** Arayüz erişimi: yalnız o dilin kendi metni (EN modunda `en` yoksa gizli; Türkçeye düşmez). */
export function descriptionShown(table: SpellDescriptions, id: string, lang: Lang): string | undefined {
  const text = table[id]?.[lang];
  return text && text.trim() ? text : undefined;
}

export interface DescriptionReport { errors: string[]; warnings: string[] }

/**
 * Şema ve kapsam doğrulaması. Hata: eksik/fazla kimlik, yapı bozukluğu, boş metin, 135 karakter üstü.
 * Uyarı: metinde rakam (mekanik sızıntısı; büyü adı geçebilir, hata değil).
 */
export function validateDescriptions(data: unknown, spellIds: readonly string[]): DescriptionReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { errors: ['kök bir nesne olmalı'], warnings };
  const ids = new Set(spellIds);
  const table = data as Record<string, unknown>;
  for (const [id, v] of Object.entries(table)) {
    if (id.startsWith('_')) continue;
    if (!ids.has(id)) { errors.push(`${id}: fazla kimlik (büyü yok)`); continue; }
    if (!v || typeof v !== 'object' || Array.isArray(v)) { errors.push(`${id}: { tr, en? } nesnesi olmalı`); continue; }
    const entry = v as Record<string, unknown>;
    for (const k of Object.keys(entry)) if (k !== 'tr' && k !== 'en') errors.push(`${id}: bilinmeyen dil anahtarı "${k}"`);
    const tr = entry.tr;
    if (typeof tr !== 'string' || !tr.trim()) { errors.push(`${id}: tr boş ya da metin değil`); continue; }
    if (tr.length > DESCRIPTION_MAX) errors.push(`${id}: tr ${tr.length} karakter (en çok ${DESCRIPTION_MAX})`);
    if (/\d/.test(tr)) warnings.push(`${id}: tr metninde rakam var`);
    if ('en' in entry && (typeof entry.en !== 'string' || !entry.en.trim())) errors.push(`${id}: en boş ya da metin değil`);
    if (typeof entry.en === 'string' && entry.en.length > DESCRIPTION_MAX) errors.push(`${id}: en ${entry.en.length} karakter (en çok ${DESCRIPTION_MAX})`);
  }
  for (const id of spellIds) if (!(id in table)) errors.push(`${id}: betimleme yok`);
  return { errors, warnings };
}
