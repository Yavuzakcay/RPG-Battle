/**
 * Görev TB1/TG1: ten maskesi onarımı (`fixSkinMask`, `skinFixParams`, `skinFixFor`, `bodyPaintOff`). Sentetik sahneler: görsel dosyası yok.
 * TB1 (Tiefling): maske deliği, çevrelenmiş 1–3 pikselli açık benek, korumalar (göz, göz akı, çizgi mürekkebi, zırh köşesi, boynuz ucu,
 * ince yapı sınırı), elle maske ağırlıkları, küçük kopya ölçeği, Human/Dark Elf yolunun değişmediği.
 * TG1: gölge bandı (boynuz/kuyruk gölge yarısı: ton ailesi, kontur sınırı, kalınlık, elle maske önceliği) ve Goliath (dar renk kutusu,
 * vurgu ve gölge yok, gövde boyası kapalı kafa kaplamasında onarım yok).
 */
import { describe, expect, it } from 'vitest';
import { fixSkinMask, closeSkinHoles, skinFixParams, type SkinFixCfg } from './maskClose';
import { skinFixFor, skinCleanup, bodyPaintOff } from './tint';
import { rgbToLab } from './color';
import soy from '../../data/soy-renkleri.json';

const W = 48, H = 40;
type RGB = readonly [number, number, number];
const SKIN: RGB = [190, 110, 100], SHADE: RGB = [105, 35, 42], MID: RGB = [150, 80, 75], HI: RGB = [252, 228, 226], INK: RGB = [15, 10, 12], GREEN: RGB = [60, 160, 90], WHITE: RGB = [255, 255, 255];
// TG1: gölge bandı renkleri (SKIN ile ton farkı: DARK 9,6°, DARK_AUB 23,9° (saç), DARK_FAR 42,4°) ve Goliath gri tonları.
const DARK: RGB = [120, 45, 50], DARK_AUB: RGB = [120, 65, 30], DARK_FAR: RGB = [105, 30, 70], EYE: RGB = [251, 198, 131], LIGHTER: RGB = [235, 175, 160];
// TG1: zırh/cüppe kenarına oturmuş maske (gerçek veride ten kroması ≈ 46, bu tür maskelerde 16–24): gri-mor orta ton ve koyu yarısı.
const ARMOR: RGB = [138, 110, 150], ARMOR_DARK: RGB = [98, 70, 108];
const G_SKIN: RGB = [150, 160, 178], G_MID: RGB = [112, 122, 140], G_WHITE: RGB = [250, 250, 252], G_INK: RGB = [20, 22, 30], G_LIGHT: RGB = [214, 220, 232], G_DARK: RGB = [58, 64, 78];

/** Tiefling TB1 ayarı (gölge bandı kapalı; `referans` = sahne genişliği: ölçek 1, parametreler ham değer). */
const cfg = (): SkinFixCfg => { const c = skinFixFor('tiefling-erkek-fighter-GR')!; const t = { ...c.temizlik, referans: W }; delete t.golge; return { mask: c.mask, temizlik: t }; };
/** Tiefling TG1 ayarı: gerçek veri (gölge bandı açık). */
const cfgG = (): SkinFixCfg => { const c = skinFixFor('tiefling-erkek-fighter-GR')!; return { mask: c.mask, temizlik: { ...c.temizlik, referans: W } }; };
/** Goliath ayarı (gerçek veri; referans = sahne genişliği). */
const cfgGol = (): SkinFixCfg => { const c = skinFixFor('goliath-male-fighter')!; return { mask: c.mask, temizlik: { ...c.temizlik, referans: W } }; };

function scene() {
  const data = new Uint8ClampedArray(W * H * 4); // şeffaf
  const mask = new Uint8Array(W * H);
  const set = (x: number, y: number, c: RGB, m = 0) => { const i = (y * W + x) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255; mask[y * W + x] = m; };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: RGB, m = 0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c, m); };
  return { data, mask, set, rect, at: (x: number, y: number) => y * W + x };
}

