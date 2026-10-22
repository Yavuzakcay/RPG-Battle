# Denge ölçümü (Adım 11, yeniden ölçüm)

5. seviye 5 kişilik parti (Bor, Mira, Tavi, Sela, Kael), her senaryo 200 savaş, tohum 1–200, iki taraf da yapay zekâ ile. Komut: `npm run sim -- 200`. Hedef: parti galibiyeti %60–80. Canavar sayıları ve değerleri değiştirilmedi.

## Eski ve yeni tablo

Eski: ilk ölçüm (29d06f0). Yeni: sınıf özellikleri (Sneak Attack, Action Surge, Second Wind, Hunter's Mark, konsantrasyon, kalıcı Spiritual Weapon ve Spirit Guardians, fırsat saldırısı) ve yeni masum kuralı ile.

**Taverna, yeni kazanma tanımı:** parti, düşmanlar yenilince kazanır. Masum ölümü sonucu etkilemez, yalnızca "kurtarılan masum" olarak sayılır. Eski taverna sayıları sıkı kuralla ölçüldü: masumların yarısı ölünce kaybediliyordu. Eski "parti arkasında" senaryosu artık varsayılan yerleşimdir: düşmandan en uzak.

| Senaryo | XP | Parti kazandı (eski → yeni) | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum (yeni) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 4850 | 3% → **25%** | 0% → 4% | 6.4 → 8.6 | 0.49 → 0.60 | 40% → 43% | 4.42 → 3.48 | – |
| Çöl — Gündüz | 4400 | 43% → **61%** | 1% → 1% | 11.1 → 9.8 | 0.50 → 0.45 | 40% → 32% | 2.79 → 1.95 | – |
| Volkan | 4400 | 99% → **99%** | 0% → 0% | 6.6 → 5.6 | 0.07 → 0.09 | 6% → 7% | 0.32 → 0.36 | – |
| Orman | 4550 | 39% → **46%** | 2% → 1% | 10.2 → 8.9 | 0.68 → 0.61 | 49% → 47% | 2.67 → 2.60 | – |
| Mağara — karanlık | 3950 | 40% → **43%** | 6% → 8% | 12.9 → 11.9 | 0.80 → 0.78 | 51% → 51% | 2.53 → 2.44 | – |
| Kale — Gündüz | 3950 | 43% → **53%** | 5% → 4% | 11.3 → 10.3 | 0.67 → 0.69 | 43% → 47% | 2.33 → 1.89 | – |
| Taverna — 4 masum ortada | 2550 | 21% → **99%** | 0% → 0% | 2.3 → 5.5 | 0.04 → 0.15 | 4% → 12% | 0.10 → 0.44 | 0.72 / 4 |
| Taverna — 4 masum düşmandan uzakta, varsayılan | 2550 | 79% → **94%** | 1% → 0% | 7.1 → 6.5 | 0.22 → 0.42 | 18% → 28% | 0.89 → 0.88 | 3.68 / 4 |

- **Ort. düşmüş PC:** savaş sonunda 0 HP'de olup ölmemiş (ölmekte veya stabil) karakter.
- **Berabere:** 20 turda bitmedi.

## Güncel durum: yay kuralı düzeltildi + yapay zekâ yakın dövüşe yürüyor (16.10, f7dcd12)

8 senaryo × 200 tohum. Sütunlar sırayla: ilk ölçüm (29d06f0) → sınıf özellikleri → mağara ışığı ve itme (51aa65e) → ortamın yay kuralı düzeltildi (304de87) → parti yürüyerek daha iyi saldırıya ulaşıyorsa önce yürür (f7dcd12, **güncel**).

| Senaryo | XP | İlk | Sınıf öz. | Mağara+itme | Yay kuralı | **Güncel** | Berabere | Ort. ölen PC | En az 1 ölüm | Kurtarılan masum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 4850 | 3% | 25% | 25% | 25% | **25%** | 4% | 0.60 | 43% | – |
| Çöl — Gündüz | 4400 | 43% | 61% | 61% | 35% | **46%** | 2% | 0.54 | 39% | – |
| Volkan | 4400 | 99% | 99% | 100% | 100% | **100%** (lavJump ile de 100%) | 0% | 0.05 | 5% | – |
| Orman | 4550 | 39% | 46% | 46% | 66% | **53%** | 5% | 0.54 | 41% | – |
| Mağara — karanlık | 3950 | 40% | 43% | 37% | 54% | **59%** | 5% | 0.64 | 39% | – |
| Kale — Gündüz | 3950 | 43% | 53% | 53% | 53% | **65%** | 2% | 0.54 | 38% | – |
| Taverna — 4 masum ortada | 2550 | 21%* | 99% | 99% | 99% | **99%** | 0% | 0.10 | 8% | 0.77 / 4 |
| Taverna — 4 masum düşmandan uzakta | 2550 | 79%* | 94% | 94% | 94% | **99%** | 0% | 0.13 | 11% | 3.97 / 4 |
| Taverna — 8 masum düşmandan uzakta | 2550 | – | – | – | – | **95%** | 0% | 0.24 | 19% | 6.29 / 8 |

\* Eski sıkı masum kuralıyla (masumların yarısı ölünce kayıp).

Masum sayısı artık GM ayarı (Taverna varsayılan 4, Şehir Meydanı 6, 0–12). 8 masumlu satır bu ayarla eklendi: kalabalık taverna masumları korumayı zorlaştırıyor (kurtarılan %79, 4 masumda %99), partiye etkisi küçük (95%).

**Yay kuralının etkisi:**
- **Çöl (61% → 35%):** Düşüşün nedeni kural değildi. Dezavantaj kalkınca savaşçı yakın dövüşe yürümeyi bırakıp arbaletle atmaya başladı; arbalet (1d8+1) kılıçtan (1d8+4) zayıf. Düşmanın menzilli saldırıları da güçlendi: Ogre'nin ciriti 2d6+4 ve goblin okları artık dezavantajsız.
- **Yapay zekâ düzeltmesi (f7dcd12):** Parti üyesi bu tur yürüyerek en az %25 daha iyi bir saldırıya güvenle ulaşabiliyorsa önce yürüyor. Çöl 46%'ya, Kale 65%'e, Taverna 99%'a çıktı.
- **Orman ve mağara:** Partinin okçuları artık dezavantajsız. Ormanda yakın dövüşe yürüme bir kısmını geri aldı (66% → 53%): ağaçlar arasında yakın dövüş, partiyi kalabalık düşman grubunun içine sokuyor.

**Sayı önerileri (güncel tabloya göre, uygulanmadı).** Hedef %60–80; canavar değerleri değişmesin, yalnızca senaryodaki düşman sayıları:

| Senaryo | Şu an | Öneri | Gerekçe |
|---|---:|---|---|
| Düz | 25% | Hill Giant çıkar (4850 → 3050 XP) | Haritasızda siper ve menzil yok; bütün düşmanlar ilk turdan vurur |
| Çöl | 46% | Minotaur of Baphomet çıkar (4400 → 3700) | Hedefin altında; en sert yakın dövüşçülerden biri |
| Volkan | 100% | Önce harita: düşman başlangıç bölgesi adacıklardan kara köprüsüne alınsın | Sayı artırmak sorunu çözmez |
| Orman | 53% | 2 Wolf ve 1 Giant Spider çıkar (4550 → 4250) | Hedefin hemen altında |
| Mağara | 59% | 1 Ghoul çıkar (3950 → 3750) | Neredeyse hedefte; berabere 5% |
| Kale | 65% | Değişiklik yok | Hedefte |
| Taverna | 99% | 1 Ogre ve 1 Bandit Captain ekle (2550 → 3450) | Masum kuralı değişince fazla kolay |

## Gece varyantları ve gizlenme kuralları (Görev K)

Yeni senaryolar `orman-gece` ve `kale-gece`; düşmanlar gündüzle aynı. Komut: `npm run sim -- 200 orman orman-gece kale kale-gece`. Hedef %55–85.

| Senaryo | XP | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | Durum |
|---|---:|---:|---:|---:|---:|---|
| Orman | 5200 | 59% | 0% | 5.7 | 0.23 | ✓ |
| Orman — Gece | 5200 | **59%** | 0% | 5.7 | 0.23 | ✓ |
| Kale — Gündüz | 4650 | 61% | 6% | 10.6 | 0.65 | ✓ |
| Kale — Gece | 4650 | **61%** | 6% | 10.6 | 0.65 | ✓ |

- Gece sonuçları gündüzle birebir aynı. Bu beklenen sonuç: gece kuralı (`night`) yalnızca gizlenmeyi etkiliyor, yapay zekâ ise hiçbir tarafta Gizlen kullanmıyor. Görüş sınırı (`darkness`) gece haritalarına eklenmedi (Şehir meydanı gecede isteğe bağlı kaldı).
- Yeniden kurmaya gerek olmadı (ikisi de aralıkta).
- Gece etkisi oyuncu gizlendiğinde ortaya çıkar; sayısal etkisi DECISIONS.md'de (Görev K): Stealth +5 bir karakterin gizlenme olasılığı gündüz %55 (keskin gözlü gözcüye karşı %40), gece ışıksız altıgende %80.
- Diğer senaryolar değişmedi: `npm run sim -- 30` çıktısı Görev J ile aynı (yalnızca iki yeni satır).

## Dungeon: Merdiven ve Hazine odası varyantları (16.10)

Aynı düşman grubu üç varyantta (Troll, Ogre, 4 Hobgoblin Warrior, 2 Ghoul; 3050 XP), 200 tohum:

| Varyant | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Koridor (meşale) | 86% | 7% | 7.1 | 0.23 | 17% | 0.83 |
| Merdiven | **66%** | **22%** | 10.1 | 0.30 | 22% | 0.84 |
| Hazine odası | 89% | 7% | 7.2 | 0.18 | 14% | 0.68 |

- **Merdiven en zoru.** Düşmanlar sağdaki yüksek basamaklarda başlıyor (highGround avantajı).
  Parti dar basamaklardan ve merdiven boşluğunun kenarından tırmanıyor. Savaş uzuyor, beraberlik %22.
  Kayıp ise artmıyor; ölen PC sayısı Koridor'a yakın.
- **Hazine odası** Koridor'a yakın. Gizli tuzakları pasif Algı çoğu zaman yakalıyor.
- **Öneri (uygulanmadı):** Sayı değişikliği gerekmiyor.
  Merdiven'deki beraberliği azaltmak için önce harita düzeltilmeli: düşman bölgesine `l` basamaklarından birkaç altıgen eklenmeli, böylece düşmanlar aşağı inip çatışmaya girer.
  Sonra yeniden ölçülmeli.

## Masumlar eylemsiz (Görev F)

Masumlar artık hiçbir şey yapmıyor: kaçmıyor, sıraları atlanıyor. Yalnızca 3 Taverna senaryosu etkilendi; diğer senaryolarda masum yok ve varsayılan yerleşim birebir aynı (bütün harita/varyant/aynalama/masum kipleri eski ve yeni kodla karşılaştırıldı). 200 tohum, hedef %55–85.

| Senaryo | Önce (Görev E) | Sonra (aynı düşmanlar) | 1. deneme: Spy → Bandit Captain | 2. deneme: 1 Tough → Spy | **Son** | Kurtarılan masum (son) |
|---|---:|---:|---:|---:|---:|---:|
| Taverna, 4 masum ortada | 84% | 86% | 69% | 82% | **82%** ✓ | 0,00 / 4 |
| Taverna, 4 masum uzakta | 66% | 63% | 58% | 60% | **60%** ✓ | 3,22 / 4 |
| Taverna, 8 masum uzakta | 61% | 59% | 48% | 61% | **61%** ✓ | 4,49 / 8 |

- Son liste: 2 Tough Boss, 2 Knight, 2 Bandit Captain, 1 Tough, 2 Spy (4900 → 5000 XP). Taverna'nın 9 düşman yeri dolu; sayı artırılamadığı için güçlendirme bir canavarı değiştirerek yapıldı.
- **Ortadaki masumlar:** kaçmadıkları için hepsi ölüyor (0/4). Düşmanlar vuruşlarını onlara harcadığı için parti ortada daha kolay kazanıyor (%86 → %82 ancak liste güçlenince).

## Yakalama, Prone, hücum ve süreli hasar sonrası (Görev E)

Grappled (kaçış DC, sürükleme), Prone (boyut sınırı, kalkmak hızın yarısı), hücum (20+ ft düz koşu: ek hasar ve Prone), süreli durumlar ve süreli hasar artık uygulanıyor. 200 tohum. Hedef: normal %55–85, ejderhalar %60–80.

| Senaryo | Önce (Görev C) | Sonra (aynı düşmanlar) | Yeniden kurulum | **Son** |
|---|---:|---:|---|---:|
| Düz (haritasız) | 69% | 51% | 4 → 2 Wolf (1800 → 1700 XP) | **66%** ✓ |
| Çöl, gündüz | 64% | 57% | – | **57%** ✓ |
| Volkan, normal | 64% | 64% | – | **64%** ✓ |
| Orman | 59% | 59% | – | **59%** ✓ |
| Mağara, karanlık | 66% | 66% | – | **66%** ✓ |
| Dungeon, Koridor | 80% | 80% | – | **80%** ✓ |
| Dungeon, Merdiven | 84% | 84% | – | **84%** ✓ |
| Dungeon, Hazine odası | 83% | 84% | – | **84%** ✓ |
| Kale, gündüz | 61% | 61% | – | **61%** ✓ |
| Taverna, 4 masum ortada | 84% | 84% | – | **84%** ✓ |
| Taverna, 4 masum uzakta | 66% | 66% | – | **66%** ✓ |
| Taverna, 8 masum uzakta | 61% | 61% | – | **61%** ✓ |
| Ejderha: Young Red | 70% | 70% | – | **70%** ✓ |
| Ejderha: Adult Red | 67% | 67% | – | **67%** ✓ |
| Ejderha: Ancient Red | 67% | 67% | – | **67%** ✓ |
| Ejderha: Wyrmling | 88% | 88% | – | **88%** kabul edilen sapma (Görev C'den) |
| Ejderha: şans kipi (%2) | 65% | 65% | – | **65%** ✓ |

- **Düz:** 4 Wolf ve 2 Worg ısırığı Medium hedefi yere düşürüyor; Pack Tactics ve yerdeki hedefe yakın dövüş avantajıyla parti %51'e indi. Boar hücumu (+1d6, Prone) da etkili. 2 Wolf çıkınca %66.
- **Çöl:** Giant Scorpion kıskacı yakalıyor; yakalanan karakter kaçmak için eylemini harcıyor. %64 → %57, aralıkta.
- **Orman:** Dire Wolf ve Wolf savaş başına ~2 kez yere düşürüyor; ortalama ölen PC 0,18 → 0,23 arttı, kazanma oranı aynı kaldı (%59).
- Diğer senaryoların düşmanlarında yakalama, Prone ya da hücum rider'ı yok ya da çok az (Kale'de 10 savaşta 1 yakalama); sonuç değişmedi.

## Canavar saldırı ek etkileri (rider) uygulandıktan sonra (Görev C)

Ek hasarlar ("+ 1d6 necrotic", "+ 7d6 poison"), avantajlı koşullu hasar ve "Bloodied" hasar değişimi artık uygulanıyor (`data/attack-riders.json`). Düşmanlar belirgin güçlendi. Hedef: normal senaryolar %55–85, ejderhalar %60–80. 200 tohum.

| Senaryo | Önce (rider yok) | Sonra (aynı düşmanlar) | Yeniden kurulum | **Son** |
|---|---:|---:|---|---:|
| Düz (haritasız) | 69% | 69% | – | **69%** ✓ |
| Çöl, gündüz | 72% | 64% | – | **64%** ✓ |
| Volkan, normal | 81% | 64% | – | **64%** ✓ |
| Orman | 65% | 59% | – | **59%** ✓ |
| Mağara, karanlık | 62% | 50% | Phase Spider → Grimlock (4100 → 3450 XP) | **66%** ✓ |
| Dungeon, Koridor | 58% | 39% | Wraith ve 1 Bugbear Stalker çıktı (8400 → 5900 XP) | **80%** ✓ |
| Dungeon, Merdiven | 85% | 84% | – | **84%** ✓ |
| Dungeon, Hazine odası | 68% | 44% | Wraith ve 1 Bugbear Stalker çıktı, +1 Bugbear Warrior (7750 → 5450 XP) | **83%** ✓ |
| Kale, gündüz | 56% | 38% | 6 → 3 Hobgoblin Warrior (yayı +3d4 zehir), 2 → 5 Goblin Warrior, 3 → 2 Berserker (5250 → 4650 XP) | **61%** ✓ |
| Taverna, 4 masum ortada | 86% | 84% | – | **84%** ✓ (sapma bitti) |
| Taverna, 4 masum uzakta | 71% | 66% | – | **66%** ✓ |
| Taverna, 8 masum uzakta | 67% | 61% | – | **61%** ✓ |
| Ejderha: Young Red | 70% | 70% | – | **70%** ✓ |
| Ejderha: Adult Red | 66% | 67% | – | **67%** ✓ |
| Ejderha: Ancient Red | 66% | 67% | – | **67%** ✓ |
| Ejderha: Wyrmling | 76% | 45% | 1. deneme Wyvern + 2 Magma Mephit: 89%; 2. deneme Wyvern + Hell Hound: 88% | **88%** kabul edilen sapma (+8) |
| Ejderha: şans kipi (%2) | 60% | 56% | Wyvern + 2 Harpy → Wyvern + Imp | **65%** ✓ |

- Yeniden kurulan düşmanlar kendi haritasının ortam listesinden.
- Şans kipi ve Wyrmling'te Harpy (Volkan listesinde yok) yerine Volkan canavarları kullanıldı.
- **Wyrmling:** 2 Wyvern (iğne +7d6 zehir) partiyi eziyor (%45); tek Wyvern'le parti %88–89 kazanıyor. Ara bir değer Volkan listesinde yok.
  - Öneri (uygulanmadı): Wyvern + Hell Hound + Magma Mephit, ya da Wyvern + Salamander.

## Durum süreleri, Kaçın ve Yardım sonrası (16.10)

Süreli durumlar eklendi: canavar saldırı etkileri ve büyülerin "save ends" süresi. Kaçın ve Yardım oyuncu eylemi olarak eklendi; yapay zekâ bunları kullanmıyor. Düşman listeleri değişmedi.

200 tohum:

| Senaryo | Önce | **Sonra** | Fark | Hedef (%55–85) |
|---|---:|---:|---:|---|
| Düz (haritasız) | 69% | **69%** | 0 | ✓ |
| Çöl, gündüz | 72% | **72%** | 0 | ✓ |
| Volkan, normal | 81% | **81%** | 0 | ✓ |
| Orman | 63% | **65%** | +2 | ✓ |
| Mağara, karanlık | 63% | **62%** | −1 | ✓ |
| Dungeon, Koridor | 58% | **58%** | 0 | ✓ |
| Dungeon, Merdiven | 85% | **85%** | 0 | ✓ (sınırda) |
| Dungeon, Hazine odası | 69% | **68%** | −1 | ✓ |
| Kale, gündüz | 56% | **56%** | 0 | ✓ |
| Taverna, 4 masum ortada | 86% | **86%** | 0 | kabul edilen sapma |
| Taverna, 4 masum uzakta | 71% | **71%** | 0 | ✓ |
| Taverna, 8 masum uzakta | 67% | **67%** | 0 | ✓ |

- **Etki küçük.**
  - Ghoul ve Ghast felci (Claw) çoklu saldırının parçası değil; yapay zekâ çoğunlukla ısırık kombinasyonunu seçiyor.
  - Giant Spider ve Ettercap ağı (Restrained, her tur sonu STR save) ile Mummy bakışı (Frightened) birkaç puanlık oynama yaptı.
- **Aralık dışına çıkan yok.** Yeni öneri gerekmiyor.
- **Not:** Canavar saldırılarının ek hasar metinleri (`rider`, örn. "+ 7d6 poison", "+ 1d6 necrotic") hâlâ uygulanmıyor; yalnızca günlükte görünüyor. Uygulanırsa düşmanlar belirgin güçlenir ve dengenin yeniden ölçülmesi gerekir.

## Adım 11, son tur: hedef aralık ve son rosterler (16.10)

**Hedef aralık:**
- Normal senaryolar: parti kazanma **%55–85**.
- Ejderha senaryoları: **%60–80** (değişmedi).

Aralık dışı kalan üç senaryo, kendi haritasının ortam listesinden düzeltildi. En çok 2 deneme, 200 tohum.

| Senaryo | Önceki | Deneme 1 | Deneme 2 | **Sonuç** |
|---|---:|---|---|---:|
| Mağara, karanlık | 98% (3000 XP) | Darkmantle → Phase Spider (3600 XP): 96% | Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider (4100 XP) | **63%** ✓ |
| Dungeon, Koridor | 97% (5150 XP) | 2 Ghast → 2 Mummy, 1 Ghoul → Minotaur of Baphomet (6150 XP): 93% | 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith (8400 XP, 14 altıgen) | **58%** ✓ |
| Dungeon, Hazine odası | 95% (5150 XP) | Koridor deneme 1 ile aynı (6150 XP): 87% | 2 Wight, 2 Bugbear Stalker, 2 Mummy, Ghast, 2 Ghoul, Bugbear Warrior, Minotaur of Baphomet, Wraith (7750 XP, 12 altıgen) | **69%** ✓ |

- **Mağara'da önerilen "Darkmantle yerine Troll"** listesi önceki turun 2. denemesiyle (Troll, Minotaur, Bugbear Stalker…, 4700 XP) aynıydı ve %39 vermişti.
  - Bu yüzden deneme 1'de daha hafif bir değişim denendi (Phase Spider).
  - Deneme 2'de Troll tutuldu, Minotaur ve Bugbear Stalker çıkarıldı.
  - Mağara'da Troll belirleyici: karanlıkta yenilenme ve 94 HP.

### Son durum (normal senaryolar, 200 tohum)

| Senaryo | Düşmanlar | XP | Parti kazandı | Durum |
|---|---|---:|---:|---|
| Düz (haritasız) | Ogre, Bandit Captain, 4 Gnoll Warrior, 4 Wolf, 2 Worg, 2 Boar | 1800 | 69% | ✓ |
| Çöl, gündüz | 2 Giant Scorpion, 2 Mummy, 2 Manticore, 4 Gnoll Warrior, Giant Hyena, 2 Scout, Death Dog | 5200 | 72% | ✓ |
| Volkan, normal | 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, Magma Mephit | 3900 | 81% | ✓ |
| Orman | 2 Owlbear, 2 Werewolf, 3 Giant Spider, 4 Dire Wolf, 2 Ettercap, 2 Wolf | 5200 | 63% | ✓ |
| Mağara, karanlık | Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider | 4100 | 63% | ✓ |
| Dungeon, Koridor | 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith | 8400 | 58% | ✓ |
| Dungeon, Merdiven | 2 Ghoul, 2 Ghast, 3 Bugbear Warrior, 4 Skeleton, Bugbear Stalker | 2800 | 85% | ✓ (sınırda) |
| Dungeon, Hazine odası | 2 Wight, 2 Bugbear Stalker, 2 Mummy, Ghast, 2 Ghoul, Bugbear Warrior, Minotaur of Baphomet, Wraith | 7750 | 69% | ✓ |
| Kale, gündüz | 6 Hobgoblin Warrior, 2 Goblin Warrior, Hobgoblin Captain, Bugbear Stalker, 3 Berserker, 2 Warrior Veteran, 2 Bugbear Warrior | 5250 | 56% | ✓ |
| Taverna, 4 masum ortada | 2 Tough Boss, 2 Knight, 2 Bandit Captain, 2 Tough, Spy | 4900 | 86% | **kabul edilen sapma (+1)** |
| Taverna, 4 masum uzakta | aynı | 4900 | 71% | ✓ |
| Taverna, 8 masum uzakta | aynı | 4900 | 67% | ✓ |

- Bütün türler kendi haritasının ortam listesinde.
- Taverna'nın üç senaryosu aynı düşmanlarla; masum yerleşimi farkı kasıtlı (ortadaki masumlar düşmanı oyalıyor).
- Ejderha senaryoları %60–80 içinde (Young 70, Adult 66, Ancient 66, Wyrmling 76, şans kipi 60).

## Adım 11: düşmanlar haritanın ortam listesinden (16.10)

Her senaryonun düşmanları `data/monster-ortamlari.json`'daki kendi ortam listesinden yeniden kuruldu: Düz için `duz-zemin`, diğerleri haritanın kimliği. Canavar verisi ve ortam dosyası değişmedi.
- Her senaryo en çok 2 deneme. İkincide de %60–80 dışında kalırsa hedefe en yakın deneme bırakıldı (**kabul edilen sapma**).
- Ejderha senaryolarına dokunulmadı.
- Düşman sayısı haritanın düşman başlangıç altıgeniyle sınırlı: Volkan 10, Mağara 8, Merdiven ve Hazine 12, Taverna 9, Koridor 14, Orman 15, Kale 18, Çöl 20.

Komut: `npm run sim -- 200 <senaryo>`. 200 tohum.

### Eski ve yeni düşman listeleri

| Senaryo | Eski düşmanlar (XP) | Eski | Yeni düşmanlar (XP) | Deneme 1 | Deneme 2 | **Sonuç** |
|---|---|---:|---|---:|---:|---:|
| Düz (haritasız) | Troll, Hill Giant, Owlbear, Ogre, 2 Wolf (4850) | 25% | Ogre, Bandit Captain, 4 Gnoll Warrior, 4 Wolf, 2 Worg, 2 Boar (1800) | 22% (2950 XP) | **69%** | **69%** ✓ |
| Çöl, gündüz | Troll, Minotaur of Baphomet, Owlbear, Ogre, Bandit Captain, 4 Wolf, 2 Goblin Warrior (4400) | 46% | 2 Giant Scorpion, 2 Mummy, 2 Manticore, 4 Gnoll Warrior, Giant Hyena, 2 Scout, Death Dog (5200) | 97% (3300 XP) | **72%** | **72%** ✓ |
| Volkan, normal | Wyvern, Troll, 4 Wolf, 2 Goblin Warrior (4400) | 86% | 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, Magma Mephit (3900) | 57% (4450 XP) | **81%** | **81%** ~ |
| Orman | Troll, Owlbear, Minotaur of Baphomet, Ogre, 3 Giant Spider, 6 Wolf (4550) | 53% | 2 Owlbear, 2 Werewolf, 3 Giant Spider, 4 Dire Wolf, 2 Ettercap, 2 Wolf (5200) | 94% (3250 XP) | **63%** | **63%** ✓ |
| Mağara, karanlık | Troll, Owlbear, Ogre, 3 Giant Spider, 2 Ghoul (3950) | 59% | 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Minotaur of Baphomet, Ogre, Bugbear Stalker (3000) | **98%** | 39% (4700 XP) | **98%** ✗ |
| Dungeon, Koridor | Troll, Ogre, 4 Hobgoblin Warrior, 2 Ghoul (3050) | 86% | 2 Wight, 2 Bugbear Stalker, 3 Ghast, 3 Ghoul, 2 Bugbear Warrior (5150) | 100% (3450 XP) | **97%** | **97%** ✗ |
| Dungeon, Merdiven | aynı (3050) | 66% | 2 Ghoul, 2 Ghast, 3 Bugbear Warrior, 4 Skeleton, Bugbear Stalker (2800) | **85%** | 90% (3850 XP) | **85%** ~ |
| Dungeon, Hazine odası | aynı (3050) | 89% | Koridor ile aynı (5150) | 100% (3450 XP) | **95%** | **95%** ✗ |
| Kale, gündüz | Troll, 2 Ogre, Bandit Captain, 6 Hobgoblin Warrior, 4 Goblin Warrior (3950) | 65% | 6 Hobgoblin Warrior, 2 Goblin Warrior, Hobgoblin Captain, Bugbear Stalker, 3 Berserker, 2 Warrior Veteran, 2 Bugbear Warrior (5250) | 90% (3700 XP) | **56%** | **56%** ~ |
| Taverna, 4 masum ortada | 2 Bandit Captain, 4 Tough, Ogre, Minotaur of Baphomet, Hobgoblin Warrior (2550) | 99% | 2 Tough Boss, 2 Knight, 2 Bandit Captain, 2 Tough, Spy (4900) | 99% (3225 XP) | **86%** | **86%** ~ |
| Taverna, 4 masum uzakta | aynı | 99% | aynı | 95% | **71%** | **71%** ✓ |
| Taverna, 8 masum uzakta | aynı | 95% | aynı | 91% | **67%** | **67%** ✓ |

- **Deneme 1 rosterleri:**
  - Düz: 2 Ogre, Werewolf, Bandit Captain, 4 Gnoll, 4 Wolf, 2 Worg, 2 Boar.
  - Çöl: Giant Scorpion, Mummy, Manticore, 4 Gnoll, 2 Giant Hyena, 2 Scout, Death Dog.
  - Volkan: 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, 2 Magma Mephit, Azer Sentinel.
  - Orman: Owlbear, Werewolf, 3 Giant Spider, 3 Dire Wolf, 4 Wolf, Ettercap.
  - Koridor ve Hazine: 3 Ghoul, 2 Ghast, 2 Bugbear Warrior, 3 Skeleton, Bugbear Stalker, Wight.
  - Kale: 6 Hobgoblin Warrior, 4 Goblin Warrior, Goblin Boss, Hobgoblin Captain, 2 Bugbear Warrior, 2 Berserker, Warrior Veteran.
  - Taverna: 3 Tough, Bandit, 2 Bandit Captain, Tough Boss, Knight, Spy.
- **Deneme 2'de Mağara ve Merdiven:**
  - Mağara: Troll, Minotaur of Baphomet, Bugbear Stalker, Ettercap, Ogre, 2 Giant Spider, Ghoul.
  - Merdiven: 2 Ghoul, 3 Ghast, 3 Bugbear Warrior, Bugbear Stalker, Wight, 2 Skeleton.

### Ortam uygunluğu
- Yeni rosterlerdeki bütün türler kendi haritasının ortam listesinde (betikle denetlendi).
- Eski rosterlerde Troll, Owlbear, Ogre, Wolf, Goblin Warrior, Minotaur of Baphomet ve Hobgoblin Warrior çoğu haritanın listesinde değildi.
- Kale'de görev metnindeki örnek Ogre ve Bandit Captain `kale` listesinde yok; yerlerine Hobgoblin Captain, Berserker ve Warrior Veteran kullanıldı.
- Dokunulmayan ejderha senaryolarındaki Harpy `volkan` listesinde yok (`dag`, `ada`, `gemi`).

### Kabul edilen sapmalar
Hepsi 2 denemenin en yakını.

| Senaryo | Sonuç | Sapma | Not |
|---|---:|---:|---|
| Volkan, normal | 81% | +1 | Sınırda; Magma Mephit eklemek yeter gibi |
| Dungeon, Merdiven | 85% | +5 | Deneme 2 (3850 XP) daha kolay çıktı (%90): bu varyantta düşman sayısı ve Wight farkı belirleyici değil, basamaklar ve beraberlik (%8–14) baskın |
| Kale | 56% | −4 | Deneme 1 %90; aradaki değer (1 Berserker eksik) hedefe girer gibi |
| Taverna, 4 masum ortada | 86% | +6 | Masum yerleşimi farkı kasıtlı (ortada kolay); diğer iki Taverna hedefte |
| Dungeon, Hazine odası | 95% | +15 | Tema canavarları (ghoul, ghast, wight, bugbear) bu haritada XP'sine göre zayıf; Koridor'la aynı |
| Dungeon, Koridor | 97% | +17 | Aynı |
| Mağara, karanlık | 98% | +18 | Deneme 2'de Troll ve Minotaur ile %39'a düştü (−21); deneme 1 yakın olduğu için bırakıldı |

- Mağara ve Dungeon'da iki deneme hedefin iki yanına düştü ya da yetmedi.
- Bir sonraki adım için öneri (uygulanmadı):
  - Mağara: deneme 1'e yalnızca Troll ekle (8 altıgen sınırı: Darkmantle yerine).
  - Koridor ve Hazine: 2 Ghast → 2 Mummy, ya da +1 Minotaur of Baphomet (Koridor'da 14 yer var).

## Volkan: Wyrmling 2 Wyvern, şans kipi %2, üçüncü tur (16.10)

Değişiklikler:
- Wyrmling eşlikçisi: Wyvern + 3 Harpy → 2 Wyvern (Harpy yok).
- `dragonWake: chance` varsayılan eğilimi: %5 → %2 (Volkan JSON ve kod yedeği). Eşlikçi aynı (Wyvern + 2 Harpy).

200 tohum, ilk denemede ikisi de aralıkta; ikinci deneme gerekmedi:

| Senaryo | Önceki ölçümler | **Şimdi** | Uyandı | Uyumadan bitti | Uyanınca parti kazandı | Ejderha öldü (uyandıysa) |
|---|---|---:|---:|---:|---:|---:|
| Wyrmling (2 Wyvern) | W + 2H: 95%, W + 3H: 89%, 2W + 2H: 53% | **76%** ✓ | 43% | 58% | ~49% | 56% |
| Young Red, `chance` %2 | %25: 13%, %10: 35%, %5: 49% | **60%** ✓ (alt sınır) | 44% | 57% | ~7% | 8% |

**Volkan uyuyan ejderha, son durum** (hepsi %60–80 içinde):

| Seçenek | Eşlikçi (sim) | Parti kazandı |
|---|---|---:|
| Young Red | Wyvern + 2 Harpy | 70% |
| Adult Red | Wyvern + 2 Harpy | 66% |
| Ancient Red | Wyvern + 2 Harpy | 66% |
| Red Dragon Wyrmling | 2 Wyvern | 76% |
| Young Red, `chance` (varsayılan %2) | Wyvern + 2 Harpy | 60% |

- Şans kipi tam alt sınırda (%60). GM yüzdeyi kurulumda değiştirebilir: yükseltmek zorlaştırır.
- Canavar verisine dokunulmadı; eşlikçiler yalnızca sim senaryosu.

## Volkan: Wyrmling eşlikçisi ve şans kipi, ikinci tur (16.10)

Değişiklikler:
- Wyrmling eşlikçisi: 2 Wyvern + 2 Harpy → Wyvern + 3 Harpy.
- `dragonWake: chance` varsayılan eğilimi: %10 → %5 (Volkan JSON ve kod yedeği). Eşlikçi değişmedi (Wyvern + 2 Harpy).

Young, Adult ve Ancient değişmedi (%70, %66, %66; önceki tablo).

200 tohum:

| Senaryo | Önceki ölçümler | **Şimdi** | Uyandı | Uyumadan bitti | Ejderha öldü (uyandıysa) |
|---|---|---:|---:|---:|---:|
| Wyrmling (Wyvern + 3 Harpy) | W + 2H: 95%, 2W + 2H: 53% | **89%** ✗ | 34% | 66% | 69% |
| Young Red, `chance` %5 | %25: 13%, %10: 35% | **49%** ✗ | 54% | 46% | 6% |

- **Wyrmling:** Bir Harpy eklemek yalnızca %95 → %89 indirdi. İkinci Wyvern ise %53'e düşürüyor. Eşlikçideki Wyvern sayısı belirleyici, Harpy etkisi küçük.
- **Şans kipi:** Eğilim düştükçe kazanma artıyor (%13 → %35 → %49). Hiç uyandırmayan `never` kipi %70; hedefe çok düşük bir eğilimle varılıyor.
- **Yeni öneriler (uygulanmadı):**
  - **Wyrmling:** 2 Wyvern, Harpy'siz. 2 Wyvern + 2 Harpy'nin (%53) biraz daha hafifi; beklenen aralık %60–75.
  - **Şans kipi:** Varsayılan eğilim %2. %5'te %49, `never`'da %70; %2 ile %60 civarı beklenir.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan: eşlikçi önerileri uygulandı (16.10)

Değişiklikler (yalnızca sim senaryosu ve varyantın varsayılanı; canavar verisi değişmedi):
- Adult Red eşlikçisi: 3 Harpy → Wyvern + 2 Harpy (Young ile aynı).
- Wyrmling eşlikçisi: Wyvern + 2 Harpy → 2 Wyvern + 2 Harpy.
- `dragonWake: chance` varsayılan eğilimi: %25 → %10 (Volkan JSON ve kod yedeği).

Komut: `npx vite-node src/sim/ejderTeshis.ts 200 volkan-ejder volkan-ejder-adult volkan-ejder-ancient volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum.

| Ejderha (eşlikçi) | Önce | **Şimdi** | Uyandı | Uyumadan bitti | Uyanınca parti kazandı | Ejderha öldü (uyandıysa) |
|---|---:|---:|---:|---:|---:|---:|
| Young Red (Wyvern + 2 Harpy) | 70% | **70%** | 33% | 68% | 6% | 6% |
| Adult Red (Wyvern + 2 Harpy) | 97% | **66%** ✓ | 35% | 66% | 0% | 0% |
| Ancient Red (Wyvern + 2 Harpy) | 66% | **66%** ✓ | 35% | 66% | 0% | 0% |
| Wyrmling (2 Wyvern + 2 Harpy) | 95% | **53%** ✗ | 40% | 60% | 21% | 33% |
| Young Red, `chance` %10 | 13% (%25) | **35%** ✗ | 67% | 34% | 3% | 2% |

- **Aralıkta:** Young, Adult ve Ancient (%66–70).
- **Wyrmling %53, aralığın altında.** İkinci Wyvern fazla geldi: eşlikçiler partiyi yıpratıyor, uyanan Wyrmling artık %33'te ölüyor.
- **Şans kipi %35, aralığın altında.** %10 eğilimle bile uyanma %67: düşmanlar sık tur atıyor ve her turda yeni zar atılıyor.
- **Yeni öneriler (uygulanmadı):**
  - **Wyrmling:** ara değer olarak Wyvern + 3 Harpy (önceki iki ölçüm %95 ve %53, hedef bunların arasında).
  - **Şans kipi:** eğilim %5; ya da bu kipte eşlikçi 2 Harpy (Wyvern'siz), böylece savaş kısalır ve daha az zar atılır.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan: uyuyan ejderha teşhisi ve Ancient Red (16.10)

Komut: `npx vite-node src/sim/ejderTeshis.ts 200 volkan-ejder volkan-ejder-adult volkan-ejder-ancient volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum, Volkan haritası. Eşlikçiler `src/sim/balance.ts` senaryolarında.

| Ejderha (eşlikçi) | Parti kazandı | Uyandı | Uyanma turu | Uyanık tur | Ejderhanın hasarı | PC düşürme* | Nefes/savaş | PC'ye vardı | Ejderha öldü | Uyumadan bitti | Uyumadan bitince parti kazandı |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Young Red (Wyvern + 2 Harpy) | **70%** | 33% | 1.2 | 7.7 | 136 | 6.8 | 3.1 | 98% | 6% | 68% | 100% |
| Adult Red (3 Harpy) | **97%** | 4% | 1.4 | 6.7 | 157 | 6.1 | 3.7 | 100% | 0% | 97% | 100% |
| **Ancient Red (Wyvern + 2 Harpy), yeni** | **66%** | 35% | 1.1 | 6.0 | 132 | 6.0 | 2.6 | 90% | 0% | 66% | 100% |
| Wyrmling (Wyvern + 2 Harpy) | **95%** | 30% | 1.3 | 5.6 | 71 | 2.2 | 2.6 | 100% | 85% | 71% | 100% |
| Young Red, `chance` %25 | **13%** | 90% | 1.2 | 7.8 | 147 | 6.9 | 3.2 | 99% | 3% | 10% | 100% |

\* Uyandığı savaşlarda ortalama. Tekrar düşürmeler dahil: iyileşip yeniden düşen PC her seferinde sayılır.

- **Ejderhanın yapay zekâsı sorun değil.**
  - Uyanınca %90–100 bir karaktere varıyor (uçarak, adalar arasında).
  - Nefes silahını savaş başına 2.6–3.7 kez kullanıyor.
  - Young, Adult ve Ancient uyandıysa parti neredeyse hiç kazanmıyor (Adult ve Ancient hiç ölmedi).
- **Asıl sebep: kazanmanın büyük kısmı ejderha hiç uyanmadan.**
  - Uyumadan biten savaşların %100'ünü parti kazanıyor; kazanma oranı ≈ uyumadan bitme oranı.
  - Uyanma neredeyse yalnızca 1. tur sonundaki Algı ile oluyor (25 ft içinde gizlenmemiş karakter).
  - Parti yapay zekâsı o menzilden kaçıyor; uyanık eşlikçiler ölünce savaş bitiyor (tasarım gereği: "ejderha uyurken sıvışılır").
  - **Adult Red %97 çünkü eşlikçisi zayıf (3 Harpy).** Savaş ~2.3 turda bitiyor ve parti ejderhaya yaklaşmıyor.
- **Wyrmling'te sebep güç.** CR 4, 5 kişilik 5. seviye partiye karşı zayıf: uyandığı savaşların %85'inde ölüyor, uyanınca parti %83 kazanıyor.
- **Denenen ve geri alınan düzeltme: savaş gürültüsü.** Ejderhaya 30 ft içinde bir saldırı ya da save olunca turda bir kez Algı ≥ 18.
  - Ejderhalar %89–100 uyandı. Parti kazanma oranı: Young %8, Adult %5, Ancient %0, Wyrmling %77, chance %3.
  - Uyanınca ejderha kazandığı için bu kural "uyuyan ejderha" fikrini "her zaman ejderha savaşı"na çeviriyor ve hedef aralığı tutturmuyor. Bu yüzden kural eklenmedi.
- **Öneriler (uygulanmadı; yalnızca sim senaryosu, canavar verisi değil):**
  - **Adult Red (%97):** eşlikçi Young ile aynı yapılsın (Wyvern + 2 Harpy). Savaş uzar, parti ejderhanın Algı menziline girer. Young (%70) ve Ancient (%66) bu eşlikçiyle aralıkta; Adult'un da benzer çıkması beklenir.
  - **Wyrmling (%95):** eşlikçi güçlendirilsin: Wyvern + 2 Harpy yerine 2 Wyvern + 2 Harpy ya da Wyvern + Troll + 2 Harpy.
  - **`chance` %25 (%13):** varsayılan eğilim %10'a insin ya da bu kipte eşlikçi 2 Harpy olsun.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan (yeni harita, eski "Volkan Adaları", 16.10)

Eski Volkan haritası kaldırıldı. "Volkan" artık üç adalı harita. Komut: `npm run sim -- 200 volkan volkan-ejder volkan-ejder-adult volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum.

| Senaryo | Düşmanlar | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | Wyvern, Troll, 2 Kurt | 4400 | **86%** | 7.2 | 0.43 | 32% | – | – |
| Uyuyan Young Red | Wyvern + 2 Harpy | 8600 | **70%** | 5.9 | 1.14 | 75% | 33% | 6% |
| Uyuyan Adult Red | 3 Harpy | 18600 | **97%** | 2.3 | 0.14 | 10% | 4% | 0% |
| Uyuyan Wyrmling | Wyvern + 2 Harpy | 3800 | **95%** | 5.3 | 0.65 | 54% | 30% | 83% |
| Uyuyan Young Red, `dragonWake: chance` %25 | Wyvern + 2 Harpy | 8600 | **13%** | 8.2 | 1.79 | 91% | 90% | 3% |

- **Normal ve Young Red** hedef aralıkta, değişiklik gerekmiyor (%86 ve %70).
- **Adult Red** neredeyse hiç uyanmıyor (%4). 3 Harpy'yi parti 2–3 turda yeniyor, savaş fiilen ejderhasız geçiyor.
- **Wyrmling** uyansa da yeniliyor; uyanınca kazanma %83.
- **Şansa bağlı kip** çok zor: ejderha %90 uyanıyor ve Young Red uyanınca parti neredeyse hiç kazanmıyor.
- **Öneriler (uygulanmadı; yalnızca sim senaryosu, canavar verisi değil):**
  - Adult Red'e Young Red'deki gibi uçan bir eşlikçi (Wyvern + 2 Harpy).
  - Wyrmling'e bir eşlikçi daha (Wyvern + 3 Harpy).
  - Şans kipi: eşlikçi azaltılabilir (2 Harpy) ya da varsayılan eğilim %25'ten %10'a indirilebilir.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan Adaları (16.10; bu harita artık `volkan`)

200 tohum:

| Senaryo | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan Adaları (normal; eski Volkan'ın düşmanları) | 4400 | **86%** | 7.2 | 0.43 | 32% | – | – |
| Uyuyan Young Red, 3 Harpy | 6500 | 97% | 2.4 | 0.15 | 10% | 4% | 0% |
| **Uyuyan Young Red, Wyvern + 2 Harpy (seçilen)** | 8600 | **70%** | 5.9 | 1.14 | 75% | 33% | 6% |
| Deneme: Young Red, Wyvern + 3 Harpy | – | 66% | – | 1.10 | – | 37% | 5% |
| Deneme: Young Red, Wyvern + Troll + 2 Kurt | – | 65% | – | 1.05 | – | 32% | 5% |

- Normal varyant eski Volkan'a yakın (%82 → %86). Üç ada arasında 2 sütun lav var; kara düşmanları orta adadan geçerek ada ada geliyor.
- Ejderha (8,3) partinin başlangıcına eski haritadakinden uzak. 3 Harpy ile neredeyse hiç uyanmıyor (%4), parti %97. Uçan Wyvern eklenince partiyi menzil içinde yakalıyor; parti %70.
- Bu simülasyon senaryosu; canavar verisine dokunulmadı.

## Volkan: ada atlaması yeniden (jumpTargets, 16.10)

Kural:
- Başka bir adaya atlanır.
- Hatta kalkış ve hedef adanın karası engel değildir; adanın içinden atlanır.
- Üçüncü ada ya da kaya hattı keser.

200 tohum:

| Senaryo | Önceki (ada bazlı) | **Şimdi** | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | 81% | **82%** | 5.2 | 0.70 | 44% | – | – |
| Uyuyan Young Red (3 Harpy) | 69% | **75%** | 3.8 | 0.48 | 28% | 26% | 2% |
| Uyuyan Adult Red (3 Harpy) | 74% (2 Harpy) | **70%** | 3.8 | 0.60 | 32% | 30% | 0% |
| Uyuyan Wyrmling (Wyvern + 2 Harpy) | 77% (Wyvern + Harpy) | **78%** | 6.3 | 0.59 | 41% | 61% | 64% |

- Parti artık adasının içinden orta adaya ve küçük adalara atlayabiliyor. Teşhiste başlangıç yerinden geçerli hedef 0'dı, şimdi 13. Düşman adasına aradaki orta ada yüzünden doğrudan atlanamıyor; ada ada gidiliyor.
- Ejderha varyantlarında parti yapay zekâsı ejderhanın Algı menziline atlamıyor. Atlasaydı Young %33, Adult %46 olurdu (uyanma %55–69).

## Volkan: ada bazlı atlama (16.10)

Kural:
- Başka bir adaya, arası yalnızca lav olan düz hatla ulaşılabiliyorsa o adanın herhangi bir boş altıgenine atlanır.
- Kenarda duran yaratık hattı kesmez.
- Adayı atlayıp ötekine geçmek yasak.

200 tohum:

| Senaryo | Önce (ilk kara) | **Şimdi (ada bazlı)** | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | 100% | **81%** | 6.7 | 0.55 | 36% | – | – |
| Uyuyan Young Red (3 Harpy) | 75% | **69%** | 4.1 | 0.55 | 35% | 32% | 3% |
| Uyuyan Adult Red (2 Harpy; önce 3 Harpy) | 70% | **74%** | 3.4 | 0.54 | 26% | 27% | 0% |
| Uyuyan Wyrmling (Wyvern, Harpy) | 79% | **77%** | 5.8 | 0.64 | 37% | 55% | 57% |
| Uyuyan Young Red, `chance` %25 | 34% | 32% | 6.9 | 1.24 | 67% | 72% | 5% |

- **Normal Volkan sonunda zorlaştı (%100 → %81).** Kara düşmanları artık küçük adalara ve kenarında yaratık duran adaların içine atlayabiliyor; partiye daha çabuk ulaşıyorlar. Düşman listesine dokunulmadı.
- **Ejderha varyantları %65–80 bandında.** Adult Red %64'e düştüğü için eşliği 3 Harpy'den 2 Harpy'ye indirildi (%74). Bu bir simülasyon senaryosu; canavar verisine dokunulmadı.
- Simülasyon yavaşladı (Volkan 200 savaş ~17 → ~43 sn), çünkü yapay zekâ her adım ada hatlarını tarıyor.

## Volkan: Uyuyan ejderha varyantı (16.10)

Ejderha varyanttan gelir; eşlik edenler az. `dragonWake: never` (varsayılan). Her satır 200 tohum.

| Senaryo | Ejderha | Eşlik | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal, değişmedi) | – | Wyvern, Troll, 4 kurt, 2 goblin | 4400 | 100% | 4.5 | 0.08 | 7% | – | – |
| Uyuyan Young Red | Young Red Dragon (CR 10) | 3 Harpy | 6500 | **75%** | 3.6 | 0.45 | 28% | 26% | 2% |
| Uyuyan Adult Red | Adult Red Dragon (CR 17) | 3 Harpy | 18600 | **70%** | 3.8 | 0.52 | 31% | 30% | 0% |
| Uyuyan Wyrmling | Red Dragon Wyrmling (CR 4) | Wyvern, Harpy | 3600 | **79%** | 5.6 | 0.60 | 35% | 53% | 59% |
| Uyuyan Young Red, `chance` %25 | Young Red Dragon | 3 Harpy | 6500 | 34% | 6.7 | 1.19 | 65% | 69% | 4% |

- **Kazanma koşulu:** Uyanık düşmanlar yenilince parti kazanır; ejderha uyurken sıvışılır. Bu yüzden sonuç neredeyse tamamen uyanma oranına bağlı.
  - Young ve Adult uyanırsa bu parti kaybediyor (uyanınca kazanma %0–2).
  - Wyrmling uyanınca da yenilebiliyor (%59). Bu yüzden onun eşlikleri daha güçlü, uyanma oranı daha yüksek.
- **Uyanmanın kaynağı:** çoğunlukla tur sonu Algı zarı. Partinin başlangıç bölgesinin tamamı ejderhanın 25 ft'i içinde.
  - Parti yapay zekâsı ejderha uyurken menzilden çıkıyor. Yakın dövüşe girmiş karakter ise yerinde kalıyor.
  - Uçan eşlikler (Harpy, Wyvern) partiyi menzil içinde yakaladığında Algı zarı atılıyor.
- **`chance` %25:** Düşmanlar ejderhayı sık uyandırıyor (%69); parti %34. GM için "zor" ayar.
- **`gm` kipi:** Simülasyonda GM düğmesine basan yok, yapay zekâ `never` gibi davranır. Sonuç Young satırıyla aynı.
- XP sütunu ejderhanın XP'sini de içeriyor.

## Volkan: ada atlaması yalnızca en yakın karaya (16.10)

Kural: hattın içi baştan sona lav, iniş ilk kara; adalar tek tek geçilir. `foeIsland: allow`, dolu hedef reddi ve hareketin yerine geçme aynı.

Volkan, 200 tohum:

| Kural | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Önceki: her adaya sınırsız, düşmanlı adaya da (`allow`) | 87% | 0% | 5.6 | 0.68 | 41% | 0.72 |
| **Yeni: yalnızca ilk karaya** | **100%** | 0% | 4.5 | 0.08 | 7% | 0.42 |
| Deneme: ilk karaya ama yürüdükten sonra da atlanır (uygulanmadı) | 100% | 0% | 4.2 | 0.07 | 6% | 0.52 |

Savaş başına (40 tohum, ölçüm betiği):
- Düşmanların atlaması 1.0, lava düşen düşman 0.25.
- Düşmanın tur sonu konumu: kendi adası 4.7, orta ada 1.75, partinin adası 0.35.
- Yakın dövüş saldırısı: düşman 6.7, parti 31.5.

**Neden kolay:**
- Partinin ve düşmanların adası arasında iki kanal var; ortada bir ada.
- Kenara yürü → atla → karşı kenara yürü → atla en az 4 tur sürüyor. Başlangıç bölgesi adanın içinde olduğundan ilk tur hep yürüyüşe gidiyor.
- Bu sırada düşmanlar lav kenarında sıcak dalgaya (1d6) ve partinin menzilli saldırısına ve alan büyülerine açık.
- HP %40'a inen düşman artık atlamıyor.
- "Yürüdükten sonra da atlanabilsin" denemesi de %100 verdi; sorun hareket kuralı değil, iki kanallı geometri.

**Öneri (uygulanmadı, canavar sayısına dokunmadan):**
- Düşman başlangıç bölgesini orta adaya ya da sağ adanın lav kenarına almak (ilk tur atlama olur).
- Ya da orta adaya iki yandan kara köprüsü eklemek.
- Bu ikisi atlama kuralını bozmadan geçişi bir iki tur kısaltır. Sonra yeniden ölçmek.

## Volkan: sınırsız ada atlaması (16.10)

**Güncel (kullanıcı kararı):**
- `foeIsland` kapatıldı (`allow`): düşmanlı adaya da atlanabiliyor.
- Dolu hedef altıgen hâlâ reddediliyor; yapay zekâ kuralları aynı.
- Yeniden ölçüm (200 tohum): parti **%87**, berabere %0, ort. tur 5.6, ort. ölen PC 0.68, en az 1 ölüm %41.
- Hedeflenen ~%87'de kaldı; Volkan düşman listesine dokunulmadı.

Kural:
- Lav üstünden her adaya atlanır; mesafe sınırı yok.
- DC = 10 + 2 × (lav altıgeni − 1).
- Atlama hareketin yerine geçer.
- Hedef altıgen doluysa reddedilir; düşmanlı adaya da atlanır (`foeIsland: allow`).
- Yapay zekâ güvenli iniş şansı %60'ın altındaysa ya da HP %40 ve altındaysa atlamaz.

Volkan, 200 tohum:

| Kural | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Önceki lavJump (sabit menzil, 5bdbeba) | 100% | 0% | 5.2 | 0.05 | 5% | – |
| İlk sürüm: düşmanlı adaya atlanmaz (`foeIsland: reject`) | 100% | 0% | 5.0 | 0.04 | 4% | 0.36 |
| **Güncel: düşmanlı adaya da atlanır (`foeIsland: allow`, uygulanan)** | **87%** | 0% | 5.6 | 0.68 | 41% | 0.72 |

Savaş başına (40 tohum):
- **İlk sürüm (`reject`):**
  - Düşmanlar 3.0 kez atlıyor, çoğu ortadaki boş adaya. 0.17'si lava düşüyor.
  - Taraf adaları kara ile bağlı değil; partinin adasına yalnızca uçan Wyvern ulaşıyor.
  - Kara düşmanları ortada kalıp menzilliyle eriyor: düşmanın yakın dövüş saldırısı 5.8, partininki 36.
- **Güncel (`allow`):**
  - Düşmanlar doğrudan partinin adasına atlıyor; yakın dövüş saldırısı 15.3'e çıkıyor.
  - Lava düşen düşman 1.65, parti 0.53 (atlama doğal 1 ve itme).

Önceki öneri uygulandı: (a) `foeIsland` kapatıldı.

## Volkan: riskli lav atlaması (`lavJump`, 5bdbeba)

Volkan 200 tohum: parti **100%** (değişmedi), berabere 0%, ort. ölen PC 0.05 (önce 0.04), en az 1 ölüm 5%, ort. tur 5.2.

Savaş başına (50 tohum):
- Düşmanlar 3.4 kez atlıyor. Bunların 2.2'si lav üstünden güvenli iniş, 1.1'i yanarak iniş (2d6 + Burning), 0.10'u doğal 1 ile lava düşme.
- İtmeyle birlikte lava düşen düşman savaş başına 0.32.
- Parti hiç atlamıyor: adasında kalıp gelenleri karşılıyor.

Kural düşmanların adacıklar arasındaki geçişini zorlaştırıyor: gelen düşman yanmış ve tek tek geliyor. Volkan zaten çok kolaydı. Öneri değişmedi: önce düşman başlangıç bölgesini kara köprüsüne almak, sonra yeniden ölçmek.

## Güncelleme: mağara ışığı, itme, gizlenme (16.10)

Aynı 8 senaryo × 200 tohum, kod d08eaf8'den önceki hâliyle (51aa65e). Yay kuralı değişmedi. Değişen satırlar:

| Senaryo | Parti kazandı (önce → şimdi) | Berabere | Ort. ölen PC | En az 1 ölüm | Neden |
|---|---:|---:|---:|---:|---|
| Volkan | 99% → **100%** | 0% → 0% | 0.09 → 0.04 | 7% → 4% | Parti, lav kenarındaki düşmanları lava itiyor |
| Mağara — karanlık | 43% → **37%** | 8% → 9% | 0.78 → 0.96 | 51% → 62% | Mağara artık %54 aydınlık (meşale yarıçapı 2): karanlıkta görülmeyen düşmanlar hedef alınamıyor, görünmeyen saldıran avantajlı (mağaradaki bütün canavarların karanlık görüşü var, partide Tavi ve Sela'nın yok) |

Diğer senaryolar aynı kaldı (Düz 25%, Çöl 61%, Orman 46%, Kale 53%, Taverna 99% / 94%).

**Mağara önerisi güncellendi:** 1 Giant Spider ve 1 Ghoul yerine Owlbear çıksın (3950 → 3250 XP); karanlık artık gerçekten etkili. Yay kuralı düzeltilince yeniden ölçülmeli.

## Özellik kullanımı (savaş başına ortalama, ilk 20 tohum)

| Senaryo | Sneak Attack | Hunter's Mark isabeti | Spiritual Weapon saldırısı | Spirit Guardians save'i | Action Surge | Second Wind | Fırsat saldırısı (parti / düşman) | Bozulan konsantrasyon |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz | 3.0 | 2.9 | 0.1 | 6.3 | 1.0 | 1.6 | 0 / 0 | 0.9 |
| Çöl | 1.1 | 1.6 | 6.0 | 0 | 1.0 | 2.3 | 0.5 / 0.5 | 1.6 |
| Volkan | 1.1 | 3.8 | 2.7 | 1.0 | 1.0 | 0.6 | 0 / 0.1 | 0.2 |
| Orman | 3.7 | 6.0 | 4.8 | 1.1 | 1.0 | 1.7 | 0.6 / 0.4 | 1.6 |
| Mağara | 4.3 | 1.7 | 4.6 | 0.8 | 1.0 | 1.0 | 0.8 / 1.1 | 1.3 |
| Kale | 0.1 | 4.0 | 5.5 | 0 | 1.0 | 1.1 | 0.1 / 0.3 | 1.9 |
| Taverna (ortada) | 1.9 | 3.6 | 3.5 | 0 | 1.0 | 0.6 | 0 / 0.1 | 0.7 |
| Taverna (uzakta) | 1.4 | 4.0 | 5.0 | 0 | 1.0 | 1.6 | 0.1 / 0 | 0.7 |

Haritasız savaşta fırsat saldırısı yalnızca yükseklik değiştirirken tetiklenir. Yapay zekâ yükseklik değiştirmediği için orada sıfır.

## Değişimin nedenleri

- **Düz (3% → 25%):** Bu savaş yakın dövüşte, hep aynı yükseklikte geçer, iki özellik de koşulsuz işler:
  - Spirit Guardians savaş başına ~6 save açar (yapılınca ve her düşmanın tur sonunda; haritasızda aynı yükseklikteki bütün düşmanlar yayılımda).
  - Sneak Attack'ın yandaş koşulu her turda tutar.

  Bunlara ek olarak Hunter's Mark ve Second Wind (savaş başına 1.6) partiyi ayakta tutuyor: ort. düşmüş PC 4.42 → 3.48. Yine de hedefin çok altında.
- **Çöl (43% → 61%):** En büyük katkı Spiritual Weapon'dan: savaş başına 6 ek büyü saldırısı. Yaylar çölde dezavantajlı olduğu için güç (yakın dövüş büyü saldırısı, yay değil) burada değerli. Bunu Second Wind (2.3) ve Action Surge izliyor. Sneak Attack azdır (1.1): Sela'nın yayı çölde dezavantajlı, dezavantajda Sneak Attack olmaz.
- **Volkan (99% → 99%):** Değişmedi. Neden hâlâ harita: kara düşmanları tek altıgenlik adacıklardan teker teker geliyor.
- **Orman (39% → 46%):**
  - Hunter's Mark (6 isabet) ve Sneak Attack (3.7): orman yakın dövüşe zorlar, yandaş koşulu sık tutar.
  - Spiritual Weapon (4.8).

  Kazancı kısmen yiyenler: düşmanların fırsat saldırıları ve konsantrasyonun sık bozulması (1.6).
- **Mağara (40% → 43%):** Az değişti:
  - Hunter's Mark karanlıkta görülmeyen hedefe taşınamıyor (1.7 isabet).
  - En çok fırsat saldırısını düşmanlar burada yapıyor (1.1). Dar geçitlerde parti erişimden çıkarken saldırı yiyor.
  - Berabere 6% → 8%: karanlıkta Spirit Guardians'ın hız yarılaması ve fırsat saldırısı korkusu yerinden kıpırdamayı azaltıyor.
- **Kale (43% → 53%):** Spiritual Weapon (5.5) ve Hunter's Mark (4.0). Sneak Attack neredeyse yok (0.1): Sela surdan uzak menzilde atıyor, hedefin yanında müttefik olmuyor.
- **Taverna ortada (21% → 99%):** Asıl neden kural değişikliği: masum ölümü artık kaybettirmiyor. Eski 21%'in neredeyse tamamı masum kaybıydı (eski ort. tur 2.3). Masumlar düşmanlara çok yakın ve ölüyor (0.72/4 kurtarılıyor). Düşmanlar ilk turlarını masumlara harcadığı için parti kolay kazanıyor.
- **Taverna uzakta (79% → 94%):** Kural değişikliği, eski 21% kaybın masum kaybından gelen kısmını kaldırdı. Spiritual Weapon ve Hunter's Mark kalanı getirdi. Masumların 3.68/4'ü kurtuluyor. Düşmanlar masum yerine partiye yöneldiği için ölen PC biraz arttı (0.22 → 0.42).

## Yay dezavantajı nereden geliyor (görev 3)

**Kaynak: veri güdümlü ortam kuralı. Yapay zekâ veya siper hesabı hatası değil.**

`data/environments.json` içinde şu ortamlarda bir kural var: `{"category": "weapon", "keywords": [...], "effect": "disadvantage"}`.

| Ortam (id) | Anahtar kelimeler | Not | Kullanan harita |
|---|---|---|---|
| Çöl / kavurucu sıcak (`l-kavurucu-s-cak`) | bow, crossbow | "Sıcak ve kum nişanı bozar" | çöl |
| Orman (`orman`) | bow, crossbow, javelin | "Ağaçlar atışı engeller" | orman |
| Yeraltı / mağara (`yeralt-ma-ara`) | bow, crossbow, javelin | "Dar alan ve karanlık atışı bozar" | mağara, zindan |
| Fırtına / yağmur (`f-rt-na-ya-mur`) | bow, crossbow, javelin, sling | "Rüzgâr ve yağmur atışı bozar" | ada ve gemi fırtınalı varyant |
| Sualtı / bataklık (`sualt-batakl-k`) | bow, crossbow, javelin, sling | "Suda atış güçleşir" | bataklık |
| Dağ / uçurum (`da-u-urum`) | bow, crossbow, javelin, sling | "Sert rüzgâr atışı saptırır" | dağ |

**Kod yolu:**
- `src/rules/modes.ts`, `environmentSources(env, tag)`: kuralın `keywords` listesini saldırının küçük harfli `tag` metninde alt dize olarak arar ve eşleşince dezavantaj kaynağı ekler.
- `tag` nereden gelir:
  - Karakterde silahtan: "ırk sınıf silah hasartürü", `weapons.ts`.
  - Canavarda: "ad saldırı hasar metni", `monsters.ts`.
- Kural haritanın her altıgeninde ve her mesafede uygulanır. Kaynağı konum değil, ortamdır.
- Yapay zekânın "kötü koşul" kontrolü (`poorOdds`) bu dezavantajı görür ve yakın dövüşe yürür. Bu bir tepki, kaynak değil.

**SRD 5.2.1 ile uyum** (Environmental Effects, s. 195; Underwater Combat, s. 16):
- **Dağ ve fırtına:** SRD'deki *Strong Wind* kuralı ile uyumlu: "ranged attack rolls with weapons" dezavantajlı. Sapan ve cirit dahil, doğru.
- **Sualtı / bataklık:** SRD'de sualtında menzilli silah saldırısı normal menzilde dezavantajlı, normal menzil ötesinde otomatik ıska. Bu kural yalnızca dezavantajı uyguluyor. Bataklığın tamamı "sualtı" sayılmamalı: SRD kuralı su altında savaşmak içindir.
- **Çöl, orman, mağara:** SRD'de karşılığı yok, ev kuralı:
  - Çöl sıcağı SRD'de yalnızca saatlik CON save ve Exhaustion.
  - Ormanın ve mağaranın etkisi SRD'de görüş (Lightly/Heavily Obscured) ve siperle verilir. Haritada bunu zaten siper altıgenleri, karanlık kuralı ve `sandstorm` kuralı yapıyor. Aynı etki iki kez sayılmış oluyor.

**Tasarımla uyum:** Harita sistemi siperi ve görüşü altıgen altıgen modelliyor. Ortamın yaylara harita boyu düz dezavantaj vermesi bunu gölgeliyor. Kael ve Sela çöl, orman ve mağarada savaş boyu dezavantajlı atıyor; Sela'nın Sneak Attack'ı da dezavantaj yüzünden tutmuyor.

**İki küçük kod bulgusu:**
- Eşleşme saldırının menzilli olup olmadığına bakmıyor. Javelin'in **yakın dövüş** seçeneği de ("javelin" kelimesi geçtiği için) orman, mağara, fırtına, bataklık ve dağda dezavantajlı oluyor.
- Kuraldaki `category: "weapon"` alanı kodda hiç kullanılmıyor.

**Düzeltme önerisi (uygulanmadı):**
1. Bu kural yalnızca menzilli saldırılara uygulansın: `environmentSources` çağrısına `ranged` bilgisi geçilsin, `category: "weapon"` kuralları yalnızca `ranged` iken eşleşsin.
2. Çöl, orman ve mağaradan bu kural kaldırılsın. Etkiyi harita kuralları zaten veriyor (siper, karanlık, kum fırtınası). İstenirse yalnızca "uzun menzilde ek dezavantaj" gibi daha dar bir ev kuralı yazılsın.
3. Fırtına ve dağ kalsın (SRD Strong Wind).
4. Sualtı / bataklık kuralı yalnızca sualtı altıgenlerine bağlansın ve SRD'deki "normal menzil ötesi otomatik ıska" eklensin.

## Sayı değişikliği önerileri (ilk yeniden ölçüme göre; yerini yukarıdaki güncel öneriler aldı)

Hedef %60–80. Canavar değerleri değişmesin; yalnızca senaryodaki düşman sayıları ayarlansın.

| Senaryo | Şu an | Öneri | Gerekçe |
|---|---:|---|---|
| Düz | 25% | Hill Giant çıkar (4850 → 3050 XP) | Haritasız savaşta siper, menzil ve kaçış yok; düşmanların hepsi ilk turdan vurur. 3050 XP, 5. seviye 5 kişi için "orta-yüksek" bütçe. |
| Çöl | 61% | Değişiklik yok | Hedefte. |
| Volkan | 99% | Önce harita: düşman başlangıç bölgesi adacıklardan kara köprüsüne alınsın; sonra gerekirse 2 Wolf yerine 1 Wyvern (uçan) | Kara düşmanları adacıklardan tek tek geliyor; yalnızca sayı artırmak sorunu çözmez. |
| Orman | 46% | Minotaur of Baphomet çıkar (4550 → 3850) | Yay dezavantajı düzeltilirse (yukarıdaki öneri) tek başına ~10 puan kazandırabilir; önce o, sonra yeniden ölç. |
| Mağara | 37% (9% berabere) | Owlbear çıkar (3950 → 3250) | Karanlık artık etkili (%54 aydınlık); yay dezavantajı düzeltilince yeniden ölç. Berabere oranı da düşmeli. |
| Kale | 53% | 2 Hobgoblin Warrior çıkar (3950 → 3750) | Hedefin hemen altında; küçük bir azaltma yeter. |
| Taverna (uzakta, varsayılan) | 94% | 1 Tough ekle ya da 1 Bandit Captain daha (2550 → ~2650–3000) | Kural değişikliğinden sonra fazla kolay. Ortadaki yerleşim (99%) aynı düşmanlarla. |

**Sıra:**
1. Önce yay kuralı düzeltilsin. Bu, çöl, orman ve mağarayı birlikte etkiler.
2. Sonra yeniden ölçülsün.
3. Ardından sayı değişiklikleri yapılsın.
