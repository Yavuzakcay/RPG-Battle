import { useState } from 'react';
import { Battle } from './MapBattle';
import { Builder } from './screens/Builder';
import { GmScreen, Home, PlayerScreen, StatusScreen, demoCharacters } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import type { SavedCharacter } from './rules/builder';
import type { Session } from './ui/session';

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
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  const home = () => setScreen({ name: 'home' });
  const add = (list: SavedCharacter[]) => store([...characters, ...list]);

  switch (screen.name) {
    case 'home':
      return <Home onPlayer={() => setScreen({ name: 'player' })} onGm={() => setScreen({ name: 'gm' })}
        onStatus={() => setScreen({ name: 'status' })} />;
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
      return <GmScreen characters={characters} onBack={home} onAddCharacters={add} onStart={(session) => setScreen({ name: 'battle', session })} />;
    case 'battle':
      return <Battle initial={screen.session} onExit={() => setScreen({ name: 'gm' })} exitLabel="Kuruluma dön" />;
    case 'status':
      return <StatusScreen onBack={home} />;
  }
}
