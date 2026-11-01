/**
 * Kuyruk 29 K22: Çöl harita mekanikleri (kural sürümü 9; haritadaki kuralda `surum: 9`, Game Master anahtarı ve
 * parametreleri `data/kural-kontrol.json`). Kuralı olmayan haritada hiçbiri çalışmaz; yeni olay türü yok.
 * - `flashFlood` (Kanyon Nehri): Game Master tetikler ya da `autoRound` turunda kendiliğinden; `warnRounds` tur uyarı,
 *   sonra nehir (`from`, varsayılan w) `widen` altıgen genişler; taşan ve nehirdeki yaratıklar STR save, başarısızsa hasar
 *   ve akış yönünde (`dir`) bir altıgen itilir. Lav yükselmesinin su sürümü (tek sefer).
 * - Fırtınada rüzgâr (`sandstorm` + `wind`, sürüm 9): rüzgâr yönüne atışın normal menzili `downwindRangeHexes` uzar, rüzgâra
 *   karşı atış dezavantajlı. `sandstorm.kind`: kum (varsayılan) ya da kar (kar körlüğü; yalnızca adlar).
 * - `rottenDeck` (Gemi Enkazı): listedeki tahtalara (p) giren (uçmayan) yaratığın altında tahta çöker: DEX save,
 *   başarısızsa hasar + Prone, yürüyüş biter; tahta `to` zemine döner; `compartment` altıgeninde gizli bölme notu.
 * - `wormAmbush` (Vaha): `emergeRound` turunun başında kumda (`sand` zeminleri) duran, yuvaya (`lair`) en yakın parti
 *   üyesinin yanından SRD Ankheg çıkar; hedef Algı (WIS) DC ile titreşimi sezerse kaçar, sezmezse yakalanır (Grappled,
 *   kaçış DC). Bir tur önce "yer titriyor" notu. Kumda kimse yoksa ilk uygun turu bekler.
 * Saf; zarlar rng'den.
 */
import { distance, neighbors, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { getMonster } from '../data';
import { combatantFromMonster } from './create';
import { checkEffect, nearestSolid, ruleHex, ruleOf, saveEffect } from './maprules';
import { applyEvents } from './reduce';
import { isAirborne } from './flight';
import { forcedMoveEvents, pushOutcome } from './forced';
import { WIND_VEC, windDir } from './forest';
import { downwind } from './wilds';
import type { BattleEvent, BattleState, Combatant } from './types';

const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);
const OFF = 'Bu harita mekaniği kapalı (Game Master) ya da bu savaşta yok.';
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const tileCh = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col] ?? '#';
const standing = (s: BattleState) => Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.gone);
const hexList = (s: BattleState, raw: unknown): Offset[] => (Array.isArray(raw) ? raw : []).map((xy) => ruleHex(s, xy));
const v9 = (s: BattleState) => (s.kuralSurumu ?? 1) >= 9;

// ---------------------------------------------------------------------------------------------
// Fırtınada rüzgâr

const center = (h: Offset) => ({ x: 1.5 * h.col, y: Math.sqrt(3) * (h.row + (h.col & 1 ? 0.5 : 0)) });
/** Atışın rüzgârla hizası (−1 karşı … 1 arkadan); fırtına + rüzgâr yoksa null. */
function stormAlign(state: BattleState, from: Offset, to: Offset): number | null {
  if (!v9(state) || !ruleOf(state, 'sandstorm')) return null;
  const dir = windDir(state);
  const v = dir ? WIND_VEC[dir] : undefined;
  if (!v) return null;
  const a = center(from); const b = center(to);
  const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
  return (dx * v.x + dy * v.y) / len;
}
/** Rüzgâr yönüne atış: normal menzil eki (ft). */
export function stormRangeBonusFt(state: BattleState, from: Offset, to: Offset): number {
  const a = stormAlign(state, from, to);
  return a !== null && a > 0.5 ? num(ruleOf(state, 'sandstorm')?.downwindRangeHexes, 2) * 5 : 0;
}
/** Fırtınada rüzgâra karşı atış (dezavantaj). */
export const stormAgainstWind = (state: BattleState, from: Offset, to: Offset): boolean => {
  const a = stormAlign(state, from, to);
  return a !== null && a < -0.5;
};
/** Fırtınanın adı (kum ya da kar). */
export const stormName = (r: Record<string, unknown> | undefined): string => (r?.kind === 'kar' ? 'Kar fırtınası' : 'Kum fırtınası');

