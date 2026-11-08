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
import { terrainAt } from './movement';
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
  const at = opts.at ?? c.pos;
  if (ft < 10 || (at && terrainAt(state, at).rule === 'deepWater')) return alt;
  const fr = fallReactions(state, id, ft, rng);
  const after = applyEvents(state, [...fr.events, ...alt]);
  const ev = fallEffect(after.combatants[id] as Combatant, ft, rng, fr);
  causeStats[cause] = (causeStats[cause] ?? 0) + 1;
  return [...fr.events, ...alt, ev];
}
