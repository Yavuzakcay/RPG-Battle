/**
 * Kuyruk AS1a: soyu isteğe bağlı türlerde (Dwarf, Halfling, Orc, Human) eski kayıt soysuz kalır; "alt soy seç" bildirimi
 * her karakter için yalnızca bir kez gösterilir (bildirilen kimlikler localStorage'da). Bellek yoksa bildirim bu oturumda
 * bir kez (aynı sayfa ömrü boyunca tekrar etmez).
 */
export const LINEAGE_NOTICE_KEY = 'rpg-battle-altsoy-bildirildi';

type Pending = { id?: string; name: string; race: string };
const session = new Set<string>();

const read = (): Set<string> => {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LINEAGE_NOTICE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch { return new Set(); }
};
const write = (set: Set<string>): void => {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(LINEAGE_NOTICE_KEY, JSON.stringify([...set])); } catch { /* bellek yok */ }
};

/** Bildirilmemiş olanları döner ve bildirildi diye işaretler. */
export function newPendingLineages(pending: Pending[]): Pending[] {
  const seen = read();
  const fresh = pending.filter((p) => { const k = p.id ?? p.name; return !seen.has(k) && !session.has(k); });
  if (fresh.length === 0) return [];
  for (const p of fresh) { const k = p.id ?? p.name; seen.add(k); session.add(k); }
  write(seen);
  return fresh;
}
