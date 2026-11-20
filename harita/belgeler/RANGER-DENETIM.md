# Ranger denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Emin olunmayan satırlar geçici vitest dosyalarıyla denendi (`src/battle/zzTmpRanger*.test.ts`) ve silindi; depoda yalnız bu belge var.

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 57–61 (`pdftotext -layout`; sayfa numaraları PDF alt bilgisindeki SRD sayfasıdır) ve Hunter's Mark büyüsü s. 141; `data/srd/classes.json` (Ranger), `data/srd/spells.json`. `icerik/` (gitignore) bu checkout'ta yok: **Hunter mekaniği depodaki fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:932`; CLAUDE.md: paketle "aynı kimlik ve mekanik"). Gerçek paketteki Türkçe adlar ve metinler görülmedi. Mobil/APK'da `icerik/` olmadığı için Hunter paket içe aktarılmadıkça seçilemez (bilinen, DECISIONS AS2).

**Kapsam.** Yalnız Ranger'a özgü kurallar ve Ranger'ın dayandığı genel kurallardan sınıfa özgü kısım (Weapon Mastery hakkı, Expertise sayısı, Fighting Style yuvası, Extra Attack). Büyü bazlı mekanik farklar `harita/belgeler/BUYU-DURUM.md` kapsamındadır; burada yalnız Ranger listesinin sayımı verildi.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar ya da kayda alınması gereken sapma) · **doğrulanmadı** (bu denetimde çalıştırılamadı, tahmin yazılmadı). **[bilinen]** = DECISIONS.md ya da denetim belgelerinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye aykırı, bilinçsiz.

**Kullanıcı ipucu notu.** "Hazırlanan büyü sayısı WIS + seviye/2" 2014 kuralıdır. SRD 5.2.1'de sayı Ranger Features tablosundan gelir (s. 58): 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15. Oyun tabloyu kullanıyor (B1, 20/20 seviye probe ile aynı).

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d10, STR+DEX save, Simple+Martial silah, Light/Medium zırh + Shield, 3 beceri (Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival), başlangıç ekipmanı A/B | 57 |
| S2 | Spellcasting (1): WIS, slot tablosu, hazırlanan sayı tablodan, seçilen büyüler slot seviyesine uygun, her uzun dinlenmede **bir** büyü değişimi, Druidic Focus odak, cantrip yok | 57–58 |
| S3 | Favored Enemy (1): Hunter's Mark **her zaman hazır** (sayıya girmez), slotsuz 2 kez (2/2/2/2/3/3/3/3/4/4/4/4/5/5/5/5/6/6/6/6), uzun dinlenmede dolar | 58 |
| S4 | Weapon Mastery (1): iki silah türünün ustalığı, uzun dinlenmede tür değişimi | 58–59 |
| S5 | Deft Explorer (2): bir beceride Expertise + iki dil | 59 |
| S6 | Fighting Style (2): Fighting Style feat'i ya da Druidic Warrior (iki Druid cantrip'i, WIS, her Ranger seviyesinde birini değiştir) | 59 |
| S7 | Alt sınıf (3), ASI (4/8/12/16), Epic Boon (19) | 58–59 |
| S8 | Extra Attack (5) | 59 |
| S9 | Roving (6): +10 ft hız (Heavy zırhsız), Climb ve Swim hızı = Hız | 59 |
| S10 | Expertise (9): iki beceride daha | 59 |
| S11 | Tireless (10): Magic action 1d8+WIS geçici HP, WIS (en az 1) kullanım, uzun dinlenme; kısa dinlenmede Exhaustion −1 | 59 |
| S12 | Relentless Hunter (13): hasar Hunter's Mark konsantrasyonunu bozmaz | 59 |
| S13 | Nature's Veil (14): bonus eylem, sonraki turunun sonuna dek Invisible, WIS (en az 1) kullanım, uzun dinlenme | 59 |
| S14 | Precise Hunter (17): Hunter's Mark'lı yaratığa saldırılarda avantaj | 59 |
| S15 | Feral Senses (18): 30 ft Blindsight | 59 |
| S16 | Foe Slayer (20): Hunter's Mark zarı d10 | 59 |
| S17 | Ranger büyü listesi: 48 büyü (13/15/12/5/3, seviye 1–5) | 60 |
| S18 | Hunter: Hunter's Lore (3), Hunter's Prey (3: Colossus Slayer / Horde Breaker, kısa ya da uzun dinlenmede değişir), Defensive Tactics (7: Escape the Horde / Multiattack Defense), Superior Hunter's Prey (11), Superior Hunter's Defense (15) | 61 |
| S19 | Hunter's Mark (büyü): bonus eylem, 90 ft, +1d6 Force her isabette, Perception/Survival avantajı, hedef 0 HP'ye düşünce bonus eylemle taşınır | 141 |

## Özet

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 30 | 23 | 5 | 0 | 1 | 1 |
| B) Oluşturucu / seviye atlama | 11 | 7 | 2 | 0 | 2 | 0 |
| C) Dinlenme, Serüven, kayıt | 6 | 3 | 2 | 0 | 0 | 1 |
| D) Yapay zekâ | 6 | 4 | 0 | 1 | 1 | 0 |
| E) Arayüz ve TR/EN | 6 | 3 | 1 | 0 | 0 | 2 |
| **Toplam** | **59** | **40** | **10** | **1** | **4** | **4** |

(Sayım tablo satırlarının durum sütunundan: "tam (…)" tam, "kısmi (…)" kısmi sayıldı. **[YENİ]** bulgu sayısı: 8. **[hata]**: 2 (A22, B3).)

## En önemli bulgular

1. **[YENİ, hata] Hunter's Mark oluşturucuda "her zaman hazır" değil** (B3). Savaşta her Ranger'a otomatik ekleniyor (probe: seviye 1 `spellNames` = seçilenler + Hunter's Mark), ama oluşturucu `kit.alwaysPrepared`'a yazmıyor: büyü seçicide normal büyü gibi görünür, seçilirse hazır sayısına girer (probe: HM + 5 büyü = 6/6) ve **öneri listesi ilk sırada Hunter's Mark'ı seçer** (probe: seviye 1 öneri `["Hunter's Mark","Cure Wounds"]`: SRD'nin 2 hakkından biri boşa gider). Simülasyon partilerinde de HM hazır listesinde sayılıyor (`data/sim-partiler.json`, Kael: 6 büyünün biri HM).
2. **[YENİ, hata] Horde Breaker iki şartı denetlemiyor** (A22). SRD: "aynı silahla" ve "bu tur saldırmadığın" bir yaratığa. Probe: bu tur zaten saldırılmış yaratığa `horde_breaker` kabul edildi; Shortsword'dan sonra Longbow ile de kabul edildi.
3. **[YENİ] Yapay zekâ Tireless ve Nature's Veil'i hiç kullanmıyor** (D4). `ai.ts`'te bu kaynaklara bakan kod yok; seviye 14 Ranger'la canı 15/124 iken YZ'nin dört komutu Hunter's Mark, Cure Wounds, end_turn oldu.
4. **Superior Hunter's Defense yalnız saldırı isabeti ve alan save hasarında** (A26): SRD "hasar aldığında". Süren etki, yalnız ağır isabette öneri ve tur sonuna dek direnç çalışıyor (probe). DECISIONS 6449 "tur sonuna dek süren direnç yok" diyor; bu eski, Kuyruk 19'da eklendi (**[YENİ]** kayıt düzeltmesi).
5. **Serüven seviye atlaması yalnız seviyeyi artırır** (C4, **bilinen**: DECISIONS 4971 M4 "Karar bekleyen"): yeni hazır büyü, 9. seviye Expertise, Fighting Style, Deft Explorer ve Weapon Mastery seçimleri sorulmaz.
6. İyi haber: sayısal tablolar (hazır sayısı, slotlar, Favored Enemy kullanımı, Expertise, saldırı sayısı, hız) 20/20 SRD ile aynı; Ranger büyü listesi 48/48 SRD ile aynı; Hunter's Mark, Foe Slayer, Precise Hunter, Relentless Hunter, Nature's Veil, Tireless, Feral Senses probe ile doğru çalışıyor.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Büyü yeteneği WIS; DC ve saldırı bonusu (s. 58) | `casting.ability: wis`; WIS 18 + yetkinlik 3 → DC 15, saldırı +7 (probe) | tam | `data/classes.json` (ranger); probe | — |
| A2 | Slot tablosu 1–20 (s. 58): 2 slot (1.–2. sv), 3 (3.–4.) … 4/3/3/3/2 (19.–20.) | `deriveStats.spellSlots` 20/20 SRD ile aynı (yarım büyücü; 2014 yuvarlama yok) | tam | probe: 20 seviye karşılaştırması | — |
| A3 | Savaşta yalnız hazırlanan büyüler yapılır | Savaşçının `spellNames` = hazırlananlar + Hunter's Mark (probe) | tam | `src/battle/create.ts:229-232`, probe | 6904 |
| A4 | Favored Enemy: HM her zaman hazır; slotsuz 2 → 6 kez, uzun dinlenmede dolar (s. 58) | Kaynak `favoredEnemy` (`uses.column: "Favored Enemy"`), `freeSpell: "Hunter's Mark"`; 20/20 tablo aynı; slotsuz yapım slotu korur (probe: 3 → 2, slotlar aynı); hak bitince slot harcanır; açık `slotLevel: 1` slot harcar (probe) | tam | `data/class-features.json:51-62`; probe | 6902, 6904 |
| A5 | Hunter's Mark: bonus eylem, +1d6 Force her isabette; kritikte zarlar ikiye (s. 141) | Cast bonus eylem harcar (probe); silah isabetinde +1d6 force; kritikte 2 zar (probe: [2,1]); **büyü saldırısında da** (Produce Flame `spell_followup`, probe: ek hasar var, Precise Hunter nedeni de yazılı) | tam | `src/battle/features.ts:185-189`, `src/battle/spells.ts:795-801`; `features.test.ts:145-172`; probe | 8167 |
| A6 | Hedef 0 HP'ye düşünce işaret bonus eylemle yeni yaratığa taşınır; konsantrasyon sürer | Hedef ölünce konsantrasyon durur (probe: `targetId: B` korunur); `spell_followup` ile taşınır (probe: D'ye); hedef ayakta iken reddeder ("İşaret yalnızca … 0 HP'ye düşünce taşınır") | tam | `src/battle/features.ts:701-708`; probe | 8167 |
| A7 | Yukarı slot: konsantrasyon 3–4'te 8 sa, 5+'ta 24 sa (s. 141) | Veride `upcast.duration: true`; savaşta etkisiz (savaş süresi 1 saatten kısa) | tam (savaşta etkisiz) | `data/spells.json` (hunters-mark) | — |
| A8 | HM: hedefi bulmak için Perception/Survival avantajı | Uygulanmıyor (savaş dışı kontrol sistemi yok) | bilinçli sapma | `data/spells.json` metni; DECISIONS 4557 | 4557 |
| A9 | Weapon Mastery: iki tür (s. 58–59) | Kit `weaponMastery.count: 2`, `swap: all`; etkiler savaşta otomatik | tam | probe (lv 1–20: count 2); `class-features.json:1349-1356` | Görev P0 |
| A10 | Extra Attack (5) | Seviye 4'te 1, 5'te 2 (probe); YZ iki saldırı yapıyor (probe) | tam | probe | Görev F |
| A11 | Fighting Style feat'i ya da Druidic Warrior: iki Druid cantrip'i, WIS, Ranger büyüsü sayılır (s. 59) | Yuva `featSlot` kategorisi "Fighting Style" + `alternatives: druidic-warrior`; seçenek 11 Druid cantrip'i (Starry Wisp dahil), en çok 2; savaşçıda `spellNames`'e girer, DC 15 / saldırı +7 (WIS) (probe); Produce Flame çalıştı | tam | `class-features.json:1219-1235`; `k19feat2.test.ts:124`; probe | 4553 |
| A12 | Roving: +10 ft hız, Heavy zırhsız (s. 59) | Seviye 6'da 30 → 40 ft; Chain Mail (Heavy) ile +10 yok (probe: 20 ft) | tam | `src/rules/classFeatures.ts:306-316`; probe | 4552 |
| A13 | Roving: Climb ve Swim hızı = Hız | `roving` işareti `climbs()` ve `swimsByTrait()`: tırmanma ek maliyeti yok, çok derin suya girer; yalnız anahtar `featuresK19` altında. Duvar tırmanışı (K68b) ve sığ/derin suda yüzme maliyeti bu denetimde **çalıştırılmadı** | kısmi (kısmen doğrulanmadı) | `src/battle/flight.ts:74-82`; `k19feat2.test.ts:60-70` (derin su) | 4552, 2973 |
| A14 | Tireless: Magic action, 1d8 + WIS (en az 1) geçici HP; WIS (en az 1) kullanım | Eylem harcar, `temp_hp` 8 = 1d8(5) + 3 (probe); kullanım 3 (WIS +3) (probe); `temp_hp` yükseltir (üst üste binmez) | tam | `src/battle/divine.ts:187-196`; `class-features.json:1548-1559`; probe | 4648 |
| A15 | Relentless Hunter (13) | 12. seviyede konsantrasyon save'i var, 13'te yok (probe) | tam | `src/battle/damage-effects.ts:90`; probe | Görev F |
| A16 | Nature's Veil: bonus eylem, sonraki turunun sonuna dek Invisible; WIS kullanım | Bonus eylem, Invisible; kendi turunda kullanınca sonraki turunun sonunda biter (probe: 2. turun sonu); kaynak `naturesVeil` WIS (en az 1) | tam | `class-features.json:1566-1576`; probe | 4648 |
| A17 | Precise Hunter: işaretli yaratığa saldırıda avantaj | Hunter's Mark konsantrasyon hedefine avantaj (probe: seviye 20 silah saldırısı, `reasons: ["Precise Hunter"]`; büyü saldırısında da neden yazılı) | tam | `src/battle/classTraits.ts:36-38`; `classTraits.test.ts:283-286`; probe | Görev F |
| A18 | Feral Senses: 30 ft Blindsight | 17'de görünmez hedefe saldırı dezavantajlı, 18'de 20 ft'te dezavantaj yok, 35 ft'te var (probe); karanlık haritada en az 6 altıgen görür | tam | `src/battle/sight.ts:60,68`; `maprules.ts:779`; probe | 4551 |
| A19 | Foe Slayer: HM zarı d10 | `markDie` d6 → d10; seviye 19'da d6 | tam | `classTraits.ts:182`; `classTraits.test.ts:279-282`; probe | Görev F |
| A20 | Hunter's Lore: işaretli yaratığın bağışıklık/direnç/zaafını bilirsin | HM yapılınca günlüğe `Hunter's Lore — hedef: …` notu (anahtar `featuresK19`); sürekli bilgi yok (hedef kartında gösterim doğrulanmadı) | tam (günlük) | `src/battle/spells.ts:809-815` | 4546 |
| A21 | Colossus Slayer: HP'si eksik hedefe turda bir +1d8 | `colossusDice`: `hp < maxHp`, turda bir; silah silahı türünde | tam | `classTraits.ts:176-180`; `classTraits.test.ts:247-256` | Görev F |
| A22 | Horde Breaker: turda bir, aynı silahla, 5 ft içindeki **farklı ve bu tur saldırmadığın** yaratığa | Ayrı komut `horde_breaker`: bu tur saldırılan yaratığın 5 ft yakınında farklı hedef, turda bir. **"Saldırmadığın" ve "aynı silah" şartı yok** (probe: önceden saldırılmış B'ye kabul; Shortsword'dan sonra Longbow kabul) | kısmi **[YENİ, hata]** | `classTraits.ts:185-194`; probe | 6297 |
| A23 | Escape the Horde: fırsat saldırıları ona dezavantajlı | `traitSources` `opportunity` bağlamında dezavantaj | tam | `classTraits.ts:39`; `classTraits.test.ts:270-277` | Görev F |
| A24 | Multiattack Defense: onu vuran yaratığın bu turdaki diğer saldırıları dezavantajlı | İsabette `mdefense` işareti saldırana, tur sonuna dek; ıskada yok | tam | `classTraits.ts:66-69`; `classTraits.test.ts` | Görev F |
| A25 | Superior Hunter's Prey: HM hasarı turda bir, ilk hedefin 30 ft yakınında görülen **farklı** yaratığa | Turda bir; 30 ft (probe: 5 ft'teki E1'e verildi, 45 ft'teki E2'ye verilmedi); aynı zar ve tür; ikinci hedef **otomatik** (en düşük HP'li düşman), oyuncu seçimi yok | kısmi | `classTraits.ts:158-173`; probe | 4512 |
| A26 | Superior Hunter's Defense: **hasar aldığında** tepki: o hasara ve aynı türdeki diğer hasara tur sonuna dek direnç | Saldırı isabetinde (yarılama + `shd-<tür>` direnç etkisi, `turnEndOf`) ve alan save hasarında (`hunterDefenseEvents`); karar önerisi yalnız ağır hasarda (≥ max(5, HP/3)). Süren hasar, bölge, düşme ve otomatik isabet (Magic Missile) tetiklemiyor (kod okuması) | kısmi | probe: HP 20'de 13 hasar → 6, etki `shd-slashing`, tepki harcandı; HP 124'te hiç kullanılmadı; `reactions.ts:62-72, 199-209, 329-336` | 4512, 6449 (eski) |
| A27 | Subclass özellikleri etkin seviyede (3/7/11/15) | `gainedFeatures` seviyeye göre | tam | fikstür `srd-alt-siniflar.json:932`; `classTraits.test.ts:80-93` | AS2 |
| A28 | Ranger büyü listesi (48 büyü; 13/15/12/5/3) | SRD ↔ oyun `Rgr` birebir aynı: 48 = 48, eksik/fazla yok | tam | probe (`data/srd/spells.json` ↔ `data/spells*.json`) | — |
| A29 | Büyülerin savaş kapsamı | 48 büyüden 18 "tam", 14 "yaklaşık" (`mechanics.approx`: Entangle, Ensnaring Strike, Spike Growth, Conjure Animals, Wind Wall …), 16 savaş dışı; `unsupported` yok (veri taraması) | kısmi **[bilinen]** | `data/spells.json`, `data/spells-45.json` taraması; `harita/belgeler/BUYU-DURUM.md` | Kuyruk K58 |
| A30 | Hunter's Mark: konsantrasyonlu büyüler arası geçiş, ölünce işaret | Konsantrasyon kuralları genel (başka konsantrasyon bırakır); HM işaretli yaratık yeni konsantrasyonla kaybolur | doğrulanmadı | — | — |

