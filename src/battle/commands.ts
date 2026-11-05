/**
 * İstekleri (komutları) doğrular ve çözümler: kim neyi yapabilir, zarlar, kurallar.
 * Sonuç olarak olaylar üretir. Bu kod "yetkili" tarafta (GM'in cihazı veya sunucu) çalışır.
 */
import { commandEndHookEvents, turnStartHookEvents } from './turnHooks';
import { auraTriggerEvents } from './auraCore';
import { executeDismount, executeMount, riderCleanup } from './mounted';
import { brutalOptions } from './brutal';
import { executeShiftMove, featuresOn } from './shift';
import { executeInitiativeSwap } from './alert';
import { executeSteedAction } from './steed';
import { capstoneStartEvents, executeSuperiorDefense } from './capstones';
import { executeFamiliarOrder, executeFamiliarStrike, executeGaze, familiarOrdered, protectorsGiftEvents } from './chainPact';
import { executeCommandSummons } from './summons';
import { executeSphereCarry, executeSphereRoll } from './sphere';
import { executeTelekinesis, telekinesisOn, telekinesisTurnEndEvents } from './telekinesis';
import { executeWildsUse, wildsAfterEvents, wildsRoundEvents } from './wilds';
import { selfRestorationEvents } from './classTraits';
import { executeHighlandsUse, highlandsAfterEvents, highlandsRoundEvents } from './highlands';
import { desertRoundEvents } from './desert';
import { lairEvents, legendaryEvents, legendaryRefreshEvents, registerLegendaryCaster } from './boss';
import { anyTurnEndEvents, reactionTurnEndEvents, executeMonsterAbility, monsterAfterEvents, monsterTurnEvents, abilitiesOf } from './monsterAbilities';
import { concealed } from './hiddenObjects';
import { waterDecayEvents } from './waterDecay';
import { collapseFallEvents, executeClimb } from './climb';
import { dragEvents, executeEscapeGrapple, executeStandUp, grappleCleanup, needsStand, standUpEvents } from './grapple';
import { DODGE, dotEvents, executeDodge, executeHelp, timedCondition, timerEvents } from './durations';
import { MOVE_ONLY_COMMANDS, speedZero, type Height } from '../rules/conditions';
import { srdConditions } from './ruleVersion';
import { rollD20, rollDie, rollTag, type Rng } from '../rules/dice';
import { civilianLook } from './civilianLooks';
import { playerThrowObject, throwObject } from './objectMotion';
import { checkActor, currentActorId, fail, finish, nextActor, winnerOf, type CommandResult } from './common';
import {
  auraStepEvents, auraTurnEndEvents, executeActionSurge, executeFollowup, executeSecondWind, opportunityAttacks,
  weaponAttackEvents,
} from './features';
import { executeMonsterAttack, executeMultiattack } from './monsters';
import { executeJump, executeMove, executePlace, executeStartBattle } from './movement';
import { executeHide, executeSearch, noticeEvents, revealEvent } from './stealth';
import { executeDistract } from './distract';
import { executeUseItem } from './items';
import { executeSkillCheck } from './checks';
import { economyCost, isReactionSpell, turnKey } from './economy';
import { MAX_EXHAUSTION, exhaustionD20Penalty } from '../rules/exhaustion';
import { cunningProblem, hasTrait, hordeProblem } from './classTraits';
import { executeMapTrigger, roundStartMapEvents, turnEndMapEvents, turnStartMapEvents } from './maprules';
import { executeAttackGate, executeEscape, executeGate, executePull } from './mapcommands';
import { dispelEvilSpellOf, executeCast, executeDispelEvil, executeRepeat, executeStride, executeZoneShift, strideSpellOf } from './spells';
import { spells } from '../data';
import { executeGrapple, executeShove, punchAndGrabReady } from './forced';
import { dragonRoundEvents, dragonWakeAfter, executeRouse, executeWakeDragon } from './dragon';
import { executeRage, executeReckless, rageTurnEndEvents } from './rage';
import { executeUseFeature } from './divine';
import { executeBonusStrike, executeFocusAction, executeStunningStrike, metabolismEvents } from './martial';
import { executeOffhandAttack } from './offhand';
import { reactionRechargeEvents, turnStartReactions } from './reactions';
import { effectTurnEndEvents, effectTurnStartEvents } from './effects';
import { celestialTurnEndEvents, celestialTurnStartEvents } from './celestial';
import { casterTurnZoneEvents, movableZoneOf, repelPushEvents, zoneDriftEvents, zoneTurnEvents } from './zones';
import { bondEvents, sanctuaryCheck } from './wards';
import { executeFontOfMagic } from './sorcerer';
import { blessingEvents, executeEldritchSmite } from './warlock';
import { superiorInspirationEvents } from './bard';
import { evergreenEvents, executeWildResurgence, executeWildShape, shapeCleanup } from './druid';
import { poolCreateEvents, poolSyncEvents } from './hpPool';
import { executeSetupSummon, executeSummonMove, summonCleanup } from './summons';
import { executeBreathWeapon } from './areaAttack';
import { SURFACES, surfaceEvent, surfaceReactionEvents } from './surfaces';
import { globalRule } from './ruleControl';
import { executeChangeFloor } from './floors';
import { surfaceMixEvents, windDriftEvents } from './surfaceMix';

