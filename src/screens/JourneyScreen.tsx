/**
 * Görev Y1: yolculuk ekranı (deneme; bayrak arkasında, tembel parça). Yeni yolculuk formu (güzergâh, parti, zorluk,
 * ilerleme), güzergâh durakları, saat/altın/iksir, parti şeridi; savaşa başla, kısa/uzun dinlen, devam, iksir.
 * Komutlar `executeJourney`'ye gider; olay günlüğü `rpg-battle-yolculuk` anahtarında (`journeySave.ts`).
 */
import { useEffect, useState } from 'react';
import { autoShortRestDice, currentStop, executeJourney, longRestBlock, shortRestsLeft } from '../journey/engine';
import type { Difficulty, JourneyCommand, JourneyEvent, JourneyRoute, JourneyState, Progression } from '../journey/types';
import { clearJourney, loadJourney, saveJourney } from '../app/journeySave';
import { battleResultCommand, journeyBattleSession } from '../app/journeyBattle';
import { statusBlock } from '../app/partyStatus';
import { fullStatus } from '../rules/characterRest';
import { MAX_PARTY } from '../app/limits';
import type { SavedCharacter } from '../rules/builder';
import type { BattleState } from '../battle';
import type { Session } from '../ui/session';
import { getLang, t } from '../i18n';

const ROUTES = Object.values(import.meta.glob('../../data/yolculuk/*.json', { eager: true }) as Record<string, { default: JourneyRoute & { stops?: unknown } }>)
  .map((m) => m.default).filter((r) => Array.isArray(r.stops)) as JourneyRoute[];

export function JourneyScreen(props: {
  characters: SavedCharacter[]; onBack: () => void; onBattle: (s: Session) => void;
  result?: BattleState | null; onResultUsed?: () => void;
}) {
  const J = t().journey;
  const en = getLang() === 'en';
  const [loaded] = useState(() => loadJourney());
  const [events, setEvents] = useState<JourneyEvent[]>(loaded.ok ? loaded.events : []);
  const [state, setState] = useState<JourneyState | null>(loaded.ok ? loaded.state : null);
  const [error, setError] = useState<string | null>(loaded.ok ? null : loaded.error);
  const [confirm, setConfirm] = useState(false);
  const run = (cmd: JourneyCommand) => {
    const r = executeJourney(state, cmd, Math.random);
    if (!r.ok) { setError(r.error); return; }
    const next = cmd.type === 'start' ? r.events : [...events, ...r.events];
    setEvents(next); setState(r.state); setError(null); saveJourney(next);
  };
  // Biten savaştan dönüş: sonuç yolculuğa bir kez yazılır.
  useEffect(() => {
    if (!props.result || !state || state.result || state.stopDone) return;
    run(battleResultCommand(state, props.result));
    props.onResultUsed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.result]);

  const head = (
    <header><h1>{J.title}</h1><button className="ghost" onClick={props.onBack}>{t().common.home}</button></header>
  );
  if (!state) return <div className="menu-screen"><main className="app journey">{head}<StartForm characters={props.characters} onStart={run} error={error} /></main></div>;
  const stop = currentStop(state);
  const block = longRestBlock(state);
  const left = shortRestsLeft(state);
  const hh = (h: number) => `${String(Math.floor(h % 24)).padStart(2, '0')}:00`;
  return (
    <div className="menu-screen">
      <main className="app journey">
        {head}
        <p className="mute">{J.note}</p>
        <section className="panel journey-head">
          <strong>{en ? state.route.name.en : state.route.name.tr}</strong>
          <span>{J.clock(Math.floor(state.hour / 24) + 1, hh(state.hour))}</span>
          <span>{J.level(state.level)}</span>{state.progression === 'xp' && <span>{J.xp(state.xp)}</span>}
          <span>{J.gold(state.gold)}</span><span>{J.potions(state.potions)}</span>
        </section>
        <ol className="journey-stops">
          {state.route.stops.map((s, i) => (
            <li key={s.id} className={i < state.stop || (i === state.stop && state.stopDone) ? 'done' : i === state.stop ? 'current' : ''}>
              <span className="journey-kind">{s.kind === 'battle' ? '⚔' : '⛺'}</span> {en ? s.name.en : s.name.tr}
              <small> · {J.stopKind[s.kind]}{i === state.stop ? ` · ${J.current}` : ''}</small>
            </li>
          ))}
        </ol>
        <section className="panel journey-party">
          {state.party.map((m) => {
            const max = fullStatus(m.sheet).hp;
            return (
              <div key={m.id} className={`journey-member${m.status.dead ? ' dead' : m.status.hp <= 0 ? ' down' : ''}`}>
                <strong>{m.name}</strong> <span>{m.status.dead ? J.dead : m.status.hp <= 0 ? J.down : `${m.status.hp}/${max} HP`}</span>
                {!state.result && state.potions > 0 && !m.status.dead && m.status.hp < max && (
                  <button type="button" className="ghost" onClick={() => run({ type: 'drink_potion', memberId: m.id })}>{J.potion}</button>
                )}
              </div>
            );
          })}
        </section>
        {state.result ? (
          <section className="panel">
            <p><strong>{state.result === 'won' ? J.won : J.lost}</strong></p>
            <button type="button" onClick={() => { clearJourney(); setEvents([]); setState(null); }}>{J.again}</button>
          </section>
        ) : (
          <section className="panel journey-actions">
            {stop?.kind === 'battle' && !state.stopDone && (
              <button type="button" className="cta" onClick={() => { const s = journeyBattleSession(state, Math.random); if (s) props.onBattle(s); }}>{J.battle}</button>
            )}
            {state.stopDone && (
              <>
                <button type="button" disabled={left === 0} onClick={() => run({ type: 'short_rest', dice: autoShortRestDice(state) })}>
                  {J.shortRest(left === null ? '' : J.left(left))}
                </button>
                <button type="button" disabled={block !== null} title={block === 'tooSoon' ? J.longBlock.tooSoon(state.hour - state.lastLongRest) : block ? J.longBlock.notRestStop : undefined}
                  onClick={() => run({ type: 'long_rest' })}>{J.longRest}</button>
                {block && <small className="mute">{block === 'tooSoon' ? J.longBlock.tooSoon(state.hour - state.lastLongRest) : J.longBlock.notRestStop}</small>}
                {state.stop < state.route.stops.length - 1 && <button type="button" className="cta" onClick={() => run({ type: 'advance' })}>{J.advance}</button>}
              </>
            )}
          </section>
        )}
        {error && <p className="error">{error}</p>}
        <p>
          {confirm
            ? <button type="button" className="danger" onClick={() => { clearJourney(); setEvents([]); setState(null); setConfirm(false); }}>{J.eraseConfirm}</button>
            : <button type="button" className="ghost" onClick={() => setConfirm(true)}>{J.erase}</button>}
        </p>
      </main>
    </div>
  );
}

