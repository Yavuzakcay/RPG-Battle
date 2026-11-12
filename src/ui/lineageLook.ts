/**
 * Kuyruk AS1a: alt soy görünümü (yalnızca görsel; kural sürümüne girmez). Veri `data/alt-soy-gorunum.json`: alt soylara
 * ayrı çizim yok; renk filtresi (tint/maskesi olmayan ırklar için CSS `filter`), en-boy/ölçek, kanat katmanı yuvaları ve
 * Celestial hale kuralı. Human ten tonu kültürden bağımsız ayrı seçimdir (`skinTone`). Saf: DOM bilmez.
 */
import data from '../../data/alt-soy-gorunum.json';

export interface WingSlot {
  id: string;
  ad: { tr: string; en: string };
  /** Kendi sprite'ı (`public/` altı yol); null: yer tutucu olarak `efekt` kanat şeridi (ilk kare). */
  sprite: string | null;
  efekt: string;
  ne_zaman: 'surekli' | 'ucarken';
  minSeviye?: number;
  olcek: number;
  yukari: number;
  filtre?: string;
}
export interface SkinTone { id: string; ad: { tr: string; en: string }; renk: string; hsl: { hueRotate: number; saturate: number; brightness: number; sepia: number }; yorum?: string }
/** Ten tonunun CSS filtresi (`hsl` alanından; Orijinal: boş). */
export function toneFilter(t: SkinTone): string {
  const h = t.hsl;
  const parts = [h.hueRotate ? `hue-rotate(${h.hueRotate}deg)` : '', h.sepia ? `sepia(${h.sepia})` : '', h.saturate !== 1 ? `saturate(${h.saturate})` : '', h.brightness !== 1 ? `brightness(${h.brightness})` : ''];
  return parts.filter(Boolean).join(' ');
}
export interface LookSheet { raceId: string; lineageId?: string; celestialAwakening?: string; level?: number; skinTone?: string }
export interface LineageLook {
  /** CSS `filter` (boşsa yok). */
  filter: string;
  scaleX: number;
  scaleY: number;
  wing: WingSlot | null;
  /** Celestial hale gizli (görselin üst bandı kırpılır). */
  hideHalo: boolean;
}

const D = data as unknown as {
  altSoylar: Record<string, { filtre?: string; oran?: { en: number; boy: number }; kanat?: string; orijinal?: true }>;
  orijinal: string[];
  celestialUyanis: Record<string, { hale: boolean; filtre?: string; kanat?: string }>;
  kanatYuvalari: Record<string, Omit<WingSlot, 'id'>>;
  hale: { gizleUstYuzde: number };
  ten: { varsayilan: string; filtreUygula: boolean; tonlar: SkinTone[]; kulturTen: Record<string, string[]> };
};
/** Celestial Göksel Uyanış 3. seviyeden etkin (`data/celestial.json` `awakening.minLevel`; test eşitliği denetler). */
export const AWAKENING_FROM = 3;
export const AWAKENING_DEFAULT = 'parlayan-ruh';
export const HALO_CLIP_PCT = D.hale.gizleUstYuzde;
export const SKIN_TONES: SkinTone[] = D.ten.tonlar;
export const DEFAULT_SKIN_TONE = D.ten.varsayilan;
/** Kültür (alt soy) → seçilebilecek ten tonları (`ten.kulturTen`; AS1b'de üç kültürde de üç ton). */
export const CULTURE_SKIN: Record<string, string[]> = D.ten.kulturTen;
export const tonesFor = (lineageId: string | undefined): SkinTone[] => SKIN_TONES.filter((t) => !lineageId || !CULTURE_SKIN[lineageId] || CULTURE_SKIN[lineageId]!.includes(t.id));
/** Kuyruk AS1a-2: boyasız ORİJİNAL jetonla gelen alt soylar (`<ırk>/<alt soy>`; filtre/tint/maske yok, yalnız oran). */
export const ORIGINAL_LINEAGES: string[] = D.orijinal;
export const isOriginalLineage = (key: string): boolean => D.orijinal.includes(key);
export const WING_SLOTS = Object.keys(D.kanatYuvalari);
export const lookEntries = (): string[] => Object.keys(D.altSoylar);
export const awakeningLookIds = (): string[] => Object.keys(D.celestialUyanis);

const slot = (id: string): WingSlot => ({ id, ...(D.kanatYuvalari[id] as Omit<WingSlot, 'id'>) });

/** Karakterin görünümü; `flying`: uçarken görünen kanatlar (Draconic Flight) da çizilir. */
export function lineageLook(sheet: LookSheet, opts: { flying?: boolean } = {}): LineageLook {
  const filters: string[] = [];
  let scaleX = 1, scaleY = 1, hideHalo = false;
  let wingId: string | undefined;
  const level = sheet.level ?? 1;
  if (sheet.raceId === 'human') {
    // Ten tonu filtresi eşleme eklenene dek kapalı (`ten.filtreUygula`): bütün Human jetonları orijinal.
    const tone = D.ten.filtreUygula ? skinToneOf(sheet.skinTone) : undefined;
    const tf = tone ? toneFilter(tone) : '';
    if (tf) filters.push(tf);
  }
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
  if (!wingId && sheet.raceId === 'dragonborn' && opts.flying) wingId = 'dragonborn-ucus';
  let wing = wingId ? slot(wingId) : null;
  if (wing && ((wing.minSeviye ?? 1) > level || (wing.ne_zaman === 'ucarken' && !opts.flying))) wing = null;
  return { filter: filters.join(' '), scaleX, scaleY, wing, hideHalo };
}

/** Ten tonu (Human) için kimlik denetimi. */
/** Ten tonu (bilinmeyen eski kimlik: varsayılan Orijinal). */
export const skinToneOf = (id: string | undefined): SkinTone | undefined => SKIN_TONES.find((x) => x.id === id) ?? SKIN_TONES.find((x) => x.id === DEFAULT_SKIN_TONE);
