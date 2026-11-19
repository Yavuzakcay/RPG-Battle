/**
 * Kuyruk AS1a/AS1c: alt soy görünüm çerçevesi (yalnızca görsel; rozetler: oluşturucu, karakter kartı, tur şeridi). Çocuğu
 * (AvatarBadge) sarar: filtre ve en-boy CSS değişkeniyle görsele, Celestial hale gizleme üst bant kırpmasıyla, kanat katmanı
 * jetonun arkasına (yalnız `flying` iken açık sprite; sprite dosyası tanımlı değilse katman yok). Savaş jetonu (SVG) aynı çözücüyü
 * `Avatar.tsx` içinde kullanır.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { WingFilterDefs } from './WingFilter';
import { WingRootParts } from './WingRootParts';
import { raceColor } from '../battle/avatar';
import { FOOT_FRAC, lineageLook, wingBox, wingFilterId, type LookSheet, type WingLayerSpec } from './lineageLook';

const BASE = import.meta.env.BASE_URL;

/** Kanat katmanı (rozet): sprite yüklenemezse sessizce gizlenir. */
export function WingLayer(props: { wing: WingLayerSpec; size: number; tokenSrc?: string }) {
  const { wing, size } = props;
  const [gone, setGone] = useState(false);
  if (gone) return null;
  // 2026-11-20: gövdeye bağlı kanat (Dragonborn `kok`): iki kanat kökten, figürün arkasında, zemin dairesinin önünde.
  if (wing.kok) {
    return (
      <svg className="look-wing look-wing-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ left: 0, top: 0 }} aria-hidden="true">
        <WingRootParts wing={wing} href={`${BASE}${wing.src}`} cx={size / 2} cy={size / 2} w={size} tokenSrc={props.tokenSrc} />
      </svg>
    );
  }
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
export function LookFrame(props: { sheet: LookSheet; size: number; flying?: boolean; ability?: boolean; /** Rozetin jetonu ve zemin rengi (kanat kökü düzeltmesi, kanatlı zemin). */ avatar?: { src?: string; bg?: string }; children: ReactNode }) {
  const look = lineageLook(props.sheet, { ...(props.flying ? { flying: true } : {}), ...(props.ability ? { ability: true } : {}) });
  const style = {
    width: props.size, height: props.size,
    '--look-filter': look.filter || 'none', '--look-sx': look.scaleX, '--look-sy': look.scaleY, '--look-foot': `${FOOT_FRAC * 100}%`,
  } as CSSProperties;
  // Gövdeye bağlı kanat: zemin dairesi kanadın arkasında (rozetin kendi zemini saydam; CSS `.look-frame.winged`).
  const rooted = !!look.wing?.kok;
  return (
    <span className={`look-frame${rooted ? ' winged' : ''}`} style={style}>
      {rooted && <span className="look-bg" style={{ background: props.avatar?.bg ?? raceColor(props.sheet.raceId) }} aria-hidden="true" />}
      {look.wing && <WingLayer wing={look.wing} size={props.size} tokenSrc={props.avatar?.src} />}
      {props.children}
    </span>
  );
}
