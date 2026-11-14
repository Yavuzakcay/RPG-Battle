/**
 * Kuyruk AS1a: alt soy görünümü (yalnızca görsel; kural sürümüne girmez). Veri `data/alt-soy-gorunum.json`: alt soylara
 * ayrı çizim yok; renk filtresi (tint/maskesi olmayan ırklar için CSS `filter`), en-boy/ölçek, kanat katmanı yuvaları ve
 * Celestial hale kuralı. Human ten tonu ayrı seçimdir (`skinTone`), kültürün izin verdiği tonlardan (`cultureSkinTone`). Saf: DOM bilmez.
 */
import data from '../../data/alt-soy-gorunum.json';
import wings from '../../data/kanat-esleme.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import type { TintSpec } from '../battle/types';
import { rgbToLab } from './color';
import { findSubclass } from '../rules/subclasses';

/** Çözülmüş kanat katmanı (jetonun arkası): `src` o anki durumun görseli (`public/` altı yol), filtre renk için. */
/** `capa`: kanat kökü görsel oranı; `omuz`: kökün jeton yüksekliğinde tepeden oranı; `enBoy`: görsel yüksekliği/genişliği. */
export interface WingLayerSpec { id: string; src: string; olcek: number; omuz: number; capa: [number, number]; enBoy: number; filtre: string; open: boolean; /** SD5: parlaklık→renk paleti (SVG filtresi; opak kalır). */ palet?: WingPalet; /** SD5: görsel kutuya oransız oturur. */ esnet?: boolean; /** Animasyonlu sayfa (4x2 vb.); yoksa tek görsel. */ sprite?: WingSprite }
export interface WingPalet { golge: string; isik: string }
export interface WingSprite { sutun: number; satir: number; kareEn: number; kareBoy: number; kareMs: number }
export interface SkinTone { id: string; ad: { tr: string; en: string }; /** Hedef ten rengi (hex); null: boyasız. */ renk: string | null; rozetRenk: string }
export interface LookSheet { raceId: string; classId?: string; /** Seçili alt sınıf kimliği (`kanat-esleme.json` `altSinif` eşlemesi için). */ subclassId?: string; lineageId?: string; celestialAwakening?: string; level?: number; skinTone?: string }
export interface LineageLook {
  /** CSS `filter` (boşsa yok). */
  filter: string;
  scaleX: number;
  scaleY: number;
  wing: WingLayerSpec | null;
  /** Celestial hale gizli (görselin üst bandı kırpılır). */
  hideHalo: boolean;
}

const D = data as unknown as {
  altSoylar: Record<string, { filtre?: string; oran?: { en: number; boy: number }; kanat?: string; orijinal?: true }>;
  orijinal: string[];
  celestialUyanis: Record<string, { hale: boolean; filtre?: string; kanat?: string }>;
  hale: { gizleUstYuzde: number };
  ten: { varsayilan: string; filtreUygula: boolean; tonlar: SkinTone[]; kulturTen: Record<string, string[]>;
    surgun: { kultur: string; secenekler: string[]; ad: Record<string, { tr: string; en: string }> } };
};
/** Celestial Göksel Uyanış 3. seviyeden etkin (`data/celestial.json` `awakening.minLevel`; test eşitliği denetler). */
export const AWAKENING_FROM = 3;
export const AWAKENING_DEFAULT = 'parlayan-ruh';
export const HALO_CLIP_PCT = D.hale.gizleUstYuzde;
export const SKIN_TONES: SkinTone[] = D.ten.tonlar;
export const DEFAULT_SKIN_TONE = D.ten.varsayilan;
/** Kültür (alt soy) → seçilebilecek ten tonları (`ten.kulturTen`; Tenhausser Koyu, Khadyrga Orijinal, Saf Kent Altın, Sur Dışı üçü). */
export const CULTURE_SKIN: Record<string, string[]> = D.ten.kulturTen;
/** Görev AS1b düzeltmesi: Sur Dışı'nın "Sürgün" seçimi (veri `ten.surgun`). */
export const EXILE = D.ten.surgun;
/** Bu kültürde sürgün seçimi var mı; varsa seçenekler (yalnız üç kültür). */
export const exileOptions = (lineageId: string | undefined): string[] => (lineageId && lineageId === EXILE.kultur ? EXILE.secenekler : []);
export const exileName = (id: string, lang: 'tr' | 'en'): string => EXILE.ad[id]?.[lang] ?? id;
/** Geçerli sürgün kültürü (Sur Dışı değilse ya da listede yoksa yok). */
export const exileOf = (lineageId: string | undefined, exile: string | undefined): string | undefined =>
  exile && exileOptions(lineageId).includes(exile) ? exile : undefined;
