import { lazy, Suspense, useEffect, useState } from 'react';
import { classDataLoaded, loadClassData, loadMonsters, monstersLoaded } from './data';
import { Home, PlayerScreen } from './screens/Screens';
import { loadCharacters, saveCharacters } from './app/storage';
import { hasSavedBattle } from './app/saveKey';
import { journeyEnabled } from './app/features';
import type { BattleState } from './battle/types';
import { applyBattleResult } from './app/partyStatus';
import { migrateSubclasses, type SavedCharacter } from './rules/builder';
import { migrateLineages } from './rules/lineage';
import { repairSlots } from './rules/characterRest';
import type { Session } from './ui/session';
import { MenuBackground } from './ui/MenuBackground';
import { removeStaticSplash, splashEnabled, watchResume, type SplashKind } from './ui/splashBoot';
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
// Açılış ekranı (Görev L, L2: 3D zar ve logo sahneleri) ayrı parça; ilk karesi index.html'de.
// Parça yüklenemezse açılış atlanır (statik kare kalkar).
function SplashFailed(p: { kind: SplashKind; onDone: () => void }) {
  useEffect(() => { p.onDone(); }, [p]);
  return null;
}
const Splash = lazy((): Promise<{ default: React.ComponentType<{ kind: SplashKind; onDone: () => void }> }> => import('./ui/Splash').catch(() => ({ default: SplashFailed })));
// Karakter oluşturma sihirbazı (Görev K1) ayrı parça.
const Builder = lazy(() => import('./screens/Builder').then((m) => ({ default: m.Builder })));
// Ayarlar (dış içerik; Görev E1) ayrı parça.
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
// Kuyruk 14 Y1: yolculuk (deneme; bayrak arkasında) ayrı parça.
const JourneyScreen = lazy(() => import('./screens/JourneyScreen').then((m) => ({ default: m.JourneyScreen })));

type Screen =
  | { name: 'home' }
  | { name: 'player' }
  | { name: 'builder'; character: SavedCharacter }
  | { name: 'gm' }
  | { name: 'battle'; session: Session; restored?: boolean; journey?: boolean }
  | { name: 'journey'; result?: BattleState | null }
  | { name: 'status' }
  | { name: 'settings' };

/** Üst seviye: giriş ekranı, oyuncu ve GM rolleri, haritalı savaş ve durum. */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // Açılış ekranı (Görev L, L2): soğuk açılışta tam (zar + logo), arka plandan dönüşte kısa; giriş ekranı altında
  // hemen hazırlanır. Kapalıysa index.html'deki statik kare hemen kalkar.
  const [splashOn] = useState(() => splashEnabled(window.location.search, (k) => localStorage.getItem(k)));
  const [splash, setSplash] = useState<SplashKind | null>(splashOn ? 'cold' : null);
  useEffect(() => {
    if (!splashOn) { removeStaticSplash(); return; }
    return watchResume(() => setSplash((k) => k ?? 'resume'));
  }, [splashOn]);
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
      {splash && (
        <Suspense fallback={null}>
          <Splash key={splash} kind={splash} onDone={() => { removeStaticSplash(); setSplash(null); }} />
        </Suspense>
      )}
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
  const data = useMonsters(screen.name === 'gm' || screen.name === 'battle' || screen.name === 'journey');
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
    // Görev K3: soyu boş (ya da bulunmayan) Elf/Gnome/Goliath/Tiefling/Dragonborn karakterlere ilk soy (bir kerelik not).
    const g = migrateLineages(m.list);
    // H-SLOT: eski kayıtlı durumda (slot en çoğu yok) slotlar sınıf ve seviyenin tablosuna tamamlanır.
    const r = repairSlots(g.list);
    if (m.assigned.length === 0 && g.assigned.length === 0 && r.list === g.list) return;
    store(r.list);
    if (m.assigned.length === 0 && g.assigned.length === 0 && r.repaired.length === 0) return;
    setSubclassNotice([
      m.assigned.length ? t().common.subclassAssigned(m.assigned.map((a) => `${a.name}: ${a.subclass}`).join(', ')) : '',
      g.assigned.length ? t().common.lineageAssigned(g.assigned.map((a) => `${a.name}: ${a.lineage}`).join(', ')) : '',
      r.repaired.length ? t().common.slotsRepaired(r.repaired.join(', ')) : '',
    ].filter(Boolean).join(' '));
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
        {...(journeyEnabled() ? { onJourney: () => setScreen({ name: 'journey' }) } : {})}
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
      // Kuyruk 14 Y1: yolculuk savaşı biter; sonuç yolculuğa döner (karakter deposu değişmez).
      if (screen.journey) return <Battle initial={screen.session} restored={false} exitLabel={t().journey.title}
        onExit={(final) => setScreen({ name: 'journey', result: final?.status === 'finished' ? final : null })} />;
      return <Battle initial={screen.session} restored={screen.restored === true} exitLabel={t().battle.toSetup}
        onExit={(final) => {
          // Biten savaşta karakterlerin kalan HP'si, kaynakları ve slotları kaydedilir (dinlenmezse yaralı başlarlar).
          if (final?.status === 'finished') store(applyBattleResult(characters, final));
          setScreen({ name: 'gm' });
        }} />;
    case 'journey':
      if (!data.ready) return <Loading error={data.error} />;
      return <JourneyScreen characters={characters} onBack={home} result={screen.result ?? null}
        onResultUsed={() => setScreen({ name: 'journey' })} onBattle={(session) => setScreen({ name: 'battle', session, journey: true })} />;
    case 'status':
      return <StatusScreen onBack={home} />;
    case 'settings':
      // İçerik değişince karakter listesi yeniden çizilir ("içerik eksik" rozetleri).
      return <SettingsScreen onBack={home} onChanged={() => setCharacters((c) => [...c])} />;
  }
  }
}
