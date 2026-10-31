/**
 * Kuyruk 14 SP1, Kuyruk 15 K15C: yüzey/alan ve nesne sprite'ları (`data/sprite-esleme.json`). Yalnızca `npm run
 * sprite-ice`'ın ürettiği (`data/sprite-mevcut.json`) adlar kullanılır; yoksa null ve harita eski yer tutucuyu çizer.
 * Varyant (ağırlıklı), döndürme ve aynalama altıgen başına sütun/satır hash'iyle deterministik. Yalnızca görsel:
 * motor, replay ve kayıt bunlara bakmaz. Bu modül yalnızca savaş ekranı parçasında (tembel) yüklenir.
 */
import esleme from '../../data/sprite-esleme.json';
import mevcut from '../../data/sprite-mevcut.json';
import type { Offset } from '../rules/hex';
import type { SpellZone } from '../battle/types';

export type SpriteAnim = 'drift' | 'flicker' | 'shimmer' | 'rise' | 'none';
export interface SpriteDraw { name: string; opacity: number; scale: number }
type Variant = string | { name: string; agirlik?: number; anim?: SpriteAnim };
interface Entry { sprites: Variant[]; opacity?: number; scale?: number; renk?: string; soft?: boolean; anim?: SpriteAnim; ms?: number }

const HAVE = new Set<string>((mevcut as { sprites: string[] }).sprites);
const ZONES = (esleme as unknown as { zones: Record<string, Entry> }).zones;
const OBJECTS = (esleme as unknown as { objects: Record<string, Entry> }).objects;
const EFFECTS = (esleme as unknown as { effects: Record<string, Entry> }).effects;

/** Sütun/satırdan deterministik tamsayı (aynı altıgen hep aynı varyant). */
export function hexHash(h: Offset, salt = 0): number {
  let x = (h.col * 73856093) ^ (h.row * 19349663) ^ Math.imul(salt + 1, 83492791);
  x = Math.imul(x ^ (x >>> 13), 0x5bd1e995);
  return (x ^ (x >>> 15)) >>> 0;
}

/** Eksiz ad ile `-1` aynı varyant: eşlemedeki adı mevcut dosya adına çevirir (yoksa null). */
export function resolveSprite(name: string, have: ReadonlySet<string> = HAVE): string | null {
  if (have.has(name)) return name;
  const base = name.replace(/-1$/, '');
  if (base !== name && have.has(base)) return base;
  if (base === name && have.has(`${name}-1`)) return `${name}-1`;
  return null;
}

/** Mevcut varyantlar ve ağırlıkları (ağırlık varsayılan 1; 0 ya da negatif olan atlanır). */
export function variantsOf(entry: Entry | undefined, have: ReadonlySet<string> = HAVE): Array<{ name: string; weight: number; anim?: SpriteAnim }> {
  return (entry?.sprites ?? []).flatMap((v) => {
    const raw = typeof v === 'string' ? v : v.name;
    const weight = typeof v === 'string' ? 1 : v.agirlik ?? 1;
    const name = resolveSprite(raw, have);
    const anim = typeof v === 'string' ? undefined : v.anim;
    return name && weight > 0 ? [{ name, weight, ...(anim ? { anim } : {}) }] : [];
  });
}

/** Ağırlıklı deterministik seçim: hash [0,1) aralığına çevrilir, birikimli ağırlıkta aranır. */
export function pickWeighted(list: ReadonlyArray<{ name: string; weight: number }>, hash: number): string | null {
  const total = list.reduce((n, v) => n + v.weight, 0);
  if (!list.length || total <= 0) return null;
  let u = (hash % 100000) / 100000 * total;
  for (const v of list) { if (u < v.weight) return v.name; u -= v.weight; }
  return list[list.length - 1]!.name;
}

function pick(entry: Entry | undefined, h: Offset, have: ReadonlySet<string>): SpriteDraw | null {
  const name = pickWeighted(variantsOf(entry, have), hexHash(h));
  return entry && name ? { name, opacity: entry.opacity ?? 1, scale: entry.scale ?? 1 } : null;
}

/** Alanın eşleme anahtarı: yüzey `surface:<tür>`, büyü alanı `spells:<kimlik>`. */
export const zoneKey = (z: Pick<SpellZone, 'surface' | 'spellId'>): string =>
  (z.surface ? `surface:${z.surface}` : z.spellId.startsWith('spells:') ? z.spellId : `spells:${z.spellId}`);

export function zoneSprite(z: Pick<SpellZone, 'surface' | 'spellId'>, h: Offset, have: ReadonlySet<string> = HAVE): SpriteDraw | null {
  return pick(ZONES[zoneKey(z)], h, have);
}

export function objectSprite(kind: string, h: Offset, have: ReadonlySet<string> = HAVE): SpriteDraw | null {
  return pick(OBJECTS[kind], h, have);
}

/** Alan çizimi: taban rengi, yumuşak taban, animasyon türü ve altıgen başına yama (varyant, dönüş, ayna, faz). */
export interface ZonePatch { hex: Offset; name: string; rot: number; flip: boolean; phase: number; cycle: string[]; anim: SpriteAnim }
export interface ZoneLook { color: string; soft: boolean; opacity: number; scale: number; anim: SpriteAnim; patches: ZonePatch[] }

/** Dönüş 60°'nin katı (altıgen simetrisi); ayna, faz (0–1) ve alev döngüsünün başlangıcı ayrı tuzlu hash'ten. */
export function zoneLook(z: Pick<SpellZone, 'surface' | 'spellId'>, hexes: readonly Offset[], have: ReadonlySet<string> = HAVE): ZoneLook | null {
  const entry = ZONES[zoneKey(z)];
  const list = variantsOf(entry, have);
  if (!entry || !list.length) return null;
  const anim = entry.anim ?? 'none';
  const patches = hexes.map((hex) => {
    const name = pickWeighted(list, hexHash(hex)) as string;
    const start = list.findIndex((v) => v.name === name);
    const own = list[start]?.anim ?? anim;
    const cycle = own === 'flicker' && list.length > 1 ? list.map((_, i) => list[(start + i) % list.length]!.name) : [name];
    // Alev ve yükselen parçacık dik durur (yalnızca yatay ayna); diğerleri 60°'nin katı döner.
    const rot = own === 'flicker' || own === 'rise' ? 0 : (hexHash(hex, 1) % 6) * 60;
    return { hex, name, rot, flip: hexHash(hex, 2) % 2 === 1, phase: (hexHash(hex, 3) % 1000) / 1000, cycle, anim: own };
  });
  return { color: entry.renk ?? '#99aabb', soft: !!entry.soft, opacity: entry.opacity ?? 1, scale: entry.scale ?? 1.5, anim, patches };
}

/** Tek seferlik patlama sprite'ı (yoksa null: yalnızca mevcut yer tutucu efektler). */
export function burstSprite(have: ReadonlySet<string> = HAVE): (SpriteDraw & { ms: number }) | null {
  const e = EFFECTS.patlama;
  const name = pickWeighted(variantsOf(e, have), 0);
  return e && name ? { name, opacity: e.opacity ?? 1, scale: e.scale ?? 1.6, ms: e.ms ?? 400 } : null;
}

/** Eşlemedeki bütün sprite adları (test ve rapor). */
export function mappedSpriteNames(): string[] {
  return [...new Set([...Object.values(ZONES), ...Object.values(OBJECTS), ...Object.values(EFFECTS)]
    .flatMap((e) => e.sprites.map((v) => (typeof v === 'string' ? v : v.name))))].sort();
}
