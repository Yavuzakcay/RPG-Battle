import { describe, it, expect } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { activeRules, inShade, optionalRules } from './maprules';
import { GM, P1, mk, scripted, sword } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });

function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}

/** Haritalı savaş: verilen harita/varyant ve altıgenler; sıra listedeki ilk savaşçıda. */
function field(
  map: { id: string; variantId?: string; options?: string[] }, parts: Combatant[], positions: Record<string, Offset>, tiles: string[],
): BattleState {
  const { state } = startBattle('m', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 30, maxHp: 30, ...p });
const bow = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] as [number, number] };

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
const effects = (events: BattleEvent[], rule?: string) =>
  events.filter((e): e is Extract<BattleEvent, { type: 'map_effect' }> => e.type === 'map_effect' && (!rule || e.rule === rule));
const endTurn = (s: BattleState, id: string, rng = scripted()) =>
  ok(execute(s, { type: 'end_turn', actorId: id }, id === 'B' ? GM : P1, rng));

describe('kural verisi', () => {
  it('varyantın kuralları; isteğe bağlı edilgen kurallar yalnızca açılınca', () => {
    const plain = field({ id: 'magara' }, [A(), B()], {}, board('.'));
    expect(activeRules(plain).map((r) => r.id)).toEqual(['darkness']);
    const dungeon = field({ id: 'dungeon' }, [A(), B()], {}, board('.'));
    expect(activeRules(dungeon).map((r) => r.id)).toEqual(['trap']);
    expect(optionalRules('dungeon', 'mesale').map((r) => r.id)).toEqual(['darkness']);
    const dark = field({ id: 'dungeon', options: ['darkness'] }, [A(), B()], {}, board('.'));
    expect(activeRules(dark).map((r) => r.id)).toEqual(['trap', 'darkness']);
  });
});

describe('Çöl', () => {
  it('gündüz: ağır zırhlı ve gölgesizse tur sonunda CON DC 12, başarısızsa 1d4 ateş', () => {
    const s = field({ id: 'col', variantId: 'gunduz' }, [A({ heavyArmor: true }), B()], { A: o(7, 3), B: o(12, 3) }, board('.'));
    const r = endTurn(s, 'A', scripted([20, 5], [4, 3]));
    const [heat] = effects(r.events, 'heat');
    expect(heat?.roll).toMatchObject({ dc: 12, total: 5, success: false });
    expect(r.state.combatants.A?.hp).toBe(27);
    // Gölgede (yanında kaya) veya ağır zırhsız: etki yok.
    const shade = field({ id: 'col', variantId: 'gunduz' }, [A({ heavyArmor: true }), B()], { A: o(7, 3), B: o(12, 3) }, board('.', [[o(7, 2), 'r']]));
    expect(inShade(shade, o(7, 3))).toBe(true);
    expect(effects(endTurn(shade, 'A').events)).toEqual([]);
    const light = field({ id: 'col', variantId: 'gunduz' }, [A(), B()], { A: o(7, 3), B: o(12, 3) }, board('.'));
    expect(effects(endTurn(light, 'A').events)).toEqual([]);
  });
  it('akşam fırtınası: 8 altıgenden uzağı görülmez, 4 altıgenden uzağa menzilli dezavantaj, gizlenmede avantaj', () => {
    const s = (bPos: Offset) => field({ id: 'col', variantId: 'aksam' }, [A(), B()], { A: o(1, 3), B: bPos }, board('.'));
    expect(errorOf(execute(s(o(10, 3)), { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted()))).toContain('Kum fırtınası');
    const far = ok(execute(s(o(7, 3)), { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 15], [20, 3], [8, 1])));
    expect(far.events[0]).toMatchObject({ mode: 'disadvantage' });
    const near = ok(execute(s(o(4, 3)), { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 15], [8, 1])));
    expect(near.events[0]).toMatchObject({ mode: 'normal' });
    const hide = ok(execute(s(o(12, 3)), { type: 'hide', actorId: 'A' }, P1, scripted([20, 3], [20, 16])));
    expect(hide.events[0]).toMatchObject({ mode: 'advantage', natural: 16 });
  });
});

