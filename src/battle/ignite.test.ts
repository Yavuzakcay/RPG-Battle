/**
 * Kuyruk 24c: gres yanıcılığı ve yanıcı hane hedeflemesi (Game Master mekaniği `greaseFlammable`, kural sürümü 5).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { replay } from './reduce';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const GREASE: Offset[] = [o(6, 3), o(7, 3), o(6, 4), o(7, 4)];

function field(opt: { v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number>>; water?: boolean } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', spellNames: ['Fire Bolt'], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 5, hp: 50, maxHp: 50 }),
    mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5 }),
  ];
  const st = startBattle('k24c', 'col', parts, () => 0.5, {
    map: { id: 'col', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const tiles = Array.from({ length: 7 }, (_, r) => (opt.water && r === 3 ? '.'.repeat(8) + 'w' + '.'.repeat(6) : '.'.repeat(15)));
  const zone: SpellZone = { id: 'grease:A:1', spellId: 'grease', name: 'Grease', casterId: 'A', side: 'party', dc: 13, slotLevel: 1, hexes: GREASE };
  const pos: Record<string, Offset> = { A: o(2, 3), B: o(6, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(st.map as NonNullable<BattleState['map']>), tiles, zones: [zone] } } as BattleState;
}
const run = (s: BattleState, cmd: Command, ctx = P1) => { const r = execute(s, cmd, ctx, high); if (!r.ok) throw new Error(r.error); return r; };
const atHex = (h: Offset): Command => ({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetHex: h });
const zones = (s: BattleState) => (s.map?.zones ?? []).map((z) => z.surface ?? z.spellId);

describe('Kuyruk 24c: gres yanıcıdır', () => {
  it('gres hanesine Fire Bolt: bütün gres alev olur (3 tur), içindeki yaratık bir kez yanar; replay aynı', () => {
    const s0 = field();
    const r = run(s0, atHex(o(7, 4)));
    expect(zones(r.state)).toEqual(['fire']);
    const fire = r.state.map?.zones?.[0] as SpellZone;
    expect(fire.hexes).toEqual(GREASE);
    expect(fire.until).toBe(s0.round + 2);
    expect(r.events.filter((e) => e.type === 'effect_tick' && e.targetId === 'B' && e.damageType === 'fire')).toHaveLength(1);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
  });
  it('gresteki yaratığa ateş (isabet eden Fire Bolt) gresi tutuşturur', () => {
    const r = run(field(), { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' });
    expect(zones(r.state)).toEqual(['fire']);
  });
  it('yanma süresi Game Master parametresi; süre bitince alev söner (zemin normal)', () => {
    const s0 = field({ params: { greaseFlammable: { burnRounds: 1 } } });
    let s = run(s0, atHex(o(6, 4))).state;
    expect((s.map?.zones?.[0] as SpellZone).until).toBe(s0.round);
    for (let i = 0; i < 2; i++) { s = run(s, { type: 'end_turn', actorId: 'A' }).state; s = run(s, { type: 'end_turn', actorId: 'B' }, GM).state; }
    expect(zones(s)).toEqual([]);
    expect(s.map?.tiles[3]?.[6]).toBe('.');
  });
  it('bitişik su varken buhar çıkmaz (yalnızca suyun içinde)', () => {
    const r = run(field({ water: true }), atHex(o(7, 3)));
    expect(zones(r.state)).not.toContain('steam');
  });
  it('Game Master kapatınca ve eski kayıtta (kural sürümü 4): tutuşmaz, hane hedeflenemez', () => {
    // Kuyruk 30 D3: serbest altıgen hedefleme kapalıyken (K24c davranışı).
    for (const s of [field({ toggles: { greaseFlammable: false, freeHexTarget: false } }), field({ v: 4 })]) {
      expect(execute(s, atHex(o(7, 4)), P1, high).ok).toBe(false);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' });
      expect(zones(r.state)).toEqual(['grease']);
    }
  });
  it('yanıcı olmayan hane hedeflenemez; menzil/görüş yaratıkla aynı', () => {
    expect(execute(field({ toggles: { freeHexTarget: false } }), atHex(o(10, 3)), P1, high).ok).toBe(false);
    const evs: BattleEvent[] = run(field(), atHex(o(6, 3))).events;
    expect(evs.some((e) => e.type === 'spell_cast' && e.targetId === null)).toBe(true);
  });
});

describe('Kuyruk 30 D3: serbest altıgen hedefleme', () => {
  it('ateş büyüsü boş zemine atılır: slot/eylem harcanır, hemen söner (alev yok)', () => {
    const r = run(field(), atHex(o(10, 3)));
    expect(r.events.some((e) => e.type === 'spell_cast' && e.targetId === null && /söndü/.test(e.note ?? ''))).toBe(true);
    expect(zones(r.state)).toEqual(['grease']);
  });
  it('menzil dışı ve görüş dışı reddedilir', () => {
    const s = field();
    const far = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(0, 0) } } };
    expect(execute(far, { type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetHex: o(14, 6) }, P1, high).ok).toBe(false);
    // Kuyruk A6: sürüm 35'te Produce Flame önce elde alev yaratır (fırlatma Magic eylemiyle); eski tek adım sürüm 34'te.
    const fb = execute({ ...far, kuralSurumu: 34, combatants: { ...far.combatants, A: { ...(far.combatants.A as Combatant), spellNames: ['Produce Flame'] } } },
      { type: 'cast_spell', actorId: 'A', spellName: 'Produce Flame', targetHex: o(14, 6) }, P1, high);
    expect(fb.ok ? '' : fb.error).toMatch(/menzil/);
  });
  it('boş altıgene Grease, sonra o altıgene ateş: gres tutuşur', () => {
    const s0 = field();
    const caster = { ...(s0.combatants.A as Combatant), spellNames: ['Grease', 'Fire Bolt'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] };
    let s: BattleState = { ...s0, combatants: { ...s0.combatants, A: caster }, map: { ...s0.map!, zones: [] } };
    s = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Grease', targetHex: o(10, 2) }).state;
    expect(zones(s)).toEqual(['grease']);
    s = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), economy: s0.combatants.A!.economy } } };
    expect(zones(run(s, atHex(o(10, 2))).state)).toEqual(['fire']);
  });
});
