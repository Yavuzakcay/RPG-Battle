# Kuyruk K69 — çok altıgenli yaratık (`multiHex`) denetimi

Taban: `wip/k68` 3f09722 (kural sürümü 52). Bayrak `BattleState.multiHex` (Game Master kurulumunda "deneysel" anahtar,
varsayılan kapalı; Serüven, yolculuk ve simülasyon açmaz). Kapalıyken `src/battle/body.ts` yardımcılarının hepsi tek altıgen
hesabına iner (`bodyAt` → `[pos]`, `gap` → `distance`, `covers` → `sameHex`).

Şekiller (A6, `src/rules/footprint.ts`): Large 3 (üçgen, çapa sol üst), Huge 7 (çiçek, çapa orta), Gargantuan 19 (yarıçap 2,
çapa orta). Klasik (15×7) haritada Gargantuan Huge şekli (7) alır (`multiHexMax: 'H'`, Kuyruk 43).

Durum: **var** (gövdeyi biliyor), **eksik** (yalnız çapa altıgeni; çok altıgende yanlış ya da hiç denetim yok), **hatalı**
(gövdeyi bilmesi gerekirken çapalar arası ölçü yanlış sonuç veriyor). Son sütun: K69'da ne yapılacağı (sürüm 53, yalnız bayrak
açıkken) ya da bilerek tek altıgen kalanın gerekçesi.

## 1. Yerleşim ve başlangıç

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Elle yerleştirme (Game Master, oyuncu) | `movement.ts` `executePlace` | var | Gövdenin her altıgeni geçerli ve boş. |
| Otomatik yerleşim (savaş başı) | `app/setup.ts` `createMapBattle` (`nearZone`) | var | Büyük gövdeler önce; bölgeye sığmazsa en çok 3 altıgen yakını; hiç sığmazsa motor reddeder (kurulum sınırı). |
| Gargantuan sınırı | `create.ts` `multiHexMax`, `body.ts` `bodySize` | var (farklı) | Bugün 15×7'de 7 altıgene iner. K69: seçicide red + neden satırı (motor yedeği aynı). |
| Çağırma varışı | `summons.ts` `summonHexProblem`, `summonHexNear` | **eksik** | Yalnız çapa. K69: gövde sığma; en yakın sığan altıgen; hiç yoksa red + neden. |
| Işınlanma varışı | `teleport.ts` `teleportProblem` (Misty Step, Tree Stride, Dimension Door…), `motion.ts` `teleport` | **eksik** | Yalnız çapa. K69: gövde sığma. |
| Atlama inişi | `movement.ts` `executeJump` | **eksik** | Yalnız iniş altıgeni. K69: gövde sığma. |
| Ele geçirmeden çıkış | `possession.ts` `appearSpot` | var | `fits` ile (K64b). |
| Forcecage dökümü | `forcecage.ts` | var | Gövdesi kısmen içerideki dışarı itilir. |

## 2. Hareket ve yol bulma

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Adım maliyeti | `movement.ts` `moveCostBase` | var | Gövdenin her altıgeni; en pahalısı. Dar geçitten sığmayan geçemez. |
| Yürüme bitişi | `executeMove` | var | Gövde harita içinde, engel/lav değil, boş. |
| Yol bulma, YZ yürünebilir altıgenler | `findPath`, `costsFrom`, YZ `reachable` | var | Aynı maliyet fonksiyonu. |
| Zemine giriş olayları (tuzak, sarmaşık, lav kıyısı…) | `bodyEnterEvents` | var | Gövdenin yeni girdiği altıgenler; aynı zemin harfi adımda bir kez. |
| Duvarda/tavanda tırmanma (K68b) | `movement.ts` `hexCostFn` `wallHex`, `altitude.ts` `climberHolds`/`climbMove` | **hatalı** | Her gövde altıgeni duvar dibi olmalı sayılıyor: büyük tırmanıcı duvar boyunca yürüyemez. K69: gövdenin herhangi bir altıgeni duvar dibindeyse. |
| Yakalayanın sürüklemesi | `grapple.ts` `dragEvents` | **eksik** | Varış önceki çapa; doluluk yalnız çapalar. K69: sürüklenen gövde sığan en yakın altıgene (yakalayana bitişik). |
| Squeezing (bir boy küçük alana sığma) | — | yok | SRD 5.2.1'de kural yok (2014 kuralıydı): dar geçit yasak (⚠). |

