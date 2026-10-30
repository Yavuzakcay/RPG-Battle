// Görev S1: SRD 5.2.1 0–3. seviye büyü denetimi → docs/harita/BUYU-DENETIMI.md; Görev K14: 4–5. seviye → BUYU-DENETIMI-4-5.md.
// Durum data/spells.json'dan: tam (mekanik var, sapma notu yok), kısmi (`approx` notu ya da elle uygulanan
// tepki dışı yardımcı), yok (kayıt yok, `unsupported`, ya da yalnızca "elle uygulanır"). Eksik sistem: elle
// atanmış (MANUAL) yoksa SRD metninden anahtar sözcüklerle tahmin. Çalıştırma: node scripts/buyu-denetimi.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srd = JSON.parse(fs.readFileSync(path.join(root, 'data/srd/spells.json'), 'utf8')).spells;
const game = JSON.parse(fs.readFileSync(path.join(root, 'data/spells.json'), 'utf8'));
const byId = new Map(game.map((s) => [s.srd, s]));

/** Eksik sistem adları (B grubu görevlerinin kaynağı). */
const SYS = {
  teleport: 'ışınlanma', fly: 'uçuş', light: 'aydınlatma/karanlık', zone: 'kalıcı zemin etkisi', wall: 'geçici engel hex\'i',
  push: 'itme/çarpma', size: 'boyut', detect: 'algılama/bilgi', illusion: 'yanılsama', offcombat: 'savaş dışı (mekân/zaman)',
  object: 'nesne etkileşimi', control: 'zihin kontrolü/davranış', terrainShape: 'zemin şekillendirme', summon: 'çağırma',
  reaction: 'tepki tetiği', ongoing: 'süreli tekrar (tur başı/sonu)', heal: 'iyileştirme', buff: 'süren etki', misc: 'özel mekanik',
};
/** Elle atanan eksik sistemler (anahtar sözcük tahmini yetmeyenler). */
const MANUAL = {
  'spells:darkness': 'light', 'spells:light': 'light', 'spells:dancing-lights': 'light', 'spells:daylight': 'light', 'spells:faerie-fire': 'light',
  'spells:fog-cloud': 'zone', 'spells:web': 'zone', 'spells:grease': 'zone', 'spells:spike-growth': 'zone', 'spells:sleet-storm': 'zone', 'spells:stinking-cloud': 'zone',
  'spells:moonbeam': 'zone', 'spells:silence': 'zone', 'spells:hunger-of-hadar': 'zone', 'spells:plant-growth': 'zone', 'spells:cloud-of-daggers': 'zone',
  'spells:wind-wall': 'wall', 'spells:blade-ward': 'buff', 'spells:mirror-image': 'illusion', 'spells:blur': 'buff', 'spells:blink': 'offcombat',
  'spells:enlarge-reduce': 'size', 'spells:gust-of-wind': 'push', 'spells:thunderwave': 'push', 'spells:gaseous-form': 'fly', 'spells:levitate': 'fly', 'spells:fly': 'fly',
  'spells:misty-step': 'teleport', 'spells:dimension-door': 'teleport', 'spells:magic-circle': 'offcombat', 'spells:counterspell': 'reaction', 'spells:dispel-magic': 'misc',
  'spells:bestow-curse': 'misc', 'spells:remove-curse': 'misc', 'spells:hypnotic-pattern': 'control', 'spells:fear': 'control', 'spells:confusion': 'control',
  'spells:suggestion': 'control', 'spells:command': 'control', 'spells:charm-person': 'control', 'spells:animal-friendship': 'control', 'spells:calm-emotions': 'control',
  'spells:heat-metal': 'ongoing', 'spells:acid-arrow': 'ongoing', 'spells:melfs-acid-arrow': 'ongoing', 'spells:call-lightning': 'ongoing', 'spells:flaming-sphere': 'ongoing',
  'spells:beacon-of-hope': 'buff', 'spells:protection-from-energy': 'buff', 'spells:haste': 'buff', 'spells:slow': 'buff', 'spells:true-strike': 'buff',
  'spells:conjure-animals': 'summon', 'spells:animate-dead': 'summon', 'spells:find-familiar': 'summon', 'spells:find-steed': 'summon', 'spells:spiritual-weapon': 'summon',
  'spells:shillelagh': 'buff', 'spells:mage-hand': 'object', 'spells:spare-the-dying': 'heal', 'spells:lesser-restoration': 'heal', 'spells:revivify': 'heal',
  'spells:mass-healing-word': 'heal', 'spells:sleep': 'control', 'spells:hideous-laughter': 'control', 'spells:mirror-image ': 'illusion',
  // Görev B1: savaş dışı olanlar ve sınırdakiler (Alter Self özel mekanik, Flaming Sphere kalıcı nesne → B2–B5).
  'spells:create-or-destroy-water': 'offcombat', 'spells:rope-trick': 'offcombat', 'spells:nondetection': 'offcombat',
  'spells:alter-self': 'misc', 'spells:flaming-sphere': 'zone', 'spells:ensnaring-strike': 'ongoing', 'spells:ray-of-enfeeblement': 'ongoing',
  'spells:hold-person': 'ongoing', 'spells:blindness-deafness': 'ongoing', 'spells:vampiric-touch': 'heal',
  // Görev B2: yanlış sınıflanmış savaş dışı/algılama büyüleri; çağırmayla yürüyen alanlar.
  'spells:message': 'offcombat', 'spells:detect-magic': 'detect', 'spells:zone-of-truth': 'offcombat', 'spells:speak-with-plants': 'offcombat',
  'spells:conjure-animals': 'summon', 'spells:fog-cloud': 'zone', 'spells:grease': 'zone', 'spells:silence': 'zone', 'spells:sleet-storm': 'zone',
  // Görev B3: savaşta mekanik karşılığı olmayan yanılsama ve yardımcılar (Game Master'a not).
  'spells:minor-illusion': 'offcombat', 'spells:prestidigitation': 'offcombat', 'spells:disguise-self': 'offcombat', 'spells:unseen-servant': 'offcombat',
  'spells:arcanists-magic-aura': 'offcombat', 'spells:silent-image': 'offcombat', 'spells:major-image': 'offcombat',
  'spells:phantasmal-force': 'illusion', 'spells:suggestion': 'control',
};

