import { describe, it, expect } from 'vitest';
import { getMonster } from '../data';
import { scripted } from '../battle/fixtures';
import { DEMO_SHEETS } from '../demo';
import { dispatch } from '../ui/session';
import {
  battleSummary, createMapBattle, customMonster, customMonsterProblems, planParticipants, planProblems, type BattlePlan,
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
