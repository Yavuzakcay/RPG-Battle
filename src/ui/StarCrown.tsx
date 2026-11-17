/**
 * KQ6-19: yıldız tacı çizimi (alternatif C, 1,6× büyük; docs/sabah/hale-alternatif.png). Yerel koordinat: orijin başın/şapkanın üst orta noktası, y yukarı eksi,
 * birim = jeton 256 px uzayı pikseli. Merkez yıldız büyük, yanlarda küçükleri, ince ışık çizgileri; 96 px kopyada bile yıldızlar ≥ 3 px. Hafif yanıp sönme CSS ile
 * (`.sc-a/.sc-b`), hareketi azalt açıkken statik. Rozet (HTML `<svg>`) ve savaş jetonu (SVG `<g>`) aynı bileşeni kullanır.
 */
import type { CSSProperties } from 'react';
import type { CrownSpec } from './haloCrown';

const GOLD = '#F5D76E', LIGHT = '#FFF4B8', DEEP = '#E0B94A';
const star = (r: number): string => { const w = r * 0.3; return `M0,${-r} L${w},${-w} L${r},0 L${w},${w} L0,${r} L${-w},${w} L${-r},0 L${-w},${-w} Z`; };
const STARS: Array<{ x: number; y: number; r: number; c: 'sc-a' | 'sc-b' | 'sc-c' }> = [
  { x: 0, y: -34, r: 15, c: 'sc-a' }, { x: -22, y: -24, r: 7, c: 'sc-b' }, { x: 22, y: -24, r: 7, c: 'sc-c' }, { x: -39, y: -14, r: 5, c: 'sc-c' }, { x: 39, y: -14, r: 5, c: 'sc-b' },
];

/** Tek yerde çizilen taç gövdesi (yerel koordinat). */
export function StarCrownShape() {
  return (
    <g className="star-crown-body" shapeRendering="crispEdges">
      {[-9, 0, 9].map((x) => <line key={x} x1={x} y1={-4} x2={x} y2={x === 0 ? -17 : -12} stroke={GOLD} strokeWidth={2} opacity={0.55} />)}
      {STARS.map((s, i) => (
        <g key={i} className={`sc-star ${s.c}`} transform={`translate(${s.x} ${s.y})`}>
          <path d={star(s.r)} fill={GOLD} stroke={DEEP} strokeWidth={0.8} />
          <path d={star(s.r * 0.5)} fill={LIGHT} />
        </g>
      ))}
    </g>
  );
}

/** Rozet için: jeton kutusunu (256 uzayı) kaplayan, tıklanmaz SVG katmanı. */
export function StarCrownLayer({ crown }: { crown: CrownSpec }) {
  const style = { '--crown-x': crown.x } as CSSProperties;
  return (
    <svg className="star-crown" viewBox="0 0 256 256" aria-hidden="true" style={style}>
      <g transform={`translate(${crown.x} ${crown.y}) scale(${crown.olcek})`}><StarCrownShape /></g>
    </svg>
  );
}
