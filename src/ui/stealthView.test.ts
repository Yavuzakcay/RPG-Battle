import { describe, it, expect } from 'vitest';
import { startBattle } from '../battle';
import type { BattleState, Combatant } from '../battle';
import { hideSpotBonus } from '../battle/stealth';
import type { Offset } from '../rules/hex';
import { mk, scripted } from '../battle/fixtures';
import { hideBlockReason, hideCover, hideSpots, revealPuff, tokenView, viewerOf } from './stealthView';

const o = (col: number, row: number): Offset => ({ col, row });
function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
/** Sıra listedeki ilk savaşçıda. */
function field(mapId: string, parts: Combatant[], positions: Record<string, Offset>, tiles: string[]): BattleState {
  const { state } = startBattle('s', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: mapId } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', ...p });
const turnTo = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });

describe('gizlenme görünümü: perde', () => {
  it('oyuncu turunda düşmanın gizli jetonu yok; kendi gizlisi örtülü görünür', () => {
    const s = field('col', [A({ hidden: { dc: 17 } }), B({ hidden: { dc: 14 } })], { A: o(3, 3), B: o(10, 3) }, board('.'));
    expect(viewerOf(s)).toBe('party');
    expect(tokenView(s, s.combatants.A as Combatant, false)).toBe('hidden-own');
    expect(tokenView(s, s.combatants.B as Combatant, false)).toBe('invisible');
    expect(tokenView(s, s.combatants.B as Combatant, true)).toBe('invisible'); // anahtar yalnızca GM ekranında
  });
  it('GM ekranında (düşman turu) oyuncunun gizlisi yalnızca anahtar açıkken görünür', () => {
    const s = turnTo(field('col', [A({ hidden: { dc: 17 } }), B({ hidden: { dc: 14 } })], { A: o(3, 3), B: o(10, 3) }, board('.')), 'B');
    expect(viewerOf(s)).toBe('gm');
    expect(tokenView(s, s.combatants.B as Combatant, false)).toBe('hidden-own');
    expect(tokenView(s, s.combatants.A as Combatant, false)).toBe('invisible');
    expect(tokenView(s, s.combatants.A as Combatant, true)).toBe('hidden-shown');
  });
  it('gizli olmayan jeton her ekranda normal; kurulumda ekran GM\'indir', () => {
    const s = field('col', [A(), B()], { A: o(3, 3), B: o(10, 3) }, board('.'));
    expect(tokenView(s, s.combatants.B as Combatant, false)).toBe('normal');
    expect(viewerOf({ ...s, status: 'setup' })).toBe('gm');
  });
});

describe('gizlenme yerleri ve örtü', () => {
  it('çölde kum (kum yığını), ormanda çalılık ve ağaç yanı (yaprak), başka yerde gölge', () => {
    const col = field('col', [A(), B()], { A: o(3, 3), B: o(10, 3) }, board('.'));
    expect(hideCover(col, o(3, 3))).toBe('sand');
    const orman = field('orman', [A(), B()], { A: o(3, 3), B: o(10, 3) }, board('.', [[o(5, 3), 'g'], [o(8, 3), 'a']]));
    expect(hideCover(orman, o(5, 3))).toBe('leaves');
    expect(hideCover(orman, o(7, 3))).toBe('leaves');
    expect(revealPuff(orman, o(5, 3))).toBe('leaves');
    const magara = field('magara', [A(), B()], { A: o(3, 3), B: o(10, 3) }, board('.', [[o(4, 3), 'g']]));
    expect(hideCover(magara, o(3, 3))).toBe('shadow');
    expect(revealPuff(magara, o(3, 3))).toBe('dust');
  });
  it('ormanda ağacın yanı gizlenme yeri (kural `hideAdjacentTo`), açık otlu zemin değil', () => {
    const orman = field('orman', [A(), B()], { A: o(3, 3), B: o(10, 3) }, board('.', [[o(8, 3), 'a']]));
    expect(hideSpotBonus(orman, o(7, 3))).toBe(0);
    expect(hideSpotBonus(orman, o(3, 3))).toBe(null);
  });
  it('sırası gelenin kendi altıgeni ve yürüyebildiği gizlenme yerleri işaretlenir', () => {
    const s = field('orman', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.', [[o(5, 3), 'g'], [o(13, 0), 'g']]));
    const spots = hideSpots(s, s.combatants.A, ['4,3', '5,3', '6,3']).map((h) => `${h.col},${h.row}`);
    expect(spots).toEqual(['5,3']);
    const hidden = { ...(s.combatants.A as Combatant), hidden: { dc: 15 } };
    expect(hideSpots(s, hidden, ['5,3'])).toEqual([]);
  });
  it('Gizlen kapalıysa nedeni yazar', () => {
    const s = field('orman', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.', [[o(5, 3), 'g']]));
    expect(hideBlockReason(s, s.combatants.A as Combatant)).toContain('Burada gizlenilemez');
    const there = { ...(s.combatants.A as Combatant), pos: o(5, 3) };
    expect(hideBlockReason(s, there)).toBe(null);
    expect(hideBlockReason(s, { ...there, hidden: { dc: 18 } })).toBe('Zaten gizli (DC 18).');
    expect(hideBlockReason(s, { ...there, economy: { ...there.economy, action: true } })).toBe('Eylem bu tur kullanıldı.');
  });
});
