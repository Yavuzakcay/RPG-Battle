/**
 * Kuyruk 31: Serüven kaydı. Yolculuk kaydının (`rpg-battle-yolculuk`, sürüm 1) dosyasına isteğe bağlı `seruven` alanı
 * (Serüven olay günlüğü); yolculuk olayları aynen kalır, eski kayıtlar Serüven'siz açılır. Savaş kaydı (v20) değişmez.
 */
import { JOURNEY_KEY, JOURNEY_VERSION } from './journeySave';
import { replaySeruven, type SeruvenEvent, type SeruvenState } from '../journey/seruven';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const NONE: Store = { getItem: () => null, setItem: () => {} };
const local = (): Store => { try { return typeof localStorage === 'undefined' ? NONE : localStorage; } catch { return NONE; } };
interface FileShape { version: number; savedAt: string; events: unknown[]; seruven?: SeruvenEvent[] }

const read = (s: Pick<Storage, 'getItem'>): FileShape | null => {
  try { const raw = s.getItem(JOURNEY_KEY); return raw ? JSON.parse(raw) as FileShape : null; } catch { return null; }
};

export function saveSeruven(events: SeruvenEvent[], s: Store = local()): void {
  const cur = read(s);
  const file: FileShape = { version: cur?.version ?? JOURNEY_VERSION, savedAt: new Date().toISOString(), events: cur?.events ?? [], seruven: events };
  try { s.setItem(JOURNEY_KEY, JSON.stringify(file)); } catch { /* depolama dolu ya da yok */ }
}

export function loadSeruven(s: Pick<Storage, 'getItem'> = local()): { events: SeruvenEvent[]; state: SeruvenState | null } {
  const file = read(s);
  const events = Array.isArray(file?.seruven) ? file.seruven : [];
  try { return { events, state: replaySeruven(events) }; } catch { return { events: [], state: null }; }
}

export function clearSeruven(s: Store = local()): void { saveSeruven([], s); }
