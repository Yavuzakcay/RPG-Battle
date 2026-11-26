# Rogue denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Güncel kural sürümü 94 (`data/kural-surumu.json`) üzerinden okundu; `featuresK19` (sürüm 16) açık varsayıldı (varsayılan). Emin olunmayan satırlar geçici vitest probe'larıyla denendi (`src/battle/zzTmpRogue*.test.ts`, iş bitince silindi; depoda yalnız bu belge kaldı). Probe kanıtı "P#" ile anılır (aşağıda "Probe dökümü").

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 60–63 (`pdftotext -layout`; sayfa numarası PDF alt bilgisindeki SRD sayfası), "Rolling 20 or 1" s. 6, Weapon Mastery s. 88–90. Oyun: `data/classes.json` (rogue), `data/class-features.json` (`rogue:*`, kaynak `strokeOfLuck`), `src/rules/classFeatures.ts`, `src/battle/classTraits.ts`, `features.ts`, `economy.ts`, `shift.ts`, `reactions.ts`, `effectDice.ts`, `rules/attack.ts`, `ai.ts`, `src/rules/levelChoices.ts` + `data/secim-degisim.json`. **Thief** `icerik/` paketinde (gitignore) yaşar; bu checkout'ta yok, mekanik **fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:1064`, `thief`; farklar `harita/belgeler/AS2-FARKLAR.md:70-73`). Gerçek paketin metni/adları görülmedi ("paket görülemedi"). Alt sınıf satırlarında ölçüt fikstür metni ve `effect` notudur, SRD değil.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar ya da kayda alınması gereken sapma) · **doğrulanmadı** (bu denetimde çalıştırılamadı, tahmin yazılmadı). **[bilinen]** = DECISIONS.md ya da başka denetim belgesinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye (alt sınıfta fikstüre) aykırı, bilinçsiz.

**CLAUDE.md "Bilinen eksikler" notu eski.** Satır "yok: Thieves' Cant, Fast Hands, Supreme Sneak, Use Magic Device, Thief's Reflexes; kısmi: Cunning Strike (Poison yok, Withdraw yaklaşık), Devious Strikes (Knock Out hasarla bitmez), Second-Story Work" Görev F'nin (DECISIONS 6398) durumudur. Kuyruk 18 H3 ve Kuyruk 19 (`featuresK19`) bunların çoğunu kapattı: Poison (4660), Withdraw serbest kayma (4658), Knock Out hasarla biter (4659), Fast Hands (4640), Supreme Sneak (4745), Use Magic Device (4524), Thief's Reflexes (4603), Jumper (4639). Bugün gerçekten eksik: Thieves' Cant (hikâye) ve Jumper (A34, işaret uyuşmazlığıyla çalışmıyor).

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d8, DEX + INT save, 4 beceri (Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Persuasion, Sleight of Hand, Stealth), Simple + Finesse/Light Martial silah, Light zırh, Thieves' Tools; ekipman A (Leather, 2 Dagger, Shortsword, Shortbow, 20 Arrows, Quiver, Thieves' Tools, Burglar's Pack, 8 GP) ya da 100 GP | 60 |
| S2 | Expertise (1): iki yetkin beceri; 6. seviyede iki daha | 60 |
| S3 | Sneak Attack (1): turda bir, isabet eden saldırıda; avantaj ya da (5 ft içinde Incapacitated olmayan dost ve dezavantaj yok); Finesse ya da Ranged silah; tür silahınki; 1d6 → 10d6 (tablo) | 60–61 |
| S4 | Thieves' Cant (1): Thieves' Cant + bir dil | 61 |
| S5 | Weapon Mastery (1): iki tür, uzun dinlenmede değişir | 61, 88–90 |
| S6 | Cunning Action (2): kendi turunda Dash, Disengage ya da Hide bonus eylemle | 61 |
| S7 | Alt sınıf (3; 9/13/17), ASI (4/8/10/12/16), Epic Boon (19) | 61–62 |
| S8 | Steady Aim (3): bonus eylem, bu tur hareket etmediysen; bu turun sonraki saldırısı avantajlı; sonra tur sonuna dek Hız 0 | 61 |
| S9 | Cunning Strike (5): Sneak Attack verirken bir etki, bedel zarı atıştan önce düşer, etki hasardan sonra; DC 8 + DEX + PB. Poison (1d6; Poisoner's Kit; CON; 1 dk Poisoned, tur sonu save), Trip (1d6; Large ya da küçük; DEX; Prone), Withdraw (1d6; saldırıdan **hemen sonra** yarı Hız, fırsat saldırısız) | 62 |
| S10 | Uncanny Dodge (5): **gördüğün** saldırgan saldırı zarıyla isabet ettirince tepki, hasar yarı (aşağı) | 62 |
| S11 | Evasion (7): yarım hasarlı DEX save'inde başarı 0, başarısızlık yarı; Incapacitated iken yok | 62 |
| S12 | Reliable Talent (7): beceri ya da alet yetkinliği kullanan kontrolde d20 9↓ → 10 | 62 |
| S13 | Improved Cunning Strike (11): iki etki, her birinin bedeli | 62 |
| S14 | Devious Strikes (14): Daze (2d6; CON; sonraki turunda yalnız hareket ya da eylem ya da bonus eylem), Knock Out (6d6; CON; 1 dk ya da hasara dek Unconscious, tur sonu save), Obscure (3d6; DEX; sonraki turunun sonuna dek Blinded) | 62 |
| S15 | Slippery Mind (15): WIS ve CHA save yetkinliği | 62 |
| S16 | Elusive (18): Incapacitated değilken ona yapılan hiçbir saldırı zarı avantajlı olamaz | 62 |
| S17 | Stroke of Luck (20): başarısız D20 Testini 20'ye çevirebilirsin; kısa ya da uzun dinlenmede yenilenir | 62 |
| S18 | Thief: Fast Hands (3), Second-Story Work (3: Climber, Jumper), Supreme Sneak (9: Stealth Attack 1d6), Use Magic Device (13), Thief's Reflexes (17) | 63 |

## Özet

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 38 | 26 | 7 | 1 | 3 | 1 |
| B) Oluşturucu / seviye atlama | 8 | 6 | 1 | 1 | 0 | 0 |
| C) Dinlenme, Serüven, kayıt | 4 | 1 | 0 | 2 | 0 | 1 |
| D) Yapay zekâ | 9 | 4 | 2 | 2 | 1 | 0 |
| E) Arayüz ve TR/EN | 8 | 3 | 4 | 0 | 0 | 1 |
| **Toplam** | **67** | **40** | **14** | **6** | **4** | **3** |

