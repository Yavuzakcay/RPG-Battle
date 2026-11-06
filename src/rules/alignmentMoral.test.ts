/**
 * Kuyruk K52: hizalanma ↔ Moral bağı. Vicdan çatışması (±17, ≥3, ≥5), olay ve gün üst sınırları, iç huzur (uzun dinlenme
 * başına 1), Moral 1 tabanı, simetri, yeni yol (eksen başına bir kez), savrulma ×1.5, anahtarlar, olay listesi (taslak).
 */
import { describe, expect, it } from 'vitest';
import { ALIGN_EVENTS, addEvent, newAlignment, type Alignment } from './alignment';
import { alignmentLongRest, alignmentMoralOn, applyAlignAct, swingOf, type MoralCtx } from './alignmentMoral';

const Z = '2026-11-05T10:00:00.000Z';
const ctx = (moral: number, max = 6, day = '2026-11-05'): MoralCtx => ({ moral, max, day });
const at = (duzen: number, iyilik: number): Alignment => newAlignment({ duzen, iyilik }, 'otomatik');
const ev = (id: string) => ({ kind: 'olay' as const, olayId: id });
const free = (eksen: 'duzen' | 'iyilik', miktar: number) => ({ kind: 'serbest' as const, eksen, miktar, gerekce: 'x' });

describe('olay listesi (taslak "GM aracı")', () => {
  it('9 taslak olayı adı ve puanıyla; her olay tek hizalanmaEtki', () => {
    const want: Record<string, [string, number, number]> = {
      merhamet: ['Merhamet gösterdi', 0, 3], 'teslim-oldurdu': ['Teslim olanı öldürdü', -2, -5], 'soz-tuttu': ['Söz tuttu', 3, 0],
      'soz-bozdu': ['Yeminini bozdu', -5, 0], 'yasa-cigner': ['Yasayı çiğnedi (haklı gerekçeyle)', -3, 0], yardim: ['Masumu korudu', 0, 4],
      zulum: ['Zorbalık/işkence', 0, -5], hirsizlik: ['Rüşvet/hırsızlık', -3, -2], fedakarlik: ['Kendini feda etti', 0, 5],
    };
    for (const [id, [ad, d, g]] of Object.entries(want)) {
      const e = ALIGN_EVENTS.find((x) => x.id === id)!;
      expect([e.ad.tr, e.hizalanmaEtki.duzen, e.hizalanmaEtki.iyilik]).toEqual([ad, d, g]);
    }
    expect(ALIGN_EVENTS).toHaveLength(15);
  });
});

describe('anahtarlar', () => {
  it('yalnız hizalanma + moralSistemi + hizalanmaMoral birlikte açıkken', () => {
    expect(alignmentMoralOn({ hizalanma: true, moralSistemi: true, hizalanmaMoral: true })).toBe(true);
    expect(alignmentMoralOn({ hizalanma: true, moralSistemi: false, hizalanmaMoral: true })).toBe(false);
    expect(alignmentMoralOn({ hizalanma: false, moralSistemi: true, hizalanmaMoral: true })).toBe(false);
    expect(alignmentMoralOn({ hizalanma: true, moralSistemi: true })).toBe(false);
  });
  it('bağ kapalıyken (ctx yok) K51 davranışı: Moral yok, çarpan yok', () => {
    const r = applyAlignAct(at(30, 30), ev('zulum'), 'gm', Z, null);
    expect(r.delta).toBe(0);
    const plain = addEvent(at(30, 30), 'zulum', 'gm', Z, undefined);
    expect([r.alignment.duzen, r.alignment.iyilik, r.alignment.gunluk.length]).toEqual([plain.duzen, plain.iyilik, plain.gunluk.length]);
    expect(r.alignment.vicdan).toBeUndefined();
    expect(r.alignment.gunluk.at(-1)?.moral).toBeUndefined();
  });
  it('Game Master olay için Moral etkisini kapatabilir', () => {
    const r = applyAlignAct(at(30, 30), ev('zulum'), 'gm', Z, ctx(5), true);
    expect(r.delta).toBe(0);
    expect(r.alignment.iyilik).toBe(25);
  });
});

