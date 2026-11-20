# Monk denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Güncel kural sürümü 94 (`data/kural-surumu.json`; probe'lardaki savaşlar `kuralSurumu: 94`) üzerinden okundu. Emin olunmayan satırlar geçici vitest dosyalarıyla denendi (`src/battle/zzTmpMonk*.test.ts`) ve silindi; depoda yalnız bu belge var.

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 49–52 (`pdftotext -layout`; sayfa numaraları PDF alt bilgisindeki SRD sayfasıdır), `data/srd/classes.json` (Monk), `data/srd/progression.json`. Oyun tarafı: `data/class-features.json` (`monk:*`, kaynaklar `focus`, `uncannyMetabolism`, `wholenessOfBody`), `src/battle/martial.ts`, `stunning.ts`, `weapons.ts`, `reactions.ts` (Deflect Attacks, Slow Fall), `classTraits.ts` (Evasion, Self-Restoration), `capstones.ts` (Perfect Focus, Superior Defense), `effectDice.ts` (Disciplined Survivor), `apex.ts` (Quivering Palm), `divine.ts` (Wholeness of Body), `economy.ts`, `ai.ts`. `icerik/` (gitignore) bu checkout'ta yok: **Warrior of the Open Hand mekaniği depodaki fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:687`). Ölçüt alt sınıfta bizim sürümümüz: gerçek paketteki adı "Sadelik Disiplini" ve dört özelliğinde "mekanik" farkı var (`harita/belgeler/AS2-FARKLAR.md:24, 57-60`); paket görülmedi, alt sınıf satırları yalnız fikstür metni/`effect` ↔ motor uyumuna göre yazıldı.

**Kapsam.** Monk'a özgü kurallar ve Monk'un dayandığı genel kurallardan sınıfa özgü kısım (Unarmed Strike'ın Martial Arts sürümü, Extra Attack, Evasion, ASI yuvaları). Monk'ta büyü ve Weapon Mastery yok.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar ya da kayda alınması gereken sapma) · **doğrulanmadı** (bu denetimde çalıştırılamadı, tahmin yazılmadı). **[bilinen]** = DECISIONS.md ya da denetim belgelerinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye (alt sınıfta fikstüre) aykırı, bilinçsiz.

