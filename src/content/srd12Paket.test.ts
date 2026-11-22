/** SRD 12 paket kaydı (scripts/srd12-paket-ekle.ts): fikstürden üretilen kayıt dış paket doğrulamasından geçer (yoksa paket bütün olarak reddedilirdi). */
import { describe, expect, it } from 'vitest';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';
import type { SubclassDef } from '../data';
import { validatePack } from './schema';
import { AD_TR, ALT_AD, addIfMissing, toPackRecord } from '../../scripts/lib/srd12-paket';

const SRD = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
describe('SRD 12 → paket kaydı', () => {
  it('12 kimliğin hepsinin Türkçe adı tabloda; Warlock Zebani (alt ad İblis Hamisi rolde)', () => {
    expect(SRD.map((s) => s.id).sort()).toEqual(Object.keys(AD_TR).sort());
    expect(AD_TR['fiend-patron']).toBe('Zebani');
    const r = toPackRecord(SRD.find((s) => s.id === 'fiend-patron')!, AD_TR['fiend-patron']!, ALT_AD['fiend-patron']) as unknown as SubclassDef;
    // 2026-11-21 kural: İngilizce ad Türkçe adın çevirisi (SRD 12 dahil); fikstür paketteki adı taşır.
    expect(r.name).toEqual({ tr: 'Zebani', en: 'Hellwarden' });
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
