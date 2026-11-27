// Görev KATALOG-F2: Kadim Yaratıklar ve Mücevher Ejderhası verisi (21 stat bloğu) + Dungeondex açıklamaları.
// Kaynak: "Dice & Hex — Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu" PDF (depo dışı, docs/katalog/).
// Çalıştırma: node scripts/katalog-f2-kadim.mjs   (tekrar çalıştırılabilir; aynı çıktıyı üretir)
// Yazar:  data/canavarlar-kadim.json (Monster kayıtları + Dungeondex yan tabloları + saldırı ekleri),
//         data/aciklamalar-tr-canavar.json ve data/aciklamalar-en-canavar.json (yalnız bu kimliklerin anahtarları),
//         data/efsanevi.json (yalnız bu kimliklerin efsanevi eylem kayıtları).
// Güçler PDF'ten birebir; PDF'in vermediği değerler (mücevher ejderhası Rend/hız/kurtarma, Yavru evresinin tamamı…)
// SRD 5.2.1 ejderha kalıbından türetilir ve harita/belgeler/KATALOG-F2-PROSPEKTUS.md'de işaretlidir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (p) => path.join(ROOT, p);

// ------------------------------------------------------------------ mücevher hatları (TEK YER)
// Kullanıcı kararı (KATALOG-F2): hat adları bizim. Omega/Sigma/Gamma nefes türleri ÖNERİDİR: değiştirmek için yalnız
// `hasar` alanını değiştirip betiği yeniden çalıştırın (kayıt, bağışıklık, nefes adı ve açıklamalar buradan üretilir).
const HATLAR = {
  sigma: {
    ad: { tr: 'Sigma', en: 'Sigma' }, tas: { tr: 'Altın', en: 'gold' }, hasar: 'radiant', oneri: true,
    hizalanma: 'Chaotic Neutral', eksen: { tr: 'Kaotik Tarafsız (Umut / Özgürlük)', en: 'Chaotic Neutral (Hope / Freedom)' },
    baskin: ['cha', 'dex'], beceriler: ['Persuasion', 'Performance', 'Acrobatics'],
    yavru: { cr: '6' },
    genc: { cr: '15', ac: 19, hp: 240, nefes: { yetenek: 'con', dc: 19, zar: '10d8' } },
    yetiskin: { cr: '25', ac: 22, hp: 480, nefes: { yetenek: 'con', dc: 23, zar: '16d10' } },
  },
  omega: {
    ad: { tr: 'Omega', en: 'Omega' }, tas: { tr: 'Yakut', en: 'ruby' }, hasar: 'necrotic', oneri: true,
    hizalanma: 'Chaotic Neutral', eksen: { tr: 'Kaotik Tarafsız (Entropi / Yalnızlık)', en: 'Chaotic Neutral (Entropy / Solitude)' },
    baskin: ['con', 'cha'], beceriler: ['Survival', 'Intimidation', 'Sleight of Hand'],
    yavru: { cr: '7' },
    genc: { cr: '16', ac: 19, hp: 265, nefes: { yetenek: 'con', dc: 20, zar: '11d8' } },
    yetiskin: { cr: '26', ac: 23, hp: 515, nefes: { yetenek: 'con', dc: 24, zar: '17d10' } },
  },
  delta: {
    ad: { tr: 'Delta', en: 'Delta' }, tas: { tr: 'Zümrüt', en: 'emerald' }, hasar: 'psychic', oneri: false,
    hizalanma: 'Lawful Neutral', eksen: { tr: 'Yasal Tarafsız (Gizem / Kontrol)', en: 'Lawful Neutral (Mystery / Control)' },
    baskin: ['int', 'wis'], beceriler: ['Investigation', 'Deception', 'History', 'Stealth'],
    yavru: { cr: '8' },
    genc: { cr: '17', ac: 20, hp: 285, nefes: { yetenek: 'int', dc: 20, zar: '11d8' } },
    yetiskin: { cr: '27', ac: 23, hp: 545, nefes: { yetenek: 'int', dc: 24, zar: '18d10' } },
  },
  alpha: {
    ad: { tr: 'Alfa', en: 'Alpha' }, tas: { tr: 'Safir', en: 'sapphire' }, hasar: 'thunder', oneri: false,
    hizalanma: 'Lawful Neutral', eksen: { tr: 'Yasal Tarafsız (Savaş / Strateji)', en: 'Lawful Neutral (War / Strategy)' },
    baskin: ['str', 'con'], beceriler: ['Athletics', 'Intimidation', 'Medicine'],
    yavru: { cr: '9' },
    genc: { cr: '18', ac: 20, hp: 310, nefes: { yetenek: 'con', dc: 21, zar: '12d8' } },
    yetiskin: { cr: '28', ac: 24, hp: 585, nefes: { yetenek: 'con', dc: 25, zar: '19d10' } },
  },
  gamma: {
    ad: { tr: 'Gamma', en: 'Gamma' }, tas: { tr: 'Gümüş', en: 'silver' }, hasar: 'force', oneri: true,
    hizalanma: 'True Neutral', eksen: { tr: 'Gerçek Tarafsız (Kozmik Denge)', en: 'True Neutral (Cosmic Balance)' },
    baskin: ['wis', 'int'], beceriler: ['Insight', 'Perception', 'Arcana', 'Religion'],
    yavru: { cr: '10' },
    genc: { cr: '20', ac: 21, hp: 340, nefes: { yetenek: 'str', dc: 22, zar: '12d8' } },
    yetiskin: { cr: '30', ac: 25, hp: 650, nefes: { yetenek: 'str', dc: 26, zar: '20d10' } },
  },
};

// Hatta bağlı PDF metinleri (nefes ekleri, binek bağı, 20 nitelik pasifi, boss sinerjisi). Nefes türünden bağımsız yazıldı.
const HAT_METIN = {
  sigma: {
    gencEk: { tr: 've 1 tur Blinded olur', en: 'and has the Blinded condition for 1 round' },
    yetiskinEk: { tr: 've 1 tur Blinded olur', en: 'and has the Blinded condition for 1 round' },
    yetiskinSonra: { tr: 'Alandaki dostlar 30 geçici can kazanır.', en: 'Allies in the area gain 30 Temporary Hit Points.' },
    bag: { tr: 'Binicisine bu hattın hasar türüne direnç ve uzun dinlenmede 2 kez d20 yeniden attırma verir.', en: 'Grants its rider Resistance to this line\'s damage type and lets it reroll a d20 twice per Long Rest.' },
    pasif: { tr: 'Taşıyıcının CHA puanı 20 olunca: 60 ft içindeki dostlar Blinded ve Charmed durumlarına bağışık olur.', en: 'When the carrier\'s Charisma is 20: allies within 60 feet are immune to the Blinded and Charmed conditions.' },
    sinerji: { tr: 'Al-İha Mora\'nın gölge perdesini dağıtır.', en: 'Dispels Al-İha Mora\'s veil of shadow.' },
    riderGenc: { conditions: [{ condition: 'Blinded', owner: 'target', end: 'turnEnd', rounds: 1 }] },
    riderYetiskin: { conditions: [{ condition: 'Blinded', owner: 'target', end: 'turnEnd', rounds: 1 }] },
  },
  omega: {
    gencEk: { tr: 've 1 tur iyileşemez', en: 'and can\'t regain Hit Points for 1 round' },
    yetiskinEk: { tr: ', 1 tur iyileşemez ve en yüksek canı aldığı hasar kadar düşer', en: ', can\'t regain Hit Points for 1 round, and its Hit Point maximum decreases by the damage taken' },
    bag: { tr: 'Binicisine bu hattın hasar türüne direnç verir; binicinin darbesi hedefin iyileşmesini engeller.', en: 'Grants its rider Resistance to this line\'s damage type; the rider\'s hits stop the target from healing.' },
    pasif: { tr: 'Taşıyıcının CON puanı 20 olunca: düşen her rakipten 25 geçici can kazanır ve rakibin yenilenmesini kilitler.', en: 'When the carrier\'s Constitution is 20: gains 25 Temporary Hit Points from each foe that falls and locks the foe\'s regeneration.' },
    sinerji: { tr: 'Kaltakkıran\'ın iyileşmesini keser.', en: 'Cuts off Kaltakkıran\'s healing.' },
    riderYetiskin: { drainMax: {} },
  },
  delta: {
    gencEk: { tr: 've sonraki zarlarından 1d6 düşer', en: 'and subtracts 1d6 from its next rolls' },
    yetiskinEk: { tr: ', 1 tur Stunned olur ve bütün dirençlerini 1 tur kaybeder', en: ', has the Stunned condition for 1 round, and loses all its Resistances for 1 round' },
    bag: { tr: 'Binicisine bu hattın hasar türüne direnç ve tuzak ile illüzyonlara karşı avantaj verir.', en: 'Grants its rider Resistance to this line\'s damage type and Advantage against traps and illusions.' },
    pasif: { tr: 'Taşıyıcının INT puanı 20 olunca: 60 ft içindeki görünmezleri ve illüzyonları açığa çıkarır, saldırılarına +1d8 psişik hasar ekler.', en: 'When the carrier\'s Intelligence is 20: reveals invisible creatures and illusions within 60 feet, and its attacks deal an extra 1d8 Psychic damage.' },
    sinerji: { tr: 'Tarvok\'un ana kilidi.', en: 'The master key against Tarvok.' },
    riderYetiskin: { conditions: [{ condition: 'Stunned', owner: 'target', end: 'turnEnd', rounds: 1 }] },
  },
  alpha: {
    gencEk: { tr: ', 15 ft itilir ve Prone olur', en: ', is pushed 15 feet, and has the Prone condition' },
    yetiskinEk: { tr: ', 30 ft itilir, Prone olur ve konsantrasyonu bozulur', en: ', is pushed 30 feet, has the Prone condition, and loses Concentration' },
    bag: { tr: 'Binicisine bu hattın hasar türüne direnç verir; tepkisiyle bir müttefik saldırısı yapar.', en: 'Grants its rider Resistance to this line\'s damage type; it makes an ally attack as a Reaction.' },
    pasif: { tr: 'Taşıyıcının STR ya da CON puanı 20 olunca: uzay kökenli (Aberration) yaratıklara +2d10 hasar, dostlara AC +2.', en: 'When the carrier\'s Strength or Constitution is 20: +2d10 damage against Aberrations and +2 AC for allies.' },
    sinerji: { tr: 'Kara Malek ve Kraken avcısı.', en: 'Hunter of Kara Malek and the Kraken.' },
    riderGenc: { prone: {} },
    riderYetiskin: { prone: {} },
  },
  gamma: {
    gencEk: { tr: ', 15 ft merkeze çekilir ve hızı 0 olur', en: ', is pulled 15 feet toward the center, and its Speed becomes 0' },
    yetiskinEk: { tr: ', yerel yerçekimi çöküşüyle 30 ft çekilir, uçuşu biter ve hızı 0 olur', en: ', is pulled 30 feet by a local gravity collapse, stops flying, and its Speed becomes 0' },
    bag: { tr: 'Binicisine bu hattın hasar türüne direnç verir; binicinin yerçekimini kaldırır.', en: 'Grants its rider Resistance to this line\'s damage type and lifts its gravity.' },
    pasif: { tr: 'Taşıyıcının WIS ya da INT puanı 20 olunca: düşmanlar ışınlanamaz; taşıyıcı kuvvet hasarına bağışık olur.', en: 'When the carrier\'s Wisdom or Intelligence is 20: foes can\'t teleport, and the carrier is immune to Force damage.' },
    sinerji: { tr: 'Kıta Ejderhası ile tam rezonans.', en: 'Full resonance with the Continent Dragon.' },
  },
};