## B) Oluşturucu ve seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Hazırlanan sayı tablodan (2…15) | `spellLimits('ranger', L).prepared` 20/20 SRD ile aynı; cantrip 0 | tam | probe | K6 |
| B2 | Büyüler slot seviyesine uygun olmalı | `maxLevel` ve "Hazırlanan büyü fazla (7 / 6)" denetimi çalışıyor (probe) | tam | `builder.ts:147-153, 167-180`; probe | K6 |
| B3 | **Hunter's Mark her zaman hazır; sayıya girmez** (s. 58) | Savaşta otomatik eklenir ama oluşturucu `kit.alwaysPrepared` dışında: seçici HM'yi normal büyü olarak gösterir; seçilirse sayıya girer (probe: HM+5 = 6/6); `recommendedSpells` seviye 1'de HM seçer (probe: `["Hunter's Mark","Cure Wounds"]`) | kısmi **[YENİ, hata]** | `Builder.tsx:1044,1071`; `builderDefaults.ts:72-88`; `data/onerilen-baslangic.json:265`; probe | 6904 |
| B4 | Çekirdek: d10, STR/DEX save, Martial, Light/Medium/Shield, 3 beceri / 8 | `data/classes.json` birebir aynı | tam | veri karşılaştırması | — |
| B5 | Weapon Mastery 2 tür; uzun dinlenmede değişir | Oluşturucu sayıyı `weaponMastery.count` ile sınırlar; seçimler `weaponMasteries`; Serüven'de değişim yok (C3) | tam (oluşturucu) | `builder.ts:281-289`; `mastery.ts:47-64`; probe | P0 |
| B6 | Expertise: Deft Explorer (2) bir beceride, 9. seviyede iki daha (toplam 3) | `kit.expertise` 0, 1 (2.–8.), 3 (9+) (probe); sayı aşımı "expertiseMax" uyarısı | tam | `builder.ts:424-428`; probe | 6569 (eski) |
| B7 | Deft Explorer: iki dil | Dil sistemi yok; veri notu "savaş dışı (hikâye)" | bilinçli sapma | `class-features.json:1532-1538` | 4557 |
| B8 | Fighting Style (2): feat ya da Druidic Warrior; her Ranger seviyesinde Druidic cantrip değişimi | Yuva ve alternatif oluşturucuda; cantrip değişimi kısıtsız serbest düzenleme (seviye başına bir kısıtı yok) | bilinçli sapma | `builder.ts:159-165`; `k19feat2.test.ts:124` | 4553 |
| B9 | ASI 4/8/12/16, Epic Boon 19 | `advancement.ts` SRD tablosundan | tam | `advancement.ts:33-39` | — |
| B10 | Alt sınıf 3. seviyede; Hunter's Prey / Defensive Tactics seçimi (kısa/uzun dinlenmede değişir) | Oluşturucu 3+ seviyede alt sınıf ister; seçenekli özellikler `featureChoices` (`ranger/hunter:hunters-prey`, `…:defensive-tactics`), varsayılan Colossus Slayer / Escape the Horde | tam | `classTraits.test.ts:80-93`; `Features.tsx:175` | AS2 |
| B11 | Başlangıç ekipmanı A/B (A: Studded Leather, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Druidic Focus, Explorer's Pack, 7 GP) | Paket seçimi yok; serbest donanım + öneri (Chain Shirt, Longbow, Shortsword); sınıfa özgü değil, genel | kısmi **[bilinen, genel]** | `data/onerilen-baslangic.json:58` | SD3 |

## C) Dinlenme, Serüven ve kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Favored Enemy, Tireless, Nature's Veil: uzun dinlenmede tamamı döner, kısa dinlenmede dönmez | Üçünün `recharge.long: all`, kısa yok | tam | `class-features.json:51-62, 296-322` | 6902 |
| C2 | Tireless: kısa dinlenmeden sonra Exhaustion −1 (10. seviye) | `tirelessAfter` (`characterRest.ts:126-139`); 9. seviyede azaltmaz | tam | `k18h3.test.ts:226-231` | 4648 |
| C3 | Weapon Mastery türünü, Hunter's Prey/Defensive Tactics seçimini (kısa/uzun) ve bir hazır büyüyü (uzun) dinlenmede değiştir | Yalnız karakter listesinde oluşturucuyla (kayıt kopyası); Serüven ve yolculukta dinlenme düğmesi bu seçimleri sunmuyor | **düzeldi (B94)** ← kısmi **[bilinen, genel]** | `src/rules/characterRest.ts`; `seruven.ts` (kod okuması) | 4971 |
| C4 | Seviye atlayınca yeni hazır büyü, Expertise (9), Fighting Style, Deft Explorer, Weapon Mastery, alt sınıf seçimleri | Serüven `seruven_leveled` yalnız `sheet.level` artırır; yeni seçim istemi yok; özellikler otomatik (varsayılan Hunter's Prey, Defensive Tactics), alt sınıf eksikse varsayılan atanır; yeni hazır büyü eklenmez | **düzeldi (B94)** ← kısmi **[bilinen]** | `src/journey/seruven.ts:290, 397` | 4971 (M4 "Karar bekleyen") |
| C5 | Seviye atlayınca Favored Enemy 2 → 3 gibi artan en çok değer | K10: kaynak en çok + harcanan; yeni hak seviye atlamada eklenir. Doğrudan Ranger Serüven testi yok | tam (dolaylı) | `characterRest.ts`; DECISIONS K10 | 4621, 6003 (eski) |
| C6 | Savaş sonrası Hunter's Mark kullanımı, Tireless/Veil kalanı karakterde kalır | Genel kaynak taşıma; Ranger kaynakları için Serüven'de uçtan uca doğrulama yapılmadı | doğrulanmadı | — | K10 |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Hunter's Mark | YZ konsantrasyonsuz ve hedefe saldırabiliyorsa HM yapar (ilk komut `cast_spell` HM, probe), işaret düşünce bonus eylemle taşır | tam | `ai.ts:1549-1576`; probe | Görev F |
| D2 | Horde Breaker ve Extra Attack | Probe: HM, attack, `horde_breaker`, move, attack, end_turn; iki saldırı | tam | `ai.ts:1634-1647`; probe | 6297 |
| D3 | Colossus Slayer, Precise Hunter, Foe Slayer | Pasif, YZ ayrıca bir şey yapmaz | tam | `classTraits.ts` | — |
| D4 | **Tireless ve Nature's Veil kullanımı** | YZ kullanmıyor: `ai.ts`'te bu kaynakları anan kod yok; probe: seviye 14, HP 15/124 → komut dizisi HM, Cure Wounds, end_turn | yok **[YENİ]** | probe; `grep` (ai.ts, ai/*.ts) | — |
| D5 | Superior Hunter's Defense kararı | Öneri yalnız ağır isabette (HP ¼-⅓ ya da öldürücü) | bilinçli sapma | `reactions.ts:208`; DECISIONS 6440 | 6440 |
| D6 | Druidic Warrior cantrip'lerinin YZ kullanımı | YZ cantrip'lerini genel büyü mantığıyla seçer; Ranger'a özgü doğrulama yapılmadı (uygun bir testte Produce Flame `spell_followup` yolu kullanıldı) | tam | probe (elle komutla) | — |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Özellik adları EN/TR | EN menü adları `strings.en.ts:1191` ("Tireless", "Nature's Veil"); TR menü adları kısa Türkçe "Yorulmaz", "Doğanın Peçesi" (`strings.tr2.ts:459`, SD2); SD4 "sınıf özelliği adları İngilizce kalır" der. İkisi çelişir; kullanıcı kararı bu denetimde sorulmadı | kısmi **[YENİ]** | `strings.tr2.ts:459, 696-697` | SD4 (119) |
| E2 | Hunter alt sınıf adı ve özellikleri (TR/EN) | Alt sınıf adı ve özellik adları TR + EN (Avcı, Avcı Bilgisi, Avcının Avı …), açıklama TR özet + EN SRD metni | tam | `srd-alt-siniflar.json:932-` | AS2 |
| E3 | Seçenek adları (Colossus Slayer, Horde Breaker, Escape the Horde, Multiattack Defense) | TR/EN çevrili ve iki dosyada | tam | `strings.ts:229-230`; `strings.en.ts:408` | Görev F |
| E4 | Slot seçicide Favored Enemy kullanımı | Seçicide "Slotsuz" düğmesi yalnız `freeSpellList` kaynaklarında (Divine Intervention); HM için seçici yalnız slot seviyelerini gösterir, en düşük seviye `null` ile gönderilir ve motor önce Favored Enemy'yi harcar. Yani oyuncu hak varken en düşük seviye slotla HM yapamaz ve kalan hak sayısı seçicide görünmez (HUD kaynak çipinde var). Arayüzde çalıştırılıp doğrulanmadı | doğrulanmadı | `MapBattle.tsx:436-455`; `economy.ts:82-96` | 43b |
| E5 | Ranger sınıf özelliği açıklamaları (TR) | `data/aciklamalar-tr.json` `yetenek` bölümünde Ranger kaydı yok (taramada); TR metnin nereden geldiği doğrulanmadı. Hunter's Mark açıklaması var (TR + EN) | doğrulanmadı | `aciklamalar-tr.json`, `aciklamalar-en.json` taraması | SD4 |
| E6 | İkonlar | `actionMenu.ts:45` iyileştirme ikonu `tireless`, `natures-veil` için; HM işareti `efekt-baglama.json:162` (`nisan`) | tam | ilgili dosyalar | E1 |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: yeni kural sürümü gerekiyorsa **güncel sürümün bir fazlası, tek sabit**. SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Hunter's Mark'ı oluşturucuda "her zaman hazır" yap** (B3): `kit.alwaysPrepared`'a kaynağın `freeSpell`'ini ekle, seçici ve öneri listesinden gizle, sayıya katma; `data/sim-partiler.json` listelerinden HM'yi çıkarıp yerine bir büyü koy (testte "tablo kadar büyü" denetliyor) | Yüksek (her Ranger'ın seçilebilir büyü sayısı 1 eksik; seviye 1'de 2'den 1) | Sürümsüz (yalnız oluşturucu/veri; savaş zaten ekliyor) | 1–2 saat + sim partisi kontrolü |
| 2 | **Horde Breaker şartları** (A22): "bu tur saldırmadığın yaratık" ve "aynı silah" denetimi | Orta (SRD'den cömert) | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 3 | **YZ Tireless ve Nature's Veil kullansın** (D4): canı düşükken geçici HP (ya da bonus eylem boşken Veil), YZ-only karar | Orta (YZ Ranger 10+ zayıf; sim imzası değişir, denge ölçümü gerekir) | Güncel sürümün bir fazlası, tek sabit (YZ kararı) | 2–3 saat + 3–4 senaryolu hızlı regresyon |
| 4 | **Superior Hunter's Defense tetiği** (A26): süren hasar, bölge, düşme ve otomatik isabet büyüsünde de | Düşük-orta | Güncel sürümün bir fazlası, tek sabit | 2–3 saat |
| 5 | **Superior Hunter's Prey hedef seçimi** (A25): ikinci hedefi oyuncu seçsin (otomatik en düşük HP'li yerine) | Düşük | Sürümsüz arayüz + komutta isteğe bağlı `choice` | 2 saat |
| 6 | **Roving duvar tırmanışı ve yüzme maliyeti** (A13): probe testleri yaz, gerekirse düzelt | Düşük (doğrulama) | Doğrulamaya bağlı | 1–2 saat |
| 7 | **Slot seçici Favored Enemy** (E4): HM için "Slotsuz: Favored Enemy (N hak)" düğmesi, düşük seviye slotla yapma yolu | Düşük | Sürümsüz | 1 saat |
| 8 | **Belge ve metin**: DECISIONS 6449 "tur sonuna dek direnç yok" kaydını güncelle (Kuyruk 19'da eklendi); SD2 TR menü adları ↔ SD4 çelişkisini netleştir (E1); Ranger özellik açıklamalarının TR kaynağını `describeTr` ile doğrula (E5) | Düşük | Sürümsüz | 1–2 saat |
| 9 | **Test boşlukları**: bu denetimdeki probe'ları kalıcı teste çevir (Favored Enemy 20/20, HM taşıma, Relentless Hunter, Feral Senses mesafesi, Tireless/Veil süreleri, Horde Breaker şartları, Superior Prey 30 ft) | Regresyon güvencesi | — | 2 saat |

### Karar gerekli (temel akışı değiştirir)

| # | Konu | Neden karar | Tahmini iş |
|---|---|---|---|
| K1 | **Serüven seviye atlama seçimleri** (C3, C4; **bilinen**, DECISIONS 4971 M4): yeni hazır büyü, 9. seviye Expertise, Fighting Style, Weapon Mastery, uzun dinlenmede hazırlık/ustalık değişimi, Hunter's Prey/Defensive Tactics değişimi | Serüven akışına seçim ekranı eklemek ürün kararı (tüm sınıflara ortak; Warlock/Cleric denetimleri aynı konuyu işaretledi) | Büyük (1–2 gün, sınıf başına değil ortak) |

Probe'larla denenip **doğru** bulunan davranışlar (regresyon için not): Favored Enemy 20/20 tablo ve slotsuz yapım; Hunter's Mark bonus eylem, kritik zarı, büyü saldırısında ek hasar, işaret taşıma ve hedef ölünce konsantrasyonun sürmesi; Foe Slayer d10; Precise Hunter avantajı (silah ve büyü saldırısı); Relentless Hunter 12/13 farkı; Nature's Veil süresi ve kaynak sayısı; Tireless geçici HP ve kullanım sayısı; Feral Senses 30 ft sınırı; Superior Hunter's Prey 30 ft ve turda bir; Superior Hunter's Defense ağır isabette yarılama ve tür direnci; Roving +10 ft (Heavy zırhta yok); hazır sayısı, slot, Expertise ve Extra Attack tabloları 20/20; Ranger büyü listesi 48/48.

## B94 düzeltmeleri

Görev B94 (2026-11-20). Sürüm sütunu: "94" = kural sürümü 94 (`B94_VERSION`), 93 ve altı eski davranışta; "sürümsüz" = veri/arayüz/oluşturucu/metin.

| Satır | Şimdi | Sürüm | Test |
|---|---|---|---|
| C3 | Uzun dinlenmede ustalıklar, 1 hazır büyü, Hunter's Prey/Defensive Tactics Serüven'de (`set_choices`) | sürümsüz | levelChoices.test.ts |
| C4 | Serüven seviye atlamada yeni hazır büyü, Expertise, Fighting Style (değişim seviyede 1) eklenir | sürümsüz | levelChoices.test.ts |
