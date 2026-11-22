/**
 * Kuyruk KQ4 CK1: karakter kâğıdının çizimi (özgün düzen; A4 dikey, en çok 2 sayfa: 1 değerler ve eylemler, 2 özellikler, büyüler,
 * donanım, hikâye). Boş hikâye alanları ve hepsi boşsa hikâye bölümü hiç çizilmez. Açık zemin, yazdırmaya uygun (`sheet.css`).
 */
import type { SavedCharacter } from '../../rules/builder';
import { sheetAvatar } from '../../battle/avatar';
import { AvatarBadge } from '../../ui/Avatar';
import { LookFrame } from '../../ui/LookFrame';
import type { CharacterSheet } from '../../rules/stats';
import { getLang, t } from '../../i18n';
import { sheetModel, signed, type SheetModel } from './sheetModel';
import { GlyphText } from '../../ui/glyph/Glyph';
import { alignmentEnabled } from '../../app/features';
import { storedCarryRule } from '../../ui/carrySetting';
import './sheet.css';

/**
 * GORSEL-DUZELTME: karakter kâğıdının portresi. Görünümü olan karakterde (alt soy filtresi/oranı, Celestial uyanışı, kanat) rozet ve
 * savaş jetonuyla aynı tek çözücüden (`lineageLook`) `LookFrame` ile; karakter ekranı olduğu için uçma yeteneği olan kanatlı çizilir
 * (`ability`, karakter listesi ve oluşturucu figürü gibi).
 */
export function SheetPortrait(props: { sheet: CharacterSheet; size?: number }) {
  const size = props.size ?? 84;
  const avatar = sheetAvatar(props.sheet);
  const badge = <AvatarBadge avatar={avatar} size={size} ring="#444" />;
  return avatar.look ? <LookFrame sheet={avatar.look} size={size} ability>{badge}</LookFrame> : badge;
}

export function SheetView(props: { c: SavedCharacter; model?: SheetModel }) {
  const S = t().sheet;
  const lang = getLang();
  const m = props.model ?? sheetModel(props.c, lang, { carryRule: storedCarryRule(), alignmentOn: alignmentEnabled() });
  const ST = t().story;
  const byLevel = (from: SheetModel['features'][number]['from']) => m.features.filter((f) => f.from === from);
  return (
    <article className="sheet-paper" lang={lang}>
      <section className="sheet-page" data-page="1">
        <header className="sheet-head">
          <div className="sheet-token"><SheetPortrait sheet={props.c.sheet} /></div>
          <div className="sheet-title">
            <h1>{m.name || '—'}</h1>
            <p>{m.race} · {m.klass}{m.subclass ? ` (${m.subclass})` : ''} · {S.level(m.level)}{m.background ? ` · ${m.background}` : ''}</p>
            {m.alignment && <p className="sheet-sub">{S.alignment}: {m.alignment}</p>}
            {m.missing.length > 0 && <p className="sheet-warn">{S.missing}: {m.missing.join(', ')}</p>}
          </div>
        </header>
        <div className="sheet-grid">
          <div className="sheet-col">
            <h2>{S.scores}</h2>
            <ul className="sheet-scores">
              {m.scores.map((s) => <li key={s.ability}><b>{s.ability.toUpperCase()}</b><span className="mod">{signed(s.mod)}</span><small>{s.score}</small></li>)}
            </ul>
            <h2>{S.saves}</h2>
            <ul className="sheet-list">
              {m.saves.map((s) => <li key={s.ability} className={s.proficient ? 'prof' : ''}><span className="dot">{s.proficient ? '●' : '○'}</span> {s.ability.toUpperCase()} <b>{signed(s.bonus)}</b></li>)}
            </ul>
          </div>
          <div className="sheet-col">
            <ul className="sheet-vitals">
              <li><small>{S.ac}</small><b>{m.ac}</b></li>
              <li><small>{S.hp}</small><b>{m.maxHp}</b></li>
              <li><small>{S.speed}</small><b>{m.speed} {S.ft}</b></li>
              <li><small>{S.initiative}</small><b>{signed(m.initiative)}</b></li>
              <li><small>{S.proficiency}</small><b>{signed(m.proficiency)}</b></li>
              <li><small>{S.passive}</small><b>{m.passivePerception}</b></li>
            </ul>
            <h2>{S.attacks}</h2>
            {m.attacks.length === 0 ? <p className="sheet-sub">—</p> : (
              <table className="sheet-table">
                <thead><tr><th>{S.attacks}</th><th>{S.atk}</th><th>{S.dmg}</th></tr></thead>
                <tbody>{m.attacks.map((a, i) => <tr key={i}><td>{a.name}</td><td>{signed(a.attack)}</td><td>{a.damage} {a.type}</td></tr>)}</tbody>
              </table>
            )}
          </div>
          <div className="sheet-col">
            <h2>{S.skills}</h2>
            <ul className="sheet-list skills">
              {m.skills.map((s) => (
                <li key={s.skill} className={s.proficient ? 'prof' : ''}>
                  <span className="dot">{s.expertise ? '◉' : s.proficient ? '●' : '○'}</span> {s.name} <b>{signed(s.bonus)}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="sheet-page" data-page="2">
        <h2>{S.features}</h2>
        <ul className="sheet-features">
          {(['class', 'subclass', 'species'] as const).flatMap((g) => byLevel(g)).map((f) => (
            <li key={`${f.from}${f.name}${f.level}`}><b>{f.name}</b> <small>{f.level}</small>{f.text ? <span> <GlyphText text={f.text} /></span> : null}</li>
          ))}
        </ul>
        {lang !== 'tr' && m.features.some((f) => f.text) === false && <p className="sheet-sub">{S.trOnly}</p>}
        {m.spells && (
          <>
            <h2>{S.spells}</h2>
            <p className="sheet-sub">
              {m.spells.dc !== null ? `${S.spellDc} ${m.spells.dc}` : ''}{m.spells.attack !== null ? ` · ${S.spellAtk} ${signed(m.spells.attack)}` : ''}
              {m.spells.slots.some((n) => n > 0) ? ` · ${S.slots}: ${m.spells.slots.map((n, i) => (n > 0 ? `${i + 1}:${n}` : '')).filter(Boolean).join(' ')}` : ''}
            </p>
            {m.spells.groups.map((g) => (
              <div key={g.level} className="sheet-spellgroup">
                <h3>{g.level === 0 ? S.cantrips : `${g.level}.`}</h3>
                <p>{g.list.map((s) => (s.comps ? `${s.name} (${s.comps})` : s.name)).join(', ')}</p>
              </div>
            ))}
          </>
        )}
        <h2>{S.gear}</h2>
        <p>{[m.gear.armor, m.gear.shield ? 'Shield' : '', ...m.gear.weapons, ...m.gear.items].filter(Boolean).join(', ') || '—'}</p>
        <p className="sheet-sub">{S.carry(Math.round(m.gear.weight * 10) / 10, Math.round(m.gear.capacity))}</p>
        {m.story.length > 0 && (
          <>
            <h2>{S.story}</h2>
            {m.story.map((x) => (
              <div key={x.field} className="sheet-story"><h3>{ST.fields[x.field]}</h3><p>{x.text}</p></div>
            ))}
          </>
        )}
      </section>
    </article>
  );
}