describe('Volkan', () => {
  const volcano = (a: Offset, tiles = board('.', [[o(5, 3), '~']])) =>
    field({ id: 'volkan' }, [B(), A()], { A: a, B: o(12, 3) }, tiles); // sıra B'de, sonra A
  it('lav kenarı: lava bitişik altıgende tur başında 1d6 ateş (save yok); uçan etkilenmez', () => {
    const r = endTurn(volcano(o(4, 3)), 'B', scripted([6, 4]));
    expect(effects(r.events, 'lavaEdge')[0]?.damage).toMatchObject({ raw: 4, applied: 4, type: 'fire' });
    expect(r.state.combatants.A?.hp).toBe(26);
    expect(effects(endTurn(volcano(o(2, 3)), 'B').events)).toEqual([]);
    const flyer = field({ id: 'volkan' }, [B(), A({ fly: 30 })], { A: o(4, 3), B: o(12, 3) }, board('.', [[o(5, 3), '~']]));
    expect(effects(endTurn(flyer, 'B').events)).toEqual([]);
  });
  it('alev (f): girince ve turu içinde bitirince 1d6 ateş', () => {
    let s = field({ id: 'volkan' }, [A(), B()], { A: o(2, 3), B: o(12, 3) }, board('.', [[o(3, 3), 'f']]));
    const walk = ok(execute(s, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted([6, 2])));
    expect(effects(walk.events, 'fire')[0]?.damage?.raw).toBe(2);
    s = ok(execute(s, { type: 'move', actorId: 'A', to: o(3, 3) }, P1, scripted([6, 1]))).state;
    expect(effects(endTurn(s, 'A', scripted([6, 5])).events, 'fire')[0]?.damage?.raw).toBe(5);
  });
  it('patlama (GM): merkez ve çevresindeki herkes DEX DC 13, 4d6 ateş bir kez atılır, başarılıysa yarısı', () => {
    const s = field({ id: 'volkan' }, [A(), B(), mk('C', { ownerId: 'p2', hp: 30, maxHp: 30 })], { A: o(7, 3), B: o(8, 3), C: o(1, 1) }, board('.'));
    const trigger: Command = { type: 'map_trigger', rule: 'eruption', at: o(7, 3) };
    expect(errorOf(execute(s, trigger, P1, scripted()))).toBe('Harita olaylarını yalnızca GM tetikler.');
    const r = ok(execute(s, trigger, GM, scripted([6, 3], [6, 3], [6, 3], [6, 3], [20, 5], [20, 18])));
    const hit = effects(r.events, 'eruption');
    expect(hit.map((e) => [e.targetId, e.roll?.success, e.damage?.applied])).toEqual([['A', false, 12], ['B', true, 6]]);
    expect(r.state.combatants.C?.hp).toBe(30);
  });
  it('lav yükselmesi (GM): 4. turdan önce olmaz; uyarıdan sonraki tur başında kıyı lav olur, üstündeki ölür', () => {
    const tiles = board('~', [[o(2, 3), '.'], [o(3, 3), '.'], [o(4, 3), '.'], [o(12, 3), '.']]);
    let s = field({ id: 'volkan' }, [A(), B()], { A: o(3, 3), B: o(12, 3) }, tiles);
    expect(errorOf(execute(s, { type: 'map_trigger', rule: 'lavaRise' }, GM, scripted()))).toContain('4. turdan');
    s = { ...s, round: 4 };
    const warned = ok(execute(s, { type: 'map_trigger', rule: 'lavaRise' }, GM, scripted()));
    expect(warned.state.map?.lavaWarning?.hexes).toHaveLength(4);
    s = endTurn(warned.state, 'A').state; // sıra B'de, tur 4
    const next = endTurn(s, 'B'); // tur 5 başlıyor
    expect(next.events.filter((e) => e.type === 'tile_changed')).toHaveLength(4);
    expect(next.state.map?.tiles[3]?.slice(2, 5)).toBe('~~~');
    expect(next.state.combatants.A?.life).toBe('dead');
    expect(next.state.map?.lavaWarning).toBeUndefined();
  });
});

