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
import { combatHeightAt, heightAt, heightCombatRule, heightSightBlock, heightSightRule, highGroundK8, k72On, katmanOn, layerActive, ledgeCover } from './heights';
import { ALT, altitudeOf, bodyHeightFt, ceilingFt, eyeFt } from './altitude';
import { objectAt, OBJECTS } from './objectData';
import { solidBarrierAt } from './barriers';
import { ruleVersion } from './ruleVersion';
import { dikeyOn, engelEzme, harfFt, hasHexCeilings, zeminFt } from './vertical';
import { spells } from '../data';
import s2rules from '../../data/s2-kurallar.json';
import dikeyData from '../../data/dikey.json';
import { standAlt, standingOn } from './stand';
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

/**
 * Hattın iki ucunun yüksekliği (ft): yaratıkta göz (irtifa + boyun yarısı), noktada 0 (zemin). Kuyruk K71d (sürüm 59+): `ground`
 * iki uç yerde (irtifa 0) ve katmanlı harita: yol başına karar (aynı zemin, yolda yüksek altıgen yoksa 2B hızlı yol; değilse
 * K10 çekirdeği). `feetA`/`feetB`: uçların ayak yüksekliği (irtifa; kenar siperi göz–ayak hattıyla).
 */
interface Ends { a: number; b: number; ground?: true; feetB?: number }
/**
 * Test için: irtifalı yola kaç kez girildi (iki uç zemindeyken hiç girilmemeli); Kuyruk K71d: `groundFast` katmanlı haritada iki
 * uç yerdeyken hızlı yola (aynı zemin, düz yol) kaç kez dönüldü.
 */
export const losStats = { altPath: 0, groundFast: 0 };

/**
 * Uçların yüksekliği; hızlı yol (null: bugünkü iki boyutlu kod aynen) sürüm < 52'de ya da iki ucun irtifası da tam 0
 * iken. Eksi irtifa (yarık) zeminde sayılmaz. `a`/`b`: uçtaki yaratık (yoksa zemindeki nokta).
 * Kuyruk K71d (sürüm 59+, K10, tepedeki okçu): katmanlı haritada (`heightSight` açık) iki uç yerdeyken de `ground` uçları.
 */
function endsOf(state: BattleState, a: Combatant | null | undefined, b: Combatant | null | undefined, aEyeFt?: number): Ends | null {
  const aa = a?.altitudeFt ?? 0;
  const bb = b?.altitudeFt ?? 0;
  if (aa === 0 && bb === 0) {
    if (!state.map?.heights || !katmanOn(state) || !layerActive(state) || !heightSightRule(state)) return null;
    return { a: a ? eyeFt(a) : aEyeFt ?? POINT_EYE_FT, b: b ? eyeFt(b) : POINT_EYE_FT, ground: true, feetB: 0 };
  }
  if (ruleVersion(state) < 52) return null;
  // Kuyruk K71d (sürüm 59+): nokta ucu (alan noktası, hedef altıgen) Medium göz yüksekliğinde, nesne ucu (balista) kendi
  // yüksekliğinde (`aEyeFt`); zeminde 0 ft hat kendi platosunun kenarında kesiliyordu. 52–58'de 0.
  const k59 = katmanOn(state);
  const pt = k59 ? POINT_EYE_FT : 0;
  return { a: a ? eyeFt(a) : k59 ? aEyeFt ?? pt : 0, b: b ? eyeFt(b) : pt, ...(k59 ? { feetB: b ? altitudeOf(b) : 0 } : {}) };
}

/** Kuyruk K71d: nokta ucunun göz yüksekliği (ft): Medium boyun yarısı (doğrudan veriden: modül başlatma sırasından bağımsız). */
const POINT_EYE_FT = (s2rules.irtifa.boyFt as Record<string, number>).M! / 2;

