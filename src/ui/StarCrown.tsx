/**
 * KQ6-19: yıldız tacı çizimi (alternatif C, 1,6× büyük; docs/sabah/hale-alternatif.png). Yerel koordinat: orijin başın/şapkanın üst orta noktası, y yukarı eksi,
 * birim = jeton 256 px uzayı pikseli. Merkez yıldız büyük, yanlarda küçükleri, ince ışık çizgileri; 96 px kopyada bile yıldızlar ≥ 3 px. Hafif yanıp sönme CSS ile
 * (`.sc-a/.sc-b`), hareketi azalt açıkken statik. Rozet (HTML `<svg>`) ve savaş jetonu (SVG `<g>`) aynı bileşeni kullanır.
 */
import type { CSSProperties } from 'react';
import { CROWN_K, type CrownSpec } from './haloCrown';

const GOLD = '#F5D76E', LIGHT = '#FFF4B8';
/** Sparkle: yatay + dikey ince çizgi ve yarı uzunlukta soluk çapraz çizgiler (docs/sabah/hale-alternatif.png C). */
function Sparkle({ x, y, r, c, col }: { x: number; y: number; r: number; c: 'sc-a' | 'sc-b' | 'sc-c'; col: string }) {
  const h = r / 2;
  return (
    <g className={`sc-star ${c}`} transform={`translate(${x} ${y})`} stroke={col} strokeLinecap="round" fill="none">
      <path d={`M${-r},0 H${r} M0,${-r} V${r}`} strokeWidth={1.1} />
      <path d={`M${-h},${-h} L${h},${h} M${-h},${h} L${h},${-h}`} strokeWidth={0.9} opacity={0.67} />
    </g>
  );
}

/**
 * Tek yerde çizilen taç gövdesi (yerel koordinat; orijin başın/şapkanın üst orta noktası, y yukarı eksi, 256 px jeton uzayı × `data/hale-konum.json`
 * `tac.katsayi`). Alternatif C: tabanı başa değen üç ince ışık çizgisi yukarı yükselir, üstünde büyük sparkle, yanlarda iki küçük çift.
 */
export function StarCrownShape() {
  return (
    <g className="star-crown-body" transform={`scale(${CROWN_K})`}>
      {[[-5, -10], [0, -14], [5, -10]].map(([x, top]) => <line key={x} x1={x} y1={0} x2={x} y2={top} stroke={GOLD} strokeWidth={1.1} opacity={0.62} strokeLinecap="round" />)}
      <Sparkle x={0} y={-12} r={6} c="sc-a" col={LIGHT} />
      <Sparkle x={-10} y={-9} r={3} c="sc-b" col={GOLD} /><Sparkle x={10} y={-9} r={3} c="sc-c" col={GOLD} />
      <Sparkle x={-19} y={-5} r={2} c="sc-c" col={GOLD} /><Sparkle x={19} y={-5} r={2} c="sc-b" col={GOLD} />
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
