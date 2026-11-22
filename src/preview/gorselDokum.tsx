/**
 * Görsel döküm sayfası (yalnız geliştirme; `npm run dev` → /onizleme-dokum.html, `npm run gorsel-dokum` sürer; build girdisi değil).
 * Oyuncunun ulaşabildiği her karakter görünüşünü oyunun KENDİ bileşenleriyle çizer:
 * - karakter ekranı: `CharacterFigure` (karakter listesi kartı / sihirbaz önizlemesi; uçma yeteneği → kanat), savaş çekmecesi ve
 *   sıra şeridi rozeti (`LookFrame` + `AvatarBadge`, 56 ve 30 px; 30 px küçük kopyayı kullanır), karakter sayfası portresi (`SheetPortrait`),
 * - savaş: `AvatarCircle` (`MapBattle` jeton yolu: `.token` sınıfları, `tokenFilters`/`filterStyle`, `tokenScale`, `TOKEN_R`), harita zemini
 *   üstünde altıgende (`hexPoints`), gerçek boyda (dünya birimi = 1280 px genişlikte sahne) ve büyük boyda.
 * Kombinasyonlar `gorselDokumVeri.ts`'ten (veriden), kusur taraması `gorselDokumTarama.ts`'ten. `window.__dokum` betiğe açılır:
 * `meta()`, `scan(grup)`, `show(sayfa)`.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ReactNode } from 'react';
import '../styles.css';
import { AvatarBadge, AvatarCircle, CharacterFigure, preloadImages, thumbOf, useTinted } from '../ui/Avatar';
import { LookFrame } from '../ui/LookFrame';
import { SheetPortrait } from '../screens/sheet/SheetView';
import { WingFilterHost } from '../ui/WingFilter';
import { removeStaticSplash } from '../ui/splashBoot';
import { filterStyle, outlineColor, tokenFilters, type TokenFilter } from '../ui/statusFx';
import { tokenScale } from '../ui/tokenSize';
import { VIEW, HEX_W, hexCenter, hexPoints } from '../ui/mapView';
import { loadWingData } from '../ui/wingData';
import { lineageLook, type LookSheet } from '../ui/lineageLook';
import { maskUrlFor, maskedTint, tintedUrl } from '../ui/tint';
import { classDataLoaded, getMonster, loadClassData, loadMonsters, monsters, races, type Monster } from '../data';
import { characterTokenFile, lineageTint, monsterAvatar, paletteKeys, paletteTint, sheetAvatar } from '../battle/avatar';
import { CIVILIAN_LOOKS } from '../battle/civilianLooks';
import { creatureTypeAt } from '../battle/srdD1';
import { visibleSubclasses } from '../rules/subclasses';
import type { Avatar, Combatant } from '../battle/types';
import summonsData from '../../data/summons.json';
import karadulData from '../../data/karadul.json';
import hapisData from '../../data/hapishane.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import soyBas from '../../data/soy-bas.json';
import classFeatures from '../../data/class-features.json';
import {
  AWAKENINGS, CLASSES, G1, GENDERS, JETON, classCombos, classRows, classVariants, humanPaths, packCreatures, sampleSub, sheetFor, subclassRowLevel, tokenCode,
  type Combo, type Gender, type Variant,
} from './gorselDokumVeri';
import { probe, scanAvatar, withTimeout, type Kusur, type ScanCtx, type Tarama } from './gorselDokumTarama';

/* ---------- Ölçüler (MapBattle ile aynı) ---------- */
const HH = VIEW.h / 7.5;
const TOKEN_R = HH * 0.36;
const HEX0 = { col: 0, row: 0 };
const C0 = hexCenter(HEX0);
const PTS = hexPoints(HEX0);
const PAD = { l: 14, r: 14, t: 24, b: 6 };
/** Zemin: Dere Kenarı (klasik orman) haritasının açıklık bölgesi (desen kaydırması `ZEMIN_AT`). */
const ZEMIN = 'maps/orman/orman-yol.webp';
const ZEMIN_AT = { x: -70, y: -310 };

/* ---------- Sayfa öğesi ---------- */
interface Item { id: string; avatar: Avatar; ctx: ScanCtx; scale?: number; label: string; code?: string; reach?: Combo['reach'] }
interface PageDef { id: string; grup: string; bolum: 'sinif' | 'ozel' | 'durum' | 'ek'; baslik: string; aciklama: string; items: () => Item[]; render: (marks: Marks) => ReactNode }
/** Taramanın bulduğu kusurlar (hücreyi işaretler). */
type Marks = Map<string, string[]>;

