# K73b denetimi: bitişiklik, tırmanma, düşme, su (Görev 0)

Taban `wip/k73a` 5b26c3c, kural sürümü 62. K73b (sürüm 63) dört kural boşluğunu kapatır:
- çok turlu sur tırmanışı;
- 3B bitişiklik;
- gönüllü düşme;
- suya düşme.

Ayrıca düşman tarafındaki uçan menzilliye K73a yükselme kuralını açar. Değişiklikler ve kararlar DECISIONS.md "Kuyruk K73b" girdisinde.

## 1. Bitişiklik ("5 ft içinde") kullanım yerleri

Ölçü dili:
- **2B:** yalnız yatay altıgen (`gap`, `distance`, `hexDistance`).
- **3B:** max(yatay, dikey bant aralığı) (K9 `reachFt`).

| Kural | Yer | Bugün (62) | Döşeme (K72) |
|---|---|---|---|
| Otomatik kritik (Paralyzed, Unconscious) | `common.ts` `withinFiveFt` ← `features.ts`, `monsters.ts`, `spells.ts` | 2B `hexDistance ≤ 1`; menzilli saldırıda da | bilmez |
| Prone hedefe "5 ft içinden" avantaj | `sight.ts` `proneWithin5` ← `withinFiveFt` | 2B | bilmez |
| Yakalama (Grapple) | `forced.ts` `executeGrapple` | 2B `gap === 1`; dikey denetim yok | `acrossSlab` (K72 geçici kapatma) |
| İtme (Shove) | `forced.ts` `executeShove` | 2B `gap === 1`; dikey denetim yok | `acrossSlab` (K72 geçici kapatma) |
| Yakalamanın sürmesi | `grapple.ts` `grappleEndEvents` | 2B `distance > 1` biter | bilmez |
| Fırsat saldırısı | `features.ts` `leavesReach` | 3B (K71c bant, K71d mutlak bant) | bilmez (saldırı görüş denetiminde kesilir) |
| Yakın dövüş erişimi | `range.ts` `checkReach` | 3B (`reachFt`) | görüş/siper denetiminde kesilir (ayrı neden yok) |
| Menzilliye "yanında düşman" dezavantajı | `range.ts` `enemyAdjacent` | `gap === 1` ve `reachFt ≤ 5` (yarı 3B); aynı altıgende üstteki sayılmaz | bilmez |
| Sneak Attack bitişik dost | `features.ts` `allyNextTo` | 2B `gap ≤ 1` | bilmez |
| Aura of Protection, Aura of Life, Countercharm | `auras.ts` (`auraGap`, `gap`) | 2B | bilmez |
| Ortak aura altyapısı (K53) | `auraCore.ts` `aurasOn` (`auraGap`) | 2B | bilmez |
| Aura of Life diriltme | `effects.ts` | 2B | bilmez |
| Kalıcı alanlar (bulut, yayılım) | `zones.ts`, `altitude.ts` `altitudeInZone` | altıgen + alanın dikey kapsamı | bilmez |
| Cleave ikinci hedef | `mastery.ts` `cleaveTarget` | 2B (ama erişim `checkReach` 3B) | görüşte |
| Yardım (Help), sarsma | `durations.ts` `executeHelp` | 2B `distance ≤ 1` | bilmez |
| Dokunma (Lay On Hands vb.) | `divine.ts` `touching` | 2B | bilmez |
| Pack Tactics | `features.ts`, `monsters.ts` | basitleştirme: canlı herhangi bir dost (bitişiklik yok) | — |
| Paket/imza bitişiklikleri | `paket/*`, `imza*.ts`, `possession.ts`, `celestial.ts` | 2B `gap` | bilmez |
| Tepki menzilleri (Protection 5 ft, Feather Fall 60 ft…) | `reactions.ts` `feetBetween` | 2B `gap × 5` | bilmez |
| YZ taktik bitişiklikleri | `ai.ts` (21 yer) | 2B | — |

## 2. Tırmanma durumu (K71b / K71d / K72)

- **Duvar yüzü (K71b, 57+):** `vertical_move` → `climbing.ts` `dexClimbMove`.
  - Yerden ilk yükselişte bir kez Çeviklik zarı; her 5 ft çarpan kadar altıgen.
  - Komut sonunda bitişik yüzeye tutunur (`dexClimberHolds`). Prone, Incapacitated ya da hız 0 → komut sonunda düşer.
  - **Dikey tırmanış fırsat saldırısı tetiklemez.** Uçanın dikey hareketi tetikler (K71c).
- **Uçurum (K71d, 59+):** `climb` → `climb.ts` `executeClimb59`.
  - Maliyet tek tura yetmezse **komut reddedilir**, ileti "yüzde dikey hareketle yükselip sonraki turda sürdür" der.
  - Yüz tırmanılabilir yüzey (`surfacesNear` `cliff`). Çok turlu tırmanış iki ayrı komutla mümkün (`vertical_move`, sonra `climb`).
  - YZ `climbToward` ikisini sırayla dener.
