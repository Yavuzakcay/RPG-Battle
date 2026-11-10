/**
 * Kuyruk K73f (kural sürümü 66): su ve atlama kalanları. Görev 1 batık/yer altındaki atlamada varış hücresi; Görev 2 yüzme hızı
 * olan 17 canavar yüzücü listesinde; Görev 3 Call Lightning fırtına devralma (64'ten beri; 66'da aynı); Görev 4 YZ yer altında
 * uzaklaşma. 65'te eski davranış.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { replay } from './reduce';
import { chooseCommand } from './ai';
import { setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import { hasSwimSpeed } from './deepWater';
import { breathesWater } from './underwaterCore';
import data from '../../data/derin-su.json';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = (ch = '.') => Array.from({ length: 7 }, () => ch.repeat(15));
const lake = () => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 7 ? 'w' : '.')).join(''));
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, ver = 66, tiles = open(), turn?: string, mapId = 'col', variantId = 'gunduz'): BattleState {
  const s = startBattle('k73f', 'l-kavurucu-s-cak', parts, () => 0.5, { kuralSurumu: ver, map: { id: mapId, variantId, ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}), ...(alt && alt < 0 && (combatants[id] as Combatant).burrowFt ? { burrowed: true as const } : {}) };
  const order = parts.map((c) => c.id);
  return { ...s, status: 'active', order, turnIndex: turn ? order.indexOf(turn) : 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles, objects: [] } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const bow: AttackOption = { label: 'Longbow', attackBonus: 6, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, range: [150, 600], tag: 'longbow' };
const mace: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, strScore: 16, weaponOptions: [mace], hp: 30, maxHp: 30, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { ownerId: 'p1', speed: 30, weaponOptions: [mace], hp: 30, maxHp: 30, ...p });
const DIG = (p: Partial<Combatant> = {}) => mk('D', { side: 'enemies', speed: 30, burrowFt: 30, strScore: 16, attacks: BITE, hp: 30, maxHp: 30, ...p });
const SHARK = (p: Partial<Combatant> = {}) => mk('S', { side: 'enemies', monsterId: 'reef-shark', speed: 30, attacks: BITE, hp: 30, maxHp: 30, ...p });
const GM = { playerId: 'gm', isGm: true };
const of = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const run = (s: BattleState, cmd: Command, ctx = P1, rng: Rng = () => 0.5) => execute(s, cmd, ctx, rng);
const ok = (r: ReturnType<typeof execute>): BattleState => { if (!r.ok) throw new Error(r.error); return r.state; };
const jump = (to: Offset, id = 'A'): Command => ({ type: 'jump', actorId: id, to });
const up: Command = { type: 'vertical_move', actorId: 'A', toFt: 0 };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('K73f Görev 1: batık ve yer altındaki atlamada varış hücresi', () => {
  // Satır 0–2 kara, 3–6 derin su; atlama sütun boyunca (düz hat).
  const sea = () => Array.from({ length: 7 }, (_, r) => (r >= 3 ? 'w' : '.').repeat(15));
  const C = (row: number, col = 9): Offset => ({ col, row });
  const water = (ver: number, s: [Offset, number?] = [C(3), -5]) => field([A(), SHARK()], { A: [C(5), -5], S: s }, ver, sea());
  it('batık atlayan, aynı −5 ft hücredeki düşmanın üstüne inemez (66); 65\'te eski davranış (iniyordu)', () => {
    expect(run(water(66), jump(C(3)))).toMatchObject({ ok: false, error: expect.stringContaining('hücresi dolu (S, -5 ft)') });
    const old = run(water(65), jump(C(3)));
    expect(old.ok && [of(old.state, 'A').pos, of(old.state, 'S').pos]).toEqual([C(3), C(3)]);
  });
  it('boş batık hücreye atlama çalışır; batıkken karaya atlanmaz', () => {
    const r = run(water(66, [C(6, 12), -5]), jump(C(3)));
    expect(r.ok && [of(r.state, 'A').pos, of(r.state, 'A').altitudeFt]).toEqual([C(3), -5]);
    const land = field([A(), SHARK()], { A: [C(3), -5], S: [C(6, 12), -5] }, 66, sea());
    expect(run(land, jump(C(1)))).toMatchObject({ ok: false, error: expect.stringContaining('Batıkken yalnız derin suya atlanır') });
  });
  it('yüzeydeki atlayan batık düşmanın üstüne (ayrı katman) iner; yüzeydeki doluluk denetimi aynen', () => {
    expect(run(field([A(), SHARK()], { A: [C(5)], S: [C(3), -5] }, 66, sea()), jump(C(3))).ok).toBe(true);
    expect(run(field([A(), SHARK(), B()], { A: [C(5)], S: [C(6, 12), -5], B: [C(3)] }, 66, sea()), jump(C(3))))
      .toMatchObject({ ok: false, error: expect.stringContaining('dolu (B)') });
  });
  it('yüzeye çıkış engelli hücreye inen boğulmaz: komşu su altıgenine yüzüp çıkar', () => {
    // A (su soluyamaz) batık; varışın yüzeyinde dost B var: −5 ft boş → atlama geçerli; orada yüzeye çıkış ayrı denetlenir (dolu).
    let s = field([A(), SHARK(), B()], { A: [C(5), -5], S: [C(6, 12), -5], B: [C(3)] }, 66, sea());
    s = ok(run(s, jump(C(3))));
    expect(run(s, up)).toMatchObject({ ok: false });
    s = ok(run(s, { type: 'move', actorId: 'A', to: C(4) }));
    // Sonraki tur (hareket yenilenir): komşu altıgende yüzeye çıkar.
    s = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), movementUsed: 0 } } };
    s = ok(run(s, up));
    expect([of(s, 'A').altitudeFt ?? 0, of(s, 'A').mapStatus.suffocation ?? 0]).toEqual([0, 0]);
  });
  it('yer altındaki kazıcı dolu hücreye (aynı −5 ft) atlayamaz; kazılamayan zemine atlayamaz', () => {
    const E = mk('E', { side: 'enemies', burrowFt: 30, attacks: BITE, hp: 30, maxHp: 30 });
    const s = field([B(), DIG(), E], { B: [H(1, 1)], D: [C(1, 5), -5], E: [C(3, 5), -5] }, 66, open(), 'D');
    expect(run(s, jump(C(3, 5), 'D'), GM)).toMatchObject({ ok: false, error: expect.stringContaining('hücresi dolu (E, -5 ft)') });
    const rock = open().map((row, r) => (r === 3 ? row.slice(0, 5) + 't' + row.slice(6) : row));
    const t = field([B(), DIG(), E], { B: [H(1, 1)], D: [C(1, 5), -5], E: [C(6, 12), -5] }, 66, rock, 'D');
    expect(run(t, jump(C(3, 5), 'D'), GM)).toMatchObject({ ok: false, error: expect.stringContaining('kazılabilir zemine') });
  });
  it('65 replay\'i değişmez (batık atlama eski kuralla aynı durumu verir)', () => {
    let s = water(65);
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    const r = run(s, jump(C(3)));
    s = ok(r);
    if (r.ok) events.push(...r.events);
    const back = replay(events);
    expect([JSON.stringify(back.combatants), back.kuralSurumu]).toEqual([JSON.stringify(s.combatants), 65]);
  });
});

describe('K73f Görev 2: yüzme hızı olan 17 canavar', () => {
  const ADDED = data.swimmers66;
  it('liste 17; ilk listeyle kesişmez', () => {
    expect(ADDED.length).toBe(17);
    expect(ADDED.filter((x) => data.swimmers.includes(x))).toEqual([]);
  });
  it('66\'da yüzücü, 65\'te değil', () => {
    const bear = mk('P', { monsterId: 'polar-bear' });
    expect(hasSwimSpeed(bear, { kuralSurumu: 66, map: undefined } as never)).toBe(true);
    expect(hasSwimSpeed(bear, { kuralSurumu: 65, map: undefined } as never)).toBe(false);
    expect(hasSwimSpeed(bear)).toBe(false);
  });
  it('YZ: menzilli tehditte kara ayı dalar (66); 65\'te dalmaz (hız notu Climb ile başlıyor: srdK19 yüzme özelliği vermez); nefes sınırının yarısında çıkar', () => {
    const bear = (p: Partial<Combatant> = {}) => mk('P', { side: 'enemies', monsterId: 'black-bear', speed: 40, attacks: BITE, hp: 40, maxHp: 40, ...p });
    const s = (ver: number) => field([A({ weaponOptions: [bow] }), bear()], { A: [H(3)], P: [H(10)] }, ver, lake(), 'P');
    expect(chooseCommand(s(66))).toEqual({ type: 'vertical_move', actorId: 'P', toFt: -5 });
    expect(chooseCommand(s(65))).not.toEqual({ type: 'vertical_move', actorId: 'P', toFt: -5 });
    expect(breathesWater(bear())).toBe(false);
    const sub = field([A({ weaponOptions: [bow] }), bear({ mapStatus: { ...mk('x').mapStatus, breath: 5 } })], { A: [H(3)], P: [H(10), -5] }, 66, lake(), 'P');
    expect(chooseCommand(sub)).toEqual({ type: 'vertical_move', actorId: 'P', toFt: 0 });
  });
  it('su soluyanlar (Amphibious, Water Breathing, Hold Breath) nefes tutmaz', () => {
    for (const id of ['merfolk-skirmisher', 'kraken', 'seahorse', 'green-hag', 'archelon', 'chuul', 'hydra']) expect(breathesWater(mk('x', { monsterId: id }))).toBe(true);
  });
});

describe('K73f Görev 3: Call Lightning fırtına devralma (SRD 5.2.1; 64\'ten beri)', () => {
  const MAGE = () => mk('A', { ownerId: 'p1', spellNames: ['Call Lightning'], spellSlots: [0, 4, 3, 3, 3, 2, 1, 1, 1, 1] as never, spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'druid', hp: 200, maxHp: 200 });
  const FOE = () => mk('F', { side: 'enemies', hp: 200, maxHp: 200 });
  const cl: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Call Lightning', targetHex: H(5) } as Command;
  const cast = (variantId: string, ver = 66) => {
    const s = field([MAGE(), FOE()], { A: [H(0)], F: [H(5)] }, ver, open(), 'A', 'ada', variantId);
    const r = run(s, cl, P1, () => 0.9);
    if (!r.ok) throw new Error(r.error);
    const dice = (r.events.find((e) => e.type === 'spell_cast' && (e as { area?: unknown }).area) as { area: { dice: string } }).area.dice;
    const z = r.state.map?.zones?.find((x) => x.spellId === 'call-lightning');
    return { dice, storm: z?.cloud?.storm, until: z?.until, conc: of(r.state, 'A').concentration };
  };
  it('fırtınada mevcut fırtına devralınır, hasar +1d10 (4d10); fırtınasız yeni bulut, 3d10', () => {
    expect([cast('firtina').dice, cast('firtina').storm]).toEqual(['4d10', { kind: 'map' }]);
    const calm = cast('gunduz');
    expect([calm.dice, calm.storm]).toEqual(['3d10', undefined]);
  });
  it('süre ve konsantrasyon değişmez (fırtına/fırtınasız, 65/66 aynı)', () => {
    const a = cast('firtina');
    const b = cast('gunduz');
    expect(a.until).toEqual(b.until);
    expect(a.conc?.spell).toBe('Call Lightning');
    expect(b.conc?.spell).toBe('Call Lightning');
    expect(cast('firtina', 65)).toEqual(a);
  });
});

describe('K73f Görev 4: YZ yer altında uzaklaşma', () => {
  // D canı düşük (4/30 ≤ %15, `k73f.kacisCan`), A bitişikte; kimse yer altını sezemiyor.
  const scene = (ver: number) => field([A(), DIG({ hp: 4, speed: 30, burrowFt: 20 })], { A: [H(3)], D: [H(4)] }, ver, open(), 'D');
  /** D'nin bir turu: YZ komutları bitene dek (en çok 12). */
  function turn(s0: BattleState): { s: BattleState; cmds: Command[] } {
    let s = s0;
    const cmds: Command[] = [];
    for (let i = 0; i < 12; i++) {
      const c = chooseCommand(s);
      if (!c || c.type === 'end_turn') break;
      const r = run(s, c, GM);
      if (!r.ok) break;
      cmds.push(c);
      s = r.state;
    }
    return { s, cmds };
  }
  const vm = (cmds: Command[]) => cmds.filter((c) => c.type === 'vertical_move').map((c) => (c as { toFt: number }).toFt);
  it('66: kaçışta kazar ve yer altında uzaklaşır, o tur çıkmaz; 65\'te aynı tur çıkıyordu (salınım)', () => {
    const t66 = turn(scene(66));
    expect(vm(t66.cmds)).toEqual([-5]);
    expect(t66.cmds.some((c) => c.type === 'move')).toBe(true);
    expect(of(t66.s, 'D').burrowed).toBe(true);
    expect(distance(of(t66.s, 'D').pos as Offset, H(3))).toBeGreaterThan(1);
    expect(vm(turn(scene(65)).cmds)).toEqual([-5, 0]);
  });
  it('sonraki tur başında yer altındaysa çıkar (kovalanırken sonsuz kaçış yok); aynı tur yeniden kazmaz', () => {
    const t1 = turn(scene(66)).s;
    const next = { ...t1, combatants: { ...t1.combatants, D: { ...of(t1, 'D'), movementUsed: 0, economy: { ...of(t1, 'D').economy, action: false, bonus: false } } } };
    const t2 = turn(next);
    expect(vm(t2.cmds)).toEqual([0]);
    expect(of(t2.s, 'D').burrowed).toBeFalsy();
  });
  it('salınım: 6 tur boyunca her tur en çok bir kazma ya da bir çıkış; kaz-çık aynı turda yok', () => {
    let s = scene(66);
    for (let k = 0; k < 6; k++) {
      const t = turn(s);
      const v = vm(t.cmds);
      expect(v.length).toBeLessThanOrEqual(1);
      s = { ...t.s, combatants: { ...t.s.combatants, D: { ...of(t.s, 'D'), movementUsed: 0, economy: { ...of(t.s, 'D').economy, action: false, bonus: false } } } };
    }
  });
  it('66: canı %15–%50 arasında kaçış kazması yok (65\'te kazıp aynı tur çıkıyordu)', () => {
    const mid = (ver: number) => field([A(), DIG({ hp: 10, burrowFt: 20 })], { A: [H(3)], D: [H(4)] }, ver, open(), 'D');
    expect(chooseCommand(mid(65))).toEqual({ type: 'vertical_move', actorId: 'D', toFt: -5 });
    expect(chooseCommand(mid(66))).not.toMatchObject({ type: 'vertical_move' });
  });
  it('tremorsense\'li düşman varken kaçış kipi yok (65 ile aynı karar)', () => {
    const s = (ver: number) => field([A({ senses: { tremorsense: 30 } }), DIG({ hp: 4, burrowFt: 20 })], { A: [H(3)], D: [H(4)] }, ver, open(), 'D');
    expect(chooseCommand(s(66))).toEqual(chooseCommand(s(65)));
  });
});
