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
    // Tek alev altıgeninin etrafından dolaşılır; sütunun tamamı alevse içinden geçilir.
    const single = field({ id: 'volkan' }, [A(), B()], { A: o(2, 3), B: o(12, 3) }, board('.', [[o(3, 3), 'f']]));
    expect(effects(ok(execute(single, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted())).events)).toEqual([]);
    const wall = board('.', Array.from({ length: 7 }, (_, row) => [o(3, row), 'f'] as [Offset, string]));
    const walk = ok(execute(field({ id: 'volkan' }, [A(), B()], { A: o(2, 3), B: o(12, 3) }, wall), { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted([6, 2])));
    expect(effects(walk.events, 'fire')[0]?.damage?.raw).toBe(2);
    let s = single;
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

describe('Bataklık (bog)', () => {
  const swamp = (a: Partial<Combatant> = {}, extra: Combatant[] = [], pos: Record<string, Offset> = {}) =>
    field({ id: 'bataklik' }, [A(a), B(), ...extra], { A: o(3, 3), B: o(12, 3), ...pos }, board('.', [[o(4, 3), 'b'], [o(5, 3), '.']]));
  it('girince Poisoned, sayaç 1, hareket biter; girmek 3 altıgen; batakta yürünmez', () => {
    const r = ok(execute(swamp(), { type: 'move', actorId: 'A', to: o(4, 3) }, P1, scripted()));
    expect(r.events[0]).toMatchObject({ type: 'moved', cost: 3 });
    expect(r.state.combatants.A?.conditions).toEqual(['Poisoned']);
    expect(r.state.combatants.A?.mapStatus.sink).toBe(1);
    expect(errorOf(execute(r.state, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, scripted()))).toContain('Batağa saplandı');
  });
  it('kendi turunun başında 1d6 zehir, sayaç +1; sayaç 3\'te boğulur (oyuncu ölüm save\'lerine)', () => {
    let s = swamp({}, [], { A: o(4, 3) });
    s = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), mapStatus: { sink: 2, lingeringPoison: false } } } };
    s = endTurn(s, 'A').state; // sıra B'de
    const r = endTurn(s, 'B', scripted([6, 2]));
    const bog = effects(r.events, 'bog');
    expect(bog[0]).toMatchObject({ mapStatus: { sink: 3 }, damage: { raw: 2, type: 'poison' } });
    expect(bog[1]?.text).toBe('boğuldu');
    expect(r.state.combatants.A).toMatchObject({ hp: 0, life: 'dying' });
  });
  it('Çık: Athletics DC 12; başarıda en yakın sağlam altıgene, kalıcı zehir başlar; eylem harcar', () => {
    const s = swamp({ skills: { athletics: 5 }, mapStatus: { sink: 1, lingeringPoison: false } }, [], { A: o(4, 3) });
    const fail = ok(execute(s, { type: 'escape', actorId: 'A' }, P1, scripted([20, 6])));
    expect(fail.state.combatants.A?.pos).toEqual(o(4, 3));
    const win = ok(execute(s, { type: 'escape', actorId: 'A' }, P1, scripted([20, 7])));
    expect(win.state.combatants.A).toMatchObject({ mapStatus: { sink: 0, lingeringPoison: true } });
    expect(win.state.combatants.A?.pos).not.toEqual(o(4, 3));
    expect(errorOf(execute(win.state, { type: 'escape', actorId: 'A' }, P1, scripted()))).toBe('Eylem bu tur kullanıldı.');
    expect(errorOf(execute(swamp(), { type: 'escape', actorId: 'A' }, P1, scripted()))).toBe('Batağa saplanmış değil.');
  });
  it('Çek: bitişik müttefik Athletics DC 12 ile çeker; kendine yakın altıgene çıkar', () => {
    const C = mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, mapStatus: { sink: 2, lingeringPoison: false } });
    const s = field({ id: 'bataklik' }, [A({ skills: { athletics: 4 } }), B(), C], { A: o(3, 3), B: o(12, 3), C: o(4, 3) },
      board('.', [[o(4, 3), 'b']]));
    const r = ok(execute(s, { type: 'pull', actorId: 'A', targetId: 'C' }, P1, scripted([20, 8])));
    const pos = r.state.combatants.C?.pos as Offset;
    expect(r.state.combatants.C?.mapStatus.sink).toBe(0);
    expect(Math.max(Math.abs(pos.col - 3), Math.abs(pos.row - 3))).toBeLessThanOrEqual(1);
    expect(errorOf(execute(s, { type: 'pull', actorId: 'A', targetId: 'B' }, P1, scripted()))).toBe('Yalnızca bir müttefik çekilebilir.');
  });
  it('kalıcı zehir: tur başı 1d4, tur sonu CON DC 12 ile biter (Poisoned kalkar)', () => {
    const s = swamp({ conditions: ['Poisoned'], mapStatus: { sink: 0, lingeringPoison: true } }, [], { A: o(2, 3) });
    const end = endTurn(s, 'A', scripted([20, 14]));
    expect(effects(end.events, 'bog')[0]?.roll?.success).toBe(true);
    expect(end.state.combatants.A).toMatchObject({ conditions: [], mapStatus: { lingeringPoison: false } });
    const start = endTurn(endTurn(s, 'A', scripted([20, 2])).state, 'B', scripted([4, 3]));
    expect(effects(start.events, 'bog')[0]?.damage?.raw).toBe(3);
  });
});

