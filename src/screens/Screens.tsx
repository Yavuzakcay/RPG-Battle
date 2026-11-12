/**
 * Bütünleşik uygulamanın ilk ekranları (Adım 13): giriş (rol seçimi) ve oyuncu (kayıtlı
 * karakterler). Game Master (GmScreen.tsx) ve durum (StatusScreen.tsx) ayrı, tembel yüklenen parçalar. Tek cihaz: rol seçimi yalnızca hangi ekranın
 * açılacağını belirler; online sürüm sonra.
 */
import { alignmentLongRest } from '../rules/alignmentRest';
import { lazy, Suspense, useEffect, useState } from 'react';
import { classes, races, weapons } from '../data';
import { lineageLine } from '../ui/lineageText';
import { carriedWeight, carryLoad, type LoadLevel } from '../rules/carry';
import { storedCarryRule } from '../ui/carrySetting';
import { sheetAvatar } from '../battle/avatar';
import { newCharacter, characterProblems, type SavedCharacter } from '../rules/builder';
import { deriveStats } from '../rules/stats';
import { currentStatus, fullStatus, isRested, longRestStatus, magicalCunningStatus, shortRestStatus } from '../rules/characterRest';
import { subclassMissing } from '../rules/subclasses';
import { resourceDef } from '../rules/classFeatures';
import { masteryOptions, masteryRight, masterySwapLimit, masterySwapProblem, masteryText, masteryWorks, weaponMasteryId } from '../rules/mastery';
import { newId } from '../app/storage';
import { alignmentEnabled } from '../app/features';
// Kuyruk K51: hizalanma etiketi tembel (ana parça sınırı).
const AlignmentBadge = lazy(() => import('../ui/AlignmentBadge'));
import { MAX_PARTY } from '../app/limits';
import { CharacterFigure } from '../ui/Avatar';
import { useTheme } from '../ui/theme';
import { SoundPanel } from '../ui/SoundPanel';
import { IconAuto, IconGear, IconHexDie, IconMoon, IconPlay, IconSound, IconSun, IconUser } from '../ui/icons';
import { savedBattleSummary, type SaveSummary } from '../app/saveKey';
import { version as appVersion } from '../../package.json';
import { LANGS, setLang, t, useLang } from '../i18n';
import { APP_NAME } from '../app/appName';
import { ResourceChip, iconed, plain, sharedIcons } from '../ui/ResourceChip';

/** Görev K5: kayıtlı karakterin yük durumu (Ayarlar'daki kurala göre; hesaplanamazsa sorun yok sayılır). */
const carryLevel = (sheet: Parameters<typeof carryLoad>[0]): LoadLevel => { try { return carryLoad(sheet, storedCarryRule()).level; } catch { return 'ok'; } };
const raceName = (id: string) => races.find((r) => r.id === id)?.name ?? id;
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

/**
 * Görev M1: harita adı yalnızca kayıtlı savaş varken (tembel; ana parçaya girmez). Kuyruk 19D: dosya adı kimlik değil
 * (ad tabanı), kimlik JSON'un `id` alanında; harita dosyaları tembel parçalarda açılıp kimlikle eşleştirilir.
 */
const MAP_FILES = import.meta.glob<{ id: string; name: string }>(['../../harita/*/*.json', '!../../harita/_ortak/*.json', '!../../harita/belgeler/*.json'], { import: 'default' });
function useMapName(mapId: string | undefined): string | undefined {
  const [name, setName] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!mapId) return;
    let live = true;
    void Promise.all(Object.values(MAP_FILES).map((load) => load().catch(() => null)))
      .then((list) => { const m = list.find((x) => x?.id === mapId); if (live && m) setName(m.name); });
    return () => { live = false; };
  }, [mapId]);
  return name;
}

/** Kayıt özeti: "Kale · gece · 3. tur · 30.10.2026 18:40". */
function resumeLine(sum: SaveSummary | null, mapName: string | undefined, lang: string): string {
  if (!sum) return '';
  const H = t().home;
  const when = sum.savedAt ? new Date(sum.savedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const phase = /gece|night/i.test(sum.variantId ?? '') ? H.night : H.day;
  return [mapName ?? sum.mapId ?? '', phase, H.round(sum.round), when].filter(Boolean).join(' · ');
}

/** Ana menü teması: çip (masaüstü) ya da yuvarlak simge düğmesi (mobil); Otomatik → Açık → Koyu. */
function HomeTheme() {
  const [choice, cycle] = useTheme();
  const label = t().common.theme[choice];
  return (
    <button type="button" className="home-chip" onClick={cycle} aria-label={label} title={label}>
      {choice === 'auto' ? <IconAuto size={20} /> : choice === 'light' ? <IconSun size={20} /> : <IconMoon size={20} />}
      <span className="home-chip-text">{label.split(': ')[1] ?? label}</span>
    </button>
  );
}

function HomeSound() {
  const [open, setOpen] = useState(false);
  const label = t().sound.button;
  return (
    <span className="sound-button home-sound">
      <button type="button" className="home-chip" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen(!open)}>
        <IconSound size={20} /><span className="home-chip-text">{label}</span>
      </button>
      {open && <SoundPanel onClose={() => setOpen(false)} />}
    </span>
  );
}

