import { describe, it, expect } from 'vitest';
import { applyEvents, combatantFromMonster, execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import type { Offset } from '../rules/hex';
import { GM, P1, mk, scripted } from './fixtures';
import { speedHexes } from './movement';

const o = (col: number, row: number): Offset => ({ col, row });

/** A (p1, parti) ve B (düşman) ile haritalı savaş; sıra A, B. */
function mapBattle(mapId = 'volkan', extra: Combatant[] = [], mirrored = false) {
  const parts = [mk('A', { ownerId: 'p1', initiativeBonus: 5 }), mk('B', { side: 'enemies' }), ...extra];
  return startBattle('m1', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number])), {
    map: { id: mapId, mirrored },
  });
}

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const run = (s: BattleState, cmd: Command, ctx: CommandContext) => execute(s, cmd, ctx, scripted());
const place = (s: BattleState, actorId: string, at: Offset, ctx: CommandContext) =>
  run(s, { type: 'place', actorId, at }, ctx);
const move = (s: BattleState, actorId: string, to: Offset, ctx: CommandContext = P1) =>
  run(s, { type: 'move', actorId, to }, ctx);

/** Kurulumu atlayıp savaşçıları istenen altıgenlere koyar (hareket kurallarını test etmek için). */
function activeAt(state: BattleState, positions: Record<string, Offset>): BattleState {
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) {
    const c = combatants[id];
    if (c) combatants[id] = { ...c, pos };
  }
  return { ...state, status: 'active', combatants };
}

describe('haritalı savaş kurulumu', () => {
  it('kurulum aşamasında başlar; ortam haritadan gelir, altıgenler durumda', () => {
    const { state } = mapBattle();
    expect(state.status).toBe('setup');
    expect(state.environmentId).toBe('volkan-lav');
    expect(state.map?.variantId).toBe('varsayilan');
    expect(state.map?.tiles[3]).toBe('~....~HHH~....~');
    expect(Object.values(state.combatants).every((c) => c.pos === null)).toBe(true);
  });
  it('haritasız savaş eskisi gibi doğrudan başlar', () => {
    const { state } = startBattle('x', 'd-z-zemin', [mk('A')], scripted());
    expect(state.status).toBe('active');
    expect(state.map).toBeUndefined();
  });
  it('aynalı harita aynalı altıgenlerle başlar', () => {
    const { state } = mapBattle('col', [], true);
    expect(state.map?.mirrored).toBe(true);
    expect(state.map?.tiles[0]).toBe([...'r...d.......d..'].reverse().join(''));
  });
  it('bilinmeyen varyant reddedilir', () => {
    expect(() => startBattle('x', 'd-z-zemin', [mk('A')], scripted(), { map: { id: 'col', variantId: 'yok' } })).toThrow();
  });
});

