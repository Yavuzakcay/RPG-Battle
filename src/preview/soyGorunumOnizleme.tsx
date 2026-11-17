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
const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(host);
createRoot(host).render(mode === 'b' ? <PageB /> : <PageA />);
