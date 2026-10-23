/**
 * Elle zar akışı (arayüz): oyun adımını (`(rng) => sonuç`) zar defteri üstünden çalıştırır; elle atılacak bir
 * zar grubu gerekirse adımı bekletir ve isteği gösterir. Değerler girilince (ya da "Otomatik at") adım aynı
 * zarlarla baştan yeniden çalıştırılır. Zar modu otomatikse hiçbir şey sorulmaz; zarlar yine kaydedilir
 * (`dice_rolled` olayı, zar animasyonu).
 */
import { useState } from 'react';
import type { DiceRequest, Rng } from '../rules/dice';
import { askFor, autoDice, enterDice, enterReaction, newBook, runStep, type DiceBook, type DiceMode } from '../rules/manualDice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';

export interface PendingDice {
  request: DiceRequest;
  /** Bu adımda daha önce girilen grup sayısı (istem başlığında "2. zar" gibi değil, yalnızca bilgi). */
  step: number;
}

export interface DiceFlow<T> {
  pending: PendingDice | null;
  /** Oyuncuya sorulan tepki kararı (Görev R1). */
  reaction: ReactionRequest | null;
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

interface Waiting<T> { fn: (rng: Rng) => T; book: DiceBook; request: DiceRequest | null; reaction: ReactionRequest | null; step: number }

/**
 * `mode`: zar modu; `isPlayer`: zarı atan oyuncu karakteri mi; `done`: adım bitince sonuç (oturum).
 * `auto`: otomatik zarlar (varsayılan Math.random; testlerde tohumlu).
 */
export function useDiceFlow<T>(mode: DiceMode, isPlayer: (id: string) => boolean, done: (value: T) => void, auto: Rng = Math.random,
  reaction?: (req: ReactionRequest) => ReactionAnswer | 'ask'): DiceFlow<T> {
  const [waiting, setWaiting] = useState<Waiting<T> | null>(null);
  const opts = { ask: askFor(mode, isPlayer), auto, ...(reaction ? { reaction } : {}) };
  const step = (fn: (rng: Rng) => T, book: DiceBook, count: number) => {
    const r = runStep(fn, book, opts);
    if (r.ok) { setWaiting(null); done(r.value); return; }
    if ('reaction' in r) setWaiting({ fn, book, request: null, reaction: r.reaction, step: count });
    else setWaiting({ fn, book, request: r.need, reaction: null, step: count });
  };
  return {
    pending: waiting?.request ? { request: waiting.request, step: waiting.step } : null,
    reaction: waiting?.reaction ?? null,
    answer: (a) => { if (waiting?.reaction) step(waiting.fn, enterReaction(waiting.book, a), waiting.step + 1); },
    play: (fn) => step(fn, newBook(), 0),
    enter: (values) => { if (waiting?.request) step(waiting.fn, enterDice(waiting.book, waiting.request, values), waiting.step + 1); },
    autoRoll: () => { if (waiting?.request) step(waiting.fn, autoDice(waiting.book, waiting.request, auto), waiting.step + 1); },
    cancel: () => setWaiting(null),
  };
}
