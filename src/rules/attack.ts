/** Saldırı ve save çözümleme. Zarlar dışarıdan verilen rastgele üreticiyle atılır. */
import { rollD20, rollDice, rollTag, type D20Result, type DiceResult, type Rng, type RollKind, type RollMode } from './dice';

/**
 * Zar eklentisi (Görev R2; Bless +1d4, Bane −1d4): d20'nin ardından atılır, toplama eklenir (doğal 20/1 değişmez).
 * `label` günlükte görünen kaynak (büyü adı); `effectId`/`holderId` tek kullanımlık etkinin tüketilmesi için.
 */
export interface ExtraDie {
  label: string; die: string; sign: 1 | -1; effectId?: string; holderId?: string; single?: boolean;
  /**
   * Görev F: başarısız zarın ardından (eklenti olarak atılmaz). `d20`: yeniden at, `rerollBonus` ekle (Indomitable);
   * `twenty`: zar 20 sayılır (Stroke of Luck); `onFail`: `die` kadar ekle, tutarsa harca (Tactical Mind). Kullanılınca
   * `resource` harcanır (reducer, `holderId`).
   */
  reroll?: 'd20' | 'twenty' | 'onFail';
  rerollBonus?: number;
  resource?: string;
}
/** Atılmış eklenti zarı: işaretli değer (−1d4 ise negatif). `resource`: kullanılan kaynak (Görev F). */
export interface RolledExtra { label: string; die: string; value: number; effectId?: string; holderId?: string; single?: boolean; resource?: string }

/** Eklenti zarlarını atar (d20'nin ardından, aynı türde zar isteğiyle). */
export function rollExtras(extra: ExtraDie[] | undefined, kind: RollKind, rng: Rng): RolledExtra[] {
  return (extra ?? []).filter((x) => !x.reroll).map((x) => {
    const v = rollDice(x.die, rollTag(rng, { kind })).total;
    const { sign, ...rest } = x;
    return { ...rest, value: sign * v };
  });
}

/**
 * Başarısız zar sonrası ikinci şans (Görev F; Indomitable, Stroke of Luck, Tactical Mind): ilk uygun giriş kullanılır.
 * Yeni toplam ve günlük girişi (değer: toplamdaki fark; kaynak yalnızca harcandıysa).
 */
export function secondChance(
  extra: ExtraDie[] | undefined, fail: { total: number; natural: number; bonus: number; need: number; mode: RollMode; kind: RollKind }, rng: Rng,
): { total: number; natural: number; entry: RolledExtra } | null {
  const x = (extra ?? []).find((e) => e.reroll);
  if (!x) return null;
  // Görev BARD: tek kullanımlık etkinin zarı (Bardic Inspiration) atılınca etki biter (reducer: `single` + `effectId`).
  const base = { label: x.label, ...(x.holderId ? { holderId: x.holderId } : {}), ...(x.single && x.effectId ? { single: true, effectId: x.effectId } : {}) };
  if (x.reroll === 'onFail') {
    const v = rollDice(x.die, rollTag(rng, { kind: fail.kind })).total;
    const total = fail.total + v;
    return { total, natural: fail.natural, entry: { ...base, die: x.die, value: v, ...(total >= fail.need && x.resource ? { resource: x.resource } : {}) } };
  }
  const natural = x.reroll === 'twenty' ? 20 : rollD20(fail.mode, rollTag(rng, { kind: fail.kind, bonus: fail.bonus })).kept;
  const total = fail.total - fail.natural + natural + (x.rerollBonus ?? 0);
  return { total, natural, entry: { ...base, die: x.reroll === 'twenty' ? '20' : 'd20', value: total - fail.total, ...(x.resource ? { resource: x.resource } : {}) } };
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
  /** Görev F: kritik vuruş eşiği (Improved Critical 19, Superior Critical 18); yoksa 20. */
  critOn?: number;
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
  let natural = d20.kept;
  const extra = rollExtras(input.extra, 'attack', rng);
  let total = natural + input.attackBonus + extrasTotal(extra);
  const fumble = natural === 1;
  const crit = (n: number) => n >= Math.min(20, input.critOn ?? 20);
  let hit = crit(natural) || (!fumble && total >= input.targetAc);
  // Görev F: ıskada ikinci şans (Stroke of Luck: zar 20 sayılır).
  if (!hit) {
    const again = secondChance(input.extra, { total, natural, bonus: input.attackBonus, need: input.targetAc, mode: input.mode, kind: 'attack' }, rng);
    if (again) { natural = again.natural; total = again.total; extra.push(again.entry); hit = crit(natural) || (natural !== 1 && total >= input.targetAc); }
  }
  const critical = crit(natural) || (hit && !!input.autoCritical);
  const damage = hit ? withMinDie(rollDice(input.damage, rollTag(rng, { kind: 'damage' }), critical), input.minDie) : null;
  return { d20, total, hit, critical, fumble: fumble && !hit, damage, ...(extra.length ? { extra } : {}) };
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
  let total = d20.kept + input.modifier + extrasTotal(extra);
  // Görev F: başarısız save'de ikinci şans (Indomitable, Stroke of Luck).
  if (total < input.dc) {
    const again = secondChance(input.extra, { total, natural: d20.kept, bonus: input.modifier, need: input.dc, mode: input.mode, kind: 'save' }, rng);
    if (again) { total = again.total; extra.push(again.entry); }
  }
  return { d20, total, success: total >= input.dc, ...(extra.length ? { extra } : {}) };
}
