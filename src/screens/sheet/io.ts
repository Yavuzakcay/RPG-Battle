/**
 * Kuyruk KQ4 CK1: karakter dosyası (JSON dışa/içe aktarma) ve indirme/paylaşma yardımcıları. Dosya sürümlü ve tek karakterlidir;
 * boş hikâye alanları yazılmaz. İçe aktarma doğrular: bozuk dosya açık hata kodu verir, çakışan kimlikte "kopya olarak ekle",
 * parti `MAX_PARTY`'yi aşamaz. Saf (DOM gerektiren indirme/paylaşma fonksiyonları ayrı, tarayıcıda).
 */
import { CHARACTER_SAVE_VERSION } from '../../app/storage';
import { MAX_PARTY } from '../../app/limits';
import { savableCharacter, type SavedCharacter } from '../../rules/builder';
import { cleanStory } from '../../rules/story';
import { externalSubclasses } from '../../rules/subclasses';

export const FILE_FORMAT = 'dice-and-hex-karakter';
export const FILE_VERSION = 1;

export interface CharacterFile {
  format: typeof FILE_FORMAT; surum: number; karakterSurum: number;
  /** Alt sınıf/dış içerik bağımlılığı: dosya bu paketler/alt sınıf olmadan "içerik eksik" gösterir. */
  bagimlilik: { altSinif?: string; paketler?: string[] };
  karakter: SavedCharacter;
}

/** Tek karakteri dosya metnine çevirir (boş hikâye alanları yok; taslak alanı yok). */
export function exportCharacter(c: SavedCharacter): string {
  const clean = savableCharacter(c);
  const paketler = [...new Set(externalSubclasses().map((s) => s.pack).filter((x): x is string => !!x))];
  const file: CharacterFile = { format: FILE_FORMAT, surum: FILE_VERSION, karakterSurum: CHARACTER_SAVE_VERSION,
    bagimlilik: { ...(c.sheet.subclassId ? { altSinif: c.sheet.subclassId } : {}), ...(paketler.length ? { paketler } : {}) }, karakter: clean };
  return JSON.stringify(file, null, 2);
}

export type ImportError = 'json' | 'format' | 'version' | 'fields';
export type ParsedImport = { ok: true; character: SavedCharacter; file: CharacterFile } | { ok: false; error: ImportError };

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

export function parseCharacterFile(text: string): ParsedImport {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'json' }; }
  if (!isObj(raw) || raw.format !== FILE_FORMAT || !isObj(raw.karakter)) return { ok: false, error: 'format' };
  if (typeof raw.surum !== 'number' || raw.surum > FILE_VERSION || raw.surum < 1) return { ok: false, error: 'version' };
  const c = raw.karakter;
  const sh = c.sheet;
  const okSheet = isObj(sh) && typeof sh.name === 'string' && typeof sh.raceId === 'string' && typeof sh.classId === 'string'
    && typeof sh.level === 'number' && isObj(sh.baseScores) && typeof sh.armorName === 'string' && Array.isArray(sh.itemNames);
  if (typeof c.id !== 'string' || !c.id || !okSheet || !Array.isArray(c.classSkills) || !Array.isArray(c.otherSkills)) return { ok: false, error: 'fields' };
  const { hikaye, ...rest } = c as unknown as SavedCharacter & { hikaye?: unknown };
  const h = cleanStory(hikaye);
  const character = { ...rest, ...(h ? { hikaye: h } : {}) } as SavedCharacter;
  return { ok: true, character, file: raw as unknown as CharacterFile };
}

/** Listeye ekler: kimlik çakışırsa `asCopy` ile yeni kimlikli kopya (yoksa 'dup'); parti doluysa 'full'. */
export function addImported(list: SavedCharacter[], c: SavedCharacter, asCopy: boolean, newId: () => string): { ok: true; list: SavedCharacter[]; added: SavedCharacter } | { ok: false; error: 'full' | 'dup' } {
  if (list.length >= MAX_PARTY) return { ok: false, error: 'full' };
  const clash = list.some((x) => x.id === c.id);
  if (clash && !asCopy) return { ok: false, error: 'dup' };
  const added = clash ? { ...c, id: newId() } : c;
  return { ok: true, list: [...list, added], added };
}

// ---- Tarayıcı: indirme ve paylaşma (testlenmez) ----

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Web Share (dosya) destekleniyorsa paylaşır; yoksa indirir. Dönüş: 'shared' | 'downloaded'. */
export async function shareOrDownload(blob: Blob, name: string, title: string): Promise<'shared' | 'downloaded'> {
  try {
    const file = new File([blob], name, { type: blob.type });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title }); return 'shared'; }
  } catch { /* iptal ya da desteklenmiyor: indir */ }
  downloadBlob(blob, name);
  return 'downloaded';
}
export const canShareFiles = (): boolean => {
  try { const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }; return !!nav.share && !!nav.canShare?.({ files: [new File([''], 'a.json', { type: 'application/json' })] }); } catch { return false; }
};
