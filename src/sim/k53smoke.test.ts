/**
 * Kuyruk K53 S6: 12 sınıf × 3./7./11. seviye duman testi (kural sürümü 24: ışınlanma varışı, zorla hareket + çarpma,
 * nesne hareketi, geçici engel, aura altyapısı açık): iki taraf yapay zekâyla Klasik Kale haritasında 6 tur; çökme yok.
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { classes, getMonster } from '../data';
import { playBattle } from './balance';
import { seededRng as seeded } from '../rules/dice';

describe('K53: 12 sınıf × 3/7/11 duman testi (sürüm 24)', () => {
  it.each([3, 7, 11])('seviye %i: savaş çökmeden oynanır', (level) => {
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(24);
    for (const cls of classes) {
      const sheet = { ...newCharacter(`k53-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
      const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
      const foes = (level >= 7 ? ['ogre', 'owlbear'] : ['goblin-warrior', 'wolf']).map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
      const rng = seeded(level * 53 + cls.id.length);
      const session = createMapBattle([pc, ...foes], { mapId: 'kale', variantId: 'gunduz', mirrored: false }, rng);
      const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
      expect(r.ok, `${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      expect(r.state.kuralSurumu).toBe(CURRENT_RULES);
      const end = playBattle(r.state, rng, 6);
      expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    }
  }, 180_000);
});
