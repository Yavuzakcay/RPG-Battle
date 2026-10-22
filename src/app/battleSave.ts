/**
 * Savaşı kaydet/yükle (tek kayıt yuvası). Yalnızca olay günlüğü saklanır; yüklerken olaylar
 * baştan oynatılır (`replay`) ve aynı durum üretilir. Kayıt sürümlüdür: bilinmeyen sürüm, bozuk
 * JSON ya da oynatılamayan günlük hata fırlatmaz, "yüklenemedi" sonucu döner.
 */
import { replay, type BattleEvent } from '../battle';
import { createSession, type Session } from '../ui/session';

export const SAVE_KEY = 'rpg-battle-save';
/**
 * Kayıt biçimi sürümü. 7: sınıf kaynakları kimlik → sayı kaydı (`resources`: yalnızca sahip olunan kaynaklar,
 * `feature_used.feature` kaynak kimliği; Görev N) ve savaşa yaralı başlayan karakterler (başlangıç HP/kaynak/slot). 6: gizlenme olayında gözcü (`hide_attempted.watcherId`), bitişikteki düşmanın fark etmesi (`revealed`). 5: zar kaydı (`dice_rolled` olayı: atılan ve elle girilen zarlar) ve `state.diceMode`. 4: masum görünümü (`civilian_art` olayı, `gorselId`). 3: yakalama, ayağa kalkma, süreli hasar (`grappled`, `grapple_ended`, `grapple_escape`, `stood_up`). 2: süreli durumlar (`conditionTimers`, `condition_timer/save/ended` olayları),
 * Kaçın ve Yardım. Eski sürümler oynatılmaz: "yüklenemedi".
 */
export const SAVE_VERSION = 7;
/**
 * Yüklenebilen sürümler: her sürümün olayları bir sonrakinin alt kümesi. 3: görünümü olmayan masumlar tohumlu
 * varsayılana düşer. 3–4: zar modu yok (otomatik), zar kaydı yok. 3–6: kaynaklar üç alanlı nesne (sıfırlar dahil);
 * yeni kayıt biçimiyle aynı okunur (olmayan kaynak 0).
 */
export const LOADABLE_VERSIONS: readonly number[] = [3, 4, 5, 6, 7];

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
    if (!LOADABLE_VERSIONS.includes(file.version as number)) return { ok: false, error: `Kayıt yüklenemedi: sürüm ${String(file.version)} desteklenmiyor.` };
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
