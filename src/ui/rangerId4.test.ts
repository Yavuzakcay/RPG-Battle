/**
 * Ranger Ejder Muhafızı (ID4) jeton düzeltmesi (yalnız görünüm; harita/belgeler/RANGER-ID4-KONTROL.png): Dragonborn kanat katmanının
 * jeton başına kökü ve ölçeği (`kanat-esleme.json` `jetonAyar` → `wingRoot` → `wingPlacements`), Goliath maske düzeltmesi ve Dragonborn
 * pul düzeltmesi verisi. Görsel açılmaz: yalnız dosya adları listelenir (`import.meta.glob`, tembel).
 */
import { describe, expect, it } from 'vitest';
import kanat from '../../data/kanat-esleme.json';
import soy from '../../data/soy-renkleri.json';
import pulDuz from '../../data/dragonborn-pul-duzeltme.json';
import { lineageLook, wingPlacements, TOKEN_SPACE } from './lineageLook';
import { wingRoot } from './wingRoot';

const TOKENS = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => (f.split('/').pop() as string).replace(/\.webp$/, '')));
const MASKS = new Set(Object.keys(import.meta.glob('/public/characters/maske/*.png')).map((f) => (f.split('/').pop() as string).replace(/\.png$/, '')));
const PUL = new Set(Object.keys(import.meta.glob('/public/characters/maske-pul/*.png')).map((f) => (f.split('/').pop() as string).replace(/\.png$/, '')));
const AYAR = (kanat.slotlar.dragonborn as unknown as { jetonAyar: Record<string, { kok?: number[]; olcek?: number }> }).jetonAyar;
const look = { raceId: 'dragonborn', lineageId: 'black', level: 13 };

describe('Ranger ID4: Dragonborn kanat katmanı jetona göre', () => {
  it('jeton başına ayar var olan jetonlara ait; kök jeton uzayında, sol < sağ, ölçek 0–1', () => {
    expect(Object.keys(AYAR).sort()).toEqual(['erkek-ranger-ID4', 'kadin-ranger-ID4']);
    for (const [ad, a] of Object.entries(AYAR)) {
      expect(TOKENS.has(`dragonborn-${ad}`), ad).toBe(true);
      expect(a.kok![0]!).toBeLessThan(a.kok![1]!);
      expect(a.kok![0]!).toBeGreaterThan(10); expect(a.kok![1]!).toBeLessThan(TOKEN_SPACE - 10);
      expect(a.olcek!).toBeGreaterThan(0); expect(a.olcek!).toBeLessThan(1);
    }
  });

  it('elle ayar üretilen kökün önüne geçer (küçük kopyada da); başka jeton etkilenmez', () => {
    const r = wingRoot('characters/dragonborn-erkek-ranger-ID4.webp', look);
    expect(r).toEqual({ sol: AYAR['erkek-ranger-ID4']!.kok![0], sag: AYAR['erkek-ranger-ID4']!.kok![1], olcek: AYAR['erkek-ranger-ID4']!.olcek });
    expect(wingRoot('characters/kucuk/dragonborn-erkek-ranger-ID4.webp', look)).toEqual(r);
    expect(wingRoot('characters/dragonborn-erkek-ranger-ID1.webp', look)?.olcek).toBeUndefined();
  });

  it('ölçek kanat kutusunu küçültür; kök ve dönüş aynı', () => {
    const wing = lineageLook(look, { ability: true }).wing!;
    expect(wing.palet).toBeDefined();
    const r = wingRoot('characters/dragonborn-kadin-ranger-ID4.webp', look)!;
    const a = wingPlacements(wing, 128, 128, 256, { sol: r.sol, sag: r.sag });
    const b = wingPlacements(wing, 128, 128, 256, r);
    for (let i = 0; i < 2; i++) {
      expect(b[i]!.width / a[i]!.width).toBeCloseTo(r.olcek!, 6);
      expect(b[i]!.pivot).toEqual(a[i]!.pivot);
      expect(b[i]!.angle).toBe(a[i]!.angle);
    }
  });

  it('kanat paleti seçilen soydan (10 soyun hepsi)', () => {
    const pal = (kanat.slotlar.dragonborn as unknown as { renkPaletleri: Record<string, { golge: string }> }).renkPaletleri;
    for (const l of ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white']) {
      expect(lineageLook({ ...look, lineageId: l }, { ability: true }).wing?.palet?.golge, l).toBe(pal[l]!.golge);
    }
  });
});