/** Ten tonunun kültür anahtarı: Sur Dışı'nda seçili sürgün kültürü, yoksa kültürün kendisi. */
const toneKey = (lineageId: string | undefined, exile?: string): string | undefined => exileOf(lineageId, exile) ?? lineageId;
const allowedTones = (lineageId: string | undefined, exile?: string): string[] | undefined => {
  const key = toneKey(lineageId, exile);
  const list = key ? CULTURE_SKIN[key] : undefined;
  return list?.length ? list : undefined;
};
/** Seçilebilir ten tonları: kültürün (Sur Dışı'nda seçili sürgün kültürünün) `kulturTen` satırından; satır yoksa bütün tonlar. */
export const tonesFor = (lineageId: string | undefined, exile?: string): SkinTone[] => {
  const list = allowedTones(lineageId, exile);
  return list ? SKIN_TONES.filter((t) => list.includes(t.id)) : SKIN_TONES;
};
/**
 * TEK ton çözücüsü (kültür + Sürgün): kayıtlı ton kültürün (Sur Dışı'nda sürgün kültürünün) listesinde varsa o, yoksa listedeki
 * ilk ton; tek tonlu kültürde kayıtlı ton ne olursa olsun kültürün tonu. Eşlemesiz kültürde kayıtlı ton. Seçici, kültür/sürgün
 * değişimi ve jeton boyası (`sheetAvatar`) bunu kullanır.
 */
export function cultureSkinTone(lineageId: string | undefined, toneId: string | undefined, exile?: string): string | undefined {
  const allowed = allowedTones(lineageId, exile);
  if (!allowed) return toneId;
  const id = skinToneOf(toneId)?.id;
  return id && allowed.includes(id) ? id : allowed[0];
}
/** Kültür seçimi: Sur Dışı'ndan çıkınca sürgün seçimi sıfırlanır; ton tek çözücüden. */
export function pickCulture(sheet: { lineageId?: string; exileCulture?: string; skinTone?: string }, lineageId: string): { lineageId: string; exileCulture: string | undefined; skinTone: string | undefined } {
  const exile = exileOf(lineageId, sheet.exileCulture);
  return { lineageId, exileCulture: exile, skinTone: cultureSkinTone(lineageId, sheet.skinTone, exile) };
}
/** Kuyruk AS1a-2: boyasız ORİJİNAL jetonla gelen alt soylar (`<ırk>/<alt soy>`; filtre/tint/maske yok, yalnız oran). */
export const ORIGINAL_LINEAGES: string[] = D.orijinal;
export const isOriginalLineage = (key: string): boolean => D.orijinal.includes(key);
type WingSlotData = { altSinif?: string; palet?: WingPalet; renkPaletleri?: Record<string, WingPalet>; esnet?: boolean; sprite?: WingSprite & { klasor?: string }; dosya: string | null; dosyaKapali: string | null; minSeviye?: number; herZaman?: boolean; olcek: number; omuz: number; capa: [number, number]; enBoy: number; filtre?: string; renkFiltreleri?: Record<string, string> };
const W = wings as unknown as { klasor: string; slotlar: Record<string, WingSlotData> };
export const WING_SLOTS = Object.keys(W.slotlar);
/** Kanat slotuna bağlı alt sınıf kimlikleri (`altSinif`) ve slotun kimliği. */
export const wingSlotOfSubclass = (subclassId: string | undefined): string | undefined =>
  subclassId ? Object.keys(W.slotlar).find((id) => W.slotlar[id]?.altSinif === subclassId) : undefined;
