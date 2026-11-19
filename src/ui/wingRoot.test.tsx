/**
 * Dragonborn kanadı gövdeye bağlı (kullanıcı kararı 2026-11-20; yalnız görünüm): kök verisi, yerleşim ve düzeltme tablosu, soy
 * paleti (gölge → orta → ışık, gerilmiş parlaklık aralığı), rozet çizimi (zemin dairesi → kanat → figür). Görseller okunmaz.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import wings from '../../data/kanat-esleme.json';
import { lineageLook, wingFilterTables, wingRootBounds, wingRootLayout, type WingPalet, type WingRoot } from './lineageLook';
import { LookFrame } from './LookFrame';
import { AvatarBadge } from './Avatar';
import { sheetAvatar } from '../battle/avatar';
import type { CharacterSheet } from '../rules/stats';

type Slot = { kok?: WingRoot; renkPaletleri?: Record<string, WingPalet>; palet?: WingPalet; enBoy: number };
const SLOTS = (wings as unknown as { slotlar: Record<string, Slot> }).slotlar;
const DB = SLOTS.dragonborn!;
const SOYLAR = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
const TOKENS = new Set(Object.keys(import.meta.glob('../../public/characters/dragonborn-*.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()!.replace('.webp', '')));

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
function lab(h: string): number[] {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hexRgb(h).map(lin) as [number, number, number];
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: string, b: string) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]!));

describe('Dragonborn kanat kökü: veri', () => {
  it('kök omuz–dirsek bandında, merkeze yakın; görsel kökü sağ yarıda; dönüş dışa/yukarı', () => {
    const k = DB.kok!;
    expect(k.y).toBeGreaterThanOrEqual(0.38);
    expect(k.y).toBeLessThanOrEqual(0.55);
    expect(Math.abs(k.x)).toBeLessThanOrEqual(0.1);
    expect(k.gorsel[0]).toBeGreaterThan(0.5);
    expect(k.aci).toBeGreaterThan(0);
    expect(k.aci).toBeLessThanOrEqual(30);
  });
  it('düzeltme tablosu: anahtarlar gerçek jeton adı ya da <sınıf>-<cinsiyet>, değerler bant içinde', () => {
    for (const [key, fix] of Object.entries(DB.kok!.duzeltme ?? {})) {
      expect(TOKENS.has(key) || /^[a-z]+-(erkek|kadin)$/.test(key), key).toBe(true);
      if (fix.y !== undefined) { expect(fix.y).toBeGreaterThanOrEqual(0.38); expect(fix.y).toBeLessThanOrEqual(0.55); }
    }
  });
  it('10 soyun paleti var (orta + aralık); Siyah koyu, Beyaz sıcak ve Gümüş soğuk ayırt edilir (ΔE ≥ 12)', () => {
    const P = DB.renkPaletleri!;
    expect(Object.keys(P).sort()).toEqual(SOYLAR);
    for (const s of SOYLAR) { expect(P[s]!.orta, s).toBeDefined(); expect(P[s]!.aralik, s).toHaveLength(2); }
    expect(lab(P.black!.orta!)[0]).toBeLessThan(30);
    expect(dE(P.white!.orta!, P.silver!.orta!)).toBeGreaterThanOrEqual(12);
    expect(lab(P.white!.orta!)[2]).toBeGreaterThan(0); // sıcak (sarıya)
    expect(lab(P.silver!.orta!)[2]).toBeLessThan(0); // soğuk (maviye)
  });
});

describe('Dragonborn kanat kökü: yerleşim ve palet tablosu', () => {
  it('kök jetonda (x, y) oranında; sol ayna; düzeltme jeton adından', () => {
    const k = DB.kok!;
    const L = wingRootLayout(k, DB.enBoy, 128, 128, 256);
    expect(L.rootX).toBeCloseTo(128 + k.x * 256);
    expect(L.rootY).toBeCloseTo(k.y * 256);
    expect(L.angle).toBe(-k.aci);
    expect(L.x + k.gorsel[0] * L.width).toBeCloseTo(L.rootX);
    const fixed = wingRootLayout(k, DB.enBoy, 128, 128, 256, 'characters/dragonborn-male-bard.webp');
    expect(fixed.rootY).toBeCloseTo((k.duzeltme!['dragonborn-male-bard']!.y ?? k.y) * 256);
    const b = wingRootBounds(k, DB.enBoy, 128, 128, 256);
    expect(b.x + b.width / 2).toBeCloseTo(128);
  });
  it('eski palet (Tiefling) iki duraklı tablo aynen; Dragonborn 17 duraklı, aralığın altı gölge, üstü ışık', () => {
    const old = wingFilterTables(SLOTS['tiefling-kanatli']!.palet!);
    expect(old.r.split(' ')).toHaveLength(2);
    const p = DB.renkPaletleri!.red!;
    const t = wingFilterTables(p).r.split(' ').map(Number);
    expect(t).toHaveLength(17);
    expect(t[0]).toBeCloseTo(hexRgb(p.golge)[0]!, 2);
    expect(t[16]).toBeCloseTo(hexRgb(p.isik)[0]!, 2);
  });
});

describe('Dragonborn kanat kökü: rozet çizimi', () => {
  const sheet = (lvl: number) => ({ name: 'D', raceId: 'dragonborn', classId: 'fighter', gender: 'erkek', level: lvl, lineageId: 'black', subclassId: 'champion' }) as unknown as CharacterSheet;
  it('5. seviye: zemin dairesi → iki kanat (SVG, kırpılmış sağ yarı + ayna) → saydam zeminli rozet', () => {
    const a = sheetAvatar(sheet(5));
    const html = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'dragonborn', lineageId: 'black', level: 5 }} size={96} ability avatar={a}><AvatarBadge avatar={a} size={96} eager /></LookFrame>);
    expect(html).toContain('look-frame winged');
    expect(html.indexOf('look-bg')).toBeLessThan(html.indexOf('look-wing-svg'));
    expect(html.indexOf('look-wing-svg')).toBeLessThan(html.indexOf('class="avatar'));
    expect((html.match(/<image /g) ?? []).length).toBe(2);
    expect(html).toContain('clip-path="url(#wr-');
    expect(html).toContain('scale(-1 1)');
  });
  it('4. seviyede kanat yok; Tiefling kanadı eski çift görsel (değişmedi)', () => {
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 4 }, { ability: true }).wing).toBeNull();
    const tw = lineageLook({ raceId: 'tiefling', lineageId: 'winged', level: 5 }, { ability: true }).wing;
    expect(tw?.kok).toBeUndefined();
    const html = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'tiefling', lineageId: 'winged', level: 5 }} size={96} ability><span /></LookFrame>);
    expect(html).not.toContain('winged"');
    expect(html).toContain('<img class="look-wing"');
  });
});
