/**
 * Karakter oluşturucu (Adım 13, Görev H): tek uzun form. Skorlar standart dizi veya point buy; geçmiş
 * bonusu her skorda −/+ sayacıyla (+2/+1 ya da +1/+1/+1 kuralına uyanlar açık); sınıf ve geçmiş becerileri;
 * zırh, silah, eşya (her birinin bir satır özeti, ayrıntı üzerine gelince ya da seçilince); büyüler.
 * Sağda (dar ekranda altta) anlamlı bir özet ve sorunlar canlı görünür.
 */
import { useEffect, useMemo, useState } from 'react';
import { armor, classes, getClass, items, races, weapons } from '../data';
import { characterTokenFile, sheetAvatar } from '../battle/avatar';
import { weaponAttackOption } from '../battle/weapons';
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import {
  POINT_BUY_BUDGET, STANDARD_ARRAY, backgroundPattern, canRaiseBonus, characterProblems, pointBuyCost, spellOptions, suggestedScores,
  withSkills, type SavedCharacter,
} from '../rules/builder';
import { averageDamage } from '../rules/crEstimate';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { deriveStats, finalScores, type CharacterSheet, type DerivedStats } from '../rules/stats';
import { classKit, experimentalFrom, gainedFeatures, missingFeatures, subclassLevel, subclassesOf } from '../rules/classFeatures';
import {
  advancementSlots, featById, featMechanic, featOptions, featEffects, originFeats, sheetFeats, type Advancement, type AdvancementSlot,
} from '../rules/advancement';
import { masteryMechanic, masteryOptions, masteryRight, masteryText, masteryWorks, weaponMasteryId } from '../rules/mastery';
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
      case 'feat': return p.feat(x.name ?? '', x.value);
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
  const kit = classKit(s.classId, s.level, s.subclassId);
  const otherMax = 3 + featEffects(sheetFeats(s)).extraSkills;
  const known = [...c.classSkills, ...c.otherSkills];
  const subLevel = subclassLevel(s.classId);
  const expFrom = experimentalFrom(s.classId, s.subclassId);
  /** Seviye değişince üstteki yuvaların seçimleri ve fazla uzmanlık düşer. */
  const setLevel = (level: number) => setC((x) => {
    const nextKit = classKit(x.sheet.classId, level, x.sheet.subclassId);
    const allowed = nextKit.expertise;
    return {
      ...x,
      sheet: {
        ...x.sheet, level,
        spellNames: (x.sheet.spellNames ?? []).filter((n) => spellOptions(x.sheet.classId, level).includes(n)),
        advancements: (x.sheet.advancements ?? []).filter((a) => a.level <= level),
        expertise: (x.sheet.expertise ?? []).slice(0, allowed),
        weaponMasteries: (x.sheet.weaponMasteries ?? []).slice(0, nextKit.weaponMastery?.count ?? 0),
      },
    };
  });
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
                  <select value={s.level} onChange={(e: { target: { value: string } }) => setLevel(Number(e.target.value))}>
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
                        subclassId: undefined, advancements: [], expertise: [], weaponMasteries: [],
                        ...(x.method === 'standard' ? { baseScores: suggestedScores(id) } : {}),
                      },
                    }));
                  }}>
                    {classes.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </label>
                {subLevel !== null && s.level >= subLevel && (
                  <label>{T.subclass}
                    <select value={s.subclassId ?? subclassesOf(s.classId)[0]?.id ?? ''} onChange={(e: { target: { value: string } }) => set({ subclassId: e.target.value })}>
                      {subclassesOf(s.classId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {subLevel !== null && s.level < subLevel && <p className="mute">{T.subclass}: {T.subclassAt(subLevel)}</p>}
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
                      <small>{T.total(total, mod(abilityModifier(total)))}{derived && derived.scores[a] !== total ? ` ${T.withAdvancement(derived.scores[a])}` : ''}</small>
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
                    <input type="checkbox" checked={c.otherSkills.includes(k)} disabled={!c.otherSkills.includes(k) && c.otherSkills.length >= otherMax}
                      onChange={(e: { target: { checked: boolean } }) => setC((x) => ({ ...x, otherSkills: toggle(x.otherSkills, k, e.target.checked) }))} />
                    {SKILLS[k].name}
                  </label>
                ))}
              </div>
              {kit.expertise > 0 && (
                <>
                  <p className="mute">{T.expertise(kit.expertise, (s.expertise ?? []).filter((k) => known.includes(k)).length)}</p>
                  <div className="chips">
                    {known.map((k) => {
                      const on = (s.expertise ?? []).includes(k);
                      return (
                        <label key={k} className={`chip${on ? ' on' : ''}`}>
                          <input type="checkbox" checked={on} disabled={!on && (s.expertise ?? []).length >= kit.expertise}
                            onChange={(e: { target: { checked: boolean } }) => set({ expertise: toggle(s.expertise ?? [], k, e.target.checked) })} />
                          {SKILLS[k].name}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <AdvancementPanel sheet={s} set={set} />

            {kit.weaponMastery && <MasteryPanel sheet={s} set={set} />}

            <FeaturesPanel classId={s.classId} level={s.level} subclassId={s.subclassId} experimentalFrom={expFrom} />

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
                  {(s.weaponMasteries ?? []).length > 0 && <li>{T.sumMastery(masteryLabels(s).join(', '))}</li>}
                  {sheetFeats(s).length > 0 && <li>{T.sumFeats(sheetFeats(s).map((id) => featById(id)?.name ?? id).join(', '))}</li>}
                  {s.level >= expFrom && <li className="warn">{T.experimental(expFrom)}</li>}
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

const ABILITY_OPTIONS = ABILITIES;

/** Köken feat'i ve seviye yuvaları (ASI ya da feat, Fighting Style, Epic Boon). */
function AdvancementPanel(props: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const s = props.sheet;
  const slots = advancementSlots(s.classId, s.level, s.subclassId);
  const ctx = { scores: finalScores({ ...s, advancements: [] }), casterClass: getClass(s.classId).casting !== null };
  const list = s.advancements ?? [];
  const at = (slot: AdvancementSlot) => list.find((a) => a.level === slot.level && (slot.kind === 'style'
    ? featById(a.featId)?.category === 'Fighting Style' : featById(a.featId)?.category !== 'Fighting Style'));
  const put = (slot: AdvancementSlot, next: Advancement | null) => {
    const old = at(slot);
    const rest = list.filter((a) => a !== old);
    props.set({ advancements: next ? [...rest, next].sort((x, y) => x.level - y.level) : rest });
  };
  return (
    <section className="panel">
      <h2>{T.progress}</h2>
      <p className="mute">{T.progressHelp}</p>
      <div className="form-row">
        <label>{T.originFeat}
          <select value={s.originFeat ?? ''} onChange={(e: { target: { value: string } }) => props.set({ originFeat: e.target.value || undefined })}>
            <option value="">{T.noFeat}</option>
            {originFeats().map((f) => <option key={f.id} value={f.id}>{f.name} ({T.featStatus[featMechanic(f.id)?.status ?? 'missing']})</option>)}
          </select>
        </label>
      </div>
      {s.originFeat && <FeatNote id={s.originFeat} />}
      {slots.map((slot) => {
        const a = at(slot);
        const inc = a ? featMechanic(a.featId)?.abilityIncrease : undefined;
        const options = featOptions(slot, ctx);
        return (
          <div key={`${slot.level}:${slot.kind}`} className="advancement">
            <div className="form-row">
              <label>{T.slot[slot.kind](slot.level)}
                <select value={a?.featId ?? ''} onChange={(e: { target: { value: string } }) =>
                  put(slot, e.target.value ? { level: slot.level, featId: e.target.value } : null)}>
                  <option value="">{T.noFeat}</option>
                  {options.map((f) => <option key={f.id} value={f.id}>{f.name} ({T.featStatus[featMechanic(f.id)?.status ?? 'missing']})</option>)}
                </select>
              </label>
              {a && inc && <IncreasePicker advancement={a} kind={inc.kind} amount={inc.amount ?? 1}
                choices={inc.choices ?? ABILITY_OPTIONS} onChange={(abilities) => put(slot, { ...a, abilities })} />}
            </div>
            {a && <FeatNote id={a.featId} />}
          </div>
        );
      })}
    </section>
  );
}

/** Yetenek artışı seçimi: ASI'de bir skora +2 ya da iki skora +1; diğer feat'lerde bir skora +n. */
function IncreasePicker(props: {
  advancement: Advancement; kind: 'asi' | 'one'; amount: number; choices: readonly Ability[]; onChange: (a: Partial<Record<Ability, number>>) => void;
}) {
  const T = t().builder;
  const cur = Object.entries(props.advancement.abilities ?? {}).filter(([, v]) => v) as Array<[Ability, number]>;
  const pick = (value: string, n: number) => (
    <select aria-label={T.chooseAbility} value={value} onChange={(e: { target: { value: string } }) => {
      const ab = e.target.value as Ability;
      if (props.kind === 'one') { props.onChange(ab ? { [ab]: props.amount } : {}); return; }
      const others = cur.filter(([k]) => k !== value);
      const next: Partial<Record<Ability, number>> = {};
      for (const [k, v] of others) next[k] = v;
      if (ab) next[ab] = n;
      props.onChange(next);
    }}>
      <option value="">{T.chooseAbility}</option>
      {props.choices.map((x) => <option key={x} value={x}>{abilityName(x)}</option>)}
    </select>
  );
  if (props.kind === 'one') return <label>{T.increaseTo(props.amount)} {pick(cur[0]?.[0] ?? '', props.amount)}</label>;
  const two = cur.length === 1 && cur[0]?.[1] === 2;
  return (
    <>
      <label>
        <select value={two ? 'two' : 'oneOne'} onChange={(e: { target: { value: string } }) =>
          props.onChange(e.target.value === 'two' && cur[0] ? { [cur[0][0]]: 2 } : cur[0] ? { [cur[0][0]]: 1 } : {})}>
          <option value="two">{T.asiMode.two}</option>
          <option value="oneOne">{T.asiMode.oneOne}</option>
        </select>
      </label>
      {two || cur.length === 0
        ? <label>{T.increaseTo(2)} {pick(cur[0]?.[0] ?? '', 2)}</label>
        : (
          <>
            <label>{T.increaseTo(1)} {pick(cur[0]?.[0] ?? '', 1)}</label>
            <label>{T.increaseTo(1)} {pick(cur[1]?.[0] ?? '', 1)}</label>
          </>
        )}
    </>
  );
}

/** Seçilen ustalıklar: "Longsword (Sap)"; oyunda çalışmayan işaretli. */
function masteryLabels(s: CharacterSheet): string[] {
  const T = t().builder;
  return (s.weaponMasteries ?? []).map((id) => {
    const w = weapons.find((x) => x.id === id);
    const m = weaponMasteryId(id);
    const name = m ? masteryText(m)?.name ?? m : '';
    return `${w?.name ?? id} (${name}${m && !masteryWorks(m) ? `, ${T.masteryNotWorking}` : ''})`;
  });
}

/** Weapon Mastery: ustalığı kullanılacak silahlar (sayı ve kısıt sınıf tablosundan; SRD silah tablosundaki ustalık). */
function MasteryPanel(props: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const s = props.sheet;
  const right = masteryRight(s);
  if (!right) return null;
  const chosen = s.weaponMasteries ?? [];
  const chosenMasteries = [...new Set(chosen.map((id) => weaponMasteryId(id)).filter((m) => m !== undefined))];
  return (
    <section className="panel">
      <h2>{T.masteryTitle(chosen.length, right.count)}</h2>
      <p className="mute">{T.masteryHelp(right.melee, right.swap === 'all' ? null : right.swap)}</p>
      <div className="chips equip-chips">
        {masteryOptions(s).map((w) => {
          const on = chosen.includes(w.id);
          const m = weaponMasteryId(w.id);
          const text = m ? masteryText(m) : undefined;
          const works = !!m && masteryWorks(m);
          return (
            <label key={w.id} className={`chip equip${on ? ' on' : ''}`} title={text ? `${text.name}: ${text.text}` : ''}>
              <input type="checkbox" checked={on} disabled={!on && chosen.length >= right.count}
                onChange={(e: { target: { checked: boolean } }) => props.set({ weaponMasteries: toggle(chosen, w.id, e.target.checked) })} />
              <span><b>{w.name}</b><small>{text?.name ?? m}{works ? '' : ` — ${T.masteryNotWorking}`}</small></span>
            </label>
          );
        })}
      </div>
      {chosenMasteries.length > 0 && (
        <ul className="mute mastery-notes">
          {chosenMasteries.map((m) => {
            const text = masteryText(m);
            const mech = masteryMechanic(m);
            return <li key={m}><b>{text?.name ?? m}</b> ({T.featStatus[mech?.status ?? 'missing']}): {text?.text}{mech?.note ? ` — ${mech.note}` : ''}</li>;
          })}
        </ul>
      )}
    </section>
  );
}

/** Feat'in SRD faydaları (İngilizce SRD metni) ve oyundaki durumu. */
function FeatNote(props: { id: string }) {
  const T = t().builder;
  const f = featById(props.id);
  const m = featMechanic(props.id);
  if (!f) return null;
  // Faydaların adları; adı olmayan feat'te SRD metninin ilk cümlesi.
  const benefits = f.benefits.length > 0 ? f.benefits.map((b) => b.name).join(', ') : (f.text.split(/(?<=\.)\s/)[0] ?? f.text);
  return <p className="mute feat-note"><b>{f.name}</b> ({T.featStatus[m?.status ?? 'missing']}): {benefits}{m?.note ? ` — ${m.note}` : ''}</p>;
}

/** Bu seviyeye dek gelen sınıf ve alt sınıf özellikleri, oyundaki durumlarıyla; deneysel seviye uyarısı. */
function FeaturesPanel(props: { classId: string; level: number; subclassId?: string; experimentalFrom: number }) {
  const T = t().builder;
  const features = gainedFeatures(props.classId, props.level, props.subclassId);
  const missing = missingFeatures(props.classId, props.level, props.subclassId);
  return (
    <section className="panel">
      <h2>{T.features}</h2>
      {props.level >= props.experimentalFrom && <p className="warn">{T.experimental(props.experimentalFrom)}</p>}
      <ul className="feature-list">
        {features.map((f) => (
          <li key={f.key} className={`feature ${f.mechanic?.status ?? 'missing'}`}
            title={f.mechanic?.note ?? ''}>{T.featureLine(f.level, f.name, T.featStatus[f.mechanic?.status ?? 'missing'] ?? '')}</li>
        ))}
      </ul>
      {missing.length > 0 && <p className="mute">{T.missingList(missing.map((f) => f.name).join(', '))}</p>}
    </section>
  );
}
