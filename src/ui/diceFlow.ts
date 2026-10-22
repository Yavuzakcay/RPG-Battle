/**
 * Elle zar akışı (arayüz): oyun adımını (`(rng) => sonuç`) zar defteri üstünden çalıştırır; elle atılacak bir
 * zar grubu gerekirse adımı bekletir ve isteği gösterir. Değerler girilince (ya da "Otomatik at") adım aynı
 * zarlarla baştan yeniden çalıştırılır. Zar modu otomatikse hiçbir şey sorulmaz; zarlar yine kaydedilir
 * (`dice_rolled` olayı, zar animasyonu).
 */
import { useState } from 'react';
import type { DiceRequest, Rng } from '../rules/dice';
import { askFor, autoDice, enterDice, newBook, runWithDice, type DiceBook, type DiceMode } from '../rules/manualDice';

export interface PendingDice {
  request: DiceRequest;
  /** Bu adımda daha önce girilen grup sayısı (istem başlığında "2. zar" gibi değil, yalnızca bilgi). */
  step: number;
}

export interface DiceFlow<T> {
  pending: PendingDice | null;
  /** Adımı çalıştırır; zar gerekiyorsa bekletir. */
  play: (fn: (rng: Rng) => T) => void;
  /** Elle girilen değerler (geçerliliği istem denetler). */
  enter: (values: number[]) => void;
  /** Bekleyen grubu otomatik atar. */
  autoRoll: () => void;
  /** Adımdan vazgeçer (durum değişmez). */
  cancel: () => void;
}

interface Waiting<T> { fn: (rng: Rng) => T; book: DiceBook; request: DiceRequest; step: number }

/**
 * `mode`: zar modu; `isPlayer`: zarı atan oyuncu karakteri mi; `done`: adım bitince sonuç (oturum).
 * `auto`: otomatik zarlar (varsayılan Math.random; testlerde tohumlu).
 */
export function useDiceFlow<T>(mode: DiceMode, isPlayer: (id: string) => boolean, done: (value: T) => void, auto: Rng = Math.random): DiceFlow<T> {
  const [waiting, setWaiting] = useState<Waiting<T> | null>(null);
  const opts = { ask: askFor(mode, isPlayer), auto };
  const step = (fn: (rng: Rng) => T, book: DiceBook, count: number) => {
    const r = runWithDice(fn, book, opts);
    if (r.ok) { setWaiting(null); done(r.value); } else setWaiting({ fn, book, request: r.need, step: count });
  };
  return {
    pending: waiting ? { request: waiting.request, step: waiting.step } : null,
    play: (fn) => step(fn, newBook(), 0),
    enter: (values) => { if (waiting) step(waiting.fn, enterDice(waiting.book, waiting.request, values), waiting.step + 1); },
    autoRoll: () => { if (waiting) step(waiting.fn, autoDice(waiting.book, waiting.request, auto), waiting.step + 1); },
    cancel: () => setWaiting(null),
  };
}
