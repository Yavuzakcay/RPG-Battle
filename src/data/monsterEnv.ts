/**
 * Canavar ortamları ve güç kademeleri (`data/monster-ortamlari.json`, docs/CANAVAR-KATEGORILERI.md).
 * Ortam atamaları tematik: GM kurulumunda seçili haritaya uyan canavarlar kademelere ayrılmış
 * gösterilir, "Tüm canavarlar" ile hepsi. Kademe her zaman `monsters.json`'daki gerçek CR'dan hesaplanır.
 */
import envJson from '../../data/monster-ortamlari.json';

export interface MonsterEnv {
  id: string;
  ad: string;
  cr: string;
  crSayi: number;
  tema: string;
  /** Harita kimlikleri; "duz-zemin" haritasız savaş. */
  ortam: string[];
  /** Soğuk iklim canavarı (eski "Buzul dağı" listesi): Dağ'ın kış varyantında öne çıkar. */
  kis?: boolean;
}

/** Haritası olmayan tek ortam: haritasız savaş. */
export const MAPLESS_ENV = 'duz-zemin';

/** Ortam kimliği sorunları: her kimlik gerçek bir harita ya da "duz-zemin" olmalı. */
export function envProblems(entries: readonly MonsterEnv[], mapIds: readonly string[]): string[] {
  const ok = new Set([...mapIds, MAPLESS_ENV]);
  return entries.flatMap((e) => e.ortam.filter((o) => !ok.has(o)).map((o) => `${e.id}: bilinmeyen ortam "${o}"`));
}

export const MONSTER_ENVS: readonly MonsterEnv[] = envJson as MonsterEnv[];
const byId = new Map(MONSTER_ENVS.map((m) => [m.id, m]));

export const monsterEnv = (id: string): MonsterEnv | undefined => byId.get(id);

export interface Tier { id: string; name: string; label: string; min: number; max: number }

export const TIERS: readonly Tier[] = [
  { id: 'ufak', name: 'Ufak', label: 'CR 0–½', min: 0, max: 0.5 },
  { id: 'orta', name: 'Orta', label: 'CR 1–3', min: 1, max: 3 },
  { id: 'guclu', name: 'Güçlü', label: 'CR 4–8', min: 4, max: 8 },
  { id: 'boss', name: 'Boss', label: 'CR 9–14', min: 9, max: 14 },
  { id: 'efsanevi', name: 'Efsanevi', label: 'CR 15+', min: 15, max: Infinity },
];

/** "1/4" → 0.25, "5" → 5. */
export function crNumber(cr: string): number {
  const [a, b] = cr.split('/').map(Number);
  return b ? (a ?? 0) / b : (a ?? 0);
}

export function tierOf(cr: string): Tier {
  const n = crNumber(cr);
  return TIERS.find((t) => n <= t.max) ?? (TIERS[TIERS.length - 1] as Tier);
}

/** Kış varyantında (variant id "kis") öne çıkan soğuk iklim canavarı mı. */
export const winterPick = (monsterId: string, variantId: string): boolean => variantId === 'kis' && byId.get(monsterId)?.kis === true;

/** Canavar bu haritaya uyuyor mu (ortam listesinde yoksa, örn. özel canavar, her haritada gösterilir). */
export function fitsMap(monsterId: string, mapId: string): boolean {
  const e = byId.get(monsterId);
  return !e || e.ortam.includes(mapId);
}
