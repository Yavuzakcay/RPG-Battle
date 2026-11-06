/**
 * Görev P7: ek paket yaması uygulayıcı. Yama (`icerik/yama/*.yama.json`, yoksa `docs/ek-yama/p8.yama.json`) girdilerini
 * `icerik/*.json` paketlerine yazar: sınıf + alt sınıf kimliği (eşit ya da birbirini içeren) + seviye + TR ad eşleşen
 * özelliğin `status` ve `ilkeller` alanı. `$kaynak` belirteci alt sınıfın ilk `kaynak` ilkelinin kimliğine çözülür (yoksa
 * girdi "planli" yazılır). Paket dosyasının önceki hâli `icerik/yama/yedek/` altına kopyalanır. Paket metni okunmaz/yazılmaz.
 * Çalıştırma: `node scripts/ek-yama.mjs [yama.json ...] [--kuru]`; ardından `npm run check:icerik`.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const dry = args.includes('--kuru');
const given = args.filter((a) => !a.startsWith('--'));
const dir = 'icerik';
const yamaDir = join(dir, 'yama');
const yamalar = given.length ? given
  : existsSync(yamaDir) && readdirSync(yamaDir).some((f) => f.endsWith('.yama.json')) ? readdirSync(yamaDir).filter((f) => f.endsWith('.yama.json')).map((f) => join(yamaDir, f))
    : ['docs/ek-yama/p8.yama.json'];
if (!existsSync(dir)) { console.log(`Klasör yok: ${dir} (içerik paketlerini buraya koy; depoya girmez).`); process.exit(0); }
const norm = (s) => String(s ?? '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
const packs = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ file: join(dir, f), data: JSON.parse(readFileSync(join(dir, f), 'utf8')) }))
  .filter((p) => p.data?.format === 'rpg-battle-icerik');
let ok = 0;
const missing = [];
const planned = [];
const touched = new Set();
for (const y of yamalar) {
  const yama = JSON.parse(readFileSync(y, 'utf8'));
  for (const g of yama.girdiler ?? []) {
    let hit = null;
    for (const p of packs) for (const s of p.data.subclasses ?? []) {
      if (s.class !== g.sinif || !(s.id === g.altSinif || s.id.includes(g.altSinif) || g.altSinif.includes(s.id))) continue;
      const f = (s.features ?? []).find((x) => norm(x.name?.tr) === norm(g.ad) && (!g.seviye || x.level === g.seviye))
        ?? (s.features ?? []).find((x) => norm(x.name?.tr) === norm(g.ad));
      if (f) { hit = { p, s, f }; break; }
    }
    if (!hit) { missing.push(`${g.sinif}/${g.altSinif} ${g.seviye ?? ''} ${g.ad}`); continue; }
    const { p, s, f } = hit;
    let durum = g.durum;
    let ilkeller = g.ilkeller ? JSON.parse(JSON.stringify(g.ilkeller)) : undefined;
    if (ilkeller && JSON.stringify(ilkeller).includes('"$kaynak"')) {
      const k = (s.features ?? []).flatMap((x) => x.ilkeller ?? []).find((x) => x.tur === 'kaynak' && typeof x.id === 'string');
      if (k) ilkeller = JSON.parse(JSON.stringify(ilkeller).replaceAll('"$kaynak"', JSON.stringify(k.id)));
      else { ilkeller = undefined; durum = 'planli'; planned.push(`${s.id}/${f.id}`); }
    }
    f.status = durum;
    if (ilkeller) f.ilkeller = ilkeller; else if (durum !== 'calisir' && durum !== 'kismi') delete f.ilkeller;
    touched.add(p);
    ok++;
  }
}
if (!dry) {
  mkdirSync(join(yamaDir, 'yedek'), { recursive: true });
  for (const p of touched) {
    copyFileSync(p.file, join(yamaDir, 'yedek', `${basename(p.file, '.json')}.${Date.now()}.json`));
    writeFileSync(p.file, `${JSON.stringify(p.data, null, 1)}\n`);
  }
}
console.log(`${dry ? '(kuru) ' : ''}uygulandı: ${ok}, eşleşmeyen: ${missing.length}, kaynak bulunamadı (planlı): ${planned.length}`);
for (const m of missing) console.log(`  eşleşmedi: ${m}`);
for (const m of planned) console.log(`  planlı: ${m}`);
