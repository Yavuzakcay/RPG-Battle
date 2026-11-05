/**
 * Kuyruk K51: hizalanma (ev kuralı `hizalanma`, varsayılan kapalı; savaş hesabına girmez, kural sürümüne dokunmaz).
 * İki eksen −50…+50: Düzen (+ Düzenli / − Kaotik) ve İyilik (+ İyi / − Kötü). Değer = başlangıç + günlükteki geri
 * alınmamış kayıtların toplamı. Etiket 9 kutu (eşik ±17, 2 puan histerezis). Başlangıç sınıf, geçmiş, alt sınıf ve
 * (anahtar açıksa) ırk katkılarının toplamı, ±50'ye kırpılır. Veriler `data/hizalanma*.json`. Saf.
 */
import cfg from '../../data/hizalanma.json';
import table from '../../data/hizalanma-baslangic.json';
import events from '../../data/hizalanma-olaylari.json';

export type Axis = 'duzen' | 'iyilik';
export type Bucket = 'pos' | 'neu' | 'neg';
export type StartKind = 'otomatik' | 'orta' | 'satir-orta' | 'sutun-orta' | 'gm';
export interface AlignmentEntry {
  id: string;
  /** olay: hazır düğme; serbest: Game Master serbest girişi; yeniden: Game Master başlangıcı yeniden belirledi; altSinif: alt sınıf değişince güncelleme. */
  tur: 'olay' | 'serbest' | 'yeniden' | 'altSinif';
  kim: string;
  olay?: string;
  duzen: number;
  iyilik: number;
  gerekce: string;
  zaman: string;
  oturum?: string;
  geriAlindi?: boolean;
  /** Azalan getiri uygulandı (aynı olay art arda 3. kez ve sonrası). */
  yarim?: boolean;
}
export interface Alignment {
  duzen: number;
  iyilik: number;
  baslangic: { duzen: number; iyilik: number };
  baslangicTuru: StartKind;
  gunluk: AlignmentEntry[];
  /** Karakter kartında gizli (Game Master). */
  gizli?: boolean;
  /** Son etiket kovaları (histerezis). */
  kova?: { duzen: Bucket; iyilik: Bucket };
}
export interface Contribution { kaynak: 'sinif' | 'gecmis' | 'altSinif' | 'irk'; id: string; duzen: number; iyilik: number; gerekce: { tr: string; en: string } }

export const ALIGN = cfg;
export const ALIGN_EVENTS = events.olaylar as Array<{ id: string; ad: { tr: string; en: string }; duzen: number; iyilik: number }>;
const T = table as unknown as Record<'sinif' | 'gecmis' | 'altSinif' | 'irk', Record<string, { duzen: number; iyilik: number; gerekce: { tr: string; en: string } }>>;

const clamp = (v: number, n: number) => Math.max(-n, Math.min(n, Math.round(v)));

/** Eksen kovası (histerezis: içinde olunan kovadan çıkmak için eşiği 2 puan geçmek gerekir). */
export function bucketOf(v: number, prev?: Bucket): Bucket {
  const e = cfg.esik, h = cfg.histerezis;
  if (prev === 'pos' && v >= e - h) return 'pos';
  if (prev === 'neg' && v <= -(e - h)) return 'neg';
  if (v >= e) return 'pos';
  if (v <= -e) return 'neg';
  return 'neu';
}
/** Etiket (dil). */
export function alignmentLabel(duzen: Bucket, iyilik: Bucket, lang: 'tr' | 'en'): string {
  if (duzen === 'neu' && iyilik === 'neu') return cfg.gercekTarafsiz[lang];
  return `${cfg.duzen[duzen][lang]} ${cfg.iyilik[iyilik][lang]}`;
}

