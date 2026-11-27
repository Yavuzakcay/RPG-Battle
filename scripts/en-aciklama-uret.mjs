/**
 * İngilizce açıklamalar (Görev EN-ACIKLAMA): data/aciklamalar-tr.json'daki her kaydın İngilizce karşılığını üretir.
 *   data/aciklamalar-en.json          : buyu, esya, tur, yetenek, altsinif, invocation, buyuSecenek, durum
 *   data/aciklamalar-en-canavar.json  : canavar (yalnız Dungeondex `loadDexExtras` yükler)
 * Kaynak önceliği:
 *   1. SRD 5.2.1 İngilizce metni (docs/SRD_CC_v5.2.1.pdf: data/srd/*.json ya da PDF'in kendisi), yalnız oyun mekaniği SRD
 *      ile aynıysa. Oyunun farklı çalıştığı kayıtta SRD metni + "Differs in game: …" notu (`scripts/en-aciklama/ceviri.json`
 *      `farklar`).
 *   2. SRD karşılığı olmayan (ya da birden çok oyun kaydının paylaştığı) kayıt: elle çeviri (`ceviri.json` `ceviri`).
 * Elle çeviri her zaman önceliklidir ve betik onu hiç değiştirmez; betik deterministiktir, tekrar çalıştırılabilir.
 * Büyü betimlemelerinin `en` alanı doğrudan data/buyu-betimleme.json'da (elle; betik dokunmaz, yalnız sayar).
 * Çalıştırma: node scripts/en-aciklama-uret.mjs [--eksik]   (--eksik: çevirisi bekleyen kimlikleri yazdırır)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readingLines } from './srd/pdf.mjs';

// Windows: `URL.pathname` "/D:/..." verir; dosya yolları hep `fileURLToPath` + `node:path` ile.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const at = (p) => path.join(ROOT, p);
/** Hata verip çıkar (hiçbir çıktı yazılmaz). */
const dur = (msg) => { console.error(`en-aciklama-uret: ${msg} Hiçbir dosya yazılmadı.`); process.exit(1); };
const read = (p) => {
  try { return JSON.parse(fs.readFileSync(at(p), 'utf8')); } catch (e) { return dur(`${p} okunamadı (${e.message}).`); }
};
const TR = read('data/aciklamalar-tr.json');
const SRC = read('scripts/en-aciklama/ceviri.json');
const CEVIRI = SRC.ceviri ?? {};
const FARK = SRC.farklar ?? {};
const KINDS = ['buyu', 'esya', 'tur', 'yetenek', 'altsinif', 'invocation', 'buyuSecenek', 'durum'];

