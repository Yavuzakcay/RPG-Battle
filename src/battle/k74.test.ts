/**
 * Kuyruk K74 (kural sürümü 75): (a) Truesight'ı bilmeyen beş motor yolu tek sorguya (`sight.ts` `hiddenFrom`) bağlı:
 * fırsat saldırısı görme, tepki görme (`reactions.ts` `sees`), Cleave/mastery ikinci hedef, Superior Hunter's Prey, ejderha
 * Algısı; sürüm 74'te eski sonuç. (b) Hallow koruma alanı tek koruma: yeni Charmed/Frightened alanda hiç tutmaz (sürüm 74'te
 * tutup bastırılır, alandan çıkınca geri gelir). Her yolun testi iki sürümde; replay denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { seededRng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { combatantFromMonster, combatantFromSheet, DRAGON_ID, startBattle } from './create';
import { execute, replay } from './index';
import { superiorPreyEvents } from './classTraits';
import { weaponAttackEvents } from './features';
import { GM, mk, P1, scripted, sword } from './fixtures';
import { hiddenFrom } from './sight';
import { applyEvents } from './reduce';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const claw = { name: 'Claw', bonus: 5, damageDice: '1d8+3', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
/** Truesight veren süren etki (True Seeing; testte 30 ft). */
const seeing = { effects: [{ id: 'ts', name: 'True Seeing', sourceId: 'x', until: 9999, truesight: 30 }] } as Partial<Combatant>;
const hid = { hidden: { dc: 30 } } as Partial<Combatant>;

/** Haritalı savaş (kale, düz zemin); sıra listedeki ilk savaşçıda. */
function field(parts: Combatant[], pos: Record<string, Offset>, kuralSurumu: number, turn = 0): BattleState {
  const { state } = startBattle('k74', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })),
    scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { kuralSurumu, map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...state, status: 'active', order: parts.map((c) => c.id), turnIndex: turn, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
function run(s: BattleState, cmd: Command, ctx: CommandContext = GM, rng = scripted()) {
  const r = execute(s, cmd, ctx, rng);
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const withC = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });

describe('K74 Truesight: tek sorgu hiddenFrom', () => {
  const s = (ver: number) => field([mk('A', { ...seeing }), mk('B', { side: 'enemies', ...hid }), mk('C', { side: 'enemies', ...hid })], { A: o(2, 3), B: o(6, 3), C: o(14, 3) }, ver);
  const get = (st: BattleState, id: string) => st.combatants[id] as Combatant;
  it('75: Truesight menzilindeki gizlenmiş saklanamaz; menzil dışı ve Truesight\'sız saklanır; 74: hep gizli', () => {
    const n = s(75), old = s(74);
    expect(hiddenFrom(n, get(n, 'A'), get(n, 'B'))).toBe(false);
    expect(hiddenFrom(n, get(n, 'A'), get(n, 'C'))).toBe(true); // 30 ft dışı
    expect(hiddenFrom(n, get(n, 'B'), get(n, 'A'))).toBe(false); // A gizli değil
    expect(hiddenFrom(old, get(old, 'A'), get(old, 'B'))).toBe(true);
    expect(hiddenFrom(undefined, get(n, 'A'), get(n, 'B'))).toBe(true);
  });
});

describe('K74 Truesight: yol 1, fırsat saldırısı', () => {
  const s = (ver: number, see: boolean) => field([mk('M', { ownerId: 'p1', hp: 40, maxHp: 40, ...hid }), mk('O', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw], ...(see ? seeing : {}) })], { M: o(5, 3), O: o(6, 3) }, ver);
  const oa = (st: BattleState) => run(st, { type: 'move', actorId: 'M', to: o(2, 3) }, P1, scripted([20, 15], [8, 6])).events.filter((e) => e.type === 'attack_resolved' && e.opportunity);
  it('gizlenmiş kaçan, Truesight\'lı düşmandan fırsat saldırısı yer (75); 74\'te ve Truesight\'sızda yemez', () => {
    expect(oa(s(75, true))).toHaveLength(1);
    expect(oa(s(74, true))).toHaveLength(0);
    expect(oa(s(75, false))).toHaveLength(0);
  });
});

