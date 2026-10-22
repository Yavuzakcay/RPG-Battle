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
  // Görev M: Orman katmanı (başka haritalara da veriyle eklenebilir).
  'fallingLeaves', 'birdShadow', 'groundFog', 'motes',
] as const;
export type EffectType = (typeof EFFECT_TYPES)[number];

/** Türkçe adlar (arayüz ve belgeler için). */
export const EFFECT_NAMES: Record<EffectType, string> = {
  rain: 'yağmur', lightning: 'şimşek', waveGlint: 'dalga parıltısı', waterSparkle: 'su parıltısı', fog: 'sis',
  bubbles: 'kabarcık', fireflies: 'ateşböceği', sparks: 'kıvılcım', snow: 'kar', iceGlint: 'buz parıltısı',
  dust: 'toz', lightShafts: 'ışık huzmesi', leaves: 'yaprak', flicker: 'meşale/şömine titremesi',
  crystalFlicker: 'kristal titremesi', drip: 'damlama', heatHaze: 'sıcak dalgası', sandstorm: 'kum fırtınası',
  lavaGlow: 'lav parıltısı', fallingLeaves: 'düşen yapraklar', birdShadow: 'kuş gölgesi', groundFog: 'yer sisi',
  motes: 'uçuşan toz/polen',
};

export interface MapEffect {
  type: EffectType;
  /** 0–1: parçacık sayısı ve parlaklık. */
  intensity: number;
  /** "#rrggbb"; verilmezse türün varsayılanı. */
  color?: string;
  /** Görselde sabit ışık noktaları (piksel, 1280×715): meşale, fener, şömine. */
  points?: number[][];
  /** Hız çarpanı (varsayılan 1): düşme, kayma ve değişim hızı. */
  speed?: number;
  /**
   * Türe göre ince ayar (Görev M): `count` parçacık sayısı (yoğunlukla çarpılmadan önce), `shapes` yaprak şekli sayısı
   * (1–4), `everySec` ara sıra olan geçişin aralığı [en az, en çok] sn (kuş gölgesi), `band` dikey bant [üst, alt]
   * (0–1, görsel yüksekliğine oranla; yer sisi), `alpha` en yüksek opaklık (0–1).
   */
  params?: EffectParams;
  /**
   * Yoğunluk ölçeği (Görev M2): `strong` kullanıcı ayarını 1× / 2× / 3,5× uygular (Orman katmanı); yoksa eski
   * 0,5× / 1× / 1,5× (çöl, volkan ve diğer haritalar değişmez).
   */
  scale?: 'strong';
}

export interface EffectParams {
  count?: number;
  shapes?: number;
  everySec?: [number, number];
  band?: [number, number];
  alpha?: number;
  /** Parçacığın piksel boyutu (tuval pikseli, 1–3; yaprak ve toz). */
  size?: number;
}

/** Kullanıcının yoğunluk ayarı (Görev M): parçacık sayısı ve opaklık çarpanı. */
export type EffectDensity = 'low' | 'medium' | 'high';
export const DENSITY_FACTOR: Record<EffectDensity, number> = { low: 0.5, medium: 1, high: 1.5 };
/** Güçlü ölçek (Görev M2, `scale: "strong"`): düşük taban değer, orta iki katı, yüksek 3,5 katı. */
export const STRONG_DENSITY_FACTOR: Record<EffectDensity, number> = { low: 1, medium: 2, high: 3.5 };
/** Ölçeklenen opaklığın üst sınırı (yer sisi, ışık huzmesi). */
export const MAX_SCALED_ALPHA = 0.4;

/** Efektin kullanıcı ayarı çarpanı (ölçeğine göre). */
export const densityFactor = (e: MapEffect, density: EffectDensity): number =>
  (e.scale === 'strong' ? STRONG_DENSITY_FACTOR : DENSITY_FACTOR)[density];

/** Efektin etkin yoğunluğu: veri yoğunluğu × kullanıcı ayarı. */
export const effectiveIntensity = (e: MapEffect, density: EffectDensity): number => e.intensity * densityFactor(e, density);

