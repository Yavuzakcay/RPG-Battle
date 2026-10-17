/**
 * Canavar saldırılarının ek etkileri (rider), `data/attack-riders.json` (canavarlarla birlikte tembel yüklenir):
 * - `extra`: her isabette ek hasar (kritikte zarlar ikiye katlanır);
 * - `conditional`: koşullu ek hasar (`advantage`: saldırı avantajlıysa);
 * - `replace`: koşul tutarsa saldırının hasar ifadesi değişir (`advantage`, `targetBloodied`, `selfBloodied`);
 * - süreli durumlar ayrı (`condition-effects.json`, durations.ts); burada yalnızca hasar.
 * Uygulanamayan kısım `unsupported` ve `text` ile işaretli; günlükte "uygulanmadı" diye görünür.
 */
import { attackRiders } from '../data';
import { adjustDamage } from '../rules/damage';
import { rollDice, type Rng, type RollMode } from '../rules/dice';
import type { Combatant, ExtraDamage } from './types';

type When = 'advantage' | 'targetBloodied' | 'selfBloodied';
interface Part { dice: string; type: string }
export interface RiderSpec {
  extra?: Part[];
  conditional?: Array<Part & { when: When }>;
  replace?: Part & { when: When };
  condition?: string;
  unsupported?: string;
  text?: string;
  status: 'uygulandı' | 'kısmen' | 'süreli etki' | 'yok';
}
/** Canavar verisiyle birlikte tembel yüklenir (`loadMonsters`). */
const RIDERS = attackRiders as Record<string, RiderSpec>;

export const riderOf = (monsterId: string | undefined, attackName: string): RiderSpec | undefined =>
  monsterId ? RIDERS[`${monsterId}:${attackName}`] : undefined;
export const allRiders = () => RIDERS;

const bloodied = (c: Combatant) => c.hp <= c.maxHp / 2;
function holds(when: When, mode: RollMode, actor: Combatant, target: Combatant): boolean {
  if (when === 'advantage') return mode === 'advantage';
  return bloodied(when === 'selfBloodied' ? actor : target);
}

/** Koşulu tutan hasar değişimi (yoksa undefined): saldırının hasar zarı ve türü bununla atılır. */
export function riderReplace(spec: RiderSpec | undefined, mode: RollMode, actor: Combatant, target: Combatant): Part | undefined {
  const r = spec?.replace;
  return r && holds(r.when, mode, actor, target) ? { dice: r.dice, type: r.type } : undefined;
}

/** İsabette ek hasarlar (her zaman olanlar ve koşulu tutanlar), hedefin direnç/bağışıklığıyla. */
export function riderExtras(
  spec: RiderSpec | undefined, ctx: { mode: RollMode; critical: boolean; actor: Combatant; target: Combatant }, rng: Rng,
): ExtraDamage[] {
  if (!spec) return [];
  const parts = [...(spec.extra ?? []), ...(spec.conditional ?? []).filter((p) => holds(p.when, ctx.mode, ctx.actor, ctx.target))];
  const profile = { resistances: ctx.target.resistances, immunities: ctx.target.immunities, vulnerabilities: ctx.target.vulnerabilities };
  return parts.map((p) => {
    const r = rollDice(p.dice, rng, ctx.critical);
    const adj = adjustDamage(r.total, p.type, profile);
    return { label: `ek ${p.type}`, rolls: r.rolls, raw: r.total, applied: adj.amount, type: p.type, note: adj.note };
  });
}
