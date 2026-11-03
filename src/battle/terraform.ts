/**
 * Kuyruk 19 (anahtar `spellsK19`, kural sürümü 16): savaş dışı sayılan 4.–5. seviye büyülerin savaş yönleri (SRD 5.2.1).
 * - Passwall: görülen 30 ft içindeki taş/ahşap duvar yüzeyinde 20 ft derin geçit (büyücüden hedefe doğru en çok 4 altıgen
 *   duvar → açık zemin; 1 saat, savaş boyunca).
 * - Stone Shape: dokunulan (bitişik) 5 ft'lik taş bölümü (duvar, sütun, dikit) açık zemine çevrilir ya da kapalı kapı
 *   taşla mühürlenir (`choice: 'seal'`; kapı duvar olur).
 * - Control Water (konsantrasyon): `choice` flood (alandaki sığ su derin suya), part (derin su yarılır: büyücüden hedefe
 *   doğru 2 altıgen genişliğinde hendek, açık zemin) ya da whirlpool (derin su merkezli 5 altıgen girdap alanı: tur başında
 *   sudakileri 2 altıgen çeker, girişte/tur sonunda STR save 2d8; uzaklaşmak için Athletics `escape`). Büyü bitince su
 *   eski hâline döner (alan `restore`).
 */
import { distance, neighbors, offsetToAxial, sameHex, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { isLiquidTile } from './deepWater';
import { sightBlockedBetween } from './cover';
import { occupantAt, terrainAt } from './movement';
import { spendSlot, concentrationEvent } from './slots';
import { newZoneId } from './zones';
import type { BattleEvent, BattleState, Combatant, Command } from './types';
import type { Spell } from '../data';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;
const STONE = new Set(['s', 'c', 'v', 'm']);
const WOOD_OR_STONE = new Set([...STONE, 'O']);
const tileAt = (state: BattleState, h: Offset) => state.map?.tiles[h.row]?.[h.col] ?? '#';

/** Büyücüden hedefe doğru (hedef dahil) düz hat: her adımda yöne en uygun komşu (küp koordinatında iç çarpım), `n` altıgen. */
function lineFrom(state: BattleState, from: Offset, to: Offset, n: number): Offset[] {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const cube = (h: Offset) => { const a = offsetToAxial(h); return [a.q, -a.q - a.r, a.r] as const; };
  const [fx, fy, fz] = cube(from);
  const [tx, ty, tz] = cube(to);
  const dir = [tx - fx, ty - fy, tz - fz];
  const out: Offset[] = [to];
  let cur = to;
  for (let i = 1; i < n; i++) {
    const [cx, cy, cz] = cube(cur);
    const next = neighbors(cur, size).map((h) => { const [x, y, z] = cube(h); return { h, dot: (x - cx) * dir[0]! + (y - cy) * dir[1]! + (z - cz) * dir[2]! }; })
      .sort((a, b) => b.dot - a.dot)[0];
    if (!next || next.dot <= 0) break;
    out.push(next.h);
    cur = next.h;
  }
  return out;
}

export function executeTerraform(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const mode = spell.mechanics.terraform?.mode;
  if (!state.map || !actor.pos) return fail(`${spell.name} yalnızca haritalı savaşta.`);
  const at = cmd.targetHex;
  if (!at) return fail('Hedef altıgeni seç.');
  const range = spell.rangeFt;
  if (distance(actor.pos, at) * 5 > Math.max(5, range)) return fail(`Menzil dışında (en çok ${range} ft).`);
  const tiles: Array<{ at: Offset; to: string; from: string }> = [];
  let zoneExtra: Partial<import('./types').SpellZone> | null = null;
  if (mode === 'passwall') {
    if (!WOOD_OR_STONE.has(tileAt(state, at))) return fail('Passwall taş ya da ahşap bir yüzeye yapılır.');
    const wall = sightBlockedBetween(state, actor.pos, at);
    if (wall && distance(actor.pos, at) > 1) return fail(`Yüzey görülmüyor (${wall}).`);
    for (const h of lineFrom(state, actor.pos, at, 4)) {
      if (!WOOD_OR_STONE.has(tileAt(state, h))) break;
      tiles.push({ at: h, to: '.', from: tileAt(state, h) });
    }
  } else if (mode === 'stoneShape') {
    if (distance(actor.pos, at) !== 1) return fail('Stone Shape dokunmayla (bitişik).');
    if (cmd.choice === 'seal') {
      if (tileAt(state, at) !== 'O') return fail('Mühürlenecek kapalı kapı yok.');
      tiles.push({ at, to: 's', from: 'O' });
    } else {
      if (!STONE.has(tileAt(state, at))) return fail('Taş bir bölüm (duvar, sütun, dikit) seç.');
      tiles.push({ at, to: '.', from: tileAt(state, at) });
    }
  } else if (mode === 'controlWater') {
    const choice = cmd.choice ?? 'whirlpool';
    const area = (h: Offset) => distance(h, at) <= 10;
    const all: Offset[] = [];
    for (let row = 0; row < state.map.tiles.length; row++) for (let col = 0; col < (state.map.tiles[0]?.length ?? 0); col++) if (area({ col, row })) all.push({ col, row });
    if (choice === 'flood') {
      for (const h of all) if (tileAt(state, h) === 'n') tiles.push({ at: h, to: 'w', from: 'n' });
      if (!tiles.length) return fail('Alanda yükselecek durgun (sığ) su yok.');
    } else if (choice === 'part') {
      const strip = lineFrom(state, actor.pos, at, 20);
      const wide = [...strip, ...strip.flatMap((h) => neighbors(h, { cols: state.map!.tiles[0]?.length ?? 0, rows: state.map!.tiles.length }).filter((n) => distance(n, at) <= 10).slice(0, 1))];
      for (const h of wide) if (tileAt(state, h) === 'w' && !tiles.some((t) => sameHex(t.at, h))) tiles.push({ at: h, to: '.', from: 'w' });
      if (!tiles.length) return fail('Yarılacak derin su yok.');
    } else {
      if (tileAt(state, at) !== 'w') return fail('Girdap derin suyun ortasında olmalı.');
      const ring = all.filter((h) => distance(h, at) <= 5);
      zoneExtra = { hexes: ring, center: at };
    }
  } else return fail('Bilinmeyen biçim.');
  if (!tiles.length && !zoneExtra) return fail('Değişecek bir şey yok.');
  if (tiles.some((t) => t.to !== '.' && occupantAt(state, t.at, ''))) return fail('Değişecek altıgende bir yaratık var.');
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, level, {})];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: `${spell.name}: ${tiles.length ? `${tiles.length} altıgen değişti` : 'girdap'}.` });
  for (const t of tiles) events.push({ type: 'tile_changed', at: t.at, to: t.to });
  // Konsantrasyonlu büyüde (Control Water) değişen altıgenler alan bitince eski hâline döner.
  if (spell.concentration || zoneExtra) {
    events.push({ type: 'zone_created', zone: { id: newZoneId(state, spell.id, actor.id), spellId: zoneExtra ? spell.id : `${spell.id}:terrain`, name: spell.name, casterId: actor.id, side: actor.side,
      dc: actor.spellSaveDc ?? 13, slotLevel: level, hexes: zoneExtra?.hexes ?? tiles.map((t) => t.at), ...(zoneExtra?.center ? { center: zoneExtra.center } : {}),
      ...(spell.concentration ? { concentration: spell.name } : {}), ...(tiles.length ? { restore: tiles.map((t) => ({ at: t.at, ch: t.from })) } : {}) } });
  }
  void terrainAt; void isLiquidTile;
  return finish(state, events);
}