describe('vicdan çatışması', () => {
  it('|değer| ≥ 17 ve ters yön: ≥3 → −1, ≥5 → −2; |değer| < 17 ya da < 3 puan → yok', () => {
    expect(applyAlignAct(at(0, 30), ev('hirsizlik'), 'gm', Z, ctx(5)).delta).toBe(0); // İ −2 (< 3) çatışma değil; Düzen 0 (tarafsız)
    expect(applyAlignAct(at(0, 30), free('iyilik', -3), 'gm', Z, ctx(5)).delta).toBe(-1);
    expect(applyAlignAct(at(0, 30), free('iyilik', -5), 'gm', Z, ctx(5)).delta).toBe(-2);
    expect(applyAlignAct(at(0, 30), free('iyilik', -2), 'gm', Z, ctx(5)).delta).toBe(0);
    expect(applyAlignAct(at(0, 16), free('iyilik', -5), 'gm', Z, ctx(5)).delta).toBe(0);
    expect(applyAlignAct(at(0, 17), free('iyilik', -5), 'gm', Z, ctx(5)).nedenler).toContain('vicdan');
  });
  it('olay başına en çok −2 (iki eksende çatışsa da), günde en çok −3; yeni gün sayaç sıfırlanır', () => {
    expect(applyAlignAct(at(30, 30), ev('teslim-oldurdu'), 'gm', Z, ctx(6)).delta).toBe(-2); // D −2 (<3) + İ −5 → −2
    let a = at(40, 40); let m = 6;
    for (let i = 0; i < 3; i++) { const r = applyAlignAct(a, free('iyilik', -5), 'gm', Z, ctx(m)); a = r.alignment; m = r.moral; }
    expect(m).toBe(3); // −2, −1, 0 (gün sınırı 3)
    const next = applyAlignAct(a, free('iyilik', -5), 'gm', Z, ctx(m, 6, '2026-11-06'));
    expect(next.delta).toBe(-2);
  });
  it('Moral 1 tabanı: vicdan Moral\'i 1\'in altına indirmez', () => {
    expect(applyAlignAct(at(0, 30), free('iyilik', -5), 'gm', Z, ctx(2)).moral).toBe(1);
    expect(applyAlignAct(at(0, 30), free('iyilik', -5), 'gm', Z, ctx(1)).moral).toBe(1);
  });
  it('simetri: iyi biri kötülüğe, kötü biri iyiliğe döndüğünde aynı kural', () => {
    expect(applyAlignAct(at(0, 30), free('iyilik', -5), 'gm', Z, ctx(5)).delta).toBe(-2);
    expect(applyAlignAct(at(0, -30), free('iyilik', 5), 'gm', Z, ctx(5)).delta).toBe(-2);
    expect(applyAlignAct(at(30, 0), free('duzen', -3), 'gm', Z, ctx(5)).delta).toBe(-1);
    expect(applyAlignAct(at(-30, 0), free('duzen', 3), 'gm', Z, ctx(5)).delta).toBe(-1);
  });
  it('günlüğe kaynak satırı (vicdan çatışması)', () => {
    const r = applyAlignAct(at(0, 30), free('iyilik', -5), 'gm', Z, ctx(5));
    expect(r.alignment.gunluk.at(-1)?.moral).toEqual({ delta: -2, nedenler: ['vicdan'] });
  });
});

describe('iç huzur', () => {
  it('aynı yön ≥3 → +1; uzun dinlenme başına en çok bir kez; en çoğu aşmaz', () => {
    const r1 = applyAlignAct(at(0, 30), ev('fedakarlik'), 'gm', Z, ctx(3));
    expect([r1.delta, r1.nedenler]).toEqual([1, ['huzur']]);
    const r2 = applyAlignAct(r1.alignment, ev('merhamet'), 'gm', Z, ctx(4));
    expect(r2.delta).toBe(0);
    const rested = alignmentLongRest({ hizalanma: r2.alignment }).hizalanma!;
    expect(applyAlignAct(rested, ev('merhamet'), 'gm', Z, ctx(4)).delta).toBe(1);
    expect(applyAlignAct(at(0, 30), ev('fedakarlik'), 'gm', Z, ctx(6)).delta).toBe(0);
  });
});

describe('yeni yol ve savrulma', () => {
  it('etiket bir eksende eşiği aşınca tek seferlik +2 (eksen başına bir kez)', () => {
    const r = applyAlignAct(at(0, 15), free('iyilik', 3), 'gm', Z, ctx(3));
    expect(r.nedenler).toEqual(['yeniYol']);
    expect(r.delta).toBe(2);
    const back = applyAlignAct(r.alignment, free('iyilik', -10), 'gm', Z, ctx(r.moral)); // İyi → Tarafsız: aynı eksende ikinci kez yok
    expect(back.nedenler).not.toContain('yeniYol');
    const other = applyAlignAct(r.alignment, free('duzen', 10), 'gm', Z, ctx(4));
    expect(applyAlignAct(other.alignment, free('duzen', 10), 'gm', Z, ctx(4)).nedenler).toContain('yeniYol');
  });
  it('dönüşüm: kötü → tarafsız eşiği geçince yeni yol (çatışma Moral\'i 1\'de tutar)', () => {
    let a = at(0, -20); let m = 2;
    const r = applyAlignAct(a, free('iyilik', 6), 'gm', Z, ctx(m));
    a = r.alignment; m = r.moral;
    expect(r.nedenler).toEqual(['vicdan', 'yeniYol']);
    expect(m).toBe(3); // 2 → 1 (taban) → +2
  });
  it('Moral ≤ 1/3 iken olay puanı ×1.5 (yarım yukarı); > 1/3 iken ×1; azalan getiri de geçerli', () => {
    expect(swingOf({ moral: 2, max: 6 })).toBe(1.5);
    expect(swingOf({ moral: 3, max: 6 })).toBe(1);
    expect(applyAlignAct(at(0, 0), ev('zulum'), 'gm', Z, ctx(2)).alignment.iyilik).toBe(-8); // −5 × 1.5 = −7.5 → −8
    expect(applyAlignAct(at(0, 0), ev('zulum'), 'gm', Z, ctx(4)).alignment.iyilik).toBe(-5);
    let a = at(0, 0);
    for (let i = 0; i < 3; i++) a = applyAlignAct(a, ev('zulum'), 'gm', Z, ctx(2)).alignment;
    expect(a.gunluk.map((e) => e.iyilik)).toEqual([-8, -8, -5]); // 3.: yarı (−3) × 1.5 = −4.5 → −5
  });
});
