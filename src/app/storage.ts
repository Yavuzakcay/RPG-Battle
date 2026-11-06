/**
 * Kayıtlı karakterler (tek cihaz): tarayıcı belleğinde. Bellek yoksa veya bozuksa boş liste
 * döner, kayıt sessizce yalnızca oturumda kalır. Online sürümde sunucuya taşınacak.
 */
import type { SavedCharacter } from '../rules/builder';

const KEY = 'rpg-battle-characters';
/** Kuyruk K51: karakter kayıt sürümü (2: hizalanma alanı). Eski kayıtta alan yok = 1; açılış aynı (alan yoksa 0/0). */
export const CHARACTER_SAVE_VERSION = 2;
let memory: SavedCharacter[] | null = null;

export function loadCharacters(): SavedCharacter[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const list = JSON.parse(raw) as unknown;
      if (Array.isArray(list)) return list as SavedCharacter[];
    }
  } catch {
    // Bellek yok ya da bozuk.
  }
  return memory ?? [];
}

export function saveCharacters(list: SavedCharacter[]): void {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.map((c) => ({ ...c, surum: CHARACTER_SAVE_VERSION }))));
  } catch {
    // Yalnızca bu oturumda.
  }
}

export function newId(): string {
  return `k${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
