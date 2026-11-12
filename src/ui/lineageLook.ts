/**
 * Kuyruk AS1a: alt soy görünümü (yalnızca görsel; kural sürümüne girmez). Veri `data/alt-soy-gorunum.json`: alt soylara
 * ayrı çizim yok; renk filtresi (tint/maskesi olmayan ırklar için CSS `filter`), en-boy/ölçek, kanat katmanı yuvaları ve
 * Celestial hale kuralı. Human ten tonu kültürden bağımsız ayrı seçimdir (`skinTone`). Saf: DOM bilmez.
 */
import data from '../../data/alt-soy-gorunum.json';
import wings from '../../data/kanat-esleme.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import type { TintSpec } from '../battle/types';
import { rgbToLab } from './color';
import { findSubclass } from '../rules/subclasses';

/** Çözülmüş kanat katmanı (jetonun arkası): `src` o anki durumun görseli (`public/` altı yol), filtre renk için. */
/** `capa`: kanat kökü görsel oranı; `omuz`: kökün jeton yüksekliğinde tepeden oranı; `enBoy`: görsel yüksekliği/genişliği. */
export interface WingLayerSpec { id: string; src: string; olcek: number; omuz: number; capa: [number, number]; enBoy: number; filtre: string; open: boolean }
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
type WingSlotData = { altSinif?: string; dosya: string | null; dosyaKapali: string | null; minSeviye?: number; herZaman?: boolean; olcek: number; omuz: number; capa: [number, number]; enBoy: number; filtre?: string; renkFiltreleri?: Record<string, string> };
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
  return { id, src: `${W.klasor}/${file}`, olcek: w.olcek, omuz: w.omuz, capa: w.capa, enBoy: w.enBoy, filtre, open };
}

/**
 * Kanat görselinin kutusu (jeton merkezi `cx,cy`, jeton genişliği `w` cinsinden, yukarı-sol köşe + boyut): kök (`capa`) jetonun
 * yatay merkezinde ve tepeden `omuz` yüksekliğinde. SVG jeton ve rozet aynı hesabı kullanır.
 */
export function wingBox(wing: WingLayerSpec, cx: number, cy: number, w: number): { x: number; y: number; width: number; height: number } {
  const width = w * wing.olcek, height = width * wing.enBoy;
  return { x: cx - wing.capa[0] * width, y: cy - w / 2 + w * wing.omuz - wing.capa[1] * height, width, height };
}

/** Karakterin görünümü; `flying`: uçarken görünen kanatlar (Draconic Flight) da çizilir. */
export function lineageLook(sheet: LookSheet, opts: { flying?: boolean } = {}): LineageLook {
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
  const wing = wingId ? wingLayer(wingId, level, !!opts.flying, sheet.lineageId) : null;
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
