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
import { createMapSession } from './demo';
import { maps } from './map/maps';
import { hideSpotBonus } from './battle/stealth';
import { economyBlock, preferBonus } from './battle/economy';
import { optionalRules, stuckInBog } from './battle/maprules';
import { civiliansAlive } from './battle/common';
import { speedHexes } from './battle/movement';
import { distance, hexKey, sameHex, type Offset } from './rules/hex';
import { SKILLS, SKILL_IDS, skillBonus } from './rules/skills';
import { dispatch, type Session } from './ui/session';
import {
  VIEW, allHexes, areaPreview, attackChoices, gmMapActions, hexCenter, hexPoints, jumpHexes, mapMarks, movableHexes,
  placeHexes, terrainInfo,
} from './ui/mapView';
import {
  attackTargets, bubbleAt, hasSlotFor, isSpellChoice, radialLayout, spellMenu, spellTargets, type Box, type Point,
} from './ui/hud';
import { AvatarBadge, AvatarCircle } from './ui/Avatar';

const BASE = import.meta.env.BASE_URL;
const RATIO = VIEW.w / VIEW.h;
const HEX_H = VIEW.h / 7.5;
const LONG_PRESS_MS = 450;
const TOAST_MS = 4000;
const BUTTON = 56;

type Mode = 'idle' | 'attack' | 'spells' | 'spell' | 'aim' | 'pull' | 'erupt';

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

