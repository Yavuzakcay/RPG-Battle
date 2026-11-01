/**
 * Kuyruk 40: 4. ve 5. seviye büyüler. Yalnızca veriyle gelenler mevcut motor yolundan çalışır (save hasarı, süren etki,
 * iyileştirme, ışınlanma); yeni sistem gerektirenler `unsupported` ("çalışmıyor"), savaş dışı olanlar `offCombat`.
 */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleState, Command } from './index';
import { spells } from '../data';
import srdSpells from '../../data/srd/spells.json';
import { spellOptions, maxSpellLevel } from '../rules/builder';
import { GM, P1, advanceTo, envId, mk, scripted } from './fixtures';

void GM;
const spell = (id: string) => spells.find((s) => s.id === id);

function arena(names: string[]): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', initiativeBonus: 2, level: 9, spellMod: 4, spellSaveDc: 15, spellAttack: 7, spellNames: names,
      casterTag: 'human cleric', spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0], hp: 20, maxHp: 50 }),
    mk('B', { side: 'enemies', hp: 80, maxHp: 80 }),
    mk('C', { ownerId: 'p2', initiativeBonus: 1, hp: 5, maxHp: 40 }),
  ];
  return advanceTo(startBattle('k40', envId('Düz'), parts, scripted([20, 10], [20, 15], [20, 15])).state, 'A');
}
function run(s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rolls: number[]) {
  const r = execute(s, { type: 'cast_spell', actorId: 'A', ...cmd } as Command, P1, scripted(...rolls.map((x) => [20, x] as [number, number])));
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe('Kuyruk 40: 4.–5. seviye büyü verisi', () => {
  const srd45 = (srdSpells as { spells: Array<{ id: string; level: number }> }).spells.filter((s) => s.level === 4 || s.level === 5);
  it('SRD 5.2.1\'in 72 büyüsünün hepsi listede (çalışan, kısmi, savaş dışı ya da çalışmıyor)', () => {
    expect(srd45.length).toBe(72);
    for (const s of srd45) expect(spell(s.id), s.id).toBeTruthy();
    const off = srd45.filter((s) => spell(s.id)?.mechanics.offCombat);
    const no = srd45.filter((s) => spell(s.id)?.mechanics.unsupported);
    expect(off.length).toBe(27);
    // Yeni sistem gerektiren 9 + karar bekleyen 10 küçük ekleme.
    expect(no.length).toBe(19);
    for (const id of ['banishment', 'dominate-person', 'wall-of-force', 'contagion']) expect(spell(id)?.mechanics.unsupported).toMatch(/yeni sistem/);
  });
  it('sınıf listeleri SRD\'den: Mass Cure Wounds Bard/Cleric/Druid, Dimension Door Bard/Sorcerer/Warlock/Wizard', () => {
    expect(spell('mass-cure-wounds')?.classes).toEqual(['Brd', 'Clr', 'Drd']);
    expect(spell('dimension-door')?.classes).toEqual(['Brd', 'Sor', 'Wiz', 'Wlk']);
  });
  it('hazırlık slot tablosuna bağlı (Kuyruk 38): Wizard 7 → 4. seviye, 9 → 5. seviye; Paladin 9 → 3. seviye', () => {
    expect(maxSpellLevel('wizard', 7)).toBe(4);
    expect(spellOptions('wizard', 7)).toContain('Blight');
    expect(spellOptions('wizard', 7)).not.toContain('Cloudkill');
    expect(spellOptions('wizard', 9)).toContain('Cloudkill');
    expect(spellOptions('paladin', 9)).not.toContain('Death Ward');
  });
});

describe('Kuyruk 40: çalışan büyüler', () => {
  it('Blight: CON save, 8d8 necrotic; 5. slotta 9d8', () => {
    const r = run(arena(['Blight']), { spellName: 'Blight', targetId: 'B', slotLevel: 5 }, [5, 8, 8, 8, 8, 8, 8, 8, 8, 8]);
    const ev = r.events.find((e) => e.type === 'save_resolved');
    expect(ev).toMatchObject({ damageType: 'necrotic', success: false });
    expect(ev && ev.type === 'save_resolved' ? ev.damageRolls.length : 0).toBe(9);
  });
  it('Mass Cure Wounds: iki dosta 5d8 + 4', () => {
    const r = run(arena(['Mass Cure Wounds']), { spellName: 'Mass Cure Wounds', targetIds: ['A', 'C'] }, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(r.state.combatants.C?.hp).toBe(5 + 5 + 4);
    expect(r.state.combatants.A?.hp).toBe(20 + 5 + 4);
  });
  it('Stoneskin ve Greater Invisibility süren etki; Greater Invisibility saldırınca bitmez', () => {
    const s1 = run(arena(['Stoneskin']), { spellName: 'Stoneskin', targetIds: ['C'] }, []);
    expect(s1.state.combatants.C?.effects?.[0]?.resist).toEqual(['bludgeoning', 'piercing', 'slashing']);
    const s2 = run(arena(['Greater Invisibility']), { spellName: 'Greater Invisibility', targetIds: ['C'] }, []);
    const fx = s2.state.combatants.C?.effects?.[0];
    expect(fx?.grants).toEqual(['Invisible']);
    expect(fx?.breakOnAct).toBeUndefined();
  });
  it('çalışmıyor büyü savaşta reddedilir, slot harcanmaz', () => {
    const s = arena(['Banishment']);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Banishment', targetId: 'B' }, P1, scripted());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/çalışmıyor/);
  });
});