## 3. Temas, erişim, menzil

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Yakın dövüş erişimi, menzilli saldırı, hedefli büyü menzili | `range.ts` `checkReach` (`gap`) | var | En yakın iki altıgen. |
| Yanında düşman (menzilli dezavantaj) | `range.ts` `enemyAdjacent` | var | `gap`. |
| Fırsat saldırısı | `features.ts` `leavesReach` | var | Gövde erişimden çıkınca. |
| Tepki menzili | `reactions.ts` `feetBetween` | var | `gap`. |
| Pack Tactics | `allyNextTo` | var | `gap` ≤ 1. |
| Yakalama, itme (Shove) bitişikliği | `forced.ts` `executeGrapple`/`executeShove` | var | `gap` = 1. |
| Yakalamanın sürmesi | `grapple.ts` `grappleCleanup` | **hatalı** | `distance(çapa, çapa) > 1` ise biter: büyük yakalayan bitişikken bile yakalama düşer. K69: `gap`. |
| Noktaya alan büyüsü menzili | `areaAttack.ts` `pickArea` | **eksik** | Çapadan. K69: gövdenin en yakın altıgeninden. |
| Işınlanma ve çağırma menzili | `teleport.ts`, `summons.ts` | **eksik** | Çapadan. K69: gövdeden. |
| Diğer noktaya menziller (tutuşturma, serbest şekil, Passwall, nesneye saldırı) | `ignite.ts`, `freeShape.ts`, `terraform.ts`, `objects.ts` | eksik | Bilerek çapada kaldı (seyrek; büyük büyücü yok sayılacak kadar az). |

## 4. Alan büyüleri ve alanlar

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Küre, küp, silindir, koni, çizgi isabeti | `areaAttack.ts` `pickArea` | var | Gövdenin bir altıgeni alandaysa, hasar bir kez. |
| Alanın hedefe siperi (noktadan çıkan) | `cover.ts` `coverFrom` | **eksik** | Hedefin çapasına hat. K69: hedef gövdesinin en uygun altıgeni (en yakın 7). |
| Yaratıktan çıkan koni/çizgi çıkışı | `areaHexes(spec, actor.pos, …)` | eksik | Bilerek çapada (yön seçimi çapadan; SRD "space"in kenarı yaklaşık). |
| Kalıcı alan tetikleri (giriş, tur başı/sonu, oluşum) | `zones.ts` `bodyInZone` | var | Kuyruk 43. |
| Yürüyen alan (Spirit Guardians) merkezi | `zones.ts` `zoneHexes` | var | Çapa merkez, kapsama hedef gövdesi. |
| Aura (Aura of Protection, Courage, imza auraları, K53 aura çekirdeği) | `auraCore.ts`, `auras.ts` (`gap`) | var (farklı) | Bugün gövde kenarından. K69 (kullanıcı kuralı): merkez çapa, kapsama hedef ayak izi (yürüyen alanlarla aynı ölçü). |
| Serbest şekil (Fire Storm, Forcecage) | `freeShape.ts` | var | Gövde kapsaması. |

## 5. Yüzeyler ve zemin etkileri

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Yüzey alanı tur başı/sonu tetiği (alev, zehir, buz…) | `zones.ts` (`bodyInZone`, `strongestPerSpell`) | var | Tür başına tek alan: tur başına bir kez. |
| Yüzey tepkimesi hasarı (K55 çözücü) | `hexResolver.ts` `hurtOnce` | **eksik** | Çapa. K69: gövde (komutta bir kez, `burned`). |
| Patlama (barut fıçısı, buhar, yanan ağ) | `surfaces.ts` `burstEvents` | **eksik** | Çapa. K69: gövde, bir kez. |
| Yüzey karışımı (rüzgârla sürüklenen bulut, ıslanma) | `surfaceMix.ts` | **eksik** | Çapa. K69: gövde. |
| Gres tutuşması | `ignite.ts` | **eksik** | Çapa. K69: gövde. |
| Lav, tehlikeli zemin tur sonu | `maprules.ts` `turnEndMapEvents` | var | Gövdenin herhangi bir altıgeni. |
| Derin su | `deepWater.ts` (`moveCostFn` içinde) | var | Her gövde altıgeni. |
| Bataklık saplanması | `maprules.ts` `stuckInBog` | eksik | Bilerek çapada (saplanma tek ayak). |
| Yarık açılışı (K66a) | `fissure.ts` | var | Gövdenin bir altıgeni yarıktaysa save; düşen gövde merkezi yarık altıgeninde. |
| Deprem yapı çöküşü (K66b) | `quake.ts` | var | Gövde. |
| Harita mekanikleri: ağaç devirme, kemik, sel, çığ, köprü rüzgârı, sülük | `forest.ts`, `wilds.ts`, `desert.ts` | **eksik** | Çapa. K69: alan/hat isabetleri gövdeden (bir kez). |

## 6. Zorla hareket, düşme, irtifa

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| İtme/çekme varışı | `forced.ts` `pushOutcome` | var | Gövdenin her altıgeni geçerli ve boş. |
| İtmede lav | `pushOutcome` | **eksik** | Yalnız çapa lavdaysa. K69: herhangi bir gövde altıgeni lav (uçan hariç). |
| İtmede yarık (K68a tek düşme) | `pushOutcome` | **hatalı** | Gövdenin bir altıgeni yarığa denk gelince "arkada uçurum" diye durur: büyük yaratık yarığa itilemez. K69: gövdede açık yarık varsa tek düşme, çapa en yakın yarık altıgenine. |
| Çarpma hasarı (K53 `carpmaHasari`) | `motion.ts` `forcedMove` | **eksik** | Çarpılan yalnız çapa altıgenindeki. K69: ön kenardaki ilk yaratık. |
| Düşme, tavan, irtifa üst sınırı (K68) | `altitude.ts` | var | Yaratık başına bir düşme; boy boyuttan. |

