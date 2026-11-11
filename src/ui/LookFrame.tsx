/**
 * Kuyruk AS1a: alt soy görünüm çerçevesi (yalnızca görsel). Çocuğu (AvatarBadge) sarar: renk filtresi ve en-boy
 * CSS değişkeniyle görsele, Celestial hale gizleme üst bant kırpmasıyla, kanat katmanı jetonun arkasına. Kanat sprite'ı
 * yoksa efekt sistemindeki kanat şeridinin ilk karesi yer tutucudur (`public/efekt/<ad>.webp`, 4 kare yatay).
 */
import type { CSSProperties, ReactNode } from 'react';
import { HALO_CLIP_PCT, lineageLook, type LookSheet, type WingSlot } from './lineageLook';

const BASE = import.meta.env.BASE_URL;

/** Kanat katmanı: kendi sprite'ı varsa o; yoksa efekt şeridinin ilk karesi (yer tutucu). */
export function WingLayer(props: { wing: WingSlot; size: number }) {
  const { wing, size } = props;
  const w = size * wing.olcek;
  const style: CSSProperties = {
    width: w, height: w, left: (size - w) / 2, top: (size - w) / 2 + size * wing.yukari,
    backgroundImage: `url(${BASE}${wing.sprite ?? `efekt/${wing.efekt}.webp`})`,
    backgroundSize: wing.sprite ? 'contain' : '400% 100%', backgroundPosition: '0 0', backgroundRepeat: 'no-repeat',
    ...(wing.filtre ? { filter: wing.filtre } : {}),
  };
  return <span className={`look-wing${wing.sprite ? '' : ' placeholder'}`} data-wing={wing.id} style={style} aria-hidden="true" />;
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
