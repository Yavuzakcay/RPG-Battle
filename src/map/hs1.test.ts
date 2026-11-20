/** HS1 (harita temizliği): silinen haritaların eski kayıt güvenliği. */
import { describe, expect, it } from 'vitest';
import { getMap, maps, resolveMapChoice } from './maps';

describe('HS1: silinen haritalar eski kayıtta çökmez', () => {
  it('katalogda yok: klasik Kale, Ortamlar Diyarı, Dungeon düz Merdiven varyantı', () => {
    expect(maps.some((m) => m.id === 'kale' || m.id === 'ortamlar-diyari')).toBe(false);
    expect(getMap('dungeon').variants.map((v) => v.id)).toEqual(['mesale', 'merdiven-yuruyen', 'hazine']);
  });
  it('eski kimlikler en yakın mevcut haritaya eşlenir (kale, ortamlar-diyari → Kale ve avlu)', () => {
    expect(getMap('kale').id).toBe('kale-avlu');
    expect(getMap('ortamlar-diyari').id).toBe('kale-avlu');
    expect(resolveMapChoice('kale', 'gece')).toEqual({ id: 'kale-avlu', variantId: 'gunduz' });
    expect(resolveMapChoice('ortamlar-diyari', 'gunduz').id).toBe('kale-avlu');
  });
  it('Dungeon eski Merdiven varyantı Yürüyen merdiven olur', () => {
    expect(resolveMapChoice('dungeon', 'merdiven').variantId).toBe('merdiven-yuruyen');
    expect(getMap('dungeon', { variantId: 'merdiven' }).variantId).toBe('merdiven-yuruyen');
  });
});
