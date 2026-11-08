# Kuyruk K67 — Loş ışık (PLAN)

Dal `wip/k67` (`wip/k66` 6499aea üzerinden, kural sürümü 50). Yalnızca plan; kod, veri ve test değişmedi.

## 1. Bugün

**Işık modeli tek kümedir:** `litHexes(state): Set<string>` (`src/battle/maprules.ts` 514).
- Bir altıgen ya aydınlık (kümede) ya ışıksızdır; "loş" kavramı yok.
- Kümeye girenler:
  - harita kuralındaki ışıklar (`darkness`/`night` kuralının `lights` + `lightRadiusHexes`; ışıklar tek kuralda yazılır);
  - ışık veren zemin (`e` kristal, `tileLightRadiusHexes`) ve sönmemiş mangallar (`brazierLights`);
  - yaratık üstündeki süren etkinin `light` yarıçapı;
  - ışıklı alanlar (`zone.light`; yürüyen alanda bağlı yaratığın yarıçapı + ışık);
  - nesneye bağlı ışık (`map.objects[].light`; taşınıyorsa taşıyanın yerinde).
- Sonra büyülü karanlık altıgenleri (`magicDarkHexes`: alan kuralında `dark`) kümeden silinir.
- Sürüm blokları:
  - Büyü ışıkları Görev B4'ten.
  - Nesne ışığı ve Darkness'ın ≤2. seviye ışığı kaldırması (`dispelLight: 2`) A7'de (sürüm 36).
  - Daylight'ın Darkness'ı kaldırması (`dispels`).

**Işıksızlık nerede anlam taşır:** yalnızca haritada `darkness` kuralı varsa ya da `night` kuralı + Game Master anahtarı `nightVision` açıkken (`darkRule`). Gündüz haritasında her yer aydınlık sayılır.

**Kullananlar:**
- **Görüş** (`canSee`):
  - Hedefin gövdesinin bir altıgeni aydınlıksa görülür.
  - Blindsight/Truesight (`senseSees`), Gaze of Two Minds, Mislead ikizi.
  - Karanlık görüş menzili (sürüm 17+ yaratığın kendi değeri, `darkvisionOf`): büyülü karanlıkta yalnızca Devil's Sight; menzil dışında `unlitSightHexes`.
  - Feral Senses 6 altıgen.
- **Saldırı** (`mapAttackSources`): görülemeyen hedef seçilemez (`unseenTargetsUntargetable`) ya da dezavantajlı; görülmeyen saldıran avantajlı.
- **Gizlenme** (`stealth.ts`):
  - Gece kuralında (`nightStealth`) ışıksız altıgendeki hedefe karşı karanlık görüşü olmayanın pasif Algısı `passivePerceptionPenalty` kadar düşer; Gizlen avantajlı (`hideAdvantage`).
  - Hafif örtülü alan (sürüm 41, Web/Sleet Storm `obscured: 'light'`) pasif −5 (`data/s2-kurallar.json` `hafifOrtu.passivePenalty`).
  - Gizlenme yerleri haritanın `hide` alanında.
- **Diğer:**
  - One with Shadows "loş ışıkta ya da karanlıkta" (`spells.ts` 470; bugün yalnızca ışıksızlık).
  - Boon of Dimensional Travel / Merge with Shadows (`boons.ts`).
  - Celestial, Turn Undead ve canavar yetenekleri (`monsterAbilities.ts`: Sunlight Sensitivity yalnızca karanlıkta etkisiz; Daylight alanı `sunlight` → `divine.ts` 307 saldırı dezavantajı).
  - Arayüzde karartma (`mapView.ts` `mapMarks`: yalnızca `darkness` kuralında ışıksız altıgen koyu).

**Büyüler bugün** (`BUYU-DURUM.md` ve verideki `light` yarıçapı, altıgen):

