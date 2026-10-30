/**
 * Haritalı savaş ekranı (Adım 10a/10b): harita tam ekran, arayüz haritanın üstünde yüzen
 * parçalar (HUD). Sırası gelen savaşçının jetonunun yanında yüzen eylem menüsü, hedefin
 * yanında önizleme balonu, üstte avatarlı sıra şeridi, köşede savaş günlüğü ve toast'lar,
 * karakter çekmecesi. Hareketli katman ve harita kuralları (Adım 8) henüz yok; animasyonlar
 * en sona bırakıldı (Adım 12).
 */
import { metamagicProblem, TRANSMUTE_TYPES } from './battle/sorcerer';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { Spell } from './data';
import { resourceLeft, type AttackOption, type BattleState, type Combatant, type Command, type CunningOption } from './battle';
import { resourceDef, resourceUsable } from './rules/classFeatures';
import { maps } from './map/maps';
import { economyBlock, preferBonus } from './battle/economy';
import { optionalRules, ruleOf, stuckInBog } from './battle/maprules';
import { standUpProblem } from './battle/grapple';
import { rageProblem, recklessProblem } from './battle/rage';
import { CUNNING, cunningOptions, hasTrait, usedThisTurn } from './battle/classTraits';
import { offhandProblem } from './battle/offhand';
import { featureProblem } from './battle/divine';
import { focusActionProblem, stunningProblem } from './battle/martial';
import { civiliansAlive } from './battle/common';
import { hexLabel, occupantAt, speedHexes } from './battle/movement';
import { speedZero as hasSpeedZero } from './rules/conditions';
import { distance, hexKey, sameHex, type Offset } from './rules/hex';
import { SKILLS, SKILL_IDS, skillBonus } from './rules/skills';
import { GM_CONTEXT, contextFor, dispatch, type Session } from './ui/session';
import { t, useLang } from './i18n';
import { abilityTip, lineageAbilityList } from './ui/lineageText';
import { describeEvents, hexText } from './ui/log';
import { CIVILIAN_LOOKS, displayName } from './battle/civilianLooks';
import { execute } from './battle';
import { pushOutcome, shoveDc, shoveHex } from './battle/forced';
import { jumpTargets, lavaOver } from './battle/jumprisk';
import { sleepingDragon, wakeRule } from './battle/dragon';
import {
  VIEW, allHexes, attackChoices, gmMapActions, hexCenter, hexPoints, jumpHexes, mapMarks, movableHexes,
  placeHexes, terrainInfo,
} from './ui/mapView';
import {
  areaActCommand, areaActPreview, areaActSpec, areaAttacksOf, attackTargets, bubbleAt, directionAims, effectTargets, hasSlotFor, isSpellChoice, radialLayout,
  featureTeleportHexes, slotChoices, spellMenu, spellTargets, summonHexes, teleportTargets, type AreaAct, type Box, type Point,
} from './ui/hud';
import { effectIcons, effectRows } from './ui/effectsView';
import { effectTargetCount } from './battle/spells';
import { AvatarBadge, AvatarCircle } from './ui/Avatar';
import { drawOrder, tokenScale } from './ui/tokenSize';
import { actionTip } from './ui/actionHints';
import { EFFECT_SPRITES, FLOAT_ICON, OUTCOME_MS, FLOAT_STAGGER_MS, damageHits, outcomeMarks, spriteFor, statusIcons, type DamageHit, type OutcomeMark } from './ui/damageFloats';
import { hasSavedBattle, loadBattle, saveBattle } from './app/battleSave';
import { ThemeButton } from './ui/theme';
import { battleSummary } from './app/setup';
import { autoplayEnemyTurns, autoplaySummonTurn } from './ui/autoplay';
import { steerableSummon, steerHexes, summonDef } from './battle/summons';
import { zoneHexes, zoneSpecOf } from './battle/zones';
import { getMonster, spells } from './data';
import { useEffectsDensity, useEffectsSetting } from './ui/effectsSetting';
import { LOOP_SCALE, ROTATE_MS, beamFor, filterStyle, loopEffectsFor, placeLoops, tokenFilters, type BeamKind } from './ui/statusFx';
import { useDiceFlow } from './ui/diceFlow';
import { DicePrompt } from './ui/DicePrompt';
import { ReactionPrompt } from './ui/ReactionPrompt';
import { reactionDecider, useReactionPolicies } from './ui/reactionSetting';
import { diceLead, diceSeenAtStart, diceTimings, diceTitle, keptIndex, liveDiceRolls, useDiceAnimSetting } from './ui/diceAnim';
import type { TrayItem } from './ui/DiceTray';
import { diceThemeName, useDiceThemeSetting } from './ui/diceTheme';
import { dice3dAllowed } from './ui/dice3dSupport';
import { emitDiceSound } from './ui/diceSound';
import { battleSoundScene, leaveBattleEnd, playEndJingle, useSceneRequest } from './ui/audio/sound';
import { liveFinish } from './ui/audio/battleEnd';
import { SoundPanel } from './ui/SoundPanel';

// Zar tepsisi (animasyon) ayrı, tembel parça: ilk zar atılınca yüklenir.
const DiceTray = lazy(() => import('./ui/DiceTray'));
// Hareketli harita katmanı (Adım 10c, Görev M): ayrı parça, savaş ekranı açılınca yüklenir.
const EffectsLayer = lazy(() => import('./ui/EffectsLayer'));
// Savaş sonu efekti (Görev U): yalnızca savaş bu ekranda bitince yüklenir.
const EndFx = lazy(() => import('./ui/EndFx'));
import { hideBlockReason, hideCover, hideZones, revealPuff, tokenView, viewerOf } from './ui/stealthView';

const BASE = import.meta.env.BASE_URL;
const RATIO = VIEW.w / VIEW.h;
const HEX_H = VIEW.h / 7.5;
const LONG_PRESS_MS = 450;
const TOAST_MS = 4000;
const BUTTON = 56;

type Mode = 'idle' | 'attack' | 'spells' | 'areas' | 'spell' | 'aim' | 'pull' | 'erupt' | 'followup' | 'shove' | 'jump' | 'help' | 'offhand' | 'feature' | 'strike' | 'effect' | 'summon' | 'horde' | 'teleport' | 'steer';

/** Pencereye sığan, görsel oranını koruyan sahne boyutu (kaydırma yok). */
function useStage(): Box {
  const measure = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(vw, vh * RATIO);
    return { w, h: w / RATIO };
  };
  const [box, setBox] = useState<Box>(measure);
  useEffect(() => {
    const on = () => setBox(measure());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return box;
}

/** Karakter çekmecesi: yetenek, zar ve ayrıntılar. */
/** Medium jetonun yarıçapı; HP çubuğu, tıklama alanı ve rozetler bu sabit boyda (jeton ölçeğinden bağımsız). */
const TOKEN_R = HEX_H * 0.36;
/** Hüzme renkleri ve taban saydamlığı (Görev V2). */
const BEAM_COLORS: Record<BeamKind, [string, number]> = {
  turn: ['#ffcc33', 0.9], selected: ['#ffd400', 0.7], target: ['#ffffff', 0.85], picked: ['#3ddc6b', 0.85],
  pickable: ['#ff3b3b', 0.75], 'area-foe': ['#ff3b3b', 0.5], 'area-friend': ['#ffc400', 0.5],
};

/** Uyuyan ejderhanın uyanma koşulları (bilgi paneli), varyantın değerleriyle. */
function wakeNotes(state: Parameters<typeof wakeRule>[0]): string[] {
  const w = wakeRule(state);
  const mode = state.map?.dragon;
  const W = t().battle.wake;
  return [
    W.damage, W.loud(w.loudFt, [...w.loud.names, ...w.loud.damageTypes].join(', ')), W.adjacent,
    W.perception(w.perceptionFt, w.perceptionDc), W.ai(mode?.mode ?? 'never', mode?.chancePct ?? 0), W.gm,
  ];
}

function Drawer(props: { c: Combatant; state: BattleState; onClose: () => void; notes?: string[]; onExhaustion?: (level: number) => void }) {
  const { c } = props;
  // Süren etkiler (Görev R2): tıklayınca açıklama açılır.
  const [openFx, setOpenFx] = useState<string | null>(null);
  const fxRows = effectRows(props.state, c);
  const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const D = t().battle.drawer;
  return (
    <aside className="drawer" aria-label={D.details(c.name)}>
      <div className="drawer-head">
        <AvatarBadge avatar={c.avatar} size={56} ring={c.side === 'party' ? 'var(--party)' : 'var(--enemy)'} />
        <div>
          <strong>{displayName(c)}</strong>
          <small>{c.civilian ? `${c.name} · ` : ''}{D.stats(c.hp, c.maxHp, c.ac, c.speed, c.fly)}</small>
        </div>
        <button className="hud-btn" aria-label={t().common.close} onClick={props.onClose}>✕</button>
      </div>
      {c.asleep && <p><b>{D.asleep}</b> {D.asleepText}</p>}
      {c.summon && <p>{t().summons.ownedBy(props.state.combatants[c.summon.by]?.name ?? c.summon.by, c.summon.spell)}</p>}
      {(props.notes ?? []).length > 0 && <ul className="wake-notes">{props.notes?.map((n) => <li key={n}>{n}</li>)}</ul>}
      {c.conditions.filter((x) => !x.startsWith('Immune:')).length > 0 && <p>{D.conditions(c.conditions.filter((x) => !x.startsWith('Immune:')).join(', '))}</p>}
      {fxRows.length > 0 && (
        <div className="fx-list"><b>{t().effects.title}</b>
          <ul>{fxRows.map((r) => (
            <li key={r.key} className={r.harmful ? 'harmful' : 'helpful'}>
              <button type="button" onClick={() => setOpenFx((k) => (k === r.key ? null : r.key))} aria-expanded={openFx === r.key}>
                <span aria-hidden="true">{r.icon}</span> {r.name}{r.detail ? <small> · {r.detail}</small> : null}
              </button>
              {openFx === r.key && r.text && <p className="fx-text">{r.text}</p>}
            </li>
          ))}</ul>
        </div>
      )}
      {c.load && <p className="carry-badge error">⚖ {t().carry.level[c.load]}</p>}
      {!c.civilian && <p>{D.reactions(!c.economy.reaction, ['Opportunity Attack', ...(c.reactions ?? []).map((r) => r.name)].join(', '))}</p>}
      {c.hidden && <p>{D.hidden(c.hidden.dc)}</p>}
      {/* Görev S1: bitkinlik (Exhaustion) seviyesi; Game Master ayarlar (tek ekran). */}
      {!c.civilian && c.life !== 'dead' && (
        <p className="exhaustion-row">{D.exhaustion(c.exhaustion ?? 0)}
          {props.onExhaustion && (
            <>
              {' '}<button type="button" className="hud-btn small" aria-label={D.exhaustionDown} disabled={(c.exhaustion ?? 0) <= 0}
                onClick={() => props.onExhaustion?.((c.exhaustion ?? 0) - 1)}>−</button>
              <button type="button" className="hud-btn small" aria-label={D.exhaustionUp} disabled={(c.exhaustion ?? 0) >= 6}
                onClick={() => props.onExhaustion?.((c.exhaustion ?? 0) + 1)}>+</button>
            </>
          )}
        </p>
      )}
      <p>{D.moved(c.movementUsed)}</p>
      <p>{D.skills}: {SKILL_IDS.filter((s) => c.skills[s] !== undefined).map((s) => `${SKILLS[s].name} ${mod(c.skills[s] as number)}`).join(' · ') || D.noSkills}
        {' '}{D.stealth(mod(skillBonus(c, 'stealth')), c.stealthDisadvantage, mod(skillBonus(c, 'perception')))}</p>
      <p>{D.saves}: {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => `${a.toUpperCase()} ${mod(c.saves[a])}`).join(' · ')}</p>
      {c.weaponOptions.length > 0 && (
        <ul>{c.weaponOptions.map((o) => <li key={o.label}>{D.weapon(o.label, mod(o.attackBonus), o.damage, o.damageType ?? '', o.range ? D.range(o.range[0], o.range[1]) : D.reach(o.reachFt ?? 5))}</li>)}</ul>
      )}
      {c.attacks.length > 0 && (
        <ul>{c.attacks.map((a) => <li key={a.name}>{a.name}: {a.save ? `DC ${a.save.dc} ${a.save.ability.toUpperCase()}` : mod(a.bonus)} · {a.text}{a.repeat > 1 ? ` ×${a.repeat}` : ''}</li>)}</ul>
      )}
      {c.spellNames.length > 0 && <p>{D.spells(c.spellNames.join(', '))}</p>}
      {/* Görev K3: soy yetenekleri ("Drow: Faerie Fire"); oyunda olmayan ya da kısmi olanda ⓘ ipucu. */}
      {c.raceId && c.lineageId && !c.summon && ((list) => list.length > 0 && (
        <p className="card-lineage">{D.lineage}: {list.map((a, i) => {
          const tip = abilityTip(a);
          return <span key={a.label}>{i > 0 ? ' · ' : ''}{a.label}{tip ? <span className="info-tip" title={tip} aria-label={tip}>ⓘ</span> : null}</span>;
        })}</p>
      ))(lineageAbilityList({ raceId: c.raceId, lineageId: c.lineageId, level: c.level }))}
      {c.concentration && <p>{D.concentration(c.concentration.spell)}</p>}
      {(usableResources(c).length > 0 || c.sneakAttackDice > 0) && (
        <p>{D.features([
          ...usableResources(c).map(([id, n]) => `${resourceDef(id)?.name ?? id} ${n}`),
          c.sneakAttackDice > 0 ? `Sneak Attack ${c.sneakAttackDice}d6` : '',
        ].filter(Boolean).join(' · '))}</p>
      )}
      {c.spellSlots.some((n) => n > 0) && <p>{D.slots(c.spellSlots.map((n, i) => (n > 0 ? D.slot(i + 1, n) : '')).filter(Boolean).join(' · '))}</p>}
    </aside>
  );
}

/** Büyü komutuna seçilen slot seviyesi (seçilmediyse komut olduğu gibi: en düşük uygun slot). */
const withSlot = (cmd: Command, slot: number | null): Command =>
  (cmd.type === 'cast_spell' && slot !== null ? { ...cmd, slotLevel: slot } : cmd);

