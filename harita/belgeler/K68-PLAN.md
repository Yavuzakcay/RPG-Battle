# Kuyruk K68 — Dikey geometri: silindir yüksekliği, tavan ve K66 kalanları (PLAN)

Dal `wip/k68` (`wip/k67` 8c30b59 üzerinden, kural sürümü 51). Bu belge yalnızca plandır; kod, veri ve test değişmedi. Görev 0 tabanı ve ölçümler §9'da.

Kapsam:
- **G6 Grup 2** (`BUYU-ERTELENEN.md` §2: silindir yüksekliği ve tavan modeli yok): `call-lightning`, `sleet-storm`, `fog-cloud`, `stinking-cloud`, `jump`, `spider-climb`.
- **K66'dan kalan dikey işler** (DECISIONS.md K66a/K66b "Açık kalanlar"):
  - çok katlı yapı ve yapı yüksekliği verisi (şimdi sabit tablo);
  - enkaz altındaki uçan yaratığın uçarak hareket etmesi ve Freedom of Movement'ın hız 0'ı yok sayması;
  - Levitate'i biten yaratığın yarığa süzülerek inmesi;
  - yarığa zorla itme (Thunderwave vb.).
- **Üstüne kurulacak altyapı:**
  - S2 irtifası (`altitudeFt`, `vertical_move`, `reachFt`, `zoneTopFt`, `areaReachesAltitude`);
  - Kuyruk 26 yükseklik katmanı (`heights`, `heightMove`/`heightSight`);
  - K9c dikey bayrakları (`ignoresHeight`, `climbs`, `spellJumpFt`).

## 1. SRD 5.2.1 metinleri (aynen; `data/srd/spells.json` ve Rules Glossary)

### 1.1 Büyüler

**Call Lightning** (3. seviye, 120 ft, Concentration 10 dk, s. 114):
> A storm cloud appears at a point within range that you can see above yourself. It takes the shape of a Cylinder that is 10 feet tall with a 60-foot radius.
> When you cast the spell, choose a point you can see under the cloud. A lightning bolt shoots from the cloud to that point. Each creature within 5 feet of that point makes a Dexterity saving throw, taking 3d10 Lightning damage on a failed save or half as much damage on a successful one. Until the spell ends, you can take a Magic action to call down lightning in that way again, targeting the same point or a different one. If you're outdoors in a storm when you cast this spell, the spell gives you control over that storm instead of creating a new one. Under such conditions, the spell's damage increases by 1d10.

- ⚠ Bulutun yüksekliği (zeminden kaç ft yukarıda) yazmıyor; yalnızca "menzil içinde, büyücünün üstünde görülebilen bir nokta".
- ⚠ Şimşek noktası "bulutun altında görülebilen bir nokta": havada (uçan yaratığın yanında) olabilir mi, açık değil.
- ⚠ İç mekân yasağı yok. Silindirin sığmadığı alçak tavanlı yerde ne olacağı yazmıyor; "outdoors in a storm" yalnızca fırtına ekini koşullar.
- ⚠ Bulut büyücüyle yürümez (metinde taşıma yok).

**Sleet Storm** (3. seviye, 150 ft, Concentration 1 dk, s. 163):
> Until the spell ends, sleet falls in a 40-foot-tall, 20-foot-radius Cylinder centered on a point you choose within range. The area is Heavily Obscured, and exposed flames in the area are doused.
> Ground in the Cylinder is Difficult Terrain. When a creature enters the Cylinder for the first time on a turn or starts its turn there, it must succeed on a Dexterity saving throw or have the Prone condition and lose Concentration.

- ⚠ Uçan yaratık için "Prone" düşmeye yol açar (Flying kuralı); metin bunu ayrıca söylemiyor.
- ⚠ "Ground … is Difficult Terrain" yalnız zemindekini etkiler; yoğun örtü bütün silindirde.

**Fog Cloud** (1. seviye, 120 ft, Concentration 1 saat, s. 133):
> You create a 20-foot-radius Sphere of fog centered on a point within range. The Sphere is Heavily Obscured. It lasts for the duration or until a strong wind (such as one created by Gust of Wind) disperses it.
> *(Using a Higher-Level Spell Slot:* yarıçap slot başına +20 ft; veride `upcast.radiusFt: 20`.)

- ⚠ Kürenin merkezi havada bir nokta olabilir; zemine değen kürede tepe = yarıçap.

**Stinking Cloud** (3. seviye, 90 ft, Concentration 1 dk, s. 165):
> You create a 20-foot-radius Sphere of yellow, nauseating gas centered on a point within range. The cloud is Heavily Obscured. The cloud lingers in the air for the duration or until a strong wind (such as the one created by Gust of Wind) disperses it. Each creature that starts its turn in the Sphere must succeed on a Constitution saving throw or have the Poisoned condition until the end of the current turn. While Poisoned in this way, the creature can't take an action or a Bonus Action.

**Jump** (1. seviye, dokunma, 1 dk, bonus eylem, s. 143):
> You touch a willing creature. Once on each of its turns until the spell ends, that creature can jump up to 30 feet by spending 10 feet of movement.

- ⚠ "up to 30 feet" yatay mı dikey mi belirsiz. A8 kararıyla her ikisi: katmanlı haritada dikey zıplama zaten var.
- ⚠ Havadaki yayın yüksekliği, atlanan altıgenlerin zemin etkileri ve fırsat saldırısı yazmıyor.

**Spider Climb** (2. seviye, dokunma, Concentration 1 saat, s. 164):
> Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces and along ceilings, while leaving its hands free. The target also gains a Climb Speed equal to its Speed.

### 1.2 İlgili kurallar (Rules Glossary)

