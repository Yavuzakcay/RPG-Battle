/**
 * K46: zoomlu dünya haritası görüntüleyici (tembel parça). Tek canvas (≤ 16,7 MP), karolar K45 piramidinden
 * (`public/maps/dunya/`; görünür alan + 1 halka, LRU ≤ 200, önce z0 zemin), katmanlar (yol, deniz yolu, köprü/geçit,
 * gizli geçit, düğüm, ızgara, adlar), keşif sisi (96×42 → bulanık alfa; mini harita da aynı sisi gösterir),
 * Hapishane su altı silüeti (sisten bağımsız, haftalık yüzeye çıkış), Kraken gözü nabzı. Kaydır, tekerlek, kıstırma,
 * çift dokunma. Hareketi azaltmada nabız ve geçiş yok. Karo yoksa bölge renklerinde yer tutucu. Görünüm kayda girmez.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { clampCamera, fitRect, fitWorld, panBy, scaleBar, toScreen, toWorld, viewRect, zoomAt, type Camera, type Viewport } from '../../world/camera';
import { Lru, tileRect, tilesInView, zoomFor, type TileManifest } from '../../world/tiles';
import { FOG_COLS, FOG_ROWS, type Fog } from '../../world/fog';
import { BRIDGES, CAMERAS, FOG_RULES, HIDDEN_PASSES, PASSES, ROADS, SEA_ROUTES, WORLD, type Pt } from '../../world/worldData';
import etiketler from '../../../data/harita/etiketler.json';
import prisonUrl from '../../../data/harita/hapishane-su-alti-katman.png?url';
import './world.css';

export interface WorldNode { key: string; page: string; id: string; pos: Pt; done: boolean; open: boolean; label?: string }
export interface WorldLabel { id: string; tr: string; en: string; x: number; y: number; seviye: 1 | 2 | 3 }
export interface WorldMapProps {
  /** Keşif sisi (null: bütün harita açık). */
  fog: Fog | null;
  /** Bayraklar (gizli geçit işareti keşfedilince). */
  flags: readonly string[];
  hiddenFlag?: string;
  party: Pt | null;
  nodes: WorldNode[];
  /** Hapishane bugün yüzeyde mi; kaç gün kaldı. */
  prison: { surfaced: boolean; days: number };
  startRegion?: string;
  lang?: 'tr' | 'en';
  onNode?: (page: string, id: string) => void;
  onClose: () => void;
}

