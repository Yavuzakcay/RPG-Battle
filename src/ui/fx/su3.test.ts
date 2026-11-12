/**
 * Kuyruk SU3 (yalnız görsel): su dokusunun altıgen listesi mekanik sudan ayrıldı. `data/efekt-baglama.json` `su.haric` (doku çizilmez)
 * ve `su.ekle` (sığ `n` halkası çizilir) harita kimliği bazında; kıyı altıgenleri soluk ve yumuşak kenarlı. Mekanik su sorguları
 * `waterHexes`'i kullanmaz; `haric` altıgeni `tiles`'ta `w` kalır ve mekanik su sayılır.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { getMap } from '../../map/maps';
import { neighbors } from '../../rules/hex';
import { terrainOf } from '../../map/terrain';
import { isWater } from '../../battle/surfaces';
import { shoreDistances, veryDeepAt } from '../../battle/deepWater';
import type { BattleState } from '../../battle/types';
import { SU, waterHexes } from './fxPlan';
import { FxGround } from './FxLayer';

const at = ([c, r]: readonly [number, number]) => ({ col: c - 1, row: r - 1 });
const stateOf = (id: string, variantId?: string) => { const m = getMap(id, { variantId }); return { m, state: { map: { id, tiles: m.tiles, zones: [] }, combatants: {} } as unknown as BattleState }; };
const DOGRULANMIS = ['orman-heykel-golu', 'col-vaha', 'col-kanyon-nehri', 'ada', 'gemi', 'hapishane-iskele', 'orman-oduncu-kampi', 'kale-onu', 'kale-ic-avlu', 'batak-cukur'];
const DUSUK_GUVEN = ['batak-adalar', 'batak-kale', 'batak-kamp', 'kasaba-lagim', 'derinlikler-mantar-magarasi'];

describe('Kuyruk SU3: haric ve ekle listeleri', () => {
  it('haric yalnız doğrulanmış haritalarda; haric 44 altıgen, ekle yalnız Heykel Gölü ve Vaha; düşük güvenli haritalara dokunulmadı', () => {
    for (const id of [...Object.keys(SU.haric), ...Object.keys(SU.ekle)]) expect(DOGRULANMIS, id).toContain(id);
    for (const id of DUSUK_GUVEN) { expect(SU.haric[id], id).toBeUndefined(); expect(SU.ekle[id], id).toBeUndefined(); }
    expect(Object.values(SU.haric).reduce((n, l) => n + l.length, 0)).toBe(44);
    expect(Object.keys(SU.ekle).sort()).toEqual(['col-vaha', 'orman-heykel-golu']);
  });
  it('her haric adresi gerçek haritada w (R) harfi, her ekle adresi sığ su n; adresler 1 tabanlı ve haritanın içinde', () => {
    for (const [id, list] of Object.entries(SU.haric)) {
      const { m } = stateOf(id);
      for (const a of list) { const h = at(a); expect(SU.harf, `${id} ${a}`).toContain(m.tiles[h.row]?.[h.col]); }
    }
    for (const [id, list] of Object.entries(SU.ekle)) {
      const { m } = stateOf(id);
      for (const a of list) { const h = at(a); expect(SU.sigHarf, `${id} ${a}`).toContain(m.tiles[h.row]?.[h.col]); }
    }
  });
  it('waterHexes: haric düşer, ekle sığ dalga olarak eklenir, tiles değişmez', () => {
    for (const id of ['orman-heykel-golu', 'orman-oduncu-kampi', 'batak-cukur', 'kale-onu', 'col-vaha']) {
      const { m, state } = stateOf(id);
      const before = JSON.stringify(m.tiles);
      const w = waterHexes(state);
      expect(JSON.stringify(state.map!.tiles), id).toBe(before);
      const has = (c: number, r: number) => w.find((x) => x.at.col === c && x.at.row === r);
      for (const a of SU.haric[id] ?? []) expect(has(at(a).col, at(a).row), `${id} haric ${a}`).toBeUndefined();
      for (const a of SU.ekle[id] ?? []) {
        const x = has(at(a).col, at(a).row);
        expect(x, `${id} ekle ${a}`).toBeDefined();
        expect(x!.kind).toBe('dalga');
        expect(x!.shallow).toBe(true);
      }
      const letters = m.tiles.join('').split('').filter((c) => SU.harf.includes(c)).length;
      expect(w.length, id).toBe(letters - (SU.haric[id]?.length ?? 0) + (SU.ekle[id]?.length ?? 0));
    }
  });
  it('ekle altıgeni artık sığ su değilse (zemin değişti) çizilmez; önbellek harita kimliğine de bağlı', () => {
    const { m } = stateOf('col-vaha');
    const a = (SU.ekle['col-vaha'] ?? [])[0]!;
    const h = at(a);
    const tiles = m.tiles.map((l, r) => (r === h.row ? l.slice(0, h.col) + '.' + l.slice(h.col + 1) : l));
    const w = waterHexes({ map: { id: 'col-vaha', tiles } } as never);
    expect(w.some((x) => x.at.col === h.col && x.at.row === h.row)).toBe(false);
    const same = m.tiles;
    const x1 = waterHexes({ map: { id: 'col-vaha', tiles: same } } as never);
    const x2 = waterHexes({ map: { id: 'baska', tiles: same } } as never);
    expect(x1).not.toBe(x2);
    expect(x2.some((x) => x.shallow)).toBe(false);
    expect(waterHexes({ map: { id: 'col-vaha', tiles: same } } as never)).toBe(x1);
  });
});

describe('Kuyruk SU3: mekanik su doku listesinden bağımsız', () => {
  it('haric altıgeni tiles\'ta w kalır; mekanik sorgular su sayar, doku çizmez', () => {
    for (const [id, list] of Object.entries(SU.haric)) {
      const { m, state } = stateOf(id);
      const drawn = waterHexes(state);
      for (const a of list) {
        const h = at(a);
        expect(m.tiles[h.row]![h.col], `${id} ${a}`).toBe('w');
        expect(terrainOf('w').rule).toBe('deepWater');
        expect(isWater(state, h), `${id} ${a}`).toBe(true);
        expect(shoreDistances(m.tiles)[h.row * m.tiles[0]!.length + h.col], id).toBeGreaterThanOrEqual(0);
        expect(drawn.some((x) => x.at.col === h.col && x.at.row === h.row)).toBe(false);
      }
    }
  });
  it('ekle altıgeni mekanikte hâlâ sığ su n (derin su değil); doku çizer', () => {
    const { m, state } = stateOf('orman-heykel-golu');
    for (const a of SU.ekle['orman-heykel-golu']!) {
      const h = at(a);
      expect(m.tiles[h.row]![h.col]).toBe('n');
      expect(terrainOf('n').rule).toBeUndefined();
      expect(isWater(state, h)).toBe(true);
      expect(veryDeepAt(m.tiles, h, 3)).toBe(false);
    }
  });
  it('mekanik modüller (battle, rules, map, app, sim) waterHexes ya da doku verisini içe aktarmaz', () => {
    const all = import.meta.glob('../../{battle,rules,map,app,sim}/**/*.{ts,tsx}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
    const files = Object.entries(all).filter(([f]) => !/\.test\./.test(f));
    expect(files.length).toBeGreaterThan(100);
    for (const [f, src] of files) expect(src, f).not.toMatch(/waterHexes|ui\/fx\/fxPlan|efekt-baglama\.json/);
  });
});

