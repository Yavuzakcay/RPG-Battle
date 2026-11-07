/**
 * Kuyruk K65a (kural sürümü 49): serbest şekil alan (SRD 5.2.1 Fire Storm: "up to ten 10-foot Cubes, which you arrange as
 * you like. Each Cube must be contiguous with at least one other Cube"). Büyücü altıgenleri tek tek seçer; seçim
 * `cast_spell.targetHexes` ile gelir (ilk altıgen çıkış, `targetHex`). Kural büyü verisinin `k65.freeShape` bloğunda
 * (`maxHexes`: küp başına 4 altıgen; `rangeAll`: her altıgen menzilde; `sightFirst`: ilk altıgen görüşte). Doğrulama tek
 * yerde (`freeShapeProblem`); motor (`spells.ts` `executeAreaCast`), önizleme (`ui/hud.ts`) ve yapay zekâ aynı yolu kullanır.
 * Saf.
 */
import type { Spell } from '../data/types';
import { distance, isInside, neighbors, ring, sameHex, hexKey, type Offset } from '../rules/hex';
import type { AreaPick } from './areaAttack';
import { bodyOf } from './body';
import { fail, isIntangible, isTargetable, type Failure } from './common';
import { sightBlockedBetween } from './cover';
import { hexLabel, terrainAt } from './movement';
import { mechanicsAt } from './spellVersion';
import type { BattleState, Combatant } from './types';

export interface FreeShape {
  /** En çok altıgen (Fire Storm: 10 küp × 4). */
  maxHexes: number;
  /** Her altıgen büyü menzilinde olmalı. */
  rangeAll?: boolean;
  /** İlk (çıkış) altıgen büyücünün görüşünde olmalı. */
  sightFirst?: boolean;
  /** Kuyruk K65b (Forcecage): seçime göre sınır (`box` 4, `cage` 19) ve varsayılan seçim. */
  maxByChoice?: Record<string, number>;
  defaultChoice?: string;
}

/** Kuyruk K65b: seçime göre etkin serbest şekil (Forcecage kutu/kafes sınırı); seçimsiz büyüde aynen. */
export function freeShapeFor(fs: FreeShape, choice?: string | null): FreeShape {
  const key = choice ?? fs.defaultChoice;
  const max = key ? fs.maxByChoice?.[key] : undefined;
  return max !== undefined ? { ...fs, maxHexes: max } : fs;
}

/** Büyünün bu savaşın kural sürümündeki serbest şekli (yalnızca `k65` bloğu, sürüm 49+). */
export const freeShapeOf = (state: Pick<BattleState, 'kuralSurumu'>, spell: Spell): FreeShape | undefined =>
  mechanicsAt(state, spell).freeShape as FreeShape | undefined;

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

/** Altıgen kümesi tek parça mı (bitişiklikle bağlı)? */
export function connected(hexes: Offset[]): boolean {
  if (hexes.length <= 1) return true;
  const keys = new Set(hexes.map(hexKey));
  const seen = new Set<string>([hexKey(hexes[0] as Offset)]);
  const queue: Offset[] = [hexes[0] as Offset];
  while (queue.length) {
    const h = queue.shift() as Offset;
    for (const n of neighbors(h)) {
      const k = hexKey(n);
      if (keys.has(k) && !seen.has(k)) { seen.add(k); queue.push(n); }
    }
  }
  return seen.size === keys.size;
}

/** Tek altıgenin konum sorunu (harita, menzil; ilk altıgende görüş) ya da null. */
export function freeHexProblem(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, h: Offset, first: boolean): string | null {
  if (!isInside(h, sizeOf(state))) return 'Altıgen harita dışında.';
  if (!actor.pos) return 'Büyücü haritada değil.';
  const d = distance(actor.pos, h);
  if ((fs.rangeAll || first) && d * 5 > spell.rangeFt) return `${hexLabel(h)} menzil dışında: ${d * 5} ft, menzil ${spell.rangeFt} ft.`;
  if (first && fs.sightFirst) {
    const t = terrainAt(state, h);
    if (t.blocksSight || t.outOfBounds) return `${hexLabel(h)} ilk altıgen olamaz (${t.name}).`;
    const wall = sightBlockedBetween(state, actor.pos, h);
    if (wall) return `İlk altıgen görülemiyor: arada ${wall} var.`;
  }
  return null;
}

