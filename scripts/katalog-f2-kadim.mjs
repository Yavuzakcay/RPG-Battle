// Görev KATALOG-F2 / KATALOG-F2-DUZELT: Kadim Yaratıklar ve mücevher ejderhaları (24 kayıt) + Dungeondex açıklamaları.
// TEK KAYNAK: harita/belgeler/KATALOG-F2-OZELLIKLER.md (onaylı; PDF ile çelişirse belge kazanır). PDF depo dışı (docs/katalog/).
// Çalıştırma: node scripts/katalog-f2-kadim.mjs   (tekrar çalıştırılabilir; aynı çıktıyı üretir)
// Yazar:  data/canavarlar-kadim.json (Monster kayıtları, Mühür Ruhu biçimi: creatureType, swim, kaynak, riders; Dungeondex yan tabloları),
//         data/aciklamalar-tr-canavar.json ve data/aciklamalar-en-canavar.json (yalnız bu kimliklerin anahtarları; eski F2 kimlikleri silinir),
//         data/efsanevi.json (yalnız bu kimliklerin satırları), data/dungeondex-gorsel-esleme.json (yalnız bu kimliklerin yedek satırları).
// Belgenin vermediği değerler (mücevher Bite/Claw/Tail, yetenek puanları, kurtarma…) türetilir: harita/belgeler/KATALOG-F2-PROSPEKTUS.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (p) => path.join(ROOT, p);
const KAYNAK = 'katalog-f2';
/** Önceki F2 sürümünün kimlikleri (KATALOG-F2-DUZELT öncesi; veriden ve açıklamalardan silinir). */
const ESKI = /^(continent-dragon|ancient-continent-spirit|cosmic-phoenix|abyssal-star-nightmare|(young-|adult-)?(alpha|omega|delta|sigma|gamma)-jewel-dragon(-wyrmling)?)$/;

