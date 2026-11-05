/**
 * Kuyruk K54b G4: İnfazcı (Rogue imza alt sınıfı; kural sürümü 27):
 * - Hüküm devri: hükümlü 0 cana düşünce (yaşayan hükümlü yokken) yeni hüküm kullanım harcamaz; turda bir.
 * - Müdahale (9): hükümlü 30 ft içindeki bir dosta isabet ettirince tepkiyle hızın yarısı kadar hükümlünün yanına
 *   (fırsat saldırısı yok; K53 varış kancaları) ve ona tek silah saldırısı. Tepki Uncanny Dodge ile ortak.
 * - Peşini Bırakmayan (13): 60 ft içindeki hükümlünün yeri bilinir (gizlenmiş/görünmez olsa da hedef alınır:
 *   `knowsWhere`); hükümlü yürüyüp uzaklaşınca tepki harcamadan hızın yarısı kadar peşinden (turda bir).
 * Saf.
 */
import { imzaOn, imzaPasifler } from './imzaCore';
import { ruleVersion } from './ruleVersion';
import { canReact, reactionUsed, registerAfterAttack, strikeApi } from './reactions';
import { registerCommandEnd } from './turnHooks';
import { registerKnowsWhere } from './sight';
import { withArrival } from './motion';
import { teleportEvent } from './teleport';
import { applyEvents, speedHexes } from './reduce';
import { occupantAt, terrainAt } from './movement';
import { askReaction } from '../rules/reactionChoice';
import { isIncapacitated } from '../rules/conditions';
import { distance, isInside, neighbors, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant } from './types';

export const INFAZ_VERSION = 27;
const MARK = (rogueId: string) => `imza:imza_infazci/verdict:${rogueId}`;
/** Bu savaşçıyı hükümlü ilan etmiş mi. */
export const condemnedBy = (t: Combatant, rogueId: string): boolean => !!t.effects?.some((e) => e.id === MARK(rogueId));
function pasif(state: Pick<BattleState, 'kuralSurumu' | 'map'> & Partial<Pick<BattleState, 'houseRules'>>, r: Combatant | undefined, ozellik: string): Record<string, unknown> | null {
  if (!r || r.imza !== 'imza_infazci' || ruleVersion(state) < INFAZ_VERSION || !imzaOn(state, r.imza)) return null;
  return imzaPasifler(r).find((p) => p.ozellik === ozellik)?.etki ?? null;
}

/** Hüküm devri: önceki hükümlü düştü, yaşayan hükümlü yok, bu tur devredilmedi. */
export function freeVerdict(state: BattleState, r: Combatant): boolean {
  if (ruleVersion(state) < INFAZ_VERSION || r.traitTurns?.['imza:hukum-devir'] === String(state.round)) return false;
  const marked = Object.values(state.combatants).filter((c) => condemnedBy(c, r.id));
  return marked.length > 0 && marked.every((c) => c.hp <= 0 || c.life === 'dead');
}

/** Peşini Bırakmayan: hükümlünün yeri bilinir (60 ft). */
export function pursuitKnows(state: Pick<BattleState, 'kuralSurumu' | 'map'> & Partial<Pick<BattleState, 'houseRules'>>, observer: Combatant, target: Combatant): boolean {
  const prm = pasif(state, observer, 'relentless-pursuit')?.takip as { bilFt: number } | undefined;
  if (!prm || !condemnedBy(target, observer.id) || isIncapacitated(observer.conditions)) return false;
  return !observer.pos || !target.pos || distance(observer.pos, target.pos) * 5 <= prm.bilFt;
}

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
/** Hedefin yanındaki, `steps` altıgen içinde ulaşılabilir (düz uzaklık) en yakın boş altıgen; zaten yanındaysa null. */
function besideWithin(state: BattleState, r: Combatant, t: Combatant, steps: number): Offset | null {
  if (!r.pos || !t.pos || distance(r.pos, t.pos) <= 1) return null;
  return neighbors(t.pos, sizeOf(state)).filter((h) => isInside(h, sizeOf(state)) && !occupantAt(state, h) && terrainAt(state, h).movement !== 'blocked'
    && terrainAt(state, h).movement !== 'deadly' && distance(r.pos as Offset, h) <= steps)
    .sort((a, b) => distance(r.pos as Offset, a) - distance(r.pos as Offset, b) || a.row - b.row || a.col - b.col)[0] ?? null;
}
/** Hedefe doğru en çok `steps` altıgen (yanına varamıyorsa en çok yaklaşan boş altıgen). */
function toward(state: BattleState, r: Combatant, t: Combatant, steps: number): Offset | null {
  const near = besideWithin(state, r, t, steps);
  if (near || !r.pos || !t.pos || distance(r.pos, t.pos) <= 1) return near;
  let best: Offset | null = null;
  for (let row = 0; row < sizeOf(state).rows; row++) for (let col = 0; col < sizeOf(state).cols; col++) {
    const h = { col, row };
    if (distance(r.pos, h) > steps || occupantAt(state, h) || terrainAt(state, h).movement === 'blocked' || terrainAt(state, h).movement === 'deadly') continue;
    if (!best || distance(h, t.pos) < distance(best, t.pos)) best = h;
  }
  return best && distance(best, t.pos) < distance(r.pos, t.pos) ? best : null;
}
const half = (r: Combatant) => Math.max(1, Math.floor(speedHexes(r) / 2));