- **Falling [Hazard]:** "A creature that falls takes 1d6 Bludgeoning damage at the end of the fall for every 10 feet it fell, to a maximum of 20d6. When the creature lands, it has the Prone condition unless it avoids taking any damage from the fall. A creature that falls into water or another liquid can use its Reaction to make a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check to hit the surface head or feet first. On a successful check, any damage resulting from the fall is halved."
- **Climbing:** "While you're climbing, each foot of movement costs 1 extra foot (2 extra feet in Difficult Terrain). You ignore this extra cost if you have a Climb Speed and use it to climb. At the GM's option, climbing a slippery surface or one with few handholds might require a successful DC 15 Strength (Athletics) check."
- **Climb Speed:** "A Climb Speed can be used in place of Speed to traverse a vertical surface without expending the extra movement normally associated with climbing."
- **Flying:** "A variety of effects allow a creature to fly. While flying, you fall if you have the Incapacitated or Prone condition or your Fly Speed is reduced to 0. You can stay aloft in those circumstances if you can hover."
- **Fly Speed:** "A Fly Speed can be used to travel through the air. While you have a Fly Speed, you can stay aloft until you land, fall, or die."
- **Hover:** "Some creatures can hover, as noted in their stat blocks, and some spells and other effects grant the ability to hover. Hovering while flying prevents you from falling in certain circumstances."
- **Speed (Changes to Your Speeds):** "if your Speed is reduced to 0 and you have a Climb Speed, your Climb Speed is also reduced to 0. Similarly, if your Speed is halved and you have a Fly Speed, your Fly Speed is also halved."
- **High Jump:** "you leap into the air a number of feet equal to 3 plus your Strength modifier (minimum of 0 feet) if you move at least 10 feet on foot immediately before the jump. When you make a standing High Jump, you can jump only half that distance. Either way, each foot of the jump costs a foot of movement. You can extend your arms half your height above yourself during the jump. Thus, you can reach a distance equal to the height of the jump plus 1½ times your height."
- **Long Jump:** "you leap horizontally a number of feet up to your Strength score if you move at least 10 feet immediately before the jump. When you make a standing Long Jump, you can leap only half that distance. Either way, each foot you jump costs a foot of movement. If you land in Difficult Terrain, you must succeed on a DC 10 Dexterity (Acrobatics) check or have the Prone condition. This Long Jump rule assumes that the height of the jump doesn't matter, such as a jump across a stream or chasm. At your GM's option, you must succeed on a DC 10 Strength (Athletics) check to clear a low obstacle (no taller than a quarter of the jump's distance), such as a hedge or low wall. Otherwise, you hit the obstacle."
- **Cover:** "Half Cover (+2 bonus to AC and Dexterity saving throws), Three-Quarters Cover (+5 bonus to AC and Dexterity saving throws), and Total Cover (can't be targeted directly). If behind more than one degree of cover, a target benefits only from the most protective degree." Combat bölümü: "A target can benefit from cover only when an attack or other effect originates on the opposite side of the cover."
- **Area of Effect:** "If all straight lines extending from the point of origin to a location in the area of effect are blocked, that location isn't included in the area of effect. To block a line, an obstruction must provide Total Cover."
- **Cylinder:** "extends in straight lines from a point of origin located at the center of the circular top or bottom of the Cylinder. The effect that creates a Cylinder specifies the radius of the Cylinder's base and the Cylinder's height. A Cylinder's point of origin is included in the area of effect."
- **Sphere:** "extends in straight lines from a point of origin outward in all directions. … A Sphere's point of origin is included in the Sphere's area of effect."
- **Obscured Areas:** "In a Lightly Obscured area … you have Disadvantage on Wisdom (Perception) checks that rely on sight. A Heavily Obscured area—such as an area with Darkness, heavy fog, or dense foliage—is opaque. You have the Blinded condition when trying to see something there."
- **Earthquake (yapılar; K66b):** "A creature within a distance from a collapsing structure equal to half the structure's height makes a Dexterity saving throw … buried in the rubble, requiring a DC 20 Strength (Athletics) check as an action to escape."
- **Levitate (son cümle):** "When the spell ends, the target floats gently to the ground if it is still aloft." **Fly:** "When the spell ends, the target falls if it is still aloft unless it can stop the fall."
- **Freedom of Movement:** "spells and other magical effects can neither reduce the target's Speed nor cause the target to have the Paralyzed or Restrained conditions … the target can spend 5 feet of movement to automatically escape from nonmagical restraints, such as manacles or a creature imposing the Grappled condition on it."

**SRD'nin söylemediği ya da yoruma açık yerler:**
- ⚠ **Üç boyutlu uzaklık:** SRD 5.2.1 ızgarada dikey uzaklığın nasıl sayılacağını tanımlamaz. Bugün kodda yatay uzaklıkla dikey farkın büyüğü kullanılıyor.
- ⚠ **Tavan:** tavan yüksekliği ve "iç mekân" kavramı yoktur.
- ⚠ **Duvar yüksekliği:** duvarların ve engellerin yüksekliği tanımlı değildir.
- ⚠ **"Structure":** tanımsızdır (K66b: sabit tablo).
- ⚠ **Enkaz:** büyülü etki mi, büyüsüz kısıtlama mı? Freedom of Movement açısından belirsiz.
- ⚠ **Zorla hareketle tehlikeye girme:** zorla hareketle uçuruma ya da yarığa düşmede save yazmaz. Yalnız Earthquake'in kendi yarık açılışı save verir.

## 2. Bugünkü kodun durumu

### 2.1 İrtifa altyapısı (`src/battle/altitude.ts`, S2, sürüm 41)

