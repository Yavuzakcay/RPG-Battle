// KJ2 / çözücü doğrulaması: Dragonborn için oyunun GERÇEK kodunu (src/battle/avatar.ts `sheetAvatar`, src/ui/tint.ts `maskUrlFor`/`maskedTint`)
// çalıştırıp çalışma anında hangi ten maskesi URL'lerinin istendiğini toplar. Dosya adı eşleştirmesi yok; disk durumundan bağımsız
// (eski maske kümesi URL kalıbıyla sınıflanır, dosyanın var olması gerekmez).
// Çalıştırma (depo kökünden):  npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/dragonborn-maske-coz.ts
// Çıktı: ../dragonborn-maske-coz-ozet.json. YALNIZ OKUR (public/ ve data/ dosyalarına yazmaz).
//
// Kapsam: 2 cinsiyet × 12 sınıf × (alt sınıf kimliği evreni + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 × soy (11: soysuz + 10 renk).
// Çalışma anında `Avatar.tsx` `useTinted(src, avatar.tint)` zincirin her halkası için (`src` + yedekler) boyama isteyebilir; bu betik de
// her halka için `maskUrlFor(url, av.tint)` hesaplar. Ayrıca eski yedek yol `lineageTint(…, 'maske')` için ayrıca bir sorgu yapılır:
// bu yolu uygulama kodu çağırmaz (rg ile doğrulandı), yalnız eski inceleme betikleri ve bir test çağırır.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { characterTokenFile, lineageTint, setSubTokenWarnings, sheetAvatar } from '../../../../src/battle/avatar';
import { maskedTint, maskUrlFor, scaleTinted } from '../../../../src/ui/tint';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const OUT = fileURLToPath(new URL('../', import.meta.url));
setSubTokenWarnings(false);

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const GENDERS = ['erkek', 'kadin'] as const;
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

// Alt sınıf kimlik evreni: jeton tablolarının anahtarları + imza.json (KJ1 betiğiyle aynı).
const subs = new Set<string>();
for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter((x) => /-jeton\.json$/.test(x))) {
  const d = read(`data/${f}`);
  for (const k of [...Object.keys(d.altSiniflar ?? {}), ...Object.keys(d.formlar ?? {}), ...Object.keys(d.cinsiyet ?? {})]) subs.add(k);
}
const imza = read('data/imza.json');
for (const k of Array.isArray(imza.altSiniflar) ? imza.altSiniflar.map((x: { id: string }) => x.id) : Object.keys(imza.altSiniflar ?? {})) subs.add(k);
const subList: Array<string | undefined> = [undefined, 'bilinmeyen-alt-sinif', ...[...subs].sort()];
// Soy kimlikleri: ırk verisindeki soylar (tint tablosu anahtarlarıyla aynı olmalı).
const soylar: Array<string | undefined> = [undefined, ...Object.keys(read('data/soy-renkleri.json').races.dragonborn.lineagesAlt)];

const LEGACY_CELL = /^characters\/maske\/dragonborn-(erkek|kadin)-/;       // eski hücreli (264) maskeler
const GENERIC = /^characters\/maske\/dragonborn-(male|female)-[a-z]+\.png$/;   // sınıf-genel maskeler (24)
const PUL = /^characters\/maske-pul\/dragonborn-(erkek|kadin)-/;               // yeni pul maskeleri
const kind = (u: string) => (PUL.test(u) ? 'maske-pul (hücreli)' : LEGACY_CELL.test(u) ? 'maske/ ESKİ hücreli' : GENERIC.test(u) ? 'maske/ sınıf-genel' : 'diğer');

