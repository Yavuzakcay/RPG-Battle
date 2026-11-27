// KATALOG-1 F Aşama 2: Mühür Ruhu bossları ve evrim çizgileri (30 yaratık) veriye yazılır.
// Kaynak: harita/belgeler/KATALOG-F-TASARIM.md §1, §5, §8 (onaylı). Çıktı:
//   data/bosslar-muhur.json (30 kayıt, Monster biçimi + katalog alanları; saldırı ekleri kayıtta `riders`)
//   data/efsanevi.json `monsters.<boss>` (3 efsanevi eylem), data/canavar-yetenekleri.json `<kimlik>` (sanat, çekme, pasifler)
// Betik idempotenttir (aynı anahtarları yeniden yazar). Çalıştırma: node scripts/katalog-f-bosslar.mjs
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const mod = (n) => Math.floor((n - 10) / 2);
const atk = (name, bonus, phys, physType, reachFt = 10, repeat = 1, extra) => ({
  name, bonus, damage: `${phys} ${cap(physType)}${extra ? ` plus ${extra.dice} ${cap(extra.type)}` : ''} damage.`,
  damageDice: phys, damageType: physType, ranged: false, reachFt, repeat,
});
const breath = (name, area, save, dc, dice, type, recharge = 5) => ({
  name, bonus: 0, damage: `${cap(save)} Saving Throw: DC ${dc}. Failure: ${dice} ${cap(type)} damage. Success: Half damage.`,
  damageDice: dice, damageType: type, save: { ability: save, dc, halfOnSave: true }, area: { ...area, targets: 'all' }, recharge, repeat: 0, ranged: false,
});
const cone = (ft) => ({ shape: 'cone', sizeFt: ft, origin: 'self' });
const line = (ft) => ({ shape: 'line', sizeFt: ft, widthFt: 10, origin: 'self' });
const condUntil = (condition, ability, dc) => ({ conditionSave: { ability, dc }, conditions: [{ condition, owner: 'source', end: 'turnEnd' }] });

