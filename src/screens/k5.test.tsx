/** Görev K5: Donanım adımında taşıma çubuğu ve kartlarda ağırlık; kayıtlı karakter kartında yük rozeti. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, type SavedCharacter } from '../rules/builder';

const ch = (patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k5');
  return { ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', armorName: 'Chain Mail', ...patch } };
};

describe('Donanım adımında yük', () => {
  it('çubuk "Taşınan 58 / 225 lb"; kartlarda ağırlık (yaklaşık olan ≈)', () => {
    const m = renderToStaticMarkup(<Builder initial={ch({ weapons: [{ name: 'Longsword' }] })} onSave={() => {}} onCancel={() => {}} step="equipment" />);
    expect(m).toContain('Taşınan 58 / 225 lb');
    expect(m).toContain('<small class="weight">3 lb</small>');
    expect(m).toContain('<small class="weight">≈0 lb</small>');
    expect(m).not.toContain('carry-over');
  });
  it('kapasiteyi aşınca kırmızı uyarı ve Özet\'te eksik (SRD sınırı varsayılan)', () => {
    const heavy = ch({ baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 13, cha: 12 }, armorName: 'Plate Armor', shield: true,
      weapons: [{ name: 'Greataxe' }, { name: 'Maul' }, { name: 'Halberd' }, { name: 'Heavy crossbow' }, { name: 'Greatclub' }] });
    const m = renderToStaticMarkup(<Builder initial={heavy} onSave={() => {}} onCancel={() => {}} step="equipment" />);
    expect(m).toContain('carry-over');
    const sum = renderToStaticMarkup(<Builder initial={heavy} onSave={() => {}} onCancel={() => {}} step="summary" />);
    expect(sum).toMatch(/Taşınan \d+ lb, kapasite 120 lb/);
    expect(sum).toMatch(/<button class="cta" disabled="">Kaydet<\/button>/);
  });
});