/** Alt sınıfa bağlı bir kanat slotu var mı (jeton görünümü yalnız o zaman `look` taşır). */
export const hasSubclassWing = (subclassId: string | undefined): boolean => !!wingSlotOfSubclass(subclassId);
/**
 * Seçili alt sınıfın kanat slotu: alt sınıf seçili ve (sınıf biliniyorsa) kayıtta yüklüyse; yüklü değilse (dış içerik silindi ya
 * da yok) slot yok, hata yok.
 */
function subclassWingId(sheet: LookSheet): string | undefined {
  const id = wingSlotOfSubclass(sheet.subclassId);
  if (!id) return undefined;
  if (sheet.classId && !findSubclass(sheet.classId, sheet.subclassId)) return undefined;
  return id;
}
export const lookEntries = (): string[] => Object.keys(D.altSoylar);
export const awakeningLookIds = (): string[] => Object.keys(D.celestialUyanis);

/**
 * Kanat katmanı: slot karakter seviyesine uyuyorsa ve o durumun (`flying`: açık, değilse kapalı) görseli eşlemede varsa; görsel
 * dosyası tanımlı değilse (sprite henüz yok) katman yok.
 */
function wingLayer(id: string, level: number, flying: boolean, lineageId?: string): WingLayerSpec | null {
  const w = W.slotlar[id];
  if (!w || (w.minSeviye ?? 1) > level) return null;
  // `herZaman`: havada olmasa da açık sprite (Celestial Kırık Kanat); aksi halde yalnız süzülürken açık, değilken `dosyaKapali`.
  const open = flying || !!w.herZaman;
  const file = open ? w.dosya : w.dosyaKapali;
  if (!file) return null;
  const filtre = [w.filtre, lineageId ? w.renkFiltreleri?.[lineageId] : undefined].filter(Boolean).join(' ');
  const { klasor: sk, ...sprite } = w.sprite ?? ({} as { klasor?: string });
  const palet = (lineageId ? w.renkPaletleri?.[lineageId] : undefined) ?? w.palet;
  return { id, src: `${sk ?? W.klasor}/${file}`, olcek: w.olcek, omuz: w.omuz, capa: w.capa, enBoy: w.enBoy, filtre, open, ...(palet ? { palet } : {}), ...(w.esnet ? { esnet: true } : {}), ...(w.sprite ? { sprite: sprite as WingSprite } : {}) };
}

/**
 * Kanat görselinin kutusu (jeton merkezi `cx,cy`, jeton genişliği `w` cinsinden, yukarı-sol köşe + boyut): kök (`capa`) jetonun
 * yatay merkezinde ve tepeden `omuz` yüksekliğinde. SVG jeton ve rozet aynı hesabı kullanır.
 */
export function wingBox(wing: WingLayerSpec, cx: number, cy: number, w: number): { x: number; y: number; width: number; height: number } {
  const width = w * wing.olcek, height = width * wing.enBoy;
  return { x: cx - wing.capa[0] * width, y: cy - w / 2 + w * wing.omuz - wing.capa[1] * height, width, height };
}

/**
 * Karakterin görünümü; `flying`: uçarken görünen kanatlar (Draconic Flight) da çizilir. `ability` (karakter ekranları: liste,
 * oluşturucu, jeton önizlemesi): karakterin uçma yeteneği varsa (kanat slotu soy/alt soy/alt sınıf ve seviye eşiğiyle eşleşiyorsa)
 * havada olmasa da açık kanat çizilir; savaş bunu geçirmez, orada kural aynen (yalnız havadayken, `herZaman` hariç).
 */