interface Hit { n: number; ornek: string }
const istenen = new Map<string, Hit>();                       // çalışma anı: istenen ten maskesi URL'leri
const tintTurleri = new Map<string, number>();                // avatar.tint türü → sayı
const kaynakKinds = new Map<string, number>();                // birincil jeton türü (hücreli/genel) → sayı
let calls = 0, zincirHalka = 0;
for (const gender of GENDERS) for (const cls of CLASSES) for (const sub of subList) for (const lineageId of soylar) for (let level = 1; level <= 20; level++) {
  const av = sheetAvatar({ raceId: 'dragonborn', classId: cls, gender, level, subclassId: sub, lineageId } as never);
  calls++;
  const tk = av.tint ? ('pul' in av.tint.to ? 'pul' : 'lch' in av.tint.to ? 'lch' : 'gradient' in av.tint.to ? 'gradient' : 'diğer') : 'tint yok';
  tintTurleri.set(tk, (tintTurleri.get(tk) ?? 0) + 1);
  const pk = /-(?:GR|ID\d+|WL-\d+|SC-\d+|WZ-[A-Z]\d+)\.webp$/.test(av.src) ? 'hücreli' : 'sınıf-genel';
  kaynakKinds.set(pk, (kaynakKinds.get(pk) ?? 0) + 1);
  if (!av.tint || !maskedTint(av.tint)) continue;              // maske yalnız maskeli boyamada istenir (`tintedUrl`)
  for (const url of [av.src, ...(av.fallbacks ?? [])]) {
    if (!/(^|\/)characters\//.test(url)) continue;             // `useTinted`: yalnız characters/ yolları boyanır
    zincirHalka++;
    const m = maskUrlFor(url, av.tint);
    if (!m) continue;
    const h = istenen.get(m) ?? { n: 0, ornek: `${gender}/${cls}/${sub ?? '-'}/${lineageId ?? '-'}/L${level} (${url === av.src ? 'ana' : 'yedek'})` };
    h.n++; istenen.set(m, h);
  }
}

// Eski yedek yol: lineageTint(…, 'maske') (uygulama kodu çağırmaz). Hangi URL'lere götürdüğünü göster.
const eskiYol = new Map<string, number>();
for (const gender of ['male', 'female'] as const) for (const lin of soylar.filter(Boolean) as string[]) {
  const t = lineageTint('dragonborn', lin, gender, 'maske');
  if (!t || !maskedTint(t) || scaleTinted(t)) continue;
  const g = gender === 'male' ? 'erkek' : 'kadin';
  for (const cls of CLASSES) {
    const u = maskUrlFor(`characters/dragonborn-${g}-${cls}-GR.webp`, t) ?? '';
    eskiYol.set(kind(u), (eskiYol.get(kind(u)) ?? 0) + 1);
  }
}

const disk = (u: string) => fs.existsSync(path.join(ROOT, 'public', u));
const byKind: Record<string, { dosya: number; istek: number; diskteVar: number; diskteYok: number }> = {};
for (const [u, h] of istenen) {
  const k = kind(u); const b = (byKind[k] ??= { dosya: 0, istek: 0, diskteVar: 0, diskteYok: 0 });
  b.dosya++; b.istek += h.n; if (disk(u)) b.diskteVar++; else b.diskteYok++;
}
const eskiIstenen = [...istenen.keys()].filter((u) => LEGACY_CELL.test(u));
const genelBeklenen = CLASSES.flatMap((c) => ['male', 'female'].map((g) => `characters/maske/dragonborn-${g}-${c}.png`));
const ozet = {
  not: 'Dragonborn için sheetAvatar + maskUrlFor çalıştırıldı; çalışma anında istenen ten maskesi URL kümesi. ESKİ hücreli (maske/dragonborn-erkek|kadin-*) istek sayısı 0 olmalı.',
  sheetAvatarCagri: calls, altSinifKimligi: subs.size, soySayisi: soylar.length - 1, zincirHalkasiMaskeIcin: zincirHalka,
  avatarTintTuru: Object.fromEntries(tintTurleri), birincilJeton: Object.fromEntries(kaynakKinds),
  istenenMaskeDosyasi: istenen.size, tureGore: byKind,
  eskiHucreliIstenen: eskiIstenen.length,
  eskiHucreliIstenenOrnek: eskiIstenen.slice(0, 5).map((u) => [u, istenen.get(u)!.ornek]),
  siniFGenelMaskeIstenen: [...istenen.keys()].filter((u) => GENERIC.test(u)).length,
  siniFGenelMaskeBeklenen24Dosyada: genelBeklenen.filter(disk).length,
  eskiYedekYol_lineageTint_maske: Object.fromEntries(eskiYol),
  istenenAmaDiskteOlmayan: [...istenen.keys()].filter((u) => !disk(u)),
};
fs.writeFileSync(path.join(OUT, 'dragonborn-maske-coz-ozet.json'), JSON.stringify(ozet, null, 1) + '\n');
console.log(JSON.stringify(ozet, null, 1));
void characterTokenFile;
