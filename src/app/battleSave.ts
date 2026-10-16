/**
 * Savaşı kaydet/yükle (tek kayıt yuvası). Yalnızca olay günlüğü saklanır; yüklerken olaylar
 * baştan oynatılır (`replay`) ve aynı durum üretilir. Kayıt sürümlüdür: bilinmeyen sürüm, bozuk
 * JSON ya da oynatılamayan günlük hata fırlatmaz, "yüklenemedi" sonucu döner.
 */
import { replay, type BattleEvent } from '../battle';
import { createSession, type Session } from '../ui/session';

export const SAVE_KEY = 'rpg-battle-save';
/**
 * Kayıt biçimi sürümü. 2: süreli durumlar (`conditionTimers`, `condition_timer/save/ended` olayları),
 * Kaçın ve Yardım. Eski sürümler oynatılmaz: "yüklenemedi".
 */
export const SAVE_VERSION = 2;

interface SaveFile { version: number; savedAt: string; events: BattleEvent[] }
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const store = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function serializeSession(session: Session, now = new Date()): string {
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now.toISOString(), events: session.events };
  return JSON.stringify(file);
}

export type Restored = { ok: true; session: Session; savedAt: string } | { ok: false; error: string };

export function restoreSession(text: string | null): Restored {
  if (!text) return { ok: false, error: 'Kayıt yok.' };
  try {
    const file = JSON.parse(text) as Partial<SaveFile>;
    if (file.version !== SAVE_VERSION) return { ok: false, error: `Kayıt yüklenemedi: sürüm ${String(file.version)} desteklenmiyor.` };
    if (!Array.isArray(file.events) || file.events.length === 0) return { ok: false, error: 'Kayıt yüklenemedi: olay günlüğü boş.' };
    const state = replay(file.events);
    return { ok: true, session: createSession(state, file.events), savedAt: file.savedAt ?? '' };
  } catch {
    return { ok: false, error: 'Kayıt yüklenemedi: dosya bozuk.' };
  }
}

/** Kaydeder; depolama yoksa ya da doluysa false. */
export function saveBattle(session: Session, s: Store | null = store()): boolean {
  if (!s) return false;
  try { s.setItem(SAVE_KEY, serializeSession(session)); return true; } catch { return false; }
}

export function loadBattle(s: Store | null = store()): Restored {
  if (!s) return { ok: false, error: 'Kayıt yüklenemedi: depolama kullanılamıyor.' };
  try { return restoreSession(s.getItem(SAVE_KEY)); } catch { return { ok: false, error: 'Kayıt yüklenemedi.' }; }
}

export function hasSavedBattle(s: Store | null = store()): boolean {
  try { return !!s?.getItem(SAVE_KEY); } catch { return false; }
}
