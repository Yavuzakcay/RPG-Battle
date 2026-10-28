/**
 * Çağırma duman testi (Görev R3): Paladin partisi (5. seviye) dört gerçek senaryoda; Paladin ilk turunda Find Steed
 * yapar (Faithful Steed, slotsuz), sonra savaşı yapay zekâ iki taraf için oynar. Çağrılan at gerçekten savaşmalı
 * (saldırı yapmalı) ve olaylar baştan oynatılınca aynı durum çıkmalı.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { SCENARIOS, seeded, setPartyKind, setupBattle } from './balance';
import { chooseCommand } from '../battle/ai';
import { currentActorId, execute, replay, type BattleEvent, type BattleState, type Command } from '../battle';
import { contextFor } from '../ui/session';

function fight(id: string, seed: number): { steedAttacks: number; summoned: boolean; replayOk: boolean } {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) throw new Error(id);
  const rng = seeded(seed);
  let state: BattleState = setupBattle(scenario, rng, 5);
  const log: BattleEvent[] = [{ type: 'battle_started', state }];
  const apply = (cmd: Command): boolean => {
    const r = execute(state, cmd, contextFor(state, 'actorId' in cmd ? cmd.actorId : ''), rng);
    if (!r.ok) return false;
    state = r.state;
    log.push(...r.events);
    return true;
  };
  let summoned = false;
  for (let guard = 0; guard < 2000 && state.status === 'active' && state.round <= 20; guard++) {
    const actorId = currentActorId(state);
    const actor = state.combatants[actorId];
    // Paladin ilk turunda atını çağırır (yer: kendisine en yakın uygun altıgen).
    if (!summoned && actor?.spellNames.includes('Find Steed')) {
      summoned = apply({ type: 'cast_spell', actorId, spellName: 'Find Steed', choice: 'celestial' });
    }
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  const steeds = new Set(Object.values(state.combatants).filter((c) => c.summon?.spellId === 'find-steed').map((c) => c.id));
  const steedAttacks = log.filter((e) => (e.type === 'attack_resolved' || e.type === 'save_resolved') && steeds.has(e.actorId)).length;
  return { steedAttacks, summoned, replayOk: JSON.stringify(replay(log)) === JSON.stringify(state) };
}

describe('çağırma duman testi (Paladin, 5. seviye, Find Steed)', () => {
  afterAll(() => setPartyKind('standart'));
  for (const id of ['col', 'orman', 'dungeon', 'kale']) {
    it(`${id}: at çağrılır, savaşır; replay aynı`, () => {
      setPartyKind('paladin');
      const runs = [1, 2, 3].map((seed) => fight(id, seed));
      expect(runs.every((r) => r.summoned)).toBe(true);
      expect(runs.reduce((n, r) => n + r.steedAttacks, 0)).toBeGreaterThan(0);
      expect(runs.every((r) => r.replayOk)).toBe(true);
    });
  }
});
