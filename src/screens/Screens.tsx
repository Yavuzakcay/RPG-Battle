/**
 * Bütünleşik uygulamanın ilk ekranları (Adım 13): giriş (rol seçimi) ve oyuncu (kayıtlı
 * karakterler). Game Master (GmScreen.tsx) ve durum (StatusScreen.tsx) ayrı, tembel yüklenen parçalar. Tek cihaz: rol seçimi yalnızca hangi ekranın
 * açılacağını belirler; online sürüm sonra.
 */
import { useState } from 'react';
import { classes, races } from '../data';
import { sheetAvatar } from '../battle';
import { blankCharacter, characterProblems, type SavedCharacter } from '../rules/builder';
import { deriveStats } from '../rules/stats';
import { newId } from '../app/storage';
import { MAX_PARTY } from '../app/limits';
import { AvatarBadge } from '../ui/Avatar';
import { ThemeButton } from '../ui/theme';
import { LANGS, setLang, t, useLang } from '../i18n';

const raceName = (id: string) => races.find((r) => r.id === id)?.name ?? id;
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

export function Home(props: { onPlayer: () => void; onGm: () => void; onStatus: () => void; onResume?: () => void; resumeError?: string | null }) {
  const lang = useLang();
  const L = t();
  return (
    <div className="menu-screen">
      <main className="app home">
        <header>
          <h1>RPG Battle</h1>
          <ThemeButton />
        </header>
        <p className="mute intro">{L.home.intro}</p>
        <div className="lang-switch" role="radiogroup" aria-label={L.lang.label}>
          {LANGS.map((l) => (
            <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : 'ghost'} onClick={() => setLang(l)}>{L.lang[l]}</button>
          ))}
        </div>
        <div className="roles">
          <button className="role" onClick={props.onPlayer}>
            <strong>{L.home.player}</strong><span>{L.home.playerDesc}</span>
          </button>
          <button className="role" onClick={props.onGm}>
            <strong>{L.common.gm}</strong><span>{L.home.gmDesc}</span>
          </button>
        </div>
        <div className="gm-row">
          {props.onResume && <button onClick={props.onResume}>{L.home.resume}</button>}
          <button className="ghost" onClick={props.onStatus}>{L.home.status}</button>
        </div>
        {props.resumeError && <p className="error">{props.resumeError}</p>}
      </main>
    </div>
  );
}

/** Kayıtlı karakter kartı: avatar, tür/sınıf/seviye, HP ve AC. */
function CharacterCard(props: { c: SavedCharacter; children?: React.ReactNode }) {
  const { sheet } = props.c;
  const problems = characterProblems(props.c);
  let line = '';
  try {
    const d = deriveStats(sheet);
    line = t().player.cardLine(d.maxHp, d.ac, d.speed);
  } catch {
    line = t().common.incomplete;
  }
  return (
    <div className="char-card">
      <AvatarBadge avatar={sheetAvatar(sheet)} size={44} ring="var(--party)" eager />
      <div>
        <strong>{sheet.name || t().common.unnamed}</strong>
        <small>{t().player.cardTitle(raceName(sheet.raceId), className(sheet.classId), sheet.level)} · {line}</small>
        {problems.length > 0 && <small className="error">{t().common.problems(problems.length)}</small>}
      </div>
      <div className="card-actions">{props.children}</div>
    </div>
  );
}

export function PlayerScreen(props: {
  characters: SavedCharacter[]; onEdit: (c: SavedCharacter) => void; onDelete: (id: string) => void;
  onBack: () => void;
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
            <button disabled={full} onClick={() => props.onEdit(blankCharacter(newId()))}>{L.player.newCharacter}</button>
            <span className={`mute party-limit${full ? ' full' : ''}`}>{L.player.limit(props.characters.length, MAX_PARTY)}</span>
          </div>
          {props.characters.length === 0 && <p className="empty-state">{L.player.empty}</p>}
          {props.characters.map((c) => (
            <CharacterCard key={c.id} c={c}>
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
