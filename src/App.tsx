import { useEffect, useState } from 'react';
import { loadMonsters, monstersLoaded } from './data';
import { Battle } from './MapBattle';
import { Builder } from './screens/Builder';
import { GmScreen, Home, PlayerScreen, StatusScreen, demoCharacters } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import { hasSavedBattle, loadBattle } from './app/battleSave';
import type { SavedCharacter } from './rules/builder';
import type { Session } from './ui/session';
import { MenuBackground } from './ui/MenuBackground';

type Screen =
  | { name: 'home' }
  | { name: 'player' }
  | { name: 'builder'; character: SavedCharacter }
  | { name: 'gm' }
  | { name: 'battle'; session: Session }
  | { name: 'status' };

/** Üst seviye: giriş ekranı, oyuncu ve GM rolleri, haritalı savaş ve durum. */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // Hareketli menü arka planı haritalı savaşta yok (performans).
  return (
    <>
      {screen.name !== 'battle' && <MenuBackground />}
      <Screens screen={screen} setScreen={setScreen} />
    </>
  );
}

/** Canavar verisi (tembel): yalnızca GM ekranına ya da savaşa girilince yüklenir; o ekranlar bekler. */
function useMonsters(need: boolean): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(monstersLoaded());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!need || ready) return;
    loadMonsters().then(() => setReady(true), () => setError('Canavar verisi yüklenemedi; sayfayı yenileyin.'));
  }, [need, ready]);
  return { ready, error };
}

function Loading(props: { error: string | null }) {
  return (
    <div className="menu-screen">
      <main className="app"><p className={props.error ? 'error' : 'mute'}>{props.error ?? 'Canavarlar yükleniyor…'}</p></main>
    </div>
  );
}

function Screens({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const data = useMonsters(screen.name === 'gm' || screen.name === 'battle');
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  const home = () => setScreen({ name: 'home' });
  const add = (list: SavedCharacter[]) => store([...characters, ...list]);
  const [resumeError, setResumeError] = useState<string | null>(null);

  switch (screen.name) {
    case 'home':
      return <Home onPlayer={() => setScreen({ name: 'player' })} onGm={() => setScreen({ name: 'gm' })}
        onStatus={() => setScreen({ name: 'status' })} resumeError={resumeError}
        onResume={hasSavedBattle() ? () => {
          const r = loadBattle();
          if (r.ok) { setResumeError(null); setScreen({ name: 'battle', session: r.session }); } else setResumeError(r.error);
        } : undefined} />;
    case 'player':
      return <PlayerScreen characters={characters} onBack={home} onAddDemo={() => add(demoCharacters())}
        onEdit={(c) => setScreen({ name: 'builder', character: c })}
        onDelete={(id) => store(characters.filter((c) => c.id !== id))} />;
    case 'builder':
      return <Builder initial={screen.character} onCancel={() => setScreen({ name: 'player' })}
        onSave={(c) => {
          store(characters.some((x) => x.id === c.id) ? characters.map((x) => (x.id === c.id ? c : x)) : [...characters, c]);
          setScreen({ name: 'player' });
        }} />;
    case 'gm':
      if (!data.ready) return <Loading error={data.error} />;
      return <GmScreen characters={characters} onBack={home} onAddCharacters={add} onStart={(session) => setScreen({ name: 'battle', session })} />;
    case 'battle':
      if (!data.ready) return <Loading error={data.error} />;
      return <Battle initial={screen.session} onExit={() => setScreen({ name: 'gm' })} exitLabel="Kuruluma dön" />;
    case 'status':
      return <StatusScreen onBack={home} />;
  }
}
