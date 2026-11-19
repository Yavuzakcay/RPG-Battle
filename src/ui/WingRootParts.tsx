/**
 * Gövdeye bağlı kanat (kullanıcı kararı 2026-11-20; yalnız görünüm): iki kanatlı taban görselin sağ yarısı kökünden (`wingRootLayout`)
 * yerleşir ve dışa/yukarı döner; sol kanat jeton merkezi çevresinde aynası. Jetonun (figürün) arkasında çizilir; rozette zemin
 * dairesinin önünde (`LookFrame`), savaş jetonunda daire yok (`TokenFigure`). Renk soy paletiyle (SVG filtresi `WingFilterDefs`).
 */
import { useId } from 'react';
import { WingFilterDefs } from './WingFilter';
import { wingFilterId, wingRootLayout, type WingLayerSpec } from './lineageLook';

export function WingRootParts(props: { wing: WingLayerSpec; href: string; cx: number; cy: number; w: number; tokenSrc?: string }) {
  const { wing, cx } = props;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!wing.kok) return null;
  const L = wingRootLayout(wing.kok, wing.enBoy, cx, props.cy, props.w, props.tokenSrc);
  const filter = wing.palet ? `url(#${wingFilterId(wing.palet)})` : wing.filtre || undefined;
  const clip = `wr-${uid}`;
  const one = (
    <g transform={`rotate(${L.angle} ${L.rootX} ${L.rootY})`}>
      <image href={props.href} x={L.x} y={L.y} width={L.width} height={L.height} preserveAspectRatio="none" clipPath={`url(#${clip})`} />
    </g>
  );
  return (
    <g className="look-wing-kok" data-wing={wing.id} style={filter ? { filter } : undefined}>
      {wing.palet && <WingFilterDefs palet={wing.palet} />}
      <defs><clipPath id={clip}><rect x={L.x + L.width / 2} y={L.y} width={L.width / 2} height={L.height} /></clipPath></defs>
      {one}
      <g transform={`translate(${2 * cx} 0) scale(-1 1)`}>{one}</g>
    </g>
  );
}
