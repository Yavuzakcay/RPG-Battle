/**
 * Elle zar girişi ve zar kaydı (Görev J). Arayüzden bağımsız, yan etkisiz.
 *
 * Yaklaşım "zar iste, sonra aynı değerlerle yeniden çalıştır": oyun adımı (komut, yapay zekâ turu, savaş kurulumu)
 * `(rng) => sonuç` biçiminde saf bir fonksiyondur. `runWithDice` onu bir zar defteri (`DiceBook`) üstünden çalıştırır:
 *  - defterde sırası gelen zar grubu varsa o değerler kullanılır;
 *  - yoksa ve grup elle atılacaksa (`ask`) `NeedDice` fırlatılır, fonksiyon yarıda kalır, hiçbir durum değişmez;
 *    arayüz zarları ister, değerleri deftere ekler ve fonksiyonu baştan yeniden çalıştırır;
 *  - elle atılmayacaksa otomatik atılır ve deftere yazılır (yeniden çalıştırmada aynı değer gelir).
 * Böylece yalnızca gerçekten gereken zarlar istenir: ıskada hasar zarı hiç atılmaz, kritikte zar sayısı iki katıdır,
 * avantajda iki d20 istenir. Motor `Rng` sözleşmesini olduğu gibi kullanır (`dice.ts` zar kancası).
 */
import { rollDie, type DiceRequest, type Rng } from './dice';
import type { ReactHook, ReactionAnswer, ReactionRequest } from './reactionChoice';

/** Atılmış bir zar grubu: istek + değerler; `manual` elle girildi. */
export interface DiceGroup extends DiceRequest {
  values: number[];
  manual?: boolean;
}

/** Defterin girdisi: zar grubu, ham sayı ya da tepki kararı (Görev R1). */
type Entry = { group: DiceGroup } | { raw: number } | { reaction: ReactionAnswer };

/** Bir oyun adımının zarları; yeniden çalıştırmalar arasında korunur. */
export interface DiceBook {
  entries: Entry[];
}

export const newBook = (): DiceBook => ({ entries: [] });

/** Elle atılması gereken zar grubu henüz girilmedi. */
export class NeedDice extends Error {
  constructor(readonly request: DiceRequest) {
    super('Zar bekleniyor');
  }
}

/** Oyuncuya sorulması gereken tepki kararı henüz verilmedi (Görev R1). */
export class NeedReaction extends Error {
  constructor(readonly request: ReactionRequest) {
    super('Tepki kararı bekleniyor');
  }
}

export interface DiceOptions {
  /** Bu grup elle mi atılacak (zar modu ve zarı atan yaratığa göre). */
  ask: (req: DiceRequest) => boolean;
  /** Otomatik zarlar için. */
  auto: Rng;
  /** Tepki kararı: `'ask'` oyuncuya sorulur; yoksa verilen karar. Tanımsızsa motorun önerisi. */
  reaction?: (req: ReactionRequest) => ReactionAnswer | 'ask';
}

/** Defter üstünden zar atan Rng (kancalı). `consumed` bu çalıştırmada kullanılan grup sayısı. */
export interface RecordingRng extends Rng {
  dice: (req: DiceRequest) => number[];
  react: ReactHook;
  /** Şu ana dek kullanılan zar grupları (sırayla). */
  groups: () => DiceGroup[];
}

export function recordingRng(book: DiceBook, opts: DiceOptions): RecordingRng {
  let i = 0;
  const used: DiceGroup[] = [];
  const rng = (() => {
    const e = book.entries[i];
    if (e && 'raw' in e) { i++; return e.raw; }
    if (e) throw new Error('Zar defteri uyuşmuyor (sayı yerine zar grubu ya da karar).');
    const raw = opts.auto();
    book.entries.push({ raw });
    i++;
    return raw;
  }) as RecordingRng;
  rng.dice = (req) => {
    const e = book.entries[i];
    if (e && 'group' in e) {
      if (e.group.sides !== req.sides || e.group.values.length !== req.count) throw new Error('Zar defteri uyuşmuyor (zar türü ya da sayısı).');
      i++;
      used.push(e.group);
      return e.group.values;
    }
    if (e) throw new Error('Zar defteri uyuşmuyor (zar grubu yerine sayı ya da karar).');
    if (opts.ask(req)) throw new NeedDice(req);
    const group: DiceGroup = { ...req, values: Array.from({ length: req.count }, () => rollDie(req.sides, opts.auto)) };
    book.entries.push({ group });
    i++;
    used.push(group);
    return group.values;
  };
  rng.react = (req) => {
    const e = book.entries[i];
    if (e && 'reaction' in e) { i++; return e.reaction; }
    if (e) throw new Error('Zar defteri uyuşmuyor (karar yerine zar).');
    const answer = opts.reaction ? opts.reaction(req) : req.suggested;
    if (answer === 'ask') throw new NeedReaction(req);
    book.entries.push({ reaction: answer });
    i++;
    return answer;
  };
  rng.groups = () => [...used];
  return rng;
}

