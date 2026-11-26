# Eksik taraması (gece kuyruğu Aşama 6)

`python3 scripts/eksik-tarama.py` üretir (salt okuma; elle bölümler `scripts/eksik-tarama-elle.md`). Kural sürümü 103, `birlesik`.

## Yöntem

Kaynaklar: `harita/belgeler/SRD-KAPSAM.md` (kısmi/yok satırları), `GENEL-SAVAS-DENETIM.md` (durum sütunu kısmi/yok/sapma),
`DECISIONS.md` (ertelendi / doğrulanmadı / karar gerekli satırları), CLAUDE.md "Bilinen eksikler", `BUYU-TAM-TARAMA.md` §4,
`BUYU-KISMI.md`, `PAKET-SIGMAYAN.md`, bütün `harita/belgeler/*-DENETIM.md` tablolarındaki yok/ertelendi/açık satırları. Aynı kaynak +
konu bir kez. **Bayatlık:** satırın konusu gece kuyruğunda ya da önceki görevlerde kapanan bir konu listesine (KARAR101, BUYU-TAM,
KAPSAM103, Ready, dinlenme özellikleri) uyuyor ve satırda "[Gece kuyruğu]" güncellemesi yoksa bayat (bölüm 4); kalanlar güncel
sayıldı (kodla tek tek denenmedi; örnekleme ve kapanış listesi). Sınıflama: "karar gerekli/bekliyor" → bölüm 3, "ertelendi/Serüven
sonrası/tam test turu" → bölüm 2, savaş dışı anahtar sözcükleri → bölüm 6, kalanı bölüm 1. DECISIONS.md eski kayıtları tarih
kaydıdır: bayat satırları kapanmış konuları gösterir, belge düzeltilmedi.

## Sayılar (ölçülmüş)

| Bölüm | Satır |
|---|---:|
| 1. Hâlâ açık ve SRD'de olan | 464 |
| 2. Bilinçli ertelenen | 126 |
| 3. Karar gerektiren (otomatik toplanan) | 26 |
| 4. Bayat | 19 |
| 6. Savaş dışı (otomatik toplanan) | 75 |
| **Toplam (tekil kaynak + konu)** | **710** |

## Serüven öncesi mutlaka (en çok 15; elle seçildi)

Ölçüt: Serüven'in her savaşında görülen, SRD'de olan ve oyunu yanlış oynatan açıklar; denge ölçümü gerektirenler işaretli.

> **2026-11-26 belge güncellemesi:** 104–105'te kapanan maddeler "kapandı (sürüm N)" ile işaretlendi; her biri DECISIONS.md'deki karar ve kodda ilgili modül okunarak doğrulandı (test çalıştırılmadı, betik yeniden üretilmedi). Aşağıdaki otomatik bölümler sürüm 103 hâlidir.