// ------------------------------------------------------------------ yardımcılar
const TR_TUR = { acid: 'asit', bludgeoning: 'ezici', cold: 'soğuk', fire: 'ateş', force: 'kuvvet', lightning: 'yıldırım', necrotic: 'nekrotik',
  piercing: 'delici', poison: 'zehir', psychic: 'psişik', radiant: 'ışıltı', slashing: 'kesici', thunder: 'gök gürültüsü' };
const EN_TUR = (t) => t[0].toUpperCase() + t.slice(1);
const ABIL_EN = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const mod = (s) => Math.floor((s - 10) / 2);
const profOf = (cr) => { const n = Number(cr); return n < 5 ? 2 : n < 9 ? 3 : n < 13 ? 4 : n < 17 ? 5 : n < 21 ? 6 : n < 25 ? 7 : n < 29 ? 8 : 9; };
const avg = (dice) => {
  const m = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(dice.replace(/\s/g, ''));
  return Math.floor((Number(m[1]) * (Number(m[2]) + 1)) / 2) + Number(m[3] ?? 0);
};
const spaced = (d) => d.replace(/\+/, ' + ');
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/ \(.*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Saldırının ikincil hasarları (EN metin parçası, TR metin parçası, ek etki `extra`). */
const extrasOf = (extras = []) => ({
  en: extras.map((x) => ` plus ${avg(x.dice)} (${x.dice}) ${EN_TUR(x.type)} damage`).join(''),
  tr: extras.map((x) => `, ayrıca ${x.dice} ${TR_TUR[x.type]} hasarı`).join(''),
  rider: extras.length ? extras.map((x) => `+ ${x.dice} ${x.type}`).join(' ') : undefined,
});

/** Yakın dövüş saldırısı (Monster saldırısı + saldırı eki). */
function melee(name, bonus, dice, type, reachFt, repeat, extras = [], extraRider = undefined) {
  const x = extrasOf(extras);
  return {
    atk: {
      name, bonus, damage: `${avg(dice)} (${spaced(dice)}) ${EN_TUR(type)} damage${x.en}.`, damageDice: dice, damageType: type,
      ...(x.rider || extraRider ? { rider: [x.rider, extraRider].filter(Boolean).join('. ') } : {}), ranged: false, reachFt, repeat,
    },
    ek: extras.length ? { extra: extras.map((e) => ({ dice: e.dice, type: e.type })) } : undefined,
  };
}
/** Kurtarma zarlı saldırı (nefes, bakış…). `area`: AttackArea; yoksa tek hedef (`rangeFt`). */
function saveAttack(name, { ability, dc, dice, type, area, rangeFt, recharge, half = true, extras = [], target, failText, repeat = 0 }) {
  const x = extrasOf(extras);
  const where = area ? areaEn(area) : (target ?? `one creature the attacker can see within ${rangeFt} feet`);
  const fail = dice ? `${avg(dice)} (${dice}) ${EN_TUR(type)} damage${x.en}${failText ? `, and ${failText}` : ''}.` : `${failText[0].toUpperCase()}${failText.slice(1)}.`;
  const r = area ? (area.origin === 'point' ? area.rangeFt : area.sizeFt) : rangeFt;
  return {
    name, bonus: 0,
    damage: `${ABIL_EN[ability]} Saving Throw: DC ${dc}, ${where}. Failure: ${fail}${half ? ' Success: Half damage.' : ''}`,
    save: { ability, dc, halfOnSave: half }, ranged: true, range: [r, r],
    ...(dice ? { damageDice: dice, damageType: type } : {}),
    ...(x.rider || failText ? { rider: [x.rider, failText].filter(Boolean).join('. ') } : {}),
    ...(recharge ? { recharge } : {}), repeat, ...(area ? { area } : {}),
  };
}
function areaEn(a) {
  const who = a.targets === 'enemies' ? 'each enemy' : 'each creature';
  if (a.shape === 'line') return `${who} in a ${a.sizeFt}-foot-long, ${a.widthFt}-foot-wide Line`;
  if (a.shape === 'cone') return `${who} in a ${a.sizeFt}-foot Cone`;
  if (a.shape === 'emanation') return `${who} in a ${a.sizeFt}-foot Emanation originating from the attacker`;
  return `${who} in a ${a.sizeFt}-foot-radius Sphere centered on a point within ${a.rangeFt} feet`;
}
const trMelee = (bonus, reach, dice, type, extras = [], tail = '') => `Yakın dövüş saldırısı +${bonus}, erişim ${reach} ft; isabette ${spaced(dice)} ${TR_TUR[type]} hasar${extrasOf(extras).tr}${tail}.`;
const enMelee = (atk) => `Melee Attack Roll: +${atk.bonus}, reach ${atk.reachFt} ft. Hit: ${atk.damage}`;

// ------------------------------------------------------------------ benzersiz yaratıklar (PDF birebir)
const DRAGON_IMM = ['Frightened', 'Paralyzed', 'Petrified', 'Unconscious'];
const ALL10 = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'];

function continentDragon() {
  const bite = melee('Bite', 19, '3d10+10', 'piercing', 15, 1, [{ dice: '3d8', type: 'force' }]);
  const claw = melee('Claw', 19, '3d8+10', 'slashing', 15, 2);
  const tail = melee('Tail', 19, '3d10+10', 'bludgeoning', 25, 0, [], 'The target is pushed 20 feet');
  const presence = saveAttack('Crushing Presence', { ability: 'wis', dc: 25, area: { shape: 'emanation', sizeFt: 60, origin: 'self', targets: 'enemies' }, half: false, failText: 'the target has the Frightened condition for 1 minute' });
  const breath = saveAttack('Continent Roar Breath', { ability: 'con', dc: 26, dice: '16d8', type: 'force', extras: [{ dice: '8d8', type: 'thunder' }], recharge: 5,
    area: { shape: 'line', sizeFt: 120, widthFt: 20, origin: 'self', targets: 'all' }, failText: 'the target is flung 30 feet back and has the Prone condition; the hexes become permanent Cracked Rock' });
  return {
    id: 'continent-dragon', name: 'Continent Dragon', size: 'G', ac: 25, hp: 740, speed: 50, fly: 100,
    abilities: { str: 30, dex: 12, con: 30, int: 22, wis: 24, cha: 28 }, saves: { str: 19, con: 19, wis: 16, cha: 18 }, skills: { perception: 16 },
    darkvision: 120, cr: '31', multiattack: true,
    attacks: [bite.atk, claw.atk, tail.atk, presence, breath],
    traits: 'Uçma 100 ft. Legendary Resistance (4/Day), Veil of Slumber, Armor\'s Betrayal, Ten-Stone Resonance. Multiattack: The dragon uses Crushing Presence, then makes one Bite attack and two Claw attacks.',
    resistances: ['fire', 'cold', 'lightning', 'necrotic'], immunities: ['force', 'thunder'],
    unsupported: [
      'Boyut: PDF 4×4 (19 altıgen) = Gargantuan; çok altıgen yalnız multiHex açıkken ve 21×11+ haritada',
      'Hız: Swim 50 ft (yalnızca yürüme/uçma kullanılır)',
      'Duyu: Blindsight 60 ft',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: Frightened, Paralyzed, Petrified, Unconscious (yalnız Dungeondex)',
      'Trait: Veil of Slumber (ilk 2 tur yarım uçuş, INT kurtarma dezavantajı)',
      'Trait: Armor\'s Betrayal (Kaltakkıran zırhı kancası)',
      'Trait: Ten-Stone Resonance (Versiyon II\'ye evrim)',
      'Multiattack (kısmi): Crushing Presence ayrı eylem (alan 60 ft türetildi)',
      'Continent Roar Breath: ikinci hasar (8d8 thunder), 30 ft savrulma ve kalıcı Çatlak Kaya yüzeyi',
      'Tail: 20 ft itme',
      'Legendary Actions: puan bedelleri (her eylem 1 kullanım); Seal Pull; Wing Storm sonrası 50 ft uçuş',
    ],
    ekler: { Bite: bite.ek, 'Continent Roar Breath': { prone: {}, status: 'kısmen', unsupported: 'ikinci hasar, savrulma, yüzey' },
      'Crushing Presence': { conditions: [{ condition: 'Frightened', owner: 'target', rounds: 10 }], status: 'uygulandı' } },
    dex: { type: 'dragon', alignment: 'True Neutral', conditionImmunities: DRAGON_IMM },
    efsanevi: { uses: 3, srd: 'KATALOG-F2 (PDF s. 2): Efsanevi Eylemler 3 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'tail', tr: 'Kuyruk', en: 'Tail', kind: 'strike', attack: 'Tail' },
      { id: 'wing-storm', tr: 'Kanat Fırtınası', en: 'Wing Storm', kind: 'save', oncePerTurn: true, save: 'dex', dc: 26, area: { shape: 'emanation', sizeFt: 25, origin: 'self' }, damage: '3d8+10', damageType: 'bludgeoning', conditions: ['Prone'] },
    ] },
    features: [
      ['trait', 'Legendary Resistance (4/Day)', 'Başarısız olduğu kurtarma zarını başarılı sayar (günde 4 kez).', 'If the dragon fails a saving throw, it can choose to succeed instead (4/Day).'],
      ['trait', 'Veil of Slumber', 'Yüz yıllık kâbus uykusunun izi: savaşın ilk 2 turunda uçuş hızı yarıya (50 ft) iner ve INT kurtarma zarlarında dezavantajlıdır. 3. turda kükreyerek zincirlerini kırar ve tam hızına döner.', 'Mark of the century-long nightmare sleep: during the first 2 rounds of combat its Fly Speed is halved (50 ft) and it has Disadvantage on Intelligence saving throws. On the 3rd round it roars, breaks its chains, and returns to full speed.'],
      ['trait', 'Armor\'s Betrayal', '60 ft içinde Kaltakkıran\'ın Paladin Zırhı\'nı giyen karakter her tur başında DC 24 WIS kurtarma zarı atar; kaybederse zırhın eklemleri kilitlenir (hızı 0 olur), ejderhaya saldırıları dezavantajlı, ejderhanın ona saldırıları avantajlı olur.', 'A character wearing Kaltakkıran\'s Paladin Armor within 60 feet makes a DC 24 Wisdom saving throw at the start of each turn. On a failure the armor\'s joints lock (its Speed becomes 0), its attacks against the dragon have Disadvantage, and the dragon\'s attacks against it have Advantage.'],
      ['trait', 'Ten-Stone Resonance', 'Parti 10 Mühür Taşı\'nı sunağa bıraktığında ya da eylemle ejderhaya değdirdiğinde ejderha taşlardaki karanlığı yutup yakar ve doğrudan Ancient Continent Spirit (CR 40) biçimine evrilir.', 'When the party places the 10 Seal Stones on the altar or touches them to the dragon with an action, the dragon devours and burns the darkness in the stones and evolves directly into the Ancient Continent Spirit (CR 40).'],
      ['action', 'Multiattack', 'Crushing Presence kullanır; ardından bir Bite ve iki Claw saldırısı yapar.', 'The dragon uses Crushing Presence, then makes one Bite attack and two Claw attacks.'],
      ['action', 'Crushing Presence', 'Çevresindeki düşmanlar DC 25 WIS kurtarma zarı atar; kaybeden 1 dakika Frightened olur.', `${presence.damage}`],
      ['action', 'Bite', trMelee(19, 15, '3d10+10', 'piercing', [{ dice: '3d8', type: 'force' }]), enMelee(bite.atk)],
      ['action', 'Claw', trMelee(19, 15, '3d8+10', 'slashing'), enMelee(claw.atk)],
      ['action', 'Tail', trMelee(19, 25, '3d10+10', 'bludgeoning', [], ' ve hedef 20 ft itilir'), `${enMelee(tail.atk).replace(/\.$/, '')}, and the target is pushed 20 feet.`],
      ['action', 'Continent Roar Breath (Recharge 5–6)', '120 ft uzunluğunda, 20 ft genişliğinde hatta tektonik şok dalgası üfler. Hattaki herkes DC 26 CON kurtarma zarı atar; kaybeden 16d8 kuvvet ve 8d8 gök gürültüsü hasarı alır, 30 ft geri savrulur ve Prone olur; başaran yarı hasar alır. Altıgenler kalıcı Çatlak Kaya yüzeyine dönüşür.', breath.damage],
      ['legendary', 'Tail', 'Tail saldırısı yapar (25 ft erişim, 3d10 + 10 ezici hasar ve 20 ft itme). Bedeli 1 puan.', 'The dragon makes one Tail attack (reach 25 ft, 3d10 + 10 Bludgeoning damage and a 20-foot push). Costs 1 point.'],
      ['legendary', 'Wing Storm', '25 ft yarıçaptaki herkes DC 26 DEX kurtarma zarı atar; kaybeden 3d8 + 10 ezici hasar alır ve Prone olur. Ardından ejderha 50 ft uçar. Bedeli 2 puan.', 'Dexterity Saving Throw: DC 26, each creature within 25 feet. Failure: 3d8 + 10 Bludgeoning damage and the Prone condition. The dragon then flies up to 50 feet. Costs 2 points.'],
      ['legendary', 'Seal Pull', 'Mühür Taşı taşıyan bir hedef DC 25 STR kurtarma zarı atar; kaybederse 30 ft ejderhaya çekilir. Bedeli 2 puan.', 'Strength Saving Throw: DC 25, one target carrying a Seal Stone. Failure: the target is pulled 30 feet toward the dragon. Costs 2 points.'],
    ],
  };
}

