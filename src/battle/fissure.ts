/**
 * Kuyruk K66a (kural sürümü 50): Earthquake yarıkları (SRD 5.2.1 s. 127 "Fissures").
 * - Dökümde 1d6 atılır (`SpellZone.fissures.count`, Earthquake alanında); büyücü aynı turda yerleştirir
 *   (`spell_followup` `choice: 'fissure:<yön>'` + `targetHex`; eylem harcamaz). Yerleştirilen yarık bekleyen alandır
 *   (`fissure.pending`), büyücünün turu bitince açılır (bir sonraki turun başında açık); yerleştirilmeyen yitirilir.
 * - Biçim: seçilen altıgenden geçen düz eksen hattı, Earthquake alanının (ve haritanın) bir kenarından karşı kenarına; 2
 *   altıgen geniş (10 ft = 2 altıgen, K65). Yön 0–5 = 3 eksen × 2 yan (ikinci şeridin hangi yanda olduğu).
 * - Yalnız yürünebilir zemin "Uçurum, yarık" (`u`) olur (`tile_changed`, kalıcı); duvar, engel, su, lav ve nesneli altıgen
 *   değişmez. Yapı (veride `structureKinds`, Wall of Stone/Ice paneli) altından geçen hat reddedilir.
 * - Açılan yarık kalıcı alandır (`fissure.depthFt`, 1d10 × 10 ft; konsantrasyon bağı yok).
 * - Yarıktaki yaratık (uçan muaf) DEX save atar: başarısızsa düşer (SRD Falling: derinlik/10 × d6, Prone; Feather Fall ve
 *   Slow Fall tepkileri) ve irtifası eksi derinlik olur (yüzeyden yakın dövüşle erişilmez, `reachFt`); başarılıysa yarığın
 *   en yakın boş kenar altıgenine kayar (yer yoksa düşer).
 * - Yarıktan çıkış: `vertical_move` (tırmanma, çift hareket maliyeti, zarsız); 0 ft'e varınca `to` ile bitişik zemine.
 * Yeni olay türü yok (`zone_created`/`zone_ended`, `tile_changed`, `save_resolved`, `map_effect`, `altitude_changed`,
 * `pushed`, `moved`). Saf; zar `rng` ile.
 */
import { AXIAL_DIRECTIONS, axialToOffset, distance, hexKey, isInside, neighbors, offsetToAxial, sameHex, type Offset } from '../rules/hex';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave, speedZero } from '../rules/conditions';
import { enterCost, terrainOf } from '../map/terrain';
import type { ZoneSpec } from '../data';
import { isLiquidTile } from './deepWater';
import { fail, finish, isIntangible, type CommandResult } from './common';
import { turnKey } from './economy';
import { applyEvents, speedHexes } from './reduce';
import { ruleVersion } from './ruleVersion';
import { effectSpeedZero, isAirborne } from './flight';
import { altitudeOf } from './altitude';
import { fallEffect } from './maprules';
import { fallReactions } from './reactions';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { bodyAt } from './body';
import { objectAt } from './objectData';
import { panelId, panelOf } from './walls';
import { moveCostFn, occupantAt, terrainAt } from './movement';
import { registerCommandEnd } from './turnHooks';
import { zoneSpecOf } from './zones';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

export const FISSURE_VERSION = 50;
export const fissureOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= FISSURE_VERSION;
const PLAN_ID = 'earthquake:fissure-plan';
const OPEN_ID = 'earthquake:fissure';
type FissureSpec = NonNullable<ZoneSpec['fissures']>;
type FollowCmd = { targetId: string; targetHex?: Offset; choice?: string };

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const tileAt = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col] ?? '#';

/** Açılmış yarık alanları. */
export const openFissures = (s: BattleState): SpellZone[] => (s.map?.zones ?? []).filter((z) => z.fissure && !z.fissure.pending);
/** Altıgendeki açık yarık (yoksa undefined). */
export const fissureAt = (s: BattleState, h: Offset): SpellZone | undefined => openFissures(s).find((z) => z.hexes.some((x) => sameHex(x, h)));
/** Yaratık yarığın içinde mi (eksi irtifa, uçmuyor). */
export const inFissure = (s: Pick<BattleState, 'kuralSurumu'>, c: Combatant): boolean => fissureOn(s) && altitudeOf(c) < 0 && !isAirborne(c);

