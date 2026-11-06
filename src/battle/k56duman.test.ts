/**
 * Kuyruk K56: duman testi (12 sınıf × 3/7/11 × harita türü: çöl, orman, buzul, bataklık, volkan). Arazi × büyü açık
 * (sürüm 33, varsayılan); savaş kurulup sekiz tur oynanır, çökme yok.
 */
import { describe, expect, it } from 'vitest';
import { classes, getMonster } from '../data';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from './create';
import { createMapBattle } from '../app/setup';
import { execute } from './commands';
import { playBattle } from '../sim/balance';
import { seededRng } from '../rules/dice';

const MAPS: Array<[string, string]> = [['col', 'gunduz'], ['orman-oduncu-kampi', 'gunduz'], ['buzul-acik', 'gunduz'], ['batak-adalar', 'gunduz'], ['volkan', 'normal']];

function smoke(level: number, mapId: string, variantId: string): number {
  let n = 0;
  for (const cls of classes) {
    const sheet = { ...newCharacter(`k56-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id) };
    const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
    const foes = ['ogre', 'bandit'].map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
    const rng = seededRng(level * 53 + cls.id.length + mapId.length);
    const session = createMapBattle([pc, ...foes], { mapId, variantId, mirrored: false }, rng);
    const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
    expect(r.ok, `${cls.id}/${level}/${mapId}`).toBe(true);
    if (!r.ok) continue;
    expect(r.state.kuralSurumu).toBeGreaterThanOrEqual(33);
    expect(playBattle(r.state, rng, 8).round, `${cls.id}/${level}/${mapId}`).toBeGreaterThan(0);
    n += 1;
  }
  return n;
}

describe('K56 duman: 12 sınıf × 3/7/11 × harita türü', () => {
  for (const [mapId, variantId] of MAPS) {
    it.each([3, 7, 11])(`${mapId}, seviye %i: çökme yok`, (level) => { expect(smoke(level, mapId, variantId)).toBe(12); }, 240_000);
  }
});
