# Wild Shape biçimleri denetimi (SRD 5.2.1)

Yalnız denetim: kod, veri, test ve DECISIONS.md değişmedi. Tarih 2026-11-20, kural sürümü 91 (güncel). Genel Wild Shape kuralları [WILD-SHAPE-DENETIM.md](WILD-SHAPE-DENETIM.md)'de; burada biçim biçim stat bloğu.

## Özet

**WS92 güncellemesi (kural sürümü 92, 2026-11-20):** savaşta etkili 134 girdinin **129'u tam, 5'i kısmi** (yalnız Swarm: başka yaratığın altıgeninde durma ertelendi, karar gerekli; geçici HP kullanıcı kararıyla korunur), yok 0. Düzelenler: STR/DEX skoru biçimden (G1, 69 biçim), sabit 1 hasar (17 biçim), Water Breathing karada nefes (7), atlama özellikleri (5), Multiattack bileşimi (Brown Bear, Lion), Swallow (2), Bubble Dash (2), Rampage, Illumination, Cacophony. Ayrıntı DECISIONS WS92; yoklama tablosu belgenin sonunda ("WS92 son yoklama").

**SWARM95 güncellemesi (kural sürümü 95, 2026-11-20):** Swarm (5 biçim) kısmi → tam: başka yaratığın altıgeninde durma ve karşılıklısı, kapı aralığından geçme (SRD Swarm; Gaseous Form altyapısı). Savaşta etkili 134 girdinin **134'ü tam**, kısmi 0. Ayrıntı DECISIONS SWARM95.

Aşağıdaki ilk özet denetim anındaki (kural sürümü 91) durumdur; tablolar WS92'ye göre güncellendi.

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
| G1 | **STR (ve DEX) skoru** | WS92 (92+): `strScore`/`dexScore` biçimden (`shape_changed` `scores`), taşıma kapasitesi biçimin STR × 15 × boyut; atlama, sürükleme, taşıma biçimin skoruyla; Polymorph da | tam | var: düşman canavar kendi STR'siyle | `reduce.ts:944` (`shape_changed` `strScore` yazmıyor), `movement.ts:664–667`, `nesneAgirlik.ts:36,38`; Y13, Y18 |
| G2 | Saldırılar | saldırı zarlı olanlar silah seçeneği (biçimin to-hit ve hasarı), save'li/şarjlı olanlar canavar saldırısı; ikisi de arayüzde seçilebiliyor | tam | yok (Y16) | `druid.ts:76–81`, `shapeMonster.ts:81`, `mapView.ts:181–186` |
| G3 | Multiattack | WS92: bileşim (Brown Bear Bite + Claw, Lion Roar yerine) `data/ws92.json` `bilesim` | tam | düşman planla (`data/multiattack.json`) | önceki denetim A35 |
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
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Cat (`cat`): CR 0, Tiny, 40 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Jumper | özellik | WS92: mesafe DEX skoruyla (koşarak 15, durarak 7 ft) | tam | — | `monsterAbilities.ts:117`; Y13 |
| Scratch | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Crab (`crab`): CR 0, Tiny, 20 ft, yüzme 20, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Claw | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Deer (`deer`): CR 0, Medium, 50 ft, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Agile | özellik | erişimden çıkarken fırsat saldırısı yok | tam | — | `features.ts:488`; Y3 |
| Ram | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Frog (`frog`): CR 0, Tiny, 20 ft, yüzme 20, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Amphibious | özellik | su altında soluma | tam | — | `underwaterCore.ts:51–65` |
| Standing Leap | özellik | WS92: koşusuz da uzun atlama (Frog 10, Giant Frog/Toad 20 ft) ve yerinde yüksek atlama erişimi (5/10 ft); Jump büyüsü modeli değil | tam | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Giant Fire Beetle (`giant-fire-beetle`): CR 0, Small, 30 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Illumination | özellik | WS92: 10 ft parlak + 10 ft loş (iki yolda da; `data/ws92.json`) | tam | — | `monsterTraits.ts:46` (`fx.light = 6`); Y12 |
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Goat (`goat`): CR 0, Medium, 40 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Ram | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1); hücumda 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

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
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Octopus (`octopus`): CR 0, Small, 5 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Compression | özellik | 1 inçlik aralıktan geçme; altıgen ızgarada karşılığı yok | savaş dışı | — | — |
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Tentacles | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Ink Cloud (1/Day) | tepki | su altında, 5 ft'te tur biten yaratığa: yoğun örtü küpü + yüzme hızıyla uzaklaşma (Giant Octopus: hasar alınca, 10 ft) | tam | — | `shapeMonster.ts:76`; `k19reactions.test.ts:115`; Y14 |

