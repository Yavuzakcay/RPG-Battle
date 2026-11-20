/**
 * Dungeondex "Kitap" kabuğu (Görev DD-Kitap; tembel parça, yalnız `src/screens/Dungeondex.tsx` içe aktarır; yalnız
 * görünüm). Kapak (kapalı → kanatlar açılır → kapak sol menteşe etrafında döner, açık kitap çapraz solarak belirir) ve
 * açık kitap çerçevesi (geniş ya da mobil görsel; kutular `data/dungeondex-kitap.json`, görsel en-boy oranını koruyarak
 * ekrana sığar, kutular yüzdelikle konumlanır). Kapaktaki ejderha açılış ekranının katmanlarıdır (`splashLogic.ts`:
 * kapalı gövde/kanat, açık kanat katlanma pozu, CSS d20; stiller index.html'deki `splash.css`), yeni resim yok.
 * Görsel üretilmemişse (`null`) kapak ve kitap çerçevesiz düz düzenle çizilir.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { t } from '../../i18n';
import { CLOSED_BODY, CLOSED_WINGS, closedStyle, dieHtml, eyePoints, layerFile, layerStyle } from '../../ui/splashLogic';
import { reducedMotion } from '../../ui/effectsSetting';
import { wingAnimAllowed } from '../../ui/wingAnim';
import { deviceCapable } from '../../ui/dice3dSupport';
import { BOOK_ANIM as A, bookData, boxStyle, frameFor, logoStageIn, stripBox, type CoverData, type FrameKind } from './kitapData';
import type { Box } from './measure';
import './book.css';

const BASE = import.meta.env.BASE_URL;
const ms = (v: number) => `${v}ms`;

export type CoverPhase = 'closed' | 'wings' | 'turn' | 'fade' | 'open';
export type CoverMotion = 'full' | 'reduced';

/** Kanat/kapak animasyonu izni: hareketi azalt, efekt animasyonu kapalı ya da zayıf cihazda statik + kısa fade. */
export function coverMotion(): CoverMotion {
  return !reducedMotion() && wingAnimAllowed() && deviceCapable() ? 'full' : 'reduced';
}
/** Dokununca sıradaki adımlar ve süreleri (ms). */
export function coverSteps(m: CoverMotion): Array<[CoverPhase, number]> {
  return m === 'full'
    ? [['wings', A.kanatGecikmeMs + A.kanatMs + A.govdeGecisMs], ['turn', A.kapakMs], ['open', 0]]
    : [['fade', A.solmaMs], ['open', 0]];
}

/** Kapak durumu: her girişte bir kez; ayar kapalıysa doğrudan açık. Sekme gizlenince geçiş atlanır (animasyon durur). */
export function useCover(enabled: boolean): [CoverPhase, () => void] {
  const [phase, setPhase] = useState<CoverPhase>(enabled ? 'closed' : 'open');
  const [steps, setSteps] = useState<Array<[CoverPhase, number]>>([]);
  useEffect(() => {
    if (!steps.length) return;
    const [[p, d], ...rest] = steps as [[CoverPhase, number], ...Array<[CoverPhase, number]>];
    setPhase(p);
    if (!rest.length) return;
    const id = window.setTimeout(() => setSteps(rest), d);
    return () => window.clearTimeout(id);
  }, [steps]);
  useEffect(() => {
    if (phase === 'closed' || phase === 'open') return;
    const vis = () => { if (document.hidden) { setSteps([]); setPhase('open'); } };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [phase]);
  const open = () => { if (phase === 'closed') setSteps(coverSteps(coverMotion())); };
  return [phase, open];
}

/** Sekme gizli mi (kapalı kapakta göz nabzı durur). */
function useHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const f = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  return hidden;
}

/** Çerçevesiz kapak düzeni (kapak görseli yokken; 3:4). */
const PLAIN_COVER: Omit<CoverData, 'file' | 'width' | 'height' | 'altigen'> = {
  aspect: 0.75, pencere: { x: 0.1, y: 0.2, w: 0.8, h: 0.58 }, ustSerit: { x: 0.15, y: 0.05, w: 0.7, h: 0.1 }, altSerit: { x: 0.12, y: 0.82, w: 0.76, h: 0.13 }, toka: null,
};
const DIE = dieHtml();

