/**
 * Görev E1: efekt çizim katmanları (tembel parça; savaş ekranı `lazy` ile yükler, ana pakete girmez). Yalnızca görsel.
 * - `FxShots`: yeni olaylardan tek seferlik efektler (vuruş, iyileştirme, ışınlanma, alan, ışın, koruma, çağırma, itme,
 *   çarpma, Moral, ölüm); jetonların üstünde. Etkin hedefleri ve sayıyı `onActive` ile bildirir (durum döngüsü o jetonda
 *   durur, ekran bütçesi paylaşılır).
 * - `FxGround`: kalıcı aura halkaları ve duvar parçaları; jetonların altında.
 * Efekt ayarı kapalı ya da "hareketi azalt" açıkken animasyon yok: her efekt tek sabit kare (`stillFrame`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Offset } from '../../rules/hex';
import type { BattleEvent, BattleState, Combatant } from '../../battle/types';
import { SCREEN_BUDGET, allocate, deathShots, fxShots, groundFx, stillFrame, type FxShot, type FxSprite } from './fxPlan';
import './fx.css';

const BASE = import.meta.env.BASE_URL;
/** Kuyruk E2: mermi uçuş süresi (ms). */
const TRAVEL_MS = 320;

type Pt = { x: number; y: number };
interface Geo { hexCenter: (o: Offset) => Pt; tokenCenter: (c: Combatant) => Pt; hexW: number; hexH: number }

/** Tek şerit karesi: animasyonlu (`fx-play`, steps) ya da statik tek kare. */
function Strip({ s, x, y, w, h, animated, delay = 0, loop, rotate, cx, cy, tint, outline, className, hue, style }: {
  s: FxSprite; x: number; y: number; w: number; h: number; animated: boolean; delay?: number; loop?: boolean; rotate?: number; cx?: number; cy?: number;
  tint?: string; outline?: string; className?: string; hue?: number; style?: CSSProperties;
}) {
  const frame = stillFrame(s);
  const img: CSSProperties = animated
    ? ({ '--shift': `${-s.w * s.frames}px`, animation: `fx-play ${s.ms}ms steps(${s.frames}) ${delay}ms ${loop ? 'infinite' : 'both'}` } as CSSProperties)
    : { transform: `translateX(${-s.w * frame}px)` };
  // Statik tek seferlik efekt gecikmesine dek gizli, sonra tek kare (hareket yok).
  const box0: CSSProperties | undefined = !animated && delay > 0 ? { animation: `fx-appear 1ms step-end ${delay}ms both` } : undefined;
  // Kuyruk A2: konturlu şerit (Çizili Duvar): normal karışım + koyu gölge; açık ve koyu haritada okunur.
  const box1: CSSProperties | undefined = outline ? { ...box0, mixBlendMode: 'normal', filter: `drop-shadow(0 0 1px ${outline}) drop-shadow(0 0 2px ${outline}) drop-shadow(1px 1px 0 ${outline})` } : box0;
  // Kuyruk E2: simge sayfaları (macenta anahtarlı, saydam) normal karışımla; hue-rotate renk satırı türetir.
  const box: CSSProperties | undefined = (s.blend === 'normal' || hue || style) ? { ...box1, ...(s.blend === 'normal' ? { mixBlendMode: 'normal' } : {}), ...(hue ? { filter: `hue-rotate(${hue}deg)` } : {}), ...style } : box1;
  return (
    <svg className={`fx-e1${className ? ` ${className}` : ''}`} x={x} y={y} width={w} height={h} viewBox={`0 0 ${s.w} ${s.h}`} overflow="hidden" preserveAspectRatio="none"
      style={box} data-fx={s.id} data-animated={animated ? '1' : '0'}
      {...(rotate ? { transform: `rotate(${rotate} ${cx ?? x + w / 2} ${cy ?? y + h / 2})` } : {})}>
      <image href={`${BASE}${s.file}`} width={s.w * s.frames} height={s.h} preserveAspectRatio="none" style={img} filter={tint ? `url(#fx-tint-${tint.slice(1)})` : undefined} />
    </svg>
  );
}

