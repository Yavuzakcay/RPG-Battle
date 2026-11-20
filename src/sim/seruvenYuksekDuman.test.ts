/** 2026-11-19: Serüven 6+ seviye düşman planıyla hızlı duman (denge ölçümü değil): 12 sınıf × 6/12/20, iki senaryo. */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { classes, getMonster } from '../data';
import { SCENARIOS, playBattle } from './balance';
import { seruvenEnemyPlan } from '../journey/seruvenEnemies';
import { seededRng as seeded } from '../rules/dice';

describe('Serüven 6+ düşman planı duman', () => {
  it.each([6, 12, 20])('seviye %i: 12 sınıf × orman-ork, magara çökmeden oynar', (level) => {
    for (const scId of ['orman-ork', 'magara']) {
      const sc = SCENARIOS.find((s) => s.id === scId)!;
      const plan = seruvenEnemyPlan(sc, level, { ozel: false, partySize: 1, seed: `duman:${scId}:${level}` });
      expect(plan.kaynak).not.toBe('bes');
      for (const cls of classes) {
        const sheet = { ...newCharacter(`d-${cls.id}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
        const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
        const foes = Object.entries(plan.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, i) => ({ ...combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: id }), side: 'enemies' as const })));
        const rng = seeded(level * 31 + cls.id.length);
        const session = createMapBattle([pc, ...foes], { ...sc.map!, mirrored: false }, rng);
        const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
        expect(r.ok, `${scId}/${cls.id}/${level}`).toBe(true);
        if (r.ok) expect(playBattle(r.state, rng, 4).round).toBeGreaterThan(0);
      }
    }
  }, 240_000);
});
