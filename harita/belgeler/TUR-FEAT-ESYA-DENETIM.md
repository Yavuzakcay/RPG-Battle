# Tür, feat, geçmiş, silah, zırh ve savaş donanımı denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Kural sürümü 97 (`data/kural-surumu.json`), kayıt sürümü 24.
Kaynak: `docs/SRD_CC_v5.2.1.pdf` (PDF sayfa no = basılı no): karakter oluşturma s. 19–20, geçmişler s. 83, türler s. 84–86, feat'ler s. 87–88, silahlar ve ustalıklar s. 89–91, zırh s. 92, aletler s. 93, Adventuring Gear s. 94–97, sihirli eşyalar s. 204 ve sonrası.
Ölçüt: SRD 5.2.1. **İstisnalar (kullanıcı kararı):** alt soylar ve ırk soyları (`data/races.json` `lineages`, AS1a/AS1b alt soy etkileri), 8 özgün geçmiş (`data/backgrounds.json` `ozgun: true`) ve Celestial ırkı bizim yerelleştirmemizdir; bunlarda ölçüt kendi metnimizdir, yalnız metin ile motor arasındaki uyuşmazlık işaretlendi. SRD 5.2.1'de Aasimar yok; Celestial yalnız kendi metnimize göre denetlendi.
Yöntem: SRD metninden kural listesi çıkarıldı, kod ve veri okundu, şüpheli satırlar geçici vitest probe'larıyla gerçekten çalıştırıldı (her bölümün sonunda "Probe dökümü"). Probe dosyaları (`src/battle/zzTmpTFE*`, `src/rules/zzTmpTFE*`) silindi; depoya yalnız bu belge girdi. Silah ve zırh tabloları betikle SRD tablosuyla karşılaştırıldı.

