/**
 * Dungeondex Kitap kabuğu verisi (Görev DD-Kitap): `data/dungeondex-kitap.json` (npm run dd-kitap) okuma, çerçeve seçimi
 * ve kapaktaki logo sahnesinin yerleşimi. Saf; çizim `Book.tsx`.
 */
import raw from '../../../data/dungeondex-kitap.json';
import { acilis } from '../../../data/logo.json';
import type { Box, Pt } from './measure';

interface Img { file: string; width: number; height: number; aspect: number }
export type CoverData = Img & { pencere: Box; altigen: Pt[]; ustSerit: Box | null; altSerit: Box | null; toka: Pt | null };
export type SpreadData = Img & { vitrin: Box; serit: Box | null; sayfa: Box; guvenli: Box; mentese?: Box | null };
export interface BookData { kapak: CoverData | null; genis: SpreadData | null; mobil: SpreadData | null }
export type FrameKind = 'genis' | 'mobil' | 'duz';

export const BOOK_ANIM = raw.animasyon;
export const bookData = (): BookData => raw as unknown as BookData;

/** Dar ya da dik ekran: genişlik < 700 px ya da en < boy. */
export const narrowScreen = (w: number, h: number): boolean => w < 700 || w < h;

/** Ekrana göre çerçeve: dar/dikte mobil, genişte geniş; istenen yoksa diğeri, hiçbiri yoksa düz (çerçevesiz) düzen. */
export function frameFor(w: number, h: number, d: BookData = bookData()): FrameKind {
  const order: FrameKind[] = narrowScreen(w, h) ? ['mobil', 'genis'] : ['genis', 'mobil'];
  return order.find((k) => d[k as 'genis' | 'mobil']) ?? 'duz';
}

/** Vitrin altı şerit: ölçülmediyse vitrinin hemen altında, vitrin eninde ince bant. */
export function stripBox(s: SpreadData): Box {
  return s.serit ?? { x: s.vitrin.x, y: s.vitrin.y + s.vitrin.h + 0.01, w: s.vitrin.w, h: 0.07 };
}

const pct = (v: number) => `${Math.round(v * 100000) / 1000}%`;
export const boxStyle = (b: Box): Record<string, string> => ({ left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) });

/**
 * Kapak penceresine logo sahnesi (açılış ekranının geniş logo tuvali): kapalı kanatlı logonun altıgeni
 * (`data/logo.json` `acilis.closed.box` içinde `logoAltigen`) pencerenin sınır kutusuna `olcek` payıyla ortalanır; sahne kapak kutusunun
 * yüzdesi. Açık kanatlar pencerenin dışına, kapağın üstüne taşar.
 */
export function logoStageIn(win: Box, coverAspect: number, olcek = BOOK_ANIM.logoOlcek): Record<string, string> {
  const B = acilis.closed.box, H = raw.logoAltigen, A = acilis.aspect;
  // Altıgenin sahnedeki kutusu (kapalı görselin kenar boşluğu dışarıda).
  const C = { x: B.x + H.x * B.w, y: B.y + H.y * B.h, w: H.w * B.w, h: H.h * B.h };
  // Kapak yüksekliği 1, eni coverAspect birim; sahne eni S birim.
  const S = olcek * Math.min((win.w * coverAspect) / C.w, (win.h * A) / C.h);
  const cx = (win.x + win.w / 2) * coverAspect, cy = win.y + win.h / 2;
  const left = cx - (C.x + C.w / 2) * S, top = cy - ((C.y + C.h / 2) * S) / A;
  return { left: pct(left / coverAspect), top: pct(top), width: pct(S / coverAspect), height: pct(S / A) };
}
