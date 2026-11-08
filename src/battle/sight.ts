/**
 * Görev B4 (SRD 5.2.1): görünmezliğin saldırıdaki etkisi büyülerle değişir. Faerie Fire ve Starry Wisp'in işaretlediği
 * yaratık Invisible durumundan yararlanamaz (`revealed`); See Invisibility'li yaratık görünmezi görür (`seeInvisible`).
 * Saldırı bağlamına verilen durum listelerinden Invisible bu durumlarda çıkarılır (durumun kendisi kalır).
 */
import { isAirborne } from './flight';
import { withinFiveFt } from './common';
import { frightenedNow, grappleAttackRule, srdConditions } from './ruleVersion';
import { globalRule } from './ruleControl';
import { distance } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const revealed = (c: Combatant) => c.effects?.some((e) => e.revealed) ?? false;
const seesInvisible = (c: Combatant) => c.effects?.some((e) => e.seeInvisible) ?? false;

/**
 * Kuyruk 19: özel duyular (SRD 5.2.1): Blindsight ve Truesight menzili içinde görme gerektiren her şey (görünmez yaratık,
 * karanlık, büyülü karanlık) görülür. Anahtar `specialSenses` (sürüm 16). Tremorsense yeri belirler ama "görmez".
 */
/**
 * Kuyruk K63: yaratığın Truesight menzili (ft; 0 = yok). Kaynaklar: canavar/özellik duyusu `senses.truesight` (Witch
 * Sight 30; Game Master anahtarı `specialSenses`), Boon of Truesight 60 (`featuresK19`), süren etkide `truesight`
 * (True Seeing 120) ve ek paket `algi.gercekGorusFt` (`pkTruesight`).
 */
export function truesightRange(state: Pick<BattleState, 'map' | 'kuralSurumu'>, observer: Combatant): number {
  const boon = observer.traits?.includes('boon-truesight') && globalRule(state, 'featuresK19') ? 60 : 0;
  const eff = Math.max(0, ...(observer.effects ?? []).map((e) => Math.max(e.pkTruesight ?? 0, e.truesight ?? 0)));
  const own = observer.senses?.truesight && globalRule(state, 'specialSenses') ? observer.senses.truesight : 0;
  return Math.max(boon, eff, own);
}

/** Truesight ile ilgili yeni kurallar (yanılsama, gizlenme, gerçek biçim) kural sürümü 47 ve sonrasında. */
export const TRUESIGHT_VERSION = 47;

/**
 * Kuyruk K63: tek sorgu: `observer`, `target`'ı Truesight menzilinde mi görüyor (SRD 5.2.1 Truesight: normal ve büyülü
 * karanlıkta görür, Invisible yaratık ve nesneleri görür, görsel yanılsamayı otomatik fark eder ve onlara karşı save'leri
 * geçer, şekil değiştirenin ya da büyüyle dönüşenin asıl biçimini algılar, Ethereal Plane'i görür). Sürüm 47+ ve haritalı
 * savaşta; menzil iki altıgen arası (çok altıgenli gövdede en yakın çift değil, çapa; `senseSees` ile aynı ölçü).
 */
export function truesightSees(state: Pick<BattleState, 'map' | 'kuralSurumu'> | undefined, observer: Combatant, target: Combatant): boolean {
  if (!state || (state.kuralSurumu ?? 1) < TRUESIGHT_VERSION || !observer.pos || !target.pos) return false;
  const ft = truesightRange(state, observer);
  return ft > 0 && distance(observer.pos, target.pos) * 5 <= ft;
}

/** Gizlenmiş (Hide) yaratık Truesight sahibinden saklanamaz (Hide Invisible verir; sürüm 47+). */
export const hiddenFromTruesight = (state: Pick<BattleState, 'map' | 'kuralSurumu'> | undefined, observer: Combatant, target: Combatant): boolean =>
  !!target.hidden && !truesightSees(state, observer, target);

/** Asıl biçimini algılar mı: dönüşmüş (Polymorph, Wild Shape) hedefin gerçek biçimi Truesight ile görülür (sürüm 47+). */
export const seesTrueForm = (state: Pick<BattleState, 'map' | 'kuralSurumu'> | undefined, observer: Combatant, target: Combatant): boolean =>
  !!target.shape && truesightSees(state, observer, target);

/**
 * Kuyruk K67b: görmeye dayalı Algı cezasını kaldıran duyuların menzili (ft): Blindsight ("without relying on physical
 * sight", Darkness içinde de; Feral Senses 30 ft) ve Truesight ("sees in normal and magical Darkness"). Tremorsense görmez.
 */
export function sightSenseFt(state: Pick<BattleState, 'map' | 'kuralSurumu'>, observer: Combatant): number {
  const feral = observer.traits?.includes('feral-senses') && globalRule(state, 'featuresK19') ? 30 : 0;
  const blind = observer.senses && globalRule(state, 'specialSenses') ? observer.senses.blindsight ?? 0 : 0;
  return Math.max(feral, blind, truesightRange(state, observer));
}

