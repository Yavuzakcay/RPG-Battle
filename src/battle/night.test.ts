/** Görev K: gizlenme verisi, pasif Algı, bitişikteki düşman, gece kuralı ve ışıkların tek yerde olması. */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleState, Combatant } from './index';
import { getMap } from '../map/maps';
import type { Offset } from '../rules/hex';
import { hideCheck, hideSpot, noticeEvents, passivePerception } from './stealth';
import { isUnlit, litHexes, nightStealth } from './maprules';
import { P1, mk, scripted, zero } from './fixtures';
import { hideInfo, hideZones } from '../ui/stealthView';

const o = (col: number, row: number): Offset => ({ col, row });
const board = (fill: string, patch: Array<[Offset, string]> = []) => {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
};
function field(map: { id: string; variantId?: string; options?: string[] }, parts: Combatant[], at: Record<string, Offset>, tiles?: string[]): BattleState {
  const { state } = startBattle('s', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(at)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  const m = state.map as NonNullable<BattleState['map']>;
  return { ...state, status: 'active', combatants, map: tiles ? { ...m, tiles } : m };
}
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', modifiers: { ...zero, dex: 3 }, ...p });
/** Algısı +8 (pasif 18) olan, karanlık görüşü olmayan düşman. */
const W = (p: Partial<Combatant> = {}) => mk('W', { side: 'enemies', hp: 30, maxHp: 30, skills: { perception: 8 }, darkvision: 0, ...p });

describe('gizlenme yerleri veriden', () => {
  it('genel veri (çalılık +2) ve haritanın kendi harfleri: orman ağaç dibi, kale direk/sandık arkası', () => {
    const forest = field({ id: 'orman' }, [A(), W()], { A: o(3, 3), W: o(12, 3) }, board('.', [[o(4, 3), 'a'], [o(6, 3), 'g']]));
    expect(hideSpot(forest, o(3, 3))).toEqual({ bonus: 0, char: 'a', adjacent: true });
    expect(hideSpot(forest, o(6, 3))).toEqual({ bonus: 2, char: 'g', adjacent: false });
    expect(hideSpot(forest, o(9, 3))).toBe(null);
    const castle = field({ id: 'kale' }, [A(), W()], { A: o(3, 3), W: o(12, 3) }, board('.', [[o(4, 3), 'm']]));
    expect(hideSpot(castle, o(3, 3))).toMatchObject({ char: 'm', adjacent: true });
    expect(getMap('volkan').hide.terrain ?? {}).toEqual({});
  });
});

describe('pasif Algı ve bitişikteki düşman', () => {
  it('toplam, seni gören düşmanın pasif Algısını da geçmeli (18 > DC 15)', () => {
    const s = field({ id: 'col' }, [A(), W()], { A: o(3, 3), W: o(8, 3) }, board('.'));
    expect(passivePerception(s, s.combatants.W as Combatant, o(3, 3))).toBe(18);
    const c = hideCheck(s, s.combatants.A as Combatant);
    expect(c).toMatchObject({ ok: true, dc: 18, watcher: { id: 'W', passive: 18 } });
    const r = execute(s, { type: 'hide', actorId: 'A' }, P1, scripted([20, 13]));
    if (!r.ok) throw new Error(r.error);
    expect(r.events[0]).toMatchObject({ type: 'hide_attempted', total: 16, dc: 18, success: false, watcherId: 'W' });
  });
  it('bitişikte seni gören düşman varken gizlenilemez; gizliyken turunun başında bulur', () => {
    const s = field({ id: 'col' }, [A(), W()], { A: o(3, 3), W: o(4, 3) }, board('.'));
    const r = execute(s, { type: 'hide', actorId: 'A' }, P1, scripted([20, 20]));
    expect(r.ok ? '' : r.error).toBe('Gizlenilemez: W hemen yanında, seni görüyor.');
    const hidden: BattleState = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hidden: { dc: 22 } } } };
    expect(noticeEvents(hidden, hidden.combatants.W as Combatant)).toEqual([{ type: 'revealed', actorId: 'A', reason: 'W yanı başında fark etti' }]);
    // Tur geçişinde: A turunu bitirir, sıra W'ye geçerken bulunur.
    const ended = execute(hidden, { type: 'end_turn', actorId: 'A' }, P1, scripted());
    if (!ended.ok) throw new Error(ended.error);
    expect(ended.state.combatants.A?.hidden).toBe(null);
    // Uzaktaki düşman fark etmez.
    const far: BattleState = { ...hidden, combatants: { ...hidden.combatants, W: { ...(hidden.combatants.W as Combatant), pos: o(9, 3) } } };
    expect(noticeEvents(far, far.combatants.W as Combatant)).toEqual([]);
  });
  it('arayüz: bölgeler sınıflı, bilgi kutusu nedenini yazar', () => {
    const s = field({ id: 'col' }, [A(), W()], { A: o(3, 3), W: o(4, 3) }, board('.'));
    const z = hideZones(s, s.combatants.A, [], true);
    expect(z.find((x) => x.hex.col === 3 && x.hex.row === 3)?.ok).toBe(false);
    expect(hideInfo(s, s.combatants.A, o(3, 3))).toBe('Saklanılabilir: hayır (W hemen yanında, seni görüyor)');
    const volcano = field({ id: 'volkan' }, [A(), W()], { A: o(3, 3), W: o(12, 3) }, board('.'));
    expect(hideInfo(volcano, volcano.combatants.A, o(3, 3))).toBe('Saklanılabilir: hayır (Açık zemin: örtü yok)');
    const bush = field({ id: 'orman' }, [A(), W()], { A: o(3, 3), W: o(12, 3) }, board('.', [[o(6, 3), 'g']]));
    expect(hideInfo(bush, bush.combatants.A, o(6, 3))).toMatch(/^Saklanılabilir: evet \(çalılık, sazlık \+2\)/);
  });
});

