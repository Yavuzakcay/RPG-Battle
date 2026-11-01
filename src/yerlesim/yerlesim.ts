/**
 * Kuyruk 34b: yerleşim veri modeli (`data/yerlesim.json`; Serüven parçasıyla tembel). Şablonlar kale, kasaba, şehir;
 * her yerleşimin harita zinciri (kapı altıgenleri → hedef harita; null = hub'a dönüş), hub (dükkân, han, görevler),
 * görünüm (yalnızca renk filtresi), ırka göre Serüven başlangıcı. Saf; durum Serüven katmanında (`journey/seruven.ts`).
 */
import data from '../../data/yerlesim.json';

export type Hex1 = [number, number];
export interface YerlesimKapi { hexes: Hex1[]; to: string | null; nesne?: string }
export interface YerlesimHarita {
  id: string; mapId: string; variantId: string; tr?: string; en?: string;
  kapilar: YerlesimKapi[]; girisler?: Record<string, Hex1[]>;
}
export interface Yerlesim {
  id: string; tr: string; en: string; sablon: 'kale' | 'kasaba' | 'sehir'; gorunum: string; baslangic: string; test?: boolean;
  hub: { dukkan: boolean; han: boolean; gorevler: string[] };
  haritalar: YerlesimHarita[];
}
export interface DukkanUrun { id: string; tr: string; en: string; srd: string; fiyat: number; tur?: 'iksir' }
export interface Gorev {
  id: string; tr: string; en: string; npc: { tr: string; en: string }; aciklama: { tr: string; en: string };
  hedef: { page: string; node: string }; odul: { gold: number };
}
export interface YerlesimData {
  gorunumler: Record<string, { tr: string; en: string; filtre: string; test?: boolean }>;
  dukkan: DukkanUrun[]; satisOrani: number; hanUcreti: number; gorevler: Gorev[]; yerlesimler: Yerlesim[];
  irkBaslangic: Record<string, { page: string; at: string }>;
}
export const YERLESIM = data as unknown as YerlesimData;

export const yerlesimById = (id: string): Yerlesim | undefined => YERLESIM.yerlesimler.find((y) => y.id === id);
export const yerlesimHarita = (y: Yerlesim, id: string): YerlesimHarita | undefined => y.haritalar.find((h) => h.id === id);
export const urunById = (id: string): DukkanUrun | undefined => YERLESIM.dukkan.find((u) => u.id === id);
export const gorevById = (id: string): Gorev | undefined => YERLESIM.gorevler.find((g) => g.id === id);
export const satisFiyati = (u: DukkanUrun): number => Math.floor(u.fiyat * YERLESIM.satisOrani);
export const gorunumFiltre = (y: Yerlesim): string => YERLESIM.gorunumler[y.gorunum]?.filtre ?? '';

/** Haritaya varış altıgenleri (0 tabanlı): gelinen haritanın girişi, yoksa null (haritanın parti başlangıcı). */
export function varis(h: YerlesimHarita, from: string | null): Array<{ col: number; row: number }> | null {
  const list = h.girisler?.[from ?? 'hub'];
  return list ? list.map(([c, r]) => ({ col: c - 1, row: r - 1 })) : null;
}

/** Altıgendeki kapı (0 tabanlı konum). */
export function kapiAt(h: YerlesimHarita, pos: { col: number; row: number }): YerlesimKapi | undefined {
  return h.kapilar.find((k) => k.hexes.some(([c, r]) => c - 1 === pos.col && r - 1 === pos.row));
}

/** Irka göre Serüven başlangıcı (yoksa null: eski başlangıç). */
export const irkBaslangic = (race: string | undefined): { page: string; at: string } | null =>
  (race ? YERLESIM.irkBaslangic[race] : undefined) ?? null;
