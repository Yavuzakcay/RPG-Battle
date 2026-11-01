/**
 * Kuyruk 31: Serüven ekranı (tembel parça). Kıta sayfası (resim `public/kita/`, yoksa bölge renginde yedek), düğümler
 * (kilitli/açık/tamamlandı), yollar, giriş/çıkış okları, parti işareti (yürüme animasyonu), bilgi kartı (Gir/Al/İncele,
 * gündüz/gece), alt çubukta parti; Serüven kuralları paneli; geliştirici düğüm aracı (#dugum). Komutlar
 * `executeSeruven`'e gider; olay günlüğü yolculuk kaydında isteğe bağlı `seruven` alanında (`seruvenSave.ts`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SERUVEN, TOGGLE_KEYS, executeSeruven, gateOpen, prevPage, levelXp, linkCrossable, linksHere, nodeKey, nodeOpen, nodeStop, nodeVisible, pageById, pageOrder, toggleOn,
  type SeruvenCommand, type SeruvenEvent, type SeruvenNode, type SeruvenPage, type SeruvenState,
} from '../journey/seruven';
import { seferById } from '../journey/sefer';
import { clearSeruven, loadSeruven, saveSeruven } from '../app/seruvenSave';
import { isNight, linkCrossCommand, linkSession, nightVariant, nodeJourney, seruvenBattleSession, seruvenResultCommand, seruvenSkipCommand, yerlesimCrossCommand, yerlesimSession } from '../app/seruvenBattle';
import { YerlesimHub } from './YerlesimHub';
import { gorunumFiltre, yerlesimById } from '../yerlesim/yerlesim';

/** Kuyruk 35: yerleşim haritası savaşında görselin renk filtresi (yerleşimin görünümü; ayar savaş ekranında). */
const yerFilter = (s: SeruvenState): string | undefined => {
  const y = s.yerlesim ? yerlesimById(s.yerlesim.id) : undefined;
  return (y && gorunumFiltre(y)) || undefined;
};
import { stopParticipants } from '../app/journeyBattle';
import { statusBlock } from '../app/partyStatus';
import { fullStatus } from '../rules/characterRest';
import { MAX_PARTY } from '../app/limits';
import type { SavedCharacter } from '../rules/builder';
import type { BattleState } from '../battle';
import type { Session } from '../ui/session';
import { getLang, t } from '../i18n';
import { STRINGS_TR } from '../i18n/strings';

const BASE = import.meta.env.BASE_URL;
const toolOn = () => { try { return location.hash.includes('dugum') || localStorage.getItem('rpg-battle-dugum') === '1'; } catch { return false; } };

/** Düğümün görünen adı: sefer düğümünün adı ya da haritanın görünen adı. */
export function nodeName(s: SeruvenState, node: SeruvenNode, en: boolean): string {
  if (node.ad) return en ? node.ad.en : node.ad.tr;
  if (node.sefer) {
    const [sid, nid] = node.sefer.split(':');
    const n = sid ? seferById(sid)?.nodes.find((x) => x.id === nid) : undefined;
    if (n) return en ? n.name.en : n.name.tr;
  }
  const j = nodeJourney({ ...s, night: [] }, node.id);
  const mapId = j ? stopParticipants(j)?.scenario.map?.mapId : undefined;
  const info = mapId ? (en ? t().gm.mapInfo[mapId] : STRINGS_TR.gm.mapInfo[mapId]) : undefined;
  return info?.name ?? node.id;
}

