/**
 * Dungeondex ekranı (tembel parça; harita/belgeler/DUNGEONDEX-TASARIM.md). Kategori → liste (arama, süzgeç, sayfa) →
 * kayıt kartı; "Lisanslar ve atıf" sayfası. Yalnız okur: savaşa, karakter kâğıdına ya da kayda dokunmaz. Mobilde tek
 * sütun (liste ya da kart), geniş ekranda iki sütun (liste + kart).
 */
import { useEffect, useMemo, useState } from 'react';
import { loadMonsters, monsters } from '../data';
import { t, useLang, type Lang } from '../i18n';
import { APP_NAME } from '../app/appName';
import notice from '../../NOTICE?raw';
import {
  buildDex, dexFilters, dexSearch, loadDexExtras, shownText, DEX_CATS, DEX_PAGE, DEX_SUBCLASS_EXPECTED, DEX_VISIBLE_FILTERS,
  type DexCat, type DexEntry, type DexExtras, type DexLink, type DexText,
} from '../dungeondex/catalog';
import { BookFrame, DexCover, PlateText, useCover } from '../dungeondex/book/Book';
import { bookData } from '../dungeondex/book/kitapData';
import { storedDexCover } from '../ui/dexCoverSetting';
import { IconBook } from '../ui/icons';
import { reducedMotion, useSpriteAnimSetting } from '../ui/effectsSetting';
import { GlyphBadges, GlyphText } from '../ui/glyph/Glyph';
import { altSinifProspektus, buyuProspektus, esyaProspektus, featProspektus, type ProSection } from '../dungeondex/prospektus';
import { subclassesOf } from '../rules/classFeatures';
import { ProspektusSections } from '../dungeondex/prospektus/ProspektusSections';
import './dungeondex.css';

const BASE = import.meta.env.BASE_URL;

const MAP_FILES = import.meta.glob<{ id: string; name: string; gizli?: boolean }>(['../../harita/*/*.json', '!../../harita/_ortak/*.json', '!../../harita/belgeler/*.json'], { import: 'default' });

export type DexView = { cat: DexCat | 'lisans' | null; id: string | null };
type View = DexView;

