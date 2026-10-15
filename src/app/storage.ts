/**
 * Kayıtlı karakterler (tek cihaz): tarayıcı belleğinde. Bellek yoksa veya bozuksa boş liste
 * döner, kayıt sessizce yalnızca oturumda kalır. Online sürümde sunucuya taşınacak.
 */
import type { SavedCharacter } from '../rules/builder';

const KEY = 'rpg-battle-characters';
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
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Yalnızca bu oturumda.
  }
}

export function newId(): string {
  return `k${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