/** Büyücünün yarık hakkı: Earthquake alanı, 1d6 sayısı, yerleştirilenler, yerleştirme turu mu. */
export function fissureBudget(s: BattleState, actor: Combatant): { quake: SpellZone; spec: FissureSpec; count: number; placed: number; open: boolean } | null {
  if (!fissureOn(s)) return null;
  const quake = (s.map?.zones ?? []).find((z) => z.casterId === actor.id && z.fissures);
  const spec = quake ? zoneSpecOf(quake)?.fissures : undefined;
  if (!quake?.fissures || !spec) return null;
  const placed = (s.map?.zones ?? []).filter((z) => z.fissure?.pending?.parentId === quake.id).length;
  return { quake, spec, count: quake.fissures.count, placed, open: quake.fissures.turn === turnKey(s) };
}

/** Yarığa dönebilir zemin: yürünebilir, sıvı değil, uçurum değil, nesnesiz. */
function convertible(s: BattleState, h: Offset): boolean {
  const ch = tileAt(s, h);
  const t = terrainOf(ch);
  if (t.outOfBounds || t.movement === 'blocked' || t.movement === 'deadly' || isLiquidTile(t) || t.flyersPass) return false;
  return !objectAt(s, h);
}

/** Seçilen altıgenden geçen düz eksen hattı, alanın bir kenarından karşı kenarına; `widthHexes` şerit (yön: eksen × yan). */
export function fissureLine(s: BattleState, quake: SpellZone, at: Offset, dir: number, width = 2): Offset[] {
  const axis = Math.floor(dir / 2) % 3;
  const side = dir % 2 === 0 ? 1 : -1;
  const d = AXIAL_DIRECTIONS[axis] as { q: number; r: number };
  const e = AXIAL_DIRECTIONS[(axis + 1) % 3] as { q: number; r: number };
  const size = sizeOf(s);
  const area = new Set(quake.hexes.map(hexKey));
  const inArea = (o: Offset) => isInside(o, size) && area.has(hexKey(o));
  if (!inArea(at)) return [];
  const a0 = offsetToAxial(at);
  const step = (k: number) => axialToOffset({ q: a0.q + d.q * k, r: a0.r + d.r * k });
  let lo = 0;
  while (inArea(step(lo - 1))) lo--;
  const first: Offset[] = [];
  for (let k = lo; inArea(step(k)); k++) first.push(step(k));
  const out = [...first];
  const keys = new Set(out.map(hexKey));
  for (let w = 1; w < width; w++) {
    for (const h of first) {
      const a = offsetToAxial(h);
      const o = axialToOffset({ q: a.q + e.q * side * w, r: a.r + e.r * side * w });
      if (inArea(o) && !keys.has(hexKey(o))) { keys.add(hexKey(o)); out.push(o); }
    }
  }
  return out;
}

/** Yapı altıgeni: veride `structureKinds` nesnesi ya da duvar paneli (Wall of Stone/Ice). */
function structureAt(s: BattleState, h: Offset, spec: FissureSpec): boolean {
  const o = objectAt(s, h);
  if (o && spec.structureKinds.includes(o.kind)) return true;
  return (s.map?.zones ?? []).some((z) => z.hexes.some((x) => sameHex(x, h)) && !!panelOf(s, panelId(z, h)));
}

const parseDir = (choice: string | undefined): number => (choice?.startsWith('fissure:') ? Number(choice.slice(8)) : NaN);

/** Yerleştirme sorunu (motor, önizleme ve yapay zekâ ortak; yoksa null). */
export function fissureProblem(s: BattleState, actor: Combatant, at: Offset | null | undefined, dir: number): string | null {
  if (!fissureOn(s)) return 'Yarık bu kural sürümünde yok.';
  const b = fissureBudget(s, actor);
  if (!b) return 'Yarık açacak bir Earthquake yok.';
  if (!b.open) return 'Yarıklar yalnızca Earthquake\'in yapıldığı turda yerleştirilir.';
  if (b.placed >= b.count) return `Yarık hakkı doldu (1d6 = ${b.count}).`;
  if (!Number.isInteger(dir) || dir < 0 || dir > 5) return 'Yarığın yönünü seç.';
  if (!at) return 'Yarığın geçeceği altıgeni seç.';
  const hexes = fissureLine(s, b.quake, at, dir, b.spec.widthHexes);
  if (!hexes.length) return 'Yarık Earthquake alanının içinden geçmeli.';
  if (hexes.some((h) => structureAt(s, h, b.spec))) return 'Yarık bir yapının altından geçemez.';
  if (!hexes.some((h) => convertible(s, h))) return 'Bu hatta yarığa dönecek zemin yok.';
  const key = hexes.map(hexKey).sort().join(';');
  if ((s.map?.zones ?? []).some((z) => z.fissure?.pending?.parentId === b.quake.id && z.hexes.map(hexKey).sort().join(';') === key)) return 'Bu yarık zaten yerleştirildi.';
  return null;
}