## 7. Görüş, siper, gizlenme

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Yaratıktan yaratığa görüş ve siper | `cover.ts` `lineOfFire` | var | İki gövdenin en yakın 7'şer altıgeni; saldıran için en iyisi (K43); irtifa (K68c). |
| Araya giren büyük gövde siperi | `cover.ts` `evaluate` (`covers`) | var | |
| Karanlık, ışık | `maprules.ts` `canSee` | var | Gövdenin bir altıgeni aydınlıksa. |
| Gizlenme yeri | `stealth.ts` `hideSpot` | eksik | Bilerek çapada (gizlenme yeri tek altıgen). |

## 8. Yapay zekâ

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Hedef sıralaması, yaklaşma | `ai.ts` (`gap`, `footprintDistance`) | var | Adaylar yaratık başına (altıgen başına kopya yok). |
| Alan büyüsü nişanı | `bestAim`, `areaSpell` | var | Kapsama `pickArea` gövdesiyle, yaratık başına bir kez. |
| Çağırma yeri | `summonHexNear` | eksik | K69: gövde sığması (bkz. 1). |

## 9. Arayüz

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Jeton çizimi | `mapView.ts` `tokenCenter` | var | Gövde ortası, ölçek 1,5/2/3. |
| Tıklama alanı | `MapBattle.tsx` | var | Gövdenin her altıgeni. |
| Gövde taban izi, yürüme hedefinde ayak izi | — | yok | K69: gövde altıgenleri ince çizgi; yürüme nişanında varış ayak izi. |
| Hedef bilgisi | `mapView.ts` `previewText` | yok | K69: "Gargantuan: 19 altıgen" satırı (TR/EN). |
| Game Master anahtarı | `GmScreen.tsx` | var | K69: ad "Çok altıgenli büyük yaratıklar (deneysel)" ve açıklama; Gargantuan 15×7 reddi. |

## 10. Kayıt ve tekrar

| Konu | Yer | Durum | Not / K69 |
|---|---|---|---|
| Bayrak kayıtta | `battle_started` durumu (`multiHex`, `multiHexMax`) | var | Eski kayıtta yok → kapalı. Olay yükleri çapa konumu; biçim değişmez (`SAVE_VERSION` 22 kalır). |

## Özet

- 61 satır: var 36, eksik 19, hatalı 3, yok 3 (2'si arayüz, 1'i SRD'de olmayan Squeezing).
- Var: yerleşim, hareket, erişim, alan isabeti, alan tetikleri, lav/su, yarık açılışı, görüş, YZ, jeton.
- Eksik (K69'da yapılacak): çağırma/ışınlanma/atlama varışı, sürükleme, nokta menzilleri (alan, ışınlanma, çağırma), alan siperi,
  yüzey tepkimesi/patlama/karışım/tutuşma, harita mekanikleri, itmede lav, çarpma, YZ çağırma yeri, arayüz (taban izi, hedef
  satırı, anahtar adı, Gargantuan reddi).
- Hatalı (K69'da düzelecek): tırmanıcı duvar denetimi, yakalamanın sürmesi, itmede yarık.
- Bilerek tek altıgen: koni/çizgi çıkışı, bataklık saplanması, gizlenme yeri, seyrek nokta menzilleri (tutuşturma, serbest
  şekil, Passwall, nesneye saldırı).

## K69 sonrası durum (Görev 1–2, kural sürümü 53, yalnız bayrak açıkken)

- **Kapanan eksikler (19):**
  - Çağırma, ışınlanma ve atlama varışı; sürükleme.
  - Nokta menzilleri (alan, ışınlanma, çağırma); alan siperi.
  - Yüzey tepkimesi, patlama, karışım, tutuşma; harita mekanikleri (Orman, Buzul/Dağ/Bataklık, Çöl).
  - İtmede lav; çarpma; YZ çağırma yeri.
  - Arayüz: taban izi, hedef satırı, anahtar adı, Gargantuan reddi.
- **Düzelen hatalar (3):** tırmanıcı duvar denetimi gövdeden, yakalama gövdeler arası, itmede yarık (tek düşme).
- **Ek:** tur sonu tehlikede en kötü gövde altıgeni (bir kez).
- **Yok kalan:** Squeezing (SRD 5.2.1'de yok, ⚠ dar geçit yasak).
- **Bilerek tek altıgen (değişmedi):** koni/çizgi çıkışı, bataklık, gizlenme yeri, seyrek nokta menzilleri.
- **Açık:**
  - Large 3 altıgen (A6 şekli).
  - Yarığa düşen gövdenin çevresi sığma denetimsiz.
  - Uçuş bitişinde zemin yeniden denetlenmez.
  - Büyük yaratık taktiği K73.
- Ayrıntı: DECISIONS.md "Kuyruk K69", `harita/belgeler/COKLU-ALTIGEN.md`.