// ------------------------------------------------------------------ mücevher hatları (TEK YER; belge §6)
// Nefes türü yalnız `hasar`da: değiştirip betiği yeniden çalıştırmak kaydı, bağışıklığı, nefes adını ve açıklamaları günceller.
// Evre değerleri belgedeki tablodan birebir (Yavru dahil; türetme yok). Hızlar görev metninden (ft; Yavru/Genç/Yetişkin).
const HATLAR = {
  alpha: {
    ad: { tr: 'Alfa', en: 'Alpha' }, renk: { tr: 'mavi', en: 'blue' }, hasar: 'thunder', tip: { tr: 'deniz ejderi', en: 'sea dragon' },
    hizalanma: 'Lawful Neutral', eksen: { tr: 'Yasal Tarafsız', en: 'Lawful Neutral' }, baskin: ['str', 'con'],
    kimlik: ['alphlet', 'alphyr', 'alphadrake'],
    hiz: { yurume: [20, 30, 30], yuzme: [60, 80, 90] }, kanatsiz: true, amfibi: true,
    evre: [{ cr: '7', ac: 17, hp: 155, dc: 16, yet: 'con', zar: '8d8' }, { cr: '19', ac: 20, hp: 310, dc: 21, yet: 'con', zar: '12d8' }, { cr: '28', ac: 24, hp: 585, dc: 25, yet: 'con', zar: '19d10' }],
    ek: [{ tr: ', 10 ft itilir ve Prone olur', en: 'is pushed 10 feet and has the Prone condition' },
      { tr: ', 15 ft itilir ve Prone olur', en: 'is pushed 15 feet and has the Prone condition' },
      { tr: ', 30 ft itilir, Prone olur ve konsantrasyonu bozulur', en: 'is pushed 30 feet, has the Prone condition, and loses Concentration' }],
    ekVeri: [{ prone: {} }, { prone: {} }, { prone: {} }],
    bag: { tr: 'Binicisine gök gürültüsü direnci verir; tepkisiyle bir müttefik saldırısı yapar.', en: 'Grants its rider Resistance to Thunder damage; it makes an ally attack as a Reaction.' },
    pasif: { tr: 'Taşıyıcının STR ya da CON puanı 20 olunca: Far Realm yaratıklarına +2d10 hasar, dostlara AC +2.', en: 'When the carrier\'s Strength or Constitution is 20: +2d10 damage against Far Realm creatures and +2 AC for allies.' },
  },
  omega: {
    ad: { tr: 'Omega', en: 'Omega' }, renk: { tr: 'kırmızı', en: 'red' }, hasar: 'necrotic', tip: { tr: 'kara ejderi', en: 'land dragon' },
    hizalanma: 'Chaotic Neutral', eksen: { tr: 'Kaotik Tarafsız', en: 'Chaotic Neutral' }, baskin: ['con', 'cha'],
    kimlik: ['omeglet', 'omegyr', 'omegadrake'],
    hiz: { yurume: [40, 40, 50], tirmanma: [30, 40, 40] }, kanatsiz: true,
    evre: [{ cr: '6', ac: 16, hp: 135, dc: 15, yet: 'con', zar: '7d8' }, { cr: '17', ac: 19, hp: 265, dc: 20, yet: 'con', zar: '11d8' }, { cr: '26', ac: 23, hp: 515, dc: 24, yet: 'con', zar: '17d10' }],
    ek: [{ tr: ' ve 1 tur iyileşemez', en: 'can\'t regain Hit Points for 1 round' },
      { tr: ' ve 1 tur iyileşemez', en: 'can\'t regain Hit Points for 1 round' },
      { tr: ', 1 tur iyileşemez ve en yüksek canı aldığı hasar kadar düşer', en: 'can\'t regain Hit Points for 1 round, and its Hit Point maximum decreases by the damage taken' }],
    ekVeri: [null, null, { drainMax: {} }],
    bag: { tr: 'Binicisine nekrotik direnci verir; binicinin darbesi hedefin iyileşmesini engeller.', en: 'Grants its rider Resistance to Necrotic damage; the rider\'s hits stop the target from healing.' },
    pasif: { tr: 'Taşıyıcının CON puanı 20 olunca: düşen rakipten 25 geçici can kazanır ve rakibin yenilenmesini kilitler.', en: 'When the carrier\'s Constitution is 20: gains 25 Temporary Hit Points from a foe that falls and locks the foe\'s regeneration.' },
  },
  delta: {
    ad: { tr: 'Delta', en: 'Delta' }, renk: { tr: 'yeşil', en: 'green' }, hasar: 'psychic', tip: { tr: 'Doğu ejderi', en: 'eastern dragon' },
    hizalanma: 'Lawful Neutral', eksen: { tr: 'Yasal Tarafsız', en: 'Lawful Neutral' }, baskin: ['int', 'wis'],
    kimlik: ['deltlet', 'deltyr', 'deltadrake'],
    hiz: { yurume: [30, 30, 30], ucus: [60, 80, 100] }, kanatsiz: true, suzulme: true,
    evre: [{ cr: '6', ac: 17, hp: 140, dc: 15, yet: 'int', zar: '7d8' }, { cr: '18', ac: 20, hp: 285, dc: 20, yet: 'int', zar: '11d8' }, { cr: '27', ac: 23, hp: 545, dc: 24, yet: 'int', zar: '18d10' }],
    ek: [{ tr: ' ve sonraki zarlarından 1d4 düşer', en: 'subtracts 1d4 from its next rolls' },
      { tr: ' ve sonraki zarlarından 1d6 düşer', en: 'subtracts 1d6 from its next rolls' },
      { tr: ', 1 tur Stunned olur ve bütün dirençlerini 1 tur kaybeder', en: 'has the Stunned condition for 1 round and loses all its Resistances for 1 round' }],
    ekVeri: [null, null, { conditions: [{ condition: 'Stunned', owner: 'target', end: 'turnEnd', rounds: 1 }] }],
    bag: { tr: 'Binicisine psişik direnç ve tuzak ile illüzyonlara karşı avantaj verir.', en: 'Grants its rider Resistance to Psychic damage and Advantage against traps and illusions.' },
    pasif: { tr: 'Taşıyıcının INT puanı 20 olunca: 60 ft içindeki görünmezleri ve illüzyonları açığa çıkarır, saldırılarına 1d8 psişik hasar ekler.', en: 'When the carrier\'s Intelligence is 20: reveals invisible creatures and illusions within 60 feet, and its attacks deal an extra 1d8 Psychic damage.' },
  },
  sigma: {
    ad: { tr: 'Sigma', en: 'Sigma' }, renk: { tr: 'altın', en: 'gold' }, hasar: 'radiant', tip: { tr: 'gök ejderi', en: 'sky dragon' },
    hizalanma: 'Chaotic Neutral', eksen: { tr: 'Kaotik Tarafsız', en: 'Chaotic Neutral' }, baskin: ['cha', 'dex'],
    kimlik: ['sigmlet', 'sigmyr', 'sigmadrake'],
    hiz: { yurume: [30, 40, 40], ucus: [60, 80, 80] },
    evre: [{ cr: '5', ac: 16, hp: 120, dc: 15, yet: 'con', zar: '6d8' }, { cr: '16', ac: 19, hp: 240, dc: 19, yet: 'con', zar: '10d8' }, { cr: '25', ac: 22, hp: 480, dc: 23, yet: 'con', zar: '16d10' }],
    ek: [{ tr: ' ve 1 tur Blinded olur', en: 'has the Blinded condition for 1 round' },
      { tr: ' ve 1 tur Blinded olur', en: 'has the Blinded condition for 1 round' },
      { tr: ' ve 1 tur Blinded olur', en: 'has the Blinded condition for 1 round' }],
    sonra: { tr: 'Alandaki dostlar 30 geçici can kazanır.', en: 'Allies in the area gain 30 Temporary Hit Points.' },
    ekVeri: [1, 1, 1].map(() => ({ conditions: [{ condition: 'Blinded', owner: 'target', end: 'turnEnd', rounds: 1 }] })),
    bag: { tr: 'Binicisine ışıltı direnci ve uzun dinlenmede 2 kez d20 yeniden atma verir.', en: 'Grants its rider Resistance to Radiant damage and lets it reroll a d20 twice per Long Rest.' },
    pasif: { tr: 'Taşıyıcının CHA puanı 20 olunca: 60 ft içindeki dostlar Blinded ve Charmed durumlarına bağışık olur.', en: 'When the carrier\'s Charisma is 20: allies within 60 feet are immune to the Blinded and Charmed conditions.' },
  },
  gamma: {
    ad: { tr: 'Gamma', en: 'Gamma' }, renk: { tr: 'gümüş', en: 'silver' }, hasar: 'force', tip: { tr: 'gök ejderi', en: 'sky dragon' },
    hizalanma: 'True Neutral', eksen: { tr: 'Gerçek Tarafsız', en: 'True Neutral' }, baskin: ['wis', 'int'],
    kimlik: ['gamlet', 'gammyr', 'gammadrake'],
    hiz: { yurume: [30, 40, 40], ucus: [60, 80, 80] },
    evre: [{ cr: '8', ac: 18, hp: 175, dc: 16, yet: 'str', zar: '8d8' }, { cr: '20', ac: 21, hp: 340, dc: 22, yet: 'str', zar: '12d8' }, { cr: '30', ac: 25, hp: 650, dc: 26, yet: 'str', zar: '20d10' }],
    ek: [{ tr: ' ve 10 ft çekilir', en: 'is pulled 10 feet' },
      { tr: ', 15 ft çekilir ve hızı 0 olur', en: 'is pulled 15 feet and its Speed becomes 0' },
      { tr: ', 30 ft çekilir, uçuşu biter ve hızı 0 olur', en: 'is pulled 30 feet, stops flying, and its Speed becomes 0' }],
    ekVeri: [null, null, null],
    bag: { tr: 'Binicisine kuvvet direnci verir; binicinin yerçekimini kaldırır.', en: 'Grants its rider Resistance to Force damage and lifts its gravity.' },
    pasif: { tr: 'Taşıyıcının WIS ya da INT puanı 20 olunca: düşmanlar ışınlanamaz; taşıyıcı kuvvet hasarına bağışık olur.', en: 'When the carrier\'s Wisdom or Intelligence is 20: foes can\'t teleport, and the carrier is immune to Force damage.' },
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
const extrasOf = (extras = []) => ({
  en: extras.map((x) => ` plus ${avg(x.dice)} (${x.dice}) ${EN_TUR(x.type)} damage`).join(''),
  tr: extras.map((x) => `, ayrıca ${x.dice} ${TR_TUR[x.type]} hasarı`).join(''),
  rider: extras.length ? extras.map((x) => `+ ${x.dice} ${x.type}`).join(' ') : undefined,
});

/** Yakın dövüş saldırısı (Monster saldırısı + saldırı eki `riders`). */
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
function saveAttack(name, { ability, dc, dice, type, area, rangeFt, recharge, half = true, extras = [], target, failText, repeat = 0, bonusAction = false }) {
  const x = extrasOf(extras);
  const where = area ? areaEn(area) : (target ?? `one creature the attacker can see within ${rangeFt} feet`);
  const fail = dice ? `${avg(dice)} (${dice}) ${EN_TUR(type)} damage${x.en}${failText ? `, and ${failText}` : ''}.` : `${failText[0].toUpperCase()}${failText.slice(1)}.`;
  const r = area ? (area.origin === 'point' ? area.rangeFt : area.sizeFt) : rangeFt;
  return {
    name, ...(bonusAction ? { bonusAction: true } : {}), bonus: 0,
    damage: `${ABIL_EN[ability]} Saving Throw: DC ${dc}, ${where}. Failure: ${fail}${half && dice ? ' Success: Half damage.' : ''}`,
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
const ALL10 = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'];

// ------------------------------------------------------------------ 1. Captive Dragon (belge §1)
function captiveDragon() {
  const bite = melee('Bite', 19, '3d10+10', 'piercing', 15, 1, [{ dice: '3d8', type: 'force' }]);
  const claw = melee('Claw', 19, '3d8+10', 'slashing', 15, 2);
  const tail = melee('Tail', 19, '3d10+10', 'bludgeoning', 25, 0, [], 'The target is pushed 20 feet');
  const presence = saveAttack('Crushing Presence', { ability: 'wis', dc: 25, area: { shape: 'emanation', sizeFt: 60, origin: 'self', targets: 'enemies' }, half: false, failText: 'the target has the Frightened condition for 1 minute' });
  const breath = saveAttack('Continent Roar Breath', { ability: 'con', dc: 26, dice: '15d8', type: 'force', extras: [{ dice: '8d8', type: 'thunder' }], recharge: 5,
    area: { shape: 'line', sizeFt: 120, widthFt: 20, origin: 'self', targets: 'all' }, failText: 'the target is flung 30 feet back and has the Prone condition; the hexes become permanent Cracked Rock' });
  return {
    id: 'tutsak-dragon', name: 'Captive Dragon', size: 'G', ac: 24, hp: 697, speed: 50, fly: 100, swim: 50,
    abilities: { str: 30, dex: 12, con: 30, int: 22, wis: 24, cha: 28 }, saves: { str: 19, con: 19, wis: 16, cha: 18 }, skills: { perception: 16 },
    darkvision: 120, cr: '30', multiattack: true, creatureType: 'dragon',
    attacks: [bite.atk, claw.atk, tail.atk, presence, breath],
    traits: 'Uçma 100 ft. Legendary Resistance (4/Day), Groggy Veil, Armor\'s Betrayal, Ten Stones Resonance. Multiattack: The dragon uses Crushing Presence, then makes one Bite attack and two Claw attacks.',
    resistances: ['fire', 'cold', 'lightning', 'necrotic'], immunities: ['force', 'thunder'],
    unsupported: [
      'Boyut: 19 altıgen (Gargantuan); çok altıgen yalnız multiHex açıkken ve 21×11+ haritada',
      'Duyu: Blindsight 60 ft',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: Frightened, Paralyzed, Petrified, Unconscious (yalnız Dungeondex)',
      'Trait: Groggy Veil (ilk 2 tur yarım uçuş, INT kurtarma dezavantajı)',
      'Trait: Armor\'s Betrayal (Kaltakkıran zırhı kancası)',
      'Trait: Ten Stones Resonance (Dragon of Hexonia\'ya evrim)',
      'Multiattack (kısmi): Crushing Presence ayrı eylem (alan 60 ft türetildi)',
      'Continent Roar Breath: ikinci hasar (8d8 thunder), 30 ft savrulma ve kalıcı Çatlak Kaya yüzeyi',
      'Tail: 20 ft itme',
      'Legendary Actions: puan bedelleri (her eylem 1 kullanım); Seal Pull; Wing Storm sonrası 50 ft uçuş',
    ],
    riders: { Bite: bite.ek, 'Continent Roar Breath': { prone: {}, status: 'kısmen', unsupported: 'ikinci hasar, savrulma, yüzey' },
      'Crushing Presence': { conditions: [{ condition: 'Frightened', owner: 'target', rounds: 10 }], status: 'uygulandı' } },
    dex: { type: 'dragon', alignment: 'Chaotic Neutral', conditionImmunities: ['Frightened', 'Paralyzed', 'Petrified', 'Unconscious'] },
    efsanevi: { uses: 3, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §1): Efsanevi Eylemler 3 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'tail', tr: 'Kuyruk', en: 'Tail', kind: 'strike', attack: 'Tail' },
      { id: 'wing-storm', tr: 'Kanat Fırtınası', en: 'Wing Storm', kind: 'save', oncePerTurn: true, save: 'dex', dc: 26, area: { shape: 'emanation', sizeFt: 25, origin: 'self' }, damage: '3d8+10', damageType: 'bludgeoning', conditions: ['Prone'] },
    ] },
    features: [
      ['trait', 'Legendary Resistance (4/Day)', 'Başarısız olduğu kurtarma zarını başarılı sayar (günde 4 kez).', 'If the dragon fails a saving throw, it can choose to succeed instead (4/Day).'],
      ['trait', 'Groggy Veil', 'Savaşın ilk 2 turunda uçuş hızı yarıya (50 ft) iner ve INT kurtarma zarlarında dezavantajlıdır. 3. turda zincirlerini kırar ve tam hızına döner.', 'During the first 2 rounds of combat its Fly Speed is halved (50 ft) and it has Disadvantage on Intelligence saving throws. On the 3rd round it breaks its chains and returns to full speed.'],
      ['trait', 'Armor\'s Betrayal', '60 ft içinde Kaltakkıran\'ın Paladin Zırhı\'nı giyen karakter her tur başında DC 24 WIS kurtarma zarı atar; kaybederse zırh kilitlenir (hızı 0 olur), ejderhaya saldırıları dezavantajlı, ejderhanın ona saldırıları avantajlı olur.', 'A character wearing Kaltakkıran\'s Paladin Armor within 60 feet makes a DC 24 Wisdom saving throw at the start of each turn. On a failure the armor locks (its Speed becomes 0), its attacks against the dragon have Disadvantage, and the dragon\'s attacks against it have Advantage.'],
      ['trait', 'Ten Stones Resonance', 'Parti 10 Mühür Taşı\'nı sunağa bırakırsa ejderha taşlardaki karanlığı yutar ve Dragon of Hexonia\'ya evrilir. Dungeondex\'te yalnız bilgi.', 'If the party places the 10 Seal Stones on the altar, the dragon devours the darkness in the stones and evolves into the Dragon of Hexonia. Information only in the Dungeondex.'],
      ['action', 'Multiattack', 'Crushing Presence kullanır; ardından bir Bite ve iki Claw saldırısı yapar.', 'The dragon uses Crushing Presence, then makes one Bite attack and two Claw attacks.'],
      ['action', 'Crushing Presence', 'Çevresindeki düşmanlar DC 25 WIS kurtarma zarı atar; kaybeden 1 dakika Frightened olur.', presence.damage],
      ['action', 'Bite', trMelee(19, 15, '3d10+10', 'piercing', [{ dice: '3d8', type: 'force' }]), enMelee(bite.atk)],
      ['action', 'Claw', trMelee(19, 15, '3d8+10', 'slashing'), enMelee(claw.atk)],
      ['action', 'Tail', trMelee(19, 25, '3d10+10', 'bludgeoning', [], ' ve hedef 20 ft itilir'), `${enMelee(tail.atk).replace(/\.$/, '')}, and the target is pushed 20 feet.`],
      ['action', 'Continent Roar Breath (Recharge 5–6)', '120 ft uzunluğunda, 20 ft genişliğinde hatta şok dalgası üfler. Hattaki herkes DC 26 CON kurtarma zarı atar; kaybeden 15d8 kuvvet ve 8d8 gök gürültüsü hasarı alır, 30 ft geri savrulur ve Prone olur; başaran yarı hasar alır. Altıgenler kalıcı Çatlak Kaya yüzeyine döner.', breath.damage],
      ['legendary', 'Tail', 'Tail saldırısı yapar (25 ft erişim, 3d10 + 10 ezici hasar ve 20 ft itme). Bedeli 1 puan.', 'The dragon makes one Tail attack (reach 25 ft, 3d10 + 10 Bludgeoning damage and a 20-foot push). Costs 1 point.'],
      ['legendary', 'Wing Storm', '25 ft yarıçaptaki herkes DC 26 DEX kurtarma zarı atar; kaybeden 3d8 + 10 ezici hasar alır ve Prone olur. Ardından ejderha 50 ft uçar. Bedeli 2 puan.', 'Dexterity Saving Throw: DC 26, each creature within 25 feet. Failure: 3d8 + 10 Bludgeoning damage and the Prone condition. The dragon then flies up to 50 feet. Costs 2 points.'],
      ['legendary', 'Seal Pull', 'Mühür Taşı taşıyan bir hedef DC 25 STR kurtarma zarı atar; kaybederse 30 ft ejderhaya çekilir. Bedeli 2 puan.', 'Strength Saving Throw: DC 25, one target carrying a Seal Stone. Failure: the target is pulled 30 feet toward the dragon. Costs 2 points.'],
    ],
  };
}

// ------------------------------------------------------------------ 2. Dragon of Hexonia (belge §2; a sağa, b sola bakar)
function dragonOfHexonia(variant) {
  const bite = melee('World-Breaker Bite', 25, '6d12+13', 'piercing', 20, 1, [{ dice: '6d10', type: 'force' }, { dice: '6d10', type: 'radiant' }]);
  const claw = melee('Continent-Shaper Claw', 25, '5d10+13', 'slashing', 20, 2, [{ dice: '4d10', type: 'force' }], 'The target takes a −3 penalty to AC for 1 round');
  const tail = melee('Continent Tail', 25, '5d12+13', 'bludgeoning', 30, 1, [], 'Each creature within 15 feet of the target is flung 40 feet and has the Prone condition');
  const presence = saveAttack('Crushing Continental Presence', { ability: 'wis', dc: 32, area: { shape: 'emanation', sizeFt: 60, origin: 'self', targets: 'enemies' }, half: false, failText: 'the target has the Paralyzed condition for 1 minute' });
  const breath = saveAttack('Continent Judgment Breath', { ability: 'con', dc: 32, dice: '30d10', type: 'force', extras: [{ dice: '20d10', type: 'radiant' }], recharge: 5,
    area: { shape: 'line', sizeFt: 300, widthFt: 30, origin: 'self', targets: 'enemies' }, failText: 'a foe reduced to 0 Hit Points is disintegrated; allies and cities take no damage' });
  return {
    id: `dragon-of-hexonia-${variant}`, name: 'Dragon of Hexonia', size: 'G', ac: 30, hp: 2500, speed: 80, fly: 200, swim: 100,
    abilities: { str: 36, dex: 18, con: 36, int: 30, wis: 32, cha: 34 }, saves: { str: 25, dex: 16, con: 25, int: 22, wis: 23, cha: 24 }, skills: { perception: 23 },
    cr: '40', multiattack: true, creatureType: 'dragon',
    attacks: [bite.atk, claw.atk, tail.atk, presence, breath],
    traits: 'Uçma 200 ft. Legendary Resistance (6/Day), Continent Scale, Ten Seals Core, Out-of-Time Storm, Spell-Reflecting Crystal Shell, Size Shift. Multiattack: The dragon uses Crushing Continental Presence, then makes one World-Breaker Bite, two Continent-Shaper Claw, and one Continent Tail attack.',
    immunities: [...ALL10],
    unsupported: [
      'Yalnız dost (müttefik koruyucu): düşman listesinde ve simülasyonda yok',
      `Yön: ${variant === 'a' ? 'sağa bakar' : 'sola bakar (b varyantı; Dungeondex\'te a gösterilir)'}`,
      'Boyut: 19 altıgen (Gargantuan) üst sınır; Size Shift motorda yok',
      'Hız: Burrow 80 ft, Hover (yalnızca yürüme/uçma/yüzme kullanılır)',
      'Duyu: Truesight 300 ft, Tremorsense 1 mil',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: 13 durum (yalnız Dungeondex)',
      'Trait: Legendary Resistance\'ın olumsuz etki silmesi',
      'Trait: Continent Scale (altındaki altıgenler dosta sığınak, düşmana zorlu arazi; zorla hareket bağışıklığı)',
      'Trait: Ten Seals Core (direnç/bağışıklık yok sayma; 300 ft dost aurası)',
      'Trait: Out-of-Time Storm (iki inisiyatif 30 ve 15; turda bir tepkisiz iptal)',
      'Trait: Spell-Reflecting Crystal Shell (büyü yansıtma)',
      'Trait: Size Shift (serbest eylemle boyut değiştirme)',
      'Multiattack (kısmi): Crushing Continental Presence ayrı eylem (alan 60 ft türetildi)',
      'Continent Judgment Breath: ikinci hasar (20d10 radiant), atomlarına ayırma, gökten dikey sütun seçeneği',
      'Continent-Shaper Claw: 1 tur AC −3; Continent Tail: 15 ft yarıçapta 40 ft savurma',
      'Seal That Strips Darkness (1/UD): anlatı eylemi',
      'Legendary Actions: puan bedelleri (her eylem 1 kullanım); Tectonic Shift yükseltme/çökertme; Ten Seals Burst Dispel ve dost iyileşmesi',
    ],
    riders: { 'World-Breaker Bite': bite.ek, 'Continent-Shaper Claw': claw.ek, 'Continent Tail': { prone: {}, status: 'kısmen', unsupported: 'savurma' },
      'Crushing Continental Presence': { conditions: [{ condition: 'Paralyzed', owner: 'target', rounds: 10 }], status: 'uygulandı' } },
    dex: { type: 'dragon', alignment: 'Neutral Good', conditionImmunities: ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'],
      yon: variant === 'a' ? 'sag' : 'sol', ...(variant === 'b' ? { gizli: true } : {}) },
    efsanevi: { uses: 5, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §2): Efsanevi Eylemler 5 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'tectonic-shift', tr: 'Tektonik Kayma', en: 'Tectonic Shift', kind: 'quake', oncePerTurn: true, radiusFt: 60 },
      { id: 'lightning-spear-rain', tr: 'Yıldırım Mızrağı Yağmuru', en: 'Lightning Spear Rain', kind: 'save', oncePerTurn: true, save: 'dex', dc: 32, area: { shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 120 }, damage: '8d10', damageType: 'lightning' },
      { id: 'ten-seals-burst', tr: 'On Mühür Patlaması', en: 'Ten Seals Burst', kind: 'save', oncePerTurn: true, save: 'con', dc: 32, area: { shape: 'emanation', sizeFt: 60, origin: 'self' }, damage: '12d10', damageType: 'force' },
    ] },
    features: [
      ['trait', 'Legendary Resistance (6/Day)', 'Başarısız kurtarma zarını başarılı sayar ve üzerindeki bir olumsuz etkiyi siler (günde 6 kez).', 'If the dragon fails a saving throw, it can choose to succeed instead and remove one negative effect on itself (6/Day).'],
      ['trait', 'Continent Scale', 'Kapladığı altıgenler dostlara kutsal sığınak, düşmanlara zorlu arazi olur. Kendinden küçük hiçbir güç onu zorla hareket ettiremez.', 'The hexes it occupies become a sacred sanctuary for allies and Difficult Terrain for foes. No force smaller than itself can move it against its will.'],
      ['trait', 'Ten Seals Core', 'Verdiği bütün hasar her direnci ve bağışıklığı yok sayar. 300 ft içindeki müttefikler korku ve zihin kontrolüne bağışık olur, kurtarma zarlarına +6 alır ve tur başında 50 geçici can kazanır.', 'Its damage ignores all Resistances and Immunities. Allies within 300 feet are immune to fear and mind control, gain +6 to saving throws, and gain 50 Temporary Hit Points at the start of each turn.'],
      ['trait', 'Out-of-Time Storm', 'Turda iki kez oynar (inisiyatif 30 ve 15). Turda bir kez, tepki harcamadan kendisine gelen bir büyüyü ya da saldırıyı iptal eder.', 'It takes two turns each round (initiative 30 and 15). Once per round, without using a Reaction, it cancels a spell or attack aimed at it.'],
      ['trait', 'Spell-Reflecting Crystal Shell', 'Kendisini hedef alan bir büyüde kurtarma zarını geçerse büyü atıcısına geri seker.', 'When it succeeds on a saving throw against a spell that targets it, the spell rebounds to its caster.'],
      ['trait', 'Size Shift', 'Serbest eylemle (turda en çok 2 kez) boyunu istediği gibi büyütür ya da küçültür; boyutu sınırsızdır (dağ boyunu da aşar). Haritada en çok 19 altıgen kaplar: Tiny–Medium 1, Large 3, Huge 7, Gargantuan 19 altıgen. Küçükken dar geçitlere, binalara ve odalara sığar; büyükken erişimi ve kapsama alanı büyür. Hasarı ve saldırı bonusu değişmez.', 'As a free action (at most twice per round) it grows or shrinks to any size it wishes; its size is unlimited (it can tower over mountains). On the map it occupies at most 19 hexes: Tiny–Medium 1, Large 3, Huge 7, Gargantuan 19 hexes. Small, it fits through narrow passages and into buildings and rooms; large, its reach and coverage grow. Its damage and attack bonus don\'t change.'],
      ['action', 'Multiattack', 'Crushing Continental Presence kullanır; ardından bir World-Breaker Bite, iki Continent-Shaper Claw ve bir Continent Tail saldırısı yapar.', 'The dragon uses Crushing Continental Presence, then makes one World-Breaker Bite, two Continent-Shaper Claw, and one Continent Tail attack.'],
      ['action', 'Crushing Continental Presence', 'Çevresindeki düşmanlar DC 32 WIS kurtarma zarı atar; kaybeden 1 dakika Paralyzed olur.', presence.damage],
      ['action', 'World-Breaker Bite', trMelee(25, 20, '6d12+13', 'piercing', [{ dice: '6d10', type: 'force' }, { dice: '6d10', type: 'radiant' }]), enMelee(bite.atk)],
      ['action', 'Continent-Shaper Claw', trMelee(25, 20, '5d10+13', 'slashing', [{ dice: '4d10', type: 'force' }], '; hedefin AC\'si 1 tur 3 düşer'), `${enMelee(claw.atk).replace(/\.$/, '')}, and the target takes a −3 penalty to AC for 1 round.`],
      ['action', 'Continent Tail', trMelee(25, 30, '5d12+13', 'bludgeoning', [], '; hedefin 15 ft yarıçapındaki herkes 40 ft savrulur ve Prone olur'), `${enMelee(tail.atk).replace(/\.$/, '')}. Each creature within 15 feet of the target is flung 40 feet and has the Prone condition.`],
      ['action', 'Continent Judgment Breath (Recharge 5–6)', '300 ft uzunluğunda, 30 ft genişliğinde hatta (ya da gökten 60 ft yarıçaplı dikey sütunda) kozmik ışık ateşler. Alandaki düşmanlar DC 32 CON kurtarma zarı atar; kaybeden 30d10 kuvvet ve 20d10 ışıltı hasarı alır, başaran yarısını. 0 HP\'ye inen düşman atomlarına ayrılır. Dost birimlere ve şehirlere hiç zarar vermez.', breath.damage],
      ['action', 'Seal That Strips Darkness (1/Long Rest)', '300 ft içindeki bir eserin ya da hedefin bütün lanetlerini siler. Kaltakkıran zırhını parçalar, kılıcı Devrim Simgesi\'ne çevirir ve partiye Koruyucu Ejderha Mührü verir.', 'It removes every curse from an artifact or target within 300 feet. It shatters Kaltakkıran\'s armor, turns the sword into the Symbol of Revolution, and grants the party the Guardian Dragon Seal.'],
      ['legendary', 'Tectonic Shift', '60 ft\'lik bir alanı 30 ft yükseltir ya da çökertir; alandakiler Prone olur. Bedeli 1 puan.', 'It raises or sinks a 60-foot area by 30 feet; creatures there have the Prone condition. Costs 1 point.'],
      ['legendary', 'Lightning Spear Rain', '4 altıgendeki herkes DC 32 DEX kurtarma zarı atar; kaybeden 8d10 yıldırım ve 8d10 kuvvet hasarı alır. Bedeli 2 puan.', 'Dexterity Saving Throw: DC 32, each creature in 4 hexes. Failure: 8d10 Lightning damage plus 8d10 Force damage. Costs 2 points.'],
      ['legendary', 'Ten Seals Burst', '60 ft içindeki herkes DC 32 CON kurtarma zarı atar; kaybeden 12d10 kuvvet ve 12d10 ışıltı hasarı alır, üzerindeki büyüler dağılır. Dostlar 100 can iyileşir. Bedeli 3 puan.', 'Constitution Saving Throw: DC 32, each creature within 60 feet. Failure: 12d10 Force damage plus 12d10 Radiant damage, and magic on the target is dispelled. Allies regain 100 Hit Points. Costs 3 points.'],
    ],
  };
}

