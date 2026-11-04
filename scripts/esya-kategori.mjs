// Kuyruk K49 B6: SRD büyülü eşyalarının türünü ve nadirliğini data/esya-kategori.json `srd` alanına küçük bir tablo olarak
// yazar (oluşturucu 225 kB'lık SRD dosyasını yüklemesin). Çalıştırma: node scripts/esya-kategori.mjs
import fs from 'node:fs';
const src = JSON.parse(fs.readFileSync('data/srd/magic-items.json', 'utf8')).items;
const out = JSON.parse(fs.readFileSync('data/esya-kategori.json', 'utf8'));
out.srd = Object.fromEntries(src.map((m) => [m.id, [/^Armor \(Shield/.test(m.type ?? '') ? 'Shield' : String(m.type ?? '').split(/[ (,]/)[0], m.rarity ?? '']]));
fs.writeFileSync('data/esya-kategori.json', JSON.stringify(out, null, 2) + '\n');
console.log(Object.keys(out.srd).length, 'kayıt');
