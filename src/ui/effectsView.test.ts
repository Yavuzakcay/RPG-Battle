/** Süren etkilerin görünümü (Görev R2): kart satırları, jeton simgeleri, büyü menüsü ve çoklu hedef. */
import { describe, it, expect } from 'vitest';
import { setup } from '../battle/fixtures';
import { combatantFromSheet } from '../battle/create';
import { spells } from '../data';
import type { Combatant } from '../battle';
import { effectIcons, effectRows } from './effectsView';
import { effectTargets, spellMenu } from './hud';

describe('etki görünümü', () => {
  it('etki satırı: simge, kaynak, kalan tur ya da konsantrasyon; düşman etkisi zararlı', () => {
    const s = setup('Düz', { C: { effects: [{ id: 'spells:bless', name: 'Bless', sourceId: 'A', until: 10, concentration: 'Bless', dice: { die: '1d4', sign: 1, on: ['attack', 'save'] } }] },
      B: { effects: [{ id: 'spells:bane', name: 'Bane', sourceId: 'A', until: 3, dice: { die: '1d4', sign: -1, on: ['attack'] } }], tempHp: 4 } });
    const c = effectRows(s, s.combatants.C as Combatant)[0];
    expect(c).toMatchObject({ icon: '✨', name: 'Bless', harmful: false });
    expect(c?.detail).toContain('A');
    const b = effectRows(s, s.combatants.B as Combatant);
    expect(b.map((r) => r.harmful)).toEqual([true, false]);
    expect(effectIcons(s, s.combatants.B as Combatant).map((x) => x.icon)).toEqual(['⛓', '💠']);
  });
  it('etki büyüsü menüde kendi kipinde; Bless yalnızca dostları hedefler', () => {
    const cleric = combatantFromSheet({ name: 'T', raceId: 'human', classId: 'cleric', level: 3, subclassId: 'life-domain', armorName: 'Zırhsız', shield: false,
      itemNames: [], spellNames: ['Bless'], baseScores: { str: 10, dex: 10, con: 12, int: 10, wis: 16, cha: 10 } }, { id: 'A', ownerId: 'p1' });
    expect(spellMenu(cleric).find((x) => x.spell.name === 'Bless')?.kind).toBe('effect');
    const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...f } = cleric;
    const s = setup('Düz', { A: f });
    const at = { ...s, turnIndex: s.order.indexOf('A') };
    const bless = spells.find((x) => x.name === 'Bless');
    expect(bless && effectTargets(at, 'A', bless).sort()).toEqual(['A', 'C']);
  });
});
