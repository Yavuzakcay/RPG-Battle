/** Haritalı savaş: yerleştirme, savaşı başlatma ve yürüme. */
import { afterStepEvents } from './turnHooks';
import { groundWardFn } from './groundWard';
import { solidBarrierAt } from './barriers';
import { sizeRank } from './forced';
import { interposeCost } from './arcaneHand';
import { globalRule } from './ruleControl';
import { spells } from '../data';
import { fearBlocksStep, ruleVersion, srdConditions } from './ruleVersion';
import { phaseOf } from './phase';
import { objectAt, withObject } from './objectData';
import { bodyAt, covers, isMultiHex } from './body';
import { leashBlocks, leashOf } from './leash';
import { getMap } from '../map/maps';
import { enterCost, terrainOf, type TerrainType } from '../map/terrain';
import { isIncapacitated, speedZero } from '../rules/conditions';
import {
  AXIAL_DIRECTIONS, axialToOffset, directionTo, distance, findPath, hexKey, isInside, neighbors, offsetToAxial, sameHex,
  type Offset,
} from '../rules/hex';
import { canControl, fail, finish, isIntangible, isTargetable, type CommandResult, type Failure } from './common';
import { vortexBlocks, zoneMoveCost, zoneStepEvents } from './zones';
import { monsterStepEvents } from './monsterSteps';
import { applyEvents, speedHexes } from './reduce';
import { burnEffect, enterHexEvents, isRiskyHex, mapEnterCost, ruleOf, stuckInBog, stormNow } from './maprules';
import { islandOf, jumpPath, jumpRisk, lavaLine, lavaOver, rollJump } from './jumprisk';
import { auraSlows, auraStepEvents, opportunityAttacks, withPos } from './features';
import { deepWaterBlocks, isLiquidTile, waterWalks } from './deepWater';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';
import { climbs, flySpeed, isAirborne, spellJumpFt } from './flight';
import { heightAt, heightDelta, heightMoveRule, heightStepFn, levelFeet } from './heights';
import { mechanicsAt } from './spellVersion';
import s2rules from '../../data/s2-kurallar.json';
import { usedThisTurn } from './classTraits';
import { turnKey } from './economy';
import { conveyorBlocks, conveyorFlow, conveyorSlideEvents, isUphillStep } from './conveyor';

/** Kullanıcıya gösterilen 1 tabanlı konum metni. */
export const hexLabel = (o: Offset): string => `sütun ${o.col + 1}, satır ${o.row + 1}`;

/** Savaştaki haritanın o anki altıgeni (ızgara dışı oyun alanı dışı sayılır). */
export function terrainAt(state: BattleState, o: Offset): TerrainType {
  const t = terrainOf(state.map?.tiles[o.row]?.[o.col] ?? '#');
  // K17 G1: geçilmez büyü duvarı (Wall of Force, Wall of Stone) altıgeni engel yapar (hareket, siper, görüş/hat).
  const wall = state.map?.zones?.length ? solidWallAt(state, o) : null;
  if (wall) return { ...t, name: wall, movement: 'blocked', cover: 5, blocksSight: !transparentWallAt(state, o) };
  // Kuyruk K53 S4: herkese kapalı geçici engel (Çizili Duvar).
  const bar = state.map?.zones?.length ? solidBarrierAt(state, o) : null;
  if (bar) return { ...t, name: bar.name, movement: 'blocked', cover: 5, blocksSight: bar.blocksSight };
  // Kuyruk 19: alanın kapladığı merkez (Guardian of Faith): geçilmez, görüşü kesmez.
  const held = state.map?.zones?.find((z) => z.center && z.center.col === o.col && z.center.row === o.row && spells.find((s) => s.id === z.spellId)?.mechanics.zone?.occupy);
  if (held) return { ...t, name: held.name, movement: 'blocked' };
  // Görev S2: altıgendeki nesne etkin zemini değiştirir (hareket, örtü, görüş).
  const obj = state.map?.objects?.length ? objectAt(state, o) : undefined;
  return obj ? withObject(t, obj) : t;
}

/** Kuyruk 19: görünmez duvar (Wall of Force) görüşü kesmez. */
function transparentWallAt(state: BattleState, h: Offset): boolean {
  return (state.map?.zones ?? []).some((z) => z.hexes.some((x) => x.col === h.col && x.row === h.row) && !!spells.find((s) => s.id === z.spellId)?.mechanics.zone?.transparent
    && globalRule(state, 'spellsK19'));
}

