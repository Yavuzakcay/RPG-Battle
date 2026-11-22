# Multiclass incelemesi (MULTICLASS-INCELEME)

Salt okuma incelemesi, 2026-11-22, `birlesik` @ `c0083085`. Kod, veri ve test değişmedi; bu belge tek çıktı.
Kaynak: `docs/SRD_CC_v5.2.1.pdf` (sayfa numaraları PDF'in kendi sayfa numaraları), kod taraması `grep` ile.
Sayılar test dosyaları (`*.test.*`) hariçtir. "doğrulanmadı" yazan satırlar koddan ya da metinden kesinleşmedi.

**Kısa cevap:** Yapılabilir. Kural modüllerinin çoğu zaten `(classId, level, subclassId)` parametresi alıyor; multiclass
çoğunlukla "her sınıf için ayrı çağır, sonuçları birleştir" işi. **Yeni jeton/görsel gerekmez** (§7). Asıl maliyet üç
yerde: (1) savaşta `Combatant.level`'ı sınıf seviyesi sanan ~35 kullanım, (2) tek büyü yeteneği/tek yuva dizisi
(Pact Magic aynı dizide), (3) oluşturucu ve seviye atlama arayüzü. Tahmin: 7 adım, 10–14 prompt (§10).

> Not: CLAUDE.md "seviye sınırı 5, Ayarlar'da 6–20" diyor; kod artık her zaman 20 (`src/app/limits.ts` `LEVEL_CAP`,
> kullanıcı kararı 2026-11-19). Bu belge koddaki durumu esas alır.

---

## 1. SRD 5.2.1 kuralları

| Kural | SRD metni (özet) | Sayfa |
|---|---|---|
| Ne zaman | Seviye atlarken mevcut sınıf yerine yeni sınıfta seviye alınabilir. "Gaining a Level" 1. adım: sınıf seç. | 24, 23 |
| Ön koşul | Yeni sınıfın **ve mevcut sınıfların** ana yeteneği en az **13** (ör. Barbarian→Druid: STR ve WIS ≥ 13). | 24–25 |
| Ana yetenekler | Barbarian STR; Bard CHA; Cleric WIS; Druid WIS; Fighter STR **ya da** DEX; Monk DEX **ve** WIS; Paladin STR **ve** CHA; Ranger DEX **ve** WIS; Rogue DEX; Sorcerer CHA; Warlock CHA; Wizard INT. | 28, 31, 36, 41, 47, 49, 53, 57, 61, 64, 70, 77 ("Core … Traits") |
| XP | Toplam karakter seviyesinden (Cleric 6 / Fighter 1 → 8. seviye XP'si). | 25 |
| Can | Yeni sınıftan "1. seviye sonrası" HP; 1. seviye HP'si yalnız toplam seviye 1'ken. Hit Dice havuzu sınıf başına; aynı zar türü birleşir, farklı türler ayrı izlenir. | 25 |
| Yeterlilik bonusu | Toplam karakter seviyesinden (Fighter 3 / Rogue 2 → +3). | 25 |
| Yetkinlikler | İkinci ve sonraki sınıfın ilk seviyesinde yalnız kısıtlı yetkinlikler (tablo aşağıda). Save yetkinliği **gelmez** (listelerde yok). | 25 + sınıf sayfaları |
| Sınıf özellikleri | O sınıfın seviyesine göre. Özel kural: Extra Attack, Spellcasting, alternatif AC hesapları. | 25 |
| AC | Birden çok AC hesabı varsa (Unarmored Defense, Draconic Resilience…) **aynı anda yalnız biri**. | 25–26 |
| Extra Attack | Birden çok sınıftan gelirse **yığılmaz**; özellik açıkça söylemedikçe ikiden fazla saldırı yok (Fighter'ın Two Extra Attacks'ı söyler). Thirsting Blade, Extra Attack varken ek saldırı vermez. | 26 |
| Büyü hazırlama | Her sınıf için ayrı, o sınıfın tek sınıflı kuralıyla. Her hazırlanan büyü bir sınıfa bağlı; o sınıfın büyü yeteneği kullanılır. | 26 |
| Cantrip gücü | Toplam karakter seviyesinden (büyü aksini söylemedikçe). | 26 |
| Büyü yuvaları | Bard, Cleric, Druid, Sorcerer, Wizard seviyelerinin tamamı + Paladin, Ranger seviyelerinin **yarısı (yukarı yuvarla)** → Multiclass Spellcaster tablosu. Yuvalar her sınıfın büyüsüne; yüksek yuva alçak büyüyü yukarı slotla yapar. Spellcasting yalnız bir sınıftan geliyorsa o sınıfın kuralı. | 26 |
| Üçte bir büyücü | SRD 5.2.1 metninde **yok** (Eldritch Knight/Arcane Trickster SRD'de değil). Ek paket alt sınıfları için kural **belirsiz** (paket verisinde büyücülük türü yok, doğrulanmadı). | 26 |
| Pact Magic | Ayrı havuz. Pact yuvaları Spellcasting sınıflarının hazırlanan büyülerine, Spellcasting yuvaları Warlock büyülerine kullanılabilir. | 26 |
| Feat tekrarı | Feat yalnız bir kez alınır, "Repeatable" yazmıyorsa. Fighting Style feat'leri tekrarlanamaz (Repeatable olanlar: Magic Initiate, Skilled, ASI). | 87–88 |
| Weapon Mastery hakkı | Birden çok sınıftan gelince ne olacağı **metinde yok → belirsiz**. | 29, 48, 54, 58, 62 |
| Channel Divinity | Cleric ve Paladin metni "this class's Channel Divinity" der: kullanım ve etkiler **sınıf başına**; havuzların birleşmediği açıkça yazılmıyor, ifade ayrı havuzu gösteriyor (çıkarım). | 37, 54 |

**İkinci sınıfta alınan yetkinlikler** (sınıf sayfalarındaki "As a Multiclass Character"; hepsinde ayrıca "o sınıfın 1. seviye özellikleri"):

| Sınıf | Kazanılan (Hit Point Die hepsinde) | Sayfa |
|---|---|---|
| Barbarian | Martial silahlar, Shield eğitimi | 28 |
| Bard | 1 beceri (serbest), 1 Musical Instrument, Light zırh | 31 |
| Cleric | Light + Medium zırh, Shield | 36 |
| Druid | Light zırh, Shield | 41 |
| Fighter | Martial silahlar, Light + Medium zırh, Shield | 47 |
| Monk | Yalnız Hit Point Die | 49 |
| Paladin | Martial silahlar, Light + Medium zırh, Shield | 53 |
| Ranger | Martial silahlar, Ranger listesinden 1 beceri, Light + Medium zırh, Shield | 57 |
| Rogue | Rogue listesinden 1 beceri, Thieves' Tools, Light zırh | 61 |
| Sorcerer | Yalnız Hit Point Die | 64 |
| Warlock | Light zırh | 70 |
| Wizard | Yalnız Hit Point Die | 77 |

Multiclass Spellcaster tablosu (s. 26) satır satır `data/spell-slots.json` `full` tablosuyla **aynı** (20 satır,
betikle karşılaştırıldı). Yeni yuva verisi gerekmez.

---

## 2. Kodda tek sınıf varsayımı

Tarama: `grep -o classId|subclassId`, `sheet.level` kalıpları, `(x.classId, x.level` çağrı kalıbı. "anılma" sayısı
parametre adlarını da içerir; asıl iş "çağrı" sütunudur.

| Yer | Dosya:satır | Tek sınıf varsayımı | Sayı |
|---|---|---|---|
| Karakter şeması | `src/rules/stats.ts:17` `CharacterSheet` | Tek `classId`, tek `subclassId?`, tek `level` | 3 alan |
| Türetme | `stats.ts:266` `deriveStats` | `getClass(sheet.classId)`, tek `classKit`, tek `hitDie` (`:318`, HP formülü `(level-1) × hd/2+1`), `speedBonus`, Jack of All Trades, `spellSlotsFor(cls.id, level)` (`:367`) | 6 çağrı |
| Yuva | `stats.ts:202` `spellSlotsFor` | Sınıfın `casting.type` (full/half/pact) tek; **Pact yuvaları normal yuvalarla aynı 9'luk dizide** | 1 |
| Sınıf kiti | `src/rules/classFeatures.ts:225` `classKit` | Tek sınıf+seviye; ama sonuç birleştirilebilir yapıda (`attacksPerAction` zaten `Math.max`, `:259`) | 74 anılma |
| Kaynaklar | `classFeatures.ts:355` `classResources`, `:333` `resourceMax` | Kaynak kimliği sınıfsız: `channelDivinity` hem Cleric hem Paladin (`data/class-features.json:106`) → çakışır | 1 çakışan kimlik |
| Alt sınıf | `src/rules/subclasses.ts` | Sınıf başına liste; çok sınıfı engellemez | 34 anılma |
| Seviye yuvaları | `src/rules/advancement.ts:34` `advancementSlots`; `Advancement.level` (`:21`) | ASI/Fighting Style yuvası **yalnız seviye numarasıyla** anahtarlı → iki sınıfın 4. seviye yuvası çakışır | 16 anılma, 2 çağrı |
| Seçim pencereleri | `src/rules/levelChoices.ts` | Tek sınıfın değişim kuralı | 17 anılma, 2 çağrı |
| Weapon Mastery | `src/rules/mastery.ts:13,39–75` | Hak sayısı tek sınıftan | 8 anılma, 1 çağrı |
| Invocation | `src/rules/invocations.ts:11,83` | Warlock seviyesi = `sheet.level` | 7 anılma |
| Oluşturucu kuralı | `src/rules/builder.ts` | Her doğrulama tek sınıf | 113 anılma, **20 çağrı** |
| Dinlenme | `src/rules/characterRest.ts:112` | `pactMagic` = sınıf pact mı (bütün dizi kısa dinlenmede dolar, `rest.ts:49`) | 3 çağrı, 14 `level` |
| Savaşçı kurulumu | `src/battle/create.ts:174` `combatantFromSheet`, `:245–272` | Tek `classKit`, `invocationKit`, `classResources`, `gainedFeatures` | **6 çağrı** |
| Silahlar | `src/battle/weapons.ts:17–143` | Silah yetkinliği, Martial Arts zarı tek sınıftan | 2 çağrı |
| Paket alt sınıf | `src/battle/paket/bag.ts:45–52` | Tek alt sınıfın paketi | 2 `level` |
| Savaşçı alanları | `src/battle/types.ts:1058` `level`, `:1060` `spellMod`, `spellSaveDc`, `spellAttack`, `:847` `hitDice: {die, left}` | **Tek büyü yeteneği**, tek zar türü | 84 + 31 + 40 kullanım (`spellSaveDc`/`spellAttack`/`spellMod`) |
| Savaşta `c.level` = sınıf seviyesi | `features.ts:680` (Second Wind), `commands.ts:158,160` + `effectDice.ts:95` (Indomitable), `druid.ts` 6 yer (Wild Shape), `cleric.ts:128,190` (Divine Spark, Preserve Life), `martial.ts:165` (Uncanny Metabolism), `damage-effects.ts:76` (Relentless Rage 2×), `brutal.ts:22,34` (17), `sorcerer.ts:172` (Font of Magic), `spells.ts:1853` (Aura 18), `paket/core.ts` 5 + `paket/index.ts` 2 (`$lvl` belirteçleri), `imza*.ts` 14, `karadul.ts` 9 | Toplam seviyeyi sınıf seviyesi olarak kullanıyor | **≈ 50 yer** (62 `x.level` eşleşmesinin kalanı doğru: cantrip ölçeği `spells.ts:145,2149`, `ai.ts:369–370`, Celestial, Polymorph, Moral) |
| Oluşturucu ekranı | `src/screens/Builder.tsx` (`wizardSteps` `:114`: 8 adım + isteğe bağlı Alignment) | Tek sınıf kartı, tek alt sınıf seçici (`:669–713`) | 93 anılma, **15 çağrı** |
| Özellik paneli | `src/screens/builder/Features.tsx` | Tek sınıfın özellik listesi | 38 anılma |
| Donanım | `src/screens/builder/Equipment.tsx` | Sınıf başlangıç donanımı | 5 anılma |
| Öneriler | `src/screens/builderDefaults.ts` (`suggest`) | Tek sınıfa öneri | 59 anılma, **14 çağrı** |
| Karakter kâğıdı | `src/screens/sheet/sheetModel.ts` | "Sınıf N" tek satır | 13 anılma, 1 çağrı |
| Serüven seviye atlama | `src/journey/seruven.ts:307` (`level_up`), `:432` | Bütün partiye `sheet.level = e.level`; sınıf seçimi yok | 1 olay |
| Jeton | `src/battle/avatar.ts:186` `sheetAvatar` (`:194–195`, `:211`) | Jeton = ırk × cinsiyet × `classId` × `subclassId` × `level` | 36 anılma, 32 `sheetAvatar(` çağrısı / 14 dosya |
| Görünüm | `src/ui/lineageLook.ts` | Kanat/hale için alt sınıf | 11 anılma |
| Sim | `src/sim/balance.ts:28,111–116`, `data/sim-partiler.json` (16 üye, 24 parti) | Üye = tek sınıflı sheet | 10 anılma |
| Kayıt | `src/app/storage.ts:10` `CHARACTER_SAVE_VERSION = 3` | Okumada göç kodu yok (doğrudan döküm) | — |
| Testler | 139 test dosyası `classId:` ile sheet kurar | Hepsi tek sınıf; alan eklenirse isteğe bağlı kaldıkça bozulmaz | 139 dosya |

**Toplam:** tek sınıflı çağrı kalıbı en az **68** yerde (`(x.classId, x.level` kalıbı; `deriveStats` içindekiler hariç),
savaşta **≈ 50** `c.level`-sınıf seviyesi kullanımı, **155** büyü yeteneği kullanımı (tek değerden okuyor).

---

## 3. Veri modeli önerisi

```ts
interface ClassEntry { classId: string; level: number; subclassId?: string }
interface CharacterSheet {
  classId: string;        // KORUNUR: ilk (başlangıç) sınıf
  subclassId?: string;    // KORUNUR: ilk sınıfın alt sınıfı
  level: number;          // ANLAMI: toplam karakter seviyesi (tek sınıfta zaten öyle)
  siniflar?: ClassEntry[]; // YENİ, isteğe bağlı: yoksa [{classId, level, subclassId}]
  gorunumSinif?: string;   // YENİ, isteğe bağlı: jeton sınıfı (§7)
  // Advancement'a `classId?` (yoksa ilk sınıf), spellNames'e sınıf bağı `buyuSinif?: Record<ad, classId>`
}
```

- **Tek çözücü:** `classesOf(sheet): ClassEntry[]` (yoksa tek elemanlı) ve `classLevel(sheet, classId)`. Kod `siniflar`'ı
  doğrudan okumaz.
- **Göç:** gerekmez. `siniflar` yoksa davranış bayt bayt aynı; 139 test dosyası ve kayıtlı karakterler bozulmaz.
  `siniflar` varken `classId/subclassId` ilk elemanla, `level` toplamla senkron tutulur (kayıtta yazılırken). Böylece
  `sheet.level`'ı toplam seviye olarak kullanan 198 yer (yeterlilik, bütçe, cantrip, XP) değişmez.
- **Kayıt sürümü:** `CHARACTER_SAVE_VERSION` 3 → 4 (ek alan; 3 olduğu gibi yüklenir). Eski sürüm yeni kaydı açarsa
  `siniflar`'ı yok sayar ve karakteri yanlış (tek sınıf, toplam seviye) görür → sürüm artışı bunu işaretlemek için.
- **Savaşçı:** `Combatant.sinifSeviyeleri?: Record<classId, number>` + yardımcı `classLevelOf(c, classId)` (yoksa
  `c.level`), `spellByClass?: Record<classId, {mod, dc, attack}>` + büyü→sınıf eşlemesi, `pactSlots?` (§5),
  `hitDice` dizi. Hepsi isteğe bağlı.
- **Kural sürümü:** `battle_started` olayı bütün durumu (savaşçılar dahil) taşıdığı için eski replay türetme
  değişikliğinden etkilenmez. Savaş içi `c.level` düzeltmeleri `classLevelOf` geri dönüşüyle tek sınıfta aynı sonucu
  verir; teknik olarak zorunlu değil. **Önerilir:** tek sabit (`MC_VERSION` = o günkü sürüm + 1), çok sınıflı savaşçı
  yalnız bu sürüm ve üstünde kurulur (sim `--kural-surumu` ile eski sürümde açılmaz). Savaş kaydı `SAVE_VERSION`: yalnız
  olay biçimi değişirse (`slot_spent.pact`, §5) artar, `LOADABLE_VERSIONS`'a eklenir.

---

## 4. Yığılmayan ve çakışan özellikler

| Özellik | SRD kuralı | Motorda durum / gereken |
|---|---|---|
| Extra Attack (5 sınıf) | Yığılmaz; Two Extra Attacks açıkça 3 (s. 26) | `attacksPerAction` zaten `Math.max` (`classFeatures.ts:259`) → **hazır**; Thirsting Blade `actionAttacks` max (`economy.ts:167`) → hazır |
| Unarmored Defense (Barbarian CON, Monk WIS) + paket Draconic Resilience | Aynı anda biri (s. 25–26) | `kit.unarmoredDefense` tek değer (`:268`), ikinci üzerine yazar → birleştirmede **en iyisini seç** ya da karakterde seçim alanı |
| Unarmored Movement / Fast Movement | Metinde özel kural yok | `speedBonus` sınıf başına toplanırsa ikisi de eklenir; **doğrulanmadı**, SRD'de yığılmama yazmıyor |
| Fighting Style (Fighter 1, Paladin 2, Ranger 2) | Feat; tekrarlanamaz (s. 87) | Yuva sınıf başına; ikinci yuvada alınmış stil seçilemez (`featProblem`'e "zaten var") |
| ASI / Epic Boon | Sınıf seviyesi 4, 8…; Epic Boon sınıf 19 | `Advancement.level` tek anahtar → `classId` alanı gerekir |
| Weapon Mastery hakkı | **Belirsiz** | Öneri (Game Master/kullanıcı kararı): en yüksek sayı (`Math.max`), toplanmaz |
| Spellcasting / Pact Magic | Sınıf başına hazırlama, birleşik yuva, ayrı pact havuzu (s. 26) | §5 |
| Channel Divinity (Cleric, Paladin) | Sınıf başına ("this class's") | `channelDivinity` kaynak kimliği ortak → sınıfa özgü kimlik (`channelDivinity:paladin`) ya da birleşik havuz kararı |
| Sneak Attack, Rage, Focus, Sorcery Points, Wild Shape, Bardic Inspiration, Lay On Hands, Martial Arts | Kendi sınıf seviyesinden | Kit/kaynak sınıf seviyesiyle çağrılınca doğru; **savaşta `c.level` okuyanlar** (§2; Lay On Hands havuzu kaynak verisinden gelir, sorunsuz): Second Wind, Indomitable, Wild Shape, Divine Spark, Preserve Life, Metabolism, Relentless Rage, Brutal 17, Font of Magic, Aura 18 `classLevelOf`'a geçmeli |
| Kaynak çarpanı CHA/WIS (Bardic Inspiration, Channel…) | Değiştirici aynı | Sorun yok |
| Jack of All Trades, Expertise | Kendi kuralı | Kitler birleşince tek kez (`jack` boolean'dan) |
| Martial Arts + Extra Attack + bonus vuruş | Özel kural yok | Kitler birleşir; Monk silahı koşulu aynı |
| Invocations (Warlock seviyesi) | Warlock seviyesi | `invocationKit(classId, level)` sınıf seviyesiyle → hazır |
| Kayıtlı alt sınıf `gainedFeatures` max(seviye, 3) | — | Paket alt sınıfı için etkin seviye sınıf seviyesi olmalı; sınıf seviyesi < 3'te alt sınıf seçtirilmemeli (aksi hâlde 3. seviye özellikleri gelir) |
| Save yetkinlikleri | Yalnız ilk sınıf | Kit birleşiminde **ilk sınıf dışındakilerin `saves`'i alınmaz** |
| Zırh/silah eğitimi | §1 tablosu | `armorProficient`/`weaponProficient` sınıf başına; ikincil sınıf için ayrı veri (`multiclass` bloğu) |

Sınıf adıyla koşul yasağı (`classFeatures.test.ts` tarar) korunur: hepsi veri + kit birleştirme ile yapılır.

---

## 5. Büyü yuvası

- **Hesap:** `castingLevel = Σ full sınıf seviyesi + Σ ⌈half sınıf seviyesi / 2⌉`; yuvalar `spellSlots.full[castingLevel-1]`.
  Spellcasting tek sınıftan geliyorsa (ör. Fighter 3 / Paladin 2) o sınıfın kendi tablosu (half tablo). Veri hazır;
  yalnız `spellSlotsFor` yanına `multiclassSlots(classes)` (~20 satır) gerekir.
- **Pact Magic:** şu an pact yuvası normal 9'luk diziye yazılıyor (`stats.ts:202–219`); dinlenmede `pactMagic` bütün
  diziyi kısa dinlenmede doldurur (`characterRest.ts:112`, `rest.ts:49`). Warlock + başka büyücü için **ayrı havuz şart**:
  `DerivedStats.pactSlots`, `Combatant.pactSlots {level, count, max}`, savaşta yuva seçicide ayrı satır, `slot_spent`
  olayına `pact?: true` (olay biçimi → `SAVE_VERSION` artışı), kısa dinlenmede yalnız pact havuzu. Tek sınıflı
  Warlock'ta eski yol kalabilir (`pactSlots` yoksa dizi pacttir).
- **Büyü yeteneği:** savaşçıda tek `spellMod/spellSaveDc/spellAttack` (155 kullanım). Öneri: savaşçıya büyü→sınıf
  eşlemesi ve sınıf başına değer; okuma tek yardımcıdan (`spellStatsFor(c, spell)`, yoksa eski alanlar). 155 kullanımın
  hepsini değiştirmek yerine büyü yapım yolunda (`cast_spell` → `spellCtx`) bir kez çözülmesi hedeflenir; kaç kullanımın
  bu yoldan geçtiği **doğrulanmadı** (en riskli kalem).
- **Hazırlama:** `spellLimits`/`spellOptions` sınıf başına çağrılır; listeler sınıf etiketiyle birleşir. Yüksek yuva
  alçak büyüyü yukarı slotla yapar: mevcut upcast yolu (`mechanics.upcast`) değişmez.
- **Kaynak yenilenmesi:** sınıf kaynakları kimlik bazında, kısa/uzun dinlenme kuralı veride (`recharge`) → değişmez;
  yalnız `channelDivinity` çakışması (§4) ve Arcane Recovery/Font of Magic'in "sınıf seviyesi" girdisi.

---

## 6. Oluşturucu

Önerilen en az değişiklik yolu: **yeni karakter her zaman tek sınıfla başlar** (8 adımlı sihirbaz aynen; SD3 ve
`suggest` önerileri dokunulmaz). Multiclass yalnız **seviye atlarken / seviye artırırken**:

- "İlerleme" adımında seviye arttırılınca tek satır: `Yeni seviye: [Fighter ▾]` (mevcut sınıflar + "Yeni sınıf…").
  "Yeni sınıf" katlanmış listede (`Fold`), ön koşulu (13) tutmayanlar soluk + neden metni (`issues`).
- Sınıf dağılımı tek satır özet: "Fighter 3 · Wizard 2". Her sınıfın alt sınıf seçicisi yalnız o sınıf ≥ 3 olunca.
- Özellik paneli ve büyü adımı sınıf başına bölüm (sekme değil, başlıklı bölüm); büyü adımı ikinci büyücü sınıfında
  ikinci liste.
- Oluştururken sınıf dağıtımı (ör. 5. seviye karakteri "3+2" kurmak) **ikinci aşama**; ilk sürümde "seviye ekle"
  düğmesini art arda kullanarak yapılır.
- Seviye sınırı 20 (toplam). Bütçe (`budgetPerCharacter(level)`, `data/butce.json`) toplam seviyeden → **değişmez**.
- Serüven: `seruven_leveled` partiye seviye yazıyor (`seruven.ts:432`); multiclass için olay `sinif?` alanı ya da
  seviye sonrası "bekleyen seçim" (`pendingChoices`) — önerilen: seviye atlayınca varsayılan ilk sınıf, karakter
  listesinde "sınıf değiştir" bekleyen seçimi.
- Ayar: Ayarlar'da "Çok sınıf (SRD)" anahtarı (varsayılan kapalı) → kapalıyken arayüzde hiçbir şey görünmez.

---

## 7. Görsel / jeton (asıl endişe)

- Jeton çözümü tek yerde: `sheetAvatar(sheet)` (`src/battle/avatar.ts:186`). Girdiler: ırk, cinsiyet, `classId`,
  `subclassId`, `level` (Gariban < 3 `:194`, alt sınıf jetonu ve 2. form eşiği `:195`, kanat/`look` `:211`).
- Çözüm: `gorunumSinif` (varsayılan **en yüksek seviyeli sınıf**, eşitlikte ilk sınıf). `sheetAvatar` başında
  `lookSheet(sheet)` = `{ ...sheet, classId: v.classId, subclassId: v.subclassId, level: v.level }` (görünüm sınıfının
  **sınıf seviyesi**: o sınıf < 3 ise o sınıfın Gariban jetonu). 32 `sheetAvatar(` çağrısı değişmez; değişiklik
  tek fonksiyonda (~10 satır). Rozet, savaş jetonu (`create.ts` → `Avatar`), galeri ve karakter kâğıdı aynı yoldan
  geçtiği için hepsi tutarlı.
- Aynı yardımcı: `prisonerOutfit` (`costumeClass`), `lineageLook` kanatları (`hasSubclassWing`), `CLASS_LABEL` yedek
  rozeti (`:202`; görünüm sınıfının kısaltması).
- **Yeni görsel: hiç.** Her (ırk, cinsiyet, sınıf, alt sınıf hücresi, Gariban) birleşimi bugün tek sınıflı bir karakterde
  de mümkün; görünüm sınıfı bunlardan birini seçer. İsteğe bağlı küçük metin ("Fighter 3 / Wizard 2") ve
  oluşturucuda "Jeton sınıfı" seçici (yalnız ≥ 2 sınıfta, tek `<select>`) gerekir.
- Risk: Gariban kuralı "toplam seviye < 3" yerine "görünüm sınıfı seviyesi < 3"; kullanıcı kararı (aşağıda).

---

## 8. Savaş motoru etkisi

- **Kurulumda (çoğunluk):** `combatantFromSheetBase` (`create.ts:245–272`) sınıf başına `classKit` / `classResources` /
  `invocationKit` / `gainedFeatures` çağırıp birleştirir. Kit sütunları (`sneakAttackDice`, `rage.damage`,
  `martialArts.die`, `weaponMastery.count`) `tableValue(classId, level, column)` ile **sınıf seviyesinden** okunuyor →
  sınıf seviyesi verilirse doğru. Toplam seviye verilirse yanlış (en büyük risk: "Rogue 1 / Fighter 4" → 3d6 Sneak).
- **Savaş içinde:** §2'deki ≈ 50 `c.level` kullanımı (Second Wind, Indomitable, Wild Shape, Preserve Life, Divine Spark,
  Metabolism, Relentless Rage, Brutal, Font of Magic, Aura, paket `$lvl`, imza, Karadul) `classLevelOf(c, sınıf)`'a
  geçmeli. Hangi sınıf? Kaynak/özellik verisinde `feature: 'cleric:…'` önekinden. Paket ve imza belirteçleri alt
  sınıfın sınıfından.
- **Doğru kalanlar (toplam seviye):** cantrip ölçeği (`spells.ts:145,2149`, `ai.ts:369–370`), yeterlilik, Celestial ve tür
  özellikleri (`species.ts:43`), Polymorph sınırı, Moral, bütçe.
- **Replay:** `battle_started` bütün savaşçıyı taşır; kayıtlı savaşlar türetme değişikliğinden etkilenmez. Savaş içi
  `classLevelOf` geri dönüşü tek sınıfta `c.level` → eski replay aynı. Regresyon: mevcut altın tohumlu regresyon
  testleri (ör. `src/sim/*Regresyon.test.ts`) yeterli ölçü.

---

## 9. Sim ve denge

- `data/sim-partiler.json` üyesi: `sheet` + `levels.<N>`; çok sınıflı üye için `siniflar` alanı `levels.<N>` içinde
  (ör. `levels.5.siniflar = [fighter 2, wizard 3]`). Test "SRD'ye göre eksiksiz" denetimi sınıf başına genişler.
- Mevcut partiler ve senaryolar değişmez → **mevcut denge bozulmaz** (yeni alan yoksa davranış aynı).
- Ek ölçüm (CLAUDE.md hafif mod): yeni parti `mc-karma` (ör. Fighter/Wizard, Paladin/Warlock, Rogue/Ranger,
  Cleric/Monk), 100 tohum, 4 senaryo (Çöl/Kale/Mağara/Orman) × seviye 5 ve 9. Yeni senaryo gerekmez.
- YZ süresi: aday sayısı sınıf başına birleşen eylemler kadar artar; Pact + slot iki yuva satırı. Tahmin küçük;
  `sim:yz-sure -- 3 kale --parti mc-karma` ile ölçülmeli (**doğrulanmadı**).

---

## 10. Adım planı

| Adım | İçerik | Boyut | Bağımlılık | Kural / kayıt | Regresyon riski |
|---|---|---|---|---|---|
| M1 | `ClassEntry`, `classesOf`, `classLevel`, `siniflar`/`gorunumSinif` alanları, `Advancement.classId`, veri `data/cok-sinif.json` (ana yetenek, ikincil yetkinlik, büyücülük katkısı; SRD sayfa referanslı) + kimlik testi | küçük | — | `CHARACTER_SAVE_VERSION` 4 | çok düşük (alan isteğe bağlı) |
| M2 | Türetme: `deriveStats` sınıf başına kit birleştirme, HP (ilk sınıf 1. seviye tam, sonraki ortalama), Hit Dice dizisi, save yalnız ilk sınıf, eğitim sınıf başına, ön koşul (`issues`) | orta | M1 | — | orta (`stats.ts` her yerde) |
| M3 | Büyü: `multiclassSlots`, ayrı `pactSlots` (sheet + dinlenme + savaş), büyü→sınıf eşlemesi, sınıf başına DC/saldırı | büyük | M2 | `SAVE_VERSION` +1 (`slot_spent.pact`) | yüksek (155 büyü yeteneği kullanımı) |
| M4 | Yığılmayan/çakışan: Unarmored Defense seçimi, Fighting Style tekrar yasağı, Weapon Mastery max, `channelDivinity` sınıf başına, savaşta ≈ 50 `c.level` → `classLevelOf` | orta–büyük | M2 | `MC_VERSION` (önerilir) | orta (altın regresyonlar korur) |
| M5 | Oluşturucu + seviye atlama: "Yeni seviye: sınıf ▾", sınıf başına özellik/büyü bölümü, Serüven bekleyen seçim, Ayarlar anahtarı, TR/EN metin | büyük | M2–M4 | — | orta (arayüz testleri) |
| M6 | Jeton görünüm sınıfı: `lookSheet` + seçici + kâğıt/kart metni | küçük | M1 | — | düşük (tek fonksiyon) |
| M7 | Sim partisi `mc-karma`, test, 100 tohum ölçümü, YZ süresi, `DENGE.md` | orta | M2–M4 | — | düşük |

**Tahmin:** 10–14 prompt (M3 ve M5 ikişer–üçer). M1, M6 tek prompt; M6 M1'den hemen sonra yapılabilir (görsel
endişesini erken kapatır).

**Karar gereken yerler:** M1 (veri biçimi), M3 (büyü yeteneği çözümü), M4 (Weapon Mastery, Channel Divinity,
Unarmored Defense seçimi), M5 (arayüz yeri ve Serüven akışı), M6 (Gariban eşiği).

---

## 11. Tavsiye

- **Fayda:** Klasik D&D oyuncusu için beklenen bir özellik; 120 alt sınıfla birleşince kombinasyon zenginliği yüksek.
  Serüvende (seviye 1'den, tek parti) seviye atlama anlarına doğal oturur.
- **Maliyet/risk:** Görsel maliyeti **sıfır**. Kod maliyeti orta–büyük; riskin çoğu M3 (büyü yeteneği + pact) ve M4
  (savaşta sınıf seviyesi). Denge ölçümü yalnız yeni parti için.
- **Basit alternatifler:**
  1. **Büyüsüz multiclass** (en az bir sınıfı büyücü olmayan ya da büyücü sınıfı tek): M3'ün çoğu ertelenir, iş ≈ %40 azalır.
  2. **En çok 2 sınıf:** arayüz ve test kombinasyonu küçülür; kod modeli yine liste.
  3. **Yalnız seviye 3+ ikinci sınıf:** alt sınıf/Gariban sorunlarını azaltır, kuralı daraltır (SRD dışı ev kuralı).
  4. Multiclass yerine feat/alt sınıf zenginliği: mevcut yapıya sıfır risk, ama kullanıcı isteği karşılanmaz.
- **Öneri:** M1 + M6 hemen yapılabilir (küçük, güvenli, görsel endişesini kapatır); sonra M2 + M4 + M5 ile **büyüde
  tek Spellcasting sınıfı** kısıtlı ilk sürüm (alternatif 1), M3 ayrı kuyruk. Mevcut kuyruk (Serüven ayrımı,
  `SERUVEN-AYRIM.md`) ile çakışma: Serüven seviye atlama akışı (M5) ayrım planı netleşince yapılmalı.

**Kullanıcıya sorulacaklar:**
1. Tam SRD mi, yoksa ilk sürümde büyüde tek Spellcasting sınıfı / en çok 2 sınıf kısıtı mı?
2. Weapon Mastery hakkı: en yüksek mi, toplam mı (SRD'de belirsiz)?
3. Channel Divinity: sınıf başına ayrı havuz (SRD ifadesi) mi?
4. Jeton: Gariban eşiği görünüm sınıfının seviyesi mi, toplam seviye mi? Varsayılan görünüm sınıfı "en yüksek
   seviyeli" mi, "ilk sınıf" mı?
5. Serüvende seviye atlayınca sınıf seçimi ne zaman: atlama anında mı, karakter listesinde bekleyen seçim mi?
6. Ayarlar'da açma/kapama anahtarı olsun mu (varsayılan kapalı)?
