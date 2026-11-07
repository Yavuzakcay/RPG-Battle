/**
 * Kuyruk K65a (kural sürümü 49): serbest şekil alan (SRD 5.2.1 Fire Storm: "up to ten 10-foot Cubes, which you arrange as
 * you like. Each Cube must be contiguous with at least one other Cube"). Büyücü altıgenleri tek tek seçer; seçim
 * `cast_spell.targetHexes` ile gelir (ilk altıgen çıkış, `targetHex`). Kural büyü verisinin `k65.freeShape` bloğunda
 * (`maxHexes`: küp başına 4 altıgen; `rangeAll`: her altıgen menzilde; `sightFirst`: ilk altıgen görüşte). Doğrulama tek
 * yerde (`freeShapeProblem`); motor (`spells.ts` `executeAreaCast`), önizleme (`ui/hud.ts`) ve yapay zekâ aynı yolu kullanır.
 * Saf.
 */
import type { Spell } from '../data/types';
import { distance, isInside, neighbors, sameHex, hexKey, type Offset } from '../rules/hex';
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
