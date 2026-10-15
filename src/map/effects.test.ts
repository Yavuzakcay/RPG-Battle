import { describe, it, expect } from 'vitest';
import { maps, RAW_MAPS, validateMap } from './maps';
import { EFFECT_TYPES, effectErrors, effectHexes, effectPoints } from './effects';

const types = (mapId: string, variantId: string) =>
  maps.find((m) => m.id === mapId)?.variants.find((v) => v.id === variantId)?.effects?.map((e) => e.type) ?? [];

describe('harita efektleri verisi', () => {
  it('19 efekt türü; bütün varyantların efektleri geçerli', () => {
    expect(EFFECT_TYPES).toHaveLength(19);
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
    expect(types('orman', 'orman')).toEqual(['lightShafts', 'leaves']);
    expect(types('taverna', 'ic-mekan')).toEqual(['flicker', 'flicker', 'dust']);
    expect(types('volkan', 'varsayilan')).toEqual(['lavaGlow', 'sparks', 'heatHaze']);
    expect(types('col', 'aksam')).toEqual(['sandstorm', 'dust']);
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
