/**
 * Kuyruk 36: Hapishane Adası denge ölçümü (Serüven katmanı uçtan uca; yapay zekâ iki tarafı da oynar).
 *   npm run sim:hapishane -- 100 [--seviye 3] [--kolay] [--parti standart]
 * Zincir: hapse atılma → hücre bloğu (kısa ceza kuralıyla) → dış halka → iskele (müdür kulesi isteğe bağlı, ayrıca
 * ölçülür). Düğüm başına geçiş oranı ve bütün zincirin bitirme oranı; sonuç `harita/belgeler/DENGE.md`'ye elle yazılır.
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { executeSeruven } = await import('../journey/seruven');
const { HAPIS } = await import('../journey/hapishane');
const { hapisResultCommands, hapisSession } = await import('../app/seruvenBattle');
const { partyAt, playBattle, setPartyKind } = await import('./balance');
const { seededRng: seeded } = await import('../rules/dice');
const { execute } = await import('../battle');
type S = import('../journey/seruven').SeruvenState;

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] as string : d; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 100);
const level = Number(opt('--seviye', '3'));
const kolay = args.includes('--kolay');
setPartyKind(opt('--parti', 'standart'));

function jailed(seed: number): S {
  const party = partyAt(level).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
  let r = executeSeruven(null, { type: 'start', id: 'sim', seed, party, toggles: { irkBaslangic: false, hapishaneKolay: kolay } });
  if (!r.ok) throw new Error(r.error);
  r = executeSeruven(r.state, { type: 'hapse_at' });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
/** Düğümü oynar; kazanınca mahkûm kapıya taşınmış sayılır (yapay zekâ hedefe yürümez: kapı geçişi oyuncunun işi). */
function play(s: S, node: string, seed: number, next: string | null): { s: S; won: boolean } {
  const rng = seeded(seed);
  const ss = hapisSession(s, node, rng);
  if (!ss) throw new Error(`oturum yok: ${node}`);
  const r = execute(ss.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
  if (!r.ok) throw new Error(r.error);
  let fin = playBattle(r.state, rng, 20);
  const won = fin.status === 'finished' && fin.winner === 'party';
  if (won) {
    const n = pageNode(node);
    const k = n?.kapilar?.find((x) => x.to === next);
    const m = fin.combatants[HAPIS.mahkum.id];
    if (k && m) fin = { ...fin, combatants: { ...fin.combatants, [m.id]: { ...m, hp: Math.max(1, m.hp), pos: { col: k.hexes[0]![0] - 1, row: k.hexes[0]![1] - 1 } } } };
  }
  let cur = s;
  for (const c of hapisResultCommands(s, node, fin)) {
    const x = executeSeruven(cur, c);
    if (!x.ok) throw new Error(`${node} ${c.type} ${JSON.stringify(c).slice(0, 200)} at=${cur.at} done=${cur.done.join(',')}: ${x.error}`);
    cur = x.state;
  }
  return { s: cur, won };
}
const { pageById } = await import('../journey/seruven');
const pageNode = (id: string) => pageById(HAPIS.sayfa)?.nodes.find((n) => n.id === id);

type P = [number, number];
const stats: { hucre: P; halka: P; iskele: P; mudur: P; chain: number; ceza: number; alarm: number } = { hucre: [0, 0], halka: [0, 0], iskele: [0, 0], mudur: [0, 0], chain: 0, ceza: 0, alarm: 0 };
for (let i = 1; i <= runs; i++) {
  let s = jailed(i);
  // Perde 1: hücre bloğu (kısa ceza kuralıyla en çok 1 + cezaSiniri deneme).
  let ok = false;
  for (let t = 0; t <= HAPIS.cezaSiniri && s.hapis; t++) {
    const r = play(s, HAPIS.baslangic, i * 101 + t, 'dis-halka');
    stats.hucre[1]++; if (r.won) stats.hucre[0]++;
    s = r.s;
    if (r.won) { ok = true; break; }
    stats.ceza++;
  }
  if (!ok || !s.hapis) continue;
  const a = play(s, 'dis-halka', i * 101 + 7, 'iskele');
  stats.halka[1]++; if (a.won) stats.halka[0]++;
  s = a.s;
  if (!a.won || !s.hapis) continue;
  // Müdür kulesi ayrı ölçüm (zincirden bağımsız).
  const m = play({ ...s, at: 'mudur-kulesi' }, 'mudur-kulesi', i * 101 + 9, 'dis-halka');
  stats.mudur[1]++; if (m.won) stats.mudur[0]++;
  stats.alarm += s.hapis.alarm;
  const b = play(s, 'iskele', i * 101 + 11, null);
  stats.iskele[1]++; if (b.won) stats.iskele[0]++;
  s = b.s;
  if (!b.won) continue;
  // Kayıkla kaçış (iskele geçildi; mahkûm kayıkta).
  if (!s.hapis && s.flags.includes(HAPIS.donus.flag)) stats.chain++;
}
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}% (${a}/${b})` : '—');
console.log(`Hapishane Adası, seviye ${level}, ${kolay ? 'Kolay' : 'Normal'}, ${runs} tohum`);
console.log(`| Hücre bloğu (deneme başına) | Dış halka | Müdür kulesi (isteğe bağlı) | İskele | Zincir (kaçış) | Kısa ceza / tohum | Ort. alarm |`);
console.log(`|---|---|---|---|---|---|---|`);
console.log(`| ${pct(stats.hucre[0]!, stats.hucre[1]!)} | ${pct(stats.halka[0]!, stats.halka[1]!)} | ${pct(stats.mudur[0]!, stats.mudur[1]!)} | ${pct(stats.iskele[0]!, stats.iskele[1]!)} | ${pct(stats.chain, runs)} | ${(stats.ceza / runs).toFixed(2)} | ${(stats.alarm / Math.max(1, stats.halka[0]!)).toFixed(2)} |`);
