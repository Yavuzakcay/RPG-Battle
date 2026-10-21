/**
 * Haritalı savaş ekranı (Adım 10a/10b): harita tam ekran, arayüz haritanın üstünde yüzen
 * parçalar (HUD). Sırası gelen savaşçının jetonunun yanında yüzen eylem menüsü, hedefin
 * yanında önizleme balonu, üstte avatarlı sıra şeridi, köşede savaş günlüğü ve toast'lar,
 * karakter çekmecesi. Hareketli katman ve harita kuralları (Adım 8) henüz yok; animasyonlar
 * en sona bırakıldı (Adım 12).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Spell } from './data';
import type { Combatant, Command } from './battle';
import { maps } from './map/maps';
import { economyBlock, preferBonus } from './battle/economy';
import { optionalRules, ruleOf, stuckInBog } from './battle/maprules';
import { standUpProblem } from './battle/grapple';
import { civiliansAlive } from './battle/common';
import { hexLabel, speedHexes } from './battle/movement';
import { distance, hexKey, sameHex, type Offset } from './rules/hex';
import { SKILLS, SKILL_IDS, skillBonus } from './rules/skills';
import { GM_CONTEXT, contextFor, dispatch, type Session } from './ui/session';
import { execute } from './battle';
import { pushOutcome, shoveDc, shoveHex } from './battle/forced';
import { jumpTargets, lavaOver } from './battle/jumprisk';
import { sleepingDragon, wakeRule } from './battle/dragon';
import {
  VIEW, allHexes, areaPreview, attackChoices, gmMapActions, hexCenter, hexPoints, jumpHexes, mapMarks, movableHexes,
  placeHexes, terrainInfo,
} from './ui/mapView';
import {
  attackTargets, bubbleAt, hasSlotFor, isSpellChoice, radialLayout, spellMenu, spellTargets, type Box, type Point,
} from './ui/hud';
import { AvatarBadge, AvatarCircle } from './ui/Avatar';
import { drawOrder, tokenScale } from './ui/tokenSize';
import { actionTip } from './ui/actionHints';
import { FLOAT_ICON, OUTCOME_MS, FLOAT_STAGGER_MS, damageHits, outcomeMarks, statusIcons, type DamageHit, type OutcomeMark } from './ui/damageFloats';
import { hasSavedBattle, loadBattle, saveBattle } from './app/battleSave';
import { ThemeButton } from './ui/theme';
import { battleSummary } from './app/setup';
import { autoplayEnemyTurns } from './ui/autoplay';
import { EffectsLayer, useEffectsSetting } from './ui/EffectsLayer';
import { hideBlockReason, hideCover, hideSpots, revealPuff, tokenView, viewerOf } from './ui/stealthView';

const BASE = import.meta.env.BASE_URL;
const RATIO = VIEW.w / VIEW.h;
const HEX_H = VIEW.h / 7.5;
const LONG_PRESS_MS = 450;
const TOAST_MS = 4000;
const BUTTON = 56;

type Mode = 'idle' | 'attack' | 'spells' | 'spell' | 'aim' | 'pull' | 'erupt' | 'followup' | 'shove' | 'jump' | 'help';

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

/** Uyuyan ejderhanın uyanma koşulları (bilgi paneli), varyantın değerleriyle. */
function wakeNotes(state: Parameters<typeof wakeRule>[0]): string[] {
  const w = wakeRule(state);
  const mode = state.map?.dragon;
  return [
    'Uyanır: herhangi bir hasar alırsa.',
    `Uyanır: ${w.loudFt} ft içinde gürültülü büyü/yetenek (${[...w.loud.names, ...w.loud.damageTypes].join(', ')}).`,
    'Uyanır: bitişik altıgene bir yaratık girerse (yürürken geçmek dahil).',
    `Her tur sonunda ${w.perceptionFt} ft içindeki gizlenmemiş her karakter için Algı: d20 + Perception ≥ ${w.perceptionDc} ise uyanır.`,
    `Yapay zekâ düşmanları: ${mode?.mode === 'chance' ? `her turda %${mode.chancePct} uyandırmaya yeltenir` : mode?.mode === 'gm' ? 'dokunmaz; yalnızca GM uyandırır' : 'asla uyandırmaz'}.`,
    'GM her an "GM: Ejderhayı uyandır" ile uyandırabilir.',
  ];
}

