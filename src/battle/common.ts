/** Komut işleyicilerinin ortak parçaları: yetki kontrolü, sıra, savaşın bitişi. */
import { goalOutcome } from './goals';
import type { Spell, SpellMechanics } from '../data';
import { parseDice } from '../rules/dice';
import { distance as hexDistance } from '../rules/hex';
import { isIncapacitated, speedZero } from '../rules/conditions';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, CommandContext } from './types';

export interface Failure {
  ok: false;
  error: string;
}
export type CommandResult = { ok: true; state: BattleState; events: BattleEvent[] } | Failure;

export const fail = (error: string): Failure => ({ ok: false, error });

/** Bu kişi bu savaşçıyı yönetebilir mi? GM yalnızca düşmanları, oyuncu yalnızca kendi karakterini. */
export function canControl(c: Combatant, ctx: CommandContext): boolean {
  if (c.side === 'enemies' || c.civilian) return ctx.isGm;
  return ctx.playerId !== null && c.ownerId === ctx.playerId;
}

export function currentActorId(state: BattleState): string {
  const id = state.order[state.turnIndex];
  if (!id) throw new Error('Sıra boş');
  return id;
}

/** Sıradaki ayakta yaratığı bulur; sıranın sonuna gelince tur sayısını artırır. */
export function nextActor(state: BattleState): { id: string; round: number } {
  const n = state.order.length;
  let index = state.turnIndex;
  let round = state.round;
  for (let step = 0; step < n; step++) {
    index += 1;
    if (index >= n) {
      index = 0;
      round += 1;
    }
    const id = state.order[index];
    const c = id ? state.combatants[id] : undefined;
    // CILA: sahibinin bonus eylemiyle taşınan çağrının (Flaming Sphere, ruh sürüsü) kendi turu yok.
    if (id && c && !c.summon?.ownerBonus && (c.hp > 0 || c.regenPending || c.life === 'dying')) return { id, round };
  }
  return { id: currentActorId(state), round };
}

/** Hayatta kalan masum sayısı (masumları koru). */
export function civiliansAlive(state: BattleState): number {
  return Object.values(state.combatants).filter((c) => c.civilian && c.hp > 0).length;
}

/**
 * Bir taraf tamamen düştüyse kazananı döndürür. Masumlar partiyi ayakta tutmaz. Masumların
 * ölümü bilgi amaçlıdır (GM hikâyede işler); yalnızca GM'in açtığı sıkı kuralda hayatta kalan
 * masum gerekenin altına düşünce düşmanlar kazanır.
 */
export function winnerOf(state: BattleState): 'party' | 'enemies' | null {
  // Uyuyan ejderha: uyanık düşmanlar yenilince parti kazanır (ejderha uyurken sıvışılır). Çağrılmış yaratıklar
  // (Görev R3) tarafı ayakta tutmaz. Uyuyan grup üyesi (Görev S4) ayakta sayılır: uyanabilir.
  const alive = (side: 'party' | 'enemies') =>
    Object.values(state.combatants).some((c) => c.side === side && !c.civilian && !c.summon && !(c.asleep && !c.group) && (c.hp > 0 || c.regenPending));
  const objective = state.map?.objective;
  if (objective?.strict && civiliansAlive(state) < objective.needed) return 'enemies';
  // Görev S3: hedefler (varsa) önce; düşmanların hepsi düşünce yine parti kazanır, parti düşünce düşman.
  if (state.goals) { const g = goalOutcome(state); if (g) return g; }
  if (!alive('enemies')) return 'party';
  if (!alive('party')) return 'enemies';
  return null;
}

/** Hedef alınabilir mi? Ayakta olan veya yenilenmeyi bekleyen yaratık. */
/** Görev B2: dokunulamaz çağrı (Flaming Sphere, ruh sürüsü): hedef alınmaz, alanlardan etkilenmez, geçişi engellemez. */
export const isIntangible = (c: Combatant | undefined): boolean => !!c?.summon?.intangible && !c.summon.gone;

export function isTargetable(c: Combatant): boolean {
  // Görev WIZARD: Blink ile Ethereal'deki yaratık hedef alınamaz.
  if (c.effects?.some((e) => e.ethereal)) return false;
  return c.hp > 0 || c.regenPending || c.life === 'dying' || c.life === 'stable';
}