describe('su, buz ve tuzak', () => {
  it('derin su: ağır zırhlı tur başında Athletics DC 12, başarısızsa batma sayacı; sudan çıkınca sıfırlanır', () => {
    const s = field({ id: 'ada' }, [B(), A({ heavyArmor: true })], { A: o(4, 3), B: o(12, 3) }, board('.', [[o(4, 3), 'w']]));
    const r = endTurn(s, 'B', scripted([20, 5]));
    expect(r.state.combatants.A?.mapStatus.sink).toBe(1);
    const out = ok(execute(r.state, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, scripted()));
    expect(out.state.combatants.A?.mapStatus.sink).toBe(0);
    const light = field({ id: 'ada' }, [B(), A()], { A: o(4, 3), B: o(12, 3) }, board('.', [[o(4, 3), 'w']]));
    expect(effects(endTurn(light, 'B').events)).toEqual([]);
  });
  it('hendek (kale): sığ suda ağır zırhlı aynı batma kuralı', () => {
    const s = field({ id: 'kale' }, [B(), A({ heavyArmor: true })], { A: o(4, 3), B: o(12, 3) }, board('.', [[o(4, 3), 'n']]));
    expect(endTurn(s, 'B', scripted([20, 3])).state.combatants.A?.mapStatus.sink).toBe(1);
  });
  it('buz: girince DEX DC 10, başarısızsa Prone ve yürüyüş biter', () => {
    // 5. sütun baştan sona buz: yürüyüş mutlaka oradan geçer.
    const tiles = board('.', Array.from({ length: 7 }, (_, row) => [o(4, row), 'i'] as [Offset, string]));
    const s = field({ id: 'buzul' }, [A(), B()], { A: o(3, 3), B: o(12, 3) }, tiles);
    const slip = ok(execute(s, { type: 'move', actorId: 'A', to: o(6, 3) }, P1, scripted([20, 4])));
    expect(slip.state.combatants.A?.pos?.col).toBe(4);
    expect(slip.state.combatants.A?.conditions).toEqual(['Prone']);
    expect(errorOf(execute(slip.state, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, scripted()))).toContain('Hareket yetmiyor');
    const fine = ok(execute(s, { type: 'move', actorId: 'A', to: o(6, 3) }, P1, scripted([20, 15])));
    expect(fine.state.combatants.A?.pos).toEqual(o(6, 3));
  });
  it('soğuk (buzul): barınaksızsa tur sonunda CON DC 12, 1d4 soğuk', () => {
    const s = field({ id: 'buzul' }, [A(), B()], { A: o(7, 3), B: o(12, 3) }, board('.'));
    const r = endTurn(s, 'A', scripted([20, 3], [4, 2]));
    expect(effects(r.events, 'cold')[0]?.damage).toMatchObject({ raw: 2, type: 'cold' });
    const shelter = field({ id: 'buzul' }, [A(), B()], { A: o(7, 3), B: o(12, 3) }, board('.', [[o(8, 3), 'h']]));
    expect(effects(endTurn(shelter, 'A').events)).toEqual([]);
  });
  it('tuzak: basan DEX DC 13, başarısızsa 2d6 delici, bir kez; Ara ile Perception DC 13 bulunur', () => {
    const tiles = board('.', [[o(5, 3), 'j']]);
    const s = field({ id: 'dungeon' }, [A(), B()], { A: o(3, 3), B: o(12, 3) }, tiles);
    const step = ok(execute(s, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, scripted([20, 5], [6, 3], [6, 4])));
    expect(step.state.combatants.A).toMatchObject({ pos: o(5, 3), hp: 23 });
    expect(step.state.map?.trapsSprung).toEqual(['5,3']);
    const again = field({ id: 'dungeon' }, [A({ pos: o(4, 3) }), B()], { A: o(4, 3), B: o(12, 3) }, tiles);
    const sprung = { ...again, map: { ...(again.map as NonNullable<BattleState['map']>), trapsSprung: ['5,3'] } };
    expect(ok(execute(sprung, { type: 'move', actorId: 'A', to: o(6, 3) }, P1, scripted())).state.combatants.A?.pos).toEqual(o(6, 3));
    const found = ok(execute(s, { type: 'search', actorId: 'A' }, P1, scripted([20, 13])));
    expect(found.state.map?.trapsFound).toEqual(['5,3']);
    expect(ok(execute(s, { type: 'search', actorId: 'A' }, P1, scripted([20, 12]))).state.map?.trapsFound).toBeUndefined();
  });
});

