/**
 * Kuyruk K71c (kural sürümü 58+; kullanıcı kararı): birleşik (altıgen + düzey) uçuş hareketi. `move` komutunun isteğe bağlı
 * `toFt` alanı: uçuş hızı olan yaratık hedef altıgene ve hedef irtifaya tek komutla gider.
 *
 * - Yol (altıgen, düzey) uzayında A* (sezgisel: max(altıgen uzaklığı, düzey farkı), tutarlı): yatay adım, düzey adımı
 *   (5 ft) ve çapraz adım (altıgen + düzey) TEK adımdır; uzaklık max(yatay, dikey) (K9). Yatay ve çapraz adımın maliyeti
 *   varış düzeyindeki zemin/alan maliyeti (`moveCostFn` o irtifada: engel tepesi K71a, altıgen tavanı, düşman hücresi).
 * - Düzey 0 ile üst sınır (açık gökte `ucusUstFt`, tavanlıda tavan − boy) arası; eksi düzeye uçulmaz.
 * - Düşman hücresinden geçilmez; dost hücresinden geçilir. Varış: engel altıgeni değil (tepede durulmaz, K5), hücreler boş.
 * - Her adımda 3B fırsat saldırısı (`opportunityAttacks` irtifalı adım); yeni altıgene girişte zemin/alan/aura olayları
 *   (`executeMove` ile aynı). Yarıda kesilirse son durulabilen düğüme geri sarılır.
 * - Olaylar: `moved` (girilen altıgenler, toplam maliyet) + `altitude_changed` (son irtifa); yeni olay türü yok.
 * Saf; zar `rng` ile.
 */
import type { Rng } from '../rules/dice';
import { distance, hexKey, neighbors, sameHex, type Offset } from '../rules/hex';
import { altitudeCapFt, altitudeOf, bodyHeightFt, climbingAloft } from './altitude';
import { katlarOf, slabBetween, slabsAt, standHeights } from './stand';
import { bodyAt, covers } from './body';
import { bandOf, bandsOverlap, cellsOn, levelOf, levelToFt } from './cells';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { obstacleTopFt } from './cover';
import { afterStepEvents } from './turnHooks';
import { auraStepEvents, opportunityAttacks, withPos } from './features';
import { flySpeed } from './flight';
import { monsterStepEvents } from './monsterSteps';
import { bodyEnterEvents, checkMover, hexLabel, moveCostFn, occupantAt, terrainAt } from './movement';
import { applyEvents, speedHexes } from './reduce';
import { zoneStepEvents } from './zones';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Düğüm: altıgen ve düzey. */
export interface AirNode { hex: Offset; level: number }
interface Step extends AirNode { cost: number }

const nk = (h: Offset, l: number) => `${h.col},${h.row},${l}`;
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });

/** Kuyruk K71c: hava yolu araması sayacı (ölçüm ve testler). */
export const airStats = { searches: 0, nodes: 0 };

/** Uçuş hızıyla birleşik hareket edebilir mi (sürüm 58+). */
export const canAirMove = (state: BattleState, c: Combatant): boolean => cellsOn(state) && flySpeed(c) > 0 && !climbingAloft(c);

/** Düzey sınırları ve maliyet işlevleri (arama başına önbellek). */
function searchCtx(state: BattleState, actor: Combatant) {
  // Tek maliyet işlevi, değişken irtifa (`AltRef`): düzey başına yeniden kurulum yok.
  const dyn = { ft: 0 };
  const fn = moveCostFn(state, actor, dyn);
  const fnAt = (l: number) => (h: Offset, prev: Offset) => { dyn.ft = levelToFt(l); return fn(h, prev); };
  const caps = new Map<string, number>();
  const capAt = (h: Offset) => {
    const k = hexKey(h);
    let v = caps.get(k);
    if (v === undefined) { v = levelOf(altitudeCapFt(state, { ...actor, pos: h })); caps.set(k, v); }
    return v;
  };
  const others = Object.values(state.combatants).filter((c) => c.id !== actor.id && c.pos && isTargetable(c) && !c.summon?.noSpace);
  // Kuyruk K72 (sürüm 60+): kat döşemesi düzey geçişini keser (merdiven ve delik dışında); gövde döşemenin içinde olamaz.
  const kat = katlarOf(state).length > 0;
  const boy = bodyHeightFt(actor);
  const slabOk = (fromHex: Offset, fl: number, h: Offset, l: number): boolean => {
    if (!kat) return true;
    const a = levelToFt(fl), b = levelToFt(l);
    if (slabBetween(state, h, a, b) || slabBetween(state, fromHex, a, b)) return false;
    for (const f of slabsAt(state, h)) if (b < f && f < b + boy) return false;
    return true;
  };
  /** (h, l) düzeyinde yaratığın hücresi: düşman engel (geçilmez), dost geçilir (durulmaz). */
  const blockedBy = (h: Offset, l: number, foesOnly: boolean) => {
    const band = bandOf(actor, levelToFt(l));
    return others.find((c) => (!foesOnly || c.side !== actor.side) && covers(state, c, h) && bandsOverlap(bandOf(c), band));
  };
  return { fnAt, capAt, blockedBy, slabOk };
}

