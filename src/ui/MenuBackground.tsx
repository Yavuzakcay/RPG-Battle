/**
 * Menü ekranlarının (giriş, oyuncu, oluşturucu, GM kurulum, durum) hareketli arka planı:
 * `public/acilis/` altındaki video ve poster. Geniş/yatay ekranda `acilis-pc-*`, dikey
 * ekranda `acilis-mobil-*`; açık temada `*-light`, koyuda `*-dark`. Hareketi azalt açıksa
 * veya efektler kapatıldıysa yalnızca poster. Video yüklenemezse poster, o da yoksa düz renk.
 * Haritalı savaş ekranında kullanılmaz.
 */
import { useEffect, useState } from 'react';
import { useEffectsSetting } from './EffectsLayer';
import { useResolvedTheme } from './theme';

const BASE = import.meta.env.BASE_URL;

/** Ekrana ve temaya göre dosyalar; hareketsizse video yok. */
export function menuBackgroundSources(opts: { portrait: boolean; dark: boolean; motion: boolean }): { video: string | null; poster: string } {
  const name = `acilis/acilis-${opts.portrait ? 'mobil' : 'pc'}-${opts.dark ? 'dark' : 'light'}`;
  return { video: opts.motion ? `${name}.mp4` : null, poster: `${name}.webp` };
}

/** Bir medya sorgusunu izler. */
function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, [query]);
  return on;
}

export function MenuBackground() {
  const theme = useResolvedTheme();
  const portrait = useMedia('(orientation: portrait)');
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const [effectsOn] = useEffectsSetting();
  const src = menuBackgroundSources({ portrait, dark: theme === 'dark', motion: !reduce && effectsOn });
  const [videoFailed, setVideoFailed] = useState<string | null>(null);
  const [posterFailed, setPosterFailed] = useState<string | null>(null);
  const showVideo = src.video !== null && videoFailed !== src.video;
  return (
    <div className={`menu-bg ${theme}`} aria-hidden="true">
      {showVideo ? (
        <video key={src.video} src={`${BASE}${src.video}`} poster={posterFailed === src.poster ? undefined : `${BASE}${src.poster}`}
          autoPlay muted loop playsInline preload="auto" onError={() => setVideoFailed(src.video)} />
      ) : posterFailed !== src.poster && (
        <img key={src.poster} src={`${BASE}${src.poster}`} alt="" onError={() => setPosterFailed(src.poster)} />
      )}
      <div className="menu-bg-shade" />
    </div>
  );
}
