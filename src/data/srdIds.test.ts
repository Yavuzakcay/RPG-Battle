/**
 * Kimlik kuralı (Görev P0): her büyü, silah, eşya, feat ve sınıf özelliği sabit bir kimlik taşır ve `data/srd/`
 * içindeki bir kayda bağlanır. Yeni kayıt kimliksiz ya da SRD karşılıksız eklenirse bu test kırılır.
 */
import { describe, it, expect } from 'vitest';
import weaponsData from '../../data/weapons.json';
import spellsMain from '../../data/spells.json';
import spells45 from '../../data/spells-45.json';
import itemsData from '../../data/items.json';
import classFeatures from '../../data/class-features.json';
import srdWeapons from '../../data/srd/weapons.json';
import srdSpells from '../../data/srd/spells.json';
import srdItems from '../../data/srd/magic-items.json';
import srdGear from '../../data/srd/gear.json';
import srdTools from '../../data/srd/tools.json';
import srdFeats from '../../data/srd/feats.json';
import srdClasses from '../../data/srd/classes.json';
import srdSubclasses from '../../data/srd/subclasses.json';
import srdSpecies from '../../data/srd/species.json';
import racesData from '../../data/races.json';
import srdBackgrounds from '../../data/srd/backgrounds.json';
import backgroundsData from '../../data/backgrounds.json';
import itemsSrdData from '../../data/items-srd.json';
import itemsKatalog from '../../data/items-katalog.json';
import silahBagi from '../../data/esya-silah-bagi.json';
import spells69 from '../../data/spells-69.json';

