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
import type { Cover, TerrainType } from '../map/terrain';
import { distance, line, sameHex, type Offset } from '../rules/hex';
import { bodyOf, covers, isMultiHex, isMultiHex53 } from './body';
import { isTargetable } from './common';
import { solidWallAt, terrainAt } from './movement';
import { combatHeightAt, heightSightBlock, ledgeCover } from './heights';
import { ALT, altitudeOf, bodyHeightFt, ceilingFt, eyeFt } from './altitude';
import { objectAt, OBJECTS } from './objectData';
import { solidBarrierAt } from './barriers';
import { ruleVersion } from './ruleVersion';
import { spells } from '../data';
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
  /** Kuyruk K68c (sürüm 52): hattın üstünden geçtiği (görüşü kesmeyen) engelin adı. */
  over?: string;
}

// --- Kuyruk K68c (kural sürümü 52): görüş hattında irtifa -------------------------------------------------------------

/** Hattın iki ucunun yüksekliği (ft): yaratıkta göz (irtifa + boyun yarısı), noktada 0 (zemin). */
interface Ends { a: number; b: number }
/** Test için: irtifalı yola kaç kez girildi (iki uç zemindeyken hiç girilmemeli). */
export const losStats = { altPath: 0 };

/**
 * Uçların yüksekliği; hızlı yol (null: bugünkü iki boyutlu kod aynen) sürüm < 52'de ya da iki ucun irtifası da tam 0
 * iken. Eksi irtifa (yarık) zeminde sayılmaz. `a`/`b`: uçtaki yaratık (yoksa zemindeki nokta).
 */
function endsOf(state: BattleState, a: Combatant | null | undefined, b: Combatant | null | undefined): Ends | null {
  const aa = a?.altitudeFt ?? 0;
  const bb = b?.altitudeFt ?? 0;
  if (aa === 0 && bb === 0) return null;
  if (ruleVersion(state) < 52) return null;
  return { a: a ? eyeFt(a) : 0, b: b ? eyeFt(b) : 0 };
}

let panelFt: number | null = null;
/** Wall of Stone/Ice paneli (ft): Earthquake yapı verisindeki panel yüksekliği (K66b/K68a), yoksa 10. */
const panelTopFt = (): number => (panelFt ??= spells.find((x) => x.id === 'earthquake')?.mechanics.k66?.zone?.structures?.heightsFt.panel ?? 10);

/**
 * Altıgendeki engelin tepesi (ft). Veri: harita duvarı (`s`) ve duvardaki kapalı kapı (`O`) açık alanda `irtifa.wallFt`
 * (20), tavanlı haritada aşılamaz (tavana dek); nesnede `yukseklikFt` (kapı 10, kale kapısı 15, çadır 10, çatlak duvar 10); Wall of
 * Stone/Ice paneli 10. Verisi olmayan (ağaç, dış kayalık, geçici engel, heykel gözü, donmuş şelale, sütun…) sonsuz:
 * bugünkü gibi tam engel.
 */
export function obstacleTopFt(state: BattleState, h: Offset, t: TerrainType = terrainAt(state, h)): number {
  if (t.outOfBounds) return Infinity;
  if (state.map?.zones?.length) {
    if (solidWallAt(state, h)) return panelTopFt();
    if (solidBarrierAt(state, h)) return Infinity;
  }
  const obj = state.map?.objects?.length ? objectAt(state, h) : undefined;
  if (obj) return obj.yukseklikFt ?? OBJECTS[obj.kind]?.yukseklikFt ?? Infinity;
  const ch = state.map?.tiles[h.row]?.[h.col];
  // Tavanlı haritada duvar tavana dek: hat tavanın üstüne çıkamadığından aşılamaz.
  return (ch === 's' || ch === 'O') && ceilingFt(state) === null ? ALT.wallFt : Infinity;
}

/** İrtifalı değerlendirme: hattın altıgendeki yüksekliği engelin tepesinden büyükse engel görüşü kesmez, siper vermez. */
function evaluateAlt(state: BattleState, path: Offset[], ignore: string[], target: Combatant, end: Offset | null, ends: Ends): LineOfFire {
  losStats.altPath++;
  let cover: Cover = 0;
  let coverBy: string | undefined;
  let over: string | undefined;
  const take = (c: Cover, by: string) => { if (c > cover) { cover = c; coverBy = by; } };
  const ridge = heightSightBlock(state, path);
  if (ridge) return { blocked: true, blockedBy: ridge, cover: 0 };
  const n = path.length - 1;
  for (let i = 1; i < n; i++) {
    const h = path[i] as Offset;
    const lh = ends.a + ((ends.b - ends.a) * i) / n;
    const t = terrainAt(state, h);
    if (t.blocksSight || t.outOfBounds || t.cover) {
      const above = lh > obstacleTopFt(state, h, t);
      if (!above) {
        if (t.blocksSight || t.outOfBounds) return { blocked: true, blockedBy: t.name, cover: 0 };
        take(t.cover, t.name);
      } else if (t.blocksSight && !over) over = t.name;
    }
    // Araya giren yaratık yalnız hat onun boyu içinden geçiyorsa yarım siper.
    const between = Object.values(state.combatants).find(
      (c) => !ignore.includes(c.id) && c.id !== target.id && c.pos !== null && covers(state, c, h) && isTargetable(c)
        && lh >= altitudeOf(c) && lh <= altitudeOf(c) + bodyHeightFt(c),
    );
    if (between) take(2, between.name);
  }
  if (end) {
    const own = terrainAt(state, end);
    if (own.cover && !(altitudeOf(target) > obstacleTopFt(state, end, own))) take(own.cover, own.name);
  }
  if (ledgeCover(state, path)) take(2, 'kaya basamağı');
  return { blocked: false, cover, ...(coverBy ? { coverBy } : {}), ...(over ? { over } : {}) };
}

