/**
 * Kuyruk 18 H3: kalan 6–10. seviye (ve kullanıcının adını verdiği üst seviye) sınıf özellikleri. Her mekanik: açık,
 * Game Master anahtarı kapalı, eski kural sürümü.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import { saveDice } from './effectDice';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

export const o = (col: number, row: number): Offset => ({ col, row });
export const low: Rng = () => 0.01;
export const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
/** Üç savaşçılı alan: A (parti), B (düşman), C (parti); `extra` ile ek savaşçı ve konum. */
export function field(parts: Combatant[], pos: Record<string, Offset>, opts: { surum?: number; toggles?: Record<string, boolean> } = {}): BattleState {
  const st = startBattle('k18h3', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  let s = { ...st, status: 'active', order: parts.map((p) => p.id), turnIndex: 0, combatants,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles, ...(opts.toggles ? { ruleToggles: opts.toggles } : {}) } } as BattleState;
  if (opts.surum !== undefined) s = { ...s, kuralSurumu: opts.surum };
  // Konum değişikliği sonrası türetilmiş alanlar (aura) için boş bir olay.
  return applyEvents(s, [{ type: 'map_note', text: '' }]);
}
export const run = (s: BattleState, cmd: Command, rng: Rng = low, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };

const paladin = () => mk('P', { ownerId: 'p1', hp: 50, maxHp: 50, level: 6, traits: ['aura-of-protection'], modifiers: { str: 3, dex: 0, con: 2, int: 0, wis: 0, cha: 3 } });
const ally = () => mk('A', { ownerId: 'p2', hp: 30, maxHp: 30 });
const foe = () => mk('B', { side: 'enemies', hp: 30, maxHp: 30 });

