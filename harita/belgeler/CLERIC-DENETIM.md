# Cleric denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Kural sürümü 79 (K75), kayıt sürümü 22.
Kaynak: `docs/SRD_CC_v5.2.1.pdf` s. 36–40 (Cleric; PDF sayfa no = basılı no), `data/srd/classes.json`, `data/srd/spells.json`.
Yöntem: kural listesi SRD metninden çıkarıldı, kod ve veri okundu, emin olunmayan satırlar geçici vitest probe'uyla denendi (probe dosyası silindi, depoya girmedi). Probe ile denenenler "probe" diye işaretli.

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d8, WIS+CHA save, Simple silah, Light/Medium zırh + Shield, 2 beceri (History, Insight, Medicine, Persuasion, Religion), başlangıç ekipmanı (A: Chain Shirt, Shield, Mace, Holy Symbol, Priest's Pack, 7 GP) | 36 |
| S2 | Spellcasting: 3 cantrip (4. ve 10. seviyede +1), **hazırlanan sayı tablodan** (4…22, WIS+seviye değil), tam büyücü slotları, uzun dinlenmede hazırlık değişimi, seviye atlayınca 1 cantrip değişimi, Holy Symbol odak, domain büyüleri sayıya girmez | 36–37 |
| S3 | Divine Order: Protector (Martial + Heavy) / Thaumaturge (+1 cantrip, Arcana/Religion'a WIS bonusu, en az +1) | 37 |
| S4 | Channel Divinity (2. seviye): 2 kullanım (6'da 3, 18'de 4), kısa dinlenmede 1, uzun dinlenmede hepsi; save DC = büyü DC'si | 37 |
| S5 | Divine Spark: Magic action, 30 ft, "başka bir yaratık", 1d8+WIS (7/13/18'de 2d8/3d8/4d8), iyileştirme ya da CON save'li Necrotic/Radiant (başarıda yarı) | 37 |
| S6 | Turn Undead: Magic action, 30 ft, seçilen her Undead WIS save; başarısızsa 1 dk Frightened + Incapacitated, kaçmaya çalışır; hasar alırsa, Cleric Incapacitated olursa ya da ölürse biter | 37 |
| S7 | Sear Undead (5): WIS d8 (en az 1) tek zar, başarısız her Undead'e Radiant; efekti bitirmez | 37 |
| S8 | Blessed Strikes (7): Divine Strike (kendi turunda bir kez silah isabetine +1d8 Necrotic/Radiant) ya da Potent Spellcasting (Cleric cantrip hasarına WIS) | 38 |
| S9 | Divine Intervention (10): Magic action, **herhangi bir** Cleric büyüsü ≤5 (Reaction hariç), slotsuz ve Material'sız, Long Rest'e dek bir kez | 38 |
| S10 | Improved Blessed Strikes (14): Divine Strike 2d8; Potent: Cleric cantrip'iyle hasar verince 60 ft içinde 2×WIS geçici HP | 38 |
| S11 | Epic Boon (19), ASI (4/8/12/16), alt sınıf (3; özellikler 6 ve 17) | 36–38 |
| S12 | Greater Divine Intervention (20): Wish seçilebilir; seçilirse 2d4 Long Rest yeniden kullanılamaz | 38 |
| S13 | Cleric büyü listesi (109 büyü; 0–9) | 38–40 |
| S14 | Life Domain: Disciple of Life (3), Domain büyüleri (3/5/7/9), Preserve Life (3), Blessed Healer (6), Supreme Healing (17) | 40 |

## Özet sayılar

Durum sözlüğü: **tam** · **kısmi** · **yok** · **bilinçli sapma** (DECISIONS'ta gerekçeli). "Bilinen": kayıtlı konu.

| Alan | Satır | tam | kısmi | yok | bilinçli sapma |
|---|---|---|---|---|---|
| A) Savaş içi | 30 | 16 | 9 | 2 | 3 |
| B) Oluşturucu / seviye atlama | 8 | 7 | 1 | 0 | 0 |
| C) Dinlenme ve Serüven | 5 | 3 | 2 | 0 | 0 |
| D) Yapay zekâ | 6 | 4 | 1 | 0 | 1 |
| E) Arayüz ve TR/EN | 6 | 2 | 3 | 0 | 1 |
| **Toplam** | **55** | **32** | **16** | **2** | **5** |

