/**
 * Görev KATALOG-1 C: özgün giyilebilirler (Giyilebilir Kataloğu #1–50: başlık, pelerin, eldiven, bot; Karanlık Yadigârlar #45–48,
 * #54 başlıkları). Birebir karşılığı olan pasifler savaşta (direnç, bağışıklık, kritik bağışıklığı, kurtarma, inisiyatif, büyü
 * bonusu, karşılık hasarı, silahsız vuruş eki, DEX sabitlemesi, Misty Step); PDF'teki her güç kayıtta.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { combatantFromSheet } from './index';
import { startBattle } from './create';
import { itemHitsFor, itemParts } from './itemEffects';
import { mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import { CURRENT_RULES } from './ruleVersion';
import { items } from '../data';
import type { Combatant } from './types';

type K = { id: string; name: string; katalog: { ref: string; tur: string; ozellikler: Array<{ ad: string; durum: string }> } };
const kat = (katalog as unknown as { esyalar: K[] }).esyalar;
const C = kat.filter((x) => x.katalog.ref.startsWith('GY#') || ['KY#45', 'KY#46', 'KY#47', 'KY#48', 'KY#54'].includes(x.katalog.ref));
const sheet = (itemNames: string[], patch: Partial<CharacterSheet> = {}) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5,
  weapons: [{ name: 'Dagger' }], itemNames, ...patch }) as CharacterSheet;
const make = (sh: CharacterSheet) => combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });
const battle = (sh: CharacterSheet) => startBattle('kat-c', 'd', [{ ...make(sh), pos: null }], () => 0.5, { kuralSurumu: CURRENT_RULES } as never).state.combatants.A as Combatant;
const fx = (name: string) => itemParts([name], 'p1').effects[0]!;

describe('KATALOG-1 C: giyilebilirler', () => {
  it('55 parça (50 + 5), hepsi aksesuar; K7: Blazing Fist Gauntlets ve Darkstep Boots, eski adlar yok', () => {
    expect(C).toHaveLength(55);
    expect(C.every((x) => x.katalog.tur === 'aksesuar')).toBe(true);
    for (const n of ['Blazing Fist Gauntlets', 'Darkstep Boots']) expect(items.some((i) => i.name === n), n).toBe(true);
    for (const n of ['Helldusk Gauntlets', 'Nightwalker Boots']) expect(items.some((i) => i.name === n), n).toBe(false);
  });
  it('Gözcü Ejderha Miğferi: zırhsız da +1 AC, bütün kurtarmalar +1; kritik bağışıklığı ve Stunned bağışıklığı', () => {
    const a = make(sheet(['Vigilant Drake Helm'])), b = make(sheet([]));
    expect(a.ac - b.ac).toBe(1);
    expect(a.saves.wis - b.saves.wis).toBe(1);
    expect(fx('Vigilant Drake Helm').noCrit).toBe(true);
    expect(fx('Vigilant Drake Helm').immune).toEqual(['Stunned']);
  });
  it('karşılık hasarı (retort): Asit Püskürten Pelerin 1d6 asit; B: Kızgın Demir Plakası 1d4 ateş, Ebedi Fırtına Pul Zırhı 1d4 yıldırım', () => {
    expect(fx('Fleshrender Cloak').retort).toEqual({ dice: '1d6', type: 'acid' });
    expect(fx('Fleshrender Cloak').resist).toEqual(['acid']);
    expect(fx('Scorched Iron Plate').retort).toEqual({ dice: '1d4', type: 'fire' });
    expect(fx('Stormplate Scale').retort).toEqual({ dice: '1d4', type: 'lightning' });
  });
  it('Ruh Yakalayan Eldiven: 1d8 kuvvet yalnız Unarmed Strike isabetinde, hançerde değil', () => {
    const a = battle(sheet(['Soulcatcher Gauntlets']));
    const foe = mk('F', { side: 'enemies' });
    const un = a.weaponOptions.find((o) => o.weaponId === 'unarmed-strike')!, dg = a.weaponOptions.find((o) => o.weaponId === 'dagger' && !o.ranged)!;
    expect(itemHitsFor(a, un, foe).map((h) => `${h.dice} ${h.type}`)).toContain('1d8 force');
    expect(itemHitsFor(a, dg, foe).map((h) => h.type)).not.toContain('force');
  });
  it('Büyülü Çeviklik Eldiveni DEX 18; Karanlık Adım Çizmeleri hız +5 ve Misty Step; Şifacı Omuz Örtüsü Poisoned kurtarma avantajı; büyü +1', () => {
    expect(make(sheet(['Dexterous Silk Gloves'])).modifiers.dex).toBe(4);
    expect(fx('Darkstep Boots').speedFt).toBe(5);
    expect(itemParts(['Darkstep Boots'], 'p1').addSpells).toContain('Misty Step');
    expect(fx("Mender's Mantle").saveAdvAgainst).toEqual(['Poisoned']);
    expect(itemParts(['Weavefold Cloak'], 'p1').spellBonus).toBe(1);
    expect(fx('Frostspike Boots').iceWalker).toBe(true);
  });
  it('her güç durum etiketli; ilk güç PDF\'teki temel paragraf ya da adlı güç', () => {
    for (const x of C) {
      expect(x.katalog.ozellikler.length, x.id).toBeGreaterThan(0);
      for (const f of x.katalog.ozellikler) expect(['calisir', 'kismi', 'planli', 'calismiyor'], `${x.id}/${f.ad}`).toContain(f.durum);
    }
  });
});