/** (h, l) üstünde durulabilir mi: engel altıgeni değil, hücreler boş, sınır içinde. */
function canStop(state: BattleState, actor: Combatant, h: Offset, l: number, capAt: (h: Offset) => number): string | null {
  if (l < 0 || l > capAt(h)) return `İrtifa 0–${levelToFt(capAt(h))} ft olmalı.`;
  for (const b of bodyAt(state, actor, h)) {
    const t = terrainAt(state, b);
    if (t.outOfBounds) return 'Harita dışına çıkılamaz.';
    // Kuyruk K72 (sürüm 60+): sur tepesinde (duruş yüzeyi) durulur.
    if (t.movement === 'blocked' && !(t.flyersPass && l > 0) && !standHeights(state, b).includes(levelToFt(l))) return `${hexLabel(b)} üzerinde durulmaz (${t.name}).`;
    const o = occupantAt(state, b, actor.id, bandOf(actor, levelToFt(l)));
    if (o) return `${hexLabel(b)} dolu (${o.name}).`;
  }
  return null;
}

/** Basit ikili yığın (en küçük `f`). */
class Heap<T extends { f: number; g: number; seq: number }> {
  private a: T[] = [];
  get size() { return this.a.length; }
  push(x: T) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (less(a[p] as T, x)) break; a[i] = a[p] as T; i = p; } a[i] = x; }
  pop(): T | undefined {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0] as T;
    const last = a.pop() as T;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && less(a[l] as T, a[m] as T)) m = l;
        if (r < a.length && less(a[r] as T, a[m] as T)) m = r;
        if (m === i) break;
        const x = a[i] as T; a[i] = a[m] as T; a[m] = x; i = m;
      }
    }
    return top;
  }
}
// Eşit `f`'de derin düğüm (büyük `g`) önce: Chebyshev uzayındaki çok sayıdaki eşit yol açılmadan hedefe iner.
const less = (x: { f: number; g: number; seq: number }, y: { f: number; g: number; seq: number }) => x.f < y.f || (x.f === y.f && (x.g > y.g || (x.g === y.g && x.seq < y.seq)));

/** (from, l0) → (to, lt) en ucuz hava yolu (bütçe içinde) ya da null. */
export function airPath(state: BattleState, actor: Combatant, from: Offset, l0: number, to: Offset, lt: number, budget: number): { path: Step[]; cost: number } | null {
  airStats.searches++;
  const size = sizeOf(state);
  const { fnAt, capAt, blockedBy, slabOk } = searchCtx(state, actor);
  const h0 = (h: Offset, l: number) => Math.max(distance(h, to), Math.abs(l - lt));
  const g = new Map<string, number>([[nk(from, l0), 0]]);
  const prev = new Map<string, Step & { from: string }>();
  const open = new Heap<{ hex: Offset; level: number; g: number; f: number; seq: number }>();
  let seq = 0;
  open.push({ hex: from, level: l0, g: 0, f: h0(from, l0), seq: seq++ });
  const goal = nk(to, lt);
  while (open.size) {
    const cur = open.pop() as { hex: Offset; level: number; g: number; f: number; seq: number };
    const ck = nk(cur.hex, cur.level);
    if (cur.g > (g.get(ck) ?? Infinity)) continue;
    airStats.nodes++;
    if (ck === goal) {
      const path: Step[] = [];
      let k: string | undefined = goal;
      while (k && prev.has(k)) { const p = prev.get(k) as Step & { from: string }; path.unshift({ hex: p.hex, level: p.level, cost: p.cost }); k = p.from; }
      return { path, cost: cur.g };
    }
    const tryStep = (h: Offset, l: number, c: number | null) => {
      if (c === null || !slabOk(cur.hex, cur.level, h, l)) return;
      const ng = cur.g + c;
      if (ng > budget) return;
      const key = nk(h, l);
      if (ng >= (g.get(key) ?? Infinity)) return;
      g.set(key, ng);
      prev.set(key, { hex: h, level: l, cost: c, from: ck });
      open.push({ hex: h, level: l, g: ng, f: ng + h0(h, l), seq: seq++ });
    };
    // Düzey adımı (aynı altıgen): engel altıgeninin içinde (tepesinin altında) olunmaz; düşman hücresinden geçilmez.
    for (const dl of [-1, 1]) {
      const l = cur.level + dl;
      if (l < 0 || l > capAt(cur.hex)) continue;
      const t = terrainAt(state, cur.hex);
      if (t.movement === 'blocked' && !t.flyersPass && levelToFt(l) < obstacleTopFt(state, cur.hex, t)) continue;
      if (blockedBy(cur.hex, l, true)) continue;
      tryStep(cur.hex, l, 1);
    }
    // Yatay ve çapraz adım: varış düzeyinin maliyeti.
    for (const n of neighbors(cur.hex, size)) {
      for (const dl of [0, -1, 1]) {
        const l = cur.level + dl;
        if (l < 0 || l > capAt(n)) continue;
        tryStep(n, l, fnAt(l)(n, cur.hex));
      }
    }
  }
  return null;
}

