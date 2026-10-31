/**
 * Kuyruk 14 SP1: yüzey/alan ve nesne sprite'ları (`data/sprite-esleme.json`). Yalnızca `npm run sprite-ice`'ın ürettiği
 * (`data/sprite-mevcut.json`) adlar kullanılır; yoksa null ve harita eski yer tutucuyu çizer (görüntü değişmez). Varyant
 * altıgen başına sütun/satır hash'iyle deterministik. Bu modül yalnızca savaş ekranı parçasında (tembel) yüklenir.
 */
import esleme from '../../data/sprite-esleme.json';
import mevcut from '../../data/sprite-mevcut.json';
import type { Offset } from '../rules/hex';
import type { SpellZone } from '../battle/types';

export interface SpriteDraw { name: string; opacity: number; scale: number }
interface Entry { sprites: string[]; opacity?: number; scale?: number }

const HAVE = new Set<string>((mevcut as { sprites: string[] }).sprites);
const ZONES = (esleme as { zones: Record<string, Entry> }).zones;
const OBJECTS = (esleme as { objects: Record<string, Entry> }).objects;

/** Sütun/satırdan deterministik tamsayı (aynı altıgen hep aynı varyant). */
export function hexHash(h: Offset): number {
  let x = (h.col * 73856093) ^ (h.row * 19349663);
  x = Math.imul(x ^ (x >>> 13), 0x5bd1e995);
  return (x ^ (x >>> 15)) >>> 0;
}

function pick(entry: Entry | undefined, h: Offset, have: ReadonlySet<string>): SpriteDraw | null {
  const list = (entry?.sprites ?? []).filter((n) => have.has(n));
  if (!entry || !list.length) return null;
  return { name: list[hexHash(h) % list.length] as string, opacity: entry.opacity ?? 1, scale: entry.scale ?? 1 };
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

/** Eşlemedeki bütün sprite adları (test ve rapor). */
export function mappedSpriteNames(): string[] {
  return [...new Set([...Object.values(ZONES), ...Object.values(OBJECTS)].flatMap((e) => e.sprites))].sort();
}
