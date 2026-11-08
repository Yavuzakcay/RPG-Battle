/**
 * Kuyruk K66b (kural sürümü 50, K66a ile aynı): Earthquake yapı hasarı ve çöküş (SRD 5.2.1 s. 127). Dökümde ve büyücünün tur
 * sonlarında yapıya 50 Bludgeoning; 0 HP'de çöküş: yarı yükseklik içindekiler DEX save, başarısızsa 12d6 + Prone + enkaz
 * (hız 0, DC 20 Athletics), başarılıysa yarı hasar; zemin taşlık. `run` her komutta replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { chooseCommand, quakeCollapseValue } from './ai';
import { GM, mk } from './fixtures';
import { execute, replay } from './index';
import { seededRng } from '../rules/dice';
import { caster, field, run } from './k19spells.test';
import { collapseRadius, isBuried, quakeForecast, structuresIn } from './quake';
import { speedHexes } from './reduce';
import { mechanicsAt } from './spellVersion';
import { spells } from '../data';
import { areaActPreview } from '../ui/hud';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, MapObject, SpellZone } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const SP = () => spells.find((s) => s.name === 'Earthquake') as NonNullable<(typeof spells)[number]>;
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: ['Earthquake'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, saves: HIGH, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 300, maxHp: 300, saves: LOW, ...p });
const obj = (id: string, kind: MapObject['kind'], at: Offset, hp: number): MapObject => ({ id, kind, at, hp, ...(kind === 'door' || kind === 'gate' ? { state: 'closed' as const } : {}) });
const withObjects = (s: BattleState, objects: MapObject[]): BattleState => ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), objects } });
const quake = (s: BattleState, seed = 3) => run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Earthquake', targetHex: { col: 7, row: 3 } } as Command, seed);
const endTurn = (s: BattleState, id = 'A', seed = 3) => run(s, { type: 'end_turn', actorId: id } as Command, seed);
const collapseSaves = (evs: BattleEvent[], id: string) => evs.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === id && /çöküş/.test(e.label));
const runGm = (s: BattleState, cmd: Command) => {
  const r = execute(s, cmd, GM, seededRng(3));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};
const POS = { A: { col: 1, row: 3 }, F0: { col: 9, row: 2 }, F1: { col: 12, row: 5 } };
// Kapı (9,3) F0'ın yanında; çatlak duvar (12,1) uzakta.
const OBJS = () => [obj('door', 'door', { col: 9, row: 3 }, 18), obj('cw', 'crackedWall', { col: 12, row: 1 }, 30)];
const setup = (ver = 50, parts: Combatant[] = [wiz(), foe('F0'), foe('F1')], objects: MapObject[] = OBJS(), pos: Record<string, Offset> = POS) => withObjects(field(parts, pos, ver), objects);

describe('K66b veri ve yapı tanımı', () => {
  it('sürüm 50\'de yapı verisi (50 Bludgeoning, yükseklikler, 12d6, DC 20); 49\'da yok', () => {
    expect(mechanicsAt(setup(), SP()).zone?.structures).toMatchObject({ damage: 50, damageType: 'bludgeoning', heightsFt: { door: 10, gate: 15, tent: 10, crackedWall: 10, panel: 10 },
      collapse: { dice: '12d6', escapeDc: 20, rubble: 't' } });
    expect(mechanicsAt(setup(49), SP()).zone?.structures).toBeUndefined();
  });
  it('yapı: kapı, kafes kapısı, çadır, çatlak duvar; sandık, köprü, ağaç, plaka değil; havadaki nesne yere değmez; yarıçap 1 altıgen', () => {
    const s = setup(50, undefined, [obj('a', 'door', { col: 3, row: 1 }, 18), obj('b', 'gate', { col: 4, row: 1 }, 27), obj('c', 'tent', { col: 5, row: 1 }, 13),
      obj('d', 'crackedWall', { col: 6, row: 1 }, 30), obj('e', 'chest', { col: 7, row: 1 }, 10), obj('f', 'bridge', { col: 8, row: 1 }, 27),
      obj('g', 'tree', { col: 10, row: 1 }, 27), obj('h', 'plaque', { col: 11, row: 1 }, 30), { ...obj('i', 'door', { col: 3, row: 5 }, 18), altitudeFt: 10 }]);
    const spec = mechanicsAt(s, SP()).zone?.structures as NonNullable<NonNullable<ReturnType<typeof mechanicsAt>['zone']>['structures']>;
    const all = s.map?.tiles.flatMap((row, r) => [...row].map((_, c) => ({ col: c, row: r }))) ?? [];
    expect(structuresIn(s, all, spec).map((x) => x.obj?.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([10, 15].map(collapseRadius)).toEqual([1, 1]);
  });
});

describe('K66b yapı hasarı ve çöküş', () => {
  it('dökümde 50 Bludgeoning: kapı çöker; bitişikteki düşman save\'i kaçırır: 12d6, Prone, enkaz (hız 0); zemin taşlık', () => {
    const r = quake(setup());
    expect(r.events.some((e) => e.type === 'object_damaged' && e.objectId === 'door' && e.damage === 50)).toBe(true);
    expect(r.state.map?.objects?.some((o) => o.id === 'door')).toBe(false);
    expect(r.state.map?.tiles[3]?.[9]).toBe('t');
    const sv = collapseSaves(r.events, 'F0');
    expect(sv).toHaveLength(1);
    expect(sv[0]).toMatchObject({ success: false, damageType: 'bludgeoning' });
    expect(sv[0]?.damageRolls).toHaveLength(12);
    const f0 = r.state.combatants.F0 as Combatant;
    expect(f0.conditions).toContain('Prone');
    expect(isBuried(f0)).toBe(true);
    expect(speedHexes(f0)).toBe(0);
    // Uzaktaki F1 (çatlak duvar ona 2+ altıgen) çöküşe girmez.
    expect(collapseSaves(r.events, 'F1')).toHaveLength(0);
  });
  it('save\'i geçen yarı hasar alır, Prone ve enkaz yok', () => {
    const r = quake(setup(50, [wiz(), foe('F0', { saves: HIGH }), foe('F1')]));
    const sv = collapseSaves(r.events, 'F0')[0]!;
    expect(sv.success).toBe(true);
    expect(sv.appliedDamage).toBe(Math.floor(sv.rawDamage / 2));
    expect(isBuried(r.state.combatants.F0 as Combatant)).toBe(false);
    expect(sv.conditionsAdded).toEqual([]);
  });
  it('enkazdan kurtulma: eylemle DC 20 Athletics (escape)', () => {
    const r = quake(setup());
    const s = { ...r.state, turnIndex: 1 } as BattleState;
    const strong = { ...s, combatants: { ...s.combatants, F0: { ...(s.combatants.F0 as Combatant), skills: { athletics: 40 } } as Combatant } } as BattleState;
    const e = runGm(strong, { type: 'escape', actorId: 'F0' } as Command);
    expect(e.events.some((x) => x.type === 'grapple_escape' && x.dc === 20 && x.success)).toBe(true);
    expect(isBuried(e.state.combatants.F0 as Combatant)).toBe(false);
  });
  it('tur sonunda yeniden 50: 30 HP\'lik yapı dökümde, 90 HP\'lik Wall of Stone paneli ikinci tur sonunda çöker; büyü bitince durur', () => {
    const r = quake(setup());
    expect(r.state.map?.objects?.some((o) => o.id === 'cw')).toBe(false);
    // Wall of Stone paneli (90 HP): döküm 50, tur sonu 50 → çöker.
    const wall: SpellZone = { id: 'wos', spellId: 'wall-of-stone', name: 'Wall of Stone', casterId: 'F1', side: 'enemies', dc: 10, slotLevel: 5, hexes: [{ col: 5, row: 5 }, { col: 5, row: 6 }] };
    const s0 = setup();
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: [wall] } } as BattleState;
    const c = quake(s);
    expect(c.state.map?.zones?.find((z) => z.id === 'wos')?.hexes).toHaveLength(2);
    const e = endTurn(c.state);
    expect(e.state.map?.zones?.find((z) => z.id === 'wos')?.hexes ?? []).toHaveLength(0);
    expect(e.state.map?.tiles[5]?.[5]).toBe('t');
  });
  it('Wall of Ice paneli (30 HP) dökümde kırılır (donuk hava); Wall of Force hasara bağışık, yapı sayılmaz', () => {
    const ice: SpellZone = { id: 'woi', spellId: 'wall-of-ice', name: 'Wall of Ice', casterId: 'F1', side: 'enemies', dc: 10, slotLevel: 6, hexes: [{ col: 4, row: 5 }],
      spec: spells.find((x) => x.id === 'wall-of-ice')?.mechanics.k62?.zone };
    const force: SpellZone = { id: 'wof', spellId: 'wall-of-force', name: 'Wall of Force', casterId: 'F1', side: 'enemies', dc: 10, slotLevel: 5, hexes: [{ col: 4, row: 1 }] };
    const s0 = setup();
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: [ice, force] } } as BattleState;
    const r = quake(s);
    expect(r.state.map?.zones?.find((z) => z.id === 'woi')?.hexes ?? []).toHaveLength(0);
    expect(r.state.map?.zones?.some((z) => z.name === 'Donuk hava')).toBe(true);
    expect(r.state.map?.zones?.find((z) => z.id === 'wof')?.hexes).toHaveLength(1);
  });
  it('sürüm 49: yapı hasarı yok, kapı yerinde', () => {
    const r = quake(setup(49));
    expect(r.events.some((e) => e.type === 'object_damaged')).toBe(false);
    expect(r.state.map?.objects?.some((o) => o.id === 'door')).toBe(true);
    const e = endTurn(r.state);
    expect(e.events.some((x) => x.type === 'object_damaged')).toBe(false);
  });
});

describe('K66b yapay zekâ ve arayüz', () => {
  it('önizleme: çökecek yapılar ve vuracakları (düşman/dost)', () => {
    const s = setup();
    const me = s.combatants.A as Combatant;
    const spec = mechanicsAt(s, SP()).zone?.structures as NonNullable<NonNullable<ReturnType<typeof mechanicsAt>['zone']>['structures']>;
    const all = s.map?.tiles.flatMap((row, r) => [...row].map((_, c) => ({ col: c, row: r }))) ?? [];
    const f = quakeForecast(s, me, all, spec);
    expect(f.falling.map((x) => x.obj?.id).sort()).toEqual(['cw', 'door']);
    expect(f.foes.map((c) => c.id)).toEqual(['F0']);
    expect(f.friends).toEqual([]);
    const pv = areaActPreview(s, me, { kind: 'spell', spell: SP() }, { col: 7, row: 3 });
    expect(pv.error).toBeNull();
  });
  it('dostu vuracak çöküş varsa Earthquake seçilmez; enkazdaki yapay zekâ kurtulmayı dener', () => {
    const E = caster({ id: 'E', side: 'enemies', ownerId: undefined, spellNames: ['Earthquake'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, saves: HIGH });
    const parts = [E, mk('W', { side: 'enemies', hp: 50, maxHp: 50 }), mk('P1', { ownerId: 'p1', hp: 40, maxHp: 40, saves: LOW }), mk('P2', { ownerId: 'p1', hp: 40, maxHp: 40, saves: LOW })];
    const pos = { E: { col: 1, row: 3 }, W: { col: 9, row: 2 }, P1: { col: 12, row: 3 }, P2: { col: 12, row: 4 } };
    const s = withObjects(field(parts, pos, 50), [obj('door', 'door', { col: 9, row: 3 }, 18)]);
    const cmd = chooseCommand(s);
    expect(cmd.type === 'cast_spell' && cmd.spellName === 'Earthquake').toBe(false);
    // Ölçüt doğrudan: dost (W) kapının yanında → null (seçilmez); kapı yalnız düşmanın yanındaysa düşman sayılır.
    const all = s.map?.tiles.flatMap((row, r) => [...row].map((_, c) => ({ col: c, row: r }))) ?? [];
    expect(quakeCollapseValue(s, s.combatants.E as Combatant, SP(), all)).toBeNull();
    const s2 = withObjects(s, [obj('door', 'door', { col: 11, row: 2 }, 18)]);
    expect(quakeCollapseValue(s2, s2.combatants.E as Combatant, SP(), all.filter((h) => h.col < 12))).toBe(1);
    expect(quakeCollapseValue(s2, s2.combatants.E as Combatant, SP(), all)).toBe(0);
    // Enkaz altındaki yapay zekâ kurtulmayı dener.
    const r = quake(setup());
    const buried = { ...r.state, turnIndex: 1 } as BattleState;
    expect(chooseCommand(buried)).toMatchObject({ type: 'escape', actorId: 'F0' });
  });
});
