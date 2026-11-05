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

## Y1 sonrası

Karar noktası (`bestNow`'un yeri ve bonus/serbest havuz) artık **değerlendirici**: bütün adaylar gerçek çözücüyle kuru çalıştırılır (`previewCommand`, `src/battle/ai/preview.ts`) ve aynı puanla karşılaştırılır (`src/battle/ai/evaluate.ts`, ağırlıklar `data/yz-roller.json`). Eski elle yazılmış kurallar açıklayıcı olarak kayıtlı (`src/battle/ai/actions.ts` `registerAction`; kural önceliği `kuralOnceligi`); `state.yz.eski` eski zinciri çalıştırır.

### Kuru çalıştırma API'si

```ts
previewCommand(state: BattleState, cmd: Command, ctx?: CommandContext, opts?: { range?: boolean }): CommandPreview
// CommandPreview: { ok, error?, targets: TargetPreview[], friendlyFire, selfDamage, opportunity: {attackerId, damage}[],
//                   triggers: string[], events, spent: { slots: number[], resources: Record<string, number> }, actorPos?, runs }
// TargetPreview:  { id, ally, self, hitP?, critP?, saveP?, damage: {min, avg, max}, healing: {min, avg, max}, killP,
//                   conditions: Record<durum, P>, effects: Record<etki, P>, flags: Record<bayrak, P>, movedTo?, moveBy?, teleportedTo? }
```

Senaryolar: yoklama (d20 = 10) → saldırı ıska/isabet/kritik × save başarı/başarısız × hasar zarı alt/üst orta (+ en düşük/en yüksek). İsabet ve save olasılığı analitik (zar kipi dahil); ikinci şans (Heroic Inspiration, Indomitable, Lucky; Peerless Aim/Yazgı Mührü kendiliğinden isabet; Legendary Resistance) ıska/başarısız senaryosundan algılanır. Sınama: tam sayımla sapma < %1, 1000 isabetlik tohumlu gerçek saldırıyla isabet oranı 4 standart hata içinde (`preview.test.ts`).

### Kayıtlı açıklayıcılar (19)

| Kimlik | Tür | Kural önceliği | Not |
|---|---|---|---|
| `eski:itme` | hasar | 9 | ölümcül itme (lav, uçurum, batak, 20+ ft) |
| `eski:yenilenme` | hasar | 9 | yerdeki yenilenen düşmana ateş/asit |
| `eski:kontrol` | kontrol | 7 | Hold Person, Blindness, Resilient Sphere, Banishment/Dominate/Polymorph, Wall, kontrol alanı |
| `eski:iyilestir` | iyileştirme | 6 | ölmekte olan / çok yaralı dosta |
| `eski:soz` | hasar | 6 | Power Word Kill/Stun, Mass Heal |
| `eski:imzaIpucu` | kontrol | 5 | imza ipuçları, slot kapısından geçen |
| `eski:alan`, `eski:zemin`, `eski:nefes`, `eski:alanSaldiri` | hasar/kontrol | 3 | alan büyüsü, kalıcı zemin, Dragonborn nefesi, canavar alanı |
| `eski:yetenek` | hasar | 2 | SRD canavar yeteneği (ilk geçerli) |
| `eski:coklu` | hasar | 1 | SRD Multiattack planı |
| `eski:tek`, `eski:saldiri` | hasar | – | tek hedefli silah/büyü (4 düşman × 3 seçenek), canavar saldırıları (3 düşman) |
| `eski:imza`, `eski:imzaIpucuKapisiz` | kontrol | – | eylem harcayan imza özellikleri (yalnız puanıyla) |
| `g3:zihin` | kontrol | – | Zihin Gücü: Fırlat |
| `g3:itme` | kontrol | – | İt: çarpma, yere düşürme |
| `g3:yetenek` | hasar | – | canavar yetenekleri tek tek (ışınlanma, çekme, çağırma…) |

Bonus/serbest havuz (`bonusPoolCands`): Zihin Gücü İt/Çek/Yana/Taşı/Nesne, Yetişen Yol: Adım, Cloud's Jaunt / Blink Steps kaçışı, iyileştirme iksiri + bonus/serbest imza özellikleri. Hareket: tehlikeli altıgenden çıkış (`leaveHazard`), menzilli yer seçiminde yükseklik.

### Hâlâ kullanılmayan eylemler

| Eylem | Neden |
|---|---|
| Buyruk: Yer değiştir (İmparator) | dostun tepkisini harcar; değeri (dostun yeni konumu) önizlemede görünmez; aday üretilmez |
| Kuşbakışı Yerleştir, Zemin: Yol aç / Buz (Harita) | değeri harita geometrisine bağlı (yol açma, köprü); önizleme yalnız etkiyi görür; aday yok |
| Çizili Duvar, Zemin Yeniden Yaz (slot kapısı kapalıyken) | aday var ama değeri önizlemede sıfır, kaynak maliyeti eksi: seçilmez (kapı açıkken kural önceliğiyle seçilir) |
| Hazırla (Ready), Gizlen (yapay zekâ) | yok (eski) |
| Wild Shape biçim seçimi, çağırma büyüleri | eski basit kural (değerlendiricide değil) |
| Tepkiler | öneriyle (`askReaction` `suggested`); değerlendirici tepki seçmez |
| Hareket yeri seçimi | eski hızlı puan (`bestNow(there)`); her altıgen için kuru çalıştırma pahalı |
| Usta ileri bakış | yalnız aynı yaratığın aynı turdaki sonraki komutu; rakibin yanıtı değil |
