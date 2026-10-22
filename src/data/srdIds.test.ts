/**
 * Kimlik kuralı (Görev P0): her büyü, silah, eşya, feat ve sınıf özelliği sabit bir kimlik taşır ve `data/srd/`
 * içindeki bir kayda bağlanır. Yeni kayıt kimliksiz ya da SRD karşılıksız eklenirse bu test kırılır.
 */
import { describe, it, expect } from 'vitest';
import weaponsData from '../../data/weapons.json';
import spellsData from '../../data/spells.json';
import itemsData from '../../data/items.json';
import classFeatures from '../../data/class-features.json';
import srdWeapons from '../../data/srd/weapons.json';
import srdSpells from '../../data/srd/spells.json';
import srdItems from '../../data/srd/magic-items.json';
import srdGear from '../../data/srd/gear.json';
import srdFeats from '../../data/srd/feats.json';
import srdClasses from '../../data/srd/classes.json';

const SRD: Record<string, Set<string>> = {
  weapons: new Set(srdWeapons.weapons.map((w) => w.id)),
  masteries: new Set(srdWeapons.masteries.map((m) => m.id)),
  spells: new Set(srdSpells.spells.map((s) => s.id)),
  'magic-items': new Set(srdItems.items.map((i) => i.id)),
  gear: new Set(srdGear.gear.map((g) => g.id)),
  feats: new Set(srdFeats.feats.map((f) => f.id)),
  features: new Set(srdClasses.classes.flatMap((c) => c.features.map((f) => `${c.id}:${f.id}`))),
};

/** `<dosya>:<kimlik>` SRD referansı çözülüyor mu? */
const resolves = (ref: unknown) => {
  if (typeof ref !== 'string') return false;
  const i = ref.indexOf(':');
  return i > 0 && !!SRD[ref.slice(0, i)]?.has(ref.slice(i + 1));
};

/** Kayıt listesinin kimlik sorunları: kimliksiz, yinelenen, SRD karşılığı olmayan. */
function idProblems(records: readonly { id?: unknown; srd?: unknown; name?: unknown }[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const label = String(r.name ?? r.id ?? '?');
    if (typeof r.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)) { out.push(`${label}: kimlik yok`); continue; }
    if (seen.has(r.id)) out.push(`${r.id}: kimlik yineleniyor`);
    seen.add(r.id);
    if (!resolves(r.srd)) out.push(`${r.id}: SRD karşılığı yok (${String(r.srd)})`);
  }
  return out;
}

describe('kimlik kuralı: oyun verisi SRD kayıtlarına bağlı', () => {
  it('silahlar', () => expect(idProblems(weaponsData)).toEqual([]));
  it('büyüler', () => expect(idProblems(spellsData)).toEqual([]));
  it('eşyalar (sihirli eşya ya da donanım)', () => expect(idProblems(itemsData)).toEqual([]));
  it('silah kimliği SRD silah kimliğiyle aynı (mastery tablosu buna bağlı)', () => {
    for (const w of weaponsData) expect(w.srd).toBe(`weapons:${w.id}`);
  });
  it('feat mekanikleri SRD feat kimliğine bağlı', () => {
    expect(Object.keys(classFeatures.feats).filter((id) => !SRD.feats?.has(id))).toEqual([]);
  });
  it('sınıf özelliği anahtarları SRD özelliğine bağlı (sınıf:özellik)', () => {
    expect(Object.keys(classFeatures.features).filter((k) => !SRD.features?.has(k))).toEqual([]);
  });
  it('denetim kimliksiz ve SRD karşılıksız kaydı yakalar', () => {
    expect(idProblems([{ name: 'Kimliksiz' }])).toEqual(['Kimliksiz: kimlik yok']);
    expect(idProblems([{ id: 'laser-sword', name: 'Laser Sword', srd: 'weapons:laser-sword' }]))
      .toEqual(['laser-sword: SRD karşılığı yok (weapons:laser-sword)']);
    expect(idProblems([{ id: 'dagger', srd: 'weapons:dagger' }, { id: 'dagger', srd: 'weapons:dagger' }]))
      .toEqual(['dagger: kimlik yineleniyor']);
  });
});
