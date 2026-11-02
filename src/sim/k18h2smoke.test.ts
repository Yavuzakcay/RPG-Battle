/**
 * Kuyruk 18 H2: yeni 4.–5. seviye büyüler (Dominate, Polymorph, Telekinesis, Antilife Shell, Arcane Hand, Conjure
 * Elemental, Tree Stride, Resilient Sphere, Wall of Force/Stone) ve yapay zekâ kuralları için 30 tohumluk sim duman
 * testi: 9. seviye Wizard + Druid, üç Ogre'ye karşı Klasik Çöl'de iki taraf da yapay zekâ; çökme yok, taraf
 * değiştirme kapalıyken de oynanır.
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
import type { BattleState, Command } from '../battle/types';

const WIZ = ['Polymorph', 'Dominate Person', 'Telekinesis', 'Arcane Hand', 'Resilient Sphere', 'Wall of Force', 'Wall of Stone', 'Fireball'];
const DRU = ['Antilife Shell', 'Conjure Elemental', 'Tree Stride', 'Dominate Beast', 'Polymorph', 'Cure Wounds'];

function battle(seed: number, off: boolean, cast: Set<string>): BattleState {
  const pcs = ([['wizard', WIZ], ['druid', DRU]] as const).map(([cls, names], i) => {
    const sheet = { ...newCharacter(`k18h2-${cls}`).sheet, classId: cls, level: 9, baseScores: suggestedScores(cls) };
    const c = combatantFromSheet(sheet, { id: `P${i}`, ownerId: `p${i}` });
    return { ...c, side: 'party' as const, spellNames: [...names] };
  });
  const ogre = getMonster('ogre');
  const foes = [1, 2, 3].map((i) => ({ ...combatantFromMonster(ogre, { id: `O${i}`, name: `Ogre ${i}` }), side: 'enemies' as const }));
  const rng = seeded(seed);
  const session = createMapBattle([...pcs, ...foes], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
  const st = off ? { ...session.state, map: { ...session.state.map!, ruleToggles: { ...(session.state.map?.ruleToggles ?? {}), allegianceSwap: false } } } : session.state;
  const r = execute(st, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
  if (!r.ok) throw new Error(r.error);
  let state = r.state;
  const apply = (cmd: Command): boolean => {
    const x = execute(state, cmd, contextFor(state, 'actorId' in cmd ? cmd.actorId : ''), rng);
    if (!x.ok) return false;
    if (cmd.type === 'cast_spell') cast.add(cmd.spellName);
    state = x.state;
    return true;
  };
  for (let guard = 0; guard < 800 && state.status === 'active' && state.round <= 10; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  return state;
}

describe('K18 H2: yeni büyüler sim duman testi', () => {
  it('30 tohum: çökme yok; en az bir yeni büyü yapılır', () => {
    const used = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const end = battle(seed, seed % 5 === 0, used);
      expect(end.round).toBeGreaterThan(0);
    }
    expect([...used].some((x) => [...WIZ, ...DRU].includes(x) && !['Fireball', 'Cure Wounds'].includes(x)), [...used].join(',')).toBe(true);
  }, 300_000);
});