export function SeruvenScreen(props: {
  characters: SavedCharacter[]; onBack: () => void; onBattle: (s: Session, node: string, mapFilter?: string) => void;
  result?: { final: BattleState; node: string } | null; onResultUsed?: () => void;
}) {
  const S = t().seruven;
  const [loaded] = useState(() => loadSeruven());
  const [events, setEvents] = useState<SeruvenEvent[]>(loaded.events);
  const [state, setState] = useState<SeruvenState | null>(loaded.state);
  const [error, setError] = useState<string | null>(null);
  const run = (cmd: SeruvenCommand): boolean => {
    const r = executeSeruven(state, cmd);
    if (!r.ok) { setError(r.error); return false; }
    const next = cmd.type === 'start' ? r.events : [...events, ...r.events];
    setEvents(next); setState(r.state); setError(null); saveSeruven(next);
    return true;
  };
  // Biten savaştan dönüş: sonuç bir kez yazılır.
  useEffect(() => {
    if (!props.result || !state) return;
    // Kuyruk 32: bağlantı koridoru (`link:<kimlik>`): çıkışa varıldıysa karşı uca geçiş.
    const node = props.result.node;
    // Kuyruk 34b: yerleşim haritası: kapıya varıldıysa sonraki harita hemen açılır, yoksa hub'a dönülür.
    if (node.startsWith('yer:')) {
      const yc = yerlesimCrossCommand(state, props.result.final);
      const next = yc ? executeSeruven(state, yc) : null;
      props.onResultUsed?.();
      if (yc && run(yc) && next?.ok && yc.map) {
        const ss = yerlesimSession(next.state, Math.random);
        if (ss) props.onBattle(ss, `yer:${yc.map}`, yerFilter(next.state));
      }
      return;
    }
    const cmd = node.startsWith('link:') ? linkCrossCommand(state, node.slice(5), props.result.final) : seruvenResultCommand(state, node, props.result.final);
    if (cmd) run(cmd);
    props.onResultUsed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.result]);

  if (!state) {
    return (
      <div className="menu-screen"><main className="app journey">
        <header><h1>{S.title}</h1><button className="ghost" onClick={props.onBack}>{S.back}</button></header>
        <StartForm characters={props.characters} onStart={run} error={error} />
      </main></div>
    );
  }
  const reset = () => { clearSeruven(); setEvents([]); setState(null); };
  const onMap = (map: string) => {
    const cmd: SeruvenCommand = { type: 'yerlesim_map', map, via: 'hub' };
    const next = executeSeruven(state, cmd);
    if (!run(cmd) || !next.ok) return;
    const ss = yerlesimSession(next.state, Math.random);
    if (ss) props.onBattle(ss, `yer:${map}`, yerFilter(next.state));
  };
  return <PageView state={state} run={run} error={error} onBack={props.onBack} onReset={reset} onMap={onMap}
    onBattle={(node) => {
      const s = node.startsWith('link:') ? linkSession(state, node.slice(5), Math.random) : seruvenBattleSession(state, node, Math.random);
      if (s) props.onBattle(s, node);
    }} />;
}

function StartForm(props: { characters: SavedCharacter[]; onStart: (c: SeruvenCommand) => void; error: string | null }) {
  const S = t().seruven;
  const [picked, setPicked] = useState<string[]>([]);
  const [race, setRace] = useState(SERUVEN.anahtarlar.irkBaslangic?.default ?? true);
  const able = props.characters.filter((c) => !statusBlock(c));
  if (!props.characters.length) return <p>{S.none}</p>;
  return (
    <section className="panel journey-start">
      <fieldset><legend>{S.party} ({picked.length}/{MAX_PARTY})</legend>
        {props.characters.map((c) => (
          <label key={c.id} className="journey-pick">
            <input type="checkbox" disabled={!able.includes(c) || (!picked.includes(c.id) && picked.length >= MAX_PARTY)} checked={picked.includes(c.id)}
              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
            {' '}{c.sheet.name}{!able.includes(c) ? ` (${S.unavailable})` : ''}
          </label>
        ))}
      </fieldset>
      <label><input type="checkbox" checked={race} onChange={(e) => setRace(e.target.checked)} /> {S.raceStart}</label>
      <button type="button" className="cta" disabled={!picked.length} onClick={() => props.onStart({
        type: 'start', id: `s${Date.now()}`, seed: Math.floor(Math.random() * 1e9), toggles: { irkBaslangic: race },
        party: props.characters.filter((c) => picked.includes(c.id)).map((c) => ({ id: c.id, name: c.sheet.name, sheet: c.sheet, ...(c.status ? { status: c.status } : {}) })),
      })}>{S.start}</button>
      {props.error && <p className="error">{props.error}</p>}
    </section>
  );
}

