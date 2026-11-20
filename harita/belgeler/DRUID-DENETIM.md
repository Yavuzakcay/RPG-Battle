# Druid denetimi (SRD 5.2.1 ↔ oyun; Wild Shape hariç)

Tarih: 2026-11-20. Yalnız denetim: kod, veri ve test değişmedi. Emin olunmayan satırlar geçici vitest dosyalarıyla (`src/battle/zzTmpDruid*.test.ts`) denendi ve silindi; depoda kalmadı. Kural sürümü 91 (güncel).

**Kaynaklar.** `docs/SRD_CC_v5.2.1.pdf` s. 41–46 (`pdftotext`; sayfa numaraları PDF sayfasıdır, SRD basılı numarasıyla aynı), `data/srd/classes.json` (Druid tablosu), `data/srd/spells.json` (büyü listesi). Circle of the Land mekaniği `icerik/` (gitignore) bu checkout'ta olmadığı için **depodaki fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:343–550`; CLAUDE.md: paketle aynı kimlik ve mekanik). Gerçek paketteki Türkçe adlar ve metinler görülmedi. Mobil/APK'da `icerik/` olmadığı için Circle of the Land paket içe aktarılmadıkça seçilemez (bilinen, DECISIONS AS2).

**Oyun tarafı.** `data/class-features.json` (`druid:*` 989–1010, 2187–2255; kaynaklar `wildResurgence`, `naturalRecovery`, `naturalRecoveryCast`, `natureMagician`), `src/battle/druid.ts`, `src/battle/apex.ts` (Nature's Sanctuary), `src/battle/cleric.ts:234` (Primal Strike, Divine Strike ile ortak), `src/rules/classFeatures.ts`, `src/rules/builder.ts`, `src/rules/characterRest.ts`.

**Kapsam dışı (ayrı belgeler).** Wild Shape (s. 42–43: biçim kuralları, bilinen biçimler, geçici HP, oyun istatistikleri, nesneler) → `harita/belgeler/WILD-SHAPE-DENETIM.md` ve `WILD-SHAPE-BICIMLER-DENETIM.md`; bu belgede tekrarlanmadı. Wild Shape'e bağlı kaynak (`wildShape` kullanımı) yalnız Land's Aid, Nature's Sanctuary, Wild Companion, Wild Resurgence ve Nature Magician açısından ele alındı. Büyü bazlı mekanik farklar `harita/belgeler/BUYU-DURUM.md` kapsamında. Weapon Mastery / Fighting Style / Expertise Druid'de yok.

**Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kayıtlı karar ya da kayda alınması gereken). **[bilinen]** = DECISIONS.md ya da denetim belgelerinde zaten yazılı. **[YENİ]** = bu denetimde bulundu, kayıt yok. **[hata]** = SRD'ye aykırı, bilinçsiz.

## SRD kural listesi (sayfa)

| # | SRD kuralı | Sayfa |
|---|---|---|
| S1 | Çekirdek: d8, INT+WIS save, 2 beceri (Animal Handling, Arcana, Insight, Medicine, Nature, Perception, Religion, Survival), Simple silah, Herbalism Kit, Light zırh + Shield, başlangıç ekipmanı A/B | 41 |
| S2 | Spellcasting: 2 cantrip (4. ve 10. seviyede +1), hazırlanan büyü **tablodan** (4…22; WIS+seviye değil), tam büyücü slotları, uzun dinlenmede hazırlık değişimi, her seviyede 1 cantrip değişimi, WIS, Druidic Focus, her zaman hazırlar sayıya girmez | 41–42 |
| S3 | Druidic: Speak with Animals her zaman hazır; gizli mesajlar | 42 |
| S4 | Primal Order: Magician (+1 cantrip, Arcana/Nature'a WIS bonusu, en az +1) / Warden (Martial + Medium zırh) | 42 |
| S5 | Wild Shape (2.) ve Beast Shapes tablosu | 42–43 (kapsam dışı) |
| S6 | Wild Companion (2.): Magic eylemi, slot ya da Wild Shape kullanımı, Find Familiar Material'sız; familiar **Fey**, Long Rest'te kaybolur | 43 |
| S7 | Druid Subclass (3.), ASI 4/8/12/16, Epic Boon 19 | 43 |
| S8 | Wild Resurgence (5.): turda bir, kullanım yoksa slotla bir kullanım (eylemsiz); kullanımla 1. seviye slot, Long Rest'te bir kez | 43 |
| S9 | Elemental Fury (7.): Potent Spellcasting (Druid cantrip hasarına WIS) ya da Primal Strike (kendi turunda bir kez, silah ya da Beast saldırısı, +1d8 Cold/Fire/Lightning/Thunder, isabette seç) | 43 |
| S10 | Improved Elemental Fury (15.): Potent: ≥10 ft cantrip menzili +300 ft; Primal Strike 2d8 | 43 |
| S11 | Beast Spells (18.): biçimde büyü; **maliyetli ya da tüketilen Material'lı büyü hariç** | 43 |
| S12 | Archdruid (20.): Evergreen Wild Shape (inisiyatifte), Nature Magician (kullanım başına 2 seviye, Long Rest'te bir), Longevity | 43 |
| S13 | Druid büyü listesi (124 büyü; 0–9) | 44–45 |
| S14 | Circle of the Land: Circle Spells (4 arazi; her Long Rest'te seç; 3/5/7/9), Land's Aid (3.), Natural Recovery (6.), Nature's Ward (10.), Nature's Sanctuary (14.) | 46 |

## Özet

Toplam **61** satır (Wild Shape hariç): **tam 31**, **kısmi 12**, **yok 4**, **bilinçli sapma 13**, **doğrulanmadı 1** (C9). Daha önce belgelenmiş ("bilinen") konu içeren satır: 12.

| Bölüm | tam | kısmi | yok | bilinçli sapma | doğrulanmadı | Toplam |
|---|---|---|---|---|---|---|
| A) Savaş içi | 15 | 7 | 1 | 8 | 0 | 31 |
| B) Oluşturucu / seviye atlama (çekirdek dahil) | 8 | 2 | 1 | 2 | 0 | 13 |
| C) Dinlenme, Serüven, kayıt | 5 | 1 | 1 | 2 | 1 | 10 |
| D) Yapay zekâ | 2 | 0 | 1 | 1 | 0 | 4 |
| E) Arayüz ve TR/EN | 1 | 2 | 0 | 0 | 0 | 3 |
| **Toplam** | **31** | **12** | **4** | **13** | **1** | **61** |

