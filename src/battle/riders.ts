/**
 * Canavar saldırılarının ek etkileri (rider), `data/attack-riders.json` (canavarlarla birlikte tembel yüklenir):
 * - `extra`: her isabette ek hasar (kritikte zarlar ikiye katlanır);
 * - `conditional`: koşullu ek hasar (`advantage`: saldırı avantajlıysa);
 * - `replace`: koşul tutarsa saldırının hasar ifadesi değişir (`advantage`, `targetBloodied`, `selfBloodied`);
 * - süreli durumlar ayrı (`condition-effects.json`, durations.ts); burada yalnızca hasar.
 * Uygulanamayan kısım `unsupported` ve `text` ile işaretli; günlükte "uygulanmadı" diye görünür.
 */
import { attackRiders } from '../data';
import type { Ability } from '../rules/abilities';
import { adjustDamage } from '../rules/damage';
import { chargeHolds, fitsSize } from './grapple';
import { rollDice, type Rng, type RollMode } from '../rules/dice';
import type { Combatant, ExtraDamage } from './types';

type When = 'advantage' | 'targetBloodied' | 'selfBloodied' | 'charge';
interface Part { dice: string; type: string }
type Save = { ability: Ability; dc: number };
export interface RiderSpec {
  extra?: Part[];
  conditional?: Array<Part & { when: When }>;
  replace?: Part & { when: When; feet?: number };
  /** Hücum: `feet`+ ft düz koşup bitişik hedefe vurursa ek hasar ve/veya Prone. */
  charge?: { feet: number; maxSize?: string; extra?: Part[]; prone?: boolean; save?: Save };
  /** Yakalama (kaçış DC; kavrama sürerken Restrained). */
  grapple?: { escapeDc: number; maxSize?: string; restrained: boolean };
  /** Yere düşürme (boyut sınırı, kurtarma zarı). */
  prone?: { maxSize?: string; save?: Save };
  /** Süreli durumlar (elle tanım condition-effects.json'da yoksa). */
  conditions?: Array<{ condition: string; owner?: 'source' | 'target'; end?: 'turnStart' | 'turnEnd'; rounds?: number; saveEnds?: Save; maxRounds?: number }>;
  /** Durumlardan önce hedefin kurtarma zarı. */
  conditionSave?: Save;
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
function holds(when: When, mode: RollMode, actor: Combatant, target: Combatant, feet = 20): boolean {
  if (when === 'advantage') return mode === 'advantage';
  if (when === 'charge') return chargeHolds(actor, target, feet);
  return bloodied(when === 'selfBloodied' ? actor : target);
}

/** Koşulu tutan hasar değişimi (yoksa undefined): saldırının hasar zarı ve türü bununla atılır. */
export function riderReplace(spec: RiderSpec | undefined, mode: RollMode, actor: Combatant, target: Combatant): Part | undefined {
  const r = spec?.replace;
  return r && holds(r.when, mode, actor, target, r.feet) ? { dice: r.dice, type: r.type } : undefined;
}

/** İsabette ek hasarlar (her zaman olanlar ve koşulu tutanlar), hedefin direnç/bağışıklığıyla. */
export function riderExtras(
  spec: RiderSpec | undefined, ctx: { mode: RollMode; critical: boolean; actor: Combatant; target: Combatant }, rng: Rng,
): ExtraDamage[] {
  if (!spec) return [];
  const ch = spec.charge;
  const charged = ch?.extra && fitsSize(ctx.target, ch.maxSize) && chargeHolds(ctx.actor, ctx.target, ch.feet) ? ch.extra : [];
  const parts = [...(spec.extra ?? []), ...(spec.conditional ?? []).filter((p) => holds(p.when, ctx.mode, ctx.actor, ctx.target)), ...charged];
  const profile = { resistances: ctx.target.resistances, immunities: ctx.target.immunities, vulnerabilities: ctx.target.vulnerabilities };
  return parts.map((p) => {
    const r = rollDice(p.dice, rng, ctx.critical);
    const adj = adjustDamage(r.total, p.type, profile);
    return { label: `ek ${p.type}`, rolls: r.rolls, raw: r.total, applied: adj.amount, type: p.type, note: adj.note };
  });
}
