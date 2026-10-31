/**
 * İstekleri (komutları) doğrular ve çözümler: kim neyi yapabilir, zarlar, kurallar.
 * Sonuç olarak olaylar üretir. Bu kod "yetkili" tarafta (GM'in cihazı veya sunucu) çalışır.
 */
import { dragEvents, executeEscapeGrapple, executeStandUp, grappleCleanup, needsStand, standUpEvents } from './grapple';
import { dotEvents, executeDodge, executeHelp, timerEvents } from './durations';
import { MOVE_ONLY_COMMANDS, speedZero, type Height } from '../rules/conditions';
import { rollD20, rollDie, rollTag, type Rng } from '../rules/dice';
import { civilianLook } from './civilianLooks';
import { checkActor, currentActorId, fail, finish, nextActor, winnerOf, type CommandResult } from './common';
import {
  auraStepEvents, auraTurnEndEvents, executeActionSurge, executeFollowup, executeSecondWind, opportunityAttacks,
  weaponAttackEvents,
} from './features';
import { executeMonsterAttack, executeMultiattack } from './monsters';
import { executeJump, executeMove, executePlace, executeStartBattle } from './movement';
import { executeHide, executeSearch, noticeEvents, revealEvent } from './stealth';
import { executeSkillCheck } from './checks';
import { economyCost, isReactionSpell, turnKey } from './economy';
import { MAX_EXHAUSTION, exhaustionD20Penalty } from '../rules/exhaustion';
import { cunningProblem, hasTrait, hordeProblem } from './classTraits';
import { executeMapTrigger, roundStartMapEvents, turnEndMapEvents, turnStartMapEvents } from './maprules';
import { executeAttackGate, executeEscape, executeGate, executePull } from './mapcommands';
import { executeCast, executeRepeat } from './spells';
import { spells } from '../data';
import { executeShove } from './forced';
import { dragonRoundEvents, dragonWakeAfter, executeRouse, executeWakeDragon } from './dragon';
import { executeRage, executeReckless, rageTurnEndEvents } from './rage';
import { executeUseFeature } from './divine';
import { executeBonusStrike, executeFocusAction, executeStunningStrike, metabolismEvents } from './martial';
import { executeOffhandAttack } from './offhand';
import { reactionRechargeEvents, turnStartReactions } from './reactions';
import { effectTurnEndEvents, effectTurnStartEvents } from './effects';
import { zoneTurnEvents } from './zones';
import { bondEvents, sanctuaryCheck } from './wards';
import { executeFontOfMagic } from './sorcerer';
import { blessingEvents, executeEldritchSmite } from './warlock';
import { superiorInspirationEvents } from './bard';
import { evergreenEvents, executeWildResurgence, executeWildShape, shapeCleanup } from './druid';
import { poolCreateEvents, poolSyncEvents } from './hpPool';
import { executeSetupSummon, executeSummonMove, summonCleanup } from './summons';
import { executeBreathWeapon } from './areaAttack';
import { SURFACES, surfaceEvent, surfaceReactionEvents } from './surfaces';
import { executeAttackObject, executeObjectUse, executePlaceObject, objectAreaEvents } from './objects';
import { applyEvents } from './reduce';
import { goalEvents } from './goals';
import { alarmEvents, executeAlarmGroup, formGroupsEvent } from './alarm';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

export type { CommandResult } from './common';
export { canControl, currentActorId } from './common';

/** Görev B1: saldırı ve büyü komutları (Gaseous Form'da yasak). */
const NO_ATTACK_COMMANDS: string[] = ['attack', 'offhand_attack', 'bonus_strike', 'monster_attack', 'multiattack', 'cast_spell', 'spell_followup', 'breath_weapon'];

