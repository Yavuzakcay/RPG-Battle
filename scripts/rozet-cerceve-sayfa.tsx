/**
 * ROZET-CERCEVE-KIRPMA ölçüm sayfası (yalnız okur; oyun kodu/veri/jeton değişmez). `scripts/rozet-cerceve.ts` Vite sunucusunda açar; oyunun
 * KENDİ bileşenleriyle çizer: rozet (`LookFrame` + `AvatarBadge`, 44 ve 84 px, karakter ekranlarındaki gibi `ability`), savaş jetonu
 * (`AvatarCircle` → `TokenFigure`, harita SVG'si gibi bir SVG içinde) ve oluşturucu figürü (`CharacterFigure`, 200 px). Her çizim kırpmalı
 * (oyundaki hâl) ve kırpmasız (çerçeve/SVG kırpması kapalı) iki geçişte; fark = çerçevenin kestiği pikseller. `window.__rc` sürücüye açılır.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ReactNode } from 'react';
import '../src/styles.css';
import { AvatarBadge, AvatarCircle, CharacterFigure } from '../src/ui/Avatar';
import { LookFrame } from '../src/ui/LookFrame';
import { WingFilterHost } from '../src/ui/WingFilter';
import { removeStaticSplash } from '../src/ui/splashBoot';
import { loadWingData } from '../src/ui/wingData';
import { classDataLoaded, loadClassData } from '../src/data';
import { sheetAvatar } from '../src/battle/avatar';
import type { Avatar } from '../src/battle/types';
import { CLASSES, GENDERS, JETON, classVariants, sheetFor, subclassRowLevel } from '../src/preview/gorselDokumVeri';

export type View = 'rozet' | 'jeton' | 'figur';
export interface Cell { key: string; avatar: Avatar }

/** Verilen jeton adlarına (dosya adı, uzantısız) giden bütün görünüşler; görünüm başına bir kez (src + görünüm). */
function cellsFor(names: string[]): Array<Cell & { name: string; label: string }> {
  const want = new Set(names);
  const L = subclassRowLevel();
  const seen = new Map<string, Cell & { name: string; label: string }>();
  for (const cls of CLASSES) {
    const T = JETON[cls]!;
    const rows: Array<{ subId?: string; level: number; only?: string }> = [{ level: 1 }, { level: L }];
    for (const sub of Object.keys(T.altSiniflar)) rows.push({ subId: sub, level: L, ...(T.cinsiyet?.[sub] ? { only: T.cinsiyet[sub] } : {}) });
    for (const [sub, f] of Object.entries(T.formlar ?? {})) rows.push({ subId: sub, level: Math.max(L, f.esik), ...(T.cinsiyet?.[sub] ? { only: T.cinsiyet[sub] } : {}) });
    for (const row of rows) for (const gender of GENDERS) {
      if (row.only && row.only !== gender) continue;
      for (const v of classVariants()) {
        const sheet = sheetFor({ race: v.race, cls, gender, level: row.level, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.awakening ? { awakening: v.awakening } : {}),
          ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(v.exile ? { exile: v.exile } : {}), ...(row.subId ? { subId: row.subId } : {}) });
        const av = sheetAvatar(sheet);
        const name = av.src.split('/').pop()!.replace(/\.webp$/, '');
        if (!want.has(name)) continue;
        // Kırpmayı değiştiren görünüm: oran (soy), uyanış (taç/hale), kanat; boya kırpmayı değiştirmez (boyasız çizilir).
        const lk = av.look ? { r: av.look.raceId, l: av.look.lineageId ?? null, a: av.look.celestialAwakening ?? null, lv: (av.look.level ?? 1) >= 3 } : null;
        const key = `${name}|${JSON.stringify(lk)}`;
        if (!seen.has(key)) seen.set(key, { key, name, label: `${v.key}${row.level >= 3 ? '' : ' GR'}`, avatar: { ...av, bg: 'transparent' } });
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export const cellW = (view: View, size: number) => (view === 'rozet' ? size * 2 : view === 'jeton' ? size * 2 : size * 2);

function Grid(p: { cells: Cell[]; view: View; size: number; cols: number }) {
  const w = cellW(p.view, p.size);
  return (
    <div style={{ position: 'relative', width: p.cols * w, height: Math.ceil(p.cells.length / p.cols) * w }}>
      {p.cells.map((c, i) => {
        const x = (i % p.cols) * w, y = Math.floor(i / p.cols) * w;
        const av = { ...c.avatar } as Avatar; delete (av as { tint?: unknown }).tint;
        let node: ReactNode;
        if (p.view === 'rozet') {
          const b = <AvatarBadge avatar={av} size={p.size} ring="transparent" eager />;
          node = <div style={{ position: 'absolute', left: x + (w - p.size) / 2, top: y + (w - p.size) / 2, width: p.size, height: p.size }}>
            {av.look ? <LookFrame sheet={av.look} size={p.size} ability>{b}</LookFrame> : b}</div>;
        } else if (p.view === 'jeton') {
          // Harita SVG'si gibi: jeton hücrenin ortasında, yarıçap = boy/2 (Medium).
          node = <svg className="rc-map" style={{ position: 'absolute', left: x, top: y }} width={w} height={w}>
            <AvatarCircle avatar={av} cx={w / 2} cy={w / 2} r={p.size / 2} ability eager /></svg>;
        } else {
          node = <div style={{ position: 'absolute', left: x + w * 0.2, top: y + w * 0.2 }}><CharacterFigure avatar={av} size={p.size} /></div>;
        }
        return <div key={c.key}>{node}</div>;
      })}
    </div>
  );
}

declare global { interface Window { __rc?: unknown; __rcHata?: string } }
const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
async function main() {
  removeStaticSplash();
  document.body.style.background = 'transparent';
  document.documentElement.style.background = 'transparent';
  await Promise.all([loadClassData(), loadWingData()]);
  if (!classDataLoaded()) throw new Error('sınıf verisi yüklenmedi');
  const root = createRoot(document.getElementById('root')!);
  const host: { set?: (n: ReactNode) => void } = {};
  function Host() { const [n, set] = useState<ReactNode>(null); useEffect(() => { host.set = set; }, []); return <><WingFilterHost /><div id="rc">{n}</div></>; }
  root.render(<Host />);
  while (!host.set) await new Promise((r) => setTimeout(r, 20));
  // Kırpmasız geçiş: rozet dairesi, rozet içi kırpma yolu ve SVG görüntü alanı kırpması kapalı; animasyonlar kapalı.
  const noclip = document.createElement('style');
  noclip.textContent = '#rc .avatar{overflow:visible!important;border-radius:0!important}#rc .avatar img{clip-path:none!important}#rc svg{overflow:visible!important}';
  const still = document.createElement('style');
  still.textContent = '*{animation:none!important;transition:none!important}.char-ground{display:none!important}';
  document.head.appendChild(still);
  window.__rc = {
    cells: (names: string[]) => cellsFor(names),
    draw: async (cells: Cell[], view: View, size: number, cols: number, clip: boolean) => {
      if (clip) noclip.remove(); else document.head.appendChild(noclip);
      host.set!(<Grid cells={cells} view={view} size={size} cols={cols} />);
      await raf();
      const t0 = Date.now();
      for (;;) {
        const pend = document.querySelectorAll('#rc .avatar img.pending, #rc .avatar.skeleton').length;
        const imgs = [...document.querySelectorAll('#rc img')] as HTMLImageElement[];
        if (!pend && imgs.every((i) => i.complete)) break;
        if (Date.now() - t0 > 20000) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      const hrefs = [...document.querySelectorAll('#rc image')].map((i) => i.getAttribute('href')!).filter(Boolean);
      await Promise.all([...new Set(hrefs)].map((h) => new Promise((r) => { const im = new Image(); im.onload = r; im.onerror = r; im.src = h; }).then(() => undefined)));
      await raf(); await new Promise((r) => setTimeout(r, 150)); await raf();
      const w = cellW(view, size);
      return { w: cols * w, h: Math.ceil(cells.length / cols) * w };
    },
  };
}
main().catch((e) => { window.__rcHata = String((e as Error)?.stack ?? e); console.error(e); });