export function lineageLook(sheet: LookSheet, opts: { flying?: boolean; ability?: boolean } = {}): LineageLook {
  const filters: string[] = [];
  let scaleX = 1, scaleY = 1, hideHalo = false;
  let wingId: string | undefined;
  const level = sheet.level ?? 1;
  if (sheet.raceId === 'celestial') {
    const aw = D.celestialUyanis[sheet.celestialAwakening ?? AWAKENING_DEFAULT];
    if (aw && level >= AWAKENING_FROM) {
      hideHalo = !aw.hale;
      if (aw.filtre) filters.push(aw.filtre);
      wingId = aw.kanat;
    }
  } else {
    const entry = sheet.lineageId ? D.altSoylar[`${sheet.raceId}/${sheet.lineageId}`] : undefined;
    if (entry?.filtre && !entry.orijinal) filters.push(entry.filtre);
    if (entry?.oran) { scaleX = entry.oran.en; scaleY = entry.oran.boy; }
    wingId = entry?.kanat;
  }
  // Alt sınıfa bağlı slot (örn. Melek) ırk/alt soy kanadının yerine geçer; seçili/yüklü değilse hiçbir şey değişmez.
  wingId = subclassWingId(sheet) ?? wingId;
  if (!wingId && sheet.raceId === 'dragonborn') wingId = 'dragonborn';
  const wing = wingId ? wingLayer(wingId, level, !!(opts.flying || opts.ability), sheet.lineageId) : null;
  return { filter: filters.join(' '), scaleX, scaleY, wing, hideHalo };
}

/** Ten tonu (Human) için kimlik denetimi. */
/** Ten tonu (bilinmeyen eski kimlik: varsayılan Orijinal). */
export const skinToneOf = (id: string | undefined): SkinTone | undefined => SKIN_TONES.find((x) => x.id === id) ?? SKIN_TONES.find((x) => x.id === DEFAULT_SKIN_TONE);

/**
 * Kuyruk AS1c: Human ten tonunun jeton boyaması (ten maskesiyle yalnız ten pikselleri; `soy-renkleri.json` `human` maskesi). Hedef
 * ten rengi `ten.tonlar[].renk` (hex): ton ve kroma hedefe kayar, ortalama açıklık hedefe taşınır, gölge/ışık orantısı korunur.
 * Orijinal (renk null), filtre kapalı ya da Human olmayan karakterde undefined.
 */
export function skinTint(raceId: string, toneId: string | undefined): TintSpec | undefined {
  if (raceId !== 'human' || !D.ten.filtreUygula) return undefined;
  const hex = skinToneOf(toneId)?.renk;
  if (!hex) return undefined;
  const n = parseInt(hex.slice(1), 16);
  const [L, a, b] = rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  const select = (soyRenkleri.races as unknown as Record<string, { select: TintSpec['select'] }>).human!.select;
  return { select, to: { lch: { h, c: Math.hypot(a, b), L, hueKeep: 0.3, chromaKeep: 0.5 } } };
}

/** SD5: palet filtresinin kimliği (aynı palet = aynı kimlik; tanım birden çok kez bulunsa da özdeş). */
export const wingFilterId = (p: WingPalet): string => `wp-${p.golge.slice(1)}-${p.isik.slice(1)}`;
const hexTable = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
/** SD5: palet filtresinin SVG parametreleri: parlaklık (luma) gölge→ışık rengine eşlenir, alfa dokunulmaz. */
export function wingFilterTables(p: WingPalet): { r: string; g: string; b: string } {
  const lo = hexTable(p.golge), hi = hexTable(p.isik);
  const f = (i: number) => `${lo[i]!.toFixed(3)} ${hi[i]!.toFixed(3)}`;
  return { r: f(0), g: f(1), b: f(2) };
}
