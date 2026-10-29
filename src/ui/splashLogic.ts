/**
 * Açılış ekranı mantığı (Görev L), saf: aşamalar, zamanlama, atlama, azaltılmış hareket ve katman yerleşimi.
 * Çizim `Splash.tsx` + `splash.css`; ilk statik kare index.html'de (vite eklentisi `splashStaticHtml` ile üretir),
 * React aynı yapıyı çizerek devralır. Zamanlama `data/acilis-ekrani.json`, katman kutuları `data/logo.json`
 * (`npm run logo`).
 *
 * Aşamalar: static (yalnızca gövde; kanat görselleri yükleniyor) → playing (katlı kanat + göz ışığı, kanatlar açılır,
 * yazı belirir, nefes) → leaving (fade) → done. Dokunma ya da tuş `skip`: hemen leaving. Görseller süresinde
 * yüklenmezse ya da "hareketi azalt" açıksa `reduced`: statik tam logo, kısa fade.
 */
import timing from '../../data/acilis-ekrani.json';
import { acilis } from '../../data/logo.json';

export const SPLASH_TIMING = timing;
export type SplashMode = 'full' | 'reduced';
export type SplashPhase = 'static' | 'playing' | 'leaving' | 'done';
export interface SplashState { mode: SplashMode; phase: SplashPhase; since: number }
export type SplashEvent =
  | { type: 'ready'; at: number }
  | { type: 'failed'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'skip'; at: number };

/** Açılışta durum: azaltılmış harekette hemen statik logo oynar, yoksa kanat görselleri beklenir. */
export function initialSplash(reduced: boolean, now = 0): SplashState {
  return reduced ? { mode: 'reduced', phase: 'playing', since: now } : { mode: 'full', phase: 'static', since: now };
}

/** Oynatma süresi (leaving'e kadar). */
export const holdMs = (mode: SplashMode): number =>
  mode === 'full' ? timing.leaveAt : timing.reduced.fadeInMs + timing.reduced.holdMs;
export const fadeMs = (mode: SplashMode): number => (mode === 'full' ? timing.fadeMs : timing.reduced.fadeMs);

/** Bir sonraki kendiliğinden geçişin zamanı (yoksa null). */
export function nextDeadline(s: SplashState): number | null {
  switch (s.phase) {
    case 'static': return s.since + timing.assetTimeoutMs;
    case 'playing': return s.since + holdMs(s.mode);
    case 'leaving': return s.since + fadeMs(s.mode);
    default: return null;
  }
}

export function splashReducer(s: SplashState, e: SplashEvent): SplashState {
  if (s.phase === 'done') return s;
  switch (e.type) {
    case 'ready':
      return s.phase === 'static' ? { mode: 'full', phase: 'playing', since: e.at } : s;
    case 'failed':
      return s.phase === 'static' ? { mode: 'reduced', phase: 'playing', since: e.at } : s;
    case 'skip':
      return s.phase === 'leaving' ? s : { ...s, phase: 'leaving', since: e.at };
    case 'tick': {
      const d = nextDeadline(s);
      if (d === null || e.at < d) return s;
      if (s.phase === 'static') return { mode: 'reduced', phase: 'playing', since: e.at };
      if (s.phase === 'playing') return { ...s, phase: 'leaving', since: e.at };
      return { ...s, phase: 'done', since: e.at };
    }
  }
}

/** Açılış ekranı açık mı: `?acilis=0` ya da `rpg-battle-acilis` = off (tarayıcı denetim betikleri) kapatır. */
export function splashEnabled(search: string, get: (key: string) => string | null): boolean {
  if (new URLSearchParams(search).get('acilis') === '0') return false;
  try { return get('rpg-battle-acilis') !== 'off'; } catch { return true; }
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

/** Göz ışığının yeri (sahne yüzdesi). */
export const eyeStyle = (): Record<string, string> => ({ left: pct(acilis.eye.x), top: pct(acilis.eye.y) });
export const SPLASH_ASPECT = acilis.aspect;
export const layerFile = (id: LayerId): string => `logo/acilis-${id}.webp`;
export const FULL_LOGO = 'logo/logo-acilis.webp';

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const inline = (s: Record<string, string>) => Object.entries(s).map(([k, v]) => `${kebab(k)}:${v}`).join(';');

/**
 * İlk statik kare (index.html, JavaScript yüklenmeden): kömür zemin ve gövde katmanı. React'in ilk çizimi aynı
 * yapıyı kurar (`Splash`), görsel önbellekte olduğundan geçişte boşluk olmaz.
 */
export function splashStaticHtml(base: string, label: string): string {
  return `<div class="splash" role="img" aria-label="${label.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`
    + `<div class="splash-stage" style="--ar:${SPLASH_ASPECT}">`
    + `<img class="splash-layer splash-govde" src="${base}${layerFile('govde')}" alt="" style="${inline(layerStyle('govde'))}" fetchpriority="high" />`
    + `</div></div>`;
}
