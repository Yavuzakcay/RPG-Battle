/**
 * Kuyruk 19 (srdK19, SRD canavar yetenekleri): yürüyüş adımı kancaları (movement.ts). Fire Form: girdiği yaratığın
 * altıgeninde o yaratığa turda bir 1d10 ateş; Water Susceptibility: suda her 5 ft için 1d6 soğuk. Veri
 * `data/canavar-yetenekleri.json` `passive.fireForm`, `passive.waterSusceptible`.
 */
import data from '../../data/canavar-yetenekleri.json';
import { sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { globalRule } from './ruleControl';
import { damageEffect } from './maprules';
import { terrainAt } from './movement';
import { isLiquidTile } from './deepWater';
import type { BattleEvent, BattleState } from './types';

type P = { fireForm?: { dice: string; type: string }; waterSusceptible?: { dice: string; type: string } };
const DATA = data as unknown as Record<string, { passive?: P }>;

export function monsterStepEvents(state: BattleState, actorId: string, step: Offset, rng: Rng): BattleEvent[] {
  const a = state.combatants[actorId];
  const p = a?.monsterId ? DATA[a.monsterId]?.passive : undefined;
  if (!a || !p || !globalRule(state, 'srdK19')) return [];
  const out: BattleEvent[] = [];
  if (p.fireForm) {
    const o = Object.values(state.combatants).find((c) => c.id !== a.id && c.hp > 0 && c.pos && sameHex(c.pos, step));
    const key = `fireform:${a.id}:${state.round}`;
    if (o && !o.effects?.some((e) => e.id === key)) {
      out.push(damageEffect(o, 'srdK19', `${a.name}: Fire Form`, { dice: p.fireForm.dice, type: p.fireForm.type }, rng),
        { type: 'effect_added', targetId: o.id, effect: { id: key, name: 'Fire Form', sourceId: a.id, until: state.round } });
    }
  }
  if (p.waterSusceptible) {
    const t = terrainAt(state, step);
    if (isLiquidTile(t)) out.push(damageEffect(a, 'srdK19', `${a.name}: Water Susceptibility`, { dice: p.waterSusceptible.dice, type: p.waterSusceptible.type }, rng));
  }
  return out;
}
