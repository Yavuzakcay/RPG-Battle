/**
 * Dış içerik paketlerinin saklanması ve uygulanması (Görev E1; Görev AS2 tek kaynak). Kalıcı ana kaynak yerel `icerik/`
 * klasörüdür (masaüstü/yerel derleme; `loadLocalFolder`, her açılışta klasörün güncel hâli); dosya seçiciyle (mobil dahil)
 * ya da masaüstünde klasör seçiciyle içe aktarılan paketler bu tarayıcının `localStorage`'ında (`rpg-battle-icerik`)
 * tutulur. Açılışta hepsi yeniden doğrulanır; geçerli olanların hepsinin alt sınıfları kayda yazılır
 * (`setExternalSubclasses`). Görev AS2: paket aç/kapa, silme, "kopyalarda hangisi kalsın" ve "silinen yeniden gelmesin"
 * listesi yok (alt sınıflar hep seçilebilir); eski kayıtlardaki `enabled: false` yok sayılır. Kod çalıştırılmaz.
 */
import { classData } from '../data';
import { applyPackSubclasses } from './paket';
import { LIMITS, parsePack, summarize, validatePack, type ContentError, type ContentPack, type PackSummary } from './schema';

export const CONTENT_KEY = 'rpg-battle-icerik';

/** `source: 'klasor'`: yerel `icerik/` klasöründen (Kuyruk 20 A1). `enabled` eski kayıt alanı (Görev AS2: okunmaz). */
export interface StoredPack { pack: ContentPack; enabled: boolean; addedAt: string; source?: 'klasor' }
/** Doğrulanmış paket satırı: geçersiz (veri değişti, çakışma) paket de döner, ama uygulanmaz. */
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

/** Oyunun kendi alt sınıf kimlikleri (imza, Karadul): paket bunlarla çakışamaz. */
const ownIds = (): string[] => classData.subclasses.map((x) => x.id);

/** Paketleri sırayla yeniden doğrular (önceki geçerli paketlerin kimlikleri dolu sayılır); hepsi uygulanır (aç/kapa yok). */
export function evaluate(list: StoredPack[]): PackRow[] {
  const taken = ownIds();
  const packs: string[] = [];
  return list.map((entry) => {
    const r = validatePack(entry.pack, { taken, packs });
    packs.push(entry.pack.id);
    if (r.ok) taken.push(...r.pack.subclasses.map((x) => x.id));
    return { ...entry, enabled: true, ...(r.ok ? { pack: r.pack } : {}), summary: summarize(entry.pack), errors: r.ok ? [] : r.errors };
  });
}

/** Bu oturumda yerel `icerik/` klasöründen okunan paketler (`loadLocalFolder`; ham JSON, `evaluate` doğrular). */
let folderPacks: StoredPack[] = [];

/** Uygulanacak paketler: önce klasör (güncel hâli), sonra içe aktarılanlar (klasördekiyle aynı kimlikli eski kopya atlanır). */
export function contentPacks(s: Store = store()): StoredPack[] {
  const ids = new Set(folderPacks.map((p) => p.pack.id));
  return [...folderPacks, ...readStore(s).filter((p) => p.source !== 'klasor' && !ids.has(p.pack.id))];
}

/** Açılışta (sınıf verisinden sonra) ve içerik değişince: geçerli bütün paketlerin alt sınıfları kayda. */
export function applyStoredContent(s: Store = store()): PackRow[] {
  const rows = evaluate(contentPacks(s));
  applyPackSubclasses(rows.filter((r) => r.errors.length === 0).flatMap((r) => r.pack.subclasses));
  return rows;
}

/** Dosya metinlerini içe aktarır: her biri ayrı doğrulanır; çakışan kimlik ve sınır aşımı reddedilir. */
export function importTexts(files: Array<{ name: string; text: string; bytes: number }>, s: Store = store()): ImportResult[] {
  const list = readStore(s).filter((p) => p.source !== 'klasor');
  const out: ImportResult[] = [];
  const folderIds = (): string[] => folderPacks.flatMap((p) => (Array.isArray(p.pack.subclasses) ? p.pack.subclasses.map((x) => x.id) : []));
  for (const f of files) {
    if (list.length + folderPacks.length >= LIMITS.packs) { out.push({ file: f.name, ok: false, errors: [{ code: 'packLimit', path: '$', detail: String(LIMITS.packs) }] }); continue; }
    const taken = [...ownIds(), ...folderIds(), ...list.flatMap((p) => p.pack.subclasses.map((x) => x.id))];
    const r = parsePack(f.text, f.bytes, { taken, packs: [...folderPacks.map((p) => p.pack.id), ...list.map((p) => p.pack.id)] });
    if (!r.ok) { out.push({ file: f.name, ok: false, errors: r.errors }); continue; }
    list.push({ pack: r.pack, enabled: true, addedAt: new Date().toISOString() });
    out.push({ file: f.name, ok: true, packId: r.pack.id, errors: [] });
  }
  if (out.some((r) => r.ok)) writeStore(list, s);
  applyStoredContent(s);
  return out;
}

// ------------------------------------------------------------------ yerel icerik/ klasörü (Kuyruk 20 A1; Görev AS2)

/**
 * Masaüstünde (`npm run dev` / yerel derleme) depo kökündeki `icerik/*.json` dosyaları derlemeye ham metin olarak
 * tembel girer; klasör yoksa (depo, CI, mobil derleme) liste boş. `.gitignore`'da: içerik depoya girmez. Görev AS2:
 * klasör kalıcı ana kaynak: her açılışta bütün dosyalar okunur, doğrulanır ve uygulanır (localStorage'a kopyalanmaz;
 * eski sürümlerin `source: 'klasor'` kopyaları silinir). Bozuk dosya yalnızca sonuçta hata; uygulama bozulmaz.
 */
const LOCAL_FOLDER = import.meta.glob('../../icerik/*.json', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export async function loadLocalFolder(s: Store = store(), loaders: Record<string, () => Promise<string>> = LOCAL_FOLDER): Promise<ImportResult[]> {
  const out: ImportResult[] = [];
  const packs: StoredPack[] = [];
  for (const [path, load] of Object.entries(loaders).sort(([a], [b]) => a.localeCompare(b))) {
    const file = path.split('/').pop() ?? path;
    let text = '';
    try { text = await load(); } catch { continue; }
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > LIMITS.fileBytes) { out.push({ file, ok: false, errors: [{ code: 'size', path: '$', detail: String(LIMITS.fileBytes / 1024) }] }); continue; }
    let raw: unknown;
    try { raw = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) { out.push({ file, ok: false, errors: [{ code: 'json', path: '$', detail: e instanceof Error ? e.message : String(e) }] }); continue; }
    packs.push({ pack: raw as ContentPack, enabled: true, addedAt: '', source: 'klasor' });
  }
  folderPacks = packs;
  // Eski sürümlerin klasör kopyaları (Kuyruk 20: localStorage'a yazılırdı) bayatlar: silinir, klasör her açılışta okunur.
  const stored = readStore(s);
  if (stored.some((p) => p.source === 'klasor')) writeStore(stored.filter((p) => p.source !== 'klasor'), s);
  const rows = applyStoredContent(s);
  for (const r of rows.filter((x) => x.source === 'klasor')) out.push({ file: r.pack.id, ok: r.errors.length === 0, packId: r.pack.id, errors: r.errors });
  return out;
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
