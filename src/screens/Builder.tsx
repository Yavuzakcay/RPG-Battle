/**
 * Karakter oluşturucu (Adım 13): tek uzun form. Skorlar standart dizi veya point buy; geçmiş
 * bonusu +2/+1 veya +1/+1/+1; sınıf ve geçmiş becerileri; zırh, silah, eşya; büyüler.
 * Sağda (dar ekranda altta) türetilen değerler ve sorunlar canlı görünür.
 */
import { useMemo, useState } from 'react';
import { armor, classes, getClass, items, races, weapons } from '../data';
import { sheetAvatar } from '../battle';
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import {
  POINT_BUY_BUDGET, STANDARD_ARRAY, backgroundPattern, characterProblems, pointBuyCost, spellOptions, suggestedScores,
  withSkills, type SavedCharacter,
} from '../rules/builder';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { AvatarBadge } from '../ui/Avatar';
import { MAX_PARTY } from '../app/limits';

export const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Güç (STR)', dex: 'Çeviklik (DEX)', con: 'Dayanıklılık (CON)', int: 'Zekâ (INT)', wis: 'Bilgelik (WIS)', cha: 'Karizma (CHA)',
};
const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));

function toggle<T>(list: T[], x: T, on: boolean): T[] {
  return on ? (list.includes(x) ? list : [...list, x]) : list.filter((y) => y !== x);
}

