/**
 * Dinlenme kuralları: kısa ve uzun dinlenme. Saf fonksiyonlar, savaştan bağımsızdır.
 * Dinlenme savaşlar arasında olur, bu yüzden savaş durumuyla değil karakterin kalıcı durumuyla çalışır.
 */
import { rollDie, type Rng } from './dice';

export interface RestState {
  hp: number;
  maxHp: number;
  level: number;
  /** Hit die yüz sayısı (d6, d8, d10, d12). */
  hitDie: number;
  /** Harcanmamış hit die sayısı (en çok seviye kadar). */
  hitDiceLeft: number;
  conMod: number;
  spellSlots: number[];
  maxSpellSlots: number[];
  /** Warlock gibi: slotlar kısa dinlenmede de yenilenir. */
  pactMagic: boolean;
}

export interface ShortRestResult {
  state: RestState;
  /** Atılan hit die değerleri. */
  rolls: number[];
  healed: number;
}

/** Kısa dinlenme: istenen sayıda hit die harcanır, her biri hit die + CON modifier (en az 0) iyileştirir. */
export function shortRest(state: RestState, diceToSpend: number, rng: Rng = Math.random): ShortRestResult {
  const count = Math.max(0, Math.min(diceToSpend, state.hitDiceLeft));
  const rolls: number[] = [];
  let hp = state.hp;
  for (let i = 0; i < count; i++) {
    const roll = rollDie(state.hitDie, rng);
    rolls.push(roll);
    hp = Math.min(state.maxHp, hp + Math.max(0, roll + state.conMod));
  }
  return {
    state: {
      ...state,
      hp,
      hitDiceLeft: state.hitDiceLeft - count,
      spellSlots: state.pactMagic ? [...state.maxSpellSlots] : [...state.spellSlots],
    },
    rolls,
    healed: hp - state.hp,
  };
}

/** Uzun dinlenme: tüm HP ve slotlar yenilenir, harcanan hit die'ların yarısı (en az 1) geri gelir. */
export function longRest(state: RestState): RestState {
  const regained = Math.max(1, Math.floor(state.level / 2));
  return {
    ...state,
    hp: state.maxHp,
    hitDiceLeft: Math.min(state.level, state.hitDiceLeft + regained),
    spellSlots: [...state.maxSpellSlots],
  };
}
