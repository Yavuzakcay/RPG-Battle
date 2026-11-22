/**
 * Ortak simge setleri (glif; yalnız görünüm, kural/kayıt sürümü yok). Veri `data/glif-esleme.json`: simge adları, ipucu
 * adları, okul/eylem/hasar eşlemesi, açıklama metni kalıpları ve `npm run glif`'in yazdığı `kesim` kaydı (kaydı olmayan
 * simge çizilmez: görsel yoksa kırık resim yerine hiçbir şey). Saf: React ve DOM yok; çizim `Glyph.tsx`.
 */
import data from '../../../data/glif-esleme.json';
import type { Lang } from '../../i18n/strings';

interface Pattern { glif: string; tr?: string[]; en?: string[]; sonra?: string[]; onek?: boolean }
interface GlyphData {
  boyutlar: { buyuk: number; kucuk: number };
  goster: { satirIci: number; baslik: number; cip: number };
  sayfalar: Array<{ kaynak: string; izgara: [number, number]; adlar: string[] }>;
  adlar: Record<string, Record<Lang, string>>;
  okul: Record<string, string>;
  eylem: Record<string, string>;
  hasar: Record<string, string>;
  metin: { paragrafEnCok: number; kaliplar: Pattern[] };
  kesim: Record<string, { sayfa: number; hucre: number; kutu: number[] }>;
}
const D = data as unknown as GlyphData;

/** Bütün simge adları, sayfa ve hücre sırasıyla (32). */
export const GLYPH_NAMES: readonly string[] = D.sayfalar.flatMap((p) => p.adlar);
export const GLYPH_SIZE = D.goster;
/** Simgenin görseli kesildi mi (`kesim` kaydı). */
export const hasGlyph = (ad: string): boolean => !!D.kesim[ad];
/** Görsel yolu (BASE_URL'siz): 48 px küçük kopya (16–24 px gösterim, yüksek yoğunlukta keskin) ya da 128 px. */
export const glyphPath = (ad: string, big = false): string => `glif/${big ? '' : 'kucuk/'}${ad}.webp`;
export const glyphLabel = (ad: string, lang: Lang): string => D.adlar[ad]?.[lang] ?? D.adlar[ad]?.tr ?? ad;

/** Büyü okulu (SRD adı, "Evocation") → simge. */
export const schoolGlyph = (school: string | undefined): string | undefined => (school ? D.okul[school] : undefined);
/** Eylem türü (sınıf özelliği `type`, canavar özelliği `tur`, büyü yapım süresi) → simge; free/resource/legendary yok. */
export const actionGlyph = (kind: string | undefined): string | undefined => (kind && kind !== 'not' ? D.eylem[kind] : undefined);
/** Hasar türü kimliği ("fire") → simge. */
export const damageGlyph = (type: string | undefined): string | undefined => (type ? D.hasar[type.toLowerCase()] : undefined);

/** Büyü başlığı: okul + (varsa) Concentration ve Ritual. */
export function spellGlyphs(s: { school?: string; concentration?: boolean; castingTime?: string }, ritual = false): string[] {
  return [schoolGlyph(s.school), s.concentration ? 'concentration' : undefined, ritual || s.castingTime === 'ritual' ? 'ritual' : undefined]
    .filter((x): x is string => !!x);
}

/** Eşya başlığı: veride varsa Attunement (Cursed verisi yok: oyun eşyasında lanet alanı tanımlı değil). */
export const itemGlyphs = (it: { attunement?: boolean; cursed?: boolean }): string[] =>
  [it.attunement ? 'attunement' : undefined, it.cursed ? 'cursed' : undefined].filter((x): x is string => !!x);

// ---- Satır içi eşleme ----

const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Türkçe I/İ dahil büyük/küçük harf duyarsız karakter sınıfı; boşluk → \s+. */
function ci(phrase: string): string {
  return [...phrase].map((ch) => {
    if (/\s/.test(ch)) return '\\s+';
    const set = new Set([ch, ch.toLocaleLowerCase('tr'), ch.toLocaleUpperCase('tr'), ch.toLowerCase(), ch.toUpperCase()].filter((x) => x.length === 1));
    return set.size > 1 ? `[${[...set].map(esc).join('')}]` : esc(ch);
  }).join('');
}

const NOT_WORD_BEFORE = '(?<![\\p{L}\\p{N}])';
const NOT_WORD_AFTER = '(?![\\p{L}\\p{N}])';
let compiled: Array<{ glif: string; re: RegExp }> | null = null;
function patterns(): Array<{ glif: string; re: RegExp }> {
  if (compiled) return compiled;
  compiled = D.metin.kaliplar.map((p) => {
    const words = [...(p.tr ?? []), ...(p.en ?? [])].sort((a, b) => b.length - a.length).map(ci).join('|');
    const tail = p.sonra?.length ? `(?=\\s+(?:${p.sonra.map(ci).join('|')}))` : p.onek ? '' : NOT_WORD_AFTER;
    return { glif: p.glif, re: new RegExp(`${NOT_WORD_BEFORE}(?:${words})${tail}`, 'gu') };
  });
  return compiled;
}

export type GlyphSegment = { text: string } | { glif: string };

/**
 * Açıklama metnini simge işaretli parçalara böler: kalıp eşleşen yerin hemen önüne `{ glif }`, metin aynen (parçaların
 * `text` birleşimi girdiyle aynı). Çakışmada önce başlayan, eşitse uzun olan kazanır; paragraf (satır sonu) başına aynı simge
 * en çok `paragrafEnCok` kez. `show`: çizilebilecek simgeler (varsayılan: görseli kesilmiş olanlar).
 */
export function glyphSegments(text: string, show: (ad: string) => boolean = hasGlyph): GlyphSegment[] {
  if (!text) return [];
  const hits: Array<{ at: number; end: number; glif: string }> = [];
  for (const p of patterns()) {
    if (!show(p.glif)) continue;
    p.re.lastIndex = 0;
    for (const m of text.matchAll(p.re)) hits.push({ at: m.index ?? 0, end: (m.index ?? 0) + m[0].length, glif: p.glif });
  }
  if (!hits.length) return [{ text }];
  hits.sort((a, b) => a.at - b.at || b.end - a.end);
  const max = D.metin.paragrafEnCok;
  const used = new Map<string, number>();
  const out: GlyphSegment[] = [];
  let pos = 0; let lastEnd = -1;
  for (const h of hits) {
    if (h.at < lastEnd) continue;
    const para = (text.slice(0, h.at).match(/\n/g) ?? []).length;
    const key = `${para}:${h.glif}`;
    const n = used.get(key) ?? 0;
    if (n >= max) continue;
    used.set(key, n + 1);
    if (h.at > pos) out.push({ text: text.slice(pos, h.at) });
    out.push({ glif: h.glif });
    pos = h.at; lastEnd = h.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
