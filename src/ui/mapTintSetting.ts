/** Kuyruk 35: yerleşim görünümünün savaş haritasına renk filtresi ayarı (Açık varsayılan; bu cihazda hatırlanır). */
const KEY = 'rpg-battle-harita-renk';

export function storedMapTint(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveMapTint(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
}
