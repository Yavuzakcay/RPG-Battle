/**
 * Dil seçimi (TR/EN): bütün ekran metinleri `strings.ts`'te. Seçim tarayıcı belleğinde hatırlanır;
 * bellek yoksa Türkçe. Arayüz metni `t()` ile okur; dil değişince `useLang` kullanan kök yeniden çizer.
 */
import { useSyncExternalStore } from 'react';
import { STRINGS, type Lang, type Strings } from './strings';

export type { Lang, Strings };
export const LANGS: readonly Lang[] = ['tr', 'en'];
const KEY = 'rpg-battle-lang';

function load(): Lang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

let current: Lang = load();
const listeners = new Set<() => void>();

export const getLang = (): Lang => current;

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* yalnızca bu oturumda */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  for (const f of listeners) f();
}

/** Geçerli dilin metinleri. */
export const t = (): Strings => STRINGS[current];

/** Kök bileşen için: dil değişince yeniden çizilir. */
export function useLang(): Lang {
  return useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, getLang, getLang);
}
