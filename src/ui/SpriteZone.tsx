/**
 * Kuyruk 15 K15C, Kuyruk 16 K16A: sprite'lı alan çizimi. Taban: kapsanan altıgenlerin birleşimi baskın renkte, yumuşak kenarlı
 * (bulanık); üstte altıgenden %40–80 büyük, örtüşen yamalar (varyant, dönüş, ayna hash'ten). Sınırda sert kesim yok:
 * kenar altıgenlerinin yaması (komşusu alanda olmayan) daha küçük ve yarı saydam, taban bulanık söner. Maske
 * denendi, animasyonla her tıkta yeniden hesaplandığı için kare süresini ≈2,4 katına çıkarıyordu (DECISIONS.md). Animasyon yalnızca CSS (görsel; motor, replay, kayıt yok).
 */
import { useId, useMemo, type CSSProperties } from 'react';
import { neighbors, type Offset } from '../rules/hex';
import { SURFACE_ANIM, priorityOf, surfaceOwners, type ZoneLook, type ZonePatch } from './sprites';

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

interface Owned { item: SurfaceItem; hexes: Offset[] }

/** Altıgenlerin birleşimi tek yol (dikiş yok): her altıgen kapalı bir alt yol; dolgu `nonzero`. */
export function hexUnionPath(hexes: readonly Offset[], hexPoints: LayerProps['hexPoints']): string {
  return hexes.map((h) => `M${corners(hexPoints(h, 1)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`).join('');
}

/**
 * Yalnız DIŞ sınırın çizgisi: komşusu aynı alanda olmayan kenarlar (komşu aynı tür birleşiktir, aradaki çizgi yok).
 * Çizgi kırpma yolunun içinde kalır (kenarda yarı kalınlık görünür), taşma olmaz.
 */
export function outerEdgePath(hexes: readonly Offset[], ownerOf: Map<string, string>, id: string, hexPoints: LayerProps['hexPoints'], hexCenter: LayerProps['hexCenter'], hexW: number): string {
  let d = '';
  for (const h of hexes) {
    const c = hexCenter(h);
    const cs = corners(hexPoints(h, 1));
    const ns = neighbors(h).map((n) => ({ n, p: hexCenter(n) }));
    cs.forEach((a, i) => {
      const b = cs[(i + 1) % cs.length]!;
      const mid = { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
      const across = { x: 2 * mid.x - c.x, y: 2 * mid.y - c.y };
      const nb = ns.reduce((best, q) => (Math.hypot(q.p.x - across.x, q.p.y - across.y) < Math.hypot(best.p.x - across.x, best.p.y - across.y) ? q : best), ns[0]!);
      const outside = !nb || Math.hypot(nb.p.x - across.x, nb.p.y - across.y) > hexW * 0.3 || ownerOf.get(keyOf(nb.n)) !== id;
      if (outside) d += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    });
  }
  return d;
}

/**
 * Kuyruk KQ5 YZ1: bütün yüzeyler tek katmanda, tür başına tek tutarlı görünüm (`data/yuzey-gorunum.json`). Her alan kendi
 * altıgenlerinin birleşimine KIRPILIR (taşma yok; eski tuval hale/bulanıklık kalktı): yarı saydam düz dolgu, dış sınırda ince
 * kenar çizgisi, mevcut sprite yalnız doku olarak düşük opaklıkta içeride (sprite yoksa düz dolgu yedeği). Her altıgen yalnızca en
 * yüksek öncelikli türe ait (`surfaceOwners`). Animasyon CSS, adımlı (ortak TICK_MS); `animate` kapalıyken statik.
 */
export function SurfaceLayer({ items, visible, animate, hexW, base, hexPoints, hexCenter }: LayerProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
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
  return (
    <g className="sprite-layer surface-layer" aria-hidden="true">
      {owned.map((o, i) => {
        const look = o.item.look;
        const st = look.style;
        const clipId = `sz${uid}-${i}`;
        const shape = hexUnionPath(o.hexes, hexPoints);
        const edge = outerEdgePath(o.hexes, ownerOf, o.item.id, hexPoints, hexCenter, hexW);
        const w = hexW * look.scale;
        const mine = new Set(o.hexes.map(keyOf));
        const patches = st.dokuOpak > 0 ? look.patches.filter((p) => mine.has(keyOf(p.hex)) && (!visible || visible.has(keyOf(p.hex)))) : [];
        const anim = animate && st.anim !== 'yok' ? ` anim-${st.anim}` : '';
        const lo = st.anim === 'titrek' ? SURFACE_ANIM.titrekDusuk : SURFACE_ANIM.nabizDusuk;
        return (
          <g key={o.item.id} className={`surface-zone kind-${look.kind}`} data-zone={o.item.id} data-clipped="true" style={{ mixBlendMode: st.karisim as CSSProperties['mixBlendMode'] }}>
            <clipPath id={clipId}><path d={shape} /></clipPath>
            <g clipPath={`url(#${clipId})`}>
              <path d={shape} fill={st.renk} fillOpacity={st.dolguOpak} className={`surface-fill${anim}`}
                style={{ ['--surf-lo' as string]: lo, animationDuration: `${SURFACE_ANIM.sureTik * TICK_MS}ms` }} />
              {patches.length > 0 && (
                <g className={`sprite-zone${look.soft ? ' soft' : ''} kind-${look.kind}`} opacity={st.dokuOpak}>
                  {patches.map((p) => <Patch key={keyOf(p.hex)} p={p} w={w} hexW={hexW} base={base} animate={animate} c={hexCenter(p.hex)} edge="none" />)}
                </g>
              )}
              {edge && <path d={edge} fill="none" stroke={st.kenar} strokeOpacity={st.kenarOpak} strokeWidth={st.kenarKalinlik * 2} strokeLinecap="round" className="surface-edge" />}
            </g>
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