// ------------------------------------------------------------------ 3. Cosmic Phoenix (belge §3; -savas: aynı değerler, Dungeondex'te gizli savaş varyantı)
function cosmicPhoenix(id) {
  const beak = melee('Cosmic Beak', 19, '3d10+10', 'piercing', 10, 1, [{ dice: '4d8', type: 'fire' }], 'The target gains a Star Mark for 1 round');
  const talons = melee('Starfire Talons', 19, '3d8+10', 'slashing', 10, 2, [{ dice: '4d8', type: 'fire' }], 'The target gains a Star Mark for 1 round');
  const glide = saveAttack('Celestial Glide', { ability: 'dex', dc: 27, dice: '14d10', type: 'fire', recharge: 5,
    area: { shape: 'line', sizeFt: 120, widthFt: 15, origin: 'self', targets: 'enemies' }, failText: 'the hexes become Cosmic Phoenix Flame for 3 rounds' });
  return {
    id, name: 'Cosmic Phoenix', size: 'H', ac: 26, hp: 780, speed: 40, fly: 150,
    abilities: { str: 24, dex: 30, con: 30, int: 22, wis: 30, cha: 28 }, saves: { dex: 19, con: 19, wis: 19, cha: 18 }, skills: { perception: 19 },
    cr: '32', multiattack: true, creatureType: 'celestial',
    attacks: [beak.atk, talons.atk, glide],
    traits: 'Uçma 150 ft. Legendary Resistance (4/Day), Cosmic Star Flame, Halo That Burns Veil and Sleep, Hunter Soul Bond, Rebirth from Ashes. Multiattack: The phoenix makes one Cosmic Beak attack and two Starfire Talons attacks.',
    immunities: ['fire', 'radiant', 'necrotic', 'psychic'],
    faz2: { esik: 0.05, geciciCan: 450, nefesDoldur: true, not: { tr: 'Rebirth from Ashes (yaklaşık): Kozmik Anka 450 geçici canla ve yenilenmiş Celestial Glide ile göğe yükselir.', en: 'Rebirth from Ashes (approximate): the Cosmic Phoenix rises with 450 Temporary Hit Points and a recharged Celestial Glide.' } },
    unsupported: [
      ...(id.endsWith('-savas') ? ['Savaş varyantı: kozmik-anka ile aynı değerler; Dungeondex\'te gizli'] : []),
      'Boyut: 7 altıgen (Huge); çok altıgen yalnız multiHex açıkken',
      'Hız: Hover (yalnızca yürüme/uçma kullanılır)',
      'Duyu: Truesight 120 ft',
      'Durum bağışıklığı: 11 durum (yalnız Dungeondex)',
      'Trait: Cosmic Star Flame (ateş hasarı Ateş + Işıltı; direnci yok sayar, bağışıklığı dirence indirir) — hasar türü ateş yazıldı',
      'Trait: Halo That Burns Veil and Sleep (40 ft illüzyon/Invisible dağıtma, dostlardan Frightened silme)',
      'Trait: Hunter Soul Bond (Avcı\'nın ardından oynama, hasar paylaşımı, konsantrasyon avantajı)',
      'Trait: Rebirth from Ashes — 0 HP yerine %5 can eşiğinde Faz 2 (450 geçici can, nefes dolar); Supernova ve Ember Egg yok',
      'Cosmic Beak / Starfire Talons: Star Mark',
      'Celestial Glide: fırsat saldırısız 120 ft süzülme ve 3 tur Cosmic Phoenix Flame yüzeyi',
      'Legendary Actions: puan bedelleri; Ember Wing Flap kurtarması türetildi (DC 27 DEX); Seal-Melting Talon ve Star Tear yok',
    ],
    riders: { 'Cosmic Beak': beak.ek, 'Starfire Talons': talons.ek },
    dex: { type: 'celestial', alignment: 'Chaotic Good', conditionImmunities: ['Blinded', 'Charmed', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Unconscious'],
      ...(id.endsWith('-savas') ? { gizli: true } : {}) },
    efsanevi: { uses: 3, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §3): Efsanevi Eylemler 3 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'ember-wing-flap', tr: 'Köz Kanat Çırpışı', en: 'Ember Wing Flap', kind: 'save', oncePerTurn: true, save: 'dex', dc: 27, half: true, area: { shape: 'emanation', sizeFt: 25, origin: 'self' }, damage: '4d8', damageType: 'fire' },
    ] },
    features: [
      ['trait', 'Legendary Resistance (4/Day)', 'Başarısız kurtarma zarını başarılı sayar (günde 4 kez).', 'If the phoenix fails a saving throw, it can choose to succeed instead (4/Day).'],
      ['trait', 'Cosmic Star Flame', 'Verdiği bütün ateş hasarı Ateş + Işıltı (Yıldız Alevi) sayılır. Ateş ve ışıltı direncini yok sayar, bağışıklığı dirence indirir.', 'All Fire damage it deals counts as Fire and Radiant (Starfire). It ignores Resistance to Fire and Radiant damage and treats Immunity as Resistance.'],
      ['trait', 'Halo That Burns Veil and Sleep', '40 ft (8 altıgen) içindeki illüzyonları, Invisible etkilerini ve zihinsel kör noktaları dağıtır. Dostlardaki Frightened ve Kâbus Uykusu durumlarını siler; Kâbus Sisi altıgenlerini Kozmik Anka Alevi yüzeyine çevirir.', 'Within 40 feet (8 hexes) it dispels illusions, Invisible effects, and mental blind spots. It removes the Frightened condition and Nightmare Sleep from allies and turns Nightmare Mist hexes into Cosmic Phoenix Flame.'],
      ['trait', 'Hunter Soul Bond', '40. kuşun mirası: kendisini doğuran Avcı ile bağlıdır. Avcı\'nın turundan hemen sonra oynar; Avcı 60 ft içindeyken onun aldığı hasarın yarısını üstlenir ve Avcı\'nın konsantrasyon zarlarına avantaj verir. Kırk kuş kendini feda eder, ruhları Anka Alevi\'nde tutuşur ve Kozmik Anka doğar; Avcı\'nın atmacası 40. kuştur.', 'Legacy of the 40th bird: it is bound to the Hunter who gave birth to it. It acts right after the Hunter\'s turn, takes half the damage the Hunter takes while within 60 feet, and gives the Hunter Advantage on Concentration saves. Forty birds sacrifice themselves, their souls ignite in the Phoenix Flame, and the Cosmic Phoenix is born; the Hunter\'s hawk is the 40th bird.'],
      ['trait', 'Rebirth from Ashes (1/Day)', '0 HP\'ye düştüğünde 60 ft yarıçaplı Supernova patlatır: düşmanlar DC 27 CON kurtarma zarı atar ve 16d10 Yıldız Alevi hasarı alır, dostlar 80 can iyileşir. Merkezde Ember Egg oluşur; sonraki tur başında yumurta çatlar ve Anka 450 canla ve yenilenmiş Celestial Glide ile göğe yükselir. Yumurta kırılırsa Anka dirilmez ve ölür.', 'When it drops to 0 Hit Points it detonates a 60-foot-radius Supernova: foes make a DC 27 Constitution saving throw and take 16d10 Starfire damage, and allies regain 80 Hit Points. An Ember Egg forms at the center; at the start of the next turn the egg hatches and the phoenix rises with 450 Hit Points and a recharged Celestial Glide. If the egg is destroyed, the phoenix is not reborn and dies.'],
      ['action', 'Multiattack', 'Bir Cosmic Beak ve iki Starfire Talons saldırısı yapar. İsabet alan hedef 1 tur Star Mark taşır: görünmez olamaz, mesafe dezavantajı veremez ve konsantrasyon bonuslarını kaybeder.', 'The phoenix makes one Cosmic Beak attack and two Starfire Talons attacks. A target hit bears a Star Mark for 1 round: it can\'t become invisible, can\'t impose range Disadvantage, and loses its Concentration bonuses.'],
      ['action', 'Cosmic Beak', trMelee(19, 10, '3d10+10', 'piercing', [{ dice: '4d8', type: 'fire' }], ' (Yıldız Alevi)'), enMelee(beak.atk)],
      ['action', 'Starfire Talons', trMelee(19, 10, '3d8+10', 'slashing', [{ dice: '4d8', type: 'fire' }], ' (Yıldız Alevi)'), enMelee(talons.atk)],
      ['action', 'Celestial Glide (Recharge 5–6)', 'Fırsat saldırısına uğramadan 120 ft düz hatta süzülür. 3 altıgen genişliğindeki koridordaki düşmanlar DC 27 DEX kurtarma zarı atar; kaybeden 14d10 Yıldız Alevi hasarı alır, başaran yarısını. Altıgenler 3 tur Kozmik Anka Alevi yüzeyi olur: düşmanlara tur başı 4d8 vurur, dostları her tur başı 3d8 + 10 can iyileştirir.', glide.damage],
      ['legendary', 'Ember Wing Flap', '25 ft içindekilere 4d8 Yıldız Alevi hasarı verir, karanlık yüzeyleri siler ve 50 ft uçar. Bedeli 1 puan.', 'It deals 4d8 Starfire damage to creatures within 25 feet, erases dark surfaces, and flies up to 50 feet. Costs 1 point.'],
      ['legendary', 'Seal-Melting Talon', 'Hedef 1 tur boyunca 0 HP\'de ölüm kurtarma zarı atmaz ama iyileşemez. Bedeli 2 puan.', 'For 1 round, the target doesn\'t make Death Saving Throws at 0 Hit Points but can\'t regain Hit Points. Costs 2 points.'],
      ['legendary', 'Star Tear', '60 ft içindeki bir müttefikin olumsuz durumlarını siler ve onu 6d10 + 10 can iyileştirir. Bedeli 2 puan.', 'It removes the negative conditions of an ally within 60 feet and restores 6d10 + 10 Hit Points to it. Costs 2 points.'],
    ],
  };
}