// Müdahale: hükümlü dosta isabet ettirdi.
registerAfterAttack((state, attackerId, targetId, info, rng) => {
  if (!info.hit) return [];
  const a = state.combatants[attackerId];
  const victim = state.combatants[targetId];
  if (!a || !victim || a.hp <= 0) return [];
  for (const r of Object.values(state.combatants)) {
    if (r.id === attackerId || r.side !== victim.side || r.id === victim.id || r.hp <= 0 || !r.pos || !victim.pos || !canReact(r) || !condemnedBy(a, r.id)) continue;
    const prm = pasif(state, r, 'intervention')?.mudahale as { menzilFt: number } | undefined;
    if (!prm || distance(r.pos, victim.pos) * 5 > prm.menzilFt) continue;
    const api = strikeApi();
    if (!api) return [];
    const spot = besideWithin(state, r, a, half(r));
    const ans = askReaction(rng, { reactorId: r.id, trigger: 'ally', sourceId: a.id, info: { label: 'Müdahale' }, options: [{ id: 'imza-mudahale', name: 'Müdahale' }],
      suggested: spot || (a.pos && distance(r.pos, a.pos) <= 1) ? { option: 'imza-mudahale' } : null });
    if (ans?.option !== 'imza-mudahale') continue;
    const pre: BattleEvent[] = [reactionUsed(r, { id: 'imza-mudahale', name: 'Müdahale' }, 'ally', a.id)];
    const move = spot ? withArrival(applyEvents(state, pre), [], [teleportEvent(r, spot, 'Müdahale')], rng) : [];
    const cur = applyEvents(state, [...pre, ...move]);
    const strike = api.can(cur, r.id, a.id) ? api.strike(cur, r.id, a.id, rng) : [];
    return [...pre, ...move, ...strike];
  }
  return [];
});

// Peşini Bırakmayan: hükümlü yürüyüp uzaklaşınca peşinden (tepkisiz, turda bir).
registerCommandEnd((before, next, _events, cmd, rng) => {
  if (cmd.type !== 'move') return [];
  const t = next.combatants[cmd.actorId];
  const t0 = before.combatants[cmd.actorId];
  if (!t?.pos || !t0?.pos || t.hp <= 0) return [];
  for (const r of Object.values(next.combatants)) {
    if (r.hp <= 0 || !r.pos || r.side === t.side || isIncapacitated(r.conditions) || !condemnedBy(t, r.id)) continue;
    if (!pasif(next, r, 'relentless-pursuit') || r.traitTurns?.['imza:takip'] === String(next.round)) continue;
    if (distance(r.pos, t.pos) <= distance(r.pos, t0.pos) || distance(r.pos, t.pos) <= 1) continue;
    const spot = toward(next, r, t, half(r));
    if (!spot) continue;
    const ans = askReaction(rng, { reactorId: r.id, trigger: 'ally', sourceId: t.id, info: { label: 'Peşini Bırakmayan' }, options: [{ id: 'imza-takip', name: 'Peşini Bırakmayan' }],
      suggested: { option: 'imza-takip' } });
    if (ans?.option !== 'imza-takip') continue;
    const mark: BattleEvent = { type: 'trait_turn', actorId: r.id, trait: 'imza:takip', key: String(next.round) };
    return [mark, ...withArrival(applyEvents(next, [mark]), [], [teleportEvent(r, spot, 'Peşini Bırakmayan')], rng)];
  }
  return [];
});

registerKnowsWhere(pursuitKnows);
export type { Rng };
