/**
 * Eşya ikon raporu (`npm run esya-ikon:rapor`, `npm run esya-ikon`dan sonra): harita/belgeler/ESYA-IKON-RAPOR.md +
 * 96 px kontak sayfaları harita/belgeler/ESYA-IKON-KONTAK-<n>.png. Yalnız okur: oyun kayıtları (sihirli eşya + donanım, silah, zırh),
 * manifest data/esya-ikon-sayfalar.json, SRD data/srd/magic-items.json ve public/esya/. Varyant eşlemesi hattaki kuraldır (`esle`), tahmin yok;
 * eşleşmeyen, belirsiz ve kayıtsız kimlikler ayrı listelenir.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { armor, items, loadClassData, weapons } from '../src/data';
import { bagla, dosyaAdi, esle, oyunKayitlari, plan, sayfaAdi } from './esya-ikon.mjs';

await loadClassData();
const ROOT = path.resolve(import.meta.dirname, '..');
const BEL = path.join(ROOT, 'harita/belgeler');
const ham = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/esya-ikon-sayfalar.json'), 'utf8'));
const es = esle(ham, oyunKayitlari(ROOT));
const manifest = es.manifest;
const srd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/srd/magic-items.json'), 'utf8')) as { items: Array<{ id: string; name: string }> };
const ikonVar = (id: string) => fs.existsSync(path.join(ROOT, 'public/esya', `${dosyaAdi(id)}.webp`));

type Kayit = { id: string; ad: string; tur: string };
const oyun: Kayit[] = [
  ...items.map((i) => ({ id: i.id, ad: i.name, tur: i.srd.startsWith('magic-items') ? 'sihirli' : 'donanım' })),
  ...weapons.map((w) => ({ id: w.id, ad: w.name, tur: 'silah' })),
  ...(armor as Array<{ name: string; srd?: string }>).filter((a) => a.srd).map((a) => ({ id: String(a.srd).split(':')[1]!, ad: a.name, tur: 'zırh' })),
];
const say = (t: string) => oyun.filter((k) => k.tur === t).length;

const { son, ezilen, etkisiz } = plan(manifest, (d: string) => fs.existsSync(path.join(ROOT, 'assets-ham/esya', d)));
const { cikti, ust, kayitsiz } = bagla(son, oyunKayitlari(ROOT));
const ikonsuz = oyun.filter((k) => !ikonVar(k.id));
const kayitsizDuz = kayitsiz.filter((id: string) => !id.includes('/')).sort();
const yeniden = Object.entries((ham.yenidenUretilecek ?? {}) as Record<string, string>);

// SRD 258 ↔ oyun 319: oyun sihirli kaydı srd kimliğine göre gruplanır.
const sihirli = items.filter((i) => i.srd.startsWith('magic-items'));
const grup = new Map<string, typeof sihirli>();
for (const i of sihirli) { const k = i.srd.split(':')[1]!; grup.set(k, [...(grup.get(k) ?? []), i]); }
const srdIdler = new Set(srd.items.map((x) => x.id));
const acilan = [...grup].filter(([k, v]) => v.length > 1 || (v.length === 1 && v[0]!.id !== k)).sort();
const srdDisi = [...grup.keys()].filter((k) => !srdIdler.has(k));
const oyundaYok = srd.items.filter((x) => !grup.has(x.id));

// Boyut.
const dosyalar = (d: string) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.webp')).map((f) => path.join(d, f)) : []);
const buyuk = dosyalar(path.join(ROOT, 'public/esya')); const kucuk = dosyalar(path.join(ROOT, 'public/esya/kucuk'));
const kb = (l: string[]) => Math.round(l.reduce((s, f) => s + fs.statSync(f).size, 0) / 1024);

// Kontak sayfaları: 96 px, 12 × 10 = 120 ikon/sayfa, altında kısaltılmış kimlik.
const KOL = 12; const SAT = 10; const HC = 112; const ET = 22;
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const kontakIdler = [...cikti.keys()].sort().filter(ikonVar);
const kontaklar: string[] = [];
for (let s = 0; s * KOL * SAT < kontakIdler.length; s++) {
  const dilim = kontakIdler.slice(s * KOL * SAT, (s + 1) * KOL * SAT);
  const W = KOL * HC; const H = Math.ceil(dilim.length / KOL) * (HC + ET);
  const yazi = dilim.map((id, i) => {
    const t = id.length > 19 ? `${id.slice(0, 18)}…` : id;
    return `<text x="${(i % KOL) * HC + HC / 2}" y="${Math.floor(i / KOL) * (HC + ET) + HC + 12}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10" fill="${cikti.get(id)?.kopya ? '#8ab4f8' : '#e8eaed'}">${xml(t)}</text>`;
  }).join('');
  const zemin = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#2a2e35"/>${yazi}</svg>`);
  const ikon = dilim.map((id, i) => ({ input: path.join(ROOT, 'public/esya/kucuk', `${dosyaAdi(id)}.webp`), left: (i % KOL) * HC + 8, top: Math.floor(i / KOL) * (HC + ET) + 8 }));
  const ad = `ESYA-IKON-KONTAK-${s + 1}.png`;
  await sharp(zemin).composite(ikon).png({ palette: true, quality: 90, effort: 8 }).toFile(path.join(BEL, ad));
  kontaklar.push(ad);
}

const liste = (l: string[]) => (l.length ? l.map((x) => `\`${x}\``).join(', ') : '—');
const belirsiz = manifest.belirsiz as Record<string, string | string[]>;
const yoksay = new Set<string>(manifest.yoksay ?? []);
const islenen = (manifest.sayfalar as Array<{ dosya: string }>).map((s) => sayfaAdi(s.dosya)).filter((s) => !yoksay.has(s));

const md = `# Eşya ikon raporu

\`npm run esya-ikon\` (scripts/esya-ikon.mjs) → \`npm run esya-ikon:rapor\` (scripts/esya-ikon-rapor.ts) üretir; elle düzenlenmez.
Manifest \`data/esya-ikon-sayfalar.json\`, ham sayfalar \`assets-ham/esya/\` (depo dışı), kontrol görselleri \`harita/belgeler/ESYA-IKON-KONTROL/<sayfa>.png\`.

## Belirsiz (manifestten)

${Object.entries(belirsiz).map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.map((x) => `\`${x}\``).join(', ') : v}`).join('\n')}

## Özet

- İşlenen sayfa: ${islenen.length} (yoksayılan: ${liste([...yoksay])}).
- Oyun eşya kaydı: ${oyun.length} (sihirli ${say('sihirli')} + donanım ${say('donanım')} + silah ${say('silah')} + zırh ${say('zırh')}); ikonlu **${oyun.length - ikonsuz.length}**, ikonsuz **${ikonsuz.length}**.
- \`public/esya/\`: yalnız oyun kayıtları, ${buyuk.length} × 256 px + ${kucuk.length} × 96 px, toplam **${((kb(buyuk) + kb(kucuk)) / 1024).toFixed(1)} MB** (256 px ${kb(buyuk)} kB, 96 px ${kb(kucuk)} kB). Ana parçaya girmez.
- Varyant eşlendi **${es.varyant.length}**, eşleşmeyen **${es.eslesmeyen.length}**, belirsiz **${es.belirsiz.length}**; SRD üst kimliği kopyası **${ust.length}** kimlik → ${ust.reduce((n: number, u: [string, string[], string[]]) => n + u[2].length, 0)} kayıt; kayıtsız (yazılmadı) **${kayitsiz.length}** (${es.eslesmeyen.length} eşleşmeyen varyant + ${kayitsizDuz.length} diğer).
- Ezilen hücre: ${ezilen.length}. ${etkisiz.length ? `\`ayniGorsel\` uygulanamayan: ${etkisiz.join('; ')}.` : ''}
- Tam despill (cam içi yeşil ton): ${liste(ham.tamDespill ?? [])}.

## Yeniden üretilecek (açık ${yeniden.filter(([k]) => !ezilen.some(([, eski]: string[]) => eski === k)).length} / ${yeniden.length})

${yeniden.length ? yeniden.map(([k, v]) => { const ez = ezilen.find(([, eski]: string[]) => eski === k); return `- **${k}** ${v}${ez ? ` — **çözüldü**: ${ez[2]} ezer` : ''}`; }).join('\n') : '—'}

## İkonu olmayan oyun kayıtları (${ikonsuz.length})

${['sihirli', 'donanım', 'silah', 'zırh'].map((t) => { const l = ikonsuz.filter((k) => k.tur === t); return `- **${t}** (${l.length}): ${liste(l.map((k) => k.id))}`; }).join('\n')}

## Varyant eşleme (${es.varyant.length})

Kural (oyun kayıtlarından): \`<ana>/<varyant>\` → \`srd\` kimliği \`<ana>\` olan açılmış oyun kayıtlarından kimliğinde \`<varyant>\` tire sınırlı parça olarak geçen tek kayıt. Tek aday yoksa eşleşmez, birden çoksa belirsiz; ikisi de bağlanmaz.

| Manifest | Oyun kaydı |
|---|---|
${es.varyant.map(([a, b]: string[]) => `| \`${a}\` | \`${b}\` |`).join('\n')}

### Eşleşmeyen (${es.eslesmeyen.length}; bağlanmadı)

${es.eslesmeyen.map(([a, n]: string[]) => `- \`${a}\`: ${n}`).join('\n') || '—'}

### Belirsiz (${es.belirsiz.length}; bağlanmadı)

${es.belirsiz.map(([a, l]: [string, string[]]) => `- \`${a}\`: ${liste(l)}`).join('\n') || '—'}

## SRD üst kimliği kopyaları (${ust.length})

Üst kimliğin ikonu, kendi varyant ikonu olmayan bütün açılmış kayıtlara kopyalanır.

${ust.map(([k, u, al]: [string, string[], string[]]) => `- \`${k}\` → ${al.length ? liste(al) : '— (hepsinin kendi varyant ikonu var)'}`).join('\n')}

## Kayıtsız (${kayitsizDuz.length} + ${es.eslesmeyen.length} eşleşmeyen varyant)

Oyunda kaydı yok; ikon üretilir ama \`public/esya/\`'ya yazılmaz (kontrol görselinde gri "kayıtsız"): ${liste(kayitsizDuz)}.

## SRD 258 ↔ oyun ${sihirli.length} sihirli eşya

SRD dosyasında ${srd.items.length} kayıt var; oyun (\`data/items.json\` + \`data/items-srd.json\`) bazı SRD kayıtlarını varyantlarına açıyor, birkaçını tek kayıt olarak yeniden adlandırıyor. Fark ${sihirli.length} − ${srd.items.length} = **${sihirli.length - srd.items.length}**${oyundaYok.length ? `; oyunda karşılığı olmayan SRD kaydı: ${liste(oyundaYok.map((x) => x.id))}` : ''}${srdDisi.length ? `; SRD'de olmayan srd kimliği: ${liste(srdDisi)}` : ''}.

| SRD kimliği | Oyun kayıtları | Fazla |
|---|---|---|
${acilan.map(([k, v]) => `| \`${k}\` | ${v.map((i) => `\`${i.id}\``).join(', ')} | ${v.length - 1} |`).join('\n')}
| **Toplam** | | **${acilan.reduce((s, [, v]) => s + v.length - 1, 0)}** |

## Ezilen hücreler (${ezilen.length})

Sonraki sayfa öncekini ezer (manifest sırası).

${ezilen.map(([id, eski, yeni]: string[]) => `- \`${id}\`: ${eski} → ${yeni}`).join('\n')}

## Kontak sayfaları (96 px)

Oyun kayıtları; mavi etiket: üst kimlikten kopya.

${kontaklar.map((k) => `- [${k}](${k})`).join('\n')}
`;
fs.writeFileSync(path.join(BEL, 'ESYA-IKON-RAPOR.md'), md);
console.log(`yazılan ${cikti.size}; oyun ${oyun.length}, ikonsuz ${ikonsuz.length}; varyant ${es.varyant.length}, eşleşmeyen ${es.eslesmeyen.length}, kayıtsız ${kayitsiz.length}; SRD farkı ${sihirli.length - srd.items.length}; kontak ${kontaklar.length}; ${((kb(buyuk) + kb(kucuk)) / 1024).toFixed(1)} MB`);
