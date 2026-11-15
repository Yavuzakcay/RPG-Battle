/**
 * Kuyruk KQ4 CK1: karakter hikâyesi (isteğe bağlı serbest metin; savaşa ve kural sürümüne girmez). Hazır tablo yok.
 * Her alan çok satırlı metin, en çok `STORY_MAX` karakter; boş alanlar kayıtta, JSON dışa aktarmada ve çıktıda yer almaz. Saf, verisiz.
 */
export const STORY_MAX = 4000;
export const STORY_FIELDS = ['gecmisHikayesi', 'kisilik', 'idealler', 'baglar', 'kusurlar', 'gorunum', 'notlar'] as const;
export type StoryField = (typeof STORY_FIELDS)[number];
export type Hikaye = Partial<Record<StoryField, string>>;

/** Boş (yalnız boşluk) alanları atar, kenar boşluklarını kırpar ve üst sınırı uygular; hiç alan kalmadıysa undefined. */
export function cleanStory(h: unknown): Hikaye | undefined {
  if (!h || typeof h !== 'object') return undefined;
  const out: Hikaye = {};
  for (const k of STORY_FIELDS) {
    const v = (h as Record<string, unknown>)[k];
    if (typeof v !== 'string') continue;
    const t = v.replace(/\r\n/g, '\n').trim().slice(0, STORY_MAX);
    if (t) out[k] = t;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Dolu (görünecek) alanlar sırayla. */
export const filledStory = (h: Hikaye | undefined): Array<[StoryField, string]> =>
  STORY_FIELDS.flatMap((k) => { const v = h?.[k]?.trim(); return v ? [[k, v] as [StoryField, string]] : []; });
export const hasStory = (h: Hikaye | undefined): boolean => filledStory(h).length > 0;
