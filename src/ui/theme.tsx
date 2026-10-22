/**
 * Açık/koyu tema: varsayılan sistem ayarı (otomatik), elle açık veya koyu seçilebilir. Seçim
 * `<html data-theme>` ile CSS'e geçer ve bu cihazda hatırlanır (tarayıcı belleği yoksa da çalışır).
 */
import { useEffect, useState } from 'react';
import { t } from '../i18n';

export type ThemeChoice = 'auto' | 'light' | 'dark';
const KEY = 'rpg-battle-theme';
const NEXT: Record<ThemeChoice, ThemeChoice> = { auto: 'light', light: 'dark', dark: 'auto' };


export function storedTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

const CHANGED = 'rpg-battle-theme-change';

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'auto') delete root.dataset.theme;
  else root.dataset.theme = choice;
  window.dispatchEvent(new Event(CHANGED));
}

/** Şu an görünen tema: elle seçilen ya da otomatikte sistemin ayarı. */
export function resolvedTheme(): 'light' | 'dark' {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Görünen temayı izler: düğmeyle seçim ve sistem ayarı değişince güncellenir. */
export function useResolvedTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState(resolvedTheme);
  useEffect(() => {
    const update = () => setTheme(resolvedTheme());
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    window.addEventListener(CHANGED, update);
    mq?.addEventListener?.('change', update);
    return () => { window.removeEventListener(CHANGED, update); mq?.removeEventListener?.('change', update); };
  }, []);
  return theme;
}

export function useTheme(): [ThemeChoice, () => void] {
  const [choice, setChoice] = useState<ThemeChoice>(storedTheme);
  useEffect(() => {
    applyTheme(choice);
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // Bellek yoksa seçim yalnızca bu oturumda geçerli.
    }
  }, [choice]);
  return [choice, () => setChoice((c) => NEXT[c])];
}

/** Temayı sırayla değiştiren düğme: otomatik → açık → koyu. */
export function ThemeButton(props: { className?: string }) {
  const [choice, cycle] = useTheme();
  const label = t().common.theme[choice];
  return (
    <button className={props.className ?? 'ghost'} onClick={cycle} aria-label={label} title={label}>
      {choice === 'auto' ? '◐' : choice === 'light' ? '☀' : '☾'} {label.split(': ')[1] ?? label}
    </button>
  );
}
