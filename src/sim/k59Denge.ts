/**
 * Kuyruk K59 Görev 4: denge turu ölçümü. Birim = (seviye, sınıf, alt sınıf, senaryo) × tohum; `k18-<sınıf>` partisi,
 * sınıfın SRD alt sınıfı ile imza alt sınıfı (ev kuralı açık) ya da Karadul (druid; `karadulCemberi`, skor takası
 * STR↔CHA/CON↔WIS yok: aynı sheet). Sonuç her birim bitince JSON satırı olarak eklenir (yarıda kalan ölçüm sürer:
 * dosyada olan birim atlanır). Paralel: `--parca i/N` birimleri böler.
 *   npx vite-node src/sim/k59Denge.ts -- 100 --cikti denge.jsonl [--seviye 3,7,11,15,20] [--senaryo col,orman,magara]
 *     [--sinif barbarian,...] [--alt srd|ozel|hepsi] [--parca 0/4]
 */
import { loadTrExtra } from '../i18n';
import { classData, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, measure, setPartyKind, setPartySubclass, setSimHouseRules } = await import('./balance');

declare const process: { argv: string[] };
type FsLike = { appendFileSync(p: string, d: string): void; existsSync(p: string): boolean; readFileSync(p: string, e: string): string; readdirSync(p: string): string[]; mkdirSync(p: string, o?: { recursive?: boolean }): void };
const NODE_FS: string = 'node:fs';
const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike;
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 100);
const levels = (opt('--seviye') ?? '3,7,11,15,20').split(',').map(Number);
const scen = (opt('--senaryo') ?? 'col,orman,magara').split(',');
const out = opt('--cikti') ?? 'denge.jsonl';
const which = opt('--alt') ?? 'hepsi';
const [part, parts] = (opt('--parca') ?? '0/1').split('/').map(Number) as [number, number];
const classes = (opt('--sinif') ?? 'barbarian,bard,cleric,druid,fighter,monk,paladin,ranger,rogue,sorcerer,warlock,wizard').split(',');

interface Unit { level: number; cls: string; sub: string; house: string | null; scenario: string }
const units: Unit[] = [];
for (const level of levels) for (const cls of classes) {
  const srd = classData.subclasses.find((s) => s.class === cls && !s.ev);
  const own = classData.subclasses.find((s) => s.class === cls && s.ev);
  const subs = [...(which !== 'ozel' && srd ? [{ id: srd.id, house: null }] : []), ...(which !== 'srd' && own ? [{ id: own.id, house: own.evKurali ?? null }] : [])];
  for (const s of subs) for (const scenario of scen) units.push({ level, cls, sub: s.id, house: s.house, scenario });
}
const done = new Set<string>();
const key = (u: Unit) => `${u.level}|${u.cls}|${u.sub}|${u.scenario}|${runs}`;
const dir = out.includes('/') ? out.slice(0, out.lastIndexOf('/')) : '.';
// K60: yalnız `--kap` kipinde klasörün bütün *.jsonl dosyaları (işçilerin ortak sonucu); yoksa yalnız kendi çıktısı
// (aynı klasördeki başka denemenin sonuçları yapılmış sayılmasın).
const doneFiles = args.includes('--kap') ? fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl')).map((f) => `${dir}/${f}`) : fs.existsSync(out) ? [out] : [];
for (const f of doneFiles.map((x) => x.slice(dir.length + 1))) for (const line of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n').filter(Boolean)) {
  try { const r = JSON.parse(line) as Unit & { runs: number }; done.add(`${r.level}|${r.cls}|${r.sub}|${r.scenario}|${r.runs}`); } catch { /* yarım satır */ }
}
const mine = units.filter((_, i) => i % parts === part).filter((u) => !done.has(key(u)));
console.log(`birim ${units.length}, bu parça ${mine.length} (yapılmış ${done.size})`);
/** `--kap`: birimler klasördeki kilit dizinleriyle kapılır (her sayıda işçi; aynı birim iki kez ölçülmez). */
const grab = args.includes('--kap');
for (const u of mine) {
  if (grab) {
    const lock = `${dir}/kilit/${key(u).replace(/[|]/g, '_')}`;
    try { fs.mkdirSync(`${dir}/kilit`, { recursive: true }); fs.mkdirSync(lock); } catch { continue; }
  }
  const sc = SCENARIOS.find((s) => s.id === u.scenario);
  if (!sc) throw new Error(`senaryo yok: ${u.scenario}`);
  setPartyKind(`k18-${u.cls}`);
  setSimHouseRules(u.house ? { [u.house]: true } : {});
  setPartySubclass({ classId: u.cls, subclassId: u.sub });
  const t0 = Date.now();
  const m = measure(sc, runs, 1, u.level);
  fs.appendFileSync(out, `${JSON.stringify({ ...u, runs, wins: m.partyWins, timeouts: m.timeouts, avgRounds: +m.avgRounds.toFixed(2), avgDead: +m.avgDead.toFixed(2), sn: Math.round((Date.now() - t0) / 1000) })}\n`);
}
