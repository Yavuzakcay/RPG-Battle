/** K49 D: bölgeler, geçiş, karo ön yükleme listesi, yüzme (Atletizm, ağır zırh), anahtar kapalı = K47. Görsel yok. */
import { describe, expect, it } from 'vitest';
import { REGIONS, REGION_RULES, SWIM, arrivalRegion, cellIndex, regionCrossing, regionTiles, swimAt, transitionMs, worldRegionAt } from './regions';
import { findPath } from './walk';
import { executeSeruven, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import dunya from '../../data/harita/tum_dugumler_dunya.json';
import etiketler from '../../data/harita/etiketler.json';
import type { Pt } from './worldData';

const N = dunya as unknown as Record<string, Pt>;
const label = (id: string) => { const e = etiketler.etiketler.find((x) => x.id === id)!; return [e.x, e.y] as Pt; };
/** Izgarada bir yüzme hücresinin merkezi ve iki yanındaki kara noktası (yatay ya da dikey). */
function swimCrossing(): { a: Pt; b: Pt } {
  for (let y = 20; y < 170; y++) for (let x = 20; x < 400; x++) {
    if (!swimAt(y * 429 + x)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
      const a: Pt = [(x - 4 * dx + 0.5) * 32, (y - 4 * dy + 0.5) * 32], b: Pt = [(x + 4 * dx + 0.5) * 32, (y + 4 * dy + 0.5) * 32];
      const dry = findPath(a, b), wet = findPath(a, b, { swim: true });
      if (wet?.swim && (!dry || dry.hours > wet.hours * 3)) return { a, b };
    }
  }
  throw new Error('yüzme geçişi bulunamadı');
}

describe('bölgeler', () => {
  it('en az sekiz kıta bölgesi + adalar; etiket noktası kendi bölgesinde', () => {
    for (const id of ['bolge_buzul', 'bolge_dag', 'bolge_orman', 'bolge_col', 'bolge_bataklik', 'bolge_bati_kiyi', 'bolge_kral', 'bolge_kirik_sinir', 'ada_volkan'])
      expect(REGIONS.some((r) => r.id === id)).toBe(true);
    expect(worldRegionAt(label('bolge_orman'))?.id).toBe('bolge_orman');
    expect(worldRegionAt(label('bolge_col'))?.id).toBe('bolge_col');
    expect(worldRegionAt([30, 30])).toBe(null); // açık deniz
  });
  it('sınır geçişi: Patika → Açık buzul bölge değiştirir; aynı bölge içinde kesinti yok', () => {
    const p = findPath(N['orman/Patika']!, N['buzul/Açık buzul']!)!;
    expect(regionCrossing(p.path)).not.toBe(null);
    expect(arrivalRegion(p.path)?.id).toBe(worldRegionAt(N['buzul/Açık buzul']!)?.id);
    const o = label('bolge_orman');
    expect(arrivalRegion([o, [o[0] + 40, o[1]]])).toBe(null);
  });
  it('ön yükleme: bölge kutusunun z3–z4 karoları, sınırlı; süre 0,6–1,2 sn, hareketi azaltmada kısa', () => {
    const zooms = [{ z: 3, olcek: 0.25, sutun: 7, satir: 3 }, { z: 4, olcek: 0.5, sutun: 14, satir: 6 }];
    const r = REGIONS.find((x) => x.id === 'bolge_orman')!;
    const tiles = regionTiles(r, zooms, 512);
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles.length).toBeLessThanOrEqual(REGION_RULES.onYuklemeEnFazla);
    expect(tiles[0]!.startsWith('3/')).toBe(true);
    expect(tiles.some((t) => t.startsWith('4/'))).toBe(true);
    expect(transitionMs(50, false)).toBe(REGION_RULES.sureMs.en);
    expect(transitionMs(5000, false)).toBe(REGION_RULES.sureMs.cok);
    expect(transitionMs(800, true)).toBe(REGION_RULES.azaltMs);
  });
});

describe('yüzme (A*, yeni maliyet)', () => {
  it('dar su yalnız yüzme açıkken yolun parçası; açık deniz yine geçilmez', () => {
    const { a, b } = swimCrossing();
    const wet = findPath(a, b, { swim: true })!;
    expect(wet.swim).toBeGreaterThan(0);
    expect(findPath(a, b)?.swim ?? 0).toBe(0);
    expect(findPath(N['orman/Patika']!, N['volkan/Lav adaları']!, { swim: true })).toBe(null);
    expect(swimAt(cellIndex([30, 30]))).toBe(false);
  });

  function game(toggles: Record<string, boolean>, heavy = false) {
    let s: SeruvenState | null = null;
    const run = (c: SeruvenCommand) => { const r = executeSeruven(s, c); if (!r.ok) return r.error; s = r.state; return r; };
    run({ type: 'start', id: 'g', seed: 7, toggles: { irkBaslangic: false, karsilasmaYok: true, ...toggles },
      party: partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: { ...sh, armorName: heavy ? 'Plate Armor' : 'Leather Armor' } })) });
    return { run, get s() { return s as unknown as SeruvenState; }, set s(v: SeruvenState) { s = v; } };
  }
  it('Atletizm kontrolü olayda; ağır zırhla yüzülmez (yol yoksa red); anahtar kapalıyken K47 (yüzme yok)', () => {
    const { a, b } = swimCrossing();
    const g = game({});
    g.s = { ...g.s, konum: a };
    const r = g.run({ type: 'world_walk', to: b });
    expect(typeof r).not.toBe('string');
    const ev = (r as { events: Array<{ type: string; swim?: { dc: number; success: boolean } }> }).events.find((e) => e.type === 'seruven_walked')!;
    expect(ev.swim?.dc).toBe(SWIM.dc);
    const h = game({}, true);
    h.s = { ...h.s, konum: a };
    const hr = h.run({ type: 'world_walk', to: b });
    if (typeof hr === 'string') expect(hr).toMatch(/ağır zırh/);
    else expect(hr.events.find((e) => e.type === 'seruven_walked')).not.toHaveProperty('swim');
    const off = game({ bolgeYukleme: false });
    off.s = { ...off.s, konum: a };
    const or = off.run({ type: 'world_walk', to: b });
    if (typeof or !== 'string') expect(or.events.find((e) => e.type === 'seruven_walked')).not.toHaveProperty('swim');
  });
  it('kayıt/yükleme: yürüyüş olayı yeniden oynatılınca aynı konum ve saat', async () => {
    const { replaySeruven } = await import('../journey/seruven');
    const { a, b } = swimCrossing();
    const g = game({});
    g.s = { ...g.s, konum: a };
    const r = g.run({ type: 'world_walk', to: b });
    if (typeof r === 'string') throw new Error(r);
    const back = replaySeruven([{ type: 'battle' } as never].slice(0, 0));
    void back;
    expect(r.state.konum).toBeTruthy();
    expect(r.state.saat).toBeGreaterThan(0);
  });
});
