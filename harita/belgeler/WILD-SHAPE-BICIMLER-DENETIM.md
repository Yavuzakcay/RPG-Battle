# Wild Shape biçimleri denetimi (SRD 5.2.1)

Yalnız denetim: kod, veri, test ve DECISIONS.md değişmedi. Tarih 2026-11-20, kural sürümü 91 (güncel). Genel Wild Shape kuralları [WILD-SHAPE-DENETIM.md](WILD-SHAPE-DENETIM.md)'de; burada biçim biçim stat bloğu.

## Özet

- **Biçim sayısı: 69.** SRD 5.2.1'deki CR ≤ 1 Beast'lerin hepsi (`data/canavar-turleri.json` `beast` + `data/monsters.json` CR; liste `druid.ts` `eligibleForms`, eşikler `data/class-features.json` Wild Shape: Beast Shapes tablosu). Eksik ya da fazla biçim yok. Giant Eagle, Giant Owl, Giant Vulture, Flying Snake SRD 5.2.1'de Beast değil, listede yok (doğru).
  - 2. seviyeden (CR ≤ 1/4, uçuşsuz): 40 biçim; 4. seviyeden (CR ≤ 1/2, uçuşsuz): +7 = 47; 8. seviyeden (CR ≤ 1, uçan dahil): +22 = 69.
- **Stat bloğu girdisi: 137** (özellik, eylem, bonus eylem, tepki; Multiattack dahil).
  - Savaş dışı: 3 (Compression, Mimicry, Beast of Burden). Eksik sayılmadı.
  - **Savaşta etkili: 134.** Tam 91, kısmi 42, yok 1.
  - Kısmilerin 17'si yalnız sabit hasar ("1 hasar" → 1d2; CLAUDE.md "Bilinen eksikler"), 4'ü önceki denetimden bilinen (Swallow ×2, Multiattack bileşimi ×2), 21'i yeni (Swarm, Water Breathing, atlama özellikleri, Bubble Dash, Illumination, Cacophony).
- **Düşman ile biçim arasındaki fark (iki yol):**
  - 75 saldırının 75'i iki yolda aynı sonucu veriyor (Y16): ek hasar, Prone, Grappled/Restrained, hücum, Bloodied hasarı, süreli durumlar.
  - 20 alanlık karşılaştırmada (hız, duyular, AC, boyut, direnç, durum bağışıklığı, işaretler, etkiler, tepkiler, bonus eylemler, yetenekler, su soluma) tek fark Multiattack (bilinen).
  - **Yeni fark 1: Rampage** (Giant Hyena) düşmanda çalışıyor, biçimde hiç çalışmıyor (Y11).
  - **Yeni fark 2: Swarm** biçimi Wild Shape'in geçici HP'sini alıyor; SRD sürüye geçici HP vermez (⚠ yorum, Y6).
  - **Yeni fark 3 (genel, bütün biçimler): STR skoru biçimden alınmıyor** (G1, Y13): atlama mesafesi ve taşıma/sürükleme druidin kendi STR'siyle.
- Önceki denetimde bulunanlar (Swallow, Multiattack bileşimi, `multiHex` sığma, süre) yeniden açılmadı; tablolarda "bilinen". Arayüzde yetenek düğmesi eksiği (önceki A38) bu arada `birlesik`'e gelen 51f0b8cb ile kapandı (G4); motor değişmedi, yoklamalar geçerli.

## Yöntem

- Kaynak: `data/srd/monsters.json` (SRD 5.2.1 stat blokları, EN metin), `data/monsters.json`, ekler `data/attack-riders.json`, `data/canavar-ekleri-a2.json`, `data/condition-effects.json`, yetenekler `data/canavar-yetenekleri.json`.
- Geçici yoklama `src/battle/_bicim_yoklama.test.ts` (silindi, depoya girmedi):
  - her biçim için 20. seviye Circle of the Land druidi biçime soktu, aynı canavarı düşman olarak kurdu, iki savaşçının alanlarını karşılaştırdı;
  - her saldırıyı iki yoldan da (druid biçimde `attack`/`monster_attack`, düşman `monster_attack`) aynı zarla attı, hedefin durumlarını ve ek hasarları karşılaştırdı;
  - belirsiz satırları tek tek tetikledi (Y1–Y18 aşağıda).
- "Biçimde" sütunu: SRD metni oyunda nasıl işliyor. "Fark" sütunu: düşman canavar olarak farklı davranıyorsa.
- Durum: **tam** (SRD metniyle aynı), **kısmi** (bir parçası eksik ya da yaklaşık), **yok** (hiç işlemiyor), **savaş dışı** (savaşta etkisi yok; eksik sayılmaz).
- Her biçimin hız, duyu, AC, boyut, direnç, durum bağışıklığı ve save/beceri değerleri genel kuraldır (WS91), tablolara ayrı satır olarak yazılmadı; 69 biçimde düşmanla aynı (Y0).

