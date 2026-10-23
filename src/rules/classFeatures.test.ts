import { describe, expect, it } from 'vitest';
import { classData, classes, spellSlots } from '../data';
import srdClasses from '../../data/srd/classes.json';
import srdSubclasses from '../../data/srd/subclasses.json';
import {
  classKit, classResources, completeThrough, experimentalFrom, freeSpellResource, gainedFeatures, missingFeatures,
  rechargeResources, resourceUsable, speedBonus, subclassesOf,
} from './classFeatures';
import { spellSlotsFor } from './stats';

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('SRD sınıf verisi (npm run srd)', () => {
  it('12 sınıf, her biri 1–20 seviye satırı, alt sınıf ve sayfa referansı', () => {
    expect(srdClasses.classes.map((c) => c.id)).toEqual(classes.map((c) => c.id));
    for (const c of srdClasses.classes) {
      expect(c.table?.rows.map((r) => r.level)).toEqual(LEVELS);
      expect(c.source.page).toBeGreaterThan(27);
      expect(c.features.every((f) => f.source.page > 0 && f.text.length > 0)).toBe(true);
    }
    expect(srdSubclasses.subclasses.map((s) => s.classId)).toEqual(classes.map((c) => c.id));
    for (const id of classes.map((c) => c.id)) expect(subclassesOf(id)).toHaveLength(1);
  });
  it('isabet zarı ve kurtarma zarları sınıf verisiyle (data/classes.json) aynı', () => {
    for (const p of classData.progression) {
      expect(p.hitDie).toBe(classes.find((c) => c.id === p.id)?.hitDie);
    }
  });
  it('büyü slotları SRD tablosuyla data/spell-slots.json aynı (tam, yarı, Pact Magic)', () => {
    for (const p of classData.progression) {
      for (const l of LEVELS) {
        const row = p.rows[l - 1]!.values;
        const expected = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        if ('slot1' in row) for (let i = 1; i <= 9; i++) expected[i - 1] = typeof row[`slot${i}`] === 'number' ? row[`slot${i}`] as number : 0;
        if ('Slot Level' in row) expected[(row['Slot Level'] as number) - 1] = row['Spell Slots'] as number;
        expect(spellSlotsFor(p.id, l), `${p.id} ${l}`).toEqual(expected);
      }
    }
    expect(spellSlots.full).toHaveLength(20);
  });
  it('mekanik dosyasındaki her özellik ve kaynak SRD tablosunda var', () => {
    const known = new Set(classData.progression.flatMap((p) => [
      ...p.rows.flatMap((r) => r.features.map((f) => `${p.id}:${f.id}`)),
      ...p.subclasses.flatMap((s) => s.features.map((f) => `${p.id}/${s.id}:${f.id}`)),
    ]));
    for (const key of Object.keys(classData.mechanics.features)) expect(known.has(key), key).toBe(true);
    for (const [id, d] of Object.entries(classData.mechanics.resources)) {
      for (const f of Array.isArray(d.feature) ? d.feature : [d.feature]) expect(known.has(f), `${id}: ${f}`).toBe(true);
    }
  });
});

describe('özellik motoru: eski elle yazılmış kurallarla aynı sonuç (1–20)', () => {
  it('Extra Attack, Sneak Attack, Cunning Action', () => {
    for (const l of LEVELS) {
      expect(classKit('fighter', l).attacksPerAction).toBe(l >= 20 ? 4 : l >= 11 ? 3 : l >= 5 ? 2 : 1);
      for (const id of ['barbarian', 'monk', 'paladin', 'ranger']) expect(classKit(id, l).attacksPerAction).toBe(l >= 5 ? 2 : 1);
      for (const id of ['bard', 'cleric', 'druid', 'rogue', 'sorcerer', 'warlock', 'wizard']) expect(classKit(id, l).attacksPerAction).toBe(1);
      expect(classKit('rogue', l).sneakAttackDice).toBe(Math.ceil(l / 2));
      expect(classKit('fighter', l).sneakAttackDice).toBe(0);
      expect(classKit('rogue', l).bonusActions).toEqual(l >= 2 ? ['dash', 'disengage', 'hide'] : []);
    }
  });
  it('Action Surge, Second Wind, Favored Enemy kullanım sayıları', () => {
    for (const l of LEVELS) {
      const f = classResources('fighter', l);
      expect(f.actionSurge ?? 0).toBe(l >= 17 ? 2 : l >= 2 ? 1 : 0);
      expect(f.secondWind).toBe(l >= 10 ? 4 : l >= 4 ? 3 : 2);
      expect(classResources('ranger', l).favoredEnemy).toBe(2 + Math.floor((l - 1) / 4));
      expect(classResources('wizard', l).secondWind).toBeUndefined();
    }
  });
  it('Unarmored Defense ve hız (Fast Movement, Unarmored Movement)', () => {
    expect(classKit('barbarian', 1).unarmoredDefense).toEqual({ abilities: ['con'], shield: true });
    expect(classKit('monk', 1).unarmoredDefense).toEqual({ abilities: ['wis'], shield: false });
    expect(classKit('fighter', 1).unarmoredDefense).toBeNull();
    const none = { type: 'none' as const, shield: false };
    for (const l of LEVELS) {
      expect(speedBonus('barbarian', l, { type: 'medium', shield: true })).toBe(l >= 5 ? 10 : 0);
      expect(speedBonus('barbarian', l, { type: 'heavy', shield: false })).toBe(0);
      expect(speedBonus('monk', l, none)).toBe(l >= 2 ? 10 + 5 * [6, 10, 14, 18].filter((x) => l >= x).length : 0);
      expect(speedBonus('monk', l, { type: 'none', shield: true })).toBe(0);
    }
  });
  it('uzmanlık hakkı: Rogue 1 ve 6, Bard 2 ve 9, Ranger 9', () => {
    expect([1, 5, 6].map((l) => classKit('rogue', l).expertise)).toEqual([2, 2, 4]);
    expect([1, 2, 9].map((l) => classKit('bard', l).expertise)).toEqual([0, 2, 4]);
    expect([8, 9].map((l) => classKit('ranger', l).expertise)).toEqual([0, 2]);
  });
});