describe('K74 Truesight: yol 2, tepki görme (Uncanny Dodge)', () => {
  const rogue = () => {
    const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...f } = combatantFromSheet({ name: 'X', raceId: 'human', classId: 'rogue', subclassId: 'thief', level: 5, armorName: 'Zırhsız', shield: false, itemNames: [],
      baseScores: { str: 14, dex: 15, con: 13, int: 14, wis: 12, cha: 14 }, weapons: [{ name: 'Shortsword' }] }, { id: 'x', ownerId: 'p1' });
    return mk('A', { ...f, ownerId: 'p1', hp: 30, maxHp: 30 });
  };
  const s = (ver: number, see: boolean) => field([mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], ...hid }), { ...rogue(), ...(see ? seeing : {}) }], { B: o(6, 3), A: o(5, 3) }, ver);
  const used = (st: BattleState) => run(st, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, scripted([20, 15], [20, 15], [8, 8], [8, 8], [8, 8]))
    .events.filter((e) => e.type === 'reaction_used').map((e) => (e as { name: string }).name);
  it('gizlenmiş saldıranı Truesight ile gören Rogue Uncanny Dodge kullanır (75); 74\'te göremez', () => {
    expect(used(s(75, true))).toEqual(['Uncanny Dodge']);
    expect(used(s(74, true))).toEqual([]);
    expect(used(s(75, false))).toEqual([]);
  });
});

describe('K74 Truesight: yol 3 ve 4, Cleave ve Superior Hunter\'s Prey', () => {
  const cleave: AttackOption = { ...sword, mastery: 'cleave', abilityMod: 3, weaponDamage: '1d8', masteryDc: 13 };
  const s = (ver: number, see: boolean) => field([mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, ...(see ? seeing : {}) }), mk('B', { side: 'enemies', hp: 30, maxHp: 30 }), mk('D', { side: 'enemies', hp: 12, maxHp: 12, ...hid })],
    { A: o(5, 3), B: o(6, 3), D: o(6, 4) }, ver);
  const second = (st: BattleState) => {
    const r = weaponAttackEvents(st, st.combatants.A as Combatant, st.combatants.B as Combatant, cleave, scripted([20, 15], [8, 5], [20, 15], [8, 6]));
    if (!r.ok) throw new Error(r.error);
    return r.events.filter((e) => e.type === 'mastery_applied').map((e) => (e as { targetId: string }).targetId);
  };
  it('Cleave ikinci hedefi gizlenmiş düşman olabilir: Truesight ile (75); 74\'te ve Truesight\'sızda olamaz', () => {
    expect(second(s(75, true))).toEqual(['D']);
    expect(second(s(74, true))).toEqual([]);
    expect(second(s(75, false))).toEqual([]);
  });
  const prey = (ver: number, see: boolean) => {
    const st = withC(s(ver, see), 'A', { traits: ['superior-hunters-prey'] });
    return superiorPreyEvents(st, st.combatants.A as Combatant, st.combatants.B as Combatant, { raw: 5, rolls: [5], type: 'force' }, scripted([20, 10])).map((e) => (e as { targetId: string }).targetId);
  };
  it('Superior Hunter\'s Prey: gizlenmiş yakın düşmana yalnız Truesight ile (75)', () => {
    expect(prey(75, true)).toEqual(['D']);
    expect(prey(74, true)).toEqual([]);
    expect(prey(75, false)).toEqual([]);
  });
});

