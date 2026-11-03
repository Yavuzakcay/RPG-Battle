/** Kuyruk 19 (görev 7): SRD'nin 28 yeni efsanevi canavarı (`data/efsanevi.json` `k19`; anahtar `srdK19`). */
import { describe, expect, it } from 'vitest';
import { startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { applyEvents } from './reduce';
import { combatantFromMonster } from './create';
import { legendaryEvents, legendaryOf } from './boss';
import { getMonster } from '../data';
import { seededRng as seeded } from '../rules/dice';
import { mk, sword } from './fixtures';
import './commands';

const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
function arena(monId: string, toggles?: Record<string, boolean>, kuralSurumu = 16, foePos = { col: 5, row: 3 }): BattleState {
  const boss = { ...combatantFromMonster(getMonster(monId), { id: 'X' }), side: 'enemies' as const };
  const parts = [mk('A', { ownerId: 'p1', hp: 200, maxHp: 200, weaponOptions: [sword], speed: 30 }), mk('B', { ownerId: 'p1', hp: 200, maxHp: 200, weaponOptions: [sword], speed: 30 }), boss];
  const { state } = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } });
  const combatants = { ...state.combatants };
  combatants.X = { ...(combatants.X as Combatant), pos: { col: 7, row: 3 } };
  combatants.A = { ...(combatants.A as Combatant), pos: foePos };
  combatants.B = { ...(combatants.B as Combatant), pos: { col: foePos.col, row: foePos.row + 1 } };
  return { ...state, status: 'active', round: 1, order: ['A', 'B', 'X'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const used = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'legendary_used').map((e) => (e.type === 'legendary_used' ? e.actionId : ''));

describe('Kuyruk 19: SRD efsanevi eylemleri', () => {
  it('30 SRD efsanevi canavarının hepsi veride', async () => {
    const data = (await import('../../data/efsanevi.json')).default as { monsters: Record<string, unknown> };
    expect(Object.keys(data.monsters).length).toBeGreaterThanOrEqual(30);
  });
  it('Adult Black Dragon: Cloud of Insects (DEX save, zehir, konsantrasyon dezavantajı), sonra Fear büyüsü; kapalıyken yok', () => {
    const s = arena('adult-black-dragon');
    expect(legendaryOf(s, s.combatants.X as Combatant)?.uses).toBe(3);
    const ev = legendaryEvents(s, 'A', seeded(3));
    expect(used(ev)[0]).toBe('cloud-of-insects');
    expect(ev.some((e) => e.type === 'save_resolved' && e.damageType === 'poison')).toBe(true);
    const s2 = applyEvents(s, ev);
    const ev2 = legendaryEvents(s2, 'B', seeded(4));
    expect(used(ev2)[0]).toBe('frightful-presence');
    expect(legendaryOf(arena('adult-black-dragon', { srdK19: false }), s.combatants.X as Combatant)).toBeNull();
    expect(legendaryOf(arena('adult-black-dragon', undefined, 10), s.combatants.X as Combatant)).toBeNull();
  });
  it('Lich: yanındaki düşmanlardan Deathly Teleport ile uzaklaşır, kalkıştaki 10 ft\'e nekrotik hasar', () => {
    const s = arena('lich', undefined, 16, { col: 6, row: 3 });
    const ev = legendaryEvents(s, 'A', seeded(5));
    expect(used(ev)[0]).toBe('deathly-teleport');
    expect(ev.some((e) => e.type === 'teleported' && e.actorId === 'X')).toBe(true);
    expect(ev.filter((e) => e.type === 'map_effect' && (e.damage?.applied ?? 0) > 0).length).toBeGreaterThan(0);
  });
  it('Unicorn: Shimmering Shield yaralı dosta geçici HP ve AC +2', () => {
    const s0 = arena('unicorn', undefined, 16, { col: 1, row: 1 });
    const s = { ...s0, combatants: { ...s0.combatants, X: { ...(s0.combatants.X as Combatant), hp: 10 } } };
    const ev = legendaryEvents(s, 'A', seeded(5));
    expect(used(ev)).toContain('shimmering-shield');
    expect(ev.some((e) => e.type === 'temp_hp' && e.targetId === 'X')).toBe(true);
  });
});

describe('Kuyruk 19: SRD Multiattack planı', () => {
  it('Bandit Captain: Scimitar ve Pistol herhangi bir bileşimde, ayrı hedeflere; kural dışı plan reddedilir; kapalıyken plan yok sayılır', async () => {
    const { execute } = await import('./index');
    const { GM } = await import('./fixtures');
    const s = arena('bandit-captain', undefined, 16, { col: 6, row: 3 });
    const r = execute({ ...s, turnIndex: 2 }, { type: 'multiattack', actorId: 'X', targetId: 'A', plan: [{ attack: 'Scimitar', targetId: 'A' }, { attack: 'Pistol', targetId: 'B' }] }, GM, seeded(2));
    if (!r.ok) throw new Error(r.error);
    const hits = r.events.filter((e) => e.type === 'attack_resolved').map((e) => (e.type === 'attack_resolved' ? e.targetId : ''));
    expect(hits).toEqual(['A', 'B']);
    const bad = execute({ ...s, turnIndex: 2 }, { type: 'multiattack', actorId: 'X', targetId: 'A', plan: [{ attack: 'Scimitar' }, { attack: 'Scimitar' }, { attack: 'Pistol' }] }, GM, seeded(2));
    expect(bad.ok).toBe(false);
    const off = arena('bandit-captain', { srdK19: false }, 16, { col: 6, row: 3 });
    const r2 = execute({ ...off, turnIndex: 2 }, { type: 'multiattack', actorId: 'X', targetId: 'A', plan: [{ attack: 'Pistol', targetId: 'B' }] }, GM, seeded(2));
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.events.filter((e) => e.type === 'attack_resolved').every((e) => e.type === 'attack_resolved' && e.targetId === 'A')).toBe(true);
  });
  it('Yapay zekâ: menzildeki Bandit Captain iki Pistol atışı planlar (eskiden yalnızca Scimitar)', async () => {
    const { chooseEnemyCommand } = await import('./ai');
    const s = arena('bandit-captain', undefined, 16, { col: 1, row: 1 });
    const cmd = chooseEnemyCommand({ ...s, turnIndex: 2, combatants: { ...s.combatants, X: { ...(s.combatants.X as Combatant), movementUsed: 99 } } });
    expect(cmd).toMatchObject({ type: 'multiattack', plan: [{ attack: 'Pistol' }, { attack: 'Pistol' }] });
  });
});

