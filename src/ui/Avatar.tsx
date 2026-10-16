/**
 * Avatar: `public/` altındaki görsel varsa o, yoksa ırk rengi zemin üstünde kısa yazı (yer
 * tutucu). Görselin varlığı tarayıcıda yüklenerek anlaşılır ve önbelleğe alınır; böylece
 * dosya adı kuralına uyan bir görsel eklenince kod değişmeden görünür.
 */
import { useEffect, useState } from 'react';
import type { Avatar as AvatarData } from '../battle';

const BASE = import.meta.env.BASE_URL;
const cache = new Map<string, boolean>();

/** Görsel yüklenebildi mi: true, false veya henüz bilinmiyor (null). */
export function useImageOk(src: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(cache.has(src) ? (cache.get(src) as boolean) : null);
  useEffect(() => {
    if (cache.has(src)) {
      setOk(cache.get(src) as boolean);
      return;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => { cache.set(src, true); if (alive) setOk(true); };
    img.onerror = () => { cache.set(src, false); if (alive) setOk(false); };
    img.src = `${BASE}${src}`;
    return () => { alive = false; };
  }, [src]);
  return ok;
}

export const avatarUrl = (a: AvatarData) => `${BASE}${a.src}`;

/** HTML avatar (sıra şeridi, karakter çekmecesi). */
export function AvatarBadge(props: { avatar: AvatarData; size: number; ring?: string; title?: string }) {
  const { avatar, size, ring, title } = props;
  const ok = useImageOk(avatar.src);
  return (
    <span className="avatar" title={title}
      style={{ width: size, height: size, background: avatar.bg, borderColor: ring ?? 'transparent', fontSize: size * 0.4 }}>
      {ok ? <img src={avatarUrl(avatar)} alt="" width={size} height={size} /> : avatar.label}
    </span>
  );
}

/** SVG içindeki yuvarlak avatar (jeton). */
export function AvatarCircle(props: { avatar: AvatarData; cx: number; cy: number; r: number; clipId: string; asleep?: boolean }) {
  const { cx, cy, r, clipId } = props;
  // Uyuyan yaratık: uyku resmi varsa o (yoksa normal resim).
  const sleepOk = useImageOk(props.avatar.asleepSrc ?? props.avatar.src);
  const avatar = props.asleep && props.avatar.asleepSrc && sleepOk ? { ...props.avatar, src: props.avatar.asleepSrc } : props.avatar;
  const ok = useImageOk(avatar.src);
  return (
    <>
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={r} /></clipPath>
      <circle cx={cx} cy={cy} r={r} fill={avatar.bg} />
      {ok ? (
        <image href={avatarUrl(avatar)} x={cx - r} y={cy - r} width={2 * r} height={2 * r} clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice" />
      ) : (
        <text x={cx} y={cy + r * 0.32} className="initials" style={{ fontSize: r * 0.9 }}>{avatar.label}</text>
      )}
    </>
  );
}