#### Piranha (`piranha`): CR 0, Tiny, 5 ft, yüzme 40, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Rat (`rat`): CR 0, Tiny, 20 ft, tırmanma, AC 10

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Agile | özellik | erişimden çıkarken fırsat saldırısı yok | tam | — | `features.ts:488`; Y3 |
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Scorpion (`scorpion`): CR 0, Tiny, 10 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Sting | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1); ek 1d6 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Seahorse (`seahorse`): CR 0, Tiny, 5 ft, yüzme 20, AC 12

Saldırısı yok; biçimde genel Vuruş (G5).

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Bubble Dash | eylem | WS92: su altında yüzme hızı kadar fırsat saldırısız hareket (yalnız bu hareket; turun hareketinden düşmez; hedef altıgen ya da düşmanlardan uzağa) | tam | — | `canavar-yetenekleri.json` `seahorse`; `monsterAbilities.ts:281`; Y15 |

#### Spider (`spider`): CR 0, Tiny, 20 ft, tırmanma, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Web Walker | özellik | ağ alanından etkilenmez | tam | — | `monsterTraits.ts:49`; `shape91.test.ts` (Giant Spider) |
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1); ek 1d4 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Weasel (`weasel`): CR 0, Tiny, 30 ft, tırmanma, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

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
| Standing Leap | özellik | WS92: koşusuz da uzun atlama (Frog 10, Giant Frog/Toad 20 ft) ve yerinde yüksek atlama erişimi (5/10 ft); Jump büyüsü modeli değil | tam | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | Grappled (kaçış DC 11) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Swallow | eylem | WS92 (sürüm 92): yutulan midede (konum yutanınki, Total Cover, yakalama biter), yutan Bite kullanamaz, ceset çıkışı 5 ft + Prone, kusulunca bitişikte Prone, biçim bitince bırakılır; YZ seçer; arayüzde Yetenek düğmesi (G4) | tam | — | `swallow92.ts`, `monsterAbilities.ts` `swallowEvents`; `ws92.test.ts` |

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
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; **SWARM95 (sürüm 95): başka yaratığın altıgeninde durur ve başkası sürünün altıgeninde durur ✓** (yürüme, uçuş, atlama inişi; iki yolda da: düşman sürü ve Wild Shape/Polymorph biçimi), kapı aralığından (Tiny açıklık) geçer ✓ (Gaseous Form `shareSpace`/`squeeze`); biçime girince geçici HP = druid seviyesi (kullanıcı kararı WS92: korunur) | tam | biçim Wild Shape geçici HP'si alır (kullanıcı kararı) | `monsterAbilities.ts` (`swarm`), `swarmShare.ts`, `movement.ts` `blockingOccupant`; `swarm95.test.ts`; Y6, Y7 |
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
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Ram | eylem | hücumda 2d8+2 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Bubble Dash | bonus eylem | WS92: yüzme hızının yarısı kadar fırsat saldırısız hareket (yalnız bu hareket) | tam | — | `canavar-yetenekleri.json` `giant-seahorse`; `monsterAbilities.ts:281`; Y15 |

#### Reef Shark (`reef-shark`): CR 1/2, Medium, 5 ft, yüzme 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Bite | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Warhorse (`warhorse`): CR 1/2, Large, 60 ft, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Hooves | eylem | hücum 20 ft: ek 2d4 bludgeoning, Prone | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

