# Paladin denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Güncel kural sürümü (birlesik, D1–D3 + Hazırla + WS91 dahil) üzerinden okundu. Emin olunmayan satırlar geçici vitest probe'larıyla denendi (`src/battle/zzTmpPaladin*.test.ts`, iş bitince silindi; depoda yalnız bu belge kaldı). Probe kanıtı "P#" ile anılır (aşağıda "Probe dökümü").

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 53–57 (PDF sayfa numarası = SRD basılı numara), `data/srd/classes.json` (Paladin), `data/srd/spells.json`. Oyun tarafı: `data/class-features.json` (`paladin:*`, kaynaklar `layOnHands`, `channelDivinity`, `paladinsSmite`, `faithfulSteed`, `holyNimbus`), `src/battle/divine.ts`, `spells.ts` (`executeSmite`), `auras.ts`, `mind.ts`, `apex.ts`, `features.ts`, `ai.ts`.
**Oath of Devotion** `icerik/` paketinde (gitignore) yaşar; bu checkout'ta yok, mekanik **fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json`, `oath-of-devotion`; CLAUDE.md: pakette "aynı kimlik ve mekanik"). Gerçek paketin metni/adları görülmedi (satırlarda "paket görülemedi").

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı ya da kayda alınması gereken karar) · **doğrulanmadı**. "Bilinen" = DECISIONS.md ya da başka belgede zaten yazılı.

**Not (kullanıcı ipucu):** "CHA + seviye/2" biçimli hazırlanan büyü sayısı eski kuraldır; SRD 5.2.1'de sayı sınıf tablosundan gelir (s. 53). Oyun tabloyu kullanıyor (B1, P1).

**Çapraz not (CLERIC-DENETIM.md):** o belgenin A12 (Turn Undead Frightened bağışıklığı yok sayılıyor) ve A15 (Wight/Wraith/Specter yaratık türü) bulguları birlesik'te kapanmış görünüyor: `data/canavar-turleri.json` artık üçünü `undead` yazıyor (D1, kural sürümü 86) ve Abjure Foes probe'unda Frightened bağışıklığı uygulanıyor (D3, kural sürümü 89, `grantsAfterImmunity`). Cleric belgesi D1/D3'ten önce yazıldı; yeniden doğrulanmalı (burada Undead/Fiend ek zarını etkilediği için not edildi).

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d10, WIS+CHA save, Simple+Martial silah, Light/Medium/Heavy zırh + Shield, 2 beceri (Athletics, Insight, Intimidation, Medicine, Persuasion, Religion), ekipman A: Chain Mail, Shield, Longsword, 6 Javelin, Holy Symbol, Priest's Pack, 9 GP | 53 |
| S2 | Lay On Hands: havuz 5 × seviye, uzun dinlenmede dolar; Bonus Action, dokunulan **bir yaratık** (kendin dahil), havuzdan HP; 5 puanla Poisoned kalkar (o puanlar HP vermez) | 53–54 |
| S3 | Spellcasting: yarı büyücü slotları, **hazırlanan sayı tablodan** (2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15), uzun dinlenmede 1 büyü değişimi, CHA, Holy Symbol, cantrip yok | 53–54 |
| S4 | Weapon Mastery: yeterli olduğun 2 silah türü, uzun dinlenmede değişir | 54 |
| S5 | Fighting Style (2): Fighting Style feat ya da Blessed Warrior (2 Cleric cantrip'i, CHA, seviye başına 1 değişim) | 54 |
| S6 | Paladin's Smite (2): Divine Smite her zaman hazır; uzun dinlenmede bir kez slotsuz | 54 |
| S7 | Channel Divinity (3): 2 kullanım (11'de 3), kısa dinlenmede 1, uzun dinlenmede hepsi; DC = büyü DC'si | 54–55 |
| S8 | Divine Sense: Bonus Action, 10 dk ya da Incapacitated'a dek 60 ft'te Celestial/Fiend/Undead yeri ve türü; kutsanmış/lanetlenmiş yer ve nesne | 55 |
| S9 | Alt sınıf (3), ASI (4/8/12/16), Epic Boon (19) | 55 |
| S10 | Extra Attack (5), Faithful Steed (5: Find Steed hep hazır, uzun dinlenmede 1 slotsuz) | 55 |
| S11 | Aura of Protection (6): 10 ft Emanation, sen ve dostlar save'lere CHA (en az +1), Incapacitated iken pasif, başka Paladin varsa tek aura | 55 |
| S12 | Abjure Foes (9): Magic action, CD, görülen CHA (en az 1) yaratık WIS save ya da 1 dk / hasara dek Frightened; Frightened'ken tur başına yalnız hareket **ya da** eylem **ya da** bonus eylem | 55 |
| S13 | Aura of Courage (10): aurada Frightened bağışıklığı; auraya giren Frightened dostta etkisiz | 55 |
| S14 | Radiant Strikes (11): Melee silah ya da Unarmed Strike isabetinde +1d8 Radiant | 55 |
| S15 | Restoring Touch (14): Lay On Hands ile Blinded/Charmed/Deafened/Frightened/Paralyzed/Stunned'dan biri ya da fazlası, her biri 5 puan | 55 |
| S16 | Aura Expansion (18): Aura of Protection 30 ft Emanation | 55 |
| S17 | Paladin büyü listesi (38 büyü; 1: 13, 2: 11, 3: 6, 4: 4, 5: 4) | 55–56 |
| S18 | Oath of Devotion Spells (3: PEG, Shield of Faith; 5: Aid, Zone of Truth; **9: Beacon of Hope, Dispel Magic; 13: Freedom of Movement, Guardian of Faith; 17: Commune, Flame Strike**) | 56 |
| S19 | Sacred Weapon (3): Attack eylemiyle, CD; **elindeki bir** Melee silah, 10 dk ya da yeniden kullanana dek; CHA (en az +1) saldırıya, isabette normal tür ya da Radiant; 20 ft parlak + 20 ft loş ışık; silahı taşımazsan biter | 56 |
| S20 | Aura of Devotion (7): aurada Charmed bağışıklığı; giren Charmed dostta etkisiz | 56 |
| S21 | Smite of Protection (15): Divine Smite yapınca sen ve aurandaki dostlar **aurada kaldıkça** sonraki turuna dek Half Cover | 57 |
| S22 | Holy Nimbus (20): Bonus Action, 10 dk; düşman aurada tur başlatınca CHA+PB Radiant; Fiend/Undead'in zorladığı save'lerde avantaj; aura güneş ışığı (sunlight) parlak ışık; uzun dinlenmede ya da **5. seviye slotla** (eylemsiz) yenilenir | 57 |
| S23 | Divine Smite büyüsü: Bonus Action, Melee silah/Unarmed isabetinden hemen sonra; +2d8 Radiant, +1d8 slot başına, +1d8 Fiend/Undead; Searing Smite, Shining Smite, Divine Favor | büyü listesi (SRD s. 125, 160 vb.) |

## Özet sayılar

| Alan | Satır | tam | kısmi | yok | bilinçli sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 26 | 17 | 8 | 0 | 1 | 0 |
| B) Oluşturucu / seviye atlama | 11 | 9 | 0 | 0 | 1 | 1 |
| C) Dinlenme, Serüven, kayıt | 8 | 5 | 0 | 3 | 0 | 0 |
| D) Yapay zekâ | 8 | 3 | 1 | 2 | 2 | 0 |
| E) Arayüz ve TR/EN | 7 | 1 | 5 | 0 | 0 | 1 |
| **Toplam** | **60** | **35** | **14** | **5** | **4** | **2** |

