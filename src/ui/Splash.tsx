/**
 * Animasyonlu açılış ekranı (Görev L, L2, L3), tembel parça: giriş ekranının üstünde. Soğuk açılışta kapalı kanatlı
 * logo belirir, içinde (zarın yerinde) CSS 3D d20 döner, 20 yüzü önde durur; gözden keskin ışık çıkar, kapalı logo
 * solarken açık kanatlar köklerinden açılır, zar geniş logodakine devreder; yazı ve nefes. Yalnızca CSS
 * transform/opacity (canvas, WebGL, kütüphane yok); stil `splash.css` (index.html'e satır içi gömülür, zarın ilk
 * karesi JavaScript'ten önce çizilir). Mantık `splashLogic.ts`; dokunma ya da tuş atlar. Arka plandan dönüşte ve
 * "hareketi azalt"ta statik logo ve kısa fade.
 */
import { useEffect, useReducer, useRef, type CSSProperties } from 'react';
import { APP_NAME } from '../app/appName';
import { reducedMotion } from './effectsSetting';
import { playSplashSound } from './audio/sound';
import { emitDiceSound } from './diceSound';
import { removeStaticSplash, type SplashKind } from './splashBoot';
import {
  CLOSED_BODY, CLOSED_WINGS, DIE_SPIN, FULL_LOGO, closedStyle, SPLASH_ASPECT, SPLASH_TIMING as T, dieCenterStyle, dieHtml, eyeStyle, fadeMs, initialSplash, layerFile, layerStyle,
  nextDeadline, splashReducer, type LayerId, type SplashState,
} from './splashLogic';

const BASE = import.meta.env.BASE_URL;
const now = () => performance.now();
/** Zamanlama CSS değişkenleri (`splash.css` okur; değerler data/acilis-ekrani.json). */
const ms = (v: number) => `${v}ms`;
const L = T.logo;
const E = L.eye;
const TIMING_VARS = {
  '--closed-in': ms(T.die.closedFadeMs), '--spin-ms': ms(T.die.spinMs), '--spin-name': DIE_SPIN, '--flash-ms': ms(T.die.flashMs),
  '--eye-at': ms(E.burstAt), '--eye-ms': ms(E.burstMs), '--eye-settle': ms(E.settleMs), '--twinkle-at': ms(E.burstAt + E.settleMs), '--twinkle-ms': ms(E.twinkleMs),
  '--eye-end-at': ms(E.endAt), '--eye-end-ms': ms(E.endMs),
  '--wing-at': ms(L.wings.openAt), '--wing-ms': ms(L.wings.openMs), '--cwing-out': ms(L.wings.closedWingsOutMs),
  '--swap-at': ms(L.bodySwap.at), '--swap-ms': ms(L.bodySwap.ms),
  '--handoff-at': ms(L.dieHandoff.at), '--handoff-ms': ms(L.dieHandoff.ms),
  '--text-at': ms(L.text.at), '--text-ms': ms(L.text.ms),
  '--breathe-at': ms(L.breathe.at), '--breathe-ms': ms(L.breathe.periodMs), '--breathe-scale': String(L.breathe.scale),
} as CSSProperties;
const LAYERS: LayerId[] = ['kanat-sol', 'kanat-sag', 'govde', 'yazi'];
const DIE = dieHtml();

/** Görseli yükleyip çözer (çözülmeden oynarsa ilk karede boşluk olur). */
function loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { void (img.decode?.() ?? Promise.resolve()).then(() => resolve(), () => resolve()); };
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

/** Kök sınıfları: kip ve sahne (CSS animasyonları bunlarla başlar). Hazırlıkta yalnızca koyu zemin. */
export function splashClass(s: SplashState): string {
  const scene = s.phase === 'prep' ? 'prep' : s.phase === 'die' ? 'die' : 'logo';
  return ['splash', s.mode, scene, s.phase === 'leaving' || s.phase === 'done' ? 'leaving' : ''].filter(Boolean).join(' ');
}

