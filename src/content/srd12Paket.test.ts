/** SRD 12 paket kaydı (scripts/srd12-paket-ekle.ts): fikstürden üretilen kayıt dış paket doğrulamasından geçer (yoksa paket bütün olarak reddedilirdi). */
import { describe, expect, it } from 'vitest';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';
import type { SubclassDef } from '../data';
import { validatePack } from './schema';
import { AD_TR, ALT_AD, addIfMissing, isRemovedFromPack, toPackRecord } from '../../scripts/lib/srd12-paket';
import view from '../../data/alt-sinif-gorunum.json';

const ALL = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
/** 2026-11-21: life-domain fikstürde kalır (mekanik testleri) ama pakette yok (`kaldirilan`). */
const SRD = ALL.filter((s) => !isRemovedFromPack(s.id, view.kaldirilan));
describe('SRD 12 → paket kaydı', () => {
  it('pakete giden 11 kimliğin hepsinin Türkçe adı tabloda (life-domain kaldırıldı); Warlock Zebani (alt ad İblis Hamisi rolde)', () => {
    expect(ALL.length).toBe(12);
    expect(ALL.filter((s) => isRemovedFromPack(s.id, view.kaldirilan)).map((s) => s.id)).toEqual(['life-domain']);
    expect(SRD.length).toBe(11);
    expect(SRD.map((s) => s.id).sort()).toEqual(Object.keys(AD_TR).sort());
    expect(AD_TR['fiend-patron']).toBe('Zebani');
    const r = toPackRecord(SRD.find((s) => s.id === 'fiend-patron')!, AD_TR['fiend-patron']!, ALT_AD['fiend-patron']) as unknown as SubclassDef;
    // 2026-11-21 kural: İngilizce ad Türkçe adın çevirisi (SRD 12 dahil); fikstür paketteki adı taşır.
    expect(r.name).toEqual({ tr: 'Zebani', en: 'Hellkeeper' });
    expect(r.role.tr.startsWith('İblis Hamisi: ')).toBe(true);
    expect('srd' in r).toBe(false);
  });
  it('her kayıt tek başına paket doğrulamasından geçer (kimlik aynı, srd yok)', () => {
    for (const s of SRD) {
      const rec = toPackRecord(s, AD_TR[s.id]!, ALT_AD[s.id]);
      const v = validatePack({ format: 'rpg-battle-icerik', version: 1, id: `t-${s.id}`, name: { tr: 't', en: 't' }, subclasses: [rec] }, { taken: [], packs: [] });
      expect(v.ok ? [] : v.errors.map((e) => `${e.code} ${e.path} ${e.detail ?? ''}`), s.id).toEqual([]);
      expect((rec as { id: string }).id).toBe(s.id);
    }
  });
  it('idempotent: varsa eklemez, yoksa başa ekler', () => {
    const pack = { subclasses: [{ id: 'a' }] };
    expect(addIfMissing(pack, { id: 'fiend-patron' })).toBe(true);
    expect(addIfMissing(pack, { id: 'fiend-patron' })).toBe(false);
    expect(pack.subclasses.map((x) => x.id)).toEqual(['fiend-patron', 'a']);
  });
});