**Güncelleme (aynı gün, sonradan):** A12 ve A15, denetimden sonra `birlesik`'e birleşen D1 (veri düzeltmeleri, kural sürümü 86) ve D3 (süren etkinin verdiği durumlar bağışıklığa takılır, sürüm 89) ile kapandı; probe'lar bu iki işten önceki ağaçta çalıştırılmıştı. Aşağıdaki A12/A15 satırları ve bulgu 1 bu yüzden "kapandı" olarak işaretli. Kapanışı Paladin denetimi sırasında bir probe ile (Abjure Foes bağışıklığı) ve veri dosyası okumasıyla doğruladım; Turn Undead için probe tekrarlanmadı.

(Sayım tablo satırlarının durum sütunundan; "tam (dolaylı/etkisiz)" tam, "kısmi (hata/bilinçli/doğrulanmadı)" kısmi sayıldı.)

Öne çıkan bulgular (ayrıntı tabloda):

1. **Kapandı (denetimden sonra):** `data/canavar-turleri.json` Wight, Wraith ve Specter'ı yanlış türde yazıyordu (`dragon`, `monstrosity`, `celestial`; PDF iki sütunlu okuma hatası). D1 ile üçü `undead` oldu (şimdi veride doğrulandı). Turn Undead, Sear Undead, Divine Smite ve Protection from Evil and Good bu üçünü artık Undead sayıyor.
2. Turn Undead'in iki yan kuralı eksik (Frightened bağışıklığı D3 ile kapandı): "olabildiğince uzaklaşır" yok, Cleric Incapacitated/ölünce efekt bitmiyor.
3. Divine Strike, düşmanın turunda yapılan fırsat saldırısında da ek zar veriyor (SRD: "kendi turlarında").
4. Disciple of Life/Blessed Healer çoğu büyüde tam; Mass Heal ve Power Word Heal yolunda (`spells69.ts`) yok.
5. Bilinen: Divine Intervention yalnız hazırlanmış büyüyle; Greater DI 2d4 sayacı yok; Potent Spellcasting Cleric listesi ayrımı yapmıyor.
6. Kullanıcı ipucundaki "hazırlanan büyü sayısı WIS+seviye" SRD 5.2.1'de **geçerli değil** (tablo); oyun tabloyu kullanıyor (doğru).

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Protector: Martial + Heavy (s. 37) | `options[].armor/martialWeapons`; varsayılan Protector (SRD'de sıra yok) | tam | `cleric.test.ts` "Divine Order"; `class-features.json` `cleric:divine-order` (1595) | 4609 (CLERIC 1) |
| A2 | Thaumaturge: +1 cantrip | `spellLimits` +1, işaret `thaumaturge` | tam | `cleric.test.ts`; probe: seviye 1 cantrip 3 → 4 | 4609 |
| A3 | Thaumaturge: Arcana/Religion'a WIS bonusu (min +1) | Uygulanmıyor, beceri kontrolü sistemi yok; veri notunda "savaş dışı (hikâye)" | bilinçli sapma | `class-features.json` 1614 | 4609 |
| A4 | Channel Divinity 2/3/4 kullanım (2, 6, 18) | `uses.column` SRD tablosundan; kaynak `channelDivinity` | tam | `class-features.json` 99–110; `data/srd/classes.json` tablo; `cleric.test.ts` (kullanım 2) | 4609 |
| A5 | Divine Spark iyileştirme 1d8+WIS, 7/13/18'de 2d8/3d8/4d8, Magic action, 30 ft | `divineSpark` (`cleric.ts` 118–132): zar sayısı `diceAt`; eylem harcar; probe: 13. seviye 17 (3 zar), 18. seviye 4 zar | tam | `cleric.test.ts`; probe | 4611 |
| A6 | Divine Spark hasar: CON save, Necrotic/Radiant, başarıda yarı (yuvarla aşağı) | `saveDamageEvent` (`cleric.ts` 197–210), `Math.floor`; tür seçilmezse hedefe daha çok işleyen | tam | `cleric.test.ts` | 4611 |
| A7 | Divine Spark'ta mod (iyileştir/hasar) ve hasar türünü oyuncu seçer | Komutta `choice` var, ama arayüz `choice` göndermiyor: dosta hep iyileştirme, düşmana hep hasar, tür otomatik (MapBattle 516–517) | kısmi | `MapBattle.tsx` 516 | 4616 ("tür motorda hedefe göre") |
| A8 | "another creature you can see" | Görüş denetimi yok; hedef olarak **kendisi** seçilebiliyor (probe: kendine 17 HP) | kısmi | probe (`cleric.ts` `clericFeatureProblem` 73–79) | yok |
| A9 | Turn Undead: Magic action, 30 ft, WIS save, DC = büyü DC'si | Eylem harcanır, `undeadInRange` 30 ft, DC `spellSaveDc` (probe: economy.action true, 30 ft dışı "Undead yok") | tam | probe; `cleric.test.ts` | 4612 |
| A10 | Başarısız: Frightened + Incapacitated 1 dk; hasar alınca biter | `effect_added` `grants` + `breakOnDamage`, `until` round+9 (probe: until 10) | tam | probe | 4612 |
| A11 | Seçilen Undead'ler ("of your choice") | Menzildeki **bütün** düşman Undead; dost Undead hariç (probe), alt küme seçimi yok | bilinçli sapma | `cleric.ts` 56–66 | yok (düşük etki) |
| A12 | Undead'in durum bağışıklığı geçerli (Ghost: Frightened bağışık → yalnız Incapacitated) | `effect_added.grants` bağışıklığa bakmıyor: Frightened bağışık Ghost'ta (`immune` içinde Frightened) probe'da ikisi birden uygulandı | tam (D3 ile kapandı; denetim anında kısmi/hata) | probe: Ghost conds ["Frightened","Incapacitated"]; `reduce.ts` 146 `immuneTo` yalnız `condition_changed`/save yolunda (893, 984), 701 `effect_added` yok | yok |
| A13 | "olabildiğince uzaklaşmaya çalışır" | Yok. Probe'da turnlu Undead'in YZ komutu `end_turn`; DECISIONS "Frightened davranışına bırakıldı" ama Incapacitated olduğu için YZ hiç hareket etmiyor | yok | probe: `chooseCommand` → `end_turn` | 4612 |
| A14 | Cleric Incapacitated olursa ya da ölürse efekt biter | Yok: efekt yalnız süre ve hasarla biter (probe: Cleric Incapacitated ve ölü iken Undead hâlâ Frightened+Incapacitated). `pruneEffects` (`reduce.ts` 201–216) kaynak durumuna bakmıyor | yok | probe | yok |
| A15 | Undead = SRD yaratık türü Undead | Tür `data/canavar-turleri.json`'dan; **Wight=dragon, Wraith=monstrosity, Specter=celestial** (SRD: üçü Undead; PDF iki sütunlu okuma hatası). Diğer 16 Undead doğru; SRD'deki 19 Undead'den 16'sı | tam (D1 ile kapandı; denetim anında kısmi/veri hatası) | probe: Wight'a Turn Undead "30 ft içinde Undead yok"; `monsters.json` kimlikleri `wight`/`wraith`/`specter` mevcut; SRD s. 340–342 | 4609 (tür verisi P-Paladin kaydı) |
| A16 | Sear Undead: WIS d8 (min 1), tek zar, başarısızlara Radiant, efekti bitirmez | Tek `rollDice`, direnç uygulanır (probe: resistant → yarı), efekt hasardan sonra eklenir | tam | `cleric.test.ts`; probe (resistant) | 4612 |
| A17 | Divine Strike: **kendi turunda** bir kez, silah isabeti, +1d8 Necrotic/Radiant | `usedThisTurn` anahtarı = o anki turun anahtarı; düşmanın turunda fırsat saldırısı da +1d8 alır (probe: B'nin turunda A'nın OA'sı `extra: ["Divine Strike"]`). Kritikte zar ikiye katlanır; tür otomatik (hedefe iyi işleyen) | kısmi (hata) | probe; `cleric.ts` 234–246, `classTraits.ts` 24 | 4613 |
| A18 | Potent Spellcasting: **Cleric** cantrip hasarına WIS | Cantrip ölçekli bütün hasar cantrip'lerine (Magic Initiate vb. dahil) | bilinçli sapma (bilinen) | `spells.ts` 113, `cleric.ts` 231 | 4613 |
| A19 | Improved: Divine Strike 2d8 | `improved-blessed-strikes` → `2d8` | tam | `cleric.ts` 240–242 | 4613 |
| A20 | Improved Potent: cantrip'le **hasar verince** 60 ft içinde 2×WIS geçici HP | `potentTempHpEvents` (`spells.ts` 425–440) yalnız cantrip'in `mechanics.damage` olmasına bakıyor; hasar gerçekten verildi mi denetlenmiyor (Sacred Flame save başarıldı ya da saldırı ıskaladı olsa da verir). Alıcı otomatik (en yaralı), anahtar `featuresK19` | kısmi | kod okuması (probe yok) | 3225 (Kuyruk 19 4b) |
| A21 | Divine Intervention: Magic action, **herhangi** Cleric büyüsü ≤5, Reaction hariç, slotsuz, Long Rest'e dek | `freeSpellList`: yalnız **hazırlanan** (bilinen) büyüler; Reaction hariç; eylem harcar; kendi seviyesinde; slot kalsa da "Slotsuz" düğmesi; probe: hazırlanmamış Hold Person reddedildi, hazırlanmış Cure Wounds slotsuz yapıldı ve kaynak 0 | kısmi — **bilinen** | probe; `create.ts` 335–356; `economy.ts` 82–96 | 3496 (43b), 3574 (41b) |
| A22 | DI'da Material bileşen gerekmez | Oyunda bileşen takibi genel olarak yok (değerli bileşen harcanmaz) | tam (etkisiz) | genel durum | — |
| A23 | Greater DI: Wish; Wish seçilirse 2d4 Long Rest | Wish 20. seviyede her zaman hazır ve DI ile slotsuz (`extraNames`); **2d4 Long Rest bekleme sayacı yok** (DI normal uzun dinlenmede döner) | kısmi — **bilinen** | `class-features.json` 1649; `spells69.ts` 214–235 | 3156 |
| A24 | Disciple of Life: slotla iyileştiren büyü, hedefe +2+slot | Tek hedef (`spells.ts` 784), çok hedef (1204) ve yukarı slotla; slotsuz yapımda yok (probe: DI ile Cure Wounds bonussuz, doğru). **Mass Heal** havuz yolunda (`spells69.ts` `massHealEvents`) ve Power Word Heal'de yok (Heal 6. seviye ve Mass Cure Wounds tamam, probe) | kısmi | probe; `cleric.test.ts` | 4614 |
| A25 | Blessed Healer: başkasını slotla iyileştirince +2+slot (yalnızca iyileştirme olduysa) | `healSelfAfter`: hedef başkasıysa tetiklenir; **hedef tam canlıysa (0 iyileştirme) yine tetikleniyor** (probe: C 30/30 → A +3). Mass Heal/Power Word Heal yolunda yok (probe: PWH'de A'ya iyileştirme yok) | kısmi | probe; `cleric.ts` 224–229 | 4614 |
| A26 | Preserve Life: Magic action, CD harcar, 5×seviye HP, 30 ft Bloodied, **bölüşümü oyuncu yapar**, en çok yarı HP, kendisi dahil | Eylem + CD harcar, 30 ft, Bloodied (yarı HP altı; tam yarıdaki zaten alamaz), kendisi dahil, 0 HP'deki dahil (probe: 15 HP), yarı HP sınırı; dağıtım **otomatik** (en yaralıdan) | kısmi (bilinçli) | probe; `cleric.ts` 104–106, 183–193 | 4614 |
| A27 | Supreme Healing: büyü ve CD iyileştirme zarlarında en yüksek değer | `healDice`: `NdM(±K)` kalıbında en yüksek (Divine Spark dahil); Cure Wounds/Heal doğru. Karma zar ifadesinde sessizce zar atar (kod okuması) | tam | `cleric.test.ts` | 4614 |
| A28 | Domain büyüleri her zaman hazır (3/5/7/9) | `alwaysPrepared` 4 seviye, 7 ve 9 Kuyruk 19'da eklendi; hazırlanan sayıya girmez | tam | `cleric.test.ts` (3, 5); `srd-alt-siniflar.json`; 7/9 veri okuması | 4614, 4609 |
| A29 | Cleric büyü listesi SRD ile aynı | 109 = 109; eksik/fazla yok (probe: SRD `classes` ↔ oyun `Clr` karşılaştırması; seviye dağılımı 7/15/17/19/9/13/11/8/5/5) | tam | probe | — |
| A30 | Alt sınıf Life Domain özellikleri (3, 6, 17) çalışır etiketli | Fikstürde `calisir`; gerçek kaynak dış paket `icerik/` (bu ortamda yok) | tam | `srd-alt-siniflar.json` | 38–43 (AS2) |

## B) Oluşturucu / seviye atlama

| # | SRD ne diyor | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Hazırlanan büyü tablodan (4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22) | `spellLimits('cleric', L)`: probe 1→4, 2→5, 3→6, 4→7, 5→9, 7→11, 10→15, 14→17, 20→22 | tam | probe; SRD s. 36 | — |
| B2 | Cantrip 3 (4. ve 10. seviyede +1); Thaumaturge +1 | probe: 3,3,3,4,4,4,5…; Thaumaturge seviye 1 → 4 | tam | probe | 4609 |
| B3 | Slotlar (tam büyücü) | `data/srd/classes.json` tablosu PDF'ten üretilir | tam | `data/srd/classes.json` | — |
| B4 | Divine Order seçimi (1) ve Blessed Strikes seçimi (7), Improved aynı seçime bağlı | `featureChoices` + varsayılanlar; Improved işaretiyle seçime göre | tam | `cleric.test.ts`, `k17.test.ts`, `k4.test.tsx` | 4609 |
| B5 | ASI 4/8/12/16, Epic Boon 19 | `advancement.ts` SRD tablosundan | tam | `advancement.ts` 33–39 | — |
| B6 | Çekirdek: d8, WIS/CHA, Simple, Light/Medium/Shield, beceri listesi, ekipman | `data/classes.json`: hitDie 8, saves wis/cha, `armorTraining`, 5 beceri; öneri Chain Shirt + Shield + Mace | tam | `data/classes.json`, `data/onerilen-baslangic.json` | — |
| B7 | Domain büyüleri hazırlanan sayıya girmez; her seviye bir cantrip değişimi, uzun dinlenmede hazırlık değişimi | Domain büyüleri `spellNames`'e eklenir (sayı test edilmedi); cantrip/hazırlık değişim kısıtı oluşturucuda serbest düzenleme (kısıt uygulanıp uygulanmadığı bu denetimde doğrulanmadı) | kısmi (doğrulanmadı) | `cleric.test.ts` yalnız varlığı sınıyor | — |
| B8 | Alt sınıf 3. seviyede | Oluşturucu 3+ seviyede alt sınıf ister; Cleric için tek SRD alt sınıfı Life Domain | tam | `alt-sinif-gorunum.json` 12 | AS2 |

## C) Dinlenme ve Serüven akışı

| # | SRD ne diyor | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Channel Divinity: kısa dinlenmede 1, uzun dinlenmede hepsi | `rechargeResources`: probe kısa → +1 (0→1, 1→2), uzun → hepsi | tam | probe; `class-features.json` 99–110 | 4562 (K12) |
| C2 | Divine Intervention: uzun dinlenmede döner | `recharge.long: all`, kısa dinlenmede dönmez (probe) | tam | probe | 3496 |
| C3 | Greater DI Wish: 2d4 Long Rest sayacı | Yok (DI bir uzun dinlenmede döner) | kısmi — **bilinen** | `class-features.json` 1649 | 3156, 3503 |
| C4 | Savaş sonrası kaynak karakterde kalır; seviye atlayınca harcanan düşer | `resourceMax` en çok + harcanan (K10); doğrudan Cleric kaydet/yükle testi bu denetimde yok | tam (dolaylı) | `characterRest.ts` 110–190; K10 kaydı | 4621 |
| C5 | Serüven: Divine Intervention/Channel Divinity'nin düğümler arası taşınması | Serüven savaşı karakter durumunu `resourceMax` ile geri yazar; Cleric özelinde uçtan uca test yok | kısmi (doğrulanmadı) | `src/app/seruvenBattle.ts` | — |

## D) Yapay zekâ

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Preserve Life | `clericChoice` (`ai.ts` 3097): ≥2 Bloodied dost ya da biri ¼ altında; 30 ft | tam | `cleric.test.ts` "yapay zekâ" | 4595, 4558 |
| D2 | Turn Undead | Undead toplam HP ≥ 15, Incapacitated olanlar sayılmaz; Wight/Wraith/Specter artık sayılıyor (A15 kapandı) | tam | `ai.ts` 3113 | 4595 |
| D3 | Divine Spark | Yalnız düşmüş (0 HP) dostu kaldırmak için; düşmana hasar modu yok | bilinçli sapma | `ai.ts` 3117–3121 | 4595, 4562 |
| D4 | İyileştirme önceliği | Düşmüş dosta iyileştirme büyüsü önce (önceki kurallar); bu denetimde bu yol ayrıca ölçülmedi | tam (dolaylı) | DECISIONS kaydı | 4595 |
| D5 | Divine Intervention | Yalnız slot bitince (son çare) | tam — **bilinen** | `economy.ts` 90–93 | 3496, 3574 |
| D6 | Turned Undead'in davranışı | Incapacitated YZ `end_turn` verir; kaçış yok (A13) | kısmi | probe | 4612 |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne oluyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Divine Spark hedef seçimi | Hedef seçilir; mod ve tür seçilemez (A7) | kısmi | `MapBattle.tsx` 516 | 4616 |
| E2 | Özellik adları EN/TR | EN `strings.en.ts` 919: Divine Spark/Turn Undead/Preserve Life. TR menü kısa adları `strings.tr2.ts` 246: "İlahi Kıvılcım", "Ölüleri Kov", "Canı Koru" (SD2); SD4 "adlar İngilizce kalır" der. İkisi çelişir mi, bu denetimde kullanıcı kararı sorulmadı | kısmi (tutarsızlık olası) | `strings.tr2.ts` 243–246 | SD4 (119) |
| E3 | Seçenek adları (protector/thaumaturge/divine-strike/potent-spellcasting) | TR/EN çevrili, iki dosyada da var | tam | `strings.ts` 156, `strings.en.ts` 149 | 4616 |
| E4 | Cleric sınıf özellik açıklamaları (TR) | `data/aciklamalar-tr.json` içinde Cleric özellikleri için kayıt yok (tarama); açıklamanın TR kaynağı bu denetimde doğrulanmadı | kısmi (doğrulanmadı) | `aciklamalar-tr.json` taraması | SD4 |
| E5 | Life Domain adı | TR görünen ad kayıtta üç farklı: fikstür "Yaşam Etki Alanı", DECISIONS "Yaşam Alanı", görünen kural "Yaşam Manastırı" (K49/B7) | bilinçli sapma | `srd-alt-siniflar.json`; DECISIONS 43 | 43, 2885 |
| E6 | Turn Undead durumu | Jetonda Frightened/Incapacitated rozeti, efekt ikonu ✝ | tam | `cleric.ts` 156–158 | — |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunu: kural sürümü 79'dan sonra tek toplu sürüm (80) önerilir; veri düzeltmesi sürümsüz kalabilir, çünkü `creatureType` savaş başında savaşçıya yazılır ve replay kayıtlı durumdan oynar (bu varsayım bu denetimde doğrulanmadı).

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | ~~Wight, Wraith, Specter türü~~ **kapandı (D1)**. Kalan: `temadan` listesindeki diğer türlerin iki sütunlu PDF okumasıyla doğrulanması D1 kapsamında yapıldı mı, bu belgede doğrulanmadı | — | — | — |
| 2 | ~~Turn Undead Frightened bağışıklığı~~ **kapandı (D3, sürüm 89)** | — | — | — |
| 3 | Turn Undead: kaynak Cleric Incapacitated ya da ölüyse efekt biter (`ActiveEffect` yeni alan + `pruneEffects`) | Orta | 80 | 2 saat |
| 4 | Divine Strike yalnız Cleric'in kendi turunda (`turnKey` sahibi = aktör) | Orta (OA başına +4,5 hasar) | 80 | 1 saat |
| 5 | Turn Undead kaçış hareketi: `compelEvents` flee kalıbı + YZ Incapacitated'da yalnız hareket | Orta-düşük (taktik; denge ölçümü gerekir) | 80 | 3–4 saat |
| 6 | Mass Heal ve Power Word Heal: Disciple of Life ve Blessed Healer; Blessed Healer'ı "gerçekten iyileştirme oldu" koşuluna bağla | Düşük-orta (17. seviye ve üstü) | 80 | 1–2 saat |
| 7 | Improved Potent Spellcasting: yalnız hasar verildiyse geçici HP (olaylardan hasar kontrolü) | Düşük | 80 | 1 saat |
| 8 | Divine Spark: kendine hedef ve görüş denetimi; arayüzde "iyileştir / Necrotic / Radiant" seçimi | Düşük-orta | Kural kısmı 80, arayüz sürümsüz | 2–3 saat |
| 9 | Preserve Life oyuncu bölüşümü (seçim arayüzü) | Düşük | Sürümsüz (YZ otomatik kalır) | 4+ saat |
| 10 | Bilinenler: Divine Intervention hazırlanmamış büyü (arayüz: tüm Cleric listesi, DI yalnız Magic eylemi), Greater DI 2d4 sayacı (savaş dışı dinlenme sayacı), Potent'te Cleric listesi süzmesi | Bilinen, ürün kararı | 80 (DI), sürümsüz (sayaç) | Karar bekliyor |
| 11 | E: SD2 TR kısa menü adları ↔ SD4 "adlar İngilizce" kararını netleştir; Life Domain TR adını tek yere bağla; Cleric özellik açıklamalarının TR kaynağını `describeTr` ile doğrula | Düşük | Sürümsüz | 1–2 saat |
| 12 | Test boşlukları (kalıcı teste çevrilecek probe'lar): Turn Undead bağışıklık/kaynak bitişi/OA ve Divine Strike, Mass Heal, Blessed Healer tam canlı hedef, DI hazırlanmamış, B7 sayım, C5 Serüven taşıma | — | — | 2 saat |

Probe'larla denenip doğrulanan **doğru** davranışlar (regresyon için not): DI ile yapılan Cure Wounds'ta Disciple of Life yok; Preserve Life 0 HP'deki dosta işler; Sear Undead dirençte yarılanır; dost Undead Turn Undead'den etkilenmez; kısa dinlenme +1 Channel Divinity; Cleric listesi SRD ile birebir.

## B93 düzeltmeleri (Görev B93, kural sürümü 93)

"Sürümlü": savaş davranışı değişti, 92 ve altı kayıt/replay eski davranışta. "Sürümsüz": veri, arayüz, oluşturucu ya da Serüven.

### A. Ortak

- A17 Divine Strike yalnız kendi turunda: **düzeldi** (sürümlü 93; `cleric.ts` `divineStrikeHit`, Druid Primal Strike aynı kod; test `b93.test.ts` A3).
- B7 / C5 seviye atlama ve dinlenmede seçim değişimi (Serüven): **düzeldi** (sürümsüz; `levelChoices.ts`, `data/secim-degisim.json`: cantrip seviye atlamada 1, hazır liste uzun dinlenmede hepsi; test `levelChoices.test.ts`).

### B. Cleric

- A7 / E1 Divine Spark kip ve hasar türü seçimi: **düzeldi** (sürümsüz arayüz; menüde "Divine Spark: iyileştir / Necrotic hasar / Radiant hasar", TR+EN).
- A8 Divine Spark kendine ve görülmeyene hedeflenmez: **düzeldi** (sürümlü 93; `clericFeatureProblem`).
- A13 / D6 Turned Undead olabildiğince uzaklaşır: **düzeldi** (sürümlü 93; etkide `command: 'flee'` kalıcı, Dash'siz, tur başında `compelEvents`; Incapacitated eylem yapamaz).
- A14 Cleric Incapacitated olunca / düşünce / ölünce Turn Undead biter: **düzeldi** (sürümlü 93; `ActiveEffect.endsIfSourceDown`, `pruneEffects`). Sear Undead hasarı aynen; Frightened bağışıklığı ve tür (A12, A15) daha önce kapanmıştı, Sear Undead aynı hedef listesini (`undeadInRange`) kullanıyor (test: 5. seviye Sear hasarı).
- A20 Improved Potent Spellcasting yalnız hasar verince: **düzeldi** (sürümlü 93).
- A21 Divine Intervention herhangi bir Cleric büyüsü (≤ 5, tepki değil), hazırlanmamış da: **düzeldi** (sürümlü 93; veri `freeSpellList.anyFromList`, `src/battle/anyList.ts`; arayüzde ana menü "Divine Intervention (hazırlanmamış büyü)"; yalnız oyuncu isteğiyle slotsuz; yapay zekâ değişmedi: son çare, hazırlananla).
- A23 / C3 Greater Divine Intervention: Wish'ten sonra 2d4 uzun dinlenme: **düzeldi** (savaşta sürümlü 93: `<kaynak>:bekle` kaydı; dinlenme sürümsüz: `CharacterStatus.waits`, `longRestStatus`; veri `ResourceDef.wait`).
- A24 / A25 Disciple of Life Mass Heal yolunda (iyileşen her yaratığa 2 + slot, havuz dışı, tam canı aşmaz), Blessed Healer Mass Heal ve Power Word Heal'de, yalnız gerçekten iyileşen (canı eksik) başka hedefte: **düzeldi** (sürümlü 93; alt sınıf: bizim sürüm metniyle motor uyumu). Power Word Heal "bütün HP" verdiği için Disciple of Life'ın ek HP'si orada etkisiz (tam can).
- Dokunulmayanlar (bilinçli sapma, kullanıcı kararı): A3, A11, A18, A26, E5; E2 (TR kısa menü adları ↔ SD4) karar bekliyor.
