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
import { interposeCover } from './arcaneHand';
import type { Cover } from '../map/terrain';
import { distance, line, sameHex, type Offset } from '../rules/hex';
import { bodyOf, covers, isMultiHex } from './body';
import { isTargetable } from './common';
import { terrainAt } from './movement';
import { combatHeightAt, heightSightBlock, ledgeCover } from './heights';
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
function evaluate(state: BattleState, path: Offset[], ignore: string[], target: Combatant, end: Offset | null = target.pos): LineOfFire {
  let cover: Cover = 0;
  let coverBy: string | undefined;
  const take = (c: Cover, by: string) => {
    if (c > cover) {
      cover = c;
      coverBy = by;
    }
  };
  // Kuyruk 26: yükseklik katmanı: iki uçtan da yüksek ara altıgen görüşü keser (zemin kuralıyla birlikte; sıkı olan geçer).
  const ridge = heightSightBlock(state, path);
  if (ridge) return { blocked: true, blockedBy: ridge, cover: 0 };
  for (const h of path.slice(1, -1)) {
    const t = terrainAt(state, h);
    if (t.blocksSight || t.outOfBounds) return { blocked: true, blockedBy: t.name, cover: 0 };
    take(t.cover, t.name);
    const between = Object.values(state.combatants).find(
      (c) => !ignore.includes(c.id) && c.id !== target.id && c.pos !== null && covers(state, c, h) && isTargetable(c),
    );
    if (between) take(2, between.name);
  }
  if (end) {
    const own = terrainAt(state, end);
    take(own.cover, own.name);
  }
  // Kuyruk 26: hedef kaya basamağının arkasında (önündeki kenar ondan yüksek, saldırandan yüksek değil): yarım siper.
  if (ledgeCover(state, path)) take(2, 'kaya basamağı');
  return { blocked: false, cover, ...(coverBy ? { coverBy } : {}) };
}

/** Saldıran açısından en iyisi: önce görüş açık olan, sonra siperi az olan. */
function better(a: LineOfFire, b: LineOfFire): LineOfFire {
  if (a.blocked !== b.blocked) return a.blocked ? b : a;
  return b.cover < a.cover ? b : a;
}

/**
 * Kuyruk 19 (11–20): yarım siper veren etkiler (Smite of Protection: `halfCover`; Nature's Sanctuary: alanın
 * tarafındaki yaratık). Açık görüşte siper en az 2 olur.
 */
function grantedHalfCover(state: BattleState, target: Combatant): boolean {
  if (target.effects?.some((e) => e.halfCover)) return true;
  return !!target.pos && !!state.map?.zones?.some((z) => z.spec?.coverFor === 'allies' && z.side === target.side
    && z.hexes.some((h) => sameHex(h, target.pos as Offset)));
}
const withGranted = (state: BattleState, target: Combatant, r: LineOfFire): LineOfFire =>
  !r.blocked && r.cover < 2 && grantedHalfCover(state, target) ? { ...r, cover: 2 } : r;

export function lineOfFire(state: BattleState, attacker: Combatant, target: Combatant): LineOfFire {
  return withGranted(state, target, lineOfFireRaw(state, attacker, target));
}

function lineOfFireRaw(state: BattleState, attacker: Combatant, target: Combatant): LineOfFire {
  if (!state.map || !attacker.pos) return { blocked: false, cover: 0 };
  if (!isMultiHex(state, attacker) && !isMultiHex(state, target)) return coverFrom(state, attacker.pos, target, [attacker.id]);
  // Kuyruk 43: çok altıgenli gövdelerde saldıran için en iyi altıgen çifti (her gövdeden karşı tarafa en yakın 7 altıgen).
  const near = (body: Offset[], other: Offset) => [...body].sort((x, y) => distance(x, other) - distance(y, other)).slice(0, 7);
  let best: LineOfFire | null = null;
  for (const a of near(bodyOf(state, attacker), target.pos as Offset)) {
    for (const t of near(bodyOf(state, target), attacker.pos)) {
      const r = coverBetween(state, a, t, target, [attacker.id]);
      best = best ? better(best, r) : r;
      if (!best.blocked && best.cover === 0) return best;
    }
  }
  return best ?? { blocked: false, cover: 0 };
}

/** Bir altıgenden hedefin bir altıgenine görüş ve siper (iki yan denenir). */
function coverBetween(state: BattleState, origin: Offset, to: Offset, target: Combatant, ignore: string[]): LineOfFire {
  if (sameHex(origin, to)) return { blocked: false, cover: 0 };
  return better(evaluate(state, line(origin, to, 1), ignore, target, to), evaluate(state, line(origin, to, -1), ignore, target, to));
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
  const best = better(a, b);
  // Kuyruk 19: Interposing Hand: elin altıgeninden gelen ya da içinden geçen etkiye yarım siper.
  return withGranted(state, target, !best.blocked && best.cover < 2 && interposeCover(state, origin, target) ? { ...best, cover: 2 } : best);
}

/** İki altıgen arasında (uçlar hariç) görüşü kesen zeminin adı; açıksa null. İki yan da denenir. */
export function sightBlockedBetween(state: BattleState, from: Offset, to: Offset): string | null {
  const blockedOn = (path: Offset[]) => {
    const ridge = heightSightBlock(state, path);
    if (ridge) return ridge;
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

/**
 * Yükseklik kuralı için yükseklik: haritada altıgenden (zemin 0/1/2; Kuyruk 26: yükseklik katmanlı haritada ve yüksek zemin
 * anahtarı açıkken katman seviyesi), haritasız savaşta soyut değer.
 */
export function heightOf(state: BattleState, c: Combatant): number {
  if (state.map && c.pos) return state.map.heights ? combatHeightAt(state, c.pos) : terrainAt(state, c.pos).height;
  return c.height;
}