/** Büyü seçenekleri: yukarı slot ve (Görev SORCERER) Metamagic. */
function SpellOptions(props: { actor: Combatant; spell: Spell; value: number | null; onChange: (n: number | null) => void;
  mm: string[]; onMm: (ids: string[]) => void; tm: string; onTm: (t: string) => void; state: BattleState }) {
  return <>
    <SlotPicker actor={props.actor} spell={props.spell} value={props.value} onChange={props.onChange} />
    <MetamagicPicker actor={props.actor} spell={props.spell} value={props.mm} onChange={props.onMm} state={props.state} />
    {props.mm.includes('transmuted') && (
      <div className="slot-picker" role="radiogroup" aria-label={t().battle.transmuteTo}>
        <small>{t().battle.transmuteTo}</small>
        {TRANSMUTE_TYPES.filter((x) => x !== props.spell.mechanics.damageType).map((x) => (
          <button key={x} role="radio" aria-checked={x === props.tm} className={x === props.tm ? 'on' : 'ghost'} onClick={() => props.onTm(x)}>
            {t().builder.featureOption[x] ?? x}</button>
        ))}
      </div>
    )}
  </>;
}

/** Görev SORCERER: Metamagic seçimi (bilinen seçenekler; geçersiz birleşimin nedeni ipucu olarak). */
function MetamagicPicker(props: { actor: Combatant; spell: Spell; value: string[]; onChange: (ids: string[]) => void; state: BattleState }) {
  const known = Object.entries(props.actor.metamagic ?? {});
  if (known.length === 0) return null;
  const T = t().builder;
  const B = t().battle;
  return (
    <div className="slot-picker metamagic" role="group" aria-label={B.metamagic(resourceLeft(props.actor, 'sorceryPoints'))}>
      <small>{B.metamagic(resourceLeft(props.actor, 'sorceryPoints'))}</small>
      {known.map(([id, cost]) => {
        const on = props.value.includes(id);
        const next = on ? props.value.filter((x) => x !== id) : [...props.value, id];
        const why = on ? null : metamagicProblem(props.state, props.actor, next, props.spell);
        return <button key={id} aria-pressed={on} className={on ? 'on' : 'ghost'} disabled={!!why} title={why ?? T.metamagicInfo[id] ?? ''}
          onClick={() => props.onChange(next)}>{T.metamagicName[id] ?? id} ({cost})</button>;
      })}
    </div>
  );
}

/**
 * Yukarı slot seçimi: büyünün seviyesi ve üstündeki dolu slotlar. Motorun henüz uygulamadığı yukarı slot
 * etkisi (veride `upcast`, `applied` değil) açıkça yazılır.
 */
function SlotPicker(props: { actor: Combatant; spell: Spell; value: number | null; onChange: (n: number | null) => void }) {
  const B = t().battle;
  const levels = slotChoices(props.actor, props.spell);
  if (props.spell.level === 0 || levels.length < 2) return null;
  const current = props.value ?? levels[0];
  const up = props.spell.mechanics.upcast;
  return (
    <div className="slot-picker" role="radiogroup" aria-label={B.slotPick}>
      <small>{B.slotPick}</small>
      {levels.map((l) => (
        <button key={l} role="radio" aria-checked={l === current} className={l === current ? 'on' : 'ghost'}
          onClick={() => props.onChange(l === levels[0] ? null : l)}>{B.slotLevel(l, props.actor.spellSlots[l - 1] ?? 0)}</button>
      ))}
      {current !== undefined && current > props.spell.level && (
        <small>{up?.applied ? B.upcastApplied(current - props.spell.level) : up ? B.upcastNotYet : B.upcastNone}</small>
      )}
    </div>
  );
}

/** Savaşta kullanılabilen (özelliği uygulanan) ve kalan kaynaklar, veri sırasıyla. */
const usableResources = (c: Combatant): Array<[string, number]> =>
  Object.entries(c.resources).filter(([id, n]) => n > 0 && resourceUsable(id));