## Genel bulgular (her biçimde)

| # | Konu | Biçimde | Durum | Fark | Kanıt |
|---|---|---|---|---|---|
| G0 | Hız (yürüme, uçma, yüzme, tırmanma, kazma), duyular, AC, boyut, direnç/bağışıklık, durum bağışıklığı, INT/WIS/CHA dışındaki değiştiriciler | biçimden | tam | yok | `shapeMonster.ts:63–82`, `druid.ts`; Y0 |
| G1 | **STR (ve DEX) skoru** | `strScore`/`dexScore` biçime geçmiyor; değiştirici (`modifiers`) geçiyor. Uzun atlama mesafesi (`jumpRangeFeet`), taşıma ve sürükleme sınırı (`capacityOf`, `dragLimitOf`) druidin kendi skoruyla. Örnek: Lion biçiminde STR 8 (druid), düşman Lion 17 | yok (yeni) | var: düşman canavar kendi STR'siyle | `reduce.ts:944` (`shape_changed` `strScore` yazmıyor), `movement.ts:664–667`, `nesneAgirlik.ts:36,38`; Y13, Y18 |
| G2 | Saldırılar | saldırı zarlı olanlar silah seçeneği (biçimin to-hit ve hasarı), save'li/şarjlı olanlar canavar saldırısı; ikisi de arayüzde seçilebiliyor | tam | yok (Y16) | `druid.ts:76–81`, `shapeMonster.ts:81`, `mapView.ts:181–186` |
| G3 | Multiattack | yalnız saldırı sayısı | bilinen | düşman planla (`data/multiattack.json`) | önceki denetim A35 |
| G4 | Canavar yetenekleri (Bubble Dash, Rampage, Swallow; SRD dışı Leap) | motor ve YZ; arayüzde Yetenek düğmesi `birlesik`'e 51f0b8cb ile geldi (önceki denetimdeki A38 kapandı; `grant` seçenekleri ayrı düğme) | tam (arayüz) | yok | `MapBattle.tsx:1764–1776`, `monsterAbilities.ts:82–86` |
| G5 | Biçimi olmayan saldırı (Seahorse: yalnız Bubble Dash) | genel "Vuruş" (Unarmed Strike) seçeneği | tam | — | Y0 (`weapons: ["Vuruş"]`) |

## Biçimler

Sıra: açıldığı seviye, sonra CR, sonra ad. Tür: özellik / eylem / bonus eylem / tepki.

### 2. seviyeden açılanlar (40)

#### Baboon (`baboon`): CR 0, Small, 30 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Badger (`badger`): CR 0, Tiny, 20 ft, kazma 5, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Cat (`cat`): CR 0, Tiny, 40 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Jumper | özellik | DEX yerine sabit 15 ft (kedinin DEX 15 koşulu değeri); koşusuz da 15 ft (SRD 7 ft) | kısmi | — | `monsterAbilities.ts:117`; Y13 |
| Scratch | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Crab (`crab`): CR 0, Tiny, 20 ft, yüzme 20, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Claw | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Deer (`deer`): CR 0, Medium, 50 ft, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Agile | özellik | erişimden çıkarken fırsat saldırısı yok | tam | — | `features.ts:488`; Y3 |
| Ram | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Frog (`frog`): CR 0, Tiny, 20 ft, yüzme 20, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Standing Leap | özellik | uzun atlama mesafesi ✓ (Jump büyüsü modeliyle: turda bir, 10 ft harcar); yüksek atlama yok ✗ | kısmi | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Fire Beetle (`giant-fire-beetle`): CR 0, Small, 30 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Illumination | özellik | 30 ft parlak, loş yok (SRD: 10 ft parlak + 10 ft loş); iki yolda da aynı | kısmi | — | `monsterTraits.ts:46` (`fx.light = 6`); Y12 |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Goat (`goat`): CR 0, Medium, 40 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Ram | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar"); hücumda 1d4 | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Hyena (`hyena`): CR 0, Medium, 50 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Jackal (`jackal`): CR 0, Small, 40 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Lizard (`lizard`): CR 0, Tiny, 20 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Octopus (`octopus`): CR 0, Small, 5 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Compression | özellik | 1 inçlik aralıktan geçme; altıgen ızgarada karşılığı yok | savaş dışı | — | — |
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Tentacles | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Ink Cloud (1/Day) | tepki | su altında, 5 ft'te tur biten yaratığa: yoğun örtü küpü + yüzme hızıyla uzaklaşma (Giant Octopus: hasar alınca, 10 ft) | tam | — | `shapeMonster.ts:76`; `k19reactions.test.ts:115`; Y14 |

