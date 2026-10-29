/**
 * Dış içerik paketlerinin saklanması ve uygulanması (Görev E1; tarayıcı). Paketler bu tarayıcının `localStorage`'ında
 * (`rpg-battle-icerik`) tutulur, açılışta yeniden doğrulanır; geçerli ve açık olanların alt sınıfları kayda yazılır
 * (`setExternalSubclasses`). Dosyalar dosya seçiciyle (mobil dahil) ya da masaüstünde klasör seçiciyle
 * (`showDirectoryPicker`, Chromium) okunur; tarayıcı belirli bir klasörü kendiliğinden okuyamaz. Kod çalıştırılmaz.
 */
import { classData } from '../data';
import { setExternalSubclasses } from '../rules/subclasses';
import { LIMITS, parsePack, summarize, validatePack, type ContentError, type ContentPack, type PackSummary } from './schema';

export const CONTENT_KEY = 'rpg-battle-icerik';

export interface StoredPack { pack: ContentPack; enabled: boolean; addedAt: string }
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
  const rows = evaluate(readStore(s));
  setExternalSubclasses(rows.filter((r) => r.enabled && r.errors.length === 0).flatMap((r) => r.pack.subclasses));
  return rows;
}

/** Dosya metinlerini içe aktarır: her biri ayrı doğrulanır; çakışan kimlik ve sınır aşımı reddedilir. */
export function importTexts(files: Array<{ name: string; text: string; bytes: number }>, s: Store = store()): ImportResult[] {
  const list = readStore(s);
  const out: ImportResult[] = [];
  for (const f of files) {
    if (list.length >= LIMITS.packs) { out.push({ file: f.name, ok: false, errors: [{ code: 'packLimit', path: '$', detail: String(LIMITS.packs) }] }); continue; }
    const taken = [...srdIds(), ...list.flatMap((p) => p.pack.subclasses.map((x) => x.id))];
    const r = parsePack(f.text, f.bytes, { taken, packs: list.map((p) => p.pack.id) });
    if (!r.ok) { out.push({ file: f.name, ok: false, errors: r.errors }); continue; }
    list.push({ pack: r.pack, enabled: true, addedAt: new Date().toISOString() });
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
  writeStore(readStore(s).filter((p) => p.pack.id !== id), s);
  return applyStoredContent(s);
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