(Sayım, tablo satırlarının durum sütunundan; "tam (kod okuması)" tam, "kısmi … [hata]" kısmi sayıldı. A30 "yok [hata]" yok sayıldı.)

**Öne çıkan bulgular:**

1. **[hata] Land's Aid 0 HP'deki (yere düşmüş) dostu iyileştirmiyor** (A22): alan canlıları `hp > 0` süzüyor, alandaki 0 HP'li dost hiç sayılmıyor. SRD: "one creature of your choice in that area regains 2d6 HP" (s. 46). Probe: 30 maks HP'li dost 0 HP'de → iyileştirme olayı yok, HP 0 kaldı. Druid'in en ucuz "dostu ayağa kaldır" yolu kapalı.
2. **[hata] Natural Recovery slotsuz büyü listesi dört arazinin hepsinin Circle büyülerini kapsıyor** (A26): SRD "prepared from your **Circle Spells** feature". Temperate seçen Druid sıradan büyü olarak hazırladığı Fog Cloud ve Hold Person'ı (Polar arazi listesinde) da slotsuz yapabiliyor. Probe: `freeSpells` bunları `naturalRecoveryCast` ile bağladı.
3. **[hata] Wild Companion familiar türünü Fey'e zorlamıyor** (A4): oyun varsayılan türü Celestial yapıyor, oyuncu Fiend de seçebiliyor. SRD: "the familiar is Fey". Probe: varsayılan `celestial`, `choice: 'fiend'` kabul edildi.
4. **[hata] Nature's Sanctuary Druid Incapacitated olunca ya da ölünce bitmiyor** (A30): SRD "1 minute or until you have the Incapacitated condition or die" (s. 46). Probe: Druid Incapacitated sonrası alan duruyor. Aynı "kaynak etkisiz kalınca biter" eksiği Cleric'in Turn Undead'inde de var (CLERIC-DENETIM A14).
5. **[hata] Primal Strike düşmanın turunda yapılan fırsat saldırısında da çalışıyor** (A11): SRD "once on each of **your** turns". Probe: düşmanın turunda Druid'in OA'sı `Primal Strike` ek hasarı aldı. Kod `divineStrikeHit` Divine Strike ile ortak (CLERIC-DENETIM A17); tek düzeltme ikisini kapatır.
6. **Serüven seviye atlaması yalnız seviyeyi artırır** (C4, **[bilinen]** DECISIONS M4): yeni cantrip/hazır büyü, Elemental Fury seçimi, Circle arazisi ve uzun dinlenmede liste değişimi Serüven'de yok; varsayılanlar (Warden, Primal Strike, Temperate) çalışır. Hazırlanan büyü sayısı SRD tablosundan gelir (WIS+seviye değil; 20/20 seviye doğrulandı).

Doğrulananlar (regresyon notu): tablo (cantrip, hazırlanan, slot, Wild Shape sütunu) 20/20 seviye SRD ile aynı; Druid büyü listesi 124 = 124 (seviye dağılımı 11/18/21/13/18/15/10/6/8/4); Evergreen Wild Shape inisiyatifte 0→1; Nature Magician 2 kullanım → 4. seviye slot, ikinci kullanım red; Wild Resurgence her iki yönde SRD'ye uygun; Primal Strike 1d8 → 2d8 (15.); Potent Spellcasting WIS (Poison Spray, Starry Wisp); Nature's Ward 10'da direnç + Poisoned bağışıklığı, 9'da yok.

