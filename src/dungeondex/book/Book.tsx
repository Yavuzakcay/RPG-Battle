/**
 * Dungeondex "Kitap" kabuğu (Görev DD-Kitap; tembel parça, yalnız `src/screens/Dungeondex.tsx` içe aktarır; yalnız
 * görünüm). Kapak (kapalı → kanatlar açılır → kapak sol menteşe etrafında döner, açık kitap çapraz solarak belirir) ve
 * açık kitap çerçevesi (geniş ya da mobil görsel; kutular `data/dungeondex-kitap.json`, görsel en-boy oranını koruyarak
 * ekrana sığar, kutular yüzdelikle konumlanır). Kapaktaki ejderha açılış ekranının katmanlarıdır (`splashLogic.ts`:
 * kapalı gövde/kanat, açık kanat katlanma pozu, CSS d20; stiller index.html'deki `splash.css`), yeni resim yok.
 * Görsel üretilmemişse (`null`) kapak ve kitap çerçevesiz düz düzenle çizilir.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
    '--fade-ms': ms(A.solmaMs), '--pulse-ms': ms(A.nabizMs), ...(d?.zemin ? { '--deri': d.zemin } : {}),
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

/**
 * Açık kitap: vitrin penceresi, vitrin altı isim plakası ve sağ (mobilde alt) parşömen sayfa; sayfa güvenli alanda kayar.
 * Tasarımda liste/arama/sekme yeri yok: içindekiler (kategoriler, arama, liste) ve gezinme (geri, önceki/sonraki)
 * parşömenin içinde (`nav` üstte yapışık), kitabın dışında çubuk yok.
 */
export function BookFrame(props: { vitrine: ReactNode; strip: ReactNode; page: ReactNode; nav?: ReactNode; className?: string }) {
  const kind = useFrameKind();
  const d = kind === 'duz' ? null : bookData()[kind];
  if (!d) {
    return (
      <div className={`ddk-frame ddk-duz ${props.className ?? ''}`} data-frame="duz">
        <div className="ddk-vitrin">{props.vitrine}</div>
        <div className="ddk-serit">{props.strip}</div>
        <div className="ddk-page">{props.nav}{props.page}</div>
      </div>
    );
  }
  return (
    <div className={`ddk-fit ${props.className ?? ''}`}>
      <div className={`ddk-frame ddk-img ddk-${kind}`} data-frame={kind} style={{ '--ar': String(d.aspect) } as CSSProperties}>
        <img className="ddk-frame-img" src={`${BASE}${d.file}`} alt="" draggable={false} />
        <div className="ddk-vitrin" style={boxStyle(d.vitrin)}>{props.vitrine}</div>
        <div className="ddk-serit" style={boxStyle(stripBox(d))}>{props.strip}</div>
        <div className="ddk-page" style={boxStyle(d.guvenli)}>{props.nav}{props.page}</div>
      </div>
    </div>
  );
}

/** Plaka yazısının en küçük okunur boyutu (px); altına inilmez, sonra etiket düşer, en son üç nokta. */
export const PLATE_MIN_PX = 11;
/** Kategori etiketi bu boyutun altında gizlenir. */
export const PLATE_TAG_MIN_PX = 14;
/** Plakanın iç ölçüsü (dolgu hariç). */
function inner(box: HTMLElement): { w: number; h: number } {
  const cs = getComputedStyle(box);
  return { w: box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), h: box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) };
}
type PlateFit = { px: number | null; tag: boolean; lines: 1 | 2; cut: boolean };

/**
 * İsim plakası yazısı: ad plakaya sığana dek küçülür (CSS'teki en büyük boyuttan `PLATE_MIN_PX`'e); sığmazsa önce
 * kategori etiketi gizlenir, sonra plaka yüksekliği elveriyorsa iki satır, en son tek satırda üç nokta (tam ad `title`'da).
 * Ölçü: adın doğal eni (`scrollWidth`, tek satır) + etiket eni ≤ plakanın iç eni; satır yüksekliği × satır ≤ iç yükseklik.
 */
export function PlateText(props: { name: string; tag?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<PlateFit>({ px: null, tag: true, lines: 1, cut: false });
  useLayoutEffect(() => {
    const el = ref.current, box = el?.parentElement;
    if (!el || !box) return;
    const name = el.querySelector('strong') as HTMLElement | null, tag = el.querySelector('em') as HTMLElement | null;
    if (!name) return;
    const run = () => {
      el.style.fontSize = '';
      el.dataset.lines = '1'; el.dataset.cut = ''; el.dataset.tag = '1';
      const max = parseFloat(getComputedStyle(el).fontSize) || 18;
      const { w, h } = inner(box);
      const lineH = (px: number) => px * 1.15;
      const fits = (px: number, withTag: boolean, lines: 1 | 2): boolean => {
        el.style.fontSize = `${px}px`;
        el.dataset.tag = withTag ? '1' : '';
        const tagW = withTag && tag ? tag.offsetWidth + px * 0.5 : 0;
        if (lines === 1) return name.scrollWidth <= name.clientWidth + 0.5 && name.scrollWidth + tagW <= w + 0.5 && lineH(px) <= h + 1;
        // iki satır: adın doğal eni iki satıra bölünebilmeli (kaba ölçü, sözcük sınırı payıyla) ve yükseklik yetmeli
        return name.scrollWidth <= (w - tagW) * 1.8 && lineH(px) * 2 <= h + 1;
      };
      const tries: Array<[boolean, 1 | 2]> = props.tag ? [[true, 1], [false, 1], [false, 2]] : [[false, 1], [false, 2]];
      for (const [withTag, lines] of tries) {
        // etiketle en çok PLATE_TAG_MIN_PX'e kadar küçülür; daha küçüğü gerekiyorsa etiket düşer, ad büyük kalır
        for (let px = max; px >= (withTag ? Math.max(PLATE_MIN_PX, PLATE_TAG_MIN_PX) : PLATE_MIN_PX); px -= 0.5) {
          if (fits(px, withTag, lines)) { setFit({ px, tag: withTag, lines, cut: false }); return; }
        }
      }
      setFit({ px: PLATE_MIN_PX, tag: false, lines: 1, cut: true });
    };
    run();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(run);
    ro?.observe(box);
    return () => ro?.disconnect();
  }, [props.name, props.tag]);
  return (
    <span ref={ref} className={`ddk-plate${fit.cut ? ' ddk-plate-cut' : ''}`} data-tag={fit.tag ? '1' : ''} data-cut={fit.cut ? '1' : ''} data-lines={fit.lines}
      style={fit.px ? { fontSize: `${fit.px}px` } : undefined} title={props.name}>
      <strong>{props.name}</strong>{props.tag && <em>{props.tag}</em>}
    </span>
  );
}
