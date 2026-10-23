/** Saldırı ve save çözümleme. Zarlar dışarıdan verilen rastgele üreticiyle atılır. */
import { rollD20, rollDice, rollTag, type D20Result, type DiceResult, type Rng, type RollKind, type RollMode } from './dice';

/**
 * Zar eklentisi (Görev R2; Bless +1d4, Bane −1d4): d20'nin ardından atılır, toplama eklenir (doğal 20/1 değişmez).
 * `label` günlükte görünen kaynak (büyü adı); `effectId`/`holderId` tek kullanımlık etkinin tüketilmesi için.
 */
export interface ExtraDie { label: string; die: string; sign: 1 | -1; effectId?: string; holderId?: string; single?: boolean }
/** Atılmış eklenti zarı: işaretli değer (−1d4 ise negatif). */
export interface RolledExtra { label: string; die: string; value: number; effectId?: string; holderId?: string; single?: boolean }

/** Eklenti zarlarını atar (d20'nin ardından, aynı türde zar isteğiyle). */
export function rollExtras(extra: ExtraDie[] | undefined, kind: RollKind, rng: Rng): RolledExtra[] {
  return (extra ?? []).map((x) => {
    const v = rollDice(x.die, rollTag(rng, { kind })).total;
    const { sign, ...rest } = x;
    return { ...rest, value: sign * v };
  });
}
export const extrasTotal = (xs: RolledExtra[] | undefined): number => (xs ?? []).reduce((n, x) => n + x.value, 0);

export interface AttackInput {
  attackBonus: number;
  targetAc: number;
  mode: RollMode;
  /** Hasar zarı, örneğin "1d8+3". */
  damage: string;
  /** Hedef durumu yüzünden isabet kritik sayılır (Paralyzed gibi). */
  autoCritical?: boolean;
  /** Hasar zarında bundan küçük değer bu sayılır (Great Weapon Fighting: 1 ve 2 → 3). */
  minDie?: number;
  /** Saldırı zarına eklenti zarları (Bless, Bane). */
  extra?: ExtraDie[];
}

/** Hasar zarlarında en düşük değer: küçük zarlar `min` sayılır, toplam yeniden hesaplanır. */
export function withMinDie(d: DiceResult, min: number | undefined): DiceResult {
  if (!min) return d;
  const rolls = d.rolls.map((r) => Math.max(r, min));
  return { ...d, rolls, total: rolls.reduce((n, r) => n + r, 0) + d.bonus };
}

export interface AttackResult {
  d20: D20Result;
  total: number;
  hit: boolean;
  critical: boolean;
  /** Doğal 1: her zaman ıska. */
  fumble: boolean;
  damage: DiceResult | null;
  /** Atılan eklenti zarları (toplama dahil). */
  extra?: RolledExtra[];
}

/**
 * Doğal 20 her zaman isabet eder ve kritiktir. Doğal 1 her zaman ıskalar.
 * Diğer durumlarda toplam, hedefin AC'sine eşit veya büyükse isabet olur.
 * Hasar zarları yalnızca isabette atılır.
 */
export function resolveAttack(input: AttackInput, rng: Rng = Math.random): AttackResult {
  const d20 = rollD20(input.mode, rollTag(rng, { kind: 'attack', bonus: input.attackBonus }));
  const natural = d20.kept;
  const extra = rollExtras(input.extra, 'attack', rng);
  const total = natural + input.attackBonus + extrasTotal(extra);
  const fumble = natural === 1;
  const hit = natural === 20 || (!fumble && total >= input.targetAc);
  const critical = natural === 20 || (hit && !!input.autoCritical);
  const damage = hit ? withMinDie(rollDice(input.damage, rollTag(rng, { kind: 'damage' }), critical), input.minDie) : null;
  return { d20, total, hit, critical, fumble, damage, ...(extra.length ? { extra } : {}) };
}

export interface SaveInput {
  modifier: number;
  dc: number;
  mode: RollMode;
  /** Otomatik başarısız (Paralyzed hedefin STR/DEX save'i gibi). */
  autoFail?: boolean;
  /** Save zarına eklenti zarları (Bless, Bane). */
  extra?: ExtraDie[];
}

export interface SaveResult {
  d20: D20Result | null;
  total: number | null;
  success: boolean;
  extra?: RolledExtra[];
}

/** Save çözümleme: toplam DC'ye eşit veya büyükse başarılı. */
export function resolveSave(input: SaveInput, rng: Rng = Math.random): SaveResult {
  if (input.autoFail) return { d20: null, total: null, success: false };
  const d20 = rollD20(input.mode, rollTag(rng, { kind: 'save', bonus: input.modifier }));
  const extra = rollExtras(input.extra, 'save', rng);
  const total = d20.kept + input.modifier + extrasTotal(extra);
  return { d20, total, success: total >= input.dc, ...(extra.length ? { extra } : {}) };
}