function continentSpirit() {
  const bite = melee('World-Breaker Bite', 25, '6d12+13', 'piercing', 20, 1, [{ dice: '6d10', type: 'force' }, { dice: '6d10', type: 'radiant' }]);
  const claws = melee('Continent-Shaper Claws', 25, '5d10+13', 'slashing', 20, 2, [{ dice: '4d10', type: 'force' }], 'The target takes a −3 penalty to AC for 1 round');
  const tail = melee('Continent Tail', 25, '5d12+13', 'bludgeoning', 30, 1, [], 'Each creature within 15 feet of the target is flung 40 feet and has the Prone condition');
  const presence = saveAttack('Crushing Continental Presence', { ability: 'wis', dc: 32, area: { shape: 'emanation', sizeFt: 60, origin: 'self', targets: 'enemies' }, half: false, failText: 'the target has the Paralyzed condition for 1 minute' });
  const breath = saveAttack('Continent Judgment Breath', { ability: 'con', dc: 32, dice: '30d10', type: 'force', extras: [{ dice: '20d10', type: 'radiant' }], recharge: 5,
    area: { shape: 'line', sizeFt: 300, widthFt: 30, origin: 'self', targets: 'enemies' }, failText: 'a foe reduced to 0 Hit Points is disintegrated; allies and cities take no damage' });
  return {
    id: 'ancient-continent-spirit', name: 'Ancient Continent Spirit', size: 'G', ac: 30, hp: 1850, speed: 80, fly: 200,
    abilities: { str: 36, dex: 18, con: 36, int: 30, wis: 32, cha: 34 }, saves: { str: 25, dex: 16, con: 25, int: 22, wis: 23, cha: 24 }, skills: { perception: 23 },
    cr: '40', multiattack: true,
    attacks: [bite.atk, claws.atk, tail.atk, presence, breath],
    traits: 'Uçma 200 ft. Legendary Resistance (6/Day), Continent Scale, Ten-Seal Core, Timeless Storm Dominion, Spell-Reflecting Crystal Shell. Multiattack: The dragon uses Crushing Continental Presence, then makes one World-Breaker Bite, two Continent-Shaper Claws, and one Continent Tail attack.',
    immunities: [...ALL10],
    unsupported: [
      'Boyut: PDF 7×7 (37 altıgen); motorun en büyük boyutu Gargantuan (19 altıgen), çok altıgen yalnız multiHex açıkken',
      'Hız: Swim 100 ft, Burrow 80 ft, Hover (yalnızca yürüme/uçma kullanılır)',
      'Duyu: Truesight 300 ft, Tremorsense 1 mil',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: 13 durum (yalnız Dungeondex)',
      'Trait: Legendary Resistance\'ın olumsuz etki silmesi',
      'Trait: Continent Scale (altındaki altıgenler dosta sığınak, düşmana zorlu arazi; zorla hareket bağışıklığı)',
      'Trait: Ten-Seal Core (direnç/bağışıklık yok sayma; 300 ft dost aurası)',
      'Trait: Timeless Storm Dominion (iki inisiyatif 30 ve 15; turda bir tepkisiz iptal)',
      'Trait: Spell-Reflecting Crystal Shell (büyü yansıtma)',
      'Multiattack (kısmi): Crushing Continental Presence ayrı eylem (alan 60 ft türetildi)',
      'Continent Judgment Breath: ikinci hasar (20d10 radiant), atomlarına ayırma, gökten dikey sütun seçeneği',
      'Continent-Shaper Claws: 1 tur AC −3; Continent Tail: 15 ft yarıçapta 40 ft savurma',
      'Curse-Breaking Seal (1/UD): anlatı eylemi',
      'Legendary Actions: puan bedelleri (her eylem 1 kullanım); Tectonic Shift yükseltme/çökertme; Seal Burst Dispel ve dost iyileşmesi',
    ],
    ekler: { 'World-Breaker Bite': bite.ek, 'Continent-Shaper Claws': claws.ek, 'Continent Tail': { prone: {}, status: 'kısmen', unsupported: 'savurma' },
      'Crushing Continental Presence': { conditions: [{ condition: 'Paralyzed', owner: 'target', rounds: 10 }], status: 'uygulandı' } },
    dex: { type: 'dragon', alignment: 'Neutral Good', conditionImmunities: ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'] },
    efsanevi: { uses: 5, srd: 'KATALOG-F2 (PDF s. 4): Efsanevi Eylemler 5 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'tectonic-shift', tr: 'Tektonik Kayma', en: 'Tectonic Shift', kind: 'quake', oncePerTurn: true, radiusFt: 60 },
      { id: 'lightning-spear-rain', tr: 'Yıldırım Mızrağı Yağmuru', en: 'Lightning Spear Rain', kind: 'save', oncePerTurn: true, save: 'dex', dc: 32, area: { shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 120 }, damage: '8d10', damageType: 'lightning' },
      { id: 'seal-burst', tr: 'On Mühür Patlaması', en: 'Ten-Seal Burst', kind: 'save', oncePerTurn: true, save: 'con', dc: 32, area: { shape: 'emanation', sizeFt: 60, origin: 'self' }, damage: '12d10', damageType: 'force' },
    ] },
    features: [
      ['trait', 'Legendary Resistance (6/Day)', 'Başarısız kurtarma zarını otomatik başarıya çevirir ve üzerindeki bir olumsuz etkiyi siler (günde 6 kez).', 'If the dragon fails a saving throw, it can choose to succeed instead and remove one negative effect on itself (6/Day).'],
      ['trait', 'Continent Scale', 'Altındaki altıgenler dostlar için kutsal sığınak, düşmanlar için zorlu arazi olur; kendisinden küçük hiçbir güç onu zorla hareket ettiremez.', 'The hexes beneath it become a sacred sanctuary for allies and Difficult Terrain for foes; no force smaller than itself can move it against its will.'],
      ['trait', 'Ten-Seal Core', 'Verdiği bütün hasarlar her türlü direnci ve bağışıklığı yok sayar. 300 ft içindeki müttefikler korku ve zihin kontrolüne bağışık olur, kurtarma zarlarına +6 ekler ve tur başında 50 geçici can kazanır.', 'Its damage ignores all Resistances and Immunities. Allies within 300 feet are immune to fear and mind control, add +6 to their saving throws, and gain 50 Temporary Hit Points at the start of each turn.'],
      ['trait', 'Timeless Storm Dominion', 'Aynı turda iki ayrı inisiyatif sırasında (30 ve 15) oynar. Turda bir kez, tepki harcamadan kendisine gelen bir büyüyü ya da saldırıyı zaman dışına itip iptal eder.', 'It takes two turns each round, on initiative counts 30 and 15. Once per round, without using a Reaction, it pushes a spell or attack aimed at it out of time and cancels it.'],
      ['trait', 'Spell-Reflecting Crystal Shell', 'Kendisini hedef alan bir büyüde kurtarma zarını başarırsa büyü ona etki etmeden atıcısına geri seker.', 'When it succeeds on a saving throw against a spell that targets it, the spell has no effect on it and rebounds to its caster.'],
      ['action', 'Multiattack', 'Crushing Continental Presence kullanır; ardından bir World-Breaker Bite, iki Continent-Shaper Claws ve bir Continent Tail saldırısı yapar.', 'The dragon uses Crushing Continental Presence, then makes one World-Breaker Bite, two Continent-Shaper Claws, and one Continent Tail attack.'],
      ['action', 'Crushing Continental Presence', 'Çevresindeki düşmanlar DC 32 WIS kurtarma zarı atar; kaybeden 1 dakika Paralyzed olur.', presence.damage],
      ['action', 'World-Breaker Bite', trMelee(25, 20, '6d12+13', 'piercing', [{ dice: '6d10', type: 'force' }, { dice: '6d10', type: 'radiant' }]), enMelee(bite.atk)],
      ['action', 'Continent-Shaper Claws', trMelee(25, 20, '5d10+13', 'slashing', [{ dice: '4d10', type: 'force' }], '; hedefin AC\'si 1 tur 3 düşer'), `${enMelee(claws.atk).replace(/\.$/, '')}, and the target takes a −3 penalty to AC for 1 round.`],
      ['action', 'Continent Tail', trMelee(25, 30, '5d12+13', 'bludgeoning', [], '; hedefin 15 ft yarıçapındaki herkes 40 ft savrulur ve Prone olur'), `${enMelee(tail.atk).replace(/\.$/, '')}. Each creature within 15 feet of the target is flung 40 feet and has the Prone condition.`],
      ['action', 'Continent Judgment Breath (Recharge 5–6)', '300 ft uzunluğunda, 30 ft genişliğinde hatta (ya da gökten 60 ft yarıçaplı dikey sütunda) saf kozmik-tektonik ışık ateşler. Alandaki düşmanlar DC 32 CON kurtarma zarı atar; kaybeden 30d10 kuvvet ve 20d10 ışıltı hasarı alır, başaran yarısını. 0 HP\'ye inen düşmanlar atomlarına ayrılır. Dostlara ve şehirlere hiç zarar vermez.', breath.damage],
      ['action', 'Curse-Breaking Seal (1/Long Rest)', '300 ft içindeki bir eserin ya da hedefin bütün lanetlerini siler. Kaltakkıran zırhını parçalar, kılıcı Devrim Simgesi\'ne çevirir ve partiye Koruyucu Ejderha Mührü verir.', 'It removes every curse from an artifact or target within 300 feet. It shatters Kaltakkıran\'s armor, turns the sword into the Symbol of Revolution, and grants the party the Guardian Dragon Seal.'],
      ['legendary', 'Tectonic Shift', '60 ft\'lik bir alanı 30 ft yükseltir ya da çökertir; alandakiler Prone olur. Bedeli 1 puan.', 'It raises or sinks a 60-foot area by 30 feet; creatures there have the Prone condition. Costs 1 point.'],
      ['legendary', 'Lightning Spear Rain', '4 altıgendeki herkes DC 32 DEX kurtarma zarı atar; kaybeden 8d10 yıldırım ve 8d10 kuvvet hasarı alır. Bedeli 2 puan.', 'Dexterity Saving Throw: DC 32, each creature in 4 hexes. Failure: 8d10 Lightning damage plus 8d10 Force damage. Costs 2 points.'],
      ['legendary', 'Ten-Seal Burst', '60 ft içindeki herkes DC 32 CON kurtarma zarı atar; kaybeden 12d10 kuvvet ve 12d10 ışıltı hasarı alır, üzerindeki büyüler dağılır. Dostlar 100 can iyileşir. Bedeli 3 puan.', 'Constitution Saving Throw: DC 32, each creature within 60 feet. Failure: 12d10 Force damage plus 12d10 Radiant damage, and magic on the target is dispelled. Allies regain 100 Hit Points. Costs 3 points.'],
    ],
  };
}

