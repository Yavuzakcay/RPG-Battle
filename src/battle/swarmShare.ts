/**
 * Görev SWARM95 (kural sürümü 95): SRD 5.2.1 Swarm altıgen paylaşımı. Sürü etkisi (`ActiveEffect.swarm`, canavar
 * pasifinden: düşman, çağrılan, Wild Shape/Polymorph biçimi aynı kurulumdan) Gaseous Form'un `shareSpace` (yaratık
 * altıgeninde durma) ve `squeeze` (kapı aralığından geçme) bayraklarını da taşır; `swarm` yalnız "vice versa" içindir:
 * sürünün altıgenine başkası da girip durabilir. Saf, yaprak (döngüsüz).
 */
import { swarm95On } from './swarm95Surum';
import type { BattleState, Combatant } from './types';

/** Savaşçı SRD Swarm mu (95+ canavar kurulumunda işlenen etki). */
export const isSwarm = (c: Pick<Combatant, 'effects'>): boolean => !!c.effects?.some((e) => e.swarm);

/**
 * `actor` bu yaratıkların (`others`: aynı altıgende, hücre bandında) yanında durabilir mi. Sürü herkesin altıgeninde
 * durur; sürü olmayan yalnız altıgendeki herkes sürüyse. 94 ve altı: yalnız boş altıgen.
 */
export function swarmShareOk(state: Pick<BattleState, 'kuralSurumu'>, actor: Pick<Combatant, 'effects'>, others: readonly Pick<Combatant, 'effects'>[]): boolean {
  if (others.length === 0) return true;
  if (!swarm95On(state)) return false;
  return isSwarm(actor) || others.every(isSwarm);
}