(Sayım tablo satırlarının durum sütunundan.)

**Öne çıkan bulgular**

1. **Oath of Devotion Spells yalnız 3. ve 5. seviye** (A26): 9/13/17. seviye büyüleri (Beacon of Hope, Dispel Magic, Freedom of Movement, Guardian of Faith, Commune, Flame Strike) fikstürde yok; 20. seviye Paladin "her zaman hazır" listesinde 6 büyü (P1). Altı büyünün hepsi oyunda var (P1). Gerçek `icerik/` paketi görülemedi.
2. **Holy Nimbus'un üç parçası eksik** (A25): 5. seviye slotla yenileme yok (`apex.ts:51-58` yalnız `fearAura`/`wings` için alternatif kaynak), aura "sunlight" değil (alan `spec.sunlight` yok; `divine.ts:315` bunu arıyor), **Incapacitated Paladin'in aurası hasar vermeye devam ediyor** (P4).
3. **Sacred Weapon bir silaha değil, bütün yakın dövüş silahlarına ve Unarmed Strike'a CHA ekliyor** (A22, P3); silahı bırakınca bitmiyor; Radiant yalnız hedef dirençli/bağışıkken seçiliyor.
4. **Aura of Protection'da Paladin'in kendi bonusu sheet'e sabit yazılı:** Incapacitated iken de sürüyor (A17, P2); dostların bonusu doğru bitiyor.
5. **Abjure Foes'ta Frightened'ın "hareket ya da eylem ya da bonus eylem" kısıtı yok**, hedef seçimi otomatik, Yapay zekâ Abjure Foes ve Holy Nimbus'u hiç kullanmıyor (A18, D5, D6); Lay On Hands arayüzü yaralı + durumlu hedefte "iyileştir ve temizle"yi sunmuyor, yalnız tam canlı hedefte temizliyor (E1, motor destekliyor, P1).
6. Bilinen: Serüven seviye atlaması yalnız seviyeyi artırır; Fighting Style (2), alt sınıf (3), ASI, hazır büyü ve Weapon Mastery değişimi sorulmaz (C4–C6).

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| A1 | Lay On Hands havuzu 5 × seviye, uzun dinlenmede dolar (s. 53) | `layOnHands`: `uses.perLevel: 5`, `recharge.long: all` (1→5, 11→55, 20→100) | tam | P1 (resources), `class-features.json` resources `layOnHands` | 6505 (P-Paladin) |
| A2 | Bonus Action, dokunuş (kendin dahil), havuzdan HP (s. 54) | `healPool`: bonus eylem, `touch: true` (kendisi ya da bitişik), `amount` havuzdan; Incapacitated iken yapılmaz | tam | `paladin.test.ts:78-96`; P1 ("Aksiyon yapamaz: Incapacitated") | 6505 |
| A3 | 5 puanla Poisoned kalkar, o puanlar HP vermez; aynı kullanımda hem iyileştir hem temizle (s. 54) | Motor `amount` + `cure` birlikte kabul ediyor: 10 HP + Poisoned temizliği havuzdan 15 düştü, hedef 5→15 HP ve durum yok; havuz yetmezse red | tam (motor) | P1 (`heal10+cure`, `pool 10`) | 6505 |
| A4 | Hedef: "bir yaratık" (dost olması şart değil) (s. 54) | Düşman hedef "Yalnızca kendine ya da bir dostuna" ile reddediliyor | bilinçli sapma | P1 (`LOH enemy`), `divine.ts:104-105` | yok (yazılı karar yok; kayda alınmalı) |
| A5 | Restoring Touch (14): Blinded/Charmed/Deafened/Frightened/Paralyzed/Stunned, her biri 5 puan (s. 55) | `curesOf`: eksiksiz liste; 14. seviyede 4 durum (Stunned, Frightened, Blinded, Poisoned) tek kullanımda 20 puana temizlendi (havuz 70→50); 13. seviyede Stunned "kaldırılacak durum yok"; efektle (`grants`) verilen Frightened durumu da kalkıyor. Hangi durumların kalkacağı seçilemez, havuz yettikçe sırayla hepsi (E2) | tam | P1 (`RT 4 cond`, `lvl13`, `RT effect-granted`), `divine.ts:283-285` | 4519 |
| A6 | Divine Smite: +2d8 Radiant, +1d8 her slot, +1d8 Fiend/Undead, kritikte zarlar iki kat (SRD büyü metni) | `smiteEvents`: 2d8 + slot başına 1d8 + `vsTypes` (fiend, undead) 1d8; kritikte `rollDice(…, crit)`: 5. seviyede 2. slotla Undead hedefte 8 zar; kritik isabette 2d8 → 4 zar. Undead tipi `data/canavar-turleri.json`'dan (Wight/Wraith/Specter artık `undead`, D1) | tam | `paladin.test.ts:125-134`; P2 (kritik 4 zar); `divine.ts:349-375` | 6505, D1 |
| A7 | Tetik: "Melee weapon ya da Unarmed Strike ile vurduktan hemen sonra" Bonus Action | Melee silah ve Unarmed Strike isabeti `economy.meleeHit` açar (P2: Unarmed kritik, `meleeHit` dolu); **atılan Javelin** (SRD'de Melee silah, Thrown) açmaz (`meleeHit` boş, `paladin.test.ts:135` bunu sınıyor). "Hemen sonra" yerine bu turun herhangi bir anı ve son vurulan hedef | kısmi (yorum) | P2, P4 (`thrown javelin meleeHit` boş), `divine.ts:341-346` | 6505 ("yakın dövüş silahıyla"); Karar gerekli K1 |
| A8 | Paladin's Smite: Divine Smite hep hazır, uzun dinlenmede 1 kez slotsuz (s. 54) | `alwaysPrepared` 2. seviye, kaynak `paladinsSmite` (`freeSpell: Divine Smite`): ilk kullanım slotsuz (`feature_used paladinsSmite`, `slot_spent` yok), sonrakiler slot; açık `slotLevel` verilirse slot | tam | `paladin.test.ts:108-124`; P2 | 6505 |
| A9 | Searing Smite, Shining Smite, Divine Favor (Paladin listesi) | Searing: isabette +1d6 Fire, tur başı 1d6 + CON save, yukarı slot; Shining: +2d6 Radiant, konsantrasyon, avantaj, Invisible yararı kalkar (m83); Divine Favor +1d4 Radiant, 10 tur, konsantrasyonsuz (SRD'de de yok). `BUYU-DURUM.md`: 225 çalışır / 0 kısmi | tam | `paladin.test.ts:165-205`; `spells.ts:1660-1722`; DECISIONS 734 (B18) | 6505, 734 |
| A10 | Fighting Style (2): feat ya da Blessed Warrior (2 Cleric cantrip, CHA) | `featSlot` kategorisi "Fighting Style" + `alternatives` Blessed Warrior (`cantrips: 2`, `spellList: Clr`); cantrip'ler Paladin büyüsü, CHA ile | tam | `paladin.test.ts:206-223`; P1 (`advancementSlots`: 2 style) | 6505, 4996 |
| A11 | Weapon Mastery: 2 tür, yetkinlik şartı (s. 54) | `weaponMastery.count: 2` her seviyede (1, 5, 20 → 2); `melee: false` (menzilli de seçilir); etkiler savaşta otomatik (genel parça) | tam | P1 (`mastery`), `src/rules/builder.ts:281` | genel (Weapon Mastery satırı) |
| A12 | Channel Divinity: 2 kullanım (11. seviyede 3) (s. 54) | `uses.column` tablodan: 3. seviye 2, 11. seviye 3, 20. seviye 3 | tam | P1 (`res11`, `res20`), `paladin.test.ts:44-56` | 6505 |
| A13 | Kısa dinlenmede 1, uzun dinlenmede hepsi (s. 54) | `recharge: short 1, long all` (Cleric'le ortak kaynak tanımı; `rechargeResources` probe'u Cleric belgesinde) | tam | `class-features.json` resources `channelDivinity`; CLERIC-DENETIM P (C1) | 4562 |
| A14 | Divine Sense: Bonus Action, 10 dk ya da Incapacitated'a dek, 60 ft, tür ve yer, kutsanmış/lanetlenmiş yer ve nesneler (s. 55) | `divineSense`: bonus eylem, CD harcar, 60 ft; gizli Celestial/Fiend/Undead hedef alınabilir (`knowsWhere`); Incapacitated iken etkisiz **ama etki silinmez**, iyileşince geri döner (SRD: biter); süre `until = round + 100` = 101 tur (diğer etkiler `+ rounds − 1`: 1 tur fazla); kutsanmış yer/nesne algısı savaş dışı | **düzeldi (B94)** ← kısmi | P3 (`divine sense` until 101); `sight.ts:93-97`; `divine.ts:138-144` | 4554, 6505 |
| A15 | Extra Attack (5) | `attacksPerAction: 2` 5. seviyede | tam | `paladin.test.ts:44-56` | — |
| A16 | Faithful Steed: Find Steed hep hazır, uzun dinlenmede 1 kez slotsuz (s. 55) | `alwaysPrepared` 5, kaynak `faithfulSteed` (`freeSpell: Find Steed`): serbest çağrı slot düşürmedi (4/2 slot aynı), `summoned` olayı; at kontrollü binek (`mount.kontrol`), Life Bond/bonus eylemleri `steed.ts`. Veride özellik durumu hâlâ `partial` (eski etiket) | tam (veri etiketi eski) | P4 (`find steed events`), `summons.test.ts:79`, `class-features.json` `paladin:faithful-steed` | 6505, 1589 |
| A17 | Aura of Protection: sen ve dostlar save'lere CHA (en az +1), 10 ft Emanation, Incapacitated iken pasif, başka Paladin varsa tek aura (s. 55) | Dostlar: 6. seviyede 2 altıgen (10 ft) içinde +2, 3. altıgende 0; Paladin Incapacitated iken dostlara 0 ✓; birden çok Paladin'de en büyüğü. **Paladin'in kendi bonusu sheet'e sabit yazılı** (`create.ts:317`): Incapacitated iken de sürüyor (P2: save 6 kalıyor). 18. seviyede 30 ft ✓ (aynı P2: 6 altıgen 2, 7. altıgen 0; 17. seviyede 6 altıgen 0) | **düzeldi (B94)** ← kısmi | P2 (`aura lv`, `incap aura`), `auras.ts:26-46`, `create.ts:317` | 4642, 3709 (aura halkası bağlı değil) |
| A18 | Abjure Foes: Magic action, CD, görülen CHA (≥1) yaratık, WIS save ya da 1 dk/hasara dek Frightened; Frightened'ken yalnız hareket **ya da** eylem **ya da** bonus eylem (s. 55) | Magic eylemi + CD harcar, CHA (≥1) düşman, WIS save, `breakOnDamage`; Frightened bağışık hedefe uygulanmaz (P3, D3 sonrası); seçim otomatik (seçilen hedef önce, sonra en çok HP); yalnız düşman; **tek-seçenek kısıtı yok** (veri notunda belirtilmiş) | **düzeldi (B94)** ← kısmi | P3 (`abjure`: cha 2 → 2 hedef, bağışık E etkilenmedi); `cleric.ts` `abjure`; `class-features.json` `paladin:abjure-foes` not | 4645 (bilinen) |
| A19 | Aura of Courage: aurada Frightened bağışıklığı; giren Frightened dostta etkisiz (s. 55) | Yeni Frightened engellenir (`conditionAura`); auradaki Frightened dost için `frightenedNow` false (P3: aurada false, dışında true); Paladin Incapacitated iken yok; mesafe 2B `distance` (K73b 3B `auraDist` kullanılmıyor, dikey/döşeme ayrımı yok) | tam | P3 (`frightenedNow`), `mind.ts:30-52`, `ruleVersion.ts:42-58` | 4545, 4693 |
| A20 | Radiant Strikes (11): Melee silah ya da Unarmed Strike isabetinde +1d8 Radiant (s. 55) | Her isabette (turda bir sınırı yok) +1d8, kritikte 2d8; Unarmed ✓; menzilli/atılan silah yok (bkz. A7) | tam | P2 (`RS hit1/hit2/unarmed`); `class-features.json` `paladin:radiant-strikes` | 4519 |
| A21 | Aura Expansion (18): 30 ft | `radiusOf`: seviye ≥ 18 → 6 altıgen (Protection, Courage, Devotion hepsi) | tam | P2 (`aura lv 17/18`), `auras.ts:27`, `ruleVersion.ts:46` | 4519 |
| A22 | Sacred Weapon: Attack eylemiyle, CD; **elindeki bir** Melee silah; 10 dk/yeniden kullanana dek; CHA (≥1) saldırıya; isabette normal tür ya da Radiant; 20+20 ft ışık; silahı taşımazsan biter (s. 56) | Eylemsiz, Attack eylemiyle, CD harcar ✓; CHA (en az +1) **tüm yakın dövüş silahlarına ve Unarmed Strike'a** (P3: Longsword, Shortsword, Unarmed +2 hepsi), menzilliye değil; yeniden kullanım öncekini değiştirir (1 buff, CD −1) ✓; Radiant yalnız hedef silah türüne dirençli/bağışıkken otomatik (oyuncu seçimi yok); silahı bırakınca bitmez; süre 100 tur ✓; ışık tek `light: 8` altıgen (parlak/loş ayrımı yok, bilinen) | **düzeldi (B94)** ← kısmi | P3 (`SW bonus`, `SW second use`); `divine.ts:117-124,189-196`; `paladin.test.ts:142-163` | 6523, 4544, CLAUDE.md "bilinen eksikler" |
| A23 | Aura of Devotion: aurada Charmed bağışıklığı; giren Charmed dostta etkisiz (s. 56) | `conditionAura` Charmed (`aura-of-devotion`); auraya giren Charmed dost büyüleyene saldırabilir (`range.ts:54` `inProtectiveAura`). Probe A19 ile aynı kod yolu (Charmed için ayrı probe yok) | tam (fikstür) | `mind.ts:45`, `range.ts:54`; fikstür `aura-of-devotion` | 4545, 4693 |
| A24 | Smite of Protection: Divine Smite yapınca sen ve aurandaki dostlar **aurada kaldıkça** sonraki turuna dek Half Cover (s. 57) | Divine Smite anında aura içindeki dostlara `halfCover` etkisi yazılır (`untilSourceTurn`); aurayı sonradan terk eden yararını korur, sonradan giren almaz; yalnız `featuresK19` ve yalnız `divine-smite` (diğer smite'lar değil, SRD de yalnız Divine Smite der) | **düzeldi (B94)** ← kısmi | `spells.ts:1712-1720` (kod okuması, probe yok) | 4504 |
| A25 | Holy Nimbus: Bonus Action 10 dk; düşman aurada tur başlatınca CHA+PB Radiant; Fiend/Undead save avantajı; sunlight parlak ışık; Long Rest ya da 5. seviye slotla yenilenir (s. 57) | Bonus eylem ✓ 10 dk ✓; alan Paladin'e bağlı, tur başında 8 Radiant (CHA 2 + PB 6, P4) ✓; Holy Ward (`saveAdvVs: fiend, undead`) ✓; ışık 6 altıgen ✓. Eksik: (a) **5. seviye slotla yenileme yok** (`apex.ts:51-58`; veri notu da yazıyor), (b) aura güneş ışığı değil (`spec.sunlight` yok; `divine.ts:315` Sunlight Sensitivity'yi bu bayrağa bağlıyor), (c) **Paladin Incapacitated iken alan hasar vermeye devam ediyor** (P4; aura Incapacitated'da pasif olmalı) | **düzeldi (B94)** ← kısmi | P4 (`nimbus`, `incap nimbus`), `apex.ts:157-173`, `class-features`/fikstür `holy-nimbus` not | 4503 |
| A26 | Oath of Devotion Spells: 3, 5, **9, 13, 17** (s. 56) | Fikstür yalnız 3 (PEG, Shield of Faith) ve 5 (Aid, Zone of Truth); 20. seviye Paladin `alwaysPrepared`: Divine Smite, PEG, Shield of Faith, Aid, Zone of Truth, Find Steed. 9/13/17 satırları ve altı büyü (hepsi oyunda var) listede yok. Gerçek paket görülemedi | kısmi (veri) | P1 (`alwaysPrepared 20`, `exists`), fikstür `oath-of-devotion-spells` | 6505 (3 ve 5 yazılı) |

## B) Oluşturucu / seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| B1 | Hazırlanan sayı tablodan: 2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15 (s. 53) | `spellLimits('paladin', 1..20).prepared` SRD ile 20/20 aynı; CHA+seviye/2 kuralı yok | tam | P1 (`prepared 1..20`) | 4878 (K38) |
| B2 | Yarı büyücü slotları (1. seviyeden: 2 slot) | `spellSlots`: 1→2, 3→3, 5→4/2, 9→4/3/2, 13→+4. seviye 1, 17→+5. seviye 1, 20→4/3/3/3/2 | tam | P1 (`slots`), `src/rules/k38.test.ts` | 4878 |
| B3 | Cantrip yok; Blessed Warrior iki Cleric cantrip'i (s. 54) | `cantrips: 0`; Blessed Warrior cantrip'leri ayrı bölümde sayaç ve sınırla | tam | P1 (`cantrips 0`), `paladin.test.ts:206-223` | 4996 (D4) |
| B4 | Her zaman hazır büyüler hazırlanan sayıya girmez (Divine Smite, Find Steed, yemin büyüleri) | `classKit().alwaysPrepared` sayıya girmez | tam | `paladin.test.ts:57-67` | 6505 |
| B5 | Paladin büyü listesi 38 büyü | SRD `Paladin` listesi ↔ oyun `Pal`: 38 = 38, eksik/fazla yok; seviye dağılımı 13/11/6/4/4 | tam | P1 (`srd pal 38 game 38`) | — |
| B6 | Fighting Style (2), ASI 4/8/12/16, Epic Boon 19, alt sınıf 3 | `advancementSlots('paladin', 20)`: style 2, asi 4/8/12/16, epic 19 | tam | P1 (`advancementSlots` çıktısı) | N (Görev N) |
| B7 | Çekirdek ve başlangıç ekipmanı | `data/classes.json`: hitDie 10, saves wis/cha, `weaponProficiency: martial`, light/medium/heavy/shield, 2 beceri aynı liste; öneri Chain Mail + Shield + Longsword + Javelin | tam | `data/classes.json`, `data/onerilen-baslangic.json` | — |
| B8 | Weapon Mastery 2 tür seçimi | `classKit().weaponMastery.count` 2; oluşturucu sayaç | tam | `builder.ts:281`, P1 | — |
| B9 | Blessed Warrior cantrip'ini her Paladin seviyesinde değiştirme | Oluşturucuda serbest düzenleme; "seviye başına 1" sınırı uygulanıp uygulanmadığı bu denetimde doğrulanmadı | doğrulanmadı | — | — |
| B10 | Oath of Devotion alt sınıf 3. seviyede, özellikler 3/3/7/15/20 | Fikstürde bu seviyelerde; yeni karakterde varsayılan öneri `oath-of-devotion` (`alt-sinif-gorunum.json`) | tam (fikstür) | fikstür `oath-of-devotion` | AS2 |
| B11 | Uzun dinlenmede 1 hazır büyü değişimi; uzun dinlenmede Weapon Mastery değişimi | Dinlenme şartı yok: karakter listesi her an serbest düzenlenir (genel; Wizard/Warlock belgelerinde aynı) | bilinçli sapma | `src/rules/builder.ts` (serbest düzenleme) | genel (bilinen) |

## C) Dinlenme, Serüven, kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| C1 | Lay On Hands havuzu uzun dinlenmede dolar | `recharge.long: all`; savaş sonrası kalan havuz karakterde | tam | `class-features.json` resources; K10 kaydı | 4621 (K10) |
| C2 | Channel Divinity kısa +1 / uzun hepsi | A13'le aynı; kısa dinlenmede `rechargeResources` +1 | tam | CLERIC-DENETIM P (C1) | 4562 |
| C3 | Paladin's Smite, Faithful Steed, Holy Nimbus uzun dinlenmede | Üçü `recharge.long: all` (Holy Nimbus'ta slotla yenileme yok: A25) | tam | `class-features.json` resources | 6505 |
| C4 | Uzun dinlenmede Weapon Mastery türlerini değiştirme | **Serüven'de yok:** parti seçim anındaki `sheet` kopyası, Serüven içinde karakter düzenlenmez | **düzeldi (B94)** ← yok | `src/journey/seruven.ts:225` (`sheet: p.sheet`) | bilinen (Wizard belgesi C7) |
| C5 | Seviye atlayınca Fighting Style (2), alt sınıf (3), ASI, hazır büyü artışı | Serüven `level_up` yalnız `sheet.level` artırır (`seruven_leveled`, `seruven.ts:284-290,397`): seçim sorulmaz; sınıf özellikleri seviyeye göre otomatik gelir (Divine Smite, aura, Extra Attack), ama Fighting Style/feat, alt sınıf, hazır liste büyümesi oluşturucuya gidilmedikçe eksik | **düzeldi (B94)** ← yok | `seruven.ts:284-290`, DECISIONS 4971 ("Karar bekleyen") | **bilinen** |
| C6 | Uzun dinlenmede hazır büyü değişimi | Serüven içinde yok (C4 ile aynı neden) | **düzeldi (B94)** ← yok | `seruven.ts:225` | **bilinen** |
| C7 | Kaydet/yükle | Olaylar yeniden uygulanınca aynı durum; Paladin'e özgü yeni olay türü yok | tam | `paladin.test.ts:237-243` | — |
| C8 | Savaş sonrası havuz/CD/slot karakterde kalır | K10 mekanizması (en çok + harcanan) | tam | `characterRest.ts` | 4621 |

## D) Yapay zekâ

| # | Konu | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| D1 | Lay On Hands | `ai.ts:1475-1490`: yanındaki 0 HP dostu yarı HP'sine dek kaldırır; kendisi ≤ ⅓ ise kendini iyileştirir. Yaralı (0 HP olmayan) dostu iyileştirmez, durum temizlemez | kısmi (basit kural) | `ai.ts:1475-1490`, `paladin.test.ts:231-236` | 6505 |
| D2 | Divine Smite / Searing / Shining | `ai.ts:1949-1959`: isabetten sonra bonus eylem boşsa; serbest (Paladin's Smite) önce, slotla yalnız kritikte ya da hedef > 10 HP; yalnız `party` tarafı | tam | `paladin.test.ts:225-230` | 6505 |
| D3 | Sacred Weapon | Saldırabilecekken ve yakında düşman varsa, etkin değilse önce kullanır | tam | `ai.ts:2003-2010`, `paladin.test.ts:225` | 6505 |
| D4 | Divine Sense | Gizli Celestial/Fiend/Undead düşman varken | tam | `ai.ts:1992-2001` | 4554 |
| D5 | Abjure Foes | Hiç kullanmaz (`ai.ts`'te `abjure` yok) | **düzeldi (B94)** ← yok | grep `abjure` boş (`ai.ts`, `ai/`) | yazılı değil |
| D6 | Holy Nimbus | Hiç kullanmaz (`ai.ts`'te `nimbus` yok) | **düzeldi (B94)** ← yok | grep `nimbus` boş | yazılı değil |
| D7 | Find Steed / Faithful Steed | Yapay zekâ çağırma büyüsü yapmaz (yalnız atın bonus eylemleri, `steedActions`) | bilinçli sapma | `ai.ts:2110-2116` | R3 ("yapay zekâ çağırma büyüsü yapmaz") |
| D8 | Düşman tarafında Paladin | Smite ve Sacred Weapon kuralları `actor.side === 'party'`; düşman Paladin kullanmaz | bilinçli sapma | `ai.ts:1949, 2003` | 4595 benzeri (Cleric kaydı: "düşman tarafında sınıf yok") |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| E1 | Lay On Hands: yaralı + Poisoned/durumlu hedefe aynı kullanımda iyileştir ve temizle | Düğme komutu `amount = min(havuz, eksik HP)`, `cure` yalnız `missing === 0` iken açılıyor (`MapBattle.tsx:521-524`): yaralı hedefe tek komutta iyileştirme + temizleme gönderilemez (motor destekliyor, A3). Önce tam HP'ye getirirsen bonus eylem bitmiş olur; ipucu metni de "tam sağlıklı ve zehirliyse" diyor | **düzeldi (B94)** ← kısmi | `MapBattle.tsx:521-524`, `strings.tr2.ts:698`, `strings.en.ts:1420` | yazılı değil |
| E2 | Restoring Touch: durumları seçmek ("bir ya da fazlası") | Seçici yok; havuz yettikçe sırayla hepsi (Poisoned önce) | kısmi (düşük) | `divine.ts:153-160,283-285` | 4519 |
| E3 | "Adlar İngilizce kalır" (SD4) | TR menü adları Türkçe: `paladin:lay-on-hands` "Şifalı Eller", `channel-divinity` "İlahi His", `abjure-foes` "Düşmanları Yıldır", `holy-nimbus` "Kutsal Hâle", `sacred-weapon` "Kutsal Silah" (SD2 kısa menü adları); SD4 sınıf özelliği adlarının İngilizce kalmasını söylüyor. Çelişki mi, menü istisnası mı, kullanıcıya sorulmadı | kısmi (tutarsızlık olası) | `strings.tr2.ts:458-464`, `strings.en.ts:1190-1196` | SD4 (DECISIONS 119 civarı), SD2 |
| E4 | Özellik ipucu metni TR/EN | Yalnız Lay On Hands ve Sacred Weapon için kısa ipucu var (`strings.tr2.ts:698-699`, `strings.en.ts:1420-1421`); Divine Sense, Abjure Foes, Holy Nimbus ve pasifler için ipucu kaydı yok (menüde adla görünür) | **düzeldi (B94)** ← kısmi | grep `paladin` iki dil dosyasında yalnız o iki anahtar | — |
| E5 | Kaynak adları iki dilde | `layOnHands`, `paladinsSmite` ("Paladin's Smite (Divine Smite without a slot)" / "slotsuz Divine Smite") TR ve EN'de var; Lay On Hands `HEAL_RE` ile iyileştirme simgesi | tam | `strings.en.ts:990`, `strings.tr2.ts:367`, `actionMenu.ts:45` | — |
| E6 | Aura of Protection simgesi/halkası | Savaşta aura halkası bağlı değil ("olay/aura etkisi değil") | kısmi — **bilinen** | DECISIONS 3709 | 3709 |
| E7 | Alt sınıf özellik adları (fikstür TR: "Kutsal Silah", "Bağlılık Aurası", "Koruyucu Darbe", "Kutsal Hale"); SD4: alt sınıf adı Türkçe, sınıf özelliği adı İngilizce | Gerçek paketteki adlar (ör. DECISIONS 1300: L20 "Kutsal Güneş Sureti") görülemedi; fikstür özellik adları Türkçe | doğrulanmadı | fikstür, DECISIONS 1300 | AS2, SD4 |

## Düzeltme önerileri

Kural sürümü: aşağıda "sürüm" işaretli maddeler tek toplu sabitle (güncel sürümün bir fazlası) kapatılır; veri ve arayüz maddeleri sürümsüzdür. SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | Oath of Devotion Spells 9/13/17 satırlarını `alwaysPrepared`'a ekle (fikstür + gerçek `icerik/` paketi kontrolü); `src/rules/k38`/`paladin.test` sayımı | Orta (9+ seviye Devotion Paladin'de 6 büyü eksik; hepsi oyunda var) | Sürümsüz (veri; eski savaş kaydı etkilenmez, liste savaş başında okunur) | 0,5 saat |
| 2 | Holy Nimbus: Incapacitated Paladin'in alanı hasar vermesin; alanda `sunlight` bayrağı; 5. seviye slotla (eylemsiz) yenileme (`apex.ts` `payment` alternatif kaynağı `nimbus`'a genelleştir) | Orta-düşük (20. seviye) | Sürüm | 2–3 saat |
| 3 | Aura of Protection: Paladin'in kendi bonusunu sheet'ten çıkarıp `auraSaveOf` yoluna taşı (Incapacitated iken biter); sheet tüketicilerini (arayüz save gösterimi) denetle | Düşük-orta | Sürüm | 1–2 saat |
| 4 | Sacred Weapon'ı tek silaha bağla (etkin silah seçeneği), silahı bırakınca bitir, Radiant seçimini oyuncuya ver, ışığı 20 + 20 ft olarak parlak/loş ayır (loş ayrımı genel ışık işi) | Orta (dengeye de dokunur: ikinci silah/Unarmed bonusu) | Sürüm | 3–4 saat + hızlı regresyon |
| 5 | Abjure Foes: Frightened'ın "hareket ya da eylem ya da bonus eylem" kısıtı (etkide yeni alan, `economy.ts` kapısı), hedef seçimi oyuncuda | Orta-düşük | Sürüm | 3–4 saat |
| 6 | Smite of Protection: auraya göre dinamik yarım siper (aurada kaldıkça, sonraki tura dek) | Düşük (15. seviye) | Sürüm | 2 saat |
| 7 | Lay On Hands arayüzü: yaralı + durumlu hedefte "iyileştir + temizle" (iki alan ya da iki düğme), Restoring Touch durum seçici | Orta (Stunned/Paralyzed temizlemek 14. seviye ana kullanımı) | Sürümsüz (motor destekliyor) | 2–3 saat |
| 8 | Divine Sense: süre `+ rounds − 1`, Incapacitated'da etkiyi sonlandır (SRD "biter"); Aura of Courage/Devotion mesafesini 3B `auraDist`'e bağla | Düşük | Sürüm | 1–2 saat |
| 9 | Yapay zekâ: Abjure Foes (≥2 düşman 60 ft'te) ve Holy Nimbus; Lay On Hands ile yaralı dostun durumunu temizleme. **Sim imzasını değiştirir**, denge ölçümü gerekir | Orta (düşman tarafında Paladin yok, parti tarafı güçlenir) | Sürüm (YZ kararı) + denge ölçümü | 3–4 saat + ölçüm |
| 10 | E: SD2/SD4 isim çelişkisini kullanıcıya sor ve tek yerde karara bağla; Divine Sense/Abjure Foes/Holy Nimbus için ipucu metni (TR+EN); `faithful-steed` veri etiketini `partial` → `ok`; fikstür TR özellik adları ↔ gerçek paket adları kontrolü | Düşük | Sürümsüz | 1–2 saat |
| 11 | Testler (probe'lardan kalıcıya): Oath 9–17 büyüleri, Holy Nimbus Incapacitated, Aura of Protection Incapacitated kendi bonusu, Sacred Weapon ikinci silah, Abjure Frightened kısıtı, Lay On Hands heal+cure, A6 Divine Smite Wight | — | — | 2 saat |

### Karar gerekli

| # | Konu | Neden karar |
|---|---|---|
| K1 | **Atılan Melee silah (Javelin) Divine Smite ve Radiant Strikes açar mı?** SRD metni "Melee weapon ya da Unarmed Strike ile isabet" der; Javelin SRD tablosunda Melee silahtır (Thrown özelliği), oyun menzilli saldırıyı dışlıyor (`paladin.test.ts:135` bunu sınıyor, DECISIONS 6505 "yakın dövüş silahıyla"). SRD'ye göre açılmalı; ama Paladin'in menzilli vuruşa Smite eklemesini sağlar | Savaş dengesini değiştirir (denge ölçümü); kullanıcı yorum kararı |
| K2 | **Serüven seviye atlama ve uzun dinlenmede seçimler** (Fighting Style 2, alt sınıf 3, ASI, hazır büyü, Weapon Mastery değişimi): bütün sınıflar için "Karar bekleyen" (DECISIONS 4971); Paladin'de Fighting Style/ASI/hazır büyü eksik kalır | Serüven akışı tasarımı (oluşturucuya geçiş mi, kendi seçici mi) |
| K3 | **Lay On Hands hedefi: "bir yaratık"** (düşman/tarafsız dahil) — oyun yalnız kendine ve dosta izin veriyor (A4) | Düşmana iyileştirme ürün anlamlı mı? (SRD'ye göre izinli; basit "kayda al" da olabilir) |

## Probe dökümü (geçici, silindi)

- **P1** (`zzTmpPaladin1`): `spellLimits` 1–20 (prepared 2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15; cantrips 0), slotlar (1: 2; 5: 4/2; 9: 4/3/2; 13: +4. seviye 1; 17: +5. seviye 1; 20: 4/3/3/3/2), `classKit` Weapon Mastery (2), kaynaklar (11: CD 3, LoH 55; 20: LoH 100, Holy Nimbus 1), `alwaysPrepared` 20 (6 büyü), SRD ↔ oyun Paladin listesi 38/38, Oath 9–17 büyülerinin oyunda varlığı, Lay On Hands (iyileştir+temizle, düşman red, Restoring Touch 4 durum, 13. seviyede Stunned red, efekt kaynaklı Frightened, havuz aşımı, Incapacitated).
- **P2** (`zzTmpPaladin2`): `auraSaveOf` 6/17/18. seviye mesafeleri, Paladin'in kendi save'i 5 → 6 ve Incapacitated iken sürmesi, Radiant Strikes (iki isabet, Unarmed, atılan Javelin yok), Divine Smite (serbest/slot, kritik 4 zar), Unarmed/Javelin `meleeHit`.
- **P3** (`zzTmpPaladin3`): Abjure Foes (CHA 2 → 2 hedef, bağışık hedef etkilenmedi), Sacred Weapon (üç silaha +2, ikinci kullanım tek buff), Divine Sense (bonus eylem, CD, `until` 101), Holy Nimbus (bonus eylem, `saveAdvVs`, `light 6`).
- **P4** (`zzTmpPaladin4`): Holy Nimbus tur sonunda 8 Radiant, Incapacitated Paladin'de hâlâ 8; Abjure bağışık tek hedef; `frightenedNow` aurada/dışında; Find Steed serbest çağrı (`faithfulSteed` 0, slotlar aynı); Unarmed `meleeHit` dolu, atılan Javelin boş.
- **P5**: `advancementSlots('paladin', 20)`: style 2, asi 4/8/12/16, epic 19.
- Slot-büyü kuralı ("tur başına bir slotlu büyü") Paladin'e özgü senaryo üretmediği için (smite bonus eylem, Attack eylemi eylemi harcar) bu belgede denenmedi.

## B94 düzeltmeleri

Görev B94 (2026-11-20). Sürüm sütunu: "94" = kural sürümü 94 (`B94_VERSION`), 93 ve altı eski davranışta; "sürümsüz" = veri/arayüz/oluşturucu/metin.

| Satır | Şimdi | Sürüm | Test |
|---|---|---|---|
| A17 | Paladin'in kendi bonusu save'lere yazılmıyor, aura yolundan (`ownAuraOf`); Incapacitated/0 HP iken sürmüyor (`sourceDown`) | 94 | b94ortak.test.ts |
| C4 | Uzun dinlenmede Weapon Mastery değişimi Serüven'de (`set_choices`) | sürümsüz | levelChoices.test.ts |
| C5 | Serüven seviye atlamada Fighting Style (değişim `stil` seviyede 1), hazır büyü, ASI/feat eklenir | sürümsüz | levelChoices.test.ts |
| C6 | Uzun dinlenmeden sonra 1 hazır büyü değişimi Serüven'de | sürümsüz | levelChoices.test.ts |
| A14 | Süre 10 dakika (`rounds − 1`), Incapacitated/0 HP olunca biter (`endsIfSourceDown`) | 94 | b94paladin.test.ts |
| A18 | Frightened hedef turunda yalnız hareket ya da eylem ya da bonus eylemden birini yapar (etki `oneEconomy`, `economy.ts` `oneEconomyUsed`, hareket kapısı `commands.ts`). Hedef seçimi otomatik kalır (ilk hedef komuttan) | 94 | b94paladin.test.ts |
| A22 | Güçlendirme tek silaha (`choice` ya da ilk yakın dövüş silahı; `enchantBy`), silah bırakılınca güçlendirme ve ışık biter (`endsOnDrop`), ışık 4 + 4 altıgen parlak/loş. Radiant seçimi otomatik kalır (dirençte Radiant) | 94 | b94paladin.test.ts |
| A24 | Yarım siper Paladin'de tek etki `coverAura`: aurada kaldıkça (sonradan giren alır, çıkan kaybeder), Paladin düşmüş/Incapacitated iken yok (`cover.ts` `grantedHalfCover`) | 94 | b94paladin.test.ts |
| A25 | (a) kullanım yokken 5. seviye slotla eylemsiz yenilenir, (b) alan güneş ışığı (`spec.sunlight`), (c) Paladin Incapacitated/0 HP iken alan tetiklenmez (A2 `pausedIfCasterDown`) | 94 | b94paladin, b94ortak |
| A26 | Düzeltme konusu değil (kullanıcı kararı): Oath of Devotion 9/13/17 eksikliği yalnız test fikstüründe; ölçüt bizim paket | - | - |
| D1 | Kısmi: YZ artık bitişik dostta/kendinde kaldırılabilir durum (Poisoned dışı Restoring Touch durumları) varken Lay On Hands ile temizler (`paladinChoice94`); yaralı dostu iyileştirme kuralı aynen | 94 | b94paladin.test.ts |
| D5 | YZ 60 ft içinde Frightened olmayan en az iki düşman varken Abjure Foes kullanır (`ai/b94.ts` `paladinChoice94`) | 94 | b94paladin.test.ts |
| D6 | YZ bonus eylem boşken, kullanımı varken (5. seviye slot harcamaz) ve aurada düşman varken Holy Nimbus kullanır | 94 | b94paladin.test.ts |
| E1 | Arayüz: kaldırılabilir durumu olan yaralı hedefe tek dokunuşta temizleme + kalan havuzla iyileştirme (`MapBattle.tsx` `featureCommand`); ipucu metni TR/EN güncellendi | sürümsüz | - |
| E4 | Divine Sense, Abjure Foes, Holy Nimbus için TR/EN ipucu metni (`strings.tr2.ts`, `strings.en.ts`) | sürümsüz | - |
