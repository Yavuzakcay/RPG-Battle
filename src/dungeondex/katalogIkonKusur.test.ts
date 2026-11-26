/**
 * Katalog ikon kusur sezgisi (scripts/katalog-ikon-kusur.mjs): sentetik RGBA ile kenar bandı rengi (leylak, somon), opak macenta cep,
 * kaynak hücre kenarı ve eşik/belirsiz ayrımı. Görsel dosyası açılmaz.
 */
import { describe, expect, it } from 'vitest';
import { ikonOlcu, kenarOrani, KUSUR, kusurlar } from '../../scripts/katalog-ikon-kusur.mjs';

const W = 32;
/** Ortada 20 × 20 opak gövde (gri), dış 3 px halkası `halka` renginde, kalanı saydam; `cep` verilirse ortada 8 × 8 opak macenta. */
function ikon(halka: number[], cep = false) {
  const b = new Uint8Array(W * W * 4);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const d = Math.max(Math.abs(x - 15.5), Math.abs(y - 15.5)); const i = (y * W + x) * 4;
    if (d >= 10) continue;
    const c = cep && d < 4 ? [200, 10, 200, 255] : d >= 7 ? [...halka, 160] : [128, 128, 128, 255];
    b.set(c, i);
  }
  return b;
}

describe('Katalog ikon kusur sezgisi', () => {
  it('leylak hale (despill sonrası R ≈ G, B baskın) pembe sayılır; mavi parıltı sayılmaz', () => {
    expect(ikonOlcu(ikon([165, 160, 235]), W, W).pembe).toBeGreaterThan(0.5);
    expect(ikonOlcu(ikon([80, 170, 250]), W, W).pembe).toBe(0);
  });
  it('somon hale (despill sonrası pembe) somon sayılır; koyu kırmızı parıltı sayılmaz', () => {
    expect(ikonOlcu(ikon([245, 170, 160]), W, W).somon).toBeGreaterThan(0.5);
    expect(ikonOlcu(ikon([220, 60, 40]), W, W).somon).toBe(0);
  });
  it('gövde içindeki opak macenta cep sayılır', () => {
    expect(ikonOlcu(ikon([128, 128, 128], true), W, W).cep).toBe(64);
    expect(ikonOlcu(ikon([128, 128, 128]), W, W).cep).toBe(0);
  });
  it('kaynak hücre kenarı: zeminden uzak piksel oranı', () => {
    const rgb = new Uint8Array(W * W * 3);
    for (let i = 0; i < W * W; i++) rgb.set([251, 0, 253], i * 3);
    expect(kenarOrani(rgb, W, 0, 0, W, W, [251, 0, 253])).toBe(0);
    for (let x = 0; x < W; x++) rgb.set([100, 200, 220], x * 3); // üst satır parıltı
    expect(kenarOrani(rgb, W, 0, 0, W, W, [251, 0, 253])).toBeGreaterThan(0.05);
  });
  it('eşik kusur, eşiğin yarısı ile eşik arası belirsiz, altı yok', () => {
    const e = KUSUR.pembe.esik;
    expect(kusurlar({ pembe: e })[0]).toMatchObject({ tur: 'pembe', kesin: true });
    expect(kusurlar({ pembe: e * 0.6 })[0]).toMatchObject({ tur: 'pembe', kesin: false });
    expect(kusurlar({ pembe: e * 0.4 })).toEqual([]);
  });
});
