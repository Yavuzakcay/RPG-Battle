/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güç verisine erişim (`data/katalog-gucler.json`, canavar kimliğine göre).
 * 108 ve altında hiçbir kayıt dönmez (eski kayıt ve replay aynen). Yaprak modül (yalnız veri ve sürüm).
 */
import data from '../../data/katalog-gucler.json';
import { katalog109On } from './katalog109Surum';
import type { K109Monster } from './katalog109Types';
import type { BattleState } from './types';

const DATA = (data as unknown as { canavarlar: Record<string, K109Monster> }).canavarlar;

/** Canavar kimliğinin 109 kaydı (sürüm < 109 ya da kayıt yoksa undefined). */
export const gucOf = (s: Pick<BattleState, 'kuralSurumu'> | undefined, monsterId: string | undefined): K109Monster | undefined =>
  (monsterId && katalog109On(s) ? DATA[monsterId] : undefined);
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
