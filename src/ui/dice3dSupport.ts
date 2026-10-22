/**
 * 3D zar animasyonu ne zaman kullanılır (Görev J3): yalnızca "Normal" hızda, hareket azaltma kapalıyken, WebGL
 * varken ve cihaz yeterliyse (bellek ≥ 4 GB, en az 4 çekirdek; bilinmiyorsa yeterli sayılır). Atış sırasında kare
 * hızı art arda iki atışta düşük ölçülürse (`reportDice3dFps`) bu oturumda 2D'ye dönülür. three.js bu modülde yüklenmez.
 */
import type { DiceAnimSpeed } from './diceAnim';

const KEY = 'rpg-battle-dice3d-slow';
let slow = false;
let webgl: boolean | null = null;

function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}

/** Cihaz yeterli mi (navigator.deviceMemory / hardwareConcurrency; tarayıcı vermiyorsa yeterli). */
export function deviceCapable(nav: { deviceMemory?: number; hardwareConcurrency?: number } = typeof navigator === 'undefined' ? {} : navigator as never): boolean {
  return (nav.deviceMemory ?? 8) >= 4 && (nav.hardwareConcurrency ?? 8) >= 4;
}

export function isDice3dSlow(): boolean {
  if (slow) return true;
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** Bir atışın ortalama kare hızı; art arda iki atış 24 kare/sn altındaysa cihaz yavaş sayılır (tek takılma yetmez). */
export const SLOW_FPS = 24;
let slowStreak = 0;
export function reportDice3dFps(fps: number): void {
  slowStreak = fps < SLOW_FPS ? slowStreak + 1 : 0;
  if (slowStreak >= 2) markDice3dSlow();
}

/** Kare hızı düşük ölçüldü: bu oturumda 2D. */
export function markDice3dSlow(): void {
  slow = true;
  try { sessionStorage.setItem(KEY, '1'); } catch { /* yalnızca bellekte */ }
}

export function dice3dAllowed(speed: DiceAnimSpeed, reducedMotion: boolean): boolean {
  if (speed !== 'normal' || reducedMotion || typeof document === 'undefined') return false;
  return !isDice3dSlow() && deviceCapable() && hasWebGL();
}