/** Haritalı savaş ekranı. `exitLabel` çıkış düğmesinin adı (kurulum ekranına dönüş). */
export function Battle(props: { initial: Session; onExit: (final?: BattleState) => void; exitLabel?: string; restored?: boolean }) {
  const box = useStage();
  const [session, setSession] = useState<Session>(props.initial);
  // Zar modu (Game Master kurulumda seçer): fiziksel zarda gereken zar istenir, adım aynı zarlarla yeniden çalışır.
  const isPlayer = (id: string) => { const c = session.state.combatants[id]; return !!c && c.side === 'party' && !c.civilian; };
  // Tepki ayarı (Görev R1): oyuncu karakterine sor / her zaman / asla; düşmanlar yapay zekâ / her zaman / asla.
  const [policies, cyclePolicy] = useReactionPolicies();
  const dice = useDiceFlow<Session>(session.state.diceMode ?? 'auto', isPlayer, setSession, Math.random, reactionDecider(policies, isPlayer));
  // Zar animasyonu: yalnızca canlı zarlar (kayıttan yüklenen oturumun eski zarları oynamaz), sırayla.
  const [diceAnim, cycleDiceAnim] = useDiceAnimSetting();
  const [diceTheme, cycleDiceTheme] = useDiceThemeSetting();
  const [diceQueue, setDiceQueue] = useState<TrayItem[]>([]);
  const seenDice = useRef(diceSeenAtStart(props.initial.events, props.restored === true));
  // Otomatik kayıt: her tur (round) sonunda ve savaş bitince (tek kayıt yuvası, olay günlüğü).
  useEffect(() => {
    if (session.state.status !== 'setup') saveBattle(session);
  }, [session.state.round, session.state.status]);
  const [mode, setMode] = useState<Mode>('idle');
  const [spell, setSpell] = useState<Spell | null>(null);
  // Yukarı slot seçimi (Görev N): null en düşük uygun slot (ve Favored Enemy'nin slotsuz büyüsü).
  const [slotPick, setSlotPick] = useState<number | null>(null);
  // Görev SORCERER: bu yapımda seçilen Metamagic seçenekleri.
  const [mmPick, setMmPick] = useState<string[]>([]);
  const [tmPick, setTmPick] = useState<string>('cold');
  // CILA: duvar biçimi (Wind Wall): düz ya da yay.
  const [wallArc, setWallArc] = useState(false);
  // Etki büyüsü (Görev R2): seçilen hedefler ve seçim (beceri, hasar türü, komut).
  const [picked, setPicked] = useState<string[]>([]);
  const [choicePick, setChoicePick] = useState<string | null>(null);
  // Kurulumda Find Familiar biçimi ve türü (Görev R3).
  const [famForm, setFamForm] = useState<string | null>(null);
  const [famType, setFamType] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  // İyileştirme havuzu (Lay On Hands) kipinde seçili özellik; komut eksik HP kadar (havuz yettiğince), tam sağlıklıysa
  // ve kaldırılabilir durum varsa yalnızca durum kaldırma.
  const [featureKey, setFeatureKey] = useState<string | null>(null);
  const featureCommand = (me: Combatant, c: Combatant): Command => {
    const f = (me.features ?? []).find((x) => x.key === featureKey);
    // Görev CLERIC: Divine Spark hedef seçer (dosta iyileştirme, düşmana hasar; tür motorda hedefe göre).
    if (f?.effect.kind === 'divineSpark') return { type: 'use_feature', actorId: me.id, feature: f.key, targetId: c.id };
    const pool = f?.resource ? resourceLeft(me, f.resource) : 0;
    const missing = Math.max(0, c.maxHp - c.hp);
    const cure = f?.effect.kind === 'healPool' && missing === 0 && pool >= f.effect.cureCost && f.effect.cures.some((x) => c.conditions.includes(x));
    return { type: 'use_feature', actorId: me.id, feature: featureKey ?? '', targetId: c.id, amount: Math.min(pool, missing), ...(cure ? { cure: true } : {}) };
  };
  const [aimHex, setAimHex] = useState<Offset | null>(null);
  // Alan eylemi (Görev R4): alan büyüsü, canavar nefesi/alan saldırısı ya da Dragonborn nefesi.
  const [areaAct, setAreaAct] = useState<AreaAct | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  // Hareket alt menüsü: Yürü, Koş, Geri Çekil.
  const [moveMenu, setMoveMenu] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoHex, setInfoHex] = useState<Offset | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [gateAim, setGateAim] = useState(false);
  const [artError, setArtError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [confirmWake, setConfirmWake] = useState(false);
  const [jumpAim, setJumpAim] = useState<Offset | null>(null);
  const [puffs, setPuffs] = useState<Array<{ id: number; at: Offset; kind: 'leaves' | 'dust' }>>([]);
  const seenEvents = useRef(session.events.length);
  // Durum/zemin hasarı animasyonu: yalnızca canlı gelen yeni olaylar (kayıt yüklenince toplu oynamaz).
  const [floats, setFloats] = useState<Array<DamageHit & { id: number; delay: number }>>([]);
  // Hasar efekti sprite'ları önceden yüklenir; yüklenemeyen efekt emoji/CSS animasyonuna düşer.
  const [spritesOk, setSpritesOk] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    for (const sp of EFFECT_SPRITES) {
      const img = new Image();
      img.onload = () => setSpritesOk((s) => new Set(s).add(sp.id));
      img.onerror = () => console.warn(`Efekt sprite'ı yüklenemedi: ${BASE}${sp.file}`);
      img.src = `${BASE}${sp.file}`;
    }
  }, []);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const timings = diceTimings(diceAnim, reduceMotion);
  const seenDamage = useRef(session.events.length);
  // Eylem sonucu (✔ isabet / ✖ ıska, kurtarma…): ~1 sn, yalnızca canlı olaylar.
  const [outcomes, setOutcomes] = useState<Array<OutcomeMark & { id: number; delay: number }>>([]);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; error?: boolean }>>([]);
  const pressTimer = useRef<number | null>(null);
  // Eylem düğmesi açıklaması: farede üzerine gelince, dokunmatikte uzun basınca (basış tıklama sayılmaz).
  const [tip, setTip] = useState<string | null>(null);
  const tipTimer = useRef<number | null>(null);
  const tipPress = useRef(false);
  const longPressed = useRef(false);
  const seenLines = useRef(session.lines.length);

  const state = session.state;
  // Savaş sonu (Görev U): bu ekranda savaş bitince bir kez görsel efekt ve ezgi (kayıttan yüklenen bitmiş savaşta değil).
  const [endFx, setEndFx] = useState<'victory' | 'defeat' | null>(null);
  const lastStatus = useRef(state.status);
  // Görev U2: ezgi bu ekran açılışı için bir kez (savaş kimliği her savaşta aynı olabilir); ekran kapanınca ezgi kısılır.
  const endKey = useRef(`${state.id}:${Date.now()}:${Math.random()}`);
  useEffect(() => {
    const outcome = liveFinish(lastStatus.current, state);
    if (outcome) {
      setEndFx(outcome);
      playEndJingle(endKey.current, outcome);
    }
    lastStatus.current = state.status;
  }, [state.status, state.winner]);
  useEffect(() => () => leaveBattleEnd(), []);
  // Günlük kutusu geçerli dilde: olaylardan yeniden yazılır (dil değişince eski satırlar da çevrilir).
  const lang = useLang();
  const logLines = useMemo(() => (logOpen ? describeEvents(session.events, state) : []), [logOpen, session.events, state, lang]);
  const variant = maps.find((m) => m.id === state.map?.id)?.variants.find((v) => v.id === state.map?.variantId);
  const [fxOn, setFxOn] = useEffectsSetting();
  const [fxDensity, cycleFxDensity] = useEffectsDensity();
  // Görev V2: birden çok durumlu jetonda döngü efekti ROTATE_MS'de bir sıradakine geçer; yalnızca gerekince sayar.
  const rotating = fxOn && !reduceMotion && Object.values(state.combatants).some((c) => c.pos && loopEffectsFor(c).length > 1);
  const [fxNow, setFxNow] = useState(0);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setFxNow((n) => n + ROTATE_MS), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotating]);
  const actorId = state.order[state.turnIndex] ?? '';
  const actor = state.combatants[actorId];
  // Görev F: saldırı balonunda seçilen Cunning Strike seçenekleri (tur değişince sıfırlanır) ve Horde Breaker silahı.
  const [cunningPicks, setCunningPicks] = useState<CunningOption[]>([]);
  useEffect(() => { setCunningPicks([]); }, [actorId, state.round]);
  const withCunning = (cmd: Command): Command => (cmd.type === 'attack' && cunningPicks.length > 0 ? { ...cmd, cunning: cunningPicks } : cmd);
  const hordeOption = (targetId: string): AttackOption | null => (actor
    ? [...actor.weaponOptions].filter((o) => !o.spell)
      .find((option) => execute(state, { type: 'horde_breaker', actorId, targetId, option }, contextFor(state, actorId), () => 0.5).ok) ?? null
    : null);
  const setup = state.status === 'setup';
  const active = state.status === 'active';

  // Yeni günlük satırları ve hatalar kısa süre toast olarak görünür.
  useEffect(() => {
    const fresh = session.lines.slice(seenLines.current).slice(-2);
    seenLines.current = session.lines.length;
    const items = fresh.map((text) => ({ id: Math.random(), text }));
    if (session.error) items.push({ id: Math.random(), text: session.error, error: true } as { id: number; text: string; error?: boolean });
    if (items.length === 0) return;
    setToasts((t) => [...t, ...items].slice(-3));
    const timer = window.setTimeout(() => setToasts((t) => t.filter((x) => !items.includes(x))), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [session]);

  // Ortaya çıkma (bulundu, saldırdı, büyü yaptı): kısa toz/yaprak efekti; "hareketi azalt"ta yok.
  useEffect(() => {
    const fresh = session.events.slice(seenEvents.current);
    seenEvents.current = session.events.length;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ids = fresh.flatMap((e) => (e.type === 'revealed' ? [e.actorId] : e.type === 'searched' ? e.found : []));
    const items = ids.flatMap((id) => {
      const pos = session.state.combatants[id]?.pos;
      return pos ? [{ id: Math.random(), at: pos, kind: revealPuff(session.state, pos) }] : [];
    });
    if (items.length === 0) return;
    setPuffs((p) => [...p, ...items]);
    const timer = window.setTimeout(() => setPuffs((p) => p.filter((x) => !items.includes(x))), 900);
    return () => window.clearTimeout(timer);
  }, [session]);

  // Tur başı/sonu hasarı (yanma, zehir, soğuk, asit…): jetonun üstünde kısa animasyon ve -N. Birden çok
  // jetonda aynı anda olursa sırayla (FLOAT_STAGGER_MS); hareket azaltmada yalnızca sayı ve simge.
  useEffect(() => {
    const fresh = session.events.slice(seenDamage.current);
    seenDamage.current = session.events.length;
    // Zar tepsisiyle çakışmasın: önce zarlar döner, sonuç ve hasar işaretleri ardından gelir.
    const lead = diceLead(liveDiceRolls(fresh, 0).length, timings);
    const items = damageHits(fresh).map((h, i) => ({ ...h, id: Math.random(), delay: lead + i * FLOAT_STAGGER_MS }));
    const marks = outcomeMarks(fresh).map((m, i) => ({ ...m, id: Math.random(), delay: lead + i * FLOAT_STAGGER_MS }));
    if (items.length === 0 && marks.length === 0) return;
    setFloats((f) => [...f, ...items]);
    setOutcomes((o) => [...o, ...marks]);
    const last = Math.max(items[items.length - 1]?.delay ?? 0, marks[marks.length - 1]?.delay ?? 0);
    const timer = window.setTimeout(() => {
      setFloats((f) => f.filter((x) => !items.includes(x)));
      setOutcomes((o) => o.filter((x) => !marks.includes(x)));
    }, OUTCOME_MS + last + 100);
    return () => window.clearTimeout(timer);
  }, [session]);

  // Ses (Görev S, T): savaş ekranına girince (kayıttan yükleme dahil) ortam sesi ve yavaşça açılan savaş müziği;
  // çıkınca menü müziği döner.
  useSceneRequest('battle', battleSoundScene(session.state));

  useEffect(() => {
    const rolls = liveDiceRolls(session.events, seenDice.current);
    seenDice.current = session.events.length;
    // Zar animasyonu kapalıyken yalnızca atış ve durma sesi.
    if (!timings && rolls.length > 0) {
      for (const r of rolls) emitDiceSound({ type: 'throw', sides: r.sides, count: r.values.length });
      const last = rolls[rolls.length - 1];
      const timer = window.setTimeout(() => {
        for (const r of rolls) {
          const kept = keptIndex(r);
          const v = r.values[kept] ?? 0;
          emitDiceSound({ type: 'settle', sides: r.sides, crit: r.sides === 20 && v === 20, fumble: r.sides === 20 && v === 1 });
        }
      }, last ? 350 : 0);
      return () => window.clearTimeout(timer);
    }
    if (!timings || rolls.length === 0) return;
    setDiceQueue((q) => [...q, ...rolls.map((roll) => ({ id: Math.random(), roll, title: diceTitle(roll, session.state) }))]);
  }, [session]);

  // Sıra değişince menü yeniden açılır, kip sıfırlanır.
  useEffect(() => { setMenuOpen(true); setMode('idle'); setSpell(null); setSlotPick(null); setTargetId(null); setAimHex(null); setTip(null); }, [actorId, state.round]);

  const movable = useMemo(() => (active && mode === 'idle' ? movableHexes(state, actorId) : new Map<string, number>()), [state, active, actorId, mode]);
  // Atlamalar: lav üstünden olanlar (ada atlaması, `lavJump`) yalnızca "Atla" kipinde; diğerleri
  // (5e uzun atlama) hareket kipinde.
  const allJumps = useMemo(() => (active && (mode === 'idle' || mode === 'jump') ? jumpHexes(state, actorId) : []), [state, active, actorId, mode]);
  const fromPos = state.combatants[actorId]?.pos ?? null;
  // Ada atlaması hedefleri tek kaynaktan (`jumpTargets`, yapay zekâyla aynı); hareketin yerine geçer.
  const islandTargets = useMemo(() => {
    const me = state.combatants[actorId];
    return active && me && me.movementUsed === 0 && (mode === 'idle' || mode === 'jump') ? jumpTargets(state, me) : [];
  }, [state, active, actorId, mode]);
  const islandJumps = islandTargets.map((t) => t.to);
  const jumps = mode === 'jump' ? islandJumps : allJumps.filter((h) => !fromPos || lavaOver(state, fromPos, h).length === 0);
  const glowing = useMemo(() => {
    if (!active) return new Set<string>();
    if (mode === 'attack') return new Set(attackTargets(state, actorId));
    if (mode === 'spell' && spell) return new Set(spellTargets(state, actorId, spell.name));
    if (mode === 'effect' && spell) return new Set(effectTargets(state, actorId, spell));
    if (mode === 'shove') {
      // İtilebilecek bitişik hedefler (motorda zarsız denenerek: yere düşürme her zaman denenebilir).
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor?.side && execute(state, { type: 'shove', actorId, targetId: c.id, effect: 'prone' }, contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'feature' && featureKey && actor) {
      // İyileştirme havuzu (Lay On Hands): motorun kabul ettiği dostlar (kendisi dahil).
      return new Set(Object.values(state.combatants)
        .filter((c) => execute(state, featureCommand(actor, c), contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'strike') {
      // Bonus eylemle Unarmed Strike ya da Flurry vuruşu: motorun kabul ettiği hedefler.
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor?.side && execute(state, { type: 'bonus_strike', actorId, targetId: c.id }, contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'horde' && actor) {
      // Horde Breaker (Görev F): motorun kabul ettiği hedefler (herhangi bir silahla).
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor.side && hordeOption(c.id) !== null)
        .map((c) => c.id));
    }
    if (mode === 'offhand') {
      // Yan el ek saldırısı: motorun kabul ettiği hedefler (zarsız denenerek).
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor?.side && execute(state, { type: 'offhand_attack', actorId, targetId: c.id }, contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'help') {
      // Yardım: bitişik düşmanlar (motorda denenerek).
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor?.side && execute(state, { type: 'help', actorId, targetId: c.id }, contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'followup') {
      // Konsantrasyon büyüsünü sürdürme: motorun kabul ettiği hedefler (zar atılmadan denenir).
      return new Set(Object.values(state.combatants)
        .filter((c) => execute(state, { type: 'spell_followup', actorId, targetId: c.id }, contextFor(state, actorId), () => 0.5).ok)
        .map((c) => c.id));
    }
    if (mode === 'pull' && actor?.pos) {
      const me = actor.pos;
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side === actor.side && c.id !== actor.id && c.pos && distance(c.pos, me) === 1 && stuckInBog(state, c))
        .map((c) => c.id));
    }
    return new Set<string>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, active, actorId, mode, spell, featureKey]);
  // Seçili hedef öldü ya da kaldırıldıysa (Görev U) işareti kalmasın.
  useEffect(() => { if (targetId && !glowing.has(targetId)) setTargetId(null); }, [glowing, targetId]);
  // Alan önizlemesi motorla aynı (menzil, görüş, siper); yayılımda nişan gerekmez.
  const areaInfo = useMemo(() => (mode === 'aim' && areaAct && actor
    ? areaActPreview(state, actor, areaAct, areaActSpec(actor, areaAct)?.spec.shape === 'emanation' ? null : aimHex, wallArc ? 'arc' : null) : null),
  [state, actor, areaAct, aimHex, mode, wallArc]);
  const area = areaInfo?.hexes ?? [];
  const areaFriends = new Set((areaInfo?.friends ?? []).map((c) => c.id));
  const areaFoes = new Set((areaInfo?.foes ?? []).map((c) => c.id));

  const px = (o: Offset): Point => {
    const c = hexCenter(o);
    return { x: (c.x / VIEW.w) * box.w, y: (c.y / VIEW.h) * box.h };
  };
  const tokenR = HEX_H * 0.36 * (box.h / VIEW.h);

  const toast = (text: string) => {
    const item = { id: Math.random(), text, error: true };
    setToasts((t) => [...t, item].slice(-3));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x !== item)), TOAST_MS);
  };
  const reset = () => { setJumpAim(null); setMode('idle'); setSpell(null); setAreaAct(null); setSlotPick(null); setMmPick([]); setTargetId(null); setAimHex(null); setGateAim(false); setMenuOpen(true); setMoveMenu(false); };
  const run = (cmd0: Command) => {
    const cmd: Command = cmd0.type === 'cast_spell' && mmPick.length > 0
      ? { ...cmd0, metamagic: mmPick, ...(mmPick.includes('transmuted') ? { transmute: tmPick } : {}) } : cmd0;
    dice.play((rng) => dispatch(session, cmd, rng)); reset();
  };
  // Kurulum: GM herkesi yerleştirir (dokun-seç-dokun ya da sürükle-bırak); olay günlüğe girer.
  const placeAt = (id: string, at: Offset) => setSession((s) => dispatch(s, { type: 'place', actorId: id, at }, Math.random, GM_CONTEXT));
  const dragId = useRef<string | null>(null);
  useEffect(() => {
    if (!setup) return;
    const up = (e: PointerEvent) => {
      const id = dragId.current;
      dragId.current = null;
      if (!id) return;
      const hex = document.elementsFromPoint(e.clientX, e.clientY)
        .map((el) => (el as HTMLElement).dataset?.hex).find((k) => k !== undefined);
      const from = session.state.combatants[id]?.pos;
      if (!hex) return;
      const [col, row] = hex.split(',').map(Number);
      const at = { col: col ?? 0, row: row ?? 0 };
      if (!from || !sameHex(from, at)) placeAt(id, at);
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [setup, session.state]);

  const onHex = (h: Offset) => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (setup) { if (selected) placeAt(selected, h); return; }
    if (!active || !actor) return;
    if (mode === 'aim' && areaAct) { setAimHex(h); return; }
    // Çağırma (Görev R3): vurgulu boş altıgene.
    if (mode === 'summon' && spell) {
      if (summonKeys.has(hexKey(h))) run({ type: 'cast_spell', actorId, spellName: spell.name, targetHex: h, ...(choicePick ? { choice: choicePick } : {}), ...(slotPick ? { slotLevel: slotPick } : {}) });
      return;
    }
    // CILA: çağrıyı bonus eylemle taşı (Flaming Sphere bitişik düşmana çarpar).
    if (mode === 'steer' && actor) {
      if (!summonKeys.has(hexKey(h))) return;
      const s = steerableSummon(state, actor);
      const foe = s?.summon?.ownerBonus?.ram ? Object.values(state.combatants)
        .filter((c) => c.side !== actor.side && !c.civilian && c.hp > 0 && c.pos && distance(c.pos, h) === 1).sort((a, b) => a.hp - b.hp)[0] : undefined;
      run({ type: 'summon_move', actorId, to: h, ...(foe ? { ramId: foe.id } : {}) });
      return;
    }
    if (mode === 'teleport' && spell) {
      if (summonKeys.has(hexKey(h))) run({ type: 'cast_spell', actorId, spellName: spell.name, targetHex: h, ...(slotPick ? { slotLevel: slotPick } : {}) });
      return;
    }
    // Görev K3: özellikle ışınlanma (Goliath Cloud's Jaunt).
    if (mode === 'teleport' && featureKey) {
      if (summonKeys.has(hexKey(h))) run({ type: 'use_feature', actorId, feature: featureKey, to: h });
      return;
    }
    if (mode === 'erupt') { run({ type: 'map_trigger', rule: 'eruption', at: h }); return; }
    if (mode === 'attack' && gm.gate && gm.gate.state === 'closed' && sameHex(gm.gate.at, h)) { setGateAim(true); return; }
    if (mode !== 'idle' && mode !== 'jump') return;
    const key = hexKey(h);
    if (movable.has(key)) run({ type: 'move', actorId, to: h });
    else if (jumps.some((j) => sameHex(j, h))) {
      if (jumpRisks.has(key)) setJumpAim(h);
      else run({ type: 'jump', actorId, to: h });
    }
  };
  const onToken = (c: Combatant) => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (setup) { setSelected(c.id); return; }
    if (!active) return;
    // Alan büyüsü ve patlama merkezi kendi altıgeni de olabilir.
    if (mode === 'aim' && areaAct && c.pos) { setAimHex(c.pos); return; }
    if (mode === 'erupt' && c.pos) { run({ type: 'map_trigger', rule: 'eruption', at: c.pos }); return; }
    // Kendine: iyileştirme havuzu ve koruma büyüsü (Shield of Faith) kendine de yapılır.
    if (c.id === actorId && mode === 'feature' && glowing.has(c.id) && actor) { run(featureCommand(actor, c)); return; }
    if (c.id === actorId && mode === 'spell' && spell && actor && (spell.mechanics.ward || spell.mechanics.kind === 'heal')) {
      run({ type: 'cast_spell', actorId, spellName: spell.name, targetId: actorId, ...(slotPick ? { slotLevel: slotPick } : {}) }); return;
    }
    // Etki büyüsü: hedef seçimi açılıp kapanır (kendisi de seçilebilir), en çok hedef sayısı kadar.
    if (mode === 'effect' && spell && glowing.has(c.id)) {
      const max = effectTargetCount(spell, slotPick ?? spell.level);
      setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : p.length < max ? [...p, c.id] : p));
      return;
    }
    if (c.id === actorId) { if (mode === 'idle') setMenuOpen((o) => !o); else reset(); return; }
    if (mode === 'feature' && glowing.has(c.id) && actor) run(featureCommand(actor, c));
    if ((mode === 'attack' || mode === 'spell' || mode === 'shove') && glowing.has(c.id)) setTargetId(c.id);
    if (mode === 'pull' && glowing.has(c.id)) run({ type: 'pull', actorId, targetId: c.id });
    if (mode === 'help' && glowing.has(c.id)) run({ type: 'help', actorId, targetId: c.id });
    if (mode === 'offhand' && glowing.has(c.id)) run({ type: 'offhand_attack', actorId, targetId: c.id });
    if (mode === 'horde' && glowing.has(c.id)) { const option = hordeOption(c.id); if (option) run({ type: 'horde_breaker', actorId, targetId: c.id, option }); }
    if (mode === 'strike' && glowing.has(c.id)) run({ type: 'bonus_strike', actorId, targetId: c.id, technique: 'topple' });
    if (mode === 'followup' && glowing.has(c.id)) run({ type: 'spell_followup', actorId, targetId: c.id });
  };
  const press = (h: Offset) => ({
    onPointerDown: () => {
      longPressed.current = false;
      pressTimer.current = window.setTimeout(() => { longPressed.current = true; setInfoHex(h); }, LONG_PRESS_MS);
    },
    onPointerUp: () => { if (pressTimer.current) window.clearTimeout(pressTimer.current); },
    onPointerLeave: (e: { pointerType: string }) => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current);
      if (e.pointerType === 'mouse') setInfoHex(null);
    },
    onPointerEnter: (e: { pointerType: string }) => { if (e.pointerType === 'mouse') setInfoHex(h); },
  });

  const zoneKeys = useMemo(() => new Set(setup && selected ? placeHexes(state, selected).map(hexKey) : []), [state, setup, selected]);
  const marks = useMemo(() => mapMarks(state), [state]);
  const gm = useMemo(() => gmMapActions(state), [state]);
  const areaKeys = new Set(area.map(hexKey));
  const summonKeys = useMemo(() => new Set(active && mode === 'summon' && spell ? summonHexes(state, actorId, spell, choicePick).map(hexKey)
    // Işınlanma (Görev S1): görülebilen boş altıgenler aynı vurguyla.
    : active && mode === 'teleport' && spell ? teleportTargets(state, actorId, spell).map(hexKey)
      : active && mode === 'teleport' && featureKey ? featureTeleportHexes(state, actorId, featureKey).map(hexKey)
      : active && mode === 'steer' && state.combatants[actorId] ? steerHexes(state, state.combatants[actorId] as Combatant).map(hexKey) : []),
    [state, active, mode, spell, actorId, choicePick, featureKey]);
  const jumpKeys = new Set(jumps.map(hexKey));
  // Riskli atlamalar (lav üstünden, `lavJump`): uyarı rengi ve onaylı önizleme.
  const jumpRisks = new Map(mode === 'jump' ? islandTargets.flatMap((t) => (t.risk ? [[hexKey(t.to), t.risk] as const] : [])) : []);
  // Canavar resimleri sağa bakar: en yakın karakter soldaysa jeton aynalanır (hep karakterlere dönük).
  const facesLeft = (c: Combatant) => {
    if (!c.pos) return false;
    const me = hexCenter(c.pos);
    const pcs = Object.values(state.combatants).filter((x) => x.side === 'party' && !x.civilian && x.pos && x.hp > 0);
    const near = pcs.sort((a, b) => distance(a.pos as Offset, c.pos as Offset) - distance(b.pos as Offset, c.pos as Offset))[0];
    return near ? hexCenter(near.pos as Offset).x < me.x : me.x > VIEW.w / 2;
  };
  // Hedef seçimi (Görev F): seçilebilir hedefin altıgeni kırmızı dolgu ve yanıp sönen kalın çerçeve,
  // jetonunda nişangâh simgesi; seçilemeyenler soluk. Renk körü için kalınlık ve simge de ayırt eder.
  const targeting = active && ['attack', 'spell', 'shove', 'help', 'followup', 'pull', 'offhand', 'feature', 'strike', 'effect', 'horde'].includes(mode);
  const pickHexes = new Set(targeting ? [...glowing].flatMap((id) => { const p = state.combatants[id]?.pos; return p ? [hexKey(p)] : []; }) : []);
  const hexClass = (h: Offset) => {
    const k = hexKey(h);
    const dark = marks.dark.has(k) ? ' dark' : '';
    return baseHexClass(h, k) + dark;
  };
  const shoveTo = mode === 'shove' && actor && targetId && state.combatants[targetId] ? shoveHex(actor, state.combatants[targetId] as Combatant) : null;
  const baseHexClass = (h: Offset, k: string) => {
    if (areaKeys.has(k) || (shoveTo && sameHex(shoveTo, h))) return 'hx area';
    if (targeting && pickHexes.has(k)) return 'hx pick';
    if (mode === 'erupt') return 'hx aimable';
    if ((mode === 'summon' || mode === 'teleport' || mode === 'steer') && summonKeys.has(k)) return 'hx summon';
    if (mode === 'attack' && gm.gate?.state === 'closed' && sameHex(gm.gate.at, h)) return 'hx gate-target';
    if (marks.warn.has(k)) return 'hx warn';
    if (zoneKeys.has(k)) return 'hx zone';
    if (movable.has(k)) return movable.get(k) === 1 ? 'hx move' : 'hx move far';
    if (jumpKeys.has(k)) return jumpRisks.has(k) ? 'hx jump risky' : 'hx jump';
    return 'hx';
  };

  // Yüzen eylem menüsü
  const hideReason = actor ? hideBlockReason(state, actor) : null;
  // Saklanma bölgeleri (Görev K): boşta ulaşılabilir ve gizlenilebilir yerler; "göster" açıkken bütün yerler
  // (ulaşılamayan ya da düşmanın gözü önündekiler soluk).
  const zones = useMemo(() => (active && actor && !actor.civilian && (showZones || (mode === 'idle' && actor.side === 'party'))
    ? hideZones(state, actor, movable.keys(), showZones) : []), [state, active, mode, actor, movable, showZones]);
  // Eylem düğmeleri (Görev F): o an yapılamayan pasif (aria-disabled, tıklanmaz, açıklamada nedeni);
  // karakterin hiç yapamayacağı (büyüsüz karakterde Büyü, Fighter olmayanda Atılım/İkinci Soluk) hiç gösterilmez.
  const B = t().battle;
  const Y = B.why;
  const N = B.label;
  const why = (cmd: Command) => (actor ? economyBlock(state, actor, cmd) : Y.notYourTurn);
  const blocked = (cmd: Command) => why(cmd) !== null;
  const bonusCmd = (type: 'hide' | 'dash' | 'disengage'): Command => ({ type, actorId, bonus: actor ? preferBonus(actor, type) : false });
  const canAttack = actor ? !actor.economy.action || actor.economy.attacksLeft > 0 : false;
  // Menzildeki uygun hedefler (motorda zarsız denenerek); menü açıkken hesaplanır.
  const menuShown = active && !!actor && menuOpen && mode === 'idle';
  const reach = useMemo(() => {
    const none = { attack: 0, shove: 0, help: 0, followup: 0 };
    if (!menuShown || !actor) return none;
    const ctx = contextFor(state, actorId);
    const tryOn = (cmd: (id: string) => Command, own = false) => Object.values(state.combatants)
      .filter((c) => (own || c.side !== actor.side) && c.id !== actorId && execute(state, cmd(c.id), ctx, () => 0.5).ok).length;
    return {
      attack: attackTargets(state, actorId).length,
      shove: tryOn((id) => ({ type: 'shove', actorId, targetId: id, effect: 'prone' })),
      help: tryOn((id) => ({ type: 'help', actorId, targetId: id })),
      followup: actor.concentration ? tryOn((id) => ({ type: 'spell_followup', actorId, targetId: id }), true) : 0,
    };
  }, [state, actorId, menuShown]);
  const firstStart = session.events[0]?.type === 'battle_started' ? session.events[0].state.combatants[actorId] : undefined;
  const hasFeature = (k: string) => (firstStart?.resources[k] ?? actor?.resources[k] ?? 0) > 0;
  type Item = { key: string; label: string; reason?: string; act: () => void };
  const speedZero = actor && hasSpeedZero(actor.conditions) ? Y.speedZero : null;
  const moveItems: Item[] = actor ? [
    { key: 'walk', label: N.walk,
      reason: speedZero ?? (actor.movementUsed >= speedHexes(actor) ? Y.moveDone : movable.size === 0 ? Y.noFreeHex : undefined),
      act: () => { reset(); setMoveMenu(false); setMenuOpen(false); } },
    { key: 'dash', label: N.dash, reason: why(bonusCmd('dash')) ?? undefined, act: () => { run(bonusCmd('dash')); setMoveMenu(false); } },
    { key: 'disengage', label: N.disengage, reason: why(bonusCmd('disengage')) ?? undefined, act: () => { run(bonusCmd('disengage')); setMoveMenu(false); } },
    { key: 'back', label: N.back, act: () => setMoveMenu(false) },
  ] : [];
  const spellReason = !actor ? undefined : spellMenu(actor).every(({ spell: sp }) => blocked({ type: 'cast_spell', actorId, spellName: sp.name }))
    ? Y.noSpell : undefined;
  const attackReason = !canAttack ? Y.attackUsed : reach.attack === 0 ? Y.noAttackTarget : undefined;
  const mainItems: Item[] = actor ? [
    { key: 'move', label: N.move,
      reason: moveItems.slice(0, 3).every((m) => m.reason) ? (speedZero ?? Y.cantMove) : undefined,
      act: () => setMoveMenu(true) },
    ...(ruleOf(state, 'lavJump') ? [{ key: 'jump', label: N.jump,
      reason: actor.movementUsed > 0 ? Y.jumpWalked : islandJumps.length === 0 ? Y.noIsland : undefined,
      act: () => { reset(); setMode('jump'); setMenuOpen(false); } }] : []),
    { key: 'attack', label: N.attack, reason: attackReason, act: () => { reset(); setMode('attack'); setMenuOpen(false); } },
    // Yan el ek saldırısı (Light): Attack eyleminde Light silahla saldırdıktan sonra; Nick varsa bonus eylem harcamaz.
    ...(actor.offHandOption ? [{ key: 'offhand', label: actor.nickOffhand ? N.offhandNick : N.offhand,
      reason: offhandProblem(actor) ?? why({ type: 'offhand_attack', actorId, targetId: '' }) ?? undefined,
      act: () => { reset(); setMode('offhand'); setMenuOpen(false); } }] : []),
    ...(actor.spellNames.length > 0 ? [{ key: 'spell', label: N.spell, reason: spellReason, act: () => { reset(); setMode('spells'); setMenuOpen(false); } }] : []),
    // Alan eylemleri (Görev R4): nefes, koni/çizgi saldırıları, Dragonborn Breath Weapon.
    ...(state.map && (areaAttacksOf(actor).length > 0 || actor.breath) ? [{ key: 'area', label: t().area.menu,
      act: () => { reset(); setMode('areas'); setMenuOpen(false); } }] : []),
    { key: 'hide', label: N.hide, reason: hideReason ?? undefined, act: () => run(bonusCmd('hide')) },
    { key: 'shove', label: N.shove,
      reason: !canAttack ? Y.attackUsed : why({ type: 'shove', actorId, targetId: '', effect: 'prone' })
        ?? (reach.shove === 0 ? Y.noShoveTarget : undefined),
      act: () => { reset(); setMode('shove'); setMenuOpen(false); } },
    { key: 'dodge', label: N.dodge, reason: why({ type: 'dodge', actorId }) ?? undefined, act: () => run({ type: 'dodge', actorId }) },
    { key: 'help', label: N.help, reason: why({ type: 'help', actorId, targetId: '' }) ?? (reach.help === 0 ? Y.noAdjEnemy : undefined),
      act: () => { reset(); setMode('help'); setMenuOpen(false); } },
    { key: 'search', label: N.search, reason: why({ type: 'search', actorId }) ?? undefined, act: () => run({ type: 'search', actorId }) },
    ...(actor.conditions.includes('Prone') ? [{ key: 'stand', label: N.stand, reason: standUpProblem(actor) ?? undefined,
      act: () => run({ type: 'stand_up', actorId }) }] : []),
    ...(actor.grapple ? [{ key: 'escape_grapple', label: N.escapeGrapple, reason: why({ type: 'escape_grapple', actorId }) ?? undefined,
      act: () => run({ type: 'escape_grapple', actorId }) }] : []),
    ...(stuckInBog(state, actor) ? [{ key: 'escape', label: N.escape, reason: why({ type: 'escape', actorId }) ?? undefined, act: () => run({ type: 'escape', actorId }) }] : []),
    // CILA: büyünün tuttuğu yaratık (Entangle, Web) eylemle Athletics kontrolüyle kurtulur.
    ...(!stuckInBog(state, actor) && actor.effects?.some((e) => e.escapeCheck) ? [{ key: 'escapeSpell', label: N.escapeSpell, reason: why({ type: 'escape', actorId }) ?? undefined, act: () => run({ type: 'escape', actorId }) }] : []),
    ...(actor.pos && Object.values(state.combatants).some((c) => c.side === actor.side && c.id !== actor.id && c.pos && actor.pos
      && distance(c.pos, actor.pos) === 1 && stuckInBog(state, c))
      ? [{ key: 'pull', label: N.pull, reason: why({ type: 'pull', actorId, targetId: '' }) ?? undefined, act: () => { reset(); setMode('pull'); setMenuOpen(false); } }] : []),
    ...(hasFeature('actionSurge') ? [{ key: 'surge', label: N.surge,
      reason: resourceLeft(actor, 'actionSurge') <= 0 ? Y.surgeUsed : actor.economy.surged ? Y.surgeTurn
        : !actor.economy.action || actor.economy.attacksLeft > 0 ? Y.surgeFirst : undefined,
      act: () => run({ type: 'action_surge', actorId }) }] : []),
    // CILA: bonus eylemle taşınan çağrı (Flaming Sphere, ruh sürüsü).
    ...(steerableSummon(state, actor) ? [{ key: 'steer', label: N.steer, reason: actor.economy.bonus ? Y.steerBonus : undefined,
      act: () => { reset(); setMode('steer'); setMenuOpen(false); } }] : []),
    // CILA: Haste'in ek eylemi (eylem kullanıldıktan sonra; tek saldırı, Dash, Disengage, Hide).
    ...(actor.effects?.some((e) => e.extraAction) ? [{ key: 'haste', label: N.haste,
      reason: actor.economy.hasteUsed ? Y.hasteUsed : !actor.economy.action || actor.economy.attacksLeft > 0 ? Y.surgeFirst : undefined,
      act: () => run({ type: 'haste_action', actorId }) }] : []),
    ...(hasFeature('secondWind') ? [{ key: 'wind', label: N.wind,
      reason: resourceLeft(actor, 'secondWind') <= 0 ? Y.windNone : why({ type: 'second_wind', actorId }) ?? (actor.hp >= actor.maxHp ? Y.hpFull : undefined),
      act: () => run({ type: 'second_wind', actorId }) }] : []),
    // Barbarian: Rage (bonus eylem; sürüyorsa bir tur uzatır) ve Reckless Attack (turun ilk saldırısından önce).
    ...(actor.rageDamage ? [{ key: 'rage', label: actor.rage ? N.rageExtend : N.rage,
      reason: rageProblem(actor) ?? why({ type: 'rage', actorId }) ?? (actor.rage?.refreshed ? Y.rageRefreshed : undefined),
      act: () => run({ type: 'rage', actorId }) }] : []),
    ...(actor.canReckless ? [{ key: 'reckless', label: N.reckless, reason: recklessProblem(actor) ?? undefined,
      act: () => run({ type: 'reckless', actorId }) }] : []),
    // Görev F: Steady Aim (Rogue) ve Horde Breaker (Hunter).
    ...(hasTrait(actor, 'steady-aim') ? [{ key: 'steady', label: N.steady, reason: why({ type: 'steady_aim', actorId }) ?? undefined,
      act: () => run({ type: 'steady_aim', actorId }) }] : []),
    ...(hasTrait(actor, 'horde-breaker') ? [{ key: 'horde', label: N.horde,
      reason: usedThisTurn(state, actor, 'horde-breaker') ? Y.surgeTurn : !actor.economy.lastTargetId ? Y.noTarget : undefined,
      act: () => { reset(); setMode('horde'); setMenuOpen(false); } }] : []),
    // Monk (veriden): bonus Unarmed Strike / Flurry vuruşu (hedef seçer), Focus eylemleri, Stunning Strike (vurulan hedefe).
    ...(actor.bonusStrike ? [{ key: 'strike', label: (actor.economy.flurryLeft ?? 0) > 0 ? N.flurryStrike(actor.economy.flurryLeft ?? 0) : N.bonusStrike,
      reason: why({ type: 'bonus_strike', actorId, targetId: '' }) ?? undefined,
      act: () => { reset(); setMode('strike'); setMenuOpen(false); } }] : []),
    ...(actor.focusActions ?? []).map((a) => ({ key: a.id, label: N.focusName[a.id] ?? a.name,
      reason: focusActionProblem(actor, a.id) ?? why({ type: 'focus_action', actorId, action: a.id }) ?? undefined,
      act: () => run({ type: 'focus_action', actorId, action: a.id }) })),
    ...(actor.stunning ? [{ key: 'stunning', label: N.stunning,
      reason: stunningProblem(actor, undefined) ?? undefined,
      act: () => run({ type: 'stunning_strike', actorId, targetId: actor.economy.meleeHit?.targetId ?? '' }) }] : []),
    // Görev SORCERER: Font of Magic (en düşük dolu slot → puan; puanla alınabilen en yüksek slot).
    ...(actor.resources.sorceryPoints !== undefined ? ((): Item[] => {
      const low = actor.spellSlots.findIndex((n) => n > 0) + 1;
      const make = [5, 4, 3, 2, 1].find((l) => !why({ type: 'font_of_magic', actorId, mode: 'toSlot', level: l })) ?? 1;
      return [
        { key: 'font-points', label: N.fontToPoints(low || 1), reason: low === 0 ? Y.noSlot : why({ type: 'font_of_magic', actorId, mode: 'toPoints', level: low }) ?? undefined,
          act: () => run({ type: 'font_of_magic', actorId, mode: 'toPoints', level: low }) },
        { key: 'font-slot', label: N.fontToSlot(make), reason: why({ type: 'font_of_magic', actorId, mode: 'toSlot', level: make }) ?? undefined,
          act: () => run({ type: 'font_of_magic', actorId, mode: 'toSlot', level: make }) },
      ];
    })() : []),
    // Sınıf özellikleri (veriden; Paladin: Lay On Hands hedef seçer, Sacred Weapon hemen).
    ...(actor.features ?? []).map((f) => (f.effect.kind === 'healPool' || f.effect.kind === 'divineSpark'
      ? { key: f.key, label: N.featureName[f.key] ?? f.name,
        reason: (f.resource && resourceLeft(actor, f.resource) <= 0 ? Y.poolEmpty : undefined) ?? why({ type: 'use_feature', actorId, feature: f.key }) ?? undefined,
        act: () => { reset(); setFeatureKey(f.key); setMode('feature'); setMenuOpen(false); } }
      : { key: f.key, label: N.featureName[f.key] ?? f.name,
        reason: featureProblem(state, actor, { feature: f.key }) ?? why({ type: 'use_feature', actorId, feature: f.key }) ?? undefined,
        act: () => (f.effect.kind === 'teleport'
          ? (reset(), setFeatureKey(f.key), setMode('teleport'), setMenuOpen(false))
          : run({ type: 'use_feature', actorId, feature: f.key })) })),
    ...(actor.concentration && ['Spiritual Weapon', "Hunter's Mark"].includes(actor.concentration.spell)
      ? [{ key: 'followup', label: actor.concentration.spell === "Hunter's Mark" ? N.mark : N.weapon,
        reason: why({ type: 'spell_followup', actorId, targetId: '' }) ?? (reach.followup === 0 ? Y.noTarget : undefined),
        act: () => { reset(); setMode('followup'); setMenuOpen(false); } }] : []),
    { key: 'end', label: N.end, act: () => run({ type: 'end_turn', actorId }) },
  ] : [];
  const items: Item[] = moveMenu ? moveItems : mainItems;
  const actorPx = actor?.pos ? px(actor.pos) : null;
  const radial = actorPx ? radialLayout(actorPx, items.length, box, tokenR + BUTTON / 2 + 10, BUTTON) : [];

  const target = targetId ? state.combatants[targetId] : undefined;
  const choices = active && target ? attackChoices(state, actorId, target.id)
    .filter((ch) => (mode === 'spell' && spell ? ch.id === `s-${spell.name}` : !isSpellChoice(ch))) : [];
  const modeHint: Record<Mode, string> = {
    idle: '', attack: B.hint.attack, spells: B.hint.spells,
    spell: B.hint.spell(spell?.name ?? ''), aim: B.hint.aim(actor && areaAct ? areaActSpec(actor, areaAct)?.label ?? '' : ''),
    areas: t().area.pickHint,
    pull: B.hint.pull, help: B.hint.help, erupt: B.hint.erupt, offhand: B.hint.offhand, horde: B.hint.horde, feature: B.hint.feature, strike: B.hint.strike,
    effect: spell ? t().effects.hint(spell.name, effectTargetCount(spell, slotPick ?? spell.level)) : '',
    summon: spell ? t().summons.hint(spell.name) : '',
    teleport: spell ? B.hint.teleport(spell.name, spell.mechanics.teleport?.rangeFt ?? 0)
      : ((f) => (f?.effect.kind === 'teleport' ? B.hint.teleport(f.name, f.effect.rangeFt) : ''))((actor?.features ?? []).find((x) => x.key === featureKey)),
    followup: B.hint.followup(actor?.concentration?.spell ?? ''),
    shove: B.hint.shove,
    jump: B.hint.jump,
    steer: B.hint.steer,
  };

  return (
    <div className="mb-screen">
      <div className="mb-stage" style={{ width: box.w, height: box.h }}>
        {/* Katmanlar: harita görseli, hareketli efektler (Adım 10c), altıgenler ve jetonlar. Görsel düz
            <img>: yüklenemez ya da çözülemezse ekranda yazar (kara ekran yerine). */}
        {state.map && variant && (
          <img key={variant.image} src={`${BASE}${variant.image}`} alt="" aria-hidden="true" draggable={false}
            className={`layer map-art${state.map.mirrored ? ' mirrored' : ''}`}
            onLoad={() => setArtError(null)}
            onError={() => { setArtError(variant.image); console.error(`Harita görseli yüklenemedi: ${BASE}${variant.image}`); }} />
        )}
        {artError && <div className="art-error" role="alert">{B.artError(artError)}</div>}
        {state.map && variant && (
          <Suspense fallback={null}>
            <EffectsLayer effects={variant.effects ?? []} tiles={state.map.tiles} mirrored={state.map.mirrored} enabled={fxOn} density={fxDensity} />
          </Suspense>
        )}
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} width={box.w} height={box.h} className="layer" role="img" aria-label={B.mapLabel}>
          <defs>
            {/* Görev V2: ışık hüzmesi gradyanları (alttan yukarı solar; blur yok). */}
            {Object.entries(BEAM_COLORS).map(([kind, [color, alpha]]) => (
              <linearGradient key={kind} id={`beam-${kind}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={color} stopOpacity={alpha} />
                <stop offset="0.4" stopColor={color} stopOpacity={alpha * 0.75} />
                <stop offset="1" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {allHexes().map((h) => (
            <polygon key={hexKey(h)} points={hexPoints(h)} className={`${hexClass(h)}${infoHex && sameHex(infoHex, h) ? ' info' : ''}`} data-hex={hexKey(h)}
              onClick={() => onHex(h)} {...press(h)} />
          ))}
          {[...movable.entries()].map(([key, cost]) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`c${key}`} x={c.x} y={c.y + HEX_H * 0.38} className="cost">{cost}</text>;
          })}
          {mode === 'jump' && [...jumpRisks.entries()].map(([key, r]) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`j${key}`} x={c.x} y={c.y + HEX_H * 0.38} className="cost">DC{r.dc}</text>;
          })}
          {[...marks.traps].map((key) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`t${key}`} x={c.x} y={c.y + 10} className="trap-mark">⚠</text>;
          })}
          {/* Görev B2: büyü alanları (kalıcı zemin, rüzgâr duvarı, yürüyen alanlar): renkli altıgen dolgusu ve simge. */}
          {(state.map?.zones ?? []).map((z) => {
            const spec = zoneSpecOf(z);
            const hexes = zoneHexes(state, z);
            const first = hexes[0];
            return (
              <g key={`z${z.id}`} className={`spell-zone${spec?.windWall ? ' wall' : ''}`} style={{ ['--zone' as string]: spec?.color ?? '#9ab' }} aria-hidden="true">
                <title>{z.name}</title>
                {hexes.map((h) => <polygon key={hexKey(h)} points={hexPoints(h, 0.92)} />)}
                {first && spec?.icon && <text x={hexCenter(first).x} y={hexCenter(first).y - HEX_H * 0.22} className="zone-icon">{spec.icon}</text>}
              </g>
            );
          })}
          {zones.map(({ hex, ok }) => {
            const c = hexCenter(hex);
            return (
              <g key={`h${hexKey(hex)}`} className={`hide-zone${ok ? ' ok' : ' dim'}`} aria-hidden="true">
                <polygon points={hexPoints(hex, 0.8)} />
                <EyeSlash x={c.x + HEX_H * 0.28} y={c.y - HEX_H * 0.26} r={HEX_H * 0.13} />
              </g>
            );
          })}
          {(() => {
            // Görünen jetonlar; ölçek boyut sınıfından (data/token-sizes.json), mekanik olarak tek altıgen.
            const shown = Object.values(state.combatants)
              .filter((c) => c.pos && c.life !== 'dead' && (c.hp > 0 || c.life !== 'alive' || c.regenPending))
              .map((c) => ({ c, view: tokenView(state, c, showHidden) }))
              .filter((x) => x.view !== 'invisible')
              .map((x) => ({ ...x, id: x.c.id, pos: x.c.pos as Offset, y: hexCenter(x.c.pos as Offset).y, scale: tokenScale(x.c) }));
            // Aşağıdaki jeton üstte; büyük jeton komşusundaki küçüğü örtmez (drawOrder).
            const ordered = drawOrder(shown);
            const r = TOKEN_R;
            // Sürekli durum efektleri (Görev V, V2): jeton başına tek efekt (çoklu durumda sırayla), ekranda en çok sekiz
            // animasyon; efekt ayarı kapalıysa yok; tek seferlik hasar efekti oynarken o jetonun döngüsü duraklar.
            const loops = placeLoops(ordered.map((x) => x.c), { enabled: fxOn, reduceMotion, now: fxNow, paused: new Set(floats.map((f) => f.targetId)) });
            // Oyun akışı işaretleri (Görev V2): altıgen tabanından yukarı ışık hüzmesi, bütün jetonların arkasında ayrı katman.
            const beamOf = (c: Combatant): BeamKind | null => beamFor({
              turn: c.id === actorId && active, selected: c.id === selected && setup, target: c.id === targetId,
              picked: mode === 'effect' && picked.includes(c.id), pickable: targeting && glowing.has(c.id),
              'area-foe': areaFoes.has(c.id), 'area-friend': areaFriends.has(c.id),
            });
            const beams = (
              <g key="beams" className="beams" aria-hidden="true">
                {ordered.map(({ c }) => {
                  const kind = beamOf(c);
                  if (!kind) return null;
                  const p = hexCenter(c.pos as Offset);
                  const area = kind === 'area-foe' || kind === 'area-friend';
                  // Taban altıgenin alt kenarı; yükseklik ~1,1 altıgen (alan önizlemesinde kısa); figürün arkasında kalır.
                  const h = HEX_H * (area ? 0.75 : 1.15);
                  const w = r * (kind === 'pickable' || kind === 'selected' ? 1.9 : area ? 2 : 2.5);
                  const base = p.y + HEX_H * 0.42;
                  return (
                    <g key={c.id} className={`beam beam-${kind}`}>
                      <rect x={p.x - w / 2} y={base - h} width={w} height={h} fill={`url(#beam-${kind})`} />
                      <ellipse cx={p.x} cy={base} rx={w * 0.62} ry={HEX_H * 0.1} className="beam-foot" />
                    </g>
                  );
                })}
              </g>
            );
            return [
              beams,
              ...ordered.map(({ c, view, scale }) => {
                const p = hexCenter(c.pos as Offset);
                // Jeton filtreleri (Görev V): taşlaşma, görünmezlik, baygınlık, yerde, bitkinlik, çağrılmış.
                const filters = tokenFilters(c);
                const look = filterStyle(filters);
                const cls = ['token', c.side, scale > 1 ? 'big' : '', scale < 1 ? 'tiny' : '', c.asleep ? 'asleep' : '', c.id === actorId && active ? 'turn' : '', c.id === targetId ? 'target' : '',
                  glowing.has(c.id) ? 'glow' : '', targeting && glowing.has(c.id) ? 'pickable' : '', targeting && !glowing.has(c.id) && c.id !== actorId ? 'dim' : '',
                  c.id === selected && setup ? 'selected' : '', view !== 'normal' ? 'hidden' : '', mode === 'effect' && picked.includes(c.id) ? 'picked' : '',
                  c.hp <= 0 ? 'down' : '', ...filters.map((f) => `st-${f}`), areaFoes.has(c.id) ? 'in-area foe' : areaFriends.has(c.id) ? 'in-area friend' : '',
                  loops.has(c.id) ? 'has-fx' : ''].join(' ');
                const cover = view !== 'normal' ? hideCover(state, c.pos as Offset) : null;
                // Figür altıgen merkezinde ortalı, ölçekle her yöne eşit büyür; Zzz rozeti figürün tepesine yakın.
                const top = p.y - r * scale;
                return (
                  <g key={c.id} className={cls}>
                    {filters.includes('prone') && <ellipse cx={p.x} cy={p.y + r * 0.62} rx={r * 0.95} ry={r * 0.32} className="prone-shadow" aria-hidden="true" />}
                    <g className="token-filter" style={look.filter || look.opacity < 1 ? { filter: look.filter || undefined, opacity: look.opacity } : undefined}
                      transform={look.shrink < 1 ? `translate(${p.x} ${p.y}) scale(${look.shrink}) translate(${-p.x} ${-p.y})` : undefined}>
                      <AvatarCircle avatar={c.avatar} cx={p.x} cy={p.y} r={r} asleep={c.asleep === true}
                        flip={c.side === 'enemies' && !c.civilian && facesLeft(c)} scale={scale} />
                      {/* Takım halkası yalnızca resimsiz (baş harfli) jetonda: resimli jetonda `.fig ~ .ring` gizler (Görev V2). */}
                      <circle cx={p.x} cy={p.y} r={r} className="ring" />
                    </g>
                    {(() => {
                      // Tek döngü efekti (Görev V2); halka jetonun üstünde ortalı (ortası boş). Sıradakine geçişte kısa belirme.
                      const fx = loops.get(c.id);
                      if (!fx) return null;
                      const { sprite, animated } = fx;
                      const d = 2 * r * Math.max(1, scale) * LOOP_SCALE;
                      return (
                        <svg key={fx.count > 1 ? `${sprite.id}-${fxNow}` : sprite.id} className={`fx-loop${fx.count > 1 ? ' rotating' : ''}`} x={p.x - d / 2} y={p.y - d / 2} width={d} height={d}
                          viewBox={`0 0 ${sprite.size} ${sprite.size}`} overflow="hidden" aria-hidden="true" data-fx={sprite.id}>
                          <image href={`${BASE}${sprite.file}`} width={sprite.size * sprite.frames} height={sprite.size} preserveAspectRatio="none"
                            style={animated ? { '--shift': `${-sprite.size * sprite.frames}px`,
                              animation: `fx-play ${sprite.frames * sprite.frameMs}ms steps(${sprite.frames}) infinite` } as React.CSSProperties : undefined} />
                        </svg>
                      );
                    })()}
                    {targeting && glowing.has(c.id) && (
                      <g className="pick-mark" aria-hidden="true">
                        <g transform={`translate(${p.x + r * 0.78},${p.y - r * 0.78})`} className="pick-badge">
                          <circle r={15} />
                          <path d="M -9 0 H 9 M 0 -9 V 9" />
                          <circle r={6} className="pick-dot" />
                        </g>
                      </g>
                    )}
                    {cover && <HideCoverArt kind={cover} x={p.x} y={p.y} r={r} />}
                    {cover && <g className="hide-eye"><EyeSlash x={p.x + r * 0.72} y={p.y - r * 0.72} r={r * 0.36} /></g>}
                    {view === 'hidden-own' && c.hidden && (
                      <text x={Math.min(VIEW.w - 90, Math.max(90, p.x))} y={Math.max(18, p.y - r - 8)} className="hide-label">{t().view.hiddenStealth(c.hidden.dc)}</text>
                    )}
                    {/* HP çubuğu altıgenin altında sabit boyda (Tiny'de de okunur, Gargantuan'da komşuya taşmaz). */}
                    <rect x={p.x - r} y={p.y + r + 3} width={2 * r} height={8} className="hpbg" />
                    <rect x={p.x - r} y={p.y + r + 3} width={2 * r * Math.max(0, c.hp / c.maxHp)} height={8} className="hp" />
                    {[...statusIcons(c), ...effectIcons(state, c)].length > 0 && (
                      <g className="status-icons" transform={`translate(${p.x - r * 0.62},${Math.max(30, Math.min(top + r * 0.4, p.y - r * 0.7))})`} aria-hidden="true">
                        {[...statusIcons(c), ...effectIcons(state, c)].map((s, i) => <text key={s.key} x={-i * 20} y={0}><title>{s.title}</title>{s.icon}</text>)}
                      </g>
                    )}
                    {c.asleep && (
                      <g className="zzz" transform={`translate(${p.x + r * 0.62},${Math.max(30, Math.min(top + r * 0.4, p.y - r * 0.7))})`}>
                        <rect x={-4} y={-22} width={58} height={28} rx={14} />
                        <text x={25} y={-2}>Zzz</text>
                      </g>
                    )}
                  </g>
                );
              }),
              // Tıklama alanları en üstte, her jetonun yalnızca kendi altıgeninde: büyük jeton komşuyu kapatmaz.
              <g key="hits" className="token-hits">
                {ordered.map(({ c }) => {
                  const p = hexCenter(c.pos as Offset);
                  const pr = press(c.pos as Offset);
                  return (
                    <circle key={c.id} cx={p.x} cy={p.y} r={r} className={`hit${setup ? ' draggable' : ''}`} data-id={c.id} data-hex={hexKey(c.pos as Offset)}
                      onClick={() => onToken(c)} {...pr}
                      onPointerDown={(e) => { pr.onPointerDown(); if (setup) { dragId.current = c.id; setSelected(c.id); (e.target as Element).releasePointerCapture?.(e.pointerId); } }} />
                  );
                })}
              </g>,
            ];
          })()}
          {floats.map((fl) => {
            const c = state.combatants[fl.targetId];
            if (!c?.pos) return null;
            const p = hexCenter(c.pos);
            const top = p.y - TOKEN_R * Math.min(1.2, tokenScale(c));
            // Sprite (yüklendiyse, hareket azaltma kapalıysa) emojinin yerine geçer; sayı hep kalır.
            // Hareket azaltmada yalnızca sayı.
            const sprite = reduceMotion ? null : spriteFor(fl);
            const useSprite = sprite !== null && spritesOk.has(sprite.id);
            const icon = !reduceMotion && !useSprite ? FLOAT_ICON[fl.kind] : '';
            const box = TOKEN_R * 2.6;
            return (
              <g key={fl.id} aria-hidden="true" className="dmg-group">
                {useSprite && sprite && (
                  <svg className="fx-sprite" x={p.x - box / 2} y={p.y - box / 2} width={box} height={box} viewBox={`0 0 ${sprite.size} ${sprite.size}`} overflow="hidden">
                    <image href={`${BASE}${sprite.file}`} width={sprite.size * sprite.frames} height={sprite.size} preserveAspectRatio="none"
                      style={{ '--shift': `${-sprite.size * sprite.frames}px`,
                        animation: `fx-play ${sprite.frames * sprite.frameMs}ms steps(${sprite.frames}) ${fl.delay}ms both` } as React.CSSProperties} />
                  </svg>
                )}
                <g className={`dmg-float ${fl.kind}`} transform={`translate(${p.x},${top})`}>
                  <g className="dmg-anim" style={{ animationDelay: `${fl.delay}ms` }}>
                    {icon && <text className="dmg-icon" x={-14} y={0}>{icon}</text>}
                    <text className="dmg-num" x={icon ? 10 : 0} y={0}>-{fl.amount}</text>
                  </g>
                </g>
              </g>
            );
          })}
          {outcomes.map((m) => {
            const c = state.combatants[m.targetId];
            if (!c?.pos) return null;
            const p = hexCenter(c.pos);
            const top = p.y - TOKEN_R * Math.min(1.2, tokenScale(c)) - 30;
            return (
              <g key={m.id} className={`outcome ${m.ok ? 'ok' : 'fail'}`} transform={`translate(${p.x},${Math.max(28, top)})`} aria-hidden="true">
                <g className="outcome-anim" style={{ animationDelay: `${m.delay}ms` }}>
                  <rect x={-58} y={-20} width={116} height={28} rx={14} />
                  <text x={0} y={0}>{m.text}</text>
                </g>
              </g>
            );
          })}
          {puffs.map((pf) => {
            const p = hexCenter(pf.at);
            return (
              <g key={pf.id} className={`puff ${pf.kind}`} transform={`translate(${p.x},${p.y})`} aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => {
                  const a = (i / 9) * Math.PI * 2;
                  return <circle key={i} r={pf.kind === 'leaves' ? 6 : 8} style={{ '--dx': `${Math.cos(a) * 46}px`, '--dy': `${Math.sin(a) * 34 - 10}px` } as React.CSSProperties} />;
                })}
              </g>
            );
          })}
        </svg>

        <div className="hud">
          <div className="turn-strip" role="list" aria-label={B.order}>
            {state.order.map((id) => {
              const c = state.combatants[id];
              // Kaybolan çağrılmış yaratık (Görev R3) şeritte görünmez.
              if (!c || c.summon?.gone) return null;
              const out = c.life === 'dead' || (c.hp <= 0 && c.life === 'alive' && !c.regenPending);
              // Karşı tarafın gizli savaşçısı sıra şeridinde de belli olmasın.
              if (tokenView(state, c, showHidden) === 'invisible') {
                return <span key={id} role="listitem" className="strip-item unknown" aria-label="Bilinmeyen">?</span>;
              }
              return (
                <button key={id} role="listitem" className={`strip-item${id === actorId && active ? ' now' : ''}${out ? ' out' : ''}`}
                  onClick={() => setDrawerId(id)} aria-label={B.drawer.details(c.name)}>
                  <AvatarBadge avatar={c.avatar} size={30} ring={c.side === 'party' ? 'var(--party)' : 'var(--enemy)'} title={c.name} />
                </button>
              );
            })}
          </div>

          <div className={`hud-corner tl${optionsOpen ? ' open' : ''}`}>
            <button className="hud-btn" aria-label={B.options} onClick={() => setOptionsOpen((o) => !o)}>≡</button>
            {optionsOpen && (
              <div className="hud-pop">
                <SoundPanel />
                {active && gm.triggers.includes('eruption') && <button onClick={() => { reset(); setMode('erupt'); setMenuOpen(false); setOptionsOpen(false); }}>{B.gm.erupt}</button>}
                {active && gm.triggers.includes('lavaRise') && <button onClick={() => { run({ type: 'map_trigger', rule: 'lavaRise' }); setOptionsOpen(false); }}>{B.gm.lavaRise}</button>}
                {active && gm.triggers.includes('swell') && <button onClick={() => { run({ type: 'map_trigger', rule: 'swell' }); setOptionsOpen(false); }}>{B.gm.swell}</button>}
                {active && gm.gate && gm.gate.state !== 'broken' && (
                  <button onClick={() => { if (gm.gate) run({ type: 'gate', at: gm.gate.at, open: gm.gate.state === 'closed' }); setOptionsOpen(false); }}>
                    {B.gm.gate(gm.gate.state === 'closed')}
                  </button>
                )}
                {active && sleepingDragon(state) && (
                  <button onClick={() => { setConfirmWake(true); setOptionsOpen(false); }}>{B.gm.wake}</button>
                )}
                {viewerOf(state) === 'gm' && Object.values(state.combatants).some((c) => c.side === 'party' && c.hidden) && (
                  <button onClick={() => setShowHidden((v) => !v)}>{B.hiddenTokens(showHidden)}</button>
                )}
                <button onClick={() => { toast(saveBattle(session) ? B.saved : B.saveFailed); setOptionsOpen(false); }}>{B.save}</button>
                <button disabled={!hasSavedBattle()} onClick={() => {
                  const r = loadBattle();
                  if (r.ok) {
                    // Yüklenen günlük baştan oynatıldı: eski olaylar için animasyon oynamaz.
                    seenEvents.current = r.session.events.length;
                    seenDamage.current = r.session.events.length;
                    seenDice.current = r.session.events.length;
                    setDiceQueue([]);
                    setSession(r.session); toast(B.loaded);
                  } else toast(r.error);
                  setOptionsOpen(false);
                }}>{B.load}</button>
                {active && <button onClick={() => { setShowZones((v) => !v); setOptionsOpen(false); }}>{t().view.zones(showZones)}</button>}
                <ThemeButton className="" />
                <button onClick={cycleDiceAnim}>{t().dice.anim.label(t().dice.anim[diceAnim])}</button>
                <button onClick={cycleDiceTheme}>{t().dice.themeLabel(diceThemeName(diceTheme, lang))}</button>
                <button onClick={() => cyclePolicy('player')}>{t().reactions.policy.player(t().reactions.policy[policies.player])}</button>
                <button onClick={() => cyclePolicy('enemy')}>{t().reactions.policy.enemy(t().reactions.policy[policies.enemy])}</button>
                {(variant?.effects?.length ?? 0) > 0 && (
                  <>
                    <button onClick={() => setFxOn(!fxOn)}>{B.effects(fxOn)}</button>
                    {fxOn && <button onClick={cycleFxDensity}>{B.fxDensity(fxDensity)}</button>}
                  </>
                )}
                <button onClick={() => props.onExit(session.state)}>{props.exitLabel ?? B.changeMap}</button>
              </div>
            )}
          </div>

          {(modeHint[mode] || setup) && (
            <div className="hud-hint">
              {setup ? B.hint.setup : modeHint[mode]}
              {mode !== 'idle' && <button className="hud-btn small" onClick={reset} aria-label={t().common.cancel}>✕</button>}
            </div>
          )}

          {active && actor && actorPx && menuOpen && mode === 'idle' && items.map((it, i) => (
            // Devre dışı düğme de açıklamasını gösterebilsin diye `disabled` değil `aria-disabled` (Chrome
            // devre dışı düğmede fare/dokunma olaylarını iletmez); tıklama yine işlemez.
            // Yapılamayan eylem tıklanmaz; dokununca yalnızca nedenini gösteren açıklama açılır.
            <button key={it.key} className={`radial-btn${it.reason ? ' disabled' : ''}${it.key === 'back' ? ' back' : ''}`}
              aria-disabled={it.reason ? true : undefined} aria-label={`${it.label}: ${actionTip(it.key, it)}`}
              onClick={() => {
                if (tipPress.current) { tipPress.current = false; return; }
                // Gizlenilemiyorsa nerede gizlenilebileceği haritada gösterilir.
                if (it.reason) { setTip(it.key); if (it.key === 'hide') setShowZones(true); return; }
                it.act();
              }}
              onPointerEnter={(e: { pointerType: string }) => { if (e.pointerType === 'mouse') setTip(it.key); }}
              onPointerLeave={() => { if (tipTimer.current) window.clearTimeout(tipTimer.current); setTip((t) => (t === it.key ? null : t)); }}
              onPointerDown={(e: { pointerType: string }) => {
                if (e.pointerType === 'mouse') return;
                tipPress.current = false;
                tipTimer.current = window.setTimeout(() => { tipPress.current = true; setTip(it.key); }, LONG_PRESS_MS);
              }}
              onPointerUp={() => { if (tipTimer.current) window.clearTimeout(tipTimer.current); }}
              onContextMenu={(e: { preventDefault: () => void }) => e.preventDefault()}
              style={{ left: (radial[i]?.x ?? 0) - BUTTON / 2, top: (radial[i]?.y ?? 0) - BUTTON / 2, width: BUTTON, height: BUTTON }}>
              {it.label}
            </button>
          ))}
          {active && menuOpen && mode === 'idle' && tip && (() => {
            const i = items.findIndex((x) => x.key === tip);
            const it = items[i];
            const at = radial[i];
            if (!it || !at) return null;
            // Üst kenara yakın düğmede açıklama düğmenin altında (yoksa ekrandan taşar).
            const below = at.y < box.h * 0.4;
            return (
              <div className={`radial-tip${below ? ' below' : ''}`} role="tooltip"
                style={{ left: Math.min(box.w - 120, Math.max(120, at.x)), top: below ? at.y + BUTTON / 2 + 6 : at.y - BUTTON / 2 - 6 }}>
                <b>{it.label}</b> {actionTip(it.key, it)}
              </div>
            );
          })()}

          {active && actor && actorPx && mode === 'spells' && (() => {
            const list = spellMenu(actor);
            const size = { w: 220, h: Math.min(box.h - 16, 12 + list.length * 48) };
            const at = bubbleAt(actorPx, size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                {list.map(({ spell: sp, kind }) => {
                  const slot = hasSlotFor(actor, sp);
                  const why = economyBlock(state, actor, { type: 'cast_spell', actorId, spellName: sp.name });
                  return (
                    <button key={sp.name} disabled={!slot || why !== null} onClick={() => {
                      if (kind === 'area') { setSpell(sp); setAreaAct({ kind: 'spell', spell: sp }); setAimHex(null); setMode('aim'); }
                      else if (kind === 'target') { setSpell(sp); setMode('spell'); }
                      else if (kind === 'effect') { setSpell(sp); setPicked([]); setChoicePick(sp.mechanics.effect?.choices?.[0] ?? null); setMode('effect'); }
                      else if (kind === 'summon') { setSpell(sp); setChoicePick(summonDef(sp.id)?.choice?.options[0] ?? null); setMode('summon'); }
                      else if (kind === 'teleport') { setSpell(sp); setMode('teleport'); }
                      else run({ type: 'cast_spell', actorId, spellName: sp.name });
                    }}>
                      <span>{sp.name}</span>
                      <small title={why ?? undefined}>{!slot ? B.spellNote.noSlot : why ? B.spellNote.unavailable : sp.castingTime === 'bonus' ? B.spellNote.bonus : sp.castingTime === 'reaction' ? B.spellNote.reaction : kind === 'area' ? B.spellNote.area(sp.area?.sizeFt ?? 0) : sp.mechanics.offCombat ? B.spellNote.offCombat : kind === 'self' ? B.spellNote.self : kind === 'summon' ? t().summons.spellNote(sp.rangeFt) : B.spellNote.range(sp.rangeFt)}</small>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {active && target?.pos && (mode === 'attack' || mode === 'spell') && (() => {
            const picker = mode === 'spell' && spell && actor && slotChoices(actor, spell).length > 1 ? 64 : 0;
            // Cunning Strike seçenekleri (Görev F): başlık + seçenek başına bir satır.
            const cunning = mode === 'attack' && actor && cunningOptions(actor).max > 0 ? 64 + cunningOptions(actor).options.length * 36 : 0;
            const size = { w: 250, h: Math.min(box.h - 16, 40 + choices.length * 56 + picker + cunning) };
            const at = bubbleAt(px(target.pos), size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>{B.targetHead(target.name, target.hp, target.maxHp, target.ac)}</strong>
                {choices.map((ch) => (
                  <div className="choice" key={ch.id}>
                    <div><span>{ch.label}</span><small>{ch.detail}</small></div>
                    <button disabled={!ch.command} onClick={() => ch.command && run(withCunning(withSlot(ch.command, slotPick)))}>{mode === 'spell' ? B.cast : B.hit}</button>
                  </div>
                ))}
                {mode === 'spell' && spell && actor && <SpellOptions actor={actor} spell={spell} value={slotPick} onChange={setSlotPick} mm={mmPick} onMm={setMmPick} tm={tmPick} onTm={setTmPick} state={state} />}
                {mode === 'attack' && actor && cunningOptions(actor).max > 0 && (
                  <fieldset className="cunning-picks">
                    <legend>{N.cunning} <small>{N.cunningHint(cunningOptions(actor).max)}</small></legend>
                    {cunningOptions(actor).options.map((o) => (
                      <label key={o}><input type="checkbox" checked={cunningPicks.includes(o)}
                        onChange={(e: { target: { checked: boolean } }) => setCunningPicks((p) => (e.target.checked ? [...p, o] : p.filter((x) => x !== o)))} />
                        {N.cunningName[o] ?? o} (−{CUNNING[o].dice}d6)</label>
                    ))}
                  </fieldset>
                )}
              </div>
            );
          })()}

          {active && actor && actorPx && mode === 'effect' && spell && (() => {
            const E = t().effects;
            const max = effectTargetCount(spell, slotPick ?? spell.level);
            const opts = spell.mechanics.effect?.choices ?? [];
            const size = { w: 250, h: Math.min(box.h - 16, 110 + (opts.length ? 40 : 0) + (slotChoices(actor, spell).length > 1 ? 64 : 0)) };
            const at = bubbleAt(actorPx, size, box, tokenR + 8);
            const label = (o: string) => E.choiceName[o] ?? (SKILL_IDS.includes(o as never) ? SKILLS[o as keyof typeof SKILLS].name : o);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>{E.pick(spell.name, picked.length, max)}</strong>
                <small>{picked.map((id) => state.combatants[id]?.name ?? id).join(', ')}</small>
                {opts.length > 0 && (
                  <label className="fx-choice">{E.choice}{' '}
                    <select value={choicePick ?? ''} onChange={(e: { target: { value: string } }) => setChoicePick(e.target.value)}>
                      {opts.map((o) => <option key={o} value={o}>{label(o)}</option>)}
                    </select>
                  </label>
                )}
                <SpellOptions actor={actor} spell={spell} value={slotPick} onChange={setSlotPick} mm={mmPick} onMm={setMmPick} tm={tmPick} onTm={setTmPick} state={state} />
                <button className="cta" disabled={picked.length === 0} onClick={() => run({ type: 'cast_spell', actorId, spellName: spell.name, targetIds: picked,
                  ...(choicePick ? { choice: choicePick } : {}), ...(slotPick ? { slotLevel: slotPick } : {}) })}>{E.cast}</button>
              </div>
            );
          })()}

          {active && actor && actorPx && mode === 'summon' && spell && (() => {
            // Çağırma (Görev R3): tür / nefes türü seçimi ve slot; yer haritada vurgulu altıgenlerden seçilir.
            const S = t().summons;
            const def = summonDef(spell.id);
            const opts = def?.choice?.options ?? [];
            const size = { w: 250, h: Math.min(box.h - 16, 70 + (opts.length ? 40 : 0) + (slotChoices(actor, spell).length > 1 ? 64 : 0)) };
            const at = bubbleAt(actorPx, size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>{S.head(spell.name, def?.rangeFt ?? spell.rangeFt)}</strong>
                {summonKeys.size === 0 && <small>{S.noHex}</small>}
                {opts.length > 0 && def?.choice && (
                  <label className="fx-choice">{S.choice[def.choice.kind]}{' '}
                    <select value={choicePick ?? ''} onChange={(e: { target: { value: string } }) => setChoicePick(e.target.value)}>
                      {opts.map((o) => <option key={o} value={o}>{S.choiceName[o] ?? o}</option>)}
                    </select>
                  </label>
                )}
                <SpellOptions actor={actor} spell={spell} value={slotPick} onChange={setSlotPick} mm={mmPick} onMm={setMmPick} tm={tmPick} onTm={setTmPick} state={state} />
              </div>
            );
          })()}

          {active && target?.pos && actor && mode === 'shove' && (() => {
            const to = shoveHex(actor, target);
            const out = to && target.pos ? pushOutcome(state, target, target.pos, to) : null;
            const dc = shoveDc(actor);
            const best = target.saves.str >= target.saves.dex ? 'STR' : 'DEX';
            const size = { w: 260, h: 170 };
            const at = bubbleAt(px(target.pos), size, box, tokenR + 8);
            const cmd = (effect: 'push' | 'prone'): Command => ({ type: 'shove', actorId, targetId: target.id, effect });
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w }}>
                <strong>{B.shove.head(target.name, best, dc)}</strong>
                <div className="choice">
                  <div><span>{B.shove.push}</span><small>{out && to ? (out.ok ? `${hexText(to)}: ${out.note}` : B.shove.cantPush(out.reason)) : B.shove.noPos}</small></div>
                  <button disabled={!out?.ok || !!economyBlock(state, actor, cmd('push'))} onClick={() => run(cmd('push'))}>{B.shove.pushBtn}</button>
                </div>
                <div className="choice">
                  <div><span>{B.shove.prone}</span><small>{target.conditions.includes('Prone') ? B.shove.alreadyProne : 'Prone'}</small></div>
                  <button disabled={!!economyBlock(state, actor, cmd('prone'))} onClick={() => run(cmd('prone'))}>{B.shove.proneBtn}</button>
                </div>
              </div>
            );
          })()}

          {active && actor && jumpAim && (() => {
            const r = jumpRisks.get(hexKey(jumpAim));
            if (!r) return null;
            const pct = (x: number) => B.jump.pct(Math.round(x * 100));
            const size = { w: 260, h: 150 };
            const at = bubbleAt(px(jumpAim), size, box, tokenR + 8);
            return (
              <div className={`bubble${r.pFall > 0 || r.pBurn > 0.25 ? ' warn' : ''}`} style={{ left: at.x, top: at.y, width: size.w }}>
                <strong>{B.jump.head(r.dc, r.over.length)}</strong>
                <small>{B.jump.roll(`${r.bonus >= 0 ? '+' : ''}${r.bonus}`, r.dc)}</small>
                <small>{B.jump.odds(pct(r.pSafe), pct(r.pBurn), `${r.onFail.damage} ${r.onFail.damageType}${r.onFail.condition ? ` + ${r.onFail.condition}` : ''}`, pct(r.pFall))}</small>
                <div className="choice">
                  <button className="ghost" onClick={() => setJumpAim(null)}>{t().common.cancel}</button>
                  <button onClick={() => { const to = jumpAim; setJumpAim(null); run({ type: 'jump', actorId, to }); }}>{B.jump.go}</button>
                </div>
              </div>
            );
          })()}

          {active && actor && actorPx && mode === 'aim' && areaAct && (() => {
            // Alan önizlemesi (Görev R4): etkilenecek düşman/dost sayısı ve adları, yön okları, slot, onay.
            const A = t().area;
            const sp = areaActSpec(actor, areaAct);
            if (!sp) return null;
            const selfShape = sp.spec.origin === 'self' && sp.spec.shape !== 'emanation';
            const needAim = sp.spec.shape !== 'emanation';
            const picker = areaAct.kind === 'spell' && slotChoices(actor, areaAct.spell).length > 1 ? 64 : 0;
            const size = { w: 260, h: Math.min(box.h - 16, 150 + (selfShape ? 96 : 0) + picker) };
            // Balon alanın ve jetonun üstünü kapatmasın: alanın ağırlık merkezinin karşı kenarına yaslanır.
            const pts = [actorPx, ...area.map(px)];
            const cx = pts.reduce((n, q) => n + q.x, 0) / pts.length;
            const cy = pts.reduce((n, q) => n + q.y, 0) / pts.length;
            const at = { x: cx > box.w / 2 ? 8 : Math.max(8, box.w - size.w - 8), y: Math.max(8, Math.min(box.h - size.h - 8, cy - size.h / 2)) };
            const foes = areaInfo?.foes ?? [];
            const friends = areaInfo?.friends ?? [];
            const ready = !needAim || !!aimHex;
            return (
              <div className="bubble area-bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }} role="dialog" aria-label={sp.label}>
                <strong>{A.head(sp.label, sp.spec.sizeFt, t().log.shapeName[sp.spec.shape] ?? sp.spec.shape)}</strong>
                {!ready && <small>{selfShape ? A.pickDir : A.pickPoint}</small>}
                {ready && areaInfo?.error && <small className="warn-text">{areaInfo.error}</small>}
                {ready && !areaInfo?.error && (
                  <small>
                    <span className="area-count foe">{A.foes(foes.length)}</span>{' · '}
                    <span className={`area-count friend${friends.length ? ' bad' : ''}`}>{A.friends(friends.length)}</span>
                    {foes.length + friends.length > 0 && <><br />{[...foes, ...friends].map((c) => c.name).join(', ')}</>}
                  </small>
                )}
                {selfShape && actor.pos && (
                  <div className="dir-pad" role="group" aria-label={A.directions}>
                    {directionAims(actor.pos, sp.spec.sizeFt).map(({ dir, aim }) => (
                      <button key={dir} type="button" className={`dir d${dir}`} aria-label={A.dirName[dir]}
                        onClick={() => setAimHex(aim)}>{['↑', '↗', '↘', '↓', '↙', '↖'][dir]}</button>
                    ))}
                  </div>
                )}
                {sp.spec.shape === 'wall' && (
                  <div className="wall-shape" role="group" aria-label={A.wallShape}>
                    <button type="button" className={wallArc ? '' : 'on'} aria-pressed={!wallArc} onClick={() => setWallArc(false)}>{A.wallStraight}</button>
                    <button type="button" className={wallArc ? 'on' : ''} aria-pressed={wallArc} onClick={() => setWallArc(true)}>{A.wallArc}</button>
                  </div>
                )}
                {areaAct.kind === 'spell' && <SpellOptions actor={actor} spell={areaAct.spell} value={slotPick} onChange={setSlotPick} mm={mmPick} onMm={setMmPick} tm={tmPick} onTm={setTmPick} state={state} />}
                <button className="cta" disabled={!ready || !!areaInfo?.error}
                  onClick={() => run(areaActCommand(actorId, areaAct, needAim ? aimHex : null, slotPick, wallArc ? 'arc' : null))}>
                  {areaAct.kind === 'spell' ? B.cast : A.go(foes.length + friends.length)}
                </button>
              </div>
            );
          })()}

          {active && actor && actorPx && mode === 'areas' && (() => {
            // Alan eylemleri listesi: canavarın alanlı saldırıları ve Dragonborn nefesi (Görev R4).
            const A = t().area;
            const list: Array<{ key: string; label: string; act: AreaAct; why: string | null }> = [
              ...areaAttacksOf(actor).map((x) => ({ key: `m${x.index}`, label: x.name, act: { kind: 'monster', index: x.index } as AreaAct,
                why: !x.ready ? A.recharge : economyBlock(state, actor, { type: 'monster_attack', actorId, targetId: '', attackIndex: x.index }) })),
              ...(actor.breath?.shapes ?? []).map((sh) => ({ key: `b${sh.shape}`, label: A.breathShape(sh.shape, sh.sizeFt), act: { kind: 'breath', shape: sh.shape } as AreaAct,
                why: (actor.resources[actor.breath?.resource ?? ''] ?? 0) <= 0 ? A.noUses : economyBlock(state, actor, { type: 'breath_weapon', actorId, shape: sh.shape, targetHex: actor.pos as Offset }) })),
            ];
            const size = { w: 240, h: Math.min(box.h - 16, 12 + list.length * 48) };
            const at = bubbleAt(actorPx, size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                {list.map((x) => (
                  <button key={x.key} disabled={x.why !== null} onClick={() => { setAreaAct(x.act); setAimHex(null); setMode('aim'); }}>
                    <span>{x.label}</span><small>{x.why ?? ''}</small>
                  </button>
                ))}
              </div>
            );
          })()}

          {state.map?.objective && (
            <div className="objective">{B.objective(civiliansAlive(state), state.map.objective.total)}
              {state.map.objective.strict ? B.objectiveStrict(state.map.objective.needed) : ''}</div>
          )}
          {active && actor && gateAim && gm.gate && (() => {
            const size = { w: 250, h: Math.min(box.h - 16, 40 + actor.weaponOptions.length * 56) };
            const at = bubbleAt(px(gm.gate.at), size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>{B.gate}</strong>
                {actor.weaponOptions.map((w) => (
                  <div className="choice" key={w.label}>
                    <div><span>{w.label}</span><small>{w.damage}</small></div>
                    <button onClick={() => gm.gate && run({ type: 'attack_gate', actorId, at: gm.gate.at, option: w })}>{B.hit}</button>
                  </div>
                ))}
                {actor.weaponOptions.length === 0 && <small>{B.noWeapon}</small>}
              </div>
            );
          })()}
          {active && actor && (
            <div className="economy" aria-label={B.economy.label}>
              <span className={actor.economy.action && actor.economy.attacksLeft === 0 ? 'spent' : ''}>{B.economy.action(actor.economy.attacksLeft)}</span>
              <span className={actor.economy.bonus ? 'spent' : ''}>{B.economy.bonus}</span>
              <span className={actor.economy.reaction ? 'spent' : ''}>{B.economy.reaction}</span>
              <span>{B.economy.move(Math.max(0, speedHexes(actor) - actor.movementUsed), speedHexes(actor))}</span>
            </div>
          )}
          {setup && <button className="hud-cta" onClick={() => run({ type: 'start_battle' })}>{B.start}</button>}
          {endFx && state.status === 'finished' && <Suspense fallback={null}><EndFx outcome={endFx} /></Suspense>}
          {state.status === 'finished' && (() => {
            const sum = battleSummary(session.events, state);
            return (
              <div className="hud-banner summary">
                <div className="summary-head">
                  <strong>{state.winner === 'party' ? B.summary.party : B.summary.enemies}</strong>
                  <span>{B.summary.rounds(sum.rounds)}</span>
                  {sum.civilians && <span>{B.summary.civilians(sum.civilians.saved, sum.civilians.dead)}</span>}
                  <button onClick={() => props.onExit(session.state)}>{props.exitLabel ?? B.newBattle}</button>
                </div>
                <table>
                  <thead><tr>{B.summary.cols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sum.rows.map((r) => (
                      <tr key={r.id} className={r.side}>
                        <td>{r.name}{r.civilian ? B.summary.civilian : ''}</td><td>{r.dealt}</td><td>{r.taken}</td><td>{r.healed}</td><td>{r.downed}</td>
                        <td>{r.hpEnd}/{r.maxHp} {B.summary.status[r.status] ? `(${B.summary.status[r.status]})` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
          {active && actor?.side === 'enemies' && (
            <button className="hud-btn enemy-play" onClick={() => dice.play((rng) => autoplayEnemyTurns(session, rng))}>{B.enemyPlay}</button>
          )}
          {active && actor?.side === 'party' && actor.summon && (
            <button className="hud-btn enemy-play" onClick={() => { dice.play((rng) => autoplaySummonTurn(session, rng)); reset(); }}>{t().summons.autoplay}</button>
          )}

          <div className={`hud-corner bl${logOpen ? ' open' : ''}`}>
            <div className="toasts" aria-live="polite">
              {!logOpen && toasts.map((t) => <div key={t.id} className={`toast${t.error ? ' error' : ''}`}>{t.text}</div>)}
            </div>
            {logOpen && (
              <ol className="log-box">
                {[...logLines].reverse().slice(0, 40).map((line, i) => <li key={`${logLines.length - i}`}>{line}</li>)}
              </ol>
            )}
            <button className="hud-btn" onClick={() => setLogOpen((o) => !o)}>{B.log(logOpen)}</button>
          </div>

          {confirmWake && sleepingDragon(state) && (
            <div className="bubble warn" style={{ left: Math.max(8, box.w / 2 - 140), top: 60, width: 280 }} role="dialog" aria-label={B.wakeDialog.label}>
              <strong>{B.wakeDialog.title}</strong>
              <small>{B.wakeDialog.text(sleepingDragon(state)?.name ?? '')}</small>
              <div className="choice">
                <button className="ghost" onClick={() => setConfirmWake(false)}>{t().common.cancel}</button>
                <button onClick={() => { setConfirmWake(false); run({ type: 'wake_dragon' }); }}>{B.wakeDialog.go}</button>
              </div>
            </div>
          )}

          {infoHex && (
            <div className="hud-corner tr info-box">
              <span>{mode === 'jump' && jumpRisks.get(hexKey(infoHex))
                ? B.jump.info(jumpRisks.get(hexKey(infoHex))?.dc ?? 0, jumpRisks.get(hexKey(infoHex))?.over.length ?? 0, Math.round((jumpRisks.get(hexKey(infoHex))?.pFall ?? 0) * 100))
                : mode === 'jump' && fromPos && jumpKeys.has(hexKey(infoHex)) ? B.jump.flyInfo(lavaOver(state, fromPos, infoHex).length) : ''}
                {(() => { const who = occupantAt(state, infoHex); return who?.civilian ? `${displayName(who)} · ` : ''; })()}
                {terrainInfo(state, infoHex, actor)}</span>
              <button className="hud-btn small" aria-label={t().common.close} onClick={() => setInfoHex(null)}>✕</button>
            </div>
          )}

          {setup && selected && state.combatants[selected]?.civilian && (() => {
            // Kurulumda masum görünümü (GM): 8 görselden biri; aynı görsel birden çok masumda olabilir.
            const c = state.combatants[selected] as Combatant;
            return (
              <div className="civ-picker" role="group" aria-label={B.civPicker(c.name)}>
                <strong>{B.civPicker(c.name)}</strong>
                <div className="civ-grid">
                  {CIVILIAN_LOOKS.map((l) => (
                    <button key={l.id} className={l.id === c.gorselId ? 'on' : ''} aria-pressed={l.id === c.gorselId}
                      onClick={() => setSession((s) => dispatch(s, { type: 'choose_civilian_art', actorId: c.id, gorselId: l.id }, Math.random, GM_CONTEXT))}>
                      <img src={`${BASE}${l.image}`} alt="" draggable={false} />
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {setup && selected && (() => {
            // Kurulumda yapılan çağırma (Find Familiar ritüeli, Görev R3; Animate Dead, Görev S1): biçim ve tür seçilir,
            // yaratık sahibinin yanında belirir. Her büyü için ayrı satır.
            const c = state.combatants[selected];
            const rituals = c && !c.summon && c.pos ? spells.filter((sp) => sp.castingTime === 'ritual' && sp.mechanics.kind === 'summon' && c.spellNames.includes(sp.name) && summonDef(sp.id)) : [];
            if (!c || rituals.length === 0) return null;
            const F = t().summons;
            return (
              <div className="civ-picker familiar-picker" role="group" aria-label={F.familiar.title(c.name, rituals[0]?.name ?? '')}>
                {rituals.map((ritual) => {
                  const def = summonDef(ritual.id) as NonNullable<ReturnType<typeof summonDef>>;
                  const form = famForm && def.forms?.includes(famForm) ? famForm : def.forms?.[0] ?? '';
                  const kind = famType && def.choice?.options.includes(famType) ? famType : def.choice?.options[0] ?? '';
                  return (
                    <div key={ritual.id} className="setup-summon">
                      <strong>{F.familiar.title(c.name, ritual.name)}</strong>
                      <small>{def.setupSlot ? F.familiar.noteSlot : F.familiar.note}</small>
                      {(def.forms ?? []).length > 0 && (
                        <label className="fx-choice">{F.familiar.form}{' '}
                          <select value={form} onChange={(e: { target: { value: string } }) => setFamForm(e.target.value)}>
                            {(def.forms ?? []).map((f) => <option key={f} value={f}>{getMonster(f).name}</option>)}
                          </select>
                        </label>
                      )}
                      {def.choice && (
                        <label className="fx-choice">{F.choice[def.choice.kind]}{' '}
                          <select value={kind} onChange={(e: { target: { value: string } }) => setFamType(e.target.value)}>
                            {def.choice.options.map((o) => <option key={o} value={o}>{F.choiceName[o] ?? o}</option>)}
                          </select>
                        </label>
                      )}
                      <button className="cta" onClick={() => dice.play((rng) => dispatch(session, { type: 'cast_spell', actorId: c.id, spellName: ritual.name, ...(form ? { form } : {}), ...(kind ? { choice: kind } : {}) }, rng))}>
                        {F.familiar.cast(ritual.name)}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {timings && diceQueue.length > 0 && (
            <Suspense fallback={null}>
              <DiceTray items={diceQueue} timings={timings} theme={diceTheme} allow3d={dice3dAllowed(diceAnim, reduceMotion)}
                onDone={(id) => setDiceQueue((q) => q.filter((x) => x.id !== id))} onSkip={() => setDiceQueue([])} />
            </Suspense>
          )}
          {dice.reaction && (
            <ReactionPrompt key={`${dice.reaction.reactorId}:${dice.reaction.trigger}:${session.events.length}`} request={dice.reaction} state={state} onAnswer={dice.answer} />
          )}
          {dice.pending && (
            <DicePrompt key={dice.pending.step} request={dice.pending.request}
              whoName={dice.pending.request.by ? state.combatants[dice.pending.request.by]?.name ?? null : null}
              onEnter={dice.enter} onAuto={dice.autoRoll} onCancel={dice.cancel} />
          )}

          {drawerId && state.combatants[drawerId] && (
            <Drawer c={state.combatants[drawerId] as Combatant} state={state} onClose={() => setDrawerId(null)}
              notes={state.combatants[drawerId]?.asleep ? wakeNotes(state) : undefined}
              onExhaustion={state.status === 'active' ? (level) => setSession((s) => dispatch(s, { type: 'set_exhaustion', targetId: drawerId, level }, Math.random, GM_CONTEXT)) : undefined} />
          )}
        </div>
      </div>
      <p className="portrait-hint">{B.portrait}</p>
    </div>
  );
}

/** Gizli jetonun örtüsü: kum yığını, yaprak öbeği ya da gölge (yarı saydam, jetonun alt yarısı). */
function HideCoverArt(props: { kind: 'sand' | 'leaves' | 'shadow'; x: number; y: number; r: number }) {
  const { kind, x, y, r } = props;
  if (kind === 'sand') {
    return (
      <g className="hide-cover sand">
        <path d={`M ${x - r * 1.15} ${y + r * 0.95} Q ${x - r * 0.5} ${y + r * 0.05} ${x} ${y + r * 0.2} Q ${x + r * 0.55} ${y - r * 0.05} ${x + r * 1.15} ${y + r * 0.95} Z`} />
        <path d={`M ${x - r * 0.7} ${y + r * 0.6} q ${r * 0.25} -${r * 0.15} ${r * 0.5} 0 M ${x + r * 0.1} ${y + r * 0.45} q ${r * 0.25} -${r * 0.15} ${r * 0.5} 0`} className="ripple" />
      </g>
    );
  }
  if (kind === 'leaves') {
    const leaf = (cx: number, cy: number, rot: number, i: number) => (
      <ellipse key={i} cx={cx} cy={cy} rx={r * 0.34} ry={r * 0.17} transform={`rotate(${rot} ${cx} ${cy})`} />
    );
    return (
      <g className="hide-cover leaves">
        {[[-0.7, 0.55, -30], [-0.25, 0.75, 20], [0.25, 0.6, -15], [0.7, 0.7, 35], [0, 0.35, 70], [-0.5, 0.15, 50], [0.55, 0.2, -50]]
          .map(([dx, dy, rot], i) => leaf(x + (dx ?? 0) * r, y + (dy ?? 0) * r, rot ?? 0, i))}
      </g>
    );
  }
  return <ellipse className="hide-cover shadow" cx={x} cy={y + r * 0.2} rx={r * 1.15} ry={r * 0.95} />;
}

/**
 * Göz-çizgili simge (gizli, saklanılabilir): renk körü için yalnız renge güvenilmez; bölgede kesikli çerçeve ile birlikte.
 */
function EyeSlash(props: { x: number; y: number; r: number }) {
  const { x, y, r } = props;
  return (
    <g className="eye-slash" transform={`translate(${x},${y})`}>
      <circle r={r} />
      <path d={`M ${-r * 0.62} 0 Q 0 ${-r * 0.6} ${r * 0.62} 0 Q 0 ${r * 0.6} ${-r * 0.62} 0 Z`} />
      <circle r={r * 0.2} className="pupil" />
      <path d={`M ${-r * 0.6} ${r * 0.6} L ${r * 0.6} ${-r * 0.6}`} className="slash" />
    </g>
  );
}