function cosmicPhoenix() {
  const beak = melee('Cosmic Beak', 19, '3d10+10', 'piercing', 10, 1, [{ dice: '4d8', type: 'fire' }], 'The target gains a Star Mark for 1 round');
  const talons = melee('Starfire Talons', 19, '3d8+10', 'slashing', 10, 2, [{ dice: '4d8', type: 'fire' }], 'The target gains a Star Mark for 1 round');
  const glide = saveAttack('Celestial Glide', { ability: 'dex', dc: 27, dice: '14d10', type: 'fire', recharge: 5,
    area: { shape: 'line', sizeFt: 120, widthFt: 15, origin: 'self', targets: 'enemies' }, failText: 'the hexes become Cosmic Phoenix Flame for 3 rounds' });
  return {
    id: 'cosmic-phoenix', name: 'Cosmic Phoenix', size: 'H', ac: 26, hp: 780, speed: 40, fly: 150,
    abilities: { str: 24, dex: 30, con: 30, int: 22, wis: 30, cha: 28 }, saves: { dex: 19, con: 19, wis: 19, cha: 18 }, skills: { perception: 19 },
    cr: '32', multiattack: true,
    attacks: [beak.atk, talons.atk, glide],
    traits: 'Uçma 150 ft. Legendary Resistance (4/Day), Cosmic Starfire, Halo That Burns Veil and Slumber, Soul Bond with the Hunter, Rebirth from Ashes. Multiattack: The phoenix makes one Cosmic Beak attack and two Starfire Talons attacks.',
    immunities: ['fire', 'radiant', 'necrotic', 'psychic'],
    faz2: { esik: 0.05, geciciCan: 450, nefesDoldur: true, not: { tr: 'Küllerden Yeniden Doğuş (yaklaşık): Kozmik Anka 450 geçici canla ve yenilenmiş Celestial Glide ile göğe yükselir.', en: 'Rebirth from Ashes (approximate): the Cosmic Phoenix rises with 450 Temporary Hit Points and a recharged Celestial Glide.' } },
    unsupported: [
      'Boyut: PDF 3×3 (7 altıgen) = Huge; çok altıgen yalnız multiHex açıkken',
      'Hız: Hover (yalnızca yürüme/uçma kullanılır)',
      'Duyu: Truesight 120 ft',
      'Durum bağışıklığı: 11 durum (yalnız Dungeondex)',
      'Trait: Cosmic Starfire (ateş hasarı Ateş + Işıltı; direnci yok sayar, bağışıklığı dirence indirir) — hasar türü ateş yazıldı',
      'Trait: Halo That Burns Veil and Slumber (40 ft illüzyon/Invisible dağıtma, dostlardan Frightened silme)',
      'Trait: Soul Bond with the Hunter (Avcı\'nın ardından oynama, hasar paylaşımı, konsantrasyon avantajı)',
      'Trait: Rebirth from Ashes — 0 HP yerine %5 can eşiğinde Faz 2 (450 geçici can, nefes dolar); Süpernova ve Kor Yumurtası yok',
      'Cosmic Beak / Starfire Talons: Yıldız İşareti',
      'Celestial Glide: fırsat saldırısız 120 ft süzülme ve 3 tur Kozmik Anka Alevi yüzeyi',
      'Legendary Actions: puan bedelleri; Ember Wingbeat kurtarması türetildi (DC 27 DEX); Seal-Melting Talon ve Star Tear yok',
    ],
    ekler: { 'Cosmic Beak': beak.ek, 'Starfire Talons': talons.ek },
    dex: { type: 'celestial', alignment: 'Chaotic Good', conditionImmunities: ['Blinded', 'Charmed', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Unconscious'] },
    efsanevi: { uses: 3, srd: 'KATALOG-F2 (PDF s. 6): Efsanevi Eylemler 3 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'ember-wingbeat', tr: 'Köz Kanat Çırpışı', en: 'Ember Wingbeat', kind: 'save', oncePerTurn: true, save: 'dex', dc: 27, half: true, area: { shape: 'emanation', sizeFt: 25, origin: 'self' }, damage: '4d8', damageType: 'fire' },
    ] },
    features: [
      ['trait', 'Legendary Resistance (4/Day)', 'Başarısız kurtarma zarını otomatik başarıya çevirir (günde 4 kez).', 'If the phoenix fails a saving throw, it can choose to succeed instead (4/Day).'],
      ['trait', 'Cosmic Starfire', 'Verdiği bütün ateş hasarı Ateş + Işıltı (Yıldız Alevi) sayılır; ateş ve ışıltı direncini yok sayar, bağışıklığı dirence indirir.', 'All Fire damage it deals counts as Fire and Radiant (Starfire); it ignores Resistance to Fire and Radiant damage and treats Immunity as Resistance.'],
      ['trait', 'Halo That Burns Veil and Slumber', '40 ft (8 altıgen) çevresindeki bütün illüzyonları, Invisible etkilerini ve zihinsel kör noktaları anında dağıtır. Dostlardaki Frightened ve Kâbus Uykusu durumlarını siler; Kâbus Sisi altıgenlerini Kozmik Anka Alevi yüzeyine çevirir.', 'Within 40 feet (8 hexes) it instantly dispels all illusions, Invisible effects, and mental blind spots. It removes the Frightened condition and Nightmare Sleep from allies and turns Nightmare Mist hexes into Cosmic Phoenix Flame.'],
      ['trait', 'Soul Bond with the Hunter', 'Kendisini doğuran Avcı (Ranger / Anka Öğretisi büyücüsü) ile mühürlüdür: Avcı\'nın turundan hemen sonra oynar, Avcı 60 ft içindeyken onun aldığı hasarın yarısını üstlenir ve konsantrasyon zarlarına avantaj verir.', 'It is sealed to the Hunter who gave birth to it (Ranger / Phoenix Doctrine caster): it acts right after the Hunter\'s turn, takes half the damage the Hunter takes while within 60 feet, and gives the Hunter Advantage on Concentration saves.'],
      ['trait', 'Rebirth from Ashes (1/Day)', '0 HP\'ye düştüğünde 60 ft yarıçaplı Süpernova patlatır: düşmanlar DC 27 CON kurtarma zarı atar ve 16d10 Yıldız Alevi hasarı alır, dostlar 80 can iyileşir. Merkezde Ember Egg (AC 22, 150 HP) oluşur; sonraki tur başında yumurta çatlar ve Anka 450 canla ve yenilenmiş Celestial Glide ile göğe yükselir.', 'When it drops to 0 Hit Points it detonates a 60-foot-radius Supernova: foes make a DC 27 Constitution saving throw and take 16d10 Starfire damage, and allies regain 80 Hit Points. An Ember Egg (AC 22, 150 HP) forms at the center; at the start of the next turn the egg hatches and the phoenix rises with 450 Hit Points and a recharged Celestial Glide.'],
      ['action', 'Multiattack', 'Bir Cosmic Beak ve iki Starfire Talons saldırısı yapar. İsabet alan hedef 1 tur Yıldız İşareti taşır: görünmez olamaz, uzaklık dezavantajı veremez ve konsantrasyon bonuslarını kaybeder.', 'The phoenix makes one Cosmic Beak attack and two Starfire Talons attacks. A target hit bears a Star Mark for 1 round: it can\'t become invisible, can\'t impose range Disadvantage, and loses its Concentration bonuses.'],
      ['action', 'Cosmic Beak', trMelee(19, 10, '3d10+10', 'piercing', [{ dice: '4d8', type: 'fire' }], ' (Yıldız Alevi)'), enMelee(beak.atk)],
      ['action', 'Starfire Talons', trMelee(19, 10, '3d8+10', 'slashing', [{ dice: '4d8', type: 'fire' }], ' (Yıldız Alevi)'), enMelee(talons.atk)],
      ['action', 'Celestial Glide (Recharge 5–6)', 'Fırsat saldırısına uğramadan 120 ft düz hatta süzülür. 3 altıgen genişliğindeki koridordaki düşmanlar DC 27 DEX kurtarma zarı atar; kaybeden 14d10 Yıldız Alevi hasarı alır, başaran yarısını. Altıgenler 3 tur Kozmik Anka Alevi yüzeyi olur: düşmanlara tur başı 4d8 Yıldız Alevi vurur, dostları her tur başı 3d8 + 10 can iyileştirir.', glide.damage],
      ['legendary', 'Ember Wingbeat', '25 ft içindekilere 4d8 Yıldız Alevi hasarı verir, karanlık yüzeyleri siler ve 50 ft uçar. Bedeli 1 puan.', 'It deals 4d8 Starfire damage to creatures within 25 feet, erases dark surfaces, and flies up to 50 feet. Costs 1 point.'],
      ['legendary', 'Seal-Melting Talon', 'Bir hedefin 0 HP kurtarma mekaniğini 1 tur mühürler. Bedeli 2 puan.', 'It seals one target\'s 0-Hit-Point recovery mechanic for 1 round. Costs 2 points.'],
      ['legendary', 'Star Tear', '60 ft içindeki bir müttefikin olumsuz durumlarını siler ve onu 6d10 + 10 can iyileştirir. Bedeli 2 puan.', 'It removes the negative conditions of an ally within 60 feet and restores 6d10 + 10 Hit Points to it. Costs 2 points.'],
    ],
  };
}

function emberEgg() {
  return {
    id: 'ember-egg', name: 'Ember Egg', size: 'M', ac: 22, hp: 150, speed: 0,
    abilities: { str: 1, dex: 1, con: 24, int: 1, wis: 10, cha: 10 }, cr: '0',
    attacks: [], traits: 'Hatching.',
    immunities: ['fire', 'radiant'],
    unsupported: [
      'Kor Yumurtası Cosmic Phoenix\'in Rebirth from Ashes özelliğiyle oluşur; motor yumurtayı kendiliğinden yaratmaz',
      'Trait: Hatching (sonraki tur başında çatlama ve 450 canla diriliş)',
      'CR yok (yumurta); 0 yazıldı',
    ],
    dex: { type: 'celestial', alignment: 'Unaligned', conditionImmunities: ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Stunned', 'Unconscious'] },
    features: [
      ['trait', 'Hatching', 'Cosmic Phoenix 0 HP\'ye düşünce Süpernova\'nın merkezinde oluşur. Sonraki tur başında çatlar ve Anka 450 canla ve yenilenmiş Celestial Glide ile göğe yükselir. Yumurta çatlamadan yok edilirse diriliş olmaz.', 'It forms at the center of the Supernova when the Cosmic Phoenix drops to 0 Hit Points. At the start of the next turn it hatches and the phoenix rises with 450 Hit Points and a recharged Celestial Glide. If the egg is destroyed before it hatches, there is no rebirth.'],
    ],
  };
}

function starNightmare() {
  const tentacle = melee('Eldritch Tentacle', 22, '5d8+12', 'bludgeoning', 45, 3, [{ dice: '3d8', type: 'psychic' }], 'The target has the Grappled condition (escape DC 26) and the Restrained condition (up to 12 targets)');
  const gaze = saveAttack('Maddening Gaze', { ability: 'int', dc: 27, dice: '8d10', type: 'psychic', rangeFt: 120, failText: 'the target has the Stunned condition for 1 round' });
  const fling = saveAttack('Cosmic Fling', { ability: 'dex', dc: 28, dice: '6d10', type: 'bludgeoning', extras: [{ dice: '3d8', type: 'force' }], rangeFt: 90,
    target: 'the Huge or smaller creature it is grappling, thrown to a point within 90 feet, and each creature within 10 feet of the landing point', failText: 'the target has the Prone condition' });
  const lightning = saveAttack('Void-Lightning Strike', { ability: 'dex', dc: 27, dice: '8d10', type: 'lightning', extras: [{ dice: '4d10', type: 'psychic' }], rangeFt: 180,
    target: 'up to three creatures within 180 feet', failText: 'the target can\'t maintain Concentration for 1 round' });
  const swallow = saveAttack('Abyssal Swallow', { ability: 'dex', dc: 28, dice: '4d10+12', type: 'piercing', rangeFt: 45, half: false,
    target: 'one Huge or smaller creature it is grappling', failText: 'the target is swallowed (up to 6), taking 8d6 Acid plus 6d6 Psychic damage at the start of each turn' });
  return {
    id: 'abyssal-star-nightmare', name: 'Abyssal Star-Nightmare', size: 'G', ac: 26, hp: 1150, speed: 40, fly: 60,
    abilities: { str: 34, dex: 14, con: 30, int: 30, wis: 28, cha: 30 }, saves: { str: 22, con: 20, int: 20, wis: 19, cha: 20 }, skills: { perception: 19 },
    cr: '35', multiattack: true,
    attacks: [tentacle.atk, gaze, fling, lightning, swallow],
    traits: 'Uçma 60 ft. Amphibious, Siege Monster, Legendary Resistance (5/Day, or 6/Day in Lair), Mind-Bending Presence, Alpha Resonance, Awakening of the Sleeping God. Multiattack: The Star-Nightmare uses Maddening Gaze, then makes three Eldritch Tentacle attacks; it can replace two of them with Cosmic Fling, Void-Lightning Strike, or Abyssal Swallow.',
    resistances: ['force', 'necrotic', 'thunder'], immunities: ['lightning', 'psychic', 'acid', 'cold'],
    faz2: { esik: 0.05, geciciCan: 550, not: { tr: 'Uykudaki Tanrının Uyanışı (yaklaşık): gerçeklik yarığı açılır, Yıldız-Kâbusu 550 geçici canla 2. faza geçer.', en: 'Awakening of the Sleeping God (approximate): a rift in reality opens and the Star-Nightmare enters its second phase with 550 Temporary Hit Points.' } },
    unsupported: [
      'Boyut: PDF 6×6 (31 altıgen); motorun en büyük boyutu Gargantuan (19 altıgen), çok altıgen yalnız multiHex açıkken',
      'Hız: Swim 120 ft, Hover (yalnızca yürüme/uçma kullanılır)',
      'Duyu: Truesight 180 ft, Telepati 10 mil',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: 12 durum (yalnız Dungeondex)',
      'Trait: Siege Monster (yapılara iki kat hasar)',
      'Trait: Mind-Bending Presence (60/90 ft Kozmik Delilik aurası)',
      'Trait: Alpha Resonance (Alfa hattı ejderhanın gök gürültüsü saldırıları direnci yok sayar)',
      'Trait: Awakening of the Sleeping God — 0 HP yerine %5 can eşiğinde Faz 2 (550 geçici can); su/kıyı zorlu arazi, 15 ft çekim, 90 ft aura ve 4 dokunaç yok',
      'Multiattack (kısmi): Maddening Gaze ayrı eylem; yerine geçen seçenekler ayrı eylem',
      'Eldritch Tentacle: aynı anda en çok 12 hedef',
      'Cosmic Fling / Abyssal Swallow: yalnız yakaladığı hedef; fırlatma, yutma ve kusma yok',
      'Void-Lightning Strike: en çok 3 hedef (tek hedef), ikinci hasar (4d10 psychic) ve konsantrasyon yasağı',
      'Legendary Actions: puan bedelleri; Abyssal Toxic Ink Silenced durumu; Dream Call yok',
    ],
    ekler: { 'Eldritch Tentacle': { ...tentacle.ek, grapple: { escapeDc: 26, restrained: true }, status: 'uygulandı' },
      'Maddening Gaze': { conditions: [{ condition: 'Stunned', owner: 'target', end: 'turnEnd', rounds: 1 }], status: 'uygulandı' },
      'Cosmic Fling': { prone: {}, status: 'kısmen', unsupported: 'ikinci hasar, fırlatma' } },
    dex: { type: 'aberration', alignment: 'Chaotic Evil', conditionImmunities: ['Blinded', 'Charmed', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'] },
    efsanevi: { uses: 4, srd: 'KATALOG-F2 (PDF s. 10): Efsanevi Eylemler 4 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'eldritch-storm-bolt', tr: 'Kozmik Fırtına Şimşeği', en: 'Eldritch Storm Bolt', kind: 'strike', attack: 'Void-Lightning Strike' },
      { id: 'abyssal-toxic-ink', tr: 'Uçurum Zehir Mürekkebi', en: 'Abyssal Toxic Ink', kind: 'save', oncePerTurn: true, save: 'con', dc: 27, area: { shape: 'emanation', sizeFt: 30, origin: 'self' }, conditions: ['Blinded', 'Poisoned'], moveAfter: 'full' },
    ] },
    features: [
      ['trait', 'Amphibious', 'Hem hava hem su soluyabilir.', 'It can breathe air and water.'],
      ['trait', 'Siege Monster', 'Gemilere, surlara, nesnelere ve yapılara iki kat hasar verir.', 'It deals double damage to ships, walls, objects, and structures.'],
      ['trait', 'Legendary Resistance (5/Day, or 6/Day in Lair)', 'Başarısız olduğu kurtarma zarını başarılı sayar (günde 5, inde 6 kez).', 'If it fails a saving throw, it can choose to succeed instead (5/Day, or 6/Day in its lair).'],
      ['trait', 'Mind-Bending Presence', '60 ft (12 altıgen) içinde turuna başlayan ya da alana giren her düşman DC 26 WIS kurtarma zarı atar; kaybeden 1 tur Kozmik Delilik yaşar: saldırı ve kurtarma zarlarından 1d6 düşer, tepki kullanamaz, 1d6\'da 1–2 gelirse ilk saldırısını en yakın müttefikine yapar.', 'Each foe that starts its turn within 60 feet (12 hexes) or enters that area makes a DC 26 Wisdom saving throw. On a failure it suffers Cosmic Madness for 1 round: it subtracts 1d6 from attack rolls and saving throws, can\'t take Reactions, and on a 1–2 on a d6 makes its first attack against the nearest ally.'],
      ['trait', 'Alpha Resonance', 'Savaş alanında Alfa hattından bir mücevher ejderhası varsa, o ejderhanın gök gürültüsü saldırıları bu yaratığın direncini yok sayar.', 'If an Alpha-line jewel dragon is on the battlefield, that dragon\'s Thunder attacks ignore this creature\'s Resistance.'],
      ['trait', 'Awakening of the Sleeping God (1/Day)', '0 HP\'ye düştüğünde gerçeklik yarığı açılır ve 550 canla 2. faz başlar: bütün su ve kıyı altıgenleri zorlu arazi olur, her tur başında düşmanlar DC 26 STR kurtarma zarında başarısız olursa 15 ft merkeze çekilir, Mind-Bending Presence aurası 90 ft\'e çıkar ve Multiattack 4 dokunaç vurur.', 'When it drops to 0 Hit Points a rift in reality opens and its second phase begins with 550 Hit Points: all water and shore hexes become Difficult Terrain, at the start of each round foes that fail a DC 26 Strength saving throw are pulled 15 feet toward the center, the Mind-Bending Presence aura grows to 90 feet, and Multiattack strikes with 4 tentacles.'],
      ['action', 'Multiattack', 'Maddening Gaze kullanır; ardından üç Eldritch Tentacle saldırısı yapar, bunlardan ikisinin yerine Cosmic Fling, Void-Lightning Strike ya da Abyssal Swallow kullanabilir.', 'It uses Maddening Gaze, then makes three Eldritch Tentacle attacks; it can replace two of them with Cosmic Fling, Void-Lightning Strike, or Abyssal Swallow.'],
      ['action', 'Eldritch Tentacle', trMelee(22, 45, '5d8+12', 'bludgeoning', [{ dice: '3d8', type: 'psychic' }], '. Hedef Grappled (kaçış DC 26) ve Restrained olur (aynı anda en çok 12 hedef)'), `${enMelee(tentacle.atk).replace(/\.$/, '')}. The target has the Grappled condition (escape DC 26) and the Restrained condition (up to 12 targets at once).`],
      ['action', 'Cosmic Fling', 'Yakaladığı Huge ya da daha küçük bir yaratığı 90 ft içinde bir yere ya da göğe fırlatır. Hedef ve varış yerinin 10 ft yarıçapındakiler DC 28 DEX kurtarma zarı atar; kaybeden 6d10 ezici ve 3d8 kuvvet hasarı alır ve Prone olur, başaran yarısını.', fling.damage],
      ['action', 'Void-Lightning Strike', '180 ft içindeki en çok 3 hedefe kara yıldırım indirir. Hedefler DC 27 DEX kurtarma zarı atar; kaybeden 8d10 yıldırım ve 4d10 psişik hasar alır ve 1 tur konsantrasyon sürdüremez, başaran yarısını.', lightning.damage],
      ['action', 'Abyssal Swallow', 'Yakaladığı Huge ya da daha küçük bir hedef DC 28 DEX kurtarma zarı atar; kaybederse 4d10 + 12 delici hasar alır ve yutulur (en çok 6 hedef). Yutulan her tur başında 8d6 asit ve 6d6 psişik hasar alır. Yıldız-Kâbusu bir turda içeriden 80 ya da daha çok hasar alırsa DC 27 CON kurtarma zarında başarısız olunca yutulanları 15 ft içine Prone kusar.', swallow.damage],
      ['action', 'Maddening Gaze', '120 ft içindeki tek hedef DC 27 INT kurtarma zarı atar; kaybederse 8d10 psişik hasar alır ve 1 tur Stunned olur, başaran yarısını.', gaze.damage],
      ['legendary', 'Eldritch Storm Bolt', 'Tek hedefe Void-Lightning Strike kullanır. Bedeli 1 puan.', 'It uses Void-Lightning Strike against one target. Costs 1 point.'],
      ['legendary', 'Abyssal Toxic Ink', 'Havada ya da suda 30 ft\'lik bulut salar: içindekiler DC 27 CON kurtarma zarı atar, kaybeden Blinded, Poisoned ve Silenced olur. Ardından hızı kadar hareket eder. Bedeli 2 puan.', 'It releases a 30-foot cloud in air or water: creatures in it make a DC 27 Constitution saving throw, and on a failure have the Blinded and Poisoned conditions and are Silenced. It then moves up to its Speed. Costs 2 points.'],
      ['legendary', 'Dream Call', '120 ft içindeki bir hedef DC 27 WIS kurtarma zarı atar; kaybederse 30 ft yaklaşır ve silahını düşürür. Bedeli 2 puan.', 'Wisdom Saving Throw: DC 27, one target within 120 feet. Failure: the target moves 30 feet closer and drops its weapon. Costs 2 points.'],
    ],
  };
}

// ------------------------------------------------------------------ mücevher ejderhası (türetilen kalıp)
// PDF yalnız AC/HP/nefes/20 nitelik pasifi verir (Genç ve Yetişkin); Yavru evresinin bütün sayıları türetilir.
const STAGES = {
  yavru: { base: { str: 19, dex: 12, con: 17, int: 12, wis: 12, cha: 14 }, size: 'M', reach: 5, rend: '2d6', cone: 30, ac: -2, hp: 0.5, breathLess: 3 },
  genc: { base: { str: 23, dex: 12, con: 21, int: 14, wis: 13, cha: 17 }, size: 'L', reach: 10, rend: '2d8', cone: 60 },
  yetiskin: { base: { str: 27, dex: 14, con: 25, int: 16, wis: 15, cha: 21 }, size: 'H', reach: 10, rend: '2d10', cone: 90 },
};
const STAGE_AD = { yavru: { tr: 'Yavru', en: (h) => `${h} Jewel Dragon Wyrmling` }, genc: { tr: 'Genç', en: (h) => `Young ${h} Jewel Dragon` }, yetiskin: { tr: 'Yetişkin', en: (h) => `Adult ${h} Jewel Dragon` } };
export const gemId = (hat, stage) => (stage === 'yavru' ? `${hat}-jewel-dragon-wyrmling` : `${stage === 'genc' ? 'young' : 'adult'}-${hat}-jewel-dragon`);

function gemDragon(hat, stage) {
  const H = HATLAR[hat], M = HAT_METIN[hat], S = STAGES[stage];
  const ab = { ...S.base };
  ab[H.baskin[0]] = Math.min(30, ab[H.baskin[0]] + 4);
  ab[H.baskin[1]] = Math.min(30, ab[H.baskin[1]] + 2);
  const cr = H[stage].cr, pb = profOf(cr);
  const g = H.genc;
  const ac = stage === 'yavru' ? g.ac + S.ac : H[stage].ac;
  const hp = stage === 'yavru' ? Math.round((g.hp * S.hp) / 5) * 5 : H[stage].hp;
  const nefes = stage === 'yavru'
    ? { yetenek: g.nefes.yetenek, dc: 8 + pb + mod(ab.con), zar: `${Number(g.nefes.zar.split('d')[0]) - S.breathLess}d8` }
    : H[stage].nefes;
  const type = H.hasar;
  const rendBonus = pb + mod(ab.str);
  const rendDice = `${S.rend}+${mod(ab.str)}`;
  const rend = melee('Rend', rendBonus, rendDice, 'slashing', S.reach, 3);
  const breathName = `${EN_TUR(type)} Breath`;
  const ekTr = stage === 'yetiskin' ? M.yetiskinEk : M.gencEk;
  const sonra = stage === 'yetiskin' ? M.yetiskinSonra : undefined;
  const breath = saveAttack(breathName, { ability: nefes.yetenek, dc: nefes.dc, dice: nefes.zar, type, recharge: 5,
    area: { shape: 'cone', sizeFt: S.cone, origin: 'self', targets: 'all' }, failText: `the target ${ekTr.en.replace(/^, /, '').replace(/^and /, '')}` });
  const riderSpec = stage === 'yetiskin' ? M.riderYetiskin : M.riderGenc;
  const tr = TR_TUR[type];
  const hatAd = `${H.ad.tr} hattı (${H.tas.tr})`;
  const lr = stage === 'yetiskin';
  const features = [
    ['trait', 'Carrier\'s Imprint', `${hatAd} mücevher ejderhası. Yumurtayı taşıyan karakterin hizalanması ${H.eksen.tr}, baskın nitelikleri ${H.baskin.map((a) => a.toUpperCase()).join(' + ')}, en sık kullandığı beceriler ${H.beceriler.join(', ')} olunca bu türe dönüşür. Nefesinin kurtarma DC'si taşıyıcının baskın niteliğiyle ölçeklenir. Evreler: Yavru (Sv. 5–10, CR 6–10) → Genç binek (Sv. 11–16, CR 15–20) → Yetişkin efsanevi yoldaş (Sv. 17–20, CR 25–30).`,
      `${H.ad.en}-line (${H.tas.en} crystal) jewel dragon. The egg becomes this kind when its carrier's alignment is ${H.eksen.en}, its dominant abilities are ${H.baskin.map((a) => a.toUpperCase()).join(' + ')}, and its most used skills are ${H.beceriler.join(', ')}. Its breath save DC scales with the carrier's dominant ability. Stages: Wyrmling (levels 5–10, CR 6–10) → Young mount (levels 11–16, CR 15–20) → Adult legendary companion (levels 17–20, CR 25–30).`],
    ...(stage === 'genc' ? [['trait', 'Mount Bond', `Uçan binek olarak taşıyıcısını taşır. ${M.bag.tr}`, `It carries its carrier as a flying mount. ${M.bag.en}`]] : []),
    ...(stage !== 'yavru' ? [['trait', 'Attribute 20 Lock', `${M.pasif.tr} Boss sinerjisi: ${M.sinerji.tr}`, `${M.pasif.en} Boss synergy: ${M.sinerji.en}`]] : []),
    ...(lr ? [['trait', 'Legendary Resistance (3/Day)', 'Kurtarma zarında başarısız olursa başarılı saymayı seçebilir (günde 3 kez).', 'If the dragon fails a saving throw, it can choose to succeed instead (3/Day).']] : []),
    ['action', 'Multiattack', 'Üç Rend saldırısı yapar.', 'The dragon makes three Rend attacks.'],
    ['action', 'Rend', trMelee(rendBonus, S.reach, rendDice, 'slashing'), enMelee(rend.atk)],
    ['action', `${breathName} (Recharge 5–6)`, `${S.cone} ft konideki herkes DC ${nefes.dc} ${nefes.yetenek.toUpperCase()} kurtarma zarı atar; kaybeden ${nefes.zar} ${tr} hasarı alır${ekTr.tr.startsWith(',') ? ekTr.tr : ` ${ekTr.tr}`}, başaran yarısını.${sonra ? ` ${sonra.tr}` : ''}`, `${breath.damage}${sonra ? ` ${sonra.en}` : ''}`],
    ...(lr ? [['legendary', 'Pounce', 'Hızının yarısı kadar hareket eder ve bir Rend saldırısı yapar.', 'The dragon moves up to half its Speed, and it makes one Rend attack.']] : []),
  ];
  const id = gemId(hat, stage);
  return {
    id, name: STAGE_AD[stage].en(H.ad.en), size: S.size, ac, hp, speed: 40, fly: 80, abilities: ab,
    saves: { dex: mod(ab.dex) + pb, wis: mod(ab.wis) + pb }, skills: { perception: mod(ab.wis) + 2 * pb, stealth: mod(ab.dex) + pb },
    darkvision: 120, cr, multiattack: true,
    attacks: [rend.atk, breath],
    traits: `Uçma 80 ft. ${features.filter((f) => f[0] === 'trait').map((f) => f[1]).join(', ')}. Multiattack: The dragon makes three Rend attacks.`,
    immunities: [type],
    unsupported: [
      ...(stage === 'yetiskin' ? ['Boyut: PDF "Gargantuan 3×3" (7 altıgen) = Huge yazıldı; çok altıgen yalnız multiHex açıkken'] : stage === 'genc' ? ['Boyut: PDF 2×2 = Large; çok altıgen yalnız multiHex açıkken'] : ['Boyut: PDF 1×1 = Medium']),
      'Duyu: Blindsight (SRD kalıbı) yok',
      'Trait: Carrier\'s Imprint (yumurta türü izleyicisi, taşıyıcıya göre DC)',
      ...(stage === 'genc' ? ['Trait: Mount Bond (binek bağı, binicinin kazanımları)'] : []),
      ...(stage !== 'yavru' ? ['Trait: Attribute 20 Lock (taşıyıcının nitelik pasifi ve boss sinerjisi)'] : []),
      `${breathName}: ${ekTr.tr.replace(/^, /, '').replace(/^ve /, '')} — yalnız veriyle bağlanan durumlar uygulanır`,
      'Türetilen değerler (SRD 5.2.1 ejderha kalıbı): yetenek puanları, Rend, hız, kurtarma, beceriler, bağışıklık, Recharge, yarı hasar' + (stage === 'yavru' ? ', AC, HP, nefes' : '') + (lr ? ', Legendary Resistance, Pounce' : ''),
    ],
    ...(riderSpec ? { ekler: { [breathName]: { ...riderSpec, status: 'kısmen' } } } : {}),
    dex: { type: 'dragon', alignment: H.hizalanma, conditionImmunities: [] },
    ...(lr ? { efsanevi: { uses: 3, srd: 'KATALOG-F2 (PDF s. 8): Yetişkin evre efsanevi 3 puan; eylemler PDF\'te yok, SRD kalıbıyla Pounce (türetildi)', actions: [
      { id: 'pounce', tr: 'Sıçrayış', en: 'Pounce', kind: 'strike', attack: 'Rend', halfMove: true },
    ] } } : {}),
    features,
    hat, evre: stage,
  };
}

// ------------------------------------------------------------------ çıktı
const DEFS = [continentDragon(), continentSpirit(), cosmicPhoenix(), emberEgg(), starNightmare(),
  ...Object.keys(HATLAR).flatMap((h) => ['yavru', 'genc', 'yetiskin'].map((s) => gemDragon(h, s)))];

const MONSTER_KEYS = ['id', 'name', 'size', 'ac', 'hp', 'speed', 'fly', 'abilities', 'saves', 'skills', 'darkvision', 'cr', 'multiattack', 'faz2', 'attacks', 'traits', 'resistances', 'immunities', 'vulnerabilities', 'unsupported'];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
const featKey = (id, f) => `${id}/${f[0]}:${slug(f[1])}`;

const out = {
  _not: 'Görev KATALOG-F2: Kadim Yaratıklar ve Mücevher Ejderhası (21 stat bloğu; PDF depo dışı). `node scripts/katalog-f2-kadim.mjs` üretir, elle düzenlenmez. `canavarlar`: Monster biçimi (yeni alan yok; `data/monsters.json`a yazılmaz, `loadMonsters` ayrı dizi `kadimMonsters` olarak yükler). `dex`: Dungeondex yan tablosu (tür, hizalanma, durum bağışıklığı; `data/srd/monsters.json` biçimi). `ozellikler`: Dungeondex özellik/eylem listesi (`data/canavar-ozellik.json` biçimi). `ekler`: saldırı ekleri (`data/attack-riders.json` biçimi, anahtar `<kimlik>:<saldırı>`). `hatlar`: mücevher hatları (nefes türünün tek yeri betikteki HATLAR). Türetilen değerler harita/belgeler/KATALOG-F2-PROSPEKTUS.md.',
  hatlar: Object.fromEntries(Object.entries(HATLAR).map(([k, h]) => [k, { ad: h.ad, tas: h.tas, hasar: h.hasar, oneri: h.oneri, hizalanma: h.hizalanma,
    kimlikler: ['yavru', 'genc', 'yetiskin'].map((s) => gemId(k, s)) }])),
  canavarlar: DEFS.map((d) => pick(d, MONSTER_KEYS)),
  dex: Object.fromEntries(DEFS.map((d) => [d.id, { type: d.dex.type, alignment: d.dex.alignment, conditionImmunities: d.dex.conditionImmunities }])),
  yer: Object.fromEntries(DEFS.map((d) => [d.id, { tema: 'Kadim Yaratıklar', ortam: [] }])),
  ozellikler: Object.fromEntries(DEFS.map((d) => [d.id, d.features.map((f) => ({ anahtar: featKey(d.id, f), ad: f[1], tur: f[0] }))])),
  ekler: Object.fromEntries(DEFS.flatMap((d) => Object.entries(d.ekler ?? {}).filter(([, v]) => v).map(([a, v]) => [`${d.id}:${a}`, { ...v, status: v.status ?? 'uygulandı' }]))),
};
fs.writeFileSync(P('data/canavarlar-kadim.json'), `${JSON.stringify(out, null, 1)}\n`);

// Açıklamalar: bu kimliklerin anahtarları silinip sona eklenir (dosyanın geri kalanı aynı kalır).
const ids = new Set(DEFS.map((d) => d.id));
for (const [file, lang] of [['data/aciklamalar-tr-canavar.json', 2], ['data/aciklamalar-en-canavar.json', 3]]) {
  const j = JSON.parse(fs.readFileSync(P(file), 'utf8'));
  const kept = Object.fromEntries(Object.entries(j.canavar).filter(([k]) => !ids.has(k.split('/')[0])));
  for (const d of DEFS) for (const f of d.features) kept[featKey(d.id, f)] = f[lang];
  j.canavar = kept;
  fs.writeFileSync(P(file), `${JSON.stringify(j, null, 1)}\n`);
}

// Efsanevi eylemler: `monsters` nesnesinin sonuna (bu kimliklerin eski blokları önce silinir; dosyanın elle biçimi korunur).
let ef = fs.readFileSync(P('data/efsanevi.json'), 'utf8').replace(/\r\n/g, '\n');
for (const id of ids) {
  const start = ef.indexOf(`\n  "${id}": {`);
  if (start < 0) continue;
  const endRel = ef.slice(start + 1).search(/\n {2}\}(,?)\n/);
  const endLine = ef.indexOf('\n', start + 1 + endRel + 1);
  ef = ef.slice(0, start) + ef.slice(endLine);
}
ef = ef.replace(/\n {2}\},\n \},\n "yuva"/, '\n  }\n },\n "yuva"'); // silinen son bloktan kalan virgül
const blocks = DEFS.filter((d) => d.efsanevi).map((d) => `  "${d.id}": ${JSON.stringify(d.efsanevi, null, 1).replace(/\n/g, '\n  ')}`);
ef = ef.replace(/\n {2}\}\n \},\n "yuva"/, `\n  },\n${blocks.join(',\n')}\n },\n "yuva"`);
JSON.parse(ef);
fs.writeFileSync(P('data/efsanevi.json'), ef);

console.log(`KATALOG-F2: ${DEFS.length} kayıt, ${Object.values(out.ozellikler).flat().length} özellik/eylem, ${Object.keys(out.ekler).length} saldırı eki, ${blocks.length} efsanevi kayıt.`);
