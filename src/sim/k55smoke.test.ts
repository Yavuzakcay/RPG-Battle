/**
 * Kuyruk K55: 12 sınıf × 3./7./11. seviye duman testi (kural sürümü 26: altıgen etki çözücüsü) hazır yüzeyli Ortamlar
 * Diyarı haritasında (yağ, su, buz, alev, zehir…): iki taraf yapay zekâyla 6 tur; çökme yok.
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

describe('K55: 12 sınıf × 3/7/11 duman testi (sürüm 26, yüzeyli harita)', () => {
  it.each([3, 7, 11])('seviye %i: savaş çökmeden oynanır', (level) => {
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(26);
    for (const cls of classes) {
      const sheet = { ...newCharacter(`k55-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
      const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
      const foes = (level >= 7 ? ['ogre', 'owlbear'] : ['goblin-warrior', 'wolf']).map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
      const rng = seeded(level * 55 + cls.id.length);
      const session = createMapBattle([pc, ...foes], { mapId: 'ortamlar-diyari', variantId: 'gunduz', mirrored: false }, rng);
      const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
      expect(r.ok, `${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      expect(r.state.kuralSurumu).toBe(CURRENT_RULES);
      const end = playBattle(r.state, rng, 6);
      expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    }
  }, 180_000);
});
