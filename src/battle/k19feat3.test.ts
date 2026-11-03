/** Kuyruk 19 (0b): alt sınıf kısmilerinin kalanı (anahtar `featuresK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { P1, mk } from './fixtures';
import { jumpRangeFeet } from './movement';
import { frightenedNow } from './ruleVersion';
import { checkReach } from './range';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';

const sword: AttackOption = { label: 'Longsword', attackBonus: 30, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'sword', weaponId: 'longsword' };
const OFF = { featuresK19: false };

function arena(ver: number, a: Partial<Combatant>, b: Partial<Combatant> = {}, toggles?: Record<string, boolean>, extra: Combatant[] = []) {
  const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword], ...a }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ...b }), ...extra];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  const pos: Record<string, { col: number; row: number }> = { A: { col: 3, row: 3 }, B: { col: 4, row: 3 }, P: { col: 2, row: 3 } };
  for (const id of Object.keys(combatants)) combatants[id] = { ...(combatants[id] as Combatant), pos: pos[id] ?? null };
  return { ...s0, status: 'active', round: 1, order: Object.keys(combatants), turnIndex: 0, combatants,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}

describe('Kuyruk 19: Remarkable Athlete', () => {
  it('kritik vuruştan sonra serbest kayma (sürüm 16); kapalıda yok', () => {
    for (const [s, want] of [[arena(16, { traits: ['remarkable-athlete'] }), true], [arena(16, { traits: ['remarkable-athlete'] }, {}, OFF), false]] as const) {
      const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.99);
      expect(r.ok && r.events.some((e) => e.type === 'shift_granted')).toBe(want);
    }
  });
});

describe('Kuyruk 19: Thief', () => {
  it('Second-Story Work (Jumper): DEX skoruyla atlama; sürüm 15\'te STR', () => {
    const c = mk('A', { traits: ['second-story-work'], strScore: 8, dexScore: 18 });
    expect(jumpRangeFeet(c, true, arena(16, {}))).toBe(18);
    expect(jumpRangeFeet(c, true, arena(15, {}))).toBe(8);
  });
});

describe('Kuyruk 19: Paladin auraları', () => {
  const pal = mk('P', { ownerId: 'p1', traits: ['aura-of-devotion', 'aura-of-courage'] });
  it('Aura of Devotion: büyülenmiş dost auradayken büyüleyene saldırabilir (sürüm 16)', () => {
    const charmed = { effects: [{ id: 'charm-person', name: 'Charm Person', sourceId: 'B', charm: true }] as Combatant['effects'] };
    const on = arena(16, charmed, {}, undefined, [pal]);
    const old = arena(15, charmed, {}, undefined, [pal]);
    const reach = { melee: true, reachFt: 5 } as never;
    expect(checkReach(on, on.combatants.A as Combatant, on.combatants.B as Combatant, reach).ok).toBe(true);
    expect(checkReach(old, old.combatants.A as Combatant, old.combatants.B as Combatant, reach).ok).toBe(false);
  });
  it('Aura of Courage: korkmuş dost auradayken Frightened etkisiz (sürüm 16)', () => {
    const scared = { conditions: ['Frightened'] };
    const on = arena(16, scared, {}, undefined, [pal]);
    const old = arena(16, scared, {}, OFF, [pal]);
    expect(frightenedNow(on, on.combatants.A as Combatant)).toBe(false);
    expect(frightenedNow(old, old.combatants.A as Combatant)).toBe(true);
  });
});

describe('Kuyruk 19: Hunter\'s Lore', () => {
  it('Hunter\'s Mark işaretlenen yaratığın dirençlerini günlüğe yazar', () => {
    const a = { traits: ['hunters-lore'], spellNames: ["Hunter's Mark"], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellMod: 3, spellSaveDc: 13, spellAttack: 5 };
    const r = execute(arena(16, a, { resistances: ['fire'] }), { type: 'cast_spell', actorId: 'A', spellName: "Hunter's Mark", targetId: 'B' }, P1, () => 0.5);
    expect(r.ok && r.events.some((e: BattleEvent) => e.type === 'map_note' && e.text.includes('fire'))).toBe(true);
  });
});

describe('Kuyruk 19: Scholar', () => {
  it('Wizard uzmanlığı yalnızca SRD listesinden', async () => {
    const { blankCharacter, suggestedScores, characterProblems } = await import('../rules/builder');
    const c0 = blankCharacter('w');
    const mkc = (expertise: string[]) => ({ ...c0, sheet: { ...c0.sheet, classId: 'wizard', level: 2, baseScores: suggestedScores('wizard'), skillChoices: ['arcana', 'insight'], expertise } }) as unknown as typeof c0;
    expect(characterProblems(mkc(['insight'])).join(' | ')).toMatch(/yalnızca şu becerilerden/);
    expect(characterProblems(mkc(['arcana'])).join(' | ')).not.toMatch(/yalnızca şu becerilerden/);
  });
});