function emberEgg() {
  return {
    id: 'ember-egg', name: 'Ember Egg', size: 'M', ac: 22, hp: 150, speed: 0,
    abilities: { str: 1, dex: 1, con: 24, int: 1, wis: 10, cha: 10 }, cr: '0', creatureType: 'celestial',
    attacks: [], traits: 'Hatching.',
    immunities: ['fire', 'radiant'],
    unsupported: [
      'Ember Egg, Cosmic Phoenix\'in Rebirth from Ashes özelliğiyle oluşur; motor yumurtayı kendiliğinden yaratmaz',
      'Trait: Hatching (sonraki tur başında çatlama, 450 canla diriliş; yumurta kırılırsa Anka ölür)',
      'CR yok (yumurta); 0 yazıldı',
    ],
    dex: { type: 'celestial', alignment: 'Unaligned', conditionImmunities: ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Stunned', 'Unconscious'] },
    features: [
      ['trait', 'Hatching', 'Cosmic Phoenix 0 HP\'ye düşünce Supernova\'nın merkez altıgeninde oluşur; hareket etmez, eylemi yoktur. Sağ kalırsa sonraki tur başında çatlar ve Anka 450 canla kalkar. Kırılırsa (150 HP biterse) Anka dirilmez ve ölür.', 'It forms in the center hex of the Supernova when the Cosmic Phoenix drops to 0 Hit Points; it doesn\'t move and has no actions. If it survives, it hatches at the start of the next turn and the phoenix rises with 450 Hit Points. If it is destroyed (its 150 Hit Points run out), the phoenix is not reborn and dies.'],
    ],
  };
}

// ------------------------------------------------------------------ 4. Ocean-Nightmare (belge §4; Faz 1 gemide 700 HP, Faz 2 denizde 600 HP)
function oceanNightmare(phase) {
  const sea = phase === 2;
  const tentacle = melee('Tentacle', 20, '4d8+11', 'bludgeoning', 30, 3, [{ dice: '2d8', type: 'cold' }], 'The target has the Grappled condition (escape DC 24) and the Restrained condition (up to 8 targets)');
  const fling = saveAttack('Fling', { ability: 'dex', dc: 25, dice: '5d10', type: 'bludgeoning', rangeFt: 60,
    target: 'the Huge or smaller creature it is grappling, thrown up to 60 feet', failText: 'the target has the Prone condition' });
  const storm = saveAttack('Storm Lightning', { ability: 'dex', dc: 25, dice: '8d10', type: 'lightning', rangeFt: 120, recharge: 5, target: 'up to three creatures within 120 feet' });
  const swallow = saveAttack('Abyssal Swallow', { ability: 'dex', dc: 26, dice: '4d10+11', type: 'piercing', rangeFt: 30, half: false,
    target: 'one Huge or smaller creature it is grappling', failText: 'the target is swallowed (up to 4): it has the Blinded and Restrained conditions, has Total Cover, and takes 6d6 Acid damage at the start of each turn' });
  const ink = saveAttack('Ink Cloud', { ability: 'con', dc: 24, area: { shape: 'emanation', sizeFt: 30, origin: 'self', targets: 'all' }, recharge: 5, half: false, bonusAction: true,
    failText: 'the target has the Blinded and Poisoned conditions' });
  const multi = sea ? 'Multiattack: The Ocean-Nightmare makes three Tentacle attacks; it can replace one with Fling, Storm Lightning, or Abyssal Swallow.'
    : 'Multiattack: The Ocean-Nightmare makes three Tentacle attacks; it can replace one with Fling or Storm Lightning.';
  const traitNames = ['Amphibious', 'Siege Monster', 'Freedom of Movement', 'Legendary Resistance (3/Day, or 4/Day in Lair)', 'Dread Tide', 'Alpha Resonance', ...(sea ? ['Wounded Dreamer', 'Dreamer Stirs'] : ['Hull Crusher', 'Ship Sinks'])];
  return {
    id: sea ? 'ocean-nightmare-open-sea' : 'ocean-nightmare', name: sea ? 'Ocean-Nightmare (Open Sea)' : 'Ocean-Nightmare', size: 'G', ac: 24, hp: sea ? 600 : 700, speed: 30, swim: 100,
    abilities: { str: 32, dex: 12, con: 28, int: 24, wis: 24, cha: 26 }, saves: { str: 20, con: 18, int: 16, wis: 16 }, skills: { perception: 16 },
    cr: '30', multiattack: true, creatureType: 'monstrosity',
    attacks: [tentacle.atk, fling, storm, ...(sea ? [swallow, ink] : [])],
    traits: `${traitNames.join(', ')}. ${multi}`,
    resistances: ['thunder', 'fire'], immunities: ['cold', 'lightning'],
    unsupported: [
      `Faz ${phase} / 3 (ayrı harita: ${sea ? 'açık deniz / enkaz' : 'gemi güvertesi'}); fazlar ayrı savaş, motor faz geçişi yapmaz`,
      'Boyut: 19 altıgen (Gargantuan); çok altıgen yalnız multiHex açıkken',
      'Duyu: Truesight 120 ft, Telepati 1 mil',
      'Direnç: büyülü olmayan fiziksel hasar (motorda canavar büyüsüz direnci yok)',
      'Durum bağışıklığı: Frightened, Paralyzed, Restrained (yalnız Dungeondex)',
      'Trait: Siege Monster, Freedom of Movement, Dread Tide (30 ft aura), Alpha Resonance',
      ...(sea ? ['Trait: Wounded Dreamer, Dreamer Stirs (0 HP\'de ölmez; Faz 3 Titan of Nightmare)', 'Abyssal Swallow: yutma ve kusma yok; Ink Cloud kalıcı bulut değil (tek seferlik kurtarma)']
        : ['Trait: Hull Crusher (gemi gövdesine vuruş), Ship Sinks (700 HP bitince gemi batar, Faz 2)']),
      'Multiattack (kısmi): yerine geçen seçenekler ayrı eylem; Fling yalnız tuttuğu hedef; Storm Lightning tek hedef (en çok 3)',
      'Tentacle: aynı anda en çok 8 hedef',
      'Legendary Actions: puan bedelleri (her eylem 1 kullanım); Tidal Surge itmesi',
    ],
    riders: { Tentacle: { ...tentacle.ek, grapple: { escapeDc: 24, restrained: true }, status: 'uygulandı' }, Fling: { prone: {}, status: 'kısmen', unsupported: 'fırlatma' },
      ...(sea ? { 'Ink Cloud': { conditions: [{ condition: 'Blinded', owner: 'target', end: 'turnEnd', rounds: 1 }, { condition: 'Poisoned', owner: 'target', end: 'turnEnd', rounds: 1 }], status: 'kısmen', unsupported: 'kalıcı bulut' } } : {}) },
    dex: { type: 'monstrosity', alignment: 'Chaotic Evil', conditionImmunities: ['Frightened', 'Paralyzed', 'Restrained'] },
    efsanevi: { uses: 3, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §4a): Efsanevi Eylemler 3 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'tentacle', tr: 'Dokunaç', en: 'Tentacle', kind: 'strike', attack: 'Tentacle' },
      { id: 'storm-bolt', tr: 'Fırtına Şimşeği', en: 'Storm Bolt', kind: 'save', save: 'dex', dc: 25, rangeFt: 120, damage: '5d10', damageType: 'lightning' },
      { id: 'tidal-surge', tr: 'Gelgit Dalgası', en: 'Tidal Surge', kind: 'save', oncePerTurn: true, save: 'str', dc: 26, area: { shape: 'emanation', sizeFt: 15, origin: 'self' }, damage: '4d8', damageType: 'bludgeoning', conditions: ['Prone'], push: 15 },
    ] },
    features: [
      ['trait', 'Amphibious', 'Hem havada hem suda soluyabilir.', 'It can breathe air and water.'],
      ['trait', 'Siege Monster', 'Gemilere, nesnelere ve yapılara iki kat hasar verir.', 'It deals double damage to ships, objects, and structures.'],
      ['trait', 'Freedom of Movement', 'Büyüyle yavaşlatılamaz, tutulamaz, bağlanamaz.', 'Magic can\'t slow it, hold it, or bind it.'],
      ['trait', 'Legendary Resistance (3/Day, or 4/Day in Lair)', 'Başarısız kurtarma zarını başarılı sayar (günde 3, inde 4 kez).', 'If it fails a saving throw, it can choose to succeed instead (3/Day, or 4/Day in its lair).'],
      ['trait', 'Dread Tide', '30 ft aurasına giren ya da turuna orada başlayan düşman DC 23 WIS kurtarma zarı atar; kaybederse 1 tur saldırı ve kurtarma zarlarından 1d4 düşer.', 'A foe that enters its 30-foot aura or starts its turn there makes a DC 23 Wisdom saving throw. On a failure it subtracts 1d4 from attack rolls and saving throws for 1 round.'],
      ['trait', 'Alpha Resonance', 'Savaşta Alfa hattından (mavi) bir ejderha varsa, o ejderhanın gök gürültüsü hasarı bu yaratığın direncini yok sayar.', 'If an Alpha-line (blue) dragon is in the battle, that dragon\'s Thunder damage ignores this creature\'s Resistance.'],
      ...(sea ? [
        ['trait', 'Wounded Dreamer', 'Gemi savaşında yaralandığı için 600 canla başlar; Faz 1\'de zaten 700 hasar yemiştir.', 'Wounded in the ship battle, it starts with 600 Hit Points; it has already taken 700 damage in Phase 1.'],
        ['trait', 'Dreamer Stirs', '0 HP\'de ölmez: tutulanlar ve yutulanlar serbest kalır, bütün durumlar silinir. Parti kendini adaya atar ve Faz 3 (Titan of Nightmare) başlar.', 'It doesn\'t die at 0 Hit Points: grappled and swallowed creatures are freed and all conditions end. The party throws itself onto the island and Phase 3 (Titan of Nightmare) begins.'],
      ] : [
        ['trait', 'Hull Crusher', 'Siege Monster ile geminin gövdesine de vurur; gemi yalnız nesne olarak hasar alır. Gövdesi su altında, gemi kenarındadır; güvertedeki herkes yalnız dokunaçlarla savaşır.', 'With Siege Monster it also strikes the ship\'s hull; the ship takes damage only as an object. Its body is underwater at the ship\'s side; everyone on deck fights only its tentacles.'],
        ['trait', 'Ship Sinks', 'Yaratığın 700 canı bitince gemi kendiliğinden batar ve Faz 2 (açık deniz) başlar. Geminin gövde canının bitmesi fazı bitirmez.', 'When the creature\'s 700 Hit Points run out, the ship sinks on its own and Phase 2 (open sea) begins. The ship\'s hull running out of Hit Points doesn\'t end the phase.'],
      ]),
      ['action', 'Multiattack', sea ? 'Üç Tentacle saldırısı yapar; birinin yerine Fling, Storm Lightning ya da Abyssal Swallow kullanabilir.' : 'Üç Tentacle saldırısı yapar; birinin yerine Fling ya da Storm Lightning kullanabilir.', multi.replace(/^Multiattack: /, '')],
      ['action', 'Tentacle', trMelee(20, 30, '4d8+11', 'bludgeoning', [{ dice: '2d8', type: 'cold' }], '. Hedef Grappled (kaçış DC 24) ve Restrained olur (en çok 8 hedef)'), `${enMelee(tentacle.atk).replace(/\.$/, '')}. The target has the Grappled condition (escape DC 24) and the Restrained condition (up to 8 targets).`],
      ['action', 'Fling', 'Tuttuğu Huge ya da daha küçük bir yaratığı 60 ft fırlatır; hedef DC 25 DEX kurtarma zarı atar, kaybeden 5d10 ezici hasar alır ve Prone olur, başaran yarısını.', fling.damage],
      ['action', 'Storm Lightning (Recharge 5–6)', '120 ft içindeki 3 hedef DC 25 DEX kurtarma zarı atar; kaybeden 8d10 yıldırım hasarı alır, başaran yarısını.', storm.damage],
      ...(sea ? [
        ['action', 'Abyssal Swallow', 'Tuttuğu Huge ya da daha küçük bir hedef DC 26 DEX kurtarma zarı atar; kaybederse 4d10 + 11 delici hasar alır ve yutulur (en çok 4). Yutulan Blinded ve Restrained olur, tam siperdedir ve tur başı 6d6 asit hasarı alır. İçeriden bir turda 70 ya da daha çok hasar gelirse DC 25 CON kurtarma zarında başarısız olunca yutulanları 10 ft içine Prone kusar.', swallow.damage],
        ['bonus', 'Ink Cloud (Recharge 5–6)', '30 ft\'lik yoğun mürekkep bulutu salar. İçinde turuna başlayan DC 24 CON kurtarma zarı atar; kaybeden Blinded ve Poisoned olur.', ink.damage],
      ] : []),
      ['legendary', 'Tentacle', 'Bir Tentacle saldırısı yapar. Bedeli 1 puan.', 'It makes one Tentacle attack. Costs 1 point.'],
      ['legendary', 'Storm Bolt', 'Tek hedef DC 25 DEX kurtarma zarı atar; kaybederse 5d10 yıldırım hasarı alır. Bedeli 1 puan.', 'Dexterity Saving Throw: DC 25, one target. Failure: 5d10 Lightning damage. Costs 1 point.'],
      ['legendary', 'Tidal Surge', '15 ft içindekiler DC 26 STR kurtarma zarı atar; kaybeden 4d8 ezici hasar alır, 15 ft itilir ve Prone olur. Bedeli 2 puan.', 'Strength Saving Throw: DC 26, each creature within 15 feet. Failure: 4d8 Bludgeoning damage, a 15-foot push, and the Prone condition. Costs 2 points.'],
    ],
  };
}