#### Piranha (`piranha`): CR 0, Tiny, 5 ft, yüzme 40, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Rat (`rat`): CR 0, Tiny, 20 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Agile | özellik | erişimden çıkarken fırsat saldırısı yok | tam | — | `features.ts:488`; Y3 |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Scorpion (`scorpion`): CR 0, Tiny, 10 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Sting | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar"); ek 1d6 poison | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Seahorse (`seahorse`): CR 0, Tiny, 5 ft, yüzme 20, AC 12

Saldırısı yok; biçimde genel Vuruş (G5).

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Bubble Dash | eylem | motor (YZ, seçeneksiz komut): Dash + Disengage birlikte, fırsat saldırısı muafiyeti tur boyu (SRD yalnız bu hareket); arayüzde Dash ve Disengage ayrı düğme, ikisi birden alınamaz (G4); SRD: yüzme hızı kadar fırsat saldırısız hareket | kısmi | — | `canavar-yetenekleri.json` `seahorse`; `monsterAbilities.ts:281`; Y15 |

#### Spider (`spider`): CR 0, Tiny, 20 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Web Walker | özellik | ağ alanından etkilenmez | tam | — | `monsterTraits.ts:49`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar"); ek 1d4 poison | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Weasel (`weasel`): CR 0, Tiny, 30 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Camel (`camel`): CR 1/8, Large, 50 ft, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Crab (`giant-crab`): CR 1/8, Medium, 30 ft, yüzme 30, AC 15

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Claw | eylem | Grappled (kaçış DC 11) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Giant Rat (`giant-rat`): CR 1/8, Small, 30 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Weasel (`giant-weasel`): CR 1/8, Medium, 40 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Mastiff (`mastiff`): CR 1/8, Medium, 40 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | Prone (≤ M) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Mule (`mule`): CR 1/8, Medium, 40 ft, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Beast of Burden | özellik | taşıma kapasitesi (oyunda yalnız nesne taşıma/sürükleme; bkz. G1) | savaş dışı | — | — |
| Hooves | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Pony (`pony`): CR 1/8, Medium, 40 ft, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hooves | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Venomous Snake (`venomous-snake`): CR 1/8, Tiny, 30 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | ek 1d6 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Boar (`boar`): CR 1/4, Medium, 40 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bloodied Fury | özellik | Bloodied iken saldırı avantajlı | tam | — | `monsterAbilities.ts:118`, `classTraits.ts:42`; Y2 |
| Gore | eylem | hücum 20 ft: ek 1d6 piercing, Prone | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Constrictor Snake (`constrictor-snake`): CR 1/4, Large, 30 ft, yüzme 30, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Constrict | eylem | STR DC 12, 3d4 + Grappled (kaçış DC 12) | tam | — | `shapeMonster.ts:81`, `mapView.ts:181–186`; Y10, Y17, Y16 |

#### Draft Horse (`draft-horse`): CR 1/4, Large, 40 ft, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hooves | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Elk (`elk`): CR 1/4, Large, 50 ft, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Ram | eylem | hücum 20 ft: ek 1d6 bludgeoning, Prone | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y9, Y16 |

#### Giant Badger (`giant-badger`): CR 1/4, Medium, 30 ft, kazma 10, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Centipede (`giant-centipede`): CR 1/4, Small, 30 ft, tırmanma, AC 14

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | Poisoned (tur başına dek) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Giant Frog (`giant-frog`): CR 1/4, Medium, 30 ft, yüzme 30, AC 11

Ayrıca SRD dışı bonus yetenek Leap (20 ft sıçrama; kullanıcı kararı, DECISIONS.md) var; SRD girdisi olmadığı için sayılmadı.

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Standing Leap | özellik | uzun atlama mesafesi ✓ (Jump büyüsü modeliyle: turda bir, 10 ft harcar); yüksek atlama yok ✗ | kısmi | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | Grappled (kaçış DC 11) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Swallow | eylem | bilinen (önceki denetim: Total Cover, yutarken Bite, YZ, yutan ölünce Prone, `grapple` alanı); arayüzde Yetenek düğmesi var (G4) | kısmi | — | `monsterAbilities.ts:82–86`; önceki denetim |

#### Giant Lizard (`giant-lizard`): CR 1/4, Large, 40 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Venomous Snake (`giant-venomous-snake`): CR 1/4, Medium, 40 ft, yüzme 40, AC 14

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | ek 1d8 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Giant Wolf Spider (`giant-wolf-spider`): CR 1/4, Medium, 40 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | ek 2d4 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Panther (`panther`): CR 1/4, Medium, 50 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Rend | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Nimble Escape | bonus eylem | bonus eylemle Disengage ya da Hide | tam | — | `shapeMonster.ts:78`; Y5 |

