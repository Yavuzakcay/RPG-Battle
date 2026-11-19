// SD9: Game Master kurulum ekranı denetim tablosu → harita/belgeler/SD9-KURULUM.md (veriden; elle düzenleme yerine bu betik).
// Çalıştırma: node scripts/sd9-kurulum-tablo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const rules = read('data/kural-kontrol.json').rules;
const house = read('data/ev-kurallari.json').rules;
const grp = read('data/kurulum-gruplari.json');
const gname = Object.fromEntries(grp.gruplar.map((g) => [g.id, g.tr]));
const cand = new Set(grp.kaldirmaAdayi);
const hid = new Set(grp.kurulumdaGizli ?? []);
const esc = (s) => String(s).replace(/\|/g, '\\|');

const L = [];
L.push('# SD9: Game Master kurulum ekranı denetimi ve yeni düzen', '');
L.push('Kullanıcı kararı: "10 yaşında bir çocuk anlasın". Yalnız arayüz: SD9 aşamasında hiçbir satır kaldırılmadı; SD9B ile 7 altyapı satırı kurulumdan gizlendi (bölüm 5); varsayılanlar, saklama anahtarları ve savaş kaydındaki değerler aynı. "Kaldırma adayı" işaretliler altyapı satırlarıdır; kullanıcı bu tablodan seçecek.', '');
L.push('Üretim: `node scripts/sd9-kurulum-tablo.mjs` (veri: `data/kural-kontrol.json`, `data/ev-kurallari.json`, `data/kurulum-gruplari.json`).', '');
L.push('## 1. Üst düzey satırlar', '');
L.push('| Satır | Saklama | Kim değiştirir | Yer |', '|---|---|---|---|');
const top = [
  ['Zar modu (otomatik / yalnızca oyuncular / herkes)', '`createMapBattle` `diceMode` (kayda yazılır)', 'Game Master', 'Üstte'],
  ['Yapay zekâ zorluğu: Parti', '`yz.zorluk.party`', 'Game Master', 'Üstte'],
  ['Yapay zekâ zorluğu: Düşmanlar', '`yz.zorluk.enemies`', 'Game Master', 'Üstte'],
  ['Hedefler (haritanın hedefleri, özel hedef)', '`goals`', 'Game Master', 'Üstte'],
  ['Oda kuralları: Taşıma yükü', '`rpg-battle-tasima`', 'Game Master', 'Üstte (SD8 katı)'],
  ['Oda kuralları: Alignment (+3 alt seçenek)', '`rpg-battle-deneysel.hizalanma*`', 'Game Master', 'Üstte (SD8 katı)'],
  ['Oda kuralları: Keşif modu', '`rpg-battle-onizleme.discovery`', 'Game Master', 'Üstte (SD8 katı)'],
  ['Oda kuralları: İpucu rozetleri', '`rpg-battle-onizleme.hints`', 'Game Master', 'Üstte (SD8 katı)'],
  ['Oda kuralları: Yolculuk (deneme)', '`rpg-battle-deneysel.yolculuk`', 'Game Master', 'Üstte (SD8 katı)'],
  ['Çok altıgenli yaratıklar (deneysel)', '`BattleState.multiHex`', 'Game Master', 'Gelişmiş'],
  ['Uyuyan gruplar (alarm durumu)', '`groupStates`', 'Game Master', 'Gelişmiş'],
  ['Ev kuralları (aşağıda 2.)', '`BattleState.houseRules`', 'Game Master', 'Gelişmiş'],
  ['Harita mekanikleri (aşağıda 3.)', '`map.ruleToggles` / `map.ruleParams`', 'Game Master', 'Gelişmiş'],
];
for (const r of top) L.push(`| ${r.map(esc).join(' | ')} |`);
L.push('', `## 2. Ev kuralları (${Object.keys(house).length})`, '');
L.push('| Kimlik | Ad | Varsayılan | Sefer | Yer |', '|---|---|---|---|---|');
for (const [id, d] of Object.entries(house)) L.push(`| \`${id}\` | ${esc(d.tr)} | ${d.default ? 'açık' : 'kapalı'} | ${d.sefer ? 'evet' : ''} | Gelişmiş > Ev kuralları${d.gizli ? ' (gizli)' : ''} |`);
L.push('', `## 3. Harita mekanikleri (${Object.keys(rules).length}; her haritada yalnız o haritayı ilgilendirenler görünür)`, '');
L.push('| Kimlik | Ad | Tür | Varsayılan | Grup | Kaldırma adayı |', '|---|---|---|---|---|---|');
for (const [id, d] of Object.entries(rules)) {
  const g = grp.kural[id] ?? 'harita';
  L.push(`| \`${id}\` | ${esc(d.tr)} | ${d.global ? 'global' : 'harita'} | ${d.default === false ? 'kapalı' : 'açık'} | ${gname[g]} | ${hid.has(id) ? '**SD9B: kurulumdan gizlendi**' : cand.has(id) ? '**kaldırma adayı** (Diğer\'de kaldı)' : ''} |`);
}
const counts = {};
for (const id of Object.keys(rules)) { const g = grp.kural[id] ?? 'harita'; counts[g] = (counts[g] ?? 0) + 1; }
L.push('', '## 4. Grup özeti', '');
L.push('| Grup | Kural sayısı |', '|---|---|');
for (const g of grp.gruplar) L.push(`| ${g.tr} | ${counts[g.id] ?? 0} |`);
L.push('', `Kaldırma adayı toplam: ${cand.size}; SD9B'de kurulumdan gizlenen: ${hid.size}; Gelişmiş > Diğer'de kalan: ${cand.size - hid.size}.`, '');
L.push('## 5. SD9B kararları (13 aday)', '', 'Ölçüt: kapatılınca oyunu bozuyor mu? Bozuyorsa altyapıdır ve kurulumdan gizlenir (varsayılan açık, kural ve eski kayıt aynı; `data/kural-kontrol.json` değişmedi). Küçük/isteğe bağlı davranış Gelişmiş > Diğer\'de kalır.', '');
L.push('| Kimlik | Karar | Gerekçe |', '|---|---|---|');
const why = {
  spells69: ['gizle', 'kapalıyken 6.–9. seviye büyüler savaşta çalışmaz'],
  srdK19: ['gizle', 'kapalıyken silah/zırh kalanları, sihirli eşyalar, binek ve canavar yetenekleri düşer'],
  spellsK19: ['gizle', 'kapalıyken 4–5. seviye büyülerin yan etkileri eksik kalır'],
  auraCore: ['gizle', 'kapalıyken aura tabanlı özellikler ve büyüler çalışmaz'],
  tempBarriers: ['gizle', 'kapalıyken geçici engel veren büyüler etkisiz'],
  objectMotion: ['gizle', 'kapalıyken nesne itme/fırlatma ve enkaz çalışmaz'],
  teleportArrival: ['gizle', 'kapalıyken ışınlanma varışında yüzey/tuzak/aura girişi atlanır'],
  freeHexTarget: ['Diğer\'de kal', 'yalnız boş altıgene atma kolaylığı; kapalıyken oyun bozulmaz'],
  heightShow: ['Diğer\'de kal', 'yalnız görünüm (yükseklik tonu)'],
  bardicInspirationFix: ['Diğer\'de kal', 'tek özelliğin düzeltmesi; kapalıyken eski davranış'],
  powerfulBuild: ['Diğer\'de kal', 'tek tür özelliği'],
  darkvisionRange: ['Diğer\'de kal', 'kapalıyken herkes 60 ft; oyun bozulmaz'],
  monsterDrain: ['Diğer\'de kal', 'kalıcı azaltma; kapalıyken yalnız o saldırılar hafifler'],
};
for (const id of grp.kaldirmaAdayi) L.push(`| \`${id}\` | ${why[id]?.[0] ?? '?'} | ${why[id]?.[1] ?? ''} |`);
L.push('');
fs.writeFileSync(path.join(root, 'harita/belgeler/SD9-KURULUM.md'), L.join('\n'));
console.log(`SD9-KURULUM.md: ${Object.keys(rules).length} mekanik, ${Object.keys(house).length} ev kuralı, ${cand.size} kaldırma adayı`);
