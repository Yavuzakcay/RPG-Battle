/**
 * Kuyruk K51: hizalanma (ev kuralı `hizalanma`, varsayılan kapalı; savaş hesabına girmez, kural sürümüne dokunmaz).
 * İki eksen −50…+50: Düzen (+ Düzenli / − Kaotik) ve İyilik (+ İyi / − Kötü). Değer = başlangıç + günlükteki geri
 * alınmamış kayıtların toplamı. Etiket 9 kutu (eşik ±17, 2 puan histerezis). Başlangıç sınıf, geçmiş, alt sınıf ve
 * (anahtar açıksa) ırk katkılarının toplamı, ±50'ye kırpılır. Veriler `data/hizalanma*.json`. Saf.
 */
import cfg from '../../data/hizalanma.json';
import table from '../../data/hizalanma-baslangic.json';
import events from '../../data/hizalanma-olaylari.json';
import { races } from '../data';
import { CELESTIAL } from './celestialData';

export type Axis = 'duzen' | 'iyilik';
export type Bucket = 'pos' | 'neu' | 'neg';
export type StartKind = 'otomatik' | 'orta' | 'satir-orta' | 'sutun-orta' | 'gm' | 'kare';
export interface AlignmentEntry {
  id: string;
  /** olay: hazır düğme; serbest: Game Master serbest girişi; yeniden: Game Master başlangıcı yeniden belirledi; altSinif: alt sınıf değişince güncelleme. */
  tur: 'olay' | 'serbest' | 'yeniden' | 'altSinif' | 'donum' | 'duzelt';
  kim: string;
  olay?: string;
  duzen: number;
  iyilik: number;
  gerekce: string;
  zaman: string;
  oturum?: string;
  geriAlindi?: boolean;
  /** Azalan getiri uygulandı (eski kayıtlarda aynı olay art arda 3. kez ve sonrası; yarı etki). */
  yarim?: boolean;
  /** Kuyruk AL2: tekrar azalımı çarpanı (pencerede aynı olay 2. = 0,5, 3. = 0,25, 4+ = 0); yoksa 1. */
  azalim?: number;
  /** Kuyruk AL2: dönüm noktası kaydı (başlık gerekçededir; eski ve yeni değer ve etiket kovaları). */
  donum?: { eski: { duzen: number; iyilik: number; kova: { duzen: Bucket; iyilik: Bucket } }; yeni: { duzen: number; iyilik: number; kova: { duzen: Bucket; iyilik: Bucket } }; baslik: string };
  /** Kuyruk K52: savrulma çarpanı (Moral ≤ 1/3 iken ×1.5); yoksa 1. */
  carpan?: number;
  /** Kuyruk K52: bu kayıttan doğan Moral değişimi (vicdan çatışması / iç huzur / yeni yol). Geri alma Moral'e dokunmaz. */
  moral?: { delta: number; nedenler: MoralReasonA[] };
}
/** Kuyruk K52: hizalanma kaynaklı Moral nedenleri. */
export type MoralReasonA = 'vicdan' | 'huzur' | 'yeniYol';
/** Kuyruk K52: Moral bağının sayaçları (günlük kayıp, uzun dinlenme başına huzur, eksen başına yeni yol). */
export interface ConscienceBook { gun?: string; kayip?: number; huzurAlindi?: true; yeniYol?: Partial<Record<Axis, true>> }
export interface Alignment {
  duzen: number;
  iyilik: number;
  baslangic: { duzen: number; iyilik: number };
  baslangicTuru: StartKind;
  /** SD12: başlangıç katkılarının hesaplandığı çarpan (yoksa 1: eski karakter, değerlerine dokunulmaz). */
  katkiCarpani?: number;
  gunluk: AlignmentEntry[];
  /** Karakter kartında gizli (Game Master). */
  gizli?: boolean;
  /** Son etiket kovaları (histerezis). */
  kova?: { duzen: Bucket; iyilik: Bucket };
  /** Kuyruk K52: Moral bağı sayaçları (yoksa boş). */
  vicdan?: ConscienceBook;
  /** Kuyruk AL2: tekrar azalımı penceresinin başı (günlük dizini; son uzun dinlenme ya da dönüm noktası). Yoksa ilk olayda şimdiki uzunluk. */
  pencereBas?: number;
  /** Kuyruk AL2: etiket geçmişi (yalnız etiket değişince; kova, neden, zaman). Eski kayıtta yok. */
  etiketGecmisi?: Array<{ zaman: string; duzen: Bucket; iyilik: Bucket; neden: string; /** Değişimden önceki etiket kovaları. */ eski: { duzen: Bucket; iyilik: Bucket } }>;
}
export interface Contribution { kaynak: 'sinif' | 'gecmis' | 'altSinif' | 'irk'; id: string; duzen: number; iyilik: number; gerekce: { tr: string; en: string } }

