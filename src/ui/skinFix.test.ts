/**
 * Görev TB1: Tiefling ten maskesi onarımı (`fixSkinMask`, `skinFixParams`, `skinFixFor`). Sentetik sahneler: görsel dosyası yok.
 * Maske deliği (gölgedeki ten pikselleri), çevrelenmiş 1–3 pikselli açık benek, korumalar (göz, göz akı, çizgi mürekkebi, zırh köşesi,
 * boynuz ucu, ince yapı sınırı), elle maske ağırlıkları, küçük kopya ölçeği ve Human/Dark Elf yolunun değişmediği.
 */
import { describe, expect, it } from 'vitest';
import { fixSkinMask, closeSkinHoles, skinFixParams, type SkinFixCfg } from './maskClose';
import { skinFixFor, skinCleanup } from './tint';
import { rgbToLab } from './color';
import soy from '../../data/soy-renkleri.json';

const W = 48, H = 40;
type RGB = readonly [number, number, number];
const SKIN: RGB = [190, 110, 100], SHADE: RGB = [105, 35, 42], MID: RGB = [150, 80, 75], HI: RGB = [252, 228, 226], INK: RGB = [15, 10, 12], GREEN: RGB = [60, 160, 90], WHITE: RGB = [255, 255, 255];

/** Gerçek ayar (veri), ama `referans` = sahne genişliği: ölçek 1 (parametreler ham değer). */
const cfg = (): SkinFixCfg => { const c = skinFixFor('tiefling-erkek-fighter-GR')!; return { mask: c.mask, temizlik: { ...c.temizlik, referans: W } }; };

function scene() {
  const data = new Uint8ClampedArray(W * H * 4); // şeffaf
  const mask = new Uint8Array(W * H);
  const set = (x: number, y: number, c: RGB, m = 0) => { const i = (y * W + x) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255; mask[y * W + x] = m; };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: RGB, m = 0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c, m); };
  return { data, mask, set, rect, at: (x: number, y: number) => y * W + x };
}

describe('TB1: renk kutusu varsayımları (testin kendi doğrulaması)', () => {
  const inBox = (c: RGB) => {
    const [L, a, b] = rgbToLab(...c); const C = Math.hypot(a, b), h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
    const m = (soy.races.tiefling.mask) as { L: number[]; C: number[]; h: number[][] };
    return L >= m.L[0]! && L <= m.L[1]! && C >= m.C[0]! && C <= m.C[1]! && m.h.some(([lo, hi]) => (lo! <= hi! ? h >= lo! && h <= hi! : h >= lo! || h <= hi!));
  };
  it('ten, gölge ve orta ten kutuda; vurgu, mürekkep, yeşil, beyaz kutu dışı', () => {
    expect(inBox(SKIN)).toBe(true); expect(inBox(SHADE)).toBe(true); expect(inBox(MID)).toBe(true);
    for (const c of [HI, INK, GREEN, WHITE]) expect(inBox(c)).toBe(false);
    expect(rgbToLab(...HI)[0]).toBeGreaterThan(70); expect(rgbToLab(...INK)[0]).toBeLessThan(25);
  });
});

