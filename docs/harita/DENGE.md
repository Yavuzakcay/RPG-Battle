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

## Volkan Adaları (16.10)

200 tohum:

| Senaryo | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan Adaları (eski Volkan'ın düşmanları) | 4400 | **86%** | 7.2 | 0.43 | 32% | – | – |
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
