/**
 * Kuyruk 18b: yüzey × yüzey etkileşimleri (data/yuzey-etkilesim.json, src/battle/surfaceMix.ts). Her yeni etkileşim:
 * açık (kural sürümü 15), Game Master anahtarı kapalı, eski kural sürümü (14) — eski kayıt ve replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { surfaceMixEvents, windDriftEvents, MIX_TABLE } from './surfaceMix';
import { surfacesAt } from './surfaces';
import { RULE_CONTROL } from './ruleControl';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, SurfaceKind } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high = () => 0.99;
const low = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const SPELLS = ['Fire Bolt', 'Web', 'Fog Cloud', 'Grease', 'Stinking Cloud'];
type Opts = { surum?: number; off?: string };
const MODES: Array<[string, Opts]> = [['açık', {}], ['anahtar kapalı', { off: 'x' }], ['sürüm 14', { surum: 14 }]];

function arena(key: string, opts: Opts, variant = 'gunduz'): BattleState {
  const a = mk('A', { ownerId: 'p1', spellNames: SPELLS, spellSlots: [4, 3, 3, 3, 3, 1, 0, 0, 0], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 11, hp: 80, maxHp: 80 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5, saves: LOW });
  const c = mk('C', { ownerId: 'p1', hp: 200, maxHp: 200, saves: LOW });
  const st = startBattle('k18b', 'd-z-zemin', [a, b, c], () => 0.5, { map: { id: 'col', variantId: variant } }).state;
  const at: Record<string, Offset> = { A: o(3, 3), B: o(5, 3), C: o(10, 3) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c0]) => [id, { ...(c0 as Combatant), pos: at[id] ?? null }]));
  const map = st.map as NonNullable<BattleState['map']>;
  return { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, ...(opts.surum ? { kuralSurumu: opts.surum } : {}),
    map: { ...map, tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], ...(opts.off ? { ruleToggles: { [key]: false } } : {}) } } as BattleState;
}
function run(state: BattleState, cmd: Command, rng: Rng = high, ctx = P1) {
  const r = execute(state, cmd, ctx, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const place = (s: BattleState, kind: SurfaceKind, hexes: Offset[]) => run(s, { type: 'place_surface', kind, hexes }, high, GM);
const kinds = (s: BattleState, h: Offset) => surfacesAt(s, h).map((z) => z.surface).sort();
const fresh = (s: BattleState): BattleState => { const a = s.combatants.A as Combatant; return { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, action: false, bonus: false } } } }; };
const cast = (s: BattleState, spellName: string, extra: Record<string, unknown>, rng: Rng = high) => run(fresh(s), { type: 'cast_spell', actorId: 'A', spellName, ...extra } as Command, rng);
const touch = (s: BattleState, damageType: string, hexes: Offset[]) =>
  surfaceMixEvents(s, [{ type: 'spell_cast', actorId: 'A', label: 'deneme', area: { hexes, damageType } } as unknown as BattleEvent], low);
const spellZone = (s: BattleState, id: string) => s.map?.zones?.find((z) => !z.surface && z.spellId === id);
const restrained = (s: BattleState) => (s.combatants.B as Combatant).conditions.includes('Restrained');
/** Ağ (9,3) çevresinde; B (7,3)'e yürüyüp DEX save'i kaçırır: Restrained. */
function webbed(key: string, opts: Opts) {
  const w = cast(arena(key, opts), 'Web', { targetHex: o(9, 3) }, low);
  const m = run({ ...w.state, turnIndex: 1 }, { type: 'move', actorId: 'B', to: o(7, 3) } as Command, low, GM);
  return { events: [...w.events, ...m.events], state: { ...m.state, turnIndex: 0 } };
}
/** Su yüzeyi oluşur (ör. eriyen buz); GM yerleşimi aynı altıgendeki yüzeyleri değiştirdiği için olay doğrudan. */
function waterAppears(s: BattleState, h: Offset): BattleEvent[] {
  const ev = { type: 'zone_created', zone: { id: 'surface:water:9', spellId: 'surface:water', name: 'Su', casterId: 'A', side: 'party', dc: 10, slotLevel: 0, hexes: [h], surface: 'water' } } as BattleEvent;
  return surfaceMixEvents(applyEvents(s, [ev]), [ev], low);
}

describe('K18b: tablo', () => {
  it('her "eklendi" satırının global anahtarı kural sürümü 15 ile kayıtlı; olmayanlar gerekçeli', () => {
    for (const e of MIX_TABLE) {
      if (e.durum === 'eklendi') expect(RULE_CONTROL[e.anahtar], e.id).toMatchObject({ global: true, surum: 15 });
      expect(['vardi', 'eklendi', 'degismez', 'yapilamadi']).toContain(e.durum);
    }
  });
});

