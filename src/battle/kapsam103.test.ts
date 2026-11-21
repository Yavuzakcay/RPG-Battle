/**
 * Gece kuyruğu Aşama 4 (kural sürümü 103, Görev KAPSAM103): canavar verisi SRD stat bloğu uyumu ve sınıf açıkları. Her madde
 * 102'de eski davranış, 103'te SRD 5.2.1.
 */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { startBattle } from './index';
import { combatantFromMonster } from './create';
import { abilitiesOf } from './monsterAbilities';
import { legendaryOf } from './boss';
import { evocationBonus } from './oneDieBonus';
import { breathesWater } from './underwaterCore';
import { mk } from './fixtures';
import { KAPSAM103_VERSION, kapsam103On } from './kapsam103Surum';
import type { BattleState, Combatant } from './types';

const NEW = KAPSAM103_VERSION;
const OLD = KAPSAM103_VERSION - 1;
const mon = (id: string, v: number) => combatantFromMonster(getMonster(id), { id: 'M', kuralSurumu: v });
const battle = (c: Combatant, v: number): BattleState =>
  startBattle('k103', 'd-z-zemin', [mk('A', { ownerId: 'p1' }), c], () => 0.5, { kuralSurumu: v }).state;

describe('KAPSAM103: sabit', () => {
  it('kural sürümü 103', () => {
    expect(KAPSAM103_VERSION).toBe(103);
    expect(kapsam103On({ kuralSurumu: 103 })).toBe(true);
    expect(kapsam103On({ kuralSurumu: 102 })).toBe(false);
  });
});

describe('KAPSAM103: canavar inisiyatifi stat bloğundan (SRD "Initiative +X")', () => {
  it('103: Hobgoblin Warrior +3, Hill Giant +2, Young Red Dragon +4; 102: DEX değiştiricisi', () => {
    expect(getMonster('hobgoblin-warrior').initiative).toBe(3);
    expect(mon('hobgoblin-warrior', NEW).initiativeBonus).toBe(3);
    expect(mon('hobgoblin-warrior', OLD).initiativeBonus).toBe(1);
    expect(mon('hill-giant', NEW).initiativeBonus).toBe(2);
    expect(mon('hill-giant', OLD).initiativeBonus).toBe(-1);
    expect(mon('young-red-dragon', NEW).initiativeBonus).toBe(4);
  });
  it('alan olmayan (özel) canavarda DEX', () => {
    const custom = { ...getMonster('hill-giant'), id: 'ozel-dev', initiative: undefined };
    expect(combatantFromMonster(custom, { id: 'X', kuralSurumu: NEW }).initiativeBonus).toBe(-1);
  });
});

describe('KAPSAM103: Gold Dragon Weakening Breath (SRD aktarım hatası "Spellcasting")', () => {
  it('103: Adult/Ancient saldırısı Weakening Breath (60/90 ft koni, STR DC 21/24); 102: eski ad', () => {
    const a = mon('adult-gold-dragon', NEW).attacks.map((x) => x.name);
    expect(a).toContain('Weakening Breath');
    expect(a).not.toContain('Spellcasting');
    expect(mon('adult-gold-dragon', OLD).attacks.map((x) => x.name)).toContain('Spellcasting');
    const anc = mon('ancient-gold-dragon', NEW).attacks.find((x) => x.name === 'Weakening Breath');
    expect(anc?.save).toMatchObject({ ability: 'str', dc: 24 });
    expect(JSON.stringify(anc)).toContain('90-foot Cone');
  });
});

describe('KAPSAM103: Cloud Giant Misty Step (bonus eylem, 30 ft)', () => {
  it('103 var, 102 yok', () => {
    const nw = battle(mon('cloud-giant', NEW), NEW);
    expect(abilitiesOf(nw, nw.combatants.M as Combatant).map((x) => x.id)).toContain('misty-step');
    const old = battle(mon('cloud-giant', OLD), OLD);
    expect(abilitiesOf(old, old.combatants.M as Combatant).map((x) => x.id)).not.toContain('misty-step');
  });
});

describe('KAPSAM103: Sphinx Weight of Years (efsanevi eylem)', () => {
  it('103: Sphinx of Lore/Valor eylemlerinde; 102 yok', () => {
    for (const id of ['sphinx-of-lore', 'sphinx-of-valor']) {
      const nw = battle(mon(id, NEW), NEW);
      expect(legendaryOf(nw, nw.combatants.M as Combatant)?.actions.map((x) => x.id)).toContain('weight-of-years');
      const old = battle(mon(id, OLD), OLD);
      expect(legendaryOf(old, old.combatants.M as Combatant)?.actions.map((x) => x.id) ?? []).not.toContain('weight-of-years');
    }
  });
});

describe('KAPSAM103: Empowered Evocation yalnız Wizard büyüsüne, INT ile (SRD s. 82)', () => {
  const evoker = (k103: boolean) => mk('W', { traits: ['empowered-evocation'], spellMod: 2, modifiers: { str: 0, dex: 0, con: 0, int: 4, wis: 2, cha: 0 }, ...(k103 ? { k103: true as const } : {}) });
  it('103: Wizard büyüsünde INT, Wizard dışı Evocation büyüsünde 0; 102: her Evocation büyüsünde büyü değiştiricisi', () => {
    expect(evocationBonus(evoker(true), { kind: 'save' }, 'Evocation', true)).toBe(4);
    expect(evocationBonus(evoker(true), { kind: 'save' }, 'Evocation', false)).toBe(0);
    expect(evocationBonus(evoker(false), { kind: 'save' }, 'Evocation', false)).toBe(2);
  });
});

describe('KAPSAM103: Gift of the Depths su altında solur (SRD)', () => {
  it('103 işaretiyle solur; işaretsiz (102) solumaz', () => {
    expect(breathesWater(mk('G', { traits: ['gift-of-the-depths'], k103: true }))).toBe(true);
    expect(breathesWater(mk('G', { traits: ['gift-of-the-depths'] }))).toBe(false);
  });
});
