/**
 * Görev P0: ilkel şeması. Belge şemadan üretilmiş ve güncel; her ilkelin örneği geçerli; bilinmeyen ilkel/alan, eksik
 * alan, yanlış tetik, bozuk formül ve kayıp başvurular yalnız kimlik + alan adıyla raporlanır.
 */
import { describe, expect, it } from 'vitest';
import { belgeMetni } from './ilkelBelge';
import doc from '../../harita/belgeler/PAKET-ILKELLER.md?raw';
import { formulOk, ilkelErrors, ilkelKismi, ILKELLER, yaratikErrors } from './ilkelSema';

const ctx = () => ({
  kaynaklar: new Set(['kehanet', 'kalkan-sozu', 'sifa', 'cagri', 'dev-ofkesi', 'golge-adimi', 'son-nefes', 'ofke-hamlesi', 'gece-bicimi', 'sis-adimi', 'sis-perde']),
  sinifKaynaklari: new Set(['rage', 'focus']),
  yaratiklar: new Set(['kul-kurdu']),
});

describe('PAKET-ILKELLER.md', () => {
  it('şemadan üretilmiş ve güncel (npx vite-node scripts/paket-ilkeller-belge.ts)', () => {
    expect(doc).toBe(belgeMetni());
  });
  it('27 ilkel (P6: +zarMuhru, +engeldenGec); her örnek geçerli ve kısmi alan içermez', () => {
    expect(Object.keys(ILKELLER)).toHaveLength(27);
    for (const [k, s] of Object.entries(ILKELLER)) {
      expect(s.ornek.tur).toBe(k);
      expect(ilkelErrors([s.ornek], k, ctx())).toEqual([]);
      expect(ilkelKismi(s.ornek)).toEqual([]);
    }
  });
});

describe('ilkel doğrulama', () => {
  it('formül sözdizimi', () => {
    for (const ok of [3, '1d8', '2d6+$wis', '$lvl+2', '-1', '$pbYari', { 3: '1d6', 11: '2d6' }]) expect(formulOk(ok)).toBe(true);
    for (const bad of ['1d6+1d4', '$foo', '2*$lvl', 'Math.max(1)', { x: '1' }, {}, '', null]) expect(formulOk(bad)).toBe(false);
  });
  it('hatalar yalnız yol + kod + alan adı', () => {
    const e = ilkelErrors([
      { tur: 'uydurma' },
      { tur: 'ekHasar', zar: '1d6', renk: 'mor' },
      { tur: 'ekHasar' },
      { tur: 'ekHasar', zar: '1d6', tetik: 'eylem' },
      { tur: 'cagir', yaratik: 'yok' },
      { tur: 'iyilestirme', miktar: '1d4', kaynak: { id: 'yok' } },
      { tur: 'direnc', turler: ['ates'] },
      { tur: 'hiz', artiFt: 10, kosul: ['bicim:yok'] },
    ], 'p', ctx());
    expect(e.map((x) => `${x.path} ${x.kod} ${x.alan}`)).toEqual([
      'p[0].tur ilkelTur uydurma', 'p[1].renk ilkelAlan renk', 'p[2].zar ilkelEksik zar', 'p[3].tetik ilkelDeger tetik',
      'p[4].yaratik yaratikRef yaratik', 'p[5].kaynak kaynakRef kaynak', 'p[6].turler ilkelDeger turler', 'p[7].kosul ilkelDeger kosul',
    ]);
  });
  it('hedef yalnız hedefli ilkelde; aura etkisine göre gereken alan', () => {
    expect(ilkelErrors([{ tur: 'direnc', turler: ['fire'], hedef: 'dost' }], 'p', ctx())[0]?.kod).toBe('ilkelAlan');
    expect(ilkelErrors([{ tur: 'aura', yaricapFt: 10, etki: 'hasar', zar: '1d6' }], 'p', ctx()).map((x) => x.alan)).toEqual(['hasarTuru']);
  });
  it('bicim koşulu aynı özellikteki bicim kimliğine başvurur', () => {
    expect(ilkelErrors([{ tur: 'bicim', id: 'kurt', tetik: 'bonus' }, { tur: 'direnc', turler: ['fire'], kosul: ['bicim:kurt'] }], 'p', ctx())).toEqual([]);
  });
  it('kısmi alanlar raporlanır', () => {
    // P6: erişim ve dostaIsabet etkileri artık tam; kalan yaklaşık birleşim hasarAldim + karşı vuruş dışı.
    expect(ilkelKismi({ tur: 'boyut', erisimFt: 5 })).toEqual([]);
    expect(ilkelKismi({ tur: 'tepki', olay: 'dostaIsabet', etki: 'hasarAzalt' })).toEqual([]);
    expect(ilkelKismi({ tur: 'tepki', olay: 'hasarAldim', etki: 'yariya' })).toEqual(['etki']);
  });
});

describe('yaratık tanımı', () => {
  const base = { id: 'kul-kurdu', ad: { tr: 'Kül Kurdu', en: 'Ash Wolf' }, ac: 13, hp: '5+$lvl2', yetenekler: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    saldirilar: [{ ad: 'Isırık', hasar: '1d6+$pb', hasarTuru: 'piercing' }], jeton: { gorsel: 'kurt', ton: 200, halka: '#7fb3ff' } };
  it('geçerli, uyarısız', () => {
    expect(yaratikErrors(base, 'y')).toEqual({ hatalar: [], uyarilar: [] });
  });
  it('eksik jeton uyarıdır, hata değil', () => {
    const { jeton: _j, ...rest } = base;
    const r = yaratikErrors(rest, 'y');
    expect(r.hatalar).toEqual([]);
    expect(r.uyarilar.map((x) => x.alan)).toEqual(['jeton.gorsel']);
    expect(yaratikErrors({ ...base, jeton: { gorsel: 'olmayan-canavar' } }, 'y', new Set(['wolf'])).uyarilar).toHaveLength(1);
  });
  it('hatalı alanlar', () => {
    const r = yaratikErrors({ ...base, ac: '2*$pb', renk: 1, saldirilar: [{ ad: 'X', hasar: '1d4' }], jeton: { ton: 400 } }, 'y');
    expect(r.hatalar.map((x) => `${x.path} ${x.kod}`).sort()).toEqual(['y.ac ilkelDeger', 'y.jeton ilkelDeger', 'y.renk ilkelAlan', 'y.saldirilar[0].hasarTuru ilkelEksik']);
  });
});
