/**
 * KW1 (yalnız görünüm; kural sürümü değişmez): Dragonborn kanadı gövdeye bağlı. Kanat jetonun ARKASINDA, kökü gövde siluetinin omuz–dirsek
 * bandında sol/sağ kenarının biraz içinde (`data/dragonborn-kanat-kok.json`, `wingRoot`), tek (sağ) kanat görseli iki yana ayna
 * (`wingPlacements`); rozette kanat zemin dairesi ile figür arasında (`AvatarBadge` + `LookContext`); kanat rengi soyun BOYANMIŞ gövde
 * rengine yakın (`data/kanat-esleme.json` `renkPaletleri`: golge/isik/esik).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { AvatarBadge, TokenFigure } from './Avatar';
import { LookFrame } from './LookFrame';
import { lineageLook, placementBounds, placementTransform, wingFilterId, wingLumaMatrix, wingPlacements, TOKEN_SPACE } from './lineageLook';
import { wingRoot } from './wingRoot';
import { crownKey } from './haloCrown';
import { scalePixels } from './scaleTint';
import { deltaE, rgbToLab } from './color';
import kanat from '../../data/kanat-esleme.json';
import konum from '../../data/dragonborn-kanat-kok.json';

const SLOT = kanat.slotlar.dragonborn as unknown as { omuz: number; capa: [number, number]; olcek: number; enBoy: number; ayna: { dx: number; aci: number }; renkPaletleri: Record<string, { golge: string; isik: string; esik?: number }> };
// Yalnız dosya adları (import.meta.glob, tembel): görseller sharp ile çalışma anında okunur, teste gömülmez.
const FILES = Object.keys(import.meta.glob('/public/characters/dragonborn-*.webp')).map((f) => f.split('/').pop() as string).sort();
const NAMES = FILES.map((f) => f.slice('dragonborn-'.length, -'.webp'.length));
const SOY = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
const look = (lineageId = 'blue') => ({ raceId: 'dragonborn', lineageId, level: 5 });
const Y = Math.round(SLOT.omuz * TOKEN_SPACE);

describe('KW1 kanat kökü verisi', () => {
  it('her Dragonborn jetonunun kökü çözülür (jeton kaydı ya da sınıf+cinsiyet varsayılanı); sol < sağ, jeton uzayı içinde', () => {
    expect(NAMES.length).toBe(266); // 266 hücreli (DRAGONBORN-ESKI-JETON-KALDIR 2026-11-22: 24 sınıf-genel jeton kaldırıldı, 290 → 266)
    for (const n of NAMES) {
      const r = wingRoot(`characters/dragonborn-${n}.webp`, look());
      expect(r, n).not.toBeNull();
      // gövde jeton merkezinden kayık olabilir (örn. kadin-druid-ID8: sol kök merkezin sağında); iki kök ayrı kenarlarda ve jeton uzayı içinde
      expect(r!.sol, n).toBeGreaterThan(10); expect(r!.sag, n).toBeLessThan(TOKEN_SPACE - 10);
      expect(r!.sag - r!.sol, n).toBeGreaterThanOrEqual(16); expect(r!.sag - r!.sol, n).toBeLessThanOrEqual(140); // en ince gövde (iskelet Warlock) ≈ 21 px
    }
  });
  it('küçük kopya (kucuk/), eski yol ve Dragonborn dışı: aynı kök / kök yok', () => {
    const a = wingRoot('characters/dragonborn-erkek-fighter-ID12.webp', look());
    expect(wingRoot('characters/kucuk/dragonborn-erkek-fighter-ID12.webp', look())).toEqual(a);
    expect(wingRoot('characters/human-erkek-fighter-ID12.webp', look())).toBeNull();
    expect(wingRoot('characters/dragonborn-erkek-fighter-ID12.webp', { raceId: 'human', level: 5 })).toBeNull();
    expect(wingRoot(null, look())).toBeNull();
    expect(wingRoot('avatars/dragonborn-fighter-erkek.webp', look())).toBeNull();
  });
  it('veri: sinif anahtarları crownKey gruplarıyla aynı, jeton kayıtları var olan dosyalar ve gruptan > 5 px sapıyor', () => {
    const groups = new Set(NAMES.map((n) => crownKey(n)));
    expect(Object.keys(konum.sinif).sort()).toEqual([...groups].sort());
    for (const [n, v] of Object.entries(konum.jeton as Record<string, number[]>)) {
      expect(NAMES, n).toContain(n);
      const d = (konum.sinif as Record<string, number[]>)[crownKey(n)!]!;
      expect(Math.max(Math.abs(v[0]! - d[0]!), Math.abs(v[1]! - d[1]!)), n).toBeGreaterThan(5);
    }
  });
  it('kök siluete BAĞLI: her jetonda sol ve sağ kök, omuz bandında siluetin (alfa ≥ 128) en çok 3 px yakınında ve siluet içinde ya da kenarında', async () => {
    const bad: string[] = [];
    for (const f of FILES) {
      const n = f.slice('dragonborn-'.length, -'.webp'.length);
      const { data, info } = await sharp(`public/characters/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const a = (x: number, y: number) => data[(y * info.width + x) * 4 + 3]!;
      const r = wingRoot(`characters/${f}`, look())!;
      for (const [side, x] of [['sol', r.sol], ['sag', r.sag]] as const) {
        let ok = false;
        for (let y = Y - 6; y <= Y + 6 && !ok; y++) for (let k = -3; k <= 3 && !ok; k++) if (a(Math.round(x) + k, y) >= 128) ok = true;
        if (!ok) bad.push(`${n}:${side}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120000);
});

describe('KW1 kanat yerleşimi', () => {
  const wing = lineageLook(look(), { ability: true }).wing!;
  it('iki kanat: sağ kök (sag), sol kök (sol); kök omuz yüksekliğinde; sol kanat kök hizasında ayna; dışa/yukarı dönüş', () => {
    const ps = wingPlacements(wing, 50, 50, 40, { sol: 90, sag: 170 });
    expect(ps.map((p) => p.side)).toEqual(['sag', 'sol']);
    const [sag, sol] = ps as [typeof ps[0], typeof ps[0]];
    expect(sag.pivot.x).toBeCloseTo(50 - 20 + (170 / 256) * 40); expect(sol.pivot.x).toBeCloseTo(50 - 20 + (90 / 256) * 40);
    expect(sag.pivot.y).toBeCloseTo(50 - 20 + 40 * SLOT.omuz); expect(sol.pivot.y).toBeCloseTo(sag.pivot.y);
    expect(sag.width).toBeCloseTo(40 * SLOT.olcek); expect(sag.height).toBeCloseTo(sag.width * SLOT.enBoy);
    // kök (capa) kutuda kök noktasına oturur
    expect(sag.x + SLOT.capa[0] * sag.width).toBeCloseTo(sag.pivot.x); expect(sag.y + SLOT.capa[1] * sag.height).toBeCloseTo(sag.pivot.y);
    expect(sag.mirror).toBe(false); expect(sol.mirror).toBe(true);
    expect(placementTransform(sag)).toMatch(/^rotate\(-20 /);
    expect(placementTransform(sol)).toMatch(/^translate\([\d.]+ 0\) scale\(-1 1\) rotate\(-20 /);
    // sağ kanat sağa, sol kanat sola uzanır; ikisi de kökün üstüne doğru yükselir
    const bs = ps.map(placementBounds);
    expect(bs[0]!.x1).toBeGreaterThan(sag.pivot.x + 10); expect(bs[1]!.x0).toBeLessThan(sol.pivot.x - 10);
    expect(bs[0]!.y0).toBeLessThan(sag.pivot.y);
  });
  it('kök verisi yoksa slot varsayılanı: merkezden ± ayna.dx × jeton genişliği', () => {
    const [sag, sol] = wingPlacements(wing, 50, 50, 40) as [ReturnType<typeof wingPlacements>[0], ReturnType<typeof wingPlacements>[0]];
    expect(sag.pivot.x).toBeCloseTo(50 + SLOT.ayna.dx * 40); expect(sol.pivot.x).toBeCloseTo(50 - SLOT.ayna.dx * 40);
  });
  it('slot tek kanatlı değilse (Tiefling) yerleşim yok, eski kutu geçerli', () => {
    expect(wingPlacements(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing!, 50, 50, 40)).toEqual([]);
  });
});

describe('KW1 çizim: kanat figürün arkasında, kökler gövdede', () => {
  const root = wingRoot('characters/dragonborn-erkek-fighter-ID12.webp', look())!;
  it('savaş jetonu (SVG): iki kanat figürden ÖNCE, sol aynalı, dönüşler kökte; havada değilken ya da seviye < 5 kanat yok', () => {
    const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look()} flying wingRoot={root} /></svg>);
    expect(svg.match(/data-wing="dragonborn"/g)).toHaveLength(2);
    expect(svg).toContain('data-side="sag"'); expect(svg).toContain('data-side="sol"');
    expect(svg.indexOf('kanat/dragonborn.webp')).toBeLessThan(svg.indexOf('x.webp'));
    expect(svg.lastIndexOf('kanat/dragonborn.webp')).toBeLessThan(svg.indexOf('x.webp'));
    expect(svg).toContain('scale(-1 1) rotate(-20');
    const [sag] = wingPlacements(lineageLook(look(), { flying: true }).wing!, 50, 50, 40, root);
    expect(svg).toContain(`rotate(-20 ${Math.round(sag!.pivot.x * 100) / 100} ${Math.round(sag!.pivot.y * 100) / 100})`);
    expect(renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look()} wingRoot={root} /></svg>)).not.toContain('kanat/dragonborn.webp');
    expect(renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={{ ...look(), level: 4 }} flying wingRoot={root} /></svg>)).not.toContain('kanat/dragonborn.webp');
  });
  it('figür yönü çevrilince (flip) kanatlar figürle birlikte aynalanır', () => {
    const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look()} flying flip wingRoot={root} /></svg>);
    expect(svg).toContain('translate(100 0) scale(-1 1)');
    expect(svg.indexOf('kanat/dragonborn.webp')).toBeLessThan(svg.indexOf('x.webp'));
  });
  it('palet filtresi kanatlara uygulanır (soya göre, eşikli)', () => {
    const svg = renderToStaticMarkup(<svg><TokenFigure href="x.webp" cx={50} cy={50} w={40} look={look('white')} flying wingRoot={root} /></svg>);
    const p = SLOT.renkPaletleri.white!;
    expect(svg).toContain(`url(#${wingFilterId({ golge: p.golge, isik: p.isik, ...(p.esik ? { esik: p.esik } : {}) })})`);
    expect(svg).toContain('feColorMatrix');
  });
  const badge = (inFrame: boolean) => {
    const a = { src: 'characters/dragonborn-erkek-fighter-ID12.webp', bg: '#a44030', label: 'F', look: look() };
    const node = <AvatarBadge avatar={a} size={96} />;
    return renderToStaticMarkup(inFrame ? <LookFrame sheet={look()} size={96} ability>{node}</LookFrame> : node);
  };
  it('rozet (LookFrame içinde): kanat rozetin İÇİNDE, zemin dairesi ile figür arasında; ayrı kanat katmanı yok', () => {
    const h = badge(true);
    expect(h).toMatch(/class="avatar[^"]*has-wing"/); expect(h).toContain('badge-wings');
    expect(h.indexOf('badge-wings')).toBeLessThan(h.indexOf('<img'));
    expect(h.indexOf('<span class="avatar')).toBeLessThan(h.indexOf('badge-wings'));
    expect(h).not.toContain('<img class="look-wing"'); // LookFrame'in eski kanat katmanı (çift kanat görseli) çizilmez
    expect(h.match(/data-wing="dragonborn"/g)).toHaveLength(2);
    expect(h).toContain(`viewBox="0 0 ${TOKEN_SPACE} ${TOKEN_SPACE}"`);
  });
  it('rozet çerçevesiz kullanımda ve Tiefling (kanat çifti) eskisi gibi', () => {
    expect(badge(false)).not.toContain('badge-wings');
    const t = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'tiefling', lineageId: 'winged' }} size={44} ability><AvatarBadge avatar={{ src: 'characters/tiefling-erkek-fighter-GR.webp', bg: '#444', label: 'T', look: { raceId: 'tiefling', lineageId: 'winged', level: 5 } }} size={44} /></LookFrame>);
    expect(t).toContain('<img class="look-wing"'); expect(t).not.toContain('badge-wings'); expect(t).not.toContain('has-wing');
  });
});

describe('KW1 kanat paleti', () => {
  it('düz luma (eşiksiz) SD5 ile aynı matris; eşikli palet lumayı eşikten gerer ve filtre kimliği ayrışır', () => {
    expect(wingLumaMatrix({ golge: '#000000', isik: '#ffffff' })).toBe('0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0');
    const m = wingLumaMatrix({ golge: '#000000', isik: '#ffffff', esik: 0.75 }).split(/\s+/).map(Number);
    expect(m[0]).toBeCloseTo(0.2126 / 0.25, 3); expect(m[4]).toBeCloseTo(-3, 3); // 1 / (1 − 0.75) = 4, ofset −0.75 × 4
    expect(wingFilterId({ golge: '#000000', isik: '#ffffff' })).not.toBe(wingFilterId({ golge: '#000000', isik: '#ffffff', esik: 0.75 }));
  });
  it('10 soyun hepsi eşikli palet taşır (golge < isik açıklık)', () => {
    expect(Object.keys(SLOT.renkPaletleri).sort()).toEqual(SOY);
    for (const s of SOY) {
      const p = SLOT.renkPaletleri[s]!;
      expect(p.esik, s).toBeGreaterThan(0.5); expect(p.esik, s).toBeLessThan(0.95);
      const lab = (h: string) => rgbToLab(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16));
      expect(lab(p.isik)[0], s).toBeGreaterThan(lab(p.golge)[0] + 8);
    }
  });
  it('uyum: kanat ortalaması (Lab) ile boyanmış gövde ortalaması ΔE ≤ 15 (Black/White ≤ 20); White sıcak parlak, Silver soğuk metalik, ikisi ΔE ≥ 12; Black gövde kadar koyu', async () => {
    // Gövde: oyundaki boyama (scalePixels, pul maskesi) ile her 9. jeton, maske pikselleri; kanat: filtre formülüyle (luma → eşikten gerilmiş t → golge..isik).
    const names = NAMES.filter((n) => /^(erkek|kadin)-/.test(n)).filter((_, i) => i % 9 === 0);
    const imgs = await Promise.all(names.map(async (n) => {
      const { data, info } = await sharp(`public/characters/dragonborn-${n}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const mask = Uint8Array.from(await sharp(`public/characters/maske-pul/dragonborn-${n}.png`).greyscale().raw().toBuffer(), (v: number) => (v > 127 ? 1 : 0));
      return { data, W: info.width, H: info.height, mask };
    }));
    const wingImg = await sharp('public/kanat/dragonborn.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const hist = new Array<number>(256).fill(0);
    for (let p = 0; p < wingImg.info.width * wingImg.info.height; p++) if (wingImg.data[p * 4 + 3]! > 200) hist[wingImg.data[p * 4]!]!++;
    const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const wing: Record<string, number[]> = {}, body: Record<string, number[]> = {};
    for (const soy of SOY) {
      const p = SLOT.renkPaletleri[soy]!, lo = hexRgb(p.golge), hi = hexRgb(p.isik), e = p.esik ?? 0;
      let n = 0, L = 0, a = 0, b = 0;
      hist.forEach((c, v) => {
        if (!c) return;
        const t = Math.max(0, Math.min(1, (v / 255 - e) / (1 - e)));
        const [l, aa, bb] = rgbToLab(...(lo.map((x, i) => Math.round(x + (hi[i]! - x) * t)) as [number, number, number]));
        n += c; L += l * c; a += aa * c; b += bb * c;
      });
      wing[soy] = [L / n, a / n, b / n];
      let m = 0, bL = 0, ba = 0, bb2 = 0;
      for (const im of imgs) {
        const d = Uint8ClampedArray.from(im.data);
        scalePixels(d, soy, im.mask, im.W, im.H);
        for (let q = 0; q < im.W * im.H; q++) {
          if (!im.mask[q] || d[q * 4 + 3]! < 200) continue;
          const [l, aa, bb] = rgbToLab(d[q * 4]!, d[q * 4 + 1]!, d[q * 4 + 2]!);
          m++; bL += l; ba += aa; bb2 += bb;
        }
      }
      body[soy] = [bL / m, ba / m, bb2 / m];
      const limit = soy === 'black' || soy === 'white' ? 20 : 15;
      expect(deltaE(wing[soy]!, body[soy]!), `${soy} kanat–gövde ΔE`).toBeLessThanOrEqual(limit);
    }
    expect(deltaE(wing.white!, wing.silver!), 'White ↔ Silver kanat ΔE').toBeGreaterThanOrEqual(12);
    expect(wing.white![0], 'White parlak').toBeGreaterThan(84); expect(wing.white![2], 'White sıcak (b* > 0)').toBeGreaterThan(2);
    expect(wing.silver![2], 'Silver soğuk (b* < 0)').toBeLessThan(-5); expect(wing.silver![0], 'Silver metalik gri (orta açıklık)').toBeLessThan(70);
    expect(wing.black![0], 'Black kanat gövde kadar koyu').toBeLessThan(body.black![0]! + 6);
    // pastel yok: kanat ortalaması (White hariç: sıcak parlak beyaz) hiçbir soyda gövdeden 8 L'den fazla açık değil (eski palet: Black'te +26)
    for (const soy of SOY) if (soy !== 'white') expect(wing[soy]![0]! - body[soy]![0]!, `${soy} pastel değil`).toBeLessThan(8);
  }, 180000);
});