// ------------------------------------------------------------------ 5. Titan of Nightmare (belge §5; Faz 3, 1.150 HP tek çubuk)
function titanOfNightmare() {
  const tentacle = melee('Eldritch Tentacle', 22, '5d8+12', 'bludgeoning', 45, 3, [{ dice: '3d8', type: 'psychic' }], 'The target has the Grappled condition (escape DC 26) and the Restrained condition (up to 12 targets)');
  const gaze = saveAttack('Maddening Gaze', { ability: 'int', dc: 27, dice: '8d10', type: 'psychic', rangeFt: 120, failText: 'the target has the Stunned condition for 1 round' });
  const fling = saveAttack('Cosmic Fling', { ability: 'dex', dc: 28, dice: '6d10', type: 'bludgeoning', extras: [{ dice: '3d8', type: 'force' }], rangeFt: 90,
    target: 'the Huge or smaller creature it is grappling, thrown to a point within 90 feet, and each creature within 10 feet of the landing point', failText: 'the target has the Prone condition' });
  const lightning = saveAttack('Void-Lightning Strike', { ability: 'dex', dc: 27, dice: '8d10', type: 'lightning', extras: [{ dice: '4d10', type: 'psychic' }], rangeFt: 180,
    target: 'up to three creatures within 180 feet', failText: 'the target can\'t maintain Concentration for 1 round' });
  const swallow = saveAttack('Abyssal Swallow', { ability: 'dex', dc: 28, dice: '4d10+12', type: 'piercing', rangeFt: 45, half: false,
    target: 'one Huge or smaller creature it is grappling', failText: 'the target is swallowed (up to 6), taking 8d6 Acid plus 6d6 Psychic damage at the start of each turn' });
  return {
    id: 'titan-of-nightmare', name: 'Titan of Nightmare', size: 'G', ac: 26, hp: 1150, speed: 40, fly: 60, swim: 120,
    abilities: { str: 34, dex: 14, con: 30, int: 30, wis: 28, cha: 30 }, saves: { str: 22, con: 20, int: 20, wis: 19, cha: 20 }, skills: { perception: 19 },
    cr: '35', multiattack: true, creatureType: 'aberration',
    attacks: [tentacle.atk, gaze, fling, lightning, swallow],
    traits: 'Uçma 60 ft. Amphibious, Siege Monster, Legendary Resistance (5/Day, or 6/Day in Lair), Non-Euclidean Aura, Alpha Resonance, The Sleeper Awakens. Multiattack: The Titan uses Maddening Gaze, then makes three Eldritch Tentacle attacks; it can replace two of them with Cosmic Fling, Void-Lightning Strike, or Abyssal Swallow.',
    resistances: ['force', 'necrotic', 'thunder'], immunities: ['lightning', 'psychic', 'acid', 'cold'],
    faz2: { esik: 0.5, not: { tr: 'The Sleeper Awakens: su ve kıyı zorlu arazi olur, düşmanlar her tur merkeze çekilir, aura 90 ft, Multiattack 4 dokunaç (yalnız günlük; ek can yok).', en: 'The Sleeper Awakens: water and shore become difficult terrain, foes are pulled toward the center each round, aura 90 ft, Multiattack 4 tentacles (log only; no extra Hit Points).' } },
    unsupported: [
      'Faz 3 / 3 (ada haritası); 1.150 HP tek can çubuğu',
      'Boyut: 19 altıgen (Gargantuan); çok altıgen yalnız multiHex açıkken',
      'Hız: Hover (yalnızca yürüme/uçma/yüzme kullanılır)',
      'Duyu: Truesight 180 ft, Telepati 10 mil',
      'Bağışıklık: büyülü olmayan fiziksel hasar (motorda büyüsüz bağışıklık yok)',
      'Durum bağışıklığı: 12 durum (yalnız Dungeondex)',
      'Trait: Siege Monster, Non-Euclidean Aura (60/90 ft Cosmic Madness), Alpha Resonance',
      'Trait: The Sleeper Awakens — yarı canda Faz 2 bloğu yalnız günlük notu; zorlu arazi, 15 ft çekim, 90 ft aura ve 4 dokunaç yok',
      'Multiattack (kısmi): Maddening Gaze ayrı eylem; yerine geçen seçenekler ayrı eylem',
      'Eldritch Tentacle: aynı anda en çok 12 hedef',
      'Cosmic Fling / Abyssal Swallow: yalnız tuttuğu hedef; fırlatma, yutma ve kusma yok',
      'Void-Lightning Strike: en çok 3 hedef (tek hedef), ikinci hasar (4d10 psychic) ve konsantrasyon yasağı',
      'Legendary Actions: puan bedelleri; Abyssal Toxic Ink Silenced durumu; Dream Call yok',
    ],
    riders: { 'Eldritch Tentacle': { ...tentacle.ek, grapple: { escapeDc: 26, restrained: true }, status: 'uygulandı' },
      'Maddening Gaze': { conditions: [{ condition: 'Stunned', owner: 'target', end: 'turnEnd', rounds: 1 }], status: 'uygulandı' },
      'Cosmic Fling': { prone: {}, status: 'kısmen', unsupported: 'ikinci hasar, fırlatma' } },
    dex: { type: 'aberration', alignment: 'Chaotic Evil', conditionImmunities: ['Blinded', 'Charmed', 'Exhaustion', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'] },
    efsanevi: { uses: 4, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §5): Efsanevi Eylemler 4 puan/tur; puan bedeli yok, her eylem 1 kullanım', actions: [
      { id: 'eldritch-storm-bolt', tr: 'Kozmik Fırtına Şimşeği', en: 'Eldritch Storm Bolt', kind: 'strike', attack: 'Void-Lightning Strike' },
      { id: 'abyssal-toxic-ink', tr: 'Uçurum Zehir Mürekkebi', en: 'Abyssal Toxic Ink', kind: 'save', oncePerTurn: true, save: 'con', dc: 27, area: { shape: 'emanation', sizeFt: 30, origin: 'self' }, conditions: ['Blinded', 'Poisoned'], moveAfter: 'full' },
    ] },
    features: [
      ['trait', 'Amphibious', 'Hem havada hem suda soluyabilir.', 'It can breathe air and water.'],
      ['trait', 'Siege Monster', 'Gemilere, nesnelere ve yapılara iki kat hasar verir.', 'It deals double damage to ships, objects, and structures.'],
      ['trait', 'Legendary Resistance (5/Day, or 6/Day in Lair)', 'Başarısız kurtarma zarını başarılı sayar (günde 5, inde 6 kez).', 'If it fails a saving throw, it can choose to succeed instead (5/Day, or 6/Day in its lair).'],
      ['trait', 'Non-Euclidean Aura', '60 ft içine giren ya da turuna orada başlayan düşman DC 26 WIS kurtarma zarı atar; kaybederse 1 tur Cosmic Madness yaşar: saldırı ve kurtarma zarlarından 1d6 düşer, tepki kullanamaz, 1d6\'da 1–2 gelirse ilk saldırısını en yakın müttefikine yapar.', 'A foe that enters the area within 60 feet or starts its turn there makes a DC 26 Wisdom saving throw. On a failure it suffers Cosmic Madness for 1 round: it subtracts 1d6 from attack rolls and saving throws, can\'t take Reactions, and on a 1–2 on a d6 makes its first attack against the nearest ally.'],
      ['trait', 'Alpha Resonance', 'Savaşta Alfa hattından (mavi) bir ejderha varsa, o ejderhanın gök gürültüsü hasarı bu yaratığın direncini yok sayar.', 'If an Alpha-line (blue) dragon is in the battle, that dragon\'s Thunder damage ignores this creature\'s Resistance.'],
      ['trait', 'The Sleeper Awakens', 'Titan canının yarısının altına inince (Bloodied) bir kez tetiklenir; ek can yok. Bütün su ve kıyı altıgenleri zorlu arazi olur, her tur başında düşmanlar DC 26 STR kurtarma zarında başarısız olursa merkeze 15 ft çekilir, aura 90 ft\'e çıkar ve Multiattack 4 dokunaç vurur.', 'It triggers once when the Titan drops below half its Hit Points (Bloodied); no extra Hit Points. All water and shore hexes become Difficult Terrain, at the start of each round foes that fail a DC 26 Strength saving throw are pulled 15 feet toward the center, the aura grows to 90 feet, and Multiattack strikes with 4 tentacles.'],
      ['action', 'Multiattack', 'Maddening Gaze kullanır; ardından üç Eldritch Tentacle saldırısı yapar, bunlardan ikisinin yerine Cosmic Fling, Void-Lightning Strike ya da Abyssal Swallow kullanabilir.', 'It uses Maddening Gaze, then makes three Eldritch Tentacle attacks; it can replace two of them with Cosmic Fling, Void-Lightning Strike, or Abyssal Swallow.'],
      ['action', 'Eldritch Tentacle', trMelee(22, 45, '5d8+12', 'bludgeoning', [{ dice: '3d8', type: 'psychic' }], '. Hedef Grappled (kaçış DC 26) ve Restrained olur (aynı anda en çok 12 hedef)'), `${enMelee(tentacle.atk).replace(/\.$/, '')}. The target has the Grappled condition (escape DC 26) and the Restrained condition (up to 12 targets at once).`],
      ['action', 'Cosmic Fling', 'Tuttuğu Huge ya da daha küçük bir yaratığı 90 ft fırlatır. Hedef ve varış noktasının 10 ft yarıçapındakiler DC 28 DEX kurtarma zarı atar; kaybeden 6d10 ezici ve 3d8 kuvvet hasarı alır ve Prone olur, başaran yarısını.', fling.damage],
      ['action', 'Void-Lightning Strike', '180 ft içindeki 3 hedef DC 27 DEX kurtarma zarı atar; kaybeden 8d10 yıldırım ve 4d10 psişik hasar alır ve 1 tur konsantrasyon sürdüremez, başaran yarısını.', lightning.damage],
      ['action', 'Abyssal Swallow', 'Tuttuğu Huge ya da daha küçük bir hedef DC 28 DEX kurtarma zarı atar; kaybederse 4d10 + 12 delici hasar alır ve yutulur (en çok 6). Yutulan tur başı 8d6 asit ve 6d6 psişik hasar alır. İçeriden bir turda 80 ya da daha çok hasar gelirse DC 27 CON kurtarma zarında başarısız olunca yutulanları 15 ft içine Prone kusar.', swallow.damage],
      ['action', 'Maddening Gaze', '120 ft içindeki tek hedef DC 27 INT kurtarma zarı atar; kaybederse 8d10 psişik hasar alır ve 1 tur Stunned olur, başaran yarısını.', gaze.damage],
      ['legendary', 'Eldritch Storm Bolt', 'Tek hedefe Void-Lightning Strike kullanır. Bedeli 1 puan.', 'It uses Void-Lightning Strike against one target. Costs 1 point.'],
      ['legendary', 'Abyssal Toxic Ink', 'Havada ya da suda 30 ft\'lik bulut salar: içindekiler DC 27 CON kurtarma zarı atar, kaybeden Blinded, Poisoned ve Silenced olur. Ardından hızı kadar hareket eder. Bedeli 2 puan.', 'It releases a 30-foot cloud in air or water: creatures in it make a DC 27 Constitution saving throw, and on a failure have the Blinded and Poisoned conditions and are Silenced. It then moves up to its Speed. Costs 2 points.'],
      ['legendary', 'Dream Call', '120 ft içindeki bir hedef DC 27 WIS kurtarma zarı atar; kaybederse 30 ft yaklaşır ve silahını düşürür. Bedeli 2 puan.', 'Wisdom Saving Throw: DC 27, one target within 120 feet. Failure: the target moves 30 feet closer and drops its weapon. Costs 2 points.'],
    ],
  };
}

