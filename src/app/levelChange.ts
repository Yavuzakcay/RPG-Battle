/**
 * Kuyruk K49 B2: Game Master seviye değiştirme (yerel Game Master ekranı; çevrimiçi oda henüz yok). Karakter kâğıdında
 * seviye değişir, kayıtlı durum yeni seviyenin en çoklarına göre uyarlanır (`currentStatus`: harcanan HP/kaynak/slot
 * korunur, yeni kazanılan dolu gelir; HP ortalamayla); değişiklik `levelLog`'a eklenir (yalnızca eklenir, geri alınmaz).
 */
import { currentStatus } from '../rules/characterRest';
import type { SavedCharacter } from '../rules/builder';

export const MAX_LEVEL = 20;

export function changeLevel(c: SavedCharacter, to: number, at: string): SavedCharacter {
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(to)));
  if (level === c.sheet.level) return c;
  const sheet = { ...c.sheet, level };
  const status = c.status ? currentStatus(sheet, c.status) : undefined;
  return { ...c, sheet, ...(status ? { status } : {}), levelLog: [...(c.levelLog ?? []), { from: c.sheet.level, to: level, at, by: 'gm' as const }] };
}