describe('gece', () => {
  const night = (p: Partial<Combatant> = {}) =>
    field({ id: 'orman', variantId: 'gece' }, [A(), W(p)], { A: o(4, 3), W: o(9, 3) }, board('.', [[o(3, 3), 'a']]));
  it('Orman gece varyantı: aynı zemin, gece kuralı, ay ışıklı iki açıklık', () => {
    const m = getMap('orman');
    expect(m.variants.map((v) => v.id)).toEqual(['orman', 'gece']);
    expect(getMap('orman', { variantId: 'gece' }).tiles).toEqual(m.tiles);
    const s = field({ id: 'orman', variantId: 'gece' }, [A(), W()], {});
    expect(nightStealth(s)).toEqual({ penalty: 5, advantage: true });
    expect(litHexes(s).has('0,3')).toBe(true);
    expect(isUnlit(s, o(7, 3))).toBe(true);
  });
  it('ışıksız altıgende: karanlık görüşsüz gözcünün pasif Algısı −5, Gizlen avantajlı; karanlık görüşlü etkilenmez', () => {
    const s = night();
    expect(hideCheck(s, s.combatants.A as Combatant)).toMatchObject({ ok: true, dc: 15, advantage: true, watcher: { passive: 13 } });
    const dv = night({ darkvision: 60 });
    expect(hideCheck(dv, dv.combatants.A as Combatant)).toMatchObject({ dc: 18, advantage: true });
    const r = execute(s, { type: 'hide', actorId: 'A' }, P1, scripted([20, 4], [20, 12]));
    if (!r.ok) throw new Error(r.error);
    expect(r.events[0]).toMatchObject({ mode: 'advantage', natural: 12, total: 15, dc: 15, success: true });
  });
  it('ışıklı altıgen gündüz gibi; gündüz varyantında gece etkisi yok', () => {
    const lit = field({ id: 'orman', variantId: 'gece' }, [A(), W()], { A: o(0, 3), W: o(9, 3) }, board('.', [[o(0, 2), 'a']]));
    expect(hideCheck(lit, lit.combatants.A as Combatant)).toMatchObject({ dc: 18, advantage: false });
    const day = field({ id: 'orman' }, [A(), W()], { A: o(4, 3), W: o(9, 3) }, board('.', [[o(3, 3), 'a']]));
    expect(hideCheck(day, day.combatants.A as Combatant)).toMatchObject({ dc: 18, advantage: false, unlit: false });
  });
  it('Şehir meydanı gece: ışıklar gece kuralında; isteğe bağlı karanlık aynı ışıkları kullanır (tekrar yok)', () => {
    const plain = field({ id: 'sehir-meydani', variantId: 'gece' }, [A(), W()], {});
    const dark = field({ id: 'sehir-meydani', variantId: 'gece', options: ['darkness'] }, [A(), W()], {});
    expect([...litHexes(dark)].sort()).toEqual([...litHexes(plain)].sort());
    expect(litHexes(plain).size).toBeGreaterThan(10);
    const raw = getMap('sehir-meydani').variants.find((v) => v.id === 'gece')?.rules ?? [];
    expect(raw.filter((r) => r.lights !== undefined).map((r) => r.id)).toEqual(['night']);
  });
});