type Point = { x: number; y: number };
const pct = (p: Point) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%` });
/** Sayfa kenarındaki giriş/çıkış okları içeride görünsün. */
const edge = (p: Point) => pct({ x: Math.min(0.97, Math.max(0.03, p.x)), y: Math.min(0.94, Math.max(0.06, p.y)) });

export function PageView(props: { state: SeruvenState; run: (c: SeruvenCommand) => boolean; error: string | null; onBack: () => void; onReset: () => void; onBattle: (node: string) => void; onMap?: (map: string) => void }) {
  const { state, run } = props;
  const S = t().seruven;
  const en = getLang() === 'en';
  const page = pageById(state.page) as SeruvenPage;
  const order = pageOrder();
  const idx = order.findIndex((p) => p.id === page.id);
  const [card, setCard] = useState<string | null>(null);
  const [rules, setRules] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [walking, setWalking] = useState(false);
  const [tool] = useState(toolOn);
  const [picks, setPicks] = useState<Point[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setImgOk(true); setCard(null); }, [page.id]);
  const at: Point = state.at === 'giris' ? page.entry : state.at === 'cikis' && page.exit ? page.exit : state.at === 'portal' && page.portal ? page.portal
    : page.nodes.find((n) => n.id === state.at) ?? page.entry;
  const animMs = toggleOn(state, 'yurumeAnimasyonu') ? SERUVEN.yurumeMs : 0;
  const go = (to: string, then?: () => void) => {
    if (state.at === to) { then?.(); return; }
    if (!run({ type: 'move', to })) return;
    if (animMs > 0) { setWalking(true); window.setTimeout(() => { setWalking(false); then?.(); }, animMs); } else then?.();
  };
  const shown = page.nodes.filter((n) => nodeVisible(state, n));
  const lines = useMemo(() => page.nodes.filter((n) => nodeVisible(state, n)).flatMap((n) => {
    const from = n.requires.length ? n.requires.map((r) => page.nodes.find((x) => x.id === r)).filter((x): x is SeruvenNode => !!x) : [page.entry];
    return from.map((f) => ({ a: f as Point, b: n as Point, open: nodeOpen(state, page, n), key: `${'id' in f ? f.id : 'giris'}-${n.id}` }));
  }).concat(page.exit ? page.exit.requires.map((r) => {
    const a = page.nodes.find((x) => x.id === r) as Point;
    return { a, b: page.exit as Point, open: gateOpen(state, page, page.exit), key: `${r}-cikis` };
  }) : []), [page, state]);
  const onPageClick = (e: React.MouseEvent) => {
    if (!tool || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const p = { x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000 };
    setPicks((l) => [...l, p]);
  };
  const cardNode = card ? page.nodes.find((n) => n.id === card) : undefined;
  const prev = prevPage(state, page);
  // Kuyruk 34b: yerleşimdeyken hub ekranı (sayfa yerine).
  if (state.yerlesim) {
    return (
      <div className="seruven-screen">
        <header className="seruven-head"><button className="ghost" onClick={props.onBack}>{S.back}</button><strong>{en ? page.name.en : page.name.tr}</strong></header>
        <YerlesimHub state={state} run={run} onMap={(m) => props.onMap?.(m)} error={props.error} />
      </div>
    );
  }
  return (
    <div className="seruven-screen">
      <header className="seruven-head">
        <button className="ghost" onClick={props.onBack}>{S.back}</button>
        <strong>{en ? page.name.en : page.name.tr}</strong>
        <span>{page.ada ? S.portal : S.page(Math.max(1, idx + 1), order.length)}</span>
        <span>{S.level(state.level)}</span><span>{S.gold(state.gold)}</span><span>{S.potions(state.potions)}</span>
        <button className="ghost" onClick={() => setRules((v) => !v)}>{S.rules}</button>
      </header>
      <div className={`seruven-page${imgOk ? '' : ' noimg'}`} ref={boxRef} onClick={onPageClick}
        style={{ ['--bolge' as string]: page.renk, ['--oran' as string]: String((page.boyut?.[0] ?? 2752) / (page.boyut?.[1] ?? 1536)) }} data-page={page.id}>
        {imgOk ? <img src={`${BASE}${page.gorsel}`} alt="" onError={() => setImgOk(false)} draggable={false} />
          : <div className="seruven-fallback"><span>{en ? page.name.en : page.name.tr}</span><small>{S.missingImage}</small></div>}
        <svg className="seruven-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {lines.map((l) => <line key={l.key} x1={l.a.x * 100} y1={l.a.y * 100} x2={l.b.x * 100} y2={l.b.y * 100} className={l.open ? 'open' : 'locked'} />)}
        </svg>
        {(page.susler ?? []).map((d) => <span key={d.id} className="seruven-deco" style={pct(d)} aria-hidden="true">{d.icon}</span>)}
        {prev ? <button type="button" className="seruven-gate entry open" style={edge(page.entry)} aria-label={S.prevPage} title={S.prevPage} disabled={walking}
          onClick={(e) => { e.stopPropagation(); run({ type: 'move', to: 'geri' }); }}>⇨</button>
          : <span className="seruven-gate entry" style={edge(page.entry)} aria-label={S.entry}>⇦</span>}
        {page.exit && (
          <button type="button" className={`seruven-gate exit${gateOpen(state, page, page.exit) ? ' open' : ''}`} style={edge(page.exit)} aria-label={S.exit}
            title={gateOpen(state, page, page.exit) ? undefined : S.exitClosed}
            disabled={!gateOpen(state, page, page.exit) || walking} onClick={(e) => { e.stopPropagation(); go('cikis'); }}>⇦</button>
        )}
        {page.portal && (
          <button type="button" className={`seruven-gate portal${gateOpen(state, page, page.portal) ? ' open' : ''}`} style={edge(page.portal)} aria-label={S.portal}
            disabled={!gateOpen(state, page, page.portal) || walking} onClick={(e) => { e.stopPropagation(); go('portal'); }}>◎</button>
        )}
        {/* Kuyruk 32: açık bağlantının (yeraltı nehri) uçlarında su damlası. */}
        {(SERUVEN.baglantilar ?? []).filter((l) => state.links?.includes(l.id)).flatMap((l) => [l.a, l.b]).filter((u) => u.page === page.id).map((u) => {
          const n = page.nodes.find((x) => x.id === u.node);
          return n ? <span key={`su-${u.node}`} className="seruven-deco water" style={pct({ x: n.x + 0.03, y: n.y - 0.05 })} aria-hidden="true">💧</span> : null;
        })}
        {shown.map((n) => {
          const key = nodeKey(page.id, n.id);
          const done = state.done.includes(key);
          const open = nodeOpen(state, page, n);
          return (
            <button key={n.id} type="button" data-node={n.id}
              className={`seruven-node${done ? ' done' : open ? ' open' : ' locked'}${n.boss ? ' boss' : ''}${n.optional ? ' optional' : ''}${n.yerlesim ? ' settlement' : ''}${state.at === n.id ? ' here' : ''}`}
              style={pct(n)} aria-label={nodeName(state, n, en)} disabled={walking}
              onClick={(e) => { e.stopPropagation(); if (open && !tool) go(n.id, () => setCard(n.id)); else setCard(n.id); }}>
              <span className="seruven-dot">{done ? '✓' : n.yerlesim ? '⌂' : n.boss ? '☠' : nodeStop(n, state.level)?.kind === 'reward' ? '✦' : nodeStop(n, state.level)?.kind === 'event' ? '?' : '⚔'}</span>
              <span className="seruven-label">{nodeName(state, n, en)}{n.yerlesim && rules && !(yerlesimById(n.yerlesim) && toggleOn(state, 'yerlesimler')) ? ` · ${S.soon}` : ''}</span>
            </button>
          );
        })}
        <span className="seruven-party" style={{ ...pct(at), transitionDuration: `${animMs}ms` }} aria-label={S.here}>⚑</span>
        {tool && picks.map((p, i) => <span key={i} className="seruven-pick" style={pct(p)}>{i + 1}</span>)}
      </div>
      {cardNode && <NodeCard state={state} page={page} node={cardNode} run={run} gm={rules} onClose={() => setCard(null)} onBattle={props.onBattle} />}
      {rules && (
        <section className="panel seruven-rules">
          <h3>{S.rules}</h3>
          {/* Kuyruk 35: `bolum: "test"` anahtarları ayrı "Test" bölümünde. */}
          {[TOGGLE_KEYS.filter((k) => !SERUVEN.anahtarlar[k]?.bolum), TOGGLE_KEYS.filter((k) => SERUVEN.anahtarlar[k]?.bolum === 'test')].map((keys, i) => (
            <div key={i} className="seruven-rules-group">
              {i === 1 && keys.length > 0 && <h4>{S.testSection}</h4>}
              {keys.map((k) => (
                <label key={k}><input type="checkbox" checked={toggleOn(state, k)} onChange={(e) => run({ type: 'set_toggle', key: k, on: e.target.checked })} />
                  {' '}{en ? SERUVEN.anahtarlar[k]?.en : SERUVEN.anahtarlar[k]?.tr}</label>
              ))}
            </div>
          ))}
          {confirm ? <button type="button" className="danger" onClick={props.onReset}>{S.eraseConfirm}</button>
            : <button type="button" className="ghost" onClick={() => setConfirm(true)}>{S.erase}</button>}
        </section>
      )}
      {tool && (
        <section className="panel seruven-tool">
          <h3>{S.tool}</h3><p className="mute">{S.toolHint}</p>
          <pre>{picks.map((p, i) => `${i + 1}. {"x": ${p.x}, "y": ${p.y}}   npm run seruven-dugum -- ${page.id} <düğüm> ${p.x} ${p.y}`).join('\n')}</pre>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(picks.map((p) => `{"x": ${p.x}, "y": ${p.y}}`).join('\n')); }}>{S.copy}</button>
          <button type="button" className="ghost" onClick={() => setPicks([])}>{S.clear}</button>
        </section>
      )}
      {state.result && (
        <section className="panel seruven-end">
          <p><strong>{state.result === 'won' ? S.won : S.lost}</strong></p>
          {state.result === 'won' && <p className="mute">{S.wonNote}</p>}
          <button type="button" onClick={props.onReset}>{S.again}</button>
        </section>
      )}
      {props.error && <p className="error">{props.error}</p>}
      <footer className="seruven-party-bar">
        {/* Kuyruk 32: XP eşiği aşılınca seviye atlama; yalnızca Game Master (Serüven kuralları paneli açıkken). */}
        {toggleOn(state, 'seviyeAtlama') && levelXp(state.level) !== null && state.xp >= (levelXp(state.level) ?? Infinity) && (
          <button type="button" className="cta" disabled={!rules} title={rules ? undefined : S.levelGm} onClick={() => run({ type: 'level_up' })}>{S.levelUp(state.level + 1)}</button>
        )}
        {state.party.map((m) => {
          const max = fullStatus(m.sheet).hp;
          return <span key={m.id} className={`journey-member${m.status.dead ? ' dead' : m.status.hp <= 0 ? ' down' : ''}`}>
            <strong>{m.name}</strong> {m.status.dead ? S.dead : m.status.hp <= 0 ? S.down : `${m.status.hp}/${max}`}
          </span>;
        })}
      </footer>
    </div>
  );
}

function NodeCard(props: { state: SeruvenState; page: SeruvenPage; node: SeruvenNode; gm?: boolean; run: (c: SeruvenCommand) => boolean; onClose: () => void; onBattle: (node: string) => void }) {
  const { state, page, node } = props;
  const S = t().seruven;
  const en = getLang() === 'en';
  const stop = nodeStop(node, state.level);
  const done = state.done.includes(nodeKey(page.id, node.id));
  const open = nodeOpen(state, page, node);
  const here = state.at === node.id;
  const night = isNight(state, node.id);
  const canNight = stop?.kind === 'battle' && !!nightVariant(state, node.id);
  const seferNode = node.sefer ? seferById(node.sefer.split(':')[0] ?? '')?.nodes.find((x) => x.id === node.sefer?.split(':')[1]) : undefined;
  return (
    <section className="panel seruven-card" role="dialog" aria-label={nodeName(state, node, en)}>
      <h3>{nodeName(state, node, en)}</h3>
      <p className="mute">
        {node.zorluk ? S.difficulty(node.zorluk) : null}{node.boss ? ` · ${S.boss}` : ''}{node.optional ? ` · ${S.optional}` : ''}{done ? ` · ${S.done}` : ''}
      </p>
      {/* Kuyruk 33: yerleşim düğümü savaş başlatmaz; "Yakında" bilgi kartı (K34'te dolacak). */}
      {node.yerlesim && yerlesimById(node.yerlesim) && toggleOn(state, 'yerlesimler')
        ? (here && <p><button type="button" className="cta" onClick={() => props.run({ type: 'yerlesim_enter' })}>{S.hubEnter}</button></p>)
        : <>{node.yerlesim && <p>{S.soonNote}</p>}{node.yerlesim && props.gm && <p className="mute">{S.soonGm}</p>}</>}
      {stop?.reward && <p>{S.reward(stop.reward.gold, stop.reward.potions)}</p>}
      {stop?.potions ? <p>{S.potionHint(stop.potions)}</p> : null}
      {seferNode?.anlatim && <p>{en ? seferNode.anlatim.en : seferNode.anlatim.tr}</p>}
      {here && <LinkActions state={state} run={props.run} onBattle={props.onBattle} />}
      {/* Kuyruk 32: Mielikki Gölü'nden Heykel Mağarası'na (keşif bayrağıyla açılan düğüm). */}
      {here && page.nodes.filter((x) => x.bayrak && x.requires.includes(node.id) && nodeVisible(state, x)).map((x) => (
        <button key={x.id} type="button" onClick={() => { if (props.run({ type: 'move', to: x.id })) props.onBattle(x.id); }}>{S.enterCave}</button>
      ))}
      {!open && <p>{S.locked}</p>}
      {canNight && (
        <div className="seg" role="radiogroup">
          <button role="radio" aria-checked={!night} className={!night ? 'on' : ''} onClick={() => props.run({ type: 'set_night', node: node.id, on: false })}>{S.day}</button>
          <button role="radio" aria-checked={night} className={night ? 'on' : ''} onClick={() => props.run({ type: 'set_night', node: node.id, on: true })}>{S.night}</button>
        </div>
      )}
      <p>
        {open && here && stop?.kind === 'battle' && <button type="button" className="cta" onClick={() => props.onBattle(node.id)}>{S.enter}</button>}
        {/* Kuyruk 35: test anahtarı "Savaşları atla (önizleme)". */}
        {open && here && !done && stop?.kind === 'battle' && toggleOn(state, 'savaslariAtla') && (
          <button type="button" onClick={() => { const c = seruvenSkipCommand(state, node.id); if (c) props.run(c); }}>{S.skipBattle}</button>
        )}
        {done && state.skipped?.includes(nodeKey(page.id, node.id)) && <small className="mute"> {S.skipped}</small>}
        {open && here && !done && stop && stop.kind !== 'battle' && (
          <button type="button" className="cta" onClick={() => props.run({ type: 'visit', node: node.id })}>{stop.kind === 'reward' ? S.take : stop.kind === 'rest' ? S.rest : S.look}</button>
        )}
        <button type="button" className="ghost" onClick={props.onClose}>{S.close}</button>
      </p>
    </section>
  );
}

/** Kuyruk 32: bulunulan düğümdeki bağlantılar (yeraltı nehri): giriş arama (beceri sınavı) ya da koridora inme. */
function LinkActions(props: { state: SeruvenState; run: (c: SeruvenCommand) => boolean; onBattle: (node: string) => void }) {
  const S = t().seruven;
  const { state } = props;
  return (
    <>
      {linksHere(state).map((l) => {
        const open = state.links?.includes(l.id);
        const aDone = state.done.includes(nodeKey(l.a.page, l.a.node));
        const tried = state.linkTry?.[l.id];
        const wait = tried !== undefined && (state.rests ?? 0) <= tried;
        if (open) {
          return linkCrossable(state, l)
            ? <p key={l.id}><button type="button" className="cta" onClick={() => props.onBattle(`link:${l.id}`)}>{S.riverGo}</button></p>
            : <p key={l.id} className="mute">{S.riverBack}</p>;
        }
        if (!aDone || state.page !== l.a.page) return null;
        return (
          <p key={l.id}>
            <button type="button" disabled={wait} onClick={() => props.run({ type: 'link_check', link: l.id, roll: 1 + Math.floor(Math.random() * 20) })}>{S.riverFind(l.dc)}</button>
            {wait && <small className="mute"> {S.riverRest}</small>}
          </p>
        );
      })}
    </>
  );
}

