/**
 * Tepki ayarı (Görev R1, "hızlı mod"): oyuncu karakterlerinin tepkileri her seferinde sorulur / her zaman kullanılır /
 * hiç kullanılmaz; Game Master'ın (yapay zekânın) düşmanları yapay zekâ önerisiyle / her zaman / hiç. Bu cihazda
 * hatırlanır. Karar motorun isteğine göre `decideBy` ile verilir (`rules/reactionChoice.ts`).
 */
import { useState } from 'react';
import { decideBy, ENEMY_POLICIES, PLAYER_POLICIES, type ReactionAnswer, type ReactionPolicy, type ReactionRequest } from '../rules/reactionChoice';

const KEY = 'rpg-battle-reactions';

export interface ReactionPolicies { player: ReactionPolicy; enemy: ReactionPolicy }
export const DEFAULT_POLICIES: ReactionPolicies = { player: 'ask', enemy: 'ai' };

export function storedPolicies(): ReactionPolicies {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<ReactionPolicies>;
    return {
      player: PLAYER_POLICIES.includes(v.player as ReactionPolicy) ? v.player as ReactionPolicy : DEFAULT_POLICIES.player,
      enemy: ENEMY_POLICIES.includes(v.enemy as ReactionPolicy) ? v.enemy as ReactionPolicy : DEFAULT_POLICIES.enemy,
    };
  } catch {
    return DEFAULT_POLICIES;
  }
}

const next = (list: readonly ReactionPolicy[], p: ReactionPolicy) => list[(list.indexOf(p) + 1) % list.length] as ReactionPolicy;

/** Ayar ve sırayla değiştirme (Sor → Her zaman → Asla; Yapay zekâ → Her zaman → Asla). */
export function useReactionPolicies(): [ReactionPolicies, (who: 'player' | 'enemy') => void] {
  const [p, setP] = useState<ReactionPolicies>(storedPolicies);
  const cycle = (who: 'player' | 'enemy') => setP((cur) => {
    const n = { ...cur, [who]: next(who === 'player' ? PLAYER_POLICIES : ENEMY_POLICIES, cur[who]) };
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* yalnızca bu oturumda */ }
    return n;
  });
  return [p, cycle];
}

/** Tepki kararı: oyuncu karakteri mi (oyuncu ayarı) yoksa Game Master'ın yaratığı mı (düşman ayarı). */
export function reactionDecider(policies: ReactionPolicies, isPlayer: (id: string) => boolean): (req: ReactionRequest) => ReactionAnswer | 'ask' {
  return (req) => decideBy(isPlayer(req.reactorId) ? policies.player : policies.enemy, req);
}
