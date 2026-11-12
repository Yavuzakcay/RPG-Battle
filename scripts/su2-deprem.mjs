// Kuyruk SU2: yalnız `efekt-zemin-deprem-yarigi` şeridini şeffaf çatlak olarak yeniden üretir
// (assets-ham/efekt/efekt-eksik.jpg değişmez; çıktı public/efekt/efekt-zemin-deprem-yarigi.webp; tam kesim: npm run sprite-ice -- --efekt).
import fs from 'node:fs';
import { sliceSheet, writeStrip } from './efekt-sayfa.mjs';
const T = JSON.parse(fs.readFileSync('data/efekt-kesim.json', 'utf8'));
const spec = T.sayfalar['efekt-eksik'];
const { result } = await sliceSheet('assets-ham/efekt/efekt-eksik.jpg', spec, T.bosEsik);
const r = result['zemin-deprem-yarigi'];
await writeStrip('public/efekt/efekt-zemin-deprem-yarigi.webp', r);
console.log(`zemin-deprem-yarigi ${r.frames.length} kare ${r.fw}×${r.fh}`);