/** Renk çarpanı filtresi (çizili duvar: Harita Öğretisi tonu). */
function TintFilter({ color }: { color: string }) {
  const n = parseInt(color.slice(1), 16);
  const [r, g, b] = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  return (
    <filter id={`fx-tint-${color.slice(1)}`} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`} />
    </filter>
  );
}

type Live = FxShot & { id: number; animated: boolean };

/** Kuyruk E2: koni dokusu kırpma yolu (çıkıştan nişana, SRD genişliği = uzaklık: yarı açı ≈ 26,6°). */
const CONE_TAN = 0.5;

export function FxShots({ state, events, enabled, reduceMotion, geo, lead, onActive }: {
  state: BattleState; events: BattleEvent[]; enabled: boolean; reduceMotion: boolean; geo: Geo;
  /** Zar tepsisi önce dönsün: yeni olaylar için gecikme (ms). */
  lead: (fresh: BattleEvent[]) => number;
  onActive: (info: { targets: Set<string>; count: number; loopBudget: number }) => void;
}) {
  const seen = useRef(events.length);
  const prev = useRef(state);
  const [live, setLive] = useState<Live[]>([]);
  useEffect(() => {
    const fresh = events.slice(seen.current);
    const before = prev.current;
    seen.current = events.length;
    prev.current = state;
    if (fresh.length === 0) return;
    const start = lead(fresh);
    const shots = [...fxShots(fresh, before), ...deathShots(before, state)];
    if (!shots.length) return;
    // Bütçe: tek seferlikler önce; jeton başına ve ekranda sınır (aşan statik tek kare).
    const keyed = shots.map((s, i) => ({ ...s, id: Math.random() + i, delay: s.delay + start }));
    const anim = allocate(keyed.map((s) => ({ key: String(s.id), tokenId: s.targetId })), { enabled, reduceMotion, used: 0 });
    const items: Live[] = keyed.map((s) => ({ ...s, animated: anim.has(String(s.id)) }));
    setLive((l) => [...l, ...items]);
    const end = Math.max(...items.map((s) => s.delay + s.sprite.ms * (s.sprite.loop ? 2 : 1)));
    const timer = window.setTimeout(() => setLive((l) => l.filter((x) => !items.includes(x))), end + 80);
    return () => window.clearTimeout(timer);
  }, [events, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const targets = useMemo(() => new Set(live.flatMap((s) => (s.targetId ? [s.targetId] : []))), [live]);
  const count = live.filter((s) => s.animated).length;
  useEffect(() => { onActive({ targets, count, loopBudget: Math.max(0, SCREEN_BUDGET - count) }); }, [targets, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const tints = [...new Set(live.flatMap((s) => (s.ton && !s.link ? [s.ton] : [])))];
  return (
    <g className="fx-shots" aria-hidden="true">
      {tints.length > 0 && <defs>{tints.map((t) => <TintFilter key={t} color={t} />)}</defs>}
      {live.map((s) => {
        const c = s.targetId ? state.combatants[s.targetId] : undefined;
        const p = c?.pos ? geo.tokenCenter(c) : s.at ? geo.hexCenter(s.at) : null;
        if (s.from && s.to && s.link) {
          // Kuyruk E2: bağ çizgisi (işaret büyüleri): büyücüden hedefe kesik çizgi, söner.
          const a = geo.hexCenter(s.from); const b = geo.hexCenter(s.to);
          return <line key={s.id} className={`fx-link${s.animated ? '' : ' still'}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.ton} style={{ animationDelay: `${s.delay}ms` }} />;
        }
        if (s.from && s.to && s.cone) {
          // Kuyruk E2: koni dokusu; çıkıştan nişana döndürülür, üçgen kırpma (dokunun sol kenarı çıkış).
          const a = geo.hexCenter(s.from); const b = geo.hexCenter(s.to);
          const len = s.scale * geo.hexW * 0.87; const half = len * CONE_TAN;
          const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const clip = `fx-cone-${String(s.id).replace('.', '')}`;
          return (
            <g key={s.id} className="fx-cone" transform={`rotate(${deg} ${a.x} ${a.y})`}>
              <defs><clipPath id={clip}><path d={`M ${a.x} ${a.y} L ${a.x + len} ${a.y - half} L ${a.x + len} ${a.y + half} Z`} /></clipPath></defs>
              <g clipPath={`url(#${clip})`}>
                <Strip s={s.sprite} x={a.x} y={a.y - half} w={len} h={half * 2} animated={s.animated} delay={s.delay} loop hue={s.hue} tint={s.ton} />
              </g>
            </g>
          );
        }
        if (s.from && s.to && s.travel) {
          // Kuyruk E2: mermi büyücüden hedefe uçar (CSS translate; hareketi azaltta hedefte tek kare).
          const a = geo.hexCenter(s.from); const b = geo.hexCenter(s.to);
          const w = geo.hexW * 0.9; const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const moving = s.animated;
          const at = moving ? a : b;
          const fly: CSSProperties | undefined = moving
            ? ({ '--dx': `${b.x - a.x}px`, '--dy': `${b.y - a.y}px`, animation: `fx-travel ${TRAVEL_MS}ms ease-in ${s.delay}ms both` } as CSSProperties) : undefined;
          return (
            <g key={s.id} className="fx-travel" style={fly}>
              <Strip s={s.sprite} x={at.x - w / 2} y={at.y - w / 2} w={w} h={w} animated={s.animated} delay={s.delay} loop rotate={s.sprite.dir ? deg : undefined} cx={at.x} cy={at.y} tint={s.ton} hue={s.hue} />
            </g>
          );
        }
        if (s.from && s.to) {
          // Işın: parçalar uç uca (`overlap` kadar bindirilir), çıkıştan hedefe döndürülür.
          const a = geo.hexCenter(s.from); const b = geo.hexCenter(s.to);
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const pw = geo.hexW; const ph = pw * s.sprite.h / s.sprite.w;
          const stepW = pw * (1 - s.sprite.overlap);
          const n = Math.max(1, Math.ceil(len / stepW));
          const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          return (
            <g key={s.id} className="fx-beam" transform={`rotate(${deg} ${a.x} ${a.y})`}>
              {Array.from({ length: n }, (_, i) => (
                <Strip key={i} s={s.sprite} x={a.x + i * stepW} y={a.y - ph / 2} w={pw} h={ph} animated={s.animated} delay={s.delay} loop tint={s.ton} hue={s.hue} />
              ))}
            </g>
          );
        }
        if (!p) return null;
        const w = geo.hexW * s.scale * (s.sprite.kind === 'alan' ? 0.75 : 0.55);
        const h = w * s.sprite.h / s.sprite.w;
        const y = p.y + (s.dy ?? 0) * geo.hexW;
        return <Strip key={s.id} s={s.sprite} x={p.x - w / 2} y={y - h / 2} w={w} h={h} animated={s.animated} delay={s.delay} rotate={s.rotate} tint={s.ton} hue={s.hue}
          className={s.sprite.kind === 'isaret' ? `fx-simge${s.animated ? '' : ' still'}` : undefined} />;
      })}
    </g>
  );
}

