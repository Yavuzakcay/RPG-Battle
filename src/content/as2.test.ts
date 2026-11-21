/**
 * Görev AS2: 120 alt sınıf tek pakette. Sayım yerel `icerik/ek-<sınıf>.json` dosyalarıyla (depoya girmez; klasör yoksa
 * CI ve temiz kopyada atlanır): 108 paket + 12 bizim (11 imza + Karadul Çemberi); Barış Alanı 2026-11-21 ad temizliğinden
 * beri paket dosyasında da yok (eskiden 109 − Barış Alanı; kimliği `eskiKimlik` ile Birlik Manastırı'na yönlenir). Ayrıca SRD'nin 12
 * alt sınıfının paketteki kaydı mekanikte depodaki fikstürle birebir aynı (özellik, seviye, durum, etki; yalnız TR adlar
 * ve açıklamalar kitapçıktan) ve hepsi her zaman seçilebilir.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { classData, type SubclassDef } from '../data';
import { applyStoredContent, loadLocalFolder } from './store';
import { findSubclass, genderVisible, setExternalSubclasses, visibleSubclasses } from '../rules/subclasses';
import { defaultSubclass } from '../rules/classFeatures';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';

const FILES = import.meta.glob('../../icerik/ek-*.json', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
/** Yerel `icerik/` tam mı: 12 sınıf dosyası ve toplam 108 paket alt sınıfı (Barış Alanı paketten çıktı). Eksikse bu paket testi atlanır (sayılar konsolda). */
const RAWS = await Promise.all(Object.values(FILES).map((f) => f()));
const COUNT = RAWS.reduce((n, r) => { try { return n + ((JSON.parse(r) as { subclasses?: unknown[] }).subclasses?.length ?? 0); } catch { return n; } }, 0);
const HAS = Object.keys(FILES).length === 12 && COUNT === 108;
if (!HAS && Object.keys(FILES).length > 0) console.warn(`as2.test atlandı: yerel icerik/ eksik (${Object.keys(FILES).length} dosya, ${COUNT} paket alt sınıfı; beklenen 12 dosya, 108 alt sınıf — SRD'nin 12 alt sınıfı da paket dosyalarında olmalı).`);
const SRD = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
/** Görev kararı: sınıf başına yerelleştirilen (paket) + bizim (imza/Karadul). */
const EXPECTED: Record<string, [number, number]> = {
  barbarian: [8, 1], bard: [8, 1], cleric: [7, 1], druid: [7, 1], fighter: [10, 1], monk: [10, 1],
  paladin: [9, 1], ranger: [8, 1], rogue: [9, 1], sorcerer: [8, 1], warlock: [10, 1], wizard: [14, 1],
};
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };

describe.skipIf(!HAS)('Görev AS2: 120 alt sınıf (yerel icerik/)', () => {
  const saved = [...classData.subclasses];
  let rows: ReturnType<typeof applyStoredContent> = [];
  beforeAll(async () => {
    // Test kurulumu SRD fikstürünü oyunun kendi alt sınıflarına ekler; burada uygulamadaki gibi yalnız imza + Karadul.
    classData.subclasses = saved.filter((s) => s.ev);
    await loadLocalFolder(mem(), FILES);
    rows = applyStoredContent(mem());
  });
  afterAll(async () => {
    classData.subclasses = saved;
    await loadLocalFolder(mem(), {});
    setExternalSubclasses([]);
  });

  it('12 paket dosyası geçerli; 108 paket alt sınıfı (Barış Alanı paket dosyasında yok)', () => {
    expect(rows.map((r) => [r.pack.id, r.errors.length]).filter(([, n]) => n !== 0)).toEqual([]);
    expect(rows.reduce((n, r) => n + r.pack.subclasses.length, 0)).toBe(108);
    expect(rows.some((r) => r.pack.subclasses.some((s) => s.id === 'baris-alani'))).toBe(false);
  });
  it('108 + 12 = 120, sınıf başına beklenen sayılar; Barış Alanı listede yok', () => {
    let total = 0;
    for (const [cls, [pack, own]] of Object.entries(EXPECTED)) {
      const list = visibleSubclasses(cls);
      expect([cls, list.filter((s) => !s.ev).length, list.filter((s) => s.ev).length]).toEqual([cls, pack, own]);
      total += list.length;
    }
    expect(total).toBe(120);
    expect(Object.values(EXPECTED).reduce((n, [p]) => n + p, 0)).toBe(108);
    expect(visibleSubclasses('cleric').some((s) => s.id === 'baris-alani')).toBe(false);
    expect(findSubclass('cleric', 'baris-alani')?.id).toBe('imza_birlik');
  });
  it('SRD 12 pakette aynı kimlik ve mekanikle (özellik, seviye, durum, etki); EN adlar aynı; varsayılan alt sınıf', () => {
    for (const r of SRD) {
      const p = findSubclass(r.class, r.id);
      expect(p?.pack).toBeTruthy();
      if (!p) continue;
      expect(p.name.en).toBe(r.name.en);
      expect(defaultSubclass(r.class)).toBe(r.id);
      for (const f of r.features) {
        const g = p.features.find((x) => x.id === f.id);
        expect([f.id, g?.level, g?.status, g?.effect, g?.name.en]).toEqual([f.id, f.level, f.status, f.effect, f.name.en]);
      }
      // Kitapçıktaki ek özellikler planlı (etkisiz) eklenir; kayıttaki hiçbir özellik silinmez.
      const extra = p.features.filter((x) => !r.features.some((f) => f.id === x.id));
      expect(extra.every((x) => x.status === 'planli' && !x.effect)).toBe(true);
    }
  });
  it('cinsiyet kuralı alt sınıfta: Karadul yalnız kadın, İmparator yalnız erkek; diğerleri herkese', () => {
    const female = { gender: 'kadin' as const };
    const male = { gender: 'erkek' as const };
    const all = Object.keys(EXPECTED).flatMap((c) => visibleSubclasses(c));
    expect(all.filter((s) => !genderVisible(s, female)).map((s) => s.id)).toEqual(['imza_imparator']);
    expect(all.filter((s) => !genderVisible(s, male)).map((s) => s.id)).toEqual(['karadul-cemberi']);
  });
});