**CLAUDE.md "Bilinen eksikler" notu.** Monk satırı ("atlama ikilemesi yok", "Deflect Attacks geri yöneltme yok", "Stunning Strike hız yarılanması yok") kısmen eski: atlama ikilemesi Kuyruk 19'da (`stepWindJump`, `monk.test.ts:115`) ve geri yöneltme Görev R1'de (`reactions.test.ts:138`, probe: menzilli saldırıda 60 ft) geldi; yalnız hız yarılanması hâlâ yok (A22, probe). Satır ayrıca "diğer sınıfların 6+ özellikleri çoğunlukla yok" diyor; Monk 6–20 artık büyük ölçüde çalışıyor (E6).

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d8, STR+DEX save, Simple silah + Light özellikli Martial silah, zırh eğitimi yok, 2 beceri (Acrobatics, Athletics, History, Insight, Religion, Stealth), bir Artisan's Tools ya da Musical Instrument, ekipman A: Spear, 5 Dagger, araç, Explorer's Pack, 11 GP | 49 |
| S2 | Martial Arts (1): Monk silahları = Simple Melee + Light özellikli Martial Melee; silahsız ya da **yalnız Monk silahı taşırken**, zırhsız ve kalkansızken: bonus eylemle Unarmed Strike, Martial Arts zarı (1d6/1d8/1d10/1d12; 1/5/11/17), Dexterous Attacks (DEX; Grapple/Shove DC'sinde de) | 50 |
| S3 | Unarmored Defense (1): zırhsız, kalkansız AC 10 + DEX + WIS | 50 |
| S4 | Monk's Focus (2): Focus Point = seviye, kısa/uzun dinlenmede dolar, DC 8 + WIS + PB; Flurry of Blows (1 FP, bonus eylem, 2 Unarmed Strike), Patient Defense (bonus Disengage; 1 FP ile Disengage + Dodge), Step of the Wind (bonus Dash; 1 FP ile Disengage + Dash ve atlama ×2) | 50–51 |
| S5 | Unarmored Movement (2): zırhsız, kalkansız +10/+15/+20/+25/+30 ft (2/6/10/14/18) | 49, 51 |
| S6 | Uncanny Metabolism (2): inisiyatifte FP dolar + Martial Arts zarı + Monk seviyesi HP; uzun dinlenmede bir | 51 |
| S7 | Deflect Attacks (3): B/P/S hasarlı isabette tepki, 1d10 + DEX + seviye azaltma; 0'a inerse 1 FP ile geri yöneltme (yakında 5 ft, menzillide 60 ft), DEX save ya da 2 × Martial Arts zarı + DEX, saldırının türünde | 51 |
| S8 | Alt sınıf (3), ASI (4/8/12/16), Epic Boon (19) | 49, 51–52 |
| S9 | Slow Fall (4): tepkiyle düşme hasarı 5 × seviye azalır | 51 |
| S10 | Extra Attack (5) | 51 |
| S11 | Stunning Strike (5): turda bir, **Monk silahı ya da Unarmed Strike isabetinde**, 1 FP, CON save; başarısızsa sonraki turunun başına dek Stunned; **başarılıysa hız yarı** ve ona sonraki saldırı avantajlı | 51 |
| S12 | Empowered Strikes (6): Unarmed Strike Force ya da normal türde | 51 |
| S13 | Evasion (7): DEX save'li yarım hasarda başarı 0, başarısızlık yarı; Incapacitated iken yok | 51 |
| S14 | Acrobatic Movement (9): zırhsız, kalkansız, **kendi turunda** dikey yüzeyde ve sıvı üstünde düşmeden hareket | 51 |
| S15 | Heightened Focus (10): Flurry 3 vuruş; FP'li Patient Defense 2 × Martial Arts zarı geçici HP; FP'li Step of the Wind 5 ft içindeki gönüllü Large ya da küçük yaratığı taşır (fırsat saldırısız) | 51–52 |
| S16 | Self-Restoration (10): her tur sonunda Charmed, Frightened ya da Poisoned'dan **birini** kaldır; açlık/susuzluk Exhaustion vermez | 52 |
| S17 | Deflect Energy (13): Deflect Attacks her hasar türüne | 52 |
| S18 | Disciplined Survivor (14): bütün save'lerde yetkinlik; başarısız save'i 1 FP ile yeniden at | 52 |
| S19 | Perfect Focus (15): inisiyatifte Uncanny Metabolism kullanılmadıysa FP 3 ya da azsa 4'e | 52 |
| S20 | Superior Defense (18): tur başında 3 FP, **1 dakika** ya da Incapacitated olana dek Force dışı her hasara direnç | 52 |
| S21 | Body and Mind (20): DEX ve WIS +4 (en çok 25) | 52 |
| S22 | Open Hand Technique (3; fikstür): Flurry isabetinde Addle (hedefin sonraki turunun başına dek fırsat saldırısı yok), Push (STR save, 15 ft), Topple (DEX save, Prone) | 52 |
| S23 | Wholeness of Body (6; fikstür): bonus eylem, Martial Arts zarı + WIS (en az 1 HP), WIS (en az 1) kullanım, uzun dinlenme | 52 |
| S24 | Fleet Step (11; fikstür): Step of the Wind dışındaki bir bonus eylemden hemen sonra Step of the Wind; fikstür notu: "bonus eylemsiz, turda bir, Focus yine harcanır" | 52 |
| S25 | Quivering Palm (17; fikstür): **Unarmed Strike** isabetinde 4 FP ile titreşim; bitirince CON save, 10d12 Force ya da yarısı; tek hedef; fikstür notu: bitirmek eylem | 52 |

## Özet

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 38 | 26 | 9 | 1 | 1 | 1 |
| B) Oluşturucu / seviye atlama | 7 | 5 | 1 | 1 | 0 | 0 |
| C) Dinlenme, Serüven, kayıt | 6 | 3 | 0 | 1 | 1 | 1 |
| D) Yapay zekâ | 8 | 3 | 0 | 4 | 1 | 0 |
| E) Arayüz ve TR/EN | 7 | 2 | 3 | 0 | 1 | 1 |
| **Toplam** | **66** | **39** | **13** | **7** | **4** | **3** |

(Sayım tablo satırlarının durum sütunundan: "tam (…)" tam, "kısmi (…)" kısmi sayıldı. **[YENİ]** bulgu: 13. **[hata]**: 5 (A6, A23, A27, A31, A36).)

## En önemli bulgular