- **Savaşçı irtifası:** `Combatant.altitudeFt` (yoksa 0); nesnede de var (Levitate).
- **Erişim ve menzil:** `reachFt(state, a, b, flatFt)` = max(yatay, |Δirtifa|). Kullanıldığı yerler:
  - `range.ts:81` `checkReach`: yakın dövüş, menzilli saldırı ve hedefli büyü menzili;
  - `range.ts:40` `enemyAdjacent`: menzilli saldırıda "yanında düşman" dezavantajı (dikey farkı 5 ft'ten büyük olan bitişik sayılmaz).
  - **Noktaya yapılan alan büyülerinin menzili irtifasız:** `spells.ts:1287` ve `:1332` düz `distance`.
- **Alan tepesi:** `zoneTopFt(z, spec)`:
  - `spec.heightFt` (yalnız Moonbeam 40);
  - yer alanı ve yüzey 0;
  - diğerleri `data/s2-kurallar.json` `irtifa.defaultZoneTopFt` = 20.
  - Kullanan: `altitudeInZone` → `zones.ts:78` (alan üyeliği), `:332`, `:650` (döküm tetiği).
- **Alan büyüsünün ulaştığı irtifa:** `areaReachesAltitude(state, area, c)` (`spells.ts:193`):
  - `area.heightFt` varsa o;
  - çizgi 5 ft;
  - diğerleri `sizeFt`. Küre ve silindir için yarıçap tepe sayılıyor. Hiçbir büyünün `area`sında `heightFt` yok.
- **Dikey hareket:** `vertical_move` (`executeVerticalMove`):
  - uçan kendi hareketinden öder;
  - Levitate'i yapan turda 20 ft;
  - üst sınır `irtifa.maxFt` = 120. Tavan yok.
- **Düşüş (komut sonu):** havada tutan biterse (Fly bitti, Prone, Incapacitated, hız 0) SRD düşme. Levitate bitince `altitude_changed` 0 (süzülerek).
- **Eksi irtifa (K66a, sürüm 50):**
  - yarıkta `altitudeFt < 0`;
  - yürüme reddi (`movement.ts:147`);
  - itilmez (`motion.ts:168`);
  - tırmanma `executeFissureClimb`;
  - komut sonu kancası `fissure.ts:364`: yarık dışındaki eksi irtifa sıfırlanır, yarık üstünde 0'a inen uçmayan düşer.

### 2.2 Görüş hattı ve siper (`src/battle/cover.ts`)

- `lineOfFire` / `coverFrom` / `sightBlockedBetween` iki boyutludur: altıgen hattı ve iki yan, `blocksSight` zemin ve yükseklik katmanı sırtı (`heightSightBlock`). **İrtifa kullanılmıyor:**
  - 40 ft'teki uçan yaratık 10 ft'lik bir kayanın arkasındakini de göremez;
  - Fog Cloud'un 20 ft tepesinin üstündeki yaratık bulutun içinden bakıyor sayılır.
- Yoğun örtü alanları (`obscured: 'heavy'`) görüşü altıgen bazında keser (CILA: "aradaki yoğun örtü iki tarafı görünmez yapar"). Alanın tepesi hesaba katılmaz.

### 2.3 Yükseklik katmanı (Kuyruk 26, `heights.ts`, `climb.ts`)

- 9 haritada `heights` var: buzul ×4, dağ ×4, `kale-taht-salonu`. Seviye × `levelFt` (10 ft).
- Kurallar:
  - `heightMove`: tırmanma komutu `climb`, Atletizm `climbDc` 12;
  - `heightFall`;
  - `heightCombat`: yüksek zemin, kenar siperi;
  - `heightSight`: sırt görüşü keser;
  - `heightShow`.
- Katman seviyesi ile `altitudeFt` ayrı. İrtifa "zeminin üstünde" tanımlı, katman seviyesine eklenmez:
  - `reachFt` iki yaratığın katman farkını görmez;
  - `heightCombat` irtifayı görmez.
  - ⚠ İki sistem aynı yerde birleşmiyor; aşağıda karar 4.

### 2.4 Tavan ve iç mekân verisi

- **Tavan verisi yok.** Harita JSON'unda ve `data/` içinde `tavan`, `ceiling` ya da `indoor` alanı yok. "İç mekân" yalnız varyant kimliği: `taverna` `ic-mekan`, `kale-taht-salonu` `ic-mekan`.
- `environmentId: yeralt-ma-ara` olan haritalar fiilen kapalı:
  - `dungeon`, `magara`, `magara-genis`, `kasaba-lagim`, `yeralti-nehri`;
  - `derinlikler-magara-karakol`, `-mezar-labirenti`, `-mantar-magarasi`;
  - `hapishane-hucre-platformu`, `hapishane-mudur-kulesi`.
- Adı ve görseli kapalı olanlar: `orman-heykel-magarasi`, `derinlikler-lav-salonu`, `isinlanma-salonu`, `lav-tapinagi`, `volkanik-demirhane`, `taverna`, `kale-taht-salonu`.
- Karışık (avlu + bina): `kasaba-han`, `kasaba-demirci-tapinak`, `hapishane-dis-halka`, `hapishane-iskele`.

### 2.5 Büyülerin bugünkü verisi

| Büyü | Bugün | Eksik |
|---|---|---|
| Call Lightning | `a6`: tekrar `repeat.point` (noktaya), fırtına eki; şimşek 5 ft küre (`area` küre 5 ft) → `areaReachesAltitude` 5 ft'e dek | Bulut yok (nokta büyücünün menzilinde, 60 ft yarıçap ve "bulutun altında" yok); havadaki nokta yok; iç mekân sınırı yok |
| Sleet Storm | Alan küre 20 ft; `zone` yoğun örtü, zorlu, `douses`, DEX save Prone + konsantrasyon | Silindir 40 ft yerine varsayılan tepe 20 ft |
| Fog Cloud | Alan küre 20 ft, yoğun örtü; upcast `radiusFt: 20` | Tepe her zaman 20 ft (yukarı slotta yarıçap 40, 60… ama tepe 20); bulutun üstünden görüş yok |
| Stinking Cloud | Alan küre 20 ft, yüzey `poison` (gaz: tepe 20) | Bulutun üstünden görüş yok |
| Jump | Etki `jumpFt: 30`: turda bir 30 ft düz atlama 10 ft harcar, aradaki **tek** engel altıgeninin üstünden; A8: katmanlı haritada komşu yüksek altıgene dikey zıplama | Uçurum/yarık (`u`) "engel" sayılıyor: 2 altıgenlik yarık atlanamaz, büyüsüz Long Jump hiç atlayamaz. Havadaki yay ve atlanan altıgenlerin zemin etkileri tanımsız |
| Spider Climb | Etki `climb: true` → `climbs()`: yükseklik katmanı maliyetini kaldırır | Duvar/tavanda durma yok (irtifaya çıkamaz); tavan modeli yok |

### 2.6 K66 kalanlarının kod durumu (bu planda ölçüldü)

- **Yarığa zorla itme: çift düşme hatası.** `forced.ts:85` `pushOutcome` `u` zeminini "uçurum" sayıyor (`CHASM_FEET` 30 ft, 3d6, irtifa 0). Ardından `fissure.ts:364` komut sonu kancası yarık üstünde 0 irtifadaki uçmayanı yarığa düşürüyor (derinlik kadar).
  - Deneme (10 ft yarık, itme): itmede 300 → 288 HP, komut sonunda ikinci düşme (1d6), irtifa −10.
  - Toplam 30 ft + 10 ft hasar; doğrusu tek düşme ve yarığın derinliği kadar.
- **Levitate biten yarığın üstünde.** `altitude.ts` Levitate'i süzülerek 0'a indiriyor. Aynı komut sonunda yarık kancası 0'daki uçmayanı **hasarla** yarığa düşürüyor. SRD "floats gently to the ground".
- **Enkaz altı (`buried:`):**
  - Etkide `speedZero`. `reduce.ts:48` `speedHexes`: `effectSpeedZero(c) && fly === 0 && !free` → uçuş hızı olan ve Freedom of Movement'lı (`freeMove`) yaratık enkaz altında hareket edebiliyor.
  - `escapeCheck` DC 20 var; Freedom of Movement'ın "5 ft harcayarak kurtulma" yolu (`grapple.ts:61`) enkaza bağlı değil.
- **Yapı yüksekliği:** `quake.ts` `Structure.heightFt`, veride sabit tablo (kapı 10, kafes kapısı 15, çadır 10, çatlak duvar 10, panel 10; `heightsFt`). Harita nesnesinde yükseklik alanı yok. Çok katlı yapı yok. Harita duvar harfleri yapı değil.

### 2.7 Atlama ve tırmanma

- `movement.ts` `executeJump`:
  - aradaki `blocked` altıgen sayılır (`u` dahil);
  - büyüsüz atlama hiç engel geçemez, Jump büyüsü bir tane;
  - menzil `jumpRangeFeet` (STR, koşu);
  - iniş boş ve geçilebilir olmalı;
  - ara altıgenlerin zemin etkileri zaten tetiklenmiyor (yalnız iniş `landingSlide`).
- Levitate tutunma (`movement.ts:233`): Levitate'li uçmayan yaratık yalnız duvara bitişikken çift maliyetle ilerler; tavan sayılmaz.

## 3. Önerilen model

### 3.1 Tavan (`tavanFt`)

- **Veri:** harita varyantında isteğe bağlı `tavanFt` (sayı, ft). Yoksa açık gök: üst sınır bugünkü `irtifa.maxFt` 120.
  - Harita JSON'unda ve `scripts/k68-tavan.py` ile; K67b'deki gibi üreticilerden sonra çalışan, idempotent betik.
  - Değer tablosu (öneri, ⚠ SRD sayı vermez; karar 2): §3.1.1.
- **Etkisi (sürüm 52+):**
  - **İrtifa üst sınırı:** `tavanFt − 5` (Medium bir yaratığın başı tavana değer; Large+ için boy tablosu `token-sizes.json`'dan ⚠ karar 3). `vertical_move`, Levitate yükselmesi, Fly ve Jump'ın dikey zıplaması buna kırpılır.
  - **Levitate tutunması:** tavana değen (irtifa = üst sınır) Levitate'li yaratık her yerde "yüzeye bitişik" sayılır (bugün yalnız duvar).
  - **Spider Climb:** tavanda yürüme ve durma (§3.5).
  - **Call Lightning:** bulut sığmazsa yapılamaz (karar 7).
  - **Alanlar:** silindir/kürenin tepesi tavanla kırpılır (yalnız gösterim ve `zoneTopFt`; tavanın üstünde yaratık olamayacağından mekanik fark yok).
- **Karışık haritalar** (avlu + bina): K68'de tavansız (açık) sayılır. Altıgen başına tavan ızgarası sığmaz (§8).

#### 3.1.1 Önerilen tavan değerleri (⚠ hepsi tasarım değeri)

| Harita | Kimlik | `tavanFt` |
|---|---|---|
| Zindan (3 varyant) | `dungeon` | 15 |
| Mağara, Mağara (orta) | `magara`, `magara-genis` | 20 |
| Kasaba Lağımı | `kasaba-lagim` | 10 |
| Su Altı Geçidi | `yeralti-nehri` | 20 |
| Mağara Karakolu, Mezar Labirenti, Mantar Mağarası | `derinlikler-*` | 20 / 15 / 30 |
| Lav Salonu | `derinlikler-lav-salonu` | 30 |
| Heykel Mağarası | `orman-heykel-magarasi` | 20 |
| Hücre Platformu, Müdür Kulesi | `hapishane-hucre-platformu`, `hapishane-mudur-kulesi` | 20 / 15 |
| Taverna, Taht Salonu | `taverna`, `kale-taht-salonu` | 12 / 30 |
| Portal Salonu, Lav Tapınağı, Volkanik Demirhane | `isinlanma-salonu`, `lav-tapinagi`, `volkanik-demirhane` | 30 / 30 / 25 |

Toplam 17 harita (varyantlarıyla). Kalanlar açık gök.

### 3.2 Uzaklık ve görüş (irtifalı)

- **Erişim ve menzil:** `reachFt` = max(yatay, dikey) kalır (karar 4). Noktaya yapılan alan büyülerinde nokta zeminde (irtifa 0) kalır; havadaki nokta yalnız Call Lightning'de (karar 8).
- **Yükseklik katmanı ile irtifa:** K68'de birleştirilmez (karar 4). Katmanlı 9 harita tavansız ve açık alan; sorun yalnız `kale-taht-salonu`nda (kürsü 1 seviye), etkisi küçük.
- **Görüş hattı (K68c):** yoğun örtü alanının (sis, bulut, sulu kar) altıgeni görüş hattını yalnızca hattın o altıgendeki yüksekliği alanın tepesinden alçaksa keser.
  - Hat yüksekliği iki ucun irtifası arasında doğrusal: `h(i) = a + (b − a) · i / n`.
  - Duvar ve `blocksSight` zemin tavana kadar (ya da açık alanda sonsuz) sayılır. Uçan yaratık duvarın üstünden görmez ve geçmez (bugünkü gibi; karar 10).
- **Hızlı yol:** hattaki her iki uç 0 irtifadaysa bugünkü kod aynen; yeni hesap yalnız irtifalı bir uç varsa (yapay zekâ süresi riski küçük).

### 3.3 Silindir ve küre yüksekliği

- **Sleet Storm:** `k68` bloğunda alan `heightFt: 40`. Uçan yaratık 40 ft'in altında yoğun örtü ve DEX save'e uğrar. Başarısızsa Prone, uçan ve süzülemeyen düşer (mevcut komut sonu düşüşü). Zorlu arazi yalnız zemin (bugün `difficult` zaten yürüyen için).
- **Fog Cloud, Stinking Cloud:** küre zemine merkezli (nokta irtifası 0). Tepe = yarıçap, upcast dahil (`heightFt` yerine `zoneTopFt` yarıçaptan: Fog Cloud 3. seviye slotta 60 ft).
  - Yaratık tepenin üstündeyse alanda değil (save yok, görür).
  - Bulutun üstünden görüş: §3.2.
- **Moonbeam:** değişmez (40 ft, S2).
- **Call Lightning:** bulut + şimşek (§3.4).

### 3.4 Call Lightning

- **Bulut:** dökümde büyücünün altıgeninin üstünde sabit bir silindir. Alan kaydı (`SpellZone`):
  - merkez = döküm altıgeni;
  - yarıçap 60 ft = 12 altıgen;
  - `cloudFt` = bulutun tabanı (karar 6);
  - görsel yok, yalnız sınır çizgisi.
- **Şimşek:**
  - Noktası bulutun altında: yatayda bulut merkezinden 12 altıgen içinde **ve** büyü menzilinde (120 ft). Bugün yalnız büyü menzili.
  - Yaratık seçilirse nokta o yaratığın irtifasında (karar 8). 5 ft içindekiler (yatay ≤ 1 altıgen ve dikey ≤ 5 ft) save atar.
- **İç mekân:** `tavanFt` varsa ve tavan − büyücünün boyu < 10 ft ise yapılamaz (karar 7). Başarı iletisi: "Call Lightning: bulut için tavan alçak (12 ft)".
- **Fırtına eki** (`a6.stormBonus`) aynen.

### 3.5 Spider Climb ve tırmanma hızı

- **Kim:** tırmanma hızı olanlar (`climbs()`: Spider Climb, `climber` özelliği, Roving, Acrobatic Movement) (karar 9).
- **Duvarda:** "dikey yüzey" = engel altıgenine (`movement: 'blocked'`, `u` hariç) ya da harita kenarına bitişik altıgen. Tırmanan `vertical_move` ile irtifa kazanır:
  - tırmanma hızıyla ek maliyetsiz (5 ft = 1 altıgen);
  - üst sınır tavan ya da duvar yüksekliği (açık alanda veri yok: karar 10; öneri: açık alanda duvar boyu `irtifa.wallFt` = 20).
- **Tavanda:** tavanlı haritada irtifası tavan − boy olan tırmanıcı her altıgende durabilir ve yatay yürüyebilir (tavanda yürüme).
- **Düşmeme:** `staysUp` tırmanıcıya genişler. Duvara bitişik ya da tavana değen tırmanıcı havada kalır.
  - Büyü biterse ya da Prone/Incapacitated/hız 0 olursa düşer (SRD Falling).
  - SRD "Speed reduced to 0 → Climb Speed 0".
- **Yürüme:** duvarda (irtifa > 0) yalnız duvara bitişik altıgenlere yürür, tavanda her yere.
- **Erişim:** `reachFt` max kuralı. 15 ft tavandaki tırmanıcıya yerden 5 ft erişimle vurulmaz, menzilli saldırı ve büyü olur.
- **Zemin etkisi:** irtifadaki tırmanıcı zemin alanlarından (Spike Growth, yüzeyler) etkilenmez (`altitudeInZone` zaten).
- **"Eller serbest":** savaş dışı (değişmez).

### 3.6 Jump ve Long Jump

- **Uçurum ve yarık:** atlamada `u` altıgeni engel değil "boşluk" sayılır (SRD Long Jump: "across a stream or chasm"). Büyüsüz atlama STR menziliyle 2 altıgenlik yarığı geçebilir. Jump büyüsü 30 ft (6 altıgen).
- **Havadaki yay:**
  - ara altıgenlerin zemin etkileri tetiklenmez (bugün de öyle);
  - fırsat saldırısı yatay erişimle (bugünkü gibi, ⚠ karar 14);
  - atlanan altıgende düşman varsa üstünden atlanamaz (bugünkü gibi; ⚠ SRD yazmaz).
- **Dikey zıplama:**
  - Katmanlı haritada A8 aynen.
  - Katmansız haritada Jump'ın dikey kolu: turda bir kez irtifa kazanmak yok (yaratık havada kalamaz).
  - Yalnız **yüksek erişim:** Jump etkisindeki yaratık aynı turda zıplayarak yakın dövüşte erişimine +⌊jump yüksekliği⌋ ekler (karar 13; ⚠ SRD High Jump "extend your arms").

### 3.7 K66 kalanları

- **Yarığa zorla itme** (karar 15):
  - `pushOutcome` yarık altıgeninde (`fissureAt`) yeni sonuç türü yerine `fall` türü, `fallFeet` = yarık derinliği;
  - iniş irtifası −derinlik (`altitude_changed`);
  - komut sonu kancası artık ikinci kez düşürmez (irtifa < 0);
  - save yok (SRD zorla hareket); Slow Fall / Feather Fall tepkileri aynen;
  - itme yarığın içinde durur (eksi irtifadaki itilmez: K66a).
  - Sürüm 52 kapısı. 50–51'de çift düşme aynen (replay; ⚠ hata korunur, karar 15).
- **Levitate biten yarık üstünde** (karar 16): süzülerek yarık dibine iner (`altitude_changed` −derinlik, hasarsız, Prone yok). Yarık kancası bunu düşme saymaz.
- **Enkaz altı** (karar 17): enkaz etkisi her hızı 0'lar (uçuş dahil). Enkazdan kurtulma: `escapeCheck` DC 20 (değişmez) ya da Freedom of Movement'lı yaratık 5 ft harcayarak kendiliğinden kurtulur ("nonmagical restraints").
- **Yapı yüksekliği** (karar 18):
  - `data/nesneler.json` türe göre `yukseklikFt` (K66b tablosu oraya taşınır);
  - harita nesnesinde isteğe bağlı `yukseklikFt` ezmesi;
  - çökme yarıçapı ondan (yarı yükseklik).
  - Çok katlı bina ve harita duvar harfleri yapı değil (§8).

### 3.8 Yapay zekâ

- **Yeni davranış:** yalnız "tırmanıcı yakın dövüşçüden kaçar" basit kuralı (karar 20): Spider Climb'lı büyücü yakın dövüşçüye bitişikse ve tavan/duvar varsa yukarı çıkar.
- **Bunun dışında:** mevcut kurallar irtifayı `checkReach` üzerinden zaten doğru okur. Uçan yaratıkların dikey taktiği yok.
- **Call Lightning:** `zoneSpell`/`areaSpell` yolu bulutun altındaki noktaları aday alır (bulut merkezi döküm yeri).

## 4. Kural sürümü ve kayıt

- **Tek sürüm 52** (K68a/b/c aynı sürüm; K66a/b gibi). 51 ve altı birebir. Bu, yarığa itmede çift düşme hatasının eski kayıtlarda kalması demek (karar 15).
- **Veri:**
  - büyülerde `k68` bloğu (`mechanicsAt`, `castSpell` `LATER`, `buyu-durum.mjs` BLOCKS);
  - harita varyantında `tavanFt`;
  - `data/nesneler.json` `yukseklikFt`;
  - `data/s2-kurallar.json` `irtifa.wallFt`.
- **Yeni olay türü yok:** `altitude_changed`, `zone_created`, `effect_ended` yeterli. `SAVE_VERSION` 22.
- **Komutlar:**
  - `vertical_move` tırmanıcıya açılır (yeni alan yok);
  - Call Lightning şimşek noktası için `spell_followup.targetId` (yaratık) zaten var; irtifa yaratıktan okunur.

## 5. Arayüz (TR/EN)

- **Tavan:** altıgen bilgisinde "tavan 15 ft" (tavanlı haritada) ve irtifa düğmelerinin üst sınırı.
- **Spider Climb:** eylem menüsünde "Duvara tırman" / "İn" (`vertical_move`, bugünkü uçuş düğmeleriyle aynı yer), jeton rozeti ↑ irtifa (var).
- **Call Lightning:**
  - döküm balonunda bulut sınırı (12 altıgen) ve "bulutun altında" geçerli noktalar vurgulu;
  - iç mekânda "tavan alçak" nedeni;
  - tekrar seçicisinde yaratık seçilince irtifası.
- **Alan balonu:** sis/bulutta "tepe 20 ft" bilgisi; uçan hedefin alanda olmadığı listede ayrı ("tepenin üstünde").
- **Ekran görüntüsü:** her alt kuyrukta arayüz değişirse bir tane.

## 6. Numaralı karar maddeleri

1. **Tavan verisi biçimi:** varyantta tek sayı `tavanFt` mı, altıgen ızgarası mı?
   - **Öneri:** varyantta tek sayı; ızgara sonraya.
   - **Artı:** 17 haritaya tek satır, betikle; motor basit.
   - **Eksi:** karışık haritalar (han, demirci, hapishane dış halka, iskele) tavansız kalır.
   - ⚠ SRD'de tavan kavramı yok.
2. **Tavan değerleri:** §3.1.1 tablosu.
   - **Öneri:** tablodaki değerler (oda 12–15, mağara 20, salon 30).
   - **Artı:** iç mekânda uçuş/Levitate/Spider Climb anlamlı sınır kazanır.
   - **Eksi:** değerler tasarım tahmini; harita görselleriyle doğrulanmalı.
   - ⚠ Görseller tavan yüksekliği göstermez.
3. **Yaratık boyu:** irtifa üst sınırı tavan − boy.
   - **Öneri:** Tiny/Small/Medium 5 ft, Large 10, Huge 15, Gargantuan 20 (`token-sizes.json` boyutundan).
   - **Artı:** büyük yaratık alçak tavanda uçamaz.
   - **Eksi:** boy SRD'de alan boyutu, yükseklik değil.
   - ⚠ SRD yaratık yüksekliği vermez.
4. **Üç boyutlu uzaklık ve katman birleşimi:** `reachFt` = max(yatay, dikey) kalsın mı; yükseklik katmanı seviyesi irtifaya eklensin mi?
   - **Öneri:** max kalsın; katman K68'de birleşmesin.
   - **Artı:** kod değişmez, replay güvenli; katmanlı haritalar açık alan.
   - **Eksi:** katmanlı haritada kürsüdeki ile uçan arasındaki erişim yaklaşık.
   - ⚠ SRD 3B uzaklık yok.
5. **Silindir/küre yüksekliği:** Sleet Storm 40 ft; Fog/Stinking Cloud tepe = yarıçap (upcast dahil); küre zemine merkezli.
   - **Öneri:** evet.
   - **Artı:** SRD sayıları; yalnız veri ve `zoneTopFt`.
   - **Eksi:** havada merkezli küre yok (§8).
   - ⚠ SRD kürenin merkezini havada da sayar.
6. **Call Lightning bulutunun yeri ve yüksekliği:**
   - **Öneri:** döküm altıgeninin üstünde sabit (büyücüyle yürümez). Taban açık havada 30 ft, tavanlı yerde tavan − 10 ft.
   - **Artı:** "bulutun altında" koşulu tek merkezle; SRD "appears at a point … above yourself".
   - **Eksi:** büyücü buluttan uzaklaşınca şimşek alanı kayar gibi görünmez (doğru davranış ama oyuncuya yeni).
   - ⚠ SRD yükseklik vermez.
7. **Call Lightning iç mekânda:**
   - **Öneri:** tavan − büyücü boyu < 10 ft ise yapılamaz; değilse yapılır.
   - **Artı:** 10 ft silindir sığmalı; zindanda (15 ft) yapılır, lağımda (10 ft) yapılamaz.
   - **Eksi:** SRD yasak koymaz; oyuncu şaşırabilir.
   - ⚠ yorum.
8. **Şimşek noktası irtifası:**
   - **Öneri:** yaratık seçilirse onun irtifasında nokta (uçan vurulur); altıgen seçilirse zemin.
   - **Artı:** "a point you can see under the cloud" havadaki noktaya da uyar; uçan düşmana anlamlı.
   - **Eksi:** zemindekiler ve uçan aynı şimşekte birlikte vurulmaz (5 ft küre).
   - ⚠ SRD açık değil.
9. **Duvara tırmanabilenler:**
   - **Öneri:** yalnız tırmanma hızı olanlar (Spider Climb, `climber`, Roving, Acrobatic Movement).
   - **Artı:** herkes duvara çıkarsa irtifa her savaşa yayılır, YZ ve denge riski.
   - **Eksi:** SRD Climbing herkese çift maliyetle tırmanma verir (ve GM DC 15).
   - ⚠ SRD'den daralma.
10. **Duvar yüksekliği ve duvar üstü:**
    - **Öneri:** iç mekânda duvar tavana kadar; açık alanda `irtifa.wallFt` 20 ft (tırmanma sınırı). Uçan yaratık duvarın üstünden geçmez ve görmez (bugünkü gibi).
    - **Artı:** harita verisinde duvar boyu yok; geçiş modeli büyük iş.
    - **Eksi:** açık alanda uçan 40 ft'te alçak duvarı aşamaz (SRD'ye aykırı görünür).
    - ⚠ SRD duvar boyu vermez.
11. **Spider Climb tavanda yürüme ve düşme:**
    - **Öneri:** tavanlı haritada tavana değen tırmanıcı her altıgende yürür ve durur; büyü biter ya da Prone/Incapacitated/hız 0 olursa düşer.
    - **Artı:** SRD metni ve Flying/Falling ile uyumlu.
    - **Eksi:** yerdeki yakın dövüşçü vuramaz; büyücü için güçlü savunma.
    - ⚠ Tırmanırken Prone olma SRD'de açık değil.
12. **Levitate tavana itinerek:**
    - **Öneri:** tavana değen Levitate'li her yerde tutunur (çift maliyet, S2).
    - **Artı:** SRD "pushing or pulling against … a ceiling".
    - **Eksi:** yok.
13. **Jump yüksek erişim:**
    - **Öneri:** Jump etkisindeki yaratık aynı turda zıplayarak yakın dövüş erişimine dikeyde +zıplama yüksekliği (en çok 30 ft, katmansız haritada) kullanır; havada kalmaz.
    - **Artı:** uçan düşmana zıplayıp vurmak (SRD High Jump "reach").
    - **Eksi:** yeni erişim kuralı; saldırı komutuna "zıplayarak" seçimi gerekir.
    - **Alternatif:** yapma (Jump yalnız yatay + katman).
    - ⚠ SRD Jump büyüsü yüksekliği ayrıca yazmaz.
14. **Atlamada fırsat saldırısı ve düşman üstünden atlama:**
    - **Öneri:** bugünkü gibi (ara altıgende düşman varsa atlanamaz; fırsat saldırısı yatay erişimle).
    - **Artı:** değişiklik yok.
    - **Eksi:** havadaki yay mekanik olarak "yer" sayılmaz.
    - ⚠ SRD yazmaz.
15. **Yarığa zorla itme ve sürüm:**
    - **Öneri:** sürüm 52'de tek düşme (derinlik kadar), eksi irtifa, save yok; 50–51'deki çift düşme hatası eski kayıtlarda kalır.
    - **Artı:** replay bozulmaz.
    - **Eksi:** sürüm 50–51 savaşlarında hata sürer.
    - **Alternatif:** bütün sürümlerde düzelt (eski kayıt farklı oynar).
    - ⚠ SRD zorla hareketle tehlikeye düşmede save vermez.
16. **Levitate biten yarığın üstünde:**
    - **Öneri:** süzülerek dibe, hasarsız, Prone yok.
    - **Artı:** SRD "floats gently to the ground".
    - **Eksi:** yok.
17. **Enkaz altı ve Freedom of Movement:**
    - **Öneri:** enkaz her hızı 0'lar (uçuş dahil). Freedom of Movement enkazı "nonmagical restraint" sayar: 5 ft harcayarak kendiliğinden kurtulur.
    - **Artı:** enkazdaki uçan artık kaçmaz; FoM'un yazılı yolu.
    - **Eksi:** enkaz büyüyle (Earthquake) oluşur; "magical effect" de sayılabilir.
    - ⚠ yorum.
18. **Yapı yüksekliği verisi:**
    - **Öneri:** `data/nesneler.json` türe göre `yukseklikFt` + harita nesnesinde isteğe bağlı ezme; çok katlı yapı yok.
    - **Artı:** K66b tablosu veriye taşınır; harita tasarımcısı tek nesneyi büyütebilir.
    - **Eksi:** binalar (çok altıgen) yine yapı değil.
19. **Görüş hattında irtifa (K68c):**
    - **Öneri:** yalnız yoğun örtü alanlarının tepesi (hattın yüksekliği doğrusal). Duvarlar tavana/sonsuza kadar.
    - **Artı:** sisin/bulutun üstünden bakma çalışır; maliyet yalnız irtifalı uçta.
    - **Eksi:** duvar üstünden görüş yok (karar 10).
    - ⚠ yorum.
20. **Yapay zekâ:**
    - **Öneri:** tek yeni basit kural `k68:tirman` (tırmanıcı büyücü, bitişik yakın dövüşçüden kaçmak için tavana/duvara çıkar). Call Lightning bulut altı nokta seçimi.
    - **Artı:** küçük; karar süresi etkisi az.
    - **Eksi:** uçan ve tırmanan düşmanların tam dikey taktiği yok.
21. **Kural sürümü:**
    - **Öneri:** tek sürüm 52 (K68a/b/c).
    - **Artı:** sürüm sayısı az, belgeler sade.
    - **Eksi:** K68b/c ayrı yayımlanırsa 52'nin içeriği parça parça büyür (K66'daki gibi kabul edilmişti).