describe('TB1: delik onarımı', () => {
  it('maskenin çevrelediği gölge ten pikselleri maskeye girer; özgün dizi değişmez', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    s.rect(15, 15, 17, 17, SHADE, 0); // 3×3 delik (gölgedeki ten)
    const before = Uint8Array.from(s.mask);
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (let y = 15; y <= 17; y++) for (let x = 15; x <= 17; x++) expect(r.mask![s.at(x, y)]).toBe(1);
    expect(r.weights).toBeUndefined();
    expect(s.mask).toEqual(before); // yerinde değişmez
    expect(r.mask!.reduce((a, v) => a + v, 0)).toBe(before.reduce((a, v) => a + v, 0) + 9);
  });
  it('göz akı (≥ 4 px beyaz), çizgi mürekkebi ve şeffaf piksel delik sayılmaz', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    s.rect(20, 20, 21, 21, WHITE, 0); // 2×2 göz akı
    s.set(25, 25, INK, 0); // 1 px koyu çizgi
    const t = s.at(10, 10); s.data[t * 4 + 3] = 0; s.mask[t] = 0; // şeffaf delik
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (const [x, y] of [[20, 20], [21, 20], [20, 21], [21, 21], [25, 25]] as const) expect(r.mask![s.at(x, y)]).toBe(0);
    expect(r.mask![t]).toBe(0);
  });
  it('1 px kapama boşluğu (kenara açık çentik) dolar, yalnız ten renkli pikseller; 1 px koyu çizgi dolmaz', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    for (let y = 5; y <= 20; y++) s.set(20, y, SHADE, 0); // üst kenara açık çatlak: çevrelenmemiş, yalnız kapama doldurur
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (let y = 5; y <= 20; y++) expect(r.mask![s.at(20, y)]).toBe(1);
    const s2 = scene();
    s2.rect(5, 5, 34, 34, SKIN, 1);
    for (let y = 5; y <= 20; y++) s2.set(20, y, INK, 0);
    const r2 = fixSkinMask(s2.data, s2.mask, undefined, W, H, cfg());
    for (let y = 5; y <= 20; y++) expect(r2.mask![s2.at(20, y)]).toBe(0);
  });
  it('ince yapı sınırı: kapama özgün maskenin yarısından fazlasını ekleyecekse yalnız çevrelenmiş delikler eklenir', () => {
    const s = scene();
    // iki tek piksellik şerit (y = 10 ve y = 13), arada 2 satır gölge ten (açık uçlu, çevrelenmemiş), çevrede mürekkep
    for (let x = 5; x <= 30; x++) { s.set(x, 10, SKIN, 1); s.set(x, 13, SKIN, 1); s.set(x, 11, SHADE, 0); s.set(x, 12, SHADE, 0); s.set(x, 9, INK, 0); s.set(x, 14, INK, 0); }
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (let x = 5; x <= 30; x++) { expect(r.mask![s.at(x, 11)]).toBe(0); expect(r.mask![s.at(x, 12)]).toBe(0); }
  });
});

describe('TB1: vurgu onarımı (maskenin çevrelediği 1–3 pikselli açık benek)', () => {
  it('çevrelenmiş 1–3 px açık benek boyanır; ≥ 4 px açık parça (rün, göz akı) dokunulmaz', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    s.set(10, 25, HI, 0); // 1 px benek
    s.rect(14, 25, 15, 25, HI, 0); // 2 px benek
    s.rect(20, 20, 22, 22, HI, 0); // 9 px açık parça
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    expect(r.mask![s.at(10, 25)]).toBe(1); expect(r.mask![s.at(14, 25)]).toBe(1); expect(r.mask![s.at(15, 25)]).toBe(1);
    for (let y = 20; y <= 22; y++) for (let x = 20; x <= 22; x++) expect(r.mask![s.at(x, y)]).toBe(0);
  });
  it('maskeyle çevrili olmayan açık benek (göz parıltısı, diş, zırh köşesi, mürekkep komşusu, silüet ucu) dokunulmaz', () => {
    const s = scene();
    s.rect(5, 5, 20, 20, SKIN, 1);
    s.rect(21, 5, 34, 20, GREEN, 0); // zırh
    s.set(21, 5, HI, 0); // zırh köşesinde maskeye bitişik tek parlak piksel: komşuların çoğu maske dışı
    s.rect(5, 25, 20, 34, SKIN, 1);
    s.set(12, 29, HI, 0); s.set(12, 28, INK, 0); s.set(12, 30, INK, 0); s.set(11, 29, INK, 0); s.set(13, 29, INK, 0); // mürekkep komşulu (diş/göz kenarı)
    for (let x = 22; x <= 30; x++) s.set(x, 28, SKIN, 1); // silüet ucu: şerit
    s.set(31, 28, HI, 0); // uçta tek açık piksel, ardında şeffaf: komşu gövde pikselleri yalnız maske ama...
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    expect(r.mask![s.at(21, 5)]).toBe(0);
    expect(r.mask![s.at(12, 29)]).toBe(0);
    expect(r.mask![s.at(31, 28)]).toBe(1); // ucun yanındaki tek gövde komşusu maske: silüet ucundaki tek parlak piksel maskeye girer
  });
  it('eski uç/kenar dalı yok: maskeye bitişik, ≥ 4 px açık uç parçası (boynuz ucu, göz) boyanmaz', () => {
    const s = scene();
    for (let x = 5; x <= 25; x++) { s.set(x, 10, SKIN, 1); s.set(x, 11, SKIN, 1); s.set(x, 12, SKIN, 1); s.set(x, 9, INK, 0); s.set(x, 13, INK, 0); }
    s.rect(26, 10, 27, 12, HI, 0); // 6 px açık uç
    for (let y = 9; y <= 13; y++) s.set(28, y, INK, 0);
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (let y = 10; y <= 12; y++) for (const x of [26, 27]) expect(r.mask![s.at(x, y)]).toBe(0);
  });
  it('parlak sarı göz (maskeyle kısmen çevrili, ≥ 4 px) boyanmaz', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    s.rect(15, 15, 19, 17, [251, 198, 131], 0); // göz: 15 px, çevresi ten
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfg());
    for (let y = 15; y <= 17; y++) for (let x = 15; x <= 19; x++) expect(r.mask![s.at(x, y)]).toBe(0);
  });
});

