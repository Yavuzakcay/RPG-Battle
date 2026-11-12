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
import { FX, SCREEN_BUDGET, SU, allocate, deathShots, fxShots, groundFx, hexVariant, stillFrame, waterHexes, type FxShot, type FxSprite, type GroundPatch, type WaterHex } from './fxPlan';
import './fx.css';

const BASE = import.meta.env.BASE_URL;
/** Kuyruk E2: mermi uçuş süresi (ms). */
const TRAVEL_MS = 320;

type Pt = { x: number; y: number };
interface Geo { hexCenter: (o: Offset) => Pt; tokenCenter: (c: Combatant) => Pt; hexW: number; hexH: number }

/** Tek şerit karesi: animasyonlu (`fx-play`, steps) ya da statik tek kare. */
function Strip({ s, x, y, w, h, animated, delay = 0, loop, hold, rotate, cx, cy, tint, outline, className, hue, style }: {
  s: FxSprite; x: number; y: number; w: number; h: number; animated: boolean; delay?: number; loop?: boolean;
  /** Kuyruk E4c: tek seferlik ama kalıcı doku: kareler sırayla oynar, son karede kalır (normal tek seferlik animasyon sonunda boşa kayardı). */
  hold?: boolean; rotate?: number; cx?: number; cy?: number;
  tint?: string; outline?: string; className?: string; hue?: number; style?: CSSProperties;
}) {
  const frame = stillFrame(s);
  const img: CSSProperties = animated && hold && s.frames > 1
    ? ({ '--shift': `${-s.w * (s.frames - 1)}px`, animation: `fx-play ${s.ms}ms steps(${s.frames - 1}) ${delay}ms both` } as CSSProperties)
    : animated
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

/** Kuyruk E4b: durum halkası çapı (altıgen yüksekliği katı; jeton çapı 0,72 × ölçek, halka deliği karenin ~%60'ı). */
const RING_D = 1.3;
/** Kuyruk E4b: parçanın iki ucunu `ratio` oranında saydamlaştıran maske (CSS mask-image; parçayla birlikte döner). */
const softEnds = (ratio: number): CSSProperties => {
  const g = `linear-gradient(to right, transparent 0, #000 ${ratio * 100}%, #000 ${100 - ratio * 100}%, transparent 100%)`;
  return { maskImage: g, WebkitMaskImage: g };
};

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
        // Kuyruk E4c: çapa (karenin üstten oranı) jetonun tabanına (merkez + 0,36 altıgen yüksekliği) oturur: yükselen toz jetonun altından çıkar.
        const y = s.anchor !== undefined ? p.y + geo.hexH * 0.36 - (s.anchor - 0.5) * h : p.y + (s.dy ?? 0) * geo.hexW;
        return <Strip key={s.id} s={s.sprite} x={p.x - w / 2} y={y - h / 2} w={w} h={h} animated={s.animated} delay={s.delay} rotate={s.rotate} tint={s.ton} hue={s.hue}
          style={s.alpha !== undefined ? { opacity: s.alpha } : undefined}
          className={s.sprite.kind === 'isaret' ? `fx-simge${s.animated ? '' : ' still'}` : undefined} />;
      })}
    </g>
  );
}

/**
 * Kuyruk E4b: su dokusu (savaş haritasında su arka plan resminde pişmiştir; üstüne yarı saydam, normal karışımlı hareketli doku).
 * Türün bütün su altıgenleri tek yol (`path`) ve tek desen (`pattern`) kullanır: animasyon tek örnek, altıgenler arası dikiş yok.
 * Desen karosu dört yönde aynalanır (kenarları uyumlu, karo dikişi görünmez). Efekt kapalı / hareketi azalt: tek sabit kare.
 */