### 8. seviyeden açılanlar (22)

#### Bat (`bat`): CR 0, Tiny, 5 ft, uçma 30, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Bite | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Eagle (`eagle`): CR 0, Small, 10 ft, uçma 60, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Talons | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Hawk (`hawk`): CR 0, Tiny, 10 ft, uçma 60, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Talons | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Owl (`owl`): CR 0, Tiny, 5 ft, uçma 60, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Flyby | özellik | uçarken fırsat saldırısı yok (uçan biçim hep havada sayılır) | tam | — | `monsterTraits.ts:47`, `features.ts:486`; Y4 |
| Talons | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

#### Raven (`raven`): CR 0, Tiny, 10 ft, uçma 50, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Mimicry | özellik | ses taklidi | savaş dışı | — | — |
| Beak | eylem | WS92: sabit 1 hasar (SRD "Hit: 1"; düşmanda srdK19 zaten 1) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |

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
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; **SWARM95 (sürüm 95): başka yaratığın altıgeninde durur ve başkası sürünün altıgeninde durur ✓** (yürüme, uçuş, atlama inişi; iki yolda da: düşman sürü ve Wild Shape/Polymorph biçimi), kapı aralığından (Tiny açıklık) geçer ✓ (Gaseous Form `shareSpace`/`squeeze`); biçime girince geçici HP = druid seviyesi (kullanıcı kararı WS92: korunur) | tam | biçim Wild Shape geçici HP'si alır (kullanıcı kararı) | `monsterAbilities.ts` (`swarm`), `swarmShare.ts`, `movement.ts` `blockingOccupant`; `swarm95.test.ts`; Y6, Y7 |
| Bites | eylem | sürü Bloodied iken 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Swarm of Ravens (`swarm-of-ravens`): CR 1/4, Medium, 10 ft, uçma 50, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; **SWARM95 (sürüm 95): başka yaratığın altıgeninde durur ve başkası sürünün altıgeninde durur ✓** (yürüme, uçuş, atlama inişi; iki yolda da: düşman sürü ve Wild Shape/Polymorph biçimi), kapı aralığından (Tiny açıklık) geçer ✓ (Gaseous Form `shareSpace`/`squeeze`); biçime girince geçici HP = druid seviyesi (kullanıcı kararı WS92: korunur) | tam | biçim Wild Shape geçici HP'si alır (kullanıcı kararı) | `monsterAbilities.ts` (`swarm`), `swarmShare.ts`, `movement.ts` `blockingOccupant`; `swarm95.test.ts`; Y6, Y7 |
| Beaks | eylem | sürü Bloodied iken 1d4 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |
| Cacophony (Recharge 6) | eylem | WIS DC 10, Deafened tur başına dek; WS92: Deafened süresince saldırı ve yetenek kontrolü dezavantajlı (A2 eki, iki yolda da) | tam | — | `attack-riders.json` `swarm-of-ravens:Cacophony`; `shapeMonster.ts:81`; Y10 |

#### Giant Wasp (`giant-wasp`): CR 1/2, Medium, 10 ft, uçma 50, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Flyby | özellik | uçarken fırsat saldırısı yok (uçan biçim hep havada sayılır) | tam | — | `monsterTraits.ts:47`, `features.ts:486`; Y4 |
| Sting | eylem | ek 2d4 poison | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |

#### Swarm of Insects (`swarm-of-insects`): CR 1/2, Medium, 20 ft, uçma 20, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Spider Climb | özellik | tırmanma (duvar/tavan) | tam | — | `monsterTraits.ts:37`; `shape91.test.ts` (Giant Spider) |
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; **SWARM95 (sürüm 95): başka yaratığın altıgeninde durur ve başkası sürünün altıgeninde durur ✓** (yürüme, uçuş, atlama inişi; iki yolda da: düşman sürü ve Wild Shape/Polymorph biçimi), kapı aralığından (Tiny açıklık) geçer ✓ (Gaseous Form `shareSpace`/`squeeze`); biçime girince geçici HP = druid seviyesi (kullanıcı kararı WS92: korunur) | tam | biçim Wild Shape geçici HP'si alır (kullanıcı kararı) | `monsterAbilities.ts` (`swarm`), `swarmShare.ts`, `movement.ts` `blockingOccupant`; `swarm95.test.ts`; Y6, Y7 |
| Bites | eylem | sürü Bloodied iken 1d4+1 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Brown Bear (`brown-bear`): CR 1, Large, 40 ft, tırmanma, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Multiattack | eylem | WS92: bir Bite + bir Claw (eylem başına sayaç `economy.beastUsed`) | tam | — | `druid.ts:81`, `shapeMonster.ts:82` |
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
| Rampage (1/Day) | bonus eylem | WS92: biçimde Bite silah seçeneğinden (yarım hız + Bite) | tam | — | `boss.ts:286` (`mover.attacks`), `monsterAbilities.ts:212–213`; Y11 |

#### Giant Octopus (`giant-octopus`): CR 1, Large, 10 ft, yüzme 60, AC 11

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
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
| Standing Leap | özellik | WS92: koşusuz da uzun atlama (Frog 10, Giant Frog/Toad 20 ft) ve yerinde yüksek atlama erişimi (5/10 ft); Jump büyüsü modeli değil | tam | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Bite | eylem | ek 2d4 poison; Grappled (kaçış DC 12) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y17, Y16 |
| Swallow | eylem | WS92 (sürüm 92): yutulan midede (konum yutanınki, Total Cover, yakalama biter), yutan Bite kullanamaz, ceset çıkışı 5 ft + Prone, kusulunca bitişikte Prone, biçim bitince bırakılır; YZ seçer; arayüzde Yetenek düğmesi (G4) | tam | — | `swallow92.ts`, `monsterAbilities.ts` `swallowEvents`; `ws92.test.ts` |

#### Lion (`lion`): CR 1, Large, 50 ft, AC 12

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Pack Tactics | özellik | bitişik dost varken saldırı avantajlı | tam | — | `shapeMonster.ts:68`, `features.ts:243`; Y1 |
| Running Leap | özellik | WS92: koşarak 25 ft uzun atlama (doğal atlama kuralı); durarak STR/2 | tam | — | `monsterAbilities.ts:117`, `movement.ts:703`; Y13 |
| Multiattack | eylem | WS92: iki Rend; bir Rend'in yerine Roar aynı Attack eyleminde | tam | — | `druid.ts:81`, `shapeMonster.ts:82` |
| Rend | eylem | saldırı ve hasar stat bloğundan | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Roar | eylem | WIS DC 11, Frightened tur başına dek | tam | — | `shapeMonster.ts:81`, `mapView.ts:181–186`; Y10, Y16 |

#### Swarm of Piranhas (`swarm-of-piranhas`): CR 1, Medium, 5 ft, yüzme 40, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Swarm | özellik | iyileşme engelli ✓, yaratık altıgeninden geçer ✓; **SWARM95 (sürüm 95): başka yaratığın altıgeninde durur ve başkası sürünün altıgeninde durur ✓** (yürüme, uçuş, atlama inişi; iki yolda da: düşman sürü ve Wild Shape/Polymorph biçimi), kapı aralığından (Tiny açıklık) geçer ✓ (Gaseous Form `shareSpace`/`squeeze`); biçime girince geçici HP = druid seviyesi (kullanıcı kararı WS92: korunur) | tam | biçim Wild Shape geçici HP'si alır (kullanıcı kararı) | `monsterAbilities.ts` (`swarm`), `swarmShare.ts`, `movement.ts` `blockingOccupant`; `swarm95.test.ts`; Y6, Y7 |
| Water Breathing | özellik | su altında soluma; WS92: sudan dışarıda nefes tutar (1 + CON dakika, sonra tur başına Exhaustion; iki yolda da) | tam | — | `underwaterCore.ts:51–65` |
| Bites | eylem | sürü Bloodied iken 1d4+3 | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y8, Y16 |

