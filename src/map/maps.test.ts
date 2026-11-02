import { describe, it, expect } from 'vitest';
import regionData from '../../harita/_ortak/harita-bolgeleri.json';
import stealthJson from '../../data/stealth.json';
import { distance, neighbors, type Offset } from '../rules/hex';
import { startBattle } from '../battle/create';
import {
  GRID, MAP_FILES, RAW_MAPS, environmentFor, getMap, isShaded, loadMap, maps, mirrorMap, tileAt, validateMap, type RawMap,
} from './maps';
import { TERRAIN, enterCost, isSafeStart, terrainOf } from './terrain';
import { ESKI_VOLKAN } from './fixtures/eskiVolkan';
import bolgeData from '../../harita/_ortak/harita-bolgeleri.json';

/** public/maps altındaki görsellerin adları (dosyalar yüklenmez, yalnızca listelenir). */
const IMAGES = new Set(
  Object.keys(import.meta.glob('../../public/maps/**/*.webp')).map((p) => p.replace(/^.*public\/(maps\/)/, '$1')),
);
const raw = (id: string): RawMap => {
  const r = id === ESKI_VOLKAN.id ? ESKI_VOLKAN : RAW_MAPS.find((m) => m.id === id);
  if (!r) throw new Error(id);
  return JSON.parse(JSON.stringify(r)) as RawMap;
};

