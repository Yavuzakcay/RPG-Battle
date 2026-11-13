/**
 * Kuyruk MB8: binekli denge ölçümü (hafif mod). Partinin ilk üyesi Warhorse'un üstünde başlar (`binekStart.ts` `mountedStart`).
 *   npx vite-node src/sim/binekDengeRun.ts -- 100 col,kale,magara,orman --kip yok|bagimsiz|kontrollu [--seviye 5] [--parti standart] [--kural-surumu N]
 * Satır: parti kazanma, zaman aşımı, ortalama tur, ortalama ölü, ölüm oranı, savaş sonunda binek ayakta, binici hâlâ binekte.
 * Aralık (%60–80) dışı satırlar `harita/belgeler/DENGE.md`'ye elle yazılır; düzeltme denemesi yapılmaz.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, setupBattle, playBattle, roundLimit, seeded, setPartyKind } = await import('./balance');
const { mountedStart } = await import('./binekStart');
const { setDefaultRuleVersion } = await import('../battle/create');

declare const process: { argv: string[] };
let args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string, d: string): string => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1] ?? d; args = args.filter((_, j) => j !== i && j !== i + 1); return v; };
const kip = opt('--kip', 'bagimsiz') as 'yok' | 'bagimsiz' | 'kontrollu';
const level = Number(opt('--seviye', '5'));
const parti = opt('--parti', 'standart');
const surum = opt('--kural-surumu', '');
if (surum) setDefaultRuleVersion(Number(surum));
setPartyKind(parti);
const runs = Number(args[0] ?? 100) || 100;
const ids = (args[1] ?? 'col,kale,magara,orman').split(',');

const pct = (a: number) => `${Math.round(a * 100)}%`;
for (const id of ids) {
  const sc = SCENARIOS.find((s) => s.id === id);
  if (!sc) throw new Error(`senaryo yok: ${id}`);
  let wins = 0, timeouts = 0, rounds = 0, dead = 0, anyDeath = 0, mountUp = 0, stillRiding = 0;
  for (let seed = 1; seed <= runs; seed++) {
    const rng = seeded(seed);
    let st = setupBattle(sc, rng, level);
    if (kip !== 'yok') st = mountedStart(st, { control: kip === 'kontrollu' });
    const end = playBattle(st, rng, roundLimit(level));
    const winner = end.status === 'finished' ? (end.winner ?? 'timeout') : 'timeout';
    if (winner === 'party') wins++;
    if (winner === 'timeout') timeouts++;
    rounds += end.round;
    const pcs = Object.values(end.combatants).filter((c) => c.side === 'party' && !c.civilian && !c.summon && c.id !== 'binek-at');
    const d = pcs.filter((c) => c.life === 'dead').length;
    dead += d;
    if (d > 0) anyDeath++;
    const horse = end.combatants['binek-at'];
    if (horse && horse.hp > 0) mountUp++;
    if (Object.values(end.combatants).some((c) => c.riding === 'binek-at')) stillRiding++;
  }
  const inRange = wins / runs >= 0.6 && wins / runs <= 0.8;
  const mounted = kip === 'yok' ? '–' : `${pct(mountUp / runs)} / ${pct(stillRiding / runs)}`;
  console.log(`| ${sc.name} | ${level} | ${kip} | ${runs} | ${pct(wins / runs)} | ${pct(timeouts / runs)} | ${(rounds / runs).toFixed(1)} | ${(dead / runs).toFixed(2)} | ${pct(anyDeath / runs)} | ${mounted} | ${inRange ? 'aralıkta' : 'aralık dışı'} |`);
}