Durum sözlüğü: **tam** · **kısmi** · **yok** · **bilinçli sapma** (DECISIONS.md'de gerekçeli ya da veride açıkça savaş dışı notlu) · **doğrulanmadı** (çalıştırılamadı ya da kanıt yetersiz; tahmin yazılmadı). Satır kimlikleri bölüm harfiyle: T tür (C Celestial, L alt soy), F feat, G geçmiş, S silah, Z zırh, D donanım. "Karar gerekli" kimlikleri `K-<bölüm><n>`.

## Sayı özeti

(Sayım tablo satırlarının durum sütunundan betikle yapıldı.)

| Bölüm | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| 1. Türler (T, C, L) | 52 | 26 | 17 | 5 | 4 | 0 |
| 2. Feat'ler (F) | 38 | 21 | 9 | 1 | 6 | 1 |
| 3. Geçmişler (G) | 28 | 20 | 4 | 2 | 2 | 0 |
| 4. Silahlar (S) | 36 | 20 | 9 | 3 | 4 | 0 |
| 5. Zırh ve kalkan (Z) | 33 | 22 | 6 | 4 | 1 | 0 |
| 6. Savaşla ilgili donanım (D) | 38 | 10 | 16 | 7 | 4 | 1 |
| **Toplam** | **225** | **119** | **61** | **22** | **21** | **2** |

## Düzeltme durumu (Görev TE99, kural sürümü 99; 2026-11-21)

> **KALAN100 (2026-11-21, kural sürümü 100):** TE99'dan kalanlar yeniden okundu (DECISIONS.md "KALAN100"): Stone's Endurance ortak
> ön-hasar kancası, kalkan tak/çıkar (Utilize) komutu ve eşya ↔ silah bağı **ertelendi, karar gerekli** (yeni sistem); Nick'in hangi
> silahta sayılacağı **doğrulanmadı** (s. 90 metni yazmıyor). Sim partisinde Bor ve Rook kalkan + Javelin; TE99'da 98'e sabitlenen dört
> test güncel sürümde.

Her satırın sonucu. **düzeldi (99)**: kural sürümü 99 ve sonrası (98 ve altı eski davranış); **sürümsüz**: oluşturucu/veri/uygulama katmanı; **ertelendi**: yapılmadı (neden yanında; ayrıntı DECISIONS.md TE99). "değişmedi" yazan satırlar tam ya da bilinçli sapmaydı. Testler `src/battle/te99.test.ts`.

| # | Konu | Sonuç |
|---|---|---|
| T1 | Boyut: Dragonborn, Dwarf, Elf, Goliath, Orc Medium; Gnome, Halfling Small | değişmedi (tam) |
| T2 | Human ve Tiefling boyutu Small ya da Medium, tür seçilirken | ertelendi (bu turun kapsamı dışında) |
| T3 | Hız 30 ft; Goliath 35; Wood Elf 35 | değişmedi (tam) |
| T4 | Darkvision 60 ft; Dwarf, Orc, Drow 120; Goliath, Halfling, Human yok | değişmedi (tam) |
| T5 | Dragonborn Draconic Ancestry tablosu + Damage Resistance | değişmedi (tam) |
| T6 | Breath Weapon: Attack eyleminde bir saldırının yerine, 15 ft koni / 30×5 ft çizgi, DEX … | değişmedi (tam) |
| T7 | Draconic Flight: 5+, bonus eylem, 10 dk, uçuş = Speed, Incapacitated olunca biter, uzun… | kısmen düzeldi (99: kaynak uzun dinlenmeye bağlı); Incapacitated olunca bitme ertelendi |
| T8 | Dwarven Resilience: Poison direnci | değişmedi (tam) |
| T9 | Dwarven Resilience: Poisoned'dan kaçınma/bitirme save'lerinde avantaj | düzeldi (99) |
| T10 | Dwarven Toughness: seviye başına +1 HP | değişmedi (tam) |
| T11 | Stonecunning: bonus eylem, taş yüzeyde 60 ft Tremorsense 10 dk, PB kullanım, uzun dinlenme | kısmen düzeldi (99: kaynak kalıcı); Tremorsense ↔ yeri bilme ertelendi |
| T12 | Elven Lineage 1. seviye: Drow DV 120 + Dancing Lights, High Elf Prestidigitation, Wood … | değişmedi (tam) |
| T13 | High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme | ertelendi (bu turun kapsamı dışında) |
| T14 | Soy/Legacy 3. ve 5. seviye büyüsü: hep hazır, uzun dinlenmede bir kez slotsuz, slotla da | değişmedi (tam) |
| T15 | Soy büyülerinin yeteneği INT/WIS/CHA, soy seçilirken seçilir | sürümsüz (oluşturucu: soy büyüsü yeteneği seçimi `lineageAbility`) |
| T16 | Fey Ancestry: Charmed'dan kaçınma/bitirme save'lerinde avantaj | düzeldi (99) |
| T17 | Keen Senses: Insight, Perception ya da Survival yetkinliği | sürümsüz (Elf yalnız Insight/Perception/Survival) |
| T18 | Trance: büyü uyutamaz; 4 saatte uzun dinlenme | değişmedi (tam) |
| T19 | Gnomish Cunning: INT/WIS/CHA save avantajı | değişmedi (tam) |
| T20 | Forest Gnome: Minor Illusion + Speak with Animals PB kez slotsuz, uzun dinlenme, slotla da | değişmedi (tam) |
| T21 | Rock Gnome: Mending + Prestidigitation | değişmedi (tam) |
| T22 | Rock Gnome: saat işi aygıt (AC 5, 1 HP; en çok 3) | ertelendi (bu turun kapsamı dışında) |
| T23 | Giant Ancestry: PB kullanım, uzun dinlenme | değişmedi (tam) |
| T24 | Cloud's Jaunt: bonus eylem, görülen boş altıgene 30 ft ışınlanma | değişmedi (tam) |
| T25 | Fire's Burn / Frost's Chill / Hill's Tumble: saldırı zarıyla isabette, seçimli, tur sın… | düzeldi (99) (tur sınırı yok, büyü saldırısı, kullanım sorulur) |
| T26 | Frost's Chill hız −10 ft sonraki turun başına dek; Hill's Tumble Large ve küçüğü Prone | değişmedi (tam) |
| T27 | Stone's Endurance: hasar alınca tepki, 1d12 + CON azaltma | ertelendi (hasar öncesi ortak azaltma kancası yeni sistem ister) |
| T28 | Storm's Thunder: 60 ft içinden hasar verene tepkiyle 1d8 Thunder | değişmedi (tam) |
| T29 | Large Form: 5+, bonus eylem, yer yetiyorsa, 10 dk Large, STR kontrollerinde avantaj, hı… | kısmen düzeldi (99: kaynak kalıcı); multiHex sığma ertelendi |
| T30 | Powerful Build: Grappled'ı bitirme kontrolünde avantaj | değişmedi (tam) |
| T31 | Powerful Build: taşıma kapasitesinde bir boy büyük | değişmedi (tam) |
| T32 | Brave: Frightened'dan kaçınma/bitirme save'lerinde avantaj | düzeldi (99) |
| T33 | Halfling Nimbleness: bir boy büyük yaratığın alanından geçer, duramaz | değişmedi (tam) |
| T34 | Luck: D20 Test'te doğal 1 yeniden atılır | ertelendi (bu turun kapsamı dışında) |
| T35 | Naturally Stealthy: en az bir boy büyük yaratıkla örtülüyken Hide | ertelendi (bu turun kapsamı dışında) |
| T36 | Resourceful: uzun dinlenmede Heroic Inspiration | düzeldi (99) (uzun dinlenmede dolar, kullanım sorulur) |
| T37 | Skillful: bir beceri yetkinliği | sürümsüz (serbest beceri yalnız Human/Elf) |
| T38 | Versatile: seçilen bir Origin feat | sürümsüz (Versatile `speciesFeat`) |
| T39 | Adrenaline Rush: bonus eylemle Dash + PB geçici HP; PB kullanım, kısa/uzun dinlenme | düzeldi (99) |
| T40 | Relentless Endurance: anında ölmeden 0 HP'de 1 HP; uzun dinlenmede bir | düzeldi (99) |
| T41 | Fiendish Legacy 1. seviye: direnç + cantrip (Abyssal Poison/Poison Spray, Chthonic Necr… | değişmedi (tam) |
| T42 | Fiendish Legacy 3./5. seviye büyüleri | değişmedi (tam) |
| T43 | Otherworldly Presence: Thaumaturgy cantrip'i, Legacy yeteneğiyle | ertelendi (bu turun kapsamı dışında) |
| T44 | Tür kaynaklarının savaşlar arası takibi | düzeldi (99) |
| T45 | Aasimar (SRD 5.2.1'de yok; ölçülen PDF'te geçmiyor) | değişmedi (bilinçli sapma) |
| C1 | Celestial: Medium ya da Small (bizim veri `sizes: ["M","S"]`) | ertelendi (bu turun kapsamı dışında) |
| C2 | Celestial: Darkvision 60, Radiant + Necrotic direnci (bizim metin "Düşmüşün Görüşü", "G… | değişmedi (tam) |
| C3 | Celestial: Light cantrip'i, Şifa Eli (eylem, PB×d4, uzun dinlenme), Göksel Uyanış (3+, … | değişmedi (tam) |
| C4 | Celestial biçimleri: Parlayan Ruh, Gece Gözyaşı, Kırık Kanat (13+ normal uçuş) (bizim m… | değişmedi (tam) |
| C5 | Celestial kalıcı ırk (K49, sürüm 22+) ile metin | ertelendi (bu turun kapsamı dışında) |
| L1 | Alt soy buff/debuff mekaniği (38 soy; bizim metin `alt-soy-metin.json`, `docs/ALT-SOY-4… | değişmedi (tam) |
| L2 | Tiefling Kanatlı: metin "soy hasar direncini kaybedersin; orta/ağır zırhla uçamazsın" | ertelendi (bu turun kapsamı dışında) |
| F1 | ASI/feat yuvaları 4/8/12/16, Fighter +6/14, Rogue +10, 19 Epic Boon; Fighting Style yuv… | değişmedi (tam) |
| F2 | ASI özelliği "ASI feat'i ya da koşulunu sağladığın başka bir feat"; Fighting Style feat… | sürümsüz (Fighting Style özelliği olan sınıf ASI/Epic yuvasında) |
| F3 | Epic Boon yuvası: Epic Boon ya da koşulunu sağladığın başka bir feat (ASI dahil); ASI y… | değişmedi (tam) |
| F4 | Ön koşul seviyesi (Grappler/ASI "Level 4+", Boon "Level 19+") | değişmedi (tam) |
| F5 | Ön koşul yeteneği: Grappler "Strength or Dexterity 13+" | ertelendi (bu turun kapsamı dışında) |
| F6 | Ön koşul "Spellcasting Feature" (Boon of Spell Recall) | sürümsüz (Warlock Pact Magic ön koşulu tutmaz; paket alt sınıf büyücüsü ertelendi) |
| F7 | Fighting Style feat'i yalnız Fighting Style özelliğiyle; yuvada yalnız Fighting Style k… | değişmedi (tam) |
| F8 | Köken feat'i geçmişten gelir | değişmedi (tam) |
| F9 | Human Versatile: seçilen ek bir köken feat'i | sürümsüz (Versatile) |
| F10 | Tekrarsız feat ikinci kez alınamaz ("Repeatable" yoksa bir kez) | değişmedi (tam) |
| F11 | Repeatable: ASI, Skilled | değişmedi (tam) |
| F12 | Magic Initiate Repeatable, her seferinde farklı liste | değişmedi (tam) |
| F13 | ASI: bir skora +2 ya da iki skora +1, 20'yi aşmaz | değişmedi (tam) |
| F14 | Grappler +1 STR/DEX, en çok 20 | değişmedi (tam) |
| F15 | Epic Boon +1, en çok 30; Spell Recall INT/WIS/CHA, Irresistible Offense STR/DEX | değişmedi (tam) |
| F16 | Alert: inisiyatife PB | değişmedi (tam) |
| F17 | Alert Initiative Swap: inisiyatiften hemen sonra gönüllü bir dostla takas, ikisi de Inc… | ertelendi (bu turun kapsamı dışında) |
| F18 | Magic Initiate: iki cantrip + 1. seviye büyü aynı listeden, INT/WIS/CHA, her zaman hazı… | değişmedi (tam) |
| F19 | Magic Initiate Spell Change: yalnız seviye atlarken bir büyü değişir | değişmedi (bilinçli sapma) |
| F20 | Savage Attacker: turda bir, **silahla** isabette silahın hasar zarları iki kez | düzeldi (99) |
| F21 | Savage Attacker "either roll" | değişmedi (bilinçli sapma) |
| F22 | Skilled: üç beceri ya da alet | değişmedi (tam) |
| F23 | Grappler Punch and Grab: Attack eylemindeki Unarmed Strike isabetinde hasar + Grapple, … | değişmedi (tam) |
| F24 | Grappler Attack Advantage | değişmedi (tam) |
| F25 | Grappler Fast Wrestler: kendi boyunda/küçüğü sürüklemek ek hareket istemez | doğrulandı (test, hata yok) |
| F26 | Archery: Ranged silahla saldırıya +2 (fırlatılan yakın silah değil) | değişmedi (tam) |
| F27 | Defense: Light/Medium/Heavy zırhla +1 AC | değişmedi (tam) |
| F28 | Great Weapon Fighting: iki elle tutulan Melee silahta (Two-Handed/Versatile) 1–2 → 3 | değişmedi (tam) |
| F29 | Two-Weapon Fighting: Light ek saldırısına yetenek değiştiricisi | değişmedi (tam) |
| F30 | Boon of Combat Prowess, Peerless Aim: ıskayı isabete çevir, sonraki tur başına dek bir | düzeldi (99) (kullanım sorulur) |
| F31 | Boon of Dimensional Travel, Blink Steps: **Attack ya da Magic eyleminden hemen sonra** … | düzeldi (99) |
| F32 | Boon of Fate, Improve Fate: 60 ft'te D20 Testine ±2d4, inisiyatif ya da dinlenmeyle yen… | düzeldi (99) (kullanım sorulur) |
| F33 | Irresistible Offense, Overcome Defenses: verdiğin **bütün** B/P/S hasarı direnci yok sayar | düzeldi (99) (bütün B/P/S hasarı, `profileIn` kaynağıyla) |
| F34 | Irresistible Offense, Overwhelming Strike: saldırı zarında 20 → artırılan skor kadar ek… | düzeldi (99) (büyü saldırısında da) |
| F35 | Boon of Spell Recall, Free Casting: 1–4. seviye slotla her büyüde 1d4 = slot seviyesi →… | ertelendi (bu turun kapsamı dışında) |
| F36 | Night Spirit, Merge with Shadows: loşta/karanlıkta bonus eylemle Invisible, eylem/bonus… | değişmedi (bilinçli sapma) |
| F37 | Night Spirit, Shadowy Form: loşta/karanlıkta Psychic/Radiant dışı direnç | değişmedi (bilinçli sapma) |
| F38 | Boon of Truesight: 60 ft Truesight | değişmedi (tam) |
| G1 | Yetenek artışı yalnız geçmişin üç yeteneğine, +2/+1 ya da +1/+1/+1, hiçbiri 20'yi aşamaz | değişmedi (tam) |
| G2 | Artış zorunlu ("increase one by 2…", s. 21) | sürümsüz (geçmiş seçiliyse bonus zorunlu) |
| G3 | Acolyte: INT/WIS/CHA, Magic Initiate (Cleric), Insight + Religion | değişmedi (tam) |
| G4 | Criminal: DEX/CON/INT, Alert, Sleight of Hand + Stealth | değişmedi (tam) |
| G5 | Sage: CON/INT/WIS, Magic Initiate (Wizard), Arcana + History | değişmedi (tam) |
| G6 | Soldier: STR/DEX/CON, Savage Attacker, Athletics + Intimidation | değişmedi (tam) |
| G7 | Köken feat'i geçmişten gelir ("specified Origin feat", s. 20, s. 83) | değişmedi (tam) |
| G8 | Magic Initiate: listeden 2 cantrip + 1. seviye büyü, INT/WIS/CHA seçimi, uzun dinlenmed… | değişmedi (tam) |
| G9 | Alert ve Savage Attacker savaşta | değişmedi (tam) |
| G10 | Skilled: "üç beceri **ya da alet**" | ertelendi (bu turun kapsamı dışında) |
| G11 | İki beceri yeterliliği (s. 20, s. 83); sınıf becerisiyle çakışma | değişmedi (tam) |
| G12 | Tür becerisi yalnız Human Skillful (her beceri) ve Elf Keen Senses (Insight/Perception/… | sürümsüz |
| G13 | Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj | ertelendi (genel alet yetkinliği; yalnız Thieves' Tools savaşta) |
| G14 | Seçmeli alet: Soldier "one kind of Gaming Set" (s. 83); bizim Soylu (Gaming Set), Soyta… | ertelendi (bu turun kapsamı dışında) |
| G15 | Thieves' Tools ile kilit açma: DEX, DC 15, aleti gerektirir | kısmen düzeldi (99: DEX + PB, avantaj; envanter yok) |
| G16 | Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir | ertelendi (başlangıç donanımı A/50 GP) |
| G17 | Geçmiş değişince geçersiz seçimler (bonus, beceri, MI listesi) | değişmedi (tam) |
| G18 | Geçmişsiz eski kayıt (SRD'de karşılığı yok) | değişmedi (bilinçli sapma) |
| G19 | Yeni karakter: varsayılan geçmiş ve öneri (oluşturucu) | değişmedi (tam) |
| G20 | Madenci (`buz-madencisi`): STR/CON/WIS, Savage Attacker, Survival + Investigation, Maso… | değişmedi (tam) |
| G21 | Köylü (`ciftci`): STR/CON/WIS, Magic Initiate (Druid), Animal Handling + Nature, Carpen… | değişmedi (tam) |
| G22 | Tüccar (`tuccar`): DEX/INT/CHA, Skilled, Persuasion + Insight, Cartographer's Tools (bi… | değişmedi (tam) |
| G23 | Mürettebat (`denizci`): STR/DEX/WIS, Savage Attacker, Acrobatics + Perception, Navigato… | değişmedi (tam) |
| G24 | Soytarı (`gezgin-ozan`): DEX/INT/CHA, Magic Initiate (Wizard), Performance + Deception,… | değişmedi (tam) |
| G25 | Şifacı (`sifaci-yardimcisi`): CON/WIS/CHA, Magic Initiate (Cleric), Medicine + Nature, … | değişmedi (tam) |
| G26 | Ödül Avcısı (`avci-izci`): DEX/CON/WIS, Alert, Survival + Perception, Leatherworker's T… | değişmedi (tam) |
| G27 | Soylu (`soylu`): STR/INT/CHA, Skilled, Persuasion + History, Gaming Set (bizim metin) | değişmedi (tam) |
| G28 | Özgün geçmiş kuralı: köken feat'i SRD'nin 4 köken feat'inden, aletler SRD aletleri, DEC… | değişmedi (tam) |
| S1 | Simple Melee 10 silah: zar, tür, özellikler | değişmedi (tam) |
| S2 | Simple Ranged 4 silah (Dart, Light Crossbow, Shortbow, Sling) | değişmedi (tam) |
| S3 | Martial Melee 18 silah | değişmedi (tam) |
| S4 | Martial Ranged 6 silah; Blowgun sabit 1 hasar, yetenek eklenmez | değişmedi (tam) |
| S5 | Her silahın ustalığı (Mastery sütunu) | değişmedi (tam) |
| S6 | Weapon Proficiency: yetkin değilse PB eklenmez; Melee STR, Ranged DEX | değişmedi (tam) |
| S7 | Ammunition: her saldırı bir cephane harcar; cephane yoksa atış yok | değişmedi (tam) |
| S8 | Ammunition: savaştan sonra harcananın yarısı geri kazanılır | değişmedi (bilinçli sapma) |
| S9 | Ammunition: tek elli silahı doldurmak için boş el gerekir | ertelendi (bu turun kapsamı dışında) |
| S10 | Finesse: STR/DEX'ten biri, saldırı ve hasarda aynı | değişmedi (tam) |
| S11 | Heavy: Melee'de STR < 13, Ranged'de DEX < 13 dezavantaj | değişmedi (tam) |
| S12 | Light: Attack eyleminde Light silahla saldırınca bonus eylemle farklı Light silahla ek … | değişmedi (tam) |
| S13 | Light: "different Light weapon" (aynı türden iki silah, ör. iki Dagger) | değişmedi (bilinçli sapma) |
| S14 | Loading: bir eylem/bonus eylem/tepkide o silahtan tek atış | düzeldi (99) (silah başına) |
| S15 | Range: normal menzil ötesi dezavantaj, uzun menzil ötesi saldırı yok | değişmedi (tam) |
| S16 | Yakın düşman: 5 ft içinde seni gören, Incapacitated olmayan düşman varken menzilli sald… | değişmedi (tam) |
| S17 | Reach: +5 ft erişim; fırsat saldırısında da o silahla | ertelendi (bu turun kapsamı dışında) |
| S18 | Thrown: fırlatınca menzilli saldırı, yakın dövüş silahında aynı yetenek | değişmedi (tam) |
| S19 | Thrown: fırlatılan silah elden çıkar (yerde kalır) | değişmedi (bilinçli sapma) |
| S20 | Two-Handed: saldırıda iki el gerekir | düzeldi (99) |
| S21 | Lance: Two-Handed (binekte değilse) | değişmedi (tam) |
| S22 | Versatile: iki elle parantezdeki zar, yalnız yakın dövüşte | değişmedi (tam) |
| S23 | Cleave: yakın dövüş isabetinde ilkine 5 ft, erişimdeki ikinci yaratığa saldırı, hasara … | değişmedi (tam) |
| S24 | Graze: ıskada saldırı yeteneği değiştiricisi kadar aynı türde hasar | değişmedi (tam) |
| S25 | Nick: Light ek saldırısı Attack eyleminin içinde, turda bir | ertelendi (metin belirsiz: Nick hangi silahta, K-S2) |
| S26 | Push: isabette Large ya da küçüğü "10 ft'e kadar" düz uzağa itebilirsin | düzeldi (99) (5/10 ft seçimi; otomatik seçim kuralı aynı) |
| S27 | Sap: isabet alan yaratığın senin sonraki turunun başına dek sonraki saldırı zarı dezava… | ertelendi (bu turun kapsamı dışında) |
| S28 | Slow: hasarlı isabette hız −10 ft, sonraki turunun başına dek, birikmez | değişmedi (tam) |
| S29 | Topple: CON save DC 8 + yetenek + PB, başarısızsa Prone | değişmedi (tam) |
| S30 | Vex: hasarlı isabette o yaratığa sonraki saldırı zarı avantajlı, sonraki turunun sonuna… | ertelendi (bu turun kapsamı dışında) |
| S31 | Ustalık yalnız özelliği açan karaktere; seçilen silahlar, hak sayısı | değişmedi (tam) |
| S32 | Improvised Weapons: PB yok, 1d4, GM benzer silahı o silah sayabilir | kısmen düzeldi (99: nesne silahı 1d4; eşdeğer silah yetkinliği ertelendi) |
| S33 | Improvised: menzilli silahla yakın dövüş, Thrown'suz yakın silahı fırlatma (1d4, 20/60,… | ertelendi (bu turun kapsamı dışında) |
| S34 | Nesne fırlatma ≈ doğaçlama fırlatma | değişmedi (bilinçli sapma) |
| S35 | Net: Attack'in bir saldırısı yerine, 15 ft, görülen yaratık, DEX save DC 8+DEX+PB, Rest… | ertelendi (bu turun kapsamı dışında) |
| S36 | Martial Arts: Monk silahlarında DEX ve Martial Arts zarı (yakın dövüşle sınırlı değil) | ertelendi (bu turun kapsamı dışında) |
| Z1 | Light zırh: Padded 11, Leather 11, Studded 12 + DEX, sınırsız | değişmedi (tam) |
| Z2 | Medium zırh: Hide 12, Chain Shirt 13, Scale 14, Breastplate 14, Half Plate 15 + DEX (en… | değişmedi (tam) |
| Z3 | Heavy zırh: Ring 14, Chain 16, Splint 17, Plate 18, DEX eklenmez | değişmedi (tam) |
| Z4 | Strength sütunu: Chain Mail Str 13, Splint/Plate Str 15; karşılanmazsa hız −10 ft | değişmedi (tam) |
| Z5 | Strength cezası her giyene | değişmedi (bilinçli sapma) |
| Z6 | Stealth sütunu: Padded, Scale, Half Plate, Ring, Chain, Splint, Plate "Disadvantage" | değişmedi (tam) |
| Z7 | Stealth dezavantajı Dexterity (Stealth) kontrollerinde | değişmedi (tam) |
| Z8 | Giyme/çıkarma: Light 1 dk, Medium 5/1 dk, Heavy 10/5 dk | değişmedi (tam) |
| Z9 | Shield "Utilize Action to Don or Doff" | ertelendi (kalkan tak/çıkar komutu) |
| Z10 | Shield +2 AC | sürümsüz (kalkan kaydı `data/armor.json`) |
| Z11 | Kalkan AC'si yalnız eğitimle | değişmedi (tam) |
| Z12 | Eğitimsiz kalkanda hiçbir AC faydası yok | ertelendi (bu turun kapsamı dışında) |
| Z13 | Tek zırh, tek kalkan | değişmedi (tam) |
| Z14 | Eğitimsiz zırh: büyü yapılamaz | değişmedi (tam) |
| Z15 | Eğitimsiz zırh: STR/DEX save'leri dezavantajlı | değişmedi (tam) |
| Z16 | Eğitimsiz zırh: STR ya da DEX içeren saldırı zarı dezavantajlı | düzeldi (99) (yalnız STR/DEX saldırısı) |
| Z17 | Eğitimsiz zırh: DEX (Stealth) kontrolü dezavantajlı | düzeldi (99) |
| Z18 | Eğitimsiz zırh: Initiative (DEX kontrolü, s. 13) dezavantajlı | düzeldi (99) |
| Z19 | Eğitim kaynağı: sınıf "Armor Training" (s. 28–63), Divine Order Protector, paket `yetki… | değişmedi (tam) |
| Z20 | Elven Chain: "considered trained" | ertelendi (bu turun kapsamı dışında) |
| Z21 | Oluşturucu: eğitimsiz zırh/kalkan uyarısı | değişmedi (tam) |
| Z22 | Barbarian Unarmored Defense: zırhsız 10 + DEX + CON, kalkanla geçerli | değişmedi (tam) |
| Z23 | Monk Unarmored Defense: zırh ve kalkan yokken 10 + DEX + WIS (s. 50); Unarmored Movemen… | değişmedi (tam) |
| Z24 | Birden fazla taban AC hesabı: biri seçilir, birleşmez | değişmedi (tam) |
| Z25 | Mage Armor: taban AC 13 + DEX; kalkan ve diğer bonuslar tabana eklenir | düzeldi (99) |
| Z26 | Mage Armor yalnız zırhsız hedefe | değişmedi (tam) |
| Z27 | Barkskin: AC 17'den düşükse 17 | değişmedi (tam) |
| Z28 | Defense (Fighting Style): Light/Medium/Heavy zırh giyerken +1 | değişmedi (tam) |
| Z29 | Sihirli zırh +N: yalnız o zırh türüne (Armor, +N "any"; Dwarven Plate = Plate; Elven Ch… | ertelendi (bu turun kapsamı dışında) |
| Z30 | Mithral Armor: Stealth dezavantajı ve Strength şartı kalkar | ertelendi (bu turun kapsamı dışında) |
| Z31 | Two-Handed silah iki el ister: kalkanla saldırılamaz | düzeldi (99) (oluşturucuda uyarı); kalkan tak/çıkar ertelendi |
| Z32 | Rage: Heavy zırhla başlatılamaz, Heavy giyilince biter | değişmedi (tam) |
| Z33 | Canavar: stat bloğundaki zırhta eğitimli, AC bloktan | değişmedi (tam) |
| D1 | İksir içmek ya da 5 ft içindeki yaratığa içirmek Bonus Action | değişmedi (tam) |
| D2 | Potions of Healing: 2d4+2 / 4d4+4 / 8d4+8 / 10d4+20 | değişmedi (tam) |
| D3 | İksir sarf edilir, "used up" (s. 204); envanterde birden çok iksir | ertelendi (gerçek envanterden iksir düşmesi) |
| D4 | Potion of Heroism: 10 geçici HP + Bless, 1 saat | değişmedi (tam) |
| D5 | Potion of Invisibility: 1 saat, saldırı/hasar/büyüyle biter | değişmedi (tam) |
| D6 | Potion of Speed: Haste etkisi 1 dakika, konsantrasyonsuz, **uyuşukluk dalgası yok** | düzeldi (99) |
| D7 | Potion of Poison: 4d6 Poison **her durumda**; DC 13 CON save başarısızsa 1 saat Poisoned | düzeldi (99) |
| D8 | Potion of Giant Strength (6 tür): STR skoru 1 saat X olur | değişmedi (bilinçli sapma) |
| D9 | Diğer içecek/yağ etkileri: Resistance ×13, Flying, Growth, Diminution, Gaseous Form, In… | doğrulandı (44 kayıt testi, hata yok) |
| D10 | Antitoxin: Bonus Action, 1 saat Poisoned save avantajı | değişmedi (tam) |
| D11 | Acid: Attack eyleminde bir saldırı yerine, 20 ft, DEX DC 8+DEX+PB, 2d6 Acid | değişmedi (tam) |
| D12 | Alchemist's Fire: 1d4 Fire + Burning; Burning tur başı 1d4, söndürme **eylem + Prone** | düzeldi (99) (eylem + Prone ile söner) |
| D13 | Holy Water: 2d8 Radiant yalnız Fiend/Undead | değişmedi (tam) |
| D14 | Net: 15 ft, Restrained; **Huge+ otomatik başarı**; DC 10 STR (Athletics) kurtulma, ağ A… | ertelendi (bu turun kapsamı dışında) |
| D15 | Basic Poison: Bonus Action, yalnız Piercing/Slashing hasarda +1d4 Poison, 1 dakika **ya… | ertelendi (bu turun kapsamı dışında) |
| D16 | Oil: yaratığa fırlatma (DEX save, ateşte +5 Fire), alana dökme ve yakma | ertelendi (Utilize eşyaları) |
| D17 | Caltrops (DC 15, 1 Piercing, hız 0) ve Ball Bearings (DC 10 Prone), Utilize | ertelendi (Utilize eşyaları) |
| D18 | Hunting Trap (DC 13, 1d4, zincir), Manacles (DC 13 bağlama) | ertelendi (Utilize eşyaları) |
| D19 | Healer's Kit: Utilize ile zarsız stabilize, 10 kullanım | ertelendi (bu turun kapsamı dışında) |
| D20 | Torch 20 ft parlak + 20 ft loş, Simple Melee saldırı 1 Fire; Lantern Hooded 30+30, Bull… | ertelendi (bu turun kapsamı dışında) |
| D21 | Ammunition özelliği: atış başına 1 cephane, bitince atış yok; savaştan sonra yarısı geri | ertelendi (cephane stoku) |
| D22 | Attunement: aynı anda en çok 3 eşya | değişmedi (tam) |
| D23 | Uyum ön şartı: sınıf ya da "by a Spellcaster" | ertelendi (bu turun kapsamı dışında) |
| D24 | Armor/Shield +1..+3, Ring/Cloak of Protection (+1 AC ve save), Bracers of Defense (+2 z… | değişmedi (tam) |
| D25 | Yetenek skoru ayarlayan eşyalar: Belt of Giant Strength ×6, Gauntlets of Ogre Power, He… | değişmedi (tam) |
| D26 | Weapon +1/+2/+3: **o silahla** saldırı ve hasar | düzeldi (104, KARAR104 A10: `silahBagi`, ana silah varsayılan) |
| D27 | Ammunition +1/+2/+3: yalnız o cephaneyle, isabetten sonra büyüsü biter | kısmen düzeldi (99: yalnız cephaneli silah; parçanın tek kullanımı ertelendi) |
| D28 | Flame Tongue: Bonus Action ile tutuşur, tutuşukken +2d6 Fire, 40 ft parlak + 40 ft loş | ertelendi (bu turun kapsamı dışında) |
| D29 | Javelin of Lightning: isabette Lightning'e çevir; Lightning Bolt: 120 ft 5 ft çizgi, DC… | kısmen düzeldi (99: +4d6 kalktı, Javelin Lightning türü; Lightning Bolt ertelendi) |
| D30 | Ammunition of Slaying: seçilen tür, DC 17 CON, 6d10 **Force** (yarı), sonra büyüsüz | kısmen düzeldi (99: yalnız cephaneli silah; tür, DC 17 CON, Force, tek kullanım ertelendi) |
| D31 | Diğer isabet ekli silahlar (24 `onHit`; Dragon/Giant Slayer, Holy Avenger, Mace of Disr… | düzeldi (104, KARAR104 A10: ek yalnız bağlı silahla) |
| D32 | Yüklü büyü eşyaları: Wand of Magic Missiles (1–3 yük, yük başına +1 seviye), Wand of Fi… | kısmen düzeldi (yük kalıcı; yükle yukarı seviye ertelendi) |
| D33 | Şarjların kalıcılığı ve şafakta yenilenme (1d6+1 vb.), son yükte 1d20 | sürümsüz (yük durumda, veride `recharge`) + 99 tür kaynağı |
| D34 | Boots of Speed: Bonus Action ile hız ×2 **ve fırsat saldırısına dezavantaj**, toplam 10… | ertelendi (bu turun kapsamı dışında) |
| D35 | Cloak of Displacement: saldırılara dezavantaj; hasar alınca sonraki turuna dek, hız 0'd… | ertelendi (bu turun kapsamı dışında) |
| D36 | Wand of the War Mage +N: **yalnız büyü saldırısına** +N ve yarım siperi yok sayma | ertelendi (bu turun kapsamı dışında) |
| D37 | (c) grubu, 14 eşya: Vorpal Sword, Nine Lives Stealer, Defender, Berserker Axe, Energy B… | ertelendi (Game Master eşyalarının `bonus`'u) |
| D38 | Yapay zekânın eşya kullanması (SRD kuralı değil; oyun) | değişmedi (bilinçli sapma) |

Özet: değişmedi 131, ertelendi 47, düzeldi 25, sürümsüz 11, kısmen düzeldi 9, doğrulandı 2

## En önemli bulgular

1. **Eşya şarjları ve tür kaynakları savaşlar arasında yanlış taşınıyor (D33, T44).** `src/app/partyStatus.ts:14` `withStatus` savaşçının kaynaklarını kayıtlı durumla tümden değiştiriyor: yüklü 41 sihirli eşya (değnek, asa, kolye) ikinci savaşta yüksüz başlıyor (probe: Wand of Magic Missiles 7 → yok, büyü reddi). Tersine, `withSpecies` (`src/battle/create.ts:89–95`) tür kaynaklarını her savaşta yeniden dolduruyor: Relentless Endurance, Adrenaline Rush, Resourceful, Draconic Flight, Large Form, Stonecunning savaş başına bir (SRD: uzun/kısa dinlenmede). Breath Weapon, Giant Ancestry ve soy büyüleri doğru.
2. **Tür save avantajları çoğu save yolunda çalışmıyor (T9, T16, T32).** Dwarven Resilience, Fey Ancestry ve Brave yalnız büyü save'lerinde işliyor; canavar save saldırısı (`monsters.ts:99`), saldırı ekleri (`grapple.ts:164`), süreli durumun tur sonu tekrar save'i (`durations.ts:108`) ve süren etkinin tekrar save'i (`effects.ts:225`) `resolveSave`'e `against` geçirmiyor (probe: Dwarf, Chuul'un Poisoned'ında ve onu bitirme save'inde avantaj almadı).
3. **Kalkanla iki elli silah serbest (S20 = Z31).** Kalkanlı karakter Greatsword/Longbow/Light crossbow ile saldırıp kalkanın +2 AC'sini koruyor, Great Weapon Fighting de işliyor; oluşturucu da sorun göstermiyor. Kalkan tak/çıkar (Utilize) komutu yok (Z9). DECISIONS'ta gerekçe yok.
4. **Sihirli eşyalar silaha değil karaktere bağlı; iki eşya güç şişiriyor (D26–D31).** "Weapon, +1" bütün silahlara, "Ammunition, +1" yakın dövüşe de geçiyor; Javelin of Lightning her menzilli isabete +4d6, Ammunition of Slaying her menzilli isabete save'siz 6d10 ekliyor. Potion of Speed bitince SRD'nin açıkça olmadığını söylediği uyuşukluğu veriyor, Potion of Poison başarılı save'de hasarı yarılıyor (D6, D7).
5. **AC ve feat'te sonucu değiştiren hatalar.** Mage Armor/Armor of Shadows kalkan ve eşya bonusunu yutuyor (Z25: kalkanlı zırhsız Fighter 16, olması gereken 18); eğitimsiz zırh inisiyatife ve Gizlen'e dezavantaj vermiyor (Z17, Z18). Savage Attacker Unarmed Strike'ta tetikleniyor (F20), Blink Steps her eylemden sonra açılıyor (F31), Irresistible Offense yalnız silah saldırısında (F33, F34).

Ayrıca: silah tablosu (38 silah) ve zırh tablosu (12 zırh) SRD ile birebir; 4 SRD geçmişi SRD kaydıyla, 8 özgün geçmiş kendi metnimizle uyumlu. Human Versatile'ın ikinci köken feat'i ve Tiefling Otherworldly Presence yok (T38, T43 = F9); `docs/SRD-DENETIM.md` bunları ve tür becerisini (Skillful, Keen Senses) yanlışlıkla "tam" sayıyor. Türden gelen serbest beceri her türe veriliyor (T17, T37 = G12).

## Doğrulanmadı

| # | Konu | Neden | Nasıl doğrulanır |
|---|---|---|---|
| F25 | Grappler Fast Wrestler: kendi boyunda ya da küçüğü sürüklemek ek hareket istemez (s. 87) | Kod var (`src/battle/movement.ts:335`), test ve probe yok | Medium yakalayanın Medium/Large hedefi sürükleme maliyeti testi |
| D9 | Diğer içecek/yağ etkileri (Resistance ×13, Flying, Growth, Diminution, Gaseous Form, Invulnerability, Climbing, Vitality, Oil of Sharpness/Slipperiness/Etherealness; s. 233–236) | 44 kayıt `use.kind: effect`; yalnız Potion of Flying testte | Kayıt başına `use_item` + etki alanı probe'u |

## Karar gerekli (birleşik)

Bölüm tablolarındaki karar maddelerinin tek listesi; ayrıntı ve gerekçe ilgili bölümde. Aynı konu iki bölümde çıktıysa birlikte yazıldı.

| # | Konu | Bölüm | Öneri (kısa) |
|---|---|---|---|
| K-S1 / K-Z1 | Kalkan + Two-Handed silah (S20, Z31) | Silah, Zırh | 98'de kalkanlıyken Two-Handed saldırı reddi (Lance binekte hariç); oluşturucuda sorun; kalkan tak/çıkar (Z9) aynı pakette |
| K-T1 | Tür kaynaklarının savaşlar arası takibi (T44) | Tür | SRD'ye hizala (kaynaklar kayıtlı durumda, Adrenaline Rush kısa dinlenmede); denge hızlı regresyonla |
| K-D1 | Sarf envanteri: iksir adedi, kullanılan iksirin düşmesi, cephane stoku | Donanım | Sayfada adet + savaş sonu düşüm; cephanede SRD yarı geri kazanım |
| K-D2 | Eşya ↔ silah bağı (+N, onHit, Flame Tongue) | Donanım | `weapons[].itemId`; bonus yalnız o seçenekte |
| K-F2 | Human Versatile ikinci köken feat'i (F9, T38) | Feat, Tür | Karakterde ayrı Origin feat yuvası (varsayılan Skilled) |
| K-T4 / K-G1 | Türden serbest beceri her türe (T17, T37, G12) | Tür, Geçmiş | Hak yalnız Human (serbest) ve Elf (Insight/Perception/Survival); fazlası eski kayıtta sessizce yok sayılsın |
| K-F1 | ASI/Epic yuvasında Fighting Style feat'i (F2) | Feat | SRD'ye uy: Fighting Style özelliği olan sınıfa izin |
| K-F3 | Boon of Spell Recall ön koşulu (Warlock Pact Magic, paket büyücüleri) | Feat | "Büyü slotu veren özellik" sınıf + alt sınıf düzeyinde |
| K-F4 / K-T6 | Peerless Aim, Improve Fate, Heroic Inspiration kendiliğinden kullanılıyor | Feat, Tür | Şimdilik kalsın; ileride "Sor/Her zaman" ayarı (Stroke of Luck kararıyla ortak) |
| K-T2 | Giant Ancestry otomatik, turda bir, yalnız silah (T25) | Tür | Tepki sorusuyla seçimli, tur sınırı yok, büyü saldırısı dahil; ya da sapma olarak kalsın |
| K-T3 | Stone's Endurance yalnız saldırı hasarında (T27) | Tür | Hasar tepkisi yoluna bağla (alan ve büyü hasarı) |
| K-T5 | Soy büyü yeteneği seçimi (T15) | Tür | Oluşturucuda INT/WIS/CHA seçimi ya da sapma |
| K-G2 | Geçmiş bonusu zorunlu mu (G2) | Geçmiş | Geçmiş seçili ve bonus boşsa sorun; geçmişsiz eski kayıt muaf |
| K-G3 | Başlangıç donanımı A/B ve para (G16) | Geçmiş | Ya bilinçli sapma (serbest donanım) ya Serüven başında A paketi / 50 GP |
| K-G4 | Alet modeli (G10, G13–G15) | Geçmiş | Asgari: alet metni oluşturucuya; tam: alet yetkinliği + Thieves' Tools kilit kuralı |
| K-S2 | Nick hangi silahta sayılır (S25) | Silah | İki elden birindeki açık Nick ustalığı |
| K-S3 | Loading silah başına mı (S14) | Silah | Ateşlenen silah kimliği başına |
| K-S4 | Push mesafesi ve otomatik seçimler (S23, S26) | Silah | 5/10 ft seçimi `pushChoice`'a ya da DECISIONS'a sapma |
| K-S5 | Doğaçlama silah değerleri (S32) | Silah | 1d4 ya da eşdeğer silah; kılıç nesnesi gerçek Longsword |
| K-Z2 | Eğitimsiz zırhta saldırı dezavantajının kapsamı (Z16) | Zırh | Yalnız STR/DEX saldırılarına |
| K-Z3 | Kalkanın +2'si kodda sabit | Zırh | `data/armor.json`'a Shield kaydı (davranış aynı) |
| K-D3 | Alchemist's Fire söndürme (DC 10 DEX) | Donanım | SRD'ye dön (eylem, Prone) ya da sapmayı DECISIONS'a yaz |
| K-D4 | Utilize eşyaları (Caltrops, Ball Bearings, Hunting Trap, Manacles, Oil) | Donanım | Caltrops/Ball Bearings yüzey; tuzak/kelepçe Game Master'a, `offCombat` metni düzelsin |
| K-D5 | Game Master'a bırakılan 10 eşyada `bonus` yine uygulanıyor | Donanım | Ya "kısmi" diye belgele ya bütün alanları savaş başında kaldır |

## Düzeltme önerileri (sıralı)

Savaş sonucunu değiştirenler yeni kural sürümüne: **98** (mevcut en yüksek 97 + 1, tek sabit; 97 ve altı kayıt/replay eski davranış). Ayrıntı ve dosya yerleri bölüm önerilerinde.

**A. Sürümlü (kural sürümü 98), öncelik sırasıyla**

1. Tür save avantajlarına `against`: `grapple.ts`, `monsters.ts`, `durations.ts`, `effects.ts`, `ridersA2.ts` save yolları (T öneri 1). Yüksek.
2. Mage Armor / Armor of Shadows tabanı kalkan ve eşya bonusunu yutmasın (Z öneri 1). Yüksek.
3. Javelin of Lightning (çizgi alan, DC 13) ve Ammunition of Slaying (tür seçimi, DC 17 CON, Force, tek kullanım) yeniden modellensin (D öneri 4). Yüksek.
4. Potion of Speed uyuşukluğu kalksın, Potion of Poison hasarı tam (D öneri 2, 3). Yüksek/orta.
5. Savage Attacker yalnız silahta; Blink Steps yalnız Attack/Magic eyleminden sonra (F öneri 1, 2). Yüksek.
6. Kalkan + Two-Handed reddi, kalkan tak/çıkar Utilize (S öneri 1, Z öneri 5–6; K-S1/K-Z1 kararına bağlı; yeni olay kayıt sürümünü 25'e çıkarır). Yüksek.
7. Eğitimsiz zırhta inisiyatif ve Gizlen dezavantajı (Z öneri 2, 3); eğitimsiz kalkanın sihirli bonusu (Z öneri 4). Yüksek/orta.
8. Tür kaynakları kalıcılığı (T öneri 2; K-T1 kararına bağlı). Yüksek.
9. Irresistible Offense büyü saldırısı/alan yolunda, Free Casting tepki büyüsü slotunda (F öneri 3, 4). Orta.
10. Stonecunning 96+ yolunda "yeri bilir"e bağlansın; Halfling Luck ölüm save'i ve inisiyatifte; Draconic Flight Incapacitated'da biter (T öneri 3–5). Orta.
11. Nick ana el silahında, Net kalanları (Huge+ otomatik başarı, görme şartı, ağı kesme), Wand of the War Mage yalnız büyü saldırısına, değnek yüküyle yukarı seviye (S öneri 3, 5; D öneri 5, 7, 9). Orta.
12. Düşük öncelikliler: Loading silah başına, fırsat saldırısında en uzun erişim, fırlatılan Monk silahında Martial Arts, doğaçlama silah, boş el şartı (S öneri 2, 4, 6–8); Large Form sığma, Naturally Stealthy (T öneri 6–7); eğitimsiz zırh saldırı kapsamı, sihirli zırh eşleşmesi (Z öneri 7–8); Basic Poison, Boots of Speed/Cloak of Displacement, ışık kaynakları loş modeli (D öneri 6, 8, 11); Alert Initiative Swap kuralı (F öneri 6); Thieves' Tools kilit kuralı (G öneri 5).

**B. Sürümsüz (oluşturucu, veri, arayüz, uygulama katmanı)**

1. Eşya şarjlarını kayıtlı durumda koru (`withStatus` savaşçıdaki eşya kaynaklarını ezmesin, `fullStatus` eşya kaynaklarını içersin) (D öneri 1). Yüksek; savaş olayları değişmez.
2. Human Versatile ikinci köken feat'i (F öneri 8 = T öneri 8; K-F2). Orta.
3. Feat ön koşulu yuvanın önceki skorlarıyla (Grappler; F öneri 5). Orta.
4. Tür becerisi Human/Elf'e bağlansın, Keen Senses listesi (T öneri 11 = G öneri 1; K-T4/K-G1). Orta.
5. Geçmiş bonusu boşken sorun ya da belirgin uyarı (G öneri 2; K-G2). Orta.
6. Fighting Style feat'i ASI/Epic yuvasında (F öneri 7; K-F1). Düşük.
7. Otherworldly Presence (Thaumaturgy), Human/Tiefling/Celestial Small boyut seçimi, Celestial ve Tiefling Kanatlı metinleri, `docs/SRD-DENETIM.md` düzeltmeleri (T öneri 9, 10, 12). Düşük.
8. Alet metni, başlangıç donanımı kararı, Skilled'a alet seçeneği (G öneri 3, 4, 6). Düşük.
9. Kalkan verisi `data/armor.json`'a, cephane ve nesne fırlatma sapmalarının DECISIONS'a yazılması, `offCombat` gerekçe metinleri, uyum ön şartı yalnız oluşturucuda (Z öneri 9, S öneri 9, D öneri 10, 12). Düşük.
10. Fast Wrestler testi (F öneri 9). Düşük.

## 1. Türler (T)

> 2026-11-20, kural sürümü 97. Salt okunur denetim: kod, veri, test ve belge değişmedi. Şüpheli satırlar geçici testlerle gerçekten çalıştırıldı (`src/battle/zzTmpTFE1a.test.ts`, `zzTmpTFE1b.test.ts`; iş bitince silindi). Ölçüt SRD 5.2.1 s. 84–86 (türler), s. 6 (D20 Test), s. 8 (Heroic Inspiration), s. 13–14 (inisiyatif, yaratıkların arasından geçme), s. 17 (ölüm save'i), s. 190 (Tremorsense); alt soylar ve Celestial için ölçüt kendi metnimiz (`data/races.json` `summary`, `data/alt-soy-metin.json`, `data/celestial.json`, `docs/ALT-SOY-41.md`). Var olan testler (`lineage.test.ts`, `altSoy.test.ts`, `k19items.test.ts`, `celestial.test.ts`, `carry.test.ts`: 77/77) bu denetimde geçti.

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| T1 | Boyut: Dragonborn, Dwarf, Elf, Goliath, Orc Medium; Gnome, Halfling Small (s. 84–86) | `src/battle/create.ts:470` (`race.sizes`) | tam | probe PT1 |
| T2 | Human ve Tiefling boyutu Small ya da Medium, tür seçilirken (s. 86) | `create.ts:470` her zaman `M`; karakterde boyut alanı yok | yok | PT1 (Human/Tiefling `size=M`); oluşturucuda seçim yok |
| T3 | Hız 30 ft; Goliath 35; Wood Elf 35 (s. 84–86) | `src/rules/lineage.ts:31` `raceSpeed` | tam | PT1; `lineage.test.ts` |
| T4 | Darkvision 60 ft; Dwarf, Orc, Drow 120; Goliath, Halfling, Human yok (s. 84–86) | `lineage.ts:36` `raceDarkvision`, `create.ts:313` | tam | PT1 |
| T5 | Dragonborn Draconic Ancestry tablosu + Damage Resistance (s. 84) | `data/races.json` `lineages[].resistances`, `create.ts:151` | tam | PT1 (Red → fire); `lineage.test.ts` "10 atanın her biri" |
| T6 | Breath Weapon: Attack eyleminde bir saldırının yerine, 15 ft koni / 30×5 ft çizgi, DEX DC 8 + CON + PB, 1d10 (5: 2d10, 11: 3d10, 17: 4d10), PB kullanım, uzun dinlenme (s. 84) | `create.ts:147` `breathOf`, `areaAttack.ts:263`, `economy.ts:202` | tam | PT1 (DC 13, 2d10 sv5), PT7 (nefesten sonra `attacksLeft=1`, ikinci saldırı geçerli); `areaAttack.test.ts` |
| T7 | Draconic Flight: 5+, bonus eylem, 10 dk, uçuş = Speed, Incapacitated olunca biter, uzun dinlenmede bir (s. 84) | `src/battle/species.ts:45`, `apex.ts:230` | kısmi | PT6: Stunned olunca kanatlar sürüyor; kaynak savaş başında yeniden dolar (T40 ile aynı kök) |
| T8 | Dwarven Resilience: Poison direnci (s. 84) | `races.json` dwarf `resistances` | tam | PT1 |
| T9 | Dwarven Resilience: Poisoned'dan kaçınma/bitirme save'lerinde avantaj (s. 84) | `species.ts:29` `saveAdvAgainst` → `effectDice.ts` (yalnız `resolveSave` girdisinde `against` varsa) | kısmi | Büyü save'inde çalışır (`spells.ts:334`); canavar save saldırısı (`monsters.ts:99`), saldırı eki (`grapple.ts:164`), tur sonu tekrar save'i (`durations.ts:108`, `effects.ts:225`) `against` vermiyor: PT8 Chuul nat 2 yeniden atılmadı, PT4 Poisoned tekrar save'i avantajsız |
| T10 | Dwarven Toughness: seviye başına +1 HP (s. 84) | `races.json` `hpPerLevel`, `src/rules/stats.ts:314` | tam | PT1 (sv5 Fighter: Dwarf 49, Human 44) |
| T11 | Stonecunning: bonus eylem, taş yüzeyde 60 ft Tremorsense 10 dk, PB kullanım, uzun dinlenme (s. 84; Tremorsense s. 190) | `species.ts:30`, `sight.ts:74` | kısmi | Taş yüzey şartı yok; GENEL96 (96+) Tremorsense'i "görme değil" yaptı ama yer bilmeye bağlanmadı: PT10 sürüm 95 `senseSees=true`, 97 `senseSees=false`, `knowsWhere=false` (kaynak harcanır, etki yok); kaynak savaş başında dolar |
| T12 | Elven Lineage 1. seviye: Drow DV 120 + Dancing Lights, High Elf Prestidigitation, Wood Elf 35 ft + Druidcraft (s. 85) | `races.json` elf `lineages`, `lineage.ts:38` | tam | PT1; `lineage.test.ts` |
| T13 | High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme (s. 85) | `races.json` high-elf `extras` (status `none`, "henüz oyunda yok") | yok | veri notu; savaş etkisi küçük |
| T14 | Soy/Legacy 3. ve 5. seviye büyüsü: hep hazır, uzun dinlenmede bir kez slotsuz, slotla da (s. 84–86) | `data/class-features.json` `<soy>:<büyü>` (`fixed 1`, `long`), `create.ts:246` | tam | PT1 (kaynaklar), PT11 (kısa dinlenme 0, uzun 1); `lineage.test.ts` "Drow Faerie Fire slotsuz" |
| T15 | Soy büyülerinin yeteneği INT/WIS/CHA, soy seçilirken seçilir (s. 85, 86) | `create.ts:262` (büyücüde sınıfın yeteneği, değilse en yükseği) | bilinçli sapma | DECISIONS.md Görev K3 "Büyü yeteneği… yaklaşık" |
| T16 | Fey Ancestry: Charmed'dan kaçınma/bitirme save'lerinde avantaj (s. 85) | `species.ts:33` | kısmi | PT8 Hypnotic Pattern ilk save'i yeniden atıldı (2 → 19); PT4 Charmed tekrar save'i avantajsız (T9 ile aynı kök) |
| T17 | Keen Senses: Insight, Perception ya da Survival yetkinliği (s. 85) | `src/rules/backgrounds.ts:82`, `src/rules/builder.ts:394` (türden 1 serbest beceri, liste yok) | kısmi | PT9: Elf serbest beceri olarak History alabildi |
| T18 | Trance: büyü uyutamaz; 4 saatte uzun dinlenme (s. 85) | `spells.ts:330` (Sleep, `sleeplessPass`) | tam | kod okuması; 4 saat savaş dışı |
| T19 | Gnomish Cunning: INT/WIS/CHA save avantajı (s. 85) | `species.ts:34`, `durations.ts:171` (`saveAdv`, her save yolunda) | tam | PT1 (etki var); `saveMode` bütün yollarda okur |
| T20 | Forest Gnome: Minor Illusion + Speak with Animals PB kez slotsuz, uzun dinlenme, slotla da (s. 85) | `races.json`, `class-features.json` `forest-gnome:speak-with-animals` | tam | PT1 (kaynak 3); büyüler savaş dışı |
| T21 | Rock Gnome: Mending + Prestidigitation (s. 85) | `races.json` rock-gnome `spells` | tam | PT1 |
| T22 | Rock Gnome: saat işi aygıt (AC 5, 1 HP; en çok 3) (s. 85) | `races.json` rock-gnome `extras` (status `none`) | yok | veri notu ("henüz oyunda yok") |
| T23 | Giant Ancestry: PB kullanım, uzun dinlenme (s. 85) | `class-features.json` `giantAncestry`, `src/battle/giant.ts:13` | tam | PT1 (3), PT2 (kayıtlı durumda kalıcı) |
| T24 | Cloud's Jaunt: bonus eylem, görülen boş altıgene 30 ft ışınlanma (s. 85) | `create.ts:130` `lineageFeatures` | tam | `lineage.test.ts` |
| T25 | Fire's Burn / Frost's Chill / Hill's Tumble: saldırı zarıyla isabette, seçimli, tur sınırı yok (s. 85) | `giant.ts:38` (yalnız silah, otomatik, turda bir) | bilinçli sapma | DECISIONS.md Görev K3; PT7 ikinci isabette kaynak harcanmadı |
| T26 | Frost's Chill hız −10 ft sonraki turun başına dek; Hill's Tumble Large ve küçüğü Prone (s. 85) | `giant.ts:48–51` | tam | `lineage.test.ts` "Frost's Chill… Hill's Tumble" |
| T27 | Stone's Endurance: hasar alınca tepki, 1d12 + CON azaltma (s. 85) | `create.ts:136` (yalnız saldırı isabetinin hasarı) | bilinçli sapma | DECISIONS.md Görev K3 "yalnızca saldırı isabetinin hasarı" |
| T28 | Storm's Thunder: 60 ft içinden hasar verene tepkiyle 1d8 Thunder (s. 86) | `create.ts:139` (`kind: 'thunder'`) | tam | `lineage.test.ts` |
| T29 | Large Form: 5+, bonus eylem, yer yetiyorsa, 10 dk Large, STR kontrollerinde avantaj, hız +10, uzun dinlenmede bir (s. 86) | `species.ts:46`, `apex.ts:102` | kısmi | PT6 (`size`, `checkAdv`, `speedFt` var); yer sığma denetimi yok (`multiHex` açıkken önemli); kaynak savaş başında dolar |
| T30 | Powerful Build: Grappled'ı bitirme kontrolünde avantaj (s. 86) | `src/battle/grapple.ts:83` (anahtar `powerfulBuild`) | tam | kod okuması |
| T31 | Powerful Build: taşıma kapasitesinde bir boy büyük (s. 86) | `src/rules/carry.ts:7` | tam | `carry.test.ts` |
| T32 | Brave: Frightened'dan kaçınma/bitirme save'lerinde avantaj (s. 86) | `species.ts:36` | kısmi | PT4 Frightened tekrar save'i avantajsız (T9 ile aynı kök) |
| T33 | Halfling Nimbleness: bir boy büyük yaratığın alanından geçer, duramaz (s. 86; s. 14 zorlu arazi) | `movement.ts:487` | tam | `k19items.test.ts` |
| T34 | Luck: D20 Test'te doğal 1 yeniden atılır (s. 86; D20 Test s. 6) | `effectDice.ts:70` | kısmi | PT5 saldırıda çalışıyor; ölüm save'inde yok (doğal 1 → 2 başarısızlık, `commands.ts` ölüm save'i), inisiyatifte yok (`create.ts:847` tür işaretlerinden önce atılıyor; inisiyatif s. 13 DEX kontrolü) |
| T35 | Naturally Stealthy: en az bir boy büyük yaratıkla örtülüyken Hide (s. 86) | `src/battle/stealth.ts:123` | kısmi | yaklaşık: bitişik büyük yaratık yeterli, gözlemciyle arada olması aranmıyor |
| T36 | Resourceful: uzun dinlenmede Heroic Inspiration (s. 86; s. 8 herhangi bir zarı yeniden) | `species.ts:38`, `effectDice.ts:73` | kısmi | PT2: her savaş başında 1 (uzun dinlenmeye bağlı değil); yalnız başarısız d20'de otomatik |
| T37 | Skillful: bir beceri yetkinliği (s. 86) | `backgrounds.ts:82` (`3 − geçmiş`) | kısmi | Human alır; PT9: Dwarf, Orc da aynı serbest beceriyi alıyor (SRD'de yok) |
| T38 | Versatile: seçilen bir Origin feat (s. 86) | `backgrounds.ts:76` `originFeatOf` (geçmiş varsa yalnız onunki) | yok | PT9: Human + Soldier + `originFeat: alert` → yalnız `savage-attacker`; `docs/SRD-DENETIM.md` "tam" yanlış |
| T39 | Adrenaline Rush: bonus eylemle Dash + PB geçici HP; PB kullanım, kısa/uzun dinlenme (s. 86) | `species.ts:40`, `apex.ts:230` | kısmi | Etki tam (`k19items.test.ts`); PT2: kayıtlı durumda yok, her savaş başında PB'ye döner |
| T40 | Relentless Endurance: anında ölmeden 0 HP'de 1 HP; uzun dinlenmede bir (s. 86) | `damage-effects.ts:78`, `species.ts:41`; `create.ts:89–95` `withSpecies` | kısmi | PT3: 0 → 1 HP, ikinci kez yok; PT2: `fullStatus`'ta anahtar yok, 0'a düşmüş kaynak savaş başında 1 olur (Serüven'de her savaş) |
| T41 | Fiendish Legacy 1. seviye: direnç + cantrip (Abyssal Poison/Poison Spray, Chthonic Necrotic/Chill Touch, Infernal Fire/Fire Bolt) (s. 86) | `races.json` tiefling `lineages`, `create.ts:246` | tam | PT1; `lineage.test.ts` |
| T42 | Fiendish Legacy 3./5. seviye büyüleri (s. 86) | `class-features.json` `abyssal:*`, `chthonic:*`, `infernal:*` | tam | PT1 (Hellish Rebuke tepkisi `spells:hellish-rebuke`); `lineage.test.ts` |
| T43 | Otherworldly Presence: Thaumaturgy cantrip'i, Legacy yeteneğiyle (s. 86) | yok (`races.json` yalnız `traits` metninde) | yok | PT1: hiçbir Tiefling'in `spellNames`'inde yok; savaş dışı cantrip; `docs/SRD-DENETIM.md` "tam" yanlış |
| T44 | Tür kaynaklarının savaşlar arası takibi (s. 84–86 "regain… when you finish a Long/Short Rest") | `create.ts:94` `resources: { ...c0.resources, ...sp.resources }` (ezer); `characterRest.ts:58` `fullStatus` bunları bilmez | kısmi | PT2: `relentlessEndurance`, `adrenalineRush`, `heroicInspiration`, `stonecunning`, `draconicFlight`, `largeForm` durumda yok, savaş başında doluyor; `breathWeapon`, `giantAncestry`, soy büyüleri kalıcı ve uzun dinlenmede doluyor (PT11) |
| T45 | Aasimar (SRD 5.2.1'de yok; ölçülen PDF'te geçmiyor) | yerine Celestial (bizim ırk) | bilinçli sapma | kullanıcı kararı; CLAUDE.md Celestial K49 |
| C1 | Celestial: Medium ya da Small (bizim veri `sizes: ["M","S"]`) | `create.ts:470` her zaman `M` | kısmi | PT1 (T2 ile aynı kök) |
| C2 | Celestial: Darkvision 60, Radiant + Necrotic direnci (bizim metin "Düşmüşün Görüşü", "Gök ve Gölge") | `races.json` celestial | tam | PT1 |
| C3 | Celestial: Light cantrip'i, Şifa Eli (eylem, PB×d4, uzun dinlenme), Göksel Uyanış (3+, bonus, 10 tur, uzun dinlenme, turda bir +PB) (bizim metin) | `src/battle/celestial.ts:47`, `class-features.json` `celestialHeal`/`celestialAwakening` | tam | PT1; `celestial.test.ts` |
| C4 | Celestial biçimleri: Parlayan Ruh, Gece Gözyaşı, Kırık Kanat (13+ normal uçuş) (bizim metin) | `celestial.ts`, `data/celestial.json` `ucus` | tam | `celestial.test.ts`, `u1a.test.ts` |
| C5 | Celestial kalıcı ırk (K49, sürüm 22+) ile metin | `races.json` celestial `traits` "Ev kuralı: Ayarlar'da açılır"; `celestial.json` `not` "EV KURALI… varsayılan kapalı" | kısmi | metin eski; motor `celestialOn` 22+ her zaman açık |
| L1 | Alt soy buff/debuff mekaniği (38 soy; bizim metin `alt-soy-metin.json`, `docs/ALT-SOY-41.md`) | `lineage.ts:23` `lineageEtki`, `src/battle/soyEtki.ts` | tam | `altSoy.test.ts` (37), `src/sim/altSoyRegresyon.test.ts`; PT1 (Drow `sunlight-sensitive`, Goliath/Halfling hızları) |
| L2 | Tiefling Kanatlı: metin "soy hasar direncini kaybedersin; orta/ağır zırhla uçamazsın" | `races.json` winged (direnç yok, `spells` yok) | kısmi | PT1: Legacy büyüleri ve cantrip'i de yok; metin büyü kaybını söylemiyor |

**Bölüm sayıları:** tam 26, kısmi 17, yok 5, bilinçli sapma 4, doğrulanmadı 0 (toplam 52)

### Öne çıkan bulgular (T)

1. **Dwarven Resilience, Fey Ancestry, Brave save yollarının çoğunda çalışmıyor (T9, T16, T32).** Avantaj, `resolveSave` girdisinde üst düzey `against` varsa uygulanıyor. Büyü save'leri bunu veriyor (PT8: Hypnotic Pattern'de Elf yeniden attı). Canavar save saldırısı (`monsters.ts:99`), saldırı ekleri (`grapple.ts:164` `saveFails`), süreli durumun tur sonu tekrar save'i (`durations.ts:108`) ve süren etkinin tekrar save'i (`effects.ts:225`) ise `against`'ı yalnız `saveMode` bağlamına geçiriyor. PT4/PT8: Dwarf, Chuul'un Poisoned save'inde ve Poisoned tekrar save'inde avantaj almıyor. SRD açıkça "avoid **or end**" diyor. Aynı kök eşya kaynaklı `saveAdvAgainst`'ı (Antitoxin vb.) da etkiliyor olabilir (doğrulanmadı).
2. **Tür kaynakları Serüven'de/savaşlar arasında her savaşta yeniden doluyor (T44; T7, T11, T29, T36, T39, T40).** `withSpecies` (`create.ts:89–95`) `speciesParts` kaynaklarını kayıtlı durumun üstüne yazıyor; bu kaynaklar `class-features.json`'da olmadığı için `fullStatus`/`applyBattleResult` onları hiç tutmuyor. Sonuç: Relentless Endurance savaş başına bir (SRD: uzun dinlenmede bir); Adrenaline Rush, Heroic Inspiration, Draconic Flight, Large Form ve Stonecunning de öyle. Breath Weapon, Giant Ancestry ve soy büyüleri doğru şekilde kalıcı (PT2, PT11). DENGE'deki Orc %82–85 sonucuyla ilgili olabilir.
3. **Stonecunning 96+'da etkisiz (T11).** GENEL96 H10, Tremorsense'i görme saymaktan çıkardı. Ama süren etki `tremorsense`'i "yeri bilir"e (`knowsWhere`) bağlanmadı: 97'de bonus eylem ve kaynak harcanıyor, hiçbir etkisi yok (PT10).
4. **Human Versatile yok, Otherworldly Presence yok (T38, T43).** Geçmiş seçili karakterde köken feat'i yalnız geçmişten geliyor; Human'ın ikinci Origin feat'i yok. Tiefling'e Thaumaturgy verilmiyor. `docs/SRD-DENETIM.md` ikisini de "tam" sayıyor (eski denetim hatası).
5. **Halfling Luck ölüm save'inde ve inisiyatifte yok (T34).** Draconic Flight, Incapacitated olunca bitmiyor (T7).
6. **Oluşturucu:** türden gelen serbest beceri her türe veriliyor ve Keen Senses listesiyle sınırlı değil (T17, T37). Human ve Tiefling için Small seçilemiyor, kendi verimizde Celestial için de (T2, C1). Celestial metni hâlâ "ev kuralı, Ayarlar'da açılır" diyor (C5).

### Karar gerekli (T)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-T1 | Tür kaynaklarının savaşlar arası takibi (T44) | DECISIONS K19 "oluşturucuda eklenmez, böylece eski karakterlerin kaynakları değişmez" diyor. Düzeltme, Orc/Human/Dragonborn/Goliath dengesini (Serüven zinciri) düşürür | SRD'ye hizala: kaynakları `class-features.json`'a `race` ile taşı (Adrenaline Rush `short`), kayıtlı durumda yoksa dolu say; denge yalnız hızlı regresyonla |
| K-T2 | Giant Ancestry: otomatik, turda bir, yalnız silah (T25) | DECISIONS K3 bilinçli; SRD tur sınırı koymuyor, büyü saldırısını da kapsıyor, kullanım seçimli | Tepki sorusu altyapısıyla (`askReaction`) seçimli yap, tur sınırını kaldır, saldırı zarlı büyüyü kapsa; ya da sapma olarak bırak |
| K-T3 | Stone's Endurance yalnız saldırı hasarında (T27) | DECISIONS K3; SRD "When you take damage" | Hasar tepkisi yoluna (Hellish Rebuke gibi) bağla, alan ve büyü hasarını da kapsa |
| K-T4 | Türden serbest beceri (T17, T37) | Her türe 1 beceri SRD'de yok; kaldırmak eski kayıtları geçersiz kılar (kaydetme engeli) | Hakkı yalnız Human (serbest) ve Elf (Insight/Perception/Survival) için tut; eski kayıtta fazlası sessizce yok sayılsın (`otherSkillsOf` gibi) |
| K-T5 | Soy büyü yeteneği seçimi (T15) | DECISIONS K3 yaklaşım | Oluşturucuya INT/WIS/CHA seçimi ekle (yoksa bugünkü kural) ya da sapma olarak bırak |
| K-T6 | Heroic Inspiration'ın otomatik kullanımı (T36) | SRD "herhangi bir zar"; oyunda başarısız d20'de kendiliğinden | Heroic Warrior ile ortak; arayüz sorusu mu, otomatik mi, kullanıcı seçmeli |

### Düzeltme önerileri (T)

1. `against` eksikliği: `grapple.ts:164` `saveFails`, `monsters.ts:99`, `durations.ts:108`, `effects.ts:225` (ve `ridersA2.ts:84`) `resolveSave`'e üst düzey `against` geçirilsin. Öncelik yüksek. **Sürümlü (kural sürümü 98).**
2. Tür kaynakları kalıcılığı (K-T1 onayıyla): `withSpecies` kayıtlı değeri ezmesin, kaynaklar `fullStatus`'a girsin, Adrenaline Rush kısa dinlenmede dolsun. Öncelik yüksek. **Sürümlü (kural sürümü 98).**
3. Stonecunning: 96+ yolunda süren etki `tremorsense`'i `knowsWhere`'e (yerdeki yaratık, aynı yüzey) bağla; taş yüzey şartını zemin etiketinden ekle. Öncelik orta. **Sürümlü (kural sürümü 98).**
4. Halfling Luck: ölüm save'i ve inisiyatif (inisiyatifte tür işaretini atıştan önce oku). Öncelik orta. **Sürümlü (kural sürümü 98).**
5. Draconic Flight: Incapacitated olunca etki bitsin (`endsIfSourceDown` benzeri), isteğe bağlı erken bırakma. Öncelik orta. **Sürümlü (kural sürümü 98).**
6. Large Form: `multiHex` açıkken gövde sığma denetimi (`bodyFitProblem`). Öncelik düşük. **Sürümlü (kural sürümü 98).**
7. Naturally Stealthy: örten yaratık gözlemciyle gizlenen arasında olsun. Öncelik düşük. **Sürümlü (kural sürümü 98).**
8. Human Versatile: geçmişten ayrı ikinci Origin feat yuvası (`sheetFeats`). Öncelik orta. **Sürümsüz (oluşturucu/veri)**; feat etkisi yeni karakterde.
9. Otherworldly Presence: Thaumaturgy'yi Tiefling'in bilinenlerine ekle (savaş dışı). Öncelik düşük. **Sürümsüz (oluşturucu/veri).**
10. Human/Tiefling/Celestial boyut seçimi (Small): karakter alanı + `create.ts:470`. Öncelik düşük. **Sürümsüz (oluşturucu/veri)**: yalnız yeni seçim.
11. Keen Senses listesi ve tür becerisi (K-T4 onayıyla). Öncelik düşük. **Sürümsüz (oluşturucu/veri).**
12. Metin: `races.json` celestial `traits` ve `celestial.json` `not` (kalıcı ırk), Tiefling Kanatlı metnine Legacy büyülerinin kaybı; `docs/SRD-DENETIM.md` satırları (Versatile, Otherworldly Presence, Powerful Build) güncellensin. Öncelik düşük. **Sürümsüz (oluşturucu/veri/arayüz).**

### Probe dökümü (T)

- **PT1** → 15 tür/soy, sv5 Fighter: boyut, hız, DV, HP, direnç, büyüler, etkiler, kaynaklar, nefes → Human/Tiefling/Celestial hep `M`; Dwarf HP +5; Drow DV 120; Wood Elf 35; Tiefling'de Thaumaturgy yok; Kanatlı'da direnç ve büyü yok; nefes DC 13 2d10.
- **PT2** → kaynakları 0'a çekilmiş savaşçıyla `startBattle` + `fullStatus` anahtarları → `relentlessEndurance`, `adrenalineRush`, `heroicInspiration`, `stonecunning`, `draconicFlight`, `largeForm` durumda yok ve savaş başında doluyor; `breathWeapon`, `giantAncestry` 0 kalıyor.
- **PT3** → Orc 10 HP, 21+ hasar → 1 HP, kaynak 0 (çalışıyor).
- **PT4** → `timerEvents` tur sonu tekrar save'i (d20 2 sonra 19): Dwarf Poisoned / Elf Charmed / Halfling Frightened yeniden atış yok; Human (Heroic Inspiration) yeniden attı → `against` kökü doğrulandı.
- **PT5** → Halfling ölüm save'inde doğal 1 → 2 başarısızlık (Luck yok); saldırıda doğal 1 → Luck 14.
- **PT6** → Draconic Flight sonrası Stunned + tur sonu: uçuş sürüyor; Large Form etkisi `size 1, checkAdv str, speedFt 10`.
- **PT7** → Fire Goliath iki isabet: ilkinde kaynak 3 → 2, ikincisinde harcanmadı; Dragonborn nefesten sonra `attacksLeft=1`, ikinci saldırı geçerli.
- **PT8** → Dwarf vs Chuul Paralyzing Tentacles (CON save, d20 2): Poisoned uygulandı, yeniden atış yok; Elf vs Hypnotic Pattern: 2 → 19 yeniden atış (büyü yolu doğru).
- **PT9** → `sheetFeats` Human + Soldier + `originFeat: alert` → yalnız `savage-attacker`; Dwarf/Orc/Elf serbest "History" ile tür becerisi sorunu yok.
- **PT10** → Dwarf Stonecunning vs Invisible düşman: sürüm 95 `senseSees=true`; 97 `senseSees=false`, `knowsWhere=false`, kaynak yine harcandı.
- **PT11** → `shortRestStatus`/`longRestStatus`: Breath Weapon ve Drow Darkness kısa dinlenmede 0, uzun dinlenmede dolu.

## 2. Feat'ler (F)

Ölçüt: SRD 5.2.1 "Feats" s. 87–88 (17 feat: 4 köken, 2 genel, 4 Fighting Style, 7 Epic Boon), sınıf tabloları s. 28–63 (Fighter s. 47, Rogue s. 61), Human Versatile s. 86. Kural sürümü 97. Kanıt: geçici probe'lar PF-A (oluşturucu kuralları) ve PF-B (savaş), mevcut testler, kod okuması.

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| F1 | ASI/feat yuvaları 4/8/12/16, Fighter +6/14, Rogue +10, 19 Epic Boon; Fighting Style yuvası (Fighter 1, Paladin/Ranger 2, Champion 7) (s. 47, s. 61, s. 87) | `src/rules/advancement.ts:34` (`data/srd/progression.json` `asiLevels`/`epicBoonLevels`, `featSlot` verisi) | tam | probe PF1: fighter 1s,4,6,7s,8,12,14,16,19e; rogue 4,8,10,12,16,19e |
| F2 | ASI özelliği "ASI feat'i ya da koşulunu sağladığın başka bir feat"; Fighting Style feat'i (ön koşul: Fighting Style özelliği) de buna dahil (s. 47, s. 87) | `src/rules/advancement.ts:70-71`: ASI yuvası yalnız General/Origin, Epic yuvası Epic/General/Origin | kısmi | probe PF3: Fighter 4. ve 19. yuvada Archery reddedilir ("bu seviyede alınamaz"); DECISIONS'ta gerekçe yok |
| F3 | Epic Boon yuvası: Epic Boon ya da koşulunu sağladığın başka bir feat (ASI dahil); ASI yuvasına Boon girmez (s. 87, Level 19+) | `src/rules/advancement.ts:71`, `featProblem` seviye denetimi | tam | probe PF3: 19'da ASI kabul, 4'te Boon of Fate red |
| F4 | Ön koşul seviyesi (Grappler/ASI "Level 4+", Boon "Level 19+") (s. 87–88) | `src/rules/advancement.ts:58-62,72` (yuvanın seviyesiyle) | tam | probe PF3 |
| F5 | Ön koşul yeteneği: Grappler "Strength or Dexterity 13+" (s. 87) | `src/rules/advancement.ts:74-75`; çağıran `src/rules/builder.ts:467` ve `src/screens/Builder.tsx` skorları `advancements: []` ile verir | kısmi | probe PF2: STR/DEX 12 + 4. seviye ASI (+1/+1) = 13/13 iken 8. seviye Grappler "13+ gerekir" diye reddedilir (önceki yuvaların artışı sayılmıyor) |
| F6 | Ön koşul "Spellcasting Feature" (Boon of Spell Recall) (s. 88) | `src/rules/builder.ts:467` `getClass(..).casting !== null` | kısmi | probe PF6: Fighter red, Warlock (Pact Magic) kabul; alt sınıftan büyü yapan (paket `stat: spellcasting`, ör. Eldritch Knight) sınıf düzeyinde bakıldığı için reddedilir (kod okuması); Warlock'un 19'daki bütün slotları 5. seviye, Free Casting hiç tutmaz |
| F7 | Fighting Style feat'i yalnız Fighting Style özelliğiyle; yuvada yalnız Fighting Style kategorisi (s. 87) | `src/rules/advancement.ts:68`, yuva seçeneği Blessed/Druidic Warrior `slotAlternativeById` | tam | probe PF1/PF4; mevcut testler |
| F8 | Köken feat'i geçmişten gelir (s. 83, s. 87 Origin) | `src/rules/backgrounds.ts` `originFeatOf`, `advancement.ts:99` `sheetFeats` | tam | mevcut test `src/screens/g1.test.tsx`; probe PF7 (Soldier → Savage Attacker) |
| F9 | Human Versatile: seçilen ek bir köken feat'i (s. 86) | yok (`data/races.json` human yalnız metin; `sheetFeats` geçmişinkini döner) | yok | probe PF7: Human karakterin feat'leri yalnız `["savage-attacker"]`; DECISIONS "insanın ikinci köken feat'i" çözülemeyenler arasında |
| F10 | Tekrarsız feat ikinci kez alınamaz ("Repeatable" yoksa bir kez) (s. 87) | `src/rules/advancement.ts:258` (köken feat'i dahil) | tam | probe PF4: Soldier + yuvada Savage Attacker, Champion 1+7 Archery → "bir kez alınabilir" |
| F11 | Repeatable: ASI, Skilled (s. 87) | `advancement.ts:258` `repeatable`, `featEffects` toplar (`:218`) | tam | probe PF4: iki ASI sorunsuz; iki Skilled → 6 beceri hakkı |
| F12 | Magic Initiate Repeatable, her seferinde farklı liste (s. 87) | `src/rules/backgrounds.ts:164` (`miDistinct`) | tam | probe PF4: Acolyte (Cleric) + yuvada Cleric → "farklı liste" sorunu; mevcut test `f1.test.ts` |
| F13 | ASI: bir skora +2 ya da iki skora +1, 20'yi aşmaz (s. 87) | `src/rules/advancement.ts:86-96,112-121` | tam | probe PF5: 19+2 → 20; +2/+1 dağıtımı red |
| F14 | Grappler +1 STR/DEX, en çok 20 (s. 87) | `advancement.ts:95-96`, `class-features.json` `feats.grappler.abilityIncrease` | tam | probe PF5: DEX 20 → 20; CHA red |
| F15 | Epic Boon +1, en çok 30; Spell Recall INT/WIS/CHA, Irresistible Offense STR/DEX (s. 88) | `advancement.ts:114`, veri `max: 30`, `choices` | tam | probe PF5: CON 20 → 21; Spell Recall STR red |
| F16 | Alert: inisiyatife PB (s. 87) | `src/rules/stats.ts:349` (PB, Jack of All Trades'in yerine) | tam | probe PF6: Bard 5 DEX+1: Alert'le 4, Alert'siz 2 (yarım PB) |
| F17 | Alert Initiative Swap: inisiyatiften hemen sonra gönüllü bir dostla takas, ikisi de Incapacitated değil (s. 87) | `src/battle/alert.ts:20-29` | kısmi | kod okuması: çağrılan dost (Find Familiar `turn: own` dahil) reddedilir (`:25` `ally.summon`); arayüzde yalnız Alert'linin kendi sırasında (DECISIONS Kuyruk 19 4b), sırada önce oynayan dostla takas pratikte olmaz; mevcut test `k19feat.test.ts:119` |
| F18 | Magic Initiate: iki cantrip + 1. seviye büyü aynı listeden, INT/WIS/CHA, her zaman hazır, uzun dinlenmede bir slotsuz, slotla da (s. 87) | `src/rules/backgrounds.ts:112-151`, savaşçıda `freeSpells`/`spellStats` | tam | mevcut test `src/battle/f1.test.ts` (6 vaka) |
| F19 | Magic Initiate Spell Change: yalnız seviye atlarken bir büyü değişir (s. 87) | oluşturucuda seçim her zaman değişir | bilinçli sapma | DECISIONS 2026-10-30 "Magic Initiate tam (Görev F1)": seviye geçmişi tutulmuyor, kuraldan geniş bilerek |
| F20 | Savage Attacker: turda bir, **silahla** isabette silahın hasar zarları iki kez (s. 87) | `src/battle/features.ts:87-88` `savageReady` (`!spell && !beast`; Unarmed Strike'ı ayırmıyor), `:373` | kısmi | probe PB1/PB1b: Unarmed Strike'ta tetiklenir (zarsız: `rolls [[],[]]`), turun hakkını yakar, aynı turdaki Longsword saldırısında `savage: null`; Monk Martial Arts (1d8) Unarmed Strike'ı iki kez atar. SRD'de Unarmed Strike silah değil |
| F21 | Savage Attacker "either roll" (s. 87) | `features.ts` yüksek atış kendiliğinden | bilinçli sapma | DECISIONS 2026-10-30 "Savage Attacker (Görev F1)" |
| F22 | Skilled: üç beceri ya da alet (s. 87) | `class-features.json` `extraSkills: 3`, `src/rules/builder.ts:529` | tam | probe PF4 (6 = 2 × 3); alet yetkinliği savaş dışı metin |
| F23 | Grappler Punch and Grab: Attack eylemindeki Unarmed Strike isabetinde hasar + Grapple, turda bir (s. 87) | `src/battle/commands.ts:942`, `forced.ts:286` | tam | probe PB6: `attack_resolved` → `grappled`, ek saldırı harcamaz (attacksLeft 1); mevcut test `k19feat.test.ts:72` |
| F24 | Grappler Attack Advantage (s. 87) | `src/battle/divine.ts:331` | tam | probe PB6: ikinci saldırı `advantage` |
| F25 | Grappler Fast Wrestler: kendi boyunda/küçüğü sürüklemek ek hareket istemez (s. 87) | `src/battle/movement.ts:335` | doğrulanmadı | kod var; test ya da probe yok |
| F26 | Archery: Ranged silahla saldırıya +2 (fırlatılan yakın silah değil) (s. 87) | `src/battle/weapons.ts:34` | tam | probe PB5: Longbow +7 / Defense'li +5 |
| F27 | Defense: Light/Medium/Heavy zırhla +1 AC (s. 88) | `src/rules/stats.ts:298` | tam | probe PB5: Leather AC 15 / 14 |
| F28 | Great Weapon Fighting: iki elle tutulan Melee silahta (Two-Handed/Versatile) 1–2 → 3 (s. 88) | `src/battle/weapons.ts:43-44` | tam | probe PB5: Greatsword zarları 1,2 → [3,3] |
| F29 | Two-Weapon Fighting: Light ek saldırısına yetenek değiştiricisi (s. 88) | `src/battle/weapons.ts:46` | tam | probe PB5: yan el Dagger 1d4+3 / TWF'siz 1d4 |
| F30 | Boon of Combat Prowess, Peerless Aim: ıskayı isabete çevir, sonraki tur başına dek bir (s. 88) | `src/battle/effectDice.ts:55`, `boons.ts:22` | bilinçli sapma | probe PB3: d20 5 → isabet, doğal 1 → ıska; kendiliğinden kullanılır; DECISIONS 2026-11-03 "Kuyruk 19 (4c)" (doğal 1 hariç, sorulmaz) |
| F31 | Boon of Dimensional Travel, Blink Steps: **Attack ya da Magic eyleminden hemen sonra** 30 ft ışınlanma (s. 88) | `src/battle/apex.ts:94-99` yalnız `economy.action` bakar | kısmi | probe PB2: Dash ve Dodge'dan sonra da ışınlanır (`teleported`); DECISIONS kararı "Attack ya da Magic" diyor, kod uymuyor |
| F32 | Boon of Fate, Improve Fate: 60 ft'te D20 Testine ±2d4, inisiyatif ya da dinlenmeyle yenilenir (s. 88) | `src/battle/boons.ts:47-51`, `effectDice.ts:51-52`, `auras.ts:183` | bilinçli sapma | mevcut test `k19tier4b.test.ts:262`; yalnız dost başarısızlığı/düşman başarısı, kendiliğinden (DECISIONS Kuyruk 19 4c) |
| F33 | Irresistible Offense, Overcome Defenses: verdiğin **bütün** B/P/S hasarı direnci yok sayar (s. 88) | `src/battle/features.ts:299` (yalnız `weaponAttackEvents`) | kısmi | probe PB4: silah isabeti direnç yok sayılır (applied 28); Ice Knife (Piercing büyü saldırısı) yine dirençli (raw 5 → 2, "resistant"); alan/save hasarı yolu yok (kod okuması) |
| F34 | Irresistible Offense, Overwhelming Strike: saldırı zarında 20 → artırılan skor kadar ek hasar (s. 88) | `src/battle/features.ts:330`; büyü saldırısı `spells.ts:1006` yolunda yok | kısmi | probe PB4: silahta +17; Ice Knife doğal 20'de ek yok |
| F35 | Boon of Spell Recall, Free Casting: 1–4. seviye slotla her büyüde 1d4 = slot seviyesi → slot harcanmaz (s. 88) | `src/battle/boons.ts:54-60`, yalnız `executeCast` (`spells.ts:482`) | kısmi | mevcut test `k19tier4b.test.ts:282`; tepki büyüleri (`reactions.ts:197` Shield/Counterspell/Hellish Rebuke) ve `slots.ts:37`/`apex.ts:169` yollarında d4 atılmaz (kod okuması) |
| F36 | Night Spirit, Merge with Shadows: loşta/karanlıkta bonus eylemle Invisible, eylem/bonus/tepkiyle biter (s. 88) | `src/battle/apex.ts:108-111,237-238` (`breakOnAnyAct`), `boons.ts:34-38` | bilinçli sapma | mevcut test `k19tier4b.test.ts:290`; gölge yalnız karanlık/gece kurallı haritada (`maprules.ts:543` `hasDarkness`): gündüz haritasındaki büyülü Darkness alanı sayılmaz (DECISIONS Kuyruk 19 4c tanımı) |
| F37 | Night Spirit, Shadowy Form: loşta/karanlıkta Psychic/Radiant dışı direnç (s. 88) | `src/battle/boons.ts:41-44` | bilinçli sapma | mevcut test `k19tier4b.test.ts:290`; F36 ile aynı gölge tanımı |
| F38 | Boon of Truesight: 60 ft Truesight (s. 88) | `src/battle/sight.ts:27` (`truesightRange`) | tam | mevcut testler `k19tier4b.test.ts:290`, `k63.test.ts` |

**Bölüm sayıları:** tam 21, kısmi 9, yok 1, bilinçli sapma 6, doğrulanmadı 1 (toplam 38)

### Öne çıkan bulgular (F)

1. **Savage Attacker Unarmed Strike'ta tetikleniyor (F20).** SRD'de Unarmed Strike silah değil. Fighter'da zar olmadığı için turun tek hakkı boşa yanıyor; aynı turdaki silah saldırısı faydayı alamıyor. Monk'ta ise Martial Arts zarı haksız yere iki kez atılıyor (probe PB1/PB1b).
2. **Blink Steps her eylemden sonra açılıyor (F31).** `apex.ts:97` yalnız "eylem harcandı mı" diye bakıyor. Dash, Dodge, Disengage, Help ve Hide'dan sonra da 30 ft ışınlanılıyor (probe PB2). DECISIONS'taki "Attack ya da Magic" kararıyla çelişiyor.
3. **Irresistible Offense yalnız silah saldırısı yolunda (F33, F34).** B/P/S büyü saldırısı (Ice Knife), alan ya da save hasarı direnci yok saymıyor. Büyü saldırısında doğal 20 ek hasar vermiyor (probe PB4).
4. **Grappler'ın yetenek ön koşulu önceki artışları görmüyor (F5).** Oluşturucu, 4. seviyedeki ASI ile 13'e çıkan STR/DEX'e rağmen 8. seviyede Grappler'ı reddediyor (probe PF2). Bunun yerine o yuvanın önceki skorlarına bakılmalı.
5. **Human Versatile'ın köken feat'i hiç verilmiyor (F9).** SRD'de her Human ikinci bir köken feat'i alır (Skilled önerilir). Oyunda yalnız geçmişin feat'i var (probe PF7).
6. **ASI ve Epic yuvalarında Fighting Style feat'i alınamıyor (F2).** SRD bunu Fighting Style özelliği olan sınıflara açık bırakıyor. Kod reddediyor ve DECISIONS'ta bunun gerekçesi yok.

### Karar gerekli (F)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-F1 | ASI/Epic yuvasında Fighting Style feat'i (F2) | SRD'ye göre seçilebilir; ancak yuvayı ve oluşturucunun "Dövüş Stili" kartlarını değiştirir, sınıf dengesi (Fighter'ın 2. Archery'si zaten yasak, F10) | SRD'ye uy: ASI/Epic yuvasında Fighting Style özelliği olan sınıfa izin ver (tekrar yasağı sürer) |
| K-F2 | Human Versatile köken feat'i (F9) | Oluşturucuya yeni seçim ve kayıt alanı gerekir; Human'ı belirgin biçimde güçlendirir (Alert/Magic Initiate) | Karakterde `speciesFeat` (Origin kategorisi, varsayılan Skilled); `sheetFeats`'e ekle; eski kayıtta boş = Skilled önerisi |
| K-F3 | Boon of Spell Recall ön koşulu (F6) | Warlock'un Pact Magic'i "Spellcasting Feature" sayılır mı belirsiz; 19'da Pact slotları 5. seviye olduğu için Free Casting işe yaramaz; paket alt sınıf büyücüleri (Eldritch Knight) reddediliyor | Ön koşulu "büyü slotu veren özellik" olarak sınıf + alt sınıf düzeyinde denetle; Warlock'ta uyarı notu |
| K-F4 | Peerless Aim ve Improve Fate'in kendiliğinden kullanılması (F30, F32) | SRD'de "you can": oyuncu ucuz bir saldırıda hakkı harcamak istemeyebilir | Şimdilik kalsın; ileride `askReaction`'a benzer "Sor/Her zaman" ayarı |

### Düzeltme önerileri (F)

1. Savage Attacker'ı yalnız silahta tetikle: `savageReady`'ye `option.weaponId !== 'unarmed-strike'` ekle (doğal silah/biçim saldırıları zaten `beast` ile dışarıda). Öncelik: yüksek. Sürümlü (kural sürümü 98).
2. Blink Steps'i yalnız Attack ya da Magic eyleminden sonra aç. Ekonomiye "bu tur Attack/Magic eylemi" işareti ekle (ör. `economy.attackOrMagic`, `attack`/`cast_spell` eylemle yapıldığında). Öncelik: yüksek. Sürümlü (kural sürümü 98).
3. Overcome Defenses ve Overwhelming Strike'ı büyü saldırısı yoluna (`spells.ts:1006`) da ekle. Overcome Defenses'ı tek hasar ayarı noktasına (ör. `adjustDamage` çağıranlarına sahip bilgisiyle) taşı ki alan/save hasarına da uygulansın. Öncelik: orta. Sürümlü (kural sürümü 98).
4. Free Casting'i tepki büyüsü slot harcamalarına (`reactions.ts:197`) ve diğer `slot_spent` yollarına da bağla. Bunu tek yardımcıyla yap (`freeCastingEvents`'i slot harcayan her komut sonunda). Öncelik: orta. Sürümlü (kural sürümü 98).
5. Feat ön koşulundaki yetenek denetimini yuvanın önceki skorlarıyla yap: `advancementProblems` içinde `scoresBeforeSlot(base, advancements, a.level)`. `Builder.tsx` `featOptions` için de aynısı. Öncelik: orta. Sürümsüz (oluşturucu).
6. Alert Initiative Swap'ta `turn: own` çağrılan dostlara izin ver. Arayüzde 1. turun başında (sıra kimde olursa olsun) Alert sahibine takas düğmesi göster. Öncelik: düşük. Sürümlü (kural sürümü 98) `swapProblem` kuralı için; arayüz kısmı sürümsüz.
7. K-F1 kabul edilirse `featProblem` ASI/Epic yuvasında Fighting Style kategorisine, sınıfın Fighting Style özelliği varsa izin versin. Öncelik: düşük. Sürümsüz (oluşturucu).
8. K-F2 kabul edilirse Human Versatile köken feat'i: karakter kaydına yeni alan + `sheetFeats`. Motor değişmez; feat savaşa karakter girdisiyle (`combatantFromSheet`) girer, eski kayıtta alan boş. Öncelik: orta. Sürümsüz (oluşturucu/veri).
9. Fast Wrestler için test yaz (Medium yakalayan Medium/Large sürükleme maliyeti). Öncelik: düşük. Sürümsüz (test).

### Probe dökümü (F)

- **PF-A** (`src/battle/zzTmpTFE2a.test.ts`, silindi). Kapsam: yuvalar (PF1), Grappler ön koşulu (PF2), kategori/seviye denetimi (PF3), tekrar alınabilirlik ve MI listesi (PF4), artış ve tavanlar (PF5), Alert inisiyatifi ve Spell Recall ön koşulu (PF6), Human Versatile (PF7). 7/7 çalıştı. Bulgular: PF2 red, PF3 Archery ASI/Epic red, PF7 Human feat'i yok.
- **PF-B** (`src/battle/zzTmpTFE2b.test.ts`, silindi). Kapsam: Savage Attacker silah, Unarmed ve Monk (PB1, PB1b), Blink Steps Dash/Dodge sonrası (PB2), Peerless Aim d20 5/1 (PB3), Irresistible Offense silah ve Ice Knife (PB4), Archery/Defense/GWF/TWF (PB5), Grappler Punch and Grab ve avantaj (PB6). 7/7 çalıştı (saldırılar `combat_started` ile aura senkronundan sonra).
- Kod okuması: F17 (Swap'ta çağrılan dost), F25 (Fast Wrestler), F33 (alan hasarı yolu), F35 (tepki büyüsü slotu), F36/F37 (`hasDarkness`).

## 3. Geçmişler (G)

Ölçüt: SRD 5.2.1 s. 19–21 (Choose a Background, Record Your Feat, Note Proficiencies, Choose Starting Equipment, Adjust Ability Scores), s. 83 (Parts of a Background, Background Descriptions), s. 86–87 (köken feat'leri), s. 93–94 (Tool Proficiency, aletler). 8 özgün geçmiş (`ozgun: true`) için ölçüt bizim metnimiz (`data/backgrounds.json` özetleri, DECISIONS.md "12 geçmiş: SRD'nin 4'ü + 8 özgün (Kuyruk 42)"). Kural sürümü 97; denetim salt okunur, probe'lar silindi.

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| G1 | Yetenek artışı yalnız geçmişin üç yeteneğine, +2/+1 ya da +1/+1/+1, hiçbiri 20'yi aşamaz (s. 83, s. 21) | `src/rules/backgrounds.ts:63` `bonusesOf`, `src/rules/stats.ts:153` `checkBackgroundBonuses`, `stats.ts:168` `Math.min(20, …)`, `src/rules/builder.ts:491` (geçersiz kalıp kaydı engeller) | tam | probe PG2a–2g: +2/+1 ve +1×3 geçer; geçmiş dışı WIS yok sayılır; 19+2 → 20; `{str:3}`, `{str:2,dex:2}` kayıt sorunu |
| G2 | Artış zorunlu ("increase one by 2…", s. 21) | `builder.ts:361` `characterIssues` boş bonusu sormaz; `Builder.tsx:866` yalnız soluk "bgHelp" metni | kısmi | probe PG2h/2i: bonussuz Soldier sorunsuz kaydedilir; PG4d: elle dağıtılmış bonus, geçmiş değişince sessizce `{}` olur ve yine kayıt engellenmez |
| G3 | Acolyte: INT/WIS/CHA, Magic Initiate (Cleric), Insight + Religion (s. 83) | `data/backgrounds.json:4–30` | tam | probe PG1 (SRD kaydıyla birebir), PG4c |
| G4 | Criminal: DEX/CON/INT, Alert, Sleight of Hand + Stealth (s. 83) | `data/backgrounds.json:31–56` | tam | probe PG1, PG4b (inisiyatif DEX 2 + PB 2 = 4, savaşçıda `alert` işareti) |
| G5 | Sage: CON/INT/WIS, Magic Initiate (Wizard), Arcana + History (s. 83) | `data/backgrounds.json:57–83` | tam | probe PG1, PG4d |
| G6 | Soldier: STR/DEX/CON, Savage Attacker, Athletics + Intimidation (s. 83) | `data/backgrounds.json:84–109` | tam | probe PG1, PG4a (savaşçıda `savage-attacker`, `backgroundId`) |
| G7 | Köken feat'i geçmişten gelir ("specified Origin feat", s. 20, s. 83) | `backgrounds.ts:76` `originFeatOf`, `src/rules/advancement.ts:106` `sheetFeats` | tam | probe PG4a–4c: feat kilitli, serbest seçim yalnız geçmişsiz kayıtta |
| G8 | Magic Initiate: listeden 2 cantrip + 1. seviye büyü, INT/WIS/CHA seçimi, uzun dinlenmede bir kez slotsuz, slotla da (s. 87) | `backgrounds.ts:85,102,142,147,154`; `src/battle/create.ts:236,246,354,383`; seçici `Builder.tsx:1291–1318` | tam | probe PG4c: Fighter Acolyte'ta Sacred Flame/Guidance/Bless savaşçıda, kaynak `magic-initiate-cleric` 1, `freeSpells`, DC 12 / +4 (WIS 14, PB 2); PG6: liste boyları Cleric 7+15, Druid 11+18, Wizard 15+30 |
| G9 | Alert ve Savage Attacker savaşta (s. 87) | `stats.ts:349` (inisiyatif), `src/battle/alert.ts:21`, `src/battle/features.ts:88` | tam | probe PG4a/4b; savaş davranışı F1 testlerine dayanır (bu bölümde ayrıca oynatılmadı) |
| G10 | Skilled: "üç beceri **ya da alet**" (s. 87) | `data/class-features.json:2508` `extraSkills: 3`; `builder.ts:554` | kısmi | probe PG4f: Tüccar/Soylu'da 3 beceri istenir; alet modeli olmadığı için alet seçeneği yok |
| G11 | İki beceri yeterliliği (s. 20, s. 83); sınıf becerisiyle çakışma | `backgrounds.ts:79`, `builder.ts:397,569` `withSkills` | tam | probe PG3 (çakışma sorunu), PG5b (savaşçıda Athletics +5 = STR 3 + PB 2, Intimidation +2) |
| G12 | Tür becerisi yalnız Human Skillful (her beceri) ve Elf Keen Senses (Insight/Perception/Survival) (s. 85–86) | `backgrounds.ts:82` `otherSkillMax = 3 − 2` her türe 1 serbest beceri; `builder.ts:547` | kısmi | probe PG3: Dwarf/Orc'a da "Ek beceri (tür) 1/1", Dwarf + History sorunsuz; PG5a: Elf + History sorunsuz. `docs/SRD-DENETIM.md:460,481` ikisini "tam" yazıyor |
| G13 | Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj (s. 20, s. 93) | yok; `data/backgrounds.json:22` vb. yalnız metin; gösterim yalnız Dungeondex `src/dungeondex/catalog.ts:329` (oluşturucu kartından SD3'te kalktı) | bilinçli sapma | DECISIONS.md G1 "Alet yetkinliği ve donanım paketi yalnızca metin"; probe PG5c: karakterde/savaşçıda alet alanı yok |
| G14 | Seçmeli alet: Soldier "one kind of Gaming Set" (s. 83); bizim Soylu (Gaming Set), Soytarı (Musical Instrument) | yok (metin "seçilen tür", seçim yeri yok) | yok | `data/backgrounds.json:101–103, 238–240, 320–322`; oluşturucuda alet adımı yok |
| G15 | Thieves' Tools ile kilit açma: DEX, DC 15, aleti gerektirir (s. 94) | `src/battle/objects.ts:216–228`: herkes aletsiz, `skillBonus(sleightOfHand)`; alet PB'si ve avantaj yok | kısmi | kod okuma; Criminal'in aleti hiçbir şeyi değiştirmez (yalnız Sleight of Hand becerisi sayılır) |
| G16 | Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir (s. 20, s. 83) | yok: `data/backgrounds.json`'da donanım alanı yok (yalnız `data/srd/backgrounds.json`, gösterilmiyor); karakterde para alanı yok; Donanım adımı serbest seçim | yok | probe PG4h/5c: `newCharacter` eşyasız, alan listesinde para/alet yok. G1 kararı "yalnızca metin" diyordu, metin de görünmüyor |
| G17 | Geçmiş değişince geçersiz seçimler (bonus, beceri, MI listesi) | `backgrounds.ts:63,102`, `builder.ts:547`; `src/screens/builderDefaults.ts:202` `reSuggestAfterBackground` | tam | probe PG4d/4e: Acolyte → Sage: Cleric seçimleri yok sayılır, Wizard eksikleri sorulur; geri dönünce seçimler ve bonus geri gelir |
| G18 | Geçmişsiz eski kayıt (SRD'de karşılığı yok) | `originFeatOf` serbest feat, `bonusesOf` ham bonus, `otherSkillsOf` 3 serbest beceri | bilinçli sapma | probe PG4g (Alert + `{str:2,wis:1}` sorunsuz), PG3-eski (3 serbest beceri); DECISIONS.md G1 |
| G19 | Yeni karakter: varsayılan geçmiş ve öneri (oluşturucu) | `builder.ts:594` `newCharacter` (Soldier), `builderDefaults.ts:51` `recommendedBonuses` | tam | probe PG4h |
| G20 | Madenci (`buz-madencisi`): STR/CON/WIS, Savage Attacker, Survival + Investigation, Mason's Tools (bizim metin) | `data/backgrounds.json:110–136` | tam | probe PG1-ozgun (feat SRD köken feat'i, 3 ayrı yetenek, 2 ayrı beceri) |
| G21 | Köylü (`ciftci`): STR/CON/WIS, Magic Initiate (Druid), Animal Handling + Nature, Carpenter's Tools (bizim metin) | `data/backgrounds.json:137–164` | tam | probe PG1-ozgun, PG6 (Druid listesi dolu) |
| G22 | Tüccar (`tuccar`): DEX/INT/CHA, Skilled, Persuasion + Insight, Cartographer's Tools (bizim metin) | `data/backgrounds.json:165–191` | tam | probe PG1-ozgun, PG4f (alet sınırı G10) |
| G23 | Mürettebat (`denizci`): STR/DEX/WIS, Savage Attacker, Acrobatics + Perception, Navigator's Tools (bizim metin) | `data/backgrounds.json:192–218` | tam | probe PG1-ozgun |
| G24 | Soytarı (`gezgin-ozan`): DEX/INT/CHA, Magic Initiate (Wizard), Performance + Deception, çalgı (bizim metin) | `data/backgrounds.json:219–246` | tam | probe PG1-ozgun (çalgı seçimi G14) |
| G25 | Şifacı (`sifaci-yardimcisi`): CON/WIS/CHA, Magic Initiate (Cleric), Medicine + Nature, Herbalism Kit (bizim metin) | `data/backgrounds.json:247–274` | tam | probe PG1-ozgun |
| G26 | Ödül Avcısı (`avci-izci`): DEX/CON/WIS, Alert, Survival + Perception, Leatherworker's Tools (bizim metin) | `data/backgrounds.json:275–301` | tam | probe PG1-ozgun |
| G27 | Soylu (`soylu`): STR/INT/CHA, Skilled, Persuasion + History, Gaming Set (bizim metin) | `data/backgrounds.json:302–328` | tam | probe PG1-ozgun (alet seçimi G14) |
| G28 | Özgün geçmiş kuralı: köken feat'i SRD'nin 4 köken feat'inden, aletler SRD aletleri, DECISIONS K42 tablosuyla aynı (bizim kural) | `data/backgrounds.json:2` not; DECISIONS.md "12 geçmiş… (Kuyruk 42)" | tam | probe PG1-originFeats = alert, magic-initiate, savage-attacker, skilled; 8 geçmişin hepsi içinde; yetenek/feat/beceri/alet K42 tablosuyla aynı (adlar B3'te değişti, kimlikler aynı) |

**Bölüm sayıları:** tam 20, kısmi 4, yok 2, bilinçli sapma 2, doğrulanmadı 0 (toplam 28)

### Öne çıkan bulgular (G)

- Geçmişlerin kural çekirdeği sağlam: 4 SRD geçmişi SRD kaydıyla birebir, 8 özgün geçmiş kendi metnimizle ve K42 tablosuyla uyumlu. Köken feat'i (Alert, Magic Initiate, Savage Attacker) savaşçıya geçiyor. Magic Initiate liste, yetenek seçimi, slotsuz kaynak ve DC dahil uçtan uca çalışıyor (PG4c).
- **Tür beceri hakkı her türe veriliyor (G12):** `otherSkillMax = 3 − 2` her türe bir serbest beceri bırakıyor. Dwarf, Orc, Goliath gibi becerisiz türler bedava beceri alıyor. Elf'in Keen Senses'i üç beceriyle sınırlanmıyor. `docs/SRD-DENETIM.md` Skillful ve Keen Senses'i "tam" gösteriyor, bu yanıltıcı.
- **Bonus dağıtmadan kayıt (G2):** boş geçmiş bonusu hiçbir sorun üretmiyor. Elle dağıtılmış bonus, geçmiş değişince sessizce sıfırlanıyor ve oyuncu fark etmeden bonussuz karakter kaydedilebiliyor (yalnız soluk ipucu metni çıkıyor).
- **Başlangıç donanımı ve alet tamamen yok (G13–G16):** A paketi / 50 GP seçimi, para alanı ve alet modeli yok. G1 kararı "yalnızca metin" diyordu, ama SD3'ten beri alet metni oluşturucuda görünmüyor, donanım metni hiç gösterilmiyor. Kilit açma aletsiz yapılabiliyor, alet yetkinliği PB/avantaj vermiyor.
- Skilled'ın "ya da alet" kısmı (G10) ve Gaming Set / çalgı seçimi (G14) alet modeline bağlı açıklar.

### Karar gerekli (G)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-G1 | Tür beceri hakkı (G12) | Düzeltmek, kayıtlı Dwarf/Orc… karakterlerin bir becerisini düşürür (mevcut kayıt değişir); sapma olarak tutmak da mümkün | Hakkı türe bağla (veride `turBeceri`: Human 1 serbest, Elf 1 listeli, diğerleri 0). Fazla beceri eski kayıtta sessizce yok sayılsın (G1 deseni), oluşturucuda bildirilsin |
| K-G2 | Bonus zorunluluğu (G2) | Kaydı engellemek eski bonussuz kayıtları "sorunlu" yapar | Geçmiş seçiliyse ve bonus boşsa `characterIssues` `scores` adımında sorun versin; geçmişsiz eski kayıt muaf kalsın |
| K-G3 | Başlangıç donanımı A/B ve para (G16) | Ekonomi (Serüven dükkânı, altın) ve Donanım adımının serbest seçim modeli değişir | Ya bilinçli sapma olarak DECISIONS'a yaz (serbest donanım), ya da Serüven başlangıcında A paketi / 50 GP seçimi ekle |
| K-G4 | Alet modeli (G13–G15, G10) | Yeni karakter alanı ve kural sürümü gerekir; kullanım yeri az (kilit, Healer's Kit, Navigator) | Asgari: alet metnini oluşturucuya geri koy. Tam: `toolProficiencies` + Thieves' Tools kilit kuralı |

### Düzeltme önerileri (G)

1. Tür beceri hakkını türe bağla (`otherSkillMax` geçmiş + tür verisinden; Elf listesi `data/races.json`'da); `docs/SRD-DENETIM.md` Skillful/Keen Senses satırını düzelt. Öncelik: orta. Sürümsüz (oluşturucu/veri/arayüz).
2. Geçmiş seçili ve bonus boşken (geçmiş değişimi sonrası sıfırlanma dahil) `characterIssues` sorunu ya da en azından belirgin uyarı ekle. Öncelik: orta. Sürümsüz (oluşturucu/veri/arayüz).
3. Alet yetkinliğini oluşturucuda en azından metin olarak yeniden göster (geçmiş kartı ya da özet adımı); Gaming Set / çalgı türü seçimini metne bağla. Öncelik: düşük. Sürümsüz (oluşturucu/veri/arayüz).
4. Başlangıç donanımı: K-G3 kararına göre ya DECISIONS'a bilinçli sapma notu, ya da A paketi / 50 GP seçimi (`data/backgrounds.json`'a donanım alanı). Öncelik: düşük. Sürümsüz (oluşturucu/veri/arayüz).
5. Thieves' Tools kilit kuralı: kilit açma alet ister; alet yetkinliği PB, Sleight of Hand yetkinliği de varsa avantaj (`objects.ts` `unlock`). Öncelik: düşük. Sürümlü (kural sürümü 98).
6. Skilled'a alet seçeneği (alet modeli gelirse). Öncelik: düşük. Sürümsüz (oluşturucu/veri/arayüz).

### Probe dökümü (G)

- `src/rules/zzTmpTFE3a.test.ts` (4 test, geçti): PG1 veri ↔ `data/srd/backgrounds.json` ve özgün kural; PG2 bonus kalıbı, 20 tavanı, geçersiz kalıp, boş bonus; PG3 beceri hakları (human/dwarf/elf/orc 1), çakışma, eski kayıt; PG4 Soldier/Criminal/Acolyte savaşçısı, Acolyte → Sage → Acolyte, Tüccar Skilled, geçmişsiz kayıt, `newCharacter`.
- `src/rules/zzTmpTFE3b.test.ts` (2 test, geçti): PG5 Elf + History sorunsuz, savaşçı beceri bonusları, alet/para alanı yok; PG6 Magic Initiate liste boyları.
- İki dosya da silindi (`ls src/rules/zzTmpTFE3*` → yok). Kod, veri, test, belge değişmedi; git çalıştırılmadı.

## 4. Silahlar (S)

Ölçüt SRD 5.2.1 s. 89–91 (Weapons, Properties, Mastery Properties, Weapons tablosu), s. 15 (Ranged Attacks, Range, Ranged Attacks in Close Combat), s. 49 (Martial Arts), s. 98 (Net), s. 183 (Improvised Weapons). Kural sürümü 97. Tablo karşılaştırması `data/weapons.json` ↔ `data/srd/weapons.json` ↔ PDF tablosu betikle yapıldı (hasar zarı, tür, kategori, Melee/Ranged, Finesse, Light, Thrown, Heavy, Reach, Loading, Two-Handed, Ammunition, Versatile zarı, menzil, ustalık). Probe'lar `src/battle/zzTmpTFE4a/b.test.ts` (silindi). "Kod okuma" yazan satırlar çalıştırılmadı.

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| S1 | Simple Melee 10 silah: zar, tür, özellikler (s. 91) | `data/weapons.json` (Club … Spear) | tam | betik: 0 uyuşmazlık |
| S2 | Simple Ranged 4 silah (Dart, Light Crossbow, Shortbow, Sling) (s. 91) | `data/weapons.json` | tam | betik: 0 uyuşmazlık; Dart `ranged: true` + Thrown + Finesse |
| S3 | Martial Melee 18 silah (s. 91) | `data/weapons.json` (Lance `twoHandedUnlessMounted`) | tam | betik: 0 uyuşmazlık |
| S4 | Martial Ranged 6 silah; Blowgun sabit 1 hasar, yetenek eklenmez (s. 91; Damage Rolls) | `data/weapons.json`; `src/battle/weapons.ts:47-49` `fixedDamage` | tam | betik 0 uyuşmazlık; probe: Blowgun isabeti rawDamage 1 |
| S5 | Her silahın ustalığı (Mastery sütunu) (s. 91) | `src/rules/mastery.ts:21-24` `weaponMasteryId` → `data/srd/weapons.json` | tam | 38/38 PDF tablosuyla aynı (betik + göz) |
| S6 | Weapon Proficiency: yetkin değilse PB eklenmez; Melee STR, Ranged DEX (s. 89) | `src/battle/weapons.ts:25-30,53`; `src/rules/mastery.ts:13-18` | tam | probe: L5 Wizard Longsword saldırı +2 (= STR, PB 3 yok) |
| S7 | Ammunition: her saldırı bir cephane harcar; cephane yoksa atış yok (s. 89) | `weapons.ts:84`; `economy.ts:219`; `features.ts:384`; `reduce.ts:599-602` | tam | probe: bolt 20 → 19; `ammo: {bolt: 0}` → "Cephane bitti (bolt)" (`srdK19` anahtarı) |
| S8 | Ammunition: savaştan sonra harcananın yarısı geri kazanılır (s. 89) | `create.ts:407-411` her savaşta tür başına 20, karaktere yazılmaz | bilinçli sapma | `data/items-srd.json` ammunition `offCombat` notu ("savaşta sayılır, 20 adet"); geri kazanma gereksiz |
| S9 | Ammunition: tek elli silahı doldurmak için boş el gerekir (s. 89) | denetim yok | yok | kod okuma: Hand Crossbow/Pistol + kalkan kısıtsız |
| S10 | Finesse: STR/DEX'ten biri, saldırı ve hasarda aynı (s. 89) | `weapons.ts:25-29,66` | tam | probe: Rogue (DEX 16) Rapier +6, 1d8+3, `ability: dex` |
| S11 | Heavy: Melee'de STR < 13, Ranged'de DEX < 13 dezavantaj (s. 89) | `weapons.ts:80`; `features.ts:257` (`srdK19`) | tam | probe: STR 12 Greatsword ve DEX 12 Heavy crossbow → `reasons: ['Heavy']` |
| S12 | Light: Attack eyleminde Light silahla saldırınca bonus eylemle farklı Light silahla ek saldırı, yetenek eklenmez (negatif hariç) (s. 89) | `economy.ts:50-55,211-212`; `weapons.ts:46`; `hands.ts:20-29`; `offhand.ts:17-29` | tam | probe: önce saldırmadan red; Longsword + Dagger red; Scimitar + Shortsword ek saldırı 1d6 (mod yok), bonus eylem harcandı |
| S13 | Light: "different Light weapon" (aynı türden iki silah, ör. iki Dagger) (s. 89) | `hands.ts:27` farklı ad şartı | bilinçli sapma | CLAUDE.md "aynı silahtan iki tane taşınamaz"; probe: iki Dagger → `offHandOption` yok |
| S14 | Loading: bir eylem/bonus eylem/tepkide o silahtan tek atış (s. 90) | `economy.ts:217-221`; `reduce.ts:762-764` (`economy.loadingFired` savaşçı başına) | kısmi | probe: Extra Attack'te ikinci Light crossbow atışı red (doğru); **farklı** Loading silahı (Heavy crossbow) da aynı eylemde red (kural silah başına) |
| S15 | Range: normal menzil ötesi dezavantaj, uzun menzil ötesi saldırı yok (s. 90, s. 15) | `range.ts:121-123`; `features.ts:235` | tam | probe: Sling 45 ft (30/120) "Uzun menzil"; Dagger fırlatma 65 ft (20/60) red |
| S16 | Yakın düşman: 5 ft içinde seni gören, Incapacitated olmayan düşman varken menzilli saldırı dezavantajlı (s. 15) | `range.ts:40-53,124` (görme şartı GENEL96, 96+) | tam | probe: bitişik düşman → dezavantaj; bitişik Incapacitated düşman → normal |
| S17 | Reach: +5 ft erişim; fırsat saldırısında da o silahla (s. 90) | `weapons.ts:60`; fırsat saldırısı `features.ts:100-104` `meleeOf` | kısmi | kod okuma: saldırı erişimi tam; fırsat saldırısı erişimi en yüksek ortalama hasarlı yakın silahınki (Rapier + Whip taşıyanın erişimi 5 ft, Whip'in 10 ft'i kullanılmaz) |
| S18 | Thrown: fırlatınca menzilli saldırı, yakın dövüş silahında aynı yetenek (s. 90) | `weapons.ts:32,158-163` | tam | probe: Handaxe fırlatma STR +5, 1d6+2, 20/60; Dart DEX; Spear fırlatma 1d6 (Versatile zarı yok) |
| S19 | Thrown: fırlatılan silah elden çıkar (yerde kalır) (s. 90) | elde kalır | bilinçli sapma | DECISIONS S2 §5 "Fırlatılan silah elden çıkmaz"; probe: tek Handaxe art arda iki kez fırlatıldı, `dropped` boş |
| S20 | Two-Handed: saldırıda iki el gerekir (s. 90) | yalnız Lance (`commands.ts:592`) ve yan el (`hands.ts:25`) denetlenir | yok | probe: kalkanlı Fighter Greatsword, Longbow ve Light crossbow ile saldırabiliyor; AC 13 (kalkansız 11), GWF de işliyor (`twoHands`) |
| S21 | Lance: Two-Handed (binekte değilse) (s. 91) | `weapons.ts:82`; `commands.ts:592`; `features.ts:284` (68+) | tam | kod okuma + Kuyruk MB1 testleri; binekte tek elle, GWF yok |
| S22 | Versatile: iki elle parantezdeki zar, yalnız yakın dövüşte (s. 90) | `weapons.ts:39-40`; `hands.ts:35` | tam | probe: Longsword 1d10+2, kalkanla 1d8+2; fırlatmada temel zar |
| S23 | Cleave: yakın dövüş isabetinde ilkine 5 ft, erişimdeki ikinci yaratığa saldırı, hasara mod eklenmez (negatif hariç), turda bir (s. 90) | `mastery.ts:73-90,125-134` | tam | probe: Greataxe B'ye isabet → C'ye "(Cleave)" 6 hasar (1d12 = 6, STR +2 eklenmedi). Hedef otomatik (en az HP) |
| S24 | Graze: ıskada saldırı yeteneği değiştiricisi kadar aynı türde hasar (s. 90) | `mastery.ts:116-124` | tam | probe: AC 30'a ıska → `mastery_applied` graze 2 slashing |
| S25 | Nick: Light ek saldırısı Attack eyleminin içinde, turda bir (s. 90) | `create.ts:402` `nickOffhand` (yalnız yan el silahının ustalığı); `economy.ts:236-238` | kısmi | probe: Shortsword ana + Scimitar (Nick) yan → bonus eylem boş; Scimitar (Nick) ana + Shortsword yan → bonus eylem harcanıyor |
| S26 | Push: isabette Large ya da küçüğü "10 ft'e kadar" düz uzağa itebilirsin (s. 90) | `mastery.ts:135-144`; `data/class-features.json` `masteries.push` | kısmi | probe: Huge hedef itilmez (doğru); mesafe hep 10 ft (seçilemez); `pushChoice` yokken yakın dövüşte yalnız eylemin son saldırısında (probe: 2 saldırının ilkinde itme yok) |
| S27 | Sap: isabet alan yaratığın senin sonraki turunun başına dek sonraki saldırı zarı dezavantajlı (s. 90) | `mastery.ts:52-56,145-146`; `marks.ts:10-15`; silah `features.ts:252`, canavar `monsters.ts:152` | kısmi | probe: işaret `turnStart`, count 1; büyü saldırısı işareti tüketmez/dezavantaj almaz (CLAUDE.md bilinen) |
| S28 | Slow: hasarlı isabette hız −10 ft, sonraki turunun başına dek, birikmez (s. 90) | `mastery.ts:147-150`; `marks.ts:5-7` | tam | kod okuma: `damaged` şartı, en büyük 10 ft |
| S29 | Topple: CON save DC 8 + yetenek + PB, başarısızsa Prone (s. 90) | `weapons.ts:70`; `mastery.ts:155-168` | tam | probe: Maul DC 13 (8+2+3), CON 5 → Prone |
| S30 | Vex: hasarlı isabette o yaratığa sonraki saldırı zarı avantajlı, sonraki turunun sonuna dek (s. 90) | `mastery.ts:62-65,151-154` | kısmi | probe: kendi turunda count 2 `turnEnd` (doğru); büyü saldırısı avantajı kullanmaz (S27 ile aynı yol) |
| S31 | Ustalık yalnız özelliği açan karaktere; seçilen silahlar, hak sayısı (s. 89–90) | `rules/mastery.ts:36-65`; `weapons.ts:36-37` | tam | kod okuma + `mastery.test.ts`; fazla seçim savaşta sayılmaz |
| S32 | Improvised Weapons: PB yok, 1d4, GM benzer silahı o silah sayabilir (s. 183) | `objects.ts:181-184`; `data/nesneler.json` `weapon` | kısmi | kod okuma: PB yok (doğru), Bank bacağı/Kova 1d4; Zincir/Nöbetçi sopası 1d6; "Kılıç" nesnesi Longsword (1d8) olduğu hâlde doğaçlama sayılıp PB'siz; fırlatma 20/60 seçeneği yok |
| S33 | Improvised: menzilli silahla yakın dövüş, Thrown'suz yakın silahı fırlatma (1d4, 20/60, PB yok) (s. 183) | seçenek üretilmez (paket `silahFirlat` hariç, `paket/core.ts:292`) | yok | kod okuma: `weaponAttackOptions` yalnız Thrown silaha fırlatma ekler |
| S34 | Nesne fırlatma ≈ doğaçlama fırlatma (s. 183) | `objectMotion.ts:151-160`; `data/nesne-hareket.json` `oyuncuFirlatma` | bilinçli sapma | veri notu: saldırı zarı yok, hafif 1d4 / orta 1d8 + STR, menzil ağırlıktan |
| S35 | Net: Attack'in bir saldırısı yerine, 15 ft, görülen yaratık, DEX save DC 8+DEX+PB, Restrained, Huge+ otomatik başarı; kaçış DC 10 STR (Athletics) kendisi ya da 5 ft içindeki; ağ AC 10, 5 HP (s. 98) | `data/items-srd.json` net `use`; `items.ts:31-44,89-104`; `economy.ts:244-247` | kısmi | kod okuma: 15 ft, DC, Restrained, kaçış DC 10 var; Huge+ otomatik başarı, görme şartı, başkasının kurtarması (`allyHelp` yok), ağı yok etme yok |
| S36 | Martial Arts: Monk silahlarında DEX ve Martial Arts zarı (yakın dövüşle sınırlı değil) (s. 49) | `weapons.ts:21` (`use !== 'thrown'`) | kısmi | kod okuma: fırlatılan Monk silahında (Handaxe, Javelin, Spear) MA yok → STR ve silah zarı |

**Bölüm sayıları:** tam 20, kısmi 9, yok 3, bilinçli sapma 4, doğrulanmadı 0 (toplam 36)

### Öne çıkan bulgular (S)

- **Silah tablosu birebir:** 38 SRD silahının hasar zarı, türü, kategorisi, Melee/Ranged sınıfı, bütün özellikleri, Versatile zarı, menzili ve ustalığı `data/weapons.json` + `data/srd/weapons.json` ile PDF s. 91 arasında tek uyuşmazlık yok.
- **Two-Handed kalkana karşı denetlenmiyor (S20):** kalkanlı karakter Greatsword/Longbow/Light crossbow ile saldırıp kalkanın +2 AC'sini koruyor; Great Weapon Fighting de işliyor. Lance dışında hiçbir yerde denetim yok, DECISIONS'ta gerekçe yok. Yapay zekâ partileri ve oyuncu kurulumları için gerçek bir avantaj.
- **Loading savaşçı başına (S14):** `economy.loadingFired` silah ayırmıyor; aynı eylemde ikinci, farklı bir Loading silahı da reddediliyor. Etkisi dar (çoğu zaman tek Loading silah taşınır).
- **Ustalıkların özü doğru, seçim noktaları otomatik:** Cleave, Graze, Slow, Topple, Vex probe'la SRD değerlerini veriyor. Push hep tam 10 ft ve `pushChoice` yokken yalnız son saldırıda; Nick yalnız yan el silahının ustalığına bakıyor (S25); Sap/Vex büyü saldırısıyla etkileşmiyor (bilinen).
- **Doğaçlama silah dağınık (S32–S34):** nesne silahları 1d4/1d6 karışık, gerçek kılıç nesnesi PB'siz doğaçlama sayılıyor; menzilli silahla yakın dövüş ve Thrown'suz fırlatma seçeneği yok; oyuncunun nesne fırlatması zarsız isabet (belgeli sapma).
- **Net** önemli koşullarını taşımıyor: Huge+ otomatik başarı, başkasının ağı kesmesi, ağı yok etme.

### Karar gerekli (S)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-S1 | Two-Handed + kalkan (S20) | Düzeltme kalkanlı iki elli kurulumları kırar (kayıtlı karakterler, sim partileri); SRD'de kalkan çıkarmak eylem ister, "çekip bırakma" kalkana uygulanmaz | 98'de kalkan varken Two-Handed (Lance binekte hariç) saldırısını reddet; oluşturucuda uyarı; eski kayıt ≤ 97 aynen |
| K-S2 | Nick hangi silahta (S25) | SRD metni "Light ek saldırısını yaparken" diyor; Nick'in ana el silahında da sayılıp sayılmayacağı yoruma açık | Ustalığı açık Nick silahı iki elden birindeyse Nick (yaygın yorum); sürümlü |
| K-S3 | Loading silah başına mı (S14) | SRD "a Loading weapon" tek silahtan söz ediyor; iki ayrı Loading silahı (ör. iki tabanca) aynı eylemde ateşlenebilir mi | Silah kimliği başına kayıt (`loadingFired: string[]`); sürümlü |
| K-S4 | Push mesafesi ve otomatik seçimler (S26, S23) | SRD "up to 10 feet" ve "you can"; mesafe seçimi arayüz ister | 5/10 ft seçimini `pushChoice` ile birleştir ya da bilinçli sapma diye DECISIONS'a yaz |
| K-S5 | Doğaçlama silah değerleri (S32) | Zincir/sopa 1d6 SRD'nin 1d4'ünden sapıyor; "Weapon Equivalents" GM yetkisi | Zincir → Flail (1d8, yetkinlikli), sopa → Club (1d4) eşdeğeri ya da 1d4; kılıç nesnesi gerçek Longsword seçeneği |

### Düzeltme önerileri (S)

1. **Two-Handed kalkanla saldırı reddi (S20)** — kalkan varken `twoHanded` silah seçeneğine saldırı/fırsat saldırısı yok (Lance binekte serbest); oluşturucuda sorun metni. Öncelik: yüksek. Sürümlü (kural sürümü 98).
2. **Loading silah başına (S14)** — `economy.loadingFired` yerine ateşlenen silah kimlikleri. Öncelik: düşük. Sürümlü (kural sürümü 98).
3. **Nick ana el silahında (S25)** — `nickOffhand` hesabı iki eldeki silahlardan herhangi birinin açık Nick ustalığına bakar. Öncelik: orta. Sürümlü (kural sürümü 98).
4. **Fırsat saldırısında en uzun erişim (S17)** — `meleeOf` fırsat saldırısı için erişimi olan en iyi silahı seçsin (Whip + Rapier → 10 ft'te Whip). Öncelik: düşük. Sürümlü (kural sürümü 98).
5. **Net kalanları (S35)** — Huge+ otomatik başarı, hedefi görme şartı, `escapeCheck.allyHelp`, ağı nesne olarak kesme (AC 10, 5 HP, B/Poison/Psychic bağışıklık). Öncelik: orta. Sürümlü (kural sürümü 98).
6. **Fırlatılan Monk silahında Martial Arts (S36)** — `use === 'thrown'` için de DEX ve MA zarı. Öncelik: düşük. Sürümlü (kural sürümü 98).
7. **Doğaçlama silah (S32–S33)** — nesne silah zarlarını 1d4'e ya da eşdeğer silaha bağla; gerçek silah nesnesi (Kılıç) silah seçeneği gibi yetkinlikle; doğaçlama fırlatma 20/60 ve menzilli silahla 1d4 yakın vuruş seçeneği. Öncelik: düşük. Sürümlü (kural sürümü 98).
8. **Tek elli cephaneli silahı doldurmak için boş el (S9)** — kalkan + yan el doluyken Hand crossbow/Pistol atışı yok. Öncelik: düşük. Sürümlü (kural sürümü 98).
9. **Belgeleme** — S8 (cephane savaş başına 20) ve S34 (zarsız nesne fırlatma) DECISIONS.md'de tek satırla "bilinçli sapma" olarak toplansın; Push'un 10 ft sabitliği K-S4 kararına göre yazılsın. Öncelik: düşük. Sürümsüz (veri/arayüz).

### Probe dökümü (S)

- `zzTmpTFE4a` (Fighter 5, `col` haritası, kural 97): kalkan + Greatsword/Longbow/Light crossbow saldırısı kabul (AC 13 / kalkansız 11); Handaxe fırlatma +5, 1d6+2, 20/60, iki kez fırlatıldı (`dropped` yok); Dart +6 1d4+3; Spear fırlatma 1d6+2; Longbow bitişikte "Yanında düşman", 25 ft'te normal; bitişik Incapacitated düşmanda normal; Sling 45 ft "Uzun menzil"; Dagger 65 ft red; Blowgun 1 hasar; Heavy (STR/DEX 12) dezavantaj; Light crossbow cephane 20→19, aynı eylemde ikinci atış ve Heavy crossbow red, cephane 0 red; Longsword 1d10/kalkanla 1d8; Rapier +6 DEX; Wizard Longsword +2; Graze 2 hasar; Cleave ikinci hedefe 6 (mod yok); Push iki saldırının ilkinde yok, Huge'a yok; Sap/Vex işaretleri; Topple DC 13 Prone.
- `zzTmpTFE4b`: yan el ek saldırısı Attack'ten önce red; Scimitar+Shortsword bonus eylem harcar; Shortsword+Scimitar(Nick) eylem içinde; Longsword+Dagger yan el geçersiz.
- Her iki dosya silindi (`ls src/battle/zzTmpTFE4*` → yok).

## 5. Zırh ve kalkan (Z)

> Kural sürümü 97. Ölçüt `docs/SRD_CC_v5.2.1.pdf` (`pdftotext -layout`): zırh tablosu ve Armor Training s. 92, Armor Class / Armor Training sözlüğü s. 177,
> Initiative s. 13, Barbarian s. 28–29, Monk s. 50, Defense feat'i s. 88, Two-Handed s. 90, Barkskin s. 112, Mage Armor s. 145, Elven Chain s. 220,
> Mithral Armor s. 231. Şüpheli satırlar geçici vitest probe'larıyla çalıştırıldı (`src/battle/zzTmpTFE5a/b.test.ts`, silindi). Probe kurgusu:
> Fighter 5, DEX 16 (+3), STR 10, Human, `blankCharacter` + `deriveStats` / `combatantFromSheet` + `startBattle` (sürüm 97, `col`).

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| Z1 | Light zırh: Padded 11, Leather 11, Studded 12 + DEX, sınırsız (s. 92) | `data/armor.json` `baseAc`/`type`; `src/rules/stats.ts:289-292` (`light` → tam DEX) | tam | probe: 14 / 14 / 15 (DEX +3); veri `data/srd/armor.json` ile birebir |
| Z2 | Medium zırh: Hide 12, Chain Shirt 13, Scale 14, Breastplate 14, Half Plate 15 + DEX (en çok 2) (s. 92) | `stats.ts:291` `Math.min(dex, 2)` | tam | probe: 14 / 15 / 16 / 16 / 17 (DEX +3 → +2) |
| Z3 | Heavy zırh: Ring 14, Chain 16, Splint 17, Plate 18, DEX eklenmez (s. 92) | `stats.ts:292` (`heavy` → DEX parçası yok) | tam | probe: 14 / 16 / 17 / 18 |
| Z4 | Strength sütunu: Chain Mail Str 13, Splint/Plate Str 15; karşılanmazsa hız −10 ft (s. 92) | `data/armor.json` `strength`; `stats.ts:321-323` `armorStrengthShort`; savaşçı `speed` türetmeden | tam | probe: Plate + STR 13 → 20 ft (savaşçı da 20); Chain Mail + STR 13 → 30 ft (eşit şart yeterli); Ring Mail şartsız |
| Z5 | Strength cezası her giyene (s. 92) | `stats.ts:323` `lineageEtki(...).agirZirhHizCezasiYok` (Dağ cücesi alt soyu) | bilinçli sapma | ev kuralı alt soy (Kuyruk AS1b, `docs/ALT-SOY-41.md`, DECISIONS.md AS1b); yalnız Heavy |
| Z6 | Stealth sütunu: Padded, Scale, Half Plate, Ring, Chain, Splint, Plate "Disadvantage" (s. 92) | `data/armor.json` `stealthDisadvantage`; `src/battle/create.ts:160-161,303` | tam | probe: 7 zırhın bayrağı SRD ile aynı, diğer 5'te yok |
| Z7 | Stealth dezavantajı Dexterity (Stealth) kontrollerinde (s. 92) | `src/battle/stealth.ts:161` (Gizlen), `src/battle/checks.ts:16` (Game Master beceri kontrolü), `src/battle/maprules.ts:167` | tam | probe: Chain Mail'li Fighter `hide` → `mode: disadvantage`, d20 iki zar, neden "Zırh" |
| Z8 | Giyme/çıkarma: Light 1 dk, Medium 5/1 dk, Heavy 10/5 dk (s. 92) | savaşta zırh komutu yok; zırh kurulumdan sabit (`combatantFromSheet`) | tam | en kısa süre 10 tur: savaşta giyilip çıkarılamaması SRD'yle aynı sonuç; savaş dışı (oluşturucu) zaman modeli yok, süre işlenmez |
| Z9 | Shield "Utilize Action to Don or Doff" (s. 92) | yok: `shieldHeld` kurulumdan sabit (`create.ts:311`); `drop_item` yalnız silah (`src/battle/heldItems.ts`) | yok | grep: kalkan tak/çıkar komutu yok; boş el isteyen büyü (`spells.ts:1408`, `s2spells.ts:44`) ve Monk UD için kalkan bırakılamaz |
| Z10 | Shield +2 AC (s. 92) | `stats.ts:295` (sabit `2`; `data/armor.json`'da kalkan kaydı yok) | tam | probe: Chain Mail + kalkan 18 (16 + 2) |
| Z11 | Kalkan AC'si yalnız eğitimle (s. 92 Shield) | `stats.ts:295` `armorProficient(..., 'shield')` | tam | probe: Wizard + kalkan 13 (10 + 3, kalkan parçası yok); dezavantaj/büyü yasağı yok (DECISIONS K9d-kalkan, SRD'ye uygun) |
| Z12 | Eğitimsiz kalkanda hiçbir AC faydası yok (s. 92) | `stats.ts:303` `shieldAcBonus` eğitime bakmıyor | kısmi | probe: Wizard + kalkan + "Shield, +1" → AC 14 (+1 sayılıyor; beklenen 13) |
| Z13 | Tek zırh, tek kalkan (s. 92 One at a Time) | `CharacterSheet.armorName` tek değer, `shield` boolean | tam | yapısal: ikinci zırh/kalkan tutulamaz |
| Z14 | Eğitimsiz zırh: büyü yapılamaz (s. 92, s. 177) | `create.ts:222-226` `armor:untrained` `noCast`; `src/battle/castBarrier.ts:10`; `spells.ts:743`, `summons.ts:468`; YZ `ai.ts:322` | tam | probe: Leather'lı Wizard `cast_spell` Fire Bolt → "Eğitimsiz zırh: büyü yapılamaz." |
| Z15 | Eğitimsiz zırh: STR/DEX save'leri dezavantajlı (s. 92 "any D20 Test") | `create.ts:226` `saveDis: ['str','dex']`; `src/battle/durations.ts:184` | tam | probe: `saveMode` dex/str `disadvantage`, con `normal` |
| Z16 | Eğitimsiz zırh: STR ya da DEX içeren saldırı zarı dezavantajlı (s. 92) | `create.ts:226` `attackDis: {}` → `src/battle/divine.ts:333` her saldırı | kısmi | probe: Dagger saldırısı `mode: disadvantage`, neden "Eğitimsiz zırh" ✓; ama `{}` yetenekten bağımsız: CHA/WIS ile yapılan silah saldırısı (Pact of the Blade, paket) da dezavantajlı (SRD yalnız STR/DEX) |
| Z17 | Eğitimsiz zırh: DEX (Stealth) kontrolü dezavantajlı (s. 92) | `checks.ts:17` `checkMode` `checkDis` ✓; `stealth.ts:159-170` Gizlen kipinde `checkDis` yok | kısmi | probe: Leather'lı (stealth bayraksız) Wizard `hide` → `mode: normal`, tek d20 (beklenen dezavantaj); Game Master beceri kontrolünde doğru |
| Z18 | Eğitimsiz zırh: Initiative (DEX kontrolü, s. 13) dezavantajlı (s. 92) | `create.ts:846-861` inisiyatif yalnız Incapacitated/avantaj kaynaklarına bakar, `checkDis` yok | yok | probe: eğitimsiz Wizard + 1 düşman `startBattle` → toplam 2 zar (dezavantajda 3 olmalı). Aynı açık ağır yük (`load:heavy`) için de geçerli |
| Z19 | Eğitim kaynağı: sınıf "Armor Training" (s. 28–63), Divine Order Protector, paket `yetkinlik` | `stats.ts:123-128` `armorProficient` | tam | probe: Wizard light → false, Cleric heavy → true (varsayılan Protector, DECISIONS), Druid kalkan → true, Monk kalkan → false |
| Z20 | Elven Chain: "considered trained" (s. 220) | `itemEffects`/`armorProficient` eşyaya bakmıyor | yok | probe: Wizard + Chain Shirt + Elven Chain → yine `armor:untrained` (büyü yasak). Ayrıntı sihirli eşya bölümünde |
| Z21 | Oluşturucu: eğitimsiz zırh/kalkan uyarısı (s. 92) | `src/screens/builder/Equipment.tsx:131-152` (uyarı, "Yine de kuşan"), özet `Builder.tsx:1242` (Stealth, Str şartı) | tam | `characterIssues` engellemez (DECISIONS K9d "kaydı engellemez"); metin TR/EN `armorUntrained`, savaş kartı rozeti `MapBattle.tsx:294` |
| Z22 | Barbarian Unarmored Defense: zırhsız 10 + DEX + CON, kalkanla geçerli (s. 29) | `data/class-features.json:875-883` (`shield: true`); `stats.ts:279-285` | tam | probe: zırhsız + kalkan 17 (10+3+2+2); Hide giyince 14 (CON yok) |
| Z23 | Monk Unarmored Defense: zırh ve kalkan yokken 10 + DEX + WIS (s. 50); Unarmored Movement, Martial Arts aynı şart | `class-features.json:1104-1118` (`shield: false`, `noArmorNoShield`); `classFeatures.ts:319`; `weapons.ts:110` | tam | probe: Monk zırhsız 15, kalkanla 13 (WIS düşer, eğitimsiz kalkan +0) |
| Z24 | Birden fazla taban AC hesabı: biri seçilir, birleşmez (s. 177) | `divine.ts:313` `max(ac, acMin)`; UD tek `unarmoredDefense` (`classFeatures.ts:268`) | tam | taban seçimi en yüksek (Monk UD 15 > Mage Armor 16 gibi karşılaştırmada doğru); Draconic Resilience fikstürde aynı şemada (`shield: true`) |
| Z25 | Mage Armor: taban AC 13 + DEX; kalkan ve diğer bonuslar tabana eklenir (s. 145, s. 177) | `spells.ts:2031` `acMin: 13 + dex`; `divine.ts:313` `max(target.ac, acMin)` | kısmi | probe: zırhsız Fighter + kalkan (AC 15) + Mage Armor → 16 (beklenen 18); Wizard + Ring of Protection (14) + Mage Armor → 16 (beklenen 17). Kalkan/eşya/Bracers bonusu tabanla birlikte kaybolur. Armor of Shadows (`create.ts:283-288`) aynı yoldan |
| Z26 | Mage Armor yalnız zırhsız hedefe (s. 145) | `spells.ts:1862` `noArmor` (a6) + `armored` | tam | "zırh giyince biter": savaşta zırh giyilemediği için gerekmez (Z8) |
| Z27 | Barkskin: AC 17'den düşükse 17 (s. 112) | `data/spells.json` `acMin: 17`; `divine.ts:313` | tam | probe: Wizard AC 14 → 17 |
| Z28 | Defense (Fighting Style): Light/Medium/Heavy zırh giyerken +1 (s. 88) | `stats.ts:298` `armoredAcBonus && ar.type !== 'none'` | tam | kod okuması; kalkan tek başına saymaz (SRD'ye uygun) |
| Z29 | Sihirli zırh +N: yalnız o zırh türüne (Armor, +N "any"; Dwarven Plate = Plate; Elven Chain = Chain) (s. 210, 220) | `stats.ts:303` `armorAcBonus` giyilen zırhın türüne bakmaz | kısmi | probe: Leather + "Armor, +1" 15 ✓; Leather + "Dwarven Plate" 16 (Plate'in +2'si Leather'a). Ayrıntı sihirli eşya bölümünde |
| Z30 | Mithral Armor: Stealth dezavantajı ve Strength şartı kalkar (s. 231) | `create.ts:185` `noStealthDis` ✓; `stats.ts:321` Str şartı eşyaya bakmaz | kısmi | probe: Half Plate + Mithral `stealthDisadvantage: false` ✓; Plate + Mithral, STR 10 → hız 20 ft (beklenen 30) |
| Z31 | Two-Handed silah iki el ister: kalkanla saldırılamaz (s. 90) | `hands.ts:35` yalnız Versatile/yan el; `weapons.ts:82` yalnız Lance | yok | probe: kalkan + Greatsword `attack` → `ok: true`; `characterIssues` kalkan + Greatsword + Longbow için sorun üretmez |
| Z32 | Rage: Heavy zırhla başlatılamaz, Heavy giyilince biter (s. 28) | `src/battle/rage.ts:20,83` (`heavyArmor`) | tam | kod okuması; savaşçıda `heavyArmor` veriden (`create.ts:304`) |
| Z33 | Canavar: stat bloğundaki zırhta eğitimli, AC bloktan (s. 92 Armor Training) | `create.ts:534` `ac: monster.ac`; canavarda `stealthDisadvantage: false` (`create.ts:548`) | tam | Stealth bonusu blokta hazır; ek ceza yok |

**Bölüm sayıları:** tam 22, kısmi 6, yok 4, bilinçli sapma 1, doğrulanmadı 0 (toplam 33)

### Öne çıkan bulgular (Z)

- **Tablo birebir:** 12 zırhın AC'si, DEX sınırı, Strength şartı (eşik dahil) ve Stealth bayrağı SRD s. 92 ile aynı; hız −10 ft savaşçıya geçiyor, Stealth dezavantajı Gizlen ve beceri kontrolünde çalışıyor.
- **Mage Armor (ve Armor of Shadows) kalkanı ve eşya bonusunu yutuyor (Z25):** `effectiveAc` `max(ac, acMin)` alıyor; `ac` zaten kalkan/eşya içerdiği için Mage Armor tabanı seçilince bunlar düşüyor. Zırhsız kalkanlı savaşçıda −2, Ring of Protection'lı büyücüde −1. Savaş sonucunu doğrudan etkiliyor.
- **Eğitimsiz zırh cezası iki yerde eksik (Z17, Z18):** Gizlen eylemi `checkDis`'i okumuyor (yalnız zırhın kendi Stealth bayrağı); inisiyatif (DEX kontrolü) hiç dezavantaj almıyor. Inisiyatif açığı ağır yük etkisini (`load:heavy`) de kapsıyor.
- **Kalkan + iki elli silah serbest (Z31):** kalkanla Greatsword/Longbow saldırısı motor ve oluşturucuda reddedilmiyor; kalkan tak/çıkar (Utilize) komutu da yok (Z9), bu yüzden doğru oyun yolu da yok.
- **Eğitimsiz kalkanın sihirli bonusu sayılıyor (Z12):** SRD eğitimsiz kalkanda AC faydasını tamamen kaldırıyor; `shieldAcBonus` eğitime bakmıyor.
- **Sihirli zırh eşleşmesi gevşek (Z20, Z29, Z30):** eşya etkisi giyilen zırhın türüne bağlı değil; Elven Chain eğitimi ve Mithral'in Str şartı kaldırması yok. Ayrıntı sihirli eşya bölümüne bırakıldı.

### Karar gerekli (Z)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-Z1 | Kalkan + Two-Handed silah (Z31) | Kalkan tak/çıkar komutu olmadan katı ret, kalkanlı ve yaylı karakterleri (sim partileri dahil) savaşta silahsız bırakabilir; denge ve kayıtlı karakterleri etkiler | Oluşturucuda sorun (sürümsüz) + savaşta 98+ ret; Utilize ile kalkan bırakma (Z9) aynı pakette gelirse ret güvenli |
| K-Z2 | Eğitimsiz zırhta saldırı dezavantajının kapsamı (Z16) | SRD yalnız STR/DEX içeren D20 Test; oyunda CHA/WIS silah saldırısı nadir (Pact of the Blade, paket); düzeltme `attackDis`'e yetenek alanı ister | Yetenek bilgisi olan saldırıda yalnız STR/DEX'e daralt (98); nadir olduğu için düşük öncelik |
| K-Z3 | Kalkanın +2'si kodda sabit (`stats.ts:295`) | Proje kuralı "sabit değer önce JSON'a"; `data/armor.json`'da Shield kaydı yok, `data/srd/armor.json`'da var | Veriye `Shield` kaydı (`baseAc: 2`, `type: shield`) eklensin mi; davranış aynı kalır |

### Düzeltme önerileri (Z)

1. **Mage Armor / Armor of Shadows tabanı (Z25):** `acMin` tabanının yalnız taban hesabı (zırh/zırhsız + DEX/UD) ile karşılaştırılması; kalkan, eşya (`acBonus`, `shieldAcBonus`, `unarmoredAcBonus`) ve feat parçaları tabanın üstüne eklenir (savaşçıda `acParts`'tan taban/ek ayrımı ya da `acBase` alanı). Öncelik yüksek. Sürümlü (kural sürümü 98).
2. **Eğitimsiz zırhta inisiyatif dezavantajı (Z18):** `startBattle` inisiyatifinde `effects[].checkDis` içinde `dex` varsa dezavantaj (ağır yük de aynı yoldan düzelir). Öncelik yüksek. Sürümlü (kural sürümü 98).
3. **Gizlen'de `checkDis` (Z17):** `executeHide` kip kaynaklarına `checkMode(actor,'stealth') === 'disadvantage'` (etki adıyla, ör. "Eğitimsiz zırh") eklensin; Search/Algı yolları da taransın. Öncelik orta. Sürümlü (kural sürümü 98).
4. **Eğitimsiz kalkanın sihirli bonusu (Z12):** `stats.ts:303`'te `shieldAcBonus` yalnız `armorProficient(..., 'shield')` iken. Öncelik orta. Sürümlü (kural sürümü 98): AC savaşçıya kurulumda yazıldığı için `combatantFromSheet` sürüm kapısı (`soyKapali` kalıbı); oluşturucu özeti sürümsüz aynı sonucu gösterir.
5. **Kalkan + Two-Handed (Z31, K-Z1 kararına bağlı):** oluşturucuda `characterIssues` uyarısı (sürümsüz, oluşturucu); savaşta kalkanlıyken Two-Handed seçeneğine `handBusy` ve ret. Öncelik orta. Sürümlü (kural sürümü 98).
6. **Kalkan tak/çıkar Utilize (Z9):** `don_shield`/`doff_shield` (Utilize eylemi; `shieldHeld`, `ac` ±2, Monk UD yeniden hesap). Öncelik düşük. Sürümlü (kural sürümü 98; yeni olay → kayıt sürümü 25).
7. **Eğitimsiz zırh saldırı kapsamı (Z16, K-Z2):** `attackDis` yalnız STR/DEX'li saldırıya. Öncelik düşük. Sürümlü (kural sürümü 98).
8. **Sihirli zırh eşleşmesi (Z20, Z29, Z30):** eşyaya hedef zırh türü (`Armor (Chain Mail or Chain Shirt)` vb.), Elven Chain eğitimi, Mithral Str şartı. Öncelik düşük; sihirli eşya bölümüyle birlikte. Sürümlü (kural sürümü 98) + oluşturucuda eşleşmeyen zırh/eşya için sorun metni (sürümsüz, oluşturucu).
9. **Kalkan verisi (K-Z3):** `data/armor.json`'a Shield kaydı. Öncelik düşük. Sürümsüz (veri).

### Probe dökümü (Z)

- `zzTmpTFE5a`: 12 zırh × `deriveStats` (AC/DEX/Str/Stealth/hız; SRD tablosuyla eşleşti), Plate + STR 13 → hız 20 (savaşçı 20), Chain + STR 13 → 30; Leather'lı Wizard: `armor:untrained`, `cast_spell` reddi, Dagger saldırısı `disadvantage`, `hide` `normal` (açık), inisiyatif 2 zar (açık); kalkan: Fighter Chain + kalkan 18, Wizard kalkan 13, Wizard kalkan +1 → 14 (açık), Monk 15 / kalkanla 13, Barbarian kalkanla 17 / Hide 14; kalkan + Greatsword saldırısı `ok` (açık); Mage Armor: kalkanlı Fighter 16 (beklenen 18), Ring'li Wizard 16 (beklenen 17); Barkskin 17; Leather + Armor +1 15, Leather + Dwarven Plate 16; Mithral stealth kalkıyor; Elven Chain eğitim vermiyor; Chain Mail Fighter `hide` `disadvantage`.
- `zzTmpTFE5b`: eğitimsiz Wizard `saveMode` dex/str `disadvantage`, con `normal`; Plate + Mithral STR 10 → 20 ft; `characterIssues` eğitimsiz zırh ve kalkan + iki elli silah için sorun üretmiyor.
- İki probe dosyası silindi (`ls src/battle/zzTmpTFE5*` → yok).

## 6. Savaşla ilgili donanım (D)

Kapsam: SRD 5.2.1 Adventuring Gear (s. 94–100), silah özelliği Ammunition (s. 89), Attunement (s. 177), sihirli eşya kuralları ve A–Z (s. 204–253). Kural sürümü 97 (probe'da `CURRENT_RULES` = 97). Eşya verisi: `data/items.json` (23 temel kayıt) + tembel `data/items-srd.json` (376; aynı kimlik `items.json`'dakini ezmez, `src/data/index.ts:126-127`), toplam **399** (magic-items 319, gear 79, tools 1). Betikle sayım (A5 önceliğiyle: `gm` listesi `offCombat`'tan önce): **(a) savaş dışı 145, (b) veriyle tanımlı 240, (c) Game Master'a bırakılan 14**; uyum gerektiren 175; (b) içinde `use` 58 (heal 4, effect 44, throw 9, coat 1), yüklü büyülü (`spells`/`charges`) 41, `onHit` 24, `bonus.weapon` 21, `bonus.spell` 7, `passive` 90, `effects` (AC/save/yetenek) 34 alan. `harita/belgeler/ESYA-SINIFLANDIRMA.md` özetiyle birebir. Kuyruk 19 eklentileri (iyileştirme iksiri hariç her şey) `srdK19` Game Master anahtarına bağlı (`src/battle/items.ts:34`, `create.ts` `stripItemsWhenOff`).

| # | SRD kuralı / özellik (sayfa) | Motorda karşılığı (dosya:satır) | Durum | Kanıt |
|---|---|---|---|---|
| D1 | İksir içmek ya da 5 ft içindeki yaratığa içirmek Bonus Action (s. 204 "Using a Potion"; s. 99 Potion of Healing) | `src/battle/economy.ts:241-250` (`use_item` bonus; verisinde `action` ise eylem), `items.ts:38-41` (dost, `reachFt` 5) | tam | probe PD1-1: dosta 2d4+2 (C 5 → 15), `economy.bonus` harcandı, eylem boş; 10 ft'teki dosta "Hedef 5 ft içinde olmalı." |
| D2 | Potions of Healing: 2d4+2 / 4d4+4 / 8d4+8 / 10d4+20 (s. 236) | `data/items.json` dört `use.kind: heal` kaydı; `items.ts:52-56` (`healRoll`, Beacon of Hope uyumlu) | tam | PD1-1 (zar 4+4+2 = 10); mevcut `src/battle/items.test.ts` (düşmüş dostu kaldırır, replay) |
| D3 | İksir sarf edilir, "used up" (s. 204); envanterde birden çok iksir | `create.ts:347-351` (`itemNames`'teki her iksir türü **1 adet**), `src/app/partyStatus.ts:41-71` (savaş sonu `itemNames`'e dokunmaz) | kısmi | PD14-1: üç "Potion of Healing" → `{potion-of-healing: 1}`; kullanılan iksir sayfadan düşmediği için her savaş yeniden 1 adet gelir |
| D4 | Potion of Heroism: 10 geçici HP + Bless, 1 saat (s. 236) | `items-srd.json` `potion-of-heroism` (`tempHp` 10, `dice` 1d4 attack/save, 600 tur) | tam | PD13-2: `tempHp` 10, `dice {1d4, on: attack, save}` |
| D5 | Potion of Invisibility: 1 saat, saldırı/hasar/büyüyle biter (s. 236) | `grants: Invisible`, `breakOnAct`, 600 tur | tam | PD13-3: `Invisible`, `until` 600 |
| D6 | Potion of Speed: Haste etkisi 1 dakika, konsantrasyonsuz, **uyuşukluk dalgası yok** (s. 236) | `items-srd.json` `potion-of-speed` `effect.lethargy: true` → `reduce.ts:517-524` `lethargyAfter` | kısmi | PD3-1: süre bitince `item:potion-of-speed/lethargy` etkisi ve `Incapacitated` (SRD açıkça yok diyor) |
| D7 | Potion of Poison: 4d6 Poison **her durumda**; DC 13 CON save başarısızsa 1 saat Poisoned (s. 236) | `items.ts:70-79` (save başarılıysa hasar yarı ve erken dönüş) | kısmi | PD2-1: zar [6,6,6,6] = 24, başarılı save'de 12 uygulandı; Poisoned yok (doğru) ama hasar yarılanmamalı |
| D8 | Potion of Giant Strength (6 tür): STR skoru 1 saat X olur (s. 235) | `itemEffects.ts:67-75` `itemAttackPlus` (`strFloor`, yalnız STR saldırı/hasarı) | bilinçli sapma | DECISIONS.md "Kuyruk 19 (7)": "Potion of Giant Strength yalnızca STR saldırılarını etkiler" (STR save/Athletics yok) |
| D9 | Diğer içecek/yağ etkileri: Resistance ×13, Flying, Growth, Diminution, Gaseous Form, Invulnerability, Climbing, Vitality, Oil of Sharpness/Slipperiness/Etherealness (s. 233–236) | `items-srd.json` `use.kind: effect` (44 kayıt) → `items.ts:68-85` süren etki | doğrulanmadı | Yalnız Potion of Flying mevcut testte (`k19items.test.ts` "Potion of Flying"); kalan tek tek koşturulmadı |
| D10 | Antitoxin: Bonus Action, 1 saat Poisoned save avantajı (s. 96) | `items.json` `antitoxin` (`saveAdvAgainst: Poisoned`, 600 tur, `reachFt` 0) | tam | PD13-1 |
| D11 | Acid: Attack eyleminde bir saldırı yerine, 20 ft, DEX DC 8+DEX+PB, 2d6 Acid (s. 94) | `economy.ts:244-248` (saldırı hakkından düşer), `items.ts:87-96` | tam | PD8 (DC 12 = 8+1+3); `k19items.test.ts` "Acid fırlatma" (`attacksLeft` −1, replay). Nesne hedefi yok (yalnız düşman yaratık) |
| D12 | Alchemist's Fire: 1d4 Fire + Burning; Burning tur başı 1d4, söndürme **eylem + Prone** (s. 94, s. 178) | `items.ts:99-104` (`ongoing` 1d4, DEX DC 10 ile söner) | bilinçli sapma | PD8-1: `ongoing {1d4, fire, save dex, dc 10}`; DECISIONS.md (Dungeondex "oyunda DC 10 DEX ile söndürme") |
| D13 | Holy Water: 2d8 Radiant yalnız Fiend/Undead (s. 97) | `items.json` `holy-water` (`vs`), `items.ts:92` | tam | PD8-2: humanoid 0 hasar; undead [1,1] → 2 |
| D14 | Net: 15 ft, Restrained; **Huge+ otomatik başarı**; DC 10 STR (Athletics) kurtulma, ağ AC 10 / 5 HP (s. 98) | `items-srd.json` `net` (`grants` Restrained, `escapeDc` 10), `items.ts:99-102` | kısmi | PD7-1: Huge hedef Restrained oldu (boyut denetimi yok); ağı kırma yok |
| D15 | Basic Poison: Bonus Action, yalnız Piercing/Slashing hasarda +1d4 Poison, 1 dakika **ya da ilk hasara dek** (s. 99) | `items.ts:63-67` (`coated`, 10 tur), `features.ts:335-340` | kısmi | Kod: hasar türü süzgeci yok, etki ilk hasarda kalkmıyor (`coated` başka yerde silinmez; grep) — probe'lanmadı |
| D16 | Oil: yaratığa fırlatma (DEX save, ateşte +5 Fire), alana dökme ve yakma (s. 98) | `items-srd.json` `oil` `offCombat` ("GM nesne/yüzey aracıyla"); `data/yuzeyler.json` `oil` yüzeyi (girişte DEX 10 / Prone) | yok | Oyuncu fırlatamaz; GM yüzeyi SRD'deki yanma kuralı değil kayma kuralı |
| D17 | Caltrops (DC 15, 1 Piercing, hız 0) ve Ball Bearings (DC 10 Prone), Utilize (s. 96) | `offCombat`; `data/yuzeyler.json`'da caltrops yok, `slick` (Grease kuralı) var | yok | `grep -i caltrop src` boş; ayrı yüzey/nesne türü yok |
| D18 | Hunting Trap (DC 13, 1d4, zincir), Manacles (DC 13 bağlama) (s. 97–98) | `offCombat` | yok | `data/nesneler.json` `kinds`'ta tuzak/kelepçe yok |
| D19 | Healer's Kit: Utilize ile zarsız stabilize, 10 kullanım (s. 97) | `items.json` `healers-kit` (`passive.traits`), `commands.ts:705-709` | kısmi | Kod: kitle her zaman zarsız stabilize; 10 kullanım sayılmıyor, eylem türü `stabilize` (eylem) |
| D20 | Torch 20 ft parlak + 20 ft loş, Simple Melee saldırı 1 Fire; Lantern Hooded 30+30, Bullseye 60 ft koni + 60 (s. 98, s. 100) | `items-srd.json` `torch` `passive.light: 8`, `lantern-*` `light: 12` (`maprules.ts:594-598`) | kısmi | PD14-2: Torch `light` 8 altıgen (40 ft) parlak, `lightDim` yok (K67 loş modeli kullanılmıyor); meşale silahı yok |
| D21 | Ammunition özelliği: atış başına 1 cephane, bitince atış yok; savaştan sonra yarısı geri (s. 89) | `create.ts:407-411` (türe göre sabit 20), `economy.ts:219`, `reduce.ts:599-601` | kısmi | PD6-1: `{arrow: 20}` → 19; 0'da "Cephane bitti (arrow)."; stok envanterden değil, her savaş 20 (geri kazanım gereksiz, sayım kalıcı değil) |
| D22 | Attunement: aynı anda en çok 3 eşya (s. 177) | `src/rules/stats.ts:131-144` `MAX_ATTUNED`, `activeItemNames`; oluşturucu `builder.ts:403` | tam | PD9-1: 4 uyumlu eşyadan ilk 3 etkin (Bracers düşer) |
| D23 | Uyum ön şartı: sınıf ya da "by a Spellcaster" (s. 205) | Şema alanı yok (`items*.json` anahtar kümesi) | yok | PD11-1: Fighter 5 Wand of Fireballs'a uyumlu, Fireball + 7 yük alır |
| D24 | Armor/Shield +1..+3, Ring/Cloak of Protection (+1 AC ve save), Bracers of Defense (+2 zırhsız ve kalkansız) (s. 210, 214, 216, 238, 243) | `stats.ts:299-304` (`armorAcBonus` zırhla, `shieldAcBonus` kalkanla, `unarmoredAcBonus`), `stats.ts:329` save | tam | PD9-2: Monk AC 14 → 16 (Ring + Cloak); `finalScores` save toplamı |
| D25 | Yetenek skoru ayarlayan eşyalar: Belt of Giant Strength ×6, Gauntlets of Ogre Power, Headband of Intellect, Amulet of Health (skor yüksekse etkisiz) (s. 211–226) | `stats.ts:176-183` `setAbility` (`Math.max`) | tam | PD9-3: Amulet CON 19; Belt of Hill Giant Strength STR 21 |
| D26 | Weapon +1/+2/+3: **o silahla** saldırı ve hasar (s. 253) | `itemEffects.ts:52` (`bonus.weapon` en büyüğü), `create.ts:189, 202-209` (bütün silah seçeneklerine, Unarmed hariç) | kısmi | PD5-1: tek "Weapon, +1" Longsword **ve** iki Dagger seçeneğini 5 → 6 yapar; sayfadaki `weapons[].enchant` yolu silah başına doğru |
| D27 | Ammunition +1/+2/+3: yalnız o cephaneyle, isabetten sonra büyüsü biter (s. 209) | aynı yol (`bonus.weapon`) | kısmi | PD5-2: "Ammunition, +1" yakın dövüş Longsword/Dagger'a da +1; kalıcı |
| D28 | Flame Tongue: Bonus Action ile tutuşur, tutuşukken +2d6 Fire, 40 ft parlak + 40 ft loş (s. 223) | `items-srd.json` `flame-tongue` `onHit` (`melee`), `passive.light` 8 | kısmi | `k19items.test.ts` "Flame Tongue": etkinleştirmesiz +2d6; PD14-2: her yakın dövüş silahına ek, loş ışık yok |
| D29 | Javelin of Lightning: isabette Lightning'e çevir; Lightning Bolt: 120 ft 5 ft çizgi, DC 13 DEX, 4d6 yarı, şafakta bir (s. 228) | `items-srd.json` `javelin-of-lightning` `onHit {4d6 lightning, ranged}` | yok | PD4-1: Longbow atışına her isabette +4d6 Lightning (çizgi/save yok; hatalı ek) |
| D30 | Ammunition of Slaying: seçilen tür, DC 17 CON, 6d10 **Force** (yarı), sonra büyüsüz (s. 209) | `items-srd.json` `ammunition-of-slaying` `onHit {6d10 piercing, ranged}` | yok | PD4-2: humanoid hedefe her menzilli isabette 6d10 Piercing, save ve tür yok (DECISIONS "Kimlik genişletmesi": düzeltilmedi, ayrı görev önerildi) |
| D31 | Diğer isabet ekli silahlar (24 `onHit`; Dragon/Giant Slayer, Holy Avenger, Mace of Disruption, Sun Blade, Frost Brand, Vicious Weapon…) (s. 209–253) | `itemEffects.ts:16-19` `itemHitsFor` (tür `vs`, `critOnly`, yakın/menzilli süzgeci) | kısmi | Ek **eşyaya** değil **karaktere** bağlı: hangi silahla vurulursa vurulsun uygulanır (PD4, PD14-2); tek tek koşturulmadı |
| D32 | Yüklü büyü eşyaları: Wand of Magic Missiles (1–3 yük, yük başına +1 seviye), Wand of Fireballs (DC 15), Necklace of Fireballs, Staff of Healing (büyü başına farklı yük) (s. 233, 245, 250, 251) | `itemEffects.ts:55-59` (kaynak `item:<id>`, `dc`), `spells.ts:448-452` (yalnız `slotLevel` yokken) | kısmi | PD10-3: ilk savaşta 7 → 6 doğru; `slotLevel: 2` ile yük harcayarak yükseltme yok ("Uygun büyü slotu kalmadı."); her büyü 1 yük; DC 15 `k19items.test.ts` |
| D33 | Şarjların kalıcılığı ve şafakta yenilenme (1d6+1 vb.), son yükte 1d20 (s. 206 "Charges", s. 250–251) | `src/app/partyStatus.ts:14` `withStatus` → `resources: { ...s.resources }` (durumdaki kaynaklar yalnız sınıf/feat; `characterRest.ts:61`) | yok | PD10-1/2: kayıtlı durumu olan karakterde `item:wand-of-magic-missiles` **siliniyor** (7 → undefined), Magic Missile atılamıyor; ilk savaştan sonra her karakterin durumu olduğundan değnek/asa/kolye ve P7 eşya kaynakları (`create.ts:173-174` `ib.resources`) ikinci savaştan itibaren kullanılamaz |
| D34 | Boots of Speed: Bonus Action ile hız ×2 **ve fırsat saldırısına dezavantaj**, toplam 10 dakika, kapatılabilir (s. 214) | `items.json` `boots-of-speed` (`speedMult` 2, 100 tur, `use` tek adet) | kısmi | PD12-1: etkide yalnız `speedMult`; fırsat saldırısı dezavantajı ve kapatma yok |
| D35 | Cloak of Displacement: saldırılara dezavantaj; hasar alınca sonraki turuna dek, hız 0'da bastırılır (s. 215) | `items.json` `passive.attackedDis: true` | kısmi | Kod: kalıcı `attackedDis`, hasar/hız 0 bastırması yok |
| D36 | Wand of the War Mage +N: **yalnız büyü saldırısına** +N ve yarım siperi yok sayma (s. 251) | `create.ts:190-191` (`bonus.spell` hem `spellAttack` hem `spellSaveDc`'ye) | kısmi | Kod: DC'ye de ekleniyor; yarım siper yok sayılmıyor (Robe of the Archmagi / Staff of Power aynı alanı paylaşıyor) |
| D37 | (c) grubu, 14 eşya: Vorpal Sword, Nine Lives Stealer, Defender, Berserker Axe, Energy Bow, Hat of Many Spells, Quarterstaff of the Acrobat, Rod of Lordly Might, Rod of Absorption, Immovable Rod, Spell Scroll, Talisman ×2, Wand of Enemy Detection (s. 209–253) | `data/esya-siniflandirma.json` `gm` (P7: savaşta uygulanmaz); 10'unda `bonus` yine uygulanıyor | bilinçli sapma | `ESYA-SINIFLANDIRMA.md` (c) tablosu; Vorpal/Nine Lives ölüm kolu, Defender AC aktarımı, Spell Scroll büyüsü yok |
| D38 | Yapay zekânın eşya kullanması (SRD kuralı değil; oyun) | `ai/behaviors.ts` `itemCands` (yalnız iyileştirme iksiri, yarı can altı) | bilinçli sapma | DECISIONS.md "Kuyruk 19 (7)": yapay zekâ eşya kullanmaz (Y1'de iksir eklendi); fırlatma/değnek yok |

**Bölüm sayıları:** tam 10, kısmi 16, yok 7, bilinçli sapma 4, doğrulanmadı 1 (toplam 38)

Not: Potion of Fire Breath ve "Bomb" SRD 5.2.1'de yok (s. 204–253 ve s. 94–100'de girdi bulunmadı); denetim dışı.

### Öne çıkan bulgular (D)

- **Eşya şarjları ikinci savaşta yok oluyor (D33).** `withStatus` savaşçının kaynaklarını kayıtlı durumla tümden değiştiriyor; durum yalnız sınıf/feat kaynaklarını tutuyor. İlk savaştan sonra her karakterin durumu olduğu için 41 yüklü eşya (değnek, asa, kolye) ve P7 eşya kaynakları (Bag of Tricks, Horn of Valhalla…) fiilen tek savaşlık. Probe'da Wand of Magic Missiles 7 → yok, büyü reddedildi.
- **İsabet ekleri ve +N bonusu silaha değil karaktere bağlı (D26, D27, D29–D31).** "Weapon, +1" bütün silahlara, "Ammunition, +1" yakın dövüşe de geçiyor. Javelin of Lightning her menzilli isabete +4d6, Ammunition of Slaying her menzilli isabete save'siz 6d10 ekliyor. En büyük güç şişmesi bu iki kayıtta.
- **İki iksir SRD metninin tersini yapıyor (D6, D7).** Potion of Speed, SRD "uyuşukluk yok" dediği halde bitince Incapacitated veriyor. Potion of Poison başarılı save'de hasarı yarılıyor (SRD'de hasar her durumda tam).
- **Sarf modeli basit (D3, D21).** Her iksir türünden 1 adet geliyor, kullanılan iksir sayfadan düşmüyor, her savaşta yenileniyor. Cephane türe göre sabit 20 ve kalıcı değil. Bu yüzden sarf eşyası ekonomisi savaşlar arasında yok.
- **Adventuring Gear'ın Utilize eşyaları eksik (D16–D18).** Oil fırlatma, Caltrops, Ball Bearings, Hunting Trap ve Manacles yok. `offCombat` gerekçesi "GM nesne/yüzey aracıyla" diyor, ama yüzey/nesne tablolarında Caltrops, tuzak ve kelepçe karşılığı yok. Net'te Huge+ muafiyeti eksik (D14).
- **Doğru çalışanlar:** iksir ekonomisi (bonus eylem, 5 ft içindeki dosta), dört iyileştirme kademesi, Acid/Holy Water fırlatma DC'si ve saldırı hakkı, uyum sınırı 3, AC/save/yetenek eşyaları (D1, D2, D11, D13, D22, D24, D25).

### Karar gerekli (D)

| # | Konu | Neden karar | Öneri |
|---|---|---|---|
| K-D1 | Sarf envanteri (iksir adedi, kullanılan iksirin sayfadan düşmesi, cephane stoku) | Savaşlar arası ekonomi ve Serüven dengesi değişir; şu an her savaş 1 iksir "bedava" | Sayfada `itemCounts` (adet) + savaş sonu `item_used` toplamını düş; cephane `ammoCounts`, savaş sonu SRD yarı geri kazanım |
| K-D2 | Eşya ↔ silah bağı (+N, onHit, Flame Tongue) | Şema değişikliği gerekir (karaktere değil silah girdisine bağlama); oluşturucu arayüzü etkilenir | Sayfadaki `weapons[].enchant` yolunu genişlet: `weapons[].itemId`; eşyanın `bonus`/`onHit`'i yalnız o seçenekte |
| K-D3 | Alchemist's Fire söndürme (DC 10 DEX) | Dungeondex'te "oyun farkı" olarak yazılmış; SRD eylem + Prone ister | SRD'ye dön (söndürme komutu: eylem, Prone) ya da sapmayı DECISIONS'a ayrı satırla kalıcılaştır |
| K-D4 | Utilize eşyaları (Caltrops, Ball Bearings, Hunting Trap, Manacles, Oil) | Yeni yüzey/nesne türleri ve oyuncu komutu; kapsam kararı | Caltrops ve Ball Bearings `yuzeyler.json` yüzeyi + `use.kind: spread`; tuzak/kelepçe GM'e kalsın, `offCombat` metni düzeltilsin |
| K-D5 | (c) grubundaki 10 eşyada `bonus` yine uygulanıyor | "Savaşta uygulanmaz" ile çelişiyor; yarı uygulama | Ya `bonus`'u koru ve belgeyi "kısmi" yap, ya da `gm` eşyalarında bütün alanları savaş başında kaldır |

### Düzeltme önerileri (D)

1. **Eşya şarjlarını kayıtlı durumda koru (D33).** `withStatus` savaşçıda olup durumda olmayan kaynakları korusun (`{ ...c.resources, ...s.resources }`), `fullStatus` eşya kaynaklarını (`item:*`, `itemBag`) içersin; şafak yenilenmesi uzun dinlenmeye bağlansın. Öncelik: yüksek. Sürümsüz (veri/arayüz; uygulama katmanı, savaş olayları değişmez).
2. **Potion of Speed uyuşukluğunu kaldır (D6).** `items-srd.json` `potion-of-speed` `effect.lethargy` sil; eski savaşta etkiyi korumak için okuma sürüme bağlı. Öncelik: yüksek. Sürümlü (kural sürümü 98).
3. **Potion of Poison hasarı tam (D7).** `items.ts:74` save yalnız Poisoned'ı belirlesin, hasar yarılanmasın. Öncelik: orta. Sürümlü (kural sürümü 98).
4. **Javelin of Lightning ve Ammunition of Slaying'i yeniden modelle (D29, D30).** Javelin: tek kullanımlık çizgi alan (`use.kind: area`, DC 13, 4d6 yarı, uzun dinlenmede bir); Slaying: `vs` tür seçimi + DC 17 CON + Force + tek kullanım. Öncelik: yüksek (güç şişmesi). Sürümlü (kural sürümü 98).
5. **Net'te Huge+ otomatik başarı (D14).** `use.maxSize: 'Large'` ve `items.ts` atışında boyut denetimi. Öncelik: düşük. Sürümlü (kural sürümü 98).
6. **Basic Poison: yalnız Piercing/Slashing ve ilk hasarda biter (D15).** `features.ts:335` hasar türü süzgeci + `effect_ended` olayı. Öncelik: düşük. Sürümlü (kural sürümü 98).
7. **Wand of the War Mage DC'ye eklenmesin, yarım siper yok sayılsın (D36).** `bonus.spellAttack` ve `bonus.spellDc` ayrı alanlar (Robe of the Archmagi ikisini birden alır). Öncelik: orta. Sürümlü (kural sürümü 98).
8. **Boots of Speed fırsat saldırısı dezavantajı ve Cloak of Displacement bastırması (D34, D35).** Etki alanları `oaDis` ve `attackedDisUntilDamaged` (+ hız 0). Öncelik: düşük. Sürümlü (kural sürümü 98).
9. **Değnek yükü ile yukarı seviye (D32).** `cast_spell` eşya yolunda `chargeLevel`: yük başına +1 seviye (en çok 3), Staff of Healing büyü başına yük tablosu veride. Öncelik: orta. Sürümlü (kural sürümü 98).
10. **Uyum ön şartı (D23).** `attunementBy: ["spellcaster"] | [sınıf…]` alanı ve oluşturucu sorunu; savaş tarafı `activeItemNames`'te süzer. Öncelik: düşük. Sürümsüz (veri/arayüz; yalnız oluşturucu) — savaşta süzülürse sürümlü.
11. **Işık kaynakları K67 loş modeline (D20, D28).** Torch `light` 4 + `lightDim` 4, Hooded Lantern 6 + 6, Flame Tongue 8 + 8; meşale doğaçlama silah seçeneği. Öncelik: düşük. Sürümlü (kural sürümü 98; ışık alanı savaş durumunu etkiler).
12. **`offCombat` gerekçelerini düzelt (D16–D18).** "GM nesne/yüzey aracıyla" yalnız gerçekten aracı olan Oil/Ball Bearings (slick) için kalsın; Caltrops, Hunting Trap, Manacles "uygulanmadı" desin. Öncelik: düşük. Sürümsüz (veri/arayüz).

### Probe dökümü (D)

Geçici dosyalar `src/battle/zzTmpTFE6a.test.ts` ve `zzTmpTFE6b.test.ts` (çalıştırıldı, sonra silindi; `ls src/battle/zzTmpTFE6*` → yok). Kurulum: `combatantFromSheet` (Fighter/Monk 5, `blankCharacter` + `suggestedScores`) + `startBattle` (`col`, varsayılan kural sürümü 97) + `execute`.

- PD0: `CURRENT_RULES` = 97.
- PD1-1: Potion of Healing dosta (5 ft): C 5 → 15, bonus harcandı, eylem boş; 10 ft red.
- PD2-1: Potion of Poison, CON +30: zar 24, uygulanan 12, Poisoned yok.
- PD3-1: Potion of Speed etkisi `{speedMult 2, ac 2, saveAdv dex, extraAction, lethargy}`; bitince `…/lethargy` + Incapacitated.
- PD4-1/2: Longbow seçeneğine `itemHitsFor` → Javelin of Lightning 4d6 lightning, Ammunition of Slaying 6d10 piercing (humanoid).
- PD5-1/2: taban saldırı 5; "Weapon, +1" ve "Ammunition, +1" ile Longsword + iki Dagger seçeneği 6, Unarmed 5.
- PD6-1: Longbow `ammo {arrow: 20}` → 19; 0'da "Cephane bitti (arrow)."
- PD7-1: Net, Huge hedef → Restrained, `escapeCheck {dc 10}`.
- PD8-1/2: Alchemist's Fire `ongoing {1d4 fire, dex, dc 10}`; Holy Water DC 12, humanoid 0, undead [1,1] → 2.
- PD9-1/2/3: 4 uyumlu eşyadan ilk 3; Monk AC 14 → 16; Amulet CON 19; Belt (Hill) STR 21.
- PD10-1/2/3: Wand of Magic Missiles yeni savaşçıda 7; `withStatus(fullStatus)` sonrası yok, büyü reddedildi; durumsuz döküm 7 → 6; `slotLevel: 2` → "Uygun büyü slotu kalmadı."
- PD11-1: Fighter Wand of Fireballs: Fireball bilinir, 7 yük.
- PD12-1: Boots of Speed etkisi yalnız `speedMult 2`, 100 tur; bonus eylem harcandı.
- PD13-1/2/3: Antitoxin `saveAdvAgainst Poisoned` 600 tur; Heroism geçici HP 10 + 1d4; Invisibility `Invisible`, 600 tur.
- PD14-1/2: üç Potion of Healing → 1 adet; Flame Tongue `itemHits` melee 2d6, Torch/Flame Tongue `light` 8, `lightDim` yok.
