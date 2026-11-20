# Barbarian denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Güncel kural sürümü 94 (`data/kural-surumu.json`, `src/battle/b94Surum.ts`) üzerinden okundu. Emin olunmayan satırlar geçici vitest probe'larıyla denendi (`src/battle/zzTmpBarbarian*.test.ts`, iş bitince silindi; depoda yalnız bu belge kaldı). Probe kanıtı "P#" ile anılır (aşağıda "Probe dökümü").

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 28–30 (`pdftotext -layout`; sayfa numaraları PDF alt bilgisindeki SRD sayfasıdır), Weapon Mastery özellikleri s. 89–90, Epic Boon feat'leri s. 88; `data/srd/classes.json`, `data/srd/progression.json`. Oyun tarafı: `data/class-features.json` (`barbarian:*`, kaynaklar `rage`, `relentlessRage`, `persistentRage`, `intimidatingPresence`), `src/battle/rage.ts`, `brutal.ts`, `capstones.ts`, `damage-effects.ts`, `apex.ts`, `mind.ts`, `reactions.ts`, `reduce.ts`, `ai.ts`, `src/rules/classFeatures.ts`, `mastery.ts`, `skills.ts`, `levelChoices.ts`, `data/secim-degisim.json`.
**Path of the Berserker** `icerik/` paketinde (gitignore) yaşar; bu checkout'ta yok. Mekanik **fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:5`, `path-of-the-berserker`; CLAUDE.md: pakette "aynı kimlik ve mekanik"); farklar `harita/belgeler/AS2-FARKLAR.md:35-37`. Alt sınıf satırlarında ölçüt **bizim sürüm** (fikstür metni/effect'i); SRD'ye göre "aykırı" sayılmadı. Gerçek paketin Türkçe adları görülmedi.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar) · **doğrulanmadı** (bu denetimde çalıştırılamadı, tahmin yazılmadı). **[bilinen]** = DECISIONS.md ya da denetim belgelerinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye (alt sınıfta fikstüre) aykırı, bilinçsiz.

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d12, STR+CON save, 2 beceri (Animal Handling, Athletics, Intimidation, Nature, Perception, Survival), Simple+Martial silah, Light/Medium zırh + Shield; ekipman A: Greataxe, 4 Handaxe, Explorer's Pack, 15 GP ya da B: 75 GP | 28 |
| S2 | Barbarian Features tablosu: Rages 2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6; Rage Damage +2 (1–8), +3 (9–15), +4 (16–20); Weapon Mastery 2 (1–3), 3 (4–9), 4 (10+) | 28 |
| S3 | Rage (1): Bonus Action, Heavy zırhla değil; kısa dinlenmede 1, uzun dinlenmede hepsi; B/P/S direnci; STR ile silah/Unarmed saldırısına Rage Damage; STR kontrol ve save'lerinde avantaj; konsantrasyon ve büyü yok | 28–29 |
| S4 | Rage süresi: sonraki turunun sonuna dek; Heavy zırh giyince ya da Incapacitated olunca biter; **sonraki turunda** düşmana saldırı zarı, düşmana save yaptırma ya da Bonus Action ile bir tur uzar; en çok 10 dk | 29 |
| S5 | Unarmored Defense (1): zırhsız AC 10 + DEX + CON, kalkanla da | 29 |
| S6 | Weapon Mastery (1): Simple/Martial **Melee** silah türleri; uzun dinlenmede **bir** seçim değişir | 29 |
| S7 | Danger Sense (2): DEX save'lerinde avantaj (Incapacitated değilken) | 29 |
| S8 | Reckless Attack (2): turun ilk saldırı zarında seçilir; sonraki turunun başına dek STR saldırılarında avantaj, sana yapılan saldırılarda avantaj | 29 |
| S9 | Alt sınıf (3); Primal Knowledge (3): Barbarian listesinden bir beceri daha; Rage'de Acrobatics, Intimidation, Perception, Stealth, Survival STR ile yapılabilir | 29 |
| S10 | ASI (4/8/12/16), Epic Boon (19) | 29–30 |
| S11 | Extra Attack (5); Fast Movement (5): Heavy zırhsız +10 ft | 29 |
| S12 | Feral Instinct (7): inisiyatifte avantaj; Instinctive Pounce (7): Rage'e girdiğin Bonus Action'ın parçası olarak yarım hız hareket | 29 |
| S13 | Brutal Strike (9): Reckless kullanınca turunda bir STR saldırısında avantajdan vazgeç (dezavantajlı olmamalı); isabette aynı türde +1d10 ve bir etki: Forceful Blow (15 ft it, sonra yarım hız hedefe doğru fırsat saldırısız yürü) ya da Hamstring Blow (hız −15 ft sonraki turunun başına dek; aynı anda yalnız en son Hamstring) | 29–30 |
| S14 | Relentless Rage (11): Rage'deyken 0 HP'ye düşüp **anında ölmezsen** DC 10 CON save; başarıda HP = 2 × Barbarian seviyesi; her kullanımda DC +5; kısa/uzun dinlenmede 10 | 30 |
| S15 | Improved Brutal Strike (13): Staggering Blow (sonraki save'i dezavantajlı, sonraki turunun başına dek fırsat saldırısı yok), Sundering Blow (sonraki turunun başına dek **başka bir yaratığın** hedefe sonraki saldırısına +5; saldırı başına bir); (17): 2d10, iki farklı etki | 30 |
| S16 | Persistent Rage (15): inisiyatifte Rage kullanımları dolabilir (uzun dinlenmede bir); Rage uzatmasız 10 dk sürer, yalnız **Unconscious** olunca ya da Heavy zırh giyince erken biter | 30 |
| S17 | Indomitable Might (18): STR kontrol/save toplamı STR skorundan küçükse skor; Primal Champion (20): STR ve CON +4, en çok 25 | 30 |
| S18 | Path of the Berserker (fikstür = bizim sürüm): Frenzy (3), Mindless Rage (6), Retaliation (10), Intimidating Presence (14: Bonus Action, 30 ft, WIS save DC 8 + STR + PB, 1 dk Frightened, tur sonunda tekrar; uzun dinlenmede bir ya da bir Rage kullanımıyla) | 30 (fikstür `:5`) |

## Özet

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 33 | 25 | 7 | 0 | 1 | 0 |
| B) Oluşturucu / seviye atlama | 10 | 9 | 1 | 0 | 0 | 0 |
| C) Dinlenme, Serüven, kayıt | 8 | 4 | 1 | 2 | 0 | 1 |
| D) Yapay zekâ | 8 | 5 | 2 | 1 | 0 | 0 |
| E) Arayüz ve TR/EN | 7 | 2 | 4 | 0 | 0 | 1 |
| **Toplam** | **66** | **45** | **15** | **3** | **1** | **2** |

