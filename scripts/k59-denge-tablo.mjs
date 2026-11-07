// K59: denge ızgarası (src/sim/k59Denge.ts JSON satırları) → DENGE.md tablosu. node scripts/k59-denge-tablo.mjs <klasör>
import fs from 'node:fs';
const dir = process.argv[2];
const rows = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl'))) for (const l of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n').filter(Boolean)) rows.push(JSON.parse(l));
const sub = JSON.parse(fs.readFileSync('data/subclasses.json', 'utf8'));
const subs = (sub.subclasses ?? sub);
const imza = JSON.parse(fs.readFileSync('data/imza.json', 'utf8')).altSiniflar;
const name = (id) => (subs.find((s) => s.id === id)?.name?.tr) ?? imza.find((s) => s.id === id)?.name?.tr ?? (id === 'karadul-cemberi' ? 'Karadul Çemberi' : id);
const key = (r) => `${r.level}|${r.cls}|${r.sub}`;
const agg = new Map();
for (const r of rows) { const k = key(r); const a = agg.get(k) ?? { ...r, w: 0, n: 0, sc: {} }; a.w += r.wins; a.n += r.runs; a.sc[r.scenario] = Math.round(100 * r.wins / r.runs); agg.set(k, a); }
const out = ['| Sınıf | Alt sınıf | SRD karşılığı | Sv | Senaryolar (Çöl/Orman/Mağara) | Kazanma | SRD | Fark | Durum |', '|---|---|---|---:|---|---:|---:|---:|---|'];
const levels = [...new Set(rows.map((r) => r.level))].sort((a, b) => a - b);
const classes = [...new Set(rows.map((r) => r.cls))].sort();
const outside = [];
for (const cls of classes) for (const lv of levels) {
  const all = [...agg.values()].filter((a) => a.cls === cls && a.level === lv);
  const srd = all.find((a) => !a.house && !/^imza_|karadul/.test(a.sub));
  for (const a of all) {
    const p = 100 * a.w / a.n;
    const isSrd = a === srd;
    const ps = srd ? 100 * srd.w / srd.n : null;
    const full = Object.keys(a.sc).length === 3;
    const diff = !isSrd && ps !== null ? p - ps : null;
    const st = isSrd ? 'SRD (taban)' : diff === null ? 'eksik' : !full || !(srd && Object.keys(srd.sc).length === 3) ? 'eksik senaryo' : Math.abs(diff) <= 5 ? 'aralıkta' : diff > 5 ? 'güçlü (aralık dışı)' : 'zayıf (aralık dışı)';
    if (st.includes('aralık dışı')) outside.push({ cls, lv, sub: name(a.sub), diff });
    out.push(`| ${cls} | ${name(a.sub)} | ${isSrd ? '—' : srd ? name(srd.sub) : '?'} | ${lv} | ${['col', 'orman', 'magara'].map((s) => a.sc[s] ?? '–').join(' / ')} | ${p.toFixed(0)}% | ${ps === null ? '–' : `${ps.toFixed(0)}%`} | ${diff === null ? '—' : (diff > 0 ? '+' : '') + diff.toFixed(0)} | ${st} |`);
  }
}
console.log(out.join('\n'));
console.log(`\nAralık dışı: ${outside.length}`);
for (const o of outside) console.log(`- ${o.sub} (${o.cls}) sv${o.lv}: ${o.diff > 0 ? '+' : ''}${o.diff.toFixed(0)}`);
