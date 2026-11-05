# YZ denetimi (Y1 G0)

> 2026-11-05, dal `wip/y1` (wip/k54c'den), kural sürümü 28. Bu bölüm yalnız tarama: mevcut yapay zekânın karar noktaları, hiç değerlendirmediği eylemler ve K50/K53/K54 raporlarındaki "YZ kullanmıyor" listelerinin birleşimi. Y1'in çerçevesi aşağıda "Y1 sonrası" bölümünde.

## Mevcut yapı (Y1 öncesi)

Tek giriş `chooseCommand` / `chooseEnemyCommand` (`src/battle/ai.ts`, ~1.960 satır) → `decide`. Karar **sıralı kural zinciri**: ilk geçerli kural komutu döndürür; eylemler birbiriyle karşılaştırılmaz. Değerlendirme `tryCmd` (komutu `noRoll = 0.5` ile bir kez çalıştırma) ve elle puanlar (`partyOptions` ortalama hasar, `commandScore`, `risk`).

| Karar noktası | İşlev | Ne yapıyor | Not |
|---|---|---|---|
| Hedef sırası | `byPriority`, `foesOf` | yakalanan, Vex, sahibini koruma, hedef koşucusu, İnfazcı hükümlüsü, uzaklık, can oranı | tehdit/destek/konsantrasyon önceliği yok |
| Hareket | `reachable`, `risk`, `firstMove`, `guardMove`, `moveToward`, `climbToward`, `jumps` | en ucuz + güvenli altıgen; menzilli bitişikten kaçınır; %25 daha iyi saldırı yerine yürür | yükseklik tercihi yok (yalnız tırmanma); siper/görüş hattı yalnız `poorOdds` ile |
| Bonus özellikler | `bonusFeature` | Rage, Second Wind, Cunning Action, Misty Step… sıralı | |
| Karadul | `karadulAi` | bakış → dönüşüm → ısırık | |
| İmza alt sınıflar | `imzaAi` + `imzaHintCmds` (`imzaAi.ts`) | ipucu sezgiselleri (K54b/K54c), genel kural: bonus boşken, eylemde 2+ hedef ya da kontrol; 3.+ slot dururken eylem harcayan kontrol/zemin yalnız ≥3 düşmanda | slot değeriyle karşılaştırma yok (K50/K54b hatası buradan) |
| Moral | `moral_rally` | çökmüş dostu toparlama | |
| Fighter / Haste / çağrı | `surge`, `hasteNow`, `steerCommand`, `hordeBreakerCmd`, yan el | | |
| Smite / Eldritch Smite / Stunning Strike / Flurry | eşik kuralları | hedef HP eşiği, kritik | |
| Cleric / Wizard kontrol | `clericChoice`, `holdChoice`, `blindChoice`, `sphereGuard`, `banishChoice`, `wallChoice`, `controlArea` | | |
| Druid / Bard / Bless | Wild Shape, Bardic Inspiration, saldırı güçlendirme | | |
| Reckless | | HP > yarı ve STR silahı en iyiyse | |
| Kaçış | `stuckInBog`, `escape_grapple`, `escape`, `stand_up`, `teleportEscape` (yalnız Misty Step türü büyüler, yarı can altında, bitişikte düşman) | | Cloud's Jaunt / Blink Steps yok |
| Hedefler (S3/K16D) | `goalCommand`, `enemyObjective`, `enemyKeg`, `partyTent`, `enemyDoor`, `patrolCommand` | | |
| En iyi eylem | `bestNow` | sıra: ölümcül itme → iyileştirme → yenilenme kesme → alan büyüsü → Power Word → zemin büyüsü → nefes → (Sneak Attack en iyisi) → ilk yararlı silah/büyü; canavar: yetenek → alan saldırısı → büyü → Multiattack planı → saldırılar | **ilk uygun kural kazanır**; kaynak maliyeti, kontrol değeri, dost ateşi (yalnız alan büyüsünde), tehlikeli altıgen yok |
| Canavar | `abilityCommand`, `areaAttack`, `multiPlanCommand`, `monsterCommands`, `powerWordCommand` | | |
| Boss | `bossFlightMove`, efsanevi eylemler (`boss.ts` `legendaryEvents`, kendi seçimi) | | |
| Metamagic | `withMetamagic` | Twinned, Quickened | |
| Tepkiler | `askReaction` önerisi (`suggested`) | Shield, Counterspell, Parry, Uncanny Dodge, Cutting Words, imza tepkileri (Sabır, Tam Zamanında, Mucize, Yol devralma, Müdahale, Takip, Omuz Ver, Yazgı Değişir, Ölümsüz Dize, Dostunun Yası) | kancasız Rng'de öneri = karar; tepkiler çalışıyor |
| Yüzey | `reactionHurtsSide` (K55), `surfaceRisk` (`risk` içinde) | alan büyüsünde dost hasarı varsa seçmez | yüzeyi silah olarak kullanma yok (yalnız buhar cezası) |

## Hiç değerlendirilmeyen eylemler (Y1 öncesi)

| Eylem | Sistem | Kaynak |
|---|---|---|
| Zihin Gücü: Çek, Yana kaydır, Taşı, Nesne, Fırlat | Yaşlı Bilge (K54) | DECISIONS K54 G1 |
| Yetişen Yol: Adım | Hızır (K54) | serbest eylem; tepki devralmaları öneriyle çalışıyor |
| Nesne fırlatma, enkaz çağırma | K53 `objectMotion` | yalnız Zihin Gücü üstünden |
| Çarpmalı itme (duvar/nesne/yaratık) | K53 `forcedMove` + `carpmaHasari` | `deadlyShove` yalnız lav/uçurum/bataklık/20 ft düşüş |
| Yüzeye itme (yağlı/yanıcı altıgen) | K53 + K55 | yok |
| Işınlanma kaçışı: Cloud's Jaunt, Blink Steps, Find Steed Fey Step | K53 `teleport` | yalnız büyüler |
| Canavar ışınlanma/itme yetenekleri | `monsterAbilities.ts` | yetenekler genel `abilityCommand` sırasıyla |
| Sarf eşyası (`use_item`) | Kuyruk 43 | hiç (A0) |
| Kuşbakışı: Yerleştir, Zemin: Yol aç / Buz | Harita (K54b) | |
| Buyruk: Yer değiştir | İmparator (K54c) | |
| Karşılaştırmalı seçim | hepsi | slot/kaynak maliyeti, kontrol değeri, rol |

## Birleşik "YZ kullanmıyor" listesi (K50 / K53 / K54 / K54b / K54c raporları)

| Kaynak | Madde | Y1'de |
|---|---|---|
| K50 | Büyü slotu dururken eylem harcayan imza özelliği büyünün yerine geçmiyor (Dunganga, Harita) | değerlendiricide kaynak maliyeti + rol |
| K53 | Çarpma hasarı için itme; nesne fırlatma ve enkaz; Cloud's Jaunt / Blink Steps kaçışı | eylem açıklayıcı |
| K54 G1 | Zihin Gücü yeni kipleri (Çek, Yana, Taşı, Nesne, Fırlat) | eylem açıklayıcı |
| K54 G2 | Yetişen Yol: Adım (tepkiler öneriyle çalışıyor) | eylem açıklayıcı |
| K54b | Kuşbakışı Yerleştir, Yol aç, Buz; Dunganga kontrolünün değeri | değerlendirici (kontrol değeri) |
| K54b | Kontrol ipuçları güçlü büyünün yerine geçiyordu (ölçümde Dunganga %27, Harita %9) | kaynak maliyeti |
| K54c | Buyruk: Yer değiştir | değerlendirilmez (kalan) |
| A0 | Sarf eşyası | eylem açıklayıcı (iyileştirme iksiri) |
