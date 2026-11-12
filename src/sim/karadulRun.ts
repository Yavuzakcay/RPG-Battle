/**
 * Kuyruk K48 Adım C: Karadul Çemberi denge ölçümü. Druid partisi (`k18-druid`) aynı senaryolarda, druid'in alt sınıfı
 * Toprak Çemberi (SRD'nin tek Druid alt sınıfı) ve Karadul (ev kuralı açık; insan biçiminde CON↔CHA temel skor
 * değişimi: CHA'ya dayanan yapı). Tablo alt sınıf × seviye kazanma oranı.
 *   npm run sim:karadul -- 100 [--seviye 3,7,11,15] [--senaryo col,kale,magara,orman] [--alt karadul-cemberi]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, measure, setPartyKind, setPartySubclass, setSimHouseRules } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 100);
const levels = (opt('--seviye') ?? '3,7,11,15').split(',').map(Number);
const ids = (opt('--senaryo') ?? 'col,kale,magara,orman').split(',');
setPartyKind(opt('--parti') ?? 'k18-druid');
setSimHouseRules({ karadulCemberi: true });
const scen = ids.map((id) => { const s = SCENARIOS.find((x) => x.id === id); if (!s) throw new Error(`senaryo yok: ${id}`); return s; });
console.log(`| Alt sınıf | ${levels.map((l) => `Sv ${l}`).join(' | ')} | Ort. |`);
console.log(`|---|${levels.map(() => '---').join('|')}|---|`);
const only = opt('--alt');
for (const [label, sub, swap] of ([['Toprak Çemberi', 'circle-of-the-land', undefined], ['Karadul Çemberi', 'karadul-cemberi', ['con', 'cha']]] as const).filter(([, id]) => !only || id === only)) {
  setPartySubclass({ classId: 'druid', subclassId: sub, ...(swap ? { swap: [swap[0], swap[1]] } : {}) });
  const row = levels.map((lv) => {
    let w = 0, n = 0;
    for (const s of scen) { const m = measure(s, runs, 1, lv); w += m.partyWins; n += m.runs; }
    return w / n;
  });
  const avg = row.reduce((a, b) => a + b, 0) / row.length;
  console.log(`| ${label} | ${row.map((x) => `${Math.round(x * 100)}%`).join(' | ')} | ${Math.round(avg * 100)}% |`);
}
