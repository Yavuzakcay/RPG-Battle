/**
 * Avatar: `public/` altındaki görsel varsa o, yoksa ırk rengi zemin üstünde kısa yazı (yer
 * tutucu). Görselin varlığı tarayıcıda yüklenerek anlaşılır ve önbelleğe alınır; böylece
 * dosya adı kuralına uyan bir görsel eklenince kod değişmeden görünür.
 */
import { useEffect, useState } from 'react';
import type { Avatar as AvatarData } from '../battle';
import type { TintSpec } from '../battle/types';
import { tintedReady, tintedUrl } from './tint';

/**
 * Görev K8b: soy rengi varsa görselin boyalı kopyası (hazır olana dek asıl görsel). Yalnızca karakter jetonları
 * (`characters/`) boyanır; yedek yollar ve baş harfler olduğu gibi.
 */
export function useTinted(src: string | null, tint: TintSpec | undefined): string | null {
  const [, rerender] = useState(0);
  const url = src ? `${BASE}${src}` : null;
  const active = !!url && !!tint && /(^|\/)characters\//.test(src ?? '');
  const ready = active ? tintedReady(url as string, tint as TintSpec) : undefined;
  useEffect(() => {
    if (!active || ready !== undefined) return;
    let alive = true;
    void tintedUrl(url as string, tint as TintSpec).then(() => { if (alive) rerender((n) => n + 1); });
    return () => { alive = false; };
  }, [active, ready, url, tint]);
  return active ? ready ?? url : url;
}

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

/** Küçük rozetlerde karakter jetonunun 96 px kopyası (`public/characters/kucuk/`, `npm run karakter-kucuk`). */
export function thumbOf(src: string): string | null {
  const m = /^characters\/([^/]+\.webp)$/.exec(src);
  return m ? `characters/kucuk/${m[1]}` : null;
}

/** Rozetin yedek zinciri: küçükse önce küçük kopya, sonra asıl görsel ve eski yollar. */
export function badgeChain(a: AvatarData, size: number): string[] {
  const thumb = size <= SMALL ? thumbOf(a.src) : null;
  return [...(thumb ? [thumb] : []), ...chainOf(a)];
}

/** Bu boya kadar (CSS px) rozet küçük kopyayı kullanır (96 px = 2× yoğunluk). */
const SMALL = 48;

/** Görselleri boşta önceden indirir (sonra gösterilecek rozetler önbellekten anında açılır). */
export function preloadImages(srcs: string[]): void {
  const todo = srcs.filter((s) => !cache.has(s) && !preloading.has(s));
  if (todo.length === 0 || typeof Image === 'undefined') return;
  const start = () => {
    for (const s of todo) {
      preloading.add(s);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => cache.set(s, true);
      img.onerror = () => { preloading.delete(s); };
      img.src = `${BASE}${s}`;
    }
  };
  const idle = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(start, { timeout: 1500 }); else window.setTimeout(start, 200);
}
const preloading = new Set<string>();

/**
 * HTML avatar (sıra şeridi, karakter çekmecesi, karakter listesi, oluşturucu). Görsel doğrudan `<img>`
 * ile yüklenir (`lazy`: ekran dışındakiler beklenir; `eager`: ilk ekranda hemen); yüklenene dek iskelet
 * (yanıp sönen zemin), yüklenemezse zincirdeki sıradaki görsel, hiçbiri yoksa baş harfler.
 */
export function AvatarBadge(props: { avatar: AvatarData; size: number; ring?: string; title?: string; eager?: boolean }) {
  const { avatar, size, ring, title } = props;
  const chain = badgeChain(avatar, size);
  const key = chain.join('|');
  const [state, setState] = useState<{ key: string; i: number; loaded: boolean }>(() => ({ key, i: 0, loaded: false }));
  const cur = state.key === key ? state : { key, i: 0, loaded: false };
  // Yüklenemediği bilinenler atlanır.
  let i = cur.i;
  while (i < chain.length && cache.get(chain[i]!) === false) i++;
  const src = chain[i] ?? null;
  const loaded = cur.loaded || (src !== null && cache.get(src) === true);
  const shown = useTinted(src, avatar.tint);
  return (
    <span className={`avatar${src && !loaded ? ' skeleton' : ''}`} title={title}
      style={{ width: size, height: size, background: avatar.bg, borderColor: ring ?? 'transparent', fontSize: size * 0.4 }}>
      {src ? (
        <img key={src} src={shown ?? `${BASE}${src}`} alt="" width={size} height={size} loading={props.eager ? 'eager' : 'lazy'} decoding="async"
          className={loaded ? undefined : 'pending'}
          onLoad={() => { cache.set(src, true); setState({ key, i, loaded: true }); }}
          onError={() => { cache.set(src, false); setState({ key, i: i + 1, loaded: false }); }} />
      ) : avatar.label}
    </span>
  );
}

/**
 * SVG içindeki yuvarlak avatar (jeton). Görsel yedek zinciriyle (uykuda uyku resmi, sonra normal,
 * sonra eski yol, en son baş harf). `scale`: resmin Medium jetona göre boyu (boyut sınıfı, data/token-sizes.json);
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
  const shown = useTinted(src, avatar.tint);
  const w = 2 * r * (props.scale ?? 1);
  return (
    src ? (
      <g className="fig">
        <g className="breathe">
          <image href={shown ?? `${BASE}${src}`} x={cx - w / 2} y={cy - w / 2} width={w} height={w}
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
