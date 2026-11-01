/**
 * Kuyruk 29 K28b: Buzul, Dağ ve Bataklık mekanikleri. Her mekanik: tetiklenir; Game Master kapatınca ya da eski savaşta
 * (kural sürümü 7) çalışmaz. Replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { litHexes, ruleOf } from './maprules';
import { weatherAttack, weatherOf, wildsEnterEvents, wildsRoundEvents, wildsTurnEndEvents, wildsTurnStartEvents, snowMoveCost } from './wilds';
import { AXIAL_DIRECTIONS, addAxial, axialToOffset, directionTo, offsetToAxial, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
const bow: AttackOption = { ...club, label: 'Yay', ranged: true, range: [600, 600] };

interface Opt { variant?: string; v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number | string>>; a?: Partial<Combatant>; b?: Partial<Combatant> }
function battle(mapId: string, pos: Record<string, Offset>, opt: Opt = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, saves: LOW, skills: { history: 10, athletics: -10 }, weaponOptions: [club, bow], ...opt.a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, saves: LOW, ...opt.b }),
  ];
  const st = startBattle('k28b', 'dag', parts, () => 0.5, {
    map: { id: mapId, ...(opt.variant ? { variantId: opt.variant } : {}), ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) },
    ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = high, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const tile = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col];
const objIn = (s: BattleState, id: string) => s.map?.objects?.find((x) => x.id === id);
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);
const effects = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'map_effect');

describe('Ortak: kar yağışı ve sis', () => {
  it('orta kar (Açık Buzul): 6 altıgenden uzak hedef seçilmez, 3 üstü menzilli dezavantajlı; taş dibi korur', () => {
    const s = battle('buzul-acik', { A: o(2, 6), B: o(10, 6) });
    expect(weatherAttack(s, C(s, 'A'), C(s, 'B'), true).fail).toMatch(/Kar yağışı/);
    const near = battle('buzul-acik', { A: o(2, 6), B: o(6, 7) });
    expect(weatherAttack(near, C(near, 'A'), C(near, 'B'), true).sources).toHaveLength(1);
    const shelter = battle('buzul-acik', { A: o(3, 6), B: o(7, 7) });
    expect(weatherAttack(shelter, C(shelter, 'A'), C(shelter, 'B'), true).sources).toHaveLength(0);
  });
  it('şiddetli kar açık karı zorlu yapar; Game Master şiddeti 0 yapınca ya da kapatınca etkisiz; eski savaşta yok', () => {
    expect(snowMoveCost(battle('buzul-acik', {}, { params: { snowfall: { severity: 3 } } }), o(12, 5))).toBe(2);
    expect(snowMoveCost(battle('buzul-acik', {}), o(12, 5))).toBe(1);
    expect(weatherOf(battle('buzul-acik', {}, { params: { snowfall: { severity: 0 } } }))).toBeNull();
    expect(weatherOf(battle('buzul-acik', {}, { toggles: { snowfall: false } }))).toBeNull();
    expect(weatherOf(battle('buzul-acik', {}, { v: 7 }))).toBeNull();
  });
  it('sis: Batık Çukur gecesi 4 altıgen; Dağ gündüz sissiz, gece sisli', () => {
    expect(weatherOf(battle('batak-cukur', {}, { variant: 'gece' }))?.sight).toBe(4);
    expect(weatherOf(battle('dag-karakol', {}))).toBeNull();
    expect(weatherOf(battle('dag-karakol', {}, { variant: 'gece' }))?.label).toBe('Sis');
  });
  it('sis menzilli saldırıyı gerçek komutta engeller', () => {
    const s = battle('batak-cukur', { A: o(0, 0), B: o(10, 0) }, { variant: 'gece' });
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, high);
    expect(r.ok ? '' : r.error).toMatch(/Sis/);
    const off = battle('batak-cukur', { A: o(0, 0), B: o(10, 0) }, { variant: 'gece', toggles: { fog: false } });
    expect(execute(off, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, high).ok).toBe(true);
  });
});

describe('Buzul', () => {
  it('ince buz: ağır zırhlı yarık kenarında DEX save; başarısız soğuk hasar + Prone, yürüyüş biter', () => {
    const s = battle('buzul-acik', { A: o(8, 2) }, { a: { heavyArmor: true } });
    const r = wildsEnterEvents(s, C(s, 'A'), o(8, 2), low);
    expect(r.stop).toBe(true);
    const after = applyEvents(s, r.events);
    expect(C(after, 'A').conditions).toContain('Prone');
    expect(C(after, 'A').hp).toBeLessThan(60);
    const plain = battle('buzul-acik', { A: o(8, 2) });
    expect(wildsEnterEvents(plain, C(plain, 'A'), o(8, 2), low).events).toHaveLength(0);
    const off = battle('buzul-acik', { A: o(8, 2) }, { a: { heavyArmor: true }, toggles: { thinIce: false } });
    expect(wildsEnterEvents(off, C(off, 'A'), o(8, 2), low).events).toHaveLength(0);
  });
  it('çığ: Game Master tetikler, 2 tur sonra yamaç eteğindekiler DEX save; replay aynı', () => {
    const s0 = battle('buzul-kamp', { A: o(2, 4), B: o(12, 4) });
    const r = run(s0, { type: 'map_trigger', rule: 'avalanche' }, high, GM);
    expect(r.state.map?.avalancheRound).toBe(s0.round + 2);
    replays(s0, r);
    expect(wildsRoundEvents({ ...r.state, round: s0.round + 1 }, low).some((e) => e.type === 'map_effect')).toBe(false);
    const evs = wildsRoundEvents({ ...r.state, round: s0.round + 2 }, low);
    const hit = effects(evs);
    expect(hit).toHaveLength(1);
    const after = applyEvents({ ...r.state, round: s0.round + 2 }, evs);
    expect(C(after, 'A').conditions).toContain('Prone');
    expect(after.map?.avalancheRound).toBe(0);
    expect(execute(battle('buzul-kamp', {}, { toggles: { avalanche: false } }), { type: 'map_trigger', rule: 'avalanche' }, GM, high).ok).toBe(false);
  });
  it('mühür: yıkılınca hazine notu; pusu içeriğinde buz mefitleri çıkar', () => {
    const s0 = battle('buzul-kayalik', { A: o(13, 3), B: o(2, 9) });
    const r = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'muhur', option: club });
    expect(objIn(r.state, 'muhur')).toBeUndefined();
    expect(r.events.some((e) => e.type === 'map_note' && /hazine/.test(e.text))).toBe(true);
    const amb = battle('buzul-kayalik', { A: o(13, 3), B: o(2, 9) }, { params: { iceSeal: { content: 1 } } });
    const r2 = run(amb, { type: 'attack_object', actorId: 'A', objectId: 'muhur', option: club });
    expect(r2.events.filter((e) => e.type === 'summoned')).toHaveLength(2);
    replays(amb, r2);
  });
  it('mangal ışığı: söndürülen mangalın çevresi karanlığa döner; çatlak duvar yıkılınca geçit açılır', () => {
    const s0 = battle('buzul-tapinak', { A: o(8, 4), B: o(2, 9) }, { variant: 'gece' });
    expect(litHexes(s0).has('8,5')).toBe(true);
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'mangal4', action: 'douse' });
    expect(litHexes(r.state).has('8,5')).toBe(false);
    expect(execute(battle('buzul-tapinak', { A: o(8, 4) }, { variant: 'gece', toggles: { brazierLight: false } }),
      { type: 'object_use', actorId: 'A', objectId: 'mangal4', action: 'douse' }, P1, high).ok).toBe(false);
    const w0 = battle('buzul-tapinak', { A: o(6, 4), B: o(2, 9) });
    const w = run(w0, { type: 'attack_object', actorId: 'A', objectId: 'duvar1', option: club });
    expect(objIn(w.state, 'duvar1')).toBeUndefined();
    expect(tile(w.state, o(6, 5))).toBe('.');
  });
});

describe('Dağ', () => {
  it('köprüde rüzgâr: DEX save başarısızsa rüzgâr yönünde itilir (uçurum); kapalıyken yok', () => {
    const s = battle('dag-kopru', { A: o(10, 5), B: o(19, 2) });
    const evs = wildsTurnStartEvents(s, C(s, 'A'), low);
    const after = applyEvents(s, evs);
    expect(C(after, 'A').pos).not.toEqual(o(10, 5));
    expect(wildsTurnStartEvents(s, C(s, 'A'), high).filter((e) => e.type !== 'map_effect')).toHaveLength(0);
    const off = battle('dag-kopru', { A: o(10, 5) }, { toggles: { bridgeGust: false } });
    expect(wildsTurnStartEvents(off, C(off, 'A'), low)).toHaveLength(0);
  });
  it('köprü yıkılınca uçuruma döner', () => {
    const s0 = battle('dag-kopru', { A: o(9, 5), B: o(19, 2) });
    const r = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'kopru', option: club });
    expect(tile(r.state, o(11, 5))).toBe('u');
    expect(tile(r.state, o(14, 4))).toBe('u');
  });
  it('heykel bulmacası: History başarısıyla gizli kaya açılır; başarısız ya da kapalıyken açılmaz', () => {
    const s0 = battle('dag-nobetci', { A: o(6, 4), B: o(18, 8) });
    expect(tile(s0, o(4, 7))).toBe('r');
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'plaka', action: 'read' });
    expect(tile(r.state, o(4, 7))).toBe('.');
    expect(objIn(r.state, 'plaka')?.state).toBe('read');
    replays(s0, r);
    const fail = battle('dag-nobetci', { A: o(6, 4) }, { a: { skills: { history: -10 } } });
    expect(tile(run(fail, { type: 'object_use', actorId: 'A', objectId: 'plaka', action: 'read' }, low).state, o(4, 7))).toBe('r');
    expect(execute(battle('dag-nobetci', { A: o(6, 4) }, { toggles: { sentinelPuzzle: false } }),
      { type: 'object_use', actorId: 'A', objectId: 'plaka', action: 'read' }, P1, high).ok).toBe(false);
  });
  it('gece heykelin gözü: yakındaki parti üyesi WIS save, başarısızsa Frightened; gündüz yok', () => {
    const s = battle('dag-nobetci', { A: o(2, 2) }, { variant: 'gece' });
    const evs = wildsTurnStartEvents(s, C(s, 'A'), low);
    expect(evs.some((e) => e.type === 'effect_added')).toBe(true);
    const day = battle('dag-nobetci', { A: o(2, 2) });
    expect(wildsTurnStartEvents(day, C(day, 'A'), low)).toHaveLength(0);
  });
  it('kaya yuvarlama: yığının ardındaki hatta DEX save, 3d6; yığın kalkar', () => {
    const pile = o(14, 2); const actor = o(13, 2);
    const dir = directionTo(actor, pile) as number;
    const target = axialToOffset(addAxial(offsetToAxial(pile), AXIAL_DIRECTIONS[dir]!));
    const s0 = battle('dag-kayalik', { A: actor, B: target });
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'kaya1', action: 'roll' }, low);
    expect(objIn(r.state, 'kaya1')).toBeUndefined();
    expect(C(r.state, 'B').hp).toBeLessThan(60);
    replays(s0, r);
    expect(execute(battle('dag-kayalik', { A: actor, B: target }, { toggles: { rockRoll: false } }),
      { type: 'object_use', actorId: 'A', objectId: 'kaya1', action: 'roll' }, P1, low).ok).toBe(false);
  });
  it('kapı kolu: Geçit Karakolu kapısı nesne olarak kapalı başlar', () => {
    expect(objIn(battle('dag-karakol', {}), 'kapi')?.state).toBe('closed');
  });
});

describe('Bataklık', () => {
  it('batıran çamur: ağır zırhlı Atletizm başarısızsa yürüyüş biter; hafif zırhlı etkilenmez', () => {
    const s = battle('batak-kamp', { A: o(1, 4) }, { a: { heavyArmor: true } });
    expect(wildsEnterEvents(s, C(s, 'A'), o(1, 4), low).stop).toBe(true);
    const light = battle('batak-kamp', { A: o(1, 4) });
    expect(wildsEnterEvents(light, C(light, 'A'), o(1, 4), low).events).toHaveLength(0);
  });
  it('cadı kazanı: her tur çevresinde zehirli buhar; söndürülünce buhar biter, cadı bir tur dezavantajlı', () => {
    const s0 = battle('batak-kamp', { A: o(17, 4), B: o(12, 2) }, { b: { monsterId: 'green-hag' } });
    expect(wildsRoundEvents(s0, high).some((e) => e.type === 'zone_created')).toBe(true);
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'kazan', action: 'douse' });
    expect(C(r.state, 'B').effects?.some((e) => e.id === 'kazan-sondu')).toBe(true);
    expect(wildsRoundEvents(r.state, high).some((e) => e.type === 'zone_created')).toBe(false);
    replays(s0, r);
    expect(wildsRoundEvents(battle('batak-kamp', {}, { toggles: { witchCauldron: false } }), high)).toHaveLength(0);
  });
  it('sülük suyu: sığ suda tur sonu CON save, başarısızsa hasar', () => {
    const s = battle('batak-adalar', { A: o(5, 4) });
    const evs = wildsTurnEndEvents(s, C(s, 'A'), low);
    expect(C(applyEvents(s, evs), 'A').hp).toBeLessThan(60);
    expect(wildsTurnEndEvents(s, { ...C(s, 'A'), pos: o(4, 5) }, low)).toHaveLength(0);
  });
  it('kütük köprü yıkılınca suya döner', () => {
    const s0 = battle('batak-adalar', { A: o(3, 5), B: o(19, 5) });
    const r = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'kutuk1', option: club });
    expect(tile(r.state, o(4, 5))).toBe('w');
    expect(tile(r.state, o(17, 5))).toBe('p');
  });
  it('zehirli gaz: her 3 turda bir çukurda bulut; kapalıyken yok', () => {
    const s = battle('batak-cukur', {});
    expect(wildsRoundEvents({ ...s, round: 4 }, high).some((e) => e.type === 'zone_created')).toBe(true);
    expect(wildsRoundEvents({ ...s, round: 3 }, high)).toHaveLength(0);
    expect(wildsRoundEvents({ ...battle('batak-cukur', {}, { toggles: { pitGas: false } }), round: 4 }, high)).toHaveLength(0);
  });
  it('Batık Kale: kemik yığınları ve canlanma kuralı', () => {
    const s = battle('batak-kale', {});
    expect(ruleOf(s, 'boneRise')).toBeTruthy();
    expect(s.map?.objects?.filter((x) => x.kind === 'bonePile')).toHaveLength(3);
  });
  it('eski savaşta (kural sürümü 7) K28b kuralları yok', () => {
    const s = battle('batak-kamp', {}, { v: 7 });
    for (const id of ['fog', 'sinkMud', 'witchCauldron']) expect(ruleOf(s, id)).toBeUndefined();
  });
});
