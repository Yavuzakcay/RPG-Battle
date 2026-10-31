/**
 * Kuyruk 15 K15C, Kuyruk 16 K16A: sprite'lı alan çizimi. Taban: kapsanan altıgenlerin birleşimi baskın renkte, yumuşak kenarlı
 * (bulanık); üstte altıgenden %40–80 büyük, örtüşen yamalar (varyant, dönüş, ayna hash'ten). Sınırda sert kesim yok:
 * kenar altıgenlerinin yaması (komşusu alanda olmayan) daha küçük ve yarı saydam, taban bulanık söner. Maske
 * denendi, animasyonla her tıkta yeniden hesaplandığı için kare süresini ≈2,4 katına çıkarıyordu (DECISIONS.md). Animasyon yalnızca CSS (görsel; motor, replay, kayıt yok).
 */
import { useMemo, type CSSProperties } from 'react';
import { neighbors, type Offset } from '../rules/hex';
import { priorityOf, surfaceOwners, type ZoneLook, type ZonePatch } from './sprites';

/**
 * Ortak tık (1/6 sn): bütün yüzey animasyonları adımlı ve adımları aynı anlara hizalı (faz tık katı). Böylece harita
 * saniyede ≈6 kez yeniden çizilir, her karede değil (maske ve bulanıklık pahalı; piksel sanatına adımlı hareket uyar).
 */
export const TICK_MS = 1000 / 6;
/** Animasyon süreleri tık sayısıyla (CSS'teki süre ve steps() bunlarla aynı): kayma 9 sn, alev karesi 1 tık, parlama ≈4,2 sn, yükselme 1,5 sn. */
const TICKS: Record<string, number> = { drift: 54, flicker: 1, flick: 7, shimmer: 25, rise: 9 };

const keyOf = (h: Offset) => `${h.col},${h.row}`;
/** Kenar yaması (komşusu boş zemin): boyu ×0,82, saydamlık 0,6. Komşusu başka tür: yama altıgen eninde, taşmaz. */
const EDGE_SCALE = 0.82;
const EDGE_OPACITY = 0.6;
type EdgeKind = 'none' | 'empty' | 'other';

function Patch({ p, w, hexW, base, animate, c, edge }: { p: ZonePatch; w: number; hexW: number; base: string; animate: boolean; c: { x: number; y: number }; edge: EdgeKind }) {
  const href = (n: string) => `${base}sprites/${n}.webp`;
  const img = (n: string, extra?: { className?: string; style?: CSSProperties; opacity?: number }) => (
    <image key={`${n}${extra?.className ?? ''}`} href={href(n)} x={-w / 2} y={-w / 2} width={w} height={w} className={`sprite${extra?.className ? ` ${extra.className}` : ''}`}
      style={extra?.style} opacity={extra?.opacity} />
  );
  // Faz tık katına yuvarlanır: farklı altıgenlerin adımları aynı anda değişir.
  const delay = (ticks: number, shift = 0): CSSProperties => ({ animationDelay: `${-Math.round(((p.phase + shift) % 1) * ticks) * TICK_MS}ms` });
  const anim = animate ? p.anim : 'none';
  let body;
  if (anim === 'drift') {
    // İki kopya zıt yönlere kayar; boy ve saydamlık "nefes alır"; ikinci kopya aynalı.
    // Kuyruk 16 K16A: ikinci (aynalı, zıt kayan) kopya altıgenlerin yarısında (faz < 0,5); yamalar örtüştüğü için zıt
    // kayma her yerde görünür, çizilen görsel sayısı ≈%25 azalır (48×28 ölçümü, DECISIONS.md).
    body = <>{img(p.name, { className: 'drift-a', style: delay(TICKS.drift!) })}{p.phase < 0.5 && img(p.name, { className: 'drift-b', style: delay(TICKS.drift!, 0.5), opacity: 0.6 })}</>;
  } else if (anim === 'flicker') {
    const n = p.cycle.length;
    body = (
      <g className="flick" style={delay(TICKS.flick!)}>
        {n > 1 ? p.cycle.map((name, i) => img(name, { className: `cyc cyc${n}`, style: { animationDelay: `${(i - Math.round(p.phase * n)) * TICK_MS}ms` } })) : img(p.name)}
      </g>
    );
  } else if (anim === 'rise') {
    body = <>{img(p.name, { className: 'rise', style: delay(TICKS.rise!) })}{img(p.name, { className: 'rise', style: delay(TICKS.rise!, 0.5) })}</>;
  } else if (anim === 'shimmer') {
    body = img(p.name, { className: 'shimmer', style: delay(TICKS.shimmer!) });
  } else body = img(p.name);
  const k = edge === 'other' ? Math.min(1, (hexW * 0.95) / w) : edge === 'empty' ? EDGE_SCALE : 1;
  return <g transform={`translate(${c.x} ${c.y}) rotate(${p.rot}) scale(${(p.flip ? -1 : 1) * k} ${k})`} opacity={edge === 'empty' ? EDGE_OPACITY : undefined}>{body}</g>;
}

