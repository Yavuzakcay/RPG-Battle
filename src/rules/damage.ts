/** Hasar türüne göre direnç, bağışıklık ve zayıflık; HP değişimi. */

export interface DamageProfile {
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  /** Kuyruk 19: hasar yerine iyileştiren türler (canavar yeteneği, `srdK19`). */
  absorb?: string[];
  /** GENEL96 (sürüm 96+; SRD 5.2.1 s. 17 Order of Application): önce direnç, sonra zayıflık (ikisi birden: yarı, sonra iki kat). */
  srdOrder?: boolean;
  /** Görev KATALOG-GUC-TAM D: türe sabit azaltma (Çatlak Element Taşı −3; en az 0), direnç/zayıflıktan sonra. */
  flat?: Record<string, number>;
}

/** Kuyruk 19: `absorbed` (Fire/Lightning/Acid Absorption): hasar yerine o kadar HP (miktar eksi). */
export type DamageNote = 'immune' | 'vulnerable' | 'resistant' | 'absorbed' | null;

const has = (list: string[] | undefined, type: string) =>
  (list ?? []).some((t) => t.trim().toLowerCase() === type);

/** Öncelik: bağışıklık (0), zayıflık (×2), direnç (yarısı, aşağı yuvarlanır); `srdOrder` ile ikisi birlikte SRD sırasıyla. */
export function adjustDamage(
  amount: number,
  type: string | undefined,
  profile: DamageProfile,
): { amount: number; note: DamageNote } {
  const t = (type ?? '').trim().toLowerCase();
  if (t === '') return { amount, note: null };
  if (has(profile.absorb, t)) return { amount: -amount, note: 'absorbed' };
  if (has(profile.immunities, t)) return { amount: 0, note: 'immune' };
  // `*`: her hasar türü (Cehennem Ocağı Plakası −2); tür ve `*` toplanmaz, büyüğü.
  const fl = Math.max(profile.flat?.[t] ?? 0, profile.flat?.['*'] ?? 0);
  if (fl > 0) {
    const r = adjustDamage(amount, type, { ...profile, flat: undefined });
    return r.amount > 0 ? { amount: Math.max(0, r.amount - fl), note: r.note } : r;
  }
  if (has(profile.vulnerabilities, t)) {
    // GENEL96 (sürüm 96+): aynı türe direnç de varsa önce yarıya iner, sonra ikiye katlanır (10 → 5 → 10). 95 ve altı: ×2.
    const base = profile.srdOrder && has(profile.resistances, t) ? Math.floor(amount / 2) : amount;
    return { amount: base * 2, note: 'vulnerable' };
  }
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