#### Riding Horse (`riding-horse`): CR 1/4, Large, 60 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hooves | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Swarm of Rats (`swarm-of-rats`): CR 1/4, Medium, 30 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; başka yaratığın altıgeninde duramaz ✗ (iki yolda da); geçici HP engeli yok ✗ (biçime girince geçici HP = druid seviyesi ⚠); "Tiny açıklıktan geçme" ızgarada karşılıksız | kısmi | var: biçim Wild Shape geçici HP'si alır | `monsterAbilities.ts:121,127`, `movement.ts:459`, `reduce.ts:1030`; Y6, Y7 |
| Bites | eylem | sürü Bloodied iken 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Wolf (`wolf`): CR 1/4, Medium, 40 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Bite | eylem | Prone (≤ M) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

### 4. seviyeden açılanlar (7)

#### Ape (`ape`): CR 1/2, Medium, 30 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Multiattack | eylem | iki aynı saldırı: `attacksPerAction` 2 yeterli | tam | bilinen (bileşim) | `druid.ts:81` |
| Fist | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Rock (Recharge 6) | eylem | menzilli 25/50, Recharge 6 | tam | — | `shapeMonster.ts:81`, `mapView.ts:181–186`; Y10, Y16 |

#### Black Bear (`black-bear`): CR 1/2, Medium, 30 ft, yüzme 30, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Multiattack | eylem | iki aynı saldırı: `attacksPerAction` 2 yeterli | tam | bilinen (bileşim) | `druid.ts:81` |
| Rend | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Crocodile (`crocodile`): CR 1/2, Large, 20 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hold Breath | özellik | 1 saat nefes = savaş boyu su altında soluma (oyunda su altı nefes kuralı var, K73c; bu yüzden savaş dışı sayılmadı) | tam | — | `underwaterCore.ts:51–65` |
| Bite | eylem | Grappled (kaçış DC 12) + Restrained | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Giant Goat (`giant-goat`): CR 1/2, Large, 40 ft, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Ram | eylem | hücum 20 ft: ek 2d4 bludgeoning, Prone | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Seahorse (`giant-seahorse`): CR 1/2, Large, 5 ft, yüzme 40, AC 14

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Ram | eylem | hücumda 2d8+2 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Bubble Dash | bonus eylem | motor (YZ, seçeneksiz komut): bonus Dash + Disengage, tam yüzme hızı (SRD yarısı), muafiyet tur boyu; arayüzde Dash ya da Disengage ayrı düğme (G4) | kısmi | — | `canavar-yetenekleri.json` `giant-seahorse`; `monsterAbilities.ts:281`; Y15 |

#### Reef Shark (`reef-shark`): CR 1/2, Medium, 5 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Warhorse (`warhorse`): CR 1/2, Large, 60 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hooves | eylem | hücum 20 ft: ek 2d4 bludgeoning, Prone | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

### 8. seviyeden açılanlar (22)

#### Bat (`bat`): CR 0, Tiny, 5 ft, uçma 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Eagle (`eagle`): CR 0, Small, 10 ft, uçma 60, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Talons | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Hawk (`hawk`): CR 0, Tiny, 10 ft, uçma 60, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Talons | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Owl (`owl`): CR 0, Tiny, 5 ft, uçma 60, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Flyby | özellik | uçarken fırsat saldırısı yok (uçan biçim hep havada sayılır) | tam | — | `monsterTraits.ts:47`, `features.ts:486`; Y4 |
| Talons | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Raven (`raven`): CR 0, Tiny, 10 ft, uçma 50, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Mimicry | özellik | ses taklidi | savaş dışı | — | — |
| Beak | eylem | sabit 1 hasar 1d2 olarak (bilinen: CLAUDE.md "Sabit hasar") | kısmi | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Vulture (`vulture`): CR 0, Medium, 10 ft, uçma 50, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Beak | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Blood Hawk (`blood-hawk`): CR 1/8, Small, 10 ft, uçma 60, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Beak | eylem | hedef Bloodied ise 1d8+2 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Giant Bat (`giant-bat`): CR 1/4, Large, 10 ft, uçma 60, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Pteranodon (`pteranodon`): CR 1/4, Medium, 10 ft, uçma 60, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Flyby | özellik | uçarken fırsat saldırısı yok (uçan biçim hep havada sayılır) | tam | — | `monsterTraits.ts:47`, `features.ts:486`; Y4 |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Swarm of Bats (`swarm-of-bats`): CR 1/4, Large, 5 ft, uçma 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; başka yaratığın altıgeninde duramaz ✗ (iki yolda da); geçici HP engeli yok ✗ (biçime girince geçici HP = druid seviyesi ⚠); "Tiny açıklıktan geçme" ızgarada karşılıksız | kısmi | var: biçim Wild Shape geçici HP'si alır | `monsterAbilities.ts:121,127`, `movement.ts:459`, `reduce.ts:1030`; Y6, Y7 |
| Bites | eylem | sürü Bloodied iken 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Swarm of Ravens (`swarm-of-ravens`): CR 1/4, Medium, 10 ft, uçma 50, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; başka yaratığın altıgeninde duramaz ✗ (iki yolda da); geçici HP engeli yok ✗ (biçime girince geçici HP = druid seviyesi ⚠); "Tiny açıklıktan geçme" ızgarada karşılıksız | kısmi | var: biçim Wild Shape geçici HP'si alır | `monsterAbilities.ts:121,127`, `movement.ts:459`, `reduce.ts:1030`; Y6, Y7 |
| Beaks | eylem | sürü Bloodied iken 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |
| Cacophony (Recharge 6) | eylem | WIS DC 10, Deafened tur başına dek ✓; "Deafened iken yetenek kontrolü ve saldırı dezavantajlı" yok (iki yolda da) | kısmi | — | `attack-riders.json` `swarm-of-ravens:Cacophony`; `shapeMonster.ts:81`; Y10 |

