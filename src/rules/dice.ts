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

/** Zarın amacı (elle zar isteğinde ve zar animasyonunda yazılır). */
export type RollKind = 'attack' | 'damage' | 'save' | 'check' | 'initiative' | 'deathSave' | 'heal' | 'percent' | 'recharge';

/** Zarı kimin, ne için attığı; sonuca etkisi yok, yalnızca elle giriş ve gösterim için. */
export interface RollInfo {
  kind?: RollKind;
  /** Zarı atan yaratığın kimliği (yoksa ortam / Game Master). */
  by?: string;
  /** Zara eklenen sabit (saldırı bonusu, kurtarma zarı değiştiricisi...). */
  bonus?: number;
}

/** Bir zar grubu isteği: `count` adet `sides` yüzlü zar (avantajda iki d20, kritikte iki kat zar). */
export interface DiceRequest extends RollInfo {
  sides: number;
  count: number;
  mode?: RollMode;
  critical?: boolean;
}

/**
 * Zar kancası (isteğe bağlı): Rng bir fonksiyondur; üstünde `dice` varsa zar fonksiyonları sayıyı kendileri
 * üretmek yerine bütün grubu ona sorar (elle zar girişi, zar kaydı; `src/rules/manualDice.ts`). Kancasız Rng'de
 * (Math.random, tohumlu, testlerin betikli Rng'si) hiçbir şey değişmez: aynı çağrılar, aynı sonuçlar.
 */
export type DiceHook = (req: DiceRequest) => number[];
type HookedRng = Rng & { dice?: DiceHook };

const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const diceHookOf = (rng: Rng): DiceHook | undefined => (rng as HookedRng).dice;

/**
 * Zar bilgisini (kim, ne için) Rng'ye iliştirir. Kancasız Rng'yi olduğu gibi döndürür. İçteki (zara yakın)
 * bilgi dıştakinden önceliklidir: `resolveSave` 'save' der, çağıran yer yalnızca kimin attığını söyler.
 */
export function rollTag(rng: Rng, info: RollInfo): Rng {
  const parent = diceHookOf(rng);
  if (!parent) return rng;
  const outer = clean(info);
  const tagged = (() => rng()) as HookedRng;
  tagged.dice = (req) => parent({ ...outer, ...clean(req) });
  return tagged;
}

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
  const hook = diceHookOf(rng);
  if (hook) return hook({ sides, count: 1 })[0] as number;
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
  const hook = diceHookOf(rng);
  const rolls = hook
    ? hook({ sides: s.sides, count, ...(s.bonus ? { bonus: s.bonus } : {}), ...(critical ? { critical: true } : {}) })
    : Array.from({ length: count }, () => rollDie(s.sides, rng));
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
  const hook = diceHookOf(rng);
  if (hook) {
    const [a, b] = hook({ sides: 20, count: mode === 'normal' ? 1 : 2, ...(mode !== 'normal' ? { mode } : {}) }) as [number, number];
    if (mode === 'normal') return { rolls: [a], kept: a, mode };
    return { rolls: [a, b], kept: mode === 'advantage' ? Math.max(a, b) : Math.min(a, b), mode };
  }
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
