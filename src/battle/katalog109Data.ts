/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güç verisine erişim (`data/katalog-gucler.json`, canavar kimliğine göre).
 * 108 ve altında hiçbir kayıt dönmez (eski kayıt ve replay aynen). Yaprak modül (yalnız veri ve sürüm).
 */
import data from '../../data/katalog-gucler.json';
import { katalog109On } from './katalog109Surum';
import { katalog110On } from './katalog110Surum';
import type { K109Monster } from './katalog109Types';
import type { BattleState } from './types';

const DATA = (data as unknown as { canavarlar: Record<string, K109Monster> }).canavarlar;

/** GECE-KATALOG-KALAN (110): `s110` bloğu kaydın üst anahtarlarının yerine geçer (önbellekli birleşik kayıt). */
const MERGED110 = new Map<string, K109Monster>();
const BASE109 = new Map<string, K109Monster>();
function merged110(id: string, g: K109Monster): K109Monster {
  if (!g.s110) return g;
  let m = MERGED110.get(id);
  if (!m) { const { s110, ...base } = g; m = { ...base, ...s110 }; MERGED110.set(id, m); }
  return m;
}
/** Canavar kimliğinin 109 kaydı (sürüm < 109 ya da kayıt yoksa undefined; 110+ `s110` katmanıyla). */
export function gucOf(s: Pick<BattleState, 'kuralSurumu'> | undefined, monsterId: string | undefined): K109Monster | undefined {
  if (!monsterId || !katalog109On(s)) return undefined;
  const g = DATA[monsterId];
  if (!g) return undefined;
  if (katalog110On(s)) return merged110(monsterId, g);
  if (!g.s110) return g;
  let b = BASE109.get(monsterId);
  if (!b) { const { s110: _x, ...base } = g; b = base; BASE109.set(monsterId, b); }
  return b;
}
/** Bütün kayıtlar (testler ve belgeler için). */
export const allGuc = (): Record<string, K109Monster> => DATA;

/**
 * Savaş başı (ve savaşta eklenen canavarın) 109 süren etkisi: canavar auraları (`auraCore`) ve pasifler (`pasif`: `k109` ve diğer
 * ActiveEffect alanları). Kayıt yoksa undefined. `monsterAbilitySetup` çağırır.
 */
export function k109SetupEffect(s: Pick<BattleState, 'kuralSurumu'>, c: { id: string; name: string; monsterId?: string }): import('./types').ActiveEffect | undefined {
  const g = gucOf(s, c.monsterId);
  if (!g || (!g.auralar?.length && !g.pasif)) return undefined;
  return { ...(g.pasif ?? {}), id: `k109:${c.id}`, name: c.name, sourceId: c.id, ...(g.auralar?.length ? { auras: g.auralar } : {}) } as import('./types').ActiveEffect;
}
/** Savaş başının süreli etkileri (`baslangic`; Groggy Veil): mutlak tura dek. */
export function k109StartEffects(s: Pick<BattleState, 'kuralSurumu'>, c: { id: string; monsterId?: string }): import('./types').ActiveEffect[] {
  return (gucOf(s, c.monsterId)?.baslangic ?? []).map((b, i) => ({ ...b.etki, id: `k109:${c.id}:start:${i}`, sourceId: c.id, until: b.tur }) as import('./types').ActiveEffect);
}

/** Yetenek listesine 109 yamaları (kimliğe göre alan üstüne yazma) ve yeni yetenekler. */
export function k109Abilities<T extends { id: string }>(s: Pick<BattleState, 'kuralSurumu'>, monsterId: string | undefined, list: T[]): T[] {
  const g = gucOf(s, monsterId);
  if (!g || (!g.yetenekler && !g.yetenekEkle)) return list;
  return [...list.map((a) => (g.yetenekler?.[a.id] ? { ...a, ...g.yetenekler[a.id] } as T : a)), ...((g.yetenekEkle ?? []) as unknown as T[])];
}
/** Efsanevi eylem listesine 109 yamaları ve eklemeleri. */
export function k109Legendary<T extends { id: string }>(s: Pick<BattleState, 'kuralSurumu'>, monsterId: string | undefined, list: T[]): T[] {
  const g = gucOf(s, monsterId);
  if (!g?.efsanevi?.length) return list;
  const out = list.map((a) => { const p = g.efsanevi?.find((x) => x.id === a.id && x.patch); return p ? { ...a, ...p.patch } as T : a; });
  for (const x of g.efsanevi) if (x.add) out.push({ id: x.id, ...x.add } as unknown as T);
  return out;
}

/** Sahibine bağlı alanlar (savaş başında; `bagliAlanlar`). */
export function k109SetupZones(s: Pick<BattleState, 'kuralSurumu'>, c: { id: string; side: import('./types').Side; monsterId?: string }): import('./types').SpellZone[] {
  return (gucOf(s, c.monsterId)?.bagliAlanlar ?? []).map((z, i) => ({ id: `k109:${c.id}:bagli:${i}`, spellId: `k109:${z.name}`, name: z.name, casterId: c.id, side: c.side,
    dc: 0, slotLevel: 0, hexes: [], anchorId: c.id, radius: z.radius, spec: z.spec as import('./types').SpellZone['spec'] }));
}
/** Yalnız dost olabilen katalog canavarları (sürümden bağımsız kurulum kuralı). */
export const allyOnlyMonster = (monsterId: string): boolean => !!DATA[monsterId]?.yalnizDost;
