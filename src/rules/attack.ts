/** Saldırı ve save çözümleme. Zarlar dışarıdan verilen rastgele üreticiyle atılır. */
import { rollD20, rollDice, type D20Result, type DiceResult, type Rng, type RollMode } from './dice';

export interface AttackInput {
  attackBonus: number;
  targetAc: number;
  mode: RollMode;
  /** Hasar zarı, örneğin "1d8+3". */
  damage: string;
  /** Hedef durumu yüzünden isabet kritik sayılır (Paralyzed gibi). */
  autoCritical?: boolean;
}

export interface AttackResult {
  d20: D20Result;
  total: number;
  hit: boolean;
  critical: boolean;
  /** Doğal 1: her zaman ıska. */
  fumble: boolean;
  damage: DiceResult | null;
}

/**
 * Doğal 20 her zaman isabet eder ve kritiktir. Doğal 1 her zaman ıskalar.
 * Diğer durumlarda toplam, hedefin AC'sine eşit veya büyükse isabet olur.
 * Hasar zarları yalnızca isabette atılır.
 */
export function resolveAttack(input: AttackInput, rng: Rng = Math.random): AttackResult {
  const d20 = rollD20(input.mode, rng);
  const natural = d20.kept;
  const total = natural + input.attackBonus;
  const fumble = natural === 1;
  const hit = natural === 20 || (!fumble && total >= input.targetAc);
  const critical = natural === 20 || (hit && !!input.autoCritical);
  const damage = hit ? rollDice(input.damage, rng, critical) : null;
  return { d20, total, hit, critical, fumble, damage };
}

export interface SaveInput {
  modifier: number;
  dc: number;
  mode: RollMode;
  /** Otomatik başarısız (Paralyzed hedefin STR/DEX save'i gibi). */
  autoFail?: boolean;
}

export interface SaveResult {
  d20: D20Result | null;
  total: number | null;
  success: boolean;
}

/** Save çözümleme: toplam DC'ye eşit veya büyükse başarılı. */
export function resolveSave(input: SaveInput, rng: Rng = Math.random): SaveResult {
  if (input.autoFail) return { d20: null, total: null, success: false };
  const d20 = rollD20(input.mode, rng);
  const total = d20.kept + input.modifier;
  return { d20, total, success: total >= input.dc };
}
