/**
 * Dış içerik paketlerinin saklanması ve uygulanması (Görev E1; tarayıcı). Paketler bu tarayıcının `localStorage`'ında
 * (`rpg-battle-icerik`) tutulur, açılışta yeniden doğrulanır; geçerli ve açık olanların alt sınıfları kayda yazılır
 * (`setExternalSubclasses`). Dosyalar dosya seçiciyle (mobil dahil) ya da masaüstünde klasör seçiciyle
 * (`showDirectoryPicker`, Chromium) okunur; tarayıcı belirli bir klasörü kendiliğinden okuyamaz. Kod çalıştırılmaz.
 */
import { classData } from '../data';
import { setDuplicatePolicy, setExternalSubclasses, type DuplicatePolicy } from '../rules/subclasses';
import { LIMITS, parsePack, summarize, validatePack, type ContentError, type ContentPack, type PackSummary } from './schema';

export const CONTENT_KEY = 'rpg-battle-icerik';
/** Kuyruk 25: SRD ile paket alt sınıf kopyalarında hangisi görünsün (paket | srd | ikisi). */
export const DUPLICATE_KEY = 'rpg-battle-altsinif-kopya';

/** `source: 'klasor'`: yerel `icerik/` klasöründen kendiliğinden yüklendi (Kuyruk 20 A1). */
export interface StoredPack { pack: ContentPack; enabled: boolean; addedAt: string; source?: 'klasor' }
/** Ayarlar ekranındaki satır: geçersiz (veri değişti, çakışma) paket de görünür, ama uygulanmaz. */
export interface PackRow extends StoredPack { summary: PackSummary; errors: ContentError[] }
export interface ImportResult { file: string; ok: boolean; packId?: string; errors: ContentError[] }

type Store = Pick<Storage, 'getItem' | 'setItem'> | null;
const store = (): Store => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