/** Altıgenlerin birleşimi tek yol (komşu altıgenler `grow` kadar örtüşür; kıl çizgi olmasın). */
function hexPath(hexes: Offset[], geo: Geo, grow = 1.03): string {
  const R = (geo.hexW / 2) * grow;
  return hexes.map((at) => {
    const c = geo.hexCenter(at);
    return `M${[0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i; return `${(c.x + R * Math.cos(a)).toFixed(1)} ${(c.y + R * Math.sin(a)).toFixed(1)}`; }).join('L')}Z`;
  }).join('');
}

/**
 * Kuyruk E4c: altıgen başına döşenen zemin dokusu (deprem yarığı): her altıgen kendi koordinatından türetilmiş döndürme ve aynalamayla,
 * kendi altıgenine kırpılmış doku alır. 12 görünüm = 12 desen; desen karosu (3 × yarıçap, altıgen yüksekliği) iki sütunun altıgenlerini
 * (tek sütunun karo sınırına taşan yarımları dahil beş çizim) taşır, aynı görünümdeki altıgenler tek yolda doldurulur (animasyon örneği görünüm başına bir; altıgen sayısından bağımsız).
 */
function TiledPatch({ patch, geo, animated }: { patch: GroundPatch; geo: Geo; animated: boolean }) {
  const s = patch.sprite;
  // Kuyruk SU2: `tekKaro` (altıgen eni katı): altıgen başına döndürme yok; tek büyük karo dünya koordinatında dört yönde aynalanır
  // (karo dikişi görünmez), alan altıgenlerinin birleşimine kırpılır → çatlaklar komşu altıgenlerde kesilmeden devam eder; animasyon örneği 1.
  if (patch.karo!.tekKaro) {
    const tw = geo.hexW * patch.karo!.tekKaro; const th = (tw * s.h) / s.w;
    const id = `fx-hk1-${patch.key.replace(/[^A-Za-z0-9]/g, '')}`;
    const cell = (fx: number, fy: number) => (
      <g key={`${fx}${fy}`} transform={`translate(${fx < 0 ? 2 * tw : 0} ${fy < 0 ? 2 * th : 0}) scale(${fx} ${fy})`}>
        <Strip s={s} x={0} y={0} w={tw} h={th} animated={animated} loop={patch.loop} hold={!patch.loop} />
      </g>
    );
    return (
      <g className="fx-patch-tiled fx-patch-single" opacity={patch.karo!.opaklik}>
        <defs><pattern id={id} patternUnits="userSpaceOnUse" width={2 * tw} height={2 * th}>{cell(1, 1)}{cell(-1, 1)}{cell(1, -1)}{cell(-1, -1)}</pattern></defs>
        <path d={hexPath(patch.hexes, geo, 1.01)} fill={`url(#${id})`} />
      </g>
    );
  }
  const S = geo.hexW / 2; const HH = geo.hexH;
  const byVar = new Map<number, Offset[]>();
  for (const h of patch.hexes) { const v = hexVariant(h); (byVar.get(v) ?? byVar.set(v, []).get(v)!).push(h); }
  const hex = [0, 1, 2, 3, 4, 5].map((i) => `${(S * Math.cos((Math.PI / 3) * i)).toFixed(1)} ${(S * Math.sin((Math.PI / 3) * i)).toFixed(1)}`).join('L');
  const key = patch.key.replace(/[^A-Za-z0-9]/g, '');
  const d = S * 4.4; // doku altıgenden büyük: her altıgen çatlağın kendi parçasını gösterir (kırpma altıgene)
  const tile = (v: number, cx: number, cy: number, k: string) => (
    <g key={k} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)})`} clipPath={`url(#fx-hk-${key})`}>
      <g transform={`rotate(${(v % 6) * 60}) scale(${v >= 6 ? -1 : 1} 1)`}>
        <Strip s={s} x={-d / 2} y={-d / 2} w={d} h={d} animated={animated} loop={patch.loop} hold={!patch.loop} />
      </g>
    </g>
  );
  return (
    <g className="fx-patch-tiled" opacity={patch.karo!.opaklik}>
      <defs><clipPath id={`fx-hk-${key}`}><path d={`M${hex}Z`} /></clipPath></defs>
      {[...byVar.entries()].map(([v, hexes]) => (
        <g key={v}>
          <defs>
            <pattern id={`fx-hp-${key}-${v}`} patternUnits="userSpaceOnUse" width={3 * S} height={HH}>
              {tile(v, S, HH / 2, 'a')}{tile(v, 2.5 * S, 0, 'b')}{tile(v, 2.5 * S, HH, 'c')}{tile(v, -0.5 * S, 0, 'd')}{tile(v, -0.5 * S, HH, 'e')}
            </pattern>
          </defs>
          <path d={hexPath(hexes, geo, 1.01)} fill={`url(#fx-hp-${key}-${v})`} />
        </g>
      ))}
    </g>
  );
}

