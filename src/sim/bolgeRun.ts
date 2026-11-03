/**
 * Denge turu: bölge × parti seviyesi ölçümü (bölge karşılaşma üreteci, `src/journey/encounter.ts`).
 *   npm run sim:bolge -- 30 [--bolge buzul,dag] [--seviye 1,5,9] [--carpan 1] [--zorluk moderate] [--parti standart]
 * Her tohumda karşılaşma ayrı üretilir (üreteç zarı tohumdan türetilir, savaş zarı tohumun kendisi); sonuç tekrarlanabilir.
 * Satır: bölge, seviye, kazanma, berabere, ort. tur, ölüm oranı, ort. düşman sayısı, bütçenin dolma oranı, örnek liste.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { simulate, roundLimit, setPartyKind, partyAt } = await import('./balance');
const { REGIONS, regionEncounter } = await import('../journey/encounter');
const { seededRng } = await import('../rules/dice');
const { applyRuleFlags } = await import('./ruleFlags');

declare const process: { argv: string[]; env: Record<string, string | undefined> };
let args = process.argv.slice(2).filter((a) => a !== '--');
args = applyRuleFlags(args, process.env);
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 30);
const levels = (opt('--seviye') ?? '1,5,9,13,17,20').split(',').map(Number);
const regions = (opt('--bolge') ?? REGIONS.map((r) => r.id).join(',')).split(',');
const multiplier = Number(opt('--carpan') ?? 1);
const difficulty = (opt('--zorluk') ?? 'moderate') as 'low' | 'moderate' | 'high';
if (opt('--parti')) setPartyKind(opt('--parti') as string);
const header = !args.includes('--satir');
const pct = (a: number, b: number) => `${Math.round((100 * a) / b)}%`;

if (header) {
  console.log(`| Bölge | Seviye | Kazanma | Berabere | Ort. tur | ≥1 ölüm | Ort. düşman | Bütçe dolumu | Örnek (tohum 1) |`);
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---|');
}
for (const rid of regions) {
  const region = REGIONS.find((r) => r.id === rid);
  if (!region) throw new Error(`bölge yok: ${rid}`);
  for (const level of levels) {
    const size = partyAt(level).length;
    let wins = 0, timeouts = 0, rounds = 0, deaths = 0, foes = 0, fill = 0;
    let sample = '';
    for (let seed = 1; seed <= runs; seed++) {
      const enc = regionEncounter(region, Array(size).fill(level), seededRng(seed * 7919 + level), { difficulty, multiplier });
      if (seed === 1) sample = Object.entries(enc.enemies).map(([k, n]) => `${k} ×${n}`).join(', ');
      foes += Object.values(enc.enemies).reduce((a, b) => a + b, 0);
      fill += enc.xp / enc.budget;
      const r = simulate({ id: `bolge-${rid}`, name: region.ad.tr, map: region.harita, enemies: enc.enemies }, seed, roundLimit(level), level);
      if (r.winner === 'party') wins++;
      if (r.winner === 'timeout') timeouts++;
      if (r.pcDead > 0) deaths++;
      rounds += r.rounds;
    }
    console.log(`| ${region.ad.tr} | ${level} | ${pct(wins, runs)} | ${pct(timeouts, runs)} | ${(rounds / runs).toFixed(1)} | ${pct(deaths, runs)} | ${(foes / runs).toFixed(1)} | ${pct(fill, runs)} | ${sample} |`);
  }
}