/** Yarığa dönecek altıgenler (önizleme ve açılış). */
export function fissureHexes(s: BattleState, actor: Combatant, at: Offset, dir: number): Offset[] {
  const b = fissureBudget(s, actor);
  return b ? fissureLine(s, b.quake, at, dir, b.spec.widthHexes).filter((h) => convertible(s, h)) : [];
}

/** Yerleştirme (`spell_followup` `choice: 'fissure:<yön>'`): bekleyen yarık alanı. */
export function executeFissurePlace(s: BattleState, actor: Combatant, cmd: FollowCmd): CommandResult {
  const dir = parseDir(cmd.choice);
  const why = fissureProblem(s, actor, cmd.targetHex, dir);
  if (why) return fail(why);
  const b = fissureBudget(s, actor) as NonNullable<ReturnType<typeof fissureBudget>>;
  const at = cmd.targetHex as Offset;
  const hexes = fissureLine(s, b.quake, at, dir, b.spec.widthHexes);
  const used = new Set((s.map?.zones ?? []).map((z) => z.id));
  let n = 1;
  while (used.has(`${PLAN_ID}:${actor.id}:${n}`)) n++;
  const zone: SpellZone = { id: `${PLAN_ID}:${actor.id}:${n}`, spellId: PLAN_ID, name: `Yarık ${b.placed + 1}/${b.count} (açılacak)`, casterId: actor.id, side: actor.side,
    dc: b.quake.dc, slotLevel: b.quake.slotLevel, hexes, fissure: { pending: { at, dir, parentId: b.quake.id } } };
  return finish(s, [{ type: 'zone_created', zone }, { type: 'map_note', text: `${actor.name}: yarık ${b.placed + 1}/${b.count} yerleştirildi (tur sonunda açılır)` }]);
}

/** Kenar altıgeni: yarık olmayan, yürünebilir, boş; yakından uzağa (en çok 3 altıgen). */
function edgeHex(s: BattleState, c: Combatant, from: Offset): Offset | null {
  const size = sizeOf(s);
  const seen = new Set([hexKey(from)]);
  let ring: Offset[] = [from];
  for (let d = 1; d <= 3; d++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) if (!seen.has(hexKey(n))) { seen.add(hexKey(n)); next.push(n); }
    const ok = next.filter((h) => !fissureAt(s, h) && enterCost(terrainAt(s, h), false) !== null && !occupantAt(s, h, c.id))
      .sort((a, b) => a.row - b.row || a.col - b.col);
    if (ok.length) return ok[0] as Offset;
    ring = next;
  }
  return null;
}

/** Düşme: tepki (Feather Fall, Slow Fall), SRD düşme hasarı ve Prone, irtifa eksi derinlik. */
function fallInEvents(s: BattleState, c: Combatant, depthFt: number, rng: Rng): BattleEvent[] {
  const fr = fallReactions(s, c.id, depthFt, rng);
  const after = applyEvents(s, fr.events);
  return [...fr.events, fallEffect(after.combatants[c.id] as Combatant, depthFt, rng, fr), { type: 'altitude_changed', targetId: c.id, altitudeFt: -depthFt, label: `yarığa düştü (${depthFt} ft)` }];
}

