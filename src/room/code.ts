/**
 * Görev ODA-1 (O1): 6 haneli oda kodu ve oturum anahtarı (ODA-TASARIM.md §0). Saf; Rng enjekte (testte tohumlu,
 * uygulamada `crypto` tabanlı `guvenliRng`).
 */
import type { Rng } from '../rules/dice';

/** 100000–999999: baştaki sıfır yazarken kaybolmasın diye `0` ile başlamaz. */
export const kodUret = (rng: Rng): string => String(100000 + Math.floor(rng() * 900000)).slice(0, 6);
export const kodGecerli = (s: string): boolean => /^[1-9]\d{5}$/.test(s);
/** Kullanıcının yazdığını temizler (boşluk, tire). */
export const kodTemizle = (s: string): string => s.replace(/[\s-]/g, '');

const HEX = '0123456789abcdef';
/** Oturum anahtarı (32 onaltılık hane): host katılımda verir, yeniden girişte `istemciId` ile birlikte istenir. */
export const anahtarUret = (rng: Rng): string => Array.from({ length: 32 }, () => HEX[Math.floor(rng() * 16)]).join('');
/** Anonim istemci kimliği (sekmede saklanır). */
export const istemciIdUret = (rng: Rng): string => `i-${anahtarUret(rng).slice(0, 12)}`;

/** Tarayıcıda/node'da `crypto.getRandomValues` tabanlı Rng (yoksa Math.random). */
export function guvenliRng(): Rng {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } }).crypto;
  if (!c?.getRandomValues) return Math.random;
  const buf = new Uint32Array(1);
  return () => { c.getRandomValues!(buf); return (buf[0] as number) / 4294967296; };
}
