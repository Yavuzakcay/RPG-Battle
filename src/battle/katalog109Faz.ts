/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): Faz 2'nin harita ve çağırma eklemeleri (`data/katalog-gucler.json` `faz2`):
 * su/kıyı altıgenlerine zorlu arazi alanı (The Sleeper Awakens), bossun çevresine yüzey (Taş Uyanışı: alev halkası, buz, zehir,
 * su) ya da kalıcı alan (asit), faz anında ve (faz 2'deyken) her tur başında canavar çağırma (Cerbones iskeletleri).
 * Faz olayının (`phase_changed`) hemen ardından üretilir; reducer bilinen olaylarla (`zone_created`, `summoned`) uygular.
 * 108 ve altında boş. Saf.
 */
import { distance, ring, withinRange, type Offset } from '../rules/hex';
import { getMonster } from '../data';
import { gucOf } from './katalog109Data';
import { katalog109On } from './katalog109Surum';
import { combatantFromMonster } from './create';
import { lateSummonEvents } from './monsterSetup';
import { occupantAt, terrainAt } from './movement';
import { isWater, surfaceEvent } from './surfaces';
import { registerTurnStart } from './turnHooks';
import type { BattleEvent, BattleState, Combatant, SpellZone, SurfaceKind } from './types';

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const free = (s: BattleState, h: Offset) => !occupantAt(s, h) && terrainAt(s, h).movement !== 'blocked';

/** Sahibinin çevresine `count` canavar (boş, geçilebilir altıgenler; yakından uzağa). */
export function spawnMonsters(state: BattleState, owner: Combatant, monsterId: string, count: number, tag: string): BattleEvent[] {
  if (!state.map || !owner.pos || count <= 0) return [];
  const size = sizeOf(state);
  const spots: Offset[] = [];
  for (let r = 1; r <= 4 && spots.length < count; r++) for (const h of ring(owner.pos, r, size)) if (spots.length < count && free(state, h) && terrainAt(state, h).movement === 'normal') spots.push(h);
  let m;
  try { m = getMonster(monsterId); } catch { return []; }
  const out: BattleEvent[] = [];
  const idx = state.order.indexOf(owner.id) + 1;
  for (const [k, pos] of spots.entries()) {
    let id = `${owner.id}-${tag}-${state.round}-${k}`;
    for (let n = 2; state.combatants[id] || state.order.includes(id); n++) id = `${owner.id}-${tag}-${state.round}-${k}-${n}`;
    const base = combatantFromMonster(m, { id, name: `${m.name} (${owner.name})`, kuralSurumu: state.kuralSurumu ?? 1 });
    const c: Combatant = { ...base, side: owner.side, pos, initiative: owner.initiative, summon: { by: owner.id, spellId: `k109:${tag}`, spell: tag, level: 0, turn: 'after-owner' } };
    out.push(...lateSummonEvents(state, { type: 'summoned', ownerId: owner.id, spell: tag, combatant: c, index: idx + k }));
  }
  return out;
}

/** Faz anındaki eklemeler. */
export function k109PhaseEvents(state: BattleState, c: Combatant): BattleEvent[] {
  const f = gucOf(state, c.monsterId)?.faz2;
  if (!f || !state.map || !c.pos) return [];
  const size = sizeOf(state);
  const out: BattleEvent[] = [];
  const used = new Set((state.map.zones ?? []).map((z) => z.id));
  const zone = (name: string, hexes: Offset[], rounds: number, spec: Record<string, unknown>): BattleEvent => {
    let id = `k109:faz:${c.id}:${name}`;
    for (let n = 2; used.has(id); n++) id = `k109:faz:${c.id}:${name}:${n}`;
    used.add(id);
    return { type: 'zone_created', zone: { id, spellId: `k109:faz:${name}`, name, casterId: c.id, side: c.side, dc: 0, slotLevel: 0, hexes, until: state.round + rounds, spec: spec as SpellZone['spec'] } };
  };
  if (f.zorluZemin) {
    const hexes: Offset[] = [];
    for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) {
      const h = { col, row };
      if ((f.zorluZemin.su && isWater(state, h)) || f.zorluZemin.harfler?.includes(state.map.tiles[row]?.[col] ?? '')) hexes.push(h);
    }
    if (hexes.length) out.push(zone('Uyanan Deniz', hexes, 100000, { difficult: f.zorluZemin.maliyet, targets: 'all', color: '#2a4a6b', icon: '🌊' }));
  }
  if (f.yuzey) {
    const r = Math.floor(f.yuzey.radiusFt / 5);
    // GECE-KATALOG-KALAN (110; `s110` verisinde `kenar`): haritanın kenar altıgenleri (arena kenarı).
    const edge = (): Offset[] => { const out: Offset[] = []; for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) if (row === 0 || col === 0 || row === size.rows - 1 || col === size.cols - 1) out.push({ col, row }); return out; };
    const hexes = (f.yuzey.kenar ? edge() : f.yuzey.halka ? ring(c.pos, r, size) : withinRange(c.pos, r, size)).filter((h) => distance(h, c.pos as Offset) > 0 && free(state, h));
    if (hexes.length) {
      const ev = surfaceEvent(state, f.yuzey.kind as SurfaceKind, hexes, c.id, c.side);
      if (ev.type === 'zone_created') ev.zone.until = state.round + f.yuzey.rounds;
      out.push(ev);
    }
  }
  if (f.alan) {
    const hexes = withinRange(c.pos, Math.floor(f.alan.radiusFt / 5), size).filter((h) => distance(h, c.pos as Offset) > 0);
    out.push(zone(f.alan.name, hexes, f.alan.rounds, f.alan.spec));
  }
  for (const [mid, n] of Object.entries(f.cagir ?? {})) out.push(...spawnMonsters(state, c, mid, n, `faz2-${mid}`));
  return out;
}

/** Faz 2'deki bossun tur başı çağrısı (en çok `max` canlı çağrı). */
export function phaseTurnStartEvents(state: BattleState, id: string): BattleEvent[] {
  const c = state.combatants[id];
  if (!c || !katalog109On(state) || c.faz !== 2 || c.hp <= 0) return [];
  const t = gucOf(state, c.monsterId)?.faz2?.turBasiCagir;
  if (!t) return [];
  const alive = Object.values(state.combatants).filter((o) => o.summon?.by === c.id && o.summon.spellId === `k109:faz2t-${t.monster}` && o.hp > 0 && !o.summon.gone).length;
  return spawnMonsters(state, c, t.monster, Math.min(t.count, t.max - alive), `faz2t-${t.monster}`);
}

registerTurnStart((s, id) => phaseTurnStartEvents(s, id));