describe('K18 H3: Aura of Protection dostlara', () => {
  it('10 ft içindeki dostun her save\'ine Paladin\'in CHA\'sı (sabit eklenti); 15 ft\'te yok', async () => {
    const { auraSaveOf } = await import('./auras');
    const s = field([paladin(), ally(), foe()], { P: o(2, 3), A: o(4, 3), B: o(8, 3) });
    expect(C(s, 'A').auraSave).toBe(3);
    expect(saveDice(C(s, 'A'), 'wis')).toContainEqual(expect.objectContaining({ label: 'Aura of Protection', die: '3', sign: 1 }));
    expect(C(s, 'B').auraSave).toBeUndefined();
    const far = { ...s, combatants: { ...s.combatants, A: { ...C(s, 'A'), pos: o(5, 3) } } };
    expect(auraSaveOf(far, C(far, 'A'))).toBe(0);
  });
  it('Paladin Incapacitated iken aura yok; anahtar kapalı ya da kural sürümü 13 iken yok', () => {
    const stunned = field([{ ...paladin(), conditions: ['Stunned'] }, ally(), foe()], { P: o(2, 3), A: o(3, 3), B: o(8, 3) });
    expect(C(stunned, 'A').auraSave).toBeUndefined();
    const off = field([paladin(), ally(), foe()], { P: o(2, 3), A: o(3, 3), B: o(8, 3) }, { toggles: { auraOfProtection: false } });
    expect(C(off, 'A').auraSave).toBeUndefined();
    const old = field([paladin(), ally(), foe()], { P: o(2, 3), A: o(3, 3), B: o(8, 3) }, { surum: 13 });
    expect(C(old, 'A').auraSave).toBeUndefined();
  });
  it('dost yürüyünce aura gelir/gider; replay aynı', () => {
    const s0 = field([ally(), paladin(), foe()], { P: o(2, 3), A: o(6, 3), B: o(12, 3) });
    expect(C(s0, 'A').auraSave).toBeUndefined();
    const r = run(s0, { type: 'move', actorId: 'A', to: o(3, 3) } as Command, low, { playerId: 'p2', isGm: false });
    expect(C(r.state, 'A').auraSave).toBe(3);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
});

describe('K18 H3: Barbarian (Instinctive Pounce, Mindless Rage, Brutal Strike)', () => {
  const rage = { rageDamage: 2, rageResist: ['bludgeoning', 'piercing', 'slashing'], resources: { rage: 3 }, maxResources: { rage: 3 } };
  const barb = (traits: string[], extra: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, level: 9, speed: 30, traits, canReckless: true, ...rage, ...extra } as Partial<Combatant>);
  const ogre = () => mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5 });
  it('Instinctive Pounce: Rage\'e girince bu tur yarım hız (3 altıgen) ek hareket; anahtar kapalıyken yok', () => {
    const s = field([barb(['instinctive-pounce']), ogre()], { A: o(2, 3), B: o(12, 3) });
    const r = run(s, { type: 'rage', actorId: 'A' } as Command);
    expect(C(r.state, 'A').movementUsed).toBe(-3);
    const off = field([barb(['instinctive-pounce']), ogre()], { A: o(2, 3), B: o(12, 3) }, { toggles: { instinctivePounce: false } });
    expect(C(run(off, { type: 'rage', actorId: 'A' } as Command).state, 'A').movementUsed).toBe(0);
    const old = field([barb(['instinctive-pounce']), ogre()], { A: o(2, 3), B: o(12, 3) }, { surum: 13 });
    expect(C(run(old, { type: 'rage', actorId: 'A' } as Command).state, 'A').movementUsed).toBe(0);
  });
  it('Mindless Rage: girişte Charmed ve Frightened biter; sürüm 13\'te bitmez', () => {
    const s = field([barb(['mindless-rage'], { conditions: ['Charmed', 'Frightened'] }), ogre()], { A: o(2, 3), B: o(12, 3) });
    expect(C(run(s, { type: 'rage', actorId: 'A' } as Command).state, 'A').conditions).toEqual([]);
    const old = field([barb(['mindless-rage'], { conditions: ['Frightened'] }), ogre()], { A: o(2, 3), B: o(12, 3) }, { surum: 13 });
    expect(C(run(old, { type: 'rage', actorId: 'A' } as Command).state, 'A').conditions).toContain('Frightened');
  });
  it('Brutal Strike: Reckless turunda avantaj yok, isabette +1d10 ve Hamstring −15 ft; anahtar kapalıyken avantajlı normal saldırı', () => {
    const axe = { label: 'Greataxe', attackBonus: 7, damage: '1d12+4', damageType: 'slashing', ranged: false, spell: false, tag: 'greataxe slashing', ability: 'str' as const };
    const s0 = field([barb(['brutal-strike']), ogre()], { A: o(2, 3), B: o(3, 3) });
    const s = run(s0, { type: 'reckless', actorId: 'A' } as Command).state;
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: axe, brutal: 'hamstring' } as unknown as Command, () => 0.6);
    const atk = r.events.find((e) => e.type === 'attack_resolved');
    expect(atk).toMatchObject({ mode: 'normal', brutal: 'hamstring', hit: true });
    expect((atk as { extra?: { label: string }[] }).extra?.some((x) => x.label === 'Brutal Strike')).toBe(true);
    expect(C(r.state, 'B').effects?.some((e) => e.speedFt === -15)).toBe(true);
    expect(replay([{ type: 'battle_started', state: s0 }, ...run(s0, { type: 'reckless', actorId: 'A' } as Command).events, ...r.events] as BattleEvent[])).toEqual(r.state);
    const off0 = field([barb(['brutal-strike']), ogre()], { A: o(2, 3), B: o(3, 3) }, { toggles: { brutalStrike: false } });
    const off = run(off0, { type: 'reckless', actorId: 'A' } as Command).state;
    const r2 = run(off, { type: 'attack', actorId: 'A', targetId: 'B', option: axe, brutal: 'hamstring' } as unknown as Command, () => 0.6);
    expect(r2.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'advantage' });
  });
});

