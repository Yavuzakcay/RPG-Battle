/**
 * Uçuş (Görev S1): yaratığın kendi uçuş hızı (`fly`, canavar ve çağrı verisinden) ya da süren etkiden gelen uçuş
 * (Fly: uçuş hızı; Levitate: havada ama yürüyemez). Yükseklik modeli (`height`, Adım 8) ayrı kalır; uçan birim
 * zorlu araziyi ve yer seviyesindeki zemin etkilerini yok sayar, engelin içinden geçemez. Uçuş bitince düşme hasarı
 * yok (DECISIONS.md). Saf.
 */
import { globalRule } from './ruleControl';
import type { BattleState, Combatant } from './types';

/** Uçuş hızı (ft): kendi uçuş hızı ya da etkilerden en büyüğü. */
export function flySpeed(c: Pick<Combatant, 'fly' | 'effects'>): number {
  let ft = c.fly;
  for (const e of c.effects ?? []) if (e.fly && e.fly > ft) ft = e.fly;
  return ft;
}

/** Havada mı (uçuş hızı var ya da Levitate gibi bir etkiyle süzülüyor). */
export const isAirborne = (c: Pick<Combatant, 'fly' | 'effects'>): boolean =>
  flySpeed(c) > 0 || !!c.effects?.some((e) => e.airborne);

/** Etki yürümeyi engelliyor mu (Levitate: yalnızca itilip çekilerek yer değiştirir). */
export const effectSpeedZero = (c: Pick<Combatant, 'effects'>): boolean => !!c.effects?.some((e) => e.speedZero);

/**
 * Dikey hareket bayrakları (Görev K9c; yeni yükseklik modeli yok). Havada olan (Fly, Levitate, Gaseous Form, uçuş hızı)
 * yükseklik farkı maliyetini ve zemin engelini (zorlu arazi, yer etkileri) yok sayar; tırmanan (Spider Climb, Second-Story
 * Work) yalnızca yükseklik farkı maliyetini.
 */
export const ignoresHeight = (c: Pick<Combatant, 'fly' | 'effects' | 'traits'>): boolean => isAirborne(c) || climbs(c);
/** Kuyruk 19: Ranger'ın Roving'i (ağır zırhsız) tırmanma ve yüzme hızı verir (`roving` işareti, anahtar `featuresK19`). */
const roving = (c: Pick<Combatant, 'traits' | 'heavyArmor'> & { bonusStrike?: unknown }, state?: Pick<BattleState, 'map' | 'kuralSurumu'>) =>
  !!state && !!globalRule(state, 'featuresK19') && ((!!c.traits?.includes('roving') && !c.heavyArmor)
    // Kuyruk 19: Acrobatic Movement (Monk 9): zırhsız, kalkansızken (Martial Arts geçerli) dikey yüzey ve sıvı üstünde.
    || (!!c.traits?.includes('acrobatic-movement') && !!c.bonusStrike));
export const climbs = (c: Pick<Combatant, 'effects' | 'traits'> & { heavyArmor?: boolean; bonusStrike?: unknown }, state?: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean =>
  !!c.traits?.includes('climber') || !!c.effects?.some((e) => e.climb) || roving({ traits: c.traits, heavyArmor: !!c.heavyArmor, bonusStrike: c.bonusStrike }, state);
export const swimsByTrait = (c: Pick<Combatant, 'traits'> & { heavyArmor?: boolean }, state?: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean =>
  roving({ traits: c.traits, heavyArmor: !!c.heavyArmor }, state);

/** Jump büyüsünün zıplama menzili (ft; etkilerden en büyüğü) ya da 0. */
export const spellJumpFt = (c: Pick<Combatant, 'effects'>): number => Math.max(0, ...(c.effects ?? []).map((e) => e.jumpFt ?? 0));
