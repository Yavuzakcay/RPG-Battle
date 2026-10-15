/**
 * Harita efektleri (Adım 10c): görsel üstündeki hareketli katmanın verisi. Her varyantın
 * `effects` listesi tür, yoğunluk (0–1) ve isteğe bağlı renk taşır. Efekt kurallara dokunmaz,
 * yalnızca görünüştür. Bazı efektler belirli zeminlere bağlıdır (lav parıltısı lavda, kabarcık
 * batakta); meşale gibi görselde duran ışıklar için `points` (görsel pikseli, 1280×715) verilir.
 * Saf modül: çizim `src/ui/EffectsLayer.tsx`'te.
 */
import type { Offset } from '../rules/hex';

export const EFFECT_TYPES = [
  'rain', 'lightning', 'waveGlint', 'waterSparkle', 'fog', 'bubbles', 'fireflies', 'sparks', 'snow',
  'iceGlint', 'dust', 'lightShafts', 'leaves', 'flicker', 'crystalFlicker', 'drip', 'heatHaze', 'sandstorm', 'lavaGlow',
] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

/** Türkçe adlar (arayüz ve belgeler için). */
export const EFFECT_NAMES: Record<EffectType, string> = {
  rain: 'yağmur', lightning: 'şimşek', waveGlint: 'dalga parıltısı', waterSparkle: 'su parıltısı', fog: 'sis',
  bubbles: 'kabarcık', fireflies: 'ateşböceği', sparks: 'kıvılcım', snow: 'kar', iceGlint: 'buz parıltısı',
  dust: 'toz', lightShafts: 'ışık huzmesi', leaves: 'yaprak', flicker: 'meşale/şömine titremesi',
  crystalFlicker: 'kristal titremesi', drip: 'damlama', heatHaze: 'sıcak dalgası', sandstorm: 'kum fırtınası',
  lavaGlow: 'lav parıltısı',
};

export interface MapEffect {
  type: EffectType;
  /** 0–1: parçacık sayısı ve parlaklık. */
  intensity: number;
  /** "#rrggbb"; verilmezse türün varsayılanı. */
  color?: string;
  /** Görselde sabit ışık noktaları (piksel, 1280×715): meşale, fener, şömine. */
  points?: number[][];
}

/** Türün varsayılan rengi. */
export const DEFAULT_COLOR: Record<EffectType, string> = {
  rain: '#b4c8ff', lightning: '#f4f6ff', waveGlint: '#e8fbff', waterSparkle: '#ffffff', fog: '#c8d0cc',
  bubbles: '#a8c890', fireflies: '#d8ff70', sparks: '#ff9a3c', snow: '#ffffff', iceGlint: '#dff6ff',
  dust: '#efe2c4', lightShafts: '#fff2b8', leaves: '#7fae3c', flicker: '#ffa040', crystalFlicker: '#8fe8ff',
  drip: '#b8d8f0', heatHaze: '#fff4d8', sandstorm: '#f4ce96', lavaGlow: '#ff6a1e',
};

/** Zemine bağlı efektlerin harfleri; listede olmayan tür bütün görsele yayılır. */
const TILE_ANCHORS: Partial<Record<EffectType, string>> = {
  waveGlint: 'w',
  waterSparkle: 'wn',
  bubbles: 'bn',
  fireflies: 'bga',
  sparks: '~f',
  iceGlint: 'iq',
  flicker: 'f',
  crystalFlicker: 'e',
  drip: 've',
  lavaGlow: '~',
};

/** Efektin bağlı olduğu altıgenler (zemine bağlı değilse boş). */
export function effectHexes(type: EffectType, tiles: readonly string[]): Offset[] {
  const chars = TILE_ANCHORS[type];
  if (!chars) return [];
  const out: Offset[] = [];
  tiles.forEach((row, r) => [...row].forEach((ch, col) => { if (chars.includes(ch)) out.push({ col, row: r }); }));
  return out;
}

/** Görsel genişliği: aynalı haritada noktalar yatay çevrilir. */
export const IMAGE_W = 1280;
export const IMAGE_H = 715;

export function effectPoints(e: MapEffect, mirrored: boolean): Array<{ x: number; y: number }> {
  return (e.points ?? []).map(([x = 0, y = 0]) => ({ x: mirrored ? IMAGE_W - x : x, y }));
}

/** JSON'daki efekt listesinin hataları (boşsa geçerli). */
export function effectErrors(raw: unknown, where: string): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return [`${where}: effects bir liste olmalı`];
  const errors: string[] = [];
  raw.forEach((e: unknown, i) => {
    const at = `${where} efekt ${i + 1}`;
    if (typeof e !== 'object' || e === null) { errors.push(`${at}: nesne olmalı`); return; }
    const x = e as Record<string, unknown>;
    if (!(EFFECT_TYPES as readonly string[]).includes(String(x.type))) errors.push(`${at}: bilinmeyen tür "${String(x.type)}"`);
    if (typeof x.intensity !== 'number' || x.intensity < 0 || x.intensity > 1) errors.push(`${at}: yoğunluk 0–1 arası sayı olmalı`);
    if (x.color !== undefined && !/^#[0-9a-f]{6}$/i.test(String(x.color))) errors.push(`${at}: renk "#rrggbb" olmalı`);
    if (x.points !== undefined) {
      const ok = Array.isArray(x.points) && x.points.every((p) => Array.isArray(p) && p.length === 2
        && typeof p[0] === 'number' && typeof p[1] === 'number' && p[0] >= 0 && p[0] <= IMAGE_W && p[1] >= 0 && p[1] <= IMAGE_H);
      if (!ok) errors.push(`${at}: noktalar görsel içinde [x, y] çiftleri olmalı`);
    }
  });
  return errors;
}