export function senseSees(state: Pick<BattleState, 'map' | 'kuralSurumu'> | undefined, observer: Combatant, target: Combatant): boolean {
  if (!state || !observer.pos || !target.pos) return false;
  // Kuyruk 19 (featuresK19): Ranger'ın Feral Senses'i Blindsight 30 ft (görünmez yaratığa saldırı dezavantajı da kalkar).
  const feral = observer.traits?.includes('feral-senses') && globalRule(state, 'featuresK19') ? 30 : 0;
  // Kuyruk K63: gerçek görüş menzili tek yerde (`truesightRange`; Boon, Witch Sight, canavar duyusu, True Seeing, paket `algi`).
  const ts = truesightRange(state, observer);
  // Kuyruk 19 (Dwarf Stonecunning): süreli Tremorsense (yerdeki yaratıklar).
  const tremor = !isAirborne(target) ? Math.max(0, ...(observer.effects ?? []).map((e) => e.tremorsense ?? 0)) : 0;
  const blind = observer.senses && globalRule(state, 'specialSenses') ? observer.senses.blindsight ?? 0 : 0;
  const ft = Math.max(blind, ts, feral, tremor);
  return ft > 0 && distance(observer.pos, target.pos) * 5 <= ft;
}
const drop = (conds: string[]) => conds.filter((x) => x !== 'Invisible');

/**
 * Kuyruk 19 (featuresK19): gizlenmiş yaratığın yeri biliniyor mu (Divine Sense: Celestial/Fiend/Undead, 60 ft;
 * Incapacitated iken etkisiz). Biliniyorsa hedef alınabilir; görünmezliğin saldırı etkisi (dezavantaj) sürer.
 */
/** Kuyruk K54b: ek "yerini bilir" kancaları (İnfazcı Peşini Bırakmayan; kayıtla, döngüsel içe aktarma olmadan). */
type KnowsHook = (state: Pick<BattleState, 'map' | 'kuralSurumu' | 'houseRules'>, observer: Combatant, target: Combatant) => boolean;
const KNOWS: KnowsHook[] = [];
export const registerKnowsWhere = (h: KnowsHook): void => { if (!KNOWS.includes(h)) KNOWS.push(h); };

export function knowsWhere(state: Pick<BattleState, 'map' | 'kuralSurumu'> & Partial<Pick<BattleState, 'houseRules'>>, observer: Combatant, target: Combatant): boolean {
  // Kuyruk K63 (sürüm 47): Truesight menzilindeki gizlenmiş yaratık (Hide Invisible verir) saklanamaz.
  if (truesightSees(state, observer, target)) return true;
  if (KNOWS.some((h) => h(state, observer, target))) return true;
  // Kuyruk A6 (Mind Spike): büyücü hedefin yerini her zaman bilir (gizlenemez).
  if ((target.effects ?? []).some((e) => e.pinpointBy === observer.id)) return true;
  if (!globalRule(state, 'featuresK19') || !target.creatureType) return false;
  if (observer.conditions.some((x) => ['Incapacitated', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified'].includes(x))) return false;
  return (observer.effects ?? []).some((e) => e.senseTypes && e.senseTypes.types.includes(target.creatureType as string)
    && (!observer.pos || !target.pos || distance(observer.pos, target.pos) * 5 <= e.senseTypes.ft));
}

/**
 * Saldırı bağlamı için saldıranın ve hedefin durumları (görünmezlik görülüyorsa Invisible yok sayılır). Kuyruk 16 K16E
 * (kural sürümü 2, `state` verilince): korku kaynağı görüş hattında değilse saldıranın Frightened'ı sayılmaz; Prone
 * hedefe saldırı saldıranın 5 ft içinde olup olmamasına göre (`proneWithin5`; saldırı türüne bakılmaz).
 */
export function sightConditions(attacker: Combatant, target: Combatant, state?: BattleState, melee = true): { attackerConditions: string[]; targetConditions: string[]; proneWithin5?: boolean; grappledOther?: boolean } {
  let attackerConditions = revealed(attacker) || seesInvisible(target) || senseSees(state, target, attacker) ? drop(attacker.conditions) : attacker.conditions;
  // Kuyruk A6 (Mind Spike): yerini bilen büyücüye görünmezlik işlemez.
  const pinned = (target.effects ?? []).some((e) => e.pinpointBy === attacker.id);
  const targetConditions = revealed(target) || pinned || seesInvisible(attacker) || senseSees(state, attacker, target) ? drop(target.conditions) : target.conditions;
  if (!state || !srdConditions(state)) return { attackerConditions, targetConditions };
  if (attackerConditions.includes('Frightened') && !frightenedNow(state, attacker)) attackerConditions = attackerConditions.filter((x) => x !== 'Frightened');
  // A1 (sürüm 29): yakalanan, yakalayanı dışındaki hedefe saldırıda dezavantajlı (yakalayan bilinmiyorsa uygulanmaz).
  const grappledOther = grappleAttackRule(state) && attackerConditions.includes('Grappled') && !!attacker.grapple?.by && attacker.grapple.by !== target.id;
  return { attackerConditions, targetConditions, ...(targetConditions.includes('Prone') ? { proneWithin5: withinFiveFt(state, attacker, target, melee) } : {}),
    ...(grappledOther ? { grappledOther: true } : {}) };
}
