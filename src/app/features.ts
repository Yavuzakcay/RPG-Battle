/** Kuyruk 14 Y1: deneysel özellik bayrakları (yerel; varsayılan kapalı). Ana parçada: yalnızca okuma/yazma. */
const KEY = 'rpg-battle-deneysel';

function read(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>; } catch { return {}; }
}

/** Yolculuk (deneme) açık mı. Varsayılan kapalı: ana menüde giriş görünmez, mevcut davranış aynı. */
export const journeyEnabled = (): boolean => read().yolculuk === true;

export function setJourneyEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), yolculuk: on })); } catch { /* depolama yok */ }
}
