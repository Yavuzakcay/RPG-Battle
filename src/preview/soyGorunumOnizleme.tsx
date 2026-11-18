/** Alt soy görünüm kararı: önizleme sayfası (yalnız geliştirme). ?m=a: her ırkın bütün alt soyları; ?m=b: Tenhausser ↔ Drow yoğunluk. */
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { AvatarBadge } from '../ui/Avatar';
import { LookFrame } from '../ui/LookFrame';
import { races } from '../data';
import { blankCharacter } from '../rules/builder';
import { sheetAvatar } from '../battle/avatar';
import { skinTint } from '../ui/lineageLook';
import { CELESTIAL_AWAKENINGS } from './soyOnizlemeVeri';
import type { Avatar } from '../battle';
import type { TintSpec } from '../battle/types';
import olcum from '../../data/soy-olcum.json';
import { subclassTokenFile, garibanTokenFile } from '../battle/avatar';
import jetonlar from './jetonTablolari';
import { combos } from './soyGaleriListe';
import { AvatarCircle } from '../ui/Avatar';
import { RageFlames } from '../ui/RageFlames';
import { filterStyle, tokenFilters } from '../ui/statusFx';

const mode = new URLSearchParams(location.search).get('m') ?? 'a';
const CHANGED = new Set(['elf/drow', 'human/tenhausser', 'celestial/gece-gozyasi', 'goliath/stone', 'gnome/forest-gnome', 'orc/wildwood', 'halfling/sturdy']);
const lab = { font: '11px system-ui', color: '#cfd3dc', textAlign: 'center' as const, maxWidth: 108 };
const base = blankCharacter('t').sheet;

function Pair({ sheet, size = 100 }: { sheet: Parameters<typeof sheetAvatar>[0]; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {(['erkek', 'kadin'] as const).map((g) => {
        const a = sheetAvatar({ ...sheet, gender: g });
        return <LookFrame key={g} sheet={{ raceId: sheet.raceId, lineageId: sheet.lineageId, level: sheet.level, ...(sheet.celestialAwakening ? { celestialAwakening: sheet.celestialAwakening } : {}), ...(sheet.skinTone ? { skinTone: sheet.skinTone } : {}) }} size={size} ability><AvatarBadge avatar={a} size={size} eager /></LookFrame>;
      })}
    </div>
  );
}

