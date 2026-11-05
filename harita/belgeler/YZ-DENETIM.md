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

## Y2 bulguları (2026-11-05)

Yöntem: Mağara ve Kale, 25 tohum, eski (`YZ_ESKI=1`) ve yeni yapay zekâ aynı tohumlarla; her karar ve komut kaydedildi (geçici teşhis betiği): tur içinde aynı altıgene dönüş, eylem harcamadan tur bitirme, değerlendiricinin en iyi puanı, Trol'ün 0 HP'den kalkışı, beraberlikte ayakta kalanlar. 100 tohum sonuçları DENGE.md "Kuyruk Y2".

### En büyük üç neden (sayılarla)

| # | Neden | Ölçü (25 tohum) | Y1 | Eski | Y2 |
|---|---|---|---:|---:|---:|
| 1 | **Tur içi ileri-geri yürüme.** Değerlendiricinin seçtiği komut ile hareket yeri taramasının kullandığı eski `bestNow` farklı hedef seçince: (a) "kötü koşul" (dezavantaj/yoğun siper) yeri değiştirme, değerlendiricinin seçimi kötü ama eski kural yeni yerde iyi buluyor → yürü → orada değerlendirici yine başka (kötü) hedef seçiyor → geri; (b) partinin "%25 daha iyi saldırı yeri" karşılaştırması iki uçta farklı seçicilerle. Hareket boşa gidiyor, eylem çoğu kez yapılmadan tur bitiyor. | aynı tur aynı altıgene dönüş, Mağara | 280 | 17 | 1 |
| | | aynı ölçü, Kale | 53 | 1 | 0 |
| | | parti eylemsiz tur bitirme, Mağara | 161 | 124 | 55 |
| 2 | **Yerdeki Trol'e büyü saldırısı boşa (motor hatası).** `spells.ts` büyü saldırı döngüsü `hp <= 0` hedefte duruyordu; 0 HP'de yenilenmeyi bekleyen Trol'e Fire Bolt hiç atılmıyordu (yalnız eylem harcanıyordu). Eski kural "yerdeki yenilenene ateş" (öncelik 9) her tur aynı boş komutu seçti; Trol her tur kalktı. Eski YZ de etkileniyordu. | yalnız Trol ayakta düşman zaferi | 6 | 1 | 3 |
| | | 100 tohumda Mağara beraberliği (düzeltmeden önce / sonra) | 14% | 11% → 1% | 12% → 6% |
| | | örnek: tohum 26 Trol'ün 0 HP'den kalkışı | – | – | 17 → 0 (6. turda zafer) |
| 3 | **Kendini koruma puanının baskınlığı.** Yer değiştiren her aday için maruziyet farkı tam canda da ×0,2 ağırlıkla cezalanıyordu; sağlıklı yakın dövüşçünün yaklaşması ve hücumu (Trol Charge: −4,5 korunma, toplam −2) eksiye düşüyor, "olumlu aday yok" ile tur yürüyerek geçiyordu. | düşman "en iyi aday ≤ 0" ile eylemsiz bitirme | 20 | – | 0 |

Ayrıca: **Trol uzvu kimlik çakışması** (motor hatası): Loathsome Limbs aynı turda iki kez koparsa iki uzuv aynı kimliği alıyor, sırada iki kez yer alıp tur ilerlemiyordu (2000 adım koruması → beraberlik); 25 tohumda 1 (tohum 3), eski ve yeni YZ'de aynı.

Görüş/karanlık nedeniyle hedefsizlik ("aday yok") iki yapay zekâda da benzer (parti eylemsiz bitirmelerinin büyük kısmı karanlıkta görülen düşman yokken); "son bilinen konuma ilerleme" eklenmedi (hedefler tuttuğu için; açık madde). Turlar arası konum tekrarı (6 turda 2 altıgen) eski ve yenide aynı düzeyde (24–28 / 25 tohum): yeni bir sorun değil.

### Düzeltmeler (genel kural, senaryo kuralı yok)

- Kötü koşul yer değiştirmesi: değerlendiricinin seçimi kötü koşullu olsa da eski kural burada iyi koşullu bir eylem buluyorsa yürünmez (beklenen değer dezavantajı zaten içeriyor); ikisi de kötüyse eskisi gibi daha iyi yere yürür.
- "Daha iyi saldırı yeri" ve Sneak Attack yeri: buradaki değer eski kuralın seçimiyle de ölçülür (iki uç aynı ölçüyle).
- Kendini koruma (`korunma`): ağırlık can oranına bağlı, `korunmaEsik` (0,5) üstünde 0, 0 canda `korunmaTavan` (2,0); bütün zorluklarda aynı.
- Motor: büyü saldırısı yenilenmeyi bekleyen hedefe atılır; çağrılan yaratık kimliği çakışırsa ek sonek.
- "N tur hasar yok → saldırganlık" sigortası gerekmedi (yapay zekâ durumsuz; neden ortadan kalkınca beraberlik %6'ya indi).

### Başarım (G2)

Önbellekler (durum nesnesi başına, `WeakMap`; durum değişmez olduğundan karar değişmez): `tryCmd` (komut denemesi), `previewCommand` (kuru çalıştırma), `bestNow` (yaratık başına), varsayımsal konum durumu `at` (aynı altıgen aynı nesne: hareket yeri taramaları önbelleği paylaşır). Önizlemede zarsız senaryo ikizi: alt-orta çalıştırma hiç hasar zarı istemediyse üst-orta/en düşük/en yüksek çalıştırılmaz (sonuç aynı). Sayaçlar `aiStats` (yalnız ölçüm). Arayüz: "Düşmanı oynat" düşman turlarını tek tek, aralarında bir çerçeve bırakarak oynatır. Süre tablosu DENGE.md.

### Usta (G3)

Ek terimler (yalnız Usta, `data/yz-roller.json` `zorluk.usta`): öldürme garantisi (`kesin`: ölüm olasılığı 0,4'ün üstündeyse öldürme değerine +%60 × fazlalık), odaklı ateş (`odak`: hasar × eksik can oranı × 0,5), tehdit sırası (`tehdit`: hasar × (tehdit / en büyük tehdit − 0,5) × 0,3), slot zamanlaması (`zamanlama`: düşük tehditli hedefe slot/kaynak +%50 × (1 − oran) maliyet). Ölçüm: Normal'e göre ortalama −2 puan (Kale −7, Orman −6). Olası neden (doğrulanmadı): Usta odak/tehdit terimleri ağır yakın dövüşçüye yığılıyor, kalabalık düşmanda (Kale 17, Orman 14) zayıf ama çok sayıda düşmanı azaltmak daha değerli; ileri bakış rakibin yanıtını görmüyor. Tek deneme yapıldı (kapsam); Usta **deneysel** (`difficultyNote`).