export default function Splash(props: { kind: SplashKind; onDone: () => void }) {
  const [s, dispatch] = useReducer(splashReducer, undefined, () => initialSplash(props.kind, reducedMotion(), now()));
  const done = useRef(props.onDone);
  done.current = props.onDone;

  // İlk karemiz çizilince index.html'deki statik kare (koyu zemin) kalkar.
  useEffect(() => {
    const id = requestAnimationFrame(() => removeStaticSplash());
    return () => cancelAnimationFrame(id);
  }, []);

  // Görev L4: kapalı kanatlı logo (gövde + kanat) indirilip çözülene dek saat başlamaz; hazır olunca logo ve zar
  // birlikte başlar (prepTimeoutMs aşılırsa statik geniş logo). Açık kanatlı katmanlar zar dönerken yüklenir.
  useEffect(() => {
    if (s.mode !== 'full') return;
    let live = true;
    Promise.all([CLOSED_BODY, CLOSED_WINGS].map((f) => loadImage(`${BASE}${f}`)))
      .then(() => live && dispatch({ type: 'closedReady', at: now() }), () => live && dispatch({ type: 'failed', at: now() }));
    Promise.all(LAYERS.map((id) => loadImage(`${BASE}${layerFile(id)}`)))
      .then(() => live && dispatch({ type: 'ready', at: now() }), () => live && dispatch({ type: 'failed', at: now() }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zar atma sesi: dönüş başında bir kez (motor izin vermediyse ya da efekt kapalıysa sessiz).
  const spinning = s.phase === 'die';
  useEffect(() => { if (spinning) emitDiceSound({ type: 'throw', sides: 20, count: 1 }); }, [spinning]);

  useEffect(() => {
    const d = nextDeadline(s);
    // Ekran görüntüsü betikleri sahneyi dondurabilir (`window.__acilisDur`; kullanıcı ayarı değil).
    if (d === null || (window as { __acilisDur?: boolean }).__acilisDur) return;
    const id = window.setTimeout(() => dispatch({ type: 'tick', at: now() }), Math.max(0, d - now()) + 5);
    return () => window.clearTimeout(id);
  }, [s]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (['Escape', 'Enter', ' '].includes(e.key)) dispatch({ type: 'skip', at: now() }); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const logoFull = s.mode === 'full' && s.phase !== 'die' && s.phase !== 'prep';
  useEffect(() => { if (logoFull) playSplashSound(); }, [logoFull]);
  useEffect(() => { if (s.phase === 'done') done.current(); }, [s.phase]);

  const short = s.mode !== 'full';
  const fadeIn = s.mode === 'short' ? T.resume.fadeInMs : T.reduced.fadeInMs;
  return (
    <div className={splashClass(s)} role="img" aria-label={APP_NAME} style={{ ...TIMING_VARS, transitionDuration: `${fadeMs(s.mode)}ms` }}
      onPointerDown={() => dispatch({ type: 'skip', at: now() })}>
      <div className="splash-stage" style={{ ['--ar' as string]: String(SPLASH_ASPECT) }}>
        {short ? (
          <img className="splash-full" src={`${BASE}${FULL_LOGO}`} alt="" style={{ animationDuration: `${fadeIn}ms` }} />
        ) : (
          <>
            {/* z-sırası (Görev L4): kapalı gövde < geniş gövde < kapalı kanatlar < açık kanatlar (altıgenin önünde) <
                zar < parlama < göz ışığı < yazı. */}
            <div className="splash-breathe">
              <img className="splash-layer splash-kapali" src={`${BASE}${CLOSED_BODY}`} alt="" style={closedStyle()} />
              <img className="splash-layer splash-govde" src={`${BASE}${layerFile('govde')}`} alt="" style={layerStyle('govde')} />
              <img className="splash-layer splash-kapali-kanat" src={`${BASE}${CLOSED_WINGS}`} alt="" style={closedStyle()} />
              <img className="splash-layer splash-wing splash-kanat-sol" src={`${BASE}${layerFile('kanat-sol')}`} alt="" style={layerStyle('kanat-sol')} />
              <img className="splash-layer splash-wing splash-kanat-sag" src={`${BASE}${layerFile('kanat-sag')}`} alt="" style={layerStyle('kanat-sag')} />
              <div className="splash-die-wrap" dangerouslySetInnerHTML={{ __html: DIE }} />
              <span className="splash-flash" style={dieCenterStyle()} />
              <span className="splash-eye" style={eyeStyle()}>
                <i className="eye-ray eye-h" /><i className="eye-ray eye-v" /><i className="eye-ray eye-d1" /><i className="eye-ray eye-d2" /><i className="eye-core" />
                <i className="eye-end" />
              </span>
              <img className="splash-layer splash-yazi" src={`${BASE}${layerFile('yazi')}`} alt="" style={layerStyle('yazi')} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
