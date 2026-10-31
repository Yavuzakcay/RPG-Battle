/**
 * Kuyruk 18 V4: sefer düğüm haritası; V3: ödül sahnesi (savaşsız). Yolculuk ekranının (tembel parça) içinde çizilir.
 * Arka plan veriden (`data/seferler.json` `harita.bands`: yatay renk şeritleri; ileride `harita.gorsel` bir ada görseli
 * olabilir). Düğüm konumları 0–1 (en/boy oranı); kenarlar düz ya da kesikli (etiketli). Ziyaret edilmemiş düğüm
 * karartılmış, tamamlanan parlak, bulunulan düğümde parti işareti. Yalnızca görsel: ilerleme yolculuk durumundan okunur.
 */
import type { Sefer, SeferNode } from '../journey/sefer';
import type { JourneyState } from '../journey/types';
import { getLang, t } from '../i18n';

const BASE = import.meta.env.BASE_URL;
const VIEW = { w: 1000, h: 560 };

/** Düğüm durumu: tamamlanan, bulunulan, henüz gidilmemiş. */
export function nodeState(state: Pick<JourneyState, 'stop' | 'result'>, i: number): 'done' | 'current' | 'todo' {
  if (i < state.stop) return 'done';
  if (i === state.stop) return state.result === 'won' ? 'done' : 'current';
  return 'todo';
}

export function SeferMap(props: { sefer: Sefer; state: JourneyState }) {
  const { sefer, state } = props;
  const en = getLang() === 'en';
  const S = t().journey.sefer;
  const pos = (n: SeferNode) => ({ x: n.x * VIEW.w, y: n.y * VIEW.h });
  const byId = new Map(sefer.nodes.map((n) => [n.id, n]));
  const index = new Map(sefer.nodes.map((n, i) => [n.id, i]));
  const bands = sefer.harita.bands ?? [];
  return (
    <figure className="sefer-map" aria-label={S.mapLabel}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img">
        <defs>
          <clipPath id="sefer-thumb"><circle r="44" /></clipPath>
          <filter id="sefer-dim"><feColorMatrix type="saturate" values="0.15" /><feComponentTransfer><feFuncR type="linear" slope="0.45" /><feFuncG type="linear" slope="0.45" /><feFuncB type="linear" slope="0.45" /></feComponentTransfer></filter>
        </defs>
        {sefer.harita.gorsel
          ? <image href={`${BASE}${sefer.harita.gorsel}`} width={VIEW.w} height={VIEW.h} preserveAspectRatio="xMidYMid slice" />
          : bands.map((b) => <rect key={b.from} x={b.from * VIEW.w} y={0} width={(b.to - b.from) * VIEW.w} height={VIEW.h} fill={b.color} />)}
        {sefer.edges.map((e) => {
          const a = byId.get(e.from), b = byId.get(e.to);
          if (!a || !b) return null;
          const p = pos(a), q = pos(b);
          const walked = (index.get(e.to) ?? 0) <= state.stop && (index.get(e.from) ?? 0) < (index.get(e.to) ?? 0);
          // Etiket çizginin ortasında, çizgiye dik 26 birim aşağıda (düğüm adlarıyla çakışmasın).
          const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
          let nx = -(q.y - p.y) / len, ny = (q.x - p.x) / len;
          if (ny < 0) { nx = -nx; ny = -ny; }
          const mid = { x: (p.x + q.x) / 2 + nx * 26, y: (p.y + q.y) / 2 + ny * 26 + 6 };
          return (
            <g key={`${e.from}-${e.to}`} className={`sefer-edge${walked ? ' walked' : ''}`}>
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeDasharray={e.style === 'dashed' ? '14 10' : undefined} />
              {e.label && <text x={mid.x} y={mid.y} textAnchor="middle">{en ? e.label.en : e.label.tr}</text>}
            </g>
          );
        })}
        {sefer.nodes.map((n, i) => {
          const p = pos(n);
          const st = nodeState(state, i);
          return (
            <g key={n.id} className={`sefer-node ${st}`} transform={`translate(${p.x} ${p.y})`}>
              <circle r="48" className="ring" />
              <circle r="44" className="base" />
              {n.thumb && <image href={`${BASE}${n.thumb}`} x={-60} y={-44} width={120} height={88} preserveAspectRatio="xMidYMid slice"
                clipPath="url(#sefer-thumb)" filter={st === 'todo' ? 'url(#sefer-dim)' : undefined} />}
              <text y={66} x={n.x < 0.12 ? -44 : n.x > 0.88 ? 44 : 0} textAnchor={n.x < 0.12 ? 'start' : n.x > 0.88 ? 'end' : 'middle'} className="name">{en ? n.name.en : n.name.tr}</text>
              {st === 'done' && <text y={-54} textAnchor="middle" className="tick">✓</text>}
              {st === 'current' && (
                <g className="party-marker" transform="translate(0 -62)">
                  <path d="M0 14 L-11 -4 A13 13 0 1 1 11 -4 Z" />
                  <text y={2} textAnchor="middle">{S.partyMark}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** V3: ödül sahnesi. Arka plan `odulSahnesi` (yoksa degrade); "Geri ışınla" ödülü alır, seferi bitirir, ana ekrana döner. */
export function RewardScene(props: { sefer: Sefer; node: SeferNode; claimed: boolean; onBeam: () => void; onHome: () => void }) {
  const { sefer, node } = props;
  const en = getLang() === 'en';
  const S = t().journey.sefer;
  const J = t().journey;
  const reward = node.reward ?? { gold: 0, potions: 0, items: [] };
  const names = sefer.esyaAdlari ?? {};
  const bg = sefer.odulSahnesi ? `url("${BASE}${sefer.odulSahnesi}"), ` : '';
  return (
    <section className="panel reward-scene" style={{ backgroundImage: `${bg}radial-gradient(ellipse at 50% 70%, #8a5a1a 0%, #3a2410 55%, #120a05 100%)` }}>
      <div className="reward-card">
        <h2>{en ? node.name.en : node.name.tr}</h2>
        <p>{S.rewardIntro}</p>
        <ul>
          {reward.gold > 0 && <li>🪙 {J.gold(reward.gold)}</li>}
          {reward.potions > 0 && <li>🧪 {J.potions(reward.potions)}</li>}
          {reward.items.map((id) => <li key={id}>✦ {names[id] ? (en ? names[id].en : names[id].tr) : id}</li>)}
        </ul>
        {props.claimed
          ? <><p><strong>{S.complete}</strong></p><button type="button" className="cta" onClick={props.onHome}>{t().common.home}</button></>
          : <button type="button" className="cta" onClick={props.onBeam}>{S.beam}</button>}
      </div>
    </section>
  );
}
