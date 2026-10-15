import { useState } from 'react';
import MapBattle, { Battle } from './MapBattle';
import { Builder } from './screens/Builder';
import { GmScreen, Home, PlayerScreen, StatusScreen, demoCharacters } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import type { SavedCharacter } from './rules/builder';
import { ThemeButton } from './ui/theme';
import { createDemoSession, SCENARIOS, type Scenario } from './demo';
import { autoplayEnemyTurns } from './ui/autoplay';
import { actionsFor, type ActionChoice, type ActionGroup } from './ui/actions';
import { dispatch, type Session } from './ui/session';
import { environments } from './data';
import type { Combatant } from './battle';

const BAND: Record<string, string> = {
  '1': 'Yüksek zemin: saldırılar avantajlı',
  '0': 'Zemin',
  '-1': 'Alçak zemin: saldırılar dezavantajlı',
};
const GROUPS: ActionGroup[] = ['Saldırı', 'Büyü', 'Gizlenme', 'Konum', 'Tur'];

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

function CardBattle() {
  const [session, setSession] = useState<Session>(() => autoplayEnemyTurns(createDemoSession(), Math.random));
  const [pending, setPending] = useState<ActionChoice | null>(null);
  const [scenario, setScenario] = useState<Scenario>('standart');
  const [auto, setAuto] = useState(true);
  const [hpTarget, setHpTarget] = useState('');
  const [hpValue, setHpValue] = useState('');

  const state = session.state;
  const actorId = state.order[state.turnIndex] ?? '';
  const actor = state.combatants[actorId];
  const actions = actionsFor(state, actorId);
  const everyone = state.order.map((id) => state.combatants[id]).filter((c): c is Combatant => c !== undefined);
  const envName = environments.find((e) => e.id === state.environmentId)?.name ?? '';

  /** Komutu uygular; otomatik oynatma açıksa sıra bir oyuncuya gelene kadar düşmanları oynatır. */
  const apply = (next: Session): Session => (auto ? autoplayEnemyTurns(next, Math.random) : next);
  const run = (action: ActionChoice, targetId?: string) => {
    setSession(apply(dispatch(session, action.build(targetId), Math.random)));
    setPending(null);
  };
  const adjustHp = () => {
    const id = hpTarget || everyone[0]?.id || '';
    const hp = Number(hpValue);
    if (!id || hpValue.trim() === '' || Number.isNaN(hp)) return;
    setSession(dispatch(session, { type: 'adjust_hp', targetId: id, hp }, Math.random));
    setHpValue('');
  };
  const choose = (action: ActionChoice) => (action.needsTarget ? setPending(action) : run(action));

  return (
    <main className="app">
      <header>
        <h1>RPG Battle</h1>
        <p>
          Tur {state.round} · {envName} · {actor ? `Sıra: ${actor.name}` : ''}
        </p>
        <button
          className="ghost"
          onClick={() => { setSession(apply(createDemoSession(Math.random, scenario))); setPending(null); }}
        >
          Yeni savaş
        </button>
      </header>

      <div className="gm-row">
        <select aria-label="Senaryo" value={scenario} onChange={(e: { target: { value: string } }) => setScenario(e.target.value as Scenario)}>
          {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={auto} onChange={(e: { target: { checked: boolean } }) => setAuto(e.target.checked)} />
          Düşman turlarını otomatik oyna
        </label>
        <button onClick={() => setSession(autoplayEnemyTurns(session, Math.random))}>Düşman turunu oynat</button>
      </div>

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

      <section className="panel" aria-label="GM araçları">
        <h2>GM araçları</h2>
        <div className="gm-row">
          <select aria-label="Savaşçı" value={hpTarget || everyone[0]?.id || ''} onChange={(e: { target: { value: string } }) => setHpTarget(e.target.value)}>
            {everyone.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.hp}/{c.maxHp})</option>)}
          </select>
          <input type="number" inputMode="numeric" aria-label="Yeni HP" placeholder="HP" value={hpValue}
            onChange={(e: { target: { value: string } }) => setHpValue(e.target.value)} />
          <button onClick={adjustHp}>HP ayarla</button>
        </div>
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

type Screen =
  | { name: 'home' }
  | { name: 'player' }
  | { name: 'builder'; character: SavedCharacter }
  | { name: 'gm' }
  | { name: 'battle'; session: Session }
  | { name: 'demo' }
  | { name: 'card' }
  | { name: 'status' };

/** Üst seviye: giriş ekranı, oyuncu ve GM rolleri, haritalı savaş, kart savaşı, durum. */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  const home = () => setScreen({ name: 'home' });
  const addDemo = () => store([...characters, ...demoCharacters()]);

  switch (screen.name) {
    case 'home':
      return <Home onPlayer={() => setScreen({ name: 'player' })} onGm={() => setScreen({ name: 'gm' })}
        onStatus={() => setScreen({ name: 'status' })} onDemo={() => setScreen({ name: 'demo' })} onCard={() => setScreen({ name: 'card' })} />;
    case 'player':
      return <PlayerScreen characters={characters} onBack={home} onAddDemo={addDemo}
        onEdit={(c) => setScreen({ name: 'builder', character: c })}
        onDelete={(id) => store(characters.filter((c) => c.id !== id))} />;
    case 'builder':
      return <Builder initial={screen.character} onCancel={() => setScreen({ name: 'player' })}
        onSave={(c) => {
          store(characters.some((x) => x.id === c.id) ? characters.map((x) => (x.id === c.id ? c : x)) : [...characters, c]);
          setScreen({ name: 'player' });
        }} />;
    case 'gm':
      return <GmScreen characters={characters} onBack={home} onAddDemo={addDemo} onStart={(session) => setScreen({ name: 'battle', session })} />;
    case 'battle':
      return <Battle initial={screen.session} onExit={() => setScreen({ name: 'gm' })} exitLabel="Kuruluma dön" />;
    case 'demo':
      return <MapBattle onCardMode={() => setScreen({ name: 'card' })} onHome={home} />;
    case 'status':
      return <StatusScreen onBack={home} />;
    case 'card':
      return (
        <div className="menu-screen">
          <nav className="tabs" aria-label="Ekran">
            <button onClick={home}>Ana ekran</button>
            <button className="on">Kart savaşı</button>
            <ThemeButton />
          </nav>
          <CardBattle />
        </div>
      );
  }
}
