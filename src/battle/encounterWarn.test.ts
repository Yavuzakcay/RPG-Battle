/** Denge turu (madde 6): yenilenen düşman + ateş/asitsiz parti uyarısı. */
import { describe, expect, it } from 'vitest';
import { combatantFromMonster, combatantFromSheet } from './create';
import { getMonster } from '../data';
import { partyAt } from '../sim/balance';
import { regenWarning } from './encounterWarn';

const foes = () => [combatantFromMonster(getMonster('troll'), { id: 't1', name: 'Troll 1' }), combatantFromMonster(getMonster('troll'), { id: 't2', name: 'Troll 2' }),
  combatantFromMonster(getMonster('ogre'), { id: 'o1', name: 'Ogre 1' })];
const party = (kind: string) => partyAt(9, kind).map((s, i) => combatantFromSheet(s, { id: `p${i}`, ownerId: `p${i}` }));

describe('regenWarning', () => {
  it('Wizard\'sız (Barbarian) partide Troll uyarısı; Wizard\'lı standart partide yok; Troll yoksa yok', () => {
    expect(regenWarning([...party('k18-barbarian'), ...foes()])).toEqual(['Troll']);
    expect(regenWarning([...party('standart'), ...foes()])).toEqual([]);
    expect(regenWarning([...party('k18-barbarian'), ...foes().slice(2)])).toEqual([]);
  });
});