1. **Denge yeniden ölçümü (101 `nightVision` varsayılan açık, 103 canavar inisiyatifi):** Kale %32, gece senaryoları ölçülmedi (DENGE.md).
2. **Storm of Vengeance 2–10. tur aşamaları** (BUYU-TAM-TARAMA §4.1): 9. seviye büyü yalnız ilk turunu yapıyor. — **kapandı (sürüm 104; DECISIONS KARAR104 A1; `stormStage.ts`)**
3. **Yapışma eki** (Stirge, Darkmantle, Cloaker; KAPSAM103): erken seviye düşmanlardan Stirge sık; yapışık kalıp her tur hasar yok. — **kapandı (sürüm 104; DECISIONS KARAR104 A2; `attach.ts`)**
4. **Boğulma / "nefes alamaz"** (Rug of Smothering, Water Elemental Whelm, Gelatinous Cube Engulf): tek `noBreath` etkisi. — **kapandı (sürüm 104; DECISIONS KARAR104 A3; `underwater.ts` `smothered`)**
5. **Likantrop laneti** (5 canavar): 0 HP'de canavara dönüşme; en azından savaş sonu "lanetli" işareti. — **kapandı (sürüm 104; DECISIONS KARAR104 A4 + KARAR104-KALAN; `lycanthrope.ts`: lanet, 0 HP'de Game Master'ın tarafında 10 HP'li canavar)**
6. **Eşya ↔ silah bağı** (Weapon +N, Flame Tongue, Javelin of Lightning; TE99 K-D2, KARAR101 5e): büyülü silah bonusu hangi silaha. — **kapandı (sürüm 104; DECISIONS KARAR104 A10; `rules/itemBinding.ts`, `data/esya-silah-bagi.json`; Javelin of Lightning TE99 yolunda)**
7. **Yapay zekâ Ready ve Dash dengesi** (GENEL-SAVAS-DENETIM A27, A45): YZ Ready kullanmıyor. — **açık** (`ai.ts`'te Ready yok; R3)
8. **Ready yanıt listesi** (A23): yalnız tek saldırı / hareket / büyü; Utilize, Help, Dash yanıtı yok. — **kapandı (sürüm 104; DECISIONS KARAR104-KALAN A9; `data/hazirla.json` `surum: 104`, `readyResponsesFor`)**; tetik yorumu kısmi kalır
9. **0 HP'de uzun dinlenme** (G6/D21; bilinçli sapma): Serüven bozgun akışı SRD'den sapıyor. — **kapandı (sürüm 104; DECISIONS KARAR104 A11 + KARAR104-KALAN; `characterRest.ts` `zeroHp`, `zeroHpWakeHours`; Kolay ev kuralı)**
10. **Unconscious eşya düşürme** (B40): YZ'nin yerden silah alması gerekiyor. — **kapandı (sürüm 104; DECISIONS KARAR104-KALAN A7; `heldItems.ts` `unconsciousDropEvents`, `ownDroppedNear`)**
11. **Oyuncu seçimleri yerine otomatik seçimler** (Preserve Life, Land's Aid, Sculpt Spells, Superior Hunter's Prey, Intimidating
    Presence; Stroke of Luck, Peerless Aim): `askChoice` kalıbıyla. — **kapandı (sürüm 104; DECISIONS KARAR104 A5; `rules/choice.ts` `askPicks`; Peerless Aim 99'dan beri soruyor)**
12. **Cutting Words ıskada, Dark One's Own Luck** (Bard/Warlock tepki zamanlaması). — **kapandı (sürüm 104; DECISIONS KARAR104-KALAN A6; `spells.ts` `cuttingWordsDamage` ıskada, `ExtraDie.spendAlways`)**
13. **Maliyetli materyal** (Revivify 300 GP …): Serüven ekonomisiyle doğrudan ilgili. — **açık** (DECISIONS'ta karar yok)
14. **Çoklu sınıf kararı** (Multiclassing): Serüven seviye atlamasında soru çıkacak. — **kapandı (sürüm 105; DECISIONS MC1–MC5; `mc3Surum.ts`, savaş kaydı 27)**; uygulama sonrası SRD s. 24–26 denetimi `harita/belgeler/MC-SRD-DENETIM.md` (SRD-TAMAMLAMA-1, 2026-11-26: kesin sapma yok; SRD-TAMAMLAMA-2 sonrası 4 kısmi)
15. **"Var-test edilmiş" sınama açığı:** örneklemde satırların ≈ %42'si kuralı gerçekten sınıyor (SRD-KAPSAM Aşama 5 notu); Serüven
    öncesi tam test turunda yüzeysel testler kural testine çevrilmeli.

## Bölüm 3 (elle): karar gerektiren sorular ve öneriler (16)

1. **Knocking Out bitişi:** bayıltılan savaş sonunda yenilmiş sayılıyor (KARAR101). Serüven'de esir alma / sorgu olacak mı? Öneri: şimdilik
   yenilmiş; esir alma Serüven olayı olarak ayrı görev.
2. **Eşyayı silaha bağlama** (KARAR101 5e): oluşturucuda eşyaya silah seçimi mi, ilk uygun silah varsayılanı mı? Öneri: donanım adımında
   seçim, varsayılan ana silah.
3. **Storm of Vengeance aşamaları** (BUYU-TAM §4.1): alan tetikleyicisine aşama sayacı eklensin mi? Öneri: evet, sürüm 104+.
4. **Savaş dışı süreler** (Light 1 saat, Find Familiar, Animate Dead 24 saat): Serüven zaman modeline bağlansın mı? Öneri: saat/gün
   alanı gelince.
5. **Eşya büyüleri** (Dispel Magic nesnede, Remove Curse eşya bağı): eşya örneği şeması? Öneri: 2 ile birlikte.
6. **Wish serbest dilek:** Game Master'da kalsın mı? Öneri: kalsın (sapma kayıtlı).
7. **Maliyetli materyal (GP):** büyüler materyalsiz mi kalsın, envanter denetimi mi? Öneri: Serüven dükkânı + `components.costGp`.
8. **Yapışma / likantropi / boğulma** (KAPSAM103): yeni "bağlı yaratık" sistemi + `noBreath` etkisi + 0 HP biçim değişimi; kapsam
   onayı? Öneri: üçü tek görev, sürüm 104+.
9. **0 HP uzun dinlenme** (G6): Serüven bozgun akışı SRD'ye dönsün mü (1d4 saat sonra 1 HP)? Öneri: Kolay'da ev kuralı, Normal'de SRD.
10. **YZ Dash/Ready denge** (A45, A27): YZ Ready kullansın mı? Öneri: yalnız menzilli bekleyen düşmanlar, ölçümle.
11. **Unconscious eşya düşürme** (B40): YZ yerden silah alsın mı? Öneri: evet, `pick_up` adayı, sonra kuralı aç.
12. **Monk Stunning Strike zamanı** (K2): "bu tur son vurulan hedef" yorumu kalsın mı? Öneri: kalsın, isabet anı istemi sonra.
13. **Bard ilham zarını seçerek atma** (K1), **Stroke of Luck istemi** (C): oyuncuya sorulsun mu? Öneri: tepki ayarındaki "Sor" ile.
14. **Swarm'ın başka yaratığın altıgeninde durması** (SWARM95): doluluk kuralı genişlesin mi? Öneri: SRD metni net; uygula.
15. **Çoklu sınıf** (SRD s. 24–25): kapsam? Öneri: Serüven sonrası, oluşturucu + `classes[]` şeması.
16. **Dash kip seçimi** (KARAR101 ⚠): uçan yaratık yürüme kipi seçebilsin mi? Öneri: hareket kipinin arayüzü gelince.

## Bölüm 5: doğrulama probe listesi (14; gece kuyruğunda ⚠ ya da "doğrulanmadı" kalanlar)

| Probe | Ne denenir | Kaynak |
|---|---|---|
| P1 | Knocking Out sonrası savaş sonu: tek ayakta düşman bayıltılınca `battle_finished` parti; Serüven akışı | KARAR101 |
| P2 | Dash + Fly (Dash'ten sonra Fly yapılırsa) bütçesi arayüzde doğru gösteriliyor mu | KARAR101 ⚠ |
| P3 | Kalkan çıkaran Monk/Barbarian'ın Unarmored Defense'i (yeniden türetilmiyor) | KARAR101 ⚠ |
| P4 | Yakalama tutan oyuncunun fırsat saldırısında Two-Handed seçeneği reddi ve Versatile tek el | KARAR101 |
| P5 | Stone's Endurance alan/zemin hasarında tepki istemi ve Giant Ancestry kullanımı | KARAR101 |
| P6 | `nightVision` açıkken gece haritalarında YZ hedef seçimi (görmediği hedef) ve kilitlenme | KARAR101 |
| P7 | Etherealness ile Ethereal'e geçen dostun tur sonu dönüşü (süre, hedef alınmazlık) | BUYU-TAM |
| P8 | Earthquake'te büyücünün kendi konsantrasyonu (alan içindeyken) | BUYU-TAM |
| P9 | Mass Cure Wounds arayüz seçicisi kürede olmayan hedefi gri gösteriyor mu | BUYU-TAM |
| P10 | 103 inisiyatifiyle boss savaşları (`sim:boss`) ve efsanevi eylem sırası | KAPSAM103 |
| P11 | Weakening Breath'in Multiattack'ta Rend yerine geçmesi (YZ planı) | KAPSAM103 |
| P12 | Weight of Years "sonraki turunun başına dek bir kez" (`legendaryUsed` sıfırlanması) | KAPSAM103 ⚠ |
| P13 | Empowered Evocation: Magic Initiate ile alınan Wizard dışı Evocation büyüsünde ek yok | KAPSAM103 |
| P14 | "var-test edilmiş" satırlarından 30'luk ikinci örneklem (Aşama 5 oranının güveni) | Aşama 5 |

## Bölüm 6 (elle): savaş dışı SRD sistemleri ve tasarım adımları (12)

| Sistem | SRD | Önerilen tasarım adımı |
|---|---|---|
| Çoklu sınıf | s. 24–25 | `CharacterSheet.classes[]` (sınıf + seviye), ilerleme ve slot birleştirme `rules/multiclass.ts`, oluşturucuda ön koşul (13 puan) |
| Diller | s. 20, 83 | `languages[]` geçmiş/tür kaynağından; savaşta Command/Suggestion "anlamalı" denetimi |
| Araçlar | s. 93–94 | TE99 `toolProfs` genişlet: alet kontrolü komutu (`tool_check`), Serüven sınavlarında |
| Zehirler | s. 199–200 | `data/zehirler.json` (14 örnek), `use.kind: coat` (Basic Poison yolu), hasat kontrolü savaş dışı |
| Tuzaklar | s. 196–199 | Harita `traps` şeması (algı/etkisizleştirme DC, tetik, etki); 8 örnek tuzak veriyle |
| Eşya yapımı | s. 203–204 | Serüven dükkânı + zaman modeli; tarif tablosu `data/yapim.json` |
| Influence eylemi / tutumlar | s. 10, 185 | NPC tutumu (Friendly/Indifferent/Hostile) yerleşim verisinde; Influence kontrolü Serüven olayı |
| Lanetli yaratıklar / lanetler | s. 203, canavarlar | `curse` etkisi kalıcı (savaş sonu karaktere), Remove Curse; likantropi bununla |
| Çevre tehlikeleri | s. 201–202 (Extreme Cold/Heat, Mental Stress) | Harita kuralı (`coldExposure` kalıbı) ve Serüven günlük kontrolü |
| High Elf cantrip değiştirme | s. 84 | Uzun dinlenmede soy cantrip seçimi (`characterRest.ts` + oluşturucu) |
| Human/Tiefling boyut seçimi | s. 84–86 | Oluşturucuda Small/Medium seçimi (`sheet.size`), jeton ölçeği yalnız görsel |
| Başlangıç donanımı seçimi | s. 21, sınıf tabloları | Sınıf/geçmiş A/B paketleri `data/baslangic-donanim.json`, sihirbazın donanım adımında |


## 1. Hâlâ açık ve SRD'de olan (otomatik)

| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |
|---|---|---|---|---|
| SRD-KAPSAM Oynama kuralları s. 7 | D20 Tests: Saving Throws | kısmi | güncel (kapanış kaydı yok) | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı…; isteyerek başarısız olma ve yeteneği olmayan otomatik başarısızlık |
| SRD-KAPSAM Oynama kuralları s. 11 | Exploration: Vision and Light (parlak/loş/karanlık, örtü, duyular) | kısmi | güncel (kapanış kaydı yok) | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır…; H4 bilinçli sapma: Gece dışarısı karanlıktır; H12 kısmi: Görülmeyen hedef ya da saldıran (ışık yönü): dezava |
| SRD-KAPSAM Oynama kuralları s. 11 | Exploration: Hiding | kısmi | güncel (kapanış kaydı yok) | A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A18 bilinçli sapma: Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileş… |
| SRD-KAPSAM Oynama kuralları s. 11 | Exploration: Interacting with Objects (turda bir serbest etkileşim) | kısmi | güncel (kapanış kaydı yok) | A32 kısmi: Turda bir serbest nesne etkileşimi; ikincisi Utilize |
| SRD-KAPSAM Oynama kuralları s. 12 | Exploration: Hazards (yanma, düşme, boğulma, susuzluk, açlık) | kısmi | güncel (kapanış kaydı yok) | Dehydration ve Malnutrition yok |
| SRD-KAPSAM Oynama kuralları s. 14 | Combat: Making an Attack (hedef, görünmeyen hedef, değiştiriciler) | kısmi | güncel (kapanış kaydı yok) | C10 kısmi: Yeri tahmin edilen hedefe saldırı yapılabilir; hedef orada değilse ısk…; C11 bilinçli sapma: Karanlıktaki (görülmeyen) saldıran ya da hedef |
| SRD-KAPSAM Oynama kuralları s. 15 | Combat: Melee Attacks (erişim, fırsat saldırısı, Unarmed Strike) | kısmi | güncel (kapanış kaydı yok) | C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … |
| SRD-KAPSAM Oynama kuralları s. 16 | Damage Rolls (çok hedefte tek zar, aynı tür parçalar) | kısmi | güncel (kapanış kaydı yok) | D9 kısmi: Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) |
| SRD-KAPSAM Oynama kuralları s. 16 | Critical Hits | kısmi | güncel (kapanış kaydı yok) | C5 kısmi: Genişletilmiş kritik aralığı (Improved Critical "can score a Critical … |
| SRD-KAPSAM Oynama kuralları s. 17 | Immunity (hasar ve durum) | kısmi | güncel (kapanış kaydı yok) | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| SRD-KAPSAM Oynama kuralları s. 17 | Death Saving Throws ve stabilize | kısmi | güncel (kapanış kaydı yok) | D18 kısmi: Stabilize: Help eylemi + DC 10 WIS (Medicine); D21 kısmi: İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kı… |
| SRD-KAPSAM Oynama kuralları s. 18 | Temporary Hit Points | kısmi | güncel (kapanış kaydı yok) | D26 kısmi: Geçici HP tükenene ya da uzun dinlenmeye dek sürer |
| SRD-KAPSAM Karakter oluşturma s. 24 | Starting at Higher Levels: başlangıç donanımı tablosu (seviyeye göre altın ve sihirli eşya | yok | güncel (kapanış kaydı yok) | seviye kademesine göre ek altın/sihirli eşya önerisi |
| SRD-KAPSAM Sınıflar s. 28 | Barbarian: Çekirdek özellikler (1. sv) | kısmi | güncel (kapanış kaydı yok) | Başlangıç ekipmanı A/B yok: öneri Greataxe + Handaxe (4 Handaxe, Explorer's Pack, 15 GP / B: 75 GP yok; genel SD3); Ekipman paketi A/B seçimi ya da öneriyi SRD A seçeneğine eşitle (genel SD3 kararı) |
| SRD-KAPSAM Sınıflar s. 29 | Barbarian: Instinctive Pounce (7. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: yarım hız ek hareket turun herhangi bir anında (SRD: Rage'in Bonus Action'ının parçası; DECISIONS 4741) |
| SRD-KAPSAM Sınıflar s. 29 | Barbarian: Brutal Strike (9. sv) | kısmi | güncel (kapanış kaydı yok) | Forceful Blow sonrası yarım hız takip yürüyüşü yok; iki Barbarian'ın Hamstring'i üst üste biner (A20); YZ: yalnız Forceful/Hamstring (D4); Arayüz: kutular Reckless yokken de görünür (E5); Brutal sonra |
| SRD-KAPSAM Sınıflar s. 30 | Barbarian / alt sınıf: Retaliation (Path of the Berserker) (10. sv) | kısmi | güncel (kapanış kaydı yok) | Alan/aura bölgesi hasarında (Spirit Guardians vb.) tetiklenmez (ortak tepki kısıtı, CLAUDE.md "Tepkiler"; denetim tam saymış); Bölge/aura hasarında kaynağı 5 ft içindeyse tepki önerisi (Hellish Rebuke |
| SRD-KAPSAM Sınıflar s. 31 | Bard: Bardic Inspiration (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: yalnız ayakta dosta verilir (SRD "another creature"; A3, DECISIONS 5808); zar savaşlar arası taşınmaz (SRD 1 saat; C5, B98 kullanıcı kararı) |
| SRD-KAPSAM Sınıflar s. 32 | Bard: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (seviye başına 1 cantrip + 1 hazır büyü sınırı yok; B11); Serüven'de SRD penceresi (B94) |
| SRD-KAPSAM Sınıflar s. 32 | Bard: Jack of All Trades (2. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: inisiyatife de yarım yetkinlik ekler (SRD: inisiyatif ham DEX kontrolü, beceri değil; A12, DECISIONS 5809); İnisiyatiften çıkarmayı değerlendir (öneri 8; kural sürümü gerekir) |
| SRD-KAPSAM Sınıflar s. 32 | Bard: Font of Inspiration (5. sv) | kısmi | güncel (kapanış kaydı yok) | Harcanacak slot seçilemez, hep en düşük; eylemsiz geri kazanım ayrı adım değil, verme ile birleşik (A9); YZ: slotla ilham vermez (D2); Slot seçici (arayüz + komutta isteğe bağlı slot seviyesi) |
| SRD-KAPSAM Sınıflar s. 35 | Bard / alt sınıf: Bonus Proficiencies (College of Lore) (3. sv) | kısmi | güncel (kapanış kaydı yok) | Serüven'de 3. seviyede 3 ek beceri eklenemez: seçim kipinde beceri alanı yok (`levelChoices.ts` `CHOICE_FIELDS`; kod okuması, Barbarian C6 ile aynı; Bard denetiminde yazılmamış); Seçim kipinde eksik b |
| SRD-KAPSAM Sınıflar s. 36 | Cleric: Çekirdek özellikler (1. sv) | kısmi | güncel (kapanış kaydı yok) | Ekipman: öneri Chain Shirt + Shield + Mace; Holy Symbol, Priest's Pack, 7 GP ve B seçeneği (110 GP) yok (genel SD3; denetim tam saymış); Genel ekipman paketi kararı (SD3) |
| SRD-KAPSAM Sınıflar s. 36 | Cleric: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (Bard B11 ile aynı karar); Serüven'de SRD penceresi (B93); Holy Symbol odağı takip edilmez (etkisiz) |
| SRD-KAPSAM Sınıflar s. 37 | Cleric: Divine Order (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Thaumaturge'ün Arcana/Religion WIS bonusu yok (beceri kontrolü sistemi yok; A3, DECISIONS 4609); Beceri/kontrol sistemi gelince uygula |
| SRD-KAPSAM Sınıflar s. 37 | Cleric: Channel Divinity (Divine Spark, Turn Undead) (2. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Turn Undead menzildeki bütün düşman Undead'i etkiler, alt küme seçilmez (A11, kullanıcı kararı); YZ: Divine Spark yalnız düşmüş dostu kaldırmak için (D3) |
| SRD-KAPSAM Sınıflar s. 38 | Cleric: Blessed Strikes (7. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Potent Spellcasting bütün hasar cantrip'lerine (Cleric listesi ayrımı yok; A18, DECISIONS 4613); Divine Strike hasar türü otomatik (hedefe iyi işleyen); `spell.classes` ∋ `Clr` süzgeci |
| SRD-KAPSAM Sınıflar s. 38 | Cleric: Improved Blessed Strikes (14. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Potent'te Cleric listesi ayrımı yok (A18); geçici HP alıcısı otomatik (en yaralı; SRD: kendin ya da 60 ft'te seçtiğin yaratık) (A20); Alıcı seçimi (arayüz) ve liste süzgeci kararı |
| SRD-KAPSAM Sınıflar s. 40 | Cleric / alt sınıf: Preserve Life (Life Domain) (3. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: iyileştirme bölüşümü otomatik (en yaralıdan), oyuncu dağıtamaz (A26, kullanıcı kararı); Bölüşüm arayüzü (öneri 9; YZ otomatik kalır) |
| SRD-KAPSAM Sınıflar s. 41 | Druid: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (B12; Serüven'de SRD penceresi B94); Druidic Focus/bileşen takibi yok (etkisiz, B13) |
| SRD-KAPSAM Sınıflar s. 43 | Druid: Elemental Fury (7. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Potent bütün hasar cantrip'lerine (Druid listesi ayrımı yok; A9); Primal Strike türü otomatik (A12); Produce Flame fırlatmasına Potent doğrulanmadı; `spell.classes` ∋ `Drd` süzgeci (ön |
| SRD-KAPSAM Sınıflar s. 46 | Druid / alt sınıf: Land's Aid (Circle of the Land) (3. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: iyileşen yaratık otomatik (en yaralı; SRD: seçtiğin; A23); İyileşen yaratık seçimi (komutta isteğe bağlı alan; öneri 9) |
| SRD-KAPSAM Sınıflar s. 46 | Druid / alt sınıf: Natural Recovery (Circle of the Land) (6. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven/yolculuk kısa dinlenmesinde slotlar otomatik, en yüksekten (A25; karakter listesinde seçilir/ertelenir, B93 ortak); YZ: slotsuz büyü kullanımı doğrulanmadı (D4); Serüven kısa d |
| SRD-KAPSAM Sınıflar s. 46 | Druid / alt sınıf: Nature's Sanctuary (Circle of the Land) (14. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: 15 ft küp yaklaşık 7 altıgen (merkez + 6 komşu; A29) |
| SRD-KAPSAM Sınıflar s. 47 | Fighter: Fighting Style (1. sv) | kısmi | güncel (kapanış kaydı yok) | Oluşturucu: Defense önerisi yok, boş Fighting Style yuvası sorun sayılmaz (B3). Bilinçli sapma: karakter listesinde seviye başına bir değişim sınırı yok (B4); Serüven'de seviyede 1 değişim (B95); Yeni |
| SRD-KAPSAM Sınıflar s. 48 | Fighter: Weapon Mastery (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: Cleave ikinci hedefi otomatik (en az HP), atlanamaz (A15, K2). Push seçimsiz yakın dövüşte yalnız eylemin son saldırısında; seçim pushChoice anahtarıyla (5 ft TE99); Cleave ikinci hede |
| SRD-KAPSAM Sınıflar s. 48 | Fighter: Tactical Mind (2. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: oyuncuya sorulmadan kendiliğinden kullanılır (SRD "can"; DECISIONS 6390, K1). Tutmazsa kaynak harcanmaz (SRD ile aynı); İkinci şansları oyuncuya sorma kararı (K1; Stroke of Luck ile or |
| SRD-KAPSAM Sınıflar s. 48 | Fighter: Indomitable (9. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: kendiliğinden kullanılır, oyuncuya sorulmaz (A10, K1). Champion'da sınırlı Indomitable her tur dolan Heroic Inspiration'dan önce harcanır (A29); Yenilenen ikinci şansı önce dene (öneri |
| SRD-KAPSAM Sınıflar s. 49 | Fighter / alt sınıf: Remarkable Athlete (3. sv) | kısmi | güncel (kapanış kaydı yok) | Başkasının turundaki kritikte (fırsat saldırısı) yarı hız kayması yazılır ama kullanılamadan kendi tur başında kaybolur (A27); Kaymayı o an iste (NeedReaction yolu) ya da DECISIONS'a bilinçli sapma ya |
| SRD-KAPSAM Sınıflar s. 49 | Fighter / alt sınıf: Additional Fighting Style (7. sv) | kısmi | güncel (kapanış kaydı yok) | Yaklaşık: Serüven'de `stil` iki Fighting Style yuvasını birlikte sayar, ek yuva da seviye başına değişime girer (B95 notu); 7. seviye ikinci yuva için kalıcı test |
| SRD-KAPSAM Sınıflar s. 49 | Fighter / alt sınıf: Heroic Warrior (10. sv) | kısmi | güncel (kapanış kaydı yok) | Save'de önce sınırlı Indomitable harcanır, tutmazsa Heroic Inspiration denenmez (A29). TE99'dan beri kullanım oyuncuya sorulur (Sor/Her zaman/Asla); İkinci şans sırası: her tur dolan kaynak önce (öner |
| SRD-KAPSAM Sınıflar s. 50 | Monk: Martial Arts (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bonus vuruş Monk silahı dışı silah taşırken de açık (A5; eldeki eşya modeli yok, karar K1). Fırlatılan Monk silahında DEX ve Martial Arts zarı yok (A6). Grapple/Shove DEX DC'si yalnız probe ile; A6: f |
| SRD-KAPSAM Sınıflar s. 51 | Monk: Acrobatic Movement (9. sv) | kısmi | güncel (kapanış kaydı yok) | Tur ayrımı yok: dikey yüzey ve sıvı üstünde yürüme başkasının turunda ve tur sonunda da sürer (SRD: yalnız kendi turunda); Sıvı üstü yürümeyi kendi turuna sınırla + test (öneri 11, sürüm) |
| SRD-KAPSAM Sınıflar s. 51 | Monk: Heightened Focus (10. sv) | kısmi | güncel (kapanış kaydı yok) | Step of the Wind ile 5 ft içindeki gönüllü Large/küçük yaratığı taşıma yok (A14, bilinen); Dost taşıma (öneri 10, sürüm) |
| SRD-KAPSAM Sınıflar s. 52 | Monk: Self-Restoration (10. sv) | kısmi | güncel (kapanış kaydı yok) | Yaklaşık: kalkan durum listedeki ilk (Charmed, Frightened, Poisoned), oyuncu seçmez. Açlık/susuzluk Exhaustion kısmı yok (açlık sistemi yok; bilinçli sapma C6) |
| SRD-KAPSAM Sınıflar s. 52 | Monk / alt sınıf: Wholeness of Body (6. sv) | kısmi | güncel (kapanış kaydı yok) | WIS negatifken eklenmiyor (fikstür: zar + WIS, en az 1 HP) (A34). YZ: kullanmaz (D5); roll + WIS, en az 1 (öneri 9, sürüm) |
| SRD-KAPSAM Sınıflar s. 52 | Monk / alt sınıf: Quivering Palm (17. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: titreşimi bitirmek ayrı eylem (SRD: Attack eyleminde bir saldırının yerine; fikstür notu da eylem) (A37). YZ: kurmaz ve bitirmez (D6) |
| SRD-KAPSAM Sınıflar s. 53 | Paladin: Çekirdek özellikler (1. sv) | kısmi | güncel (kapanış kaydı yok) | Başlangıç ekipmanı A/B paket seçimi yok: öneri + serbest donanım (genel, SD3; denetim B7 "tam" saymış); Başlangıç donanımı paket/altın seçimi (genel) |
| SRD-KAPSAM Sınıflar s. 54 | Paladin: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma (genel): karakter listesinde hazır büyü değişimi dinlenme şartsız serbest (B11); Serüven'de uzun dinlenmede 1 (B94) |
| SRD-KAPSAM Sınıflar s. 54 | Paladin: Weapon Mastery (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma (genel): karakter listesinde değişim dinlenme şartsız (B11); Cleave ikinci hedefi otomatik (FIGHTER-DENETIM A15) |
| SRD-KAPSAM Sınıflar s. 54 | Paladin: Fighting Style (2. sv) | kısmi | güncel (kapanış kaydı yok) | Oluşturucuda Blessed Warrior cantrip'inin seviye başına 1 değişim sınırı doğrulanmadı (B9); Serüven'de uygulanıyor (B94); Oluşturucu kuralını doğrula ve teste bağla |
| SRD-KAPSAM Sınıflar s. 55 | Paladin: Abjure Foes (9. sv) | kısmi | güncel (kapanış kaydı yok) | Hedef seçimi: yalnız ilk hedef komuttan, kalanı otomatik (en çok HP); yalnız düşman; Bütün hedefleri oyuncu seçsin (öneri 5 kalan kısmı) |
| SRD-KAPSAM Sınıflar s. 55 | Paladin: Aura of Courage (10. sv) | kısmi | güncel (kapanış kaydı yok) | Aura mesafesi 2B (3B auraDist kullanılmıyor; dikey ve kat döşemesi ayrımı yok); auraDist'e bağla (öneri 8 kalan kısmı, sürüm) |
| SRD-KAPSAM Sınıflar s. 55 | Paladin: Restoring Touch (14. sv) | kısmi | güncel (kapanış kaydı yok) | Durumlar seçilemez: havuz yettikçe sırayla hepsi kalkar (motor ve arayüz; E2); Durum seçici (öneri 7 kalan kısmı) |
| SRD-KAPSAM Sınıflar s. 56 | Paladin / alt sınıf: Oath of Devotion Spells (3. sv) | kısmi | güncel (kapanış kaydı yok) | Fikstürde 9/13/17. seviye büyüleri (Beacon of Hope, Dispel Magic, Freedom of Movement, Guardian of Faith, Commune, Flame Strike) yok; gerçek pakette doğrulanmadı (B94: kullanıcı kararı, ölçüt paket);  |
| SRD-KAPSAM Sınıflar s. 56 | Paladin / alt sınıf: Aura of Devotion (7. sv) | kısmi | güncel (kapanış kaydı yok) | Aura mesafesi 2B (Aura of Courage ile aynı kod yolu; 3B auraDist yok); auraDist'e bağla (sürüm) |
| SRD-KAPSAM Sınıflar s. 57 | Ranger: Çekirdek özellikler (1. sv) | kısmi | güncel (kapanış kaydı yok) | Başlangıç ekipmanı A/B paket seçimi yok: öneri + serbest donanım (genel, SD3); Başlangıç donanımı paket/altın seçimi (genel) |
| SRD-KAPSAM Sınıflar s. 57 | Ranger: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma (genel, PALADIN-DENETIM B11 ile aynı): karakter listesinde hazır büyü değişimi dinlenme şartsız; Serüven'de uzun dinlenmede 1 (B94) |
| SRD-KAPSAM Sınıflar s. 58 | Ranger: Weapon Mastery (1. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: Cleave ikinci hedefi otomatik (FIGHTER-DENETIM A15); karakter listesinde değişim dinlenme şartsız (genel) |
| SRD-KAPSAM Sınıflar s. 59 | Ranger: Fighting Style (2. sv) | kısmi | güncel (kapanış kaydı yok) | Bilinçli sapma: oluşturucuda Druidic Warrior cantrip değişimi seviye başına sınırsız (B8); Serüven'de seviyede 1 (B94) |
| SRD-KAPSAM Sınıflar s. 59 | Ranger: Roving (6. sv) | kısmi | güncel (kapanış kaydı yok) | Duvar tırmanışı (K68b) ve sığ/derin suda yüzme maliyeti doğrulanmadı; tırmanma/yüzme yalnız featuresK19 anahtarıyla (A13); Tırmanma ve yüzme için test yaz, gerekirse düzelt (öneri 6) |
| SRD-KAPSAM Sınıflar s. 61 | Ranger / alt sınıf: Superior Hunter's Prey (11. sv) | kısmi | güncel (kapanış kaydı yok) | İkinci hedef otomatik (en düşük HP'li düşman), oyuncu seçemez (A25); Komutta isteğe bağlı hedef seçimi (öneri 5) |
| SRD-KAPSAM Sınıflar s. 63 | Rogue: Cunning Strike (5. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Withdraw kayması saldırının hemen ardından değil tur sonuna dek bütçe (A12, K3); Horde Breaker yolunda seçilemez; YZ: yalnız Trip/Withdraw seçer (D7).; K3 kararı (anlık Withdraw); Hord |
| SRD-KAPSAM Sınıflar s. 63 | Rogue: Stroke of Luck (20. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: oyuncuya sorulmaz, ilk başarısız d20 testinde kendiliğinden (A27, K1); ölüm save'ine uygulanmıyor (A29); 20'ye çevrilen saldırı kritik sayılıyor (A28, K4 yorum).; K1/K4 kararı (B98 'as |
| SRD-KAPSAM Sınıflar s. 64 | Rogue / alt sınıf: Supreme Sneak (9. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma (fikstür notu 'yaklaşık'): siper saldırı anında bakılıyor, SRD'de turun sonunda; Arayüz: cunningName'de 'stealth' yok, balonda ham ad (E3).; Tur sonu siper denetimi; cunningName.stealth |
| SRD-KAPSAM Sınıflar s. 64 | Sorcerer: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında cantrip/hazır büyü serbest düzenlenir, 'seviyede bir değişim' yok (S3/S4, K17); Arcane Focus/bileşen savaşta modellenmez (genel).; İsteğe bağlı uyarı (öneri 12) ya da k |
| SRD-KAPSAM Sınıflar s. 65 | Sorcerer: Innate Sorcery (1. sv) | kısmi | güncel (kapanış kaydı yok) | doğrulanmadı: +1 DC'nin tur sonu tekrar save'lerinde de geçerli olması (I4; kod okumasıyla yapım DC'si saklanıyor, test yok).; Hold Person + Innate Sorcery tekrar save DC testi. |
| SRD-KAPSAM Sınıflar s. 66 | Sorcerer: Metamagic (2. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında seçenekler serbest düzenlenir, seviyede bir değişim yok (M0, K17; Serüven'de B93 ile kurallı). Seçenekler ayrı satırlarda. |
| SRD-KAPSAM Sınıflar s. 67 | Sorcerer / seçenek: Extended Spell (2. sv) | kısmi | güncel (kapanış kaydı yok) | Koşul zamanlayıcısıyla süren büyülerde (Hold Person) 1 dk tavanı ikiye katlanmıyor (⚠ B93); YZ: kullanmıyor.; conditionTimers azami süresine Extended çarpanı. |
| SRD-KAPSAM Sınıflar s. 67 | Sorcerer / seçenek: Heightened Spell (2. sv) | kısmi | güncel (kapanış kaydı yok) | Alanda hedef seçilemez (ilk düşman); çok hedefli yapımda (Twinned + Heightened) uygulanmaz, puan gider (M5, bilinen).; Hedef seçimi ve çok hedefli yolda uygulama. |
| SRD-KAPSAM Sınıflar s. 67 | Sorcerer / seçenek: Transmuted Spell (2. sv) | kısmi | güncel (kapanış kaydı yok) | İki hasar türlü büyüde yalnız ana tür değişir; damageType verisi olmayan Fire Shield, Ice Knife, Web seçilemez (28 uygunun 25'i, M9).; Büyü verisine ikinci hasar türü/damageType. |
| SRD-KAPSAM Sınıflar s. 70 | Warlock: Eldritch Invocations (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında serbest düzenleme, 'seviyede bir değişim' yok (B5, K17; Serüven'de B93 ile kurallı). Seçenekler ayrı satırlarda. |
| SRD-KAPSAM Sınıflar s. 72 | Warlock: Mystic Arcanum (11. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: seçilmezse ilk uygun savaş büyüsü otomatik atanır (B12). |
| SRD-KAPSAM Sınıflar s. 74 | Warlock / seçenek: Pact of the Blade (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: silah elde başlar; bonus eylemle çağırma ve büyülü silaha bağlanma yok (A11). |
| SRD-KAPSAM Sınıflar s. 74 | Warlock / seçenek: Repelling Blast (2. sv) | kısmi | güncel (kapanış kaydı yok) | Basitleştirme (denetimde 'tam'): her isabette tam 10 ft, SRD 'en çok 10 ft' mesafe seçimi yok.; Push ustalığındaki mesafe seçimi (pushFeet) deseni. |
| SRD-KAPSAM Sınıflar s. 73 | Warlock / seçenek: Investment of the Chain Master (5. sv) | kısmi | güncel (kapanış kaydı yok) | Direnç tepkisi yalnız isabet hasarında; save'li hasarda sorulmaz (A13, bilinen).; Save'li hasardan önce tepki zinciri. |
| SRD-KAPSAM Sınıflar s. 73 | Warlock / seçenek: Gift of the Protectors (9. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: kitaba ad yazma yok, savaş başında CHA kadar dost otomatik; ilk tetikte hepsi düşer (A21). |
| SRD-KAPSAM Sınıflar s. 73 | Warlock / seçenek: Lifedrinker (9. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: hasar türü hedefe göre otomatik, HP zarı eksik HP yeterse otomatik harcanır (oyuncu seçimi yok; A10). |
| SRD-KAPSAM Sınıflar s. 76 | Warlock / alt sınıf: Fiendish Resilience (10. sv) | kısmi | güncel (kapanış kaydı yok) | Kısa dinlenmede tür değişimi yok (Serüven'de yalnız uzun dinlenme; dışarıda serbest düzenleme, C7 bilinçli).; Kısa dinlenme seçim penceresi (Memorize Spell ile ortak). |
| SRD-KAPSAM Sınıflar s. 76 | Warlock / alt sınıf: Hurl Through Hell (14. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: isabette kendiliğinden (sorulmaz), hedef ortadan kalkmaz, yerinde kalır (F5, D5); Pact slotuyla yenileme yok (F5c; bizim sürüm metninde yok).; Kullanım sorusu ve slotla yenileme kararı |
| SRD-KAPSAM Sınıflar s. 77 | Wizard: Büyü kitabı (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: kopyalama ekonomisi (altın/zaman, parşömenden Arcana DC) ve kitap nesnesi/kaybı yok (B10); kitaba eklemenin seviyesi izlenmez (B12).; Kapsam dışı kararını DECISIONS'a yaz (öneri 11). |
| SRD-KAPSAM Sınıflar s. 77 | Wizard: Spellcasting (1. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: Serüven dışında hazır liste/cantrip dinlenme şartsız serbest düzenlenir (B11, K17); yukarı slot etkisi 8 Wizard büyüsünde yok (A7, büyü denetimi kapsamı). |
| SRD-KAPSAM Sınıflar s. 82 | Wizard / alt sınıf: Sculpt Spells (6. sv) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma: seçim otomatik, yalnız dostlar (büyücü dahil), 'görebildiğin' denetimi yok, yalnız alan yapımında (kalıcı alan/duvar/boncuk tetiklerinde yok) (A18, kullanıcı kararı bekliyor).; Kullanı |
| SRD-KAPSAM Karakter kökenleri s. 83 | Geçmiş kuralı: Geçmişsiz eski kayıt (SRD'de karşılığı yok) | kısmi | güncel (kapanış kaydı yok) | G18 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Karakter kökenleri s. 84 | Tür kuralı: Aasimar (SRD 5.2.1'de yok; ölçülen PDF'te geçmiyor) | kısmi | güncel (kapanış kaydı yok) | T45 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Feat'ler s. 87 | Magic Initiate (Origin) | kısmi | güncel (kapanış kaydı yok) | F19 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Feat'ler s. 87 | Savage Attacker (Origin) | kısmi | güncel (kapanış kaydı yok) | F21 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Feat'ler s. 88 | Feat kuralı: Night Spirit, Merge with Shadows: loşta/karanlıkta bonus eylemle Invisible, e | kısmi | güncel (kapanış kaydı yok) | F36 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Feat'ler s. 88 | Feat kuralı: Night Spirit, Shadowy Form: loşta/karanlıkta Psychic/Radiant dışı direnç | kısmi | güncel (kapanış kaydı yok) | F37 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 89 | Coins (CP, SP, EP, GP, PP ve kur) | kısmi | güncel (kapanış kaydı yok) | yalnız GP; diğer sikkeler ve çevrim yok |
| SRD-KAPSAM Donanım s. 91 | Silah: Dagger (1d4 Piercing; Finesse, Light, Thrown (Range 20/60); ustalık Nick) | kısmi | güncel (kapanış kaydı yok) | S13 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 183 | Silah kuralı: Nesne fırlatma ≈ doğaçlama fırlatma | kısmi | güncel (kapanış kaydı yok) | S34 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 92 | Zırh kuralı: Strength cezası her giyene | kısmi | güncel (kapanış kaydı yok) | Z5 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 235 | Donanım kuralı: Potion of Giant Strength (6 tür): STR skoru 1 saat X olur | kısmi | güncel (kapanış kaydı yok) | D8 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 94 | Donanım kuralı: Yapay zekânın eşya kullanması (SRD kuralı değil; oyun) | kısmi | güncel (kapanış kaydı yok) | D38 bilinçli sapma: değişmedi (bilinçli sapma) |
| SRD-KAPSAM Donanım s. 100 | Mounts and Cargo (binek hayvanları, taşıma) | kısmi | güncel (kapanış kaydı yok) | bineği Serüven dükkânında satma; yük hayvanı taşıma kapasitesi |
| SRD-KAPSAM Donanım s. 100 | Barding (binek zırhı) | yok | güncel (kapanış kaydı yok) | bineğe zırh (AC) seçimi |
| SRD-KAPSAM Donanım s. 100 | Saddles (Exotic, Military, Riding; askeri eyerde düşmemeye avantaj) | yok | güncel (kapanış kaydı yok) | Military Saddle avantajı `mounted.ts` düşme save'ine |
| SRD-KAPSAM Donanım s. 101 | Food, Drink, and Lodging | kısmi | güncel (kapanış kaydı yok) | SRD fiyat tablosu (yemek, içki, oda kademesi) yok |
| SRD-KAPSAM Donanım s. 102 | Spellcasting services (büyü hizmeti fiyatları) | kısmi | güncel (kapanış kaydı yok) | SRD seviye başına fiyat tablosu yok |
| SRD-KAPSAM Donanım s. 102 | Magic Items: satın alma ve tanımlama (Identify, kısa dinlenmede inceleme) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma olarak yazılabilir |
| SRD-KAPSAM Büyüler s. 104 | Casting at higher levels (yukarı slot) | kısmi | güncel (kapanış kaydı yok) | UPCAST.md "karar/ayrı iş" satırları |
| SRD-KAPSAM Büyüler s. 105 | Casting Time: Action, Bonus Action, Reaction; turda tek slotlu büyü; uzun döküm süresi | kısmi | güncel (kapanış kaydı yok) | A21 bilinçli sapma: Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon; 1 dakika+ döküm süresi bilinçli sapma (kurulumda/ritüelde) |
| SRD-KAPSAM Büyüler s. 105 | Components: Somatic (boş el) ve Material (odak, fiyatlı/tüketilen malzeme) | kısmi | güncel (kapanış kaydı yok) | S için boş el (el modeli `heldItems.ts`), M için fiyatlı malzeme/odak kontrolü |
| SRD-KAPSAM Büyüler s. 113 | Blindness/Deafness (2. sv, Transmutation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. |
| SRD-KAPSAM Büyüler s. 114 | Call Lightning (3. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Açık gökte fırtınanın içindeyken (harita fırtınası ya da Storm of Vengeance) yeni bulut kurulmaz, fırtına devralınır: şimşek noktası fırtınanın altında, hasar +1d10, taban açık gökteki uç |
| SRD-KAPSAM Büyüler s. 117 | Conjure Animals (3. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |
| SRD-KAPSAM Büyüler s. 118 | Conjure Fey (6. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Ruhun Fey görünüşü yalnızca görsel. |
| SRD-KAPSAM Büyüler s. 119 | Continual Flame (2. sv, Evocation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Nesne yerine yaratık da taşır (SRD: nesne); süre savaş boyunca. |
| SRD-KAPSAM Büyüler s. 122 | Daylight (3. sv, Evocation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur (nesneyle yürümez); Sunlight Sensitivity yalnız parlak alanda. |
| SRD-KAPSAM Büyüler s. 124 | Dispel Magic (3. sv, Abjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. |
| SRD-KAPSAM Büyüler s. 127 | Enlarge/Reduce (2. sv, Transmutation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |
| SRD-KAPSAM Büyüler s. 128 | Entangle (1. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Bitkilerin büyü bitince çekilmesi görseldir; karede zemin zorlu arazi. |
| SRD-KAPSAM Büyüler s. 132 | Flaming Sphere (2. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). |
| SRD-KAPSAM Büyüler s. 133 | Fog Cloud (1. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma Kuyruk 18b rüzgârıyla. |
| SRD-KAPSAM Büyüler s. 140 | Hex (1. sv, Enchantment) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |
| SRD-KAPSAM Büyüler s. 143 | Jump (1. sv, Transmutation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Zıplamanın havadaki yayı; katmansız haritada dikey zıplama yalnız yüksek erişim (yerinde zıplama: bu tur yakın dövüşte dikeyde +30 ft erişim, tavanla sınırlı; havada kalınmaz). |
| SRD-KAPSAM Büyüler s. 144 | Light (cantrip, Evocation) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: 1 saatlik süre savaştan uzun; nesne yerine yaratık da taşır (SRD: nesne). |
| SRD-KAPSAM Büyüler s. 145 | Mage Armor (1. sv, Abjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Zırh giyince bitme: savaşta zırh giyilmez. |
| SRD-KAPSAM Büyüler s. 165 | Stinking Cloud (3. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma yüzey sistemiyle. |
| SRD-KAPSAM Büyüler s. 165 | Storm of Vengeance (9. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | **[Gece kuyruğu]** **[YENİ kırılma değil, yeni bulgu]** 2–10. tur aşamaları yok (`stages` motor tarafından okunmuyor); BUYU-TAM-TARAMA §4.1 |
| SRD-KAPSAM Büyüler s. 174 | Web (2. sv, Conjuration) | kısmi | güncel (kapanış kaydı yok) | kapsam dışı: Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). |
| SRD-KAPSAM Kural sözlüğü s. 177 | Attack [Action] | kısmi | güncel (kapanış kaydı yok) | A4 bilinçli sapma: Attack: saldırıda bir silahı takma/çıkarma |
| SRD-KAPSAM Kural sözlüğü s. 177 | Blinded [Condition] | kısmi | güncel (kapanış kaydı yok) | B7 kısmi: Blinded: görme gerektiren kontrolde otomatik başarısız |
| SRD-KAPSAM Kural sözlüğü s. 178 | Carrying Capacity | kısmi | güncel (kapanış kaydı yok) | F17 kısmi: Taşıma sınırının üstünde sürükleme/kaldırma/itme: Speed en çok 5 ft |
| SRD-KAPSAM Kural sözlüğü s. 178 | Climbing | kısmi | güncel (kapanış kaydı yok) | E14 bilinçli sapma: Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldır… |
| SRD-KAPSAM Kural sözlüğü s. 179 | Climb Speed | kısmi | güncel (kapanış kaydı yok) | E14 bilinçli sapma: Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldır… |
| SRD-KAPSAM Kural sözlüğü s. 179 | Condition | kısmi | güncel (kapanış kaydı yok) | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| SRD-KAPSAM Kural sözlüğü s. 179 | Critical Hit | kısmi | güncel (kapanış kaydı yok) | C5 kısmi: Genişletilmiş kritik aralığı (Improved Critical "can score a Critical … |
| SRD-KAPSAM Kural sözlüğü s. 179 | Curses | kısmi | güncel (kapanış kaydı yok) | lanetli yaratık (likantropi) ve eşya laneti ilkeli yok |
| SRD-KAPSAM Kural sözlüğü s. 180 | Damage Roll | kısmi | güncel (kapanış kaydı yok) | D9 kısmi: Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) |
| SRD-KAPSAM Kural sözlüğü s. 180 | Damage Threshold | yok | güncel (kapanış kaydı yok) | SRD 5.2.1 canavarlarında yok; nesne/araç için |
| SRD-KAPSAM Kural sözlüğü s. 180 | Darkness | kısmi | güncel (kapanış kaydı yok) | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır…; H4 bilinçli sapma: Gece dışarısı karanlıktır |
| SRD-KAPSAM Kural sözlüğü s. 181 | Deafened [Condition] | kısmi | güncel (kapanış kaydı yok) | B11 kısmi: Deafened: duyma gerektiren kontrolde otomatik başarısız |
| SRD-KAPSAM Kural sözlüğü s. 181 | Difficult Terrain | kısmi | güncel (kapanış kaydı yok) | E6 yok: Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayr… |
| SRD-KAPSAM Kural sözlüğü s. 181 | Exhaustion [Condition] | kısmi | güncel (kapanış kaydı yok) | B13 kısmi: Exhaustion: D20 Testi −2 × seviye; F12 kısmi: Exhaustion −2×seviye bütün yetenek kontrollerine |
| SRD-KAPSAM Kural sözlüğü s. 182 | Frightened [Condition] | kısmi | güncel (kapanış kaydı yok) | B16 kısmi: Frightened: kaynak görüş hattındayken saldırıda ve kontrolde dezavanta… |
| SRD-KAPSAM Kural sözlüğü s. 182 | Grappled [Condition] | kısmi | güncel (kapanış kaydı yok) | B20 kısmi: Grappled: yakalayan sürükler, her ft +1 ft; hedef Tiny ya da iki+ boy … |
| SRD-KAPSAM Kural sözlüğü s. 182 | Grappling | kısmi | güncel (kapanış kaydı yok) | B21 kısmi: Grappling: biter: kaçış (Athletics/Acrobatics vs DC), yakalayan Incapa…; C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … **[Gece kuyruğu]** 101: yakalamay |
| SRD-KAPSAM Kural sözlüğü s. 182 | Hazard | kısmi | güncel (kapanış kaydı yok) | Dehydration ve Malnutrition yok |
| SRD-KAPSAM Kural sözlüğü s. 182 | Heavily Obscured | kısmi | güncel (kapanış kaydı yok) | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır… |
| SRD-KAPSAM Kural sözlüğü s. 182 | Help [Action] | kısmi | güncel (kapanış kaydı yok) | A14 yok: Help: Assist an Ability Check; A15 kısmi: Help: ilk yardım / stabilize, DC 10 WIS (Medicine) (s.18, glossary); F20 yok: Help (yetenek kontrolü): müttefikin seçilen beceri kontrolü avantajlı |
| SRD-KAPSAM Kural sözlüğü s. 183 | Heroic Inspiration | kısmi | güncel (kapanış kaydı yok) | F21 kısmi: Heroic Inspiration: herhangi bir zarı hemen yeniden at, yeniyi kullan;… |
| SRD-KAPSAM Kural sözlüğü s. 183 | Hide [Action] | kısmi | güncel (kapanış kaydı yok) | A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A18 bilinçli sapma: Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileş… |
| SRD-KAPSAM Kural sözlüğü s. 183 | Hit Point Dice | kısmi | güncel (kapanış kaydı yok) | G3 kısmi: Her zardan sonra yenisini harcamaya karar verilir |
| SRD-KAPSAM Kural sözlüğü s. 183 | Illusions | kısmi | güncel (kapanış kaydı yok) | fiziksel temasla yanılsamayı fark etme (Study) yok |
| SRD-KAPSAM Kural sözlüğü s. 183 | Immunity | kısmi | güncel (kapanış kaydı yok) | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| SRD-KAPSAM Kural sözlüğü s. 184 | Long Jump | kısmi | güncel (kapanış kaydı yok) | E12 bilinçli sapma: Long Jump alçak engel: Game Master seçeneğiyle DC 10 Athletics |
| SRD-KAPSAM Kural sözlüğü s. 185 | Long Rest | kısmi | güncel (kapanış kaydı yok) | G6 yok: Long Rest başlamak için en az 1 HP; G7 doğrulanmadı: Long Rest: azalan HP en çoğu ve yetenek skorları normale döner; G10 kısmi: Long Rest'ten sonra yenisi için en az 16 saat |
| SRD-KAPSAM Kural sözlüğü s. 185 | Magic [Action] | kısmi | güncel (kapanış kaydı yok) | A21 bilinçli sapma: Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon |
| SRD-KAPSAM Kural sözlüğü s. 185 | Occupied Space | kısmi | güncel (kapanış kaydı yok) | E26 kısmi: Tur başka yaratığın alanında biterse Prone (Tiny ya da daha büyük deği… |
| SRD-KAPSAM Kural sözlüğü s. 186 | Prone [Condition] | kısmi | güncel (kapanış kaydı yok) | B35 yok: Prone: isteğe bağlı yere yatma (Dropping Prone, Speed kuralı); E9 yok: Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz **[Gece kuyruğu]** B35 kapandı: Dropping Prone `drop_prone` (101) |
| SRD-KAPSAM Kural sözlüğü s. 186 | Ready [Action] | kısmi | güncel (kapanış kaydı yok) | A23 kısmi: Ready: yanıt "the action you will take" (her eylem); A24 bilinçli sapma: Ready: tetik "perceivable circumstance"; YZ kullanmaz (A27) |
| SRD-KAPSAM Kural sözlüğü s. 187 | Save | kısmi | güncel (kapanış kaydı yok) | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı… |
| SRD-KAPSAM Kural sözlüğü s. 187 | Saving Throw | kısmi | güncel (kapanış kaydı yok) | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı… |
| SRD-KAPSAM Kural sözlüğü s. 187 | Search [Action] | kısmi | güncel (kapanış kaydı yok) | A29 kısmi: Search: WIS kontrolü (Insight, Medicine, Perception, Survival) |
| SRD-KAPSAM Kural sözlüğü s. 187 | Shape-Shifting | kısmi | güncel (kapanış kaydı yok) | biçimdeki eşya, biçim aurası, YZ kullanımı |
| SRD-KAPSAM Kural sözlüğü s. 187 | Short Rest | kısmi | güncel (kapanış kaydı yok) | G3 kısmi: Her zardan sonra yenisini harcamaya karar verilir; G11 yok: Kesintiler (inisiyatif, cantrip dışı büyü, hasar, 1 saat efor); kesile…; G12 bilinçli sapma: Short Rest sayısında sınır yok (s.16, |
| SRD-KAPSAM Kural sözlüğü s. 187 | Simultaneous Effects | kısmi | güncel (kapanış kaydı yok) | sırayı tur sahibinin seçmesi yok (doğrulanmadı) |
| SRD-KAPSAM Kural sözlüğü s. 188 | Size | kısmi | güncel (kapanış kaydı yok) | E20 bilinçli sapma: Boyut ve alan: Tiny 2½ ft … Gargantuan 20 ft; çok altıgen gövde `multiHex` deneysel |
| SRD-KAPSAM Kural sözlüğü s. 188 | Speed | kısmi | güncel (kapanış kaydı yok) | E3 kısmi: Birden çok hız: hareket sırasında geçiş, gidilen yol yeni hızdan düşül… |
| SRD-KAPSAM Kural sözlüğü s. 188 | Spellcasting Focus | kısmi | güncel (kapanış kaydı yok) | odak/fiyatlı malzeme denetimi yok |
| SRD-KAPSAM Kural sözlüğü s. 188 | Stable | kısmi | güncel (kapanış kaydı yok) | D18 kısmi: Stabilize: Help eylemi + DC 10 WIS (Medicine); D21 kısmi: İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kı… |
| SRD-KAPSAM Kural sözlüğü s. 189 | Study [Action] | kısmi | güncel (kapanış kaydı yok) | A30 kısmi: Study: INT kontrolü |
| SRD-KAPSAM Kural sözlüğü s. 189 | Surprise | kısmi | güncel (kapanış kaydı yok) | savaş başında gizlenen tarafın genel sürpriz kontrolü yok |
| SRD-KAPSAM Kural sözlüğü s. 189 | Swimming | kısmi | güncel (kapanış kaydı yok) | E16 bilinçli sapma: (SRD'de yok) Kıyıdan uzak derin suya yalnızca yüzücü girer |
| SRD-KAPSAM Kural sözlüğü s. 190 | Temporary Hit Points | kısmi | güncel (kapanış kaydı yok) | D26 kısmi: Geçici HP tükenene ya da uzun dinlenmeye dek sürer |
| SRD-KAPSAM Kural sözlüğü s. 190 | Unarmed Strike | kısmi | güncel (kapanış kaydı yok) | C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … |
| SRD-KAPSAM Kural sözlüğü s. 191 | Unconscious [Condition] | kısmi | güncel (kapanış kaydı yok) | B40 yok: Unconscious: elindekini düşürür |
| SRD-KAPSAM Kural sözlüğü s. 191 | Utilize [Action] | kısmi | güncel (kapanış kaydı yok) | A32 kısmi: Turda bir serbest nesne etkileşimi; ikincisi Utilize |
| SRD-KAPSAM Oyun araç kutusu s. 192 | Travel Pace (Fast/Normal/Slow; günlük mil) | kısmi | güncel (kapanış kaydı yok) | tempo seçimi ve etkileri (Fast: Algı −5; Slow: Gizlilik) yok |
| SRD-KAPSAM Oyun araç kutusu s. 192 | Travel Pace: Good Roads, Slower Travelers | kısmi | güncel (kapanış kaydı yok) |  |
| SRD-KAPSAM Oyun araç kutusu s. 192 | Travel Pace: Extended Travel (zorlu yürüyüş, CON save ya da Exhaustion) | yok | güncel (kapanış kaydı yok) | gezintide 8 saat üstü yürüyüş kuralı |
| SRD-KAPSAM Oyun araç kutusu s. 192 | Travel Pace: Special Movement (uçuş, yüzme hızıyla yolculuk) | kısmi | güncel (kapanış kaydı yok) |  |
| SRD-KAPSAM Oyun araç kutusu s. 192 | Travel Pace: Vehicles (gemi tempoları) | kısmi | güncel (kapanış kaydı yok) |  |
| SRD-KAPSAM Oyun araç kutusu s. 193 | Curses: Cursed Creatures (likantropi vb.) | yok | güncel (kapanış kaydı yok) | 0 HP'de taraf değiştirme (allegianceSwap) ya da Serüven laneti |
| SRD-KAPSAM Oyun araç kutusu s. 193 | Curses: Cursed Magic Items | kısmi | güncel (kapanış kaydı yok) | eşya laneti ilkeli |
| SRD-KAPSAM Oyun araç kutusu s. 194 | Magical Contagion: Cackle Fever | yok | güncel (kapanış kaydı yok) | Serüven/dinlenme katmanında hastalık durumu |
| SRD-KAPSAM Oyun araç kutusu s. 194 | Magical Contagion: Sewer Plague | yok | güncel (kapanış kaydı yok) | Serüven/dinlenme katmanında hastalık durumu |
| SRD-KAPSAM Oyun araç kutusu s. 194 | Magical Contagion: Sight Rot | yok | güncel (kapanış kaydı yok) | Serüven/dinlenme katmanında hastalık durumu |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Deep Water (yüzme hızı yoksa her saat DC 10 CON ya da Exhaustion) | kısmi | güncel (kapanış kaydı yok) | saatlik yüzme yorgunluğu yok (savaş süresi kısa) |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Extreme Cold (saatlik CON save, Exhaustion) | kısmi | güncel (kapanış kaydı yok) | saat yerine tur ölçeği |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Extreme Heat (su içmeyen, saatlik CON save) | yok | güncel (kapanış kaydı yok) | çöl/volkan için `heatExposure` harita kuralı |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Frigid Water (dakikalık CON save, Exhaustion) | kısmi | güncel (kapanış kaydı yok) | soğuk suda kalma süresi kuralı |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Heavy Precipitation (Lightly Obscured, Algı dezavantajı, alev söner | kısmi | güncel (kapanış kaydı yok) | açık alevin sönmesi doğrulanmadı |
| SRD-KAPSAM Oyun araç kutusu s. 195 | Environmental Effects: Slippery Ice (DC 10 DEX ya da Prone, zorlu arazi) | kısmi | güncel (kapanış kaydı yok) | doğrulanmadı: buz zeminde DEX save/Prone |
| SRD-KAPSAM Oyun araç kutusu s. 196 | Mental Stress Effects (Psychic hasar + zihinsel stres tablosu) | yok | güncel (kapanış kaydı yok) | Moral'e bağlanabilir |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Harvesting Poison (DC 20 INT (Nature), Poisoner's Kit) | yok | güncel (kapanış kaydı yok) | savaş sonu ganimet adımı |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Assassin's Blood | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Burnt Othur Fumes | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Crawler Mucus | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Essence of Ether | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Malice | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Sample Poison: Midnight Tears | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Oil of Taggit | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Pale Tincture | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Purple Worm Poison | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Serpent Venom | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Spider's Sting | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Torpor | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Truth Serum | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Oyun araç kutusu s. 198 | Sample Poison: Wyvern Poison | yok | güncel (kapanış kaydı yok) | `data/items.json` `use` (save + durum) kalıbıyla |
| SRD-KAPSAM Sihirli eşyalar s. 205 | Magic Item Rarity ve Values by Rarity | kısmi | güncel (kapanış kaydı yok) | doğrulanmadı: fiyatın SRD nadirlik tablosuna uyumu |
| SRD-KAPSAM Sihirli eşyalar s. 206 | Cursed Items | kısmi | güncel (kapanış kaydı yok) | eşya laneti ilkeli |
| SRD-KAPSAM Sihirli eşyalar s. 213 | Berserker Axe — Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: lanet (uyum bozulmaz, kana susama WIS save) — eşya laneti ilkeli yok |
| SRD-KAPSAM Sihirli eşyalar s. 218 | Defender — Legendary | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: silah bonusunu tur başında AC'ye aktarma seçimi — eşya seçim kancası yok |
| SRD-KAPSAM Sihirli eşyalar s. 220 | Energy Bow — Very Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: enerji oku (ok yaratma, menzil seçimi) — eşya saldırı biçimi kancası yok |
| SRD-KAPSAM Sihirli eşyalar s. 224 | Hat of Many Spells — Very Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: rastgele büyü tablosu — eşya büyüsünde rastgele sonuç yok |
| SRD-KAPSAM Sihirli eşyalar s. 227 | Immovable Rod — Uncommon | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: havada sabit nesne — K53 geçici engelini eşyaya bağlama yok |
| SRD-KAPSAM Sihirli eşyalar s. 233 | Nine Lives Stealer — Very Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: anında öldürme (HP ≤ 100, CON save, yük) — eşya isabet kancasında ölüm yok |
| SRD-KAPSAM Sihirli eşyalar s. 237 | Quarterstaff of the Acrobat — Very Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: biçim değiştirme (sırık, yay) ve Acrobatics — eşya biçim kancası yok |
| SRD-KAPSAM Sihirli eşyalar s. 241 | Rod of Absorption — Very Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: büyüyü tepkiyle emme, yük biriktirme — eşya tepkisi yok (Counterspell yolu) |
| SRD-KAPSAM Sihirli eşyalar s. 241 | Rod of Lordly Might — Legendary | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: altı düğmeli biçim değişimi (silah, merdiven, kilit) — eşya biçim kancası yok |
| SRD-KAPSAM Sihirli eşyalar s. 244 | Spell Scroll — Varies | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: parşömen: içerdiği büyü envanter kaydında değil (eşya başına büyü seçimi gerekir) — Game Master |
| SRD-KAPSAM Sihirli eşyalar s. 248 | Talisman of Pure Good — Legendary | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: kötü uyumlu tutana hasar, uçurum açma yükü — hizalanma savaşa girmez |
| SRD-KAPSAM Sihirli eşyalar s. 249 | Talisman of Ultimate Evil — Legendary | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: iyi uyumlu tutana hasar, uçurum yükü — hizalanma savaşa girmez |
| SRD-KAPSAM Sihirli eşyalar s. 250 | Vorpal Sword — Legendary | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: doğal 20'de kafa kesme — eşya isabet kancasında ölüm yok |
| SRD-KAPSAM Sihirli eşyalar s. 250 | Wand of Enemy Detection — Rare | kısmi | güncel (kapanış kaydı yok) | savaşta uygulanmaz: 60 ft içindeki düşmanları sezme — gizlenme bilgisini eşyaya bağlama yok |
| SRD-KAPSAM Canavarlar s. 254 | Stat Block: Size (boyut, çok altıgen) | kısmi | güncel (kapanış kaydı yok) | bilinçli sapma (E20) |
| SRD-KAPSAM Canavarlar s. 255 | Stat Block: Gear (cephane, eşya donatma) | kısmi | güncel (kapanış kaydı yok) | canavar envanteri |
| SRD-KAPSAM Canavarlar s. 256 | Stat Block: Traits | kısmi | güncel (kapanış kaydı yok) | aşağıdaki canavar satırlarında "yok"lar |
| SRD-KAPSAM Canavarlar s. 259 | Animated Rug of Smothering (CR 2) | kısmi | güncel (kapanış kaydı yok) | Smother (kısmi: hasar yerine yakalama seçimi, boğulma yok); **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 274 | Cloaker (CR 8) | kısmi | güncel (kapanış kaydı yok) | Attach (kısmi: yapışma (attach) yok); **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 278 | Darkmantle (CR 1/2) | kısmi | güncel (kapanış kaydı yok) | Crush (kısmi: yapışma (attach) yok); **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 297 | Harpy (CR 1) | kısmi | güncel (kapanış kaydı yok) | Luring Song (kısmi: harpiye yürüme ve şarkı bitişi yok) |
| SRD-KAPSAM Canavarlar s. 301 | Invisible Stalker (CR 6) | kısmi | güncel (kapanış kaydı yok) | Vortex (kısmi: sözlü büyü yasağı yok); **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 320 | Roper (CR 5) | kısmi | güncel (kapanış kaydı yok) | Tentacle (kısmi: dokunaç AC/HP yok); **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 323 | Shambling Mound (CR 5) | kısmi | güncel (kapanış kaydı yok) | Engulf (kısmi: yığınla birlikte taşınma yok) |
| SRD-KAPSAM Canavarlar s. 329 | Stirge (CR 1/8) | kısmi | güncel (kapanış kaydı yok) | Proboscis (kısmi: yapışma (attach) yok) |
| SRD-KAPSAM Canavarlar s. 337 | Water Elemental (CR 5) | kısmi | güncel (kapanış kaydı yok) | Whelm (Recharge 4–6) (kısmi: boğulma yok) |
| GENEL-SAVAS-DENETIM A4 | Attack: saldırıda bir silahı takma/çıkarma (s.177) | bilinçli sapma | güncel (kapanış kaydı yok) | Silah değiştirme yok; bütün silah seçenekleri elde sayılır; yalnız `drop_item`/`pick_up` |
| GENEL-SAVAS-DENETIM A14 | Help: Assist an Ability Check (s.182–183) | yok | güncel (kapanış kaydı yok) | Yok (dost-bitişik Yardım = sarsma/kurtarma; Entangle `allyHelp`) |
| GENEL-SAVAS-DENETIM A15 | Help: ilk yardım / stabilize, DC 10 WIS (Medicine) (s.18, glossary) | kısmi | güncel (kapanış kaydı yok) | **GENEL96 (sürüm 96):** "Stabilize et" düğmesi TR/EN; YZ kullanmıyor. Önce: Motorda `stabilize` eylemi var (Medicine yalnız `srdK19` açıkken, yoksa çıplak WIS); **arayüzde düğme yok (TR/EN), YZ kullan |
| GENEL-SAVAS-DENETIM A17 | Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattında olmamak; başarıd | bilinçli sapma | güncel (kapanış kaydı yok) | Gizlenme yerleri veride; DC = max(15, görenlerin en yüksek pasif Algısı); bitişikte gören düşman varken gizlenilemez; "Gizli" = hedef alınamaz + avantaj |
| GENEL-SAVAS-DENETIM A18 | Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileşenli büyü | bilinçli sapma | güncel (kapanış kaydı yok) | Her büyü, itme, (grupsuz haritada) yürüme/atlama da bitirir |
| GENEL-SAVAS-DENETIM A21 | Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon | bilinçli sapma | güncel (kapanış kaydı yok) | Uzun dökümler `offCombat`/ritüel (kurulumda); savaş menüsünde gizli; motor yine de tek eylemle kabul ediyor (GM notu) |
| GENEL-SAVAS-DENETIM A23 | Ready: yanıt "the action you will take" (her eylem) | kısmi | güncel (kapanış kaydı yok) | Yalnız tek saldırı, hareket, büyü |
| GENEL-SAVAS-DENETIM A24 | Ready: tetik "perceivable circumstance" | bilinçli sapma | güncel (kapanış kaydı yok) | Veri listesindeki 8 tetik, yalnız karşı taraf tetikler |
| GENEL-SAVAS-DENETIM A27 | Ready: YZ kullanımı | yok | güncel (kapanış kaydı yok) | Yok |
| GENEL-SAVAS-DENETIM A30 | Study: INT kontrolü (s.189) | kısmi | güncel (kapanış kaydı yok) | Genel komut yok; yalnız Phantasmal Force'tan INT (Investigation) ile kurtulma |
| GENEL-SAVAS-DENETIM A32 | Turda bir serbest nesne etkileşimi; ikincisi Utilize (s.13) | kısmi | güncel (kapanış kaydı yok) | Kapı aç/kapa, `take`, `put` sınırsız ve sayaçsız serbest; yalnız `pick_up` `interacted` sayar (ortak bütçe yok) |
| GENEL-SAVAS-DENETIM A41 | Action Surge: ek eylem, Magic hariç | kısmi | güncel (kapanış kaydı yok) | Yalnız `cast_spell` (eylemlik) reddedilir; Magic eylemli `use_feature`/eşya denetlenmiyor |
| GENEL-SAVAS-DENETIM A46 | YZ: Disengage | kısmi | güncel (kapanış kaydı yok) | Yalnız bonus eylemle (Cunning Action), yürüyüş OA yedirecekse |
| GENEL-SAVAS-DENETIM A47 | YZ: Dodge / Help | kısmi | güncel (kapanış kaydı yok) | Familiar (Yardım, yoksa Kaçın), kontrollü binek, dostu sarsma |
| GENEL-SAVAS-DENETIM A48 | YZ: Hide | kısmi | güncel (kapanış kaydı yok) | Yalnız sızma (uyuyan/habersiz grup) haritalarında |
| GENEL-SAVAS-DENETIM A50 | YZ: Utilize / eşya | kısmi | güncel (kapanış kaydı yok) | Kapı açma, tutuşturma, taşıma, nesne fırlatma, iksir |
| GENEL-SAVAS-DENETIM B2 | Immunity: bağışık olunan durum hiç etkilemez (s.183) | kısmi | güncel (kapanış kaydı yok) | Canavar durum bağışıklığı savaş başında etki (`immune`); `condition_changed`, saldırı `conditionsAdded`, süren etki `grants` (89+) süzülür |
| GENEL-SAVAS-DENETIM B7 | Blinded: görme gerektiren kontrolde otomatik başarısız | kısmi | güncel (kapanış kaydı yok) | Pasif Algı Blinded'da düşmüyor; Blinded gözcü bitişikteki gizleneni "görerek" buluyor ve Gizlen DC'sini yükseltiyor (`canSee` Blinded'a bakmıyor) |
| GENEL-SAVAS-DENETIM B9 | Charmed: büyüleyene saldıramaz / zarar veren etkiyle hedefleyemez (s.178) | kısmi | güncel (kapanış kaydı yok) | Yalnız `charm` işaretli süren etkide (Charm Person, Suggestion, Karadul…); zarar vermeyen büyü serbest (83+). Rider'dan gelen süreli Charmed durumu (pirate Enthralling Panache, sprite Enchanting Bow,  |
| GENEL-SAVAS-DENETIM B11 | Deafened: duyma gerektiren kontrolde otomatik başarısız (s.180) | kısmi | güncel (kapanış kaydı yok) | Duyma kontrolü kavramı yok; yalnız sözlü buyruk büyüleri (Command, Suggestion) sağır hedefe işlemez; Silence içi Deafened sayılır |
| GENEL-SAVAS-DENETIM B13 | Exhaustion: D20 Testi −2 × seviye | kısmi | güncel (kapanış kaydı yok) | **GENEL96 (sürüm 96):** stabilize ve haritasız tırmanma ortak yolda; Dispel/Counterspell kontrolü değişmedi. Önce: Saldırı, save, `checkDice` kullanan kontroller, inisiyatif, ölüm save'i; sabit kontro |
| GENEL-SAVAS-DENETIM B16 | Frightened: kaynak görüş hattındayken saldırıda ve kontrolde dezavantaj (s.182) | kısmi | güncel (kapanış kaydı yok) | **GENEL96 (sürüm 96):** stabilize ve haritasız tırmanma `checkBase`'ten; Dispel ve nesne kontrolleri değişmedi. Önce: `frightenedNow` + `checkBase` (sürüm 2+); kontrollerin bir kısmı `checkBase`'den g |
| GENEL-SAVAS-DENETIM B20 | Grappled: yakalayan sürükler, her ft +1 ft; hedef Tiny ya da iki+ boy küçükse ek maliyet y | kısmi | güncel (kapanış kaydı yok) | Sürükleme her adım ×2; Tiny/iki boy küçük istisnası yok (yalnız Grappler feat'i ve Bugbear Abduct) |
| GENEL-SAVAS-DENETIM B21 | Grappling: biter: kaçış (Athletics/Acrobatics vs DC), yakalayan Incapacitated, mesafe; yak | kısmi | güncel (kapanış kaydı yok) | Kaçış ve otomatik bitişler var; "bırak" komutu yok |
| GENEL-SAVAS-DENETIM B30 | Petrified: ağırlık ×10, yaşlanma durur | yok | güncel (kapanış kaydı yok) | Yaratık ağırlığı modeli yok (taşıma yalnız nesne) |
| GENEL-SAVAS-DENETIM C5 | Genişletilmiş kritik aralığı (Improved Critical "can score a Critical Hit on a roll of 19  | kısmi | güncel (kapanış kaydı yok) | `crit(natural)` doğal 19'a da AC'ye bakmadan isabet veriyor |
| GENEL-SAVAS-DENETIM C10 | Yeri tahmin edilen hedefe saldırı yapılabilir; hedef orada değilse ıska (s. 14) | kısmi | güncel (kapanış kaydı yok) | Gizlenmiş hedef hedeflenemiyor ("önce Ara ile bulunmalı") |
| GENEL-SAVAS-DENETIM C11 | Karanlıktaki (görülmeyen) saldıran ya da hedef | bilinçli sapma | güncel (kapanış kaydı yok) | Gece görüşü kuralı `nightVision` Game Master anahtarında, varsayılan kapalı |
| GENEL-SAVAS-DENETIM C17 | Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR + PB, hedef en çok b | kısmi | güncel (kapanış kaydı yok) | Boyut, bitişiklik, DC ve yüksek save var. Boş el ve el başına bir yakalama denetlenmiyor |
| GENEL-SAVAS-DENETIM D9 | Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) | kısmi | güncel (kapanış kaydı yok) | Her parça ayrı yarıya iniyor: dirençli hedefte 5 + 3 piercing → 2 + 1 = 3 (toplu yuvarlamada 4) |
| GENEL-SAVAS-DENETIM D18 | Stabilize: Help eylemi + DC 10 WIS (Medicine) (s. 18) | kısmi | güncel (kapanış kaydı yok) | **GENEL96 (sürüm 96):** doğal 20/1 düzeldi; menzil (karar 8) değişmedi. Önce: `stabilize` komutu (eylem; Medicine; Healer's Kit zarsız). Mesafe denetimi yok; yetenek kontrolüne doğal 20/1 kuralı uygul |
| GENEL-SAVAS-DENETIM D21 | İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kısa ve uzun dinlenme  | kısmi | güncel (kapanış kaydı yok) | Savaş sonunda ölmekte ve stabil ayrımı yazılmıyor (HP 0). Uzun dinlenme 0 HP'den tam HP veriyor |
| GENEL-SAVAS-DENETIM D26 | Geçici HP tükenene ya da uzun dinlenmeye dek sürer (s. 18) | kısmi | güncel (kapanış kaydı yok) | Savaş sonunda karaktere yazılmıyor, kayboluyor |
| GENEL-SAVAS-DENETIM E3 | Birden çok hız: hareket sırasında geçiş, gidilen yol yeni hızdan düşülür (s.188 Speed) | kısmi | güncel (kapanış kaydı yok) | Uçuş hızı olan yaratık yerde yürürken de bütçesini uçuş hızından alır; yürüme ve uçuş ayrı sayılmaz |
| GENEL-SAVAS-DENETIM E6 | Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayrı Squeezing kuralı y | yok | güncel (kapanış kaydı yok) | Varsayılan tek altıgen modelinde dar açıklık verisi yok. Çok altıgende sığmayan gövde geçemez (zorlu arazi değil) |
| GENEL-SAVAS-DENETIM E12 | Long Jump alçak engel: Game Master seçeneğiyle DC 10 Athletics (s.185) | bilinçli sapma | güncel (kapanış kaydı yok) | Engel ≤ mesafe/4 zarsız aşılır |
| GENEL-SAVAS-DENETIM E14 | Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldırır; Game Master seçe | bilinçli sapma | güncel (kapanış kaydı yok) | Tırmanışın başında bir Çeviklik kontrolü (DC 10/12/15), çarpan ×2/×2/×3. Tırmanma hızı olan zarsız ve ek maliyetsiz |
| GENEL-SAVAS-DENETIM E16 | (SRD'de yok) Kıyıdan uzak derin suya yalnızca yüzücü girer | bilinçli sapma | güncel (kapanış kaydı yok) | `deepWaterLimit` Game Master anahtarı |
| GENEL-SAVAS-DENETIM E20 | Boyut ve alan: Tiny 2½ ft … Gargantuan 20 ft (s.14) | bilinçli sapma | güncel (kapanış kaydı yok) | Her yaratık bir altıgen. `multiHex` deneysel ve varsayılan kapalı: L 3, H 7, G 19 altıgen |
| GENEL-SAVAS-DENETIM E26 | Tur başka yaratığın alanında biterse Prone (Tiny ya da daha büyük değilse) (s.14) | kısmi | güncel (kapanış kaydı yok) | Paylaşım oluşmaz; zorunlu dönüşte (Banishment) en yakın boş altıgen, Prone yok |
| GENEL-SAVAS-DENETIM F3 | Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısız olabilirsin; yeten | kısmi | güncel (kapanış kaydı yok) | Doğal 20/1 kuralı yok (doğru). İsteyerek başarısız olma yok |
| GENEL-SAVAS-DENETIM F12 | Exhaustion −2×seviye bütün yetenek kontrollerine | kısmi | güncel (kapanış kaydı yok) | **GENEL96 (sürüm 96):** stabilize ve haritasız tırmanma ortak yolda; Dispel/Counterspell kontrolü değişmedi. Önce: `checkDice` kullanan yollarda; stabilize, Dispel/Counterspell kontrolü, haritasız tır |
| GENEL-SAVAS-DENETIM F17 | Taşıma sınırının üstünde sürükleme/kaldırma/itme: Speed en çok 5 ft | kısmi | güncel (kapanış kaydı yok) | Sürükleme sınırı yalnız hesapta; savaşta kullanılmıyor (kapasite aşılırsa alma reddedilir) |
| GENEL-SAVAS-DENETIM F20 | Help (yetenek kontrolü): müttefikin seçilen beceri kontrolü avantajlı | yok | güncel (kapanış kaydı yok) | Yok (dosta Help yalnız sarsma/sarmaşıktan kurtarma) |
| GENEL-SAVAS-DENETIM F21 | Heroic Inspiration: herhangi bir zarı hemen yeniden at, yeniyi kullan; tek kopya (s.8, s.1 | kısmi | güncel (kapanış kaydı yok) | Yalnız başarısız d20'de otomatik yeniden atış (Resourceful, Heroic Warrior); Human'a **her savaş başında** yeniden 1 (taşınan değer eziliyor) |
| GENEL-SAVAS-DENETIM F24 | Stabilize: Help eylemi, DC 10 WIS (Medicine) (s.18) | kısmi | güncel (kapanış kaydı yok) | Kontrol var ama F2 ve F12 sapmaları |
| GENEL-SAVAS-DENETIM G3 | Her zardan sonra yenisini harcamaya karar verilir (s.187) | kısmi | güncel (kapanış kaydı yok) | Sayı önceden seçilir (karakter listesinde sayaç, yolculukta otomatik öneri) |
| GENEL-SAVAS-DENETIM G10 | Long Rest'ten sonra yenisi için en az 16 saat (s.185) | kısmi | güncel (kapanış kaydı yok) | Yolculukta tam (`longRestGapHours` 16). Karakter listesinde, Game Master kurulumunda ve Serüven düğümünde saat yok, her an yapılabilir |
| GENEL-SAVAS-DENETIM G11 | Kesintiler (inisiyatif, cantrip dışı büyü, hasar, 1 saat efor); kesilen Short Rest yararsı | yok | güncel (kapanış kaydı yok) | Dinlenme anlık; kesinti modeli yok |
| GENEL-SAVAS-DENETIM G12 | Short Rest sayısında sınır yok (s.16, s.187) | bilinçli sapma | güncel (kapanış kaydı yok) | Ev kuralı: iki uzun dinlenme arası en çok 2 (Normal/Zor), Kolay'da sınırsız; Serüven "Dinlenme" durağında sınıra sayılmayan bir kısa dinlenme |
| GENEL-SAVAS-DENETIM G14 | (SRD dışı) Serüven bozgununda uzun dinlenip yeniden deneme | bilinçli sapma | güncel (kapanış kaydı yok) | Serüven anahtarı `bozgundaYenidenDene` |
| GENEL-SAVAS-DENETIM H3 | Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır, saldırıda dezavant | bilinçli sapma | güncel (kapanış kaydı yok) | `darkness` haritalarında (13 varyant): görülmeyen hedef **seçilemez** (SRD: dezavantajla saldırılabilir). Karanlık görüşü olmayan, ışıksız altıgende `unlitSightHexes` (3–4 altıgen) kadar görür (SRD: 0 |
| GENEL-SAVAS-DENETIM H4 | Gece dışarısı karanlıktır (s.10) | bilinçli sapma | güncel (kapanış kaydı yok) | **`nightVision` kapalı (varsayılan):** gece haritasında herkes herkesi görür (`canSee` true), saldırıya karanlık kaynağı eklenmez. Işık modeli yalnız Algı/Gizlenme tarafında işler: ışıksız altıgende k |
| GENEL-SAVAS-DENETIM H13 | Işık kaynakları: Torch 20 ft parlak + 20 ft loş (Equipment) | bilinçli sapma | güncel (kapanış kaydı yok) | Harita meşale ve mangalları 10 + 5 ft (2 + 1 altıgen); Şehir Meydanı fenerleri 30 + 30 |
| GENEL-SAVAS-DENETIM H15 | (SRD dışı) Gece kuralı: ışıksız altıgende Gizlen avantajlı, karanlık görüşsüz gözcüye pasi | bilinçli sapma | güncel (kapanış kaydı yok) | Harita kuralı `night` (`hideAdvantage`, `passivePerceptionPenalty` 5) |
| CLAUDE.md Bilinen eksikler | Hazırla (Ready) eylemi | kısmen | güncel (kapanış kaydı yok) | Kural sürümü 90 (R1 + R2; `src/battle/ready.ts`, tetikler `data/hazirla.json`): tek saldırı, hızın kadar hareket, eylem süreli büyü (slot hazırlarken, tutma konsantrasyonu); arayüz "Özel ▸ Diğer ▸ Haz |
| CLAUDE.md Bilinen eksikler | 4. seviye ve üstü büyüler | kısmen | güncel (kapanış kaydı yok) | Kuyruk 40: SRD'nin 72 adet 4.–5. seviye büyüsü kayıtlı (`data/spells-45.json`, tembel, `loadClassData` ile; Cone of Cold ve Summon Dragon `spells.json`'da): tam 7, kısmi 26 (+4 Kuyruk 17: Banishment ` |
| CLAUDE.md Bilinen eksikler | Sınıf özellikleri (Aşama 1+) | kısmen | güncel (kapanış kaydı yok) | Altyapı hazır (Görev N). Uygulanan: Extra Attack, Sneak Attack, Cunning Action, Action Surge, Second Wind, Favored Enemy, Unarmored Defense/Movement, Fast Movement, uzmanlık, Weapon Mastery (Görev P0; |
| CLAUDE.md Bilinen eksikler | Weapon Mastery | kısmen | güncel (kapanış kaydı yok) | 8 ustalığın hepsi çalışıyor (Nick Görev P1'de yan el saldırısıyla). Push yakın dövüşte yalnızca eylemin son saldırısında; büyü saldırıları Sap/Vex'e bakmaz |
| CLAUDE.md Bilinen eksikler | Yukarı slot etkileri | kısmen | güncel (kapanış kaydı yok) | Slot seçimi var; etki verisi her büyüde (`mechanics.upcast`), uygulanan Spiritual Weapon, Spirit Guardians, smite büyüleri (Divine/Searing/Shining Smite) ve etki büyülerinin hedef sayısı / Aid HP'si ( |
| CLAUDE.md Bilinen eksikler | Durum süreleri | kısmen | güncel (kapanış kaydı yok) | `conditionTimers` var (tur, başına/sonuna dek, save ends, süreli hasar `dot`); 20 elle tanımlı canavar etkisi + 6 büyü (`data/condition-effects.json`), ~30 rider'dan üretilen süreli durum. İki aşamalı |
| CLAUDE.md Bilinen eksikler | Yakalama ve yere düşme | kısmen | güncel (kapanış kaydı yok) | Grappled (hız 0, kaçış eylemi, sürükleme yarı hız, yakalayan düşünce biter), oyuncunun yakalama (`grapple`) komutu ve A1'den beri (kural sürümü 29) yakalananın yakalayanı dışındaki hedeflere saldırı d |
| CLAUDE.md Bilinen eksikler | Feat'ler (köken, ASI, Fighting Style, Epic Boon) | kısmen | güncel (kapanış kaydı yok) | Seçim var; uygulanan: ASI, Alert (inisiyatif), Skilled, Archery, Defense, Great Weapon Fighting, yetenek artışları. Two-Weapon Fighting (Görev P1). Magic Initiate ve Savage Attacker (Görev F1). Boon'l |
| CLAUDE.md Bilinen eksikler | Yan el ve eller | kısmen | güncel (kapanış kaydı yok) | Görev P1: Light ek saldırısı, Nick, Two-Weapon Fighting, Versatile iki el (kalkan ve geçerli yan el yoksa). Basitleştirmeler: taşınan her Two-Handed silah (yaylar dahil) yan eli engeller; aynı silahta |
| CLAUDE.md Bilinen eksikler | Kalıcı alan büyüleri | kısmen | güncel (kapanış kaydı yok) | Spirit Guardians, Spiritual Weapon; Görev B2: Entangle, Fog Cloud, Grease, Moonbeam, Silence, Spike Growth, Web, Plant Growth, Sleet Storm, Stinking Cloud, Wind Wall, Flaming Sphere (çoğu kısmi; DECIS |
| CLAUDE.md Bilinen eksikler | Binek (Mounted Combat) | kısmen | güncel (kapanış kaydı yok) | Kuyruk MB1–MB8 (kural sürümü 68–74): motor ve YZ tam (bağımsız/kontrollü, dikey, çok altıgen, çağrılan binek); arayüz MB6b'de. YZ savaş içi binmez; kurulumda eğitimli anahtarı yok |
| CLAUDE.md Bilinen eksikler | Çağırma | kısmen | güncel (kapanış kaydı yok) | Görev R3: Find Familiar, Find Steed (Faithful Steed), Summon Dragon. Görev B2: Conjure Animals (ruh sürüsü), Flaming Sphere, Animate Dead yukarı slotla çok yaratık; CILA: Flaming Sphere ve ruh sürüsü  |
| CLAUDE.md Bilinen eksikler | Süren etkiler (buff/debuff) | kısmen | güncel (kapanış kaydı yok) | Görev R2: Bless, Bane, Guidance, Resistance, Heroism, Aid, Hex, Searing Smite (süregelen), Command (yalnızca Grovel/Halt). Görev S1: Fly, Levitate, Invisibility, Haste, Slow, Barkskin, Mage Armor, Lon |
| CLAUDE.md Bilinen eksikler | Wild Shape / Polymorph biçimi | kısmen | güncel (kapanış kaydı yok) | Görev WS91 (sürüm 91): stat bloğunun duyuları, direnç/bağışıklık, durum bağışıklığı, tırmanma/kazma, canavar özellikleri, yetenekleri ve tepkileri aktarılır, bitince geri gelir. Kalan: Wild Shape'te t |
| CLAUDE.md Bilinen eksikler | Çok altıgenlik büyük canavarlar | kısmen | güncel (kapanış kaydı yok) | Görev A6 + Kuyruk 43: bayrak `multiHex` (deneysel, varsayılan kapalı; Game Master kurulumunda anahtar): yerleştirme ve otomatik yerleşim, doluluk, hareket, erişim, fırsat saldırısı, alan isabeti, alan |
| CLAUDE.md Bilinen eksikler | Efsanevi eylem ve direnç | kısmen | güncel (kapanış kaydı yok) | Kuyruk 33: efsanevi eylemler `data/efsanevi.json` (veride olan canavarlar); Kuyruk 43: Legendary Resistance (SRD metninden, günde N), Commanding Presence, Pounce yarım hız. Kuyruk 19: SRD'nin efsanevi |
| CLAUDE.md Bilinen eksikler | Canavar büyüleri ve tepkileri | kısmen | güncel (kapanış kaydı yok) | Kuyruk 19: canavar büyü eylemleri `data/canavar-buyuleri.json` ve SRD tepkilerinin hepsi (`srdK19`; Protection, Whirlwind of Sand, Deflect Missile, Reflexive Antennae, Redirect Attack, Ink Cloud, Purs |
| CLAUDE.md Bilinen eksikler | Koni ve çizgi alanlar (nefes silahları) | kısmen | güncel (kapanış kaydı yok) | Görev R4: canavarların 86 alanlı saldırısı (koni, çizgi, yayılım, küre) alan olarak. Kısmen: silindir yükseklikli değil (küre sayılır); "saldırının yerine nefes" Multiattack seçenekleri ayrı eylem; Dj |
| CLAUDE.md Bilinen eksikler | Durum bağışıklığı | kısmen | güncel (kapanış kaydı yok) | Kuyruk 19: SRD canavar verisinden savaş başında (`monsterTraits.ts`, `srdK19`); anahtar kapalıyken yok |
| CLAUDE.md Bilinen eksikler | Canavar özellikleri (Pack Tactics, Magic Resistance…) | kısmen | güncel (kapanış kaydı yok) | Kuyruk 19: Magic Resistance, duyular, Spider Climb, Web Walker, Ice Walk, Fire Aura, Stench, Sunlight Sensitivity ve 103 canavarın yetenekleri (`monsterAbilities.ts`); kalanlar `docs/SRD-DENETIM.md` |
| CLAUDE.md Bilinen eksikler | Dinlenme (kısa/uzun) | kısmen | güncel (kapanış kaydı yok) | Savaşlar arası (karakter listesi, Game Master kurulumu); SRD 5.2.1: uzun dinlenme bütün HP zarları, kısa dinlenmede zar başına en az 1 HP ve 0 HP'de kısa dinlenme yok (2026-11-20; 0 HP uzun dinlenme y |
| CLAUDE.md Bilinen eksikler | Tepkiler | kısmen | güncel (kapanış kaydı yok) | Görev R1: fırsat saldırısı, Shield, Counterspell, Hellish Rebuke, Feather Fall, Uncanny Dodge, Deflect Attacks, Slow Fall, Retaliation; Superior Hunter's Defense kısmen (yalnızca isabet). Cutting Word |
| CLAUDE.md Bilinen eksikler | Sabit hasar | kısmen | güncel (kapanış kaydı yok) | Sabit hasar "1d2 + (N − 1)" ile yaklaşıklanıyor (21 canavar) |
| CLAUDE.md Bilinen eksikler | Ağ üzerinden çok oyunculu | yok | güncel (kapanış kaydı yok) | Tek ekran paylaşımlı |
| CLAUDE.md Bilinen eksikler | Savaş içi kat değişimi (çok katlı harita) | kısmen | güncel (kapanış kaydı yok) | Kuyruk 18 H4: `floorLink` (Maden Ocağı ↔ Mezar Labirenti); kat değiştiren hep bütün parti, iki kat aynı anda çizilmez |
| CLAUDE.md Bilinen eksikler | Yapay zekânın gizlenmesi | kısmen | güncel (kapanış kaydı yok) | Yalnız sızmada (Kuyruk 14 K14A: uyuyan/habersiz grup varken gözcüye yaklaşınca Gizlen, `ai.ts`); savaşta Gizlen kullanmaz (gece kuralı simülasyonda çoğunlukla etkisiz). Gece kuyruğu Aşama 5 doğrulamas |
| CLAUDE.md Bilinen eksikler | İngilizce (EN) arayüz | kısmen | güncel (kapanış kaydı yok) | Ekran metinleri, günlük ve açıklamalar (büyü, eşya, tür/sınıf/alt sınıf özelliği, Invocation, feat, durum, canavar, betimleme; Görev EN-ACIKLAMA) çevrili; motor hata/gerekçe metinleri, harita/zemin ad |
| PAKET-SIGMAYAN | Dengeyi Geri Yükle (sorcerer / otonom-evren / 1) | kısmi | güncel (kapanış kaydı yok) | Yalnız saldırı zarı (kurtulma/kontrol zarında yok) |
| PAKET-SIGMAYAN | Denge Arayışı (barbarian / kaos-yolu / 10) | kısmi | güncel (kapanış kaydı yok) | Metne göre seçilmeli |
| PAKET-SIGMAYAN | Kontrol Sağlama (barbarian / kaos-yolu / 14) | kısmi | güncel (kapanış kaydı yok) | Metne göre seçilmeli |
| PAKET-SIGMAYAN | Gelişmiş Zarlar (fighter / ninja / 10) | kısmi | güncel (kapanış kaydı yok) | Paketin kendi zar havuzu P11'de (`zarHavuzu`, zar seviye tablosu) |
| PAKET-SIGMAYAN | Üstün Taktik (fighter / ninja / 18) | kısmi | güncel (kapanış kaydı yok) | Havuz P11'de (`zarHavuzu.savasBasiEnAz`) |
| PAKET-SIGMAYAN | Misillemeli Sapma (bard / harp / 14) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Büyü Hırsızı (rogue / illuzyonist / 17) | kısmi | güncel (kapanış kaydı yok) | Çalma kısmı P11'de (`buyuIptal.calar`) |
| PAKET-SIGMAYAN | Şekil Değiştirici (wizard / simya / 10) | kısmi | güncel (kapanış kaydı yok) | "Yalnız kendine" P11'de (`buyuVer.yalnizKendine`) |
| PAKET-SIGMAYAN | Çevik Sıyrılma (rogue / kasif / 3) | kısmi | güncel (kapanış kaydı yok) | `hareketEt` yol bulmaz (ışınlanma girişi) |
| PAKET-SIGMAYAN | Kaçınılmaz Avcı (paladin / intikam-yemini / 7) | kısmi | güncel (kapanış kaydı yok) | Aynı |
| PAKET-SIGMAYAN | Boyut Karşıtı Vuruş (paladin / muhafiz / 15) | kısmi | güncel (kapanış kaydı yok) | Metne göre seçilmeli |
| PAKET-SIGMAYAN | Karşı Darbe (ranger / ibliskiran / 15) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Doğaüstü Savunma (ranger / ibliskiran / 7) | kısmi | güncel (kapanış kaydı yok) | Bonus yerine avantaj; kaynağı taşıyan kurtulmalarda |
| PAKET-SIGMAYAN | Zihinsel İtaat (warlock / muhterem / 14) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Ölümün Dostu (rogue / kamufle / 17) | kısmi | güncel (kapanış kaydı yok) | Sınıfın Sneak Attack'ı değil, paketin ek zarı yan hedefe |
| PAKET-SIGMAYAN | Barış Azizi (cleric / baris / 17) | kısmi | güncel (kapanış kaydı yok) | Havuz yerine üyelere direnç (aynı sonuç: havuza düşen hasar yarıya) |
| PAKET-SIGMAYAN | Gelişmiş Dev (fighter / pehlivan / 10) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Yoğunluk Ayarı (wizard / uzay-bukme / 2) | kısmi | güncel (kapanış kaydı yok) | Ağırlık/zıplama etkisi yok |
| PAKET-SIGMAYAN | Flurry Şifası (monk / azizlik / 11) | kısmi | güncel (kapanış kaydı yok) | Flurry kendisi Focus harcar ("Ki harcamadan" kısmı yok) |
| PAKET-SIGMAYAN | Tektonik Yoğunluk (sorcerer / titan-kani / 1) | kısmi | güncel (kapanış kaydı yok) | Kalanı P11'de (`koruma.itmeDirenci`, `buyuDegisimi.yetenekEki`) |
| PAKET-SIGMAYAN | Koruyucu Ruhlar (druid / cagri / 10) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Kusursuz İlham (bard / hatip / 6) | kısmi | güncel (kapanış kaydı yok) | Metne göre iki kipten biri |
| PAKET-SIGMAYAN | Usta Gösterisi (bard / akrobat / 14) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Hücum Marşı ve Harp Eğitimi (bard / harp / 3) | kısmi | güncel (kapanış kaydı yok) | AC kullanımı ilhamlı dostun tepkisiyle |
| PAKET-SIGMAYAN | Kutsanmış Şifa (sorcerer / ilahi-kan / 6) | kısmi | güncel (kapanış kaydı yok) | Büyü iyileştirmesi (`healed.rolls`) |
| PAKET-SIGMAYAN | İkiz Büyüleme (wizard / aldatma / 10) | kısmi | güncel (kapanış kaydı yok) | Twinned Spell yolu: yukarı slotta ek hedef alan büyüler |
| PAKET-SIGMAYAN | Büyü Mühürleme (wizard / zamanalti / 10) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Güç Deposu (bard / harp / 6) | kısmi | güncel (kapanış kaydı yok) | Metne göre |
| PAKET-SIGMAYAN | Kitabın Ruhu (wizard / hattat / 6) | kısmi | güncel (kapanış kaydı yok) | Çağıran büyüde konsantrasyonsuz uygulanmaz |
| PAKET-SIGMAYAN | Okyanusun Kavrayışı (warlock / kraken / 10) | kısmi | güncel (kapanış kaydı yok) | Varsayım: kaynaklı bedava büyü, konsantrasyonsuz |
| PAKET-SIGMAYAN | Sınırlı Dilek (warlock / cin / 14) | kısmi | güncel (kapanış kaydı yok) | Bilinmeyen büyü slotsuz |
| PAKET-SIGMAYAN | Büyü Hırsızı (çalma kısmı) (rogue / illuzyonist / 17) | kısmi | güncel (kapanış kaydı yok) | Çalınan büyü bir kez, slotsuz |
| PAKET-SIGMAYAN | Şekil Değiştirici (yalnız kendine) (wizard / simya / 10) | kısmi | güncel (kapanış kaydı yok) | Başkasına slotla |
| PAKET-SIGMAYAN | Vahşi Öfke (ranger / coban / 11) | kısmi | güncel (kapanış kaydı yok) | Komut (`command_summons`) turunda ek saldırı |
| PAKET-SIGMAYAN | Analitik Dövüş (rogue / dedektif / 3) | kısmi | güncel (kapanış kaydı yok) | Kazanınca savaş boyu avantajsız Sneak Attack |
| PAKET-SIGMAYAN | Büyü Direnci Aurası (paladin / antik / 7) | kısmi | güncel (kapanış kaydı yok) | Büyü hasarı (saldırı, kurtulma, alan, büyü alanı) |
| PAKET-SIGMAYAN | Tektonik Yoğunluk (kalan) (sorcerer / titan-kani / 1) | kısmi | güncel (kapanış kaydı yok) | Yakın büyü: menzil ≤ 5 ft (`menzilEnCokFt`) |
| PAKET-SIGMAYAN | Element Rünü (barbarian / heybet / 6) | kısmi | güncel (kapanış kaydı yok) | Fırlatılan silah elden çıkmaz (genel Thrown basitleştirmesi) |
| PAKET-SIGMAYAN | Büyü Silahı Bağı (fighter / hokkabaz / 3) | kısmi | güncel (kapanış kaydı yok) | — |
| PAKET-SIGMAYAN | Güç Deposu (wizard / harp-ogretisi / 6) | kısmi | güncel (kapanış kaydı yok) | Başlangıç ve uzun dinlenme 1, kısa dinlenme 0'daysa 1; turda bir; tek hedefe |
| PAKET-SIGMAYAN | Vertigo (doğrulama) (barbarian / kaos-yolu / 3) | kısmi | güncel (kapanış kaydı yok) | P11'e dek karşılığı yoktu (rastgele tablo ilkeli yoktu); P12'de yazıldı |
| PAKET-SIGMAYAN | İkiz Büyüleme (wizard / aldatma-ogretisi / 10) | kısmi | güncel (kapanış kaydı yok) | Kaynaksız; `ikiz` (Twinned) ayrı kalır |
| PAKET-SIGMAYAN | Kitabın Ruhu (wizard / hattat-ogretisi / 6) | kısmi | güncel (kapanış kaydı yok) | Kitap nesne (`spellbook`); bırak/al; büyü kitabın altıgeninden |
| PAKET-SIGMAYAN | Büyü Mühürleme (wizard / zamanalti-ogretisi / 10) | kısmi | güncel (kapanış kaydı yok) | Dost tetikler (`spell_followup.sourceId`), ekonomisi harcanmaz |
| BARBARIAN-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| BARBARIAN-DENETIM.md | C5 Seviye atlamada alt sınıf (3), ASI/feat (4/8/12/16), Epic Boon (19), yeni ustalık (4, 1 | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven `seruven_leveled` yalnız seviyeyi artırır; Barbarian için "Seçimler" düğmesi yok (`choicesBound` false). P1: 2 → 3 sonrası `subclassId` boş, `set_choice |
| BARBARIAN-DENETIM.md | C6 Primal Knowledge becerisi 3. seviyede seçilir | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven seçim alanlarında `skills` yok (`CHOICE_FIELDS`), Builder seçim kipi beceri değiştirmez: Barbarian bağlansa da bu beceri eklenemez yok **[YENİ]** `level |
| BARBARIAN-DENETIM.md | D5 Intimidating Presence | yok/ertelendi | güncel (kapanış kaydı yok) | Hiç kullanılmıyor: `ai.ts` `fearAura`'ya bakmıyor. P3: 14. seviye, 30 ft'te 3 düşman, Rage sürüyor ve bonus eylem boş → `reckless > attack > move > attack > end |
| BARD-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| BARD-DENETIM.md | C5 Dostta kalan Bardic Inspiration zarı 1 saat sürer (savaşlar arası) | yok/ertelendi | güncel (kapanış kaydı yok) | Zar savaş durumunda süren etkidir; savaş sonu karaktere yazılmaz (kod okumasından çıkarım; savaşlar arası taşınan etki yok) sapma — |
| CLERIC-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| CLERIC-DENETIM.md | A8 "another creature you can see" | yok/ertelendi | güncel (kapanış kaydı yok) | Görüş denetimi yok; hedef olarak **kendisi** seçilebiliyor (probe: kendine 17 HP) kısmi probe (`cleric.ts` `clericFeatureProblem` 73–79) |
| CLERIC-DENETIM.md | A11 Seçilen Undead'ler ("of your choice") | yok/ertelendi | güncel (kapanış kaydı yok) | Menzildeki **bütün** düşman Undead; dost Undead hariç (probe), alt küme seçimi yok bilinçli sapma `cleric.ts` 56–66 |
| CLERIC-DENETIM.md | A13 "olabildiğince uzaklaşmaya çalışır" | yok/ertelendi | güncel (kapanış kaydı yok) | Yok. Probe'da turnlu Undead'in YZ komutu `end_turn`; DECISIONS "Frightened davranışına bırakıldı" ama Incapacitated olduğu için YZ hiç hareket etmiyor yok probe |
| CLERIC-DENETIM.md | A14 Cleric Incapacitated olursa ya da ölürse efekt biter | yok/ertelendi | güncel (kapanış kaydı yok) | Yok: efekt yalnız süre ve hasarla biter (probe: Cleric Incapacitated ve ölü iken Undead hâlâ Frightened+Incapacitated). `pruneEffects` (`reduce.ts` 201–216) kay |
| CLERIC-DENETIM.md | C3 Greater DI Wish: 2d4 Long Rest sayacı | yok/ertelendi | güncel (kapanış kaydı yok) | Yok (DI bir uzun dinlenmede döner) kısmi — **bilinen** `class-features.json` 1649 |
| DRUID-DENETIM.md | Bölüm tam | yok/ertelendi | güncel (kapanış kaydı yok) | kısmi yok bilinçli sapma |
| DRUID-DENETIM.md | B13 Druidic Focus spellcasting focus (s. 42) | yok/ertelendi | güncel (kapanış kaydı yok) | Büyü bileşen takibi yok; Quarterstaff silah olarak var yok genel bileşen yokluğu |
| DRUID-DENETIM.md | D2 Land's Aid, Nature's Sanctuary, Wild Resurgence, Nature Magician, Wild Companion (Find  | yok/ertelendi | güncel (kapanış kaydı yok) | **YZ hiçbirini kullanmıyor**: `ai.ts`'te `landsAid`, `sanctuary`, `wild_resurgence`, `Find Familiar` yok (grep) yok **[YENİ]** `grep` `src/battle/ai.ts`, `ai/*. |
| E4-DENETIM.md | Ki / Odak `focus`, `uncannyMetabolism`, `wholenessOfBody` | yok/ertelendi | güncel (kapanış kaydı yok) | yok yok Monk (Focus, Flurry, Patient Defense, Step of the Wind, Stunning Strike), imza Sabır/Son Ders |
| E4-DENETIM.md | İlham `bardicInspiration`, imza `imzaUstaSair`, `imzaOlumsuzDize` | yok/ertelendi | güncel (kapanış kaydı yok) | yok `ok-zar-arti` (sayı oku, rozet) uyar ama kaynak değil Bard (Bardic Inspiration, Superior Inspiration), Şair imzası |
| E4-DENETIM.md | Üstünlük zarı (kaynaklı zar havuzu) ek paket `zarHavuzu` + `kaynak` (`pk-*`); SRD'de yok | yok/ertelendi | güncel (kapanış kaydı yok) | yok yok yalnız ek paket (P11 `zarHavuzu`, P12 `patlar`) |
| E4-DENETIM.md | Kader d20 `strokeOfLuck`, `darkOnesLuck`, imza `imzaFal`/`imzaYazgi` | yok/ertelendi | güncel (kapanış kaydı yok) | yok `isaret-d20` (hedef üstü işaret) Rogue Stroke of Luck, Fiend Warlock Dark One's Own Luck, Astrolog imzası |
| E4-DENETIM.md | Ruh kristali ek paket kaynağı; SRD'de yok | yok/ertelendi | güncel (kapanış kaydı yok) | yok `isaret-kristal` (işaret) yalnız ek paket |
| E4-DENETIM.md | Büyü puanı `sorceryPoints`, `innateSorcery`, `arcanum6-9` | yok/ertelendi | güncel (kapanış kaydı yok) | yok (Sorcery Points'e özel düğme metni var) yok Sorcerer (Font of Magic, Metamagic), Warlock Mystic Arcanum |
| E4-DENETIM.md | Şifa havuzu `layOnHands`, `celestialHeal`, imza `imzaHavuz`, `imzaHukumdar` | yok/ertelendi | güncel (kapanış kaydı yok) | yok `ok-yenilenme`, `iyilestir-*` (olay efekti) Paladin Lay On Hands, Celestial Şifa Eli, Birlik imzası |
| FIGHTER-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| FIGHTER-DENETIM.md | C5 Seviye atlayınca ASI/feat (7 yuva), Epic Boon, yeni Weapon Mastery (4/10/16), Additiona | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven `seruven_leveled` yalnız `sheet.level` artırır; Fighter bağlı olmadığı için "yazılmayan alan yalnız eklenir" bile çalışmaz: boş yuvalar Serüven içinde d |
| FIGHTER-DENETIM.md | C6 Alt sınıf 3. seviyede | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven'de 2 → 3'e çıkan Fighter'a alt sınıf atanmaz (`migrateSubclasses` yalnız karakter listesinde, `App.tsx:191`); Champion özellikleri (Improved Critical, R |
| FIGHTER-DENETIM.md | D5 Tactical Master | yok/ertelendi | güncel (kapanış kaydı yok) | YZ saldırı komutunda `mastery` üretmez: hiç kullanmaz yok **[YENİ]** grep `mastery` (`ai.ts`, `ai/`) |
| FIGHTER-DENETIM.md | E4 Tactical Master seçimi | yok/ertelendi | güncel (kapanış kaydı yok) | Saldırı balonunda Push/Sap/Slow seçici yok (Cunning Strike ve Brutal Strike seçicileri var); oyuncu özelliği kullanamaz yok **[YENİ]** `MapBattle.tsx:806-818, 2 |
| K62ACIK-DENETIM.md | Courage yok | yok/ertelendi | güncel (kapanış kaydı yok) | türe göre Frightened bağışıklığı alanda (yeni alan etkisi)  |
| K62ACIK-DENETIM.md | Fear yok | yok/ertelendi | güncel (kapanış kaydı yok) | türe göre alanda sürekli Frightened (yeni alan etkisi)  |
| K62ACIK-DENETIM.md | Resistance / Vulnerability yok | yok/ertelendi | güncel (kapanış kaydı yok) | türe göre alanda seçilen hasar türüne direnç/zayıflık (yeni alan etkisi + tür seçimi)  |
| K69-DENETIM.md | Squeezing (bir boy küçük alana sığma) — | yok/ertelendi | güncel (kapanış kaydı yok) | yok SRD 5.2.1'de kural yok (2014 kuralıydı): dar geçit yasak (⚠).  |
| K69-DENETIM.md | Gövde taban izi, yürüme hedefinde ayak izi — | yok/ertelendi | güncel (kapanış kaydı yok) | yok K69: gövde altıgenleri ince çizgi; yürüme nişanında varış ayak izi.  |
| K69-DENETIM.md | Hedef bilgisi `mapView.ts` `previewText` | yok/ertelendi | güncel (kapanış kaydı yok) | yok K69: "Gargantuan: 19 altıgen" satırı (TR/EN).  |
| K71C-DENETIM.md | 4 Birleşik hareket | yok/ertelendi | güncel (kapanış kaydı yok) | `move` + `toFt` (yeni isteğe bağlı alan) Yok: dikey ve yatay ayrı komut **58:** (altıgen, düzey) uzayında 3B en ucuz yol; çapraz adım (altıgen + düzey) tek adım |
| K71C-DENETIM.md | 5 Uçuş üst sınırı | yok/ertelendi | güncel (kapanış kaydı yok) | `altitudeCapFt` Açık gökte 120 ft (`irtifa.maxFt`), tavanlıda tavan − boy **58:** açık gökte `ucusUstFt` (varyant verisi; yoksa 60 ft = 12 düzey); tavanlıda ayn |
| K71C-DENETIM.md | 13 Engel tepesi (K71a) | yok/ertelendi | güncel (kapanış kaydı yok) | `obstacleTopFt` Uçan irtifa ≥ tepe ise geçer **aynı:** 20 ft duvar düzey 0–3'ü kaplar; uçan 4. düzeyden (20 ft) itibaren aşar |
| K71C-DENETIM.md | 16 Siper / görüş | yok/ertelendi | güncel (kapanış kaydı yok) | `cover.ts` `evaluateAlt` Araya giren yaratık hat onun boyu içinden geçerse **aynı:** zaten irtifa bantlı (K68c) |
| K71C-DENETIM.md | 19 Yakalama / sürükleme | yok/ertelendi | güncel (kapanış kaydı yok) | `grapple.ts` İrtifaya bakmaz **açık** (K73) |
| K71C-DENETIM.md | 20 Yerleştirme (kurulum) | yok/ertelendi | güncel (kapanış kaydı yok) | `executePlace`, `nearZone` Altıgen başına bir **aynı:** kurulumda herkes yerde |
| K71C-DENETIM.md | 24 Kayıt | yok/ertelendi | güncel (kapanış kaydı yok) | `battleSave.ts` Olaylar **aynı:** yeni olay türü yok; `move.toFt` komutta, olaylar `moved` + `altitude_changed`; `SAVE_VERSION` 22 |
| K71C-DENETIM.md | 25 Eksi düzey | yok/ertelendi | güncel (kapanış kaydı yok) | `fissure.ts` (yarık), `altitude` < 0 Yarıkta eksi irtifa **şema:** düzey işaretli tamsayı (`levelOf`), eksi düzey yalnız hücre sayımına girer, davranışı yok |
| K73B-DENETIM.md | `n` Sığ su, çamur | yok/ertelendi | güncel (kapanış kaydı yok) | yok (zorlu arazi) hayır: düşmeyi yumuşatacak derinlik yok  |
| MONK-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| MONK-DENETIM.md | A14 Heightened Step of the Wind: gönüllü yaratığı taşı | yok/ertelendi | güncel (kapanış kaydı yok) | Yok; veri notu "yaklaşık" yok **[bilinen]** probe (SotW 10: yalnız disengaged, dashed); `class-features.json:2305` |
| MONK-DENETIM.md | B2 Bir Artisan's Tools ya da Musical Instrument yetkinliği | yok/ertelendi | güncel (kapanış kaydı yok) | Araç yetkinliği modeli yok (genel; sınıfa özgü değil) yok **[YENİ, genel]** `data/classes.json` taraması |
| MONK-DENETIM.md | B6 Monk'ta Weapon Mastery yok | yok/ertelendi | güncel (kapanış kaydı yok) | Yok tam `class-features.json` (monk) |
| MONK-DENETIM.md | C3 Seviye atlamada alt sınıf (3), ASI/feat (4/8/12/16), Epic Boon (19) seçilir | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven `level_up` yalnız seviyeyi artırır; Monk `secim-degisim.json`'da yok, `set_choices` reddedilir: seçim hiç yapılamaz (özellikler otomatik gelir) yok **[b |
| MONK-DENETIM.md | D4 Patient Defense, Step of the Wind (Fleet Step dahil) | yok/ertelendi | güncel (kapanış kaydı yok) | Hiç kullanılmıyor; probe: 5. seviye 4/37 HP'de Attack > Stunning > Flurry yok **[bilinen]** probe; `grep` (ai.ts, ai/*.ts) |
| MONK-DENETIM.md | D5 Wholeness of Body | yok/ertelendi | güncel (kapanış kaydı yok) | Hiç kullanılmıyor (6. seviye 6 HP'de de Flurry) yok **[YENİ]** probe; `grep selfHeal` (ai) boş |
| MONK-DENETIM.md | D6 Quivering Palm (kurma ve bitirme) | yok/ertelendi | güncel (kapanış kaydı yok) | Hiç kullanılmıyor; kurulu titreşim de bitirilmiyor (17. seviye probe) yok **[YENİ]** probe; `grep quiveringPalm` (ai) boş |
| MONK-DENETIM.md | D7 Superior Defense | yok/ertelendi | güncel (kapanış kaydı yok) | Hiç kullanılmıyor (18. seviye, 15 HP) yok **[YENİ]** probe; `grep superior_defense` (ai) boş |
| PALADIN-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| PALADIN-DENETIM.md | A4 Hedef: "bir yaratık" (dost olması şart değil) (s. 54) | yok/ertelendi | güncel (kapanış kaydı yok) | Düşman hedef "Yalnızca kendine ya da bir dostuna" ile reddediliyor bilinçli sapma P1 (`LOH enemy`), `divine.ts:104-105` |
| RANGER-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| ROGUE-DENETIM.md | Alan Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| ROGUE-DENETIM.md | A34 Second-Story Work, Jumper (fikstür notu "DEX skoruyla") | yok/ertelendi | güncel (kapanış kaydı yok) | Motor `second-story-work` işaretini arıyor, gerçek Thief'te yok: DEX 17 / STR 8 → 8 ft yok **[YENİ, hata]** P1; `movement.ts:669-676`; fikstür 1110; `k19feat3.t |
| ROGUE-DENETIM.md | C2 Seviye atlamada Expertise (6), ASI/feat, Epic Boon, alt sınıf (3) seçimi | yok/ertelendi | güncel (kapanış kaydı yok) | `rogue` `secim-degisim.json`'da yok → `choicesBound` false: Serüven'de seçim düğmesi yok, `set_choices` "henüz bağlı değil"; yalnız seviye artar (alt sınıf vars |
| ROGUE-DENETIM.md | C3 Uzun dinlenmede Weapon Mastery türlerini değiştir | yok/ertelendi | güncel (kapanış kaydı yok) | `fitChanges('rogue', {weaponMasteries: 1}, dinlenme)` → `ok: false` yok **[YENİ]** P1 |
| ROGUE-DENETIM.md | D5 Cunning Action Dash | yok/ertelendi | güncel (kapanış kaydı yok) | YZ hiç `dash` üretmiyor: uzak düşmanda yürüdü, bonus eylem boş kaldı yok **[YENİ]** P3 |
| ROGUE-DENETIM.md | D6 Cunning Action Hide (savaşta) | yok/ertelendi | güncel (kapanış kaydı yok) | Yalnız sızma hedefinde gizlenir; savaşta avantaj için gizlenmez yok **[bilinen]** `ai.ts:2553`; CLAUDE.md Bilinen eksikler |
| SADELESTIRME-DENETIM.md | Sınıf Sv. | yok/ertelendi | güncel (kapanış kaydı yok) | Halka menü (toplam) açık soluk (yapılamaz) |
| SORCERER-DENETIM.md | 1 Distant: hedef ve alan seçicisi (`spellTargets`, `areaActSpec`, menzil vurgusu) seçili M | yok/ertelendi | güncel (kapanış kaydı yok) | Yüksek (özellik arayüzde ölü) yok (yalnız arayüz + `metamagicProblem`) ½ gün |
| SORCERER-DENETIM.md | 5 Yaratılan slotlar kalıcı olsun (`CharacterStatus` `createdSlots`, uzun dinlenmede silini | yok/ertelendi | güncel (kapanış kaydı yok) | Orta (kullanıcı kararı gerekir: F4 bilinçli sapma) yok (karakter durumu); kayıt sürümü gerekebilir 1 gün |
| SORCERER-DENETIM.md | 9 Yapay zekâ: Careful (alanda dost), Empowered, Seeking, Transmuted (direnç/zayıflığa göre | yok/ertelendi | güncel (kapanış kaydı yok) | Düşük (yalnız karar; denge tek parti ölçümüyle) yok (karar, ama Sorcerer partili `sim` ölçümü beklenir) 1–2 gün |
| SORCERER-DENETIM.md | 11 Metin düzeltmeleri TR/EN: Careful (herhangi bir yaratık), Quickened kısıtı, Extended av | yok/ertelendi | güncel (kapanış kaydı yok) | Düşük yok 1 saat |
| TUR-FEAT-ESYA-DENETIM.md | Bölüm Satır | yok/ertelendi | güncel (kapanış kaydı yok) | tam kısmi yok |
| TUR-FEAT-ESYA-DENETIM.md | T2 Human ve Tiefling boyutu Small ya da Medium, tür seçilirken (s. 86) | yok/ertelendi | güncel (kapanış kaydı yok) | `create.ts:470` her zaman `M`; karakterde boyut alanı yok yok PT1 (Human/Tiefling `size=M`); oluşturucuda seçim yok |
| TUR-FEAT-ESYA-DENETIM.md | T13 High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme (s. 85) | yok/ertelendi | güncel (kapanış kaydı yok) | `races.json` high-elf `extras` (status `none`, "henüz oyunda yok") yok veri notu; savaş etkisi küçük |
| TUR-FEAT-ESYA-DENETIM.md | T22 Rock Gnome: saat işi aygıt (AC 5, 1 HP; en çok 3) (s. 85) | yok/ertelendi | güncel (kapanış kaydı yok) | `races.json` rock-gnome `extras` (status `none`) yok veri notu ("henüz oyunda yok") |
| TUR-FEAT-ESYA-DENETIM.md | T38 Versatile: seçilen bir Origin feat (s. 86) | yok/ertelendi | güncel (kapanış kaydı yok) | `backgrounds.ts:76` `originFeatOf` (geçmiş varsa yalnız onunki) yok PT9: Human + Soldier + `originFeat: alert` → yalnız `savage-attacker`; `docs/SRD-DENETIM.md` |
| TUR-FEAT-ESYA-DENETIM.md | F9 Human Versatile: seçilen ek bir köken feat'i (s. 86) | yok/ertelendi | güncel (kapanış kaydı yok) | yok (`data/races.json` human yalnız metin; `sheetFeats` geçmişinkini döner) yok probe PF7: Human karakterin feat'leri yalnız `["savage-attacker"]`; DECISIONS "i |
| TUR-FEAT-ESYA-DENETIM.md | G16 Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir (s. 20, s. 83) | yok/ertelendi | güncel (kapanış kaydı yok) | yok: `data/backgrounds.json`'da donanım alanı yok (yalnız `data/srd/backgrounds.json`, gösterilmiyor); karakterde para alanı yok; Donanım adımı serbest seçim yo |
| TUR-FEAT-ESYA-DENETIM.md | S9 Ammunition: tek elli silahı doldurmak için boş el gerekir (s. 89) | yok/ertelendi | güncel (kapanış kaydı yok) | denetim yok yok kod okuma: Hand Crossbow/Pistol + kalkan kısıtsız |
| TUR-FEAT-ESYA-DENETIM.md | S20 Two-Handed: saldırıda iki el gerekir (s. 90) | yok/ertelendi | güncel (kapanış kaydı yok) | yalnız Lance (`commands.ts:592`) ve yan el (`hands.ts:25`) denetlenir yok probe: kalkanlı Fighter Greatsword, Longbow ve Light crossbow ile saldırabiliyor; AC 1 |
| TUR-FEAT-ESYA-DENETIM.md | Z18 Eğitimsiz zırh: Initiative (DEX kontrolü, s. 13) dezavantajlı (s. 92) | yok/ertelendi | güncel (kapanış kaydı yok) | `create.ts:846-861` inisiyatif yalnız Incapacitated/avantaj kaynaklarına bakar, `checkDis` yok yok probe: eğitimsiz Wizard + 1 düşman `startBattle` → toplam 2 z |
| TUR-FEAT-ESYA-DENETIM.md | Z20 Elven Chain: "considered trained" (s. 220) | yok/ertelendi | güncel (kapanış kaydı yok) | `itemEffects`/`armorProficient` eşyaya bakmıyor yok probe: Wizard + Chain Shirt + Elven Chain → yine `armor:untrained` (büyü yasak). Ayrıntı sihirli eşya bölümü |
| TUR-FEAT-ESYA-DENETIM.md | Z31 Two-Handed silah iki el ister: kalkanla saldırılamaz (s. 90) | yok/ertelendi | güncel (kapanış kaydı yok) | `hands.ts:35` yalnız Versatile/yan el; `weapons.ts:82` yalnız Lance yok probe: kalkan + Greatsword `attack` → `ok: true`; `characterIssues` kalkan + Greatsword  |
| TUR-FEAT-ESYA-DENETIM.md | D16 Oil: yaratığa fırlatma (DEX save, ateşte +5 Fire), alana dökme ve yakma (s. 98) | yok/ertelendi | güncel (kapanış kaydı yok) | `items-srd.json` `oil` `offCombat` ("GM nesne/yüzey aracıyla"); `data/yuzeyler.json` `oil` yüzeyi (girişte DEX 10 / Prone) yok Oyuncu fırlatamaz; GM yüzeyi SRD' |
| TUR-FEAT-ESYA-DENETIM.md | D17 Caltrops (DC 15, 1 Piercing, hız 0) ve Ball Bearings (DC 10 Prone), Utilize (s. 96) | yok/ertelendi | güncel (kapanış kaydı yok) | `offCombat`; `data/yuzeyler.json`'da caltrops yok, `slick` (Grease kuralı) var yok `grep -i caltrop src` boş; ayrı yüzey/nesne türü yok |
| TUR-FEAT-ESYA-DENETIM.md | D23 Uyum ön şartı: sınıf ya da "by a Spellcaster" (s. 205) | yok/ertelendi | güncel (kapanış kaydı yok) | Şema alanı yok (`items*.json` anahtar kümesi) yok PD11-1: Fighter 5 Wand of Fireballs'a uyumlu, Fireball + 7 yük alır |
| TUR-FEAT-ESYA-DENETIM.md | D29 Javelin of Lightning: isabette Lightning'e çevir; Lightning Bolt: 120 ft 5 ft çizgi, D | yok/ertelendi | güncel (kapanış kaydı yok) | `items-srd.json` `javelin-of-lightning` `onHit {4d6 lightning, ranged}` yok PD4-1: Longbow atışına her isabette +4d6 Lightning (çizgi/save yok; hatalı ek) |
| TUR-FEAT-ESYA-DENETIM.md | D30 Ammunition of Slaying: seçilen tür, DC 17 CON, 6d10 **Force** (yarı), sonra büyüsüz (s | yok/ertelendi | güncel (kapanış kaydı yok) | `items-srd.json` `ammunition-of-slaying` `onHit {6d10 piercing, ranged}` yok PD4-2: humanoid hedefe her menzilli isabette 6d10 Piercing, save ve tür yok (DECISI |
| TUR-FEAT-ESYA-DENETIM.md | D33 Şarjların kalıcılığı ve şafakta yenilenme (1d6+1 vb.), son yükte 1d20 (s. 206 "Charges | yok/ertelendi | güncel (kapanış kaydı yok) | `src/app/partyStatus.ts:14` `withStatus` → `resources: { ...s.resources }` (durumdaki kaynaklar yalnız sınıf/feat; `characterRest.ts:61`) yok PD10-1/2: kayıtlı  |
| WARLOCK-DENETIM.md | yok 1 | yok/ertelendi | güncel (kapanış kaydı yok) |  |
| WARLOCK-DENETIM.md | F5c Hurl: slotla yenileme ("Pact slotu harca, eylem yok, kullanım geri gelir") | yok/ertelendi | güncel (kapanış kaydı yok) | Yok kısmi **[YENİ]** `grep hurlThroughHell`: yalnız `apex.ts` ve kaynak tanımı |
| WILD-SHAPE-BICIMLER-DENETIM.md | G0 Hız (yürüme, uçma, yüzme, tırmanma, kazma), duyular, AC, boyut, direnç/bağışıklık, duru | yok/ertelendi | güncel (kapanış kaydı yok) | biçimden tam yok |
| WILD-SHAPE-BICIMLER-DENETIM.md | G2 Saldırılar | yok/ertelendi | güncel (kapanış kaydı yok) | saldırı zarlı olanlar silah seçeneği (biçimin to-hit ve hasarı), save'li/şarjlı olanlar canavar saldırısı; ikisi de arayüzde seçilebiliyor tam yok (Y16) |
| WILD-SHAPE-BICIMLER-DENETIM.md | Girdi Tür | yok/ertelendi | güncel (kapanış kaydı yok) | Biçim Tam Kısmi |
| WILD-SHAPE-DENETIM.md | Yok 5 | yok/ertelendi | güncel (kapanış kaydı yok) |  |
| WILD-SHAPE-DENETIM.md | A10 Uzun dinlenmede bilinen bir biçim değiştirilebilir | yok/ertelendi | güncel (kapanış kaydı yok) | WS92: Serüven'de parti çubuğundan (`form_swap`): boş yere ekleme her zaman, dolu listede uzun dinlenmeden sonra bir değişim; Serüven dışında oluşturucuda serbes |
| WILD-SHAPE-DENETIM.md | A11 Süre: Druid seviyesinin yarısı kadar saat | yok/ertelendi | güncel (kapanış kaydı yok) | sayaç yok; biçim savaş sonunda biter (savaş saatlerden kısa) bilinçli (kullanıcı kararı, WS92) `druid.ts:170–172` (yalnız 0 HP / Incapacitated) |
| WILD-SHAPE-DENETIM.md | A44 Ekipman yere düşer, kaynaşır (etkisiz) ya da giyilir | yok/ertelendi | güncel (kapanış kaydı yok) | WS92 (92+): eşya kaynaşır: AC ve kurtarma eki (Cloak of Protection) biçimde işlemez, biçim bitince geri gelir; "giyilir" seçeneği yok (⚠ GM kararı) tam `druid.t |
| WILD-SHAPE-DENETIM.md | B6 Wild Resurgence: kullanımla 1. seviye slot, uzun dinlenmede bir | yok/ertelendi | güncel (kapanış kaydı yok) | savaşta aynen; WS92: harcanmayan slot savaş sonunda karaktere yazılır (üst sınır tablonun en çoğu) tam `druid.ts:206–210`; `partyStatus.ts:50` (`min`) |
| WILD-SHAPE-DENETIM.md | B12 Beast Spells istisnası: bedeli yazılı ya da tüketilen malzemeli büyü yapılamaz | yok/ertelendi | güncel (kapanış kaydı yok) | WS92 (92+): biçimde reddedilir (`spellComponents` `gp`/`consumed`) tam `spells.ts:544`; D2 |
| WILD-SHAPE-DENETIM.md | C3 Savaş kurulumunda başlangıç biçimi | yok/ertelendi | güncel (kapanış kaydı yok) | WS92 (92+): kurulumda "biçimde başla" (Game Master ve Serüven kurulumu; kullanım harcanır, kurulumda çıkış yok) tam `app/setup.ts`, `GmScreen.tsx` (karşılık yok |
| WILD-SHAPE-DENETIM.md | C5 Biçim kartı | yok/ertelendi | güncel (kapanış kaydı yok) | jeton biçimin; WS92: çekmecede "Wild Shape biçimi: X · geçici HP N · savaş sonunda biter" satırı (TR/EN) tam `druid.ts:90` (`avatar`), `MapBattle.tsx` `Drawer` |
| WILD-SHAPE-DENETIM.md | C10 Yapay zekânın biçimden çıkması | yok/ertelendi | güncel (kapanış kaydı yok) | WS92 (92+): biçimin geçici HP'si bitmiş, slotu olan (Beast Spells'siz) druid bonus eylemle döner tam `ai.ts:2041–2046` |
| WILD-SHAPE-DENETIM.md | C11 Savaş sonrası | yok/ertelendi | güncel (kapanış kaydı yok) | kullanımlar, HP ve Wild Resurgence slotu karaktere yazılır; biçim ve geçici HP savaş sonunda biter bilinçli (kullanıcı kararı, WS92) `partyStatus.ts:40–58`; D10 |
| WILDSHAPE-DENETIM.md | Toprak Çemberi / Circle of the Land SRD (fikstür `srd-alt-siniflar.json`, aynı kimlik pake | yok/ertelendi | güncel (kapanış kaydı yok) | Yok: büyü listesi, Land's Aid, Natural Recovery, Nature's Ward, Nature's Sanctuary dövüş formunu geliştirmiyor çalışır (5/5)  |
| WIZARD-DENETIM.md | Bölüm tam | yok/ertelendi | güncel (kapanış kaydı yok) | kısmi yok sapma |
| WIZARD-DENETIM.md | A14 Spell Mastery büyüleri **casting time "Action"** olmalı (s. 79) | yok/ertelendi | güncel (kapanış kaydı yok) | Kontrol yok; yalnız `reaction` dışlanır. Bonus eylemli Misty Step seçilebilir, seçim yoksa o seviyedeki ilk hazır büyü (Misty Step dahil) atanır. 1 saat/ritüel  |
| WIZARD-DENETIM.md | A17 Potent Cantrip: **saldırı zarı ıskalayınca** yarı hasar (s. 82) | yok/ertelendi | güncel (kapanış kaydı yok) | Uygulanmıyor: Fire Bolt ıska → 0 hasar (`potentCantrip` yalnız `saveDamage` çağrılarında) yok T1, `src/battle/spells.ts:105` (tek kullanım 298, 814); `src/battl |
| WIZARD-DENETIM.md | B10 Büyü kopyalama: kitaba 2 saat + 50 GP/seviye, kitaptan kitaba 1 saat + 10 GP/seviye, d | yok/ertelendi | güncel (kapanış kaydı yok) | Yok: altın/zaman ekonomisi ve defter nesnesi yok, büyü kitabı serbest seçim sapma (bilinçli kapsam dışı) `src/rules/builder.ts` (maliyet yok) |
| WIZARD-DENETIM.md | C7 Uzun dinlenmeden sonra hazır büyü/cantrip/Spell Mastery değiştirme (s. 77, 79) — Serüve | yok/ertelendi | güncel (kapanış kaydı yok) | **Serüven'de yok:** parti, seçim anındaki `sheet` kopyası; Serüven içinde karakter düzenlenemez, dinlenmeden sonra liste sabit. (C-B11 serbest düzenleme yalnız  |
| WIZARD-DENETIM.md | C8 Seviye atlarken kitaba +2 büyü, hazır sayı artışı, alt sınıf (3.), ASI | yok/ertelendi | güncel (kapanış kaydı yok) | Serüven `level_up` yalnız `sheet.level` artırır: kitap/hazır liste/ASI/alt sınıf seçimi yok (kod okumasıyla, denenmedi: 1. seviyeden başlayan büyücü 3+'da alt s |
| WIZARD-DENETIM.md | D2 Overchannel | yok/ertelendi | güncel (kapanış kaydı yok) | YZ hiç kullanmaz (`overchannel` bayrağı yalnız arayüzden) yok `grep overchannel src/battle/ai*` boş |
| YZ-DENETIM.md | Yüzeye itme (yağlı/yanıcı altıgen) K53 + K55 | yok/ertelendi | güncel (kapanış kaydı yok) | yok  |
| YZ-DENETIM.md | Hazırla (Ready), Gizlen (yapay zekâ) yok (eski) | yok/ertelendi | güncel (kapanış kaydı yok) |  |

## 2. Bilinçli ertelenen (otomatik)

| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |
|---|---|---|---|---|
| SRD-KAPSAM Sınıflar s. 29 | Barbarian: Primal Knowledge (3. sv) | kısmi | güncel, ertelendi | Serüven'de 3. seviyedeki ek sınıf becerisi seçilemez: seçim kipinde beceri alanı yok (`CHOICE_FIELDS`; C6, B95-C ertelendi); Seçim kipinde eksik sınıf becerisini yalnız ekleme (ortak yardımcı; öneri 2 |
| SRD-KAPSAM Sınıflar s. 31 | Bard: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | 3 müzik aleti yetkinliği yok (alet modeli yok; B98 ertelendi); ekipman önerisi Rapier + Dagger (SRD A: Leather, 2 Dagger, enstrüman, Entertainer's Pack, 19 GP; paket/GP genel SD3); Öneriyi 2 Dagger ya |
| SRD-KAPSAM Sınıflar s. 33 | Bard: Countercharm (7. sv) | kısmi | güncel, ertelendi | Harita/efsanevi `saveEffect` yolundaki Charmed/Frightened save'lerinde yok (A13, B94 ertelendi); B94 alan/aura uzantısına test bulunamadı; Ortak `saveEffect` yoluna ikinci şans zarı; alan/aura uzantıs |
| SRD-KAPSAM Sınıflar s. 41 | Druid: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | bilinçli sapma: Herbalism Kit alet yetkinliği yok (alet modeli yok; B98 ertelendi); ekipman önerisi Leather + Shield + Quarterstaff + Sickle, paket/kit/9 GP ve B seçeneği yok (SD3); Alet yetkinliği be |
| SRD-KAPSAM Sınıflar s. 42 | Druid: Primal Order (1. sv) | kısmi | güncel, ertelendi | bilinçli sapma: Magician'ın Arcana/Nature WIS bonusu yok (beceri kontrolü sistemi yok; B8, B98 ertelendi); Beceri/kontrol sistemiyle birlikte (B98) |
| SRD-KAPSAM Sınıflar s. 42 | Druid: Wild Shape (2. sv) | kısmi | güncel, ertelendi | bilinçli: süre sayacı yok, biçim/geçici HP savaş sonunda biter (A11, C11); tür direnci birleşimi ⚠ (A29); yok: nesne tutma (A43), multiHex sığması (A46, ertelendi); YZ: biçime yalnız slot bitince; mul |
| SRD-KAPSAM Sınıflar s. 43 | Druid: Wild Companion (2. sv) | kısmi | güncel, ertelendi | bilinçli sapma: familiar yalnız savaş süresince (Long Rest'e dek sürmez; C7); YZ: kullanmıyor (D2, ertelendi) |
| SRD-KAPSAM Sınıflar s. 43 | Druid: Wild Resurgence (5. sv) | kısmi | güncel, ertelendi | bilinçli sapma: harcanacak slot seçilemez, hep en düşük (A7); YZ: kullanmıyor (D2, ertelendi); Slot seçimi arayüzü (öneri 9) |
| SRD-KAPSAM Sınıflar s. 43 | Druid: Improved Elemental Fury (15. sv) | kısmi | güncel, ertelendi | +300 ft Druid listesinde olmayan cantrip'e de (Fire Bolt 120 → 420; A14, B94 ertelendi); Primal Strike 2d8 yalnız probe; Menzil hesabına sürüm ileterek `Drd` süzgeci (öneri 6); 2d8 için test |
| SRD-KAPSAM Sınıflar s. 47 | Fighter: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | Başlangıç ekipmanı A/B/C paket seçimi yok: öneri + serbest donanım (genel, SD3; TE99 C ertelendi); Başlangıç donanımı paket/altın seçimi (tüm sınıflara ortak, Serüven sonrası) |
| SRD-KAPSAM Sınıflar s. 61 | Ranger / alt sınıf: Superior Hunter's Defense (15. sv) | kısmi | güncel, ertelendi | Süren hasar, büyü alanı/aura, harita mekaniği ve düşme hasarında tetiklenmez (ortak hasar girişi yok; B94'te ertelendi). YZ: öneri yalnız ağır hasarda (D5, bilinçli); Ortak hasar girişine tepki kancas |
| SRD-KAPSAM Sınıflar s. 61 | Rogue: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | Başlangıç donanımı A/B paketi yok (öneri genel, TE99'da ertelendi); Thieves' Tools envanter modeli yok (yetkin olan taşıyor sayılır, TE99 ⚠).; Oluşturucuya sınıf başlangıç paketi (A/B ya da GP); envan |
| SRD-KAPSAM Sınıflar s. 64 | Sorcerer: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | Başlangıç donanımı A/B paketi yok (öneri yalnız Dagger; genel, SD3/TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| SRD-KAPSAM Sınıflar s. 66 | Sorcerer / seçenek: Careful Spell (2. sv) | kısmi | güncel, ertelendi | Yalnız alan yolunda ve yalnız dostlar, seçim yok (ilk N dost); düşman/tarafsız korunamaz; tek hedefli save büyüsünde etkisiz ama puan gider (M1, ertelendi).; Hedef seçici (herhangi yaratık); tek hedef |
| SRD-KAPSAM Sınıflar s. 70 | Sorcerer / alt sınıf: Dragon Wings (14. sv) | kısmi | güncel, ertelendi | Kanatlar istenince kapatılamaz (SRD 'until you dismiss them'; D4 ertelendi); YZ: kullanmıyor.; Eylemsiz kapatma komutu (yeni kural sürümü). |
| SRD-KAPSAM Sınıflar s. 70 | Sorcerer / alt sınıf: Dragon Companion (18. sv) | kısmi | güncel, ertelendi | Slotlu Summon Dragon yapımında 'konsantrasyonsuz (1 dk)' seçeneği yok (D5, ertelendi); YZ: kullanmıyor.; cast_spell'e konsantrasyonsuz seçeneği. |
| SRD-KAPSAM Sınıflar s. 70 | Warlock: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | Başlangıç donanımı A/B paketi yok (denetlenmedi; genel eksik, TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| SRD-KAPSAM Sınıflar s. 72 | Warlock: Magical Cunning (2. sv) | kısmi | güncel, ertelendi | bilinçli sapma: savaşta yok, yalnız karakter listesi dinlenme panelinde (A3); Arayüz: Serüven/yolculuk/kurulum dinlenmesinde düğme yok (C6, ertelendi).; Serüven ve kurulum dinlenme kartına düğme. |
| SRD-KAPSAM Sınıflar s. 76 | Warlock / alt sınıf: Dark One's Own Luck (6. sv) | kısmi | güncel, ertelendi | bilinçli sapma: kullanım yalnız zar tutarsa harcanır (SRD: eklenince) ve oyuncuya sorulmaz (F3, ertelendi; denge ölçümü gerekir).; Karar + B98 'ask' deseni. |
| SRD-KAPSAM Sınıflar s. 77 | Wizard: Çekirdek özellikler (1. sv) | kısmi | güncel, ertelendi | Başlangıç donanımı A/B paketi (Spellbook, Quarterstaff odak, Robe…) yok (genel, TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| SRD-KAPSAM Sınıflar s. 104 | Wizard: Ritüel yapımı (genel kural) (1. sv) | kısmi | güncel, ertelendi | bilinçli sapma: oyun verisinde ritüel bayrağı yok; SRD'de ritüel olmayan Animate Dead savaşta yapılmasın diye ritüel sayılıyor (A11, ertelendi); ritüel döküm yalnız kurulumda.; spells.json'a SRD ritua |
| SRD-KAPSAM Karakter kökenleri s. 83 | Geçmiş: Soldier (yetenekler, köken feat'i savage-attacker, beceriler, alet, donanım) | kısmi | güncel, ertelendi | G14 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 87 | Geçmiş kuralı: Skilled: "üç beceri ya da alet" | kısmi | güncel, ertelendi | G10 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 20 | Geçmiş kuralı: Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj (s.  | kısmi | güncel, ertelendi | G13 bilinçli sapma: ertelendi (genel alet yetkinliği; yalnız Thieves' Tools savaşta) |
| SRD-KAPSAM Karakter kökenleri s. 20 | Geçmiş kuralı: Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir (s. 20, s | yok | güncel, ertelendi | G16 yok: ertelendi (başlangıç donanımı A/50 GP) |
| SRD-KAPSAM Karakter kökenleri s. 84 | Tür Dragonborn: Draconic Flight | kısmi | güncel, ertelendi | T7 kısmi: kısmen düzeldi (99: kaynak uzun dinlenmeye bağlı); Incapacitated olunca bitme ertelendi |
| SRD-KAPSAM Karakter kökenleri s. 84 | Tür Dwarf: Stonecunning | kısmi | güncel, ertelendi | T11 kısmi: kısmen düzeldi (99: kaynak kalıcı); Tremorsense ↔ yeri bilme ertelendi |
| SRD-KAPSAM Karakter kökenleri s. 85 | Tür Gnome: Rock Gnome | kısmi | güncel, ertelendi | T22 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 85 | Tür Goliath: Large Form | kısmi | güncel, ertelendi | T29 kısmi: kısmen düzeldi (99: kaynak kalıcı); multiHex sığma ertelendi |
| SRD-KAPSAM Karakter kökenleri s. 86 | Tür Halfling: Luck | kısmi | güncel, ertelendi | T34 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 86 | Tür Halfling: Naturally Stealthy | kısmi | güncel, ertelendi | T35 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 86 | Tür Tiefling: Otherworldly Presence | kısmi | güncel, ertelendi | T43 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 86 | Tür kuralı: Human ve Tiefling boyutu Small ya da Medium, tür seçilirken | yok | güncel, ertelendi | T2 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Karakter kökenleri s. 85 | Tür kuralı: High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme | yok | güncel, ertelendi | T13 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Feat'ler s. 87 | Alert (Origin) | kısmi | güncel, ertelendi | F17 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Feat'ler s. 87 | Grappler (General) | kısmi | güncel, ertelendi | F5 kısmi: ertelendi (bu turun kapsamı dışında); F25 doğrulanmadı: doğrulandı (test, hata yok) |
| SRD-KAPSAM Feat'ler s. 88 | Boon of Spell Recall (Epic Boon) | kısmi | güncel, ertelendi | F35 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 89 | Silah özelliği: Ammunition | kısmi | güncel, ertelendi | S8 bilinçli sapma: değişmedi (bilinçli sapma); S9 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 89 | Silah özelliği: Light | kısmi | güncel, ertelendi | S25 kısmi: ertelendi (metin belirsiz: Nick hangi silahta, K-S2) |
| SRD-KAPSAM Donanım s. 89 | Silah özelliği: Reach | kısmi | güncel, ertelendi | S17 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 89 | Silah özelliği: Thrown | kısmi | güncel, ertelendi | S19 bilinçli sapma: değişmedi (bilinçli sapma); S33 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 90 | Weapon Mastery: Sap | kısmi | güncel, ertelendi | S27 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 90 | Weapon Mastery: Vex | kısmi | güncel, ertelendi | S30 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 183 | Silah kuralı: Improvised Weapons: PB yok, 1d4, GM benzer silahı o silah sayabilir | kısmi | güncel, ertelendi | S32 kısmi: kısmen düzeldi (99: nesne silahı 1d4; eşdeğer silah yetkinliği ertelendi) |
| SRD-KAPSAM Donanım s. 98 | Silah kuralı: Net: Attack'in bir saldırısı yerine, 15 ft, görülen yaratık, DEX save DC 8+D | kısmi | güncel, ertelendi | S35 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 49 | Silah kuralı: Martial Arts: Monk silahlarında DEX ve Martial Arts zarı (yakın dövüşle sını | kısmi | güncel, ertelendi | S36 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 92 | Zırh kuralı: Eğitimsiz kalkanda hiçbir AC faydası yok | kısmi | güncel, ertelendi | Z12 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 220 | Zırh kuralı: Elven Chain: "considered trained" | yok | güncel, ertelendi | Z20 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 210 | Zırh kuralı: Sihirli zırh +N: yalnız o zırh türüne (Armor, +N "any"; Dwarven Plate = Plate | kısmi | güncel, ertelendi | Z29 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 231 | Zırh kuralı: Mithral Armor: Stealth dezavantajı ve Strength şartı kalkar | kısmi | güncel, ertelendi | Z30 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 94 | Eşya: Ammunition | kısmi | güncel, ertelendi | D21 kısmi: ertelendi (cephane stoku); D27 kısmi: kısmen düzeldi (99: yalnız cephaneli silah; parçanın tek kullanımı ertelendi); D30 kısmi: kısmen düzeldi (99: yalnız cephaneli silah; tür, DC 17 CON, F |
| SRD-KAPSAM Donanım s. 96 | Eşya: Ball Bearings | kısmi | güncel, ertelendi | D17 yok: ertelendi (Utilize eşyaları) |
| SRD-KAPSAM Donanım s. 97 | Eşya: Hunting Trap | kısmi | güncel, ertelendi | D18 yok: ertelendi (Utilize eşyaları) |
| SRD-KAPSAM Donanım s. 98 | Eşya: Net | kısmi | güncel, ertelendi | D14 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 98 | Eşya: Oil | kısmi | güncel, ertelendi | D9 doğrulanmadı: doğrulandı (44 kayıt testi, hata yok); D16 yok: ertelendi (Utilize eşyaları) |
| SRD-KAPSAM Donanım s. 99 | Eşya: Spell Scroll | kısmi | güncel, ertelendi | D37 bilinçli sapma: ertelendi (Game Master eşyalarının `bonus`'u) |
| SRD-KAPSAM Donanım s. 100 | Eşya: Torch | kısmi | güncel, ertelendi | D20 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 204 | Donanım kuralı: İksir sarf edilir, "used up" (s. 204); envanterde birden çok iksir | kısmi | güncel, ertelendi | D3 kısmi: ertelendi (gerçek envanterden iksir düşmesi) |
| SRD-KAPSAM Donanım s. 99 | Donanım kuralı: Basic Poison: Bonus Action, yalnız Piercing/Slashing hasarda +1d4 Poison,  | kısmi | güncel, ertelendi | D15 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 97 | Donanım kuralı: Healer's Kit: Utilize ile zarsız stabilize, 10 kullanım | kısmi | güncel, ertelendi | D19 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 205 | Donanım kuralı: Uyum ön şartı: sınıf ya da "by a Spellcaster" | yok | güncel, ertelendi | D23 yok: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 253 | Donanım kuralı: Weapon +1/+2/+3: o silahla saldırı ve hasar | kısmi | güncel, ertelendi | D26 kısmi: ertelendi (eşya ↔ silah bağı yeni şema ister, K-D2) |
| SRD-KAPSAM Donanım s. 223 | Donanım kuralı: Flame Tongue: Bonus Action ile tutuşur, tutuşukken +2d6 Fire, 40 ft parlak | kısmi | güncel, ertelendi | D28 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 228 | Donanım kuralı: Javelin of Lightning: isabette Lightning'e çevir; Lightning Bolt: 120 ft 5 | kısmi | güncel, ertelendi | D29 kısmi: kısmen düzeldi (99: +4d6 kalktı, Javelin Lightning türü; Lightning Bolt ertelendi) |
| SRD-KAPSAM Donanım s. 209 | Donanım kuralı: Diğer isabet ekli silahlar (24 `onHit`; Dragon/Giant Slayer, Holy Avenger, | kısmi | güncel, ertelendi | D31 kısmi: ertelendi (eşya ↔ silah bağı, K-D2) |
| SRD-KAPSAM Donanım s. 233 | Donanım kuralı: Yüklü büyü eşyaları: Wand of Magic Missiles (1–3 yük, yük başına +1 seviye | kısmi | güncel, ertelendi | D32 kısmi: kısmen düzeldi (yük kalıcı; yükle yukarı seviye ertelendi) |
| SRD-KAPSAM Donanım s. 214 | Donanım kuralı: Boots of Speed: Bonus Action ile hız ×2 ve fırsat saldırısına dezavantaj,  | kısmi | güncel, ertelendi | D34 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 215 | Donanım kuralı: Cloak of Displacement: saldırılara dezavantaj; hasar alınca sonraki turuna | kısmi | güncel, ertelendi | D35 kısmi: ertelendi (bu turun kapsamı dışında) |
| SRD-KAPSAM Donanım s. 251 | Donanım kuralı: Wand of the War Mage +N: yalnız büyü saldırısına +N ve yarım siperi yok sa | kısmi | güncel, ertelendi | D36 kısmi: ertelendi (bu turun kapsamı dışında) |
| DECISIONS.md:38 | **Ertelendi (SRD-12 sınıf özelliği sapmaları, gerekçe):** Cutting Words yalnız isabette (tetik `miss` ve hasar | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:75 | **Eksik, ertelendi:** Storm of Vengeance 2–10. tur aşamaları (`stages` verisi motor tarafından okunmuyor; yaln | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:211 | **Ertelendi (belge):** **B40 Unconscious eşya düşürme** (s. 191 "you drop whatever you're holding"): yapay zek | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:279 | eşya/tür kaynağı savaş sonunda kayıtlı değerinde kalır. **Ertelendi:** son yükte 1d20 imha, değnek yüküyle yuk | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:287 | Bor (Light crossbow) ve Rook (Longbow) kalkanlı: 99'da yay seçenekleri yok, denge ölçülmedi. **Ertelendi:** sa | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:322 | `escape` komutu (eylem) Prone verip söndürür. **Ertelendi (metin belirsiz, K-S2):** Nick'in hangi silahta sayı | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:348 | **Ertelendi (yapılmadı):** Druid Primal Order Magician'ın Arcana/Nature bonusu ve müzik aleti (ve genel alet)  | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:4317 | `asitHavuzu` **ertelendi, panelden gizlendi** (`gizli: true`; `HouseRulesPanel` göstermez): amaç K13B'de yalnı | ertelendi | güncel, ertelendi |  |
| DECISIONS.md:9278 | **Ertelendi — Adım 5b:** Alan şekilleri (koni, küre, çizgi, yayılım) ve alan büyülerinde | ertelendi | güncel, ertelendi |  |
| BARD-DENETIM.md | B2 / K3 Ertelendi: müzik aleti (alet) yetkinliği; beceri/alet kontrol sistemi yok, savaşsı | yok/ertelendi | güncel, ertelendi | —  |
| DRUID-DENETIM.md | B8 / B2 Ertelendi: Magician'ın Arcana/Nature bonusu ve alet yetkinliği; beceri/alet kontro | yok/ertelendi | güncel, ertelendi | —  |
| TUR-FEAT-ESYA-DENETIM.md | T2 Human ve Tiefling boyutu Small ya da Medium, tür seçilirken | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | T13 High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | T22 Rock Gnome: saat işi aygıt (AC 5, 1 HP; en çok 3) | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | T34 Luck: D20 Test'te doğal 1 yeniden atılır | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | T35 Naturally Stealthy: en az bir boy büyük yaratıkla örtülüyken Hide | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | T43 Otherworldly Presence: Thaumaturgy cantrip'i, Legacy yeteneğiyle | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | C1 Celestial: Medium ya da Small (bizim veri `sizes: ["M","S"]`) | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | C5 Celestial kalıcı ırk (K49, sürüm 22+) ile metin | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | L2 Tiefling Kanatlı: metin "soy hasar direncini kaybedersin; orta/ağır zırhla uçamazsın" | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | F5 Ön koşul yeteneği: Grappler "Strength or Dexterity 13+" | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | F17 Alert Initiative Swap: inisiyatiften hemen sonra gönüllü bir dostla takas, ikisi de In | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | F35 Boon of Spell Recall, Free Casting: 1–4. seviye slotla her büyüde 1d4 = slot seviyesi  | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | G10 Skilled: "üç beceri **ya da alet**" | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | G13 Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj | yok/ertelendi | güncel, ertelendi | ertelendi (genel alet yetkinliği; yalnız Thieves' Tools savaşta)  |
| TUR-FEAT-ESYA-DENETIM.md | G14 Seçmeli alet: Soldier "one kind of Gaming Set" (s. 83); bizim Soylu (Gaming Set), Soyt | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | G16 Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir | yok/ertelendi | güncel, ertelendi | ertelendi (başlangıç donanımı A/50 GP)  |
| TUR-FEAT-ESYA-DENETIM.md | S9 Ammunition: tek elli silahı doldurmak için boş el gerekir | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S17 Reach: +5 ft erişim; fırsat saldırısında da o silahla | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S25 Nick: Light ek saldırısı Attack eyleminin içinde, turda bir | yok/ertelendi | güncel, ertelendi | ertelendi (metin belirsiz: Nick hangi silahta, K-S2)  |
| TUR-FEAT-ESYA-DENETIM.md | S27 Sap: isabet alan yaratığın senin sonraki turunun başına dek sonraki saldırı zarı dezav | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S30 Vex: hasarlı isabette o yaratığa sonraki saldırı zarı avantajlı, sonraki turunun sonun | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S33 Improvised: menzilli silahla yakın dövüş, Thrown'suz yakın silahı fırlatma (1d4, 20/60 | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S35 Net: Attack'in bir saldırısı yerine, 15 ft, görülen yaratık, DEX save DC 8+DEX+PB, Res | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | S36 Martial Arts: Monk silahlarında DEX ve Martial Arts zarı (yakın dövüşle sınırlı değil) | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | Z12 Eğitimsiz kalkanda hiçbir AC faydası yok | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | Z20 Elven Chain: "considered trained" | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | Z29 Sihirli zırh +N: yalnız o zırh türüne (Armor, +N "any"; Dwarven Plate = Plate; Elven C | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | Z30 Mithral Armor: Stealth dezavantajı ve Strength şartı kalkar | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D3 İksir sarf edilir, "used up" (s. 204); envanterde birden çok iksir | yok/ertelendi | güncel, ertelendi | ertelendi (gerçek envanterden iksir düşmesi)  |
| TUR-FEAT-ESYA-DENETIM.md | D14 Net: 15 ft, Restrained; **Huge+ otomatik başarı**; DC 10 STR (Athletics) kurtulma, ağ  | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D15 Basic Poison: Bonus Action, yalnız Piercing/Slashing hasarda +1d4 Poison, 1 dakika **y | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D16 Oil: yaratığa fırlatma (DEX save, ateşte +5 Fire), alana dökme ve yakma | yok/ertelendi | güncel, ertelendi | ertelendi (Utilize eşyaları)  |
| TUR-FEAT-ESYA-DENETIM.md | D17 Caltrops (DC 15, 1 Piercing, hız 0) ve Ball Bearings (DC 10 Prone), Utilize | yok/ertelendi | güncel, ertelendi | ertelendi (Utilize eşyaları)  |
| TUR-FEAT-ESYA-DENETIM.md | D18 Hunting Trap (DC 13, 1d4, zincir), Manacles (DC 13 bağlama) | yok/ertelendi | güncel, ertelendi | ertelendi (Utilize eşyaları)  |
| TUR-FEAT-ESYA-DENETIM.md | D19 Healer's Kit: Utilize ile zarsız stabilize, 10 kullanım | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D20 Torch 20 ft parlak + 20 ft loş, Simple Melee saldırı 1 Fire; Lantern Hooded 30+30, Bul | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D21 Ammunition özelliği: atış başına 1 cephane, bitince atış yok; savaştan sonra yarısı ge | yok/ertelendi | güncel, ertelendi | ertelendi (cephane stoku)  |
| TUR-FEAT-ESYA-DENETIM.md | D23 Uyum ön şartı: sınıf ya da "by a Spellcaster" | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D26 Weapon +1/+2/+3: **o silahla** saldırı ve hasar | yok/ertelendi | güncel, ertelendi | ertelendi (eşya ↔ silah bağı yeni şema ister, K-D2)  |
| TUR-FEAT-ESYA-DENETIM.md | D28 Flame Tongue: Bonus Action ile tutuşur, tutuşukken +2d6 Fire, 40 ft parlak + 40 ft loş | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D31 Diğer isabet ekli silahlar (24 `onHit`; Dragon/Giant Slayer, Holy Avenger, Mace of Dis | yok/ertelendi | güncel, ertelendi | ertelendi (eşya ↔ silah bağı, K-D2)  |
| TUR-FEAT-ESYA-DENETIM.md | D34 Boots of Speed: Bonus Action ile hız ×2 **ve fırsat saldırısına dezavantaj**, toplam 1 | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D35 Cloak of Displacement: saldırılara dezavantaj; hasar alınca sonraki turuna dek, hız 0' | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D36 Wand of the War Mage +N: **yalnız büyü saldırısına** +N ve yarım siperi yok sayma | yok/ertelendi | güncel, ertelendi | ertelendi (bu turun kapsamı dışında)  |
| TUR-FEAT-ESYA-DENETIM.md | D37 (c) grubu, 14 eşya: Vorpal Sword, Nine Lives Stealer, Defender, Berserker Axe, Energy  | yok/ertelendi | güncel, ertelendi | ertelendi (Game Master eşyalarının `bonus`'u)  |
| WILD-SHAPE-DENETIM.md | A46 multiHex açıkken Large/Huge biçimin sığması | yok/ertelendi | güncel, ertelendi | sığma denetimi yok: Brown Bear gövdesi dolu altıgenle çakıştı; **ertelendi** (kullanıcı kararı, WS92) yok `druid.ts:136–167` (`bodyFitProblem` yok); D (çok altı |

## 3. Karar gerektiren (otomatik toplanan; numaralı sorular yukarıda "Karar gerekli" bölümünde)

| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |
|---|---|---|---|---|
| SRD-KAPSAM Oynama kuralları s. 17 | Dropping to 0 HP: anında ölüm, baygınlık, Knocking Out | kısmi | güncel, karar bekliyor | D10 yok: Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unc…; Knocking Out seçeneği yok (karar gerekli 7) **[Gece kuyruğu]** D10 Knocking Out kapandı (101). |
| SRD-KAPSAM Karakter oluşturma s. 25 | Multiclassing: XP, HP ve HP zarları, PB, yetkinlikler, sınıf özellikleri (Extra Attack, Un | yok | güncel, karar bekliyor | önce karar: çoklu sınıf kapsamı |
| SRD-KAPSAM Sınıflar s. 51 | Monk: Stunning Strike (5. sv) | kısmi | güncel, karar bekliyor | Yorum: isabet anı yerine "bu tur son vurulan hedef" (K2 karar bekliyor); fırsat saldırısındaki isabette kullanım doğrulanmadı (A38); K2 kararı; fırsat saldırısı senaryosunu teste çevir |
| GENEL-SAVAS-DENETIM A45 | YZ: Dash | yok | güncel, karar bekliyor | **Ertelendi 2026-11-20 (denge etkisi, karar bekliyor).** Hiçbir savaşçı Dash eylemi seçmiyor (yalnız canavar yeteneği `grant: dash`, kontrollü binek) |
| GENEL-SAVAS-DENETIM B40 | Unconscious: elindekini düşürür | yok | güncel, karar bekliyor | **Ertelendi, karar gerekli (GENEL96):** YZ yerden silah almıyor; uyanan YZ silahsız kalırdı. Önce: Silahlar elde kalıyor (el modeli S2'de var ama bağlı değil) |
| GENEL-SAVAS-DENETIM G6 | Long Rest başlamak için **en az 1 HP** (s.185) | yok | güncel, karar bekliyor | 0 HP'deki (ölü olmayan) karakter tam HP'ye döner. Geçerli olduğu yerler: karakter listesi, Game Master "Hepsini dinlendir", yolculuk, Serüven dinlenme düğümü ve han. **Ertelendi, karar gerekli (2026-1 |
| DECISIONS.md:23 | **3. Saldırı ekleri — ertelendi, karar gerekli:** yapışma (Stirge Proboscis, Darkmantle Crush, Cloaker Attach: | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:76 | öneri BUYU-TAM-TARAMA §4.1. **Karar gerekli** (§4): savaş dışı süreler, eşya büyüleri, Wish serbest dilek, mal | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:106 | 1 HP'de kalır, uyanma Serüven zamanına bağlanmadı (⚠). Esir alma yok (karar gerekli değil; SRD'de yok). | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:135 | **5e. Eşyayı silaha bağlama — ertelendi, karar gerekli:** SRD tanımlı (s. 253 Weapon +1/+2/+3 "You have a bonu | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:222 | **Ertelendi, karar gerekli:** | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:362 | avantaj + dezavantaj = normal, 5 ft içi otomatik kritik aynen; uyanınca Prone kalır. **Ertelendi, karar gerekl | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:391 | **Ertelendi, karar gerekli:** el başına bir yakalama / boş el (C17: el modeli tek elli kalkan + yan el kombina | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:405 | **Ertelendi, karar gerekli (C):** Stroke of Luck oyuncuya sorulsun mu ve 20'ye çevrilen saldırı kritik mi; Mon | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:425 | **Bekleyen:** B (sürümlü düzeltmeler) o sırada `birlesik`'te kural sürümü 95/96 olmadığı için bekledi; kapı aç | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:431 | "ertelendi, karar gerekli" yazılır. Sürümlü grup (ölüm save'i, Unconscious + Prone, direnç/zayıflık, Poisoned, | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:441 | **Ertelendi, karar gerekli:** 0 HP'de **uzun dinlenme** yasağı (s. 185 "To start a Long Rest, you must have at | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:459 | yapay zekânın Dash yapmaması (A45; denge etkisi), 0 HP uzun dinlenme (G6/D21). Belgede "Karar gerekli" ve satı | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:485 | Tek kural sürümü 94 (`src/battle/b94Surum.ts`, `b94On`); 93 ve altı kayıt/replay eski davranışta. Kaynak: `har | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:495 | **Karar gerekli (yapılmadı):** Bard: ilham zarını oyuncunun seçerek atması (K1), alet yetkinliği modeli (K3),  | karar gerekli | güncel, karar bekliyor |  |
| DECISIONS.md:547 | Ertelendi, karar gerekli: Swarm'ın başka yaratığın altıgeninde durması (doluluk modeli bir altıgende tek yarat | karar gerekli | güncel, karar bekliyor |  |
| BUYU-TAM-TARAMA §4.1 | Storm of Vengeance tur aşamaları (eksik): | karar gerekli | güncel, karar bekliyor |  |
| BUYU-TAM-TARAMA §4.2 | Savaş dışı süreler | karar gerekli | güncel, karar bekliyor |  |
| BUYU-TAM-TARAMA §4.3 | Eşya büyüleri | karar gerekli | güncel, karar bekliyor |  |
| BUYU-TAM-TARAMA §4.4 | Wish serbest dilek: | karar gerekli | güncel, karar bekliyor |  |
| BUYU-TAM-TARAMA §4.5 | Maliyetli materyal (GP) | karar gerekli | güncel, karar bekliyor |  |

## 4. Bayat satırlar (kapanmış konu, kaynak belge güncellenmemiş)

| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |
|---|---|---|---|---|
| SRD-KAPSAM Oynama kuralları s. 14 | Combat: Movement and Position (hareketi bölme, zorlu arazi, yaratık alanı, Prone) | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| SRD-KAPSAM Kural sözlüğü s. 184 | Jumping | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM A7 | Dash: özel hızlardan birini seçme (s.181) | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM A44 | Dropping Prone: eylemsiz, hızsız, hız 0'da olmaz (s.14) | yok | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM A52 | Arayüz: eksik eylem girişleri | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM B35 | Prone: isteğe bağlı yere yatma (Dropping Prone, Speed kuralı) | yok | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM D10 | Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unconscious bırakma seç | yok | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM E8 | Sürünme: her ft 1 ek ft, **zorlu arazide 2 ek ft** (s.180) | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM E9 | Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz (s.14) | yok | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM E13 | High Jump: koşarak 3 + STR değiştiricisi ft, yerinde yarısı (s.183) | kısmi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM F15 | High Jump: 3 + STR mod ft (koşuyla), durarak yarısı; ft başına hareket (s.183) | yok | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| GENEL-SAVAS-DENETIM H12 | Görülmeyen hedef ya da saldıran (ışık yönü): dezavantaj ve avantaj (s.15) | kısmi | bayat: KARAR101 (101, varsayılan açık; denge ölçülecek) | bayat: KARAR101 (101, varsayılan açık; denge ölçülecek) |
| DECISIONS.md:213 | **Doğrulanmadı (uygulanmadı):** **E8 sürünme + zorlu arazi** (s. 179 Crawling (denetimde s. 180): "While you'r | ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| DECISIONS.md:316 | **Ertelendi:** Stone's Endurance "When you take damage": hasar uygulanmadan önce azaltma kancası yalnız saldır | ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| DECISIONS.md:389 | **Doğrulanmadı (uygulanmadı):** sürünme + zorlu arazi (E8; s. 180 "1 extra foot (2 extra feet in Difficult Ter | ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| TUR-FEAT-ESYA-DENETIM.md | T27 Stone's Endurance: hasar alınca tepki, 1d12 + CON azaltma | yok/ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| TUR-FEAT-ESYA-DENETIM.md | Z9 Shield "Utilize Action to Don or Doff" | yok/ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| TUR-FEAT-ESYA-DENETIM.md | Z9 Shield "Utilize Action to Don or Doff" (s. 92) | yok/ertelendi | bayat: KARAR101 (101) | bayat: KARAR101 (101) |
| WIZARD-DENETIM.md | B5 **Evocation Savant** (Evoker 3): kitaba 2 (≤ 2. seviye) Evocation büyüsü bedelsiz; yeni | yok/ertelendi | bayat: KAPSAM103 (oluşturucu) | bayat: KAPSAM103 (oluşturucu) |

## 6. Savaş dışı satırlar (otomatik)

| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |
|---|---|---|---|---|
| SRD-KAPSAM Oynama kuralları s. 9 | Equipment Proficiencies (silah/zırh/alet) | kısmi | savaş dışı | genel alet yetkinliği yok (G13 bilinçli sapma); alet kontrolüne PB yalnız Thieves' Tools |
| SRD-KAPSAM Oynama kuralları s. 9 | Actions tablosu (Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Magic, Ready, Sear | kısmi | savaş dışı | A14 yok: Help: Assist an Ability Check; A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A19 yok: Influence; A29 kısmi: Search: WIS kontrolü (Insight, Medic |
| SRD-KAPSAM Oynama kuralları s. 11 | Exploration: Adventuring Equipment | kısmi | savaş dışı | 81 SRD eşyasının 67'si savaş dışı işaretli |
| SRD-KAPSAM Oynama kuralları s. 12 | Exploration: Travel (yolculuk, keşif) | kısmi | savaş dışı | SRD tempo seçimi (Fast/Normal/Slow) ve zorlu yürüyüş yok; bkz. 9. Travel Pace |
| SRD-KAPSAM Karakter oluşturma s. 19 | Step 2: Character Origin (geçmiş, tür, diller) | kısmi | savaş dışı | Diller (Common + iki dil; Standard/Rare Languages tabloları) karakterde yok |
| SRD-KAPSAM Karakter oluşturma s. 24 | Multiclassing: önkoşullar (13 yetenek) | yok | savaş dışı | çoklu sınıf modeli (sınıf başına seviye) gerektirir; büyük iş |
| SRD-KAPSAM Sınıflar s. 42 | Druid: Wild Shape biçimleri (Beast Shapes) (2. sv) | kısmi | savaş dışı | Savaşta etkili 134 SRD girdisinin 134'ü tam (3 savaş dışı); bilinçli sapma: Swarm biçimi geçici HP alır (⚠ yorum, kullanıcı kararı), SRD dışı Leap bonus yeteneği (Giant Frog/Toad) |
| SRD-KAPSAM Sınıflar s. 49 | Monk: Çekirdek özellikler (1. sv) | kısmi | savaş dışı | Artisan's Tools ya da Musical Instrument yetkinliği yok (alet modeli yalnız Thieves' Tools, TE99 #12); başlangıç ekipmanı A/B paket seçimi yok (genel); Genel alet yetkinliği ve paket seçimi (TE99 C er |
| SRD-KAPSAM Sınıflar s. 59 | Ranger: Deft Explorer (2. sv) | kısmi | savaş dışı | Bilinçli sapma: iki dil yok (dil sistemi yok, savaş dışı) (B7) |
| SRD-KAPSAM Sınıflar s. 63 | Rogue: Elusive (18. sv) | kısmi | savaş dışı | Karadul (ev kuralı) Tatlı Tuzak avantajı elusiveFilter'dan sonra ekleniyor: Elusive'e rağmen avantaj (A25, düzeltilmedi).; features.ts'te Tatlı Tuzak avantajını filtreden önce ekle (yeni kural sürümü) |
| SRD-KAPSAM Sınıflar s. 64 | Rogue / alt sınıf: Fast Hands (3. sv) | kısmi | savaş dışı | Sleight of Hand (cep, tuzak) ve büyülü eşyanın Magic eylemi bonus eylemle yok (fikstür notu: savaş dışı); kilit açma Utilize yoluyla bonus. Arayüz: TR açıklama 'Cunning Action ile' (E4).; Magic eyleml |
| SRD-KAPSAM Sınıflar s. 64 | Rogue / alt sınıf: Use Magic Device (13. sv) | kısmi | savaş dışı | doğrulanmadı (test ya da probe yok); Attunement sınırı 4 ve her Spell Scroll'u kullanma (Arcana DC) savaş dışı/yok.; Şarjda 1d6 = 6 harcanmaz testi; parşömen kuralı kararı. |
| SRD-KAPSAM Sınıflar s. 71 | Warlock: Pact Magic (1. sv) | kısmi | savaş dışı | bilinçli sapma: Serüven dışında cantrip/hazır büyü serbest düzenlenir (B10, K17); çoklu sınıf yok. |
| SRD-KAPSAM Sınıflar s. 72 | Warlock: Contact Patron (9. sv) | kısmi | savaş dışı | Slotsuz bir kez yapım ve save'in otomatik başarısı yok: yapım Pact slotu harcar (C3); büyü savaş dışı (Game Master notu).; Uzun dinlenmeli kaynak + freeSpellList ile slotsuz yapım. |
| SRD-KAPSAM Karakter kökenleri s. 94 | Geçmiş kuralı: Thieves' Tools ile kilit açma: DEX, DC 15, aleti gerektirir | kısmi | savaş dışı | G15 kısmi: kısmen düzeldi (99: DEX + PB, avantaj; envanter yok) |
| SRD-KAPSAM Donanım s. 93 | Tool Proficiency (alet kontrolüne PB, beceriyle avantaj) | kısmi | savaş dışı | genel alet yetkinliği; yetenek kontrolü sistemi savaş dışı |
| SRD-KAPSAM Donanım s. 94 | Alet: Thieves’ Tools | kısmi | savaş dışı | G15 kısmi: kısmen düzeldi (99: DEX + PB, avantaj; envanter yok); envanterde alet yok |
| SRD-KAPSAM Donanım s. 100 | Large Vehicles (gemi, kızak, araba; hız, AC, HP, Damage Threshold) | yok | savaş dışı | savaş dışı; araç istatistikleri yok |
| SRD-KAPSAM Büyüler s. 107 | Alter Self (2. sv, Transmutation) | kısmi | savaş dışı | kapsam dışı: Change Appearance savaş dışı (Game Master). |
| SRD-KAPSAM Büyüler s. 108 | Animate Dead (3. sv, Necromancy) | kısmi | savaş dışı | kapsam dışı: Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. |
| SRD-KAPSAM Büyüler s. 122 | Darkness (2. sv, Evocation) | kısmi | savaş dışı | kapsam dışı: Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. |
| SRD-KAPSAM Büyüler s. 153 | Plant Growth (3. sv, Transmutation) | kısmi | savaş dışı | kapsam dışı: Enrichment (8 saatlik döküm, bir yıl verim) savaş dışı. |
| SRD-KAPSAM Büyüler s. 158 | Remove Curse (3. sv, Abjuration) | kısmi | savaş dışı | kapsam dışı: Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |
| SRD-KAPSAM Büyüler s. 164 | Spider Climb (2. sv, Transmutation) | kısmi | savaş dışı | kapsam dışı: Eller serbest kuralı savaş dışı; açık alanda duvar boyu 20 ft (duvarın üstüne çıkılmaz); tavanda düşman altıgeninin üstünden geçilmez. |
| SRD-KAPSAM Kural sözlüğü s. 178 | Charmed [Condition] | kısmi | savaş dışı | B9 kısmi: Charmed: büyüleyene saldıramaz / zarar veren etkiyle hedefleyemez; B10 yok: Charmed: büyüleyenin sosyal kontrollerinde avantaj |
| SRD-KAPSAM Kural sözlüğü s. 184 | Influence [Action] | yok | savaş dışı | A19 yok: Influence |
| SRD-KAPSAM Kural sözlüğü s. 187 | Ritual | kısmi | savaş dışı | savaş dışı ritüel kullanımı (Detect Magic vb.) Serüven'de yok |
| SRD-KAPSAM Oyun araç kutusu s. 197 | Poison: dört tür (Contact, Ingested, Inhaled, Injury) ve uygulama (Injury: bonus eylem) | kısmi | savaş dışı | zehir türü ve silaha sürme eylemi |
| SRD-KAPSAM Oyun araç kutusu s. 199 | Traps: Parts of a Trap (tetik, süre, sezme/etkisiz kılma) | kısmi | savaş dışı | tuzağı etkisiz kılma (Thieves' Tools/Sleight of Hand) ve "GM'e gizli tuzak görünümü" yok |
| SRD-KAPSAM Oyun araç kutusu s. 199 | Example Trap: Collapsing Roof | kısmi | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 199 | Example Trap: Falling Net | yok | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 199 | Example Trap: Fire-Casting Statue | yok | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 200 | Example Trap: Hidden Pit | kısmi | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 200 | Example Trap: Poisoned Darts | yok | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 200 | Example Trap: Poisoned Needle | yok | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 201 | Example Trap: Rolling Stone | kısmi | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 201 | Example Trap: Spiked Pit | yok | savaş dışı | tuzak şablonu olarak `data/` içine |
| SRD-KAPSAM Oyun araç kutusu s. 203 | Troubleshooting (çok yaratık, CR 0, stat blok sayısı, güçlü yaratık) | kısmi | savaş dışı | Game Master tavsiyesi; kalanı savaş dışı |
| SRD-KAPSAM Sihirli eşyalar s. 206 | "The Next Dawn" (yük yenilenmesi) | kısmi | savaş dışı | bilinçli sapma (zaman modeli yok) |
| SRD-KAPSAM Canavarlar s. 258 | Aboleth (CR 10) | kısmi | savaş dışı | Dominate Mind (2/Day) (kısmi: kalıcı zihin kontrolü/telepati yok); savaş dışı: Amphibious, Eldritch Restoration, Probing Telepathy; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 262 | Barbed Devil (CR 5) | kısmi | savaş dışı | Hurl Flame (kısmi: yanıcı nesne hedeflenmez); savaş dışı: Diabolical Restoration |
| SRD-KAPSAM Canavarlar s. 279 | Death Dog (CR 1) | kısmi | savaş dışı | Bite (kısmi: HP maksimumu/24 saat save savaş dışı) |
| SRD-KAPSAM Canavarlar s. 280 | Djinni (CR 11) | kısmi | savaş dışı | Create Whirlwind (kısmi: hedef kasırgayla taşınmaz); savaş dışı: Elemental Restoration, Wishes |
| SRD-KAPSAM Canavarlar s. 283 | Erinyes (CR 12) | kısmi | savaş dışı | Entangling Rope (Requires Magic Rope) (kısmi: ipin AC/HP'si, bonus eylemle bırakma yok); savaş dışı: Diabolical Restoration, Magic Rope; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 286 | Gelatinous Cube (CR 2) | kısmi | savaş dışı | Engulf (kısmi: boğulma, sözlü büyü yasağı, küple taşınma yok); savaş dışı: Ooze Cube |
| SRD-KAPSAM Canavarlar s. 299 | Horned Devil (CR 11) | kısmi | savaş dışı | Hurl Flame (kısmi: yanıcı nesne hedeflenmez); savaş dışı: Diabolical Restoration; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 300 | Ice Devil (CR 14) | kısmi | savaş dışı | Ice Spear (kısmi: 'hareket ya da eylem, ikisi değil' kısıtı yok); savaş dışı: Diabolical Restoration; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 301 | Incubus (CR 4) | kısmi | savaş dışı | Restless Touch (kısmi: ek etki savaş dışı); savaş dışı: Succubus Form |
| SRD-KAPSAM Canavarlar s. 309 | Mummy (CR 3) | kısmi | savaş dışı | Rotting Fist (kısmi: 24 saat HP maks. azalması savaş dışı) |
| SRD-KAPSAM Canavarlar s. 309 | Mummy Lord (CR 15) | kısmi | savaş dışı | Rotting Fist (kısmi: HP maks. azalması, uzun dinlenme yasağı savaş dışı); savaş dışı: Undead Restoration; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 311 | Night Hag (CR 5) | kısmi | savaş dışı | savaş dışı: Coven Magic, Soul Bag, Nightmare Haunting (1/Day; Requires Soul Bag), Shape-Shift; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 313 | Otyugh (CR 5) | kısmi | savaş dışı | Bite (kısmi: ek etki savaş dışı) |
| SRD-KAPSAM Canavarlar s. 317 | Rakshasa (CR 13) | kısmi | savaş dışı | Cursed Touch (kısmi: ek etki savaş dışı); savaş dışı: Fiendish Restoration; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 329 | Sprite (CR 1/4) | kısmi | savaş dışı | Heart Sight (kısmi: ek etki savaş dışı) |
| SRD-KAPSAM Canavarlar s. 335 | Vampire (CR 13) | kısmi | savaş dışı | Bite (Bat or Vampire Form Only) (kısmi: ek etki savaş dışı); savaş dışı: Shape-Shift; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 337 | Werebear (CR 5) | kısmi | savaş dışı | Bite (Bear or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 338 | Wereboar (CR 4) | kısmi | savaş dışı | Gore (Boar or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| SRD-KAPSAM Canavarlar s. 338 | Wererat (CR 2) | kısmi | savaş dışı | Bite (Rat or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift |
| SRD-KAPSAM Canavarlar s. 339 | Weretiger (CR 4) | kısmi | savaş dışı | Bite (Tiger or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift |
| SRD-KAPSAM Canavarlar s. 339 | Werewolf (CR 3) | kısmi | savaş dışı | Bite (Wolf or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift; **[Gece kuyruğu]** 103: inisiyatif SRD stat bloğundan |
| GENEL-SAVAS-DENETIM A19 | Influence (s.184) | yok | savaş dışı | Komut, arayüz, Serüven karşılığı yok (GM `skill_check` var ama arayüzü yok, eylem harcamaz) |
| GENEL-SAVAS-DENETIM A29 | Search: WIS kontrolü (Insight, Medicine, Perception, Survival) (s.188) | kısmi | savaş dışı | Yalnız Perception: gizli yaratık (görüş hattında), tuzak (6 altıgen), gizli alan |
| GENEL-SAVAS-DENETIM A49 | YZ: Search, Stabilize, Influence, Study, Ready | yok | savaş dışı | Kullanmıyor |
| GENEL-SAVAS-DENETIM B10 | Charmed: büyüleyenin sosyal kontrollerinde avantaj | yok | savaş dışı | Savaşta sosyal (Influence) kontrolü yok |
| CLAUDE.md Bilinen eksikler | Canavar saldırı ek etkileri (`rider`) | kısmen | savaş dışı | Kuyruk A2: 85 yok/kısmen ekin 68'i `data/canavar-ekleri-a2.json` ile bağlandı (54 tam, 14 kısmi); kalan 17 (yapışma, likantrop laneti, ele geçirme (Ghost Possession K64a'da uygulandı), savaş dışı) `ha |
| CLAUDE.md Bilinen eksikler | Oyuncu ırk özellikleri | kısmen | savaş dışı | A0 denetimi: 41 SRD tür özelliğinin 34'ü çalışır, 2'si kısmi, 5'i savaş dışı, eksik yok. Görev R4 Dragonborn Breath Weapon; Kuyruk 19 (`srdK19`, `src/battle/species.ts`) Draconic Flight, Dwarven Resil |
| CLAUDE.md Bilinen eksikler | GM'e gizli tuzak görünümü | yok | savaş dışı | Bulunmamış tuzak kimseye çizilmiyor (gizli jeton katmanı kullanılabilir) |
| BARD-DENETIM.md | B2 3 müzik aleti yetkinliği | yok/ertelendi | savaş dışı | Alet yetkinliği modeli yok (karakterde alan, seçici, kontrol yok); savaş dışı yok `rules/stats.ts` `tool` araması boş |
| ROGUE-DENETIM.md | B2 Thieves' Tools yetkinliği | yok/ertelendi | savaş dışı | Alet yetkinliği modeli yok (sınıf verisinde alan yok, geçmişte yalnız metin); Thieves' Tools Expertise'i ve Reliable Talent'ın alet kısmı seçilemez yok **[YENİ] |
| SORCERER-DENETIM.md | F5 Font of Magic savaş dışında da kullanılabilir (dinlenme öncesi slot ↔ SP) | yok/ertelendi | savaş dışı | Yalnız savaşta; karakter listesi / dinlenme / Serüven ekranında düğme yok yok `font_of_magic` yalnız `MapBattle.tsx` ~1531'de |
| SORCERER-DENETIM.md | 12 Savaş dışı: kısa/uzun dinlenme ve karakter ekranında Cantrip/Metamagic/hazır büyü "bir  | yok/ertelendi | savaş dışı | Düşük yok ½ gün (kullanıcı kararı: genel serbest düzenleme bilinçli) |
| TUR-FEAT-ESYA-DENETIM.md | T43 Otherworldly Presence: Thaumaturgy cantrip'i, Legacy yeteneğiyle (s. 86) | yok/ertelendi | savaş dışı | yok (`races.json` yalnız `traits` metninde) yok PT1: hiçbir Tiefling'in `spellNames`'inde yok; savaş dışı cantrip; `docs/SRD-DENETIM.md` "tam" yanlış |
| TUR-FEAT-ESYA-DENETIM.md | G13 Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj (s. 20, s. 93) | yok/ertelendi | savaş dışı | yok; `data/backgrounds.json:22` vb. yalnız metin; gösterim yalnız Dungeondex `src/dungeondex/catalog.ts:329` (oluşturucu kartından SD3'te kalktı) bilinçli sapma |
| TUR-FEAT-ESYA-DENETIM.md | D18 Hunting Trap (DC 13, 1d4, zincir), Manacles (DC 13 bağlama) (s. 97–98) | yok/ertelendi | savaş dışı | `offCombat` yok `data/nesneler.json` `kinds`'ta tuzak/kelepçe yok |
| WILD-SHAPE-DENETIM.md | B4 Wild Companion familiar'ı Fey; uzun dinlenmede kaybolur | yok/ertelendi | savaş dışı | WS92 (92+): slot ya da Wild Shape kullanımıyla çağrılan familiar Fey; kaybolma savaş dışı tam `summons.ts:283–320` (tür yazılmıyor) |
