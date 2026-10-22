/**
 * Zar teması (Görev J2): zar tepsisinin görselleri `data/zar-gorselleri.json`'dan. Yeni tema yalnızca yeni görsel
 * seti ve bu dosyaya yeni girdi demek; kod değişmez. Seçim bu cihazda hatırlanır.
 */
import { useState } from 'react';
import themesJson from '../../data/zar-gorselleri.json';
import type { Lang } from '../i18n/strings';

export interface DieArt { image: string; x: number; y: number; size?: number }
/** 3D zar renkleri (Görev J3). */
export interface Dice3DColors { body: string; face: string; edge: string; number: string; crit: string; fumble: string; ring: string }

export interface DiceTheme {
  id: string;
  three?: Dice3DColors;
  name: Record<string, string>;
  text: { color: string; stroke: string; size: number };
  dice: Record<string, DieArt>;
}

export const DICE_THEMES: readonly DiceTheme[] = themesJson.themes as DiceTheme[];
export const DEFAULT_DICE_THEME: string = themesJson.default;
const KEY = 'rpg-battle-dice-theme';

export const diceThemeOf = (id: string): DiceTheme =>
  DICE_THEMES.find((x) => x.id === id) ?? DICE_THEMES.find((x) => x.id === DEFAULT_DICE_THEME) ?? (DICE_THEMES[0] as DiceTheme);

export const diceThemeName = (theme: DiceTheme, lang: Lang): string => theme.name[lang] ?? theme.name.tr ?? theme.id;

export function storedDiceTheme(): string {
  try {
    const v = localStorage.getItem(KEY);
    return v && DICE_THEMES.some((x) => x.id === v) ? v : DEFAULT_DICE_THEME;
  } catch {
    return DEFAULT_DICE_THEME;
  }
}

/** Tema seçimi: listedeki sıradakine geçer (şimdilik tek tema). */
export function useDiceThemeSetting(): [DiceTheme, () => void] {
  const [id, setId] = useState(storedDiceTheme);
  const cycle = () => setId((cur) => {
    const i = DICE_THEMES.findIndex((x) => x.id === cur);
    const next = DICE_THEMES[(i + 1) % DICE_THEMES.length]?.id ?? DEFAULT_DICE_THEME;
    try { localStorage.setItem(KEY, next); } catch { /* yalnızca bu oturumda */ }
    return next;
  });
  return [diceThemeOf(id), cycle];
}
