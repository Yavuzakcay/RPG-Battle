// KATALOG-DEX-DENGE-HAZIRLIK: katalog yaratıkları (30 Mühür Ruhu + 24 kadim/mücevher kaydı) için denge karşılaştırma tablosu.
// Çalıştırma: node scripts/katalog-denge-tablo.mjs
// Okur:  data/bosslar-muhur.json, data/canavarlar-kadim.json, data/efsanevi.json (efsanevi eylemler), data/canavar-yetenekleri.json
//        (yetenekler), data/dmg-cr-tablosu.json (DMG 2014 "Monster Statistics by Challenge Rating", s. 274).
// Yazar: harita/belgeler/KATALOG-DENGE-TABLO.md ve .csv. Canavar verisine dokunmaz (yalnız rapor).
// Yöntem (DMG 2014 Bölüm 9, yaklaşık): savunma CR'si etkin HP'den (HP + Legendary Resistance eki + Faz 2 geçici canı) ve AC farkından
// (her 2 puan 1 basamak); saldırı CR'si ilk 3 turun ortalama hasarından (1. tur en güçlü alan saldırısı 2 hedefe ya da çoklu saldırı,
// 2-3. tur çoklu saldırı; her tura efsanevi eylemler) ve saldırı bonusu farkından (yakın saldırısı yoksa kurtarma DC'si); etkin CR
// ikisinin ortalamasına en yakın basamak. CR 30 üstü tablo dışı.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const DMG = read('data/dmg-cr-tablosu.json');
const ROWS = DMG.satirlar;
const STEPS = ROWS.map((r) => r.cr);
const muhur = read('data/bosslar-muhur.json').canavarlar;
const kadimJson = read('data/canavarlar-kadim.json');
const kadim = kadimJson.canavarlar;
const LEG = read('data/efsanevi.json').monsters;
const ABIL = read('data/canavar-yetenekleri.json');

const num = (cr) => { const [a, b] = String(cr).split('/').map(Number); return b ? a / b : a; };
const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace('.', ','));
/** Zar ifadesinin ortalaması ("6d10+10", "19d10", "2d6 + 3", "12"). */
function avg(expr) {
  if (expr === undefined || expr === null) return 0;
  if (typeof expr === 'number') return expr;
  let s = 0;
  for (const term of String(expr).replace(/\s+/g, '').replace(/-/g, '+-').split('+').filter(Boolean)) {
    const m = /^(-?)(\d*)d(\d+)$/.exec(term);
    if (m) s += (m[1] ? -1 : 1) * Number(m[2] || 1) * (Number(m[3]) + 1) / 2;
    else if (!Number.isNaN(Number(term))) s += Number(term);
  }
  return s;
}
const rowOf = (cr) => ROWS.find((r) => r.cr === String(cr));
const idxByHp = (hp) => { const i = ROWS.findIndex((r) => hp <= r.hp[1]); return i < 0 ? ROWS.length - 1 : i; };
const idxByDpr = (d) => { const i = ROWS.findIndex((r) => d <= r.dpr[1]); return i < 0 ? ROWS.length - 1 : i; };
const clamp = (i) => Math.max(0, Math.min(ROWS.length - 1, i));
const nearest = (x) => STEPS.reduce((b, c) => (Math.abs(num(c) - x) < Math.abs(num(b) - x) ? c : b), STEPS[0]);
const lrHp = (cr) => (DMG.legendaryResistanceHp.find(([max]) => num(cr) <= max) ?? DMG.legendaryResistanceHp.at(-1))[1];
const band = (v, [lo, hi]) => (v < lo ? `${fmt(v - lo)} (altında)` : v > hi ? `+${fmt(v - hi)} (üstünde)` : 'bantta');
const signed = (x) => (x > 0 ? `+${fmt(x)}` : fmt(x));
const DMG_TR = { slashing: 'kesici', piercing: 'delici', bludgeoning: 'ezici', fire: 'ateş', cold: 'soğuk', acid: 'asit', poison: 'zehir', lightning: 'yıldırım',
  thunder: 'gök gürültüsü', necrotic: 'nekrotik', radiant: 'ışıl', force: 'kuvvet', psychic: 'psişik' };