#### Giant Wasp (`giant-wasp`): CR 1/2, Medium, 10 ft, uçma 50, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Flyby | özellik | uçarken fırsat saldırısı yok (uçan biçim hep havada sayılır) | tam | — | `monsterTraits.ts:47`, `features.ts:486`; Y4 |
| Sting | eylem | ek 2d4 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Swarm of Insects (`swarm-of-insects`): CR 1/2, Medium, 20 ft, uçma 20, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; başka yaratığın altıgeninde duramaz ✗ (iki yolda da); geçici HP engeli yok ✗ (biçime girince geçici HP = druid seviyesi ⚠); "Tiny açıklıktan geçme" ızgarada karşılıksız | kısmi | var: biçim Wild Shape geçici HP'si alır | `monsterAbilities.ts:121,127`, `movement.ts:459`, `reduce.ts:1030`; Y6, Y7 |
| Bites | eylem | sürü Bloodied iken 1d4+1 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Brown Bear (`brown-bear`): CR 1, Large, 40 ft, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Multiattack | eylem | iki saldırı ✓; "bir Bite + bir Claw" bileşimi zorlanmaz — bilinen (önceki denetim A35) | kısmi | bilinen (bileşim) | `druid.ts:81`, `shapeMonster.ts:82` |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Claw | eylem | Prone (≤ L) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Dire Wolf (`dire-wolf`): CR 1, Large, 50 ft, AC 14

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Bite | eylem | Prone (≤ L) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Hyena (`giant-hyena`): CR 1, Large, 50 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Rampage (1/Day) | bonus eylem | Bite biçimde silah seçeneği; yetenek saldırıyı canavar saldırıları içinde arıyor, bulamıyor; arayüzdeki Yetenek düğmesi (G4) motorun gerekçesiyle kapalı kalır | yok | var: düşman hyena'da çalışır, biçimde "kullanılamaz" | `boss.ts:286` (`mover.attacks`), `monsterAbilities.ts:212–213`; Y11 |

#### Giant Octopus (`giant-octopus`): CR 1, Large, 10 ft, yüzme 60, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Tentacles | eylem | Grappled (kaçış DC 13) + Restrained | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Ink Cloud (1/Day) | tepki | su altında, 5 ft'te tur biten yaratığa: yoğun örtü küpü + yüzme hızıyla uzaklaşma (Giant Octopus: hasar alınca, 10 ft) | tam | — | `shapeMonster.ts:76`; `k19reactions.test.ts:115`; Y14 |

#### Giant Spider (`giant-spider`): CR 1, Large, 30 ft, tırmanma, AC 14

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Web Walker | özellik | ağ alanından etkilenmez | tam | — | `monsterTraits.ts:49`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | ek 2d6 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Web (Recharge 5–6) | eylem | DEX DC 13, Restrained (ağ AC 10, HP 5, ateşe zayıf) | tam | — | `shapeMonster.ts:81`, `mapView.ts:181–186`; Y10, Y16 |

#### Giant Toad (`giant-toad`): CR 1, Large, 30 ft, yüzme 30, AC 11

Ayrıca SRD dışı bonus yetenek Leap (20 ft sıçrama; kullanıcı kararı, DECISIONS.md) var; SRD girdisi olmadığı için sayılmadı.

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Standing Leap | özellik | uzun atlama mesafesi ✓ (Jump büyüsü modeliyle: turda bir, 10 ft harcar); yüksek atlama yok ✗ | kısmi | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | ek 2d4 poison; Grappled (kaçış DC 12) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Swallow | eylem | bilinen (önceki denetim: Total Cover, yutarken Bite, YZ, yutan ölünce Prone, `grapple` alanı); arayüzde Yetenek düğmesi var (G4) | kısmi | — | `monsterAbilities.ts:82–86`; önceki denetim |

