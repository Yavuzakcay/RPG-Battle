/** KQ6-9: her harita en az `hedefEnAz` uygun canavara sahip; ortam eşlemesi yalnız genişledi. */
import { describe, expect, it } from 'vitest';
import { maps } from '../map/maps';
import { MONSTER_ENVS } from './monsterEnv';
import conf from '../../data/ortam-genisletme.json';

describe('ortam genişletme (KQ6-9)', () => {
  it('her harita (gizliler dahil) en az 25 uygun canavara sahip (istisna listesi dışında)', () => {
    const ist = new Set((conf as { istisna: string[] }).istisna);
    const az = maps.filter((m) => !ist.has(m.id)).map((m) => [m.id, MONSTER_ENVS.filter((e) => e.ortam.includes(m.id)).length] as const).filter(([, n]) => n < conf.hedefEnAz);
    expect(az).toEqual([]);
  });
  it('donör kuralı en çok 4 donör; donörler gerçek harita', () => {
    const ids = new Set(maps.map((m) => m.id));
    for (const [m, ds] of Object.entries(conf.donorler)) { expect(ids.has(m), m).toBe(true); expect(ds.length, m).toBeLessThanOrEqual(4); for (const d of ds) expect(ids.has(d), `${m}←${d}`).toBe(true); }
  });
  it('CR tavanı (`crTavan`): Taverna\'da CR 8 üstü canavar yok (boss kademesi yok)', () => {
    const cap = (conf as unknown as { crTavan: Record<string, number | string> }).crTavan;
    const crNum = (cr: string) => { const [a, b] = cr.split('/').map(Number); return b ? (a as number) / b : (a as number); };
    for (const [m, max] of Object.entries(cap)) {
      if (typeof max !== 'number') continue;
      expect(MONSTER_ENVS.filter((e) => e.ortam.includes(m) && crNum(e.cr) > max).map((e) => e.id), m).toEqual([]);
    }
  });
  it('Mielikki Gölü yüzücü canavar içerir (Octopus)', () => {
    expect(MONSTER_ENVS.find((e) => e.id === 'octopus')?.ortam).toContain('orman-heykel-golu');
  });
});