function guess(s) {
  const t = `${s.text} ${s.higherLevel ?? ''}`.toLowerCase();
  const ct = (s.castingTime ?? '').toLowerCase();
  if (/minute|hour/.test(ct) || s.ritual && !/action/.test(ct)) return 'offcombat';
  if (/teleport/.test(t)) return 'teleport';
  if (/fly speed|you can fly|flying/.test(t)) return 'fly';
  if (/\bwall\b|barrier/.test(t)) return 'wall';
  if (/darkness|bright light|dim light|sheds light/.test(t)) return 'light';
  if (/difficult terrain|starts (its|their) turn in|enters the (area|spell)|for the duration.*area|area.*for the duration/.test(t)) return 'zone';
  if (/pushed|push (it|the target|each)|knocked/.test(t)) return 'push';
  if (/illusion|illusory|image of/.test(t)) return 'illusion';
  if (/\bsize\b|larger|smaller/.test(t)) return 'size';
  if (/charmed|frightened|command|obey/.test(t)) return 'control';
  if (/detect|sense|you learn|you know|telepathic|scrying|aware of/.test(t)) return 'detect';
  if (/object|door|lock|rope|water|food/.test(t)) return 'object';
  if (/reaction/.test(ct)) return 'reaction';
  if (/regain.*hit points/.test(t)) return 'heal';
  if (/each of your turns|start of each of its turns|end of each of its turns/.test(t)) return 'ongoing';
  return 'misc';
}