describe('kaynak modeli', () => {
  it('kaynak türleri: sütun, seviye tablosu, seviye çarpanı, yetenek değiştiricisi, sabit', () => {
    expect(classResources('barbarian', 3).rage).toBe(3);
    expect(classResources('monk', 5).focus).toBe(5);
    expect(classResources('monk', 1).focus).toBeUndefined();
    expect(classResources('paladin', 4).layOnHands).toBe(20);
    expect(classResources('bard', 1, { cha: 3 }).bardicInspiration).toBe(3);
    expect(classResources('bard', 1, { cha: -1 }).bardicInspiration).toBe(1);
    expect(classResources('cleric', 2).channelDivinity).toBe(2);
    expect(classResources('paladin', 3).channelDivinity).toBe(2);
    expect(classResources('sorcerer', 7).sorceryPoints).toBe(7);
    expect(classResources('wizard', 1).arcaneRecovery).toBe(1);
  });
  it('yenilenme: kısa dinlenmede biri ya da hepsi, uzun dinlenmede hepsi, eşik seviyesi', () => {
    const max = { secondWind: 3, actionSurge: 1, favoredEnemy: 3 };
    const used = { secondWind: 0, actionSurge: 0, favoredEnemy: 0 };
    expect(rechargeResources(used, max, 'short', 5)).toEqual({ secondWind: 1, actionSurge: 1, favoredEnemy: 0 });
    expect(rechargeResources(used, max, 'long', 5)).toEqual(max);
    expect(rechargeResources({ bardicInspiration: 0 }, { bardicInspiration: 3 }, 'short', 4)).toEqual({ bardicInspiration: 0 });
    expect(rechargeResources({ bardicInspiration: 0 }, { bardicInspiration: 3 }, 'short', 5)).toEqual({ bardicInspiration: 3 });
    expect(rechargeResources({ rage: 1 }, { rage: 3 }, 'turn', 3)).toEqual({ rage: 1 });
  });
  it('slotsuz büyü ve savaşta kullanılabilirlik veriden', () => {
    expect(freeSpellResource("Hunter's Mark")).toBe('favoredEnemy');
    expect(freeSpellResource('Fireball')).toBeUndefined();
    expect(resourceUsable('secondWind')).toBe(true);
    // Rage Görev P-Barbarian'da uygulandı: artık savaşta kullanılabilir; Wild Shape hâlâ yok.
    expect(resourceUsable('rage')).toBe(true);
    expect(resourceUsable('wildShape')).toBe(false);
  });
});

describe('tamlık ve deneysel uyarı (veriden)', () => {
  it('eksik özellikler listelenir; uyarı en erken 6. seviyede başlar', () => {
    // Barbarian 1–5 Görev P-Barbarian'da tamamlandı (eksik yok); Monk 1'de Martial Arts hâlâ eksik.
    for (let l = 1; l <= 5; l++) expect(missingFeatures('barbarian', l)).toEqual([]);
    expect(completeThrough('barbarian')).toBeGreaterThanOrEqual(5);
    expect(missingFeatures('monk', 1).map((f) => f.name)).toContain('Martial Arts');
    // Weapon Mastery Görev P0'da uygulandı (kısmen: Nick yok): artık eksik sayılmaz; Fighter 1. seviyede tam.
    expect(missingFeatures('fighter', 1)).toEqual([]);
    expect(missingFeatures('fighter', 2).map((f) => f.name)).toContain('Tactical Mind');
    for (const c of classes) {
      expect(completeThrough(c.id)).toBeGreaterThanOrEqual(0);
      expect(experimentalFrom(c.id)).toBeGreaterThanOrEqual(6);
    }
  });
  it('alt sınıf özellikleri alt sınıf seviyesinden itibaren gelir', () => {
    expect(gainedFeatures('fighter', 2).some((f) => f.from === 'subclass')).toBe(false);
    expect(gainedFeatures('fighter', 3, 'champion').filter((f) => f.from === 'subclass').map((f) => f.name)).toEqual(['Improved Critical', 'Remarkable Athlete']);
    // Görev P-Paladin: alt sınıf seçilmemişse varsayılan yok.
    expect(gainedFeatures('fighter', 3).some((f) => f.from === 'subclass')).toBe(false);
  });
});

describe('kodda sınıf adıyla koşul yok', () => {
  const sources = import.meta.glob(['../battle/economy.ts', '../battle/create.ts', './stats.ts', './classFeatures.ts', './advancement.ts'],
    { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  it.each(Object.keys(sources))('%s', (path) => {
    expect(sources[path]).not.toMatch(/classId === '|cls\.id === '|\['barbarian'|=== 'fighter'|=== 'rogue'|=== 'ranger'/);
  });
});
