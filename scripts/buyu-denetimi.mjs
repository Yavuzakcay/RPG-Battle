/**
 * Kuyruk K58 G7: SRD 5.2.1'in 339 büyüsünün (0–9) durum denetimi → harita/belgeler/BUYU-DURUM.md. Ölçüt BUYU-KISMI ile
 * aynı (`scripts/lib/buyu-durum.mjs`). Eski çıktılar (docs/BUYU-DENETIMI.md, BUYU-DENETIMI-4-5.md) bu belgeye
 * yönlendirir. Yardımcı (utility) büyülerin koddaki karşılığı kaynakta aranır. Çalıştırma: node scripts/buyu-denetimi.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { durumRows } from './lib/buyu-durum.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const srd = read('data/srd/spells.json').spells;
const game = ['data/spells.json', 'data/spells-45.json', 'data/spells-69.json'].flatMap((f) => read(f).map((s) => ({ ...s, file: f.replace('data/', '') })));
const notes = read('data/buyu-durum-notlari.json').notlar;
const rows = durumRows(srd, game);

// Yardımcı büyülerin kodda işlendiği yer: mekanik anahtarı kaynakta aranır.
const UTIL = { 'power-word-kill': 'powerWord', 'time-stop': 'timeStop', 'mass-heal': 'massHeal', 'prismatic-spray': 'prismatic', 'reverse-gravity': 'reverseGravity',
  'divine-word': 'hpTiers', 'control-water': 'terraform', 'stone-shape': 'terraform', 'modify-memory': 'upgrade', passwall: 'terraform' };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') ? [path.join(d, e.name)] : []));
const sources = walk(path.join(root, 'src/battle')).map((f) => ({ f: path.relative(root, f).replace(/\\/g, '/'), t: fs.readFileSync(f, 'utf8') }));
const utilRows = Object.entries(UTIL).map(([id, key]) => {
  const g = game.find((s) => s.id === id);
  const files = sources.filter((s) => new RegExp(`\\b${key}\\b`).test(s.t)).map((s) => s.f);
  const r = rows.find((x) => x.id === id);
  return { id, key, level: g?.level ?? '?', kind: g?.mechanics?.kind ?? '', durum: r?.durum ?? '?', files, upgrade: !!g?.mechanics?.upgrade };
});

const groups = [['0–3', (l) => l <= 3], ['4–5', (l) => l >= 4 && l <= 5], ['6–9', (l) => l >= 6]];
const STATES = ['çalışır', 'kısmi', 'yok', 'savaş dışı'];
const count = (pred) => rows.filter(pred).length;
const cell = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const combat = count((r) => r.durum !== 'savaş dışı');
const off = count((r) => r.durum === 'savaş dışı');
const gmRows = rows.filter((r) => r.gm !== undefined);
const kdRows = rows.filter((r) => r.kapsam);
const verdict = (id) => notes[id] ? `${notes[id].uyar === 'evet' ? 'evet' : notes[id].uyar === 'kismen' ? 'kısmen' : 'hayır'}: ${notes[id].neden}` : '(karar yazılmamış)';

const lines = [
  '# Büyü durumu (Kuyruk K58 G7)',
  '',
  '`node scripts/buyu-denetimi.mjs` üretir; elle düzenlenmez. SRD 5.2.1\'in 339 büyüsü (0–9). Ölçüt harita/belgeler/BUYU-KISMI.md ile aynı (`scripts/lib/buyu-durum.mjs`): tamamlama blokları (`a4`…`s2`) temel mekaniğin üstüne yazılır; **kısmi** = yaklaşıklık (`approx`) ya da yalnız Game Master notu (kapsam dışı, savaş dışı, sığmayan ya da Game Master notlu değilse); **yok** = kayıt yok ya da `unsupported`; **savaş dışı** = `offCombat` (kartta ve günlükte Game Master notu). "Oyuna uyar mı" kararları `data/buyu-durum-notlari.json`.',
  '',
  '## Özet',
  '',
  `Toplam ${rows.length} = savaşta kullanılan ${combat} + savaş dışı ${off}.`,
  '',
  `| Seviye | ${STATES.join(' | ')} | Toplam |`,
  `|---|${STATES.map(() => '---').join('|')}|---|`,
  ...groups.map(([g, f]) => `| ${g} | ${STATES.map((s) => count((r) => f(r.level) && r.durum === s)).join(' | ')} | ${count((r) => f(r.level))} |`),
  `| **Toplam** | ${STATES.map((s) => count((r) => r.durum === s)).join(' | ')} | ${rows.length} |`,
  '',
  `Çalışır olanlardan: Game Master notlu ${gmRows.length}, kapsam dışı notlu ${kdRows.length}, sığmayan parça notlu ${count((r) => !!r.sigmayan)}. 6–9. seviye açıklaması (\`text\`) boş: ${count((r) => r.level >= 6 && r.textEmpty)} / ${count((r) => r.level >= 6)} (kart SRD sayfa referansını gösterir; Dungeondex açıklamaları ileride bağlanacak).`,
  '',
  '## Game Master notlu (savaş etkisi tam, kalan parça Game Master\'da)',
  '',
  '| Kimlik | Sv | Not | Oyuna uyar mı? Neden |',
  '|---|---|---|---|',
  ...gmRows.map((r) => `| ${r.id} | ${r.level} | ${cell(r.gm)} | ${cell(verdict(r.id))} |`),
  '',
  '## Kapsam dışı notlu (eksik parça savaş modelinin dışında)',
  '',
  'Bu parçaların tetikleyiciye göre gruplu kaydı ve ne zaman ele alınacakları: harita/belgeler/BUYU-ERTELENEN.md (Kuyruk G6).',
  '',
  '| Kimlik | Sv | Kapsam dışı | Oyuna uyar mı? Neden |',
  '|---|---|---|---|',
  ...kdRows.map((r) => `| ${r.id} | ${r.level} | ${cell(r.kapsam)} | ${cell(verdict(r.id))} |`),
  '',
  '## Yardımcı (utility) büyülerin koddaki karşılığı',
  '',
  'Mekanik türü `utility` olan ve özel anahtarla işlenen büyüler; anahtar `src/battle/` kaynağında aranır (betik her çalıştığında).',
  '',
  '| Kimlik | Sv | Durum | Mekanik anahtarı | İşleyen dosyalar |',
  '|---|---|---|---|---|',
  ...utilRows.map((u) => `| ${u.id} | ${u.level} | ${u.durum}${u.upgrade ? ' (Game Master anahtarı `spellsK19` açıkken savaşta)' : ''} | \`${u.key}\` | ${u.files.length ? u.files.join(', ') : '**bulunamadı**'} |`),
  '',
  '## Liste',
  '',
  '| Kimlik | Sv | Dosya | Durum | Son tamamlama bloğu | Not (kısmi/yok nedeni, sığmayan parça) | 6–9 açıklama boş |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.level} | ${r.file} | ${r.durum} | ${r.blok ?? ''} | ${cell(r.durum === 'kısmi' || r.durum === 'yok' ? r.neden : r.sigmayan ?? '')} | ${r.level >= 6 ? (r.textEmpty ? 'evet' : 'hayır') : ''} |`),
  '',
];
fs.writeFileSync(path.join(root, 'harita/belgeler/BUYU-DURUM.md'), lines.join('\n'));
const pointer = (title) => `# ${title}\n\nBu belge Kuyruk K58'de **harita/belgeler/BUYU-DURUM.md** ile değiştirildi (339 büyünün tamamı, BUYU-KISMI ile aynı ölçüt). Üretici: \`node scripts/buyu-denetimi.mjs\`.\n`;
fs.writeFileSync(path.join(root, 'docs/BUYU-DENETIMI.md'), pointer('Büyü denetimi (0–3. seviye)'));
fs.writeFileSync(path.join(root, 'docs/BUYU-DENETIMI-4-5.md'), pointer('Büyü denetimi (4–5. seviye)'));
console.log(`339 büyü: ${STATES.map((s) => `${s} ${count((r) => r.durum === s)}`).join(', ')}; GM notlu ${gmRows.length}, kapsam dışı notlu ${kdRows.length}; yardımcı bulunamayan ${utilRows.filter((u) => !u.files.length).map((u) => u.id).join(', ') || 'yok'}`);
