/**
 * Görev L, L2: açılış ekranı mantığı (soğuk açılış ve dönüş, atlama, azaltılmış hareket, süre), CSS 3D d20 geometrisi
 * (numaralar, son yönelim, dönüş anahtar kareleri), zarın logodaki zara oturması ve bileşenin ilk çizimi.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import timing from '../../data/acilis-ekrani.json';
import { acilis } from '../../data/logo.json';
import { apply, d20, dot, projectedBox, spinFrames, type Mat } from './d20';
import {
  dieFaces, dieHtml, dieLayout, eyeStyle, fadeMs, frontFace, holdMs, initialSplash, layerStyle, nextDeadline, splashDieCss, splashReducer,
  splashStaticHtml, totalMs, type SplashState,
} from './splashLogic';
import { isResume, splashEnabled } from './splashBoot';
import Splash, { splashClass } from './Splash';
import { APP_NAME } from '../app/appName';

const run = (s: SplashState, ...events: Parameters<typeof splashReducer>[1][]) => events.reduce(splashReducer, s);
// Zar sahnesinin süresi (dönüş + 20 önde duruş ve parlama; Görev L3).
const SPIN = timing.die.spinMs + timing.die.holdMs;

describe('Açılış: soğuk açılış (zar → logo)', () => {
  it('zar sahnesiyle başlar; dönüş biter ve logo görselleri hazırsa logo sahnesi, sonra fade ve son', () => {
    const s0 = initialSplash('cold', false, 100);
    expect(s0).toEqual({ mode: 'full', phase: 'die', since: 100, ready: false });
    const s1 = run(s0, { type: 'ready', at: 600 });
    expect(s1).toMatchObject({ phase: 'die', ready: true });
    expect(nextDeadline(s1)).toBe(100 + SPIN);
    expect(run(s1, { type: 'tick', at: 100 + SPIN - 1 }).phase).toBe('die');
    const s2 = run(s1, { type: 'tick', at: 100 + SPIN });
    expect(s2).toMatchObject({ mode: 'full', phase: 'logo', since: 100 + SPIN });
    const s3 = run(s2, { type: 'tick', at: s2.since + holdMs('full') });
    expect(s3.phase).toBe('leaving');
    expect(run(s3, { type: 'tick', at: s3.since + fadeMs('full') }).phase).toBe('done');
  });
  it('süreler (Görev L3): dönüş 1,7 sn, 20 önde 2,0 sn; göz ışığı 2,0 sn, 0,15 sn patlama; kanatlar ≈2,2–3,1 sn; yazı ≈3,3 sn; toplam en çok ≈4,5 sn', () => {
    expect(timing.die.spinMs).toBe(1700);
    expect(SPIN).toBe(2000);
    expect(totalMs()).toBeLessThanOrEqual(4500);
    expect(timing.logo.eye.burstAt).toBe(0);
    expect(timing.logo.eye.burstMs).toBe(150);
    expect(timing.logo.wings.openMs).toBe(900);
    expect(SPIN + timing.logo.text.at).toBe(3300);
    expect(timing.logo.text.at).toBeGreaterThanOrEqual(timing.logo.wings.openAt + timing.logo.wings.openMs);
    // Zar, kanatlar açılmaya başladıktan sonra geniş logodaki zara devreder; kapalı logo o sırada solar.
    expect(timing.logo.dieHandoff.at).toBeGreaterThanOrEqual(timing.logo.wings.openAt);
    expect(timing.closedLogo).toBe('logo/acilis-kapali.webp');
  });
  it('görseller dönüş bitince hazır değilse bekler; gelince hemen logo; zaman aşımında statik logo', () => {
    const s0 = initialSplash('cold', false, 0);
    expect(nextDeadline(s0)).toBe(SPIN + timing.assetTimeoutMs);
    expect(run(s0, { type: 'tick', at: SPIN }).phase).toBe('die');
    expect(run(s0, { type: 'ready', at: SPIN + 200 })).toMatchObject({ mode: 'full', phase: 'logo', since: SPIN + 200 });
    expect(run(s0, { type: 'tick', at: SPIN + timing.assetTimeoutMs })).toMatchObject({ mode: 'reduced', phase: 'logo' });
    expect(run(s0, { type: 'failed', at: 50 })).toMatchObject({ mode: 'reduced', phase: 'logo', since: 50 });
  });
  it('dokunma: zar sahnesinde doğrudan logo sahnesine, logo sahnesinde kapanışa; leaving ve done değişmez', () => {
    const ready = run(initialSplash('cold', false, 0), { type: 'ready', at: 10 });
    const logo = run(ready, { type: 'skip', at: 500 });
    expect(logo).toMatchObject({ mode: 'full', phase: 'logo', since: 500 });
    const leaving = run(logo, { type: 'skip', at: 900 });
    expect(leaving).toMatchObject({ phase: 'leaving', since: 900 });
    expect(run(leaving, { type: 'skip', at: 950 })).toBe(leaving);
    const done = run(leaving, { type: 'tick', at: 900 + fadeMs('full') });
    expect(done.phase).toBe('done');
    expect(run(done, { type: 'skip', at: 9999 }, { type: 'ready', at: 9999 })).toBe(done);
    // Görseller hazır değilken atlanırsa statik logo (boş ekran yok).
    expect(run(initialSplash('cold', false, 0), { type: 'skip', at: 100 })).toMatchObject({ mode: 'reduced', phase: 'logo' });
  });
});

describe('Açılış: arka plandan dönüş ve hareketi azalt', () => {
  it('dönüşte zar yok: kısa statik logo ve fade (soğuk açılıştan kısa)', () => {
    const r = initialSplash('resume', false, 0);
    expect(r).toEqual({ mode: 'short', phase: 'logo', since: 0, ready: true });
    expect(holdMs('short') + fadeMs('short')).toBeLessThan(1500);
    expect(run(r, { type: 'tick', at: holdMs('short') }).phase).toBe('leaving');
    expect(splashClass(r)).toBe('splash short logo');
  });
  it('hareketi azalt: soğuk açılışta da zar yok, statik logo; kısa fade', () => {
    for (const kind of ['cold', 'resume'] as const) expect(initialSplash(kind, true, 0)).toMatchObject({ mode: 'reduced', phase: 'logo' });
    expect(fadeMs('reduced')).toBeLessThanOrEqual(300);
  });
  it('dönüş kararı: en az afterHiddenMs gizli kalınca', () => {
    const after = timing.resume.afterHiddenMs;
    expect(isResume(null, 1e9)).toBe(false);
    expect(isResume(1000, 1000 + after - 1)).toBe(false);
    expect(isResume(1000, 1000 + after)).toBe(true);
  });
  it('kapatma anahtarı: ?acilis=0 ya da rpg-battle-acilis=off', () => {
    expect(splashEnabled('', () => null)).toBe(true);
    expect(splashEnabled('?acilis=0', () => null)).toBe(false);
    expect(splashEnabled('', (k) => (k === 'rpg-battle-acilis' ? 'off' : null))).toBe(false);
    expect(splashEnabled('', () => { throw new Error('yok'); })).toBe(true);
  });
});

const angle = (a: Mat, b: Mat) => {
  let tr = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tr += a[i]![j]! * b[i]![j]!;
  return (Math.acos(Math.min(1, Math.max(-1, (tr - 1) / 2))) * 180) / Math.PI;
};

describe('3D d20 (saf CSS geometrisi)', () => {
  const { faces, R0 } = d20();
  it('20 yüz, 1–20 birer kez, karşılıklı yüzler toplamı 21', () => {
    expect(faces).toHaveLength(20);
    expect(faces.map((f) => f.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const f of faces) {
      const opp = faces.find((g) => dot(g.normal, f.normal) < -0.999)!;
      expect(f.number + opp.number).toBe(21);
    }
  });
  it('son yönelimde 20 kameraya bakar, tepesi yukarıda; logodaki komşular (2 sol, 14 sağ, 6 alt)', () => {
    expect(frontFace()).toBe(20);
    const f20 = faces.find((f) => f.number === 20)!;
    expect(apply(R0, f20.normal)[2]).toBeCloseTo(1, 9);
    const at = (n: number) => apply(R0, faces.find((f) => f.number === n)!.centroid);
    expect(at(2)[0]).toBeLessThan(0);
    expect(at(14)[0]).toBeGreaterThan(0);
    expect(at(6)[1]).toBeGreaterThan(0); // y aşağı
    expect(at(18)[1]).toBeLessThan(0);
    // Dönme matrisi: determinant 1 (yansıma yok).
    const det = R0[0][0] * (R0[1][1] * R0[2][2] - R0[1][2] * R0[2][1]) - R0[0][1] * (R0[1][0] * R0[2][2] - R0[1][2] * R0[2][0]) + R0[0][2] * (R0[1][0] * R0[2][1] - R0[1][1] * R0[2][0]);
    expect(det).toBeCloseTo(1, 9);
  });
  it('dönüş: son kare R0, ardışık kareler < 70° (doğru yönde ara değer), ease-in (adımlar eşit açı, süre kısalır)', () => {
    const fr = spinFrames(R0, timing.die.turns);
    expect(fr[fr.length - 1]!.m).toEqual(R0);
    expect(fr[0]!.at).toBe(0);
    expect(fr[fr.length - 1]!.at).toBe(1);
    for (let i = 1; i < fr.length; i++) expect(angle(fr[i - 1]!.m, fr[i]!.m)).toBeLessThan(70);
    const first = fr[1]!.at - fr[0]!.at, last = fr[fr.length - 1]!.at - fr[fr.length - 2]!.at;
    expect(first).toBeGreaterThan(last * 4); // başta yavaş, sonda hızlı
    expect(splashDieCss()).toMatch(/^@keyframes splash-die-spin\{0%\{transform:matrix3d\(/);
  });
  it('zar logodaki zarın yerinde ve boyunda (görüntü analizi kutusu, ±%6)', () => {
    const L = dieLayout();
    expect(L.fit.w).toBeGreaterThan(0.94);
    expect(L.fit.w).toBeLessThan(1.06);
    expect(L.fit.h).toBeGreaterThan(0.94);
    expect(L.fit.h).toBeLessThan(1.06);
    const box = projectedBox(R0, timing.die.perspectiveEm);
    const cx = L.left + box.cx * L.em, cy = L.top + box.cy * L.em * acilis.aspect;
    expect(cx).toBeCloseTo(acilis.die.x + acilis.die.w / 2, 4);
    expect(cy).toBeCloseTo(acilis.die.y + acilis.die.h / 2, 4);
  });
  it('HTML: 20 yüz div, her biri rakamlı; statik ilk kare zar ve adı içerir, görsel yok', () => {
    const html = dieHtml();
    expect(html.match(/class="d20f"/g)).toHaveLength(20);
    for (const f of dieFaces()) expect(html).toContain(`<b>${f.number}</b>`);
    const st = splashStaticHtml(APP_NAME);
    expect(st).toContain('id="splash-static"');
    expect(st).toContain('aria-label="Dice &amp; Hex"');
    expect(st).not.toContain('<img');
    expect(st).not.toMatch(/canvas|webgl/i);
  });
});

describe('Açılış bileşeni', () => {
  it('soğuk açılışın ilk çizimi: zar sahnesi + logo katmanları (görünmez, yükleniyor) + parlama', () => {
    const html = renderToStaticMarkup(<Splash kind="cold" onDone={() => {}} />);
    expect(html).toContain('class="splash full die"');
    expect(html).toContain('splash-die-body');
    expect(html).toContain('splash-govde');
    expect(html).toContain('splash-flash');
    // Görev L3: kapalı kanatlı logo zar sahnesinde; gözde keskin ışık (çekirdek + yatay/dikey/çapraz çizgiler).
    expect(html).toContain('logo/acilis-kapali.webp');
    for (const c of ['eye-core', 'eye-h', 'eye-v', 'eye-d1', 'eye-d2']) expect(html).toContain(c);
    expect(html).not.toContain('splash-full');
  });
  it('dönüşte zar yok, tek parça logo', () => {
    const html = renderToStaticMarkup(<Splash kind="resume" onDone={() => {}} />);
    expect(html).toContain('class="splash short logo"');
    expect(html).toContain('logo/logo-acilis.webp');
    expect(html).not.toContain('d20f');
  });
  it('göz ışığı geniş logodaki gözde; kapalı logodaki gözden kayar (kutu yüzdesi)', () => {
    const e = eyeStyle();
    expect(e.left).toBe(`${Math.round(acilis.eye.x * 100000) / 1000}%`);
    expect(e['--eye-dx']).toMatch(/^-?[\d.]+%$/);
    expect(e['--eye-dy']).toMatch(/^-?[\d.]+%$/);
  });
  it('kanat dönme noktası katmanın kendi kutusunda', () => {
    expect(layerStyle('kanat-sol').transformOrigin).toMatch(/^[\d.]+% [\d.]+%$/);
    expect(layerStyle('govde').transformOrigin).toBeUndefined();
  });
});
