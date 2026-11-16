/**
 * Kuyruk AS1a/AS1c: alt soy görünüm çerçevesi (yalnızca görsel; rozetler: oluşturucu, karakter kartı, tur şeridi). Çocuğu
 * (AvatarBadge) sarar: filtre ve en-boy CSS değişkeniyle görsele, Celestial hale gizleme üst bant kırpmasıyla, kanat katmanı
 * jetonun arkasına (yalnız `flying` iken açık sprite; sprite dosyası tanımlı değilse katman yok). Savaş jetonu (SVG) aynı çözücüyü
 * `Avatar.tsx` içinde kullanır.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { WingFilterDefs } from './WingFilter';
import { FOOT_FRAC, lineageLook, wingBox, wingFilterId, type LookSheet, type WingLayerSpec } from './lineageLook';

const BASE = import.meta.env.BASE_URL;

/** Kanat katmanı (rozet): sprite yüklenemezse sessizce gizlenir. */
export function WingLayer(props: { wing: WingLayerSpec; size: number }) {
  const { wing, size } = props;
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const b = wingBox(wing, size / 2, size / 2, size);
  const sp = wing.sprite;
  const filter = wing.palet ? `url(#${wingFilterId(wing.palet)})` : wing.filtre || undefined;
  const defs = wing.palet ? <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><WingFilterDefs palet={wing.palet} /></svg> : null;
  // Animasyonlu sayfa: karakter ekranlarında yalnız ilk kare sabit (arka plan kesiti).
  const style: CSSProperties = { width: b.width, height: b.height, left: b.x, top: b.y, ...(filter ? { filter } : {}),
    ...(sp ? { backgroundImage: `url(${BASE}${wing.src})`, backgroundSize: `${sp.sutun * 100}% ${sp.satir * 100}%`, backgroundPosition: '0 0', backgroundRepeat: 'no-repeat' } : {}) };
  if (sp) return <>{defs}<span className="look-wing" data-wing={wing.id} style={style} aria-hidden="true" /></>;
  return <>{defs}<img className="look-wing" data-wing={wing.id} src={`${BASE}${wing.src}`} alt="" style={{ ...style, ...(wing.esnet ? { objectFit: 'fill' } : {}) }} aria-hidden="true" onError={() => setGone(true)} /></>;
}

/** `ability`: karakter ekranı (liste, oluşturucu önizlemesi): uçma yeteneği olan karakter havada olmasa da kanatlı görünür. */
export function LookFrame(props: { sheet: LookSheet; size: number; flying?: boolean; ability?: boolean; children: ReactNode }) {
  const look = lineageLook(props.sheet, { ...(props.flying ? { flying: true } : {}), ...(props.ability ? { ability: true } : {}) });
  const style = {
    width: props.size, height: props.size,
    '--look-filter': look.filter || 'none', '--look-sx': look.scaleX, '--look-sy': look.scaleY, '--look-foot': `${FOOT_FRAC * 100}%`,
  } as CSSProperties;
  return (
    <span className="look-frame" style={style}>
      {look.wing && <WingLayer wing={look.wing} size={props.size} />}
      {props.children}
    </span>
  );
}
