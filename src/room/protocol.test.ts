/** Görev ODA-1 (O1) test 1: protokol doğrulayıcı, boyut sınırı, parçalama; oda kodu ve özet. */
import { describe, it, expect } from 'vitest';
import { birlestirici, mesajMi, parcala, type OdaMesaji, type ParcaMesaji } from './protocol';
import { anahtarUret, kodGecerli, kodTemizle, kodUret } from './code';
import { kanonikJson, ozet } from './hash';
import { surumUyusmazligi } from './surum';
import { seededRng } from '../rules/dice';

const SURUM = { protokol: 1, uygulama: 'b1', kuralSurumu: 108 };

describe('oda protokolü', () => {
  it('geçerli örnekler kabul edilir', () => {
    const ok: OdaMesaji[] = [
      { t: 'katil', istemciId: 'i-1', ad: 'Ada', ...SURUM },
      { t: 'katil', istemciId: 'i-1', ad: 'Ada', anahtar: 'k', sonSeq: 4, ...SURUM },
      { t: 'karakter_gonder', kopya: { id: 'c1', sheet: {} } as never },
      { t: 'karakter_geri_al', karakterId: 'c1' },
      { t: 'komut', istekId: 'r1', cmd: { type: 'end_turn', actorId: 'pc1' }, tabanSeq: 3 },
      { t: 'yakala', sonSeq: -1 }, { t: 'ayril' }, { t: 'nabiz' },
      { t: 'kabul', istemciId: 'i-1', anahtar: 'k', rol: 'oyuncu', karakterler: [] },
      { t: 'red', neden: 'surum', ayrinti: 'uygulama' },
      { t: 'oda_durumu', ad: 'Masa', gmAdi: '', asama: 'lobi', uyeler: [{ istemciId: 'i-1', ad: 'Ada', rol: 'oyuncu', bagli: true, karakterler: ['c1'] }], kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] },
      { t: 'anlik', donem: 1, tabanSeq: 0, olaylar: [] },
      { t: 'anlik', donem: 1, tabanSeq: 5, durum: { round: 1 } as never, olaylar: [] },
      { t: 'olaylar', donem: 1, ilkSeq: 2, olaylar: [{ type: 'turn_ended' } as never] },
      { t: 'ozet', donem: 1, seq: 3, hash: 'abc' },
      { t: 'karakter_red', karakterId: 'c1', neden: 'kilitli' },
      { t: 'oda_kapandi', neden: 'gm' },
    ];
    for (const m of ok) expect(mesajMi(m), m.t).toBe(true);
  });
  it('bozuk, bilinmeyen ve eksik alanlı mesajlar reddedilir', () => {
    const bad: unknown[] = [
      null, 3, 'x', [], { t: 'yok' }, { t: 'katil', istemciId: '', ad: 'A', ...SURUM }, { t: 'katil', istemciId: 'i', ad: 'A', protokol: 1 },
      { t: 'yakala', sonSeq: -2 }, { t: 'yakala', sonSeq: 1.5 }, { t: 'olaylar', donem: 1, ilkSeq: -1, olaylar: [] },
      { t: 'olaylar', ilkSeq: 0, olaylar: [] }, { t: 'olaylar', donem: 0, ilkSeq: 0, olaylar: [{}] },
      { t: 'anlik', donem: 0, tabanSeq: 3, olaylar: [] }, { t: 'kabul', istemciId: 'i', anahtar: 'k', rol: 'kral', karakterler: [] },
      { t: 'red', neden: 'neden-yok' }, { t: 'karakter_gonder', kopya: { id: 1 } },
    ];
    for (const m of bad) expect(mesajMi(m)).toBe(false);
  });
  it('boyut sınırı: sınırı aşan mesaj reddedilir', () => {
    const m: OdaMesaji = { t: 'oda_kapandi', neden: 'x'.repeat(500) };
    expect(mesajMi(m, 1000)).toBe(true);
    expect(mesajMi(m, 100)).toBe(false);
  });
  it('parçalama ve birleştirme (sıra karışık, yinelenen parça)', () => {
    const m: OdaMesaji = { t: 'anlik', donem: 2, tabanSeq: 0, olaylar: Array.from({ length: 40 }, (_, i) => ({ type: 'turn_ended', n: i }) as never) };
    expect(parcala(m, 'p', 1_000_000)).toEqual([m]);
    const parcalar = parcala(m, 'p', 300) as ParcaMesaji[];
    expect(parcalar.length).toBeGreaterThan(3);
    for (const p of parcalar) expect(mesajMi(p)).toBe(true);
    const bir = birlestirici();
    const karisik = [...parcalar].reverse();
    let sonuc: OdaMesaji | null | undefined;
    for (const p of [karisik[0] as ParcaMesaji, ...karisik]) sonuc = bir(p) ?? sonuc;
    expect(sonuc).toEqual(m);
  });
});

describe('oda kodu, anahtar, özet, sürüm', () => {
  it('kod 6 hane, 0 ile başlamaz', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 500; i++) { const k = kodUret(rng); expect(kodGecerli(k), k).toBe(true); }
    expect(kodGecerli('012345')).toBe(false);
    expect(kodGecerli('12345')).toBe(false);
    expect(kodTemizle(' 123-456 ')).toBe('123456');
    expect(anahtarUret(rng)).toMatch(/^[0-9a-f]{32}$/);
  });
  it('kanonik JSON anahtar sırasından ve undefined alanlardan bağımsız', () => {
    expect(kanonikJson({ b: 1, a: { d: [1, undefined], c: undefined } })).toBe('{"a":{"d":[1,null]},"b":1}');
    expect(ozet({ a: 1, b: 2 })).toBe(ozet({ b: 2, a: 1 }));
    expect(ozet({ a: 1 })).not.toBe(ozet({ a: 2 }));
  });
  it('sürüm uyuşmazlığı ilk farklı alanı söyler; dış içerik özeti alanı yok (ODA-3 madde 4)', () => {
    expect(surumUyusmazligi(SURUM, { ...SURUM })).toBe(null);
    expect(surumUyusmazligi(SURUM, { ...SURUM, uygulama: 'b2' })).toBe('uygulama');
    expect(surumUyusmazligi(SURUM, { ...SURUM, kuralSurumu: 107 })).toBe('kuralSurumu');
    expect(surumUyusmazligi(SURUM, { ...SURUM, protokol: 2 })).toBe('protokol');
    // Eski istemcinin fazladan `icerik` alanı yok sayılır (aynı build şartı yeter).
    expect(surumUyusmazligi(SURUM, { ...SURUM, icerik: 'x' } as typeof SURUM)).toBe(null);
  });
});
