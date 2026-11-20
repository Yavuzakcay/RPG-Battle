/** Ayar "Açıklama simgeleri" (ortak simge setleri, glif): açıklama başlığında ve metninde simgeler. Varsayılan açık; kayıt dışı, bu cihazda. */
const KEY = 'rpg-battle-glif';
let cached: boolean | null = null;

export function storedGlyphs(): boolean {
  if (cached !== null) return cached;
  try {
    cached = localStorage.getItem(KEY) !== 'off';
  } catch {
    cached = true;
  }
  return cached;
}

export function saveGlyphs(on: boolean): void {
  cached = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
}