describe('K74 Truesight: yol 5, ejderha Algısı', () => {
  /** Uyuyan ejderha (7,2) + A (gizlenmiş) + W; tur sonunda ejderhanın Algı zarı. */
  const arena = (ver: number, see: boolean) => {
    const parts = [mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, weaponOptions: [sword], speed: 30, ...hid }), mk('W', { side: 'enemies', hp: 30, maxHp: 30, speed: 40, attacks: [claw] })];
    const { state } = startBattle('d', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number]), [20, 1]), { kuralSurumu: ver, map: { id: 'volkan', variantId: 'uyuyan-ejderha' } });
    const combatants = { ...state.combatants };
    combatants[DRAGON_ID] = { ...(combatants[DRAGON_ID] as Combatant), pos: o(7, 2), ...(see ? seeing : {}) };
    combatants.A = { ...(combatants.A as Combatant), pos: o(3, 2) };
    combatants.W = { ...(combatants.W as Combatant), pos: o(12, 5) };
    const last = state.order.filter((id) => id !== DRAGON_ID).at(-1) as string;
    return { s: { ...state, status: 'active' as const, turnIndex: state.order.indexOf(last), combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat } }, last };
  };
  const perceives = (ver: number, see: boolean) => {
    const { s, last } = arena(ver, see);
    return run(s, { type: 'end_turn', actorId: last }, last === 'A' ? P1 : GM, scripted([20, 3])).events.some((e) => e.type === 'dragon_perception');
  };
  it('Truesight\'lı ejderha gizlenmiş karakter için de Algı atar (75); 74\'te ve Truesight\'sızda atmaz', () => {
    expect(perceives(75, true)).toBe(true);
    expect(perceives(74, true)).toBe(false);
    expect(perceives(75, false)).toBe(false);
  });
});

describe('K74 Hallow: tek, toplu koruma', () => {
  const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
  const ghost = (): Combatant => ({ ...combatantFromMonster(getMonster('ghost'), { id: 'G' }), side: 'enemies', ownerId: null });
  const host = () => mk('H', { ownerId: 'p1', hp: 40, maxHp: 40, ac: 17, speed: 25, saves: LOW });
  const POS = { G: o(5, 3), H: o(6, 3) };
  const zone = (): BattleEvent => {
    const hexes: Offset[] = [];
    for (let c = 4; c <= 8; c++) for (let r = 1; r <= 5; r++) hexes.push(o(c, r));
    return { type: 'zone_created', zone: { id: 'ward:hallow', spellId: 'hallow', name: 'Hallow', casterId: 'H', side: 'party', dc: 0, slotLevel: 5, hexes, center: POS.H, ward: { kind: 'hallow', types: ['undead'] } } as SpellZone };
  };
  const setup = (ver: number) => {
    const s = applyEvents(field([ghost(), host()], POS, ver), [zone()]);
    return s;
  };
  const visage = (s: BattleState) => {
    const idx = (s.combatants.G as Combatant).attacks.findIndex((a) => a.name === 'Horrific Visage');
    return run(s, { type: 'monster_attack', actorId: 'G', targetId: 'H', attackIndex: idx, aim: o(6, 3) } as Command, GM, seededRng(3));
  };
  it('Horrific Visage alandaki hedefe tutmaz (75); 74\'te tutup bastırılır ve alandan çıkınca geri gelir', () => {
    const n = visage(setup(75)).state.combatants.H as Combatant;
    expect(n.conditions).toEqual([]);
    expect(n.effects?.some((e) => e.suppressed) ?? false).toBe(false);
    expect(n.conditionTimers ?? []).toEqual([]);
    const old = visage(setup(74)).state.combatants.H as Combatant;
    expect(old.conditions).toEqual([]);
    expect(old.effects?.find((e) => e.suppressed)?.suppressed?.[0]).toMatchObject({ condition: 'Frightened' });
  });
  const apply = (s: BattleState, targetId: string, sourceId: string): BattleState => applyEvents(s, [{ type: 'condition_changed', targetId, condition: 'Frightened', present: true, reason: 'test', sourceId }]);
  it('doğrudan durum olayı: seçilen türden alanda tutmaz; başka türden ya da alan dışında tutar; 74\'te tutar', () => {
    const k = mk('K', { side: 'enemies', hp: 9, maxHp: 9 });
    const base = (ver: number) => applyEvents(field([ghost(), host(), k], { ...POS, K: o(1, 1) }, ver), [zone()]);
    expect(apply(base(75), 'H', 'G').combatants.H?.conditions).toEqual([]);
    expect(apply(base(74), 'H', 'G').combatants.H?.conditions).toEqual(['Frightened']);
    expect(apply(base(75), 'H', 'K').combatants.H?.conditions).toEqual(['Frightened']);
    const out = withC(base(75), 'H', { pos: o(12, 3) });
    expect(apply(out, 'H', 'G').combatants.H?.conditions).toEqual(['Frightened']);
    expect(apply(base(75), 'H', 'G').combatants.H?.conditionTimers ?? []).toEqual([]);
  });
});

