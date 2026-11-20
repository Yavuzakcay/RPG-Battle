/**
 * Görev D1 (SRD veri düzeltmeleri): SRD 5.2.1 canavar stat blokları → data/srd/monsters.json (elle düzenlenmez).
 * Kaynak `docs/SRD_CC_v5.2.1.pdf` "Monsters A–Z" ve "Animals" (s. 254–364); her kayıtta sayfa. PDF iki sütunlu okunur
 * (`scripts/srd/pdf.mjs` `readingLines`: sol sütun, sonra sağ). Kayıt: ad, boyut(lar), tür (+ etiket, sürü), hizalama,
 * AC, HP, hızlar (yürüme/uçma/yüzme/tırmanma/kazma, hover, not), duyular, yetenek puanları ve kurtarmalar, beceriler,
 * direnç, hasar ve durum bağışıklığı (SRD satırında `;` ile ayrılır; `;` yoksa sözcüklerden ayrılır), zayıflık, CR.
 *
 * Aynı çalıştırma bu tablodan iki oyun dosyasını da üretir (D1'den beri elle yazılmaz; test `src/data/srdCanavar.test.ts`):
 *   data/canavar-turleri.json  `types`: oyundaki her canavarın SRD yaratık türü (eski "temadan" listesi kaldırıldı)
 *   data/yuzme-hizi.json       `hiz`: yüzme hızı olan her canavarın SRD yüzme hızı ve sayfası
 * Eski (kural sürümü < 86) değerler `data/srd-duzeltme.json`'da; bu betik ona dokunmaz.
 * Çalıştırma: `npm run srd:canavar` (`--kuru`: yalnızca rapor, dosya yazılmaz).
 */
import fs from 'node:fs';
import { readingLines } from './srd/pdf.mjs';

const ROOT = new URL('../', import.meta.url);
const kuru = process.argv.includes('--kuru');
const SIZE = { Tiny: 'T', Small: 'S', Medium: 'M', Large: 'L', Huge: 'H', Gargantuan: 'G' };
const CONDS = ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];
const DMG = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const FIELDS = ['Skills', 'Resistances', 'Vulnerabilities', 'Immunities', 'Senses', 'Languages', 'Gear', 'CR'];
const HDR = /^((?:Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (?:Tiny|Small|Medium|Large|Huge|Gargantuan))*) (Swarm of (?:Tiny|Small) [A-Z][a-z]+|[A-Z][a-z]+)(?: \(([^)]*)\))?, (.+)$/;

const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const signed = (s) => Number(s.replace('−', '-'));
const problems = [];

function speeds(raw) {
  const out = {};
  for (const p of raw.replace(/^Speed /, '').split(',').map((x) => x.trim())) {
    const m = /^(?:(Burrow|Climb|Fly|Swim) )?(\d+) ft\.?( \(hover\))?(.*)$/.exec(p);
    if (!m) continue;
    const k = (m[1] ?? 'walk').toLowerCase();
    if (k in out) continue; // likantrop: "30 ft., 40 ft. (bear form only)" → ilk değer; not `raw`da
    out[k] = Number(m[2]);
    if (m[3]) out.hover = true;
  }
  // Swarm of Insects: "Climb or Fly 20 ft. (GM’s choice)"
  const either = /Climb or Fly (\d+) ft/.exec(raw);
  if (either) out.climbOrFly = Number(either[1]);
  return out;
}
function senses(raw = '') {
  const out = {};
  for (const k of ['Blindsight', 'Darkvision', 'Tremorsense', 'Truesight']) {
    const m = new RegExp(`${k} (\\d+) ft`).exec(raw);
    if (m) out[k.toLowerCase()] = Number(m[1]);
  }
  const p = /Passive Perception (\d+)/.exec(raw);
  if (p) out.passive = Number(p[1]);
  return out;
}
const dmgs = (raw = '') => DMG.filter((d) => new RegExp(`\\b${d}\\b`, 'i').test(raw));
const conds = (raw = '') => CONDS.filter((c) => new RegExp(`\\b${c}\\b`).test(raw));
/** "Fire, Poison; Charmed, Poisoned" → hasar + durum. `;` yoksa: yalnız durum adları varsa durum, yoksa hasar. */
function immunities(raw) {
  if (!raw) return { damage: [], conditions: [] };
  if (raw.includes(';')) {
    const [a, b] = raw.split(';');
    return { damage: dmgs(a), conditions: conds(b) };
  }
  const c = conds(raw);
  return c.length && !dmgs(raw).length ? { damage: [], conditions: c } : { damage: dmgs(raw), conditions: [] };
}

