// Kuyruk 31: harita/kita/*.(jpg|png|webp) → public/kita/<ad>.webp (Serüven kıta sayfaları; npm run kita).
// Ad: kita-buzul, kita-dag, kita-orman, kita-bataklik (kita-batak da olur), kita-col, kita-volkan, kita-derinlikler.
// Boyut korunur (2752×1536 beklenir; farklıysa uyarı), kalite 82. Resimler tembel yüklenir, ana parçaya girmez.
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'harita/kita';
const OUT = 'public/kita';
const ALIAS = { 'kita-batak': 'kita-bataklik' };
if (!existsSync(SRC)) { console.log(`${SRC} yok: kıta resimleri eklenince yeniden çalıştırın.`); process.exit(0); }
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(SRC).filter((x) => /\.(jpe?g|png|webp)$/i.test(x))) {
  const name = ALIAS[parse(f).name] ?? parse(f).name;
  const img = sharp(join(SRC, f));
  const m = await img.metadata();
  if (m.width !== 2752 || m.height !== 1536) console.warn(`uyarı: ${f} ${m.width}×${m.height} (beklenen 2752×1536)`);
  await img.webp({ quality: 82 }).toFile(join(OUT, `${name}.webp`));
  console.log(`${f} → ${OUT}/${name}.webp`);
}
