/**
 * Karakter oluşturucu (Adım 13, Görev H): tek uzun form. Skorlar standart dizi veya point buy; geçmiş
 * bonusu her skorda −/+ sayacıyla (+2/+1 ya da +1/+1/+1 kuralına uyanlar açık); sınıf ve geçmiş becerileri;
 * zırh, silah, eşya (her birinin bir satır özeti, ayrıntı üzerine gelince ya da seçilince); büyüler.
 * Sağda (dar ekranda altta) anlamlı bir özet ve sorunlar canlı görünür.
 */
import { eligibleForms, shapeLimits } from '../battle/druid';
import { eligibleCantrips, invocationKit, invocationSlots, LESSON_FEATS, parseInvocation } from '../rules/invocations';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { armor, classDataLoaded, classes, getClass, items, loadMonsters, monsters, monstersLoaded, races, spells, weapons } from '../data';
import { classBlurb, featInfo, raceBlurb, raceTraitLines } from '../ui/descriptions';
import { describeTr } from '../ui/trDesc';
import { characterTokenFile, monsterAvatar, sheetAvatar } from '../battle/avatar';
import { offHandAttackOption, weaponAttackOption } from '../battle/weapons';
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import {
  POINT_BUY_BUDGET, STANDARD_ARRAY, alternativeCantrips, assignScore, resetScores, suggestScores, rollAbilityScores, rolledScores, backgroundPattern, canRaiseBonus, characterIssues, discoveryCap, pointBuyCost, spellCounts, usesStandardArray, spellLimits, spellOptions, suggestedScores,
  classScoped, featSkillCount, normalizeFeatSkills, otherSkillsOf, savableCharacter, switchClass, withSkills, type BuilderStep, type SavedCharacter,
} from '../rules/builder';
import { averageDamage } from '../rules/crEstimate';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { classSpellList, type ClassSpell } from '../rules/spellList';
import { carryLoad, type CarryLoad, type CarryRule } from '../rules/carry';
import { storedCarryRule } from '../ui/carrySetting';
import { MAX_ATTUNED, armorProficient, deriveStats, finalScores, type CharacterSheet, type DerivedStats } from '../rules/stats';
import karadulData from '../../data/karadul.json';
import { UPPER_LEVEL_CAP } from '../app/limits';
import { alignmentAutoOnly, alignmentEnabled, alignmentRace } from '../app/features';
import { AlignmentGrid } from '../ui/AlignmentGrid';
import { applyStartKind, newAlignment, onSubclassChange, rejectOptions, startContributions, startValue, type Alignment, type StartKind } from '../rules/alignment';
import { AWAKENING_OPTIONS, CELESTIAL, type AwakeningOption } from '../rules/celestialData';
import { classKit, experimentalFrom, gainedFeatures, missingFeatures, subclassLevel, subclassesOf } from '../rules/classFeatures';
import { findSubclass, genderVisible, isOtherClassSubclass, notWorkingCount, packExperimental, subclassLabel, subclassMissing } from '../rules/subclasses';
import { wishPickKey } from '../battle/paket/bag';
import {
  ASI_FEAT, advancementSlots, asiCanRaise, asiPointsLeft, asiStep, scoresBeforeSlot, featById, featMechanic, featOptions, featEffects, featProblem, isStyleChoice, slotAlternativeById,
  originFeats, sheetFeats, type Advancement, type AdvancementSlot, type Scores,
} from '../rules/advancement';
import { offHandOptionProblem, offHandProblem } from '../rules/hands';
import { masteryOptions, masteryRight, masteryText, masteryWorks, weaponMasteryId, weaponProficient } from '../rules/mastery';
import { AvatarBadge, CharacterFigure, preloadImages } from '../ui/Avatar';
import { abilityTip, lineageAbilityList, lineageLine } from '../ui/lineageText';
import { lineageName, lineageOf, lineageSummary, raceDarkvision, raceSpeed, type LineageAbility } from '../rules/lineage';
import { lineageNotes } from '../ui/lineageNotes';
import { cultureSkinTone, exileName, exileOptions, pickCulture, tonesFor } from '../ui/lineageLook';
import { MI_LISTS, backgroundOf, backgroundSkills, backgrounds, bonusesOf, magicInitiateAll, magicInitiateOf, magicInitiateOptions, originFeatOf, otherSkillMax, type MagicInitiatePick } from '../rules/backgrounds';
import { armorDetail, armorSummary, itemDetail, itemSummary, weaponDetail, weaponSummary } from '../ui/equipmentText';
import { getLang, t } from '../i18n';
import { Fold, InfoPop, InfoTip, toggle } from './builder/shared';
import { recommendedAsi, reSuggestAfterBackground, reSuggestAfterLevel, reSuggestAfterClassSwitch, withRecommendedAsi, withSuggestions } from './builderDefaults';
import onerilen from '../../data/onerilen-baslangic.json';
import { EquipmentStep } from './builder/Equipment';
import { FeaturesPanel } from './builder/Features';
import { StepBoundary } from '../ui/StepBoundary';
import { useDiceFlow } from '../ui/diceFlow';
import { DicePrompt } from '../ui/DicePrompt';
import { ITEM_KINDS, ITEM_TIERS, itemKind, itemTier, type ItemKind, type ItemTier } from '../rules/itemCategory';

/** SD3: ilk sırada görünen tür ve sınıf kartları (kalanı "Diğer" altında; `data/onerilen-baslangic.json`). */
const RACE_FEATURED = onerilen.ozelTurler;
const CLASS_FEATURED = onerilen.ozelSiniflar;

/** Yetenek adları (geçerli dilde). */
export const abilityName = (a: Ability): string => t().abilities[a] ?? a;
const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));
/** Görev K4: beceri adı (geçerli dilde; İngilizce SRD adı `SKILLS`). */
const skillName = (k: Skill): string => t().skillNames[k] ?? SKILLS[k].name;

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
      case 'str': case 'int': case 'cha': return p.ability(x.kind, mod(x.value));
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
  const list = caster ? all : all.filter((x) => x !== 'spells');
  // Kuyruk K51: hizalanma ev kuralı açıkken son adım.
  return alignmentEnabled() ? [...list, 'alignment'] : list;
}

/**
 * Kayıt açılırken (Görev K1): başka sınıfın alt sınıfı boşa çevrilir (Görev AS2: kayıtta olmayan kimlik kalır, "içerik eksik");
 * döner: temizlenen kimlik (bir kerelik not için) ya da null.
 */
/** Kuyruk K48: Karadul skor takası (insan → örümcek; iki sütun tek satırda): "STR 8→16 · CHA 16→8 …". */
function karadulSwapText(sheet: CharacterSheet): string {
  const sc = deriveStats(sheet).scores;
  return (karadulData.skorTakasi as Array<[Ability, Ability]>).flatMap(([a, b]) => [`${a.toUpperCase()} ${sc[a]}→${sc[b]}`, `${b.toUpperCase()} ${sc[b]}→${sc[a]}`]).join(' · ');
}

export function clearInvalidSubclass(c: SavedCharacter): { character: SavedCharacter; cleared: string | null } {
  const id = c.sheet.subclassId;
  // Görev AS2: kayıtta hiç bulunmayan kimlik (içerik yüklenmemiş: mobil, icerik/ yok) silinmez ("içerik eksik" kalır);
  // yalnız sınıfın listesinde olmayıp başka bir sınıfa ait kimlik temizlenir.
  if (!id || !classDataLoaded() || subclassesOf(c.sheet.classId).some((x) => x.id === id) || !isOtherClassSubclass(c.sheet.classId, id)) return { character: c, cleared: null };
  return { character: { ...c, sheet: { ...c.sheet, subclassId: undefined } }, cleared: id };
}

/**
 * Karakter oluşturucu (Görev K1): 9 adımlı sihirbaz (kimlik, ırk, sınıf, puanlar, beceriler, ilerleme, donanım, büyüler,
 * özet). Karakter verisi ve kurallar aynı; sorunlar adımlara bağlı (`characterIssues`), eksik "Devam"ı engellemez,
 * yalnızca "Kaydet"i. Masaüstünde sağda özet paneli ve üstte adım çubuğu; mobilde üst başlık, ilerleme çubuğu ve alt
 * özet çubuğu. `step` (testler) başlangıç adımı.
 */
