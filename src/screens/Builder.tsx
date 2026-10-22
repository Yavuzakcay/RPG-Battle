/**
 * Karakter oluşturucu (Adım 13, Görev H): tek uzun form. Skorlar standart dizi veya point buy; geçmiş
 * bonusu her skorda −/+ sayacıyla (+2/+1 ya da +1/+1/+1 kuralına uyanlar açık); sınıf ve geçmiş becerileri;
 * zırh, silah, eşya (her birinin bir satır özeti, ayrıntı üzerine gelince ya da seçilince); büyüler.
 * Sağda (dar ekranda altta) anlamlı bir özet ve sorunlar canlı görünür.
 */
import { useEffect, useMemo, useState } from 'react';
import { armor, classes, getClass, items, races, weapons } from '../data';
import { characterTokenFile, sheetAvatar } from '../battle';
import { weaponAttackOption } from '../battle/weapons';
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import {
  POINT_BUY_BUDGET, STANDARD_ARRAY, backgroundPattern, canRaiseBonus, characterProblems, pointBuyCost, spellOptions, suggestedScores,
  withSkills, type SavedCharacter,
} from '../rules/builder';
import { averageDamage } from '../rules/crEstimate';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { deriveStats, type CharacterSheet, type DerivedStats } from '../rules/stats';
import { AvatarBadge, preloadImages } from '../ui/Avatar';
import { armorDetail, armorSummary, itemDetail, itemSummary, weaponDetail, weaponSummary } from '../ui/equipmentText';
import { MAX_PARTY } from '../app/limits';
import { t } from '../i18n';

/** Yetenek adları (geçerli dilde). */
export const abilityName = (a: Ability): string => t().abilities[a] ?? a;
const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));

function toggle<T>(list: T[], x: T, on: boolean): T[] {
  return on ? (list.includes(x) ? list : [...list, x]) : list.filter((y) => y !== x);
}

/** Özetteki AC bileşenleri: "zırh 14 (Breastplate) + DEX +2 + kalkan 2". */
function acText(d: DerivedStats): string {
  const p = t().builder.acPart;
  return d.acParts.map((x) => {
    switch (x.kind) {
      case 'base': return p.base;
      case 'armor': return p.armor(x.name ?? '', x.value);
      case 'dex': return p.dex(mod(x.value));
      case 'con': return p.con(mod(x.value));
      case 'wis': return p.wis(mod(x.value));
      case 'shield': return p.shield(x.value);
      case 'item': return p.item(x.name ?? '', x.value);
    }
  }).join(' + ');
}

/** Ana saldırı: seçilen silahlardan ortalama hasarı en yüksek olan. */
function mainAttack(sheet: CharacterSheet): string {
  const b = t().builder;
  const options = (sheet.weapons ?? []).flatMap((w) => { try { return [weaponAttackOption(sheet, w.name, w.enchant ?? 0)]; } catch { return []; } });
  if (options.length === 0) return b.sumNoWeapon;
  const best = options.reduce((x, y) => (averageDamage(y.damage) > averageDamage(x.damage) ? y : x));
  return b.sumAttack(best.label, mod(best.attackBonus), `${best.damage} ${t().equip.damageType[best.damageType ?? ''] ?? best.damageType ?? ''}`.trim());
}

