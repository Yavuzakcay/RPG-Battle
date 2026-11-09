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

/** Uçuyor ya da süzülüyor mu (uçuş hızı var ya da Levitate gibi bir etki); tırmanma sayılmaz. */
export const fliesOrHovers = (c: Pick<Combatant, 'fly' | 'effects'>): boolean =>
  flySpeed(c) > 0 || !!c.effects?.some((e) => e.airborne);

/**
 * Havada mı (zeminden kopuk): uçuş hızı var, Levitate gibi bir etkiyle süzülüyor ya da (Kuyruk K68b, sürüm 52)
 * tırmanma hızıyla duvarda/tavanda (`climbing` işareti yalnız sürüm 52'nin tırmanma olayıyla gelir; eski sürüm aynen).
 */
export const isAirborne = (c: Pick<Combatant, 'fly' | 'effects'> & { climbing?: true; altitudeFt?: number }): boolean =>
  fliesOrHovers(c) || (!!c.climbing && (c.altitudeFt ?? 0) > 0);

/**
 * Kuyruk U1a (sürüm 61+, `ucus.yeredegmez`): süzülüyor mu: uçuşunun bütün kaynakları süzülme etkisi (`hover`). Kendi uçuş
 * hızı, süzülmesiz uçuş etkisi ya da Levitate varsa tam uçan sayılır. Süzülme etkisi yalnız 61+ savaşta oluşur (eski
 * kayıtlarda alan yok: sonuç hep false).
 */
export function hovers(c: Pick<Combatant, 'fly' | 'effects'>): boolean {
  if ((c.fly ?? 0) > 0 || !c.effects?.length) return false;
  let hov = false;
  for (const e of c.effects) {
    if (e.airborne) return false;
    if ((e.fly ?? 0) > 0) { if (!e.hover) return false; hov = true; }
  }
  return hov;
}

/**
 * Kuyruk U1a: lav, derin su ve zemin alanları (yüzeyler dahil) bu yaratığa işler mi: yerde ya da süzülürken. Zorlu zemin,
 * çamur, tuzak plakası, sığ su, çukur gibi diğer yer etkileri yalnız yerdekine (`isAirborne` aynen).
 */
export const groundBound = (c: Pick<Combatant, 'fly' | 'effects'> & { climbing?: true; altitudeFt?: number }): boolean => !isAirborne(c) || hovers(c);

/**
 * Kuyruk U1a (sürüm 61+, `ucus.azamiIrtifaFt`): yaratığın kendi uçuş irtifası sınırı (ft): uçuşunun bütün kaynakları sınırlı
 * etkiyse en büyüğü; kendi uçuş hızı, sınırsız uçuş etkisi ya da Levitate varsa null (haritanın sınırı).
 */
export function ownFlyCapFt(c: Pick<Combatant, 'fly' | 'effects'>): number | null {
  if ((c.fly ?? 0) > 0 || !c.effects?.length) return null;
  let cap = -1;
  for (const e of c.effects) {
    if (e.airborne) return null;
    if ((e.fly ?? 0) > 0) { if (e.flyCapFt === undefined) return null; cap = Math.max(cap, e.flyCapFt); }
  }
  return cap < 0 ? null : cap;
}

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
export const swimsByTrait = (c: Pick<Combatant, 'traits'> & { heavyArmor?: boolean; effects?: Combatant['effects'] }, state?: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean =>
  // Kuyruk A6 (Alter Self, Aquatic Adaptation): etkiden yüzme hızı.
  !!c.effects?.some((e) => e.swim) || roving({ traits: c.traits, heavyArmor: !!c.heavyArmor }, state);

/** Jump büyüsünün zıplama menzili (ft; etkilerden en büyüğü) ya da 0. */
export const spellJumpFt = (c: Pick<Combatant, 'effects'>): number => Math.max(0, ...(c.effects ?? []).map((e) => e.jumpFt ?? 0));
