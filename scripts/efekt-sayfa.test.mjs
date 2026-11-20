// Görev E1: efekt sayfası kesim yardımcıları (parlaklık alfası, karanlık kesim, oluk koşuları).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { cuts, e2Text, effectRecord, gutterRuns, lumAlpha } from './efekt-sayfa.mjs';

describe('efekt sayfası kesimi', () => {
  it('parlaklık alfası: (max − 12) / 243, 0..1', () => {
    expect(lumAlpha(0, 0, 0)).toBe(0);
    expect(lumAlpha(12, 5, 3)).toBe(0);
    expect(lumAlpha(255, 0, 0)).toBe(1);
    expect(lumAlpha(10, 133, 20)).toBeCloseTo(121 / 243);
  });
  it('karanlık kesim beklenen sınıra en yakın karanlık çizgiden', () => {
    // 3 parça, sınırlar 30 ve 60 civarında karanlık (0), arası parlak; 28 ve 63'te boşluk.
    const p = Array.from({ length: 90 }, (_, i) => (i === 28 || i === 27 || i === 29 || i === 62 || i === 63 || i === 64 ? 0 : 200));
    expect(cuts(p, 3)).toEqual([[0, 28], [28, 63], [63, 90]]);
  });
  it('oluk: tek tonlu ince gri çizgi; kalın tek tonlu bant içerik sayılır', () => {
    const min = [30, 30, 5, 5, 5, ...Array(30).fill(4), 30, 30, ...Array(30).fill(4), 30];
    expect(gutterRuns(min)).toEqual([[2, 35], [37, 67]]);
    const band = [30, ...Array(25).fill(4), ...Array(20).fill(40), ...Array(25).fill(4), 30];
    const flat = band.map(() => 1);
    expect(gutterRuns(band, 15, flat)).toEqual([[1, 71]]);
  });
});

/**
 * Kesim → kayıt gidiş-dönüşü: her kayıt kesim tablosundan (`effectRecord`) yeniden üretilir; görselden gelen değerler (kare sayısı, en,
 * boy) kaydın kendisinden alınır. Kayda elle eklenip kesim tablosunda olmayan alan (eski `alfa`/`ton` gibi) tam kesimde kaybolurdu: burada
 * fark olarak yakalanır. `data/efekt-e2.json` metni bayt bayt aynı çıkmalı (tam kesimden sonra `git diff` boş).
 */
describe('kesim → kayıt gidiş-dönüşü (alan kaybı yok)', () => {
  const T = JSON.parse(fs.readFileSync('data/efekt-kesim.json', 'utf8'));
  const regen = (recs) => Object.fromEntries(Object.entries(recs).map(([name, rec]) => {
    const spec = T.sayfalar[rec.kaynak];
    if (!spec) throw new Error(`${name}: kaynak sayfa kesim tablosunda yok (${rec.kaynak})`);
    return [name, effectRecord(rec.kaynak, spec, name.replace(/^efekt-/, ''), { frames: { length: rec.kare }, fw: rec.en, fh: rec.boy })];
  }));
  it('data/efekt-e2.json: her kayıt kesim tablosundan aynı alanlar ve sırayla; dosya metni aynı', () => {
    const text = fs.readFileSync('data/efekt-e2.json', 'utf8');
    const e2 = JSON.parse(text);
    const again = regen(e2.efektler);
    for (const [name, rec] of Object.entries(e2.efektler)) expect(JSON.stringify(again[name]), name).toBe(JSON.stringify(rec));
    expect(e2Text(again, e2.simgeler)).toBe(text);
  });
  it('deprem yarığının alfa/ton alanları kesim tablosundan gelir', () => {
    const rec = JSON.parse(fs.readFileSync('data/efekt-e2.json', 'utf8')).efektler['efekt-zemin-deprem-yarigi'];
    expect(T.sayfalar[rec.kaynak].alfa['zemin-deprem-yarigi']).toBe(0.64);
    expect(rec).toMatchObject({ alfa: 0.64, ton: ['#28120e', '#802c16'] });
  });
  it('data/sprite-esleme.json efektler: her kayıt kesim tablosundan aynı', () => {
    const recs = JSON.parse(fs.readFileSync('data/sprite-esleme.json', 'utf8')).efektler;
    const again = regen(recs);
    for (const [name, rec] of Object.entries(recs)) expect(JSON.stringify(again[name]), name).toBe(JSON.stringify(rec));
  });
});