const rows = [];
for (const s of srd.filter((x) => x.level <= 3).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
  const id = `spells:${s.id}`;
  const g = byId.get(id);
  const m = g?.mechanics;
  let status; let note = '';
  if (!g) { status = 'yok'; note = 'oyunda kayıt yok'; }
  else if (m.unsupported) { status = 'yok'; note = m.unsupported; }
  else if (m.offCombat) { status = 'savaş dışı'; note = `Game Master'a not: ${m.gmNote ?? ''}`; }
  else if (m.kind === 'utility' && !m.reaction && !g.utilityHandled) { status = 'yok'; note = 'yalnızca günlüğe yazılır ("etki elle uygulanır")'; }
  else if (m.approx) { status = 'kısmi'; note = m.approx; }
  else status = 'tam';
  const sys = status === 'tam' || status === 'savaş dışı' ? '' : SYS[MANUAL[id] ?? guess(s)];
  rows.push({ level: s.level, name: s.name, id: s.id, status, sys, note, kind: m?.kind ?? '' });
}
const count = (st) => rows.filter((r) => r.status === st).length;
const bySys = {};
for (const r of rows.filter((x) => x.status !== 'tam' && x.status !== 'savaş dışı')) bySys[r.sys] = (bySys[r.sys] ?? 0) + 1;
const out = [];
out.push('# Büyü denetimi: SRD 5.2.1, 0–3. seviye (Görev S1, B1, B2, B3, B4)', '');
out.push('`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`\'dan üretilir (elle düzenleme; betiği çalıştır). Durum: **tam** (mekanik var, sapma notu yok), **kısmi** (oyunda var, SRD\'den sapma `approx` notunda), **savaş dışı** (Görev B4: kartta "savaş dışı" etiketi, yapınca Game Master\'a not; savaşta simüle edilmez), **yok** (kayıt yok, `unsupported` ya da yalnızca "etki elle uygulanır"). "Eksik sistem" kısmi ve yok büyülerde hangi motor parçasının eksik olduğu; B grubu ve sınıf görevlerinin kaynağı. Sınıf listesi SRD\'den, büyü sınıftan bağımsız hazırlanır.', '');
out.push(`**Özet:** ${rows.length} büyü — tam ${count('tam')}, kısmi ${count('kısmi')}, savaş dışı ${count('savaş dışı')}, yok ${count('yok')}.`, '');
out.push('| Eksik sistem | Büyü sayısı (kısmi + yok) |', '|---|---:|');
for (const [k, v] of Object.entries(bySys).sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${v} |`);
out.push('');
for (const lv of [0, 1, 2, 3]) {
  const list = rows.filter((r) => r.level === lv);
  const n = (st) => list.filter((r) => r.status === st).length;
  out.push(`## ${lv === 0 ? 'Cantrip (0)' : `${lv}. seviye`} — tam ${n('tam')}, kısmi ${n('kısmi')}, savaş dışı ${n('savaş dışı')}, yok ${n('yok')}`, '');
  out.push('| Büyü | Kimlik | Durum | Eksik sistem | Not |', '|---|---|---|---|---|');
  for (const r of list) out.push(`| ${r.name} | \`spells:${r.id}\` | ${r.status} | ${r.sys} | ${r.note.replace(/\|/g, '/')} |`);
  out.push('');
}
fs.writeFileSync(path.join(root, 'docs/harita/BUYU-DENETIMI.md'), out.join('\n'));
console.log(`tam ${count('tam')}, kısmi ${count('kısmi')}, savaş dışı ${count('savaş dışı')}, yok ${count('yok')}`, bySys);

