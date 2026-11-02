/**
 * Kuyruk 17 G3: dış alt sınıf motor doğrulaması (veri kullanıcıda; burada yalnızca kurgusal paketler). Harp Koleji S10
 * kullanımı (10. seviyede ek bonus eylem), Biat Yemini S3 kullanımı (dış paketten tasma özelliği, A4 kancası), etkin seviye
 * max(seviye, 3) kuralı ve onaylı uyarlamaların seviyelerinde kurgusal yer tutucularla savaş duman testi.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { validatePack } from './schema';
import { setExternalSubclasses } from '../rules/subclasses';
import { classKit } from '../rules/classFeatures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { classData, getMonster } from '../data';
import { playBattle } from '../sim/balance';
import { seededRng } from '../rules/dice';
import type { Combatant } from '../battle/types';

afterEach(() => setExternalSubclasses([]));
const name = (tr: string) => ({ tr, en: tr });
const pack = (subclasses: unknown[]) => {
  const r = validatePack({ format: 'rpg-battle-icerik', version: 1, id: 'k17-test', name: name('K17 test'), author: 'Test', subclasses },
    { taken: classData.subclasses.map((x) => x.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  setExternalSubclasses(r.pack.subclasses);
};
const feature = (id: string, level: number, effect: Record<string, unknown>) =>
  ({ id, level, name: name(id), description: name('Kurgusal (test)'), status: 'calisir', effect: { status: 'ok', ...effect } });

describe('K17 G3: dış alt sınıf motoru', () => {
  it('Harp S10 kullanımı: 10. seviye özelliği ek bonus eylem verir, 9. seviyede yok', () => {
    pack([{ id: 'k17-harp', class: 'bard', name: name('Harp (kurgusal)'), role: name('test'),
      features: [feature('s10-ek', 10, { type: 'passive', stat: 'extraBonusActions', value: 1 })] }]);
    expect(classKit('bard', 9, 'k17-harp').extraBonus).toBe(0);
    expect(classKit('bard', 10, 'k17-harp').extraBonus).toBe(1);
  });
  it('etkin seviye max(seviye, 3): 1. seviye özelliği 3. seviyede gelir, 2. seviyede gelmez', () => {
    pack([{ id: 'k17-erken', class: 'rogue', name: name('Erken (kurgusal)'), role: name('test'),
      features: [feature('s1-ek', 1, { type: 'passive', stat: 'extraBonusActions', value: 1 })] }]);
    expect(classKit('rogue', 2, 'k17-erken').extraBonus).toBe(0);
    expect(classKit('rogue', 3, 'k17-erken').extraBonus).toBe(1);
  });
  it('Biat S3 kullanımı: dış paketten tasma özelliği savaşçıda kullanılabilir özellik olur', () => {
    pack([{ id: 'k17-biat', class: 'paladin', name: name('Biat (kurgusal)'), role: name('test'),
      features: [feature('s3-tasma', 3, { type: 'action', effect: { kind: 'leash', rangeFt: 30, radiusFt: 30, save: 'wis', rounds: 10 } })] }]);
    const b = blankCharacter('t').sheet;
    const c = combatantFromSheet({ ...b, name: 'B', classId: 'paladin', level: 3, subclassId: 'k17-biat', baseScores: suggestedScores('paladin') }, { id: 'a', ownerId: 'p1' });
    expect(c.features?.some((f) => f.effect.kind === 'leash')).toBe(true);
  });
  it('K17 işaretleri dış içerikte tanınır (empowered-strikes, aura-of-courage…)', () => {
    expect(() => pack([{ id: 'k17-isaret', class: 'monk', name: name('İşaret'), role: name('test'),
      features: [feature('isaret-a', 6, { type: 'passive', trait: 'empowered-strikes' }), feature('isaret-b', 10, { type: 'passive', trait: 'self-restoration' })] }])).not.toThrow();
  });
});

/** Onaylı uyarlamaların sınıf/seviyelerinde kurgusal yer tutucular (gerçek veri kullanıcının paketinde). */
const STANDINS: Array<[string, string, number, Record<string, unknown>]> = [
  ['samuray', 'fighter', 18, { type: 'passive', trait: 'indomitable' }],
  ['capkin-kavalye', 'rogue', 18, { type: 'passive', trait: 'elusive' }],
  ['paradoks', 'wizard', 14, { type: 'passive', trait: 'potent-cantrip' }],
  ['ilkelligin-yolu', 'barbarian', 10, { type: 'passive', trait: 'mindless-rage' }],
  ['muhafiz-yemini', 'paladin', 3, { type: 'passive', trait: 'aura-of-courage' }],
  ['muhterem', 'cleric', 14, { type: 'passive', trait: 'potent-spellcasting' }],
  ['diriltme-ogretisi', 'wizard', 14, { type: 'passive', trait: 'empowered-evocation' }],
  ['zebani', 'warlock', 14, { type: 'passive', trait: 'fiendish-vigor' }],
  ['serap', 'sorcerer', 6, { type: 'passive', stat: 'speed', value: 10 }],
  ['silahsor', 'fighter', 9, { type: 'passive', stat: 'extraBonusActions', value: 1 }],
];

describe('K17 G3: onaylı uyarlamalar, seviyelerinde duman testi (kurgusal yer tutucu)', () => {
  it.each(STANDINS)('%s (%s %i): özellik savaşçıda, savaş 5 tur çökmeden oynanır', (id, cls, level, effect) => {
    pack([{ id: `k17-${id}`, class: cls, name: name(id), role: name('test'), features: [feature(`${id}-oz`, level, effect)] }]);
    const b = blankCharacter(id).sheet;
    const pc = { ...combatantFromSheet({ ...b, name: id, classId: cls, level, subclassId: `k17-${id}`, baseScores: suggestedScores(cls) }, { id: 'P', ownerId: 'p1' }), side: 'party' as const };
    if (effect.trait) expect(pc.traits, id).toContain(effect.trait);
    const ogre = getMonster('ogre');
    const foes: Combatant[] = [1, 2].map((i) => ({ ...combatantFromMonster(ogre, { id: `O${i}`, name: `Ogre ${i}` }), side: 'enemies' as const }));
    const rng = seededRng(level * 7 + id.length);
    const session = createMapBattle([pc, ...foes], { mapId: 'col', variantId: 'gunduz', mirrored: false }, rng);
    const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
    expect(r.ok).toBe(true);
    if (r.ok) expect(playBattle(r.state, rng, 5).round).toBeGreaterThan(0);
  });
});
