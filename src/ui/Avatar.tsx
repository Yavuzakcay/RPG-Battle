/**
 * Avatar: `public/` altındaki görsel varsa o, yoksa ırk rengi zemin üstünde kısa yazı (yer
 * tutucu). Görselin varlığı tarayıcıda yüklenerek anlaşılır ve önbelleğe alınır; böylece
 * dosya adı kuralına uyan bir görsel eklenince kod değişmeden görünür.
 */
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { HALO_CLIP_PCT, lineageLook, wingBox } from './lineageLook';
import type { Avatar as AvatarData } from '../battle';
import type { TintSpec } from '../battle/types';
import { tintedReady, tintedUrl } from './tint';

/**
 * Görev K8b: soy rengi varsa görselin boyalı kopyası (hazır olana dek asıl görsel). Yalnızca karakter jetonları
 * (`characters/`) boyanır; yedek yollar ve baş harfler olduğu gibi.
 */
export function useTinted(src: string | null, tint: TintSpec | undefined): string | null {
  const [, rerender] = useState(0);
  const url = src ? assetSrc(src) : null;
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
/** Kuyruk 18 H10: özel canavarın yerel görseli data URL (taban yolu eklenmez). */
const assetSrc = (s: string) => (s.startsWith('data:') ? s : `${BASE}${s}`);
const cache = new Map<string, boolean>();

export const avatarUrl = (a: AvatarData) => assetSrc(a.src);

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
    img.src = assetSrc(pending);
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
      img.src = assetSrc(s);
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
      style={{ width: size, height: size, background: avatar.bg, borderColor: ring ?? avatar.ring ?? 'transparent', fontSize: size * 0.4 }}>
      {src ? (
        <img key={src} src={shown ?? assetSrc(src)} alt="" width={size} height={size} loading={props.eager ? 'eager' : 'lazy'} decoding="async"
          className={loaded ? undefined : 'pending'} style={avatar.hue ? { filter: `hue-rotate(${avatar.hue}deg)` } : undefined}
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
/**
 * Kuyruk AS1c: jeton figürü (SVG): kanat katmanı (jetonun arkasında; `lineageLook`), alt soy oranı, Celestial hale gizleme ve
 * filtre. Yalnız çizim: `x/y/width/height` ve tıklama alanı aynı.
 */
export function TokenFigure(props: { href: string; cx: number; cy: number; w: number; flip?: boolean; look?: AvatarData['look']; flying?: boolean; /** Karakter ekranları: uçma yeteneği olan karakter havada olmasa da kanatlı. */ ability?: boolean }) {
  const { cx, cy, w } = props;
  const lk = props.look ? lineageLook(props.look, { ...(props.flying ? { flying: true } : {}), ...(props.ability ? { ability: true } : {}) }) : null;
  const clipId = useId();
  const by = cy + w / 2;
  const shape = lk && (lk.scaleX !== 1 || lk.scaleY !== 1) ? `translate(${cx} ${by}) scale(${lk.scaleX} ${lk.scaleY}) translate(${-cx} ${-by})` : undefined;
  const wing = lk?.wing;
  const wb = wing ? wingBox(wing, cx, cy, w) : null;
  return (
    <>
      {wing && wb && <image className="look-wing" data-wing={wing.id} href={assetSrc(wing.src)} x={wb.x} y={wb.y} width={wb.width} height={wb.height} preserveAspectRatio="xMidYMid meet"
        style={wing.filtre ? { filter: wing.filtre } : undefined} aria-hidden="true" />}
      {lk?.hideHalo && <clipPath id={clipId}><rect x={cx - w / 2} y={cy - w / 2 + (w * HALO_CLIP_PCT) / 100} width={w} height={w} /></clipPath>}
      <g transform={shape} clipPath={lk?.hideHalo ? `url(#${clipId})` : undefined}>
        <image href={props.href} x={cx - w / 2} y={cy - w / 2} width={w} height={w} preserveAspectRatio="xMidYMid slice"
          transform={props.flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined} style={lk?.filter ? { filter: lk.filter } : undefined} />
      </g>
    </>
  );
}

export function AvatarCircle(props: {
  avatar: AvatarData; cx: number; cy: number; r: number; asleep?: boolean; flip?: boolean; scale?: number; /** Kuyruk AS1c: havada (kanat katmanı açık sprite). */ flying?: boolean; ability?: boolean; /** Karakter ekranları: yüklenmesi beklenmeden ilk görseli çiz (yüklenemezse zincirdeki sıradaki, sonra baş harfler). */ eager?: boolean;
}) {
  const { avatar, cx, cy, r } = props;
  const chain = chainOf(avatar, props.asleep === true);
  const chained = useImageChain(chain);
  const src = chained ?? (props.eager && cache.get(chain[0] ?? "") !== false ? chain[0] ?? null : null);
  const shown = useTinted(src, avatar.tint);
  const w = 2 * r * (props.scale ?? 1);
  return (
    src ? (
      <g className={`fig${avatar.outfit ? ` outfit-${avatar.outfit}` : ''}`}>
        {/* Görev P0: ek paket yaratığının halkası ve renk tonu (çizim anında; ek görsel dosyası yok). */}
        {avatar.ring && <ellipse cx={cx} cy={cy + r * 0.78} rx={r * 0.92} ry={r * 0.3} fill="none" stroke={avatar.ring} strokeWidth={Math.max(1.5, r * 0.09)} opacity={0.9} />}
        {/* Görev P0: ek paket yaratığının renk tonu; Kuyruk AS1c: alt soy görünümü `TokenFigure` içinde. */}
        <g className="breathe" style={avatar.hue ? { filter: `hue-rotate(${avatar.hue}deg)` } : undefined}>
          <TokenFigure href={shown ?? assetSrc(src)} cx={cx} cy={cy} w={w} flip={props.flip} look={avatar.look} flying={props.flying} ability={props.ability} />
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

/**
 * Karakter ekranları (liste, oluşturucu önizlemesi): savaş jetonuyla aynı çizim yolu (`AvatarCircle` → `TokenFigure`; çerçevesiz
 * silüet, kanat jetonun arkasında, aynı `wingBox`), küçük bir SVG içinde. SVG kutusu jeton + kanat sınırını kapsar; kanat
 * kırpılmaz. `look` varsa uçma yeteneği olan karakter kanatlıdır (`ability`). Yalnız görünüm.
 */
export function CharacterFigure(props: { avatar: AvatarData; size: number; title?: string }) {
  const { avatar, size } = props;
  const lk = avatar.look ? lineageLook(avatar.look, { ability: true }) : null;
  const wb = lk?.wing ? wingBox(lk.wing, size / 2, size / 2, size) : null;
  const pad = Math.max(2, size * 0.06);
  const x0 = Math.min(0, wb?.x ?? 0) - pad, y0 = Math.min(0, wb?.y ?? 0) - pad;
  const x1 = Math.max(size, wb ? wb.x + wb.width : 0) + pad, y1 = Math.max(size, wb ? wb.y + wb.height : 0) + pad;
  return (
    <svg className="char-figure" width={x1 - x0} height={y1 - y0} viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={props.title ?? avatar.label}
      style={{ '--fig-w': `${x1 - x0}px` } as CSSProperties}>
      {/* Çerçeve yok: jeton arka planda kaybolmasın diye ayak altında hafif zemin parıltısı (CSS `.char-ground`). */}
      <ellipse className="char-ground" cx={size / 2} cy={size * 0.93} rx={size * 0.34} ry={size * 0.08} />
      <AvatarCircle avatar={avatar} cx={size / 2} cy={size / 2} r={size / 2} ability eager />
    </svg>
  );
}
