/**
 * Kuyruk AS1c: alt soy görünümünün savaş jetonuna taşınması (yalnız görünüm; kural sürümü 71 kalır), Human ten maskesi (ten dışı
 * pikseller hiçbir tonda değişmez), kanat katmanı (sprite yok/var, havada/değil).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { AvatarCircle, TokenFigure } from './Avatar';
import { lineageLook, skinTint } from './lineageLook';
import { tintPixels } from './tint';
import { lineageTint, sheetAvatar } from '../battle/avatar';
import { blankCharacter } from '../rules/builder';
import { rgbToLab } from './color';
import { CURRENT_RULES } from '../battle/ruleVersion';
import kanat from '../../data/kanat-esleme.json';
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

describe('kanat katmanı altyapısı', () => {
  it('eşleme: üç slot, dosya null (sprite sonra gelecek), Dragonborn 10 renk filtresi', () => {
    const s = kanat.slotlar as Record<string, { dosya: string | null; dosyaKapali: string | null; renkFiltreleri?: Record<string, string> }>;
    expect(Object.keys(s).sort()).toEqual(['celestial-kirik-kanat', 'dragonborn', 'tiefling-kanatli']);
    for (const w of Object.values(s)) expect(w.dosya).toBeNull();
    expect(Object.keys(s.dragonborn!.renkFiltreleri!).sort()).toEqual(['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white']);
  });
  it('sprite yokken katman yok (havada da); jeton çiziminde kanat görseli yok, hata yok', () => {
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing).toBeNull();
    const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={sheetAvatar(sheet({ raceId: 'tiefling', lineageId: 'winged' })).look} flying /></svg>);
    expect(svg).not.toContain('look-wing');
  });
  it('sprite tanımlıysa: havada açık dosya, havada değilken yalnız dosyaKapali (yoksa yok); seviye eşiği; Dragonborn renk filtresi', async () => {
    const s = kanat.slotlar as Record<string, { dosya: string | null; dosyaKapali: string | null }>;
    const keep = JSON.stringify(s);
    try {
      s['tiefling-kanatli']!.dosya = 'tiefling-kanatli.webp';
      s.dragonborn!.dosya = 'dragonborn.webp'; s.dragonborn!.dosyaKapali = 'dragonborn-kapali.webp';
      expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing).toMatchObject({ id: 'tiefling-kanatli', src: 'kanat/tiefling-kanatli.webp', open: true });
      expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: false }).wing).toBeNull();
      expect(lineageLook({ raceId: 'tiefling', lineageId: 'infernal' }, { flying: true }).wing).toBeNull();
      const red = lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: true }).wing!;
      expect(red.filtre).toContain('hue-rotate');
      expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: false }).wing).toMatchObject({ src: 'kanat/dragonborn-kapali.webp', open: false });
      expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 4 }, { flying: true }).wing).toBeNull();
      const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={sheetAvatar(sheet({ raceId: 'tiefling', lineageId: 'winged' })).look} flying /></svg>);
      expect(svg).toContain('kanat/tiefling-kanatli.webp');
      // Kanat jetonun ARKASINDA: kanat image'ı ana görselden önce.
      expect(svg.indexOf('kanat/tiefling-kanatli.webp')).toBeLessThan(svg.indexOf('x.webp'));
    } finally {
      const orig = JSON.parse(keep) as typeof s;
      for (const k of Object.keys(orig)) { s[k]!.dosya = orig[k]!.dosya; s[k]!.dosyaKapali = orig[k]!.dosyaKapali; }
    }
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
    it(`${name}: ten dışı piksel farkı 0; Orijinal aynen; Siyahi ve Doğu Asyalı teni hedef renge yaklaşır, açıklık sırası korunur`, async () => {
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
      // Hedef ortalama açıklık: Siyahi koyu, Doğu Asyalı açık; ton hedefe yakın.
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
