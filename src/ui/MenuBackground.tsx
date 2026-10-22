/**
 * Menü ekranlarının (giriş, oyuncu, oluşturucu, GM kurulum, durum) hareketli arka planı:
 * `public/acilis/` altındaki video ve poster (`npm run acilis`; çapraz geçişli kesintisiz döngü).
 * Geniş/yatay ekranda `acilis-pc-*`, dikey ekranda `acilis-mobil-*`; açık temada `*-light`, koyuda `*-dark`.
 * Video önce MP4 (H.264), oynatılamazsa WebM (VP9; H.264'süz Chromium/Linux). Hareketi azalt açıksa veya efektler kapatıldıysa yalnızca poster.
 * Haritalı savaş ekranında kullanılmaz.
 *
 * Tema geçişinde boşluk olmasın diye iki temanın katmanı da çizilir: posterler hemen (index.html'de
 * önyüklenir), görünmeyen temanın videosu ise görünen video oynamaya başladıktan sonra arka planda yüklenir.
 * Geçişte katmanlar opaklıkla karışır; video ilk karesi hazır olana dek altında poster (videonun ilk karesi) görünür.
 */
import { useEffect, useRef, useState } from 'react';
import { useEffectsSetting } from './effectsSetting';
import { useResolvedTheme } from './theme';

const BASE = import.meta.env.BASE_URL;
type Theme = 'light' | 'dark';

/** Ekrana ve temaya göre dosyalar; hareketsizse video yok. */
export function menuBackgroundSources(opts: { portrait: boolean; dark: boolean; motion: boolean }): {
  video: { webm: string; mp4: string } | null; poster: string;
} {
  const name = `acilis/acilis-${opts.portrait ? 'mobil' : 'pc'}-${opts.dark ? 'dark' : 'light'}`;
  return { video: opts.motion ? { webm: `${name}.webm`, mp4: `${name}.mp4` } : null, poster: `${name}.webp` };
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

/** Bir temanın katmanı: poster ve (varsa) video. Görünmüyorken video duraklatılır. */
function Layer(props: { theme: Theme; portrait: boolean; motion: boolean; active: boolean; loadVideo: boolean; onPlaying: () => void }) {
  const { active, loadVideo } = props;
  const src = menuBackgroundSources({ portrait: props.portrait, dark: props.theme === 'dark', motion: props.motion });
  const ref = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoKey = src.video?.webm ?? '';
  useEffect(() => { setVideoFailed(false); setPlaying(false); }, [videoKey]);
  useEffect(() => { setPosterFailed(false); }, [src.poster]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.play()?.catch(() => { /* Otomatik oynatma engellenirse poster kalır. */ });
    } else {
      v.pause();
      v.currentTime = 0; // Yeniden açılınca poster (ilk kare) ile aynı yerden başlar.
      setPlaying(false);
    }
  }, [active, videoKey, loadVideo]);
  const showVideo = src.video !== null && !videoFailed && (active || loadVideo);
  return (
    <div className={`menu-bg-layer${active ? ' on' : ''}`}>
      {!posterFailed && (
        <img src={`${BASE}${src.poster}`} alt="" decoding="async" {...{ fetchpriority: active ? 'high' : 'low' }} onError={() => setPosterFailed(true)} />
      )}
      {showVideo && src.video && (
        <video key={videoKey} ref={ref} className={playing ? 'playing' : undefined} muted loop playsInline autoPlay={active}
          preload="auto" onPlaying={() => { setPlaying(true); props.onPlaying(); }} onError={(e) => { if (e.target === e.currentTarget) setVideoFailed(true); }}>
          {/* React, <source> hatasını <video onError>'a da iletir; video ancak son kaynak da açılamazsa düşer. */}
          <source src={`${BASE}${src.video.mp4}`} type="video/mp4" />
          <source src={`${BASE}${src.video.webm}`} type="video/webm" onError={() => setVideoFailed(true)} />
        </video>
      )}
    </div>
  );
}

export function MenuBackground() {
  const theme = useResolvedTheme();
  const portrait = useMedia('(orientation: portrait)');
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const [effectsOn] = useEffectsSetting();
  const motion = !reduce && effectsOn;
  // Görünen video oynayınca (ya da en geç 4 sn sonra) öteki temanın videosu da yüklenir; veri tasarrufu
  // açıksa yüklenmez (geçişte o temanın posteri görünür, video sonra gelir).
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const [warmed, setWarm] = useState(false);
  const warm = warmed && !saveData;
  useEffect(() => {
    const id = window.setTimeout(() => setWarm(true), 4000);
    return () => window.clearTimeout(id);
  }, []);
  const themes: Theme[] = ['light', 'dark'];
  return (
    <div className={`menu-bg ${theme}`} aria-hidden="true">
      {themes.map((th) => (
        <Layer key={th} theme={th} portrait={portrait} motion={motion} active={th === theme}
          loadVideo={warm} onPlaying={() => setWarm(true)} />
      ))}
      <div className="menu-bg-shade" />
    </div>
  );
}
