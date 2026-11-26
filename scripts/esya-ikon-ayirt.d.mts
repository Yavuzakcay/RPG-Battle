// scripts/esya-ikon-ayirt.mjs saf parçalarının türleri (testler içe aktarır).
import type { Konum } from './esya-ikon.mjs';
export interface AyirtGrup {
  taban: string; tur: 'hasar' | 'zayiflik' | 'kure'; kose: string; onek?: string; turler?: string[]; ton?: string;
  secici?: { doygunlukMin: number; doygunlukMax: number; parlaklikMin?: number }; guc?: number; isaret?: { kose: string; renk: string };
  uyeler?: Record<string, { renk: string; glif: string }>;
}
export interface AyirtVeri {
  tabanKlasor: string; hasarRenk: Record<string, string>;
  isaret: { oran: number; kucukOran: number; kenar: number }; glif: { oran: number; kucukOran: number; kenar: number }; gruplar: AyirtGrup[];
}
export interface AyirtHedef { id: string; grup: AyirtGrup; hasar?: string; renk: string; glif: string }
export function veriOku(root?: string): AyirtVeri;
export function hedefler(veri: AyirtVeri): AyirtHedef[];
export function gercekCizimler(cikti: Map<string, Konum>): { kendi: Set<string>; bagli: Set<string> };