/** K17 G1: geçilmez büyü duvarı bu altıgende mi (alan verisinde `solid`); varsa duvarın adı. */
export function solidWallAt(state: BattleState, h: Offset): string | null {
  for (const z of state.map?.zones ?? []) {
    if (z.surface || !z.hexes.some((x) => x.col === h.col && x.row === h.row)) continue;
    if (spells.find((s) => s.id === z.spellId)?.mechanics.zone?.solid) return z.name;
  }
  return null;
}

export { speedHexes };

/** Altıgende duran başka bir savaşçı (ölüler yer kaplamaz). */
export function occupantAt(state: BattleState, at: Offset, exceptId?: string): Combatant | undefined {
  return Object.values(state.combatants).find(
    (c) => c.id !== exceptId && c.pos !== null && !c.summon?.noSpace && covers(state, c, at) && isTargetable(c),
  );
}

/**
 * GM'in yerleştirebileceği altıgen mi: harita içinde, engel, lav, derin su ve oyun alanı dışı değil.
 * (Doluluk ayrıca denetlenir.) Alev ve tuzak gibi tehlikeler GM'in kararıdır.
 */
export function placeProblem(state: BattleState, at: Offset): string | null {
  if (!isInside(at, sizeOf(state))) return 'Harita dışı.';
  const t = terrainAt(state, at);
  if (t.outOfBounds || t.movement === 'blocked') return `${hexLabel(at)} engel (${t.name}).`;
  if (t.movement === 'deadly') return `${hexLabel(at)} uygun değil (${t.name}).`;
  if (t.rule === 'deepWater') return `${hexLabel(at)} su (${t.name}).`;
  return null;
}

/**
 * Kurulumda yerleştirme. GM herkesi (karakterler dahil) haritanın herhangi bir geçerli altıgenine
 * koyar; oyuncu yalnızca kendi karakterini kendi başlangıç bölgesine. Varsayılan yerleşim
 * (`createMapBattle`) oyuncu bağlamıyla bölgelere yapılır, değişmedi.
 */