export const isRecording = (rng: Rng): rng is RecordingRng => typeof (rng as Partial<RecordingRng>).groups === 'function';

export type DiceRun<T> = { ok: true; value: T; groups: DiceGroup[] } | { ok: false; need: DiceRequest };

/** Adımı defter üstünden çalıştırır; elle zar eksikse hangi grubun istendiğini döndürür. */
export function runWithDice<T>(fn: (rng: Rng) => T, book: DiceBook, opts: DiceOptions): DiceRun<T> {
  const rng = recordingRng(book, opts);
  try {
    const value = fn(rng);
    return { ok: true, value, groups: rng.groups() };
  } catch (e) {
    if (e instanceof NeedDice) return { ok: false, need: e.request };
    throw e;
  }
}

export type StepRun<T> = DiceRun<T> | { ok: false; reaction: ReactionRequest };

/** `runWithDice` gibi; tepki kararı oyuncuya sorulacaksa isteği döndürür (Görev R1). */
export function runStep<T>(fn: (rng: Rng) => T, book: DiceBook, opts: DiceOptions): StepRun<T> {
  try {
    return runWithDice(fn, book, opts);
  } catch (e) {
    if (e instanceof NeedReaction) return { ok: false, reaction: e.request };
    throw e;
  }
}

/** Oyuncunun tepki kararını deftere ekler (sıradaki istek için). */
export function enterReaction(book: DiceBook, answer: ReactionAnswer): DiceBook {
  return { entries: [...book.entries, { reaction: answer }] };
}

/** Elle girilen grubu deftere ekler (sıradaki istek için). */
export function enterDice(book: DiceBook, req: DiceRequest, values: number[]): DiceBook {
  return { entries: [...book.entries, { group: { ...req, values, manual: true } }] };
}

/** "Otomatik at": istenen grubu bu kez otomatik atar. */
export function autoDice(book: DiceBook, req: DiceRequest, auto: Rng): DiceBook {
  return { entries: [...book.entries, { group: { ...req, values: Array.from({ length: req.count }, () => rollDie(req.sides, auto)) } }] };
}

/**
 * Elle girilen değerleri denetler: sayı adedi isteğe eşit, her biri 1..yüz sayısı arasında tam sayı.
 * Hata yoksa sayılar, varsa hatalı alanların sırası.
 */
export function parseDiceInput(texts: string[], req: DiceRequest): { ok: true; values: number[] } | { ok: false; bad: number[] } {
  const bad: number[] = [];
  const values = texts.map((t, i) => {
    const s = t.trim();
    const n = /^\d+$/.test(s) ? Number(s) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > req.sides) bad.push(i);
    return n;
  });
  if (texts.length !== req.count) for (let i = texts.length; i < req.count; i++) bad.push(i);
  return bad.length ? { ok: false, bad } : { ok: true, values };
}

/** Zar modu: otomatik, yalnızca oyuncu karakterleri fiziksel zar atar, herkes (canavarlar dahil, Game Master atar). */
export type DiceMode = 'auto' | 'players' | 'everyone';
export const DICE_MODES: readonly DiceMode[] = ['auto', 'players', 'everyone'];

/** Zar moduna göre "bu grup elle mi" kararı. `isPlayer`: zarı atan oyuncu karakteri mi (masum değil). */
export function askFor(mode: DiceMode, isPlayer: (id: string) => boolean): (req: DiceRequest) => boolean {
  if (mode === 'everyone') return () => true;
  if (mode === 'players') return (req) => req.by !== undefined && isPlayer(req.by);
  return () => false;
}
