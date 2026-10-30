/**
 * Karakter oluşturucu (Adım 13, Görev H): tek uzun form. Skorlar standart dizi veya point buy; geçmiş
 * bonusu her skorda −/+ sayacıyla (+2/+1 ya da +1/+1/+1 kuralına uyanlar açık); sınıf ve geçmiş becerileri;
 * zırh, silah, eşya (her birinin bir satır özeti, ayrıntı üzerine gelince ya da seçilince); büyüler.
 * Sağda (dar ekranda altta) anlamlı bir özet ve sorunlar canlı görünür.
 */
import { useEffect, useMemo, useState } from 'react';
import { armor, classDataLoaded, classes, getClass, items, races, spells, weapons } from '../data';
import { characterTokenFile, sheetAvatar } from '../battle/avatar';
import { offHandAttackOption, weaponAttackOption } from '../battle/weapons';
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import {
  POINT_BUY_BUDGET, STANDARD_ARRAY, alternativeCantrips, backgroundPattern, canRaiseBonus, characterIssues, pointBuyCost, spellCounts, spellLimits, spellOptions, suggestedScores,
  withSkills, type BuilderStep, type SavedCharacter,
} from '../rules/builder';
import { averageDamage } from '../rules/crEstimate';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { classSpellList, type ClassSpell } from '../rules/spellList';
import { carryLoad, type CarryLoad, type CarryRule } from '../rules/carry';
import { storedCarryRule } from '../ui/carrySetting';
import { MAX_ATTUNED, armorProficient, deriveStats, finalScores, type CharacterSheet, type DerivedStats } from '../rules/stats';
import { classKit, experimentalFrom, gainedFeatures, missingFeatures, subclassLevel, subclassesOf } from '../rules/classFeatures';
import { subclassLabel, subclassMissing } from '../rules/subclasses';
import {
  ASI_FEAT, advancementSlots, asiCanRaise, asiPointsLeft, asiStep, scoresBeforeSlot, featById, featMechanic, featOptions, featEffects, featProblem, isStyleChoice, slotAlternativeById,
  originFeats, sheetFeats, type Advancement, type AdvancementSlot, type Scores,
} from '../rules/advancement';
import { offHandOptionProblem, offHandProblem } from '../rules/hands';
import { masteryOptions, masteryRight, masteryText, masteryWorks, weaponMasteryId, weaponProficient } from '../rules/mastery';
import { AvatarBadge, preloadImages } from '../ui/Avatar';
import { abilityTip, lineageAbilityList, lineageLine } from '../ui/lineageText';
import { lineageOf, lineageSummary, raceDarkvision, raceSpeed, type LineageAbility } from '../rules/lineage';
import { armorDetail, armorSummary, itemDetail, itemSummary, weaponDetail, weaponSummary } from '../ui/equipmentText';
import { getLang, t } from '../i18n';

/** Yetenek adları (geçerli dilde). */
export const abilityName = (a: Ability): string => t().abilities[a] ?? a;
const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));
/** Görev K4: beceri adı (geçerli dilde; İngilizce SRD adı `SKILLS`). */
const skillName = (k: Skill): string => t().skillNames[k] ?? SKILLS[k].name;

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
  const offHand = offHandAttackOption(sheet);
  const best = options.reduce((x, y) => (averageDamage(y.damage) > averageDamage(x.damage) ? y : x));
  return b.sumAttack(best.twoHands ? `${best.label} ${b.twoHanded}` : best.label, mod(best.attackBonus),
    `${best.damage} ${t().equip.damageType[best.damageType ?? ''] ?? best.damageType ?? ''}`.trim())
    + (offHand ? ` ${b.sumOffHand(offHand.label.replace(/ \(.*\)$/, ''), offHand.damage)}` : '');
}

/** Sihirbazın adımları (Görev K1, K3: kimlik + tür + sınıf tek "Karakter" adımı); büyü adımı yalnızca büyü seçebilen karakterde. */
export function wizardSteps(sheet: CharacterSheet): BuilderStep[] {
  const caster = getClass(sheet.classId).casting !== null || alternativeCantrips(sheet).options.length > 0
    || spellOptions(sheet.classId, sheet.level).length > 0;
  const all: BuilderStep[] = ['character', 'scores', 'skills', 'progress', 'equipment', 'spells', 'summary'];
  return caster ? all : all.filter((x) => x !== 'spells');
}

/**
 * Kayıt açılırken (Görev K1): sınıfta bulunmayan alt sınıf boşa çevrilir (dolgu ya da başka sınıfın alt sınıfı);
 * döner: temizlenen kimlik (bir kerelik not için) ya da null.
 */
export function clearInvalidSubclass(c: SavedCharacter): { character: SavedCharacter; cleared: string | null } {
  const id = c.sheet.subclassId;
  if (!id || !classDataLoaded() || subclassesOf(c.sheet.classId).some((x) => x.id === id)) return { character: c, cleared: null };
  return { character: { ...c, sheet: { ...c.sheet, subclassId: undefined } }, cleared: id };
}

/**
 * Karakter oluşturucu (Görev K1): 9 adımlı sihirbaz (kimlik, ırk, sınıf, puanlar, beceriler, ilerleme, donanım, büyüler,
 * özet). Karakter verisi ve kurallar aynı; sorunlar adımlara bağlı (`characterIssues`), eksik "Devam"ı engellemez,
 * yalnızca "Kaydet"i. Masaüstünde sağda özet paneli ve üstte adım çubuğu; mobilde üst başlık, ilerleme çubuğu ve alt
 * özet çubuğu. `step` (testler) başlangıç adımı.
 */
