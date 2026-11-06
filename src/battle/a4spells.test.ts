/**
 * Kuyruk A4: kısmi büyülerin tamamlanması (kural sürümü 32, mekaniğin `a4` hâli). Her büyü için yeni davranış (sürüm 32)
 * ve eski davranış (sürüm 31); replay aynı (`run` denetler).
 */
import { describe, expect, it } from 'vitest';
import { applyEvents } from './reduce';
import { effectTurnEndEvents } from './effects';
import { wardSources } from './divine';
import { afterAttackReactions } from './reactions';
import { mk } from './fixtures';
import { seededRng } from '../rules/dice';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 4, row: 3 } };
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];

describe('A4 Blur ve Mirror Image: Blindsight/Truesight', () => {
  const party = (k: number, spell: string, senses?: Combatant['senses']) => field([caster({ spellNames: [spell] }), foe('F0', senses ? { senses } : {})], pos, k, { specialSenses: true });
  it('Blur: 30 ft Blindsight\'lı saldıran dezavantajsız (sürüm 32); sürüm 31\'de dezavantajlı', () => {
    const now = run(party(32, 'Blur', { blindsight: 30 }), cast('Blur', { targetId: 'A' })).state;
    expect(wardSources(now, now.combatants.F0 as Combatant, now.combatants.A as Combatant).some((x) => x.reason === 'Blur')).toBe(false);
    const plain = run(party(32, 'Blur'), cast('Blur', { targetId: 'A' })).state;
    expect(wardSources(plain, plain.combatants.F0 as Combatant, plain.combatants.A as Combatant).some((x) => x.reason === 'Blur')).toBe(true);
    const old = run(party(31, 'Blur', { blindsight: 30 }), cast('Blur', { targetId: 'A' })).state;
    expect(wardSources(old, old.combatants.F0 as Combatant, old.combatants.A as Combatant).some((x) => x.reason === 'Blur')).toBe(true);
  });
  it('Mirror Image etkisi sürüm 32\'de Blindsight/Truesight işaretli', () => {
    expect(fx(run(party(32, 'Mirror Image'), cast('Mirror Image', { targetId: 'A' })).state, 'A', 'spells:mirror-image')?.sensesPierce).toBe(true);
    expect(fx(run(party(31, 'Mirror Image'), cast('Mirror Image', { targetId: 'A' })).state, 'A', 'spells:mirror-image')?.sensesPierce).toBeUndefined();
  });
});

describe('A4 save/kontrol', () => {
  it('Protection from Poison: Poisoned\'a karşı save avantajı (32), yok (31)', () => {
    const p = (k: number) => run(field([caster({ spellNames: ['Protection from Poison'], casterTag: 'cleric' }), mk('C', { ownerId: 'p1' }), foe('F0')], pos, k), cast('Protection from Poison', { targetId: 'C' })).state;
    expect(fx(p(32), 'C', 'spells:protection-from-poison')?.saveAdvAgainst).toEqual(['Poisoned']);
    expect(fx(p(31), 'C', 'spells:protection-from-poison')?.saveAdvAgainst).toBeUndefined();
  });
  it('Hex: hedefin güçlü STR/DEX kontrolüne dezavantaj (32); eski sürümde yok', () => {
    const p = (k: number) => run(field([caster({ spellNames: ['Hex'], casterTag: 'warlock' }), foe('F0', { saves: { str: 0, dex: 4, con: 0, int: 0, wis: 0, cha: 0 } })], pos, k), cast('Hex', { targetId: 'F0' })).state;
    expect(fx(p(32), 'F0', 'spells:hex:check')?.checkDis).toEqual(['dex']);
    expect(fx(p(31), 'F0', 'spells:hex:check')).toBeUndefined();
  });
  it('Bestow Curse (yetenek): seçilen yetenekte save ve kontrol dezavantajı (32)', () => {
    const p = (k: number) => run(field([caster({ spellNames: ['Bestow Curse'], casterTag: 'cleric' }), foe('F0')], { ...pos, F0: { col: 3, row: 3 }, C: { col: 9, row: 3 } }, k), cast('Bestow Curse', { targetId: 'F0', choice: 'str' })).state;
    const e = fx(p(32), 'F0', 'spells:bestow-curse');
    expect(e?.saveDis).toEqual(['str']);
    expect(e?.checkDis).toEqual(['str']);
    expect(fx(p(31), 'F0', 'spells:bestow-curse')?.checkDis).toBeUndefined();
  });
});

describe('A4 süreler', () => {
  it('Color Spray: Blinded büyücünün sonraki turunun sonunda biter (32)', () => {
    const r = run(field([caster({ spellNames: ['Color Spray'] }), foe('F0')], pos, 32), cast('Color Spray', { targetHex: { col: 4, row: 3 } }));
    const e = fx(r.state, 'F0', 'spells:color-spray');
    expect(e?.endAfterSourceTurn).toBe(r.state.round);
    expect(effectTurnEndEvents(r.state, 'A', seededRng(1)).some((x) => x.type === 'effect_ended')).toBe(false);
    const next = { ...r.state, round: r.state.round + 1 };
    expect(effectTurnEndEvents(next, 'A', seededRng(1)).some((x) => x.type === 'effect_ended' && x.targetId === 'F0')).toBe(true);
    const old = run(field([caster({ spellNames: ['Color Spray'] }), foe('F0')], pos, 31), cast('Color Spray', { targetHex: { col: 4, row: 3 } }));
    expect(fx(old.state, 'F0', 'spells:color-spray')?.endAfterSourceTurn).toBeUndefined();
  });
  it('Fear: büyücüyü görürken tur sonu save\'i yok (32); 31\'de var', () => {
    const p = (k: number) => {
      const r = run(field([caster({ spellNames: ['Fear'] }), foe('F0')], pos, k), cast('Fear', { targetHex: { col: 4, row: 3 } }));
      return effectTurnEndEvents(r.state, 'F0', seededRng(2)).some((x) => x.type === 'effect_tick' && !!x.save);
    };
    expect(p(32)).toBe(false);
    expect(p(31)).toBe(true);
  });
});

describe('A4 eylem ve tepki', () => {
  it('Expeditious Retreat: yapınca Dash, süresince bonus eylemle Dash (32); 31\'de hız ×2', () => {
    const p = (k: number) => run(field([caster({ spellNames: ['Expeditious Retreat'] }), foe('F0')], pos, k), cast('Expeditious Retreat', { targetId: 'A' }));
    const now = p(32);
    expect(now.events.some((e) => e.type === 'dashed')).toBe(true);
    expect(fx(now.state, 'A', 'spells:expeditious-retreat')?.bonusGrant).toEqual(['dash']);
    expect(fx(p(31).state, 'A', 'spells:expeditious-retreat')?.speedMult).toBe(2);
  });
  it('Holy Aura: yakın dövüşle vuran Undead CON save ya da Blinded (32)', () => {
    const s = field([caster({ spellNames: ['Holy Aura'], casterTag: 'cleric', spellSlots: ALL }), foe('F0', { creatureType: 'undead', saves: { str: 0, dex: 0, con: -5, int: 0, wis: 0, cha: 0 } })], pos, 32, { spells69: true });
    const r = run(s, cast('Holy Aura', { targetIds: ['A'] } as Partial<Command>));
    const ev = afterAttackReactions(r.state, 'F0', 'A', { events: [], hit: true, ac: 10, damage: 3 }, { melee: true, damageType: 'slashing', dealt: 3 }, seededRng(4));
    const after = applyEvents(r.state, ev as BattleEvent[]);
    expect(after.combatants.F0?.conditions).toContain('Blinded');
  });
});