export const ALIGN = cfg;
/** Hazır olaylar: her biri tek `hizalanmaEtki` (Moral bağı bundan türer; ayrı moral etkisi yok). */
export const ALIGN_EVENTS = (events.olaylar as Array<{ id: string; ad: { tr: string; en: string }; hizalanmaEtki: { duzen: number; iyilik: number } }>)
  .map((e) => ({ ...e, duzen: e.hizalanmaEtki.duzen, iyilik: e.hizalanmaEtki.iyilik }));
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
export function alignmentLabel(duzen: Bucket, iyilik: Bucket, _lang: 'tr' | 'en'): string {
  // Görev SD4: etiket adları (Lawful Good, True Neutral, Chaotic Evil…) her arayüz dilinde İngilizce; `_lang` API uyumu için kalır.
  if (duzen === 'neu' && iyilik === 'neu') return cfg.gercekTarafsiz.en;
  return `${cfg.duzen[duzen].en} ${cfg.iyilik[iyilik].en}`;
}

/** SD12: başlangıç katkılarının tek çarpanı (`data/hizalanma.json` `katkiCarpani`; elle ayarlanabilir; yalnız yeni karakterler). */
export const KATKI_CARPANI: number = (cfg as { katkiCarpani?: number }).katkiCarpani ?? 1;

const ALT_SOY = (table as unknown as { altSoy: Record<string, { duzen: number; iyilik: number; gerekce: { tr: string; en: string } }> }).altSoy;

/**
 * Kuyruk AS1a: alt soy tablosunun anahtarı (`<ırk>/<alt soy>`). Soyu olmayan ya da seçilmemiş kayıtta anahtar yok; Celestial'da 3. seviyeden itibaren Göksel Uyanış (seçilmediyse varsayılanı), öncesinde yok.
 */
export function altSoyKey(sheet: { raceId: string; lineageId?: string; celestialAwakening?: string; level?: number }): string | undefined {
  const race = races.find((r) => r.id === sheet.raceId);
  if (!race) return undefined;
  if (race.evKurali) return sheet.level !== undefined && sheet.level >= CELESTIAL.awakening.minLevel ? `${race.id}/${sheet.celestialAwakening ?? CELESTIAL.awakening.default}` : undefined;
  // Soyu seçilmemiş kayıt (eski kayıt, `lineageId` yok) eski ırk değerine düşer; `defaultLineage` burada devreye girmez.
  return sheet.lineageId ? `${race.id}/${sheet.lineageId}` : undefined;
}

/**
 * Başlangıç katkıları (ırk satırı en altta; tabloda olmayan kalem atlanır, yani 0). Kuyruk AS1a: alt soy satırı varsa
 * ırk satırının YERİNE geçer (mutlak değer; kaynak yine `irk`, kimlik `<ırk>/<alt soy>`); yoksa eski ırk değeri.
 */
