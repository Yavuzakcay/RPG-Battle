/** Kayıtlı savaşın depolama anahtarı ve var mı denetimi: savaş motorunu yüklemeden (giriş ekranı, ana parça). */
export const SAVE_KEY = 'rpg-battle-save';

type Store = Pick<Storage, 'getItem'>;
const store = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function hasSavedBattle(s: Store | null = store()): boolean {
  try { return !!s?.getItem(SAVE_KEY); } catch { return false; }
}

/** Görev M1: kayıtlı savaşın kısa özeti (giriş ekranı kartı): harita, varyant, tur, kayıt zamanı. Motor yüklenmez. */
export interface SaveSummary { mapId?: string; variantId?: string; round: number; savedAt?: string }

export function savedBattleSummary(s: Store | null = store()): SaveSummary | null {
  try {
    const raw = s?.getItem(SAVE_KEY);
    if (!raw) return null;
    const file = JSON.parse(raw) as { savedAt?: string; events?: Array<{ type?: string; round?: number; state?: { round?: number; map?: { id?: string; variantId?: string } } }> };
    const events = file.events ?? [];
    const first = events[0]?.state;
    let round = first?.round ?? 1;
    for (const e of events) if (e.type === 'turn_ended' && typeof e.round === 'number') round = Math.max(round, e.round);
    return { ...(first?.map?.id ? { mapId: first.map.id } : {}), ...(first?.map?.variantId ? { variantId: first.map.variantId } : {}), round, ...(file.savedAt ? { savedAt: file.savedAt } : {}) };
  } catch {
    return null;
  }
}
