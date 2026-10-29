import { lazy, Suspense, useEffect, useState } from 'react';
import { classDataLoaded, loadClassData, loadMonsters, monstersLoaded } from './data';
import { Builder } from './screens/Builder';
import { Home, PlayerScreen } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import { hasSavedBattle } from './app/saveKey';
import { applyBattleResult } from './app/partyStatus';
import { migrateSubclasses, type SavedCharacter } from './rules/builder';
import type { Session } from './ui/session';
import { MenuBackground } from './ui/MenuBackground';
import { Splash } from './ui/Splash';
import { splashEnabled } from './ui/splashLogic';
import { badgeChain, preloadImages } from './ui/Avatar';
import { sheetAvatar } from './battle/avatar';
import { t, useLang } from './i18n';
import { useResolvedTheme } from './ui/theme';
import { menuScene, useSceneRequest, useSoundBoot } from './ui/audio/sound';
import { SCREEN_SOUND } from './ui/audio/soundPlan';

// Haritalı savaş ekranı ayrı parça: giriş ve menüler onu beklemeden açılır (ana parça 500 kB altında kalır).
// Game Master ekranına girilince boşta önceden indirilir; savaş başlarken hazırdır.
const importBattle = () => import('./MapBattle');
const Battle = lazy(() => importBattle().then((m) => ({ default: m.Battle })));
// Game Master kurulum ve durum ekranları da ayrı parça (canavar verisiyle birlikte yüklenir).
const importGm = () => import('./screens/GmScreen');
const GmScreen = lazy(() => importGm().then((m) => ({ default: m.GmScreen })));
const StatusScreen = lazy(() => import('./screens/StatusScreen').then((m) => ({ default: m.StatusScreen })));
// Ayarlar (dış içerik; Görev E1) ayrı parça.
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

type Screen =
  | { name: 'home' }
  | { name: 'player' }
  | { name: 'builder'; character: SavedCharacter }
  | { name: 'gm' }
  | { name: 'battle'; session: Session; restored?: boolean }
  | { name: 'status' }
  | { name: 'settings' };

/** Üst seviye: giriş ekranı, oyuncu ve GM rolleri, haritalı savaş ve durum. */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // Açılış ekranı (Görev L): her açılışta giriş ekranının üstünde; giriş ekranı altında hemen hazırlanır.
  const [splash, setSplash] = useState(() => splashEnabled(window.location.search, (k) => localStorage.getItem(k)));
  // Dil değişince bütün ağaç yeniden çizilir (metinler `t()` ile okunur).
  const lang = useLang();
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  // Ses (Görev S, T): ilk dokunuşta başlar; savaş dışındaki her ekranda (Game Master kurulumu dahil) temaya göre
  // menü müziği. Savaş ekranı kendi sahnesini (ortam + savaş müziği) ister.
  useSoundBoot();
  const theme = useResolvedTheme();
  useSceneRequest('menu', SCREEN_SOUND[screen.name] === 'menu' ? menuScene(theme) : null);
  // Hareketli menü arka planı haritalı savaşta yok (performans).
  return (
    <>
      {screen.name !== 'battle' && <MenuBackground />}
      <Suspense fallback={<Loading error={null} text={t().common.loading} />}>
        <Screens screen={screen} setScreen={setScreen} />
      </Suspense>
      {splash && <Splash onDone={() => setSplash(false)} />}
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

/**
 * Sınıf verisi (SRD ilerleme tablosu, özellik mekaniği, feat'ler; tembel parça): uygulama açılınca boşta yüklenir;
 * giriş ekranı beklemez, karakter ve Game Master ekranları hazır olana dek bekler.
 */
function useClassData(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(classDataLoaded());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (ready) return;
    // Dış içerik (Görev E1): kayıtlı paketler sınıf verisinden sonra doğrulanıp uygulanır; hata olursa içeriksiz devam.
    loadClassData()
      .then(() => import('./content/store').then((m) => { m.applyStoredContent(); }, () => undefined))
      .then(() => setReady(true), () => setError(t().common.classLoadError));
  }, [ready]);
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
  const classInfo = useClassData();
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  // İlk ekranda (giriş) kayıtlı karakterlerin küçük jetonları boşta indirilir; Oyuncu listesi anında açılır.
  useEffect(() => {
    preloadImages(characters.flatMap((c) => badgeChain(sheetAvatar(c.sheet), 44).slice(0, 1)));
  }, [characters]);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  const home = () => setScreen({ name: 'home' });
  const [resumeError, setResumeError] = useState<string | null>(null);
  // Eski kayıtlar: alt sınıf seviyesindeki karakterin alt sınıfı boşsa SRD'deki tek alt sınıf atanır ve bildirilir.
  const [subclassNotice, setSubclassNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!classInfo.ready) return;
    const m = migrateSubclasses(characters);
    if (m.assigned.length === 0) return;
    store(m.list);
    setSubclassNotice(t().common.subclassAssigned(m.assigned.map((a) => `${a.name}: ${a.subclass}`).join(', ')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classInfo.ready]);
  const notice = subclassNotice && (
    <div className="subclass-notice" role="status">
      <span>{subclassNotice}</span> <button type="button" onClick={() => setSubclassNotice(null)}>{t().common.close}</button>
    </div>
  );
  const body = screenBody();
  return <>{notice}{body}</>;

  function screenBody() {
  if (screen.name !== 'home' && !classInfo.ready) return <Loading error={classInfo.error} text={t().common.loading} />;
  switch (screen.name) {
    case 'home':
      return <Home onPlayer={() => setScreen({ name: 'player' })} onGm={() => setScreen({ name: 'gm' })}
        onStatus={() => setScreen({ name: 'status' })} onSettings={() => setScreen({ name: 'settings' })} resumeError={resumeError}
        onResume={hasSavedBattle() ? () => {
          // Kayıt yükleme (olayları oynatan motor) ayrı parçada: giriş ekranı onu beklemez.
          void import('./app/battleSave').then(({ loadBattle }) => {
            const r = loadBattle();
            if (r.ok) { setResumeError(null); setScreen({ name: 'battle', session: r.session, restored: true }); } else setResumeError(r.error);
          });
        } : undefined} />;
    case 'player':
      return <PlayerScreen characters={characters} onBack={home}
        onUpdate={(c) => store(characters.map((x) => (x.id === c.id ? c : x)))}
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
      return <GmScreen characters={characters} onBack={home} onStart={(session) => setScreen({ name: 'battle', session })}
        onUpdateCharacters={store} />;
    case 'battle':
      if (!data.ready) return <Loading error={data.error} />;
      return <Battle initial={screen.session} restored={screen.restored === true} exitLabel={t().battle.toSetup}
        onExit={(final) => {
          // Biten savaşta karakterlerin kalan HP'si, kaynakları ve slotları kaydedilir (dinlenmezse yaralı başlarlar).
          if (final?.status === 'finished') store(applyBattleResult(characters, final));
          setScreen({ name: 'gm' });
        }} />;
    case 'status':
      return <StatusScreen onBack={home} />;
    case 'settings':
      // İçerik değişince karakter listesi yeniden çizilir ("içerik eksik" rozetleri).
      return <SettingsScreen onBack={home} onChanged={() => setCharacters((c) => [...c])} />;
  }
  }
}