1. **Serüven'de Monk seviye seçimi hiç yapılamıyor** (C3, **bilinen**: `data/secim-degisim.json`'da `monk` yok, `levelChoices.test.ts:90` "sonraki görev"). Probe: 3 → 4 seviye atladı, `set_choices` ile ASI "Bu sınıfın seçim değişimi henüz bağlı değil." diye reddedildi. Monk'un SRD'de değişen seçimi yok; yalnız ekleme için boş bir kayıt yeter.
2. **Stunning Strike'ın başarılı save'inde hız yarılanmıyor** (A22, **bilinen** DECISIONS 6592). Probe: başarıda hedefin hızı 30, yalnız `Help:party` işareti var. Tetik ayrıca Martial Arts'a bağlı: **zırhlı Monk Unarmed Strike ile vurduktan sonra Stunning Strike yapamıyor** (A23, **[YENİ, hata]**; SRD'de zırh şartı yok).
3. **Self-Restoration üç durumu birden kaldırıyor** (A27, **[YENİ, hata]**): probe'da Charmed, Frightened ve Poisoned aynı tur sonunda bitti; SRD "birini".
4. **Quivering Palm Monk silahıyla da kuruluyor** (A36, **[YENİ, hata]**; fikstür "Unarmed Strike"): probe'da Quarterstaff isabetinden sonra 4 FP ile titreşim kabul edildi (`apex.ts:83-86` `meleeHit.martialArts`'a bakıyor).
5. **Yapay zekâ Monk'un savunma ve 6+ seçeneklerini kullanmıyor** (D4–D7): Patient Defense, Step of the Wind, Wholeness of Body, Superior Defense ve Quivering Palm hiç seçilmiyor. Probe: 4/37 HP'lik 5. seviye, 15 HP'lik 17. ve 18. seviye Monk her turda Attack > Stunning Strike > Flurry oynadı; kurulu titreşimi de bitirmedi.
6. İyi haber: sayısal tablolar 20/20 SRD ile aynı (Martial Arts zarı, Focus, Unarmored Movement, Extra Attack, Deflect bonusu, Slow Fall, Focus DC, ASI/Epic Boon yuvaları); Flurry 9/10 = 2/3, Deflect Energy 12/13, Disciplined Survivor save'leri, Evasion, Open Hand Push 15 ft probe ile doğru.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Martial Arts zarı 1d6 → 1d8 (5) → 1d10 (11) → 1d12 (17) | `tableValue` SRD sütunundan; Unarmed 1d6+3 … 1d12+5 (20) | tam | probe (1–20 tablosu); `classFeatures.ts:292`; `monk.test.ts:43` | 6560 |
| A2 | Monk silahları: Simple Melee + Light Martial Melee; zar büyükse Martial Arts zarı | `martialArtsFor`: basit yakın ya da Light harp yakın, menzilli değil; zar ortalaması büyükse | tam | `weapons.ts:115-120`; `monk.test.ts:55` | 6560 |
| A3 | Dexterous Attacks: saldırı ve hasarda DEX | Unarmed ve Monk silahında max(STR, DEX) | tam | `weapons.ts:25, 137`; probe (STR 8 → DEX) | 6560 |
| A4 | Zırh ya da kalkanla Martial Arts yok | Zırhta ve kalkanda `bonusStrike` yok, 1 + STR vuruş kalır | tam | probe (kalkan: bonusStrike yok); `monk.test.ts:62-66` | Görev F |
| A5 | "Silahsız ya da **yalnız Monk silahı taşırken**" | Taşınan silaha bakılmıyor: Longsword + Longbow taşıyan Monk'ta bonus vuruş açık | kısmi **[YENİ]** | probe (`bonusStrike` true); `weapons.ts:108-112` | 4661 (eldeki eşya modeli yok) |
| A6 | Fırlatılan Monk silahı da Monk silahı (DEX, Martial Arts zarı) | `use !== 'thrown'`: fırlatmada Martial Arts yok; Javelin/Handaxe fırlatma STR (1d6−1, +2), Dagger 1d4 | kısmi **[YENİ, hata]** | probe; `weapons.ts:21` | — |
| A7 | Bonus Unarmed Strike (Attack eylemi şartı yok) | `bonus_strike` bonus eylem harcar, eylemsiz yapılır | tam | `monk.test.ts:77-83`; `economy.ts:313-318` | 6577 |
| A8 | Grapple/Shove DC'sinde DEX | `shoveDc` Martial Arts geçerliyken max(STR, DEX) (`featuresK19`) | tam | probe: DC 14 = 8 + DEX 3 + PB 3; `forced.ts:52-56` | 4644 |
| A9 | Unarmored Defense 10 + DEX + WIS, kalkansız | 1. seviye AC 15; 20. seviye 19; kalkanla Unarmored Defense yok (AC 13, eğitimsiz kalkan AC vermez) | tam | probe; `class-features.json:1081-1089` | 6560 |
| A10 | Focus Point = seviye; DC 8 + WIS + PB | `focus` 2…20; Stunning/Open Hand/geri yöneltme DC'si 13 (5), 14 (9), 15 (13), 16 (17), 18 (20) | tam | probe; `create.ts:429, 433` | 6560 |
| A11 | Flurry of Blows 2 vuruş; Heightened Focus 3 | 9. seviye `flurryLeft` 2, 10. seviye 3 | tam | probe; `economy.ts:319-330`; `k17g2.test.ts:42` | 4789 |
| A12 | Patient Defense: bonus Disengage; 1 FP ile Disengage + Dodge; Heightened 2 × MA zarı geçici HP | Bonus `disengage` FP'siz; `focus_action` Disengage + Dodge; 10. seviyede geçici HP (probe 5 + 3 = 8) | tam | probe; `martial.ts:108-128`; `k18h3.test.ts:199` | 4789, Kuyruk 18 H3 |
| A13 | Step of the Wind: bonus Dash; 1 FP ile Disengage + Dash, atlama ×2 | Bonus `dash` FP'siz; FP'li Disengage + Dash + `trait_turn` (`stepWindJump`) | tam | probe; `monk.test.ts:103-125` | 4710 |
| A14 | Heightened Step of the Wind: gönüllü yaratığı taşı | Yok; veri notu "yaklaşık" | yok **[bilinen]** | probe (SotW 10: yalnız disengaged, dashed); `class-features.json:2305` | 4789 |
| A15 | Unarmored Movement +10/15/20/25/30 | 30 → 40 (2), 45 (6), 50 (10), 55 (14), 60 (18); kalkanla yok | tam | probe (1–20) | 6560 |
| A16 | Uncanny Metabolism: inisiyatifte FP dolar + MA zarı + seviye HP; uzun dinlenmede bir | `start_battle`'da FP eksik ya da yaralıysa kendiliğinden; Beacon of Hope en yüksek değer (54+) | tam (otomatik) | `martial.ts:153-166`; `commands.ts:402-406`; `monk.test.ts:150` | 6584, 2909 |
| A17 | Deflect Attacks: B/P/S isabette tepki, 1d10 + DEX + seviye | Bonus DEX + seviye (3: 6 … 20: 25); hasarın tamamını azaltır; yalnız ana hasar türüne bakar (kod) | tam | probe; `reactions.ts:200, 335-340`; `monk.test.ts:161` | 6544 |
| A18 | 0'a inince 1 FP ile geri yöneltme (yakın 5 ft / menzilli 60 ft, DEX save, 2 × MA zarı + DEX) | Oyuncuya hedef sorulur; menzilli saldırıda 30 ft'teki saldırana DEX save, hasar 13 (probe) | tam | probe; `reactions.ts:529-547`; `reactions.test.ts:138` | 6544 (6587 eski) |
| A19 | Slow Fall 5 × seviye, tepki | `fallReduction` 20 (4) … 100 (20); tepki harcanır | tam | probe; `reactions.ts:743-773`; `reactions.test.ts:185` | R1 |
| A20 | Extra Attack (5) | `attacksPerAction` 4: 1, 5: 2 | tam | probe; `k7.test.ts:39` | — |
| A21 | Stunning Strike: turda bir, 1 FP, CON; başarısızsa sonraki turunun başına dek Stunned | Aynen; turda ikincisi reddedilir | tam | `stunning.ts:171-180`; `monk.test.ts:129-140` | 6589-6591 |
| A22 | Başarılı save: **hız yarı** ve sonraki saldırı avantajlı | Yalnız avantaj (`Help:<taraf>` işareti; karşı taraf saldırısında yok); hız 30 kalıyor | kısmi **[bilinen]** | probe; `martial.ts:145-148` | 6592 |
| A23 | Tetik "Monk silahı ya da Unarmed Strike isabeti" (zırh şartı yok) | `meleeHit.martialArts` gerekiyor: zırhlı Monk'ta yok ("Önce bu tur Monk silahı…"); fırlatılan Monk silahında yok (A6); yalnız **son** vurulan hedefe (B'yi sonra C'yi vurunca B reddedildi) | kısmi **[YENİ, hata]** | probe (üç durum); `stunning.ts:176-178` | — |
| A24 | Empowered Strikes: Force ya da normal tür | `altDamageType: 'force'`; hedefe göre etkili olan otomatik | tam | `create.ts:240`; `k17g2.test.ts:24` | 4787 |
| A25 | Evasion (7), Incapacitated'ta yok | 0 / yarı; Stunned'da yarı; 6. seviyede yok | tam | probe; `classTraits.ts:79-87` | 4967 |
| A26 | Acrobatic Movement: **kendi turunda** dikey yüzey ve sıvı | Zırhsız/kalkansızken tırmanma ek maliyetsiz ve sıvıda yürüme; tur ayrımı yok (başkasının turunda ve tur sonunda da sıvı üstünde durur) | kısmi | `flight.ts:73-76`; `deepWater.ts:68-71` (kod okuması) | 4615 |
| A27 | Self-Restoration: tur sonunda **birini** kaldır | Üçü birden biter (probe); büyü etkisinin verdiği durum etkiyle sürer (**bilinen**) | kısmi **[YENİ, hata]** | probe; `classTraits.ts:199-204` | 4788 |
| A28 | Deflect Energy (13): her tür | 12. seviyede ateş isabeti azaltılmadı, 13'te 12 → 0 | tam | probe; `reactions.ts:200` | 4615 |
| A29 | Disciplined Survivor: bütün save yetkinliği; başarısızı 1 FP ile yeniden | 14. seviye bütün save'ler +PB (probe); yeniden atış başarısızlıkta kendiliğinden, Focus harcar | tam (otomatik) | probe; `effectDice.ts:66-68`; `k19tier4a.test.ts:76` | 4615 |
| A30 | Perfect Focus: Metabolism kullanılmadıysa ≤ 3 FP → 4 | `capstoneStartEvents` | tam | `capstones.ts:21-23`; `k19tier4a.test.ts:61` | 4615 |
| A31 | Superior Defense: tur başı 3 FP, **1 dakika** ya da Incapacitated; Force hariç | Tur başı denetimi, Force hariç 12 tür, Incapacitated'ta biter; süre `until: round + 10` (tur 1'de 11) → 11 tur (projede kural `round + n − 1`) | kısmi **[YENİ, hata]** (süre) | probe; `capstones.ts:28-37`; `reduce.ts:227, 232` | 4615 |
| A32 | Body and Mind: DEX/WIS +4, en çok 25 | 20. seviye AC 15 → 19 | tam | probe; `k19tier4a.test.ts:23` | 4615 |
| A33 | Open Hand Technique (fikstür): Addle / Push / Topple | Komut üçünü alır: Addle hedefin turunun başına dek; Push STR save, 15 ft (probe: üç `pushed`); Topple DEX save, Prone | tam | probe; `martial.ts:65-82`; `monk.test.ts:84-101` | 6593 |
| A34 | Wholeness of Body (fikstür): MA zarı + WIS, en az 1 HP | Bonus eylem, kullanım WIS (en az 1); WIS negatifken eklenmiyor: WIS −1, zar 4 → 4 HP (fikstür metni 3) | kısmi **[YENİ]** | probe; `divine.ts:176-185`; fikstür `:723` (`min: 0`) | 4745 |
| A35 | Fleet Step (fikstür notu): başka bonus eylemden sonra SotW bonus eylemsiz, turda bir, Focus harcanır | Aynen (probe: Focus 11 → 10); Focus'suz Dash bu yoldan yok (fikstür notuyla uyumlu) | tam | probe; `economy.ts:324-327`; `k19tier4b.test.ts:87` | 4602 |
| A36 | Quivering Palm (fikstür): **Unarmed Strike** isabetinde 4 FP | Monk silahı isabeti de kabul ediliyor (Quarterstaff → titreşim) | kısmi **[YENİ, hata]** | probe; `apex.ts:83-86, 181-190` | 4602 |
| A37 | Titreşimi bitirmek: Attack eyleminde bir saldırının yerine | Eylem olarak (fikstür notu da öyle) | bilinçli sapma **[bilinen]** | `apex.ts:67`; fikstür `:767` | 4602 |
| A38 | Stunning Strike başkasının turundaki isabette (fırsat saldırısı) | Komut ve arayüz yalnız kendi turunda; motorun fırsat saldırısında `meleeHit` yazıp yazmadığı çalıştırılmadı | doğrulanmadı | — | — |

