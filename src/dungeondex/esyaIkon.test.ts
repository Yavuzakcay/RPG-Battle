/**
 * Eşya ikon hattı (scripts/esya-ikon.mjs): manifest planı (sonraki sayfa ezer, yoksay, eksik sayfa, ayniGorsel), hücre ızgarası
 * (kare hücre, son satır/kolon sayfa kenarına uzar), dosya adı ('/' → '--'), varyant eşleme ve SRD üst kimliği kopyası. Görsel okunmaz;
 * public/esya yalnız dosya adıyla denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { bagla, dosyaAdi, esle, hucreler, oyunKayitlari, plan, sayfaAdi, varyantEsle, type Manifest } from '../../scripts/esya-ikon.mjs';
import manifestJson from '../../data/esya-ikon-sayfalar.json';

const manifest = manifestJson as unknown as Manifest;
/** public/esya dosya adları (görsel açılmaz). */
const ad = (f: string) => f.slice(f.lastIndexOf('/') + 1);
const ESYA = Object.keys(import.meta.glob('/public/esya/*.webp')).map(ad);
const KUCUK = new Set(Object.keys(import.meta.glob('/public/esya/kucuk/*.webp')).map(ad));
/** assets-ham/esya ham sayfa adları (yalnız ad; görsel açılmaz, depo dışı: CI'da boş). */
const HAM = new Set(Object.keys(import.meta.glob('/assets-ham/esya/*.{jpg,png,webp}')).map(ad));