const dl = (l) => (l?.length ? l.map((d) => DMG_TR[d] ?? d).join(', ') : '—');
const CIZGI_SIRA = ['ates', 'soguk', 'yildirim', 'gurultu', 'asit', 'zehir', 'isilti', 'nekrotik', 'psisik', 'kuvvet'];
const EVRE = ['Yavru', 'Genç', 'Yetişkin'];
const gemEvre = Object.fromEntries(Object.values(kadimJson.hatlar).flatMap((h) => h.kimlikler.map((id, i) => [id, `${EVRE[i]} (${h.ad.tr})`])));

function analyse(m, grup) {
  const riders = m.riders ?? {};
  const extraOf = (a) => (riders[a.name]?.extra ?? []).reduce((s, e) => s + avg(e.dice), 0);
  const hitAvg = (a) => avg(a.damageDice) + extraOf(a);
  const atks = m.attacks ?? [];
  const strikes = atks.filter((a) => !a.save && a.damageDice);
  const multi = strikes.filter((a) => (a.repeat ?? 0) > 0);
  const melee = multi.length ? multi.reduce((s, a) => s + hitAvg(a) * a.repeat, 0) : Math.max(0, ...strikes.map(hitAvg));
  const meleeParts = (multi.length ? multi : strikes.slice(0, 1)).map((a) => `${a.name}${(a.repeat ?? 1) > 1 ? `×${a.repeat}` : ''}`).join(' + ');
  // Alan/nefes: save'li alan saldırıları ve alanlı yetenekler (tek hedef ortalaması, başarısız save).
  const areas = [
    ...atks.filter((a) => a.save && a.damageDice).map((a) => ({ ad: a.name, ort: avg(a.damageDice) + extraOf(a), dc: a.save.dc, alan: !!a.area || true })),
    ...(ABIL[m.id]?.abilities ?? []).filter((a) => a.damage && a.area).map((a) => ({ ad: a.en ?? a.id, ort: avg(a.damage), dc: a.dc, alan: true })),
  ];
  const top = areas.reduce((b, a) => (a.ort > (b?.ort ?? -1) ? a : b), null);
  const leg = LEG[m.id];
  const legVal = (a) => {
    if (a.kind === 'strike') { const at = atks.find((x) => x.name === a.attack); return at ? hitAvg(at) : 0; }
    if (a.kind === 'rays') return avg(a.dice) * (a.count ?? 1);
    if (a.damage) return avg(a.damage) * (a.area ? DMG.alanHedef : 1);
    return 0;
  };
  const legPerRound = leg ? [...leg.actions.map(legVal)].sort((x, y) => y - x).slice(0, leg.uses ?? 3).reduce((s, v) => s + v, 0) : 0;
  const r1 = Math.max(melee, (top?.ort ?? 0) * DMG.alanHedef);
  const dpr3 = (r1 + melee * (DMG.turSayisi - 1)) / DMG.turSayisi + legPerRound;
  const bonus = Math.max(0, ...strikes.map((a) => a.bonus ?? 0));
  const dcs = [...areas.map((a) => a.dc), ...(leg?.actions ?? []).map((a) => a.dc).filter(Boolean)];
  const dc = dcs.length ? Math.max(...dcs) : null;
  const lr = Number(/Legendary Resistance \((\d+)\/Day/.exec(m.traits ?? '')?.[1] ?? 0);
  const f2 = m.faz2;
  const f2Hp = f2?.geciciCan ? avg(f2.geciciCan) : 0;
  const crN = num(m.cr);
  const out = crN > 30;
  const row = out ? null : rowOf(m.cr);
  const effHp = m.hp + (out ? 0 : lr * lrHp(m.cr)) + f2Hp;
  const step = DMG.duzeltmeAdimi;
  let def = null, off = null, eff = null, defOver = false, offOver = false;
  if (!out) {
    const hi = idxByHp(effHp); defOver = effHp > ROWS.at(-1).hp[1];
    def = STEPS[clamp(hi + Math.trunc((m.ac - ROWS[hi].ac) / step))];
    const di = idxByDpr(dpr3); offOver = dpr3 > ROWS.at(-1).dpr[1];
    const useDc = !strikes.length && dc !== null;
    off = STEPS[clamp(di + Math.trunc(((useDc ? dc : bonus) - (useDc ? ROWS[di].dc : ROWS[di].atk)) / step))];
    eff = nearest((num(def) + num(off)) / 2);
  }
  const f2Text = f2 ? [
    f2.esik !== undefined ? `eşik %${Math.round(f2.esik * 100)}` : 'eşik %50',
    f2.geciciCan ? `+${f2.geciciCan} geçici can` : '', f2.ac ? `AC ${signed(f2.ac)}` : '', f2.saldiri ? `saldırı +${f2.saldiri}` : '',
    f2.hasar ? `isabet +${f2.hasar}` : '', f2.zayiflikKaldir?.length ? `zayıflık kalkar (${dl(f2.zayiflikKaldir)})` : '',
    f2.direncEkle?.length ? `direnç + ${dl(f2.direncEkle)}` : '', f2.bagisiklikEkle?.length ? `bağışıklık + ${dl(f2.bagisiklikEkle)}` : '',
    f2.nefesDoldur ? 'nefes dolar' : '', f2.nefesAlan ? `nefes alanı ×${String(f2.nefesAlan).replace('.', ',')}` : '', f2.efsaneviEk ? `efsanevi +${f2.efsaneviEk}` : '',
  ].filter(Boolean).join('; ') : '—';
  return {
    id: m.id, grup, kademe: grup === 'Mühür Ruhu' ? `Sv.${m.kademe} (${m.cizgi})` : gemEvre[m.id] ?? '—', cr: String(m.cr), boyut: m.size,
    hiz: [`${m.speed}`, m.fly ? `uçuş ${m.fly}` : '', m.swim ? `yüzme ${m.swim}` : ''].filter(Boolean).join(' / '),
    ac: m.ac, hp: m.hp, bag: dl(m.immunities), dir: dl(m.resistances), zay: dl(m.vulnerabilities),
    dmgAc: row ? row.ac : 'tablo dışı', dmgHp: row ? `${row.hp[0]}–${row.hp[1]}` : 'tablo dışı', dmgAtk: row ? `+${row.atk}` : 'tablo dışı',
    dmgDpr: row ? `${row.dpr[0]}–${row.dpr[1]}` : 'tablo dışı', dmgDc: row ? row.dc : 'tablo dışı',
    farkHp: row ? band(m.hp, row.hp) : '—', farkAc: row ? signed(m.ac - row.ac) : '—', farkAtk: row && strikes.length ? signed(bonus - row.atk) : '—',
    farkDpr: row ? band(Math.round(dpr3), row.dpr) : '—', farkDc: row && dc !== null ? signed(dc - row.dc) : '—',
    yakin: Math.round(melee), yakinParca: meleeParts || '—', bonus: strikes.length ? `+${bonus}` : '—',
    alan: top ? `${top.ad}: ${Math.round(top.ort)} (DC ${top.dc})` : '—', alanOrt: top ? Math.round(top.ort) : 0, alanDc: top?.dc ?? '',
    efsanevi: leg ? `${leg.actions.length} eylem, ${leg.uses ?? 3} hak/tur (≈${Math.round(legPerRound)} hasar/tur)` : '—',
    efsSayi: leg ? leg.actions.length : 0, efsPuan: leg ? leg.uses ?? 3 : 0, efsHasar: Math.round(legPerRound),
    lr: lr || '—', faz2: f2Text, etkinHp: Math.round(effHp), dpr3: Math.round(dpr3),
    savCr: out ? 'tablo dışı' : `${def}${defOver ? '+' : ''}`, salCr: out ? 'tablo dışı' : `${off}${offOver ? '+' : ''}`,
    etkinCr: out ? 'tablo dışı' : `${eff}${defOver || offOver ? ' (tavan)' : ''}`, delta: out ? null : num(eff) - crN, out,
  };
}

const rows = [
  ...[...muhur].sort((a, b) => CIZGI_SIRA.indexOf(a.cizgi) - CIZGI_SIRA.indexOf(b.cizgi) || a.kademe - b.kademe).map((m) => analyse(m, 'Mühür Ruhu')),
  ...kadim.map((m) => analyse(m, gemEvre[m.id] ? 'Mücevher ejderhası' : 'Kadim')),
];

// CSV
const COLS = [['id', 'id'], ['grup', 'grup'], ['kademe', 'kademe/evre'], ['cr', 'CR'], ['boyut', 'boyut'], ['hiz', 'hız (ft)'], ['ac', 'AC'], ['hp', 'HP'],
  ['bag', 'bağışıklık'], ['dir', 'direnç'], ['zay', 'zayıflık'], ['dmgAc', 'DMG AC'], ['dmgHp', 'DMG HP'], ['dmgAtk', 'DMG saldırı'], ['dmgDpr', 'DMG tur hasarı'],
  ['dmgDc', 'DMG DC'], ['farkHp', 'HP farkı'], ['farkAc', 'AC farkı'], ['farkAtk', 'saldırı farkı'], ['farkDpr', '3 tur hasar farkı'], ['farkDc', 'DC farkı'],
  ['yakin', 'çoklu saldırı ort.'], ['yakinParca', 'çoklu saldırı'], ['bonus', 'saldırı bonusu'], ['alanOrt', 'en güçlü alan ort.'], ['alanDc', 'alan DC'],
  ['alan', 'en güçlü alan'], ['efsSayi', 'efsanevi eylem'], ['efsPuan', 'efsanevi hak'], ['efsHasar', 'efsanevi hasar/tur'], ['lr', 'Legendary Resistance'],
  ['faz2', 'Faz 2'], ['etkinHp', 'etkin HP'], ['dpr3', '3 tur ort. hasar'], ['savCr', 'savunma CR'], ['salCr', 'saldırı CR'], ['etkinCr', 'etkin CR']];
const esc = (v) => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = [COLS.map(([, h]) => esc(h)).join(','), ...rows.map((r) => COLS.map(([k]) => esc(r[k])).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-DENGE-TABLO.csv'), csv);

// Markdown
const table = (cols, list) => [`| ${cols.map(([, h]) => h).join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`,
  ...list.map((r) => `| ${cols.map(([k]) => String(r[k] ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const A = [['id', 'id'], ['kademe', 'kademe/evre'], ['cr', 'CR'], ['boyut', 'boyut'], ['hiz', 'hız (ft)'], ['ac', 'AC'], ['hp', 'HP'], ['bag', 'bağışıklık'],
  ['dir', 'direnç'], ['zay', 'zayıflık'], ['dmgAc', 'DMG AC'], ['dmgHp', 'DMG HP'], ['farkAc', 'AC farkı'], ['farkHp', 'HP farkı'], ['lr', 'LR'], ['etkinHp', 'etkin HP']];
const B = [['id', 'id'], ['cr', 'CR'], ['yakinParca', 'çoklu saldırı'], ['yakin', 'ort.'], ['bonus', 'bonus'], ['dmgAtk', 'DMG bonus'], ['alan', 'en güçlü alan (ort., DC)'],
  ['dmgDc', 'DMG DC'], ['farkDc', 'DC farkı'], ['efsanevi', 'efsanevi'], ['dpr3', '3 tur ort.'], ['dmgDpr', 'DMG tur hasarı'], ['farkDpr', 'fark'],
  ['faz2', 'Faz 2'], ['savCr', 'savunma CR'], ['salCr', 'saldırı CR'], ['etkinCr', 'etkin CR']];
const inT = rows.filter((r) => !r.out);
const sapma = inT.filter((r) => r.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.id.localeCompare(b.id));
const rank = (list, key) => { const vals = [...new Set(list.map(key))].sort((x, y) => x - y); return (r) => vals.indexOf(key(r)) + 1; };
const rCr = rank(inT, (r) => num(r.cr)); const rEff = rank(inT, (r) => num(r.etkinCr.split(' ')[0]));
const md = `# KATALOG-DENGE-TABLO: katalog yaratıkları ve DMG CR tablosu

Üretici: \`node scripts/katalog-denge-tablo.mjs\` (elle düzenlenmez). CSV: \`harita/belgeler/KATALOG-DENGE-TABLO.csv\`. Canavar verisi değiştirilmedi.

- **Kapsam:** ${rows.length} kayıt: ${muhur.length} Mühür Ruhu (\`data/bosslar-muhur.json\`) + ${kadim.length} kadim ve mücevher kaydı (\`data/canavarlar-kadim.json\`; Dungeondex'te gizli varyantlar dahil).
- **DMG tablosu:** D&D 5e *Dungeon Master's Guide* (2014), Bölüm 9 "Creating a Monster", **"Monster Statistics by Challenge Rating"** (s. 274); Legendary Resistance etkin HP eki "Monster Features" tablosundan (s. 280–281). Değerler \`data/dmg-cr-tablosu.json\`'da. SRD 5.2.1'de bu tablo yok. Oyunun özel canavar tahmini (\`data/cr-tahmini.json\`) basitleştirilmiş ve CR 20 üstünde farklı olduğu için kullanılmadı.
- **Tablo dışı:** DMG tablosu CR 30'da biter. CR 30'un üstündekiler (${rows.filter((r) => r.out).map((r) => `${r.id} CR ${r.cr}`).join(', ')}) için DMG sütunları ve etkin CR "tablo dışı"; yalnız gerçek değerler var. Captive Dragon (\`tutsak-dragon\`) ve Ocean-Nightmare'in iki kaydı veride **CR 30** olduğundan tabloyla karşılaştırıldı.
- **Yöntem (yaklaşık):**
  - **Etkin HP:** HP + Legendary Resistance (kullanım başına CR 1–4: 10, 5–10: 20, 11–16: 30, 17+: 45) + Faz 2 geçici canı. Tek element bağışıklığı ve zayıflık etkin HP'ye katılmadı.
  - **Savunma CR'si:** etkin HP'nin satırı, AC farkının her 2 puanı 1 basamak.
  - **Tur hasarı (3 tur ortalaması):** 1. tur en güçlü alan/nefes saldırısı 2 hedefe (başarısız save, tam hasar) ya da çoklu saldırı, hangisi büyükse; 2–3. tur çoklu saldırı. Saldırı ekleri (\`riders.extra\`) dahil. Her tura efsanevi eylemler eklenir (SRD 5.2.1: her eylem 1 hak; hak kadar eylem, her eylem bir kez, en güçlüler; alanlı efsanevi eylem 2 hedef). Puan bedeli yok (KATALOG-LA-SRD).
  - **Saldırı CR'si:** tur hasarının satırı, saldırı bonusu farkının her 2 puanı 1 basamak (yakın saldırısı olmayan kayıtta kurtarma DC'si).
  - **Etkin CR:** savunma ve saldırı CR'sinin ortalamasına en yakın basamak. "+" ve "(tavan)": değer CR 30 satırını aştı.
- **Fark sütunları:** HP ve tur hasarı için "bantta" ya da bandın kaç puan altında/üstünde olduğu; AC, saldırı bonusu ve DC için kayıt − DMG.

## A. Kimlik ve savunma

${table(A, rows)}

## B. Saldırı ve etkin CR

${table(B, rows)}

## Yazılı CR ile etkin CR'si farklı olanlar

Tablo içindeki ${inT.length} kayıttan ${sapma.length} tanesinde etkin CR yazılı CR'den farklı (fark büyükten küçüğe). "Sıra": yazılı CR sırası → etkin CR sırası (aynı değerler aynı sırada).

| id | yazılı CR | etkin CR | fark | savunma CR | saldırı CR | sıra |
|---|---|---|---|---|---|---|
${sapma.map((r) => `| ${r.id} | ${r.cr} | ${r.etkinCr} | ${signed(r.delta)} | ${r.savCr} | ${r.salCr} | ${rCr(r)} → ${rEff(r)} |`).join('\n')}
`;
fs.writeFileSync(path.join(ROOT, 'harita/belgeler/KATALOG-DENGE-TABLO.md'), md);
console.log(`KATALOG-DENGE-TABLO: ${rows.length} satır (${inT.length} tablo içinde, ${rows.length - inT.length} tablo dışı); etkin CR farklı: ${sapma.length}.`);
console.log(sapma.slice(0, 12).map((r) => `${r.id} CR ${r.cr} → ${r.etkinCr} (${signed(r.delta)}; sav ${r.savCr}, sal ${r.salCr})`).join('\n'));
