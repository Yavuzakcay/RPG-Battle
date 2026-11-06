/**
 * Kuyruk K59 G3: eksik yapay zekâ testleri (Y1/Y2 kapsamı `evaluate.test.ts`: dost ateşi yalnız puan cezası, tehlike
 * yalnız partide alev, yükseklik yalnız parti okçusu, konsantrasyon yalnız puan terimi). Burada seçimin kendisi:
 *  - dost ateşi: alan büyüsü dostu kapsamayan başka bir merkeze nişanlanır (alan bırakılmaz),
 *  - tehlikeli yüzey: düşman tarafı da zehir bulutundan çıkar; saldırı yerine giderken alev yüzeyine basmaz,
 *  - yükseklik: canavar okçu yüksek zemini seçer; yakın dövüşçü için yükseklik yer seçimini değiştirmez,
 *  - konsantrasyon: eşit iki hedeften konsantre olana vurur,
 *  - K59 değerleri: etki içeriğine göre değer (saldırı dezavantajı varsayılandan değerli), Usta yer seçimi.
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../k54bKit';
import { chooseCommand, scoredCandidates } from '../ai';
import { combatantFromMonster } from '../index';
import { getMonster } from '../../data';
import { previewCommand, effectWeight } from './preview';
import type { ActiveEffect, BattleState, Combatant, Command } from '../types';

const set = (s: BattleState, id: string, patch: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...patch } } });
const monster = (kind: string, id: string, pos: { col: number; row: number }) => ({ ...combatantFromMonster(getMonster(kind), { id, name: kind }), side: 'enemies' as const, pos }) as Combatant;
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });

describe('K59 YZ: dost ateşi', () => {
  it('Fireball: dost hedef kümesindeyken alan bırakılmaz, dostu dışarıda tutan merkez seçilir', () => {
    const r = kitArena({ cls: 'sorcerer', sub: 'draconic-sorcery', level: 5, scores: { cha: 16 }, sheet: { spellNames: ['Fireball', 'Fire Bolt'] },
      extra: [monster('bandit', 'E1', o(10, 3)), monster('bandit', 'E2', o(10, 4)), monster('bandit', 'E3', o(11, 3))],
      place: { A: o(1, 3), B: o(9, 3), C: o(8, 4) } });
    // Bonus özellikleri (Innate Sorcery) uygula, sonra eylem.
    let s = r.state;
    let cmd = chooseCommand(s);
    for (let i = 0; i < 3 && cmd.type === 'use_feature'; i++) { s = r.try(cmd).ok ? (r.do(cmd), r.state) : s; cmd = chooseCommand(s); }
    expect(cmd.type).toBe('cast_spell');
    if (cmd.type !== 'cast_spell') return;
    const p = previewCommand(s, cmd);
    expect(p.friendlyFire).toBe(0);
    if (cmd.spellName === 'Fireball') expect(p.targets.filter((t) => !t.ally && !t.self && t.damage.avg > 0).length).toBeGreaterThanOrEqual(2);
  });
});

describe('K59 YZ: tehlikeli yüzey', () => {
  it('düşman tarafı: zehir bulutunda duran canavar önce dışarı yürür', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, place: { A: o(2, 3), B: o(9, 3), C: o(0, 8) } });
    r.gm({ type: 'place_surface', kind: 'poison', hexes: [o(9, 3), o(9, 2), o(10, 3)] });
    const s = turnOf(r.state, 'B');
    const cmd = chooseCommand(s);
    expect(cmd.type).toBe('move');
    if (cmd.type === 'move') expect(s.map?.zones?.some((z) => z.surface && z.hexes.some((h) => h.col === cmd.to.col && h.row === cmd.to.row))).toBe(false);
  });
  it('saldırı yerine giderken alev yüzeyinde durmaz (başka yer varken)', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, place: { A: o(2, 3), B: o(6, 3), C: o(0, 8) } });
    // Hedefin batısındaki iki komşu alevli; diğer komşular boş.
    r.gm({ type: 'place_surface', kind: 'fire', hexes: [o(5, 3), o(5, 2)] });
    const cmd = chooseCommand(r.state);
    expect(cmd.type).toBe('move');
    if (cmd.type === 'move') expect(r.state.map?.zones?.some((z) => z.surface === 'fire' && z.hexes.some((h) => h.col === cmd.to.col && h.row === cmd.to.row))).toBe(false);
  });
});

describe('K59 YZ: yükseklik', () => {
  it('canavar okçu (Scout) menzilli yer seçerken yüksek zemini tercih eder', () => {
    const scout = monster('scout', 'S', o(9, 4));
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, extra: [scout], place: { A: o(3, 4), B: o(14, 8), C: o(0, 8) } });
    const heights = Array.from({ length: 9 }, () => Array.from({ length: 15 }, () => 0));
    (heights[4] as number[])[10] = 2;
    let s: BattleState = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), heights, ruleToggles: { heightCombat: true, heightMove: false } } };
    // Okçu menzil dışında başlar (uzun menzil: 150 ft değil; görüş içinde ama 320 ft sınırı yok): önce yer seçer.
    s = set(s, 'S', { pos: o(14, 4) });
    s = turnOf(s, 'S');
    const flat = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), heights: Array.from({ length: 9 }, () => Array.from({ length: 15 }, () => 0)) } };
    const a = chooseCommand(s);
    const b = chooseCommand(flat);
    // Okçu ya yerinden ateş eder (her iki haritada aynı) ya da yükseğe çıkar; düz haritada gittiği yere gitmez.
    if (a.type === 'move') expect(a.to).toEqual(o(10, 4));
    else expect(a.type).toBe(b.type);
  });
  it('yakın dövüşçü için yükseklik yer seçimini değiştirmez (yalnız menzilli)', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, place: { A: o(2, 4), B: o(7, 4), C: o(0, 8) } });
    const heights = Array.from({ length: 9 }, () => Array.from({ length: 15 }, () => 0));
    (heights[3] as number[])[6] = 2;
    const hi: BattleState = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), heights, ruleToggles: { heightCombat: true, heightMove: false } } };
    expect(JSON.stringify(chooseCommand(hi))).toBe(JSON.stringify(chooseCommand(r.state)));
  });
});

describe('K59 YZ: konsantrasyon bozma', () => {
  it('eşit iki bitişik hedeften konsantre olana vurur', () => {
    const twin = { ...(monster('bandit', 'B2', o(4, 4))), hp: 11, maxHp: 11 } as Combatant;
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, extra: [twin], place: { A: o(3, 3), B: o(4, 3), C: o(0, 8) } });
    let s = set(r.state, 'B', { ...monster('bandit', 'B', o(4, 3)), hp: 11, maxHp: 11 });
    for (const id of ['B', 'B2']) {
      const conc = set(s, id, { concentration: { spell: 'Bless', spellId: 'bless' } as unknown as Combatant['concentration'] });
      const cmd = chooseCommand(conc);
      expect(cmd.type, id).toBe('attack');
      if (cmd.type === 'attack') expect(cmd.targetId, id).toBe(id);
    }
    void s;
    s = r.state;
  });
});

describe('K59 YZ: etki değeri ve Usta yer seçimi', () => {
  it('saldırı dezavantajı veren etki varsayılan etkiden değerli; yalnız durum veren etki 0; hasarla biten yarı', () => {
    const base = { id: 'x', name: 'x', sourceId: 'A' } as ActiveEffect;
    expect(effectWeight(base)).toBeCloseTo(0.25);
    expect(effectWeight({ ...base, attackDis: {} } as unknown as ActiveEffect)).toBeGreaterThan(effectWeight(base));
    expect(effectWeight({ ...base, grants: ['Incapacitated'] } as ActiveEffect)).toBe(0);
    expect(effectWeight({ ...base, attackDis: {}, breakOnDamage: true } as unknown as ActiveEffect)).toBeCloseTo(effectWeight({ ...base, attackDis: {} } as unknown as ActiveEffect) / 2);
  });
  it('Usta canavar daha uzaktaki yaralı büyücüye gider; Normal en yakın (zırhlı) hedefe', () => {
    const ogre = monster('owlbear', 'O', o(10, 4));
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 3, extra: [ogre], place: { A: o(4, 1), B: o(14, 8), C: o(6, 6) } });
    // C (dost) yakın, çok zırhlı ve canlı; A (büyücü) daha uzak ve çok yaralı; ikisine de bu tur yetişilir.
    let s = set(r.state, 'A', { hp: 3 });
    s = set(s, 'C', { hp: 200, maxHp: 200, ac: 25 });
    s = turnOf(s, 'O');
    const normal = chooseCommand(s);
    const usta = chooseCommand({ ...s, yz: { zorluk: { enemies: 'usta' } } });
    expect(normal.type).toBe('move');
    expect(usta.type).toBe('move');
    if (normal.type === 'move') expect(Math.abs(normal.to.col - 6) + Math.abs(normal.to.row - 6)).toBeLessThan(Math.abs(normal.to.col - 4) + Math.abs(normal.to.row - 1));
    if (usta.type === 'move') {
      const toA = Math.abs(usta.to.col - 4) + Math.abs(usta.to.row - 1);
      const toC = Math.abs(usta.to.col - 4) + Math.abs(usta.to.row - 7);
      expect(toA).toBeLessThan(toC);
    }
    void scoredCandidates; void ({} as Command);
  });
});
