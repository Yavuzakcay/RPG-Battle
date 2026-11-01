/**
 * Kuyruk 29 K22: Çöl mekanikleri (ani sel, çürük güverte, kum pususu, fırtınada rüzgâr). Her biri: tetiklenir; Game Master
 * kapatınca ya da eski savaşta (kural sürümü 8) çalışmaz. Replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { ruleOf } from './maprules';
import { desertEnterEvents, desertRoundEvents, stormAgainstWind, stormName, stormRangeBonusFt } from './desert';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

interface Opt { variant?: string; v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number | string>> }
function battle(mapId: string, pos: Record<string, Offset>, opt: Opt = {}): BattleState {
  const parts = [mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, saves: LOW }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, saves: LOW })];
  const st = startBattle('k22', 'col', parts, () => 0.5, {
    map: { id: mapId, ...(opt.variant ? { variantId: opt.variant } : {}), ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) },
    ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}
const tile = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col];
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const flood = (s: BattleState) => execute(s, { type: 'map_trigger', rule: 'flashFlood' }, GM, high);

describe('Ani sel (Kanyon Nehri)', () => {
  const pos = { A: o(2, 7), B: o(15, 0) };
  it('Game Master tetikler; 1 tur sonra nehir taşar, sudaki STR save başarısızsa hasar alır ve itilir; replay aynı', () => {
    const s0 = battle('col-kanyon-nehri', pos);
    const r = flood(s0);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.map?.floodRound).toBe(s0.round + 1);
    expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
    expect(desertRoundEvents(r.state, low)).toHaveLength(0);
    const s1 = { ...r.state, round: s0.round + 1 };
    const evs = desertRoundEvents(s1, low);
    const after = applyEvents(s1, evs);
    expect(tile(after, o(2, 7))).toBe('w');
    expect(C(after, 'A').hp).toBeLessThan(60);
    expect(C(after, 'A').pos).not.toEqual(o(2, 7));
    expect(C(after, 'B').hp).toBe(60);
    expect(after.map?.floodRound).toBe(0);
    expect(flood(after).ok).toBe(false);
  });
  it('kendiliğinden tur parametresi uyarıyı başlatır; kapalıyken ve eski savaşta yok', () => {
    const auto = battle('col-kanyon-nehri', pos, { params: { flashFlood: { autoRound: 2 } } });
    expect(desertRoundEvents({ ...auto, round: 2 }, low).some((e) => e.type === 'map_note' && e.floodRound === 3)).toBe(true);
    expect(flood(battle('col-kanyon-nehri', pos, { toggles: { flashFlood: false } })).ok).toBe(false);
    expect(flood(battle('col-kanyon-nehri', pos, { v: 8 })).ok).toBe(false);
  });
});

describe('Çürük güverte (Gemi Enkazı)', () => {
  it('işaretli tahtaya giren: tahta çöker, DEX save başarısızsa hasar + Prone ve yürüyüş biter; gizli bölme notu', () => {
    const s = battle('col-gemi-enkazi', { A: o(10, 3) });
    const evs = desertEnterEvents(s, C(s, 'A'), o(11, 4), low);
    const after = applyEvents(s, evs);
    expect(tile(after, o(11, 4))).toBe('.');
    expect(evs.some((e) => e.type === 'map_effect' && e.stopMovement === true)).toBe(true);
    expect(evs.some((e) => e.type === 'map_note' && /gizli bir bölme/.test(e.text))).toBe(true);
    expect(desertEnterEvents(after, C(after, 'A'), o(11, 4), low)).toHaveLength(0);
    expect(desertEnterEvents(s, C(s, 'A'), o(8, 2), low)).toHaveLength(0);
  });
  it('gerçek yürüyüşte çöken tahtada durulur', () => {
    const s = battle('col-gemi-enkazi', { A: o(10, 3), B: o(19, 9) });
    const r = execute(s, { type: 'move', actorId: 'A', to: o(10, 6) }, P1, low);
    if (!r.ok) throw new Error(r.error);
    expect(C(r.state, 'A').pos).toEqual(o(10, 4));
    expect(tile(r.state, o(10, 4))).toBe('.');
  });
  it('kapalıyken ve eski savaşta yok', () => {
    const off = battle('col-gemi-enkazi', { A: o(10, 3) }, { toggles: { rottenDeck: false } });
    expect(desertEnterEvents(off, C(off, 'A'), o(11, 4), low)).toHaveLength(0);
    const old = battle('col-gemi-enkazi', { A: o(10, 3) }, { v: 8 });
    expect(desertEnterEvents(old, C(old, 'A'), o(11, 4), low)).toHaveLength(0);
  });
});

describe('Kum pususu (Vaha)', () => {
  const pos = { A: o(3, 7), B: o(20, 10) };
  it('bir tur önce titreşim notu; çıkış turunda Algı başarısızsa Ankheg çıkar ve yakalar; replay aynı', () => {
    const s = battle('col-vaha', pos);
    expect(desertRoundEvents({ ...s, round: 2 }, low).map((e) => e.type)).toEqual(['map_note']);
    const s3 = { ...s, round: 3 };
    const evs = desertRoundEvents(s3, low);
    const after = applyEvents(s3, evs);
    expect(C(after, 'kum-solucani')?.side).toBe('enemies');
    expect(C(after, 'A').grapple?.by).toBe('kum-solucani');
    expect(replay([{ type: 'battle_started', state: s3 }, ...evs])).toEqual(after);
    expect(desertRoundEvents({ ...after, round: 4 }, low)).toHaveLength(0);
  });
  it('titreşimi sezen yakalanmaz; kumda kimse yoksa beklenir; kapalıyken yok', () => {
    const s3 = { ...battle('col-vaha', pos), round: 3 };
    const after = applyEvents(s3, desertRoundEvents(s3, high));
    expect(C(after, 'kum-solucani')).toBeTruthy();
    expect(C(after, 'A').grapple).toBeUndefined();
    const noSand = { ...battle('col-vaha', { A: o(11, 5) }), round: 3 };
    expect(desertRoundEvents(noSand, low)).toHaveLength(0);
    expect(desertRoundEvents({ ...battle('col-vaha', pos, { toggles: { wormAmbush: false } }), round: 3 }, low)).toHaveLength(0);
  });
});

describe('Fırtınada rüzgâr (kum ve kar)', () => {
  it('rüzgâr yönüne atış +10 ft, rüzgâra karşı dezavantaj; eski savaşta yok', () => {
    const s = battle('col-sutun-harabesi', {});
    expect(stormRangeBonusFt(s, o(4, 4), o(7, 6))).toBe(10);
    expect(stormAgainstWind(s, o(4, 4), o(7, 6))).toBe(false);
    expect(stormAgainstWind(s, o(7, 6), o(4, 4))).toBe(true);
    expect(stormRangeBonusFt(s, o(7, 6), o(4, 4))).toBe(0);
    const old = battle('col-sutun-harabesi', {}, { v: 8 });
    expect(ruleOf(old, 'sandstorm')).toBeUndefined();
    expect(stormRangeBonusFt(old, o(4, 4), o(7, 6))).toBe(0);
  });
  it('kar körlüğü: Buzul Kayalıkları gecesi kar fırtınası', () => {
    const s = battle('buzul-kayalik', {}, { variant: 'gece' });
    expect(stormName(ruleOf(s, 'sandstorm'))).toBe('Kar fırtınası');
    expect(ruleOf(battle('buzul-kayalik', {}), 'sandstorm')).toBeUndefined();
  });
  it('gerçek saldırıda rüzgâra karşı dezavantaj kaynağı', () => {
    const s = battle('col-sutun-harabesi', { A: o(7, 6), B: o(4, 4) });
    const bow = { label: 'Yay', attackBonus: 5, damage: '1d6', damageType: 'piercing', ranged: true, spell: false, tag: 'x', range: [80, 320] as [number, number] };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, high);
    if (!r.ok) throw new Error(r.error);
    const ev = r.events.find((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved');
    expect(JSON.stringify(ev)).toMatch(/rüzgâra karşı/);
  });
});