| Büyü | SRD ışığı | Bugün | Durum |
|---|---|---|---|
| Light | 20 ft parlak + 20 ft loş | yaratık taşır, 4 altıgen aydınlık | çalışır, loş yok |
| Dancing Lights | 4 ışık × 10 ft loş (ya da birleşik biçim) | tek nokta, 2 altıgen aydınlık, bonus eylemle taşınır | çalışır, 4 ışık/biçim/loş yok |
| Faerie Fire | işaretli yaratık/nesne 10 ft loş | 2 altıgen aydınlık; avantaj ve görünmezlik iptali çalışır | çalışır, loş yok |
| Continual Flame | 20 ft parlak + 20 ft loş | yaratık taşır, 4 altıgen aydınlık | çalışır, loş yok |
| Daylight | 60 ft küre parlak + 60 ft loş, güneş ışığı | alan 60 ft (`light: 0`), ek 60 ft yok; Darkness ≤3'ü kaldırır | **kısmen** |
| Darkness | 15 ft küre büyülü karanlık | yoğun örtü, karanlık görüş göremez, ≤2 ışık büyüsü kalkar | çalışır |
| Darkvision (büyü) | 150 ft karanlık görüş | `darkvision` etkisi | çalışır |
| Hallow | Darkness / Daylight ek etkisi | savaş dışı (`offCombat`), K64b'de yalnız koruma alanı | yalnız metin |

**Verideki diğer ışıklar** (hepsi tek yarıçap, "aydınlık"):
- Flaming Sphere 4, Starry Wisp 2, Fire Shield 2, Sacred Weapon 8.
- Wall of Fire 2: ⚠ SRD 5.2.1 metninde ışık yok.
- Conjure Celestial 2: SRD "Bright Light fills the Cylinder".
- Moonbeam'in "Dim Light fills the Cylinder" kısmı yok.

## 2. SRD 5.2.1 metinleri (aynen)

**Vision and Light** (s. 11):
> "An area might be Lightly or Heavily Obscured. In a Lightly Obscured area—such as an area with Dim Light, patchy fog, or moderate foliage—you have Disadvantage on Wisdom (Perception) checks that rely on sight.
> A Heavily Obscured area—such as an area with Darkness, heavy fog, or dense foliage—is opaque. You have the Blinded condition (see "Rules Glossary") when trying to see something there."
>
> "Bright Light. Bright Light lets most creatures see normally. Even gloomy days provide Bright Light, as do torches, lanterns, fires, and other sources of illumination within a specific radius.
> Dim Light. Dim Light, also called shadows, creates a Lightly Obscured area. An area of Dim Light is usually a boundary between Bright Light and surrounding Darkness. The soft light of twilight and dawn also counts as Dim Light. A full moon might bathe the land in Dim Light.
> Darkness. Darkness creates a Heavily Obscured area. Characters face Darkness outdoors at night (even most moonlit nights), within the confines of an unlit dungeon, or in an area of magical Darkness."

**Rules Glossary:**
> **Darkvision.** "If you have Darkvision, you can see in Dim Light within a specified range as if it were Bright Light and in Darkness within that range as if it were Dim Light. You discern colors in that Darkness only as shades of gray."
>
> **Blindsight.** "If you have Blindsight, you can see within a specific range without relying on physical sight. Within that range, you can see anything that isn't behind Total Cover even if you have the Blinded condition or are in Darkness. Moreover, in that range, you can see something that has the Invisible condition."
>
> **Hide [Action].** "…you must succeed on a DC 15 Dexterity (Stealth) check while you're Heavily Obscured or behind Three-Quarters Cover or Total Cover, and you must be out of any enemy's line of sight…"
>
> **Devil's Sight** (Eldritch Invocation). "You can see normally in Dim Light and Darkness—both magical and nonmagical—within 120 feet of yourself."

