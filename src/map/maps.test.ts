import { describe, it, expect } from 'vitest';
import { distance, neighbors, type Offset } from '../rules/hex';
import { GRID, RAW_MAPS, getMap, isShaded, loadMap, maps, mirrorMap, tileAt, validateMap, type RawMap } from './maps';
import { TERRAIN, enterCost, isSafeStart, terrainOf } from './terrain';

/** public/maps altındaki görsellerin adları (dosyalar yüklenmez, yalnızca listelenir). */
const IMAGES = new Set(
  Object.keys(import.meta.glob('../../public/maps/*.webp')).map((p) => `maps/${p.split('/').pop() ?? ''}`),
);
const raw = (id: string): RawMap => {
  const r = RAW_MAPS.find((m) => m.id === id);
  if (!r) throw new Error(id);
  return JSON.parse(JSON.stringify(r)) as RawMap;
};

describe('zemin kataloğu', () => {
  it('harfler ve kurallar', () => {
    expect(Object.keys(TERRAIN).sort()).toEqual(['#', '.', 'H', 'c', 'd', 'f', 'k', 'r', 't', '~'].sort());
    expect(terrainOf('H').height).toBe(1);
    expect(terrainOf('d').cover).toBe(2);
    expect(terrainOf('r').cover).toBe(5);
    expect(() => terrainOf('x')).toThrow();
  });
  it('hareket maliyeti: normal 1, zorlu 2, engel ve lav girilemez; uçan zorlu zemin ve lavdan etkilenmez', () => {
    expect(enterCost(terrainOf('.'))).toBe(1);
    expect(enterCost(terrainOf('k'))).toBe(2);
    expect(enterCost(terrainOf('c'))).toBe(null);
    expect(enterCost(terrainOf('~'))).toBe(null);
    expect(enterCost(terrainOf('~'), true)).toBe(1);
    expect(enterCost(terrainOf('t'), true)).toBe(1);
    expect(enterCost(terrainOf('#'), true)).toBe(null);
  });
  it('başlangıç için engel, lav, alev ve kaya kümesi uygun değil; taşlık ve moloz uygun', () => {
    for (const ch of ['c', '#', '~', 'f', 'r']) expect(isSafeStart(terrainOf(ch))).toBe(false);
    for (const ch of ['.', 'd', 'k', 't', 'H']) expect(isSafeStart(terrainOf(ch))).toBe(true);
  });
});

describe('harita yükleme ve doğrulama', () => {
  it('iki harita da hatasız yüklenir ve görselleri var', () => {
    expect(maps.map((m) => m.id)).toEqual(['col', 'volkan']);
    for (const r of RAW_MAPS) expect(validateMap(r, { images: IMAGES })).toEqual([]);
    expect(getMap('volkan').environmentId).toBe('volkan-lav');
    expect(() => getMap('yok')).toThrow();
  });
  it('başlangıç bölgesi sayıları', () => {
    const volkan = getMap('volkan');
    expect(volkan.startZones.players.length).toBe(16);
    expect(volkan.startZones.enemies.length).toBe(16);
    // Kural: aralıktaki engel, lav, alev ve kaya kümesi (r) dışındaki altıgenler.
    const col = getMap('col');
    expect(col.startZones.players.length).toBe(15);
    expect(col.startZones.enemies.length).toBe(20);
  });
  it('başlangıç altıgenleri kendi sütun aralığında ve güvenli', () => {
    for (const m of maps) {
      for (const side of ['players', 'enemies'] as const) {
        const [a, b] = m.zoneRanges[side];
        for (const h of m.startZones[side]) {
          expect(h.col + 1 >= a && h.col + 1 <= b).toBe(true);
          expect(isSafeStart(tileAt(m, h))).toBe(true);
        }
      }
    }
  });
  it('hatalı haritaları bütün sorunlarıyla reddeder', () => {
    const wrongSize = raw('col');
    wrongSize.tiles = wrongSize.tiles.slice(0, 6);
    expect(validateMap(wrongSize).some((e) => e.includes('7 satır'))).toBe(true);

    const badLetter = raw('col');
    badLetter.tiles[0] = `x${badLetter.tiles[0]?.slice(1) ?? ''}`;
    expect(validateMap(badLetter).some((e) => e.includes('bilinmeyen harf "x"'))).toBe(true);

    const shortRow = raw('col');
    shortRow.tiles[2] = shortRow.tiles[2]?.slice(1) ?? '';
    expect(validateMap(shortRow).some((e) => e.includes('satır 3'))).toBe(true);

    const emptyZone = raw('volkan');
    emptyZone.startZones.players.colRange = [1, 1]; // 1. sütun lav ve dış kayalık
    expect(validateMap(emptyZone).some((e) => e.includes('başlangıç bölgesi boş'))).toBe(true);

    const noImage = raw('volkan');
    noImage.variants[0] = { ...(noImage.variants[0] as RawMap['variants'][number]), image: 'maps/yok.webp' };
    expect(validateMap(noImage, { images: IMAGES }).some((e) => e.includes('görsel yok'))).toBe(true);

    const noEnv = raw('col');
    noEnv.environmentId = 'yok';
    expect(() => loadMap(noEnv)).toThrow(/ortam bulunamadı/);
  });
  it('kuralların parametreleri JSON\'dan gelir', () => {
    const heat = getMap('col').variants.find((v) => v.id === 'gunduz')?.rules.find((r) => r.id === 'heat');
    expect(heat?.dc).toBe(12);
    expect(heat?.damage).toBe('1d4');
  });
});

describe('aynalama', () => {
  it('iki kez uygulanınca orijinale döner', () => {
    for (const m of maps) expect(mirrorMap(mirrorMap(m))).toEqual(m);
  });
  it('satırlar ters çevrilir, oyuncular yine solda başlar', () => {
    const col = getMap('col');
    const m = getMap('col', { mirrored: true });
    expect(m.mirrored).toBe(true);
    expect(m.tiles[0]).toBe([...(col.tiles[0] ?? '')].reverse().join(''));
    expect(m.zoneRanges).toEqual(col.zoneRanges);
    // Oyuncular artık sağ taraftaki taşlıklı zeminde başlar.
    expect(m.startZones.players.length).toBe(col.startZones.enemies.length);
    expect(m.startZones.players.every((h) => h.col <= 2)).toBe(true);
  });
  it('komşuluk ve mesafe korunur', () => {
    const a: Offset = { col: 3, row: 2 };
    const b: Offset = { col: 9, row: 5 };
    const mir = (h: Offset): Offset => ({ col: GRID.cols - 1 - h.col, row: h.row });
    expect(distance(mir(a), mir(b))).toBe(distance(a, b));
    for (const n of neighbors(a)) expect(distance(mir(a), mir(n))).toBe(1);
  });
});

describe('zemin sorguları', () => {
  it('tileAt ve ızgara dışı', () => {
    const v = getMap('volkan');
    expect(tileAt(v, { col: 7, row: 2 }).name).toBe('Yüksek bazalt'); // 8. sütun 3. satır
    expect(tileAt(v, { col: 0, row: 0 }).outOfBounds).toBe(true);
    expect(tileAt(v, { col: 20, row: 0 }).outOfBounds).toBe(true);
  });
  it('gölge: gölge veren altıgen ve bitişikleri', () => {
    const col = getMap('col');
    expect(isShaded(col, { col: 0, row: 0 })).toBe(true); // kaya kümesinin kendisi
    expect(isShaded(col, { col: 1, row: 0 })).toBe(true); // kayaya bitişik
    expect(isShaded(col, { col: 7, row: 6 })).toBe(false); // açık kumun ortası
  });
});