/** Büyücünün turu bitince bekleyen yarıklar açılır (bir sonraki turun başında açık). */
export function fissureOpenEvents(state: BattleState, casterId: string, rng: Rng): BattleEvent[] {
  if (!fissureOn(state)) return [];
  const pending = (state.map?.zones ?? []).filter((z) => z.casterId === casterId && z.fissure?.pending);
  if (!pending.length) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  for (const p of pending) {
    const plan = p.fissure?.pending as NonNullable<NonNullable<SpellZone['fissure']>['pending']>;
    const quake = (s.map?.zones ?? []).find((z) => z.id === plan.parentId);
    const spec = quake ? zoneSpecOf(quake)?.fissures : undefined;
    push([{ type: 'zone_ended', zoneId: p.id, name: p.name, reason: quake ? 'expired' : 'concentration' }]);
    if (!quake || !spec) continue;
    const hexes = fissureLine(s, quake, plan.at, plan.dir, spec.widthHexes).filter((h) => convertible(s, h));
    if (!hexes.length) continue;
    const roll = rollDice(spec.depthDie, rollTag(rng, { kind: 'damage', by: casterId }));
    const depthFt = roll.total * spec.depthStepFt;
    const used = new Set((s.map?.zones ?? []).map((z) => z.id));
    let n = 1;
    while (used.has(`${OPEN_ID}:${casterId}:${n}`)) n++;
    push([
      ...hexes.map((h): BattleEvent => ({ type: 'tile_changed', at: h, to: 'u' })),
      { type: 'zone_created', zone: { id: `${OPEN_ID}:${casterId}:${n}`, spellId: OPEN_ID, name: `Yarık (${depthFt} ft)`, casterId, side: p.side, dc: p.dc, slotLevel: p.slotLevel, hexes, fissure: { depthFt } } },
      { type: 'map_note', text: `Yarık açıldı: ${hexes.length} altıgen, ${depthFt} ft derin (1d10 = ${roll.total})` },
    ]);
    const caster = s.combatants[casterId];
    const inside = Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && c.life !== 'dead' && !c.summon?.gone && !isIntangible(c) && !isAirborne(c) && altitudeOf(c) >= 0
      && bodyAt(s, c, c.pos).some((b) => hexes.some((h) => sameHex(h, b))));
    for (const c0 of inside) {
      const c = s.combatants[c0.id] as Combatant;
      const autoFail = autoFailsStrDexSave(c.conditions);
      const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: p.dc, mode: saveMode('normal', c, 'dex', caster), autoFail }, rollTag(rng, { by: c.id }));
      push([{ type: 'save_resolved', actorId: casterId, targetId: c.id, label: 'Yarık', ability: 'dex', dc: p.dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: c.hp, effects: [], conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}) }]);
      const now = s.combatants[c.id] as Combatant;
      const edge = save.success && now.pos ? edgeHex(s, now, now.pos) : null;
      if (edge && now.pos) push([{ type: 'pushed', targetId: c.id, from: now.pos, to: edge, by: casterId }]);
      else push(fallInEvents(s, now, depthFt, rng));
    }
  }
  return out;
}

/** Yarıktan tırmanma uygulanır mı (`vertical_move`; yarıktaki, uçmayan yaratık). */
export const fissureClimbApplies = (s: BattleState, actor: Combatant): boolean => inFissure(s, actor);

/** Tırmanma: her 5 ft için 2 altıgen hareket (çift maliyet, zarsız); 0 ft'te `to` ile bitişik zemine çıkış. */
export function executeFissureClimb(s: BattleState, actor: Combatant, cmd: { toFt: number; to?: Offset }): CommandResult {
  const from = altitudeOf(actor);
  const toFt = cmd.toFt;
  if (!Number.isFinite(toFt) || toFt % 5 !== 0 || toFt <= from || toFt > 0) return fail(`Yarıktan tırman: ${from} ft'ten 0 ft'e dek, 5 ft adımla.`);
  if (speedZero(actor.conditions) || effectSpeedZero(actor)) return fail('Hareket edemiyor: hızı 0.');
  if (!actor.pos) return fail('Konum yok.');
  const climb = ((toFt - from) / 5) * 2;
  const events: BattleEvent[] = [{ type: 'altitude_changed', targetId: actor.id, altitudeFt: toFt, label: 'yarıkta tırmanma', cost: climb, byId: actor.id }];
  let cost = climb;
  if (toFt === 0) {
    const to = cmd.to;
    if (!to) return fail('Yarıktan çıkmak için bitişik bir zemin altıgeni seç.');
    if (distance(actor.pos, to) !== 1 || !isInside(to, sizeOf(s))) return fail('Çıkış altıgeni bitişik olmalı.');
    if (fissureAt(s, to)) return fail('Çıkış altıgeni yarık olmamalı.');
    if (occupantAt(s, to, actor.id)) return fail('Çıkış altıgeni dolu.');
    const step = moveCostFn(s, actor)(to, actor.pos);
    if (step === null) return fail('Çıkış altıgenine girilemez.');
    cost += step;
    events.push({ type: 'moved', actorId: actor.id, path: [to], cost: step });
  }
  const left = speedHexes(actor) - actor.movementUsed;
  if (cost > left) return fail(`Yeterli hareket yok (tırmanma ${climb}${toFt === 0 ? ` + çıkış ${cost - climb}` : ''} altıgen; kalan ${Math.max(0, left)}).`);
  return finish(s, events);
}

