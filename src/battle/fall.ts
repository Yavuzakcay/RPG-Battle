/**
 * Kuyruk K71b (kural sürümü 57+, Görev 2; `K71-PLAN.md` §4.3): düşmenin tek işlevi. SRD 5.2.1 Falling: her 10 ft için 1d6
 * bludgeoning (en çok 20d6), hasar alan Prone; önce düşme tepkileri (Feather Fall, Slow Fall; `fallReactions`), hasar tepkiden
 * sonraki durumdan (direnç, geçici can). Derin suya (`deepWater`) inen hasar almaz (katman atlaması ve itmedeki eski kural
 * bütün nedenlere genişledi; ⚠ SRD suya düşmede tepkiyle yarı hasar verir). İrtifa değişimi (havadan düşüş 0'a, yarığa eksi
 * derinliğe) aynı olay listesinde. Sürüm 56 ve altında çağıranların eski kodu çalışır (bu işlev çağrılmaz).
 */
import type { Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { fallEffect } from './maprules';
import { occupantAt, terrainAt } from './movement';
import { bandOf, cellsOn } from './cells';
import { bodyAt } from './body';
import { hexKey, neighbors, sameHex } from '../rules/hex';
import { fallReactions } from './reactions';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Düşmenin nedeni (ölçüm; günlük metni K68 ile aynı "N ft düştü"). */
export type FallCause = 'atlama' | 'itme' | 'cokme' | 'yarik' | 'irtifa' | 'telekinezi';


/** Kuyruk K71b: düşme sayacı (testler; her çağrı bir düşme). */
export const fallStats = { calls: 0 };
export const causeStats: Partial<Record<FallCause, number>> = {};

/**
 * `ft` feet düşen yaratığın olayları: tepkiler, (verilmişse) irtifa değişimi, düşme hasarı ve Prone. `at`: iniş altıgeni
 * (yoksa yaratığın yeri). 10 ft altı düşme hasarsız (SRD: 1d6 her 10 ft).
 */
export function fall(state: BattleState, id: string, ft: number, cause: FallCause, rng: Rng, opts: { at?: Offset; altitudeTo?: number; label?: string } = {}): BattleEvent[] {
  const c = state.combatants[id];
  if (!c) return [];
  fallStats.calls++;
  const alt: BattleEvent[] = opts.altitudeTo !== undefined ? [{ type: 'altitude_changed', targetId: id, altitudeFt: opts.altitudeTo, label: opts.label ?? 'düştü' }] : [];
  const at0 = opts.at ?? c.pos;
  // Kuyruk K71c (sürüm 58+): iniş hücresi (yere ya da üstteki boş düzeye) başka yaratıkla doluysa en yakın boş altıgene
  // iner; ek hasar yok (DECISIONS.md K71c). Eksi düzeyde (yarık) davranış yok.
  const land = at0 && opts.altitudeTo !== undefined && opts.altitudeTo >= 0 && cellsOn(state) ? landingSpot(state, c, at0, opts.altitudeTo) : null;
  const at = land ?? at0;
  const moved = land && at0 && !sameHex(land, at0) ? land : null;
  if (ft < 10 || (at && terrainAt(state, at).rule === 'deepWater')) {
    return moved ? [...alt, { type: 'map_effect', rule: 'fall', targetId: id, text: `düştü; alttaki hücre dolu, yanına indi`, moveTo: moved }] : alt;
  }
  const fr = fallReactions(state, id, ft, rng);
  const after = applyEvents(state, [...fr.events, ...alt]);
  const ev = fallEffect(after.combatants[id] as Combatant, ft, rng, fr);
  causeStats[cause] = (causeStats[cause] ?? 0) + 1;
  return [...fr.events, ...alt, moved ? { ...ev, moveTo: moved, text: `${ev.text}; alttaki hücre dolu, yanına indi` } : ev];
}

/**
 * Kuyruk K71c: düşenin iniş altıgeni: `at`'te `altFt` düzeyindeki hücreler boşsa `at`; değilse en yakın (3 halkaya dek)
 * girilebilir, gövdenin sığdığı boş altıgen (eşitlikte satır, sütun sırası); hiç yoksa `at` (üst üste biner, ⚠).
 */
export function landingSpot(state: BattleState, c: Combatant, at: Offset, altFt: number): Offset {
  const band = bandOf(c, altFt);
  const free = (h: Offset) => bodyAt(state, c, h).every((b) => {
    const t = terrainAt(state, b);
    return !t.outOfBounds && t.movement !== 'blocked' && !occupantAt(state, b, c.id, band);
  });
  if (free(at)) return at;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const seen = new Set<string>([hexKey(at)]);
  let ring: Offset[] = [at];
  for (let d = 1; d <= 3; d++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) if (!seen.has(hexKey(n))) { seen.add(hexKey(n)); next.push(n); }
    const ok = next.filter(free).sort((a, b) => a.row - b.row || a.col - b.col);
    if (ok.length) return ok[0] as Offset;
    ring = next;
  }
  return at;
}