// ------------------------------------------------------------------ 6. mücevher ejderhaları (belge §6; saldırılar türetilir)
// Saldırı türetme (Mühür Ruhu yöntemi, KATALOG-F-TASARIM §4): CR'nin DMG 2014 "Monster Statistics by CR" satırı. Saldırı bonusu
// tablodan; tur hasarı bandının orta noktasının %60'ı yakın dövüşe (kalanı nefes ve efsanevi eylem): Bite %40 (üçte biri hattın türünde
// d6), iki Claw %30'ar. Yetişkin Tail = Bite'ın fiziksel kısmı, 20 ft erişim. Body Sweep / Wing Buffet: Claw zarı ezici + Prone, DEX,
// 10 ft. Elemental Pulse: nefes zar sayısının dörtte biri d10, CON, 20 ft, yarı hasar. DC'ler hattın nefes DC'si.
const DMG = { 5: [6, 33, 38], 6: [6, 39, 44], 7: [6, 45, 50], 8: [7, 51, 56], 16: [9, 99, 104], 17: [10, 105, 110], 18: [10, 111, 116], 19: [10, 117, 122],
  20: [10, 123, 140], 25: [12, 213, 230], 26: [12, 231, 248], 27: [13, 249, 266], 28: [13, 267, 284], 30: [14, 303, 320] };
