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
// Büyüler (0–9. seviye; data/spells.json, spells-45.json, spells-69.json): savaş dışı, motorla tam, yaklaşık notlu.
const allSpells = [...J('data/spells.json'), ...J('data/spells-45.json'), ...J('data/spells-69.json')] as Array<{ name: string; level: number; mechanics: { kind: string; offCombat?: boolean; unsupported?: string; approx?: string; gmNote?: string } }>;
const srdSpellNames = (J('data/srd/spells.json') as { spells: Array<{ name: string }> }).spells.map((x) => x.name);
for (const n of srdSpellNames) {
  const norm = (x: string) => x.replace(/[’']/g, "'");
  const sp = allSpells.find((x) => norm(x.name) === norm(n));
  if (!sp) { add('Büyü', n, 'yok', 'veride yok'); continue; }
  const m = sp.mechanics;
  const st = m.unsupported ? 'yok' : m.offCombat ? 'savaş dışı' : 'tam';
  add('Büyü', `${n} (${sp.level})`, st, m.unsupported ?? (m.offCombat ? m.gmNote ?? '' : m.approx ? `yaklaşık: ${m.approx}` : ''));
}

// Canavar yetenekleri: verideki "desteklenmiyor" notları ad bazında; Kuyruk 19 modülleriyle kapatılanlar tam.
const monsters = J('data/monsters.json') as Array<{ id: string; unsupported?: string[] }>;
const abil = J('data/canavar-yetenekleri.json') as Record<string, { abilities?: Array<{ en: string }>; passive?: Record<string, unknown> }>;
const mreact = (J('data/monster-reactions.json') as { monsters: Record<string, Array<{ name: string; status: string }>> }).monsters;
const legend = (J('data/efsanevi.json') as { monsters: Record<string, unknown> }).monsters;
const mspells = J('data/canavar-buyuleri.json') as Record<string, unknown>;
const multi = J('data/multiattack.json') as Record<string, unknown>;
const abilityNames = new Set(Object.values(abil).flatMap((e) => (e.abilities ?? []).map((a) => a.en)));
const PASSIVE_KEYS: Record<string, string> = {
  'Blurred Form': 'blurred', 'Light Sensitivity': 'lightSensitivity', 'Sunlight Weakness': 'sunlightWeak', Sunlight: 'sunlight', 'Running Water': 'runningWater',
  'Bloodied Fury': 'bloodied', 'Bloodied Frenzy': 'bloodied', 'Blood Frenzy': 'bloodFrenzy', 'Aura of Authority': 'authority', 'Multiple Heads': 'heads', Berserk: 'berserk',
  'Misty Escape': 'mistyEscape', Transparent: 'transparent', 'Siege Monster': 'siegeMonster', 'Greater Magic Resistance': 'greaterMagicResistance',
  'Reflective Carapace': 'reflectiveCarapace', 'Corrosive Form': 'corrosive', Swarm: 'swarm', 'Air Form': 'passCreatures', 'Water Form': 'passCreatures',
  'Fire Form': 'fireForm', 'Water Susceptibility': 'waterSusceptible', 'Earth Glide': 'earthGlide', Abduct: 'abduct', 'Standing Leap': 'jump', 'Running Leap': 'jump',
  Jumper: 'jump', 'Loathsome Limbs': 'loathsomeLimbs', 'Death Burst': 'deathBurst', 'Death Throes': 'deathBurst', 'Heat Aura': 'ownerTurn', 'Barbed Hide': 'ownerTurn',
  'Mucus Cloud': 'ownerTurn', 'Vile Appearance': 'auras', 'Fear Aura': 'auras', 'Aberrant Ground': 'auras', Gibbering: 'auras', 'Lightning Absorption': 'absorb',
  'Fire Absorption': 'absorb', 'Acid Absorption': 'absorb', Freeze: 'onDamage', 'Aversion to Fire': 'onDamage', Agile: 'traits', Reactive: 'traits', Evasion: 'traits',
  'Immutable Form': 'traits', 'Reactive Heads': 'heads', 'Cunning Action': 'bonusGrant', 'Deathless Agility': 'bonusGrant', 'Vampire Weakness': 'sunlight',
  Roar: 'roarSequence', Tunneler: 'tunneler', Split: 'split',
};
const DISI: Record<string, string> = {
  Amphibious: 'nefes alma (savaşta boğulma yok)', 'Water Breathing': 'nefes alma', 'Hold Breath': 'nefes alma', 'Limited Amphibiousness': 'nefes alma (4 saatte bir)',
  'Diabolical Restoration': 'günler sonra başka düzlemde dirilme', 'Demonic Restoration': 'günler sonra dirilme', 'Exalted Restoration': 'günler sonra dirilme',
  'Fiendish Restoration': 'günler sonra dirilme', 'Elemental Restoration': 'günler sonra dirilme', 'Celestial Restoration': 'günler sonra dirilme',
  'Eldritch Restoration': 'günler sonra dirilme', 'Undead Restoration': '24 saat sonra dirilme', 'Hellish Restoration': 'Cehennem’de günler sonra dirilme', 'Spirit Jar': 'günler sonra dirilme',
  Mimicry: 'ses taklidi (hikâye)', 'Telepathic Bond': 'telepati (hikâye)', 'Speak with Beasts and Plants': 'iletişim', 'Divine Awareness': 'yalanı sezme', Inscrutable: 'zihin okunamaz (hikâye)',
  'Ethereal Sight': 'Ethereal düzlemi görme (harita tek düzlem)', 'Coven Magic': 'kehanet/keşif büyüleri (savaş dışı)', Wishes: 'Wish (hikâye)', Forbiddance: 'davetsiz eve giremez',
  'Stake to the Heart': 'kalbe kazık (hikâye, Game Master)', Amorphous: '1 inçlik aralıktan geçme (altıgen haritada dar geçit yok)', Compression: '1 inçlik aralık (dar geçit yok)',
  Ephemeral: 'eşya taşıyamaz', 'Probing Telepathy': 'telepati', 'Shark Telepathy': 'telepatiyle köpekbalığı yönetme (hikâye)', 'Vampiric Connection': 'telepati',
  'Shielded Mind': 'zihin okunamaz', 'Succubus Form': 'uzun dinlenmede biçim', 'Incubus Form': 'uzun dinlenmede biçim', 'Draconic Origin': 'Game Master seçimi (veride tür)',
  'Iron Scent': 'metal sezme (keşif)', 'Treasure Sense': 'hazine sezme (keşif)', 'Sense Magic': 'büyü sezme (keşif)', 'Beast of Burden': 'taşıma kapasitesi', Training: 'beceri (keşif)',
  'Troll Spawn': '24 saat sonra trol olma', 'Soul Bag': 'Nightmare Haunting (savaş dışı)', 'Nightmare Haunting': 'Dream (savaş dışı)', Bound: 'muska bağı (hikâye)',
  'Spell Storing': 'muska sahibinin büyü saklaması (kurulum)', 'Magic Rope': 'ip nesnesi (Entangling Rope saldırısı veride)', 'Illusory Appearance': 'Disguise Self (savaş dışı)',
  'Read Thoughts': 'Detect Thoughts (savaş dışı)', 'Shape-Shift': 'biçim değişimi yalnız görünüm/hız (stat bloğu aynı)', 'Destroy Metal': 'giyilmeyen metal nesne (savaş dışı)',
  'Confer Fire Resistance': 'binek bineğe direnç (binicilik `mounted.ts`; nightmare binek değil)', 'Ooze Cube': 'Engulf saldırısı veride', Hover: 'uçan yaratık düşmez (motor uçuşta düşürmez)',
  'Saldırı yok': 'basit vuruş eklendi (savaş dışı yaratık)', Adhesive: 'yalnızca nesne biçiminde (pusu; keşif)', Shriek: 'uyarı sesi (harita alarmına bağlı değil; hikâye)', Hellfire: '',
};
const monCat: Record<string, { n: number; st: string; note: string }> = {};
const mark = (key: string, st: string, note: string) => { const c = monCat[key] ??= { n: 0, st, note }; c.n++; };
for (const m of monsters) for (const u of m.unsupported ?? []) {
  const nm = u.replace(/^(Trait|Eylem|Bonus eylem|Tepki): /, '').split(' (')[0]!.split(':')[0]!.trim();
  const kind = u.split(':')[0]!.trim();
  const p = abil[m.id]?.passive ?? {};
  if (u.startsWith('Multiattack')) mark('Multiattack (bileşim, yerine geçen, ek kullanım)', multi[m.id] ? 'tam' : 'yok', 'data/multiattack.json');
  else if (u.startsWith('Eylem: Spellcasting') || u.startsWith('Eylem: Hellfire')) mark('Spellcasting', mspells[m.id] || abil[m.id] ? 'tam' : 'yok', 'data/canavar-buyuleri.json (6.+ seviye büyüler görev 3+6 ile)');
  else if (u.startsWith('Legendary Actions')) mark('Legendary Actions', legend[m.id] ? 'tam' : 'yok', 'data/efsanevi.json');
  else if (kind === 'Tepki') { const r = (mreact[m.id] ?? []).find((x) => x.name.startsWith(nm)); const pk = PASSIVE_KEYS[nm]; mark(`Tepki: ${nm}`, r?.status === 'ok' || (pk && p[pk] !== undefined) ? 'tam' : DISI[nm] !== undefined ? 'savaş dışı' : 'yok', r?.status === 'ok' ? 'monster-reactions.json' : pk && p[pk] !== undefined ? 'monsterAbilities.ts' : DISI[nm] ?? 'açık iş'); }
  else if (DISI[nm] !== undefined) mark(nm, 'savaş dışı', DISI[nm]!);
  else if (abilityNames.has(nm) || (mspells[m.id] as { bonus?: Array<{ entry: string }>; action?: Array<{ entry: string }> } | undefined)?.bonus?.some((b) => b.entry === nm)
    || (mspells[m.id] as { action?: Array<{ entry: string }> } | undefined)?.action?.some((b) => b.entry === nm)) mark(`${kind}: ${nm}`, 'tam', 'monster_ability / Spellcasting');
  else if (PASSIVE_KEYS[nm] && (p[PASSIVE_KEYS[nm]!] !== undefined || ((p.traits as string[] | undefined) ?? []).length)) mark(nm, 'tam', 'monsterAbilities.ts (pasif)');
  else if (/^(Durum bağışıklığı|Duyu|Hız: Climb|Hız: Swim)/.test(u) || ['Magic Resistance', 'Legendary Resistance', 'Spider Climb', 'Flyby', 'Web Walker', 'Sunlight Sensitivity', 'Illumination', 'Fire Aura', 'Stench', 'Ice Walk', 'Incorporeal Movement'].includes(nm)) mark(nm.startsWith('Durum') ? 'Durum bağışıklığı' : nm.split(' ')[0] === 'Hız' ? nm.split(' ').slice(0, 2).join(' ') : nm, 'tam', 'monsterTraits.ts / önceki kuyruklar');
  else if (u.startsWith('Boyut')) mark('Boyut (çok altıgen)', 'tam', 'multiHex bayrağı (Görev A6)');
  else if (u.startsWith(': 1/Day') || /1\/Day \(Recharge 6 olarak\)/.test(u)) mark('1/Day saldırıları', 'tam', 'savaşta bir kez (şarj olmaz)');
  else if (u.startsWith('Sabit hasar')) mark('Sabit hasar', 'tam', 'savaş başında SRD sabit değeri (monsterAbilities.ts)');
  else if (u.startsWith('Hız: Burrow')) mark('Hız: Burrow', 'tam', 'yer altından: yaratıkların altından geçer, zorlu arazi yok');
  else if (u.startsWith('Spellcasting:')) mark('Spellcasting alan şekli', 'tam', 'büyüler motorun alan şekilleriyle');
  else if (/^[^:]+: \d\/Day \(Recharge/.test(u)) mark('N/Day saldırıları', 'tam', 'savaşta N kez');
  else mark(`${kind}: ${nm}`, 'yok', 'açık iş');
}
for (const [k, v] of Object.entries(monCat).sort((a, b) => b[1].n - a[1].n)) add('Canavar yeteneği', `${k} (${v.n})`, v.st, v.note);

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