/** Kuyruk K71d: katmanlı haritada yol düz mü: iki ucun seviyesi aynı ve aradaki hiçbir altıgen daha yüksek değil (2B hızlı yol). */
function flatPath(state: BattleState, path: Offset[]): boolean {
  const z = heightAt(state, path[0] as Offset);
  if (heightAt(state, path[path.length - 1] as Offset) !== z) return false;
  for (let i = 1; i < path.length - 1; i++) if (heightAt(state, path[i] as Offset) > z) return false;
  return true;
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
  if (dikeyOn(state)) return obstacleTop56(state, h, t);
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

/**
 * Kuyruk K71a (sürüm 56+, K1/K12): engel tepesinin tek çözücüsü. Sıra: alan (Wall of Stone/Ice paneli 10 ft, geçici engel
 * sonsuz) > nesne `yukseklikFt` (tür ya da ezme; yoksa sonsuz) > varyant `dikey.engel` altıgen ezmesi (null sonsuz) > tavanlı
 * altıgende geçilmez engel tavana dek (sonsuz) > harf tablosu (`dikey.harfFt` ya da `data/dikey.json`) > sonsuz.
 */
function obstacleTop56(state: BattleState, h: Offset, t: TerrainType): number {
  if (state.map?.zones?.length) {
    if (solidWallAt(state, h)) return panelTopFt();
    if (solidBarrierAt(state, h)) return Infinity;
  }
  const obj = state.map?.objects?.length ? objectAt(state, h) : undefined;
  if (obj) return obj.yukseklikFt ?? OBJECTS[obj.kind]?.yukseklikFt ?? Infinity;
  const ez = engelEzme(state, h);
  if (ez !== undefined) return ez ?? Infinity;
  if (t.movement === 'blocked' && ceilingFt(state, h) !== null) return Infinity;
  return harfFt(state, state.map?.tiles[h.row]?.[h.col]) ?? Infinity;
}

/**
 * Kuyruk K71a (sürüm 56+): hattın zemin ve çatı verisi (katmanlı haritada zemin yüksekliği; altıgen tavanı varsa çatı).
 * Kuyruk K71d (sürüm 59+): `floor` sırtın kesmesi için alt sınır: uçların alçak zemini (eksi seviyeli çukurda da sırt keser;
 * 58 ve altında 0: yalnız artı zemin).
 */
interface Ground { at: (h: Offset) => number; roofs: boolean; v59: boolean }
const groundOf = (state: BattleState): Ground | null => {
  if (!dikeyOn(state)) return null;
  // Zemin yalnız katmanlı haritada ve Game Master `heightSight` anahtarı açıkken (kapalıyken sırt da 2B'de yok).
  const layered = layerActive(state) && heightSightRule(state);
  const roofs = hasHexCeilings(state);
  if (!layered && !roofs) return null;
  return { at: layered ? (h) => zeminFt(state, h) : () => 0, roofs, v59: !!layered && katmanOn(state) };
};
/**
 * Hat altıgende zeminin altında (sırt) ya da altıgenin çatısının üstünde mi (sürüm 56+): kesen adı, yoksa null. `floor`:
 * sürüm 59+'da uçların alçak zemini (zemini bundan yüksek olmayan altıgen kesmez), öncesinde 0.
 */
function groundBlock(state: BattleState, g: Ground, h: Offset, lh: number, floor = 0): string | null {
  const z = g.at(h);
  if (z > floor && lh <= z) return 'yükselti';
  if (g.roofs) {
    const c = ceilingFt(state, h);
    if (c !== null && lh >= z + c) return 'çatı';
  }
  return null;
}

/** İrtifalı değerlendirme: hattın altıgendeki yüksekliği engelin tepesinden büyükse engel görüşü kesmez, siper vermez. */
function evaluateAlt(state: BattleState, path: Offset[], ignore: string[], target: Combatant, end: Offset | null, ends: Ends): LineOfFire {
  losStats.altPath++;
  let cover: Cover = 0;
  let coverBy: string | undefined;
  let over: string | undefined;
  const take = (c: Cover, by: string) => { if (c > cover) { cover = c; coverBy = by; } };
  // Kuyruk K71a (sürüm 56+): katman sırtı hatta geometrik (zemin yüksekliği), uçlar zeminleriyle; 55 ve altında 2B sırt.
  const g = groundOf(state);
  const ridge = g ? null : heightSightBlock(state, path);
  if (ridge) return { blocked: true, blockedBy: ridge, cover: 0 };
  const n = path.length - 1;
  const za = g ? g.at(path[0] as Offset) : 0;
  const zb = g ? g.at(path[n] as Offset) : 0;
  const a0 = ends.a + za;
  const b0 = ends.b + zb;
  // Kuyruk K71d (sürüm 59+): sırt alt sınırı uçların alçak zemini; kenar siperi göz–ayak hattıyla (`ledge`).
  const floor = g?.v59 ? Math.min(za, zb) : 0;
  const feet = g?.v59 && ends.feetB !== undefined ? ends.feetB + zb : null;
  let ledge = false;
  for (let i = 1; i < n; i++) {
    const h = path[i] as Offset;
    const lh0 = a0 + ((b0 - a0) * i) / n;
    if (g) { const gb = groundBlock(state, g, h, lh0, floor); if (gb) return { blocked: true, blockedBy: gb, cover: 0 }; }
    if (feet !== null && !ledge && groundBlock(state, g as Ground, h, a0 + ((feet - a0) * i) / n, floor) === 'yükselti') ledge = true;
    // Engel ve yaratık zeminden ölçülür (altıgenin zemin yüksekliği düşülür).
    const lh = g ? lh0 - g.at(h) : lh0;
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
    // Kuyruk K72 (sürüm 60+): duvarın tepesinde duran, durduğu duvardan siper almaz.
    if (own.cover && !(altitudeOf(target) > obstacleTopFt(state, end, own)) && !standingOn(state, target)) take(own.cover, own.name);
  }
  // Kuyruk K71d (sürüm 59+): kenar siperi geometrik: göz–göz hattı açık, gözden hedefin ayağına hat zeminde kesiliyor (hedefin
  // alt yarısı kenarın ardında; `heightCombat` anahtarı). 58 ve altında 2B seviye kuralı.
  if (feet !== null ? ledge && heightCombatRule(state) : ledgeCover(state, path)) take(2, 'kaya basamağı');
  return { blocked: false, cover, ...(coverBy ? { coverBy } : {}), ...(over ? { over } : {}) };
}

const COVER_NAME: Record<Cover, string> = { 0: '', 2: 'yarım siper', 5: '3/4 siper' };
export const coverName = (c: Cover): string => COVER_NAME[c];

/** `path` boyunca (uçlar hariç) görüş ve siper; `ignore` listesindekiler araya giren yaratık sayılmaz. */
function evaluate(state: BattleState, path: Offset[], ignore: string[], target: Combatant, end: Offset | null = target.pos, ends: Ends | null = null): LineOfFire {
  // Kuyruk K71d (sürüm 59+): iki uç yerde, katmanlı harita: düz yolda (aynı zemin, yolda yüksek altıgen yok) 2B hızlı yol.
  if (ends?.ground && flatPath(state, path)) losStats.groundFast++;
  else if (ends) return evaluateAlt(state, path, ignore, target, end, ends);
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
export function sightBlockedBetween(state: BattleState, from: Offset, to: Offset, who: { from?: Combatant | null; to?: Combatant | null; /** Kuyruk K71d (sürüm 59+): nesne ucunun yüksekliği (ft). */ fromEyeFt?: number } = {}): string | null {
  const ends = endsOf(state, who.from, who.to, who.fromEyeFt);
  if (ends && !ends.ground) return sightBlockedAlt(state, from, to, ends);
  // Kuyruk K71d (sürüm 59+): iki uç yerde, katmanlı haritada düz olmayan yol K10 çekirdeğinden (iki yan da).
  if (ends?.ground && !(flatPath(state, line(from, to, 1)) && flatPath(state, line(from, to, -1)))) return sightBlockedAlt(state, from, to, ends);
  if (ends?.ground) losStats.groundFast++;
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
  const g = groundOf(state);
  const blockedOn = (path: Offset[]) => {
    const ridge = g ? null : heightSightBlock(state, path);
    if (ridge) return ridge;
    const n = path.length - 1;
    const za = g ? g.at(path[0] as Offset) : 0;
    const zb = g ? g.at(path[n] as Offset) : 0;
    const a0 = ends.a + za;
    const b0 = ends.b + zb;
    const floor = g?.v59 ? Math.min(za, zb) : 0;
    for (let i = 1; i < n; i++) {
      const h = path[i] as Offset;
      const lh0 = a0 + ((b0 - a0) * i) / n;
      if (g) { const gb = groundBlock(state, g, h, lh0, floor); if (gb) return gb; }
      const t = terrainAt(state, h);
      if (!(t.blocksSight || t.outOfBounds)) continue;
      if (lh0 - (g ? g.at(h) : 0) > obstacleTopFt(state, h, t)) continue;
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

/**
 * Saldırı bağlamının yükseklik çifti (`AttackContext.attackerHeight/targetHeight`). Kuyruk K71d (sürüm 59+, K8; katmanlı harita,
 * `heightCombat` açık): mutlak zemin farkı ≥ 10 ft ve iki uç yerdeyken (irtifa 0) yüksek zemin; havadaki/yüzdeki sayılmaz.
 * Kural dışında eski seviye karşılaştırması (`heightOf`).
 */
export function attackHeights(state: BattleState, a: Combatant, t: Combatant): { attackerHeight: number; targetHeight: number } {
  const k8 = highGroundOf(state, a, t);
  if (k8) return { attackerHeight: k8.side, targetHeight: 0 };
  return { attackerHeight: heightOf(state, a), targetHeight: heightOf(state, t) };
}

/**
 * K8 yüksek zemin (`heights.ts` `highGroundK8`). Kuyruk K72 (sürüm 60+): duruş yüzeyinde (sur tepesi, kat döşemesi) duran
 * yerde sayılır, yüksekliği zemin + duruş yüksekliği; katmansız haritada da (anahtarı yok; katmanlı haritada `heightCombat`).
 * Havada ya da duvarda tutunan sayılmaz.
 */
export function highGroundOf(state: BattleState, a: Combatant, t: Combatant): { side: -1 | 0 | 1; ft: number; aloft?: true } | null {
  if (k72On(state) && a.pos && t.pos && (standingOn(state, a) || standingOn(state, t)) && (!layerActive(state) || heightCombatRule(state))) {
    const sa = standAlt(state, a);
    const st = standAlt(state, t);
    const ft = zeminFt(state, a.pos) + (sa ?? altitudeOf(a)) - (zeminFt(state, t.pos) + (st ?? altitudeOf(t)));
    if (sa === null || st === null) return { side: 0, ft, aloft: true };
    return { side: ft >= HG_FT ? 1 : ft <= -HG_FT ? -1 : 0, ft };
  }
  return highGroundK8(state, a, t);
}
const HG_FT = dikeyData.yuksekZemin.avantajFt;