/** Kapaktaki ejderha: kapalı kanatlı gövde + kanat, d20 son pozda; açılırken açık kanatlar katlı pozdan açılır. */
function CoverLogo(props: { win: Box; aspect: number }) {
  const eye = eyePoints().closed;
  return (
    <div className="ddk-logo" style={logoStageIn(props.win, props.aspect)} aria-hidden="true">
      <div className="ddk-logo-in">
        <img className="splash-layer splash-kapali" src={`${BASE}${CLOSED_BODY}`} alt="" style={closedStyle()} />
        <img className="splash-layer splash-govde" src={`${BASE}${layerFile('govde')}`} alt="" style={layerStyle('govde')} />
        <img className="splash-layer splash-kapali-kanat" src={`${BASE}${CLOSED_WINGS}`} alt="" style={closedStyle()} />
        <img className="splash-layer splash-wing splash-kanat-sol" src={`${BASE}${layerFile('kanat-sol')}`} alt="" style={layerStyle('kanat-sol')} />
        <img className="splash-layer splash-wing splash-kanat-sag" src={`${BASE}${layerFile('kanat-sag')}`} alt="" style={layerStyle('kanat-sag')} />
        <div className="splash-die-wrap" dangerouslySetInnerHTML={{ __html: DIE }} />
        <span className="ddk-eye" style={{ left: `${eye.x * 100}%`, top: `${eye.y * 100}%` }} />
      </div>
    </div>
  );
}

export function DexCover(props: { phase: CoverPhase; onOpen: () => void; counts: string | null }) {
  const L = t().dex.cover;
  const hidden = useHidden();
  const [motion] = useState(coverMotion);
  const d = bookData().kapak;
  const c = d ?? PLAIN_COVER;
  const vars = {
    '--ar': String(c.aspect), '--wing-at': ms(A.kanatGecikmeMs), '--wing-ms': ms(A.kanatMs), '--cwing-out': ms(A.kapaliKanatSonMs),
    '--swap-at': ms(A.kanatGecikmeMs + A.kanatMs), '--swap-ms': ms(A.govdeGecisMs), '--turn-ms': ms(A.kapakMs), '--turn-deg': `${A.kapakAci}deg`,
    '--fade-ms': ms(A.solmaMs), '--pulse-ms': ms(A.nabizMs),
  } as CSSProperties;
  return (
    <div className={`ddk-cover ddk-${props.phase}${d ? ' ddk-has-img' : ' ddk-no-img'}${hidden ? ' ddk-paused' : ''}${motion === 'reduced' ? ' ddk-static' : ''}`} style={vars}
      role="button" tabIndex={0} aria-label={L.open} data-testid="dex-cover"
      onClick={props.onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onOpen(); } }}>
      <div className="ddk-cover-fit">
        <div className="ddk-cover-box">
          {d && <img className="ddk-cover-img" src={`${BASE}${d.file}`} alt="" draggable={false} />}
          <CoverLogo win={c.pencere} aspect={c.aspect} />
          {c.ustSerit && <div className="ddk-cstrip ddk-cstrip-top" style={boxStyle(c.ustSerit)}><span>{L.top}</span></div>}
          {c.altSerit && (
            <div className="ddk-cstrip ddk-cstrip-bottom" style={boxStyle(c.altSerit)}>
              <span>{L.tap}</span>
              <small>{props.counts ?? ' '}</small>
            </div>
          )}
          {c.toka && <span className="ddk-toka" style={{ left: `${c.toka.x * 100}%`, top: `${c.toka.y * 100}%` }} />}
        </div>
      </div>
    </div>
  );
}

/** Ekran boyutuna göre çerçeve (dar/dik: mobil). */
export function useFrameKind(): FrameKind {
  const size = () => (typeof window === 'undefined' ? [1200, 800] as const : [window.innerWidth, window.innerHeight] as const);
  const [kind, setKind] = useState<FrameKind>(() => frameFor(...size()));
  useEffect(() => {
    const f = () => setKind(frameFor(...size()));
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return kind;
}

/** Açık kitap: vitrin penceresi, vitrin altı isim şeridi ve sağ (mobilde alt) sayfa; sayfa güvenli alanda kayar. */
export function BookFrame(props: { vitrine: ReactNode; strip: ReactNode; page: ReactNode; className?: string }) {
  const kind = useFrameKind();
  const d = kind === 'duz' ? null : bookData()[kind];
  if (!d) {
    return (
      <div className={`ddk-frame ddk-duz ${props.className ?? ''}`} data-frame="duz">
        <div className="ddk-vitrin">{props.vitrine}</div>
        <div className="ddk-serit">{props.strip}</div>
        <div className="ddk-page">{props.page}</div>
      </div>
    );
  }
  return (
    <div className={`ddk-fit ${props.className ?? ''}`}>
      <div className={`ddk-frame ddk-img ddk-${kind}`} data-frame={kind} style={{ '--ar': String(d.aspect) } as CSSProperties}>
        <img className="ddk-frame-img" src={`${BASE}${d.file}`} alt="" draggable={false} />
        <div className="ddk-vitrin" style={boxStyle(d.vitrin)}>{props.vitrine}</div>
        <div className="ddk-serit" style={boxStyle(stripBox(d))}>{props.strip}</div>
        <div className="ddk-page" style={boxStyle(d.guvenli)}>{props.page}</div>
      </div>
    </div>
  );
}
