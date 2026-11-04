/** Kuyruk K49 Adım B: alt sınıf görünümü (kaldırılanlar, adlar), geçmiş adları, Game Master seviye değiştirme. */
import { afterEach, describe, expect, it } from 'vitest';
import { displayName, findSubclass, isRemovedSubclass, setExternalSubclasses, subclassLabel, visibleSubclasses } from './subclasses';
import { backgrounds } from './backgrounds';
import { blankCharacter } from './builder';
import { changeLevel } from '../app/levelChange';
import type { SubclassDef } from '../data';

const ext = (id: string, cls: string, tr: string, en: string): SubclassDef => ({ id, class: cls, pack: 'test', name: { tr, en }, role: { tr: '', en: '' }, features: [] });
afterEach(() => setExternalSubclasses([]));

describe('alt sınıf görünümü', () => {
  it('kaldırılan sekiz alt sınıf başka seçenek varken listede yok (SRD ve paket kopyası); son seçenek kalır', () => {
    expect(visibleSubclasses('barbarian').map((s) => s.id)).toEqual(['path-of-the-berserker']); // başka yok → kalır
    setExternalSubclasses([ext('paket-berserker', 'barbarian', 'Çılgın', 'Path of the Berserker'), ext('ofke', 'barbarian', 'Öfke', 'Rage Path')]);
    expect(visibleSubclasses('barbarian').map((s) => s.id)).toEqual(['ofke']);
    // Eski kayıt: motor yine bulur.
    expect(findSubclass('barbarian', 'path-of-the-berserker')?.id).toBe('path-of-the-berserker');
    expect(isRemovedSubclass(ext('x', 'wizard', 'a', 'Evoker'))).toBe(true);
  });
  it('adlar: parantezli takma ad, Cleric Alanı → Manastırı, Barış → Birlik; "dış içerik" eki yok', () => {
    expect(displayName({ tr: 'Psişik Hançerler (Kirpi)', en: 'Psychic Blades (Hedgehog)' })).toEqual({ tr: 'Kirpi', en: 'Hedgehog' });
    expect(displayName({ tr: 'Işık Alanı', en: 'Light Domain' }, 'cleric').tr).toBe('Işık Manastırı');
    expect(displayName({ tr: 'Barış Alanı', en: 'Peace Domain' }, 'cleric')).toEqual({ tr: 'Birlik Manastırı', en: 'Unity Domain' });
    expect(displayName({ tr: 'Toprak Çemberi', en: 'Circle of the Land' }, 'druid').tr).toBe('Toprak Çemberi');
    expect(subclassLabel({ tr: 'Işık Alanı', en: 'Light Domain' }, 'tr', 'cleric')).toBe('Işık Manastırı (Light Domain)');
  });
});

describe('geçmiş adları (yalnız görünen ad; kimlikler aynı)', () => {
  it('sekiz özgün geçmiş yeni adlarla', () => {
    const tr = Object.fromEntries(backgrounds.map((b) => [b.id, b.name.tr]));
    expect(tr).toMatchObject({ 'buz-madencisi': 'Madenci', tuccar: 'Tüccar', 'gezgin-ozan': 'Soytarı', 'sifaci-yardimcisi': 'Şifacı', soylu: 'Soylu', denizci: 'Mürettebat', ciftci: 'Köylü', 'avci-izci': 'Ödül Avcısı' });
  });
});

describe('Game Master seviye değiştirme', () => {
  it('yükseltir ve düşürür; günlüğe yazar; durum yeni en çoklara uyar', () => {
    const c = blankCharacter('lv');
    const up = changeLevel({ ...c, sheet: { ...c.sheet, level: 3 } }, 7, '2026-11-04T00:00:00Z');
    expect(up.sheet.level).toBe(7);
    expect(up.levelLog).toEqual([{ from: 3, to: 7, at: '2026-11-04T00:00:00Z', by: 'gm' }]);
    const down = changeLevel(up, 2, 'b');
    expect(down.sheet.level).toBe(2);
    expect(down.levelLog).toHaveLength(2);
    expect(changeLevel(down, 25, 'c').sheet.level).toBe(20);
  });
});
