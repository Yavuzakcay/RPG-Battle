/**
 * Görev A6: çok altıgenli boyut (`state.multiHex`). Large 3, Huge 7 altıgen; doluluk, yerleştirme, hareket (gövde
 * sığmalı, en kötü zemin), erişim ve menzil (en yakın iki altıgen), fırsat saldırısı, alan isabeti. Bayrak kapalıyken
 * (varsayılan) her şey tek altıgen.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { occupantAt } from './movement';
import { bodyOf, gap } from './body';
import { checkReach } from './range';
import { GM, P1, mk } from './fixtures';
import { footprint } from '../rules/footprint';
import { distance, type Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const club = { name: 'Greatclub', bonus: 6, damageDice: '2d8+4', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: '' };

function arena(multiHex: boolean, ogre = o(6, 3), hero = o(3, 3), tiles = Array.from({ length: 7 }, () => '.'.repeat(15)), size: Combatant['size'] = 'L') {
  const parts = [mk('A', { ownerId: 'p1', weaponOptions: [sword] }), mk('O', { side: 'enemies', size, hp: 60, maxHp: 60, attacks: [club], speed: 40 })];
  const started = startBattle('a6', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, multiHex });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: hero };
  combatants.O = { ...(combatants.O as Combatant), pos: ogre };
  return { ...started.state, status: 'active', order: ['A', 'O'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}

/** Large'ın (çapa 6,3) arka altıgenine bitişik, çapaya 2 altıgen bir yer ve oradan gövdeden uzak bir hedef. */
function besideBack() {
  const body = footprint(o(6, 3), 'L');
  const all: Offset[] = [];
  for (let col = 0; col < 15; col++) for (let row = 0; row < 7; row++) all.push(o(col, row));
  const inBody = (h: Offset) => body.some((b) => b.col === h.col && b.row === h.row);
  const start = all.find((h) => !inBody(h) && distance(h, o(6, 3)) === 2 && body.some((b) => distance(b, h) === 1)) as Offset;
  const away = all.find((h) => distance(h, start) <= 3 && body.every((b) => distance(b, h) >= 3)) as Offset;
  return { start, away };
}

describe('çok altıgenli boyut', () => {
  it('bayrak: startBattle seçeneği; kapalıyken Large tek altıgen (eski davranış)', () => {
    const off = arena(false);
    expect(off.multiHex).toBeUndefined();
    expect(bodyOf(off, off.combatants.O!)).toEqual([o(6, 3)]);
    expect(occupantAt(off, footprint(o(6, 3), 'L')[1] as Offset)).toBeUndefined();
    const on = arena(true);
    expect(on.multiHex).toBe(true);
    expect(bodyOf(on, on.combatants.O!)).toEqual(footprint(o(6, 3), 'L'));
    for (const h of footprint(o(6, 3), 'L')) expect(occupantAt(on, h)?.id).toBe('O');
    expect(bodyOf(on, on.combatants.A!)).toEqual([o(3, 3)]);
  });
  it('erişim ve menzil gövdenin en yakın altıgenine: Large\'ın arka altıgenine bitişik saldırı', () => {
    const { start } = besideBack();
    const on = arena(true, o(6, 3), start);
    expect(gap(on, on.combatants.A!, on.combatants.O!)).toBe(1);
    expect(checkReach(on, on.combatants.A!, on.combatants.O!, { kind: 'melee', reachFt: 5 }).ok).toBe(true);
    // Kapalıyken aynı konumlar: çapaya göre 2 altıgen, erişim dışı.
    const off = arena(false, o(6, 3), start);
    expect(gap(off, off.combatants.A!, off.combatants.O!)).toBe(2);
    expect(checkReach(off, off.combatants.A!, off.combatants.O!, { kind: 'melee', reachFt: 5 }).ok).toBe(false);
  });
  it('hareket: gövde sığmalı (engel, harita kenarı, dolu altıgen), maliyet en kötü altıgen', () => {
    const tiles = Array.from({ length: 7 }, (_, r) => (r === 4 ? '.........c.....' : '...............'));
    const s = { ...arena(true, o(6, 2), o(1, 1), tiles), order: ['O', 'A'] } as BattleState;
    // Çapa (8,3): Large gövdesi (9,3) ve (8,4)'ü de kaplar; (9,4) sütun değil → geçerli; (9,3)'e taşınırsa (9,4) sütun.
    const blocked = footprint(o(9, 3), 'L').some((h) => tiles[h.row]![h.col] === 'c');
    const r = execute(s, { type: 'move', actorId: 'O', to: o(9, 3) }, GM, () => 0.5);
    expect(r.ok).toBe(!blocked);
    // Harita kenarı: son sütunda Large sığmaz.
    expect(execute(s, { type: 'move', actorId: 'O', to: o(14, 2) }, GM, () => 0.5).ok).toBe(false);
    // Dolu: gövdenin bir altıgeni A'nın altıgenine düşerse olmaz.
    const near = { ...arena(true, o(6, 2), o(8, 4)), order: ['O', 'A'] } as BattleState;
    const hit = [o(7, 3), o(8, 3), o(7, 4)].find((a) => footprint(a, 'L').some((h) => h.col === 8 && h.row === 4)) as Offset;
    expect(execute(near, { type: 'move', actorId: 'O', to: hit }, GM, () => 0.5).ok).toBe(false);
  });
  it('fırsat saldırısı: Large\'ın erişimi gövdesinden; kapalıyken çapadan', () => {
    const { start, away } = besideBack();
    const run = (multi: boolean) => {
      const s = arena(multi, o(6, 3), start);
      const r = execute(s, { type: 'move', actorId: 'A', to: away }, P1, () => 0.5);
      if (!r.ok) throw new Error(r.error);
      return r.events.filter((e: BattleEvent) => e.type === 'attack_resolved').length;
    };
    expect(run(true)).toBeGreaterThan(0);
    expect(run(false)).toBe(0);
  });
  it('Huge 7 altıgen: yerleştirme gövdenin hepsini denetler', () => {
    const s0 = arena(true, o(6, 3), o(1, 1), undefined, 'H');
    const setup = { ...s0, status: 'setup' } as BattleState;
    expect(execute(setup, { type: 'place', actorId: 'O', at: o(0, 3) }, GM, () => 0.5).ok).toBe(false);
    expect(execute(setup, { type: 'place', actorId: 'O', at: o(2, 1) }, GM, () => 0.5).ok).toBe(false);
    const ok = execute(setup, { type: 'place', actorId: 'O', at: o(10, 3) }, GM, () => 0.5);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(bodyOf(ok.state, ok.state.combatants.O!)).toHaveLength(7);
  });
});
