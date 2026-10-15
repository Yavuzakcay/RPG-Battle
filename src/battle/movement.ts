/** Haritalı savaş: yerleştirme, savaşı başlatma ve yürüme. */
import { getMap } from '../map/maps';
import { enterCost, terrainOf, type TerrainType } from '../map/terrain';
import { isIncapacitated } from '../rules/conditions';
import {
  AXIAL_DIRECTIONS, axialToOffset, directionTo, distance, findPath, hexKey, isInside, offsetToAxial, sameHex,
  type Offset,
} from '../rules/hex';
import { canControl, fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { applyEvents, speedHexes } from './reduce';
import { enterHexEvents, isRiskyHex, mapEnterCost, stuckInBog } from './maprules';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';

/** Kullanıcıya gösterilen 1 tabanlı konum metni. */
export const hexLabel = (o: Offset): string => `sütun ${o.col + 1}, satır ${o.row + 1}`;

/** Savaştaki haritanın o anki altıgeni (ızgara dışı oyun alanı dışı sayılır). */
export function terrainAt(state: BattleState, o: Offset): TerrainType {
  return terrainOf(state.map?.tiles[o.row]?.[o.col] ?? '#');
}

export { speedHexes };

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
  if (actor.civilian) {
    // Masumlar düşman bölgesi dışında, tehlikesiz ve geçilebilir herhangi bir altıgene konur.
    const t = terrainAt(state, at);
    if (t.movement === 'blocked' || t.movement === 'deadly' || t.hazard) return fail(`${hexLabel(at)} masum için uygun değil (${t.name}).`);
    if (map.startZones.enemies.some((h) => sameHex(h, at))) return fail(`${hexLabel(at)} düşman bölgesinde.`);
  } else {
    const zone = actor.side === 'party' ? map.startZones.players : map.startZones.enemies;
    if (!zone.some((h) => sameHex(h, at))) return fail(`${hexLabel(at)} kendi başlangıç bölgende değil.`);
  }
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

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

/** Yürüme ve atlamanın ortak ön koşulları: harita, konum, hareket engeli, harita içi hedef. */
function checkMover(state: BattleState, actor: Combatant, to: Offset): Offset | Failure {
  if (!state.map || !actor.pos) return fail('Bu savaşta harita yok.');
  if (actor.conditions.some((c) => c === 'Restrained' || c === 'Grappled')) {
    return fail('Hareket edemiyor (Restrained veya Grappled).');
  }
  if (!isInside(to, sizeOf(state))) return fail('Harita dışına çıkılamaz.');
  if (stuckInBog(state, actor)) return fail('Batağa saplandı: çıkmak için Athletics (Çık) ya da bir müttefik çekmeli.');
  return actor.pos;
}

export function executeMove(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  const size = sizeOf(state);
  if (sameHex(from, to)) return fail('Zaten bu altıgende.');
  const flying = actor.fly > 0;
  const target = terrainAt(state, to);
  if (target.movement === 'deadly' && !flying) return fail(`${hexLabel(to)} lav: gönüllü olarak girilemez.`);
  if (target.movement === 'blocked') return fail(`${hexLabel(to)} geçilmez (${target.name}).`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`${hexLabel(to)} dolu (${other.name}).`);

  // SRD 5.2.1 s. 14 "Moving around Other Creatures": müttefikin altıgeninden normal
  // geçilir; Incapacitated düşmanın altıgeninden geçilir ama orası zorlu zemindir (2);
  // diğer düşmanların altıgeninden geçilmez. Dolu altıgende durulmaz (yukarıda).
  // Tiny ve iki boy fark kuralları boyut modellenmediği için yok.
  const enemyAt = new Map<string, Combatant>();
  for (const c of Object.values(state.combatants)) {
    if (c.pos !== null && c.side !== actor.side && isTargetable(c)) enemyAt.set(hexKey(c.pos), c);
  }
  const cost = (h: Offset, prev: Offset): number | null => {
    const terrain = enterCost(terrainAt(state, h), flying);
    const base = terrain === null || flying ? terrain : mapEnterCost(state, prev, h, terrain);
    const enemy = enemyAt.get(hexKey(h));
    if (base === null || !enemy) return base;
    return isIncapacitated(enemy.conditions) ? Math.max(2, base) : null;
  };
  const remaining = speedHexes(actor) - actor.movementUsed;
  // Önce tehlikeli altıgenlerden (alev, batak, buz, bilinen tuzak) geçmeyen yol; yoksa en ucuzu.
  const risky = (h: Offset) => !sameHex(h, to) && isRiskyHex(state, h);
  const safe = (h: Offset, prev: Offset) => (risky(h) ? null : cost(h, prev));
  const path = findPath(from, to, size, safe, remaining) ?? findPath(from, to, size, cost, remaining);
  if (!path) {
    const any = findPath(from, to, size, cost);
    if (!any) return fail(`${hexLabel(to)} için yol yok.`);
    return fail(`Hareket yetmiyor: ${any.cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  }
  // Adım adım yürü: girilen altıgenin harita kuralları (alev, buz, batak, tuzak) yürüyüşü
  // kesebilir; o zaman yalnızca o ana kadarki yol ve maliyeti yazılır.
  const effects: BattleEvent[] = [];
  let walked = 0;
  let spent = 0;
  let prev = from;
  let current = state;
  for (const step of path.path) {
    spent += cost(step, prev) ?? 0;
    walked += 1;
    prev = step;
    const me = current.combatants[actor.id] as Combatant;
    const entered = enterHexEvents(current, { ...me, pos: step }, step, rng);
    effects.push(...entered.events);
    current = applyEvents(current, entered.events);
    if (entered.stop) break;
  }
  return finish(state, [{ type: 'moved', actorId: actor.id, path: path.path.slice(0, walked), cost: spent }, ...effects]);
}

/** Uzun atlama menzili (ft): koşarak STR skoru kadar, koşusuz yarısı (aşağı yuvarlanır). */
export function jumpRangeFeet(c: Combatant, running: boolean): number {
  return running ? c.strScore : Math.floor(c.strScore / 2);
}

/**
 * Uzun atlama (5e). Menzil kanal genişliğiyle ölçülür: aradaki altıgen sayısı × 5 ft,
 * menzili aşmamalı; iniş altıgeni mesafeye sayılmaz. Koşu: bu turda atlamayla aynı yönde
 * art arda en az 2 altıgen yürümüş olmak. Hareket maliyeti: aradaki altıgenler + inişin
 * zemin maliyeti. Aradaki altıgenlerde yalnızca engel (sütun, dış kayalık) atlamayı
 * engeller; lav, zemin ve yaratıklar engellemez. İniş lav, engel veya dolu olamaz.
 */
export function executeJump(state: BattleState, actor: Combatant, to: Offset): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  if (sameHex(from, to)) return fail('Zaten bu altıgende.');
  const dir = directionTo(from, to);
  if (dir === null) return fail('Atlama düz bir doğrultuda olmalı.');
  const step = AXIAL_DIRECTIONS[dir] as { q: number; r: number };
  const start = offsetToAxial(from);
  const gap = distance(from, to) - 1;
  if (gap === 0) return fail('Komşu altıgene atlanmaz, yürüyerek geçilir.');
  for (let i = 1; i <= gap; i++) {
    const h = axialToOffset({ q: start.q + step.q * i, r: start.r + step.r * i });
    const t = terrainAt(state, h);
    if (t.movement === 'blocked') return fail(`Aradaki ${hexLabel(h)} üstünden atlanamaz (${t.name}).`);
  }
  const landing = terrainAt(state, to);
  if (landing.movement === 'deadly') return fail(`İniş altıgeni ${hexLabel(to)} lav: atlama reddedildi.`);
  if (landing.movement === 'blocked') return fail(`${hexLabel(to)} üzerine inilemez (${landing.name}).`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`${hexLabel(to)} dolu (${other.name}).`);

  const running = actor.run !== null && actor.run.dir === dir && actor.run.hexes >= 2;
  const range = jumpRangeFeet(actor, running);
  const width = gap * 5;
  if (width > range) {
    return fail(
      `Menzil yetmiyor: kanal ${gap} altıgen (${width} ft), atlama menzili ${range} ft (${running ? 'koşarak' : 'koşusuz'}).`,
    );
  }
  const cost = gap + (enterCost(landing, actor.fly > 0) ?? 1);
  const remaining = speedHexes(actor) - actor.movementUsed;
  if (cost > remaining) return fail(`Hareket yetmiyor: ${cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  return finish(state, [{ type: 'jumped', actorId: actor.id, from, to, gap, cost, running }]);
}
