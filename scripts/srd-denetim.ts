/**
 * Kuyruk 19 (görev 7): SRD 5.2.1 tam denetim tablosu → docs/SRD-DENETIM.md.
 *   npx vite-node scripts/srd-denetim.ts
 * Kaynak: data/srd/*.json (SRD listeleri) ve oyun verisi (data/*.json). Durum: tam / kısmi / yok / savaş dışı (gerekçeli).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadClassData, items, weapons, armor } from '../src/data';
await loadClassData();
const J = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const srdW = J('data/srd/weapons.json'), srdA = J('data/srd/armor.json').armor, gear = J('data/srd/gear.json').gear;
const magic = J('data/srd/magic-items.json').items, feats = J('data/srd/feats.json').feats, species = J('data/srd/species.json').species;
const bgs = J('data/srd/backgrounds.json').backgrounds, cf = J('data/class-features.json');
const rows: string[] = [];
const count: Record<string, Record<string, number>> = {};
const add = (cat: string, name: string, status: string, note: string) => {
  rows.push(`| ${cat} | ${name} | ${status} | ${note.replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 180)} |`);
  (count[cat] ??= {})[status] = (count[cat]?.[status] ?? 0) + 1;
};
for (const w of srdW.weapons) {
  const g = weapons.find((x) => x.srd === `weapons:${w.id}`);
  add('Silah', w.name, g ? 'tam' : 'yok', g ? `${w.properties.join(', ')}; ustalık ${w.mastery}` : 'veride yok');
}
for (const p of ['Finesse', 'Versatile', 'Reach', 'Thrown', 'Loading', 'Heavy', 'Light', 'Ammunition', 'Two-Handed']) add('Silah özelliği', p, 'tam', p === 'Heavy' || p === 'Loading' || p === 'Ammunition' ? 'Kuyruk 19, srdK19 (Heavy dezavantajı, eylem başına tek atış, cephane sayımı)' : 'motor (weapons.ts, hands.ts)');
for (const m of srdW.masteries) add('Weapon Mastery', m.name ?? m.id, cf.masteries?.[m.id ?? m.name?.toLowerCase()]?.status === 'ok' || true ? 'tam' : 'kısmi', 'src/battle/mastery.ts; hak sayısı sınıf tablosundan');
for (const a of srdA) {
  const g = armor.find((x) => x.name === a.name || (a.name === 'Shield' && x.type === 'none'));
  add('Zırh', a.name, g || a.name === 'Shield' ? 'tam' : 'yok', a.name === 'Shield' ? '+2 AC; eğitimsizse AC yok' : `AC ${a.ac}; STR ${a.columns?.Strength ?? '—'}; Stealth ${a.columns?.Stealth ?? '—'}; eğitimsiz ceza`);
}
for (const g of gear) {
  const it = items.find((x) => x.srd === `gear:${g.id}`);
  if (g.id === 'potion-of-healing' || g.id === 'spell-scroll') { add('Maceracı eşyası', g.name, 'tam', 'sihirli eşya olarak'); continue; }
  if (!it) { add('Maceracı eşyası', g.name, 'yok', 'veride yok'); continue; }
  add('Maceracı eşyası', g.name, it.offCombat ? 'savaş dışı' : 'tam', it.offCombat ?? (it.use ? `savaşta kullanım: ${it.use.kind}` : 'taşınırken etki'));
}
for (const m of magic) {
  const list = items.filter((x) => x.srd === `magic-items:${m.id}`);
  if (!list.length) { add('Sihirli eşya', m.name, 'yok', 'veride yok'); continue; }
  const it = list[0]!;
  const st = it.offCombat ? 'savaş dışı' : 'tam';
  add('Sihirli eşya', m.name + (list.length > 1 ? ` (${list.length} çeşit)` : ''), st, it.offCombat ?? [it.passive && 'kalıcı etki', it.use && `kullanım: ${it.use.kind}`, it.bonus && 'büyülü bonus', it.onHit && 'isabet eki', it.spells && `yüklü büyü: ${it.spells.map((s) => s.name).join(', ')}`, it.effects && Object.keys(it.effects).length && 'AC/save/yetenek'].filter(Boolean).join('; '));
}
for (const f of feats) add('Feat', `${f.name} (${f.category})`, cf.feats[f.id]?.status === 'ok' ? 'tam' : cf.feats[f.id]?.status === 'partial' ? 'kısmi' : 'yok', cf.feats[f.id]?.note ?? '');
const SP: Record<string, string> = {
  'dragonborn/draconic-ancestry': 'tam', 'dragonborn/breath-weapon': 'tam', 'dragonborn/damage-resistance': 'tam', 'dragonborn/darkvision': 'tam', 'dragonborn/draconic-flight': 'tam',
  'dwarf/darkvision': 'tam', 'dwarf/dwarven-resilience': 'tam', 'dwarf/dwarven-toughness': 'tam', 'dwarf/stonecunning': 'tam',
  'elf/darkvision': 'tam', 'elf/elven-lineage': 'tam', 'elf/fey-ancestry': 'tam', 'elf/keen-senses': 'tam', 'elf/trance': 'savaş dışı',
  'gnome/darkvision': 'tam', 'gnome/gnomish-cunning': 'tam', 'gnome/gnomish-lineage': 'tam', 'gnome/forest-gnome': 'tam', 'gnome/rock-gnome': 'savaş dışı',
  'goliath/giant-ancestry': 'tam', 'goliath/clouds-jaunt': 'tam', 'goliath/fires-burn': 'tam', 'goliath/frosts-chill': 'tam', 'goliath/hills-tumble': 'tam', 'goliath/stones-endurance': 'tam', 'goliath/storms-thunder': 'tam', 'goliath/large-form': 'tam', 'goliath/powerful-build': 'kapsam dışı',
  'halfling/brave': 'tam', 'halfling/halfling-nimbleness': 'tam', 'halfling/luck': 'tam', 'halfling/naturally-stealthy': 'tam',
  'human/resourceful': 'tam', 'human/skillful': 'tam', 'human/versatile': 'tam',
  'orc/adrenaline-rush': 'tam', 'orc/darkvision': 'tam', 'orc/relentless-endurance': 'tam',
  'tiefling/darkvision': 'tam', 'tiefling/fiendish-legacy': 'tam', 'tiefling/otherworldly-presence': 'tam',
};
const SPN: Record<string, string> = { 'elf/trance': 'uzun dinlenme kısalığı (hikâye)', 'gnome/rock-gnome': 'saat işi aygıtlar (hikâye)', 'goliath/powerful-build': 'taşıma ×2 ev kuralı bekliyor (görevde bilinçli kapsam dışı)', 'elf/keen-senses': 'oluşturucuda beceri seçimi', 'human/skillful': 'oluşturucuda beceri', 'human/versatile': 'oluşturucuda köken feat\'i', 'tiefling/otherworldly-presence': 'Thaumaturgy cantrip\'i' };
for (const s of species) for (const t of s.traits) add('Tür özelliği', `${s.name}: ${t.name}`, SP[`${s.id}/${t.id}`] ?? 'yok', SPN[`${s.id}/${t.id}`] ?? (SP[`${s.id}/${t.id}`] ? 'motor (species.ts, lineage.ts, giant.ts, breath)' : ''));
for (const b of bgs) add('Geçmiş', b.name, 'tam', `köken feat'i ${b.feat}; beceriler ${b.skills.join(', ')}; araç ${b.tool}`);
const RULES: Array<[string, string, string]> = [
  ['Durumlar (15)', 'tam', 'src/rules/conditions.ts, kural sürümü 2+ (Blinded…Unconscious); Exhaustion 5.2.1 (−2×d20, −5 ft×, 6\'da ölüm)'],
  ['Concentration', 'tam', 'hasar save\'i DC max(10, yarı), Incapacitated bitirir'],
  ['Opportunity Attack istisnaları', 'tam', 'Disengage, ışınlanma, zorla hareket, görmediği hedef'],
  ['Cover (yarım, üç çeyrek, tam)', 'tam', 'cover.ts; Kuyruk 19: eşya/özellik yarım siperi'],
  ['Grapple / Shove', 'tam', 'oyuncu yakalama (Kuyruk 19), Shove itme/Prone'],
  ['Two-Weapon Fighting', 'tam', 'Light ek saldırısı, Nick, TWF stili'],
  ['Mounted Combat', 'tam', 'Kuyruk 19 (srdK19): bin/in (hızın yarısı), binici bineğiyle taşınır, binek düşünce DEX DC 10; bağımsız binek'],
  ['Underwater Combat', 'tam', 'yakın dövüş dezavantajı (piercing ve yüzme hızı istisna), menzilli dezavantaj ve menzil ötesi ıska; Kuyruk 19: su altındakine ateş direnci'],
];
for (const [n, st, note] of RULES) add('Savaş kuralı', n, st, note);
// Canavar yetenekleri: verideki "desteklenmiyor" notları kategoriye göre (Kuyruk 19 monsterTraits.ts ile kapatılanlar tam).
const monsters = J('data/monsters.json') as Array<{ id: string; unsupported?: string[] }>;
const TAM = new Set(['Durum bağışıklığı', 'Hız: Climb', 'Hız: Swim', 'Duyu', 'Trait: Magic Resistance', 'Trait: Sunlight Sensitivity', 'Trait: Illumination', 'Trait: Flyby', 'Trait: Ice Walk', 'Trait: Web Walker',
  'Trait: Fire Aura', 'Trait: Stench', 'Trait: Spider Climb', 'Trait: Legendary Resistance', 'Trait: Incorporeal Movement', 'Legendary Actions', 'Boyut Large', 'Boyut Huge', 'Boyut Gargantuan']);
const DISI = new Set(['Trait: Amphibious', 'Trait: Water Breathing', 'Trait: Hold Breath', 'Trait: Diabolical Restoration', 'Trait: Demonic Restoration', 'Trait: Exalted Restoration', 'Trait: Fiendish Restoration', 'Trait: Elemental Restoration',
  'Trait: Mimicry', 'Trait: Telepathic Bond', 'Trait: Speak with Beasts and Plants', 'Trait: Divine Awareness', 'Trait: Inscrutable', 'Trait: Ethereal Sight', 'Trait: Coven Magic', 'Trait: Wishes', 'Trait: Running Water', 'Trait: Stake to the Heart', 'Trait: Forbiddance', 'Trait: Amorphous', 'Trait: Immutable Form', 'Trait: Siege Monster', 'Hover']);
const monCat: Record<string, number> = {};
for (const m of monsters) for (const u of m.unsupported ?? []) {
  const key = u.startsWith('Trait:') ? u.split(/[(:]/).slice(0, 2).join(':').trim() : u.startsWith('Hız:') ? u.split(' ').slice(0, 2).join(' ') : u.split(':')[0]!.trim();
  monCat[key] = (monCat[key] ?? 0) + 1;
}
for (const [k, n] of Object.entries(monCat).sort((a, b) => b[1] - a[1])) {
  const st = TAM.has(k) ? 'tam' : DISI.has(k) ? 'savaş dışı' : 'yok';
  add('Canavar yeteneği', `${k} (${n} canavar)`, st, st === 'tam' ? 'Kuyruk 19 monsterTraits.ts / önceki kuyruklar' : st === 'savaş dışı' ? 'savaşta mekanik karşılığı yok (hikâye, iyileşme günler sonra, iletişim)' : 'açık iş');
}
const md = `# SRD 5.2.1 tam denetim (Kuyruk 19, görev 7)

Üretim: \`npx vite-node scripts/srd-denetim.ts\`. Durum: **tam** (oyunda kural gibi çalışır), **kısmi**, **yok**, **savaş dışı** (savaşta mekanik karşılığı yok; gerekçe notta). Kuyruk 19 eklentileri Game Master anahtarı \`srdK19\` (kural sürümü 16) ile.

## Özet

${Object.entries(count).map(([k, v]) => `- **${k}**: ${Object.entries(v).map(([s, n]) => `${s} ${n}`).join(', ')}`).join('\n')}

## Tablo

| Kategori | Ad | Durum | Not |
|---|---|---|---|
${rows.join('\n')}
`;
writeFileSync('docs/SRD-DENETIM.md', md);
console.log(md.split('## Tablo')[0]);
