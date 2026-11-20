/**
 * Kuyruk KQ6-9: data/ortam-genisletme.json donörlerini data/monster-ortamlari.json'a uygular (tek seferlik: `uygulandi` işareti)
 * ve harita/belgeler/ortam-genisletme.md tablosunu yazar (önce = git HEAD'deki ortam dosyası).
 * `--tablo`: yalnız tabloyu yeniden yaz (önce sütunu için `--once <git-sürümü>`, varsayılan HEAD~).
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { maps } from '../src/map/maps';

interface Env { id: string; ad: string; cr: string; ortam: string[] }
const confPath = 'data/ortam-genisletme.json';
const conf = JSON.parse(readFileSync(confPath, 'utf8')) as { donorler: Record<string, string[]>; hedefEnAz: number; uygulandi?: boolean; crTavan?: Record<string, number | string> };
/** "1/4" → 0.25. */
const crNum = (cr: string): number => { const [a, b] = cr.split('/').map(Number); return b ? (a as number) / b : (a as number); };
const envs = JSON.parse(readFileSync('data/monster-ortamlari.json', 'utf8')) as Env[];
const argv = process.argv.slice(2);
const tableOnly = argv.includes('--tablo');
const onceRef = argv.includes('--once') ? (argv[argv.indexOf('--once') + 1] as string) : 'HEAD';

if (!tableOnly) {
  if (conf.uygulandi) throw new Error('Genişletme zaten uygulandı (data/ortam-genisletme.json uygulandi).');
  const base = JSON.parse(JSON.stringify(envs)) as Env[];
  for (const [mapId, donors] of Object.entries(conf.donorler)) {
    if (!maps.some((m) => m.id === mapId)) throw new Error(`bilinmeyen harita ${mapId}`);
    if (donors.length > 4) throw new Error(`${mapId}: en çok 4 donör`);
    const src = new Set(base.filter((e) => donors.some((d) => e.ortam.includes(d))).map((e) => e.id));
    // CR tavanı (`crTavan`; Taverna: boss kademesi yok).
    const cap = typeof conf.crTavan?.[mapId] === 'number' ? conf.crTavan[mapId] as number : Infinity;
    for (const e of envs) if (src.has(e.id) && !e.ortam.includes(mapId) && crNum(e.cr) <= cap) e.ortam.push(mapId);
  }
  writeFileSync('data/monster-ortamlari.json', JSON.stringify(envs, null, 1) + '\n');
  writeFileSync(confPath, JSON.stringify({ ...conf, uygulandi: true }, null, 1) + '\n');
}

const old = JSON.parse(execSync(`git show ${onceRef}:data/monster-ortamlari.json`, { encoding: 'utf8', maxBuffer: 1 << 26 })) as Env[];
const n = (list: Env[], id: string) => list.filter((e) => e.ortam.includes(id)).length;
const rows = maps.map((m) => ({ m, a: n(old, m.id), b: n(envs, m.id) })).sort((x, y) => x.a - y.a);
const md = [
  '# Ortam genişletme (Kuyruk KQ6-9)',
  '',
  'Yalnız ortam eşlemesi (`data/monster-ortamlari.json`) genişledi; `data/monsters.json` değişmedi. Donör kuralları `data/ortam-genisletme.json` (harita başına en çok 4 donör harita; donör ortamındaki her canavar hedef haritaya da eklenir; `crTavan` haritasında tavanın üstündeki CR eklenmez: Taverna ≤ 8). "Tüm canavarlar" anahtarı aynen duruyor.',
  '',
  '| Kimlik | Ad | Bölge | Gizli | Önce | Sonra | Eklenen donörler |',
  '|---|---|---|---|---:|---:|---|',
  ...rows.map(({ m, a, b }) => `| ${m.id} | ${m.name} | ${(m as { bolge?: string }).bolge ?? ''} | ${m.gizli ? 'evet' : ''} | ${a}${a < 30 ? ' ⚑' : ''} | ${b} | ${(conf.donorler[m.id] ?? []).join(', ')} |`),
  '',
  `⚑ = önce 30'dan az. Hedef: her harita ≥ ${conf.hedefEnAz} uygun canavar (test \`src/data/ortamGenisletme.test.ts\`).`,
  '',
  '## Etki (ölçülmedi)',
  '',
  '- `src/journey/encounter.ts` (`regionEncounter`) bölge haritasının ortam listesinden seçer; bölge haritaları `buzul-acik`, `dag-karakol`, `orman`, `col-vaha`, `batak-adalar`, `kale-onu`, `isinlanma-salonu` genişletilen haritalar arasında değil (zaten ≥ 40): `data/bolge-karsilasma.json` ve bölge karşılaşmaları değişmez.',
  '- Genişleyen haritalar yalnız Game Master kurulumunda (kademeli düşman listesi) ve Serüven düğümlerinin harita-ortam süzmesinde daha geniş havuz verir. Denge ölçümü yapılmadı.',
  '',
];
writeFileSync('harita/belgeler/ortam-genisletme.md', md.join('\n'));
console.log('tamam');
