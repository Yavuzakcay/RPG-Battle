/**
 * Kuyruk K50: imza alt sınıf denge ölçümü. Sınıfın `k18-<sınıf>` partisi aynı senaryolarda; sınıfın SRD alt sınıfı ile
 * imza alt sınıfı (ev kuralı açık) karşılaştırılır. Tablo alt sınıf × seviye kazanma oranı.
 *   npm run sim:imza -- 100 --alt imza_ciftci [--seviye 7] [--senaryo col,kale,magara,orman]
 */
import { loadTrExtra } from '../i18n';
import { classData, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, measure, setPartyKind, setPartySubclass, setSimHouseRules } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 100);
const levels = (opt('--seviye') ?? '7').split(',').map(Number);
const ids = (opt('--senaryo') ?? 'col,kale,magara,orman').split(',');
const alt = opt('--alt');
const sub = classData.subclasses.find((s) => s.id === alt);
if (!sub) throw new Error(`imza alt sınıfı yok: ${alt}`);
const srd = classData.subclasses.find((s) => s.class === sub.class && !s.ev);
if (!srd) throw new Error(`SRD alt sınıfı yok: ${sub.class}`);
setPartyKind(opt('--parti') ?? `k18-${sub.class}`);
setSimHouseRules(sub.evKurali ? { [sub.evKurali]: true } : {});
const scen = ids.map((id) => { const s = SCENARIOS.find((x) => x.id === id); if (!s) throw new Error(`senaryo yok: ${id}`); return s; });
console.log(`| Alt sınıf | ${levels.map((l) => `Sv ${l}`).join(' | ')} | Ort. |`);
console.log(`|---|${levels.map(() => '---').join('|')}|---|`);
const only = opt('--yalniz');
for (const s of [srd, sub].filter((x) => !only || x.id === only)) {
  setPartySubclass({ classId: sub.class, subclassId: s.id });
  const row = levels.map((lv) => {
    let w = 0, n = 0;
    for (const sc of scen) { const m = measure(sc, runs, 1, lv); w += m.partyWins; n += m.runs; }
    return w / n;
  });
  const avg = row.reduce((a, b) => a + b, 0) / row.length;
  console.log(`| ${s.name.tr} | ${row.map((x) => `${Math.round(x * 100)}%`).join(' | ')} | ${Math.round(avg * 100)}% |`);
}
