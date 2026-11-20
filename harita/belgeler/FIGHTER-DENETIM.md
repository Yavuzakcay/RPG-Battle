# Fighter denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Güncel kural sürümü 94 (`data/kural-surumu.json`) üzerinden okundu. Emin olunmayan satırlar geçici vitest probe'larıyla denendi (`src/battle/zzTmpFighter*.test.ts`, iş bitince silindi; depoda yalnız bu belge kaldı). Probe kanıtı "P#" ile anılır (aşağıda "Probe dökümü").

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 47–49 (`pdftotext -layout`; sayfa numarası PDF alt bilgisindeki SRD sayfası), Fighting Style feat'leri s. 87–88, Weapon Mastery özellikleri s. 90; `data/srd/classes.json`, `data/srd/progression.json` (Fighter). Oyun tarafı: `data/class-features.json` (`fighter:*`, kaynaklar `secondWind`, `actionSurge`, `indomitable`, `masteries`, `feats`), `src/battle/features.ts` (Action Surge, Second Wind), `classTraits.ts`, `shift.ts`, `effectDice.ts` + `rules/attack.ts` (`ExtraDie.reroll`), `mastery.ts`, `rules/mastery.ts`, `weapons.ts`, `economy.ts`, `commands.ts`, `ai.ts`.
**Champion** `icerik/` paketinde (gitignore) yaşar; bu checkout'ta yok. Ölçüt bizim sürümümüz: mekanik **fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:556`, `champion`, ad "Gladyatör / Gladiator"); farklar `harita/belgeler/AS2-FARKLAR.md:52-56` (seviyeler SRD ile aynı). Alt sınıf satırları SRD'ye göre "aykırı" sayılmadı; yalnız fikstür metni/effect'i ile motor uyuşmazlığı bulgu yazıldı. Gerçek paket metni görülmedi.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar ya da kayda alınması gereken sapma) · **doğrulanmadı** (bu denetimde çalıştırılamadı, tahmin yazılmadı). **[bilinen]** = DECISIONS.md ya da başka belgede zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye (alt sınıfta fikstüre) aykırı, bilinçsiz.

**CLAUDE.md notu.** "Bilinen eksikler" tablosu Fighter için "yok: Tactical Master, Heroic Warrior; kısmi: Tactical Shift ve Remarkable Athlete (yarım hız yerine Disengage)" diyor. Bu **eski**: Tactical Master ve Heroic Warrior Kuyruk 18 H3'te (kural sürümü 14, DECISIONS 4743), serbest kayma Kuyruk 19'da (sürüm 16, DECISIONS 4658) eklendi; probe'larda çalışıyor (A8, A12, A27, A28). **[YENİ]** belge düzeltmesi.

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d10, STR+CON save, Simple+Martial silah, Light/Medium/Heavy zırh + Shield, 2 beceri (Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Persuasion, Perception, Survival), ekipman A/B/C | 47 |
| S2 | Fighting Style (1): Fighting Style feat'i (Defense önerilir); her Fighter seviyesinde başka bir Fighting Style feat'iyle değiştirilebilir. SRD'de 4 feat: Archery (+2 Ranged silah), Defense (zırhla +1 AC), Great Weapon Fighting (iki elle Melee, Two-Handed/Versatile, 1–2 → 3), Two-Weapon Fighting (Light ek saldırısına değiştirici) | 47, 87–88 |
| S3 | Second Wind (1): Bonus Action, 1d10 + Fighter seviyesi HP; kullanım 2/3/4 (1, 4, 10); kısa dinlenmede 1, uzun dinlenmede hepsi | 47–48 |
| S4 | Weapon Mastery (1): 3/4/5/6 tür (1, 4, 10, 16) Simple ya da Martial; uzun dinlenmede **bir** seçim değişir | 47–48 |
| S5 | Action Surge (2): kendi turunda bir ek eylem, Magic action hariç; kısa/uzun dinlenme; 17'de dinlenme başına 2 kullanım, turda bir | 48 |
| S6 | Tactical Mind (2): başarısız yetenek kontrolünde Second Wind harca, +1d10; yine başarısızsa kullanım harcanmaz | 48 |
| S7 | Alt sınıf (3), ASI (4, 6, 8, 12, 14, 16), Epic Boon (19; Boon of Combat Prowess önerilir) | 48 |
| S8 | Extra Attack (5), Two Extra Attacks (11), Three Extra Attacks (20): Attack eyleminde 2/3/4 saldırı | 48 |
| S9 | Tactical Shift (5): Second Wind'i Bonus Action ile kullanınca yarı hızla fırsat saldırısı almadan hareket | 48 |
| S10 | Indomitable (9): başarısız save'i + Fighter seviyesi ile yeniden at, yeni sonuç geçerli; kullanım 1/2/3 (9, 13, 17), uzun dinlenme | 48 |
| S11 | Tactical Master (9): ustalığını kullanabildiğin silahla saldırırken o saldırı için ustalığı Push, Sap ya da Slow ile değiştir | 48 |
| S12 | Studied Attacks (13): bir yaratığa saldırı zarı ıskalarsa sonraki turunun sonuna dek o yaratığa bir sonraki saldırı avantajlı | 48 |
| S13 | Weapon Mastery özellikleri: Cleave (turda bir, ikinci yaratık, değiştiricisiz), Graze (ıskada değiştirici), Nick, Push (10 ft, Large ve küçük), Sap, Slow (10 ft, üst üste binmez), Topple (CON, DC 8 + değiştirici + PB), Vex | 90 |
| S14 | Champion (bizim sürüm = fikstür): Improved Critical 19–20 (3), Remarkable Athlete (3: inisiyatif ve STR (Athletics) avantajı, kritikten hemen sonra yarı hızla fırsat saldırısısız hareket), Additional Fighting Style (7), Heroic Warrior (10: savaşta tur başında Heroic Inspiration yoksa gelir; başarısız d20 bir kez yeniden), Superior Critical 18–20 (15), Survivor (18: Defy Death, Heroic Rally) | 49; fikstür |

