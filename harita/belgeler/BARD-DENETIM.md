# Bard denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Kural sürümü 91 (CLAUDE.md), kayıt sürümü 24. Emin olunmayan satırlar geçici vitest probe'larıyla denendi (`src/battle/zzTmpBard*.test.ts`), iş bitince silindi; depoya yalnız bu belge girer.

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 31–35 (Bard; PDF sayfa no = basılı no; `pdftotext -layout`), `data/srd/classes.json` (`bard`), `data/srd/spells.json`. College of Lore mekaniği depodaki fikstürden okundu (`src/rules/fixtures/srd-alt-siniflar.json`, `college-of-lore`); `icerik/` bu checkout'ta yok, gerçek paketteki Türkçe metinler görülmedi (bilinen, DECISIONS AS2). Bard büyü listesi SRD ↔ oyun karşılaştırması probe ile yapıldı.

**Oyun tarafı.** `data/class-features.json` (`bard:*` 912–940, 2147–2182; kaynak `bardicInspiration` 86–98), `src/battle/bard.ts`, `src/battle/effectDice.ts` (ilham ve Peerless Skill), `src/battle/reactions.ts` (Cutting Words 262–300), `src/battle/auras.ts` (Countercharm, zincir), `src/battle/spells69.ts` (Words of Creation 111–118), `src/rules/builder.ts` (liste, Magical Secrets/Discoveries 199–221, 382–384), `src/rules/stats.ts` (Jack of All Trades 334–351), `src/journey/seruven.ts` (seviye atlama 284–290).

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **sapma** (bilinçli sapma; kayıtlı ya da kayda alınması gereken) · **doğrulanmadı**. **[bilinen]** = DECISIONS ya da önceki denetimde yazılı. **[YENİ]** = bu denetimde bulundu. **[hata]** = SRD'ye aykırı, bilinçsiz.

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d8, DEX+CHA save, herhangi 3 beceri, Simple silah, 3 müzik aleti yetkinliği, Light zırh, ekipman A/B (Leather Armor, 2 Dagger, enstrüman, Entertainer's Pack, 19 GP) | 31 |
| S2 | Bardic Inspiration: bonus eylem, 60 ft, "sizi görebilen ya da duyabilen" başka yaratık; bir yaratık bir zar; 1 saat içinde başarısız D20 Testinde zarı atıp ekleyebilir, atılınca biter; kullanım = CHA (en az 1), uzun dinlenmede hepsi; zar d6/d8 (5)/d10 (10)/d12 (15) | 31–32 |
| S3 | Spellcasting: CHA; 2 cantrip (4. ve 10. seviyede +1); hazır sayı tablodan (4…22, CHA+seviye değil); tam büyücü slotları; her Bard seviyesinde bir cantrip ve bir hazır büyü değişimi; müzik aleti odak; domain/her zaman hazır büyüler sayıya girmez | 32 |
| S4 | Expertise (2): 2 beceri; (9): 2 beceri daha | 32 |
| S5 | Jack of All Trades (2): yetkin olunmayan beceri kontrolüne yetkinliğin yarısı (aşağı) | 32 |
| S6 | Alt sınıf (3); ASI 4/8/12/16; Epic Boon (19) | 32–33 |
| S7 | Font of Inspiration (5): kısa ya da uzun dinlenmede bütün kullanımlar; ayrıca bir slot harcayıp (eylemsiz) bir kullanım geri | 32 |
| S8 | Countercharm (7): sen ya da 30 ft içindeki yaratık Charmed/Frightened veren etkinin save'ini kaçırırsa tepkiyle save avantajlı yeniden atılır | 33 |
| S9 | Magical Secrets (10): hazır sayı arttıkça **yeni hazır büyüleri** Bard/Cleric/Druid/Wizard listelerinden seç; büyü değiştirirken de bu listeler | 33 |
| S10 | Superior Inspiration (18): inisiyatif atınca kullanım en az 2'ye tamamlanır | 33 |
| S11 | Words of Creation (20): Power Word Heal ve Kill her zaman hazır; ilk hedefin 10 ft'indeki ikinci yaratık da hedef olabilir | 33 |
| S12 | Bard büyü listesi (130 büyü; 0–9) | 33–35 |
| S13 | College of Lore: Bonus Proficiencies (3: 3 beceri), Cutting Words (3: tepki, 60 ft, bir yaratığın hasar zarı ya da başarılı kontrol/saldırı zarı, Bardic Inspiration zarını çıkar), Magical Discoveries (6: Cleric/Druid/Wizard'dan 2 büyü, her zaman hazır, Bard seviyesi kazanınca birini değiştir), Peerless Skill (14: başarısız kontrol/saldırıya zar ekle, yine başarısızsa harcanmaz) | 35 |

## Özet

| Alan | Satır | tam | kısmi | yok | sapma | doğrulanmadı |
|---|---|---|---|---|---|---|
| A) Savaş içi | 26 | 15 | 7 | 0 | 3 | 1 |
| B) Oluşturucu / seviye atlama | 14 | 8 | 2 | 2 | 2 | 0 |
| C) Dinlenme, Serüven, kayıt | 6 | 3 | 1 | 0 | 2 | 0 |
| D) Yapay zekâ | 6 | 5 | 0 | 0 | 1 | 0 |
| E) Arayüz ve TR/EN | 6 | 3 | 2 | 0 | 0 | 1 |
| **Toplam** | **58** | **34** | **12** | **2** | **8** | **2** |

