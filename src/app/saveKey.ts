/** Kayıtlı savaşın depolama anahtarı ve var mı denetimi: savaş motorunu yüklemeden (giriş ekranı, ana parça). */
export const SAVE_KEY = 'rpg-battle-save';

type Store = Pick<Storage, 'getItem'>;
const store = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function hasSavedBattle(s: Store | null = store()): boolean {
  try { return !!s?.getItem(SAVE_KEY); } catch { return false; }
}