describe('tırmanma ve dalga', () => {
  it('climb: bir seviye çıkmak 2, iki seviye 4 altıgen harcar; inmek normal', () => {
    const tiles = board('.', [[o(4, 3), 'h'], [o(5, 3), 'z']]);
    const s = field({ id: 'dag' }, [A(), B()], { A: o(3, 3), B: o(12, 3) }, tiles);
    expect(ok(execute(s, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted())).events[0]).toMatchObject({ cost: 2 });
    const top = field({ id: 'dag' }, [A(), B()], { A: o(4, 3), B: o(12, 3) }, tiles);
    expect(ok(execute(top, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, scripted())).events[0]).toMatchObject({ cost: 2 });
    const down = field({ id: 'dag' }, [A(), B()], { A: o(5, 3), B: o(12, 3) }, tiles);
    expect(ok(execute(down, { type: 'move', actorId: 'A', to: o(6, 3) }, P1, scripted())).events[0]).toMatchObject({ cost: 1 });
    const flat = field({ id: 'col' }, [A(), B()], { A: o(3, 3), B: o(12, 3) }, tiles);
    expect(ok(execute(flat, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted())).events[0]).toMatchObject({ cost: 1 });
  });
  it('dalga (gemi fırtınalı, GM): herkes DEX DC 12, başarısızsa Prone', () => {
    const s = field({ id: 'gemi', variantId: 'firtina' }, [A(), B()], { A: o(5, 3), B: o(9, 3) }, board('p'));
    const r = ok(execute(s, { type: 'map_trigger', rule: 'swell' }, GM, scripted([20, 4], [20, 15])));
    expect(r.state.combatants.A?.conditions).toEqual(['Prone']);
    expect(r.state.combatants.B?.conditions).toEqual([]);
    expect(errorOf(execute(field({ id: 'gemi' }, [A(), B()], {}, board('p')), { type: 'map_trigger', rule: 'swell' }, GM, scripted()))).toContain('olayı yok');
  });
  it('fırtına: 4 altıgenden uzağa menzilli saldırı dezavantajlı', () => {
    const s = field({ id: 'ada', variantId: 'firtina' }, [A(), B()], { A: o(1, 3), B: o(7, 3) }, board('.'));
    const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 15], [20, 3], [8, 1])));
    expect(r.events[0]).toMatchObject({ mode: 'disadvantage' });
    expect((r.events[0] as { reasons: string[] }).reasons).toContain('Fırtına');
  });
});

describe('yeniden kurma', () => {
  it('harita olayları baştan oynatılınca aynı durum çıkar', () => {
    const tiles = board('~', [[o(2, 3), '.'], [o(3, 3), '.'], [o(4, 3), 'f'], [o(12, 3), '.']]);
    let s: BattleState = { ...field({ id: 'volkan' }, [A(), B()], { A: o(2, 3), B: o(12, 3) }, tiles), round: 4 };
    const all: BattleEvent[] = [{ type: 'battle_started', state: s }];
    const go = (cmd: Command, ctx = GM, rng = scripted()) => {
      const r = ok(execute(s, cmd, ctx, rng));
      s = r.state;
      all.push(...r.events);
    };
    go({ type: 'map_trigger', rule: 'lavaRise' });
    go({ type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted([6, 2]));
    go({ type: 'end_turn', actorId: 'A' }, P1, scripted([6, 3], [6, 1], [6, 1]));
    go({ type: 'end_turn', actorId: 'B' }, GM, scripted([6, 1], [6, 1], [6, 1]));
    expect(replay(all)).toEqual(s);
  });
});
