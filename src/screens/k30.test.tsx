/**
 * Kuyruk 30 D4: Paladin büyü ekranı. SRD Paladin'in kendi cantrip'i yok (Cantrip 0 / 0); Blessed Warrior seçilince
 * iki Cleric cantrip'i büyü ekranında ayrı bölümde, sayaçla (Seçenek cantrip n/2) ve sınırla.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, suggestedScores, type SavedCharacter } from '../rules/builder';

const paladin = (patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k30');
  return { ...c, sheet: { ...c.sheet, name: 'Ayla', classId: 'paladin', level: 2, armorName: 'Zırhsız', baseScores: suggestedScores('paladin'), ...patch } };
};
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="spells" />);

describe('Kuyruk 30 D4: Paladin büyü ekranı', () => {
  it('Blessed Warrior yokken: Cantrip 0 / 0, seçenek bölümü yok', () => {
    const m = html(paladin());
    expect(m).toContain('Cantrip 0 / 0');
    expect(m).not.toContain('Seçenek cantrip');
  });
  it('Blessed Warrior: iki Cleric cantrip seçimi sayaçla; ikisi seçilince diğerleri kapalı', () => {
    const one = html(paladin({ advancements: [{ level: 2, featId: 'blessed-warrior' }], spellNames: ['Guidance'] }));
    expect(one).toContain('Cantrip 0 / 0');
    expect(one).toContain('Seçenek cantrip: 1/2');
    const two = html(paladin({ advancements: [{ level: 2, featId: 'blessed-warrior' }], spellNames: ['Guidance', 'Sacred Flame'] }));
    expect(two).toContain('Seçenek cantrip: 2/2');
    expect(two).toMatch(/disabled=""[^>]*>Öğren</);
  });
});
