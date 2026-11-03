/**
 * Denge turu: tek senaryoyu belirli bir düşman listesiyle ölçer (ayar öncesi/sonrası karşılaştırması).
 *   npm run sim:liste -- 30 <senaryo> --seviye 15 [--liste '{"behir":1}'] [--parti standart]
 * `--liste` yoksa senaryonun o seviyedeki listesi (`data/sim-senaryolar.json`).
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, measure, setPartyKind, enemiesAt, setPartyDarkvision } = await import('./balance');
const { applyRuleFlags } = await import('./ruleFlags');

declare const process: { argv: string[]; env: Record<string, string | undefined> };
let args = process.argv.slice(2).filter((a) => a !== '--');
args = applyRuleFlags(args, process.env);
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const nums = args.filter((a, i) => /^\d+$/.test(a) && !['--seviye', '--parti-dv'].includes(args[i - 1] ?? ''));
const runs = Number(nums[0] ?? 30);
const level = Number(opt('--seviye') ?? 5);
if (opt('--parti')) setPartyKind(opt('--parti') as string);
// Denge turu (madde 4): `--parti-dv 0|60|120`: partinin karanlık görüşü (ırk etkisini ayırmak için).
if (opt('--parti-dv')) setPartyDarkvision(Number(opt('--parti-dv')));
const id = args.find((a, i) => !a.startsWith('--') && !/^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--'));
const base = SCENARIOS.find((s) => s.id === id);
if (!base) throw new Error(`senaryo yok: ${id}`);
const list = opt('--liste') ? JSON.parse(opt('--liste') as string) as Record<string, number> : enemiesAt(base, level);
const m = measure({ ...base, byLevel: { ...base.byLevel, [level]: list } }, runs, 1, level);
const pct = (a: number) => `${Math.round(a * 100)}%`;
console.log(`| ${base.name} | ${level} | ${Object.entries(list).map(([k, n]) => `${k} ×${n}`).join(', ')} | ${pct(m.partyWins / m.runs)} | ${pct(m.timeouts / m.runs)} | ${m.avgRounds.toFixed(1)} | ${m.avgDown.toFixed(2)} | ${pct(m.anyDeath)} |`);