/** Bütün seçimin sorunu ya da null: boş değil, sınır, tekrarsız, harita içi, menzil, ilk altıgen görüşü, tek parça. */
export function freeShapeProblem(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, hexes: Offset[]): string | null {
  if (!state.map || !actor.pos) return 'Serbest şekil yalnızca haritalı savaşta.';
  if (!hexes.length) return `${spell.name}: alan için en az bir altıgen seç.`;
  if (hexes.length > fs.maxHexes) return `${spell.name}: en çok ${fs.maxHexes} altıgen.`;
  for (let i = 0; i < hexes.length; i++) {
    const h = hexes[i] as Offset;
    if (hexes.slice(0, i).some((x) => sameHex(x, h))) return 'Aynı altıgen iki kez seçilemez.';
    const why = freeHexProblem(state, actor, spell, fs, h, i === 0);
    if (why) return why;
  }
  if (!connected(hexes)) return `${spell.name}: altıgenler tek parça olmalı (her biri bir başkasına bitişik).`;
  return null;
}

/** Seçimin etkilediği yaratıklar (gövdesinin bir altıgeni alanda; siper yok: her yaratık kendi küpünün içinde). */
export function freeShapeArea(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, hexes: Offset[]): AreaPick | Failure {
  const why = freeShapeProblem(state, actor, spell, fs, hexes);
  if (why) return fail(why);
  const keys = new Set(hexes.map(hexKey));
  const all = spell.area?.targets !== 'enemies';
  const reached = Object.values(state.combatants)
    .filter((c) => c.pos !== null && isTargetable(c) && !isIntangible(c) && bodyOf(state, c).some((b) => keys.has(hexKey(b))) && (all || c.side !== actor.side))
    .map((c) => ({ c, cover: 0 as const }));
  return { hexes, origin: hexes[0] as Offset, reached };
}

/** Arayüz: altıgen eklenebilir mi (sınır, tekrar, konum, bitişiklik) ya da nedeni. */
export function freeAddProblem(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, set: Offset[], h: Offset): string | null {
  if (set.some((x) => sameHex(x, h))) return null;
  if (set.length >= fs.maxHexes) return `${spell.name}: sınır doldu (${fs.maxHexes}).`;
  const why = freeHexProblem(state, actor, spell, fs, h, set.length === 0);
  if (why) return why;
  if (set.length && !set.some((x) => distance(x, h) === 1)) return 'Seçili alana bitişik değil.';
  return null;
}

/** Arayüz: altıgen çıkarılınca alan tek parça kalıyor mu? İlk altıgen çıkarılırsa yeni ilk altıgen menzil/görüş sınavından geçmeli. */
export function freeRemoveProblem(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, set: Offset[], h: Offset): string | null {
  const rest = set.filter((x) => !sameHex(x, h));
  if (!connected(rest)) return 'Bu altıgeni çıkarmak alanı ikiye böler.';
  if (rest.length && sameHex(set[0] as Offset, h)) {
    const why = freeHexProblem(state, actor, spell, fs, rest[0] as Offset, true);
    if (why) return why;
  }
  return null;
}

/**
 * Kuyruk K65a (yapay zekâ, basit kural): serbest şekli düşmanlara göre büyütür. Tohum: menzilde ve görüşte, 2 altıgen
 * çevresinde en çok düşman olan düşman altıgeni. Sonra her adımda seçili kümeden çok kaynaklı en kısa bitişik yol (BFS)
 * ile kapsanmamış en yakın düşmana uzanır; yol bütçeye sığmıyorsa durur. Dost (büyücü dahil) ya da masum altıgenine hiç
 * girmez: dost içeren alan seçilmez. Hesap: düşman başına bir arama (harita altıgen sayısıyla doğrusal).
 */
