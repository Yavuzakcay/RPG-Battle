/**
 * Kuyruk 15 K15C: sprite'lı alan çizimi. Taban: kapsanan altıgenlerin birleşimi baskın renkte, yumuşak kenarlı
 * (bulanık); üstte altıgenden %40–80 büyük, örtüşen yamalar (varyant, dönüş, ayna hash'ten). Sınırda sert kesim yok:
 * kenar altıgenlerinin yaması (komşusu alanda olmayan) daha küçük ve yarı saydam, taban bulanık söner. Maske
 * denendi, animasyonla her tıkta yeniden hesaplandığı için kare süresini ≈2,4 katına çıkarıyordu (DECISIONS.md). Animasyon yalnızca CSS (görsel; motor, replay, kayıt yok).
 */
import type { CSSProperties } from 'react';
import { neighbors, type Offset } from '../rules/hex';
import type { ZoneLook, ZonePatch } from './sprites';

/**
 * Ortak tık (1/6 sn): bütün yüzey animasyonları adımlı ve adımları aynı anlara hizalı (faz tık katı). Böylece harita
 * saniyede ≈6 kez yeniden çizilir, her karede değil (maske ve bulanıklık pahalı; piksel sanatına adımlı hareket uyar).
 */
export const TICK_MS = 1000 / 6;
/** Animasyon süreleri tık sayısıyla (CSS'teki süre ve steps() bunlarla aynı): kayma 9 sn, alev karesi 1 tık, parlama ≈4,2 sn, yükselme 1,5 sn. */
const TICKS: Record<string, number> = { drift: 54, flicker: 1, flick: 7, shimmer: 25, rise: 9 };

interface Props {
  id: string;
  look: ZoneLook;
  hexes: readonly Offset[];
  /** Yalnızca bunlar için yama (geniş haritada görünen altıgenler); yoksa hepsi. */
  visible?: ReadonlySet<string> | null;
  animate: boolean;
  hexW: number;
  base: string;
  hexPoints: (h: Offset, scale?: number) => string;
  hexCenter: (h: Offset) => { x: number; y: number };
}

const keyOf = (h: Offset) => `${h.col},${h.row}`;
/** Kenar yaması: boyu ×0,82 (taşma yarıya iner), saydamlık 0,6. */
const EDGE_SCALE = 0.82;
const EDGE_OPACITY = 0.6;

function Patch({ p, w, base, animate, c, edge }: { p: ZonePatch; w: number; base: string; animate: boolean; c: { x: number; y: number }; edge: boolean }) {
  const href = (n: string) => `${base}sprites/${n}.webp`;
  const img = (n: string, extra?: { className?: string; style?: CSSProperties; opacity?: number }) => (
    <image key={`${n}${extra?.className ?? ''}`} href={href(n)} x={-w / 2} y={-w / 2} width={w} height={w} className={`sprite${extra?.className ? ` ${extra.className}` : ''}`}
      style={extra?.style} opacity={extra?.opacity} />
  );
  // Faz tık katına yuvarlanır: farklı altıgenlerin adımları aynı anda değişir.
  const delay = (ticks: number, shift = 0): CSSProperties => ({ animationDelay: `${-Math.round(((p.phase + shift) % 1) * ticks) * TICK_MS}ms` });
  const anim = animate ? p.anim : 'none';
  let body;
  if (anim === 'drift') {
    // İki kopya zıt yönlere kayar; boy ve saydamlık "nefes alır"; ikinci kopya aynalı.
    body = <>{img(p.name, { className: 'drift-a', style: delay(TICKS.drift!) })}{img(p.name, { className: 'drift-b', style: delay(TICKS.drift!, 0.5), opacity: 0.6 })}</>;
  } else if (anim === 'flicker') {
    const n = p.cycle.length;
    body = (
      <g className="flick" style={delay(TICKS.flick!)}>
        {n > 1 ? p.cycle.map((name, i) => img(name, { className: `cyc cyc${n}`, style: { animationDelay: `${(i - Math.round(p.phase * n)) * TICK_MS}ms` } })) : img(p.name)}
      </g>
    );
  } else if (anim === 'rise') {
    body = <>{img(p.name, { className: 'rise', style: delay(TICKS.rise!) })}{img(p.name, { className: 'rise', style: delay(TICKS.rise!, 0.5) })}</>;
  } else if (anim === 'shimmer') {
    body = img(p.name, { className: 'shimmer', style: delay(TICKS.shimmer!) });
  } else body = img(p.name);
  return <g transform={`translate(${c.x} ${c.y}) rotate(${p.rot}) scale(${(p.flip ? -1 : 1) * (edge ? EDGE_SCALE : 1)} ${edge ? EDGE_SCALE : 1})`} opacity={edge ? EDGE_OPACITY : undefined}>{body}</g>;
}

export function SpriteZone({ id, look, hexes, visible, animate, hexW, base, hexPoints, hexCenter }: Props) {
  const w = hexW * look.scale;
  const inZone = new Set(hexes.map(keyOf));
  const shown = visible ? look.patches.filter((p) => visible.has(keyOf(p.hex))) : look.patches;
  return (
    <g className={`sprite-zone${look.soft ? ' soft' : ''}`} data-zone={id}>
      {/* Taban: birleşim (altıgenler 1,02 ölçekle örtüşür, aralarında boşluk yok), bulanık kenar; durağan. */}
      <g className="zone-base" filter="url(#zone-soft)" fill={look.color} opacity={look.soft ? 0.4 : 0.75}>
        {hexes.map((h) => <polygon key={keyOf(h)} points={hexPoints(h, 1.02)} />)}
      </g>
      <g opacity={look.opacity}>
        {shown.map((p) => <Patch key={keyOf(p.hex)} p={p} w={w} base={base} animate={animate} c={hexCenter(p.hex)}
          edge={neighbors(p.hex).some((n) => !inZone.has(keyOf(n)))} />)}
      </g>
    </g>
  );
}

/** Tek seferlik patlama: 0,3 → 1,2 ölçek, sönerek (`ms`). */
export function SpriteBurst({ at, name, w, ms, base, hexCenter }: { at: Offset; name: string; w: number; ms: number; base: string; hexCenter: (h: Offset) => { x: number; y: number } }) {
  const c = hexCenter(at);
  return (
    <g transform={`translate(${c.x} ${c.y})`} className="sprite-burst-wrap" aria-hidden="true">
      <image href={`${base}sprites/${name}.webp`} x={-w / 2} y={-w / 2} width={w} height={w} className="sprite sprite-burst" style={{ animationDuration: `${ms}ms` }} />
    </g>
  );
}
