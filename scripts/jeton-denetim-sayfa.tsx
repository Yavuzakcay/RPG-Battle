/**
 * JETON-DENETIM tarayıcı tarafı (yalnız okur; oyun kodu/veri/jeton değişmez). `scripts/jeton-denetim-cizim.ts` Vite sunucusunda bu modülü
 * açar; oyunun KENDİ çözücü ve bileşenleriyle çizer:
 * - kombinasyonlar: `sheetAvatar` (ırk × soy/ton/uyanış × cinsiyet × sınıf × Gariban/alt sınıf/ikinci form × seviye eşiği; jeton tabloları
 *   `data/<sınıf>-jeton.json` doğrudan: dış paket `icerik/` yüklü olmasa da her hücre kimliği bir kez),
 * - boya: `tintedUrl` (maske, kafa kaplaması, maske onarımı dahil) + yedek filtre kararı `fallbackFilterFor`,
 * - savaş jetonu: `TokenFigure` (görünüm filtresi, oran, yedek filtre, taç; kanat kapalı ya da açık),
 * - rozet: `LookFrame` + `AvatarBadge` (84 px; kırpmalı ve kırpmasız iki geçiş: fark = çerçevenin kestiği pikseller).
 * `window.__jd` sürücüye açılır.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ReactNode } from 'react';
import '../src/styles.css';
import { AvatarBadge, TokenFigure } from '../src/ui/Avatar';
import { LookFrame } from '../src/ui/LookFrame';
import { WingFilterHost } from '../src/ui/WingFilter';
import { removeStaticSplash } from '../src/ui/splashBoot';
import { loadWingData } from '../src/ui/wingData';
import { lineageLook, cultureSkinTone, type LookSheet } from '../src/ui/lineageLook';
import { crownSpec } from '../src/ui/haloCrown';
import { wingRoot } from '../src/ui/wingRoot';
import { naturalLeft } from '../src/ui/tokenMirror';
import { fallbackFilterFor, maskUrlFor, maskedTint, tintedUrl } from '../src/ui/tint';
import { classDataLoaded, loadClassData } from '../src/data';
import { sheetAvatar } from '../src/battle/avatar';
import type { Avatar, TintSpec } from '../src/battle/types';
import { CLASSES, GENDERS, JETON, classVariants, humanPaths, sheetFor, subclassRowLevel, type Gender } from '../src/preview/gorselDokumVeri';

interface Combo { id: string; cls: string; row: string; kind: 'GR' | 'alt' | 'form'; subId?: string; race: string; variant: string; gender: Gender; level: number; avatar: Avatar }

function combos(): Combo[] {
  const L = subclassRowLevel();
  const out: Combo[] = [];
  const variants = classVariants();
  for (const cls of CLASSES) {
    const T = JETON[cls]!;
    const rows: Array<{ key: string; kind: Combo['kind']; subId?: string; level: number; only?: Gender }> = [{ key: 'GR', kind: 'GR', level: 1 }];
    // Her hücre kimliği (alt sınıf anahtarı) bir kez; aynı hücreye giden kimlikler ayrı satır (kanat slotu farklı olabilir).
    for (const sub of Object.keys(T.altSiniflar)) rows.push({ key: sub, kind: 'alt', subId: sub, level: L, ...(T.cinsiyet?.[sub] ? { only: T.cinsiyet[sub] } : {}) });
    for (const [sub, f] of Object.entries(T.formlar ?? {})) rows.push({ key: `${sub}@${f.esik}`, kind: 'form', subId: sub, level: Math.max(L, f.esik), ...(T.cinsiyet?.[sub] ? { only: T.cinsiyet[sub] } : {}) });
    // Alt sınıfsız seviye ≥ 3 (eski kayıt / alt sınıf seçilmemiş): sınıf-genel ya da Dragonborn'da Gariban.
    rows.push({ key: 'altsiz@5', kind: 'alt', level: L });
    for (const row of rows) for (const gender of GENDERS) {
      if (row.only && row.only !== gender) continue; // cinsiyet kısıtlı alt sınıf (kadın İmparator, erkek Karadul yok)
      for (const v of variants) {
        const sheet = sheetFor({ race: v.race, cls, gender, level: row.level, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.awakening ? { awakening: v.awakening } : {}),
          ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(v.exile ? { exile: v.exile } : {}), ...(row.subId ? { subId: row.subId } : {}) });
        out.push({ id: `${cls}/${row.key}/${v.key}/${gender}`, cls, row: row.key, kind: row.kind, ...(row.subId ? { subId: row.subId } : {}), race: v.race, variant: v.key, gender, level: row.level, avatar: sheetAvatar(sheet) });
      }
    }
  }
  return out;
}

/** Görünümün çizimi etkileyen çözülmüş hâli (anahtar). */
function lookOf(a: Avatar, flying = false) {
  const lk = a.look ? lineageLook(a.look as LookSheet, flying ? { flying: true } : {}) : null;
  const cr = crownSpec(a.src, a.look);
  return {
    filter: lk?.filter ?? '', sx: lk?.scaleX ?? 1, sy: lk?.scaleY ?? 1, hideHalo: lk?.hideHalo ?? false,
    wing: lk?.wing ? { id: lk.wing.id, src: lk.wing.src, filtre: lk.wing.filtre, palet: lk.wing.palet ?? null, ayna: !!lk.wing.ayna } : null,
    crown: cr ? { x: cr.x, y: cr.y, olcek: cr.olcek } : null, mirror: naturalLeft(a.src),
  };
}