/**
 * Giriş ekranı (Görev M1 tasarımı): masaüstünde solda logo, başlık ve açıklama, sağ üstte tema/ses/dil çipleri, sağda
 * cam panel (kayıtlı savaş, Oyuncu, Game Master, Ayarlar; Kuyruk 18 H10: Durum düğmesi kaldırıldı); dar ekranda üst çubuk ve alta yapışık panel. Arka
 * plan görseline karartma ya da filtre konmaz; okunabilirlik cam panel ve metin gölgesiyle.
 */
export function Home(props: { onPlayer: () => void; onGm: () => void; /** Kuyruk 18 H10: giriş ekranında Durum düğmesi yok (kullanılmaz). */ onStatus?: () => void; onSettings?: () => void; onResume?: () => void; onJourney?: () => void; onSeruven?: () => void; resumeError?: string | null }) {
  const lang = useLang();
  const L = t();
  const H = L.home;
  const [name1, name2] = APP_NAME.split('&');
  const [summary] = useState(() => (props.onResume ? savedBattleSummary() : null));
  const mapName = useMapName(summary?.mapId);
  return (
    <div className="menu-screen home-screen">
      <main className="app home home2">
        <div className="home2-tools" role="group" aria-label={H.tools}>
          <div className="home2-tools-left"><HomeTheme /><HomeSound /></div>
          <div className="lang-switch home-lang" role="radiogroup" aria-label={L.lang.label}>
            {LANGS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : 'ghost'} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <header className="brand home2-brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo/logo-masaustu.webp`} alt="" decoding="async" />
          <h1 className="brand-title" lang="en" aria-label={APP_NAME}>
            {name2 !== undefined ? <>{name1}<span className="amp">&amp;</span>{name2}</> : APP_NAME}
          </h1>
          <p className="intro">{H.intro}</p>
        </header>
        <nav className="home2-panel" aria-label={H.actions}>
          {props.onResume && (
            <button type="button" className="home-card resume" onClick={props.onResume}>
              <span className="home-icon"><IconPlay size={26} /></span>
              <span className="home-card-text"><strong>{H.resume}</strong>{summary && <span>{resumeLine(summary, mapName, lang)}</span>}</span>
            </button>
          )}
          <div className="home2-roles">
            <button type="button" className="role home-card player" onClick={props.onPlayer}>
              <span className="home-icon teal"><IconUser size={26} /></span>
              <span className="home-card-text"><strong>{H.player}</strong><span>{H.playerDesc}</span></span>
            </button>
            <button type="button" className="role home-card gm" onClick={props.onGm}>
              <span className="home-icon orange"><IconHexDie size={26} /></span>
              <span className="home-card-text"><strong>{L.common.gm}</strong><span>{H.gmDesc}</span></span>
            </button>
          </div>
          {/* Kuyruk 31: Serüven (kıta sayfaları; Game Master gerekmez). */}
          {props.onSeruven && (
            <button type="button" className="home-card journey seruven" onClick={props.onSeruven}>
              <span className="home-icon"><IconPlay size={22} /></span>
              <span className="home-card-text"><strong>{L.seruven.menu}</strong><span>{L.seruven.menuDesc}</span></span>
            </button>
          )}
          {/* Kuyruk 14 Y1: yolculuk (deneme) yalnızca bayrak açıkken. */}
          {props.onJourney && (
            <button type="button" className="home-card journey" onClick={props.onJourney}>
              <span className="home-icon"><IconPlay size={22} /></span>
              <span className="home-card-text"><strong>{L.journey.menu}</strong><span>{L.journey.menuDesc}</span></span>
            </button>
          )}
          <div className="home2-secondary">
            {props.onSettings && <button type="button" className="home-sec" onClick={props.onSettings}><IconGear size={20} />{H.settings}</button>}
          </div>
          {props.resumeError && <p className="error">{props.resumeError}</p>}
        </nav>
        <p className="home2-version">{H.version(appVersion.split('.').slice(0, 2).join('.'))}</p>
      </main>
    </div>
  );
}

/** Kayıtlı karakter kartı: avatar, tür/sınıf/seviye, HP ve AC. */
/** Kartta ustalıklar: "Longsword: Sap, Dagger: Nick (oyunda henüz çalışmıyor)". */
function masteryList(sheet: SavedCharacter['sheet']): string {
  const P = t().player;
  return (sheet.weaponMasteries ?? []).map((id) => {
    const m = weaponMasteryId(id);
    const name = weapons.find((w) => w.id === id)?.name ?? id;
    const label = m ? masteryText(m)?.name ?? m : '?';
    return `${name}: ${label}${m && !masteryWorks(m) ? ` (${P.notWorking})` : ''}`;
  }).join(', ');
}