## Özet

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 32 | 24 | 5 | 0 | 2 | 1 |
| B) Oluşturucu / seviye atlama | 9 | 6 | 2 | 0 | 1 | 0 |
| C) Dinlenme, Serüven, kayıt | 8 | 4 | 1 | 2 | 0 | 1 |
| D) Yapay zekâ | 7 | 4 | 0 | 1 | 2 | 0 |
| E) Arayüz ve TR/EN | 8 | 2 | 4 | 1 | 0 | 1 |
| **Toplam** | **64** | **40** | **12** | **4** | **5** | **3** |

(Sayım tablo satırlarının durum sütunundan. **[YENİ]** işaretli satır: 15 (+ CLAUDE.md notu). **[hata]**: 2 (A11, A28).)

## En önemli bulgular

1. **[YENİ] Fighter Serüven seçim değişimine hiç bağlı değil** (C4–C6). `data/secim-degisim.json`'da `fighter` anahtarı yok (B93/B94 sekiz sınıfı bağladı); `choicesBound('fighter')` false (P1), `set_choices` "Bu sınıfın seçim değişimi henüz bağlı değil" der, parti şeridinde "Seçimler" düğmesi çıkmaz. Fighter'ın 7 ASI/feat yuvası (en çok yuvalı sınıf), Epic Boon, 4/10/16'daki yeni Weapon Mastery hakları, uzun dinlenmede ustalık değişimi ve Fighting Style değişimi Serüven'de yapılamaz; 3. seviyeye Serüven'de çıkan Fighter'a alt sınıf da atanmaz (Champion özellikleri gelmez).
2. **[YENİ] Tactical Master motorda var, arayüzde ve yapay zekâda yok** (A12, D5, E4). `attack` komutunun `mastery` alanını (push/sap/slow) üreten tek bir yer yok: oyuncu ve YZ bu özelliği hiç kullanamıyor; probe'da komutla verildiğinde 9. seviyede çalışıyor, 8'de yok sayılıyor.
3. **[YENİ, hata] Heroic Warrior inisiyatifte ilk sıradaki Champion'a ilk turunda gelmiyor** (A28). Yenileme yalnız `turn_ended` olayında (`reduce.ts:635`); savaş başlangıcı bu yoldan geçmediği için 1. turun ilk savaşçısı Heroic Inspiration'sız başlıyor (P2: 1. tur `null`, 2. tur 1). Fikstür "her tur başında yoksa gelir" diyor.
4. **[YENİ] İkinci şansların seçimi:** Indomitable, ücretsiz yenilenen Heroic Inspiration'dan önce harcanıyor ve başarı imkânsızken de (DC 40) harcanıyor (A10, A29); **Indomitable ölüm save'inde hiç yok** (A11, [hata]).
5. **[YENİ] Arayüz:** Second Wind tam canlıyken menüde kapalı (`hpFull`), böylece Tactical Shift ile kaçış yapılamıyor (motor izin veriyor, P2); Action Surge ipucu "dinlenmeye kadar bir kez" (17'de iki) (E2, E3).
6. İyi haber: sayısal tablolar 20/20 SRD ile aynı (Second Wind 2/3/4, Weapon Mastery 3/4/5/6, Action Surge 1→2, Indomitable 1/2/3, saldırı 1/2/3/4, kritik 20/19/18, ASI/Epic Boon yuvaları, HP); 8 ustalığın hepsi, Action Surge (turda bir, Magic action yasak), Tactical Shift, Tactical Mind, Studied Attacks, Survivor probe ya da mevcut testle doğru.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Second Wind: Bonus Action, 1d10 + Fighter seviyesi HP (s. 48) | `second_wind` bonus eylem harcar; 1d10=7 ile L1 → 8, L5 → 12, L20 → 27; aynı tur ikinci kez "Bonus eylem bu tur kullanıldı" | tam | `features.ts:658-670`, `economy.ts:306`; P2 | 6388 (Görev F) |
| A2 | Second Wind kullanımı 2/3/4 (1, 4, 10) | Kaynak `uses.column: "Second Wind"`: 1–3 → 2, 4–9 → 3, 10–20 → 4 | tam | `class-features.json:18-28`; P1 | Görev N |
| A3 | Tactical Mind: başarısız kontrolde Second Wind ile +1d10; tutmazsa harcanmaz | `ExtraDie` `reroll: 'onFail'`, kaynak yalnız başarıya çevirince düşer (P2: DC 30'da +3, kaynak yok); kendiliğinden | tam | `effectDice.ts:100-102`, `attack.ts:100-107`; `classTraits.test.ts:155-162`; P2 | 6390 |
| A4 | Action Surge: kendi turunda bir ek eylem; kısa/uzun dinlenme; turda bir | Eylemden sonra ek eylem (`economy.action: false`, `surged`); L2/5/11'de ikinci kullanım "kalmadı". Eylem kullanılmadan önce "Önce eylemini kullanmalısın" (sıra kısıtı; iki eylem yine kullanılır, sonuç eşdeğer); Dash'ten sonra Dodge çalıştı | tam | `features.ts:645-656`, `reduce.ts:1166`; P2 | Görev N |
| A5 | 17'de dinlenme başına 2 kullanım, turda bir | `byLevel` 2: 1, 17: 2; L17/L20 aynı turda ikinci: "Action Surge bu tur kullanıldı", kalan 1 | tam | `class-features.json:4-17`; P2 | — |
| A6 | Ek eylem Magic action olamaz | `surged` iken eylemlik büyü reddi | tam | `economy.ts:409` | — |
| A7 | Extra Attack 2/3/4 (5, 11, 20) | `attacksPerAction` 1–4: 1, 5–10: 2, 11–19: 3, 20: 4; Action Surge ile ikinci Attack eylemi aynı sayıda (L20: 4 + 4) | tam | `class-features.json:1049-1066`; P1, P2 | Görev N |
| A8 | Tactical Shift: Second Wind ile yarı hızla fırsat saldırısız hareket | `shift_granted` yarı hız (30 ft → 3 altıgen), `shift_move` fırsat saldırısı yok, hareket hakkından düşmez (`movementUsed` 0), 4 altıgen reddi; bütçe tur sonuna dek (yaklaşım); anahtar `featuresK19` kapalıyken Disengage | tam | `shift.ts:18-46`, `features.ts:667`; `classTraits.test.ts:163-168`; P3 | 4658 |
| A9 | Indomitable: başarısız save + Fighter seviyesi, kullanım 1/2/3 | `reroll: 'd20'`, `rerollBonus` = seviye (9/13/17); kullanım 9: 1, 13: 2, 17: 3; otomatik başarısızlıkta (Paralyzed STR/DEX) harcanmaz | tam | `effectDice.ts:88-90`, `attack.ts:258`; `classTraits.test.ts:147-154`; P1, P2 | 6390 |
| A10 | Indomitable ve Tactical Mind isteğe bağlı ("can") | Kendiliğinden kullanılır (oyuncuya sorulmaz). Başarı imkânsızken de harcanır (P2: DC 40, bonus 0 → kullanım düştü) **[YENİ]** | bilinçli sapma | P2; `attack.ts:87-111` | 6390 ("Hepsi kendiliğinden") |
| A11 | Indomitable "bir save'i başarısız olursan": Death Saving Throw da save | Ölüm save'i `rollD20` ile ayrı atılır, `saveDice`/ikinci şans yolu yok: Indomitable (ve Heroic Inspiration) ölüm save'inde kullanılamaz | kısmi **[YENİ, hata]** | `commands.ts:130-157` (kod okuması) | — |
| A12 | Tactical Master (9): ustalıklı silahta saldırı başına Push/Sap/Slow | Motor: komutta `mastery` yalnız `tactical-master` + silahın ustalığı seçiliyken; L9 Greataxe → Sap uygulandı, L8 yok sayıldı, Topple yok sayıldı, ustalığı seçilmemiş silahta yok. **Arayüz ve YZ bu alanı hiç üretmiyor** (E4, D5); anahtar `tacticalMaster` | kısmi **[YENİ]** | `commands.ts:108, 904-905`; P3; grep (`MapBattle.tsx`, `ai.ts` boş) | 4743 |
| A13 | Studied Attacks: ıska → o yaratığa sonraki saldırı avantajlı, sonraki turunun sonuna dek | `studied` işareti (kendi turunda 2, değilse 1 tur sonu), kullanılınca kalkar | tam | `classTraits.ts:59-71`, `mastery.ts:57-61`; `classTraits.test.ts:139-146` | 6390 |
| A14 | Weapon Mastery savaşta yalnız seçilen silahlar | `activeMasteries` (hak kadar, geçerli seçim); seçeneğe `mastery`, `weaponDamage`, `masteryDc` | tam | `rules/mastery.ts:232-237`, `weapons.ts:35-37, 68-71`; P3 | P0 (6810) |
| A15 | Cleave: isabette erişimdeki, ilkine 5 ft yakın ikinci yaratığa saldırı; değiştiricisiz hasar; turda bir | Probe: Greataxe 1d12=6 → ikinci hedefe 6 (değiştirici yok), aynı tur ikinci isabette yok; erişim dışı aday seçilmez. İkinci hedef **otomatik** (en az HP), atlanamaz | bilinçli sapma | `mastery.ts:73-90, 125-134`; `mastery.test.ts:198`; P3 | 6838 (P0) |
| A16 | Graze: ıskada saldırı değiştiricisi kadar aynı türde hasar | Iskada 3 slashing (STR +3), 0/eksi ise yok, direnç uygulanır | tam | `mastery.ts:116-124`; P3; `mastery.test.ts:162` | P0 |
| A17 | Nick: Light ek saldırısı Attack eyleminin içinde, turda bir | Yan el silahının ustalığı Nick ve seçiliyse (`nickOffhand`) bonus eylem boş kalır | tam | `create.ts:387`, `economy.ts:226-228`; `offhand.test.ts` | 6719 (P1) |
| A18 | Push: isabette 10 ft düz uzağa, Large ve küçük; isteğe bağlı | 2 altıgen (10 ft) itme; Huge itilmez; seçim (`pushChoice`) yoksa yakın dövüşte yalnız eylemin son saldırısında (P3: ilk saldırıda itmedi, son saldırıda itti; `pushChoice: 'push'` ile ilk saldırıda itti); mesafe seçilemez (hep 10 ft) | tam | `mastery.ts:135-144`; P3; `mastery.test.ts:171-197` | P0, Kuyruk 19 |
| A19 | Sap: isabette hedefin sonraki saldırısı dezavantajlı, saldıranın sonraki turunun başına dek | `sap` işareti `turnStart`, kullanılınca kalkar | tam | `mastery.ts:145-146`, `marks.ts:10-15`; `mastery.test.ts:102-117` | P0 |
| A20 | Slow: hasarlı isabette −10 ft, üst üste binmez | `slow` işareti 10 ft, `turnStart` | tam | `mastery.ts:147-150`; `mastery.test.ts:140` | P0 |
| A21 | Topple: CON save, DC 8 + değiştirici + PB; başarısızsa Prone | DC L5: 14 (8+3+3), L9: 15; başarısızlıkta Prone | tam | `weapons.ts:70`, `mastery.ts:155-168`; P3 | P0 |
| A22 | Vex: hasarlı isabet → o yaratığa sonraki saldırı avantajlı, sonraki turunun sonuna dek | `vex` işareti (kendi turunda 2 tur sonu) | tam | `mastery.ts:151-154`; `mastery.test.ts:118-139` | P0 |
| A23 | Fighting Style feat'leri (s. 87–88) | Archery +2 yalnız Ranged silah (atılan Melee silah değil), Defense zırhla +1 (Chain Mail 16 → 17), GWF iki elle Two-Handed/Versatile 1–2 → 3, TWF yan elde değiştirici; dört feat de `ok` | tam | `class-features.json` `feats`; `weapons.ts:33-43`; P5 | 6810, 6702 |
| A24 | Improved Critical: silah ve Unarmed Strike 19–20 | `critOn` 19 (3. seviye); doğal 19 kritik; büyü saldırısında yok | tam | `features.ts:284`; `classTraits.test.ts:120-124`; P2 | 6390 |
| A25 | Superior Critical: 18–20 | 15. seviyede `critOn` 18; Unarmed doğal 18 kritik, 14. seviyede değil | tam | P1, P2 | 6390 |
| A26 | Remarkable Athlete: inisiyatif ve STR (Athletics) avantajı | İnisiyatif avantajı ve Athletics kontrol kipi | tam | `create.ts:825`, `skills.ts:100` | 6390 |
| A27 | Remarkable Athlete: kritikten hemen sonra yarı hızla fırsat saldırısız hareket | Kendi turunda kritik → `shift_granted` 3 altıgen (P2). **Başkasının turunda** (fırsat saldırısı) kritikte bütçe yazılır ama oyuncu o an komut veremez, kendi turunun başında ekonomi sıfırlanınca kaybolur | kısmi **[YENİ]** | `features.ts:414`, `reduce.ts:637-638`, `shift.ts` (kod okuması); P2 | 4658 |
| A28 | Heroic Warrior: savaşta tur başında Heroic Inspiration yoksa gelir (fikstür) | `turn_ended` → sıradaki savaşçıda yenilenir; **inisiyatifte ilk sıradaki Champion 1. turunda almaz** (savaş başlangıcı `turn_ended`'den geçmez; P2: 1. tur `null`, 2. tur 1). Reroll başarısız d20'de (fikstür notuyla aynı; P2: 5 → 19 kritik) | kısmi **[YENİ, hata]** | `reduce.ts:634-640`; P2 | 4743 |
| A29 | (Champion 10+) iki ikinci şans birlikte | Liste sırası Indomitable → Heroic Inspiration: save başarısızlığında önce (sınırlı) Indomitable harcanır, her tur dolan Heroic Inspiration kullanılmaz; Indomitable tutmazsa Heroic Inspiration denenmez (P2: Indomitable 11, başarısız, HI kaldı) | kısmi **[YENİ]** | `effectDice.ts:73-90`, `attack.ts:117-130`; P2 | 4292 (zincir kuralı) |
| A30 | Survivor / Defy Death: ölüm save'i avantajlı, 18–20 doğal 20 | Avantaj + 18 → 20, `revived` 1 HP | tam | `commands.ts:136-141`; P2 | 6390 |
| A31 | Survivor / Heroic Rally: Bloodied ve ≥ 1 HP iken tur başında 5 + CON | `hp > 0 && hp ≤ ⌊maxHp/2⌋` (tam sayıda Bloodied ile aynı) | tam | `commands.ts:159-163`; `classTraits.test.ts:125-138` | 6390 |
| A32 | Epic Boon (19; Combat Prowess önerilir) | Yuva var, Epic Boon feat'leri veride `ok` (Combat Prowess: Peerless Aim `peerless-aim`); bu denetimde savaşta çalıştırılmadı | doğrulanmadı | `class-features.json` `feats`; P1 | Kuyruk 19 |

## B) Oluşturucu ve seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Çekirdek: d10, STR/CON save, Simple+Martial, Light/Medium/Heavy + Shield, 2 beceri / 9 | `data/classes.json` birebir aynı; save STR +5, CON +4 (mod + PB) | tam | `data/classes.json:151-189`; P1 | — |
| B2 | Başlangıç ekipmanı A/B/C | Paket seçimi yok; öneri Chain Mail + Shield + Longsword + Light Crossbow (genel serbest donanım) | kısmi **[bilinen, genel]** | `data/onerilen-baslangic.json:34-41` | SD3 (1498) |
| B3 | Fighting Style (1): bir Fighting Style feat'i, Defense önerilir | Yuva (1) ve 4 feat seçilebilir, yinelenen feat reddi (`featOnce`). **Öneri yok**: yeni karakterde öneri yalnız ASI yuvalarına yazılır, boş Fighting Style yuvası sorun sayılmaz (Fighter stilsiz kaydedilebilir) | kısmi **[YENİ]** | `advancement.ts:227-262`, `builderDefaults.ts:229-237` (kod okuması) | SD3 |
| B4 | Fighting Style her Fighter seviyesinde değiştirilebilir | Oluşturucuda serbest düzenleme (seviye başına bir kısıtı yok; genel) | bilinçli sapma | `builder.ts` (serbest düzenleme) | P0 (6835: "oyun dışı seçim serbest") |
| B5 | Weapon Mastery 3/4/5/6, Simple ya da Martial; uzun dinlenmede 1 değişim | `count` 1: 3, 4: 4, 10: 5, 16: 6; `melee: false` (38 silah, menzilli dahil); `swap: 1` | tam | `class-features.json:1340-1347`; P1; `mastery.test.ts:60-89` | P0 |
| B6 | ASI 4/6/8/12/14/16, Epic Boon 19 | `advancementSlots('fighter', 20)` aynı; öneri ASI yuvalarına +2, Epic Boon yuvası boş kalır (Combat Prowess önerisi yok) | tam | `advancement.ts:34-41`; P1 | Görev N |
| B7 | Alt sınıf (3); Champion özellikleri 3/3/7/10/15/18 | `gainedFeatures` 20/20 aynı, `missingFeatures` boş; varsayılan alt sınıf `champion` (`alt-sinif-gorunum.json:14`); oluşturucu 3+ seviyede alt sınıf ister | tam | P1 | AS2 |
| B8 | Additional Fighting Style (7) | İkinci `featSlot` 7. seviyede (`style 1/7`); Defense + Archery birlikte (AC 17), aynı feat iki kez sorun | tam | fikstür; P1, P5 | AS2 |
| B9 | HP: d10 + CON, sonraki seviyelerde 6 + CON | Dwarf (Toughness) CON 16: 1. seviye 13, 20. seviye 184 (12 + 19 × 8 + 20) | tam | P1 | — |

## C) Dinlenme, Serüven ve kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Second Wind: kısa dinlenmede 1, uzun dinlenmede hepsi | `recharge: short 1, long all` | tam | `class-features.json:18-28` | Görev N |
| C2 | Action Surge: kısa ya da uzun dinlenmede hepsi | `recharge: short all, long all` | tam | `class-features.json:4-17` | — |
| C3 | Indomitable: uzun dinlenme | `recharge.long: all` | tam | `class-features.json:68-82` | — |
| C4 | Uzun dinlenmede bir Weapon Mastery değişimi | Karakter listesinde "Silah talimi" (`masterySwapProblem`, sınır 1). **Serüven'de yok**: `fighter` `secim-degisim.json`'da yok, `set_choices` reddeder, "Seçimler" düğmesi çıkmaz | kısmi **[YENİ]** | `rules/mastery.ts:240-253`; `seruven.ts:803`; `SeruvenScreen.tsx:436`; P1 (`choicesBound` false) | P0, B94 (Fighter dışı) |
| C5 | Seviye atlayınca ASI/feat (7 yuva), Epic Boon, yeni Weapon Mastery (4/10/16), Additional Fighting Style (7), Fighting Style değişimi | Serüven `seruven_leveled` yalnız `sheet.level` artırır; Fighter bağlı olmadığı için "yazılmayan alan yalnız eklenir" bile çalışmaz: boş yuvalar Serüven içinde doldurulamaz | yok **[YENİ]** | `seruven.ts:432, 800-815`; `levelChoices.ts:28` | 5068 (M4, genel "Karar bekleyen"), B93/B94 |
| C6 | Alt sınıf 3. seviyede | Serüven'de 2 → 3'e çıkan Fighter'a alt sınıf atanmaz (`migrateSubclasses` yalnız karakter listesinde, `App.tsx:191`); Champion özellikleri (Improved Critical, Remarkable Athlete) gelmez (P5: alt sınıfsız L5 `critOn` 20) | yok **[YENİ]** | `builder.ts:466-475`, `seruven.ts:432`; P5 | 5068 |
| C7 | Savaş sonrası HP/kaynak karakterde kalır | K10 mekanizması (en çok + harcanan); Fighter'a özgü olay türü yok | tam (genel) | `characterRest.ts` | 5982 (K10) |
| C8 | Serüven kısa dinlenmesinde Second Wind +1, Action Surge dolu | Genel `rechargeResources` yolu; Fighter kaynakları için Serüven'de uçtan uca çalıştırılmadı | doğrulanmadı | — | K10 |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Second Wind | HP yarı ya da altıyken bonus eylemle (P4: L5 HP 15 → ilk komut `second_wind`); yalnız parti tarafı | tam | `ai.ts:1467-1473`; P4 | Görev N |
| D2 | Action Surge ve Extra Attack | Eylem bitince vurabileceği hedef varsa: P4 L5 `attack ×2, action_surge, attack ×2`; L17 `attack ×3, action_surge, attack ×3` | tam | `ai.ts:1647-1655, 1931`; P4 | Görev N |
| D3 | Tactical Shift | Kayma bütçesi varken yürüyüş hedefi bütçe içindeyse `shift_move`'a çevrilir | tam | `ai.ts:1709-1715` | 4658 |
| D4 | Indomitable, Tactical Mind, Heroic Inspiration | Motorda kendiliğinden (YZ ve oyuncu aynı); A10/A29 kaynak seçimi sorunları burada da geçerli | bilinçli sapma | `effectDice.ts` | 6390 |
| D5 | Tactical Master | YZ saldırı komutunda `mastery` üretmez: hiç kullanmaz | yok **[YENİ]** | grep `mastery` (`ai.ts`, `ai/`) | — |
| D6 | Silah/ustalık seçimi, Push | Silah seçiminde ustalık puanı (`masteries.*.ai`: Topple 1,5; Cleave/Graze/Sap/Vex 1; Push/Slow 0,5); Push seçimi göndermez (son saldırı kuralı) | tam | `class-features.json` `masteries`; P0 kaydı | 6810 |
| D7 | Düşman tarafında Fighter | `bonusFeature` ve `surge` yalnız parti yolunda (`chooseCommand`); düşman tarafı Second Wind/Action Surge kullanmaz | bilinçli sapma | `ai.ts:1468, 1931, 3109` | Paladin D8 benzeri |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Özellik adları (SD4: sınıf özelliği adları İngilizce) | EN menü "Action Surge", "Second Wind"; TR menü "Atılım", "İkinci Soluk" (SD2 kısa menü adları). Ranger E1 / Paladin E3 ile aynı çelişki; kullanıcıya sorulmadı. Günlükte adlar İngilizce | kısmi **[bilinen, genel]** | `strings.tr2.ts:469`, `strings.en.ts:1255` | SD4 (1474) |
| E2 | Action Surge ipucu | TR "Fighter, dinlenmeye kadar bir kez", EN "once per rest": 17. seviyede iki kullanım yazmıyor | kısmi **[YENİ]** | `strings.tr2.ts:689`, `strings.en.ts:1463` | — |
| E3 | Second Wind düğmesi | Tam canlıyken `hpFull` nedeniyle kapalı (motor izin veriyor, P2: kayma 3 altıgen). Tactical Shift'in kaçış kullanımı arayüzden yapılamaz | kısmi **[YENİ]** | `MapBattle.tsx:1686-1688, 2607-2611`; P2 | — |
| E4 | Tactical Master seçimi | Saldırı balonunda Push/Sap/Slow seçici yok (Cunning Strike ve Brutal Strike seçicileri var); oyuncu özelliği kullanamaz | yok **[YENİ]** | `MapBattle.tsx:806-818, 2799-2810` | 4743 |
| E5 | Fighter özellik açıklamaları TR/EN | `data/aciklamalar.json` `features.tr` ve `features.en`'de 12/12 Fighter özelliği | tam | `aciklamalar.json` taraması | SD4 |
| E6 | İkonlar | `wind` iyileştirme grubu ve bonus eylem kümesinde; `data/kaynak-ikon.json`'da `secondWind`, `actionSurge`, `indomitable`, `heroicInspiration` yok (yalnız metin çipi) | kısmi **[YENİ]** | `actionMenu.ts:45-69`; `kaynak-ikon.json` | E4c |
| E7 | Champion adları (fikstür "Gladyatör / Gladiator", özellik adları TR "Gelişmiş Kritik" …) | Gerçek paketteki adlar görülemedi; SD4 alt sınıf adı TR, özellik adı kuralı paket için doğrulanmadı | doğrulanmadı | fikstür; `AS2-FARKLAR.md:26` | AS2, SD4 |
| E8 | Push seçimi | Saldırı balonunda Push seçici (otomatik / it / itme) `pushChoice` açıkken | tam | `MapBattle.tsx:817, 2808` | Kuyruk 19 |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: yeni kural sürümü gerekiyorsa **güncel sürümün bir fazlası, tek sabit** (bugün 95); yoksa sürümsüz. SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Fighter'ı `data/secim-degisim.json`'a bağla** (C4–C5): `weaponMasteries: { dinlenme: 1 }`, `stil: { seviye: 1 }`; `advancements` yazılmaz (yalnız eklenir: ASI/feat/Epic Boon ve Additional Fighting Style boş yuvaya). Yalnız veri satırı (B94 Ranger/Paladin gibi) + `levelChoices.test.ts` satırı | Yüksek (Serüven Fighter'ı 4. seviyeden itibaren ASI'sız, yeni ustalıksız) | Sürümsüz | 1 saat |
| 2 | **Serüven seviye atlamada eksik alt sınıfı doldur** (C6): bağlandıktan sonra "yalnız eklenir" ile seçilebilir; seçilmemişse `defaultSubclass` ataması ve bildirim (`migrateSubclasses` ile aynı) | Yüksek (Serüven'de 3+ Fighter Champion özelliksiz) | Sürümsüz | 1–2 saat |
| 3 | **Tactical Master arayüzü** (E4): saldırı balonunda ustalıklı silah seçiliyken "Ustalık: kendi / Push / Sap / Slow" (Cunning/Brutal seçicileriyle aynı kalıp); TR/EN metin | Orta (9+ Fighter'ın bir özelliği hiç kullanılamıyor) | Sürümsüz (motor hazır) | 2 saat |
| 4 | **Heroic Warrior ilk tur** (A28): savaş başında (ya da ilk aktörün turu başında) Heroic Warrior'lı savaşçıya Heroic Inspiration | Düşük-orta | Güncel sürümün bir fazlası, tek sabit | 1 saat |
| 5 | **Ölüm save'inde ikinci şans** (A11): Indomitable (ve Heroic Inspiration) ölüm save'inde de; ölüm save'i `saveDice` yolundan | Düşük-orta (9+ Fighter ölümünü erteler) | Güncel sürümün bir fazlası, tek sabit | 2 saat + hızlı regresyon |
| 6 | **İkinci şans seçimi** (A10, A29): kaynağı yenilenen girişi (Heroic Inspiration) önce dene; başarı imkânsızken (doğal 20 + bonus < DC) sınırlı kaynak harcama | Düşük | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 7 | **Arayüz küçükleri** (E2, E3, E6): Second Wind tam canda da açık (Tactical Shift varsa; yoksa uyarı), Action Surge ipucu "17. seviyede iki", Fighter kaynak ikonları | Düşük | Sürümsüz | 1–2 saat |
| 8 | **Remarkable Athlete fırsat saldırısında kritik** (A27): başkasının turundaki kritikte kaymayı o an iste (tepki kipi gibi `NeedReaction` yolu) ya da kaydı "bilinçli sapma" olarak DECISIONS'a yaz | Düşük | Sürüm (uygulanırsa) | 2–3 saat |
| 9 | **YZ Tactical Master** (D5): Sap'ı güçlü tek saldırılı hedefe, Push'u yakın dövüşten kaçan/tehlike kenarındaki hedefe; **sim imzası değişir** | Düşük-orta | Güncel sürümün bir fazlası, tek sabit (YZ kararı) + 3–4 senaryolu hızlı regresyon | 2–3 saat |
| 10 | **Oluşturucu önerisi** (B3, B6): yeni Fighter'a Fighting Style önerisi Defense, Epic Boon önerisi Boon of Combat Prowess (`data/onerilen-baslangic.json`, SRD'nin kendi önerisi) | Düşük | Sürümsüz | 1 saat |
| 11 | **Belge**: CLAUDE.md "Bilinen eksikler" Fighter cümlesini güncelle (Tactical Master motorda var ama arayüzsüz, Heroic Warrior var, Tactical Shift/Remarkable Athlete serbest kayma) | Düşük | Sürümsüz | 0,5 saat |
| 12 | **Testler** (probe'lardan kalıcıya): tablolar 20/20, Action Surge 17 turda bir, Second Wind iyileşme, Tactical Master L8/L9, Cleave turda bir, Topple DC, Heroic Warrior ilk tur, Survivor 18 | Regresyon güvencesi | — | 2 saat |

### Karar gerekli (temel akışı değiştirir)

| # | Konu | Neden karar | Tahmini iş |
|---|---|---|---|
| K1 | **İkinci şansları oyuncuya sormak** (Indomitable, Tactical Mind, Heroic Inspiration; A10, D4): SRD "can"; şimdi kendiliğinden (DECISIONS 6390). Sormak `askReaction` benzeri bir istem ve elle zar akışı ister | Savaş akışı (her başarısız save'de soru) ve sim'de karar kuralı | Orta-büyük (ortak; Rogue Stroke of Luck da aynı) |
| K2 | **Cleave ikinci hedefini oyuncu seçsin / atlayabilsin** (A15): SRD seçim hakkı veriyor; şimdi en az HP'li otomatik (DECISIONS 6838) | Saldırı akışına ek seçim; YZ kuralı aynı kalabilir | 2–3 saat |
| K3 | **Serüven seviye atlama seçim akışı** (C5–C6, DECISIONS 5068 M4 genel): Fighter bağlansa bile seçimlerin zorunlu mu (boş yuva uyarısı) yoksa isteğe bağlı mı olacağı | Bütün sınıflara ortak ürün kararı | Küçük (karar), uygulama öneri 1–2 ile |

Probe'larla denenip **doğru** bulunan davranışlar (regresyon için not): Second Wind 1d10 + seviye (L1 8, L5 12, L20 27) ve kullanım tablosu; Action Surge eylem sonrası, turda bir, 17'de iki kullanım, Magic action yasağı, Extra Attack ile 2/3/4 + 2/3/4 saldırı; Tactical Shift 15 ft, fırsat saldırısısız, hareket hakkı korunur; Indomitable +9/+13/+17 ve 1/2/3 kullanım; Tactical Mind tutmazsa kaynak kalır; Tactical Master yalnız 9+ ve yalnız Push/Sap/Slow; Cleave değiştiricisiz ve turda bir; Graze 3; Topple DC 14/15; Push 10 ft (son saldırı ya da seçimle); Improved/Superior Critical 19/18 (Unarmed dahil, 14'te 18 değil); Remarkable Athlete kendi turunda kritik kayması; Heroic Inspiration ile başarısız saldırının yeniden atılması; Defy Death 18 → 20; Defense + Archery birlikte (AC 17); HP 13/184; Weapon Mastery 3/4/5/6 ve 38 uygun silah.

## Probe dökümü (geçici, silindi)

- **P1** (`zzTmpFighter1`): `classKit`/`combatantFromSheet` 1–20 (saldırı, Weapon Mastery sayısı/kısıtı/değişim, Second Wind, Action Surge, Indomitable, `critOn`, işaretler, Fighting Style yuvaları), `advancementSlots('fighter', 20, 'champion')`, `missingFeatures` (boş), `gainedFeatures`, sınıf çekirdeği, `choicesBound('fighter')` = false, `masterySwapLimit` 1, `masteryOptions` 38 (menzilli dahil), save ve HP, Fighting Style ve Epic Boon feat durumları.
- **P2** (`zzTmpFighter2`): Action Surge (eylemden önce red; L2/5/11/17/20 saldırı sayıları ve ikinci kullanım; Dash → Surge → Dodge), Second Wind (L1/5/20 iyileşme, kayma bütçesi, tam canda motor izni), Indomitable (`saveDice` 9/13/17; L10 Heroic Inspiration ile sıra; DC 40'ta harcanma), Tactical Mind (DC 30), Heroic Warrior (ilk sıradaki Champion 1. tur/2. tur, başarısız saldırı yeniden), Survivor ölüm save'i (18 → 20), kritik 19/18 ve kritik kayması.
- **P3** (`zzTmpFighter3`, haritalı): silah seçenekleri (`mastery`, `weaponDamage`, `masteryDc`), Cleave (erişim dışı aday yok; bitişikte 6 hasar; aynı tur ikinci yok), Graze, Topple, Push (ilk/son saldırı, `pushChoice`), Tactical Master (L8/L9, Topple reddi, ustalıksız silah), Tactical Shift (3 altıgen, 4 altıgen red, sonra yürüyüş).
- **P4** (`zzTmpFighter4`): YZ komut dizileri (L5 HP 15, L17, L9 HP 20).
- **P5** (`zzTmpFighter5`): alt sınıfsız L5 Fighter (`critOn` 20), 7. seviyede Defense + Archery (AC 17), iki Defense (AC 17; oluşturucu `featOnce` kodu `advancement.ts:258`).
