import { lazy, Suspense, useEffect, useState } from 'react';
import { classDataLoaded, loadClassData, loadMonsters, monstersLoaded } from './data';
import { loadWingData } from './ui/wingData';
import { Home, PlayerScreen } from './screens/Screens';
import { loadCharacters, newId, saveCharacters } from './app/storage';
import { hasSavedBattle } from './app/saveKey';
import { journeyEnabled } from './app/features';
import type { BattleState } from './battle/types';
import { applyBattleResult } from './app/partyStatus';
import { migrateSubclasses, newCharacter, type SavedCharacter } from './rules/builder';
import { migrateLineages } from './rules/lineage';
import { newPendingLineages } from './app/lineageNotice';
import { repairSlots } from './rules/characterRest';
import type { Session, SessionWatch } from './ui/session';
import { MenuBackground } from './ui/MenuBackground';
import { WingFilterHost } from './ui/WingFilter';
import { removeStaticSplash, splashEnabled, watchResume, type SplashKind } from './ui/splashBoot';
import { badgeChain, preloadImages } from './ui/Avatar';
import { sheetAvatar } from './battle/avatar';
import { t, useLang } from './i18n';
import type { GoalsDraft } from './oda/hedef';
import { setBattleHpVis, setRoomOverlay, type HpVis, type RoomOverlay } from './oda/active';
import { useResolvedTheme } from './ui/theme';
import { menuScene, useSceneRequest, useSoundBoot } from './ui/audio/sound';
import { SCREEN_SOUND } from './ui/audio/soundPlan';

