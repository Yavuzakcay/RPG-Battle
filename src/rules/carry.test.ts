/**
 * Görev K5: taşıma kapasitesi. Kapasite (Güç × 15), yük (zırh + kalkan + silah + eşya), SRD sınırı (oluşturucuda eksik,
 * kayıtlı karakterde değil), kademeli kural (hız ve dezavantaj), ağırlığı olmayan / yaklaşık eşyalar, eski kayıt.
 */
import { describe, expect, it } from 'vitest';
import { armor, items, weapons } from '../data';
import { blankCharacter, characterIssues, characterProblems, type SavedCharacter } from './builder';
import { carriedWeight, carryLoad, carrySizeMult, carrySpeedPenalty, heavilyLoaded } from './carry';
import tasima from '../../data/tasima.json';
import srdSpecies from '../../data/srd/species.json';
import { combatantFromSheet } from '../battle/create';
import { wardSources } from '../battle/divine';
import { mk } from '../battle/fixtures';
import type { BattleState } from '../battle/types';

const ch = (patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k5');
  return { ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', armorName: 'Chain Mail', ...patch } };
};

describe('veri', () => {
  it('her silah, zırh ve eşyada ağırlık; yaklaşık olanlar işaretli', () => {
    for (const x of [...weapons, ...armor, ...items]) expect(typeof x.weight, x.name).toBe('number');
    expect(weapons.find((w) => w.id === 'greataxe')?.weight).toBe(7);
    expect(armor.find((a) => a.name === 'Plate Armor')?.weight).toBe(65);
    expect(items.find((i) => i.name === 'Potion of Healing')).toMatchObject({ weight: 0.5 });
    expect(items.find((i) => i.name === 'Potion of Healing')?.weightApprox).toBeUndefined();
    expect(items.find((i) => i.name === 'Ring of Protection')).toMatchObject({ weight: 0, weightApprox: true });
    expect(items.find((i) => i.name === 'Antitoxin')).toMatchObject({ weight: 0 });
  });
});

describe('kapasite ve yük', () => {
  it('Güç × 15; zırh + kalkan (6) + silah + eşya; ağırlığı olmayan eşya 0', () => {
    // Fighter standart dizi: STR 15 → kapasite 225; Chain Mail 55 + kalkan 6 + Longsword 3 + Antitoxin 0 + iksir 0,5.
    const s = ch({ shield: true, weapons: [{ name: 'Longsword' }], itemNames: ['Antitoxin', 'Potion of Healing'] }).sheet;
    expect(carriedWeight(s)).toBe(64.5);
    const l = carryLoad(s, 'srd');
    expect(l).toMatchObject({ capacity: 225, encumberedAt: 75, heavyAt: 150, level: 'ok' });
  });
  it('SRD sınırı: aşan karakter oluşturucuda Donanım eksiği; kapalıda ve kayıtlı listede engel yok', () => {
    const weak = ch({ baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 13, cha: 12 }, armorName: 'Plate Armor', shield: true,
      weapons: [{ name: 'Greataxe' }, { name: 'Maul' }, { name: 'Halberd' }, { name: 'Heavy crossbow' }, { name: 'Greatclub' }] });
    expect(carryLoad(weak.sheet, 'srd').level).toBe('over');
    expect(characterIssues(weak, { carryRule: 'srd' }).some((x) => x.step === 'equipment' && /kapasite 120 lb/.test(x.text))).toBe(true);
    expect(characterIssues(weak, { carryRule: 'off' }).some((x) => /kapasite/.test(x.text))).toBe(false);
    // Eski kayıt: kurala bakmayan liste/kurulum denetimi engellemez (yalnızca rozet).
    expect(characterProblems(weak).some((x) => /kapasite/.test(x))).toBe(false);
  });
});

