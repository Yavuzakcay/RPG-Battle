/**
 * Görev KATALOG-1 (P0): özgün katalog eşyası altyapısı. SRD kaydı olmayan eşya (`srd` yok, `kaynak: 'katalog-1'`) sihirli
 * eşya sayılır, tür ve nadirlik PDF'ten gelir, Dungeondex prospektüsü her gücü durum etiketiyle gösterir; tembel dosya
 * `loadClassData` ile eşya listesine girer.
 */
import { afterEach, describe, expect, it } from 'vitest';
import katalogData from '../../data/items-katalog.json';
import { isMagicItem, items, type Item } from './index';
import { itemKind, itemTier } from '../rules/itemCategory';
import { esyaProspektus } from '../dungeondex/prospektus/esya';
import { t } from '../i18n';

const FAKE: Item = {
  id: 'test-katalog-kilici', name: 'Test Catalog Blade', kaynak: 'katalog-1', attunement: true, weight: 6, text: 'test', effects: {},
  bonus: { weapon: 2 },
  katalog: {
    ref: 'S1#999', tr: 'Test Katalog Kılıcı', nadirlik: 'cokNadir', tur: 'silah', yuva: 'Savaş silahı (yakın dövüş)', fiyatGp: 8500,
    taban: 'greatsword', hasar: '2d6 + 2 kesici', ustalik: 'Graze', ozet: 'Deneme kılıcı.',
    ozellikler: [
      { ad: 'Büyülü bonus', metin: 'Saldırı ve hasar zarlarına +2 bonus verir.', durum: 'calisir' },
      { ad: 'Zihin Kırığı', metin: 'İsabette 1 yük harcayarak ek 2d6 psişik hasarı.', durum: 'planli', not: 'yeni kanca' },
    ],
  },
};

afterEach(() => { const i = items.findIndex((x) => x.id === FAKE.id); if (i >= 0) items.splice(i, 1); });

describe('KATALOG-1 altyapısı', () => {
  it('tembel katalog dosyasının bütün eşyaları listede (kaynak katalog-1)', () => {
    const n = (katalogData as unknown as { esyalar: unknown[] }).esyalar.length;
    expect(items.filter((i) => i.kaynak === 'katalog-1')).toHaveLength(n);
  });
  it('SRD kaydı olmayan katalog eşyası sihirli eşya; tür ve nadirlik PDF bilgisinden', () => {
    expect(isMagicItem(FAKE)).toBe(true);
    expect(isMagicItem({ srd: 'gear:acid' })).toBe(false);
    expect(isMagicItem({ srd: 'magic-items:bag-of-holding' })).toBe(true);
    expect(itemKind(FAKE)).toBe('silah');
    expect(itemTier(FAKE)).toBe('cokNadir');
    expect(itemTier({ ...FAKE, katalog: { ...FAKE.katalog!, nadirlik: 'yadigar' } })).toBe('efsanevi');
  });
  it('prospektüs: güçler metniyle ve durum etiketiyle, nadirlik, taban ve fiyat', () => {
    items.push(FAKE);
    const L = t().dex.pro;
    const pro = esyaProspektus(FAKE.id, L, 'tr')!;
    const nasil = pro.find((s) => s.key === 'nasil')!.rows;
    expect(nasil.map((r) => r.label)).toEqual([`Büyülü bonus · ${L.katDurum.calisir}`, `Zihin Kırığı · ${L.katDurum.planli}`]);
    expect(nasil[1]!.text).toContain('2d6 psişik');
    const etken = pro.find((s) => s.key === 'etken')!.rows.map((r) => r.text);
    expect(etken).toContain(L.katNadirlik.cokNadir);
    expect(etken).toContain('greatsword');
    expect(pro.find((s) => s.key === 'maliyet')!.rows[0]!.text).toBe('8500 GP');
    const durum = pro.find((s) => s.key === 'durum')!;
    expect(durum.badge?.tone).toBe('part');
    expect(durum.rows[0]!.text).toContain('S1#999');
  });
});