describe('Eşya ikon hattı', () => {
  it('dosya adı: varyant kimliğinde / yerine --', () => {
    expect(dosyaAdi('potion-of-giant-strength/hill')).toBe('potion-of-giant-strength--hill');
    expect(dosyaAdi('dagger')).toBe('dagger');
  });
  it('ızgara: eşit bölme; kare hücrede son satır/kolon sayfa kenarına uzar', () => {
    expect(hucreler(2048, 2048, { kolon: 4, satir: 4 })[5]).toEqual({ x: 512, y: 512, w: 512, h: 512 });
    const k = hucreler(2048, 1553, { kolon: 3, satir: 2, hucre: 'kare ~667 px' });
    expect(k.map((c) => [c.x, c.y])).toEqual([[0, 0], [667, 0], [1334, 0], [0, 667], [667, 667], [1334, 667]]);
    expect(k[5]).toEqual({ x: 1334, y: 667, w: 714, h: 886 });
  });
  it('plan: sonraki sayfa ezer, yoksay okunmaz, eksik sayfa atlanır, ayniGorsel kopyalar ama sonraki düzeltmeyi ezmez', () => {
    const m = {
      yoksay: ['c'],
      sayfalar: [
        { dosya: 'a.jpg', kolon: 2, satir: 1, ogeler: [{ id: 'x' }, { id: 'y' }] },
        { dosya: 'b.jpg', kolon: 2, satir: 1, ogeler: [null, { id: 'x' }] },
        { dosya: 'c.jpg', kolon: 1, satir: 1, ogeler: [{ id: 'z' }] },
        { dosya: 'yok.jpg', kolon: 1, satir: 1, ogeler: [{ id: 'w' }] },
        { dosya: 'd.jpg', kolon: 1, satir: 1, ogeler: [{ id: 'q' }] },
      ],
      ayniGorsel: { y: ['y2', 'q'], kayip: ['k'] },
    };
    const p = plan(m as Manifest, (d: string) => d !== 'yok.jpg');
    expect(p.son.get('x')).toMatchObject({ sayfa: 'b', hucre: 2 });
    expect(p.son.get('y2')).toMatchObject({ sayfa: 'a', hucre: 2, kopya: 'y' });
    expect(p.son.get('q')).toMatchObject({ sayfa: 'd', hucre: 1 });
    expect(p.son.has('z')).toBe(false);
    expect(p.son.has('w')).toBe(false);
    expect(p.atlanan).toEqual(['yok']);
    expect(p.ezilen).toEqual([['x', 'a#1', 'b#2']]);
    expect(p.etkisiz).toHaveLength(2);
  });
  it('varyant eşleme: açılmış kayıtta varyant parçası tek adaysa eşlenir; yoksa eşleşmez, çoksa belirsiz', () => {
    const k = [
      { id: 'potion-of-healing', srd: 'potions-of-healing' }, { id: 'potion-of-greater-healing', srd: 'potions-of-healing' },
      { id: 'belt-of-hill-giant-strength', srd: 'belt-of-giant-strength' }, { id: 'bag-of-tricks', srd: 'bag-of-tricks' },
      { id: 'x-red-a', srd: 'x' }, { id: 'x-red-b', srd: 'x' },
    ];
    expect(varyantEsle('potions-of-healing/greater', k)).toEqual({ id: 'potion-of-greater-healing' });
    expect(varyantEsle('belt-of-giant-strength/hill', k)).toEqual({ id: 'belt-of-hill-giant-strength' });
    expect(varyantEsle('bag-of-tricks/gray', k).yok).toBeTruthy();
    expect(varyantEsle('x/red', k).belirsiz).toEqual(['x-red-a', 'x-red-b']);
    const e = esle({ sayfalar: [{ dosya: 'a.jpg', kolon: 2, satir: 1, ogeler: [{ id: 'potions-of-healing/greater' }, { id: 'bag-of-tricks/gray' }] }] }, k);
    expect(e.manifest.sayfalar[0]!.ogeler[0]).toMatchObject({ id: 'potion-of-greater-healing', kaynak: 'potions-of-healing/greater' });
    expect(e.manifest.sayfalar[0]!.ogeler[1]).toMatchObject({ id: 'bag-of-tricks/gray' });
  });
  it('bağlama: üst kimlik kendi ikonu olmayan açılmış kayıtlara kopyalanır; oyunda kaydı olmayan kayıtsızdır', () => {
    const k = [{ id: 'ring-of-resistance-acid', srd: 'ring-of-resistance' }, { id: 'ring-of-resistance-fire', srd: 'ring-of-resistance' }];
    const konum = (sayfa: string) => ({ sayfa, hucre: 1, kaynakId: sayfa, sira: 1 });
    const son = new Map([['ring-of-resistance', konum('u')], ['ring-of-resistance-fire', konum('f')], ['shield', konum('s')]]);
    const b = bagla(son, k);
    expect(b.cikti.get('ring-of-resistance-acid')).toMatchObject({ sayfa: 'u', kopya: 'ring-of-resistance' });
    expect(b.cikti.get('ring-of-resistance-fire')).toMatchObject({ sayfa: 'f' });
    expect(b.kayitsiz).toEqual(['shield']);
  });
  it('manifest: glif sayfaları yoksayılır; her sayfanın öğesi hücre sayısını aşmaz; public/esya yalnız bağlanan oyun kayıtları', () => {
    expect(manifest.yoksay).toEqual(expect.arrayContaining(['glif-1', 'glif-2']));
    for (const s of manifest.sayfalar) expect(s.ogeler.length, s.dosya).toBeLessThanOrEqual(s.kolon * s.satir);
    if (!ESYA.length) return; // hat çalıştırılmamış
    const kayitlar = oyunKayitlari();
    const oyun = new Set(kayitlar.map((k) => k.id));
    for (const f of ESYA) expect(KUCUK.has(f), f).toBe(true);
    expect(KUCUK.size).toBe(ESYA.length);
    // Tam karşılaştırma yalnız ham sayfalar yereldeyse (depo dışı); eksik sayfa hattaki gibi atlanır.
    if (HAM.size) {
      const { cikti } = bagla(plan(esle(manifest, kayitlar).manifest, (d: string) => HAM.has(d)).son, kayitlar);
      for (const id of cikti.keys()) expect(ESYA.includes(`${dosyaAdi(id)}.webp`), id).toBe(true);
      expect(ESYA.length).toBe(cikti.size);
      // Dosyası olan her sayfa gerçekten işlenir: eksik diye atlanmaz ve her dolu hücresi ya kaydın son konumu ya da sonraki sayfaca ezilmiş.
      const es = esle(manifest, kayitlar).manifest;
      const p = plan(es, (d: string) => HAM.has(d));
      const yoksay = new Set(manifest.yoksay ?? []);
      for (const s of es.sayfalar) {
        const ad = sayfaAdi(s.dosya);
        if (!HAM.has(s.dosya) || yoksay.has(ad)) continue;
        expect(p.atlanan, s.dosya).not.toContain(ad);
        s.ogeler.forEach((o, i) => {
          if (!o?.id) return;
          const yer = `${ad}#${i + 1}`; const son = p.son.get(o.id);
          const sonYer = son ? `${son.sayfa}#${son.hucre}` : '';
          expect(sonYer === yer || p.ezilen.some(([id, eski]) => id === o.id && eski === yer), `${yer} ${o.id}`).toBe(true);
        });
      }
      if (HAM.has('duzeltme-09.jpg')) {
        for (const id of ['dagger', 'warhammer', 'spyglass', 'potion-of-healing', 'potion-of-greater-healing', 'potion-of-superior-healing', 'potion-of-supreme-healing']) {
          expect(cikti.get(id)?.sayfa, id).toBe('duzeltme-09');
          expect(ESYA.includes(`${id}.webp`) && KUCUK.has(`${id}.webp`), id).toBe(true);
        }
      }
    }
    for (const f of ESYA) expect(oyun.has(f.replace(/\.webp$/, '')), f).toBe(true); // yalnız oyun kayıtları
  });
});
