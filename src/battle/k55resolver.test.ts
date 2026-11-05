/**
 * Kuyruk K55: altıgen etki çözücüsü (kural sürümü 26). Tablonun her çalışan satırı için bir test (sonuç yüzey, süre,
 * hasar), öncelik sırası, katman kuralı, zincir derinliği ve döngü engeli, engel, konsantrasyon bağı, kuru çalıştırma,
 * etiketler, JSON'la eklenen yeni ikili, replay ve eski sürüm.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { surfaceEvent, surfacesAt } from './surfaces';
import { INTERACTIONS, hexResolverOn, previewHexEffects, reactionHurtsSide, resolveHexEffects, spellTags, layerOf, type Incoming, type InteractionRow } from './hexResolver';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone, SurfaceKind } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

function arena(opts: { tiles?: string[]; kuralSurumu?: number; pos?: Record<string, Offset> } = {}): BattleState {
  const a = mk('A', { ownerId: 'p1', spellNames: ['Fire Bolt', 'Fireball'], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 11, hp: 80, maxHp: 80 });
  const b = mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5, saves: LOW });
  const c = mk('C', { ownerId: 'p1', hp: 200, maxHp: 200, saves: LOW });
  const st = startBattle('k55', 'd-z-zemin', [a, b, c], () => 0.5, { map: { id: 'col' }, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const at: Record<string, Offset> = { A: o(1, 1), B: o(5, 3), C: o(12, 5), ...opts.pos };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c0]) => [id, { ...(c0 as Combatant), pos: at[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(st.map as NonNullable<BattleState['map']>), tiles: opts.tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: [] } } as BattleState;
}
const surf = (s: BattleState, kind: SurfaceKind, hexes: Offset[]) => applyEvents(s, [surfaceEvent(s, kind, hexes, 'gm', 'enemies')]);
const spellZone = (s: BattleState, spellId: string, hexes: Offset[], extra: Partial<SpellZone> = {}): BattleState => applyEvents(s, [{ type: 'zone_created', zone: {
  id: `${spellId}:z`, spellId, name: spellId, casterId: 'A', side: 'party', dc: 13, slotLevel: 1, hexes, ...extra } }]);
const el = (element: string, hexes: Offset[], extra: Partial<Extract<Incoming, { kind: 'element' }>> = {}): Incoming =>
  ({ kind: 'element', element, hexes, actorId: 'A', dc: 15, damage: 10, hitIds: [], label: 'test', ...extra });
const resolve = (s: BattleState, inc: Incoming[], rng: Rng = high, rows?: InteractionRow[]) => {
  const r = resolveHexEffects(s, inc, rng, rows ? { rows } : {});
  return { ...r, state: applyEvents(s, r.events) };
};
const kinds = (s: BattleState, h: Offset) => surfacesAt(s, h).map((z) => z.surface).sort();
const spellAt = (s: BattleState, id: string, h: Offset) => (s.map?.zones ?? []).some((z) => !z.surface && z.spellId === id && z.hexes.some((x) => x.col === h.col && x.row === h.row));
const createdIn = (s: BattleState, ev: BattleEvent[]): Incoming[] => ev.filter((e) => e.type === 'zone_created').map((e) => ({ kind: 'zone', zoneId: (e as { zone: SpellZone }).zone.id }));

describe('K55 tablo ve etiketler', () => {
  it('çalışan her satırın tetik, kapsam, tepkime ve işleyicisi tanınır; anahtar satırları kural-kontrol\'de', async () => {
    const control = (await import('../../data/kural-kontrol.json')).default as unknown as { rules: Record<string, unknown> };
    const known = new Set(['gres', 'patlama', 'zincir', 'tasma', 'agCoz', 'agYak', 'yayilma']);
    for (const r of INTERACTIONS) {
      expect(r.id).toBeTruthy();
      expect(['element', 'olusan', 'turBasi', 'buyu', 'hareket']).toContain(r.tetik);
      if (r.isleyici) expect(known.has(r.isleyici)).toBe(true);
      for (const g of r.gate) if (g.tur === 'anahtar' || g.tur === 'anahtarDegil') expect(JSON.stringify(control)).toContain(`"${g.id}"`);
    }
    expect(new Set(INTERACTIONS.map((r) => r.id)).size).toBe(INTERACTIONS.length);
  });
  it('etiketler: Fireball ateş + alan; etiketsiz büyü etkileşimsiz; katmanlar', () => {
    expect(spellTags('fireball').element).toContain('fire');
    expect(spellTags('fireball').tur).toContain('alan');
    expect(spellTags('yok-boyle-buyu')).toEqual({ element: [], tur: [] });
    expect(layerOf('oil')).toBe('zemin');
    expect(layerOf('steam')).toBe('gaz');
    expect(layerOf('burningWeb')).toBe('nesne');
  });
  it('çözücü sürüm 26 ve anahtarla açık; sürüm 25 savaşında kapalı', () => {
    expect(hexResolverOn(arena())).toBe(true);
    expect(hexResolverOn(arena({ kuralSurumu: 25 }))).toBe(false);
  });
});

describe('K55 element × yüzey satırları', () => {
  it('fireOil: bütün yağ birikintisi alev (2 tur)', () => {
    const s = surf(arena(), 'oil', [o(3, 3), o(4, 3)]);
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(kinds(r.state, o(4, 3))).toEqual(['fire']);
    expect(r.reactions).toContain('fireOil');
    const fire = r.state.map!.zones!.find((z) => z.surface === 'fire')!;
    expect(fire.until).toBe(s.round + 1);
  });
  it('fireWeb: değen ağ altıgeni yanan ağ, konsantrasyona bağlı', () => {
    const a0 = arena();
    const s = spellZone({ ...a0, combatants: { ...a0.combatants, A: { ...(a0.combatants.A as Combatant), concentration: { spell: 'Web' } as never } } }, 'web', [o(3, 3), o(4, 3)], { concentration: 'Web' });
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['burningWeb']);
    expect(spellAt(r.state, 'web', o(4, 3))).toBe(true);
    expect(r.state.map!.zones!.find((z) => z.surface === 'burningWeb')?.concentration).toBe('Web');
  });
  it('fireIce + fireWater: buz erir (su) ve aynı adımda buhar (öncelik ve tablo sırası)', () => {
    const s = surf(arena(), 'ice', [o(3, 3)]);
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['steam', 'water']);
    expect(r.reactions.indexOf('fireIce')).toBeLessThan(r.reactions.indexOf('fireWater'));
  });
  it('fireGrease: gres alev olur, içindeki bir kez yanar', () => {
    const s = spellZone(arena({ pos: { B: o(3, 3) } }), 'grease', [o(3, 3), o(4, 3)]);
    const r = resolve(s, [el('fire', [o(4, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['fire']);
    expect(r.state.combatants.B!.hp).toBeLessThan(500);
  });
  it('fireFog: sis buharlaşır', () => {
    const s = spellZone(arena(), 'fog-cloud', [o(3, 3), o(4, 3)]);
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(spellAt(r.state, 'fog-cloud', o(3, 3))).toBe(false);
    expect(spellAt(r.state, 'fog-cloud', o(4, 3))).toBe(true);
  });
  it('coldWater ve coldTile: su yüzeyi ve sığ su zemini donar', () => {
    const tiles = Array.from({ length: 7 }, (_, r) => (r === 3 ? '..n' + '.'.repeat(12) : '.'.repeat(15)));
    const s = surf(arena({ tiles }), 'water', [o(4, 3)]);
    const r = resolve(s, [el('cold', [o(2, 3), o(4, 3)])]);
    expect(kinds(r.state, o(4, 3))).toEqual(['ice']);
    expect(kinds(r.state, o(2, 3))).toEqual(['ice']);
  });
  it('coldSteam: buhar yoğuşur, su', () => {
    const r = resolve(surf(arena(), 'steam', [o(3, 3)]), [el('cold', [o(3, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['water']);
  });
  it('lightningIce: buz çatlar', () => {
    const r = resolve(surf(arena(), 'ice', [o(3, 3)]), [el('lightning', [o(3, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual([]);
  });
  it('lightningOil ve lightningGrease: yıldırım tutuşturur', () => {
    const s = spellZone(surf(arena(), 'oil', [o(3, 3)]), 'grease', [o(6, 3)]);
    const r = resolve(s, [el('lightning', [o(3, 3), o(6, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['fire']);
    expect(kinds(r.state, o(6, 3))).toEqual(['fire']);
  });
  it('lightningWater: bağlı suda DEX save\'li hasar (zincir)', () => {
    const s = surf(arena({ pos: { B: o(5, 3) } }), 'water', [o(3, 3), o(4, 3), o(5, 3)]);
    const r = resolve(s, [el('lightning', [o(3, 3)], { damage: 20 })]);
    expect(r.reactions).toContain('lightningWater');
    expect(r.state.combatants.B!.hp).toBeLessThan(500);
  });
  it('forceWater: su bir halka taşar', () => {
    const s = surf(arena(), 'water', [o(5, 3)]);
    const r = resolve(s, [el('thunder', [o(5, 3)])]);
    expect(r.state.map!.zones!.find((z) => z.surface === 'water')!.hexes.length).toBe(7);
  });
  it('acidWeb: ağ erir, tutsak kurtulur', () => {
    let s = spellZone(arena({ pos: { B: o(3, 3) } }), 'web', [o(3, 3)]);
    s = applyEvents(s, [{ type: 'effect_added', targetId: 'B', effect: { id: 'web:web:z', name: 'Web', sourceId: 'A', until: 9 } }]);
    const r = resolve(s, [el('acid', [o(3, 3)])]);
    expect(r.state.combatants.B!.effects?.some((e) => e.id === 'web:web:z')).toBeFalsy();
    expect(spellAt(r.state, 'web', o(3, 3))).toBe(false);
  });
  it('firePoison: varsayılan anahtarla (mixPoisonInert) patlamaz', () => {
    const r = resolve(surf(arena(), 'poison', [o(3, 3)]), [el('fire', [o(3, 3)])]);
    expect(r.reactions).not.toContain('firePoison');
    expect(kinds(r.state, o(3, 3))).toEqual(['poison']);
  });
});

describe('K55 yüzey × yüzey satırları (oluşan)', () => {
  const created = (s0: BattleState, kind: SurfaceKind, hexes: Offset[]) => {
    const ev = surfaceEvent(s0, kind, hexes, 'gm', 'enemies');
    const s = applyEvents(s0, [ev]);
    return resolve(s, createdIn(s, [ev]));
  };
  it('waterFire: su alevi söndürür, buhar', () => {
    const r = created(surf(arena(), 'fire', [o(3, 3)]), 'water', [o(3, 3)]);
    expect(kinds(r.state, o(3, 3))).toEqual(['steam', 'water']);
  });
  it('waterGrease ve waterPoison: süre kısalır (2 / 1 tur)', () => {
    let s = spellZone(arena(), 'grease', [o(3, 3)], { until: 20 });
    s = surf(s, 'poison', [o(4, 3)]);
    const r = created(s, 'water', [o(3, 3), o(4, 3)]);
    expect(r.state.map!.zones!.find((z) => z.spellId === 'grease')!.until).toBe(s.round + 1);
    expect(r.state.map!.zones!.find((z) => z.surface === 'poison')!.until).toBe(s.round);
  });
  it('waterWeb: ağ çözülür', () => {
    const r = created(spellZone(arena(), 'web', [o(3, 3)]), 'water', [o(3, 3)]);
    expect(spellAt(r.state, 'web', o(3, 3))).toBe(false);
  });
  it('oilSpread: alev bitişik yağı tutuşturur, üstündeki aynı kaynaktan bir kez yanar', () => {
    const s = surf(arena({ pos: { B: o(4, 3) } }), 'oil', [o(4, 3)]);
    const r = created(s, 'fire', [o(3, 3)]);
    expect(kinds(r.state, o(4, 3))).toEqual(['fire']);
    expect(r.reactions).toContain('oilSpread');
  });
  it('douse: söndüren alan (Sleet Storm) alevi söndürür', () => {
    const s0 = surf(arena(), 'fire', [o(3, 3)]);
    const ev: BattleEvent = { type: 'zone_created', zone: { id: 'sleet:z', spellId: 'sleet-storm', name: 'Sleet Storm', casterId: 'A', side: 'party', dc: 15, slotLevel: 3, hexes: [o(3, 3)] } };
    const s = applyEvents(s0, [ev]);
    const r = resolve(s, createdIn(s, [ev]));
    expect(kinds(r.state, o(3, 3))).toEqual([]);
  });
});

describe('K55 öncelik, katman, zincir, engel', () => {
  it('katman: aynı zemin katmanında yeni yüzey eskinin yerine geçer (yağ suyun üstüne)', () => {
    const s0 = surf(arena(), 'water', [o(3, 3), o(4, 3)]);
    const ev = surfaceEvent(s0, 'oil', [o(3, 3)], 'gm', 'enemies');
    const s = applyEvents(s0, [ev]);
    const r = resolve(s, createdIn(s, [ev]));
    expect(kinds(r.state, o(3, 3))).toEqual(['oil']);
    expect(kinds(r.state, o(4, 3))).toEqual(['water']);
    expect(r.events.some((e) => e.type === 'surface_reacted' && e.reaction === 'replace')).toBe(true);
  });
  it('katmanlar arası birlikte durur: buhar (gaz) suyun (zemin) üstünde', () => {
    const r = resolve(surf(arena(), 'water', [o(3, 3)]), [el('fire', [o(3, 3)])]);
    expect(kinds(r.state, o(3, 3))).toEqual(['steam', 'water']);
  });
  it('zincir derinliği 3: art arda bitişik yağ birikintileri; sınırı aşan "zincir sınırı" olarak yazılır', () => {
    let s = arena();
    for (const c of [3, 4, 5, 6, 7]) s = surf(s, 'oil', [o(c, 3)]);
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(kinds(r.state, o(5, 3))).toEqual(['fire']);
    expect(r.chainLimited).toBe(true);
    expect(r.events.some((e) => e.type === 'surface_reacted' && e.reaction === 'chainLimit')).toBe(true);
    expect(kinds(r.state, o(6, 3))).toEqual(['oil']);
  });
  it('döngü engeli: zincirde aynı ikili aynı altıgende turda bir kez', () => {
    let s = arena();
    s = surf(s, 'oil', [o(3, 3)]);
    s = surf(s, 'oil', [o(4, 3)]);
    const r1 = resolve(s, [el('fire', [o(3, 3)])]);
    const keys = r1.state.hexReacted?.keys ?? [];
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('engel: katı engel altıgenindeki yüzey tepkimeye girmez', () => {
    let s = surf(arena(), 'oil', [o(3, 3)]);
    s = applyEvents(s, [{ type: 'zone_created', zone: { id: 'wall:z', spellId: 'cizili-duvar', name: 'Duvar', casterId: 'A', side: 'party', dc: 10, slotLevel: 0, hexes: [o(3, 3)],
      barrier: { kind: 'cizili-duvar', blocksMove: true, blocksSight: true, passFor: 'none' } as never } }]);
    const r = resolve(s, [el('fire', [o(3, 3)])]);
    expect(r.reactions).toEqual([]);
  });
  it('JSON ile eklenen yeni ikili kod gerektirmez (genel sonuç)', () => {
    const extra: InteractionRow = { id: 'testPsychicFog', oncelik: 3, tetik: 'element', a: { element: ['psychic'] }, b: { alan: ['fog-cloud'] }, tepkime: 'fogBurn',
      gate: [{ tur: 'srd' }], kapsam: 'degen', sonuc: { kaldir: true, yuzey: 'poison' } };
    const s = spellZone(arena(), 'fog-cloud', [o(3, 3)]);
    const r = resolve(s, [el('psychic', [o(3, 3)])], high, [extra]);
    expect(kinds(r.state, o(3, 3))).toEqual(['poison']);
  });
});

describe('K55 komut, önizleme, replay, eski sürüm', () => {
  const run = (s: BattleState, cmd: Command, ctx = P1) => { const r = execute(s, cmd, ctx, high); if (!r.ok) throw new Error(r.error); return r; };
  it('Fire Bolt yağdaki düşmana: tutuşma günlükte satır (tablo satırı kimliği ile); replay aynı', () => {
    const s0 = run(arena(), { type: 'place_surface', kind: 'oil', hexes: [o(5, 3), o(6, 3)] }, GM).state;
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' });
    const ev = r.events.find((e) => e.type === 'surface_reacted') as Extract<BattleEvent, { type: 'surface_reacted' }>;
    expect(ev.row).toBe('fireOil');
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
  });
  it('sürüm 25 savaşı eski geçişlerle (tablo satırı kimliği yok), sonuç aynı', () => {
    const s0 = run(arena({ kuralSurumu: 25 }), { type: 'place_surface', kind: 'oil', hexes: [o(5, 3)] }, GM).state;
    const r = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' });
    const ev = r.events.find((e) => e.type === 'surface_reacted') as Extract<BattleEvent, { type: 'surface_reacted' }>;
    expect(ev.reaction).toBe('ignite');
    expect(ev.row).toBeUndefined();
    expect(kinds(r.state, o(5, 3))).toEqual(['fire']);
  });
  it('kuru çalıştırma: Fireball gresi tutuşturur ve içindeki dostu yakar (yapay zekâ bunu görür)', () => {
    const s = spellZone(arena({ pos: { C: o(4, 3) } }), 'grease', [o(3, 3), o(4, 3)]);
    const p = previewHexEffects(s, 'A', 'fire', [o(3, 3)]);
    expect(p.reactions).toContain('fireGrease');
    expect(p.damaged).toContain('C');
    expect(p.surfaces).toContain('fire');
    expect(s.map!.zones!.some((z) => z.spellId === 'grease')).toBe(true);
    const r = resolveHexEffects(s, [el('fire', [o(3, 3)])], high);
    expect(reactionHurtsSide(s, r.events, 'party')).toBe(true);
  });
});
