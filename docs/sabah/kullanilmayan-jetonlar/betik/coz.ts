// KJ1 / 1. yol: GERÇEK çözücü kodunu (src/battle/avatar.ts) çalıştırarak "bağlı" jeton kümesini toplar. Dosya adı eşleştirmesine güvenmez.
// Çalıştırma (depo kökünden):  npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/coz.ts
// Çıktı: ../bagli-kume.tsv (jeton başına çözülme sayıları) ve ../coz-ozet.json. YALNIZ OKUR (public/ ve data/ dosyalarına yazmaz).
//
// Kapsam: 10 ırk × 2 cinsiyet × 12 sınıf × (120 alt sınıf kimliği + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 = sheetAvatar çağrıları
// (her sınıf × her alt sınıf kimliği çaprazlanır; yanlış sınıfın kimliği çözülmemeli). Ayrıca çözücü dışında addan kurulan girişler:
// Builder'ın sınıf jetonu ön yüklemesi (characterTokenFile) ve Hapishane mahkûm kıyafeti; doğrudan subclassTokenFile/garibanTokenFile uçları.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheetAvatar, characterTokenFile, subclassTokenFile, garibanTokenFile, setSubTokenWarnings } from '../../../../src/battle/avatar';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = fileURLToPath(new URL('../', import.meta.url));
setSubTokenWarnings(false);

const RACES = ['celestial', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'];
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const GENDERS = ['erkek', 'kadin'] as const;
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

// Alt sınıf kimlik evreni: bütün jeton tablolarının anahtarları (altSiniflar, formlar, cinsiyet) + imza.json.
const subs = new Set<string>();
for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter((x) => /-jeton\.json$/.test(x))) {
  const d = read(`data/${f}`);
  for (const k of Object.keys(d.altSiniflar ?? {})) subs.add(k);
  for (const k of Object.keys(d.formlar ?? {})) subs.add(k);
  for (const k of Object.keys(d.cinsiyet ?? {})) subs.add(k);
}
const imza = read('data/imza.json');
for (const k of Array.isArray(imza.altSiniflar) ? imza.altSiniflar.map((x: { id: string }) => x.id) : Object.keys(imza.altSiniflar ?? {})) subs.add(k);
const subList: Array<string | undefined> = [undefined, 'bilinmeyen-alt-sinif', ...[...subs].sort()];

interface Rec { ana: number; yedek: number; genel: number; ornek: string; minSeviye: number; maksSeviye: number }
const rec = new Map<string, Rec>();
const touch = (file: string, kind: 'ana' | 'yedek' | 'genel', why: string, level: number) => {
  let r = rec.get(file);
  if (!r) { r = { ana: 0, yedek: 0, genel: 0, ornek: why, minSeviye: 99, maksSeviye: 0 }; rec.set(file, r); }
  r[kind]++;
  if (kind === 'ana') { if (r.ana === 1) r.ornek = why; r.minSeviye = Math.min(r.minSeviye, level); r.maksSeviye = Math.max(r.maksSeviye, level); }
};

const digerYedek = new Set<string>();
let calls = 0;
for (const race of RACES) for (const gender of GENDERS) for (const cls of CLASSES) for (const sub of subList) for (let level = 1; level <= 20; level++) {
  const av = sheetAvatar({ raceId: race, classId: cls, gender, level, subclassId: sub } as never);
  calls++;
  const why = `${race}/${gender}/${cls}/${sub ?? '-'}/L${level}`;
  if (av.src.startsWith('characters/')) touch(av.src.slice('characters/'.length), 'ana', why, level);
  for (const fb of av.fallbacks ?? []) { if (fb.startsWith('characters/')) touch(fb.slice('characters/'.length), 'yedek', why, level); else digerYedek.add(fb); }
}

const hapis = read('data/hapishane.json').kostum.sinif as string;
for (const race of RACES) for (const gender of GENDERS) {
  for (const cls of CLASSES) touch(characterTokenFile(race, gender, cls), 'genel', `Builder önyükleme ${race}/${gender}/${cls}`, 0);
  touch(characterTokenFile(race, gender, hapis), 'genel', `Hapishane kıyafeti ${race}/${gender}`, 0);
}

let direct = 0;
for (const race of RACES) for (const gender of GENDERS) for (const cls of CLASSES) {
  for (const lv of [1, 2, 3, 9, 10, 16, 17, 20]) {
    const g = garibanTokenFile(cls, race, gender, lv); direct++;
    if (g) touch(g, 'ana', `gariban ${race}/${gender}/${cls}/L${lv}`, lv);
    for (const sub of subList) { const s = subclassTokenFile(cls, race, gender, sub, lv); direct++; if (s) touch(s, 'ana', `alt-sinif ${race}/${gender}/${cls}/${sub}/L${lv}`, lv); }
  }
}

const disk = new Set(fs.readdirSync(path.join(ROOT, 'public/characters')).filter((f) => f.endsWith('.webp')));
const resolved = [...rec.keys()].sort();
const tsv = ['dosya\tana\tyedek\tgenel\tmin_seviye\tmaks_seviye\tilk_ana_ornek'];
for (const f of resolved) { const r = rec.get(f)!; tsv.push([f, r.ana, r.yedek, r.genel, r.ana ? r.minSeviye : '', r.ana ? r.maksSeviye : '', r.ornek].join('\t')); }
fs.writeFileSync(path.join(OUT, 'bagli-kume.tsv'), tsv.join('\n') + '\n');
const ozet = {
  sheetAvatarCagri: calls, dogrudanCagri: direct, altSinifKimligi: subs.size, altSinifListesi: [...subs].sort(), baglananJeton: resolved.length,
  diskteOlmayanCozum: resolved.filter((f) => !disk.has(f)), digerYedekYol: [...digerYedek].sort(), avatarsDizinVar: fs.existsSync(path.join(ROOT, 'public/avatars')),
};
fs.writeFileSync(path.join(OUT, 'coz-ozet.json'), JSON.stringify(ozet, null, 1) + '\n');
console.log(JSON.stringify({ sheetAvatarCagri: calls, dogrudanCagri: direct, altSinif: subs.size, baglanan: resolved.length, diskteOlmayan: ozet.diskteOlmayanCozum.length, digerYedek: digerYedek.size }));
