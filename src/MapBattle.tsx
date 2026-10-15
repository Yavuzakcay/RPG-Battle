/**
 * Haritalı savaş ekranı (Adım 10a): harita seçici, altıgen ızgara, jetonlar, yürüme/atlama,
 * saldırı önizlemesi, alan büyüsü hedeflemesi, gizlenme ve savaş günlüğü. İşlev odaklı;
 * hareketli katman ve harita kuralları (Adım 8) henüz yok.
 */
import { useMemo, useRef, useState } from 'react';
import type { Spell } from './data';
import type { Combatant } from './battle';
import { createMapSession } from './demo';
import { maps } from './map/maps';
import { HIDE_DC, hideSpotBonus } from './battle/stealth';
import { hexKey, sameHex, type Offset } from './rules/hex';
import { dispatch, type Session } from './ui/session';
import {
  VIEW, allHexes, areaPreview, areaSpellsOf, attackChoices, hexCenter, hexPoints, jumpHexes, movableHexes,
  startZoneOf, terrainInfo,
} from './ui/mapView';

const BASE = import.meta.env.BASE_URL;
/** En küçük altıgen yüksekliği 44 px: görsel genişliği en az 1280 × 44 / (715 / 7,5). */
const MIN_WIDTH = Math.ceil((VIEW.w * 44) / (VIEW.h / 7.5));
const HEX_H = VIEW.h / 7.5;
const LONG_PRESS_MS = 450;

function initials(name: string): string {
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2);
}

