/** Görev B93 (kural sürümü 93), aşama B: Cleric denetim düzeltmeleri (CLERIC-DENETIM.md). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { fullStatus, longRestStatus } from '../rules/characterRest';
import { applyBattleResult } from '../app/partyStatus';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const sheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('c').sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level, baseScores: suggestedScores('cleric'),
  armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }], spellNames: ['Cure Wounds', 'Healing Word', 'Mass Healing Word', 'Sacred Flame'], ...patch,
});
const cleric = (level: number, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(level, patch), { id: 'A', ownerId: 'p1' });
function arena(a: Combatant, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, rules?: number) {
  const parts = [a, mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, ...b }), mk('C', { ownerId: 'p1', hp: 4, maxHp: 30, ...c })];
  const s = startBattle('cl', 'd-z-zemin', parts, mid, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(2, 3) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, ...(rules ? { kuralSurumu: rules } : {}), status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = mid) => { const r = execute(s, cmd, s.combatants[(cmd as { actorId: string }).actorId]?.side === 'enemies' ? GM : P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, mid); return r.ok ? '' : r.error; };
const replays = (s0: BattleState, r: { state: BattleState; events: BattleEvent[] }) => expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
const TURN = 'cleric:channel-divinity/turn-undead';
const SPARK = 'cleric:channel-divinity/divine-spark';
const endTurn = (s: BattleState) => run(s, { type: 'end_turn', actorId: s.order[s.turnIndex] as string }).state;

describe('Turn Undead (SRD 5.2.1 s. 37)', () => {
  it('Turned Undead tur başında Cleric\'ten olabildiğince uzaklaşır (93); 92\'de yerinde kalır', () => {
    for (const rules of [93, 92]) {
      const s0 = arena(cleric(2), { creatureType: 'undead' }, {}, rules);
      let s = run(s0, { type: 'use_feature', actorId: 'A', feature: TURN }, () => 0.01).state;
      expect(s.combatants.B?.conditions).toContain('Incapacitated');
      s = endTurn(s);
      const d = Math.abs((s.combatants.B?.pos?.col ?? 0) - 3);
      if (rules === 93) expect(d).toBeGreaterThan(1); else expect(d).toBe(1);
    }
  });
  it('Cleric Incapacitated olunca ya da düşünce etki biter (93); 92\'de sürer; Sear Undead hasarı yine verilir', () => {
    for (const rules of [93, 92]) {
      const s0 = arena(cleric(5), { creatureType: 'undead' }, {}, rules);
      const r = run(s0, { type: 'use_feature', actorId: 'A', feature: TURN }, () => 0.01);
      expect((r.events.find((e) => e.type === 'save_resolved') as { appliedDamage: number }).appliedDamage).toBeGreaterThan(0);
      replays(s0, r);
      const down = execute(r.state, { type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true }, GM, mid);
      if (!down.ok) throw new Error(down.error);
      const has = down.state.combatants.B?.conditions.includes('Incapacitated');
      expect(has).toBe(rules === 92);
    }
  });
});

describe('Divine Spark', () => {
  it('kendine hedeflenemez (93); başka yaratığa iyileştirme ve hasar türü komutta seçilir', () => {
    const s = arena(cleric(2), {}, {}, 93);
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: SPARK, targetId: 'A', choice: 'heal' } as Command)).toContain('başka');
    const s92 = arena({ ...cleric(2), hp: 5 }, {}, {}, 92);
    expect(err(s92, { type: 'use_feature', actorId: 'A', feature: SPARK, targetId: 'A', choice: 'heal' } as Command)).toBe('');
    const nec = run(s, { type: 'use_feature', actorId: 'A', feature: SPARK, targetId: 'B', choice: 'necrotic' } as Command, () => 0.01);
    expect((nec.events.find((e) => e.type === 'save_resolved') as { damageType: string }).damageType).toBe('necrotic');
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: SPARK, targetId: 'B', choice: 'heal' } as Command)).toContain('tam sağlıklı');
  });
});

describe('Life Domain iyileştirme (bizim sürüm = motor uyumu)', () => {
  it('Blessed Healer yalnız gerçekten iyileşen başka hedefte (93); tam canlı hedefte 92\'de tetikleniyordu', () => {
    for (const rules of [93, 92]) {
      const a = { ...cleric(6), hp: 10 };
      const s = arena(a, {}, { hp: 30, maxHp: 30 }, rules);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C' });
      expect(r.events.some((e) => e.type === 'healed' && e.targetId === 'A')).toBe(rules === 92);
    }
  });
  it('Mass Heal: Disciple of Life her iyileşene +2 + slot; Blessed Healer büyücüye (93)', () => {
    const a = { ...cleric(17, { spellNames: ['Mass Heal', 'Sacred Flame'] }), hp: 50 };
    const s = arena(a, {}, { hp: 4, maxHp: 30 }, 93);
    const pool = run({ ...s, combatants: { ...s.combatants, C: { ...s.combatants.C!, maxHp: 1000, hp: 1 } } }, { type: 'cast_spell', actorId: 'A', spellName: 'Mass Heal' });
    const toC = pool.events.find((e) => e.type === 'healed' && e.targetId === 'C') as { amount: number } | undefined;
    const s92 = { ...s, kuralSurumu: 92 };
    const old = run({ ...s92, combatants: { ...s92.combatants, C: { ...s92.combatants.C!, maxHp: 1000, hp: 1 } } }, { type: 'cast_spell', actorId: 'A', spellName: 'Mass Heal' });
    const toC92 = old.events.find((e) => e.type === 'healed' && e.targetId === 'C') as { amount: number } | undefined;
    expect((toC?.amount ?? 0) - (toC92?.amount ?? 0)).toBe(11); // 2 + 9. seviye slot
    expect(pool.events.some((e) => e.type === 'healed' && e.targetId === 'A' && e.label.includes('Blessed Healer'))).toBe(true);
  });
  it('Power Word Heal: Blessed Healer (93)', () => {
    const a = { ...cleric(17, { spellNames: ['Power Word Heal', 'Sacred Flame'] }), hp: 50 };
    const r = run(arena(a, {}, { hp: 4, maxHp: 30 }, 93), { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Heal', targetId: 'C' });
    expect(r.events.some((e) => e.type === 'healed' && e.targetId === 'A' && e.label.includes('Blessed Healer'))).toBe(true);
  });
});

describe('Improved Blessed Strikes / Potent Spellcasting', () => {
  it('geçici HP yalnız cantrip hasar verince (93)', () => {
    const a = cleric(14, { featureChoices: { 'cleric:blessed-strikes': 'potent-spellcasting' } });
    const hi = { saves: { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 } };
    for (const rules of [93, 92]) {
      const r = run(arena(a, hi, {}, rules), { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }, () => 0.99);
      expect(r.events.some((e) => e.type === 'temp_hp')).toBe(rules === 92);
    }
  });
});

describe('Divine Intervention ve Greater Divine Intervention (s. 38)', () => {
  const di = (rules: number) => {
    const a = cleric(10);
    return arena({ ...a, spellSlots: a.spellSlots.map(() => 0) }, {}, {}, rules);
  };
  it('hazırlanmamış Cleric büyüsü slotsuz yapılır (93); 92\'de yalnız hazırlanan; tepki büyüsü yok', () => {
    const r = run(di(93), { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', free: true });
    expect(r.events.some((e) => e.type === 'feature_used' && e.feature === 'divineIntervention' && e.remaining === 0)).toBe(true);
    expect(err(di(92), { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', free: true })).not.toBe('');
    expect(err(di(93), { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B' })).toContain('bilmiyor');
  });
  it('Wish bu kaynakla yapılınca 2d4 uzun dinlenme bekleme; sayaç bitene dek uzun dinlenme doldurmaz', () => {
    const sh = sheet(20);
    const st = { ...fullStatus(sh), resources: { ...fullStatus(sh).resources, divineIntervention: 0 }, waits: { divineIntervention: 3 } };
    const r1 = longRestStatus(sh, st);
    expect(r1.resources.divineIntervention).toBe(0);
    expect(r1.waits?.divineIntervention).toBe(2);
    const r3 = longRestStatus(sh, longRestStatus(sh, r1));
    expect(r3.resources.divineIntervention).toBe(1);
    expect(r3.waits).toBeUndefined();
    // Savaşta başlayan sayaç karaktere yazılır.
    const ch = { ...blankCharacter('p1'), id: 'p1', sheet: sh, status: fullStatus(sh) };
    const s = arena(cleric(20), {}, {}, 93);
    const fin: BattleState = { ...s, status: 'finished', combatants: { ...s.combatants, A: { ...s.combatants.A!, resources: { ...s.combatants.A!.resources, divineIntervention: 0, 'divineIntervention:bekle': 5 } } } };
    expect(applyBattleResult([ch], fin)[0]?.status?.waits?.divineIntervention).toBe(5);
  });
});
