import { useState } from 'react';
import { createDemoSession } from './demo';
import { actionsFor, type ActionChoice, type ActionGroup } from './ui/actions';
import { dispatch, type Session } from './ui/session';
import { environments } from './data';
import type { Combatant } from './battle';

const BAND: Record<string, string> = {
  '1': 'Yüksek zemin: saldırılar avantajlı',
  '0': 'Zemin',
  '-1': 'Alçak zemin: saldırılar dezavantajlı',
};
const GROUPS: ActionGroup[] = ['Saldırı', 'Büyü', 'Konum', 'Tur'];

function tagsOf(c: Combatant): string[] {
  const tags = [...c.conditions];
  if (c.life === 'dying') tags.push('Ölmekte');
  else if (c.life === 'stable') tags.push('Stabil');
  else if (c.life === 'dead') tags.push('Ölü');
  else if (c.hp <= 0 && !c.regenPending) tags.push('Düştü');
  return tags;
}

function Card(props: { c: Combatant; active: boolean; selectable: boolean; onPick: () => void }) {
  const { c, active, selectable, onPick } = props;
  const pct = Math.max(0, Math.round((100 * c.hp) / c.maxHp));
  const tags = tagsOf(c);
  const down = c.hp <= 0 && !c.regenPending;
  const className = `card ${c.side}${active ? ' active' : ''}${down ? ' down' : ''}`;
  const body = (
    <>
      {active && <span className="badge">SIRA</span>}
      <strong>{c.name}</strong>
      <div className="bar">
        <div className={`fill ${c.side}`} style={{ width: `${pct}%` }} />
      </div>
      <small>
        HP {c.hp}/{c.maxHp} · AC {c.ac}
      </small>
      {tags.length > 0 && <small className="tags">{tags.join(', ')}</small>}
    </>
  );
  return selectable ? (
    <button className={`${className} pick`} onClick={onPick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session>(() => createDemoSession());
  const [pending, setPending] = useState<ActionChoice | null>(null);

  const state = session.state;
  const actorId = state.order[state.turnIndex] ?? '';
  const actor = state.combatants[actorId];
  const actions = actionsFor(state, actorId);
  const everyone = state.order.map((id) => state.combatants[id]).filter((c): c is Combatant => c !== undefined);
  const envName = environments.find((e) => e.id === state.environmentId)?.name ?? '';

  const run = (action: ActionChoice, targetId?: string) => {
    setSession(dispatch(session, action.build(targetId), Math.random));
    setPending(null);
  };
  const choose = (action: ActionChoice) => (action.needsTarget ? setPending(action) : run(action));

  return (
    <main className="app">
      <header>
        <h1>RPG Battle</h1>
        <p>
          Tur {state.round} · {envName} · {actor ? `Sıra: ${actor.name}` : ''}
        </p>
        <button className="ghost" onClick={() => { setSession(createDemoSession()); setPending(null); }}>
          Yeni savaş
        </button>
      </header>

      {state.status === 'finished' && (
        <p className="banner">{state.winner === 'party' ? 'Parti kazandı!' : 'Düşmanlar kazandı.'}</p>
      )}

      <section className="scene" aria-label="Savaş meydanı">
        {[1, 0, -1].map((h) => (
          <div className="band" key={h}>
            <span className="band-label">{BAND[String(h)]}</span>
            {(['party', 'enemies'] as const).map((side) => (
              <div className="col" key={side}>
                {everyone
                  .filter((c) => c.height === h && c.side === side)
                  .map((c) => (
                    <Card
                      key={c.id}
                      c={c}
                      active={c.id === actorId}
                      selectable={pending !== null && c.id !== actorId}
                      onPick={() => {
                        if (pending) run(pending, c.id);
                      }}
                    />
                  ))}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="panel" aria-label="Aksiyonlar">
        {pending ? (
          <p className="hint">
            <strong>{pending.label}</strong> için hedef seç.{' '}
            <button className="ghost" onClick={() => setPending(null)}>Vazgeç</button>
          </p>
        ) : (
          <h2>{actor ? `${actor.name} ne yapsın?` : ''}</h2>
        )}
        {session.error && <p className="error">{session.error}</p>}
        {GROUPS.map((g) => {
          const list = actions.filter((a) => a.group === g);
          if (list.length === 0) return null;
          return (
            <div className="group" key={g}>
              <h3>{g}</h3>
              <div className="buttons">
                {list.map((a) => (
                  <button key={a.id} disabled={a.disabled !== undefined} onClick={() => choose(a)}>
                    <span>{a.label}</span>
                    <small>{a.disabled ?? a.detail}</small>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="log" aria-label="Savaş günlüğü">
        <h2>Savaş günlüğü</h2>
        <ol>
          {[...session.lines].reverse().slice(0, 40).map((line, i) => (
            <li key={`${session.lines.length - i}`}>{line}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