// ------------------------------------------------------------------ bosslar (§5, §10)
const B = [
  { id: 'cimbombom', ad: 'Cimbombom', unvan: { tr: 'Cehennem Aslanı', en: 'Lion of the Hell' }, eskiAd: 'Erimiş Örs Muhafızı', cizgi: 'ates', el: 'fire', vuln: 'cold', cr: '26', size: 'H', hp: 627, ac: 19,
    speed: 50, ab: { str: 30, dex: 16, con: 30, int: 10, wis: 18, cha: 22 }, saves: { dex: 11, con: 18, wis: 12 }, pb: 8, atkB: 12, dc: 21,
    ma: [['Bite', '2d8+10', 'piercing', 1], ['Claw', '2d8+10', 'slashing', 2]], elHit: '7d10',
    br: breath('Hellfire Roar', cone(60), 'dex', 21, '19d10', 'fire'),
    la: [['ember-halo', 'Kor Halesi', 'Ember Halo', 'dex', '4d8', 'fire', {}], ['flame-spit', 'Alev Tükürüğü', 'Flame Spit', null, '6d10'], ['tail-sweep', 'Kuyruk Süpürmesi', 'Tail Sweep', 'dex', '2d8+10', 'bludgeoning', { conditions: ['Prone'] }]],
    sanat: { id: 'molten-anvil-burst', tr: 'Erimiş Örs Patlaması', en: 'Molten Anvil Burst', area: { shape: 'emanation', sizeFt: 15, origin: 'self' }, save: 'dex', damage: '5d6', damageType: 'fire', push: 10 },
    ganimet: 'ember-core', ortam: ['volkanik-demirhane', 'lav-tapinagi', 'derinlikler-lav-salonu', 'volkan'],
    not: { tr: 'Taş Uyanışı: Kor Çekirdeği yarılıyor; alev artık soğukla sönmüyor.', en: 'Stone Awakening: the Ember Core splits; cold no longer quenches the flame.' },
    gmNot: 'Taş Uyanışı (PDF): arena kenarındaki altıgenleri 3 tur alev yüzeyi yap (place_surface); her tur başında bossun 15 ft içindekilere 2d6 ateş uygula.' },
  { id: 'kongark', ad: 'Kongark', unvan: { tr: 'Boşluğun Kongu', en: 'Kong of the Void' }, eskiAd: 'Yörünge Nöbetçisi', cizgi: 'kuvvet', el: 'force', vuln: 'psychic', cr: '25', size: 'H', hp: 578, ac: 19,
    speed: 40, climb: true, ab: { str: 30, dex: 14, con: 30, int: 8, wis: 16, cha: 14 }, saves: { str: 18, con: 18, wis: 11 }, pb: 8, atkB: 12, dc: 21,
    ma: [['Fist', '2d8+10', 'bludgeoning', 2], ['Grab', '2d8+10', 'bludgeoning', 1]], elHit: '6d10', riders: { Grab: { grapple: { escapeDc: 21, restrained: false } } },
    br: breath('Void Roar', cone(60), 'str', 21, '18d10', 'force'), brRider: { prone: { save: { ability: 'str', dc: 21 } } },
    la: [['gravity-ring', 'Yerçekimi Halkası', 'Gravity Ring', 'str', '4d8', 'force', { conditions: ['Prone'] }], ['void-stone', 'Boşluk Taşı', 'Void Stone', null, '6d10'], ['back-sweep', 'Arka Kol Savuruşu', 'Backhand Sweep', 'dex', '1d8+10', 'bludgeoning', { push: 15 }]],
    sanat: { id: 'star-collapse', tr: 'Yıldız Çöküşü', en: 'Star Collapse', area: { shape: 'emanation', sizeFt: 10, origin: 'self' }, save: 'str', damage: '6d6', damageType: 'force', conditions: ['Prone'] },
    pull: { id: 'gravity-pull', tr: 'Çekim', en: 'Gravity Pull', rangeFt: 30, pullFt: 15 },
    ganimet: 'void-fracture', ortam: ['dag-karakol', 'kanyon-koprusu', 'isinlanma-salonu'],
    not: { tr: 'Taş Uyanışı: Boşluk Kırığı göğsünde açılıyor; artık hiçbir ses aklına ulaşmıyor.', en: 'Stone Awakening: the Void Fracture opens in its chest; no voice reaches its mind now.' },
    gmNot: 'Taş Uyanışı (PDF): düşük yerçekimi (itme/çekme +5 ft, elle); her 2 turda bir herkesi merkeze 15 ft çek.' },
  { id: 'cerbones', ad: 'Cerbones', unvan: { tr: 'Krematoryum', en: 'Crematorium' }, eskiAd: 'Kemik Toplayıcı Lord', cizgi: 'nekrotik', el: 'necrotic', vuln: 'radiant', cr: '24', size: 'H', hp: 527, ac: 19,
    speed: 50, ab: { str: 30, dex: 14, con: 28, int: 10, wis: 16, cha: 16 }, saves: { con: 16, wis: 10 }, pb: 7, atkB: 12, dc: 21,
    ma: [['Bite', '1d8+10', 'piercing', 3]], elHit: '6d10', riders: { Bite: { drainMax: { type: 'necrotic' } } },
    br: breath('Crematorium Breath', cone(60), 'con', 21, '16d10', 'necrotic'),
    la: [['ash-halo', 'Kül Halesi', 'Ash Halo', 'con', '3d8', 'necrotic', {}], ['black-spark', 'Kara Kıvılcım', 'Black Spark', null, '5d10'], ['tail-sweep', 'Kuyruk Süpürmesi', 'Tail Sweep', 'dex', '1d8+10', 'bludgeoning', { conditions: ['Prone'] }]],
    sanat: { id: 'black-flame-cleave', tr: 'Kara Alev Kesiği', en: 'Black Flame Cleave', area: { shape: 'line', sizeFt: 25, widthFt: 5, origin: 'self' }, save: 'con', damage: '5d6', damageType: 'necrotic', effect: { noHeal: true } },
    ganimet: 'sepulcher-orb', ortam: ['orman-kemik-acikligi', 'derinlikler-mezar-labirenti'],
    not: { tr: 'Taş Uyanışı: Mezar Küresi kararıyor; ışık artık kemiğe işlemiyor.', en: 'Stone Awakening: the Sepulcher Orb darkens; light no longer pierces the bone.' },
    gmNot: 'Taş Uyanışı (PDF): her tur başında arenanın çevresinden 2 iskelet (Skeleton) çağır; bossun saldırılarına +1d8 kara alev ve 10 ft içindeki iyileşmeleri yarıya indir (elle).' },
  { id: 'mirage', ad: 'Mirage', unvan: { tr: 'Can Hırsızı', en: 'Life Stealer' }, eskiAd: 'Ayna Zihin Avcısı', cizgi: 'psisik', el: 'psychic', vuln: 'force', cr: '24', size: 'M', hp: 525, ac: 19,
    speed: 40, ab: { str: 30, dex: 18, con: 22, int: 20, wis: 16, cha: 22 }, saves: { dex: 11, int: 12, cha: 13 }, pb: 7, atkB: 12, dc: 21, condImm: ['Charmed', 'Frightened'],
    ma: [['Soul Claw', '1d8+10', 'slashing', 3]], elHit: '6d10', riders: { 'Soul Claw': condUntil('Charmed', 'wis', 21) },
    br: breath('Mind Wave', cone(60), 'int', 21, '16d10', 'psychic'),
    la: [['mirror-scream', 'Ayna Çığlığı', 'Mirror Scream', 'int', '3d8', 'psychic', { conditions: ['Stunned'] }], ['mind-needle', 'Zihin İğnesi', 'Mind Needle', null, '5d10'], ['reflection-sweep', 'Yansıma Süpürmesi', 'Reflection Sweep', 'dex', '1d8+10', 'slashing', { push: 10 }]],
    sanat: { id: 'mind-breaker-scream', tr: 'Zihin Kıran Çığlık', en: 'Mind-Breaker Scream', area: { shape: 'emanation', sizeFt: 20, origin: 'self' }, save: 'int', damage: '5d6', damageType: 'psychic', conditions: ['Stunned'] },
    ganimet: 'whisper-crystal', ortam: ['col-sutun-harabesi', 'isinlanma-salonu', 'beyaz-sehir-saray-avlusu'],
    not: { tr: 'Taş Uyanışı: Vesvese Kristali çatlıyor; suretlerin hangisinin gerçek olduğunu artık kuvvet de göstermiyor.', en: 'Stone Awakening: the Whisper Crystal cracks; not even force reveals which image is real.' },
    gmNot: 'Taş Uyanışı (PDF): psişik sis (anlatım); boss 2–3 gerçekçi suret yaratır (Mirror Image); her tur başında bir oyuncuya Frightened (set_condition).' },
  { id: 'gongar', ad: 'Gongar', unvan: { tr: 'Çan Kabuklu Vahşi', en: 'Bell Shell Brute' }, eskiAd: 'Kör Çan Devi', cizgi: 'gurultu', el: 'thunder', vuln: 'lightning', cr: '23', size: 'H', hp: 465, ac: 20,
    speed: 30, ab: { str: 28, dex: 10, con: 28, int: 6, wis: 14, cha: 10 }, saves: { str: 16, con: 16 }, pb: 7, atkB: 11, dc: 20, condImm: ['Deafened'], senses: 'Blindsight 60 ft',
    ma: [['Bell Slam', '1d8+9', 'bludgeoning', 2], ['Shell Ram', '1d8+9', 'bludgeoning', 1]], elHit: '6d10',
    riders: { 'Shell Ram': { conditions: [{ condition: 'Deafened', saveEnds: { ability: 'con', dc: 20 }, maxRounds: 10 }] } },
    br: breath('Bell Roar', cone(60), 'con', 20, '15d10', 'thunder'), brRider: { prone: { save: { ability: 'con', dc: 20 } } },
    la: [['bell-tremor', 'Çan Titreşimi', 'Bell Tremor', 'con', '3d8', 'thunder', { conditions: ['Deafened'] }], ['echo-shot', 'Yankı Mermisi', 'Echo Shot', null, '5d10'], ['shell-spin', 'Kabuk Dönüşü', 'Shell Spin', 'dex', '1d8+9', 'bludgeoning', { conditions: ['Prone'] }]],
    sanat: { id: 'canyon-rend', tr: 'Kanyon Yırtığı', en: 'Canyon Rend', area: { shape: 'line', sizeFt: 30, widthFt: 10, origin: 'self' }, save: 'con', damage: '5d6', damageType: 'thunder', push: 15, conditions: ['Prone', 'Deafened'] },
    passive: { siegeMonster: true },
    ganimet: 'resonance-seal', ortam: ['col-kanyon-nehri', 'col-sutun-harabesi', 'kanyon-koprusu'],
    not: { tr: 'Taş Uyanışı: Çınlama Mührü kabuğu kaplıyor; yıldırım artık metale tutunmuyor.', en: 'Stone Awakening: the Resonance Seal coats the shell; lightning no longer clings to the metal.' },
    gmNot: 'Taş Uyanışı (PDF): her tur başında bossun 10 ft içindekiler DC 15 CON yoksa Prone (set_condition); siper sütunları yıkılmaya başlar (anlatım).' },
  { id: 'lightaur', ad: 'Lightaur', unvan: { tr: 'Göksel Boğa', en: 'Bull of Celestial' }, eskiAd: 'Kırık Hale Şövalyesi', cizgi: 'isilti', el: 'radiant', vuln: 'necrotic', cr: '23', size: 'L', hp: 432, ac: 19, type: 'celestial',
    speed: 50, ab: { str: 28, dex: 12, con: 26, int: 10, wis: 18, cha: 20 }, saves: { con: 15, wis: 11, cha: 12 }, pb: 7, atkB: 11, dc: 20, condImm: ['Blinded'], regen: 10, illumination: true,
    ma: [['Gore', '1d8+9', 'piercing', 1], ['Hoof', '1d8+9', 'bludgeoning', 2]], elHit: '6d10',
    riders: { Gore: { ...condUntil('Blinded', 'con', 20), charge: { feet: 20, prone: true, save: { ability: 'str', dc: 20 } } } },
    br: breath('Celestial Breath', cone(60), 'con', 20, '15d10', 'radiant'), brRider: condUntil('Blinded', 'con', 20),
    la: [['halo-flare', 'Hale Parıltısı', 'Halo Flare', 'con', '3d8', 'radiant', { conditions: ['Blinded'] }], ['ray-spear', 'Işın Mızrağı', 'Ray Spear', null, '5d10'], ['rear-hoof', 'Arka Toynak', 'Rear Hoof', 'dex', '1d8+9', 'bludgeoning', { push: 10 }]],
    sanat: { id: 'golden-judgment', tr: 'Altın Yargı Sütunu', en: 'Golden Judgment Pillar', area: { shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 60 }, save: 'con', damage: '6d6', damageType: 'radiant', conditions: ['Blinded'] },
    ganimet: 'blinding-sun-shard', ortam: ['kasaba-demirci-tapinak', 'buzul-tapinak', 'lav-tapinagi'],
    not: { tr: 'Taş Uyanışı: Kör Güneş Parçası tavanı yırtıyor; artık hiçbir gölge onu yaralamıyor.', en: 'Stone Awakening: the Blinding Sun Shard tears the ceiling; no shadow can wound it now.' },
    gmNot: 'Taş Uyanışı (PDF): katedral tavanı açılır, harita parlak ışıkla dolar (anlatım); her tur başında bossun 15 ft içindekiler DC 15 CON yoksa 1 tur Blinded (set_condition).' },
  { id: 'hydraxe', ad: 'Hydraxe', unvan: { tr: 'Sülfür Hidrası', en: 'Sulphur Hydra' }, eskiAd: 'Sülfür Hidrası', cizgi: 'asit', el: 'acid', vuln: 'fire', cr: '22', size: 'H', hp: 419, ac: 19,
    speed: 30, swim: 40, ab: { str: 28, dex: 12, con: 28, int: 4, wis: 12, cha: 8 }, saves: { con: 16 }, pb: 7, atkB: 11, dc: 20,
    ma: [['Bite', '1d8+9', 'piercing', 3]], elHit: '5d10',
    br: breath('Sulphur Spray', line(60), 'dex', 20, '13d10', 'acid'),
    la: [['acid-drool', 'Asit Salyası', 'Acid Drool', 'dex', '3d8', 'acid', {}], ['acid-spit', 'Asit Tükürüğü', 'Acid Spit', null, '4d10'], ['tail-sweep', 'Kuyruk Süpürmesi', 'Tail Sweep', 'dex', '1d8+9', 'bludgeoning', { conditions: ['Prone'] }]],
    sanat: { id: 'sulphur-deluge', tr: 'Sülfür Tufanı', en: 'Sulphur Deluge', area: { shape: 'sphere', sizeFt: 15, origin: 'point', rangeFt: 30 }, save: 'dex', damage: '5d6', damageType: 'acid', effect: { ac: -3 }, minute: true },
    ganimet: 'dissolution-drop', ortam: ['batak-cukur', 'batak-adalar', 'batak-kale', 'bataklik'],
    not: { tr: 'Taş Uyanışı: Erime Damlası boyunlara yayılıyor; ateş artık dağlamıyor.', en: 'Stone Awakening: the Dissolution Drop spreads through the necks; fire no longer cauterizes.' },
    gmNot: 'Taş Uyanışı (PDF): kopan başın 10 ft çevresi kalıcı asit yüzeyi (place_surface); her yakın dövüş isabetinde saldırana 1d8 asit (elle).' },
  { id: 'mothraq', ad: 'Mothraq', unvan: { tr: 'Spor Güvesi', en: 'Spore Moth' }, eskiAd: 'Spor Hükümdarı', cizgi: 'zehir', el: 'poison', vuln: 'radiant', cr: '22', size: 'H', hp: 421, ac: 19,
    speed: 20, fly: 60, ab: { str: 28, dex: 18, con: 26, int: 8, wis: 14, cha: 10 }, saves: { dex: 11, con: 15 }, pb: 7, atkB: 11, dc: 20, condImm: ['Poisoned'],
    ma: [['Proboscis', '1d8+9', 'piercing', 1], ['Wing', '1d8+9', 'bludgeoning', 2]], elHit: '5d10',
    riders: { Proboscis: { conditions: [{ condition: 'Poisoned', saveEnds: { ability: 'con', dc: 20 }, maxRounds: 10 }] } },
    br: breath('Spore Storm', cone(60), 'con', 20, '13d10', 'poison'), brRider: { conditions: [{ condition: 'Poisoned', owner: 'source', end: 'turnEnd' }] },
    la: [['spore-burst', 'Spor Patlaması', 'Spore Burst', 'con', '3d8', 'poison', { conditions: ['Poisoned'] }], ['venom-needle', 'Zehir İğnesi', 'Venom Needle', null, '4d10'], ['wing-sweep', 'Kanat Süpürmesi', 'Wing Sweep', 'dex', '1d8+9', 'bludgeoning', { push: 10 }]],
    sanat: { id: 'plague-cloud', tr: 'Veba Bulutu', en: 'Plague Cloud', area: { shape: 'sphere', sizeFt: 15, origin: 'point', rangeFt: 30 }, save: 'con', damage: '4d6', damageType: 'poison', conditions: ['Poisoned'] },
    pull: { id: 'spore-pull', tr: 'Spor Çekimi', en: 'Spore Pull', rangeFt: 30, pullFt: 30, needsCondition: 'Poisoned' },
    ganimet: 'venom-essence', ortam: ['derinlikler-mantar-magarasi', 'orman-kemik-acikligi', 'orman-heykel-golu'],
    not: { tr: 'Taş Uyanışı: Ağu Özü kanatlara işliyor; ışık artık sporları yakmıyor.', en: 'Stone Awakening: the Venom Essence seeps into the wings; light no longer burns the spores.' },
    gmNot: 'Taş Uyanışı (PDF): arenaya 3 hareketli zehir bulutu (place_surface); bossun kendi turunda 20 ft içindeki ölü düşmanlar spor hizmetkârına döner (Game Master çağırır).' },
  { id: 'stormer', ad: 'Stormer', unvan: { tr: 'Gök Gürültüsü Aygırı', en: 'Thunder Stallion' }, eskiAd: 'Şimşek Süvarisi', cizgi: 'yildirim', el: 'lightning', vuln: null, cr: '21', size: 'L', hp: 338, ac: 19,
    speed: 90, ab: { str: 28, dex: 20, con: 26, int: 8, wis: 14, cha: 12 }, saves: { dex: 12, con: 15 }, pb: 7, atkB: 11, dc: 20, bonusActions: ['dash', 'disengage'],
    ma: [['Hoof', '2d8+9', 'bludgeoning', 2]], elHit: '7d10', riders: { Hoof: { charge: { feet: 20, prone: true, save: { ability: 'str', dc: 20 } } } },
    br: breath('Lightning Gale', line(100), 'dex', 20, '12d10', 'lightning'),
    la: [['thunder-hoof', 'Şimşek Toynağı', 'Thunder Hoof', 'dex', '2d8', 'lightning', {}], ['chain-lightning', 'Zincir Şimşek', 'Chain Lightning', null, '2d6', null, {}, 3], ['back-kick', 'Arka Tekme', 'Back Kick', 'dex', '1d8+9', 'bludgeoning', { push: 10 }]],
    sanat: { id: 'sky-spear', tr: 'Gök Mızrağı', en: 'Sky Spear', area: { shape: 'sphere', sizeFt: 10, origin: 'point', rangeFt: 60 }, save: 'dex', damage: '6d6', damageType: 'lightning', effect: { noReactions: true } },
    ganimet: 'storm-spire', ortam: ['dag-kayalik', 'dag-kopru', 'dag-nobetci', 'dag'],
    not: { tr: 'Taş Uyanışı: Fırtına Mili yeleye saplanıyor; gök artık onun için çakıyor, fırtına onu bir zırh gibi sarıyor.', en: 'Stone Awakening: the Storm Spire pierces the mane; the sky strikes for it now, wrapping it like armor.' },
    gmNot: 'Taş Uyanışı (PDF): yağmur şiddetlenir, rastgele su altıgenleri açılır (place_surface su); her turun sonunda en yüksek irtifadaki ya da metal zırhlı hedefe yıldırım (Game Master seçer).' },
  { id: 'wolfgang', ad: 'Wolfgang', unvan: { tr: 'Tipi Kurdu', en: 'Blizzard Wolf' }, eskiAd: 'Tipi Yutan Dev', cizgi: 'soguk', el: 'cold', vuln: 'fire', cr: '20', size: 'H', hp: 319, ac: 19,
    speed: 50, climb: true, ab: { str: 26, dex: 14, con: 26, int: 8, wis: 14, cha: 10 }, saves: { con: 14, wis: 8 }, pb: 6, atkB: 10, dc: 19, iceWalk: true,
    ma: [['Bite', '1d8+8', 'piercing', 1], ['Claw', '1d8+8', 'slashing', 1]], elHit: '6d10', riders: { Bite: condUntil('Restrained', 'str', 19) },
    br: breath('Blizzard Breath', cone(60), 'con', 19, '10d10', 'cold'), brRider: { conditions: [{ condition: 'Restrained', owner: 'source', end: 'turnEnd' }] },
    la: [['frost-halo', 'Ayaz Halesi', 'Frost Halo', 'con', '2d8', 'cold', { effect: { speedMult: 0.5 } }], ['ice-spear', 'Buz Mızrağı', 'Ice Spear', null, '3d10'], ['tail-sweep', 'Kuyruk Süpürmesi', 'Tail Sweep', 'dex', '1d8+8', 'bludgeoning', { conditions: ['Prone'] }]],
    sanat: { id: 'rime-breath', tr: 'Kırağı Nefesi', en: 'Rime Breath', area: { shape: 'cone', sizeFt: 20, origin: 'self' }, save: 'con', damage: '5d6', damageType: 'cold', conditions: ['Restrained'] },
    ganimet: 'frost-heart', ortam: ['buzul-kayalik', 'buzul-acik', 'buzul-tapinak', 'buzul-kamp'],
    not: { tr: 'Taş Uyanışı: Ayaz Kalbi kükrüyor; alev artık buzunu eritmiyor.', en: 'Stone Awakening: the Frost Heart roars; flame no longer melts its ice.' },
    gmNot: 'Taş Uyanışı (PDF): haritanın yarısı kaygan buz yüzeyine döner (place_surface buz); tipi görüş menzilini 30 ft\'e düşürür (anlatım); buz üstündekilere boss avantajla vurur (elle).' },
];