/* ---------- Ortak çizim parçaları ---------- */
/** Savaş jetonu: MapBattle'daki `.token` grubu (filtre katmanı + `AvatarCircle` + halka; yerde gölgesi, baygın Z). */
function BattleToken(p: { avatar: Avatar; scale: number; flying?: boolean; filters?: TokenFilter[]; outline?: string | null; cx?: number; cy?: number }) {
  const cx = p.cx ?? C0.x, cy = p.cy ?? C0.y, r = TOKEN_R;
  const filters = p.filters ?? [];
  const look = filterStyle(filters, p.outline ?? null);
  const cls = ['token', 'party', p.scale > 1 ? 'big' : '', p.scale < 1 ? 'tiny' : '', ...filters.map((f) => `st-${f}`), filters.includes('rage') ? 'rage-still' : ''].join(' ');
  const top = cy - r * p.scale;
  return (
    <g className={cls}>
      {filters.includes('prone') && <ellipse cx={cx} cy={cy + r * 0.62} rx={r * 0.95} ry={r * 0.32} className="prone-shadow" aria-hidden="true" />}
      <g className="token-filter" style={look.filter || look.opacity < 1 ? { filter: look.filter || undefined, opacity: look.opacity } : undefined}
        transform={look.shrink < 1 || look.tilt ? `translate(${cx} ${cy}) rotate(${look.tilt ?? 0}) scale(${look.shrink}) translate(${-cx} ${-cy})` : undefined}>
        <AvatarCircle avatar={p.avatar} cx={cx} cy={cy} r={r} scale={p.scale} flying={p.flying} />
        <circle cx={cx} cy={cy} r={r} className="ring" />
      </g>
      {filters.includes('unconscious') && <text x={cx + r * 0.55} y={top + 4} className="fx-z still" aria-hidden="true">Z</text>}
    </g>
  );
}
/** Harita zemini üstünde altıgen (dünya birimi; `k` büyütme). */
function HexCell(p: { k?: number; children: ReactNode }) {
  const k = p.k ?? 1;
  const w = HEX_W + PAD.l + PAD.r, h = HH + PAD.t + PAD.b;
  return (
    <svg width={w * k} height={h * k} viewBox={`${-PAD.l} ${-PAD.t} ${w} ${h}`} className="dk-hex" overflow="visible">
      <polygon points={PTS} fill="url(#dk-zemin)" stroke="rgba(0,0,0,0.45)" strokeWidth={2} />
      {p.children}
    </svg>
  );
}
function Badge(p: { avatar: Avatar; size: number; flying?: boolean }) {
  const node = <AvatarBadge avatar={p.avatar} size={p.size} ring="var(--party)" eager />;
  return p.avatar.look ? <LookFrame sheet={p.avatar.look} size={p.size} flying={p.flying}>{node}</LookFrame> : node;
}
function Label(p: { it: Item; marks: Marks; extra?: string }) {
  const k = p.marks.get(p.it.id) ?? [];
  return (
    <div className="dk-lab" title={p.it.id}>
      <div>{p.it.label}{p.extra ? ` · ${p.extra}` : ''}</div>
      <div className="dk-code">{p.it.code ?? tokenCode(p.it.avatar.src)}{p.it.reach === 'cinsiyet-sonra' ? ' · cins. sonra' : ''}</div>
      {k.length > 0 && <div className="dk-err">{[...new Set(k)].join(' ')}</div>}
    </div>
  );
}
const markCls = (marks: Marks, id: string) => {
  const k = (marks.get(id) ?? []).filter((x) => x !== 'alt-sinif-jetonsuz');
  return k.length ? ' dk-bad' : (marks.get(id) ?? []).length ? ' dk-info' : '';
};
/** Rozet hücresi: karakter kartı/sihirbaz figürü + çekmece rozeti + sıra şeridi rozeti. */
function RozetCell(p: { it: Item; marks: Marks }) {
  return (
    <div className={`dk-cell${markCls(p.marks, p.it.id)}${p.it.reach === 'cinsiyet-sonra' ? ' dk-sonra' : ''}`}>
      <div className="dk-views">
        <CharacterFigure avatar={p.it.avatar} size={64} title={p.it.id} />
        <Badge avatar={p.it.avatar} size={56} />
        <Badge avatar={p.it.avatar} size={30} />
      </div>
      <Label it={p.it} marks={p.marks} />
    </div>
  );
}
function JetonCell(p: { it: Item; marks: Marks; k?: number; flying?: boolean; filters?: TokenFilter[]; outline?: string | null; extra?: string }) {
  return (
    <div className={`dk-cell${markCls(p.marks, p.it.id)}${p.it.reach === 'cinsiyet-sonra' ? ' dk-sonra' : ''}`}>
      <HexCell k={p.k}><BattleToken avatar={p.it.avatar} scale={p.it.scale ?? 1} flying={p.flying} filters={p.filters} outline={p.outline} /></HexCell>
      <Label it={p.it} marks={p.marks} extra={p.extra} />
    </div>
  );
}

