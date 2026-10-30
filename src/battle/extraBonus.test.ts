/**
 * Görev A5: ek bonus eylem kancası (Harp Koleji S10'un kullanım biçimi; Harp dış içerik, verisi depoda yok): genel
 * mekanizma kurgusal bir alt sınıf özelliğiyle (`stat: extraBonusActions`) ve süren etkiyle (`extraBonus`) sınanır.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { replay } from './reduce';
import { extraBonusOf } from './economy';
import { P1, mk, setup, advanceTo } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { classKit } from '../rules/classFeatures';
import { setExternalSubclasses } from '../rules/subclasses';
import { validatePack } from '../content/schema';
import { classData } from '../data';
import type { BattleEvent, BattleState, Command } from './types';

afterEach(() => setExternalSubclasses([]));

const PACK = {
  format: 'rpg-battle-icerik', version: 1, id: 'test-ek-bonus', name: { tr: 'Test', en: 'Test' }, author: 'Test',
  subclasses: [{ id: 'tel-ustasi', class: 'rogue', name: { tr: 'Tel Ustası', en: 'String Master' }, role: { tr: 'Kurgusal (test)', en: 'Fictional (test)' },
    features: [{ id: 'cifte-ezgi', level: 3, name: { tr: 'Çifte Ezgi', en: 'Double Tune' }, description: { tr: 'Her turda bir ek bonus eylem.', en: 'One extra Bonus Action each turn.' },
      status: 'calisir', effect: { type: 'passive', status: 'ok', stat: 'extraBonusActions', value: 1 } }] }],
};

function run(state: BattleState, cmds: Command[]) {
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  let s = state;
  const results: Array<string | null> = [];
  for (const c of cmds) {
    const r = execute(s, c, P1, () => 0.5);
    results.push(r.ok ? null : r.error);
    if (r.ok) { s = r.state; events.push(...r.events); }
  }
  return { s, events, results };
}

describe('ek bonus eylem', () => {
  it('veriden: kurgusal alt sınıf özelliği `stat: extraBonusActions` kitte ve savaşçıda', () => {
    const r = validatePack(PACK, { taken: classData.subclasses.map((x) => x.id), packs: [] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    setExternalSubclasses(r.pack.subclasses);
    expect(classKit('rogue', 3, 'tel-ustasi').extraBonus).toBe(1);
    expect(classKit('rogue', 2, 'tel-ustasi').extraBonus).toBe(0);
    const b = blankCharacter('t').sheet;
    const c = combatantFromSheet({ ...b, name: 'Tel', classId: 'rogue', level: 3, subclassId: 'tel-ustasi' }, { id: 'a', ownerId: 'p1' });
    expect(c.extraBonus).toBe(1);
    expect(c.bonusActions).toEqual(expect.arrayContaining(['dash', 'disengage']));
  });
  it('turda iki bonus eylem (Cunning Action Dash + Disengage), üçüncüsü yok; ek hakkı olmayan ikinciyi yapamaz', () => {
    const base = advanceTo(setup('Düz', { A: { bonusActions: ['dash', 'disengage', 'hide'] } }), 'A');
    const plain = run(base, [{ type: 'dash', actorId: 'A', bonus: true }, { type: 'disengage', actorId: 'A', bonus: true }]);
    expect(plain.results).toEqual([null, 'Bonus eylem bu tur kullanıldı.']);
    const harp = { ...base, combatants: { ...base.combatants, A: { ...base.combatants.A!, extraBonus: 1 } } };
    const two = run(harp, [{ type: 'dash', actorId: 'A', bonus: true }, { type: 'disengage', actorId: 'A', bonus: true }, { type: 'dash', actorId: 'A', bonus: true }]);
    expect(two.results).toEqual([null, null, 'Bonus eylem bu tur kullanıldı.']);
    expect(two.s.combatants.A!.economy.bonusExtraUsed).toBe(1);
    expect(two.events.filter((e) => e.type === 'action_used' && e.extraBonus)).toHaveLength(1);
    expect(replay(two.events)).toEqual(two.s);
  });
  it('süren etkiden ek bonus eylem; sayı toplanır; tur başında yenilenir', () => {
    expect(extraBonusOf(mk('X', { extraBonus: 1, effects: [{ id: 'e', name: 'e', sourceId: 'X', extraBonus: 1 }] }))).toBe(2);
    const base = advanceTo(setup('Düz', { A: { bonusActions: ['dash', 'disengage'], effects: [{ id: 'e', name: 'Ezgi', sourceId: 'A', extraBonus: 1 }] } }), 'A');
    const t1 = run(base, [{ type: 'dash', actorId: 'A', bonus: true }, { type: 'disengage', actorId: 'A', bonus: true }]);
    expect(t1.results).toEqual([null, null]);
    // Bir tur sonra A'nın sırası yeniden: ek hak yenilenmiş.
    let s = t1.s;
    for (let i = 0; i < 4 && (i === 0 || s.order[s.turnIndex] !== 'A'); i++) {
      const id = s.order[s.turnIndex] as string;
      const owner = s.combatants[id]!.ownerId;
      const r = execute(s, { type: 'end_turn', actorId: id }, owner ? { playerId: owner, isGm: false } : { playerId: 'gm', isGm: true }, () => 0.5);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.order[s.turnIndex]).toBe('A');
    expect(s.combatants.A!.economy.bonusExtraUsed ?? 0).toBe(0);
  });
});