## B) Oluşturucu ve seviye atlama (çekirdek ve tablo dahil)

| # | SRD kuralı (sayfa) | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| B1 | Çekirdek: d8, INT+WIS save, Simple silah, Light zırh + Shield, 2 beceri (8 seçenek) (s. 41) | `data/classes.json` birebir | tam | `data/classes.json` (druid): `hitDie 8`, `saves int/wis`, `armorTraining light/shield`, 8 beceri | — |
| B2 | Herbalism Kit araç yetkinliği (s. 41) | Oyunda araç yetkinliği modellenmiyor (hiçbir sınıf için) | bilinçli sapma | `grep toolProficienc` yalnız `data/prospektus` | **[YENİ]** (genel konu) |
| B3 | Başlangıç ekipmanı A: Leather Armor, Shield, Sickle, Druidic Focus (Quarterstaff), Explorer's Pack, Herbalism Kit, 9 GP (s. 41) | Öneri: Leather Armor, kalkan, Quarterstaff; Sickle, paket, kit, GP yok | kısmi | `data/onerilen-baslangic.json` (druid) | **[YENİ]** (düşük) |
| B4 | Cantrip 2 (4.: 3; 10.: 4), hazırlanan 4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22, slotlar (s. 41) | `spellLimits('druid', L)` ve `deriveStats(...).spellSlots` | tam | probe: 20 seviye de SRD tablosuyla aynı (cantrip, hazırlanan, slot, Wild Shape sütunu) | — |
| B5 | Hazırlanan sayısı tablodan, WIS+seviye değil (s. 42) | Tablodan: `spellLimits` → `tableValue(..., 'Prepared Spells')` | tam | `src/rules/builder.ts:175`; probe | kullanıcı sorusu doğrulandı |
| B6 | Druid büyü listesi: 11/18/21/13/18/15/10/6/8/4 = 124 büyü (s. 44–45) | Oyun `Drd` listesi = SRD listesi; eksik/fazla yok | tam | probe: `spells.filter(classes ∋ 'Drd')` ↔ `data/srd/spells.json` | — |
| B7 | Primal Order seçimi (1.): Magician / Warden (s. 42) | Seçenekli özellik `druid:primal-order`; varsayılan **Warden** (SRD'de sıra yok); Warden: Martial silah + Medium zırh; Magician: +1 cantrip (3 → 4 seviye 1'de) | tam | probe: varsayılan zırh `medium` true, Magician false; Longsword Warden true, Magician false; `class-features.json:2187` | DECISIONS 5801 |
| B8 | Magician: Arcana/Nature kontrollerine WIS bonusu (en az +1) (s. 42) | Uygulanmıyor (beceri kontrolü sistemi yok); veri notu "savaş dışı" | bilinçli sapma | `class-features.json:2206` | DECISIONS 5801 |
| B9 | Alt sınıf 3., ASI 4/8/12/16, Epic Boon 19 (s. 43) | `advancement.ts` SRD tablosundan; alt sınıf yalnız Circle of the Land (SRD); varsayılan Circle of the Land | tam | `src/rules/advancement.ts:33–39`; `data/alt-sinif-gorunum.json` | AS2 |
| B10 | Elemental Fury seçimi (7.), Circle arazisi seçimi (3.) | Oluşturucuda seçenek; varsayılan Primal Strike ve Temperate | tam | `class-features.json:2221`; probe: arazi varsayılanı Temperate | DECISIONS 5802 |
| B11 | Her zaman hazır büyüler (Speak with Animals, Circle büyüleri) hazırlanan sayıya girmez (s. 42) | `alwaysPrepared` ayrı; `spellCounts` yalnız seçilen `spellNames`'i sayar (gözle okundu; sayma ayrıca probe edilmedi) | tam (kod okuması) | `src/rules/builder.ts:185–192` | — |
| B12 | Her seviyede bir cantrip değişimi; uzun dinlenmede hazırlık değişimi (s. 41–42) | Oluşturucuda serbest düzenleme (kısıtsız); kısıtların (yalnız seviye atlayınca cantrip, yalnız uzun dinlenmede hazırlık) uygulanıp uygulanmadığı **doğrulanmadı**; Serüven'de düzenleme yok (C5) | kısmi | `src/rules/builder.ts` (kısıt yok) | **[bilinen]** (Cleric B7) |
| B13 | Druidic Focus spellcasting focus (s. 42) | Büyü bileşen takibi yok; Quarterstaff silah olarak var | yok | genel bileşen yokluğu | **[YENİ]** (genel, etkisiz) |

## A) Savaş içi

