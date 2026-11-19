# SD9: Game Master kurulum ekranı denetimi ve yeni düzen

Kullanıcı kararı: "10 yaşında bir çocuk anlasın". Yalnız arayüz: SD9 aşamasında hiçbir satır kaldırılmadı; SD9B ile 7 altyapı satırı kurulumdan gizlendi (bölüm 5); varsayılanlar, saklama anahtarları ve savaş kaydındaki değerler aynı. "Kaldırma adayı" işaretliler altyapı satırlarıdır; kullanıcı bu tablodan seçecek.

Üretim: `node scripts/sd9-kurulum-tablo.mjs` (veri: `data/kural-kontrol.json`, `data/ev-kurallari.json`, `data/kurulum-gruplari.json`).

## 1. Üst düzey satırlar

| Satır | Saklama | Kim değiştirir | Yer |
|---|---|---|---|
| Zar modu (otomatik / yalnızca oyuncular / herkes) | `createMapBattle` `diceMode` (kayda yazılır) | Game Master | Üstte |
| Yapay zekâ zorluğu: Parti | `yz.zorluk.party` | Game Master | Üstte |
| Yapay zekâ zorluğu: Düşmanlar | `yz.zorluk.enemies` | Game Master | Üstte |
| Hedefler (haritanın hedefleri, özel hedef) | `goals` | Game Master | Üstte |
| Oda kuralları: Taşıma yükü | `rpg-battle-tasima` | Game Master | Üstte (SD8 katı) |
| Oda kuralları: Alignment (+3 alt seçenek) | `rpg-battle-deneysel.hizalanma*` | Game Master | Üstte (SD8 katı) |
| Oda kuralları: Keşif modu | `rpg-battle-onizleme.discovery` | Game Master | Üstte (SD8 katı) |
| Oda kuralları: İpucu rozetleri | `rpg-battle-onizleme.hints` | Game Master | Üstte (SD8 katı) |
| Oda kuralları: Yolculuk (deneme) | `rpg-battle-deneysel.yolculuk` | Game Master | Üstte (SD8 katı) |
| Çok altıgenli yaratıklar (deneysel) | `BattleState.multiHex` | Game Master | Gelişmiş |
| Uyuyan gruplar (alarm durumu) | `groupStates` | Game Master | Gelişmiş |
| Ev kuralları (aşağıda 2.) | `BattleState.houseRules` | Game Master | Gelişmiş |
| Harita mekanikleri (aşağıda 3.) | `map.ruleToggles` / `map.ruleParams` | Game Master | Gelişmiş |

## 2. Ev kuralları (23)

