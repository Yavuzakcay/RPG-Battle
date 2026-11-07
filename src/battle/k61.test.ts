/**
 * Kuyruk K61: SRD uyumu 1 (kural sürümü 44, mekaniğin `k61` bloğu). Her büyü için yeni davranış (44) ve eski davranış
 * (43); replay `run` içinde denetlenir. M1 metni (`spell.text`) ile motorun aynı sayı/türü kullandığı küçük kontroller.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { applyEvents } from './reduce';
import { GM, mk, P1 } from './fixtures';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const ALL = [4, 3, 3, 3, 3, 3, 2, 2, 1];
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 400, maxHp: 400, saves: LOW, ...p });
const pos = { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } };
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, ...p });
const sp = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const saves = (evs: BattleEvent[]) => evs.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved');
const endTurn = (s: BattleState, id: string) => { const r = execute(s, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM, () => 0.5); if (!r.ok) throw new Error(r.error); return r; };

describe('K61 Blade Barrier: Force', () => {
  it('veri ve metin: 6d10 Force', () => {
    expect(sp('Blade Barrier').text).toMatch(/6d10/);
    expect(sp('Blade Barrier').mechanics.k61?.damageType).toBe('force');
    expect(sp('Blade Barrier').mechanics.k61?.zone?.damageType).toBe('force');
  });
  it('sürüm 44: alan tetiği Force; sürüm 43: Slashing', () => {
    const tick = (k: number) => {
      const s = field([wiz(['Blade Barrier']), foe('F0')], pos, k);
      const r = run(s, cast('Blade Barrier', { targetHex: pos.F0 }));
      expect(r.state.map?.zones?.length).toBe(1);
      const e = endTurn(r.state, 'A');
      return e.events.filter((x) => x.type === 'effect_tick' || x.type === 'save_resolved');
    };
    const dt = (evs: BattleEvent[]) => evs.map((e) => (e.type === 'effect_tick' || e.type === 'save_resolved' ? e.damageType : ''));
    expect(dt(tick(44))).toContain('force');
    expect(dt(tick(43))).toContain('slashing');
  });
});

const withSaves = (s: BattleState, id: string, sv: typeof LOW): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), saves: sv } } });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const rollsOf = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'attack_resolved').flatMap((e) => (e.type === 'attack_resolved' ? e.damageRolls : []));

describe('K61 Conjure Fey: üst slot başına +1d12', () => {
  it('veri ve metin: 3d12, üst slot 1d12', () => {
    expect(sp('Conjure Fey').text).toMatch(/1d12/);
    expect(sp('Conjure Fey').mechanics.k61?.upcast?.dice).toBe('1d12');
  });
  it('8. seviye slotta 44: 3d12 + 2 × 1d12 = 5 zar; 43: 7 zar (eski 2d12)', () => {
    const n = (k: number, slot: number) => {
      const s = field([wiz(['Conjure Fey'], { spellAttack: 30 }), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, k);
      return rollsOf(run(s, cast('Conjure Fey', { targetId: 'F0', slotLevel: slot })).events).length;
    };
    expect(n(44, 6)).toBe(3);
    expect(n(44, 8)).toBe(5);
    expect(n(43, 8)).toBe(7);
  });
});

describe('K61 Sunburst: Blinded 1 dakika, tur sonu CON save', () => {
  const start = (k: number) => run(field([wiz(['Sunburst'], { hp: 900, maxHp: 900 }), foe('F0')], pos, k), cast('Sunburst', { targetHex: pos.F0 }, ));
  it('metin 12d6 Radiant + Blinded 1 dakika; 44: süreli durum ve CON save sayacı 10 tur', () => {
    expect(sp('Sunburst').text).toMatch(/12d6/);
    const r = start(44);
    expect(r.state.combatants.F0?.conditions).toContain('Blinded');
    const t = r.state.combatants.F0?.conditionTimers?.find((x) => x.condition === 'Blinded');
    expect(t).toMatchObject({ end: 'turnEnd', count: 10, save: { ability: 'con' } });
  });
  it('başarılı tur sonu save: Blinded biter; başarısızsa kalır; 43\'te süre/save yok', () => {
    const r = start(44);
    const passed = endTurn(withSaves(endTurn(r.state, 'A').state, 'F0', HIGH), 'F0').state;
    expect(passed.combatants.F0?.conditions).not.toContain('Blinded');
    const failed = endTurn(endTurn(r.state, 'A').state, 'F0').state;
    expect(failed.combatants.F0?.conditions).toContain('Blinded');
    expect(start(43).state.combatants.F0?.conditionTimers?.some((x) => x.condition === 'Blinded')).toBeFalsy();
  });
});

describe('K61 Irresistible Dance: başarılı save\'de bir tur yerinde dans', () => {
  const dance = (k: number, sv: typeof LOW) => run(field([wiz(['Irresistible Dance']), foe('F0', { saves: sv })], pos, k), cast('Irresistible Dance', { targetId: 'F0' }));
  it('44: başarıda hız 0, hedefin sonraki turunun sonunda biter; başarısızlık değişmez', () => {
    const ok = dance(44, HIGH);
    expect(fx(ok.state, 'F0', 'spells:irresistible-dance')).toMatchObject({ speedZero: true, untilOwnTurnEnd: true });
    expect(ok.state.combatants.A?.concentration).toBeTruthy();
    const after = endTurn(endTurn(ok.state, 'A').state, 'F0').state;
    expect(fx(after, 'F0', 'spells:irresistible-dance')).toBeUndefined();
    const bad = dance(44, LOW);
    expect(fx(bad.state, 'F0', 'spells:irresistible-dance')).toMatchObject({ speedZero: true, repeatSave: expect.anything() });
  });
  it('43: başarılı save\'de etki yok', () => {
    expect(fx(dance(43, HIGH).state, 'F0', 'spells:irresistible-dance')).toBeUndefined();
  });
});

describe('K61 Flesh to Stone: üç başarı / üç başarısızlık', () => {
  const stone = (k: number, sv: typeof LOW) => run(field([wiz(['Flesh to Stone']), foe('F0', { saves: sv })], pos, k), cast('Flesh to Stone', { targetId: 'F0' }));
  /** Hedefin tur sonu save'i: önce büyücü, sonra hedef turunu bitirir. */
  const turn = (s: BattleState, sv: typeof LOW) => endTurn(endTurn(withSaves(s, 'F0', sv), 'A').state, 'F0').state;
  it('başarılı ilk save: hız 0, büyücünün sonraki turunun başına dek; Restrained yok', () => {
    const r = stone(44, HIGH);
    expect(fx(r.state, 'F0', 'spells:flesh-to-stone:ok')).toMatchObject({ speedZero: true, untilSourceTurn: true });
    expect(r.state.combatants.F0?.conditions).not.toContain('Restrained');
    expect(stone(43, HIGH).state.combatants.F0?.effects?.length ?? 0).toBe(0);
  });
  it('başarısızlık: Restrained; üç başarısız tur sonu save Petrified, sayaçlar ardışık olmak zorunda değil', () => {
    let s = stone(44, LOW).state;
    expect(s.combatants.F0?.conditions).toContain('Restrained');
    s = turn(s, LOW); // f1
    s = turn(s, HIGH); // s1
    s = turn(s, LOW); // f2
    expect(s.combatants.F0?.conditions).not.toContain('Petrified');
    expect(fx(s, 'F0', 'spells:flesh-to-stone')?.repeatSave?.tally).toMatchObject({ s: 1, f: 2, need: 3 });
    s = turn(s, LOW); // f3
    expect(s.combatants.F0?.conditions).toContain('Petrified');
    expect(s.combatants.F0?.conditions).not.toContain('Restrained');
  });
  it('üç başarılı save büyüyü bitirir', () => {
    let s = stone(44, LOW).state;
    s = turn(s, HIGH); s = turn(s, LOW); s = turn(s, HIGH);
    expect(fx(s, 'F0', 'spells:flesh-to-stone')).toBeDefined();
    s = turn(s, HIGH);
    expect(fx(s, 'F0', 'spells:flesh-to-stone')).toBeUndefined();
    expect(s.combatants.F0?.conditions).not.toContain('Restrained');
  });
});