// ------------------------------------------------------------------ evrim çizgileri (§8)
const L = {
  ates: [{ id: 'cim', cr: 3, speed: 40 }, { id: 'cimbom', cr: 10, speed: 50, br: ['cone', 30, 'dex'] }],
  soguk: [{ id: 'doggie', cr: 2, speed: 40, iceWalk: true }, { id: 'wolfie', cr: 8, speed: 50, climb: true, br: ['cone', 30, 'con', 'Restrained'], iceWalk: true }],
  yildirim: [{ id: 'sparkle', cr: 2, speed: 60, bonusActions: ['disengage'] }, { id: 'thunderse', cr: 8, speed: 70, br: ['line', 50, 'dex'] }],
  gurultu: [{ id: 'twinkle', cr: 3, speed: 25, senses: 'Blindsight 30 ft' }, { id: 'gongi', cr: 9, speed: 30, br: ['cone', 30, 'con', 'Prone'], senses: 'Blindsight 60 ft', siege: true }],
  asit: [{ id: 'hydrop', cr: 2, speed: 20, swim: 30 }, { id: 'hydras', cr: 8, speed: 30, swim: 40, br: ['line', 30, 'dex'] }],
  zehir: [{ id: 'sporlet', cr: 2, speed: 10, fly: 30, poisonedImm: true }, { id: 'mothcoon', cr: 8, speed: 20, fly: 50, br: ['cone', 30, 'con', 'Poisoned'], pull: true }],
  isilti: [{ id: 'lumbo', cr: 3, speed: 40, illumination: true }, { id: 'lighty', cr: 9, speed: 50, br: ['cone', 30, 'con', 'Blinded'], regen: 5 }],
  nekrotik: [{ id: 'cerbit', cr: 3, speed: 40 }, { id: 'cerbedo', cr: 9, speed: 50, br: ['cone', 30, 'con'] }],
  psisik: [{ id: 'mirit', cr: 3, speed: 35 }, { id: 'mirath', cr: 9, speed: 40, size: 'M', br: ['cone', 30, 'int'] }],
  kuvvet: [{ id: 'kongcuk', cr: 3, speed: 30, climb: true }, { id: 'kongilla', cr: 9, speed: 40, climb: true, br: ['cone', 30, 'str', 'Prone'] }],
};
const ATK_NAMES = { ates: ['Bite', 'piercing'], soguk: ['Bite', 'piercing'], yildirim: ['Hoof', 'bludgeoning'], gurultu: ['Bell Slam', 'bludgeoning'], asit: ['Bite', 'piercing'],
  zehir: ['Proboscis', 'piercing'], isilti: ['Gore', 'piercing'], nekrotik: ['Bite', 'piercing'], psisik: ['Soul Claw', 'slashing'], kuvvet: ['Fist', 'bludgeoning'] };
