export const UCUS_SOZCUK: RegExp;
export const UCUS_ALANLARI: string[];
export const HEDEFLER: Array<[string, string, string]>;
export interface UcusSatir {
  dosya: string; sinif: string; alt: string; altAd?: string; ozellik: string; ozellikAd?: string; seviye?: number; durum?: string; metinde: boolean;
  ucus: Array<Record<string, unknown>>; bicimUcus: Array<Record<string, unknown>>; cagir: boolean; phase: boolean; adimIlkeli: string[];
}
export interface UcusEnvanter {
  satirlar: UcusSatir[];
  yaratiklar: Array<{ dosya: string; id: string; ucma: number | null; yanlisAnahtar: boolean }>;
  hedefler: Array<{ sinif: string; ad: string; beklenen: string; bulundu: boolean; id: string | null; dosya: string | null }>;
}
export function ucusEnvanteri(packs: Array<{ dosya: string; data: unknown }>): UcusEnvanter;
export function envanterMarkdown(e: UcusEnvanter): string;