/** Sırası gelen yaratığın tur başı olayları: Recharge zarları ve yenilenme. */
function startOfTurnEvents(c: Combatant, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (c.life === 'dying') {
    // Ölüm save'i: 20 ayağa kaldırır (1 HP), 1 iki başarısızlık, 10+ başarı, altı başarısızlık.
    // Survivor (Champion; Görev F): avantajlı, 18–20 doğal 20 sayılır.
    // Beacon of Hope (Görev B1): ölüm save'i avantajlı.
    const survivor = hasTrait(c, 'survivor');
    const rolledSave = rollD20(survivor || c.effects?.some((e) => e.deathSaveAdv) ? 'advantage' : 'normal', rollTag(rng, { kind: 'deathSave', by: c.id })).kept;
    const natural = survivor && rolledSave >= 18 ? 20 : rolledSave;
    let successes = c.deathSaves.successes;
    let failures = c.deathSaves.failures;
    let outcome: 'success' | 'failure' | 'stable' | 'dead' | 'revived';
    if (natural === 20) {
      outcome = 'revived';
    } else {
      if (natural === 1) failures += 2;
      // Bitkinlik (Görev S1): ölüm save'i de d20 Testi, −2 × seviye (doğal 20 ve 1 değişmez).
      else if (natural - exhaustionD20Penalty(c.exhaustion) >= 10) successes += 1;
      else failures += 1;
      outcome = failures >= 3 ? 'dead' : successes >= 3 ? 'stable' : natural !== 1 && natural - exhaustionD20Penalty(c.exhaustion) >= 10 ? 'success' : 'failure';
    }
    events.push({
      type: 'death_save', actorId: c.id, natural,
      successes: Math.min(3, successes), failures: Math.min(3, failures), outcome,
    });
  }
  // Heroic Rally (Survivor; Görev F): Bloodied (HP yarı ya da altı) ve ayaktaysa tur başında 5 + CON HP.
  if (hasTrait(c, 'survivor') && c.hp > 0 && c.hp <= Math.floor(c.maxHp / 2)) {
    const amount = Math.min(c.maxHp - c.hp, Math.max(0, 5 + c.modifiers.con));
    if (amount > 0) events.push({ type: 'healed', actorId: c.id, targetId: c.id, label: 'Survivor', amount, targetHpAfter: c.hp + amount });
  }
  // Recharge'lı tepkiler (Deflect Missile; Görev R1).
  events.push(...reactionRechargeEvents(c, rng));
  for (const index of c.rechargeUsed) {
    const need = c.attacks[index]?.recharge ?? 6;
    const d6 = rollDie(6, rollTag(rng, { kind: 'recharge', by: c.id }));
    events.push({ type: 'recharge_rolled', actorId: c.id, attackIndex: index, d6, recharged: d6 >= need });
  }
  if (c.regeneration > 0 && (c.hp > 0 || c.regenPending)) {
    if (c.regenBlocked) {
      events.push({ type: 'regeneration', actorId: c.id, amount: 0, blocked: true, died: c.hp <= 0, hpAfter: c.hp });
    } else {
      // Canı doluysa yenilenecek bir şey yok: olay (ve günlük satırı) üretilmez.
      const amount = Math.min(c.regeneration, c.maxHp - c.hp);
      if (amount > 0) events.push({ type: 'regeneration', actorId: c.id, amount, blocked: false, died: false, hpAfter: c.hp + amount });
    }
  }
  return events;
}