export function FxGround({ state, enabled, reduceMotion, geo, used, tokenUsed }: {
  state: BattleState; enabled: boolean; reduceMotion: boolean; geo: Geo;
  /** Ekranda zaten animasyonlu efekt sayısı (tek seferlikler + durum döngüleri) ve jeton başına kullanılan. */
  used: number; tokenUsed: ReadonlyMap<string, number>;
}) {
  const { auras, walls, patches } = useMemo(() => groundFx(state), [state]);
  const anim = allocate([...auras.map((a) => ({ key: a.key, tokenId: a.ownerId })), ...walls.map((w) => ({ key: w.key })), ...patches.map((z) => ({ key: z.key }))], { enabled, reduceMotion, used, tokenUsed });
  const tints = [...new Set([...walls.flatMap((w) => (w.tint ? [w.tint] : [])), ...patches.flatMap((z) => (z.ton ? [z.ton] : []))])];
  if (!auras.length && !walls.length && !patches.length) return null;
  return (
    <g className="fx-ground" aria-hidden="true">
      {tints.length > 0 && <defs>{tints.map((t) => <TintFilter key={t} color={t} />)}</defs>}
      {patches.map((z) => {
        // Kuyruk E2: kalıcı alan zemin dokusu (alanın merkezinde, alan kadar; jetonların altında).
        const p = geo.hexCenter(z.at);
        const d = ((2 * z.radius + 1) * geo.hexH) / 0.8;
        return <Strip key={z.key} s={z.sprite} x={p.x - d / 2} y={p.y - d / 2} w={d} h={d} animated={anim.has(z.key)} loop tint={z.ton} className="fx-patch" />;
      })}
      {walls.map((w) => (
        <g key={w.key} className="fx-wall">
          {w.hexes.map(({ at, rotate }) => {
            const p = geo.hexCenter(at);
            const pw = geo.hexW * 1.15; const ph = pw * w.sprite.h / w.sprite.w;
            return <Strip key={`${at.col},${at.row}`} s={w.sprite} x={p.x - pw / 2} y={p.y - ph / 2} w={pw} h={ph} animated={anim.has(w.key)} loop rotate={rotate} cx={p.x} cy={p.y} tint={w.tint} outline={w.outline} />;
          })}
        </g>
      ))}
      {auras.map((a) => {
        const c = state.combatants[a.ownerId];
        if (!c?.pos) return null;
        const p = geo.tokenCenter(c);
        // Halka içeriği karenin ~%75'i: yarıçap (altıgen) kadar uzağı kapsasın.
        const d = ((2 * a.radius + 1) * geo.hexH) / 0.75;
        return <Strip key={a.key} s={a.sprite} x={p.x - d / 2} y={p.y - d / 2} w={d} h={d} animated={anim.has(a.key)} loop className="fx-aura" />;
      })}
    </g>
  );
}