export function Builder(props: { initial: SavedCharacter; onSave: (c: SavedCharacter) => void; onCancel: () => void; step?: BuilderStep;
  /** Görev SD3: yeni karakter: ad, beceri, geçmiş bonusu, donanım, büyü ve yetenek artışı önerileri hazır gelir. */ suggest?: boolean }) {
  const L = t();
  const T = L.builder;
  const W = T.wiz;
  // Görev K17: eski kayıttaki başka sınıfa ait seçimler açılışta düşer (uyarı üretmezler, kayda yazılmazlar).
  const [boot] = useState(() => {
    const b = clearInvalidSubclass(props.initial);
    // Görev K20: eski kayıtta Skilled becerileri diğer becerilerin içinde: ayrılır.
    if (!classDataLoaded()) return b;
    const scoped = normalizeFeatSkills({ ...b.character, sheet: classScoped(b.character.sheet) });
    return { ...b, character: props.suggest ? withSuggestions(scoped) : scoped };
  });
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
  const isLast = steps.indexOf(current) === steps.length - 1;
  const index = steps.indexOf(current);
  const [visited, setVisited] = useState<Set<BuilderStep>>(() => new Set([props.step ?? 'character']));
  const [missingOpen, setMissingOpen] = useState(false);
  // SD3: Kaydet soluk (disabled) kalmaz; eksik varken dokununca nedeni söyler ve ilk eksik adıma götürür.
  const [saveHint, setSaveHint] = useState(false);
  const go = (id: BuilderStep) => { setStepId(id); setVisited((v) => new Set([...v, id])); setMissingOpen(false); setSaveHint(false); };
  const issuesOf = (id: BuilderStep) => issues.filter((x) => x.step === id);
  // Sınıf değişince avatar beklemeden açılsın: bu tür ve görünümün bütün sınıf jetonları (küçük kopya) boşta indirilir.
  useEffect(() => {
    preloadImages(classes.map((k) => `characters/kucuk/${characterTokenFile(s.raceId, s.gender, k.id)}`));
  }, [s.raceId, s.gender]);
  const raceName = `${race?.name ?? s.raceId}${lineageOf(s) ? ` (${lineageName(lineageOf(s)!, getLang())})` : ''}`;
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
            <StepBoundary key={current} where={`sihirbaz:${current}`} context={{ step: current, classId: s.classId, raceId: s.raceId, lineageId: s.lineageId,
              subclassId: s.subclassId, level: s.level, originFeat: s.originFeat, backgroundId: s.backgroundId, backgroundBonuses: s.backgroundBonuses }}>
            {current === 'character' && <CharacterStep c={c} setC={setC} set={set} suggest={props.suggest} />}
            {current === 'scores' && <ScoresStep c={c} setC={setC} set={set} />}
            {current === 'skills' && <SkillsStep c={c} setC={setC} set={set} />}
            {current === 'progress' && <ProgressStep c={c} setC={setC} set={set} />}
            {current === 'equipment' && <EquipmentStep sheet={s} set={set} carryRule={carryRule} />}
            {current === 'spells' && <SpellsStep sheet={s} set={set} />}
            {current === 'alignment' && <AlignmentStep c={c} setC={setC} initial={props.initial} />}
            </StepBoundary>
            {current === 'summary' && (
              <div className="wiz-summary-step">
                <SummaryBody final={final} derived={derived} raceName={raceName} />
                <h3>{W.missingTitle}</h3>
                {issues.length > 0 ? <>{missingList}<p className="mute">{W.summaryHint}</p></> : <p className="ok">{T.ready}</p>}
              </div>
            )}
            {saveHint && issues.length > 0 && (
              <div className="warn wiz-save-hint" role="alert">
                <p><b>{W.saveFirst(issues.length)}</b> {issues[0]?.text}</p>
                <button className="danger" onClick={() => go((issues[0] as { step: BuilderStep }).step)}>{W.goTo(stepLabel((issues[0] as { step: BuilderStep }).step))}</button>
              </div>
            )}
            <div className="wiz-nav">
              <button className="ghost" disabled={index === 0} onClick={() => go(steps[index - 1] as BuilderStep)}>{W.back}</button>
              {!isLast
                ? <button className="cta" onClick={() => go(steps[index + 1] as BuilderStep)}>{W.next}</button>
                : <button className={`cta${problems.length > 0 ? ' soft' : ''}`} aria-disabled={problems.length > 0 || undefined}
                  onClick={() => (problems.length > 0 ? setSaveHint(true) : props.onSave(withAlignment(savableCharacter(final), props.initial)))}>{W.save}</button>}
            </div>
          </section>
          <aside className="panel builder-summary wiz-side" aria-label={T.summary}>
            {current === 'character' && <TokenPreview sheet={s} size={200} className="wiz-preview-side" />}
            <h2>{T.summary}</h2>
            <SidePanel final={final} derived={derived} raceName={raceName} />
            {current !== 'summary' && (
              <>
                <h3>{W.missingTitle}</h3>
                {issues.length > 0 ? missingList : <p className="ok">{W.noMissing}</p>}
              </>
            )}
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


/**
 * Kuyruk K51: kayıtta hizalanma (ev kuralı açıkken). Yeni karakter: seçilen başlangıç (seçilmediyse otomatik). Kayıtlı
 * karakter: başlangıcı otomatik kabul etmişse yeni toplama güncellenir (alt sınıf değişince); orta nokta/çizgi
 * seçtiyse değişmez. Kural kapalıyken alan olduğu gibi kalır.
 */
function withAlignment(ch: SavedCharacter, initial: SavedCharacter): SavedCharacter {
  if (!alignmentEnabled()) return ch;
  const computed = startValue(startContributions(ch.sheet, alignmentRace()));
  if (initial.hizalanma) return { ...ch, hizalanma: onSubclassChange(initial.hizalanma, computed, 'oluşturucu', new Date().toISOString()).alignment };
  return { ...ch, hizalanma: ch.hizalanma ?? newAlignment(computed, 'otomatik') };
}

/** Kuyruk K51: hizalanma son adımı (katkı dökümü, ızgara, Kabul et / Kabul etme ve üç geçiş seçeneği). */
function AlignmentStep(props: { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void; initial: SavedCharacter }) {
  const H = t().view.hizalanma;
  const lang = getLang();
  const list = startContributions(props.c.sheet, alignmentRace());
  const computed = startValue(list);
  const old = props.initial.hizalanma;
  const [rejecting, setRejecting] = useState(false);
  const chosen: StartKind = props.c.hizalanma?.baslangicTuru ?? 'otomatik';
  const choose = (k: StartKind) => props.setC((x) => ({ ...x, hizalanma: newAlignment(computed, k) }));
  const opts = alignmentAutoOnly() ? [] : rejectOptions(computed);
  const sorted = [...list.filter((x) => x.kaynak !== 'irk'), ...list.filter((x) => x.kaynak === 'irk')];
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  const shown: Alignment = old ? onSubclassChange(old, computed, '', '').alignment : props.c.hizalanma ?? newAlignment(computed, 'otomatik');
  return (
    <div className="align-step">
      <p className="mute">{H.intro}</p>
      <AlignmentGrid value={shown} start={old ? old.baslangic : applyStartKind(chosen, computed)} label={shown} bars />
      <table className="align-contrib"><tbody>
        {sorted.map((x) => (
          <tr key={`${x.kaynak}:${x.id}`}><td>{H.sources[x.kaynak]}: {x.gerekce[lang]}</td><td className="num">{H.law} {sign(x.duzen)} · {H.good} {sign(x.iyilik)}</td></tr>
        ))}
        <tr><td><b>{H.total}</b></td><td className="num"><b>{H.law} {sign(computed.duzen)} · {H.good} {sign(computed.iyilik)}</b></td></tr>
      </tbody></table>
      {old ? (
        <p className="mute">{H.locked} {old.baslangicTuru === 'otomatik'
          ? (old.baslangic.duzen !== computed.duzen || old.baslangic.iyilik !== computed.iyilik ? H.updated(computed.duzen, computed.iyilik) : '')
          : H.suggested(computed.duzen, computed.iyilik)}</p>
      ) : (
        <>
          <div className="align-actions">
            <button type="button" className={chosen === 'otomatik' ? 'on' : ''} onClick={() => { setRejecting(false); choose('otomatik'); }}>{H.accept}</button>
            {opts.length > 0 && <button type="button" className={chosen !== 'otomatik' ? 'on' : ''} onClick={() => setRejecting(true)}>{H.reject}</button>}
          </div>
          {(rejecting || chosen !== 'otomatik') && opts.length > 0 && (
            <div className="align-actions">
              {opts.map((k) => <button key={k} type="button" className={chosen === k ? 'on' : ''} onClick={() => choose(k)}>{H.options[k]}</button>)}
            </div>
          )}
          {alignmentAutoOnly() && <p className="mute">{H.autoOnly}</p>}
          <p className="mute">{H.chosen(H.kinds[chosen] ?? chosen)}</p>
        </>
      )}
    </div>
  );
}

/** `suggest`: yeni karakter oturumu (Görev SD3): dokunulmamış öneriler sınıf, geçmiş ve seviye değişince yenilenir. */
type StepProps = { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void; set: (patch: Partial<CharacterSheet>) => void; suggest?: boolean };

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
      <CharacterFigure key={avatar.src} avatar={avatar} size={props.size} title={s.name || '—'} />
      <figcaption><b>{s.name || '—'}</b><small>{race?.name ?? s.raceId}{l ? ` · ${lineageName(l, getLang())}` : ''} · {getClass(s.classId).name} {s.level}</small></figcaption>
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
      <BackgroundStep c={props.c} setC={props.setC} suggest={props.suggest} />
    </div>
  );
}

