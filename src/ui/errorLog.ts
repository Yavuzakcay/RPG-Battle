/**
 * Görev K20: arayüz hata günlüğü (Durum ekranında gösterilir). localStorage'da son 20 kayıt; depolama yoksa ya da
 * hata verirse yalnızca konsola yazılır (asla fırlatmaz).
 */
export interface ErrorEntry {
  at: string;
  where: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

const KEY = 'rpg-battle-hatalar';
const MAX = 20;

export function readErrors(store: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): ErrorEntry[] {
  try {
    const raw = store?.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ErrorEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function logError(entry: Omit<ErrorEntry, 'at'>, store: Pick<Storage, 'getItem' | 'setItem'> | undefined = globalThis.localStorage): void {
  const full: ErrorEntry = { at: new Date().toISOString(), ...entry };
  console.error(`[hata] ${full.where}: ${full.message}`, full.context ?? {}, full.stack ?? '');
  try {
    store?.setItem(KEY, JSON.stringify([full, ...readErrors(store)].slice(0, MAX)));
  } catch {
    // depolama yok ya da dolu: yalnızca konsol
  }
}