/**
 * Yürüme bağlılığı (yapay zekâ): harita altıgenleri dizinle (satır × sütun), komşular ve yürünebilirlik bir kez;
 * her aday için tek geçişte bağlı bileşen etiketi (yarık ve engel geçilmez; yaratıklar yok sayılır). K66b ölçümü:
 * aday başına iki BFS × yürüyen yerine tek etiketleme ve aynı hattın bir kez değerlendirilmesi.
 */
function walkGrid(s: BattleState, seeds: Offset[]) {
  const cols = s.map?.tiles[0]?.length ?? 0;
  const rows = s.map?.tiles.length ?? 0;
  const size = { cols, rows };
  const n = cols * rows;
  const idx = (h: Offset) => h.row * cols + h.col;
  const nbrs: number[][] = [];
  const walk = new Uint8Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = { col: c, row: r };
    nbrs.push(neighbors(h, size).map(idx));
    walk[idx(h)] = enterCost(terrainAt(s, h), false) !== null ? 1 : 0;
  }
  for (const h of seeds) walk[idx(h)] = 1;
  const label = (cut: Uint8Array): Int32Array => {
    const comp = new Int32Array(n).fill(-1);
    const queue = new Int32Array(n);
    let id = 0;
    for (let i = 0; i < n; i++) {
      if (comp[i] !== -1 || !walk[i] || cut[i]) continue;
      let head = 0, tail = 0;
      queue[tail++] = i; comp[i] = id;
      while (head < tail) {
        const v = queue[head++] as number;
        for (const w of nbrs[v] as number[]) if (comp[w] === -1 && walk[w] && !cut[w]) { comp[w] = id; queue[tail++] = w; }
      }
      id++;
    }
    return comp;
  };
  const cutOf = (hexes: Offset[]) => { const a = new Uint8Array(n); for (const h of hexes) a[idx(h)] = 1; return a; };
  return { idx, nbrs, label, cutOf };
}

/**
 * Yapay zekâ (kural `k66:yarik`): dost ve masum içermeyen, en çok düşmanı kesen hat. Yerleştirilmiş yarıklarla birlikte
 * dostların (yürüyen) düşmana yolunu kesen hat seçilmez. Sonuç `fissureProblem`'den geçer.
 */
