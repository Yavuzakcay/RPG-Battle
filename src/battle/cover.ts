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

function evaluate(state: BattleState, path: Offset[], attacker: Combatant, target: Combatant): LineOfFire {
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
      (c) => c.id !== attacker.id && c.id !== target.id && c.pos !== null && sameHex(c.pos, h) && isTargetable(c),
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
  if (!state.map || !attacker.pos || !target.pos) return { blocked: false, cover: 0 };
  const a = evaluate(state, line(attacker.pos, target.pos, 1), attacker, target);
  const b = evaluate(state, line(attacker.pos, target.pos, -1), attacker, target);
  return better(a, b);
}

/** Yükseklik kuralı için yükseklik: haritada altıgenden (0/1/2), haritasız savaşta soyut değer. */
export function heightOf(state: BattleState, c: Combatant): number {
  return state.map && c.pos ? terrainAt(state, c.pos).height : c.height;
}