| # | SRD kuralı (sayfa) | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| A1 | Büyü yeteneği WIS; DC = 8 + yetkinlik + WIS (s. 42) | `casting.ability: wis`; `spellSaveDc` | tam | `data/classes.json`; probe (Land's Aid DC kullanıyor) | — |
| A2 | Druidic: Speak with Animals her zaman hazır (s. 42) | `alwaysPrepared` 1. seviyede | tam | probe: kit 1. seviye `["Speak with Animals"]` | DECISIONS 5801 |
| A3 | Druidic gizli mesajlar (s. 42) | Savaş dışı (hikâye) | bilinçli sapma | `class-features.json:994` notu | DECISIONS 5801 |
| A4 | Wild Companion: familiar **Fey** (s. 43) | Familiar türü büyü seçiminden (`def.choice`): varsayılan **Celestial**, oyuncu Fiend seçebiliyor; Fey zorunlu değil | kısmi **[hata, YENİ]** | probe: varsayılan `celestial`; `choice: 'fiend'` kabul; `summons.ts:406` `typeOf = choice` (Wild Companion kolu yok) | DECISIONS 4556 (notta "Familiar Fey" yazıyor, kodda yok) |
| A5 | Wild Companion: Magic eylemi, slot ya da Wild Shape kullanımı, Material'sız (s. 43) | Eylem harcar, slot (probe: 1. seviye −1) ya da "Slotsuz" = Wild Shape (probe: 2→1, slotlar aynı); savaş içi `featuresK19` (sürüm 16+) kapısı | tam | probe; `economy.ts:388–392`, `summons.ts:287,312` | DECISIONS 4556 |
| A6 | Wild Resurgence (5.): turda bir, kullanım yoksa slotla bir kullanım, eylemsiz (s. 43) | `toShape`: kullanım varsa red, turda bir, eylem harcanmaz (probe) | tam | probe: `{ action:false }`, kullanım 0→1; `druid.ts:181–205`; `druid.test.ts:115` | DECISIONS 5801 |
| A7 | Wild Resurgence: harcanacak slotu oyuncu seçer (s. 43) | **En düşük** slot otomatik (probe: [0,2,1] → [0,1,1]); arayüzde slot seçimi yok | bilinçli sapma | probe; `druid.ts:197`; `MapBattle.tsx:1657` | DECISIONS 5801 |
| A8 | Wild Resurgence: kullanımla 1. seviye slot, Long Rest'te bir kez (s. 43) | `toSlot` + kaynak `wildResurgence`: ikinci kullanım red (probe), uzun dinlenmede döner | tam | probe: "Bu dinlenmede kullanıldı."; `druid.ts:206–211` | DECISIONS 5801 |
| A9 | Potent Spellcasting (7.): **Druid** cantrip hasarına WIS (s. 43) | Cantrip ölçekli bütün hasar cantrip'lerine WIS (Poison Spray 2d12 + 2: 14; Starry Wisp 2d8+2: 10); Druid listesi ayrımı yok (Magic Initiate cantrip'i de). Produce Flame fırlatma hasarı **doğrulanmadı** (elde alev olayı) | bilinçli sapma (bilinen) | probe; `cleric.ts:231`, `spells.ts:113` | DECISIONS 4613 (Cleric kaydı, ortak) |
| A10 | Primal Strike (7.): silah ya da Beast saldırısı isabeti, +1d8 element (s. 43) | Silah ve Beast biçimi saldırısı (probe: Quarterstaff → +5 Cold); kritikte zar ikiye katlanır | tam | probe; `cleric.ts:234–246`; `druid.test.ts:134` | DECISIONS 5801 |
| A11 | Primal Strike: **"on each of your turns"** (kendi turun) (s. 43) | Tur anahtarı o anki turun anahtarı: düşmanın turunda Druid'in fırsat saldırısı da +1d8 alır (probe: OA `extra: ["Primal Strike"]`); kendi turunda ayrıca bir kez daha alabilir | kısmi **[hata, YENİ]** | probe; `classTraits.ts:24` `usedThisTurn` | Divine Strike ile ortak (CLERIC-DENETIM A17) |
| A12 | Primal Strike: tür isabette seçilir (s. 43) | Otomatik: hedefe daha çok işleyen (direnç/bağışıklık gözetilir) | bilinçli sapma | `cleric.ts:236` `bestType` | DECISIONS 5801 |
| A13 | Improved Primal Strike (15.): 2d8 (s. 43) | `improved-primal-strike` → 2d8 (probe: rolls [5,5]) | tam | probe | DECISIONS 4493 |
| A14 | Improved Potent: ≥10 ft menzilli **Druid** cantrip'in menzili +300 ft (s. 43) | Probe: Poison Spray 30→330, Starry Wisp 60→360, Druidcraft 30→330, Guidance (5 ft) değişmez ✓; **Fire Bolt (Druid listesinde değil) 120→420** (liste ayrımı yok); `featuresK19` (sürüm 16+) kapısı; `k19Traits` işareti `syncAuras` yazar | kısmi **[YENİ]** (düşük) | probe; `range.ts:187–191` | DECISIONS 4493 |
| A15 | Beast Spells (18.): biçimde büyü yap (s. 43) | 18'de biçimdeyken büyü yapılabilir, 17'de red (probe); biçim konsantrasyonu bozmaz (probe: Faerie Fire kaldı); hazırlama (Hazırla) da aynı kapıdan | tam | probe; `spells.ts:544`, `ready.ts:94` | DECISIONS 5800, 251 |
| A16 | Beast Spells: maliyetli ya da tüketilen Material'lı büyü **hariç** (Revivify, Heroes' Feast, Greater Restoration, Stoneskin, Plane Shift…) (s. 43) | Kural yok: bileşen maliyeti takibi oyunda hiç yok; probe: Greater Restoration biçimde çağrıldı (reddedilmedi, başka nedenle etkisiz kaldı) | kısmi **[YENİ]** | probe; `grep worth/consumed spells.ts` boş | — |
| A17 | Evergreen Wild Shape (20.): inisiyatif atınca kullanım yoksa bir kullanım (s. 43) | `start_battle` içinde `evergreenEvents` (probe: 0→1) | tam | probe; `druid.ts:256`, `commands.ts:402` | DECISIONS 5801 |
| A18 | Nature Magician (20.): kullanım başına 2 seviyelik tek slot, Long Rest'te bir, eylemsiz (s. 43) | Komut `wild_resurgence` kipi `magician`: 1–4 kullanım (2→4. seviye slot, 4→8. seviye; probe), tekrar red; `featuresK19` kapısı | tam | probe: [4,3,3,3,…] → 4. seviye slot +1; 4 kullanım → 8. seviye +1; "Bu dinlenmede kullanıldı." | DECISIONS 4494 |
| A19 | Longevity (20.) (s. 43) | Hikâye (savaş dışı) | bilinçli sapma | `class-features.json:2255` notu | DECISIONS 4494 |
| A20 | Circle Spells: arid/polar/temperate/tropical, 3/5/7/9, her zaman hazır (s. 46) | Fikstürde seçenek başına `alwaysPrepared` (cantrip dahil); probe tropical 3/5/7/9 ve varsayılan Temperate SRD tablosuyla aynı | tam | probe; `srd-alt-siniflar.json:356–460` | DECISIONS 5802, 4540 |
| A21 | Land's Aid (3.): Magic eylemi, Wild Shape kullanımı, 60 ft içinde nokta, 10 ft küre, **seçtiğin** yaratıklar CON save, 2d6 Necrotic (başarıda yarı; 10: 3d6, 14: 4d6) (s. 46) | Eylem + `wildShape` −1; 60 ft menzil denetimi; küredeki **düşmanlar** save (dost zarar görmez); zar 2/3/4 | tam | `druid.ts:214–253`; `druid.test.ts:150` (düşman save'li Necrotic, dost save atmaz) | DECISIONS 5802 |
| A22 | Land's Aid: alandaki **bir** yaratık 2d6 HP geri kazanır (0 HP'deki dahil) (s. 46) | Yalnız `hp > 0` olanlar sayılıyor: **0 HP'deki dost hiç iyileşmiyor** (probe: C 0/30 → iyileştirme olayı yok, HP 0) | kısmi **[hata, YENİ]** | probe; `druid.ts:236` `living = ... c.hp > 0` | — |
| A23 | Land's Aid: iyileşen yaratığı oyuncu seçer (s. 46) | En yaralı dost otomatik (kendisi dahil) | bilinçli sapma | `druid.ts:246` | DECISIONS 5802 ("oyunda düşmanlar ve en yaralı dost") |
| A24 | Natural Recovery (6.), kısa dinlenme: toplamı ⌈seviye/2⌉ olan slotlar, 6+ yok, Long Rest'te bir kez (s. 46) | `arcaneRecovery(..., 'naturalRecovery')` (aynı bütçe), en yüksek slottan; kaynak 0'lanır, uzun dinlenmede döner; Serüven kısa dinlenmesi aynı fonksiyon | tam | `characterRest.ts:118,170–180`; `druid.test.ts:160` (6. seviye: bir 3. seviye slot) | DECISIONS 5802 |
| A25 | Natural Recovery: hangi slotların döneceğini oyuncu seçer; kullanmak isteğe bağlı (s. 46) | Otomatik, en yüksek slottan; eksik slot varsa ilk kısa dinlenme hakkı yakar (seçim/erteleme yok) | bilinçli sapma (bilinen) | `characterRest.ts:114–118` | Wizard C2 ile ortak **[bilinen]** |
| A26 | Natural Recovery: **Circle Spells'ten** hazır bir 1+ seviye büyü slotsuz, Long Rest'te bir kez (s. 46) | Kaynak `naturalRecoveryCast`: `freeSpellList.names` = **dört arazinin hepsinin** büyüleri; bilinen (hazır) herhangi bir eşleşen büyü slotsuz yapılabiliyor. Probe: Temperate Druid 9 sv, sıradan hazırladığı Fog Cloud ve Hold Person (Polar listesi) `freeSpells`'e bağlandı | kısmi **[hata, YENİ]** | probe: `freeSpells` {Fog Cloud, Hold Person, Misty Step, Sleep, Lightning Bolt, Freedom of Movement, Tree Stride → naturalRecoveryCast}; `class-features.json:559–585`, `create.ts:335–356` | DECISIONS 4540 ("hazırlanmış bir daire büyüsü") |
| A27 | Nature's Ward (10.): Poisoned bağışıklığı + seçili arazinin direnci (Arid Fire, Polar Cold, Temperate Lightning, Tropical Poison) (s. 46) | 10'da direnç (probe: Tropical → poison; 9'da yok), Poisoned: 10'da uygulanmaz, 9'da uygulanır (probe); bağışıklık anahtarı `naturesWard` (sürüm 14+) | tam | probe; `classFeatures.ts:302`, `reduce.ts:165` | DECISIONS 5802; K18 H3 |
| A28 | Nature's Sanctuary (14.): Magic eylemi, Wild Shape kullanımı, 120 ft içinde 15 ft küp, 1 dk; **sen ve müttefikler** yarım siper; müttefikler Ward direnci alır (s. 46) | Eylem + `wildShape` −1, 120 ft, süre `until = round + 9` (10 tur); alan `coverFor: allies` + `resist` (Land türü işaretinden); probe: alan oluştu, direnç `lightning` | tam | probe; `apex.ts:111–120,227–240`; `cover.ts:279`; `auras.ts:70` | DECISIONS 4508 |
| A29 | Nature's Sanctuary: 15 ft küp | Merkez + 6 komşu = 7 altıgen (yaklaşık) | bilinçli sapma | probe: `hexes: 7` | DECISIONS 4508 |
| A30 | Nature's Sanctuary: **Incapacitated olunca ya da ölünce biter** (s. 46) | Yok: alan yalnız süreyle biter. Probe: Druid Incapacitated + olay sonrası alan hâlâ var | yok **[hata, YENİ]** | probe | — (CLERIC-DENETIM A14 ile aynı eksik) |
| A31 | Nature's Sanctuary: bonus eylemle 60 ft taşı, **Druid'in 120 ft içindeki** zemine (s. 46) | Bonus eylem harcar (probe: ikinci taşıma "Bonus eylem bu tur kullanıldı"), ≤ 60 ft denetimi var; yeni merkezin Druid'e 120 ft içinde olması **denetlenmiyor** (`apex.ts:112–117` yalnız eski merkeze 60 ft) | kısmi **[YENİ]** (düşük) | kod okuması + probe (menzil ihlali sahnesi kurulamadı: harita 70 ft) | DECISIONS 4508 |

## C) Dinlenme, Serüven ve kayıt

| # | SRD kuralı (sayfa) | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| C1 | Wild Shape kullanımı: kısa dinlenmede 1, uzun dinlenmede hepsi (s. 42) — Land's Aid, Sanctuary, Wild Companion bu kaynağı harcar | `recharge short 1 / long all` | tam | probe: `rechargeResources` kısa 0→1, uzun 0→4 | — |
| C2 | Wild Resurgence, Natural Recovery (iki kaynak), Nature Magician: Long Rest'te yenilenir (s. 43, 46) | Uzun dinlenmede dolar, kısa dinlenmede dolmaz | tam | probe: kısa → hepsi 0, uzun → hepsi tam | — |
| C3 | Serüven kısa dinlenme düğümünde Natural Recovery | `short_rest` → `shortRestStatus` (kaynak + slot geri kazanımı aynı yol) | tam (kod okuması) | `src/journey/engine.ts:126` | — |
| C4 | Seviye atlayınca yeni cantrip/hazır büyü, ASI/feat, Elemental Fury seçimi, alt sınıf (3.) | Serüven `level_up` yalnız `seruven_leveled`: `sheet.level`'ı artırır; seçim adımı yok. Hazırlanan sayısı tablodan artar ama liste büyümez; seçilmemiş seçimler varsayılana düşer (Warden, Primal Strike, Temperate) | kısmi **[bilinen]** | `src/journey/seruven.ts:284–290,397`; Wizard C8 ile aynı | DECISIONS 4971 (M4 "Karar bekleyen") |
| C5 | Uzun dinlenmeden sonra hazır büyü ve cantrip değiştirme (s. 41–42) — Serüven | Serüven'de karakter düzenlenmez (parti = seçim anındaki `sheet` kopyası); düzenleme yalnız karakter ekranında | yok **[bilinen]** | `src/journey/seruven.ts:225`, `SeruvenScreen.tsx:169` (Wizard C7 ile aynı) | DECISIONS 4971 |
| C6 | Circle of the Land: **her Long Rest'te** arazi türünü yeniden seç (s. 46) | Seçim oluşturucuda sabit (`featureChoices`); dinlenmede seçici yok; Nature's Ward direnci ve Sanctuary direnci arazi işaretinden | bilinçli sapma | `srd-alt-siniflar.json:356` notu: "uzun dinlenmede değişim = düzenleme" | DECISIONS 5802 |
| C7 | Wild Companion familiar'ı Long Rest'te kaybolur (s. 43) | Familiar savaş süresince var; Long Rest'e geçişte savaş dışı | bilinçli sapma | `class-features.json:2210` notu | DECISIONS 4556 |
| C8 | Savaş sonrası kaynak/slot karakterde kalır; Wild Resurgence/Nature Magician'la yaratılan slotun kaydı | Kaynaklar `status.resources`'ta (K10: en çok + harcanan). Yaratılan slotun (`slot_created`) savaş sonu karaktere nasıl yazıldığı **doğrulanmadı** | tam (kaynaklar, kod okuması) / slot **doğrulanmadı** | `characterRest.ts` (K10) | DECISIONS 4621 |
| C9 | Kaydet/yükle: yeni olay türü yok (`wild_resurgence` komutu `feature_used`/`slot_created`/`slot_spent` üretir); kayıt sürümü gerekmedi | Kaydet-yükle turu bu denetimde denenmedi | doğrulanmadı | — | — |
| C10 | Eski kayıt (kaynak yok) | `currentStatus` eksik kaynağı en çok değerle ekler (K10) | tam | `characterRest.ts:60–75` | **[bilinen]** (K10) |

## D) Yapay zekâ

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| D1 | Wild Shape kullanımı | Yalnız slotu bitmiş, konsantrasyonsuz Druid bonus eylemle en yüksek CR'li biçime girer (Wild Shape ayrıntısı ayrı belge) | bilinçli sapma | `ai.ts:2041–2046` | DECISIONS 5803 |
| D2 | Land's Aid, Nature's Sanctuary, Wild Resurgence, Nature Magician, Wild Companion (Find Familiar) | **YZ hiçbirini kullanmıyor**: `ai.ts`'te `landsAid`, `sanctuary`, `wild_resurgence`, `Find Familiar` yok (grep) | yok **[YENİ]** | `grep` `src/battle/ai.ts`, `ai/*.ts` (Druid'e özgü tek dal `ai.ts:2041`) | DECISIONS 5803 ("Druid yapay zekâsı" yalnız biçim) |
| D3 | Primal Strike ve Potent Spellcasting | Pasif, saldırı/büyü yolunda kendiliğinden çalışır; YZ bunlardan yararlanır | tam | `features.ts:310`, `spells.ts:113` | — |
| D4 | Natural Recovery slotsuz büyü ve kısa dinlenme slotu | `castable` `freeCast`'i sayıyor (kod okuması; Warlock D4 ile aynı yol); Druid'e özel YZ testi **doğrulanmadı**; kısa dinlenme savaş dışı | tam (kod okuması, doğrulanmadı) | `ai.ts` `castable` | — |

