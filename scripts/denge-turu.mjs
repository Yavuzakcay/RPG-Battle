/**
 * Dungeondex öncesi denge turu koşucusu: iş kuyruğu, en çok N süreç, sonuçlar sim-sonuc/denge-turu/<iş>.txt (git'e girmez).
 * Yarıda kalırsa yeniden çalıştırınca biten işler (dosya sonunda "#BITTI") atlanır. `node scripts/denge-turu.mjs [--is 4] [--grup a,b,...] [--liste]`
 * Gruplar: sim5 a2 boss bolge sim3 sim1 zincir hapis k59 (varsayılan hepsi, bu sırayla). Tohum 100 (zincir 30).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { cpus } from 'node:os';
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const N = Number(opt('--is', String(cpus().length)));
const OUT = opt('--cikti', 'sim-sonuc/denge-turu'); mkdirSync(OUT, { recursive: true }); mkdirSync(`${OUT}/k59`, { recursive: true });
const bin = 'node_modules/.bin/vite-node';
const PARTIES = ['standart', 'barbar', 'yanel', 'paladin', 'monk', 'fighter', 'rogue', 'ranger', 'buyucu'];
const SCEN = ['col', 'kale', 'magara', 'orman'];
const G = {};
const simGroup = (L, scen = SCEN) => PARTIES.flatMap((p) => scen.map((s) => ({ id: `sim-L${L}-${p}-${s}`, args: ['src/sim/run.ts', '100', s, '--seviye', String(L), '--parti', p, '--satir'] })));
// Süre kararı (DECISIONS): a2 yalnız Çöl + Orman, bölge seviyeleri 1/5/9; 5. seviye 4 senaryo; 3. ve 1. seviye en yavaş iki senaryo (Kale, Mağara) çıkarılarak Çöl + Orman.
G.sim5 = simGroup(5); G.sim3 = simGroup(3, ['col', 'orman']); G.sim1 = simGroup(1, ['col', 'orman']);
G.a2 = ['a2-klasik', 'a2-karma', 'a2-ates'].flatMap((p) => [7, 9].flatMap((L) => ['normal', 'kolay'].map((z) => ({ id: `a2-${p}-L${L}-${z}`, args: ['src/sim/a2Run.ts', '100', '--parti', p, '--seviye', String(L), '--zorluk', z, '--senaryo', 'col,orman'] }))));
G.boss = ['beyaz-sehir', 'kale', 'hapishane', 'volkan'].flatMap((b) => ['normal', 'kolay'].map((z) => ({ id: `boss-${b}-${z}`, args: ['src/sim/bossRun.ts', '100', '--boss', b, '--zorluk', z] })));
const regions = JSON.parse(readFileSync('data/bolge-karsilasma.json', 'utf8')).bolgeler.map((r) => r.id);
G.bolge = regions.map((r) => ({ id: `bolge-${r}`, args: ['src/sim/bolgeRun.ts', '100', '--bolge', r, '--seviye', '1,5,9'] }));
G.zincir = [
  { id: 'zincir-normal', args: ['src/sim/chainRun.ts', '30', '--zorluk', 'normal'] },
  { id: 'zincir-derinlikler-mantar', args: ['src/sim/chainRun.ts', '30', '--sefer', 'derinlikler', '--seviye', '5', '--dal', 'mantar'] },
  { id: 'zincir-derinlikler-lav', args: ['src/sim/chainRun.ts', '30', '--sefer', 'derinlikler', '--seviye', '5', '--dal', 'lav'] },
];
G.hapis = [
  { id: 'hapishane-L3', args: ['src/sim/hapishaneRun.ts', '100', '--seviye', '3'] },
  { id: 'hapishane-L3-kolay', args: ['src/sim/hapishaneRun.ts', '100', '--seviye', '3', '--kolay'] },
  { id: 'k26-L3', args: ['src/sim/k26Run.ts', '100', '--seviye', '3'] },
];
G.k59 = [0, 1, 2, 3].map((i) => ({ id: `k59-w${i}`, args: ['src/sim/k59Denge.ts', '100', '--cikti', `${OUT}/k59/w${i}.jsonl`, '--seviye', '3', '--senaryo', 'col', '--kap'] }));
// ekstra: düzeltme turlarında Kale/Mağara'nın 1. ve 3. seviye taban ölçümü (standart parti).
G.ekstra = ['kale', 'magara'].flatMap((sc) => [1, 3].map((L) => ({ id: `sim-L${L}-standart-${sc}`, args: ['src/sim/run.ts', '100', sc, '--seviye', String(L), '--parti', 'standart', '--satir'] })));
// a2kale: HS1 sonrası Kale ve avlu üst seviye (7/9) taban ölçümü (a2 senaryo listesi Çöl+Orman'a daraltıldığı için ayrı).
G.a2kale = ['a2-klasik', 'a2-karma', 'a2-ates'].flatMap((p) => [7, 9].flatMap((L) => ['normal', 'kolay'].map((z) => ({ id: `a2kale-${p}-L${L}-${z}`, args: ['src/sim/a2Run.ts', '100', '--parti', p, '--seviye', String(L), '--zorluk', z, '--senaryo', 'kale'] }))));
// Düzeltme turları (yalnız etkilenen satırlar): `--cikti sim-sonuc/denge-turu-r1 --grup r1`.
const only = (list, ids) => list.filter((j) => ids.includes(j.id));
G.r1 = [
  ...G.boss, ...G.bolge,
  ...only(G.sim5, ['sim-L5-standart-col', 'sim-L5-standart-kale', 'sim-L5-standart-magara']),
  ...only(G.ekstra, ['sim-L1-standart-kale']),
  ...G.a2.filter((j) => j.id.endsWith('-kolay')),
];
G.r1b = [...only(G.ekstra, ['sim-L3-standart-kale'])];
const groups = (opt('--grup', 'sim5,a2,boss,bolge,sim3,sim1,zincir,hapis,k59')).split(',');
const jobs = groups.flatMap((g) => G[g] ?? []);
if (argv.includes('--liste')) { console.log(jobs.length, jobs.map((j) => j.id).join('\n')); process.exit(0); }
const done = (id) => existsSync(`${OUT}/${id}.txt`) && readFileSync(`${OUT}/${id}.txt`, 'utf8').includes('#BITTI');
// Aynı klasörü paylaşan birden çok koşucu: başlayan iş `#CALISIYOR` işareti yazar, öteki koşucu atlar (takılı kalırsa dosyayı silip yeniden çalıştır).
const todo = jobs.filter((j) => !existsSync(`${OUT}/${j.id}.txt`)); let running = 0, finished = 0; const t0 = Date.now();
const log = (m) => appendFileSync(`${OUT}/_ilerleme.log`, `${new Date().toISOString()} ${m}\n`);
log(`başladı: ${todo.length}/${jobs.length} iş`);
await new Promise((resolve) => {
  const next = () => {
    while (running < N && todo.length) {
      const j = todo.shift(); if (existsSync(`${OUT}/${j.id}.txt`)) continue; writeFileSync(`${OUT}/${j.id}.txt`, '#CALISIYOR\n'); running++;
      const p = spawn(bin, j.args); let out = '', err = '';
      p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
      p.on('close', (code) => {
        writeFileSync(`${OUT}/${j.id}.txt`, `${out}\n${code ? `#HATA ${code}\n${err.slice(-1500)}\n` : ''}#BITTI\n`);
        running--; finished++; log(`${j.id} bitti (kod ${code}); ${finished} biten, ${todo.length} bekleyen, ${Math.round((Date.now() - t0) / 60000)} dk`);
        if (!todo.length && !running) resolve(); else next();
      });
    }
    if (!todo.length && !running) resolve();
  };
  next();
});
log('hepsi bitti');