// ---------------------------------------------------------------------------------------------
// Ani sel

/** Game Master: seli tetikler (uyarı; `warnRounds` tur sonra gelir). */
export function floodTrigger(state: BattleState): BattleEvent[] | string {
  const r = ruleOf(state, 'flashFlood');
  if (!r) return OFF;
  if (state.map?.floodRound !== undefined) return 'Sel zaten uyarıldı ya da geldi.';
  return floodWarn(state, r);
}
function floodWarn(state: BattleState, r: Record<string, unknown>): BattleEvent[] {
  const warn = Math.max(1, num(r.warnRounds, 1));
  return [{ type: 'map_note', text: `Kanyonun yukarısından gürültü: ${warn} tur sonra sel geliyor!`, floodRound: state.round + warn }];
}

function floodEvents(state: BattleState, r: Record<string, unknown>, rng: Rng): BattleEvent[] {
  const from = str(r.from, 'w');
  const widen = Math.max(1, num(r.widen, 2));
  const size = sizeOf(state);
  const water: Offset[] = [];
  state.map?.tiles.forEach((row, r0) => [...row].forEach((ch, col) => { if (ch === from) water.push({ col, row: r0 }); }));
  const keep = new Set(['#', 's', from]);
  const fresh: Offset[] = [];
  const seen = new Set(water.map((h) => `${h.col},${h.row}`));
  let ring = water;
  for (let i = 0; i < widen; i++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) {
      const k = `${n.col},${n.row}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (keep.has(tileCh(state, n))) continue;
      next.push(n); fresh.push(n);
    }
    ring = next;
  }
  const out: BattleEvent[] = [{ type: 'map_note', text: `Ani sel! Nehir ${widen} altıgen taştı.`, floodRound: 0 },
    ...fresh.map((at): BattleEvent => ({ type: 'tile_changed', at, to: from }))];
  let s = applyEvents(state, out);
  const wet = [...water, ...fresh];
  const flow = windDir(s) && !r.dir ? (windDir(s) as string) : str(r.dir, 'SE');
  for (const c0 of standing(s)) {
    if (isAirborne(c0) || !wet.some((h) => sameHex(h, c0.pos as Offset))) continue;
    const ev = saveEffect(c0, 'flashFlood', 'sel sürüklüyor', 'str', num(r.dc, 12), rng, { hit: { dice: str(r.damage, '1d6'), type: 'bludgeoning' } });
    out.push(ev); s = applyEvents(s, [ev]);
    const c = s.combatants[c0.id] as Combatant;
    if (ev.type !== 'map_effect' || ev.roll?.success || c.hp <= 0 || !c.pos) continue;
    const to = downwind(s, c.pos, flow);
    if (!to) continue;
    const res = pushOutcome(s, c, c.pos, to);
    if (res.ok) { const evs = forcedMoveEvents(s, c.id, res, 'harita', rng); out.push(...evs); s = applyEvents(s, evs); }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Kum solucanı pususu

const WORM_ID = 'kum-solucani';
function wormEvents(state: BattleState, r: Record<string, unknown>, rng: Rng): BattleEvent[] {
  if (state.combatants[WORM_ID]) return [];
  const at = num(r.emergeRound, 3);
  const sand = new Set(Array.isArray(r.sand) ? (r.sand as string[]) : ['.', 'd']);
  const lair = ruleHex(state, r.lair);
  const prey = standing(state).filter((c) => c.side === 'party' && !c.civilian && !c.summon && !isAirborne(c) && sand.has(tileCh(state, c.pos as Offset)))
    .sort((a, b) => distance(a.pos as Offset, lair) - distance(b.pos as Offset, lair) || a.id.localeCompare(b.id));
  if (state.round === at - 1) return prey.length ? [{ type: 'map_note', text: 'Kumun altından boğuk bir titreşim geliyor…' }] : [];
  if (state.round < at || !prey.length) return [];
  const target = prey[0] as Combatant;
  const out: BattleEvent[] = [];
  const sense = checkEffect(target, 'wormAmbush', 'kumdaki titreşimi seziyor', 'perception', num(r.dc, 12), rng, state);
  out.push(sense);
  let s = applyEvents(state, out);
  const spot = neighbors(target.pos as Offset, sizeOf(s)).find((h) => sand.has(tileCh(s, h)) && !standing(s).some((c) => sameHex(c.pos as Offset, h)))
    ?? nearestSolid(s, target.pos as Offset, target.id);
  if (!spot) return out;
  const mon = getMonster(str(r.monster, 'ankheg'));
  const worm = { ...combatantFromMonster(mon, { id: WORM_ID, name: `${mon.name} (kumdan)` }), side: 'enemies' as const, pos: spot, initiative: 0 };
  out.push({ type: 'map_note', text: sense.roll?.success ? `${target.name} titreşimi sezdi: kumdan çıkan yaratıktan sıçrayıp kurtuldu!` : `Kumdan bir yaratık fırladı ve ${target.name} hedefini yakaladı!` },
    { type: 'summoned', ownerId: 'harita', spell: 'Kum pususu', combatant: worm, index: s.order.length });
  if (!sense.roll?.success) {
    out.push({ type: 'grappled', targetId: target.id, by: WORM_ID, escapeDc: num(r.escapeDc, 13), restrained: false, label: `${mon.name} kavradı` });
  }
  s = applyEvents(state, out);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Bağlantılar

/** Yeni tur: sel (kendiliğinden uyarı ve sel) ve kum solucanı pususu. */
export function desertRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  if (!state.map) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  const flood = ruleOf(s, 'flashFlood');
  if (flood) {
    const auto = num(flood.autoRound, 0);
    if (auto > 0 && s.map?.floodRound === undefined && s.round >= auto) push(floodWarn(s, flood));
    if (s.map?.floodRound && s.map.floodRound === s.round) push(floodEvents(s, flood, rng));
  }
  const worm = ruleOf(s, 'wormAmbush');
  if (worm) push(wormEvents(s, worm, rng));
  return out;
}

/** Çürük güverte: listedeki sağlam tahtaya giren çökmeyle karşılaşır. */
export function desertEnterEvents(state: BattleState, c: Combatant, at: Offset, rng: Rng): BattleEvent[] {
  const deck = ruleOf(state, 'rottenDeck');
  if (!deck || isAirborne(c) || tileCh(state, at) !== 'p' || !hexList(state, deck.hexes).some((h) => sameHex(h, at))) return [];
  const mover = { ...c, pos: at };
  const out: BattleEvent[] = [{ type: 'tile_changed', at, to: str(deck.to, '.') }];
  out.push(saveEffect(mover, 'rottenDeck', 'çürük tahta çöktü', 'dex', num(deck.dc, 12), rng,
    { hit: { dice: str(deck.damage, '1d6'), type: 'bludgeoning' }, onFailCondition: 'Prone', stopOnFail: true }));
  if (deck.compartment && sameHex(ruleHex(state, deck.compartment), at)) {
    out.push({ type: 'map_note', text: 'Çöken tahtanın altında gizli bir bölme var (Game Master: içerik).' });
  }
  return out;
}