// Haritalı savaş ekranı ayrı parça: giriş ve menüler onu beklemeden açılır (ana parça 500 kB altında kalır).
// Game Master ekranına girilince boşta önceden indirilir; savaş başlarken hazırdır.
const importBattle = () => import('./MapBattle');
/** Görev ODA-1: çevrimiçi oda yapıştırıcısı (tembel; ilk yüklemeden sonra eşzamanlı, olay sırası korunur). */
let odaCanli: typeof import('./screens/odaCanli') | null = null;
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
const importBuilder = () => import('./screens/Builder');
const Builder = lazy(() => importBuilder().then((m) => ({ default: m.Builder })));
// Ayarlar (dış içerik; Görev E1) ayrı parça.
const OdaKur = lazy(() => import('./screens/OdaScreens').then((m) => ({ default: m.OdaKur })));
const OdaKatil = lazy(() => import('./screens/OdaScreens').then((m) => ({ default: m.OdaKatil })));
const NotesScreen = lazy(() => import('./screens/NotesScreen').then((m) => ({ default: m.NotesScreen })));
const SheetOverlay = lazy(() => import('./screens/sheet/SheetOverlay'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
// Kuyruk 14 Y1: yolculuk (deneme; bayrak arkasında) ayrı parça.
const JourneyScreen = lazy(() => import('./screens/JourneyScreen').then((m) => ({ default: m.JourneyScreen })));
// Kuyruk 31: Serüven (kıta sayfaları) ayrı parça.
const SeruvenScreen = lazy(() => import('./screens/SeruvenScreen').then((m) => ({ default: m.SeruvenScreen })));
// K46: Harita Keşfi (`#dunya`): dünya haritası sissiz, Game Master ve geliştirme için (ayrı tembel parça).
const Dungeondex = lazy(() => import('./screens/Dungeondex').then((m) => ({ default: m.Dungeondex })));
const WorldMapViewer = lazy(() => import('./ui/world/WorldMapViewer'));
// Görsel envanter galerisi (`#galeri`; geliştirici aracı, Ayarlar ▸ Gelişmiş ▸ Geliştirici): ayrı tembel parça.
const Galeri = lazy(() => import('./ui/galeri/Galeri'));

type Screen =
  | { name: 'home' }
  | { name: 'player' }
  | { name: 'builder'; character: SavedCharacter; /** Görev OD1B: odaya katıl ekranından açıldı (oda kuralları oluşturucuda geçerli). */ oda?: { id: string; overlay: RoomOverlay } }
  | { name: 'gm' }
  | { name: 'notes'; character: SavedCharacter }
  | { name: 'oda'; roomId?: string }
  | { name: 'katil'; roomId?: string }
  | { name: 'battle'; session: Session; restored?: boolean; journey?: boolean; seruven?: string; mapFilter?: string; /** Görev OD1: odadan kurulan savaş (oda kimliği). */ oda?: string; /** Görev OD1B: kayıttan devam eden savaşın HP görünürlüğü. */ hp?: HpVis; /** Görev OD1C: haritada tamamlanacak bekleyen hedefler. */ goalDraft?: GoalsDraft; /** Görev ODA-1: çevrimiçi odada salt izleme. */ watch?: SessionWatch }
  | { name: 'seruven'; result?: { final: BattleState; node: string } | null }
  | { name: 'journey'; result?: BattleState | null; preset?: string }
  | { name: 'status' }
  | { name: 'settings' }
  | { name: 'dex' };

/** Üst seviye: giriş ekranı, oyuncu ve GM rolleri, haritalı savaş ve durum. */
export default function App() {
  // Görev ODA-5 (madde 6): oda sunucusunun gösterdiği katılım adresi (`?oda=<kod>`) doğrudan "Odaya katıl"ı açar.
  const [screen, setScreen] = useState<Screen>(() => (/[?&]oda=\d{6}/.test(window.location.search) ? { name: 'katil' } : { name: 'home' }));
  const [worldOnly, setWorldOnly] = useState(() => window.location.hash === '#dunya');
  const [galeri, setGaleri] = useState(() => window.location.hash === '#galeri');
  useEffect(() => {
    const on = () => setGaleri(window.location.hash === '#galeri');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
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
      {/* Kanat palet filtreleri bir kez, DOM'da en önce ve görünür bir SVG'de (Firefox display:none altındaki ilk kopyayı uygulamaz; WingFilter.tsx). */}
      <WingFilterHost />
      {screen.name !== 'battle' && <MenuBackground />}
      <Suspense fallback={<Loading error={null} text={t().common.loading} />}>
        {worldOnly
          ? <WorldMapViewer exploreHubs fog={null} flags={[]} party={null} nodes={[]} prison={{ surfaced: true, days: 0 }} lang={lang === 'en' ? 'en' : 'tr'}
              onClose={() => { history.replaceState(null, '', window.location.pathname + window.location.search); setWorldOnly(false); }} />
          : galeri
            ? <Galeri onClose={() => { history.replaceState(null, '', window.location.pathname + window.location.search); setGaleri(false); }} />
            : <Screens screen={screen} setScreen={setScreen} />}
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
    // Görev AS2: yerel icerik/ klasörü kalıcı ana kaynak; karakter ekranları (eski kayıt alt sınıf ataması dahil) onu bekler.
    // Paket: kanat verisi (tembel parça) sınıf verisiyle birlikte; yüklenemezse kanatsız devam.
    Promise.all([loadClassData(), loadWingData().catch(() => undefined)])
      .then(() => import('./content/store').then((m) => { m.applyStoredContent(); return m.loadLocalFolder().then(() => undefined, () => undefined); }, () => undefined))
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
  const data = useMonsters(screen.name === 'gm' || screen.name === 'oda' || screen.name === 'battle' || screen.name === 'journey' || screen.name === 'seruven');
  const classInfo = useClassData();
  // Görev OD1: oda kuralları yalnız oda ekranlarında ve odadan kurulan savaşta etkin; başka yerde genel (cihaz) ayarlar.
  setBattleHpVis(screen.name === 'battle' ? screen.hp ?? null : null);
  if (screen.name === 'builder' && screen.oda) setRoomOverlay(screen.oda.overlay);
  else if (!(screen.name === 'oda' || screen.name === 'katil' || (screen.name === 'battle' && screen.oda))) setRoomOverlay(null);
  const [characters, setCharacters] = useState<SavedCharacter[]>(loadCharacters);
  // İlk ekranda (giriş) kayıtlı karakterlerin küçük jetonları boşta indirilir; Oyuncu listesi anında açılır.
  useEffect(() => {
    preloadImages(characters.flatMap((c) => badgeChain(sheetAvatar(c.sheet), 44).slice(0, 1)));
  }, [characters]);
  // Kuyruk K57 (önyükleme ipucu): Oyuncu ekranına girilince karakter sihirbazı parçası boşta indirilir; "Yeni karakter" ya
  // da "Düzenle" ilk dokunuşta beklemez (büyü verisi sınıf verisiyle açılışta gelir).
  useEffect(() => {
    if (screen.name === 'player' && classInfo.ready) void importBuilder().catch(() => { /* Sihirbaza girilince yeniden denenir. */ });
  }, [screen.name, classInfo.ready]);
  const store = (list: SavedCharacter[]) => { setCharacters(list); saveCharacters(list); };
  // Kuyruk KQ4 CK1: karakter kâğıdı penceresi (listeden).
  const [sheetFor, setSheetFor] = useState<SavedCharacter | null>(null);
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
    // Kuyruk AS1a: soyu isteğe bağlı türdeki eski kayıtlar soysuz kalır; her karakter için yalnızca bir kez bildirilir.
    const pick = newPendingLineages(g.pending);
    if (m.assigned.length === 0 && g.assigned.length === 0 && r.list === g.list && pick.length === 0) return;
    store(r.list);
    if (m.assigned.length === 0 && g.assigned.length === 0 && r.repaired.length === 0 && pick.length === 0) return;
    setSubclassNotice([
      m.assigned.length ? t().common.subclassAssigned(m.assigned.map((a) => `${a.name}: ${a.subclass}`).join(', ')) : '',
      g.assigned.length ? t().common.lineageAssigned(g.assigned.map((a) => `${a.name}: ${a.lineage}`).join(', ')) : '',
      r.repaired.length ? t().common.slotsRepaired(r.repaired.join(', ')) : '',
      pick.length ? t().common.lineagePick(pick.map((p) => `${p.name} (${p.race})`).join(', ')) : '',
    ].filter(Boolean).join(' '));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classInfo.ready]);
  const notice = subclassNotice && (
    <div className="subclass-notice" role="status">
      <span>{subclassNotice}</span> <button type="button" onClick={() => setSubclassNotice(null)}>{t().common.close}</button>
    </div>
  );
  const body = screenBody();
  return <>{notice}{body}{sheetFor && <Suspense fallback={null}><SheetOverlay c={sheetFor} onClose={() => setSheetFor(null)} /></Suspense>}</>;

  function screenBody() {
  if (screen.name !== 'home' && !classInfo.ready) return <Loading error={classInfo.error} text={t().common.loading} />;
  switch (screen.name) {
    case 'home':
      return <Home onPlayer={() => setScreen({ name: 'player' })} onGm={() => setScreen({ name: 'gm' })} onRoomCreate={() => setScreen({ name: 'oda' })} onRoomJoin={() => setScreen({ name: 'katil' })}
        onStatus={() => setScreen({ name: 'status' })} onSettings={() => setScreen({ name: 'settings' })} resumeError={resumeError}
        {...(journeyEnabled() ? { onJourney: () => setScreen({ name: 'journey' }) } : {})}
        onSeruven={() => setScreen({ name: 'seruven' })} onDex={() => setScreen({ name: 'dex' })}
        onResume={hasSavedBattle() ? () => {
          // Kayıt yükleme (olayları oynatan motor) ayrı parçada: giriş ekranı onu beklemez.
          void import('./app/battleSave').then(({ loadBattle }) => {
            const r = loadBattle();
            if (r.ok) { setResumeError(null); setScreen({ name: 'battle', session: r.session, restored: true, hp: r.hp }); } else setResumeError(r.error);
          });
        } : undefined} />;
    case 'player':
      return <PlayerScreen characters={characters} onBack={home}
        onUpdate={(c) => store(characters.map((x) => (x.id === c.id ? c : x)))}
        onEdit={(c) => setScreen({ name: 'builder', character: c })} onNotes={(c) => setScreen({ name: 'notes', character: c })}
        onSheet={(c) => setSheetFor(c)} onAdd={(list) => store(list)}
        onDelete={(id) => store(characters.filter((c) => c.id !== id))} />;
    case 'notes':
      // Kuyruk KQ4 CK1: kısa notlar ekranı.
      return <NotesScreen character={screen.character} onCancel={() => setScreen({ name: 'player' })}
        onSave={(c) => { store(characters.map((x) => (x.id === c.id ? c : x))); setScreen({ name: 'player' }); }} />;
    case 'builder':
      // Görev SD3: yeni karakter (adsız, becerisiz) önerilen başlangıç değerleriyle açılır.
      return <Builder initial={screen.character} suggest={screen.character.sheet.name === '' && screen.character.classSkills.length === 0}
        onCancel={() => setScreen(screen.oda ? { name: 'katil', roomId: screen.oda.id } : { name: 'player' })}
        onSave={(c) => {
          store(characters.some((x) => x.id === c.id) ? characters.map((x) => (x.id === c.id ? c : x)) : [...characters, c]);
          setScreen(screen.oda ? { name: 'katil', roomId: screen.oda.id } : { name: 'player' });
        }} />;
    case 'gm':
      if (!data.ready) return <Loading error={data.error} />;
      return <GmScreen characters={characters} onBack={home} onStart={(session, goalDraft) => setScreen({ name: 'battle', session, ...(goalDraft ? { goalDraft } : {}) })}
        onUpdateCharacters={store} onSefer={(id) => setScreen({ name: 'journey', preset: id })} />;
    case 'oda':
      if (!data.ready) return <Loading error={data.error} />;
      return <OdaKur characters={characters} onBack={home} roomId={screen.roomId} onStart={(session, oda, goalDraft) => setScreen({ name: 'battle', session, oda, ...(goalDraft ? { goalDraft } : {}) })}
        onUpdateCharacters={store} onSefer={(id) => setScreen({ name: 'journey', preset: id })}
        onResume={(oda) => {
          void import('./app/battleSave').then(({ loadBattle }) => {
            const r = loadBattle();
            if (r.ok) { setResumeError(null); setScreen({ name: 'battle', session: r.session, restored: true, oda, hp: r.hp }); } else setResumeError(r.error);
          });
        }}
        onResumeUnbound={() => {
          // ANA-MENU-SADELESTIR: Hızlı savaş kartı kalktı; odasız kayıtlı savaş Oda kur'dan da açılır (çıkış eskisi gibi kurulum ekranına).
          void import('./app/battleSave').then(({ loadBattle }) => {
            const r = loadBattle();
            if (r.ok) { setResumeError(null); setScreen({ name: 'battle', session: r.session, restored: true, hp: r.hp }); } else setResumeError(r.error);
          });
        }} />;
    case 'katil':
      return <OdaKatil characters={characters} onBack={home} roomId={screen.roomId} onCharacters={store}
        onWatch={(watch) => { const s = watch.current(); if (s) setScreen({ name: 'battle', session: s, watch, restored: true }); }}
        onBuild={(id, overlay) => setScreen({ name: 'builder', character: newCharacter(newId()), oda: { id, overlay } })} />;
    case 'battle':
      if (!data.ready) return <Loading error={data.error} />;
      // Kuyruk 14 Y1: yolculuk savaşı biter; sonuç yolculuğa döner (karakter deposu değişmez).
      // Kuyruk 31: Serüven savaşı; sonuç (zafer/bozgun) Serüven'e döner.
      if (screen.seruven) {
        const node = screen.seruven;
        return <Battle initial={screen.session} restored={false} exitLabel={t().seruven.title} mapFilter={screen.mapFilter}
          onExit={(final) => setScreen({ name: 'seruven', result: final && (final.status === 'finished' || node.startsWith('link:') || node.startsWith('yer:') || node.startsWith('hapis:')) ? { final, node } : null })} />;
      }
      if (screen.watch) return <Battle initial={screen.session} watch={screen.watch} restored onExit={() => setScreen({ name: 'katil' })} />;
      if (screen.journey) return <Battle initial={screen.session} restored={false} exitLabel={t().journey.title}
        onExit={(final) => setScreen({ name: 'journey', result: final?.status === 'finished' ? final : null })} />;
      if (screen.oda) {
        const oda = screen.oda;
        return <Battle initial={screen.session} goalDraft={screen.goalDraft} restored={screen.restored === true} exitLabel={t().oda.back}
          onEvents={(ev) => { if (odaCanli) odaCanli.hostYayinla(oda, ev); else void import('./screens/odaCanli').then((m) => { odaCanli = m; m.hostYayinla(oda, ev); }); }}
          odaId={oda}
          onExit={(final) => {
            if (final?.status === 'finished') store(applyBattleResult(characters, final));
            // Bitince oda ayarları açılır ve son savaş özeti yazılır; bitmediyse kayıtlı savaş için kilitli kalır.
            void import('./oda/exit').then((m) => m.roomBattleExit(oda, final));
            setScreen({ name: 'oda', roomId: oda });
          }} />;
      }
      return <Battle initial={screen.session} goalDraft={screen.goalDraft} restored={screen.restored === true} exitLabel={t().battle.toSetup}
        onExit={(final) => {
          // Biten savaşta karakterlerin kalan HP'si, kaynakları ve slotları kaydedilir (dinlenmezse yaralı başlarlar).
          if (final?.status === 'finished') store(applyBattleResult(characters, final));
          setScreen({ name: 'gm' });
        }} />;
    case 'journey':
      if (!data.ready) return <Loading error={data.error} />;
      return <JourneyScreen characters={characters} onBack={home} result={screen.result ?? null} {...(screen.preset ? { preset: screen.preset } : {})}
        onResultUsed={() => setScreen({ name: 'journey' })} onBattle={(session) => setScreen({ name: 'battle', session, journey: true })} />;
    case 'seruven':
      if (!data.ready) return <Loading error={data.error} />;
      return <SeruvenScreen characters={characters} onBack={home} result={screen.result ?? null}
        onResultUsed={() => setScreen({ name: 'seruven' })} onBattle={(session, node, mapFilter) => setScreen({ name: 'battle', session, seruven: node, ...(mapFilter ? { mapFilter } : {}) })} />;
    case 'status':
      return <StatusScreen onBack={home} />;
    case 'settings':
      // İçerik değişince karakter listesi yeniden çizilir ("içerik eksik" rozetleri).
      return <SettingsScreen onBack={home} onChanged={() => setCharacters((c) => [...c])} />;
    case 'dex':
      return <Dungeondex onBack={home} />;
  }
  }
}
