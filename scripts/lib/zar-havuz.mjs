// Dosya başına işçi (worker_threads) + zaman aşımı: eşzamanlı sıcak döngüde takılan görsel tüm betiği kilitlemesin.
// runJob: işçiyi başlatır, `step` mesajlarını toplar, süre dolarsa işçiyi sonlandırır ve son adımı raporlar.
import { Worker } from 'node:worker_threads';

/** @returns {Promise<{ ok: boolean, result?: any, error?: string, timedOut?: boolean, lastStep: string, ms: number, steps: {name:string, ms:number}[] }>} */
export function runJob(workerFile, job, { timeoutMs = 60000, onStep, evalCode } = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const steps = [];
    let lastStep = 'başlangıç', lastAt = t0, done = false;
    const w = evalCode ? new Worker(evalCode, { eval: true, workerData: job }) : new Worker(workerFile, { workerData: job });
    const close = (r) => {
      if (done) return;
      done = true; clearTimeout(timer);
      steps.push({ name: lastStep, ms: Date.now() - lastAt });
      w.terminate().finally(() => resolve({ ...r, lastStep, ms: Date.now() - t0, steps }));
    };
    const timer = setTimeout(() => close({ ok: false, timedOut: true, error: `zaman aşımı (${Math.round(timeoutMs / 1000)} sn)` }), timeoutMs);
    w.on('message', (m) => {
      if (m?.step) { const now = Date.now(); steps.push({ name: lastStep, ms: now - lastAt }); lastStep = m.step; lastAt = now; onStep?.(m.step); }
      else if (m?.done) close({ ok: true, result: m.result });
    });
    w.on('error', (e) => close({ ok: false, error: String(e?.message ?? e) }));
    w.on('exit', (c) => { if (!done) close({ ok: false, error: `işçi beklenmedik çıktı (kod ${c})` }); });
  });
}

/** `items` üzerinde en çok `n` işi aynı anda çalıştırır; sonuçlar sıra korunarak döner. */
export async function pool(items, n, fn) {
  const out = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
