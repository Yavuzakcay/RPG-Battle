/** Dungeon "Merdiven" ve "Hazine odası" varyantları (GOREV-DUNGEON-MERDIVEN-HAZINE). */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { getMap, RAW_MAPS, validateMap } from '../map/maps';
import { terrainOf } from '../map/terrain';
import type { Offset } from '../rules/hex';
import { pushOutcome, shoveHex } from './forced';
import { attackSources } from '../rules/conditions';
import { heightOf } from './cover';
import { terrainInfo } from '../ui/mapView';
import { GM, P1, mk, scripted, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, modifiers: { ...zero, str: 3 }, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 30, maxHp: 30, ...p });
/** Varyantın gerçek zemini; sıra A'da. */
function field(variantId: string, positions: Record<string, Offset>, parts: Combatant[] = [A(), B()]): BattleState {
  const { state } = startBattle('d', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })),
    scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'dungeon', variantId } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', turnIndex: state.order.indexOf('A'), combatants };
}
const tilesOf = (v: string) => getMap('dungeon', { variantId: v }).tiles;
const at = (tiles: string[], h: Offset) => tiles[h.row]?.[h.col] ?? '#';
/** Zeminde `a` → `t` → arkası koşulunu sağlayan ilk dizilim (saldıran, hedef, itilecek altıgen). */
function findShove(v: string, ok: (a: string, t: string, to: string) => boolean): { a: Offset; t: Offset; to: Offset } {
  const tiles = tilesOf(v);
  for (let row = 0; row < 7; row++) for (let col = 0; col < 15; col++) {
    for (const t of [o(col, row + 1), o(col + 1, row), o(col, row - 1), o(col - 1, row)]) {
      const a = o(col, row);
      const to = shoveHex({ ...A(), pos: a }, { ...B(), pos: t });
      if (to && ok(at(tiles, a), at(tiles, t), at(tiles, to))) return { a, t, to };
    }
  }
  throw new Error('dizilim yok');
}
const run = (s: BattleState, cmd: Parameters<typeof execute>[1], rng = scripted([20, 2], [6, 3], [6, 3], [4, 2])) => {
  const r = execute(s, cmd, 'actorId' in cmd && s.combatants[cmd.actorId]?.side === 'enemies' ? GM : P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const fx = (events: BattleEvent[], rule: string) => events.find((e): e is Extract<BattleEvent, { type: 'map_effect' }> => e.type === 'map_effect' && e.rule === rule);

describe('Dungeon varyantları: veri', () => {
  it('Koridor kaldı; Merdiven ve Hazine odası kendi zemini ve başlangıç bölgeleriyle yüklenir', () => {
    const raw = RAW_MAPS.find((m) => m.id === 'dungeon');
    expect(raw?.variants.map((v) => v.id)).toEqual(['mesale', 'merdiven', 'hazine']);
    expect(validateMap(raw as NonNullable<typeof raw>)).toEqual([]);
    const m = getMap('dungeon', { variantId: 'merdiven' });
    expect(m.tiles.join('')).toContain('y');
    expect([m.startZones.players.length, m.startZones.enemies.length]).toEqual([14, 12]);
    const h = getMap('dungeon', { variantId: 'hazine' });
    expect([h.startZones.players.length, h.startZones.enemies.length]).toEqual([12, 12]);
    // Aynalama varyantın zeminiyle: taraflar birbirinin aynalı altıgenlerini alır.
    const mm = getMap('dungeon', { variantId: 'merdiven', mirrored: true });
    expect(mm.tiles).toEqual(m.tiles.map((r) => [...r].reverse().join('')));
    expect(mm.startZones.players.length).toBe(12);
  });
  it('kural verisi: stairwellFall, stairShove, hiddenTrap, loot JSON\'da', () => {
    const v = (id: string) => getMap('dungeon').variants.find((x) => x.id === id);
    expect(v('merdiven')?.rules.map((r) => r.id)).toEqual(['highGround', 'stairwellFall', 'stairShove']);
    expect(v('hazine')?.rules.map((r) => r.id)).toEqual(['trap', 'hiddenTrap', 'loot']);
    expect(v('merdiven')?.rules.find((r) => r.id === 'stairwellFall')).toMatchObject({ damage: '2d6', landOn: 'l' });
  });
});

describe('Merdiven', () => {
  it('yüksek basamaktaki saldıran avantajlı (highGround: genel yükseklik kuralı)', () => {
    const tiles = tilesOf('merdiven');
    const y = (() => { for (let r = 0; r < 7; r++) for (let c = 0; c < 15; c++) if (at(tiles, o(c, r)) === 'y') return o(c, r); return o(0, 0); })();
    const s = field('merdiven', { A: y, B: o(2, 4) });
    const src = attackSources({ attackerConditions: [], targetConditions: [], attackerHeight: heightOf(s, s.combatants.A as Combatant), targetHeight: heightOf(s, s.combatants.B as Combatant), ranged: true, spell: false });
    expect(src.map((x) => x.effect)).toEqual(['advantage']);
  });
  it('merdiven boşluğuna (u) itilen 2d6 + Prone, aynı odada en yakın alçak basamağa (l) yerleşir', () => {
    const f = findShove('merdiven', (a, t, to) => to === 'u' && terrainOf(a).movement !== 'blocked' && terrainOf(t).movement !== 'blocked' && t !== 'u' && a !== 'u');
    const s = field('merdiven', { A: f.a, B: f.t });
    const out = pushOutcome(s, s.combatants.B as Combatant, f.t, f.to);
    expect(out).toMatchObject({ ok: true, kind: 'stairwell' });
    const r = run(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' });
    const ev = fx(r.events, 'stairwellFall');
    expect(ev).toMatchObject({ text: 'merdiven boşluğuna düştü', damage: { rolls: [3, 3], type: 'bludgeoning' }, addCondition: 'Prone' });
    const pos = r.state.combatants.B?.pos as Offset;
    expect(at(tilesOf('merdiven'), pos)).toBe('l');
    expect(r.state.combatants.B?.hp).toBe(24);
  });
  it('basamakta yüksekten alçağa itilen 1d4 yuvarlanır + Prone; yukarı basamağa itilebilir', () => {
    const down = findShove('merdiven', (a, t, to) => terrainOf(t).stairs === true && terrainOf(to).stairs === true
      && terrainOf(t).height > terrainOf(to).height && terrainOf(a).movement !== 'blocked');
    const s = field('merdiven', { A: down.a, B: down.t });
    expect(pushOutcome(s, s.combatants.B as Combatant, down.t, down.to)).toMatchObject({ ok: true, kind: 'tumble' });
    const r = run(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' }, scripted([20, 2], [4, 3]));
    expect(fx(r.events, 'stairShove')).toMatchObject({ text: 'basamaktan yuvarlandı', damage: { rolls: [3] }, addCondition: 'Prone' });
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'fall')).toBe(false);
    const up = findShove('merdiven', (a, t, to) => terrainOf(to).stairs === true && terrainOf(to).height > terrainOf(t).height
      && terrainOf(t).movement !== 'blocked' && terrainOf(a).movement !== 'blocked');
    const u = field('merdiven', { A: up.a, B: up.t });
    expect(pushOutcome(u, u.combatants.B as Combatant, up.t, up.to)).toMatchObject({ ok: true, kind: 'move' });
  });
});

describe('Hazine odası', () => {
  it('gizli tuzak pasif Algıyla fark edilir (yakında ve pasif ≥ DC); düşükse fark edilmez', () => {
    const tiles = tilesOf('hazine');
    const j = (() => { for (let r = 0; r < 7; r++) for (let c = 0; c < 15; c++) if (at(tiles, o(c, r)) === 'j') return o(c, r); return o(0, 0); })();
    const near = (() => { for (let r = 0; r < 7; r++) for (let c = 0; c < 15; c++) {
      const h = o(c, r);
      if (at(tiles, h) === '.' && Math.abs(c - j.col) <= 1 && Math.abs(r - j.row) <= 1 && (c !== j.col || r !== j.row)) return h;
    } return o(0, 0); })();
    const sharp = field('hazine', { A: o(0, 0), B: o(14, 0), C: near }, [A(), B(), mk('C', { ownerId: 'p1', skills: { perception: 5 } })]);
    const atC = { ...sharp, turnIndex: sharp.order.indexOf('B') };
    const r = execute(atC, { type: 'end_turn', actorId: 'B' }, GM, scripted());
    if (!r.ok) throw new Error(r.error);
    const note = r.events.find((e) => e.type === 'map_note' && e.trapFound);
    expect(note).toMatchObject({ trapFound: expect.anything() });
    const dull = field('hazine', { A: o(0, 0), B: o(14, 0), C: near }, [A(), B(), mk('C', { ownerId: 'p1', skills: { perception: 0 } })]);
    const r2 = execute({ ...dull, turnIndex: dull.order.indexOf('B') }, { type: 'end_turn', actorId: 'B' }, GM, scripted());
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.events.some((e) => e.type === 'map_note' && e.trapFound)).toBe(false);
  });
  it('hazine (loot) yalnızca bilgi: altıgen bilgisinde yazar', () => {
    const tiles = tilesOf('hazine');
    const h = (() => { for (let r = 0; r < 7; r++) for (let c = 0; c < 15; c++) if (at(tiles, o(c, r)) === 'h') return o(c, r); return o(0, 0); })();
    const s = field('hazine', { A: o(1, 1), B: o(13, 1) });
    expect(terrainInfo(s, h)).toContain('hazine');
  });
});