const STAGES = [
  { tr: 'Yavru', en: 'Wyrmling', base: { str: 19, dex: 12, con: 17, int: 12, wis: 12, cha: 14 }, size: 'M', reach: 5, cone: 30 },
  { tr: 'Genç', en: 'Young', base: { str: 23, dex: 12, con: 21, int: 14, wis: 13, cha: 17 }, size: 'L', reach: 10, cone: 60 },
  { tr: 'Yetişkin', en: 'Adult', base: { str: 27, dex: 14, con: 25, int: 16, wis: 15, cha: 21 }, size: 'H', reach: 15, cone: 90 },
];
const dice = (target, die, flat) => `${Math.max(1, Math.round((target - flat) / ((die + 1) / 2)))}d${die}${flat ? `+${flat}` : ''}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const TURETILEN = [];

function gemDragon(hat, i) {
  const H = HATLAR[hat], S = STAGES[i], E = H.evre[i];
  const id = H.kimlik[i];
  const ab = { ...S.base };
  ab[H.baskin[0]] = Math.min(30, ab[H.baskin[0]] + 4);
  ab[H.baskin[1]] = Math.min(30, ab[H.baskin[1]] + 2);
  const pb = profOf(E.cr), sm = mod(ab.str);
  const [bonus, lo, hi] = DMG[Number(E.cr)];
  const T = Math.round(((lo + hi) / 2) * 0.6);
  const type = H.hasar, trT = TR_TUR[type];
  const elem = `${Math.max(1, Math.round((T * 0.4) / 3 / 3.5))}d6`;
  const biteDice = dice(T * 0.4 - avg(elem), 10, sm);
  const clawDice = dice(T * 0.3, 8, sm);
  const bite = melee('Bite', bonus, biteDice, 'piercing', S.reach, 1, [{ dice: elem, type }]);
  const claw = melee('Claw', bonus, clawDice, 'slashing', S.reach, 2);
  const adult = i === 2;
  const tail = adult ? melee('Tail', bonus, biteDice, 'bludgeoning', 20, 0) : null;
  const breathName = `${EN_TUR(type)} Breath`;
  const ek = H.ek[i];
  const breath = saveAttack(breathName, { ability: E.yet, dc: E.dc, dice: E.zar, type, recharge: 5,
    area: { shape: 'cone', sizeFt: S.cone, origin: 'self', targets: 'all' }, failText: `the target ${ek.en}` });
  const sonra = adult ? H.sonra : undefined;
  const sweepName = H.kanatsiz ? 'Body Sweep' : 'Wing Buffet';
  const pulseDice = `${Math.max(1, Math.round(Number(E.zar.split('d')[0]) / 4))}d10`;
  const renk = `${H.ad.tr} hattı (${H.renk.tr})`;
  const hiz = H.hiz;
  const walk = hiz.yurume[i], fly = hiz.ucus?.[i], swim = hiz.yuzme?.[i], climb = hiz.tirmanma?.[i];
  TURETILEN.push({ id, cr: E.cr, bonus, T, bite: `${biteDice} + ${elem} ${type}`, claw: clawDice, ...(adult ? { tail: biteDice, sweep: clawDice, pulse: pulseDice } : {}) });
  const features = [
    ['trait', 'Carrier\'s Imprint', `${renk} ${H.tip.tr}. Yumurta, Taşıyıcı'nın hizalanma kararlarına (${H.eksen.tr}) ve en sık kullandığı yetenek ve beceri zarlarına (baskın ${H.baskin.map((a) => a.toUpperCase()).join(' + ')}) göre bu hatta çatlar. Nefes kurtarma DC'si Taşıyıcı'nın baskın niteliğine göre ölçeklenir. Evreler: Yavru (1×1, CR 5–8) → Genç (2×2, CR 16–20) → Yetişkin (3×3, CR 25–30, 3 efsanevi puan).`,
      `${H.ad.en} line (${H.renk.en}) ${H.tip.en}. The egg hatches into this line based on its Carrier's alignment choices (${H.eksen.en}) and most used ability and skill rolls (dominant ${H.baskin.map((a) => a.toUpperCase()).join(' + ')}). The breath save DC scales with the Carrier's dominant ability. Stages: Wyrmling (1×1, CR 5–8) → Young (2×2, CR 16–20) → Adult (3×3, CR 25–30, 3 legendary points).`],
    ...(H.amfibi ? [['trait', 'Amphibious', 'Hem havada hem suda soluyabilir.', 'It can breathe air and water.'],
      ['trait', 'Sea Camouflage', 'Sudayken gizlenme (Stealth) kontrollerinde avantajlıdır.', 'It has Advantage on Dexterity (Stealth) checks while in water.']] : []),
    ...(H.suzulme ? [['trait', 'Wingless Flight', 'Kanatsız uçar ve havada süzülür (hover).', 'It flies without wings and can hover.']] : []),
    ...(i === 1 ? [['trait', 'Mount Bond', `Uçan ya da yüzen binek olarak Taşıyıcı'yı taşır. ${H.bag.tr}`, `It carries its Carrier as a mount. ${H.bag.en}`]] : []),
    ...(adult ? [['trait', 'Attribute 20 Lock', H.pasif.tr, H.pasif.en]] : []),
    ['action', 'Multiattack', 'Bir Bite ve iki Claw saldırısı yapar.', 'The dragon makes one Bite attack and two Claw attacks.'],
    ['action', 'Bite', trMelee(bonus, S.reach, biteDice, 'piercing', [{ dice: elem, type }]), enMelee(bite.atk)],
    ['action', 'Claw', trMelee(bonus, S.reach, clawDice, 'slashing'), enMelee(claw.atk)],
    ...(adult ? [['action', 'Tail', trMelee(bonus, 20, biteDice, 'bludgeoning'), enMelee(tail.atk)]] : []),
    ['action', `${breathName} (Recharge 5–6)`, `${S.cone} ft konideki herkes DC ${E.dc} ${E.yet.toUpperCase()} kurtarma zarı atar; kaybeden ${E.zar} ${trT} hasarı alır${ek.tr}, başaran yarısını.${sonra ? ` ${sonra.tr}` : ''}`,
      `${breath.damage}${sonra ? ` ${sonra.en}` : ''}`],
    ...(adult ? [
      ['legendary', 'Tail', 'Bir Tail saldırısı yapar. Bedeli 1 puan.', 'The dragon makes one Tail attack. Costs 1 point.'],
      ['legendary', sweepName, `10 ft içindekiler DC ${E.dc} DEX kurtarma zarı atar; kaybeden ${spaced(clawDice)} ezici hasar alır ve Prone olur.${H.kanatsiz ? ' Gövdesini savurur (kanatsız).' : ' Kanat çırpar.'} Bedeli 2 puan.`,
        `Dexterity Saving Throw: DC ${E.dc}, each creature within 10 feet. Failure: ${spaced(clawDice)} Bludgeoning damage and the Prone condition. Costs 2 points.`],
      ['legendary', 'Elemental Pulse', `20 ft içindekiler DC ${E.dc} CON kurtarma zarı atar; kaybeden ${pulseDice} ${trT} hasarı alır, başaran yarısını. Bedeli 2 puan.`,
        `Constitution Saving Throw: DC ${E.dc}, each creature within 20 feet. Failure: ${pulseDice} ${EN_TUR(type)} damage. Success: Half damage. Costs 2 points.`],
    ] : []),
  ];
  const traits = features.filter((f) => f[0] === 'trait').map((f) => f[1]);
  return {
    id, name: cap(id), size: S.size, ac: E.ac, hp: E.hp, speed: walk, ...(fly ? { fly } : {}), ...(swim ? { swim } : {}), abilities: ab,
    saves: { dex: mod(ab.dex) + pb, wis: mod(ab.wis) + pb }, skills: { perception: mod(ab.wis) + 2 * pb, stealth: mod(ab.dex) + pb },
    darkvision: 120, cr: E.cr, multiattack: true, creatureType: 'dragon',
    attacks: [bite.atk, claw.atk, ...(tail ? [tail.atk] : []), breath],
    traits: `${fly ? `Uçma ${fly} ft. ` : ''}${traits.join(', ')}. Multiattack: The dragon makes one Bite attack and two Claw attacks.`,
    immunities: [type],
    unsupported: [
      `Boyut: ${['1×1 = Medium', '2×2 = Large (3 altıgen)', '3×3 = Huge (7 altıgen)'][i]}; çok altıgen yalnız multiHex açıkken`,
      ...(climb || H.suzulme ? [`Hız: ${[climb ? `Climb ${climb} ft` : '', H.suzulme ? 'Hover' : ''].filter(Boolean).join(', ')} (motorda yok)`] : []),
      'Trait: Carrier\'s Imprint (yumurta kuluçka sistemi ve Taşıyıcı\'ya göre Save DC ertelendi; DC kayıtta sabit)',
      ...(H.amfibi ? ['Trait: Sea Camouflage (suda gizlenme avantajı)'] : []),
      ...(i === 1 ? ['Trait: Mount Bond (binek bağı ve binicinin kazanımları)'] : []),
      ...(adult ? ['Trait: Attribute 20 Lock (Taşıyıcı\'nın nitelik pasifi)'] : []),
      `${breathName}: ${ek.tr.replace(/^, /, '').replace(/^ ve /, '')} — yalnız veriyle bağlanan durumlar uygulanır`,
      `Türetilen değerler (CR tablosu, KATALOG-F2-PROSPEKTUS.md): yetenek puanları, Bite/Claw${adult ? '/Tail, Body Sweep/Wing Buffet, Elemental Pulse' : ''}, kurtarma, beceriler, bağışıklık, karanlık görüş, Recharge, yarı hasar`,
    ],
    riders: { Bite: bite.ek, ...(H.ekVeri[i] ? { [breathName]: { ...H.ekVeri[i], status: 'kısmen' } } : {}) },
    dex: { type: 'dragon', alignment: H.hizalanma, conditionImmunities: [], ...(climb ? { tirmanma: climb } : {}), ...(H.suzulme ? { suzulme: true } : {}) },
    ...(adult ? { efsanevi: { uses: 3, srd: 'KATALOG-F2 (KATALOG-F2-OZELLIKLER.md §6): Yetişkin 3 efsanevi puan; puan bedeli yok, her eylem 1 kullanım; değerler türetildi', actions: [
      { id: 'tail', tr: 'Kuyruk', en: 'Tail', kind: 'strike', attack: 'Tail' },
      { id: slug(sweepName), tr: H.kanatsiz ? 'Gövde Savuruşu' : 'Kanat Darbesi', en: sweepName, kind: 'save', oncePerTurn: true, save: 'dex', dc: E.dc, area: { shape: 'emanation', sizeFt: 10, origin: 'self' }, damage: clawDice, damageType: 'bludgeoning', conditions: ['Prone'] },
      { id: 'elemental-pulse', tr: 'Element Nabzı', en: 'Elemental Pulse', kind: 'save', oncePerTurn: true, save: 'con', dc: E.dc, half: true, area: { shape: 'emanation', sizeFt: 20, origin: 'self' }, damage: pulseDice, damageType: type },
    ] } } : {}),
    features,
  };
}

