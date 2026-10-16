/** Volkan (3 büyük ada + adacıklar): 3 büyük ada + 6 adacık, yürüyerek geçiş yok, ada bazlı atlama, uyuyan ejderha. */
import { describe, it, expect } from 'vitest';
import { getMap } from './maps';
import { costsFrom, hexKey, neighbors, type Offset } from '../rules/hex';
import { terrainOf } from './terrain';
import { createMapBattle } from '../app/setup';
import { execute, type BattleState, type Combatant } from '../battle';
import { islandOf, jumpTargets } from '../battle/jumprisk';
import { moveCostFn } from '../battle/movement';
import { GM, mk, scripted } from '../battle/fixtures';

const m = getMap('volkan');
const size = { cols: 15, rows: 7 };
const o = (col: number, row: number): Offset => ({ col, row });
/** 1 tabanlı [sütun, satır] → altıgen. */
const h1 = (c: number, r: number) => o(c - 1, r - 1);
const land = (h: Offset) => { const t = terrainOf(m.tiles[h.row]?.[h.col] ?? '#'); return t.movement !== 'deadly' && t.movement !== 'blocked'; };

/** Bağlı kara parçaları (yürüyerek). */
function components(): Offset[][] {
  const seen = new Set<string>();
  const out: Offset[][] = [];
  for (let row = 0; row < 7; row++) for (let col = 0; col < 15; col++) {
    const start = o(col, row);
    if (!land(start) || seen.has(hexKey(start))) continue;
    const comp: Offset[] = [start];
    seen.add(hexKey(start));
    for (let i = 0; i < comp.length; i++) {
      for (const n of neighbors(comp[i] as Offset, size)) if (land(n) && !seen.has(hexKey(n))) { seen.add(hexKey(n)); comp.push(n); }
    }
    out.push(comp);
  }
  return out;
}

describe('Volkan: harita', () => {
  it('zemin, başlangıç bölgeleri (10/10), aynalanabilir; kimlik "volkan", ad "Volkan"', () => {
    expect(m.id).toBe('volkan');
    expect(m.name).toBe('Volkan');
    expect(m.tiles).toEqual([
      '~~~~.~~~.~.~~~~', '~.~~.~~.~~.~~.~', '...~~..H..~~...', '...~~..H..~~...', '...~~.....~~...', '~~~~~~.~.~~~~~~', '~~~..~~.~~..~~~',
    ]);
    expect(m.startZones.players.map((h) => [h.col + 1, h.row + 1]).sort()).toEqual(
      [[1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 4], [2, 5], [3, 3], [3, 4], [3, 5]].sort());
    expect(m.startZones.enemies).toHaveLength(10);
    expect(m.mirrorable).toBe(true);
    expect(m.variants.map((v) => v.id)).toEqual(['normal', 'uyuyan-ejderha']);
  });
  it('3 büyük ada + 6 adacık; her adacık 1–2 altıgen ve başka karaya bitişik değil', () => {
    const comps = components();
    const big = comps.filter((c) => c.length > 2);
    const islets = comps.filter((c) => c.length <= 2).map((c) => c.map((h) => `${h.col + 1},${h.row + 1}`).sort());
    expect(big).toHaveLength(3);
    expect(islets.sort()).toEqual([['11,1', '11,2'], ['11,7', '12,7'], ['4,7', '5,7'], ['5,1', '5,2'], ['8,7'], ['9,1']].sort());
    // Bileşen tanımı gereği: bir adacığın hiçbir altıgeni başka bir parçanın karasına bitişik değil (arada lav).
    for (const c of comps) {
      const keys = new Set(c.map(hexKey));
      for (const hx of c) for (const n of neighbors(hx, size)) if (land(n)) expect(keys.has(hexKey(n))).toBe(true);
    }
  });
  it('yürüyerek adalar arasında geçiş yok: sol adadan yürüme yalnızca sol adada kalır', () => {
    const s = createMapBattle([mk('A', { ownerId: 'p1' })], { mapId: 'volkan', variantId: 'normal', mirrored: false }, scripted()).state;
    const a = s.combatants.A as Combatant;
    const reach = costsFrom(a.pos as Offset, size, moveCostFn(s, a), 99);
    const home = islandOf(s, a.pos as Offset);
    for (const k of reach.keys()) expect(home.has(k)).toBe(true);
  });
});

describe('Volkan: kurallar', () => {
  const start = (variantId: string, extra: Partial<Combatant> = {}): BattleState => {
    const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, ...extra }), mk('B', { side: 'enemies' })];
    const s = createMapBattle(parts, { mapId: 'volkan', variantId, mirrored: false }, scripted()).state;
    const r = execute(s, { type: 'start_battle' }, GM, scripted());
    if (!r.ok) throw new Error(r.error);
    return { ...r.state, turnIndex: r.state.order.indexOf('A') };
  };
  it('ada bazlı atlama: sol adanın içinden orta adaya ve adacıklara; sağ adaya doğrudan (orta ada araya girer) değil', () => {
    const s0 = start('normal');
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: h1(2, 4) } } };
    const t = jumpTargets(s, s.combatants.A as Combatant).map((x) => `${x.to.col + 1},${x.to.row + 1}`);
    expect(t).toContain('6,4'); // orta adanın batı kenarı
    expect(t).toContain('5,2'); // adacık
    expect(t.some((k) => k.startsWith('13,') || k.startsWith('14,') || k.startsWith('15,'))).toBe(false);
  });
  it('uyuyan-ejderha: ejderha (8,3) kraterinde uyur; normal varyantta ejderha yok', () => {
    const s = start('uyuyan-ejderha');
    const d = Object.values(s.combatants).find((c) => c.asleep);
    expect(d).toMatchObject({ name: 'Young Red Dragon', pos: h1(8, 3) });
    expect(m.tiles[2]?.[7]).toBe('H');
    expect(Object.values(start('normal').combatants).some((c) => c.asleep)).toBe(false);
  });
  it('büyü lavın karşısındaki hedefe atılır (lav görüş hattını kesmez)', () => {
    const s0 = start('normal', { spellNames: ['Fire Bolt'], spellMod: 3, spellAttack: 5 });
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: h1(3, 4) }, B: { ...(s0.combatants.B as Combatant), pos: h1(6, 4) } } };
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, { playerId: 'p1', isGm: false }, scripted([20, 15], [10, 5]));
    expect(r.ok ? '' : r.error).toBe('');
  });
});