#### Tiger (`tiger`): CR 1, Large, 40 ft, AC 13

| Girdi | Tür | Biçimde | Durum | Fark (düşman/biçim) | Kanıt |
|---|---|---|---|---|---|
| Rend | eylem | Prone (≤ L) | tam | — | `druid.ts:76–81`, `features.ts:268–269,306,400`; Y16 |
| Nimble Escape | bonus eylem | bonus eylemle Disengage ya da Hide | tam | — | `shapeMonster.ts:78`; Y5 |

## Girdi bazında özet

WS92 (kural sürümü 92) sonrası yeniden sayıldı.

| Girdi | Tür | Biçim | Tam | Kısmi | Yok | Savaş dışı |
|---|---|---|---|---|---|---|
| Bite | eylem | 34 | 34 |  |  |  |
| Pack Tactics | özellik | 9 | 9 |  |  |  |
| Water Breathing | özellik | 7 | 7 |  |  |  |
| Spider Climb | özellik | 6 | 6 |  |  |  |
| Amphibious | özellik | 5 | 5 |  |  |  |
| Hooves | eylem | 5 | 5 |  |  |  |
| Ram | eylem | 5 | 5 |  |  |  |
| Swarm | özellik | 5 | 5 |  |  |  |
| Bites | eylem | 4 | 4 |  |  |  |
| Multiattack | eylem | 4 | 4 |  |  |  |
| Rend | eylem | 4 | 4 |  |  |  |
| Beak | eylem | 3 | 3 |  |  |  |
| Claw | eylem | 3 | 3 |  |  |  |
| Flyby | özellik | 3 | 3 |  |  |  |
| Standing Leap | özellik | 3 | 3 |  |  |  |
| Talons | eylem | 3 | 3 |  |  |  |
| Agile | özellik | 2 | 2 |  |  |  |
| Ink Cloud | tepki | 2 | 2 |  |  |  |
| Nimble Escape | bonus eylem | 2 | 2 |  |  |  |
| Sting | eylem | 2 | 2 |  |  |  |
| Swallow | eylem | 2 | 2 |  |  |  |
| Tentacles | eylem | 2 | 2 |  |  |  |
| Web Walker | özellik | 2 | 2 |  |  |  |
| Beaks | eylem | 1 | 1 |  |  |  |
| Beast of Burden | özellik | 1 |  |  |  | 1 |
| Bloodied Fury | özellik | 1 | 1 |  |  |  |
| Bubble Dash | eylem | 1 | 1 |  |  |  |
| Bubble Dash | bonus eylem | 1 | 1 |  |  |  |
| Cacophony | eylem | 1 | 1 |  |  |  |
| Compression | özellik | 1 |  |  |  | 1 |
| Constrict | eylem | 1 | 1 |  |  |  |
| Fist | eylem | 1 | 1 |  |  |  |
| Gore | eylem | 1 | 1 |  |  |  |
| Hold Breath | özellik | 1 | 1 |  |  |  |
| Illumination | özellik | 1 | 1 |  |  |  |
| Jumper | özellik | 1 | 1 |  |  |  |
| Mimicry | özellik | 1 |  |  |  | 1 |
| Rampage | bonus eylem | 1 | 1 |  |  |  |
| Roar | eylem | 1 | 1 |  |  |  |
| Rock | eylem | 1 | 1 |  |  |  |
| Running Leap | özellik | 1 | 1 |  |  |  |
| Scratch | eylem | 1 | 1 |  |  |  |
| Web | eylem | 1 | 1 |  |  |  |

## En çok eksik özellik

Bir kök nedeni düzeltmek kaç biçimi kapatır (savaşta etkili, tam olmayan; çok biçimden aza).

