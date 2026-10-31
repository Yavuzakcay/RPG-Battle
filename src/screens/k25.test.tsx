/**
 * Kuyruk 25: iki adımlı seçici (bölge → kart), gizli haritalar, gündüz/gece tek kart, alt sınıf kopyaları.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { maps } from '../map/maps';
import { dayNight, mapRegions, regionOf } from './GmScreen';
import { setDuplicatePolicy, setExternalSubclasses, visibleSubclasses } from '../rules/subclasses';
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

describe('Kuyruk 25: alt sınıf kopyaları', () => {
  afterEach(() => { setExternalSubclasses([]); setDuplicatePolicy('paket'); });
  it('aynı kimlikli ya da aynı adlı paket alt sınıfı: varsayılan paket görünür; SRD ve ikisi de seçenekleri', () => {
    const srd = classData.subclasses.find((s) => s.class === 'fighter') as SubclassDef;
    const { srd: _s, ...base } = srd;
    const pack: SubclassDef = { ...base, pack: 'ornek' };
    const renamed: SubclassDef = { ...base, id: 'paket-champion', pack: 'ornek' };
    for (const ext of [pack, renamed]) {
      setExternalSubclasses([ext]);
      expect(visibleSubclasses('fighter').filter((s) => s.name.en === srd.name.en)).toEqual([ext]);
      expect(subclassesOf('fighter').filter((s) => s.name.en === srd.name.en)).toHaveLength(1);
      setDuplicatePolicy('srd');
      expect(visibleSubclasses('fighter').filter((s) => s.name.en === srd.name.en)).toEqual([srd]);
      setDuplicatePolicy('ikisi');
      expect(visibleSubclasses('fighter').filter((s) => s.name.en === srd.name.en)).toHaveLength(2);
      setDuplicatePolicy('paket');
    }
  });
});
