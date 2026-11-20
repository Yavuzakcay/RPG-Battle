/** İŞ 1 (jeton kesimi): yeniden kesilen/elle kontrol listesi veri bütünlüğü (görseller okunmaz, yalnız dosya adları). */
import { describe, expect, it } from 'vitest';
import kesim from '../../data/kesim-yeniden.json';
import param from '../../data/kesim-parametre.json';

const big = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.split('/').pop()?.replace('.webp', '')));
const small = new Set(Object.keys(import.meta.glob('/public/characters/kucuk/*.webp')).map((f) => f.split('/').pop()?.replace('.webp', '')));

describe('jeton kesimi (bağlı bileşen)', () => {
  it('yeniden kesilen her jeton var, kucuk kopyası var, listeler çakışmaz', () => {
    for (const n of kesim.yeniden) { expect(big.has(n), n).toBe(true); expect(small.has(n), `kucuk ${n}`).toBe(true); }
    const elle = kesim.elle.map((x) => x.split(':')[0]);
    for (const n of elle) expect(kesim.yeniden).not.toContain(n);
    expect(new Set(kesim.yeniden).size).toBe(kesim.yeniden.length);
  });
  it('parametreler veride: despill yalnız saf zemin rengine yakın, aura soyma kapalı', () => {
    expect(param.soyAdim).toBe(0);
    expect(param.saf.yakinlik).toBeLessThanOrEqual(100);
    expect(param.birlestirPx).toBeGreaterThan(0);
  });
});