| # | Kök neden | Biçim | Biçimler | Not |
|---|---|---|---|---|
| 1 | G1 STR skoru biçimden alınmıyor (atlama, taşıma/sürükleme) | 69 | bütün biçimler | **düzeldi (WS92)** |
| 2 | Sabit hasar ("1" → 1d2): **düzeldi (WS92)** | 17 | badger, bat, cat, crab, frog, giant-fire-beetle, goat, hawk, lizard, octopus, owl, piranha, rat, raven, scorpion, spider, weasel | bilinen (CLAUDE.md) |
| 3 | Water Breathing: karada boğulma yok: **düzeldi (WS92)** | 7 | giant-octopus, giant-seahorse, octopus, piranha, reef-shark, seahorse, swarm-of-piranhas | yeni |
| 4 | Swarm: altıgen paylaşımı: **düzeldi (SWARM95, sürüm 95)**; geçici HP (kullanıcı kararı: korunur) | 5 | swarm-of-bats, swarm-of-insects, swarm-of-piranhas, swarm-of-rats, swarm-of-ravens | yeni |
| 5 | Atlama özellikleri Jump büyüsü modeliyle (koşu şartı, yüksek atlama, DEX): **düzeldi (WS92)** | 5 | cat, frog, giant-frog, giant-toad, lion | yeni |
| 6 | Multiattack bileşimi | 2 | lion, brown-bear | **düzeldi (WS92)** |
| 7 | Swallow | 2 | giant-frog, giant-toad | **düzeldi (WS92)** |
| 8 | Bubble Dash: tur boyu Disengage, Giant Seahorse'ta tam hız: **düzeldi (WS92)** | 2 | seahorse, giant-seahorse | yeni |
| 9 | Rampage biçimde çalışmıyor: **düzeldi (WS92)** | 1 | giant-hyena | yeni (iki yol farkı) |
| 10 | Illumination: loş ışık yok, parlak 30 ft: **düzeldi (WS92)** | 1 | giant-fire-beetle | yeni |
| 11 | Cacophony: Deafened'ın ek dezavantajları: **düzeldi (WS92)** | 1 | swarm-of-ravens | yeni |

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

## WS92 son yoklama (kural sürümü 92, 2026-11-20)