function CharacterCard(props: { c: SavedCharacter; children?: React.ReactNode; rest?: React.ReactNode }) {
  const { sheet } = props.c;
  const problems = characterProblems(props.c, { msg: t().builder.issues });
  let line = '';
  try {
    const d = deriveStats(sheet);
    line = t().player.cardLine(d.maxHp, d.ac, d.speed);
  } catch {
    line = t().common.incomplete;
  }
  return (
    <div className="char-card">
      <CharacterFigure avatar={sheetAvatar(sheet)} size={48} title={sheet.name || t().common.unnamed} />
      <div>
        <strong>{sheet.name || t().common.unnamed}</strong>
        <small>{t().player.cardTitle(raceName(sheet.raceId), className(sheet.classId), sheet.level)} · {line}</small>
        {lineageLine(sheet) && <small className="card-lineage">{lineageLine(sheet)}</small>}
        {/* Görev K5: kural açıkken yük eşiği aşıldıysa uyarı rozeti (eski kayıt açılır, engellenmez). */}
        {((lvl) => lvl !== 'ok' && <small className="carry-badge error">⚖ {t().carry.level[lvl]} ({carriedWeight(sheet)} lb)</small>)(carryLevel(sheet))}
        {(sheet.weaponMasteries ?? []).length > 0 && <small>{t().player.cardMastery(masteryList(sheet))}</small>}
        {problems.length > 0 && <small className="error">{t().common.problems(problems.length)}</small>}
        {subclassMissing(sheet.classId, sheet.subclassId) && <small className="error">{t().content.missing(sheet.subclassId ?? '')}</small>}
        {alignmentEnabled() && <Suspense fallback={null}><AlignmentBadge value={props.c.hizalanma} /></Suspense>}
        {props.rest}
      </div>
      <div className="card-actions">{props.children}</div>
    </div>
  );
}

/**
 * Savaşlar arası durum ve dinlenme (Görev N): kalan HP, HP zarı, kaynaklar ve slotlar; kısa dinlenmede HP zarı
 * harcanır, uzun dinlenme her şeyi doldurur. Dinlenmiş karakterde yalnızca "Dinlenmiş" yazar.
 */
export function RestPanel(props: { c: SavedCharacter; onUpdate: (c: SavedCharacter) => void }) {
  const R = t().player.rest;
  const { sheet } = props.c;
  const [dice, setDice] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  /** Uzun dinlenmeden önceki ustalık seçimleri: dinlenmeden sonra silah talimiyle değiştirilebilir (SRD Weapon Mastery). */
  const [drills, setDrills] = useState<string[] | null>(null);
  let s;
  let full;
  try { s = currentStatus(sheet, props.c.status); full = fullStatus(sheet); } catch { return null; }
  const drillPanel = drills && <MasteryDrills c={props.c} before={drills} onUpdate={props.onUpdate} onDone={() => setDrills(null)} />;
  if (isRested(sheet, props.c.status)) return note || drillPanel ? <>{note && <small className="ok">{note}</small>}{drillPanel}</> : null;
  const left = sheet.level - s.hitDiceSpent;
  const resList = Object.entries(s.resources).filter(([id]) => (full.resources[id] ?? 0) > 0);
  const res = plain(resList).map(([id, n]) => `${resourceDef(id)?.name ?? id} ${n}/${full.resources[id]}`).join(', ');
  const resIcons = iconed(resList);
  const slots = s.slots.map((n, i) => (full.slots[i] ? `${i + 1}: ${n}/${full.slots[i]}` : '')).filter(Boolean).join(' · ');
  return (
    <div className="rest-panel">
      <small>{R.status(s.hp, full.hp, left, sheet.level)}</small>
      {res && <small>{R.resources(res)}</small>}
      {/* Kuyruk E4c: ikonlu kaynaklar "ikon + sayı/üst sınır". */}
      {resIcons.length > 0 && <span className="res-chips">{resIcons.map(([id, n]) => <ResourceChip key={id} id={id} n={n} max={full.resources[id]} showName={sharedIcons(resIcons.map(([x]) => x)).has(id)} />)}</span>}
      {slots && <small>{R.slots(slots)}</small>}
      {s.dead ? (
        <>
          <small className="error">{R.dead}</small>
          <div className="card-actions"><button className="ghost" onClick={() => { const { status: _s, ...rest } = props.c; props.onUpdate(rest); }}>{R.revive}</button></div>
        </>
      ) : (
        <div className="card-actions">
          <label className="rest-dice">{R.dice}
            <span className="stepper">
              <button aria-label="−" disabled={dice <= 0} onClick={() => setDice(dice - 1)}>−</button>
              <b>{Math.min(dice, left)}</b>
              <button aria-label="+" disabled={dice >= left} onClick={() => setDice(dice + 1)}>+</button>
            </span>
          </label>
          <button onClick={() => {
            const r = shortRestStatus(sheet, props.c.status, Math.min(dice, left), Math.random);
            setNote(R.shortDone(r.rolls.join(' + '), r.healed));
            props.onUpdate({ ...props.c, status: r.status });
          }}>{R.short}</button>
          {((): JSX.Element | null => {
            // Görev WARLOCK: Magical Cunning (savaş dışı ayin; veride kaynak varsa).
            const mc = magicalCunningStatus(sheet, props.c.status);
            return mc ? <button className="ghost" onClick={() => { setNote(R.cunningDone); props.onUpdate({ ...props.c, status: mc }); }}>{R.cunning}</button> : null;
          })()}
          <button onClick={() => {
            setNote(R.longDone);
            if (masteryRight(sheet)) setDrills(sheet.weaponMasteries ?? []);
            props.onUpdate(alignmentLongRest({ ...props.c, status: longRestStatus(sheet, props.c.status) }));
          }}>{R.long}</button>
        </div>
      )}
      {s.hp <= 0 && !s.dead && <small className="error">{R.down}</small>}
      {note && <small className="ok">{note}</small>}
    </div>
  );
}

