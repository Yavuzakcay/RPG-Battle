/**
 * Özel canavarın CR tahmini (basitleştirilmiş; tablo `data/cr-tahmini.json`, formül DECISIONS.md'de):
 * savunma CR'si HP'den (AC beklenenden her 2 puan farkta bir basamak), saldırı CR'si tur başına
 * ortalama hasardan (saldırı bonusu beklenenden her 2 puan farkta bir basamak); sonuç ikisinin
 * ortalamasına en yakın CR basamağı.
 */
import table from '../../data/cr-tahmini.json';
import { parseDice } from './dice';

export const CR_STEPS: readonly string[] = table.steps;

/** "1/4" → 0.25. */
const num = (cr: string): number => {
  const [a, b] = cr.split('/').map(Number);
  return b ? (a ?? 0) / b : (a ?? 0);
};
const clampIdx = (i: number) => Math.max(0, Math.min(CR_STEPS.length - 1, i));
const idxOf = (cr: string) => CR_STEPS.indexOf(cr);

/** Değeri merdivenden CR'ye çevirir: küçük değerler `low` eşiklerinden, sonra `base`'den `perCr` adımlarla. */
function ladder(value: number, l: { low: Array<[number, string] | (number | string)[]>; base: number; perCr: number }): string {
  for (const [max, cr] of l.low as Array<[number, string]>) if (value <= max) return cr;
  return CR_STEPS[clampIdx(idxOf('1') + Math.floor((value - l.base) / l.perCr))] as string;
}
/** CR'ye göre beklenen değer (AC ya da saldırı bonusu): `[enÇokCR, değer]` listesinden. */
const expected = (cr: string, list: number[][]): number => (list.find(([max]) => num(cr) <= (max ?? 0))?.[1] ?? list[list.length - 1]?.[1] ?? 0);

/** Zar ifadesinin ortalaması ("2d6+3" → 10). */
export function averageDamage(dice: string): number {
  const d = parseDice(dice);
  return d.count * (d.sides + 1) / 2 + d.bonus;
}

export interface CrEstimate { defensive: string; offensive: string; cr: string }

export function estimateCr(m: { hp: number; ac: number; attackBonus: number; damage: string; attacksPerRound?: number }): CrEstimate {
  const step = table.adjustEvery;
  const hpCr = ladder(m.hp, table.hp);
  const defensive = CR_STEPS[clampIdx(idxOf(hpCr) + Math.trunc((m.ac - expected(hpCr, table.expectedAc)) / step))] as string;
  const dpr = averageDamage(m.damage) * (m.attacksPerRound ?? 1);
  const dmgCr = ladder(dpr, table.damage);
  const offensive = CR_STEPS[clampIdx(idxOf(dmgCr) + Math.trunc((m.attackBonus - expected(dmgCr, table.expectedBonus)) / step))] as string;
  const mean = (num(defensive) + num(offensive)) / 2;
  // Ortalamaya en yakın basamak (eşitlikte küçük olan).
  const cr = CR_STEPS.reduce((best, c) => (Math.abs(num(c) - mean) < Math.abs(num(best) - mean) ? c : best), CR_STEPS[0] as string);
  return { defensive, offensive, cr };
}
