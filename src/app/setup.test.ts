import { describe, it, expect } from 'vitest';
import { getMonster } from '../data';
import { scripted } from '../battle/fixtures';
import { DEMO_SHEETS } from '../demo';
import { dispatch } from '../ui/session';
import { distance } from '../rules/hex';
import { isRiskyHex } from '../battle/maprules';
import { getMap } from '../map/maps';
import {
  civilianHexProblem, civilianRule, maxCivilians, mirrorHexes,
  battleSummary, civilianSpots, createMapBattle, customMonster, customMonsterProblems, planParticipants, planProblems, type BattlePlan,
  type CustomMonsterInput,
} from './setup';

const ogreish: CustomMonsterInput = {
  name: 'Haydut', ac: 13, hp: 20, speed: 30, attackName: 'Pala', attackBonus: 4, damage: '1d6+2', damageType: 'slashing', ranged: false,
};
const plan = (patch: Partial<BattlePlan> = {}): BattlePlan => ({
  party: [{ id: 'k1', sheet: DEMO_SHEETS.MIRA }, { id: 'k2', sheet: DEMO_SHEETS.BOR }],
  enemies: [{ monster: getMonster('wolf'), count: 2 }, { monster: customMonster(ogreish, 'custom1'), count: 1 }],
  mapId: 'col', variantId: 'gunduz', mirrored: false, ...patch,
});