// ------------------------------------------------------------------ Görev K14: 4–5. seviye (Aşama 2 boyutu)
// Yalnızca denetim: oyun verisine dokunmaz. Durum yukarıdaki kuralla (oyunda kayıt yoksa "yok"). Kayıt olmayan büyüler için
// "iş türü" elle sınıflandı: not (savaş dışı, yalnızca Game Master notu), veri (mevcut motorla yalnızca spells.json kaydı),
// ek (mevcut sistem + küçük motor eki), yeni (yeni motor sistemi). Çıktı docs/harita/BUYU-DENETIMI-4-5.md.
const WORK = { not: 'savaş dışı (yalnızca not)', veri: 'mevcut sistemle (yalnızca veri)', ek: 'mevcut sistem + küçük ek', yeni: 'yeni sistem' };
const SYS45 = {
  offcombat: 'savaş dışı (mekân/zaman/bilgi)', area: 'alan/save hasarı', buff: 'süren etki', zone: 'kalıcı zemin etkisi', summon: 'çağırma',
  control: 'zihin kontrolü', heal: 'iyileştirme', ongoing: 'süreli tekrar (tur başı/sonu)', wall: 'geçici engel (duvar)', shape: 'biçim değiştirme',
  banish: 'sürgün (savaştan geçici çıkış)', dominate: 'tam yönetim (taraf değiştirme)', prison: 'hapsetme (geçilmez küre)', move: 'nesne/yaratık taşıma (telekinezi)',
  teleport: 'ışınlanma', illusion: 'yanılsama (yönetilen ikiz)', disease: 'uzun süreli hastalık (ikinci aşama)',
};
const M45 = {
  'animate-objects': ['ek', 'summon', 'Animated Object stat bloğu, sayı slotla (Animate Dead `count` gibi); boyuta göre birleştirme yok'],
  'antilife-shell': ['ek', 'zone', 'yürüyen alan (bağlı yaratık + yarıçap); yaratığın girişini engelleme (iten engel) yok'],
  'arcane-eye': ['not', 'offcombat', 'keşif gözü; savaşta etkisiz'],
  'arcane-hand': ['ek', 'summon', 'Large el: Clenched Fist (5d8), Forceful Hand (itme), Grasping Hand (yakalama), Interposing Hand (siper); bonus eylemle taşıma (`ownerBonus`)'],
  'aura-of-life': ['veri', 'buff', 'yürüyen alan: Necrotic direnç, 0 HP\'deki dosta tur başı 1 HP; HP maksimumu düşürme yok'],
  'awaken': ['not', 'offcombat', '8 saat'],
  'banishment': ['yeni', 'banish', 'hedef savaştan geçici çıkar, konsantrasyon bitince döner (1 dakika sürerse yerli olmayan kalıcı); `gone` benzeri durum + dönüş konumu'],
  'black-tentacles': ['veri', 'zone', 'Entangle/Web gibi: zorlu arazi, giriş/tur başı DEX save → Restrained + 3d6 Bludgeoning, `escapeCheck`'],
  'blight': ['veri', 'area', '8d8 Necrotic CON (tek hedef); Plant yaratığa dezavantaj ve en yüksek hasar küçük ek (`onlyTypes` benzeri)'],
  'charm-monster': ['veri', 'control', 'Charm Person ile aynı (`charm`, `breakOnDamage: casterSide`), tür sınırı yok; yukarı slotta hedef'],
  'cloudkill': ['ek', 'zone', 'zone: 5d8 Poison CON, yoğun örtü; bulutun her tur 10 ft uzaklaşması (alan kayması) yok'],
  'commune': ['not', 'offcombat', 'ritüel, bilgi'],
  'commune-with-nature': ['not', 'offcombat', 'ritüel, bilgi'],
  'compulsion': ['ek', 'control', 'Command\'ın zorlama hareketi (`compelEvents`), yönü büyücü her tur bonus eylemle seçer'],
  'cone-of-cold': ['veri', 'area', 'oyunda var'],
  'confusion': ['ek', 'control', 'd10 davranış tablosu (rastgele hareket, tur kaybı, rastgele saldırı) + tur sonu save'],
  'conjure-elemental': ['ek', 'summon', 'dokunulamaz büyük ruh: bitişik yaratığa save → Restrained + 8d8 elementel hasar (yürüyen alan + yakalama)'],
  'conjure-minor-elementals': ['ek', 'buff', 'yürüyen alan zorlu arazi + büyücünün saldırılarına 2d8 ek hasar (Divine Favor gibi)'],
  'conjure-woodland-beings': ['veri', 'zone', 'Spirit Guardians benzeri yürüyen alan (5d8 Force WIS); bonus eylemle Disengage'],
  'contact-other-plane': ['not', 'offcombat', 'ritüel, bilgi'],
  'contagion': ['yeni', 'disease', 'Poisoned, üç başarısız save\'e dek; sonra 7 gün süren etki (ikinci aşama / lanet sistemi yok)'],
  'control-water': ['not', 'offcombat', 'çoğu etki savaş dışı (sel, su yarma); girdap Game Master notu'],
  'creation': ['not', 'offcombat', '1 dakika'],
  'death-ward': ['ek', 'buff', 'ilk 0 HP\'ye düşüşte 1 HP\'de kalır (tek kullanım; Relentless Endurance yolu)'],
  'dimension-door': ['veri', 'teleport', 'Misty Step yolu (`teleport`), 500 ft; bir dost birlikte (iki yaratık ışınlanması küçük ek)'],
  'dispel-evil-and-good': ['ek', 'buff', 'türlere dezavantaj Protection from Evil and Good (`wardedFrom`) ile; Break Enchantment ve Dismissal (sürgün) yok'],
  'divination': ['not', 'offcombat', 'ritüel, bilgi'],
  'dominate-beast': ['yeni', 'dominate', 'Charmed hedefi büyücünün oyuncusu yönetir (taraf değiştirme), hasar alınca yeniden save (`damageSave`)'],
  'dominate-person': ['yeni', 'dominate', 'Dominate Beast ile aynı, Humanoid'],
  'dream': ['not', 'offcombat', '1 dakika'],
  'fabricate': ['not', 'offcombat', '10 dakika'],
  'faithful-hound': ['ek', 'summon', 'dokunulamaz bekçi (`intangible`): 30 ft içindeki düşmana tur başı 4d8 Piercing saldırı'],
  'fire-shield': ['ek', 'buff', 'Cold/Fire direnç + yakın dövüşte vurana 2d8 (tepkisiz karşılık; Retaliation yolu) ve ışık (`light`)'],
  'flame-strike': ['veri', 'area', 'silindir (küre sayılır) 5d6 Fire + 5d6 Radiant (iki hasar türü küçük ek)'],
  'freedom-of-movement': ['ek', 'buff', 'zorlu arazi yok sayma, hız düşürme / Paralyzed / Restrained bağışıklığı, 5 ft hareketle yakalamadan kurtulma'],
  'geas': ['not', 'offcombat', '1 dakika'],
  'giant-insect': ['veri', 'summon', 'summons.json stat bloğu (centipede / spider / wasp), slotla ölçek'],
  'greater-invisibility': ['veri', 'buff', 'Invisible; saldırınca bitmez (Invisibility\'deki `breakOnAct` yok)'],
  'greater-restoration': ['ek', 'heal', 'Exhaustion −1, Charmed/Petrified, lanet, yetenek ve HP maksimumu azalması (`cure` genişletme)'],
  'guardian-of-faith': ['ek', 'zone', 'sabit alan: 10 ft içine giren / turunu bitiren düşmana 20 Radiant DEX; toplam 60 hasarda biter (hasar sayacı)'],
  'hallow': ['not', 'offcombat', '24 saat'],
  'hallucinatory-terrain': ['not', 'offcombat', '10 dakika'],
  'hold-monster': ['veri', 'ongoing', 'Hold Person ile aynı (Paralyzed, `repeatSave`), tür sınırı yok'],
  'ice-storm': ['veri', 'area', '2d10 Bludgeoning + 4d6 Cold DEX; alan tur sonuna dek zorlu arazi (zone, iki hasar türü küçük ek)'],
  'insect-plague': ['veri', 'zone', 'zone: 4d10 Piercing CON, zorlu arazi, hafif örtü'],
  'legend-lore': ['not', 'offcombat', '10 dakika'],
  'locate-creature': ['not', 'offcombat', 'bilgi'],
  'mass-cure-wounds': ['veri', 'heal', 'Mass Healing Word gibi `healTargets` (6), 5d8 + değiştirici'],
  'mislead': ['yeni', 'illusion', 'Invisible + büyücünün yönettiği dokunulamaz ikiz; görüşü ikizden'],
  'modify-memory': ['not', 'offcombat', 'sosyal'],
  'passwall': ['not', 'offcombat', 'duvarda geçit (haritada duvar delme yok)'],
  'phantasmal-killer': ['veri', 'ongoing', 'WIS save → Frightened + tur sonu 4d10 Psychic (`repeatSave` + `ongoing`); ilk save dezavantajlı d20 Testleri'],
  'planar-binding': ['not', 'offcombat', '1 saat'],
  'polymorph': ['ek', 'shape', 'Wild Shape biçim altyapısı (`shape_changed`) başka hedefe: geçici HP biçimin HP\'si, 0\'da biter; düşman hedefte WIS save'],
  'private-sanctum': ['not', 'offcombat', '10 dakika'],
  'raise-dead': ['not', 'offcombat', '1 saat'],
  'reincarnate': ['not', 'offcombat', '1 saat'],
  'resilient-sphere': ['yeni', 'prison', 'hedef hareket edemez; içeri/dışarı saldırı ve hasar geçmez (geçilmez küre)'],
  'scrying': ['not', 'offcombat', '10 dakika'],
  'secret-chest': ['not', 'offcombat', 'eşya'],
  'seeming': ['not', 'offcombat', 'görünüm'],
  'stone-shape': ['not', 'offcombat', 'taş şekillendirme (haritada zemin değişimi yok)'],
  'stoneskin': ['veri', 'buff', 'Bludgeoning/Piercing/Slashing direnç (`resist`)'],
  'summon-dragon': ['veri', 'summon', 'oyunda var'],
  'telekinesis': ['yeni', 'move', 'her tur eylemle yaratık taşıma (STR yarışı) ve Restrained; nesneler'],
  'telepathic-bond': ['not', 'offcombat', 'ritüel, iletişim'],
  'teleportation-circle': ['not', 'offcombat', '1 dakika'],
  'tree-stride': ['ek', 'teleport', 'ağaç altıgenleri arası ışınlanma (haritada ağaç zemini)'],
  'vitriolic-sphere': ['veri', 'area', '10d4 Acid DEX + tur sonu 5d4 gecikmeli (`delayed`)'],
  'wall-of-fire': ['ek', 'wall', 'duvar biçimi (`wall`) + bir yüzden 5d8 Fire, giriş ve tur sonu tetiği'],
  'wall-of-force': ['yeni', 'wall', 'geçilmez görünmez duvar / kubbe: hareket ve saldırı engeli, Disintegrate dışında yok edilemez'],
  'wall-of-stone': ['yeni', 'wall', 'kalıcı taş altıgenler (yıkılabilir parçalar): harita zemini değişir, görüş ve hareket engeli'],
};
{
  const rows45 = [];
  for (const s of srd.filter((x) => x.level === 4 || x.level === 5).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
    const id = `spells:${s.id}`;
    const g = byId.get(id);
    const m = g?.mechanics;
    let status;
    if (!g) status = 'yok';
    else if (m.unsupported) status = 'yok';
    else if (m.offCombat) status = 'savaş dışı';
    else if (m.approx) status = 'kısmi';
    else status = 'tam';
    const man = M45[s.id];
    if (!man) throw new Error(`K14: ${s.id} sınıflanmamış`);
    const [work, sys, note] = man;
    rows45.push({ level: s.level, name: s.name, id: s.id, status, work: status === 'tam' ? '—' : work, sys: SYS45[sys], note, classes: s.classes ?? [],
      conc: !!s.concentration, time: s.castingTime });
  }
  const c45 = (st) => rows45.filter((r) => r.status === st).length;
  const open = rows45.filter((r) => r.status !== 'tam');
  const byWork = {}; const bySys45 = {};
  for (const r of open) { byWork[r.work] = (byWork[r.work] ?? 0) + 1; if (r.work !== 'not') bySys45[r.sys] = (bySys45[r.sys] ?? 0) + 1; }
  const o = [];
  o.push('# Büyü denetimi: SRD 5.2.1, 4–5. seviye (Görev K14; Aşama 2 boyutu)', '');
  o.push('`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`\'dan üretilir (0–3. seviye denetimiyle aynı betik; elle düzenleme, betiği çalıştır). **Yalnızca denetim:** oyun verisine büyü eklenmedi. Durum 0–3. seviyedeki kuralla (oyunda kayıt yoksa **yok**). "İş türü" kaydı olmayan büyülerin Aşama 2\'deki tahmini işi (elle sınıflandı): **savaş dışı** (yalnızca kart etiketi ve Game Master notu), **mevcut sistemle** (yalnızca `spells.json` kaydı; motor hazır), **küçük ek** (mevcut sisteme küçük motor eki), **yeni sistem**.', '');
  o.push(`**Özet:** ${rows45.length} büyü (4. seviye ${rows45.filter((r) => r.level === 4).length}, 5. seviye ${rows45.filter((r) => r.level === 5).length}) — tam ${c45('tam')}, kısmi ${c45('kısmi')}, savaş dışı ${c45('savaş dışı')}, yok ${c45('yok')}. Oyunda olanlar: ${rows45.filter((r) => r.status !== 'yok').map((r) => r.name).join(', ')}.`, '');
  o.push('| İş türü | Büyü |', '|---|---:|');
  for (const k of ['not', 'veri', 'ek', 'yeni']) o.push(`| ${WORK[k]} | ${byWork[k] ?? 0} |`);
  o.push('', '**Gereken motor sistemleri** (savaş dışı olanlar hariç; büyü sayısı):', '', '| Sistem | Büyü | Büyüler |', '|---|---:|---|');
  for (const [k, v] of Object.entries(bySys45).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    o.push(`| ${k} | ${v} | ${open.filter((r) => r.work !== 'not' && r.sys === k).map((r) => r.name).join(', ')} |`);
  }
  o.push('', '**Yeni sistemler** (Aşama 2\'nin en büyük işi): ' + Object.entries(bySys45).filter(([k]) => open.some((r) => r.sys === k && r.work === 'yeni')).map(([k]) => k).join('; ') + '.', '');
  for (const lv of [4, 5]) {
    const list = rows45.filter((r) => r.level === lv);
    o.push(`## ${lv}. seviye — ${list.length} büyü`, '');
    o.push('| Büyü | Kimlik | Durum | İş türü | Sistem | Konsantrasyon | Not |', '|---|---|---|---|---|---|---|');
    for (const r of list) o.push(`| ${r.name} | \`spells:${r.id}\` | ${r.status} | ${r.work === '—' ? '—' : WORK[r.work]} | ${r.sys} | ${r.conc ? 'evet' : ''} | ${r.note.replace(/\|/g, '/')} |`);
    o.push('');
  }
  o.push('## Sınıflara göre', '', 'SRD sınıf listeleri; parantez içinde iş türü kısaltması (n: savaş dışı, v: mevcut sistemle, e: küçük ek, y: yeni sistem, ✓: oyunda).', '');
  o.push('| Sınıf | 4. seviye | 5. seviye |', '|---|---|---|');
  const classesAll = [...new Set(rows45.flatMap((r) => r.classes))].sort();
  const tag = (r) => (r.status === 'yok' ? { not: 'n', veri: 'v', ek: 'e', yeni: 'y' }[r.work] : '✓');
  for (const c of classesAll) {
    const cell = (lv) => rows45.filter((r) => r.level === lv && r.classes.includes(c)).map((r) => `${r.name} (${tag(r)})`).join(', ');
    o.push(`| ${c} | ${cell(4)} | ${cell(5)} |`);
  }
  o.push('');
  fs.writeFileSync(path.join(root, 'docs/harita/BUYU-DENETIMI-4-5.md'), o.join('\n'));
  console.log(`4–5: ${rows45.length} büyü; tam ${c45('tam')}, kısmi ${c45('kısmi')}, savaş dışı ${c45('savaş dışı')}, yok ${c45('yok')}`, byWork);
}