/** Komutu çözer; komutu veren gizlenmişse ve komut onu ortaya çıkarıyorsa bunu da ekler. */
export function execute(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  // Eylem ekonomisi: komut çalışmadan önce harcanabilir mi bakılır, başarılıysa harcanır
  // (olay, komutun olaylarının ardına eklenir; ikisi farklı alanları değiştirir).
  let spent: BattleEvent | null = null;
  const actor = 'actorId' in cmd && state.status === 'active' ? state.combatants[cmd.actorId] : undefined;
  if (actor && cmd.type !== 'skill_check' && cmd.type !== 'place') {
    const cost = economyCost(state, actor, cmd);
    if (!cost.ok) return cost;
    spent = cost.event;
  }
  // Görev CLERIC: Sanctuary: korunanı hedef alan saldıran önce WIS save; başarısızsa saldırı/büyü boşa gider.
  const sanct = spent ? sanctuaryCheck(state, cmd, rng) : null;
  const result = sanct?.blocked ? finish(state, sanct.events) : executeCommand(state, cmd, ctx, rng);
  if (!result.ok) return result;
  let { state: next, events } = result;
  if (sanct && !sanct.blocked) { next = applyEvents(state, [...sanct.events, ...events]); events = [...sanct.events, ...events]; }
  if (spent) {
    next = applyEvents(next, [spent]);
    events = [...events, spent];
  }
  // Uyuyan ejderha: komut onu uyandırdı mı (hasar, yanına girme, gürültü).
  const woke = dragonWakeAfter(state, next, events, cmd);
  if (woke) {
    next = applyEvents(next, [woke]);
    events = [...events, woke];
  }
  // Görev Y1: yüzey tepkimeleri (tutuşma, buhar, donma, erime, patlama, suda yıldırım, söndürme).
  const surf = surfaceReactionEvents(next, events, rng);
  if (surf.length) { next = applyEvents(next, surf); events = [...events, ...surf]; }
  // Görev S2: alanlı hasar alandaki nesnelere (fıçı, sandık, kapı…).
  const objs = objectAreaEvents(next, events, rng);
  if (objs.length) { next = applyEvents(next, objs); events = [...events, ...objs]; }
  // Yakalama: yakalayan yürüdüyse yakaladığını sürükler; sonra biten yakalamalar (yakalayan düştü, uzaklaştı).
  const dragged = dragEvents(state, next, events);
  if (dragged.length) { next = applyEvents(next, dragged); events = [...events, ...dragged]; }
  const loose = grappleCleanup(next);
  if (loose.length) { next = applyEvents(next, loose); events = [...events, ...loose]; }
  // Çağrılmış yaratıklar (Görev R3): 0 HP, konsantrasyon, sahibin ölümü ya da süre bitince kaybolur.
  const vanished = summonCleanup(next);
  if (vanished.length) { next = applyEvents(next, vanished); events = [...events, ...vanished]; }
  // Görev CLERIC: Warding Bond: bağlı hedefin aldığı hasar büyücüye (her hasar yolunda, komutun sonunda).
  const bonded = bondEvents(state, next, rng);
  if (bonded.length) { next = applyEvents(next, bonded); events = [...events, ...bonded]; }
  // Görev DRUID: Wild Shape 0 HP'de ya da Incapacitated olunca biter.
  const unshaped = shapeCleanup(next);
  if (unshaped.length) { next = applyEvents(next, unshaped); events = [...events, ...unshaped]; }
  // Görev WARLOCK: Dark One's Blessing (düşman 0 HP'ye düşünce geçici HP).
  const blessed = blessingEvents(state, next, 'actorId' in cmd ? cmd.actorId : undefined);
  if (blessed.length) { next = applyEvents(next, blessed); events = [...events, ...blessed]; }
  const reveal = revealEvent(state, next, cmd);
  if (reveal) { next = applyEvents(next, [reveal]); events = [...events, reveal]; }
  // Görev A1: ortak can havuzu üyeleri komutun sonunda havuzun HP'sine eşitlenir.
  const pooled = poolSyncEvents(next);
  if (pooled.length) { next = applyEvents(next, pooled); events = [...events, ...pooled]; }
  // Görev S4: uyuyan/habersiz grupların alarmı (hasar, gürültü, Algı; tur başında komşuya haber).
  if (next.groups?.length) {
    const alarm = alarmEvents(state, next, events, cmd, rng);
    if (alarm.length) { next = applyEvents(next, alarm); events = [...events, ...alarm]; }
  }
  // Görev S3: hedefler kilitlenir; hedef sonucu (ya da komut sonu kancalarındaki ölümler) savaşı bitirebilir.
  if (next.goals && state.status === 'active') {
    const goal = goalEvents(next);
    if (goal.length) { next = applyEvents(next, goal); events = [...events, ...goal]; }
    const winner = next.status === 'active' ? winnerOf(next) : null;
    if (winner) { const done: BattleEvent = { type: 'battle_finished', winner }; next = applyEvents(next, [done]); events = [...events, done]; }
  }
  return { ok: true, state: next, events };
}