function MapPicker(props: { onStart: (s: Session) => void }) {
  const [mapId, setMapId] = useState(maps[0]?.id ?? '');
  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const [variantId, setVariantId] = useState(map?.variants[0]?.id ?? '');
  const [mirrored, setMirrored] = useState(false);
  const variant = map?.variants.find((v) => v.id === variantId) ?? map?.variants[0];
  if (!map || !variant) return null;
  return (
    <section className="panel" aria-label="Harita seçimi">
      <h2>Harita seç</h2>
      <div className="gm-row">
        <select aria-label="Harita" value={map.id} onChange={(e: { target: { value: string } }) => {
          const next = maps.find((m) => m.id === e.target.value);
          setMapId(e.target.value);
          setVariantId(next?.variants[0]?.id ?? '');
          setMirrored(false);
        }}>
          {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select aria-label="Varyant" value={variant.id} onChange={(e: { target: { value: string } }) => setVariantId(e.target.value)}>
          {map.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label className="toggle">
          <input type="checkbox" disabled={!map.mirrorable} checked={mirrored}
            onChange={(e: { target: { checked: boolean } }) => setMirrored(e.target.checked)} />
          Aynala{map.mirrorable ? '' : ' (bu harita aynalanamaz)'}
        </label>
        <button onClick={() => props.onStart(createMapSession(map.id, variant.id, mirrored))}>Savaşı kur</button>
      </div>
      <img className="map-thumb" src={`${BASE}${variant.image}`} alt={`${map.name} — ${variant.name}`}
        style={mirrored ? { transform: 'scaleX(-1)' } : undefined} />
    </section>
  );
}

export default function MapBattle() {
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [aimSpell, setAimSpell] = useState<Spell | null>(null);
  const [aimHex, setAimHex] = useState<Offset | null>(null);
  const [infoHex, setInfoHex] = useState<Offset | null>(null);
  const [zoom, setZoom] = useState(1);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const state = session?.state;
  const actorId = state ? state.order[state.turnIndex] ?? '' : '';
  const actor = state?.combatants[actorId];
  const setup = state?.status === 'setup';
  const active = state?.status === 'active';

  const movable = useMemo(() => (state && active ? movableHexes(state, actorId) : new Map<string, number>()), [state, active, actorId]);
  const jumps = useMemo(() => (state && active ? jumpHexes(state, actorId) : []), [state, active, actorId]);
  const area = useMemo(
    () => (state && actor && aimSpell ? areaPreview(state, actor, aimSpell, aimHex) : []),
    [state, actor, aimSpell, aimHex],
  );
  const choices = useMemo(
    () => (state && active && targetId ? attackChoices(state, actorId, targetId) : []),
    [state, active, actorId, targetId],
  );

  if (!session || !state) return <MapPicker onStart={(s) => { setSession(s); setSelected(null); }} />;

  const mapData = maps.find((m) => m.id === state.map?.id);
  const variant = mapData?.variants.find((v) => v.id === state.map?.variantId);
  const everyone = Object.values(state.combatants);
  const selectedC = selected ? state.combatants[selected] : undefined;
  const zone = setup && selectedC ? startZoneOf(state, selectedC.side) : [];
  const areaKeys = new Set(area.map(hexKey));
  const jumpKeys = new Set(jumps.map(hexKey));
  const zoneKeys = new Set(zone.map(hexKey));

  const run = (cmd: Parameters<typeof dispatch>[1]) => {
    setSession(dispatch(session, cmd, Math.random));
    setTargetId(null);
    setAimSpell(null);
    setAimHex(null);
  };

  const onHex = (h: Offset) => {
    if (longPressed.current) { longPressed.current = false; return; }
    setInfoHex(h);
    if (setup) {
      if (selected) run({ type: 'place', actorId: selected, at: h });
      return;
    }
    if (!active || !actor) return;
    if (aimSpell) {
      if (aimHex && sameHex(aimHex, h)) {
        run({ type: 'cast_spell', actorId, spellName: aimSpell.name, targetHex: h });
      } else setAimHex(h);
      return;
    }
    const key = hexKey(h);
    if (movable.has(key)) run({ type: 'move', actorId, to: h });
    else if (jumpKeys.has(key)) run({ type: 'jump', actorId, to: h });
  };

  const onToken = (c: Combatant) => {
    if (longPressed.current) { longPressed.current = false; return; }
    if (setup) { setSelected(c.id); return; }
    if (aimSpell && c.pos) { onHex(c.pos); return; }
    if (active) setTargetId(c.id === actorId ? null : c.id);
  };

  const press = (h: Offset) => ({
    onPointerDown: () => {
      longPressed.current = false;
      pressTimer.current = window.setTimeout(() => { longPressed.current = true; setInfoHex(h); }, LONG_PRESS_MS);
    },
    onPointerUp: () => { if (pressTimer.current) window.clearTimeout(pressTimer.current); },
    onPointerLeave: () => { if (pressTimer.current) window.clearTimeout(pressTimer.current); },
    onPointerEnter: (e: { pointerType: string }) => { if (e.pointerType === 'mouse') setInfoHex(h); },
  });

  const hexClass = (h: Offset): string => {
    const key = hexKey(h);
    if (areaKeys.has(key)) return 'hx area';
    if (setup) return zoneKeys.has(key) ? 'hx zone' : 'hx';
    if (aimSpell) return 'hx';
    if (movable.has(key)) return movable.get(key) === 1 ? 'hx move' : 'hx move far';
    if (jumpKeys.has(key)) return 'hx jump';
    return 'hx';
  };

  const hideBonus = actor?.pos ? hideSpotBonus(state, actor.pos) : null;
  const remaining = actor ? Math.floor((actor.fly > 0 ? actor.fly : actor.speed) / 5) - actor.movementUsed : 0;

  return (
    <div className="map-battle">
      <div className="gm-row">
        <strong>{mapData?.name} · {variant?.name}{state.map?.mirrored ? ' · aynalı' : ''}</strong>
        <span className="mute">{setup ? 'Kurulum' : `Tur ${state.round} · Sıra: ${actor?.name ?? ''}`}</span>
        <button className="ghost" onClick={() => { setSession(null); setTargetId(null); setAimSpell(null); }}>Harita değiştir</button>
        <span className="zoom">
          <button aria-label="Uzaklaştır" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>−</button>
          <button aria-label="Yakınlaştır" onClick={() => setZoom((z) => Math.min(3, z + 0.5))}>+</button>
        </span>
      </div>
      <p className="portrait-hint">Telefonu yatay çevirin.</p>

      <div className="map-scroll">
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} style={{ width: `${zoom * 100}%`, minWidth: `${Math.ceil(MIN_WIDTH * zoom)}px` }}
          role="img" aria-label="Savaş haritası">
          {variant && (
            <image href={`${BASE}${variant.image}`} width={VIEW.w} height={VIEW.h} preserveAspectRatio="none"
              className="map-art" transform={state.map?.mirrored ? `translate(${VIEW.w},0) scale(-1,1)` : undefined} />
          )}
          {allHexes().map((h) => (
            <polygon key={hexKey(h)} points={hexPoints(h)} className={`${hexClass(h)}${infoHex && sameHex(infoHex, h) ? ' info' : ''}`}
              onClick={() => onHex(h)} {...press(h)} />
          ))}
          {!aimSpell && [...movable.entries()].map(([key, cost]) => {
            const [col, row] = key.split(',').map(Number);
            const c = hexCenter({ col: col ?? 0, row: row ?? 0 });
            return <text key={`c${key}`} x={c.x} y={c.y + HEX_H * 0.36} className="cost">{cost}</text>;
          })}
          {everyone.filter((c) => c.pos && c.life !== 'dead' && (c.hp > 0 || c.life !== 'alive' || c.regenPending)).map((c) => {
            const p = hexCenter(c.pos as Offset);
            const r = HEX_H * 0.34;
            const pct = Math.max(0, c.hp / c.maxHp);
            const cls = ['token', c.side, c.id === actorId && active ? 'turn' : '', c.id === targetId ? 'target' : '',
              c.id === selected && setup ? 'selected' : '', c.hidden ? 'hidden' : '', c.hp <= 0 ? 'down' : ''].join(' ');
            return (
              <g key={c.id} className={cls} onClick={() => onToken(c)} {...press(c.pos as Offset)}>
                <circle cx={p.x} cy={p.y} r={r} />
                <text x={p.x} y={p.y + r * 0.35} className="initials">{initials(c.name)}</text>
                <rect x={p.x - r} y={p.y + r + 3} width={2 * r} height={7} className="hpbg" />
                <rect x={p.x - r} y={p.y + r + 3} width={2 * r * pct} height={7} className="hp" />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="info" aria-live="polite">{infoHex ? terrainInfo(state, infoHex) : 'Bir altıgene uzun basın (veya üzerine gelin): zemin bilgisi.'}</p>
      {session.error && <p className="error">{session.error}</p>}
      {state.status === 'finished' && <p className="banner">{state.winner === 'party' ? 'Parti kazandı!' : 'Düşmanlar kazandı.'}</p>}

      {setup && (
        <section className="panel">
          <p className="hint">Herkes otomatik yerleşti. Değiştirmek için bir jetona, sonra kendi bölgesinde (boyalı) bir altıgene dokunun.</p>
          <button onClick={() => run({ type: 'start_battle' })}>Savaşı başlat</button>
        </section>
      )}

      {active && actor && (
        <section className="panel" aria-label="Sıradaki savaşçı">
          <h2>{actor.name} · HP {actor.hp}/{actor.maxHp} · hareket {Math.max(0, remaining)} altıgen{actor.hidden ? ' · gizli' : ''}</h2>
          <p className="hint">Yeşil: yürü (sayı maliyet), mavi: atla. Bir düşmana dokunun: saldırı önizlemesi.</p>
          {aimSpell ? (
            <p className="hint">
              <strong>{aimSpell.name}</strong>: hedef altıgene dokunun, aynı altıgene tekrar dokunarak onaylayın.{' '}
              {aimHex && <button onClick={() => run({ type: 'cast_spell', actorId, spellName: aimSpell.name, targetHex: aimHex })}>Büyüyü yap</button>}{' '}
              <button className="ghost" onClick={() => { setAimSpell(null); setAimHex(null); }}>Vazgeç</button>
            </p>
          ) : null}
          {targetId && state.combatants[targetId] && (
            <div className="group">
              <h3>{state.combatants[targetId]?.name} için</h3>
              <div className="buttons">
                {choices.map((ch) => (
                  <button key={ch.id} disabled={!ch.command} onClick={() => ch.command && run(ch.command)}>
                    <span>{ch.label}</span>
                    <small>{ch.detail}</small>
                  </button>
                ))}
                {choices.length === 0 && <small className="mute">Bu hedefe yapılacak bir şey yok.</small>}
              </div>
            </div>
          )}
          <div className="buttons">
            {areaSpellsOf(actor).map((sp) => (
              <button key={sp.name} onClick={() => { setAimSpell(sp); setAimHex(null); setTargetId(null); }}>
                <span>{sp.name}</span>
                <small>{sp.area ? `${sp.area.sizeFt} ft alan` : ''}</small>
              </button>
            ))}
            <button disabled={!!actor.hidden || hideBonus === null} onClick={() => run({ type: 'hide', actorId })}>
              <span>Gizlen</span>
              <small>{actor.hidden ? 'Zaten gizli' : hideBonus === null ? 'Burada gizlenilemez' : `Stealth DC ${HIDE_DC}${hideBonus ? `, +${hideBonus}` : ''}`}</small>
            </button>
            <button onClick={() => run({ type: 'search', actorId })}><span>Ara</span><small>Perception</small></button>
            <button onClick={() => run({ type: 'end_turn', actorId })}><span>Turu bitir</span><small> </small></button>
          </div>
        </section>
      )}

      <section className="log" aria-label="Savaş günlüğü">
        <h2>Savaş günlüğü</h2>
        <ol>
          {[...session.lines].reverse().slice(0, 30).map((line, i) => <li key={`${session.lines.length - i}`}>{line}</li>)}
        </ol>
      </section>
    </div>
  );
}
