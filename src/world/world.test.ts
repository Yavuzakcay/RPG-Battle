/** K45/K46: dünya haritası saf modülleri (kamera, karo, keşif sisi, Hapishane takvimi). Görsel yok. */
import { describe, expect, it } from 'vitest';
import { clampCamera, fitRect, fitWorld, scaleBar, toScreen, toWorld, viewRect, zoomAt } from './camera';
import { Lru, tilesInView, zoomFor, type TileManifest } from './tiles';
import { CELL_H, CELL_W, decodeFog, emptyFog, encodeFog, isRevealed, revealCircle, revealPath, revealedCount, unlockIslands } from './fog';
import { CAMERAS, ISLANDS, WORLD, cellName, inPolygon, nodeWorld, pxToMiles, rectCenter, type Pt } from './worldData';
import { partyWorld, seruvenFog, startFog } from './seruvenFog';
import { daysToSurface, prisonSurfaced, seruvenDay } from './prison';
import { executeSeruven, replaySeruven, type SeruvenEvent, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import dunya from '../../data/harita/tum_dugumler_dunya.json';

const VP = { w: 1200, h: 700 };

// K45 çıktısı (varsa): yalnızca manifest JSON'u okunur, karo görselleri değil.
const manifests = import.meta.glob('../../public/maps/dunya/manifest.json', { eager: true, import: 'default' }) as Record<string, TileManifest>;
const synthetic: TileManifest = {
  tuval: [WORLD.w, WORLD.h], karo: 512, seviye: 6,
  zoomlar: [0, 1, 2, 3, 4, 5].map((z) => { const olcek = 2 ** (z - 5); const g = Math.ceil(WORLD.w * olcek), y = Math.ceil(WORLD.h * olcek); return { z, olcek, genislik: g, yukseklik: y, sutun: Math.ceil(g / 512), satir: Math.ceil(y / 512) }; }),
};

describe('kamera', () => {
  it('bütün harita sığar; dünya ↔ ekran dönüşümü tutarlı; yakınlaştırmada imleç altındaki nokta yerinde kalır', () => {
    const c = fitWorld(VP);
    const r = viewRect(c, VP);
    expect(r.w).toBeGreaterThanOrEqual(WORLD.w * 0.99);
    const [wx, wy] = toWorld(c, VP, 300, 200);
    expect(toScreen(c, VP, wx, wy).map(Math.round)).toEqual([300, 200]);
    const z = zoomAt({ cx: 6000, cy: 3000, scale: 4 }, VP, 0.5, 300, 200);
    const before = toWorld({ cx: 6000, cy: 3000, scale: 4 }, VP, 300, 200);
    expect(toWorld(z, VP, 300, 200).map(Math.round)).toEqual(before.map(Math.round));
    expect(clampCamera({ cx: -9999, cy: -9999, scale: 0.01 }, VP).scale).toBe(0.5);
  });
  it('kamera ön ayarı bölgeyi sığdırır; ölçek çubuğu yuvarlak mil', () => {
    const c = fitRect(CAMERAS.buzul!, VP);
    const r = viewRect(c, VP);
    expect(r.w).toBeGreaterThanOrEqual(CAMERAS.buzul!.w - 1);
    expect(r.h).toBeGreaterThanOrEqual(CAMERAS.buzul!.h - 1);
    const sb = scaleBar(c);
    expect([1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]).toContain(sb.miles);
    expect(pxToMiles(1142)).toBe(50);
    expect(cellName(0, 0)).toBe('A1');
    expect(cellName(WORLD.w - 1, WORLD.h - 1)).toBe('L6');
  });
});

describe('karolar', () => {
  it('manifest (K45, varsa) tutarlı: 6 zoom, z5 1:1, sütun/satır tuvalden', () => {
    const m = Object.values(manifests)[0] ?? synthetic;
    expect(m.zoomlar).toHaveLength(6);
    expect(m.zoomlar[5]!.olcek).toBe(1);
    for (const z of m.zoomlar) {
      expect(z.sutun).toBe(Math.ceil(Math.ceil(m.tuval[0] * z.olcek) / m.karo));
      expect(z.satir).toBe(Math.ceil(Math.ceil(m.tuval[1] * z.olcek) / m.karo));
    }
    if (m.karoSayisi !== undefined) expect(m.karoSayisi).toBe(m.zoomlar.reduce((n, z) => n + z.sutun * z.satir, 0));
  });
  it('uzaktan z0/z1, yakından z5; görünür alan + 1 halka, merkezden sıralı; sınır dışı karo yok', () => {
    // 1200 px'te bütün harita: ekran pikseli başına ≈12 dünya pikseli → z2 (1/8) yeterli keskinlik.
    expect(zoomFor(synthetic, fitWorld(VP)).z).toBe(2);
    expect(zoomFor(synthetic, { cx: 6000, cy: 3000, scale: 0.5 }).z).toBe(5);
    const c = { cx: 6000, cy: 3000, scale: 1 };
    const z = zoomFor(synthetic, c);
    const ts = tilesInView(synthetic, z, c, VP, '/maps/dunya');
    expect(ts.length).toBeGreaterThan(4);
    expect(ts.every((t) => t.x >= 0 && t.y >= 0 && t.x < z.sutun && t.y < z.satir)).toBe(true);
    expect(ts[0]!.url).toMatch(/^\/maps\/dunya\/\d\/\d+\/\d+\.webp$/);
  });
  it('LRU en eskiyi çıkarır ve haber verir', () => {
    const gone: string[] = [];
    const l = new Lru<string, number>(2, (k) => gone.push(k));
    l.set('a', 1); l.set('b', 2); l.get('a'); l.set('c', 3);
    expect(l.keys()).toEqual(['a', 'c']);
    expect(gone).toEqual(['b']);
  });
});

describe('keşif sisi', () => {
  it('daire açar, base64 gidiş-dönüş aynı, bozuk dizi null', () => {
    const f = revealCircle(emptyFog(), [5000, 2000], 600);
    expect(isRevealed(f, 5000, 2000)).toBe(true);
    expect(isRevealed(f, 9000, 2000)).toBe(false);
    const n = revealedCount(f);
    expect(n).toBeGreaterThan(20);
    const d = decodeFog(encodeFog(f))!;
    expect(revealedCount(d)).toBe(n);
    expect(Array.from(d)).toEqual(Array.from(f));
    expect(decodeFog('!!')).toBe(null);
    expect(decodeFog('AAAA')).toBe(null);
  });
  it('yol iz bırakır; kapalı adanın içi daireyle açılmaz, bayrakla bütün poligon açılır', () => {
    const p = revealPath(emptyFog(), [[2000, 2000], [4000, 2000]], 300);
    expect(isRevealed(p, 3000, 2000)).toBe(true);
    const poly = ISLANDS.kraken!;
    const inner = poly.reduce<Pt>((a, q) => [a[0] + q[0] / poly.length, a[1] + q[1] / poly.length], [0, 0]);
    expect(inPolygon(inner, poly)).toBe(true);
    const shut = revealCircle(emptyFog(), inner, 400);
    expect(isRevealed(shut, inner[0], inner[1])).toBe(false);
    const open = unlockIslands(emptyFog(), ['kraken-goruldu']);
    expect(isRevealed(open, inner[0], inner[1])).toBe(true);
    expect(CELL_W).toBeCloseTo(142.75, 1);
    expect(CELL_H).toBeCloseTo(142.8, 1);
  });
  it('Serüven: başlangıç yurt çevresi açık; yürüyüş açar; kayıt (replay) aynı sis; eski kayıt (alan yok) çökmez', () => {
    const events: SeruvenEvent[] = [];
    let s: SeruvenState | null = null;
    const run = (cmd: Parameters<typeof executeSeruven>[1]) => { const r = executeSeruven(s, cmd); if (!r.ok) throw new Error(r.error); events.push(...r.events); s = r.state; return r.state; };
    const party = partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: { ...sh, raceId: 'goliath' } }));
    const st = run({ type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false } });
    expect(st.kesif).toBeTruthy();
    const f0 = seruvenFog(st);
    const home = rectCenter(CAMERAS.buzul!);
    expect(isRevealed(f0, home[0], home[1])).toBe(true);
    expect(isRevealed(f0, 1000, 5500)).toBe(false);
    const node = (st as SeruvenState).page === 'buzul' ? 'acik-buzul' : null;
    if (node) {
      const moved = run({ type: 'move', to: node });
      const p = partyWorld('buzul', node)!;
      expect(isRevealed(seruvenFog(moved), p[0], p[1])).toBe(true);
    }
    expect(replaySeruven(events)?.kesif).toBe((s as unknown as SeruvenState).kesif);
    const old = { ...(s as unknown as SeruvenState) };
    delete old.kesif;
    expect(revealedCount(seruvenFog(old))).toBe(revealedCount(startFog(old)));
  });
  it('düğüm konumu: eşleme tablosu ya da bölge kamerası içi', () => {
    expect(nodeWorld('orman', 'mielikki-golu')).toEqual(dunya['orman/Mielikki Gölü']);
    const cam = CAMERAS.bataklik!;
    const p = nodeWorld('bataklik', 'yok-boyle', 0.5, 0.5)!;
    expect(p).toEqual([Math.round(cam.x + cam.w / 2), Math.round(cam.y + cam.h / 2)]);
  });
});

describe('Hapishane takvimi (6b)', () => {
  it('gün = uzun dinlenme + 1; her 7. gün yüzeyde; anahtar kapalıyken hep yüzeyde', () => {
    expect(seruvenDay({ rests: 0 })).toBe(1);
    expect(prisonSurfaced({ rests: 0 })).toBe(false);
    expect(prisonSurfaced({ rests: 6 })).toBe(true);
    expect(prisonSurfaced({ rests: 13 })).toBe(true);
    expect(daysToSurface({ rests: 2 })).toBe(4);
    expect(prisonSurfaced({ rests: 2 }, false)).toBe(true);
  });
});
