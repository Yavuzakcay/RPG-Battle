import { lazy, Suspense, useEffect, useState } from 'react';
import { loadMonsters, monstersLoaded } from './data';
import { Builder } from './screens/Builder';
import { Home, PlayerScreen } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import { hasSavedBattle, loadBattle } from './app/battleSave';
import type { SavedCharacter } from './rules/builder';
import type { Session } from './ui/session';
import { MenuBackground } from './ui/MenuBackground';
import { badgeChain, preloadImages } from './ui/Avatar';
import { sheetAvatar } from './battle';
import { t, useLang } from './i18n';

// Haritalı savaş ekranı ayrı parça: giriş ve menüler onu beklemeden açılır (ana parça 500 kB altında kalır).
// Game Master ekranına girilince boşta önceden indirilir; savaş başlarken hazırdır.
const importBattle = () => import('./MapBattle');
const Battle = lazy(() => importBattle().then((m) => ({ default: m.Battle })));
// Game Master kurulum ve durum ekranları da ayrı parça (canavar verisiyle birlikte yüklenir).
const importGm = () => import('./screens/GmScreen');
const GmScreen = lazy(() => importGm().then((m) => ({ default: m.GmScreen })));
const StatusScreen = lazy(() => import('./screens/StatusScreen').then((m) => ({ default: m.StatusScreen })));

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
  // Dil değişince bütün ağaç yeniden çizilir (metinler `t()` ile okunur).
  const lang = useLang();
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // Hareketli menü arka planı haritalı savaşta yok (performans).
  return (
    <>
      {screen.name !== 'battle' && <MenuBackground />}
      <Suspense fallback={<Loading error={null} text={t().common.loading} />}>
        <Screens screen={screen} setScreen={setScreen} />
      </Suspense>
    </>
  );
}

/** Canavar verisi (tembel): yalnızca GM ekranına ya da savaşa girilince yüklenir; o ekranlar bekler. */
function useMonsters(need: boolean): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(monstersLoaded());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!need || ready) return;
    loadMonsters().then(() => setReady(true), () => setError(t().common.monsterLoadError));
    void importGm().catch(() => { /* Ekrana girilince yeniden denenir. */ });
    void importBattle().catch(() => { /* Savaşa girilince yeniden denenir. */ });
  }, [need, ready]);
  return { ready, error };
}

function Loading(props: { error: string | null; text?: string }) {
  return (
    <div className="menu-screen">
      <main className="app"><p className={props.error ? 'error' : 'mute'}>{props.error ?? props.text ?? t().common.loadingMonsters}</p></main>
    </div>
  );
}

function Screens({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const data = useMonsters(screen.name === 'gm' || screen.name === 'battle');
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  // İlk ekranda (giriş) kayıtlı karakterlerin küçük jetonları boşta indirilir; Oyuncu listesi anında açılır.
  useEffect(() => {
    preloadImages(characters.flatMap((c) => badgeChain(sheetAvatar(c.sheet), 44).slice(0, 1)));
  }, [characters]);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  const home = () => setScreen({ name: 'home' });
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
      return <PlayerScreen characters={characters} onBack={home}
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
      return <GmScreen characters={characters} onBack={home} onStart={(session) => setScreen({ name: 'battle', session })} />;
    case 'battle':
      if (!data.ready) return <Loading error={data.error} />;
      return <Battle initial={screen.session} onExit={() => setScreen({ name: 'gm' })} exitLabel={t().battle.toSetup} />;
    case 'status':
      return <StatusScreen onBack={home} />;
  }
}