/** Kuyruk 18 H3: Tactical Master'ın seçebildiği ustalıklar. */
const TACTICAL: readonly string[] = ['push', 'sap', 'slow'];
import { executeAttackObject, executeObjectUse, executePlaceObject, objectAreaEvents } from './objects';
import { caveDiscoveryEvents, executeForestUse, forestAfterEvents, forestRoundEvents } from './forest';
import { greaseAfterEvents } from './ignite';
import { hexResolverOn, resolveCommandEffects } from './hexResolver';
import { applyEvents } from './reduce';
import { goalEvents } from './goals';
import { executeRally, moraleAfterEvents, moraleStartEvents } from './morale';
import { alarmEvents, executeAlarmGroup, formGroupsEvent, patrolEvents, patrolOf } from './alarm';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

export type { CommandResult } from './common';
export { canControl, currentActorId } from './common';

/** Görev B1: saldırı ve büyü komutları (Gaseous Form'da yasak). */
// Kuyruk 19: efsanevi büyüler (boss.ts) büyü yolunu kullanır.
registerLegendaryCaster((s, a, cmd, rng) => executeCast(s, a, cmd, rng));

const NO_ATTACK_COMMANDS: string[] = ['attack', 'offhand_attack', 'bonus_strike', 'monster_attack', 'multiattack', 'cast_spell', 'spell_followup', 'breath_weapon'];

