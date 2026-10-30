/**
 * Savaş sonu başlık videosu (Görev U3; tembel parça). Tam ekran, sessiz, `playsInline`; önce poster karesi. Video
 * * bitince, oynatılamazsa (son kaynakta hata, otomatik oynatma kısıtı, `START_TIMEOUT_MS` içinde başlamazsa) ya da dokununca bir
 * kez biter (`EndVideoGate`); hata görünmez, doğrudan sonuç ekranı. Hareketi azalt: poster kare `holdMs`.
 */
import { useEffect, useRef } from 'react';
import { EndVideoGate, START_TIMEOUT_MS, type EndVideoExit, type EndVideoPlan } from './endVideo';

const BASE = import.meta.env.BASE_URL;

export default function EndVideo(props: { plan: EndVideoPlan; label: string; onDone: (why: EndVideoExit) => void; stopJingle: () => void }) {
  const { plan } = props;
  const gate = useRef<EndVideoGate | null>(null);
  if (!gate.current) gate.current = new EndVideoGate({ onDone: props.onDone, stopJingle: props.stopJingle });
  const video = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const g = gate.current as EndVideoGate;
    if (plan.kind === 'poster') {
      const t = window.setTimeout(() => g.exit('poster'), plan.holdMs);
      return () => window.clearTimeout(t);
    }
    const v = video.current;
    let started = false;
    const t = window.setTimeout(() => { if (!started) g.exit('timeout'); }, START_TIMEOUT_MS);
    const onPlaying = () => { started = true; };
    v?.addEventListener('playing', onPlaying);
    try {
      const p = v?.play();
      if (p && typeof p.catch === 'function') p.catch(() => g.exit('error'));
      else if (!v) g.exit('error');
    } catch {
      g.exit('error');
    }
    return () => { window.clearTimeout(t); v?.removeEventListener('playing', onPlaying); };
  }, [plan]);
  const exit = (why: EndVideoExit) => gate.current?.exit(why);
  return (
    <div className="end-video" role="button" tabIndex={0} aria-label={props.label} data-testid="end-video"
      onClick={() => exit('tap')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') exit('tap'); }}>
      {plan.kind === 'video' ? (
        <video ref={video} poster={`${BASE}${plan.poster}`} muted playsInline autoPlay preload="auto"
          disablePictureInPicture onEnded={() => exit('ended')}>
          {/* Önce H.264, sonra VP9; ancak son kaynak da açılamazsa sonuç ekranına geçilir. */}
          <source src={`${BASE}${plan.src}`} type="video/mp4" />
          <source src={`${BASE}${plan.webm}`} type="video/webm" onError={() => exit('error')} />
        </video>
      ) : (
        <img src={`${BASE}${plan.poster}`} alt="" onError={() => exit('error')} />
      )}
    </div>
  );
}