const BASE = import.meta.env.BASE_URL;
const TILE_BASE = `${BASE}maps/dunya`;
const MAX_PIXELS = 16_700_000;
const LAYERS = ['roads', 'sea', 'passes', 'hidden', 'nodes', 'grid', 'fog', 'labels'] as const;
type Layer = (typeof LAYERS)[number];
const REGION_COLOR: Record<string, string> = { buzul: '#9fc6dd', dag: '#8a7d6b', orman: '#3f7a47', col: '#c9a35c', bataklik: '#5d6b45', bati_kiyi: '#7f9a6a', kral_kalesi_yarimadasi: '#8f8a76', volkan_adasi: '#8a3b2a' };
const LABELS = (etiketler as { etiketler: WorldLabel[] }).etiketler;

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function WorldMapViewer(props: WorldMapProps) {
  const W = t().seruven.world;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const [vp, setVp] = useState<Viewport>({ w: 800, h: 500 });
  const [cam, setCam] = useState<Camera | null>(null);
  const [manifest, setManifest] = useState<TileManifest | null | 'yok'>(null);
  const [layers, setLayers] = useState<Record<Layer, boolean>>(() => Object.fromEntries(LAYERS.map((l) => [l, true])) as Record<Layer, boolean>);
  const [showLayers, setShowLayers] = useState(false);
  const [tick, setTick] = useState(0);
  const prisonImg = useRef<HTMLImageElement | null>(null);
  const prisonAlpha = useRef(props.prison.surfaced ? 0 : 1);
  const cache = useRef(new Lru<string, HTMLImageElement>(200));
  const loading = useRef(new Set<string>());
  const camRef = useRef<Camera | null>(null);
  camRef.current = cam;

  // Boyut: kapsayıcıyı izle.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp({ w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) }));
    ro.observe(el);
    setVp({ w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) });
    return () => ro.disconnect();
  }, []);
  // İlk kamera: ırk yurdu bölgesi ya da bütün harita.
  useEffect(() => {
    if (cam) return;
    const r = props.startRegion ? CAMERAS[props.startRegion] : undefined;
    setCam(r ? fitRect(r, vp) : fitWorld(vp));
  }, [vp, cam, props.startRegion]);
  useEffect(() => { if (cam) setCam((c) => (c ? clampCamera(c, vp) : c)); }, [vp]); // eslint-disable-line react-hooks/exhaustive-deps
  // Manifest (yoksa yer tutucu).
  useEffect(() => {
    let live = true;
    fetch(`${TILE_BASE}/manifest.json`).then((r) => (r.ok ? r.json() : null)).then((m: TileManifest | null) => { if (live) setManifest(m && m.zoomlar ? m : 'yok'); })
      .catch(() => { if (live) setManifest('yok'); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const img = new Image();
    img.onload = () => { prisonImg.current = img; setTick((n) => n + 1); };
    img.src = prisonUrl;
  }, []);
  // Hapishane geçişi (yumuşak; hareketi azaltmada anlık).
  useEffect(() => {
    const target = props.prison.surfaced ? 0 : 1;
    if (reducedMotion()) { prisonAlpha.current = target; setTick((n) => n + 1); return; }
    const from = prisonAlpha.current, t0 = performance.now(), dur = FOG_RULES.hapishane.gecisMs;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      prisonAlpha.current = from + (target - from) * (k * k * (3 - 2 * k));
      setTick((n) => n + 1);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [props.prison.surfaced]);
  // Kraken nabzı (hareketi azaltmada yok).
  useEffect(() => {
    if (reducedMotion()) return;
    const id = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  const fogCanvas = useMemo(() => {
    if (!props.fog || typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = FOG_COLS; c.height = FOG_ROWS;
    const g = c.getContext('2d');
    if (!g) return null;
    const img = g.createImageData(FOG_COLS, FOG_ROWS);
    for (let i = 0; i < props.fog.length; i++) { const k = i * 4; img.data[k] = 18; img.data[k + 1] = 20; img.data[k + 2] = 28; img.data[k + 3] = props.fog[i] ? 0 : 255; }
    g.putImageData(img, 0, 0);
    return c;
  }, [props.fog]);

  const loadTile = useCallback((key: string, url: string) => {
    if (cache.current.has(key) || loading.current.has(key)) return;
    loading.current.add(key);
    const img = new Image();
    img.onload = () => { loading.current.delete(key); cache.current.set(key, img); setTick((n) => n + 1); };
    img.onerror = () => { loading.current.delete(key); };
    img.src = url;
  }, []);

  // Çizim.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !cam) return;
    const dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, Math.sqrt(MAX_PIXELS / (vp.w * vp.h)));
    if (cv.width !== Math.round(vp.w * dpr) || cv.height !== Math.round(vp.h * dpr)) { cv.width = Math.round(vp.w * dpr); cv.height = Math.round(vp.h * dpr); }
    const g = cv.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0d1b2a';
    g.fillRect(0, 0, vp.w, vp.h);
    // Dünya koordinatı → ekran dönüşümü.
    const k = 1 / cam.scale;
    const ox = vp.w / 2 - cam.cx * k, oy = vp.h / 2 - cam.cy * k;
    g.save();
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    const m = manifest && manifest !== 'yok' ? manifest : null;
    if (m) {
      // Önce z0 zemin (boşluk kalmasın), sonra uygun zoom.
      const z0 = m.zoomlar[0];
      if (z0) for (const tr of tilesInView(m, z0, cam, vp, TILE_BASE, 0)) {
        const img = cache.current.get(tr.key);
        if (img) { const r = tileRect(m, z0, tr.x, tr.y); g.drawImage(img, r.x, r.y, r.w, r.h); } else loadTile(tr.key, tr.url);
      }
      const z = zoomFor(m, cam, dpr);
      if (z.z > 0) for (const tr of tilesInView(m, z, cam, vp, TILE_BASE, 1)) {
        const img = cache.current.get(tr.key);
        if (img) { const r = tileRect(m, z, tr.x, tr.y); g.drawImage(img, r.x, r.y, r.w + 0.5, r.h + 0.5); } else loadTile(tr.key, tr.url);
      }
    } else {
      g.fillStyle = '#183049';
      g.fillRect(0, 0, WORLD.w, WORLD.h);
      for (const [id, r] of Object.entries(CAMERAS)) { g.fillStyle = REGION_COLOR[id] ?? '#556'; g.globalAlpha = 0.55; g.fillRect(r.x, r.y, r.w, r.h); }
      g.globalAlpha = 1;
    }
    const lw = cam.scale; // 1 ekran pikseli dünya pikselinde
    const line = (pts: Pt[], color: string, width: number, dash?: number[]) => {
      if (pts.length < 2) return;
      g.beginPath(); g.moveTo(pts[0]![0], pts[0]![1]);
      for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
      g.strokeStyle = color; g.lineWidth = width * lw; g.setLineDash(dash ? dash.map((d) => d * lw) : []); g.stroke();
    };
    const dot = (p: Pt, r: number, fill: string, stroke = 'rgba(0,0,0,.6)') => { g.beginPath(); g.arc(p[0], p[1], r * lw, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = 1.5 * lw; g.strokeStyle = stroke; g.setLineDash([]); g.stroke(); };
    if (layers.roads) for (const r of ROADS) line(r.noktalar, r.tur === 'ana yol' ? 'rgba(240,214,160,.85)' : 'rgba(230,205,160,.6)', r.tur === 'ana yol' ? 3 : 2);
    if (layers.sea) for (const r of SEA_ROUTES) line(r.noktalar, 'rgba(160,215,255,.8)', 2, [8, 6]);
    if (layers.passes) {
      for (const b of BRIDGES) dot(b.dunya_px, 5, '#d9b26a');
      for (const p of PASSES) { dot(p.kapi_a, 4, '#e8e2cf'); dot(p.kapi_b, 4, '#e8e2cf'); }
    }
    const hiddenKnown = !!props.hiddenFlag && props.flags.includes(props.hiddenFlag);
    if (layers.hidden && hiddenKnown) for (const h of HIDDEN_PASSES) { dot(h.kapi_a, 7, '#7fe0d6', '#0b3'); dot(h.kapi_b, 7, '#7fe0d6', '#0b3'); }
    if (layers.nodes) for (const n of props.nodes) dot(n.pos, n.done ? 5 : 6, n.done ? '#8fd18f' : n.open ? '#f2d16b' : '#9a9a9a');
    if (props.party) { dot(props.party, 9, '#ff5a4f', '#fff'); }
    if (layers.grid) {
      g.setLineDash([]); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = lw;
      for (let c = 1; c < WORLD.cols; c++) { g.beginPath(); g.moveTo(c * WORLD.cell[0], 0); g.lineTo(c * WORLD.cell[0], WORLD.h); g.stroke(); }
      for (let r = 1; r < WORLD.rows; r++) { g.beginPath(); g.moveTo(0, r * WORLD.cell[1]); g.lineTo(WORLD.w, r * WORLD.cell[1]); g.stroke(); }
    }
    // Keşif sisi: bulanık alfa maske (yumuşak kenar).
    if (layers.fog && fogCanvas) {
      g.save();
      g.imageSmoothingEnabled = true;
      g.filter = `blur(${Math.max(2, 60 / cam.scale)}px)`;
      g.drawImage(fogCanvas, -WORLD.w * 0.01, -WORLD.h * 0.01, WORLD.w * 1.02, WORLD.h * 1.02);
      g.restore();
    }
    // Hapishane silüeti (sisten bağımsız: sis altında da görünür).
    if (prisonImg.current && prisonAlpha.current > 0.01) {
      const [x, y, w, h] = FOG_RULES.hapishane.katman;
      g.globalAlpha = prisonAlpha.current; g.drawImage(prisonImg.current, x, y, w, h); g.globalAlpha = 1;
    }
    // Kraken gözü: 2 sn nabız.
    const eye = FOG_RULES.kraken.goz;
    const ph = reducedMotion() ? 0.5 : (performance.now() % FOG_RULES.kraken.nabizMs) / FOG_RULES.kraken.nabizMs;
    g.beginPath(); g.arc(eye[0], eye[1], (10 + 18 * Math.sin(ph * Math.PI)) * lw, 0, Math.PI * 2);
    g.fillStyle = `rgba(255,190,60,${0.25 + 0.5 * Math.sin(ph * Math.PI)})`; g.fill();
    g.restore();
    // Etiketler ve ızgara adları (ekran koordinatında; sisli yerde gizli).
    g.font = '12px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.textBaseline = 'top';
    if (layers.grid) for (let c = 0; c < WORLD.cols; c++) for (let r = 0; r < WORLD.rows; r++) {
      const [sx, sy] = toScreen(cam, vp, c * WORLD.cell[0], r * WORLD.cell[1]);
      if (sx > -40 && sy > -20 && sx < vp.w && sy < vp.h) g.fillText(`${String.fromCharCode(65 + c)}${r + 1}`, sx + 4, sy + 4);
    }
    if (layers.labels) {
      const level = cam.scale > 8 ? 1 : cam.scale > 3 ? 2 : 3;
      for (const l of LABELS.filter((x) => x.seviye <= level)) {
        if (props.fog && layers.fog && !props.fog[Math.floor(l.y / (WORLD.h / FOG_ROWS)) * FOG_COLS + Math.floor(l.x / (WORLD.w / FOG_COLS))]) continue;
        const [sx, sy] = toScreen(cam, vp, l.x, l.y);
        g.fillText(props.lang === 'en' ? l.en : l.tr, sx, sy);
      }
    }
  }, [cam, vp, manifest, layers, fogCanvas, props.nodes, props.party, props.flags, props.hiddenFlag, props.fog, props.lang, tick, loadTile]);

  // Mini harita (z0 karosu ya da yer tutucu + sis + görünür alan).
  useEffect(() => {
    const cv = miniRef.current;
    if (!cv || !cam) return;
    const g = cv.getContext('2d');
    if (!g) return;
    const s = cv.width / WORLD.w;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#183049'; g.fillRect(0, 0, cv.width, cv.height);
    const z0 = cache.current.get('0/0/0');
    if (z0) g.drawImage(z0, 0, 0, cv.width, cv.height);
    else for (const [id, r] of Object.entries(CAMERAS)) { g.fillStyle = REGION_COLOR[id] ?? '#556'; g.fillRect(r.x * s, r.y * s, r.w * s, r.h * s); }
    if (layers.fog && fogCanvas) { g.save(); g.filter = 'blur(2px)'; g.drawImage(fogCanvas, 0, 0, cv.width, cv.height); g.restore(); }
    const r = viewRect(cam, vp);
    g.strokeStyle = '#ffd166'; g.lineWidth = 1.5; g.strokeRect(r.x * s, r.y * s, r.w * s, r.h * s);
    if (props.party) { g.fillStyle = '#ff5a4f'; g.beginPath(); g.arc(props.party[0] * s, props.party[1] * s, 3, 0, Math.PI * 2); g.fill(); }
  }, [cam, vp, fogCanvas, layers.fog, props.party, tick]);

  // Giriş: sürükle, tekerlek, kıstır, çift dokun.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number } | null>(null);
  const lastTap = useRef(0);
  const local = (e: { clientX: number; clientY: number }) => { const b = canvasRef.current?.getBoundingClientRect(); return { x: e.clientX - (b?.left ?? 0), y: e.clientY - (b?.top ?? 0) }; };
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    const now = performance.now();
    if (pointers.current.size === 1 && now - lastTap.current < 300 && camRef.current) { const p = local(e); setCam(zoomAt(camRef.current, vp, 0.5, p.x, p.y)); }
    lastTap.current = now;
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !camRef.current) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) setCam(zoomAt(camRef.current, vp, pinch.current.d / Math.max(1, d), (a.x + b.x) / 2, (a.y + b.y) / 2));
      pinch.current = { d };
    } else setCam(panBy(camRef.current, vp, p.x - prev.x, p.y - prev.y));
  };
  const onUp = (e: React.PointerEvent) => {
    const start = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    // Düğüm dokunuşu (sürüklemesiz kısa dokunuş).
    if (start && camRef.current && props.onNode && layers.nodes) {
      const p = local(e);
      if (Math.hypot(p.x - start.x, p.y - start.y) < 4) {
        const [wx, wy] = toWorld(camRef.current, vp, p.x, p.y);
        const hit = props.nodes.find((n) => Math.hypot(n.pos[0] - wx, n.pos[1] - wy) < 12 * camRef.current!.scale);
        if (hit) props.onNode(hit.page, hit.id);
      }
    }
  };
  const onWheel = (e: React.WheelEvent) => { if (!camRef.current) return; const p = local(e); setCam(zoomAt(camRef.current, vp, Math.exp(e.deltaY * 0.0015), p.x, p.y)); };
  const onMini = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    if (!camRef.current) return;
    setCam(clampCamera({ ...camRef.current, cx: ((e.clientX - b.left) / b.width) * WORLD.w, cy: ((e.clientY - b.top) / b.height) * WORLD.h }, vp));
  };
  const bar = cam ? scaleBar(cam) : null;
  const zoomBtn = (f: number) => cam && setCam(zoomAt(cam, vp, f, vp.w / 2, vp.h / 2));

  return (
    <div className="world-map" role="dialog" aria-label={W.title}>
      <header className="world-head">
        <strong>{W.title}</strong>
        <div className="world-presets">
          {Object.keys(CAMERAS).map((id) => (
            <button key={id} type="button" className="chip" onClick={() => setCam(fitRect(CAMERAS[id]!, vp))}>{(W.presets as Record<string, string>)[id] ?? id}</button>
          ))}
          <button type="button" className="chip" onClick={() => setCam(fitWorld(vp))}>{W.fit}</button>
        </div>
        <button type="button" className="ghost" onClick={() => setShowLayers((v) => !v)} aria-expanded={showLayers}>{W.layers}</button>
        <button type="button" className="ghost" onClick={props.onClose}>{W.close}</button>
      </header>
      {showLayers && (
        <div className="world-layers">
          {LAYERS.filter((l) => (l === 'fog' ? !!props.fog : l === 'hidden' ? !!props.hiddenFlag && props.flags.includes(props.hiddenFlag) : l === 'labels' ? LABELS.length > 0 : true)).map((l) => (
            <label key={l}><input type="checkbox" checked={layers[l]} onChange={() => setLayers((s) => ({ ...s, [l]: !s[l] }))} /> {W.layer[l]}</label>
          ))}
        </div>
      )}
      <div className="world-view" ref={wrapRef}>
        <canvas ref={canvasRef} style={{ width: vp.w, height: vp.h }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} />
        <div className="world-zoom">
          <button type="button" aria-label={W.zoomIn} onClick={() => zoomBtn(0.5)}>+</button>
          <button type="button" aria-label={W.zoomOut} onClick={() => zoomBtn(2)}>−</button>
        </div>
        <svg className="world-compass" viewBox="0 0 40 40" aria-label={W.compass} role="img"><circle cx="20" cy="20" r="18" /><path d="M20 4 L25 20 L20 17 L15 20 Z" /><text x="20" y="36">N</text></svg>
        <canvas ref={miniRef} className="world-mini" width={200} height={88} aria-label={W.minimap} onClick={onMini} />
        {bar && <div className="world-scale"><span style={{ width: bar.px }} />{W.scale(bar.miles)}</div>}
        <p className="world-note">
          {manifest === 'yok' && <span>{W.noTiles} </span>}
          {!props.fog && <span>{W.fogOff} </span>}
          <span>{props.prison.surfaced ? W.prisonUp : W.prisonUnder(props.prison.days)} </span>
          <span>{W.travel}</span>
        </p>
      </div>
    </div>
  );
}