function MapPicker(props: { onStart: (s: Session) => void; onCardMode: () => void }) {
  const [mapId, setMapId] = useState(maps[0]?.id ?? '');
  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const [variantId, setVariantId] = useState(map?.variants[0]?.id ?? '');
  const [mirrored, setMirrored] = useState(false);
  const variant = map?.variants.find((v) => v.id === variantId) ?? map?.variants[0];
  const [options, setOptions] = useState<string[]>([]);
  const [civilians, setCivilians] = useState(4);
  if (!map || !variant) return null;
  const optional = optionalRules(map.id, variant.id);
  const OPTION_NAMES: Record<string, string> = { darkness: 'Karanlık', objective: 'Masumları koru' };
  return (
    <main className="app wide">
      <section className="panel" aria-label="Harita seçimi">
        <h2>Harita seç</h2>
        <div className="gm-row">
          <select aria-label="Harita" value={map.id} onChange={(e: { target: { value: string } }) => {
            const next = maps.find((m) => m.id === e.target.value);
            setMapId(e.target.value);
            setVariantId(next?.variants[0]?.id ?? '');
            setMirrored(false);
            setOptions([]);
          }}>
            {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select aria-label="Varyant" value={variant.id} onChange={(e: { target: { value: string } }) => { setVariantId(e.target.value); setOptions([]); }}>
            {map.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <label className="toggle">
            <input type="checkbox" disabled={!map.mirrorable} checked={mirrored}
              onChange={(e: { target: { checked: boolean } }) => setMirrored(e.target.checked)} />
            Aynala{map.mirrorable ? '' : ' (bu harita aynalanamaz)'}
          </label>
          {optional.map((r) => (
            <label className="toggle" key={r.id}>
              <input type="checkbox" checked={options.includes(r.id)}
                onChange={(e: { target: { checked: boolean } }) => setOptions((o) => (e.target.checked ? [...o, r.id] : o.filter((x) => x !== r.id)))} />
              {OPTION_NAMES[r.id] ?? r.id}
            </label>
          ))}
          {options.includes('objective') && (
            <select aria-label="Masum sayısı" value={civilians} onChange={(e: { target: { value: string } }) => setCivilians(Number(e.target.value))}>
              {[4, 5, 6].map((n) => <option key={n} value={n}>{n} masum</option>)}
            </select>
          )}
          <button onClick={() => props.onStart(createMapSession(map.id, variant.id, mirrored, Math.random,
            { options: options.filter((o) => optional.some((r) => r.id === o)), civilians }))}>Savaşı kur</button>
          <button className="ghost" onClick={props.onCardMode}>Kart savaşı</button>
        </div>
        <img className="map-thumb" src={`${BASE}${variant.image}`} alt={`${map.name} — ${variant.name}`}
          style={mirrored ? { transform: 'scaleX(-1)' } : undefined} />
      </section>
    </main>
  );
}

/** Karakter çekmecesi: yetenek, zar ve ayrıntılar. */
function Drawer(props: { c: Combatant; onClose: () => void }) {
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
      {c.spellSlots.some((n) => n > 0) && <p>Slotlar: {c.spellSlots.map((n, i) => (n > 0 ? `${i + 1}. sev. ${n}` : '')).filter(Boolean).join(' · ')}</p>}
    </aside>
  );
}

function Battle(props: { initial: Session; onExit: () => void; onCardMode: () => void }) {
  const box = useStage();
  const [session, setSession] = useState<Session>(props.initial);
  const [mode, setMode] = useState<Mode>('idle');
  const [spell, setSpell] = useState<Spell | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [aimHex, setAimHex] = useState<Offset | null>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoHex, setInfoHex] = useState<Offset | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [gateAim, setGateAim] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; error?: boolean }>>([]);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const seenLines = useRef(session.lines.length);

  const state = session.state;
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

  // Sıra değişince menü yeniden açılır, kip sıfırlanır.
  useEffect(() => { setMenuOpen(true); setMode('idle'); setSpell(null); setTargetId(null); setAimHex(null); }, [actorId, state.round]);

  const movable = useMemo(() => (active && mode === 'idle' ? movableHexes(state, actorId) : new Map<string, number>()), [state, active, actorId, mode]);
  const jumps = useMemo(() => (active && mode === 'idle' ? jumpHexes(state, actorId) : []), [state, active, actorId, mode]);
  const glowing = useMemo(() => {
    if (!active) return new Set<string>();
    if (mode === 'attack') return new Set(attackTargets(state, actorId));
    if (mode === 'spell' && spell) return new Set(spellTargets(state, actorId, spell.name));
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

  const reset = () => { setMode('idle'); setSpell(null); setTargetId(null); setAimHex(null); setGateAim(false); setMenuOpen(true); };
  const run = (cmd: Command) => { setSession((s) => dispatch(s, cmd, Math.random)); reset(); };

  const onHex = (h: Offset) => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (setup) { if (selected) run({ type: 'place', actorId: selected, at: h }); return; }
    if (!active || !actor) return;
    if (mode === 'aim' && spell) { setAimHex(h); return; }
    if (mode === 'erupt') { run({ type: 'map_trigger', rule: 'eruption', at: h }); return; }
    if (mode === 'attack' && gm.gate && gm.gate.state === 'closed' && sameHex(gm.gate.at, h)) { setGateAim(true); return; }
    if (mode !== 'idle') return;
    const key = hexKey(h);
    if (movable.has(key)) run({ type: 'move', actorId, to: h });
    else if (jumps.some((j) => sameHex(j, h))) run({ type: 'jump', actorId, to: h });
  };
  const onToken = (c: Combatant) => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (setup) { setSelected(c.id); return; }
    if (!active) return;
    // Alan büyüsü ve patlama merkezi kendi altıgeni de olabilir.
    if (mode === 'aim' && c.pos) { setAimHex(c.pos); return; }
    if (mode === 'erupt' && c.pos) { run({ type: 'map_trigger', rule: 'eruption', at: c.pos }); return; }
    if (c.id === actorId) { if (mode === 'idle') setMenuOpen((o) => !o); else reset(); return; }
    if ((mode === 'attack' || mode === 'spell') && glowing.has(c.id)) setTargetId(c.id);
    if (mode === 'pull' && glowing.has(c.id)) run({ type: 'pull', actorId, targetId: c.id });
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
  const hexClass = (h: Offset) => {
    const k = hexKey(h);
    const dark = marks.dark.has(k) ? ' dark' : '';
    return baseHexClass(h, k) + dark;
  };
  const baseHexClass = (h: Offset, k: string) => {
    if (areaKeys.has(k)) return 'hx area';
    if (mode === 'erupt') return 'hx aimable';
    if (mode === 'attack' && gm.gate?.state === 'closed' && sameHex(gm.gate.at, h)) return 'hx gate-target';
    if (marks.warn.has(k)) return 'hx warn';
    if (zoneKeys.has(k)) return 'hx zone';
    if (movable.has(k)) return movable.get(k) === 1 ? 'hx move' : 'hx move far';
    if (jumpKeys.has(k)) return 'hx jump';
    return 'hx';
  };

  // Yüzen eylem menüsü
  const hideBonus = actor?.pos ? hideSpotBonus(state, actor.pos) : null;
  const blocked = (cmd: Command) => (actor ? economyBlock(state, actor, cmd) !== null : true);
  const bonusCmd = (type: 'hide' | 'dash' | 'disengage'): Command => ({ type, actorId, bonus: actor ? preferBonus(actor, type) : false });
  const canAttack = actor ? !actor.economy.action || actor.economy.attacksLeft > 0 : false;
  const items: Array<{ key: string; label: string; disabled?: boolean; act: () => void }> = actor ? [
    { key: 'move', label: 'Hareket', disabled: actor.movementUsed >= speedHexes(actor), act: () => { reset(); setMenuOpen(false); } },
    { key: 'attack', label: 'Saldır', disabled: !canAttack, act: () => { reset(); setMode('attack'); setMenuOpen(false); } },
    { key: 'spell', label: 'Büyü', disabled: actor.spellNames.length === 0 || spellMenu(actor).every(({ spell: sp }) => blocked({ type: 'cast_spell', actorId, spellName: sp.name })),
      act: () => { reset(); setMode('spells'); setMenuOpen(false); } },
    { key: 'hide', label: 'Gizlen', disabled: !!actor.hidden || hideBonus === null || blocked(bonusCmd('hide')), act: () => run(bonusCmd('hide')) },
    { key: 'search', label: 'Ara', disabled: blocked({ type: 'search', actorId }), act: () => run({ type: 'search', actorId }) },
    { key: 'dash', label: 'Koş', disabled: blocked(bonusCmd('dash')), act: () => run(bonusCmd('dash')) },
    { key: 'disengage', label: 'Ayrıl', disabled: blocked(bonusCmd('disengage')), act: () => run(bonusCmd('disengage')) },
    ...(stuckInBog(state, actor) ? [{ key: 'escape', label: 'Çık', disabled: blocked({ type: 'escape', actorId }), act: () => run({ type: 'escape', actorId }) }] : []),
    ...(actor.pos && Object.values(state.combatants).some((c) => c.side === actor.side && c.id !== actor.id && c.pos && actor.pos
      && distance(c.pos, actor.pos) === 1 && stuckInBog(state, c))
      ? [{ key: 'pull', label: 'Çek', disabled: blocked({ type: 'pull', actorId, targetId: '' }), act: () => { reset(); setMode('pull'); setMenuOpen(false); } }] : []),
    { key: 'end', label: 'Turu bitir', act: () => run({ type: 'end_turn', actorId }) },
  ] : [];
  const actorPx = actor?.pos ? px(actor.pos) : null;
  const radial = actorPx ? radialLayout(actorPx, items.length, box, tokenR + BUTTON / 2 + 10, BUTTON) : [];

  const target = targetId ? state.combatants[targetId] : undefined;
  const choices = active && target ? attackChoices(state, actorId, target.id)
    .filter((ch) => (mode === 'spell' && spell ? ch.id === `s-${spell.name}` : !isSpellChoice(ch))) : [];
  const affected = mode === 'aim' ? Object.values(state.combatants).filter((c) => c.pos && areaKeys.has(hexKey(c.pos))) : [];
  const modeHint: Record<Mode, string> = {
    idle: '', attack: 'Saldır: parlayan bir hedefe dokunun.', spells: 'Bir büyü seçin.',
    spell: `${spell?.name ?? ''}: parlayan bir hedefe dokunun.`, aim: `${spell?.name ?? ''}: hedef altıgene dokunun.`,
    pull: 'Çek: batmış müttefike dokunun.', erupt: 'Patlama: merkez altıgene dokunun.',
  };

  return (
    <div className="mb-screen">
      <div className="mb-stage" style={{ width: box.w, height: box.h }}>
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} width={box.w} height={box.h} role="img" aria-label="Savaş haritası">
          {state.map && (
            <image href={`${BASE}${maps.find((m) => m.id === state.map?.id)?.variants.find((v) => v.id === state.map?.variantId)?.image ?? ''}`}
              width={VIEW.w} height={VIEW.h} preserveAspectRatio="none" className="map-art"
              transform={state.map.mirrored ? `translate(${VIEW.w},0) scale(-1,1)` : undefined} />
          )}
          {allHexes().map((h) => (
            <polygon key={hexKey(h)} points={hexPoints(h)} className={`${hexClass(h)}${infoHex && sameHex(infoHex, h) ? ' info' : ''}`}
              onClick={() => onHex(h)} {...press(h)} />
          ))}
          {[...movable.entries()].map(([key, cost]) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`c${key}`} x={c.x} y={c.y + HEX_H * 0.38} className="cost">{cost}</text>;
          })}
          {[...marks.traps].map((key) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`t${key}`} x={c.x} y={c.y + 10} className="trap-mark">⚠</text>;
          })}
          {Object.values(state.combatants).filter((c) => c.pos && c.life !== 'dead' && (c.hp > 0 || c.life !== 'alive' || c.regenPending)).map((c) => {
            const p = hexCenter(c.pos as Offset);
            const r = HEX_H * 0.36;
            const cls = ['token', c.side, c.id === actorId && active ? 'turn' : '', c.id === targetId ? 'target' : '',
              glowing.has(c.id) ? 'glow' : '', c.id === selected && setup ? 'selected' : '', c.hidden ? 'hidden' : '',
              c.hp <= 0 ? 'down' : ''].join(' ');
            return (
              <g key={c.id} className={cls} onClick={() => onToken(c)} {...press(c.pos as Offset)}>
                <AvatarCircle avatar={c.avatar} cx={p.x} cy={p.y} r={r} clipId={`av-${c.id}`} />
                <circle cx={p.x} cy={p.y} r={r} className="ring" />
                <rect x={p.x - r} y={p.y + r + 3} width={2 * r} height={8} className="hpbg" />
                <rect x={p.x - r} y={p.y + r + 3} width={2 * r * Math.max(0, c.hp / c.maxHp)} height={8} className="hp" />
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
                <button onClick={props.onExit}>Harita değiştir</button>
                <button onClick={props.onCardMode}>Kart savaşı</button>
              </div>
            )}
          </div>

          {(modeHint[mode] || setup) && (
            <div className="hud-hint">
              {setup ? 'Kurulum: bir jetona, sonra boyalı altıgene dokunun.' : modeHint[mode]}
              {mode !== 'idle' && <button className="hud-btn small" onClick={reset} aria-label="Vazgeç">✕</button>}
            </div>
          )}

          {active && actor && actorPx && menuOpen && mode === 'idle' && items.map((it, i) => (
            <button key={it.key} className="radial-btn" disabled={it.disabled} onClick={it.act}
              style={{ left: (radial[i]?.x ?? 0) - BUTTON / 2, top: (radial[i]?.y ?? 0) - BUTTON / 2, width: BUTTON, height: BUTTON }}>
              {it.label}
            </button>
          ))}

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
            <div className="objective">Hayatta kalan masum: {civiliansAlive(state)}/{state.map.objective.total} (en az {state.map.objective.needed})</div>
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
          {state.status === 'finished' && (
            <div className="hud-banner">
              {state.winner === 'party' ? 'Parti kazandı!' : 'Düşmanlar kazandı.'}
              <button onClick={props.onExit}>Yeni savaş</button>
            </div>
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

          {infoHex && (
            <div className="hud-corner br info-box">
              <span>{terrainInfo(state, infoHex)}</span>
              <button className="hud-btn small" aria-label="Kapat" onClick={() => setInfoHex(null)}>✕</button>
            </div>
          )}

          {drawerId && state.combatants[drawerId] && (
            <Drawer c={state.combatants[drawerId] as Combatant} onClose={() => setDrawerId(null)} />
          )}
        </div>
      </div>
      <p className="portrait-hint">Telefonu yatay çevirin.</p>
    </div>
  );
}

export default function MapBattle(props: { onCardMode: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  if (!session) return <MapPicker onStart={setSession} onCardMode={props.onCardMode} />;
  return <Battle key={session.state.id + String(session.events.length === 0)} initial={session} onExit={() => setSession(null)} onCardMode={props.onCardMode} />;
}

