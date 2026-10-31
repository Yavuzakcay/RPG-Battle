/** Haritalı savaş: yerleştirme, savaşı başlatma ve yürüme. */
import { phaseOf } from './phase';
import { objectAt, withObject } from './objectData';
import { bodyAt, covers, isMultiHex } from './body';
import { leashBlocks, leashOf } from './leash';
import { getMap } from '../map/maps';
import { enterCost, terrainOf, type TerrainType } from '../map/terrain';
import { isIncapacitated, speedZero } from '../rules/conditions';
import {
  AXIAL_DIRECTIONS, axialToOffset, directionTo, distance, findPath, hexKey, isInside, offsetToAxial, sameHex,
  type Offset,
} from '../rules/hex';
import { canControl, fail, finish, isIntangible, isTargetable, type CommandResult, type Failure } from './common';
import { zoneMoveCost, zoneStepEvents } from './zones';
import { applyEvents, speedHexes } from './reduce';
import { burnEffect, enterHexEvents, isRiskyHex, mapEnterCost, ruleOf, stuckInBog } from './maprules';
import { islandOf, jumpPath, jumpRisk, lavaLine, lavaOver, rollJump } from './jumprisk';
import { auraSlows, auraStepEvents, opportunityAttacks, withPos } from './features';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';
import { climbs, isAirborne, spellJumpFt } from './flight';
import { usedThisTurn } from './classTraits';
import { turnKey } from './economy';

/** Kullanıcıya gösterilen 1 tabanlı konum metni. */
export const hexLabel = (o: Offset): string => `sütun ${o.col + 1}, satır ${o.row + 1}`;

/** Savaştaki haritanın o anki altıgeni (ızgara dışı oyun alanı dışı sayılır). */
export function terrainAt(state: BattleState, o: Offset): TerrainType {
  const t = terrainOf(state.map?.tiles[o.row]?.[o.col] ?? '#');
  // Görev S2: altıgendeki nesne etkin zemini değiştirir (hareket, örtü, görüş).
  const obj = state.map?.objects?.length ? objectAt(state, o) : undefined;
  return obj ? withObject(t, obj) : t;
}

export { speedHexes };