describe.each(MODES)('K18b etkileşimleri (%s)', (_, opts) => {
  const yes = !opts.off && !opts.surum;
  it('Alev + Sis: değen altıgende sis kalkar', () => {
    const s = cast(arena('mixFireFog', opts), 'Fog Cloud', { targetHex: o(8, 3) }).state;
    const before = spellZone(s, 'fog-cloud')?.hexes.length ?? 0;
    const evs = touch(s, 'fire', [o(8, 3)]);
    expect(evs.some((e) => e.type === 'surface_reacted' && e.reaction === 'fogBurn')).toBe(yes);
    expect(before).toBeGreaterThan(0);
  });
  it('Yıldırım + Buz: buz çatlar', () => {
    const s = place(arena('mixLightningIce', opts), 'ice', [o(8, 3)]).state;
    expect(touch(s, 'lightning', [o(8, 3)]).some((e) => e.type === 'zone_ended')).toBe(yes);
  });
  it('Yıldırım + Yağ: tutuşur', () => {
    const s = place(arena('mixLightningIgnite', opts), 'oil', [o(8, 3)]).state;
    expect(touch(s, 'lightning', [o(8, 3)]).some((e) => e.type === 'zone_created' && e.zone.surface === 'fire')).toBe(yes);
  });
  it('Soğuk + Buhar: su olur', () => {
    const s = place(arena('mixColdSteam', opts), 'steam', [o(8, 3)]).state;
    expect(touch(s, 'cold', [o(8, 3)]).some((e) => e.type === 'zone_created' && e.zone.surface === 'water')).toBe(yes);
  });
  it('Kuvvet + Su: su bir halka taşar', () => {
    const s = place(arena('mixForceWater', opts), 'water', [o(8, 3)]).state;
    expect(touch(s, 'thunder', [o(8, 3)]).some((e) => e.type === 'zone_moved' && e.hexes.length > 1)).toBe(yes);
  });
  it('Asit + Ağ: ağ erir, tutsak kurtulur', () => {
    const s = webbed('mixAcidWeb', opts).state;
    expect(restrained(s)).toBe(true);
    const evs = touch(s, 'acid', [o(7, 3)]);
    expect(evs.some((e) => e.type === 'effect_ended' && e.targetId === 'B')).toBe(yes);
  });
  it('Su + Ağ: ağ çözülür, tutsak kurtulur; replay aynı', () => {
    const s0 = webbed('mixWaterWeb', opts);
    const r = place(s0.state, 'water', [o(7, 3)]);
    expect(restrained(r.state)).toBe(!yes);
    expect(replay([{ type: 'battle_started', state: s0.state }, ...r.events])).toEqual(r.state);
  });
  it('Su + Alev: alev söner, buhar çıkar', () => {
    const s = place(arena('mixWaterFire', opts), 'fire', [o(8, 3)]).state;
    const evs = waterAppears(s, o(8, 3));
    expect(evs.some((e) => e.type === 'zone_created' && e.zone.surface === 'steam')).toBe(yes);
  });
  it('Su + Gres: gres 2 turda dağılır', () => {
    const s = cast(arena('mixWaterGrease', opts), 'Grease', { targetHex: o(8, 3) }).state;
    const r = place(s, 'water', [o(8, 3)]);
    expect(spellZone(r.state, 'grease')?.until).toBe(yes ? r.state.round + 1 : spellZone(s, 'grease')?.until);
  });
  it('Su + Zehir: bulut seyrelir (bu tur sonunda kalkar)', () => {
    const s = place(arena('mixWaterPoison', opts), 'poison', [o(8, 3)]).state;
    const evs = waterAppears(s, o(8, 3));
    expect(evs.some((e) => e.type === 'zone_moved' && e.until === s.round)).toBe(yes);
  });
  it('Alev + Yağ: bitişik yağ da tutuşur, üstündeki hemen yanar', () => {
    let s = place(arena('mixOilSpread', opts), 'oil', [o(5, 3)]).state;
    s = place(s, 'oil', [o(6, 3)]).state;
    const r = cast(s, 'Fire Bolt', { targetId: 'B' });
    expect((r.state.map?.zones ?? []).some((z) => z.surface === 'oil')).toBe(!yes);
    expect(r.events.some((e) => e.type === 'effect_tick' && e.targetId === 'B' && e.damageType === 'fire')).toBe(yes);
  });
  // Yanan ağ altıgeni ağdan çıkınca tutsak eski kuralda da kurtuluyordu; yeni olan anında yanık hasarı.
  it('Alev + Ağ: tutsak serbest kalır ve yanık hasarı alır', () => {
    const s = webbed('mixWebFree', opts).state;
    const r = cast(s, 'Fire Bolt', { targetId: 'B' });
    expect(r.events.some((e) => e.type === 'effect_tick' && e.targetId === 'B' && e.damageType === 'fire')).toBe(yes);
  });
  it('Alev + Zehir: patlama yok (anahtar kapalı ya da eski sürümde patlar)', () => {
    const s = cast(arena('mixPoisonInert', opts), 'Stinking Cloud', { targetHex: o(7, 3) }, low).state;
    const r = cast(s, 'Fire Bolt', { targetId: 'B' });
    expect(r.events.some((e) => e.type === 'surface_reacted' && e.reaction === 'explode')).toBe(!yes);
  });
  it('Yağ + Hareket: girişte DEX save, başarısızsa Prone', () => {
    const s = place(arena('mixOilSlip', opts), 'oil', [o(6, 3)]).state;
    const bTurn = { ...s, turnIndex: 1 };
    const r = run(bTurn, { type: 'move', actorId: 'B', to: o(6, 3) } as Command, low, GM);
    expect((r.state.combatants.B as Combatant).conditions.includes('Prone')).toBe(yes);
  });
  it('Rüzgâr + Bulut: tur başı rüzgâr yönünde sürüklenir, şiddetlide süre kısalır', () => {
    const base = arena('mixWindClouds', opts, 'aksam');
    const withWind = { ...base, map: { ...(base.map as NonNullable<BattleState['map']>), ruleParams: { wind: { dir: 'S', strength: 2 } } } };
    const s = place(withWind, 'poison', [o(8, 2)]).state;
    const evs = windDriftEvents(s);
    expect(evs.some((e) => e.type === 'zone_moved' && e.hexes.some((h) => h.row === 3))).toBe(yes);
  });
});