describe('Ranger ID4: maske düzeltmeleri veride', () => {
  it('Goliath: yoldaş ve kanat dışlanır, yüz kutusu eklenir; maske dosyası var', () => {
    const fix = (soy as unknown as { maskFix: Record<string, { exclude?: number[][]; include?: number[][] }> }).maskFix;
    for (const g of ['erkek', 'kadin']) {
      const n = `goliath-${g}-ranger-ID4`;
      expect(fix[n]?.exclude?.length, n).toBeGreaterThanOrEqual(2);
      expect(fix[n]?.include?.length, n).toBeGreaterThanOrEqual(1);
      expect(MASKS.has(n), n).toBe(true);
      // Kutular kesişmez (exclude ile include çakışırsa include kazanır: yoldaşa taşma geri gelirdi).
      for (const a of fix[n]!.exclude!) for (const b of fix[n]!.include!) {
        const kes = a[0]! <= b[2]! && b[0]! <= a[2]! && a[1]! <= b[3]! && b[1]! <= a[3]!;
        expect(kes, `${n} ${a} ∩ ${b}`).toBe(false);
      }
    }
  });

  it('Dragonborn: yoldaşın sol kanadı (çokgen) pul maskesinden çıkar; pul maskesi var', () => {
    const J = (pulDuz as unknown as { jetonlar: Record<string, { haric?: unknown[] }> }).jetonlar;
    for (const g of ['erkek', 'kadin']) {
      const n = `dragonborn-${g}-ranger-ID4`;
      const polys = (J[n]?.haric ?? []).filter((h) => Array.isArray((h as unknown[])[0]));
      expect(polys.some((p) => (p as number[][]).some(([x, y]) => x! <= 25 && y! <= 35)), n).toBe(true);
      expect(PUL.has(n), n).toBe(true);
    }
  });

  // `ekle` kutuları [x0, y0, x1, y1] uç hariç (scripts/dragonborn-desen-v2.py `_kutular`); `haric` kutu ya da çokgen.
  type Duz = { ekle?: number[][]; haric?: Array<number[] | number[][]> };
  const J = (pulDuz as unknown as { jetonlar: Record<string, Duz> }).jetonlar;
  const ekleOf = (n: string): Set<string> => {
    const px = new Set<string>();
    for (const [x0, y0, x1, y1] of J[n]!.ekle! as [number, number, number, number][]) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px.add(`${x},${y}`);
    return px;
  };
  /** Nokta (piksel merkezi) haric alanında mı: kutu ya da çokgen (çift-tek kuralı). */
  const inHaric = (n: string, x: number, y: number): boolean => (J[n]!.haric ?? []).some((h) => {
    if (!Array.isArray(h[0])) { const [x0, y0, x1, y1] = h as number[]; return x >= x0! && x < x1! && y >= y0! && y < y1!; }
    const p = h as number[][]; let inside = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i]!; const [xj, yj] = p[j]!;
      if ((yi! > y + 0.5) !== (yj! > y + 0.5) && x + 0.5 < ((xj! - xi!) * (y + 0.5 - yi!)) / (yj! - yi!) + xi!) inside = !inside;
    }
    return inside;
  });

  it('Dragonborn erkek: ekle yalnız doldurulan macenta artığının 17 pikseli (yoldaş kanadının pikselleri değil)', () => {
    const px = ekleOf('dragonborn-erkek-ranger-ID4');
    expect(px.size).toBe(17);
    for (const k of ['105,93', '105,94', '106,94']) expect(px.has(k), k).toBe(false);
  });

  it('Dragonborn kadın: ekle tam çene altındaki 28 piksel; kanat çokgenine ve yoldaş kutusuna taşmaz', () => {
    const px = ekleOf('dragonborn-kadin-ranger-ID4');
    const exp = [[105, 78], [106, 78], [107, 78], ...[78, 79, 80].map((y) => [110, y]), ...[111, 112].flatMap((x) => [77, 78, 79, 80].map((y) => [x, y])),
      ...[113, 114].flatMap((x) => [77, 78, 79, 80, 81, 82, 83].map((y) => [x, y]))].map(([x, y]) => `${x},${y}`);
    expect(exp).toHaveLength(28);
    expect([...px].sort()).toEqual([...exp].sort());
    // Denetim gerçek: kanat çokgeninin içi ve yoldaş kutusu yakalanır.
    expect(inHaric('dragonborn-kadin-ranger-ID4', 50, 60)).toBe(true);
    expect(inHaric('dragonborn-kadin-ranger-ID4', 190, 100)).toBe(true);
    for (const k of px) { const [x, y] = k.split(',').map(Number) as [number, number]; expect(inHaric('dragonborn-kadin-ranger-ID4', x, y), k).toBe(false); }
  });
});