/** Başlangıç katkıları (ırk satırı en altta; tabloda olmayan kalem atlanır, yani 0). */
export function startContributions(sheet: { classId: string; backgroundId?: string; subclassId?: string; raceId: string }, irk = true): Contribution[] {
  const out: Contribution[] = [];
  const add = (kaynak: Contribution['kaynak'], id: string | undefined) => {
    const r = id ? T[kaynak][id] : undefined;
    if (id && r) out.push({ kaynak, id, duzen: r.duzen, iyilik: r.iyilik, gerekce: r.gerekce });
  };
  add('sinif', sheet.classId);
  add('gecmis', sheet.backgroundId);
  add('altSinif', sheet.subclassId);
  if (irk) add('irk', sheet.raceId);
  return out;
}
/** Katkı toplamı ±50'ye kırpılmış. */
export function startValue(list: Contribution[]): { duzen: number; iyilik: number } {
  const n = cfg.baslangicKirp;
  return { duzen: clamp(list.reduce((s, c) => s + c.duzen, 0), n), iyilik: clamp(list.reduce((s, c) => s + c.iyilik, 0), n) };
}

/**
 * Kabul etmeme seçenekleri: orta nokta, satırın orta çizgisi (Düzen 0, İyilik aynı), sütunun orta çizgisi (İyilik 0,
 * Düzen aynı). Kutu zaten orta çizgideyse o seçenek gizlenir; Gerçek Tarafsız çıkarsa hiçbiri (kabul etmeme yok).
 */
export function rejectOptions(v: { duzen: number; iyilik: number }): Array<Exclude<StartKind, 'otomatik' | 'gm'>> {
  const d = bucketOf(v.duzen), g = bucketOf(v.iyilik);
  if (d === 'neu' && g === 'neu') return [];
  return ['orta', ...(d !== 'neu' ? ['satir-orta' as const] : []), ...(g !== 'neu' ? ['sutun-orta' as const] : [])];
}
export function applyStartKind(kind: StartKind, v: { duzen: number; iyilik: number }): { duzen: number; iyilik: number } {
  switch (kind) {
    case 'orta': return { duzen: 0, iyilik: 0 };
    case 'satir-orta': return { duzen: 0, iyilik: v.iyilik };
    case 'sutun-orta': return { duzen: v.duzen, iyilik: 0 };
    default: return { ...v };
  }
}

/** Değer = başlangıç + geri alınmamış günlük kayıtları (±50). Kovalar histerezisle güncellenir. */
export function recompute(a: Alignment): Alignment {
  const live = a.gunluk.filter((e) => !e.geriAlindi);
  const duzen = clamp(a.baslangic.duzen + live.reduce((s, e) => s + e.duzen, 0), cfg.eksen);
  const iyilik = clamp(a.baslangic.iyilik + live.reduce((s, e) => s + e.iyilik, 0), cfg.eksen);
  return { ...a, duzen, iyilik, kova: { duzen: bucketOf(duzen, a.kova?.duzen), iyilik: bucketOf(iyilik, a.kova?.iyilik) } };
}
/** Yeni hizalanma (oluşturucu son adımı). */
export function newAlignment(computed: { duzen: number; iyilik: number }, kind: StartKind): Alignment {
  const start = applyStartKind(kind, computed);
  return recompute({ duzen: 0, iyilik: 0, baslangic: start, baslangicTuru: kind, gunluk: [] });
}
/** Eski kayıt (alan yok): 0/0, günlük boş. */
export const alignmentOf = (a: Alignment | undefined): Alignment => a ?? recompute({ duzen: 0, iyilik: 0, baslangic: { duzen: 0, iyilik: 0 }, baslangicTuru: 'orta', gunluk: [] });
export const labelOf = (a: Alignment, lang: 'tr' | 'en'): string => alignmentLabel(a.kova?.duzen ?? bucketOf(a.duzen), a.kova?.iyilik ?? bucketOf(a.iyilik), lang);

let seq = 0;
const entryId = (zaman: string) => `h${Date.parse(zaman) || 0}-${(seq++).toString(36)}`;

