/**
 * ROZET-CERCEVE-KIRPMA: rozet çerçevesi jetonun bütün opak gövdesini göstermeli (JETON-DENETIM 2b: 69 jetonda baş/şapka kesiliyordu;
 * ölçümde kesiğin çoğu alt köşelerde: ayak, etek, silah ucu). Zarflar `src/ui/fixtures/rozet-kirpma.json` (yalnız sayılar;
 * `npx vite-node scripts/rozet-sigdirma.ts`). Gerçek tarayıcıda önce/sonra ölçümü: `npx vite-node scripts/rozet-cerceve.ts`.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import fx from './fixtures/rozet-kirpma.json';
import gorunum from '../../data/alt-soy-gorunum.json';
import { alphaHull, archOutline, archRadius, badgeFit, convexHull, fitCss, fittedHull, inArch, type BadgeFitInput, type Pt } from './badgeFit';
import { FOOT_FRAC } from './lineageLook';
import { AvatarBadge } from './Avatar';
import type { Avatar } from '../battle/types';

const F = fx as unknown as { ayak: number; oranlar: Array<{ en: number; boy: number }>; jetonlar: string[]; zarf: Record<string, Pt[]> };
const SIZES = [16, 30, 44, 56, 84, 110];
/** Çerçeve kenarına (kemer dışına) taşmasına izin verilen pay: 0,25 CSS px (kenar yumuşatması `EDGE_PX` bunun içinde). */
const PAY_PX = 0.25;
/** Boy tutarlılığı: listedeki jetonlarda en küçük ölçek (ölçülen ≈ 0,84). */
const K_ALT = 0.8;

