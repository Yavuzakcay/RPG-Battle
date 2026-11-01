/**
 * Kuyruk 43: çok altıgenin (Görev A6) kalanları: Gargantuan yalnızca orta/geniş haritada 19 altıgen, kurulumda otomatik
 * yerleşim, alan ve zemin etkileri gövdeye, itme gövdeye, görüş hattı en iyi altıgen çiftinden, yapay zekâ `gap` ile.
 */
import { describe, expect, it } from 'vitest';
import { startBattle } from './create';
import { bodyOf, gap } from './body';
import { zoneTurnEvents } from './zones';
import { pushOutcome } from './forced';
import { lineOfFire } from './cover';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import { createMapBattle } from '../app/setup';
import { footprint } from '../rules/footprint';
import { seededRng as seeded } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const club = { name: 'Greatclub', bonus: 6, damageDice: '2d8+4', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: '' };

function arena(size: Combatant['size'], at: Offset, hero: Offset, opts: { multiHex?: boolean; cols?: number; rows?: number; tiles?: string[] } = {}) {
  const cols = opts.cols ?? 15, rows = opts.rows ?? 7;
  const parts = [mk('A', { ownerId: 'p1' }), mk('O', { side: 'enemies', size, hp: 200, maxHp: 200, attacks: [club], speed: 40 })];
  const tiles = opts.tiles ?? Array.from({ length: rows }, () => '.'.repeat(cols));
  const started = startBattle('k43', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, multiHex: opts.multiHex ?? true });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: hero };
  combatants.O = { ...(combatants.O as Combatant), pos: at };
  return { ...started.state, status: 'active', order: ['A', 'O'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
}

describe('K43 çok altıgen', () => {
  it('Gargantuan klasik haritada (15×7) 7, orta haritada (21×11) 19 altıgen', () => {
    const small = arena('G', o(7, 3), o(1, 1));
    expect(small.multiHexMax).toBe('H');
    expect(bodyOf(small, small.combatants.O!)).toHaveLength(7);
    const parts = [mk('A', { ownerId: 'p1' }), mk('O', { side: 'enemies', size: 'G', hp: 200, maxHp: 200 })];
    const wide = createMapBattle(parts, { mapId: 'kale-onu', variantId: 'gunduz', mirrored: false, multiHex: true }, seeded(1)).state;
    expect(wide.multiHexMax).toBeUndefined();
    expect(bodyOf(wide, wide.combatants.O!)).toHaveLength(19);
  });
  it('otomatik yerleşim: büyük gövde başlangıç bölgesine (ya da yakınına) sığar, diğerleriyle örtüşmez', () => {
    const parts = [mk('A', { ownerId: 'p1' }), mk('B', { ownerId: 'p1' }), mk('O', { side: 'enemies', size: 'H', hp: 200, maxHp: 200 }),
      mk('G1', { side: 'enemies', hp: 10, maxHp: 10 }), mk('G2', { side: 'enemies', hp: 10, maxHp: 10 })];
    const s = createMapBattle(parts, { mapId: 'kale-onu', variantId: 'gunduz', mirrored: false, multiHex: true }, seeded(2)).state;
    const all = Object.values(s.combatants);
    expect(all.every((c) => c.pos)).toBe(true);
    const keys = all.flatMap((c) => bodyOf(s, c).map((h) => `${h.col},${h.row}`));
    expect(new Set(keys).size).toBe(keys.length);
    expect(bodyOf(s, s.combatants.O!)).toHaveLength(7);
  });
  it('alan: gövdenin çapa dışındaki altıgeni alev yüzeyindeyse tur sonu tetiklenir (kapalıyken tetiklenmez)', () => {
    const extra = footprint(o(7, 3), 'H')[1] as Offset;
    const zone: SpellZone = { id: 'z', spellId: 'surface:fire', name: 'Alev', casterId: 'harita', side: 'party', dc: 0, slotLevel: 0, hexes: [extra], surface: 'fire' };
    const put = (s: BattleState) => ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), zones: [zone] } });
    const on = put(arena('H', o(7, 3), o(1, 1)));
    expect(zoneTurnEvents(on, 'O', 'end', seeded(3)).length).toBeGreaterThan(0);
    const off = put(arena('H', o(7, 3), o(1, 1), { multiHex: false }));
    expect(zoneTurnEvents(off, 'O', 'end', seeded(3))).toEqual([]);
  });
  it('itme: arkadaki gövde altıgeni doluysa itilemez; boşsa itilir', () => {
    const s = arena('L', o(6, 3), o(5, 3));
    const to = o(7, 3);
    expect(pushOutcome(s, s.combatants.O!, o(6, 3), to).ok).toBe(true);
    const blocker = footprint(to, 'L').find((h) => !footprint(o(6, 3), 'L').some((b) => b.col === h.col && b.row === h.row)) as Offset;
    const crowded = { ...s, combatants: { ...s.combatants, X: { ...mk('X', { side: 'enemies' }), pos: blocker } } } as BattleState;
    const out = pushOutcome(crowded, crowded.combatants.O!, o(6, 3), to);
    expect(out.ok).toBe(false);
  });
  it('görüş: çapaya giden hat duvarla kesik ama gövdenin başka altıgeni görünüyorsa saldırı hattı açık', () => {
    const tiles = Array.from({ length: 7 }, () => '.'.repeat(15).split(''));
    const anchor = o(8, 3);
    const body = footprint(anchor, 'H');
    // Saldıran (2,3); gövdenin batı altıgeninin önü (6,3) duvar: çapaya giden iki hat da oradan geçer, (8,2)'ye giden geçmez.
    (tiles[3] as string[])[6] = '#';
    const t = tiles.map((r) => r.join(''));
    const on = arena('H', anchor, o(2, 3), { tiles: t });
    const off = arena('H', anchor, o(2, 3), { tiles: t, multiHex: false });
    expect(body.length).toBe(7);
    expect(lineOfFire(off, off.combatants.A!, off.combatants.O!).blocked).toBe(true);
    expect(lineOfFire(on, on.combatants.A!, on.combatants.O!).blocked).toBe(false);
  });
  it('yapay zekâ: gövdesi bitişik büyük düşmanı çapası yakın küçük düşmandan önce vurur (gap)', () => {
    const big = o(6, 3);
    const body = footprint(big, 'L');
    // Saldıran gövdenin arka altıgenine bitişik, çapaya 2 altıgen.
    const all: Offset[] = [];
    for (let col = 0; col < 15; col++) for (let row = 0; row < 7; row++) all.push(o(col, row));
    const inBody = (h: Offset) => body.some((b) => b.col === h.col && b.row === h.row);
    const start = all.find((h) => !inBody(h) && gap({ multiHex: true }, { size: 'M', pos: h }, { size: 'L', pos: big }) === 1
      && Math.abs(h.col - big.col) + Math.abs(h.row - big.row) >= 2) as Offset;
    const s = arena('L', big, start);
    const sword = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
    const st = { ...s, combatants: { ...s.combatants, A: { ...s.combatants.A!, weaponOptions: [sword] } } } as BattleState;
    const cmd = chooseCommand(st);
    expect(cmd.type).toBe('attack');
    if (cmd.type === 'attack') expect(cmd.targetId).toBe('O');
  });
});