describe('karanlık', () => {
  // Zindan, karanlık açık: kuralda ışık yok; kristal (e) 4 altıgen aydınlatır.
  const dark = (a: Partial<Combatant>, b: Partial<Combatant>, aPos: Offset, bPos: Offset, tiles = board('.')) =>
    field({ id: 'dungeon', options: ['darkness'] }, [A(a), B(b)], { A: aPos, B: bPos }, tiles);
  const attack = (s: BattleState, rng = scripted([20, 15], [8, 1])) =>
    execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, rng);
  it('ışıksız hedef 3 altıgenden uzaksa görülmez; karanlık görüşle 12; ışıktaki hedef görülür', () => {
    expect(errorOf(attack(dark({}, {}, o(1, 3), o(6, 3))))).toBe('Karanlık: B görülmüyor.');
    expect(attack(dark({ darkvision: 60 }, {}, o(1, 3), o(6, 3))).ok).toBe(true);
    expect(errorOf(attack(dark({ darkvision: 60 }, {}, o(0, 3), o(13, 3))))).toBe('Karanlık: B görülmüyor.');
    expect(attack(dark({}, {}, o(3, 3), o(6, 3))).ok).toBe(true);
    expect(attack(dark({}, {}, o(1, 3), o(10, 3), board('.', [[o(12, 3), 'e']]))).ok).toBe(true);
  });
  it('hedef saldıranı göremiyorsa saldırı avantajlı', () => {
    const r = ok(attack(dark({ darkvision: 60 }, {}, o(1, 3), o(6, 3)), scripted([20, 15], [20, 3], [8, 1])));
    expect(r.events[0]).toMatchObject({ mode: 'advantage' });
    expect((r.events[0] as { reasons: string[] }).reasons).toContain('Karanlıktan saldıran');
  });
  it('isteğe bağlı karanlık kapalıyken etkisiz', () => {
    const s = field({ id: 'dungeon' }, [A(), B()], { A: o(1, 3), B: o(9, 3) }, board('.'));
    expect(attack(s).ok).toBe(true);
  });
});