/** Uzun dinlenmeden sonra silah talimi: ustalık seçimlerini kurala göre değiştir (Fighter/Barbarian bir, diğerleri hepsi). */
function MasteryDrills(props: { c: SavedCharacter; before: string[]; onUpdate: (c: SavedCharacter) => void; onDone: () => void }) {
  const R = t().player.rest;
  const sheet = props.c.sheet;
  const right = masteryRight(sheet);
  const [next, setNext] = useState<string[]>(props.before);
  if (!right) return null;
  const base = { ...sheet, weaponMasteries: props.before };
  const chosen = next.filter(Boolean);
  const problem = masterySwapProblem(base, chosen);
  const options = masteryOptions(sheet);
  return (
    <div className="rest-drills">
      <small>{R.drills(masterySwapLimit(base))}</small>
      <div className="card-actions">
        {Array.from({ length: right.count }, (_, i) => (
          <select key={i} aria-label={R.drillSlot(i + 1)} value={next[i] ?? ''} onChange={(e: { target: { value: string } }) => {
            const copy = [...next];
            copy[i] = e.target.value;
            setNext(copy);
          }}>
            <option value="">—</option>
            {options.map((w) => {
              const m = weaponMasteryId(w.id);
              return <option key={w.id} value={w.id}>{w.name} ({m ? masteryText(m)?.name ?? m : ''})</option>;
            })}
          </select>
        ))}
        <button disabled={!!problem} onClick={() => { props.onUpdate({ ...props.c, sheet: { ...sheet, weaponMasteries: chosen } }); props.onDone(); }}>{R.drillApply}</button>
        <button className="ghost" onClick={props.onDone}>{R.drillSkip}</button>
      </div>
      {problem && <small className="error">{problem}</small>}
    </div>
  );
}

export function PlayerScreen(props: {
  characters: SavedCharacter[]; onEdit: (c: SavedCharacter) => void; onDelete: (id: string) => void;
  onBack: () => void; onUpdate?: (c: SavedCharacter) => void;
}) {
  const full = props.characters.length >= MAX_PARTY;
  const L = t();
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="menu-screen">
      <main className="app">
        <header>
          <h1>{L.player.title}</h1>
          <button className="ghost" onClick={props.onBack}>{L.common.home}</button>
        </header>
        <section className="panel">
          <div className="gm-row">
            <button disabled={full} onClick={() => props.onEdit(newCharacter(newId()))}>{L.player.newCharacter}</button>
            <span className={`mute party-limit${full ? ' full' : ''}`}>{L.player.limit(props.characters.length, MAX_PARTY)}</span>
          </div>
          {props.characters.length === 0 && <p className="empty-state">{L.player.empty}</p>}
          {props.characters.map((c) => (
            <CharacterCard key={c.id} c={c} rest={props.onUpdate ? <RestPanel c={c} onUpdate={props.onUpdate} /> : null}>
              <button onClick={() => props.onEdit(c)}>{L.common.edit}</button>
              {confirm === c.id
                ? <button className="danger" onClick={() => { props.onDelete(c.id); setConfirm(null); }}>{L.common.confirmDelete}</button>
                : <button className="ghost" onClick={() => setConfirm(c.id)}>{L.common.delete}</button>}
            </CharacterCard>
          ))}
        </section>
      </main>
    </div>
  );
}