export interface SurfaceItem { id: string; look: ZoneLook; hexes: readonly Offset[] }

interface LayerProps {
  items: readonly SurfaceItem[];
  /** Yalnızca bunlar için yama (geniş haritada görünen altıgenler); yoksa hepsi. */
  visible?: ReadonlySet<string> | null;
  animate: boolean;
  hexW: number;
  base: string;
  hexPoints: (h: Offset, scale?: number) => string;
  hexCenter: (h: Offset) => { x: number; y: number };
}

const corners = (pts: string): Array<[number, number]> => pts.trim().split(/\s+/).map((p) => p.split(',').map(Number) as [number, number]);

/** Tuval kullanılamıyorsa (test ortamı, eski tarayıcı) null: taban SVG çokgenleriyle çizilir (kenar geçişi yok). */
function canvasOk(): boolean {
  if (typeof document === 'undefined' || typeof navigator === 'undefined' || /jsdom/i.test(navigator.userAgent)) return false;
  return true;
}

interface Owned { item: SurfaceItem; hexes: Offset[] }

/**
 * Taban katmanı tuvalde bir kez çizilir (yalnızca yüzeyler değişince; imza değişmedikçe önbellekten). Sıra: (1) bütün
 * türlerin dışa taşan yumuşak halesi (sınırın 0,1–0,25 altıgen dışına, bulanık), (2) her türün sahip olduğu altıgenlerin
 * birleşimi tek yol olarak (dikiş yok; sıvı/katıda tam opak), (3) sıvı/katıda sınırın hemen içinde 1 px kenar çizgisi.
 * Hale en altta: komşu türün dolgusu onu örter, türler birbirine binmez.
 */
