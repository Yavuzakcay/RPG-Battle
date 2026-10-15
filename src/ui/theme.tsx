/**
 * Açık/koyu tema: varsayılan sistem ayarı (otomatik), elle açık veya koyu seçilebilir. Seçim
 * `<html data-theme>` ile CSS'e geçer ve bu cihazda hatırlanır (tarayıcı belleği yoksa da çalışır).
 */
import { useEffect, useState } from 'react';

export type ThemeChoice = 'auto' | 'light' | 'dark';
const KEY = 'rpg-battle-theme';
const NEXT: Record<ThemeChoice, ThemeChoice> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<ThemeChoice, string> = { auto: 'Tema: otomatik', light: 'Tema: açık', dark: 'Tema: koyu' };

export function storedTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'auto') delete root.dataset.theme;
  else root.dataset.theme = choice;
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
  return (
    <button className={props.className ?? 'ghost'} onClick={cycle} aria-label={LABEL[choice]} title={LABEL[choice]}>
      {choice === 'auto' ? '◐' : choice === 'light' ? '☀' : '☾'} {LABEL[choice].replace('Tema: ', '')}
    </button>
  );
}
