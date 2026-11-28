// scripts/esya-ikon.mjs saf parçalarının türleri (testler ve rapor içe aktarır).
export interface Oge { id: string; ad?: string; kaynak?: string }
export interface Sayfa { dosya: string; kolon: number; satir: number; hucre?: string; zemin?: string; ogeler: Array<Oge | null>;
  /** Görev BOSS-IMZA-GORSEL: eşit olmayan kolon sınırları (kaynak px) ve zemin rengine boyanan çerçeve/ayraç dikdörtgenleri. */
  kolonSinir?: number[]; zeminBoya?: Array<[number, number, number, number]>; zeminRenk?: string }
export interface Manifest {
  sayfalar: Sayfa[]; yoksay?: string[]; ayniGorsel?: Record<string, string[]>; hepsiniTut?: string[]; tamDespill?: string[]; cepTemizle?: string[]; boslukKapali?: string[];
  yenidenUretilecek?: Record<string, string>; belirsiz?: unknown;
}
export interface Konum { sayfa: string; hucre: number; kaynakId: string; sira: number; kopya?: string }
export interface Kayit { id: string; srd: string | null }
export const BUYUK: number;
export const KUCUK: number;
export function dosyaAdi(id: string): string;
export function sayfaAdi(dosya: string): string;
export function hucreler(W: number, H: number, sayfa: Pick<Sayfa, 'kolon' | 'satir' | 'hucre' | 'kolonSinir'>): Array<{ x: number; y: number; w: number; h: number }>;
export function plan(manifest: Manifest, varMi?: (dosya: string) => boolean): { son: Map<string, Konum>; ezilen: Array<[string, string, string]>; atlanan: string[]; etkisiz: string[] };
export function oyunKayitlari(root?: string): Kayit[];
export function varyantEsle(id: string, kayitlar: Kayit[]): { id?: string; belirsiz?: string[]; yok?: string };
export function esle(manifest: Manifest, kayitlar: Kayit[]): { manifest: Manifest; varyant: Array<[string, string]>; eslesmeyen: Array<[string, string]>; belirsiz: Array<[string, string[]]> };
export const ANA_MANIFEST: string;
export const KATALOG_MANIFESTLER: string[];
export function manifestKimlikleri(manifest: Manifest): Set<string>;
export function beklenenDosyalar(manifestler: Manifest[], kayitlar: Kayit[], hedefler?: Set<string>): Set<string>;
export function bagla(son: Map<string, Konum>, kayitlar: Kayit[], hedefler?: Set<string>): { cikti: Map<string, Konum>; ust: Array<[string, string[], string[]]>; kayitsiz: string[] };
export function zeminKipi(zemin: readonly [number, number, number] | number[]): 'yesil' | 'macenta';
export function anahtarla(
  rgb: Uint8Array, w: number, h: number, zemin: readonly [number, number, number] | number[], hepsi?: boolean,
  ic?: { x0: number; y0: number; x1: number; y1: number }, tamDespill?: boolean, cepTemizle?: boolean,
  secenek?: { bosluk?: boolean | number; asinma?: boolean },
): Uint8Array;