function Drawer(props: { c: Combatant; onClose: () => void; notes?: string[] }) {
  const { c } = props;
  const mod = (n: number) => (n >= 0 ? `+${n}` : String(n));
  return (
    <aside className="drawer" aria-label={`${c.name} ayrıntıları`}>
      <div className="drawer-head">
        <AvatarBadge avatar={c.avatar} size={56} ring={c.side === 'party' ? 'var(--party)' : 'var(--enemy)'} />
        <div>
          <strong>{c.name}</strong>
          <small>HP {c.hp}/{c.maxHp} · AC {c.ac} · hız {c.speed} ft{c.fly ? ` · uçuş ${c.fly} ft` : ''}</small>
        </div>
        <button className="hud-btn" aria-label="Kapat" onClick={props.onClose}>✕</button>
      </div>
      {c.asleep && <p><b>Uyuyor (Zzz):</b> turunu atlar, hareket etmez, yakın dövüş saldırıları avantajlı.</p>}
      {(props.notes ?? []).length > 0 && <ul className="wake-notes">{props.notes?.map((n) => <li key={n}>{n}</li>)}</ul>}
      {c.conditions.length > 0 && <p>Durumlar: {c.conditions.join(', ')}</p>}
      {c.hidden && <p>Gizlenmiş (bulunma DC {c.hidden.dc})</p>}
      <p>Bu tur hareket: {c.movementUsed} altıgen harcandı</p>
      <p>Beceriler: {SKILL_IDS.filter((s) => c.skills[s] !== undefined).map((s) => `${SKILLS[s].name} ${mod(c.skills[s] as number)}`).join(' · ') || 'yetkinlik yok'}
        {' '}(Stealth {mod(skillBonus(c, 'stealth'))}{c.stealthDisadvantage ? ', dezavantaj' : ''}, Perception {mod(skillBonus(c, 'perception'))})</p>
      <p>Save: {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((a) => `${a.toUpperCase()} ${mod(c.saves[a])}`).join(' · ')}</p>
      {c.weaponOptions.length > 0 && (
        <ul>{c.weaponOptions.map((o) => <li key={o.label}>{o.label}: {mod(o.attackBonus)} vuruş, {o.damage} {o.damageType ?? ''}{o.range ? ` (${o.range[0]}/${o.range[1]} ft)` : ` (erişim ${o.reachFt ?? 5} ft)`}</li>)}</ul>
      )}
      {c.attacks.length > 0 && (
        <ul>{c.attacks.map((a) => <li key={a.name}>{a.name}: {a.save ? `DC ${a.save.dc} ${a.save.ability.toUpperCase()}` : mod(a.bonus)} · {a.text}{a.repeat > 1 ? ` ×${a.repeat}` : ''}</li>)}</ul>
      )}
      {c.spellNames.length > 0 && <p>Büyüler: {c.spellNames.join(', ')}</p>}
      {c.concentration && <p>Konsantrasyon: {c.concentration.spell}</p>}
      {(c.resources.actionSurge + c.resources.secondWind + c.resources.favoredEnemy > 0 || c.sneakAttackDice > 0) && (
        <p>Özellikler: {[
          c.resources.actionSurge > 0 ? `Action Surge ${c.resources.actionSurge}` : '',
          c.resources.secondWind > 0 ? `Second Wind ${c.resources.secondWind}` : '',
          c.resources.favoredEnemy > 0 ? `Favored Enemy ${c.resources.favoredEnemy}` : '',
          c.sneakAttackDice > 0 ? `Sneak Attack ${c.sneakAttackDice}d6` : '',
        ].filter(Boolean).join(' · ')}</p>
      )}
      {c.spellSlots.some((n) => n > 0) && <p>Slotlar: {c.spellSlots.map((n, i) => (n > 0 ? `${i + 1}. sev. ${n}` : '')).filter(Boolean).join(' · ')}</p>}
    </aside>
  );
}

