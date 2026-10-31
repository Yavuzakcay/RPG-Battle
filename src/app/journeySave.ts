/**
 * Görev Y0: yolculuk kaydı. Savaş kaydından ayrı anahtar (`rpg-battle-yolculuk`), kendi sürümü ve yüklenebilir sürüm
 * listesi (`battleSave.ts` kalıbı). Yalnızca olay günlüğü saklanır; durum `replayJourney` ile kurulur. Bulut kaydı Y8.
 */
import { replayJourney } from '../journey/engine';
import type { JourneyEvent, JourneyState } from '../journey/types';

export const JOURNEY_KEY = 'rpg-battle-yolculuk';
export const JOURNEY_VERSION = 1;
export const LOADABLE_JOURNEY_VERSIONS = [1];

interface JourneyFile { version: number; savedAt: string; events: JourneyEvent[] }

export function saveJourney(events: JourneyEvent[], s: Pick<Storage, 'setItem'> = localStorage): void {
  const file: JourneyFile = { version: JOURNEY_VERSION, savedAt: new Date().toISOString(), events };
  try { s.setItem(JOURNEY_KEY, JSON.stringify(file)); } catch { /* depolama dolu ya da yok */ }
}

export function loadJourney(s: Pick<Storage, 'getItem'> = localStorage): { ok: true; events: JourneyEvent[]; state: JourneyState | null } | { ok: false; error: string } {
  try {
    const raw = s.getItem(JOURNEY_KEY);
    if (!raw) return { ok: true, events: [], state: null };
    const file = JSON.parse(raw) as JourneyFile;
    if (!LOADABLE_JOURNEY_VERSIONS.includes(file.version)) return { ok: false, error: `Yolculuk kaydı sürümü desteklenmiyor (${file.version}).` };
    return { ok: true, events: file.events, state: replayJourney(file.events) };
  } catch {
    return { ok: false, error: 'Yolculuk kaydı okunamadı.' };
  }
}

export function clearJourney(s: Pick<Storage, 'removeItem'> = localStorage): void {
  try { s.removeItem(JOURNEY_KEY); } catch { /* yok */ }
}
