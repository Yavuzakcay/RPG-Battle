import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './index';
import { getMonster } from '../data';
import { line, type Offset } from '../rules/hex';
import { describeEvent } from '../ui/log';
import { GM, P1, dice, mk, scripted, sword } from './fixtures';
import { lineOfFire } from './cover';

const o = (col: number, row: number): Offset => ({ col, row });

/** 15×7 açık zemin; istenen altıgenlere harf konur. */
function board(patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => '.'.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}

/** Haritalı savaş; sıra listedeki ilk savaşçıda. */
function field(parts: Combatant[], positions: Record<string, Offset>, tiles: string[]): BattleState {
  const { state } = startBattle('c', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), {
    map: { id: 'volkan' },
  });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', ac: 12, hp: 50, maxHp: 50, ...p });
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] };

/** A (7,0) → B (7,4): çizgi aynı sütunda, aradaki altıgenler (7,1), (7,2), (7,3). */
const shoot = (patch: Array<[Offset, string]>, extra: Combatant[] = [], extraPos: Record<string, Offset> = {}) =>
  execute(field([A(), B(), ...extra], { A: o(7, 0), B: o(7, 4), ...extraPos }, board(patch)),
    { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 10], [8, 1]));

function attackEvent(r: ReturnType<typeof execute>): Extract<BattleEvent, { type: 'attack_resolved' }> {
  if (!r.ok) throw new Error(r.error);
  const ev = r.events[0];
  if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
  return ev;
}
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);

describe('siper', () => {
  it('açık hatta siper yok', () => {
    const ev = attackEvent(shoot([]));
    expect(ev.targetAc).toBe(12);
    expect(ev.cover).toBeUndefined();
  });
  it('çizgide varil/masa (x): yarım siper, AC +2', () => {
    const r = shoot([[o(7, 2), 'x']]);
    const ev = attackEvent(r);
    expect(ev.cover).toBe(2);
    expect(ev.targetAc).toBe(14);
    if (r.ok) expect(describeEvent(ev, r.state)).toContain('AC 14, yarım siper +2 dahil');
  });
  it('çizgide direk (m), sarkıt (v) veya kristal (e): 3/4 siper, AC +5', () => {
    for (const ch of ['m', 'v', 'e']) expect(attackEvent(shoot([[o(7, 2), ch]])).targetAc).toBe(17);
  });
  it('araya giren yaratık (taraf fark etmez) yarım siper verir', () => {
    const ally = mk('C', { ownerId: 'p2' });
    expect(attackEvent(shoot([], [ally], { C: o(7, 2) })).cover).toBe(2);
    const foe = mk('D', { side: 'enemies' });
    expect(attackEvent(shoot([], [foe], { D: o(7, 3) })).cover).toBe(2);
  });
  it('siperler toplanmaz, en iyisi geçer', () => {
    const ev = attackEvent(shoot([[o(7, 1), 'x'], [o(7, 2), 'm'], [o(7, 3), 'g']]));
    expect(ev.cover).toBe(5);
    expect(ev.targetAc).toBe(17);
  });
  it('hedefin kendi altıgeni sayılır (çalılıkta duran hedef yarım siper), saldıranınki sayılmaz', () => {
    expect(attackEvent(shoot([[o(7, 4), 'g']])).cover).toBe(2);
    expect(attackEvent(shoot([[o(7, 0), 'g']])).cover).toBeUndefined();
  });
  it('bitişik yakın dövüşte de hedefin altıgenindeki siper geçerli', () => {
    const s = field([A(), B()], { A: o(7, 3), B: o(7, 4) }, board([[o(7, 4), 'x']]));
    const ev = attackEvent(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 10], [8, 1])));
    expect(ev.cover).toBe(2);
  });
});

describe('görüş hattı', () => {
  it('ağaç (a), duvar (s) ve dış kayalık (#) görüşü keser: saldırı reddedilir', () => {
    expect(errorOf(shoot([[o(7, 2), 'a']]))).toBe('Hedef görülemiyor: arada Ağaç var.');
    expect(errorOf(shoot([[o(7, 2), 's']]))).toBe('Hedef görülemiyor: arada Duvar var.');
    expect(errorOf(shoot([[o(7, 2), '#']]))).toBe('Hedef görülemiyor: arada Dış kayalık var.');
  });
  it('lav, su ve uçurum görüşü kesmez', () => {
    for (const ch of ['~', 'w', 'u']) expect(shoot([[o(7, 2), ch]]).ok).toBe(true);
  });
  it('save\'li etkiler de görüş ister (ejderha nefesi duvarın arkasına ulaşmaz)', () => {
    const dragon = combatantFromMonster(getMonster('young-red-dragon'), { id: 'M' });
    const s = field([dragon, mk('P', { ownerId: 'p1', hp: 200, maxHp: 200 })], { M: o(7, 0), P: o(7, 4) }, board([[o(7, 2), 's']]));
    const r = execute(s, { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: 1 }, GM, scripted());
    expect(errorOf(r)).toContain('Hedef görülemiyor');
  });
});