## 7. İş bölümü önerisi

| Parça | İçerik | Sürüm | Risk |
|---|---|---|---|
| **K68a** | K66 kalanları: yarığa itme tek düşme (karar 15), Levitate yarığa süzülme (16), enkaz her hızı 0'lar + FoM (17), yapı yüksekliği verisi (18); Sleet Storm 40 ft ve sis/bulut tepesi yarıçap (5); atlamada uçurum/yarık boşluk (§3.6 ilk madde) | 52 | Düşük. Motor dokunuşu küçük ve yerel (`forced.ts`, `altitude.ts`, `quake.ts`, `reduce.ts` `speedHexes`, `movement.ts` atlama, veri). Arayüz değişmez (ekran görüntüsü yok). |
| **K68b** | Tavan modeli (`tavanFt` verisi + betik, irtifa üst sınırı, Levitate tavana tutunma) (1–3, 12); Spider Climb duvar/tavan (9–11); Call Lightning bulut, iç mekân, irtifalı nokta (6–8); Jump yüksek erişim (13, isteğe bağlı); arayüz (tavan bilgisi, tırman düğmeleri, bulut sınırı); YZ `k68:tirman` | 52 | Orta. `staysUp` ve yürüme maliyeti (duvar/tavanda yürüme) ortak motor; yapay zekâ yürüme yollarını etkileyebilir. Hızlı regresyon 3–4 senaryo. |
| **K68c** | Görüş hattında irtifa: yoğun örtü alanının tepesi (19); arayüz alan balonunda "tepenin üstünde" | 52 | Orta–yüksek: `lineOfFire` sıcak yol (YZ her adayda çağırır). Hızlı yol iki uç 0 irtifadayken bugünkü kod; ölçüm şart. |

