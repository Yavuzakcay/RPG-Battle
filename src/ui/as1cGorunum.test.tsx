/**
 * Kuyruk AS1c: alt soy görünümünün savaş jetonuna taşınması (yalnız görünüm; kural sürümü 71 kalır), Human ten maskesi (ten dışı
 * pikseller hiçbir tonda değişmez), kanat katmanı (sprite yok/var, havada/değil).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { AvatarCircle, CharacterFigure, TokenFigure } from './Avatar';
import { hasSubclassWing, lineageLook, skinTint, wingBox, wingSlotOfSubclass } from './lineageLook';
import { tintPixels } from './tint';
import { lineageTint, sheetAvatar } from '../battle/avatar';
import { blankCharacter } from '../rules/builder';
import { rgbToLab } from './color';
import { CURRENT_RULES } from '../battle/ruleVersion';
import kanat from '../../data/kanat-esleme.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import { LookFrame } from './LookFrame';
import type { CharacterSheet } from '../rules/stats';

const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({ ...blankCharacter('as1c').sheet, name: 'Görünüm', ...patch });

describe('savaş jetonu görünümü (Avatar.look, tek çözücü)', () => {
  it('sürüm 71 değişmedi', () => { expect(CURRENT_RULES).toBeGreaterThanOrEqual(71); });
  it('alt soylu karakterin avatarında look var; soysuz/Dwarf-lineageId yok ya da etkisiz; avatar yolu aynı', () => {
    const a = sheetAvatar(sheet({ raceId: 'halfling', lineageId: 'slender' }));
    expect(a.look).toMatchObject({ raceId: 'halfling', lineageId: 'slender' });
    expect(sheetAvatar(sheet({ raceId: 'human', lineageId: undefined })).look).toBeUndefined();
    expect(a.src).toBe(sheetAvatar(sheet({ raceId: 'halfling', lineageId: undefined })).src);
  });
  it('SVG jetonda oran (en-boy), hale gizleme (clipPath) ve filtre uygulanır; hitbox/boyut aynı (image x,y,w,h değişmez)', () => {
    const draw = (patch: Partial<CharacterSheet>) => renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={sheetAvatar(sheet(patch)).look} /></svg>);
    const slender = draw({ raceId: 'halfling', lineageId: 'slender' });
    expect(slender).toContain('scale(0.94 1.05)');
    expect(draw({ raceId: 'halfling', lineageId: 'sturdy' })).toContain('scale(1.1 0.97)');
    expect(draw({ raceId: 'dwarf', lineageId: 'knoll' })).toContain('scale(1.04 1)');
    // Boyasız orijinal olmayan oran yok: Wood-elf, oransız.
    expect(draw({ raceId: 'elf', lineageId: 'wood-elf' })).not.toContain('scale(');
    for (const aw of ['kirik-kanat', 'gece-gozyasi']) expect(draw({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: aw })).toContain('<clipPath');
    expect(draw({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'parlayan-ruh' })).not.toContain('<clipPath');
    expect(draw({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'gece-gozyasi' })).toContain('brightness');
    // Görsel konumu/boyutu oransız soyla aynı.
    const img = (x: string) => /<image[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"/.exec(x)?.slice(1).join(',');
    expect(img(slender)).toBe(img(draw({ raceId: 'halfling', lineageId: undefined })));
  });
  it('Gece Gözyaşı ve Kırık Kanat 3. seviyeden halesiz; Parlayan Ruh haleli; 2. seviyede hepsi haleli', () => {
    for (const [aw, hide] of [['parlayan-ruh', false], ['gece-gozyasi', true], ['kirik-kanat', true]] as const) {
      expect(lineageLook({ raceId: 'celestial', celestialAwakening: aw, level: 3 }).hideHalo).toBe(hide);
      expect(lineageLook({ raceId: 'celestial', celestialAwakening: aw, level: 2 }).hideHalo).toBe(false);
    }
  });
  it('düşman ve çağrılan yaratık jetonu etkilenmez (look yok)', () => {
    const svg = renderToStaticMarkup(<svg><AvatarCircle avatar={{ src: 'monsters/x.webp', bg: '#000', label: 'X' }} cx={50} cy={50} r={20} /></svg>);
    expect(svg).not.toContain('clipPath');
    expect(svg).not.toContain('scale(');
  });
});

describe('kanat katmanı (bağlı)', () => {
  type Slot = { altSinif?: string; dosya: string | null; dosyaKapali: string | null; herZaman?: boolean; olcek: number; omuz: number; capa: [number, number]; enBoy: number; renkFiltreleri?: Record<string, string>; filtre?: string };
  const s = kanat.slotlar as unknown as Record<string, Slot>;
  const svgOf = (raceId: string, lineageId: string | undefined, level: number, flying: boolean, awakening?: string) =>
    renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={sheetAvatar(sheet({ raceId, lineageId, level, ...(awakening ? { celestialAwakening: awakening } : {}) })).look} flying={flying} /></svg>);
  it('eşleme: üç slot, dosyalar bağlı ve gerçekten var, çapa/oran/omuz veride, Dragonborn 10 renk filtresi', async () => {
    expect(Object.keys(s).sort()).toEqual(['celestial-kirik-kanat', 'dragonborn', 'melek-acik', 'tiefling-kanatli']);
    const capa = { 'tiefling-kanatli': [0.501, 0.708], 'celestial-kirik-kanat': [0.568, 0.438], dragonborn: [0.5, 0.626], 'melek-acik': [0.5, 0.383] };
    for (const [id, w] of Object.entries(s)) {
      expect(w.dosya, id).toBe(`${id}.webp`);
      const meta = await sharp(`public/kanat/${w.dosya}`).metadata();
      expect(meta.hasAlpha, id).toBe(true);
      expect(w.enBoy, id).toBeCloseTo(meta.height! / meta.width!, 3);
      expect(w.capa, id).toEqual(capa[id as keyof typeof capa]);
      expect(w.olcek).toBeCloseTo(id === 'melek-acik' ? 1.5 : 1.45); expect(w.omuz).toBeCloseTo(0.46); expect(w.enBoy).toBeGreaterThan(0.2);
    }
    expect(Object.keys(s.dragonborn!.renkFiltreleri!).sort()).toEqual(['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white']);
  });
  it('görünürlük: Tiefling Kanatlı ve Dragonborn yalnız havada; Celestial Kırık Kanat her zaman', () => {
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing).toMatchObject({ id: 'tiefling-kanatli', src: 'kanat/tiefling-kanatli.webp', open: true });
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: false }).wing).toBeNull();
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'infernal' }, { flying: true }).wing).toBeNull();
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: true }).wing).toMatchObject({ id: 'dragonborn' });
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: false }).wing).toBeNull();
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 4 }, { flying: true }).wing).toBeNull();
    for (const flying of [false, true]) expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'kirik-kanat', level: 3 }, { flying }).wing).toMatchObject({ id: 'celestial-kirik-kanat', open: true });
    expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'parlayan-ruh', level: 5 }, { flying: true }).wing).toBeNull();
    expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'kirik-kanat', level: 2 }, { flying: false }).wing).toBeNull();
  });
  it('Dragonborn kanat rengi soya göre filtreyle; beyaz filtresiz', () => {
    const red = lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: true }).wing!;
    const white = lineageLook({ raceId: 'dragonborn', lineageId: 'white', level: 5 }, { flying: true }).wing!;
    expect(red.filtre).toContain('hue-rotate');
    expect(white.filtre).toBe('');
  });
  it('jeton çizimi: kanat jetonun ARKASINDA, kök jetonun yatay merkezinde ve omuz yüksekliğinde, ayna yok', () => {
    const svg = svgOf('tiefling', 'winged', 1, true);
    expect(svg).toContain('kanat/tiefling-kanatli.webp');
    expect(svg.indexOf('kanat/tiefling-kanatli.webp')).toBeLessThan(svg.indexOf('x.webp'));
    const wing = lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing!;
    const b = wingBox(wing, 50, 50, 40);
    expect(b.width).toBeCloseTo(58);
    expect(b.x + wing.capa[0] * b.width).toBeCloseTo(50);
    expect(b.y + wing.capa[1] * b.height).toBeCloseTo(50 - 20 + 40 * 0.46);
    expect(svgOf('celestial', undefined, 3, false, 'kirik-kanat')).toContain('kanat/celestial-kirik-kanat.webp');
    expect(svgOf('celestial', undefined, 3, false, 'kirik-kanat')).not.toContain('scale(-1');
    expect(svgOf('tiefling', 'winged', 1, false)).not.toContain('look-wing');
  });
});

describe('alt sınıfa bağlı kanat slotu (altSinif)', () => {
  type Slot = { altSinif?: string; dosya: string | null; herZaman?: boolean };
  const s = kanat.slotlar as unknown as Record<string, Slot>;
  const FAKE = 'fiction-wing-sub';
  it('melek slotu veride: altSinif okunur, yalnız havadayken (herZaman yok), kapalı sprite yok', () => {
    expect(s['melek-acik']).toMatchObject({ altSinif: 'melek', dosya: 'melek-acik.webp', dosyaKapali: null, filtre: '' });
    expect(s['melek-acik']!.herZaman).toBeFalsy();
    expect(wingSlotOfSubclass('melek')).toBe('melek-acik');
    expect(hasSubclassWing('melek')).toBe(true);
    expect(wingSlotOfSubclass('baska')).toBeUndefined();
    expect(wingSlotOfSubclass(undefined)).toBeUndefined();
    // Yalnız melek slotunun altSinif'i var; ırk/alt soy slotları aynen.
    expect(Object.entries(s).filter(([, w]) => w.altSinif).map(([id]) => id)).toEqual(['melek-acik']);
  });
  it('melek: havadayken katman (açık sprite), yerdeyken yok; hata yok', () => {
    const sh = { raceId: 'human', classId: undefined, subclassId: 'melek', level: 5 };
    expect(lineageLook(sh, { flying: true }).wing).toMatchObject({ id: 'melek-acik', src: 'kanat/melek-acik.webp', open: true, filtre: '', olcek: 1.5 });
    expect(lineageLook(sh, { flying: false }).wing).toBeNull();
    expect(lineageLook(sh).wing).toBeNull();
  });
  it('alt sınıf seçili değilse ya da kayıtta yüklü değilse (içerik yok) slot etkisiz; başka kanatlar değişmez', () => {
    expect(lineageLook({ raceId: 'human', level: 5 }, { flying: true }).wing).toBeNull();
    expect(lineageLook({ raceId: 'human', subclassId: 'baska', level: 5 }, { flying: true }).wing).toBeNull();
    // Sınıf biliniyor ve alt sınıf yüklü değil (test ortamında ek paket yok): hata vermeden etkisiz.
    expect(lineageLook({ raceId: 'human', classId: 'warlock', subclassId: 'melek', level: 5 }, { flying: true }).wing).toBeNull();
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged', level: 5 }, { flying: true }).wing).toMatchObject({ id: 'tiefling-kanatli' });
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: true }).wing).toMatchObject({ id: 'dragonborn' });
    expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'kirik-kanat', level: 3 }, { flying: false }).wing).toMatchObject({ id: 'celestial-kirik-kanat' });
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged', level: 5 }, { flying: false }).wing).toBeNull();
  });
  it('kurgusal alt sınıf kimliğiyle altSinif eşlemesi (slot geçici eklenir): slot alt sınıfa bağlanır, ırk kanadının yerine geçer', () => {
    const keep = JSON.stringify(s);
    try {
      s[FAKE] = { ...s['melek-acik']!, altSinif: 'kurgusal-alt-sinif' } as Slot;
      expect(wingSlotOfSubclass('kurgusal-alt-sinif')).toBe(FAKE);
      expect(lineageLook({ raceId: 'human', subclassId: 'kurgusal-alt-sinif' }, { flying: true }).wing).toMatchObject({ id: FAKE });
      expect(lineageLook({ raceId: 'human', subclassId: 'kurgusal-alt-sinif' }, { flying: false }).wing).toBeNull();
      expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged', subclassId: 'kurgusal-alt-sinif' }, { flying: true }).wing).toMatchObject({ id: FAKE });
    } finally {
      delete s[FAKE];
      expect(JSON.stringify(s)).toBe(keep);
    }
  });
  it('jeton avatarında: yalnız altSinif eşleşen karakter look taşır; çizimde kanat jetonun arkasında ve havadayken', () => {
    const plain = sheetAvatar(sheet({ raceId: 'human', classId: 'fighter', subclassId: 'champion' }));
    expect(plain.look).toBeUndefined();
    const a = sheetAvatar(sheet({ raceId: 'human', classId: 'warlock', subclassId: 'melek' }));
    expect(a.look).toMatchObject({ subclassId: 'melek', classId: 'warlock' });
    // Ek paket yok: alt sınıf yüklü değil, çizimde kanat yok ve hata yok.
    const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={a.look} flying /></svg>);
    expect(svg).not.toContain('melek-acik');
    // Sınıfsız (paket kontrolü atlanır) görünüm: havadayken arkada, yerdeyken yok.
    const look = { raceId: 'human', subclassId: 'melek', level: 5 };
    const air = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look} flying /></svg>);
    expect(air.indexOf('kanat/melek-acik.webp')).toBeGreaterThanOrEqual(0);
    expect(air.indexOf('kanat/melek-acik.webp')).toBeLessThan(air.indexOf('x.webp'));
    expect(renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look} /></svg>)).not.toContain('melek-acik');
  });
});

describe('karakter ekranlarında kanat (uçma yeteneği; havada olması gerekmez)', () => {
  const ab = (sh: Parameters<typeof lineageLook>[0]) => lineageLook(sh, { ability: true }).wing;
  it('uçma yeteneği olan karakter kanatlı: Tiefling Kanatlı, Dragonborn (5+), Celestial Kırık Kanat; yeteneği olmayan değil', () => {
    expect(ab({ raceId: 'tiefling', lineageId: 'winged', level: 1 })).toMatchObject({ id: 'tiefling-kanatli', open: true });
    expect(ab({ raceId: 'dragonborn', lineageId: 'red', level: 5 })).toMatchObject({ id: 'dragonborn' });
    expect(ab({ raceId: 'dragonborn', lineageId: 'red', level: 4 })).toBeNull();
    expect(ab({ raceId: 'celestial', celestialAwakening: 'kirik-kanat', level: 3 })).toMatchObject({ id: 'celestial-kirik-kanat' });
    expect(ab({ raceId: 'celestial', celestialAwakening: 'parlayan-ruh', level: 5 })).toBeNull();
    expect(ab({ raceId: 'tiefling', lineageId: 'infernal', level: 5 })).toBeNull();
    expect(ab({ raceId: 'human', subclassId: 'melek', level: 5 })).toMatchObject({ id: 'melek-acik' });
    expect(ab({ raceId: 'human', subclassId: 'baska', level: 5 })).toBeNull();
  });
  it('savaş kuralı aynen: ability geçmeyen çözümde Tiefling/Dragonborn/Melek yalnız havadayken, Celestial Kırık Kanat her zaman', () => {
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }).wing).toBeNull();
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing).not.toBeNull();
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }).wing).toBeNull();
    expect(lineageLook({ raceId: 'human', subclassId: 'melek' }).wing).toBeNull();
    expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'kirik-kanat', level: 3 }).wing).not.toBeNull();
  });
  it('LookFrame: ability ile kanat çizilir (karakter listesi, oluşturucu önizlemesi); ability yoksa yerdeki jetonda çizilmez', () => {
    const sh = { raceId: 'tiefling', lineageId: 'winged' };
    expect(renderToStaticMarkup(<LookFrame sheet={sh} size={44} ability><i /></LookFrame>)).toContain('kanat/tiefling-kanatli.webp');
    expect(renderToStaticMarkup(<LookFrame sheet={sh} size={44}><i /></LookFrame>)).not.toContain('look-wing');
    expect(renderToStaticMarkup(<LookFrame sheet={sh} size={44} flying><i /></LookFrame>)).toContain('look-wing');
  });
});

describe('KG1: karakter ekranı jetonu savaşla aynı çizim yolu, çerçevesiz', () => {
  const fig = (sheet: CharacterSheet, size = 48) => renderToStaticMarkup(<CharacterFigure avatar={sheetAvatar(sheet)} size={size} />);
  it('kanatlı Tiefling: yuvarlak rozet (class="avatar") yok; kanat jetonun arkasında, SVG kutusu kanadı kapsar (kırpılmaz)', () => {
    const sh = sheet({ raceId: 'tiefling', lineageId: 'winged', classId: 'wizard' });
    const m = fig(sh);
    expect(m).not.toContain('class="avatar');
    expect(m).toContain('kanat/tiefling-kanatli.webp');
    expect(m.indexOf('look-wing')).toBeLessThan(m.indexOf('characters/'));
    const wb = wingBox(lineageLook(sh, { ability: true }).wing!, 24, 24, 48);
    const vb = /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/.exec(m)!.slice(1).map(Number) as [number, number, number, number];
    expect(vb[0]).toBeLessThanOrEqual(wb.x); expect(vb[1]).toBeLessThanOrEqual(wb.y);
    expect(vb[0] + vb[2]).toBeGreaterThanOrEqual(wb.x + wb.width); expect(vb[1] + vb[3]).toBeGreaterThanOrEqual(wb.y + wb.height);
  });
  it('kanatsız karakter de aynı çerçevesiz yol: kanat katmanı yok, jeton görseli var', () => {
    const m = fig(sheet({ raceId: 'human', classId: 'fighter' }));
    expect(m).not.toContain('class="avatar');
    expect(m).not.toContain('look-wing');
    expect(m).toContain('characters/');
  });
});

describe('Tiefling alt soy renkleri (kök neden: Kanatlı soyu sarı-yeşile boyuyordu)', () => {
  const L = (soyRenkleri.races as unknown as Record<string, { lineages: Record<string, { lch: { h: number; c: number; hueKeep?: number } } | null> }>).tiefling!.lineages;
  it('Kanatlı soyu sarı-yeşil ton bandında (45–150°) değil; iki yönden de jetonu tek renge boyamaz (orijinal sapmanın payı korunur)', () => {
    const w = L.winged!.lch;
    expect(w.h < 45 || w.h > 150).toBe(true);
    expect(w.hueKeep ?? 0.3).toBeGreaterThanOrEqual(0.6);
    expect(L.infernal).toBeNull();
    for (const id of ['abyssal', 'chthonic']) expect(L[id]!.lch.hueKeep ?? 0.3).toBeGreaterThanOrEqual(0.6);
  });
});

const TOKENS = ['human-male-fighter', 'human-female-wizard', 'human-male-rogue'];
async function load(name: string) {
  const t = await sharp(`public/characters/${name}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = await sharp(`public/characters/maske/${name}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = new Uint8Array(t.data.length / 4);
  for (let i = 0; i < mask.length; i++) mask[i] = m.data[i * m.info.channels]! > 127 ? 1 : 0;
  return { data: new Uint8ClampedArray(t.data), mask };
}
const meanLab = (d: Uint8ClampedArray, mask: Uint8Array) => {
  let L = 0, a = 0, b = 0, n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] && d[i * 4 + 3]! > 10) { const l = rgbToLab(d[i * 4]!, d[i * 4 + 1]!, d[i * 4 + 2]!); L += l[0]; a += l[1]; b += l[2]; n++; }
  return [L / n, a / n, b / n] as const;
};

describe('Human ten maskesi: yalnız ten boyanır (3 jeton × 3 ton)', () => {
  for (const name of TOKENS) {
    it(`${name}: ten dışı piksel farkı 0; Orijinal aynen; Koyu ve Altın teni hedef renge yaklaşır, açıklık sırası korunur`, async () => {
      const { data, mask } = await load(name);
      expect(lineageTint('human', 'tenhausser')).toBeUndefined();
      const base = meanLab(data, mask);
      const result: Record<string, readonly number[]> = {};
      for (const tone of ['orijinal', 'siyahi', 'dogu-asyali']) {
        const px = new Uint8ClampedArray(data);
        const tint = skinTint('human', tone);
        if (tint) tintPixels(px, tint, mask);
        let outside = 0, maxOut = 0;
        for (let i = 0; i < mask.length; i++) if (!mask[i]) for (let k = 0; k < 4; k++) { const d = Math.abs(px[i * 4 + k]! - data[i * 4 + k]!); outside += d; maxOut = Math.max(maxOut, d); }
        expect(outside, `${name} ${tone} ten dışı`).toBe(0);
        expect(maxOut).toBe(0);
        result[tone] = meanLab(px, mask);
      }
      expect(result.orijinal).toEqual(base);
      // Hedef ortalama açıklık: Koyu koyu, Altın açık; ton hedefe yakın.
      const target = (hex: string) => { const n = parseInt(hex.slice(1), 16); return rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255); };
      for (const [tone, hex] of [['siyahi', '#96623E'], ['dogu-asyali', '#E2B880']] as const) {
        const t = target(hex), r = result[tone]!;
        expect(Math.abs(r[0]! - t[0]), `${tone} L`).toBeLessThan(6);
        expect(Math.hypot(r[1]! - t[1], r[2]! - t[2]), `${tone} ab`).toBeLessThan(14);
      }
      expect(result.siyahi![0]).toBeLessThan(result['dogu-asyali']![0]!);
    });
  }
  it('tek ten tonu piksel kümesi içinde gölge/ışık orantısı korunur (açıklık sırası değişmez)', async () => {
    const { data, mask } = await load('human-male-fighter');
    const px = new Uint8ClampedArray(data);
    tintPixels(px, skinTint('human', 'siyahi')!, mask);
    const idx: number[] = [];
    for (let i = 0; i < mask.length; i++) if (mask[i] && data[i * 4 + 3]! > 10) idx.push(i);
    const L0 = idx.map((i) => rgbToLab(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!)[0]);
    const L1 = idx.map((i) => rgbToLab(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!)[0]);
    const n = L0.length; const m0 = L0.reduce((a, b) => a + b, 0) / n, m1 = L1.reduce((a, b) => a + b, 0) / n;
    let cov = 0, v0 = 0, v1 = 0;
    for (let i = 0; i < n; i++) { cov += (L0[i]! - m0) * (L1[i]! - m1); v0 += (L0[i]! - m0) ** 2; v1 += (L1[i]! - m1) ** 2; }
    expect(cov / Math.sqrt(v0 * v1)).toBeGreaterThan(0.95);
  });
});
