/** Silah ustalığı (Weapon Mastery, SRD 5.2.1 s. 89–90): veri, seçim ve her ustalığın savaştaki etkisi. */
import { describe, it, expect } from 'vitest';
import { startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './index';
import { getMonster } from '../data';
import { combatantFromMonster } from './create';
import { weaponAttackEvents } from './features';
import { monsterAttackEvents } from './monsters';
import { applyEvents, speedHexes } from './reduce';
import { weaponAttackOption } from './weapons';
import { advanceTo, mk, scripted, setup, sword, zero } from './fixtures';
import { distance, type Offset } from '../rules/hex';
import {
  masteryOptions, masteryProblems, masteryRight, masterySwapLimit, masterySwapProblem, masteryWorks, weaponMasteryId,
} from '../rules/mastery';
import type { CharacterSheet } from '../rules/stats';

const sc = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });
const sheet = (p: Partial<CharacterSheet> & Pick<CharacterSheet, 'classId' | 'level'>): CharacterSheet => ({
  name: 'Test', raceId: 'human', armorName: 'Zırhsız', shield: false, itemNames: [], baseScores: sc(16, 14, 14, 10, 10, 10), ...p,
});
/** Ustalıklı silah seçeneği (yetenek değiştiricisi 3, yetkinlik 2). */
const opt = (mastery: AttackOption['mastery'], p: Partial<AttackOption> = {}): AttackOption => ({
  ...sword, mastery, abilityMod: 3, weaponDamage: '1d8', masteryDc: 13, ...p,
});
const HIT: Array<[number, number]> = [[20, 15], [8, 5]];
const MISS: Array<[number, number]> = [[20, 2]];

/** Saldırıyı çözer ve uygular. */
function attack(s: BattleState, actorId: string, targetId: string, o: AttackOption, ...rolls: Array<[number, number]>) {
  const r = weaponAttackEvents(s, s.combatants[actorId] as Combatant, s.combatants[targetId] as Combatant, o, scripted(...rolls));
  if (!r.ok) throw new Error(r.error);
  return { events: r.events, state: applyEvents(s, r.events) };
}
const types = (events: BattleEvent[]) => events.map((e) => e.type);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d6+2', damageType: 'slashing', repeat: 1, ranged: false, text: '' };

const o = (col: number, row: number): Offset => ({ col, row });
/** Haritalı savaş (kale, düz zemin); sıra listedeki ilk savaşçıda. */
function field(parts: Combatant[], positions: Record<string, Offset>): BattleState {
  const { state } = startBattle('m', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })),
    scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

describe('veri: SRD silah tablosu ve sınıf tablosu', () => {
  it('silahın ustalığı SRD tablosundan', () => {
    expect(weaponMasteryId('longsword')).toBe('sap');
    expect(weaponMasteryId('greataxe')).toBe('cleave');
    expect(weaponMasteryId('rapier')).toBe('vex');
    expect(weaponMasteryId('longbow')).toBe('slow');
    expect(weaponMasteryId('greatsword')).toBe('graze');
    expect(weaponMasteryId('warhammer')).toBe('push');
    expect(weaponMasteryId('quarterstaff')).toBe('topple');
    expect(weaponMasteryId('dagger')).toBe('nick');
  });
  it('hak sayısı sınıf tablosundan (Fighter 3→4, Barbarian 2→3, Rogue 2); hakkı olmayan sınıf', () => {
    expect(masteryRight(sheet({ classId: 'fighter', level: 1 }))?.count).toBe(3);
    expect(masteryRight(sheet({ classId: 'fighter', level: 4 }))?.count).toBe(4);
    expect(masteryRight(sheet({ classId: 'barbarian', level: 4 }))?.count).toBe(3);
    expect(masteryRight(sheet({ classId: 'rogue', level: 5 }))?.count).toBe(2);
    expect(masteryRight(sheet({ classId: 'wizard', level: 5 }))).toBeNull();
  });
  it('seçilebilen silahlar: yetkinlik ve Barbarian yakın dövüş kısıtı', () => {
    const barb = masteryOptions(sheet({ classId: 'barbarian', level: 1 })).map((w) => w.id);
    expect(barb).toContain('greataxe');
    expect(barb).not.toContain('longbow');
    const rogue = masteryOptions(sheet({ classId: 'rogue', level: 1 })).map((w) => w.id);
    expect(rogue).toEqual(expect.arrayContaining(['rapier', 'shortbow', 'dagger']));
    expect(rogue).not.toContain('longsword');
  });
  it('seçim denetimi: fazla, yinelenen ve uygun olmayan silah', () => {
    const f = sheet({ classId: 'fighter', level: 1, weaponMasteries: ['longsword', 'longbow', 'greataxe', 'warhammer'] });
    expect(masteryProblems(f)).toEqual(['En çok 3 silah seçilebilir.']);
    expect(masteryProblems(sheet({ classId: 'rogue', level: 1, weaponMasteries: ['longsword'] }))).toEqual(['longsword: bu silahın ustalığı seçilemez.']);
    expect(masteryProblems(sheet({ classId: 'wizard', level: 1, weaponMasteries: ['dagger'] }))).toEqual(['Bu sınıfın silah ustalığı yok.']);
  });
  it('uzun dinlenmede değiştirme: Fighter/Barbarian bir seçim, Rogue/Paladin/Ranger hepsi', () => {
    const f = sheet({ classId: 'fighter', level: 1, weaponMasteries: ['longsword', 'longbow', 'greataxe'] });
    expect(masterySwapLimit(f)).toBe(1);
    expect(masterySwapProblem(f, ['longsword', 'longbow', 'warhammer'])).toBeNull();
    expect(masterySwapProblem(f, ['longsword', 'maul', 'warhammer'])).toContain('en çok 1');
    const r = sheet({ classId: 'rogue', level: 1, weaponMasteries: ['rapier', 'shortbow'] });
    expect(masterySwapLimit(r)).toBe(2);
    expect(masterySwapProblem(r, ['dagger', 'shortsword'])).toBeNull();
  });
  it('seçeneğe yalnızca seçilen ustalık yazılır; Nick Görev P1\'den beri çalışıyor', () => {
    const f = sheet({ classId: 'fighter', level: 1, weaponMasteries: ['longsword', 'dagger'] });
    const ls = weaponAttackOption(f, 'Longsword');
    // Kalkansız Longsword iki elle: Cleave'in değiştiricisiz hasarı da Versatile zarıyla (Görev P1).
    expect(ls).toMatchObject({ mastery: 'sap', abilityMod: 3, weaponDamage: '1d10', masteryDc: 13 });
    expect(masteryWorks('nick')).toBe(true);
    expect(weaponAttackOption(f, 'Dagger').mastery).toBe('nick');
    expect(weaponAttackOption(f, 'Greataxe').mastery).toBeUndefined();
  });
});

