/**
 * Dungeondex ekranı (tembel parça; harita/belgeler/DUNGEONDEX-TASARIM.md). Kategori → liste (arama, süzgeç, sayfa) →
 * kayıt kartı; "Lisanslar ve atıf" sayfası. Yalnız okur: savaşa, karakter kâğıdına ya da kayda dokunmaz. Mobilde tek
 * sütun (liste ya da kart), geniş ekranda iki sütun (liste + kart).
 */
import { useEffect, useMemo, useState } from 'react';
import { loadMonsters } from '../data';
import { t, useLang } from '../i18n';
import { APP_NAME } from '../app/appName';
import notice from '../../NOTICE?raw';
import {
  buildDex, dexFilters, dexSearch, loadDexExtras, shownText, DEX_CATS, DEX_PAGE, DEX_SUBCLASS_EXPECTED, DEX_VISIBLE_FILTERS,
  type DexCat, type DexEntry, type DexExtras, type DexLink, type DexText,
} from '../dungeondex/catalog';
import './dungeondex.css';

const MAP_FILES = import.meta.glob<{ id: string; name: string; gizli?: boolean }>(['../../harita/*/*.json', '!../../harita/_ortak/*.json', '!../../harita/belgeler/*.json'], { import: 'default' });

export type DexView = { cat: DexCat | 'lisans' | null; id: string | null };
type View = DexView;

export function Dungeondex(props: { onBack: () => void; /** Testler: hazır ek veri (yükleme atlanır). */ extras?: Omit<DexExtras, 'mapNames'>; /** Testler: başlangıç görünümü. */ initial?: DexView }) {
  const lang = useLang();
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

  const dex = useMemo(() => (extras ? buildDex({ ...extras, mapNames }) : null), [extras, mapNames, lang]);
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

  const title = view.cat === 'lisans' ? L.license : view.cat ? L.cat[view.cat] : L.title;
  return (
    <div className="menu-screen dex-screen">
      <main className={`app dex${view.cat && view.cat !== 'lisans' ? ' dex-split' : ''}${entry ? ' dex-has-card' : ''}`}>
        <header className="dex-top">
          <button type="button" className="dex-back" onClick={back} aria-label={L.back}>← {L.back}</button>
          <h1>{title}</h1>
        </header>
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
    </div>
  );
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
  return <p className={props.className}>{s.text}{s.trOnly && <span className="dex-tronly"> ({t().common.descTrOnly})</span>}</p>;
}

function Card(props: { entry: DexEntry; onLink: (l: DexLink) => void }) {
  const L = t().dex;
  const e = props.entry;
  return (
    <article className="dex-card" data-testid="dex-card" aria-label={e.name}>
      <h2>{e.name}</h2>
      {e.alt && <p className="dex-alt">{e.alt}</p>}
      <p className="dex-header">{e.header}</p>
      {e.tags.length > 0 && <p className="dex-tags">{e.tags.map((x) => <span key={x} className="dex-tag">{x}</span>)}</p>}
      <Text d={e.summary} className="dex-summary" />
      {e.desc ? <Text d={e.desc} className="dex-desc" /> : e.sections.length === 0 && <p className="mute dex-desc">{L.noDesc}</p>}
      <Text d={e.extra} className="dex-extra" />
      {e.facts.length > 0 && (
        <dl className="dex-facts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      )}
      {e.sections.map((s) => (
        <section key={s.title} className="dex-sec">
          <h3>{s.title}</h3>
          <ul>
            {s.rows.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <strong>{r.level !== undefined && <span className="dex-lvl">{L.levelShort(r.level)} </span>}{r.name}</strong>
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
