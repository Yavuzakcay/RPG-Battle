/**
 * Kuyruk K75b: kural sürümü 78 ↔ 79 karşılaştırması (binekli olmayan savaş; Çöl, Kale, Mağara, Orman, 3. seviye standart parti).
 * Çalıştırma: `npx vite-node src/sim/k75bKarsilastir.ts -- 30 [col,kale,magara,orman] [--kip yok|bagimsiz]`.
 * Tohum başına kazanan, tur ve son durum imzası; fark varsa tohum listelenir.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import type { BattleState } from '../battle/types';

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const seeds = Number(args[0] ?? 30);
const ids = (args[1] && !args[1].startsWith('--') ? args[1] : 'col,kale,magara,orman').split(',');
const kip = args.includes('--kip') ? args[args.indexOf('--kip') + 1] : 'yok';

await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, setupBattle, playBattle, seeded } = await import('./balance');
const { mountedStart } = await import('./binekStart');
const { setDefaultRuleVersion } = await import('../battle/create');
const { CURRENT_RULES } = await import('../battle/ruleVersion');

function run(id: string, seed: number, ver: number) {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const rng = seeded(seed);
  const start: BattleState = setupBattle(s, rng, 3);
  return playBattle(kip === 'yok' ? start : mountedStart(start, { control: kip === 'kontrollu' }), rng, 20);
}
const sig = (e: BattleState) => Object.values(e.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}`).sort().join(';');

for (const id of ids) {
  let w78 = 0, w79 = 0, r78 = 0, r79 = 0;
  const diff: number[] = [];
  const diffWin: number[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const a = run(id, seed, 78);
    const b = run(id, seed, 79);
    if (a.winner === 'party') w78++;
    if (b.winner === 'party') w79++;
    r78 += a.round;
    r79 += b.round;
    if (a.winner !== b.winner || a.round !== b.round) diffWin.push(seed);
    if (sig(a) !== sig(b)) diff.push(seed);
  }
  console.log(`K75B ${id} tohum=${seeds} kip=${kip} | 78: kazanma ${w78}/${seeds}, tur ort ${(r78 / seeds).toFixed(2)} | 79: kazanma ${w79}/${seeds}, tur ort ${(r79 / seeds).toFixed(2)} | imza farkı ${diff.length} [${diff.join(',')}] | sonuç/tur farkı ${diffWin.length}`);
}
setDefaultRuleVersion(CURRENT_RULES);
