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

type Pt = { x: number; y: number };
interface Geo { hexCenter: (o: Offset) => Pt; tokenCenter: (c: Combatant) => Pt; hexW: number; hexH: number }

/** Tek şerit karesi: animasyonlu (`fx-play`, steps) ya da statik tek kare. */
function Strip({ s, x, y, w, h, animated, delay = 0, loop, rotate, cx, cy, tint, className }: {
  s: FxSprite; x: number; y: number; w: number; h: number; animated: boolean; delay?: number; loop?: boolean; rotate?: number; cx?: number; cy?: number;
  tint?: string; className?: string;
}) {
  const frame = stillFrame(s);
  const img: CSSProperties = animated
    ? ({ '--shift': `${-s.w * s.frames}px`, animation: `fx-play ${s.ms}ms steps(${s.frames}) ${delay}ms ${loop ? 'infinite' : 'both'}` } as CSSProperties)
    : { transform: `translateX(${-s.w * frame}px)` };
  // Statik tek seferlik efekt gecikmesine dek gizli, sonra tek kare (hareket yok).
  const box: CSSProperties | undefined = !animated && delay > 0 ? { animation: `fx-appear 1ms step-end ${delay}ms both` } : undefined;
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

  return (
    <g className="fx-shots" aria-hidden="true">
      {live.map((s) => {
        const c = s.targetId ? state.combatants[s.targetId] : undefined;
        const p = c?.pos ? geo.tokenCenter(c) : s.at ? geo.hexCenter(s.at) : null;
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
                <Strip key={i} s={s.sprite} x={a.x + i * stepW} y={a.y - ph / 2} w={pw} h={ph} animated={s.animated} delay={s.delay} loop />
              ))}
            </g>
          );
        }
        if (!p) return null;
        const w = geo.hexW * s.scale * (s.sprite.kind === 'alan' ? 0.75 : 0.55);
        const h = w * s.sprite.h / s.sprite.w;
        return <Strip key={s.id} s={s.sprite} x={p.x - w / 2} y={p.y - h / 2} w={w} h={h} animated={s.animated} delay={s.delay} rotate={s.rotate} />;
      })}
    </g>
  );
}

export function FxGround({ state, enabled, reduceMotion, geo, used, tokenUsed }: {
  state: BattleState; enabled: boolean; reduceMotion: boolean; geo: Geo;
  /** Ekranda zaten animasyonlu efekt sayısı (tek seferlikler + durum döngüleri) ve jeton başına kullanılan. */
  used: number; tokenUsed: ReadonlyMap<string, number>;
}) {
  const { auras, walls } = useMemo(() => groundFx(state), [state]);
  const anim = allocate([...auras.map((a) => ({ key: a.key, tokenId: a.ownerId })), ...walls.map((w) => ({ key: w.key }))], { enabled, reduceMotion, used, tokenUsed });
  const tints = [...new Set(walls.flatMap((w) => (w.tint ? [w.tint] : [])))];
  if (!auras.length && !walls.length) return null;
  return (
    <g className="fx-ground" aria-hidden="true">
      {tints.length > 0 && <defs>{tints.map((t) => <TintFilter key={t} color={t} />)}</defs>}
      {walls.map((w) => (
        <g key={w.key} className="fx-wall">
          {w.hexes.map(({ at, rotate }) => {
            const p = geo.hexCenter(at);
            const pw = geo.hexW * 1.15; const ph = pw * w.sprite.h / w.sprite.w;
            return <Strip key={`${at.col},${at.row}`} s={w.sprite} x={p.x - pw / 2} y={p.y - ph / 2} w={pw} h={ph} animated={anim.has(w.key)} loop rotate={rotate} cx={p.x} cy={p.y} tint={w.tint} />;
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
