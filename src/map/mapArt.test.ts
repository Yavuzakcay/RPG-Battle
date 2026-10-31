/**
 * Görev HG1: harita görseli doğrulaması. Hedef boyut savaş ekranının dünya boyutuyla aynı; doğru boyutta uyarı yok,
 * katında (2×) uyarı yok, oran hatasında hata, hafif sapmada / düşük çözünürlükte / büyük dosyada uyarı. Her geniş
 * haritanın referans görselleri ve prompt'u var (yalnızca dosya adları).
 */
import { describe, expect, it } from 'vitest';
import { artName, artSize, artSourcePlan, checkArt, mapFileBase, previewKey } from './mapArt';
import { isWideMap, maps } from './maps';
import { worldOf } from '../ui/mapView';

const S31 = { cols: 31, rows: 17 }, S21 = { cols: 21, rows: 11 };
// Yalnızca dosya adları (tembel glob; görsel okunmaz).
const OUT = new Set(Object.keys(import.meta.glob(['/harita/*/onizleme/*', '/harita/*/prompt/*'])).map((f) => f.replace(/^.*\/harita\//, '')));

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
    // Kuyruk 16 K16B: vitrin haritası yer tutucu görselle (Gemini referansı yok).
    const wide = maps.filter((m) => isWideMap(m) && !m.vitrin);
    expect(wide.length).toBeGreaterThanOrEqual(3);
    for (const m of wide) {
      // Kuyruk 19C: önizlemeler harita/<bolge>/onizleme/, prompt'lar harita/<bolge>/prompt/ (kimlikten adla).
      const keys = [...new Set(m.variants.map((v) => previewKey(m, v.id)))];
      for (const k of keys) for (const f of [`${m.bolge}/onizleme/${k}-izgara.png`, `${m.bolge}/onizleme/${k}-izgarasiz.png`, `${m.bolge}/prompt/${k}.md`]) {
        expect(OUT.has(f), f).toBe(true);
      }
    }
  });
  it('Kuyruk 19 D1: görsel adı bölgeden ve addan (kimlikten bağımsız)', () => {
    expect(artName('maps/volkan/volkan-portal-salonu.webp')).toEqual({ bolge: 'volkan', name: 'volkan-portal-salonu' });
    expect(artName('maps/harita-col.webp')).toEqual({ bolge: '', name: 'harita-col' });
    expect(() => artName('odul/x.png')).toThrow();
    for (const m of maps) for (const v of m.variants) expect(artName(v.image).bolge, `${m.id}/${v.id}`).toBe(m.bolge);
    // Kuyruk 19D: önizleme anahtarı haritanın ad tabanı (gorsel adı); gorsel yoksa kimlik.
    expect(previewKey({ id: 'kanyon-koprusu', gorsel: 'volkan/volkan-kopru', variants: [{ id: 'v', image: 'x' }] }, 'v')).toBe('volkan-kopru');
    expect(previewKey({ id: 'col', gorsel: 'col/col-klasik', variants: [{ id: 'gunduz', image: 'x' }, { id: 'aksam', image: 'y' }] }, 'aksam')).toBe('col-klasik-aksam');
    for (const m of maps) expect(mapFileBase(m)).toBe(artName(m.variants[0]!.image).name);
    expect(previewKey({ id: 'volkan', variants: [{ id: 'a', image: 'x' }, { id: 'b', image: 'x' }] }, 'b')).toBe('volkan');
    expect(previewKey({ id: 'col', variants: [{ id: 'gunduz', image: 'x' }, { id: 'aksam', image: 'y' }] }, 'aksam')).toBe('col-aksam');
  });
  it('Kuyruk 19B T2: kaynak yokken mevcut görsel korunur; yer tutucu yalnızca görsel yoksa ya da bayrakla', () => {
    const p = (raw: boolean, ref: boolean, existing: boolean, placeholderFlag = false) => artSourcePlan({ raw, ref, existing, placeholderFlag });
    expect(p(false, false, true)).toBe('keep');
    expect(p(false, false, false)).toBe('placeholder');
    expect(p(false, false, true, true)).toBe('placeholder');
    expect(p(true, true, true)).toBe('raw');
    expect(p(false, true, true)).toBe('ref');
    expect(p(true, true, true, true)).toBe('placeholder');
  });
});
