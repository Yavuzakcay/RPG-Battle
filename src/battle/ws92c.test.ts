/**
 * Görev WS92 aşama 3 (kural sürümü 92): biçim özellikleri SRD 5.2.1 stat bloklarına göre: STR/DEX skoru biçimden, Rampage
 * biçimde, Illumination parlak + loş, atlama özellikleri (Standing/Running Leap, Jumper), Water Breathing'li biçim karada
 * nefes tutar, Bubble Dash yalnız o hareket fırsat saldırısız, Cacophony Deafened dezavantajları, sabit 1 hasar, Multiattack
 * bileşimi (Brown Bear, Lion Roar). 91 eski davranış; replay.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { getMonster } from '../data';
import { capacityOf } from './nesneAgirlik';
import { highJumpProblem, highJumpReachFt, jumpRangeFeet } from './movement';
import { breathTurnEndEvents } from './underwater';
import { WS92_VERSION } from './ws92Surum';
import { CURRENT_RULES } from './ruleVersion';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = WS92_VERSION;
const OLD = WS92_VERSION - 1;
const MID: Rng = () => 0.5;
const o = (col: number, row: number): Offset => ({ col, row });
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const sheet = (forms: string[], patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 8, baseScores: suggestedScores('druid'),
  wildShapeForms: forms, ...patch,
});
/** Druid A (3,3), düşman T (4,3); sürüm `v`; `tiles` verilirse harita. */
function arena(v: number, forms: string[], t: Partial<Combatant> = {}, tiles?: string[]): BattleState {
  const d = combatantFromSheet(sheet(forms), { id: 'A', ownerId: 'p1' });
  const s0 = startBattle('ws92c', 'd', [d, mk('T', { side: 'enemies', hp: 80, maxHp: 80, ac: 5 })], MID, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, turnIndex: s0.order.indexOf('A'),
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)) },
    combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: o(3, 3) }, T: { ...(s0.combatants.T as Combatant), pos: o(4, 3), ...t } } };
}
const shapeIn = (v: number, form: string, t: Partial<Combatant> = {}, tiles?: string[]) => {
  const s = arena(v, [form], t, tiles);
  const r = ok(execute(s, { type: 'wild_shape', actorId: 'A', form } as Command, P1, MID));
  return { s0: s, r, a: r.state.combatants.A as Combatant };
};
const fresh = (s: BattleState, id = 'A'): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), economy: { ...(s.combatants[id] as Combatant).economy, action: false, bonus: false, attacksLeft: 0 } } } });
const beastOpt = (a: Combatant, name: string) => a.weaponOptions.find((x) => x.beast?.attack === name) as AttackOption;

