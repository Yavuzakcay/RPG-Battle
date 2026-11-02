/** Kuyruk 44: Game Master ayarı "Şehir görünümü" (yerleşimde üstten görsel; kapalıysa eski hub). Varsayılan açık; kayıt dışı, bu cihazda. */
const KEY = 'rpg-battle-sehir-gorunum';

export function storedCityView(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveCityView(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
}
