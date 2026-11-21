/**
 * Alt sınıf seçici denetimi (fikstürle; icerik/ gerekmez, as2.test.ts ile çelişmez): SRD'nin 12 alt sınıfından 11'i kendi sınıfının
 * seçicisinde görünür (kaldırılan Barış Alanı ve 2026-11-21'den beri Yaşam Manastırı `life-domain`: fikstürde mekanik testleri için kalır, pakette ve seçicide yok; cinsiyet kuralı yalnız İmparator ve Karadul), adları boş/yinelenen değil.
 * Test kurulumu SRD fikstürünü `classData.subclasses`'a ekler (src/test-setup.ts); bu dosya dış paketi sıfırlar.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { classData, type SubclassDef } from '../data';
import { displayName, findSubclass, genderVisible, setExternalSubclasses, subclassDefs, visibleSubclasses } from '../rules/subclasses';
import { defaultSubclass } from '../rules/classFeatures';
import { subclassesOf } from '../rules/classFeatures';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';

const SRD = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
beforeAll(() => setExternalSubclasses([]));

describe('alt sınıf seçici denetimi (fikstür)', () => {
  it('SRD fikstüründe sınıf başına bir alt sınıf: 12 kayıt, 12 sınıf', () => {
    expect(SRD.map((s) => s.class).sort()).toEqual([...CLASSES].sort());
    expect(SRD.map((s) => s.id).sort()).toEqual(['champion', 'circle-of-the-land', 'college-of-lore', 'draconic-sorcery', 'evoker', 'fiend-patron', 'hunter', 'life-domain', 'oath-of-devotion', 'path-of-the-berserker', 'thief', 'warrior-of-the-open-hand']);
  });
  it('her SRD alt sınıfı (life-domain hariç) ilgili sınıfın seçicisinde (oluşturucunun kullandığı subclassesOf + cinsiyet süzgeci) iki cinsiyette de görünür', () => {
    for (const s of SRD.filter((x) => x.id !== 'life-domain')) {
      for (const gender of ['erkek', 'kadin']) {
        const shown = subclassesOf(s.class).filter((x) => genderVisible(x, { gender }));
        expect(shown.map((x) => x.id), `${s.class}/${s.id} ${gender}`).toContain(s.id);
      }
    }
  });
  it('Yaşam Manastırı (life-domain) seçicide yok; fikstürde yüklü kaldığı için kimliği kendi mekaniğini bulur; Cleric varsayılanı Birlik Manastırı', () => {
    for (const gender of ['erkek', 'kadin']) expect(subclassesOf('cleric').filter((x) => genderVisible(x, { gender })).map((x) => x.id)).not.toContain('life-domain');
    expect(findSubclass('cleric', 'life-domain')?.id).toBe('life-domain');
    expect(defaultSubclass('cleric')).toBe('imza_birlik');
  });
  it('sınıf başına sayı: fikstür + bizim imza (+ Karadul Druid\'te, yalnız kadına); toplam 11 SRD + 12 bizim', () => {
    let total = 0;
    for (const cls of CLASSES) {
      const all = visibleSubclasses(cls);
      expect(all.filter((s) => !s.ev).length, cls).toBe(cls === 'cleric' ? 0 : 1);
      expect(all.filter((s) => s.ev).length, cls).toBe(1);
      total += all.length;
      // Cinsiyet kuralı yalnız Karadul (kadın) ve İmparator (erkek): öteki sınıflarda iki cinsiyet aynı listeyi görür.
      const m = all.filter((s) => genderVisible(s, { gender: 'erkek' })).length, f = all.filter((s) => genderVisible(s, { gender: 'kadin' })).length;
      const own = cls === 'cleric' ? 1 : 2;
      expect([cls, m, f]).toEqual([cls, cls === 'druid' ? 1 : own, cls === 'fighter' ? 1 : own]);
    }
    expect(total).toBe(23);
  });
  it('adlar: kimlik başına TR ve EN ad dolu, görünen ad boş değil, sınıf içinde yinelenen kimlik ve görünen ad yok; Barış Alanı seçicide yok', () => {
    for (const cls of CLASSES) {
      const vis = visibleSubclasses(cls);
      const names = vis.map((s) => displayName(s.name, cls).tr.toLocaleLowerCase('tr'));
      for (const s of subclassDefs(cls)) { expect(s.name.tr?.trim(), s.id).toBeTruthy(); expect(s.name.en?.trim(), s.id).toBeTruthy(); }
      expect(names.every((n) => n.trim()), cls).toBe(true);
      expect(new Set(names).size, cls).toBe(names.length);
      expect(new Set(vis.map((s) => s.id)).size, cls).toBe(vis.length);
    }
    expect(classData.subclasses.some((s) => s.id === 'baris-alani')).toBe(false);
  });
});
