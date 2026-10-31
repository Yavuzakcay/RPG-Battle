/**
 * Denge raporu (tek süreç): `npm run sim:tek -- [savaş sayısı] [senaryo kimliği...] [--seviye N] [--parti kimlik]`.
 * Her senaryo aynı tohumlarla (1..N) oynanır; sonuç tekrarlanabilir. `npm run sim` aynı argümanlarla senaryoları
 * paralel çalıştırır (scripts/sim-paralel.mjs).
 */
import { DEFAULT_LEVEL, PARTY_KINDS, SCENARIOS, hasLevelList, measure, scenarioXp, setAlarmMode, setPartyKind, setSurfaceReactions } from './balance';
import { loadClassData, loadMonsters } from '../data';
import { ALARM } from '../battle/alarm';
import { setDefaultRuleVersion } from '../battle/create';

// Canavar verisi tembel yüklenir.
await Promise.all([loadMonsters(), loadClassData()]);

declare const process: { argv: string[]; env: Record<string, string | undefined> };

const argv = process.argv.slice(2);
// `--seviye N` (parti seviyesi, varsayılan 5) herhangi bir yerde; kalanlar: savaş sayısı ve senaryo kimlikleri.
const at = argv.indexOf('--seviye');
const level = at >= 0 ? Number(argv[at + 1]) : DEFAULT_LEVEL;
if (!Number.isInteger(level) || level < 1 || level > 20) throw new Error(`--seviye 1–20 olmalı: ${argv[at + 1]}`);
let args = at >= 0 ? [...argv.slice(0, at), ...argv.slice(at + 2)] : argv;
// `--parti <kimlik>`: data/sim-partiler.json `parties` (standart, barbar, yanel…); varsayılan standart parti.
const pAt = args.indexOf('--parti');
const kind = pAt >= 0 ? args[pAt + 1] ?? '' : 'standart';
if (pAt >= 0) {
  if (!PARTY_KINDS[kind]) throw new Error(`--parti ${Object.keys(PARTY_KINDS).join('|')} olmalı: ${kind}`);
  setPartyKind(kind);
  args = [...args.slice(0, pAt), ...args.slice(pAt + 2)];
}
// Görev Y1: `--yuzey-kapali`: yüzey etkileşimi kapalı (regresyon karşılaştırması).
if (args.includes('--yuzey-kapali')) { setSurfaceReactions(false); args = args.filter((a) => a !== '--yuzey-kapali'); }
// Kuyruk 15 K15A: denge matrisi için `--alarm-tur N` (alarm sayacı) ve `--yz-gizlen acik|kapali` (veri nesnesi üzerinde).
{ const i = args.indexOf('--alarm-tur'); if (i >= 0) { ALARM.failRounds = Number(args[i + 1]); args = args.filter((_, j) => j !== i && j !== i + 1); } }
{ const i = args.indexOf('--yz-gizlen'); if (i >= 0) { ALARM.aiHide = args[i + 1] !== 'kapali'; args = args.filter((_, j) => j !== i && j !== i + 1); } }
// Görev S4: `--alarm hemen|yok`: alarmın iki ucu (uyuyan grupların hepsi baştan alarmda / hiç alarm yok).
{ const i = args.indexOf('--alarm'); if (i >= 0) { setAlarmMode(args[i + 1] === 'hemen' ? 'hemen' : 'yok'); args = args.filter((_, j) => j !== i && j !== i + 1); } }
// Kuyruk 16 K16E: `--kural-surumu N` ya da ortam değişkeni KURAL_SURUMU (paralel süreçlere geçer): yeni savaşların kural
// sürümü (1: eski kurallar, regresyon; varsayılan güncel sürüm).
{
  const i = args.indexOf('--kural-surumu');
  const v = i >= 0 ? args[i + 1] : process.env.KURAL_SURUMU;
  if (v) setDefaultRuleVersion(Number(v));
  if (i >= 0) args = args.filter((_, j) => j !== i && j !== i + 1);
}
// `--satir`: yalnızca tablo satırları (paralel düzenleyici, scripts/sim-paralel.mjs).
const rowsOnly = args.includes('--satir');
args = args.filter((a) => a !== '--satir');
if (!rowsOnly) console.log(`> Parti: ${PARTY_KINDS[kind]}\n`);
const runs = Number(args[0] ?? 200) || 200;
const only = args.slice(1);
if (!rowsOnly && level !== DEFAULT_LEVEL) console.log(`> Parti seviyesi ${level} (data/sim-partiler.json; düşman listesi senaryonun ${level}. seviye listesi, yoksa 5. seviye listesi ve satırda "5. sev. listesi").\n`);
const pct = (x: number) => `${Math.round(x * 100)}%`;

if (!rowsOnly) console.log(`| Senaryo | XP | Savaş | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum | Ejderha uyandı | Uyanınca kazanma | Süre |`);
if (!rowsOnly) console.log(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
for (const s of SCENARIOS.filter((x) => only.length === 0 || only.includes(x.id))) {
  const t0 = Date.now();
  const m = measure(s, runs, 1, level);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`| ${s.name}${hasLevelList(s, level) ? '' : ' (5. sev. listesi)'} | ${scenarioXp(s, level)} | ${m.runs} | ${pct(m.partyWins / m.runs)} | ${pct(m.timeouts / m.runs)} | ${m.avgRounds.toFixed(1)} | ${m.avgDead.toFixed(2)} | ${pct(m.anyDeath)} | ${m.avgDown.toFixed(2)} | ${m.avgSaved === null ? '–' : `${m.avgSaved.toFixed(2)}/${s.map?.civilians ?? 0}`} | ${m.dragonWokeRate === null ? '–' : pct(m.dragonWokeRate)} | ${m.winWhenWoke === null ? '–' : pct(m.winWhenWoke)} | ${secs} sn |`);
}
