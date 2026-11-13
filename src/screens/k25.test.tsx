/**
 * Kuyruk 25: iki adımlı seçici (bölge → kart), gizli haritalar, gündüz/gece tek kart, alt sınıf kopyaları.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { maps } from '../map/maps';
import { dayNight, mapRegions, regionOf } from './GmScreen';
import { setExternalSubclasses, subclassDefs, visibleSubclasses } from '../rules/subclasses';
import { subclassesOf } from '../rules/classFeatures';
import { classData, type SubclassDef } from '../data';

describe('Kuyruk 25: harita seçici', () => {
  const shown = mapRegions(maps.filter((m) => !m.gizli));
  it('Derinlikler ayrı üst bölge değil, Yeraltı altında; gizli haritalar listede yok', () => {
    expect(shown.map((g) => g.id)).not.toContain('derinlikler');
    const under = shown.find((g) => g.id === 'yeralti')?.list.map((m) => m.id) ?? [];
    expect(under).toEqual(expect.arrayContaining(['dungeon', 'derinlikler-magara-karakol', 'derinlikler-lav-salonu']));
    expect(regionOf({ bolge: 'derinlikler' })).toBe('yeralti');
    const ids = shown.flatMap((g) => g.list.map((m) => m.id));
    for (const id of ['orman-yolu', 'kale-avlu', 'magara-genis', 'kale-baskini', 'orman-heykel-magarasi']) expect(ids, id).not.toContain(id);
    expect(ids).toContain('orman');
  });
  it('gündüz/gece çifti tek kart (anahtar); gecesi olmayanda yok', () => {
    const by = (id: string) => maps.find((m) => m.id === id)!;
    expect(dayNight(by('orman'))).toEqual({ day: 'orman', night: 'gece' });
    expect(dayNight(by('orman-heykel-golu'))).toEqual({ day: 'gunduz', night: 'gece' });
    expect(dayNight(by('volkan'))).toBeNull();
    expect(dayNight(by('dungeon'))).toBeNull();
  });
});

// Görev AS2: "kopyalarda hangisi kalsın" (Paket/SRD/İkisi de) kalktı; SRD kaydı pakete taşındı (tek kaynak). Eski beklenti
// "varsayılan politikada SRD gizlenir" yerine: seçim listesi kaydın kendisi (yalnız `kaldirilan` Barış Alanı çıkar).
describe('Görev AS2: tek alt sınıf listesi (Kuyruk 25 kopya politikası kalktı)', () => {
  afterEach(() => { setExternalSubclasses([]); });
  it('aynı adlı paket alt sınıfı da gizlenmez; çalışan özelliği olmayan paket alt sınıfı da seçilebilir; Barış Alanı çıkar', () => {
    const srd = classData.subclasses.find((s) => s.class === 'fighter') as SubclassDef;
    const { srd: _s, ...base } = srd;
    const renamed: SubclassDef = { ...base, id: 'paket-champion', pack: 'ornek' };
    const planned: SubclassDef = { ...base, id: 'paket-planli', pack: 'ornek', features: base.features.map((f) => ({ ...f, status: 'planli' as const, effect: undefined })) };
    const peace: SubclassDef = { ...base, id: 'baris-alani', class: 'cleric', pack: 'ornek' };
    setExternalSubclasses([renamed, planned, peace]);
    expect(visibleSubclasses('fighter')).toEqual(subclassDefs('fighter'));
    expect(subclassesOf('fighter').filter((s) => s.name.en === srd.name.en).map((s) => s.id)).toEqual([srd.id, 'paket-champion', 'paket-planli']);
    expect(subclassesOf('cleric').some((s) => s.id === 'baris-alani')).toBe(false);
  });
});