const blobB64 = async (url: string): Promise<string> => {
  const b = await (await fetch(url)).blob();
  return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^data:[^,]*,/, '')); r.readAsDataURL(b); });
};

/** Boya: boyalı PNG (base64; maskeli boya başarısızsa null) + maske adresi + yedek filtre. */
async function tint(src: string, t: TintSpec, look: LookSheet | undefined) {
  const url = `/${src}`;
  const out = await tintedUrl(url, t);
  return { png: out ? await blobB64(out) : null, mask: maskedTint(t) ? maskUrlFor(url, t) : null, fb: fallbackFilterFor(url, t, look) };
}

/* ---------- Izgara çizimi (sürücü ekran görüntüsü alır) ---------- */
/** `boyali`: rozet oyundaki gibi soy boyasıyla (DROW-MASKE-TOPLU önce/sonra); yoksa kırpma ölçüsü için boyasız. */
export interface Cell { key: string; view: 'jeton' | 'jeton-kanat' | 'rozet'; avatar: Avatar; href?: string; fb?: string; boyali?: boolean }
/** Savaş jetonu hücresinin boyalı adresi ve yedek filtresi (oyundaki `useTinted` + `tintFallbackOf` ile aynı karar). */
async function resolveCell(c: Cell): Promise<Cell> {
  if (c.view === 'rozet' || !c.avatar.tint) return c;
  const url = `/${c.avatar.src}`;
  const out = await tintedUrl(url, c.avatar.tint);
  return { ...c, href: out ?? url, fb: fallbackFilterFor(url, c.avatar.tint, c.avatar.look) };
}
const CELL = 256, ROZ = 84, PADR = 40;
function Grid(p: { cells: Cell[]; cols: number }) {
  return (
    <div style={{ position: 'relative', width: p.cols * cellW(p.cells), background: 'transparent' }}>
      {p.cells.map((c, i) => {
        const w = cellW(p.cells), x = (i % p.cols) * w, y = Math.floor(i / p.cols) * w;
        if (c.view === 'rozet') {
          const av = { ...c.avatar, bg: 'transparent' } as Avatar; if (!c.boyali) delete (av as { tint?: unknown }).tint;
          const node = <AvatarBadge avatar={av} size={ROZ} ring="transparent" eager />;
          return <div key={c.key} data-k={c.key} style={{ position: 'absolute', left: x + PADR, top: y + PADR, width: ROZ, height: ROZ }}>
            {av.look ? <LookFrame sheet={av.look} size={ROZ} ability>{node}</LookFrame> : node}</div>;
        }
        const fly = c.view === 'jeton-kanat';
        const lk = c.avatar.look;
        // Kanat çizimi jeton kutusunun dışına taşar: kanatlı görünümde jeton yarı boyda, hücrenin ortasında.
        const s = fly ? 0.5 : 1, cx = x + w / 2, cy = y + w / 2;
        return (
          <svg key={c.key} data-k={c.key} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
            <TokenFigure href={c.href ?? `/${c.avatar.src}`} cx={cx} cy={cy} w={CELL * s} flip={naturalLeft(c.avatar.src)} crown={crownSpec(c.avatar.src, lk)} look={lk}
              flying={fly} wingRoot={wingRoot(c.avatar.src, lk)} src={c.avatar.src} extraFilter={c.fb || undefined} />
          </svg>
        );
      })}
    </div>
  );
}
const cellW = (cells: Cell[]) => (cells[0]?.view === 'rozet' ? ROZ + 2 * PADR : CELL);

