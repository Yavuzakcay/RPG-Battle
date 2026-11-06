/**
 * Kuyruk K58 G1b: keşif defteri. Oyuncu profili başına (karakter ya da kayıt değil) keşfedilen yüzey tepkimeleri
 * (`data/yuzey-etkilesimleri.json` satır kimlikleri) ve kaç kez görüldükleri. Yalnız arayüz durumu: savaş kaydına,
 * replay'e ve motora girmez. Depo `localStorage` (`rpg-battle-kesif`); dışa/içe aktarım JSON. Ayarlar: keşif modu,
 * ipucu rozetleri, önizleme açık/kapalı ve ayrıntı (Kısa/Tam). Saf çekirdek + ince depo katmanı (testte bellek deposu).
 */
import table from '../../data/yuzey-etkilesimleri.json';

export interface DiscoveryStore {
  profil: string;
  profiller: Record<string, { seen: Record<string, number> }>;
}
export interface PreviewSettings {
  /** Game Master anahtarı "Önizleme" (varsayılan açık; kapalıysa eski akış). */
  on: boolean;
  detail: 'kisa' | 'tam';
  /** Keşif modu (varsayılan açık): keşfedilmemiş tepkime önizlemede görünmez. */
  discovery: boolean;
  /** "?" ipucu rozetleri (varsayılan açık). */
  hints: boolean;
}

const KEY = 'rpg-battle-kesif';
const SET_KEY = 'rpg-battle-onizleme';
export const DEFAULT_PROFILE = 'varsayilan';
export const DEFAULT_SETTINGS: PreviewSettings = { on: true, detail: 'kisa', discovery: true, hints: true };

/** Tepkime tablosunun satırları (keşfedilebilir). */
export const REACTION_ROWS: Array<{ id: string; not: string }> = (table as { satirlar: Array<{ id: string; not?: string }> }).satirlar
  .map((r) => ({ id: r.id, not: r.not ?? '' }));
export const REACTION_IDS = new Set(REACTION_ROWS.map((r) => r.id));

export const emptyStore = (): DiscoveryStore => ({ profil: DEFAULT_PROFILE, profiller: { [DEFAULT_PROFILE]: { seen: {} } } });

/** Bozuk/eksik veriyi onarır (bilinmeyen kimlikler atılır). */
export function normalize(raw: unknown): DiscoveryStore {
  const out = emptyStore();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<DiscoveryStore>;
  for (const [name, p] of Object.entries(r.profiller ?? {})) {
    const seen: Record<string, number> = {};
    for (const [id, n] of Object.entries((p as { seen?: Record<string, number> })?.seen ?? {})) if (REACTION_IDS.has(id) && typeof n === 'number' && n > 0) seen[id] = Math.floor(n);
    out.profiller[name] = { seen };
  }
  if (typeof r.profil === 'string' && r.profil) { out.profil = r.profil; out.profiller[r.profil] ??= { seen: {} }; }
  return out;
}

export const seenOf = (s: DiscoveryStore, profil = s.profil): Record<string, number> => s.profiller[profil]?.seen ?? {};
export const isDiscovered = (s: DiscoveryStore, id: string, profil = s.profil): boolean => (seenOf(s, profil)[id] ?? 0) > 0;

/** Görülen tepkimeleri yazar; ilk kez görülenleri döner (keşif anı). */
export function record(s: DiscoveryStore, ids: string[], profil = s.profil): { store: DiscoveryStore; fresh: string[] } {
  const seen = { ...seenOf(s, profil) };
  const fresh: string[] = [];
  for (const id of ids) {
    if (!REACTION_IDS.has(id)) continue;
    if (!seen[id]) fresh.push(id);
    seen[id] = (seen[id] ?? 0) + 1;
  }
  return { store: { ...s, profiller: { ...s.profiller, [profil]: { seen } } }, fresh: [...new Set(fresh)] };
}

export const counts = (s: DiscoveryStore, profil = s.profil): { found: number; total: number } =>
  ({ found: REACTION_ROWS.filter((r) => isDiscovered(s, r.id, profil)).length, total: REACTION_ROWS.length });

export const switchProfile = (s: DiscoveryStore, profil: string): DiscoveryStore =>
  ({ ...s, profil, profiller: { ...s.profiller, [profil]: s.profiller[profil] ?? { seen: {} } } });

// ------------------------------------------------------------------ depo

export function loadStore(): DiscoveryStore {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { return emptyStore(); }
}
export function saveStore(s: DiscoveryStore): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bu oturumda */ }
}
export const exportStore = (s: DiscoveryStore): string => JSON.stringify(s, null, 1);
export const importStore = (text: string): DiscoveryStore => normalize(JSON.parse(text));

export function loadSettings(): PreviewSettings {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SET_KEY) ?? '{}') as Partial<PreviewSettings>) }; } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(p: PreviewSettings): void {
  try { localStorage.setItem(SET_KEY, JSON.stringify(p)); } catch { /* bu oturumda */ }
}

/**
 * Önizlemede bu tepkimeler görünür mü: Game Master (ya da keşif modu kapalı) her şeyi görür; oyuncu yalnız keşfedileni.
 * Dönen `hidden`: gizlenen satırlar (sonuç gösterilmez, yalnız "?" ipucu).
 */
export function visibleReactions(rows: string[], s: DiscoveryStore, set: PreviewSettings, gm: boolean): { shown: string[]; hidden: string[] } {
  if (gm || !set.discovery) return { shown: rows, hidden: [] };
  const shown = rows.filter((r) => !REACTION_IDS.has(r) || isDiscovered(s, r));
  return { shown, hidden: rows.filter((r) => !shown.includes(r)) };
}
