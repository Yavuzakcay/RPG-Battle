/** Çağırma arayüzü (Görev R3): büyü menüsü türü, çağırma altıgenleri, "Yapay zekâ oynasın", günlük satırları (TR/EN). */
import { describe, it, expect } from 'vitest';
import { startBattle } from '../battle/create';
import { mk, scripted } from '../battle/fixtures';
import { distance, type Offset } from '../rules/hex';
import type { BattleState, Combatant } from '../battle/types';
import { spells } from '../data';
import { spellMenu, summonHexes } from './hud';
import { autoplaySummonTurn } from './autoplay';
import { createSession, dispatch } from './session';
import { setLang } from '../i18n';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };

function arena(): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, proficiency: 3, spellNames: ['Find Steed', 'Find Familiar'], spellSlots: [2, 2, 0, 0, 0, 0, 0, 0, 0] }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw] }),
  ];
  const s = startBattle('s', 'd-z-zemin', parts, scripted([20, 18], [20, 5]), { map: { id: 'col' } }).state;
  const combatants = { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(3, 3) }, B: { ...(s.combatants.B as Combatant), pos: o(6, 3) } };
  return { ...s, status: 'active', turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const steed = spells.find((s) => s.name === 'Find Steed')!;

describe('çağırma arayüzü', () => {
  it('menüde Find Steed "summon"; ritüel (Find Familiar) savaş menüsünde yok', () => {
    const menu = spellMenu(arena().combatants.A as Combatant);
    expect(menu.map((m) => [m.spell.name, m.kind])).toEqual([['Find Steed', 'summon']]);
  });
  it('çağırma altıgenleri: 30 ft içinde, boş', () => {
    const hexes = summonHexes(arena(), 'A', steed, 'fey');
    expect(hexes.length).toBeGreaterThan(20);
    expect(hexes.every((h) => distance(h, o(3, 3)) <= 6)).toBe(true);
    expect(hexes.some((h) => h.col === 6 && h.row === 3)).toBe(false);
  });
  it('"Yapay zekâ oynasın": at düşmana yürür/saldırır ve turu biter; günlük TR ve EN', () => {
    let s = createSession(arena(), []);
    s = dispatch(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Steed', targetHex: o(4, 3) }, scripted());
    expect(s.error).toBeNull();
    s = dispatch(s, { type: 'end_turn', actorId: 'A' }, scripted());
    const id = s.state.order[s.state.turnIndex] as string;
    expect(s.state.combatants[id]?.summon).toBeTruthy();
    const after = autoplaySummonTurn(s, scripted(...Array.from({ length: 20 }, () => [20, 15] as [number, number])));
    expect(after.events.some((e) => e.type === 'attack_resolved' && e.actorId === id)).toBe(true);
    expect(after.state.order[after.state.turnIndex]).toBe('B');
    expect(s.lines.some((l) => l.includes('Otherworldly Steed (A)') && l.includes('çağırdı'))).toBe(true);
    setLang('en');
    try {
      const en = dispatch(createSession(arena(), []), { type: 'cast_spell', actorId: 'A', spellName: 'Find Steed', targetHex: o(4, 3) }, scripted());
      expect(en.lines.some((l) => l.includes('summons Otherworldly Steed (A)'))).toBe(true);
    } finally { setLang('tr'); }
  });
});