describe('K18 H3: Abjure Foes (Paladin 9)', () => {
  async function pal(level = 9): Promise<Combatant> {
    const { newCharacter, suggestedScores } = await import('../rules/builder');
    const { combatantFromSheet } = await import('./create');
    const sheet = { ...newCharacter('k18-pal').sheet, classId: 'paladin', level, baseScores: suggestedScores('paladin') };
    return { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' } as Combatant;
  }
  it('Channel Divinity harcar; başarısız düşman 1 dk Frightened (hasarla biter); anahtar kapalı ve sürüm 13\'te yok', async () => {
    const p = await pal();
    expect(p.features?.some((f) => f.key === 'paladin:abjure-foes')).toBe(true);
    const foes = [mk('B', { side: 'enemies', hp: 40, maxHp: 40 }), mk('D', { side: 'enemies', hp: 20, maxHp: 20 })];
    const pos = { P: o(2, 3), B: o(6, 3), D: o(7, 4) };
    const s = field([p, ...foes], pos);
    const r = run(s, { type: 'use_feature', actorId: 'P', feature: 'paladin:abjure-foes' } as Command);
    expect(r.events.filter((e) => e.type === 'save_resolved').length).toBeGreaterThanOrEqual(1);
    expect(C(r.state, 'B').conditions).toContain('Frightened');
    expect((C(r.state, 'P').resources.channelDivinity ?? 0)).toBe((C(s, 'P').resources.channelDivinity ?? 0) - 1);
    const off = field([p, ...foes], pos, { toggles: { abjureFoes: false } });
    expect(execute(off, { type: 'use_feature', actorId: 'P', feature: 'paladin:abjure-foes' } as Command, P1, low).ok).toBe(false);
    const old = field([p, ...foes], pos, { surum: 13 });
    expect(execute(old, { type: 'use_feature', actorId: 'P', feature: 'paladin:abjure-foes' } as Command, P1, low).ok).toBe(false);
  });
});

describe('K18 H3: Countercharm (Bard 7)', () => {
  const caster = () => mk('E', { side: 'enemies', hp: 30, maxHp: 30, spellSaveDc: 15, spellAttack: 7, spellMod: 3, spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellNames: ['Charm Person'] });
  const target = () => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, creatureType: 'humanoid' });
  const bard = () => mk('D', { ownerId: 'p2', hp: 30, maxHp: 30, traits: ['countercharm'] });
  const pos = { E: o(8, 3), A: o(3, 3), D: o(2, 3) };
  const charm = { type: 'cast_spell', actorId: 'E', spellName: 'Charm Person', targetId: 'A' } as Command;
  const dice = () => scripted([20, 2], [20, 3], [20, 20], [20, 19]);
  it('başarısız Charmed save\'i Bard\'ın tepkisiyle avantajlı yeniden atılır; tepki harcanır', () => {
    const s = field([caster(), target(), bard()], pos);
    expect(C(s, 'A').countercharmBy).toBe('D');
    const r = execute(s, charm, GM, dice());
    if (!r.ok) throw new Error(r.error);
    expect(r.events.find((e) => e.type === 'save_resolved')).toMatchObject({ success: true });
    expect(C(r.state, 'A').conditions).not.toContain('Charmed');
    expect(C(r.state, 'D').economy.reaction).toBe(true);
    expect(C(r.state, 'A').countercharmBy).toBeUndefined();
  });
  it('anahtar kapalı ya da sürüm 13: yeniden atış yok, Charmed olur', () => {
    for (const opts of [{ toggles: { countercharm: false } }, { surum: 13 }]) {
      const s = field([caster(), target(), bard()], pos, opts);
      const r = execute(s, charm, GM, dice());
      if (!r.ok) throw new Error(r.error);
      expect(C(r.state, 'A').conditions).toContain('Charmed');
    }
  });
});

describe('K18 H3: Magical Discoveries (Lore 6)', () => {
  it('Lore 6: Cleric/Druid/Wizard listesinden en çok 2 büyü, hazırlanan sayısına girmez; Lore 5 ve başka Bard alt sınıfında yok', async () => {
    const { spellOptions, discoveryCap, spellCounts, characterIssues, newCharacter } = await import('../rules/builder');
    expect(spellOptions('bard', 6, 'college-of-lore')).toContain('Fireball');
    expect(spellOptions('bard', 6)).not.toContain('Fireball');
    expect(spellOptions('bard', 5, 'college-of-lore')).not.toContain('Fireball');
    expect(discoveryCap('bard', 6, 'college-of-lore')).toBe(2);
    expect(discoveryCap('bard', 10, 'college-of-lore')).toBeNull();
    const base = { ...newCharacter('lore').sheet, classId: 'bard', level: 6, subclassId: 'college-of-lore', spellNames: ['Fireball', 'Shield', 'Cure Wounds'] };
    expect(spellCounts(base).prepared).toBe(1);
    const three = { ...base, spellNames: [...base.spellNames, 'Haste'] };
    expect(characterIssues({ ...newCharacter('lore'), sheet: three }).some((i) => /Başka listelerden en çok 2/.test(typeof i === 'string' ? i : JSON.stringify(i)))).toBe(true);
  });
});

