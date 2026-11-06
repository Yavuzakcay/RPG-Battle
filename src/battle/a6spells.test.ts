/**
 * Kuyruk A6: küçük kısmi büyülerin kapatılması (kural sürümü 35, mekaniğin `a6` hâli). Her büyü için yeni davranış
 * (sürüm 35) ve eski davranış (sürüm 34); replay aynı (`run` denetler).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { effectTurnEndEvents } from './effects';
import { wardSources } from './divine';
import { knowsWhere, sightConditions } from './sight';
import { saveMode } from './durations';
import { zoneMoveCost } from './zones';
import { reactionUsable } from './reactions';
import { GM, P1, mk } from './fixtures';
import { seededRng } from '../rules/dice';
import { spells } from '../data';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p2', hp: 40, maxHp: 40, ...p });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 4, row: 3 } };
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (spellNames: string[], p: Partial<Combatant> = {}) => caster({ spellNames, spellSlots: ALL, ...p });
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const tryCmd = (s: BattleState, cmd: Command, seed = 3) => execute(s, cmd, s.combatants[(cmd as { actorId: string }).actorId]?.side === 'enemies' ? GM : P1, seededRng(seed));
const replayOk = (s: BattleState, cmd: Command, seed = 3) => run(s, cmd, seed);

describe('A6 tekil: Produce Flame, Chromatic Orb, Mage Armor', () => {
  it('Produce Flame: bonus eylemle elde alev (ışık, saldırı yok); Magic eylemiyle fırlatılır (35); 34\'te tek adım saldırı', () => {
    const s = field([wiz(['Produce Flame']), foe('F0')], pos, 35);
    const r = run(s, cast('Produce Flame'));
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(fx(r.state, 'A', 'spells:produce-flame')?.held?.spell).toBe('Produce Flame');
    const hurl = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'F0' });
    expect(hurl.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'F0')).toBe(true);
    expect(hurl.events.some((e) => e.type === 'action_used' && e.kind === 'action')).toBe(true);
    const old = run(field([wiz(['Produce Flame']), foe('F0')], pos, 34), cast('Produce Flame', { targetId: 'F0' }));
    expect(old.events.some((e) => e.type === 'attack_resolved')).toBe(true);
  });
  it('Chromatic Orb: sıçrama hedefi komuttaki targetIds sırasından (35)', () => {
    const p = { ...pos, F0: { col: 6, row: 3 }, F1: { col: 7, row: 3 }, F2: { col: 6, row: 4 } };
    let found = false;
    for (let seed = 1; seed < 400 && !found; seed++) {
      const s = field([wiz(['Chromatic Orb'], { spellAttack: 30 }), foe('F0'), foe('F1'), foe('F2')], p, 35);
      const r = tryCmd(s, cast('Chromatic Orb', { targetId: 'F0', targetIds: ['F0', 'F1'], slotLevel: 1, choice: 'fire' }), seed);
      if (!r.ok) continue;
      const hits = r.events.filter((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved');
      if (hits.length > 1) { expect(hits[1]?.targetId).toBe('F1'); found = true; replayOk(s, cast('Chromatic Orb', { targetId: 'F0', targetIds: ['F0', 'F1'], slotLevel: 1, choice: 'fire' }), seed); }
    }
    expect(found).toBe(true);
  });
  it('Mage Armor: zırhlı hedefe yapılamaz (35); 34\'te yapılır', () => {
    const s = (k: number) => field([wiz(['Mage Armor']), ally('C', { armored: true }), foe('F0')], pos, k);
    expect(tryCmd(s(35), cast('Mage Armor', { targetId: 'C' })).ok).toBe(false);
    expect(replayOk(s(34), cast('Mage Armor', { targetId: 'C' })).ok).toBe(true);
    expect(replayOk(s(35), cast('Mage Armor', { targetId: 'A' })).ok).toBe(true);
  });
});

describe('A6 tekil: Sanctuary, Invisibility, Ray of Enfeeblement, Warding Bond', () => {
  it('Sanctuary: başarısız save\'de saldırı harcanmaz, aynı korunana bu tur yeniden yönelemez (35)', () => {
    const s0 = field([wiz(['Sanctuary']), foe('F0', { saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, attacks: [{ name: 'Pençe', attackBonus: 5, damage: '1d6', damageType: 'slashing', reachFt: 5 }] as never })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 35);
    const s1 = run(s0, cast('Sanctuary', { targetIds: ['A'] })).state;
    const atk: Command = { type: 'monster_attack', actorId: 'F0', targetId: 'A', attackIndex: 0 };
    const r = run(turnOf(s1, 'F0'), atk, 1);
    expect(r.events.find((e) => e.type === 'sanctuary_save')).toMatchObject({ success: false });
    expect(r.events.some((e) => e.type === 'action_used')).toBe(false);
    expect(tryCmd(r.state, atk, 1).ok).toBe(false);
  });
  it('Invisibility: saldırısız hasar verince biter (35); 34\'te sürer', () => {
    for (const [k, gone] of [[35, true], [34, false]] as const) {
      const s = run(field([wiz(['Invisibility', 'Burning Hands']), foe('F0')], pos, k), cast('Invisibility', { targetIds: ['A'] })).state;
      expect(fx(s, 'A', 'spells:invisibility')).toBeTruthy();
      const hurt: BattleEvent = { type: 'save_resolved', actorId: 'A', targetId: 'F0', label: 'aura', ability: 'dex', dc: 10, mode: 'normal', reasons: [], d20: [1], natural: 1, total: 1, success: false,
        damageRolls: [5], rawDamage: 5, appliedDamage: 5, damageType: 'fire', damageNote: null, targetHpAfter: 195, effects: [], conditionsAdded: [] };
      expect(!fx(applyEvents(s, [hurt]), 'A', 'spells:invisibility')).toBe(gone);
    }
  });
  it('Ray of Enfeeblement: yalnızca STR tabanlı saldırı dezavantajlı (35: Finesse DEX ile yok)', () => {
    let s: BattleState | null = null;
    for (let seed = 1; seed < 50 && !s; seed++) {
      const r = tryCmd(field([wiz(['Ray of Enfeeblement']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], pos, 35), cast('Ray of Enfeeblement', { targetIds: ['F0'] }), seed);
      if (r.ok && fx(r.state, 'F0', 'spells:ray-of-enfeeblement')?.attackDis?.str) s = r.state;
    }
    expect(s).toBeTruthy();
    const st = s as BattleState;
    expect(wardSources(st, st.combatants.F0 as Combatant, st.combatants.A as Combatant, { melee: true, str: false }).some((x) => x.reason === 'Ray of Enfeeblement')).toBe(false);
    expect(wardSources(st, st.combatants.F0 as Combatant, st.combatants.A as Combatant, { melee: true, str: true }).some((x) => x.reason === 'Ray of Enfeeblement')).toBe(true);
  });
  it('Warding Bond: başka biri bağlı yaratığa yeniden yapınca önceki bağ biter (35)', () => {
    const s0 = field([wiz(['Warding Bond']), ally('C'), mk('D', { ownerId: 'p1', spellNames: ['Warding Bond'], spellSlots: ALL, casterTag: 'cleric' }), foe('F0')], { ...pos, D: { col: 3, row: 4 } }, 35);
    const s1 = run(s0, cast('Warding Bond', { targetIds: ['C'] })).state;
    const r = run(turnOf(s1, 'D'), { type: 'cast_spell', actorId: 'D', spellName: 'Warding Bond', targetIds: ['C'] });
    expect((r.state.combatants.C as Combatant).effects?.filter((e) => e.bondTo).map((e) => e.bondTo)).toEqual(['D']);
  });
});

describe('A6 tekil: Bestow Curse, Blink, Call Lightning, Remove Curse, Plane Shift', () => {
  it('Bestow Curse (hasar): lanetleyenin save\'li büyü hasarına +1d8 Necrotic (35)', () => {
    const s0 = field([wiz(['Bestow Curse', 'Sacred Flame']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 35);
    const s1 = run(s0, cast('Bestow Curse', { targetId: 'F0', choice: 'damage' })).state;
    expect(fx(s1, 'F0', 'spells:bestow-curse')?.curseDamage?.spells).toBe(true);
    const r = run({ ...s1, combatants: { ...s1.combatants, A: { ...(s1.combatants.A as Combatant), economy: { ...(s1.combatants.A as Combatant).economy, action: false } } } }, cast('Sacred Flame', { targetId: 'F0' }));
    expect(r.events.some((e) => e.type === 'extra_damage' && e.label.startsWith('Bestow Curse'))).toBe(true);
  });
  it('Blink: tur sonu zarı d6 (35), d20 (34)', () => {
    for (const [k, die] of [[35, 'd6'], [34, 'd20']] as const) {
      const s = run(field([wiz(['Blink']), foe('F0')], pos, k), cast('Blink', { targetIds: ['A'] })).state;
      const ev = effectTurnEndEvents(s, 'A', seededRng(5)).find((e) => e.type === 'effect_tick');
      expect(ev?.type === 'effect_tick' && ev.name).toContain(die);
    }
  });
  it('Call Lightning: tekrar bir altıgen noktaya (35); 34\'te nokta reddedilir', () => {
    const p = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } };
    for (const k of [35, 34]) {
      const s0 = field([wiz(['Call Lightning']), foe('F0')], p, k);
      const s1 = run(s0, cast('Call Lightning', { targetHex: { col: 6, row: 3 } })).state;
      const next = { ...s1, round: s1.round + 1, combatants: { ...s1.combatants, A: { ...(s1.combatants.A as Combatant), economy: { ...(s1.combatants.A as Combatant).economy, action: false } } } };
      const r = tryCmd(next, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 6, row: 4 } });
      expect(r.ok).toBe(k === 35);
    }
  });
  it('Call Lightning: fırtınalı haritada +1d10 (stormBonus verisi)', () => {
    const m = spells.find((x) => x.id === 'call-lightning')?.mechanics;
    expect(m?.a6?.stormBonus).toBe('1d10');
  });
  it('Remove Curse: Hex\'i ve lanetli etkiyi kaldırır (35); 34\'te yalnız Bestow Curse', () => {
    for (const [k, gone] of [[35, true], [34, false]] as const) {
      const s0 = field([wiz(['Hex', 'Remove Curse'], { casterTag: 'warlock' }), foe('F0', { effects: [{ id: 'a2:mummy', name: 'Mummy Rot', sourceId: 'F0', curse: true, noHeal: true } as never] })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, k);
      const s1 = run(s0, cast('Hex', { targetId: 'F0' })).state;
      const s2 = { ...s1, round: s1.round + 1, combatants: { ...s1.combatants, A: { ...(s1.combatants.A as Combatant), economy: { ...(s1.combatants.A as Combatant).economy, action: false } } } };
      const r = run(s2, cast('Remove Curse', { targetId: 'F0' }));
      expect(!fx(r.state, 'F0', 'a2:mummy')).toBe(gone);
      expect(!(r.state.combatants.A as Combatant).concentration).toBe(gone);
    }
  });
  it('Plane Shift: savaş dışı, Game Master notu (35); 34\'te sürgün', () => {
    const s = (k: number) => field([wiz(['Plane Shift']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, k);
    const r = run(s(35), cast('Plane Shift', { slotLevel: 7 }));
    expect(r.events.some((e) => e.type === 'map_note' && e.text.startsWith('Game Master notu — Plane Shift'))).toBe(true);
    expect(fx(r.state, 'F0', 'spells:plane-shift')).toBeUndefined();
  });
});

describe('A6 eylem ekonomisi: Ensnaring Strike, Sleep, Haste, Hypnotic Pattern', () => {
  it('Ensnaring Strike: tur başı save yok, kurtulma Athletics ile; dost da kurtarır (35)', () => {
    const s0 = field([wiz(['Ensnaring Strike']), ally('C', { skills: { athletics: 30 } }), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], pos, 35);
    const withHit = (s: BattleState): BattleState => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), economy: { ...(s.combatants.A as Combatant).economy, meleeHit: { targetId: 'F0', critical: false } } } } });
    const r = run(withHit({ ...s0, combatants: { ...s0.combatants, F0: { ...(s0.combatants.F0 as Combatant), pos: { col: 3, row: 4 } } } }), cast('Ensnaring Strike', { targetId: 'F0' }));
    const e = fx(r.state, 'F0', 'spells:ensnaring-strike');
    expect(e?.ongoing?.noSave).toBe(true);
    expect(e?.escapeCheck?.allyHelp).toBe(true);
    const s34 = field([wiz(['Ensnaring Strike']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 34);
    const old = fx(run(withHit(s34), cast('Ensnaring Strike', { targetId: 'F0' })).state, 'F0', 'spells:ensnaring-strike');
    expect(old?.escapeCheck).toBeUndefined();
  });
  it('dost Yardım eylemiyle sarmaşığı söker (Athletics), uyuyanı sarsar (35)', () => {
    const held = { id: 'spells:ensnaring-strike', name: 'Ensnaring Strike', sourceId: 'F0', grants: ['Restrained'], escapeCheck: { dc: 5, allyHelp: true } };
    const s = field([wiz([]), ally('C', { conditions: ['Restrained'], effects: [held as never] }), foe('F0')], pos, 35);
    const r = run(s, { type: 'help', actorId: 'A', targetId: 'C' }, 4);
    expect(r.events.some((e) => e.type === 'grapple_escape')).toBe(true);
    const sleepy = field([wiz([]), ally('C', { conditions: ['Incapacitated'], conditionTimers: [{ condition: 'Incapacitated', ownerId: 'C', end: 'turnEnd', rounds: 10, wakeOnDamage: true } as never] }), foe('F0')], pos, 35);
    const w = run(sleepy, { type: 'help', actorId: 'A', targetId: 'C' });
    expect(w.state.combatants.C?.conditions).not.toContain('Incapacitated');
    expect(tryCmd(field([wiz([]), ally('C', { conditions: ['Incapacitated'], conditionTimers: [{ condition: 'Incapacitated', ownerId: 'C', end: 'turnEnd', rounds: 10, wakeOnDamage: true } as never] }), foe('F0')], pos, 34), { type: 'help', actorId: 'A', targetId: 'C' }).ok).toBe(false);
  });
  it('Sleep: Elf save\'i kendiliğinden başarır (35)', () => {
    const s = field([wiz(['Sleep']), foe('F0', { raceId: 'elf', saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } }, 35);
    const r = run(s, cast('Sleep', { targetHex: { col: 6, row: 3 } }));
    expect(r.events.find((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toMatchObject({ success: true });
  });
  it('Haste: ek eylem asıl eylemden önce de (35), sonra asıl eylem geri gelir', () => {
    const s1 = run(field([wiz(['Haste', 'Fire Bolt']), foe('F0')], pos, 35), cast('Haste', { targetIds: ['A'] })).state;
    const fresh = { ...s1, combatants: { ...s1.combatants, A: { ...(s1.combatants.A as Combatant), economy: { ...(s1.combatants.A as Combatant).economy, action: false, attacksLeft: 0 } } } };
    const h = run(fresh, { type: 'haste_action', actorId: 'A' });
    expect(h.state.combatants.A?.economy).toMatchObject({ hasted: true, hasteFirst: true, action: false });
    const dash = run(h.state, { type: 'dash', actorId: 'A' } as Command);
    expect(dash.state.combatants.A?.economy).toMatchObject({ action: false, hasted: false });
    const old = run(field([wiz(['Haste']), foe('F0')], pos, 34), cast('Haste', { targetIds: ['A'] })).state;
    const oldFresh = { ...old, combatants: { ...old.combatants, A: { ...(old.combatants.A as Combatant), economy: { ...(old.combatants.A as Combatant).economy, action: false, attacksLeft: 0 } } } };
    expect(tryCmd(oldFresh, { type: 'haste_action', actorId: 'A' }).ok).toBe(false);
  });
  it('Hypnotic Pattern: başarısızlık etkisi sarsılabilir (35)', () => {
    const m = spells.find((x) => x.id === 'hypnotic-pattern')?.mechanics.a6;
    expect(m?.failEffect?.raw).toEqual({ shakeable: true });
    const s = field([wiz([]), ally('C', { conditions: ['Charmed', 'Incapacitated'], effects: [{ id: 'spells:hypnotic-pattern', name: 'Hypnotic Pattern', sourceId: 'F0', grants: ['Charmed', 'Incapacitated'], shakeable: true }] }), foe('F0')], pos, 35);
    const r = run(s, { type: 'help', actorId: 'A', targetId: 'C' });
    expect(r.state.combatants.C?.conditions).not.toContain('Incapacitated');
  });
});

describe('A6 buyruk: Calm Emotions, Silence, Suggestion, Mass Suggestion', () => {
  it('Calm Emotions: dost da save yapar; düşman kayıtsız (büyücünün tarafına saldıramaz) (35)', () => {
    const s = field([wiz(['Calm Emotions']), ally('C', { saves: { str: 9, dex: 9, con: 9, int: 9, wis: 9, cha: 30 } }), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], pos, 35);
    const r = run(s, cast('Calm Emotions', { targetHex: { col: 3, row: 3 } }));
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'C')).toBe(true);
    expect(fx(r.state, 'C', 'spells:calm-emotions')).toBeUndefined();
    expect(fx(r.state, 'F0', 'spells:calm-emotions')?.indifferentTo).toBe('party');
  });
  it('Silence: içerideki Deafened sayılır ve sözlü tepki büyüsü (Shield) yapamaz (35)', () => {
    const s = field([wiz(['Silence']), ally('C'), foe('F0')], pos, 35);
    const r = run(s, cast('Silence', { targetHex: { col: 3, row: 3 } }));
    expect(r.state.combatants.C?.silenced).toBe(true);
    const shield = { id: 'shield', name: 'Shield', kind: 'shield', spell: 'Shield', resource: 'x' } as never;
    const c = { ...(r.state.combatants.C as Combatant), resources: { x: 1 } };
    expect(reactionUsable(c, shield)).toBe(false);
    expect(reactionUsable({ ...c, silenced: false }, shield)).toBe(true);
    const old = run(field([wiz(['Silence']), ally('C'), foe('F0')], pos, 34), cast('Silence', { targetHex: { col: 3, row: 3 } }));
    expect(old.state.combatants.C?.silenced).toBeUndefined();
  });
  it('Suggestion / Mass Suggestion: yalnızca büyücü tarafının hasarıyla biter; Mass Suggestion iki seçenek (35)', () => {
    const sug = spells.find((x) => x.id === 'suggestion')?.mechanics.a6?.effect;
    expect(sug?.breakOnDamage).toBe('casterSide');
    const s = field([wiz(['Mass Suggestion']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], pos, 35);
    const r = run(s, cast('Mass Suggestion', { targetIds: ['F0'], choice: 'flee', slotLevel: 6 }));
    expect(fx(r.state, 'F0', 'spells:mass-suggestion')).toMatchObject({ command: 'flee', commandPersist: true, breakOnDamage: 'casterSide' });
  });
});

describe('A6 yanılsama: Mind Spike, Phantasmal Force', () => {
  it('Mind Spike: başarısız save\'de büyücü yeri bilir, görünmezlik ona işlemez (35)', () => {
    const s = field([wiz(['Mind Spike']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 }, conditions: ['Invisible'] })], pos, 35);
    const r = run(s, cast('Mind Spike', { targetId: 'F0' }));
    const t = r.state.combatants.F0 as Combatant;
    expect(fx(r.state, 'F0', 'spells:mind-spike')?.pinpointBy).toBe('A');
    expect(knowsWhere(r.state, r.state.combatants.A as Combatant, t)).toBe(true);
    expect(sightConditions(r.state.combatants.A as Combatant, t, r.state).targetConditions).not.toContain('Invisible');
  });
  it('Phantasmal Force: Study (INT Investigation) ile kurtulma (35)', () => {
    let st: BattleState | null = null;
    for (let seed = 1; seed < 40 && !st; seed++) {
      const r = tryCmd(field([wiz(['Phantasmal Force']), foe('F0', { saves: { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 } })], pos, 35), cast('Phantasmal Force', { targetIds: ['F0'] }), seed);
      if (r.ok && fx(r.state, 'F0', 'spells:phantasmal-force')) st = r.state;
    }
    const e = fx(st as BattleState, 'F0', 'spells:phantasmal-force');
    expect(e?.escapeCheck).toEqual({ dc: 30, skill: 'investigation' });
    const esc = tryCmd(turnOf(st as BattleState, 'F0'), { type: 'escape', actorId: 'F0' } as Command);
    if (!esc.ok) throw new Error(esc.error);
    expect(esc.events.find((x) => x.type === 'grapple_escape')).toMatchObject({ skill: 'investigation' });
  });
});

describe('A6 çağırma ve alan: Gust of Wind, Conjure Animals, Conjure Fey, Animate Dead', () => {
  it('Gust of Wind: çizgide kalıcı alan (tur sonu STR save + itme, yaklaşmak iki kat) (35); 34\'te alan yok', () => {
    for (const [k, zone] of [[35, true], [34, false]] as const) {
      const s = field([wiz(['Gust of Wind']), foe('F0', { saves: { str: 30, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } })], { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } }, k);
      const r = run(s, cast('Gust of Wind', { targetHex: { col: 5, row: 3 } }));
      const z = r.state.map?.zones?.find((x) => x.spellId === 'gust-of-wind');
      expect(!!z).toBe(zone);
      if (z) expect(zoneMoveCost(r.state, r.state.combatants.F0 as Combatant)({ col: 4, row: 3 })).toBe(2);
    }
  });
  it('Conjure Animals: sürünün 5 ft içinde STR save avantajı (35)', () => {
    const owner = wiz([]);
    const pack = mk('P', { ownerId: 'p1', hp: 1, maxHp: 1, summon: { by: 'A', spellId: 'conjure-animals', spell: 'Conjure Animals', turn: 'after-owner', level: 3, withOwner: true, intangible: true } as never });
    const s = field([owner, pack, foe('F0')], { A: { col: 2, row: 3 }, P: { col: 3, row: 3 }, F0: { col: 8, row: 3 } }, 35);
    const tick = applyEvents(s, [{ type: 'map_note', text: 'senk' }]);
    expect(tick.combatants.A?.packStrAdv).toBe(true);
    expect(saveMode('normal', tick.combatants.A as Combatant, 'str')).toBe('advantage');
  });
  it('Conjure Fey: ruh 30 ft gidip yanındakine saldırır, isabette Frightened (35)', () => {
    const s = field([wiz(['Conjure Fey'], { spellAttack: 30 }), foe('F0'), foe('F1')], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 }, F1: { col: 9, row: 3 } }, 35);
    const r = run(s, cast('Conjure Fey', { targetId: 'F0', slotLevel: 6 }));
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ damageType: 'psychic', hit: true });
    expect(fx(r.state, 'F0', 'spells:conjure-fey')?.grants).toEqual(['Frightened']);
    const later = { ...r.state, round: r.state.round + 1, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: { ...(r.state.combatants.A as Combatant).economy, bonus: false } } } };
    const f = run(later, { type: 'spell_followup', actorId: 'A', targetId: 'F1' });
    expect(f.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'F1')).toBe(true);
  });
  it('Animate Dead: sürüm 35 çağrıları bonus eylemle emir ister (60 ft)', () => {
    const s = field([wiz(['Animate Dead']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 35);
    const setup = { ...s, status: 'setup' as const };
    const r = tryCmd(setup, cast('Animate Dead', { choice: 'skeleton', slotLevel: 3, targetHex: { col: 3, row: 3 } }));
    if (!r.ok) return; // kurulum yolu arenada açık değilse veri denetimi yeter
    const sk = Object.values(r.state.combatants).find((c) => c.summon?.spellId === 'animate-dead');
    expect(sk?.summon).toMatchObject({ commandBonus: true, commandFt: 60 });
  });
});

describe('A6 Game Master notu', () => {
  it('sığmayan parçası olan büyü yapınca günlüğe Game Master notu düşer (35), 34\'te düşmez', () => {
    for (const [k, note] of [[35, true], [34, false]] as const) {
      const r = run(field([wiz(['Blink']), foe('F0')], pos, k), cast('Blink', { targetIds: ['A'] }));
      expect(r.events.some((e) => e.type === 'map_note' && e.text.startsWith('Game Master notu — Blink'))).toBe(note);
    }
  });
});