/** Arayüz ve YZ: `level` düzeyinde bu tur varılabilen durulabilir altıgenler (maliyetiyle). */
export function airReach(state: BattleState, actor: Combatant, level: number): Array<{ to: Offset; cost: number }> {
  if (!actor.pos || !canAirMove(state, actor)) return [];
  const budget = speedHexes(actor) - actor.movementUsed;
  if (budget <= 0) return [];
  const size = sizeOf(state);
  const { fnAt, capAt, blockedBy, slabOk } = searchCtx(state, actor);
  const l0 = levelOf(altitudeOf(actor));
  // Düzey eksenli Dijkstra (bütçe sınırlı; düğüm sayısı küçük).
  const best = new Map<string, number>([[nk(actor.pos, l0), 0]]);
  const open = new Heap<{ hex: Offset; level: number; g: number; f: number; seq: number }>();
  let seq = 0;
  open.push({ hex: actor.pos, level: l0, g: 0, f: 0, seq: seq++ });
  while (open.size) {
    const cur = open.pop() as { hex: Offset; level: number; g: number; f: number; seq: number };
    if (cur.g > (best.get(nk(cur.hex, cur.level)) ?? Infinity)) continue;
    const push = (h: Offset, l: number, c: number | null) => {
      if (c === null || !slabOk(cur.hex, cur.level, h, l)) return;
      const ng = cur.g + c;
      const k = nk(h, l);
      if (ng > budget || ng >= (best.get(k) ?? Infinity)) return;
      best.set(k, ng);
      open.push({ hex: h, level: l, g: ng, f: ng, seq: seq++ });
    };
    for (const dl of [-1, 1]) {
      const l = cur.level + dl;
      if (l < 0 || l > capAt(cur.hex)) continue;
      const t = terrainAt(state, cur.hex);
      if (t.movement === 'blocked' && !t.flyersPass && levelToFt(l) < obstacleTopFt(state, cur.hex, t)) continue;
      if (blockedBy(cur.hex, l, true)) continue;
      push(cur.hex, l, 1);
    }
    for (const n of neighbors(cur.hex, size)) for (const dl of [0, -1, 1]) {
      const l = cur.level + dl;
      if (l < 0 || l > capAt(n)) continue;
      push(n, l, fnAt(l)(n, cur.hex));
    }
  }
  const out: Array<{ to: Offset; cost: number }> = [];
  for (const [k, cost] of best) {
    const [col, row, l] = k.split(',').map(Number) as [number, number, number];
    if (l !== level || cost === 0) continue;
    const h = { col, row };
    if (!canStop(state, actor, h, l, capAt)) out.push({ to: h, cost });
  }
  return out;
}

