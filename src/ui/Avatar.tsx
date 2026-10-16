/**
 * Avatar: `public/` altındaki görsel varsa o, yoksa ırk rengi zemin üstünde kısa yazı (yer
 * tutucu). Görselin varlığı tarayıcıda yüklenerek anlaşılır ve önbelleğe alınır; böylece
 * dosya adı kuralına uyan bir görsel eklenince kod değişmeden görünür.
 */
import { useEffect, useState } from 'react';
import type { Avatar as AvatarData } from '../battle';

const BASE = import.meta.env.BASE_URL;
const cache = new Map<string, boolean>();

export const avatarUrl = (a: AvatarData) => `${BASE}${a.src}`;

/**
 * Yedek zinciri: yüklenebilen ilk görsel (bilinenlerden), denenecek sıradaki (bilinmiyorsa) ya da
 * hiçbiri (baş harfli yer tutucu). Saf fonksiyon: `known` görsel → yüklenebildi mi.
 */
export function pickImage(srcs: string[], known: ReadonlyMap<string, boolean>): { src: string | null; pending: string | null } {
  for (const s of srcs) {
    const k = known.get(s);
    if (k === true) return { src: s, pending: null };
    if (k === undefined) return { src: null, pending: s };
  }
  return { src: null, pending: null };
}

/** Zincirdeki ilk yüklenebilen görsel; yalnızca gösterilen avatarlar yüklenir (tembel). */
export function useImageChain(srcs: string[]): string | null {
  const [, rerender] = useState(0);
  const { src, pending } = pickImage(srcs, cache);
  useEffect(() => {
    if (!pending) return;
    let alive = true;
    const img = new Image();
    const done = (ok: boolean) => { cache.set(pending, ok); if (alive) rerender((n) => n + 1); };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = `${BASE}${pending}`;
    return () => { alive = false; };
  }, [pending]);
  return src;
}

const chainOf = (a: AvatarData, asleep = false) => [...(asleep && a.asleepSrc ? [a.asleepSrc] : []), a.src, ...(a.fallbacks ?? [])];

/** HTML avatar (sıra şeridi, karakter çekmecesi). */
export function AvatarBadge(props: { avatar: AvatarData; size: number; ring?: string; title?: string }) {
  const { avatar, size, ring, title } = props;
  const src = useImageChain(chainOf(avatar));
  return (
    <span className="avatar" title={title}
      style={{ width: size, height: size, background: avatar.bg, borderColor: ring ?? 'transparent', fontSize: size * 0.4 }}>
      {src ? <img src={`${BASE}${src}`} alt="" width={size} height={size} /> : avatar.label}
    </span>
  );
}

/**
 * SVG içindeki yuvarlak avatar (jeton). Görsel yedek zinciriyle (uykuda uyku resmi, sonra normal,
 * sonra eski yol, en son baş harf). `scale`: dairenin içinde resmin göreli boyu (canavar boyutu);
 * `flip`: yatay ayna (canavarlar karakterlere dönük).
 * Resim varsa jeton saydamdır: arka plan dairesi ve kırpma yok, yalnızca figür (`.fig`; takım ve sıra
 * parıltısı CSS drop-shadow ile figürün silüetinde). Resim yoksa baş harfli daire okunurluk için kalır.
 * Resim hafifçe "nefes alır" (CSS, hareket azaltma tercihinde kapalı).
 */
export function AvatarCircle(props: {
  avatar: AvatarData; cx: number; cy: number; r: number; asleep?: boolean; flip?: boolean; scale?: number;
}) {
  const { avatar, cx, cy, r } = props;
  const src = useImageChain(chainOf(avatar, props.asleep === true));
  const w = 2 * r * (props.scale ?? 1);
  return (
    src ? (
      <g className="fig">
        <g className="breathe">
          <image href={`${BASE}${src}`} x={cx - w / 2} y={cy - w / 2} width={w} height={w}
            preserveAspectRatio="xMidYMid slice" transform={props.flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined} />
        </g>
      </g>
    ) : (
      <>
        <circle cx={cx} cy={cy} r={r} fill={avatar.bg} />
        <text x={cx} y={cy + r * 0.32} className="initials" style={{ fontSize: r * 0.9 }}>{avatar.label}</text>
      </>
    )
  );
}
