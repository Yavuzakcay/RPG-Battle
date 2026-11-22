/**
 * Görev SWARM95 (yalnız görünüm, tembel parça): sürü jetonunun çevresinde dönen küçük parçacıklar (yarasa/kuş kanadı,
 * böcek, kemirgen, balık). İki halka ters yönde döner (CSS); `animated: false` tek sabit kare. Sekme gizliyken
 * `.sprites-paused` durdurur. Mekaniğe ve olay günlüğüne girmez.
 */
import { MOTE_DATA, type MoteKind, type SwarmMote } from './swarmView';

function Mote({ kind, x, y, s, color }: { kind: MoteKind; x: number; y: number; s: number; color: string }) {
  if (kind === 'kanat') return <path d={`M ${x - 3 * s} ${y} Q ${x - 1.5 * s} ${y - 2.4 * s} ${x} ${y} Q ${x + 1.5 * s} ${y - 2.4 * s} ${x + 3 * s} ${y}`} stroke={color} strokeWidth={1.3 * s} fill="none" strokeLinecap="round" />;
  if (kind === 'kemirgen') return <ellipse cx={x} cy={y} rx={2.4 * s} ry={1.3 * s} fill={color} />;
  if (kind === 'balik') return <path d={`M ${x - 2.6 * s} ${y} Q ${x} ${y - 1.6 * s} ${x + 2.2 * s} ${y} Q ${x} ${y + 1.6 * s} ${x - 2.6 * s} ${y} M ${x + 2.2 * s} ${y} l ${1.4 * s} ${-1.1 * s} v ${2.2 * s} z`} fill={color} />;
  return <circle cx={x} cy={y} r={1.5 * s} fill={color} />;
}

function Ring({ m, radius, offset, spin, reverse }: { m: SwarmMote; radius: number; offset: number; spin: number; reverse: boolean }) {
  const n = MOTE_DATA.sayi;
  const s = Math.max(0.8, m.r / 26);
  const color = MOTE_DATA.renk[m.kind];
  return (
    <g className={`swarm-ring${m.animated ? '' : ' still'}${reverse ? ' rev' : ''}`} style={m.animated ? { animationDuration: `${spin}s` } : undefined}>
      {Array.from({ length: n }, (_, i) => {
        const a = ((i + offset) / n) * Math.PI * 2;
        // Halkada hafif düzensizlik: sürü dağınık görünsün (deterministik).
        const rr = radius * (1 + 0.09 * Math.sin(i * 2.3 + offset * 5));
        return <Mote key={i} kind={m.kind} x={Math.cos(a) * rr} y={Math.sin(a) * rr} s={s} color={color} />;
      })}
    </g>
  );
}

export default function SwarmMotes({ motes }: { motes: SwarmMote[] }) {
  if (motes.length === 0) return null;
  const [inner, outer] = MOTE_DATA.halka;
  const [t1, t2] = MOTE_DATA.turSn;
  return (
    <g className="swarm-motes-layer" aria-hidden="true">
      {motes.map((m) => (
        <g key={m.id} className={`swarm-motes ${m.kind}`} data-swarm={m.id} transform={`translate(${m.x} ${m.y})`}>
          <Ring m={m} radius={m.r * inner} offset={0} spin={t1} reverse={false} />
          <Ring m={m} radius={m.r * outer} offset={0.5} spin={t2} reverse />
        </g>
      ))}
    </g>
  );
}
