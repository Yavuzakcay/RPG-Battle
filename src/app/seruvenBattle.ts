/**
 * Kuyruk 31: Serüven düğümü ↔ savaş. Yolculuğun parçaları yeniden kullanılır: düğümün durağı (`nodeStop`) tek duraklı
 * bir yolculuk durumuna konur, katılımcılar ve XP `stopParticipants`, savaş `createMapBattle`, sonuç
 * `battleResultCommand` (karakter durumları `applyBattleResult`). Gece seçiliyse haritanın gece varyantı (ya da düğümün
 * gece senaryosu); "keşfe devam" açıksa savaş `explore` ile kurulur (çıkış = parti başlangıç altıgenleri).
 */
import type { BattleState } from '../battle';
import { goalsFromData } from '../battle/goals';
import { getMap } from '../map/maps';
import type { Rng } from '../rules/dice';
import type { JourneyState } from '../journey/types';
import { nodeKey, nodeStop, pageById, toggleOn, type SeruvenNode, type SeruvenState } from '../journey/seruven';
import { battleResultCommand, stopParticipants } from './journeyBattle';
import { createMapBattle } from './setup';
import type { Session } from '../ui/session';

export function seruvenNode(s: SeruvenState, nodeId: string): SeruvenNode | undefined {
  return pageById(s.page)?.nodes.find((n) => n.id === nodeId);
}
export const isNight = (s: SeruvenState, nodeId: string) => s.night.includes(nodeKey(s.page, nodeId));

/** Düğümün tek duraklı yolculuk durumu (yolculuk savaş parçalarına verilir). */
export function nodeJourney(s: SeruvenState, nodeId: string): JourneyState | null {
  const node = seruvenNode(s, nodeId);
  const stop = node ? nodeStop(node, s.level, isNight(s, nodeId)) : null;
  if (!stop) return null;
  return {
    id: `seruven:${s.id}`, route: { id: 'seruven', name: { tr: 'Serüven', en: 'Adventure' }, level: s.level, stops: [stop] },
    seed: s.seed, difficulty: 'normal', progression: 'milestone', stop: 0, stopDone: false, hour: 0, lastLongRest: 0, shortRests: 0,
    gold: s.gold, potions: s.potions, xp: s.xp, level: s.level, party: s.party, result: null, flags: s.flags,
  };
}

/** Haritanın gece varyantı var mı (düğümde gündüz/gece anahtarı). */
export function nightVariant(s: SeruvenState, nodeId: string): string | null {
  const node = seruvenNode(s, nodeId);
  const j = node ? nodeJourney({ ...s, night: [] }, nodeId) : null;
  const p = j ? stopParticipants(j) : null;
  if (!node || !p?.scenario.map) return null;
  if (node.gece) return 'gece';
  const m = getMap(p.scenario.map.mapId);
  return m.variants.some((v) => v.id === 'gece') ? 'gece' : null;
}

/** Düğümün savaş oturumu (kurulumda; Game Master yerine oyuncu yerleştirir ve başlatır). */
export function seruvenBattleSession(s: SeruvenState, nodeId: string, rng: Rng): Session | null {
  const j = nodeJourney(s, nodeId);
  const p = j ? stopParticipants(j) : null;
  if (!j || !p?.scenario.map) return null;
  const stop = j.route.stops[0];
  const night = isNight(s, nodeId) && !seruvenNode(s, nodeId)?.gece && nightVariant(s, nodeId) === 'gece';
  const goals = stop?.goals ? goalsFromData(stop.goals) : undefined;
  const partyStart = stop?.partyStart?.map(([c, r]) => ({ col: c - 1, row: r - 1 }));
  const map = getMap(p.scenario.map.mapId, { variantId: night ? 'gece' : p.scenario.map.variantId });
  const exits = partyStart ?? map.startZones.players;
  return createMapBattle(p.participants, {
    ...p.scenario.map, ...(night ? { variantId: 'gece' } : {}), mirrored: false, ...(goals ? { goals } : {}),
    ...(partyStart ? { partyStart } : {}),
    ...(toggleOn(s, 'kesfeDevam') ? { explore: { exits } } : {}),
  }, rng);
}

/** Biten savaştan Serüven komutu. */
export function seruvenResultCommand(s: SeruvenState, nodeId: string, final: BattleState) {
  const j = nodeJourney(s, nodeId);
  if (!j) return null;
  const r = battleResultCommand(j, final);
  if (r.type !== 'battle_result') return null;
  return { type: 'battle_result' as const, node: nodeId, outcome: r.outcome, statuses: r.statuses, xp: r.xp, ...(r.flags ? { flags: r.flags } : {}) };
}