describe('TB1: renk kutusu varsayımları (testin kendi doğrulaması)', () => {
  const lab = (c: RGB) => { const [L, a, b] = rgbToLab(...c); return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 }; };
  const inBox = (c: RGB, m = soy.races.tiefling.mask as { L: number[]; C: number[]; h: number[][] }) => {
    const { L, C, h } = lab(c);
    return L >= m.L[0]! && L <= m.L[1]! && C >= m.C[0]! && C <= m.C[1]! && m.h.some(([lo, hi]) => (lo! <= hi! ? h >= lo! && h <= hi! : h >= lo! || h <= hi!));
  };
  it('ten, gölge ve orta ten kutuda; vurgu, mürekkep, yeşil, beyaz kutu dışı', () => {
    expect(inBox(SKIN)).toBe(true); expect(inBox(SHADE)).toBe(true); expect(inBox(MID)).toBe(true);
    for (const c of [HI, INK, GREEN, WHITE]) expect(inBox(c)).toBe(false);
    expect(rgbToLab(...HI)[0]).toBeGreaterThan(70); expect(rgbToLab(...INK)[0]).toBeLessThan(25);
  });
  it('TG1: gölge bandı renkleri: ton farkı, açıklık ve Goliath gri tonları beklenen aralıkta', () => {
    const s = lab(SKIN), dh = (c: RGB) => Math.abs((((lab(c).h - s.h + 180) % 360) + 360) % 360 - 180);
    expect(dh(DARK)).toBeLessThan(12); expect(dh(DARK_AUB)).toBeGreaterThan(12); expect(dh(DARK_AUB)).toBeLessThan(26); expect(dh(DARK_FAR)).toBeGreaterThan(26);
    for (const c of [DARK, DARK_AUB, DARK_FAR]) { expect(lab(c).L).toBeGreaterThan(18); expect(lab(c).L).toBeLessThan(s.L); }
    expect(lab(LIGHTER).L).toBeGreaterThan(s.L + 6);
    // zırh maskesi: ten kutusunda ama kroması kromaKomsu'nun altında; koyu yarısı aday penceresinde ve aynı ton ailesinde (yalnız kroma kapısı eler)
    const gk = soy.races.tiefling.temizlik.golge.kromaKomsu, a = lab(ARMOR), ad = lab(ARMOR_DARK);
    expect(inBox(ARMOR)).toBe(true); expect(a.C).toBeLessThan(gk); expect(s.C).toBeGreaterThan(30);
    expect(ad.C).toBeGreaterThanOrEqual(15); expect(ad.L).toBeGreaterThan(18); expect(ad.L).toBeLessThan(a.L);
    expect(Math.abs((((ad.h - a.h + 180) % 360) + 360) % 360 - 180)).toBeLessThan(12);
    const k = soy.races.goliath.temizlik.kutu;
    for (const c of [G_SKIN, G_MID]) expect(lab(c).L).toBeGreaterThanOrEqual(k.L[0]!);
    expect(lab(G_MID).L).toBeLessThanOrEqual(k.L[1]!); expect(lab(G_WHITE).L).toBeGreaterThan(k.L[1]!); expect(lab(G_LIGHT).L).toBeGreaterThan(k.L[1]!);
    expect(lab(G_INK).L).toBeLessThan(k.L[0]!); expect(lab(G_DARK).L).toBeLessThan(k.L[0]!);
    for (const c of [G_SKIN, G_MID, G_LIGHT]) expect(inBox(c, soy.races.goliath.mask as { L: number[]; C: number[]; h: number[][] })).toBe(true);
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

describe('TG1: gölge bandı (Tiefling boynuz/kuyruk gölge yarısı)', () => {
  /** Boynuz: açık yarı maskede (y 10–12), koyu yarı (y 13…12+rows) maske dışı; dış sınır `outer` (kontur mürekkebi ya da başka renk). */
  function horn(dark: RGB, rows = 3, outer: RGB = INK, skin: RGB = SKIN) {
    const s = scene(), y1 = 12 + rows;
    for (let x = 5; x <= 30; x++) {
      for (let y = 10; y <= 12; y++) s.set(x, y, skin, 1);
      for (let y = 13; y <= y1; y++) s.set(x, y, dark, 0);
      s.set(x, 9, INK, 0); s.set(x, y1 + 1, outer, 0);
    }
    for (let y = 9; y <= y1 + 1; y++) { s.set(4, y, outer, 0); s.set(31, y, outer, 0); }
    return { s, y1 };
  }
  const darkRows = (s: ReturnType<typeof scene>, r: { mask?: Uint8Array }, y1: number) => { let n = 0; for (let x = 5; x <= 30; x++) for (let y = 13; y <= y1; y++) n += r.mask![s.at(x, y)] as number; return n; };

  it('koyu yarı (aynı ton ailesi, mürekkeple sınırlı, ince) maskeye katılır; mürekkep ve açık yarı aynen', () => {
    const { s, y1 } = horn(DARK);
    const before = Uint8Array.from(s.mask);
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfgG());
    expect(darkRows(s, r, y1)).toBe(26 * 3);
    for (let x = 5; x <= 30; x++) { expect(r.mask![s.at(x, 9)]).toBe(0); expect(r.mask![s.at(x, y1 + 1)]).toBe(0); for (let y = 10; y <= 12; y++) expect(r.mask![s.at(x, y)]).toBe(1); }
    expect(s.mask).toEqual(before); // yerinde değişmez
  });
  it('gölge bandı kaydı yoksa (TB1 ayarı) koyu yarı eklenmez', () => {
    const { s, y1 } = horn(DARK);
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfg()), y1)).toBe(0);
  });
  it('dış sınırı mürekkep değil başka renkle (zırh, kıyafet) çevrili bant katılmaz', () => {
    const { s, y1 } = horn(DARK, 3, GREEN);
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfgG()), y1)).toBe(0);
  });
  it('maskeden kalınlık sınırından uzağa uzanan (kalın) bölge katılmaz', () => {
    const { s, y1 } = horn(DARK, 12);
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfgG()), y1)).toBe(0);
  });
  it('ton ailesi dışı katılmaz: saç (bileşen tonu komşu maskeden > 12°) ve uzak ton (> 26°)', () => {
    for (const c of [DARK_AUB, DARK_FAR]) { const { s, y1 } = horn(c); expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfgG()), y1), String(c)).toBe(0); }
  });
  it('sarı göz ve maske ortalamasından açık piksel katılmaz', () => {
    for (const c of [EYE, LIGHTER]) { const { s, y1 } = horn(c); expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfgG()), y1), String(c)).toBe(0); }
  });
  it('bitişik maske doygun ten değilse (zırh/cüppe kenarı, kroma < kromaKomsu) büyütme yapılmaz; kapı kapatılınca aynı sahne büyür', () => {
    const { s, y1 } = horn(ARMOR_DARK, 3, INK, ARMOR);
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, cfgG()), y1)).toBe(0);
    const c = cfgG(); c.temizlik = { ...c.temizlik, golge: { ...c.temizlik.golge!, kromaKomsu: 0 } };
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, c), y1)).toBe(26 * 3); // sahne geçerli: yalnız kroma kapısı eliyor
    const h = horn(DARK); // doygun ten (kroma ≈ 36): kapıdan geçer
    expect(darkRows(h.s, fixSkinMask(h.s.data, h.s.mask, undefined, W, H, cfgG()), h.y1)).toBe(26 * 3);
  });
  it('bileşen `enCok` sınırını aşarsa katılmaz', () => {
    const { s, y1 } = horn(DARK);
    const c = cfgG(); c.temizlik = { ...c.temizlik, golge: { ...c.temizlik.golge!, enCok: 10 } };
    expect(darkRows(s, fixSkinMask(s.data, s.mask, undefined, W, H, c), y1)).toBe(0);
  });
  it('elle maske (`weights`) önceliklidir: gölge bandı eklenmez, mevcut ağırlıklar aynen kalır', () => {
    const { s, y1 } = horn(DARK);
    const w = Uint8Array.from(s.mask, (m) => (m ? 255 : 0)); w[s.at(6, 11)] = 128;
    const copy = Uint8Array.from(w);
    const r = fixSkinMask(s.data, undefined, w, W, H, cfgG());
    for (let x = 5; x <= 30; x++) for (let y = 13; y <= y1; y++) expect(r.weights![s.at(x, y)]).toBe(0);
    expect(r.weights![s.at(6, 11)]).toBe(128); expect(w).toEqual(copy);
  });
  it('skinFixParams: 256 px ham değer, 96 px kopyada kalınlık s ile (yukarı), temas ve alan ölçeklenir', () => {
    const t = skinFixFor('tiefling-kadin-rogue-GR')!.temizlik;
    expect(skinFixParams(t, 256).golge).toEqual({ ton: 26, tonKomsu: 12, kromaAlt: 15, kromaUst: 70, Lalt: 18, Lust: 6, kalinlik: 8, temas: 3, kontur: 0.6, enCok: 900, kromaKomsu: 32 });
    expect(skinFixParams(t, 96).golge).toEqual({ ton: 26, tonKomsu: 12, kromaAlt: 15, kromaUst: 70, Lalt: 18, Lust: 6, kalinlik: 3, temas: 1, kontur: 0.6, enCok: 127, kromaKomsu: 32 }); // kroma ölçeklenmez
  });
});

