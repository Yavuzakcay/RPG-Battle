/**
 * GECE-KATALOG-KALAN (yalnız görünüm): eşya görsel varyantları (`data/esya-gorsel-varyant.json`). Varsayılan varyant, varyant
 * listesi ve "boss yenilince" kuralı (`bossYenilince`: o canavar kimliği bir savaşta düşman tarafında yenilince görünen varyant;
 * Hex'in Paladin Zırhı → hasarlı). Yenilen bosslar oyuncu profili başına `localStorage` `rpg-battle-boss-yenilgi`: savaşa, kayda
 * ve replay'e girmez, kural sürümünü değiştirmez. Saf çekirdek + ince depo katmanı.
 */
import data from '../../data/esya-gorsel-varyant.json';
import type { BattleState } from '../battle/types';

interface VariantDef { varsayilan: string; varyantlar: Record<string, string>; bossYenilince?: { boss: string; varyant: string } }
const DEFS = (data as unknown as { esyalar: Record<string, VariantDef> }).esyalar;
const KEY = 'rpg-battle-boss-yenilgi';

/** Eşyanın varyantları (yoksa null): anahtar → `public/` altındaki dosya. */
export const itemVariants = (id: string): VariantDef | null => DEFS[id] ?? null;
/** Varyant kuralı olan boss kimlikleri. */
export const variantBosses = (): string[] => [...new Set(Object.values(DEFS).map((d) => d.bossYenilince?.boss).filter((x): x is string => !!x))];

/** Görünen varyant: kuraldaki boss yenildiyse kuralın varyantı, yoksa varsayılan. */
export function currentVariant(id: string, defeated: readonly string[]): string | null {
  const d = DEFS[id];
  if (!d) return null;
  const r = d.bossYenilince;
  return r && defeated.includes(r.boss) && d.varyantlar[r.varyant] ? r.varyant : d.varsayilan;
}

/** Bitmiş savaşta yenilen kurallı bosslar (düşman tarafında, 0 HP ya da ölü; çağrılmış değil). */
export function bossDefeatsIn(state: Pick<BattleState, 'status' | 'combatants'>): string[] {
  if (state.status !== 'finished') return [];
  const want = new Set(variantBosses());
  return [...new Set(Object.values(state.combatants)
    .filter((c) => c.side === 'enemies' && !c.summon && !!c.monsterId && want.has(c.monsterId) && (c.hp <= 0 || c.life === 'dead'))
    .map((c) => c.monsterId as string))];
}

/** Depo: yenilen bosslar (bozuk/eksik veride boş liste). */
export function defeatedBosses(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
/** Depoya ekler (tekrar yazmaz); eklenen var mı. */
export function markBossesDefeated(ids: readonly string[]): boolean {
  if (!ids.length) return false;
  const cur = defeatedBosses();
  const next = [...new Set([...cur, ...ids])];
  if (next.length === cur.length) return false;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* depo yok: görünüm varsayılanda kalır */ }
  return true;
}
