/** Görev J2: zar temaları veriden; görsel dosyaları (yalnızca adları) ve tepside görsel/SVG yedeği. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DiceTray from './DiceTray';
import { DiceThemePicker } from './DiceThemePicker';
import { DEFAULT_DICE_THEME, DICE_THEMES, buildThemes, diceThemeName, diceThemeOf, type DiceTheme } from './diceTheme';

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
  it('tepsi tema görselini kullanır ve sayıyı üstüne yazar; temada görseli olmayan zar Klasik görsele düşer (SD9)', () => {
    const item = { id: 1, roll: { sides: 20, values: [17], bonus: 5 }, title: 'Mira — Saldırı' };
    const html = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('klasik')} />);
    expect(html).toContain('zarlar/klasik/d20.webp');
    expect(html).toMatch(/class="die-num"[^>]*>17</);
    const bare: DiceTheme = { ...diceThemeOf('klasik'), dice: {} };
    const svg = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={bare} />);
    // SD9: temanın görseli yoksa Klasik yedek (SVG şekil yalnız Klasik de yüklenemezse).
    expect(svg).toContain('zarlar/klasik/d20.webp');
  });
});

/** Gerçek görsel setleri üretildikten sonra (zar-mevcut.json) da "set hazır değil" durumunu sınamak için boş hazır kümesiyle kurulan temalar. */
const notReady = (id: string): DiceTheme => buildThemes(new Set()).find((x) => x.id === id) as DiceTheme;

describe('SD9c: seçicide Oltu Taşı', () => {
  it('seçici malzeme grubunda Oltu Taşı kilitli görünür (ipucuyla); Kemik/Obsidyen yok; 3D renkleri tepsiyi çizer', () => {
    const html = renderToStaticMarkup(<DiceThemePicker charId="*" />);
    expect(html).toContain('data-zar-tema="oltu-tasi"'); expect(html).toContain('Oltu Taşı');
    expect(html).not.toContain('data-zar-tema="kemik"'); expect(html).not.toContain('data-zar-tema="obsidyen"'); expect(html).not.toMatch(/Obsidyen|Kemik/);
    const item = { id: 1, roll: { sides: 20, values: [17], bonus: 5 }, title: 'x', themeId: 'oltu-tasi' };
    const tray = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('klasik')} />);
    expect(tray).toMatch(/zarlar\/(klasik|oltu-tasi)\/d20\.webp/); expect(tray).toMatch(/class="die-num"[^>]*>17</);
  });
});

describe('SD9c: Altın renk teması ve gerçek set', () => {
  it('63 tema; Kemik/Obsidyen yok; Altın set hazır değilken Klasik görsel + CSS filtre, hazırken gerçek set ve filtresiz', () => {
    expect(DICE_THEMES.length).toBe(72); // 63 ham + 9 Alignment yer tutucusu
    expect(DICE_THEMES.map((x) => x.id)).not.toContain('kemik'); expect(DICE_THEMES.map((x) => x.id)).not.toContain('obsidyen');
    expect(DEFAULT_DICE_THEME).toBe('klasik');
    const gold = notReady('altin');
    expect(gold.dice['20']?.image).toBe(diceThemeOf('klasik').dice['20']?.image); expect(gold.filter).toBeTruthy(); expect(gold.three?.body).toMatch(/^#/);
    const ready = buildThemes(new Set(['altin', 'oltu-tasi'])).find((x) => x.id === 'altin') as DiceTheme;
    expect(ready.dice['20']?.image).toBe('zarlar/altin/d20.webp'); expect(ready.filter).toBeUndefined();
    expect(Object.keys(ready.dice).sort()).toEqual([...SIDES].sort());
    const jet = buildThemes(new Set(['oltu-tasi'])).find((x) => x.id === 'oltu-tasi') as DiceTheme;
    expect(jet.dice['6']?.image).toBe('zarlar/oltu-tasi/d6.webp'); expect(jet.three?.body).toMatch(/^#/);
    expect(diceThemeName(diceThemeOf('oltu-tasi'), 'en')).toBe('Jet');
  });
  it('tepside filtre görsele uygulanır; Klasik filtresiz', () => {
    const item = { id: 1, roll: { sides: 20, values: [17], bonus: 5 }, title: 'Mira — Saldırı' };
    const gold = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={notReady('altin')} />);
    expect(gold).toContain('filter:saturate');
    const classic = renderToStaticMarkup(<DiceTray items={[item]} timings={{ spin: 0, show: 800 }} onDone={() => {}} onSkip={() => {}} theme={diceThemeOf('klasik')} />);
    expect(classic).not.toContain('filter:');
  });
});
