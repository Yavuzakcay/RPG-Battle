/**
 * Açılış ekranı mantığı (Görev L, L2), saf: sahneler, zamanlama, atlama, kısa ve azaltılmış sürümler, katman ve zar
 * yerleşimi. Çizim `Splash.tsx` (tembel parça) + `splash.css`; ilk statik kare index.html'de (vite eklentisi
 * `splashStaticHtml`). Zamanlama `data/acilis-ekrani.json`, katman ve zar kutuları `data/logo.json` (`npm run logo`).
 *
 * Soğuk açılış (`full`): die (3D d20 ease-in döner, 20 yüzü önde durur) → logo (ışık parlaması, zar logoya
 * crossfade, Görev L'nin göz ışığı, kanatlar, yazı, nefes) → leaving (fade) → done. Logo görselleri zar dönerken
 * yüklenir; dönüş bitince hazır değilse en çok `assetTimeoutMs` beklenir, sonra statik logo (`reduced`).
 * Arka plandan dönüş (`short`) ve "hareketi azalt" (`reduced`): zar ve animasyon yok, statik logo ve kısa fade.
 * Dokunma ya da tuş: zar sahnesinde logo sahnesine, logo sahnesinde kapanışa geçer.
 */
import timing from '../../data/acilis-ekrani.json';
import { acilis } from '../../data/logo.json';
import { TRI_H, cssMatrix, dot, d20, faceShade, faceTransform, projectedBox, spinFrames } from './d20';

export const SPLASH_TIMING = timing;
export type SplashMode = 'full' | 'short' | 'reduced';
export type SplashPhase = 'die' | 'logo' | 'leaving' | 'done';
export interface SplashState { mode: SplashMode; phase: SplashPhase; since: number; ready: boolean }
export type SplashEvent =
  | { type: 'ready'; at: number }
  | { type: 'failed'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'skip'; at: number };

/** Açılış durumu: soğuk açılışta zar sahnesi; dönüşte kısa, hareketi azalt'ta azaltılmış statik logo. */
export function initialSplash(kind: 'cold' | 'resume', reduced: boolean, now = 0): SplashState {
  if (reduced) return { mode: 'reduced', phase: 'logo', since: now, ready: true };
  if (kind === 'resume') return { mode: 'short', phase: 'logo', since: now, ready: true };
  return { mode: 'full', phase: 'die', since: now, ready: false };
}

/** Logo sahnesinin süresi (leaving'e kadar). */
export const holdMs = (mode: SplashMode): number =>
  mode === 'full' ? timing.logo.leaveAfter : mode === 'short' ? timing.resume.fadeInMs + timing.resume.holdMs : timing.reduced.fadeInMs + timing.reduced.holdMs;
export const fadeMs = (mode: SplashMode): number =>
  mode === 'full' ? timing.fadeMs : mode === 'short' ? timing.resume.fadeMs : timing.reduced.fadeMs;
/** Soğuk açılışın toplam süresi (görseller zamanında yüklenirse, atlamasız). */
/** Zar sahnesinin süresi: dönüş + 20 önde duruş ve parlama. */
export const dieMs = (): number => timing.die.spinMs + timing.die.holdMs;
export const totalMs = (): number => dieMs() + holdMs('full') + fadeMs('full');

/** Bir sonraki kendiliğinden geçişin zamanı (yoksa null). */
export function nextDeadline(s: SplashState): number | null {
  switch (s.phase) {
    case 'die': return s.since + dieMs() + (s.ready ? 0 : timing.assetTimeoutMs);
    case 'logo': return s.since + holdMs(s.mode);
    case 'leaving': return s.since + fadeMs(s.mode);
    default: return null;
  }
}

const toLogo = (s: SplashState, at: number, ok: boolean): SplashState =>
  ok ? { ...s, phase: 'logo', since: at, ready: true } : { mode: 'reduced', phase: 'logo', since: at, ready: true };

export function splashReducer(s: SplashState, e: SplashEvent): SplashState {
  if (s.phase === 'done') return s;
  switch (e.type) {
    case 'ready':
      if (s.phase !== 'die' || s.ready) return s;
      // Dönüş bitmiş ve görsel bekleniyorsa hemen logo sahnesi.
      return e.at >= s.since + dieMs() ? toLogo(s, e.at, true) : { ...s, ready: true };
    case 'failed':
      return s.phase === 'die' ? toLogo(s, e.at, false) : s;
    case 'skip':
      if (s.phase === 'die') return toLogo(s, e.at, s.ready);
      return s.phase === 'logo' ? { ...s, phase: 'leaving', since: e.at } : s;
    case 'tick': {
      const d = nextDeadline(s);
      if (d === null || e.at < d) return s;
      if (s.phase === 'die') return toLogo(s, e.at, s.ready);
      if (s.phase === 'logo') return { ...s, phase: 'leaving', since: e.at };
      return { ...s, phase: 'done', since: e.at };
    }
  }
}

