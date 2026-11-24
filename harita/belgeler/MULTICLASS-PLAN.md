# Çoklu sınıf uygulama planı (MULTICLASS-PLAN)

2026-11-24, `claude/beautiful-davinci-ahi7yn` @ `ae9267be`. Yalnız belge: kod, veri ve test değişmedi. Kaynaklar: SRD 5.2.1
(`docs/SRD_CC_v5.2.1.pdf` s. 24–26 ve sınıf sayfalarındaki "As a Multiclass Character" kutuları; bu belgeyi yazarken PDF'ten
yeniden okundu), kod taraması `harita/belgeler/MULTICLASS-INCELEME.md` (2026-11-22; satır numaraları o sürümden, başlıca
yerler 2026-11-24'te `grep` ile yeniden doğrulandı). Hikâye tarafındaki kutsal ayna kuralı Serüven planına aittir; burada
yalnız motorun ona bıraktığı kapı anlatılır.

## 0. Kullanıcı kararları (2026-11-24)

| # | Karar |
|---|---|
| K1 | Yan sınıf için seviye kısıtı yok (SRD'de yok). Tek kısıt SRD ön koşulu: yeni sınıfın ve mevcut sınıfların ana yeteneği ≥ 13 |
| K2 | Motorda ek bedel yok. Bedel hikâyede: Serüven'de yan sınıf yalnız kutsal aynada açılır |
| K3 | Dice & Hex (Karakterlerim): çoklu sınıf her zaman açık, Ayarlar anahtarı yok. Serüven: yalnız aynada |
| K4 | En çok 3 sınıf her yerde; tek sabit `src/app/limits.ts` (SRD'de sınır yok: ev kuralı) |
| K5 | Weapon Mastery: SRD'de açık değil. Tek havuz, hak sayısı sınıfların en yükseği (toplanmaz); her silah, onu ustalık listesine alabilen bir sınıfın kısıtına uymalı. DECISIONS.md'ye "SRD'de açık değil" notuyla |
| K6 | Channel Divinity: sınıfa özgü ayrı havuz (SRD "this class's Channel Divinity"); kaynak kimliği sınıf önekli |
| K7 | Unarmored Movement + Fast Movement toplanır |
| K8 | Birden çok AC hesabı: en yüksek olan otomatik (aynı anda yalnız biri, SRD s. 25); oyuncu seçimi yok |
| K9 | İlk sürüm tam SRD (iki büyücü sınıf + Pact). Sıra: MC1–MC2 önce yapılıp doğrulanır, MC3 (yuva + Pact) ayrı aşama; büyü kısıtı yok |
| K10 | Ek paket alt sınıflarının büyü yuvası katkısı şimdilik yok (SRD'de ve veride yok); sonra karar |
| K11 | Jeton görünüm sınıfı: en yüksek seviyeli sınıf, eşitlikte ilk sınıf. Gariban / alt sınıf jetonu eşiği görünüm sınıfının seviyesine göre |
| K12 | Serüven seviye atlama: bekleyen seçim, varsayılan mevcut sınıfta devam; yan sınıf seçeneği yalnız kutsal ayna yanındayken |
| K13 | Yeniden şekillenme (sınıf değiştirme): ertelendi (MC8), çoklu sınıf bitince ayrıca tartışılır |

## 1. SRD 5.2.1 kuralları (uygulanacaklar)

| Kural | Sayfa | Not |
|---|---|---|
| Seviye atlarken mevcut sınıf yerine yeni sınıfta seviye alınabilir | 24 | Seviye kısıtı yok (K1) |
| Ön koşul: yeni sınıfın **ve mevcut sınıfların** ana yeteneği ≥ 13 | 24 | Ana yetenekler: Barbarian STR; Bard CHA; Cleric WIS; Druid WIS; Fighter STR **ya da** DEX; Monk DEX **ve** WIS; Paladin STR **ve** CHA; Ranger DEX **ve** WIS; Rogue DEX; Sorcerer CHA; Warlock CHA; Wizard INT (sınıf sayfalarındaki "Core Traits"; metin `data/srd/classes.json` `core["Primary Ability"]`) |
| XP eşiği toplam karakter seviyesinden | 25 | `sheet.level` toplam seviye kalır, XP kodu değişmez |
| Can: yeni sınıftan "1. seviye sonrası" can; 1. seviye canı yalnız toplam seviye 1'ken | 25 | İlk sınıfın 1. seviyesi tam zar + CON, sonraki her seviye o seviyenin sınıfından |
| Can zarı havuzu: bütün sınıfların zarları; aynı tür birleşir, farklı türler ayrı izlenir | 25 | Örnek: Cleric 5 / Paladin 5 = 5d8 + 5d10 |
| Yeterlilik bonusu toplam seviyeden | 25 | Değişmez |
| İkinci ve sonraki sınıfın ilk seviyesinde başlangıç yetkinliklerinin yalnız bir kısmı | 25 + sınıf kutuları | Tablo aşağıda. Hiçbirinde kurtarma zarı yetkinliği ve başlangıç donanımı yok |
| Sınıf özellikleri o sınıfın seviyesine göre; Extra Attack, Spellcasting ve alternatif AC için özel kural | 25 | |
| AC: birden çok hesap varsa aynı anda yalnız biri | 25 | K8: en yüksek otomatik |
| Extra Attack yığılmaz; açıkça söyleyen özellik hariç (Fighter Two Extra Attacks) en çok iki saldırı; Thirsting Blade, Extra Attack varken ek saldırı vermez | 25 | Motorda hazır (`attacksPerAction` `Math.max`, `src/rules/classFeatures.ts:259`); test eklenir |
| Spellcasting tek sınıftan geliyorsa o sınıfın kuralı | 25 | |
| Hazırlanan büyüler sınıf başına, tek sınıflıymış gibi; her büyü bir sınıfa bağlı, o sınıfın büyü yeteneği | 25 | MC3 |
| Cantrip gücü toplam seviyeden (büyü aksini söylemedikçe) | 25 | Bugün de öyle |
| Ortak yuva: Bard, Cleric, Druid, Sorcerer, Wizard seviyelerinin tamamı + Paladin, Ranger seviyelerinin yarısı (yukarı yuvarla) → Multiclass Spellcaster tablosu; yuvalar sahip olunan her Spellcasting sınıfının büyüsüne | 25–26 | Tablo `data/spell-slots.json` `full` ile satır satır aynı (2026-11-24 PDF'ten çıkarılıp betikle karşılaştırıldı): yeni yuva verisi gerekmez |
| Yüksek yuvayla yalnız alçak büyü; yukarı slot etkisi normal | 25–26 | Mevcut yukarı slot yolu |
| Pact Magic + Spellcasting: Pact yuvaları Spellcasting sınıflarının hazırlanan büyülerine, Spellcasting yuvaları Warlock büyülerine | 26 | Ayrı havuz (MC3) |
| Fighting Style feat'i tekrarlanamaz ("Repeatable" yazmayan feat bir kez) | 87–88 | İkinci sınıfın stil yuvasında alınmış stil seçilemez |

**Ek sınıfın ilk seviyesinde gelenler** (hepsinde Hit Point Die ve o sınıfın 1. seviye özellikleri):

| Sınıf | Ek | Sayfa |
|---|---|---|
| Barbarian | Martial silahlar, Shield | 28 |
| Bard | 1 beceri (serbest), 1 Musical Instrument, Light zırh | 31 |
| Cleric | Light + Medium zırh, Shield | 36 |
| Druid | Light zırh, Shield | 41 |
| Fighter | Martial silahlar, Light + Medium zırh, Shield | 47 |
| Monk | — | 49 |
| Paladin | Martial silahlar, Light + Medium zırh, Shield | 53 |
| Ranger | Martial silahlar, Ranger listesinden 1 beceri, Light + Medium zırh, Shield | 57 |
| Rogue | Rogue listesinden 1 beceri, Thieves' Tools, Light zırh | 61 |
| Sorcerer | — | 64 |
| Warlock | Light zırh | 70 |
| Wizard | — | 77 |

**SRD'nin açık bırakıp kullanıcının karara bağladıkları:** Weapon Mastery hakkı (K5), Channel Divinity havuzu (K6), hız
bonuslarının toplanması (K7). **Açık kalan:** ek paket alt sınıflarının yuva katkısı (K10).

## 2. Veri modeli

```ts
// src/rules/stats.ts
interface ClassEntry {
  classId: string;
  level: number;              // bu sınıftaki seviye (≥ 1)
  subclassId?: string;
  /** Ek sınıfın SRD ilk seviye seçimleri (yalnız 2. ve 3. öğede): Bard 1 beceri + 1 çalgı, Ranger/Rogue 1 beceri. */
  ekBeceri?: Skill; ekCalgi?: string;
}
interface CharacterSheet {
  classId: string;            // KALIR: ilk (başlangıç) sınıf = classes[0].classId
  subclassId?: string;        // KALIR: classes[0].subclassId
  level: number;              // KALIR, anlamı toplam karakter seviyesi
  classes?: ClassEntry[];     // YENİ: 1–3 öğe (MAX_CLASSES); sıra = alınış sırası
}
// src/rules/advancement.ts  Advancement.classId?: string   (yoksa ilk sınıf; ASI/stil/Epic Boon yuvasının sınıfı)
// MC3: CharacterSheet.spellClass?: Record<büyü adı, classId>   (hazırlanan büyünün sınıfı; yoksa tek büyücü sınıfı)
// src/rules/characterRest.ts  CharacterStatus.hitDiceSpentBy?: Record<zar (6|8|10|12), number>
```

- **Tek okuma yolu** (`src/rules/multiclass.ts`, yeni): `classesOf(sheet)` alan yoksa `[{ classId, level, subclassId }]`;
  `classLevel(sheet, id)`; `isMulticlass(sheet)`. Kod `classes`'ı doğrudan okumaz. (Ad çakışması yok: depoda bugün
  `classesOf`/`classLevel` tanımı yok; benzer görünen `subclassesOf` ayrı işlev.)
- **Değişmezler:** `classes` varken `classId`/`subclassId` = ilk öğe, `level` = Σ seviye; her yazışta tek yardımcı
  (`syncClassFields`) eşitler. `sheet.level`'ı toplam seviye olarak kullanan yerler (XP, yeterlilik, bütçe, cantrip,
  tür özellikleri, Moral) değişmez.
- **Yazma kuralı:** `classes` yalnız 2+ sınıfta yazılır. Tek sınıflı kayıtlar (eski ve yeni) bayt bayt aynı kalır; testlerdeki
  tek sınıflı sheet'ler bozulmaz.
- **Ek beceri:** `ekBeceri` `sheet.skills`'e de yazılır (beceri tablosu ve savaş tek listeden okur); `ClassEntry` hangi
  becerinin o sınıftan geldiğini tutar (doğrulama ve sınıf kaldırılırsa geri alma).
- **Kayıt sürümü:** `CHARACTER_SAVE_VERSION` 3 → 4 (`src/app/storage.ts:10`). Okumada göç gerekmez (alan isteğe bağlı);
  sürüm, yeni kaydı açan eski uygulamanın karakteri tek sınıf + toplam seviye olarak yanlış göreceğini işaretler.
- **Veri** `data/cok-sinif.json` (yeni; SRD sayfa referanslı, kimlik testi):
  `{ "<sınıf>": { anaYetenek: { hepsi | biri: Ability[] }, ek: { silah?, zirh?, beceri?: { sayi, liste: 'hepsi'|'sinif' },
  alet?, calgi? }, yuva: 'tam' | 'yari' | 'pact' | null, sayfa } }`. Test: 12 sınıf, ana yetenek `data/srd/classes.json`
  metniyle eşleşir ("or" → `biri`, "and" → `hepsi`), `yuva` SRD s. 25 listesiyle eşleşir.

## 3. Tek sınıf varsayımları ve gereken değişiklik

| Alan | Bugün | Değişiklik | Adım |
|---|---|---|---|
| `CharacterSheet` (`stats.ts:17`) | Tek `classId`/`subclassId`/`level` | §2 | MC1 |
| `deriveStats` (`stats.ts:266`) | Tek `classKit`, can `hd + (level−1)×(hd/2+1)`, `kit.hpPerLevel × level`, tek `speedBonus`, kurtarma `cls.saves`, `armorProficient(cls.id)`, Jack tek sınıftan, yuva `spellSlotsFor(cls.id, level)` | Sınıf başına kit + birleştirme; can sınıf başına (ilk sınıfın 1. seviyesi tam); `hpPerLevel` o sınıfın seviyesiyle (Draconic Resilience); hız bonusları toplanır (K7); temel kurtarma yalnız ilk sınıf, özellikten gelen kurtarma her sınıftan; zırh eğitimi ilk sınıf + ek sınıf tablosu; zırhsız AC adaylarından en yükseği (K8); tek büyücü sınıfta o sınıfın yuvası ve DC'si | MC2 (çok büyücü MC3) |
| Zırh/silah eğitimi (`stats.ts:129` `armorProficient`, `src/rules/mastery.ts:13` `weaponProficient`) | `classId` alır | Sheet düzeyinde sarmalayıcı: ilk sınıfın tam eğitimi ∪ ek sınıfların `ek` tablosu | MC2 |
| Beceriler (`stats.ts:246` `classSkillProblem`) | İlk sınıfın beceri seçimi | Ek sınıf becerisinin doğrulaması (Bard serbest, Ranger/Rogue liste) | MC2 |
| ASI / stil yuvaları (`advancement.ts:34` `advancementSlots`) | Seviye numarasıyla anahtarlı | Sınıf başına çağrı + `Advancement.classId`; Fighting Style tekrar yasağı | MC2 |
| Oluşturucu doğrulaması (`src/rules/builder.ts` `characterIssues`) | Tek sınıf | Ön koşul (K1), en çok 3 sınıf (K4), aynı sınıf iki kez yok, toplam ≤ `LEVEL_CAP`, sınıf başına alt sınıf (o sınıfın alt sınıf seviyesinde) | MC2 |
| Can zarı ve dinlenme (`src/rules/characterRest.ts:22,86,111`) | Tek sayı `hitDiceSpent` | `hitDiceSpentBy` (zar türü başına); kısa dinlenmede hangi zarın harcandığı; uzun dinlenmede hepsi | MC2 |
| Büyü yuvası ve Pact (`stats.ts:202`; `characterRest.ts:112`) | Pact = bütün 9'luk dizi | `multiclassSlots(classes)` + ayrı `pactSlots`; kısa dinlenmede yalnız Pact havuzu; tek sınıflı Warlock eski yolda | MC3 |
| Büyü yeteneği (savaşçı `spellMod`/`spellSaveDc`/`spellAttack`, ≈155 kullanım) | Tek değer | `spellClass` + sınıf başına değer; okuma `cast_spell` yolunda tek yardımcıdan (`spellStatsFor`), yoksa eski alanlar | MC3 |
| Büyü hazırlama (`spellLimits`/`spellOptions`) | Tek sınıf | Sınıf başına çağrı, listeler sınıf etiketiyle birleşir | MC3 |
| `combatantFromSheet` (`src/battle/create.ts:174`, kit `:245`, kaynaklar `:251`) | Tek `classKit`/`classResources`/`invocationKit`/`gainedFeatures` | Sınıf başına, **sınıf seviyesiyle** çağırıp birleştirme; savaşçıya `classLevels?`, `hitDice` dizi, `pactSlots?` (MC3) | MC4 |
| Savaş içi sınıf seviyesi (≈ 50 `c.level`: Second Wind, Indomitable, Wild Shape, Divine Spark, Preserve Life, Uncanny Metabolism, Relentless Rage, Brutal Strike, Font of Magic, Aura, paket `$lvl`, imza, Karadul) | Toplam seviye = sınıf seviyesi | `classLevelOf(c, sınıf)`, yoksa `c.level`; sınıf özellik/kaynak kimliğinin önekinden, paket ve imzada alt sınıfın sınıfından | MC4 |
| Kaynaklar (`classFeatures.ts` `classResources`; `data/class-features.json:106` `channelDivinity`) | Kimlik sınıfsız; Cleric ve Paladin aynı kimlik | Sınıf önekli kimlik (K6); eski `channelDivinity` durumu tek sınıflı karakterde o sınıfınki sayılır (Serüven/Karakterlerim durumu taşınır) | MC4 |
| Weapon Mastery (`mastery.ts:39-75`) | Hak tek sınıftan | K5: en yüksek hak, silah başına hakkı veren sınıfın kısıtı | MC4 |
| Sihirbaz (`src/screens/Builder.tsx`, `builder/Features.tsx`, `builder/Equipment.tsx`, `builderDefaults.ts`) | Tek sınıf kartı ve alt sınıf seçici | Yeni karakter tek sınıfla başlar (akış aynı); seviye eklerken "Yeni seviye: [sınıf ▾]" (mevcut sınıflar + "Yeni sınıf…", ön koşulu tutmayan soluk + neden); sınıf başına özellik/büyü bölümü; ek sınıf beceri/çalgı seçimi; Karakterlerim'de her zaman açık (K3) | MC5 |
| Karakter kâğıdı ve sınıf etiketi gösteren yerler (`src/screens/sheet/sheetModel.ts` vb.) | "Sınıf N" | "Fighter 3 · Wizard 2" | MC5 |
| Serüven seviye atlama (`src/journey/seruven.ts` `level_up` → `seruven_leveled`) | Bütün partiye tek seviye | Bekleyen seçim, varsayılan mevcut sınıf (K12); yan sınıf seçeneği yalnız ayna koşulu doğruyken (koşul Serüven sahne/ayna işine bağlı; ayna gelene dek Serüven'de yan sınıf açılmaz). Olay sheet yamasını taşır (replay güvenli) | MC5 |
| Jeton (`src/battle/avatar.ts:186` `sheetAvatar`) | Irk × cinsiyet × sınıf × alt sınıf × seviye | Başta `lookSheet`: görünüm sınıfı + o sınıfın seviyesi (K11); yeni görsel yok | MC6 |
| Sim partileri (`data/sim-partiler.json`, `src/sim/balance.ts`) | Tek sınıflı üye | `levels.<N>.classes`; "SRD'ye göre eksiksiz" testi sınıf başına; yeni parti `mc-karma` | MC7 |
| Kayıt sürümleri | Karakter 3, savaş 25, yolculuk 2, kural 103 | Karakter 4 (MC1); savaş kaydı +1 (`slot_spent.pact`, MC3); kural 105 (MC3/MC4; 104 KARAR104'ün, DECISIONS.md MC2); yolculuk aynı | — |

## 4. Adımlar

Her adım ayrı commit; hafif doğrulama modu (typecheck, ilgili testler, build, `check:harita`, `check:ses`; tam `npm test`
yok). Tek sınıflı karakterin davranışı her adımda değişmez; bunu mevcut testler ve tek sınıf için eklenen "eski = yeni"
testleri bekler.

| Adım | İçerik | Dosyalar | Sürüm | Doğrulama |
|---|---|---|---|---|
| **MC1** Veri modeli | `ClassEntry`, `classes?`, `Advancement.classId?`, `MAX_CLASSES = 3`, `src/rules/multiclass.ts` (okuma yardımcıları, `syncClassFields`, ön koşul ve sınır denetimi saf işlev olarak), `data/cok-sinif.json`, DECISIONS.md kararları (K5 "SRD'de açık değil" notuyla) | `stats.ts`, `advancement.ts`, `limits.ts`, yeni `multiclass.ts`, `data/cok-sinif.json`, `storage.ts`, `DECISIONS.md` | Karakter 4 | Yeni `src/rules/multiclass.test.ts` (veri ↔ SRD metni, yardımcılar, ön koşul "ve/ya da" örnekleri, 3 sınıf sınırı) |
| **MC2** Türetme | §3'te MC2 satırları: can, can zarı havuzu ve dinlenme, kurtarma, eğitim, ek beceri, hız, AC (K8), ASI/stil yuvaları, Jack, alt sınıf seviyesi, `characterIssues`; çok büyücü sınıf yuvası henüz yok | `stats.ts`, `classFeatures.ts` (kit birleştirme), `mastery.ts` (yalnız eğitim sarmalayıcısı), `advancement.ts`, `builder.ts`, `characterRest.ts` | Yok (savaş kurulumu henüz tek sınıf; çoklu sınıf sheet'i arayüzden kurulamıyor) | SRD örnekleri: Fighter 3 / Rogue 2 → +3; Fighter 5 / Paladin 5 → 10d10; Cleric 5 / Paladin 5 → 5d8 + 5d10; Monk/Sorcerer tek AC; Barbarian → Druid ön koşulu; tek sınıf eski = yeni |
| **MC3** Büyü | Ortak yuva, ayrı Pact havuzu (sheet, dinlenme, savaş, yuva seçicide ayrı satır), `spellClass`, sınıf başına DC/saldırı, sınıf başına hazırlama | `stats.ts`, `characterRest.ts`, `src/rules/rest.ts`, büyü hazırlama kuralları, `battle/types.ts`, `battle/create.ts`, büyü yapım yolu, `battleSave.ts`, yuva seçici arayüzü | Savaş kaydı +1 (KARAR104 artırırsa 27, yoksa 26), kural 105 (`MC_VERSION`, tek sabit); numaralar MC3 başında birlesik'ten | Örnek Ranger 4 / Sorcerer 3 → 5. seviye yuvaları, 3. seviye büyü hazırlanamaz; Warlock + Wizard Pact/yuva çapraz kullanımı; tek sınıflı Warlock eski yol; önceki savaş kaydı sürümü yüklenir |
| **MC4** Savaş | `combatantFromSheet` sınıf başına birleştirme, ≈ 50 `c.level` → `classLevelOf`, Channel Divinity sınıf önekli (K6), Weapon Mastery (K5), can zarı dizisi, Extra Attack/Thirsting Blade testleri | `battle/create.ts`, `classFeatures.ts`, `mastery.ts`, §3'teki savaş dosyaları, `data/class-features.json` | MC3'ün `MC_VERSION`'ı (araya başka sürüm girerse kendi sürümü) | Rogue 1 / Fighter 4 → Sneak Attack 1d6; altın tohumlu 3–4 regresyon (tek sınıf aynı imza) |
| **MC5** Arayüz | Sihirbaz seviye ekle + sınıf seçimi, sınıf başına bölümler, kâğıt/kart etiketi, Serüven bekleyen seçim (K12), TR/EN metinler | `Builder.tsx`, `builder/*`, `builderDefaults.ts`, `sheetModel.ts`, `seruven.ts`, `SeruvenScreen.tsx`, `strings.ts`, `strings.en.ts` | Yok | Arayüz testleri; tek ekran görüntüsü |
| **MC6** Jeton | `lookSheet` (K11) | `battle/avatar.ts` (+ `prisonerOutfit`, kanat alt sınıf bağı aynı yardımcıdan) | Yok | Birim test |
| **MC7** Denge | Sim partisi `mc-karma` (örn. Fighter/Wizard, Paladin/Warlock, Rogue/Ranger, Cleric/Monk), 100 tohum, Çöl/Kale/Mağara/Orman × seviye 5 ve 9, `sim:yz-sure`, `DENGE.md` | `data/sim-partiler.json`, `DENGE.md` | Yok | Parti testi (SRD eksiksiz) |
| **MC8** Yeniden şekillenme | Ertelendi (K13) | — | — | — |

Tahmin: MC1 1, MC2 2, MC3 2–3, MC4 2, MC5 2–3, MC6 1, MC7 1 prompt.

## 5. Kapsam dışı ve bağımlılıklar

- Kutsal ayna ve Hızır'ın ayna parçası: Serüven sahne katmanı (`harita/belgeler/SAHNE-ON-INCELEME.md`) ve yoldaş işi
  (`harita/belgeler/SERUVEN-AYRIM.md`) gelince bağlanır. MC5 yalnız "yan sınıf açık mı" koşulunun girişini bırakır.
- Ek paket alt sınıflarının yuva katkısı (K10), yeniden şekillenme (K13).
- Para adları (Sikke/Akçe/Mangır): ayrı küçük iş, çoklu sınıftan sonra.
- Riskler: büyü yeteneği kullanımlarının kaçının yapım yolundan geçtiği doğrulanmadı (MC3'ün en riskli kalemi); eski
  uygulama sürümünün yeni karakter kaydını yanlış okuması (sürüm 4 işaretler, okuma tarafında koruma yok).
