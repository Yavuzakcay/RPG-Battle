/**
 * Kuyruk 17 G2: 12 sınıf × 6., 8. ve 10. seviye duman testi: oluşturucu sheet'i (önerilen puanlar) savaşçıya döner,
 * iki taraf da yapay zekâyla Klasik Çöl haritasında 6 tur oynar; çökme yok.
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { classes, getMonster } from '../data';
import { playBattle } from './balance';
import { seededRng as seeded } from '../rules/dice';

describe('K17 G2: 12 sınıf × 6/8/10 duman testi', () => {
  it.each([6, 8, 10])('seviye %i: savaş çökmeden oynanır', (level) => {
    for (const cls of classes) {
      const sheet = { ...newCharacter(`k17-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
      const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
      const ogre = getMonster('ogre');
      const foes = [1, 2].map((i) => ({ ...combatantFromMonster(ogre, { id: `O${i}`, name: `Ogre ${i}` }), side: 'enemies' as const }));
      const rng = seeded(level * 31 + cls.id.length);
      const session = createMapBattle([pc, ...foes], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
      const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
      expect(r.ok, `${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      const end = playBattle(r.state, rng, 6);
      expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    }
  }, 120_000);
});
