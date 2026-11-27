// scripts/katalog-ikon-kusur.mjs saf parçalarının türleri (testler içe aktarır).
export interface Olcu { pembe: number; somon: number; cep: number; sis: number; kenar?: number }
export interface Kusur { tur: string; ad: string; deger: number; kesin: boolean }
export const DUZELTME_ON: string;
export const KUSUR: Record<'pembe' | 'somon' | 'cep' | 'sis' | 'kenar', { esik: number; ad: string }>;
export function ikonOlcu(rgba: Uint8Array, w: number, h: number): Olcu;
export function kenarOrani(rgb: Uint8Array, W: number, x0: number, y0: number, cw: number, ch: number, zemin: number[]): number;
export function kusurlar(olcu: Partial<Olcu>): Kusur[];
export type Kip = 'yesil' | 'macenta';
export const ZEMIN_KUSUR: { kalinti: { esik: number; ad: string }; hale: { esik: number; ad: string }; kalintiBilesen: number };
export function kalintiMi(kip: Kip, r: number, g: number, b: number): boolean;
export function haleMi(kip: Kip, r: number, g: number, b: number, a?: number): boolean;
export function zeminOlcu(rgba: Uint8Array, w: number, h: number, kip: Kip, bilesen?: number): { kalinti: number; hale: number };
export function zeminKusurlari(olcu: { kalinti: number; hale: number }, kip: Kip): Kusur[];
