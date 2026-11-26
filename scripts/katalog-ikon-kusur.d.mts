// scripts/katalog-ikon-kusur.mjs saf parçalarının türleri (testler içe aktarır).
export interface Olcu { pembe: number; somon: number; cep: number; sis: number; kenar?: number }
export interface Kusur { tur: string; ad: string; deger: number; kesin: boolean }
export const DUZELTME_ON: string;
export const KUSUR: Record<'pembe' | 'somon' | 'cep' | 'sis' | 'kenar', { esik: number; ad: string }>;
export function ikonOlcu(rgba: Uint8Array, w: number, h: number): Olcu;
export function kenarOrani(rgb: Uint8Array, W: number, x0: number, y0: number, cw: number, ch: number, zemin: number[]): number;
export function kusurlar(olcu: Partial<Olcu>): Kusur[];