#### Lion (`lion`): CR 1, Large, 50 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Running Leap | özellik | 25 ft uzun atlama, ama 10 ft koşu şartı aranmaz (durarak da 25 ft); turda bir, 10 ft harcar | kısmi | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Multiattack | eylem | iki Rend ✓; "bir saldırının yerine Roar" yok (Roar ayrı eylem) — bilinen (önceki denetim A35) | kısmi | bilinen (bileşim) | `druid.ts:81`, `shapeMonster.ts:82` |
| Rend | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Roar | eylem | WIS DC 11, Frightened tur başına dek | tam | — | `shapeMonster.ts:81`, `mapView.ts:181–186`; Y10, Y16 |

#### Swarm of Piranhas (`swarm-of-piranhas`): CR 1, Medium, 5 ft, yüzme 40, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; başka yaratığın altıgeninde duramaz ✗ (iki yolda da); geçici HP engeli yok ✗ (biçime girince geçici HP = druid seviyesi ⚠); "Tiny açıklıktan geçme" ızgarada karşılıksız | kısmi | var: biçim Wild Shape geçici HP'si alır | `monsterAbilities.ts:121,127`, `movement.ts:459`, `reduce.ts:1030`; Y6, Y7 |
| Water Breathing | özellik | su altında soluma ✓; "yalnız su altında" kısmı yok: karada boğulma işlemez (iki yolda da) | kısmi | — | `underwaterCore.ts:51–65` |
| Bites | eylem | sürü Bloodied iken 1d4+3 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Tiger (`tiger`): CR 1, Large, 40 ft, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Rend | eylem | Prone (≤ L) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Nimble Escape | bonus eylem | bonus eylemle Disengage ya da Hide | tam | — | `shapeMonster.ts:78`; Y5 |

## Girdi bazında özet

| Girdi | Tür | Biçim | Tam | Kısmi | Yok | Savaş dışı |
|---|---|---|---|---|---|---|
| Bite | eylem | 34 | 25 | 9 |  |  |
| Pack Tactics | özellik | 9 | 9 |  |  |  |
| Water Breathing | özellik | 7 |  | 7 |  |  |
| Spider Climb | özellik | 6 | 6 |  |  |  |
| Amphibious | özellik | 5 | 5 |  |  |  |
| Hooves | eylem | 5 | 5 |  |  |  |
| Ram | eylem | 5 | 4 | 1 |  |  |
| Swarm | özellik | 5 |  | 5 |  |  |
| Bites | eylem | 4 | 4 |  |  |  |
| Multiattack | eylem | 4 | 2 | 2 |  |  |
| Rend | eylem | 4 | 4 |  |  |  |
| Beak | eylem | 3 | 2 | 1 |  |  |
| Claw | eylem | 3 | 2 | 1 |  |  |
| Flyby | özellik | 3 | 3 |  |  |  |
| Standing Leap | özellik | 3 |  | 3 |  |  |
| Talons | eylem | 3 | 1 | 2 |  |  |
| Agile | özellik | 2 | 2 |  |  |  |
| Ink Cloud | tepki | 2 | 2 |  |  |  |
| Nimble Escape | bonus eylem | 2 | 2 |  |  |  |
| Sting | eylem | 2 | 1 | 1 |  |  |
| Swallow | eylem | 2 |  | 2 |  |  |
| Tentacles | eylem | 2 | 1 | 1 |  |  |
| Web Walker | özellik | 2 | 2 |  |  |  |
| Beaks | eylem | 1 | 1 |  |  |  |
| Beast of Burden | özellik | 1 |  |  |  | 1 |
| Bloodied Fury | özellik | 1 | 1 |  |  |  |
| Bubble Dash | eylem | 1 |  | 1 |  |  |
| Bubble Dash | bonus eylem | 1 |  | 1 |  |  |
| Cacophony | eylem | 1 |  | 1 |  |  |
| Compression | özellik | 1 |  |  |  | 1 |
| Constrict | eylem | 1 | 1 |  |  |  |
| Fist | eylem | 1 | 1 |  |  |  |
| Gore | eylem | 1 | 1 |  |  |  |
| Hold Breath | özellik | 1 | 1 |  |  |  |
| Illumination | özellik | 1 |  | 1 |  |  |
| Jumper | özellik | 1 |  | 1 |  |  |
| Mimicry | özellik | 1 |  |  |  | 1 |
| Rampage | bonus eylem | 1 |  |  | 1 |  |
| Roar | eylem | 1 | 1 |  |  |  |
| Rock | eylem | 1 | 1 |  |  |  |
| Running Leap | özellik | 1 |  | 1 |  |  |
| Scratch | eylem | 1 |  | 1 |  |  |
| Web | eylem | 1 | 1 |  |  |  |

