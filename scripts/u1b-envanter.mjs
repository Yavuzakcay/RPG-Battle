/**
 * Kuyruk U1b, Görev 0: `icerik/` (ya da verilen klasör) paketlerinden uçuş envanteri.
 * Çalıştırma: `node scripts/u1b-envanter.mjs [klasör] [--yaz]`. Varsayılan çıktı ekrana; `--yaz` çıktıyı
 * `harita/belgeler/U1B-ENVANTER-YEREL.md` dosyasına yazar (yerel paket kimlikleri; paket metni yok).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { envanterMarkdown, ucusEnvanteri } from './lib/ucus-envanter.mjs';

const args = process.argv.slice(2);
const dir = resolve(args.find((a) => !a.startsWith('--')) ?? 'icerik');
if (!existsSync(dir)) { console.log(`Klasör yok: ${dir} (içerik paketlerini buraya koy; depoya girmez).`); process.exit(0); }
const packs = [];
for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.json')).sort()) {
  try {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8').replace(/^﻿/, ''));
    if (data?.format === 'rpg-battle-icerik') packs.push({ dosya: f, data });
  } catch { console.log(`uyarı: ${f} okunamadı`); }
}
const md = envanterMarkdown(ucusEnvanteri(packs));
if (args.includes('--yaz')) { writeFileSync('harita/belgeler/U1B-ENVANTER-YEREL.md', `# U1b yerel envanter (üretilen; ${packs.length} paket)\n\n${md}`); console.log('yazıldı: harita/belgeler/U1B-ENVANTER-YEREL.md'); }
else console.log(md);