describe('WS92-3 STR/DEX skoru biçimden (s. 43)', () => {
  it('Lion biçiminde STR 17, DEX 15; taşıma biçimin STR × 15 × boyut; dönünce druidin değerleri; 91 druidin skoru', () => {
    const { s0, r, a } = shapeIn(NEW, 'lion');
    const lion = getMonster('lion');
    expect(a.strScore).toBe(lion.abilities.str);
    expect(a.dexScore).toBe(lion.abilities.dex);
    expect(capacityOf(a)).toBe(lion.abilities.str * 15 * 2);
    const back = ok(execute(fresh(r.state), { type: 'wild_shape', actorId: 'A' } as Command, P1, MID)).state.combatants.A as Combatant;
    expect(back.strScore).toBe(s0.combatants.A!.strScore);
    expect(back.carryCapLb).toBe(s0.combatants.A!.carryCapLb);
    expect(shapeIn(OLD, 'lion').a.strScore).toBe(s0.combatants.A!.strScore);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
});

describe('WS92-3 atlama özellikleri', () => {
  it('Lion Running Leap: koşarak 25 ft, durarak STR/2', () => {
    const { a } = shapeIn(NEW, 'lion');
    expect(jumpRangeFeet(a, true)).toBe(25);
    expect(jumpRangeFeet(a, false)).toBe(Math.floor(getMonster('lion').abilities.str / 2));
  });
  it('Frog Standing Leap: koşusuz 10 ft uzun, 5 ft yüksek (yerinde zıplama erişimi); Jump büyüsü gerekmez', () => {
    const s = arena(NEW, ['frog']);
    const d = { ...(s.combatants.A as Combatant), level: 8 };
    const r = ok(execute({ ...s, combatants: { ...s.combatants, A: d } }, { type: 'wild_shape', actorId: 'A', form: 'frog' } as Command, P1, MID));
    const a = r.state.combatants.A as Combatant;
    expect(jumpRangeFeet(a, false)).toBe(10);
    expect(highJumpProblem(r.state, a)).toBeNull();
    const j = ok(execute(r.state, { type: 'jump', actorId: 'A', to: o(3, 3) } as Command, P1, MID));
    expect(highJumpReachFt(j.state, j.state.combatants.A as Combatant)).toBe(5);
    expect(j.state.combatants.A!.movementUsed).toBe(1);
  });
  it('Cat Jumper: mesafe DEX skoruyla', () => {
    const s = arena(NEW, ['cat']);
    const a = ok(execute(s, { type: 'wild_shape', actorId: 'A', form: 'cat' } as Command, P1, MID)).state.combatants.A as Combatant;
    expect(jumpRangeFeet(a, true)).toBe(getMonster('cat').abilities.dex);
    expect(jumpRangeFeet(a, false)).toBe(Math.floor(getMonster('cat').abilities.dex / 2));
  });
});

describe('WS92-3 Rampage (Giant Hyena) biçimde', () => {
  it('Bloodied hedefe isabetten sonra Rampage biçimde Bite yapar (92); 91 kullanılamaz', () => {
    const go = (v: number) => {
      const { r } = shapeIn(v, 'giant-hyena', { hp: 30, maxHp: 80 });
      return execute(fresh(r.state), { type: 'monster_ability', actorId: 'A', abilityId: 'rampage' } as Command, P1, MID);
    };
    const n = go(NEW);
    expect(n.ok).toBe(true);
    if (n.ok) expect(n.events.some((e) => e.type === 'attack_resolved' && e.actorId === 'A')).toBe(true);
    expect(go(OLD).ok).toBe(false);
  });
});

describe('WS92-3 Illumination (Giant Fire Beetle ve diğerleri)', () => {
  it('10 ft parlak + 10 ft loş (92); Fire Elemental 30 + 30; 91: 30 ft parlak', () => {
    const light = (v: number) => shapeIn(v, 'giant-fire-beetle').a.effects?.find((e) => e.light);
    expect(light(NEW)).toMatchObject({ light: 2, lightDim: 2 });
    expect(light(OLD)?.light).toBe(6);
    const fe = { ...combatantFromMonster(getMonster('fire-elemental'), { id: 'F', kuralSurumu: NEW }), side: 'enemies' as const };
    const s = startBattle('ws92e', 'd', [fe, mk('A', { ownerId: 'p1' })], MID, { kuralSurumu: NEW, map: { id: 'col' } } as never).state;
    expect(s.combatants.F?.effects?.find((e) => e.light)).toMatchObject({ light: 6, lightDim: 6 });
  });
});

describe('WS92-3 Water Breathing: karada nefes tutar', () => {
  it('Piranha biçimi karada tur sonunda nefes sayar; Amphibious (Frog) saymaz; derin suda saymaz; 91 saymaz', () => {
    const p = shapeIn(NEW, 'piranha');
    expect(breathTurnEndEvents(p.r.state, 'A').some((e) => e.type === 'map_effect' && (e.mapStatus?.breath ?? 0) === 1)).toBe(true);
    expect(breathTurnEndEvents(shapeIn(NEW, 'frog').r.state, 'A')).toEqual([]);
    const lake = Array.from({ length: 7 }, () => 'w'.repeat(15));
    expect(breathTurnEndEvents(shapeIn(NEW, 'piranha', {}, lake).r.state, 'A')).toEqual([]);
    expect(breathTurnEndEvents(shapeIn(OLD, 'piranha').r.state, 'A')).toEqual([]);
  });
});

describe('WS92-3 Bubble Dash (Seahorse)', () => {
  it('yüzme hızı kadar fırsat saldırısız hareket; tur boyu Disengage değil; turun hareketinden düşmez', () => {
    const lake = Array.from({ length: 7 }, () => 'w'.repeat(15));
    const { r } = shapeIn(NEW, 'seahorse', {}, lake);
    const b = ok(execute(fresh(r.state), { type: 'monster_ability', actorId: 'A', abilityId: 'bubble-dash' } as Command, P1, MID));
    const a = b.state.combatants.A as Combatant;
    expect(b.events.some((e) => e.type === 'moved' && e.actorId === 'A' && e.free)).toBe(true);
    expect(b.events.some((e) => e.type === 'disengaged')).toBe(false);
    expect(a.economy.disengaged).toBeFalsy();
    expect(a.movementUsed).toBe(0);
    expect(a.pos).not.toEqual(o(3, 3));
    // 91: Dash + Disengage (tur boyu).
    const old = shapeIn(OLD, 'seahorse', {}, lake);
    const ob = ok(execute(fresh(old.r.state), { type: 'monster_ability', actorId: 'A', abilityId: 'bubble-dash' } as Command, P1, MID));
    expect(ob.events.some((e) => e.type === 'disengaged')).toBe(true);
  });
});

describe('WS92-3 Cacophony (Swarm of Ravens)', () => {
  it('Deafened iken saldırı ve yetenek kontrolünde dezavantaj (92); 91 yok', () => {
    const go = (v: number) => {
      const { r } = shapeIn(v, 'swarm-of-ravens', { saves: { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 } });
      const a = r.state.combatants.A as Combatant;
      const i = a.attacks.findIndex((x) => x.name === 'Cacophony');
      return ok(execute(fresh(r.state), { type: 'monster_attack', actorId: 'A', targetId: 'T', attackIndex: i } as Command, P1, MID)).state.combatants.T as Combatant;
    };
    const t = go(NEW);
    expect(t.conditions).toContain('Deafened');
    const fx = t.effects?.find((e) => e.attackDis);
    expect(fx?.checkDis).toEqual(expect.arrayContaining(['str', 'wis']));
    expect(go(OLD).effects?.some((e) => e.attackDis)).toBeFalsy();
  });
});

describe('WS92-3 sabit 1 hasar (SRD "Hit: 1 … damage")', () => {
  it('Badger Bite 1: veri ve biçim seçeneği (92); 91 biçimde 1d2 (düşman canavarda srdK19 zaten 1 yazıyordu)', () => {
    expect(getMonster('badger').attacks.find((x) => x.name === 'Bite')?.damageDice).toBe('1');
    const enemy = (v: number) => startBattle('ws92s', 'd', [{ ...combatantFromMonster(getMonster('badger'), { id: 'B', kuralSurumu: v }), side: 'enemies' as const }, mk('A', { ownerId: 'p1' })],
      MID, { kuralSurumu: v, map: { id: 'col' } } as never).state.combatants.B?.attacks.find((x) => x.name === 'Bite')?.damageDice;
    expect(enemy(NEW)).toBe('1');
    expect(enemy(OLD)).toBe('1');
    expect(beastOpt(shapeIn(NEW, 'badger').a, 'Bite').damage).toBe('1');
    expect(beastOpt(shapeIn(OLD, 'badger').a, 'Bite').damage).toBe('1d2');
  });
});

describe('WS92-3 Multiattack bileşimi (biçimde)', () => {
  it('Brown Bear: bir Bite + bir Claw; ikinci Claw reddedilir (92); 91 serbest', () => {
    const go = (v: number) => {
      const { r, a } = shapeIn(v, 'brown-bear');
      const s1 = ok(execute(fresh(r.state), { type: 'attack', actorId: 'A', targetId: 'T', option: beastOpt(a, 'Claw') } as Command, P1, MID)).state;
      return { s1, a, second: execute(s1, { type: 'attack', actorId: 'A', targetId: 'T', option: beastOpt(a, 'Claw') } as Command, P1, MID) };
    };
    const n = go(NEW);
    expect(n.second.ok).toBe(false);
    expect(execute(n.s1, { type: 'attack', actorId: 'A', targetId: 'T', option: beastOpt(n.a, 'Bite') } as Command, P1, MID).ok).toBe(true);
    expect(go(OLD).second.ok).toBe(true);
  });
  it('Lion: Roar bir Rend\'in yerine (aynı Attack eyleminde)', () => {
    const { r, a } = shapeIn(NEW, 'lion');
    const s1 = ok(execute(fresh(r.state), { type: 'attack', actorId: 'A', targetId: 'T', option: beastOpt(a, 'Rend') } as Command, P1, MID)).state;
    const roar = a.attacks.findIndex((x) => x.name === 'Roar');
    const s2 = execute(s1, { type: 'monster_attack', actorId: 'A', targetId: 'T', attackIndex: roar } as Command, P1, MID);
    expect(s2.ok).toBe(true);
    if (s2.ok) {
      expect(s2.state.combatants.A!.economy.attacksLeft).toBe(0);
      expect(applyEvents(s1, []).combatants.A!.economy.attacksLeft).toBe(1);
    }
  });
});

describe('WS92-3 eski düşman yolu da aynı (GM)', () => {
  it('düşman Swarm of Ravens Cacophony aynı ek etkiyi verir', () => {
    const sw = { ...combatantFromMonster(getMonster('swarm-of-ravens'), { id: 'S', kuralSurumu: NEW }), side: 'enemies' as const };
    const s0 = startBattle('ws92r', 'd', [sw, mk('A', { ownerId: 'p1', saves: { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 } })], MID, { kuralSurumu: NEW, map: { id: 'col' } } as never).state;
    const s = { ...s0, status: 'active' as const, turnIndex: s0.order.indexOf('S'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) },
      combatants: { ...s0.combatants, S: { ...(s0.combatants.S as Combatant), pos: o(3, 3) }, A: { ...(s0.combatants.A as Combatant), pos: o(3, 3) } } };
    const i = s.combatants.S!.attacks.findIndex((x) => x.name === 'Cacophony');
    const r = execute(s, { type: 'monster_attack', actorId: 'S', targetId: 'A', attackIndex: i } as Command, GM, MID);
    if (r.ok) expect(r.state.combatants.A?.effects?.some((e) => e.attackDis)).toBe(r.state.combatants.A!.conditions.includes('Deafened'));
  });
});
