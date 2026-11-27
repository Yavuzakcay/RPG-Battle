/**
 * Katalog ikon kusur sezgisi (scripts/katalog-ikon-kusur.mjs): sentetik RGBA ile kenar bandı rengi (leylak, somon), opak macenta cep,
 * kaynak hücre kenarı ve eşik/belirsiz ayrımı. Görsel dosyası açılmaz.
 */
import { describe, expect, it } from 'vitest';
import { haleMi, ikonOlcu, kalintiMi, kenarOrani, KUSUR, kusurlar, ZEMIN_KUSUR, zeminKusurlari, zeminOlcu } from '../../scripts/katalog-ikon-kusur.mjs';

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

describe('Zemin kalıntısı ve kenar halesi (ESYA-IKON-ZEMIN-TEMIZLIK)', () => {
  /** 32 × 32: ortada 20 × 20 opak gri gövde, dış 3 px halkası `halka` (α 160), ortada 6 × 6 `ic` lekesi (opak). */
  function ikon2(halka: number[], ic?: number[]) {
    const b = new Uint8Array(W * W * 4);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const d = Math.max(Math.abs(x - 15.5), Math.abs(y - 15.5));
      if (d >= 10) continue;
      b.set(ic && d < 3 ? [...ic, 255] : d >= 7 ? [...halka, 160] : [128, 128, 128, 255], (y * W + x) * 4);
    }
    return b;
  }
  it('yeşil kalıntı: kapalı boşlukta anahtar yeşili sayılır; zümrüt ve koyu yaprak sayılmaz', () => {
    expect(zeminOlcu(ikon2([128, 128, 128], [40, 235, 30]), W, W, 'yesil').kalinti).toBe(36);
    expect(zeminOlcu(ikon2([128, 128, 128], [20, 180, 80]), W, W, 'yesil').kalinti).toBe(0);
    expect(zeminOlcu(ikon2([128, 128, 128], [60, 140, 40]), W, W, 'yesil').kalinti).toBe(0);
  });
  it('macenta kalıntı: opak macenta sayılır; pembe/kırmızı taş sayılmaz; kip ayrımı', () => {
    expect(zeminOlcu(ikon2([128, 128, 128], [230, 10, 220]), W, W, 'macenta').kalinti).toBe(36);
    expect(zeminOlcu(ikon2([128, 128, 128], [230, 60, 210]), W, W, 'macenta').kalinti).toBe(0);
    expect(zeminOlcu(ikon2([128, 128, 128], [230, 10, 220]), W, W, 'yesil').kalinti).toBe(0); // yeşil sayfada macenta ölçülmez
  });
  it('kenar halesi: sarı-yeşil ve nane yeşil sayılır, altın sayılmaz; macentada pembe ve yarı saydam somon sayılır, turuncu sayılmaz', () => {
    expect(zeminOlcu(ikon2([160, 160, 24]), W, W, 'yesil').hale).toBeGreaterThan(0.5);
    expect(haleMi('yesil', 180, 230, 200)).toBe(true);
    expect(zeminOlcu(ikon2([255, 200, 40]), W, W, 'yesil').hale).toBe(0);
    expect(haleMi('macenta', 230, 120, 200)).toBe(true);
    expect(haleMi('macenta', 245, 175, 170, 160)).toBe(true);
    expect(haleMi('macenta', 245, 175, 170, 255)).toBe(false); // opak kenar çizgisi
    expect(haleMi('macenta', 250, 170, 90, 160)).toBe(false); // turuncu parıltı
    expect(kalintiMi('yesil', 0, 255, 0)).toBe(true);
  });
  it('eşik kusur, yarısı belirsiz', () => {
    const e = ZEMIN_KUSUR.kalinti.esik;
    expect(zeminKusurlari({ kalinti: e, hale: 0 }, 'yesil')[0]).toMatchObject({ tur: 'kalinti', kesin: true });
    expect(zeminKusurlari({ kalinti: e * 0.6, hale: 0 }, 'macenta')[0]).toMatchObject({ tur: 'kalinti', kesin: false });
    expect(zeminKusurlari({ kalinti: 0, hale: 0 }, 'yesil')).toEqual([]);
  });
});
