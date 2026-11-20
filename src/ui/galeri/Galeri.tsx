/**
 * Görsel envanter galerisi (`#galeri`; Game Master / geliştirici aracı, tembel parça; ana parçaya girmez). Yalnız görünüm:
 * `data/dungeondex-gorsel-esleme.json` (`npm run dd-gorsel`) kayıtlarını kategori sekmelerinde kare kare çizer. Büyü ve durumda
 * efekt döngüsü savaştaki şerit bileşeniyle (`FxLayer` `Strip`), aynı anda en çok `MAX_ANIMATED` (8) animasyon (görünen ilk
 * kareler); "hareketi azalt" ya da efekt animasyonu kapalıyken statik tek kare. Yedek (görselsiz) kayıt kırmızı, genel
 * (paylaşılan) kayıt sarı kesik çerçeve. Belge harita/belgeler/GORSEL-ENVANTER.md.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import esleme from '../../../data/dungeondex-gorsel-esleme.json';
import sizes from '../../../data/token-sizes.json';
import { FX, type FxSprite } from '../fx/fxPlan';
import { Strip } from '../fx/FxLayer';
import { MAX_ANIMATED, STATUS_SPRITES } from '../statusFx';
import { CharacterFigure } from '../Avatar';
import { sheetAvatar } from '../../battle/avatar';
import type { CharacterSheet } from '../../rules/stats';
import { reducedMotion, useSpriteAnimSetting } from '../effectsSetting';
import { footprint, type FootprintSize } from '../../rules/footprint';
import { HEX_W, VIEW, hexCenter, hexPoints } from '../mapView';
import { t, getLang } from '../../i18n';
import './galeri.css';

interface Gorunum { raceId: string; lineageId?: string; celestialAwakening?: string; classId?: string; subclassId?: string; gender?: 'erkek' | 'kadin' }
export interface GaleriRec { kaynak: string; ref: string; durum: 'var' | 'genel' | 'yedek'; ad: string; not?: string; efekt?: string; nadirlikRengi?: string; gorunum?: Gorunum; glif?: string }
const E = esleme as unknown as { yedekler: Record<string, { glif: string; tr: string; en: string }>;
  kategoriler: Record<string, Record<string, GaleriRec>>; ek: Record<string, Record<string, GaleriRec>> };
export const GALERI_TABS = ['buyu', 'esya', 'canavar', 'tur', 'altsoy', 'sinif', 'altsinif', 'feat', 'gecmis', 'durum', 'yuzey', 'nesne', 'alan', 'zar', 'boyut'] as const;
export type GaleriTab = (typeof GALERI_TABS)[number];
const BASE = import.meta.env.BASE_URL;
const PAGE = 60;

/** Sekmenin kayıtları (kimlik → kayıt), sıralı. */
export function tabRecords(tab: GaleriTab): Array<[string, GaleriRec]> {
  const src = E.kategoriler[tab] ?? E.ek[tab] ?? {};
  return Object.entries(src).sort((a, b) => a[1].ad.localeCompare(b[1].ad, 'tr'));
}
/** Arama (ad ya da kimlik) ve "yalnız eksikler" (genel + yedek). */
export function filterRecords(list: Array<[string, GaleriRec]>, q: string, onlyMissing: boolean): Array<[string, GaleriRec]> {
  const k = q.trim().toLocaleLowerCase('tr');
  return list.filter(([id, r]) => (!onlyMissing || r.durum !== 'var') && (!k || id.includes(k) || r.ad.toLocaleLowerCase('tr').includes(k)));
}

/** Kaydın efekt şeridi: `fxPlan` kaydı ya da durum döngüsü (`dongu:<kimlik>`, yatay şerit). */
export function spriteOf(r: GaleriRec): FxSprite | null {
  if (!r.efekt) return null;
  if (r.efekt.startsWith('dongu:')) {
    const l = STATUS_SPRITES.find((s) => s.id === r.efekt!.slice(6));
    return l ? { id: l.id, file: l.file, frames: l.frames, ms: l.frames * l.frameMs, kind: 'status', loop: true, w: l.size, h: l.size, dir: null, blend: 'screen', overlap: 0 } : null;
  }
  return FX[r.efekt] ?? null;
}
const sheetOf = (g: Gorunum): CharacterSheet => ({ raceId: g.raceId, classId: g.classId ?? 'fighter', gender: g.gender ?? 'erkek', level: 5,
  ...(g.lineageId ? { lineageId: g.lineageId } : {}), ...(g.subclassId ? { subclassId: g.subclassId } : {}), ...(g.celestialAwakening ? { celestialAwakening: g.celestialAwakening } : {}) }) as unknown as CharacterSheet;

