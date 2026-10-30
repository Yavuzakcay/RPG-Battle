/** Görev K18: düğme adları, Weapon Mastery ve silah özelliği açıklamaları, sınıf özelliği özetleri ve renk göstergesi, Wild Shape seçicisi. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, suggestedScores, type SavedCharacter } from '../rules/builder';
import { classes } from '../data';
import { gainedFeatures } from '../rules/classFeatures';
import { featureSummary, masteryDescription, propertyDescription } from '../ui/descriptions';
import { STRINGS } from '../i18n/strings';
import data from '../../data/aciklamalar.json';

const make = (classId: string, level: number, patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k18');
  return { ...c, sheet: { ...c.sheet, name: 'Yara', classId, level, armorName: 'Zırhsız', baseScores: suggestedScores(classId), ...patch } };
};
const html = (c: SavedCharacter, step: 'character' | 'equipment' | 'spells') => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('düğme adları', () => {
  it('Öğren/Öğrenildi, Hazırla/Hazırlandı, Kitaba ekle/Kitapta; "unut" yok; İngilizceleri var', () => {
    const w = STRINGS.tr.builder.wiz;
    expect([w.spellKnowTag, w.spellKnowOn, w.spellPrepTag, w.spellPrepOn, w.spellBookTag, w.spellBookOn]).toEqual(['Öğren', 'Öğrenildi', 'Hazırla', 'Hazırlandı', 'Kitaba ekle', 'Kitapta']);
    const e = STRINGS.en.builder.wiz;
    expect([e.spellKnowTag, e.spellKnowOn, e.spellPrepTag, e.spellPrepOn, e.spellBookTag, e.spellBookOn]).toEqual(['Learn', 'Learned', 'Prepare', 'Prepared', 'Add to book', 'In book']);
    expect(JSON.stringify(STRINGS.tr.builder).toLowerCase()).not.toMatch(/unut/);
    const m = html(make('wizard', 1, { spellNames: ['Fire Bolt', 'Magic Missile'], spellbook: ['Magic Missile'] }), 'spells');
    expect(m).toContain('Öğrenildi');
    expect(m).toContain('Hazırlandı');
    expect(m).toContain('Kitapta');
    expect(m).toContain('Kitaba ekle');
  });
});

describe('Weapon Mastery ve silah özellikleri', () => {
  it('sekiz ustalığın ve dokuz özelliğin TR/EN açıklaması var', () => {
    for (const id of ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex']) {
      expect(masteryDescription(id, 'tr').length, id).toBeGreaterThan(20);
      expect(masteryDescription(id, 'en').length, id).toBeGreaterThan(20);
    }
    expect(masteryDescription('topple', 'tr')).toContain('DC = 8 + saldırı yeteneği bonusu + yetkinlik bonusu');
    for (const k of ['finesse', 'light', 'thrown', 'versatile', 'heavy', 'twoHanded', 'reach', 'ammunition', 'loading']) {
      expect(propertyDescription(k, 'tr').length, k).toBeGreaterThan(10);
      expect(propertyDescription(k, 'en').length, k).toBeGreaterThan(10);
    }
  });
  it('silah kartında ustalık adı açıklama düğmesi, seçim ayrı yıldız düğmesi', () => {
    const m = html(make('fighter', 1), 'equipment');
    expect(m).toContain('term-btn');
    expect(m).toMatch(/aria-label="Ustalığı seç: [A-Za-z]+"/);
    expect(m).toContain(masteryDescription('graze', 'tr').replace(/'/g, '&#x27;'));
  });
});

describe('sınıf özelliği özetleri ve renk göstergesi', () => {
  it('bütün sınıfların 1–20 sınıf özelliklerinin Türkçe özeti var', () => {
    for (const c of classes) for (const f of gainedFeatures(c.id, 20)) {
      expect(featureSummary(f, c.id, undefined, 'tr'), f.key).not.toBe('');
      expect(featureSummary(f, c.id, undefined, 'en'), f.key).not.toBe('');
    }
    expect(Object.keys((data.features as { tr: Record<string, string> }).tr).length).toBeGreaterThan(130);
  });
  it('Druid: özellik özeti dokunmadan görünür, alt sınıf özeti de; renk göstergesi gerçek anlamlarla', () => {
    const m = html(make('druid', 3, { subclassId: 'circle-of-the-land' }), 'character');
    expect(m).toContain('feature-sum');
    expect(m).toContain('Bonus eylemle bildiğin bir hayvan biçimine girersin');
    expect(m).toContain('savaşta çalışır');
    expect(m).toContain('kısmen çalışır');
    expect(m).toContain('savaşta etkisi yok');
    expect(m).toContain('oyunda henüz yok');
  });
});

describe('Wild Shape biçim seçicisi', () => {
  it('uygun hayvanlar ad, CR, hız ve jetonla listelenir; otomatik seçim notu açık; sayaç yalnızca listeyle', () => {
    const m = html(make('druid', 2), 'character');
    expect(m).toContain('Bilinen Wild Shape biçimleri');
    expect(m).toContain('Boş bırakırsan savaşta en güçlü uygun biçimler otomatik seçilir.');
    expect(m).toContain('form-card');
    expect(m).toContain('Wolf');
    expect(m).toMatch(/CR 1\/4 · 40 ft/);
    expect(m).toContain('(0/4 seçildi)');
    expect(m).not.toContain('boşsa savaşta en güçlüleri');
  });
});
