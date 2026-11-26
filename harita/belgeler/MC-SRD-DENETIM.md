# Çoklu sınıf SRD denetimi (Görev SRD-TAMAMLAMA-1, Aşama A)

Tarih 2026-11-26. Taban `origin/birlesik` `689cd8b4` (kural sürümü 105, savaş kaydı 27, karakter kaydı 4). Yalnız belge; kod
değişmedi. Kaynak: SRD 5.2.1 s. 24–26 "Multiclassing" ve sınıf sayfalarındaki "As a Multiclass Character" kutuları (s. 28, 31,
36, 41, 47, 49, 53, 57, 61, 64, 70, 77; metin `docs/SRD_CC_v5.2.1.pdf`'ten `pdftotext` ile okundu). Uygulama MC1–MC7
(DECISIONS.md; plan `harita/belgeler/MULTICLASS-PLAN.md`): veri `data/cok-sinif.json`, saf yardımcılar `src/rules/multiclass.ts`,
tembel hesaplar `src/rules/mcImpl.ts` (kanca `src/rules/mcHook.ts`), türetme `src/rules/stats.ts`, savaş `src/battle/mc3.ts`,
`src/battle/classLevel.ts`, `src/battle/create.ts`, oluşturucu `src/screens/builder/Multiclass.tsx`.

Durum: **doğru** (SRD ile aynı), **kısmi** (çalışıyor, bir parçası yaklaşık ya da eksik), **eksik** (yok),
**doğrulanamadı** (SRD açık değil ya da kodda sınanamadı; karar/yorum), **ev kuralı** (SRD'de yok, kullanıcı kararı).

## Özet

- 35 satır (34 numaralı + Monk silahları notu): **doğru 25**, **kısmi 6**, **eksik 0**, **doğrulanamadı 2**, **ev kuralı 2**.
- Kesin SRD sapması (davranışı yanlış): **yok**. Kısmi satırların hepsi seçim/arayüz ya da sıra bilgisi eksikliği; hiçbiri tek
  yerde veriyle çözülemez, bu yüzden Aşama B'ye eklenmedi (aşağıda "Bulunan sorunlar").
- Multiclass Spellcaster tablosu `data/spell-slots.json` `full` dizisiyle 20 satırda birebir aynı (elle karşılaştırıldı).
- 12 sınıfın "As a Multiclass Character" kutusu `data/cok-sinif.json` `ek` ve `anaYetenek` alanlarıyla birebir aynı.

## Tablo

| # | SRD (sayfa / kural) | Bizde (kod yeri) | Durum | Not |
|---|---|---|---|---|
| 1 | s. 24 Prerequisites: yeni sınıfın ve mevcut sınıfların ana yeteneği ≥ 13 | `multiclass.ts` `meetsPrimary`, `prereqProblem`, `multiclassProblems`, `addClassProblems`; veri `cok-sinif.json` `anaYetenek`, `onKosul` | kısmi | Kural doğru ("and" hepsi, "or" biri; Fighter STR ya da DEX). Denetim karakterin **son** puanlarıyla (`finalScores`); SRD sınıfı alırkenki puanı ister. Seviye alma sırası tutulmadığından sonradan düşen puan (yok gibi) ya da sonradan yükselen puanla sonradan "geçerli" görünen eski seçim ayırt edilemez. |
| 2 | s. 24 ana yetenek tablosu (sınıf sayfalarındaki Core Traits) | `cok-sinif.json` `anaYetenek` | doğru | Monk ve Ranger DEX + WIS, Paladin STR + CHA, Fighter STR ya da DEX; diğerleri tek yetenek. |
| 3 | s. 25 Experience Points: XP eşiği toplam seviyeden | Serüven `src/journey/seruven.ts` `levelXp`/`level_up` (parti seviyesi) | doğru | Eşik parti (toplam) seviyesinden; sınıf seviyesi kullanılmaz. |
| 4 | s. 25 Hit Points: 1. seviye canı yalnız toplam seviye 1'de; yeni sınıf "level after 1" değeriyle | `mcImpl.ts` `derive` (`hp`) | doğru | İlk sınıfın 1. seviyesi tam zar + CON, sonraki her seviye zar/2 + 1 + CON (en az 1). Draconic Resilience gibi seviye başı ek o sınıfın seviyesiyle. Sabit değer (zar atılmaz) tek sınıftaki gibi. |
| 5 | s. 25 Hit Point Dice: aynı tür birleşir, farklı türler ayrı | `mcImpl.ts` `hitDicePool`, `spentBy`; durumda `hitDiceSpentBy` | doğru | Örnekler (Fighter 5 / Paladin 5 10d10; Cleric 5 / Paladin 5 5d8 + 5d10) `src/rules/mc2.test.ts`'te. |
| 6 | s. 25 / s. 187 kısa dinlenmede harcanacak zarın türünü oyuncu seçer | `mcImpl.ts` `shortRest` (büyük zardan başlar), Serüven `autoShortRestDice` | kısmi | Tür seçimi arayüzü yok: hep büyük zardan. Sayı doğru, tür seçilemiyor (MC2'de "seçim arayüzü MC5" denmişti, MC5'te yapılmadı). |
| 7 | s. 25 Proficiency Bonus: toplam seviyeden | `stats.ts` `proficiencyBonus(level)` (`level` = toplam, `syncClassFields`) | doğru | |
| 8 | s. 25 Proficiencies: ek sınıftan yalnız kutudaki yetkinlikler; kurtarma zarı yok | `stats.ts` `saves` (yalnız ilk sınıfın `cls.saves` + özellik `kitSaves`), `mcImpl.ts` `armorProficient`, `weaponProficient`, `tools` | doğru | Kurtarma yetkinliği yalnız ilk sınıftan; özellikten gelenler (Slippery Mind…) her sınıfın seviyesiyle. |
| 9 | Kutu: hafif/orta zırh ve kalkan (Bard, Cleric, Druid, Fighter, Paladin, Ranger, Rogue, Warlock; Barbarian yalnız kalkan) | `cok-sinif.json` `ek.zirh`, `mcImpl.ts` `armorProficient` | doğru | Ek sınıfın 1. seviye seçenekli özellikleri de eğitim verir (Druid Warden, Cleric Protector), SRD "Gain the level 1 features" ile tutarlı (MC2). |
| 10 | Kutu: Martial silah (Barbarian, Fighter, Paladin, Ranger) | `ek.silah`, `mcImpl.ts` `weaponProficient` | doğru | Rogue'un "Martial Finesse/Light" çekirdek yetkinliği ek sınıfa gelmez (doğru). Ek sınıfta Simple silahlar her zaman yetkin sayılır: 12 sınıfın hepsi ilk sınıf olarak Simple verdiğinden etkisiz. |
| 11 | Kutu: beceri (Bard serbest bir; Ranger, Rogue sınıf listesinden bir) | `ek.beceri`, `multiclass.ts` `ekBeceri` denetimi, `stats.ts` `subclassSkills` | doğru | Oluşturucu `Multiclass.tsx` seçtirir, yetkinliğe yazılır (MC5). |
| 12 | Kutu: Bard bir çalgı | `ek.calgi`, `Multiclass.tsx` | doğru | Seçilir ve kayda girer; çalgının oyunda mekaniği yok (tek sınıftaki gibi). |
| 13 | Kutu: Rogue Thieves' Tools | `ek.alet`, `mcImpl.ts` `tools` → savaşçı `toolProfs` | doğru | |
| 14 | Kutu: "Gain the <Class>'s level 1 features" | `classKit(classId, e.level, …)` sınıf başına (`mcImpl.ts` `kit`, `derive`) | doğru | Barbarian'ın 1. seviye Weapon Mastery'si dahil. |
| 15 | Kutu: başlangıç donanımı verilmez | oluşturucu (ek sınıfta donanım adımı yok) | doğru | |
| 16 | s. 25 Class Features: özellik o sınıfın seviyesiyle | savaş `classLevel.ts` `levelIn`/`featureLevel`/`resourceLevel`; `mcImpl.ts` `resources`, `classLevels`; dinlenme `characterRest.ts` `resourceClassLevel` | doğru | Second Wind, Indomitable, Wild Shape, Land's Aid, Preserve Life, Divine Spark, Aura'lar, Arcane Recovery, Natural Recovery, Sorcerous Restoration… (MC4). Yetkinlik bonusuyla sayılan kaynak toplam seviyeyle. |
| 17 | s. 25 Armor Class: birden çok AC hesabından aynı anda biri; oyuncu **seçer** | `mcImpl.ts` `derive` (`ud`: en yüksek), `stats.ts` AC | kısmi | K8 kullanıcı kararı: seçim yerine en yüksek otomatik (kalkan uyumu dahil). Oyuncunun daha düşük olanı seçmesi gereken durum pratikte yok; seçim arayüzü yok. |
| 18 | s. 25 Extra Attack yığılmaz (en çok iki saldırı; Fighter'ın Two/Three Extra Attacks'ı hariç) | `mcImpl.ts` `mergeKit` `attacksPerAction: Math.max` | doğru | Test `src/battle/mc4.test.ts`. |
| 19 | s. 25 Thirsting Blade Extra Attack varken ek saldırı vermez | `create.ts` `pactAttacks` yalnız `inv.attacks > kit.attacksPerAction` | doğru | `mc4.test.ts` iki durum. |
| 20 | s. 25 Spells Prepared: her sınıf tek sınıflıymış gibi (cantrip, hazır büyü, büyü kitabı) | `mcImpl.ts` `spellProblems` (`spellLimits` sınıf başına) | doğru | Ranger 4 / Sorcerer 3 örneği: 2. seviye Ranger büyüsü listede yok (`spellOptions` sınıf seviyesiyle). |
| 21 | s. 25 her büyü bir sınıfa bağlı, o sınıfın yeteneğiyle yapılır | `CharacterSheet.spellClass`, `mcImpl.ts` `spellClassOf`; savaş `mc3.ts` `mcCastView`, `spellByClass` | kısmi | Yapımda doğru. ⚠ Yapımdan sonraki turlarda büyücünün o anki DC'sini okuyan az sayıda etki varsayılan sınıfın değerini görür (MC3 notu). |
| 22 | s. 25 Cantrips: güçlenme toplam seviyeden | `spells.ts` `tierOf(actor)` (`actor.level` = toplam) | doğru | |
| 23 | s. 25 Spell Slots: Bard/Cleric/Druid/Sorcerer/Wizard tam, Paladin/Ranger yarı (yukarı yuvarla); Multiclass Spellcaster tablosu | `mcImpl.ts` `spellcasting` (`casterLevel`, `Math.ceil`), `data/spell-slots.json` `full`; `cok-sinif.json` `yuva` | doğru | Tablo 20 satırda SRD ile aynı. Ranger 4 / Sorcerer 3 → 5. seviye yuvaları (4/3/2) testte. |
| 24 | s. 25 Spellcasting yalnız bir sınıftan geliyorsa o sınıfın kuralı | `spellcasting` `casters.length === 1` → `spellSlotsFor(sınıf, sınıf seviyesi)` | doğru | |
| 25 | s. 25–26 yüksek yuvayla alçak büyü yapılır, yukarı slot etkisi normal | yuva seçici + `upcast` (genel) | doğru | Hazırlanabilen büyü seviyesi sınıf seviyesiyle sınırlı (satır 20). |
| 26 | s. 26 Pact Magic: Spellcasting ile ayrı; Pact yuvası hazırlanan Spellcasting büyülerine, Spellcasting yuvası Warlock büyülerine | `stats.ts`/`mcImpl.ts` `pactSlots`, `CharacterStatus.pactSlots`, `cast_spell.pact`, `slot_spent.pact` (savaş kaydı 27) | kısmi | Kural doğru (iki yön; kısa dinlenmede yalnız Pact dolar). Yapay zekâ Pact havuzunu kullanmaz (MC3 notu; `mc-karma` partisi MC7). |
| 27 | s. 26 Pact yuvası seviyesi Warlock seviyesinden | `mcImpl.ts` `pactOf(classId, level)` | doğru | |
| 28 | Mystic Arcanum Warlock seviyesiyle | `mcImpl.ts` `views` (`minClassLevel`) | doğru | MC4. |
| 29 | s. 37, 54 Channel Divinity: "this class's Channel Divinity" | `mcImpl.ts` `renames`/`renameKit` (`channelDivinity@cleric`, `@paladin`) | doğru | K6. Paket ilkelinin sınıfsız `channelDivinity` başvurusu Cleric + Paladin'de havuz bulamaz (paketlerde böyle başvuru yok; MC4 ⚠). |
| 30 | Weapon Mastery birden çok sınıftan | `mcImpl.ts` `mergeKit` `weaponMastery` (en yüksek hak; yakın dövüş kısıtı yalnız hepsinde varsa) | doğrulanamadı | SRD açık değil (s. 29, 48, 54, 58, 62); K5 kararı. Uzun dinlenme değişimi en yüksek hakkı veren sınıfınki. |
| 31 | Fighting Style (Fighter, Paladin, Ranger) feat'i: aynı feat ikinci kez alınamaz | `advancement.ts` `featProblem`, `mcImpl.ts` `advancementSlots`, `casterCtx` (`hasStyle`) | doğru | Feat'ler SRD'de "Repeatable" yazmıyorsa bir kez. |
| 32 | ASI/feat yuvaları sınıf seviyesinde; feat ön koşulu "Level N+" **karakter** seviyesi | `advancement.ts` `featProblem` `prereqLevel(f) > slot.level`; `mcImpl.ts` `advancementSlots` (`slot.level` sınıf seviyesi) | kısmi | Yuva sınıf seviyesinde doğru. Ön koşul yuvanın sınıf seviyesiyle sınanıyor: sınıf seviyesi ≤ karakter seviyesi olduğundan katı tarafta hata. Pratik etkisi: toplam 19+ seviyede alınan geç bir ASI yuvasına Epic Boon (Level 19+) seçilemez (ASI yuvası kategorisi de `General`/`Origin` ile sınırlı). Doğrusu seviye alma sırasını bilmeyi ister (kayıt alanı yok). |
| 33 | Unarmored Movement + Fast Movement | `mcImpl.ts` `derive` `speed` (toplam) | ev kuralı | K7: SRD'de yazmıyor; ikisi de kendi koşuluyla toplanır. |
| 34 | Sınıf sayısı sınırı | `MAX_CLASSES = 3` (`src/app/limits.ts`) | ev kuralı | K4: SRD'de sınır yok. |
| — | Monk silahları: Monk ek sınıf olunca silah yetkinliği gelmez; Martial Arts "Monk weapons" | `weapons.ts` `martialArts` | doğrulanamadı | SRD Martial Arts metni yetkinlik istemiyor; yetkinliği olmayan Martial Light silahla Martial Arts'ın saldırı zarına yetkinlik ekleyip eklemediği bu denetimde sınanmadı. Aşama B dışı. |

## Bulunan sorunlar (kod değiştirilmedi)

Hiçbiri tek yerde ve veriyle çözülebilecek kesin sapma değil; bu yüzden Aşama B'ye eklenmedi, kullanıcı kararına bırakıldı.

1. **Kısa dinlenmede zar türü seçimi yok** (satır 6). SRD oyuncuya bırakır; biz büyük zardan başlıyoruz. Arayüz işi
   (Karakterlerim dinlenme kartı, Serüven kısa dinlenme düğmesi); kural tarafı `shortRest`'e tür listesi almak yeter.
2. **Feat ön koşulu sınıf seviyesiyle** (satır 32). Etkisi yalnız 19+ toplam seviyede geç ASI yuvasına Epic Boon. Doğru çözüm
   seviye alma sırasının kaydı (karakter kayıt alanı) ya da ön koşulu karakter seviyesiyle sınamak (gevşek taraf); karar ister.
3. **Ön koşul son puanla** (satır 1). Aynı neden: seviye alma sırası yok. Pratikte yanlış sonuç vermesi için puanın sınıf
   alındıktan sonra düşmesi gerekir; oyunda kalıcı puan düşüşü yok.
4. **AC hesabı oyuncu seçimi değil, en yüksek** (satır 17). K8 kararı; SRD'den sapma yalnız biçimsel.
5. **Büyü DC'si sonraki turlarda varsayılan sınıftan** (satır 21) ve **yapay zekâ Pact havuzunu kullanmaz** (satır 26). MC3'ün
   bilinen yaklaşıkları; ayrı görev.
6. Doğrulanamayanlar: Weapon Mastery birleşimi (K5) ve Monk silahları (yukarıdaki son satır).