describe('TG1: Goliath (dar renk kutusu, vurgu ve gölge yok)', () => {
  function gscene() {
    const s = scene();
    s.rect(5, 5, 34, 34, G_SKIN, 1);
    return s;
  }
  it('orta ton (gri gölge) delik maskeye girer; göz akı, çok açık (rün/parlama), çizgi mürekkebi ve koyu çizgi girmez', () => {
    const s = gscene();
    s.rect(15, 15, 16, 16, G_MID, 0); // orta ton: eklenir
    s.rect(20, 20, 21, 21, G_WHITE, 0); // göz akı
    s.set(10, 25, G_LIGHT, 0); // rün/parlama
    s.set(25, 25, G_INK, 0); // çizgi mürekkebi
    s.set(28, 10, G_DARK, 0); // koyu çizgi (kutunun altı)
    const r = fixSkinMask(s.data, s.mask, undefined, W, H, cfgGol());
    for (const [x, y] of [[15, 15], [16, 15], [15, 16], [16, 16]] as const) expect(r.mask![s.at(x, y)]).toBe(1);
    for (const [x, y] of [[20, 20], [21, 21], [10, 25], [25, 25], [28, 10]] as const) expect(r.mask![s.at(x, y)]).toBe(0);
  });
  it('vurgu kaydı yok: maskeyle çevrili tek açık piksel boyanmaz; gölge bandı yok: koyu bant eklenmez', () => {
    const s = gscene();
    s.set(10, 25, G_LIGHT, 0);
    expect(fixSkinMask(s.data, s.mask, undefined, W, H, cfgGol()).mask![s.at(10, 25)]).toBe(0);
    const t = skinFixFor('goliath-erkek-monk-ID1')!.temizlik;
    expect(t.vurgu).toBeUndefined(); expect(t.golge).toBeUndefined();
    expect(t.kutu).toEqual(soy.races.goliath.temizlik.kutu);
  });
  it('skinFixFor: Tiefling ve Goliath (veriden); diğer ırklar yok; 96 px kopyada alan ve kapama ölçeği', () => {
    expect(skinFixFor('tiefling-erkek-barbarian-ID1')!.temizlik).toEqual(soy.races.tiefling.temizlik);
    expect(skinFixFor('goliath-kadin-druid-ID3')!.temizlik).toEqual(soy.races.goliath.temizlik);
    expect(skinFixFor('goliath-kadin-druid-ID3')!.mask).toEqual(soy.races.goliath.mask);
    for (const n of ['human-male-bard', 'elf-female-wizard', 'dragonborn-male-fighter', 'gnome-male-rogue', 'orc-male-fighter', 'halfling-male-rogue', '']) expect(skinFixFor(n), n).toBeUndefined();
    const t = skinFixFor('goliath-male-cleric')!.temizlik;
    expect(skinFixParams(t, 256)).toEqual({ kapama: 1, enCok: 12, ekleOrani: 0.5, golge: undefined, vurgu: undefined });
    expect(skinFixParams(t, 96)).toEqual({ kapama: 1, enCok: 2, ekleOrani: 0.5, golge: undefined, vurgu: undefined });
  });
  it('Goliath kafa kaplaması kapalı (2026-11-22, `basKaplama.goliath.kapali`): gövde boyası hiçbir jetonda kapatılmaz, onarım atlanmaz', () => {
    for (const n of ['goliath-male-paladin', 'goliath-female-paladin', 'goliath-male-fighter', 'goliath-female-fighter', 'goliath-male-cleric', 'goliath-female-cleric']) {
      expect(bodyPaintOff(n, true), n).toBe(false);
      expect(bodyPaintOff(n, false), `${n} kaplama görseli yok`).toBe(false);
    }
    for (const n of ['goliath-erkek-paladin-ID2', 'goliath-male-barbarian', 'tiefling-erkek-fighter-GR', 'human-male-bard']) expect(bodyPaintOff(n, true), n).toBe(false);
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
    expect(skinFixParams(t, 256)).toMatchObject({ kapama: 1, enCok: 80, ekleOrani: 0.5, vurgu: { L: 70, boyut: 3, cevre: 0.95 } });
    expect(skinFixParams(t, 96)).toMatchObject({ kapama: 1, enCok: 11, ekleOrani: 0.5, vurgu: { L: 70, boyut: 1, cevre: 0.95 } });
  });
});

