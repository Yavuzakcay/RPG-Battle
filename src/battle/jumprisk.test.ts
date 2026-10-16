/** Volkan'da lav üstünden ada atlaması (`lavJump` harita kuralı, veri güdümlü): mesafe sınırsız, riskli. */
import { describe, it, expect } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import type { Offset } from '../rules/hex';
import { seededRng } from '../rules/dice';
import { jumpRisk } from './jumprisk';
import { getMap } from '../map/maps';
import { chooseCommand } from './ai';
import { mk, P1, scripted, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
/** 15×7 düz zemin; verilen satırlar baştan sona lav (dikey atlamada aşılan kanal). */
function board(lavaRows: number[], patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, (_, r) => (lavaRows.includes(r) ? '~' : '.').repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
function arena(tiles: string[], a: Partial<Combatant> = {}, mapId = 'volkan', posA = o(7, 2), posB = o(0, 0)): BattleState {
  const parts = [mk('A', { ownerId: 'p1', initiativeBonus: 5, strScore: 18, hp: 30, maxHp: 30, ...a }), mk('B', { side: 'enemies' })];
  const { state } = startBattle('j', 'd-z-zemin', parts, scripted([20, 10], [20, 10]), { map: { id: mapId } });
  const combatants = { ...state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: posA };
  combatants.B = { ...(combatants.B as Combatant), pos: posB };
  return { ...state, status: 'active', turnIndex: state.order.indexOf('A'), combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
/** (7,2) → (7,4): 3. satırdaki lavın üstünden (1 altıgen) atlama. */
const jump = (s: BattleState, d20: number, to = o(7, 4)) => {
  const r = execute(s, { type: 'jump', actorId: 'A', to }, P1, scripted([20, d20], [6, 3], [6, 3], [20, 15]));
  if (!r.ok) throw new Error(r.error);
  return r;
};
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
/** Sütunlar halinde lav duvarları: verilen sütunlar baştan sona lav (dikey adalar). */
const walls = (cols: number[]) => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (cols.includes(c) ? '~' : '.')).join(''));
const check = (events: BattleEvent[]) => events.find((e): e is Extract<BattleEvent, { type: 'jump_check' }> => e.type === 'jump_check');

describe('lav üstünden atlama (lavJump)', () => {
  it('DC = 10 + 2 × (lav altıgeni − 1); bonus Athletics; olasılıklar', () => {
    const s = arena(board([3]), { skills: { athletics: 2 } });
    const risk = jumpRisk(s, s.combatants.A as Combatant, o(7, 2), o(7, 4));
    expect(risk).toMatchObject({ dc: 10, bonus: 2, skill: 'athletics' });
    // Toplam ≥ 10: d20 ≥ 8 → 8..20 = 13 yüz; 1 düşer; 2..7 yanar (6 yüz).
    expect(risk?.pSafe).toBeCloseTo(13 / 20);
    expect(risk?.pBurn).toBeCloseTo(6 / 20);
    expect(risk?.pFall).toBeCloseTo(1 / 20);
    const wide = arena(board([3, 4]), { skills: { athletics: 2 } });
    expect(jumpRisk(wide, wide.combatants.A as Combatant, o(7, 2), o(7, 5))?.dc).toBe(12);
  });
  it('başarı: hedefe güvenle iner, günlükte "14 vs DC 10, başarılı"', () => {
    const r = jump(arena(board([3]), { modifiers: { ...zero, str: 4 } }), 10);
    expect(check(r.events)).toMatchObject({ natural: 10, total: 14, dc: 10, outcome: 'safe' });
    expect(r.state.combatants.A?.pos).toEqual(o(7, 4));
    expect(r.state.combatants.A?.hp).toBe(30);
  });
  it('yetmezse hedefe iner ama yanar: 2d6 ateş ve Burning', () => {
    const r = jump(arena(board([3])), 5);
    expect(check(r.events)?.outcome).toBe('burned');
    expect(r.state.combatants.A?.pos).toEqual(o(7, 4));
    expect(r.state.combatants.A?.hp).toBe(24);
    expect(r.state.combatants.A?.conditions).toContain('Burning');
    const burn = r.events.find((e) => e.type === 'map_effect' && e.rule === 'lavJump');
    expect(burn).toMatchObject({ damage: { rolls: [3, 3], type: 'fire' }, addCondition: 'Burning' });
  });
  it('doğal 1 lava düşer (ölür); doğal 20 bonus ne olursa olsun güvenli', () => {
    const fell = jump(arena(board([3])), 1);
    expect(check(fell.events)?.outcome).toBe('fell');
    expect(fell.state.combatants.A?.life).toBe('dead');
    expect(fell.events.some((e) => e.type === 'jumped')).toBe(false);
    const weak = arena(board([3, 4]), { modifiers: { ...zero, str: -5 }, strScore: 20 });
    const lucky = jump(weak, 20, o(7, 5));
    expect(check(lucky.events)).toMatchObject({ natural: 20, outcome: 'safe' });
  });
  it('uçan zarsız geçer; lavsız kanal (normal zemin) zarsız', () => {
    const fly = jump(arena(board([3]), { fly: 30 }), 1);
    expect(check(fly.events)).toBeUndefined();
    expect(fly.state.combatants.A?.pos).toEqual(o(7, 4));
    const plain = jump(arena(board([], [[o(7, 3), 'n']])), 1);
    expect(check(plain.events)).toBeUndefined();
    expect(plain.state.combatants.A?.life).toBe('alive');
  });
  it('Burning: tur başında 1d6 ateş, DEX DC 10 ile söner', () => {
    const s = jump(arena(board([3])), 5).state;
    // Sıra B'de; B turunu bitirince A'nın turu başlar: önce yanma (1d6), sonra DEX save.
    const atB = { ...s, turnIndex: s.order.indexOf('B') };
    const r = execute(atB, { type: 'end_turn', actorId: 'B' }, { playerId: 'gm', isGm: true }, scripted([6, 4], [20, 15], [6, 1]));
    if (!r.ok) throw new Error(r.error);
    const fx = r.events.filter((e): e is Extract<BattleEvent, { type: 'map_effect' }> => e.type === 'map_effect' && e.rule === 'lavJump');
    expect(fx[0]).toMatchObject({ text: 'yanıyor', damage: { applied: 4, type: 'fire' } });
    expect(fx[1]).toMatchObject({ text: 'alevi söndürmek', roll: { label: 'DEX save', dc: 10, success: true }, removeCondition: 'Burning' });
    expect(r.state.combatants.A?.conditions).not.toContain('Burning');
  });
  it('tohumlu ve tekrar oynatılabilir: aynı tohum aynı sonuç; olaylardan aynı durum', () => {
    const s = arena(board([3]));
    const a = execute(s, { type: 'jump', actorId: 'A', to: o(7, 4) }, P1, seededRng(42));
    const b = execute(s, { type: 'jump', actorId: 'A', to: o(7, 4) }, P1, seededRng(42));
    expect(a).toEqual(b);
    if (!a.ok) throw new Error(a.error);
    expect(replay([{ type: 'battle_started', state: s }, ...a.events])).toEqual(a.state);
  });
  it('mesafe sınırı yok: STR 8, 5 lav satırının üstünden uzak adaya; DC 18; tüm hareketi harcar', () => {
    const s = arena(board([1, 2, 3, 4, 5]), { strScore: 8 }, 'volkan', o(7, 0), o(0, 0));
    const risk = jumpRisk(s, s.combatants.A as Combatant, o(7, 0), o(7, 6));
    expect(risk).toMatchObject({ dc: 18, over: expect.any(Array) });
    expect(risk?.over).toHaveLength(5);
    const r = jump(s, 20, o(7, 6));
    expect(check(r.events)).toMatchObject({ dc: 18, over: 5, outcome: 'safe' });
    expect(r.state.combatants.A?.pos).toEqual(o(7, 6));
    expect(r.state.combatants.A?.movementUsed).toBe(6);
  });
  it('düz doğrultu şart değil; DC yalnızca aradaki lav altıgenlerini sayar (lav/kara karışık)', () => {
    // Lav sütunları 4 ve 6, arada 5 kara: (2,3) → (8,1) çizgisi 2 lavın üstünden geçer.
    const s = arena(walls([4, 6]), {}, 'volkan', o(2, 3), o(0, 0));
    const risk = jumpRisk(s, s.combatants.A as Combatant, o(2, 3), o(8, 1));
    expect(risk?.over).toHaveLength(2);
    expect(risk?.dc).toBe(12);
    const r = jump(s, 20, o(8, 1));
    expect(r.state.combatants.A?.pos).toEqual(o(8, 1));
  });
  it('düşmanlı adaya atlanır (Volkan foeIsland: allow); dolu hedef, yürüdükten sonra ve engel reddedilir', () => {
    const s = arena(board([3]), {}, 'volkan', o(7, 2), o(7, 5));
    // B (düşman) karşı adada: B'nin altıgeni dolu, adanın boş altıgenine atlanır.
    expect(errorOf(execute(s, { type: 'jump', actorId: 'A', to: o(7, 5) }, P1, scripted()))).toContain('dolu');
    const toFoe = execute(s, { type: 'jump', actorId: 'A', to: o(7, 4) }, P1, scripted([20, 20]));
    expect(toFoe.ok && toFoe.state.combatants.A?.pos).toEqual(o(7, 4));
    // Veride `foeIsland: "reject"` olan haritada düşmanlı adaya atlanmaz.
    const rule = getMap('volkan').variants[0]?.rules.find((r) => r.id === 'lavJump') as Record<string, unknown>;
    rule.foeIsland = 'reject';
    try {
      expect(errorOf(execute(s, { type: 'jump', actorId: 'A', to: o(2, 6) }, P1, scripted()))).toContain('Hedef adada düşman var');
    } finally {
      rule.foeIsland = 'allow';
    }
    // Dost (dolu ama düşman değil) adada: başka boş altıgene atlanır, dolu altıgene atlanmaz.
    const ally = arena(board([3]), {}, 'volkan', o(7, 2), o(0, 0));
    const withC = { ...ally, combatants: { ...ally.combatants, C: { ...mk('C', { ownerId: 'p1' }), pos: o(7, 4) } } };
    expect(errorOf(execute(withC, { type: 'jump', actorId: 'A', to: o(7, 4) }, P1, scripted()))).toContain('dolu');
    expect(execute(withC, { type: 'jump', actorId: 'A', to: o(7, 5) }, P1, scripted([20, 20])).ok).toBe(true);
    // Hareketin yerine geçer: yürüdükten sonra atlanmaz.
    const walked = { ...ally, combatants: { ...ally.combatants, A: { ...(ally.combatants.A as Combatant), movementUsed: 1 } } };
    expect(errorOf(execute(walked, { type: 'jump', actorId: 'A', to: o(7, 4) }, P1, scripted()))).toContain('hareketin yerine');
    const rock = arena(board([3, 4], [[o(7, 3), '#']]), {}, 'volkan', o(7, 2), o(0, 0));
    expect(errorOf(execute(rock, { type: 'jump', actorId: 'A', to: o(7, 5) }, P1, scripted()))).toContain('üstünden atlanamaz');
  });
  it('yapay zekâ: yaklaştıran adaya atlar; DC çok yüksekse ya da HP düşükse atlamaz', () => {
    // Lav sütunları 4–5 ve 9–10: üç ada. A solda, B (hedef) sağda; ortadaki boş adaya 2 lav (DC 12).
    const tiles = walls([4, 5, 9, 10]);
    const sword = { weaponOptions: [{ label: 'Kılıç', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'kılıç' }] };
    const fit = arena(tiles, { ...sword, skills: { athletics: 5 } }, 'volkan', o(3, 3), o(12, 3));
    const cmd = chooseCommand(fit);
    expect(cmd.type).toBe('jump');
    expect(cmd.type === 'jump' && cmd.to.col).toBeGreaterThan(5);
    expect(cmd.type === 'jump' && cmd.to.col).toBeLessThan(9);
    // Bonus 0: DC 12'ye güvenli iniş %45 (< %60): atlamaz.
    const weak = arena(tiles, { ...sword, skills: { athletics: 0 } }, 'volkan', o(3, 3), o(12, 3));
    expect(chooseCommand(weak).type).not.toBe('jump');
    const hurt = { ...fit, combatants: { ...fit.combatants, A: { ...(fit.combatants.A as Combatant), hp: 8 } } };
    expect(chooseCommand(hurt).type).not.toBe('jump');
  });
});