export function Dungeondex(props: { onBack: () => void; /** Testler: hazır ek veri (yükleme atlanır). */ extras?: Omit<DexExtras, 'mapNames'>; /** Testler: başlangıç görünümü. */ initial?: DexView;
  /** Kapak (Görev DD-Kitap): verilmezse Ayarlar "Kapak animasyonu"; başlangıç görünümü verilince (testler) kapak yok. */ cover?: boolean }) {
  const lang = useLang();
  const [phase, openCover] = useCover(props.cover ?? (props.initial ? false : storedDexCover()));
  // Kitap görselleri kapak kapalıyken önyüklenir (açılınca boş çerçeve görünmesin).
  useEffect(() => {
    const d = bookData();
    for (const f of [d.genis?.file, d.mobil?.file]) if (f) { const img = new Image(); img.src = `${BASE}${f}`; }
  }, []);
  const L = t().dex;
  const [extras, setExtras] = useState<Omit<DexExtras, 'mapNames'> | null>(props.extras ?? null);
  const [mapNames, setMapNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>(props.initial ?? { cat: null, id: null });
  const [trail, setTrail] = useState<View[]>([]);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Record<string, string>>({});
  const [shown, setShown] = useState(DEX_PAGE);

  useEffect(() => {
    if (extras) return;
    let live = true;
    Promise.all([loadMonsters(), loadDexExtras()]).then(([, x]) => { if (live) setExtras(x); }, () => { if (live) setError(true); });
    return () => { live = false; };
  }, [extras]);
  // Canavar ortamları için harita adları (yalnız canavar kategorisi açılınca; gizli haritalar yok).
  const wantMaps = view.cat === 'canavar' && Object.keys(mapNames).length === 0 && !props.extras;
  useEffect(() => {
    if (!wantMaps) return;
    let live = true;
    void Promise.all(Object.values(MAP_FILES).map((l) => l().catch(() => null))).then((list) => {
      if (live) setMapNames(Object.fromEntries(list.flatMap((m) => (m && !m.gizli ? [[m.id, m.name]] : []))));
    });
    return () => { live = false; };
  }, [wantMaps]);

  // Harita adları dile göre (Game Master harita seçicisiyle aynı tablo `gm.mapInfo`; yoksa haritanın kendi adı).
  const dex = useMemo(() => {
    if (!extras) return null;
    const info = t().gm.mapInfo;
    return buildDex({ ...extras, mapNames: Object.fromEntries(Object.entries(mapNames).map(([id, n]) => [id, info[id]?.name ?? n])) });
  }, [extras, mapNames, lang]);
  const list = view.cat && view.cat !== 'lisans' && dex ? dex[view.cat] : [];
  const filters = useMemo(() => (view.cat && view.cat !== 'lisans' ? dexFilters(view.cat, list) : []), [view.cat, list]);
  const found = useMemo(() => dexSearch(list, query, sel), [list, query, sel]);
  const entry = view.id ? list.find((e) => e.id === view.id) ?? null : null;

  const openCat = (cat: View['cat'], filter?: [string, string]) => {
    setTrail([]); setQuery(''); setSel(filter ? { [filter[0]]: filter[1] } : {}); setShown(DEX_PAGE); setView({ cat, id: null });
  };
  const follow = (l: DexLink) => {
    if (l.filter) { openCat(l.cat, l.filter); return; }
    setTrail((tr) => [...tr, view]);
    if (l.cat !== view.cat) { setQuery(''); setSel({}); setShown(DEX_PAGE); }
    setView({ cat: l.cat, id: l.id ?? null });
  };
  const back = () => {
    if (trail.length) { const prev = trail[trail.length - 1]!; setTrail(trail.slice(0, -1)); setView(prev); return; }
    if (view.id) { setView({ ...view, id: null }); return; }
    if (view.cat) { openCat(null); return; }
    props.onBack();
  };

  // Kitapta kayıt ya da kategori değişince sayfa başa döner (sayfa kendi içinde kayar).
  useEffect(() => { document.querySelector('.ddk-page')?.scrollTo?.(0, 0); }, [view.cat, view.id]);
  const title = view.cat === 'lisans' ? L.license : view.cat ? L.cat[view.cat] : L.toc;
  const counts = dex ? L.cover.counts(dex.buyu.length, dex.esya.length, dex.canavar.length) : null;
  const idx = entry ? found.findIndex((e) => e.id === entry.id) : -1;
  const step = (d: number) => { const e = found[idx + d]; if (e) { setTrail([]); setView({ cat: view.cat, id: e.id }); } };
  const page = (
    <main className={`app dex${view.cat && view.cat !== 'lisans' ? ' dex-split' : ''}${entry ? ' dex-has-card' : ''}`}>
      {error && <p className="error">{L.error}</p>}
      {!dex && !error && <p className="mute">{L.loading}</p>}
      {dex && view.cat === null && (
        <nav className="dex-cats" aria-label={L.categories}>
          {DEX_CATS.map((c) => (
            <button key={c} type="button" className="dex-cat" data-testid={`dex-cat-${c}`} onClick={() => openCat(c)}>
              <strong>{L.cat[c]}</strong><span>{L.count(dex[c].length)}</span>
            </button>
          ))}
          <button type="button" className="dex-cat dex-license-btn" data-testid="dex-cat-lisans" onClick={() => openCat('lisans')}><strong>{L.license}</strong><span>SRD 5.2.1 · CC-BY-4.0</span></button>
        </nav>
      )}
      {view.cat === 'lisans' && <License />}
      {dex && view.cat && view.cat !== 'lisans' && (
        <div className="dex-body">
          <section className="dex-list" aria-label={title}>
            <input className="dex-search" type="search" value={query} placeholder={L.search} aria-label={L.search}
              onChange={(e) => { setQuery(e.target.value); setShown(DEX_PAGE); }} />
            {filters.length > 0 && <Filters filters={filters} sel={sel} onChange={(s) => { setSel(s); setShown(DEX_PAGE); }} />}
            {view.cat === 'altsinif' && list.length < DEX_SUBCLASS_EXPECTED && <p className="dex-note" role="status">{L.contentMissing(list.length, DEX_SUBCLASS_EXPECTED)}</p>}
            <p className="mute dex-count">{L.count(found.length)}</p>
            {found.length === 0 && <p className="mute">{L.empty}</p>}
            <ul className="dex-rows">
              {found.slice(0, shown).map((e) => (
                <li key={e.id}>
                  <button type="button" className={`dex-row${e.id === view.id ? ' on' : ''}`} onClick={() => { setTrail([]); setView({ cat: view.cat, id: e.id }); }}>
                    <strong>{e.name}</strong>{e.alt && <em>{e.alt}</em>}<span>{e.header}</span>
                  </button>
                </li>
              ))}
            </ul>
            {found.length > shown && <button type="button" className="dex-more" onClick={() => setShown(shown + DEX_PAGE)}>{L.more(found.length - shown)}</button>}
          </section>
          <section className="dex-card-pane">
            {entry ? <Card entry={entry} onLink={follow} /> : <p className="mute dex-pick">{L.pick}</p>}
          </section>
        </div>
      )}
    </main>
  );
  return (
    <div className="menu-screen dex-screen ddk-screen">
      {phase !== 'closed' && (
        <>
          <div className={`ddk-book${phase !== 'open' ? ' ddk-entering' : ''}`}>
            <BookFrame
              vitrine={<Vitrine entry={entry} />}
              strip={entry ? <PlateText key={entry.id} name={entry.name} tag={L.cat[entry.cat]} /> : <PlateText key={title} name={title ?? L.title} />}
              nav={
                <nav className="ddk-pagenav" aria-label={L.title}>
                  <button type="button" className="dex-back" onClick={back} aria-label={L.back}>← {view.cat && !view.id && !trail.length ? L.toc : L.back}</button>
                  {/* CC-BY-4.0 atfı her görünümden bir dokunuşla (parşömen gezinmesinde; Geri bulunduğun yere döner). */}
                  {view.cat !== 'lisans' && (
                    <button type="button" className="dex-nav-lisans" data-testid="dex-nav-lisans" title={L.license}
                      onClick={() => { setTrail((tr) => [...tr, view]); setView({ cat: 'lisans', id: null }); }}>{L.licenseNav}</button>
                  )}
                  {entry && (
                    <span className="ddk-nav">
                      <button type="button" data-testid="dex-prev" onClick={() => step(-1)} disabled={idx <= 0} aria-label={L.prev} title={L.prev}>‹</button>
                      <button type="button" data-testid="dex-next" onClick={() => step(1)} disabled={idx >= found.length - 1} aria-label={L.next} title={L.next}>›</button>
                    </span>
                  )}
                </nav>
              }
              page={page} />
          </div>
        </>
      )}
      {phase !== 'open' && <DexCover phase={phase} onOpen={openCover} counts={counts} />}
    </div>
  );
}

/**
 * Vitrin penceresi: canavarda jeton; diğer kategorilerde görsel eşlemesi (`data/dungeondex-gorsel-esleme.json`, galeriyle
 * aynı çizim: büyüde efekt şeridi, eşya/feat/durumda glif, tür/sınıfta jeton). Eşleme galerinin tembel parçasıyla gelir.
 */
function Vitrine(props: { entry: DexEntry | null }) {
  const L = t().dex;
  const e = props.entry;
  const [broken, setBroken] = useState<string | null>(null);
  const [gal, setGal] = useState<typeof import('../ui/galeri/Galeri') | null>(null);
  const [spriteAnim] = useSpriteAnimSetting();
  const want = !!e && e.cat !== 'canavar';
  useEffect(() => {
    if (!want || gal) return;
    let live = true;
    void import('../ui/galeri/Galeri').then((m) => { if (live) setGal(m); }).catch(() => {});
    return () => { live = false; };
  }, [want, gal]);
  const src = e?.cat === 'canavar' ? (monsters.find((m) => m.id === e.id)?.avatar ?? `monsters/${e.id}.webp`) : null;
  if (src && broken !== src) return <img src={`${BASE}${src}`} alt={e!.name} onError={() => setBroken(src)} />;
  const rec = e && gal ? gal.dexRecord(e.cat, e.id) : null;
  if (rec && gal) {
    const animated = spriteAnim && !reducedMotion();
    return <div className="ddk-vitrin-vis" role="img" aria-label={e!.name}><gal.Visual r={rec} animated={animated} /></div>;
  }
  return <div className="ddk-vitrin-ph" aria-label={L.vitrine}><IconBook size={48} /><span>{e ? L.cat[e.cat] : L.toc}</span></div>;
}

function Filters(props: { filters: ReturnType<typeof dexFilters>; sel: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  const L = t().dex;
  const one = (f: ReturnType<typeof dexFilters>[number]) => (
    <label key={f.key} className="dex-filter">
      <span>{f.label}</span>
      <select value={props.sel[f.key] ?? ''} onChange={(e) => props.onChange({ ...props.sel, [f.key]: e.target.value })}>
        <option value="">{L.all}</option>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
  const vis = props.filters.slice(0, DEX_VISIBLE_FILTERS);
  const rest = props.filters.slice(DEX_VISIBLE_FILTERS);
  const any = Object.values(props.sel).some(Boolean);
  return (
    <div className="dex-filters">
      {vis.map(one)}
      {rest.length > 0 && <details className="dex-fold"><summary>{L.moreFilters(rest.length)}</summary>{rest.map(one)}</details>}
      {any && <button type="button" className="ghost dex-clear" onClick={() => props.onChange({})}>{L.clear}</button>}
    </div>
  );
}

function Text(props: { d: DexText | undefined; className?: string }) {
  const lang = useLang();
  const s = shownText(props.d, lang);
  if (!s) return null;
  // Ortak simgeler (glif) yalnız açıklama metninde (tr/en); arayüz özeti (`ui`) ham SRD metnine düşebilir, dokunulmaz.
  const desc = s.text === props.d?.tr || s.text === props.d?.en;
  return <p className={props.className}>{desc ? <GlyphText text={s.text} /> : s.text}{s.trOnly && <span className="dex-tronly"> ({t().common.descTrOnly})</span>}</p>;
}

/**
 * Prospektüs bölümleri (kabuğun sağ sayfası): kimliği prospektüs verisiyle aynı olan eşya, büyü ve feat; alt sınıfta yüklü
 * alt sınıf verisinden yalnız kartta olmayan bölümler (durum sayımı, yerine geçtiği; rol ve özellik satırları kartta); diğerlerinde yok.
 * EN arayüzde yalnız Türkçe yazılmış satırlar gösterilmez (`spellDescriptionShown` ile aynı kural: EN karşılığı yoksa gizli);
 * veri satırları ve durum rozeti kalır.
 */
function proSections(e: DexEntry, lang: Lang): ProSection[] | null {
  const P = t().dex.pro;
  const sub = e.cat === 'altsinif' ? subclassesOf(e.f.cls ?? '').find((x) => x.id === e.id) : undefined;
  const s = e.cat === 'esya' ? esyaProspektus(e.id, P, lang) : e.cat === 'buyu' ? buyuProspektus(e.id, P, lang) : e.cat === 'feat' ? featProspektus(e.id, P, lang)
    : sub ? altSinifProspektus(sub, P, lang) : null;
  return s && lang === 'en' ? s.map((x) => ({ ...x, rows: x.rows.filter((r) => !r.trOnly) })) : s;
}

function Card(props: { entry: DexEntry; onLink: (l: DexLink) => void }) {
  const L = t().dex;
  const lang = useLang();
  const e = props.entry;
  const pro = proSections(e, lang);
  return (
    <article className="dex-card" data-testid="dex-card" aria-label={e.name}>
      <h2>{e.name}<GlyphBadges list={e.glif} /></h2>
      {e.alt && <p className="dex-alt">{e.alt}</p>}
      <p className="dex-header">{e.header}</p>
      {e.tags.length > 0 && <p className="dex-tags">{e.tags.map((x) => <span key={x} className="dex-tag">{x}</span>)}</p>}
      <Text d={e.summary} className="dex-summary" />
      {e.desc ? <Text d={e.desc} className="dex-desc" /> : e.sections.length === 0 && <p className="mute dex-desc">{L.noDesc}</p>}
      <Text d={e.extra} className="dex-extra" />
      {e.facts.length > 0 && (
        <dl className="dex-facts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      )}
      {pro && <ProspektusSections sections={pro} />}
      {e.sections.map((s) => (
        <section key={s.title} className="dex-sec">
          <h3>{s.title}</h3>
          <ul>
            {s.rows.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <strong>{r.level !== undefined && <span className="dex-lvl">{L.levelShort(r.level)} </span>}{r.name}<GlyphBadges list={[r.glif]} /></strong>
                {r.tag && <span className="dex-tag">{r.tag}</span>}
                <Text d={r.text} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {e.links.length > 0 && (
        <section className="dex-sec">
          <h3>{L.sec.links}</h3>
          <p className="dex-links">{e.links.map((l, i) => <button key={`${l.cat}-${l.id ?? l.filter?.join('=')}-${i}`} type="button" className="ghost dex-link" onClick={() => props.onLink(l)}>{l.label}</button>)}</p>
        </section>
      )}
    </article>
  );
}

/** "Lisanslar ve atıf": NOTICE metni olduğu gibi (ilk satır depo adı, gösterilmez) + kısa açıklama. */
function License() {
  const L = t().dex;
  const body = notice.split(/\r?\n/).slice(1).join('\n').trim();
  return (
    <article className="dex-card dex-license" data-testid="dex-license">
      <p>{L.licenseIntro(APP_NAME)}</p>
      <blockquote lang="en">{body}</blockquote>
      <p>{L.licenseNote}</p>
      <p className="mute">{L.licenseLink}</p>
    </article>
  );
}
