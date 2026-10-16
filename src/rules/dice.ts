/**
 * Zar atma kuralları. Arayüzden bağımsızdır: ekran, tarayıcı veya sunucu bilmez.
 * Rastgelelik dışarıdan verilebilir (Rng), böylece testlerde sonuçları önceden belirleriz.
 */

/** 0 veya daha büyük, 1'den küçük bir sayı üretir (Math.random ile aynı sözleşme). */
export type Rng = () => number;

export interface DiceSpec {
  count: number; // kaç zar
  sides: number; // kaç yüzlü
  bonus: number; // eklenen sabit sayı (negatif olabilir)
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

const DICE_PATTERN = /^\s*(\d*)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i;

/** "2d6+3", "d20", "1d8-1" gibi bir ifadeyi ayrıştırır. */
export function parseDice(expression: string): DiceSpec {
  const match = DICE_PATTERN.exec(expression);
  if (!match) {
    throw new Error(`Geçersiz zar ifadesi: "${expression}"`);
  }
  const count = match[1] === '' || match[1] === undefined ? 1 : Number(match[1]);
  const sides = Number(match[2]);
  const bonus = match[3] ? (match[3] === '-' ? -1 : 1) * Number(match[4]) : 0;
  if (count < 1 || sides < 2) {
    throw new Error(`Geçersiz zar ifadesi: "${expression}"`);
  }
  return { count, sides, bonus };
}

/** Tek bir zar atar: 1 ile `sides` arasında bir tam sayı. */
export function rollDie(sides: number, rng: Rng = Math.random): number {
  const value = Math.floor(rng() * sides) + 1;
  return Math.min(sides, Math.max(1, value));
}

export interface DiceResult {
  rolls: number[]; // atılan her zarın değeri
  bonus: number;
  total: number; // zarların toplamı + bonus
}

/**
 * Bir zar ifadesini atar. `critical` doğruysa zar sayısı iki katına çıkar,
 * sabit bonus ise ikiye katlanmaz (5E kritik vuruş kuralı).
 */
export function rollDice(
  spec: DiceSpec | string,
  rng: Rng = Math.random,
  critical = false,
): DiceResult {
  const s = typeof spec === 'string' ? parseDice(spec) : spec;
  const count = critical ? s.count * 2 : s.count;
  const rolls = Array.from({ length: count }, () => rollDie(s.sides, rng));
  const total = rolls.reduce((sum, r) => sum + r, 0) + s.bonus;
  return { rolls, bonus: s.bonus, total };
}

export interface D20Result {
  rolls: number[]; // 1 zar (normal) veya 2 zar (avantaj/dezavantaj)
  kept: number; // sayılan zar
  mode: RollMode;
}

/** d20 atar. Avantajda iki zardan yükseği, dezavantajda düşüğü sayılır. */
export function rollD20(mode: RollMode = 'normal', rng: Rng = Math.random): D20Result {
  const first = rollDie(20, rng);
  if (mode === 'normal') {
    return { rolls: [first], kept: first, mode };
  }
  const second = rollDie(20, rng);
  const kept = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second);
  return { rolls: [first, second], kept, mode };
}

/** Tohumlu zar (mulberry32): aynı tohum aynı dizi. Simülasyon ve tekrarlanabilir yerleşim için. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
