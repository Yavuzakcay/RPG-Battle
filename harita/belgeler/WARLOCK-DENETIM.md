# Warlock denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Emin olunmayan satırlar geçici vitest dosyalarıyla denendi ve silindi (depoda kalmadı).

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 70–76 (PDF'ten `pdftotext` ile okundu) ve `data/srd/classes.json` (Warlock), `data/srd/subclasses.json` (Fiend Patron). Sayfa numaraları PDF alt bilgisindeki SRD sayfasıdır.

**Oyun tarafı.** `data/class-features.json` (`warlock:*`, `invocations`, kaynaklar `magicalCunning`, `darkOnesLuck`, `hurlThroughHell`, `arcanum6–9`), `src/rules/invocations.ts`, `src/rules/builder.ts`, `src/rules/characterRest.ts`, `src/rules/stats.ts`, `src/battle/warlock.ts`, `src/battle/apex.ts` (Hurl), `src/battle/create.ts`, `src/screens/builder/Features.tsx`, `src/screens/Screens.tsx`, Fiend alt sınıf kaydı `src/rules/fixtures/srd-alt-siniflar.json`.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **sapma** (bilinçli sapma, kayıtlı karar). **[bilinen]** = DECISIONS.md ya da denetim belgelerinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'den bilinçsiz sapma.

## Özet

| | Sayı |
|---|---|
| Denetlenen satır | 75 |
| tam | 42 |
| kısmi | 16 |
| yok | 1 |
| bilinçli sapma | 12 |
| diğer (kapsam dışı 1, boş yer tutucu 1, denenmedi 1, bilgi 1) | 4 |
| satır başına **[YENİ]** (kayıtsız) bulgu | 11 |
| **[hata]** (SRD'ye aykırı, bilinçsiz) | 1 (A7) |

En önemli bulgular:

1. **[hata] Magical Cunning geri kazanım miktarı yanlış** (A7): oyun "harcananın yarısı (yukarı)" veriyor, SRD "**en çok** azami slotun yarısı (yukarı)" diyor. 11+ seviyede 2 slot harcanmışsa SRD 2 geri verir, oyun 1. DECISIONS ve EN/TR düğme metni yanlış okumayı yazmış.
2. **[YENİ] Hurl Through Hell büyü saldırısında tetiklenmiyor** (D9): SRD "attack roll" der (büyü saldırısı dahil); kanca yalnız silah saldırısı yolunda. Warlock'un ana saldırısı Eldritch Blast olduğu için özellik fiilen çalışmıyor.
3. **[YENİ] Pact of the Tome'un 3 cantrip'i yalnız Warlock listesinden** (C4): SRD "herhangi bir sınıfın listesi".
4. **Serüven seviye atlaması yalnız seviyeyi artırır** (C1, **bilinen**: DECISIONS M4 "Karar bekleyen"): yeni Invocation, cantrip ve hazır büyü seçimi sorulmaz; oluşturucuya gidilmedikçe eksik kalır.
5. **Invocation kartında 24 / 28 açıklama ham geliştirici notu** (E2, **[YENİ]**): EN arayüzde Türkçe dev notu, TR'de de "Kuyruk 19", "anahtar …" gibi iç ifadeler görünür.

## 0. Sınıf çekirdeği ve tablo (SRD s. 70–71)

| # | Kural (SRD) | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| 0.1 | d8 HP zarı, WIS+CHA save, 2 beceri (Arcana, Deception, History, Intimidation, Investigation, Nature, Religion), Simple silah, Light zırh (s. 70) | `data/classes.json` birebir aynı | tam | veri karşılaştırması | — |
| 0.2 | 1–20 tablo: Invocations 1/3/3/3/5/5/6/6/7/7/7/8/8/8/9/9/9/10/10/10 (s. 71) | `invocationSlots` tablo sütunundan okur | tam | geçici test: 1–20 sayıları SRD ile aynı | Görev WARLOCK |
| 0.3 | Cantrip 2→3 (4.)→4 (10.), Prepared 2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15 | `spellLimits` | tam | geçici test: 20 seviye de aynı | K6 / sayılar SRD tablosundan |
| 0.4 | Slot sayısı 1 (1.), 2 (2–10), 3 (11–16), 4 (17+); slot seviyesi 1,1,2,2,3,3,4,4,5… | `spellSlotsFor` | tam | geçici test: 20 seviye de aynı | Görev WARLOCK |
| 0.5 | Başlangıç ekipmanı A/B (s. 70) | denetlenmedi (sınıf geneli kayıt) | kapsam dışı | — | — |

## A. Savaş içi

| # | Kural (SRD) | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Pact slotları tek seviyede; düşük seviyeli büyü bu slotla o seviyede yapılır, "level 1 spell'i 3. seviye slotla 3. seviye olarak" (s. 71) | Burning Hands 5. seviyede `slotLevel` verilmese de verilse de 3. seviye slotu harcar ve 5d6 atar; Hex 3. seviye slotla | tam | geçici test: `slotLevel` yok / 1 / 2 / 3 → hepsi `slot_spent level 3`, 5d6 | — |
| A2 | Birden çok slot kaynağıyla etkileşim | Tek sınıf (çoklu sınıf yok); slotsuz kaynaklar ayrı (kaynak sayaçları, `atWill`, Arcanum) ve slota dokunmaz | tam (kapsam: çoklu sınıf yok) | geçici test: Arcanum yapımı slotları değiştirmedi; `atWill` False Life slotu değiştirmedi (warlock.test) | — |
| A3 | Magical Cunning: 1 dakikalık ayin, savaş dışı (s. 72) | Savaşta yok, dinlenme panelinde | sapma | `Screens.tsx` RestPanel | Görev WARLOCK **[bilinen]** |
| A4 | Eldritch Smite: turda bir, pact silahı isabeti, Pact slotu harcar, 1d8 + slot seviyesi başına 1d8 Force, Huge ve küçüğe Prone (s. 72) | `eldritch_smite` komutu; kritikte zarlar iki kat; Prone `size !== 'G'`; eylem harcamaz | tam | `warlock.test` Smite (4d8 Force, Prone, ikinci kez red); kod `warlock.ts` | Görev WARLOCK |
| A5 | Agonizing Blast: seçilen hasar cantrip'inin hasar zarlarına CHA (s. 72) | `cantripMods.ability`; Eldritch Blast'te her ışın | tam | `warlock.test` (her ışında 1 + CHA) | Görev WARLOCK |
| A6 | Repelling Blast: Large ve küçüğü ≤ 10 ft iter (s. 74) | Her isabet eden ışında tam 10 ft (SRD "up to": 0–10 seçimi yok) | tam (basitleştirme) | `warlock.test` | Görev WARLOCK |
| A7 | **Magical Cunning**: harcanan Pact slotlarından **azami slotun yarısını (yukarı) aşmayacak kadarı** geri gelir (s. 72) | `Math.ceil(spent / 2)` (harcananın yarısı) | **kısmi [hata]** | geçici test (azami/harcanan → oyun, SRD): 11. sv 3/2 → **1, SRD 2**; 17. sv 4/2 → **1, SRD 2**; 11. sv 3/3 → 2 ✓; 5. sv 2/2 → 1 ✓; 20. sv Eldritch Master ✓. `warlock.test` yalnız 2/2 durumunu sınar, hata kaçıyor | Görev WARLOCK yanlış yazılmış ("harcananın yarısı"); Kuyruk 19 (Eldritch Master) aynı kalıp |
| A8 | Eldritch Master (20.): Magical Cunning bütün harcanmış slotları geri verir (s. 72) | `master` ise `spent` kadar | tam | geçici test 20. sv | Kuyruk 19 |
| A9 | Thirsting Blade (5+, Pact of the Blade): yalnız pact silahıyla 2 saldırı; Devouring Blade (12+): 3 (s. 74, 72) | `pactAttacks` 2/3, `economy.pactOnly` | tam | `warlock.test` (K13); ön koşul testi | K13, Kuyruk 19 (0f) |
| A10 | Lifedrinker (9+, Blade): turda bir +1d6 Necrotic/Psychic/Radiant, HP zarı harca, zar + CON iyileş (s. 73) | Hedefe en çok işleyen tür otomatik; eksik HP yeterliyse zar otomatik harcanır (oyuncu seçimi yok); anahtar `lifedrinkerFull` | sapma | `warlock.test` Kuyruk 19 Lifedrinker | Kuyruk 19 (0f) **[bilinen]** |
| A11 | Pact of the Blade: bonus eylemle silah çağırma / büyülü silaha bağlanma; yetkinlik; CHA; Necrotic/Psychic/Radiant ya da normal tür (s. 74) | Silah karakter sayfasında seçili ve elde başlar; bonus eylem ve bağlanma yok; yetkinlik, CHA, tür seçimi var | sapma | `create.ts`; `warlock.test` | Kuyruk 19 (0f) **[bilinen]** |
| A12 | Pact of the Chain: Find Familiar slotsuz, özel 7 biçim, Attack'ta bir saldırıdan vazgeçip familiar'ı tepkisiyle saldırt (s. 74) | `atWill` + özel biçimler + `familiar_strike` | tam | `k19chain.test` | Kuyruk 19 (0f) |
| A13 | Investment of the Chain Master (5+, Chain): uçuş/yüzme 40, bonus eylem Attack, Necrotic/Radiant, senin DC'n, tepkiyle direnç (s. 73) | Hepsi var; direnç tepkisi yalnız isabet hasarında, save'li hasarda sorulmaz | kısmi | `class-features.json` notu; `k19chain.test` | Kuyruk 19 (0f) **[bilinen]** |
| A14 | Eldritch Mind (CON save avantajı, konsantrasyon) (s. 72) | `damage-effects.ts:47` avantajlı d20 | tam | kod | — |
| A15 | Devil's Sight (2+): Dim Light ve Darkness, büyülü dahil, 120 ft (s. 72) | `darkvision` ≥ 120; büyülü karanlık dahil (`maprules.ts`) | tam | kod | Görev WARLOCK |
| A16 | Armor of Shadows: Mage Armor kendine slotsuz (s. 72) | Zırhsızsa savaş başında etkin; `atWill self` | tam | `warlock.test` (AC 13 + DEX) | Görev WARLOCK |
| A17 | Ascendant Step (Levitate), Otherworldly Leap (Jump), Master of Myriad Forms (Alter Self), One with Shadows (Invisibility, loş ışık ya da karanlıkta), Fiendish Vigor (False Life, zarın en yükseği) (s. 72–74) | Hepsi `atWill` yalnız kendine; One with Shadows ışık koşulu `oneWithShadows` anahtarıyla; Vigor 12 geçici HP | tam | `warlock.test` (Vigor, One with Shadows) | Görev WARLOCK, Kuyruk 19 |
| A18 | Eldritch Spear: menzil + 30 × Warlock seviyesi, ≥ 10 ft cantrip (s. 73) | `rangePerLevel` | tam | geçici test: uygun cantrip listesi | Görev WARLOCK |
| A19 | Witch Sight (15+): 30 ft Truesight (s. 74) | `senses.truesight` | tam | `warlock.test` | Kuyruk 19 (0f) |
| A20 | Gaze of Two Minds (5+): dokun, onun duyularıyla gör, ≤ 60 ft ise büyüyü onun yerinden yap (s. 73) | Bonus eylem; "bitişik gönüllü dost" (dokunma yaklaşığı); uzatma bitişiksiz | tam | class-features notu | Kuyruk 19 (0f) |
| A21 | Gift of the Protectors (9+, Tome): CHA kadar ad, 0 HP → 1 HP, uzun dinlenmeye dek bir kez (s. 73) | Ad yazmak savaş dışı; savaş başında CHA kadar dost otomatik yazılı; ilk tetikte hepsi düşer | sapma | class-features notu | Kuyruk 19 (0f) **[bilinen]** |
| A22 | Gift of the Depths (5+): su altı soluk, Swim = hız, Water Breathing günde **bir** (s. 73) | Yüzme + `deepWater`; Water Breathing sayaçsız `atWill` (savaş dışı büyü) | kısmi | `class-features.json` | Kuyruk 19 (0f) **[bilinen]** (savaş dışı); sayaç yokluğu **[YENİ]**, etkisiz |
| A23 | Savaş dışı slotsuz büyüler: Mask of Many Faces, Misty Visions, Whispers of the Grave, Visions of Distant Realms (s. 73–74) | `atWill` + "savaş dışı" etiketi, Game Master notu | tam (savaş dışı) | class-features | Görev WARLOCK |
| A24 | Konsantrasyon, ritüel ve Contact Patron'un slotsuz yapımı savaşta | bkz. C3 | — | — | — |

## B. Oluşturucu ve seviye atlama

| # | Kural (SRD) | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | 28 Invocation seçeneği, ön koşullar (seviye, "X Invocation") (s. 72–74) | 28/28 kayıt; id, `minLevel`, `requires`, `repeatable` SRD metnine göre **birebir** (betikle karşılaştırıldı); durum alanı 28'de `ok` | tam | betik: sapma 0 | Görev WARLOCK, Kuyruk 19 |
| B2 | Sayı: tablodaki Invocation sayısı kadar; ön koşulu sağla (s. 70) | `invocationProblems`: sayı, bilinmeyen, seviye, `requires`, tekrar | tam | geçici test: 1. sv Agonizing → "2. seviyeden"; 2. sv 3 yerine 1 → sayı sorunu; 11. sv Devouring → "12. seviyeden"; Gift of the Protectors Tome'suz → ön koşul; Witch Sight 14. sv red / 15 ok | Görev WARLOCK |
| B3 | Tekrarlanabilir (Agonizing, Repelling, Spear): her seferinde farklı cantrip | Doğrulama destekler (aynı cantrip iki kez red) | tam | geçici test: aynı cantrip → "iki kez seçilemez"; farklı cantrip ok | Görev WARLOCK |
| B3b | Aynı Invocation'ı **ikinci kez** (başka cantrip için) seçmek | Arayüzde düğme seçilince kapanır (basınca kaldırır); "+" düğmesi yalnız Lessons için var | kısmi **[YENİ]** | `Features.tsx:35–70` (yalnız `repeatable === 'feat'` için "+") | — |
| B4 | Uygun cantrip: "Warlock cantrip" (s. 72) | Bilinen cantrip'lerden süzülür; Warlock dışı cantrip zaten seçilemiyor (Tome hariç, C4) | tam | geçici test: Agonizing Blast:Fire Bolt → "uygun bir cantrip seçilmeli" | — |
| B5 | Seviye atlayınca bir Invocation'ı değiştir; ön koşul olan değiştirilemez (s. 70) | Seviye başına tek değişim sınırı yok (karakter serbestçe düzenlenir); ön koşul olanı çıkarınca bağlı olan uyarılır, `fitRestored` bağlıyı düşürür | sapma | geçici test: Pact of the Blade çıkınca Thirsting Blade düşer | K17 `CLASS_BOUND` **[bilinen]** (genel yaklaşım) |
| B6 | Pact of the Tome: 3 cantrip + 2 ritüel (1. sv, herhangi sınıf listesi), "zaten hazır olmayan" (s. 74) | Ritüel listesi 11 büyü, SRD'deki bütün 1. sv Ritual'ler (SRD verisi ile aynı). Cantrip: **yalnız Warlock listesi**, toplam cantrip sayısına +3 eklenir | kısmi **[YENİ]** | geçici test: Tome ile Fire Bolt için uyarı yok, ama Fire Bolt Agonizing için uygun sayılmıyor (listede değil); `spellOptions` Tome'u bilmez | Görev WARLOCK "+3 cantrip" |
| B7 | Lessons of the First Ones: bir köken feat'i, tekrarlanabilir (s. 73) | Alert, Magic Initiate (liste seçilir), Savage Attacker, Skilled = SRD'nin dört köken feat'i | tam | `invocations.ts` `LESSON_FEATS` | Kuyruk 19 (0f) |
| B8 | Pact weapon: Simple ya da Martial **Melee** (s. 74) | Arayüz yalnız yakın dövüş silahı listeler; menzilli silah seçilmiş bir kayıt uyarı vermez, sessizce pact olmaz | kısmi **[YENİ]** (düşük) | geçici test: Longbow → uyarı yok, `pact` bayrağı yok | — |
| B9 | Prepared Spells: kademe tavanı = slot seviyesi; hazır büyüler sayıya girmez (s. 71) | `maxLevel` slot seviyesi; Fiend/Contact her zaman hazır listeler `spellNames` dışında | tam | geçici test (5. sv `known` listesi); `spellCounts` | K6 |
| B10 | Cantrip/hazır büyüyü seviye atlayınca değiştir (s. 71) | Seviye başına sınır yok (serbest düzenleme) | sapma | B5 ile aynı | **[bilinen]** (genel yaklaşım) |
| B11 | ASI 4/8/12/16, Epic Boon 19 (Boon of Fate önerilir) (s. 72) | Yuvalar tablodan; Epic Boon'ların özel etkileri yok | kısmi | `advancementSlots`; Bilinen eksikler "Feat'ler" | **[bilinen]** |
| B12 | Mystic Arcanum seçimi: 11/13/15/17. seviyede 6./7./8./9. seviye Warlock büyüsü, değiştirilebilir (s. 72) | Oluşturucuda `spellPicks` seçicisi (Wlk listesi, seviye eşiğiyle); seçilmezse **ilk uygun savaş büyüsü** otomatik | sapma (otomatik varsayılan) | `create.ts` `arcanumPicks`, `Features.tsx` | Kuyruk 19 (görev 3) **[bilinen]** |
| B13 | Fiend alt sınıfı 3. seviyede; Warlock büyü listesi (SRD s. 74–76) | Liste 0–9 seviye **SRD ile birebir aynı** (cantrip 7, 1. sv 12, 2. 10, 3. 11, 4. 5, 5. 7, 6. 4, 7. 4, 8. 5, 9. 7) | tam | geçici test: eksik 0, fazla 0 | `srd:buyu` eşitlemesi |
| B14 | Fiendish Resilience seçimi (Force dışı) (s. 76) | 12 tür (Force yok), varsayılan Fire, oluşturucuda seçilir | tam (seçim yeri bkz. C6) | fikstür `srd-alt-siniflar.json` | Görev WARLOCK |

## C. Dinlenme, Serüven ve kayıt

| # | Kural (SRD) | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Seviye atlayınca yeni Invocation / cantrip / hazır büyü seç | Serüven `level_up` yalnız `sheet.level` artırır; seçim adımı yok; yeni Invocation sayısı eksik kalır (oluşturucuda uyarı), yeni hazır büyü eklenmez; Fiend Spells ve Arcanum otomatik gelir | kısmi | `src/journey/seruven.ts` `seruven_leveled` | DECISIONS M4 "Karar bekleyen" **[bilinen]** |
| C2 | Pact Magic: kısa **ve** uzun dinlenmede bütün slotlar (s. 71) | `shortRest` Pact slotlarını doldurur; uzun dinlenme de; yolculuk kısa dinlenmesi aynı fonksiyon | tam | `warlock.test`; `engine.ts:126` | Görev WARLOCK |
| C3 | Contact Patron (9.): Contact Other Plane her zaman hazır; **slotsuz bir kez**, save'i otomatik geçer; uzun dinlenmeyle yenilenir (s. 72) | Büyü her zaman hazır (9. sv `known`); slotsuz yapım ve kaynak sayacı yok: büyü 5. seviye Pact slotu harcar; otomatik başarı yok (büyü savaş dışı) | kısmi | geçici test: `free: true` → "kullanım hakkı yok", normal yapım slot harcadı | `class-features.json` notu (savaş dışı) **[bilinen]** |
| C4 | Mystic Arcanum: günde bir slotsuz, uzun dinlenmede yenilenir, yukarı slot yok; 6–9 (s. 72) | Kaynaklar `arcanum6–9` (seviye eşiğiyle), `freeSpellList`; slotsuz yapım slotları korur; ikinci yapım red; yukarı seviye red; uzun dinlenmede dolar, kısa dinlenmede dolmaz | tam | geçici test: 11. sv Circle of Death → `arcanum6` 1→0, slotlar aynı, ikincisi red; 13/15/17'de `arcanum7–9` var | Kuyruk 19 (görev 3) |
| C5 | Magical Cunning: uzun dinlenmeye dek bir kez (s. 72) | Kaynak `magicalCunning` (uzun dinlenmede dolar, kısa dinlenmede dolmaz); tekrar kullanım `null` | tam | `warlock.test` | Görev WARLOCK |
| C6 | Magical Cunning'in kullanılabildiği yer | Yalnız karakter listesi dinlenme paneli; Serüven, yolculuk ve Game Master kurulumunda düğme yok (kısa dinlenme Pact slotlarını zaten doldurur; fark yalnız kısa dinlenme sınırı dolunca) | kısmi **[YENİ]** | `magicalCunningStatus` yalnız `Screens.tsx:253`'te | — |
| C7 | Fiendish Resilience: **her kısa/uzun dinlenmede** türü yeniden seç (s. 76) | Seçim oluşturucudaki `featureChoices` (sabit); dinlenmede seçici yok | sapma | `characterRest.ts` | Görev WARLOCK "dinlenmede değişim = oluşturucuda düzenleme" **[bilinen]** |
| C8 | Kaydet/yükle | Kaynaklar (`magicalCunning`, `darkOnesLuck`, `hurlThroughHell`, `arcanum*`) `status.resources`'ta; uzun dinlenme `rechargeResources`; savaş sonu karaktere yazılır | tam (kod okumasıyla; gerçek kaydet-yükle turu denenmedi) | `characterRest.ts` | H-SLOT |
| C9 | Seviye atlamada Pact slot seviyesi değişirse (ör. 4→5: 2. sv → 3. sv slot) | Slot durumu indeks başınadır; eski seviyede harcanan slot yeni indekste "harcanmamış" sayılır → seviye atlayınca harcanmış Pact slotu bedavaya yenilenir | kısmi **[YENİ]** (düşük) | geçici test: 4. sv bir slot harcanmış → 5. sv `[0,0,2]` (dolu) | H-SLOT kayıt kalıbı **[bilinen]** (genel); Warlock etkisi **[YENİ]** |

## Fiend Patron (SRD s. 76)

| # | Kural (SRD) | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| F1 | Dark One's Blessing: düşmanı 0 HP'ye düşürünce (ya da yakınındaki başkası, ≤ 10 ft) CHA + Warlock seviyesi geçici HP, en az 1 (s. 76) | Her komutun sonunda önce/sonra karşılaştırması; 10 ft = 2 altıgen; daha yüksek geçici HP varsa değişmez | tam | `warlock.test` (CHA + 5); `warlock.ts` `blessingEvents` | Görev WARLOCK |
| F2 | Fiend Spells tablosu: 3 (Burning Hands, Command, Scorching Ray, Suggestion), 5 (Fireball, Stinking Cloud), 7 (Fire Shield, Wall of Fire), 9 (Geas, Insect Plague) (s. 76) | Fikstürde aynı; 3/5/7/9'da her zaman hazır, hazır sayısına girmez | tam | PDF tablosu ↔ fikstür; geçici test: 3. sv 4 büyü, 5. sv +2, 9. sv hepsi | Görev WARLOCK; Kuyruk 19 (7/9 satırları) |
| F3 | Dark One's Own Luck: kontrol ya da save'e +1d10, **zarı gördükten sonra**, CHA (en az 1) kez, tur başına yalnız zar başına bir, uzun dinlenmede yenilenir (s. 76) | Başarısız kontrol/save'e 1d10; **tutarsa kullanım harcanır** (tutmazsa harcanmaz); saldırı zarına eklenmez; kaynak `max(1, CHA)` | sapma | `warlock.test`; `effectDice.ts:92` (`reroll: onFail`) | Görev WARLOCK **[bilinen]** (ikinci şans kalıbı; SRD'de tutmasa da kullanım harcanır) |
| F4 | Fiendish Resilience (10.): Force dışı bir tür, dinlenmede değişir (s. 76) | Seçilen türe direnç savaş başında | tam / sapma C7 | `warlock.test` | Görev WARLOCK |
| F5 | Hurl Through Hell: **attack roll** isabeti, CHA save (büyü DC), başarısızsa 8d10 Psychic (Fiend değilse) ve Incapacitated, sonraki turunun sonuna dek, ortadan kalkar, geri döner (s. 76) | Silah isabetinde otomatik (karar sorulmaz), save, 8d10, Incapacitated var; hedef **yerinde** kalır | sapma | `apex.ts` `hurlEvents`; geçici test (silah isabeti: kaynak 1→0, Incapacitated ✓) | Kuyruk 19 **[bilinen]** |
| F5b | Hurl: **büyü saldırısı** (Eldritch Blast) isabeti de tetikler | Tetiklenmiyor: kancayı yalnız silah saldırısı yolu çağırıyor | **yok [YENİ]** | geçici test: 14. sv Eldritch Blast isabeti → kaynak 1'de kalır, Incapacitated yok; `grep hurlEvents` yalnız `features.ts:415` | — |
| F5c | Hurl: slotla yenileme ("Pact slotu harca, eylem yok, kullanım geri gelir") | Yok | kısmi **[YENİ]** | `grep hurlThroughHell`: yalnız `apex.ts` ve kaynak tanımı | DECISIONS yalnız "uzun dinlenmede bir" yazar |

## D. Yapay zekâ

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Eldritch Blast ışın sayısı ve Agonizing puanı | `ai.ts:361` | tam | kod | Görev WARLOCK |
| D2 | Thirsting Blade: pact silahı sonrası ek saldırılar puana girer, pact dışı silaha geçmez | `ai.ts:352–354`, `economy.pactOnly` | tam | `warlock.test` | K13 |
| D3 | Eldritch Smite: hedef 20+ HP ya da kritik; slot açıksa | `ai.ts:1924–1934` | tam | kod | Görev WARLOCK |
| D4 | Arcanum ve slotsuz büyüler `freeCast` ile öncelikli | `ai.ts:330, 1924` | tam | kod | Kuyruk 19 |
| D5 | Hurl Through Hell kararı | Karar yok, isabette otomatik (oyuncu gibi) | sapma | `apex.ts` | Kuyruk 19 **[bilinen]** |
| D6 | Slotsuz Invocation büyülerinin (Levitate, Jump, Invisibility, False Life) YZ kullanımı | **denenmedi**; `castable` `freeCast`'i sayar, ama bu büyülerin değerlendirmesi ayrıca doğrulanmadı | kısmi (denenmedi) **[YENİ]** | — | — |
| D7 | Magical Cunning, Contact Patron: YZ kullanmaz (savaş dışı) | — | sapma (uygun) | — | — |
| D8 | Denge ölçümü | Sim partisi `buyucu` (Mor: Warlock 9. sv); `k18-warlock` ile `sim:imza`; Warlock'lu karma ölçüm DENGE.md'de | tam | `data/sim-partiler.json`; DECISIONS H9 | **[bilinen]** |

## E. Arayüz ve TR/EN

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Invocation adları İngilizce (kullanıcı kararı) | Her iki dilde İngilizce | tam | `Features.tsx` | SD4 |
| E2 | Invocation açıklamaları | `aciklamalar-tr.json` yalnız **4 / 28** Invocation içerir; kalan 24'ünde ⓘ ham `note` metnidir. TR'de "Kuyruk 19", "anahtar lifedrinkerFull", "DECISIONS" gibi geliştirici dili; **EN arayüzde bu notlar Türkçe** (4'ü "Description available in Turkish only" der) | kısmi **[YENİ]** | `Features.tsx:39`; `aciklamalar-tr.json` `invocation` 4 kayıt | SD4 tablosu "Invocation 28 / 24 / 4" **[bilinen sayı]**; ham not görünmesi **[YENİ]** |
| E3 | Ön koşulu eksik Invocation | Seviyesi yetmeyenler listede **hiç görünmez**; "önce Pact of the X" gereken düğme nedensiz pasif (başlık/ipucu yok) | kısmi **[YENİ]** (düşük) | `Features.tsx:35,40` | — |
| E4 | Sorun metinleri TR/EN | `issueText` TR ve EN (invCount, invLevel, invRequires, invOnce, invDup, invFeat…) | tam | `strings.en.ts:365–369` | SD4 |
| E5 | Magical Cunning düğmesi ve bildirim | TR/EN var; metinler "yarısı (yukarı)" der (A7'deki yanlış okuma) | kısmi | `strings.ts:102`, `strings.en.ts:95` | A7 düzelince metin de değişir |
| E6 | Pact slot göstergesi | Savaş ve dinlenme panelinde slot seviyesi tek; **denenmedi** (ekran görüntüsü alınmadı) | denenmedi | — | — |
| E7 | Eski belgeler | `docs/SEVIYE-DENETIMI.md` ve DECISIONS "Mystic Arcanum çalışmıyor / yok" satırları Kuyruk 19 öncesi; güncel durum C4 | bilgi | DECISIONS (Kuyruk 17 satırı ~3575) | — |

## Düzeltme önerileri

Önceliğe göre. "Kural sürümü" sütunu: değişiklik savaş durumunu etkiliyorsa yeni sürüm gerekir (replay uyumu); dinlenme/oluşturucu değişikliği sürüme bağlı değil.

| # | Düzeltme | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|
| 1 | **Magical Cunning**: geri kazanım `min(harcanan, ceil(azami / 2))`; `warlock.test` yeni durumlar (11. sv 3/2, 17. sv 4/2); düğme metinleri (TR/EN) ve DECISIONS düzeltmesi | Yüksek (11+ seviyede doğru slot sayısı; SRD) | Gerekmez (dinlenme paneli, savaş durumunda değil) | Küçük (~0,5 saat) |
| 2 | **Hurl Through Hell**'i büyü saldırısı isabetine de bağla (`spells.ts` saldırı yolu); ardından slotla yenileme (Pact slotu harca, eylemsiz) ve isteğe bağlı yerden alma/geri dönme | Yüksek (Eldritch Blast'li Fiend'de özellik şimdi fiilen çalışmıyor) | Gerekir (olay akışı değişir; K19 anahtarı `featuresK19` altında mevcut sürümden itibaren, eski kayıtta yok) | Orta (1–2 saat: tetik + test; slotla yenileme ayrı) |
| 3 | **Pact of the Tome cantrip'leri**: SRD "herhangi bir sınıfın listesi"; `spellOptions`'a Tome açıkken tüm sınıfların cantrip'lerini ekle, +3 sınırını ayrı say (Magic Initiate gibi `alternativeCantrips`) | Orta (oluşturucu; savaş kitine etkisi) | Gerekmez (oluşturucu seçimi, DECISIONS K19: "oluşturucu seçimi olduğu için sürüme bağlı değil") | Orta (1–2 saat) |
| 4 | **Serüven seviye atlama seçim adımı** (Invocation / cantrip / hazır büyü / ASI; "Karar bekleyen" M4) | Yüksek (Serüven'de Warlock yeni Invocation hiç almaz) | Gerekmez (Serüven durumu, savaş değil); kayıt `seruven_leveled` olayı genişlerse Serüven kayıt uyumu | Büyük (yarım gün; tüm sınıfları kapsar, Warlock'a özel değil) |
| 5 | **Invocation ⓘ metinleri**: 24 eksik Türkçe açıklamayı `aciklamalar-tr.json` `invocation`'a yaz; `note` yedeği kullanıcıya gösterilmesin (dev notu); EN'de "yalnız Türkçe" notu | Orta (kullanıcıya görünen, EN arayüz) | Gerekmez | Küçük–orta (~1 saat, SRD metninden 24 satır) |
| 6 | **Magical Cunning'i dinlenme akışlarına taşı**: yolculuk/Serüven kısa dinlenme kartı ve Game Master kurulumu | Düşük (kısa dinlenme Pact slotlarını zaten doldurur) | Gerekmez | Küçük |
| 7 | **Tekrarlanabilir Invocation "+" düğmesi** (Agonizing/Repelling/Spear ikinci cantrip için) | Düşük–orta (birden çok hasar cantrip'li Warlock) | Gerekmez | Küçük (~0,5 saat) |
| 8 | **Dark One's Own Luck**: SRD'ye göre kullanım zarı eklenince harcanır (tutmasa da); şimdi "tutarsa harcanır" (cömert) | Düşük–orta (YZ ve oyuncu dengesi) | Gerekir (zar kancası) | Küçük; denge ölçümü gerekir, bu yüzden karar bekleyen |
| 9 | **Seviye atlamada Pact slot kayması** (C9): `slotMax` karşılaştırmasını "harcanan sayısı" olarak taşı | Düşük | Gerekmez | Küçük |
| 10 | Pact weapon menzilli silah seçilmişse uyarı; Gift of the Depths Water Breathing sayacı; YZ'nin slotsuz Invocation büyülerini denemek (D6) | Düşük | Gerekmez | Küçük |
| 11 | Eski belge satırlarını güncelle (E7) | Düşük | — | Çok küçük |

**Not.** #1 ve #2 için önce `src/battle/warlock.test.ts`'e başarısız olacak testler eklenmesi önerilir. Bu belge hiçbir kod, veri ya da testi değiştirmedi.

## B93 düzeltmeleri (Görev B93, kural sürümü 93)

"Sürümlü": savaş davranışı değişti, 92 ve altı kayıt/replay eski davranışta. "Sürümsüz": veri, arayüz, oluşturucu ya da Serüven.

### A. Ortak

- C1 Serüven seviye atlaması (Invocation, cantrip, hazır büyü, Mystic Arcanum birer değişim; yeni seçim serbest): **düzeldi** (sürümsüz; `levelChoices.ts`, Fiendish Resilience türü uzun dinlenmede değişir: C7 Serüven'de **düzeldi**).

### D. Warlock

- A7 / E5 Magical Cunning: **düzeldi** (sürümsüz, dinlenme: `min(harcanan, ⌈azami / 2⌉)`; TR/EN bildirim metni).
- F5b Hurl Through Hell büyü saldırısı isabetinde de: **düzeldi** (sürümlü 93; alt sınıf: bizim metin "Saldırı isabetinde"). F5c slotla yenileme: **dokunulmadı** (alt sınıf, bizim sürüm metninde yok).
- B6 Pact of the Tome cantrip'leri her sınıfın listesinden (en çok Tome sayısı kadar başka listeden; Agonizing/Repelling/Spear bunlara da): **düzeldi** (sürümsüz, oluşturucu; `tomeCantrips`, `classScoped`, büyü adımında ayrı bölüm).
- E2 24 Invocation'ın TR açıklaması (`aciklamalar-tr.json` `invocation`, 28/28); ⓘ'de geliştirici notu (`note`) artık gösterilmez, EN arayüzde SD4 "yalnız Türkçe" notu: **düzeldi**.
- B3b tekrarlanabilen Invocation'ı başka cantrip için ikinci kez alma ("+" düğmesi, her alım ayrı cantrip seçicisi): **düzeldi**.
- E3 ön koşulu eksik Invocation düğmesinde neden ("Önce X seçilmeli."): **düzeldi**.
- B8 menzilli pact silahı uyarısı: **düzeldi** (oluşturucu sorunu).
- C9 seviye atlayınca Pact slot seviyesi değişirse harcanan sayısı taşınır: **düzeldi** (sürümsüz; `characterRest.ts` `pactShift`).
- C1 / C7 Serüven: A2 ile (bkz. A).
- **Ertelendi / dokunulmadı:** C6 Magical Cunning'i Serüven ve kurulum dinlenmesine taşımak (düşük; kısa dinlenme Pact slotlarını zaten doldurur), A22 Water Breathing sayacı (savaş dışı, etkisiz), D6 YZ slotsuz Invocation büyüleri (denenmedi, ayrı YZ ölçümü), F3 Dark One's Own Luck (alt sınıf; bizim metin "d10 eklersin", denge ölçümü gerektirir), bilinçli sapmalar (A3, A10, A11, A21, B5, B10, B12, C7 dışı, D5).
