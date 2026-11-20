# Sorcerer denetimi (SRD 5.2.1 ↔ oyun)

Tarih: 2026-11-20 · Kural sürümü: 79 · Yalnız denetim: kod, veri ve test değişmedi.

- **Kaynak:** `docs/SRD_CC_v5.2.1.pdf` (sayfa = PDF sayfa numarası = basılı numara), `data/srd/classes.json`, `data/srd/spells.json`. Sorcerer: s. 64–70 (çekirdek özellikler ve Spellcasting s. 64–65, tablo ve Innate Sorcery s. 65, Font of Magic–Arcane Apotheosis ve Careful s. 66, öbür Metamagic seçenekleri s. 67, büyü listesi s. 67–69, Draconic Sorcery s. 69–70).
- **Yöntem:** kod okuma (`src/battle/sorcerer.ts`, `spells.ts`, `economy.ts`, `apex.ts`, `summons.ts`, `ai.ts`, `MapBattle.tsx`, `src/rules/*`, `src/app/partyStatus.ts`), `data/class-features.json`, DECISIONS.md ve emin olunmayan satırlar için **geçici testler** (kancalı Rng ile zar istekleri sayıldı; dosya çalıştırıldıktan sonra silindi, depoya girmedi). Büyü taraması SRD metninden türetilen sezgisel ölçütlerle yapıldı (kesin değil; sayılar yön gösterir).
- **Durum etiketleri:** **tam** · **kısmi** · **yok** · **bilinçli sapma** (kararla verilmiş, SRD'den ayrı). "bilinen" = DECISIONS.md ya da veri notu zaten söylüyor.

## Özet

**42 kural satırı:** 20 tam · 20 kısmi (2'si K11 kararıyla bilinçli sapma: I2, I3) · 1 yok (F5 savaş dışı Font of Magic) · 1 bilinçli sapma (F4 yaratılan slot). **Bilinen** (DECISIONS'ta zaten yazılı): F4, I2, I3, M4 (konsantrasyon avantajı), M5 (çok hedefte Heightened). **Yeni bulgu:** M2 (Distant arayüzde), M6 (Quickened kısıtı), M3 (Magic Missile + Empowered), D3 (Affinity her zara), F2, M12, D5, I4, yapay zekâ boşlukları (D). Yapay zekâ ve arayüz/metin satırları yukarıdaki sayıya dahil değildir (D ve E bölümlerinde).

En önemli bulgular (etki sırasıyla):

1. **Distant Spell arayüzde işe yaramıyor** (A-M2): motor menzili iki katına çıkarıyor ama hedef/alan seçici temel menzili kullanıyor; menzil dışı hedef seçilemiyor. Geçici testte 70 ft'teki hedef Hold Person + Distant ile motorda geçti, arayüz hedef listesi boş.
2. **Quickened Spell'in SRD kısıtı yok** (A-M6): "bu tur 1+ seviye büyü yaptıysan Quickened olmaz, Quickened sonrası 1+ seviye büyü yapılmaz" uygulanmıyor; yalnız "turda bir slotlu büyü" kuralı var. Quickened cantrip + aynı tur eylemle 1+ seviye büyü ve tersi serbest (geçici test C1, C2, C4).
3. **Innate Sorcery Draconic Spells'e uygulanmıyor** (A-I2): Chromatic Orb, Command, Fear, Fly… "her zaman hazır" büyüler `classSpells` dışında; DC +1 ve saldırı avantajı gelmiyor. SRD (s. 65) her zaman hazır büyülerin "Sorcerer büyüsü sayıldığını" söyler. Karar K11'de verilmiş (bilinçli), ama SRD'ye aykırı.
4. **Extended Spell çoğu büyüde reddediliyor** (A-M4): 1 dakika ve üstü süreli 89 Sorcerer büyüsünün yalnız 37'sinde seçilebiliyor (Hold Person, Fear, Sleep, Web, Stinking Cloud, Flaming Sphere… dışarıda); konsantrasyon avantajı da yok (bilinen).
5. **Yaratılan slot savaş sonunda siliniyor** (C-F4, bilinen): SRD "uzun dinlenmeye dek sürer" der; oyunda savaş bitince kırpılıyor. Savaş dışında Font of Magic hiç yok.
6. **Empowered Magic Missile'da etkisiz** (A-M3): otomatik isabet yolu zarları yeniden atmıyor, puan harcanıyor.
7. **Elemental Affinity çok zarlı büyüde her zara ekleniyor** (D-D3): Scorching Ray'de üç ışının her birine +CHA (SRD: bir hasar zarına).
8. **Yapay zekâ** (D): Twinned, Heightened, Quickened ve Innate Sorcery dışında hiçbir Sorcerer özelliğini kullanmıyor; DECISIONS'taki "Metamagic ve Font of Magic kullanmaz" notu eski.

## Tablo

Sütunlar: kural (SRD sayfa) · oyunda ne oluyor · durum · kanıt · DECISIONS.

### Çekirdek ve Spellcasting (s. 64–65)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| S1 | D6 Hit Die, CON+CHA save, Simple weapons, zırh eğitimi yok, 2 beceri (Arcana, Deception, Insight, Intimidation, Persuasion, Religion) (s. 64) | Veride aynı | tam | `data/classes.json` sorcerer (`hitDie` 6, `saves`, `skillChoices`, `weaponProficiency: simple`, `armorTraining: []`) | – |
| S2 | Başlangıç donanımı A (Spear, 2 Dagger, Arcane Focus, Dungeoneer's Pack, 28 GP) ya da B (50 GP) (s. 64) | Sınıf donanım paketi modeli yok; sihirbaz önerisi zırhsız + Dagger | kısmi | `data/onerilen-baslangic.json` sorcerer (`silahlar: ["Dagger"]`); genel donanım sistemi tüm sınıflarda aynı | SD3 |
| S3 | Cantrip: 4 (1. sv.), 5 (4.), 6 (10.); her seviyede bir cantrip değişimi (s. 64–65) | Sayılar SRD tablosundan; sihirbaz serbest düzenleme, "seviye başına bir değişim" kısıtı yok | kısmi | `data/srd/classes.json` Cantrips sütunu, `builder.ts` | K17 (sihirbaz tek mekanizma, bilinçli genelleme) |
| S4 | Hazır büyü sayısı 2…22 tablosu, büyü seviyesi slot seviyesini geçemez, her seviyede bir değişim (s. 65) | Sayılar tablodan, slot sınırı uygulanır; değişim sınırı yok (yukarıdaki gibi) | kısmi | `builder.ts` büyü sayımı; geçici test: Sorcerer 5. sv. slotlar [4,3,2] | K17 |
| S5 | Her zaman hazır büyüler sayıya girmez (s. 65) | Girmez; sihirbazda "her zaman hazır (sayıya girmez)" etiketi | tam | `strings.ts` `alwaysPrepared`; geçici test G: 9. sv. Draconic ile 13 büyü adı | – |
| S6 | Slot tablosu (s. 65) | Aynı | tam | `deriveStats` slotları; geçici test H | – |
| S7 | CHA büyü yeteneği, Arcane Focus (s. 65) | CHA; odak/malzeme bileşeni savaşta modellenmiyor (genel) | tam (genel sınırla) | `classes.json` `casting.ability: cha` | – |
| S8 | Sorcerer büyü listesi (s. 67–69): 140 büyü (16/21/27/21/13/12/11/8/6/5) | Aynı 140 büyü, aynı seviye dağılımı; tek fark yazım (`Dragon’s Breath` tipografik kesme, oyunda `'`) | tam | Geçici test A (SRD ↔ `spells` `Sor`) | – |

### Innate Sorcery (s. 65) ve Sorcery Incarnate/Arcane Apotheosis (s. 66)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| I1 | Bonus eylem, 1 dakika, 2 kullanım, uzun dinlenmede yenilenir | Bonus eylem (`use_feature`), 10 tur (`until = tur + 9`), `innateSorcery` kaynağı 2, uzun dinlenmede dolar | tam | Geçici test G (`until` 10, kullanım 2→1, bonus harcanır); `class-features.json` | Görev SORCERER |
| I2 | Sorcerer büyülerinin save DC'si +1 | DC +1 ama yalnız `classSpells` (karakterin seçtiği ve listedeki büyüler); Draconic Spells (her zaman hazır) dışarıda | kısmi · bilinçli sapma | `create.ts` `classSpells` yalnız `sheet.spellNames`; geçici test G: `classSpells` = [Fire Bolt, Burning Hands, Hold Person], Chromatic Orb yok. SRD s. 65: her zaman hazır büyüler "Sorcerer büyüsü sayılır" | K11 (bilinen; SRD'ye aykırı) |
| I3 | Sorcerer büyülerinin saldırı zarlarında avantaj | Aynı kapsam | kısmi · bilinçli sapma | `spells.ts` ~889 `innateFor` | K11 |
| I4 | DC +1 yalnız yapım anında değil, büyünün sonraki kurtarmalarında da (tur sonu tekrar kurtarma) | Sürekli etkilerde saklanan DC kontrol edilmedi | kısmi (doğrulanmadı) | `castWithMetamagic` yalnız `spellSaveDc`'yi o yapım için yükseltir | – |
| I5 | Sorcery Incarnate (7): kullanım kalmadıysa 2 SP ile; etkinken bir büyüye en çok iki Metamagic | Aynı; Empowered ve Seeking sınıra sayılmaz (SRD bu ikisi için "başka seçenekle birlikte olur" der) | tam | `innateSorceryEvents`, `metamagicLimit`; mevcut test ve geçici test I2 (üç seçenek geçti) | Görev SORCERER |
| I6 | Arcane Apotheosis (20): Innate etkinken her turunda bir Metamagic seçeneği bedelsiz | Kendi turunda bir seçenek bedelsiz (birden çok seçenekte en pahalısı); tur dışı yapımda indirim yok; `featuresK19` anahtarı açıkken (varsayılan açık) | tam | `apotheosisDiscount`; geçici test I (empowered+distant: 2 SP yerine 1; quickened bedelsiz) | Kuyruk 19 (11–20) |
| I7 | Innate yeniden etkinleştirilemez ("zaten etkin") ve bonus eylem ister | Aynı | tam | geçici test G | – |

### Font of Magic ve Sorcery Points (s. 66)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| F1 | SP: 2 (2. sv.) … seviyeyle artar, tavan tablo, uzun dinlenmede dolar | `sorceryPoints` kaynağı SRD sütunundan (2…20), `cap`, uzun dinlenmede tümü | tam | `class-features.json` `sorceryPoints`; Sorcery Points sütunu 2..20 | – |
| F2 | Slot → SP: eylemsiz, slot seviyesi kadar | Eylemsiz, seviye kadar; tavanı aşan kısım kaybolur; **tavandayken de slot harcanıyor, uyarı yok** | kısmi (küçük) | `executeFontOfMagic`; geçici test K (SP 9/9 iken 3. seviye slot harcandı, SP 9 kaldı) | Görev SORCERER |
| F3 | SP → slot: bonus eylem; bedel 2/3/5/6/7; en düşük seviye 2/3/5/7/9; en çok 5. seviye | Tablo veride (`slotCost`), bonus eylem, seviye/bedel denetimi | tam | `sorcerer.ts` `executeFontOfMagic`; mevcut test ("en az 7") | – |
| F4 | Yaratılan slot uzun dinlenmede kaybolur (o zamana dek kalır) | Savaş bitince karakterde slot, savaş öncesi sayıyı aşamaz (kırpılır) | bilinçli sapma · **bilinen** | `partyStatus.ts` `Math.min(n, c.spellSlots[i])`; geçici test H: savaşta [5,3,2] → savaş sonrası [4,3,2] | Görev SORCERER ("savaş sonunda slot en çoğuna kırpılır") |
| F5 | Font of Magic savaş dışında da kullanılabilir (dinlenme öncesi slot ↔ SP) | Yalnız savaşta; karakter listesi / dinlenme / Serüven ekranında düğme yok | yok | `font_of_magic` yalnız `MapBattle.tsx` ~1531'de | – |
| F6 | Slot seviyesi ve yaratılacak slot seçimi oyuncunun | Arayüzde iki düğme: en düşük dolu slotu SP'ye çevir; yaratılabilen en yüksek slotu yarat (seviye seçilemez) | kısmi (arayüz) | `MapBattle.tsx` ~1531–1536 | – |

### Metamagic (s. 66–67)

Genel kurallar: 2. seviyede 2 seçenek, 10. ve 17. seviyede +2 (2/4/6); seviye atlayınca bir seçenek değişebilir; bir büyüye tek seçenek (Incarnate ile iki; Empowered/Seeking istisna).

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| M0 | Seçenek sayıları 2/4/6; 1. seviyede yok; değişim her seviyede bir | Sayılar veride (`counts` 2/10/17), 1. seviyede yok, sayı uyuşmazlığı sorun (`metamagicCount`); seviyede bir değişim sınırı yok (serbest düzenleme) | kısmi (genelleme) | `class-features.json` `sorcerer:metamagic`; `builder.ts` 391–395; mevcut test | K17 |
| M1 | **Careful (1 SP)**: save isteyen büyüde CHA (en az 1) yaratığı seç; save'i otomatik geçer, yarı hasar da almaz | Yalnız **alan** yolunda ve yalnız **dost** (seçim yok, ilk N dost); düşman/tarafsız yaratık korunamaz; tek hedefli save büyüsünde seçilebilir ama etkisiz, puan harcanır | kısmi | `spells.ts` 211 (`sculpt` + `mm-careful`), geçici test M (Hold Person + Careful: ok, SP 9→8); Sculpt Spells ile bir havuzu paylaşır | Görev SORCERER ("save'i geçer ile aynı sonuç") |
| M2 | **Distant (1 SP)**: menzil ≥ 5 ft ise ×2, Touch ise 30 ft | Motor: ×2, dokunuş 30 ft, kendinden değişmez. **Arayüz hedef/alan seçici temel menzili kullanıyor**; Self-alan büyüleri (Burning Hands, Cone of Cold, Thunderwave, Lightning Bolt, Fear…) alan boyu menzil sayıldığından seçilebiliyor, etkisiz, puan gider | kısmi (arayüz hatası) | Geçici test D: 70 ft hedef + Distant motorda ok, `spellTargets` = []; `hud.ts` 111 `spellTargets`/289 `areaActSpec` metamagic'i bilmez; geçici test M: Burning Hands `rangeFt` 15 | Görev SORCERER |
| M3 | **Empowered (1 SP)**: hasar atarken CHA kadar zarı yeniden at (başka seçenekle birlikte olur) | Ortalamanın altındaki en düşük CHA zar yeniden (oyuncu zar seçmez; sonuç yeni zardır). Alan, tek hedef ve saldırı yollarında çalışıyor; **otomatik isabet yolunda (Magic Missile) zar yeniden atılmıyor**; hasarsız büyüde (Hold Person) seçilebilir, puan gider | kısmi | `spells.ts` 93–100, 907 uygulandı; 950 `rollDice` doğrudan (geçici test E: Magic Missile 3→3 zar isteği, Scorching Ray 3→9, Chromatic Orb 1→4, Burning Hands 1→4, Fire Bolt 1→3; geçici test M) | Görev SORCERER |
| M4 | **Extended (1 SP)**: süre ≥ 1 dakika ise ×2 (en çok 24 saat); konsantrasyon korumasında save avantajı | Süre yalnız `mechanics.effect.rounds ≥ 10` olan büyüde; konsantrasyon avantajı **yok** | kısmi · **bilinen** (avantaj) | Geçici test A: ≥1 dk süreli 89 Sorcerer büyüsünden 37'si seçilebilir, 52'si reddedilir (Hold Person, Hold Monster, Fear, Sleep, Web, Stinking Cloud, Fog Cloud, Flaming Sphere, Cloudkill, Vampiric Touch, Wall of Fire/Stone, Sunbeam, Telekinesis, Earthquake, Hypnotic Pattern, Blindness/Deafness, Detect Magic…); 14400 tur sınırı var | Görev SORCERER ("konsantrasyon avantajı yok") |
| M5 | **Heightened (2 SP)**: save isteyen büyüde bir hedef dezavantajlı | Tek hedefli yolda ✓ (avantajı dezavantaja çevirir; SRD: ikisi birbirini götürür); alanda "ilk düşman", **seçim yok**; çok hedefli tek-hedef yolunda (Twinned + Heightened) uygulanmaz, puan gider | kısmi · **bilinen** (çok hedef) | `spells.ts` 291, 798; geçici test M: Twinned+Heightened Hold Person iki hedefte de `normal`; mevcut test | Kuyruk Y1(d) ("çok hedefli yapımda uygulamaz, açık") |
| M6 | **Quickened (2 SP)**: eylemlik büyüyü bonus eylemle; bu tur 1+ seviye büyü yaptıysan olmaz, sonrasında bu tur 1+ seviye büyü yapılamaz | Bedel 2, eylem → bonus ✓. **Kısıt yok**: yalnız "turda bir slotlu büyü" kuralı; Quickened cantrip sonra eylemle 1+ seviye büyü ✓ serbest (SRD yasak), eylemle 1+ seviye büyü sonra Quickened cantrip serbest (SRD yasak). Veride süresi 1 dk+ olan Mending, Creation, Clairvoyance, Teleportation Circle `castingTime: action` → Quickened seçilebilir | kısmi | `economy.ts` 396–401; geçici test C1 (Fire Bolt q + Magic Missile: ok), C2 (Magic Missile + Fire Bolt q: ok), C3 (q Magic Missile + eylemle slotlu: red ✓), C4 (Fire Bolt q + Burning Hands: ok); geçici test A | Görev SORCERER (slot kuralı not edilmiş) |
| M7 | **Seeking (1 SP)**: büyü saldırısı ıskalarsa d20'yi yeniden at (başka seçenekle birlikte olur) | Iskada bir kez, puan yalnız kullanılınca; çok ışınlı büyüde büyünün ilk ıskasında (ışın başına ayrı değil) | tam (yorum) | `spells.ts` 898–903; mevcut test | K11 (bilinçli sadelik) |
| M8 | **Subtle (1 SP)**: V, S, M bileşensiz (tüketilen/bedelli malzeme hariç) | `noVerbal` + Counterspell tetiklenmez; Somatic/Material savaşta başka yerde modellenmediğinden fark yaratmıyor | tam (modellenen bileşen kadar) | `sorcerer.ts` 105; `spells.ts` 531–533; sessizlik yolu | Görev SORCERER |
| M9 | **Transmuted (1 SP)**: Acid/Cold/Fire/Lightning/Poison/Thunder hasarını listedeki başka türe | Seçilen/varsayılan tür; seçimli büyüde seçim yerine geçer. İki hasar türü olan büyüde yalnız ana tür değişir; `damageType` verisi olmayan Fire Shield, Ice Knife, Web seçilemez | kısmi (küçük) | `sorcerer.ts` 59–64, 105–110; geçici test A (28 uygun büyüden 25'i); Elemental Affinity çevrilen türe göre çalışır ✓ | K11 |
| M10 | **Twinned (1 SP)**: yukarı slotta ek hedef alan büyüde etkin seviye +1 | Etkin seviye yalnız hedef sayısını artırır (`upcast.targets`); cantrip'te yok; Scorching Ray ve Chain Lightning (ek ışın/şimşek) kapsam dışı | tam (yorum) | `spells.ts` 1026; mevcut test (Hold Person 2. slotta iki hedef); geçici test A (14'ten 12'si) | Görev SORCERER |
| M11 | Birden çok seçenek (yalnız Incarnate/Empowered/Seeking ile) | Aynı kısıt `metamagicProblem` | tam | geçici test I2/I3 | – |
| M12 | Her seçenek için gerekçeli ret (kısıt dışı seçimde seçenek kapalı) | Savaş seçicisi nedeni ipucu olarak gösterir; ama Careful/Heightened (tek hedef), Distant (Self-alan), Empowered (hasarsız) için ret yok | kısmi | `metamagicProblem` yalnız save/menzil/saldırı koşullarını bakar | – |

### Sorcerous Restoration, alt sınıf, ASI, Epic Boon (s. 66)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| R1 | Sorcerous Restoration (5): kısa dinlenmede en çok seviye/2 (aşağı) SP geri; uzun dinlenmeye dek bir kez | Kısa dinlenmede seviye/2 (aşağı), tavanı aşmaz, puan eksik değilse harcanmaz; uzun dinlenmede kullanım dolar | tam | `characterRest.ts` `sorcerousRestoration`; mevcut test | Görev SORCERER |
| R2 | Sorcerer alt sınıfı (3) | 120 alt sınıf listesinde Draconic Sorcery + diğerleri; 3+ seviyede sihirbaz ister | tam | `builder.ts`, AS2 | AS2 |
| R3 | ASI 4/8/12/16, Epic Boon 19 | Genel yuva sistemi; Boon'ların özel etkileri kısmen (genel eksik) | kısmi (genel) | CLAUDE.md "Feat'ler" satırı | – |

### Draconic Sorcery (s. 69–70)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| D1 | Draconic Resilience (3): HP +3, her yeni seviyede +1; zırhsız AC 10 + DEX + CHA | `hpPerLevel: 1` → 3. sv. +3, 6. sv. +6 ✓; AC 10 + DEX + CHA ✓. `shield: true` kalkanla da geçerli (SRD "zırh giymiyorsan"; Sorcerer kalkan eğitimi yok, ancak feat ile mümkün) | tam (küçük not) | `stats.ts` 281, 313; mevcut test | Görev SORCERER |
| D2 | Draconic Spells: 3. sv. Alter Self, Chromatic Orb, Command, Dragon's Breath; 5. Fear, Fly; 7. Arcane Eye, Charm Monster; 9. Legend Lore, Summon Dragon, her zaman hazır, sayıya girmez | Hepsi tabloya göre ✓ (DECISIONS'taki "7. seviye oyunda yok" notu eski: Kuyruk 19'da eklendi) | tam | Geçici test G (9. sv. `spellNames`); `srd-alt-siniflar.json` | Kuyruk 19 |
| D3 | Elemental Affinity (6): Acid/Cold/Fire/Lightning/Poison seç; o türe direnç; o türde hasar veren büyünün **bir** hasar zarına +CHA | Seçim (`featureChoices`, varsayılan Fire), direnç ✓; +CHA her zar için ekleniyor: Scorching Ray'de her ışına | kısmi | `spells.ts` 117 (`damageExpr`'de bonus); geçici test F: ışın başına hasar [2,2,2] → [6,6,6] | Görev SORCERER ("bir kez" denmiş, çok zarlı büyü düşünülmemiş) |
| D4 | Dragon Wings (14): bonus eylem, 1 saat, Fly 60 ft; kullanım yoksa 3 SP ile geri (eylemsiz) | Bonus eylem, 600 tur, Fly 60; kullanım yoksa 3 SP ödenir; kanatlar kapatılamaz ("dismiss" yok) | tam (küçük eksik) | `apex.ts` 54, 79, 173; geçici test J (SP 5→2, bonus harcanır) | Kuyruk 19 (11–20) |
| D5 | Dragon Companion (18): Summon Dragon malzemesiz; uzun dinlenmede bir slotsuz; **her yapımda** konsantrasyonsuz seçilebilir (süre 1 dk) | Slotsuz yapım ve o yapımda konsantrasyonsuz ✓; slotlu yapımda "konsantrasyonsuz" seçeneği yok; malzeme zaten modellenmiyor | kısmi | `summons.ts` 309; `class-features.json` `dragonCompanion` | Kuyruk 19 |

## Kapsam bölümleri

### A) Savaş içi

- **Seçim akışı:** büyü seçilince slot seçicinin altında "Metamagic (SP: n)" düğmeleri; her düğmede bedel, kısıt dışıysa neden ipucu (`MetamagicPicker`, `MapBattle.tsx` 357); Transmuted için tür düğmeleri. Seçim `cast_spell.metamagic` olarak gider; puan ve etki aynı komutta.
- **Maliyet harcama:** `feature_used` olayı büyüden önce (replay uyumlu); Seeking yalnız ıskada; Apotheosis indirimi tur başına bir.
- **Heightened/Quickened/Twinned gerçekten etki ediyor mu:** Quickened ✓ (bonus eylem; kısıt eksik: M6); Twinned ✓ (iki hedef, iki Paralyzed; mevcut test); Heightened ✓ tek hedefte ve alanda, çok hedefli yapımda ✗ (M5).
- **Seçeneklerin büyü bazında erişimi** (geçici test A; Sorcerer listesindeki 140 büyü, SRD'ye göre uygun / oyunun kabul ettiği): Extended 89 / 37; Careful ve Heightened 68 / 58; Seeking 13 / 12; Transmuted 28 / 25; Twinned 14 / 12; Distant 108 / 108 (+8 Self-alan fazlası); Quickened 127 / 127 (+4 veri hatası); Empowered 50 / 50 (+89 hasarsız büyüde de seçilebiliyor); Subtle 139 / 139.
- **Innate Sorcery düğmesi:** özellik listesinden (`use_feature`); Sorcery Incarnate ile kullanım bitince 2 SP.

### B) Oluşturucu / seviye atlama

- Metamagic: "Metamagic (n/N)" katlanır bölümü, tavan dolunca düğmeler kapanır, sayı eksik/fazlaysa sorun (`metamagicCount`, `metamagicUnknown`, TR/EN); her seçenekte bedel ve bilgi balonu. Yeni karakter için ilk N seçenek önerilir (Careful, Distant: alfabetik; öneri kuralı genel).
- Elemental Affinity: özellik seçeneği (`featureChoices`); Draconic Spells, "her zaman hazır" etiketiyle.
- Sihirbaz seviye sınırı: 6+ "deneysel" uyarısı veriden; Metamagic 10. ve 17. seviyede açılır (tablodan). Seviye başına "bir değişim" kuralı yok, serbest düzenleme (S3, M0).

### C) Dinlenme ve Serüven

- Uzun dinlenme: SP, Innate Sorcery, Sorcerous Restoration, Dragon Wings, Dragon Companion tam dolar (`rechargeResources`) ✓.
- Kısa dinlenme: yalnız Sorcerous Restoration SP verir ✓ (Serüven kısa dinlenmesi aynı `shortRestStatus`).
- Savaş sonrası: `resources` karaktere yazılır (SP/Innate kalır) ✓; yaratılan slot kırpılır (F4); Innate/Dragon Wings etkileri savaşla biter (1 dk/1 saat savaş içi süre).
- Savaş içi kaydet/yükle: `slot_created`, `feature_used` olayları reducer'da ✓ (mevcut `replays()` testi).
- Savaş dışı Font of Magic yok (F5).

### D) Yapay zekâ

| Özellik | Kullanıyor mu | Not |
|---|---|---|
| Innate Sorcery | evet | Bonus eylem boşken, hasar büyüsü ve düşman varken; Quickened ile bonus eylem çakışması gözetilmiyor; kullanım bitince Incarnate ile 2 SP de harcanabilir (`tryCmd` geçerse) |
| Twinned | evet | Yukarı slotta çok hedefli kararı bir alt slota indirir; tek hedefliye en yakın ikinci hedefi ekler |
| Heightened | evet (sürüm 55+) | Önizleme kazancı eşiği (beklenen hasar ≥ bedel × 3 ya da başarısızlık +0,15) |
| Quickened | evet | Eylem harcanmış, bonus boşken eylemlik büyüyü bonusa taşır (M6 kısıtı olmadığı için SRD dışı birleşim kurabilir) |
| Careful, Distant, Empowered, Extended, Seeking, Subtle, Transmuted | hayır | `ai.ts` `withMetamagic` yalnız Twinned/Heightened/Quickened |
| Font of Magic (iki yön), Sorcerous Restoration, Dragon Wings, Dragon Companion, Sorcery Incarnate çift seçenek, Arcane Apotheosis | hayır | Wings/Companion için `ai.ts` içinde yol yok |

DECISIONS'taki "Sorcerer yapay zekâsı Metamagic ve Font of Magic kullanmıyor" notu (Görev SORCERER) Kuyruk 43/Y1 sonrası kısmen eski (D-AI). Denge partilerinde Sorcerer yalnız `ates` ve `buyucu` temsilcisinde.

### E) Arayüz ve TR/EN

- **Adlar:** Metamagic adları İngilizce (SD4 kararı) iki dilde aynı; açıklamalar `metamagicInfo` TR/EN çiftli ✓. Font of Magic ve Metamagic düğme metinleri `strings.tr2.ts` / `strings.en.ts` ikisinde de var ✓.
- **Metin sapmaları:** Careful bilgi metni "dost" diyor (SRD: herhangi bir yaratık); Quickened metni kısıtı söylemiyor; Extended metni konsantrasyon avantajını söylemiyor (motorda da yok); Distant metni arayüzde işlemeyen menzili vaat ediyor (M2).
- **Sınıf özelliği açıklamaları:** `data/aciklamalar-tr.json`'da yalnız `buyu/sorcerous-burst`; Sorcerer sınıf özelliklerinin Türkçe açıklaması `class-features.json` notlarında (yeni TR açıklama SD4 taramasıyla ayrıca incelenmeli).

## Düzeltme önerileri

Sıra: etki / kural sürümü / tahmini iş. "Sürüm 80" = savaş motoru davranışı değişir (eski kayıt ve replay eski kuralla).

| # | Öneri | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|
| 1 | Distant: hedef ve alan seçicisi (`spellTargets`, `areaActSpec`, menzil vurgusu) seçili Metamagic'i bilsin; Self-alan büyüsünde Distant reddi (M2, M12) | Yüksek (özellik arayüzde ölü) | yok (yalnız arayüz + `metamagicProblem`) | ½ gün |
| 2 | Quickened kısıtı: savaşçıda `tur: 1+ seviye büyü` ve `quickenedTurn` işaretleri; iki yönlü yasak; Mending/Creation/Clairvoyance/Teleportation Circle `castingTime` düzeltmesi (M6) | Orta–yüksek (SRD'ye aykırı güç) | 80 | ½ gün + veri düzeltme |
| 3 | Innate Sorcery kapsamına her zaman hazır büyüleri ekle (`classSpells` = seçilenler + `alwaysPrepared` ∩ Sorcerer listesi) (I2, I3); **K11 kararının geri alınması kullanıcı onayı ister** | Orta–yüksek (Chromatic Orb, Command, Fear, Fly, Summon Dragon) | 80 | 2–3 saat + test |
| 4 | Extended: büyü verisine süre (SRD `duration` metninden üretilen `durationRounds`) ve konsantrasyon save avantajı (M4) | Orta (52 büyü kapalı) | 80 | 1 gün (veri üretici + `concentration` kancası) |
| 5 | Yaratılan slotlar kalıcı olsun (`CharacterStatus` `createdSlots`, uzun dinlenmede silinir) + dinlenme ekranında Font of Magic (F4, F5, F6) | Orta (kullanıcı kararı gerekir: F4 bilinçli sapma) | yok (karakter durumu); kayıt sürümü gerekebilir | 1 gün |
| 6 | Empowered: otomatik isabet yolu (Magic Missile) ve `halfOnMiss` yolu da `spellDamageRoll`'dan; hasarsız büyüde seçimi reddet (M3, M12) | Orta | 80 | 2–3 saat |
| 7 | Elemental Affinity: büyü başına tek zar (`affinityUsed` yapım içi işareti) (D3) | Düşük–orta | 80 | 2 saat |
| 8 | Careful/Heightened: hedef seçimi arayüzü (dost dışı da), tek hedefli ve çok hedefli yolda Heightened/Careful uygulama, etkisiz seçimleri reddet (M1, M5, M12) | Orta | 80 | 1 gün |
| 9 | Yapay zekâ: Careful (alanda dost), Empowered, Seeking, Transmuted (direnç/zayıflığa göre), Font of Magic (slot ↔ SP), Dragon Wings; DECISIONS notlarını güncelle (D) | Düşük (yalnız karar; denge tek parti ölçümüyle) | yok (karar, ama Sorcerer partili `sim` ölçümü beklenir) | 1–2 gün |
| 10 | Dragon Companion slotlu yapımda konsantrasyonsuz seçeneği, Dragon Wings kapatma, Font of Magic SP tavanında uyarı (D4, D5, F2) | Düşük | 80 | 3–4 saat |
| 11 | Metin düzeltmeleri TR/EN: Careful (herhangi bir yaratık), Quickened kısıtı, Extended avantajı (E) | Düşük | yok | 1 saat |
| 12 | Savaş dışı: kısa/uzun dinlenme ve karakter ekranında Cantrip/Metamagic/hazır büyü "bir seviyede bir değişim" kuralını isteğe bağlı uyar (S3, S4, M0) | Düşük | yok | ½ gün (kullanıcı kararı: genel serbest düzenleme bilinçli) |

Önerilen paket: 1 + 11 (yalnız arayüz), ardından tek kural sürümü 80 altında 2, 3 (onayla), 6, 7, 10; 4 ve 8 ayrı görevler; 5 kullanıcı kararı sonrası.

## Geçici test notu

Geçici testler `src/zzprobe.test.ts` içinde yazıldı ve silindi (depoda yok). Kapsam: SRD ↔ oyun büyü listesi karşılaştırması, 140 büyü × 10 seçenek uygunluk taraması, Quickened sıra senaryoları (4), Distant motor ↔ arayüz hedef listesi, Empowered zar isteği sayımı (5 büyü), Elemental Affinity çok ışın, Innate DC ve `classSpells`, yaratılan slotun savaş sonrası durumu, Apotheosis/Incarnate bileşimleri, Dragon Wings SP ödemesi, SP tavanında slot→SP, Twinned+Heightened. Tarama sayıları SRD metninden çıkarılmış sezgisel ölçütlere dayanır; tek tek büyü yargısı için SRD sayfasına bakılmalıdır.

## B93 düzeltmeleri (Görev B93, kural sürümü 93)

"Sürümlü": savaş davranışı değişti, 92 ve altı kayıt/replay eski davranışta. "Sürümsüz": veri, arayüz, oluşturucu ya da Serüven.

### A. Ortak

- D3 Elemental Affinity tek zara: **düzeldi** (sürümlü 93; `oneDieBonus.ts`; Scorching Ray +CHA bir kez).
- M3 Empowered Spell Magic Missile'da: **düzeldi** (sürümlü 93; otomatik isabetli dart zarları da yeniden atılır, büyü başına en çok CHA zar).
- S3 / S4 / M0 Serüven'de seviye atlama değişimi (cantrip, hazır büyü, Metamagic birer): **düzeldi** (sürümsüz; `levelChoices.ts`). Serüven dışı karakter ekranında serbest düzenleme bilinçli kaldı (K17).

### E. Sorcerer

- M2 Distant Spell arayüzde: **düzeldi** (sürümsüz arayüz: `spellTargets(..., metamagic)` motoru kuru çalıştırır, `areaActSpec(..., metamagic)` noktadan çıkan alanda menzili iki katına çıkarır). Kendinden çıkan alanda (Burning Hands, Cone of Cold…) Distant reddedilir (sürümlü 93; M12).
- M6 Quickened Spell kısıtı: **düzeldi** (sürümlü 93; `economy.leveledCast` / `economy.quickened`: bu tur 1+ seviye büyü yapıldıysa Quickened olmaz, Quickened'dan sonra bu tur 1+ seviye büyü yapılamaz). Yapım süresi SRD kaydından: Mending, Creation, Clairvoyance, Teleportation Circle (1 dakika+) Quickened seçilemez (veri `castingTime` değişmedi).
- M4 Extended Spell kapsamı: **düzeldi** (sürümlü 93; uygunluk SRD süresinden: dakika/saat/gün/dağıtılana dek; süre `effect`, `failEffect` ve kalıcı alan `zone.rounds`'ta ikiye katlanır, en çok 24 saat; konsantrasyon save'inde avantaj `mm-extended` etkisi `concAdv`). ⚠ Koşul zamanlayıcısıyla süren büyülerde (Hold Person: her tur save) 1 dakika tavanı ikiye katlanmadı (tekrar save zaten bitirir).
- M3 / M12 Empowered: Magic Missile (A1) ve hasarsız büyüde ret: **düzeldi** (sürümlü 93).
- D3 Elemental Affinity tek zara: A1 ile **düzeldi**.
- F4 yaratılan slot savaş sonunda silinmiyor (tablonun üstünde de kalır, uzun dinlenmede kaybolur): **düzeldi** (savaşta `slot_created.extra` sürümlü 93 → `Combatant.createdSlots`; karakter durumu sürümsüz: `partyStatus`, `currentStatus`).
- F5 Font of Magic savaş dışında: **düzeldi** (sürümsüz; karakter listesi dinlenme panelinde slot → puan, puan → slot; `fontOfMagicStatus`). Serüven dinlenme ekranında yok (ertelendi, düşük).
- I2 / I3 Innate Sorcery ↔ Draconic Spells: **düzeldi** (sürümlü 93; kullanıcı onayı, K11 sapması kalktı: her zaman hazır sınıf/alt sınıf büyüleri `classSpellsAlways`, DC +1 ve saldırı avantajı).
- D (YZ): Careful (alanda dosta hasar azalıyorsa), Transmuted (en az %25 hasar kazancı), Seeking (saldırı büyüsü; bedel yalnız ıskada), Empowered (1+ seviye hasar büyüsü) eklendi, puan yedeği 2 (sürümlü 93, `ai.ts` `withMetamagic93`). Ertelendi: Distant (hedef/menzil kararı), Extended (süre değeri ölçümü), Subtle (karşı büyü tehdidi), Font of Magic ve Dragon Wings/Companion (yapay zekâ kaynak yönetimi). DECISIONS'taki eski "Metamagic kullanmaz" notları güncellendi.
- E metinler: Quickened kısıtı, Extended avantajı, Distant kendinden çıkan alan TR/EN.
- **Dokunulmadı / ertelendi:** M1 Careful hedef seçimi (yalnız dost, otomatik; seçim arayüzü ayrı iş), M5 çok hedefte Heightened (bilinen), F2 tavanda slot → puan uyarısı (düşük), F6 Font of Magic seviye seçimi (savaşta; düşük), D5 slotlu Summon Dragon konsantrasyonsuz (alt sınıf; bizim metin ayrı inceleme), D4 Dragon Wings kapatma (alt sınıf, düşük), S2–S4/M0 serbest düzenleme (bilinçli; Serüven'de A2 ile kurallı).