describe('kale', () => {
  it('mazgal: surdakine (h/z) aşağıdan menzilli saldırıda 3/4 siper; yakın dövüşte yok', () => {
    const s = field({ id: 'kale' }, [A(), B()], { A: o(3, 3), B: o(6, 3) }, board('.', [[o(6, 3), 'h']]));
    const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 15], [8, 1])));
    expect(r.events[0]).toMatchObject({ cover: 5, targetAc: 17 });
    const same = field({ id: 'kale' }, [A(), B()], { A: o(3, 3), B: o(6, 3) }, board('h'));
    expect(ok(execute(same, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 15], [8, 1]))).events[0]).not.toHaveProperty('cover');
  });
  it('kapı: GM kapatır (geçilmez), açar; kapalı kapı kırılır (AC 15, HP 30)', () => {
    const gate = o(8, 3);
    const tiles = board('.', [[gate, 'o']]);
    let s = field({ id: 'kale' }, [A(), B()], { A: o(7, 3), B: o(12, 3) }, tiles);
    expect(errorOf(execute(s, { type: 'gate', at: gate, open: false }, P1, scripted()))).toBe('Kapıyı yalnızca GM açıp kapatır.');
    s = ok(execute(s, { type: 'gate', at: gate, open: false }, GM, scripted())).state;
    expect(s.map?.tiles[3]?.[8]).toBe('O');
    expect(errorOf(execute(s, { type: 'move', actorId: 'A', to: gate }, P1, scripted()))).toContain('geçilmez');
    const big = { ...sword, damage: '10d6' };
    const hit = ok(execute(s, { type: 'attack_gate', actorId: 'A', at: gate, option: big }, P1, scripted([20, 15], ...Array.from({ length: 10 }, () => [6, 3] as [number, number]))));
    expect(hit.state.map?.gates?.['8,3']).toEqual({ state: 'broken', hp: 0 });
    expect(hit.state.map?.tiles[3]?.[8]).toBe('o');
    expect(errorOf(execute(hit.state, { type: 'gate', at: gate, open: false }, GM, scripted()))).toBe('Kapı kırık: kapanmaz.');
    const reopened = ok(execute(s, { type: 'gate', at: gate, open: true }, GM, scripted()));
    expect(reopened.state.map?.tiles[3]?.[8]).toBe('o');
  });
});

describe('masumları koru', () => {
  const tavern = (n?: number) => {
    const { state } = startBattle('t', 'd-z-zemin', [A(), B()], scripted(...Array.from({ length: 10 }, () => [20, 10] as [number, number])),
      { map: { id: 'taverna', options: ['objective'], ...(n ? { civilians: n } : {}) } });
    return state;
  };
  it('açılınca 4–6 masum eklenir (HP 4, AC 10, 30 ft); en az yarısı hayatta kalmalı', () => {
    const s = tavern(9);
    const civ = Object.values(s.combatants).filter((c) => c.civilian);
    expect(civ).toHaveLength(6);
    expect(civ[0]).toMatchObject({ hp: 4, ac: 10, speed: 30, side: 'party' });
    expect(s.map?.objective).toEqual({ total: 6, needed: 3 });
    expect(Object.values(tavern().combatants).filter((c) => c.civilian)).toHaveLength(4);
    const off = startBattle('t', 'd-z-zemin', [A(), B()], scripted([20, 10], [20, 9]), { map: { id: 'taverna' } }).state;
    expect(Object.values(off.combatants).some((c) => c.civilian)).toBe(false);
  });
  it('masumu GM yönetir; 0 HP\'de ölür (ölüm save\'i yok); gerekenin altına düşünce düşmanlar kazanır', () => {
    let s = tavern(4); // 2 masum gerekli
    const ids = Object.values(s.combatants).filter((c) => c.civilian).map((c) => c.id);
    expect(errorOf(execute(s, { type: 'place', actorId: ids[0] as string, at: o(5, 3) }, P1, scripted()))).toBe('Bu savaşçıyı yönetme yetkin yok.');
    expect(ok(execute(s, { type: 'place', actorId: ids[0] as string, at: o(5, 3) }, GM, scripted())).ok).toBe(true);
    const positions: Record<string, Offset> = { A: o(2, 3), B: o(12, 3) };
    ids.forEach((id, i) => { positions[id] = o(4 + i, 4); });
    const combatants = { ...s.combatants };
    for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
    const killed = (id: string) => ({ ...(combatants[id] as Combatant), hp: 0 });
    s = { ...s, status: 'active', combatants: { ...combatants, [ids[0] as string]: killed(ids[0] as string), [ids[1] as string]: killed(ids[1] as string) } };
    const turnOf = s.order[s.turnIndex] as string;
    const ctx = s.combatants[turnOf]?.side === 'enemies' || s.combatants[turnOf]?.civilian ? GM : P1;
    // Üçüncü masum da düşerse 1 < 2: düşmanlar kazanır.
    const r = ok(execute(s, { type: 'adjust_hp', targetId: ids[2] as string, hp: 0 }, GM, scripted()));
    expect(r.state.combatants[ids[2] as string]?.life).toBe('alive');
    expect(r.state.status).toBe('finished');
    expect(r.state.winner).toBe('enemies');
    expect(ctx).toBeDefined();
  });
});
