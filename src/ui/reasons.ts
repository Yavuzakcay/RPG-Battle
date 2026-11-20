/**
 * Kuyruk K58 G2: "neden yapamıyorsun" satırları tek tablodan (`data/neden-metinleri.json`). `whyTable(lang)` arayüz
 * gerekçeleri (`battle.why` bundan kurulur); `reasonText(msg, lang)` motorun Türkçe gerekçesini dile çevirir (kalıp
 * eşleşmezse Türkçe kalır); `reasonOr(msg)` gerekçesiz devre dışı düğmeye genel satır. Saf.
 */
import table from '../../data/neden-metinleri.json';

type Lang = 'tr' | 'en';
interface Row { tr: string; en: string }
interface Pattern { kalip: string; bayrak?: string; en: string }
const T = table as { genel: Row; arayuz: Record<string, Row>; motor: Pattern[]; tamamla: Array<{ kalip: string; tr: string; en: string }>; saveKipi: Record<string, Row | string> };
const completed = T.tamamla.map((p) => ({ re: new RegExp(p.kalip), tr: p.tr, en: p.en }));
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

/**
 * SD7: "Yapılamaz" mesajı tam cümle ve ne yapılabileceğiyle (`tamamla` tablosu); tabloda yoksa motor gerekçesi aynen (dile çevrilmiş).
 * Motor metni değişmez; yalnız gösterim.
 */
export function completeReason(msg: string, lang: Lang): string {
  for (const p of completed) {
    const m = p.re.exec(msg);
    if (m) return p[lang].replace(/\$(\d)/g, (_, i: string) => m[Number(i)] ?? '');
  }
  return reasonText(msg, lang);
}

/** Kalıbı olan mı (test). */
export const hasPattern = (msg: string): boolean => compiled.some((p) => p.re.test(msg));

/** Gerekçe yoksa genel satır. */
export const reasonOr = (msg: string | null | undefined, lang: Lang): string => (msg ? reasonText(msg, lang) : T.genel[lang]);

export type WhyKey = keyof typeof table.arayuz;

/**
 * G01 (yalnız görünüm): save kipinin kaynakları (`save_resolved.modeWhy`) → günlük satırı için tür ('adv', 'dis' ya da
 * birbirini götüren 'cancel') ve ad listesi (`data/neden-metinleri.json` `saveKipi`). Kaynak yoksa null (eski görünüm).
 */
export function saveWhyParts(why: ReadonlyArray<{ kip: 'adv' | 'dis'; key: string; name?: string }> | undefined, lang: Lang): { kind: 'adv' | 'dis' | 'cancel'; names: string } | null {
  if (!why?.length) return null;
  const label = (w: { key: string; name?: string }): string => {
    const row = T.saveKipi[w.key];
    const tpl = row && typeof row === 'object' ? row[lang] : (T.saveKipi.bilinmeyen as Row)[lang];
    return tpl.includes('{ad}') ? tpl.replace('{ad}', w.name ?? (T.saveKipi.bilinmeyen as Row)[lang]) : tpl;
  };
  const adv = why.filter((w) => w.kip === 'adv'), dis = why.filter((w) => w.kip === 'dis');
  const uniq = (xs: string[]) => [...new Set(xs)];
  if (adv.length && dis.length) return { kind: 'cancel', names: `${uniq(adv.map(label)).join(', ')} / ${uniq(dis.map(label)).join(', ')}` };
  return { kind: adv.length ? 'adv' : 'dis', names: uniq((adv.length ? adv : dis).map(label)).join(', ') };
}