function WaterLayer({ kind, hexes, geo, animated }: { kind: WaterHex['kind']; hexes: WaterHex[]; geo: Geo; animated: boolean }) {
  const s = FX[SU.sprite[kind]];
  if (!s) return null;
  const tw = geo.hexW * SU.karoEn; const th = (tw * s.h) / s.w;
  const id = `fx-su-${kind}`;
  const cell = (fx: number, fy: number) => (
    <g key={`${fx}${fy}`} transform={`translate(${fx < 0 ? 2 * tw : 0} ${fy < 0 ? 2 * th : 0}) scale(${fx} ${fy})`}>
      <Strip s={s} x={0} y={0} w={tw} h={th} animated={animated} loop />
    </g>
  );
  // Kuyruk SU3: aynı desen (tek animasyon örneği), dört yol: iç / kıyı (soluk + yumuşak kenar) × normal / sığ (`ekle`, soluk).
  const groups = [false, true].flatMap((shallow) => [false, true].map((shore) => ({ shallow, shore, at: hexes.filter((h) => !!h.shallow === shallow && !!h.shore === shore).map((h) => h.at) })))
    .filter((g) => g.at.length);
  return (
    <g className="fx-water" data-water={kind}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={2 * tw} height={2 * th}>
          {cell(1, 1)}{cell(-1, 1)}{cell(1, -1)}{cell(-1, -1)}
        </pattern>
        {groups.some((g) => g.shore) && <filter id={`${id}-yumusat`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={SU.kenarYumusat} /></filter>}
      </defs>
      {groups.map((g) => (
        <path key={`${+g.shallow}${+g.shore}`} d={hexPath(g.at, geo)} fill={`url(#${id})`} data-shore={g.shore ? '1' : undefined} data-shallow={g.shallow ? '1' : undefined}
          opacity={+(SU.opaklik[kind] * (g.shallow ? SU.ekleOpaklik : 1) * (g.shore ? SU.kiyiOpaklik : 1)).toFixed(3)}
          filter={g.shore ? `url(#${id}-yumusat)` : undefined} />
      ))}
    </g>
  );
}

export function FxGround({ state, enabled, reduceMotion, geo, used, tokenUsed }: {
  state: BattleState; enabled: boolean; reduceMotion: boolean; geo: Geo;
  /** Ekranda zaten animasyonlu efekt sayısı (tek seferlikler + durum döngüleri) ve jeton başına kullanılan. */
  used: number; tokenUsed: ReadonlyMap<string, number>;
}) {
  const { auras, walls, patches } = useMemo(() => groundFx(state), [state]);
  // Kuyruk E4b: su altıgenleri (dalga/havuz); türün bütün altıgenleri tek animasyon örneğini (desen) paylaşır.
  const water = useMemo(() => waterHexes(state), [state.map?.tiles]); // eslint-disable-line react-hooks/exhaustive-deps
  const waterKinds = (['dalga', 'havuz'] as const).filter((k) => water.some((w) => w.kind === k));
  const anim = allocate([...auras.map((a) => ({ key: a.key, tokenId: a.ownerId })), ...walls.map((w) => ({ key: w.key })), ...patches.map((z) => ({ key: z.key })),
    ...waterKinds.map((k) => ({ key: `su:${k}` }))], { enabled, reduceMotion, used, tokenUsed });
  const tints = [...new Set([...walls.flatMap((w) => (w.tint ? [w.tint] : [])), ...patches.flatMap((z) => (z.ton ? [z.ton] : []))])];
  if (!auras.length && !walls.length && !patches.length && !waterKinds.length) return null;
  return (
    <g className="fx-ground" aria-hidden="true">
      {tints.length > 0 && <defs>{tints.map((t) => <TintFilter key={t} color={t} />)}</defs>}
      {waterKinds.map((k) => <WaterLayer key={k} kind={k} hexes={water.filter((w) => w.kind === k)} geo={geo} animated={anim.has(`su:${k}`)} />)}
      {patches.map((z) => {
        // Kuyruk E2: kalıcı alan zemin dokusu (alanın merkezinde, alan kadar; jetonların altında).
        // Kuyruk E4b: doku alanın altıgenlerinin birleşimine kırpılır (altıgen maske): alan dışına taşmaz, tek doku altıgenler arasında kesilmez.
        const p = geo.hexCenter(z.at);
        const d = ((2 * z.radius + 1) * geo.hexH) / 0.8;
        const clip = `fx-hexclip-${z.key.replace(/[^A-Za-z0-9]/g, '')}`;
        if (z.karo) return <TiledPatch key={z.key} patch={z} geo={geo} animated={anim.has(z.key)} />;
        return (
          <g key={z.key} className="fx-patch-clip">
            <clipPath id={clip}><path d={hexPath(z.hexes, geo, 1)} /></clipPath>
            <g clipPath={`url(#${clip})`}>
              <Strip s={z.sprite} x={p.x - d / 2} y={p.y - d / 2} w={d} h={d} animated={anim.has(z.key)} loop={z.loop} tint={z.ton} className="fx-patch" />
            </g>
          </g>
        );
      })}
      {walls.map((w) => (
        <g key={w.key} className="fx-wall">
          {w.hexes.map(({ at, rotate }) => {
            const p = geo.hexCenter(at);
            const pw = geo.hexW * 1.15; const ph = pw * w.sprite.h / w.sprite.w;
            // Kuyruk E4b: dikişsiz olmayan duvar (rüzgâr): parça uçları yumuşar, komşu parçayla çapraz geçiş.
            const soft = w.soft ? softEnds(w.soft) : undefined;
            return <Strip key={`${at.col},${at.row}`} s={w.sprite} x={p.x - pw / 2} y={p.y - ph / 2} w={pw} h={ph} animated={anim.has(w.key)} loop rotate={rotate} cx={p.x} cy={p.y} tint={w.tint} outline={w.outline} style={soft} />;
          })}
        </g>
      ))}
      {auras.map((a) => {
        const c = state.combatants[a.ownerId];
        if (!c?.pos) return null;
        const p = geo.tokenCenter(c);
        // Halka içeriği karenin ~%75'i: yarıçap (altıgen) kadar uzağı kapsasın.
        // Kuyruk E4b: durum halkası (taşlaşma) jetonun görsel ölçeğine uyar (halka deliği jetonu kapsar, ortası siyah = saydam).
        const d = a.ring ? RING_D * geo.hexH * Math.max(1, a.ring) : ((2 * a.radius + 1) * geo.hexH) / 0.75;
        return <Strip key={a.key} s={a.sprite} x={p.x - d / 2} y={p.y - d / 2} w={d} h={d} animated={anim.has(a.key)} loop className={a.ring ? 'fx-aura fx-ring' : 'fx-aura'} />;
      })}
    </g>
  );
}