/** Sırası gelen, ayakta ve yönetebildiğin bir savaşçı mı? Aksiyon gerekiyorsa aksiyon yapabilmeli. */
export function checkActor(
  state: BattleState,
  actorId: string,
  ctx: CommandContext,
  needsAction: boolean,
  outOfTurn = false,
  /** Yalnızca hareket (yürü, atla, kalk): Incapacitated ama hızı 0 olmayan yapabilir (Görev H). */
  moveOnly = false,
): { ok: true; actor: Combatant } | Failure {
  if (state.status !== 'active') return fail('Savaş bitti.');
  const actor = state.combatants[actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  if (!outOfTurn && currentActorId(state) !== actor.id) return fail('Sıra bu savaşçıda değil.');
  // Kendi turunda düşen (alev, tuzak) savaşçının turu yine bitirilebilir; başka bir şey yapamaz.
  if (actor.hp <= 0 && needsAction) return fail('Bu savaşçı ayakta değil.');
  if (needsAction && moveOnly && speedZero(actor.conditions)) return fail(`Hareket edemiyor: hızı 0 (${actor.conditions.join(', ')}).`);
  if (needsAction && isIncapacitated(actor.conditions) && !moveOnly) {
    return fail(`Aksiyon yapamaz: ${actor.conditions.join(', ')}`);
  }
  return { ok: true, actor };
}

/** Olayları uygular, savaş bittiyse "battle_finished" olayını da ekler. */
export function finish(state: BattleState, events: BattleEvent[]): CommandResult {
  let next = applyEvents(state, events);
  const winner = winnerOf(next);
  if (winner) {
    const done: BattleEvent = { type: 'battle_finished', winner };
    events.push(done);
    next = applyEvents(next, [done]);
  }
  return { ok: true, state: next, events };
}

/** Uygulanan yukarı slot etkisinde ek zar sayısı: büyü seviyesinin üstündeki her slot seviyesi için `upcast.dice`. */
/**
 * Görev K9b: büyünün yukarı slottaki biçimi: alan yarıçapı (`radiusFt`), patlama zarı (`burstDice`), güçlendirme bonusu
 * eşikleri (`bonusBySlot`), süre ve konsantrasyon eşikleri (`durationBySlot`). Uygulanmayan (`applied` değil) ya da
 * temel slotta aynı büyü döner. Zar artışı (`dice`) `upcastDiceCount` ile ayrı.
 */
export function atSlot(spell: Spell, slotLevel: number | null | undefined): Spell {
  const up = spell.mechanics.upcast;
  const level = slotLevel ?? spell.level;
  const above = Math.max(0, level - spell.level);
  if (!up?.applied || above === 0) return spell;
  const atLeast = <T>(table: Record<string, T> | undefined): T | undefined =>
    Object.entries(table ?? {}).filter(([k]) => level >= Number(k)).sort((a, b) => Number(a[0]) - Number(b[0])).pop()?.[1];
  let s = spell;
  if (up.radiusFt && s.area) s = { ...s, area: { ...s.area, sizeFt: s.area.sizeFt + up.radiusFt * above } };
  if (up.burstDice && s.mechanics.burst) {
    const b = parseDice(s.mechanics.burst.damage);
    const u = parseDice(up.burstDice);
    s = { ...s, mechanics: { ...s.mechanics, burst: { ...s.mechanics.burst, damage: `${b.count + u.count * above}d${b.sides}` } } };
  }
  const bonus = atLeast(up.bonusBySlot);
  if (bonus !== undefined && s.mechanics.selfBuff) {
    s = { ...s, mechanics: { ...s.mechanics, selfBuff: { ...s.mechanics.selfBuff, attackBonus: bonus, damageBonus: bonus } } };
  }
  const dur = atLeast(up.durationBySlot);
  if (dur && s.mechanics.effect) {
    s = { ...s, ...(dur.concentration === false ? { concentration: false } : {}), mechanics: { ...s.mechanics, effect: { ...s.mechanics.effect, rounds: dur.rounds } } };
  }
  return s;
}

export function upcastDiceCount(m: SpellMechanics, levelsAbove: number): number {
  if (!m.upcast?.applied || !m.upcast.dice || levelsAbove <= 0) return 0;
  return parseDice(m.upcast.dice).count * levelsAbove;
}

/**
 * Saldıran hedefin 5 ft içinde mi (Paralyzed/Unconscious otomatik kritiği; Görev H): haritada bitişik altıgen,
 * haritasız savaşta yakın dövüş saldırısı.
 */
export function withinFiveFt(state: BattleState, a: Combatant, b: Combatant, melee: boolean): boolean {
  if (state.map) return !!a.pos && !!b.pos && hexDistance(a.pos, b.pos) <= 1;
  return melee;
}

/**
 * Hasar profili (direnç, bağışıklık, zafiyet): savaşçının kendi listeleri ve süren etkilerin dirençleri (Görev B1:
 * Protection from Energy, Gaseous Form). Hasar ayarlamanın tek yolu (`adjustDamage` çağıranlar).
 */
export function damageProfile(t: Combatant): { resistances: string[]; immunities: string[]; vulnerabilities: string[] } {
  const extra = (t.effects ?? []).flatMap((e) => e.resist ?? []);
  return {
    resistances: extra.length ? [...new Set([...t.resistances, ...extra])] : t.resistances,
    immunities: t.immunities,
    vulnerabilities: t.vulnerabilities,
  };
}