- **Ana parça:**
  - 374 543 bayt, sınır 420 kB (≈ 45 kB pay).
  - Yeni motor kodu tembel savaş parçasında (`manualDice` ≈ 1,26 MB) ve `MapBattle`.
  - Ana parçaya yalnız harita JSON'u girer: haritalar ana parçada (`src/map/maps.ts` `MAP_FILES` `import.meta.glob` `eager`; doğrulandı). `tavanFt` satırı 17 × ~16 bayt ≈ 0,3 kB. `data/nesneler.json` `yukseklikFt` birkaç satır. Beklenen artış < 1 kB.
- **Yapay zekâ karar süresi:**
  - Taban ~2 ms (K67c: Mantar Mağarası 31×17, karanlık, 8 yaratık; sürüm 51 2,1 / 1,7 ms).
  - Risk K68c'de (görüş hattı). Hedef +%30 içinde.
  - K68b'de duvar/tavan yürüme maliyeti `moveCostFn` içine girer. Tırmanıcı olmayanlar için tek bayrak denetimi.

## 8. Bu kuyruğa sığmayacaklar

- **Çok katlı binalar:**
  - binanın katları, iki katın aynı anda çizimi ve depremde katların çöküşü;
  - harita duvar harfleri ve binalar yapı sayılmaz (canları yok).
