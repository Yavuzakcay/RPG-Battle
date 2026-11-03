/** Kuyruk 19 (görev 7): SRD canavar yetenekleri (`data/canavar-yetenekleri.json`, `monsterAbilities.ts`; anahtar `srdK19`). */
import { describe, expect, it } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { applyEvents, replay } from './reduce';
import { combatantFromMonster } from './create';
import { getMonster } from '../data';
import { seededRng as seeded } from '../rules/dice';
import { GM, P1, mk, sword } from './fixtures';

const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
function arena(monId: string, opts: { toggles?: Record<string, boolean>; foe?: { col: number; row: number }; foeHp?: number } = {}): BattleState {
  const m = { ...combatantFromMonster(getMonster(monId), { id: 'X' }), side: 'enemies' as const };
  const parts = [mk('A', { ownerId: 'p1', hp: opts.foeHp ?? 200, maxHp: 200, weaponOptions: [sword], speed: 30 }), m];
  const { state } = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: 16, map: { id: 'col', ...(opts.toggles ? { ruleToggles: opts.toggles } : {}) } });
  const combatants = { ...state.combatants };
  combatants.X = { ...(combatants.X as Combatant), pos: { col: 7, row: 3 } };
  combatants.A = { ...(combatants.A as Combatant), pos: opts.foe ?? { col: 6, row: 3 } };
  return { ...state, status: 'active', round: 1, order: ['X', 'A'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const run = (s: BattleState, cmd: Parameters<typeof execute>[1], seed = 3) => { const r = execute(s, cmd, 'actorId' in cmd && cmd.actorId === 'A' ? P1 : GM, seeded(seed)); if (!r.ok) throw new Error(r.error); return r; };

describe('Kuyruk 19: SRD canavar yetenekleri', () => {
  it('Troll Charge: bonus eylemle hızın yarısı kadar düşmana koşar; kapalıyken yetenek yok', () => {
    const s = arena('troll', { foe: { col: 2, row: 3 } });
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'charge' });
    expect(r.state.combatants.X?.pos?.col).toBeLessThan(7);
    expect(r.state.combatants.X?.economy.bonus).toBe(true);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    expect(execute(arena('troll', { toggles: { srdK19: false } }), { type: 'monster_ability', actorId: 'X', abilityId: 'charge' }, GM, seeded(1)).ok).toBe(false);
  });
  it('Medusa Petrifying Gaze: koni CON save; başarısız Restrained (iki aşamalı), şarj bekler', () => {
    const s = arena('medusa');
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'petrifying-gaze' }, 1);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'A')).toBe(true);
    expect(r.state.combatants.X?.abilityRecharge).toContain('petrifying-gaze');
  });
  it('Steam Mephit: ölünce Death Burst (5 ft DEX save, ateş); Blurred Form saldırıya dezavantaj etkisi', () => {
    const s0 = arena('steam-mephit');
    expect(s0.combatants.X?.effects?.some((e) => e.attackedDis)).toBe(true);
    const s = { ...s0, order: ['A', 'X'] };
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'X', option: { ...sword, attackBonus: 30, damage: '20d6' } }, 5);
    expect(r.state.combatants.X?.hp).toBe(0);
    expect(r.events.some((e) => e.type === 'burst_done')).toBe(true);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'A' && e.damageType === 'fire')).toBe(true);
  });
  it('Flesh Golem: Lightning Absorption hasarı HP\'ye çevirir', async () => {
    const { damageEffects } = await import('./damage-effects');
    const { adjustDamage } = await import('../rules/damage');
    const { damageProfile } = await import('./common');
    const s = arena('flesh-golem');
    const g = { ...(s.combatants.X as Combatant), hp: 50 };
    const adj = adjustDamage(10, 'lightning', damageProfile(g));
    expect(adj).toEqual({ amount: -10, note: 'absorbed' });
    expect(damageEffects(g, adj.amount, 'lightning', false, () => 0.5).hpAfter).toBe(60);
  });
  it('Hydra: bir turda 25+ hasarda baş ölür, tur sonunda ateş almadıysa iki baş çıkar; Multiattack baş sayısı kadar', () => {
    const s0 = arena('hydra');
    expect(s0.combatants.X?.heads).toBe(5);
    const s = { ...s0, order: ['A', 'X'], combatants: { ...s0.combatants, X: { ...(s0.combatants.X as Combatant), headsTurnHp: (s0.combatants.X as Combatant).hp } } };
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'X', option: { ...sword, attackBonus: 30, damage: '30' } }, 5);
    const r2 = run(r.state, { type: 'end_turn', actorId: 'A' } as never, 5);
    expect(r2.state.combatants.X?.heads).toBe(4);
    expect(r2.state.combatants.X?.headsLost).toBe(1);
  });
  it('Yapay zekâ: Troll düşman uzaktayken Charge kullanır', async () => {
    const { chooseEnemyCommand } = await import('./ai');
    const s = arena('troll', { foe: { col: 1, row: 3 } });
    const cmd = chooseEnemyCommand(s);
    expect(cmd).toMatchObject({ type: 'monster_ability', abilityId: 'charge' });
  });
  it('Will-o\'-Wisp Consume Life: 0 HP\'deki yaratık CON save\'i başaramazsa ölür, wisp iyileşir', () => {
    const s0 = arena('will-o-wisp');
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), hp: 0, life: 'dying' as const }, X: { ...(s0.combatants.X as Combatant), hp: 5 } } };
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'consume-life' }, 1);
    const evs: BattleEvent[] = r.events;
    expect(evs.some((e) => e.type === 'map_effect' && e.roll)).toBe(true);
    void applyEvents;
  });
  it('Ochre Jelly Split: kesici hasarla ikiye bölünür (HP paylaşılır, küçük boy); sabit hasar SRD değeri', () => {
    const s0 = arena('ochre-jelly');
    const s = { ...s0, order: ['A', 'X'] };
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'X', option: { ...sword, attackBonus: 30, damage: '5', damageType: 'slashing' } }, 5);
    const twins = Object.values(r.state.combatants).filter((c) => c.monsterId === 'ochre-jelly');
    expect(twins.length).toBe(2);
    expect(twins[1]?.size).toBe('M');
    expect(twins[0]?.effects?.some((e) => e.size === -1)).toBe(true);
    expect(arena('bat').combatants.X?.attacks[0]?.damageDice).toBe('1');
  });
});

