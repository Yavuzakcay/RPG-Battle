/**
 * Zar teması (Görev J2): zar tepsisinin görselleri `data/zar-gorselleri.json`'dan. Yeni tema yalnızca yeni görsel
 * seti ve bu dosyaya yeni girdi demek; kod değişmez. Seçim bu cihazda hatırlanır.
 */
import { useState } from 'react';
import themesJson from '../../data/zar-gorselleri.json';
import mevcut from '../../data/zar-mevcut.json';
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
  /** Kuyruk 17 G6: renk teması: görseller `base` temadan, 2D görsele CSS filtresi. */
  base?: string;
  filter?: string;
}

const RAW = themesJson.themes as unknown as Array<Omit<DiceTheme, 'dice'> & { dice?: Record<string, DieArt>; seti?: string; kategori?: DiceCategory }>;
export type DiceCategory = 'malzeme' | 'sinif' | 'irk' | 'harita' | 'dusman' | 'esya' | 'hizalanma';
const SIDES = ['4', '6', '8', '10', '12', '20', '100'];
/** Görseli üretilmiş temalar (`npm run zarlar` → data/zar-mevcut.json). */
const READY = new Set<string>((mevcut as { mevcut: string[] }).mevcut);
/**
 * SD9: görsel seti hazırsa (`seti`, `zar-mevcut.json`) o setin görselleri (sayı konumu klasikten ya da temanın `dice`'ından);
 * hazır değilse `base` temanın (klasik) görselleri. 3D renkleri her zaman temanın `three`'si. Gerçek set hazırsa renk filtresi
 * (Altın) uygulanmaz: görsel kendi rengini taşır.
 */
export function buildThemes(ready: ReadonlySet<string>): DiceTheme[] {
  const classic = RAW.find((x) => x.id === themesJson.default);
  return RAW.map((x) => {
    const own = !!x.seti && ready.has(x.id);
    const base = RAW.find((b) => b.id === x.base)?.dice ?? classic?.dice ?? {};
    const dice = x.dice ?? (own ? Object.fromEntries(SIDES.map((k) => [k, { ...(base[k] as DieArt), image: `${x.seti}/d${k}.webp` }])) : base);
    const { filter, ...rest } = x as typeof x & { filter?: string };
    return { ...rest, dice, ...(filter && !own ? { filter } : {}) } as DiceTheme;
  });
}
export const DICE_THEMES: readonly DiceTheme[] = buildThemes(READY);
export const DEFAULT_DICE_THEME: string = themesJson.default;
/** Temanın kategorisi (yoksa malzeme). */
export const diceCategoryOf = (id: string): DiceCategory => RAW.find((x) => x.id === id)?.kategori ?? 'malzeme';
/** Temanın görsel seti hazır mı (değilse klasik görselle çizilir). */
export const diceSetReady = (id: string): boolean => READY.has(id);

export const diceThemeOf = (id: string): DiceTheme =>
  DICE_THEMES.find((x) => x.id === id) ?? DICE_THEMES.find((x) => x.id === DEFAULT_DICE_THEME) ?? (DICE_THEMES[0] as DiceTheme);

export const diceThemeName = (theme: DiceTheme, lang: Lang): string => theme.name[lang] ?? theme.name.tr ?? theme.id;