const TIER = {
  2: { hp: 60, ac: 13, atk: 5, dc: 12, n: 1, phys: '1d10+3', el: '2d6', ab: [16, 14, 14] },
  3: { hp: 75, ac: 14, atk: 5, dc: 12, n: 2, phys: '1d8+3', el: '1d6', ab: [16, 14, 14] },
  8: { hp: 150, ac: 16, atk: 7, dc: 16, n: 2, phys: '2d8+5', el: '2d8', br: '4d6', ab: [20, 14, 18] },
  9: { hp: 170, ac: 16, atk: 7, dc: 16, n: 2, phys: '2d8+5', el: '2d10', br: '4d6', ab: [20, 14, 18] },
  10: { hp: 190, ac: 17, atk: 8, dc: 16, n: 2, phys: '2d8+6', el: '3d8', br: '5d6', ab: [22, 14, 20] },
};

const monsters = [];
// efsanevi.json elle biçimli (kısmen tek satır): yalnız bizim anahtarlar tek satır olarak eklenir/yenilenir.
let efsText = fs.readFileSync('data/efsanevi.json', 'utf8');
const efsanevi = { monsters: {} };
const yetenek = read('data/canavar-yetenekleri.json');

const base = (o) => ({
  id: o.id, name: o.name, ...(o.size ? { size: o.size } : {}), ac: o.ac, hp: o.hp, speed: o.speed, ...(o.fly ? { fly: o.fly } : {}),
  abilities: o.ab, ...(o.saves ? { saves: o.saves } : {}), darkvision: o.dv, cr: o.cr, attacks: o.attacks, traits: o.traits,
  multiattack: o.attacks.filter((a) => a.repeat > 0).reduce((n, a) => n + a.repeat, 0) > 1,
  ...(o.regen ? { regeneration: o.regen } : {}), ...(o.bonusActions ? { bonusActions: o.bonusActions } : {}),
  resistances: [], immunities: [o.el], vulnerabilities: o.vuln ? [o.vuln] : [], unsupported: o.unsupported,
  creatureType: o.type ?? 'fiend', ...(o.swim ? { swim: o.swim } : {}),
});
const unsupportedOf = (o) => [
  ...(o.condImm?.length ? [`Durum bağışıklığı: ${o.condImm.join(', ')}`] : []),
  ...(o.senses ? [`Duyu: ${o.senses}`] : []),
  ...(o.climb ? ['Hız: Climb 30 ft'] : []),
  ...(o.iceWalk ? ['Trait: Ice Walk'] : []),
  ...(o.illumination ? ['Trait: Illumination'] : []),
];

