/** Kuyruk B2: etki satırında büyü betimlemesi: var olan büyüde görünür, olmayanda (özel/yeni büyü) görünmez, EN modunda gizli. */
import { afterEach, describe, expect, it } from 'vitest';
import { setup } from '../battle/fixtures';
import type { Combatant } from '../battle';
import { spellDescriptions } from '../data';
import { getLang, setLang } from '../i18n';
import { effectRows } from './effectsView';

const bless = () => setup('Düz', { C: { effects: [{ id: 'spells:bless', name: 'Bless', sourceId: 'A', until: 10, dice: { die: '1d4', sign: 1, on: ['attack', 'save'] } }] } });
const rowOf = (s: ReturnType<typeof bless>) => effectRows(s, s.combatants.C as Combatant)[0]!;

afterEach(() => setLang('tr'));

describe('büyü betimlemesi (etki satırı)', () => {
  it('var olan büyüde betimleme satırda; mekanik metin ayrı ve olduğu gibi kalır', () => {
    const r = rowOf(bless());
    expect(r.desc).toBe(spellDescriptions.bless?.tr);
    expect(r.desc).toContain('ilahi');
    expect(r.text).toBeTruthy();
    expect(r.text).not.toContain(r.desc ?? '#');
  });
  it('betimlemesi olmayan büyüde (özel/yeni) desc yok', () => {
    const saved = spellDescriptions.bless;
    delete spellDescriptions.bless;
    try { expect('desc' in rowOf(bless())).toBe(false); } finally { spellDescriptions.bless = saved!; }
    const s = setup('Düz', { C: { effects: [{ id: 'ozel:yok', name: 'Özel', sourceId: 'A', until: 5 }] } });
    expect('desc' in effectRows(s, s.combatants.C as Combatant)[0]!).toBe(false);
  });
  it('EN modunda Türkçe betimleme gösterilmez, yerine "yalnız Türkçe" notu (Görev SD4); en eklenirse görünür', () => {
    setLang('en'); // EN tablosu test kurulumunda yüklü (src/test-setup.ts)
    expect(getLang()).toBe('en');
    expect(rowOf(bless()).desc).toBe('Description available in Turkish only.');
    const saved = spellDescriptions.bless;
    spellDescriptions.bless = { ...saved!, en: 'A divine light falls.' };
    try { expect(rowOf(bless()).desc).toBe('A divine light falls.'); } finally { spellDescriptions.bless = saved!; }
  });
});
