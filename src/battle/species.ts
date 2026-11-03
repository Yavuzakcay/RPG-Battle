/**
 * Kuyruk 19 (görev 7, SRD 5.2.1 tür özellikleri): eksik kalan tür özellikleri, `srdK19` Game Master anahtarına bağlı
 * (kapalıyken savaş başında kaldırılır; etki kimliği `srd19:`, işaretler `itemTraits` listesinde).
 * - Dwarf: Dwarven Resilience (Poisoned'a save avantajı; direnç zaten tür verisinde), Stonecunning (bonus eylem, 10
 *   dakika 60 ft Tremorsense; PB kullanım, uzun dinlenme).
 * - Elf: Fey Ancestry (Charmed'a save avantajı). Keen Senses ve Trance oluşturucuda/savaş dışı.
 * - Gnome: Gnomish Cunning (INT, WIS, CHA save avantajı).
 * - Halfling: Brave (Frightened'a save avantajı), Luck (d20'de doğal 1 yeniden), Halfling Nimbleness (büyük yaratığın
 *   altıgeninden geçer), Naturally Stealthy (en az bir boy büyük yaratığın yanında gizlenebilir).
 * - Human: Resourceful (savaşa Heroic Inspiration ile başlar: başarısız d20 bir kez yeniden).
 * - Orc: Adrenaline Rush (bonus eylem Dash + PB geçici HP; PB kullanım, kısa dinlenme), Relentless Endurance (0 HP'ye
 *   düşünce 1 HP; uzun dinlenmede bir).
 * - Dragonborn: Draconic Flight (5+; bonus eylem, 10 dakika yürüme hızı kadar uçuş; uzun dinlenmede bir).
 * - Goliath: Large Form (5+; bonus eylem, 10 dakika Large, STR kontrolleri avantajlı, hız +10; uzun dinlenmede bir).
 */
import type { ActiveEffect, Combatant, UsableFeature } from './types';

export interface SpeciesParts { traits: string[]; effects: ActiveEffect[]; features: UsableFeature[]; resources: Record<string, number> }

export function speciesParts(raceId: string, level: number, pb: number, speed: number, ownerId: string): SpeciesParts {
  const out: SpeciesParts = { traits: [], effects: [], features: [], resources: {} };
  const adv = (against: string[] | null, abilities?: Array<'int' | 'wis' | 'cha'>, name = 'Tür') => out.effects.push({
    id: `srd19:${raceId}`, name, sourceId: ownerId, ...(against ? { saveAdvAgainst: against } : {}), ...(abilities ? { saveAdv: abilities } : {}) });
  const self = (key: string, name: string, resource: string, uses: number, effect: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
    out.resources[resource] = uses;
    out.features.push({ key: `srd19:${key}`, name, type: 'bonus', resource, effect: { kind: 'selfEffect', rounds: 100, effect, ...extra } as UsableFeature['effect'] });
  };
  if (raceId === 'dwarf') {
    adv(['Poisoned'], undefined, 'Dwarven Resilience');
    self('stonecunning', 'Stonecunning', 'stonecunning', pb, { tremorsense: 60 });
  }
  if (raceId === 'elf') adv(['Charmed'], undefined, 'Fey Ancestry');
  if (raceId === 'gnome') adv(null, ['int', 'wis', 'cha'], 'Gnomish Cunning');
  if (raceId === 'halfling') {
    adv(['Frightened'], undefined, 'Brave');
    out.traits.push('halfling-luck', 'halfling-nimbleness', 'naturally-stealthy');
  }
  if (raceId === 'human') { out.traits.push('resourceful'); out.resources.heroicInspiration = 1; }
  if (raceId === 'orc') {
    self('adrenaline-rush', 'Adrenaline Rush', 'adrenalineRush', pb, {}, { dash: true, tempHp: pb, rounds: 1 });
    out.traits.push('relentless-endurance'); out.resources.relentlessEndurance = 1;
  }
  if (raceId === 'dragonborn' && level >= 5) self('draconic-flight', 'Draconic Flight', 'draconicFlight', 1, { fly: speed });
  if (raceId === 'goliath' && level >= 5) self('large-form', 'Large Form', 'largeForm', 1, { size: 1, checkAdv: ['str'], speedFt: 10 });
  return out;
}

/** Halfling Luck: doğal 1'de yeniden atış (yalnızca 1). */
export const luckDie = (c: Combatant) => (c.traits?.includes('halfling-luck') ? [{ label: 'Luck', die: 'd20', sign: 1 as const, reroll: 'd20' as const, onNatural1: true }] : []);