(Sayım tablo satırlarının durum sütunundan: "tam (…)" tam, "kısmi (…)" kısmi sayıldı. **[YENİ]** bulgu: 14. **[hata]**: 5 (A7, A21, A22, A25, A27).)

## En önemli bulgular

1. **[YENİ] Serüven'de Barbarian seçimleri hiç bağlı değil** (C4–C6): `data/secim-degisim.json`'da `barbarian` anahtarı yok, `choicesBound('barbarian')` false, `set_choices` "Bu sınıfın seçim değişimi henüz bağlı değil" ile reddediliyor (P1). Serüven'de 2 → 3 seviye atlayan Barbarian'ın `subclassId`'si boş kalır, Frenzy/Mindless Rage/Retaliation/Intimidating Presence hiç gelmez; 4. seviyedeki ASI ve 3. ustalık, 10'daki 4. ustalık, uzun dinlenmede ustalık değişimi de yok. Primal Knowledge'ın 3. seviye becerisi bağlansa bile yazılamaz (`skills` `CHOICE_FIELDS`'te değil). Genel M4 "Karar bekleyen" (DECISIONS 5068) biliniyor; B93/B94 bağlamayı veri satırına indirdi ama Barbarian'ı listelemedi.
2. **[YENİ, hata] Rage "düşmana save yaptırma" ile uzamıyor** (A7): yalnız saldırı zarı, Shove ve Topple uzatıyor. Grapple (save'li), Intimidating Presence ve Dragonborn nefesi uzatmıyor; IP kullanan Barbarian'ın Rage'i tur sonunda bitti (P2).
3. **[YENİ, hata] Persistent Rage Stunned/Paralyzed gibi her Incapacitated'da bitiyor** (A27; SRD: yalnız Unconscious). `dropBrokenRage` Persistent'a bakmıyor (P2).
4. **[YENİ, hata] Relentless Rage anında ölümde de çalışıyor** (A25): 5/30 HP'de 100 hasar → `instant_death` yerine HP 22 (P2). SRD "don't die outright".
5. **[YENİ, hata] Improved Brutal Strike'ın iki etkisi yanlış harcanıyor** (A21, A22): Sundering AC −5 olarak yazıldığı için Barbarian'ın kendi Extra Attack'ı da +5 alıyor ve etki harcanmıyor; Staggering yalnız `save_resolved`/`condition_save` ile harcanıyor, tur sonu tekrar save'inde (`effect_tick`) dezavantaj uygulanıp etki kalıyor (10 tura dek).
6. **[YENİ] Yapay zekâ Intimidating Presence'ı hiç kullanmıyor; Brutal Strike'ta yalnız Forceful/Hamstring** (D4, D5).
7. İyi haber: Rage sayısı, Rage Damage, Weapon Mastery sayısı, saldırı sayısı, hız, AC, HP, save, ASI/Epic Boon tabloları 1–20 SRD ile aynı (P1); Frenzy, Mindless Rage, Retaliation, Indomitable Might, Primal Champion, Feral Instinct, Danger Sense, Reckless çalışıyor.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Rage: Bonus Action, Heavy zırhla başlatılamaz, kullanım düşer (s. 28) | Bonus eylem; Heavy zırhla ve kullanım yokken red; kaynak 1 azalır | tam | `rage.ts:17-23`; `rage.test.ts` "bonus eylem…", "ağır zırhla…" | 6735 |
| A2 | B/P/S direnci (s. 29) | Rage'in eklediği dirençler; bitince yalnız onlar kalkar | tam | `reduce.ts:522-527`; `rage.test.ts` "direnç" | 6735 |
| A3 | Rage Damage: STR ile silah ya da Unarmed Strike saldırısı | `usesStrength` (STR, büyü değil); sabit hasarlı Unarmed'e de; fırlatılan Handaxe STR (P1/P2) | tam | `rage.ts:58-70`; `rage.test.ts` "STR saldırısına Rage hasarı" | 6735 |
| A4 | STR kontrol ve save'lerinde avantaj | STR save'i (`durations.ts:166`) ve STR'ye dönen beceri kontrolü (`skills.ts:92-95`); oyunda becerisiz STR kontrolü yok | tam | `rage.test.ts` "STR save ve Athletics avantajlı" | 6735 |
| A5 | Konsantrasyon ve büyü yok | Rage başlarken konsantrasyon biter; büyü reddedilir | tam | `reduce.ts:1097-1104`; `rage.test.ts` | 6735 |
| A6 | Sonraki turunun sonuna dek; düşmana saldırı zarı, save yaptırma ya da Bonus Action uzatır | `refreshed` işareti: `attack_resolved`, `shove_resolved`, `mastery_applied.save` (Topple) ve `rage_extended`; tur sonunda uzamamışsa `rage_ended` | tam (A7 dışında) | `reduce.ts:538-544, 579, 1092, 1133`; `rage.ts:80-86`; `rage.test.ts` "süre" | 6735 |
| A7 | "Force an enemy to make a saving throw" uzatır | Grapple (`condition_save` + `grappled`), Intimidating Presence (`save_resolved`) ve `area_used` (Dragonborn nefesi) `refreshRage` çağırmıyor. P2: IP sonrası `refreshed: false`, tur sonunda Rage bitti; Grapple sonrası `false`, Shove sonrası `true` | kısmi **[YENİ, hata]** | `reduce.ts:982-993, 1169, 1503`; P2 (nefes kod okuması) | 6735 |
| A8 | Uzatma "sonraki turunda" yapılan eylemle | Başkasının turundaki fırsat saldırısı (ve Retaliation) da `refreshed` yazar; P2: düşman turunda OA → `refreshed: true`, Barbarian kendi turunda hiçbir şey yapmasa da Rage sürer | kısmi **[YENİ]** (yorum; "Karar gerekli" K2) | `reduce.ts:579`; P2 | — |
| A9 | Incapacitated olunca biter | `dropBrokenRage`: 0 HP ya da Incapacitated | tam | `reduce.ts:530-536`; `rage.test.ts` "Incapacitated olunca biter" | 6735 |
| A10 | Heavy zırh giyince biter; en çok 10 dk | Savaşta zırh değişimi yok; 10 dk (100 tur) savaşta etkisiz | tam (savaşta etkisiz) | veri notu `class-features.json:888` | 6735 |
| A11 | Unarmored Defense: 10 + DEX + CON, kalkanla | DEX 14/CON 16 → 15; kalkanla 17 (P1) | tam | `class-features.json:852-860`; P1 | 6735 |
| A12 | Weapon Mastery etkileri | Seçilen silahların ustalığı savaşta otomatik (ortak sistem) | tam | `src/battle/mastery.ts`; CLAUDE.md "Weapon Mastery" | Görev P0 |
| A13 | Danger Sense: DEX save avantajı, Incapacitated değilken | `saveAdvantage: dex`, Incapacitated'da yok | tam | `rage.test.ts` "Danger Sense" | 6747 |
| A14 | Reckless: turun ilk saldırısından önce; STR saldırısı avantajlı, sana saldırı avantajlı, sonraki turunun başına dek | `reckless` işareti (`end: turnStart`); saldırıdan sonra seçilemez | tam | `rage.ts:44-55`; `reduce.ts:1112-1117`; `rage.test.ts` "Reckless Attack" | 6746 |
| A15 | Primal Knowledge: Rage'de beş beceri STR ile | STR daha yüksekse STR ve Rage'in STR avantajı (Gizlen, Ara, harita kontrolleri) | tam | `skills.ts:78-95`; `rage.test.ts` "Primal Knowledge" | 6748 |
| A16 | Extra Attack (5) | `attacksPerAction` 4'te 1, 5'te 2 (P1) | tam | P1 | 6735 |
| A17 | Fast Movement: Heavy zırhsız +10 ft | 5. seviyede 30 → 40; Chain Mail ile 30, Breastplate ile 40 (P1) | tam | `class-features.json:867-873`; P1 | 6735 |
| A18 | Feral Instinct: inisiyatif avantajı | `feral-instinct` izi, Remarkable Athlete kancası | tam | `create.ts:825`; `k39.test.ts:18-20` | 4967 |
| A19 | Instinctive Pounce: Rage'in Bonus Action'ının parçası olarak yarım hız | O tur yarım hız ek hareket (turun herhangi bir anında) | bilinçli sapma | `rage.ts:32-41`; `k18h3.test.ts:66` | 4741 |
| A20 | Brutal Strike: Reckless turunda bir STR saldırısında avantajdan vazgeç (dezavantajlı değil), +1d10 aynı tür, Forceful (15 ft + yarım hız takip) ya da Hamstring (−15 ft, tek Hamstring) | Avantaj düşer, +1d10, itme 3 altıgen (P2), Hamstring −15 ft; Reckless yokken ya da dezavantaj varken `brutal` sessizce düşer (P2); 9. seviyede Staggering reddedilir (P2). **Forceful'un takip yürüyüşü yok**; iki Barbarian'ın Hamstring'i üst üste biner (etki kimliği kişi+tur; kod okuması) | kısmi **[bilinen]** | `brutal.ts`; `features.ts:262-263, 348, 410-412`; `k18h3.test.ts:81`; P2 | 4741 |
| A21 | Staggering Blow: **sonraki** save dezavantajlı | `saveDisAll` (10 tur); yalnız `save_resolved`/`condition_save` harcar. P2: tur sonu tekrar save'i (`effect_tick`) iki zarla atıldı, Staggering kaldı → sonraki save'ler de dezavantajlı | kısmi **[YENİ, hata]** | `brutal.ts:44-46`; `reduce.ts:261-262`; P2 | 4613 |
| A22 | Sundering Blow: **başka bir yaratığın** sonraki saldırısına +5 | Hedefin AC'si −5 (`consumeOnAttacked`, Barbarian'ın saldırısı harcamaz) ama `effectiveAc` saldırana bakmaz: P2'de Barbarian'ın kendi ikinci saldırısı AC 10 (15 − 5) gördü, etki sürdü | kısmi **[YENİ, hata]** | `brutal.ts:48-50`; `divine.ts:288-295`; `reduce.ts:271-272`; P2 | 4613 |
| A23 | 17: 2d10 ve iki farklı etki | 17'de `[7,7]` 2d10, Hamstring + Staggering; 13'te ikinci etki reddedilir (P2); aynı etki iki kez yok (`brutal2 !== brutal`) | tam | `brutal.ts:19-38`; `k19tier4a.test.ts:48`; P2 | 4613 |
| A24 | Relentless Rage: DC 10, +5 her kullanımda, HP 2 × seviye | Kaynak `relentlessRage` sayaç; DC 10 → 15; HP 24 (12. seviye) | tam | `damage-effects.ts:61-73`; `k19tier4a.test.ts:29` | 4613 |
| A25 | "…and don't die outright" | Relentless önce çalışır: 5/30 HP'de 100 hasar → HP 22 (Relentless yokken `instant_death`) (P2) | kısmi **[YENİ, hata]** | `damage-effects.ts:63`; P2 | — |
| A26 | Persistent Rage: inisiyatifte Rage dolar, uzun dinlenmede bir | Savaş başında Rage eksikse doldurur ve `persistentRage` harcar; doluysa harcamaz | tam | `capstones.ts:14-20`; `commands.ts:406`; `k19tier4a.test.ts:43` | 4613 |
| A27 | Persistent Rage: uzatmasız sürer; **yalnız Unconscious** ya da Heavy zırhla biter | Uzatmasız sürer (P2) ama `dropBrokenRage` her Incapacitated'da bitirir: 15. seviye Barbarian Stunned olunca `rage: null` (P2) | kısmi **[YENİ, hata]** | `reduce.ts:530-536`; `rage.ts:80-84`; P2 | 4613 |
| A28 | Indomitable Might: STR kontrol/save toplamı < STR skoru → skor | `mightFloor` STR save'inde ve Athletics kontrolünde (oyundaki tek STR becerisi) | tam | `effectDice.ts:134-139`; `k19tier4a.test.ts:37` | 4613 |
| A29 | Primal Champion: STR/CON +4 (en çok 25) | 20. seviyede STR 15 → 19, CON 16 → 20, AC 15 → 17, `strScore` 19 (P1) | tam | `stats.ts:172`; `k19tier4a.test.ts:18`; P1 | 4613 |
| A30 | Frenzy (fikstür): Rage + Reckless, turunda STR ile ilk isabete Rage Damage kadar d6, aynı tür | `canFrenzy`; `${rageDamage}d6` silah türünde, turda bir | tam | `rage.ts:72-77`; `features.ts:171-176`; `rage.test.ts` "Frenzy" | 6752, 6662 |
| A31 | Mindless Rage (fikstür): Rage'de Charmed/Frightened bağışıklığı; girişte biter | `conditionAura` süzgeci; `mindlessRageClear` girişte temizler | tam | `mind.ts:43`; `k17g2.test.ts:79`; `k18h3.test.ts:75` | 4790, 4741 |
| A32 | Retaliation (fikstür): 5 ft içinden hasar → tepkiyle bir yakın dövüş saldırısı | `retaliate` tepkisi: saldırı, büyü ve alan hasarından sonra; alan/aura bölgesi hasarında yok (Hellish Rebuke ile aynı, CLAUDE.md "Tepkiler") | tam | `reactions.ts:636-641`; `reactions.test.ts:178-181` | 6524, 6554 |
| A33 | Intimidating Presence (fikstür: 30 ft'te görülen düşmanlar, WIS DC 8 + STR + PB, 1 dk, tur sonu tekrar; kullanım yoksa Rage) | Bonus eylem; DC 16 (STR 3 + PB 5); Frightened + tekrar save; ikinci kullanımda Rage 5 → 4 (P2) | tam (bizim sürüm) | `apex.ts:75-80, 137-158`; `k19tier4b.test.ts:44`; P2 | 4599 |

## B) Oluşturucu ve seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Çekirdek: d12, STR/CON, 2 beceri / 6, Martial, Light/Medium/Shield | `data/classes.json` (barbarian) birebir; P1 save'ler STR/CON yetkin | tam | veri karşılaştırması; P1 | — |
| B2 | Ekipman A/B (Greataxe, 4 Handaxe, Explorer's Pack, 15 GP) | Paket seçimi yok; öneri Zırhsız + Greataxe + Handaxe (genel SD3 düzeni) | kısmi **[bilinen, genel]** | `data/onerilen-baslangic.json:4-11` | SD3 |
| B3 | Rages / Rage Damage tablosu (S2) | 20/20 SRD ile aynı (P1) | tam | P1 | 6735 |
| B4 | Weapon Mastery 2/3/4, yalnız Melee | `count` 2,2,2,3…3,4 (10+); seçenekler yalnız yakın dövüş silahı (P1: menzilli yok); `swap: 1` | tam | `class-features.json:1331-1338`; `mastery.ts:39-43`; P1 | Görev P0 |
| B5 | Primal Knowledge: 3. seviyede ek beceri | 3. seviyede "Sınıf becerileri: 3 beceri" istenir (P1); `extraClassSkills: 1` | tam | P1; `rage.test.ts` "veri" | 6748 |
| B6 | Alt sınıf 3. seviyede | "Alt sınıf seçilmeli (3. seviyede)" (P1); seçilmezse alt sınıf özelliği yok | tam | P1; `rage.test.ts:47` | AS2 |
| B7 | ASI 4/8/12/16, Epic Boon 19 | `advancementSlots` 20/20 SRD (P1) | tam | `advancement.ts:34`; P1 | — |
| B8 | Primal Champion skor tavanı 25 | Taban 20 tavanlı, sonra +4 en çok 25 (P1: 20 → 24) | tam | `stats.ts:168-172`; P1 | 4613 |
| B9 | HP: 12 + CON, sonra 7 + CON | 1. seviye 15, seviye başına +10 (CON +3) (P1) | tam | P1 | — |
| B10 | Unarmored Defense ve Fast Movement oluşturucu türetmesinde | `deriveStats` AC 15/17 (kalkan), hız 40 (5+) | tam | P1 | 6735 |

## C) Dinlenme, Serüven ve kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Rage: kısa dinlenmede 1, uzun dinlenmede hepsi | `recharge: { short: 1, long: all }`; P2: 0 → kısa dinlenme → 1 | tam | `class-features.json:82-92`; P2 | 6735 |
| C2 | Relentless Rage DC kısa/uzun dinlenmede 10 | `relentlessRage` kısa/uzun `all`; P2: 7 → 10 | tam | `class-features.json:648-657`; P2 | 4613 |
| C3 | Persistent Rage ve Intimidating Presence uzun dinlenmede | İkisi `recharge.long: all` | tam | `class-features.json:659-678` | 4613, 4599 |
| C4 | Weapon Mastery: uzun dinlenmede **bir** seçim değişir | Karakter listesinde uzun dinlenme sonrası "silah talimi" (`masterySwapLimit` = 1). Serüven'de yok: `barbarian` `secim-degisim.json`'da değil, `set_choices` reddedilir (P1) | kısmi **[YENİ]** | `Screens.tsx:285-315`; `seruven.ts:803`; P1 | 26 (B93 A2), 10 (B94 A1) |
| C5 | Seviye atlamada alt sınıf (3), ASI/feat (4/8/12/16), Epic Boon (19), yeni ustalık (4, 10) | Serüven `seruven_leveled` yalnız seviyeyi artırır; Barbarian için "Seçimler" düğmesi yok (`choicesBound` false). P1: 2 → 3 sonrası `subclassId` boş, `set_choices` "henüz bağlı değil". Alt sınıf özellikleri, ASI ve yeni ustalık hiç gelmez | yok **[bilinen]** (Barbarian'ın bağlanmadığı ayrıntısı **[YENİ]**) | `seruven.ts:313, 432, 803`; `SeruvenScreen.tsx:436`; P1 | 5068 (M4), 26 |
| C6 | Primal Knowledge becerisi 3. seviyede seçilir | Serüven seçim alanlarında `skills` yok (`CHOICE_FIELDS`), Builder seçim kipi beceri değiştirmez: Barbarian bağlansa da bu beceri eklenemez | yok **[YENİ]** | `levelChoices.ts:20-21`; DECISIONS 26 ("sınıf/tür/skor/beceri değişmez") | 26 |
| C7 | Seviye atlayınca artan Rage hakkı | K10: kaynak en çok + harcanan (Rage 2 → 3 takılmaz) | tam (dolaylı) | DECISIONS 5984 | 5984 |
| C8 | Savaş sonrası Rage kullanımı ve Relentless sayacı karakterde kalır | Genel kaynak taşıma; Barbarian için Serüven'de uçtan uca çalıştırılmadı | doğrulanmadı | — | K10 |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Rage başlatma | Yaralıyken ya da 10 ft'te düşman varken; P3: 2/9/14/17. seviyede ilk komut `rage` | tam | `ai.ts:1500-1507`; P3; `rage.test.ts` "yapay zekâ" | 6752 |
| D2 | Rage'i Bonus Action ile uzatma | Eylemi bitmiş ve uzamamışsa `rage` (P3) | tam | `ai.ts:1506`; P3 | 6752 |
| D3 | Reckless Attack | HP yarıdan fazlaysa ve en iyi seçenek STR saldırısıysa; düşük HP'de yok (P3) | tam | `ai.ts:2087-2091`; P3 | 6752 |
| D4 | Brutal Strike | 20+ HP hedefte; bitişik tek düşmanda Forceful, değilse Hamstring. Staggering/Sundering hiç seçilmez, 17'de ikinci etki yok (P3: 17. seviyede `attack:forceful`) | kısmi **[YENİ]** | `ai.ts:1619-1631`; P3 | 4741 |
| D5 | Intimidating Presence | Hiç kullanılmıyor: `ai.ts` `fearAura`'ya bakmıyor. P3: 14. seviye, 30 ft'te 3 düşman, Rage sürüyor ve bonus eylem boş → `reckless > attack > move > attack > end_turn` | yok **[YENİ]** | `grep fearAura` (ai.ts, ai/*.ts); P3 | 4599 |
| D6 | Retaliation | Tepki önerisi kancasız Rng'de kural tabanlı (`suggested`) | tam | `reactions.ts:642-643`; `reactions.test.ts:178` | 6538 |
| D7 | Pasifler: Frenzy, Instinctive Pounce, Persistent/Relentless Rage, Feral Instinct | Otomatik; Pounce hareketi YZ'nin sonraki `move`'unda harcanır (P3) | tam | P3 | — |
| D8 | Taraf değiştirmiş (Dominate, `allegianceSwap`) Barbarian | Düşman tarafında Rage ve Reckless kullanılmıyor (Reckless kodda `side === 'party'`); P3: düşman tarafı 9. seviye → `shove > shove > end_turn` | kısmi **[YENİ]** | `ai.ts:2088`; P3 | — |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Menü adları (SD4: sınıf özelliği adları İngilizce) | TR menü "Öfke", "Öfkeyi sürdür", "Pervasız", "Korkutucu Duruş"; EN "Rage", "Reckless". SD2 kısa Türkçe menü adı ↔ SD4 çelişkisi Ranger denetiminde yazıldı | kısmi **[bilinen]** | `strings.tr2.ts:470, 476`; `RANGER-DENETIM.md` E1 | SD4 (368) |
| E2 | Intimidating Presence EN adı | EN menüde "Scary Presence" (özellik adı "Intimidating Presence") | kısmi **[YENİ]** | `strings.en.ts:1262` | SD4 |
| E3 | Sınıf özelliği açıklamaları (TR/EN) | `data/aciklamalar.json` `features` 16/16 TR + EN. TR Danger Sense "Görebildiğin etkilere karşı" (2014 metni; 5.2.1: Incapacitated değilken), Persistent Rage "ya da sen bitirince" (SRD'de isteğe bağlı bitirme yok; Heavy zırh yazılmamış) | kısmi **[YENİ]** | `aciklamalar.json:8, 18` | SD4 |
| E4 | Berserker TR adları | Fikstür "Çılgın Savaşçı Yolu", "Korkutucu Varlık"; AS2-FARKLAR kitapçık adı "Berserker Yolu"; menü "Korkutucu Duruş". Gerçek paket görülemedi | doğrulanmadı | fikstür `:9-11, 81`; `AS2-FARKLAR.md:22` | AS2 |
| E5 | Brutal Strike seçimi | Saldırı balonunda TR/EN adlı seçim kutuları, 17'de iki seçim; kutular Reckless yokken de görünür, seçim komutta sessizce düşer (kod okuması, arayüz çalıştırılmadı) | kısmi **[YENİ]** | `MapBattle.tsx:811-818, 2799-2805` | 4614 |
| E6 | Günlük metinleri | Rage başladı/uzadı/bitti, Reckless TR + EN | tam | `strings.tr2.ts:378-382`; `strings.en.ts:1047-1051` | — |
| E7 | Menü yeri ve ikonlar | Rage "Özel ▸ Dövüş", bonus eylem maliyeti (`actionMenu.test.ts:30, 41`); Rage kaynak çipi metin (E4c ikon setinde Rage yok) | tam | `actionMenu.ts:69`; `data/kaynak-ikon.json` | E4c |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: yeni kural sürümü gerekiyorsa **güncel sürümün bir fazlası, tek sabit** (bu denetimdeki sürümlü maddelerin hepsi aynı sabitle). SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Barbarian'ı Serüven seçimlerine bağla** (C4, C5): `data/secim-degisim.json` `barbarian: { weaponMasteries: { dinlenme: 1 } }` (alt sınıf, ASI/Epic Boon `advancements` yazılmadığı için yalnız eklenir); `levelChoices.test.ts` "bağlı sınıflar" listesine ekle | Yüksek (Serüven'de 3+ seviye Barbarian alt sınıfsız) | Sürümsüz (veri) | 0,5 saat |
| 2 | **Primal Knowledge becerisi Serüven'de** (C6): seçim kipinde yalnız eksik sınıf becerisinin eklenmesi (`skills` yalnız eklenir); ortak yardımcıda | Orta | Sürümsüz | 1–2 saat |
| 3 | **Rage'i save yaptırma ile uzat** (A7): `condition_save` (Grapple), `save_resolved` (Intimidating Presence ve diğer özellik save'leri), `area_used` hedefleri için `refreshRage` (düşman hedef) | Orta (IP kullanan Barbarian'ın Rage'i bitiyor) | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 4 | **Persistent Rage yalnız Unconscious'ta bitsin** (A27): `dropBrokenRage`'de `persistent-rage` izinde Incapacitated yerine Unconscious/0 HP | Orta (15+ seviye) | Güncel sürümün bir fazlası, tek sabit | 0,5 saat |
| 5 | **Relentless Rage anında ölümde çalışmasın** (A25): `damage-effects.ts`'te masif hasar denetimi Relentless'tan önce | Orta-düşük (11+ seviye, nadir) | Güncel sürümün bir fazlası, tek sabit | 0,5 saat |
| 6 | **Sundering Blow** (A22): AC −5 yerine saldıranı bilen +5 (ör. etkide `attackedBonus` + `exceptSource`) ya da `effectiveAc`'de kaynağın kendi saldırısını hariç tut | Orta (13+ seviyede her Extra Attack +5) | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 7 | **Staggering Blow** (A21): dezavantajlı ilk save'de (tekrar save `effect_tick`, alan/bölge save'leri, konsantrasyon) etkiyi harca | Düşük-orta | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 8 | **Yapay zekâ** (D4, D5, D8): Intimidating Presence (30 ft'te ≥ 2 düşman, Frightened bağışıklığı yok), Staggering/Sundering seçimi ve 17'de ikinci etki; taraf değiştirmiş Barbarian'da Rage/Reckless. **Sim imzasını değiştirir**, 3–4 senaryolu hızlı regresyon | Orta | Güncel sürümün bir fazlası, tek sabit (YZ kararı) | 2–3 saat + regresyon |
| 9 | **Forceful Blow takip yürüyüşü** (A20, bilinen): yarım hız hedefe doğru fırsat saldırısız hareket (Brutal sonrası isteğe bağlı komut) | Düşük | Güncel sürümün bir fazlası, tek sabit | 2 saat |
| 10 | **Metin** (E2, E3, E5): EN "Scary Presence" → "Intimidating Presence"; TR Danger Sense ve Persistent Rage açıklamaları 5.2.1'e; Brutal seçim kutularını Reckless yokken gizle/soluklaştır | Düşük | Sürümsüz | 1 saat |
| 11 | **Testler**: P1 tabloları (Rage/Rage Damage/ustalık 1–20), A7/A21/A22/A25/A27 probe'larını kalıcı teste çevir | Regresyon | — | 1–2 saat |

### Karar gerekli (temel akışı değiştirir)

| # | Konu | Neden karar | Tahmini iş |
|---|---|---|---|
| K1 | **Serüven seviye atlama ve dinlenme seçimleri** (C5, bilinen M4 DECISIONS 5068): B93/B94 yolu Barbarian'a yalnız veriyle uzanıyor (öneri 1); fakat seçim yapılmazsa alt sınıfın varsayılanla atanması (`migrateSubclasses` gibi) Serüven'e de uygulanmalı mı | Seçimi zorunlu mu, varsayılan mı: Serüven akışı kararı, bütün sınıflara ortak | 1–2 saat (ortak) |
| K2 | **Rage uzatması kimin turunda** (A8): SRD "If your Rage is still active on your next turn, you can extend…" uzatmayı Barbarian'ın turuna bağlıyor; oyun başkasının turundaki fırsat saldırısını ve Retaliation'ı da sayıyor | Yorum farkı; SRD'ye çekilirse Rage daha sık biter (denge ve YZ etkisi, sürüm gerekir) | 1 saat + hızlı regresyon |

## Probe dökümü (geçici, silindi)

- **P1** (`zzTmpBarbarian1`): 1–20 `classKit`/`combatantFromSheet`: Rage Damage 2/3/4, Rages tablosu, ustalık 2/3/4 + `melee` + `swap 1`, saldırı sayısı, hız 30/40, Heavy 30, AC 15 (kalkanla 17, 20'de 17), HP 15 + 10/seviye, STR/CON save, izler ve kaynakların geldiği seviyeler (Frenzy 3, Mindless 6, Feral/Pounce 7, Brutal 9, Retaliation 10, Relentless 11, Improved Brutal 13, IP 14, Persistent 15, Indomitable 18), Primal Champion 19 → 20 (+4), `advancementSlots`, `masteryOptions` (yalnız yakın dövüş), Handaxe/Javelin STR; oluşturucu sorunları (3 beceri, alt sınıf); `choicesBound('barbarian')` false; Serüven `level_up` 2 → 3 `subclassId` boş, `set_choices` reddi.
- **P2** (`zzTmpBarbarian2`): IP ile Rage uzamıyor ve tur sonunda bitiyor, DC 16, ikinci IP Rage harcıyor; Grapple uzatmıyor, Shove uzatıyor; düşman turunda OA uzatıyor; Persistent Rage Stunned'da bitiyor, uzatmasız sürüyor; Relentless masif hasarda (HP 22) ve doğal 1 + 10 ile başarı; Brutal: 9'da Staggering reddi, Sundering sonrası kendi saldırısı AC 10 ve etki sürüyor, 17'de 2d10 + iki etki, 13'te ikinci etki reddi, Poisoned + Reckless'ta `brutal` düşüyor, Forceful 3 altıgen itme, Reckless'sız `brutal` yok; kısa dinlenme Rage +1 ve Relentless 10; Staggering'li hedefin tekrar save'i iki zar, etki kaldı.
- **P3** (`zzTmpBarbarian3`): YZ turları 2/9/14/17 (`rage > reckless > attack[:forceful] > move > attack > end_turn`), Rage'li 14. seviye IP kullanmıyor, düşük HP'de Reckless yok, düşman tarafında `shove > shove`, bonus eylemle uzatma.
- Doğru bulunanlar (regresyon notu): S2 tabloları 20/20; Unarmored Defense, Fast Movement, Extra Attack; Rage direnç/hasar/STR avantajı/büyü yasağı; Shove ve saldırıyla uzatma; Incapacitated'da bitiş; Brutal seviye kapıları ve 17 kuralı; Relentless DC ve dinlenme sıfırlaması; Persistent Rage dolumu; Intimidating Presence DC ve Rage ile yenileme; Primal Champion skorları.

## Görev B95 (2026-11-20)

**A) Sürümsüz (yapıldı).** `data/secim-degisim.json`'a `barbarian` kaydı eklendi; Serüven'de "Seçimler" düğmesi çıkar ve B93'ün ortak yardımcısıyla (`src/rules/levelChoices.ts`, `set_choices`) seçim yapılır. Yeni seçimler (alt sınıf 3. seviyede, ASI/feat ve Epic Boon yuvaları, yeni Weapon Mastery hakkı; uzun dinlenmede bir ustalık değişimi, SRD 5.2.1 s. 29 "change one of those weapon choices") yalnız eklenir; eksik seçim varken düğme "Seçimler (seçim bekliyor)" olur (`pendingChoices`). Serüven'de alt sınıf **otomatik atanmaz**: seçim kipinde (Builder `choices`) boş alt sınıf açılışta da olsa eksik sayılır, Kaydet onu ister. Seçim kipine Weapon Mastery seçicisi eklendi (donanım adımı bu kipte yok). Test: `src/rules/levelChoices.test.ts` "Görev B95 (A)", `src/screens/b95Secim.test.tsx`.

**B) Sürümlü (bekliyor).** Kapı: `birlesik`'te kural sürümü 95 (Swarm) ve 96 (genel savaş düzeltmesi) yok (güncel 94); Rage'in kendi turunda save'le uzaması, Persistent Rage'in yalnız Unconscious'ta bitmesi, Relentless Rage'in anında ölümde çalışmaması, Improved Brutal Strike (Sundering Blow +5 ve Staggering Blow dezavantajının harcanması) yapılmadı.

**C) Ertelendi, karar gerekli.** Yapay zekânın Intimidating Presence kullanması (SRD s. 30; YZ davranışı denge değiştirir, denge turuna kalır). Primal Knowledge'ın 3. seviye becerisi Serüven seçim kipinde (C6) bu görevin kapsamında değil.
