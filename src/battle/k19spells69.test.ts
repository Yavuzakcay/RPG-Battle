/** Kuyruk 19 (görev 3): 6.–9. seviye büyüler (`data/spells-69.json`, `spells69.ts`; anahtar `spells69`). */
import { describe, expect, it } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleState, Combatant, Command } from './index';
import { replay } from './reduce';
import { spells } from '../data';
import { seededRng as seeded } from '../rules/dice';
import { GM, P1, mk } from './fixtures';

const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const wizard = (extra: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 80, maxHp: 80, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1], spellSaveDc: 19, spellAttack: 11, spellMod: 5,
  spellNames: ['Power Word Kill', 'Power Word Stun', 'Chain Lightning', 'Mass Heal', 'Time Stop', 'Wish', 'Fireball', 'Globe of Invulnerability', 'Disintegrate'], ...extra });
function field(foes: Array<Partial<Combatant>>, toggles?: Record<string, boolean>, allies: Array<Partial<Combatant>> = []): BattleState {
  const parts = [wizard(), ...allies.map((a, i) => mk(`L${i}`, { ownerId: 'p1', ...a })), ...foes.map((f, i) => mk(`F${i}`, { side: 'enemies', hp: 60, maxHp: 60, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...f }))];
  const { state } = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: 16, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } });
  const combatants = { ...state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: { col: 1, row: 3 } };
  allies.forEach((_, i) => { combatants[`L${i}`] = { ...(combatants[`L${i}`] as Combatant), pos: { col: 1, row: 4 + i } }; });
  foes.forEach((_, i) => { combatants[`F${i}`] = { ...(combatants[`F${i}`] as Combatant), pos: { col: 6 + i, row: 3 } }; });
  return { ...state, status: 'active', round: 1, order: ['A', ...allies.map((_, i) => `L${i}`), ...foes.map((_, i) => `F${i}`)], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const run = (s: BattleState, cmd: Command, seed = 3) => { const r = execute(s, cmd, P1, seeded(seed)); if (!r.ok) throw new Error(r.error); return r; };

describe('Kuyruk 19: 6.–9. seviye büyüler', () => {
  it('veride SRD\'nin 84 adet 6.–9. seviye büyüsünün hepsi; sınıf listeleri SRD\'den', () => {
    const hi = spells.filter((s) => s.level >= 6);
    expect(hi.length).toBe(84);
    expect(hi.find((s) => s.name === 'Wish')?.classes).toEqual(expect.arrayContaining(['Sor', 'Wiz']));
  });
  it('Power Word Kill: 100 HP ve altı ölür, üstü 12d12 Psychic; anahtar kapalıyken yapılamaz', () => {
    const s = field([{ hp: 90, maxHp: 90 }, { hp: 140, maxHp: 140 }]);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', targetId: 'F0' });
    expect(r.state.combatants.F0?.hp).toBe(0);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    const r2 = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', targetId: 'F1' });
    expect(r2.state.combatants.F1?.hp).toBeGreaterThan(0);
    expect(r2.state.combatants.F1?.hp).toBeLessThan(140);
    expect(execute(field([{}], { spells69: false }), { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', targetId: 'F0' }, P1, seeded(1)).ok).toBe(false);
  });
  it('Chain Lightning: birincil hedef ve 30 ft içindeki düşmanlar save yapar', () => {
    const s = field([{}, {}, {}]);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Chain Lightning', targetId: 'F0' });
    const hit = new Set(r.events.filter((e) => e.type === 'save_resolved').map((e) => (e.type === 'save_resolved' ? e.targetId : '')));
    expect([...hit].sort()).toEqual(['F0', 'F1', 'F2']);
  });
  it('Mass Heal: 700 HP en yaralı dostlardan başlayarak dağılır', () => {
    const s = field([{}], undefined, [{ hp: 5, maxHp: 50 }, { hp: 10, maxHp: 50 }]);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Mass Heal' });
    expect(r.state.combatants.L0?.hp).toBe(50);
    expect(r.state.combatants.L1?.hp).toBe(50);
  });
  it('Time Stop: büyücü art arda ek turlar oynar; başkasını etkileyince biter', () => {
    const s = field([{}]);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Time Stop' });
    const turns = r.state.timeStop?.left ?? 0;
    expect(turns).toBeGreaterThanOrEqual(2);
    const e = run(r.state, { type: 'end_turn', actorId: 'A' });
    expect(e.state.order[e.state.turnIndex]).toBe('A');
    const hit = execute(e.state, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: { col: 6, row: 3 } }, P1, seeded(2));
    if (!hit.ok) throw new Error(hit.error);
    expect(hit.state.timeStop).toBeUndefined();
  });
  it('Wish: Fireball\'u kopyalar, 9. seviye slot harcanır', () => {
    const s = field([{}]);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Wish', choice: 'Fireball', targetHex: { col: 6, row: 3 } });
    expect(r.state.combatants.A?.spellSlots[8]).toBe(0);
    expect(r.state.combatants.A?.spellSlots[2]).toBe(3);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toBe(true);
  });
  it('Globe of Invulnerability: içerideki hedef dışarıdan gelen 5. seviye ve altı büyüden etkilenmez', () => {
    const s0 = field([{}]);
    const s = { ...s0, combatants: { ...s0.combatants, F0: { ...(s0.combatants.F0 as Combatant), effects: [{ id: 'g', name: 'Globe', sourceId: 'F0', spellGlobe: 5, globeRadiusFt: 10, until: 99 }] } } } as BattleState;
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: { col: 6, row: 3 } });
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toBe(false);
    void GM;
  });
  it('Mystic Arcanum: Warlock 17 seçilen 6.–9. seviye büyüleri bilir, her biri uzun dinlenmede bir kez slotsuz', async () => {
    const { combatantFromSheet } = await import('./create');
    const { blankCharacter, suggestedScores } = await import('../rules/builder');
    const sheet = { ...blankCharacter('x').sheet, name: 'W', classId: 'warlock', level: 17, subclassId: 'fiend-patron', baseScores: suggestedScores('warlock'),
      featureChoices: { 'warlock:mystic-arcanum/9': 'Power Word Kill' } };
    const c = combatantFromSheet(sheet as never, { id: 'W', ownerId: 'p1' });
    expect(c.spellNames).toEqual(expect.arrayContaining(['Power Word Kill']));
    expect(c.freeSpells?.['Power Word Kill']).toBe('arcanum9');
    expect(c.resources.arcanum9).toBe(1);
    expect(c.spellNames.filter((n) => spells.find((x) => x.name === n)?.level === 6).length).toBeGreaterThanOrEqual(1);
  });
  it('Words of Creation: Bard 20 Power Word Kill ikinci hedefi (ilk hedefin 10 ft\'inde) de vurur', () => {
    const s0 = field([{ hp: 50, maxHp: 50 }, { hp: 50, maxHp: 50 }]);
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), traits: ['words-of-creation'] } } };
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', targetId: 'F0' });
    expect(r.state.combatants.F0?.hp).toBe(0);
    expect(r.state.combatants.F1?.hp).toBe(0);
  });
  it('Greater Divine Intervention: Cleric 20 Wish\'i bilir; Divine Intervention ile slotsuz (Slotsuz düğmesi)', async () => {
    const { combatantFromSheet } = await import('./create');
    const { blankCharacter, suggestedScores } = await import('../rules/builder');
    const sheet = { ...blankCharacter('x').sheet, name: 'C', classId: 'cleric', level: 20, subclassId: 'life-domain', baseScores: suggestedScores('cleric') };
    const c = combatantFromSheet(sheet as never, { id: 'C', ownerId: 'p1' });
    expect(c.spellNames).toContain('Wish');
    expect(c.freeSpells?.Wish).toBe('divineIntervention');
  });
});