| Kimlik | Ad | Varsayılan | Sefer | Yer |
|---|---|---|---|---|
| `suYildirim` | Su yıldırımı yayar (bağlı ≤ 7 altıgen) | açık |  | Gelişmiş > Ev kuralları |
| `buhar` | Ateş + su = buhar (1 tur yoğun örtü) | açık |  | Gelişmiş > Ev kuralları |
| `donma` | Soğuk + su = buz | açık |  | Gelişmiş > Ev kuralları |
| `erime` | Ateş + buz = su | açık |  | Gelişmiş > Ev kuralları |
| `zehirPatlama` | Zehir bulutu + ateş = patlama | açık |  | Gelişmiş > Ev kuralları |
| `barutPatlama` | Barut fıçısı patlar | kapalı | evet | Gelişmiş > Ev kuralları |
| `alarmKosusu` | Alarm koşusu (haber taşıyan) | kapalı | evet | Gelişmiş > Ev kuralları |
| `asitHavuzu` | Asit havuzu | kapalı | evet | Gelişmiş > Ev kuralları (gizli) |
| `moralSistemi` | Moral (tam mod): 0'da Çökmüş, eşik cezaları, toparlama, zafer ödülü (data/moral.json; kural sürümü 20) | kapalı |  | Gelişmiş > Ev kuralları |
| `karadulCemberi` | Karadul Çemberi (Druid alt sınıfı, ev kuralı): Büyüleyici Bakış, Örümcek Biçimi, Karadul Zehri, Tatlı Tuzak, Ağ Duyusu, Son Öpücük | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_imparator` | İmza alt sınıf: İmparator (Fighter, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_infazci` | İmza alt sınıf: İnfazcı (Rogue, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_ciftci` | İmza alt sınıf: Çiftçi (Ranger, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_dunganga` | İmza alt sınıf: Dunganga (Sorcerer, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_astrolog` | İmza alt sınıf: Astrolog (Warlock, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_geride_kalan` | İmza alt sınıf: Geride Kalanın Yolu (Barbarian, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_sair` | İmza alt sınıf: Şair Koleji (Bard, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_bilge` | İmza alt sınıf: Yaşlı Bilge Disiplini (Monk, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_hizir` | İmza alt sınıf: Hızır Yemini (Paladin, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `imza_harita` | İmza alt sınıf: Harita Öğretisi (Wizard, ev kuralı; data/imza.json, kural sürümü 23) | kapalı |  | Gelişmiş > Ev kuralları (gizli) |
| `carpmaHasari` | Çarpma hasarı: zorla hareket engelde yarıda kalırsa kalan her altıgen için 1d6 kuvvet (en çok 3d6); çarpılan yaratık da aynısını ayrı zarla alır (SRD'de yok; kural sürümü 24+) | açık |  | Gelişmiş > Ev kuralları |
| `hizalanmaMoral` | Hizalanma ↔ Moral bağı: vicdan çatışması, iç huzur, yeni yol, savrulma (hizalanma ve moralSistemi de açıkken; savaş hesabına girmez) | kapalı |  | Gelişmiş > Ev kuralları |
| `hizalanma` | Hizalanma (Düzen/İyilik eksenleri, Game Master paneli ve günlük; savaş hesabına girmez) | kapalı |  | Gelişmiş > Ev kuralları |

## 3. Harita mekanikleri (114; her haritada yalnız o haritayı ilgilendirenler görünür)

| Kimlik | Ad | Tür | Varsayılan | Grup | Kaldırma adayı |
|---|---|---|---|---|---|
| `freeHexTarget` | Alan/atma etkileri ve (sürüm 81+) tek hedefli saldırı/save büyüleri hedefsiz her altıgene atılabilir (boş zeminde boşa gider, suya/çimene tepkime verir) | global | açık | Diğer (altyapı) | **kaldırma adayı** (Diğer'de kaldı) |
| `waterSurfaceDecay` | Suda yüzey etkileri azalsın (gres/yağ her tur yarıya iner, alev söner) | global | açık | Yüzey ve su tepkimeleri |  |
| `hiddenObjects` | Gizli nesneleri oyunculardan sakla (komşuya girince ya da pasif Algıyla bulunur) | global | açık | Harita (lav, derin su, gizli nesne…) |  |
| `deepWaterLimit` | Çok derin su (kıyıdan uzak derin suya yalnızca yüzücü, suda yürüyen, uçan) | global | açık | Harita (lav, derin su, gizli nesne…) |  |
| `greaseFlammable` | Gres yanıcıdır (ateş tutuşturur; yanıcı haneler ateşli büyüyle hedeflenir) | global | açık | Yüzey ve su tepkimeleri |  |
| `heightMove` | Yükseklik: tırmanma ve uçurumlar (çıkış maliyeti, 2+ seviye duvar, Atletizm ile tırmanma) | global | açık | Harita (lav, derin su, gizli nesne…) |  |
| `heightFall` | Düşme hasarı (yükseklik katmanı: 10 ft başına 1d6, Prone) | global | açık | Harita (lav, derin su, gizli nesne…) |  |
| `heightCombat` | Yüksek zemin (seviye farkıyla avantaj/dezavantaj, menzil, kenar siperi) | global | açık | Harita (lav, derin su, gizli nesne…) |  |
| `heightSight` | Yükseklik görüşü keser (tepe, sur) | global | açık | Büyü ve görüş sistemleri |  |
| `heightShow` | Yükseklik katmanını göster | global | açık | Diğer (altyapı) | **kaldırma adayı** (Diğer'de kaldı) |
| `heat` | Çöl sıcağı (ağır zırhlı, gölgesiz CON save) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `sandstorm` | Kum fırtınası (görüş, menzilli dezavantaj, gizlenme avantajı) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `lavaEdge` | Lav kenarı (bitişikte tur başı ateş hasarı) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `eruption` | Patlama (Game Master tetikler) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `lavaRise` | Lav yükselmesi (Game Master tetikler) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `wind` | Rüzgâr (yön; çadır yangını ve kum fırtınası ortak) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `waterfall` | Şelale arkası geçit (heykelin gözü) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `hornAlarm` | Alarm boynuzu (nöbetçi ork, takviye) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `hornReinforce` | Sürekli takviye (boynuzdan sonra, çadırlar ayakta kaldıkça) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `tentFire` | Çadır yangını (rüzgâr yönünde yayılır) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `treeFell` | Ağaç devirme (STR kontrolü, düşüş hattında DEX save) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `bridgeBreak` | Kırılabilir köprüler (kırılınca geçit kapanır) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `riverBlocked` | Nehir geçilmez (kapalıyken yüzülerek geçilir) | harita | kapalı | Harita (lav, derin su, gizli nesne…) |  |
| `boneRise` | Kemik yığınları canlanır | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `logCover` | Devrik kütük siperi (yarım siper) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `vineTrap` | Sarmaşık kapanı (gizli, STR save) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `flashFlood` | Ani sel (Game Master tetikler; uyarı, nehir taşar, sudakiler itilir) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `rottenDeck` | Çürük güverte (tahta çöker: DEX save, gizli bölme) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `wormAmbush` | Kum pususu (kumdan Ankheg çıkar; Algı ile sezilir) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `snowfall` | Kar yağışı (orta+ görüşü kısaltır, şiddetli açık karı zorlu yapar; taş dibi korunur) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `fog` | Sis (görüş menzili; uzağa menzilli saldırı dezavantajlı) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `thinIce` | İnce buz (yarık kenarında ağır zırh: DEX save, soğuk su + Prone) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `sinkMud` | Batıran çamur (ağır zırhlı batar; Atletizm ile çıkar) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `leeches` | Sülük suyu (sığ suda tur sonu CON save) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `pitFall` | Kayalık çukur: giren 1d6 düşme hasarı alır ve bir turunu kaybeder | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `pitGas` | Zehirli gaz (çukurdan aralıklı bulut) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `witchCauldron` | Cadı kazanı (zehirli buhar; söner ya da yıkılırsa cadı zayıflar) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `avalanche` | Çığ (Game Master tetikler ya da kendiliğinden tur; uyarı şeridi, ezilme + Prone + sürüklenme) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `bridgeGust` | Köprüde sert rüzgâr (DEX save ya da itilir) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `sentinelPuzzle` | Heykel bulmacası (plaka, History; gizli hane) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `sentinelGaze` | Gece heykelin gözü (WIS save ya da Frightened) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `rockRoll` | Kaya yuvarlama (hat boyunca DEX save, yarım) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `iceSeal` | Buz mühür (ateş/ışık ya da saldırı yıkar) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `brazierLight` | Mangal ışığı (söndürülünce karanlık) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `legendaryActions` | Efsanevi eylemler (boss başka yaratığın turundan sonra; turunun başında yenilenir) | global | açık | Büyü ve görüş sistemleri |  |
| `bossFlight` | Uçan boss yapay zekâsı (saldırıdan sonra lav üstüne / erişim dışına kalkar) | global | açık | Yapay zekâ davranışları |  |
| `lairEruption` | İn olayları: tur başında (inisiyatif 20) boss'un lav püskürmesi | harita | açık | Büyü ve görüş sistemleri |  |
| `possession` | Ele geçirme (Ghost Possession: başarısız CHA save'de bedeni ele geçiren yönetir; kapalıysa yalnızca save) | global | açık | Büyü ve görüş sistemleri |  |
| `allegianceSwap` | Taraf değiştirme (Dominate: yönetilen yaratık büyücünün tarafına geçer; kapalıysa yalnızca Charmed) | global | açık | Büyü ve görüş sistemleri |  |
| `auraOfProtection` | Aura of Protection dostlara (Paladin'in 10 ft içindeki dostlarının save'lerine CHA; kapalıysa yalnızca Paladin'e) | global | açık | Sınıf özellikleri |  |
| `instinctivePounce` | Instinctive Pounce (Barbarian 7: Rage'e girerken hızın yarısı kadar ek hareket) | global | açık | Sınıf özellikleri |  |
| `mindlessRageClear` | Mindless Rage girişte (Berserker 6: Rage'e girince Charmed ve Frightened biter) | global | açık | Sınıf özellikleri |  |
| `brutalStrike` | Brutal Strike (Barbarian 9: Reckless'ta avantajdan vazgeç, isabette +1d10 ve itme ya da yavaşlatma) | global | açık | Sınıf özellikleri |  |
| `abjureFoes` | Abjure Foes (Paladin 9: Channel Divinity ile CHA kadar düşmana WIS save ya da 1 dk Frightened) | global | açık | Sınıf özellikleri |  |
| `countercharm` | Countercharm (Bard 7: 30 ft içinde Charmed/Frightened save'i başarısızsa tepkiyle avantajlı yeniden at) | global | açık | Sınıf özellikleri |  |
| `mixOilSpread` | Alev + Yağ (yayılma): tutuşan yağa bitişik yağ ve gres de tutuşur; tutuşma anında yağın üstündekiler alevin hasarını hemen alır | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWebFree` | Alev + Ağ (tutsak): yanan altıgendeki tutulu yaratık serbest kalır ve yanan ağın hasarını (2d4 ateş) hemen alır | global | açık | Yüzey ve su tepkimeleri |  |
| `mixFireFog` | Alev + Sis (Fog Cloud): değen altıgenlerde sis buharlaşır, görüş açılır | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWaterFire` | Su + Alev: alevin üstüne dökülen su onu söndürür, buhar çıkar | global | açık | Yüzey ve su tepkimeleri |  |
| `mixPoisonInert` | Alev + Zehir bulutu: patlama yok: zehirli gaz yanıcı değil (Kuyruk 18b kararı; eski savaşlarda patlama) | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWaterGrease` | Su + Gres: gres dağılır | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWaterPoison` | Su + Zehir bulutu: seyrelir, kısa sürede kalkar | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWaterWeb` | Su + Ağ: ağ ıslanınca çözülür, tutulu yaratık kurtulur (ağırlaşma yok) | global | açık | Yüzey ve su tepkimeleri |  |
| `mixColdSteam` | Soğuk + Buhar: yoğuşur, su yüzeyi olur | global | açık | Yüzey ve su tepkimeleri |  |
| `mixLightningIce` | Yıldırım + Buz: buz çatlar, değen altıgenlerde kalkar | global | açık | Yüzey ve su tepkimeleri |  |
| `mixLightningIgnite` | Yıldırım + Yağ ve Gres: yıldırım yağı ve gresi tutuşturur (alev gibi) | global | açık | Yüzey ve su tepkimeleri |  |
| `mixWindClouds` | Rüzgâr + Sis / Zehir / Buhar: her tur başı rüzgâr yönünde bir altıgen sürüklenir; şiddetli rüzgârda (2) süresi her tur bir kısalır | global | açık | Yüzey ve su tepkimeleri |  |
| `mixForceWater` | Kuvvet / Gök gürültüsü + Su: su yüzeyi taşar, değdiği birikinti bir halka genişler | global | açık | Yüzey ve su tepkimeleri |  |
| `mixAcidWeb` | Asit + Ağ: ağ erir, tutulu yaratık kurtulur | global | açık | Yüzey ve su tepkimeleri |  |
| `mixOilSlip` | Yağ + Hareket: kayma: girişte DEX save, başarısızsa Prone (buzdaki gibi) | global | açık | Yüzey ve su tepkimeleri |  |
| `tacticalMaster` | Tactical Master (Fighter 9: ustalıklı silahta saldırı başına Push, Sap ya da Slow) | global | açık | Sınıf özellikleri |  |
| `heroicWarrior` | Heroic Warrior (Champion 10: savaşta her tur başı Heroic Inspiration; başarısız d20 bir kez yeniden atılır) | global | açık | Sınıf özellikleri |  |
| `wholenessOfBody` | Wholeness of Body (Open Hand 6: bonus eylemle Martial Arts zarı + WIS iyileşme) | global | açık | Sınıf özellikleri |  |
| `supremeSneak` | Supreme Sneak (Thief 9: Stealth Attack, ¾ siperde saldıran gizli kalır) | global | açık | Sınıf özellikleri |  |
| `heightenedDefense` | Heightened Focus: Patient Defense (Monk 10: Focus'lu Patient Defense iki Martial Arts zarı geçici HP) | global | açık | Sınıf özellikleri |  |
| `naturesWard` | Nature's Ward: Poisoned bağışıklığı (Circle of the Land 10) | global | açık | Sınıf özellikleri |  |
| `bardicInspirationFix` | Bardic Inspiration düzeltmesi (özelliği olan savaşçıda da başarısız d20'ye eklenir) | global | açık | Sınıf özellikleri | **kaldırma adayı** (Diğer'de kaldı) |
| `bardicInspirationChain` | Bardic Inspiration zinciri (Indomitable, Luck, Tactical Mind gibi ikinci şans tutmazsa ilham zarı da atılır) | global | açık | Sınıf özellikleri |  |
| `pushChoice` | Push ustalığı isteğe bağlı (her isabette itmeyi seç ya da atla; seçim yoksa son saldırıda) | global | açık | Sınıf özellikleri |  |
| `stepWindJump` | Step of the Wind: bu tur atlama mesafesi iki katı (Monk) | global | açık | Sınıf özellikleri |  |
| `aiBlindness` | Yapay zekâ: Blindness/Deafness (güçlü düşmana; görüşe dayanmayana Deafened) | global | açık | Yapay zekâ davranışları |  |
| `waterWalk` | Water Walk: sıvı zeminde (su, çamur, batak) normal yürüme, batma yok | global | açık | Yüzey ve su tepkimeleri |  |
| `powerfulBuild` | Powerful Build: Goliath Grappled'dan kurtulma denetiminde avantajlı | global | açık | Sınıf özellikleri | **kaldırma adayı** (Diğer'de kaldı) |
| `gustDisperse` | Gust of Wind çizgisindeki gaz ve buhar bulutlarını dağıtır | global | açık | Yüzey ve su tepkimeleri |  |
| `lifedrinkerFull` | Lifedrinker tam: hasar türü seçimi (Necrotic/Psychic/Radiant) ve HP zarı harcayıp iyileşme | global | açık | Sınıf özellikleri |  |
| `oneWithShadows` | One with Shadows: slotsuz Invisibility yalnızca loş ışıkta ya da karanlıkta | global | açık | Sınıf özellikleri |  |
| `specialSenses` | Özel duyular: Blindsight/Truesight menzilinde görünmez ve karanlıktaki (büyülü dahil) yaratık görülür | global | açık | Büyü ve görüş sistemleri |  |
| `pactBladeTypes` | Pact of the Blade: pact silahı Necrotic, Psychic ya da Radiant vurabilir (hedefe en çok işleyen) | global | açık | Sınıf özellikleri |  |
| `spellsK19` | 4–5. seviye büyülerin tam SRD yan etkileri (Kuyruk 19: iki hasar türü, kalan zemin, gecikmeli hasar, tür otomatik başarısızlığı vb.) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `invocationsK19` | Eldritch Invocation kalanları (Pact of the Chain biçimleri ve saldırısı, Chain Master, Gift of the Protectors, Gaze of Two Minds) | global | açık | Sınıf özellikleri |  |
| `teleportArrival` | Işınlanma varışı: varılan altıgenin yüzey/tuzak kuralı, aura ve büyü alanı girişi çalışır (Kuyruk K53) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `objectMotion` | Nesne hareketi: hareketli nesneler itilir/fırlatılır, zeminden enkaz çağrılır (Kuyruk K53) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `tempBarriers` | Geçici engel: veriden tanımlı engel altıgenleri (süre, HP, kimin geçtiği, görüş) (Kuyruk K53) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `araziBuyuEtkisi` | Arazi × büyü: ateş ve soğuk büyüleri zemin türüne göre yüzey bırakır (kuru ot tutuşur, sığ su donar, kar erir; hasar zarı değişmez; Kuyruk K56; altıgen etki çözücüsü açıkken) | global | açık | Yüzey ve su tepkimeleri |  |
| `hexResolver` | Altıgen etki çözücüsü: yüzey, gaz, duvar ve büyü tepkimeleri tek tablodan, sabit öncelik sırası, katman başına bir yüzey, zincir derinliği 3 (Kuyruk K55) | global | açık | Yüzey ve su tepkimeleri |  |
| `auraCore` | Aura altyapısı: veriden auralar (tetik, süzgeç, etki, en güçlüsü uygulanır) ve direnç bağışıklık sayacı (Kuyruk K53) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `featuresK19` | Sınıf özelliklerinin kalanları (Tactical Shift/Withdraw yarı hızla serbest kayma, Knock Out hasarla biter, Grapple, Poison…) | global | açık | Sınıf özellikleri |  |
| `nightVision` | Gece görüşü kuralları (SRD: ışıksız altıgen karanlık; Darkvision/ışık menzili görür; görmeyen saldıran dezavantajlı, görülmeyen avantajlı) | global | kapalı | Büyü ve görüş sistemleri |  |
| `darkvisionRange` | Karanlık görüş menzili yaratığın kendi değeri (SRD: 60, 90, 120 ft…; kapalıyken herkes 60 ft) | global | açık | Diğer (altyapı) | **kaldırma adayı** (Diğer'de kaldı) |
| `stormRules` | Fırtına kuralları (kuvvetli rüzgâr/fırtına: menzilli saldırı dezavantajı, uçuş iki kat hareket; yağmurda pasif Algı −5) | global | kapalı | Büyü ve görüş sistemleri |  |
| `spells69` | 6.–9. seviye büyüler (SRD 5.2.1; Power Word, Time Stop, Mass Heal, Prismatic Spray…) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `srdK19` | SRD denetimi kalanları (Heavy/Loading silah kuralları, cephane, sihirli eşyalar, binek ve sualtı savaşı, canavar yetenekleri) | global | açık | Diğer (altyapı) | **SD9B: kurulumdan gizlendi** |
| `monsterDrain` | Canavarın kalıcı azaltması (HP maksimumu, yetenek puanı; Greater Restoration kaldırır) | global | açık | Diğer (altyapı) | **kaldırma adayı** (Diğer'de kaldı) |
| `floorLink` | Kat merdiveni (merdivendeki parti üyesi bütün partiyi öbür kata götürür; kattakiler bekler) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `aiPatrol` | Yapay zekâ: devriye yürüyüşü (gruptaki rota) | global | açık | Yapay zekâ davranışları |  |
| `aiCutRunner` | Yapay zekâ: düşman hedef taşıyıcısını ve çıkışı keser | global | açık | Yapay zekâ davranışları |  |
| `aiKeg` | Yapay zekâ: düşman barut fıçısını patlatır (patlama ev kuralı açıkken) | global | açık | Yapay zekâ davranışları |  |
| `aiTentTarget` | Yapay zekâ: takviye sürerken parti çadırları hedefler (hornReinforce) | global | açık | Yapay zekâ davranışları |  |
| `gateLever` | Kapı kolu (çekilince kapı açılır/kapanır) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `ballista` | Balista (eylemle yükle, eylemle ateşle; uzak menzilde dezavantaj) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `frozenFall` | Donmuş şelale (kırılınca ya da eriyince ardındaki geçit açılır; ateş iki kat) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `coldExposure` | Dondurucu soğuk (SRD Extreme Cold, savaş ölçeği: her N turda CON save ya da 1 Exhaustion) | harita | kapalı | Harita (lav, derin su, gizli nesne…) |  |
| `gate` | Kapı: Game Master kapıyı açıp kapatır (kapalı kapı engeldir, kırılabilir) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |
| `sentinelNiche` | Heykelin gizli nişi (Algıyla bulunur ya da bulmaca açar; içinde sandık) | harita | açık | Harita (lav, derin su, gizli nesne…) |  |

## 4. Grup özeti

| Grup | Kural sayısı |
|---|---|
| Yüzey ve su tepkimeleri | 21 |
| Sınıf özellikleri | 22 |
| Yapay zekâ davranışları | 6 |
| Büyü ve görüş sistemleri | 8 |
| Harita (lav, derin su, gizli nesne…) | 46 |
| Diğer (altyapı) | 11 |

Kaldırma adayı toplam: 13; SD9B'de kurulumdan gizlenen: 7; Gelişmiş > Diğer'de kalan: 6.

## 5. SD9B kararları (13 aday)

Ölçüt: kapatılınca oyunu bozuyor mu? Bozuyorsa altyapıdır ve kurulumdan gizlenir (varsayılan açık, kural ve eski kayıt aynı; `data/kural-kontrol.json` değişmedi). Küçük/isteğe bağlı davranış Gelişmiş > Diğer'de kalır.

| Kimlik | Karar | Gerekçe |
|---|---|---|
| `auraCore` | gizle | kapalıyken aura tabanlı özellikler ve büyüler çalışmaz |
| `bardicInspirationFix` | Diğer'de kal | tek özelliğin düzeltmesi; kapalıyken eski davranış |
| `darkvisionRange` | Diğer'de kal | kapalıyken herkes 60 ft; oyun bozulmaz |
| `freeHexTarget` | Diğer'de kal | yalnız boş altıgene atma kolaylığı; kapalıyken oyun bozulmaz |
| `heightShow` | Diğer'de kal | yalnız görünüm (yükseklik tonu) |
| `monsterDrain` | Diğer'de kal | kalıcı azaltma; kapalıyken yalnız o saldırılar hafifler |
| `objectMotion` | gizle | kapalıyken nesne itme/fırlatma ve enkaz çalışmaz |
| `powerfulBuild` | Diğer'de kal | tek tür özelliği |
| `spells69` | gizle | kapalıyken 6.–9. seviye büyüler savaşta çalışmaz |
| `spellsK19` | gizle | kapalıyken 4–5. seviye büyülerin yan etkileri eksik kalır |
| `srdK19` | gizle | kapalıyken silah/zırh kalanları, sihirli eşyalar, binek ve canavar yetenekleri düşer |
| `teleportArrival` | gizle | kapalıyken ışınlanma varışında yüzey/tuzak/aura girişi atlanır |
| `tempBarriers` | gizle | kapalıyken geçici engel veren büyüler etkisiz |