**Büyüler:**
> **Light:** "…the object sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. … Covering the object with something opaque blocks the light. The spell ends if you cast it again."
>
> **Dancing Lights:** "You create up to four torch-size lights within range… Alternatively, you combine the four lights into one glowing Medium form that is vaguely humanlike. Whichever form you choose, each light sheds Dim Light in a 10-foot radius. As a Bonus Action, you can move the lights up to 60 feet to a space within range. A light must be within 20 feet of another light created by this spell, and a light vanishes if it exceeds the spell's range."
>
> **Faerie Fire:** "For the duration, objects and affected creatures shed Dim Light in a 10-foot radius and can't benefit from the Invisible condition. Attack rolls against an affected creature or object have Advantage if the attacker can see it."
>
> **Continual Flame:** "The effect casts Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. … The flame can be covered or hidden but not smothered or quenched."
>
> **Daylight:** "…sunlight spreads from a point within range and fills a 60-foot-radius Sphere. The sunlight's area is Bright Light and sheds Dim Light for an additional 60 feet. … If any of this spell's area overlaps with an area of Darkness created by a spell of level 3 or lower, that other spell is dispelled."
>
> **Darkness:** "…magical Darkness spreads from a point within range and fills a 15-foot-radius Sphere. Darkvision can't see through it, and nonmagical light can't illuminate it. … If any of this spell's area overlaps with an area of Bright Light or Dim Light created by a spell of level 2 or lower, that other spell is dispelled."
>
> **Hallow (ek etkiler):** "Darkness. Darkness fills the area. Normal light, as well as magical light created by spells of a level lower than this spell, can't illuminate the area. Daylight. Bright light fills the area. Magical Darkness created by spells of a level lower than this spell can't extinguish the light."

**Yorum gerektiren yerler (⚠):**
- ⚠ **Gece:** "even most moonlit nights" karanlık; dolunay "might" loş. Gece haritasının ortam ışığı (karanlık mı, loş mu) metinde kesin değil.
- ⚠ **Darkness içindeki büyülü ışık:** yalnızca "nonmagical light can't illuminate it" ve ≤2. seviye ışık büyüsü kalkar diyor. 3+ seviye büyülü ışığın (Fire Shield, Daylight dışı) Darkness içinde ne yaptığı açık değil; Hallow ise "level lower than this spell" der.
- ⚠ **Hide ve loş ışık:** Hide yoğun örtü ister; loş ışık (hafif örtü) Hide'a izin vermez. Bizim harita gizlenme yerleri modeli SRD'den zaten ayrı.
- ⚠ **"Disadvantage on Perception checks that rely on sight":** pasif Algıya karşılığı −5 (SRD genel kuralı; mevcut `hafifOrtu.passivePenalty`).
- ⚠ **Darkvision karanlıkta "as if Dim Light":** karanlık görüşlü de karanlıkta Algıda dezavantajlıdır. Bugünkü gece kuralında karanlık görüşlüye ceza yok.
- ⚠ **Wall of Fire:** verideki ışık SRD 5.2.1 metninde yok.
- ⚠ **Light / Continual Flame:** SRD nesneye yapılır; bizde yaratık taşır (A7 kararı, nesneye bağlı ışık da var).

## 3. Önerilen model

- **Seviye:** altıgen başına `'bright' | 'dim' | 'dark'`. Tek giriş `lightLevels(state): Map<string, 'bright' | 'dim'>`; kümede olmayan = karanlık.
  - `litHexes` sürüm 51+'da "bright ya da dim" kümesini döner. Eski çağıranlar "görülebilir ışık" anlamını korur.
  - Yeni çağıranlar seviyeye bakar.
- **Ortam ışığı:**
  - `darkness` kuralı ve (`nightVision` açık) gece haritası: karanlık.
  - Gündüz: her yer parlak; seviye hesabı yapılmaz, bugünkü gibi.
  - Harita kuralına isteğe bağlı `ambient: 'dim'` (ay ışığı, alacakaranlık) eklenebilir; veride, varsayılan yok.
- **Kaynak:** `{ at, bright, dim }` (altıgen). `dim` = ek loş halka (SRD "additional").
  - Veri: büyü ışıklarında yeni `k67` bloğu `light: { bright, dim }` (sayı biçimi eski sürümde aynen).
  - Harita kuralında isteğe bağlı `dimRadiusHexes`; meşale/mangal SRD 20 + 20 ft.
  - Kristal zemin `light.dimHexes`.
- **Yarıçap:** ft / 5, aşağı yuvarlanır.

  | Kaynak | Parlak (altıgen) | Loş (altıgen) |
  |---|---|---|
  | Light, Continual Flame, Produce Flame, Flaming Sphere | 4 | +4 |
  | Daylight | alan (12) | +12 |
  | Dancing Lights (her biri), Faerie Fire, Starry Wisp | 0 | 2 |
  | Fire Shield, Flame Blade | 2 | +2 |
  | Moonbeam | — | silindir altıgenleri |

