import { describe, it, expect } from 'vitest';
import { longRest, shortRest, type RestState } from './rest';
import type { Rng } from './dice';

/** Her zar için sırayla verilen değerleri üretir (yüz sayısı sabit). */
function rolls(sides: number, ...values: number[]): Rng {
  let i = 0;
  return () => ((values[i++] ?? 1) - 0.5) / sides;
}

const base: RestState = {
  hp: 10, maxHp: 30, level: 5, hitDie: 8, hitDiceLeft: 5, conMod: 2,
  spellSlots: [1, 0, 0], maxSpellSlots: [4, 3, 2], pactMagic: false,
};

describe('kısa dinlenme', () => {
  it('her hit die zar + CON modifier iyileştirir', () => {
    const r = shortRest(base, 2, rolls(8, 5, 3));
    expect(r.rolls).toEqual([5, 3]);
    expect(r.healed).toBe(12); // (5 + 2) + (3 + 2)
    expect(r.state.hp).toBe(22);
    expect(r.state.hitDiceLeft).toBe(3);
  });
  it('maksimum HP\'yi aşmaz', () => {
    expect(shortRest({ ...base, hp: 28 }, 1, rolls(8, 8)).state.hp).toBe(30);
  });
  it('kalan hit die\'dan fazlası harcanamaz', () => {
    const r = shortRest({ ...base, hitDiceLeft: 1 }, 4, rolls(8, 4, 4, 4, 4));
    expect(r.rolls.length).toBe(1);
    expect(r.state.hitDiceLeft).toBe(0);
  });
  it('negatif CON modifier zar başına iyileştirmeyi 0\'ın altına indirmez', () => {
    const r = shortRest({ ...base, conMod: -3 }, 1, rolls(8, 2));
    expect(r.healed).toBe(0);
  });
  it('büyü slotları yalnızca Pact Magic\'te yenilenir', () => {
    expect(shortRest(base, 0, rolls(8)).state.spellSlots).toEqual([1, 0, 0]);
    expect(shortRest({ ...base, pactMagic: true }, 0, rolls(8)).state.spellSlots).toEqual([4, 3, 2]);
  });
});

describe('uzun dinlenme', () => {
  it('HP ve slotlar tamamen yenilenir', () => {
    const r = longRest(base);
    expect(r.hp).toBe(30);
    expect(r.spellSlots).toEqual([4, 3, 2]);
  });
  it('harcanan hit die\'ların yarısı (en az 1) geri gelir, seviyeyi aşmaz', () => {
    expect(longRest({ ...base, hitDiceLeft: 0 }).hitDiceLeft).toBe(2); // 5. seviye: yarısı 2
    expect(longRest({ ...base, level: 1, hitDiceLeft: 0 }).hitDiceLeft).toBe(1); // en az 1
    expect(longRest({ ...base, hitDiceLeft: 4 }).hitDiceLeft).toBe(5); // seviyeyi aşmaz
  });
});