## B) Oluşturucu ve seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Çekirdek: d8, STR/DEX save, Simple + Light Martial, zırhsız, 2 / 6 beceri | `data/classes.json` birebir aynı (`martialWeaponProperties: ["light"]`) | tam | veri karşılaştırması | 490 |
| B2 | Bir Artisan's Tools ya da Musical Instrument yetkinliği | Araç yetkinliği modeli yok (genel; sınıfa özgü değil) | yok **[YENİ, genel]** | `data/classes.json` taraması | — |
| B3 | Başlangıç ekipmanı A/B (Spear, 5 Dagger, araç, Explorer's Pack, 11 GP) | Paket seçimi yok; öneri zırhsız + Spear, Dagger | kısmi **[bilinen, genel]** | `data/onerilen-baslangic.json:42-49` | SD3 |
| B4 | Alt sınıf 3. seviyede | Oluşturucu 3+ seviyede ister; varsayılan `warrior-of-the-open-hand` | tam | `builder.ts:455-459`; `data/alt-sinif-gorunum.json:15` | AS2 |
| B5 | ASI 4/8/12/16, Epic Boon 19 | `advancementSlots('monk', 20)` = 4, 8, 12, 16 (asi), 19 (epic) | tam | probe; `advancement.ts:34-39` | — |
| B6 | Monk'ta Weapon Mastery yok | Yok | tam | `class-features.json` (monk) | 6569 |
| B7 | Kalkan eğitimi yok: kalkan AC vermez, Unarmored Defense/Movement ve Martial Arts kalkar | Probe: kalkanla AC 13, hız 30, bonus vuruş yok | tam | probe | — |

## C) Dinlenme, Serüven ve kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Focus kısa ve uzun dinlenmede dolar | `recharge.short/long: all`; probe: kısa dinlenmede 0 → 6 | tam | probe (`rechargeResources`); `class-features.json:134-144` | 6560 |
| C2 | Uncanny Metabolism ve Wholeness of Body yalnız uzun dinlenmede | Kısa dinlenmede 0 kalır, uzunda dolar | tam | probe; `class-features.json:145-153, 601-610` | — |
| C3 | Seviye atlamada alt sınıf (3), ASI/feat (4/8/12/16), Epic Boon (19) seçilir | Serüven `level_up` yalnız seviyeyi artırır; Monk `secim-degisim.json`'da yok, `set_choices` reddedilir: seçim hiç yapılamaz (özellikler otomatik gelir) | yok **[bilinen]** | probe (3 → 4, ASI reddi); `seruven.ts:800-803`; `levelChoices.test.ts:90-93` | 5068 (M4 "Karar bekleyen"), B93 A2 |
| C4 | Dinlenmede/seviyede değişen seçim | Monk'ta SRD'de yok; bağlanınca kayıt boş kalabilir (yazılmayan alan yalnız eklenir) | tam (gereksinim yok) | SRD s. 49–52; `data/secim-degisim.json` `_not` | B93 |
| C5 | Savaş sonrası Focus ve Metabolism kalanı karakterde kalır | Genel kaynak taşıma (K10); Monk için Serüven'de uçtan uca denenmedi | doğrulanmadı | — | 5985 |
| C6 | Self-Restoration: yemeksiz/susuz Exhaustion yok | Açlık sistemi yok; veri notu "savaş dışı (yolculuk)" | bilinçli sapma **[bilinen]** | `class-features.json:2310` | 4788 |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Stunning Strike | Monk silahı isabetinden sonra hedef > 15 HP ya da kritikse, zaten Stunned değilse | tam (basit kural) | `ai.ts:1966-1974`; `monk.test.ts:181`; probe | 6596 |
| D2 | Flurry of Blows / bonus vuruş | Attack eylemi bitince Focus varsa Flurry, yoksa bonus vuruş; 17'de 3 vuruş | tam | `ai.ts:1975-1990`; probe | 6597 |
| D3 | Open Hand Technique seçimi | Hep Topple (Addle/Push hiç) | bilinçli sapma **[bilinen]** | `ai.ts:1979` | 6593 |
| D4 | Patient Defense, Step of the Wind (Fleet Step dahil) | Hiç kullanılmıyor; probe: 5. seviye 4/37 HP'de Attack > Stunning > Flurry | yok **[bilinen]** | probe; `grep` (ai.ts, ai/*.ts) | 6598 |
| D5 | Wholeness of Body | Hiç kullanılmıyor (6. seviye 6 HP'de de Flurry) | yok **[YENİ]** | probe; `grep selfHeal` (ai) boş | — |
| D6 | Quivering Palm (kurma ve bitirme) | Hiç kullanılmıyor; kurulu titreşim de bitirilmiyor (17. seviye probe) | yok **[YENİ]** | probe; `grep quiveringPalm` (ai) boş | — |
| D7 | Superior Defense | Hiç kullanılmıyor (18. seviye, 15 HP) | yok **[YENİ]** | probe; `grep superior_defense` (ai) boş | — |
| D8 | Tepkiler ve otomatikler | Deflect Attacks ve geri yöneltme (kancasız Rng'de öneri: saldıran), Slow Fall, Uncanny Metabolism, Perfect Focus, Disciplined Survivor kendiliğinden | tam | probe (menzilli geri yöneltme); `reactions.ts:206, 540` | 6536 |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Özellik/eylem adları | EN adlar İngilizce; TR menü adları Türkçe ("Yumruk Yağmuru", "Sabırlı Savunma", "Rüzgâr Adımı", "Sersemletici Vuruş", "Üstün Savunma"); SD4 "sınıf özelliği adları İngilizce kalır" ile çelişir (Ranger E1 ile aynı konu) | kısmi **[bilinen]** | `strings.tr2.ts:469, 496-499`; `strings.en.ts:1281-1284` | SD4; RANGER-DENETIM E1 |
| E2 | Open Hand Technique seçimi | Arayüz hep Topple gönderir; Addle/Push seçilemez | bilinçli sapma **[bilinen]** | `MapBattle.tsx:1473` | 6593 |
| E3 | Yardım metinleri | Flurry yardımı her seviyede "iki Unarmed Strike" ve alt sınıfsız Monk'ta da "Topple" der; Patient Defense yardımı Heightened geçici HP'yi anmaz | kısmi **[YENİ]** | `strings.tr2.ts:704-706`; `strings.en.ts:1478-1480` | — |
| E4 | Sınıf özelliği açıklamaları (TR/EN) | 19 Monk özelliğinin hepsinde TR kısa metin + EN SRD metni; alt sınıf fikstürde TR/EN | tam | `data/aciklamalar.json` (`features.tr/en.monk:*`); fikstür `:687-790` | SD4 |
| E5 | İkonlar | Focus/Metabolism/Wholeness kaynak ikonu `ki` (ortak ikonda ad da görünür); Wholeness "Şifa" grubunda; Focus eylemleri bonus maliyetli | tam | `data/kaynak-ikon.json:15-17`; `actionMenu.ts:45, 69`; `ResourceChip.tsx:26` | 2042 |
| E6 | CLAUDE.md "Bilinen eksikler" Monk satırı | Atlama ikilemesi ve geri yöneltme "yok" yazıyor, ikisi de çalışıyor; 6+ özellik durumu eski | kısmi **[YENİ]** (belge) | CLAUDE.md; A13, A18 | — |
| E7 | Alt sınıfın gerçek paket adı (Sadelik Disiplini) ve metinleri | Paket bu checkout'ta yok | doğrulanmadı | `AS2-FARKLAR.md:24` | AS2 |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: yeni kural sürümü gerekiyorsa **güncel sürümün bir fazlası, tek sabit**. SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Monk'u Serüven seçimlerine bağla** (C3): `data/secim-degisim.json`'a boş `"monk": {}` (yazılmayan alan yalnız eklenir: alt sınıf, ASI/feat, Epic Boon); `levelChoices.test.ts` "bağlı olmayan" listesini güncelle | Yüksek (Serüven'de Monk ASI alamıyor) | Sürümsüz | 30 dk + test |
| 2 | **Stunning Strike başarısında hız yarı** (A22): sonraki turunun başına dek `speedMult: 0.5` süren etki; avantaj işaretini her saldırana aç | Yüksek (Monk'un ana kontrolü) | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 3 | **Stunning Strike tetiği Martial Arts'tan ayrılsın** (A23, A6): isabet bilgisine "Monk silahı ya da Unarmed Strike" ayrı işaret (zırhlıyken ve fırlatılan Monk silahında da) | Orta | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 4 | **YZ: Patient Defense/Step of the Wind kaçışı, Wholeness of Body, Superior Defense, Quivering Palm** (D4–D7; yalnız YZ kararı) | Orta (YZ Monk 6+ zayıf; sim imzası değişir) | Güncel sürümün bir fazlası, tek sabit (YZ) | 3–4 saat + 3–4 senaryolu hızlı regresyon |
| 5 | **Self-Restoration tek durum** (A27): öncelik sırasıyla (ör. Frightened > Charmed > Poisoned) tur sonunda bir | Orta (SRD'den cömert) | Güncel sürümün bir fazlası, tek sabit | 30 dk |
| 6 | **Quivering Palm yalnız Unarmed Strike** (A36): `meleeHit`'e silah kimliği, `weaponId === 'unarmed-strike'` şartı | Düşük-orta | Güncel sürümün bir fazlası, tek sabit | 30 dk |
| 7 | **Fırlatılan Monk silahında DEX ve Martial Arts zarı** (A6) | Düşük | Sürümsüz (savaşçı oluşturmada; eski kayıttaki savaşçı aynı kalır) | 30 dk |
| 8 | **Superior Defense süresi** (A31): `until: round + 9` | Düşük | Güncel sürümün bir fazlası, tek sabit | 15 dk |
| 9 | **Wholeness of Body negatif WIS** (A34): `roll + WIS`, en az 1 | Çok düşük | Güncel sürümün bir fazlası, tek sabit | 15 dk |
| 10 | **Heightened Step of the Wind dostu taşıma** (A14) | Düşük | Güncel sürümün bir fazlası, tek sabit | 2–3 saat |
| 11 | **Acrobatic Movement tur sınırı** (A26): sıvı üstünde yürüme yalnız kendi turunda, tur sonunda sıvıdaysa normal kural | Düşük | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 12 | **Metin ve belge**: Flurry/Patient Defense yardımları seviye ve alt sınıfa göre (E3); CLAUDE.md Monk satırını güncelle (E6); DECISIONS 6578 "1 + STR silahsız vuruş yok" ve 6587 "geri yöneltme yok" eski | Düşük | Sürümsüz | 1 saat |
| 13 | **Arayüzde Open Hand teknik seçimi** (E2; DECISIONS 6593'ü günceller): Flurry vuruşu hedef seçiminden sonra Addle/Push/Topple | Düşük-orta | Sürümsüz (komut zaten alıyor) | 1–2 saat |
| 14 | **Test boşlukları**: probe'ları kalıcı teste çevir (1–20 tablo, Flurry 9/10, Deflect Energy 12/13, Evasion, Disciplined save'leri, Push 15 ft, Fleet Step Focus'u, menzilli geri yöneltme) | Regresyon güvencesi | — | 1–2 saat |

### Karar gerekli (temel akışı değiştirir)

| # | Konu | Neden karar | Tahmini iş |
|---|---|---|---|
| K1 | **"Yalnız Monk silahı taşırken"** (A5) | Oyunda eldeki eşya modeli yok (DECISIONS 4661); şart için taşınan silahlardan "elde olan" ayrımı gerekir (bütün sınıfları etkiler) | Orta-büyük |
| K2 | **Stunning Strike zamanlaması** (A23): SRD "isabet anında", oyun "bu tur son vurulan hedefe, turun herhangi anında" | Paladin Divine Smite ile aynı yorum (PALADIN-DENETIM K1); isabet anında soru akışı tepki sistemine benzer bir istem ister | Orta |
| K3 | **Otomatik harcamalar**: Disciplined Survivor her başarısız save'de Focus harcar, Uncanny Metabolism her savaş başında kendiliğinden | SRD "can"; oyuncuya sormak yeni istem akışı ister, ama Focus israfı oyuncu kararını yok sayar | Orta |

Probe'larla denenip **doğru** bulunan davranışlar (regresyon için not): Martial Arts zarı, Focus, Unarmored Movement, Extra Attack, Deflect bonusu, Slow Fall ve Focus DC tabloları 20/20; Unarmored Defense (1 ve 20. seviye); kalkanla Martial Arts/Unarmored Defense/Movement kapanması; Grapple/Shove DEX DC'si; Focus'suz bonus Dash/Disengage; Flurry 9/10 = 2/3; Heightened Patient Defense geçici HP; Fleet Step'in Focus'lu Step of the Wind'i; Deflect Energy 12/13 farkı; menzilli saldırıda 0'a inen hasarın 60 ft içinde geri yöneltilmesi; Evasion (Stunned'da yarı); Disciplined Survivor save yetkinliği; Superior Defense'in Force hariç 12 türü; Open Hand Push 15 ft; ASI/Epic Boon yuvaları; Focus kısa dinlenmede, Metabolism ve Wholeness yalnız uzun dinlenmede dolar.

## Görev B95 (2026-11-20)

**A) Sürümsüz (yapıldı).** `data/secim-degisim.json`'a `monk` kaydı eklendi; Serüven'de "Seçimler" düğmesi çıkar ve B93'ün ortak yardımcısıyla (`src/rules/levelChoices.ts`, `set_choices`) seçim yapılır. Yeni seçimler (alt sınıf 3. seviyede, ASI/feat ve Epic Boon yuvaları; Monk'ta Weapon Mastery yok ve değişen seçim yok, kayıt boş: SRD 5.2.1 s. 49–52) yalnız eklenir; eksik seçim varken düğme "Seçimler (seçim bekliyor)" olur (`pendingChoices`). Serüven'de alt sınıf **otomatik atanmaz**: seçim kipinde (Builder `choices`) boş alt sınıf açılışta da olsa eksik sayılır, Kaydet onu ister. Seçim kipine Weapon Mastery seçicisi eklendi (donanım adımı bu kipte yok). Test: `src/rules/levelChoices.test.ts` "Görev B95 (A)", `src/screens/b95Secim.test.tsx`.

**B) Sürümlü (bekliyor).** Kapı: `birlesik`'te kural sürümü 95 ve 96 yok (güncel 94); Stunning Strike başarılı save'de hız yarılanması ve zırhlı Monk'un Unarmed Strike sonrası Stunning Strike'ı, Self-Restoration'ın tek durum kaldırması, Quivering Palm'ın yalnız Unarmed Strike isabetiyle kurulması (bizim alt sınıf metni), Superior Defense'in 10 tur sürmesi yapılmadı.

**C) Ertelendi, karar gerekli.** Monk silahı dışında silah taşırken bonus vuruş modeli (SRD 5.2.1 s. 50 Martial Arts); yapay zekânın Patient Defense, Step of the Wind (s. 50), Wholeness of Body, Superior Defense (s. 52) ve Quivering Palm (bizim alt sınıf) kullanması (YZ davranışı denge değiştirir, denge turuna kalır).
