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

/**
 * Kısa dinlenme: istenen sayıda hit die harcanır, her biri hit die + CON modifier iyileştirir.
 * GENEL-SAVAS-DENETIM G2 (SRD 5.2.1 s. 187 Short Rest): zar başına "minimum of 1 Hit Point" (eskiden en az 0).
 * G1 (s. 187): "To start a Short Rest, you must have at least 1 Hit Point": 0 HP'de dinlenme başlamaz (zar harcanmaz).
 */
export function shortRest(state: RestState, diceToSpend: number, rng: Rng = Math.random): ShortRestResult {
  if (state.hp < 1) return { state: { ...state, spellSlots: [...state.spellSlots] }, rolls: [], healed: 0 };
  const count = Math.max(0, Math.min(diceToSpend, state.hitDiceLeft));
  const rolls: number[] = [];
  let hp = state.hp;
  for (let i = 0; i < count; i++) {
    const roll = rollDie(state.hitDie, rng);
    rolls.push(roll);
    hp = Math.min(state.maxHp, hp + Math.max(1, roll + state.conMod));
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

/**
 * Uzun dinlenme: tüm HP ve slotlar yenilenir, harcanan hit die'ların tamamı geri gelir.
 * GENEL-SAVAS-DENETIM G5 (SRD 5.2.1 s. 185 Long Rest, "Regain All HP. You regain all lost Hit Points and all spent
 * Hit Point Dice"); eskiden 2014 kuralı (yarısı, en az 1). 0 HP'de başlayamama (s. 185) ertelendi: denetim belgesi G6.
 */
export function longRest(state: RestState): RestState {
  return {
    ...state,
    hp: state.maxHp,
    hitDiceLeft: state.level,
    spellSlots: [...state.maxSpellSlots],
  };
}
