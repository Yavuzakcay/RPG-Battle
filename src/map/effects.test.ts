import { describe, it, expect } from 'vitest';
import { maps, RAW_MAPS, validateMap } from './maps';
import { EFFECT_TYPES, effectErrors, effectHexes, effectPoints, particleCount, type MapEffect } from './effects';

const types = (mapId: string, variantId: string) =>
  maps.find((m) => m.id === mapId)?.variants.find((v) => v.id === variantId)?.effects?.map((e) => e.type) ?? [];

describe('harita efektleri verisi', () => {
  it('23 efekt türü; bütün varyantların efektleri geçerli', () => {
    expect(EFFECT_TYPES).toHaveLength(23);
    for (const raw of RAW_MAPS) expect(validateMap(raw)).toEqual([]);
    for (const m of maps) for (const v of m.variants) expect(Array.isArray(v.effects)).toBe(true);
  });
  it('istenen eşleşmeler (GOREV 10c)', () => {
    expect(types('ada', 'firtina')).toEqual(['rain', 'lightning', 'waveGlint']);
    expect(types('gemi', 'firtina')).toEqual(['rain', 'lightning', 'waveGlint']);
    expect(types('ada', 'gunes')).toEqual(['waterSparkle']);
    expect(types('bataklik', 'bataklik')).toEqual(['fog', 'bubbles', 'fireflies']);
    expect(types('magara', 'magara')).toEqual(['crystalFlicker', 'drip']);
    expect(types('dungeon', 'mesale')).toEqual(['flicker', 'dust']);
    expect(types('kale', 'gece')).toEqual(['flicker']);
    expect(types('sehir-meydani', 'gece')).toEqual(['flicker']);
    expect(types('dag', 'kis')).toEqual(['snow', 'iceGlint']);
    expect(types('dag', 'yaz')).toEqual(['fog']);
    // Görev M: Orman gündüz yaprak, ışık huzmesi, kuş gölgesi; gece yer sisi, soluk toz, tek yaprak (ışık/yanıp sönme yok).
    expect(types('orman', 'orman')).toEqual(['lightShafts', 'fallingLeaves', 'birdShadow']);
    expect(types('orman', 'gece')).toEqual(['groundFog', 'motes', 'fallingLeaves']);
    expect(types('taverna', 'ic-mekan')).toEqual(['flicker', 'flicker', 'dust']);
    expect(types('volkan', 'normal')).toEqual(['lavaGlow', 'sparks', 'heatHaze']);
    expect(types('col', 'aksam')).toEqual(['sandstorm', 'dust']);
  });
  it('Orman gecesinde parlak ya da yanıp sönen efekt yok; sis ve noktalar soluk', () => {
    const night = maps.find((m) => m.id === 'orman')?.variants.find((v) => v.id === 'gece')?.effects ?? [];
    expect(night.some((e) => ['fireflies', 'flicker', 'lightShafts', 'lightning', 'sparks', 'crystalFlicker'].includes(e.type))).toBe(false);
    for (const e of night) expect(e.params?.alpha ?? 1).toBeLessThanOrEqual(0.55);
    const fog = night.find((e) => e.type === 'groundFog');
    expect(fog?.params?.band?.[0]).toBeGreaterThanOrEqual(0.5); // yer seviyesi
    expect(night.find((e) => e.type === 'fallingLeaves')?.params?.count).toBe(1);
  });
  it('parametreler ve yoğunluk ayarı: sayı yoğunlukla ölçeklenir', () => {
    const leaves: MapEffect = { type: 'fallingLeaves', intensity: 0.5, params: { count: 20 } };
    expect([particleCount(10, leaves, 'low'), particleCount(10, leaves, 'medium'), particleCount(10, leaves, 'high')]).toEqual([5, 10, 15]);
    expect(particleCount(10, { type: 'motes', intensity: 1 }, 'medium')).toBe(10);
    expect(particleCount(10, { type: 'motes', intensity: 0.01 }, 'low', 1)).toBe(1);
    expect(effectErrors([{ type: 'fallingLeaves', intensity: 0.5, speed: 9, params: { count: 999, shapes: 7, band: [0.9, 0.2], everySec: [0, 3], alpha: 2 } }], 'x')).toEqual([
      'x efekt 1: hız 0–5 arası sayı olmalı', 'x efekt 1: count 0–400 olmalı', 'x efekt 1: shapes 1–4 olmalı', 'x efekt 1: alpha 0–1 olmalı',
      'x efekt 1: everySec [en az, en çok] olmalı', 'x efekt 1: band [en az, en çok] olmalı',
    ]);
  });
  it('doğrulama: bilinmeyen tür, yoğunluk, renk ve nokta', () => {
    expect(effectErrors([{ type: 'confetti', intensity: 2, color: 'red', points: [[2000, 5]] }], 'x')).toEqual([
      'x efekt 1: bilinmeyen tür "confetti"',
      'x efekt 1: yoğunluk 0–1 arası sayı olmalı',
      'x efekt 1: renk "#rrggbb" olmalı',
      'x efekt 1: noktalar görsel içinde [x, y] çiftleri olmalı',
    ]);
    expect(effectErrors(undefined, 'x')).toEqual([]);
  });
  it('zemine bağlı efekt altıgenleri; aynalı haritada noktalar çevrilir', () => {
    const tiles = ['~..', '.f.', '..w'];
    expect(effectHexes('lavaGlow', tiles)).toEqual([{ col: 0, row: 0 }]);
    expect(effectHexes('sparks', tiles)).toEqual([{ col: 0, row: 0 }, { col: 1, row: 1 }]);
    expect(effectHexes('rain', tiles)).toEqual([]);
    expect(effectPoints({ type: 'flicker', intensity: 1, points: [[100, 50]] }, true)).toEqual([{ x: 1180, y: 50 }]);
  });
});
