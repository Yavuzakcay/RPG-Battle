/**
 * Görev ESYA-IKON-AYIRT (scripts/esya-ikon-ayirt.mjs, data/esya-ikon-ayirt.json): üst kimlik kopyasını paylaşan 46 varyant kaydı veride (45 ayırt + gerçek çizimli Crystal Ball; +1/+2/+3 grupları ayrı ikon sayfasından gelecek),
 * her biri oyun kaydı ve ikon hattında kopya (gerçek çizimi yok); renk/glif eşlemesi eksiksiz. Görsel okunmaz; dosyalar yalnız adla.
 */
import { describe, expect, it } from 'vitest';
import { bagla, esle, oyunKayitlari, plan, type Manifest } from '../../scripts/esya-ikon.mjs';
import { gercekCizimler, hedefler, type AyirtVeri } from '../../scripts/esya-ikon-ayirt.mjs';
import veriJson from '../../data/esya-ikon-ayirt.json';
import manifestJson from '../../data/esya-ikon-sayfalar.json';

const veri = veriJson as unknown as AyirtVeri;
const ad = (f: string) => f.slice(f.lastIndexOf('/') + 1).replace(/\.webp$/, '');
const GLIF = new Set(Object.keys(import.meta.glob('/public/glif/*.webp')).map(ad));
const ESYA = new Set(Object.keys(import.meta.glob('/public/esya/*.webp')).map(ad));
const KUCUK = new Set(Object.keys(import.meta.glob('/public/esya/kucuk/*.webp')).map(ad));
const TABAN = new Set(Object.keys(import.meta.glob('/assets/esya-taban/*.webp')).map(ad));
const TABAN_K = new Set(Object.keys(import.meta.glob('/assets/esya-taban/kucuk/*.webp')).map(ad));

describe('Eşya ikonu ayırt', () => {
  const h = hedefler(veri);
  const kayitlar = oyunKayitlari();
  it('45 ayırt kaydı (+ gerçek çizimli Crystal Ball), yinelenmeyen, hepsi oyun kaydı ve aynı üst kimliğin varyantı', () => {
    const idler = h.map((x) => x.id);
    expect(new Set(idler).size).toBe(idler.length);
    expect(idler.length).toBe(45);
    // +1/+2/+3 kayıtları bu hatta yok (kullanıcı kararı 2026-11-26).
    expect(idler.some((id) => /-[123]$/.test(id))).toBe(false);
    const oyun = new Map(kayitlar.map((k) => [k.id, k]));
    for (const x of h) expect(oyun.has(x.id), x.id).toBe(true);
    // Crystal Ball: taban kendi çizimiyle grubun dördüncü üyesi; diğer gruplarda taban oyun kaydı değil.
    expect(oyun.has('crystal-ball')).toBe(true);
    expect(idler).not.toContain('crystal-ball');
  });
  it('ikon hattında hepsi kopya (gerçek çizimi yok); tabanın kendi hücresi var', () => {
    const manifest = manifestJson as unknown as Manifest;
    const son = plan(esle(manifest, kayitlar).manifest).son;
    const { kendi, bagli } = gercekCizimler(bagla(son, kayitlar).cikti);
    for (const x of h) { expect(bagli.has(x.id), x.id).toBe(true); expect(kendi.has(x.id), x.id).toBe(false); }
    for (const g of veri.gruplar) expect(son.get(g.taban)?.kopya, g.taban).toBeUndefined();
  });
  it('renk ve glif eşlemesi eksiksiz', () => {
    for (const x of h) {
      expect(x.renk, x.id).toMatch(/^#[0-9a-f]{6}$/i);
      if (GLIF.size) expect(GLIF.has(x.glif), `${x.id}: ${x.glif}`).toBe(true);
    }
    expect(Object.keys(veri.hasarRenk)).toHaveLength(13);
  });
  it('dosyalar: her hedefin 256 ve 96 px ikonu, her tabanın iki kopyası', () => {
    if (!ESYA.size) return;
    for (const x of h) expect(ESYA.has(x.id) && KUCUK.has(x.id), x.id).toBe(true);
    for (const g of veri.gruplar) expect(TABAN.has(g.taban) && TABAN_K.has(g.taban), g.taban).toBe(true);
  });
});
