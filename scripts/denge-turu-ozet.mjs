/**
 * Denge turu sonuç özeti: sim-sonuc/denge-turu (dizin seçilebilir) .txt → Markdown tablolar (stdout).
 *   node scripts/denge-turu-ozet.mjs <sim|a2|boss|bolge|zincir|diger> [--dizin sim-sonuc/denge-turu] [--seviye 5]
 * Bantlar: sim (parti kazanma) %60–80; a2 Normal %45–65, Kolay %70–85; boss Normal %45–65, Kolay %70–85; bölge %60–80.
 * Aralık dışı hücre **kalın** + ↑ (kolay) / ↓ (zor).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const what = argv[0] ?? 'sim';
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const D = opt('--dizin', 'sim-sonuc/denge-turu');
const onlyLevel = opt('--seviye');
const files = existsSync(D) ? readdirSync(D).filter((f) => f.endsWith('.txt')) : [];
const txt = (f) => readFileSync(`${D}/${f}`, 'utf8');
const mark = (p, lo, hi) => (p < lo ? `**${p}** ↓` : p > hi ? `**${p}** ↑` : `${p}`);
const SC = [['col', 'Çöl'], ['kale', 'Kale'], ['magara', 'Mağara'], ['orman', 'Orman']];
const PARTY_ORDER = ['standart', 'barbar', 'yanel', 'paladin', 'monk', 'fighter', 'rogue', 'ranger', 'buyucu'];
if (what === 'sim') {
  const rows = {};
  for (const f of files.filter((x) => x.startsWith('sim-L'))) {
    const m = /^sim-L(\d+)-(.+)-(col|kale|magara|orman)\.txt$/.exec(f); if (!m) continue;
    const row = txt(f).split('\n').find((l) => l.startsWith('| ')); if (!row) continue;
    const c = row.split('|').map((x) => x.trim());
    (rows[m[1]] ??= {})[m[2]] ??= {}; rows[m[1]][m[2]][m[3]] = { win: Number(c[4].replace('%', '')), tie: Number(c[5].replace('%', '')), turns: c[6], dead: c[7] };
  }
  for (const L of Object.keys(rows).sort((a, b) => a - b).filter((l) => !onlyLevel || l === onlyLevel)) {
    console.log(`\n#### Seviye ${L}\n\n| Parti | Çöl | Kale | Mağara | Orman | Ort. | Durum |\n|---|---:|---:|---:|---:|---:|---|`);
    for (const P of PARTY_ORDER.filter((p) => rows[L][p])) {
      const r = rows[L][P]; const cells = SC.map(([k]) => r[k]); const have = cells.filter(Boolean);
      const avg = have.length ? Math.round(have.reduce((n, x) => n + x.win, 0) / have.length) : '–';
      const out = cells.map((x) => (x ? `${mark(x.win, 60, 80)}${x.tie ? ` (b${x.tie})` : ''}` : '–'));
      const bad = cells.map((x, i) => (x && (x.win < 60 || x.win > 80) ? `${SC[i][1]} ${x.win < 60 ? 'zor' : 'kolay'}` : null)).filter(Boolean);
      console.log(`| ${P} | ${out.join(' | ')} | ${avg} | ${bad.length ? 'aralık dışı: ' + bad.join(', ') : 'aralıkta'} |`);
    }
  }
} else if (what === 'a2') {
  const cell = {};
  for (const f of files.filter((x) => /^a2(kale)?-/.test(x))) {
    const t = txt(f); const m = /^a2(?:kale)?-(a2-[a-z]+)-L(\d)-(normal|kolay)\.txt$/.exec(f); if (!m) continue;
    const head = t.split('\n').find((l) => l.startsWith('| Parti')); const row = t.split('\n').find((l) => l.startsWith('| a2-'));
    if (!row) continue;
    const cols = head.split('|').map((x) => x.trim()); const c = row.split('|').map((x) => x.trim());
    for (let i = 4; i < cols.length - 2; i++) { const v = c[i]; const mm = /^(\d+)%(?: \(z(\d+)\))?/.exec(v); if (mm) (cell[`${m[1]}|${m[2]}|${m[3]}`] ??= {})[cols[i]] = { win: Number(mm[1]), z: Number(mm[2] ?? 0) }; }
  }
  const scs = ['col', 'kale', 'magara', 'orman']; const names = { col: 'Çöl', kale: 'Kale', magara: 'Mağara', orman: 'Orman' };
  console.log('| Parti | Sv | Zorluk | Çöl | Kale | Mağara | Orman | Ort. (ölçülenler) |\n|---|---:|---|---:|---:|---:|---:|---:|');
  const means = {};
  for (const L of ['7', '9']) for (const Z of ['normal', 'kolay']) for (const P of ['a2-klasik', 'a2-karma', 'a2-ates']) {
    const r = cell[`${P}|${L}|${Z}`]; if (!r) continue; const [lo, hi] = Z === 'normal' ? [45, 65] : [70, 85];
    const vals = scs.map((s) => r[s]); const have = vals.filter(Boolean); const avg = Math.round(have.reduce((n, x) => n + x.win, 0) / have.length);
    (means[`${L}|${Z}`] ??= []).push(avg);
    console.log(`| ${P.replace('a2-', '')} | ${L} | ${Z === 'normal' ? 'Normal' : 'Kolay'} | ${vals.map((x) => (x ? `${mark(x.win, lo, hi)}${x.z ? ` (z${x.z})` : ''}` : '–')).join(' | ')} | ${mark(avg, lo, hi)} |`);
  }
  console.log('\nÜç parti ortalaması:');
  for (const k of Object.keys(means)) { const [L, Z] = k.split('|'); const [lo, hi] = Z === 'normal' ? [45, 65] : [70, 85]; const m = Math.round(means[k].reduce((n, x) => n + x, 0) / means[k].length); console.log(`- ${Z === 'normal' ? 'Normal' : 'Kolay'} ${L}: ${mark(m, lo, hi)} (${means[k].join(', ')})`); }
} else if (what === 'boss') {
  console.log('| Boss | Seviye | Zorluk | Kazanma | Durum |\n|---|---:|---|---:|---|');
  for (const f of files.filter((x) => x.startsWith('boss-'))) {
    const row = txt(f).split('\n').find((l) => l.startsWith('| ')); if (!row) continue; const c = row.split('|').map((x) => x.trim());
    const p = Number(/(\d+)%/.exec(c[4])[1]); const [lo, hi] = c[3] === 'Normal' ? [45, 65] : [70, 85];
    console.log(`| ${c[1]} | ${c[2]} | ${c[3]} | ${c[4]} | ${p < lo ? '**aralık dışı (zor)**' : p > hi ? '**aralık dışı (kolay)**' : 'aralıkta'} |`);
  }
} else if (what === 'bolge') {
  const all = {};
  for (const f of files.filter((x) => x.startsWith('bolge-'))) for (const l of txt(f).split('\n')) {
    const c = l.split('|').map((x) => x.trim()); if (c.length < 10 || c[1] === 'Bölge' || c[1].startsWith('---')) continue;
    (all[c[1]] ??= {})[c[2]] = { win: Number(c[3].replace('%', '')), tie: c[4], turns: c[5], death: c[6] };
  }
  const lv = ['1', '5', '9'];
  console.log(`| Bölge | ${lv.map((l) => `Sv ${l}`).join(' | ')} | Durum |\n|---|${lv.map(() => '---:').join('|')}|---|`);
  for (const r of Object.keys(all)) {
    const cells = lv.map((l) => all[r][l]); const bad = cells.map((x, i) => (x && (x.win < 60 || x.win > 80) ? `${lv[i]}: ${x.win < 60 ? 'zor' : 'kolay'}` : null)).filter(Boolean);
    console.log(`| ${r} | ${cells.map((x) => (x ? mark(x.win, 60, 80) : '–')).join(' | ')} | ${bad.length ? 'aralık dışı ' + bad.join(', ') : 'aralıkta'} |`);
  }
} else {
  for (const f of files.filter((x) => !/^(sim-L|a2|boss-|bolge-|k59)/.test(x) && !x.startsWith('_'))) { console.log(`\n### ${f.replace('.txt', '')}\n`); console.log(txt(f).replace('#BITTI', '').trim()); }
}
