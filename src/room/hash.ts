/**
 * Görev ODA-1 (O1): kanonik JSON ve özet (`ozet` mesajı, ODA-TASARIM.md §1 "Durum özeti"). Saf. Anahtarlar sıralanır,
 * `undefined` alanlar atlanır (JSON'daki gibi); iki 32 bitlik özet (FNV-1a + djb2) birleşik 16 hane.
 */

export function kanonikJson(x: unknown): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x) ?? 'null';
  if (Array.isArray(x)) return `[${x.map((v) => (v === undefined ? 'null' : kanonikJson(v))).join(',')}]`;
  const o = x as Record<string, unknown>;
  const keys = Object.keys(o).filter((k) => o[k] !== undefined && typeof o[k] !== 'function').sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${kanonikJson(o[k])}`).join(',')}}`;
}

export function metinOzeti(s: string): string {
  let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = (Math.imul(b, 33) + c) | 0;
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

export const ozet = (x: unknown): string => metinOzeti(kanonikJson(x));
