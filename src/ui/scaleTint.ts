/**
 * Dragonborn pul deseni (v2; yalnız görünüm, tembel parça): beyaz taban jetonun pul maskesindeki (`characters/maske-pul/<jeton>.png`)
 * pikselleri soyun orta tonuna boyar ve pul dokusunu L* oynaması olarak ekler. Parlaklık korunur: L* = orta L* + (piksel L* − maskenin
 * L* ortancası); ton ve kroma orta tondan, uç ışık/gölgede kroma hafifçe düşer, sRGB gamına sığmazsa kısılır. Karo 256 px jeton
 * uzayında tanımlı; küçük kopyada (W < 256) karo W/256 ölçekli okunur. Ayar ve renkler `data/dragonborn-pul.json`
 * (`scripts/dragonborn-pul-maske.py` üretir). Saf: DOM bilmez.
 */
import pul from '../../data/dragonborn-pul.json';
import { rgbToLab } from './color';

interface PulData {
  karo: string[]; mod: [number, number, number]; modKoyu: Record<string, [number, number, number]>;
  kromaDusus: number; kromaAlt: number; Lmin: number; Lmax: number;
  soylar: Record<string, { acik: string; orta: string; koyu: string }>;
  maskesiz: Record<string, string>;
}
const P = pul as unknown as PulData;

/** Pul boyaması tanımlı soylar. */
export const scaleLineages = (): string[] => Object.keys(P.soylar);
/** Maskesi üretilemeyen jetonlar ve nedeni (bu jetonlar boyanmaz). */
export const scaleMaskless = (): Record<string, string> => P.maskesiz;

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const fi = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
/** Lab → doğrusal sRGB (kırpılmamış). */
function labToLinear(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const x = fi(fx) * 0.95047, y = fi(fy), z = fi(fz) * 1.08883;
  return [3.2404542 * x - 1.5371385 * y - 0.4985314 * z, -0.969266 * x + 1.8760108 * y + 0.041556 * z, 0.0556434 * x - 0.2040259 * y + 1.0572252 * z];
}
const inGamut = (v: [number, number, number]) => v.every((c) => c >= -1e-4 && c <= 1.0001);
const toByte = (c: number) => Math.round(Math.max(0, Math.min(1, gam(Math.max(0, c)))) * 255);

function hexLch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [L, a, b] = rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255);
  return [L, Math.hypot(a, b), Math.atan2(b, a)];
}

/**
 * Yerinde boyar; boyanan piksel sayısını döndürür. `mask` piksel başına 0/1 (görsel boyutunda). Soy tanımsızsa ya da maske boşsa 0.
 */
export function scalePixels(data: Uint8ClampedArray, soy: string, mask: Uint8Array, W: number, H: number): number {
  const cols = P.soylar[soy];
  if (!cols) return 0;
  const idx: number[] = []; const Ls: number[] = [];
  for (let p = 0; p < W * H; p++) {
    if (!mask[p] || (data[p * 4 + 3] ?? 0) < 10) continue;
    const i = p * 4; idx.push(p); Ls.push(rgbToLab(data[i]!, data[i + 1]!, data[i + 2]!)[0]);
  }
  if (!idx.length) return 0;
  const sorted = [...Ls].sort((x, y) => x - y);
  const n = sorted.length, Lm = n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
  const [Lt, Ct, Ht] = hexLch(cols.orta);
  const mod = P.modKoyu[soy] ?? P.mod;
  const T = P.karo.length, scale = 256 / W, cosH = Math.cos(Ht), sinH = Math.sin(Ht);
  idx.forEach((p, k) => {
    const x = p % W, y = (p / W) | 0;
    const tone = Number(P.karo[Math.floor(y * scale) % T]![Math.floor(x * scale) % T]) as 0 | 1 | 2;
    const dL = Ls[k]! - Lm;
    const Lo = Math.max(P.Lmin, Math.min(P.Lmax, Math.max(P.Lmin, Math.min(P.Lmax, Lt + dL)) + mod[tone]));
    let Co = Ct * Math.max(P.kromaAlt, Math.min(1, 1 - Math.abs(dL) / P.kromaDusus));
    let v = labToLinear(Lo, Co * cosH, Co * sinH);
    for (let it = 0; it < 6 && !inGamut(v); it++) { Co *= 0.8; v = labToLinear(Lo, Co * cosH, Co * sinH); }
    const i = p * 4; data[i] = toByte(v[0]); data[i + 1] = toByte(v[1]); data[i + 2] = toByte(v[2]);
  });
  return idx.length;
}