Geçici test (`src/battle/zzWs92Yoklama.test.ts`, çalıştırıldı ve silindi): her biçim için 20. seviye Circle of the Land druidi (Elemental Fury: Potent Spellcasting, Primal Strike'ın ek zarı karşılaştırmayı bozmasın diye) biçime girdi; aynı canavar düşman olarak kuruldu. Karşılaştırılan alanlar: AC, hız, uçuş, yüzme, boyut, karanlık görüş, duyular, STR skoru, STR/DEX/CON değiştiricisi, uzun atlama (koşarak/durarak), taşıma kapasitesi, ışık (parlak/loş), düşmanın tepkileri ve canavar işaretleri (biçimde de var mı). Her saldırı iki yoldan aynı zarla (0,5) AC 5 ve kurtarmaları −10 olan hedefe atıldı; hedefin kaybettiği HP ve durumları karşılaştırıldı.

İlk çalıştırmada tek gerçek fark: düşman Cat'in Jumper'ı DEX skoru yerine STR skoruyla (canavar savaşçısında `dexScore` yok); düzeltildi (`movement.ts` `monsterDex`, stat bloğundan). Druidin kendi direnci, kurtarma/beceri yetkinliği, HP'si ve sınıf işaretleri bilinçli farktır (WS91, SRD s. 43), karşılaştırmaya alınmadı.

Biçim: 69. Alanlar ve saldırılar iki yolda aynı: 69. Saldırı: 75/75 aynı.

| Biçim | CR | Saldırı | Alan farkı (biçim ≠ düşman) | Saldırı farkı (hasar:durumlar) |
|---|---|---|---|---|
| Ape | 1/2 | 2 | aynı | aynı |
| Baboon | 0 | 1 | aynı | aynı |
| Badger | 0 | 1 | aynı | aynı |
| Bat | 0 | 1 | aynı | aynı |
| Black Bear | 1/2 | 1 | aynı | aynı |
| Blood Hawk | 1/8 | 1 | aynı | aynı |
| Boar | 1/4 | 1 | aynı | aynı |
| Brown Bear | 1 | 2 | aynı | aynı |
| Camel | 1/8 | 1 | aynı | aynı |
| Cat | 0 | 1 | aynı | aynı |
| Constrictor Snake | 1/4 | 2 | aynı | aynı |
| Crab | 0 | 1 | aynı | aynı |
| Crocodile | 1/2 | 1 | aynı | aynı |
| Deer | 0 | 1 | aynı | aynı |
| Dire Wolf | 1 | 1 | aynı | aynı |
| Draft Horse | 1/4 | 1 | aynı | aynı |
| Eagle | 0 | 1 | aynı | aynı |
| Elk | 1/4 | 1 | aynı | aynı |
| Frog | 0 | 1 | aynı | aynı |
| Giant Badger | 1/4 | 1 | aynı | aynı |
| Giant Bat | 1/4 | 1 | aynı | aynı |
| Giant Centipede | 1/4 | 1 | aynı | aynı |
| Giant Crab | 1/8 | 1 | aynı | aynı |
| Giant Fire Beetle | 0 | 1 | aynı | aynı |
| Giant Frog | 1/4 | 1 | aynı | aynı |
| Giant Goat | 1/2 | 1 | aynı | aynı |
| Giant Hyena | 1 | 1 | aynı | aynı |
| Giant Lizard | 1/4 | 1 | aynı | aynı |
| Giant Octopus | 1 | 1 | aynı | aynı |
| Giant Rat | 1/8 | 1 | aynı | aynı |
| Giant Seahorse | 1/2 | 1 | aynı | aynı |
| Giant Spider | 1 | 2 | aynı | aynı |
| Giant Toad | 1 | 1 | aynı | aynı |
| Giant Venomous Snake | 1/4 | 1 | aynı | aynı |
| Giant Wasp | 1/2 | 1 | aynı | aynı |
| Giant Weasel | 1/8 | 1 | aynı | aynı |
| Giant Wolf Spider | 1/4 | 1 | aynı | aynı |
| Goat | 0 | 1 | aynı | aynı |
| Hawk | 0 | 1 | aynı | aynı |
| Hyena | 0 | 1 | aynı | aynı |
| Jackal | 0 | 1 | aynı | aynı |
| Lion | 1 | 2 | aynı | aynı |
| Lizard | 0 | 1 | aynı | aynı |
| Mastiff | 1/8 | 1 | aynı | aynı |
| Mule | 1/8 | 1 | aynı | aynı |
| Octopus | 0 | 1 | aynı | aynı |
| Owl | 0 | 1 | aynı | aynı |
| Panther | 1/4 | 1 | aynı | aynı |
| Piranha | 0 | 1 | aynı | aynı |
| Pony | 1/8 | 1 | aynı | aynı |
| Pteranodon | 1/4 | 1 | aynı | aynı |
| Rat | 0 | 1 | aynı | aynı |
| Raven | 0 | 1 | aynı | aynı |
| Reef Shark | 1/2 | 1 | aynı | aynı |
| Riding Horse | 1/4 | 1 | aynı | aynı |
| Scorpion | 0 | 1 | aynı | aynı |
| Seahorse | 0 | 1 | aynı | aynı |
| Spider | 0 | 1 | aynı | aynı |
| Swarm of Bats | 1/4 | 1 | aynı | aynı |
| Swarm of Insects | 1/2 | 1 | aynı | aynı |
| Swarm of Piranhas | 1 | 1 | aynı | aynı |
| Swarm of Rats | 1/4 | 1 | aynı | aynı |
| Swarm of Ravens | 1/4 | 2 | aynı | aynı |
| Tiger | 1 | 1 | aynı | aynı |
| Venomous Snake | 1/8 | 1 | aynı | aynı |
| Vulture | 0 | 1 | aynı | aynı |
| Warhorse | 1/2 | 1 | aynı | aynı |
| Weasel | 0 | 1 | aynı | aynı |
| Wolf | 1/4 | 1 | aynı | aynı |
