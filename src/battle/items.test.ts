/** Kuyruk 43: savaşta iksir (bonus eylem, kendine ya da 5 ft içindeki dosta), envanter azalır, replay aynı. */
import { describe, expect, it } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleState, Combatant } from './index';
import { applyEvents, replay } from './reduce';
import { P1, advanceTo, envId, mk, scripted } from './fixtures';

function arena(): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 5, maxHp: 30, consumables: { 'potion-of-healing': 2 } }),
    mk('C', { ownerId: 'p1', hp: 0, maxHp: 20, life: 'dying', conditions: ['Unconscious'] }),
    mk('B', { side: 'enemies', hp: 20, maxHp: 20 }),
  ];
  return advanceTo(startBattle('it', envId('Düz'), parts, scripted([20, 15], [20, 10], [20, 5])).state, 'A');
}

describe('Kuyruk 43: savaşta iksir', () => {
  it('kendine: 2d4+2 iyileşme, bonus eylem, adet 2 → 1; ikinci içiş aynı turda bonus eylem yok', () => {
    const s = arena();
    const r = execute(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-healing', targetId: 'A' }, P1, scripted([4, 2], [4, 3]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.hp).toBe(5 + 2 + 3 + 2);
    expect(r.state.combatants.A?.consumables?.['potion-of-healing']).toBe(1);
    expect(r.state.combatants.A?.economy.bonus).toBe(true);
    expect(execute(r.state, { type: 'use_item', actorId: 'A', itemId: 'potion-of-healing', targetId: 'A' }, P1, scripted()).ok).toBe(false);
  });
  it('düşmüş dosta içirmek onu kaldırır; düşmana ve olmayan eşyaya olmaz; replay aynı durum', () => {
    const s = arena();
    expect(execute(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-healing', targetId: 'B' }, P1, scripted()).ok).toBe(false);
    expect(execute(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-supreme-healing', targetId: 'A' }, P1, scripted()).ok).toBe(false);
    const r = execute(s, { type: 'use_item', actorId: 'A', itemId: 'potion-of-healing', targetId: 'C' }, P1, scripted([4, 1], [4, 1]));
    if (!r.ok) throw new Error(r.error);
    const c = r.state.combatants.C as Combatant;
    expect([c.hp, c.life, c.conditions.includes('Unconscious')]).toEqual([4, 'alive', false]);
    // Replay uyumu: aynı olaylar başlangıç durumuna uygulanınca aynı durum.
    expect(applyEvents(s, r.events).combatants).toEqual(r.state.combatants);
  });
  it('karakter sayfasındaki iksir savaşçıya adet olarak gelir', async () => {
    const { combatantFromSheet } = await import('./create');
    const { newCharacter } = await import('../rules/builder');
    const sh = { ...newCharacter('x').sheet, itemNames: ['Potion of Healing', 'Ring of Protection'] };
    expect(combatantFromSheet(sh, { id: 'X', ownerId: 'p1' }).consumables).toEqual({ 'potion-of-healing': 1 });
    void replay;
  });
});