export function Builder(props: { initial: SavedCharacter; onSave: (c: SavedCharacter) => void; onCancel: () => void; step?: BuilderStep }) {
  const L = t();
  const T = L.builder;
  const W = T.wiz;
  const [boot] = useState(() => clearInvalidSubclass(props.initial));
  const [c, setC] = useState<SavedCharacter>(boot.character);
  const s = c.sheet;
  const set = (patch: Partial<CharacterSheet>) => setC((x) => ({ ...x, sheet: { ...x.sheet, ...patch } }));
  const race = races.find((r) => r.id === s.raceId);
  const cls = getClass(s.classId);
  const final = withSkills(c);
  // Görev K5: taşıma kuralı (Ayarlar); SRD sınırında aşan karakter eksik.
  const carryRule = useMemo(() => storedCarryRule(), []);
  const issues = characterIssues(final, { carryRule });
  const problems = issues.map((x) => x.text);
  const derived = useMemo(() => {
    try { return deriveStats(final.sheet); } catch { return null; }
  }, [final.sheet]);
  const steps = wizardSteps(s);
  const [stepId, setStepId] = useState<BuilderStep>(props.step ?? 'character');
  const current = steps.includes(stepId) ? stepId : 'summary';
  const index = steps.indexOf(current);
  const [visited, setVisited] = useState<Set<BuilderStep>>(() => new Set([props.step ?? 'character']));
  const [missingOpen, setMissingOpen] = useState(false);
  const go = (id: BuilderStep) => { setStepId(id); setVisited((v) => new Set([...v, id])); setMissingOpen(false); };
  const issuesOf = (id: BuilderStep) => issues.filter((x) => x.step === id);
  // Sınıf değişince avatar beklemeden açılsın: bu tür ve görünümün bütün sınıf jetonları (küçük kopya) boşta indirilir.
  useEffect(() => {
    preloadImages(classes.map((k) => `characters/kucuk/${characterTokenFile(s.raceId, s.gender, k.id)}`));
  }, [s.raceId, s.gender]);
  const raceName = `${race?.name ?? s.raceId}${lineageOf(s) ? ` (${lineageOf(s)?.name})` : ''}`;
  const stepLabel = (id: BuilderStep) => W.steps[id] ?? id;

  const bar = (
    <nav className="wiz-steps" aria-label={W.title}>
      {steps.map((id, i) => {
        const bad = issuesOf(id).length > 0 && visited.has(id) && id !== current;
        const done = visited.has(id) && !bad && id !== current;
        return (
          <button key={id} className={`wiz-step${id === current ? ' current' : ''}${done ? ' done' : ''}${bad ? ' bad' : ''}`}
            aria-current={id === current ? 'step' : undefined} onClick={() => go(id)}>
            <span className="wiz-num">{bad ? '!' : done ? '✓' : i + 1}</span><span className="wiz-label">{stepLabel(id)}</span>
          </button>
        );
      })}
    </nav>
  );
  const missingList = (
    <ul className="wiz-missing">
      {issues.map((x) => (
        <li key={`${x.step}:${x.text}`}><button className="danger" title={W.goTo(stepLabel(x.step))} onClick={() => go(x.step)}>{stepLabel(x.step)}: {x.text}</button></li>
      ))}
    </ul>
  );

  return (
    <div className="menu-screen">
      <main className="app wide builder wizard">
        <header className="wiz-head">
          <button className="ghost wiz-back" aria-label={L.common.cancel} onClick={props.onCancel}>‹</button>
          <h1>{props.initial.sheet.name ? T.editing(props.initial.sheet.name) : W.title}</h1>
          <span className="wiz-count">{W.stepOf(index + 1, steps.length, stepLabel(current))}</span>
          <button className="ghost wiz-cancel" onClick={props.onCancel}>{L.common.cancel}</button>
        </header>
        <div className="wiz-progress" aria-hidden="true">{steps.map((id, i) => <span key={id} className={i <= index ? 'on' : ''} />)}</div>
        {bar}
        {boot.cleared && <p className="mute wiz-note">{W.subclassCleared(boot.cleared)}</p>}
        <div className="wiz-grid">
          <section className="panel wiz-card">
            <h2>{stepLabel(current)}</h2>
            {current === 'character' && <CharacterStep c={c} setC={setC} set={set} />}
            {current === 'scores' && <ScoresStep c={c} setC={setC} set={set} />}
            {current === 'skills' && <SkillsStep c={c} setC={setC} set={set} />}
            {current === 'progress' && <ProgressStep sheet={s} set={set} />}
            {current === 'equipment' && <EquipmentStep sheet={s} set={set} carryRule={carryRule} />}
            {current === 'spells' && <SpellsStep sheet={s} set={set} />}
            {current === 'summary' && (
              <div className="wiz-summary-step">
                <SummaryBody final={final} derived={derived} raceName={raceName} />
                <h3>{W.missingTitle}</h3>
                {issues.length > 0 ? <>{missingList}<p className="mute">{W.summaryHint}</p></> : <p className="ok">{T.ready}</p>}
              </div>
            )}
            {issuesOf(current).length > 0 && current !== 'summary' && (
              <ul className="problems wiz-step-problems">{issuesOf(current).map((x) => <li key={x.text}>{x.text}</li>)}</ul>
            )}
            <div className="wiz-nav">
              <button className="ghost" disabled={index === 0} onClick={() => go(steps[index - 1] as BuilderStep)}>{W.back}</button>
              {current !== 'summary'
                ? <button className="cta" onClick={() => go(steps[index + 1] as BuilderStep)}>{W.next}</button>
                : <button className="cta" disabled={problems.length > 0} onClick={() => props.onSave(final)}>{W.save}</button>}
            </div>
          </section>
          <aside className="panel builder-summary wiz-side" aria-label={T.summary}>
            {current === 'character' && <TokenPreview sheet={s} size={200} className="wiz-preview-side" />}
            <h2>{T.summary}</h2>
            <SidePanel final={final} derived={derived} raceName={raceName} />
            <h3>{W.missingTitle}</h3>
            {issues.length > 0 ? missingList : <p className="ok">{W.noMissing}</p>}
          </aside>
        </div>
        <footer className="wiz-mobile-sum">
          <span><b>{s.name || '—'}</b> · {`${s.level}. ${cls.name}`}</span>
          {derived && <span>{W.sumHp} {derived.maxHp} · {W.sumAc} {derived.ac}</span>}
          {issues.length > 0
            ? <button className="danger" aria-expanded={missingOpen} onClick={() => setMissingOpen((o) => !o)}>{W.missing(issues.length)}</button>
            : <span className="ok">✓</span>}
          {missingOpen && <div className="wiz-mobile-missing">{missingList}</div>}
        </footer>
      </main>
    </div>
  );
}

type StepProps = { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void; set: (patch: Partial<CharacterSheet>) => void };

/**
 * Jeton önizlemesi (Görev K3): jeton tür, görünüm ve sınıftan (`characterTokenFile`); değişince anında yenilenir.
 * Görsel yoksa tür renkli rozet. Altında ad, tür (soy) ve sınıf.
 */
function TokenPreview(props: { sheet: CharacterSheet; size: number; className: string }) {
  const W = t().builder.wiz;
  const s = props.sheet;
  const avatar = sheetAvatar(s);
  const race = races.find((r) => r.id === s.raceId);
  const l = lineageOf(s);
  return (
    <figure className={`token-preview ${props.className}`} aria-label={W.preview}>
      <AvatarBadge key={avatar.src} avatar={avatar} size={props.size} ring="var(--party)" eager />
      <figcaption><b>{s.name || '—'}</b><small>{race?.name ?? s.raceId}{l ? ` · ${l.name}` : ''} · {getClass(s.classId).name} {s.level}</small></figcaption>
    </figure>
  );
}

/**
 * 1. Karakter (Görev K3): kimlik (ad, seviye, görünüm), tür kartları ve soy kartları, sınıf kartları, alt sınıf ve
 * özellikler. Mobilde üstte küçük yapışkan jeton önizlemesi (masaüstünde sağ panelde büyük).
 */
function CharacterStep(props: StepProps) {
  const W = t().builder.wiz;
  return (
    <div className="wiz-character">
      <TokenPreview sheet={props.c.sheet} size={64} className="wiz-preview-mobile" />
      <h3>{W.identityTitle}</h3>
      <IdentityStep {...props} />
      <h3>{W.raceTitle}</h3>
      <RaceStep sheet={props.c.sheet} set={props.set} />
      <h3>{W.classTitle}</h3>
      <ClassStep {...props} />
    </div>
  );
}

