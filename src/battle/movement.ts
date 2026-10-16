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
import { burnEffect, enterHexEvents, isRiskyHex, mapEnterCost, ruleOf, stuckInBog } from './maprules';
import { islandOf, jumpPath, jumpRisk, lavaLine, lavaOver, rollJump } from './jumprisk';
import { auraSlows, auraStepEvents, opportunityAttacks, withPos } from './features';
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
  const map = getMap(state.map.id, { mirrored: state.map.mirrored, variantId: state.map.variantId });
  if (actor.asleep) {
    // Uyuyan ejderha: kuralın yerine (GM taşıyabilir); geçilebilir, lav olmayan altıgen.
    const t = terrainAt(state, at);
    if (t.movement === 'blocked' || t.movement === 'deadly') return fail(`${hexLabel(at)} uygun değil (${t.name}).`);
  } else if (actor.civilian) {
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

/**
 * Bu savaşçı için bir altıgene girmenin maliyeti (yürüyüş ve yapay zekâ ortak kullanır).
 * SRD 5.2.1 s. 14 "Moving around Other Creatures": müttefikin altıgeninden normal geçilir;
 * Incapacitated düşmanın altıgeninden geçilir ama orası zorlu zemindir (2); diğer düşmanların
 * altıgeninden geçilmez. Dolu altıgende durulmaz (komut ayrıca denetler). Tiny ve iki boy
 * fark kuralları boyut modellenmediği için yok. Düşman Spirit Guardians yayılımında hız yarıya
 * iner: oradaki altıgenler iki kat maliyetli.
 */
export function moveCostFn(state: BattleState, actor: Combatant): (h: Offset, prev: Offset) => number | null {
  const flying = actor.fly > 0;
  const slowed = auraSlows(state, actor);
  const enemyAt = new Map<string, Combatant>();
  for (const c of Object.values(state.combatants)) {
    if (c.pos !== null && c.side !== actor.side && isTargetable(c)) enemyAt.set(hexKey(c.pos), c);
  }
  return (h: Offset, prev: Offset): number | null => {
    const terrain = enterCost(terrainAt(state, h), flying);
    const base = terrain === null || flying ? terrain : mapEnterCost(state, prev, h, terrain);
    const enemy = enemyAt.get(hexKey(h));
    const cost = base === null || !enemy ? base : isIncapacitated(enemy.conditions) ? Math.max(2, base) : null;
    return cost !== null && slowed(h) ? cost * 2 : cost;
  };
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

  const cost = moveCostFn(state, actor);
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
  // Adım adım yürü. Her adımdan önce erişiminden çıkılan düşmanlar fırsat saldırısı yapar
  // (düşen yürüyüşü bitirir); girilen altıgenin harita kuralları (alev, buz, batak, tuzak)
  // yürüyüşü kesebilir; yayılıma (Spirit Guardians) giriş save ister. Yalnızca o ana kadarki
  // yol ve maliyeti yazılır.
  const effects: BattleEvent[] = [];
  let walked = 0;
  let spent = 0;
  let prev = from;
  let current = state;
  const down = () => ((current.combatants[actor.id] as Combatant).hp <= 0);
  for (const step of path.path) {
    const opportunity = opportunityAttacks(current, actor.id, { from: prev, to: step }, rng);
    effects.push(...opportunity);
    current = applyEvents(current, opportunity);
    if (down()) break;
    spent += cost(step, prev) ?? 0;
    walked += 1;
    current = withPos(current, actor.id, step);
    const me = current.combatants[actor.id] as Combatant;
    const entered = enterHexEvents(current, me, step, rng);
    effects.push(...entered.events);
    current = applyEvents(current, entered.events);
    const aura = down() ? [] : auraStepEvents(current, actor.id, prev, step, rng);
    effects.push(...aura);
    current = applyEvents(current, aura);
    prev = step;
    if (entered.stop || down()) break;
  }
  const moved: BattleEvent[] = walked > 0 ? [{ type: 'moved', actorId: actor.id, path: path.path.slice(0, walked), cost: spent }] : [];
  return finish(state, [...moved, ...effects]);
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
export function executeJump(state: BattleState, actor: Combatant, to: Offset, rng: Rng = () => 0.5): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  if (sameHex(from, to)) return fail('Zaten bu altıgende.');
  if (lavaOver(state, from, to).length > 0) return executeIslandJump(state, actor, from, to, rng);
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

/**
 * Ada atlaması: neden atlanamayacağı (metin) ya da null. Lav üstünden geçen atlama (`lavJump`):
 * mesafe sınırı yok; başka bir adaya arası yalnızca lav olan düz hat olmalı, o adanın herhangi bir boş altıgenine;
 * `foeIsland: "reject"` ise hedef adada (bağlı kara parçası) düşman olmamalı;
 * hareketin yerine geçer (bu tur yürünmemiş olmalı).
 */
export function islandJumpProblem(state: BattleState, actor: Combatant, from: Offset, to: Offset): string | null {
  const landing = terrainAt(state, to);
  if (landing.movement === 'deadly') return `İniş altıgeni ${hexLabel(to)} lav: atlama reddedildi.`;
  if (landing.movement === 'blocked') return `${hexLabel(to)} üzerine inilemez (${landing.name}).`;
  // Ada bazlı (lavaLine): başka bir ada; hatta yalnızca lav, kendi ve hedef adanın karası olabilir.
  if (!lavaLine(state, from, to)) {
    if (islandOf(state, to).has(hexKey(from))) return 'Aynı adaya atlanmaz: yürüyerek gidilir.';
    return 'Hat üçüncü bir adanın ya da kayanın üstünden geçiyor: adayı atlayıp ileri gidilemez.';
  }
  const other = occupantAt(state, to, actor.id);
  if (other) return `${hexLabel(to)} dolu (${other.name}).`;
  const island = ruleOf(state, 'lavJump')?.foeIsland === 'reject' ? islandOf(state, to) : new Set<string>();
  const foe = Object.values(state.combatants).find((c) => c.side !== actor.side && c.life !== 'dead' && c.pos && island.has(hexKey(c.pos)));
  if (foe) return `Hedef adada düşman var (${foe.name}): ada atlaması reddedildi.`;
  if (speedHexes(actor) <= 0) return 'Hızın 0: atlanamaz.';
  if (actor.movementUsed > 0) return 'Ada atlaması hareketin yerine geçer: bu tur yürüdükten sonra atlanamaz.';
  return null;
}

function executeIslandJump(state: BattleState, actor: Combatant, from: Offset, to: Offset, rng: Rng): CommandResult {
  const problem = islandJumpProblem(state, actor, from, to);
  if (problem) return fail(problem);
  const gap = (lavaLine(state, from, to) ?? []).length;
  // Hareketin yerine geçer: kalan bütün hareket harcanır.
  const cost = speedHexes(actor) - actor.movementUsed;
  const jumped: BattleEvent = { type: 'jumped', actorId: actor.id, from, to, gap, cost, running: false };
  // Uçan zarsız geçer; diğerleri beceri zarı (`lavJump`).
  const risk = jumpRisk(state, actor, from, to);
  if (!risk) return finish(state, [jumped]);
  const roll = rollJump(risk, state, rng);
  const events: BattleEvent[] = [{
    type: 'jump_check', actorId: actor.id, from, to, skill: risk.skill, d20: roll.d20, natural: roll.natural,
    total: roll.total, dc: risk.dc, over: risk.over.length, outcome: roll.outcome,
  }];
  if (roll.outcome === 'fell') {
    // Uzun atlamada yolun ortasında düşer.
    const at = risk.over[Math.floor((risk.over.length - 1) / 2)] as Offset;
    events.push(risk.fall === 'deadly'
      ? { type: 'fell_into_lava', actorId: actor.id, at }
      : { type: 'map_effect', rule: 'lavJump', targetId: actor.id, text: 'atlarken düştü', moveTo: at, stopMovement: true });
    return finish(state, events);
  }
  events.push(jumped);
  if (roll.outcome === 'burned') {
    const landed = applyEvents(state, events).combatants[actor.id] as Combatant;
    events.push(burnEffect(landed, risk.onFail, 'kenarda yandı', rng));
  }
  return finish(state, events);
}
