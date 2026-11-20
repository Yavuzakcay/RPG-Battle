// Kuyruk KQ3 NA1: nesne türü tablosu → harita/belgeler/NESNE-TABLO.md (veri: data/nesneler.json, nesne-hareket.json, nesne-agirlik.json, sprite-esleme.json).
// Çalıştırma: node scripts/na1-nesne-tablo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const kinds = read('data/nesneler.json').kinds;
const move = read('data/nesne-hareket.json');
const ag = read('data/nesne-agirlik.json');
const sprites = read('data/sprite-esleme.json').objects ?? {};
const cap = (str) => str * 15;
const people = (lb, str) => Math.max(1, Math.ceil(lb / cap(str)));
const cls = (lb) => (lb <= ag.sinif.hafifEnFazlaLb ? 'hafif' : lb <= ag.sinif.ortaEnFazlaLb ? 'orta' : 'ağır');
const L = [];
L.push('# NA1: nesne türü tablosu (ağırlık ve taşıma)', '');
L.push('Üretim: `node scripts/na1-nesne-tablo.mjs` (veri: `data/nesneler.json` `agirlikLb`, `data/nesne-agirlik.json`). Ağırlıklar SRD değerlerine yakın makul sayılardır; SRD nesne ağırlığı vermeyen türlerde (varil, heykel…) gerçek dünya karşılığı. Kapasite = STR × 15 lb (Orta boy); "kaç kişi" STR 10 (150 lb) ve STR 16 (240 lb) için. Ağırlık sınıfı: hafif ≤ ' + ag.sinif.hafifEnFazlaLb + ' lb, orta ≤ ' + ag.sinif.ortaEnFazlaLb + ' lb, üstü ağır (itme çarpanı ve fırlatma menzili sınıf/ağırlıktan).', '');
L.push('| Kimlik | TR ad | EN ad | Sprite | Taşınabilir (al) | İtilir/fırlatılır | Ağırlık (lb) | Sınıf | Kaç kişi (STR 10 / 16) | SRD |', '|---|---|---|---|---|---|---|---|---|---|');
const noSprite = [];
for (const [id, d] of Object.entries(kinds)) {
  const sp = sprites[id] ? 'var' : 'yok';
  if (!sprites[id]) noSprite.push(id);
  const carry = !!d.carryable; const pushable = !!move.hareketli[id] || (carry && (d.agirlikLb ?? 0) > 0);
  const w = d.agirlikLb;
  L.push(`| \`${id}\` | ${d.tr} | ${d.en} | ${sp} | ${carry ? 'evet' : 'hayır'} | ${pushable ? 'evet' : 'hayır'} | ${w ?? '—'} | ${w ? cls(w) : '—'} | ${w && carry ? `${people(w, 10)} / ${people(w, 16)}` : '—'} | ${d.srd ?? (d.dekor ? 'dekor' : '')} |`);
}
L.push('', '## Sprite\'sız nesneler', '', 'Sprite yoksa savaş haritasında nesnenin `icon` emojisi yer tutucudur (`src/MapBattle.tsx`); gerçek sprite gelince `data/sprite-esleme.json` `objects` altına eklenir.', '', noSprite.map((x) => `\`${x}\``).join(', '), '');
fs.writeFileSync(path.join(root, 'harita/belgeler/NESNE-TABLO.md'), L.join('\n'));
console.log(`NESNE-TABLO.md: ${Object.keys(kinds).length} tür, ${noSprite.length} sprite'sız`);