## En çok eksik özellik

Bir kök nedeni düzeltmek kaç biçimi kapatır (savaşta etkili, tam olmayan; çok biçimden aza).

| # | Kök neden | Biçim | Biçimler | Not |
|---|---|---|---|---|
| 1 | G1 STR skoru biçimden alınmıyor (atlama, taşıma/sürükleme) | 69 | bütün biçimler | yeni |
| 2 | Sabit hasar ("1" → 1d2) | 17 | badger, bat, cat, crab, frog, giant-fire-beetle, goat, hawk, lizard, octopus, owl, piranha, rat, raven, scorpion, spider, weasel | bilinen (CLAUDE.md) |
| 3 | Water Breathing: karada boğulma yok | 7 | giant-octopus, giant-seahorse, octopus, piranha, reef-shark, seahorse, swarm-of-piranhas | yeni |
| 4 | Swarm: altıgen paylaşımı ve geçici HP | 5 | swarm-of-bats, swarm-of-insects, swarm-of-piranhas, swarm-of-rats, swarm-of-ravens | yeni |
| 5 | Atlama özellikleri Jump büyüsü modeliyle (koşu şartı, yüksek atlama, DEX) | 5 | cat, frog, giant-frog, giant-toad, lion | yeni |
| 6 | Multiattack bileşimi | 2 | lion, brown-bear | bilinen |
| 7 | Swallow | 2 | giant-frog, giant-toad | bilinen |
| 8 | Bubble Dash: tur boyu Disengage, Giant Seahorse'ta tam hız | 2 | seahorse, giant-seahorse | yeni |
| 9 | Rampage biçimde çalışmıyor | 1 | giant-hyena | yeni (iki yol farkı) |
| 10 | Illumination: loş ışık yok, parlak 30 ft | 1 | giant-fire-beetle | yeni |
| 11 | Cacophony: Deafened'ın ek dezavantajları | 1 | swarm-of-ravens | yeni |

## Düzeltme önerileri

Karar kullanıcıda; bu belge hiçbirini uygulamadı.

