/**
 * Görev KATALOG-F2: kadim yaratıklar savaşta çökmeden oynanır (duman). Klasik Çöl'de iki 20. seviye savaşçıya karşı, iki taraf
 * yapay zekâ, 3 tur; mevcut mekaniklerle (nefes alanı, saldırı ekleri, efsanevi eylem, Legendary Resistance) yaklaşıklanmış
 * kayıtlar komut doğrulamasından geçer. Denge ölçümü değildir (sim hedefi değil).
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { getMonster } from '../data';
import { contextFor } from '../ui/session';
import { chooseCommand } from '../battle/ai';
import { currentActorId } from '../battle/common';
import { seededRng as seeded } from '../rules/dice';
import type { BattleEvent, BattleState, Command } from '../battle/types';

const IDS = ['tutsak-dragon', 'kozmik-anka', 'ocean-nightmare', 'ocean-nightmare-open-sea', 'titan-of-nightmare', 'alphadrake', 'deltyr', 'gamlet'];

function battle(monId: string, seed: number): { state: BattleState; events: BattleEvent[] } {
  const pcs = [0, 1].map((i) => {
    const sheet = { ...newCharacter(`kf2-${i}`).sheet, classId: 'fighter', level: 20, baseScores: suggestedScores('fighter') };
    return { ...combatantFromSheet(sheet, { id: `P${i}`, ownerId: `p${i}` }), side: 'party' as const };
  });
  const foe = { ...combatantFromMonster(getMonster(monId), { id: 'K', name: monId }), side: 'enemies' as const };
  const rng = seeded(seed);
  const session = createMapBattle([...pcs, foe], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
  const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
  if (!r.ok) throw new Error(r.error);
  let state = r.state;
  const events: BattleEvent[] = [...r.events];
  const apply = (cmd: Command): boolean => {
    const x = execute(state, cmd, contextFor(state, 'actorId' in cmd ? cmd.actorId : ''), rng);
    if (!x.ok) return false;
    events.push(...x.events);
    state = x.state;
    return true;
  };
  for (let guard = 0; guard < 300 && state.status === 'active' && state.round <= 3; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  return { state, events };
}

describe('KATALOG-F2: kadim yaratık savaş dumanı', () => {
  it('8 kayıt × 2 tohum (Dragon of Hexonia yalnız dost: simülasyonda yok): çökme yok, yaratık saldırır', () => {
    for (const id of IDS) for (const seed of [1, 2]) {
      const { state, events } = battle(id, seed);
      expect(state.round, id).toBeGreaterThan(0);
      expect(events.some((e) => ('actorId' in e && e.actorId === 'K') && (e.type === 'attack_resolved' || e.type === 'save_resolved' || e.type === 'area_used')), `${id}/${seed}`).toBe(true);
    }
  }, 300_000);
});
