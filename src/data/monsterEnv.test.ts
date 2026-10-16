/** Canavar ortamları ve güç kademeleri: veri monsters.json ile tutarlı, her haritanın listesi dolu. */
import { describe, it, expect } from 'vitest';
import { monsters } from './index';
import { MONSTER_ENVS, TIERS, crNumber, fitsMap, monsterEnv, tierOf } from './monsterEnv';
import { maps } from '../map/maps';

/** Haritası olmayan ortamlar: haritasız savaş ve ileride eklenecek Buzul dağı. */
const MAPLESS = ['duz-zemin', 'buzul'];

describe('canavar ortamları', () => {
  it('330 canavarın her biri bir kez, kimlik ve CR monsters.json ile aynı', () => {
    expect(MONSTER_ENVS.length).toBe(monsters.length);
    expect(new Set(MONSTER_ENVS.map((m) => m.id)).size).toBe(monsters.length);
    for (const m of monsters) {
      const e = monsterEnv(m.id);
      expect(e, m.id).toBeDefined();
      expect([m.id, e?.cr]).toEqual([m.id, m.cr]);
      expect(e?.crSayi).toBe(crNumber(m.cr));
    }
  });
  it('her canavarın en az bir ortamı ve teması var; ortamlar harita kimliği ya da bilinen haritasız ortam', () => {
    const ids = new Set([...maps.map((m) => m.id), ...MAPLESS]);
    for (const e of MONSTER_ENVS) {
      expect(e.ortam.length, e.id).toBeGreaterThan(0);
      expect(e.tema.length, e.id).toBeGreaterThan(0);
      for (const o of e.ortam) expect(ids.has(o), `${e.id}: ${o}`).toBe(true);
    }
  });
  it('her haritada en az bir canavar var; Volkan ateşli, Taverna kasaba', () => {
    for (const m of maps) expect(monsters.filter((x) => fitsMap(x.id, m.id)).length, m.id).toBeGreaterThan(0);
    expect(fitsMap('hell-hound', 'volkan')).toBe(true);
    expect(fitsMap('commoner', 'volkan')).toBe(false);
    expect(fitsMap('commoner', 'taverna')).toBe(true);
    expect(fitsMap('ozel-123', 'volkan')).toBe(true); // özel canavar her yerde
  });
});

describe('güç kademeleri', () => {
  it('Ufak 0–½, Orta 1–3, Güçlü 4–8, Boss 9–14, Efsanevi 15+', () => {
    expect(crNumber('1/8')).toBe(0.125);
    expect(['0', '1/8', '1/2', '1', '3', '4', '8', '9', '14', '15', '30'].map((c) => tierOf(c).id))
      .toEqual(['ufak', 'ufak', 'ufak', 'orta', 'orta', 'guclu', 'guclu', 'boss', 'boss', 'efsanevi', 'efsanevi']);
    expect(TIERS.map((t) => t.name)).toEqual(['Ufak', 'Orta', 'Güçlü', 'Boss', 'Efsanevi']);
  });
  it('düzeltilen dört CR gerçek veriye göre kademede', () => {
    expect(tierOf(monsterEnv('pirate')?.cr ?? '').id).toBe('orta');
    expect(tierOf(monsterEnv('swarm-of-crawling-claws')?.cr ?? '').id).toBe('orta');
    expect(tierOf(monsterEnv('troll-limb')?.cr ?? '').id).toBe('ufak');
    expect(monsterEnv('spider')?.cr).toBe('0');
  });
});