describe('kademeli kural', () => {
  it('eşikler ve hız cezası', () => {
    expect(carrySpeedPenalty('encumbered', 'tiered')).toBe(10);
    expect(carrySpeedPenalty('heavy', 'tiered')).toBe(20);
    expect(carrySpeedPenalty('heavy', 'srd')).toBe(0);
    expect(heavilyLoaded('heavy', 'tiered')).toBe(true);
    expect(heavilyLoaded('encumbered', 'tiered')).toBe(false);
  });
  it('savaşta: yüklü hız −10, ağır yüklü hız −20 ve saldırı dezavantajı; kapalıda değişiklik yok', () => {
    // STR 8: Yüklü > 40 lb, Ağır yüklü > 80 lb.
    const base = { baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 13, cha: 12 }, weapons: [{ name: 'Dagger' }] };
    const plain = combatantFromSheet(ch({ ...base, armorName: 'Leather Armor' }).sheet, { id: 'a', ownerId: 'x', carryRule: 'tiered' });
    const enc = combatantFromSheet(ch({ ...base, armorName: 'Chain Mail' }).sheet, { id: 'a', ownerId: 'x', carryRule: 'tiered' });
    const heavy = combatantFromSheet(ch({ ...base, armorName: 'Plate Armor', shield: true, weapons: [{ name: 'Maul' }] }).sheet, { id: 'a', ownerId: 'x', carryRule: 'tiered' });
    const off = combatantFromSheet(ch({ ...base, armorName: 'Plate Armor', shield: true, weapons: [{ name: 'Maul' }] }).sheet, { id: 'a', ownerId: 'x' });
    expect(plain.load).toBeUndefined();
    expect(enc.load).toBe('encumbered');
    expect(enc.speed).toBe(plain.speed - 10 - 10); // Chain Mail: STR 13 şartı (−10) + yük (−10)
    expect(heavy.load).toBe('heavy');
    expect(heavy.effects?.[0]).toMatchObject({ saveDis: ['str', 'dex', 'con'], checkDis: ['str', 'dex', 'con'] });
    expect(off.load).toBeUndefined();
    expect(off.effects ?? []).toEqual([]);
    expect(heavy.speed).toBe(off.speed - 20);
    const state = { combatants: {}, round: 1 } as unknown as BattleState;
    expect(wardSources(state, heavy, mk('B', { side: 'enemies' }))).toEqual([{ effect: 'disadvantage', reason: 'Ağır yüklü' }]);
    expect(wardSources(state, off, mk('B', { side: 'enemies' }))).toEqual([]);
  });
});

describe('Powerful Build ve boyut (Görev Z2)', () => {
  it('SRD verisinden: "carrying capacity" için bir boy büyük sayılan her tür özelliği tasima.json sizeUp içinde', () => {
    const fromSrd: Record<string, string> = {};
    for (const sp of (srdSpecies as unknown as { species: Array<{ id: string; traits: Array<{ id: string; text: string }> }> }).species) {
      for (const t of sp.traits) if (/one size larger when determining your carrying capacity/i.test(t.text)) fromSrd[sp.id] = t.id;
    }
    expect(fromSrd).toEqual({ goliath: 'powerful-build' });
    expect(tasima.sizeUp).toEqual(fromSrd);
  });
  it('Goliath (Medium → Large): kapasite, eşikler ve sürükleme/kaldırma/itme ×2; diğer türler ve Small ×1', () => {
    expect(carrySizeMult('goliath')).toBe(2);
    for (const r of ['human', 'dwarf', 'halfling', 'gnome', 'elf']) expect(carrySizeMult(r), r).toBe(1);
    const base = ch({ raceId: 'human' }).sheet;
    const gol = { ...base, raceId: 'goliath' };
    const h = carryLoad(base, 'srd'), g = carryLoad(gol, 'srd');
    const str = h.capacity / 15;
    expect(h).toMatchObject({ sizeMult: 1, dragLimit: str * 30 });
    expect(g.capacity / 15).toBeGreaterThanOrEqual(str); // Goliath'ın tür bonusu yok; Güç aynı ya da yüksek
    const gs = g.capacity / 30;
    expect(g).toMatchObject({ sizeMult: 2, capacity: gs * 30, encumberedAt: gs * 10, heavyAt: gs * 20, dragLimit: gs * 60 });
  });
  it('ağır yük Goliath\'ta sınırı aşmaz (Plate + kalkan, Güç 8)', () => {
    const weak = { str: 8, dex: 15, con: 14, int: 10, wis: 13, cha: 12 };
    const human = ch({ raceId: 'human', baseScores: weak, armorName: 'Plate Armor', shield: true, weapons: [{ name: 'Greataxe' }], itemNames: [] }).sheet;
    const gol = { ...human, raceId: 'goliath' };
    expect(carryLoad(human, 'tiered').level).not.toBe('ok');
    expect(carryLoad(gol, 'srd').level).toBe('ok');
  });
});

