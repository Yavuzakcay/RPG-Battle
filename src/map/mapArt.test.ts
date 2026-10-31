/**
 * Görev HG1: harita görseli doğrulaması. Hedef boyut savaş ekranının dünya boyutuyla aynı; doğru boyutta uyarı yok,
 * katında (2×) uyarı yok, oran hatasında hata, hafif sapmada / düşük çözünürlükte / büyük dosyada uyarı. Her geniş
 * haritanın referans görselleri ve prompt'u var (yalnızca dosya adları).
 */
import { describe, expect, it } from 'vitest';
import { artSize, checkArt } from './mapArt';
import { isWideMap, maps } from './maps';
import { worldOf } from '../ui/mapView';

const S31 = { cols: 31, rows: 17 }, S21 = { cols: 21, rows: 11 };
// Yalnızca dosya adları (tembel glob; görsel okunmaz).
const REF = new Set(Object.keys(import.meta.glob('/docs/harita/referans/*')).map((f) => f.split('/').pop()));

describe('harita görseli doğrulaması (Görev HG1)', () => {
  it('hedef boyut dünya boyutunun yuvarlağı (15×7 = 1280×715)', () => {
    expect(artSize({ cols: 15, rows: 7 })).toEqual({ w: 1280, h: 715 });
    expect(artSize(S31)).toEqual({ w: 2616, h: 1668 });
    expect(artSize(S21)).toEqual({ w: 1781, h: 1096 });
    for (const s of [S31, S21, { cols: 48, rows: 28 }]) {
      const w = worldOf(s);
      expect(artSize(s)).toEqual({ w: Math.round(w.w), h: Math.round(w.h) });
    }
  });
  it('doğru boyut ve tam katı: uyarı yok', () => {
    expect(checkArt({ w: 2616, h: 1668 }, S31)).toMatchObject({ level: 'ok', messages: [] });
    expect(checkArt({ w: 5232, h: 3336 }, S31).level).toBe('ok');
    expect(checkArt({ w: 1781, h: 1096, kb: 600 }, S21).level).toBe('ok');
  });
  it('yanlış oran: hata (Gemini kare ya da 16:9 verirse)', () => {
    const square = checkArt({ w: 2048, h: 2048 }, S31);
    expect(square.level).toBe('error');
    expect(square.messages[0]).toMatch(/en-boy oranı 1\.000, beklenen 1\.568 \(2616×1668\)/);
    expect(checkArt({ w: 1920, h: 1080 }, S31).level).toBe('error');
    expect(checkArt({ w: 1781, h: 1300 }, S21).level).toBe('error');
  });
  it('hafif oran sapması, düşük ya da çok yüksek çözünürlük, büyük dosya: uyarı', () => {
    const slight = checkArt({ w: 2616, h: 1690 }, S31);
    expect(slight.level).toBe('warn');
    expect(slight.messages[0]).toMatch(/hafifçe esnetilecek/);
    expect(checkArt({ w: 1308, h: 834 }, S31).messages.join()).toMatch(/çözünürlük düşük/);
    expect(checkArt({ w: 8000, h: 5100 }, S31).messages.join()).toMatch(/küçültülecek/);
    expect(checkArt({ w: 2616, h: 1668, kb: 2048 }, S31).messages.join()).toMatch(/2048 kB > 1024 kB/);
  });
  it('her geniş haritanın referans görselleri ve Gemini prompt dosyası var', () => {
    const wide = maps.filter(isWideMap);
    expect(wide.length).toBeGreaterThanOrEqual(3);
    for (const m of wide) {
      const names = m.variants.length > 1 ? m.variants.map((v) => `${m.id}-${v.id}`) : [m.id];
      for (const n of names) for (const f of [`${n}.png`, `${n}-izgarasiz.png`, `${n}-prompt.md`]) {
        expect(REF.has(f), f).toBe(true);
      }
    }
  });
});
