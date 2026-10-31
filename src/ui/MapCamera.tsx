/**
 * Görev H1: geniş harita kamerası (savaş ekranı; tembel savaş parçasında). Yalnızca dünya standart pencereden büyükse
 * etkin: 15×7 haritada hiçbir şey değişmez (sarmalayıcı yok, olay dinleyicisi yok). Kamera durumu yereldir, kayda girmez.
 * - Masaüstü: tekerlek yakınlaştırma (imleç sabit), orta/sağ tuş ya da Space + sol tuşla sürükleme, ok tuşları / WASD.
 * - Dokunmatik: jeton dışından sürükleme (8 px eşiği; altı dokunma), iki parmakla yakınlaştırma.
 * - Takip: sıra yeni yaratığa geçince kamera ona kayar (ayar; elle kaydırınca o tur durur).
 * - Mini harita (dokununca oraya gider; pencere dikdörtgeni sürüklenir, Görev M2), "Tümünü göster" (salt görüntüleme), ekran dışı olay okları.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { BattleState } from '../battle';
import { TERRAIN_COLOR } from '../map/terrain';
import type { Offset } from '../rules/hex';
import { HEX_W, VIEW, gridOf, hexCenter, hexPoints, hexesIn, worldOf } from './mapView';
import {
  DRAG_PX, centerOn, clampCamera, dragViewTo, ensureVisible, fitZoom, inView, offscreenDir, panBy, scaleOf, viewSize, zoomAt, zoomLimits,
  type Camera, type Point, type Size,
} from './camera';
import { t } from '../i18n';

const FOLLOW_KEY = 'rpg-battle-kamera-takip';
const readFollow = (): boolean => { try { return localStorage.getItem(FOLLOW_KEY) !== 'off'; } catch { return true; } };

export interface MapCam {
  big: boolean;
  world: Size;
  cam: Camera;
  /** Ekran pikseli / dünya pikseli. */
  k: number;
  screen: Size;
  /** Ekranda (pay ile) görünen altıgenler: yalnızca bunlar çizilir. */
  visibleHexes: Offset[];
  handlers: Record<string, unknown>;
  /** Son işaretçi sürüklemeye dönüştü mü (uzun basma ve tık bunu sorar). */
  dragged: () => boolean;
  follow: boolean;
  setFollow: (on: boolean) => void;
  overview: boolean;
  setOverview: (on: boolean) => void;
  zoomBy: (f: number) => void;
  goTo: (p: Point) => void;
  /** Görev M2: mini haritada tutulan pencereyi sürükle (dünya noktası `p`, tutma payı `grab`); o tur takip durur. */
  dragView: (grab: Point, p: Point) => void;
  keepVisible: (hexes: Offset[]) => void;
}

const turnKey = (s: BattleState) => `${s.round}:${s.turnIndex}`;

