/**
 * KATALOG-1 F Aşama 2: Mühür Ruhu verisi (`data/bosslar-muhur.json`, `scripts/katalog-f-bosslar.mjs`). 30 kayıt, SRD
 * listesine karışmaz (330 kalır), getMonster bulur, faz2 şeması geçerli, efsanevi eylem ve sanat bağlı, Cimbombom zirvede,
 * savaşçı kurulur (tür, bağışıklık, zayıflık, faz bloğu, efsanevi direnç).
 */
import { describe, expect, it } from 'vitest';
import data from '../../data/bosslar-muhur.json';
import efsanevi from '../../data/efsanevi.json';
import yetenek from '../../data/canavar-yetenekleri.json';
import { attackRiders, getMonster, katalogMonsters, monsters, type Monster } from '.';
import { faz2Errors } from '../rules/faz2Schema';
import { combatantFromMonster } from '../battle/create';
import { monsterAvatar } from '../battle/avatar';
import { crNumber } from './monsterEnv';

const list = (data as unknown as { canavarlar: Array<Monster & { kademe: number; cizgi: string; ganimet: string; gorsel: string | null }> }).canavarlar;
const bosses = list.filter((m) => m.kademe === 3);

describe('KATALOG-1 F: Mühür Ruhu verisi', () => {
  it('30 kayıt (10 çizgi × 3 kademe), kimlikler tekil ve SRD dışı; SRD listesi 330', () => {
    expect(list).toHaveLength(30);
    expect(new Set(list.map((m) => m.id)).size).toBe(30);
    expect(monsters).toHaveLength(330);
    expect(katalogMonsters).toHaveLength(30);
    for (const m of list) expect(monsters.some((s) => s.id === m.id), m.id).toBe(false);
    for (const c of new Set(list.map((m) => m.cizgi))) expect(list.filter((m) => m.cizgi === c).map((m) => m.kademe).sort()).toEqual([1, 2, 3]);
  });
  it('getMonster bulur, görsel ve savaş jetonu bağlı (BOSS-GORSEL-1), ganimet taş kimliği', () => {
    for (const m of list) {
      expect(getMonster(m.id).id).toBe(m.id);
      expect(m.gorsel, m.id).toBe(`boss/${m.id}.webp`);
      expect(m.avatar, m.id).toBe(m.gorsel);
      expect(monsterAvatar(getMonster(m.id)).src, m.id).toBe(`boss/${m.id}.webp`);
      expect(m.ganimet).toMatch(m.kademe === 3 ? /^[a-z-]+$/ : /^(cracked|awakened)-elemental-stone-[a-z]+$/);
    }
  });
  it('bosslar: faz2 geçerli, efsanevi 3 eylem, sanat savaşta 1, efsanevi direnç 3', () => {
    expect(bosses).toHaveLength(10);
    const E = (efsanevi as unknown as { monsters: Record<string, { uses: number; actions: unknown[] }> }).monsters;
    const Y = yetenek as unknown as Record<string, { abilities?: Array<{ uses?: number; dc?: number }> }>;
    for (const b of bosses) {
      expect(faz2Errors(b.faz2, b.id)).toEqual([]);
      expect(E[b.id]?.uses).toBe(3);
      expect(E[b.id]?.actions).toHaveLength(3);
      expect(Y[b.id]?.abilities?.[0]).toMatchObject({ uses: 1, dc: 16 });
      expect(b.traits).toContain('Legendary Resistance (3/Day)');
    }
  });
  it('Cimbombom zirvede: CR, HP, saldırı sayısı', () => {
    const top = bosses.find((b) => b.id === 'cimbombom')!;
    expect(crNumber(top.cr)).toBe(26);
    const count = (m: Monster) => m.attacks.filter((a) => (a.repeat ?? 0) > 0).reduce((n, a) => n + (a.repeat ?? 0), 0);
    for (const b of bosses.filter((x) => x.id !== 'cimbombom')) {
      expect(crNumber(b.cr), b.id).toBeLessThan(26);
      expect(b.hp, b.id).toBeLessThan(top.hp);
      expect(count(b), b.id).toBeLessThanOrEqual(count(top));
    }
  });
  it('saldırı ekleri ortak tabloda; savaşçı kurulur (tür, bağışıklık, zayıflık, faz bloğu)', () => {
    expect(attackRiders['cimbombom:Bite']).toMatchObject({ extra: [{ dice: '7d10', type: 'fire' }] });
    const c = combatantFromMonster(getMonster('wolfgang'), { id: 'W', kuralSurumu: 107 });
    expect(c).toMatchObject({ creatureType: 'fiend', immunities: ['cold'], vulnerabilities: ['fire'], resources: { legendaryResistance: 3 } });
    expect(c.faz2).toMatchObject({ zayiflikKaldir: ['fire'], nefesDoldur: true, nefesAlan: 1.25 });
    expect(combatantFromMonster(getMonster('lightaur'), { id: 'L', kuralSurumu: 107 }).creatureType).toBe('celestial');
    expect(combatantFromMonster(getMonster('stormer'), { id: 'S', kuralSurumu: 107 }).faz2).toMatchObject({ geciciCan: 42 });
  });
});