describe('ustalıklar savaşta', () => {
  it('Sap: isabette hedefin bir sonraki saldırısı dezavantajlı; kullanılınca kalkar', () => {
    let s = setup('Düz', { B: { attacks: [claw] } });
    s = attack(s, 'A', 'B', opt('sap'), ...HIT).state;
    expect(s.combatants.B?.marks).toEqual([{ kind: 'sap', by: 'A', end: 'turnStart', count: 1 }]);
    const r = monsterAttackEvents(s, s.combatants.B as Combatant, s.combatants.A as Combatant, 0, scripted([20, 18], [20, 3], [6, 2]));
    if (!r.ok) throw new Error(r.error);
    expect(types(r.events).slice(0, 2)).toEqual(['mastery_mark_used', 'attack_resolved']);
    expect(r.events[1]).toMatchObject({ mode: 'disadvantage', natural: 3 });
    expect(applyEvents(s, r.events).combatants.B?.marks).toEqual([]);
  });
  it('Sap: saldıranın sonraki turunun başında biter; ıskada yok', () => {
    let s = attack(setup(), 'A', 'B', opt('sap'), ...HIT).state;
    s = applyEvents(s, [{ type: 'turn_ended', actorId: 'B', nextActorId: 'A', round: 1 }]);
    expect(s.combatants.B?.marks).toEqual([]);
    expect(attack(setup(), 'A', 'B', opt('sap'), ...MISS).state.combatants.B?.marks).toBeUndefined();
  });
  it('Vex: hasarlı isabetten sonra aynı hedefe bir sonraki saldırı avantajlı', () => {
    let s = attack(setup(), 'A', 'B', opt('vex'), ...HIT).state;
    expect(s.combatants.A?.marks).toEqual([{ kind: 'vex', by: 'A', targetId: 'B', end: 'turnEnd', count: 1 }]);
    const r = attack(s, 'A', 'B', opt('vex'), [20, 4], [20, 16], [8, 5]);
    expect(types(r.events).slice(0, 2)).toEqual(['mastery_mark_used', 'attack_resolved']);
    expect(r.events[1]).toMatchObject({ mode: 'advantage', natural: 16, hit: true });
    // İkinci isabet yeni işaret koyar (eski kullanıldı).
    expect(r.state.combatants.A?.marks).toHaveLength(1);
    // Başka hedefe avantaj yok.
    s = applyEvents(setup(), [{ type: 'mastery_applied', actorId: 'A', targetId: 'C', mastery: 'vex', label: 'x',
      mark: { holderId: 'A', mark: { kind: 'vex', by: 'A', targetId: 'C', end: 'turnEnd', count: 1 } } }]);
    expect(attack(s, 'A', 'B', opt('vex'), ...MISS).events[0]).toMatchObject({ type: 'attack_resolved', mode: 'normal' });
  });
  it('Vex: kendi turunda konunca bir sonraki turunun sonuna dek sürer', () => {
    let s = advanceTo(setup(), 'A');
    s = attack(s, 'A', 'B', opt('vex'), ...HIT).state;
    expect(s.combatants.A?.marks?.[0]?.count).toBe(2);
    s = applyEvents(s, [{ type: 'turn_ended', actorId: 'A', nextActorId: 'C', round: 2 }]);
    expect(s.combatants.A?.marks?.[0]?.count).toBe(1);
    s = applyEvents(s, [{ type: 'turn_ended', actorId: 'A', nextActorId: 'C', round: 3 }]);
    expect(s.combatants.A?.marks).toEqual([]);
  });
  it('Slow: hasarlı isabette hız 10 ft azalır; üst üste binmez; ıskada yok', () => {
    let s = attack(setup(), 'A', 'B', opt('slow'), ...HIT).state;
    expect(speedHexes(s.combatants.B as Combatant)).toBe(4);
    s = attack(s, 'C', 'B', opt('slow'), ...HIT).state;
    expect(s.combatants.B?.marks).toHaveLength(2);
    expect(speedHexes(s.combatants.B as Combatant)).toBe(4);
    s = applyEvents(s, [{ type: 'turn_ended', actorId: 'B', nextActorId: 'A', round: 1 }]);
    expect(speedHexes(s.combatants.B as Combatant)).toBe(4);
    s = applyEvents(s, [{ type: 'turn_ended', actorId: 'A', nextActorId: 'C', round: 1 }]);
    expect(speedHexes(s.combatants.B as Combatant)).toBe(6);
    expect(attack(setup(), 'A', 'B', opt('slow'), ...MISS).state.combatants.B?.marks).toBeUndefined();
  });
  it('Topple: isabette CON save (DC 8 + değiştirici + yetkinlik); başarısızsa Prone', () => {
    const r = attack(setup(), 'A', 'B', opt('topple'), ...HIT, [20, 5]);
    expect(types(r.events)).toEqual(['attack_resolved', 'mastery_applied', 'condition_changed']);
    expect(r.events[1]).toMatchObject({ mastery: 'topple', save: { ability: 'con', dc: 13, total: 5, success: false } });
    expect(r.state.combatants.B?.conditions).toContain('Prone');
    const ok = attack(setup('Düz', { B: { saves: { ...zero, con: 4 } } }), 'A', 'B', opt('topple'), ...HIT, [20, 9]);
    expect(ok.events[1]).toMatchObject({ save: { total: 13, success: true } });
    expect(ok.state.combatants.B?.conditions).not.toContain('Prone');
    expect(types(attack(setup(), 'A', 'B', opt('topple'), ...MISS).events)).toEqual(['attack_resolved']);
  });
  it('Graze: ıskada yetenek değiştiricisi kadar hasar (direnç uygulanır); değiştirici 0 ise yok', () => {
    const r = attack(setup(), 'A', 'B', opt('graze'), ...MISS);
    expect(r.events[1]).toMatchObject({ type: 'mastery_applied', mastery: 'graze', damage: { raw: 3, applied: 3 }, hpAfter: 17 });
    expect(r.state.combatants.B?.hp).toBe(17);
    const res = attack(setup('Düz', { B: { resistances: ['slashing'] } }), 'A', 'B', opt('graze'), ...MISS);
    expect(res.state.combatants.B?.hp).toBe(19);
    expect(types(attack(setup(), 'A', 'B', opt('graze', { abilityMod: 0 }), ...MISS).events)).toEqual(['attack_resolved']);
    expect(types(attack(setup(), 'A', 'B', opt('graze'), ...HIT).events)).toEqual(['attack_resolved']);
  });
  it('Push: isabette 10 ft uzağa iter; Huge itilmez; yakın dövüşte eylemin son saldırısında', () => {
    const A = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 });
    const B = mk('B', { side: 'enemies', hp: 30, maxHp: 30 });
    const s = field([A, B], { A: o(5, 3), B: o(6, 3) });
    const r = attack(s, 'A', 'B', opt('push'), ...HIT);
    expect(types(r.events)).toEqual(['attack_resolved', 'mastery_applied', 'pushed', 'pushed']);
    expect(distance(r.state.combatants.B?.pos as Offset, o(5, 3))).toBe(3);
    const giant = { ...combatantFromMonster(getMonster('hill-giant'), { id: 'B' }), side: 'enemies' as const };
    expect(types(attack(field([A, giant], { A: o(5, 3), B: o(6, 3) }), 'A', 'B', opt('push'), [20, 20], [8, 5], [8, 5], [8, 5], [8, 5]).events))
      .toEqual(['attack_resolved']);
    // Extra Attack: ilk saldırıda itmez (ikinci saldırı boşa gitmesin), son saldırıda iter.
    const two = field([{ ...A, attacksPerAction: 2 }, B], { A: o(5, 3), B: o(6, 3) });
    expect(types(attack(two, 'A', 'B', opt('push'), ...HIT).events)).toEqual(['attack_resolved']);
    const last = { ...two, combatants: { ...two.combatants, A: { ...(two.combatants.A as Combatant), economy: { ...(two.combatants.A as Combatant).economy, action: true, attacksLeft: 1 } } } };
    expect(types(attack(last, 'A', 'B', opt('push'), ...HIT).events)).toContain('pushed');
  });
  it('Cleave: isabette ilk hedefin yanındaki ikinci düşmana ek saldırı (değiştiricisiz hasar), turda bir kez', () => {
    const A = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 });
    const B = mk('B', { side: 'enemies', hp: 30, maxHp: 30 });
    const D = mk('D', { side: 'enemies', hp: 12, maxHp: 12 });
    const s = field([A, B, D], { A: o(5, 3), B: o(6, 3), D: o(6, 4) });
    expect(distance(o(6, 4), o(6, 3))).toBe(1);
    const r = attack(s, 'A', 'B', opt('cleave'), ...HIT, [20, 15], [8, 6]);
    expect(types(r.events)).toEqual(['attack_resolved', 'mastery_applied', 'attack_resolved']);
    expect(r.events[1]).toMatchObject({ mastery: 'cleave', targetId: 'D' });
    expect(r.events[2]).toMatchObject({ targetId: 'D', label: 'Longsword (Cleave)', rawDamage: 6 });
    expect(r.state.combatants.D?.hp).toBe(6);
    // Aynı turda ikinci kez yok.
    expect(types(attack(r.state, 'A', 'B', opt('cleave'), ...HIT).events)).toEqual(['attack_resolved']);
    // Iskada yok.
    expect(types(attack(s, 'A', 'B', opt('cleave'), ...MISS).events)).toEqual(['attack_resolved']);
  });
});

