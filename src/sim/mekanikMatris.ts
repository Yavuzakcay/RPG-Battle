/**
 * APK öncesi mekanik doğrulama matrisi (yalnız ölçüm; mekaniğe dokunmaz).
 *   npx vite-node src/sim/mekanikMatris.ts -- [--yaz] [--buyu "Fireball,Fire Bolt"] [--saldiri "Longsword,Ogre"] [--ayrinti] [--hepsi]
 * Her büyü ve saldırı seçeneği × hedef bağlamı betikli zarla (kancalı Rng) kuru çalıştırılır; beklenen sonuç SRD 5.2.1
 * metninden/veriden hesaplanır (src/sim/matris/srd.ts kahini, özel okumalar ozel.ts), gerçek sonuç motorun olaylarından.
 * `--yaz`: harita/belgeler/MEKANIK-MATRIS.md ve harita/belgeler/mekanik-matris.csv. Tek süreç (paralel iş yok).
 */
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData()]);
const { tumBuyuSatirlari } = await import('./matris/tum');
const { saldiriSatirlari } = await import('./matris/saldiri');
const { yazRapor, siniflandir } = await import('./matris/rapor');
const { YONTEM } = await import('./matris/yontem');

declare const process: { argv: string[] };
type FsLike = { writeFileSync(path: string, data: string): void };
const NODE_FS: string = 'node:fs';
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const only = opt('--buyu')?.split(',').map((x) => x.trim());
const onlyAtk = opt('--saldiri')?.split(',').map((x) => x.trim());
const t0 = Date.now();
const rows = [
  ...(onlyAtk && !only ? [] : tumBuyuSatirlari(only)),
  ...(only && !onlyAtk ? [] : saldiriSatirlari(onlyAtk)),
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
console.log(`satır ${rows.length} (${ms} ms):`, JSON.stringify(say));
if (args.includes('--yaz')) {
  const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike;
  console.log('yazıldı:', yazRapor(rows, ms, fs, YONTEM).join(', '));
}
