/**
 * Kuyruk K54b: imza alt sınıflı 12 sınıf × 3./7./11. seviye duman testi (kural sürümü 27, bütün imza ev kuralları
 * açık; Druid SRD alt sınıfıyla): iki taraf yapay zekâyla 6 tur, hazır yüzeyli Ortamlar Diyarı'nda; çökme yok.
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { classData, classes, getMonster } from '../data';
import { playBattle } from './balance';
import { seededRng as seeded } from '../rules/dice';

const IMZA = classData.subclasses.filter((s) => s.ev && s.id.startsWith('imza_'));
const RULES = Object.fromEntries(IMZA.filter((s) => s.evKurali).map((s) => [s.evKurali as string, true]));

describe('K54b: imza alt sınıflı 12 sınıf × 3/7/11 duman testi (sürüm 27)', () => {
  it.each([3, 7, 11])('seviye %i: savaş çökmeden oynanır', (level) => {
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(27);
    for (const cls of classes) {
      const sub = IMZA.find((s) => s.class === cls.id);
      const sheet = { ...newCharacter(`k54b-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id), ...(sub ? { subclassId: sub.id } : {}) };
      const pcs = [0, 1].map((i) => ({ ...combatantFromSheet(sheet, { id: `P${i}`, ownerId: 'p1' }), side: 'party' as const }));
      const foes = (level >= 7 ? ['ogre', 'owlbear', 'goblin-warrior'] : ['goblin-warrior', 'wolf', 'goblin-warrior']).map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
      const rng = seeded(level * 54 + cls.id.length);
      const session = createMapBattle([...pcs, ...foes], { mapId: 'ortamlar-diyari', variantId: 'gunduz', mirrored: false }, rng);
      const state = { ...session.state, houseRules: { ...session.state.houseRules, ...RULES } };
      const r = execute(state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
      expect(r.ok, `${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      expect(r.state.kuralSurumu).toBe(CURRENT_RULES);
      if (sub) expect(r.state.combatants.P0?.imza, `${cls.id}/${level} imza`).toBe(sub.id);
      const end = playBattle(r.state, rng, 6);
      expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    }
  }, 240_000);
});