for (const b of B) {
  const attacks = b.ma.map(([n, phys, t, rep]) => atk(n, b.atkB, phys, t, 10, rep, { dice: b.elHit, type: b.el }));
  attacks.push(b.br);
  const riders = {};
  for (const [n] of b.ma) riders[n] = { extra: [{ dice: b.elHit, type: b.el }], ...(b.riders?.[n] ?? {}), status: 'uygulandı' };
  if (b.brRider) riders[b.br.name] = { ...b.brRider, status: 'uygulandı' };
  monsters.push({
    ...base({ ...b, name: `${b.ad}, ${b.unvan.en}`, dv: 120, attacks, unsupported: unsupportedOf(b), traits: 'Legendary Resistance (3/Day). Mühür Ruhu (KATALOG-1 F).' }),
    kaynak: 'katalog-1', sinif: 'muhur-ruhu', element: b.el, kademe: 3, cizgi: b.cizgi, eskiAd: b.eskiAd, unvan: b.unvan,
    ganimet: b.ganimet, ortam: b.ortam, gorsel: null,
    faz2: { ...(b.vuln ? { zayiflikKaldir: [b.vuln] } : { geciciCan: 42 }), nefesDoldur: true, nefesAlan: 1.25, not: b.not },
    gmNot: b.gmNot, riders, katalog: { kaynak: "Kaltakkıran'ın Paladin Zırhı ve On Mühür Taşı Sistemi", bolum: '§5–§6', tasarim: 'harita/belgeler/KATALOG-F-TASARIM.md §5' },
  });
  efsanevi.monsters[b.id] = {
    uses: 3, srd: 'KATALOG-1 F (özgün; harita/belgeler/KATALOG-F-TASARIM.md §5)',
    actions: b.la.map(([id, tr, en, save, dice, type, extra = {}, count]) => save
      ? { id, tr, en, kind: 'save', save, dc: b.dc, area: { shape: 'emanation', sizeFt: 10, origin: 'self' }, damage: dice, damageType: type, half: true, oncePerTurn: true, ...extra }
      : { id, tr, en, kind: 'rays', count: count ?? 1, dice, damageType: b.el, bonus: b.atkB, rangeFt: 120, oncePerTurn: true }),
  };
  const s = b.sanat;
  yetenek[b.id] = {
    abilities: [
      { id: s.id, tr: s.tr, en: s.en, cost: 'action', kind: 'save', uses: 1, save: s.save, dc: 16, area: s.area, damage: s.damage, damageType: s.damageType, half: true,
        ...(s.conditions ? { conditions: s.conditions } : {}), ...(s.push ? { push: s.push } : {}), ...(s.effect ? { effect: s.effect } : {}), ...(s.minute ? { minute: true } : {}) },
      ...(b.pull ? [{ id: b.pull.id, tr: b.pull.tr, en: b.pull.en, cost: 'bonus', kind: 'pull', rangeFt: b.pull.rangeFt, pullFt: b.pull.pullFt, ...(b.pull.needsCondition ? { needsCondition: b.pull.needsCondition } : {}) }] : []),
    ],
    ...(b.passive ? { passive: b.passive } : {}),
  };

  // Sv.1 ve Sv.2
  const line2 = L[b.cizgi];
  for (const [k, e] of line2.entries()) {
    const t = TIER[e.cr];
    const [nm, pt] = ATK_NAMES[b.cizgi];
    const attacks2 = [atk(nm, t.atk, t.phys, pt, 5, t.n, { dice: t.el, type: b.el })];
    const riders2 = { [nm]: { extra: [{ dice: t.el, type: b.el }], status: 'uygulandı' } };
    if (e.br) {
      const [shape, ft, save, cond] = e.br;
      const br2 = breath(`Lesser ${b.br.name}`, shape === 'cone' ? cone(ft) : line(ft), save, t.dc, t.br, b.el);
      attacks2.push(br2);
      if (cond) riders2[br2.name] = { ...(cond === 'Prone' ? { prone: { save: { ability: save, dc: t.dc } } } : { conditions: [{ condition: cond, owner: 'source', end: 'turnEnd' }] }), status: 'uygulandı' };
    }
    const [s1, d1, c1] = t.ab;
    const o = {
      id: e.id, name: cap(e.id), size: e.size ?? (k === 0 ? 'S' : 'L'), ac: t.ac, hp: t.hp, speed: e.speed, fly: e.fly, el: b.el, vuln: b.vuln, type: b.type,
      ab: { str: s1, dex: d1, con: c1, int: 6, wis: 12, cha: 8 }, cr: String(e.cr), dv: 60, attacks: attacks2, regen: e.regen, bonusActions: e.bonusActions, swim: e.swim,
      traits: 'Mühür Ruhu (KATALOG-1 F).',
      unsupported: unsupportedOf({ condImm: k === 1 ? b.condImm : e.poisonedImm ? ['Poisoned'] : undefined, senses: e.senses, climb: e.climb, iceWalk: e.iceWalk, illumination: e.illumination }),
    };
    monsters.push({
      ...base(o), kaynak: 'katalog-1', sinif: 'muhur-ruhu', element: b.el, kademe: k + 1, cizgi: b.cizgi,
      ganimet: `${k === 0 ? 'cracked' : 'awakened'}-elemental-stone-${b.el}`, ortam: b.ortam, gorsel: null, riders: riders2,
      katalog: { tasarim: 'harita/belgeler/KATALOG-F-TASARIM.md §8' },
    });
    if ((e.siege || e.pull)) {
      yetenek[e.id] = {
        ...(e.pull ? { abilities: [{ id: 'spore-pull', tr: 'Spor Çekimi', en: 'Spore Pull', cost: 'bonus', kind: 'pull', rangeFt: 20, pullFt: 20, needsCondition: 'Poisoned' }] } : {}),
        ...(e.siege ? { passive: { siegeMonster: true } } : {}),
      };
    }
  }
}