/** Tablo: satır başlığı + sütun grupları. */
interface Col { key: string; label: string; group?: string }
interface RowH { key: string; label: string; sub?: string }
function Grid(p: { title: string; note: string; cols: Col[]; rows: RowH[]; cell: (r: RowH, c: Col) => ReactNode }) {
  const groups: Array<{ g: string; n: number }> = [];
  for (const c of p.cols) { const last = groups[groups.length - 1]; if (last && last.g === (c.group ?? '')) last.n++; else groups.push({ g: c.group ?? '', n: 1 }); }
  return (
    <div>
      <h1>{p.title}</h1>
      <p className="dk-note">{p.note}</p>
      <table className="dk-grid">
        <thead>
          {groups.some((g) => g.g) && <tr><th />{groups.map((g, i) => <th key={i} colSpan={g.n} className="dk-g">{g.g}</th>)}</tr>}
          <tr><th />{p.cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {p.rows.map((r) => (
            <tr key={r.key}>
              <th className="dk-rh"><b>{r.label}</b>{r.sub ? <><br /><small>{r.sub}</small></> : null}</th>
              {p.cols.map((c) => <td key={c.key}>{p.cell(r, c) ?? <div className="dk-none">—</div>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Kombinasyon → öğe ---------- */
const raceScale = (raceId: string | undefined) => tokenScale({ side: 'party', size: 'M', ...(raceId ? { raceId } : {}) });
const comboItem = (c: Combo): Item => ({
  id: c.id, avatar: c.avatar, scale: raceScale(c.race), label: `${c.variant.replace(/^[a-z]+\//, '')} ${G1[c.gender]}`, code: tokenCode(c.avatar.src), reach: c.reach,
  ctx: { id: c.id, grup: c.group, cls: c.cls, race: c.race, gender: c.gender, ...(c.subId ? { subId: c.subId } : {}), level: c.level, reach: c.reach },
});
const comboCache = new Map<string, Combo[]>();
const combosOf = (cls: string) => { let x = comboCache.get(cls); if (!x) { x = classCombos(cls); comboCache.set(cls, x); } return x; };
const variantCols = (genders: Gender[]): Col[] => genders.flatMap((g) => classVariants().map((v) => ({ key: `${v.key}/${G1[g]}`, label: `${v.label} ${G1[g]}`, group: `${v.race} · ${g}` })));
const rowHeads = (cls: string): RowH[] => classRows(cls).map((r) => ({ key: r.key, label: r.kind === 'gariban' ? 'Gariban' : (r.name ?? r.key), sub: `${r.key} · seviye ${r.level}${r.cinsiyet ? ` · yalnız ${r.cinsiyet}` : ''}${r.pack ? ' · paket' : ''}` }));
function classItems(cls: string, genders: Gender[]): Item[] { return combosOf(cls).filter((c) => genders.includes(c.gender)).map(comboItem); }
function classPage(cls: string, view: 'rozet' | 'jeton' | 'buyuk', g?: Gender): PageDef {
  const genders = g ? [g] : GENDERS;
  const id = `sinif-${cls}-${view}${g ? `-${G1[g]}` : ''}`;
  const titles = { rozet: 'Karakter ekranı (figür 64 · çekmece rozeti 56 · sıra şeridi 30)', jeton: 'Savaş jetonu, gerçek boy (yerde)', buyuk: 'Savaş jetonu, büyük boy ×2 (yerde)' };
  return {
    id, grup: cls, bolum: 'sinif', baslik: `${cls} · ${titles[view]}${g ? ` · ${g}` : ''}`,
    aciklama: `satır = alt sınıf (Gariban seviye 1, alt sınıf satırları seviye ${subclassRowLevel()}, ikinci form eşiğinde), sütun = ırk/soy × cinsiyet`,
    items: () => classItems(cls, genders),
    render: (marks) => {
      const byKey = new Map(combosOf(cls).map((c) => [`${c.row}|${c.variant}/${G1[c.gender]}`, c]));
      return (
        <Grid title={`${cls} · ${titles[view]}${g ? ` · ${g}` : ''}`} note={`Satır: alt sınıf (Gariban seviye 1; alt sınıf satırları seviye ${subclassRowLevel()}: kanat eşiği; ikinci form eşiğinde). Sütun: ırk/soy × cinsiyet. Kırmızı çerçeve: kusur; sarı: bilgi (alt sınıf jetonsuz); kesik çerçeve: kısıtlı alt sınıf seçildikten sonra cinsiyet değişti.`}
          cols={variantCols(genders)} rows={rowHeads(cls)}
          cell={(r, c) => {
            const combo = byKey.get(`${r.key}|${c.key}`);
            if (!combo) return null;
            const it = comboItem(combo);
            return view === 'rozet' ? <RozetCell it={it} marks={marks} /> : <JetonCell it={it} marks={marks} k={view === 'buyuk' ? 2 : 1} />;
          }} />
      );
    },
  };
}

/* ---------- Özel bölümler ---------- */
const CLS_COLS: Col[] = CLASSES.flatMap((c) => GENDERS.map((g) => ({ key: `${c}/${G1[g]}`, label: `${c} ${G1[g]}`, group: c })));
const splitCol = (k: string) => { const [cls, gg] = k.split('/'); return { cls: cls!, gender: (gg === 'E' ? 'erkek' : 'kadin') as Gender }; };
function itemOf(id: string, grup: string, avatar: Avatar, label: string, o: Partial<ScanCtx> & { race?: string } = {}): Item {
  return { id, avatar, scale: raceScale(o.race), label, code: tokenCode(avatar.src), ctx: { id, grup, ...o } };
}
function simplePage(def: Omit<PageDef, 'render' | 'items'> & { cols: Col[]; rows: RowH[]; at: (r: RowH, c: Col) => Item | null; view: (it: Item, marks: Marks, r: RowH, c: Col) => ReactNode }): PageDef {
  return {
    ...def,
    render: (marks) => <Grid title={def.baslik} note={def.aciklama} cols={def.cols} rows={def.rows} cell={(r, c) => { const it = def.at(r, c); return it ? def.view(it, marks, r, c) : null; }} />,
    items: () => def.rows.flatMap((r) => def.cols.map((c) => def.at(r, c)).filter((x): x is Item => !!x)),
  };
}
const FigToken = (p: { it: Item; marks: Marks; flying?: boolean; badge?: boolean }) => (
  <div className={`dk-cell${markCls(p.marks, p.it.id)}`}>
    <div className="dk-views">
      <CharacterFigure avatar={p.it.avatar} size={56} title={p.it.id} />
      {p.badge && <Badge avatar={p.it.avatar} size={56} />}
      <HexCell><BattleToken avatar={p.it.avatar} scale={p.it.scale ?? 1} flying={p.flying} /></HexCell>
    </div>
    <Label it={p.it} marks={p.marks} />
  </div>
);

function humanPage(): PageDef {
  const paths = humanPaths();
  return simplePage({
    id: 'ozel-human', grup: 'ozel', bolum: 'ozel', baslik: 'Human: kültür + Sürgün → ten tonu (Gariban, seviye 1)',
    aciklama: 'Satır: UI yolu (yeni karakter soysuz; kültür kartı; Sur Dışı Sürgün seçimi ya da Sürgünsüz: ton önceki kültürden kalır). Ton tek çözücüden (cultureSkinTone).',
    cols: CLS_COLS, rows: paths.map((p) => ({ key: p.key, label: p.label, sub: `ton ${p.tone}` })),
    at: (r, c) => {
      const p = paths.find((x) => x.key === r.key)!;
      const { cls, gender } = splitCol(c.key);
      const sheet = sheetFor({ race: 'human', cls, gender, level: 1, ...(p.lineage ? { lineage: p.lineage } : {}), ...(p.exile ? { exile: p.exile } : {}), ...(p.lineage ? { skinTone: p.tone } : {}) });
      return itemOf(`ozel/human/${p.key}/${cls}/${G1[gender]}`, 'ozel', sheetAvatar(sheet), `${p.tone} ${G1[gender]}`, { race: 'human' });
    },
    view: (it, m) => <FigToken it={it} marks={m} />,
  });
}
function drowPage(): PageDef {
  const cur = (soyRenkleri.races as unknown as { elf: { drowPalet: string } }).elf.drowPalet;
  const keys = paletteKeys('elf', 'drow');
  const rows: RowH[] = keys.flatMap((k) => [{ key: `${k}/GR`, label: `Palet ${k}${k === cur ? ' (şu an)' : ''}`, sub: 'Gariban, seviye 1' }, { key: `${k}/alt`, label: `Palet ${k}${k === cur ? ' (şu an)' : ''}`, sub: `örnek alt sınıf, seviye ${subclassRowLevel()}` }]);
  return simplePage({
    id: 'ozel-drow', grup: 'ozel', bolum: 'ozel', baslik: 'Drow paleti A–D (veri ayarı `soy-renkleri.json` elf.drowPalet; oyuncu seçmez)',
    aciklama: `Şu anki palet ${cur}; diğer paletler yalnız karşılaştırma (paletteTint). Oyunda ulaşılan yalnız "${cur}" satırları.`,
    cols: CLS_COLS, rows,
    at: (r, c) => {
      const [k, kind] = r.key.split('/');
      const { cls, gender } = splitCol(c.key);
      const sub = kind === 'alt' ? sampleSub(cls) : undefined;
      const sheet = sheetFor({ race: 'elf', lineage: 'drow', cls, gender, level: kind === 'alt' ? subclassRowLevel() : 1, ...(sub ? { subId: sub } : {}) });
      const av = sheetAvatar(sheet);
      const tint = paletteTint('elf', 'drow', k!);
      return itemOf(`ozel/drow/${r.key}/${cls}/${G1[gender]}`, 'ozel', tint ? { ...av, tint } : av, `${k} ${G1[gender]}`, { race: 'elf' });
    },
    view: (it, m) => <FigToken it={it} marks={m} />,
  });
}
function celestialPage(): PageDef {
  const rows: RowH[] = AWAKENINGS.flatMap((aw) => [{ key: `${aw}/2`, label: aw, sub: 'seviye 2 (uyanış kapalı, Gariban)' }, { key: `${aw}/3`, label: aw, sub: 'seviye 3 (uyanış açık, örnek alt sınıf)' }]);
  return simplePage({
    id: 'ozel-celestial', grup: 'ozel', bolum: 'ozel', baslik: 'Celestial: Göksel Uyanış 3 biçim × seviye eşiği',
    aciklama: 'Uyanış 3. seviyeden etkin (hale/taç, Gece Gözyaşı filtresi, Kırık Kanat her zaman açık kanat). Hücre: figür, çekmece rozeti, savaş jetonu.',
    cols: CLS_COLS, rows,
    at: (r, c) => {
      const [aw, lv] = r.key.split('/');
      const { cls, gender } = splitCol(c.key);
      const level = Number(lv);
      const sub = level >= 3 ? sampleSub(cls) : undefined;
      const sheet = sheetFor({ race: 'celestial', awakening: aw, cls, gender, level, ...(sub ? { subId: sub } : {}) });
      return itemOf(`ozel/celestial/${r.key}/${cls}/${G1[gender]}`, 'ozel', sheetAvatar(sheet), `${aw} L${level} ${G1[gender]}`, { race: 'celestial' });
    },
    view: (it, m) => <FigToken it={it} marks={m} badge />,
  });
}
/** Kanatlılar (savaşta havada açık kanat): Dragonborn 10 soy, Kanatlı Tiefling, Celestial Kırık Kanat; sınıf başına bir sayfa. */
function wingPage(cls: string): PageDef {
  const vs: Variant[] = classVariants().filter((v) => v.race === 'dragonborn' || v.key === 'tiefling/winged' || v.key === 'celestial/kirik-kanat');
  const cols: Col[] = GENDERS.flatMap((g) => vs.map((v) => ({ key: `${v.key}/${G1[g]}`, label: `${v.label} ${G1[g]}`, group: `${v.race} · ${g}` })));
  return simplePage({
    id: `kanat-${cls}`, grup: 'kanat', bolum: 'ozel', baslik: `${cls} · kanatlılar savaşta havada (flying: açık kanat)`,
    aciklama: `Satır: alt sınıf (sınıf tablosuyla aynı seviyeler); hücre: savaş jetonu havada (isAirborne → açık kanat, slot minSeviye'ye bağlı). Yerdeki hâl sınıf sayfalarında.`,
    cols, rows: rowHeads(cls),
    at: (r, c) => {
      const combo = combosOf(cls).find((x) => x.row === r.key && `${x.variant}/${G1[x.gender]}` === c.key);
      if (!combo) return null;
      const it = comboItem(combo);
      return { ...it, id: `kanat/${combo.id}`, ctx: { ...it.ctx, id: `kanat/${combo.id}`, grup: 'kanat' } };
    },
    view: (it, m) => <JetonCell it={it} marks={m} flying k={1} />,
  });
}
function goliathPage(): PageDef {
  const sprites = Object.keys((soyBas as unknown as { sprites: Record<string, unknown> }).sprites);
  const gol = races.find((r) => r.id === 'goliath')?.lineages ?? [];
  const cols: Col[] = gol.map((l) => ({ key: l.id, label: l.id, group: lineageTint('goliath', l.id, 'erkek') ? 'boyalı' : 'orijinal' }));
  const sheetOfSprite = (name: string, lineage: string) => {
    const m = /^goliath-(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$/.exec(name);
    if (!m) return null;
    const gender: Gender = m[1] === 'erkek' || m[1] === 'male' ? 'erkek' : 'kadin';
    const cls = m[2]!, cell = m[3];
    if (cell === 'GR') return sheetFor({ race: 'goliath', lineage, cls, gender, level: 1 });
    const sub = cell ? Object.entries(JETON[cls]?.altSiniflar ?? {}).find(([, v]) => v === cell)?.[0] : undefined;
    return sheetFor({ race: 'goliath', lineage, cls, gender, level: subclassRowLevel(), ...(sub ? { subId: sub } : {}) });
  };
  return simplePage({
    id: 'ozel-goliath-bas', grup: 'ozel', bolum: 'ozel', baslik: 'Goliath kafa kaplaması (soy-bas.json kayıtlı jetonlar) × soy',
    aciklama: 'Satır: kafa kaplaması kayıtlı jeton (sheet bu jetona çözülür); sütun: Goliath soyu. Hücre: figür, çekmece rozeti, savaş jetonu.',
    cols, rows: sprites.map((s) => ({ key: s, label: s })),
    at: (r, c) => {
      const sheet = sheetOfSprite(r.key, c.key);
      if (!sheet) return null;
      const av = sheetAvatar(sheet);
      return itemOf(`ozel/goliath-bas/${r.key}/${c.key}`, 'ozel', av, `${c.key}`, { race: 'goliath' });
    },
    view: (it, m) => <FigToken it={it} marks={m} badge />,
  });
}
/** Maske üçlüsü: orijinal jeton, maske (ten/pul), boyalı (oyunun `useTinted` yolu). */
function MaskTriple(p: { it: Item; marks: Marks }) {
  const a = p.it.avatar;
  const tinted = useTinted(a.src, a.tint);
  const mask = a.tint && maskedTint(a.tint) ? maskUrlFor(`/${a.src}`, a.tint) : null;
  return (
    <div className={`dk-cell${markCls(p.marks, p.it.id)}`}>
      <div className="dk-views dk-mask">
        <img src={`/${a.src}`} width={64} height={64} alt="" />
        {mask ? <img src={mask} width={64} height={64} alt="" className="dk-maskimg" /> : <span className="dk-nomask">HSL<br />(maskesiz)</span>}
        <img src={tinted ?? `/${a.src}`} width={64} height={64} alt="" />
      </div>
      <Label it={p.it} marks={p.marks} />
    </div>
  );
}
function maskPage(): PageDef {
  const vs = classVariants().filter((v) => GENDERS.some((g) => !!sheetAvatar(sheetFor({ race: v.race, cls: 'fighter', gender: g, level: 1, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(v.awakening ? { awakening: v.awakening } : {}) })).tint));
  const rows: RowH[] = vs.flatMap((v) => GENDERS.map((g) => ({ key: `${v.key}/${G1[g]}`, label: `${v.key} ${G1[g]}` })));
  const cols: Col[] = CLASSES.flatMap((c) => [{ key: `${c}/GR`, label: `${c} GR`, group: c }, { key: `${c}/alt`, label: `${c} alt`, group: c }]);
  return simplePage({
    id: 'ozel-maske', grup: 'ozel', bolum: 'ozel', baslik: 'Soy maskeli ırklar: orijinal | maske | boyalı',
    aciklama: 'Satır: boyalı soy × cinsiyet; sütun: sınıf × (Gariban seviye 1, örnek alt sınıf). Maske: characters/maske(-el|-pul)/ (yoksa jeton boyasız kalır).',
    cols, rows,
    at: (r, c) => {
      const v = vs.find((x) => r.key.startsWith(`${x.key}/`))!;
      const gender: Gender = r.key.endsWith('/E') ? 'erkek' : 'kadin';
      const [cls, kind] = c.key.split('/');
      const sub = kind === 'alt' ? sampleSub(cls!) : undefined;
      const sheet = sheetFor({ race: v.race, cls: cls!, gender, level: kind === 'alt' ? subclassRowLevel() : 1, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(v.exile ? { exile: v.exile } : {}), ...(sub ? { subId: sub } : {}) });
      const av = sheetAvatar(sheet);
      if (!av.tint) return null;
      return itemOf(`ozel/maske/${r.key}/${c.key}`, 'ozel', av, `${v.label} ${G1[gender]}`, { race: v.race });
    },
    view: (it, m) => <MaskTriple it={it} marks={m} />,
  });
}
/** Karakter sayfası portresi (SheetView'in `SheetPortrait`'i) ile çekmece rozeti (LookFrame) yan yana. */
function portrePage(): PageDef {
  const L = subclassRowLevel();
  const vs = classVariants().filter((v) => {
    const lk = lineageLook({ raceId: v.race, ...(v.lineage ? { lineageId: v.lineage } : {}), ...(v.awakening ? { celestialAwakening: v.awakening } : {}), level: L } as LookSheet, { ability: true });
    return !!lk.filter || lk.scaleX !== 1 || lk.scaleY !== 1 || !!lk.wing || lk.hideHalo;
  });
  const rows: RowH[] = vs.map((v) => ({ key: v.key, label: v.key }));
  return simplePage({
    id: 'ozel-portre', grup: 'ozel', bolum: 'ozel', baslik: 'Görünüm çerçeveli soylar: çekmece rozeti (LookFrame) | karakter sayfası portresi (SheetPortrait 84)',
    aciklama: `Satır: filtre/oran/kanat/hale gizleme taşıyan soy; sütun: sınıf × cinsiyet (örnek alt sınıf, seviye ${L}). Portre karakter sayfasındaki çizimdir (SheetView).`,
    cols: CLS_COLS, rows,
    at: (r, c) => {
      const v = vs.find((x) => x.key === r.key)!;
      const { cls, gender } = splitCol(c.key);
      const sub = sampleSub(cls);
      const sheet = sheetFor({ race: v.race, cls, gender, level: L, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.awakening ? { awakening: v.awakening } : {}), ...(sub ? { subId: sub } : {}) });
      return itemOf(`ozel/portre/${r.key}/${cls}/${G1[gender]}`, 'ozel', sheetAvatar(sheet), `${v.label} ${G1[gender]}`, { race: v.race, portre: sheet });
    },
    view: (it, m) => (
      <div className={`dk-cell${markCls(m, it.id)}`}>
        <div className="dk-views"><Badge avatar={it.avatar} size={56} />{it.ctx.portre ? <SheetPortrait sheet={it.ctx.portre} /> : null}</div>
        <Label it={it} marks={m} />
      </div>
    ),
  });
}

/* ---------- Durum filtreleri ---------- */
type FakeC = Pick<Combatant, 'conditions' | 'life' | 'summon' | 'exhaustion'> & Partial<Pick<Combatant, 'effects' | 'rage' | 'frenzy'>>;
const FILTER_CASES: Array<{ key: string; label: string; c: Partial<FakeC> }> = [
  { key: 'normal', label: 'normal', c: {} },
  { key: 'petrified', label: 'Petrified', c: { conditions: ['Petrified'] } },
  { key: 'invisible', label: 'Invisible', c: { conditions: ['Invisible'] } },
  { key: 'unconscious', label: 'Unconscious', c: { conditions: ['Unconscious'] } },
  { key: 'dying', label: '0 HP (ölmekte)', c: { life: 'dying' } },
  { key: 'prone', label: 'Prone', c: { conditions: ['Prone'] } },
  { key: 'blinded', label: 'Blinded', c: { conditions: ['Blinded'] } },
  { key: 'exhaustion', label: 'Exhaustion 2', c: { exhaustion: 2 } },
  { key: 'spirit', label: 'çağrılmış', c: { summon: { by: 'x' } as Combatant['summon'] } },
  { key: 'outlined', label: 'Faerie Fire', c: { effects: [{ name: 'Faerie Fire' }] as unknown as Combatant['effects'] } },
  { key: 'rage', label: 'Frenzy öfkesi', c: { rage: { refreshed: true, added: [] }, frenzy: true } },
];
const fake = (c: Partial<FakeC>): FakeC => ({ conditions: [], life: 'alive', summon: undefined, exhaustion: 0, ...c } as FakeC);
function durumPage(): PageDef {
  const L = subclassRowLevel();
  const rows: RowH[] = CLASSES.map((cls, i) => {
    const r = races[i % races.length]!;
    return { key: cls, label: cls, sub: `${r.id}${r.lineages?.[0] ? `/${r.lineages[0].id}` : ''} · ${i % 2 ? 'kadin' : 'erkek'}` };
  });
  const cols: Col[] = FILTER_CASES.map((f) => ({ key: f.key, label: f.label, group: tokenFilters(fake(f.c)).join('+') || 'filtre yok' }));
  return simplePage({
    id: 'durum-filtre', grup: 'durum', bolum: 'durum', baslik: 'Durum filtreleri (tokenFilters → filterStyle), jeton ×1,6',
    aciklama: 'Satır: sınıf örneği (ırk sırayla, örnek alt sınıf); sütun: durum. Öfke alevleri (RageFlames) ve döngü efekt sprite\'ları çizilmez (MapBattle içi; efekt ayarı).',
    cols, rows,
    at: (r, c) => {
      const i = CLASSES.indexOf(r.key);
      const race = races[i % races.length]!;
      const gender: Gender = i % 2 ? 'kadin' : 'erkek';
      const sub = sampleSub(r.key);
      const sheet = sheetFor({ race: race.id, cls: r.key, gender, level: L, ...(race.lineages?.[0] ? { lineage: race.lineages[0].id } : {}), ...(sub ? { subId: sub } : {}) });
      return itemOf(`durum/${r.key}/${c.key}`, 'durum', sheetAvatar(sheet), `${race.id} ${G1[gender]}`, { race: race.id });
    },
    view: (it, m, _r, c) => {
      const f = FILTER_CASES.find((x) => x.key === c.key)!;
      const fc = fake(f.c);
      return <JetonCell it={it} marks={m} k={1.6} filters={tokenFilters(fc)} outline={outlineColor(fc)} extra={f.label} />;
    },
  });
}

/* ---------- Ek girdiler ---------- */
function levelPage(): PageDef {
  const cases = [
    ...[1, 3, 4, 5].map((lv) => ({ key: `db-${lv}`, label: `Dragonborn red E L${lv}`, race: 'dragonborn', lineage: 'red', gender: 'erkek' as Gender, level: lv })),
    ...[2, 3].map((lv) => ({ key: `ck-${lv}`, label: `Celestial Kırık Kanat K L${lv}`, race: 'celestial', awakening: 'kirik-kanat', gender: 'kadin' as Gender, level: lv })),
    ...[2, 3].map((lv) => ({ key: `cg-${lv}`, label: `Celestial Gece Gözyaşı E L${lv}`, race: 'celestial', awakening: 'gece-gozyasi', gender: 'erkek' as Gender, level: lv })),
    ...[1, 5].map((lv) => ({ key: `tw-${lv}`, label: `Tiefling winged K L${lv}`, race: 'tiefling', lineage: 'winged', gender: 'kadin' as Gender, level: lv })),
  ];
  return simplePage({
    id: 'ek-seviye', grup: 'ek', bolum: 'ek', baslik: 'Seviye eşikleri: Gariban (< 3) / alt sınıf (≥ 3) / kanat (Dragonborn ≥ 5) / uyanış (≥ 3)',
    aciklama: 'Satır: sınıf (örnek alt sınıf, seviye ≥ 3\'te). Hücre: figür (karakter ekranı, uçma yeteneği) ve savaş jetonu havada. İkinci jeton formları sınıf sayfalarında satır olarak.',
    cols: cases.map((x) => ({ key: x.key, label: x.label })), rows: CLASSES.map((c) => ({ key: c, label: c })),
    at: (r, c) => {
      const x = cases.find((y) => y.key === c.key)!;
      const sub = x.level >= 3 ? sampleSub(r.key) : undefined;
      const sheet = sheetFor({ race: x.race, cls: r.key, gender: x.gender, level: x.level, ...('lineage' in x && x.lineage ? { lineage: x.lineage } : {}), ...('awakening' in x && x.awakening ? { awakening: x.awakening } : {}), ...(sub ? { subId: sub } : {}) });
      return itemOf(`ek/seviye/${r.key}/${c.key}`, 'ek', sheetAvatar(sheet), x.label, { race: x.race, cls: r.key, gender: x.gender, ...(sub ? { subId: sub } : {}), level: x.level });
    },
    view: (it, m) => <FigToken it={it} marks={m} flying />,
  });
}
/** Düz liste sayfası (satıra sığdırılmış). */
function listPage(def: { id: string; baslik: string; aciklama: string; list: () => Array<{ item: Item; filters?: TokenFilter[]; extra?: string }>; perRow?: number }): PageDef {
  const per = def.perRow ?? 14;
  return {
    id: def.id, grup: 'ek', bolum: 'ek', baslik: def.baslik, aciklama: def.aciklama,
    items: () => def.list().map((x) => x.item),
    render: (marks) => {
      const all = def.list();
      const rows: RowH[] = Array.from({ length: Math.ceil(all.length / per) }, (_, i) => ({ key: String(i), label: `${i * per + 1}–${Math.min(all.length, (i + 1) * per)}` }));
      const cols: Col[] = Array.from({ length: per }, (_, i) => ({ key: String(i), label: String(i + 1) }));
      return <Grid title={def.baslik} note={def.aciklama} cols={cols} rows={rows} cell={(r, c) => {
        const x = all[Number(r.key) * per + Number(c.key)];
        return x ? <JetonCell it={x.item} marks={marks} filters={x.filters} extra={x.extra} k={1.3} /> : null;
      }} />;
    },
  };
}
const crValue = (cr: string) => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
function formsPage(): PageDef {
  const ws = (classFeatures as unknown as { features: Record<string, { effect?: { kind: string; forms?: Record<string, [number, string, boolean]> } }> }).features['druid:wild-shape']?.effect?.forms ?? {};
  const wsLevel = (m: Monster): number | null => {
    const ok = Object.entries(ws).filter(([, [, cr, fly]]) => crValue(m.cr) <= crValue(cr) && (fly || !m.fly)).map(([l]) => Number(l));
    return ok.length ? Math.min(...ok) : null;
  };
  const spider = Object.entries((karadulData as unknown as { orumcek?: { bicimler?: Record<string, string> } }).orumcek?.bicimler ?? {});
  return listPage({
    id: 'ek-bicim', baslik: 'Biçimler: Wild Shape / Polymorph (bütün Beast canavarları) + Karadul örümcek biçimi',
    aciklama: 'Biçimde jeton canavarın jetonudur (monsterAvatar); oyuncu tarafında jeton ölçeği ırktan gelir (burada ırksız: 1). Etiket: CR, Wild Shape\'in açıldığı Druid seviyesi (yoksa yalnız Polymorph).',
    list: () => [
      ...spider.map(([lv, id]) => { const m = getMonster(id); return { item: itemOf(`ek/bicim/karadul/${id}`, 'ek', m ? monsterAvatar(m) : { src: `monsters/${id}.webp`, bg: '#6b2a2f', label: id.slice(0, 2) }, `Karadul L${lv}: ${id}`), extra: 'örümcek' }; }),
      ...monsters.filter((m) => creatureTypeAt(m.id) === 'beast').sort((a, b) => crValue(a.cr) - crValue(b.cr) || a.id.localeCompare(b.id))
        .map((m) => { const lv = wsLevel(m); return { item: itemOf(`ek/bicim/${m.id}`, 'ek', monsterAvatar(m), `${m.id} CR ${m.cr}`), extra: lv ? `WS ≥ ${lv}` : 'yalnız Polymorph' }; }),
    ],
  });
}
function summonsPage(): PageDef {
  const S = summonsData as unknown as { summons: Record<string, { creature?: string; forms?: string[] }>; creatures: Record<string, { name: string; avatar: string; avatarByChoice?: Record<string, string>; ringByChoice?: Record<string, string> }> };
  return listPage({
    id: 'ek-cagri', baslik: 'Çağrılan yaratıklar (summons.json, familiar/ölü/binek biçimleri, paket ve eşya yaratıkları): çağrılmış filtresiyle',
    aciklama: 'Savaşta çağrılan her yaratık `spirit` filtresi alır (tokenFilters: summon). Paket yaratıkları ödünç jeton + ton/halka (Avatar.hue/ring).',
    list: () => {
      const out: Array<{ item: Item; filters?: TokenFilter[]; extra?: string }> = [];
      const sp: TokenFilter[] = ['spirit'];
      for (const [sid, s] of Object.entries(S.summons)) {
        const cr = s.creature ? S.creatures[s.creature] : undefined;
        if (cr) {
          const choices = Object.entries(cr.avatarByChoice ?? { '': cr.avatar });
          for (const [ch, src] of choices) {
            const av = { ...monsterAvatar({ id: s.creature!, name: cr.name, avatar: src } as Monster), ...(cr.ringByChoice?.[ch] ? { ring: cr.ringByChoice[ch] } : {}) };
            out.push({ item: itemOf(`ek/cagri/${sid}/${ch || 'tek'}`, 'ek', av, `${sid}${ch ? `:${ch}` : ''}`), filters: sp });
          }
        }
        for (const f of s.forms ?? []) { const m = getMonster(f); out.push({ item: itemOf(`ek/cagri/${sid}/${f}`, 'ek', m ? monsterAvatar(m) : { src: `monsters/${f}.webp`, bg: '#6b2a2f', label: f.slice(0, 2) }, `${sid}: ${f}`), filters: sp }); }
      }
      for (const p of packCreatures(CLASSES.flatMap((c) => visibleSubclasses(c)))) out.push({ item: itemOf(`ek/cagri/paket/${p.key}`, 'ek', p.avatar, `${p.source}: ${p.ad}`), filters: sp });
      return out;
    },
  });
}
function civiliansPage(): PageDef {
  return listPage({
    id: 'ek-masum', baslik: 'Masum jetonları (data/masumlar.json)', aciklama: 'Game Master kurulumda seçer ya da tohumla atanır (defaultCivilianLook her masuma bir görünüm verir; avatars/masum.webp yedeği arayüzde ulaşılamaz).',
    list: () => CIVILIAN_LOOKS.map((l) => ({ item: itemOf(`ek/masum/${l.id}`, 'ek', { src: l.image, bg: '#8a7a4a', label: 'M' }, `${l.id} ${l.name}`) })),
  });
}
/** Mahkûm kıyafeti (Hapishane): sınıfın yerine kostüm sınıfının jetonu, soy rengi ve görünüm aynı (`seruvenBattle.ts` prisonerAvatar ile aynı kural). */
function prisonerPage(): PageDef {
  const kostum = (hapisData as unknown as { kostum: { sinif: string } }).kostum.sinif;
  const L = subclassRowLevel();
  return simplePage({
    id: 'ek-mahkum', grup: 'ek', bolum: 'ek', baslik: `Mahkûm kıyafeti: ${kostum} jetonu + turuncu hale (soy rengi ve görünüm karakterden)`,
    aciklama: `Kaynak karakter fighter, örnek alt sınıf, seviye ${L}. Avatar: src = characterTokenFile(ırk, cinsiyet, ${kostum}), fallbacks = asıl jeton, outfit = mahkum.`,
    cols: variantCols(['erkek']).map((c) => ({ ...c, key: c.key.replace(/\/E$/, ''), label: c.label.replace(/ E$/, ''), group: c.group?.replace(/ · erkek$/, '') })), rows: GENDERS.map((g) => ({ key: g, label: g })),
    at: (r, c) => {
      const v = classVariants().find((x) => x.key === c.key)!;
      const gender = r.key as Gender;
      const sub = sampleSub('fighter');
      const sheet = sheetFor({ race: v.race, cls: 'fighter', gender, level: L, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.awakening ? { awakening: v.awakening } : {}), ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(sub ? { subId: sub } : {}) });
      const a = sheetAvatar(sheet);
      const av: Avatar = { ...a, src: `characters/${characterTokenFile(v.race, gender, kostum)}`, fallbacks: [a.src, ...(a.fallbacks ?? [])], outfit: 'mahkum' };
      return itemOf(`ek/mahkum/${c.key}/${G1[gender]}`, 'ek', av, `${v.label} ${G1[gender]}`, { race: v.race });
    },
    view: (it, m) => <JetonCell it={it} marks={m} />,
  });
}

/* ---------- Kayıt ---------- */
function allPages(): PageDef[] {
  const out: PageDef[] = [];
  for (const cls of CLASSES) {
    for (const g of GENDERS) out.push(classPage(cls, 'rozet', g));
    out.push(classPage(cls, 'jeton'));
    for (const g of GENDERS) out.push(classPage(cls, 'buyuk', g));
  }
  out.push(humanPage(), drowPage(), celestialPage(), goliathPage(), maskPage(), portrePage());
  for (const cls of CLASSES) out.push(wingPage(cls));
  out.push(durumPage(), levelPage(), formsPage(), summonsPage(), civiliansPage(), prisonerPage());
  return out;
}

/* ---------- Hazırlık ve oturma ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const raf = () => new Promise((r) => requestAnimationFrame(() => r(null)));
async function pool<T>(xs: T[], n: number, f: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < xs.length) { const x = xs[i++]!; await f(x); } }));
}
/** Sayfanın görsellerini önceden yükler ve boyar (rozetin küçük kopyası dahil): çizimde önbellekten gelir. */
async function prewarm(items: Item[]): Promise<void> {
  const urls = new Set<string>();
  for (const it of items) for (const s of [it.avatar.src, ...(it.avatar.fallbacks ?? [])]) { urls.add(s); const th = thumbOf(s); if (th) urls.add(th); }
  preloadImages([...urls]);
  phase('önyükleme', urls.size);
  await pool([...urls], 16, async (s) => { await probe(s); tick(); });
  const jobs: Array<[string, NonNullable<Avatar['tint']>]> = [];
  phase('boya', items.length);
  for (const it of items) {
    if (!it.avatar.tint) continue;
    for (const s of [it.avatar.src, ...(it.avatar.fallbacks ?? [])]) {
      if (!/(^|\/)characters\//.test(s) || !(await probe(s))) continue;
      jobs.push([`/${s}`, it.avatar.tint]);
      const th = thumbOf(s);
      if (th && (await probe(th))) jobs.push([`/${th}`, it.avatar.tint]);
      break;
    }
  }
  await pool(jobs, 6, async ([u, t]) => { await withTimeout(tintedUrl(u, t), 90_000, null); tick(); });
}
/** İlerleme (betik takılmayı bununla anlar): faz, yapılan/toplam, son ilerleme anı. */
const prog = { faz: '', yapilan: 0, toplam: 0, t: Date.now() };
function phase(faz: string, toplam: number) { Object.assign(prog, { faz, yapilan: 0, toplam, t: Date.now() }); window.__dokumIlerleme = prog; }
function tick() { prog.yapilan++; prog.t = Date.now(); }
/** DOM durulana dek bekler (iskelet/bekleyen görsel yok, imza 3 yoklama aynı), sonra görselleri çözer. */
async function settle(root: HTMLElement, maxMs = 120_000): Promise<boolean> {
  const t0 = performance.now();
  let last = '', same = 0;
  while (performance.now() - t0 < maxMs) {
    await sleep(300);
    prog.t = Date.now();
    const sig = [...root.querySelectorAll('img')].map((i) => i.getAttribute('src')).join('|') + '#' + [...root.querySelectorAll('image')].map((i) => i.getAttribute('href')).join('|') + '#' + root.querySelectorAll('text.initials').length;
    const busy = root.querySelector('.avatar.skeleton, img.pending');
    if (sig === last && !busy) { if (++same >= 3) break; } else { same = 0; last = sig; }
  }
  const urls = new Set<string>();
  root.querySelectorAll('img').forEach((i) => { const s = i.getAttribute('src'); if (s) urls.add(s); });
  root.querySelectorAll('image').forEach((i) => { const s = i.getAttribute('href'); if (s) urls.add(s); });
  await Promise.all([...urls].map((s) => { const im = new Image(); im.src = s; return im.decode().catch(() => undefined); }));
  await raf(); await raf(); await sleep(200);
  return performance.now() - t0 < maxMs;
}

/* ---------- Kök ---------- */
const CSS = `
*, *::before, *::after { animation: none !important; transition: none !important; }
body { margin: 0; background: #1d2128; }
#sayfa { display: inline-block; background: #1d2128; color: #e8e4da; font: 12px system-ui, sans-serif; padding: 10px; }
#sayfa h1 { font-size: 18px; margin: 0 0 2px; } .dk-note { margin: 0 0 8px; color: #9aa3b2; max-width: 1400px; }
.dk-grid { border-collapse: collapse; } .dk-grid th, .dk-grid td { border: 1px solid #2c333e; padding: 2px; vertical-align: bottom; }
.dk-grid thead th { font-weight: 600; color: #cfd3dc; background: #232933; font-size: 11px; white-space: nowrap; }
.dk-grid th.dk-g { color: #f5d76e; text-align: left; }
.dk-rh { text-align: left; min-width: 150px; max-width: 190px; background: #232933; color: #e8e4da; font-weight: 400; vertical-align: middle !important; }
.dk-rh small { color: #9aa3b2; }
.dk-cell { display: flex; flex-direction: column; align-items: center; padding: 2px; border: 2px solid transparent; border-radius: 4px; }
.dk-cell.dk-bad { border-color: #e0474c; background: rgba(224, 71, 76, 0.12); } .dk-cell.dk-info { border-color: #b8932a; }
.dk-cell.dk-sonra { border-style: dashed; }
.dk-views { display: flex; align-items: flex-end; gap: 4px; } .dk-mask img { image-rendering: pixelated; background: #2a2f38; }
.dk-maskimg { background: #000 !important; } .dk-nomask { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; text-align: center; color: #9aa3b2; font-size: 10px; }
.dk-lab { text-align: center; line-height: 1.15; font-size: 10px; color: #cfd3dc; max-width: 220px; }
.dk-code { color: #f5d76e; } .dk-err { color: #ff8a8e; font-weight: 600; }
.dk-none { color: #555c68; text-align: center; padding: 20px 0; }
`;
function Root(p: { node: ReactNode }) {
  return (
    <>
      <style>{CSS}</style>
      <WingFilterHost />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs><pattern id="dk-zemin" patternUnits="userSpaceOnUse" x={ZEMIN_AT.x} y={ZEMIN_AT.y} width={VIEW.w} height={VIEW.h}><image href={`/${ZEMIN}`} width={VIEW.w} height={VIEW.h} preserveAspectRatio="xMidYMid slice" /></pattern></defs>
      </svg>
      <div id="sayfa">{p.node}</div>
    </>
  );
}

interface DokumApi {
  meta(): { pages: Array<Omit<PageDef, 'items' | 'render'> & { adet: number }>; zemin: string; altSinifSeviye: number };
  scan(grup: string): Promise<{ taramalar: Tarama[]; kusurlar: Kusur[] }>;
  show(id: string): Promise<{ adet: number; durdu: boolean }>;
}
declare global { interface Window { __dokum?: DokumApi; __dokumHata?: string; __dokumIlerleme?: { faz: string; yapilan: number; toplam: number; t: number } } }

async function main() {
  removeStaticSplash();
  await Promise.all([loadClassData(), loadWingData(), loadMonsters()]);
  // Uygulama gibi: dış içerik (yerel icerik/ + içe aktarılanlar) karakter ekranlarından önce.
  const store = await import('../content/store');
  store.applyStoredContent();
  await store.loadLocalFolder().catch(() => undefined);
  if (!classDataLoaded()) throw new Error('sınıf verisi yüklenmedi');
  const pages = allPages();
  const root = createRoot(document.getElementById('root')!);
  const host: { set?: (n: ReactNode) => void } = {};
  function Host() { const [n, set] = useState<ReactNode>(null); useEffect(() => { host.set = set; }, []); return <Root node={n} />; }
  root.render(<Host />);
  while (!host.set) await sleep(20);
  const marks: Marks = new Map();
  window.__dokum = {
    meta: () => ({ pages: pages.map(({ items, render: _r, ...rest }) => ({ ...rest, adet: items().length })), zemin: ZEMIN, altSinifSeviye: subclassRowLevel() }),
    scan: async (grup) => {
      const seen = new Set<string>();
      const items = pages.filter((p) => p.grup === grup).flatMap((p) => p.items()).filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
      const kusurlar: Kusur[] = [];
      const taramalar: Tarama[] = [];
      phase(`tarama ${grup}`, items.length);
      await pool(items, 8, async (it) => { const t = await scanAvatar(it.avatar, it.ctx, kusurlar); taramalar.push(t); marks.set(it.id, t.kusurlar); tick(); });
      return { taramalar, kusurlar };
    },
    show: async (id) => {
      const p = pages.find((x) => x.id === id);
      if (!p) throw new Error(`sayfa yok: ${id}`);
      const items = p.items();
      await prewarm(items);
      host.set!(<div key={id}>{p.render(marks)}</div>);
      await raf();
      phase(`oturma ${id}`, 1);
      const durdu = await settle(document.getElementById('sayfa')!);
      return { adet: items.length, durdu };
    },
  };
  // Doğrudan açılış: ?sayfa=<kimlik> o sayfayı gösterir (elle inceleme).
  const q = new URLSearchParams(location.search).get('sayfa');
  if (q) void window.__dokum.show(q);
}
main().catch((e) => { window.__dokumHata = String((e as Error)?.stack ?? e); console.error(e); });
