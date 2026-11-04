/**
 * K49 D: bölge geçiş/yükleme ekranı. Bölge adı + ince arka plan; yeni bölgenin karoları (`onYuklemeZoom`, z3–z4)
 * gerçekten önyüklenir. Süre önyükleme bitince ama en az/en çok `sureMs` (0,6–1,2 sn); hareketi azaltmada kısa solma.
 */
import { useEffect, useState } from 'react';
import { regionTiles, transitionMs, type WorldRegion } from '../../world/regions';
import type { TileManifest } from '../../world/tiles';
import { getLang, t } from '../../i18n';
import './world.css';

const TILE_BASE = `${import.meta.env.BASE_URL}maps/dunya`;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function RegionLoading(props: { region: WorldRegion; onDone: () => void }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    let live = true;
    const t0 = performance.now();
    const finish = () => {
      if (!live) return;
      const wait = Math.max(0, transitionMs(performance.now() - t0, reduced()) - (performance.now() - t0));
      setTimeout(() => { if (!live) return; setOut(true); setTimeout(() => live && props.onDone(), reduced() ? 0 : 180); }, wait);
    };
    fetch(`${TILE_BASE}/manifest.json`).then((r) => (r.ok ? r.json() : null)).then((m: TileManifest | null) => {
      if (!m?.zoomlar) { finish(); return; }
      const urls = regionTiles(props.region, m.zoomlar, m.karo);
      let left = urls.length;
      if (!left) { finish(); return; }
      const done = () => { if (--left <= 0) finish(); };
      for (const u of urls) { const im = new Image(); im.onload = done; im.onerror = done; im.src = `${TILE_BASE}/${u}`; }
      // Ağ yavaşsa en çok süresi kadar bekle.
      setTimeout(() => { left = 0; finish(); }, transitionMs(1e9, reduced()));
    }).catch(finish);
    return () => { live = false; };
  }, [props.region.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const S = t().seruven.world;
  return (
    <div className={`region-loading${out ? ' out' : ''}${reduced() ? ' reduced' : ''}`} role="status" aria-live="polite">
      <div className="region-loading-card" lang={getLang()}>
        <small>{S.regionEnter}</small>
        <strong>{getLang() === 'en' ? props.region.en : props.region.tr}</strong>
        <span className="region-loading-bar"><i /></span>
      </div>
    </div>
  );
}