describe('sınırdan geçen çizgi: saldıran için en iyi yol', () => {
  /** (3,3)'ten çizgisi iki altıgenin tam sınırından geçen ilk hedefi ve o iki altıgeni bulur. */
  function edgeCase(): { from: Offset; to: Offset; sideA: Offset; sideB: Offset } {
    const from = o(3, 3);
    for (let col = 4; col < 15; col++) {
      for (let row = 0; row < 7; row++) {
        const to = o(col, row);
        const a = line(from, to, 1);
        const b = line(from, to, -1);
        const i = a.findIndex((h, k) => h.col !== b[k]?.col || h.row !== b[k]?.row);
        if (i > 0 && i < a.length - 1) return { from, to, sideA: a[i] as Offset, sideB: b[i] as Offset };
      }
    }
    throw new Error('sınır durumu bulunamadı');
  }
  const run = (patch: Array<[Offset, string]>) => {
    const { from, to } = edgeCase();
    return execute(field([A(), B()], { A: from, B: to }, board(patch)),
      { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 10], [8, 1]));
  };
  it('yalnızca bir yanda siper varsa siper yok sayılır', () => {
    const { sideA, sideB } = edgeCase();
    expect(attackEvent(run([[sideA, 'x']])).cover).toBeUndefined();
    expect(attackEvent(run([[sideB, 'x']])).cover).toBeUndefined();
    expect(attackEvent(run([[sideA, 'x'], [sideB, 'x']])).cover).toBe(2);
  });
  it('bir yan görüşü kesse de öbür yan açıksa hedef görülür', () => {
    const { sideA, sideB } = edgeCase();
    expect(run([[sideA, 's']]).ok).toBe(true);
    expect(run([[sideA, 's'], [sideB, 's']]).ok).toBe(false);
    expect(attackEvent(run([[sideA, 's'], [sideB, 'm']])).cover).toBe(5);
  });
});

describe('save siperi ve büyüler', () => {
  it('DEX save\'ine siper eklenir (ejderha nefesi, araya varil)', () => {
    const dragon = combatantFromMonster(getMonster('young-red-dragon'), { id: 'M' });
    const s = field([dragon, mk('P', { ownerId: 'p1', hp: 200, maxHp: 200 })], { M: o(7, 0), P: o(7, 4) }, board([[o(7, 2), 'x']]));
    const r = execute(s, { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: 1 }, GM,
      // Volkan ortamında ateş nefesine karşı save dezavantajlı: iki zar.
      scripted([20, 15], [20, 15], ...dice(6, ...Array<number>(16).fill(1))));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events[0];
    if (!ev || ev.type !== 'save_resolved') throw new Error('beklenmeyen olay');
    expect(ev.cover).toBe(2);
    expect(ev.total).toBe(17); // zar 15 + DEX 0 + siper 2 = DC 17 → başarılı
    expect(ev.success).toBe(true);
  });
  it('büyü saldırısında da siper AC\'ye eklenir', () => {
    const caster = A({ spellNames: ['Fire Bolt'], spellAttack: 5, level: 1 });
    const s = field([caster, B()], { A: o(7, 0), B: o(7, 4) }, board([[o(7, 2), 'm']]));
    const ev = attackEvent(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1,
      scripted([20, 10], [10, 1])));
    expect(ev.targetAc).toBe(17);
  });
});

describe('yükseklik altıgenden gelir (0/1/2)', () => {
  const at = (attackerTile: string, targetTile: string) =>
    attackEvent(execute(field([A(), B()], { A: o(7, 0), B: o(7, 4) }, board([[o(7, 0), attackerTile], [o(7, 4), targetTile]])),
      { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 10], [20, 10], [8, 1])));
  it('kuleden (z) surdakine (h) atış avantajlı, tersi dezavantajlı, aynı seviye normal', () => {
    expect(at('z', 'h').mode).toBe('advantage');
    expect(at('z', 'h').reasons).toContain('Yüksek zemin avantajı');
    expect(at('h', 'z').mode).toBe('disadvantage');
    expect(at('h', 'h').mode).toBe('normal');
    expect(at('h', '.').mode).toBe('advantage');
  });
  it('haritalı savaşta savaşçının soyut yükseklik değeri kullanılmaz', () => {
    const s = field([A({ height: 1 }), B()], { A: o(7, 0), B: o(7, 4) }, board());
    const ev = attackEvent(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 10], [8, 1])));
    expect(ev.mode).toBe('normal');
  });
  it('lineOfFire haritasız savaşta hiçbir şey hesaplamaz', () => {
    const { state } = startBattle('x', 'd-z-zemin', [A(), B()], scripted());
    expect(lineOfFire(state, state.combatants.A as Combatant, state.combatants.B as Combatant)).toEqual({ blocked: false, cover: 0 });
  });
});