// BOSS-GORSEL-1 bağlaması: görsel data/boss-gorsel.json'dan (dosya yoksa `gorsel: null`, avatar yok → yedek jeton).
// Savaş jetonu `Monster.avatar` (src/battle/avatar.ts monsterAvatar). Ölçek (Sv.1 0,25 / Sv.2 0,6 / Sv.3 1) veride kalır, jetona bağlanmadı.
const bossGorsel = fs.existsSync('data/boss-gorsel.json') ? read('data/boss-gorsel.json').gorseller : {};
for (const m of monsters) {
  const dosya = bossGorsel[m.id]?.dosya ?? null;
  m.gorsel = dosya;
  if (dosya) m.avatar = dosya;
}

write('data/bosslar-muhur.json', {
  _not: 'KATALOG-1 F Aşama 2: Mühür Ruhu bossları (Sv.3) ve evrim çizgileri (Sv.1, Sv.2), 30 kayıt. scripts/katalog-f-bosslar.mjs üretir, elle düzenlenmez. Tasarım harita/belgeler/KATALOG-F-TASARIM.md. Görsel ve savaş jetonu (`gorsel`, `avatar`) data/boss-gorsel.json üzerinden (BOSS-GORSEL-1); dosyası olmayan kayıtta `gorsel: null` ve yedek jeton. Saldırı ekleri kayıtta `riders` (loadMonsters ortak tabloya ekler).',
  canavarlar: monsters,
});
for (const [id, v] of Object.entries(efsanevi.monsters)) {
  const lineOf = `\n  "${id}": ${JSON.stringify(v)}`;
  const re = new RegExp(`\\n  "${id}": \\{.*\\}(,?)(?=\\n)`);
  if (re.test(efsText)) efsText = efsText.replace(re, (_m, comma) => lineOf + comma);
  else {
    const anchor = '\n },\n "yuva"';
    if (!efsText.includes(anchor)) throw new Error('efsanevi.json: "yuva" çapası bulunamadı');
    efsText = efsText.replace(anchor, `,${lineOf}${anchor}`);
  }
}
JSON.parse(efsText);
fs.writeFileSync('data/efsanevi.json', efsText);
// canavar-yetenekleri.json tek boşluk girintili, sonda satır sonu yok (özgün biçim).
fs.writeFileSync('data/canavar-yetenekleri.json', JSON.stringify(yetenek, null, 1));
// sim:boss satırları (§7): çizgi başına Sv.1 (3. seviye), Sv.2 (9. seviye), Sv.3 (20. seviye; 12 sınıflık duman partileri).
const SENARYO = { ates: 'volkan', soguk: 'k29-buzul-kayalik', yildirim: 'k29-dag-kayalik', gurultu: 'k29-col-kanyon-nehri', asit: 'k29-batak-cukur',
  zehir: 'derin-mantar', isilti: 'k35-kasaba-demirci-tapinak', nekrotik: 'orman-kemik', psisik: 'k29-col-sutun-harabesi', kuvvet: 'k29-dag-karakol' };
const simBoss = read('data/sim-boss.json');
simBoss.bosslar = simBoss.bosslar.filter((x) => !x.katalog);
for (const b of B) {
  const [s1, s2] = L[b.cizgi];
  const sen = SENARYO[b.cizgi];
  simBoss.bosslar.push(
    { id: s1.id, ad: `${cap(s1.id)} (Sv.1)`, senaryo: sen, seviye: 3, normal: { [s1.id]: 2 }, kolay: { [s1.id]: 1 }, element: b.el, cizgi: b.cizgi, katalog: true },
    { id: s2.id, ad: `${cap(s2.id)} (Sv.2)`, senaryo: sen, seviye: 9, normal: { [s2.id]: 1, [s1.id]: 2 }, kolay: { [s2.id]: 1 }, element: b.el, cizgi: b.cizgi, katalog: true },
    { id: b.id, ad: `${b.ad} (Sv.3)`, senaryo: sen, seviye: 20, normal: { [b.id]: 1, [s2.id]: 1 }, kolay: { [b.id]: 1 }, element: b.el, cizgi: b.cizgi, katalog: true },
  );
}
write('data/sim-boss.json', simBoss);
console.log(`${monsters.length} yaratık yazıldı.`);
