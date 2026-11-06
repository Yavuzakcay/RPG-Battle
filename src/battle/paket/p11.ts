/**
 * Kuyruk P11 (kural sürümü 42): ek paket ilkel genişletme 5, hafif bağımlılıklı kısım (büyü yolu `spells.ts` buradan
 * okur; kancalar `p11hooks.ts`). Paketsiz savaşçıda ya da sürüm < 42'de hiçbiri olay üretmez.
 * - İyileştirme zarı (`zarDegistir.kapsam: iyilestirme`): büyü iyileştirmesinin zarları değişir (maks, yenidenAt,
 *   ikiAtSec, zarBuyut, carpan); `healed.rolls` / `changed` olayda.
 * Saf; zar `rng` ile.
 */
import { rollDice, rollDie, rollTag, type Rng } from '../../rules/dice';
import { ruleVersion } from '../ruleVersion';
import { turnKey } from '../economy';
import type { BattleEvent, BattleState, Combatant } from '../types';
import { canPay, costOf, flatNum, kosulOk, usedKey, usedThisTurn, val, type Ilkel, type PaketOzellik } from './core';

export const P11_VERSION = 42;
export const p11On = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= P11_VERSION;

/** Savaşçının paket ilkelleri (özellik + sıra). */
export const prims = (c: Combatant | undefined, tur: string): Array<{ feat: PaketOzellik; p: Ilkel; i: number }> =>
  (c?.paket?.ozellikler ?? []).flatMap((feat) => feat.ilkeller.map((p, i) => ({ feat, p, i }))).filter((x) => x.p.tur === tur);

/** Kaynak + turda bir işaretleri. */
export function payEvents(state: BattleState, c: Combatant, feat: PaketOzellik, p: Ilkel, i: number): BattleEvent[] {
  const k = costOf(c, p);
  return [...(k ? [{ type: 'feature_used' as const, actorId: c.id, feature: k.id, remaining: (c.resources[k.id] ?? 0) - k.cost }] : []),
    ...(p.turdaBir ? [{ type: 'trait_turn' as const, actorId: c.id, trait: usedKey(feat.key, i), key: turnKey(state) }] : [])];
}

/** Zar değişikliği (iyileştirme): yeni zarlar ve fark. */
function changeRolls(mode: string, sides: number, rolls: number[], esik: number, rng: Rng): number[] {
  const tag = rollTag(rng, { kind: 'heal' });
  if (mode === 'maks') return rolls.map(() => sides);
  if (mode === 'yenidenAt') return rolls.map((r) => (r <= esik ? rollDie(sides, tag) : r));
  if (mode === 'zarBuyut') { const up = ({ 4: 6, 6: 8, 8: 10, 10: 12 } as Record<number, number>)[sides] ?? sides; return rolls.map(() => rollDie(up, tag)); }
  if (mode === 'ikiAtSec') { const again = rolls.map(() => rollDie(sides, tag)); return again.reduce((a, b) => a + b, 0) > rolls.reduce((a, b) => a + b, 0) ? again : rolls; }
  if (mode === 'carpan') return [...rolls, ...rolls];
  return rolls;
}

/**
 * Büyü iyileştirmesinin zarı (sürüm 42+, paket `zarDegistir.kapsam: iyilestirme`; yoksa null: çağıran eski yolu kullanır).
 * `out` kaynak/tur olaylarını toplar.
 */
export function paketHealRoll(state: BattleState | undefined, actor: Combatant, expr: string, rng: Rng, out: BattleEvent[]): { total: number; rolls: number[]; changed?: string } | null {
  if (!state || !p11On(state)) return null;
  const refs = prims(actor, 'zarDegistir').filter((x) => val<string>(x.p, 'kapsam') === 'iyilestirme');
  if (!refs.length) return null;
  const d = rollDice(expr, rollTag(rng, { kind: 'heal', by: actor.id }));
  const sides = Number(/d(\d+)/.exec(expr)?.[1] ?? 0);
  for (const r of refs) {
    if (!sides || !d.rolls.length || !canPay(actor, r.p) || !kosulOk(state, actor, r.p) || (r.p.turdaBir && usedThisTurn(state, actor, r.feat.key, r.i))) continue;
    const rolls = changeRolls(r.p.mod as string, sides, d.rolls, flatNum(val(r.p, 'esik'), actor), rng);
    const sum = rolls.reduce((a, b) => a + b, 0);
    if (sum <= d.rolls.reduce((a, b) => a + b, 0)) continue;
    out.push(...payEvents(state, actor, r.feat, r.p, r.i));
    return { total: sum + d.bonus, rolls, changed: (r.p.ad as string | undefined) ?? r.feat.ad };
  }
  return { total: d.total, rolls: d.rolls };
}