// ------------------------------------------------------------------ çıktı
const DEFS = [captiveDragon(), dragonOfHexonia('a'), dragonOfHexonia('b'), cosmicPhoenix('kozmik-anka'), cosmicPhoenix('kozmik-anka-savas'), emberEgg(),
  oceanNightmare(1), oceanNightmare(2), titanOfNightmare(),
  ...Object.keys(HATLAR).flatMap((h) => [0, 1, 2].map((i) => gemDragon(h, i)))];

// GORSEL-MUCEVHER-EJDERHA: mücevher ejderhası görselleri data/boss-gorsel.json `mucevher`den (scripts/boss-gorsel.mjs --grup mucevher).
// Savaş jetonu ve Dungeondex vitrini `avatar` (src/battle/avatar.ts monsterAvatar); jeton boyutu boyut sınıfından (ölçek yazılmaz).
// Dosyası olmayan kayıtta avatar yok (yedek jeton/glif).
const MUCEVHER_GORSEL = fs.existsSync(P('data/boss-gorsel.json')) ? (JSON.parse(fs.readFileSync(P('data/boss-gorsel.json'), 'utf8')).mucevher ?? {}) : {};
for (const d of DEFS) { const dosya = MUCEVHER_GORSEL[d.id]?.dosya; if (dosya && fs.existsSync(P(`public/${dosya}`))) d.avatar = dosya; }

const MONSTER_KEYS = ['id', 'name', 'size', 'ac', 'hp', 'speed', 'fly', 'swim', 'avatar', 'abilities', 'saves', 'skills', 'darkvision', 'cr', 'multiattack', 'faz2', 'attacks',
  'traits', 'resistances', 'immunities', 'vulnerabilities', 'unsupported', 'creatureType', 'kaynak', 'riders'];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
const featKey = (id, f) => `${id}/${f[0]}:${slug(f[1])}`;
const clean = (r) => Object.fromEntries(Object.entries(r ?? {}).filter(([, v]) => v).map(([a, v]) => [a, { ...v, status: v.status ?? 'uygulandı' }]));
const visible = DEFS.filter((d) => !d.dex.gizli);

const out = {
  _not: 'Görev KATALOG-F2 / KATALOG-F2-DUZELT: Kadim Yaratıklar ve mücevher ejderhaları (24 kayıt; tek kaynak harita/belgeler/KATALOG-F2-OZELLIKLER.md). `node scripts/katalog-f2-kadim.mjs` üretir, elle düzenlenmez. `canavarlar`: Monster biçimi, Mühür Ruhu kayıtlarıyla aynı katalog alanları (`creatureType`, `swim`, `kaynak: katalog-f2`, saldırı ekleri `riders`); `loadMonsters` `katalogMonsters` dizisine ekler. `dex`: Dungeondex yan tablosu (tür, hizalanma, durum bağışıklığı, tırmanma/süzülme, yön `yon`, `gizli` varyant); `dexGizli` Dungeondex\'te gösterilmeyen varyantlar. `ozellikler`: Dungeondex özellik/eylem listesi. `hatlar`: mücevher hatları (nefes türünün tek yeri betikteki HATLAR). Türetilen değerler harita/belgeler/KATALOG-F2-PROSPEKTUS.md.',
  hatlar: Object.fromEntries(Object.entries(HATLAR).map(([k, h]) => [k, { ad: h.ad, renk: h.renk, hasar: h.hasar, tip: h.tip, hizalanma: h.hizalanma, kimlikler: h.kimlik }])),
  dexGizli: DEFS.filter((d) => d.dex.gizli).map((d) => d.id),
  canavarlar: DEFS.map((d) => pick({ ...d, kaynak: KAYNAK, riders: clean(d.riders) }, MONSTER_KEYS)),
  dex: Object.fromEntries(DEFS.map((d) => [d.id, d.dex])),
  yer: Object.fromEntries(DEFS.map((d) => [d.id, { tema: 'Kadim Yaratıklar', ortam: [] }])),
  ozellikler: Object.fromEntries(DEFS.map((d) => [d.id, d.features.map((f) => ({ anahtar: featKey(d.id, f), ad: f[1], tur: f[0] }))])),
};
fs.writeFileSync(P('data/canavarlar-kadim.json'), `${JSON.stringify(out, null, 1)}\n`);

// Açıklamalar: bu kimliklerin ve eski F2 kimliklerinin anahtarları silinip sona eklenir (dosyanın geri kalanı aynı kalır).
const ids = new Set(DEFS.map((d) => d.id));
const ours = (id) => ids.has(id) || ESKI.test(id);
for (const [file, lang] of [['data/aciklamalar-tr-canavar.json', 2], ['data/aciklamalar-en-canavar.json', 3]]) {
  const j = JSON.parse(fs.readFileSync(P(file), 'utf8'));
  const kept = Object.fromEntries(Object.entries(j.canavar).filter(([k]) => !ours(k.split('/')[0])));
  for (const d of DEFS) for (const f of d.features) kept[featKey(d.id, f)] = f[lang];
  j.canavar = kept;
  fs.writeFileSync(P(file), `${JSON.stringify(j, null, 1)}\n`);
}

// Efsanevi eylemler: kayıt başına tek satır, `monsters` nesnesinin sonuna (bu ve eski F2 kimliklerinin satırları ya da blokları önce silinir).
let ef = fs.readFileSync(P('data/efsanevi.json'), 'utf8').replace(/\r\n/g, '\n');
const lines = ef.split('\n');
const keep = [];
for (let n = 0; n < lines.length; n++) {
  const m = /^ {2}"([^"]+)": \{(.*)$/.exec(lines[n]);
  if (m && ours(m[1])) {
    if (m[2].trim() === '') { while (n < lines.length && !/^ {2}\},?$/.test(lines[n])) n++; }
    continue;
  }
  keep.push(lines[n]);
}
ef = keep.join('\n');
const yuva = ef.indexOf('\n },\n "yuva"');
let head = ef.slice(0, yuva).replace(/,\s*$/, '');
const rows = DEFS.filter((d) => d.efsanevi).map((d) => `  "${d.id}": ${JSON.stringify(d.efsanevi)}`);
ef = `${head},\n${rows.join(',\n')}${ef.slice(yuva)}`;
JSON.parse(ef);
fs.writeFileSync(P('data/efsanevi.json'), ef);

// Dungeondex görsel eşlemesi: görünen kayıtlar için satır, `npm run dd-gorsel` biçiminde (avatar varsa jeton, yoksa yedek: görsel hazırlanıyor).
const gp = P('data/dungeondex-gorsel-esleme.json');
let g = fs.readFileSync(gp, 'utf8');
const gs = g.indexOf('\n  "canavar": {');
const ge = g.indexOf('\n  }', gs + 5);
const block = g.slice(gs, ge).split('\n').filter((l) => { const m = /^ {4}"([^"]+)":/.exec(l); return !(m && ours(m[1])); }).join('\n').replace(/,\s*$/, '');
const grows = visible.map((d) => `    ${JSON.stringify(d.id)}: ${JSON.stringify(d.avatar ? { kaynak: 'jeton', ref: d.avatar, durum: 'var', ad: d.name } : { kaynak: 'yedek', ref: 'yedek:nesne', durum: 'yedek', ad: d.name })}`);
g = `${g.slice(0, gs)}${block},\n${grows.join(',\n')}${g.slice(ge)}`;
JSON.parse(g);
fs.writeFileSync(gp, g);

console.log(`KATALOG-F2: ${DEFS.length} kayıt (${visible.length} Dungeondex'te), ${Object.values(out.ozellikler).flat().length} özellik/eylem, ${rows.length} efsanevi kayıt.`);
if (process.argv.includes('--turetilen')) console.table(TURETILEN);