describe('K18 H3: Fighter, Monk, Rogue, Druid, Ranger, Wizard eklemeleri', () => {
  const MODES: Array<[string, { surum?: number; toggles?: Record<string, boolean> }, boolean]> = [['açık', {}, true], ['sürüm 13', { surum: 13 }, false]];
  const sword = { label: 'Longsword', attackBonus: 30, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword', ability: 'str' as const, mastery: 'sap' as const };
  it.each(MODES)('Tactical Master (%s): ustalık Push ile değişir; anahtar kapalıyken silahınki', (_, opts, yes) => {
    const s = field([mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits: ['tactical-master'] }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5 })], { A: o(2, 3), B: o(3, 3) }, opts);
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword, mastery: 'push' } as unknown as Command, () => 0.6);
    const m = r.events.find((e) => e.type === 'mastery_applied') as { mastery: string } | undefined;
    expect(m?.mastery).toBe(yes ? 'push' : 'sap');
    const off = field([mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits: ['tactical-master'] }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5 })], { A: o(2, 3), B: o(3, 3) }, { toggles: { tacticalMaster: false } });
    expect((run(off, { type: 'attack', actorId: 'A', targetId: 'B', option: sword, mastery: 'push' } as unknown as Command, () => 0.6).events.find((e) => e.type === 'mastery_applied') as { mastery: string }).mastery).toBe('sap');
  });
  it.each(MODES)('Heroic Warrior (%s): tur başında Heroic Inspiration; başarısız saldırı d20\'si yeniden atılır', (_, opts, yes) => {
    const s0 = field([mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 15 }), mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits: ['heroic-warrior'] })], { A: o(2, 3), B: o(3, 3) }, opts);
    const s = run(s0, { type: 'end_turn', actorId: 'B' } as Command, low, GM).state;
    expect((C(s, 'A').resources.heroicInspiration ?? 0) > 0).toBe(yes);
    if (!yes) return;
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: { ...sword, attackBonus: 5, mastery: undefined } } as unknown as Command, scripted([20, 2], [20, 19], [8, 5]));
    const ev = r.events.find((e) => e.type === 'attack_resolved') as { hit: boolean; d20: number[]; total: number; bonusDice?: unknown };
    expect(ev, JSON.stringify(ev)).toMatchObject({ hit: true });
    expect(C(r.state, 'A').resources.heroicInspiration).toBe(0);
  });
  it('Wholeness of Body: bonus eylemle Martial Arts zarı + WIS iyileşme; anahtar kapalıyken reddedilir', async () => {
    const { newCharacter, suggestedScores } = await import('../rules/builder');
    const { combatantFromSheet } = await import('./create');
    const sheet = { ...newCharacter('monk').sheet, classId: 'monk', level: 6, subclassId: 'warrior-of-the-open-hand', baseScores: suggestedScores('monk') };
    const m = { ...combatantFromSheet(sheet, { id: 'M', ownerId: 'p1' }), side: 'party' } as Combatant;
    const hurt = { ...m, hp: 5 };
    const s = field([hurt, mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { M: o(2, 3), B: o(8, 3) });
    const key = m.features?.find((f) => f.key.includes('wholeness'))?.key as string;
    expect(key).toBeTruthy();
    const r = run(s, { type: 'use_feature', actorId: 'M', feature: key } as Command, () => 0.9);
    expect(C(r.state, 'M').hp).toBeGreaterThan(5);
    const off = field([hurt, mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { M: o(2, 3), B: o(8, 3) }, { toggles: { wholenessOfBody: false } });
    expect(execute(off, { type: 'use_feature', actorId: 'M', feature: key } as Command, P1, low).ok).toBe(false);
  });
  it('Heightened Focus: Focus\'lu Patient Defense geçici HP verir; sürüm 13\'te vermez', () => {
    const monk = (o2: Partial<Combatant>) => mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits: ['heightened-focus'], resources: { focus: 5 }, maxResources: { focus: 5 },
      focusActions: [{ id: 'patient-defense', name: 'Patient Defense', resource: 'focus', actions: ['disengage', 'dodge'] }], metabolism: { refill: 'focus', die: '1d8', resource: 'uncannyMetabolism', max: 5 }, ...o2 } as Partial<Combatant>);
    const s = field([monk({}), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { A: o(2, 3), B: o(8, 3) });
    expect((C(run(s, { type: 'focus_action', actorId: 'A', action: 'patient-defense' } as Command, () => 0.9).state, 'A').tempHp ?? 0) > 0).toBe(true);
    const old = field([monk({}), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { A: o(2, 3), B: o(8, 3) }, { surum: 13 });
    expect(C(run(old, { type: 'focus_action', actorId: 'A', action: 'patient-defense' } as Command, () => 0.9).state, 'A').tempHp ?? 0).toBe(0);
  });
  it('Nature\'s Ward: Poisoned olmaz; anahtar kapalıyken olur', () => {
    const d = (traits: string[]) => mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits });
    for (const [opts, want] of [[{}, false], [{ toggles: { naturesWard: false } }, true], [{ surum: 13 }, true]] as const) {
      const s = field([d(['natures-ward']), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { A: o(2, 3), B: o(8, 3) }, opts);
      const r = run(s, { type: 'set_condition', targetId: 'A', condition: 'Poisoned', present: true } as unknown as Command, low, GM);
      expect(C(r.state, 'A').conditions.includes('Poisoned')).toBe(want);
    }
  });
  it('Supreme Sneak: gizli Thief Stealth Attack\'la ¾ siperde gizli kalır; anahtar kapalıyken ortaya çıkar', async () => {
    const { revealEvent } = await import('./stealth');
    const thief = mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, traits: ['supreme-sneak'], hidden: { dc: 20 } } as Partial<Combatant>);
    const s = field([thief, mk('B', { side: 'enemies', hp: 60, maxHp: 60 })], { A: o(2, 3), B: o(8, 3) });
    const wall = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: s.map!.tiles.map((r, i) => (i === 3 ? '...#' + r.slice(4) : r)) } };
    const cmd = { type: 'attack', actorId: 'A', targetId: 'B', option: sword, cunning: ['stealth'] } as unknown as Command;
    const kept = revealEvent(wall, wall, cmd);
    const off = { ...wall, map: { ...(wall.map as NonNullable<BattleState['map']>), ruleToggles: { supremeSneak: false } } };
    expect(revealEvent(off, off, cmd)).not.toBeNull();
    expect(kept === null || revealEvent(wall, wall, { ...cmd, cunning: [] } as Command) !== null).toBe(true);
  });
  it('Tireless: kısa dinlenme Exhaustion\'ı 1 azaltır (Ranger 10); Ranger 9\'da azaltmaz', async () => {
    const { shortRestStatus, fullStatus } = await import('../rules/characterRest');
    const { newCharacter, suggestedScores } = await import('../rules/builder');
    for (const [lv, want] of [[10, 1], [9, 2]] as const) {
      const sheet = { ...newCharacter('r').sheet, classId: 'ranger', level: lv, subclassId: 'hunter', baseScores: suggestedScores('ranger') };
      const st = { ...fullStatus(sheet), exhaustion: 2 };
      expect(shortRestStatus(sheet, st, 0, () => 0.5).status.exhaustion).toBe(want);
    }
  });
  it('Spell Mastery / Signature Spells: üst seviye Wizard\'ın ilk 1./2. ve iki 3. seviye büyüsü slotsuz', async () => {
    const { newCharacter, suggestedScores } = await import('../rules/builder');
    const { combatantFromSheet } = await import('./create');
    const sheet = { ...newCharacter('w').sheet, classId: 'wizard', level: 20, subclassId: 'evoker', baseScores: suggestedScores('wizard'),
      spellNames: ['Magic Missile', 'Shield', 'Misty Step', 'Fireball', 'Lightning Bolt', 'Counterspell'], spellbook: ['Magic Missile', 'Shield', 'Misty Step', 'Fireball', 'Lightning Bolt', 'Counterspell'] };
    const w = combatantFromSheet(sheet, { id: 'W', ownerId: 'p1' });
    expect(w.freeSpells?.['Magic Missile']).toBe('spellMastery');
    expect(w.freeSpells?.['Misty Step']).toBe('spellMastery');
    expect(w.freeSpells?.['Shield']).toBeUndefined();
    expect(w.freeSpells?.['Fireball']).toBe('signatureSpells');
    expect(w.freeSpells?.['Lightning Bolt']).toBe('signatureSpells');
  });
});
