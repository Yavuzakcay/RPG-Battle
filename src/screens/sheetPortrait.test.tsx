/**
 * GORSEL-DUZELTME: karakter kâğıdı portresi (`SheetPortrait`) rozet ve jetonla aynı tek çözücüden (`lineageLook`) `LookFrame` ile
 * çizilir: alt soy filtresi, oranı ve kanat katmanı portrede de var; görünümü olmayan karakter düz rozet.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SheetPortrait, SheetView } from './sheet/SheetView';
import { blankCharacter } from '../rules/builder';
import { lineageLook } from '../ui/lineageLook';
import type { CharacterSheet } from '../rules/stats';

const sheet = (x: Partial<CharacterSheet>): CharacterSheet => ({ ...blankCharacter('p').sheet, ...x } as CharacterSheet);
const html = (s: CharacterSheet) => renderToStaticMarkup(createElement(SheetPortrait, { sheet: s }));

describe('karakter kâğıdı portresi (SheetPortrait)', () => {
  it('filtreli soy: LookFrame ve --look-filter (Gece Gözyaşı); Dwarf/Orc ten maskeli, filtresiz (TEN-MASKE-4-IRK)', () => {
    for (const r of [{ raceId: 'dwarf', lineageId: 'crag' }, { raceId: 'orc', lineageId: 'glacier' }]) expect(lineageLook({ ...r, level: 3 }).filter, r.raceId).toBe('');
    for (const s of [sheet({ raceId: 'celestial', classId: 'wizard', level: 5, celestialAwakening: 'gece-gozyasi' })]) {
      const f = lineageLook({ raceId: s.raceId, ...(s.lineageId ? { lineageId: s.lineageId } : {}), ...(s.celestialAwakening ? { celestialAwakening: s.celestialAwakening } : {}), level: s.level }).filter;
      expect(f).not.toBe('');
      const h = html(s);
      expect(h).toContain('class="look-frame"');
      expect(h).toContain(`--look-filter:${f}`);
    }
  });
  it('oran (Halfling sturdy) ve kanat (Kanatlı Tiefling, karakter ekranında uçma yeteneği)', () => {
    expect(html(sheet({ raceId: 'halfling', classId: 'bard', lineageId: 'sturdy' }))).toMatch(/--look-sx:1\.07;--look-sy:0\.93/);
    expect(html(sheet({ raceId: 'tiefling', classId: 'warlock', lineageId: 'winged', level: 3 }))).toContain('class="look-wing"');
  });
  it('görünümü olmayan karakter: çerçevesiz rozet; SheetView portreyi kullanır', () => {
    const plain = sheet({ raceId: 'human', classId: 'fighter' });
    expect(html(plain)).not.toContain('look-frame');
    const c = { ...blankCharacter('k'), sheet: sheet({ raceId: 'dwarf', classId: 'fighter', lineageId: 'undervault' }) };
    expect(renderToStaticMarkup(createElement(SheetView, { c }))).toMatch(/class="sheet-token"><span class="look-frame"/);
  });
});
