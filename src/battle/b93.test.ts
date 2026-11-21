/**
 * Görev B93 (kural sürümü 93): Cleric, Sorcerer, Wizard ve Warlock denetim düzeltmeleri. Her maddede 93 davranışı ve
 * gerektiğinde 92 (eski kayıt/replay) davranışı.
 */
import { describe, expect, it } from 'vitest';
import { divineStrikeHit } from './cleric';
import { P1 } from './fixtures';
import { arena, caster } from './b93fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent } from './types';

const o = (col: number, row: number): Offset => ({ col, row });

const dmgOf = (evs: BattleEvent[], id = 'B') => evs.filter((e) => e.type === 'attack_resolved' && e.targetId === id).reduce((n, e) => n + (e as { rawDamage: number }).rawDamage, 0);

describe('A1: tek zara eklenen değerler (Empowered Evocation, Elemental Affinity)', () => {
  it('Magic Missile: Empowered Evocation +INT yalnız bir darta (93); 92\'de her darta', () => {
    // KAPSAM103 (103+): Empowered Evocation INT değiştiricisiyle (büyücü fikstürü INT = büyü değiştiricisi 4).
    const a = caster({ spellNames: ['Magic Missile'], traits: ['empowered-evocation'], modifiers: { str: 0, dex: 0, con: 0, int: 4, wis: 0, cha: 0 } });
    const now = arena(a, [['B', {}, o(5, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' });
    const old = arena(a, [['B', {}, o(5, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' });
    // 3 dart × (1d4 = 3, +1) = 12; +4 bir kez.
    expect(dmgOf(now)).toBe(16);
    expect(dmgOf(old)).toBe(24);
  });
  it('Scorching Ray: Elemental Affinity +CHA yalnız ilk isabet eden ışına (93)', () => {
    const a = caster({ spellNames: ['Scorching Ray'], traits: ['affinity-fire'], modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 3 } });
    const now = arena(a, [['B', {}, o(5, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Scorching Ray', targetId: 'B', slotLevel: 2 });
    const old = arena(a, [['B', {}, o(5, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Scorching Ray', targetId: 'B', slotLevel: 2 });
    expect(dmgOf(old) - dmgOf(now)).toBe(6); // 3 ışın: 92 +9, 93 +3
  });
  it('Fireball (tek zar) aynı kalır: +INT bir kez', () => {
    const a = caster({ spellNames: ['Fireball'], traits: ['empowered-evocation'] });
    const save = (evs: BattleEvent[]) => (evs.find((e) => e.type === 'save_resolved') as { rawDamage: number }).rawDamage;
    const now = arena(a, [['B', {}, o(8, 3)]]).do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) });
    const old = arena(a, [['B', {}, o(8, 3)]], { rules: 92 }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) });
    expect(save(now)).toBe(save(old));
  });
  it('Empowered Spell Magic Missile dartlarında zar yeniden atar, büyü başına en çok CHA zar (93); 92\'de etkisiz', () => {
    const count = (rules?: number) => {
      let n = 0;
      const rng: Rng = () => { n++; return 0.1; };
      const a = caster({ spellNames: ['Magic Missile'], traits: ['mm-empowered'], modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 2 } });
      arena(a, [['B', {}, o(5, 3)]], { rules }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, rng);
      return n;
    };
    expect(count(93) - count(92)).toBe(2); // 3 dart, CHA 2: iki dart yeniden
  });
});

describe('A3: Divine Strike / Primal Strike yalnız kendi turunda', () => {
  const opt: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };
  it('başkasının turunda (fırsat saldırısı) ek zar yok; kendi turunda var; 92\'de ikisinde de', () => {
    for (const trait of ['divine-strike', 'primal-strike']) {
      const r = arena(caster({ traits: [trait] }), [['B', {}, o(4, 3)]]);
      const own = divineStrikeHit(r.state, r.c('A'), r.c('B'), opt, false, () => 0.5);
      expect(own?.extra.raw).toBeGreaterThan(0);
      const other = { ...r.state, turnIndex: 1 };
      expect(divineStrikeHit(other, r.c('A'), r.c('B'), opt, false, () => 0.5)).toBeNull();
      expect(divineStrikeHit({ ...other, kuralSurumu: 92 }, r.c('A'), r.c('B'), opt, false, () => 0.5)).not.toBeNull();
    }
  });
});
