/** Haritalı savaş: yerleştirme, savaşı başlatma ve yürüme. */
import { getMap } from '../map/maps';
import { enterCost, terrainOf, type TerrainType } from '../map/terrain';
import { isIncapacitated } from '../rules/conditions';
import { findPath, hexKey, isInside, sameHex, type Offset } from '../rules/hex';
import { canControl, fail, finish, isTargetable, type CommandResult } from './common';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';

/** Kullanıcıya gösterilen 1 tabanlı konum metni. */
export const hexLabel = (o: Offset): string => `sütun ${o.col + 1}, satır ${o.row + 1}`;

/** Savaştaki haritanın o anki altıgeni (ızgara dışı oyun alanı dışı sayılır). */
export function terrainAt(state: BattleState, o: Offset): TerrainType {
  return terrainOf(state.map?.tiles[o.row]?.[o.col] ?? '#');
}

/** Bir turdaki hareket bütçesi (altıgen): uçan yaratık uçuş hızını kullanır. */
export function speedHexes(c: Combatant): number {
  return Math.floor((c.fly > 0 ? c.fly : c.speed) / 5);
}

/** Altıgende duran başka bir savaşçı (ölüler yer kaplamaz). */
export function occupantAt(state: BattleState, at: Offset, exceptId?: string): Combatant | undefined {
  return Object.values(state.combatants).find(
    (c) => c.id !== exceptId && c.pos !== null && sameHex(c.pos, at) && isTargetable(c),
  );
}

export function executePlace(state: BattleState, actorId: string, at: Offset, ctx: CommandContext): CommandResult {
  if (state.status !== 'setup' || !state.map) return fail('Yerleştirme yalnızca kurulum aşamasında yapılır.');
  const actor = state.combatants[actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  const map = getMap(state.map.id, { mirrored: state.map.mirrored });
  const zone = actor.side === 'party' ? map.startZones.players : map.startZones.enemies;
  if (!zone.some((h) => sameHex(h, at))) return fail(`${hexLabel(at)} kendi başlangıç bölgende değil.`);
  const other = occupantAt(state, at, actor.id);
  if (other) return fail(`${hexLabel(at)} dolu (${other.name}).`);
  const events: BattleEvent[] = [{ type: 'placed', actorId: actor.id, at }];
  return { ok: true, state: applyEvents(state, events), events };
}

export function executeStartBattle(state: BattleState, ctx: CommandContext): CommandResult {
  if (!ctx.isGm) return fail('Savaşı yalnızca GM başlatabilir.');
  if (state.status !== 'setup') return fail('Savaş zaten başladı.');
  const missing = Object.values(state.combatants).filter((c) => c.pos === null);
  if (missing.length > 0) return fail(`Henüz yerleşmeyenler var: ${missing.map((c) => c.name).join(', ')}.`);
  const events: BattleEvent[] = [{ type: 'combat_started' }];
  return { ok: true, state: applyEvents(state, events), events };
}

export function executeMove(state: BattleState, actor: Combatant, to: Offset): CommandResult {
  if (!state.map || !actor.pos) return fail('Bu savaşta harita yok.');
  if (actor.conditions.some((c) => c === 'Restrained' || c === 'Grappled')) {
    return fail('Hareket edemiyor (Restrained veya Grappled).');
  }
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  if (!isInside(to, size)) return fail('Harita dışına çıkılamaz.');
  if (sameHex(actor.pos, to)) return fail('Zaten bu altıgende.');
  const flying = actor.fly > 0;
  const target = terrainAt(state, to);
  if (target.movement === 'deadly' && !flying) return fail(`${hexLabel(to)} lav: gönüllü olarak girilemez.`);
  if (target.movement === 'blocked') return fail(`${hexLabel(to)} geçilmez (${target.name}).`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`${hexLabel(to)} dolu (${other.name}).`);

  // Düşmanların (aksiyon yapabilenlerin) altıgeninden geçilmez; müttefikin ve
  // Incapacitated yaratığın altıgeninden geçilebilir, ama orada durulamaz.
  const blockers = new Set(
    Object.values(state.combatants)
      .filter((c) => c.pos !== null && c.side !== actor.side && isTargetable(c) && !isIncapacitated(c.conditions))
      .map((c) => hexKey(c.pos as Offset)),
  );
  const cost = (h: Offset): number | null => (blockers.has(hexKey(h)) ? null : enterCost(terrainAt(state, h), flying));
  const remaining = speedHexes(actor) - actor.movementUsed;
  const path = findPath(actor.pos, to, size, cost, remaining);
  if (!path) {
    const any = findPath(actor.pos, to, size, cost);
    if (!any) return fail(`${hexLabel(to)} için yol yok.`);
    return fail(`Hareket yetmiyor: ${any.cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  }
  return finish(state, [{ type: 'moved', actorId: actor.id, path: path.path, cost: path.cost }]);
}