export function useMapCamera(state: BattleState, screen: Size): MapCam {
  const world = worldOf(gridOf(state));
  const big = world.w > VIEW.w + 0.5 || world.h > VIEW.h + 0.5;
  const limits = zoomLimits(screen, HEX_W);
  const [cam0, setCam] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [overview, setOverviewState] = useState(false);
  const [follow, setFollowState] = useState(readFollow);
  const manualTurn = useRef<string | null>(null);
  const cam = !big ? { x: 0, y: 0, zoom: 1 } : overview ? clampCamera({ x: 0, y: 0, zoom: fitZoom(world) }, world) : clampCamera(cam0, world);
  const k = scaleOf(screen, cam.zoom);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ start: Point; last: Point; active: boolean; pinch?: { dist: number; zoom: number } } | null>(null);
  const draggedFlag = useRef(false);
  const space = useRef(false);
  const camRef = useRef(cam);
  camRef.current = cam;

  const manual = () => { manualTurn.current = turnKey(state); };
  const update = (f: (c: Camera) => Camera) => { if (overview) setOverviewState(false); setCam((c) => f(clampCamera(overview ? camRef.current : c, world))); };

  // Takip: sıra değişince aktif yaratığa kay (elle kaydırılan turda değil).
  const actorPos = state.combatants[state.order[state.turnIndex] ?? '']?.pos;
  useEffect(() => {
    if (!big || !follow || !actorPos || manualTurn.current === turnKey(state)) return;
    setCam((c) => ensureVisible(clampCamera(c, world), [hexCenter(actorPos)], world, 160));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [big, follow, state.round, state.turnIndex, actorPos?.col, actorPos?.row]);

  // Klavye: ok tuşları / WASD kaydırır; Space basılıyken sol tuş sürükler.
  useEffect(() => {
    if (!big) return;
    const typing = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; return !!el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName); };
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (e.code === 'Space') { space.current = true; return; }
      const step = 120;
      const d: Record<string, [number, number]> = { ArrowLeft: [step, 0], KeyA: [step, 0], ArrowRight: [-step, 0], KeyD: [-step, 0], ArrowUp: [0, step], KeyW: [0, step], ArrowDown: [0, -step], KeyS: [0, -step] };
      const m = d[e.code];
      if (!m) return;
      e.preventDefault(); manual();
      update((c) => panBy(c, m[0], m[1], screen, world));
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') space.current = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [big, screen.w, screen.h, world.w, world.h, overview]);

  const local = (e: { clientX: number; clientY: number; currentTarget: EventTarget }): Point => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const skip = (target: EventTarget | null) => { const el = target as Element | null; return !!el?.closest?.('.hud > *, .token, .bubble, .radial'); };

  const handlers = big ? {
    onWheel: (e: WheelEvent & { currentTarget: EventTarget }) => {
      if (skip(e.target)) return;
      const p = local(e);
      manual();
      update((c) => zoomAt(c, c.zoom * Math.pow(1.0015, -e.deltaY), p, screen, world, limits));
    },
    onContextMenu: (e: Event) => e.preventDefault(),
    onPointerDown: (e: PointerEvent & { currentTarget: EventTarget }) => {
      if (skip(e.target)) return;
      const p = local(e);
      pointers.current.set(e.pointerId, p);
      draggedFlag.current = false;
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()] as [Point, Point];
        drag.current = { start: p, last: p, active: true, pinch: { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: camRef.current.zoom } };
        return;
      }
      const forced = e.button === 1 || e.button === 2 || (e.button === 0 && space.current);
      drag.current = { start: p, last: p, active: forced };
      if (forced) { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
    },
    onPointerMove: (e: PointerEvent & { currentTarget: EventTarget }) => {
      const d = drag.current;
      if (!d || !pointers.current.has(e.pointerId)) return;
      const p = local(e);
      pointers.current.set(e.pointerId, p);
      if (d.pinch && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()] as [Point, Point];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        draggedFlag.current = true; manual();
        update((c) => zoomAt(c, d.pinch!.zoom * (dist / Math.max(1, d.pinch!.dist)), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, screen, world, limits));
        return;
      }
      if (!d.active && Math.hypot(p.x - d.start.x, p.y - d.start.y) < DRAG_PX) return;
      if (!d.active) { d.active = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
      draggedFlag.current = true; manual();
      const dx = p.x - d.last.x, dy = p.y - d.last.y;
      d.last = p;
      update((c) => panBy(c, dx, dy, screen, world));
    },
    onPointerUp: (e: PointerEvent) => { pointers.current.delete(e.pointerId); if (pointers.current.size === 0) drag.current = null; },
    onPointerCancel: (e: PointerEvent) => { pointers.current.delete(e.pointerId); if (pointers.current.size === 0) drag.current = null; },
    // Sürüklemeden sonraki tık (altıgen seçimi) yutulur.
    onClickCapture: (e: Event) => { if (draggedFlag.current) { e.stopPropagation(); e.preventDefault(); draggedFlag.current = false; } },
  } : {};

  const visibleHexes = useMemo(() => {
    if (!big) return [];
    const v = viewSize(cam.zoom);
    return hexesIn(gridOf(state), { x: cam.x, y: cam.y, w: v.w, h: v.h });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [big, Math.round(cam.x / 20), Math.round(cam.y / 20), cam.zoom, gridOf(state)?.cols, gridOf(state)?.rows]);

  return {
    big, world, cam, k, screen, visibleHexes, handlers,
    dragged: () => draggedFlag.current,
    follow,
    setFollow: (on) => { setFollowState(on); try { localStorage.setItem(FOLLOW_KEY, on ? 'on' : 'off'); } catch { /* yerel */ } },
    overview,
    setOverview: (on) => setOverviewState(on),
    zoomBy: (f) => { manual(); update((c) => zoomAt(c, c.zoom * f, { x: screen.w / 2, y: screen.h / 2 }, screen, world, limits)); },
    goTo: (p) => { manual(); setOverviewState(false); setCam((c) => centerOn(clampCamera(c, world), p, world)); },
    dragView: (grab, p) => { manual(); setOverviewState(false); setCam((c) => dragViewTo(clampCamera(c, world), grab, p, world)); },
    keepVisible: (hexes) => { if (big && !overview && hexes.length) setCam((c) => ensureVisible(clampCamera(c, world), hexes.map(hexCenter), world)); },
  };
}

/** Dünya katmanları (harita görseli, efektler, ızgara): geniş haritada kaydırılan sarmalayıcı; 15×7'de sarmalayıcı yok. */
export function WorldLayer(props: { cam: MapCam; children: ReactNode }) {
  const { cam } = props;
  if (!cam.big) return <>{props.children}</>;
  const style: CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: cam.world.w * cam.k, height: cam.world.h * cam.k,
    transform: `translate(${-cam.cam.x * cam.k}px, ${-cam.cam.y * cam.k}px)`,
  };
  // Görüş alanı dünyayı sahne sınırında kırpar (HUD kırpılmaz).
  return <div className="mb-viewport"><div className="mb-world" style={style}>{props.children}</div></div>;
}