describe('TB1: kapsam ve eski yol', () => {
  it('veri: `temizlik` alanları sayısal ve tutarlı (referans > 0, oranlar 0–1)', () => {
    for (const irk of [soy.races.tiefling, soy.races.goliath]) {
      const t = irk.temizlik as { referans: number; delik: Record<string, number>; vurgu?: Record<string, number>; golge?: Record<string, number | number[]> };
      for (const v of [t.referans, ...Object.values(t.delik), ...Object.values(t.vurgu ?? {})]) expect(typeof v).toBe('number');
      expect(t.referans).toBeGreaterThan(0);
      expect(t.delik.ekleOrani).toBeGreaterThan(0); expect(t.delik.ekleOrani).toBeLessThanOrEqual(1);
      if (t.vurgu) { expect(t.vurgu.cevre).toBeGreaterThan(0.5); expect(t.vurgu.cevre).toBeLessThanOrEqual(1); }
      if (t.golge) {
        expect(t.golge.kontur).toBeGreaterThan(0); expect(t.golge.kontur).toBeLessThanOrEqual(1); expect(t.golge.kalinlik).toBeGreaterThan(0);
        // kromaKomsu: ten kroması (≈ 46) ile zırh/cüppe maskesi (≈ 16–24) arasında; piksel kroma penceresinin üstünde olamaz
        expect(t.golge.kromaKomsu).toBeGreaterThan(24); expect(t.golge.kromaKomsu).toBeLessThan((t.golge.kroma as number[])[1]!);
      }
    }
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
