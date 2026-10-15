/**
 * Harita efektlerinin çizimi (Adım 10c). Görselin dörtte biri çözünürlükte (320×179) bir tuval,
 * CSS ile büyütülür (piksel görünüm, ucuz). En çok 30 kare/sn; sekme gizliyken, "efektleri
 * kapat" seçiliyken veya sistemde "hareketi azalt" açıkken çizmez. Tuval harita görseliyle
 * altıgen/jeton katmanı arasındadır; dokunmaları engellemez.
 */
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_COLOR, IMAGE_H, IMAGE_W, effectHexes, effectPoints, type EffectType, type MapEffect,
} from '../map/effects';
import { hexCenter } from './mapView';

const W = 320;
const H = Math.round((W * IMAGE_H) / IMAGE_W);
const K = W / IMAGE_W;
const FRAME_MS = 1000 / 30;
const TAU = Math.PI * 2;

type Ctx = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
type Draw = (ctx: Ctx, t: number, dt: number) => void;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)] as T;

/** Işık lekesi (radyal geçiş). */
function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${a})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}

/** Ekrana yayılan parçacıklar: konum, hız ve faz. */
function swarm(n: number, init: () => { x: number; y: number; vx: number; vy: number; s: number }) {
  return Array.from({ length: n }, () => ({ ...init(), ph: Math.random() * TAU }));
}