export type LayerId = 'kanat-sol' | 'kanat-sag' | 'govde' | 'yazi';
interface Box { x: number; y: number; w: number; h: number }
const pct = (v: number) => `${Math.round(v * 100000) / 1000}%`;

/** Katmanın sahnedeki yeri (yüzde) ve kanatlarda dönme noktası (katmanın kendi kutusuna göre). */
export function layerStyle(id: LayerId): Record<string, string> {
  const l = acilis.layers[id] as { box: Box };
  const b = l.box;
  const style: Record<string, string> = { left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) };
  if (id === 'kanat-sol' || id === 'kanat-sag') {
    const r = acilis.roots[id];
    style.transformOrigin = `${pct((r.x - b.x) / b.w)} ${pct((r.y - b.y) / b.h)}`;
  }
  return style;
}

/**
 * Gözden çıkan keskin ışık (Görev L3): kare kutu (sahne eninin `boxW` oranı), merkezi geniş logodaki gözde; ışık
 * kapalı kanatlı katmandaki gözden çıkar ve kanatlar açılırken geniş logodakine kayar (`--eye-dx/--eye-dy`, kutu
 * yüzdesi; iki çizimde ejderhanın başı farklı durduğundan göz birkaç yüzde kayık, `data/logo.json` `closed.align`).
 */
export function eyeStyle(): Record<string, string> {
  const box = timing.logo.eye.boxW;
  const wide = acilis.eye;
  const closed = acilis.closed.align.eyeClosed ?? wide;
  return {
    left: pct(wide.x), top: pct(wide.y), width: pct(box), marginLeft: pct(-box / 2), marginTop: pct(-box / 2),
    '--eye-dx': pct((closed.x - wide.x) / box), '--eye-dy': pct((closed.y - wide.y) / acilis.aspect / box),
  };
}

/** Kapalı kanatlı (zarsız) katmanın sahnedeki kutusu: altıgen dış sınırı geniş logodakiyle çakışır. */
export const closedStyle = (): Record<string, string> => {
  const b = acilis.closed.box;
  return { left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) };
};
export const CLOSED_LOGO = timing.closedLogo;
export const SPLASH_ASPECT = acilis.aspect;
export const layerFile = (id: LayerId): string => `logo/acilis-${id}.webp`;
export const FULL_LOGO = 'logo/logo-acilis.webp';

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const inline = (s: Record<string, string>) => Object.entries(s).map(([k, v]) => `${kebab(k)}:${v}`).join(';');

// --- 3D d20 (Görev L2) ---
const GEO = d20();
/** Zar sahnesinin dönüş animasyonu adı (keyframes `splashDieCss`). */
export const DIE_SPIN = 'splash-die-spin';

/**
 * Zarın sahnedeki yeri: logodaki zar kutusu (`data/logo.json` `acilis.die`, görüntü analizi) ile 3D zarın son
 * yönelimdeki izdüşümü (perspektif dahil) aynı merkez ve boyutta. Ölçek eni ve boyu ayrı oturtan iki ölçeğin
 * ortalaması (logodaki çizim tam düzgün ikosahedron değil; fark `fit` içinde). `em` sahne eninin oranı.
 */
export function dieLayout(): { em: number; left: number; top: number; fit: { w: number; h: number } } {
  const box = projectedBox(GEO.R0, timing.die.perspectiveEm);
  const d = acilis.die;
  const kw = d.w / box.w;
  const kh = d.h / acilis.aspect / box.h;
  const em = (kw + kh) / 2;
  const cx = d.x + d.w / 2 - box.cx * em;
  const cy = d.y + d.h / 2 - box.cy * em * acilis.aspect;
  return { em, left: cx, top: cy, fit: { w: (box.w * em) / d.w, h: (box.h * em * acilis.aspect) / d.h } };
}

/** Logodaki zarın merkezi (ışık parlaması buradan; sahne yüzdesi). */
export const dieCenterStyle = (): Record<string, string> => ({ left: pct(acilis.die.x + acilis.die.w / 2), top: pct(acilis.die.y + acilis.die.h / 2) });