describe('TB1: elle maske ağırlıkları ve ölçek', () => {
  it('weights verilirse eklenen piksel 255 olur, mevcut ağırlıklar aynen kalır', () => {
    const s = scene();
    s.rect(5, 5, 34, 34, SKIN, 1);
    s.rect(15, 15, 16, 16, SHADE, 0);
    const w = Uint8Array.from(s.mask, (m) => (m ? 255 : 0)); w[s.at(6, 6)] = 128;
    const copy = Uint8Array.from(w);
    const r = fixSkinMask(s.data, undefined, w, W, H, cfg());
    expect(r.mask).toBeUndefined();
    expect(r.weights![s.at(15, 15)]).toBe(255); expect(r.weights![s.at(16, 16)]).toBe(255);
    expect(r.weights![s.at(6, 6)]).toBe(128);
    expect(w).toEqual(copy);
  });
  it('skinFixParams: 256 px referans ham değer; 96 px kopyada uzunluklar s, alanlar s² ile ölçeklenir (en az 1)', () => {
    const t = skinFixFor('tiefling-kadin-rogue-GR')!.temizlik;
    expect(skinFixParams(t, 256)).toEqual({ kapama: 1, enCok: 80, ekleOrani: 0.5, L: 70, boyut: 3, cevre: 0.95 });
    expect(skinFixParams(t, 96)).toEqual({ kapama: 1, enCok: 11, ekleOrani: 0.5, L: 70, boyut: 1, cevre: 0.95 });
  });
});

describe('TB1: kapsam (yalnız Tiefling) ve eski yol', () => {
  it('skinFixFor: yalnız verisinde `temizlik` olan ırk (Tiefling); ayar veriden', () => {
    const t = skinFixFor('tiefling-erkek-barbarian-ID1')!;
    expect(t.temizlik).toEqual(soy.races.tiefling.temizlik);
    expect(t.mask).toEqual(soy.races.tiefling.mask);
    for (const n of ['human-male-bard', 'elf-female-wizard', 'dragonborn-male-fighter', 'goliath-male-fighter', 'gnome-male-rogue', 'orc-male-fighter', '']) expect(skinFixFor(n), n).toBeUndefined();
  });
  it('veri: `temizlik` alanları sayısal ve tutarlı (referans > 0, oranlar 0–1)', () => {
    const t = soy.races.tiefling.temizlik;
    for (const v of [t.referans, ...Object.values(t.delik), ...Object.values(t.vurgu)]) expect(typeof v).toBe('number');
    expect(t.referans).toBeGreaterThan(0);
    expect(t.delik.ekleOrani).toBeGreaterThan(0); expect(t.delik.ekleOrani).toBeLessThanOrEqual(1);
    expect(t.vurgu.cevre).toBeGreaterThan(0.5); expect(t.vurgu.cevre).toBeLessThanOrEqual(1);
  });
  it('Human/Dark Elf yolu (SD5/SD6) değişmedi: skinCleanup ve closeSkinHoles aynı; Tiefling skinCleanup kapsamında değil', () => {
    const grad = { select: { hMin: 0, hMax: 45, sMin: 0.25, lMin: 0.5, lMax: 0.95 }, to: { gradient: [[10, 0, 0], [50, 10, 10], [80, 5, 5]] as Array<[number, number, number]> } };
    expect(skinCleanup('human-male-bard', grad)).toBe(true);
    expect(skinCleanup('elf-male-fighter', grad)).toBe(true);
    expect(skinCleanup('tiefling-male-fighter', grad)).toBe(false);
    // closeSkinHoles: 3×3 maske boşluğu (2 iterasyonla) dolar; fixSkinMask bunun yerine geçmez (ayrı işlev)
    const s = scene(); s.rect(5, 5, 34, 34, SKIN, 1); s.rect(15, 15, 16, 16, MID, 0);
    expect(closeSkinHoles(s.data, s.mask, undefined, W, H).mask![s.at(15, 15)]).toBe(1);
  });
});
