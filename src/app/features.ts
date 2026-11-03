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

/** Kuyruk 38: "Üst seviye (6–20)" (Game Master; varsayılan kapalı): oluşturucu ve ilerleme 20. seviyeye dek (Kuyruk 19; önce 10). */
export const upperLevelsEnabled = (): boolean => read().ustSeviye === true;

export function setUpperLevelsEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ustSeviye: on })); } catch { /* depolama yok */ }
}

/** Kuyruk K20: Celestial (Düşmüş) ırkı ev kuralı (Game Master; varsayılan kapalı): oluşturucuda seçilir, yeni savaşlarda `celestialIrki` açık gelir. */
export const celestialEnabled = (): boolean => read().celestial === true;

export function setCelestialEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), celestial: on })); } catch { /* depolama yok */ }
}