function drawBase(owned: readonly Owned[], ownerOf: Map<string, string>, hexPoints: LayerProps['hexPoints'], hexCenter: LayerProps['hexCenter'], hexW: number): { href: string; x: number; y: number; w: number; h: number } | null {
  if (!canvasOk()) return null;
  const all = owned.flatMap((o) => o.hexes.map((h) => corners(hexPoints(h, 1))));
  if (!all.length) return null;
  const pad = hexW * 0.35;
  const xs = all.flat().map((c) => c[0]); const ys = all.flat().map((c) => c[1]);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const W = Math.max(...xs) + pad - x0, H = Math.max(...ys) + pad - y0;
  const k = Math.min(1, 2048 / Math.max(W, H));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(W * k); cv.height = Math.ceil(H * k);
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
  const path = (hexes: readonly Offset[], scale: number) => {
    ctx.beginPath();
    for (const h of hexes) {
      const cs = corners(hexPoints(h, scale));
      cs.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    }
  };
  const isEdge = (o: Owned, h: Offset) => neighbors(h).some((n) => ownerOf.get(keyOf(n)) !== o.item.id);
  // 1) Hale: sınır altıgenleri büyütülmüş ve bulanık, düşük opaklıkta.
  const blur = 'filter' in ctx;
  for (const o of owned) {
    const edge = o.hexes.filter((h) => isEdge(o, h));
    if (!edge.length) continue;
    ctx.fillStyle = o.item.look.color;
    if (blur) ctx.filter = `blur(${Math.max(1, hexW * 0.05 * k)}px)`;
    ctx.globalAlpha = o.item.look.baseAlpha * 0.45; path(edge, 1.25); ctx.fill();
    ctx.globalAlpha = o.item.look.baseAlpha * 0.6; path(edge, 1.12); ctx.fill();
    if (blur) ctx.filter = 'none';
  }
  // 2) Dolgu: tek yol (birleşim), dikişsiz.
  for (const o of owned) {
    ctx.globalAlpha = o.item.look.baseAlpha;
    ctx.fillStyle = o.item.look.color;
    path(o.hexes, 1.0); ctx.fill();
  }
  // 3) İç kenar çizgisi: komşusu başka sahipte olan kenar, merkeze doğru 1 px içeride.
  ctx.globalAlpha = 0.9; ctx.lineWidth = 1.2 / k > 2 ? 2 : 1.2;
  for (const o of owned) {
    const line = o.item.look.solid ? o.item.look.edgeLine : null;
    if (!line) continue;
    ctx.strokeStyle = line;
    ctx.beginPath();
    for (const h of o.hexes) {
      const c = hexCenter(h);
      const cs = corners(hexPoints(h, 1));
      const ns = neighbors(h).map((n) => ({ n, p: hexCenter(n) }));
      cs.forEach((a, i) => {
        const b = cs[(i + 1) % cs.length]!;
        const mid = { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
        const across = { x: 2 * mid.x - c.x, y: 2 * mid.y - c.y };
        const nb = ns.reduce((best, q) => (Math.hypot(q.p.x - across.x, q.p.y - across.y) < Math.hypot(best.p.x - across.x, best.p.y - across.y) ? q : best), ns[0]!);
        const outside = !nb || Math.hypot(nb.p.x - across.x, nb.p.y - across.y) > hexW * 0.3 || ownerOf.get(keyOf(nb.n)) !== o.item.id;
        if (!outside) return;
        const inset = (pt: [number, number]): [number, number] => {
          const d = Math.hypot(pt[0] - c.x, pt[1] - c.y) || 1;
          return [pt[0] + (c.x - pt[0]) * (1.5 / d), pt[1] + (c.y - pt[1]) * (1.5 / d)];
        };
        const [ax, ay] = inset(a); const [bx, by] = inset(b);
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      });
    }
    ctx.stroke();
  }
  return { href: cv.toDataURL('image/png'), x: x0, y: y0, w: W, h: H };
}

/**
 * Kuyruk 16 K16A: bütün sprite'lı alanlar tek katmanda. Her altıgen yalnızca en yüksek öncelikli türe ait
 * (`surfaceOwners`); düşük öncelikli türün yaması o altıgene girmez. Taban önbellekli tuval (yalnızca yüzey değişince
 * yeniden üretilir); animasyon yalnızca yama katmanında (CSS, ortak 1/6 sn tık). Sıra: düşük öncelik altta.
 */
export function SurfaceLayer({ items, visible, animate, hexW, base, hexPoints, hexCenter }: LayerProps) {
  const sig = items.map((it) => `${it.id}:${it.look.kind}:${it.hexes.map(keyOf).join(';')}`).join('|');
  const { owned, ownerOf } = useMemo(() => {
    const ownerOf = surfaceOwners(items.map((it) => ({ id: it.id, kind: it.look.kind, hexes: it.hexes })));
    const owned: Owned[] = [...items]
      .sort((a, b) => priorityOf(b.look.kind) - priorityOf(a.look.kind))
      .map((item) => ({ item, hexes: item.hexes.filter((h) => ownerOf.get(keyOf(h)) === item.id) }))
      .filter((o) => o.hexes.length);
    return { owned, ownerOf };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  const img = useMemo(() => drawBase(owned, ownerOf, hexPoints, hexCenter, hexW), [owned, ownerOf, hexPoints, hexCenter, hexW]);
  const edgeOf = (o: Owned, h: Offset): EdgeKind => {
    let kind: EdgeKind = 'none';
    for (const n of neighbors(h)) {
      const who = ownerOf.get(keyOf(n));
      if (who === o.item.id) continue;
      if (who) return 'other';
      kind = 'empty';
    }
    return kind;
  };
  return (
    <g className="sprite-layer" aria-hidden="true">
      {img
        ? <image href={img.href} x={img.x} y={img.y} width={img.w} height={img.h} preserveAspectRatio="none" className="surface-base" />
        : owned.map((o) => (
          <g key={`b${o.item.id}`} fill={o.item.look.color} opacity={o.item.look.baseAlpha}>
            {o.hexes.map((h) => <polygon key={keyOf(h)} points={hexPoints(h, 1.0)} />)}
          </g>
        ))}
      {owned.map((o) => {
        const w = hexW * o.item.look.scale;
        const mine = new Set(o.hexes.map(keyOf));
        const patches = o.item.look.patches.filter((p) => mine.has(keyOf(p.hex)) && (!visible || visible.has(keyOf(p.hex))));
        return (
          <g key={o.item.id} className={`sprite-zone${o.item.look.soft ? ' soft' : ''} kind-${o.item.look.kind}`} data-zone={o.item.id} opacity={o.item.look.opacity}>
            {patches.map((p) => <Patch key={keyOf(p.hex)} p={p} w={w} hexW={hexW} base={base} animate={animate} c={hexCenter(p.hex)} edge={edgeOf(o, p.hex)} />)}
          </g>
        );
      })}
    </g>
  );
}

/** Tek seferlik patlama: 0,3 → 1,2 ölçek, sönerek (`ms`). */
export function SpriteBurst({ at, name, w, ms, base, hexCenter }: { at: Offset; name: string; w: number; ms: number; base: string; hexCenter: (h: Offset) => { x: number; y: number } }) {
  const c = hexCenter(at);
  return (
    <g transform={`translate(${c.x} ${c.y})`} className="sprite-burst-wrap" aria-hidden="true">
      <image href={`${base}sprites/${name}.webp`} x={-w / 2} y={-w / 2} width={w} height={w} className="sprite sprite-burst" style={{ animationDuration: `${ms}ms` }} />
    </g>
  );
}
