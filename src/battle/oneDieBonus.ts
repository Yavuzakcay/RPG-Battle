/**
 * Görev B93 (A1): "bir hasar zarına" eklenen sabit değerler tek yerde. SRD 5.2.1: Empowered Evocation (Evoker 10, s. 82)
 * "add your Intelligence modifier to one damage roll of any Wizard Evocation spell"; Elemental Affinity (Draconic 6,
 * s. 70) "add your Charisma modifier to one damage roll of that spell". Çok zarlı/çok ışınlı büyüde (Scorching Ray, Magic
 * Missile, iki parçalı Flame Strike) yalnız bir kez. Sınıf adı yok: savaşçının işaretleri (`empowered-evocation`,
 * `affinity-<tür>`). Saf.
 */
import type { SpellMechanics } from '../data';
import type { Combatant } from './types';

/** Hangi tek-zar eklerinin bu zarda atlanacağı (zaten başka bir zara eklendi). */
export interface OnceSkip { ee?: boolean; aff?: boolean }
export const SKIP_ALL: OnceSkip = { ee: true, aff: true };

/** Elemental Affinity: büyünün hasar türü soyun türüyse CHA. */
export const affinityBonus = (actor: Combatant, type: string | undefined): number =>
  type && actor.traits?.includes(`affinity-${type}`) ? Math.max(0, actor.modifiers.cha) : 0;

/**
 * Empowered Evocation: Evocation büyüsünde INT. KAPSAM103 (103+, `k103` işareti; SRD 5.2.1 s. 82 "Whenever you cast a Wizard spell
 * from the Evocation school, you can add your Intelligence modifier"): yalnız Wizard listesindeki büyüde (`wizard`) ve INT
 * değiştiricisiyle; 102 ve altı her Evocation büyüsü ve büyü değiştiricisi.
 */
export const evocationBonus = (actor: Combatant, m: Pick<SpellMechanics, 'kind'>, school: string | undefined, wizard = true): number =>
  school === 'Evocation' && m.kind !== 'heal' && !!actor.traits?.includes('empowered-evocation') && (!actor.k103 || wizard)
    ? Math.max(0, actor.k103 ? actor.modifiers.int : actor.spellMod) : 0;

/** Bu zara eklenecek tek-zar ekleri (atlananlar hariç). */
export function oneDieBonus(actor: Combatant, m: Pick<SpellMechanics, 'kind' | 'damageType'>, school: string | undefined, skip?: OnceSkip, wizard = true): number {
  if (m.kind === 'heal') return 0;
  return (skip?.ee ? 0 : evocationBonus(actor, m, school, wizard)) + (skip?.aff ? 0 : affinityBonus(actor, m.damageType));
}

/** Bu zarda hangi ekler kullanıldı (sonraki zarlarda atlanacaklar). */
export function usedOnce(actor: Combatant, m: Pick<SpellMechanics, 'kind' | 'damageType'>, school: string | undefined, skip?: OnceSkip, wizard = true): OnceSkip {
  return { ee: !!skip?.ee || evocationBonus(actor, m, school, wizard) > 0, aff: !!skip?.aff || (m.kind !== 'heal' && affinityBonus(actor, m.damageType) > 0) };
}