describe('zemin kataloğu', () => {
  it('harfler ve kurallar', () => {
    expect(Object.keys(TERRAIN).sort()).toEqual([...'.drcktH~f#shzuiqagvenbwpmxojOlyYRC'].sort()); // C: kayalık çukur (Kuyruk 41b pitFall); O: kapalı kapı (gate); l, y: basamak; Y: yürüyen merdiven (Kuyruk 21 D2b); R: geçilmez nehir (Kuyruk 24)
    expect(terrainOf('Y')).toMatchObject({ height: 1, movement: 'normal', stairs: true });
    expect(terrainOf('l')).toMatchObject({ height: 1, movement: 'normal', stairs: true });
    expect(terrainOf('y')).toMatchObject({ height: 2, movement: 'normal', stairs: true });
    expect(terrainOf('l').climbCost).toBeUndefined();
    expect(terrainOf('H').height).toBe(1);
    expect(terrainOf('d').cover).toBe(2);
    expect(terrainOf('r').cover).toBe(5);
    expect(() => terrainOf('?')).toThrow();
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

// Kuyruk 29/32: bölgenin görsel adı önekleri (harita-bolgeleri.json `onekler`: bataklik → batak, col → yeralti).
const PREFIXES: Record<string, string[]> = Object.fromEntries((regionData.bolgeler as Array<{ id: string; onekler?: string[] }>).map((b) => [b.id, b.onekler ?? []]));

describe('harita yükleme ve doğrulama', () => {
  it('58 harita da hatasız yüklenir ve görselleri var (12 Klasik + Görev H2\'nin 3 geniş haritası + Görev KB Kale Baskını + Kuyruk 16 K16B vitrin haritası + Kuyruk 18 V1 Volkan Seferi 4 haritası + Kuyruk 21 Derinlikler 4 haritası + Kuyruk 23 Orman paketi 4 haritası + Kuyruk 27 Çöl paketi 4 haritası + Kuyruk 29 Buzul, Dağ, Bataklık paketleri 12 haritası + Kuyruk 32 yeraltı nehri + Kuyruk 34a 6 yerleşim haritası + Kuyruk 35 kasaba seti 2 harita + Kuyruk 36 Hapishane Adası 4 haritası)', () => {
    expect(maps.map((m) => m.id)).toEqual([
      'ada', 'batak-adalar', 'batak-cukur', 'batak-kale', 'batak-kamp', 'bataklik', 'beyaz-sehir-dis-kapi', 'beyaz-sehir-saray-avlusu', 'buzul-acik', 'buzul-kamp', 'buzul-kayalik', 'buzul-tapinak', 'col', 'col-gemi-enkazi', 'col-kanyon-nehri', 'col-sutun-harabesi', 'col-vaha', 'dag', 'dag-karakol', 'dag-kayalik', 'dag-kopru', 'dag-nobetci', 'derinlikler-lav-salonu', 'derinlikler-magara-karakol', 'derinlikler-mantar-magarasi', 'derinlikler-mezar-labirenti', 'dungeon', 'gemi', 'hapishane-dis-halka', 'hapishane-hucre-platformu', 'hapishane-iskele', 'hapishane-mudur-kulesi', 'isinlanma-salonu', 'kale', 'kale-avlu', 'kale-baskini', 'kale-ic-avlu', 'kale-onu', 'kale-taht-salonu', 'kanyon-koprusu', 'kasaba-demirci-tapinak', 'kasaba-han', 'kasaba-lagim', 'lav-tapinagi', 'magara', 'magara-genis', 'orman', 'orman-heykel-golu', 'orman-heykel-magarasi', 'orman-kemik-acikligi', 'orman-oduncu-kampi', 'orman-ork-kampi', 'orman-yolu', 'ortamlar-diyari', 'sehir-meydani', 'taverna', 'volkan', 'volkanik-demirhane', 'yeralti-nehri',
    ]);
    expect(maps.filter((m) => m.sefer === 'volkan').map((m) => m.id)).toEqual(['isinlanma-salonu', 'kanyon-koprusu', 'lav-tapinagi', 'volkanik-demirhane']);
    expect(maps.filter((m) => m.sefer === 'derinlikler').map((m) => m.id)).toEqual(['derinlikler-lav-salonu', 'derinlikler-magara-karakol', 'derinlikler-mantar-magarasi', 'derinlikler-mezar-labirenti']);
    expect(maps.filter((m) => m.vitrin).map((m) => m.id)).toEqual(['ortamlar-diyari']);
    for (const r of RAW_MAPS) expect(validateMap(r, { images: IMAGES })).toEqual([]);
    // Kuyruk 19 D1: her haritada bölge ve görsel adı ("<bolge>/<bolge>-<ad>", ASCII); kimlik değişmedi.
    for (const r of RAW_MAPS) { expect(r.bolge, r.id).toMatch(/^[a-z0-9-]+$/); expect(r.gorsel, r.id).toMatch(new RegExp(`^${r.bolge}/(${[r.bolge, ...(PREFIXES[r.bolge ?? ''] ?? [])].join('|')})-[a-z0-9-]+$`)); }
    // Kuyruk 19C/19D: dosya harita/<bolge>/<ad>.json; klasör kaydın `bolge` alanı, dosya adı ad tabanı (gorsel adı).
    for (const [p, r] of Object.entries(MAP_FILES)) expect(p, r.id).toBe(`harita/${String(r.bolge)}/${String(r.gorsel).split('/')[1]}.json`);
    expect(new Set(RAW_MAPS.map((r) => r.id)).size).toBe(RAW_MAPS.length);
    expect(Object.keys(MAP_FILES)).toHaveLength(RAW_MAPS.length);
    const known = new Set(bolgeData.bolgeler.map((b) => b.id));
    for (const r of RAW_MAPS) expect(known.has(r.bolge as string), `${r.id}: ${String(r.bolge)}`).toBe(true);
    const bad = raw('ada'); bad.gorsel = 'deniz/Deniz-Ada';
    expect(validateMap(bad).some((e) => e.includes('görsel adı'))).toBe(true);
    expect(getMap('volkan').environmentId).toBe('volkan-lav');
    expect(() => getMap('yok')).toThrow();
  });
  it('başlangıç bölgesi sayıları', () => {
    // Sütun aralığından hesaplanan bölge (sabit fikstür: eski Volkan düzeni).
    const volkan = loadMap(ESKI_VOLKAN);
    expect(volkan.startZones.players.length).toBe(16);
    expect(volkan.startZones.enemies.length).toBe(16);
    // Hazır listeli bölge (Volkan: kıyı adalarında 10'ar altıgen).
    const yeni = getMap('volkan');
    expect([yeni.startZones.players.length, yeni.startZones.enemies.length]).toEqual([10, 10]);
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
    badLetter.tiles[0] = `?${badLetter.tiles[0]?.slice(1) ?? ''}`;
    expect(validateMap(badLetter).some((e) => e.includes('bilinmeyen harf "?"'))).toBe(true);

    const shortRow = raw('col');
    shortRow.tiles[2] = shortRow.tiles[2]?.slice(1) ?? '';
    expect(validateMap(shortRow).some((e) => e.includes('satır 3'))).toBe(true);

    const emptyZone = raw(ESKI_VOLKAN.id);
    emptyZone.startZones.players.colRange = [1, 1]; // 1. sütun lav ve dış kayalık
    expect(validateMap(emptyZone).some((e) => e.includes('başlangıç bölgesi boş'))).toBe(true);

    const noImage = raw(ESKI_VOLKAN.id);
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
  // Kuyruk 19: aynalama yalnızca eski kayıtlar için; tek sütunlu haritada iki kez uygulanınca orijinale döner.
  it('iki kez uygulanınca orijinale döner; çift sütunlu harita reddedilir', () => {
    for (const m of maps.filter((x) => x.size.cols % 2 === 1)) expect(mirrorMap(mirrorMap(m))).toEqual(m);
    const even = maps.find((x) => x.size.cols % 2 === 0);
    if (even) expect(() => mirrorMap(even)).toThrow(/aynalanamaz/);
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
    const v = loadMap(ESKI_VOLKAN);
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

describe('yeni haritalar (GOREV-YENI-HARITALAR.md)', () => {
  it('hazır başlangıç listelerinin sayıları', () => {
    const expected: Record<string, [number, number]> = {
      ada: [8, 11], bataklik: [10, 9], 'dag/kis': [12, 11], dag: [11, 12], dungeon: [13, 14], gemi: [17, 15],
      kale: [15, 18], magara: [8, 8], orman: [14, 15], 'sehir-meydani': [9, 10], taverna: [11, 9],
    };
    for (const [key, [p, e]] of Object.entries(expected)) {
      const [id, variantId] = key.split('/') as [string, string | undefined];
      const m = getMap(id, variantId ? { variantId } : {});
      expect(m.explicitZones).toBe(true);
      expect([m.startZones.players.length, m.startZones.enemies.length]).toEqual([p, e]);
    }
    expect(getMap('col').explicitZones).toBe(false);
  });
  it('Kuyruk 19: harita verisinde aynalama alanı yok', () => {
    for (const r of RAW_MAPS) expect('mirrorable' in r).toBe(false);
  });
  it('başlangıç altıgenleri geçilebilir ve iki taraf çakışmıyor', () => {
    for (const m of maps) {
      const keys = new Set(m.startZones.players.map((h) => `${h.col},${h.row}`));
      expect(m.startZones.enemies.some((h) => keys.has(`${h.col},${h.row}`))).toBe(false);
      for (const h of [...m.startZones.players, ...m.startZones.enemies]) expect(isSafeStart(tileAt(m, h))).toBe(true);
    }
  });
  it('hazır listeli harita aynalanınca oyuncular düşman listesinin aynasını alır', () => {
    const ada = getMap('ada');
    const m = getMap('ada', { mirrored: true });
    expect(m.startZones.players).toEqual(ada.startZones.enemies.map((h) => ({ col: 14 - h.col, row: h.row })));
    for (const h of m.startZones.players) expect(isSafeStart(tileAt(m, h))).toBe(true);
  });
  it('hazır listede hatalı altıgenler reddedilir', () => {
    const unsafe = raw('kale');
    unsafe.startZones.players.hexes = [[9, 1]]; // duvar, aralık dışı
    expect(validateMap(unsafe).some((e) => e.includes('aralığının veya haritanın dışında'))).toBe(true);
    const wall = raw('kale');
    wall.startZones.enemies.hexes = [[15, 2]]; // s duvar
    expect(validateMap(wall).some((e) => e.includes('uygun değil ("s")'))).toBe(true);
    const dup = raw('ada');
    const first = dup.startZones.players.hexes?.[0] as number[];
    dup.startZones.players.hexes = [first, first];
    expect(validateMap(dup).some((e) => e.includes('iki kez'))).toBe(true);
    // Kuyruk 19: aynalama kalktı; simetrik olmayan sütun aralığı artık hata değil.
    const lopsided = raw('ada');
    lopsided.startZones.players.colRange = [1, 7];
    expect(validateMap(lopsided).some((e) => e.includes('birbirinin aynası'))).toBe(false);
  });
  it('varyant kendi ortamını verebilir (fırtına)', () => {
    const ada = getMap('ada');
    expect(environmentFor(ada, 'gunes')).toBe('d-z-zemin');
    expect(environmentFor(ada, 'firtina')).toBe('f-rt-na-ya-mur');
    const bad = raw('ada');
    (bad.variants[1] as RawMap['variants'][number]).environmentId = 'yok';
    expect(validateMap(bad).some((e) => e.includes('varyantının ortamı bulunamadı'))).toBe(true);
  });
  it('yeni kural kimlikleri JSON\'da duruyor (motor davranışı Adım 8)', () => {
    const ids = new Set(maps.flatMap((m) => m.variants.flatMap((v) => v.rules.map((r) => r.id))));
    for (const id of ['bog', 'deepWater', 'ice', 'cold', 'storm', 'darkness', 'trap', 'stealth', 'gate', 'crenel', 'objective']) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe('yeni zemin harfleri', () => {
  it('yükseklik 0/1/2, uçurumun üstünden yalnızca uçan geçer', () => {
    expect([terrainOf('p').height, terrainOf('h').height, terrainOf('z').height]).toEqual([0, 1, 2]);
    expect(enterCost(terrainOf('u'))).toBe(null);
    expect(enterCost(terrainOf('u'), true)).toBe(1);
    expect(enterCost(terrainOf('s'), true)).toBe(null);
  });
  it('siper, zorlu zemin, görüş ve kural bağları', () => {
    expect(terrainOf('a')).toMatchObject({ movement: 'blocked', cover: 5, blocksSight: true });
    expect(terrainOf('g')).toMatchObject({ movement: 'difficult', cover: 2 });
    // Gizlenme bonusu zemin kataloğunda değil, veride (Görev K): data/stealth.json çalılık +2.
    expect(stealthJson.terrain).toMatchObject({ g: 2, d: 0 });
    expect(terrainOf('x')).toMatchObject({ movement: 'difficult', cover: 2 });
    expect(terrainOf('e').light).toEqual({ radiusHexes: 4 });
    expect(terrainOf('w')).toMatchObject({ movement: 'difficult', rule: 'deepWater' });
    expect([terrainOf('i').rule, terrainOf('b').rule, terrainOf('j').rule]).toEqual(['ice', 'bog', 'trap']);
    expect(terrainOf('j').hidden).toBe(true);
  });
});

describe('varyant düzeni (Dağ: yaz ve kış)', () => {
  it('kış kendi zemini, başlangıç bölgeleri, kuralları ve ortamıyla yüklenir', () => {
    const yaz = getMap('dag');
    const kis = getMap('dag', { variantId: 'kis' });
    expect(yaz.variantId).toBe('yaz');
    expect(kis.variantId).toBe('kis');
    expect(kis.tiles).not.toEqual(yaz.tiles);
    expect(kis.tiles.join('')).toContain('i');
    expect(environmentFor(kis, 'kis')).toBe('buzul-dondurucu-so-uk');
    expect(environmentFor(yaz, 'yaz')).toBe('da-u-urum');
    expect(kis.variants.find((v) => v.id === 'kis')?.rules.map((r) => r.id)).toEqual(['climb', 'ice', 'cold']);
    const { state } = startBattle('d', 'd-z-zemin', [], () => 0.5, { map: { id: 'dag', variantId: 'kis' } });
    expect(state.map?.tiles).toEqual(kis.tiles);
    expect(state.environmentId).toBe('buzul-dondurucu-so-uk');
  });
  it('aynalama varyantın kendi zeminini ve başlangıç bölgelerini çevirir', () => {
    const kis = getMap('dag', { variantId: 'kis' });
    const m = getMap('dag', { variantId: 'kis', mirrored: true });
    expect(m.tiles).toEqual(kis.tiles.map((row) => [...row].reverse().join('')));
    expect(m.startZones.players.length).toBe(kis.startZones.enemies.length);
    expect(mirrorMap(m)).toEqual(kis);
  });
  it('doğrulama varyantın düzenini de denetler', () => {
    const bad = JSON.parse(JSON.stringify(RAW_MAPS.find((m) => m.id === 'dag'))) as RawMap;
    (bad.variants[1] as RawMap['variants'][number]).tiles = ['###'];
    expect(validateMap(bad).some((e) => e.includes('dag/kis'))).toBe(true);
  });
});

describe('varyant adları (görünen ad, kimlik değişmez)', () => {
  it('Orman: Gündüz/Gece (TR), Day/Night (EN); kimlikler orman ve gece', async () => {
    const { maps, variantLabel } = await import('./maps');
    const orman = maps.find((m) => m.id === 'orman');
    expect(orman?.variants.map((v) => v.id)).toEqual(['orman', 'gece']);
    expect(orman?.variants.map((v) => variantLabel(v, 'tr'))).toEqual(['Gündüz', 'Gece']);
    expect(orman?.variants.map((v) => variantLabel(v, 'en'))).toEqual(['Day', 'Night']);
    for (const m of maps) for (const v of m.variants) expect(variantLabel(v, 'tr')).not.toBe('Orman açıklığı');
    // İngilizce adı olmayan varyantta Türkçe ad.
    expect(variantLabel({ name: 'Gece' }, 'en')).toBe('Gece');
  });
});

describe('Kuyruk 41b: Üst seviyede gizlenen 1–5. seviye senaryosu', () => {
  it('Kale Baskını ustSeviyeGizli; seçici görünürlüğü anahtara bağlı', async () => {
    const { getMap, pickerVisible } = await import('./maps');
    expect(getMap('kale-baskini').ustSeviyeGizli).toBe(true);
    expect(pickerVisible({ ustSeviyeGizli: true }, false)).toBe(true);
    expect(pickerVisible({ ustSeviyeGizli: true }, true)).toBe(false);
    expect(pickerVisible({ gizli: true }, false)).toBe(false);
    expect(pickerVisible({}, true)).toBe(true);
  });
  it('Serüven: ustSeviyeGizli düğüm Üst seviye anahtarı açıkken görünmez', async () => {
    const { nodeVisible } = await import('../journey/seruven');
    const node = { id: 'x', ustSeviyeGizli: true } as never;
    expect(nodeVisible({ flags: [], toggles: {} }, node)).toBe(true);
    expect(nodeVisible({ flags: [], toggles: { ustSeviye: true } }, node)).toBe(false);
  });
});