const SRD: Record<string, Set<string>> = {
  weapons: new Set(srdWeapons.weapons.map((w) => w.id)),
  masteries: new Set(srdWeapons.masteries.map((m) => m.id)),
  spells: new Set(srdSpells.spells.map((s) => s.id)),
  'magic-items': new Set(srdItems.items.map((i) => i.id)),
  gear: new Set(srdGear.gear.map((g) => g.id)),
  // Kuyruk 19: aletler (data/srd/tools.json).
  tools: new Set(srdTools.tools.map((g) => g.id)),
  // Tür özellikleri (Görev R4): `species:<tür>/<özellik>` (data/srd/species.json).
  species: new Set(srdSpecies.species.flatMap((s) => s.traits.map((t) => `${s.id}/${t.id}`))),
  feats: new Set(srdFeats.feats.map((f) => f.id)),
  // Görev G1: geçmişler (data/srd/backgrounds.json).
  backgrounds: new Set(srdBackgrounds.backgrounds.map((b) => b.id)),
  features: new Set([
    ...srdClasses.classes.flatMap((c) => c.features.map((f) => `${c.id}:${f.id}`)),
    // Alt sınıf özellikleri: `sınıf/altsınıf:özellik`.
    ...srdSubclasses.subclasses.flatMap((s) => s.features.map((f) => `${s.classId}/${s.id}:${f.id}`)),
  ]),
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
  it('büyüler', () => expect(idProblems([...spellsMain, ...spells45])).toEqual([]));
  it('geçmişler (Görev G1): kimlik, SRD kaydı, yetenek/feat/beceri SRD ile aynı', () => {
    const all = backgroundsData.backgrounds as Array<{ id: string; srd?: string; ozgun?: boolean; name: { en: string }; abilities: string[]; feat: string; featList?: string; skills: string[] }>;
    expect(idProblems(all.filter((b) => !b.ozgun).map((b) => ({ ...b, name: b.name.en })))).toEqual([]);
    // Kuyruk 42: özgün geçmişler SRD'de yok; kimlik biçimi ve tekilliği yine denetlenir, köken feat'i SRD feat'i.
    const ids = all.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of all.filter((x) => x.ozgun)) {
      expect(b.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(b.srd).toBeUndefined();
      expect(resolves(`feats:${b.feat}`), b.id).toBe(true);
    }
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    for (const b of all.filter((x) => !x.ozgun)) {
      const srd = srdBackgrounds.backgrounds.find((x) => x.id === b.id)!;
      expect(b.abilities).toEqual(srd.abilities);
      expect(b.feat).toBe(srd.feat);
      expect((b as { featList?: string }).featList).toBe((srd as { featList?: string }).featList);
      expect(b.skills.map(norm)).toEqual(srd.skills.map(norm));
    }
  });
  // Görev KATALOG-1: `loadClassData` katalog eşyalarını aynı diziye (items.json modülü) ekler; SRD'ye bağlı olanlar burada.
  it('eşyalar (sihirli eşya ya da donanım)', () => expect(idProblems((itemsData as Array<{ id: string; srd?: string; name: string; kaynak?: string }>).filter((i) => !i.kaynak))).toEqual([]));
  // Görev KATALOG-1: özgün katalog eşyaları SRD'de yok (geçmişlerin `ozgun` kolu gibi); kimlik biçimi, tekillik, ad tekilliği
  // (eşyalar karakterde adla bağlanır: `itemNames`), PDF kaydı ve silah bağı yine denetlenir.
  it('KATALOG-1 özgün eşyalar: SRD kaydı yok; kimlik, ad, katalog bilgisi ve silah bağı tutarlı', () => {
    type K = { id: string; name: string; srd?: string; kaynak?: string; spells?: Array<{ name: string }>;
      katalog?: { ref: string; tr: string; nadirlik: string; tur: string; taban?: string; ozellikler: Array<{ ad: string; metin: string; durum: string }> } };
    const kat = (itemsKatalog as unknown as { esyalar: K[] }).esyalar;
    const others = [...(itemsData as Array<{ id: string; name: string; kaynak?: string }>), ...(itemsSrdData as Array<{ id: string; name: string; kaynak?: string }>), ...weaponsData].filter((x) => !('kaynak' in x && x.kaynak));
    const ids = new Set(others.map((x) => x.id));
    const names = new Set(others.map((x) => x.name.toLowerCase()));
    const refs = new Set<string>();
    const spellNames = new Set([...spellsMain, ...spells45, ...(spells69 as Array<{ name: string }>)].map((s) => s.name));
    const bag = (silahBagi as { esyalar: Record<string, string[] | string> }).esyalar;
    for (const i of kat) {
      expect(i.id, i.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ids.has(i.id), `${i.id}: kimlik yineleniyor`).toBe(false);
      expect(names.has(i.name.toLowerCase()), `${i.name}: ad yineleniyor`).toBe(false);
      ids.add(i.id); names.add(i.name.toLowerCase());
      expect(i.srd, i.id).toBeUndefined();
      expect(i.kaynak, i.id).toBe('katalog-1');
      const k = i.katalog!;
      expect(k, i.id).toBeDefined();
      expect(k.ref, i.id).toMatch(/^(S1|S2|KY|ZK|GY|YT|TK|BOSS)#\d+[a-z]?$/);
      expect(refs.has(k.ref), `${k.ref} yineleniyor`).toBe(false); refs.add(k.ref);
      expect(['olagandisi', 'nadir', 'cokNadir', 'efsanevi', 'yadigar']).toContain(k.nadirlik);
      expect(['silah', 'zirh', 'kalkan', 'tuketilebilir', 'aksesuar', 'sihirli']).toContain(k.tur);
      expect(k.tr.length, i.id).toBeGreaterThan(2);
      for (const o of k.ozellikler) {
        expect(['calisir', 'kismi', 'planli', 'calismiyor'], `${i.id}/${o.ad}`).toContain(o.durum);
        expect(o.metin.length, `${i.id}/${o.ad}`).toBeGreaterThan(5);
      }
      for (const s of i.spells ?? []) expect(spellNames.has(s.name), `${i.id}: büyü ${s.name}`).toBe(true);
      // Silah eşyası taban SRD silahına bağlı (KARAR104 A10; K11: karşılığı yoksa en yakın SRD silahı).
      if (k.tur === 'silah') {
        const rule = bag[i.id];
        expect(rule, `${i.id}: esya-silah-bagi satırı yok`).toBeDefined();
        expect(k.taban && weaponsData.some((w) => w.id === k.taban), `${i.id}: taban ${k.taban}`).toBe(true);
        if (Array.isArray(rule)) expect(rule, i.id).toContain(k.taban);
      }
    }
  });
  it('silah kimliği SRD silah kimliğiyle aynı (mastery tablosu buna bağlı)', () => {
    for (const w of weaponsData) expect(w.srd).toBe(`weapons:${w.id}`);
  });
  it('tür özellik mekanikleri SRD tür özelliğine bağlı (Dragonborn Breath Weapon)', () => {
    const refs = (racesData as Array<{ breathWeapon?: { srd: string } }>).flatMap((r) => (r.breathWeapon ? [r.breathWeapon.srd] : []));
    expect(refs).toEqual(['species:dragonborn/breath-weapon']);
    expect(refs.filter((r) => !resolves(r))).toEqual([]);
  });
  it('feat mekanikleri SRD feat kimliğine bağlı', () => {
    expect(Object.keys(classFeatures.feats).filter((id) => !SRD.feats?.has(id))).toEqual([]);
  });
  it('sınıf özelliği anahtarları SRD özelliğine bağlı (sınıf:özellik ya da sınıf/altsınıf:özellik)', () => {
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
