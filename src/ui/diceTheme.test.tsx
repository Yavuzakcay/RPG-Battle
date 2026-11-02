/** Görev J2: zar temaları veriden; görsel dosyaları (yalnızca adları) ve tepside görsel/SVG yedeği. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DiceTray from './DiceTray';
import { DEFAULT_DICE_THEME, DICE_THEMES, diceThemeName, diceThemeOf, type DiceTheme } from './diceTheme';

const files = new Set(Object.keys(import.meta.glob('/public/zarlar/**/*.webp')).map((f) => f.replace('/public/', '')));
const SIDES = ['4', '6', '8', '10', '12', '20', '100'];

describe('zar temaları', () => {
  it('varsayılan tema klasik; her temada yedi zar türü, görseli var, sayı konumu görselin içinde', () => {
    expect(DEFAULT_DICE_THEME).toBe('klasik');
    expect(diceThemeOf('yok').id).toBe('klasik');
    expect(diceThemeName(diceThemeOf('klasik'), 'en')).toBe('Classic');
    for (const th of DICE_THEMES) {
      expect(Object.keys(th.dice).sort()).toEqual([...SIDES].sort());
      for (const art of Object.values(th.dice)) {
        expect(files.has(art.image)).toBe(true);
        expect(art.x).toBeGreaterThan(0); expect(art.x).toBeLessThan(128);
        expect(art.y).toBeGreaterThan(0); expect(art.y).toBeLessThan(128);
      }
    }
  });
  it('tepsi tema görselini kullanır ve sayıyı üstüne yazar; temada olmayan zar SVG şekle düşer', () => {
    const item = { id: 1, roll: { sides: 20, values: [17], bonus: 5 }, title: 'Mira — Saldırı' };
    const html = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('klasik')} />);
    expect(html).toContain('zarlar/klasik/d20.webp');
    expect(html).toMatch(/class="die-num"[^>]*>17</);
    const bare: DiceTheme = { ...diceThemeOf('klasik'), dice: {} };
    const svg = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={bare} />);
    expect(svg).toContain('<polygon');
    expect(svg).not.toContain('.webp');
  });
});

describe('Kuyruk 17 G6: renk temaları', () => {
  it('en az 4 tema; varsayılan Klasik; renk temaları Klasik görsellerini filtreyle kullanır, 3D renkleri var', () => {
    expect(DICE_THEMES.map((x) => x.id)).toEqual(['klasik', 'kemik', 'obsidyen', 'altin']);
    expect(DEFAULT_DICE_THEME).toBe('klasik');
    for (const id of ['kemik', 'obsidyen', 'altin']) {
      const th = diceThemeOf(id);
      expect(th.dice['20']?.image).toBe(diceThemeOf('klasik').dice['20']?.image);
      expect(th.filter).toBeTruthy();
      expect(th.three?.body).toMatch(/^#/);
    }
    expect(diceThemeName(diceThemeOf('obsidyen'), 'en')).toBe('Obsidian');
  });
  it('tepside filtre görsele uygulanır; Klasik filtresiz', () => {
    const item = { id: 1, roll: { sides: 20, values: [17], bonus: 5 }, title: 'Mira — Saldırı' };
    const gold = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('altin')} />);
    expect(gold).toContain('filter:saturate');
    const classic = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('klasik')} />);
    expect(classic).not.toContain('filter:');
  });
});