| # | Öneri | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|
| 1 | G1: `shape_changed` `stats`'a `strScore`/`dexScore` (ve geri dönüşte `prev`); `jumpRangeFeet`, `capacityOf`, `dragLimitOf` biçimin skorunu okur. Aynı olay Polymorph'ta da kullanıldığı için Polymorph da düzelir | orta: 69 biçim; koşulu uzun atlama (ör. Brown Bear biçiminde 8 → 19 ft), yakalananı/nesneyi sürükleme | gerekir (atlama ve sürükleme sonucu değişir) | küçük: olay alanı + reducer + test |
| 2 | Rampage: `k19Legendary` `strike` saldırıyı biçimde silah seçeneğinde de arasın (`weaponOptions[].beast.attack`), ya da Wild Shape'te yetenek saldırısı canavar saldırısı olarak da tutulsun | düşük: 1 biçim (Giant Hyena, 8. sv) | gerekir (YZ biçimde Rampage'i deneyebilir; sim imzası) | küçük |
| 3 | Swarm: Wild Shape geçici HP'si sürü biçimine verilmesin (⚠ yorum: biçime girişte özellik önce mi, geçici HP önce mi; kullanıcı kararı) | düşük–orta: 5 biçim; sürü 4–8. sv'de druid seviyesi kadar fazladan can alıyor | gerekir | küçük: `wildShapeEvents` geçici HP'yi `noHeal` + sürü işaretine bağla |
| 4 | Swarm: başka yaratığın altıgeninde durma (iki yolda da) | düşük: 5 biçim + 5 düşman sürü | gerekir | orta–büyük: doluluk modeli (`occupantAt`) iki yaratığa izin vermeli; çok yerde denetim |
| 5 | Sabit hasar: "1 hasar" sabit 1 olsun (1d2 yerine) | düşük: 17 biçim + 21 canavar; hasar ortalaması 1,5 → 1 | gerekir | orta: saldırı hasar ayrıştırması sabit değer desteği (bilinen madde) |
| 6 | Atlama özellikleri Jump büyüsü modelinden ayrılsın: Running Leap koşu şartı, Standing Leap yüksek atlama, Jumper DEX skoruyla (G1'e bağlı) | düşük: 5 biçim (+ aynı veriyle düşmanlar) | gerekir | orta |
| 7 | Water Breathing "yalnız su altında": karada nefes sınırı | çok düşük: 7 biçim (karada hızları 5–10 ft) | gerekir | orta: su altı nefes modelinin tersi |
| 8 | Bubble Dash: Disengage yerine yalnız bu hareket fırsat saldırısız (`fullMoveNoOA`/`halfMove` gibi), Giant Seahorse yarım yüzme hızı | çok düşük: 2 biçim | gerekir | küçük: `data/canavar-yetenekleri.json` iki kayıt |
| 9 | Illumination: 10 ft parlak + 10 ft loş (`light` 2, `lightDim` 2) | çok düşük: 1 biçim + düşman Giant Fire Beetle | gerekir (ışık seviyesi; gece haritası) | küçük: `monsterTraits.ts:46` |
| 10 | Cacophony: Deafened sürerken yetenek kontrolü ve saldırı dezavantajı (ek etki) | çok düşük: 1 biçim + düşman | gerekir | küçük: `attack-riders.json` ya da A2 eki |
| — | Bilinenler (Multiattack bileşimi, Swallow, `multiHex` sığma) | — | — | önceki belgedeki öneriler; arayüz yetenek düğmesi 51f0b8cb ile kapandı |

## Yoklama kayıtları

Hepsi geçici testte, druid 20. seviye (Circle of the Land), hedef X (AC 10). Kural sürümü 91.

| # | Senaryo | Sonuç |
|---|---|---|
| Y0 | 69 biçim: biçimdeki druid ile düşman canavarın 20 alanı | tek fark Multiattack (Ape, Lion, Black Bear, Brown Bear: düşman planla, biçim `attacksPerAction` 2); dirençlerde druidin kendi direnci de var (WS91 ⚠, bilinen) |
| Y1 | Wolf biçimi, X'in yanında dost | saldırı avantajlı ("Pack Tactics") |
| Y2 | Boar biçimi, can yarının altında | saldırı avantajlı ("Bloodied Fury") |
| Y3 | Deer biçimi düşmanın erişiminden çıkar; karşılaştırma Wolf | Deer: fırsat saldırısı yok; Wolf: var |
| Y4 | Owl biçimi yerde ve 10 ft irtifada erişimden çıkar | iki durumda da fırsat saldırısı yok (uçan biçim hep havada sayılır) |
| Y5 | Panther biçimi bonus Disengage / bonus Hide; karşılaştırma Wolf | Panther ikisi de tamam; Wolf "Disengage bonus eylemle yapılamaz" |
| Y6 | Swarm of Rats biçimine giriş; X'in altıgeninden geçme ve durma; düşman sürü druidin altıgeninde durma | 20 geçici HP aldı; geçti; durma red ("dolu"); düşman sürü de duramadı |
| Y7 | `healed` olayı (30 → 40) sürü ve kurt biçiminde | sürü 30 kaldı, kurt 40 |
| Y8 | Swarm of Rats Bites, biçim ve düşman Bloodied iken (kritiksiz) | ikisinde de 1d4 (dolu canda 2d4) |
| Y9 | Elk 25 ft düz koşup Ram; biçim ve düşman | ikisinde de ek 1d6 + Prone |
| Y10 | Biçimde canavar saldırısı: Lion Roar, Swarm of Ravens Cacophony, Constrictor Constrict, Ape Rock, Giant Spider Web | Frightened, Deafened, 3d4 + Grappled, menzilli (yanında düşmanla dezavantajlı), Restrained |
| Y11 | Giant Hyena Bloodied X'e Bite isabeti sonrası Rampage; aynısı düşman Hyena | biçim: "Kudurma şu an kullanılamaz"; düşman: yarım hız + Bite yaptı |
| Y12 | Giant Fire Beetle, gece varyantlı harita (Buzul Tapınağı), biçim ve düşman | çevresinde 6 altıgen (30 ft) parlak, loş 0 |
| Y13 | Lion, Cat, Frog, Giant Frog biçiminde atlama | jumpFt 25/15/10/20; durarak 20 ft (4 altıgen) boşluk atlandı, maliyet 2 altıgen; yüksek atlama erişimi 0; STR 8 (druid), Lion'un 17'si değil |
| Y14 | Octopus biçimi derin suda, X 5 ft'te turunu bitirir | `reaction_used` + `zone_created` (Ink Cloud) |
| Y15 | Seahorse (eylem) ve Giant Seahorse (bonus) Bubble Dash, derin suda | ikisinde de Dash + Disengage |
| Y16 | 75 saldırı × iki yol, aynı zarla, hedefin save'leri −10 | hepsi aynı; tek görünen fark Giant Centipede Poisoned: hedef druid Nature's Ward ile Poisoned'a bağışık (yöntem kaynaklı, gerçek fark değil) |
| Y17 | Zehir ve yakalama ekleri biçimde (16 saldırı) | ek poison hasarları, Grappled (DC'ler SRD'deki gibi), Giant Centipede Poisoned tur başına dek |
| Y18 | Lion biçimi `strScore` | 8 (druidin); düşman Lion 17 |