(Sayım tabloların durum sütunundan; "tam (kod okumasıyla)" tam, "kısmi (…)" kısmi sayıldı.)

**Öne çıkan bulgular:**

1. **[hata, YENİ] College of Lore 10. seviyeden sonra Magical Discoveries büyüleri hazır sayısına giriyor.** `discoveryCap` Magical Secrets varken `null` döndürüyor, `discoveredSpells` boş kalıyor; 2 Discoveries büyüsü (ve cantrip'i) hazır/cantrip sınırından düşülüyor (probe: Lore 10, 15 Bard büyüsü + 2 Wizard büyüsü → "Hazırlanan büyü fazla (17 / 15)"; 4 cantrip + 1 Wizard cantrip → "Cantrip fazla (5 / 4)"). SRD: "her zaman hazır, sayıya girmez". DECISIONS 4647 aksini söylüyor. Lore Bard 10–20'de fiilen 2 hazır büyü ve 1 cantrip eksik. (B9)
2. **Font of Inspiration arayüzde kullanılamıyor [YENİ, kod okumasıyla]:** motor kullanım bitince en düşük slotu harcıyor (probe), ama savaş menüsü kullanım 0 olunca düğmeyi "havuz boş" diye kapatıyor (`MapBattle.tsx:1667`). Cutting Words da slotla ödeyemiyor (probe). (A9, A22, E2)
3. **Cutting Words yalnız saldırı isabeti bağlamında** (`reactions.ts:231`): düşmanın kontrol başarısı ve save'li büyünün hasar zarı (Fireball gibi) tetiklemiyor; SRD "bir hasar zarı ya da başarılı kontrol/saldırı zarı". Bilinen kısmen (DECISIONS 5812), kayıt eksik: "kontrol ve büyü hasarı yok" yazılı, güncel Z2 sürümü yazmıyor. (A21)
4. **Magical Secrets fazla gevşek ve Countercharm kısmen:** 10+ Bard Wizard cantrip'ini de seçebiliyor (SRD yalnız hazır büyüler; probe: Fire Bolt kabul), seçim "yeni/yer değiştiren" ile sınırlı değil. Countercharm yalnız büyü save'lerinde (canavar yeteneği Frightful Presence vb. yok; bilinen). (A13, B10)
5. **Serüven seviye atlaması yalnız seviyeyi artırır** (B12/C3, **bilinen**, DECISIONS M4 4971): Expertise (9), Magical Discoveries (6), cantrip/hazır büyü ve Magical Secrets seçimi sorulmaz.

**Doğru çıkan (regresyon notu):** Bardic Die d6/d8/d10/d12 ve kullanım CHA (min 1); kısa dinlenme yalnız 5+; tablolar (cantrip 2/3/4, hazır 4…22, slot 20/20) SRD ile aynı; Bard listesi 130/130 birebir (0–9: 10/23/23/17/10/17/8/11/6/5); Countercharm kendine ve dosta çalışıyor, Incapacitated Bard'da çalışmıyor; Words of Creation ikinci hedefi ve her zaman hazır iki büyü çalışıyor; Superior Inspiration, Peerless Skill, Jack of All Trades ve Bonus Proficiencies testli.

## A) Savaş içi

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Bardic Inspiration: bonus eylem, 60 ft, başka yaratık (s. 31) | `inspire` etkisi: bonus eylem harcar (probe: `economy.bonus` true, eylem dokunulmadı), 60 ft denetimi, kendine verilemez ("Kendinden başka…"), kullanım 2→1 | tam | probe; `bard.ts:43-54`; `class-features.json:917` | 5806 |
| A2 | "sizi görebilen ya da duyabilen" yaratık (s. 31) | Görme/işitme denetimi yok: Blinded + Deafened dost zar alıyor | **düzeldi (B94)** ← kısmi | probe: "inspire blinded+deafened ally → ok"; `bard.ts:43-54` | yok **[YENİ]** (düşük) |
| A3 | "başka bir yaratık" (düşman dahil) | Yalnız ayakta dost (düşman reddedilir: "Ayakta bir dost seçmelisin"); sivil/çağrılan fark yok | sapma | probe: "inspire B (enemy)"; `bard.ts:50` | 5808 ("başka bir dosta") |
| A4 | Bir yaratık aynı anda tek zar | Hedefte `inspire` etkisi varsa ret ("zaten bir … zarı taşıyor") | tam | `bard.ts:52`; probe: ikinci verme "Bonus eylem bu tur kullanıldı" (aynı tur) | 5808 |
| A5 | 1 saat içinde başarısız D20 Testinde zarı at ve ekle; atılınca biter | Etki 600 tur (probe: `until` 600), saldırı/save/kontrol ikinci şans yolunda atılır, atılınca etki biter; zar tablodan | tam | `effectDice.ts:28-36`, `rules/attack.ts:100`; `bard.test.ts` (ıskalayan saldırı, başarısız save); `k19bard.test.ts` | 5808, 4625 |
| A6 | Yaratık zarı atmayı **seçer** (isteğe bağlı) | Oyuncuya sorulmaz: her başarısız D20 Testinde kendiliğinden atılır, sonucu değiştiremeyecek atışlarda da harcanır (ör. ıskaladığı AC çok yüksekse) | sapma | `rules/attack.ts:100-108` (`onFail` her başarısızlıkta atar) | 5808 ("Oyuncuya sorulmaz") |
| A7 | Kullanım = CHA (en az 1); uzun dinlenmede hepsi | `uses.abilityMod cha, min 1`; probe: CHA +2 → 2 kullanım; uzun dinlenme hepsi | tam | `class-features.json:86-98`; probe | — |
| A8 | Bardic Die d6 → d8 (5) → d10 (10) → d12 (15) | `column: "Bardic Die"` SRD tablosundan; probe seviye 1/5/10/15: 1d6/1d8/1d10/1d12 | tam | probe | 5808 |
| A9 | Font of Inspiration (5): kısa/uzun dinlenmede hepsi; slot harcayıp (eylemsiz) bir kullanım geri | Kısa dinlenme 5+ doldurur (probe: seviye 4 → 0, 5 → 3). Slot: kullanım bitince **kendiliğinden en düşük slot** harcanır (probe: seviye 5 → slot 1; seviye 4 → ret); hangi slotun harcanacağı seçilemez; eylemsiz geri kazanımı ayrı bir adım değil, verme ile birleşik | kısmi | probe; `bard.ts:29-41`; `data` `shortFrom: 5` | 5808 |
| A10 | Bardic Inspiration başka ikinci şansla birlikte (SRD'de yasak yok) | K48 zinciri: önceki ikinci şans tutmazsa ilham zarı da atılır; işaretli savaşçıda zar listeden düşmez (`bardicInspirationFix`, sürüm 16; `bardicInspirationChain`, sürüm 19) | tam | `k19bard.test.ts`, `k48bard.test.ts`; `auras.ts:117` | 4192, 4625 |
| A11 | Jack of All Trades: yetkin olunmayan **beceri** kontrolüne yetkinliğin yarısı (aşağı) | `jack = floor(prof/2)`, `plainBonus` becerisiz beceriye ekler; beceri olmayan ham yetenek kontrolüne eklemez | tam | `stats.ts:335`, `rules/skills.ts:76`; `bard.test.ts:50` | 5809 |
| A12 | JoAT inisiyatife | Oyun inisiyatife de ekliyor (probe: seviye 5 DEX +2 → +3). SRD: Initiative "Dexterity check" (s. 11); beceri kullanmayan ham DEX kontrolü, JoAT'ın "beceri yetkinliği" koşuluna girmez | sapma | probe: init bonus 3; `stats.ts:347` | 5809 (bilinçli, "inisiyatif DEX kontrolü") |
| A13 | Countercharm: tepki, sen ya da 30 ft içindeki yaratık, Charmed/Frightened veren **etkinin** save'i kaçarsa avantajlı yeniden | Büyü save'lerinde tepkiyle avantajlı yeniden atış (probe: Bard kendine ✓, dosta ✓, tepki harcanır; Incapacitated Bard ✓ çalışmaz). Canavar yetenekleri (Frightful Presence vb.) kapsam dışı | kısmi **[bilinen]** | probe; `k18h3.test.ts:122-143`; `effectDice.ts` (`against: Charmed/Frightened`) | 4643; `class-features.json:935` |
| A14 | Expertise: seçilen becerilerde yetkinlik ×2 | `skillTable(..., expertise)`: probe seviye 5 Persuasion +8 = CHA 2 + 2×3 | tam | probe; `rules/skills.ts:50-54` | — |
| A15 | Superior Inspiration (18): inisiyatifte kullanım en az 2'ye | `superiorInspirationEvents` savaş başında (kod); kullanım ≥ 2 ise dokunmaz | tam | `bard.ts:66-72`, `commands.ts:402`; `bard.test.ts:90` | 5811 |
| A16 | Words of Creation: PWH ve PWK her zaman hazır | `alwaysPrepared` 20; probe seviye 20 `spellNames` PWH + PWK | tam | probe; `class-features.json:2175` | 4426 |
| A17 | Words of Creation: ilk hedefin 10 ft'indeki ikinci yaratık da hedef (oyuncu seçer) | Otomatik: aynı taraftan en yakın ikinci yaratık (probe: PWK B ve 10 ft içindeki düşman D öldü; yanında yalnız dost varken ikinci hedef yok); oyuncu seçimi yok, dosta ikinci hedef verilemez | kısmi | probe; `spells69.ts:111-118` | 4426 |
| A18 | Spellcasting: CHA, DC 8 + yetkinlik + CHA; slotlar tablodan | `casting.ability cha`; probe: 7 farklı seviyede slotlar SRD satırıyla aynı (20 → [4,3,3,3,3,2,2,1,1]) | tam | probe; `data/classes.json` bard | — |
| A19 | Savaşta yalnız hazırlanan büyüler yapılır | `spellNames` = hazırlananlar + her zaman hazır (probe: 10. seviye 4 cantrip + 15 büyü → 19) | tam | probe; `create.ts:237-246` | — |
| A20 | Müzik aleti odak | Odak/bileşen takibi oyunda yok (genel); etkisiz | tam (etkisiz) | — | — |
| A21 | Cutting Words: tepki, 60 ft, bir yaratığın **hasar zarı** ya da **başarılı kontrol/saldırı zarı**; zarı çıkar | Yalnız saldırı isabeti bağlamı (`cuttingWords` yalnız `ownHitReactions` içinden, `reactions.ts:231`): saldırı zarından ya da hasardan düşer (karar tepki anında, Z2); düşmanın kontrol başarısı ve save'li büyünün hasar zarı tetiklemiyor; Bard hedefin tarafında olmalı | **düzeldi (B94)** ← kısmi | `reactions.ts:231, 262-300`; `bard.test.ts:116-160` | 5511 (Z2), 5812 (eski metin "kontrol ve büyü hasarına tetik yok") **[bilinen kısmen]** |
| A22 | Cutting Words Bardic Inspiration kullanımı harcar; Font ile (slot) kullanım geri alınabilir | Yalnız `bardicInspiration` kaynağı denetlenir: kullanım 0 iken slot olsa da tepki sunulmaz (probe: kullanım 0, seviye 5 → `reacted` yok) | **düzeldi (B94)** ← kısmi | probe; `reactions.ts:109-117` (`usable`) | **[YENİ]** |
| A23 | Bonus Proficiencies (3): 3 beceri | `classSkills 3`; probe: seviye 6'da 6 beceri istenir (3 sınıf + 3 Lore) | tam | `bard.test.ts:99-101`; probe | 5812 |
| A24 | Magical Discoveries: 2 büyü, Cleric/Druid/Wizard, cantrip ya da slotu olan seviye, her zaman hazır | Seviye 6–9: tam (2 sınırı, 3. reddedilir, sayıya girmez, savaşta hazır). Seviye 10+: bkz. B9 | **düzeldi (B94)** ← kısmi | probe; `k18h3.test.ts:147-163` | 4647 |
| A25 | Peerless Skill (14): başarısız kontrol/saldırıya Bardic Inspiration zarı; yine başarısızsa harcanmaz | `peerless-skill` ikinci şans girişi (`onFail`), kaynak yalnız başarıda harcanır; anahtar `featuresK19`; saldırı + kontrol, save'e değil | tam | `effectDice.ts:96-100`; `k19tier4b.test.ts:136-142` | 4509 |
| A26 | Epic Boon (19; Boon of Spell Recall önerilir) | Genel Boon sistemi (`boons.ts`, `freeCastingEvents` Spell Recall mevcut); Bard'a özgü doğrulama yapılmadı | doğrulanmadı | `spells.ts` `freeCastingEvents` çağrısı | 4482 (genel) |

## B) Oluşturucu / seviye atlama

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | d8, DEX+CHA save, 3 serbest beceri, Simple, Light (s. 31) | `data/classes.json` bard birebir (`skillChoices 3 'any'`, `armorTraining [light]`) | tam | `data/classes.json` | — |
| B2 | 3 müzik aleti yetkinliği | Alet yetkinliği modeli yok (karakterde alan, seçici, kontrol yok); savaş dışı | yok | `rules/stats.ts` `tool` araması boş | yok |
| B3 | Ekipman A: Leather Armor, **2 Dagger**, enstrüman, 19 GP | Öneri `data/onerilen-baslangic.json`: Leather Armor, Rapier, Dagger (SRD ekipmanında Rapier yok) | sapma | `onerilen-baslangic.json` | SD3 |
| B4 | Cantrip 2 (1–3), 3 (4–9), 4 (10+) | `spellLimits` probe: 1:2, 4:3, 10:4 (tabloyla aynı) | tam | probe | — |
| B5 | Hazır sayı **tablodan** (4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22); CHA+seviye kuralı değil | `spellLimits().prepared` tablo sütunundan: probe 1→4, 2→5, 3→6, 4→7, 5→9, 7→11, 9→14, 10→15, 14→17, 20→22 | tam | probe | — |
| B6 | Slot tablosu 1–20 | `deriveStats.spellSlots` SRD satırıyla aynı (probe 13 seviye) | tam | probe | — |
| B7 | Bard büyü listesi (130) | 130 = 130; seviye dağılımı 10/23/23/17/10/17/8/11/6/5 SRD (`data/srd/spells.json`) ile oyun (`classes` `Brd`) arasında birebir | tam | probe | — |
| B8 | Expertise 2 (seviye 2) + 2 (seviye 9) | `kit.expertise` 2 → 4 (probe); oluşturucu seçimi ve sorun denetimi (`expertiseMax`); seçim yalnız yetkin becerilerden | tam | probe; `builder.ts:424-432`; `Builder.tsx:917-974` | — |
| B9 | Magical Discoveries büyüleri **her zaman hazır, sayıya girmez**; 10+ da | Seviye 6–9 doğru. **10+: `discoveryCap` Magical Secrets varken `null` → `discoveredSpells` boş → Discoveries büyüleri ve cantrip'i hazır/cantrip sınırından düşülüyor.** Probe: Lore 10, 15 Bard + 2 Wizard → "Hazırlanan büyü fazla (17 / 15)"; 13 + 2 geçiyor; 4 Bard cantrip + 1 Wizard cantrip → "Cantrip fazla (5 / 4)" | **düzeldi (B94)** ← kısmi (hata) | probe; `builder.ts:211-214, 219-222`; `k18h3.test.ts:152` (`discoveryCap(...,10)` null bekliyor, sorun satırı yok) | 4647 (aksini yazıyor) **[YENİ, hata]** |
| B10 | Magical Secrets (10): hazır sayı artınca **yeni hazır büyüleri** dört listeden; değiştirirken de | 10+'da `spellOptions` dört listeyi (cantrip dahil) tüm seçimlere açar: probe: 10. seviye Bard Fire Bolt'u cantrip olarak seçebiliyor, 9. seviyede reddediliyor; 15 hazır büyünün hepsi Cleric'ten seçilebiliyor (eski seçimler de değiştirilebiliyor) | **düzeldi (B94)** ← kısmi (gevşek) | probe; `builder.ts:196-205` | 4647 |
| B11 | Her Bard seviyesinde bir cantrip ve bir hazır büyü değiştirilebilir | Oluşturucuda her zaman serbest düzenleme (seviye başına bir sınırı yok) | sapma | `builder.ts` (sınır yok) | 4971 genel **[bilinen]** |
| B12 | ASI 4/8/12/16, Epic Boon 19 | `advancement.ts` SRD tablosundan; yuvalar oluşturucuda | tam | `advancement.ts:33-39` | — |
| B13 | Alt sınıf seviye 3 (College of Lore) | Oluşturucu 3+ seviyede ister; varsayılan `college-of-lore` (`alt-sinif-gorunum.json:11`); mekanik fikstürde | tam | `alt-sinif-gorunum.json` | AS2 |
| B14 | Serüven'de seviye atlayınca seçimler (Expertise 9, Discoveries 6, cantrip 4/10, hazır büyü, Magical Secrets) | `level_up` yalnız `sheet.level` artırır (`seruven_leveled`): yeni Expertise, cantrip, hazır büyü ve Discoveries seçimi sorulmaz, oluşturucuya gidilmedikçe eksik kalır; otomatik özellikler (Font, Countercharm, Superior Inspiration, Words of Creation) gelir | **düzeldi (B94)** ← yok **[bilinen]** | `seruven.ts:284-290, 397` | 4971 (M4 "Karar bekleyen") |

## C) Dinlenme, Serüven, kayıt

| # | SRD ne diyor | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Bardic Inspiration: uzun dinlenmede hepsi; 5+ kısa dinlenmede de | `rechargeResources` probe: seviye 4 kısa → 0, seviye 5 kısa → 3, uzun → 3 | tam | probe | 5808 |
| C2 | Slotlar uzun dinlenmede (Font ile ayrıca) | Genel dinlenme kuralı; slotlar uzun dinlenmede dolar | tam | `rules/rest.ts`, `characterRest.ts` | — |
| C3 | Bard seviyesi kazanınca bir cantrip ve bir hazır büyü değişimi; uzun dinlenmede değişim **yok** (Cleric/Druid'den farklı) | Karakter listesi/oluşturucuda serbest düzenleme; Serüven'de değişim yok | **düzeldi (B94)** ← sapma | B11, B14 | 4971 **[bilinen]** |
| C4 | Kaynak kayıt/yükleme | `bardicInspiration` karakter `status.resources` içinde (en çok + harcanan, H-SLOT); savaş sonu karaktere yazılır; gerçek kaydet-yükle turu bu denetimde denenmedi | tam (kod okumasıyla) | `characterRest.ts`; DECISIONS H-SLOT | 4621 |
| C5 | Dostta kalan Bardic Inspiration zarı 1 saat sürer (savaşlar arası) | Zar savaş durumunda süren etkidir; savaş sonu karaktere yazılmaz (kod okumasından çıkarım; savaşlar arası taşınan etki yok) | sapma | — | yok (çıkarım) |
| C6 | Dinlenmede Bard özelliği değişimi/kaynak: Font geri alımı kısa dinlenme | Kısa dinlenme yolculuk motorunda aynı fonksiyon (`shortRest`); Serüven kısa dinlenme sınırı ayrı | kısmi | `journey/engine.ts` | K19B V6 |

## D) Yapay zekâ

| # | Konu | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Bardic Inspiration | Bonus eylem boşken, savaşta düşman varsa, kullanım varsa, çağrılan olmayan ve zarı olmayan dosta; en çok saldıran önce | tam | `ai.ts:2047-2060` | 5813 |
| D2 | Font of Inspiration | YZ slotla ilham vermez (slotlar Hypnotic Pattern vb. için); yalnız kullanım varken | sapma | `ai.ts:2050-2052` | DENGE-4 (yorum) |
| D3 | Cutting Words | Öneri: isabeti çevirme olasılığı ve hasar ağırlığına göre (saldırı mı hasar mı); oyuncuya `askReaction` | tam | `reactions.ts:262-285`; `bard.test.ts:149` | 5511 |
| D4 | Countercharm | Tepki hazırsa kendiliğinden | tam | `k18h3.test.ts:122` | 4643 |
| D5 | Peerless Skill, Superior Inspiration, Jack of All Trades | Pasif, otomatik | tam | `effectDice.ts:96`, `bard.ts:66` | — |
| D6 | Magical Secrets/Discoveries/Words of Creation seçimi | Seçim oyuncunun (sim partisi `k18-cleric` Bard üyesi hazır sheet); PWK/PWH'nin YZ kullanımı genel büyü YZ'si; Bard'a özel sezgi yok | tam (kapsam dışı) | `data/sim-partiler.json` | 3370 |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda ne yapıyor | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| E1 | Özellik adları (SD4: sınıf özelliği adları İngilizce) | EN menü "Inspire" (`strings.en.ts:1192`), TR menü "İlham Ver" (`strings.tr2.ts:460`, SD2 kısa Türkçe ad); kayıt adı Bardic Inspiration. SD2 menü adları ile SD4 "adlar İngilizce kalır" arasında olası tutarsızlık (Cleric denetimi E2 ile aynı) | kısmi | `strings.tr2.ts:458-460` | SD2, SD4 (119) |
| E2 | Font of Inspiration slotla ilham | Motor destekliyor (A9) ama savaş menüsü kullanım 0 iken düğmeyi "havuz boş" kapatıyor | **düzeldi (B94)** ← kısmi **[YENİ]** (kod okumasıyla; arayüz çalıştırılmadı) | `MapBattle.tsx:1663-1667` | — |
| E3 | Kaynak ikonu ve etki simgesi | `bardicInspiration` → `ilham` ikonu; zar taşıyan dostta 🎵 etki ikonu | tam | `data/kaynak-ikon.json:18`; `bard.ts:62` | E4c |
| E4 | Bard özellik açıklamaları (TR/EN) | `data/aciklamalar-tr.json` ve `aciklamalar-en.json` `yetenek` altında Bard kaydı yok (tarama); açıklama kaynağı (SRD İngilizce metni mi, veri notu mu) bu denetimde doğrulanmadı | doğrulanmadı | `aciklamalar-*.json` taraması | SD4 |
| E5 | Alt sınıf adı | TR "Bilgi Koleji", EN "College of Lore" (alt sınıf adları Türkçe hâliyle) | tam | `srd-alt-siniflar.json` | SD4 |
| E6 | Oluşturucu sorun metinleri | "Başka listelerden en çok 2 büyü (N seçildi)", "Hazırlanan büyü fazla", "Cantrip fazla" `issues` (i18n) üzerinden; B9 hatasında kullanıcıya yanıltıcı ek sınır gösterir | tam (metin) | `builder.ts:384` `I()` | SD4 |

## Düzeltme önerileri

Sıra etkiye göre; "Sürüm" sütunu: oluşturucu/arayüz değişimleri kural sürümü gerektirmez; savaş mekaniği değişimleri "güncel sürümün bir fazlası, tek sabit". SRD dışı mekanik önerilmedi.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | Magical Discoveries 10+: `discoveryCap` Magical Secrets varken de Discoveries büyülerini ve cantrip'ini hazır/cantrip sayısından muaf tutsun (sınır 2 kalsın); `k18h3.test.ts:152` `toBeNull` beklentisi gerekçesiyle güncellenecek | Yüksek (Lore 10–20'de 2 hazır büyü + 1 cantrip eksik) | Sürümsüz (oluşturucu) | 1–2 saat |
| 2 | Font of Inspiration düğmesi: kullanım 0 iken slot varsa savaş menüsünde etkin kalsın (slot seçimi: en düşük slot, seçici bonus) | Orta (oyuncu bu özelliği hiç kullanamıyor) | Sürümsüz (arayüz) | 1 saat |
| 3 | Cutting Words ödemesi: kullanım 0 ve Font varsa slotla (en düşük slot) geri alıp harcasın; `usable` ve `cuttingWords` | Orta | Güncel sürümün bir fazlası, tek sabit | 1–2 saat |
| 4 | Cutting Words kapsamı: düşman kontrol başarısı ve save'li hasar (Fireball vb.) zarı | Orta-düşük | Güncel sürümün bir fazlası, tek sabit | 3–5 saat |
| 5 | Magical Secrets sınırı: yalnız hazır (1+) büyüler başka listelerden; cantrip dışarıda; yalnız yeni ya da değiştirilen seçim | Düşük (gevşek) | Sürümsüz (oluşturucu) | 1–2 saat |
| 6 | Bardic Inspiration verirken hedef "görebilir ya da duyabilir" olmalı | Düşük | Güncel sürümün bir fazlası, tek sabit | 30 dk |
| 7 | Words of Creation ikinci hedef seçimi (oyuncu/YZ), dost ikinci hedef | Düşük | Güncel sürümün bir fazlası, tek sabit | 2–3 saat |
| 8 | Jack of All Trades'ı inisiyatiften çıkar (SRD'de beceri değil, ham DEX kontrolü) | Düşük (bilinçli sapma; DECISIONS 5809'u gözden geçir) | Güncel sürümün bir fazlası, tek sabit | 30 dk |
| 9 | Countercharm canavar yetenekleri save'leri (Frightful Presence vb.) | Düşük-orta, bilinen | Güncel sürümün bir fazlası, tek sabit | 2–3 saat |
| 10 | Başlangıç ekipman önerisi 2 Dagger (SRD ekipmanı) | Düşük | Sürümsüz (veri) | 15 dk |
| 11 | E1/E4: SD2 kısa TR menü adları ↔ SD4 "adlar İngilizce" kararını netleştir; Bard özellik açıklamalarının kaynağını `describeTr` ile doğrula | Düşük | Sürümsüz | 1–2 saat |
| 12 | Test boşlukları (probe'lar kalıcı teste): Lore 10+ sayım, Font ile Cutting Words, Blinded/Deafened hedef, Words ikinci hedef, kısa dinlenme 4/5 | — | — | 2 saat |

### Karar gerekli (temel mekaniği değiştirir)

| # | Konu | Neden |
|---|---|---|
| K1 | Bardic Inspiration zarı kullanımı oyuncu kararı olsun mu (SRD: "can roll")? Şu an her başarısızlıkta otomatik atılır, kullanım boşa gidebilir (A6) | Tepki sistemine (`askReaction`) yeni bir tetik; zar defteri ve kayıt formatı etkilenir |
| K2 | Serüven seviye atlamasında Bard seçimleri (Expertise 9, Discoveries 6, cantrip 4/10, hazır büyü, Magical Secrets) (B14, **bilinen**) | Ürün akışı: DECISIONS M4 "Karar bekleyen"; kayıt/oluşturucu bağı |
| K3 | Alet yetkinliği (3 müzik aleti) modeli (B2) | Karakter modeli genişlemesi; savaşa etkisi yok |
| K4 | Savaşlar arası Bardic Inspiration zarı taşınması (1 saat, C5) | Süren etkileri karakter durumuna yazmak yeni sistem |

## B94 düzeltmeleri

Görev B94 (2026-11-20). Sürüm sütunu: "94" = kural sürümü 94 (`B94_VERSION`), 93 ve altı eski davranışta; "sürümsüz" = veri/arayüz/oluşturucu/metin.

| Satır | Şimdi | Sürüm | Test |
|---|---|---|---|
| B14 | Serüven seviye atlamada Bard seçimleri ortak yardımcıyla (`set_choices`; seviyede 1 cantrip + 1 hazır büyü; Expertise, Discoveries, Magical Secrets eklenir) | sürümsüz | levelChoices.test.ts |
| C3 | Seviye atlamada bir cantrip/hazır büyü değişimi Serüven'de (`data/secim-degisim.json` bard) | sürümsüz | levelChoices.test.ts |
| A2 | Hedef Bard'ı göremiyor (Blinded/görüş hattı yok) ve duyamıyorsa (Deafened/Silence) zar verilmez (`bard.ts` `perceives`) | 94 | b94bard.test.ts |
| A9 | Kısmi kalır: savaş menüsü artık kullanım 0 iken slotla verir (E2); harcanan slot yine en düşük (seçici yok) | sürümsüz | b94bard.test.ts |
| A13 | Kısmi kalır: Countercharm alan/aura save'lerinde de (`zones.ts`, `against`; canavar aurası, Fear benzeri alanlar); harita/efsanevi `saveEffect` yolu ikinci şans zarı desteklemiyor (ortak save yolu işi, ertelendi) | 94 | b94bard.test.ts |
| A17 | Motor: ikinci hedef `cast_spell.targetIds` ile seçilir (herhangi taraf, ilk hedefin 10 ft'i); seçilmezse eski varsayılan. Arayüzde ikinci hedef seçicisi yok (ertelendi, arayüz işi) | 94 | b94bard.test.ts |
| A21 | Saldırı isabetine ek olarak save'li büyü ve alan hasar zarında (bir kez, dost etkilenecekken; `cuttingWordsDamage`) ve düşmanın başarılı kaçış kontrolünde (grapple ve kısıtlama; `cuttingWordsCheck`). GM'in istediği tekil beceri kontrolü kapsam dışı | 94 | b94bard.test.ts |
| A22 | Kullanım 0 iken Font of Inspiration ile en düşük slot harcanıp Cutting Words yapılır (`cuttingPaid`) | 94 | b94bard.test.ts |
| A24 | 10+ seviyede de Discoveries 2 büyüsü sayıya girmez (bkz. B9) | sürümsüz | b94bard.test.ts |
| B9 | `discoveryCap` 10+'da da 2; başka liste cantrip'leri önce Discoveries sayılır, kalan hak sıradaki başka liste büyüsüne; Magical Secrets büyüleri sayıya girer. `k18h3.test.ts` beklentisi null → 2 | sürümsüz | b94bard.test.ts |
| B10 | Magical Secrets yalnız hazırlanan (1+) büyüleri açar; başka listeden cantrip yalnız Discoveries ile. "Yeni/değiştirilen" kısıtı Serüven'de seviye penceresiyle (A1), oluşturucuda serbest düzenleme (bilinçli sapma B11) | sürümsüz | b94bard.test.ts |
| E2 | Savaş menüsü kullanım 0 iken Font ile slot varsa düğmeyi açık tutar (`inspirePayable`) | sürümsüz | b94bard.test.ts |