const lines = (await readingLines(254, 364)).filter((l) => !/^\d+ System Reference Document/.test(l.text));
const starts = [];
for (let i = 1; i < lines.length - 1; i++) if (HDR.test(lines[i].text) && /^AC \d/.test(lines[i + 1].text)) starts.push(i);
const monsters = {};
for (let b = 0; b < starts.length; b++) {
  const i = starts[b];
  const end = b + 1 < starts.length ? starts[b + 1] - 1 : lines.length;
  const name = lines[i - 1].text;
  const h = HDR.exec(lines[i].text);
  const swarm = h[2].startsWith('Swarm of ');
  const rec = {
    id: slug(name), name, page: lines[i].page,
    size: [...h[1].matchAll(/Tiny|Small|Medium|Large|Huge|Gargantuan/g)].map((m) => SIZE[m[0]]),
    type: (swarm ? h[2].split(' ').pop().replace(/s$/, '') : h[2]).toLowerCase(),
    ...(swarm ? { swarm: SIZE[h[2].split(' ')[2]] } : {}),
    ...(h[3] ? { tag: h[3] } : {}),
    alignment: h[4],
  };
  let j = i + 1;
  rec.ac = Number(/^AC (\d+)/.exec(lines[j].text)[1]);
  while (j < end && !/^HP /.test(lines[j].text)) j++;
  rec.hp = Number(/^HP (\d+)/.exec(lines[j].text)[1]);
  j++;
  const sp = [];
  while (j < end && !/^MOD SAVE/.test(lines[j].text)) sp.push(lines[j++].text);
  const speedRaw = sp.join(' ');
  rec.speed = speeds(speedRaw);
  if (/\(.*form only\)|GM’s choice|requires/.test(speedRaw)) rec.speedNote = speedRaw.replace(/^Speed /, '');
  j++;
  rec.abilities = {}; rec.saves = {};
  while (j < end && Object.keys(rec.abilities).length < 6) {
    // PDF yazım hatası: Young White Dragon "Int 6 −2 2" (kurtarma işaretsiz); sayı olduğu gibi okunur, raporda.
    for (const m of lines[j].text.matchAll(/(Str|Dex|Con|Int|Wis|Cha) (\d+) ([+−-]?\d+) ([+−-]?\d+)/gi)) {
      const k = m[1].toLowerCase();
      rec.abilities[k] = Number(m[2]);
      rec.saves[k] = signed(m[4]);
      if (!/^[+−-]/.test(m[4])) problems.push({ id: rec.id, what: `${m[1]} kurtarması işaretsiz basılmış: "${m[4]}" (değiştirici ${m[3]})` });
    }
    j++;
  }
  const f = {};
  let cur = null;
  for (; j < end; j++) {
    const t = lines[j].text;
    const k = FIELDS.find((x) => t.startsWith(`${x} `));
    if (k) { cur = k; f[k] = t.slice(k.length + 1); if (k === 'CR') break; } else if (cur) f[cur] += ` ${t}`;
  }
  rec.senses = senses(f.Senses);
  rec.skills = Object.fromEntries([...(f.Skills ?? '').matchAll(/([A-Z][a-z]+(?: of)?(?: [A-Z][a-z]+)*) ([+−-]\d+)/g)].map((m) => [m[1].toLowerCase().replace(/ (\w)/g, (_, c) => c.toUpperCase()), signed(m[2])]));
  rec.resistances = dmgs(f.Resistances);
  rec.vulnerabilities = dmgs(f.Vulnerabilities);
  const im = immunities(f.Immunities);
  rec.immunities = im.damage;
  rec.conditionImmunities = im.conditions;
  rec.cr = (/^(\d+(?:\/\d+)?)/.exec(f.CR ?? '') ?? [])[1] ?? null;
  rec.raw = { speed: speedRaw, ...(f.Senses ? { senses: f.Senses } : {}), ...(f.Resistances ? { resistances: f.Resistances } : {}), ...(f.Immunities ? { immunities: f.Immunities } : {}), ...(f.Vulnerabilities ? { vulnerabilities: f.Vulnerabilities } : {}) };
  if (Object.keys(rec.abilities).length < 6 || !rec.cr) problems.push({ id: rec.id, what: 'eksik alan (yetenek ya da CR)' });
  if (monsters[rec.id]) problems.push({ id: rec.id, what: 'yinelenen kimlik' });
  monsters[rec.id] = rec;
}