/** Kimlik: ad, seviye, görünüm. Seviye değişince üstteki seçimler düşer. */
function IdentityStep({ c, setC, set }: StepProps) {
  const T = t().builder;
  const s = c.sheet;
  const setLevel = (level: number) => setC((x) => {
    const nextKit = classKit(x.sheet.classId, level, x.sheet.subclassId);
    return {
      ...x,
      // Seviye düşünce ek sınıf becerisi (Primal Knowledge) de düşer.
      classSkills: x.classSkills.slice(0, getClass(x.sheet.classId).skillChoices.count + nextKit.extraClassSkills),
      sheet: {
        ...x.sheet, level,
        // Görev K6: seviye düşünce fazla büyüler ayıklanmaz; Özet'te eksik olarak görünür.
        advancements: (x.sheet.advancements ?? []).filter((a) => a.level <= level),
        expertise: (x.sheet.expertise ?? []).slice(0, nextKit.expertise),
        weaponMasteries: (x.sheet.weaponMasteries ?? []).slice(0, nextKit.weaponMastery?.count ?? 0),
      },
    };
  });
  return (
    <div className="form-row wiz-identity">
      <label>{T.name} <input value={s.name} maxLength={40} onChange={(e: { target: { value: string } }) => set({ name: e.target.value })} /></label>
      <label>{T.level}
        <select value={s.level} onChange={(e: { target: { value: string } }) => setLevel(Number(e.target.value))}>
          {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </select>
      </label>
      <span className="seg" role="radiogroup" aria-label={T.avatar}>
        {(['erkek', 'kadin'] as const).map((g) => (
          <button key={g} role="radio" aria-checked={(s.gender ?? 'erkek') === g} className={(s.gender ?? 'erkek') === g ? 'on' : ''}
            onClick={() => set({ gender: g })}>{g === 'erkek' ? T.male : T.female}</button>
        ))}
      </span>
      {s.level >= experimentalFrom(s.classId, s.subclassId) && <p className="warn">{T.experimental(experimentalFrom(s.classId, s.subclassId))}</p>}
    </div>
  );
}

/** Tür: kart ızgarası, soy kartları (Görev K3) ve seçilen türün kısa özellik kartı. */
function RaceStep({ sheet: s, set }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const W = T.wiz;
  const race = races.find((r) => r.id === s.raceId);
  const lineage = lineageOf(s);
  const abilities = lineageAbilityList(s);
  return (
    <>
      <p className="mute race-note">{W.raceBonusNote}</p>
      <div className="card-grid">
        {races.map((r) => (
          <button key={r.id} className={`pick-card${r.id === s.raceId ? ' on' : ''}`} aria-pressed={r.id === s.raceId}
            onClick={() => set({ raceId: r.id, lineageId: r.lineages?.[0]?.id })}>
            <b>{r.name}</b><small>{W.speed(r.speed)}{r.darkvision ? ` · ${W.darkvision(r.darkvision)}` : ''}</small>
          </button>
        ))}
      </div>
      {race?.lineages && race.lineages.length > 0 && (
        <>
          <h4 className="lineage-title">{W.lineageTitle}</h4>
          {/* Görev K3: soy seçimi kartlarla (masaüstünde yan yana, mobilde alt alta); kartta yalnızca bu seçeneği ayıran özet. */}
          <div className="card-grid lineage-grid" role="radiogroup" aria-label={W.lineageTitle}>
            {race.lineages.map((l) => (
              <button key={l.id} role="radio" aria-checked={l.id === lineage?.id} className={`pick-card lineage-card${l.id === lineage?.id ? ' on' : ''}`}
                onClick={() => set({ lineageId: l.id })}>
                <b>{l.name}</b><small>{lineageSummary(l, getLang())}</small>
              </button>
            ))}
          </div>
        </>
      )}
      {race && (
        <div className="info-card">
          <h3>{W.raceTraits}: {race.name}</h3>
          <p>{W.speed(raceSpeed(s))}{raceDarkvision(s) ? ` · ${W.darkvision(raceDarkvision(s))}` : ''}{race.resistances?.length || lineage?.resistances.length
            ? ` · ${W.resist([...new Set([...race.resistances, ...(lineage?.resistances ?? [])])].join(', '))}` : ''}</p>
          <p className="mute">{race.traits}</p>
          {abilities.length > 0 && <LineageAbilities list={abilities} />}
        </div>
      )}
    </>
  );
}

/** Soyun verdiği yetenekler ("Drow: Faerie Fire"); oyunda olmayan ya da kısmi olanda ⓘ ipucu (Görev K3). */
function LineageAbilities(props: { list: LineageAbility[] }) {
  const W = t().builder.wiz;
  return (
    <p className="lineage-abilities"><b>{W.lineageAbilities}:</b>{' '}
      {props.list.map((a, i) => {
        const tip = abilityTip(a);
        return <span key={a.label}>{i > 0 ? ' · ' : ''}{a.label}{tip ? <InfoTip text={tip} /> : null}</span>;
      })}
    </p>
  );
}

/** Sınıf: 12 kart, özet satırı, alt sınıf (veride yoksa "Yakında"). */
function ClassStep({ c, setC, set }: StepProps) {
  const T = t().builder;
  const W = T.wiz;
  const s = c.sheet;
  const cls = getClass(s.classId);
  const subLevel = subclassLevel(s.classId);
  const subs = subclassesOf(s.classId);
  const choose = (id: string) => setC((x) => ({
    ...x, classSkills: [],
    sheet: {
      ...x.sheet, classId: id,
      subclassId: undefined, advancements: [], expertise: [], weaponMasteries: [],
      ...(x.method === 'standard' ? { baseScores: suggestedScores(id) } : {}),
    },
  }));
  return (
    <>
      <div className="card-grid">
        {classes.map((k) => (
          <button key={k.id} className={`pick-card${k.id === s.classId ? ' on' : ''}`} aria-pressed={k.id === s.classId} onClick={() => choose(k.id)}>
            <b>{k.name}</b><small>{t().builder.wiz.hitDie(k.hitDie)}</small>
          </button>
        ))}
      </div>
      <p className="info-card">
        {W.hitDie(cls.hitDie)} · {W.saves(cls.saves.map((a) => a.toUpperCase()).join(', '))} · {cls.casting ? W.castAbility(cls.casting.ability.toUpperCase()) : W.noCasting}
        {subLevel !== null ? ` · ${W.subclassAtLevel(subLevel)}` : ''}
      </p>
      {subLevel !== null && subs.length === 0 && (
        <div className="coming-soon"><b>{W.comingSoon}</b><p>{W.comingSoonText}</p></div>
      )}
      {subLevel !== null && subs.length > 0 && s.level >= subLevel && (
        <label>{T.subclass}
          <select value={s.subclassId ?? ''} onChange={(e: { target: { value: string } }) => set({ subclassId: e.target.value || undefined })}>
            <option value="">{T.subclassNone}</option>
            {subs.map((x) => <option key={x.id} value={x.id}>{subclassLabel(x.name, getLang())}{x.pack ? ` (${T.subclassExternal})` : ''}</option>)}
            {subclassMissing(s.classId, s.subclassId) && <option value={s.subclassId}>{T.subclassMissing(s.subclassId ?? '')}</option>}
          </select>
        </label>
      )}
      {subLevel !== null && subs.length > 0 && s.level < subLevel && <p className="mute">{T.subclass}: {T.subclassAt(subLevel)}</p>}
      <FeaturesPanel classId={s.classId} level={s.level} subclassId={s.subclassId} experimentalFrom={experimentalFrom(s.classId, s.subclassId)}
        choices={s.featureChoices ?? {}} onChoose={(key, value) => set({ featureChoices: { ...(s.featureChoices ?? {}), [key]: value } })} />
    </>
  );
}

/**
 * Yetenek puanları (Görev K4): yalnızca temel puanlar ve geçmiş bonusu (seviye artışları İlerleme adımında). Standart
 * dizide değer atama: kutuya dokun, sonra altı değer çipinden birini seç; başka kutuda kullanılan değer soluk, seçilirse
 * iki kutu yer değiştirir. Puan satın almada −/+ ve kalan puan çubuğu. Geçmiş bonusu tek satır.
 */
function ScoresStep({ c, setC, set }: StepProps) {
  const T = t().builder;
  const W = T.wiz;
  const s = c.sheet;
  const bonuses = s.backgroundBonuses ?? {};
  const pattern = backgroundPattern(bonuses);
  const cost = pointBuyCost(s.baseScores);
  const [pick, setPick] = useState<Ability>('str');
  const setScore = (a: Ability, v: number) => {
    // Standart dizi: bir değer yalnızca bir kutuda; seçilen değer başka kutudaysa ikisi yer değiştirir.
    if (c.method === 'standard') {
      const other = ABILITIES.find((b) => b !== a && s.baseScores[b] === v);
      set({ baseScores: { ...s.baseScores, [a]: v, ...(other ? { [other]: s.baseScores[a] } : {}) } });
    } else set({ baseScores: { ...s.baseScores, [a]: v } });
  };
  const setBonus = (a: Ability, v: number) => {
    const next = { ...bonuses };
    if (v === 0) delete next[a]; else next[a] = v;
    set({ backgroundBonuses: next });
  };
  const patternText = pattern === '2-1' ? '+2 / +1' : pattern === '1-1-1' ? '+1 / +1 / +1' : '';
  const raiseCost = (a: Ability) => pointBuyCost({ ...s.baseScores, [a]: s.baseScores[a] + 1 });
  return (
    <>
      <div className="seg" role="radiogroup" aria-label={W.method}>
        <button role="radio" aria-checked={c.method === 'standard'} className={c.method === 'standard' ? 'on' : ''}
          onClick={() => setC((x) => ({ ...x, method: 'standard', sheet: { ...x.sheet, baseScores: suggestedScores(x.sheet.classId) } }))}>{T.standard}</button>
        <button role="radio" aria-checked={c.method === 'pointBuy'} className={c.method === 'pointBuy' ? 'on' : ''}
          onClick={() => setC((x) => ({ ...x, method: 'pointBuy', sheet: { ...x.sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }))}>{T.pointBuy}</button>
      </div>
      {c.method === 'pointBuy' && (
        <div className="points-bar">
          <span className={cost !== null && cost <= POINT_BUY_BUDGET ? '' : 'error'}>{W.pointsLeft(POINT_BUY_BUDGET - (cost ?? POINT_BUY_BUDGET), POINT_BUY_BUDGET)}</span>
          <span className="meter"><span style={{ width: `${Math.min(100, ((cost ?? 0) / POINT_BUY_BUDGET) * 100)}%` }} /></span>
        </div>
      )}
      {c.method === 'standard' && (
        <div className="array-chips" role="group" aria-label={W.arrayTitle(abilityName(pick))}>
          <span className="mute">{W.arrayTitle(abilityName(pick))}</span>
          {STANDARD_ARRAY.map((v) => {
            const holder = ABILITIES.find((b) => s.baseScores[b] === v);
            const mine = holder === pick;
            return (
              <button key={v} className={`value-chip${mine ? ' on' : ''}${holder && !mine ? ' used' : ''}`} aria-pressed={mine}
                aria-label={W.arrayValue(v, holder ? abilityName(holder) : null)} onClick={() => setScore(pick, v)}>
                <b>{v}</b>{holder && !mine ? <small>{holder.toUpperCase()}</small> : null}
              </button>
            );
          })}
        </div>
      )}
      <div className="score-row">
        {ABILITIES.map((a) => {
          const bonus = bonuses[a] ?? 0;
          const total = s.baseScores[a] + bonus;
          const name = abilityName(a);
          const body = (
            <>
              <span className="score-name">{name}</span>
              <b className="score-total">{total}</b>
              <span className="score-mod">{mod(abilityModifier(total))}</span>
              <small>{W.baseBonus(s.baseScores[a], bonus)}</small>
            </>
          );
          return c.method === 'standard' ? (
            <button type="button" className={`score-box pickable${pick === a ? ' picking' : ''}`} key={a} aria-pressed={pick === a}
              aria-label={W.pickBox(name, s.baseScores[a])} onClick={() => setPick(a)}>{body}</button>
          ) : (
            <div className="score-box" key={a}>
              {body}
              <span className="stepper">
                <button aria-label={`${name} ${T.decrease}`} disabled={s.baseScores[a] <= 8} onClick={() => setScore(a, s.baseScores[a] - 1)}>−</button>
                <b>{s.baseScores[a]}</b>
                <button aria-label={`${name} ${T.increase}`} disabled={s.baseScores[a] >= 15 || (raiseCost(a) ?? POINT_BUY_BUDGET + 1) > POINT_BUY_BUDGET}
                  onClick={() => setScore(a, s.baseScores[a] + 1)}>+</button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="bonus-box bg-line">
        <p className={pattern === 'invalid' ? 'error' : 'mute'}>
          <b>{T.bgTitle}:</b> {pattern === '2-1' || pattern === '1-1-1' ? T.bgDone(patternText) : T.bgHelp}
        </p>
        <div className="bonus-grid">
          {ABILITIES.map((a) => {
            const bonus = bonuses[a] ?? 0;
            const name = abilityName(a);
            return (
              <span key={a} className="stepper bg-bonus" aria-label={`${name}: ${T.bgTitle}`}>
                <small className="step-tag">{a.toUpperCase()}</small>
                <button aria-label={T.bgRemove(name)} disabled={bonus <= 0} onClick={() => setBonus(a, bonus - 1)}>−</button>
                <b className={bonus ? 'on' : ''}>{bonus ? `+${bonus}` : '0'}</b>
                <button aria-label={T.bgAdd(name, bonus + 1)} disabled={!canRaiseBonus(bonuses, a)} onClick={() => setBonus(a, bonus + 1)}>+</button>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**
 * Görev K4: bir ASI yuvasının kartı: altı yetenek için +/−, kalan puan (2 puan: bir skora +2 ya da iki skora +1; skor 20'yi
 * geçmez). Önceki yuvaların artışları ve geçmiş bonusu "önce" skorunda.
 */
function AsiSlotCard(props: { sheet: CharacterSheet; slot: AdvancementSlot; advancement: Advancement | undefined; onChange: (a: Advancement) => void }) {
  const T = t().builder;
  const s = props.sheet;
  const a = props.advancement;
  const created = Object.fromEntries(ABILITIES.map((ab) => [ab, Math.min(20, s.baseScores[ab] + (s.backgroundBonuses?.[ab] ?? 0))])) as Scores;
  const before = scoresBeforeSlot(created, s.advancements, props.slot.level);
  const left = asiPointsLeft(a);
  const step = (ab: Ability, d: 1 | -1) => {
    const next = asiStep(before, props.slot.level, a, ab, d);
    props.onChange(next ?? { level: props.slot.level, featId: ASI_FEAT, abilities: {} });
  };
  return (
    <div className="asi-card">
      <p className="asi-head"><strong className={left > 0 ? 'asi-left' : 'ok'}>{T.asiSlotLeft(left)}</strong> <small className="mute">{T.asiRule}</small></p>
      <div className="asi-grid">
        {ABILITIES.map((ab) => {
          const n = a?.abilities?.[ab] ?? 0;
          const name = abilityName(ab);
          return (
            <div key={ab} className={`asi-cell${n ? ' on' : ''}`}>
              <small>{ab.toUpperCase()}</small>
              <span className="stepper">
                <button aria-label={T.asiRemove(name, props.slot.level)} disabled={n <= 0} onClick={() => step(ab, -1)}>−</button>
                <b>{n ? `+${n}` : '0'}</b>
                <button aria-label={T.asiAdd(name, props.slot.level)} disabled={!asiCanRaise(before, a, ab)} onClick={() => step(ab, 1)}>+</button>
              </span>
              <small className="asi-scores">{before[ab]}{n ? <> → <b className="asi-final">{Math.min(20, before[ab] + n)}</b></> : null}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 5. Beceriler: tek liste (18), sınıf ve geçmiş rozetleri, uzmanlık; geçmişten gelen sınıfta yeniden seçilemez. */
function SkillsStep({ c, setC, set }: StepProps) {
  const W = t().builder.wiz;
  const s = c.sheet;
  const cls = getClass(s.classId);
  const kit = classKit(s.classId, s.level, s.subclassId);
  const classList: Skill[] = cls.skillChoices.from === 'any' ? SKILL_IDS : cls.skillChoices.from;
  const classMax = cls.skillChoices.count + kit.extraClassSkills;
  const otherMax = 3 + featEffects(sheetFeats(s)).extraSkills;
  const known = [...c.classSkills, ...c.otherSkills];
  const expertise = (s.expertise ?? []).filter((k) => known.includes(k));
  return (
    <>
      <div className="counters">
        <span className={c.classSkills.length === classMax ? 'ok' : ''}>{W.countClass(c.classSkills.length, classMax)}</span>
        <span>{W.countBackground(c.otherSkills.length, otherMax)}</span>
        {kit.expertise > 0 && <span>{W.countExpertise(expertise.length, kit.expertise)}</span>}
      </div>
      <ul className="skill-list">
        {SKILL_IDS.map((k) => {
          const inClass = classList.includes(k);
          const isClass = c.classSkills.includes(k);
          const isBg = c.otherSkills.includes(k);
          const exp = expertise.includes(k);
          return (
            <li key={k} className={`skill-row${!inClass && !isBg ? ' dim' : ''}`}>
              <span className="skill-name">{skillName(k)} {getLang() === 'tr' && <small className="skill-en">{SKILLS[k].name}</small>} <small>{SKILLS[k].ability.toUpperCase()}</small></span>
              {isBg && <span className="badge bg locked" title={W.skillBackground}>🔒 {W.skillBackground}</span>}
              {inClass && !isBg && (
                <button className={`badge cls${isClass ? ' on' : ''}`} aria-pressed={isClass}
                  disabled={!isClass && c.classSkills.length >= classMax}
                  onClick={() => setC((x) => ({ ...x, classSkills: toggle(x.classSkills, k, !isClass) }))}>{W.skillClass}</button>
              )}
              {!isClass && (
                <button className={`badge bg${isBg ? ' on' : ''}`} aria-pressed={isBg} disabled={!isBg && c.otherSkills.length >= otherMax}
                  onClick={() => setC((x) => ({ ...x, otherSkills: toggle(x.otherSkills, k, !isBg) }))}>{isBg ? '×' : `+ ${W.skillBackground}`}</button>
              )}
              {kit.expertise > 0 && (isClass || isBg) && (
                <button className={`badge exp${exp ? ' on' : ''}`} aria-pressed={exp} disabled={!exp && expertise.length >= kit.expertise}
                  onClick={() => set({ expertise: toggle(s.expertise ?? [], k, !exp) })}>{W.expertiseTag}</button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** 6. Seviye ilerlemesi: köken feat'i, ASI/feat yuvaları, Fighting Style (mevcut panel). */
function ProgressStep({ sheet, set }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const [featMode, setFeatMode] = useState<Record<number, boolean>>({});
  return <AdvancementPanel sheet={sheet} set={set} featMode={featMode} setFeatMode={(level, on) => setFeatMode((m) => ({ ...m, [level]: on }))} />;
}

/** 7. Donanım: zırh türü düğmeleri, kalkan, silah kartları (ustalık düğmesiyle), yan el, eşyalar. */
function EquipmentStep({ sheet: s, set, carryRule }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void; carryRule: CarryRule }) {
  const L = t();
  const T = L.builder;
  const W = T.wiz;
  const chosenArmor = armor.find((a) => a.name === s.armorName);
  const kind = chosenArmor?.type ?? 'none';
  const right = masteryRight(s);
  const eligible = new Set(masteryOptions(s).map((w) => w.id));
  const chosenM = s.weaponMasteries ?? [];
  // Görev K4: yetkinlik rozetleri; silah listesi varsayılan olarak yalnızca yetkin olunanlar (seçili olanlar her zaman görünür).
  const [onlyProficient, setOnlyProficient] = useState(true);
  const profBadge = (ok: boolean) => <span className={`prof-badge${ok ? ' ok' : ' no'}`}>{ok ? W.proficient : W.notProficient}</span>;
  const attuned = s.itemNames.filter((n) => items.find((i) => i.name === n)?.attunement).length;
  const shown = weapons.filter((w) => !onlyProficient || weaponProficient(s.classId, w) || (s.weapons ?? []).some((x) => x.name === w.name));
  const K = L.carry;
  const load = carryLoad(s, carryRule);
  const lb = (w: number | undefined, approx = false) => <small className="weight">{K.weight(w ?? 0, approx)}</small>;
  return (
    <>
      <CarryBar load={load} rule={carryRule} />
      <div className="seg" role="radiogroup" aria-label={T.armor}>
        {(['none', 'light', 'medium', 'heavy'] as const).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''}
            onClick={() => { const first = armor.find((a) => (a.type ?? 'none') === k); if (first) set({ armorName: first.name }); }}>{W.armorKinds[k]}</button>
        ))}
        <button aria-pressed={s.shield} className={s.shield ? 'on' : ''} title={L.equip.shieldDetail}
          onClick={() => set({ shield: !s.shield, ...(!s.shield ? { offHand: undefined } : {}) })}>{W.shieldBtn} {profBadge(armorProficient(s.classId, 'shield'))}</button>
      </div>
      {kind !== 'none' && (
        <div className="card-grid">
          {armor.filter((a) => (a.type ?? 'none') === kind).map((a) => (
            <button key={a.name} className={`pick-card${a.name === s.armorName ? ' on' : ''}`} aria-pressed={a.name === s.armorName} title={armorDetail(a)}
              onClick={() => set({ armorName: a.name })}><b>{a.name}</b><small>{armorSummary(a)}</small>{lb(a.weight)}{profBadge(armorProficient(s.classId, a.type))}</button>
          ))}
        </div>
      )}
      {chosenArmor && <p className="mute equip-detail">{armorDetail(chosenArmor)}{s.shield ? ` ${L.equip.shieldDetail}` : ''}</p>}
      {/* Görev K9d: eğitimsiz zırh ve kalkan uyarısı (SRD 5.2.1 Armor Training). */}
      {!armorProficient(s.classId, chosenArmor?.type) && <p className="warn armor-warn">{W.armorUntrained}</p>}
      {s.shield && !armorProficient(s.classId, 'shield') && <p className="warn armor-warn">{W.shieldUntrained}</p>}
      <p className="counters"><span>{W.weaponCount((s.weapons ?? []).length, chosenM.length, right?.count ?? 0)}</span></p>
      {right && <p className="mute">{T.masteryHelp(right.melee, right.swap === 'all' ? null : right.swap)}</p>}
      <label className="toggle prof-filter"><input type="checkbox" checked={onlyProficient}
        onChange={(e: { target: { checked: boolean } }) => setOnlyProficient(e.target.checked)} /> {W.onlyProficient}</label>
      <div className="card-grid weapons">
        {shown.map((w) => {
          const on = (s.weapons ?? []).some((x) => x.name === w.name);
          const mid = weaponMasteryId(w.id);
          const mText = mid ? masteryText(mid) : undefined;
          const mOn = chosenM.includes(w.id);
          return (
            <div key={w.name} className={`pick-card weapon${on ? ' on' : ''}`} title={weaponDetail(w)}>
              <button className="weapon-main" aria-pressed={on} onClick={() => set({
                weapons: !on ? [...(s.weapons ?? []), { name: w.name }] : (s.weapons ?? []).filter((x) => x.name !== w.name),
                // Yan el silahı çıkarılınca ya da iki elli silah eklenince yan el boşalır.
                ...(s.offHand && ((on && w.name === s.offHand) || (!on && w.twoHanded && !w.ranged)) ? { offHand: undefined } : {}),
              })}><b>{w.name}</b><small>{weaponSummary(w)}</small>{lb(w.weight)}{profBadge(weaponProficient(s.classId, w))}</button>
              {right && eligible.has(w.id) && mText && (
                <button className={`mastery-btn${mOn ? ' on' : ''}`} aria-pressed={mOn} disabled={!mOn && chosenM.length >= right.count}
                  title={`${mText.name}: ${mText.text}${mid && !masteryWorks(mid) ? ` (${T.masteryNotWorking})` : ''}`}
                  onClick={() => set({ weaponMasteries: toggle(chosenM, w.id, !mOn) })}>{mOn ? W.masteryOn(mText.name) : W.masteryOff(mText.name)}</button>
              )}
            </div>
          );
        })}
      </div>
      <OffHandPicker sheet={s} set={set} />
      <p className="mute">{T.items}: <span className={attuned > MAX_ATTUNED ? 'error' : ''}>{W.attunedCount(attuned, MAX_ATTUNED)}</span></p>
      <div className="chips equip-chips">
        {items.map((it) => (
          <label key={it.name} className={`chip equip${s.itemNames.includes(it.name) ? ' on' : ''}`} title={itemDetail(it)}>
            {/* Görev K4: uyum (attunement) sınırı: dördüncü uyumlu eşya seçilemez. */}
            <input type="checkbox" checked={s.itemNames.includes(it.name)}
              disabled={!s.itemNames.includes(it.name) && it.attunement && attuned >= MAX_ATTUNED}
              onChange={(e: { target: { checked: boolean } }) => set({ itemNames: toggle(s.itemNames, it.name, e.target.checked) })} />
            <span><b>{it.name}</b><small>{itemSummary(it)}</small>{lb(it.weight, it.weightApprox)}</span>
          </label>
        ))}
      </div>
    </>
  );
}

/**
 * Görev K5: "Taşınan 82 / 120 lb" çubuğu; kademeli kuralda Yüklü ve Ağır yüklü eşikleri işaretli; aşınca kırmızı uyarı.
 */
function CarryBar(props: { load: CarryLoad; rule: CarryRule }) {
  const K = t().carry;
  const { weight, capacity, encumberedAt, heavyAt, level } = props.load;
  const pct = (v: number) => `${Math.min(100, (v / Math.max(1, capacity)) * 100)}%`;
  return (
    <div className={`carry-bar${level !== 'ok' ? ` ${level}` : ''}`} aria-label={K.bar(weight, capacity)}>
      <span className="carry-text"><b>{K.bar(weight, capacity)}</b>{level !== 'ok' ? <span className="carry-level"> · {K.level[level]}</span> : null}</span>
      <span className="meter">
        <span className="fill" style={{ width: pct(weight) }} />
        {props.rule === 'tiered' && <><i className="tick" style={{ left: pct(encumberedAt) }} /><i className="tick" style={{ left: pct(heavyAt) }} /></>}
      </span>
      {props.rule === 'tiered' && <small className="mute">{K.marks(encumberedAt, heavyAt)}</small>}
      {level === 'over' && props.rule !== 'off' && <p className="error carry-over">{K.over}</p>}
    </div>
  );
}

/**
 * Büyüler (Görev K6): SRD sınıf listesi cantrip ve seviyeye göre gruplu; sayaçlar (Cantrip, Hazırlanan, Wizard'da Büyü
 * kitabı) tablodan; sınıra gelince seçilmemişler kapalı; erişilemeyen seviyeler kilitli, oyunda verisi olmayanlar soluk.
 * Wizard'da seviyeli büyü önce kitaba yazılır, sonra hazırlanır.
 */
function SpellsStep({ sheet: s, set }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const W = T.wiz;
  const kit = classKit(s.classId, s.level, s.subclassId);
  const lim = spellLimits(s.classId, s.level);
  const cnt = spellCounts(s);
  const chosen = s.spellNames ?? [];
  const list = classSpellList(s.classId);
  const alt = alternativeCantrips(s).options.filter((n) => !list.some((x) => x.name === n));
  const book = lim.spellbook !== null;
  const levels = [...new Set(list.map((x) => x.level))].sort((a, b) => a - b);
  const toggleSpell = (n: string, on: boolean) => set({ spellNames: toggle(chosen, n, on) });
  const toggleBook = (n: string, on: boolean) => {
    const cur = s.spellbook ?? cnt.book;
    set({ spellbook: toggle(cur, n, on), ...(!on ? { spellNames: chosen.filter((x) => x !== n) } : {}) });
  };
  const row = (x: ClassSpell) => {
    const sp = x.spell;
    const on = chosen.includes(x.name);
    const inBook = cnt.book.includes(x.name);
    const full = x.level === 0 ? cnt.cantrips >= lim.cantrips : cnt.prepared >= lim.prepared;
    if (!sp || kit.alwaysPrepared.includes(x.name)) {
      return (
        <li key={x.id} className="spell-row missing">
          <span>{x.name}</span><small>{sp ? T.alwaysPreparedTag : W.spellNotInGame}</small>
        </li>
      );
    }
    return (
      <li key={x.id} className={`spell-row${on ? ' on' : ''}`} title={sp.mechanics.unsupported ?? sp.mechanics.approx ?? undefined}>
        <span className="spell-name">{x.name}{sp.mechanics.unsupported ? <InfoTip text={T.spellNotWorking} /> : null}
          {sp.mechanics.offCombat ? <small className="tag-offcombat" title={T.spellOffCombatTip}>{T.spellOffCombat}</small> : null}</span>
        {book && x.level > 0 && (
          <button className={`badge book${inBook ? ' on' : ''}`} aria-pressed={inBook} disabled={!inBook && cnt.book.length >= (lim.spellbook ?? 0)}
            onClick={() => toggleBook(x.name, !inBook)}>{W.spellBookTag}</button>
        )}
        <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} aria-label={`${x.name}: ${x.level === 0 ? W.spellKnowTag : W.spellPrepTag}`}
          disabled={!on && (full || (book && x.level > 0 && !inBook))} onClick={() => toggleSpell(x.name, !on)}>{x.level === 0 ? W.spellKnowTag : W.spellPrepTag}</button>
      </li>
    );
  };
  return (
    <>
      <p className="counters">
        <span className={cnt.cantrips > lim.cantrips ? 'error' : cnt.cantrips === lim.cantrips ? 'ok' : ''}>{W.countCantrips(cnt.cantrips, lim.cantrips)}</span>
        <span className={cnt.prepared > lim.prepared ? 'error' : cnt.prepared === lim.prepared ? 'ok' : ''}>{W.countPrepared(cnt.prepared, lim.prepared)}</span>
        {book && <span className={cnt.book.length > (lim.spellbook ?? 0) ? 'error' : ''}>{W.countBook(cnt.book.length, lim.spellbook ?? 0)}</span>}
      </p>
      {kit.alwaysPrepared.length > 0 && <p className="mute">{T.alwaysPrepared(kit.alwaysPrepared.join(', '))}</p>}
      {levels.map((lv) => {
        const rows = list.filter((x) => x.level === lv);
        const title = lv === 0 ? W.cantripGroup : W.levelGroup(lv);
        if (lv > lim.maxLevel) {
          return (
            <details key={lv} className="spell-group locked">
              <summary>🔒 {title} <small className="mute">{W.lockedGroup(rows.length)}</small></summary>
              <ul className="spell-list">{rows.map((x) => <li key={x.id} className="spell-row missing"><span>{x.name}</span></li>)}</ul>
            </details>
          );
        }
        return (
          <section key={lv} className="spell-group">
            <h3>{title}</h3>
            <ul className="spell-list">{rows.map(row)}</ul>
          </section>
        );
      })}
      {alt.length > 0 && (
        <section className="spell-group">
          <h3>{W.altCantrips}</h3>
          <ul className="spell-list">{alt.map((n) => {
            const on = chosen.includes(n);
            return (
              <li key={n} className={`spell-row${on ? ' on' : ''}`}><span className="spell-name">{n}</span>
                <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleSpell(n, !on)}>{W.spellKnowTag}</button></li>
            );
          })}</ul>
        </section>
      )}
    </>
  );
}

/** Geliştirici durum etiketi yerine küçük bilgi simgesi (ipucu). */
function InfoTip(props: { text: string }) {
  return <span className="info-tip" title={props.text} aria-label={props.text}>ⓘ</span>;
}

/** Sağ panel (masaüstü): ad, seviye/ırk/sınıf, Can/AC/Hız/İnisiyatif, skorlar, kurtarma, beceriler. */
function SidePanel(props: { final: SavedCharacter; derived: DerivedStats | null; raceName: string }) {
  const T = t().builder;
  const W = T.wiz;
  const s = props.final.sheet;
  const d = props.derived;
  return (
    <div className="side-sum">
      <p><b>{s.name || '—'}</b><br /><small>{s.level}. · {props.raceName} · {getClass(s.classId).name}</small></p>
      {lineageLine(s) && <p className="sum-lineage"><small>{lineageLine(s)}</small></p>}
      {d ? (
        <>
          <div className="stat-tiles">
            <span><small>{W.sumHp}</small><b>{d.maxHp}</b></span><span><small>{W.sumAc}</small><b>{d.ac}</b></span>
            <span><small>{W.sumSpeed}</small><b>{d.speed}</b></span><span><small>{W.sumInit}</small><b>{mod(d.initiative)}</b></span>
          </div>
          <div className="mini-scores">{ABILITIES.map((a) => <span key={a}><small>{a.toUpperCase()}</small><b>{d.scores[a]}</b></span>)}</div>
          <p><small><b>{T.sumSaves}:</b> {ABILITIES.map((a) => `${a.toUpperCase()} ${mod(d.saves[a])}`).join(' · ')}</small></p>
          <p><small><b>{T.sumSkills}:</b> {Object.entries(d.skills).map(([k, v]) => `${skillName(k as Skill)} ${mod(v as number)}`).join(', ') || '—'}</small></p>
        </>
      ) : <p className="mute">{T.fixFirst}</p>}
    </div>
  );
}

/** Özet adımı: ayrıntılı özet (eski özet paneli). */
function SummaryBody(props: { final: SavedCharacter; derived: DerivedStats | null; raceName: string }) {
  const T = t().builder;
  const final = props.final;
  const s = final.sheet;
  const derived = props.derived;
  const cls = getClass(s.classId);
  const chosenArmor = armor.find((a) => a.name === s.armorName);
  const bonuses = s.backgroundBonuses ?? {};
  const pattern = backgroundPattern(bonuses);
  const expFrom = experimentalFrom(s.classId, s.subclassId);
  if (!derived) return <p className="mute">{T.fixFirst}</p>;
  return (
    <>
      <ul className="summary-points">
        <li><b>{T.sumIntro(s.name, props.raceName, cls.name, s.level)}</b></li>
        {lineageLine(s) && <li className="sum-lineage">{t().builder.wiz.lineageTitle}: {lineageLine(s)}</li>}
        {lineageAbilityList(s).length > 0 && <li><LineageAbilities list={lineageAbilityList(s)} /></li>}
        <li>{T.sumHp(derived.maxHp, cls.hitDie)} {T.sumSpeed(derived.speed, derived.proficiency, mod(derived.initiative))}</li>
        <li>{T.sumAc(derived.ac, acText(derived))}{chosenArmor?.stealthDisadvantage ? ` ${T.sumStealth}` : ''}{derived.armorStrengthShort ? ` ${T.sumStrength(derived.armorStrengthShort)}` : ''}</li>
        <li>{mainAttack(s)}</li>
        {derived.spellSaveDc !== null && (s.spellNames ?? []).length > 0 && (
          <li>{T.sumSpells((s.spellNames ?? []).slice(0, 5).join(', ') + ((s.spellNames ?? []).length > 5 ? '…' : ''), derived.spellSaveDc, mod(derived.spellAttack ?? 0))}</li>
        )}
        {(s.weaponMasteries ?? []).length > 0 && <li>{T.sumMastery(masteryLabels(s).join(', '))}</li>}
        {sheetFeats(s).length > 0 && <li>{T.sumFeats(sheetFeats(s).map((id) => featById(id)?.name ?? slotAlternativeById(id)?.name ?? id).join(', '))}</li>}
        {s.level >= expFrom && <li className="warn">{T.experimental(expFrom)}</li>}
        {/* Görev K4: dağıtılmamış geçmiş bonusu eksik sayılmaz (kaydı engellemez); "Eksik yok" ile çelişmesin diye satır gösterilmez. */}
        {(pattern === '2-1' || pattern === '1-1-1') && <li>{T.sumBackground(ABILITIES.filter((a) => bonuses[a]).map((a) => `${a.toUpperCase()} +${bonuses[a]}`).join(', '),
          final.otherSkills.map((k) => skillName(k)).join(', ') || '—')}</li>}
      </ul>
      <p><b>{T.sumScores}:</b> {ABILITIES.map((a) => `${a.toUpperCase()} ${derived.scores[a]} (${mod(derived.modifiers[a])})`).join(' · ')}</p>
      {derived.spellSaveDc !== null && <p>{T.sumSpellDc(derived.spellSaveDc, mod(derived.spellAttack ?? 0))}</p>}
    </>
  );
}

const ABILITY_OPTIONS = ABILITIES;

/** Yuvadaki seçim (Fighting Style yuvası ile aynı seviyedeki ASI yuvası ayrılır). */
function slotAdvancement(list: Advancement[], slot: AdvancementSlot): Advancement | undefined {
  return list.find((a) => a.level === slot.level && (slot.kind === 'style' ? isStyleChoice(a.featId) : !isStyleChoice(a.featId)));
}

/** Yuvanın seçimini değiştirir (null: yuva boşalır); seviye sırası korunur. */
function withSlot(list: Advancement[], slot: AdvancementSlot, next: Advancement | null): Advancement[] {
  const old = slotAdvancement(list, slot);
  const rest = list.filter((a) => a !== old);
  return next ? [...rest, next].sort((x, y) => x.level - y.level) : rest;
}

/** Yetenek artışı (ASI) alabilen yuvalar: ASI yuvaları ve ASI'ye izin veren Epic Boon yuvası. */
function asiCapableSlots(s: CharacterSheet, scores: Scores): AdvancementSlot[] {
  const asi = featById(ASI_FEAT);
  if (!asi) return [];
  const ctx = { scores, casterClass: getClass(s.classId).casting !== null };
  return advancementSlots(s.classId, s.level, s.subclassId).filter((x) => x.kind !== 'style' && featProblem(asi, x, ctx) === null);
}

/**
 * Köken feat'i ve seviye yuvaları. ASI alabilen yuvada "Yetenek artışı / Feat" geçişi: yetenek artışı skor
 * satırlarındaki sayaçla yapılır (Görev M4); feat seçilirse sayaç kapanır, feat'in kendi +1'i burada seçilir.
 */
function AdvancementPanel(props: {
  sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void;
  featMode: Record<number, boolean>; setFeatMode: (level: number, on: boolean) => void;
}) {
  const T = t().builder;
  const s = props.sheet;
  const slots = advancementSlots(s.classId, s.level, s.subclassId);
  const ctx = { scores: finalScores({ ...s, advancements: [] }), casterClass: getClass(s.classId).casting !== null };
  const asiOk = new Set(asiCapableSlots(s, ctx.scores).map((x) => `${x.level}:${x.kind}`));
  const list = s.advancements ?? [];
  const put = (slot: AdvancementSlot, next: Advancement | null) => props.set({ advancements: withSlot(list, slot, next) });
  return (
    <section className="panel">
      <h2>{T.progress}</h2>
      <p className="mute">{T.progressHelp}</p>
      <div className="form-row">
        <label>{T.originFeat}
          <select value={s.originFeat ?? ''} onChange={(e: { target: { value: string } }) => props.set({ originFeat: e.target.value || undefined })}>
            <option value="">{T.noFeat}</option>
            {originFeats().map((f) => <option key={f.id} value={f.id} title={T.featStatus[featMechanic(f.id)?.status ?? 'missing']}>{f.name}</option>)}
          </select>
        </label>
      </div>
      {s.originFeat && <FeatNote id={s.originFeat} />}
      {slots.map((slot) => {
        const a = slotAdvancement(list, slot);
        const canAsi = asiOk.has(`${slot.level}:${slot.kind}`);
        const featChosen = a ? a.featId !== ASI_FEAT : !!props.featMode[slot.level];
        const asiMode = canAsi && !featChosen;
        const inc = a && a.featId !== ASI_FEAT ? featMechanic(a.featId)?.abilityIncrease : undefined;
        const options = featOptions(slot, ctx).filter((f) => f.id !== ASI_FEAT);
        // Fighting Style yuvasında feat yerine seçenek (Blessed Warrior; veriden).
        const alts = slot.kind === 'style' ? classKit(s.classId, s.level, s.subclassId).slotAlternatives.filter((x) => x.level === slot.level) : [];
        return (
          <div key={`${slot.level}:${slot.kind}`} className="advancement">
            <div className="form-row">
              <span>{T.slot[slot.kind](slot.level)}</span>
              {canAsi && (
                <span className="toggle-group" role="radiogroup" aria-label={T.slot[slot.kind](slot.level)}>
                  <label className="toggle"><input type="radio" checked={asiMode} onChange={() => {
                    props.setFeatMode(slot.level, false);
                    put(slot, { level: slot.level, featId: ASI_FEAT, abilities: {} });
                  }} /> {T.asiChoice.asi}</label>
                  <label className="toggle"><input type="radio" checked={!asiMode} onChange={() => {
                    props.setFeatMode(slot.level, true);
                    put(slot, null);
                  }} /> {T.asiChoice.feat}</label>
                </span>
              )}
            </div>
            {asiMode ? (
              <AsiSlotCard sheet={s} slot={slot} advancement={a} onChange={(next) => put(slot, next)} />
            ) : (
              <div className="form-row">
                <label>
                  <select aria-label={T.slot[slot.kind](slot.level)} value={a?.featId ?? ''} onChange={(e: { target: { value: string } }) =>
                    put(slot, e.target.value ? { level: slot.level, featId: e.target.value } : null)}>
                    <option value="">{T.noFeat}</option>
                    {options.map((f) => <option key={f.id} value={f.id} title={T.featStatus[featMechanic(f.id)?.status ?? 'missing']}>{f.name}</option>)}
                    {alts.map((x) => <option key={x.id} value={x.id}>{T.altOption(x.name, x.cantrips)}</option>)}
                  </select>
                </label>
                {a && inc && <IncreasePicker advancement={a} amount={inc.amount ?? 1}
                  choices={inc.choices ?? ABILITY_OPTIONS} onChange={(abilities) => put(slot, { ...a, abilities })} />}
              </div>
            )}
            {a && a.featId !== ASI_FEAT && <FeatNote id={a.featId} />}
            {a && alts.some((x) => x.id === a.featId) && <p className="mute feat-note">{T.altNote(alts.find((x) => x.id === a.featId)?.cantrips ?? 0)}</p>}
          </div>
        );
      })}
    </section>
  );
}

/** Feat'in kendi yetenek artışı (ASI dışındaki feat'ler): seçilen bir skora +n. */
function IncreasePicker(props: {
  advancement: Advancement; amount: number; choices: readonly Ability[]; onChange: (a: Partial<Record<Ability, number>>) => void;
}) {
  const T = t().builder;
  const cur = Object.entries(props.advancement.abilities ?? {}).filter(([, v]) => v) as Array<[Ability, number]>;
  return (
    <label>{T.increaseTo(props.amount)}{' '}
      <select aria-label={T.chooseAbility} value={cur[0]?.[0] ?? ''} onChange={(e: { target: { value: string } }) => {
        const ab = e.target.value as Ability;
        props.onChange(ab ? { [ab]: props.amount } : {});
      }}>
        <option value="">{T.chooseAbility}</option>
        {props.choices.map((x) => <option key={x} value={x}>{abilityName(x)}</option>)}
      </select>
    </label>
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

/** Yan el silahı (Light ek saldırısı; Görev P1): yalnızca geçerli Light silahlar; geçersizlerin nedeni gösterilir. */
function OffHandPicker(props: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const s = props.sheet;
  const lights = (s.weapons ?? []).map((x) => weapons.find((w) => w.name === x.name)).filter((w) => w?.light);
  const reasons = lights.map((w) => ({ name: w?.name ?? '', why: offHandOptionProblem(s, w?.name ?? '') }));
  const anyOk = reasons.some((r) => r.why === null);
  const first = reasons.find((r) => r.why)?.why ?? T.offHandNone;
  return (
    <div className="form-row offhand">
      <label>{T.offHand}
        <select aria-label={T.offHand} value={s.offHand ?? ''} disabled={!anyOk && !s.offHand}
          onChange={(e: { target: { value: string } }) => props.set({ offHand: e.target.value || undefined })}>
          <option value="">{T.offHandEmpty}</option>
          {reasons.map((r) => <option key={r.name} value={r.name} disabled={r.why !== null}>{r.name}{r.why ? ` — ${r.why}` : ''}</option>)}
        </select>
      </label>
      <small className="mute">{s.offHand ? (offHandProblem(s) ?? T.offHandHelp) : anyOk ? T.offHandHelp : first}</small>
    </div>
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
  // Oyundaki durum (kısmen, oyunda henüz yok…) oyuncuya etiket olarak değil, bilgi ipucunda (Görev K1).
  return <p className="mute feat-note"><b>{f.name}</b> <InfoTip text={`${T.featStatus[m?.status ?? 'missing']}${m?.note ? ` — ${m.note}` : ''}`} />: {benefits}</p>;
}

/** Bu seviyeye dek gelen sınıf ve alt sınıf özellikleri, oyundaki durumlarıyla; deneysel seviye uyarısı. */
function FeaturesPanel(props: {
  classId: string; level: number; subclassId?: string; experimentalFrom: number;
  /** Seçenekli özellikler (Hunter's Prey, Defensive Tactics; Görev F). */
  choices: Record<string, string>; onChoose: (key: string, value: string) => void;
}) {
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
            title={f.mechanic?.note ?? ''}>{f.level}. {f.name} <InfoTip text={`${T.featStatus[f.mechanic?.status ?? 'missing'] ?? ''}${f.mechanic?.note ? ` — ${f.mechanic.note}` : ''}`} />
            {f.mechanic?.options && (
              <select aria-label={f.name} value={props.choices[f.key] ?? f.mechanic.default ?? f.mechanic.options[0]?.id}
                onChange={(e: { target: { value: string } }) => props.onChoose(f.key, e.target.value)}>
                {f.mechanic.options.map((o) => <option key={o.id} value={o.id}>{T.featureOption[o.id] ?? o.id}</option>)}
              </select>
            )}</li>
        ))}
      </ul>
      {missing.length > 0 && <p className="mute">{T.missingList(missing.map((f) => f.name).join(', '))}</p>}
    </section>
  );
}
