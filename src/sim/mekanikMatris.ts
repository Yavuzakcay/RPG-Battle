/**
 * APK öncesi mekanik doğrulama matrisi (ölçüm aracı; motoru değiştirmez).
 *   npx vite-node src/sim/mekanikMatris.ts -- [--yaz] [--kural-surumu N] [--etiket "Aşama"] [--buyu "Fireball,Fire Bolt"] [--saldiri "Longsword,Ogre"] [--ayrinti] [--hepsi]
 * Her büyü ve saldırı seçeneği × hedef bağlamı betikli zarla (kancalı Rng) kuru çalıştırılır; beklenen sonuç SRD 5.2.1
 * metninden/veriden hesaplanır (src/sim/matris/srd.ts kahini, özel okumalar ozel.ts), gerçek sonuç motorun olaylarından.
 * `--yaz`: harita/belgeler/MEKANIK-MATRIS.md ve harita/belgeler/mekanik-matris.csv. `--kural-surumu N`: o sürümle ölçer
 * (önce/sonra karşılaştırması: düzeltmeler sürüm kapılı). `--etiket`: özeti harita/belgeler/mekanik-matris-gecmis.json'a
 * yazar (aynı etiket güncellenir; rapordaki önce/sonra tablosu). Tek süreç (paralel iş yok).
 */
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData()]);
const { setDefaultRuleVersion, defaultRuleVersion } = await import('../battle/create');

declare const process: { argv: string[] };
type FsLike = { writeFileSync(path: string, data: string): void; readFileSync(path: string, enc: string): string; existsSync(path: string): boolean };
const NODE_FS: string = 'node:fs';
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const ver = opt('--kural-surumu');
if (ver) setDefaultRuleVersion(Number(ver));

const { tumBuyuSatirlari } = await import('./matris/tum');
const { saldiriSatirlari } = await import('./matris/saldiri');
const { hazirlaSatirlari } = await import('./matris/hazirla');
const { yazRapor, siniflandir, ozetOf } = await import('./matris/rapor');
const { YONTEM } = await import('./matris/yontem');
type Ozet = ReturnType<typeof ozetOf>;

const only = opt('--buyu')?.split(',').map((x) => x.trim());
const onlyAtk = opt('--saldiri')?.split(',').map((x) => x.trim());
const t0 = Date.now();
const rows = [
  ...(onlyAtk && !only ? [] : tumBuyuSatirlari(only)),
  ...(only && !onlyAtk ? [] : saldiriSatirlari(onlyAtk)),
  // Hazırla (Ready, sürüm 90): eylem satırları (SRD 5.2.1 s.186–187).
  ...(only || onlyAtk ? [] : hazirlaSatirlari()),
];
const ms = Date.now() - t0;
const sinifli = siniflandir(rows);
if (args.includes('--ayrinti') || only || onlyAtk) {
  for (const r of sinifli) {
    if (args.includes('--hepsi') || r.sonuc !== 'doğru') console.log(`[${r.sonuc}] ${r.ad} | ${r.baglam}${r.bulgu ? ` {${r.bulgu}}` : ''}\n   B: ${r.beklenen}\n   G: ${r.gercek}${r.not ? `\n   N: ${r.not}` : ''}`);
  }
}
const say: Record<string, number> = {};
for (const r of sinifli) say[r.sonuc] = (say[r.sonuc] ?? 0) + 1;
console.log(`satır ${rows.length} (${ms} ms, sürüm ${defaultRuleVersion()}):`, JSON.stringify(say));
const GECMIS = 'harita/belgeler/mekanik-matris-gecmis.json';
const needFs = args.includes('--yaz') || !!opt('--etiket');
const fs = needFs ? (await import(/* @vite-ignore */ NODE_FS)) as FsLike : null;
let gecmis: Ozet[] = fs && fs.existsSync(GECMIS) ? JSON.parse(fs.readFileSync(GECMIS, 'utf8')) as Ozet[] : [];
const etiket = opt('--etiket');
if (fs && etiket) {
  if (only || onlyAtk) throw new Error('--etiket yalnız tam ölçümde (--buyu/--saldiri olmadan).');
  const o = ozetOf(sinifli, etiket, defaultRuleVersion());
  const i = gecmis.findIndex((x) => x.etiket === etiket);
  gecmis = i >= 0 ? gecmis.map((x, k) => (k === i ? o : x)) : [...gecmis, o];
  fs.writeFileSync(GECMIS, `${JSON.stringify(gecmis, null, 1)}\n`);
  console.log(`özet yazıldı: ${GECMIS} (${etiket})`);
}
if (fs && args.includes('--yaz')) {
  console.log('yazıldı:', yazRapor(rows, ms, fs, YONTEM, gecmis).join(', '));
}