/** Kimlik: ad, seviye, görünüm. Seviye değişince üstteki seçimler düşer. */
function IdentityStep({ c, setC, set, suggest }: StepProps) {
  const T = t().builder;
  const s = c.sheet;
  const setLevel = (level: number) => setC((x) => {
    const nextKit = classKit(x.sheet.classId, level, x.sheet.subclassId);
    const next: SavedCharacter = {
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
    // SD3: dokunulmamış öneriler (büyüler, yetenek artışı) yeni seviyeye göre yenilenir.
    return suggest ? reSuggestAfterLevel(x, next) : next;
  });
  return (
    <div className="form-row wiz-identity">
      <label>{T.name} <input value={s.name} maxLength={40} onChange={(e: { target: { value: string } }) => set({ name: e.target.value })} /></label>
      <label>{T.level}
        <select value={s.level} onChange={(e: { target: { value: string } }) => setLevel(Number(e.target.value))}>
          {/* Kuyruk K49: oluşturucuda her zaman 1–20 (Serüven ilerlemesi ayrıca `ustSeviye` ile sınırlı). */}
          {Array.from({ length: UPPER_LEVEL_CAP }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </select>
      </label>
      <span className="seg" role="radiogroup" aria-label={T.avatar}>
        {(['erkek', 'kadin'] as const).map((g) => (
          <button key={g} role="radio" aria-checked={(s.gender ?? 'erkek') === g} className={(s.gender ?? 'erkek') === g ? 'on' : ''}
            onClick={() => set({ gender: g })}>{g === 'erkek' ? T.male : T.female}</button>
        ))}
      </span>
      {s.level >= experimentalFrom(s.classId, s.subclassId) && <p className="warn">{T.experimental(experimentalFrom(s.classId, s.subclassId))}</p>}
      {/* Kuyruk K49: 11+ seviyede henüz olmayan özellikler küçük notla (seçim kısıtlanmaz). */}
      {s.level >= 11 && missingFeatures(s.classId, s.level, s.subclassId).filter((f) => f.level >= 11).length > 0 && (
        <p className="mute">{T.notYet(missingFeatures(s.classId, s.level, s.subclassId).filter((f) => f.level >= 11).map((f) => f.name).join(', '))}</p>
      )}
    </div>
  );
}

/**
 * Tür (SD3): 6 öne çıkan tür kartı + "Diğer türler"; seçilen türün tek satırlık tanıtımı. Soy/kültür ve ten tonu
 * "Soy ve görünüm" altında katlı (varsayılan seçili); soy zorunlu ve boşsa açık gelir.
 */
function RaceStep({ sheet: s, set }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void }) {
  const T = t().builder;
  const W = T.wiz;
  const lang = getLang();
  const race = races.find((r) => r.id === s.raceId);
  const lineage = lineageOf(s);
  const abilities = lineageAbilityList(s);
  const featured = races.filter((r) => RACE_FEATURED.includes(r.id));
  const others = races.filter((r) => !RACE_FEATURED.includes(r.id));
  const card = (r: (typeof races)[number]) => (
    <button key={r.id} className={`pick-card${r.id === s.raceId ? ' on' : ''}`} aria-pressed={r.id === s.raceId}
      onClick={() => set({ raceId: r.id, lineageId: r.lineages?.[0]?.id, exileCulture: undefined })}>
      <b>{r.name}</b><small>{raceBlurb(r.id, lang)}</small>
    </button>
  );
  const hasLineage = !!race?.lineages && race.lineages.length > 0;
  return (
    <>
      <div className="card-grid">{featured.map(card)}</div>
      {others.length > 0 && (
        <Fold title={W.otherRaces(others.length)} open={others.some((r) => r.id === s.raceId)} className="race-more">
          <div className="card-grid">{others.map(card)}</div>
        </Fold>
      )}
      {race && (
        <div className="info-card race-card">
          <p><b>{race.name}</b> {raceBlurb(race.id, lang)}
            <InfoPop text={[W.speed(raceSpeed(s)), raceDarkvision(s) ? W.darkvision(raceDarkvision(s)) : '',
              race.resistances?.length || lineage?.resistances.length ? W.resist([...new Set([...race.resistances, ...(lineage?.resistances ?? [])])].join(', ')) : '',
              race.evKurali ? [CELESTIAL.hikaye[lang], ...CELESTIAL.ozellikler.map((o) => `${o[lang]}: ${o.metin[lang]}`)].join('\n') : race.traits,
              ...raceTraitLines(race.id, lang)].filter(Boolean).join(race.evKurali ? ' · ' : '\n')} /></p>
          {abilities.length > 0 && <LineageAbilities list={abilities} />}
        </div>
      )}
      {hasLineage && race && (
        <Fold title={race.id === 'human' ? W.cultureTitle : W.lineageTitle} summary={lineage ? lineageName(lineage, lang) : W.noneShort}
          open={!lineage && !race.lineageOptional} className="lineage-fold">
          <p className="mute race-note">{W.raceBonusNote}</p>
          {/* Görev K3: soy seçimi kartlarla; kartta yalnızca bu seçeneği ayıran özet. */}
          <div className="card-grid lineage-grid" role="radiogroup" aria-label={W.lineageTitle}>
            {(race.lineages ?? []).map((l) => (
              <button key={l.id} role="radio" aria-checked={l.id === lineage?.id} className={`pick-card lineage-card${l.id === lineage?.id ? ' on' : ''}`}
                onClick={() => set(race.id === 'human' ? pickCulture(s, l.id) : { lineageId: l.id })}>
                <b>{lineageName(l, lang)}</b>
                <small>{lineageSummary(l, lang)}</small>
              </button>
            ))}
          </div>
          {race.lineageOptional && !lineage && <p className="soft-warn">⚠ {W.lineageOptionalHint}</p>}
          {lineage && <LineageNotes raceId={race.id} lineage={lineage} />}
          {race.id === 'human' && (
            <>
              {/* Görev AS1b düzeltmesi: Sur Dışı'nda "Sürgün" seçimi (yalnız görünüm; buff/debuff Sur Dışı'nınki). */}
              {exileOptions(s.lineageId).length > 0 && (
                <>
                  <h4 className="lineage-title">{W.exileTitle}</h4>
                  <p className="mute race-note">{W.exileHelp}</p>
                  <div className="card-grid lineage-grid exile-grid" role="radiogroup" aria-label={W.exileTitle}>
                    {exileOptions(s.lineageId).map((id) => {
                      const on = s.exileCulture === id;
                      return (
                        <button key={id} type="button" role="radio" aria-checked={on} className={`pick-card exile-card${on ? ' on' : ''}`} data-exile={id}
                          onClick={() => set({ exileCulture: id, skinTone: cultureSkinTone(s.lineageId, s.skinTone, id) })}>
                          <b>{exileName(id, lang)}</b>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <h4 className="lineage-title">{W.skinTitle}</h4>
              {/* Ten tonu ayrı seçim; kültürün izin verdiği tonlar (`kulturTen`), tek tonlu kültürde kendiliğinden seçili. */}
              <div className="skin-tones" role="radiogroup" aria-label={W.skinTitle}>
                {tonesFor(s.lineageId, s.exileCulture).map((tone) => {
                  const on = cultureSkinTone(s.lineageId, s.skinTone, s.exileCulture) === tone.id;
                  return (
                    <button key={tone.id} type="button" role="radio" aria-checked={on} className={`skin-tone${on ? ' on' : ''}`} data-tone={tone.id} onClick={() => set({ skinTone: tone.id })}>
                      <i style={{ background: tone.rozetRenk }} />{tone.ad[lang]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Fold>
      )}
      {race?.evKurali && (
        <>
          <h4 className="lineage-title">{W.awakeningTitle}{s.level < CELESTIAL.awakening.minLevel ? ` · ${W.awakeningLocked}` : ''}</h4>
          {/* Kuyruk K20: Göksel Uyanış biçimi (soy kartlarıyla aynı yapı; 3. seviyeden etkin). */}
          <div className="card-grid lineage-grid" role="radiogroup" aria-label={W.awakeningTitle}>
            {AWAKENING_OPTIONS.map((id) => {
              const opt = CELESTIAL.awakening.secenekler[id] as AwakeningOption;
              const on = (s.celestialAwakening ?? CELESTIAL.awakening.default) === id;
              return (
                <button key={id} role="radio" aria-checked={on} className={`pick-card lineage-card${on ? ' on' : ''}`}
                  onClick={() => set({ celestialAwakening: id })}>
                  <b>{opt[lang]}</b>
                  <small>{opt.metin[lang]}</small>
                  {opt.debuff && <small className="awakening-debuff"><b>{W.lineageDebuff}:</b> {opt.debuff[lang]}</small>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/**
 * Geçmiş (SD3): "Geçmiş" katlı bölümü (varsayılan Asker seçili; başlıkta seçili geçmiş). Geçmiş; yetenek bonusunun hangi
 * üç yeteneğe gideceğini, köken feat'ini ve iki beceriyi belirler. Değişince dokunulmamış öneriler yenilenir; geçersiz
 * kalan seçimler silinmez, yok sayılır (Görev G1).
 */
function BackgroundStep({ c, setC, suggest }: { c: SavedCharacter; setC: StepProps['setC']; suggest?: boolean }) {
  const W = t().builder.wiz;
  const lang = getLang();
  const s = c.sheet;
  const bg = backgroundOf(s);
  const choose = (id: string) => setC((x) => {
    const next = { ...x, sheet: { ...x.sheet, backgroundId: id } };
    return suggest ? reSuggestAfterBackground(x, next) : next;
  });
  return (
    <Fold title={W.backgroundTitle} summary={bg ? bg.name[lang] : W.noneShort} open={!bg} className="background-fold">
      <p className="mute">{W.backgroundHelp}</p>
      {!bg && <p className="soft-warn">⚠ {W.backgroundMissing}</p>}
      <div className="card-grid background-grid" role="radiogroup" aria-label={W.backgroundTitle}>
        {backgrounds.map((b) => (
          <button key={b.id} role="radio" aria-checked={b.id === bg?.id} className={`pick-card background-card${b.id === bg?.id ? ' on' : ''}`}
            onClick={() => choose(b.id)}>
            <b>{b.name[lang]}</b>
            <small>{b.summary[lang]}</small>
          </button>
        ))}
      </div>
    </Fold>
  );
}

/**
 * Kuyruk AS1a/AS1b: seçili soyun buff/debuff açıklaması ve durum etiketi (çalışır / kısmi / planlı). Yalnız bu soyun FARKI
 * (taban türün özellikleri tür seçiminde görünür); buff'ı olmayan soyda yalnız debuff (buff'ı özet satırında).
 */
function LineageNotes(props: { raceId: string; lineage: NonNullable<ReturnType<typeof lineageOf>> }) {
  const W = t().builder.wiz;
  const n = lineageNotes(props.raceId, props.lineage, getLang());
  if (n.buff.length === 0 && n.debuff.length === 0) return null;
  // SD3: "çalışır / kısmi" etiketi gösterilmez; yalnız henüz oyunda olmayan (planlı) için küçük "yakında".
  const tag = n.status === 'planli' ? <span className="lineage-planned status-planli" data-status="planli">{W.soonTag}</span> : null;
  return (
    <div className="lineage-notes" data-testid="lineage-notes">
      {n.buff.length > 0 && <div className="buff"><b>{W.lineageBuff}</b>{tag}<ul>{n.buff.map((x) => <li key={x}>{x}</li>)}</ul></div>}
      <div className="debuff"><b>{W.lineageDebuff}</b>{n.buff.length === 0 && tag}<ul>{n.debuff.map((x) => <li key={x}>{x}</li>)}</ul></div>
    </div>
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

/**
 * Sınıf (SD3): 6 öne çıkan sınıf kartı (kartta tek cümle) + "Diğer sınıflar"; zar/kurtarma gibi ayrıntılar ⓘ'de;
 * alt sınıf (veride yoksa "Yakında") ve "Sınıf güçlerin" paneli.
 */
function ClassStep({ c, setC, set, suggest }: StepProps) {
  const T = t().builder;
  const W = T.wiz;
  const lang = getLang();
  const s = c.sheet;
  const cls = getClass(s.classId);
  const subLevel = subclassLevel(s.classId);
  // Görev AS2: tek liste (paket + imza + Karadul), hepsi her zaman seçilebilir; yalnız cinsiyet kuralı alt sınıfın kendisinde
  // (Karadul Çemberi kadın, İmparator erkek); mevcut seçim her zaman görünür.
  const subs = subclassesOf(s.classId).filter((x) => genderVisible(x, s));
  const chosen = subs.find((x) => x.id === s.subclassId);
  const swap = chosen?.ev && chosen.replaces?.length ? karadulSwapText(s) : null;
  // Görev K17: eski sınıfın seçimleri taslakta saklanır, geri dönünce uyanları gelir (`switchClass`). SD3: dokunulmamış
  // öneriler (beceri, geçmiş bonusu, donanım) yeni sınıfa göre yenilenir.
  const choose = (id: string) => setC((x) => {
    const next = switchClass(x, id, x.method === 'standard' ? { baseScores: suggestedScores(id) } : {});
    return suggest ? reSuggestAfterClassSwitch(x, next) : next;
  });
  const featured = classes.filter((k) => CLASS_FEATURED.includes(k.id));
  const others = classes.filter((k) => !CLASS_FEATURED.includes(k.id));
  const card = (k: (typeof classes)[number]) => (
    <button key={k.id} className={`pick-card${k.id === s.classId ? ' on' : ''}`} aria-pressed={k.id === s.classId} onClick={() => choose(k.id)}>
      <b>{k.name}</b><small>{classBlurb(k.id, lang)}</small>
    </button>
  );
  return (
    <>
      <div className="card-grid">{featured.map(card)}</div>
      {others.length > 0 && (
        <Fold title={W.otherClasses(others.length)} open={others.some((k) => k.id === s.classId)} className="class-more">
          <div className="card-grid">{others.map(card)}</div>
        </Fold>
      )}
      <p className="info-card">
        <b>{cls.name}</b> {classBlurb(cls.id, lang)}
        <InfoPop text={`${W.hitDie(cls.hitDie)} · ${W.saves(cls.saves.map((a) => a.toUpperCase()).join(', '))} · ${cls.casting ? W.castAbility(cls.casting.ability.toUpperCase()) : W.noCasting}${subLevel !== null ? ` · ${W.subclassAtLevel(subLevel)}` : ''}`} />
      </p>
      {subLevel !== null && subs.length === 0 && (
        <div className="coming-soon"><b>{W.comingSoon}</b><p>{W.comingSoonText}</p></div>
      )}
      {subLevel !== null && subs.length > 0 && s.level >= subLevel && (
        <label>{T.subclass}
          <select value={s.subclassId ?? ''} onChange={(e: { target: { value: string } }) => set({ subclassId: e.target.value || undefined })}>
            <option value="">{T.subclassNone}</option>
            {subs.map((x) => <option key={x.id} value={x.id}>{subclassLabel(x.name, getLang(), x.class)}{notWorkingCount(x) > 0 ? ` (${T.subclassNotWorking(notWorkingCount(x))})` : packExperimental(x) ? ` (${t().content.experimental})` : ''}</option>)}
            {/* Kuyruk K49 B5: listeden kaldırılmış alt sınıfı seçili eski karakter açılır (seçimi görünür kalır). */}
            {!!s.subclassId && !subs.some((x) => x.id === s.subclassId) && !subclassMissing(s.classId, s.subclassId) && (
              <option value={s.subclassId}>{subclassLabel(findSubclass(s.classId, s.subclassId)?.name ?? { tr: s.subclassId, en: s.subclassId }, getLang(), s.classId)}</option>
            )}
            {subclassMissing(s.classId, s.subclassId) && <option value={s.subclassId}>{T.subclassMissing(s.subclassId ?? '')}</option>}
          </select>
        </label>
      )}
      {swap && <p className="warn">{T.karadulWarn} {T.karadulSwap(swap)}</p>}
      {subLevel !== null && subs.length > 0 && s.level < subLevel && <p className="mute">{T.subclass}: {T.subclassAt(subLevel)}</p>}
      <FeaturesPanel classId={s.classId} level={s.level} subclassId={s.subclassId} experimentalFrom={experimentalFrom(s.classId, s.subclassId)}
        choices={s.featureChoices ?? {}} onChoose={(key, value) => set({ featureChoices: { ...(s.featureChoices ?? {}), [key]: value } })}
        metamagic={s.metamagic ?? []} onMetamagic={(ids) => set({ metamagic: ids })}
        invocations={s.invocations ?? []} onInvocations={(ids) => set({ invocations: ids })} known={s.spellNames ?? []}
        weapons={(s.weapons ?? []).map((w) => w.name)} pactWeapon={s.pactWeapon} onPact={(w) => set({ pactWeapon: w })}
        forms={s.wildShapeForms ?? []} onForms={(ids) => set({ wildShapeForms: ids })} />
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
  // Görev G1: geçmiş seçiliyse bonus yalnızca onun üç yeteneğine (diğerlerindeki eski değerler yok sayılır).
  const bg = backgroundOf(s);
  const bonuses = bonusesOf(s);
  const pattern = backgroundPattern(bonuses);
  const cost = pointBuyCost(s.baseScores);
  const [pick, setPick] = useState<Ability>('str');
  // Görev K2a: zarla 4d6. Aynı saf adım (`rollAbilityScores`) otomatik (Math.random) ya da elle zar defteri üstünden
  // (masa zarı: her 4d6 grubu istenir); atılan değerler kayıtta kalır, yeniden atılmaz.
  const applyRolled = (vals: number[]) => setC((x) => ({ ...x, method: 'roll', rolled: vals, sheet: { ...x.sheet, baseScores: rolledScores(x.sheet.classId, vals) } }));
  const dice = useDiceFlow<number[]>('everyone', () => true, applyRolled);
  const chips = c.method === 'standard' ? [...STANDARD_ARRAY] : c.method === 'roll' ? (c.rolled ?? []) : [];
  // Çiplerin sahibi (aynı değer birden çok kez atılabilir): her kutu sırayla eşit değerli ilk boş çipi alır.
  const holders: Array<Ability | undefined> = [];
  for (const a of ABILITIES) {
    const i = chips.findIndex((v, k) => v === s.baseScores[a] && holders[k] === undefined);
    if (i >= 0) holders[i] = a;
  }
  // Standart dizi ve zarla: bir değer yalnızca bir kutuda; seçilen değer başka kutudaysa ikisi yer değiştirir (Görev K16).
  const setScore = (a: Ability, v: number) => set({ baseScores: assignScore(c.method, s.baseScores, a, v) });
  const suggestion = suggestScores(c.method, s.classId, c.rolled);
  const setBonus = (a: Ability, v: number) => {
    // Görev G1: ham kayıt üstüne yazılır: başka geçmişin yeteneklerindeki değerler saklı kalır (geri dönünce gelir).
    const next = { ...(s.backgroundBonuses ?? {}) };
    if (v === 0) delete next[a]; else next[a] = v;
    set({ backgroundBonuses: next });
  };
  const patternText = pattern === '2-1' ? '+2 / +1' : pattern === '1-1-1' ? '+1 / +1 / +1' : '';
  const raiseCost = (a: Ability) => pointBuyCost({ ...s.baseScores, [a]: s.baseScores[a] + 1 });
  // SD3: varsayılanda altı skor salt okunur kartlar (sınıfa göre dağıtılmış + geçmiş bonusu); dağıtma araçları "Puanları kendin dağıt" altında.
  const attention = pattern === 'invalid' || (c.method === 'standard' && !usesStandardArray(s.baseScores));
  const [adv, setAdv] = useState(attention);
  const interactive = adv;
  const bonusLine = Object.entries(bonuses).filter(([, v]) => v).map(([k, v]) => `${abilityName(k as Ability)} +${v}`).join(', ');
  return (
    <>
      <p className="mute scores-auto">{c.method === 'standard' ? W.scoresAutoStd : W.scoresAutoOther}{bonusLine ? ` ${W.scoresAutoBg(bonusLine)}` : ''}</p>
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
          if (!interactive) return <div className="score-box" key={a}>{body}</div>;
          return c.method === 'standard' || c.method === 'roll' ? (
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
      <Fold title={W.scoresAdvanced} className="scores-adv" onOpenChange={setAdv}
        open={attention}>
        <div className="seg" role="radiogroup" aria-label={W.method}>
          <button role="radio" aria-checked={c.method === 'standard'} className={c.method === 'standard' ? 'on' : ''}
            onClick={() => setC((x) => ({ ...x, method: 'standard', sheet: { ...x.sheet, baseScores: suggestedScores(x.sheet.classId) } }))}>{T.standard}</button>
          <button role="radio" aria-checked={c.method === 'pointBuy'} className={c.method === 'pointBuy' ? 'on' : ''}
            onClick={() => setC((x) => ({ ...x, method: 'pointBuy', sheet: { ...x.sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }))}>{T.pointBuy}</button>
          <button role="radio" aria-checked={c.method === 'roll'} className={c.method === 'roll' ? 'on' : ''}
            onClick={() => (c.rolled ? applyRolled(c.rolled) : setC((x) => ({ ...x, method: 'roll' })))}>{T.rollMethod}</button>
        </div>
        {c.method === 'roll' && !c.rolled && (
          <div className="roll-box">
            <p className="mute">{T.rollHelp}</p>
            <button className="cta" onClick={() => applyRolled(rollAbilityScores(Math.random))}>{T.rollAuto}</button>
            <button onClick={() => dice.play(rollAbilityScores)}>{T.rollManual}</button>
          </div>
        )}
        {c.method === 'roll' && c.rolled && <p className="mute">{T.rolledDone(c.rolled.join(', '))}</p>}
        {dice.pending && (
          <DicePrompt key={dice.pending.step} request={dice.pending.request} whoName={s.name || null}
            onEnter={dice.enter} onAuto={dice.autoRoll} onCancel={dice.cancel} />
        )}
        {c.method === 'pointBuy' && (
          <div className="points-bar">
            <span className={cost !== null && cost <= POINT_BUY_BUDGET ? '' : 'error'}>{W.pointsLeft(POINT_BUY_BUDGET - (cost ?? POINT_BUY_BUDGET), POINT_BUY_BUDGET)}</span>
            <span className="meter"><span style={{ width: `${Math.min(100, ((cost ?? 0) / POINT_BUY_BUDGET) * 100)}%` }} /></span>
          </div>
        )}
        {chips.length > 0 && (
          <div className="scores-help">
            {/* Görev K16: kısa açıklama, sınıfa göre öneri, sıfırlama. */}
            <p className="mute">{c.method === 'standard' ? W.arrayHelp : W.rolledHelp}</p>
            <div className="gm-row">
              {suggestion && <button onClick={() => set({ baseScores: suggestion })}>{W.suggest}</button>}
              <button className="ghost" onClick={() => set({ baseScores: resetScores(c.method, c.rolled) })}>{W.resetScores}</button>
            </div>
          </div>
        )}
        {chips.length > 0 && (
          <div className="array-chips" role="group" aria-label={W.arrayTitle(abilityName(pick))}>
            <span className="mute">{W.arrayTitle(abilityName(pick))}</span>
            {chips.map((v, i) => {
              const holder = holders[i];
              const mine = holder === pick;
              return (
                <button key={i} className={`value-chip${mine ? ' on' : ''}${holder && !mine ? ' used' : ''}`} aria-pressed={mine}
                  aria-label={W.arrayValue(v, holder ? abilityName(holder) : null)} onClick={() => setScore(pick, v)}>
                  <b>{v}</b>{holder && !mine ? <small>{holder.toUpperCase()}</small> : null}
                </button>
              );
            })}
            <InfoPop text={W.chipNote} />
          </div>
        )}
        <div className="bonus-box bg-line">
          <p className={pattern === 'invalid' ? 'error' : 'mute'}>
            <b>{T.bgTitle}:</b> {pattern === '2-1' || pattern === '1-1-1' ? T.bgDone(patternText) : T.bgHelp}
            {bg && <> {W.bgOnly(bg.abilities.map((a) => abilityName(a)).join(', '))}</>}
          </p>
          <div className="bonus-grid">
            {ABILITIES.filter((a) => !bg || bg.abilities.includes(a)).map((a) => {
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
      </Fold>
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
  const created = Object.fromEntries(ABILITIES.map((ab) => [ab, Math.min(20, s.baseScores[ab] + (bonusesOf(s)[ab] ?? 0))])) as Scores;
  const before = scoresBeforeSlot(created, s.advancements, props.slot.level);
  const left = asiPointsLeft(a);
  const step = (ab: Ability, d: 1 | -1) => {
    const next = asiStep(before, props.slot.level, a, ab, d);
    props.onChange(next ?? { level: props.slot.level, featId: ASI_FEAT, abilities: {} });
  };
  const W = T.wiz;
  const on2 = (ab: Ability) => a?.featId === ASI_FEAT && a.abilities?.[ab] === 2 && Object.keys(a.abilities).length === 1;
  const rec = recommendedAsi(s, props.slot.level, s.advancements ?? [])?.abilities;
  const recAb = rec ? (Object.keys(rec)[0] as Ability) : undefined;
  return (
    <div className="asi-card">
      <p className="asi-head"><strong className={left > 0 ? 'asi-left' : 'ok'}>{T.asiSlotLeft(left)}</strong> <InfoPop text={T.asiRule} /></p>
      {/* SD3: hızlı seçim: bir yeteneğe +2 (skor 20'yi aşmayanlar); önerilen ★; +1/+1 ya da elle dağıtım katlı. */}
      <div className="chips asi-quick" role="group" aria-label={W.asiQuick}>
        {ABILITIES.filter((ab) => before[ab] + 2 <= 20 || on2(ab)).map((ab) => (
          <button key={ab} type="button" className={`chip${on2(ab) ? ' on' : ''}`} aria-pressed={on2(ab)}
            onClick={() => props.onChange({ level: props.slot.level, featId: ASI_FEAT, abilities: { [ab]: 2 } })}>
            {abilityName(ab)} +2{ab === recAb ? ' ★' : ''}</button>
        ))}
      </div>
      <Fold title={W.asiSplit} className="asi-split">
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
      </Fold>
    </div>
  );
}

/**
 * Beceriler (SD3): üstte sayaçlar ve seçili beceriler (önerilen sınıf becerileri hazır gelir), "Zaten sende" (geçmişten,
 * kilitli); değiştirmek için "Becerileri değiştir" (yalnızca sınıfın listesi), ek beceri ve uzmanlık katlı. Limit dolunca
 * kalanlar kilitlenir ve nedeni söylenir. Kural aynı: sınıf becerisi sayısı sınıf tablosundan, geçmişin iki becerisi
 * kilitli, serbest hak 3 − 2, uzmanlık yalnız yetkin olunan becerilerde (Görev K20, G1).
 */
function SkillsStep({ c, setC, set }: StepProps) {
  const W = t().builder.wiz;
  const s = c.sheet;
  const cls = getClass(s.classId);
  const kit = classKit(s.classId, s.level, s.subclassId);
  const classList: Skill[] = cls.skillChoices.from === 'any' ? SKILL_IDS : cls.skillChoices.from;
  const classMax = cls.skillChoices.count + kit.extraClassSkills;
  const bg = backgroundOf(s);
  const bgSkills = backgroundSkills(s);
  const otherMax = otherSkillMax(s);
  const other = otherSkillsOf(c);
  const known = [...c.classSkills, ...bgSkills, ...other];
  const expertise = (s.expertise ?? []).filter((k) => known.includes(k));
  const abil = (k: Skill) => SKILLS[k].ability.toUpperCase();
  const classFull = c.classSkills.length >= classMax;
  const otherFull = other.length >= otherMax;
  const pickClass = (k: Skill, on: boolean) => setC((x) => ({ ...x, classSkills: toggle(x.classSkills, k, on) }));
  const pickOther = (k: Skill, on: boolean) => setC((x) => ({ ...x, otherSkills: toggle(otherSkillsOf(x), k, on) }));
  const line = (k: Skill, extra?: ReactNode) => (
    <li key={k} className="skill-row on"><span className="skill-name">{skillName(k)} <small>{abil(k)}</small></span>{extra}</li>
  );
  return (
    <>
      <div className="counters">
        <span className={c.classSkills.length === classMax ? 'ok' : ''}>{W.countClass(c.classSkills.length, classMax)}</span>
        {otherMax > 0 && <span>{bg ? W.countOther(other.length, otherMax) : W.countBackground(other.length, otherMax)}</span>}
        {kit.expertise > 0 && <span className={expertise.length === kit.expertise ? 'ok' : ''}>{W.countExpertise(expertise.length, kit.expertise)}</span>}
      </div>
      <h3>{W.skillsChosen}</h3>
      <ul className="skill-list">
        {c.classSkills.map((k) => bgSkills.includes(k)
          ? (
            <li key={k} className="skill-row on conflict">
              <span className="skill-name">{skillName(k)} <small>{abil(k)}</small></span>
              <small className="error skill-conflict">{W.skillConflict}</small>
              <button className="badge cls on conflict" aria-pressed={true} onClick={() => pickClass(k, false)}>⚠ {W.skillClass} ×</button>
            </li>
          )
          : line(k, <button className="ghost eq-remove" aria-label={W.removeItem(skillName(k))} onClick={() => pickClass(k, false)}>×</button>))}
        {other.map((k) => line(k, <button className="ghost eq-remove" aria-label={W.removeItem(skillName(k))} onClick={() => pickOther(k, false)}>×</button>))}
      </ul>
      {c.classSkills.length + other.length === 0 && <p className="mute">{W.skillsNone}</p>}
      <Fold title={W.skillsChange} summary={W.countClass(c.classSkills.length, classMax)} open={c.classSkills.length < classMax} className="skills-pick">
        {classFull && <p className="mute limit-note">{W.limitFull(classMax)}</p>}
        <div className="chips">
          {classList.filter((k) => !bgSkills.includes(k) && !other.includes(k)).map((k) => {
            const on = c.classSkills.includes(k);
            return (
              <button key={k} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && classFull}
                title={!on && classFull ? W.limitFull(classMax) : undefined} onClick={() => pickClass(k, !on)}>{skillName(k)} <small>{abil(k)}</small></button>
            );
          })}
        </div>
      </Fold>
      {otherMax > 0 && (
        <Fold title={W.skillsOther} summary={W.countOther(other.length, otherMax)} className="skills-other">
          {otherFull && <p className="mute limit-note">{W.limitFull(otherMax)}</p>}
          <div className="chips">
            {SKILL_IDS.filter((k) => !bgSkills.includes(k) && !c.classSkills.includes(k)).map((k) => {
              const on = other.includes(k);
              return (
                <button key={k} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && otherFull}
                  title={!on && otherFull ? W.limitFull(otherMax) : undefined} onClick={() => pickOther(k, !on)}>{skillName(k)} <small>{abil(k)}</small></button>
              );
            })}
          </div>
        </Fold>
      )}
      {kit.expertise > 0 && (
        <Fold title={W.skillsExpert} summary={W.countExpertise(expertise.length, kit.expertise)} open className="skills-expert">
          <p className="mute">{W.expertHelp}</p>
          {expertise.length >= kit.expertise && <p className="mute limit-note">{W.limitFull(kit.expertise)}</p>}
          <div className="chips">
            {known.map((k) => {
              const exp = expertise.includes(k);
              return (
                <button key={k} type="button" className={`chip${exp ? ' on' : ''}`} aria-pressed={exp} disabled={!exp && expertise.length >= kit.expertise}
                  title={!exp && expertise.length >= kit.expertise ? W.limitFull(kit.expertise) : undefined}
                  onClick={() => set({ expertise: toggle(s.expertise ?? [], k, !exp) })}>{skillName(k)}</button>
              );
            })}
          </div>
        </Fold>
      )}
      {bgSkills.length > 0 && bg && (
        <>
          <h3>{W.skillsHave}</h3>
          <ul className="skill-list have">
            {bgSkills.map((k) => line(k, <span className="badge bg locked" title={W.skillFromBg(bg.name[getLang()])}>🔒 {W.skillFromBg(bg.name[getLang()])}</span>))}
          </ul>
        </>
      )}
    </>
  );
}

/** 6. Seviye ilerlemesi: köken feat'i (ayrı kutu, Skilled becerileri), ASI/feat yuvaları, Fighting Style. */
function ProgressStep({ c, setC, set }: StepProps) {
  const [featMode, setFeatMode] = useState<Record<number, boolean>>({});
  return <AdvancementPanel c={c} setC={setC} sheet={c.sheet} set={set} featMode={featMode} setFeatMode={(level, on) => setFeatMode((m) => ({ ...m, [level]: on }))} />;
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
  const lim = spellLimits(s.classId, s.level, s.featureChoices, s.invocations);
  const cnt = spellCounts(s);
  const chosen = s.spellNames ?? [];
  const list = classSpellList(s.classId);
  const altKit = alternativeCantrips(s);
  const alt = altKit.options.filter((n) => !list.some((x) => x.name === n));
  // Kuyruk 30 D4: Blessed Warrior gibi seçenekten gelen cantrip'lerin sayacı ve sınırı (kendi listesinde olmayanlar).
  const altCount = chosen.filter((n) => alt.includes(n)).length;
  // Kuyruk 18 H3: başka sınıf listeleri (Magical Discoveries: en çok `discoveryCap`; Magical Secrets: sınırsız).
  const ownNames = new Set(list.map((x) => x.name));
  const extra = spellOptions(s.classId, s.level, s.subclassId).filter((n) => !ownNames.has(n) && !alt.includes(n));
  const cap = discoveryCap(s.classId, s.level, s.subclassId);
  const extraCount = chosen.filter((n) => extra.includes(n)).length;
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
    // SD3: oyunda olmayan ve her zaman hazır büyüler listede gizlenir (her zaman hazır olanlar üstte tek satırda yazılır).
    if (!sp || kit.alwaysPrepared.includes(x.name)) return null;
    return (
      <li key={x.id} className={`spell-row${on ? ' on' : ''}`} title={sp.mechanics.unsupported ?? sp.mechanics.approx ?? undefined}>
        <span className="spell-name">{x.name}<InfoPop text={describeTr('buyu', sp.id) ?? ''} />{sp.mechanics.unsupported ? <InfoTip text={T.spellNotWorking} /> : null}
          {/* Kuyruk MB7: güncel sürümde savaşta çalışan büyü (Phantom Steed `mb7`) savaş dışı sayılmaz. */}{(sp.mechanics.mb7?.offCombat ?? sp.mechanics.offCombat) ? <small className="tag-offcombat" title={T.spellOffCombatTip}>{T.spellOffCombat}</small> : null}</span>
        {book && x.level > 0 && (
          <button className={`badge book${inBook ? ' on' : ''}`} aria-pressed={inBook} disabled={!inBook && cnt.book.length >= (lim.spellbook ?? 0)}
            title={!inBook && cnt.book.length >= (lim.spellbook ?? 0) ? W.limitFull(lim.spellbook ?? 0) : undefined}
            onClick={() => toggleBook(x.name, !inBook)}>{inBook ? W.spellBookOn : W.spellBookTag}</button>
        )}
        {/* Görev K18: Öğren/Öğrenildi (cantrip), Hazırla/Hazırlandı; tekrar dokununca kaldırılır. */}
        <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} aria-label={`${x.name}: ${x.level === 0 ? (on ? W.spellKnowOn : W.spellKnowTag) : (on ? W.spellPrepOn : W.spellPrepTag)}`}
          disabled={!on && (full || (book && x.level > 0 && !inBook))}
          title={!on && full ? W.limitFull(x.level === 0 ? lim.cantrips : lim.prepared) : !on && book && x.level > 0 && !inBook ? W.spellNeedBook : undefined}
          onClick={() => toggleSpell(x.name, !on)}>{x.level === 0 ? (on ? W.spellKnowOn : W.spellKnowTag) : (on ? W.spellPrepOn : W.spellPrepTag)}</button>
      </li>
    );
  };
  return (
    <>
      <p className="counters">
        <span className={cnt.cantrips > lim.cantrips ? 'error' : cnt.cantrips === lim.cantrips ? 'ok' : ''}>{W.countCantrips(cnt.cantrips, lim.cantrips)}</span>
        <span className={cnt.prepared > lim.prepared ? 'error' : cnt.prepared === lim.prepared ? 'ok' : ''}>{W.countPrepared(cnt.prepared, lim.prepared)}</span>
        {book && <span className={cnt.book.length > (lim.spellbook ?? 0) ? 'error' : ''}>{W.countBook(cnt.book.length, lim.spellbook ?? 0)}</span>}
        {alt.length > 0 && <span className={altCount > altKit.max ? 'error' : altCount === altKit.max ? 'ok' : ''}>{W.countAlt(altCount, altKit.max)}</span>}
      </p>
      {kit.alwaysPrepared.length > 0 && <p className="mute">{T.alwaysPrepared(kit.alwaysPrepared.join(', '))}</p>}
      <h3>{W.spellsChosen}</h3>
      {chosen.length === 0 && <p className="mute">{W.spellsNone}</p>}
      <ul className="eq-list spells-chosen">
        {chosen.map((n) => {
          const sp = spells.find((x) => x.name === n);
          return (
            <li key={n} className="eq-row on"><span className="eq-main"><b>{n}</b><small>{(sp?.level ?? 0) === 0 ? W.cantripGroup : W.levelGroup(sp?.level ?? 0)}</small></span>
              {sp && <InfoPop text={describeTr('buyu', sp.id) ?? ''} />}
              <button className="ghost eq-remove" aria-label={W.removeItem(n)} onClick={() => toggleSpell(n, false)}>×</button></li>
          );
        })}
      </ul>
      <Fold title={W.spellsAdd} className="spells-add" open={chosen.length === 0}>
        {/* SD3: erişilemeyen seviyeler gizlenir; yalnız şu an seçilebilen gruplar. */}
        {levels.filter((lv) => lv <= lim.maxLevel).map((lv) => {
          const rows = list.filter((x) => x.level === lv);
          const title = lv === 0 ? W.cantripGroup : W.levelGroup(lv);
          return (
            <section key={lv} className="spell-group">
              <h3>{title}</h3>
              <ul className="spell-list">{rows.map(row)}</ul>
            </section>
          );
        })}
        {levels.some((lv) => lv > lim.maxLevel) && <p className="mute">{W.spellsLockedHint}</p>}
        {alt.length > 0 && (
          <section className="spell-group">
            <h3>{W.altCantrips}</h3>
            <ul className="spell-list">{alt.map((n) => {
              const on = chosen.includes(n);
              return (
                <li key={n} className={`spell-row${on ? ' on' : ''}`}><span className="spell-name">{n}</span>
                  <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && altCount >= altKit.max} onClick={() => toggleSpell(n, !on)}>{on ? W.spellKnowOn : W.spellKnowTag}</button></li>
              );
            })}</ul>
          </section>
        )}
        {extra.length > 0 && (
          <section className="spell-group">
            <h3>{T.otherLists}{cap ? ` (${extraCount} / ${cap})` : ''}</h3>
            <ul className="spell-list">{extra.map((n) => {
              const on = chosen.includes(n);
              const lv = spells.find((x) => x.name === n)?.level ?? 0;
              const full = cap ? extraCount >= cap : lv === 0 ? cnt.cantrips >= lim.cantrips : cnt.prepared >= lim.prepared;
              return (
                <li key={n} className={`spell-row${on ? ' on' : ''}`}><span className="spell-name">{n} <small className="mute">{lv === 0 ? W.cantripGroup : W.levelGroup(lv)}</small></span>
                  <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && full} onClick={() => toggleSpell(n, !on)}>{on ? W.spellPrepOn : W.spellPrepTag}</button></li>
              );
            })}</ul>
          </section>
        )}
      </Fold>
    </>
  );
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
  const bonuses = bonusesOf(s);
  const pattern = backgroundPattern(bonuses);
  const bg = backgroundOf(s);
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
        {/* Görev K9e: dağıtılmamış geçmiş bonusu eksik sayılmaz (kaydı engellemez); yalnızca yumuşak uyarı. */}
        {pattern !== '2-1' && pattern !== '1-1-1' && <li className="soft-warn">⚠ {T.sumNoBackground}</li>}
        {(pattern === '2-1' || pattern === '1-1-1') && <li>{T.sumBackground((bg ? `${bg.name[getLang()]} · ` : '') + ABILITIES.filter((a) => bonuses[a]).map((a) => `${a.toUpperCase()} +${bonuses[a]}`).join(', '),
          [...backgroundSkills(s), ...otherSkillsOf(final)].map((k) => skillName(k)).join(', ') || '—')}</li>}
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
 * Görev G1: Magic Initiate (Acolyte: Cleric, Sage: Wizard) seçimi: iki cantrip ve bir 1. seviye büyü; seçimler liste
 * başına saklanır (geçmiş değişip geri gelince döner).
 */
function MagicInitiatePicker({ sheet: s, set, list }: { sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void; list?: string }) {
  const T = t().builder;
  const W = T.wiz;
  // F1: yuvadan alınan Magic Initiate kendi listesiyle; yoksa geçmişinki.
  const mi = list ? magicInitiateAll(s).find((x) => x.list === list) : magicInitiateOf(s);
  if (!mi || !mi.list) return null;
  const opt = magicInitiateOptions(mi.list);
  const listName = getClass(mi.list).name;
  const cur = { cantrips: mi.cantrips, ...(mi.spell ? { spell: mi.spell } : {}), ability: mi.ability };
  const put = (patch: Partial<MagicInitiatePick>) => set({ magicInitiate: { ...(s.magicInitiate ?? {}), [mi.list]: { ...cur, ...patch } } });
  const toggleCantrip = (n: string, on: boolean) => put({ cantrips: on ? [...mi.cantrips, n] : mi.cantrips.filter((x) => x !== n) });
  return (
    <div className="mi-picker">
      <h4>{T.miTitle(listName)}</h4>
      <p className="counters"><span className={mi.cantrips.length === 2 ? 'ok' : ''}>{T.miCantrips(mi.cantrips.length)}</span></p>
      <ul className="spell-list">{opt.cantrips.map((n) => {
        const on = mi.cantrips.includes(n);
        return (
          <li key={n} className={`spell-row${on ? ' on' : ''}`}><span className="spell-name">{n}</span>
            <button className={`badge prep${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && mi.cantrips.length >= 2}
              onClick={() => toggleCantrip(n, !on)}>{on ? W.spellKnowOn : W.spellKnowTag}</button></li>
        );
      })}</ul>
      <label>{T.miSpell}
        <select value={mi.spell ?? ''} onChange={(e: { target: { value: string } }) => put({ spell: e.target.value || undefined })}>
          <option value="">{T.noFeat}</option>
          {opt.spells.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      {/* F1: SRD 5.2.1: büyü yeteneği INT, WIS ya da CHA (feat alınırken seçilir); varsayılan listeye uygun olan. */}
      <label>{T.miAbility}
        <select value={mi.ability} onChange={(e: { target: { value: string } }) => put({ ability: e.target.value as MagicInitiatePick['ability'] })}>
          {(['int', 'wis', 'cha'] as const).map((ab) => <option key={ab} value={ab}>{abilityName(ab)}</option>)}
        </select>
      </label>
      <p className="mute">{T.miNote}</p>
    </div>
  );
}

/**
 * Köken feat'i ve seviye yuvaları. ASI alabilen yuvada "Yetenek artışı / Feat" geçişi: yetenek artışı skor
 * satırlarındaki sayaçla yapılır (Görev M4); feat seçilirse sayaç kapanır, feat'in kendi +1'i burada seçilir.
 */
function AdvancementPanel(props: {
  c: SavedCharacter; setC: StepProps['setC'];
  sheet: CharacterSheet; set: (patch: Partial<CharacterSheet>) => void;
  featMode: Record<number, boolean>; setFeatMode: (level: number, on: boolean) => void;
}) {
  const T = t().builder;
  const s = props.sheet;
  const bg = backgroundOf(s);
  const slots = advancementSlots(s.classId, s.level, s.subclassId);
  const ctx = { scores: finalScores({ ...s, advancements: [] }), casterClass: getClass(s.classId).casting !== null };
  const asiOk = new Set(asiCapableSlots(s, ctx.scores).map((x) => `${x.level}:${x.kind}`));
  const list = s.advancements ?? [];
  const put = (slot: AdvancementSlot, next: Advancement | null) => props.set({ advancements: withSlot(list, slot, next) });
  const originId = originFeatOf(s);
  const slotSummary = (slot: AdvancementSlot, a: Advancement | undefined): string => {
    if (!a) return T.wiz.slotEmpty;
    if (a.featId === ASI_FEAT) {
      const parts = ABILITIES.filter((ab) => a.abilities?.[ab]).map((ab) => `${abilityName(ab)} +${a.abilities?.[ab]}`);
      return parts.length ? parts.join(', ') : T.wiz.slotEmpty;
    }
    return featById(a.featId)?.name ?? slotAlternativeById(a.featId)?.name ?? a.featId;
  };
  return (
    <section className="panel">
      <h2>{T.progress}</h2>
      {/* Görev K20: köken feat'i ayrı kutuda (ASI/feat yuvalarından ayrı). SD3: tek satır + kısa açıklama; ayrıntı ⓘ'de. */}
      <div className="origin-box">
        <h3>{T.originTitle} <InfoPop text={T.originHelp} /></h3>
        {/* Görev G1: geçmiş seçiliyse köken feat'i geçmişten, kilitli bilgi; eski kayıtta serbest seçim + "Geçmiş seç" önerisi. */}
        {bg ? (
          <p className="origin-locked">🔒 <b>{T.originLocked(featById(bg.feat)?.name ?? bg.feat)}</b> <InfoPop text={T.originFrom(bg.name[getLang()])} /></p>
        ) : (
          <>
            <p className="soft-warn">⚠ {T.originNoBackground}</p>
            <div className="form-row">
              <label>{T.originFeat}
                <select value={s.originFeat ?? ''} onChange={(e: { target: { value: string } }) => props.set({ originFeat: e.target.value || undefined })}>
                  <option value="">{T.noFeat}</option>
                  {originFeats().map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
            </div>
          </>
        )}
        {originId && <FeatCard id={originId} />}
        {magicInitiateOf(s) && <MagicInitiatePicker sheet={s} set={props.set} />}
        {featSkillCount(props.c) > 0 && (
          <Fold title={T.skilledTitle(featSkillCount(props.c))} summary={T.skilledCount((props.c.featSkills ?? []).length, featSkillCount(props.c))}
            open={(props.c.featSkills ?? []).length !== featSkillCount(props.c)} className="skilled-fold">
            <SkilledPicker c={props.c} setC={props.setC} />
          </Fold>
        )}
      </div>
      {slots.length > 0 && <h3>{T.slotsTitle}</h3>}
      {slots.map((slot) => {
        const a = slotAdvancement(list, slot);
        const canAsi = asiOk.has(`${slot.level}:${slot.kind}`);
        const featChosen = a ? a.featId !== ASI_FEAT : !!props.featMode[slot.level];
        const asiMode = canAsi && !featChosen;
        const inc = a && a.featId !== ASI_FEAT ? featMechanic(a.featId)?.abilityIncrease : undefined;
        const options = featOptions(slot, ctx).filter((f) => f.id !== ASI_FEAT);
        // Fighting Style yuvasında feat yerine seçenek (Blessed Warrior; veriden).
        const alts = slot.kind === 'style' ? classKit(s.classId, s.level, s.subclassId).slotAlternatives.filter((x) => x.level === slot.level) : [];
        const incomplete = !a || (asiMode && asiPointsLeft(a) > 0);
        return (
          <Fold key={`${slot.level}:${slot.kind}`} title={T.slot[slot.kind](slot.level)} summary={slotSummary(slot, a)}
            open={incomplete || slots.length === 1} className="advancement">
            {canAsi && (
              <div className="form-row">
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
              </div>
            )}
            {asiMode ? (
              <AsiSlotCard sheet={s} slot={slot} advancement={a} onChange={(next) => put(slot, next)} />
            ) : (
              <div className="form-row">
                <label>
                  <select aria-label={T.slot[slot.kind](slot.level)} value={a?.featId ?? ''} onChange={(e: { target: { value: string } }) =>
                    put(slot, e.target.value ? { level: slot.level, featId: e.target.value } : null)}>
                    <option value="">{T.noFeat}</option>
                    {options.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    {alts.map((x) => <option key={x.id} value={x.id}>{T.altOption(x.name, x.cantrips)}</option>)}
                  </select>
                </label>
                {a && inc && <IncreasePicker advancement={a} amount={inc.amount ?? 1}
                  choices={inc.choices ?? ABILITY_OPTIONS} onChange={(abilities) => put(slot, { ...a, abilities })} />}
              </div>
            )}
            {a && a.featId !== ASI_FEAT && slot.kind !== 'style' && <FeatCard id={a.featId} />}
            {/* F1: yuvadan alınan Magic Initiate: liste (her seferinde farklı) ve seçimler. */}
            {a?.featId === 'magic-initiate' && (
              <>
                <label>{T.miList}
                  <select value={a.list ?? ''} onChange={(e: { target: { value: string } }) => put(slot, { ...a, ...(e.target.value ? { list: e.target.value } : { list: undefined }) })}>
                    <option value="">{T.noFeat}</option>
                    {MI_LISTS.map((l) => <option key={l} value={l}>{getClass(l).name}</option>)}
                  </select>
                </label>
                {a.list && <MagicInitiatePicker sheet={s} set={props.set} list={a.list} />}
              </>
            )}
            {/* Görev K20: Dövüş Stili: seçili stilin kartı; diğer seçeneklerin açıklamaları katlı. */}
            {slot.kind === 'style' && (
              <>
                {a && isStyleChoice(a.featId) && !alts.some((x) => x.id === a.featId) && <FeatCard id={a.featId} selected />}
                <Fold title={T.wiz.readOptions(options.length)} className="feat-cards-fold">
                  <div className="feat-cards">
                    {options.map((f) => <FeatCard key={f.id} id={f.id} selected={a?.featId === f.id} />)}
                  </div>
                </Fold>
              </>
            )}
            {a && alts.some((x) => x.id === a.featId) && <p className="mute feat-note">{T.altNote(alts.find((x) => x.id === a.featId)?.cantrips ?? 0)}</p>}
          </Fold>
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

/**
 * Görev K20: feat açıklama kartı: "Ne yapar?" ve "Örnek" (data/aciklamalar.json `feats`, TR/EN); çevirisi olmayan
 * feat'te SRD metni ve "Türkçe çeviri yok" notu. Altında oyundaki durum (FeatNote).
 */
function FeatCard(props: { id: string; selected?: boolean }) {
  const T = t().builder;
  const lang = getLang();
  const info = featInfo(props.id, lang);
  const f = featById(props.id) ?? slotAlternativeById(props.id);
  // SD3: ana satırda yalnız "ne yapar" (düz Türkçe); örnek, SRD faydaları ve İngilizce ad ⓘ'de.
  const detail = info ? `${T.featExample} ${info.example}` : '';
  return (
    <div className={`feat-card${props.selected ? ' selected' : ''}`}>
      <b>{f?.name ?? props.id}</b> {detail && <InfoPop text={detail} />}
      {info ? <p>{info.what}</p> : lang === 'tr' && <p className="mute">{T.featNoTr}</p>}
    </div>
  );
}

/**
 * Görev K20: Skilled'ın becerileri (feat başına 3). Başka kaynaktan (sınıf, geçmiş/tür) zaten gelen beceri seçilemez,
 * nedeni yanında yazar. Eksik ya da fazla seçim kaydı engeller (`characterIssues`).
 */
function SkilledPicker({ c, setC }: { c: SavedCharacter; setC: StepProps['setC'] }) {
  const T = t().builder;
  const need = featSkillCount(c);
  const chosen = c.featSkills ?? [];
  const toggle = (k: Skill) => setC((x) => {
    const cur = x.featSkills ?? [];
    return { ...x, featSkills: cur.includes(k) ? cur.filter((y) => y !== k) : [...cur, k] };
  });
  return (
    <div className="skilled-picker">
      <h4>{T.skilledTitle(need)} <span className={chosen.length === need ? 'ok' : 'warn'}>{T.skilledCount(chosen.length, need)}</span></h4>
      <p className="mute">{T.skilledTools}</p>
      <div className="skill-grid">
        {SKILL_IDS.map((k) => {
          const from = c.classSkills.includes(k) ? 'class' : (otherSkillsOf(c).includes(k) || backgroundSkills(c.sheet).includes(k)) ? 'other' : null;
          const on = chosen.includes(k);
          return (
            <label key={k} className={`skill-pick${on ? ' on' : ''}${from ? ' taken' : ''}`}>
              <input type="checkbox" checked={on} disabled={!!from && !on || (!on && chosen.length >= need)} onChange={() => toggle(k)} />
              {' '}{skillName(k)}{from && <small className="mute"> ({T.skilledTaken(T.skilledFrom[from])})</small>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

