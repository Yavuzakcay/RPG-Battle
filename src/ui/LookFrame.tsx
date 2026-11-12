/**
 * Kuyruk AS1a/AS1c: alt soy görünüm çerçevesi (yalnızca görsel; rozetler: oluşturucu, karakter kartı, tur şeridi). Çocuğu
 * (AvatarBadge) sarar: filtre ve en-boy CSS değişkeniyle görsele, Celestial hale gizleme üst bant kırpmasıyla, kanat katmanı
 * jetonun arkasına (yalnız `flying` iken açık sprite; sprite dosyası tanımlı değilse katman yok). Savaş jetonu (SVG) aynı çözücüyü
 * `Avatar.tsx` içinde kullanır.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { HALO_CLIP_PCT, lineageLook, type LookSheet, type WingLayerSpec } from './lineageLook';

const BASE = import.meta.env.BASE_URL;

/** Kanat katmanı (rozet): sprite yüklenemezse sessizce gizlenir. */
export function WingLayer(props: { wing: WingLayerSpec; size: number }) {
  const { wing, size } = props;
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const w = size * wing.olcek;
  const style: CSSProperties = { width: w, height: w, left: (size - w) / 2, top: (size - w) / 2 + size * wing.yukari, ...(wing.filtre ? { filter: wing.filtre } : {}) };
  return <img className="look-wing" data-wing={wing.id} src={`${BASE}${wing.src}`} alt="" style={style} aria-hidden="true" onError={() => setGone(true)} />;
}

export function LookFrame(props: { sheet: LookSheet; size: number; flying?: boolean; children: ReactNode }) {
  const look = lineageLook(props.sheet, props.flying ? { flying: true } : {});
  const style = {
    width: props.size, height: props.size,
    '--look-filter': look.filter || 'none', '--look-sx': look.scaleX, '--look-sy': look.scaleY, '--halo-clip': `${HALO_CLIP_PCT}%`,
  } as CSSProperties;
  return (
    <span className={`look-frame${look.hideHalo ? ' halo-hidden' : ''}`} style={style}>
      {look.wing && <WingLayer wing={look.wing} size={props.size} />}
      {props.children}
    </span>
  );
}
