/**
 * Görev P0 G6: duman testi (12 sınıf × 3/7/11; pilot paket yüklü ve yüklü değilken; pakette karşılığı olan sınıfta
 * paket alt sınıfı), Moral ilkeli (ev kuralı açıkken; kapalıyken sessiz), yapay zekâ adayları.
 */
import { afterEach, describe, expect, it } from 'vitest';
import pilot from '../../../tests/fixtures/paket-pilot.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData, classes } from '../../data';
import { newCharacter, suggestedScores } from '../../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../create';
import { createMapBattle } from '../../app/setup';
import { execute } from '../commands';
import { getMonster } from '../../data';
import { playBattle } from '../../sim/balance';
import { seededRng as seeded } from '../../rules/dice';
import { candidatesFor } from '../ai/actions';
import { kitArena, high, o } from '../k54bKit';
import { mk } from '../fixtures';
import type { AttackOption, Combatant } from '../types';

const load = () => {
  const r = validatePack(pilot, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error('pilot');
  applyPackSubclasses(r.pack.subclasses);
};
afterEach(() => applyPackSubclasses([]));
const PACK_SUB: Record<string, string> = { fighter: 'kehribar-nobetci', ranger: 'ruzgar-kartali', druid: 'kul-cagirani', cleric: 'safak-bekcisi' };

function smoke(level: number, withPack: boolean): number {
  let fights = 0;
  for (const cls of classes) {
    const sub = withPack ? PACK_SUB[cls.id] : undefined;
    const sheet = { ...newCharacter(`p0-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id), ...(sub ? { subclassId: sub } : {}) };
    const pc = { ...combatantFromSheet(sheet, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
    if (sub && level >= 3) expect(pc.paket?.altSinif, `${cls.id}/${level}`).toBe(sub);
    const foes = ['ogre', 'bandit'].map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
    const rng = seeded(level * 41 + cls.id.length);
    const session = createMapBattle([pc, ...foes], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
    const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
    expect(r.ok, `${cls.id}/${level}`).toBe(true);
    if (!r.ok) continue;
    const end = playBattle(r.state, rng, 8);
    expect(end.round, `${cls.id}/${level}`).toBeGreaterThan(0);
    fights += 1;
  }
  return fights;
}

describe('P0 duman: 12 sınıf × 3/7/11', () => {
  it.each([3, 7, 11])('seviye %i, paket yüklü: çökme yok', (level) => { load(); expect(smoke(level, true)).toBe(12); }, 180_000);
  it.each([3, 7, 11])('seviye %i, paket yok: çökme yok', (level) => { expect(smoke(level, false)).toBe(12); }, 180_000);
});

describe('P0 moralEtkisi', () => {
  const sword: AttackOption = { label: 'Kılıç', attackBonus: 8, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
  const kill = (moral: boolean) => {
    load();
    // İkinci düşman: savaş bitmesin (zafer ödülü Moral'i ayrıca artırır).
    const r = kitArena({ cls: 'cleric', sub: 'safak-bekcisi', level: 10, place: { A: o(3, 3), B: o(4, 3), C: o(3, 4), E: o(12, 7) }, extra: [{ ...mk('E', { side: 'enemies', hp: 30, maxHp: 30 }), pos: o(12, 7) } as Combatant] });
    const pc = (id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
    if (moral) r.state = { ...r.state, houseRules: { ...r.state.houseRules, moralSistemi: true } };
    pc('C', { moralMax: 5, moral: 2 });
    pc('A', { weaponOptions: [sword] });
    pc('B', { hp: 1 });
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, high);
    return r.c('C').moral;
  };
  it('Moral açıkken öldürünce dostlara +1; kapalıyken sessiz', () => {
    expect(kill(true)).toBe(3);
    expect(kill(false)).toBe(2);
  });
});

describe('P0 yapay zekâ', () => {
  it('paket düğmeleri aday komut olarak üretilir (kuru çalıştırmayla puanlanır)', () => {
    load();
    const r = kitArena({ cls: 'cleric', sub: 'safak-bekcisi', level: 10, place: { A: o(3, 3), B: o(4, 3), C: o(3, 4) } });
    const a = r.c('A');
    const h = { foes: [r.c('B')], allies: [a, r.c('C')], ok: () => true, threat: () => 1, risk: () => 0, priorityKeys: () => [], canAct: true };
    const keys = candidatesFor(r.state, a, h).filter((c) => c.desc.id === 'paket').map((c) => (c.cmd.type === 'use_feature' ? c.cmd.feature : ''));
    expect(keys).toEqual(expect.arrayContaining(['pk:safak-bekcisi/safak-eli:bonus', 'pk:safak-bekcisi/safak-bicimi:bonus']));
  });
});