export function startContributions(sheet: { classId: string; backgroundId?: string; subclassId?: string; raceId: string; lineageId?: string; celestialAwakening?: string; level?: number }, irk = true, carpan: number = KATKI_CARPANI): Contribution[] {
  const out: Contribution[] = [];
  const k = (n: number) => Math.round(n * carpan);
  const add = (kaynak: Contribution['kaynak'], id: string | undefined) => {
    const r = id ? T[kaynak][id] : undefined;
    if (id && r) out.push({ kaynak, id, duzen: k(r.duzen), iyilik: k(r.iyilik), gerekce: r.gerekce });
  };
  add('sinif', sheet.classId);
  add('gecmis', sheet.backgroundId);
  add('altSinif', sheet.subclassId);
  if (irk) {
    const key = altSoyKey(sheet);
    const alt = key ? ALT_SOY[key] : undefined;
    if (key && alt) out.push({ kaynak: 'irk', id: key, duzen: k(alt.duzen), iyilik: k(alt.iyilik), gerekce: alt.gerekce });
    else add('irk', sheet.raceId);
  }
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
/** Kuyruk AL2: etiket değiştiyse (kova farkı) etiket geçmişine bir satır ekler; değişmediyse aynen. Histerezis `recompute`'taki kovayla korunur. */
export function withLabelHistory(prev: Alignment, next: Alignment, neden: string, zaman: string): Alignment {
  const a = prev.kova ?? { duzen: bucketOf(prev.duzen), iyilik: bucketOf(prev.iyilik) };
  const b = next.kova ?? { duzen: bucketOf(next.duzen), iyilik: bucketOf(next.iyilik) };
  if (a.duzen === b.duzen && a.iyilik === b.iyilik) return next;
  return { ...next, etiketGecmisi: [...(next.etiketGecmisi ?? []), { zaman, duzen: b.duzen, iyilik: b.iyilik, neden, eski: a }] };
}

/** Kuyruk AL2: kısa yol haritası ("Lawful Good → Neutral Good → …"): başlangıç etiketi + geçmiş. */
export function labelPath(a: Alignment, lang: 'tr' | 'en'): string[] {
  const h = a.etiketGecmisi ?? [];
  if (!h.length) return [];
  const first = h[0] as NonNullable<Alignment['etiketGecmisi']>[number];
  const start = alignmentLabel(first.eski.duzen, first.eski.iyilik, lang);
  return [start, ...h.map((x) => alignmentLabel(x.duzen, x.iyilik, lang))];
}

/** Yeni hizalanma (oluşturucu son adımı). */
export function newAlignment(computed: { duzen: number; iyilik: number }, kind: StartKind, carpan: number = KATKI_CARPANI): Alignment {
  const start = applyStartKind(kind, computed);
  return recompute({ duzen: 0, iyilik: 0, baslangic: start, baslangicTuru: kind, katkiCarpani: carpan, gunluk: [] });
}
/** SD12: karenin merkez değeri (Düzenli/İyi +33, Tarafsız 0, Kaotik/Kötü −33; Gerçek Tarafsız 0/0). */
export function squareCenter(d: Bucket, g: Bucket): { duzen: number; iyilik: number } {
  const m = (cfg as { kareMerkezi?: number }).kareMerkezi ?? 33;
  const v = (b: Bucket) => (b === 'pos' ? m : b === 'neg' ? -m : 0);
  return { duzen: v(d), iyilik: v(g) };
}
/** SD12: oyuncunun seçtiği kareden başlangıç ('kare' türü); kare önerilenle aynıysa çağıran 'otomatik' kullanır. */
export function newAlignmentAt(d: Bucket, g: Bucket, carpan: number = KATKI_CARPANI): Alignment {
  return recompute({ duzen: 0, iyilik: 0, baslangic: squareCenter(d, g), baslangicTuru: 'kare', katkiCarpani: carpan, gunluk: [] });
}
export const squareOf = (v: { duzen: number; iyilik: number }): { d: Bucket; g: Bucket } => ({ d: bucketOf(v.duzen), g: bucketOf(v.iyilik) });
/** Eski kayıt (alan yok): 0/0, günlük boş. */
export const alignmentOf = (a: Alignment | undefined): Alignment => a ?? recompute({ duzen: 0, iyilik: 0, baslangic: { duzen: 0, iyilik: 0 }, baslangicTuru: 'orta', gunluk: [] });
export const labelOf = (a: Alignment, lang: 'tr' | 'en'): string => alignmentLabel(a.kova?.duzen ?? bucketOf(a.duzen), a.kova?.iyilik ?? bucketOf(a.iyilik), lang);

/** Kuyruk K52: savrulma çarpanı (yarım yukarı, işaret korunur; ×1'de aynen). */
const swing = (x: number, k: number): number => (k === 1 || !x ? x : Math.sign(x) * Math.round(Math.abs(x) * k));

let seq = 0;
const entryId = (zaman: string) => `h${Date.parse(zaman) || 0}-${(seq++).toString(36)}`;

const REPEAT: number[] = (cfg as { tekrar?: { carpanlar?: number[] } }).tekrar?.carpanlar ?? [1];

/** Kuyruk AL2: aynı hazır olay türü pencerede (son uzun dinlenme ya da dönüm noktasından beri) kaçıncı kez; geri alınanlar sayılmaz. */
export function repeatIndex(a: Alignment, olayId: string): number {
  const from = a.pencereBas ?? a.gunluk.length;
  return a.gunluk.filter((e, i) => i >= from && !e.geriAlindi && e.tur === 'olay' && e.olay === olayId).length;
}
/** Kuyruk AL2: bu olay şimdi uygulanırsa tekrar çarpanı (1, 0,5, 0,25, 0). */
export const repeatFactor = (a: Alignment, olayId: string): number => REPEAT[Math.min(repeatIndex(a, olayId), REPEAT.length - 1)] ?? 1;

/** Hazır olay (Kuyruk AL2 tekrar azalımı: pencerede aynı olay 1. tam, 2. yarı, 3. çeyrek, 4+ etkisiz; çarpanlar `hizalanma.json`; yalnız hazır düğmeler). */
export function addEvent(a: Alignment, olayId: string, kim: string, zaman: string, oturum?: string, gerekce = '', carpan = 1): Alignment {
  const ev = ALIGN_EVENTS.find((e) => e.id === olayId);
  if (!ev) return a;
  const k = repeatFactor(a, olayId);
  const base = a.pencereBas === undefined ? { ...a, pencereBas: a.gunluk.length } : a;
  const scale = (x: number) => swing(k < 1 ? (k === 0 ? 0 : Math.sign(x) * Math.ceil(Math.abs(x) * k)) : x, carpan);
  const next = recompute({ ...base, gunluk: [...base.gunluk, { id: entryId(zaman), tur: 'olay', kim, olay: olayId, duzen: scale(ev.duzen), iyilik: scale(ev.iyilik),
    gerekce: gerekce || ev.ad.tr, zaman, ...(oturum ? { oturum } : {}), ...(k < 1 ? { azalim: k } : {}), ...(k === 0.5 ? { yarim: true } : {}), ...(carpan !== 1 ? { carpan } : {}) }] });
  return withLabelHistory(a, next, gerekce || ev.ad.tr, zaman);
}
/** Serbest giriş (eksen + miktar −10…+10 + gerekçe). */
export function addFree(a: Alignment, eksen: Axis, miktar: number, gerekce: string, kim: string, zaman: string, oturum?: string, carpan = 1): Alignment {
  const m = swing(clamp(miktar, cfg.serbestEnCok), carpan);
  if (!m) return a;
  const next = recompute({ ...a, gunluk: [...a.gunluk, { id: entryId(zaman), tur: 'serbest', kim, duzen: eksen === 'duzen' ? m : 0, iyilik: eksen === 'iyilik' ? m : 0, gerekce, zaman,
    ...(oturum ? { oturum } : {}), ...(carpan !== 1 ? { carpan } : {}) }] });
  return withLabelHistory(a, next, gerekce, zaman);
}
/** Geri al / geri getir. */
export const toggleUndo = (a: Alignment, id: string): Alignment => {
  const e0 = a.gunluk.find((e) => e.id === id);
  const next = recompute({ ...a, gunluk: a.gunluk.map((e) => (e.id === id ? { ...e, geriAlindi: !e.geriAlindi } : e)) });
  return withLabelHistory(a, next, `${e0?.gerekce ?? ''} (${e0?.geriAlindi ? 'geri getirildi' : 'geri alındı'})`, e0?.zaman ?? '');
};

/** Kuyruk AL2: değerleri `to` yapacak başlangıç (günlükteki geri alınmamış toplam çıkarılır; ±100'e kırpılır). */
function anchorFor(a: Alignment, to: { duzen: number; iyilik: number }): { duzen: number; iyilik: number } {
  const live = a.gunluk.filter((e) => !e.geriAlindi);
  const sum = (k: Axis) => live.reduce((n, e) => n + e[k], 0);
  return { duzen: clamp(clamp(to.duzen, cfg.eksen) - sum('duzen'), 100), iyilik: clamp(clamp(to.iyilik, cfg.eksen) - sum('iyilik'), 100) };
}
/** Günlükte son dönüm noktası/düzeltmenin dizini (öncesindeki kayıtlar geri alınamaz; yoksa −1). */
export const lastAnchorIndex = (a: Alignment): number => a.gunluk.reduce((n, e, i) => (e.tur === 'donum' || e.tur === 'duzelt' ? i : n), -1);

/**
 * Kuyruk AL2 Dönüm noktası: Game Master iki ekseni yeni değerlere çeker (başlık + gerekçe zorunlu). Günlükte öne çıkan ◆ satırı
 * (eski → yeni etiket ve değerler), etiket değiştiyse etiket geçmişine girer (histerezis korunur), tekrar sayaçları sıfırlanır,
 * isteğe bağlı "kartta gizli".
 */
export function turningPoint(a: Alignment, to: { duzen: number; iyilik: number }, baslik: string, gerekce: string, kim: string, zaman: string, gizli?: boolean): Alignment {
  const eski = { duzen: a.duzen, iyilik: a.iyilik, kova: { duzen: a.kova?.duzen ?? bucketOf(a.duzen), iyilik: a.kova?.iyilik ?? bucketOf(a.iyilik) } };
  const moved = recompute({ ...a, baslangic: anchorFor(a, to) });
  const yeni = { duzen: moved.duzen, iyilik: moved.iyilik, kova: moved.kova as { duzen: Bucket; iyilik: Bucket } };
  const entry: AlignmentEntry = { id: entryId(zaman), tur: 'donum', kim, duzen: 0, iyilik: 0, gerekce: `${baslik}: ${gerekce}`, zaman, donum: { eski, yeni, baslik } };
  const next = { ...moved, gunluk: [...moved.gunluk, entry], pencereBas: moved.gunluk.length + 1, ...(gizli !== undefined ? { gizli } : {}) };
  return withLabelHistory(a, next, `${baslik}: ${gerekce}`, zaman);
}
/** Kuyruk AL2 Düzelt: yanlış girişi gerekçesiz düzeltir; günlüğe "düzeltildi", etiket geçmişine ve sayaçlara dokunmaz. */
export function correctValue(a: Alignment, to: { duzen: number; iyilik: number }, kim: string, zaman: string): Alignment {
  const moved = recompute({ ...a, baslangic: anchorFor(a, to) });
  return { ...moved, gunluk: [...moved.gunluk, { id: entryId(zaman), tur: 'duzelt', kim, duzen: 0, iyilik: 0, gerekce: `${a.duzen}/${a.iyilik} → ${moved.duzen}/${moved.iyilik}`, zaman }] };
}

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