export function freeShapeAim(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, foes: Combatant[]): { hexes: Offset[]; covered: Combatant[] } | null {
  if (!state.map || !actor.pos) return null;
  const size = sizeOf(state);
  const blocked = new Set(Object.values(state.combatants)
    .filter((c) => c.pos && c.hp > 0 && (c.side === actor.side || c.civilian || c.id === actor.id))
    .flatMap((c) => bodyOf(state, c).map(hexKey)));
  const okHex = (h: Offset) => isInside(h, size) && !blocked.has(hexKey(h)) && !freeHexProblem(state, actor, spell, fs, h, false);
  const targets = foes.filter((f) => f.pos && f.hp > 0).map((f) => ({ f, hexes: bodyOf(state, f).filter(okHex) })).filter((x) => x.hexes.length);
  if (!targets.length) return null;
  const order = (a: Offset, b: Offset) => a.row - b.row || a.col - b.col;
  const seeds = targets.flatMap((t) => t.hexes).filter((h) => !freeHexProblem(state, actor, spell, fs, h, true)).sort(order);
  if (!seeds.length) return null;
  const crowd = (h: Offset) => targets.filter((t) => t.hexes.some((x) => distance(x, h) <= 2)).length;
  const seed = seeds.reduce((best, h) => (crowd(h) > crowd(best) ? h : best), seeds[0] as Offset);
  const shape: Offset[] = [seed];
  const inShape = new Set([hexKey(seed)]);
  const coveredIds = () => new Set(targets.filter((t) => t.hexes.some((h) => inShape.has(hexKey(h)))).map((t) => t.f.id));
  for (;;) {
    const covered = coveredIds();
    const left = targets.filter((t) => !covered.has(t.f.id));
    const budget = fs.maxHexes - shape.length;
    if (!left.length || budget <= 0) break;
    // Çok kaynaklı BFS: seçili kümeden bütçe kadar adım.
    const dist = new Map<string, number>(shape.map((h) => [hexKey(h), 0]));
    const prev = new Map<string, Offset>();
    const queue = [...shape];
    const goal = new Set(left.flatMap((t) => t.hexes.map(hexKey)));
    let hit: Offset | null = null;
    while (queue.length && !hit) {
      const h = queue.shift() as Offset;
      const d = dist.get(hexKey(h)) as number;
      if (d >= budget) continue;
      for (const n of neighbors(h, size).sort(order)) {
        const k = hexKey(n);
        if (dist.has(k) || !okHex(n)) continue;
        dist.set(k, d + 1); prev.set(k, h); queue.push(n);
        if (goal.has(k)) { hit = n; break; }
      }
    }
    if (!hit) break;
    const path: Offset[] = [];
    for (let h: Offset | undefined = hit; h && !inShape.has(hexKey(h)); h = prev.get(hexKey(h))) path.unshift(h);
    for (const h of path) { shape.push(h); inShape.add(hexKey(h)); }
  }
  const covered = coveredIds();
  return { hexes: shape, covered: targets.filter((t) => covered.has(t.f.id)).map((t) => t.f) };
}

/**
 * Kuyruk K65b (Wind Wall `wallPath`, sürüm 41'den beri motorda): duvar yolu sırası. Bitişik altıgenler, tekrarsız, harita
 * içi, ilki menzilde. Motor (`zones.ts` `wallPathHexes`) ve seçici aynı denetimi kullanır.
 */
export interface PathRules {
  /** Kuyruk K65c (panelli duvarlar): her altıgen menzilde (Wind Wall'da yalnızca ilki). */
  rangeAll?: boolean;
  /** Kuyruk K65c: ilk altıgen büyücünün görüşünde. */
  sightFirst?: boolean;
}
export function pathProblem(state: BattleState, actor: Combatant, spell: Spell, path: Offset[], max: number, rules?: PathRules): string | null {
  if (path.length > max) return `${spell.name}: duvar en çok ${max} altıgen (${max * 5} ft).`;
  const size = sizeOf(state);
  for (let i = 0; i < path.length; i++) {
    const h = path[i] as Offset;
    if (!isInside(h, size)) return 'Duvar harita dışına taşamaz.';
    if (path.slice(0, i).some((x) => sameHex(x, h))) return 'Duvar yolu aynı altıgenden iki kez geçemez.';
    if (i > 0 && distance(path[i - 1] as Offset, h) !== 1) return 'Duvar yolunun altıgenleri birbirine bitişik olmalı.';
  }
  if (!actor.pos || (path[0] && distance(actor.pos, path[0]) * 5 > spell.rangeFt)) return `${spell.name}: duvarın başı menzil dışında (${spell.rangeFt} ft).`;
  // Kuyruk K65c (sürüm 49, panelli duvarlar): her altıgen menzilde, ilk altıgen görüşte (K65a/b serbest şekille aynı kural).
  if (rules) {
    const fs: FreeShape = { maxHexes: max, rangeAll: rules.rangeAll, sightFirst: rules.sightFirst };
    for (let i = 0; i < path.length; i++) {
      const why = freeHexProblem(state, actor, spell, fs, path[i] as Offset, i === 0);
      if (why) return why;
    }
  }
  return null;
}

/** Seçici: yol sonuna eklenecek altıgenin sorunu (yolun son altıgenine bitişik; ilki menzilde) ya da null. */
export function pathAddProblem(state: BattleState, actor: Combatant, spell: Spell, path: Offset[], max: number, h: Offset, rules?: PathRules): string | null {
  if (path.length >= max) return `${spell.name}: sınır doldu (${max}).`;
  const last = path[path.length - 1];
  if (last && distance(last, h) !== 1) return 'Duvar yolu yalnızca son altıgene bitişik uzar.';
  return pathProblem(state, actor, spell, [...path, h], max, rules);
}

