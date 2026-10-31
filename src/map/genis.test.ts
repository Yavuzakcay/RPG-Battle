/**
 * Görev H2: üç geniş harita (Orman yolu 31×17, Kale ve avlu 31×17, Mağara (orta) 21×11). Geçerlilik, taraf başına ≥ 6
 * başlangıç altıgeni, erişilebilirlik (ulaşılamaz bölge ve çıkmaz başlangıç yok), Klasik haritalara dokunulmadı, ad ve
 * açıklama TR+EN; geniş haritada motor (savaş kurulumu, görüş/menzil, alan) çalışır.
 */
import { describe, expect, it } from 'vitest';
import { RAW_MAPS, getMap, isWideMap, maps, tileAt, validateMap, type BattleMap } from './maps';
import { neighbors, hexKey, distance, type Offset } from '../rules/hex';
import { STRINGS_TR } from '../i18n/strings';
import { en } from '../i18n/strings.en';
import { SCENARIOS, seeded, setupBattle } from '../sim/balance';
import { areaHexes } from '../rules/area';

const WIDE = ['orman-yolu', 'kale-avlu', 'kale-baskini', 'magara-genis'];
const passable = (m: BattleMap, h: Offset) => { const t = tileAt(m, h); return t.movement !== 'blocked' && t.movement !== 'deadly' && !t.outOfBounds; };

function reachable(m: BattleMap, from: Offset[]): Set<string> {
  const seen = new Set(from.map(hexKey));
  const queue = [...from];
  while (queue.length) {
    const h = queue.shift()!;
    for (const n of neighbors(h, m.size)) if (passable(m, n) && !seen.has(hexKey(n))) { seen.add(hexKey(n)); queue.push(n); }
  }
  return seen;
}

describe('geniş haritalar', () => {
  it('üçü de var, geçerli ve boyutları doğru; Klasik haritalar 15×7 kaldı', () => {
    const sizes = Object.fromEntries(WIDE.map((id) => [id, `${getMap(id).size.cols}×${getMap(id).size.rows}`]));
    expect(sizes).toEqual({ 'orman-yolu': '31×17', 'kale-avlu': '31×17', 'kale-baskini': '31×17', 'magara-genis': '21×11' });
    for (const id of WIDE) expect(validateMap(RAW_MAPS.find((m) => m.id === id)!)).toEqual([]);
    // Kuyruk 16 K16B: vitrin haritası (31×17) geniş grubun sayısına girmez.
    expect(maps.filter((m) => isWideMap(m) && !m.vitrin).map((m) => m.id).sort()).toEqual([...WIDE].sort());
    for (const m of maps.filter((x) => !isWideMap(x))) expect([m.size.cols, m.size.rows]).toEqual([15, 7]);
  });
  it('taraf başına en az 6 uygun başlangıç altıgeni; her başlangıç karşı tarafa ulaşır; ulaşılamaz bölge yok', () => {
    for (const id of WIDE) {
      const m = getMap(id);
      expect(m.startZones.players.length, id).toBeGreaterThanOrEqual(6);
      expect(m.startZones.enemies.length, id).toBeGreaterThanOrEqual(6);
      const all: Offset[] = [];
      for (let row = 0; row < m.size.rows; row++) for (let col = 0; col < m.size.cols; col++) if (passable(m, { col, row })) all.push({ col, row });
      const fromPlayers = reachable(m, m.startZones.players.slice(0, 1));
      const unreachable = all.filter((h) => !fromPlayers.has(hexKey(h)));
      expect(unreachable.map(hexKey), `${id}: ulaşılamaz altıgen`).toEqual([]);
      for (const s of [...m.startZones.players, ...m.startZones.enemies]) expect(fromPlayers.has(hexKey(s)), `${id} ${hexKey(s)}`).toBe(true);
    }
  });
  it('başlangıç mesafesi (en yakın iki rakip başlangıç altıgeni) en az 12 altıgen', () => {
    for (const id of WIDE) {
      const m = getMap(id);
      const d = Math.min(...m.startZones.players.flatMap((p) => m.startZones.enemies.map((e) => distance(p, e))));
      expect(d, id).toBeGreaterThanOrEqual(12);
    }
  });
  it('ad ve açıklama TR + EN çeviri tablosunda', () => {
    for (const id of WIDE) {
      expect(STRINGS_TR.gm.mapInfo[id]?.name).toBeTruthy(); expect(STRINGS_TR.gm.mapInfo[id]?.desc).toBeTruthy();
      expect(en.gm.mapInfo[id]?.name).toBeTruthy(); expect(en.gm.mapInfo[id]?.desc).toBeTruthy();
    }
  });
  it('her haritada 2 örnek karşılaşma; savaş kurulur, görüş/menzil ve alan geniş haritada çalışır', () => {
    for (const id of WIDE) {
      const list = SCENARIOS.filter((s) => s.map?.mapId === id);
      expect(list.length, id).toBeGreaterThanOrEqual(2);
      for (const s of list) expect(setupBattle(s, seeded(1)).status).toBe('active');
    }
    // Alan geometrisi büyük ızgarada kenara taşmadan (31×17 köşesinde 20 ft küre).
    const big = getMap('orman-yolu');
    const corner = areaHexes({ shape: 'sphere', sizeFt: 20, origin: 'point' }, { col: 30, row: 16 }, { col: 30, row: 16 }, big.size);
    expect(corner.length).toBeGreaterThan(5);
    for (const h of corner) { expect(h.col).toBeLessThan(31); expect(h.row).toBeLessThan(17); }
  });
});

