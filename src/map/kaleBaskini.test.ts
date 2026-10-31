/**
 * Görev KB: Kale Baskını (sefer haritası 1). Sefer bayrağı (barut patlaması, alarm koşusu) yalnızca bu haritada; Klasik
 * ve H2 haritaları ayrı. Gruplar (koğuş uyuyor, devriye ve kule habersiz), hedefler any(iç kapıyı kır, kuleye çık) +
 * alarmdan 6 tur sonra başarısız, nesneler, erişilebilirlik ve iç kapının dışarıdan görünmemesi.
 */
import { describe, expect, it } from 'vitest';
import { getMap, tileAt } from './maps';
import { neighbors, hexKey, type Offset } from '../rules/hex';
import { SCENARIOS, seeded, setupBattle } from '../sim/balance';
import { houseRule } from '../battle/houseRules';
import { goalOutcome } from '../battle/goals';
import { sightBlockedBetween } from '../battle/cover';
import { terrainAt } from '../battle/movement';

const o = (col: number, row: number): Offset => ({ col: col - 1, row: row - 1 });

describe('Kale Baskını', () => {
  const kb = SCENARIOS.find((s) => s.id === 'kale-baskini')!;
  it('sefer bayrağı yalnızca bu haritada; Kale ve avlu ile Klasik kale bayraksız', () => {
    expect(getMap('kale-baskini').seferKurallari).toEqual(['barutPatlama', 'alarmKosusu']);
    expect(getMap('kale-avlu').seferKurallari).toEqual([]);
    expect(getMap('kale').seferKurallari).toEqual([]);
    const s = setupBattle(kb, seeded(1), 3);
    expect([houseRule(s, 'barutPatlama'), houseRule(s, 'alarmKosusu'), houseRule(s, 'lair')]).toEqual([true, true, false]);
  });
  it('3. ve 5. seviyede gruplar, hedefler ve nesneler kurulur', () => {
    for (const level of [3, 5]) {
      const s = setupBattle(kb, seeded(1), level);
      expect(s.status).toBe('active');
      const g = Object.fromEntries((s.groups ?? []).map((x) => [x.id, x]));
      expect(g.kogus?.state).toBe('asleep');
      expect(g.kogus?.members?.length).toBe(6);
      expect([g.devriye?.state, g.kule?.state]).toEqual(['calm', 'calm']);
      expect(g.devriye?.members?.length).toBe(2);
      expect(g.kogus?.members?.every((id) => s.combatants[id]?.asleep)).toBe(true);
      expect(s.goals).toMatchObject({ mode: 'any', fail: [{ kind: 'alarm' }] });
      // K15A: sayaç veriden (data/alarm.json failRounds 6, matris ölçümüyle): alarmdan 6 tur sonra başarısız.
      expect(goalOutcome({ ...s, alarmRound: 1, round: 6 })).toBeNull();
      expect(goalOutcome({ ...s, alarmRound: 1, round: 7 })).toBe('enemies');
      expect(s.goals?.list.map((x) => x.kind)).toEqual(['destroy', 'reach']);
      const objs = Object.fromEntries((s.map?.objects ?? []).map((x) => [x.id, x]));
      expect(objs.icKapi).toMatchObject({ kind: 'gate', state: 'locked', hp: 27 });
      expect(objs.barut?.kind).toBe('powderKeg');
      expect((s.map?.objects ?? []).filter((x) => x.kind === 'oilBarrel').length).toBe(3);
    }
  });
  it('kule ve iç kapının önü batıdan yürüyerek ulaşılır; iç kapı orman kenarından görünmez', () => {
    const s = setupBattle(kb, seeded(1), 3);
    const m = getMap('kale-baskini');
    const seen = new Set<string>();
    const queue = m.startZones.players.slice(0, 1);
    queue.forEach((h) => seen.add(hexKey(h)));
    while (queue.length) {
      const h = queue.shift()!;
      for (const n of neighbors(h, m.size)) {
        const t = terrainAt(s, n);
        if (t.movement === 'blocked' || t.movement === 'deadly' || seen.has(hexKey(n))) continue;
        seen.add(hexKey(n)); queue.push(n);
      }
    }
    expect(seen.has(hexKey(o(29, 3)))).toBe(true);
    expect(tileAt(m, o(29, 3)).height).toBe(2);
    expect(seen.has(hexKey(o(24, 15)))).toBe(true);
    for (const h of m.startZones.players) expect(sightBlockedBetween(s, h, o(24, 14)), hexKey(h)).not.toBeNull();
  });
});