function PageA() {
  const rows = races.map((r) => {
    const items = r.id === 'celestial'
      ? CELESTIAL_AWAKENINGS.map((aw) => ({ key: `celestial/${aw}`, name: aw, sheet: { ...base, raceId: 'celestial', classId: 'fighter', level: 3, celestialAwakening: aw } }))
      : (r.lineages ?? []).length ? (r.lineages ?? []).map((l) => ({ key: `${r.id}/${l.id}`, name: l.id, sheet: { ...base, raceId: r.id, classId: 'fighter', lineageId: l.id, level: 3 } }))
        : [{ key: r.id, name: '(soysuz)', sheet: { ...base, raceId: r.id, classId: 'fighter', level: 3 } }];
    return { r, items };
  });
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 12, display: 'inline-block' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Alt soy görünümü: her ırk için bütün alt soylar (Fighter, erkek + kadın). <span style={{ color: '#ffb347' }}>● turuncu çerçeve = bu görevde değişen</span></div>
      {rows.map(({ r, items }) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 6, borderBottom: '1px solid #333a46', paddingBottom: 4 }}>
          <div style={{ width: 80, fontWeight: 700, textTransform: 'capitalize', alignSelf: 'center' }}>{r.id}</div>
          {items.map((it) => (
            <div key={it.key} style={{ padding: 4, borderRadius: 6, border: CHANGED.has(it.key) ? '2px solid #ffb347' : '2px solid transparent' }}>
              <Pair sheet={it.sheet} size={96} />
              <div style={{ ...lab, color: CHANGED.has(it.key) ? '#ffb347' : lab.color, fontWeight: CHANGED.has(it.key) ? 700 : 400 }}>{CHANGED.has(it.key) ? '● ' : ''}{it.name}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ?m=b: aynı jeton (Elf Fighter) üzerinde üç ten: Tenhausser teni (Human Koyu ton hedefi), Drow eski, Drow yeni.
const OLD_D = [[14, 8, -14], [32, 15, -28], [41, 15, -28], [51, 16, -28], [59, 14, -24], [66, 13, -21], [72, 12, -19]];
function PageB() {
  const sheet = { ...base, raceId: 'elf', lineageId: 'drow', classId: 'fighter', level: 3 };
  const newTint = sheetAvatar({ ...sheet, gender: 'kadin' }).tint as TintSpec;
  const tenh = skinTint('human', 'siyahi') as TintSpec;
  const old: TintSpec = { ...newTint, to: { gradient: OLD_D, contrast: 0.35, chromaKeep: 0.35 } as TintSpec['to'] };
  const Y = (olcum as unknown as { paletler: { yogunluk: Record<string, Record<string, Record<string, number>>> } }).paletler.yogunluk;
  const cols: Array<{ name: string; tint: TintSpec; m: Record<string, number> }> = [
    { name: 'Tenhausser', tint: { ...tenh, select: newTint.select }, m: Y.yeni!['human/tenhausser']! },
    { name: 'Drow eski (D)', tint: old, m: Y.eski!['elf/drow@D']! },
    { name: 'Drow yeni (D)', tint: newTint, m: Y.yeni!['elf/drow@D']! },
  ];
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 12, display: 'inline-block' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Ten yoğunluğu: aynı jeton (Elf Fighter), üç boyama. HSL s/l, OKLCH c/L, açıklık sapması (24 jeton ortalaması)</div>
      <div style={{ display: 'flex', gap: 18 }}>
        {cols.map((c) => (
          <div key={c.name} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['erkek', 'kadin'] as const).map((g) => <AvatarBadge key={g} avatar={{ ...sheetAvatar({ ...sheet, gender: g }), tint: c.tint } as Avatar} size={190} eager />)}
            </div>
            <div style={{ fontWeight: 700, margin: '4px 0 2px', color: c.name === 'Drow yeni (D)' ? '#ffb347' : '#e8e4da' }}>{c.name}</div>
            <div style={{ font: '12px ui-monospace,monospace', color: '#aab' }}>HSL s {c.m.s!.toFixed(3)} · l {c.m.l!.toFixed(3)}</div>
            <div style={{ font: '12px ui-monospace,monospace', color: '#aab' }}>OKLCH c {c.m.c!.toFixed(3)} · L {c.m.ol!.toFixed(3)}</div>
            <div style={{ font: '12px ui-monospace,monospace', color: '#aab' }}>açıklık sapma {c.m.lStd!.toFixed(3)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ?m=c&c=<sınıf>: oyundaki jeton görünümü: ırk × cinsiyet satırları, sütunlar Gariban (seviye 1) + alt sınıf hücreleri (seviye 3; Pehlivan dev hali seviye 10); eksik hücre boş.
function PageC() {
  const cls = new URLSearchParams(location.search).get('c') ?? 'fighter';
  const T = jetonlar[cls]!;
  const seen = new Set<string>(); const cols: Array<{ id: string; cell: string; level: number; label: string }> = [{ id: '', cell: 'GR', level: 1, label: 'Gariban' }];
  for (const [id, cell] of Object.entries(T.altSiniflar)) if (!seen.has(cell)) { seen.add(cell); cols.push({ id, cell, level: 3, label: cell }); }
  for (const [id, f] of Object.entries(T.formlar ?? {})) cols.push({ id, cell: f.ikinci, level: f.esik, label: `${f.ikinci} dev` });
  const lin = (r: (typeof races)[number]) => (r.id === 'dragonborn' ? 'red' : (r.lineages ?? [])[0]?.id);
  const S = 60;
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '11px system-ui', padding: 8, display: 'inline-block' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{cls}: oyundaki jeton görünümü (ırk × cinsiyet; sütun = Gariban / alt sınıf hücresi). Boş hücre = jeton yok ya da cinsiyet kısıtlı.</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead><tr><th />{cols.map((c) => <th key={c.cell + c.level} style={{ font: '10px system-ui', color: '#aab' }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {races.flatMap((r) => (['erkek', 'kadin'] as const).map((g) => (
            <tr key={r.id + g}>
              <td style={{ whiteSpace: 'nowrap', paddingRight: 6 }}>{r.id} {g === 'erkek' ? '♂' : '♀'}</td>
              {cols.map((c) => {
                const sh = { ...base, raceId: r.id, classId: cls, gender: g, level: c.level, ...(lin(r) ? { lineageId: lin(r) } : {}), ...(c.id ? { subclassId: c.id } : {}) } as Parameters<typeof sheetAvatar>[0];
                const want = `${r.id}-${g}-${cls}-${c.cell}.webp`;
                const a = sheetAvatar(sh);
                const ok = a.src === `characters/${want}`;
                void subclassTokenFile; void garibanTokenFile;
                return (
                  <td key={c.cell + c.level} style={{ width: S, height: S, background: ok ? 'transparent' : '#262b34', textAlign: 'center', border: '1px solid #2c323d' }}>
                    {ok ? <LookFrame sheet={{ raceId: r.id, ...(lin(r) ? { lineageId: lin(r) } : {}), level: c.level, classId: cls, ...(c.id ? { subclassId: c.id } : {}) }} size={S} ability><AvatarBadge avatar={a} size={S} eager /></LookFrame> : <span style={{ color: '#555' }}>–</span>}
                  </td>
                );
              })}
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}
// ?m=g&p=<sayfa> (20 jeton/sayfa, 5×4) ya da ?m=g&ids=3,17,... : alt soy galerisi, her hücrede etiket.
function PageG() {
  const q = new URLSearchParams(location.search);
  const all = combos();
  const ids = q.get('ids');
  const list = ids ? ids.split(',').map((i) => all[Number(i)]!).filter(Boolean) : all.slice(Number(q.get('p') ?? 0) * 20, Number(q.get('p') ?? 0) * 20 + 20);
  const S = 96;
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '9px/1.15 system-ui', padding: 6, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${S + 10}px)`, gap: 4 }}>
        {list.map((c) => {
          const a = sheetAvatar(c.sheet);
          return (
            <div key={c.n} style={{ width: S + 10, textAlign: 'center' }}>
              <LookFrame sheet={{ raceId: c.sheet.raceId, ...(c.sheet.lineageId ? { lineageId: c.sheet.lineageId } : {}), ...(c.sheet.skinTone ? { skinTone: c.sheet.skinTone } : {}), ...(c.sheet.celestialAwakening ? { celestialAwakening: c.sheet.celestialAwakening } : {}), level: c.level, classId: c.cls, ...(c.subId ? { subclassId: c.subId } : {}) }} size={S} ability><AvatarBadge avatar={a} size={S} eager /></LookFrame>
              <div style={{ color: '#9fa6b5', wordBreak: 'break-all' }}>#{c.n} {c.race}·{c.lineage}</div>
              <div>{c.gender === 'erkek' ? '♂' : '♀'} {c.cls} · {c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ?m=w: Dragonborn 10 renk, seviye 5 (Draconic Flight kanadı açık), gerçek çizim yolu (çarpma filtresi + kanat paleti).
function PageW() {
  const cols = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '10px system-ui', padding: 8, display: 'inline-block' }}>
      {(['erkek', 'kadin'] as const).map((g) => ['paladin', 'warlock'].map((cls) => (
        <div key={g + cls} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {cols.map((c) => {
            const sh = { ...base, raceId: 'dragonborn', classId: cls, gender: g, level: 5, lineageId: c, subclassId: cls === 'paladin' ? 'devotion' : 'cin' } as Parameters<typeof sheetAvatar>[0];
            const a = sheetAvatar({ ...sh, subclassId: undefined });
            return <div key={c} style={{ textAlign: 'center' }}><LookFrame sheet={{ raceId: 'dragonborn', lineageId: c, level: 5 }} size={110} ability><AvatarBadge avatar={a} size={110} eager /></LookFrame><div>{g[0]}·{cls}·{c}</div></div>;
          })}
        </div>
      )))}
    </div>
  );
}
// ?m=r: Çılgın Yol öfke efekti: gerçek tokenFilters/filterStyle + RageFlames ile savaş jetonu görünümü (Berserker Rage kapalı/açık/açık+hareket azaltılmış, başka alt sınıf Rage açık).
function PageR() {
  const R = 44, S = 150;
  const cases: Array<{ label: string; file: string; c: { frenzy?: boolean; rage?: { refreshed: boolean; added: string[] } | null }; still?: boolean }> = [
    { label: 'Çılgın Yol, Rage KAPALI', file: 'human-erkek-barbarian-ID8', c: { frenzy: true } },
    { label: 'Çılgın Yol, Rage AÇIK', file: 'human-erkek-barbarian-ID8', c: { frenzy: true, rage: { refreshed: false, added: [] } } },
    { label: 'Çılgın Yol, Rage AÇIK (sabit kare)', file: 'human-erkek-barbarian-ID8', c: { frenzy: true, rage: { refreshed: false, added: [] } }, still: true },
    { label: 'Başka alt sınıf (Varis), Rage AÇIK', file: 'human-erkek-barbarian-ID1', c: { rage: { refreshed: false, added: [] } } },
    { label: 'Çılgın Yol kadın, Rage AÇIK', file: 'orc-kadin-barbarian-ID8', c: { frenzy: true, rage: { refreshed: false, added: [] } } },
  ];
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '12px system-ui', padding: 10, display: 'inline-block' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        {cases.map((k) => {
          const base = { conditions: [] as string[], life: 'alive' as const, exhaustion: 0 };
          const filters = tokenFilters({ ...base, ...k.c } as Parameters<typeof tokenFilters>[0]);
          const look = filterStyle(filters, null);
          const cx = S / 2, cy = S / 2 + 6, top = cy - R;
          return (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <svg width={S} height={S + 12} style={{ background: '#4f7a3a', borderRadius: 8 }}>
                <g className={`token ally ${filters.map((f) => `st-${f}`).join(' ')}${k.still ? ' rage-still' : ''}`}>
                  <g className="token-filter" style={look.filter ? { filter: look.filter } : undefined}>
                    <AvatarCircle avatar={{ src: `characters/${k.file}.webp`, bg: '#4f7a3a', label: 'B' }} cx={cx} cy={cy} r={R} eager />
                  </g>
                  {filters.includes('rage') && <RageFlames x={cx} y={top} r={R} />}
                </g>
              </svg>
              <div style={{ maxWidth: S }}>{k.label}<br /><span style={{ color: '#9fa6b5' }}>filtreler: {filters.join(', ') || '—'}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(host);
createRoot(host).render(mode === 'b' ? <PageB /> : mode === 'c' ? <PageC /> : mode === 'g' ? <PageG /> : mode === 'w' ? <PageW /> : mode === 'r' ? <PageR /> : <PageA />);