const COVER_NAME: Record<Cover, string> = { 0: '', 2: 'yarım siper', 5: '3/4 siper' };
export const coverName = (c: Cover): string => COVER_NAME[c];

/** `path` boyunca (uçlar hariç) görüş ve siper; `ignore` listesindekiler araya giren yaratık sayılmaz. */
function evaluate(state: BattleState, path: Offset[], ignore: string[], target: Combatant, end: Offset | null = target.pos, ends: Ends | null = null): LineOfFire {
  if (ends) return evaluateAlt(state, path, ignore, target, end, ends);
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
  if (!isMultiHex(state, attacker) && !isMultiHex(state, target)) return coverFrom(state, attacker.pos, target, [attacker.id], attacker);
  const ends = endsOf(state, attacker, target);
  // Kuyruk 43: çok altıgenli gövdelerde saldıran için en iyi altıgen çifti (her gövdeden karşı tarafa en yakın 7 altıgen).
  const near = (body: Offset[], other: Offset) => [...body].sort((x, y) => distance(x, other) - distance(y, other)).slice(0, 7);
  let best: LineOfFire | null = null;
  for (const a of near(bodyOf(state, attacker), target.pos as Offset)) {
    for (const t of near(bodyOf(state, target), attacker.pos)) {
      const r = coverBetween(state, a, t, target, [attacker.id], ends);
      best = best ? better(best, r) : r;
      if (!best.blocked && best.cover === 0) return best;
    }
  }
  return best ?? { blocked: false, cover: 0 };
}

/** Bir altıgenden hedefin bir altıgenine görüş ve siper (iki yan denenir). */
function coverBetween(state: BattleState, origin: Offset, to: Offset, target: Combatant, ignore: string[], ends: Ends | null): LineOfFire {
  if (sameHex(origin, to)) return { blocked: false, cover: 0 };
  return better(evaluate(state, line(origin, to, 1), ignore, target, to, ends), evaluate(state, line(origin, to, -1), ignore, target, to, ends));
}

/**
 * Bir noktadan (alan büyüsünün patlama noktası gibi) hedefe görüş ve siper. `ignore`
 * listesindeki yaratıklar (büyücü) araya giren sayılmaz. `from`: çıkış bir yaratıksa (saldıran, koninin sahibi) onun
 * gözü; yoksa nokta zeminde (Kuyruk K68c).
 */
export function coverFrom(state: BattleState, origin: Offset, target: Combatant, ignore: string[] = [], from: Combatant | null = null): LineOfFire {
  if (!state.map || !target.pos) return { blocked: false, cover: 0 };
  if (sameHex(origin, target.pos)) return { blocked: false, cover: 0 }; // patlama hedefin altıgeninde
  const ends = endsOf(state, from, target);
  // Kuyruk K69 (sürüm 53, çok altıgen): büyük hedefe hat gövdesinin en uygun altıgenine (çıkışa en yakın 7 altıgen; SRD:
  // hedefin herhangi bir yerine görülen hat yeter). Çıkış gövdenin içindeyse siper yok.
  if (isMultiHex53(state, target)) {
    const body = bodyOf(state, target);
    if (body.some((h) => sameHex(h, origin))) return { blocked: false, cover: 0 };
    let best: LineOfFire | null = null;
    for (const h of [...body].sort((x, y) => distance(x, origin) - distance(y, origin)).slice(0, 7)) {
      const r = coverBetween(state, origin, h, target, ignore, ends);
      best = best ? better(best, r) : r;
      if (!best.blocked && best.cover === 0) break;
    }
    const b0 = best ?? { blocked: false, cover: 0 as Cover };
    return withGranted(state, target, !b0.blocked && b0.cover < 2 && interposeCover(state, origin, target) ? { ...b0, cover: 2 } : b0);
  }
  const a = evaluate(state, line(origin, target.pos, 1), ignore, target, target.pos, ends);
  const b = evaluate(state, line(origin, target.pos, -1), ignore, target, target.pos, ends);
  const best = better(a, b);
  // Kuyruk 19: Interposing Hand: elin altıgeninden gelen ya da içinden geçen etkiye yarım siper.
  return withGranted(state, target, !best.blocked && best.cover < 2 && interposeCover(state, origin, target) ? { ...best, cover: 2 } : best);
}

/**
 * İki altıgen arasında (uçlar hariç) görüşü kesen zeminin adı; açıksa null. İki yan da denenir. Kuyruk K68c: uçta yaratık
 * verilirse (`who.from`/`who.to`) onun gözünden (irtifalı yol); verilmeyen uç zemindeki nokta.
 */
export function sightBlockedBetween(state: BattleState, from: Offset, to: Offset, who: { from?: Combatant | null; to?: Combatant | null } = {}): string | null {
  const ends = endsOf(state, who.from, who.to);
  if (ends) return sightBlockedAlt(state, from, to, ends);
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

/** Kuyruk K68c: `sightBlockedBetween`'in irtifalı yolu (hat engelin tepesinin üstündeyse kesmez). */
function sightBlockedAlt(state: BattleState, from: Offset, to: Offset, ends: Ends): string | null {
  losStats.altPath++;
  const blockedOn = (path: Offset[]) => {
    const ridge = heightSightBlock(state, path);
    if (ridge) return ridge;
    const n = path.length - 1;
    for (let i = 1; i < n; i++) {
      const h = path[i] as Offset;
      const t = terrainAt(state, h);
      if (!(t.blocksSight || t.outOfBounds)) continue;
      if (ends.a + ((ends.b - ends.a) * i) / n > obstacleTopFt(state, h, t)) continue;
      return t.name;
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