export function executePlace(state: BattleState, actorId: string, at: Offset, ctx: CommandContext): CommandResult {
  if (state.status !== 'setup' || !state.map) return fail('Yerleştirme yalnızca kurulum aşamasında yapılır.');
  const actor = state.combatants[actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!ctx.isGm && !canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  // Görev A6: çok altıgenli yaratığın bütün gövdesi geçerli altıgenlerde olmalı.
  for (const h of bodyAt(state, actor, at)) {
    const why = placeProblem(state, h);
    if (why) return fail(why);
  }
  if (!ctx.isGm) {
    const map = getMap(state.map.id, { mirrored: state.map.mirrored, variantId: state.map.variantId });
    const zone = actor.side === 'party' ? map.startZones.players : map.startZones.enemies;
    if (!zone.some((h) => sameHex(h, at))) return fail(`${hexLabel(at)} kendi başlangıç bölgende değil.`);
  }
  for (const h of bodyAt(state, actor, at)) {
    const other = occupantAt(state, h, actor.id);
    if (other) return fail(`${hexLabel(h)} dolu (${other.name}).`);
  }
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
export function checkMover(state: BattleState, actor: Combatant, to: Offset): Offset | Failure {
  if (!state.map || !actor.pos) return fail('Bu savaşta harita yok.');
  if (actor.conditions.includes('Dazed') && (actor.economy.action || actor.economy.bonus)) {
    return fail('Dazed: bu tur eylem ya da bonus eylem yaptıktan sonra hareket edemez.');
  }
  if (speedZero(actor.conditions)) {
    return fail(`Hareket edemiyor: hızı 0 (${actor.conditions.filter((c) => ['Restrained', 'Grappled', 'Paralyzed', 'Petrified', 'Unconscious'].includes(c)).join(', ')}).`);
  }
  if (!isInside(to, sizeOf(state))) return fail('Harita dışına çıkılamaz.');
  if (stuckInBog(state, actor)) return fail('Batağa saplandı: çıkmak için Athletics (Çık) ya da bir müttefik çekmeli.');
  // Kuyruk K66a (sürüm 50): yarıktaki (eksi irtifa) uçmayan yaratık önce tırmanır (`vertical_move`).
  if ((actor.altitudeFt ?? 0) < 0 && !isAirborne(actor) && ruleVersion(state) >= 50) return fail('Yarıktasın: önce tırman.');
  return actor.pos;
}

/**
 * Bu savaşçı için bir altıgene girmenin maliyeti (yürüyüş ve yapay zekâ ortak kullanır).
 * SRD 5.2.1 s. 14 "Moving around Other Creatures": müttefikin altıgeninden normal geçilir;
 * Incapacitated düşmanın altıgeninden geçilir ama orası zorlu zemindir (2); diğer düşmanların
 * altıgeninden geçilmez. Dolu altıgende durulmaz (komut ayrıca denetler). Tiny ve iki boy
 * fark kuralları boyut modellenmediği için yok. Düşman Spirit Guardians yayılımında hız yarıya
 * iner: oradaki altıgenler iki kat maliyetli. Yakaladığını sürükleyenin her adımı da iki kat.
 */
export function moveCostFn(state: BattleState, actor: Combatant): (h: Offset, prev: Offset) => number | null {
  const base = moveCostBase(state, actor);
  // Kuyruk 16 K16E (kural sürümü 2): korkan yaratık korku kaynağına isteyerek yaklaşamaz (SRD 5.2.1 Frightened).
  const fear = fearBlocksStep(state, actor);
  return fear ? (h, prev) => (fear(h, prev) ? null : base(h, prev)) : base;
}

function moveCostBase(state: BattleState, actor: Combatant): (h: Offset, prev: Offset) => number | null {
  const single = hexCostFn(state, actor);
  if (!isMultiHex(state, actor)) return single;
  // Görev A6: çok altıgenli yaratıkta çapanın adımı gövdenin bütün altıgenlerinin adımıdır; maliyet en kötüsü
  // (zemin, engel, zorlu zemin, düşman). Gövdenin kendi altıgenleri boş sayılır.
  return (h: Offset, prev: Offset): number | null => {
    const to = bodyAt(state, actor, h), from = bodyAt(state, actor, prev);
    let worst = 0;
    for (let i = 0; i < to.length; i++) {
      const c = single(to[i] as Offset, from[i] as Offset);
      if (c === null) return null;
      worst = Math.max(worst, c);
    }
    return worst;
  };
}

function hexCostFn(state: BattleState, actor: Combatant): (h: Offset, prev: Offset) => number | null {
  const flying = isAirborne(actor);
  const stormFly = flying && stormNow(state);
  // Second-Story Work (Thief) ve Spider Climb (Görev K9c): tırmanma ek maliyeti yok.
  const climber = climbs(actor, state);
  const slowed = auraSlows(state, actor);
  // Yakaladığını sürükleyen yarı hızla gider (her adım iki kat).
  // Kuyruk 19: Grappler feat'i (Fast Wrestler): kendi boyunda ya da küçüğü sürüklemek ek maliyet istemez.
  const SZ = ['T', 'S', 'M', 'L', 'H', 'G'];
  const sizeRank = (x: string) => SZ.indexOf(x);
  const wrestler = !!actor.traits?.includes('grappler') && !!globalRule(state, 'featuresK19');
  // Kuyruk 19 (Bugbear Abduct): yakaladığını taşımak ek hareket istemez.
  const dragging = !actor.traits?.includes('abduct') && Object.values(state.combatants).some((c) => c.grapple?.by === actor.id && !(wrestler && sizeRank(c.size) <= sizeRank(actor.size)));
  const enemyAt = new Map<string, Combatant>();
  for (const c of Object.values(state.combatants)) {
    // Dokunulamaz çağrının (ruh sürüsü, Flaming Sphere) içinden geçilir (Görev B2).
    if (c.pos !== null && c.side !== actor.side && isTargetable(c) && !isIntangible(c)) enemyAt.set(hexKey(c.pos), c);
  }
  // Görev B2: büyü alanları (zorlu arazi, Plant Growth, rüzgâr duvarı); zemin maliyetiyle birikmez, büyüğü geçer.
  const zoneCost = zoneMoveCost(state, actor);
  // Görev A2: engelden geçen (Incorporeal Movement, `phase` etkisi) duvar/engel ve yaratık altıgenlerinden geçer.
  // Kuyruk 19: Interposing Hand altıgeni düşmana zorlu arazi.
  const handsOut = Object.values(state.combatants).some((c) => c.effects?.some((e) => e.interpose));
  const phase = phaseOf(actor);
  const through = phase?.difficult ? 2 : 1;
  const allyAt = new Set<string>();
  if (phase?.difficult) for (const c of Object.values(state.combatants)) if (c.pos !== null && c.id !== actor.id && c.side === actor.side && isTargetable(c)) allyAt.add(hexKey(c.pos));
  // Görev A4: tasma: merkezden yarıçap dışına uzaklaşan adım yok.
  const leash = leashOf(state, actor);
  // Kuyruk 21 D2b: çalışan yürüyen merdivende yokuş yukarı kenar yol bulmada geçilmez (yapay zekâ uzun yolu seçer).
  const uphill = conveyorBlocks(state, actor, flying);
  // Kuyruk 20 A2: Prone yaratık yalnızca sürünür (SRD 5.2.1 Crawling: her ft için 1 ek ft); kural sürümü 2.
  const crawling = !flying && actor.conditions.includes('Prone') && srdConditions(state);
  // Kuyruk 24d: çok derin su (kıyıdan eşikten uzak) yalnızca yüzücü, suda yürüyen ve uçan için (Game Master mekaniği).
  const tooDeep = deepWaterBlocks(state, actor);
  const walker = waterWalks(state, actor);
  const freeMove = !!actor.effects?.some((e) => e.freeMove || e.burrow);
  // Kuyruk K54b: Mevzi İşareti / Yol aç / Kuşbakışı Plan: korunan altıgende zor zemin yok.
  const ward = groundWardFn(state, actor);
  // Kuyruk 19 (SRD Ice Walk): buz ve kar zemini zorlu arazi değil.
  const iceWalk = !!actor.effects?.some((e) => e.iceWalker);
  // Kuyruk 26: yükseklik katmanı (yalnızca katmanlı haritada): çıkış maliyeti, 2+ seviye uçurum/duvar yürünmez.
  const hstep = heightStepFn(state, flying || climber);
  // Kuyruk 19: Control Water girdabındaki yaratık (Athletics ile kaçmadıysa) merkezden uzaklaşamaz.
  const vortex = vortexBlocks(state, actor);
  // Kuyruk S2 (sürüm 41): Gaseous Form yaratık altıgeninden geçer ve kapı aralığından süzülür; Levitate'li yaratık
  // yalnız bitişik duvara/engele tutunarak (tırmanır gibi, iki kat) yer değiştirir.
  const s2 = ruleVersion(state) >= 41;
  const gas = s2 && !!actor.effects?.some((e) => e.shareSpace);
  const squeeze = s2 && !!actor.effects?.some((e) => e.squeeze);
  const grip = s2 && !!actor.effects?.some((e) => e.levitate) && flySpeed(actor) <= 0;
  const size0 = sizeOf(state);
  const wallNear = (h: Offset) => neighbors(h, size0).some((n) => terrainAt(state, n).movement === 'blocked');
  const doorAt = (h: Offset) => (state.map?.objects ?? []).some((o) => (o.kind === 'door' || o.kind === 'gate') && o.state !== 'open' && sameHex(o.at, h));
  const sphere = s2 ? sphereLimit(state, actor) : null;
  return (h: Offset, prev: Offset): number | null => {
    if (grip && !wallNear(prev)) return null;
    const sph = sphere ? sphere(h, prev) : 'ok';
    if (sph === 'block') return null;
    if (sph === 'jump') return 1;
    if (leashBlocks(leash, h, prev)) return null;
    if (vortex && vortex(h, prev)) return null;
    const lift = hstep ? hstep(h, prev) : 0;
    if (lift === null) return null;
    if (tooDeep(h)) return null;
    if (uphill(h, prev)) return null;
    const t0 = terrainAt(state, h);
    // Kuyruk 19: Water Walk: sıvı zemin normal zemin gibi.
    // Kuyruk 19: Freedom of Movement: zorlu arazi etkilemez.
    const free = freeMove || (!!ward && ward(h));
    const t = (walker && isLiquidTile(t0)) || ((free || (iceWalk && (t0.char === 'i' || t0.char === 'q'))) && t0.movement === 'difficult') ? { ...t0, movement: 'normal' as const, ...(walker && isLiquidTile(t0) ? { rule: undefined } : {}) } : t0;
    const wall = (!!phase && t.movement === 'blocked' && !t.outOfBounds && !t.flyersPass && enterCost(t, flying) === null) || (squeeze && doorAt(h));
    const terrain = wall ? through : enterCost(t, flying);
    const base0 = terrain === null || flying || wall || (walker && isLiquidTile(t0)) ? terrain : mapEnterCost(state, prev, h, terrain, climber || !!hstep);
    const base = base0 === null ? null : base0 + lift;
    const enemy = enemyAt.get(hexKey(h));
    const zc0 = handsOut ? (((z) => (z === null ? null : Math.max(z, interposeCost(state, actor, h))))(zoneCost(h))) : zoneCost(h);
    const zc = free && zc0 !== null ? 1 : zc0;
    const ground0 = base === null || zc === null ? null : Math.max(base, zc);
    const ground = ground0 !== null && allyAt.has(hexKey(h)) ? Math.max(through, ground0) : ground0;
    // Kuyruk 19 (Halfling Nimbleness): en az bir boy büyük yaratığın altıgeninden geçer (zorlu arazi gibi).
    const nimble = !!enemy && ((!!actor.traits?.includes('halfling-nimbleness') && sizeRank(enemy.size) > sizeRank(actor.size))
      // Kuyruk 19 (Swarm, Air/Water/Fire Form): yaratık altıgenlerinden geçer; sürünün altıgeninden de herkes geçer.
      || !!actor.effects?.some((e) => e.passCreatures) || !!enemy.effects?.some((e) => e.passCreatures && e.noHeal) || gas);
    const cost = ground === null || !enemy ? ground : phase || nimble ? Math.max(through, ground) : isIncapacitated(enemy.conditions) ? Math.max(2, ground) : null;
    // Kuyruk 19 (stormRules): fırtınada uçmak iki kat hareket.
    const slow = (slowed(h) ? 2 : 1) * (dragging ? 2 : 1) * (crawling ? 2 : 1) * (stormFly ? 2 : 1);
    return cost === null ? null : cost * slow * (grip ? 2 : 1);
  };
}

/**
 * Kuyruk S2 (sürüm 41, Flaming Sphere `sphereTerrain`): küre 5 ft'ten yüksek basamağa çıkamaz ve 10 ft'ten geniş çukuru
 * (ölümcül/uçurum zemini, düz çizgide art arda altıgen) aşamaz; daha dar çukurun üstünden atlar ('jump'). Küre değilse null.
 */
function sphereLimit(state: BattleState, actor: Combatant): ((h: Offset, prev: Offset) => 'ok' | 'jump' | 'block') | null {
  const sp = actor.summon ? spells.find((x) => x.id === actor.summon?.spellId) : undefined;
  if (!sp || !mechanicsAt(state, sp).sphereTerrain) return null;
  const lim = s2rules.flamingSphere;
  const size = sizeOf(state);
  const pit = (h: Offset) => isInside(h, size) && (terrainAt(state, h).movement === 'deadly' || !!terrainAt(state, h).flyersPass);
  const lvl = levelFeet(state);
  return (h, prev) => {
    if ((heightAt(state, h) - heightAt(state, prev)) * lvl > lim.maxClimbFt) return 'block';
    if (!pit(h)) return 'ok';
    const a = offsetToAxial(prev); const b = offsetToAxial(h);
    const d = { q: b.q - a.q, r: b.r - a.r };
    let run = 1;
    for (let k = 1, x = prev; k < 6 && pit(x); k++) { run++; const ax = offsetToAxial(x); x = axialToOffset({ q: ax.q - d.q, r: ax.r - d.r }); }
    for (let k = 1, x = axialToOffset({ q: b.q + d.q, r: b.r + d.r }); k < 6 && pit(x); k++) { run++; const ax = offsetToAxial(x); x = axialToOffset({ q: ax.q + d.q, r: ax.r + d.r }); }
    return run * 5 <= lim.maxGapFt ? 'jump' : 'block';
  };
}

export function executeMove(state: BattleState, actor: Combatant, to: Offset, rng: Rng): CommandResult {
  const from = checkMover(state, actor, to);
  if ('ok' in from) return from;
  const size = sizeOf(state);
  if (sameHex(from, to)) return fail('Zaten bu altıgende.');
  const flying = isAirborne(actor);
  // Görev A6: çok altıgenli yaratıkta gövdenin bütün altıgenleri (tek altıgenlide yalnızca hedef).
  for (const h of bodyAt(state, actor, to)) {
    if (!isInside(h, size)) return fail('Harita dışına çıkılamaz.');
    const target = terrainAt(state, h);
    if (target.movement === 'deadly' && !flying) return fail(`${hexLabel(h)} lav: gönüllü olarak girilemez.`);
    // Kuyruk S2 (sürüm 41, Gaseous Form): kapı aralığında ve başka yaratığın altıgeninde durabilir.
    const s2gas = ruleVersion(state) >= 41 && actor.effects?.some((e) => e.shareSpace);
    const doorGap = ruleVersion(state) >= 41 && actor.effects?.some((e) => e.squeeze) && (state.map?.objects ?? []).some((o) => (o.kind === 'door' || o.kind === 'gate') && o.state !== 'open' && sameHex(o.at, h));
    if (target.movement === 'blocked' && !doorGap) return fail(`${hexLabel(h)} geçilmez (${target.name}).`);
    const other = occupantAt(state, h, actor.id);
    if (other && !s2gas) return fail(`${hexLabel(h)} dolu (${other.name}).`);
  }

  const cost = moveCostFn(state, actor);
  const remaining = speedHexes(actor) - actor.movementUsed;
  // Önce tehlikeli altıgenlerden (alev, batak, buz, bilinen tuzak) geçmeyen yol; yoksa en ucuzu.
  const risky = (h: Offset) => !sameHex(h, to) && isRiskyHex(state, h);
  const safe = (h: Offset, prev: Offset) => (risky(h) ? null : cost(h, prev));
  const path = findPath(from, to, size, safe, remaining) ?? findPath(from, to, size, cost, remaining);
  if (!path) {
    // Kuyruk 21 D2b: bitişik yokuş yukarı yürüyen merdiven basamağına adım: adım atılır, bir altıgen geri kayılır.
    if (!flying && distance(from, to) === 1 && isUphillStep(state, from, to)) {
      const step = enterCost(terrainAt(state, to), false) ?? 1;
      if (step > remaining) return fail(`Hareket yetmiyor: ${step} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
      const moved: BattleEvent = { type: 'moved', actorId: actor.id, path: [to], cost: step };
      return finish(state, [moved, ...conveyorSlideEvents(applyEvents(state, [moved]), actor.id, to, from)]);
    }
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
    // Kuyruk P9 (sürüm 38): fırsat saldırısı hızı 0'a düşürdüyse (ek paket `hizSifir`, yakalama) yürüyüş durur.
    if (opportunity.length && ruleVersion(current) >= 38 && speedHexes(current.combatants[actor.id] as Combatant) === 0) break;
    spent += cost(step, prev) ?? 0;
    walked += 1;
    current = withPos(current, actor.id, step);
    const me = current.combatants[actor.id] as Combatant;
    const entered = bodyEnterEvents(current, me, prev, step, rng);
    effects.push(...entered.events);
    current = applyEvents(current, entered.events);
    const aura = down() ? [] : auraStepEvents(current, actor.id, prev, step, rng);
    effects.push(...aura);
    current = applyEvents(current, aura);
    // Görev B2: büyü alanları (girince, içinde yürüdükçe, yürüyen alan yaklaşınca).
    const zoned = down() ? [] : zoneStepEvents(current, actor.id, prev, step, rng);
    effects.push(...zoned);
    current = applyEvents(current, zoned);
    // Kuyruk 19 (srdK19): Fire Form (girdiği yaratık altıgenine turda bir 1d10 ateş), Water Susceptibility (suda her 5 ft 1d6 soğuk).
    const formed = down() ? [] : monsterStepEvents(current, actor.id, step, rng);
    effects.push(...formed);
    current = applyEvents(current, formed);
    // Kuyruk P10 (sürüm 39): adım sonrası kancaları (ek paket `dusmanYaklasti`); hızı 0 olursa yürüyüş durur.
    const stepped = down() || ruleVersion(current) < 39 ? [] : afterStepEvents(current, actor.id, prev, rng);
    effects.push(...stepped);
    current = applyEvents(current, stepped);
    prev = step;
    if (entered.stop || down()) break;
    if (stepped.length && speedHexes(current.combatants[actor.id] as Combatant) === 0) break;
  }
  // Görev A2: geçen yaratığın yürüyüşü yarıda kesilirse (fırsat saldırısı, tuzak) engel ya da dolu altıgende kalmaz:
  // geçtiği son boş ve geçilebilir altıgene (ya da başladığı yere) döner.
  if (phaseOf(actor) && walked > 0 && walked < path.path.length) {
    const okEnd = (h: Offset) => terrainAt(state, h).movement !== 'blocked' && !occupantAt(current, h, actor.id);
    while (walked > 0 && !okEnd(path.path[walked - 1] as Offset)) walked--;
    spent = path.path.slice(0, walked).reduce((n, h, i) => n + (cost(h, i ? path.path[i - 1] as Offset : from) ?? 0), 0);
  }
  const moved: BattleEvent[] = walked > 0 ? [{ type: 'moved', actorId: actor.id, path: path.path.slice(0, walked), cost: spent }] : [];
  return finish(state, [...moved, ...effects]);
}

/**
 * Kuyruk 43: girilen altıgenin harita kuralları. Çok altıgenli gövdede (bayrak açık) çapanın yanında gövdenin bu adımda
 * yeni girdiği altıgenler de sayılır; aynı zemin harfi bir adımda bir kez (lav iki altıgenden iki kez yakmaz).
 */
export function bodyEnterEvents(state: BattleState, me: Combatant, prev: Offset, step: Offset, rng: Rng): { events: BattleEvent[]; stop: boolean } {
  const first = enterHexEvents(state, me, step, rng);
  if (!isMultiHex(state, me)) return first;
  const before = bodyAt(state, me, prev);
  const fresh = bodyAt(state, me, step).filter((h) => !sameHex(h, step) && !before.some((b) => sameHex(b, h)));
  const letter = (h: Offset) => state.map?.tiles[h.row]?.[h.col] ?? '#';
  const seen = new Set([letter(step)]);
  const events = [...first.events];
  let stop = first.stop;
  let current = applyEvents(state, first.events);
  for (const h of fresh) {
    if (stop || (current.combatants[me.id]?.hp ?? 0) <= 0 || seen.has(letter(h))) continue;
    seen.add(letter(h));
    const more = enterHexEvents(current, current.combatants[me.id] as Combatant, h, rng);
    events.push(...more.events);
    current = applyEvents(current, more.events);
    stop = more.stop;
  }
  return { events, stop };
}

/** Kuyruk 21 D2b: atlayışın iniş altıgeni çalışan yürüyen merdivense iniş akış yönünde kayar (uçan muaf). */
function landingSlide(state: BattleState, actor: Combatant, jumped: BattleEvent): BattleEvent[] {
  if (jumped.type !== 'jumped' || isAirborne(actor) || conveyorFlow(state) === null) return [];
  if (state.map?.tiles[jumped.to.row]?.[jumped.to.col] !== 'Y') return [];
  return conveyorSlideEvents(applyEvents(state, [jumped]), actor.id, jumped.to, null);
}

/** Jump büyüsünün tur kaydı anahtarı ve hareket maliyeti (10 ft = 2 altıgen; SRD 5.2.1 s. 143). */
const SPELL_JUMP = 'spell:jump';
const SPELL_JUMP_COST = 2;

/** Uzun atlama menzili (ft): koşarak STR skoru kadar, koşusuz yarısı (aşağı yuvarlanır). */
export function jumpRangeFeet(c: Combatant, running: boolean, state?: Pick<BattleState, 'map' | 'kuralSurumu'>): number {
  // Kuyruk 19 (featuresK19): Thief'in Second-Story Work'ü (Jumper): atlama mesafesi DEX skoruyla da.
  const score = state && c.traits?.includes('second-story-work') && globalRule(state, 'featuresK19') ? Math.max(c.strScore, c.dexScore ?? 0) : c.strScore;
  return running ? score : Math.floor(score / 2);
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
  // Görev A4: tasma: atlayarak da uzaklaşılmaz.
  if (leashBlocks(leashOf(state, actor), to, from)) return fail('Tasma: bağlı olduğu yaratıktan daha uzağa gidemez.');
  if (lavaOver(state, from, to).length > 0) return executeIslandJump(state, actor, from, to, rng);
  const dir = directionTo(from, to);
  if (dir === null) return fail('Atlama düz bir doğrultuda olmalı.');
  const step = AXIAL_DIRECTIONS[dir] as { q: number; r: number };
  const start = offsetToAxial(from);
  const gap = distance(from, to) - 1;
  // Görev K9c: Jump büyüsü (turda bir) 30 ft zıplatır, 10 ft (2 altıgen) harcatır, aradaki tek engel altıgeninin üstünden geçer.
  const spellFt = usedThisTurn(state, actor, SPELL_JUMP) ? 0 : spellJumpFt(actor);
  // Kuyruk A8 (sürüm 37): SRD Jump "up to 30 feet" dikey de geçerli: yükseklik katmanı ve `heightMove` açıkken
  // komşu yüksek altıgene (seviye × levelFt ≤ 30 ft) Atletizmsiz, 10 ft harcatarak zıplanır. Katmansız haritada eski kural.
  const up = gap === 0 && ruleVersion(state) >= 37 && spellFt > 0 && heightMoveRule(state) ? Math.max(0, heightDelta(state, from, to)) * levelFeet(state) : 0;
  if (up > 0 && up <= spellFt && !isAirborne(actor)) {
    const landing0 = terrainAt(state, to);
    if (landing0.movement === 'blocked' || landing0.movement === 'deadly') return fail(`${hexLabel(to)} üzerine inilemez (${landing0.name}).`);
    const other0 = occupantAt(state, to, actor.id);
    if (other0) return fail(`${hexLabel(to)} dolu (${other0.name}).`);
    if (SPELL_JUMP_COST > speedHexes(actor) - actor.movementUsed) return fail('Hareket yetmiyor.');
    const jumped: BattleEvent = { type: 'jumped', actorId: actor.id, from, to, gap, cost: SPELL_JUMP_COST, running: false, traitTurns: { [SPELL_JUMP]: turnKey(state) } };
    return finish(state, [jumped, ...landingSlide(state, actor, jumped)]);
  }
  if (gap === 0) return fail('Komşu altıgene atlanmaz, yürüyerek geçilir.');
  let blocked = 0;
  // Kuyruk 21 D2b: çalışan yürüyen merdivenin üstünden yokuş yukarı atlanmaz (yukarı ilerleme yalnızca kolla).
  const flow = isAirborne(actor) ? null : conveyorFlow(state);
  for (let i = 1; i <= gap + 1; i++) {
    const h = axialToOffset({ q: start.q + step.q * i, r: start.r + step.r * i });
    const p = axialToOffset({ q: start.q + step.q * (i - 1), r: start.r + step.r * (i - 1) });
    if (flow !== null && isUphillStep(state, p, h, flow)) return fail(`${hexLabel(h)}: yürüyen merdivenden yukarı atlanmaz.`);
  }
  for (let i = 1; i <= gap; i++) {
    const h = axialToOffset({ q: start.q + step.q * i, r: start.r + step.r * i });
    const t = terrainAt(state, h);
    if (t.movement === 'blocked') {
      blocked++;
      if (spellFt <= 0 || blocked > 1) return fail(`Aradaki ${hexLabel(h)} üstünden atlanamaz (${t.name}).`);
    }
  }
  const landing = terrainAt(state, to);
  if (landing.movement === 'deadly') return fail(`İniş altıgeni ${hexLabel(to)} lav: atlama reddedildi.`);
  if (landing.movement === 'blocked') return fail(`${hexLabel(to)} üzerine inilemez (${landing.name}).`);
  const other = occupantAt(state, to, actor.id);
  if (other) return fail(`${hexLabel(to)} dolu (${other.name}).`);

  const running = actor.run !== null && actor.run.dir === dir && actor.run.hexes >= 2;
  // Kuyruk 19: Step of the Wind bu tur atlama mesafesini iki katına çıkarır.
  const range = jumpRangeFeet(actor, running, state) * (usedThisTurn(state, actor, 'step-of-the-wind') ? 2 : 1);
  const width = gap * 5;
  const walkCost = gap + (enterCost(landing, isAirborne(actor)) ?? 1);
  const remaining = speedHexes(actor) - actor.movementUsed;
  // Büyü yalnızca gerekince ya da daha ucuzsa harcanır (engel, menzil ya da maliyet).
  const plain = blocked === 0 && width <= range;
  const useSpell = spellFt > 0 && width <= spellFt && (!plain || SPELL_JUMP_COST < walkCost);
  if (!plain && !useSpell) {
    return fail(
      `Menzil yetmiyor: kanal ${gap} altıgen (${width} ft), atlama menzili ${Math.max(range, spellFt)} ft (${running ? 'koşarak' : 'koşusuz'}).`,
    );
  }
  const cost = useSpell ? SPELL_JUMP_COST : walkCost;
  if (cost > remaining) return fail(`Hareket yetmiyor: ${cost} altıgen gerekli, ${Math.max(0, remaining)} kaldı.`);
  const jumped: BattleEvent = useSpell
    ? { type: 'jumped', actorId: actor.id, from, to, gap, cost, running, traitTurns: { [SPELL_JUMP]: turnKey(state) } }
    : { type: 'jumped', actorId: actor.id, from, to, gap, cost, running };
  return finish(state, [jumped, ...landingSlide(state, actor, jumped)]);
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