- **Sur tepesi (K72, 60+):** `climb` → `executeWallClimb`, maliyet 1 + (ft / 5) × çarpan.
  - **Tek tura sığmazsa reddedilir.** 30 ft hızla 15 ft kaba sur 7 altıgen; 25–30 ft surlar 11–13 altıgen (Dash'le de zor).
  - Elle çok turlu yol var ama dağınık: önce `vertical_move` ile yüzde yükselinir. Tepeye varınca `move` (`topStep`) ya da `climb` (kalan ft) ile tepeye geçilir; `stand` ile tırmanma işareti kalkar.
  - Arayüzde sur altıgeninin üstünde tek maliyet yazar; parçalı ilerleme gösterilmez.
- **Tırmanma hızı olanlar (K68b):** `climbMove` 5 ft = 1 altıgen.
  - Tepeye `move` ile geçer: `topStep` irtifa = tepe; `stand` olayı `climbing` işaretine bağlı.
  - Sur `climb` komutu bunlara kapalı (`climbs` → normal yürür).
- **YZ:**
  - K15 `wallClimbCommand`: duvarı aşma (yol). Sur tepesinde durmaz.
  - K73a `perchCommand`: yürüyen menzilli tek turda sığan sur tırmanışı. Yüzde tutunan menzilli için devam kuralı yok (`climbingAloft` → null).

## 3. `fall` çağrı yerleri (K71b tek işlev, 57+)

| Yer | Neden | İniş |
|---|---|---|
| `climb.ts` `executeClimb` (katman, 57–58) | aşağı atlama | zemin |
| `climb.ts` `executeClimb59` | aşağı atlama (gönüllü) | varış zemini, irtifa 0 |
| `climb.ts` `collapseFallEvents` | zemin çökmesi | katman dibi |
| `forced.ts` `forcedMoveEvents` | itme (uçurum, yarık, sur/kat kenarı) | `landAlt` / yarık dibi |
| `fissure.ts` | Earthquake yarığı | eksi derinlik |
| `altitude.ts` komut sonu | havadan/duvardan düşüş | alttaki en yüksek duruş yüzeyi (K72) |
| `telekinesis.ts` | Telekinesis bırakma | zemin |
| `quake.ts` | kat döşemesi çöküşü (K72) | alt yüzey |

- Derin suya (`deepWater`) iniş her nedende hasarsız (K71b ⚠).
- Gönüllü düşme komutu yok:
  - uçurumdan iniş = `climb` aşağı (atlama);
  - sur tepesinden yalnız tırmanarak (hasarsız);
  - kat deliğinden ve balkon kenarından inilemez;
  - duvarda tutunan "bırakamaz" (yalnız tırmanarak iner).

## 4. Su verisi

| Harf | Ad | Kural | Suya düşme (SRD "water or another liquid") |
|---|---|---|---|
| `w` | Derin su | `deepWater` (derin su sınırı, ağır zırhla batma, su altı savaşı `isUnderwater`) | **evet** |
| `n` | Sığ su, çamur | yok (zorlu arazi) | hayır: düşmeyi yumuşatacak derinlik yok |
| `b` | Derin batak | `bog` (saplanma) | ⚠ veri yok: batak "sıvı" sayılmadı |
| `R` | Coşkun nehir | geçilmez (yalnız Game Master anahtarıyla) | inilemez (`landingSpot` geçilmezi atlar) |
| lav | — | ölümcül | ayrı kural |

- `data/derin-su.json`: kıyıdan uzaklık eşiği ("çok derin"). Derinlik (ft) verisi yok.
- SRD suya düşme derinlik istemez: yalnız `w` kullanılır.
- **Eksik:** batak/çamurun sıvı sayılıp sayılmayacağı; su derinliği.

## 5. K72 geçici kapatmaları

- `forced.ts` `acrossSlab`: yalnız yakalama ve itme. Döşemenin iki yanındaki iki yaratık arasında; aynı altıgen ya da bitişik.
  - Neden: K72 ölçümünde YZ alt kattan üst kattakini itmeye kalkmıştı.
- Döşemeyi kesen diğerleri: görüş (alan isabeti dahil), dikey hareket, uçuş aramasıyla düzey geçişi, Levitate, düşme iniş yüzeyi.
- Döşemeyi geçenler (K72 ⚠): aura, kalıcı alanlar, fırsat saldırısı erişim ölçüsü, otomatik kritik, Sneak Attack dostu, Help.

## 6. Çelişkiler

1. **Otomatik kritik 2B, erişim 3B:**
   - Bitişik altıgende 30 ft yukarıda süzülen Paralyzed yaratığa yerdeki okçunun isabeti otomatik kritik ("5 ft içinde").
   - 10 ft basamağın dibindeki Paralyzed yaratığa üstteki yakın dövüşçü zaten erişemez. Ölçüler ayrık.
2. **Yakalama/itme dikeyi bilmez:**
   - Yerdeki yaratık bitişik altıgende 30 ft'te uçanı yakalar ya da iter.
   - Yakalanan uçanın hızı 0 olur → komut sonunda düşer. 5 ft'lik eylem 30 ft'lik düşüş doğurur.
3. **Yakalama sürmesi 2B:** yakalayan uçan 30 ft yükselse de yakalama sürer. Taşıma modeli yok; yakalanan aşağıda kalır.
4. **Fırsat saldırısı ölçüsü döşemeyi bilmez:** üst kattaki yaratığın merdivensiz döşeme kenarındaki hareketi, alt kattakinin "erişiminden çıkar". Saldırı görüş denetiminde kesilir, olay boş döner.
5. **Aura döşemeyi ve dikeyi bilmez:**
   - Aura of Protection 60 ft yukarıdaki dosta da işler.
   - Alt kattaki Paladin üst kattakine işler.
   - SRD 5.2.1 Emanation bir alan etkisidir; tam siper (döşeme) noktaları alandan çıkarır.
6. **Kalıcı alan döşemeyi bilmez:** bulut ya da yayılım alt katta yapılırsa yüksekliği yettiği ölçüde üst kattakini de kapsar.
7. **Sneak Attack dostu 2B:** hedefin 30 ft üstünde uçan dost "bitişik" sayılır.
8. **`enemyAdjacent` aynı altıgendekini saymaz:** hemen üstündeki (5 ft) düşman menzilli saldırıya dezavantaj vermez; bitişik altıgendeki verir.
9. **Sur tırmanışı tek tur:** K72 `climb` sığmazsa reddeder.
   - Uçurumda da aynı ret var ama iletisi yolu söylüyor.
   - YZ (K73a) yalnız sığan surlara çıkar; 25–30 ft surlar yalnız uçanlara açık.
10. **Dikey tırmanışta fırsat saldırısı:** sur `climb` tetikler, `vertical_move` tetiklemez. Aynı hareket iki yolda farklı.
11. **Gönüllü düşme dağınık:** uçurumda var (`climb`), surda/katta yok.
12. **Derin suya düşme hasarsız:** SRD tepkiyle (DC 15 Atletizm/Akrobasi) yarı hasar verir; başarısızsa tam.
13. **Düşman tarafındaki uçan menzilli yükselmez** (`riseCommand` yalnız parti). Kural ve parametreler iki tarafta aynı.

## 7. Değişmeyenler (sürüm 62 ve altı)

- 62 ve altında bütün yollar birebir: yeni kurallar `k73bOn` (sürüm 63+) kapılı.
- Kayıt biçimi aynı:
  - yeni olay türü yok (`moved`, `altitude_changed`, `map_effect`, `reaction_used`);
  - yeni komut `jump_down` yalnız 63+ kabul edilir.

## 8. Ek (K73c, sürüm 64+): çok altıgenli gövdenin zemini

**Tek tanım:** çok altıgenli gövde (K69 `isMultiHex53`) farklı zeminli altıgenlere yayıldığında gövdenin zemini, ayak izinin en yüksek ayak altıdır.
- İşlevler: `vertical.ts` `bodyZeminFt`; katman seviyesinde `heights.ts` `bodyLevel` (aynı kural).
- İrtifa bu zeminden ölçülür.
- Tek altıgenlide, bayrak kapalıyken ve 63 ve altında çapanın zemini.

| Uygulama noktası | Yer | 64+ |
|---|---|---|
| Mutlak yükseklik, K9 uzaklık ve erişim | `vertical.ts` `mutlakFt`, `k9Ft`, `absBand` | `bodyZeminFt` |
| 3B bitişiklik, aura, tepki menzili | `adjacency.ts` `gap3D` (`absBand` üzerinden) | aynı tanımdan |
| Fırsat saldırısı | `features.ts` `leavesReach` (`absBand`) | aynı tanımdan |
| K8 yüksek zemin (katman) | `heights.ts` `highGroundK8` | `bodyLevel` |
| K8 yüksek zemin (duruş yüzeyi) | `cover.ts` `highGroundBase` | `bodyZeminFt` |
| YZ yüksek zemin indirimi | `ai/k73a.ts` `groundOf`, `highGroundBonus` | `bodyZeminFt` |
| Hareket maliyeti (katman adımı) | `movement.ts` `heightStepFn` → `bodyHeightStepFn` | gövde seviyesi 2+ artarsa uçurum, 1 artarsa `levelCost` |
| Yerleştirme / varış | `movement.ts` `bodyFitProblem` | döşemeyi aşan gövde (bandını döşeme kesiyor) ya da döşemede durup ayak izinin bir altıgeninde döşeme olmayan gövde reddedilir |

- Düşme: irtifa en yüksek ayaktan ölçüldüğü için iniş o ayak düzeyine (yeni kod yok).
- ⚠ Görüş/siper uçları çapadan (K69 `lineOfFire` en iyi çift aynen).