/** Birleşik uçuş hareketi (`move` + `toFt`, sürüm 58+). */
export function executeAirMove(state: BattleState, actor: Combatant, to: Offset, toFt: number, rng: Rng): CommandResult {
  if (!cellsOn(state)) return fail('Birleşik (altıgen + düzey) hareket bu kural sürümünde yok.');
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  if (!canAirMove(state, actor)) return fail('Birleşik hareket yalnız uçuş hızıyla (tırmanan ve uçmayan ayrı komutla).');
  if (!Number.isFinite(toFt) || toFt < 0 || toFt % 5 !== 0) return fail('Hedef irtifa 0 ya da üstü, 5 ft adımla.');
  const l0 = levelOf(altitudeOf(actor));
  const lt = levelOf(toFt);
  if (sameHex(from, to) && l0 === lt) return fail('Zaten orada.');
  const { capAt } = searchCtx(state, actor);
  const why = canStop(state, actor, to, lt, capAt);
  if (why) return fail(why);
  const budget = speedHexes(actor) - actor.movementUsed;
  const plan = airPath(state, actor, from, l0, to, lt, budget);
  if (!plan) {
    const any = airPath(state, actor, from, l0, to, lt, Infinity);
    if (!any) return fail(`${hexLabel(to)} (${toFt} ft) için hava yolu yok.`);
    return fail(`Hareket yetmiyor: ${any.cost} altıgen gerekli, ${Math.max(0, budget)} kaldı.`);
  }
  const effects: BattleEvent[] = [];
  let current = state;
  const down = () => ((current.combatants[actor.id] as Combatant).hp <= 0);
  const setAlt = (s: BattleState, ft: number) => applyEvents(s, [{ type: 'altitude_changed', targetId: actor.id, altitudeFt: ft, label: '' }]);
  const walked: Step[] = [];
  let prev: AirNode = { hex: from, level: l0 };
  for (const step of plan.path) {
    const oa = opportunityAttacks(current, actor.id, { from: prev.hex, to: step.hex, fromAlt: levelToFt(prev.level), toAlt: levelToFt(step.level) }, rng);
    effects.push(...oa);
    current = applyEvents(current, oa);
    if (down()) break;
    if (oa.length && speedHexes(current.combatants[actor.id] as Combatant) === 0) break;
    walked.push(step);
    const moved = !sameHex(step.hex, prev.hex);
    current = setAlt(moved ? withPos(current, actor.id, step.hex) : current, levelToFt(step.level));
    let stop = false;
    if (moved) {
      const me = current.combatants[actor.id] as Combatant;
      const entered = bodyEnterEvents(current, me, prev.hex, step.hex, rng);
      effects.push(...entered.events); current = applyEvents(current, entered.events);
      const aura = down() ? [] : auraStepEvents(current, actor.id, prev.hex, step.hex, rng);
      effects.push(...aura); current = applyEvents(current, aura);
      const zoned = down() ? [] : zoneStepEvents(current, actor.id, prev.hex, step.hex, rng);
      effects.push(...zoned); current = applyEvents(current, zoned);
      const formed = down() ? [] : monsterStepEvents(current, actor.id, step.hex, rng);
      effects.push(...formed); current = applyEvents(current, formed);
      const stepped = down() ? [] : afterStepEvents(current, actor.id, prev.hex, rng);
      effects.push(...stepped); current = applyEvents(current, stepped);
      stop = entered.stop || (stepped.length > 0 && speedHexes(current.combatants[actor.id] as Combatant) === 0);
    }
    prev = step;
    if (stop || down()) break;
  }
  // Yarıda kesilen yürüyüş: son durulabilen düğüme geri (engel tepesinde ya da dolu hücrede durulmaz).
  while (walked.length && canStop(state, actor, (walked[walked.length - 1] as Step).hex, (walked[walked.length - 1] as Step).level, capAt)) walked.pop();
  const spent = walked.reduce((n, s) => n + s.cost, 0);
  const hexes: Offset[] = [];
  let last = from;
  for (const s of walked) if (!sameHex(s.hex, last)) { hexes.push(s.hex); last = s.hex; }
  const endLevel = walked.length ? (walked[walked.length - 1] as Step).level : l0;
  const out: BattleEvent[] = [];
  if (hexes.length) out.push({ type: 'moved', actorId: actor.id, path: hexes, cost: spent });
  if (endLevel !== l0 || (!hexes.length && spent > 0)) {
    out.push({ type: 'altitude_changed', targetId: actor.id, altitudeFt: levelToFt(endLevel), label: 'Uçuş', ...(hexes.length ? {} : { cost: spent }), byId: actor.id, gentle: false });
  }
  return finish(state, [...out, ...effects]);
}