export function Builder(props: { initial: SavedCharacter; onSave: (c: SavedCharacter) => void; onCancel: () => void }) {
  const [c, setC] = useState<SavedCharacter>(props.initial);
  const s = c.sheet;
  const set = (patch: Partial<CharacterSheet>) => setC((x) => ({ ...x, sheet: { ...x.sheet, ...patch } }));
  const race = races.find((r) => r.id === s.raceId);
  const cls = getClass(s.classId);
  const final = withSkills(c);
  const problems = characterProblems(final);
  const derived = useMemo(() => {
    try { return deriveStats(final.sheet); } catch { return null; }
  }, [final.sheet]);
  const cost = pointBuyCost(s.baseScores);
  const pattern = backgroundPattern(s.backgroundBonuses ?? {});
  const spellChoices = spellOptions(s.classId, s.level);
  const classSkillList: Skill[] = cls.skillChoices.from === 'any' ? SKILL_IDS : cls.skillChoices.from;

  const setScore = (a: Ability, v: number) => set({ baseScores: { ...s.baseScores, [a]: v } });
  const setBonus = (a: Ability, v: number) => {
    const next = { ...(s.backgroundBonuses ?? {}) };
    if (v === 0) delete next[a]; else next[a] = v;
    set({ backgroundBonuses: next });
  };

  return (
    <div className="menu-screen">
      <main className="app wide builder">
        <header>
          <h1>{props.initial.sheet.name ? `${props.initial.sheet.name} düzenleniyor` : 'Yeni karakter'}</h1>
          <button className="ghost" onClick={props.onCancel}>Vazgeç</button>
          <button disabled={problems.length > 0} onClick={() => props.onSave(final)}>Kaydet</button>
        </header>
        <p className="mute party-limit">En fazla {MAX_PARTY} karakter: partiye en çok {MAX_PARTY} karakter katılır.</p>

        <div className="builder-grid">
          <div className="builder-form">
            <section className="panel">
              <h2>Kimlik</h2>
              <div className="form-row">
                <label>Ad <input value={s.name} maxLength={40} onChange={(e: { target: { value: string } }) => set({ name: e.target.value })} /></label>
                <label>Seviye
                  <select value={s.level} onChange={(e: { target: { value: string } }) => set({ level: Number(e.target.value), spellNames: (s.spellNames ?? []).filter((n) => spellOptions(s.classId, Number(e.target.value)).includes(n)) })}>
                    {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </label>
                <label>Avatar
                  <select value={s.gender ?? 'erkek'} onChange={(e: { target: { value: string } }) => set({ gender: e.target.value as 'erkek' | 'kadin' })}>
                    <option value="erkek">Erkek</option><option value="kadin">Kadın</option>
                  </select>
                </label>
                <AvatarBadge avatar={sheetAvatar(s)} size={48} ring="var(--party)" />
              </div>
            </section>

            <section className="panel">
              <h2>Tür ve sınıf</h2>
              <div className="form-row">
                <label>Tür
                  <select value={s.raceId} onChange={(e: { target: { value: string } }) => {
                    const r = races.find((x) => x.id === e.target.value);
                    set({ raceId: e.target.value, lineageId: r?.lineages?.[0]?.id });
                  }}>
                    {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                {race?.lineages && race.lineages.length > 0 && (
                  <label>Miras
                    <select value={s.lineageId ?? ''} onChange={(e: { target: { value: string } }) => set({ lineageId: e.target.value })}>
                      {race.lineages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </label>
                )}
                <label>Sınıf
                  <select value={s.classId} onChange={(e: { target: { value: string } }) => {
                    const id = e.target.value;
                    setC((x) => ({
                      ...x, classSkills: [],
                      sheet: {
                        ...x.sheet, classId: id, spellNames: (x.sheet.spellNames ?? []).filter((n) => spellOptions(id, x.sheet.level).includes(n)),
                        ...(x.method === 'standard' ? { baseScores: suggestedScores(id) } : {}),
                      },
                    }));
                  }}>
                    {classes.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </label>
              </div>
              {race && <p className="mute">{race.name}: hız {race.speed} ft{race.darkvision ? `, karanlık görüş ${race.darkvision} ft` : ''}. {race.traits}</p>}
            </section>

            <section className="panel">
              <h2>Ability skorları</h2>
              <div className="form-row">
                <label className="toggle"><input type="radio" checked={c.method === 'standard'}
                  onChange={() => setC((x) => ({ ...x, method: 'standard', sheet: { ...x.sheet, baseScores: suggestedScores(x.sheet.classId) } }))} /> Standart dizi</label>
                <label className="toggle"><input type="radio" checked={c.method === 'pointBuy'}
                  onChange={() => setC((x) => ({ ...x, method: 'pointBuy', sheet: { ...x.sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }))} /> Point buy</label>
                {c.method === 'pointBuy' && <strong className={cost !== null && cost <= POINT_BUY_BUDGET ? '' : 'error'}>{cost ?? '?'} / {POINT_BUY_BUDGET} puan</strong>}
              </div>
              <div className="scores">
                {ABILITIES.map((a) => {
                  const bonus = s.backgroundBonuses?.[a] ?? 0;
                  const total = s.baseScores[a] + bonus;
                  return (
                    <div className="score" key={a}>
                      <span>{ABILITY_NAMES[a]}</span>
                      {c.method === 'standard' ? (
                        <select aria-label={ABILITY_NAMES[a]} value={s.baseScores[a]} onChange={(e: { target: { value: string } }) => setScore(a, Number(e.target.value))}>
                          {STANDARD_ARRAY.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <span className="stepper">
                          <button aria-label="azalt" disabled={s.baseScores[a] <= 8} onClick={() => setScore(a, s.baseScores[a] - 1)}>−</button>
                          <b>{s.baseScores[a]}</b>
                          <button aria-label="artır" disabled={s.baseScores[a] >= 15} onClick={() => setScore(a, s.baseScores[a] + 1)}>+</button>
                        </span>
                      )}
                      <select aria-label={`${ABILITY_NAMES[a]} geçmiş bonusu`} value={bonus} onChange={(e: { target: { value: string } }) => setBonus(a, Number(e.target.value))}>
                        <option value={0}>—</option><option value={1}>+1</option><option value={2}>+2</option>
                      </select>
                      <small>= {total} ({mod(abilityModifier(total))})</small>
                    </div>
                  );
                })}
              </div>
              <p className={pattern === 'invalid' ? 'error' : 'mute'}>
                Geçmiş bonusu: {pattern === 'none' ? 'seçilmedi (+2/+1 veya +1/+1/+1)' : pattern === 'invalid' ? '+2/+1 veya +1/+1/+1 olmalı' : pattern === '2-1' ? '+2 / +1' : '+1 / +1 / +1'}
              </p>
            </section>

            <section className="panel">
              <h2>Beceriler</h2>
              <p className="mute">Sınıftan {cls.skillChoices.count} beceri ({c.classSkills.length} seçildi):</p>
              <div className="chips">
                {classSkillList.map((k) => (
                  <label key={k} className={`chip${c.classSkills.includes(k) ? ' on' : ''}`}>
                    <input type="checkbox" checked={c.classSkills.includes(k)}
                      disabled={!c.classSkills.includes(k) && c.classSkills.length >= cls.skillChoices.count}
                      onChange={(e: { target: { checked: boolean } }) => setC((x) => ({ ...x, classSkills: toggle(x.classSkills, k, e.target.checked), otherSkills: x.otherSkills.filter((o) => o !== k) }))} />
                    {SKILLS[k].name}
                  </label>
                ))}
              </div>
              <p className="mute">Geçmiş ve türden (en çok 3; geçmiş genellikle 2):</p>
              <div className="chips">
                {SKILL_IDS.filter((k) => !c.classSkills.includes(k)).map((k) => (
                  <label key={k} className={`chip${c.otherSkills.includes(k) ? ' on' : ''}`}>
                    <input type="checkbox" checked={c.otherSkills.includes(k)} disabled={!c.otherSkills.includes(k) && c.otherSkills.length >= 3}
                      onChange={(e: { target: { checked: boolean } }) => setC((x) => ({ ...x, otherSkills: toggle(x.otherSkills, k, e.target.checked) }))} />
                    {SKILLS[k].name}
                  </label>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Donanım</h2>
              <div className="form-row">
                <label>Zırh
                  <select value={s.armorName} onChange={(e: { target: { value: string } }) => set({ armorName: e.target.value })}>
                    {armor.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </label>
                <label className="toggle"><input type="checkbox" checked={s.shield} onChange={(e: { target: { checked: boolean } }) => set({ shield: e.target.checked })} /> Kalkan</label>
              </div>
              <p className="mute">Silahlar:</p>
              <div className="chips">
                {weapons.map((w) => {
                  const on = (s.weapons ?? []).some((x) => x.name === w.name);
                  return (
                    <label key={w.name} className={`chip${on ? ' on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={(e: { target: { checked: boolean } }) =>
                        set({ weapons: e.target.checked ? [...(s.weapons ?? []), { name: w.name }] : (s.weapons ?? []).filter((x) => x.name !== w.name) })} />
                      {w.name}
                    </label>
                  );
                })}
              </div>
              <p className="mute">Eşyalar:</p>
              <div className="chips">
                {items.map((it) => (
                  <label key={it.name} className={`chip${s.itemNames.includes(it.name) ? ' on' : ''}`}>
                    <input type="checkbox" checked={s.itemNames.includes(it.name)}
                      onChange={(e: { target: { checked: boolean } }) => set({ itemNames: toggle(s.itemNames, it.name, e.target.checked) })} />
                    {it.name}
                  </label>
                ))}
              </div>
            </section>

            {spellChoices.length > 0 && (
              <section className="panel">
                <h2>Büyüler ({(s.spellNames ?? []).length} seçildi)</h2>
                <div className="chips">
                  {spellChoices.map((n) => (
                    <label key={n} className={`chip${(s.spellNames ?? []).includes(n) ? ' on' : ''}`}>
                      <input type="checkbox" checked={(s.spellNames ?? []).includes(n)}
                        onChange={(e: { target: { checked: boolean } }) => set({ spellNames: toggle(s.spellNames ?? [], n, e.target.checked) })} />
                      {n}
                    </label>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="panel builder-summary" aria-label="Özet">
            <h2>Özet</h2>
            {derived ? (
              <>
                <p><b>HP</b> {derived.maxHp} · <b>AC</b> {derived.ac} · <b>Hız</b> {derived.speed} ft · <b>Prof.</b> +{derived.proficiency}</p>
                <p>{ABILITIES.map((a) => `${a.toUpperCase()} ${derived.scores[a]} (${mod(derived.modifiers[a])})`).join(' · ')}</p>
                <p>Save: {ABILITIES.map((a) => `${a.toUpperCase()} ${mod(derived.saves[a])}`).join(' · ')}</p>
                <p>Beceriler: {Object.entries(derived.skills).map(([k, v]) => `${SKILLS[k as Skill].name} ${mod(v as number)}`).join(', ') || '—'}</p>
                {derived.spellSaveDc !== null && <p>Büyü DC {derived.spellSaveDc} · saldırı {mod(derived.spellAttack ?? 0)}</p>}
              </>
            ) : <p className="mute">Değerler, sorunlar giderilince görünür.</p>}
            {problems.length > 0 ? (
              <ul className="problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
            ) : <p className="ok">Karakter hazır.</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