describe('K61 Earthquake: döküm ve büyücünün tur sonları', () => {
  const quake = (k: number) => run(field([wiz(['Earthquake']), foe('F0')], pos, k), cast('Earthquake', { targetHex: pos.F0 }));
  const dexSaves = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'save_resolved' && e.targetId === 'F0' || e.type === 'effect_tick' && e.targetId === 'F0' && !!e.save).length;
  it('44: dökümde alandaki herkes save atar; büyücünün tur sonunda yeniden; hedefin kendi turunda atmaz', () => {
    const r = quake(44);
    expect(dexSaves(r.events)).toBe(1);
    expect(r.state.combatants.F0?.conditions).toContain('Prone');
    const stand = { ...r.state, combatants: { ...r.state.combatants, F0: { ...(r.state.combatants.F0 as Combatant), conditions: [] } } };
    const e = endTurn(stand, 'A');
    expect(dexSaves(e.events)).toBe(1);
    expect(e.state.combatants.F0?.conditions).toContain('Prone');
    expect(dexSaves(endTurn(e.state, 'F0').events)).toBe(0);
  });
  it('43: dökümde save yok, hedefin tur başında atar (eski zamanlama)', () => {
    const r = quake(43);
    expect(dexSaves(r.events)).toBe(0);
    expect(dexSaves(endTurn(r.state, 'A').events)).toBe(1);
  });
});

describe('K61 Charm Person: Dominate tepki bağı ayrıldı', () => {
  const OPP = 'opp';
  const reacted = (s: BattleState, id: string) => applyEvents(s, [{ type: 'reaction_used', actorId: id, reaction: OPP, name: 'Fırsat', trigger: 'leave' } as BattleEvent]);
  const swap = (spell: string, k: number) => {
    const a = wiz([spell], { spellSaveDc: 30 });
    return run(field([a, foe('F0', { creatureType: 'humanoid', hp: 400 })], pos, k), cast(spell, { targetId: 'F0' })).state;
  };
  it('44: Charm Person tarafı değiştirir ama tepki bağı yok; Dominate Person\'da bağ var', () => {
    const c = swap('Charm Person', 44);
    expect(c.combatants.F0?.side).toBe('party');
    expect(fx(c, 'F0', 'spells:charm-person')?.reactionLink).toBeUndefined();
    expect(reacted(c, 'F0').combatants.A?.economy.reaction).toBe(false);
    const d = swap('Dominate Person', 44);
    expect(fx(d, 'F0', 'spells:dominate-person')?.reactionLink).toBe(true);
    expect(reacted(d, 'F0').combatants.A?.economy.reaction).toBe(true);
  });
  it('43: Charm Person\'da bağ eskisi gibi (her taraf değiştirme bağlar)', () => {
    const c = swap('Charm Person', 43);
    expect(reacted(c, 'F0').combatants.A?.economy.reaction).toBe(true);
  });
});