describe('Fighting Style: Great Weapon Fighting', () => {
  const fighter = (p: Partial<CharacterSheet> = {}) => sheet({ classId: 'fighter', level: 1, advancements: [{ level: 1, featId: 'great-weapon-fighting' }], ...p });
  it('iki elle yakın dövüş silahında hasar zarındaki 1 ve 2, 3 sayılır', () => {
    const o = weaponAttackOption(fighter(), 'Greatsword');
    expect(o.minDie).toBe(3);
    const r = attack(setup('Düz', { B: { hp: 40, maxHp: 40 } }), 'A', 'B', o, [20, 18], [6, 1], [6, 2]);
    expect(r.events[0]).toMatchObject({ hit: true, damageRolls: [3, 3], rawDamage: 9 });
  });
  it('kalkansız Versatile silahta geçerli, kalkanla, menzilli silahta ve fırlatmada değil; feat yoksa yok', () => {
    expect(weaponAttackOption(fighter(), 'Longsword').minDie).toBe(3);
    expect(weaponAttackOption(fighter({ shield: true }), 'Longsword').minDie).toBeUndefined();
    expect(weaponAttackOption(fighter(), 'Longbow').minDie).toBeUndefined();
    expect(weaponAttackOption(fighter(), 'Rapier').minDie).toBeUndefined();
    expect(weaponAttackOption(sheet({ classId: 'fighter', level: 1 }), 'Greatsword').minDie).toBeUndefined();
  });
});

describe('yapay zekâ ustalığı kullanır', () => {
  it('eşit hasarlı iki silahtan ustalığı olanı seçer; Vex işaretli hedefe öncelik verir', async () => {
    const { chooseCommand } = await import('./ai');
    const plain: AttackOption = { ...sword, label: 'Düz kılıç' };
    const sap = opt('sap', { label: 'Sap kılıç' });
    let s = setup('Düz', { C: { weaponOptions: [plain, sap] }, B: { hp: 30, maxHp: 30 } });
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'attack', actorId: 'C', option: { label: 'Sap kılıç' } });
    // İki düşman: Vex işaretli olan öne geçer.
    s = setup('Düz', { C: { weaponOptions: [plain] } });
    const E = mk('E', { side: 'enemies' });
    s = { ...s, combatants: { ...s.combatants, E, C: { ...(s.combatants.C as Combatant), marks: [{ kind: 'vex', by: 'C', targetId: 'E', end: 'turnEnd', count: 1 }] } } };
    expect(chooseCommand(s)).toMatchObject({ type: 'attack', targetId: 'E' });
  });
});
