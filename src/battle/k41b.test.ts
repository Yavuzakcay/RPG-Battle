/**
 * Kuyruk 41b: K40'ta "karar bekliyor" / "yeni sistem" kalan büyülerden ucuz olanlar yaklaşık uygulandı
 * (Death Ward, Animate Objects, Giant Insect, Guardian of Faith, Faithful Hound, Mislead, Contagion).
 */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleState, Command, Combatant } from './index';
import { damageEffects } from './damage-effects';
import { applyEvents } from './reduce';
import { spells } from '../data';
import { P1, advanceTo, envId, mk, scripted } from './fixtures';

function arena(names: string[]): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', initiativeBonus: 2, level: 9, spellMod: 4, spellSaveDc: 15, spellAttack: 7, spellNames: names,
      casterTag: 'human cleric', spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0], hp: 20, maxHp: 50 }),
    mk('B', { side: 'enemies', hp: 80, maxHp: 80 }),
    mk('C', { ownerId: 'p2', initiativeBonus: 1, hp: 5, maxHp: 40 }),
  ];
  return advanceTo(startBattle('k41b', envId('Düz'), parts, scripted([20, 10], [20, 15], [20, 15])).state, 'A');
}
function run(s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rolls: number[]) {
  const r = execute(s, { type: 'cast_spell', actorId: 'A', ...cmd } as Command, P1, scripted(...rolls.map((x) => [20, x] as [number, number])));
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe('Kuyruk 41b: yaklaşık uygulanan 4.–5. seviye büyüler', () => {
  it('Death Ward: ilk 0 HP yerine 1 HP, etki biter; ikinci kez korumaz', () => {
    const s = run(arena(['Death Ward']), { spellName: 'Death Ward', targetIds: ['C'] }, []).state;
    const c = s.combatants.C as Combatant;
    expect(c.effects?.some((e) => e.deathWard)).toBe(true);
    const hit = damageEffects(c, 30, 'slashing', false, scripted());
    expect(hit.hpAfter).toBe(1);
    expect(hit.effects.some((e) => e.kind === 'death_ward')).toBe(true);
    const after = applyEvents(s, [{ type: 'save_resolved', actorId: 'B', targetId: 'C', label: 'Test', ability: 'dex', dc: 30, mode: 'normal',
      reasons: [], d20: [1], natural: 1, total: 1, success: false, damageRolls: [30], rawDamage: 30, appliedDamage: 30, damageType: 'slashing',
      damageNote: null, targetHpAfter: hit.hpAfter, effects: hit.effects, conditionsAdded: [] } as never]);
    const c2 = after.combatants.C as Combatant;
    expect(c2.hp).toBe(1);
    expect(c2.effects?.some((e) => e.deathWard) ?? false).toBe(false);
    expect(damageEffects(c2, 30, 'slashing', false, scripted()).hpAfter).toBe(0);
  });
  it('Animate Objects: büyü yeteneği değiştiricisi kadar (4) Medium nesne, Slam 1d4+3 force; 6. slotta 2d4', () => {
    const r = run(arena(['Animate Objects']), { spellName: 'Animate Objects' }, []);
    const made = r.events.filter((e) => e.type === 'summoned');
    expect(made.length).toBe(4);
    const o = made[0]?.type === 'summoned' ? made[0].combatant : undefined;
    expect(o?.ac).toBe(15);
    expect(o?.maxHp).toBe(10);
    expect(o?.attacks[0]?.damageDice).toBe('1d4+3');
  });
  it('Giant Insect: 4. slotta AC 15, HP 30, iki Poison Jab (1d6+7)', () => {
    const r = run(arena(['Giant Insect']), { spellName: 'Giant Insect' }, []);
    const ev = r.events.find((e) => e.type === 'summoned');
    const g = ev?.type === 'summoned' ? ev.combatant : undefined;
    expect(g?.ac).toBe(15);
    expect(g?.maxHp).toBe(30);
    expect(g?.attacks[0]).toMatchObject({ damageDice: '1d6+7', repeat: 2 });
  });
  it('Mislead: kendine Invisible, saldırınca biter', () => {
    const s = run(arena(['Mislead']), { spellName: 'Mislead', targetIds: ['A'] }, []).state;
    const fx = s.combatants.A?.effects?.[0];
    expect(fx?.grants).toEqual(['Invisible']);
    expect(fx?.breakOnAct).toBe(true);
  });
  it('Contagion: CON save başarısız → 11d8 necrotic ve Poisoned', () => {
    const r = run(arena(['Contagion']), { spellName: 'Contagion', targetId: 'B' }, [2, ...Array(11).fill(4)]);
    const ev = r.events.find((e) => e.type === 'save_resolved');
    expect(ev).toMatchObject({ success: false, damageType: 'necrotic', conditionsAdded: ['Poisoned'] });
    const dmg = ev?.type === 'save_resolved' ? ev.damageRolls : [];
    expect(dmg.length).toBe(11);
    expect(r.state.combatants.B?.conditions).toContain('Poisoned');
    expect(r.state.combatants.B?.hp).toBe(80 - dmg.reduce((a, b) => a + b, 0));
  });
  it('Guardian of Faith ve Faithful Hound: konsantrasyonsuz, yalnızca düşmanları etkileyen 8 saatlik alan', () => {
    for (const id of ['guardian-of-faith', 'faithful-hound']) {
      const sp = spells.find((x) => x.id === id);
      expect(sp?.mechanics.unsupported, id).toBeUndefined();
      expect(sp?.concentration ?? false, id).toBe(false);
      expect(sp?.mechanics.zone).toMatchObject({ rounds: 4800, targets: 'enemies', once: true });
    }
  });
});
