/**
 * Görev B95 (A): Serüven seçim kipi (Builder `choices`): eksik alt sınıf açılışta da olsa istenir (otomatik atanmaz),
 * Weapon Mastery seçimi bu kipte de yapılır (donanım adımı yok).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, type BuilderStep, type SavedCharacter } from '../rules/builder';

const ch = (patch: Partial<SavedCharacter['sheet']>): SavedCharacter => {
  const c = blankCharacter('b95');
  return { ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', armorName: 'Chain Mail', ...patch } };
};
const html = (c: SavedCharacter, step: BuilderStep) => renderToStaticMarkup(<Builder choices initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('B95 A: Serüven seçim kipi', () => {
  it('3. seviyede alt sınıfı boş Fighter: alt sınıf eksik olarak istenir', () => {
    const m = html(ch({ classId: 'fighter', level: 3, advancements: [{ level: 1, featId: 'defense' }], weaponMasteries: ['longsword', 'greatsword', 'shortbow'] }), 'summary');
    expect(m).toContain('Alt sınıf seçilmeli (3. seviyede).');
    expect(m).toContain('1 eksik');
  });
  it('alt sınıfı seçili karakterde eksik yok; ustalık yuvaları karakter adımında hak kadar', () => {
    const c = ch({ classId: 'fighter', level: 4, subclassId: 'champion', advancements: [{ level: 1, featId: 'defense' }], weaponMasteries: ['longsword', 'greatsword', 'shortbow'] });
    const m = html(c, 'character');
    expect(m).toContain('mastery-pick');
    expect((m.split('mastery-pick')[1]?.match(/<select/g) ?? []).length).toBe(4);
    expect(html(ch({ classId: 'monk', level: 3, subclassId: 'warrior-of-the-open-hand', armorName: 'Zırhsız' }), 'character')).not.toContain('mastery-pick');
  });
});