const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** PDF/JSON metnini tek biçime getirir: satır sonu tireleri, fazla boşluk; paragraflar "\n". */
const clean = (s) => s.replace(/\r/g, '').replace(/ ([,.;:)])/g, '$1').replace(/\( /g, '(').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();

// --- PDF bölümleri: h12 başlığından sonraki gövde satırları (bir sonraki başlığa dek). ---
const HEAD = new Set(['h12', 'h14', 'h18', 'h26', 'cap']);
const lines = (await readingLines(1, 253)).filter((l) => !/^\d+ System Reference Document/.test(l.text));
function joinLines(ls) {
  let out = '';
  let prereq = false;
  for (const l of ls) {
    const t = l.text;
    // Ön koşul satırı (italik, birden çok satır sürebilir) ayrı paragraf: "Prerequisite: …" + "\n" + gövde.
    const endPrereq = prereq && l.spans[0].kind !== 'bodyI';
    if (endPrereq) prereq = false;
    const lead = ['bodyBI', 'bodyB'].includes(l.spans[0].kind) || t.startsWith('•') || endPrereq || t.startsWith('Prerequisite:');
    if (t.startsWith('Prerequisite:')) prereq = true;
    if (!out) out = t;
    else if (lead) out += `\n${t}`;
    else if (/[a-z]-$/.test(out) && /^[a-z]/.test(t)) out = out.slice(0, -1) + t;
    else if (/—$/.test(out)) out += t;
    else out += ` ${t}`;
  }
  return clean(out);
}
/** `name` başlıklı bölümün gövdesi (`from` sayfasından sonra ilk eşleşme); `after` verilirse o satırdan sonrası. */
function section(name, { from = 1, after } = {}) {
  const i = lines.findIndex((l) => l.page >= from && l.kind === 'h12' && l.text.replace(/\s+/g, ' ').trim() === name);
  if (i < 0) return undefined;
  let j = i + 1;
  const end = (() => { let k = j; while (k < lines.length && !HEAD.has(lines[k].kind)) k++; return k; })();
  if (after) {
    const a = lines.slice(j, end).findIndex((l) => after.test(l.text));
    if (a >= 0) j += a + 1;
  }
  return joinLines(lines.slice(j, end)) || undefined;
}

// --- SRD JSON kayıtları. ---
const srdSpells = new Map(read('data/srd/spells.json').spells.map((s) => [s.id, s]));
const srdMagic = new Map(read('data/srd/magic-items.json').items.map((s) => [s.id, s]));
const srdGear = new Map(read('data/srd/gear.json').gear.map((s) => [s.id, s]));
const srdSpecies = new Map(read('data/srd/species.json').species.map((s) => [s.id, s]));
const srdClasses = new Map(read('data/srd/classes.json').classes.map((c) => [c.id, c]));
const gameSpells = [...read('data/spells.json'), ...read('data/spells-45.json'), ...read('data/spells-69.json')];
const gameItems = new Map([...read('data/items-srd.json'), ...read('data/items.json')].map((i) => [i.id, i]));
const itemRefCount = new Map();
for (const i of gameItems.values()) itemRefCount.set(i.srd, (itemRefCount.get(i.srd) ?? 0) + 1);
const CONDITIONS = { exhaustion: 'Exhaustion' };

const spellFallback = [];
/** Büyünün SRD açıklaması (yapım satırlarından sonra; "Using a Higher-Level Spell Slot" dahil). */
function spellText(id) {
  const g = gameSpells.find((s) => s.id === id);
  const s = g && srdSpells.get(g.srd.split(':')[1]);
  if (!s) return undefined;
  const pdf = section(s.name, { from: 100, after: /^Duration:/ });
  const head = clean(s.text).slice(0, 40);
  if (pdf && pdf.startsWith(head.slice(0, 25))) return pdf;
  spellFallback.push(id);
  return clean(s.text);
}
function itemText(id) {
  const g = gameItems.get(id);
  if (!g || (itemRefCount.get(g.srd) ?? 0) > 1) return undefined;
  const [file, sid] = g.srd.split(':');
  const s = file === 'magic-items' ? srdMagic.get(sid) : file === 'gear' ? srdGear.get(sid) : undefined;
  return s?.text ? clean(s.text) : undefined;
}
function traitText(id) {
  const [sp, tr] = id.split('/');
  const t = srdSpecies.get(sp)?.traits.find((x) => x.id === tr);
  return t?.text ? clean(t.text) : undefined;
}
function featureText(key) {
  const [cls, fid] = key.split(':');
  const fs2 = (srdClasses.get(cls)?.features ?? []).filter((f) => f.id === fid).sort((a, b) => a.level - b.level);
  if (!fs2.length) return undefined;
  return fs2.length === 1 ? clean(fs2[0].text) : fs2.map((f) => `Level ${f.level}: ${clean(f.text)}`).join('\n');
}
const title = (id) => id.split('-').map((w, i) => (i > 0 && ['of', 'the', 'and', 'with'].includes(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
const invocationNames = new Map(Object.values(read('data/class-features.json').features).flatMap((m) => (m.invocations ?? []).map((v) => [v.id, v.name.replace(/'/g, '’')])));
const invocationText = (id) => section(invocationNames.get(id) ?? title(id), { from: 60 });
const conditionText = (id) => section(`${CONDITIONS[id] ?? title(id)} [Condition]`, { from: 170 });

const SRD = { buyu: spellText, esya: itemText, tur: traitText, yetenek: featureText, altsinif: () => undefined, invocation: invocationText, buyuSecenek: () => undefined, durum: conditionText };

// --- Canavar: scripts/srd-canavar-ozellik.mjs --metin (aynı ayrıştırıcı; canavar-ozellik.json'u aynen yeniden yazar). ---
const tmp = path.join(os.tmpdir(), `en-canavar-${process.pid}.json`);
let monsterSrd;
try {
  execFileSync(process.execPath, [path.join(HERE, 'srd-canavar-ozellik.mjs'), '--metin', tmp], { stdio: ['ignore', 'ignore', 'pipe'] });
  monsterSrd = JSON.parse(fs.readFileSync(tmp, 'utf8'));
} catch (e) {
  dur(`canavar SRD metni üretilemedi ya da okunamadı (scripts/srd-canavar-ozellik.mjs: ${String(e.stderr ?? e.message).trim().split('\n')[0]}).`);
} finally {
  try { fs.unlinkSync(tmp); } catch { /* yoksa */ }
}
if (!monsterSrd || typeof monsterSrd !== 'object' || Object.keys(monsterSrd).length === 0) dur('canavar SRD metni boş geldi.');
const monsterText = (key) => {
  const [mon, k] = [key.slice(0, key.indexOf('/')), key.slice(key.indexOf('/') + 1)];
  const e = monsterSrd[mon]?.entries.find((x) => x.key === k);
  return e?.text ? clean(e.text) : undefined;
};

// --- Birleştir. ---
const kaynak = {};
const missing = [];
function build(kind, getter, extra = []) {
  const out = {};
  kaynak[kind] = { srd: 0, ceviri: 0, fark: 0, eksik: 0 };
  for (const id of [...new Set([...Object.keys(TR[kind] ?? {}), ...extra])].sort()) {
    const manual = CEVIRI[kind]?.[id];
    const note = FARK[`${kind}/${id}`];
    let text;
    if (manual) { text = manual; kaynak[kind].ceviri++; }
    else {
      const s = getter(id);
      if (s) { text = s; kaynak[kind].srd++; } else { kaynak[kind].eksik++; missing.push(`${kind}/${id}`); continue; }
    }
    if (note) { text = `${text}\nDiffers in game: ${note}`; kaynak[kind].fark++; }
    out[id] = text;
  }
  return out;
}
const en = { _aciklama: "English descriptions (task EN-ACIKLAMA): same kinds and ids as data/aciklamalar-tr.json. Generated by `node scripts/en-aciklama-uret.mjs` from the SRD 5.2.1 text (data/srd/*.json and docs/SRD_CC_v5.2.1.pdf) and the hand translations in scripts/en-aciklama/ceviri.json; do not edit by hand. Monster entries live in data/aciklamalar-en-canavar.json." };
// Invocation: TR dosyasındaki 4 kayıt + oyunun bütün Invocation'ları (Dungeondex açıklaması TR'de oyun notundan; EN'de SRD).
const invocationIds = Object.values(read('data/class-features.json').features).flatMap((m) => (m.invocations ?? []).map((v) => v.id));
// Eşya: TR dosyasında olmayan ama oyun verisinde Türkçe kısa notu olan eşyalar (kartta etki özeti yoksa bu not gösterilir;
// EN arayüzde SRD metni).
const turkishNoteItems = [...gameItems.values()].filter((i) => !TR.esya?.[i.id] && /[çşğıöüÇŞĞİÖÜ]/.test(i.text ?? '')).map((i) => i.id);
for (const k of KINDS) en[k] = build(k, SRD[k], k === 'invocation' ? invocationIds : k === 'esya' ? turkishNoteItems : []);
// Canavar kimlikleri Türkçe canavar dosyasından (canavar açıklamaları aciklamalar-tr.json'dan ayrıldı; oradan okununca 0 kayıt
// çıkıp boş dosya yazılıyordu).
const canavar = build('canavar', monsterText, Object.keys(read('data/aciklamalar-tr-canavar.json').canavar ?? {}));
en._kaynak = Object.fromEntries(KINDS.map((k) => [k, kaynak[k]]));
const mon = { _aciklama: 'English monster trait/action descriptions (key `<monster>/<kind>:<slug>`, list data/canavar-ozellik.json); SRD 5.2.1 text, generated by `node scripts/en-aciklama-uret.mjs`. Loaded only by the Dungeondex (`loadDexExtras`).', _kaynak: { canavar: kaynak.canavar }, canavar };
// Boş çıktı koruması: kayıt sayısı 0 olan dosya yazılmaz (mevcut dolu dosyanın üstüne boş içerik gelmesin). Önce hepsi
// denetlenir, sonra yazılır (yarım yazım olmasın).
const sayEn = KINDS.reduce((n, k) => n + Object.keys(en[k]).length, 0);
const sayCanavar = Object.keys(canavar).length;
if (sayEn === 0) dur('data/aciklamalar-en.json için üretilen kayıt sayısı 0.');
if (sayCanavar === 0) dur('data/aciklamalar-en-canavar.json için üretilen kayıt sayısı 0.');
// Düşme koruması: mevcut dosyada olup yeni çıktıda olmayan kayıt varsa yazılmaz (ör. scripts/katalog-f2-kadim.mjs'in aynı
// dosyaya eklediği SRD dışı canavar kayıtları; birleştirme kuralı karar bekliyor, DECISIONS EN-ACIKLAMA-YOL).
const dusen = (rel, eski, yeni) => {
  let mevcut;
  try { mevcut = JSON.parse(fs.readFileSync(at(rel), 'utf8')); } catch { return; } // dosya yoksa düşen de yok
  const kayip = eski(mevcut).filter((k) => !yeni.has(k));
  if (kayip.length) dur(`${rel}: ${kayip.length} mevcut kayıt yeni çıktıda yok (ör. ${kayip.slice(0, 3).join(', ')}).`);
};
dusen('data/aciklamalar-en.json', (m) => KINDS.flatMap((k) => Object.keys(m[k] ?? {}).map((id) => `${k}/${id}`)), new Set(KINDS.flatMap((k) => Object.keys(en[k]).map((id) => `${k}/${id}`))));
dusen('data/aciklamalar-en-canavar.json', (m) => Object.keys(m.canavar ?? {}), new Set(Object.keys(canavar)));
fs.writeFileSync(at('data/aciklamalar-en.json'), `${JSON.stringify(en, null, 1)}\n`);
fs.writeFileSync(at('data/aciklamalar-en-canavar.json'), `${JSON.stringify(mon, null, 1)}\n`);
console.log(`yazıldı: aciklamalar-en.json ${sayEn} kayıt, aciklamalar-en-canavar.json ${sayCanavar} kayıt`);
const bet = read('data/buyu-betimleme.json');
const betEn = Object.entries(bet).filter(([k, v]) => !k.startsWith('_') && v?.en).length;
console.log(JSON.stringify({ ...en._kaynak, canavar: kaynak.canavar, betimlemeEn: betEn, buyuPdfYok: spellFallback }));
if (process.argv.includes('--eksik')) console.log(missing.join('\n'));