describe('rozet sığdırma (ROZET-CERCEVE-KIRPMA)', () => {
  it('fikstür güncel: 69 jeton, ayak ve oranlar veriyle aynı', () => {
    expect(F.jetonlar).toHaveLength(69);
    expect(Object.keys(F.zarf).sort()).toEqual([...F.jetonlar].sort());
    expect(F.ayak).toBe(FOOT_FRAC);
    const oran = Object.values((gorunum as unknown as { altSoylar: Record<string, { oran?: { en: number; boy: number } }> }).altSoylar).flatMap((a) => (a.oran ? [a.oran] : []));
    for (const o of oran) expect(F.oranlar).toContainEqual(o);
  });

  it('önce: düz daire listedeki jetonların hepsinde gövdeyi kesiyordu', () => {
    // Eski çerçeve: içerik dairesi, oran ayaktan; herhangi bir alt soy oranında daire dışına taşan zarf köşesi = kesik.
    const cut = F.jetonlar.filter((n) => F.oranlar.some((o) => fittedHull({ hull: F.zarf[n]!, size: 84, sx: o.en, sy: o.boy, foot: FOOT_FRAC }, { k: 1, tx: 0, ty: 0, r: 0.5 })
      .some(([x, y]) => Math.hypot(x - 0.5, y - 0.5) > archRadius(84))));
    expect(cut.length).toBeGreaterThanOrEqual(55);
  });

  it('sonra: listedeki 69 jetonda (her boy, alt soy oranı, ayna) çerçeve dışında opak nokta yok; ölçek ≥ 0,8', () => {
    let worstK = 1;
    for (const n of F.jetonlar) for (const size of SIZES) for (const o of F.oranlar) for (const mirror of [1, -1] as const) {
      const input: BadgeFitInput = { hull: F.zarf[n]!, size, sx: o.en, sy: o.boy, mirror, foot: FOOT_FRAC };
      const f = badgeFit(input);
      const eps = PAY_PX / (size - 6);
      const out = fittedHull(input, f).filter((p) => !inArch(p, 0.5, eps));
      expect(out, `${n} ${size}px ${o.en}×${o.boy} ayna ${mirror}`).toEqual([]);
      // Kemerin kendisi rozetin içerik kutusunda (0–1): figür rozet kutusunun dışına taşmaz.
      for (const [x, y] of fittedHull(input, f)) { expect(x).toBeGreaterThanOrEqual(-eps); expect(x).toBeLessThanOrEqual(1 + eps); expect(y).toBeGreaterThanOrEqual(-eps); expect(y).toBeLessThanOrEqual(1 + eps); }
      expect(f.k).toBeGreaterThanOrEqual(K_ALT);
      worstK = Math.min(worstK, f.k);
    }
    expect(worstK).toBeLessThan(1); // en az bir jetonda küçültme gerekti (test boş değil)
  });

  it('en küçük değişiklik: sığan zarfa dokunulmaz, yalnız kaydırmayla sığan küçültülmez', () => {
    const small: Pt[] = convexHull([[0.4, 0.2], [0.6, 0.2], [0.4, 0.9], [0.6, 0.9]]);
    expect(badgeFit({ hull: small, size: 84, foot: FOOT_FRAC })).toMatchObject({ k: 1, tx: 0, ty: 0 });
    // Dar ama sola kaymış: ölçek 1, sağa kaydırma.
    const left: Pt[] = convexHull([[0, 0.4], [0.3, 0.4], [0, 0.9], [0.3, 0.9]]);
    const f = badgeFit({ hull: left, size: 84, foot: FOOT_FRAC });
    expect(f.k).toBe(1);
    expect(f.tx).toBeGreaterThan(0);
    expect(Math.abs(f.ty)).toBeLessThan(0.01);
    // Tuvalin tepesine değen geniş şapka: küçültülür.
    const tall: Pt[] = convexHull([[0.1, 0], [0.9, 0], [0.3, 0.97], [0.7, 0.97]]);
    expect(badgeFit({ hull: tall, size: 84, foot: FOOT_FRAC }).k).toBeLessThan(1);
  });

  it('kırpma yolu görselin kendi koordinatında: dönüşümle kemerin üstüne oturur (oran, ayna, ölçek, kaydırma)', () => {
    const hull = F.zarf[F.jetonlar[0]!]!;
    for (const o of F.oranlar) for (const mirror of [1, -1] as const) {
      const input: BadgeFitInput = { hull, size: 84, sx: o.en, sy: o.boy, mirror, foot: FOOT_FRAC };
      const f = badgeFit(input);
      const css = fitCss(input, f);
      const local = [...css.clip.matchAll(/(-?[\d.]+)% (-?[\d.]+)%/g)].map((m) => [Number(m[1]) / 100, Number(m[2]) / 100] as const);
      const sx = o.en * mirror, sy = o.boy, A = FOOT_FRAC;
      const back = local.map(([x, y]) => [0.5 + f.tx + f.k * sx * (x - 0.5), A + f.ty + f.k * sy * (y - A)] as const);
      const want = archOutline(f.r);
      back.forEach(([x, y], i) => { expect(x).toBeCloseTo(want[i]![0], 3); expect(y).toBeCloseTo(want[i]![1], 3); });
    }
  });

  it('alphaHull bütün opak pikselleri kapsar; eşik altı alfa sayılmaz', () => {
    const w = 8, h = 6, a = new Uint8Array(w * h * 4);
    const set = (x: number, y: number, v: number) => { a[(y * w + x) * 4 + 3] = v; };
    set(1, 1, 255); set(6, 2, 200); set(3, 5, 61); set(7, 0, 60);
    const hull = alphaHull(a, w, h);
    const inside = (px: number, py: number) => {
      // dışbükey: her kenarın aynı yanında (yön işaretinden bağımsız)
      const cr = hull.map((p, i) => { const q = hull[(i + 1) % hull.length]!; return (q[0] - p[0]) * (py - p[1]) - (q[1] - p[1]) * (px - p[0]); });
      return cr.every((c) => c >= -1e-9) || cr.every((c) => c <= 1e-9);
    };
    // Zarf köşeleri 3 basamağa dışa yuvarlı: köşeyi zarfın merkezine binde birkaç yaklaştırarak sına.
    const c = [hull.reduce((s, p) => s + p[0], 0) / hull.length, hull.reduce((s, p) => s + p[1], 0) / hull.length] as const;
    const near = (px: number, py: number) => inside(c[0] + (px - c[0]) * 0.995, c[1] + (py - c[1]) * 0.995);
    for (const [x, y] of [[1, 1], [6, 2], [3, 5]]) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) expect(near((x! + dx!) / w, (y! + dy!) / h)).toBe(true);
    expect(inside(7.5 / w, 0.5 / h)).toBe(false); // alfa 60 opak değil
  });

  it('kemer yarıçapı: içerik dairesi eksi kenar payı', () => {
    expect(archRadius(84)).toBeCloseTo(0.5 - 0.75 / 78, 9);
  });

  it('AvatarBadge: görselli rozette kemer kırpması ve ayak kaynağı; ölçülmemiş zarfta ölçek yok', () => {
    const av = { src: 'characters/dwarf-male-wizard.webp', bg: '#333', label: 'D' } as Avatar;
    const html = renderToStaticMarkup(createElement(AvatarBadge, { avatar: av, size: 84, eager: true }));
    expect(html).toContain('avatar');
    expect(html).toMatch(/class="avatar[^"]* fit/);
    expect(html).toContain('--fit-clip:polygon(');
    expect(html).toContain(`--look-foot:${FOOT_FRAC * 100}%`);
    expect(html).not.toContain('--fit:');
    const none = renderToStaticMarkup(createElement(AvatarBadge, { avatar: { ...av, src: '' } as Avatar, size: 44 }));
    expect(none).not.toContain('--fit-clip');
  });
});