describe('place', () => {
  it('kendi başlangıç bölgesine yerleştirir, yeniden yerleştirmeye izin verir', () => {
    let s = mapBattle().state;
    s = ok(place(s, 'A', o(1, 1), P1)).state;
    expect(s.combatants.A?.pos).toEqual(o(1, 1));
    s = ok(place(s, 'A', o(2, 3), P1)).state;
    expect(s.combatants.A?.pos).toEqual(o(2, 3));
    s = ok(place(s, 'B', o(12, 2), GM)).state;
    expect(s.combatants.B?.pos).toEqual(o(12, 2));
  });
  it('bölge dışı, tehlikeli ve dolu altıgen reddedilir', () => {
    let s = mapBattle().state;
    expect(place(s, 'A', o(12, 2), P1).ok).toBe(false); // düşman bölgesi
    expect(place(s, 'A', o(3, 1), P1).ok).toBe(false); // alev (sütun 4, satır 2)
    expect(place(s, 'A', o(0, 1), P1).ok).toBe(false); // lav
    s = ok(place(s, 'A', o(1, 1), P1)).state;
    const both = mapBattle('volkan', [mk('C', { ownerId: 'p1' })]).state;
    const withA = ok(place(both, 'A', o(1, 1), P1)).state;
    const r = place(withA, 'C', o(1, 1), P1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('dolu');
  });
  it('yetki: oyuncu düşmanı, GM karakteri yerleştiremez', () => {
    const s = mapBattle().state;
    expect(place(s, 'B', o(12, 2), P1).ok).toBe(false);
    expect(place(s, 'A', o(1, 1), GM).ok).toBe(false);
  });
  it('savaş başladıktan sonra yerleştirme yok', () => {
    const s = activeAt(mapBattle().state, { A: o(1, 1), B: o(12, 2) });
    expect(place(s, 'A', o(2, 2), P1).ok).toBe(false);
  });
});

describe('start_battle', () => {
  it('yalnızca GM başlatır, herkes yerleşmeden başlamaz', () => {
    let s = mapBattle().state;
    s = ok(place(s, 'A', o(1, 1), P1)).state;
    const early = run(s, { type: 'start_battle' }, GM);
    expect(early.ok).toBe(false);
    if (!early.ok) expect(early.error).toContain('B');
    s = ok(place(s, 'B', o(12, 2), GM)).state;
    expect(run(s, { type: 'start_battle' }, P1).ok).toBe(false);
    s = ok(run(s, { type: 'start_battle' }, GM)).state;
    expect(s.status).toBe('active');
    expect(run(s, { type: 'start_battle' }, GM).ok).toBe(false);
  });
  it('kurulumda tur komutları reddedilir', () => {
    const s = mapBattle().state;
    const r = run(s, { type: 'end_turn', actorId: 'A' }, P1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('başlamadı');
  });
});

describe('move', () => {
  const at = (positions: Record<string, Offset>, mapId = 'volkan', extra: Combatant[] = []) =>
    activeAt(mapBattle(mapId, extra).state, positions);

  it('hedefe en ucuz yoldan yürür, hareket bütçesinden düşer', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    const r = ok(move(s, 'A', o(3, 3)));
    const ev = r.events[0];
    if (!ev || ev.type !== 'moved') throw new Error('beklenmeyen olay');
    expect(ev.cost).toBe(3);
    expect(ev.path[ev.path.length - 1]).toEqual(o(3, 3));
    expect(r.state.combatants.A?.pos).toEqual(o(3, 3));
    expect(r.state.combatants.A?.movementUsed).toBe(3);
  });
  it('hız 30 ft = 6 altıgen; bütçe aşılırsa reddedilir, kalan bütçe sonraki yürüyüşte kullanılır', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    expect(speedHexes(s.combatants.A as Combatant)).toBe(6);
    const first = ok(move(s, 'A', o(1, 5))).state; // sütun boyunca 4 altıgen
    expect(first.combatants.A?.movementUsed).toBe(4);
    const tooFar = move(first, 'A', o(3, 2)); // 4 altıgen gerekir, 2 kaldı
    expect(tooFar.ok).toBe(false);
    if (!tooFar.ok) expect(tooFar.error).toBe('Hareket yetmiyor: 4 altıgen gerekli, 2 kaldı.');
    const rest = ok(move(first, 'A', o(1, 3))).state; // kalan 2
    expect(rest.combatants.A?.movementUsed).toBe(6);
    expect(move(rest, 'A', o(1, 2)).ok).toBe(false); // bütçe bitti
  });
  it('lava gönüllü girilemez, engel geçilmez, harita dışı reddedilir', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    const lava = move(s, 'A', o(0, 2));
    expect(lava.ok).toBe(false);
    if (!lava.ok) expect(lava.error).toContain('lav');
    expect(move(s, 'A', o(0, 0)).ok).toBe(false); // dış kayalık
    expect(move(s, 'A', o(15, 0)).ok).toBe(false);
  });
  it('lavla çevrili adaya yürüyerek yol yok', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    const r = move(s, 'A', o(7, 3)); // ortadaki tepe
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('yol yok');
  });
  it('uçan yaratık lavın üstünden geçer ve uçuş hızını kullanır', () => {
    const wyvern = { ...combatantFromMonster(getMonster('wyvern'), { id: 'W' }) };
    const s = at({ A: o(1, 1), B: o(12, 2), W: o(12, 3) }, 'volkan', [wyvern]);
    expect(speedHexes(s.combatants.W as Combatant)).toBe(16);
    const turnW = { ...s, turnIndex: s.order.indexOf('W') };
    const r = ok(move(turnW, 'W', o(7, 3), GM));
    expect(r.state.combatants.W?.pos).toEqual(o(7, 3));
  });
  it('zorlu zemin 2 altıgen harcar (Çöl taşlığı)', () => {
    const s = at({ A: o(2, 6), B: o(13, 0) }, 'col');
    const r = ok(move(s, 'A', o(1, 6))); // taşlık
    const ev = r.events[0];
    expect(ev?.type === 'moved' && ev.cost).toBe(2);
  });
  it('düşmanın altıgeninden geçilmez, müttefikinkinden geçilir ama orada durulmaz', () => {
    // A (2,2) → (2,4): doğrudan yol (2,3)'ten geçer.
    const enemyIn = at({ A: o(2, 2), B: o(2, 3) });
    const around = ok(move(enemyIn, 'A', o(2, 4)));
    const ev = around.events[0];
    if (!ev || ev.type !== 'moved') throw new Error('beklenmeyen olay');
    expect(ev.path.some((h) => h.col === 2 && h.row === 3)).toBe(false);
    expect(ev.cost).toBe(3);

    const ally = mk('C', { ownerId: 'p2' });
    const allyIn = at({ A: o(2, 2), B: o(12, 2), C: o(2, 3) }, 'volkan', [ally]);
    const through = ok(move(allyIn, 'A', o(2, 4)));
    const ev2 = through.events[0];
    expect(ev2?.type === 'moved' && ev2.cost).toBe(2);
    expect(move(allyIn, 'A', o(2, 3)).ok).toBe(false); // dolu
  });
  it('Restrained hareket edemez; haritalı savaşta change_height yok', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    const held = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), conditions: ['Restrained'] } } };
    expect(move(held, 'A', o(2, 1)).ok).toBe(false);
    expect(run(s, { type: 'change_height', actorId: 'A', toHeight: 1 }, P1).ok).toBe(false);
  });
  it('yetki ve sıra: oyuncu düşmanı yürütemez, sırası olmayan yürüyemez', () => {
    const s = at({ A: o(1, 1), B: o(12, 2) });
    expect(move(s, 'B', o(12, 3), P1).ok).toBe(false);
    expect(move(s, 'B', o(12, 3), GM).ok).toBe(false); // sıra A'da
  });
  it('hareket bütçesi kendi turu gelince sıfırlanır', () => {
    let s = at({ A: o(1, 1), B: o(12, 2) });
    s = ok(move(s, 'A', o(3, 3))).state;
    s = ok(run(s, { type: 'end_turn', actorId: 'A' }, P1)).state;
    s = ok(run(s, { type: 'end_turn', actorId: 'B' }, GM)).state;
    expect(s.combatants.A?.movementUsed).toBe(0);
  });
  it('olaylar baştan oynatılınca aynı durum çıkar', () => {
    const start = mapBattle();
    let state = start.state;
    const all: BattleEvent[] = [...start.events];
    const go = (cmd: Command, ctx: CommandContext) => {
      const r = ok(run(state, cmd, ctx));
      state = r.state;
      all.push(...r.events);
    };
    go({ type: 'place', actorId: 'A', at: o(1, 1) }, P1);
    go({ type: 'place', actorId: 'B', at: o(12, 2) }, GM);
    go({ type: 'start_battle' }, GM);
    go({ type: 'move', actorId: 'A', to: o(3, 3) }, P1);
    expect(replay(all)).toEqual(state);
  });
});

describe('lava düşme olayı', () => {
  it('HP 0, ölü; ölüm kurtarması yok', () => {
    const s = activeAt(mapBattle().state, { A: o(4, 3), B: o(12, 2) });
    const after = applyEvents(s, [{ type: 'fell_into_lava', actorId: 'A', at: o(5, 3) }]);
    expect(after.combatants.A?.hp).toBe(0);
    expect(after.combatants.A?.life).toBe('dead');
    expect(after.combatants.A?.pos).toEqual(o(5, 3));
  });
});