/**
 * Kuyruk K65c (yapay zekâ, panelli duvar): düşmanlarla büyücü arasına, büyücüden r altıgen uzaktaki halkanın düşmanlara
 * bakan yayı (halka sırası bitişik). r = en yakın düşmana uzaklığın yarısı (en az 2). Dost, büyücü, masum ya da herhangi
 * bir yaratık altıgeni yolda olmaz; yol `pathProblem`'den geçer. Yay en çok `max` altıgen, düşmana en yakın altıgenden
 * iki yana genişler.
 */
export function wallAim(state: BattleState, actor: Combatant, spell: Spell, max: number, rules: PathRules | undefined, foes: Combatant[]): Offset[] | null {
  if (!state.map || !actor.pos) return null;
  const me = actor.pos;
  const near = foes.filter((f) => f.pos && f.hp > 0).sort((a, b) => distance(me, a.pos as Offset) - distance(me, b.pos as Offset))[0];
  if (!near?.pos) return null;
  const r = Math.max(2, Math.floor(distance(me, near.pos) / 2));
  const size = sizeOf(state);
  const taken = new Set(Object.values(state.combatants).filter((c) => c.pos && c.hp > 0).flatMap((c) => bodyOf(state, c).map(hexKey)));
  const loop = ring(me, r);
  if (!loop.length) return null;
  const start = loop.reduce((b, h, i) => (distance(h, near.pos as Offset) < distance(loop[b] as Offset, near.pos as Offset) ? i : b), 0);
  const ok = (h: Offset) => isInside(h, size) && !taken.has(hexKey(h)) && !terrainAt(state, h).outOfBounds && terrainAt(state, h).movement !== 'blocked';
  if (!ok(loop[start] as Offset)) return null;
  const path: Offset[] = [loop[start] as Offset];
  let a = start, b = start;
  while (path.length < max) {
    const nb = (b + 1) % loop.length, na = (a - 1 + loop.length) % loop.length;
    const grewB = nb !== a && ok(loop[nb] as Offset) && path.length < max;
    if (grewB) { path.push(loop[nb] as Offset); b = nb; }
    const grewA = na !== b && path.length < max && ok(loop[na] as Offset);
    if (grewA) { path.unshift(loop[na] as Offset); a = na; }
    if (!grewA && !grewB) break;
  }
  // Yol sırası: ilk altıgen görüşte olmalı; değilse ters çevrilir.
  const ordered = rules?.sightFirst && freeHexProblem(state, actor, spell, { maxHexes: max, sightFirst: true }, path[0] as Offset, true) ? [...path].reverse() : path;
  return pathProblem(state, actor, spell, ordered, max, rules) ? null : ordered;
}

/**
 * Kuyruk K65b (yapay zekâ, Forcecage): tehlikeli düşmanın bütün gövdesini kapsayan bitişik küme; sınır izin verdikçe ona
 * bitişik öteki düşmanlar da (gövdeleri tam). Dost, büyücü ya da masum altıgeni içeren küme kurulmaz; ilk altıgen menzil
 * ve görüş sınavından geçen gövde altıgeni. Kısmen içeride kalan yaratık itileceği için gövde tam alınır.
 */
export function cageAim(state: BattleState, actor: Combatant, spell: Spell, fs: FreeShape, target: Combatant, foes: Combatant[]): Offset[] | null {
  if (!state.map || !actor.pos || !target.pos) return null;
  const blocked = new Set(Object.values(state.combatants)
    .filter((c) => c.pos && c.hp > 0 && (c.side === actor.side || c.civilian || c.id === actor.id))
    .flatMap((c) => bodyOf(state, c).map(hexKey)));
  const body = (c: Combatant) => bodyOf(state, c);
  const first = body(target);
  if (first.length > fs.maxHexes || first.some((h) => blocked.has(hexKey(h)))) return null;
  const start = first.find((h) => !freeHexProblem(state, actor, spell, fs, h, true));
  if (!start) return null;
  let shape = [start, ...first.filter((h) => !sameHex(h, start))];
  const others = foes.filter((f) => f.id !== target.id && f.pos && f.hp > 0)
    .sort((a, b) => distance(a.pos as Offset, target.pos as Offset) - distance(b.pos as Offset, target.pos as Offset) || a.id.localeCompare(b.id));
  for (const f of others) {
    const add = body(f).filter((h) => !shape.some((x) => sameHex(x, h)));
    const next = [...shape, ...add];
    if (next.length > fs.maxHexes || add.some((h) => blocked.has(hexKey(h)))) continue;
    if (!freeShapeProblem(state, actor, spell, fs, next)) shape = next;
  }
  return freeShapeProblem(state, actor, spell, fs, shape) ? null : shape;
}