declare global { interface Window { __jd?: unknown; __jdHata?: string } }
const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
async function main() {
  removeStaticSplash();
  document.body.style.background = 'transparent';
  document.documentElement.style.background = 'transparent';
  await Promise.all([loadClassData(), loadWingData()]);
  if (!classDataLoaded()) throw new Error('sınıf verisi yüklenmedi');
  const root = createRoot(document.getElementById('root')!);
  const host: { set?: (n: ReactNode) => void } = {};
  function Host() { const [n, set] = useState<ReactNode>(null); useEffect(() => { host.set = set; }, []); return <><WingFilterHost /><div id="jd">{n}</div></>; }
  root.render(<Host />);
  while (!host.set) await new Promise((r) => setTimeout(r, 20));
  const noclip = document.createElement('style');
  noclip.textContent = '.avatar{overflow:visible!important;border-radius:0!important}.avatar img{clip-path:none!important}.avatar img.pending{opacity:1!important}';
  window.__jd = {
    combos: () => combos().map((c) => ({ ...c, look: c.avatar.look ? lookOf(c.avatar) : null, lookFly: c.avatar.look ? lookOf(c.avatar, true) : null })),
    humanPaths: () => humanPaths().map((p) => ({ ...p, cozulen: cultureSkinTone(p.lineage, p.prevTone ?? p.tone, p.exile) })),
    tint: (src: string, t: TintSpec, look: LookSheet | undefined) => tint(src, t, look),
    draw: async (cells0: Cell[], cols: number, clip: boolean) => {
      const cells = await Promise.all(cells0.map(resolveCell));
      if (clip) noclip.remove(); else document.head.appendChild(noclip);
      host.set!(<Grid cells={cells} cols={cols} />);
      await raf();
      // Görseller yüklenene dek (rozet: pending sınıfı; SVG image: decode).
      const t0 = Date.now();
      for (;;) {
        const pend = document.querySelectorAll('#jd .avatar img.pending, #jd .avatar.skeleton').length;
        const imgs = [...document.querySelectorAll('#jd img')] as HTMLImageElement[];
        if (!pend && imgs.every((i) => i.complete)) break;
        if (Date.now() - t0 > 20000) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      const hrefs = [...document.querySelectorAll('#jd image')].map((i) => i.getAttribute('href')!).filter(Boolean);
      await Promise.all([...new Set(hrefs)].map((h) => new Promise((r) => { const im = new Image(); im.onload = r; im.onerror = r; im.src = h; }).then(() => undefined)));
      await raf(); await new Promise((r) => setTimeout(r, 120)); await raf();
      const el = document.querySelector('#jd > div') as HTMLElement;
      const b = el.getBoundingClientRect();
      return { w: Math.ceil(b.width), h: Math.ceil(Math.ceil(cells.length / cols) * cellW(cells)) };
    },
  };
}
main().catch((e) => { window.__jdHata = String((e as Error)?.stack ?? e); console.error(e); });