(Sayım tablo satırlarının durum sütunundan: "tam (…)" tam, "kısmi (…)" kısmi sayıldı. **[YENİ]** bulgu: 15. **[hata]**: 4 (A5, A9, A19, A34).)

## En önemli bulgular

1. **[YENİ] Serüven'de Rogue'un hiçbir seçimi değişmiyor/eklenmiyor** (C2, C3). `data/secim-degisim.json`'da `rogue` yok, `choicesBound('rogue')` false (P1): Serüven'de "Seçimler" düğmesi çıkmıyor (`SeruvenScreen.tsx:436`), `set_choices` reddediliyor (`seruven.ts:802`). 6. seviye Expertise, ASI/feat (4/8/10/12/16), Epic Boon (19) ve uzun dinlenmede Weapon Mastery değişimi sorulmuyor (B93/B94 yalnız sekiz sınıfı bağladı; Fighter/Barbarian/Monk da dışarıda).
2. **[YENİ, hata] Uncanny Dodge görmediği saldırgana da kullanılıyor** (A19): görünmez saldırgan ve Blinded Rogue'da tepki harcandı, hasar 11 → 5 (P2c). `reactions.ts:151` `sees` yalnız karanlık ve gizlenmeye bakıyor; Invisible/Blinded'ı bilen `sight.ts:106` `canSeeTarget` kullanılmıyor (aynı yardımcı diğer "görülen" tepkileri de etkileyebilir).
3. **[YENİ, hata] Second-Story Work'ün Jumper'ı hiç çalışmıyor** (A34): motor `second-story-work` işaretine bakıyor (`movement.ts:674`), fikstür yalnız `trait: "climber"` veriyor (`srd-alt-siniflar.json:1110`); gerçek 3. seviye Thief'in işaretleri `steady-aim, fast-hands, climber` (P1), STR 8 / DEX 17 ile koşarak atlama 8 ft. Mevcut test (`k19feat3.test.ts:34`) işareti elle verdiği için geçiyor.
4. **[YENİ, hata] Steady Aim (Hız 0) + Withdraw ile 15 ft kayma** (A9): Steady Aim'den sonra Withdraw bütçesi 3 altıgen açıldı ve `shift_move` 3 altıgen gitti (P4). SRD: yarı Hız = 0. Aynı yol Fighter Tactical Shift'te de var (`shift.ts:18-21` hızı `speedHexes`'ten alıyor, Hız 0 etkisini bilmiyor).
5. **[YENİ] Cunning Strike yalnız `attack` komutunda** (A14): yan el saldırısı (`offhand.ts:20`), fırsat saldırısı (`features.ts:517`) ve Ready (`ready.ts:251`) Sneak Attack verir ama Cunning Strike seçilemez. Yapay zekâ Devious Strikes ve Poison'u hiç seçmiyor, Cunning Action Dash'i hiç kullanmıyor (D5, D7; P3).
6. İyi haber: Sneak Attack tablosu 20/20, Expertise 2/4, Weapon Mastery 2, ASI/Epic Boon yuvaları, Slippery Mind; Sneak Attack koşulları (avantaj, dost, Incapacitated dost, dezavantaj, başkasının turunda fırsat saldırısı); Trip/Poison/Withdraw/Daze/Knock Out/Obscure, DC'ler, Improved iki etki; Elusive; Stroke of Luck; Thief's Reflexes ve Fast Hands Utilize probe ya da mevcut testle doğru.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Sneak Attack zarı 1d6 … 10d6 (s. 61 tablosu) | `stat: sneakAttackDice` tablo sütunundan; 1–20: 1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10 | tam | P1; `class-features.json:1247-1252` | 6990 |
| A2 | Turda bir; başkasının turunda (fırsat saldırısı) yeniden | `sneakTurn` = `turnKey` (tur başına); fırsat saldırısında Sneak Attack var | tam | `features.ts:128`; `features.test.ts:307-316` | 6064 |
| A3 | Avantajla; dezavantajda yandaş yetmez | `canSneak` avantaj ya da (dezavantaj yok + dost) | tam | `features.ts:126-132`; `features.test.ts:59-91` | Görev F |
| A4 | Hedefin 5 ft içinde Incapacitated olmayan dost | `allyNextTo`: `able` (HP > 0, Incapacitated değil), 63+ 3B bitişiklik; Stunned dostla yok | tam | `features.ts:115-122`; `features.test.ts:72-81` | 2233 |
| A5 | **Finesse ya da Ranged silah**; atılan Melee silah (Javelin) Ranged silah değildir | `weapon.ranged` fırlatma seçeneğinde de true: atılan Javelin (Finesse değil) avantajla Sneak Attack aldı; yakın Javelin almadı. Büyü ve Unarmed Strike doğru dışarıda | kısmi **[YENİ, hata]** | P2a; `features.ts:127` | — |
| A6 | Ek hasar türü silahınki; kritikte zarlar iki kat | `add('Sneak Attack', …, w.damageType)`, `rollDice(…, critical)` | tam | `features.ts:145-156` | — |
| A7 | Cunning Action (2): Dash/Disengage/Hide bonus eylemle | `grants` → `bonusActions`; 1. seviyede "bonus eylemle yapılamaz", 2'de olur | tam | P2f; `economy.ts:288-295` | 8575 |
| A8 | Steady Aim: hareket etmediysen; sonraki saldırı avantajlı; Hız 0 | `steady_aim` hareketliyken red, `movementUsed` 999, ilk saldırıda harcanır | tam | `commands.ts:849-853`; `reduce.ts:1144-1148`; `classTraits.test.ts:175-185`; P2f | 6394 |
| A9 | Steady Aim'den sonra Hız 0 → Withdraw'ın "yarı Hız"ı 0 | Withdraw bütçesi `speedHexes/2` = 3; Steady Aim sonrası 3 altıgen kaydı | kısmi **[YENİ, hata]** | P4; `shift.ts:18-21, 39-43` | 4658 |
| A10 | Cunning Strike: DC 8 + DEX + PB; bedel atıştan önce düşer; etki hasardan sonra | DC 16 (14. sv), 15 (11. sv); Sneak zarı bedel kadar az atılır; zar yetmezse komut reddi | tam | P2e; `classTraits.ts:112-157`; `commands.ts:901` | 6393 |
| A11 | Trip: Large ya da küçük, DEX, Prone | Large+ değilse DEX save, Prone; Huge hedefte save yok, zar yine düşer (SRD: zar seçimde düşer) | tam | P2e; `classTraits.test.ts:196-204` | 6393 |
| A12 | Withdraw: saldırıdan **hemen sonra** yarı Hız, fırsat saldırısız | Tur sonuna dek `shiftLeft` bütçesi (`shift_move`); başka eylemden sonra da kullanılabildi | bilinçli sapma **[bilinen]** | P4; `shift.ts:1-21` | 4658 |
| A13 | Poison: Poisoner's Kit, CON, 1 dk Poisoned, tur sonu save | Kit eşyası → `poisoners-kit`; 10 tur `saveEnds` CON | tam | P2e; `create.ts:459`; `classTraits.ts:107, 151` | 4660 |
| A14 | Cunning Strike "Sneak Attack verdiğinde" (her saldırı) | Yalnız `attack` komutunda `cunning`; yan el, fırsat saldırısı, Ready, Horde yolu seçenek taşımıyor | kısmi **[YENİ]** | `commands.ts:906`; `offhand.ts:20`; `features.ts:517`; `ready.ts:251` | — |
| A15 | Improved Cunning Strike (11): iki etki | `max` 2; Trip + Poison birlikte işledi; üç seçim reddi | tam | P2e; `classTraits.test.ts:186-194` | 6393 |
| A16 | Daze: CON; sonraki turunda yalnız biri | Dazed, hedefin sonraki tur sonunda biter; ekonomi ve hareket kapısı | tam | P2e; `economy.ts:129-131`; `movement.ts:201-202` | 6393 |
| A17 | Knock Out: CON; 1 dk ya da hasara dek Unconscious; tur sonu save | 10 tur, `saveEnds` CON, `wakeOnDamage`; dost isabetinde uyandı | tam | P2e | 4659 |
| A18 | Obscure: DEX; sonraki turunun sonuna dek Blinded | `owner: target, end: turnEnd` | tam | P2e | 6393 |
| A19 | Uncanny Dodge: **gördüğün** saldırgan | `sees` = `!hiddenTo && canSee` (karanlık/gizlenme); Invisible saldırgan ve Blinded Rogue'da tepki kullanıldı | kısmi **[YENİ, hata]** | P2c; `reactions.ts:151, 198`; `sight.ts:106` | 6524 |
| A20 | Saldırı zarı: silah, canavar, büyü saldırısı; yarı (aşağı), ek zarlar dahil | Üç yoldan `hitReactions`; hasar ek zarlarla; `halfDamage` | tam | `features.ts:349-353`; `monsters.ts:214`; `spells.ts:1033`; `reactions.test.ts:132-136` | 6531 |
| A21 | Evasion; Incapacitated iken yok | `saveDamage` tek yol; Stunned iken yarı | tam | `classTraits.ts:79-90`; `classTraits.test.ts:219-226` | 6395 |
| A22 | Reliable Talent: beceri ya da alet yetkinliği | Yetkin beceride 9↓ → 10; alet yetkinliği modeli yok (B2) | tam (beceri) | `effectDice.ts:143-146`; `classTraits.test.ts:227-232` | 6395 |
| A23 | Slippery Mind (15) | 15'te WIS/CHA save + PB (P1: 14'te 1/1, 15'te 6/6) | tam | P1; `class-features.json:1517-1525` | 6391 |
| A24 | Elusive: Incapacitated değilken avantaj yok | 18'de görünmez saldırgan ve Prone Rogue'a karşı normal, Stunned'da avantaj sürüyor; 17'de avantaj | tam | P2b; `features.ts:258`; `monsters.ts:158`; `spells.ts:999` | 6395 |
| A25 | Elusive "hiçbir saldırı zarı" | Karadul Tatlı Tuzak avantajı `elusiveFilter`'dan **sonra** ekleniyor (ev kuralı) | kısmi **[YENİ]** (kod okuması) | `features.ts:258-265` | — |
| A26 | Stroke of Luck: başarısız D20 Testi 20; kısa/uzun dinlenme | Saldırı, save, kontrolde ikinci şans `twenty`; kaynak 1, düştü | tam | P2d; `effectDice.ts:85-86`; `classTraits.test.ts:239-244` | 6392 |
| A27 | "can turn" (oyuncu seçer) | İlk başarısız d20 testinde kendiliğinden (oyuncuya sorulmaz) | bilinçli sapma **[bilinen]** | `rules/attack.ts:66-111` | 6392 |
| A28 | Saldırıda 20: isabet; "natural 20" Critical Hit (s. 6) | Stroke of Luck'la 20 olan saldırı **kritik** sayıldı | tam (yorum ⚠) | P2d; `rules/attack.ts:191-197` | — |
| A29 | Ölüm save'i de saving throw → D20 Test | Ölüm save'i `secondChances`'tan geçmiyor; Stroke of Luck uygulanmaz | kısmi **[YENİ]** | `commands.ts:133-150` | — |
| A30 | Weapon Mastery: iki tür | `count: 2`, `swap: all` her seviyede; etkiler otomatik | tam | P1; `class-features.json:1364-1371` | 6823 |
| A31 | Thieves' Cant + bir dil | `status: none`, hikâye; dil sistemi yok | bilinçli sapma **[bilinen]** | `class-features.json:1253-1257` | 4654 |
| A32 | Fast Hands (fikstür): bonus eylemle Sleight of Hand, Utilize ya da büyülü eşya Magic eylemi | 3'te Utilize bonus eylem (2'de eylem); Sleight of Hand ve Magic eylemi yok (fikstür `effect` notu "savaş dışı" diyor, EN açıklaması Magic'i sayıyor). Bonus boşsa her zaman bonus harcanır | kısmi **[bilinen]** | P5; `economy.ts:302-304`; fikstür 1077-1094 | 4640 |
| A33 | Second-Story Work, Climber (fikstür) | `climber` → `climbs()` tırmanma maliyeti yok | tam | P1; `flight.ts:78` | 6398 |
| A34 | Second-Story Work, Jumper (fikstür notu "DEX skoruyla") | Motor `second-story-work` işaretini arıyor, gerçek Thief'te yok: DEX 17 / STR 8 → 8 ft | yok **[YENİ, hata]** | P1; `movement.ts:669-676`; fikstür 1110; `k19feat3.test.ts:34` (elle işaret) | 4639 |
| A35 | Supreme Sneak (fikstür notu: Stealth Attack, ¾/tam siperde saldırı anında) | Seçenek `stealth` 1d6; gizli kalır | tam (fikstür notuna göre; SRD tur sonu ⚠) → **kapandı: SRD tur sonu (104, DECISIONS KARAR104-KALAN A6)** | `classTraits.ts:102`; `k18h3.test.ts:215` | 4745 |
| A36 | Use Magic Device (fikstür notu: şarjda 1d6 = 6 harcanmaz; ayarlanma, parşömen savaş dışı) | `use-magic-device` + `feature_used item:` → 1d6 | doğrulanmadı | `spells.ts:449-454` (kod; test yok) | 4524 |
| A37 | Thief's Reflexes: ilk turda iki tur (inisiyatif − 10) | `nextActor` yansıma turu, sıra kaldığı yerden | tam | `common.ts:36-50`; `k19tier4b.test.ts:98-115` | 4603 |
| A38 | Alt sınıf özellikleri 3/9/13/17 | İşaretler seviyede geliyor (3: fast-hands, climber; 9: supreme-sneak; 13: use-magic-device; 17: thiefs-reflexes) | tam | P1 | AS2 |

## B) Oluşturucu ve seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | d8, DEX/INT save, 4 beceri / 10, Simple + Finesse/Light Martial, Light zırh | Veri birebir; HP 1. sv 8 + CON, sonra 5 + CON | tam | `data/classes.json:310-350`; P1 | 490 |
| B2 | Thieves' Tools yetkinliği | Alet yetkinliği modeli yok (sınıf verisinde alan yok, geçmişte yalnız metin); Thieves' Tools Expertise'i ve Reliable Talent'ın alet kısmı seçilemez | yok **[YENİ]** (savaş etkisi yok) | `data/classes.json`; `backgrounds.ts:29` | — |
| B3 | Ekipman A/B | Paket yok; öneri Studded Leather, Rapier, Shortbow (genel, sınıfa özgü değil) | kısmi **[bilinen, genel]** | `data/onerilen-baslangic.json:66-73` | SD3 |
| B4 | Expertise 1: iki; 6: iki daha | `kit.expertise` 2 (1–5), 4 (6+) | tam | P1 | 7015 |
| B5 | Weapon Mastery 2 tür seçimi | Oluşturucu `weaponMastery.count` 2 | tam | P1; `builder.ts:281-289` | 6823 |
| B6 | ASI 4/8/10/12/16, Epic Boon 19 | `advancementSlots('rogue', 20)` aynen | tam | P1 | 7007 |
| B7 | Alt sınıf 3. seviye | Oluşturucu 3+ ister; eski kayda varsayılan `thief` | tam | `data/alt-sinif-gorunum.json` `varsayilan.rogue` | AS2 |
| B8 | Poison için Poisoner's Kit | `data/items.json` eşyası, oluşturucuda seçilir | tam | P2e (`poisoners-kit` işareti) | 4660 |

## C) Dinlenme, Serüven ve kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Stroke of Luck kısa ya da uzun dinlenmede | `recharge: short all, long all` | tam | `class-features.json:297-306` | 6392 |
| C2 | Seviye atlamada Expertise (6), ASI/feat, Epic Boon, alt sınıf (3) seçimi | `rogue` `secim-degisim.json`'da yok → `choicesBound` false: Serüven'de seçim düğmesi yok, `set_choices` "henüz bağlı değil"; yalnız seviye artar (alt sınıf varsayılan) | yok **[YENİ]** | P1; `seruven.ts:802`; `SeruvenScreen.tsx:436`; `levelChoices.test.ts:27` | B93 A2, B94 A1 |
| C3 | Uzun dinlenmede Weapon Mastery türlerini değiştir | `fitChanges('rogue', {weaponMasteries: 1}, dinlenme)` → `ok: false` | yok **[YENİ]** | P1 | 6826 |
| C4 | Savaş sonrası Stroke of Luck kalanı karakterde | Genel kaynak taşıma (K10); Rogue için uçtan uca denenmedi | doğrulanmadı | — | K10 |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Sneak Attack için hedef ve yer | Sneak tutan hedef öne; tutmuyorsa tutacağı güvenli yere yürür | tam | `ai.ts:1008-1018, 2224-2238`; `features.test.ts` | 8295 |
| D2 | Steady Aim | Bitişik düşman yokken, saldırı avantajsızsa: `steady_aim`, `attack` | tam | P3; `ai.ts:1590-1600` | 6397 |
| D3 | Düşman tarafındaki Rogue karakteri | `actor.side !== 'party'` → Steady Aim yok (P3: Shortbow'lu düşman Rogue yürüyüp itti) | kısmi | P3; `ai.ts:1591` | — |
| D4 | Cunning Action Disengage | Yürüyüş fırsat saldırısı yedirecekse bonus Disengage; kayma bütçesi varsa `shift_move` | tam | `ai.ts:1710-1720` | 6397 |
| D5 | Cunning Action Dash | YZ hiç `dash` üretmiyor: uzak düşmanda yürüdü, bonus eylem boş kaldı | yok **[YENİ]** | P3 | — |
| D6 | Cunning Action Hide (savaşta) | Yalnız sızma hedefinde gizlenir; savaşta avantaj için gizlenmez | yok **[bilinen]** | `ai.ts:2553`; CLAUDE.md Bilinen eksikler | 5448 |
| D7 | Cunning Strike seçimi | Yalnız Trip (dost bitişikse) ya da Withdraw (yakın dövüş, HP yarı altı, ama yalnız Sneak tutarsa); 14. seviyede de Trip; Daze/Knock Out/Obscure/Poison asla | kısmi **[YENİ]** | P3; `ai.ts:1602-1617` | 6397 |
| D8 | Uncanny Dodge kararı | Öneri yalnız ağır isabette (≥ max(5, HP/3) ya da öldürücü); 38 HP'de 11 hasar → kullanılmadı | bilinçli sapma **[bilinen]** | P2g; `reactions.ts:206-209` | 6537 |
| D9 | Stroke of Luck | Kendiliğinden (A27); oyuncu ve YZ aynı | tam | `effectDice.ts:85` | 6392 |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Sınıf özelliği açıklamaları | 15 `rogue:*` özelliğinin TR ve EN açıklaması var (`aciklamalar-tr.json`'a gerek yok) | tam | `data/aciklamalar.json` `features.tr/en` | SD4 (1474) |
| E2 | Özellik adları (SD4: İngilizce kalır) | TR menüde "Nişan Al", "Kurnaz Vuruş", "Çelme (Trip)", "Sıyrıl (Withdraw)"…; EN İngilizce. Ranger E1 ile aynı SD2/SD4 çelişkisi | kısmi **[bilinen: RANGER E1]** | `strings.tr2.ts:492-493` | SD4 (1474) |
| E3 | Stealth Attack (Supreme Sneak) adı | `cunningName`'de `stealth` yok (TR/EN): balonda ham "stealth (−1d6)" | kısmi **[YENİ]** | `MapBattle.tsx:2819-2822`; `strings.en.ts:1278`; `strings.tr2.ts:493` | — |
| E4 | Fast Hands TR açıklaması | Fikstür TR "Cunning Action ile …", SRD/EN "As a Bonus Action" (Cunning Action değil); gerçek paket görülemedi | kısmi **[YENİ]** | fikstür 1084 | AS2 |
| E5 | İkonlar | Stroke of Luck `kader-d20`; Steady Aim bonus grubunda; kayma Hareket menüsünde | tam | `data/kaynak-ikon.json:21`; `actionMenu.ts:37, 69` | E4c |
| E6 | Günlük | Steady Aim, Cunning Strike seçenek ve zar sayısı, kayma TR/EN | tam | `ui/log.ts:98, 381`; `strings.en.ts:1038` | Görev F |
| E7 | Belgeler ve yorumlar | CLAUDE.md "Bilinen eksikler" Rogue/Thief satırı eski (yukarıdaki not); `classTraits.ts:127` "Daze yaklaşık: bonus eylem ve tepki yok" yorumu kodla çelişiyor (kod SRD'deki "biri" kuralını uyguluyor) | kısmi **[YENİ]** | CLAUDE.md:223; `classTraits.ts:124-129` | 6398 |
| E8 | Hamle önizlemesi Sneak Attack/Cunning Strike'ı doğru gösteriyor mu | Arayüzde çalıştırılmadı | doğrulanmadı | — | K58 |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: savaş davranışı değişiyorsa **güncel sürümün bir fazlası, tek sabit** (bugün 94 → 95; aynı turda başka denetim düzeltmeleri de varsa onlarla tek sabit); yoksa sürümsüz. SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Rogue'u seçim değişimine bağla** (C2, C3): `data/secim-degisim.json` `"rogue": { "weaponMasteries": { "dinlenme": "hepsi" } }`. Expertise, ASI/Epic Boon, alt sınıf yazılmaz ("yalnız eklenir": SRD bunları değiştirmez). `levelChoices.test.ts` beklentisi | Yüksek (Serüven'de 6+ Rogue Expertise/ASI'siz kalıyor) | Sürümsüz (Serüven/oluşturucu) | 0,5–1 saat |
| 2 | **Uncanny Dodge görme koşulu** (A19): `reactions.ts` `sees`'e `canSeeTarget` (Invisible, Blinded, Blindsight/See Invisibility) ekle; aynı yardımcıyı kullanan diğer "gördüğün" tepkileri (Hellish Rebuke vb.) birlikte gözden geçir | Orta | Güncel sürümün bir fazlası, tek sabit | 1–2 saat + hızlı regresyon |
| 3 | **Jumper** (A34): fikstürde ve gerçek `icerik/ek-rogue.json` Thief kaydında `traits: ["climber", "second-story-work"]` (ya da motor `climber`'a da baksın); gerçek Thief'le test (mevcut test işareti elle veriyor) | Orta-düşük | Sürümsüz (veri; işaretler savaş başında savaşçıya yazılır, eski kayıt etkilenmez) | 0,5 saat |
| 4 | **Hız 0 iken kayma yok** (A9): `shiftGrant`/`executeShiftMove` Steady Aim (ve Grappled/Restrained gibi Hız 0) sonrası 0; Fighter Tactical Shift de aynı yoldan düzelir | Orta (yaygın kombinasyon) | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 5 | **Atılan Melee silah Sneak Attack'sız** (A5): fırlatma seçeneğine "Melee silah" bayrağı, `canSneak` `finesse || (ranged && !thrownMelee)` | Düşük (Javelin/Handaxe/Spear/Light Hammer) | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 6 | **Cunning Strike yan el saldırısında** (A14): `offhand_attack` komutuna isteğe bağlı `cunning`, arayüzde aynı seçim kutuları. Fırsat saldırısı/Ready için Karar K3 | Orta (iki silahlı Rogue'un ana Sneak yolu) | Sürümsüz (yeni isteğe bağlı komut alanı; eski replay aynı) | 2 saat |
| 7 | **YZ** (D5, D7, D3): uzak hedefe bonus Dash; Sneak ≥ 7d6 ve tehlikeli hedefte Knock Out, çok saldırılı hedefte Daze, menzillide Obscure; Poisoner's Kit varsa Poison; düşman tarafındaki Rogue karakterine Steady Aim. **Sim imzası değişir** | Orta | Güncel sürümün bir fazlası, tek sabit (YZ kararı) + 3–4 senaryolu hızlı regresyon | 3–4 saat |
| 8 | **Stroke of Luck ölüm save'inde** (A29): `startOfTurnEvents` ölüm save'ine ikinci şans (Stroke of Luck; aynı yoldan diğerleri ayrı karar) | Düşük (20. seviye) | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 9 | **Elusive sırası** (A25): Tatlı Tuzak avantajını `elusiveFilter`'dan önce ekle | Düşük (ev kuralı kesişimi) | Güncel sürümün bir fazlası, tek sabit | 0,5 saat |
| 10 | **Metin**: `cunningName.stealth` TR/EN ("Stealth Attack"); Fast Hands TR açıklaması "Bonus eylemle …" (fikstür + paket); `classTraits.ts:127` yorumu; CLAUDE.md Bilinen eksikler Rogue/Thief satırı; SD2/SD4 menü adı kararı (Ranger E1 ile ortak) | Düşük | Sürümsüz | 1 saat |
| 11 | **Testler** (probe'lardan kalıcıya): Sneak tablosu 20/20, Knock Out uyanma, Daze/Obscure süreleri, Trip Huge, Improved Trip + Poison, Elusive (görünmez/Prone/Stunned), Stroke of Luck kritik, gerçek Thief Jumper, Uncanny Dodge görünmez saldırgan, Steady Aim + Withdraw | Regresyon güvencesi | — | 2 saat |

### Karar gerekli (temel akışı değiştirir)

| # | Konu | Neden karar | Tahmini iş |
|---|---|---|---|
| K1 | **Stroke of Luck oyuncuya sorulsun mu** (A27, D9; DECISIONS 6392 "hepsi kendiliğinden"): SRD "can"; bugün ilk başarısız d20 testinde (önemsiz bir kontrol de olsa) harcanıyor | İkinci şans zincirinin tamamı (Indomitable, Luck, Tactical Mind…) tepki gibi soru akışına girer; zar defteri, YZ önerisi | Orta-büyük (ortak) |
| K2 | **Alet yetkinliği modeli** (B2): Thieves' Tools (Rogue, Criminal), Reliable Talent'ın alet kısmı, Thieves' Tools Expertise, Fast Hands kilit/tuzak | Bütün sınıf ve geçmişlere yeni veri alanı ve oluşturucu adımı; savaşta karşılığı az | Orta |
| K3 | **Withdraw "hemen" ve fırsat saldırısında Cunning Strike** (A12, A14): kayma saldırının hemen ardından (araya başka eylem girmeden) mı; fırsat saldırısı/Ready'de Cunning Strike oyuncuya sorulsun mu | Tepki anında yeni bir seçim istemi (zar defteri, `NeedReaction` benzeri) ve kayma bütçesinin ömrü; Fighter Tactical Shift'i de etkiler | Orta |
| K4 | **Stroke of Luck saldırıda kritik mi** (A28): SRD s. 6 "natural 20" der; "roll into a 20" yorumu | Kural yorumu (bugün kritik); değişirse yalnız kritik bayrağı | Küçük |

## Probe dökümü (geçici, silindi)

- **P1** (`zzTmpRogue1`): `classKit('rogue', 1–20, thief)`: Sneak Attack, Expertise (2 → 4), Weapon Mastery 2, bonus eylemler (2'den), işaretler seviyeye göre, `strokeOfLuck` 1 (20), save'ler (15'te WIS/CHA), HP; silah seçenekleri (`Javelin (fırlatma)` `ranged: true, finesse: false`); `jumpRangeFeet` gerçek Thief (STR 8, DEX 17) koşarak 8; `choicesBound('rogue')` false, `fitChanges` Weapon Mastery değişimi red; `advancementSlots` 4/8/10/12/16 + 19.
- **P2** (`zzTmpRogue2`): atılan/yakın Javelin Sneak; Elusive 17/18 (görünmez saldırgan, Prone, Stunned); Uncanny Dodge normal/görünmez/Blinded; Stroke of Luck kritik ve kaynak; Knock Out (DC 16, uyanma), Daze (süre; Dash + saldırı), Obscure, Trip Huge, Trip + Poison (11, kit), üç seçim reddi, Withdraw 3 altıgen; Cunning Action 1/2; Steady Aim `movementUsed` 999; Uncanny Dodge öneri eşiği.
- **P3** (`zzTmpRogue3`): YZ komut dizileri: uzak yakın dövüşçü (yürü, bitir), dost bitişik 5/14 (Trip), menzilli tek (Steady Aim, saldırı), yaralı ve iki düşmana bitişik (saldırı, bitir), düşman tarafı Rogue (yürü, it).
- **P4** (`zzTmpRogue4`): Steady Aim + Withdraw kayması (3 altıgen), Withdraw sonrası bonus Dash ve yine kayma.
- **P5** (`zzTmpRogue5`): `economyCost` `object_use`: 2. seviye eylem, 3. seviye Thief bonus eylem (Fast Hands).
- Probe ile **doğru** bulunanlar (regresyon notu): Sneak Attack tablosu ve koşulları, Expertise/Weapon Mastery/ASI/Epic Boon sayıları, Slippery Mind, Cunning Action, Steady Aim'in hız 0'ı, Cunning Strike DC'leri ve bedelleri, Trip (Huge'da etkisiz), Poison (kitle), Improved iki etki, Daze/Obscure süreleri, Knock Out'un hasarla bitmesi, Elusive'in üç durumu, Stroke of Luck kaynağı, Fast Hands Utilize, alt sınıf işaretlerinin seviyeleri.

## Görev B95 (2026-11-20)

**A) Sürümsüz (yapıldı).** `data/secim-degisim.json`'a `rogue` kaydı eklendi; Serüven'de "Seçimler" düğmesi çıkar ve B93'ün ortak yardımcısıyla (`src/rules/levelChoices.ts`, `set_choices`) seçim yapılır. Yeni seçimler (alt sınıf 3. seviyede, ASI/feat ve Epic Boon yuvaları, yeni Weapon Mastery hakkı; 6. seviye Expertise, SRD 5.2.1 s. 61; uzun dinlenmede bütün ustalıklar değişir, s. 62 "change the kinds of weapons you chose") yalnız eklenir; eksik seçim varken düğme "Seçimler (seçim bekliyor)" olur (`pendingChoices`). Serüven'de alt sınıf **otomatik atanmaz**: seçim kipinde (Builder `choices`) boş alt sınıf açılışta da olsa eksik sayılır, Kaydet onu ister. Seçim kipine Weapon Mastery seçicisi eklendi (donanım adımı bu kipte yok). Test: `src/rules/levelChoices.test.ts` "Görev B95 (A)", `src/screens/b95Secim.test.tsx`.

**B) Sürümlü (yapıldı, kural sürümü 97 `SINIF97_VERSION`; 96 ve altı eski davranış).**
- Uncanny Dodge (A19; SRD 5.2.1 s. 63 "an attacker that you can see"): görünmez saldırganda ve Blinded Rogue'da kullanılmaz, tepki harcanmaz (`canSeeTarget`).
- Second-Story Work Jumper (A34; bizim Thief metni): gerçek Thief'e özellik kimliğinden `jumper-dex` işareti (`data/ozellik-isaret.json`; paket verisi değişmedi), 97+'da atlama DEX skoruyla. Eski elle işaretli test (`k19feat3.test.ts`) gerçek işarete çevrildi; uçtan uca `b95rogue.test.ts`.
- Steady Aim (s. 62 "your Speed is 0 until the end of the current turn"): sonrasında Withdraw ve Tactical Shift kayması 0 (`economy.speedZero`).
- Sneak Attack (s. 61–62 "a Finesse or a Ranged weapon"): fırlatılan Javelin (ve Finesse olmayan diğer yakın dövüş silahları) Sneak Attack almaz.
- Cunning Strike (A14; s. 63): yan el saldırısında (`offhand_attack.cunning`), fırsat saldırısında (tepki sorusunda tek seçenekli "Opportunity Attack + Cunning Strike (…)") ve Ready'de (`ReadyResponse.cunning`, Ready paneli) seçilir. Horde Breaker yolu bu görevde değil.
- Test: `src/battle/b95rogue.test.ts`.

**C) Ertelendi, karar gerekli.** Stroke of Luck (SRD 5.2.1 s. 63) oyuncuya sorulsun mu ve 20'ye çevrilen saldırı kritik sayılsın mı (s. 6 "Rolling 20" yorumu); yapay zekânın Cunning Strike seçeneklerini kullanması (s. 63; YZ davranışı denge değiştirir, denge turuna kalır).

## KARAR104 / KARAR104-KALAN (kural sürümü 104; 2026-11-26 belge güncellemesi)

Kod okunarak doğrulandı (`karar104On` kapısı; 103 ve altı eski davranış). Test çalıştırılmadı.

- **A35 Supreme Sneak** (DECISIONS KARAR104-KALAN A6, sürüm 104): Stealth Attack saldırı anında açığa çıkarmaz (işaret `traitTurns['supreme-sneak']`); Thief turunu bitirirken görüş hattı olan her canlı düşmana göre ¾ ya da tam siperde değilse açığa çıkar (`stealth.ts` `supremeSneakEndEvents`, `commands.ts` tur sonu zinciri). 96–103'teki GENEL96 C12 açığa çıkışı 104'te atlanır. ⚠ "Behind cover" bütün düşmanlara göre (A17 yorumu). Test `src/battle/karar104.test.ts` "Supreme Sneak: 104 saldırıda açığa çıkmaz". E3 (Stealth Attack adı) bu görevde denetlenmedi.
