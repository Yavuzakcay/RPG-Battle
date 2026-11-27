/**
 * Elle zar akışı (arayüz): oyun adımını (`(rng) => sonuç`) zar defteri üstünden çalıştırır; elle atılacak bir
 * zar grubu gerekirse adımı bekletir ve isteği gösterir. Değerler girilince (ya da "Otomatik at") adım aynı
 * zarlarla baştan yeniden çalıştırılır. Zar modu otomatikse hiçbir şey sorulmaz; zarlar yine kaydedilir
 * (`dice_rolled` olayı, zar animasyonu).
 */
import { useRef, useState } from 'react';
import type { DiceRequest, Rng } from '../rules/dice';
import { askFor, autoDice, enterDice, enterReaction, newBook, runStep, type DiceBook, type DiceMode } from '../rules/manualDice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';

export interface PendingDice {
  request: DiceRequest;
  /** Bu adımda daha önce girilen grup sayısı (istem başlığında "2. zar" gibi değil, yalnızca bilgi). */
  step: number;
  /** Görev ODA-2: istem oyuncunun cihazına gitti (cevap bekleniyor; Game Master yine de girebilir). */
  remote?: boolean;
}

/**
 * Görev ODA-2: çevrimiçi odada zar/tepki istemini sahibinin cihazına yollar. `null`: bu istem uzak değil (yerel sorulur).
 * Cevap gelince adım aynı defterle sürer; Game Master yerelde girer ya da vazgeçerse `kapat` uzak istemi kaldırır.
 */
export interface RemoteAsker {
  dice(req: DiceRequest): { id: string; result: Promise<number[] | null> } | null;
  reaction(req: ReactionRequest): { id: string; result: Promise<ReactionAnswer> } | null;
  close(id: string): void;
}

export interface DiceFlow<T> {
  pending: PendingDice | null;
  /** Oyuncuya sorulan tepki kararı (Görev R1). */
  reaction: ReactionRequest | null;
  /** Görev ODA-2: tepki istemi oyuncunun cihazında. */
  reactionRemote: boolean;
  /** Tepki kararı (null: kullanma); adım aynı zarlarla yeniden çalışır. */
  answer: (a: ReactionAnswer) => void;
  /** Adımı çalıştırır; zar gerekiyorsa bekletir. */
  play: (fn: (rng: Rng) => T) => void;
  /** Elle girilen değerler (geçerliliği istem denetler). */
  enter: (values: number[]) => void;
  /** Bekleyen grubu otomatik atar. */
  autoRoll: () => void;
  /** Adımdan vazgeçer (durum değişmez). */
  cancel: () => void;
}

interface Waiting<T> { fn: (rng: Rng) => T; book: DiceBook; request: DiceRequest | null; reaction: ReactionRequest | null; step: number; remote?: string }

/**
 * `mode`: zar modu; `isPlayer`: zarı atan oyuncu karakteri mi; `done`: adım bitince sonuç (oturum).
 * `auto`: otomatik zarlar (varsayılan Math.random; testlerde tohumlu).
 */
export function useDiceFlow<T>(mode: DiceMode, isPlayer: (id: string) => boolean, done: (value: T) => void, auto: Rng = Math.random,
  reaction?: (req: ReactionRequest) => ReactionAnswer | 'ask', remote?: RemoteAsker | null): DiceFlow<T> {
  const [waiting, setWaiting] = useState<Waiting<T> | null>(null);
  // Görev ODA-2: uzak cevabın hâlâ geçerli olduğunu anlamak için istem sayacı (Game Master önce karar verirse eskir).
  const token = useRef(0);
  const opts = { ask: askFor(mode, isPlayer), auto, ...(reaction ? { reaction } : {}) };
  const step = (fn: (rng: Rng) => T, book: DiceBook, count: number) => {
    const my = ++token.current;
    const r = runStep(fn, book, opts);
    if (r.ok) { setWaiting(null); done(r.value); return; }
    if ('reaction' in r) {
      const far = remote?.reaction(r.reaction) ?? null;
      setWaiting({ fn, book, request: null, reaction: r.reaction, step: count, ...(far ? { remote: far.id } : {}) });
      far?.result.then((a) => { if (token.current === my) step(fn, enterReaction(book, a), count + 1); });
      return;
    }
    const far = remote?.dice(r.need) ?? null;
    setWaiting({ fn, book, request: r.need, reaction: null, step: count, ...(far ? { remote: far.id } : {}) });
    far?.result.then((v) => { if (token.current === my) step(fn, v ? enterDice(book, r.need, v) : autoDice(book, r.need, auto), count + 1); });
  };
  /** Yerel karar uzak istemi geçersiz kılar (önce sayaç, sonra kapat: kapatılan istemin cevabı uygulanmaz). */
  const local = () => { const id = waiting?.remote; token.current++; if (id) remote?.close(id); };
  return {
    pending: waiting?.request ? { request: waiting.request, step: waiting.step, ...(waiting.remote ? { remote: true } : {}) } : null,
    reaction: waiting?.reaction ?? null,
    reactionRemote: !!waiting?.reaction && !!waiting.remote,
    answer: (a) => { if (waiting?.reaction) { local(); step(waiting.fn, enterReaction(waiting.book, a), waiting.step + 1); } },
    play: (fn) => { local(); step(fn, newBook(), 0); },
    enter: (values) => { if (waiting?.request) { local(); step(waiting.fn, enterDice(waiting.book, waiting.request, values), waiting.step + 1); } },
    autoRoll: () => { if (waiting?.request) { local(); step(waiting.fn, autoDice(waiting.book, waiting.request, auto), waiting.step + 1); } },
    cancel: () => { local(); setWaiting(null); },
  };
}