/** Kayıtlı paketler (bozuk kayıt boş liste: uygulama bozulmaz). */
export function readStore(s: Store = store()): StoredPack[] {
  try {
    const raw = s?.getItem(CONTENT_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as { packs?: StoredPack[] };
    return Array.isArray(v.packs) ? v.packs.filter((p) => p && typeof p === 'object' && p.pack && typeof p.pack.id === 'string') : [];
  } catch {
    return [];
  }
}
export function writeStore(list: StoredPack[], s: Store = store()): boolean {
  try { s?.setItem(CONTENT_KEY, JSON.stringify({ version: 1, packs: list })); return true; } catch { return false; }
}

const srdIds = (): string[] => classData.subclasses.map((x) => x.id);

/** Paketleri sırayla yeniden doğrular (önceki paketlerin kimlikleri dolu sayılır); satırlar ve uygulanacak alt sınıflar. */
export function evaluate(list: StoredPack[]): PackRow[] {
  const taken = srdIds();
  const packs: string[] = [];
  return list.map((entry) => {
    const r = validatePack(entry.pack, { taken, packs });
    packs.push(entry.pack.id);
    if (r.ok && entry.enabled) taken.push(...r.pack.subclasses.map((x) => x.id));
    return { ...entry, ...(r.ok ? { pack: r.pack } : {}), summary: summarize(entry.pack), errors: r.ok ? [] : r.errors };
  });
}

/** Açılışta (sınıf verisinden sonra): geçerli ve açık paketlerin alt sınıfları kayda. */
export function applyStoredContent(s: Store = store()): PackRow[] {
  try { setDuplicatePolicy((s?.getItem(DUPLICATE_KEY) ?? 'paket') as DuplicatePolicy); } catch { /* depolama yok */ }
  const rows = evaluate(readStore(s));
  setExternalSubclasses(rows.filter((r) => r.enabled && r.errors.length === 0).flatMap((r) => r.pack.subclasses));
  return rows;
}

/** Dosya metinlerini içe aktarır: her biri ayrı doğrulanır; çakışan kimlik ve sınır aşımı reddedilir. */
export function importTexts(files: Array<{ name: string; text: string; bytes: number }>, s: Store = store(), source?: 'klasor'): ImportResult[] {
  const list = readStore(s);
  const out: ImportResult[] = [];
  for (const f of files) {
    if (list.length >= LIMITS.packs) { out.push({ file: f.name, ok: false, errors: [{ code: 'packLimit', path: '$', detail: String(LIMITS.packs) }] }); continue; }
    const taken = [...srdIds(), ...list.flatMap((p) => p.pack.subclasses.map((x) => x.id))];
    const r = parsePack(f.text, f.bytes, { taken, packs: list.map((p) => p.pack.id) });
    if (!r.ok) { out.push({ file: f.name, ok: false, errors: r.errors }); continue; }
    list.push({ pack: r.pack, enabled: true, addedAt: new Date().toISOString(), ...(source ? { source } : {}) });
    if (!source) writeIgnored(readIgnored(s).filter((x) => x !== r.pack.id), s);
    out.push({ file: f.name, ok: true, packId: r.pack.id, errors: [] });
  }
  if (out.some((r) => r.ok)) writeStore(list, s);
  applyStoredContent(s);
  return out;
}

export function setPackEnabled(id: string, enabled: boolean, s: Store = store()): PackRow[] {
  writeStore(readStore(s).map((p) => (p.pack.id === id ? { ...p, enabled } : p)), s);
  return applyStoredContent(s);
}
export function removePack(id: string, s: Store = store()): PackRow[] {
  const all = readStore(s);
  // Klasörden gelen paket silinince açılışta yeniden yüklenmesin (elle içe aktarınca liste temizlenir).
  if (all.some((p) => p.pack.id === id && p.source === 'klasor')) writeIgnored([...new Set([...readIgnored(s), id])], s);
  writeStore(all.filter((p) => p.pack.id !== id), s);
  return applyStoredContent(s);
}

// ------------------------------------------------------------------ yerel icerik/ klasörü (Kuyruk 20 A1)

/**
 * Masaüstünde (`npm run dev` / yerel derleme) depo kökündeki `icerik/*.json` dosyaları derlemeye ham metin olarak
 * tembel girer; klasör yoksa (depo, CI) liste boş. `.gitignore`'da: içerik depoya ve yayın derlemesine girmez.
 * Açılışta henüz yüklenmemiş ve kullanıcının silmediği paketler aynı doğrulamadan geçip `source: 'klasor'` ile eklenir.
 */
const LOCAL_FOLDER = import.meta.glob('../../icerik/*.json', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
export const IGNORE_KEY = 'rpg-battle-icerik-yoksay';
export function readIgnored(s: Store = store()): string[] {
  try { const v = JSON.parse(s?.getItem(IGNORE_KEY) ?? '[]') as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []; } catch { return []; }
}
function writeIgnored(ids: string[], s: Store = store()): void {
  try { s?.setItem(IGNORE_KEY, JSON.stringify(ids)); } catch { /* depolama kapalı: yok say */ }
}
const packIdOf = (text: string): string | null => { try { const v = JSON.parse(text) as { id?: unknown }; return typeof v.id === 'string' ? v.id : null; } catch { return null; } };

/** Yerel klasördeki yeni paketleri içe aktarır (yüklü ya da silinmiş olanlar atlanır); bozuk dosya yalnızca sonuçta hata. */
export async function loadLocalFolder(s: Store = store(), loaders: Record<string, () => Promise<string>> = LOCAL_FOLDER): Promise<ImportResult[]> {
  const have = new Set([...readStore(s).map((p) => p.pack.id), ...readIgnored(s)]);
  const files: Array<{ name: string; text: string; bytes: number }> = [];
  for (const [path, load] of Object.entries(loaders)) {
    let text = '';
    try { text = await load(); } catch { continue; }
    const id = packIdOf(text);
    if (id && have.has(id)) continue;
    files.push({ name: path.split('/').pop() ?? path, text, bytes: new TextEncoder().encode(text).length });
  }
  return files.length ? importTexts(files, s, 'klasor') : [];
}

// ------------------------------------------------------------------ dosya okuma (tarayıcı)

/** Seçilen dosyalar (yalnızca .json; büyük dosya okunmadan reddedilir). */
export async function readFiles(files: ArrayLike<File>): Promise<Array<{ name: string; text: string; bytes: number }>> {
  const out: Array<{ name: string; text: string; bytes: number }> = [];
  for (const f of Array.from(files)) {
    if (!f.name.toLowerCase().endsWith('.json')) continue;
    out.push({ name: f.name, bytes: f.size, text: f.size > LIMITS.fileBytes ? '' : await f.text() });
  }
  return out;
}

type DirHandle = { values: () => AsyncIterable<{ kind: string; name: string; getFile: () => Promise<File> }> };
/** Masaüstü (Chromium): klasör seçici; klasördeki .json dosyaları. Desteklenmiyorsa null. */
export async function readFolder(): Promise<Array<{ name: string; text: string; bytes: number }> | null> {
  const pick = (globalThis as { showDirectoryPicker?: () => Promise<DirHandle> }).showDirectoryPicker;
  if (!pick) return null;
  const dir = await pick();
  const files: File[] = [];
  for await (const e of dir.values()) if (e.kind === 'file' && e.name.toLowerCase().endsWith('.json')) files.push(await e.getFile());
  return readFiles(files);
}
export const folderSupported = (): boolean => typeof (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';

/** Kuyruk 25: kopya politikasını kaydet ve uygula. */
export function saveDuplicatePolicy(p: DuplicatePolicy, s: Store = store()): void {
  setDuplicatePolicy(p);
  try { s?.setItem(DUPLICATE_KEY, p); } catch { /* depolama yok */ }
}