## E) Arayüz ve TR/EN

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| E1 | Özellik adları (SD4: adlar İngilizce kalır) | EN arayüz: "Land's Aid", "Nature's Sanctuary" (`strings.en.ts:1194`). TR menü kısa adları SD2'den Türkçe: "Toprağın Yardımı", "Doğa Sığınağı", "Slot → hayvan formu hakkı", "Slot yenile: N. seviye (n hak)" (`strings.tr2.ts:462,482`); SD4 "sınıf özelliği adları İngilizce" ile çelişebilir (Cleric E2 ile aynı konu) | kısmi (tutarsızlık olası) | `strings.tr2.ts:462,482` | SD4 (DECISIONS 119), SD2 |
| E2 | Sınıf özelliği özetleri TR/EN (`data/aciklamalar.json features`) | 10 `druid:*` anahtarının hepsi TR ve EN'de var. EN özetlerinden dördü SRD'nin ilk cümlesiyle bilgisiz: Primal Order ("You have dedicated yourself to one of the following sacred roles of your choice."), Elemental Fury ("The might of the elements flows through you."), Improved Elemental Fury ("…as detailed below."), Archdruid ("The vitality of nature constantly blooms…"). TR Archdruid özeti Nature Magician'dan söz etmiyor | kısmi **[YENİ]** | `data/aciklamalar.json` features | SD4 / EN-ACIKLAMA |
| E3 | Seçenek adları, alt sınıf özet metinleri, savaş menüsü, simgeler | Seçenek adları TR/EN: Primal Order, Elemental Fury, arazi türleri (`strings.ts` / `strings.en.ts`); Circle özellikleri TR/EN fikstür açıklamalarından; Land's Aid hedef nokta seçimi (`MapBattle.tsx:1672`), Nature Magician 1–4 düğmesi (`:1661`), Wild Resurgence iki düğme (`:1657–1658`), Land's Aid ve Sanctuary iyileştirme kategorisi (`actionMenu.ts:45`). Simgeler ve ekran görüntüsü **doğrulanmadı** | tam (metin), simge doğrulanmadı | `strings.ts`, `strings.en.ts`, `MapBattle.tsx` | — |