const game = JSON.parse(fs.readFileSync(new URL('data/monsters.json', ROOT), 'utf8'));
for (const g of game) if (!monsters[g.id]) problems.push({ id: g.id, what: 'oyundaki canavar SRD bloğunda bulunamadı' });
console.log(`${Object.keys(monsters).length} stat bloğu; oyundaki ${game.length} canavarın ${game.filter((g) => monsters[g.id]).length}'i eşleşti.`);
for (const p of problems) console.log(`  ⚠ ${p.id}: ${p.what}`);

const write = (rel, obj) => { if (!kuru) fs.writeFileSync(new URL(rel, ROOT), `${JSON.stringify(obj, null, 1)}\n`); };
write('data/srd/monsters.json', {
  _not: 'SRD 5.2.1 canavar stat blokları (docs/SRD_CC_v5.2.1.pdf s. 254–364); scripts/srd-canavar.mjs üretir (npm run srd:canavar), elle düzenlenmez.',
  sorunlar: problems, monsters,
});

const turPath = new URL('data/canavar-turleri.json', ROOT);
const oldTypes = JSON.parse(fs.readFileSync(turPath, 'utf8')).types;
const order = [...Object.keys(oldTypes), ...game.map((g) => g.id).filter((id) => !(id in oldTypes))];
write('data/canavar-turleri.json', {
  _aciklama: 'SRD 5.2.1 yaratık türü (Divine Smite, Protection from Evil and Good, Turn Undead, Wild Shape/Polymorph biçimleri…). Kaynak: her canavarın SRD stat bloğundaki tür satırı (sürüde "Swarm of Tiny Beasts" → beast); scripts/srd-canavar.mjs data/srd/monsters.json\'dan üretir (npm run srd:canavar), elle düzenlenmez. Görev D1 (kural sürümü 86): eski "temadan" listesi ve PDF\'ten kayan 19 kayıt düzeltildi; 85 ve altı savaşlar için eski türler data/srd-duzeltme.json\'da.',
  types: Object.fromEntries(order.filter((id) => monsters[id]).map((id) => [id, monsters[id].type])),
});
const swimmers = game.filter((g) => monsters[g.id]?.speed.swim).map((g) => g.id).sort();
write('data/yuzme-hizi.json', {
  _not: 'KQ6-8 (kural sürümü 82): yüzme hızı olan SRD canavarlarının yüzme hızı (ft); monsters.json\'da yalnız yürüme hızı var. Görev D1 (kural sürümü 86): değerler SRD 5.2.1 hız satırından; scripts/srd-canavar.mjs data/srd/monsters.json\'dan üretir (npm run srd:canavar), elle düzenlenmez; sayfa `sayfa`da. 85 ve altı savaşlar için eski (bellekten yazılmış) değerler data/srd-duzeltme.json\'da. Anahtarlar data/derin-su.json swimmers ∪ swimmers66 ile aynı küme (test).',
  hiz: Object.fromEntries(swimmers.map((id) => [id, monsters[id].speed.swim])),
  sayfa: Object.fromEntries(swimmers.map((id) => [id, monsters[id].page])),
});
if (kuru) console.log('(--kuru: dosya yazılmadı)');