/** Sırası gelen yaratığın tur başı olayları: Recharge zarları ve yenilenme. */
function startOfTurnEvents(c: Combatant, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (c.life === 'dying') {
    // Ölüm save'i: 20 ayağa kaldırır (1 HP), 1 iki başarısızlık, 10+ başarı, altı başarısızlık.
    // Survivor (Champion; Görev F): avantajlı, 18–20 doğal 20 sayılır.
    // Beacon of Hope (Görev B1): ölüm save'i avantajlı.
    const survivor = hasTrait(c, 'survivor');
    // Kuyruk K53 S5: aura ölüm save dezavantajı; avantajla birlikte normal.
    const dsAdv = survivor || !!c.effects?.some((e) => e.deathSaveAdv) || !!c.auraDeathAdv;
    const rolledSave = rollD20(dsAdv && c.auraDeathDis ? 'normal' : dsAdv ? 'advantage' : c.auraDeathDis ? 'disadvantage' : 'normal', rollTag(rng, { kind: 'deathSave', by: c.id })).kept;
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
  if (hexResolverOn(next)) {
    // Kuyruk K55 (sürüm 26): bütün yüzey tepkimeleri tek çözücüden (data/yuzey-etkilesimleri.json).
    const hex = resolveCommandEffects(next, events, rng).events;
    if (hex.length) { next = applyEvents(next, hex); events = [...events, ...hex]; }
  } else {
    // Görev Y1: yüzey tepkimeleri (tutuşma, buhar, donma, erime, patlama, suda yıldırım, söndürme).
    const surf = surfaceReactionEvents(next, events, rng);
    if (surf.length) { next = applyEvents(next, surf); events = [...events, ...surf]; }
    // Kuyruk 24c: ateşin değdiği gres tutuşur (Game Master mekaniği `greaseFlammable`, kural sürümü 5).
    const grease = greaseAfterEvents(next, events, rng);
    if (grease.length) { next = applyEvents(next, grease); events = [...events, ...grease]; }
    // Kuyruk 18b: yüzey × yüzey etkileşimleri (kural sürümü 15; data/yuzey-etkilesim.json).
    const mix = surfaceMixEvents(next, events, rng);
    if (mix.length) { next = applyEvents(next, mix); events = [...events, ...mix]; }
  }
  // Görev S2: alanlı hasar alandaki nesnelere (fıçı, sandık, kapı…).
  const objs = objectAreaEvents(next, events, rng);
  if (objs.length) { next = applyEvents(next, objs); events = [...events, ...objs]; }
  // Kuyruk 24: Orman mekanikleri: devrilen ağaç, çöken köprü, tutuşan çadır, dağılan kemik yığını.
  const forest = forestAfterEvents(state, next, events, rng);
  if (forest.length) { next = applyEvents(next, forest); events = [...events, ...forest]; }
  // Kuyruk 29 K28b: yıkılan kazan, eriyen buz mühür.
  const wildsAfter = wildsAfterEvents(state, next, events);
  if (wildsAfter.length) { next = applyEvents(next, wildsAfter); events = [...events, ...wildsAfter]; }
  // Görev K26: donmuş şelale, heykelin gizli nişi.
  const highAfter = highlandsAfterEvents(state, next, events);
  if (highAfter.length) { next = applyEvents(next, highAfter); events = [...events, ...highAfter]; }
  // Kuyruk 24d: mağara keşfi hane tabanlı (uçan, ışınlanan dahil).
  const found = caveDiscoveryEvents(next);
  if (found.length) { next = applyEvents(next, found); events = [...events, ...found]; }
  // Kuyruk 26: uçuruma dönen zemindeki yaratık düşer (yükseklik katmanı, düşme hasarı anahtarı).
  const sunk = collapseFallEvents(next, events, rng);
  if (sunk.length) { next = applyEvents(next, sunk); events = [...events, ...sunk]; }
  // Yakalama: yakalayan yürüdüyse yakaladığını sürükler; sonra biten yakalamalar (yakalayan düştü, uzaklaştı).
  const dragged = dragEvents(state, next, events);
  if (dragged.length) { next = applyEvents(next, dragged); events = [...events, ...dragged]; }
  // Kuyruk 19: Antilife Shell: büyücü auranın içine bir yaratık sokarsa büyü biter.
  const shell = repelPushEvents(state, next);
  if (shell.length) { next = applyEvents(next, shell); events = [...events, ...shell]; }
  const loose = grappleCleanup(next);
  if (loose.length) { next = applyEvents(next, loose); events = [...events, ...loose]; }
  // Çağrılmış yaratıklar (Görev R3): 0 HP, konsantrasyon, sahibin ölümü ya da süre bitince kaybolur.
  // Kuyruk 19 (Mounted Combat): bineği düşen binici.
  const fell = globalRule(next, 'srdK19') ? riderCleanup(next, rng) : [];
  if (fell.length) { next = applyEvents(next, fell); events = [...events, ...fell]; }
  // Kuyruk 19: ölüm patlaması, yutulanlar, Hydra başları, Misty Escape.
  const mon = monsterAfterEvents(next, rng, events);
  if (mon.length) { next = applyEvents(next, mon); events = [...events, ...mon]; }
  // Kuyruk 19 (Time Stop): büyücü başka bir yaratığı etkilerse (saldırı, save, hasar, etki) ek turlar biter.
  const ts = next.timeStop;
  if (ts && 'actorId' in cmd && cmd.actorId === ts.actorId && events.some((e) => (e.type === 'attack_resolved' || e.type === 'save_resolved' || e.type === 'effect_added' || (e.type === 'map_effect' && !!e.damage))
    && 'targetId' in e && e.targetId !== ts.actorId && !(e.type === 'effect_added' && e.effect.id.startsWith('mab:')))) {
    const end: BattleEvent[] = [{ type: 'time_stop_ended', actorId: ts.actorId }];
    next = applyEvents(next, end); events = [...events, ...end];
  }
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
  // Kuyruk K48: Moral tam modu (dost düştü, korku; 0'da çökme, ≥ 1'de çökmenin bitmesi).
  const morale = moraleAfterEvents(state, next, events);
  if (morale.length) { next = applyEvents(next, morale); events = [...events, ...morale]; }
  const reveal = revealEvent(state, next, cmd);
  if (reveal) { next = applyEvents(next, [reveal]); events = [...events, reveal]; }
  // Kuyruk K54b: kayıtlı komut sonu kancaları (imza: Ortak Şifa, Peşini Bırakmayan).
  const hookedEnd = commandEndHookEvents(state, next, events, cmd, rng, applyEvents);
  if (hookedEnd.length) { next = applyEvents(next, hookedEnd); events = [...events, ...hookedEnd]; }
  // Görev A1: ortak can havuzu üyeleri komutun sonunda havuzun HP'sine eşitlenir.
  const pooled = poolSyncEvents(next);
  if (pooled.length) { next = applyEvents(next, pooled); events = [...events, ...pooled]; }
  // Görev S4: uyuyan/habersiz grupların alarmı (hasar, gürültü, Algı; tur başında komşuya haber).
  if (next.groups?.length) {
    // Kuyruk 16 K16D: devriye rota noktasına vardıysa sıradaki nokta (yalnızca rotalı grup).
    const patrol = patrolEvents(state, next, cmd);
    if (patrol.length) { next = applyEvents(next, patrol); events = [...events, ...patrol]; }
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
  // Kuyruk K48: hedefle biten savaşta da Moral zafer ödülü (komut sonu kancası bitişten önce çalıştıysa).
  if (state.status === 'active' && next.status === 'finished' && !events.some((e) => e.type === 'moral_changed' && e.reason === 'zafer')) {
    const won = moraleAfterEvents(state, next, events);
    if (won.length) { next = applyEvents(next, won); events = [...events, ...won]; }
  }
  return { ok: true, state: next, events };
}

function executeCommand(state: BattleState, cmd: Command, ctx: CommandContext, rng: Rng): CommandResult {
  if (cmd.type === 'explore_move') return executeExploreMove(state, cmd, ctx, rng);
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
    const meta = Object.values(begun.state.combatants).flatMap((c) => ((m) => [...m, ...superiorInspirationEvents(c), ...evergreenEvents(c),
      // Kuyruk 19: Persistent Rage, Perfect Focus (savaş başı).
      ...capstoneStartEvents(c, m.length > 0)])(metabolismEvents(c, rng)));
    // Görev S4: grup alanındaki düşmanlar grubun üyesi olur (uyuyan/habersiz).
    const formed = formGroupsEvent(begun.state);
    if (formed) meta.push(formed);
    // Kuyruk 19: Gift of the Protectors: kitaptaki adlar.
    meta.push(...protectorsGiftEvents(begun.state));
    // Kuyruk K48: Moral 0 ile giren Bunalmış (ilk tur).
    meta.push(...moraleStartEvents(begun.state));
    const started = meta.length > 0 ? { ok: true as const, state: applyEvents(begun.state, meta), events: [...begun.events, ...meta] } : begun;
    // Sıra bir masumla (ya da uyuyan/habersiz grup üyesiyle, Görev S4) başlıyorsa turu hemen atlanır.
    const first = started.state.combatants[currentActorId(started.state)];
    if (!first?.civilian && !(formed && (first?.asleep || (first?.unaware && !patrolOf(started.state, first))))) return started;
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

  if (cmd.type === 'set_ai_role') {
    if (!ctx.isGm) return fail('Yalnızca Game Master yapay zekâ rolü atayabilir.');
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Savaşçı bulunamadı.');
    if (cmd.role !== null && !['hasarci', 'kontrolcu', 'destek', 'tank'].includes(cmd.role)) return fail('Bilinmeyen rol.');
    return finish(state, [{ type: 'ai_role_set', targetId: target.id, role: cmd.role }]);
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
  if (cmd.type === 'reveal_object') {
    if (!ctx.isGm) return fail('Yalnızca Game Master gizli nesneyi açığa çıkarır.');
    const ob = state.map?.objects?.find((o) => o.id === cmd.objectId);
    if (!ob || !concealed(state, ob)) return fail('Gizli nesne yok.');
    return finish(state, [{ type: 'object_changed', objectId: ob.id, found: true, label: 'Game Master gizli nesneyi açığa çıkardı.' },
      ...(ob.flag && !(state.flags ?? []).includes(ob.flag) ? [{ type: 'map_note' as const, text: 'Gizli bir şey ortaya çıktı.', flag: ob.flag }] : [])]);
  }
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
  const outOfTurn = (cmd.type === 'cast_spell' && isReactionSpell(cmd.spellName)) || cmd.type === 'initiative_swap';
  const checked = checkActor(state, cmd.actorId, ctx, cmd.type !== 'end_turn' && cmd.type !== 'rouse_dragon', outOfTurn,
    MOVE_ONLY_COMMANDS.includes(cmd.type));
  if (!checked.ok) return checked;
  const actor = checked.actor;
  if (actor.asleep && cmd.type !== 'end_turn') return fail(`${actor.name} uyuyor: turunu atlar.`);
  // Kuyruk 16 K16D: devriyedeki habersiz üye yalnızca yürür.
  if (actor.unaware && cmd.type !== 'end_turn' && !(cmd.type === 'move' && patrolOf(state, actor))) return fail(`${actor.name} habersiz: alarm verilene dek turunu atlar.`);
  // Masumlar hiçbir eylem yapmaz: yerinde durur, sırası atlanır (hasar alabilir).
  if (actor.civilian && cmd.type !== 'end_turn') return fail(`${actor.name} masum: eylem yapmaz, sırası atlanır.`);
  if (cmd.type === 'rouse_dragon') return executeRouse(state, actor, rng);
  // Rage: büyü yapılamaz ve konsantrasyon sürdürülemez (SRD 5.2.1).
  if ((cmd.type === 'cast_spell' || cmd.type === 'spell_followup') && actor.rage) return fail('Rage sürerken büyü yapılamaz.');
  // Görev B1: Gaseous Form: saldıramaz ve büyü yapamaz.
  // Kuyruk 19: Pact of the Chain familiar saldırıları vardır ama kendi turunda yalnızca Investment emriyle saldırır.
  if (actor.summon?.noAttack && actor.attacks.length && (cmd.type === 'monster_attack' || cmd.type === 'multiattack') && !familiarOrdered(actor)) return fail('Familiar saldıramaz (emir yok).');
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
    const fxEnd = [...effectTurnEndEvents(current, actor.id, rng)];
    events.push(...fxEnd);
    current = applyEvents(current, fxEnd);
    // Kuyruk K20 (ev kuralı): Celestial Kırık Kanat iner, Parlayan Ruh aurası.
    const celEnd = celestialTurnEndEvents(current, actor.id, rng);
    events.push(...celEnd);
    current = applyEvents(current, celEnd);
    // Kuyruk 19: Telekinesis: önceki turun hedefi bırakılır (havadaysa düşer).
    const tkEnd = telekinesisTurnEndEvents(current, actor.id, rng);
    events.push(...tkEnd);
    current = applyEvents(current, tkEnd);
    // K17 G2 (kural sürümü 13): Monk Self-Restoration: tur sonunda Charmed, Frightened ve Poisoned biter.
    const restored = selfRestorationEvents(current, actor.id);
    events.push(...restored);
    current = applyEvents(current, restored);
    // Büyü alanlarında tur bitirmek (Görev B2: Grease, Moonbeam, Flaming Sphere, ruh sürüsü).
    const zoneEnd = zoneTurnEvents(current, actor.id, 'end', rng);
    events.push(...zoneEnd);
    current = applyEvents(current, zoneEnd);
    // Kuyruk K53 S5: veriden auraların tur sonu tetikleri.
    const auraEnd = auraTriggerEvents(current, actor.id, 'turnEnd', rng);
    events.push(...auraEnd);
    current = applyEvents(current, auraEnd);
    // Kuyruk 19 (srdK19): canavarın tur sonu yetenekleri (Heat Aura, Mucus Cloud, akan su, Hydra başları).
    const monEnd = monsterTurnEvents(current, current.combatants[actor.id] as Combatant, 'end', rng);
    events.push(...monEnd);
    current = applyEvents(current, monEnd);
    const anyEnd = anyTurnEndEvents(current);
    events.push(...anyEnd);
    current = applyEvents(current, anyEnd);
    // Kuyruk 19 (srdK19): tur sonu canavar tepkileri (Ink Cloud, Pursuit).
    const reactEnd = reactionTurnEndEvents(current, actor.id, rng);
    events.push(...reactEnd);
    current = applyEvents(current, reactEnd);
    // Kuyruk 33: başka bir yaratığın turunun hemen ardından boss'un efsanevi eylemi (kural sürümü 11, anahtar).
    const legend = legendaryEvents(current, actor.id, rng);
    events.push(...legend);
    current = applyEvents(current, legend);
    for (let guard = 0; guard < state.order.length; guard++) {
      const next = nextActor(current);
      const turnEnded: BattleEvent = { type: 'turn_ended', actorId: from, nextActorId: next.id, round: next.round, ...(next.reflex !== undefined ? { reflex: next.reflex } : {}) };
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
        // Kuyruk 24: alarm boynuzu, çadır yangını, kemik yığınları (yalnızca kuralı olan haritalarda).
        const woods = forestRoundEvents(current, rng);
        events.push(...woods);
        current = applyEvents(current, woods);
        // Kuyruk 18b: rüzgâr bulutları sürükler.
        const drift = windDriftEvents(current);
        events.push(...drift);
        current = applyEvents(current, drift);
        // Kuyruk 29 K28b: zehirli gaz, kazan buharı, çığ.
        const wild = wildsRoundEvents(current, rng);
        events.push(...wild);
        current = applyEvents(current, wild);
        // Görev K26: soğuğa maruz kalma, çığın kendiliğinden uyarısı.
        const high = highlandsRoundEvents(current, rng);
        events.push(...high);
        current = applyEvents(current, high);
        // Kuyruk 29 K22: ani sel, kum solucanı pususu.
        const dry = desertRoundEvents(current, rng);
        events.push(...dry);
        current = applyEvents(current, dry);
        // Kuyruk 30 D2: suda gres/yağ küçülür, alev söner.
        const wet = waterDecayEvents(current);
        events.push(...wet);
        current = applyEvents(current, wet);
        // Kuyruk 33: in olayı (inisiyatif 20 = tur başı): Volkan'da boss'un lav püskürmesi.
        const lair = lairEvents(current, rng);
        events.push(...lair);
        current = applyEvents(current, lair);
      }
      const nextCombatant = current.combatants[next.id];
      if (!nextCombatant) break;
      // Kuyruk 33: boss'un turu başlarken efsanevi eylem kullanımları yenilenir.
      const refresh = legendaryRefreshEvents(current, next.id);
      events.push(...refresh);
      current = applyEvents(current, refresh);
      const start = startOfTurnEvents(nextCombatant, rng);
      events.push(...start);
      current = applyEvents(current, start);
      // Kuyruk 19 (srdK19): canavar yeteneklerinin şarjı ve tur başı yetenekleri (güneş, Barbed Hide, yutulanlar, Berserk).
      const monStart = [...abilitiesOf(current, nextCombatant).filter((a) => a.recharge !== undefined && nextCombatant.abilityRecharge?.includes(a.id)).map((a) => {
        const d6 = rollDie(6, rollTag(rng, { kind: 'recharge', by: nextCombatant.id }));
        return { type: 'ability_recharge', actorId: nextCombatant.id, abilityId: a.id, d6, recharged: d6 >= (a.recharge ?? 6) } as BattleEvent;
      }), ...monsterTurnEvents(current, current.combatants[next.id] as Combatant, 'start', rng)];
      events.push(...monStart);
      current = applyEvents(current, monStart);
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
      // Kuyruk 19: büyücünün turunun başında ondan uzaklaşan bulut (Cloudkill).
      const drift = [...zoneDriftEvents(current, next.id)];
      events.push(...drift);
      current = applyEvents(current, drift);
      // Kuyruk 19: büyücünün tur başı alanı (Faithful Hound ısırığı).
      const bite = casterTurnZoneEvents(current, next.id, rng);
      events.push(...bite);
      current = applyEvents(current, bite);
      const zoneStart = zoneTurnEvents(current, next.id, 'start', rng);
      events.push(...zoneStart);
      current = applyEvents(current, zoneStart);
      const auraStart = auraTriggerEvents(current, next.id, 'turnStart', rng);
      events.push(...auraStart);
      current = applyEvents(current, auraStart);
      // Kuyruk K54b: kayıtlı tur başı kancaları (imza: Arazi Okuma).
      const hooked = turnStartHookEvents(current, next.id, rng, applyEvents);
      events.push(...hooked);
      current = applyEvents(current, hooked);
      const fx = effectTurnStartEvents(current, next.id, rng);
      events.push(...fx.events);
      current = applyEvents(current, fx.events);
      const celStart = celestialTurnStartEvents(current, next.id);
      events.push(...celStart);
      current = applyEvents(current, celStart);
      // Kuyruk 19: Animate Objects: sahibi bonus eylemle emretmediyse nesne yalnızca Kaçın yapar (turu geçer).
      const nx = current.combatants[next.id];
      const ownerOf = nx?.summon?.commandBonus ? current.combatants[nx.summon.by] : undefined;
      if (nx && ownerOf && !ownerOf.economy.summonCommand && nx.hp > 0 && globalRule(current, 'spellsK19')) {
        const dodge = [timedCondition(current, nx.id, { condition: DODGE, owner: 'target', end: 'turnStart' }, nx.id, 'Kaçın (emir yok)')];
        events.push(...dodge);
        current = applyEvents(current, dodge);
        fx.skip = true;
      }
      const after = current.combatants[next.id];
      // Yenilenemeyip ölen, uyuyan yaratığın, masumun ve Command'la turunu kaybedenin turu atlanır (masum tur başı
      // etkilerini yine alır).
      if (after && (after.hp > 0 || after.regenPending) && !after.asleep && (!after.unaware || patrolOf(current, after)) && !after.civilian && !fx.skip) break;
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
  if (cmd.type === 'multiattack') return executeMultiattack(state, actor, cmd.targetId, rng, cmd.plan);

  if (cmd.type === 'stabilize') {
    const target = state.combatants[cmd.targetId];
    if (!target) return fail('Hedef bulunamadı.');
    if (target.id === actor.id) return fail('Kendini stabilize edemezsin.');
    if (target.life !== 'dying') return fail('Hedef ölmekte değil.');
    // Kuyruk 19 (SRD Healer's Kit): kitle zarsız stabilize; kitsiz WIS (Medicine) DC 10 (`srdK19`; eskide yalnızca WIS).
    const k19s = !!globalRule(state, 'srdK19');
    if (k19s && actor.traits?.includes('healers-kit')) {
      events.push({ type: 'stabilized', actorId: actor.id, targetId: target.id, natural: 20, success: true });
      return { ok: true, state: applyEvents(state, events), events };
    }
    const med = k19s ? actor.skills?.medicine ?? actor.modifiers.wis : actor.modifiers.wis;
    const roll = rollD20('normal', rollTag(rng, { kind: 'check', by: actor.id, bonus: med }));
    const success = roll.kept === 20 || (roll.kept !== 1 && roll.kept + med >= 10);
    events.push({ type: 'stabilized', actorId: actor.id, targetId: target.id, natural: roll.kept, success });
    return { ok: true, state: applyEvents(state, events), events };
  }

  if (cmd.type === 'cast_spell') return executeCast(state, actor, cmd, rng);
  if (cmd.type === 'action_surge') return executeActionSurge(state, actor);
  if (cmd.type === 'shove') return executeShove(state, actor, cmd.targetId, cmd.effect, rng);
  if (cmd.type === 'grapple') return executeGrapple(state, actor, cmd.targetId, rng);
  if (cmd.type === 'second_wind') return executeSecondWind(state, actor, rng);
  if (cmd.type === 'rage') return executeRage(state, actor);
  if (cmd.type === 'reckless') return executeReckless(state, actor);
  if (cmd.type === 'use_feature') return executeUseFeature(state, actor, cmd, rng);
  // Görev SORCERER: Font of Magic.
  if (cmd.type === 'font_of_magic') return executeFontOfMagic(state, actor, cmd.mode, cmd.level);
  if (cmd.type === 'focus_action') return executeFocusAction(state, actor, cmd.action, rng);
  if (cmd.type === 'change_floor') return executeChangeFloor(state, actor, rng);
  if (cmd.type === 'stunning_strike') return executeStunningStrike(state, actor, cmd.targetId, rng);
  if (cmd.type === 'eldritch_smite') return executeEldritchSmite(state, actor, rng);
  if (cmd.type === 'bonus_strike') return executeBonusStrike(state, actor, cmd.targetId, cmd.technique, rng);
  if (cmd.type === 'sphere_roll') return executeSphereRoll(state, actor, cmd.to);
  if (cmd.type === 'command_summons') return executeCommandSummons(state, actor);
  if (cmd.type === 'sphere_carry') return executeSphereCarry(state, actor, cmd.targetId, !!cmd.drop);
  if (cmd.type === 'spell_followup') {
    // Görev B1: süreli tekrar (Heat Metal, Call Lightning, Vampiric Touch, Gust of Wind).
    // Kuyruk 19: Telekinesis sonraki turlarda Magic eylemiyle.
    const tk = spells.find((x) => x.name === actor.concentration?.spell);
    if (tk && telekinesisOn(state, tk)) return executeTelekinesis(state, actor, tk, { targetId: cmd.targetId, dest: cmd.targetHex, lift: cmd.choice === 'lift' }, rng, true);
    // Kuyruk 19: Dispel Evil and Good (Break Enchantment, Dismissal).
    if (dispelEvilSpellOf(state, actor)) return executeDispelEvil(state, actor, cmd.targetId, rng);
    // Kuyruk 19: Tree Stride (her tur bir kez ağaçtan ağaca).
    if (cmd.targetHex && strideSpellOf(state, actor)) return executeStride(state, actor, cmd.targetHex);
    // Kuyruk 19: Faithful Hound taşıma (hedef altıgen).
    if (cmd.targetHex && movableZoneOf(state, actor)) return executeZoneShift(state, actor, cmd.targetHex);
    if (spells.find((x) => x.name === actor.concentration?.spell)?.mechanics.repeat) return executeRepeat(state, actor, cmd.targetId, rng, cmd.choice);
    return executeFollowup(state, actor, cmd.targetId, rng);
  }

  // Yerdeyken yürüme/atlama: önce otomatik ayağa kalkar (hızın yarısı).
  if (needsStand(actor, cmd)) {
    const stood = standUpEvents(actor);
    // Kuyruk 20 A2: kalkacak hareket kalmadıysa (hız 0 değilken) sürünür (SRD 5.2.1 Crawling; kural sürümü 2).
    const crawl = typeof stood === 'string' && cmd.type === 'move' && srdConditions(state) && !speedZero(actor.conditions);
    if (crawl) return executeMove(state, actor, cmd.to, rng);
    if (typeof stood === 'string') return fail(stood);
    const up = applyEvents(state, stood);
    const r = executeCommand(up, cmd, ctx, rng);
    return r.ok ? { ok: true, state: r.state, events: [...stood, ...r.events] } : r;
  }
  if (cmd.type === 'mount') return executeMount(state, actor, cmd.mountId);
  if (cmd.type === 'dismount') return executeDismount(state, actor, cmd.to);
  // Kuyruk 19 (Mounted Combat): binici kendi yürümez; bineği taşır.
  if (actor.riding && (cmd.type === 'move' || cmd.type === 'jump' || cmd.type === 'shift_move')) return fail('Bineğin üstündesin: önce in (bineğin hareketiyle taşınırsın).');
  if (cmd.type === 'move') return executeMove(state, actor, cmd.to, rng);
  if (cmd.type === 'shift_move') return executeShiftMove(state, actor, cmd.to, rng);
  if (cmd.type === 'superior_defense') return executeSuperiorDefense(state, actor);
  if (cmd.type === 'steed_action') return executeSteedAction(state, actor, cmd.kind, rng, cmd.targetId, cmd.to);
  if (cmd.type === 'initiative_swap') return executeInitiativeSwap(state, actor, cmd.allyId);
  if (cmd.type === 'jump') return executeJump(state, actor, cmd.to, rng);
  if (cmd.type === 'climb') return executeClimb(state, actor, cmd.to, rng);
  if (cmd.type === 'stand_up') return executeStandUp(state, actor);
  if (cmd.type === 'escape_grapple') return executeEscapeGrapple(state, actor, rng);
  if (cmd.type === 'hide') return executeHide(state, actor, rng);
  if (cmd.type === 'search') return executeSearch(state, actor, rng);
  if (cmd.type === 'pull') return executePull(state, actor, cmd.targetId, rng);
  if (cmd.type === 'escape') return executeEscape(state, actor, rng);
  if (cmd.type === 'summon_move') return executeSummonMove(state, actor, cmd.to, cmd.ramId, rng, cmd.hand);
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
  if (cmd.type === 'distract') return executeDistract(state, actor, cmd.at);
  if (cmd.type === 'use_item') return executeUseItem(state, actor, cmd.itemId, cmd.targetId, rng);
  if (cmd.type === 'moral_rally') return executeRally(state, cmd);
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
  // Kuyruk 30 D1: bulunmamış gizli nesneyle yalnızca Game Master etkileşir.
  if ((cmd.type === 'attack_object' || cmd.type === 'object_use') && !ctx.isGm) {
    const hid = state.map?.objects?.find((o) => o.id === cmd.objectId);
    if (hid && concealed(state, hid)) return fail('Böyle bir nesne görünmüyor.');
  }
  if (cmd.type === 'attack_object') return executeAttackObject(state, actor, cmd.objectId, cmd.option, rng);
  // Kuyruk 24: Orman nesneleri (heykelin gözü, çadır, ağaç, kemik yığını) önce; değilse genel nesne kuralları.
  // Görev K26: kola bağlı kapı, balista.
  // A1: oyuncunun "Nesne fırlat" komutu (K53 nesne hareketi).
  if (cmd.type === 'object_use' && cmd.action === 'throw') {
    const p = playerThrowObject(state, actor, cmd.objectId, cmd.to);
    if ('problem' in p) return fail(p.problem);
    const r = throwObject(state, actor.pos as NonNullable<typeof actor.pos>, cmd.objectId, cmd.to as NonNullable<typeof cmd.to>, actor.id, rng, p.hit, p.range);
    return 'problem' in r ? fail(r.problem) : finish(state, r.events);
  }
  if (cmd.type === 'object_use') return executeHighlandsUse(state, actor, cmd.objectId, cmd.action, cmd.to, rng) ?? executeWildsUse(state, actor, cmd.objectId, cmd.action, rng) ?? executeForestUse(state, actor, cmd.objectId, cmd.action, rng) ?? executeObjectUse(state, actor, cmd.objectId, cmd.action, cmd.to, rng);
  if (cmd.type === 'wild_shape') return executeWildShape(state, actor, cmd.form);
  if (cmd.type === 'wild_resurgence') return executeWildResurgence(state, actor, cmd.mode, cmd.uses);
  // Kuyruk 19: kalan Eldritch Invocation'lar.
  if (cmd.type === 'familiar_strike') return executeFamiliarStrike(state, actor, cmd.targetId, rng);
  if (cmd.type === 'familiar_order') return executeFamiliarOrder(state, actor);
  if (cmd.type === 'gaze') return executeGaze(state, actor, cmd.targetId);
  if (cmd.type === 'monster_ability') return executeMonsterAbility(state, actor, cmd.abilityId, cmd.targetId, cmd.targetHex, rng, cmd.option);

  // Silah saldırısı
  const target = state.combatants[cmd.targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (cmd.type !== 'attack') return fail('Bilinmeyen komut.');
  // Kuyruk 19: Brutal Strike seçenekleri (Improved: Staggering, Sundering; 17'de iki farklı etki).
  if ((cmd.brutal && !brutalOptions(actor).blows.includes(cmd.brutal)) || (cmd.brutal2 && (brutalOptions(actor).max < 2 || cmd.brutal2 === cmd.brutal || !brutalOptions(actor).blows.includes(cmd.brutal2)))) return fail('Bu Brutal Strike seçeneği yok.');
  const why = cunningProblem(actor, cmd.cunning ?? []) ?? ((cmd.cunning ?? []).includes('poison') && !featuresOn(state) ? 'Poison bu kural sürümünde yok.' : null);
  if (why) return fail(why);
  // Kuyruk 18 H3: Tactical Master (Fighter 9): ustalığı olan silahta saldırı başına Push, Sap ya da Slow.
  const tm = cmd.mastery && TACTICAL.includes(cmd.mastery) && actor.traits?.includes('tactical-master') && cmd.option.mastery && globalRule(state, 'tacticalMaster');
  const option = tm ? { ...cmd.option, mastery: cmd.mastery as NonNullable<typeof cmd.option.mastery> } : cmd.option;
  const r = weaponAttackEvents(state, actor, target, option, rng, false, false, { ...(cmd.cunning?.length ? { cunning: cmd.cunning } : {}), ...(cmd.brutal ? { brutal: cmd.brutal } : {}), ...(cmd.brutal2 ? { brutal2: cmd.brutal2 } : {}) });
  if (!r.ok) return r;
  // Kuyruk 19: Grappler feat'i Punch and Grab: Attack eylemindeki Unarmed Strike isabetinde hasar + Grapple (turda bir kez).
  if (cmd.grab && punchAndGrabReady(state, actor, option) && r.events.some((e) => e.type === 'attack_resolved' && e.hit && e.targetId === target.id)) {
    const s1 = applyEvents(state, r.events);
    const g = executeGrapple(s1, s1.combatants[actor.id] as Combatant, target.id, rng);
    const mark: BattleEvent = { type: 'trait_turn', actorId: actor.id, trait: 'punch-and-grab', key: turnKey(state) };
    return finish(state, [...r.events, mark, ...(g.ok ? g.events : [])]);
  }
  return finish(state, r.events);
}

/**
 * Kuyruk 31: bitmiş Serüven savaşında keşif yürüyüşü. Parti üyesi (ayakta) hareket sınırı sıfırlanmış olarak yürür
 * (`explore_step` + normal `move` olayları); savaş bitmiş kalır. Yalnızca savaşın `explore` alanı varsa.
 */
/** Kuyruk 31/32: keşif açık mı: Serüven savaşı bitmiş ya da sahada ayakta düşman yok (koridor yürüyüşü). */
export function exploreReady(state: BattleState): boolean {
  if (!state.explore) return false;
  if (state.status === 'finished') return true;
  return state.status === 'active' && !Object.values(state.combatants).some((c) => c.side === 'enemies' && c.hp > 0 && !c.summon?.gone);
}

/** Kuyruk 31: keşifte yürüyecek savaşçının hareket görünümü (sıfırlanmış hareket, sıra onda); arayüz yürünebilir altıgenleri bununla hesaplar. */
export function exploreView(state: BattleState, actorId: string): BattleState {
  const reset = applyEvents(state, [{ type: 'explore_step', actorId }]);
  return { ...reset, status: 'active', turnIndex: Math.max(0, reset.order.indexOf(actorId)) };
}

function executeExploreMove(state: BattleState, cmd: Extract<Command, { type: 'explore_move' }>, ctx: CommandContext, rng: Rng): CommandResult {
  if (!exploreReady(state)) return fail('Keşif yalnızca bitmiş (ya da düşmansız) Serüven savaşında.');
  const c = state.combatants[cmd.actorId];
  if (!c || c.side !== 'party' || c.civilian || c.hp <= 0 || !c.pos) return fail('Bu savaşçı keşfe çıkamaz.');
  const step: BattleEvent = { type: 'explore_step', actorId: c.id };
  const reset = applyEvents(state, [step]);
  const live: BattleState = { ...reset, status: 'active', turnIndex: Math.max(0, reset.order.indexOf(c.id)) };
  const r = executeCommand(live, { type: 'move', actorId: c.id, to: cmd.to }, ctx, rng);
  if (!r.ok) return r;
  return { ok: true, state: { ...r.state, status: state.status, turnIndex: state.turnIndex }, events: [step, ...r.events] };
}