## Düzeltme önerileri

Sıra etkiye göre. "Sürüm" sütunundaki "güncel sürümün bir fazlası, tek sabit" ifadesi: yeni kural sürümü gerekir; ilgili düzeltmelerin hepsi **tek** sürüm sabitinde toplanabilir.

| # | Düzeltme | Etki | Sürüm | Tahmini iş |
|---|---|---|---|---|
| 1 | **Land's Aid 0 HP'li dostu da iyileştirsin** (A22): heal hedef süzgecinden `hp > 0` kalkar; iyileştirilen yaratık ayağa kalkar (`healed` yolu zaten düşmüşü kaldırıyor, doğrulanmadı) | Yüksek (Druid'in tek alan iyileştirmesi; dost düşünce kullanılamıyor) | güncel sürümün bir fazlası, tek sabit | 1 saat + test |
| 2 | **Natural Recovery büyü listesi yalnız seçili arazinin Circle büyüleri** (A26): `naturalRecoveryCast` `names` listesi arazi seçimine bağlanır (kaynak oluşturucu kaynaklı; kayıtlı savaşta `freeSpells` durumda saklı olduğu için sürüm gerekmeyebilir, doğrulanmadı) | Orta | muhtemelen sürümsüz (yeni savaşlar) | 1–2 saat |
| 3 | **Wild Companion familiar Fey** (A4): çağrıda `typeOf`'u Wild Companion yolunda `fey`'e sabitle; arayüzde tür seçimini gizle | Orta (SRD açık kural, 1 satır) | güncel sürümün bir fazlası, tek sabit | 0,5 saat |
| 4 | **Primal Strike (ve Divine Strike) yalnız kendi turunda** (A11): ortak `divineStrikeHit` kapısına "sıra aktör mü" denetimi | Orta (OA başına ≈ +4,5 hasar; Cleric A17 ile ortak) | güncel sürümün bir fazlası, tek sabit | 1 saat |
| 5 | **Nature's Sanctuary Incapacitated/ölümle biter** (A30) ve yeni merkez Druid'e 120 ft içinde olmalı (A31) | Orta-düşük | güncel sürümün bir fazlası, tek sabit | 1,5 saat (Cleric Turn Undead A14 ile ortak "kaynak etkisiz kalırsa biter" altyapısı) |
| 6 | **Potent/Improved Potent yalnız Druid listesindeki cantrip'e** (A9, A14): `spell.classes` ∋ `Drd` süzgeci (aynı satır Cleric'te `Clr`) | Düşük | güncel sürümün bir fazlası, tek sabit | 1 saat |
| 7 | **Beast Spells maliyetli/tüketilen Material'lı büyüyü hariç tutsun** (A16): büyü `components` metninden "worth … GP" / "consumes" ayrıştırması; oyunda bileşen takibi yok, yalnız bu kapı için | Düşük-orta (18+ seviye) | güncel sürümün bir fazlası, tek sabit | 2–3 saat + veri taraması |
| 8 | **YZ: Land's Aid, Wild Resurgence, Nature's Sanctuary, Wild Companion** (D2): basit sezgiler (≥2 düşman kümesi / 0 HP'li dost / Wild Shape yok + slot var) | Orta (Druid'li YZ partileri) | YZ kararı; sim imzasını değiştirir, denge ölçümü gerekir | 4–6 saat |
| 9 | Land's Aid iyileştirilecek yaratık ve Wild Resurgence slot seçimi arayüzü (A7, A23) | Düşük | sürümsüz (komutta isteğe bağlı alan) | 3 saat |
| 10 | E: EN özetleri (Primal Order, Elemental Fury, Improved, Archdruid), TR Archdruid'e Nature Magician, SD2/SD4 isim netliği, başlangıç ekipmanı (Sickle) (E1, E2, B3) | Düşük | sürümsüz | 1–2 saat |
| 11 | Test boşlukları (probe'lar kalıcı teste): Land's Aid 0 HP, Natural Recovery listesi, Wild Companion türü, OA'da Primal Strike, Sanctuary Incapacitated, Beast Spells 17/18, Evergreen, Nature Magician, B11 sayım, C8/C9 kaydet-yükle | — | — | 2 saat |

### Karar gerekli (temeli bozacak ya da ürün kararı isteyen)

- **Serüven'de seviye atlama ve uzun dinlenmede seçim değişimi** (C4, C5, C6; **[bilinen]** DECISIONS 4971 M4): hazırlanan büyü/cantrip, Elemental Fury, Circle arazisi, Primal Order. Serüven mimarisi parti = `sheet` kopyası; çözüm Serüven'de karakter düzenleme politikası ister. Bütün büyücü sınıflarını (Wizard C7/C8, Warlock C1) aynı anda etkiler.
- **Magician'ın Arcana/Nature bonusu** (B8) ve **araç yetkinlikleri** (B2): oyunda beceri/araç kontrolü sistemi yok; uygulamak yeni alt sistem demektir, bu yüzden düzeltme önerisine alınmadı.