describe('Kuyruk SU3: kıyı soluklaştırma ve yumuşak kenar', () => {
  it('veri: kıyı ≈ %50, sığ ekle ≈ %70, kenar 1–2 px', () => {
    expect(SU.kiyiOpaklik).toBeGreaterThanOrEqual(0.4); expect(SU.kiyiOpaklik).toBeLessThanOrEqual(0.6);
    expect(SU.ekleOpaklik).toBeGreaterThanOrEqual(0.6); expect(SU.ekleOpaklik).toBeLessThanOrEqual(0.8);
    expect(SU.kenarYumusat).toBeGreaterThanOrEqual(1); expect(SU.kenarYumusat).toBeLessThanOrEqual(2);
  });
  it('shore: komşusu listede olmayan altıgen (kara, haric, n); iç altıgen değil; harita kenarı kıyı sayılmaz', () => {
    const { state } = stateOf('orman-heykel-golu');
    const w = waterHexes(state);
    const key = (c: number, r: number) => `${c},${r}`;
    const set = new Set(w.map((x) => key(x.at.col, x.at.row)));
    expect(w.some((x) => x.shore)).toBe(true);
    expect(w.some((x) => !x.shore)).toBe(true);
    const size = { cols: state.map!.tiles[0]!.length, rows: state.map!.tiles.length };
    for (const x of w) {
      const missing = neighbors(x.at, size).some((n) => !set.has(key(n.col, n.row)));
      expect(!!x.shore, `${x.at.col},${x.at.row}`).toBe(missing);
    }
    // Tam su haritasının (tüm hex su) kenarı kıyı değildir.
    const all = waterHexes({ map: { id: 'x', tiles: ['ww', 'ww'] } } as never);
    expect(all.some((x) => x.shore)).toBe(false);
    const one = waterHexes({ map: { id: 'x2', tiles: ['w.', 'ww'] } } as never);
    expect(one.find((x) => x.at.col === 0 && x.at.row === 0)?.shore).toBe(true);
  });
  it('FxGround: tür başına tek desen (tek animasyon örneği), kıyı yolu bulanıklıkla ve soluk, sığ yol daha soluk', () => {
    const { state } = stateOf('orman-heykel-golu');
    const geo = { hexCenter: (o: { col: number; row: number }) => ({ x: o.col * 80, y: o.row * 70 }), tokenCenter: () => ({ x: 0, y: 0 }), hexW: 111, hexH: 95 };
    const html = renderToStaticMarkup(createElement('svg', null, createElement(FxGround, { state, enabled: true, reduceMotion: false, geo, used: 0, tokenUsed: new Map() })));
    for (const k of ['dalga', 'havuz']) expect((html.match(new RegExp(`<pattern id="fx-su-${k}"`, 'g')) ?? []).length).toBeLessThanOrEqual(1);
    expect(html).toContain('feGaussianBlur');
    expect(html).toContain(`stdDeviation="${SU.kenarYumusat}"`);
    expect(html).toContain('data-shore="1"');
    expect(html).toContain('data-shallow="1"');
    const op = (re: RegExp) => Number(re.exec(html)?.[1]);
    expect(op(/data-water="havuz"[\s\S]*?data-shore="1"[^>]*opacity="([\d.]+)"/)).toBeCloseTo(SU.opaklik.havuz * SU.kiyiOpaklik, 3);
    // Efekt kapalı / hareketi azalt: aynı liste (aynı yol sayısı), animasyon yok.
    const still = renderToStaticMarkup(createElement('svg', null, createElement(FxGround, { state, enabled: false, reduceMotion: true, geo, used: 0, tokenUsed: new Map() })));
    expect((still.match(/<path /g) ?? []).length).toBe((html.match(/<path /g) ?? []).length);
    expect(still).not.toContain('data-animated="1"');
  });
});