function build(type: EffectType, I: number, c: string, anchors: Pt[]): { draw: Draw; additive?: boolean } {
  const spot = () => (anchors.length > 0 ? pick(anchors) : { x: rnd(0, W), y: rnd(0, H) });
  switch (type) {
    case 'rain': {
      const ps = swarm(Math.round(160 * I), () => ({ x: rnd(0, W), y: rnd(0, H), vx: 0, vy: rnd(150, 230), s: rnd(3, 6) }));
      return {
        draw: (ctx, _t, dt) => {
          ctx.strokeStyle = `rgba(${c},0.55)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (const p of ps) {
            p.y += p.vy * dt;
            p.x -= p.vy * 0.25 * dt;
            if (p.y > H + 6) { p.y = -6; p.x = rnd(0, W + 40); }
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.s * 0.25, p.y - p.s);
          }
          ctx.stroke();
        },
      };
    }
    case 'lightning': {
      let next = rnd(2, 6);
      let at = -10;
      return {
        draw: (ctx, t) => {
          if (t >= next) { at = t; next = t + rnd(4, 10) / (0.3 + I); }
          const d = t - at;
          const a = d < 0.08 ? 0.55 : d < 0.14 ? 0.1 : d < 0.24 ? 0.4 : d < 0.5 ? 0.4 * (1 - (d - 0.24) / 0.26) : 0;
          if (a > 0) { ctx.fillStyle = `rgba(${c},${a * I})`; ctx.fillRect(0, 0, W, H); }
        },
      };
    }
    case 'waveGlint':
    case 'waterSparkle':
    case 'iceGlint': {
      const per = type === 'waveGlint' ? 2 : 1 + Math.round(I);
      const pts = anchors.flatMap((a) => Array.from({ length: per }, () => ({ x: a.x + rnd(-7, 7), y: a.y + rnd(-5, 5), ph: rnd(0, TAU), sp: rnd(1.2, 2.6) })));
      return {
        additive: true,
        draw: (ctx, t) => {
          for (const p of pts) {
            const v = Math.sin(t * p.sp + p.ph);
            if (v < 0.55) continue;
            const a = ((v - 0.55) / 0.45) * (0.4 + 0.6 * I);
            ctx.fillStyle = `rgba(${c},${a})`;
            if (type === 'waveGlint') ctx.fillRect(Math.round(p.x + Math.sin(t * 0.7 + p.ph) * 2), Math.round(p.y), 3, 1);
            else {
              ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
              if (type === 'iceGlint' && v > 0.9) { ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); ctx.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); }
            }
          }
        },
      };
    }
    case 'fog': {
      const blobs = swarm(5 + Math.round(5 * I), () => ({ x: rnd(-40, W + 40), y: rnd(0, H), vx: rnd(2, 6), vy: 0, s: rnd(22, 48) }));
      return {
        draw: (ctx, _t, dt) => {
          for (const b of blobs) {
            b.x += b.vx * dt;
            if (b.x - b.s > W) b.x = -b.s;
            glow(ctx, b.x, b.y, b.s, c, 0.12 + 0.12 * I);
          }
        },
      };
    }
    case 'bubbles': {
      const bs = anchors.filter(() => Math.random() < 0.25 + 0.5 * I).map((a) => ({ x: a.x + rnd(-5, 5), y: a.y + rnd(-3, 4), ph: rnd(0, 1), sp: rnd(0.25, 0.6) }));
      return {
        draw: (ctx, t) => {
          for (const b of bs) {
            const p = (t * b.sp + b.ph) % 1;
            ctx.strokeStyle = `rgba(${c},${p > 0.88 ? 0.25 : 0.6})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(b.x, b.y - p * 3, p > 0.88 ? 2.2 : 0.6 + p * 1.2, 0, TAU);
            ctx.stroke();
          }
        },
      };
    }
    case 'fireflies': {
      const fs = Array.from({ length: Math.round(26 * I) }, () => ({ ...spot(), ph: rnd(0, TAU), a: rnd(0.6, 1.4), b: rnd(0.5, 1.2) }));
      return {
        additive: true,
        draw: (ctx, t) => {
          for (const f of fs) {
            const x = f.x + Math.sin(t * f.a + f.ph) * 9;
            const y = f.y + Math.cos(t * f.b + f.ph) * 6;
            const a = Math.max(0, Math.sin(t * 2.2 + f.ph));
            if (a <= 0.05) continue;
            glow(ctx, x, y, 3, c, 0.35 * a);
            ctx.fillStyle = `rgba(${c},${a})`;
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          }
        },
      };
    }
    case 'sparks': {
      const born = () => { const s = spot(); return { x: s.x + rnd(-6, 6), y: s.y + rnd(-3, 3), vx: rnd(-4, 4), vy: -rnd(8, 26), s: Math.random() < 0.25 ? 2 : 1 }; };
      const ps = swarm(Math.round(90 * I), born).map((p) => ({ ...p, y: p.y - rnd(0, 40) }));
      return {
        additive: true,
        draw: (ctx, t, dt) => {
          for (const p of ps) {
            p.x += (p.vx + Math.sin(t * 1.5 + p.ph) * 5) * dt;
            p.y += p.vy * dt;
            if (p.y < -4 || Math.random() < dt * 0.4) Object.assign(p, born());
            ctx.fillStyle = `rgba(${c},${0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 6 + p.ph))})`;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
          }
        },
      };
    }
    case 'snow':
    case 'leaves':
    case 'dust': {
      const n = Math.round((type === 'snow' ? 140 : type === 'leaves' ? 18 : 50) * I);
      const fall = type === 'snow' ? [6, 14] : type === 'leaves' ? [6, 12] : [-1.5, 1.5];
      const colors = type === 'leaves' ? [c, '196,138,48', '154,106,40'] : [c];
      const ps = swarm(n, () => ({ x: rnd(0, W), y: rnd(0, H), vx: type === 'dust' ? rnd(1.5, 5) : rnd(-1, 1), vy: rnd(fall[0] as number, fall[1] as number), s: Math.random() < 0.3 ? 2 : 1 }))
        .map((p) => ({ ...p, col: pick(colors) }));
      return {
        draw: (ctx, t, dt) => {
          for (const p of ps) {
            p.x += (p.vx + Math.sin(t * (type === 'leaves' ? 1.6 : 0.9) + p.ph) * (type === 'dust' ? 2 : 5)) * dt;
            p.y += p.vy * dt;
            if (p.y > H + 3) p.y = -3;
            if (p.y < -3) p.y = H + 3;
            if (p.x > W + 3) p.x = -3;
            if (p.x < -3) p.x = W + 3;
            const a = type === 'dust' ? 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3 + p.ph)) : type === 'snow' ? 0.85 : 0.9;
            ctx.fillStyle = `rgba(${p.col},${a})`;
            if (type === 'leaves') {
              const flat = Math.sin(t * 3 + p.ph) > 0;
              ctx.fillRect(Math.round(p.x), Math.round(p.y), flat ? 2 : 1, flat ? 1 : 2);
            } else ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
          }
        },
      };
    }
    case 'lightShafts': {
      const shafts = Array.from({ length: 4 }, (_, i) => ({ x: (W / 4) * i + rnd(0, 40), w: rnd(14, 28), ph: rnd(0, TAU) }));
      return {
        additive: true,
        draw: (ctx, t) => {
          for (const s of shafts) {
            const x = s.x + Math.sin(t * 0.15 + s.ph) * 10;
            const a = (0.05 + 0.04 * Math.sin(t * 0.4 + s.ph)) * (0.5 + I);
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, `rgba(${c},${a})`);
            g.addColorStop(1, `rgba(${c},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + s.w, 0);
            ctx.lineTo(x + s.w - 70, H);
            ctx.lineTo(x - 70, H);
            ctx.fill();
          }
        },
      };
    }
    case 'flicker':
    case 'crystalFlicker':
    case 'lavaGlow': {
      const spots = anchors.map((a) => ({ ...a, ph: rnd(0, TAU) }));
      const radius = type === 'flicker' ? 16 : type === 'crystalFlicker' ? 12 : 13;
      return {
        additive: true,
        draw: (ctx, t) => {
          for (const s of spots) {
            const n = type === 'flicker'
              ? 0.6 * Math.sin(t * 9 + s.ph) + 0.3 * Math.sin(t * 23 + s.ph * 2) + 0.1 * Math.sin(t * 41)
              : Math.sin(t * (type === 'lavaGlow' ? 1.3 : 0.8) + s.ph);
            const a = (type === 'flicker' ? 0.26 : 0.18) * (0.75 + 0.25 * n) * (0.4 + I);
            glow(ctx, s.x, s.y, radius * (0.9 + 0.08 * n) * (0.8 + 0.4 * I), c, a);
            if (type === 'flicker') { ctx.fillStyle = `rgba(255,240,200,${0.5 + 0.3 * n})`; ctx.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 2); }
          }
        },
      };
    }
    case 'drip': {
      const ds = Array.from({ length: Math.max(1, Math.round(12 * I)) }, () => ({ ...spot(), ph: rnd(0, 1), sp: rnd(0.3, 0.7) }));
      return {
        draw: (ctx, t) => {
          for (const d of ds) {
            const p = (t * d.sp + d.ph) % 1;
            if (p < 0.55) continue; // damla birikiyor
            const f = (p - 0.55) / 0.35;
            ctx.fillStyle = `rgba(${c},0.8)`;
            if (f <= 1) ctx.fillRect(Math.round(d.x), Math.round(d.y - 8 + f * 10), 1, 2);
            else { ctx.fillStyle = `rgba(${c},0.5)`; ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y + 2), 3, 1); }
          }
        },
      };
    }
    case 'heatHaze': {
      return {
        additive: true,
        draw: (ctx, t) => {
          ctx.strokeStyle = `rgba(${c},${0.05 + 0.05 * I})`;
          ctx.lineWidth = 1;
          for (let i = 0; i < 8; i++) {
            const y0 = (H - ((t * 6 + i * (H / 8)) % H));
            ctx.beginPath();
            for (let x = 0; x <= W; x += 8) {
              const y = y0 + Math.sin(x * 0.05 + t * 2 + i) * 2;
              if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        },
      };
    }
    case 'sandstorm': {
      const ps = swarm(Math.round(320 * I), () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(0.6, 1.5), vy: rnd(0.08, 0.18), s: Math.random() < 0.35 ? Math.round(rnd(5, 16)) : 1 }));
      return {
        draw: (ctx, t, dt) => {
          const gust = Math.min(1, Math.max(0.1, 0.55 + 0.8 * Math.sin(t * 0.45) * Math.sin(t * 0.17 + 1.3)));
          ctx.fillStyle = `rgba(${c},${(0.06 + 0.14 * gust) * I})`;
          ctx.fillRect(0, 0, W, H);
          for (const p of ps) {
            const v = 280 * p.vx * (0.35 + 0.9 * gust);
            p.x += v * dt;
            p.y += v * p.vy * dt + Math.sin(t * 3 + p.ph) * 6 * dt;
            if (p.x > W + 16) { p.x = -16; p.y = rnd(0, H); }
            if (p.y > H + 2) p.y = -2;
            ctx.fillStyle = `rgba(${c},${0.25 + 0.4 * gust})`;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, 1);
          }
        },
      };
    }
  }
}

/** Efekt tercihi (bu cihazda hatırlanır); "hareketi azalt" açıksa varsayılan kapalı. */
export function useEffectsSetting(): [boolean, (on: boolean) => void] {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [on, setOn] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('rpg-battle-effects');
      return v === null ? !reduce : v === 'on';
    } catch {
      return !reduce;
    }
  });
  const set = (v: boolean) => {
    setOn(v);
    try { localStorage.setItem('rpg-battle-effects', v ? 'on' : 'off'); } catch { /* yalnızca bu oturumda */ }
  };
  return [on, set];
}

export function EffectsLayer(props: { effects: MapEffect[]; tiles: string[]; mirrored: boolean; enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { effects, tiles, mirrored, enabled } = props;
  const tilesKey = tiles.join('');
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!enabled || effects.length === 0) return;
    const layers = effects.map((e) => {
      const points = effectPoints(e, mirrored).map((p) => ({ x: p.x * K, y: p.y * K }));
      const anchors = points.length > 0 ? points : effectHexes(e.type, tiles).map((h) => {
        const c = hexCenter(h);
        return { x: c.x * K, y: c.y * K };
      });
      return build(e.type, e.intensity, rgb(e.color ?? DEFAULT_COLOR[e.type]), anchors);
    });
    let raf = 0;
    let last = 0;
    let t = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < FRAME_MS) return;
      const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, W, H);
      for (const l of layers) {
        ctx.globalCompositeOperation = l.additive ? 'lighter' : 'source-over';
        l.draw(ctx, t, dt);
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // Döşemeler (lav yükselmesi) değişince yeniden kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effects, tilesKey, mirrored, enabled]);
  return <canvas ref={ref} className="fx-layer" width={W} height={H} aria-hidden="true" />;
}