describe('Ortamlar Diyarı (Kuyruk 16 K16B: test ve vitrin haritası)', () => {
  const m = getMap('ortamlar-diyari');
  it('31×17, geçerli; bütün zemin türleri en az bir kez; uydurma harf yok', async () => {
    const { TERRAIN } = await import('./terrain');
    expect([m.size.cols, m.size.rows]).toEqual([31, 17]);
    expect(validateMap(RAW_MAPS.find((r) => r.id === 'ortamlar-diyari')!)).toEqual([]);
    const used = new Set(m.tiles.join(''));
    expect([...used].sort()).toEqual(Object.keys(TERRAIN).sort());
  });
  it('parti kuzeybatıda (6+), düşman doğu ve güneyde (6+); ulaşılamaz altıgen yok', () => {
    expect(m.startZones.players.length).toBeGreaterThanOrEqual(6);
    expect(m.startZones.enemies.length).toBeGreaterThanOrEqual(6);
    for (const p of m.startZones.players) { expect(p.col).toBeLessThan(8); expect(p.row).toBeLessThan(8); }
    for (const e of m.startZones.enemies) expect(e.col >= 16 || e.row >= 12).toBe(true);
    const all: Offset[] = [];
    for (let row = 0; row < m.size.rows; row++) for (let col = 0; col < m.size.cols; col++) if (passable(m, { col, row })) all.push({ col, row });
    const from = reachable(m, m.startZones.players.slice(0, 1));
    expect(all.filter((h) => !from.has(hexKey(h))).map(hexKey)).toEqual([]);
    for (const s of m.startZones.enemies) expect(from.has(hexKey(s))).toBe(true);
  });
  it('yüzey meydanı: dokuz tür, her biri ≥ 3×3, en az iki farklı türün bitiştiği yer; nesneler (varil, barut, kapı, kilitli kapı)', () => {
    const surf = m.surfaces ?? [];
    const kinds = surf.map((s) => s.kind ?? s.spell).sort();
    expect(kinds).toEqual(['fire', 'fog-cloud', 'grease', 'ice', 'oil', 'poison', 'steam', 'water', 'web']);
    for (const s of surf) {
      expect(s.hexes.length).toBeGreaterThanOrEqual(9);
      for (const h of s.hexes) expect(passable(m, h), hexKey(h)).toBe(true);
    }
    const touching = surf.flatMap((a, i) => surf.slice(i + 1).filter((b) => a.hexes.some((h) => neighbors(h).some((n) => b.hexes.some((x) => hexKey(x) === hexKey(n))))).map((b) => `${a.kind ?? a.spell}+${b.kind ?? b.spell}`));
    expect(touching).toEqual(expect.arrayContaining(['water+ice', 'oil+fire']));
    expect(m.objects.map((o) => o.kind).sort()).toEqual(expect.arrayContaining(['door', 'gate', 'oilBarrel', 'powderKeg']));
    expect(m.objects.find((o) => o.kind === 'gate')?.state).toBe('locked');
  });
  it('savaş hazır yüzeylerle başlar (alanlar sahipsiz ve süresiz); denge senaryolarında yok', async () => {
    const { startBattle } = await import('../battle');
    const { state } = startBattle('d', 'd-z-zemin', [], seeded(1), { map: { id: 'ortamlar-diyari' } });
    const zones = state.map?.zones ?? [];
    expect(zones.length).toBe(9);
    expect(zones.filter((z) => z.surface).map((z) => z.surface).sort()).toEqual(['fire', 'ice', 'oil', 'poison', 'steam', 'water']);
    for (const z of zones) { expect(z.until).toBeUndefined(); expect(z.concentration).toBeUndefined(); }
    expect(SCENARIOS.some((s) => s.map?.mapId === 'ortamlar-diyari')).toBe(false);
    // Eski haritalarda hazır alan yok.
    expect(startBattle('k', 'd-z-zemin', [], seeded(1), { map: { id: 'kale-baskini' } }).state.map?.zones).toBeUndefined();
  });
});
