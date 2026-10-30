/** Savaş sonu başlık videosu ayarı (Görev U3): Açık (varsayılan) / Kapalı; bu cihazda hatırlanır. */
const KEY = 'rpg-battle-son-video';

export function storedEndVideo(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveEndVideo(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
}