- **Altıgen başına tavan ızgarası:** karışık iç/dış haritalar (`kasaba-han`, `kasaba-demirci-tapinak`, `hapishane-dis-halka`, `hapishane-iskele`).
- **Genel 3B engel modeli:**
  - duvar ve engel yüksekliğine göre uçan yaratığın duvar üstünden geçmesi ve görmesi;
  - kenar siperinin irtifayla değişmesi.
- **Havada merkezli küre/silindir:** Fog Cloud ya da Fireball noktasını havaya koymak.
- **Herkes için tırmanma:** SRD Climbing kuralıyla duvara tırmanma (çift maliyet, DC 15).
- **Yükseklik katmanı ile irtifanın tek eksende birleşmesi** (karar 4).
- **Uçan ve tırmanan düşmanların tam dikey taktiği:** irtifa seçimi, yerdekinden kaçma, dalış.
- **Jump havadaki yayında uçan hedefe saldırı** (karar 13 alternatifi dışında).
- **Call Lightning "outdoors in a storm" fırtına kontrolü:** bugünkü `stormBonus` dışında hava olayına bağlanma.

## 9. Görev 0 tabanı ve ölçümler

- **Tam test paketi** (`wip/k68`, 8c30b59): 331 dosya / 3768 test geçti.
- **Ana parça:** 374 543 bayt (K67c build).
- **Yapay zekâ karar süresi** (K67c, Mantar Mağarası 31×17, karanlık, 8 yaratık, ısınma + 20 tekrar):
  - sürüm 51 ışıksız / iki ışık 2,1 / 1,7 ms;
  - ışık büyücüsü kural açık / kapalı 3,93 / 3,85 ms.
- **Doğrulanan K66 hataları (bu plan sırasında, kod değişmeden):**
  - 10 ft yarığa itme: 30 ft "uçurum" düşmesi + komut sonunda 10 ft yarık düşmesi (iki hasar);
  - Levitate yarık üstünde bitince hasarlı düşme (kod okuması);
  - enkaz altında uçuş hızıyla hareket (`speedHexes`).