export function fissureAim(s: BattleState, actor: Combatant, foes: Combatant[]): { at: Offset; dir: number; hexes: Offset[]; cut: number } | null {
  const b = fissureBudget(s, actor);
  if (!b || !b.open || b.placed >= b.count) return null;
  const friends = Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && (c.side === actor.side || c.civilian));
  const pendingHexes = (s.map?.zones ?? []).filter((z) => z.fissure?.pending?.parentId === b.quake.id)
    .flatMap((z) => z.hexes.filter((h) => convertible(s, h)));
  const walkers = friends.filter((c) => !c.civilian && !isAirborne(c) && !c.summon?.gone && !isIntangible(c));
  const g = walkGrid(s, walkers.map((c) => c.pos as Offset));
  const live = foes.filter((f) => f.pos && f.hp > 0);
  const baseCut = g.cutOf(pendingHexes);
  const before = g.label(baseCut);
  // Hedef: hatta düşmeyecek düşmanların altıgeni ve komşuları (yarığa düşen düşmana yol aranmaz).
  const goalsOf = (cut: Uint8Array) => live.filter((f) => !cut[g.idx(f.pos as Offset)]).flatMap((f) => { const i = g.idx(f.pos as Offset); return [i, ...(g.nbrs[i] as number[])]; });
  const reach = (comp: Int32Array, w: number, goals: number[]) => goals.some((x) => x === w || (comp[w] as number) >= 0 && comp[x] === comp[w]);
  let best: { at: Offset; dir: number; hexes: Offset[]; cut: number } | null = null;
  const seen = new Set<string>();
  const anchors = foes.filter((f) => f.pos && f.hp > 0 && !isAirborne(f) && b.quake.hexes.some((h) => sameHex(h, f.pos as Offset))).map((f) => f.pos as Offset);
  for (const at of anchors) {
    for (let dir = 0; dir < 6; dir++) {
      const hexes = fissureLine(s, b.quake, at, dir, b.spec.widthHexes).filter((h) => convertible(s, h));
      const lineKey = hexes.map(hexKey).sort().join(';');
      if (seen.has(lineKey)) continue;
      seen.add(lineKey);
      if (fissureProblem(s, actor, at, dir)) continue;
      const keys = new Set(hexes.map(hexKey));
      const on = (c: Combatant) => !!c.pos && bodyAt(s, c, c.pos).some((x) => keys.has(hexKey(x)));
      if (friends.some(on)) continue;
      const cut = foes.filter((f) => f.hp > 0 && !isAirborne(f) && on(f)).length;
      if (!cut || (best && cut < best.cut)) continue;
      const allCut = new Uint8Array(baseCut);
      for (const h of hexes) allCut[g.idx(h)] = 1;
      const goals = goalsOf(allCut);
      if (goals.length) {
        let after: Int32Array | null = null;
        const cuts = walkers.some((c) => {
          const w = g.idx(c.pos as Offset);
          if (!reach(before, w, goals)) return false;
          after ??= g.label(allCut);
          return !reach(after, w, goals);
        });
        if (cuts) continue;
      }
      if (!best || cut > best.cut || (cut === best.cut && hexes.length < best.hexes.length)) best = { at, dir, hexes, cut };
    }
  }
  return best;
}

/** Yapay zekâ (kural `k66:tirman`): yarıktan tırmanma komutu (hareket yetiyorsa düşmana en yakın kenara çıkar). */
export function fissureClimbCommand(s: BattleState, actor: Combatant, foes: Combatant[]): { toFt: number; to?: Offset } | null {
  if (!inFissure(s, actor) || !actor.pos) return null;
  const alt = altitudeOf(actor);
  const left = speedHexes(actor) - actor.movementUsed;
  const need = (-alt / 5) * 2;
  if (left >= need + 1) {
    const cost = moveCostFn(s, actor);
    const exits = neighbors(actor.pos, sizeOf(s)).filter((h) => !fissureAt(s, h) && !occupantAt(s, h, actor.id) && cost(h, actor.pos as Offset) !== null
      && need + (cost(h, actor.pos as Offset) as number) <= left);
    const near = (h: Offset) => Math.min(99, ...foes.filter((f) => f.pos && f.hp > 0).map((f) => distance(h, f.pos as Offset)));
    const to = exits.sort((a, b) => near(a) - near(b) || a.row - b.row || a.col - b.col)[0];
    if (to) return { toFt: 0, to };
  }
  const up = Math.min(-5, alt + Math.floor(left / 2) * 5);
  return up > alt ? { toFt: up } : null;
}

// Komut sonu: yarığın dışına çıkan (itme, ışınlanma) yaratığın eksi irtifası sıfırlanır; yarığın üstünde yere inen (uçuşu
// biten, Levitate'i biten) uçmayan yaratık yarığa düşer.
registerCommandEnd((_before, next, _events, _cmd, rng: Rng) => {
  if (!fissureOn(next) || !openFissures(next).length) return [];
  const out: BattleEvent[] = [];
  let s = next;
  for (const c0 of Object.values(next.combatants)) {
    const c = s.combatants[c0.id] as Combatant;
    if (!c.pos || c.hp <= 0 || c.life === 'dead' || c.summon?.gone || isIntangible(c)) continue;
    const alt = altitudeOf(c);
    const fz = fissureAt(s, c.pos);
    if (alt < 0 && !fz) {
      const evs: BattleEvent[] = [{ type: 'altitude_changed', targetId: c.id, altitudeFt: 0, label: 'yarığın dışında' }];
      out.push(...evs); s = applyEvents(s, evs);
    } else if (alt === 0 && fz?.fissure?.depthFt && !isAirborne(c)) {
      const evs = fallInEvents(s, c, fz.fissure.depthFt, rng);
      out.push(...evs); s = applyEvents(s, evs);
    }
  }
  return out;
});