/** Haritalı savaş ekranı. `exitLabel` çıkış düğmesinin adı (kurulum ekranına dönüş). */
export function Battle(props: { initial: Session; onExit: () => void; exitLabel?: string }) {
  const box = useStage();
  const [session, setSession] = useState<Session>(props.initial);
  // Otomatik kayıt: her tur (round) sonunda ve savaş bitince (tek kayıt yuvası, olay günlüğü).
  useEffect(() => {
    if (session.state.status !== 'setup') saveBattle(session);
  }, [session.state.round, session.state.status]);
  const [mode, setMode] = useState<Mode>('idle');
  const [spell, setSpell] = useState<Spell | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [aimHex, setAimHex] = useState<Offset | null>(null);
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
  const [confirmWake, setConfirmWake] = useState(false);
  const [jumpAim, setJumpAim] = useState<Offset | null>(null);
  const [puffs, setPuffs] = useState<Array<{ id: number; at: Offset; kind: 'leaves' | 'dust' }>>([]);
  const seenEvents = useRef(session.events.length);
  // Durum/zemin hasarı animasyonu: yalnızca canlı gelen yeni olaylar (kayıt yüklenince toplu oynamaz).
  const [floats, setFloats] = useState<Array<DamageHit & { id: number; delay: number }>>([]);
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
  const variant = maps.find((m) => m.id === state.map?.id)?.variants.find((v) => v.id === state.map?.variantId);
  const [fxOn, setFxOn] = useEffectsSetting();
  const actorId = state.order[state.turnIndex] ?? '';
  const actor = state.combatants[actorId];
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
    const items = damageHits(fresh).map((h, i) => ({ ...h, id: Math.random(), delay: i * FLOAT_STAGGER_MS }));
    const marks = outcomeMarks(fresh).map((m, i) => ({ ...m, id: Math.random(), delay: i * FLOAT_STAGGER_MS }));
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

  // Sıra değişince menü yeniden açılır, kip sıfırlanır.
  useEffect(() => { setMenuOpen(true); setMode('idle'); setSpell(null); setTargetId(null); setAimHex(null); setTip(null); }, [actorId, state.round]);

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
    if (mode === 'shove') {
      // İtilebilecek bitişik hedefler (motorda zarsız denenerek: yere düşürme her zaman denenebilir).
      return new Set(Object.values(state.combatants)
        .filter((c) => c.side !== actor?.side && execute(state, { type: 'shove', actorId, targetId: c.id, effect: 'prone' }, contextFor(state, actorId), () => 0.5).ok)
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
  }, [state, active, actorId, mode, spell]);
  const area = useMemo(() => (mode === 'aim' && spell && actor ? areaPreview(state, actor, spell, aimHex) : []), [state, actor, spell, aimHex, mode]);

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
  const reset = () => { setJumpAim(null); setMode('idle'); setSpell(null); setTargetId(null); setAimHex(null); setGateAim(false); setMenuOpen(true); setMoveMenu(false); };
  const run = (cmd: Command) => { setSession((s) => dispatch(s, cmd, Math.random)); reset(); };
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
    if (mode === 'aim' && spell) { setAimHex(h); return; }
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
    if (mode === 'aim' && c.pos) { setAimHex(c.pos); return; }
    if (mode === 'erupt' && c.pos) { run({ type: 'map_trigger', rule: 'eruption', at: c.pos }); return; }
    if (c.id === actorId) { if (mode === 'idle') setMenuOpen((o) => !o); else reset(); return; }
    if ((mode === 'attack' || mode === 'spell' || mode === 'shove') && glowing.has(c.id)) setTargetId(c.id);
    if (mode === 'pull' && glowing.has(c.id)) run({ type: 'pull', actorId, targetId: c.id });
    if (mode === 'help' && glowing.has(c.id)) run({ type: 'help', actorId, targetId: c.id });
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
  const targeting = active && ['attack', 'spell', 'shove', 'help', 'followup', 'pull'].includes(mode);
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
    if (mode === 'attack' && gm.gate?.state === 'closed' && sameHex(gm.gate.at, h)) return 'hx gate-target';
    if (marks.warn.has(k)) return 'hx warn';
    if (zoneKeys.has(k)) return 'hx zone';
    if (movable.has(k)) return movable.get(k) === 1 ? 'hx move' : 'hx move far';
    if (jumpKeys.has(k)) return jumpRisks.has(k) ? 'hx jump risky' : 'hx jump';
    return 'hx';
  };

  // Yüzen eylem menüsü
  const hideReason = actor ? hideBlockReason(state, actor) : null;
  const spots = useMemo(() => (active && mode === 'idle' && actor && actor.side === 'party' && !actor.civilian
    ? hideSpots(state, actor, movable.keys()) : []), [state, active, mode, actor, movable]);
  // Eylem düğmeleri (Görev F): o an yapılamayan pasif (aria-disabled, tıklanmaz, açıklamada nedeni);
  // karakterin hiç yapamayacağı (büyüsüz karakterde Büyü, Fighter olmayanda Atılım/İkinci Soluk) hiç gösterilmez.
  const why = (cmd: Command) => (actor ? economyBlock(state, actor, cmd) : 'Sıra sende değil.');
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
  const hasFeature = (k: 'actionSurge' | 'secondWind') => (firstStart?.resources[k] ?? actor?.resources[k] ?? 0) > 0;
  type Item = { key: string; label: string; reason?: string; act: () => void };
  const speedZero = actor?.conditions.some((c) => c === 'Grappled' || c === 'Restrained') ? 'Hızın 0 (yakalanmış ya da Restrained).' : null;
  const moveItems: Item[] = actor ? [
    { key: 'walk', label: 'Yürü',
      reason: speedZero ?? (actor.movementUsed >= speedHexes(actor) ? 'Bu tur hareketin bitti.' : movable.size === 0 ? 'Gidilebilecek boş altıgen yok.' : undefined),
      act: () => { reset(); setMoveMenu(false); setMenuOpen(false); } },
    { key: 'dash', label: 'Koş', reason: why(bonusCmd('dash')) ?? undefined, act: () => { run(bonusCmd('dash')); setMoveMenu(false); } },
    { key: 'disengage', label: 'Geri Çekil', reason: why(bonusCmd('disengage')) ?? undefined, act: () => { run(bonusCmd('disengage')); setMoveMenu(false); } },
    { key: 'back', label: '‹ Geri', act: () => setMoveMenu(false) },
  ] : [];
  const spellReason = !actor ? undefined : spellMenu(actor).every(({ spell: sp }) => blocked({ type: 'cast_spell', actorId, spellName: sp.name }))
    ? 'Şu an yapılabilecek büyü yok (eylem ya da büyü slotu kalmadı).' : undefined;
  const attackReason = !canAttack ? 'Bu tur eylemini ya da saldırı hakkını kullandın.' : reach.attack === 0 ? 'Menzilde saldırılabilecek hedef yok.' : undefined;
  const mainItems: Item[] = actor ? [
    { key: 'move', label: 'Hareket',
      reason: moveItems.slice(0, 3).every((m) => m.reason) ? (speedZero ?? 'Yürüyemez, koşamaz, geri çekilemez (hareket ve eylem bitti).') : undefined,
      act: () => setMoveMenu(true) },
    ...(ruleOf(state, 'lavJump') ? [{ key: 'jump', label: 'Atla',
      reason: actor.movementUsed > 0 ? 'Ada atlaması hareketin yerine geçer: bu tur yürüdün.' : islandJumps.length === 0 ? 'Atlanabilecek ada yok.' : undefined,
      act: () => { reset(); setMode('jump'); setMenuOpen(false); } }] : []),
    { key: 'attack', label: 'Saldır', reason: attackReason, act: () => { reset(); setMode('attack'); setMenuOpen(false); } },
    ...(actor.spellNames.length > 0 ? [{ key: 'spell', label: 'Büyü', reason: spellReason, act: () => { reset(); setMode('spells'); setMenuOpen(false); } }] : []),
    { key: 'hide', label: 'Gizlen', reason: hideReason ?? undefined, act: () => run(bonusCmd('hide')) },
    { key: 'shove', label: 'İt',
      reason: !canAttack ? 'Bu tur eylemini ya da saldırı hakkını kullandın.' : why({ type: 'shove', actorId, targetId: '', effect: 'prone' })
        ?? (reach.shove === 0 ? 'Bitişikte itilebilecek hedef yok.' : undefined),
      act: () => { reset(); setMode('shove'); setMenuOpen(false); } },
    { key: 'dodge', label: 'Kaçın', reason: why({ type: 'dodge', actorId }) ?? undefined, act: () => run({ type: 'dodge', actorId }) },
    { key: 'help', label: 'Yardım', reason: why({ type: 'help', actorId, targetId: '' }) ?? (reach.help === 0 ? 'Bitişikte düşman yok.' : undefined),
      act: () => { reset(); setMode('help'); setMenuOpen(false); } },
    { key: 'search', label: 'Ara', reason: why({ type: 'search', actorId }) ?? undefined, act: () => run({ type: 'search', actorId }) },
    ...(actor.conditions.includes('Prone') ? [{ key: 'stand', label: 'Kalk', reason: standUpProblem(actor) ?? undefined,
      act: () => run({ type: 'stand_up', actorId }) }] : []),
    ...(actor.grapple ? [{ key: 'escape_grapple', label: 'Kaçmaya çalış', reason: why({ type: 'escape_grapple', actorId }) ?? undefined,
      act: () => run({ type: 'escape_grapple', actorId }) }] : []),
    ...(stuckInBog(state, actor) ? [{ key: 'escape', label: 'Çık', reason: why({ type: 'escape', actorId }) ?? undefined, act: () => run({ type: 'escape', actorId }) }] : []),
    ...(actor.pos && Object.values(state.combatants).some((c) => c.side === actor.side && c.id !== actor.id && c.pos && actor.pos
      && distance(c.pos, actor.pos) === 1 && stuckInBog(state, c))
      ? [{ key: 'pull', label: 'Çek', reason: why({ type: 'pull', actorId, targetId: '' }) ?? undefined, act: () => { reset(); setMode('pull'); setMenuOpen(false); } }] : []),
    ...(hasFeature('actionSurge') ? [{ key: 'surge', label: 'Atılım',
      reason: actor.resources.actionSurge <= 0 ? 'Bu savaşta kullanıldı.' : actor.economy.surged ? 'Bu tur zaten kullandın.'
        : !actor.economy.action || actor.economy.attacksLeft > 0 ? 'Önce eylemini kullan (Atılım ikinci bir eylem verir).' : undefined,
      act: () => run({ type: 'action_surge', actorId }) }] : []),
    ...(hasFeature('secondWind') ? [{ key: 'wind', label: 'İkinci Soluk',
      reason: actor.resources.secondWind <= 0 ? 'Bu savaşta hakkın kalmadı.' : why({ type: 'second_wind', actorId }) ?? (actor.hp >= actor.maxHp ? 'HP zaten dolu.' : undefined),
      act: () => run({ type: 'second_wind', actorId }) }] : []),
    ...(actor.concentration && ['Spiritual Weapon', "Hunter's Mark"].includes(actor.concentration.spell)
      ? [{ key: 'followup', label: actor.concentration.spell === "Hunter's Mark" ? 'İşaret' : 'Silah',
        reason: why({ type: 'spell_followup', actorId, targetId: '' }) ?? (reach.followup === 0 ? 'Uygun hedef yok.' : undefined),
        act: () => { reset(); setMode('followup'); setMenuOpen(false); } }] : []),
    { key: 'end', label: 'Turu bitir', act: () => run({ type: 'end_turn', actorId }) },
  ] : [];
  const items: Item[] = moveMenu ? moveItems : mainItems;
  const actorPx = actor?.pos ? px(actor.pos) : null;
  const radial = actorPx ? radialLayout(actorPx, items.length, box, tokenR + BUTTON / 2 + 10, BUTTON) : [];

  const target = targetId ? state.combatants[targetId] : undefined;
  const choices = active && target ? attackChoices(state, actorId, target.id)
    .filter((ch) => (mode === 'spell' && spell ? ch.id === `s-${spell.name}` : !isSpellChoice(ch))) : [];
  const affected = mode === 'aim' ? Object.values(state.combatants).filter((c) => c.pos && areaKeys.has(hexKey(c.pos))) : [];
  const modeHint: Record<Mode, string> = {
    idle: '', attack: 'Saldır: parlayan bir hedefe dokunun.', spells: 'Bir büyü seçin.',
    spell: `${spell?.name ?? ''}: parlayan bir hedefe dokunun.`, aim: `${spell?.name ?? ''}: hedef altıgene dokunun.`,
    pull: 'Çek: batmış müttefike dokunun.', help: 'Yardım: bitişik bir düşmana dokunun.', erupt: 'Patlama: merkez altıgene dokunun.',
    followup: `${actor?.concentration?.spell ?? ''}: parlayan bir hedefe dokunun.`,
    shove: 'İt: parlayan bitişik bir hedefe dokunun.',
    jump: 'Atla: turuncu ada altıgenine dokunun (DC altıgende). Vazgeçmek için kendinize dokunun.',
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
        {artError && <div className="art-error" role="alert">Harita görseli yüklenemedi: {artError}</div>}
        {state.map && variant && (
          <EffectsLayer effects={variant.effects ?? []} tiles={state.map.tiles} mirrored={state.map.mirrored} enabled={fxOn} />
        )}
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} width={box.w} height={box.h} className="layer" role="img" aria-label="Savaş haritası">
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
          {spots.map((h) => <polygon key={`h${hexKey(h)}`} points={hexPoints(h, 0.78)} className="hide-spot" />)}
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
            return [
              ...ordered.map(({ c, view, scale }) => {
                const p = hexCenter(c.pos as Offset);
                const cls = ['token', c.side, scale > 1 ? 'big' : '', scale < 1 ? 'tiny' : '', c.asleep ? 'asleep' : '', c.id === actorId && active ? 'turn' : '', c.id === targetId ? 'target' : '',
                  glowing.has(c.id) ? 'glow' : '', targeting && glowing.has(c.id) ? 'pickable' : '', targeting && !glowing.has(c.id) && c.id !== actorId ? 'dim' : '',
                  c.id === selected && setup ? 'selected' : '', view !== 'normal' ? 'hidden' : '',
                  c.hp <= 0 ? 'down' : ''].join(' ');
                const cover = view !== 'normal' ? hideCover(state, c.pos as Offset) : null;
                // Figür altıgen merkezinde ortalı, ölçekle her yöne eşit büyür; Zzz rozeti figürün tepesine yakın.
                const top = p.y - r * scale;
                return (
                  <g key={c.id} className={cls}>
                    <AvatarCircle avatar={c.avatar} cx={p.x} cy={p.y} r={r} asleep={c.asleep === true}
                      flip={c.side === 'enemies' && !c.civilian && facesLeft(c)} scale={scale} />
                    <circle cx={p.x} cy={p.y} r={r} className="ring" />
                    {targeting && glowing.has(c.id) && (
                      <g className="pick-mark" aria-hidden="true">
                        <circle cx={p.x} cy={p.y} r={r + 4} className="pick-ring" />
                        <g transform={`translate(${p.x + r * 0.78},${p.y - r * 0.78})`} className="pick-badge">
                          <circle r={15} />
                          <path d="M -9 0 H 9 M 0 -9 V 9" />
                          <circle r={6} className="pick-dot" />
                        </g>
                      </g>
                    )}
                    {cover && <HideCoverArt kind={cover} x={p.x} y={p.y} r={r} />}
                    {cover && (
                      <g className="hide-eye" transform={`translate(${p.x + r * 0.72},${p.y - r * 0.72})`}>
                        <circle r={r * 0.36} />
                        <path d={`M ${-r * 0.22} 0 Q 0 ${r * 0.2} ${r * 0.22} 0`} />
                        <path d={`M ${-r * 0.12} ${r * 0.09} l -${r * 0.06} ${r * 0.1} M 0 ${r * 0.12} v ${r * 0.11} M ${r * 0.12} ${r * 0.09} l ${r * 0.06} ${r * 0.1}`} />
                      </g>
                    )}
                    {view === 'hidden-own' && c.hidden && (
                      <text x={Math.min(VIEW.w - 70, Math.max(70, p.x))} y={Math.max(18, p.y - r - 8)} className="hide-label">Gizli (DC {c.hidden.dc})</text>
                    )}
                    {/* HP çubuğu altıgenin altında sabit boyda (Tiny'de de okunur, Gargantuan'da komşuya taşmaz). */}
                    <rect x={p.x - r} y={p.y + r + 3} width={2 * r} height={8} className="hpbg" />
                    <rect x={p.x - r} y={p.y + r + 3} width={2 * r * Math.max(0, c.hp / c.maxHp)} height={8} className="hp" />
                    {statusIcons(c).length > 0 && (
                      <g className="status-icons" transform={`translate(${p.x - r * 0.62},${Math.max(30, Math.min(top + r * 0.4, p.y - r * 0.7))})`} aria-hidden="true">
                        {statusIcons(c).map((s, i) => <text key={s.key} x={-i * 20} y={0}><title>{s.title}</title>{s.icon}</text>)}
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
            return (
              <g key={fl.id} className={`dmg-float ${fl.kind}`} transform={`translate(${p.x},${top})`} aria-hidden="true">
                <g className="dmg-anim" style={{ animationDelay: `${fl.delay}ms` }}>
                  {FLOAT_ICON[fl.kind] && <text className="dmg-icon" x={-14} y={0}>{FLOAT_ICON[fl.kind]}</text>}
                  <text className="dmg-num" x={FLOAT_ICON[fl.kind] ? 10 : 0} y={0}>-{fl.amount}</text>
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
          <div className="turn-strip" role="list" aria-label="Sıra">
            {state.order.map((id) => {
              const c = state.combatants[id];
              if (!c) return null;
              const out = c.life === 'dead' || (c.hp <= 0 && c.life === 'alive' && !c.regenPending);
              // Karşı tarafın gizli savaşçısı sıra şeridinde de belli olmasın.
              if (tokenView(state, c, showHidden) === 'invisible') {
                return <span key={id} role="listitem" className="strip-item unknown" aria-label="Bilinmeyen">?</span>;
              }
              return (
                <button key={id} role="listitem" className={`strip-item${id === actorId && active ? ' now' : ''}${out ? ' out' : ''}`}
                  onClick={() => setDrawerId(id)} aria-label={`${c.name} ayrıntıları`}>
                  <AvatarBadge avatar={c.avatar} size={30} ring={c.side === 'party' ? 'var(--party)' : 'var(--enemy)'} title={c.name} />
                </button>
              );
            })}
          </div>

          <div className="hud-corner tl">
            <button className="hud-btn" aria-label="Seçenekler" onClick={() => setOptionsOpen((o) => !o)}>≡</button>
            {optionsOpen && (
              <div className="hud-pop">
                {active && gm.triggers.includes('eruption') && <button onClick={() => { reset(); setMode('erupt'); setMenuOpen(false); setOptionsOpen(false); }}>GM: yanardağ patlaması</button>}
                {active && gm.triggers.includes('lavaRise') && <button onClick={() => { run({ type: 'map_trigger', rule: 'lavaRise' }); setOptionsOpen(false); }}>GM: lav yükselmesi</button>}
                {active && gm.triggers.includes('swell') && <button onClick={() => { run({ type: 'map_trigger', rule: 'swell' }); setOptionsOpen(false); }}>GM: dalga</button>}
                {active && gm.gate && gm.gate.state !== 'broken' && (
                  <button onClick={() => { if (gm.gate) run({ type: 'gate', at: gm.gate.at, open: gm.gate.state === 'closed' }); setOptionsOpen(false); }}>
                    GM: kapıyı {gm.gate.state === 'closed' ? 'aç' : 'kapat'}
                  </button>
                )}
                {active && sleepingDragon(state) && (
                  <button onClick={() => { setConfirmWake(true); setOptionsOpen(false); }}>GM: Ejderhayı uyandır</button>
                )}
                {viewerOf(state) === 'gm' && Object.values(state.combatants).some((c) => c.side === 'party' && c.hidden) && (
                  <button onClick={() => setShowHidden((v) => !v)}>{showHidden ? 'Gizli jetonları gizle' : 'Gizli jetonları göster'}</button>
                )}
                <button onClick={() => { toast(saveBattle(session) ? 'Savaş kaydedildi.' : 'Kaydedilemedi: depolama kullanılamıyor.'); setOptionsOpen(false); }}>Kaydet</button>
                <button disabled={!hasSavedBattle()} onClick={() => {
                  const r = loadBattle();
                  if (r.ok) {
                    // Yüklenen günlük baştan oynatıldı: eski olaylar için animasyon oynamaz.
                    seenEvents.current = r.session.events.length;
                    seenDamage.current = r.session.events.length;
                    setSession(r.session); toast('Kayıtlı savaş yüklendi.');
                  } else toast(r.error);
                  setOptionsOpen(false);
                }}>Yükle</button>
                <ThemeButton className="" />
                {(variant?.effects?.length ?? 0) > 0 && (
                  <button onClick={() => setFxOn(!fxOn)}>{fxOn ? 'Efektleri kapat' : 'Efektleri aç'}</button>
                )}
                <button onClick={props.onExit}>{props.exitLabel ?? 'Harita değiştir'}</button>
              </div>
            )}
          </div>

          {(modeHint[mode] || setup) && (
            <div className="hud-hint">
              {setup ? 'Kurulum (GM): jetonu boyalı bir altıgene sürükleyin ya da jetona, sonra altıgene dokunun.' : modeHint[mode]}
              {mode !== 'idle' && <button className="hud-btn small" onClick={reset} aria-label="Vazgeç">✕</button>}
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
                if (it.reason) { setTip(it.key); return; }
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
                      if (kind === 'area') { setSpell(sp); setMode('aim'); }
                      else if (kind === 'target') { setSpell(sp); setMode('spell'); }
                      else run({ type: 'cast_spell', actorId, spellName: sp.name });
                    }}>
                      <span>{sp.name}</span>
                      <small>{!slot ? 'slot yok' : why ? why.replace(' bu tur kullanıldı.', ' yok').replace('Bu tur zaten büyü slotu harcandı (turda bir slotlu büyü).', 'bu tur slot harcandı') : sp.castingTime === 'bonus' ? 'bonus eylem' : sp.castingTime === 'reaction' ? 'tepki' : kind === 'area' ? `${sp.area?.sizeFt} ft alan` : kind === 'self' ? 'elle uygulanır' : `${sp.rangeFt} ft`}</small>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {active && target?.pos && (mode === 'attack' || mode === 'spell') && (() => {
            const size = { w: 250, h: Math.min(box.h - 16, 40 + choices.length * 56) };
            const at = bubbleAt(px(target.pos), size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>{target.name} · HP {target.hp}/{target.maxHp} · AC {target.ac}</strong>
                {choices.map((ch) => (
                  <div className="choice" key={ch.id}>
                    <div><span>{ch.label}</span><small>{ch.detail}</small></div>
                    <button disabled={!ch.command} onClick={() => ch.command && run(ch.command)}>{mode === 'spell' ? 'Yap' : 'Vur'}</button>
                  </div>
                ))}
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
                <strong>{target.name} · {best} save / DC {dc}</strong>
                <div className="choice">
                  <div><span>İt (5 ft)</span><small>{out && to ? (out.ok ? `${hexLabel(to)}: ${out.note}` : `İtilemez: ${out.reason}`) : 'Konum yok'}</small></div>
                  <button disabled={!out?.ok || !!economyBlock(state, actor, cmd('push'))} onClick={() => run(cmd('push'))}>İt</button>
                </div>
                <div className="choice">
                  <div><span>Yere düşür</span><small>{target.conditions.includes('Prone') ? 'Zaten yerde' : 'Prone'}</small></div>
                  <button disabled={!!economyBlock(state, actor, cmd('prone'))} onClick={() => run(cmd('prone'))}>Düşür</button>
                </div>
              </div>
            );
          })()}

          {active && actor && jumpAim && (() => {
            const r = jumpRisks.get(hexKey(jumpAim));
            if (!r) return null;
            const pct = (x: number) => `%${Math.round(x * 100)}`;
            const size = { w: 260, h: 150 };
            const at = bubbleAt(px(jumpAim), size, box, tokenR + 8);
            return (
              <div className={`bubble${r.pFall > 0 || r.pBurn > 0.25 ? ' warn' : ''}`} style={{ left: at.x, top: at.y, width: size.w }}>
                <strong>Ada atlaması: DC {r.dc}, {r.over.length} lav hex</strong>
                <small>Athletics {r.bonus >= 0 ? '+' : ''}{r.bonus} / DC {r.dc} · tüm hareketini harcar</small>
                <small>Başarı ~{pct(r.pSafe)}, yanma {pct(r.pBurn)} ({r.onFail.damage} {r.onFail.damageType}{r.onFail.condition ? ` + ${r.onFail.condition}` : ''}), lava düşme {pct(r.pFall)}</small>
                <div className="choice">
                  <button className="ghost" onClick={() => setJumpAim(null)}>Vazgeç</button>
                  <button onClick={() => { const to = jumpAim; setJumpAim(null); run({ type: 'jump', actorId, to }); }}>Atla</button>
                </div>
              </div>
            );
          })()}

          {active && mode === 'aim' && spell && aimHex && (() => {
            const size = { w: 230, h: 120 };
            const at = bubbleAt(px(aimHex), size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w }}>
                <strong>{spell.name}</strong>
                <small>Etkilenen: {affected.map((c) => c.name).join(', ') || 'kimse'}</small>
                <button onClick={() => run({ type: 'cast_spell', actorId, spellName: spell.name, targetHex: aimHex })}>Yap</button>
              </div>
            );
          })()}

          {state.map?.objective && (
            <div className="objective">Masumlar: {civiliansAlive(state)}/{state.map.objective.total} hayatta
              {state.map.objective.strict ? ` (en az ${state.map.objective.needed} kalmalı)` : ''}</div>
          )}
          {active && actor && gateAim && gm.gate && (() => {
            const size = { w: 250, h: Math.min(box.h - 16, 40 + actor.weaponOptions.length * 56) };
            const at = bubbleAt(px(gm.gate.at), size, box, tokenR + 8);
            return (
              <div className="bubble" style={{ left: at.x, top: at.y, width: size.w, maxHeight: size.h }}>
                <strong>Kapalı kapı · AC 15</strong>
                {actor.weaponOptions.map((w) => (
                  <div className="choice" key={w.label}>
                    <div><span>{w.label}</span><small>{w.damage}</small></div>
                    <button onClick={() => gm.gate && run({ type: 'attack_gate', actorId, at: gm.gate.at, option: w })}>Vur</button>
                  </div>
                ))}
                {actor.weaponOptions.length === 0 && <small>Silah yok.</small>}
              </div>
            );
          })()}
          {active && actor && (
            <div className="economy" aria-label="Bu turun eylemleri">
              <span className={actor.economy.action && actor.economy.attacksLeft === 0 ? 'spent' : ''}>Eylem{actor.economy.attacksLeft > 0 ? ` (${actor.economy.attacksLeft} saldırı)` : ''}</span>
              <span className={actor.economy.bonus ? 'spent' : ''}>Bonus</span>
              <span className={actor.economy.reaction ? 'spent' : ''}>Tepki</span>
              <span>Hareket {Math.max(0, speedHexes(actor) - actor.movementUsed)}/{speedHexes(actor)}</span>
            </div>
          )}
          {setup && <button className="hud-cta" onClick={() => run({ type: 'start_battle' })}>Savaşı başlat</button>}
          {state.status === 'finished' && (() => {
            const sum = battleSummary(session.events, state);
            return (
              <div className="hud-banner summary">
                <div className="summary-head">
                  <strong>{state.winner === 'party' ? 'Parti kazandı!' : 'Düşmanlar kazandı.'}</strong>
                  <span>{sum.rounds}. turda bitti</span>
                  {sum.civilians && <span>Masumlar: {sum.civilians.saved} kurtarıldı, {sum.civilians.dead} öldü</span>}
                  <button onClick={props.onExit}>{props.exitLabel ?? 'Yeni savaş'}</button>
                </div>
                <table>
                  <thead><tr><th>Savaşçı</th><th>Verdiği</th><th>Aldığı</th><th>İyileştirdiği</th><th>Düşürdüğü</th><th>Son HP</th></tr></thead>
                  <tbody>
                    {sum.rows.map((r) => (
                      <tr key={r.id} className={r.side}>
                        <td>{r.name}{r.civilian ? ' (masum)' : ''}</td><td>{r.dealt}</td><td>{r.taken}</td><td>{r.healed}</td><td>{r.downed}</td>
                        <td>{r.hpEnd}/{r.maxHp} {r.status !== 'ayakta' ? `(${r.status})` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
          {active && actor?.side === 'enemies' && (
            <button className="hud-btn enemy-play" onClick={() => setSession((s) => autoplayEnemyTurns(s, Math.random))}>Düşmanı oynat</button>
          )}

          <div className={`hud-corner bl${logOpen ? ' open' : ''}`}>
            <div className="toasts" aria-live="polite">
              {!logOpen && toasts.map((t) => <div key={t.id} className={`toast${t.error ? ' error' : ''}`}>{t.text}</div>)}
            </div>
            {logOpen && (
              <ol className="log-box">
                {[...session.lines].reverse().slice(0, 40).map((line, i) => <li key={`${session.lines.length - i}`}>{line}</li>)}
              </ol>
            )}
            <button className="hud-btn" onClick={() => setLogOpen((o) => !o)}>{logOpen ? 'Günlüğü kapat' : 'Günlük'}</button>
          </div>

          {confirmWake && sleepingDragon(state) && (
            <div className="bubble warn" style={{ left: Math.max(8, box.w / 2 - 140), top: 60, width: 280 }} role="dialog" aria-label="Ejderhayı uyandır">
              <strong>Ejderha uyandırılsın mı?</strong>
              <small>{sleepingDragon(state)?.name} hemen uyanır; günlüğe "GM ejderhayı uyandırdı" yazılır.</small>
              <div className="choice">
                <button className="ghost" onClick={() => setConfirmWake(false)}>Vazgeç</button>
                <button onClick={() => { setConfirmWake(false); run({ type: 'wake_dragon' }); }}>Uyandır</button>
              </div>
            </div>
          )}

          {infoHex && (
            <div className="hud-corner tr info-box">
              <span>{mode === 'jump' && jumpRisks.get(hexKey(infoHex))
                ? `Atla: DC ${jumpRisks.get(hexKey(infoHex))?.dc}, ${jumpRisks.get(hexKey(infoHex))?.over.length} lav hex, doğal 1: %${Math.round((jumpRisks.get(hexKey(infoHex))?.pFall ?? 0) * 100)} lava düşme · `
                : mode === 'jump' && fromPos && jumpKeys.has(hexKey(infoHex)) ? `Atla: ${lavaOver(state, fromPos, infoHex).length} lav hex, zarsız (uçuyor) · ` : ''}
                {terrainInfo(state, infoHex)}</span>
              <button className="hud-btn small" aria-label="Kapat" onClick={() => setInfoHex(null)}>✕</button>
            </div>
          )}

          {drawerId && state.combatants[drawerId] && (
            <Drawer c={state.combatants[drawerId] as Combatant} onClose={() => setDrawerId(null)}
              notes={state.combatants[drawerId]?.asleep ? wakeNotes(state) : undefined} />
          )}
        </div>
      </div>
      <p className="portrait-hint">Telefonu yatay çevirin.</p>
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