/**
 * Yüzler satır içi SVG (clip-path 3D dönüşümde kenar yumuşatmıyor): siyah dış üçgen (kenar çizgisi), ortak gümüş-gri
 * metalik gradyanlı iç üçgen ve yüzün ışığa bakışına göre koyulaştıran/açan örtü (son yönelimde sol üst ışık).
 */
const EDGE = 0.05; // siyah kenar kalınlığı (kenar uzunluğu = 1)
const PAD = 0.06; // yüz div'inin saydam payı (em)
const TRI = (k: number): string => {
  // Ağırlık merkezine (0,5; 2/3·h) doğru k oranında küçültülmüş üçgen, viewBox 0 0 1000 866.
  const H = 866, cy = (2 / 3) * H;
  const pt = (x: number, y: number) => `${Math.round(500 + (x - 500) * k)},${Math.round(cy + (y - cy) * k)}`;
  return `${pt(500, 0)} ${pt(1000, H)} ${pt(0, H)}`;
};
const INNER_K = (TRI_H / 3 - EDGE) / (TRI_H / 3);
const DEFS = '<svg class="d20defs" width="0" height="0" aria-hidden="true"><defs><linearGradient id="d20g" x1="0.2" y1="0" x2="0.75" y2="1">'
  + '<stop offset="0" stop-color="#e4e5e8"/><stop offset="0.5" stop-color="#b3b5ba"/><stop offset="1" stop-color="#7f8186"/></linearGradient></defs></svg>';
function faceSvg(shade: number): string {
  const over = shade < 1 ? `<polygon points="${TRI(INNER_K)}" fill="#000" fill-opacity="${Math.round((1 - shade) * 100) / 100}"/>`
    : shade > 1 ? `<polygon points="${TRI(INNER_K)}" fill="#fff" fill-opacity="${Math.round((shade - 1) * 100) / 100}"/>` : '';
  const p = PAD * 1000;
  return `<svg viewBox="${-p} ${-p} ${1000 + 2 * p} ${866 + 2 * p}" aria-hidden="true"><polygon points="${TRI(1)}" fill="#0b0b0c"/><polygon points="${TRI(INNER_K)}" fill="url(#d20g)"/>${over}</svg>`;
}

/**
 * Zar HTML'i (statik ilk karede ve bileşende aynı metin): sahne (perspektif, sahnedeki yer), gövde (preserve-3d,
 * ilk yönelim) ve 20 yüz (SVG üçgen + rakam).
 */
export function dieHtml(): string {
  const L = dieLayout();
  const size = `width:${1 + 2 * PAD}em;height:${Math.round((TRI_H + 2 * PAD) * 1e4) / 1e4}em`;
  const first = spinFrames(GEO.R0, timing.die.turns)[0]!.m;
  const faces = GEO.faces.map((f) => `<div class="d20f" style="${size};transform:${faceTransform(f, PAD)}">${faceSvg(faceShade(f, GEO.R0))}<b>${f.number}</b></div>`).join('');
  return `<div class="splash-die" style="left:${pct(L.left)};top:${pct(L.top)};font-size:calc(var(--stage-w) * ${Math.round(L.em * 1e5) / 1e5});perspective:${timing.die.perspectiveEm}em">`
    + `${DEFS}<div class="splash-die-body" style="transform:${cssMatrix(first)}">${faces}</div></div>`;
}

/** Zar dönüşünün @keyframes metni (index.html'deki satır içi stile eklenir). */
export function splashDieCss(): string {
  return `@keyframes ${DIE_SPIN}{${spinFrames(GEO.R0, timing.die.turns).map((f) => `${Math.round(f.at * 100000) / 1000}%{transform:${cssMatrix(f.m)}}`).join('')}}`;
}

/** Zarın son yönelimde ekrana bakan yüzü (test ve doğrulama için). */
export const frontFace = (): number => GEO.faces.reduce((a, b) => (dot(GEO.R0[2], b.normal) > dot(GEO.R0[2], a.normal) ? b : a)).number;
export const dieFaces = () => GEO.faces;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * İlk statik kare (index.html, JavaScript yüklenmeden; React ağacının dışında `#splash-static`): kömür zemin ve
 * zarın ilk yönelimi. Tembel açılış bileşeni aynı yapıyı çizip bunu kaldırır.
 */
export function splashStaticHtml(label: string): string {
  return `<div id="splash-static" class="splash" role="img" aria-label="${esc(label)}">`
    + `<div class="splash-stage" style="--ar:${SPLASH_ASPECT}">${dieHtml()}</div></div>`;
}
