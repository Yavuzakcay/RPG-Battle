/**
 * Görev K26: Buzul ve Dağ eklemeleri (kural sürümü 12). Her mekanik: tetiklenir; Game Master kapatınca ya da eski savaşta
 * (sürüm 11) çalışmaz; replay aynı. Sim duman testi: kurallar açık ve kapalıyken 8 haritada savaş çökmeden biter.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { FRESH_ECONOMY } from './types';
import { applyEvents, replay } from './reduce';
import { wildsEnterEvents, wildsRoundEvents } from './wilds';
import { ballistaTarget, highlandsRoundEvents, K26_RULES } from './highlands';
import { setDefaultRuleToggles } from './ruleControl';
import { SCENARIOS, simulate } from '../sim/balance';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
const torch: AttackOption = { ...club, label: 'Meşale', damage: '1d2+10', damageType: 'fire' };

interface Opt { variant?: string; v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number | string>>; a?: Partial<Combatant>; b?: Partial<Combatant> }
function battle(mapId: string, pos: Record<string, Offset>, opt: Opt = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, saves: LOW, weaponOptions: [club, torch], ...opt.a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, saves: LOW, ...opt.b }),
  ];
  const st = startBattle('k26', 'dag', parts, () => 0.5, {
    map: { id: mapId, ...(opt.variant ? { variantId: opt.variant } : {}), ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) },
    ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = high, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const err = (s: BattleState, cmd: Command, rng: Rng = high, ctx = P1) => { const r = execute(s, cmd, ctx, rng); return r.ok ? null : r.error; };
const objIn = (s: BattleState, id: string) => s.map?.objects?.find((x) => x.id === id);
const tile = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col];
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const fresh = (s: BattleState): BattleState => ({ ...s, combatants: Object.fromEntries(Object.entries(s.combatants).map(([k, c]) => [k, { ...c, economy: FRESH_ECONOMY }])) });
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);

describe('Dağ: Geçit Karakolu kolu ve balistası', () => {
  const pos = { A: o(9, 3), B: o(15, 4) };
  const tough = { b: { hp: 200, maxHp: 200 } };
  it('kol kapıyı açar, tekrar çekilince kapatır; kapı altında yaratık varsa kapanmaz; replay aynı', () => {
    const s0 = battle('dag-karakol', pos);
    expect(objIn(s0, 'kapi')?.state).toBe('closed');
    const r1 = run(s0, { type: 'object_use', actorId: 'A', objectId: 'kol', action: 'pull' });
    expect(objIn(r1.state, 'kapi')?.state).toBe('open');
    const r2 = run(fresh(r1.state), { type: 'object_use', actorId: 'A', objectId: 'kol', action: 'pull' });
    expect(objIn(r2.state, 'kapi')?.state).toBe('closed');
    replays(s0, r1);
    const blocked = { ...r1.state, combatants: { ...r1.state.combatants, B: { ...C(r1.state, 'B'), pos: o(10, 5) } } };
    expect(err(fresh(blocked), { type: 'object_use', actorId: 'A', objectId: 'kol', action: 'pull' })).toMatch(/yaratık var/);
  });
  it('kural kapalı ya da eski savaş: kol kapıyı açmaz (gerekçe)', () => {
    expect(err(battle('dag-karakol', pos, { toggles: { gateLever: false } }), { type: 'object_use', actorId: 'A', objectId: 'kol', action: 'pull' })).toMatch(/kapalı/);
    expect(err(battle('dag-karakol', pos, { v: 11 }), { type: 'object_use', actorId: 'A', objectId: 'kol', action: 'pull' })).toMatch(/kapalı/);
  });
  it('balista: ateşle (isabet 3d10 delici), boşalır; yükle; uzak menzil dezavantajlı; arayüz hedefi en yakın düşman', () => {
    const s0 = battle('dag-karakol', pos, tough);
    expect(objIn(s0, 'balista')?.state).toBe('loaded');
    const to = ballistaTarget(s0, C(s0, 'A'), objIn(s0, 'balista')!);
    expect(to).toEqual(o(15, 4));
    const r1 = run(s0, { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) });
    expect(C(r1.state, 'B').hp).toBeLessThan(200);
    expect(objIn(r1.state, 'balista')?.state).toBe('spent');
    expect(err(fresh(r1.state), { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) })).toMatch(/boş/);
    const r2 = run(fresh(r1.state), { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'load' });
    expect(objIn(r2.state, 'balista')?.state).toBe('loaded');
    replays(s0, r1, r2);
    // Iska (düşük zar) hasar vermez.
    expect(C(run(s0, { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) }, low).state, 'B').hp).toBe(200);
    // Kısa menzil (120 ft = 24 altıgen) ötesi dezavantaj: parametreyle daraltılmış menzil yok, notta görünür.
    const far = battle('dag-karakol', { A: o(9, 3), B: o(15, 4) }, { ...tough, params: { ballista: { attackBonus: 0 } } });
    expect(run(far, { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) }).events.some((e) => e.type === 'map_note' && /toplam/.test(e.text))).toBe(true);
  });
  it('balista kural kapalıyken ve bitişik değilken kullanılmaz', () => {
    expect(err(battle('dag-karakol', pos, { toggles: { ballista: false } }), { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) })).toMatch(/kapalı/);
    expect(err(battle('dag-karakol', { A: o(5, 5), B: o(15, 4) }), { type: 'object_use', actorId: 'A', objectId: 'balista', action: 'fire', to: o(15, 4) })).toMatch(/bitişik/);
  });
});

describe('Buzul: Tapınak donmuş şelalesi', () => {
  const pos = { A: o(18, 2), B: o(5, 9) };
  it('kırılınca ardındaki geçit açılır, keşif bayrağı; ateş iki kat hasar; replay aynı', () => {
    const s0 = battle('buzul-tapinak', pos);
    expect(tile(s0, o(19, 2))).toBe('#');
    const burn = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'selale', option: torch });
    const dmg = burn.events.find((e) => e.type === 'object_damaged');
    // Yüksek zar kritik: 2d2+10 = 14, ateş iki kat.
    expect(dmg?.type === 'object_damaged' && dmg.damage).toBe(28);
    // Meşale ateşi (28 ≥ 25 HP) şelaleyi eritir.
    expect(objIn(burn.state, 'selale')).toBeUndefined();
    for (const h of [o(19, 1), o(19, 2), o(20, 1), o(20, 2)]) expect(tile(burn.state, h)).toBe('.');
    expect(burn.state.flags).toContain('buzul-selale-gecidi');
    replays(s0, burn);
    // Ateşsiz vuruş iki kat almaz.
    const mid: Rng = () => 0.5;
    const smash = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'selale', option: { ...club, damage: '1d2+5' } }, mid);
    const d2 = smash.events.find((e) => e.type === 'object_damaged');
    expect(d2?.type === 'object_damaged' && d2.damage).toBeLessThan(8);
    expect(tile(smash.state, o(19, 2))).toBe('#');
  });
  it('kural kapalı ya da eski savaş: şelale kırılır ama geçit açılmaz', () => {
    for (const opt of [{ toggles: { frozenFall: false } }, { v: 11 }]) {
      const r = run(battle('buzul-tapinak', pos, opt), { type: 'attack_object', actorId: 'A', objectId: 'selale', option: club });
      expect(tile(r.state, o(19, 2))).toBe('#');
    }
  });
});

describe('Buzul: dondurucu soğuk (varsayılan kapalı)', () => {
  it('varsayılan kapalı; açılınca 3. turda CON save, başarısızsa 1 Exhaustion; soğuk dirençli geçer; eski savaşta yok', () => {
    const pos = { A: o(2, 6), B: o(12, 5) };
    expect(highlandsRoundEvents({ ...battle('buzul-acik', pos), round: 3 }, low)).toEqual([]);
    const s = { ...battle('buzul-acik', pos, { toggles: { coldExposure: true }, b: { resistances: ['cold'] } }), round: 3 };
    const evs = highlandsRoundEvents(s, low);
    expect(evs.filter((e) => e.type === 'exhaustion_changed').map((e) => e.type === 'exhaustion_changed' && e.targetId)).toEqual(['A']);
    expect(C(applyEvents(s, evs), 'A').exhaustion).toBe(1);
    expect(highlandsRoundEvents({ ...s, round: 4 }, low)).toEqual([]);
    expect(highlandsRoundEvents({ ...s, round: 6 }, low).some((e) => e.type === 'exhaustion_changed')).toBe(true);
    expect(highlandsRoundEvents({ ...s, round: 3 }, high).some((e) => e.type === 'exhaustion_changed')).toBe(false);
    expect(highlandsRoundEvents({ ...battle('buzul-acik', pos, { toggles: { coldExposure: true }, v: 11 }), round: 3 }, low)).toEqual([]);
  });
});

describe('Buzul: çığ eklemeleri', () => {
  it('Kayalık: 4. turda kendiliğinden uyarı yüzeyi, bir tur sonra çığ: save kaçıran Prone + güneye sürüklenir', () => {
    const s0 = { ...battle('buzul-kayalik', { A: o(12, 4), B: o(2, 9) }), round: 4 };
    const warn = highlandsRoundEvents(s0, low);
    const zone = warn.find((e) => e.type === 'zone_created');
    expect(zone?.type === 'zone_created' && zone.zone.surface).toBe('warning');
    const s1 = { ...applyEvents(s0, warn), round: 5 };
    expect(s1.map?.avalancheRound).toBe(5);
    const hit = wildsRoundEvents(s1, low);
    const s2 = applyEvents(s1, hit);
    expect(C(s2, 'A').conditions).toContain('Prone');
    expect(C(s2, 'A').pos).not.toEqual(o(12, 4));
    expect(hit.some((e) => e.type === 'pushed')).toBe(true);
    expect(highlandsRoundEvents({ ...s0, round: 3 }, low)).toEqual([]);
  });
  it('Kamp: Game Master tetikleyince uyarı yüzeyi (sürüm 12); sürüm 11 eski davranış (yalnızca not)', () => {
    const s = battle('buzul-kamp', { A: o(2, 4), B: o(12, 4) });
    expect(run(s, { type: 'map_trigger', rule: 'avalanche' }, high, GM).events.some((e) => e.type === 'zone_created')).toBe(true);
    const old = battle('buzul-kamp', { A: o(2, 4), B: o(12, 4) }, { v: 11 });
    expect(run(old, { type: 'map_trigger', rule: 'avalanche' }, high, GM).events.map((e) => e.type)).toEqual(['map_note']);
  });
});

describe('Buzul: ince buz uyarısı (sürüm 12)', () => {
  it('ilk giriş çatırdatır (uyarı, save yok); ikinci giriş kırar: DEX save, soğuk + Prone + bir tur Restrained', () => {
    const s = battle('buzul-acik', { A: o(8, 2) }, { a: { heavyArmor: true } });
    const first = wildsEnterEvents(s, C(s, 'A'), o(8, 2), low);
    expect(first.stop).toBe(false);
    expect(first.events.map((e) => e.type)).toEqual(['map_note']);
    const s1 = applyEvents(s, first.events);
    const second = wildsEnterEvents(s1, C(s1, 'A'), o(8, 2), low);
    expect(second.stop).toBe(true);
    const s2 = applyEvents(s1, second.events);
    expect(C(s2, 'A').conditions).toEqual(expect.arrayContaining(['Prone']));
    expect((C(s2, 'A').effects ?? []).some((e) => e.id === 'buzlu-su' && e.grants?.includes('Restrained'))).toBe(true);
  });
});

describe('Dağ: Sessiz Nöbetçi gizli nişi', () => {
  it('nişteki sandık gizli; bulmaca çözülünce niş açılır ve sandık görünür; replay aynı', () => {
    const s0 = battle('dag-nobetci', { A: o(5, 5), B: o(15, 5) });
    expect(objIn(s0, 'nis-sandik')?.gizli).toBe(true);
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'plaka', action: 'read' }, high);
    expect(tile(r.state, o(4, 7))).toBe('.');
    expect(objIn(r.state, 'nis-sandik')?.found).toBe(true);
    replays(s0, r);
  });
  it('sandık Algıyla bulununca niş kayası açılır (Game Master gösterir)', () => {
    const s0 = battle('dag-nobetci', { A: o(5, 5), B: o(15, 5) });
    const r = run(s0, { type: 'reveal_object', objectId: 'nis-sandik' }, high, GM);
    expect(tile(r.state, o(4, 7))).toBe('.');
    const off = battle('dag-nobetci', { A: o(5, 5), B: o(15, 5) }, { toggles: { sentinelNiche: false } });
    expect(tile(run(off, { type: 'reveal_object', objectId: 'nis-sandik' }, high, GM).state, o(4, 7))).toBe('r');
  });
});

describe('K26 sim duman testi: 8 harita, kurallar açık ve kapalı', () => {
  afterEach(() => setDefaultRuleToggles({}));
  const ids = ['k29-buzul-acik', 'k29-buzul-kamp', 'k29-buzul-kayalik', 'k29-buzul-tapinak', 'k29-dag-karakol', 'k29-dag-kayalik', 'k29-dag-kopru', 'k29-dag-nobetci'];
  it.each([true, false])('kurallar %s: savaş çökmeden biter', (on) => {
    setDefaultRuleToggles(Object.fromEntries(K26_RULES.map((id) => [id, on])));
    for (const id of ids) {
      const sc = SCENARIOS.find((x) => x.id === id);
      expect(sc, id).toBeTruthy();
      const r = simulate(sc!, 1, 20, 3);
      expect(['party', 'enemies', null, 'draw']).toContain(r.winner ?? null);
    }
  }, 120_000);
});
