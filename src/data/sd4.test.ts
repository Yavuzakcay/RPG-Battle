/**
 * Görev SD4: Türkçe açıklama kapsamı ve kimlik kuralı. `data/aciklamalar-tr.json` anahtarları gerçek kayıtlara bağlı
 * (eşya kimliği → items/items-srd, tür özelliği → SRD `species:<tür>/<özellik>`); her eşyanın, her SRD tür özelliğinin
 * ve SRD sınıf tablosundaki her sınıf özelliğinin Türkçe açıklaması var; İngilizce arayüzde SRD ham metni yerine not.
 */
import { describe, it, expect, afterEach } from 'vitest';
import TR from '../../data/aciklamalar-tr.json';
import ACK from '../../data/aciklamalar.json';
import itemsData from '../../data/items.json';
import itemsSrd from '../../data/items-srd.json';
import srdSpecies from '../../data/srd/species.json';
import progression from '../../data/srd/progression.json';
import { itemDescription, speciesTraits, featureSummary } from '../ui/descriptions';
import { itemDetail, itemSummary } from '../ui/equipmentText';
import { items } from './index';
import { setLang } from '../i18n';

const esya = TR.esyalar as Record<string, string>;
const tur = TR.turOzellikleri as Record<string, { ad: string; tr: string }>;
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

afterEach(() => setLang('tr'));

describe('Görev SD4: Türkçe açıklamalar', () => {
  it('eşya: her kimlik bir eşyaya bağlı ve her eşyanın kısa Türkçe açıklaması var', () => {
    const ids = [...itemsData, ...itemsSrd].map((x) => x.id);
    expect(Object.keys(esya).filter((k) => !ids.includes(k))).toEqual([]);
    expect(ids.filter((k) => !esya[k])).toEqual([]);
    for (const [k, v] of Object.entries(esya)) {
      expect(v.trim().length, k).toBeGreaterThan(10);
      expect(v.length, k).toBeLessThanOrEqual(240);
    }
    // SRD ham metni (İngilizce) kalmamış: çoğu açıklama Türkçe harf taşır.
    expect(Object.values(esya).filter((v) => !TR_CHARS.test(v)).length).toBeLessThan(10);
  });

  it('tür özelliği: anahtar SRD kaydı (species:<tür>/<özellik>), ad SRD adıyla aynı, hepsi var', () => {
    const srd = new Map<string, string>(srdSpecies.species.flatMap((s) => s.traits.map((t) => [`${s.id}/${t.id}`, t.name] as [string, string])));
    expect(Object.keys(tur).filter((k) => !srd.has(k))).toEqual([]);
    expect([...srd.keys()].filter((k) => !tur[k])).toEqual([]);
    for (const [k, v] of Object.entries(tur)) expect(v.ad, k).toBe(srd.get(k));
  });

  it('sınıf özelliği: SRD tablosundaki her özelliğin Türkçe özeti var', () => {
    const tr = ACK.features.tr as Record<string, string>;
    const keys = progression.classes.flatMap((c) => c.rows.flatMap((r) => r.features.map((f) => `${c.id}:${f.id}`)));
    expect(keys.filter((k) => !tr[k])).toEqual([]);
  });

  it('EN arayüzde Türkçe açıklama yerine kısa not; SRD ham metni gösterilmez', () => {
    const bag = items.find((x) => x.id === 'backpack')!;
    expect(itemSummary(bag)).toBe(esya.backpack);
    expect(itemDetail(bag)).toContain(esya.backpack);
    setLang('en');
    const note = 'Description available in Turkish only.';
    expect(itemDescription('backpack', 'en')).toBe(note);
    expect(itemSummary(bag)).toBe(note);
    expect(itemDetail(bag)).not.toContain(bag.text);
    expect(speciesTraits('dwarf', 'en').every((x) => x.text === note)).toBe(true);
    expect(featureSummary({ key: 'barbarian:rage', id: 'rage', from: 'class' }, 'barbarian', undefined, 'en')).toBe(note);
    expect(speciesTraits('dwarf', 'tr').map((x) => x.name)).toContain('Darkvision');
  });
});
