/** Görev DD-Kitap: Ayarlar "Kapak animasyonu" (Dungeondex kapağı; kapalıysa doğrudan açık kitap). Varsayılan açık; yalnız görünüm, kayıt dışı, bu cihazda. */
const KEY = 'rpg-battle-dex-kapak';

export function storedDexCover(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveDexCover(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
}