/** Ölçeklenen opaklık: `params.alpha` (yoksa `base`) × yoğunluk × ayar, en çok 0,4. */
export const scaledAlpha = (e: MapEffect, density: EffectDensity, base: number): number =>
  Math.min(MAX_SCALED_ALPHA, (e.params?.alpha ?? base) * effectiveIntensity(e, density));

/** Ara sıra olan geçişin aralığı (sn): güçlü ölçekte ayar çarpanına bölünür (yüksekte daha sık). */
export const scaledInterval = (e: MapEffect, density: EffectDensity, base: [number, number]): [number, number] => {
  const [lo, hi] = e.params?.everySec ?? base;
  const f = e.scale === 'strong' ? STRONG_DENSITY_FACTOR[density] : 1;
  return [lo / f, hi / f];
};

/** Etkin parçacık sayısı: `params.count` (yoksa türün varsayılanı) × yoğunluk, en az `min`. */
export const particleCount = (base: number, e: MapEffect, density: EffectDensity, min = 0): number =>
  Math.max(min, Math.round((e.params?.count ?? base) * effectiveIntensity(e, density)));

/** Türün varsayılan rengi. */
export const DEFAULT_COLOR: Record<EffectType, string> = {
  rain: '#b4c8ff', lightning: '#f4f6ff', waveGlint: '#e8fbff', waterSparkle: '#ffffff', fog: '#c8d0cc',
  bubbles: '#a8c890', fireflies: '#d8ff70', sparks: '#ff9a3c', snow: '#ffffff', iceGlint: '#dff6ff',
  dust: '#efe2c4', lightShafts: '#fff2b8', leaves: '#7fae3c', flicker: '#ffa040', crystalFlicker: '#8fe8ff',
  drip: '#b8d8f0', heatHaze: '#fff4d8', sandstorm: '#f4ce96', lavaGlow: '#ff6a1e',
  fallingLeaves: '#6f9a34', birdShadow: '#10180c', groundFog: '#b8c6cc', motes: '#d8dccb',
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
    if (x.scale !== undefined && x.scale !== 'strong') errors.push(`${at}: scale yalnızca "strong" olabilir`);
    if (x.speed !== undefined && (typeof x.speed !== 'number' || x.speed <= 0 || x.speed > 5)) errors.push(`${at}: hız 0–5 arası sayı olmalı`);
    if (x.params !== undefined) {
      const p = x.params as Record<string, unknown>;
      const num = (v: unknown, lo: number, hi: number) => typeof v === 'number' && v >= lo && v <= hi;
      if (typeof p !== 'object' || p === null) errors.push(`${at}: params nesne olmalı`);
      else {
        if (p.count !== undefined && !num(p.count, 0, 400)) errors.push(`${at}: count 0–400 olmalı`);
        if (p.shapes !== undefined && !num(p.shapes, 1, 4)) errors.push(`${at}: shapes 1–4 olmalı`);
        if (p.alpha !== undefined && !num(p.alpha, 0, 1)) errors.push(`${at}: alpha 0–1 olmalı`);
        if (p.size !== undefined && !num(p.size, 1, 3)) errors.push(`${at}: size 1–3 olmalı`);
        for (const k of ['everySec', 'band'] as const) {
          const v = p[k];
          if (v !== undefined && !(Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number') && (v[0] as number) <= (v[1] as number)
            && (k === 'band' ? v.every((n) => (n as number) >= 0 && (n as number) <= 1) : (v[0] as number) > 0))) errors.push(`${at}: ${k} [en az, en çok] olmalı`);
        }
      }
    }
    if (x.points !== undefined) {
      const ok = Array.isArray(x.points) && x.points.every((p) => Array.isArray(p) && p.length === 2
        && typeof p[0] === 'number' && typeof p[1] === 'number' && p[0] >= 0 && p[0] <= IMAGE_W && p[1] >= 0 && p[1] <= IMAGE_H);
      if (!ok) errors.push(`${at}: noktalar görsel içinde [x, y] çiftleri olmalı`);
    }
  });
  return errors;
}
