/**
 * Kuyruk G6: Game Master notlu 6 büyünün savaşta çalıştığının denetimi ve kapatılan boşluklar (kural sürümü 43):
 * Wish seçicisi, Hideous Laughter, See Invisibility, Animal Shapes / Enhance Ability (savaş dışı), Charm Person taraf
 * değiştirme, Fear eşya düşürme, Beacon of Hope iksir ve özellik iyileştirmesi. Replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { applyEvents } from './reduce';
import { mk } from './fixtures';
import { P1 } from './fixtures';
import { chooseCommand } from './ai';
import { heldWeapons } from './heldItems';
import { sightConditions } from './sight';
import { wishCandidates } from './spells69';
import { spellMenu } from '../ui/hud';
import { CURRENT_RULES } from './ruleVersion';
import { caster, field, run } from './k19spells.test';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, saves: LOW, creatureType: 'humanoid', ...p });
const pos = { A: { col: 2, row: 3 }, C: { col: 1, row: 3 }, F0: { col: 4, row: 3 } };
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const hi = () => 0.99;

describe('G6 Wish: büyü kopyalama', () => {
  const wiz = () => caster({ spellNames: ['Wish', 'Hideous Laughter'], spellSlots: ALL });
  const seenCast = (by: string, label: string): BattleEvent => ({ type: 'spell_cast', actorId: by, targetId: null, label, slotLevel: 3, note: '' });
  it('seçici: yalnızca karşı tarafın bu savaşta yaptığı, 8. seviye ve altı, 1 eylemlik büyüler', () => {
    const s = field([wiz(), foe('F0')], pos, 43);
    const evs = [seenCast('F0', 'Fireball'), seenCast('F0', 'Hideous Laughter'), seenCast('F0', 'Wish'), seenCast('A', 'Fear'), seenCast('F0', 'Find Familiar')];
    expect(wishCandidates(s, evs, 'A')).toEqual(['Fireball', 'Hideous Laughter']);
    expect(wishCandidates(s, [], 'A')).toEqual([]);
  });
  it('Wish ile tek hedefli bir büyü kopyalanır (hedef listesiyle), 9. seviye slot harcanır', () => {
    const s = field([wiz(), foe('F0')], pos, 43);
    const r = run(s, cast('Wish', { choice: 'Hideous Laughter', targetIds: ['F0'] }));
    expect(r.state.combatants.A?.spellSlots[8]).toBe(0);
    expect(r.state.combatants.F0?.conditions).toEqual(expect.arrayContaining(['Prone', 'Incapacitated']));
  });
  it('seçim ya da 9. seviye büyü seçilirse reddedilir', () => {
    const s = field([wiz(), foe('F0')], pos, 43);
    expect(execute(s, cast('Wish', { targetIds: ['F0'] }), P1, hi).ok).toBe(false);
    expect(execute(s, cast('Wish', { choice: 'Wish' }), P1, hi).ok).toBe(false);
  });
});

describe('G6 Hideous Laughter', () => {
  it('konsantrasyon bitince Prone + Incapacitated kalkar', () => {
    const s = field([caster({ spellNames: ['Hideous Laughter'], spellSlots: ALL }), foe('F0')], pos, 43);
    const r = run(s, cast('Hideous Laughter', { targetId: 'F0' }));
    expect(r.state.combatants.F0?.conditions).toEqual(expect.arrayContaining(['Prone', 'Incapacitated']));
    expect(r.state.combatants.A?.concentration?.spell).toBe('Hideous Laughter');
    const ended = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'Hideous Laughter' }]);
    expect(ended.combatants.F0?.conditions).not.toContain('Incapacitated');
    expect(ended.combatants.F0?.conditions).not.toContain('Prone');
    expect(ended.combatants.F0?.effects?.some((e) => e.id === 'spells:hideous-laughter')).toBeFalsy();
  });
});

describe('G6 See Invisibility', () => {
  it('görünmezi görür: saldırı bağlamında Invisible düşer; görünmeyen saldıran için kalır; gizlenme (Hidden) etkilenmez', () => {
    const s = field([caster({ spellNames: ['See Invisibility'], spellSlots: ALL }), foe('F0', { conditions: ['Invisible'] })], pos, 43);
    const before = sightConditions(s.combatants.A as Combatant, s.combatants.F0 as Combatant, s);
    expect(before.targetConditions).toContain('Invisible');
    const r = run(s, cast('See Invisibility'));
    const after = sightConditions(r.state.combatants.A as Combatant, r.state.combatants.F0 as Combatant, r.state);
    expect(after.targetConditions).not.toContain('Invisible');
    // Büyücüye saldıran görünmez yaratığın görünmezliği düşer; büyüsüz dosta saldırırken kalır.
    expect(sightConditions(r.state.combatants.F0 as Combatant, r.state.combatants.A as Combatant, r.state).attackerConditions).not.toContain('Invisible');
    const ally = mk('C', { ownerId: 'p1', hp: 30, maxHp: 30 });
    expect(sightConditions(r.state.combatants.F0 as Combatant, ally, r.state).attackerConditions).toContain('Invisible');
    // Kamuflaj / gizlenme: motorda yalnızca 'Invisible' durumuna bakılır; Hidden ya da stealth etkisine dokunmaz.
    const hidden = { ...(r.state.combatants.F0 as Combatant), conditions: ['Hidden'] };
    expect(sightConditions(r.state.combatants.A as Combatant, hidden, r.state).targetConditions).toContain('Hidden');
  });
});

describe('G6 Animal Shapes ve Enhance Ability: savaş dışı', () => {
  const get = (n: string) => spells.find((x) => x.name === n) as NonNullable<(typeof spells)[number]>;
  it('veri: savaş dışı + savaş listesinde yok + Game Master notu TR/EN', () => {
    for (const n of ['Animal Shapes', 'Enhance Ability']) {
      const m = get(n).mechanics;
      expect(m.offCombat && m.battleHidden && m.gmNote && m.gmNoteEn).toBeTruthy();
    }
  });
  it('savaş büyü menüsünde yok, yapay zekâ yapmaz', () => {
    const a = caster({ spellNames: ['Animal Shapes', 'Enhance Ability', 'Hideous Laughter'], spellSlots: ALL });
    expect(spellMenu(a).map((x) => x.spell.name)).toEqual(['Hideous Laughter']);
    const e = mk('E', { side: 'enemies', hp: 50, maxHp: 50, spellNames: ['Animal Shapes', 'Enhance Ability'], spellSlots: ALL, spellSaveDc: 15, spellMod: 4, casterTag: 'druid' });
    const s = field([e, mk('P', { ownerId: 'p1', hp: 50, maxHp: 50 })], { E: { col: 2, row: 3 }, P: { col: 3, row: 3 } }, 43);
    for (let i = 0; i < 6; i++) {
      const c = chooseCommand({ ...s, round: i + 1 });
      expect(c.type === 'cast_spell' && ['Animal Shapes', 'Enhance Ability'].includes(c.spellName)).toBe(false);
    }
  });
});

describe('G6 Charm Person: taraf değiştirme (sürüm 43)', () => {
  const party = (k: number) => field([caster({ spellNames: ['Charm Person'], spellSlots: ALL }), mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword] }), foe('F0')], pos, k);
  it('hedef büyücünün tarafına ve oyuncusuna geçer; sürüm 42\'de yalnızca Charmed', () => {
    const now = run(party(43), cast('Charm Person', { targetId: 'F0' })).state.combatants.F0 as Combatant;
    expect(now.side).toBe('party');
    expect(now.ownerId).toBe('p1');
    expect(now.allegiance?.side).toBe('enemies');
    expect(now.conditions).toContain('Charmed');
    const old = run(party(42), cast('Charm Person', { targetId: 'F0' })).state.combatants.F0 as Combatant;
    expect(old.side).toBe('enemies');
    expect(old.conditions).toContain('Charmed');
  });
  it('büyücü ya da müttefikleri zarar verince biter ve eski tarafa döner', () => {
    const s = run(party(43), cast('Charm Person', { targetId: 'F0' })).state;
    const r = execute({ ...s, order: ['C', 'A', 'F0'], turnIndex: 0, combatants: { ...s.combatants, C: { ...(s.combatants.C as Combatant), pos: { col: 3, row: 3 } } } },
      { type: 'attack', actorId: 'C', targetId: 'F0', option: sword }, P1, hi);
    if (!r.ok) throw new Error(r.error);
    const f = r.state.combatants.F0 as Combatant;
    expect(f.effects?.some((e) => e.id === 'spells:charm-person')).toBeFalsy();
    expect(f.side).toBe('enemies');
    expect(f.allegiance).toBeUndefined();
    expect(f.conditions).not.toContain('Charmed');
  });
});

describe('G6 Fear: korkan yaratık elindekini düşürür (sürüm 43)', () => {
  const party = (k: number) => field([caster({ spellNames: ['Fear'], spellSlots: ALL }), foe('F0', { weaponOptions: [sword] })], pos, k);
  it('başarısız save: silah yere düşer; sürüm 42\'de düşmez', () => {
    const r = run(party(43), cast('Fear', { targetHex: { col: 4, row: 3 } }));
    expect(r.events.some((e) => e.type === 'item_dropped')).toBe(true);
    expect(heldWeapons(r.state.combatants.F0 as Combatant)).toEqual([]);
    expect(r.state.combatants.F0?.conditions).toContain('Frightened');
    const old = run(party(42), cast('Fear', { targetHex: { col: 4, row: 3 } }));
    expect(old.events.some((e) => e.type === 'item_dropped')).toBe(false);
    expect(heldWeapons(old.state.combatants.F0 as Combatant)).toEqual(['longsword']);
  });
  it('başarılı save: düşürmez', () => {
    const s = field([caster({ spellNames: ['Fear'], spellSlots: ALL, spellSaveDc: 1 }), foe('F0', { weaponOptions: [sword], saves: { ...LOW, wis: 20 } })], pos, 43);
    const r = run(s, cast('Fear', { targetHex: { col: 4, row: 3 } }));
    expect(r.events.some((e) => e.type === 'item_dropped')).toBe(false);
  });
});

describe('G6 Beacon of Hope: iksir ve özellik iyileştirmesi (sürüm 43)', () => {
  const beacon = { id: 'spells:beacon-of-hope', name: 'Beacon of Hope', sourceId: 'A', maxHeal: true, until: 99 };
  const party = (k: number) => {
    const s = field([caster({ consumables: { 'potion-of-greater-healing': 2 }, resources: { secondWind: 1 }, level: 5 }), mk('C', { ownerId: 'p1', hp: 5, maxHp: 80, effects: [beacon] }), foe('F0')], pos, k);
    return { ...s, combatants: { ...s.combatants, C: { ...(s.combatants.C as Combatant), pos: { col: 3, row: 3 } } } } as BattleState;
  };
  it('iksir: Beacon\'lı hedefte en yüksek zar (4d4+4 = 20); sürüm 42\'de atılır', () => {
    const use = { type: 'use_item', actorId: 'A', itemId: 'potion-of-greater-healing', targetId: 'C' } as Command;
    const hp43 = run(party(43), use).state.combatants.C?.hp;
    expect(hp43).toBe(5 + 20);
    const s42 = run(party(42), use).state.combatants.C?.hp as number;
    expect(s42).toBeLessThan(5 + 20);
  });
  it('Second Wind: Beacon\'lı savaşçıda 1d10 + seviye en yüksek', () => {
    const s = party(43);
    const self = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hp: 5, maxHp: 80, effects: [beacon] } } };
    const r = execute(self, { type: 'second_wind', actorId: 'A' } as Command, P1, () => 0);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.hp).toBe(5 + 10 + 5);
  });
});

describe('G6 kural sürümü', () => {
  it('güncel sürüm 57 (K71b; K71a = 56, Y1 = 55, K70 = 54, K69 = 53, K68 = 52, K67 = 51, G6 = 43, K61 = 44, P12 = 45, K62 = 46, K63 = 47, K64 = 48, K65 = 49, K66 = 50)', () => { expect(CURRENT_RULES).toBe(57); });
});
