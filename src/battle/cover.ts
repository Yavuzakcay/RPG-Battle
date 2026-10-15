/**
 * Haritalı savaşta görüş hattı, siper ve yükseklik. Haritasız savaşta hiçbiri hesaplanmaz.
 *
 * Siper: saldıranın altıgen merkezinden hedefin altıgen merkezine çizgi çekilir; aradaki
 * altıgenlere (uçlar hariç) ve hedefin kendi altıgenine bakılır. Zemin siperi katalogdan
 * (yarım +2, 3/4 +5), aradaki her yaratık yarım siper. Siperler toplanmaz, en iyisi geçer.
 * Görüşü kesen (duvar, ağaç) ya da oyun alanı dışı (#) altıgen varsa hedef görülemez.
 * Çizgi iki altıgenin tam sınırından geçerse iki yol da denenir ve saldıran için en iyisi
 * seçilir (SRD: saldıran en elverişli köşeyi seçer).
 */
import type { Cover } from '../map/terrain';
import { line, sameHex, type Offset } from '../rules/hex';
import { isTargetable } from './common';
import { terrainAt } from './movement';
import type { BattleState, Combatant } from './types';

export interface LineOfFire {
  /** Görüş hattı kapalı: hedef görülemez, saldırılamaz. */
  blocked: boolean;
  /** Hattı kesen şeyin adı. */
  blockedBy?: string;
  /** Hedefin siperi: 0, yarım (2) veya 3/4 (5). */
  cover: Cover;
  /** Siperi verenin adı. */
  coverBy?: string;
}

const COVER_NAME: Record<Cover, string> = { 0: '', 2: 'yarım siper', 5: '3/4 siper' };
export const coverName = (c: Cover): string => COVER_NAME[c];

/** `path` boyunca (uçlar hariç) görüş ve siper; `ignore` listesindekiler araya giren yaratık sayılmaz. */
function evaluate(state: BattleState, path: Offset[], ignore: string[], target: Combatant): LineOfFire {
  let cover: Cover = 0;
  let coverBy: string | undefined;
  const take = (c: Cover, by: string) => {
    if (c > cover) {
      cover = c;
      coverBy = by;
    }
  };
  for (const h of path.slice(1, -1)) {
    const t = terrainAt(state, h);
    if (t.blocksSight || t.outOfBounds) return { blocked: true, blockedBy: t.name, cover: 0 };
    take(t.cover, t.name);
    const between = Object.values(state.combatants).find(
      (c) => !ignore.includes(c.id) && c.id !== target.id && c.pos !== null && sameHex(c.pos, h) && isTargetable(c),
    );
    if (between) take(2, between.name);
  }
  if (target.pos) {
    const own = terrainAt(state, target.pos);
    take(own.cover, own.name);
  }
  return { blocked: false, cover, ...(coverBy ? { coverBy } : {}) };
}

/** Saldıran açısından en iyisi: önce görüş açık olan, sonra siperi az olan. */
function better(a: LineOfFire, b: LineOfFire): LineOfFire {
  if (a.blocked !== b.blocked) return a.blocked ? b : a;
  return b.cover < a.cover ? b : a;
}

export function lineOfFire(state: BattleState, attacker: Combatant, target: Combatant): LineOfFire {
  if (!state.map || !attacker.pos) return { blocked: false, cover: 0 };
  return coverFrom(state, attacker.pos, target, [attacker.id]);
}

/**
 * Bir noktadan (alan büyüsünün patlama noktası gibi) hedefe görüş ve siper. `ignore`
 * listesindeki yaratıklar (büyücü) araya giren sayılmaz.
 */
export function coverFrom(state: BattleState, origin: Offset, target: Combatant, ignore: string[] = []): LineOfFire {
  if (!state.map || !target.pos) return { blocked: false, cover: 0 };
  if (sameHex(origin, target.pos)) return { blocked: false, cover: 0 }; // patlama hedefin altıgeninde
  const a = evaluate(state, line(origin, target.pos, 1), ignore, target);
  const b = evaluate(state, line(origin, target.pos, -1), ignore, target);
  return better(a, b);
}

/** İki altıgen arasında (uçlar hariç) görüşü kesen zeminin adı; açıksa null. İki yan da denenir. */
export function sightBlockedBetween(state: BattleState, from: Offset, to: Offset): string | null {
  const blockedOn = (path: Offset[]) => {
    for (const h of path.slice(1, -1)) {
      const t = terrainAt(state, h);
      if (t.blocksSight || t.outOfBounds) return t.name;
    }
    return null;
  };
  const a = blockedOn(line(from, to, 1));
  const b = blockedOn(line(from, to, -1));
  return a !== null && b !== null ? a : null;
}

/** Yükseklik kuralı için yükseklik: haritada altıgenden (0/1/2), haritasız savaşta soyut değer. */
export function heightOf(state: BattleState, c: Combatant): number {
  return state.map && c.pos ? terrainAt(state, c.pos).height : c.height;
}