- **Üst üste binme:** en parlak kazanır (bright > dim > dark). Büyülü karanlık altıgenlerinde (Darkness) hiçbir ışık yok (bugünkü kural). Darkness ≤2 ışık büyüsünü kaldırır, Daylight ≤3 Darkness'ı kaldırır (var).
- **Hareketli ışık:**
  - Taşıyıcı yaratık ve nesne `litHexes`'teki gibi her hesapta yeniden okunur; ışık durumdan türetilir, olay gerekmez.
  - Dancing Lights dört ayrı nokta (alan `center` + `points`) ya da birleşik biçim: K67b.
- **Önbellek:** `lightLevels` aynı durum nesnesi için bir kez (WeakMap, durum değişmeden hesap tekrarlanmaz). Bugün `litHexes` bir yapay zekâ kararında onlarca kez çağrılıyor (ölçüm §8).

## 4. Etkiler (sürüm 51+)

| Durum | Gözcü karanlık görüşsüz | Gözcü karanlık görüşlü (menzilde) | Devil's Sight (120 ft) |
|---|---|---|---|
| Parlak | normal | normal | normal |
| Loş | görür; görmeye dayalı Algı dezavantajlı (pasif −5) | parlak gibi (ceza yok) | normal |
| Karanlık | görmez (yoğun örtü, bugünkü `canSee`) | görür; Algı dezavantajlı (loş gibi) | normal |
| Büyülü karanlık | görmez | görmez (bugünkü gibi) | normal |

- **Algı:** pasif Algı (`passivePerception`) ve aktif Algı/Ara (Search) hedefin altıgenindeki seviyeye göre −5 / dezavantaj. Mevcut `lightlyObscured` (Web) ile aynı satır; ikisi birikmez.
- **Saldırı:** loş ışık saldırıyı etkilemez (SRD). Karanlık ve büyülü karanlık bugünkü `darkRule` yoluyla.
- **Gizlenme:** Gizlen'in yer kuralı değişmez. Loşta gözcünün pasif Algısı −5 olduğu için gizlenmek kolaylaşır. Gece `hideAdvantage` aynen.
- **Faerie Fire:** avantaj ve görünmezlik iptali bugünkü gibi; ışığı loş (2 altıgen). Görünmez yaratığı görünür kılan `revealed` aynen.
- **Darkvision:** loşta parlak, karanlıkta loş (Algı cezası; görüş var).
- **Loş ya da karanlık şartı olan özellikler:** One with Shadows, Merge with Shadows ve Gloom Stalker benzeri özellikler artık loşta da (bugün yalnızca ışıksız). Sunlight Sensitivity Daylight'ın parlak alanında (bugün alan); loş halkasında değil (⚠ güneş ışığı sayılır mı: §11).
- **Blindsight/Truesight:** değişmez (ışıktan bağımsız).

## 5. Yeniden kullanılacaklar

- `litHexes` kaynak toplama:
  - zemin ışıkları, mangal, süren etki, alan, nesne ışığı ve taşıyıcı;
  - `magicDarkHexes`, `dispelLight`, `dispels`.