describe('özel canavar', () => {
  it('doğrulama ve motor kaydı', () => {
    expect(customMonsterProblems(ogreish)).toEqual([]);
    expect(customMonsterProblems({ ...ogreish, name: '', ac: 0, damage: 'çok' })).toEqual([
      'Ad boş olamaz.', 'AC 1–30 olmalı.', 'Hasar "1d8+2" biçiminde olmalı.',
    ]);
    const m = customMonster(ogreish, 'c1');
    expect(m.attacks[0]).toMatchObject({ name: 'Pala', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', reachFt: 5 });
  });
});

describe('savaş planı', () => {
  it('sorunlar: boş parti, düşmansız, yer yetmez', () => {
    expect(planProblems(plan())).toEqual([]);
    expect(planProblems(plan({ party: [], enemies: [] }))).toEqual(['En az bir oyuncu karakteri seçilmeli.', 'En az bir düşman seçilmeli.']);
    expect(planProblems(plan({ enemies: [{ monster: getMonster('wolf'), count: 40 }] })).join()).toContain('düşman yeri');
  });
  it('savaşçılar: karakterin sahibi kendisi, aynı canavarlar numaralı', () => {
    const ps = planParticipants(plan());
    expect(ps.map((c) => c.name)).toEqual(['Mira', 'Bor', 'Wolf 1', 'Wolf 2', 'Haydut']);
    expect(ps[0]?.ownerId).toBe('k1');
  });
  it('haritalı savaş: herkes yerleşmiş kurulumda başlar; GM başlatır', () => {
    const s = createMapBattle(planParticipants(plan()), { mapId: 'col', variantId: 'gunduz', mirrored: false }, scripted(...Array.from({ length: 5 }, () => [20, 10] as [number, number])));
    expect(s.state.status).toBe('setup');
    expect(Object.values(s.state.combatants).every((c) => c.pos !== null)).toBe(true);
    expect(dispatch(s, { type: 'start_battle' }, scripted()).state.status).toBe('active');
  });
});

describe('masum yerleşimi ve bilgi amaçlı masum sayımı', () => {
  const tavern = (patch: Record<string, unknown> = {}) => createMapBattle(
    planParticipants(plan({ mapId: 'taverna', variantId: 'ic-mekan' })),
    { mapId: 'taverna', variantId: 'ic-mekan', mirrored: false, options: ['objective'], civilians: 4, ...patch },
    scripted(...Array.from({ length: 10 }, () => [20, 10] as [number, number])),
  ).state;
  const civ = (st: ReturnType<typeof tavern>) => Object.values(st.combatants).filter((c) => c.civilian);
  const nearestFoe = (st: ReturnType<typeof tavern>, h: { col: number; row: number }) =>
    Math.min(...Object.values(st.combatants).filter((c) => c.side === 'enemies').map((c) => distance(h, c.pos as { col: number; row: number })));
  it('varsayılan: masumlar düşmanlardan en uzak, yürünebilir ve tehlikesiz altıgenlere', () => {
    const st = tavern();
    const placed = civ(st);
    expect(placed).toHaveLength(4);
    expect(placed.every((c) => c.pos !== null)).toBe(true);
    const spots = civilianSpots(st, 'far');
    const best = nearestFoe(st, spots[0] as { col: number; row: number });
    for (const c of placed) expect(nearestFoe(st, c.pos as { col: number; row: number })).toBeGreaterThanOrEqual(best - 1);
    for (const h of spots) expect(isRiskyHex(st, h)).toBe(false);
  });
  it('"ortada" seçeneği masumları haritanın ortasına koyar; uzak yerleşimden düşmana daha yakın', () => {
    const mid = tavern({ civilianPlacement: 'middle' });
    const far = tavern();
    const avg = (st: ReturnType<typeof tavern>) => civ(st).reduce((n, c) => n + nearestFoe(st, c.pos as { col: number; row: number }), 0) / 4;
    expect(avg(mid)).toBeLessThan(avg(far));
    expect(civ(mid).every((c) => distance(c.pos as { col: number; row: number }, { col: 7, row: 3 }) <= 2)).toBe(true);
  });
  it('masum ölümü varsayılan bilgi amaçlı; sıkı kural isteğe bağlı; özet kurtarılan ve ölen masumu sayar', () => {
    expect(tavern().map?.objective?.strict).toBeUndefined();
    expect(tavern({ strictObjective: true }).map?.objective?.strict).toBe(true);
    const st = tavern();
    const [a, b] = civ(st);
    const dead = { ...st, combatants: { ...st.combatants, [a!.id]: { ...a!, hp: 0, life: 'dead' as const }, [b!.id]: { ...b!, hp: 0, life: 'dead' as const } } };
    expect(battleSummary([], dead).civilians).toEqual({ total: 4, saved: 2, dead: 2 });
    expect(battleSummary([], createMapBattle(planParticipants(plan()), { mapId: 'col', variantId: 'gunduz', mirrored: false }, scripted()).state).civilians).toBe(null);
  });
});

describe('masum ayarı: sayaç, rastgele ve elle yerleşim', () => {
  const make = (patch: Record<string, unknown>, mapId = 'taverna', variantId = 'ic-mekan') => createMapBattle(
    planParticipants(plan({ mapId, variantId })),
    { mapId, variantId, mirrored: false, options: ['objective'], ...patch },
    scripted(...Array.from({ length: 12 }, () => [20, 10] as [number, number])),
  ).state;
  const civPos = (st: ReturnType<typeof make>) => Object.values(st.combatants).filter((c) => c.civilian).map((c) => c.pos);
  it('sayaç: Taverna varsayılan 4, Şehir Meydanı 6; üst sınır 12 ve uygun altıgen sayısı', () => {
    expect(civilianRule('taverna', 'ic-mekan')).toMatchObject({ default: 4, hp: 4, ac: 10, speedHexes: 6 });
    expect(civilianRule('sehir-meydani', 'gun')?.default).toBe(6);
    expect(civilianRule('col', 'gunduz')).toBe(null);
    for (const [m, v] of [['taverna', 'ic-mekan'], ['sehir-meydani', 'gun'], ['sehir-meydani', 'gece']]) {
      const max = maxCivilians(m as string, v as string);
      expect(max).toBeLessThanOrEqual(12);
      expect(max).toBeGreaterThan(0);
    }
    expect(civPos(make({}))).toHaveLength(4);
    expect(civPos(make({}, 'sehir-meydani', 'gun'))).toHaveLength(6);
    expect(civPos(make({ civilians: 0 }))).toHaveLength(0);
    expect(civPos(make({ civilians: 30 }))).toHaveLength(12);
  });
  it('rastgele yerleşim tohumludur: aynı tohum aynı yerler, farklı tohum farklı', () => {
    const a = civPos(make({ civilianPlacement: 'random', civilianSeed: 7 }));
    const b = civPos(make({ civilianPlacement: 'random', civilianSeed: 7 }));
    const c = civPos(make({ civilianPlacement: 'random', civilianSeed: 8 }));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const h of a) expect(civilianHexProblem('taverna', 'ic-mekan', false, h as { col: number; row: number })).toBe(null);
  });
  it('elle yerleşim: geçersiz altıgenler reddedilir; eksikse "Savaşı kur" sorunu', () => {
    const map = getMap('taverna');
    const enemyZone = map.startZones.enemies[0] as { col: number; row: number };
    expect(civilianHexProblem('taverna', 'ic-mekan', false, enemyZone)).toBe('düşman başlangıç bölgesi');
    let wall: { col: number; row: number } | null = null;
    const ok: Array<{ col: number; row: number }> = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 15; col++) {
        const p = civilianHexProblem('taverna', 'ic-mekan', false, { col, row });
        if (p?.startsWith('engel') && !wall) wall = { col, row };
        if (!p) ok.push({ col, row });
      }
    }
    expect(wall).not.toBe(null);
    const base = plan({ mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 2, civilianPlacement: 'manual' });
    expect(planProblems({ ...base, civilianHexes: [ok[0] as { col: number; row: number }, wall as { col: number; row: number }] }))
      .toContain('Elle yerleşim: 1 masum daha yerleştirin (1/2).');
    expect(planProblems({ ...base, civilianHexes: ok.slice(0, 2) })).toEqual([]);
    expect(civPos(make({ civilians: 2, civilianPlacement: 'manual', civilianHexes: ok.slice(0, 2) }))).toEqual(ok.slice(0, 2));
  });
  it('aynalamada elle konan masumlar zeminle birlikte aynalanır', () => {
    expect(mirrorHexes([{ col: 2, row: 3 }, { col: 14, row: 0 }])).toEqual([{ col: 12, row: 3 }, { col: 0, row: 0 }]);
    const m = getMap('sehir-meydani', { variantId: 'gun' });
    const mm = getMap('sehir-meydani', { variantId: 'gun', mirrored: true });
    const h = { col: 7, row: 1 };
    const [mh] = mirrorHexes([h]);
    expect(mm.tiles[mh!.row]?.[mh!.col]).toBe(m.tiles[h.row]?.[h.col]);
    // Ortadaki uygun bir altıgen: aynalı savaşta aynalı yerine konur.
    const free: Array<{ col: number; row: number }> = [];
    for (let col = 5; col <= 9; col++) for (let row = 0; row < 7; row++) {
      if (!civilianHexProblem('sehir-meydani', 'gun', false, { col, row }) && !civilianHexProblem('sehir-meydani', 'gun', true, mirrorHexes([{ col, row }])[0]!)) free.push({ col, row });
    }
    const pick = free.slice(0, 2);
    const st = createMapBattle(planParticipants(plan({ mapId: 'sehir-meydani', variantId: 'gun' })),
      { mapId: 'sehir-meydani', variantId: 'gun', mirrored: true, options: ['objective'], civilians: 2, civilianPlacement: 'manual', civilianHexes: mirrorHexes(pick) },
      scripted(...Array.from({ length: 12 }, () => [20, 10] as [number, number]))).state;
    expect(civPos(st)).toEqual(mirrorHexes(pick));
  });
});

describe('savaş sonu özeti', () => {
  it('verilen/alınan hasar ve düşürme olaylardan sayılır', () => {
    const s = createMapBattle(planParticipants(plan()), { mapId: 'col', variantId: 'gunduz', mirrored: false }, scripted(...Array.from({ length: 5 }, () => [20, 10] as [number, number])));
    const events = [
      ...s.events,
      { type: 'attack_resolved', actorId: 'pc2', targetId: 'foe1', label: 'x', mode: 'normal', reasons: [], d20: [15], natural: 15, total: 20,
        targetAc: 12, hit: true, critical: false, fumble: false, damageRolls: [8], rawDamage: 11, appliedDamage: 11, damageType: 'slashing',
        damageNote: null, targetHpAfter: 0, effects: [] },
    ] as typeof s.events;
    const sum = battleSummary(events, s.state);
    expect(sum.rows.find((r) => r.id === 'pc2')).toMatchObject({ dealt: 11, downed: 1 });
    expect(sum.rows.find((r) => r.id === 'foe1')).toMatchObject({ taken: 11 });
  });
});