function executeCommand(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  if (state.status === 'finished') return fail('Savaş bitti.');
  if (cmd.type === 'place') return executePlace(state, cmd.actorId, cmd.at, ctx);
  if (cmd.type === 'choose_civilian_art') {
    // GM kurulumda masumun görünümünü seçer; aynı görünüm birden çok masumda olabilir.
    if (!ctx.isGm) return fail('Masum görselini yalnızca GM seçer.');
    if (state.status !== 'setup') return fail('Masum görseli yalnızca kurulumda seçilir.');
    const c = state.combatants[cmd.actorId];
    if (!c?.civilian) return fail('Yalnızca masumların görseli seçilir.');
    if (!civilianLook(cmd.gorselId)) return fail(`Bilinmeyen masum görseli: ${cmd.gorselId}.`);
    return finish(state, [{ type: 'civilian_art', actorId: c.id, gorselId: cmd.gorselId }]);
  }
  if (cmd.type === 'start_battle') {
    const begun = executeStartBattle(state, ctx);
    if (!begun.ok) return begun;
    // Uncanny Metabolism (Görev P-Monk): inisiyatif atılınca, Focus eksikse ya da yaralıysa.
    // Görev BARD: Superior Inspiration (inisiyatifte Bardic Inspiration en az 2).
    const meta = Object.values(begun.state.combatants).flatMap((c) => [...metabolismEvents(c, rng), ...superiorInspirationEvents(c), ...evergreenEvents(c)]);
    // Görev S4: grup alanındaki düşmanlar grubun üyesi olur (uyuyan/habersiz).
    const formed = formGroupsEvent(begun.state);
    if (formed) meta.push(formed);
    const started = meta.length > 0 ? { ok: true as const, state: applyEvents(begun.state, meta), events: [...begun.events, ...meta] } : begun;
    // Sıra bir masumla (ya da uyuyan/habersiz grup üyesiyle, Görev S4) başlıyorsa turu hemen atlanır.
    const first = started.state.combatants[currentActorId(started.state)];
    if (!first?.civilian && !(formed && (first?.asleep || first?.unaware))) return started;
    const skip = executeCommand(started.state, { type: 'end_turn', actorId: first.id }, ctx, rng);
    return skip.ok ? { ok: true, state: skip.state, events: [...started.events, ...skip.events] } : started;
  }
  // Ritüel çağırma (Find Familiar; Görev R3): savaştan önce, kurulumda.
  if (cmd.type === 'cast_spell' && state.status === 'setup') return executeSetupSummon(state, cmd, ctx, rng);
  if (state.status === 'setup') return fail('Savaş henüz başlamadı: önce herkes yerleşmeli ve GM başlatmalı.');

  if (cmd.type === 'set_condition') {
    if (!ctx.isGm) return fail('Yalnızca GM durum ekleyip kaldırabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    const events: BattleEvent[] = [
      { type: 'condition_changed', targetId: target.id, condition: cmd.condition, present: cmd.present, reason: 'GM' },
    ];
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (cmd.type === 'adjust_hp') {
    if (!ctx.isGm) return fail('Yalnızca GM HP ayarlayabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    if (!Number.isFinite(cmd.hp)) return fail('Geçersiz HP.');
    const hp = Math.max(0, Math.min(target.maxHp, Math.round(cmd.hp)));
    // Parti üyesi 0'a inerse ölmekte sayılır; düşman 0'da düşmüş olur.
    const life: Combatant['life'] = hp > 0 ? 'alive' : target.side === 'party' && !target.civilian && !target.summon ? 'dying' : target.life;
    const events: BattleEvent[] = [{ type: 'hp_adjusted', targetId: target.id, hpAfter: hp, life }];
    return finish(state, events);
  }

  if (cmd.type === 'set_exhaustion') {
    // Görev S1: bitkinlik (Exhaustion) kaynağı şimdilik Game Master (oyundaki büyü/özellikler ileride aynı olayla).
    if (!ctx.isGm) return fail('Yalnızca Game Master bitkinliği ayarlayabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    if (!Number.isInteger(cmd.level) || cmd.level < 0 || cmd.level > MAX_EXHAUSTION) return fail(`Bitkinlik 0–${MAX_EXHAUSTION} olmalı.`);
    if ((target.exhaustion ?? 0) === cmd.level) return fail('Bitkinlik zaten bu seviyede.');
    return finish(state, [{ type: 'exhaustion_changed', targetId: target.id, level: cmd.level, reason: 'Game Master' }]);
  }

  if (cmd.type === 'place_surface') {
    // Görev Y1: yüzey kaynağı olmayan türler (yağ birikintisi, su, zehir bulutu) için; tepkime yok, yalnızca yerleşim.
    if (!ctx.isGm) return fail('Yüzeyi yalnızca Game Master yerleştirir.');
    if (!state.map) return fail('Yüzey yalnızca haritalı savaşta.');
    const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
    const hexes = cmd.hexes.filter((h) => h.col >= 0 && h.row >= 0 && h.col < size.cols && h.row < size.rows);
    if (!hexes.length) return fail('Altıgen seçilmedi.');
    const keySet = new Set(hexes.map((h) => `${h.col},${h.row}`));
    const events: BattleEvent[] = [];
    for (const z of state.map.zones ?? []) {
      if (!z.surface || !z.hexes.some((h) => keySet.has(`${h.col},${h.row}`))) continue;
      const left = z.hexes.filter((h) => !keySet.has(`${h.col},${h.row}`));
      events.push(left.length ? { type: 'zone_moved', zoneId: z.id, hexes: left } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'replaced' });
    }
    if (cmd.kind) {
      if (!SURFACES[cmd.kind]) return fail(`Bilinmeyen yüzey: ${cmd.kind}`);
      events.push(surfaceEvent(applyEvents(state, events), cmd.kind, hexes, 'gm', 'enemies'));
    }
    if (!events.length) return fail('Kaldırılacak yüzey yok.');
    return finish(state, events);
  }
  // Görev S2: Game Master nesne yerleştirir/kaldırır.
  if (cmd.type === 'place_object') return executePlaceObject(state, cmd, ctx.isGm);
  if (cmd.type === 'create_hp_pool') {
    if (!ctx.isGm) return fail('Can havuzunu yalnızca Game Master kurar.');
    const r = poolCreateEvents(state, cmd);
    return r.ok ? finish(state, r.events) : fail(r.error);
  }

  if (cmd.type === 'skill_check') return executeSkillCheck(state, cmd.actorId, cmd.skill, cmd.dc, ctx.isGm, rng);
  if (cmd.type === 'map_trigger') return executeMapTrigger(state, cmd.rule, cmd.at, ctx.isGm, rng);
  if (cmd.type === 'gate') return executeGate(state, cmd.at, cmd.open, ctx.isGm);
  if (cmd.type === 'wake_dragon') return executeWakeDragon(state, ctx);
  if (cmd.type === 'alarm_group') return executeAlarmGroup(state, cmd.groupId, ctx, rng);

  // Tepki büyüleri (Shield, Counterspell, Hellish Rebuke) başkasının turunda da yapılır.
  const outOfTurn = cmd.type === 'cast_spell' && isReactionSpell(cmd.spellName);
  const checked = checkActor(state, cmd.actorId, ctx, cmd.type !== 'end_turn' && cmd.type !== 'rouse_dragon', outOfTurn,
    MOVE_ONLY_COMMANDS.includes(cmd.type));
  if (!checked.ok) return checked;
  const actor = checked.actor;
  if (actor.asleep && cmd.type !== 'end_turn') return fail(`${actor.name} uyuyor: turunu atlar.`);
  if (actor.unaware && cmd.type !== 'end_turn') return fail(`${actor.name} habersiz: alarm verilene dek turunu atlar.`);
  // Masumlar hiçbir eylem yapmaz: yerinde durur, sırası atlanır (hasar alabilir).
  if (actor.civilian && cmd.type !== 'end_turn') return fail(`${actor.name} masum: eylem yapmaz, sırası atlanır.`);
  if (cmd.type === 'rouse_dragon') return executeRouse(state, actor, rng);
  // Rage: büyü yapılamaz ve konsantrasyon sürdürülemez (SRD 5.2.1).
  if ((cmd.type === 'cast_spell' || cmd.type === 'spell_followup') && actor.rage) return fail('Rage sürerken büyü yapılamaz.');
  // Görev B1: Gaseous Form: saldıramaz ve büyü yapamaz.
  const gas = actor.effects?.find((e) => e.noAttack);
  if (gas && NO_ATTACK_COMMANDS.includes(cmd.type)) return fail(`${gas.name} sürerken saldırı ve büyü yapılamaz.`);
  const events: BattleEvent[] = [];

  if (cmd.type === 'end_turn') {
    let current = state;
    let from = actor.id;
    // Tur sonu harita etkileri (sıcak, soğuk, alevde bitirme) sırası biten için.
    const ending = turnEndMapEvents(current, actor, rng);
    events.push(...ending);
    current = applyEvents(current, ending);
    // Turunu düşman yayılımında (Spirit Guardians) bitiren save yapar.
    const aura = auraTurnEndEvents(current, current.combatants[actor.id] as Combatant, rng);
    events.push(...aura);
    current = applyEvents(current, aura);
    // Rage: bu tur uzatılmadıysa biter.
    const rageEnd = rageTurnEndEvents(current.combatants[actor.id] as Combatant);
    events.push(...rageEnd);
    current = applyEvents(current, rageEnd);
    // Süreli durumlar: sırası biten savaşçının tur sonu sayaçları ("sonuna dek", "save ends").
    const timedEnd = timerEvents(current, actor.id, 'turnEnd', rng);
    events.push(...timedEnd);
    current = applyEvents(current, timedEnd);
    // Süren etkilerin tur sonu (Görev B1): gecikmeli hasar (Acid Arrow), tekrar save (Slow, Ray of Enfeeblement).
    const fxEnd = effectTurnEndEvents(current, actor.id, rng);
    events.push(...fxEnd);
    current = applyEvents(current, fxEnd);
    // Büyü alanlarında tur bitirmek (Görev B2: Grease, Moonbeam, Flaming Sphere, ruh sürüsü).
    const zoneEnd = zoneTurnEvents(current, actor.id, 'end', rng);
    events.push(...zoneEnd);
    current = applyEvents(current, zoneEnd);
    for (let guard = 0; guard < state.order.length; guard++) {
      const next = nextActor(current);
      const turnEnded: BattleEvent = { type: 'turn_ended', actorId: from, nextActorId: next.id, round: next.round };
      events.push(turnEnded);
      const roundBefore = current.round;
      current = applyEvents(current, [turnEnded]);
      if (current.round > roundBefore) {
        // Tur sonu: uyuyan ejderhanın Algı zarları (menzildeki gizlenmemiş karakterler).
        const watch = dragonRoundEvents(current, rng);
        events.push(...watch);
        current = applyEvents(current, watch);
        const rising = roundStartMapEvents(current);
        events.push(...rising);
        current = applyEvents(current, rising);
      }
      const nextCombatant = current.combatants[next.id];
      if (!nextCombatant) break;
      const start = startOfTurnEvents(nextCombatant, rng);
      events.push(...start);
      current = applyEvents(current, start);
      // Bitişikteki gizli düşmanları fark eder (Görev K).
      const noticed = noticeEvents(current, current.combatants[next.id] as Combatant);
      events.push(...noticed);
      current = applyEvents(current, noticed);
      const startMap = turnStartMapEvents(current, current.combatants[next.id] as Combatant, rng);
      events.push(...startMap);
      current = applyEvents(current, startMap);
      // Tur başlatana düşman tepkisi (Unnerving Gaze; Görev R1).
      const gaze = turnStartReactions(current, next.id, rng);
      events.push(...gaze);
      current = applyEvents(current, gaze);
      // Süreli durumlar: sırası gelen savaşçının tur başı sayaçları ("başına dek", Kaçın, Yardım).
      const timedStart = timerEvents(current, next.id, 'turnStart', rng);
      events.push(...timedStart);
      current = applyEvents(current, timedStart);
      // Süren durum hasarı (zehir, cehennem yarası): sırası gelenin tur başında.
      const dot = dotEvents(current, next.id, rng);
      events.push(...dot);
      current = applyEvents(current, dot);
      // Süren etkiler (Görev R2): geçici HP (Heroism), süregelen hasar ve save (Searing Smite), Command.
      // Büyü alanında tur başlatmak (Görev B2: Web, Sleet Storm, Stinking Cloud).
      const zoneStart = zoneTurnEvents(current, next.id, 'start', rng);
      events.push(...zoneStart);
      current = applyEvents(current, zoneStart);
      const fx = effectTurnStartEvents(current, next.id, rng);
      events.push(...fx.events);
      current = applyEvents(current, fx.events);
      const after = current.combatants[next.id];
      // Yenilenemeyip ölen, uyuyan yaratığın, masumun ve Command'la turunu kaybedenin turu atlanır (masum tur başı
      // etkilerini yine alır).
      if (after && (after.hp > 0 || after.regenPending) && !after.asleep && !after.unaware && !after.civilian && !fx.skip) break;
      // Atlanan turun sonu da sayılır: sahibinin turuna bağlı süreler takılı kalmaz.
      const skippedEnd = [...timerEvents(current, next.id, 'turnEnd', rng)];
      skippedEnd.push(...effectTurnEndEvents(applyEvents(current, skippedEnd), next.id, rng));
      events.push(...skippedEnd);
      current = applyEvents(current, skippedEnd);
      from = next.id;
    }
    return finish(state, events);
  }

  if (cmd.type === 'monster_attack') return executeMonsterAttack(state, actor, cmd.targetId, cmd.attackIndex, rng, cmd.targetHex);
  if (cmd.type === 'multiattack') return executeMultiattack(state, actor, cmd.targetId, rng);

  if (cmd.type === 'stabilize') {
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Hedef bulunamadı.');
    if (target.id === actor.id) return fail('Kendini stabilize edemezsin.');
    if (target.life !== 'dying') return fail('Hedef ölmekte değil.');
    const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.modifiers.wis }));
    const success = roll.kept === 20 || (roll.kept !== 1 && roll.kept + actor.modifiers.wis >= 10);
    events.push({ type: 'stabilized', actorId: actor.id, targetId: target.id, natural: roll.kept, success });
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (cmd.type === 'cast_spell') return executeCast(state, actor, cmd, rng);
  if (cmd.type === 'action_surge') return executeActionSurge(state, actor);
  if (cmd.type === 'shove') return executeShove(state, actor, cmd.targetId, cmd.effect, rng);
  if (cmd.type === 'second_wind') return executeSecondWind(state, actor, rng);
  if (cmd.type === 'rage') return executeRage(state, actor);
  if (cmd.type === 'reckless') return executeReckless(state, actor);
  if (cmd.type === 'use_feature') return executeUseFeature(state, actor, cmd, rng);
  // Görev SORCERER: Font of Magic.
  if (cmd.type === 'font_of_magic') return executeFontOfMagic(state, actor, cmd.mode, cmd.level);
  if (cmd.type === 'focus_action') return executeFocusAction(state, actor, cmd.action);
  if (cmd.type === 'stunning_strike') return executeStunningStrike(state, actor, cmd.targetId, rng);
  if (cmd.type === 'eldritch_smite') return executeEldritchSmite(state, actor, rng);
  if (cmd.type === 'bonus_strike') return executeBonusStrike(state, actor, cmd.targetId, cmd.technique, rng);
  if (cmd.type === 'spell_followup') {
    // Görev B1: süreli tekrar (Heat Metal, Call Lightning, Vampiric Touch, Gust of Wind).
    if (spells.find((x) => x.name === actor.concentration?.spell)?.mechanics.repeat) return executeRepeat(state, actor, cmd.targetId, rng);
    return executeFollowup(state, actor, cmd.targetId, rng);
  }

  // Yerdeyken yürüme/atlama: önce otomatik ayağa kalkar (hızın yarısı).
  if (needsStand(actor, cmd)) {
    const stood = standUpEvents(actor);
    if (typeof stood === 'string') return fail(stood);
    const up = applyEvents(state, stood);
    const r = executeCommand(up, cmd, ctx, rng);
    return r.ok ? { ok: true, state: r.state, events: [...stood, ...r.events] } : r;
  }
  if (cmd.type === 'move') return executeMove(state, actor, cmd.to, rng);
  if (cmd.type === 'jump') return executeJump(state, actor, cmd.to, rng);
  if (cmd.type === 'stand_up') return executeStandUp(state, actor);
  if (cmd.type === 'escape_grapple') return executeEscapeGrapple(state, actor, rng);
  if (cmd.type === 'hide') return executeHide(state, actor, rng);
  if (cmd.type === 'search') return executeSearch(state, actor, rng);
  if (cmd.type === 'pull') return executePull(state, actor, cmd.targetId, rng);
  if (cmd.type === 'escape') return executeEscape(state, actor, rng);
  if (cmd.type === 'summon_move') return executeSummonMove(state, actor, cmd.to, cmd.ramId, rng);
  if (cmd.type === 'haste_action') {
    // CILA (Haste): eylemini kullandıktan sonra turda bir ek eylem.
    if (!actor.effects?.some((e) => e.extraAction)) return fail('Haste etkisi yok.');
    if (actor.economy.hasteUsed) return fail('Haste\'in ek eylemi bu tur kullanıldı.');
    if (!actor.economy.action || actor.economy.attacksLeft > 0) return fail('Önce eylemini kullanmalısın.');
    return finish(state, [{ type: 'haste_action', actorId: actor.id }]);
  }
  if (cmd.type === 'attack_gate') return executeAttackGate(state, actor, cmd.at, cmd.option, rng);
  if (cmd.type === 'dodge') return executeDodge(state, actor);
  if (cmd.type === 'help') return executeHelp(state, actor, cmd.targetId);
  if (cmd.type === 'dash') {
    const dashed: BattleEvent[] = [{ type: 'dashed', actorId: actor.id }];
    return { ok: true, state: applyEvents(state, dashed), events: dashed };
  }
  if (cmd.type === 'disengage') {
    const done: BattleEvent[] = [{ type: 'disengaged', actorId: actor.id }];
    return { ok: true, state: applyEvents(state, done), events: done };
  }

  if (cmd.type === 'change_height') {
    if (state.map) return fail('Haritalı savaşta yükseklik altıgenden gelir.');
    if (speedZero(actor.conditions)) {
      return fail('Hareket edemiyor: hızı 0.');
    }
    const from = actor.height;
    const to: Height = cmd.toHeight;
    if (to === from) return fail('Zaten bu konumda.');
    let change: BattleEvent;
    if (to < from) {
      change = { type: 'height_changed', actorId: actor.id, from, to, moved: true, check: null };
    } else {
      const dc = 12 + 3 * (to - from - 1);
      const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: actor.climbMod }));
      const total = roll.kept + actor.climbMod;
      const success = roll.kept === 20 || (roll.kept !== 1 && total >= dc);
      change = { type: 'height_changed', actorId: actor.id, from, to, moved: success, check: { natural: roll.kept, total, dc } };
    }
    if (change.type === 'height_changed' && change.moved) {
      // Haritasız savaşta aynı yükseklikteki düşmanlar "erişimde" sayılır: ayrılmadan hemen önce
      // fırsat saldırısı; düşerse yer değiştiremez.
      const opportunity = opportunityAttacks(state, actor.id, null, rng);
      events.push(...opportunity);
      if ((applyEvents(state, opportunity).combatants[actor.id]?.hp ?? 0) <= 0) return finish(state, events);
    }
    events.push(change);
    // Yükseklik değişince yayılıma (Spirit Guardians) giren veya yayılımı getiren büyücü.
    const moved = applyEvents(state, events);
    if (moved.combatants[actor.id]?.height !== from) events.push(...auraStepEvents(moved, actor.id, null, null, rng, from));
    return finish(state, events);
  }

  if (cmd.type === 'offhand_attack') return executeOffhandAttack(state, actor, cmd.targetId, rng);
  // Görev F: Steady Aim ve Horde Breaker.
  if (cmd.type === 'steady_aim') {
    if (!hasTrait(actor, 'steady-aim')) return fail('Steady Aim yok.');
    if (actor.movementUsed > 0) return fail('Steady Aim: bu tur hareket etmemiş olmalısın.');
    return finish(state, [{ type: 'steady_aim_used', actorId: actor.id, turn: turnKey(state) }]);
  }
  if (cmd.type === 'horde_breaker') {
    const t = state.combatants[cmd.targetId];
    if (!t) return fail('Hedef bulunamadı.');
    const why = hordeProblem(state, actor, t);
    if (why) return fail(why);
    const r = weaponAttackEvents(state, actor, t, cmd.option, rng, false, false, { traitTurns: { 'horde-breaker': turnKey(state) } });
    return r.ok ? finish(state, r.events) : r;
  }
  if (cmd.type === 'breath_weapon') return executeBreathWeapon(state, actor, cmd.shape, cmd.targetHex, rng);
  // Görev S2: nesneye saldırı ve nesne kullanımı.
  if (cmd.type === 'attack_object') return executeAttackObject(state, actor, cmd.objectId, cmd.option, rng);
  if (cmd.type === 'object_use') return executeObjectUse(state, actor, cmd.objectId, cmd.action, cmd.to, rng);
  if (cmd.type === 'wild_shape') return executeWildShape(state, actor, cmd.form);
  if (cmd.type === 'wild_resurgence') return executeWildResurgence(state, actor, cmd.mode);

  // Silah saldırısı
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (cmd.type !== 'attack') return fail('Bilinmeyen komut.');
  const why = cunningProblem(actor, cmd.cunning ?? []);
  if (why) return fail(why);
  const r = weaponAttackEvents(state, actor, target, cmd.option, rng, false, false, cmd.cunning?.length ? { cunning: cmd.cunning } : {});
  if (!r.ok) return r;
  return finish(state, r.events);
}