function StartForm(props: { characters: SavedCharacter[]; onStart: (c: JourneyCommand) => void; error: string | null }) {
  const J = t().journey;
  const en = getLang() === 'en';
  const [routeId, setRouteId] = useState(ROUTES[0]?.id ?? '');
  const [picked, setPicked] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [progression, setProgression] = useState<Progression>('milestone');
  const route = ROUTES.find((r) => r.id === routeId);
  const able = props.characters.filter((c) => !statusBlock(c));
  if (!props.characters.length) return <p>{J.none}</p>;
  return (
    <section className="panel journey-start">
      <h2>{J.newTitle}</h2>
      <label>{J.route}{' '}
        <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          {ROUTES.map((r) => <option key={r.id} value={r.id}>{en ? r.name.en : r.name.tr}</option>)}
        </select>
      </label>
      <fieldset><legend>{J.party} ({picked.length}/{MAX_PARTY})</legend>
        {props.characters.map((c) => (
          <label key={c.id} className="journey-pick">
            <input type="checkbox" disabled={!able.includes(c) || (!picked.includes(c.id) && picked.length >= MAX_PARTY)} checked={picked.includes(c.id)}
              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
            {' '}{c.sheet.name}{!able.includes(c) ? ` (${J.unavailable})` : ''}
          </label>
        ))}
      </fieldset>
      <div className="seg" role="radiogroup" aria-label={J.difficulty}>
        {(['kolay', 'normal', 'zor'] as const).map((d) => <button key={d} role="radio" aria-checked={difficulty === d} className={difficulty === d ? 'on' : ''} onClick={() => setDifficulty(d)}>{J.diff[d]}</button>)}
      </div>
      <div className="seg" role="radiogroup" aria-label={J.progression}>
        {(['milestone', 'xp'] as const).map((p) => <button key={p} role="radio" aria-checked={progression === p} className={progression === p ? 'on' : ''} onClick={() => setProgression(p)}>{J.prog[p]}</button>)}
      </div>
      <button type="button" className="cta" disabled={!route || !picked.length} onClick={() => route && props.onStart({
        type: 'start', id: `y${Date.now()}`, route, seed: Math.floor(Math.random() * 1e9), difficulty, progression,
        party: props.characters.filter((c) => picked.includes(c.id)).map((c) => ({ id: c.id, name: c.sheet.name, sheet: c.sheet, ...(c.status ? { status: c.status } : {}) })),
      })}>{J.start}</button>
      {props.error && <p className="error">{props.error}</p>}
    </section>
  );
}