describe('K74 sinkMud: gerçek bedel (sürüm 76)', () => {
  const high = () => 0.99; // d20 = 20; Atletizm −10 → 10 = DC 10: başarılı
  const low = () => 0.01; // d20 = 1: başarısız
  const mud = (ver: number, a: Partial<Combatant> = {}): BattleState => {
    const parts = [mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, heavyArmor: true, skills: { athletics: -10 }, ...a }), mk('B', { side: 'enemies', hp: 60, maxHp: 60 })];
    const st = startBattle('k74', 'dag', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'batak-kamp' } }).state;
    const combatants = { ...st.combatants, A: { ...(st.combatants.A as Combatant), pos: o(1, 3) }, B: { ...(st.combatants.B as Combatant), pos: o(15, 1) } };
    return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants } as BattleState;
  };
  const step = (s: BattleState, rng: () => number) => run(s, { type: 'move', actorId: 'A', to: o(1, 4) }, P1, rng as never);
  const sunk = (s: BattleState) => (s.combatants.A as Combatant).effects?.find((e) => e.id.startsWith('sinkMud'));
  it('(1,4) çamur (n): başarısız Atletizm (76) Restrained verir, hız 0; kurtulma DC kuralda', () => {
    const r = step(mud(76), low);
    expect(r.events.find((e) => e.type === 'map_effect' && e.rule === 'sinkMud')).toMatchObject({ roll: { success: false }, stopMovement: true });
    expect(sunk(r.state)).toMatchObject({ grants: ['Restrained'], escapeCheck: { dc: 10, skill: 'athletics' } });
    expect((r.state.combatants.A as Combatant).conditions).toContain('Restrained');
  });
  it('başarılı Atletizm: bedel yok (yalnız zorlu zemin)', () => {
    const r = step(mud(76), high);
    expect(r.events.find((e) => e.type === 'map_effect' && e.rule === 'sinkMud')).toMatchObject({ roll: { success: true } });
    expect(sunk(r.state)).toBeUndefined();
    expect((r.state.combatants.A as Combatant).conditions).not.toContain('Restrained');
  });
  it('75: eski davranış (başarısızsa yalnız yürüyüş biter, durum yok); hafif zırhlı 76\'da da etkilenmez', () => {
    const old = step(mud(75), low);
    expect(old.events.find((e) => e.type === 'map_effect' && e.rule === 'sinkMud')).toMatchObject({ roll: { success: false }, stopMovement: true });
    expect(sunk(old.state)).toBeUndefined();
    expect((old.state.combatants.A as Combatant).conditions).not.toContain('Restrained');
    expect(sunk(step(mud(76, { heavyArmor: false }), low).state)).toBeUndefined();
  });
  it('Game Master `escapeDc` parametresi; batan yaratık `escape` komutuyla (Atletizm) kurtulur', () => {
    const s = mud(76);
    const custom = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), ruleParams: { sinkMud: { escapeDc: 15 } } } } as BattleState;
    expect(sunk(step(custom, low).state)?.escapeCheck?.dc).toBe(15);
    const stuck = step(s, low).state;
    const freed = run({ ...stuck, combatants: { ...stuck.combatants, A: { ...(stuck.combatants.A as Combatant), economy: { ...(stuck.combatants.A as Combatant).economy, action: false } } } }, { type: 'escape', actorId: 'A' } as Command, P1, high as never);
    expect(sunk(freed.state)).toBeUndefined();
    expect((freed.state.combatants.A as Combatant).conditions).not.toContain('Restrained');
  });
});