export function Builder(props: { initial: SavedCharacter; onSave: (c: SavedCharacter) => void; onCancel: () => void }) {
  const L = t();
  const T = L.builder;
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
  // Sınıf değişince avatar beklemeden açılsın: bu tür ve görünümün bütün sınıf jetonları (küçük kopya) boşta indirilir.
  useEffect(() => {
    preloadImages(classes.map((k) => `characters/kucuk/${characterTokenFile(s.raceId, s.gender, k.id)}`));
  }, [s.raceId, s.gender]);
  const cost = pointBuyCost(s.baseScores);
  const bonuses = s.backgroundBonuses ?? {};
  const pattern = backgroundPattern(bonuses);
  const spellChoices = spellOptions(s.classId, s.level);
  const classSkillList: Skill[] = cls.skillChoices.from === 'any' ? SKILL_IDS : cls.skillChoices.from;
  const chosenArmor = armor.find((a) => a.name === s.armorName);

  const setScore = (a: Ability, v: number) => set({ baseScores: { ...s.baseScores, [a]: v } });
  const setBonus = (a: Ability, v: number) => {
    const next = { ...bonuses };
    if (v === 0) delete next[a]; else next[a] = v;
    set({ backgroundBonuses: next });
  };
  const patternText = pattern === '2-1' ? '+2 / +1' : pattern === '1-1-1' ? '+1 / +1 / +1' : '';
  const raceName = race?.name ?? s.raceId;

  return (
    <div className="menu-screen">
      <main className="app wide builder">
        <header>
          <h1>{props.initial.sheet.name ? T.editing(props.initial.sheet.name) : T.newTitle}</h1>
          <button className="ghost" onClick={props.onCancel}>{L.common.cancel}</button>
          <button disabled={problems.length > 0} onClick={() => props.onSave(final)}>{L.common.save}</button>
        </header>
        <p className="mute party-limit">{T.limitNote(MAX_PARTY)}</p>

        <div className="builder-grid">
          <div className="builder-form">
            <section className="panel">
              <h2>{T.identity}</h2>
              <div className="form-row">
                <label>{T.name} <input value={s.name} maxLength={40} onChange={(e: { target: { value: string } }) => set({ name: e.target.value })} /></label>
                <label>{T.level}
                  <select value={s.level} onChange={(e: { target: { value: string } }) => set({ level: Number(e.target.value), spellNames: (s.spellNames ?? []).filter((n) => spellOptions(s.classId, Number(e.target.value)).includes(n)) })}>
                    {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </label>
                <label>{T.avatar}
                  <select value={s.gender ?? 'erkek'} onChange={(e: { target: { value: string } }) => set({ gender: e.target.value as 'erkek' | 'kadin' })}>
                    <option value="erkek">{T.male}</option><option value="kadin">{T.female}</option>
                  </select>
                </label>
                <AvatarBadge avatar={sheetAvatar(s)} size={48} ring="var(--party)" eager />
              </div>
            </section>

            <section className="panel">
              <h2>{T.raceClass}</h2>
              <div className="form-row">
                <label>{T.race}
                  <select value={s.raceId} onChange={(e: { target: { value: string } }) => {
                    const r = races.find((x) => x.id === e.target.value);
                    set({ raceId: e.target.value, lineageId: r?.lineages?.[0]?.id });
                  }}>
                    {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                {race?.lineages && race.lineages.length > 0 && (
                  <label>{T.lineage}
                    <select value={s.lineageId ?? ''} onChange={(e: { target: { value: string } }) => set({ lineageId: e.target.value })}>
                      {race.lineages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </label>
                )}
                <label>{T.cls}
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
              {race && <p className="mute">{T.raceLine(race.name, race.speed, race.darkvision ?? 0)} {race.traits}</p>}
            </section>

            <section className="panel">
              <h2>{T.abilities}</h2>
              <div className="form-row">
                <label className="toggle"><input type="radio" checked={c.method === 'standard'}
                  onChange={() => setC((x) => ({ ...x, method: 'standard', sheet: { ...x.sheet, baseScores: suggestedScores(x.sheet.classId) } }))} /> {T.standard}</label>
                <label className="toggle"><input type="radio" checked={c.method === 'pointBuy'}
                  onChange={() => setC((x) => ({ ...x, method: 'pointBuy', sheet: { ...x.sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }))} /> {T.pointBuy}</label>
                {c.method === 'pointBuy' && <strong className={cost !== null && cost <= POINT_BUY_BUDGET ? '' : 'error'}>{T.points(cost, POINT_BUY_BUDGET)}</strong>}
              </div>
              <div className="scores">
                {ABILITIES.map((a) => {
                  const bonus = bonuses[a] ?? 0;
                  const total = s.baseScores[a] + bonus;
                  const name = abilityName(a);
                  return (
                    <div className="score" key={a}>
                      <span>{name}</span>
                      {c.method === 'standard' ? (
                        <select aria-label={name} value={s.baseScores[a]} onChange={(e: { target: { value: string } }) => setScore(a, Number(e.target.value))}>
                          {STANDARD_ARRAY.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <span className="stepper">
                          <button aria-label={`${name} ${T.decrease}`} disabled={s.baseScores[a] <= 8} onClick={() => setScore(a, s.baseScores[a] - 1)}>−</button>
                          <b>{s.baseScores[a]}</b>
                          <button aria-label={`${name} ${T.increase}`} disabled={s.baseScores[a] >= 15} onClick={() => setScore(a, s.baseScores[a] + 1)}>+</button>
                        </span>
                      )}
                      {/* Geçmiş bonusu sayacı: yalnızca +2/+1 ya da +1/+1/+1 kuralına uyan adımlar açık. */}
                      <span className="stepper bg-bonus" aria-label={`${name}: ${T.bgTitle}`}>
                        <button aria-label={T.bgRemove(name)} disabled={bonus <= 0} onClick={() => setBonus(a, bonus - 1)}>−</button>
                        <b className={bonus ? 'on' : ''}>{bonus ? `+${bonus}` : '0'}</b>
                        <button aria-label={T.bgAdd(name, bonus + 1)} disabled={!canRaiseBonus(bonuses, a)} onClick={() => setBonus(a, bonus + 1)}>+</button>
                      </span>
                      <small>{T.total(total, mod(abilityModifier(total)))}</small>
                    </div>
                  );
                })}
              </div>
              <p className={pattern === 'invalid' ? 'error' : 'mute'}>
                <b>{T.bgTitle}:</b> {pattern === '2-1' || pattern === '1-1-1' ? T.bgDone(patternText) : T.bgHelp}
              </p>
            </section>

            <section className="panel">
              <h2>{T.skills}</h2>
              <p className="mute">{T.classSkills(cls.skillChoices.count, c.classSkills.length)}</p>
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
              <p className="mute">{T.otherSkills}</p>
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
              <h2>{T.equipment}</h2>
              <div className="form-row">
                <label>{T.armor}
                  <select value={s.armorName} onChange={(e: { target: { value: string } }) => set({ armorName: e.target.value })}>
                    {armor.map((a) => <option key={a.name} value={a.name}>{a.name === 'Zırhsız' ? L.equip.none : a.name} — {armorSummary(a)}</option>)}
                  </select>
                </label>
                <label className="toggle" title={L.equip.shieldDetail}><input type="checkbox" checked={s.shield} onChange={(e: { target: { checked: boolean } }) => set({ shield: e.target.checked })} /> {T.shield} <small>({L.equip.shield})</small></label>
              </div>
              {chosenArmor && <p className="mute equip-detail">{armorDetail(chosenArmor)}{s.shield ? ` ${L.equip.shieldDetail}` : ''}</p>}
              <p className="mute">{T.weapons}:</p>
              <div className="chips equip-chips">
                {weapons.map((w) => {
                  const on = (s.weapons ?? []).some((x) => x.name === w.name);
                  return (
                    <label key={w.name} className={`chip equip${on ? ' on' : ''}`} title={weaponDetail(w)}>
                      <input type="checkbox" checked={on} onChange={(e: { target: { checked: boolean } }) =>
                        set({ weapons: e.target.checked ? [...(s.weapons ?? []), { name: w.name }] : (s.weapons ?? []).filter((x) => x.name !== w.name) })} />
                      <span><b>{w.name}</b><small>{weaponSummary(w)}</small></span>
                    </label>
                  );
                })}
              </div>
              <p className="mute">{T.items}:</p>
              <div className="chips equip-chips">
                {items.map((it) => (
                  <label key={it.name} className={`chip equip${s.itemNames.includes(it.name) ? ' on' : ''}`} title={itemDetail(it)}>
                    <input type="checkbox" checked={s.itemNames.includes(it.name)}
                      onChange={(e: { target: { checked: boolean } }) => set({ itemNames: toggle(s.itemNames, it.name, e.target.checked) })} />
                    <span><b>{it.name}</b><small>{itemSummary(it)}</small></span>
                  </label>
                ))}
              </div>
              {/* Dokunmatikte üzerine gelme yok: seçilenlerin ayrıntısı burada. */}
              {((s.weapons ?? []).length > 0 || s.itemNames.length > 0) && (
                <div className="equip-selected">
                  <p className="mute">{T.selectedDetails}</p>
                  <ul>
                    {(s.weapons ?? []).map((x) => weapons.find((w) => w.name === x.name)).filter((w) => w !== undefined).map((w) => <li key={w.name}>{weaponDetail(w)}</li>)}
                    {s.itemNames.map((n) => items.find((i) => i.name === n)).filter((i) => i !== undefined).map((i) => <li key={i.name}>{itemDetail(i)}</li>)}
                  </ul>
                </div>
              )}
            </section>

            {spellChoices.length > 0 && (
              <section className="panel">
                <h2>{T.spells((s.spellNames ?? []).length)}</h2>
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

          <aside className="panel builder-summary" aria-label={T.summary}>
            <h2>{T.summary}</h2>
            {derived ? (
              <>
                <ul className="summary-points">
                  <li><b>{T.sumIntro(s.name, raceName, cls.name, s.level)}</b></li>
                  <li>{T.sumHp(derived.maxHp, cls.hitDie)} {T.sumSpeed(derived.speed, derived.proficiency, mod(derived.initiative))}</li>
                  <li>{T.sumAc(derived.ac, acText(derived))}{chosenArmor?.stealthDisadvantage ? ` ${T.sumStealth}` : ''}{derived.armorStrengthShort ? ` ${T.sumStrength(derived.armorStrengthShort)}` : ''}</li>
                  <li>{mainAttack(final.sheet)}</li>
                  {derived.spellSaveDc !== null && (s.spellNames ?? []).length > 0 && (
                    <li>{T.sumSpells((s.spellNames ?? []).slice(0, 5).join(', ') + ((s.spellNames ?? []).length > 5 ? '…' : ''), derived.spellSaveDc, mod(derived.spellAttack ?? 0))}</li>
                  )}
                  <li>{pattern === '2-1' || pattern === '1-1-1'
                    ? T.sumBackground(ABILITIES.filter((a) => bonuses[a]).map((a) => `${a.toUpperCase()} +${bonuses[a]}`).join(', '),
                      c.otherSkills.map((k) => SKILLS[k].name).join(', ') || '—')
                    : T.sumNoBackground}</li>
                </ul>
                <p><b>{T.sumScores}:</b> {ABILITIES.map((a) => `${a.toUpperCase()} ${derived.scores[a]} (${mod(derived.modifiers[a])})`).join(' · ')}</p>
                <p><b>{T.sumSaves}:</b> {ABILITIES.map((a) => `${a.toUpperCase()} ${mod(derived.saves[a])}`).join(' · ')}</p>
                <p><b>{T.sumSkills}:</b> {Object.entries(derived.skills).map(([k, v]) => `${SKILLS[k as Skill].name} ${mod(v as number)}`).join(', ') || '—'}</p>
                {derived.spellSaveDc !== null && <p>{T.sumSpellDc(derived.spellSaveDc, mod(derived.spellAttack ?? 0))}</p>}
              </>
            ) : <p className="mute">{T.fixFirst}</p>}
            {problems.length > 0 ? (
              <ul className="problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
            ) : <p className="ok">{T.ready}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
