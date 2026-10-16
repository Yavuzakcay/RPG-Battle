/** Canavar ortamları ve güç kademeleri: veri monsters.json ile tutarlı, her haritanın listesi dolu. */
import { describe, it, expect } from 'vitest';
import { monsters } from './index';
import { MONSTER_ENVS, TIERS, crNumber, envProblems, fitsMap, monsterEnv, tierOf, winterPick } from './monsterEnv';
import { maps } from '../map/maps';


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
  it('her canavarın en az bir ortamı ve teması var, ortam tekrarı yok', () => {
    for (const e of MONSTER_ENVS) {
      expect(e.ortam.length, e.id).toBeGreaterThan(0);
      expect(new Set(e.ortam).size, e.id).toBe(e.ortam.length);
      expect(e.tema.length, e.id).toBeGreaterThan(0);
    }
  });
  it('her ortam kimliği gerçek bir harita ya da "duz-zemin"; bilinmeyen kimlik hata verir', () => {
    const ids = maps.map((m) => m.id);
    expect(envProblems(MONSTER_ENVS, ids)).toEqual([]);
    const bad = [{ ...(MONSTER_ENVS[0] as (typeof MONSTER_ENVS)[number]), id: 'x', ortam: ['dag', 'buzul'] }];
    expect(envProblems(bad, ids)).toEqual(['x: bilinmeyen ortam "buzul"']);
  });
  it('eski Buzul dağı canavarları Dağ\'da ve kış varyantında öne çıkar', () => {
    const cold = MONSTER_ENVS.filter((e) => e.kis);
    expect(cold.length).toBe(25);
    for (const e of cold) expect(e.ortam, e.id).toContain('dag');
    expect(fitsMap('winter-wolf', 'dag')).toBe(true);
    expect([winterPick('winter-wolf', 'kis'), winterPick('winter-wolf', 'yaz'), winterPick('griffon', 'kis')]).toEqual([true, false, false]);
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
