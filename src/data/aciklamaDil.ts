/**
 * Görev SD4: açıklama metninin dili (yalnız tarama ve test; çalışma zamanı kararı değil). Sezgisel: İngilizce SRD ham metni
 * sık İngilizce işlev sözcükleri taşır, Türkçe açıklama Türkçe harf ya da sözcük. Boş ya da çok kısa/dil belirsiz metin
 * "İngilizce değil" sayılır; boş metin ayrıca `bos` ile sorulur.
 */
const EN_WORDS = new Set(['the', 'a', 'an', 'you', 'your', 'of', 'to', 'and', 'is', 'are', 'can', 'that', 'this', 'with', 'for', 'it', 'its', 'as', 'on', 'in',
  'or', 'be', 'when', 'if', 'each', 'any', 'one', 'which', 'while', 'must', 'has', 'have', 'than', 'then', 'up', 'pounds', 'feet', 'foot', 'by', 'from', 'at', 'into',
  'creature', 'target', 'hit', 'points', 'damage', 'turn', 'action', 'also', 'not', 'no']);
const TR_WORDS = new Set(['ve', 'bir', 'için', 'ile', 'olan', 'her', 'kadar', 'değil', 'gibi', 'ya', 'da', 'de', 'bu', 'şu', 'olur', 'eder', 'verir', 'alır', 'yapar',
  'hedef', 'hasar', 'seviye', 'kez', 'tur', 'zar', 'sen', 'sana', 'senin', 'kadar', 'ise', 'sonra', 'önce', 'içinde', 'bir', 'iki', 'üç']);
const words = (s: string): string[] => s.toLowerCase().match(/[a-zçğıöşü’']+/g) ?? [];

/** Metin ağırlıkla İngilizce mi (SRD ham metni gibi). */
export function looksEnglish(text: string): boolean {
  const w = words(text);
  if (w.length < 4) return false;
  const en = w.filter((x) => EN_WORDS.has(x)).length;
  const tr = w.filter((x) => TR_WORDS.has(x) || /[çğıöşü]/.test(x)).length;
  return en >= 2 && en > tr;
}

/** Metin Türkçe açıklama gibi mi (Türkçe harf/sözcük var, ağırlıkla İngilizce değil). */
export function looksTurkish(text: string): boolean {
  const w = words(text);
  if (w.length === 0) return false;
  const tr = w.filter((x) => TR_WORDS.has(x) || /[çğıöşü]/.test(x)).length;
  return tr > 0 && !looksEnglish(text);
}
