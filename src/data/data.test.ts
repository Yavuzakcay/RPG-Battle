import { describe, it, expect } from 'vitest';
import {
  races, classes, armor, weapons, spells, items, environments, monsters, spellSlots, conditions,
  getClass, getRace,
} from './index';
import { ABILITIES } from '../rules/abilities';
import { parseDice } from '../rules/dice';

const unique = (xs: string[]) => new Set(xs).size === xs.length;
const isAbility = (a: string) => (ABILITIES as readonly string[]).includes(a);

describe('ırklar (PHB 2024 türleri)', () => {
  it('10 tür var, idler benzersiz ve alt tür eki yok', () => {
    expect(races.map((r) => r.id)).toEqual([
      'celestial', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling',
    ]);
    expect(unique(races.map((r) => r.id))).toBe(true);
    for (const r of races) expect(r.name.includes(' ')).toBe(false);
  });
  it('boyut, hız ve darkvision makul', () => {
    for (const r of races) {
      expect(r.sizes.length).toBeGreaterThan(0);
      expect(r.sizes.every((s) => s === 'S' || s === 'M')).toBe(true);
      expect(r.speed).toBeGreaterThanOrEqual(30);
      expect(r.speed).toBeLessThanOrEqual(35);
      expect([0, 60, 120].includes(r.darkvision)).toBe(true);
    }
    expect(getRace('goliath').speed).toBe(35);
    expect(getRace('dwarf').darkvision).toBe(120);
  });
  it('miraslı türlerde varsayılan miras listede var ve idler benzersiz', () => {
    for (const r of races) {
      if (!r.lineages) {
        expect(r.defaultLineage).toBeUndefined();
        continue;
      }
      expect(unique(r.lineages.map((l) => l.id))).toBe(true);
      expect(r.lineages.some((l) => l.id === r.defaultLineage)).toBe(true);
    }
    expect(getRace('tiefling').lineages?.map((l) => l.id)).toEqual(['abyssal', 'chthonic', 'infernal']);
  });
  it('getRace çalışır, olmayan ırkta hata verir', () => {
    expect(getRace('human').name).toBe('Human');
    expect(() => getRace('yok')).toThrow();
  });
});

describe('sınıflar', () => {
  it('12 sınıf var ve idler benzersiz', () => {
    expect(classes.length).toBe(12);
    expect(unique(classes.map((c) => c.id))).toBe(true);
  });
  it('hit die, save ve ability sırası geçerli', () => {
    for (const c of classes) {
      expect([6, 8, 10, 12].includes(c.hitDie)).toBe(true);
      expect(c.saves.length).toBe(2);
      expect(c.saves.every(isAbility)).toBe(true);
      expect(unique(c.abilityPriority)).toBe(true);
      expect(c.abilityPriority.length).toBe(6);
    }
  });
  it('büyücü sınıfların büyü kodu var, diğerlerinin yok', () => {
    for (const c of classes) {
      expect((c.casting !== null) === (c.spellCode !== null)).toBe(true);
    }
    expect(getClass('wizard').spellCode).toBe('Wiz');
  });
});

describe('silahlar ve zırhlar', () => {
  it('silah adları benzersiz, zar ifadeleri ayrıştırılabilir', () => {
    expect(weapons.length).toBe(29);
    expect(unique(weapons.map((w) => w.name))).toBe(true);
    for (const w of weapons) {
      parseDice(w.damage);
      if (w.versatileDamage) parseDice(w.versatileDamage);
    }
  });
  it('zırh türleri geçerli', () => {
    expect(armor.length).toBe(9);
    for (const a of armor) expect(['none', 'light', 'medium', 'heavy'].includes(a.type)).toBe(true);
  });
});

describe('büyüler', () => {
  const codes = classes.map((c) => c.spellCode).filter((c): c is string => c !== null);
  it('adlar benzersiz, seviyeler 0–3', () => {
    expect(spells.length).toBeGreaterThanOrEqual(80);
    expect(unique(spells.map((s) => s.name))).toBe(true);
    for (const s of spells) {
      expect(s.level).toBeGreaterThanOrEqual(0);
      expect(s.level).toBeLessThanOrEqual(3);
    }
  });
  it('SRD 5.2.1 dışı olduğu için çıkarılan büyüler veride yok (bkz. DECISIONS.md)', () => {
    const removed = [
      'Armor of Agathys', 'Blade Ward', 'Blinding Smite', "Crusader's Mantle", 'Elemental Weapon',
      'Lightning Arrow', 'Thunderous Smite', 'Witch Bolt', 'Wrathful Smite',
    ];
    const names = spells.map((s) => s.name);
    for (const n of removed) expect(names).not.toContain(n);
  });
  it('her büyünün sınıf kodları gerçek bir büyücü sınıfa ait', () => {
    for (const s of spells) {
      expect(s.classes.length).toBeGreaterThanOrEqual(1);
      expect(s.classes.every((c) => codes.includes(c))).toBe(true);
    }
  });
});

describe('itemler', () => {
  it('etkiler sayı ve geçerli ability içerir', () => {
    expect(items.length).toBe(22);
    for (const it of items) {
      for (const k of Object.keys(it.effects.setAbility ?? {})) expect(isAbility(k)).toBe(true);
    }
  });
});

describe('ortamlar', () => {
  it('10 ortam, kurallar geçerli', () => {
    expect(environments.length).toBe(10);
    for (const e of environments) {
      for (const r of e.rules) {
        expect(['spell', 'race', 'class', 'weapon'].includes(r.category)).toBe(true);
        expect(['advantage', 'disadvantage'].includes(r.effect)).toBe(true);
        expect(r.keywords.length).toBeGreaterThanOrEqual(1);
        expect(r.keywords.every((k) => k === k.toLowerCase())).toBe(true);
      }
    }
  });
});

describe('canavarlar', () => {
  it('16 canavar, benzersiz, 6 ability ve en az 1 saldırı', () => {
    expect(monsters.length).toBe(16);
    expect(unique(monsters.map((m) => m.id))).toBe(true);
    for (const m of monsters) {
      expect(Object.keys(m.abilities).length).toBe(6);
      expect(m.attacks.length).toBeGreaterThanOrEqual(1);
      expect(m.hp).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('büyü slotları ve durumlar', () => {
  it('20. seviye tam büyücü tablosu doğru', () => {
    expect(spellSlots.full.length).toBe(20);
    expect(spellSlots.full[19]).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    expect(spellSlots.full[0]).toEqual([2]);
  });
  it('yarım büyücü tablosu 2. seviyede başlar', () => {
    expect(spellSlots.half['2']).toEqual([2]);
    expect(spellSlots.half['19']).toEqual([4, 3, 3, 3, 2]);
  });
  it('aksiyon yapamaz durumları tüm durumların alt kümesi', () => {
    expect(conditions.incapacitating.every((c) => conditions.all.includes(c))).toBe(true);
    expect(conditions.all.includes('Prone')).toBe(true);
  });
});
