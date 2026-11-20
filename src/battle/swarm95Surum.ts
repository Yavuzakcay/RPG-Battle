/**
 * Görev SWARM95 (kural sürümü 95): SRD 5.2.1 Swarm özelliği ("The swarm can occupy another creature's space and vice
 * versa, and the swarm can move through any opening large enough for a Tiny …"). Tek sabit; yaprak modül. Swarm etkisi
 * Gaseous Form'un `shareSpace`/`squeeze` altyapısını kullanır (`swarmShare.ts`, `monsterAbilities.ts`). 94 ve altı
 * (eski kayıt, replay) aynen: sürü yaratıkların içinden geçer ama başka yaratığın altıgeninde duramaz. Ayrıntı DECISIONS.md.
 */
import type { BattleState } from './types';

export const SWARM95_VERSION = 95;
export const swarm95On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SWARM95_VERSION;
