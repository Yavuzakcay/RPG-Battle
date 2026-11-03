/** Hasar türüne göre direnç, bağışıklık ve zayıflık; HP değişimi. */

export interface DamageProfile {
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  /** Kuyruk 19: hasar yerine iyileştiren türler (canavar yeteneği, `srdK19`). */
  absorb?: string[];
}

/** Kuyruk 19: `absorbed` (Fire/Lightning/Acid Absorption): hasar yerine o kadar HP (miktar eksi). */
export type DamageNote = 'immune' | 'vulnerable' | 'resistant' | 'absorbed' | null;

const has = (list: string[] | undefined, type: string) =>
  (list ?? []).some((t) => t.trim().toLowerCase() === type);

/** Öncelik: bağışıklık (0), zayıflık (×2), direnç (yarısı, aşağı yuvarlanır). */
export function adjustDamage(
  amount: number,
  type: string | undefined,
  profile: DamageProfile,
): { amount: number; note: DamageNote } {
  const t = (type ?? '').trim().toLowerCase();
  if (t === '') return { amount, note: null };
  if (has(profile.absorb, t)) return { amount: -amount, note: 'absorbed' };
  if (has(profile.immunities, t)) return { amount: 0, note: 'immune' };
  if (has(profile.vulnerabilities, t)) return { amount: amount * 2, note: 'vulnerable' };
  if (has(profile.resistances, t)) return { amount: Math.floor(amount / 2), note: 'resistant' };
  return { amount, note: null };
}

/** Save başarılıysa bazı büyülerde hasar yarıya iner (aşağı yuvarlanır). */
export function halfDamage(amount: number): number {
  return Math.floor(amount / 2);
}

export function applyDamage(hp: number, amount: number): number {
  return Math.max(0, hp - amount);
}

export function applyHealing(hp: number, maxHp: number, amount: number): number {
  return Math.min(maxHp, hp + amount);
}
