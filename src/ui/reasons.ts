/**
 * Kuyruk K58 G2: "neden yapamıyorsun" satırları tek tablodan (`data/neden-metinleri.json`). `whyTable(lang)` arayüz
 * gerekçeleri (`battle.why` bundan kurulur); `reasonText(msg, lang)` motorun Türkçe gerekçesini dile çevirir (kalıp
 * eşleşmezse Türkçe kalır); `reasonOr(msg)` gerekçesiz devre dışı düğmeye genel satır. Saf.
 */
import table from '../../data/neden-metinleri.json';

type Lang = 'tr' | 'en';
interface Row { tr: string; en: string }
interface Pattern { kalip: string; bayrak?: string; en: string }
const T = table as { genel: Row; arayuz: Record<string, Row>; motor: Pattern[] };
const compiled = T.motor.map((p) => ({ re: new RegExp(p.kalip, p.bayrak ?? ''), en: p.en }));

/** Arayüz gerekçe anahtarları → metin. */
export function whyTable(lang: Lang): Record<WhyKey, string> {
  return Object.fromEntries(Object.entries(T.arayuz).map(([k, v]) => [k, v[lang]])) as Record<WhyKey, string>;
}

/** Motor gerekçesi (Türkçe) → seçili dil. */
export function reasonText(msg: string, lang: Lang): string {
  if (lang === 'tr') return msg;
  for (const p of compiled) {
    const m = p.re.exec(msg);
    if (m) return p.en.replace(/\$(\d)/g, (_, i: string) => m[Number(i)] ?? '');
  }
  return msg;
}

/** Kalıbı olan mı (test). */
export const hasPattern = (msg: string): boolean => compiled.some((p) => p.re.test(msg));

/** Gerekçe yoksa genel satır. */
export const reasonOr = (msg: string | null | undefined, lang: Lang): string => (msg ? reasonText(msg, lang) : T.genel[lang]);

export type WhyKey = keyof typeof table.arayuz;
