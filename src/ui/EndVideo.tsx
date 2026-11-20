/**
 * Savaş sonu başlık videosu (Görev U3; tembel parça). Tam ekran, sessiz, `playsInline`; önce poster karesi. Video
 * * bitince, oynatılamazsa (son kaynakta hata, otomatik oynatma kısıtı, `START_TIMEOUT_MS` içinde başlamazsa) ya da dokununca bir
 * kez biter (`EndVideoGate`); hata görünmez, doğrudan sonuç ekranı. Hareketi azalt: poster kare `holdMs`.
 */
import { useEffect, useRef, useState } from 'react';
import { EndVideoGate, START_TIMEOUT_MS, endVideoMode, type EndVideoExit, type EndVideoMode, type EndVideoPlan } from './endVideoPlan';
import { useSpriteAnimSetting } from './effectsSetting';

const BASE = import.meta.env.BASE_URL;

/** Tarayıcı `mix-blend-mode: screen` destekliyor mu (yoksa eski siyah zemin). */
const blendSupported = (): boolean => { try { return typeof CSS !== 'undefined' && CSS.supports('mix-blend-mode', 'screen'); } catch { return false; } };

export default function EndVideo(props: { plan: EndVideoPlan; label: string; onDone: (why: EndVideoExit) => void; stopJingle: () => void; /** Testler için kip ezmesi. */ mode?: EndVideoMode }) {
  const { plan } = props;
  const [effects] = useSpriteAnimSetting();
  const mode: EndVideoMode = props.mode ?? endVideoMode({ effects, supported: blendSupported() });
  const [leaving, setLeaving] = useState(false);
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
  // SV1: video bitince yumuşak çıkış (fadeMs), sonra sonuç ekranı; dokununca hemen geçilir (ezgi söner).
  const endSoft = () => { if (mode !== 'blend') { exit('ended'); return; } setLeaving(true); window.setTimeout(() => exit('ended'), plan.fadeMs); };
  const media = plan.kind === 'video' ? (
    <video ref={video} className="end-video-media" poster={`${BASE}${plan.poster}`} muted playsInline autoPlay preload="auto"
      disablePictureInPicture onEnded={endSoft}>
      {/* Önce H.264, sonra VP9; ancak son kaynak da açılamazsa sonuç ekranına geçilir. */}
      <source src={`${BASE}${plan.src}`} type="video/mp4" />
      <source src={`${BASE}${plan.webm}`} type="video/webm" onError={() => exit('error')} />
    </video>
  ) : (
    <img className="end-video-media" src={`${BASE}${plan.poster}`} alt="" onError={() => exit('error')} />
  );
  // Savaş ekranı arkada görünür kalır; etkileşim kapalı: tıklamayı tam ekran katman yutar ("dokununca geç" aynen).
  return (
    <div className={`end-video ${mode}${leaving ? ' leaving' : ''}`} data-testid="end-video" data-mode={mode}
      style={{ '--end-dim': String(plan.dim), '--end-fade': `${plan.fadeMs}ms` } as React.CSSProperties}>
      {mode === 'blend' && <div className="end-video-dim" aria-hidden="true" />}
      {media}
      <div className="end-video-click" role="button" tabIndex={0} aria-label={props.label}
        onClick={() => exit('tap')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') exit('tap'); }} />
    </div>
  );
}