/** Altıgende duran başka bir savaşçı (ölüler yer kaplamaz). */
export function occupantAt(state: BattleState, at: Offset, exceptId?: string): Combatant | undefined {
  return Object.values(state.combatants).find(
    (c) => c.id !== exceptId && c.pos !== null && covers(state, c, at) && isTargetable(c),
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
function checkMover(state: BattleState, actor: Combatant, to: Offset): Offset | Failure {
  if (!state.map || !actor.pos) return fail('Bu savaşta harita yok.');
  if (actor.conditions.includes('Dazed') && (actor.economy.action || actor.economy.bonus)) {
    return fail('Dazed: bu tur eylem ya da bonus eylem yaptıktan sonra hareket edemez.');
  }
  if (speedZero(actor.conditions)) {
    return fail(`Hareket edemiyor: hızı 0 (${actor.conditions.filter((c) => ['Restrained', 'Grappled', 'Paralyzed', 'Petrified', 'Unconscious'].includes(c)).join(', ')}).`);
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
 * iner: oradaki altıgenler iki kat maliyetli. Yakaladığını sürükleyenin her adımı da iki kat.
 */
export function moveCostFn(state: BattleState, actor: Combatant): (h: Offset, prev: Offset) => number | null {
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
  // Second-Story Work (Thief) ve Spider Climb (Görev K9c): tırmanma ek maliyeti yok.
  const climber = climbs(actor);
  const slowed = auraSlows(state, actor);
  // Yakaladığını sürükleyen yarı hızla gider (her adım iki kat).
  const dragging = Object.values(state.combatants).some((c) => c.grapple?.by === actor.id);
  const enemyAt = new Map<string, Combatant>();
  for (const c of Object.values(state.combatants)) {
    // Dokunulamaz çağrının (ruh sürüsü, Flaming Sphere) içinden geçilir (Görev B2).
    if (c.pos !== null && c.side !== actor.side && isTargetable(c) && !isIntangible(c)) enemyAt.set(hexKey(c.pos), c);
  }
  // Görev B2: büyü alanları (zorlu arazi, Plant Growth, rüzgâr duvarı); zemin maliyetiyle birikmez, büyüğü geçer.
  const zoneCost = zoneMoveCost(state, actor);
  // Görev A2: engelden geçen (Incorporeal Movement, `phase` etkisi) duvar/engel ve yaratık altıgenlerinden geçer.
  const phase = phaseOf(actor);
  const through = phase?.difficult ? 2 : 1;
  const allyAt = new Set<string>();
  if (phase?.difficult) for (const c of Object.values(state.combatants)) if (c.pos !== null && c.id !== actor.id && c.side === actor.side && isTargetable(c)) allyAt.add(hexKey(c.pos));
  // Görev A4: tasma: merkezden yarıçap dışına uzaklaşan adım yok.
  const leash = leashOf(state, actor);
  return (h: Offset, prev: Offset): number | null => {
    if (leashBlocks(leash, h, prev)) return null;
    const t = terrainAt(state, h);
    const wall = !!phase && t.movement === 'blocked' && !t.outOfBounds && !t.flyersPass && enterCost(t, flying) === null;
    const terrain = wall ? through : enterCost(t, flying);
    const base = terrain === null || flying || wall ? terrain : mapEnterCost(state, prev, h, terrain, climber);
    const enemy = enemyAt.get(hexKey(h));
    const zc = zoneCost(h);
    const ground0 = base === null || zc === null ? null : Math.max(base, zc);
    const ground = ground0 !== null && allyAt.has(hexKey(h)) ? Math.max(through, ground0) : ground0;
    const cost = ground === null || !enemy ? ground : phase ? Math.max(through, ground) : isIncapacitated(enemy.conditions) ? Math.max(2, ground) : null;
    const slow = (slowed(h) ? 2 : 1) * (dragging ? 2 : 1);
    return cost === null ? null : cost * slow;
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
    if (target.movement === 'blocked') return fail(`${hexLabel(h)} geçilmez (${target.name}).`);
    const other = occupantAt(state, h, actor.id);
    if (other) return fail(`${hexLabel(h)} dolu (${other.name}).`);
  }

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
    // Görev B2: büyü alanları (girince, içinde yürüdükçe, yürüyen alan yaklaşınca).
    const zoned = down() ? [] : zoneStepEvents(current, actor.id, prev, step, rng);
    effects.push(...zoned);
    current = applyEvents(current, zoned);
    prev = step;
    if (entered.stop || down()) break;
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

/** Jump büyüsünün tur kaydı anahtarı ve hareket maliyeti (10 ft = 2 altıgen; SRD 5.2.1 s. 143). */
const SPELL_JUMP = 'spell:jump';
const SPELL_JUMP_COST = 2;

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
  // Görev A4: tasma: atlayarak da uzaklaşılmaz.
  if (leashBlocks(leashOf(state, actor), to, from)) return fail('Tasma: bağlı olduğu yaratıktan daha uzağa gidemez.');
  if (lavaOver(state, from, to).length > 0) return executeIslandJump(state, actor, from, to, rng);
  const dir = directionTo(from, to);
  if (dir === null) return fail('Atlama düz bir doğrultuda olmalı.');
  const step = AXIAL_DIRECTIONS[dir] as { q: number; r: number };
  const start = offsetToAxial(from);
  const gap = distance(from, to) - 1;
  if (gap === 0) return fail('Komşu altıgene atlanmaz, yürüyerek geçilir.');
  // Görev K9c: Jump büyüsü (turda bir) 30 ft zıplatır, 10 ft (2 altıgen) harcatır, aradaki tek engel altıgeninin üstünden geçer.
  const spellFt = usedThisTurn(state, actor, SPELL_JUMP) ? 0 : spellJumpFt(actor);
  let blocked = 0;
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
  const range = jumpRangeFeet(actor, running);
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
  if (useSpell) return finish(state, [{ type: 'jumped', actorId: actor.id, from, to, gap, cost, running, traitTurns: { [SPELL_JUMP]: turnKey(state) } }]);
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