/** Zemin harfinin mini harita rengi. */
const tileColor = (state: BattleState, h: Offset): string => TERRAIN_COLOR[state.map?.tiles[h.row]?.[h.col] ?? '#'] ?? '#555';

/** Kamera denetimleri, mini harita ve ekran dışı olay okları (HUD içinde, ekran koordinatlarında). */
export function CameraHud(props: { cam: MapCam; state: BattleState; alerts?: Offset[] }) {
  const { cam, state } = props;
  const C = t().camera;
  const W = Math.round(Math.min(180, cam.screen.w * 0.24)), H = (W * cam.world.h) / cam.world.w;
  const s = W / cam.world.w;
  const v = viewSize(cam.cam.zoom);
  const hexes = useMemo(() => hexesIn(gridOf(state), { x: 0, y: 0, w: cam.world.w, h: cam.world.h }, 0),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [state.map?.id, gridOf(state)?.cols]);
  // Görev M2: pencere dikdörtgeninden başlayan işaretçi sürükler (fare ve dokunma); dışına tek dokunuş oraya gider.
  const mmDrag = useRef<{ id: number; grab: Point; moved: boolean } | null>(null);
  const mmSwallow = useRef(false);
  const toWorld = (e: { clientX: number; clientY: number; currentTarget: EventTarget }): Point => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  };
  const pts = (props.alerts ?? []).map(hexCenter).map((p) => ({ p, d: offscreenDir(cam.cam, p) })).filter((x) => x.d);
  return (
    <>
      <div className="cam-controls" role="group" aria-label={C.label}>
        <button className="hud-btn small" aria-label={C.zoomIn} onClick={() => cam.zoomBy(1.25)}>＋</button>
        <button className="hud-btn small" aria-label={C.zoomOut} onClick={() => cam.zoomBy(0.8)}>－</button>
        <button className={`hud-btn small${cam.overview ? ' on' : ''}`} aria-pressed={cam.overview} title={C.overview} aria-label={C.overview}
          onClick={() => cam.setOverview(!cam.overview)}>⤢</button>
        <button className={`hud-btn small${cam.follow ? ' on' : ''}`} aria-pressed={cam.follow} title={C.follow} aria-label={C.follow}
          onClick={() => cam.setFollow(!cam.follow)}>◎</button>
      </div>
      <svg className="minimap" width={W} height={H} viewBox={`0 0 ${cam.world.w} ${cam.world.h}`} role="img" aria-label={C.minimap}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Dokunmatik sürüklemeden sonra tık gelmez: yutma işareti her yeni dokunuşta sıfırlanır.
          mmSwallow.current = false;
          const p = toWorld(e);
          if (cam.overview || !inView(cam.cam, p)) return;
          mmDrag.current = { id: e.pointerId, grab: { x: p.x - cam.cam.x, y: p.y - cam.cam.y }, moved: false };
          e.preventDefault(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = mmDrag.current;
          if (!d || d.id !== e.pointerId) return;
          e.stopPropagation();
          d.moved = true;
          cam.dragView(d.grab, toWorld(e));
        }}
        onPointerUp={(e) => { if (mmDrag.current?.id === e.pointerId) { mmSwallow.current = mmDrag.current.moved; mmDrag.current = null; } }}
        onPointerCancel={() => { mmDrag.current = null; }}
        onClick={(e) => {
          e.stopPropagation();
          if (mmSwallow.current) { mmSwallow.current = false; return; }
          cam.goTo(toWorld(e));
        }}>
        {hexes.map((h) => <polygon key={`${h.col},${h.row}`} points={hexPoints(h)} fill={tileColor(state, h)} />)}
        {Object.values(state.combatants).filter((c) => c.pos && c.hp > 0).map((c) => {
          const p = hexCenter(c.pos as Offset);
          return <circle key={c.id} cx={p.x} cy={p.y} r={40} className={c.side === 'party' ? 'mm-party' : 'mm-enemy'} />;
        })}
        <rect x={cam.cam.x} y={cam.cam.y} width={v.w} height={v.h} className="mm-view" />
      </svg>
      {pts.map(({ p, d }, i) => {
        const x = cam.screen.w / 2 + (d!.x * (cam.screen.w / 2 - 28)), y = cam.screen.h / 2 + (d!.y * (cam.screen.h / 2 - 28));
        return (
          <button key={i} className="offscreen-arrow" style={{ left: x - 16, top: y - 16, transform: `rotate(${Math.atan2(d!.y, d!.x)}rad)` }}
            aria-label={C.goEvent} onClick={() => cam.goTo(p)}>➜</button>
        );
      })}
    </>
  );
}