/** Hazır olay (azalan getiri: aynı olay art arda 3. kez ve sonrası yarı etki; yalnız hazır düğmeler). */
export function addEvent(a: Alignment, olayId: string, kim: string, zaman: string, oturum?: string, gerekce = ''): Alignment {
  const ev = ALIGN_EVENTS.find((e) => e.id === olayId);
  if (!ev) return a;
  const live = a.gunluk.filter((e) => !e.geriAlindi);
  let streak = 0;
  for (let i = live.length - 1; i >= 0 && live[i]?.tur === 'olay' && live[i]?.olay === olayId; i--) streak++;
  const half = streak + 1 >= events.azalanGetiri.tekrar;
  const k = half ? events.azalanGetiri.carpan : 1;
  const scale = (x: number) => (half ? Math.sign(x) * Math.ceil(Math.abs(x) * k) : x);
  return recompute({ ...a, gunluk: [...a.gunluk, { id: entryId(zaman), tur: 'olay', kim, olay: olayId, duzen: scale(ev.duzen), iyilik: scale(ev.iyilik),
    gerekce: gerekce || ev.ad.tr, zaman, ...(oturum ? { oturum } : {}), ...(half ? { yarim: true } : {}) }] });
}
/** Serbest giriş (eksen + miktar −10…+10 + gerekçe). */
export function addFree(a: Alignment, eksen: Axis, miktar: number, gerekce: string, kim: string, zaman: string, oturum?: string): Alignment {
  const m = clamp(miktar, cfg.serbestEnCok);
  if (!m) return a;
  return recompute({ ...a, gunluk: [...a.gunluk, { id: entryId(zaman), tur: 'serbest', kim, duzen: eksen === 'duzen' ? m : 0, iyilik: eksen === 'iyilik' ? m : 0, gerekce, zaman, ...(oturum ? { oturum } : {}) }] });
}
/** Geri al / geri getir. */
export const toggleUndo = (a: Alignment, id: string): Alignment =>
  recompute({ ...a, gunluk: a.gunluk.map((e) => (e.id === id ? { ...e, geriAlindi: !e.geriAlindi } : e)) });

/** Game Master başlangıcı yeniden belirler (yeni başlangıç değeri; günlüğe yazılır, değişim kaydı sıfır). */
export function gmRedetermine(a: Alignment, to: { duzen: number; iyilik: number }, kim: string, zaman: string, gerekce: string): Alignment {
  const start = { duzen: clamp(to.duzen, cfg.eksen), iyilik: clamp(to.iyilik, cfg.eksen) };
  return recompute({ ...a, baslangic: start, baslangicTuru: 'gm',
    gunluk: [...a.gunluk, { id: entryId(zaman), tur: 'yeniden', kim, duzen: 0, iyilik: 0, gerekce: `${gerekce} (${a.baslangic.duzen}/${a.baslangic.iyilik} → ${start.duzen}/${start.iyilik})`, zaman }] });
}

/**
 * Alt sınıf seçilince/değişince: başlangıç "otomatik" kabul edildiyse yeni toplama güncellenir (bildirim döner);
 * orta nokta/çizgi seçildiyse değişmez, yalnızca öneri döner.
 */
export function onSubclassChange(a: Alignment, computed: { duzen: number; iyilik: number }, kim: string, zaman: string): { alignment: Alignment; changed: boolean; suggested: { duzen: number; iyilik: number } } {
  if (a.baslangicTuru !== 'otomatik' || (a.baslangic.duzen === computed.duzen && a.baslangic.iyilik === computed.iyilik)) {
    return { alignment: a, changed: false, suggested: computed };
  }
  const next = recompute({ ...a, baslangic: { ...computed },
    gunluk: [...a.gunluk, { id: entryId(zaman), tur: 'altSinif', kim, duzen: 0, iyilik: 0, gerekce: `${a.baslangic.duzen}/${a.baslangic.iyilik} → ${computed.duzen}/${computed.iyilik}`, zaman }] });
  return { alignment: next, changed: true, suggested: computed };
}