function Visual({ r, animated }: { r: GaleriRec; animated: boolean }) {
  const sp = spriteOf(r);
  if (sp && sp.frames > 1) {
    return (
      <svg className="gal-fx" viewBox={`0 0 ${sp.w} ${sp.h}`} aria-hidden="true">
        <Strip s={sp} x={0} y={0} w={sp.w} h={sp.h} animated={animated} loop />
      </svg>
    );
  }
  if (r.gorunum) return <CharacterFigure avatar={sheetAvatar(sheetOf(r.gorunum))} size={76} title={r.ad} />;
  if (r.kaynak !== 'yedek') return <img className="gal-img" src={`${BASE}${r.ref}`} alt="" loading="lazy" decoding="async" />;
  const y = E.yedekler[r.ref.slice(6)];
  return <span className="gal-glyph" style={r.nadirlikRengi ? { borderColor: r.nadirlikRengi, color: r.nadirlikRengi } : undefined} title={y ? (getLang() === 'en' ? y.en : y.tr) : undefined}>{r.glif ?? y?.glif ?? '?'}</span>;
}

/** Boyut sekmesi: jeton ölçeği × altıgen (anahtar kapalı) ve çok altıgenli gövde (anahtar açık); ekran ölçüleri. */
function SizePanel() {
  const G = t().galeri.size;
  const SC = sizes.scale as Record<string, number>;
  const rep: Record<FootprintSize, string> = { T: 'rat', S: 'goblin-warrior', M: 'bandit', L: 'owlbear', H: 'adult-red-dragon', G: 'ancient-red-dragon' };
  const HH = VIEW.h / 7.5;
  const anchor = { col: 10, row: 8 };
  const c0 = hexCenter(anchor);
  const vps: Array<[number, number]> = [[1280, 800], [844, 390], [390, 844]];
  return (
    <div className="gal-size">
      <p className="mute">{G.intro}</p>
      <div className="gal-size-grid">
        {(['T', 'S', 'M', 'L', 'H', 'G'] as FootprintSize[]).map((s) => {
          const body = footprint(anchor, s);
          const d = 0.72 * HH * (SC[s] ?? 1);
          // Oyundaki gibi: kapalıyken jeton kendi altıgeninde, açıkken gövde altıgen merkezlerinin ortalamasında (`tokenCenter`).
          const ps = body.map(hexCenter);
          const c1 = { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
          const R = HH * 3.1;
          const view = (c: { x: number; y: number }, on: boolean) => (
            <svg viewBox={`${c0.x - R} ${c0.y - R} ${2 * R} ${2 * R}`} role="img" aria-label={`${s} ${on ? G.on : G.off}`}>
              {[anchor, ...footprint(anchor, 'G')].map((h, i) => <polygon key={`g${i}`} points={hexPoints(h)} className="gal-hex" />)}
              {on ? body.map((h, i) => <polygon key={`b${i}`} points={hexPoints(h)} className="gal-body" />) : <polygon points={hexPoints(anchor)} className="gal-anchor" />}
              <image href={`${BASE}monsters/${rep[s]}.webp`} x={c.x - d / 2} y={c.y - d / 2} width={d} height={d} />
            </svg>
          );
          return (
            <figure key={s} className="gal-size-cell">
              <div className="gal-size-pair">
                <div>{view(c0, false)}<small>{G.off}</small></div>
                <div>{view(c1, true)}<small>{G.on}: {G.hexes(body.length)}</small></div>
              </div>
              <figcaption><b>{s}</b> · {G.scale(String(SC[s] ?? 1))}</figcaption>
            </figure>
          );
        })}
      </div>
      <table className="gal-size-table">
        <thead><tr><th>{G.screen}</th><th>{G.hex}</th><th>{G.token}</th><th>{G.badge}</th></tr></thead>
        <tbody>{vps.map(([w, h]) => {
          const k = Math.min(w, h * (VIEW.w / VIEW.h)) / VIEW.w;
          return <tr key={`${w}x${h}`}><td>{w}×{h}</td><td>{Math.round(HEX_W * k)} px</td><td>{Math.round(0.72 * HH * k)} px</td><td>{Math.round(22 * k)} px</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}

export default function Galeri(props: { onClose: () => void; initialTab?: GaleriTab }) {
  const G = t().galeri;
  const [tab, setTab] = useState<GaleriTab>(props.initialTab ?? 'buyu');
  const [q, setQ] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [spriteAnim] = useSpriteAnimSetting();
  const motion = spriteAnim && !reducedMotion();
  const all = useMemo(() => (tab === 'boyut' ? [] : tabRecords(tab)), [tab]);
  const list = useMemo(() => filterRecords(all, q, onlyMissing), [all, q, onlyMissing]);
  useEffect(() => { setLimit(PAGE); }, [tab, q, onlyMissing]);
  const shown = list.slice(0, limit);

  // Animasyon bütçesi: ekranda görünen animasyonlu karelerin ilk MAX_ANIMATED tanesi (IntersectionObserver; yoksa ilk kareler).
  const [visible, setVisible] = useState<ReadonlySet<string>>(new Set());
  const io = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    io.current = new IntersectionObserver((ents) => setVisible((prev) => {
      const n = new Set(prev);
      for (const e of ents) { const k = (e.target as HTMLElement).dataset.key ?? ''; if (e.isIntersecting) n.add(k); else n.delete(k); }
      return n;
    }));
    return () => io.current?.disconnect();
  }, []);
  const animated = useMemo(() => {
    if (!motion) return new Set<string>();
    const can = shown.filter(([, r]) => (spriteOf(r)?.frames ?? 0) > 1).map(([id]) => `${tab}/${id}`);
    const vis = io.current ? can.filter((k) => visible.has(k)) : can;
    return new Set(vis.slice(0, MAX_ANIMATED));
  }, [shown, visible, motion, tab]);
  const count = (d: string) => all.filter(([, r]) => r.durum === d).length;

  return (
    <div className="menu-screen galeri-screen">
      <main className="app galeri">
        <header>
          <h1>{G.title}</h1>
          <button type="button" className="ghost" onClick={props.onClose}>{G.close}</button>
        </header>
        <nav className="gal-tabs" role="tablist" aria-label={G.title}>
          {GALERI_TABS.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : 'ghost'} onClick={() => setTab(k)}>{G.tabs[k] ?? k}</button>
          ))}
        </nav>
        {tab === 'boyut' ? <SizePanel /> : (
          <>
            <div className="gal-bar">
              <input type="search" value={q} placeholder={G.search} aria-label={G.search} onChange={(e) => setQ(e.target.value)} />
              <label className="gal-check"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> {G.onlyMissing}</label>
            </div>
            <p className="gal-count mute">{G.count(all.length, count('var'), count('genel'), count('yedek'))} · {motion ? G.anim(MAX_ANIMATED) : G.still}</p>
            <p className="gal-legend"><span className="gal-key var" />{G.legend.var} <span className="gal-key genel" />{G.legend.genel} <span className="gal-key yedek" />{G.legend.yedek}</p>
            {shown.length === 0 ? <p className="mute">{G.empty}</p> : (
              <ul className="gal-grid">
                {shown.map(([id, r]) => {
                  const key = `${tab}/${id}`;
                  return (
                    <li key={key} data-key={key} className={`gal-tile ${r.durum}`} title={[id, r.efekt ?? r.ref, r.not].filter(Boolean).join('\n')}
                      ref={(el) => { if (el) io.current?.observe(el); }}>
                      <div className="gal-vis"><Visual r={r} animated={animated.has(key)} /></div>
                      <div className="gal-name">{r.ad}</div>
                      <div className="gal-src">{G.kaynak[r.kaynak] ?? r.kaynak}{r.efekt ? ` · ${r.efekt.replace(/^dongu:/, '')}` : ''}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {list.length > limit && <button type="button" className="ghost gal-more" onClick={() => setLimit((n) => n + PAGE)}>{G.more(Math.min(PAGE, list.length - limit))}</button>}
          </>
        )}
      </main>
    </div>
  );
}
