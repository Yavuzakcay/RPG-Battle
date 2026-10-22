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
import { currentStatus, fullStatus, isRested, longRestStatus, shortRestStatus } from '../rules/characterRest';
import { resourceDef } from '../rules/classFeatures';
import { newId } from '../app/storage';
import { MAX_PARTY } from '../app/limits';
import { AvatarBadge } from '../ui/Avatar';
import { ThemeButton } from '../ui/theme';
import { SoundButton } from '../ui/SoundPanel';
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
          <SoundButton />
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
function CharacterCard(props: { c: SavedCharacter; children?: React.ReactNode; rest?: React.ReactNode }) {
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
  let s;
  let full;
  try { s = currentStatus(sheet, props.c.status); full = fullStatus(sheet); } catch { return null; }
  if (isRested(sheet, props.c.status)) return note ? <small className="ok">{note}</small> : null;
  const left = sheet.level - s.hitDiceSpent;
  const res = Object.entries(s.resources).filter(([id]) => (full.resources[id] ?? 0) > 0)
    .map(([id, n]) => `${resourceDef(id)?.name ?? id} ${n}/${full.resources[id]}`).join(', ');
  const slots = s.slots.map((n, i) => (full.slots[i] ? `${i + 1}: ${n}/${full.slots[i]}` : '')).filter(Boolean).join(' · ');
  return (
    <div className="rest-panel">
      <small>{R.status(s.hp, full.hp, left, sheet.level)}</small>
      {res && <small>{R.resources(res)}</small>}
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
          <button onClick={() => { setNote(R.longDone); props.onUpdate({ ...props.c, status: longRestStatus(sheet, props.c.status) }); }}>{R.long}</button>
        </div>
      )}
      {s.hp <= 0 && !s.dead && <small className="error">{R.down}</small>}
      {note && <small className="ok">{note}</small>}
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
            <button disabled={full} onClick={() => props.onEdit(blankCharacter(newId()))}>{L.player.newCharacter}</button>
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