- `canSee` (Blindsight/Truesight, Devil's Sight, karanlık görüş menzili), `darkRule`, `nightStealth`.
- Hafif örtü: `lightlyObscured` + `s2-kurallar.json` `hafifOrtu.passivePenalty`; Algı dezavantajı yolu (`checkMode`).
- Faerie Fire: `outlined`, `revealed`/`seeInvisible` (`sightConditions`).
- Daylight `sunlight` alanı (Sunlight Sensitivity), Hallow koruma alanı (K64b `SpellZone.ward`).
- Alan sürümlü kuralı (`zone.spec`), sürüm blokları (`mechanicsAt`, `LATER`, `buyu-durum.mjs` BLOCKS).
- Arayüz:
  - `mapMarks` karartma;
  - alan seçicisi ve önizleme (`areaActPreview`);
  - yürüyen alan taşıma (`summon_move`/`spell_followup`, Dancing Lights).

## 6. Sürüm ve kayıt

- Yeni yollar yalnızca sürüm **51+** (`k67` blokları, `lightLevels`'ın loş halkası, Algı cezası, karanlık görüşün karanlıkta loş sayması). 50 ve altında `litHexes` bugünkü küme, aynı davranış.
- Işık durumdan türetilir: yeni olay türü yok, `SAVE_VERSION` 22.
- Dancing Lights'ın dört noktası alan alanında saklanır (`zone_created` / `zone_moved`); yeni olay yok.
- `ruleVersion.test.ts` ve `g6.test.ts` güncel sürüm 50 → 51 (veriye bağlı, gerekçe commit'te).

## 7. Arayüz (TR/EN)

- **Çizim:** `darkness` kuralında ve `nightVision` açık gece haritasında karanlık koyu (bugünkü), loş yarı koyu katman (aynı `mapMarks`, yeni `dim` kümesi).
- **Bilgi kutusu:** altıgen bilgisinde "Parlak / Loş / Karanlık" ve "Loş: Algı dezavantajlı".
- **Büyü önizlemesi:** ışık büyüsünde (Light, Daylight, Dancing Lights) parlak ve loş halkalar; Darkness'ta kaldıracağı ışıklar; Daylight'ta kaldıracağı Darkness.
- **Gizlen önizlemesi** (`stealthView`): "loş: gözcü Algısı −5".
- Metinler `strings.tr2.ts` / `strings.en.ts`.

## 8. Yapay zekâ

- **Bugün:**
  - Yapay zekâ ışık büyüsü yapmaz.
  - Darkness/Fog Cloud/Silence'ı `zoneSpell` "görüş/örtü alanı" diye dışlar.
  - Gizlenmeyi kullanmaz ("Bilinen eksikler").
  - Karanlıkta görülemeyen hedefi seçemez; `canSee` aday üretiminde ve önizlemede.
- **K67 önerisi (küçük):**
  - Değişen `canSee` ve Algı cezası kuru çalıştırmayla kendiliğinden puana girer.
  - Basit kural `k67:isik`: karanlıkta görmeyen dostlar varsa ve büyücüde ışık büyüsü varsa (Light/Daylight) eylemi boşken bir kez.
  - Darkness'ı yapay zekânın kullanması (görmeyen düşmana karşı) ayrı karar (§11).
- **Ölçüm** (bu dalda, 31×17 Mantar Mağarası `darkness`, 8 yaratık, `chooseCommand` 10 tekrar ortalaması):
  - `litHexes` tek çağrı 0,29 ms.
  - `chooseCommand` ışıksız 18,6 ms, iki ışık etkisiyle 11,6 ms. Aynı sahne `darkness` kapalıyken 3,2–10,1 ms.
  - Fark, kararda `litHexes`'in onlarca kez yeniden hesaplanmasından (≈ 0,3 ms × 20–35 çağrı).
- **Tahmin:** loş halka kaynak başına ikinci bir yarıçap ekler (≈ 1,3× `litHexes`). Durum başına önbellekle karar süresi bugünkünden düşük kalmalı (hedef: karanlık haritada ≤ bugünkü 18,6 ms).

## 9. Parçalama

- **K67a — model ve kurallar (orta-büyük, risk orta):**
  - `lightLevels` + önbellek, kaynakların `bright/dim` verisi (`k67` blokları, harita `dimRadiusHexes`).
  - `canSee`/Algı/karanlık görüş/Devil's Sight.
  - One with Shadows / Merge with Shadows, Faerie Fire loşu, Light, Continual Flame, Daylight ek 60 ft loş.
  - Arayüz çizimi ve bilgi kutusu, sürüm 51, testler.
  - Dokunduğu yerler: `maprules.ts`, `stealth.ts`, `boons.ts`, `spells.ts`, `mapView.ts`, büyü verisi.
- **K67b — hareketli ve çoklu ışıklar (orta, risk düşük-orta):**
  - Dancing Lights dört ışık + birleşik biçim (yerleştirme, 20 ft kuralı, bonus eylemle taşıma; ortak alan seçicisi).
  - Moonbeam loşu, Starry Wisp/Fire Shield/Flame Blade loş halkaları.
  - Sunlight Sensitivity'nin Daylight loşu (karara göre).
  - Yapay zekâ `k67:isik`, karar süresi ölçümü.
- **Ayrı / sonraya:**
  - Hallow'un Darkness/Daylight ek etkileri (savaş dışı; kurulum alanına bağlanabilir, K64b `setupWard` yolu).
  - Gece ortam ışığı (`ambient`) varsayılanı (karar §11-2).

## 10. Riskler

- **Görüş önbellekleri:**
  - `litHexes` bugün önbelleksiz; yeni WeakMap önbelleği durum nesnesine bağlı olmalı.
  - Reducer her olayda yeni nesne verdiği için bayat değer kalmaz. Yerinde değişen alt nesne varsa (görülmedi) risk.
  - `lightLevels` sürüm 50'de çağrılmaz.
- **Mevcut testler:**
  - Darkness, karanlık görüş, gece gizlenmesi, Faerie Fire, Daylight, Sunlight Sensitivity, One with Shadows ve sürüm/replay uyumu (`k59uyum`).
  - Işık/görüş kelimelerini içeren 17 test dosyası var. Sürüm 50 ve altında değişmeden geçmeli; yeni davranış yalnızca 51 testlerinde.
- **Karanlık görüşün karanlıkta Algı cezası:** gece haritalarında gizlenme oranını değiştirir (denge). Yalnızca sürüm 51; `DENGE.md`'ye not, ölçüm "Dungeondex öncesi tam test turu"na.
- **Performans:** loş halka ×1,3; önbelleksiz kalırsa karanlık haritada karar süresi artar.
- **Veri:** sayı biçimli `light` alanını okuyan her yer (`litHexes`, `zoneLight`, nesne ışığı, Sacred Weapon) iki biçimi de okumalı.

## 11. Karar bekleyen maddeler

1. **Seviye modeli:** üç seviye (parlak/loş/karanlık), altıgen başına, en parlak kazanır. Öneri: evet.
   - Artı: SRD'nin doğrudan karşılığı; mevcut kümeyle uyumlu.
   - Eksi: kaynak verisinin iki yarıçapa geçmesi gerekir.
   - Alternatif "loş yalnız işaret" (kaynak bazında loş bayrağı): daha az veri, ama üst üste binme karışır.
2. **Gece ortam ışığı:** karanlık mı, loş mu? Öneri: `darkness` ve (nightVision açık) gece karanlık, haritaya isteğe bağlı `ambient: 'dim'`; varsayılan yok.
   - Artı: SRD "most moonlit nights" karanlık; mevcut gece haritaları aynı kalır.
   - Eksi: dolunay sahnesi için veri gerekir.
   - Alternatif: bütün gece haritaları loş. Sinematik ama SRD'ye ters. ⚠
3. **Karanlık görüşlüye karanlıkta Algı cezası:** öneri evet (SRD).
   - Artı: SRD "Darkness as if Dim Light".
   - Eksi: bugünkü gece gizlenme dengesi değişir (karanlık görüşlü gözcü −5).
   - Alternatif: ceza yok (bugünkü). ⚠ SRD'den sapma.
4. **Loş ışık ve Gizlen:** Gizlen'in yer kuralı aynen kalır, loş yalnızca gözcü Algısını düşürür. Öneri: evet.
   - Artı: mevcut harita gizlenme yerleri bozulmaz.
   - Eksi: SRD loşta Gizlen'e izin vermez; bizde yer kuralı zaten SRD'den ayrı. ⚠
   - Alternatif: SRD Hide (yalnız yoğun örtü ya da 3/4 siper). Büyük değişiklik, ayrı görev.
5. **Darkness içinde büyülü ışık:** büyülü karanlık altıgeni her ışığa kapalı (bugünkü). Öneri: evet.
   - Artı: basit, bugünkü davranış.
   - Eksi: Fire Shield (4. seviye) gibi 3+ ışık SRD'de belki aydınlatır. ⚠ Metin yalnızca "nonmagical light can't illuminate" der.
   - Alternatif: Darkness'tan yüksek seviyeli büyülü ışık aydınlatır.
6. **Daylight'ın loş halkası "güneş ışığı" mı:** Sunlight Sensitivity yalnızca parlak alanda. Öneri: evet.
   - Artı: "The sunlight's area is Bright Light" (alan güneş).
   - Eksi: "sheds Dim Light" halkası da güneş ışığı sayılabilir. ⚠
7. **Dancing Lights biçimi:** dört ayrı ışık (her biri 2 altıgen loş) + birleşik tek biçim seçeneği; taşıma tek bonus eylemle hepsi. Öneri: evet (K67b).
   - Artı: SRD iki seçeneği de.
   - Eksi: dört noktalı yerleştirme ve taşıma arayüzü (ortak alan seçicisi, K57 çok nokta) ve 20 ft bağlılık denetimi.
   - Alternatif: tek nokta (bugünkü) + loş.
8. **Light / Continual Flame hedefi:** bugünkü gibi yaratık taşır ya da nesneye. Öneri: değiştirme.
   - Artı: A7 kararı, oyunda pratik.
   - Eksi: SRD nesneye yapılır ("isn't being worn or carried by someone else"). ⚠
9. **Algı cezası biçimi:** pasif −5, aktif dezavantaj; hafif örtü (Web) ile birikmez. Öneri: evet.
   - Artı: tek satır, SRD genel kuralı.
   - Alternatif: birikir (−10). SRD'de dezavantaj birikmez.
10. **Wall of Fire ışığı:** SRD 5.2.1 metninde yok; sürüm 51'de kaldır. Öneri: kaldır. ⚠ Verideki değer kaynaksız.
    - Alternatif: tut (görsel tutarlılık).
11. **Moonbeam ve diğer metin ışıkları** (Moonbeam loş silindir, Prismatic Wall, Symbol, Tiny Hut, Sunbeam, Shining Smite): öneri: Moonbeam, Starry Wisp, Fire Shield, Flame Blade, Shining Smite K67b'de veriyle; Prismatic Wall, Symbol, Tiny Hut savaş dışı ya da ayrı.
12. **Hallow ışık etkileri:** K67 dışı (savaş dışı büyü; kurulum alanı K64b yoluyla sonra). Öneri: ayrı madde.
13. **Yapay zekâ:** ışık büyüsü kuralı `k67:isik` (görmeyen dost varken bir kez). Darkness'ı saldırı amaçlı kullanma yok. Öneri: evet.
    - Artı: küçük, ölçülebilir.
    - Eksi: Darkness'ın taktik kullanımı (görmeyen düşmana karşı) dışarıda kalır.
14. **Arayüz karartması:** gece haritasında yalnızca `nightVision` açıkken. Öneri: evet.
    - Artı: bugünkü gece görünümü bozulmaz.
    - Eksi: nightVision kapalı gece haritasında loş halkalar görünmez.
15. **Parçalama:** K67a (model, kurallar, temel büyüler, çizim) + K67b (Dancing Lights, ek büyüler, YZ). Öneri: evet.

## 12. Test planı

**K67a:**
- Seviye haritası: Light 4 + 4, Daylight 12 + 12, en parlak kazanır.
- Darkness içinde ışık yok; Darkness ≤2 ışığı, Daylight ≤3 Darkness'ı kaldırır (mevcut testler aynen).
- Görüş ve Algı:
  - Loşta karanlık görüşsüz gözcünün pasif Algısı −5; karanlık görüşlüde ceza yok.
  - Karanlıkta karanlık görüşlüde −5 ve görür; Devil's Sight cezasız.
  - Web ile loş birikmez.
- Faerie Fire 2 altıgen loş, avantaj aynen; One with Shadows loşta açılır.
- Arayüz: `mapMarks` loş kümesi.
- Sürüm 50: `litHexes` bugünkü küme, gizlenme ve görüş testleri aynen. Replay her komutta.

**K67b:**
- Dancing Lights dört nokta ve birleşik biçim, 20 ft bağlılık, taşıma, menzil dışında sönme.
- Moonbeam loş, Fire Shield / Flame Blade halkaları.
- Yapay zekâ `k67:isik`; karar süresi ölçümü (karanlık harita, 8 yaratık).
