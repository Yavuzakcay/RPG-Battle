/**
 * Animasyonlu açılış ekranı (Görev L): uygulama her açıldığında giriş ekranının üstünde. Yalnızca CSS ve görseller
 * (canvas, kütüphane yok); stil `splash.css` (index.html'e satır içi gömülür, ilk kare JavaScript'ten önce çizilir).
 * Mantık `splashLogic.ts`; dokunma ya da tuş atlar, "hareketi azalt"ta statik logo ve kısa fade.
 */
import { useEffect, useReducer, type CSSProperties } from 'react';
import { APP_NAME } from '../app/appName';
import { reducedMotion } from './effectsSetting';
import { playSplashSound } from './audio/sound';
import {
  FULL_LOGO, SPLASH_ASPECT, SPLASH_TIMING as T, eyeStyle, initialSplash, layerFile, layerStyle, nextDeadline,
  splashReducer, type LayerId,
} from './splashLogic';

const BASE = import.meta.env.BASE_URL;
const now = () => performance.now();
/** Zamanlama CSS değişkenleri (`splash.css` okur; değerler data/acilis-ekrani.json). */
const ms = (v: number) => `${v}ms`;
const TIMING_VARS = {
  '--eye-at': ms(T.eye.burstAt), '--eye-ms': ms(T.eye.burstMs), '--pulse-at': ms(T.eye.burstAt + T.eye.burstMs), '--pulse-ms': ms(T.eye.pulseMs),
  '--wing-at': ms(T.wings.openAt), '--wing-ms': ms(T.wings.openMs), '--text-at': ms(T.text.at), '--text-ms': ms(T.text.ms),
  '--breathe-at': ms(T.breathe.at), '--breathe-ms': ms(T.breathe.periodMs), '--breathe-scale': String(T.breathe.scale),
} as CSSProperties;
const ANIMATED: LayerId[] = ['kanat-sol', 'kanat-sag', 'yazi'];

/** Görseli yükleyip çözer (çözülmeden oynarsa ilk karede boşluk olur). */
function loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { void (img.decode?.() ?? Promise.resolve()).then(() => resolve(), () => resolve()); };
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export function Splash(props: { onDone: () => void }) {
  const [s, dispatch] = useReducer(splashReducer, undefined, () => initialSplash(reducedMotion(), now()));

  // Kanat ve yazı katmanları (tam animasyon): yüklenince oynar; süresinde yüklenmezse azaltılmış hâle geçer.
  useEffect(() => {
    if (s.mode !== 'full') return;
    let live = true;
    Promise.all([...ANIMATED.map((id) => `${BASE}${layerFile(id)}`), `${BASE}${layerFile('govde')}`].map(loadImage))
      .then(() => live && dispatch({ type: 'ready', at: now() }), () => live && dispatch({ type: 'failed', at: now() }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const d = nextDeadline(s);
    if (d === null) return;
    const id = window.setTimeout(() => dispatch({ type: 'tick', at: now() }), Math.max(0, d - now()) + 5);
    return () => window.clearTimeout(id);
  }, [s]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (['Escape', 'Enter', ' '].includes(e.key)) dispatch({ type: 'skip', at: now() }); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const playing = s.phase === 'playing';
  useEffect(() => { if (playing && s.mode === 'full') playSplashSound(); }, [playing, s.mode]);
  useEffect(() => { if (s.phase === 'done') props.onDone(); }, [s.phase, props]);

  const cls = ['splash', s.mode === 'reduced' ? 'reduced' : '', s.phase !== 'static' ? 'play' : '', s.phase === 'leaving' ? 'leaving' : ''].filter(Boolean).join(' ');
  const fade = s.mode === 'full' ? T.fadeMs : T.reduced.fadeMs;
  return (
    <div className={cls} role="img" aria-label={APP_NAME} style={{ ...TIMING_VARS, transitionDuration: `${fade}ms` }}
      onPointerDown={() => dispatch({ type: 'skip', at: now() })}>
      <div className="splash-stage" style={{ ['--ar' as string]: String(SPLASH_ASPECT) }}>
        {s.mode === 'reduced' ? (
          <img className="splash-full" src={`${BASE}${FULL_LOGO}`} alt="" style={{ animationDuration: `${T.reduced.fadeInMs}ms` }} />
        ) : (
          <div className="splash-breathe">
            {s.phase !== 'static' && <img className="splash-layer splash-wing splash-kanat-sol" src={`${BASE}${layerFile('kanat-sol')}`} alt="" style={layerStyle('kanat-sol')} />}
            {s.phase !== 'static' && <img className="splash-layer splash-wing splash-kanat-sag" src={`${BASE}${layerFile('kanat-sag')}`} alt="" style={layerStyle('kanat-sag')} />}
            <img className="splash-layer splash-govde" src={`${BASE}${layerFile('govde')}`} alt="" style={layerStyle('govde')} />
            {s.phase !== 'static' && <span className="splash-eye" style={eyeStyle()} />}
            {s.phase !== 'static' && <img className="splash-layer splash-yazi" src={`${BASE}${layerFile('yazi')}`} alt="" style={layerStyle('yazi')} />}
          </div>
        )}
      </div>
    </div>
  );
}
