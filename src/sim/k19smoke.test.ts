/**
 * Kuyruk 19 (görev 11): 12 sınıf × 12., 16. ve 20. seviye duman testi (6.–9. seviye büyüler, Mystic Arcanum, Epic Boon…):
 * oluşturucu sheet'i savaşçıya döner, iki taraf da yapay zekâyla Klasik Çöl haritasında 6 tur oynar; çökme yok.
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { classes, getMonster } from '../data';
import { playBattle } from './balance';
import { seededRng as seeded } from '../rules/dice';

describe('Kuyruk 19: 12 sınıf × 12/16/20 duman testi', () => {
  it.each([12, 16, 20])('seviye %i: savaş çökmeden oynanır', (level) => {
    for (const cls of classes) {
      const sheet = { ...newCharacter(`k19-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
      const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
      const foes = ['stone-giant', 'young-blue-dragon'].map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
      const rng = seeded(level * 37 + cls.id.length);
      const session = createMapBattle([pc, ...foes], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
      const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
      expect(r.ok, `${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      const end = playBattle(r.state, rng, 6);
      expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    }
  }, 180_000);
});
