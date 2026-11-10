# K73f sonucu: su ve atlama kalanları (kural sürümü 66)

Taban `wip/k73e` 35acdbc (sürüm 65). Dal `wip/k73f`. Kararlar DECISIONS.md "Kuyruk K73f" girdisinde, denge `DENGE.md`'de.
65 ve altı birebir; yeni olay/alan yok; `SAVE_VERSION` 22.

## Görevler

| Görev | Sonuç | Nerede |
|---|---|---|
| 1. Batıkken atlama varış hücresi | yapıldı (66) | `src/battle/movement.ts` `underJumpProblem` |
| 2. Yüzme hızı olan 17 canavar | yapıldı (66) | `data/derin-su.json` `swimmers66`, `src/battle/deepWater.ts` `listedSwimmer` |
| 3. Call Lightning fırtına devralma | 64'ten beri var, SRD metniyle aynı; 66'da kod yok, test var | `src/battle/cloud.ts`, `src/battle/spells.ts` `stormBonusOn` |
| 4. YZ yer altında uzaklaşma | yapıldı (66) | `src/battle/ai.ts` `burrowCommand65`, `data/yapay-zeka.json` `k73f` |

### 1. Batık/yer altı atlama

- Batık ya da yer altındaki atlayanın varış hücresi kendi bandında boş olmalı.
- Batık yalnız derin suya, yer altındaki yalnız kazılabilir zemine atlar.
- Yüzeydeki yaratık bu atlayışı engellemez; aynı altıgende yüzeye çıkış ayrı denetlenir (`verticalCellProblem`).
- 65'te eski iniş (replay aynı).

### 2. Yüzücüler

17 canavar, hız satırındaki yüzme hızı ve nefes:

| id | Ad | Yüzme (ft) | Su solur | 65'te `srdK19` ile yüzer |
|---|---|---:|---|---|
| white-dragon-wyrmling | White Dragon Wyrmling | 30 | hayır | hayır (Burrow önce) |
| young-white-dragon | Young White Dragon | 40 | hayır | hayır (Burrow önce) |
| adult-white-dragon | Adult White Dragon | 40 | hayır | hayır (Burrow önce) |
| ancient-white-dragon | Ancient White Dragon | 40 | hayır | hayır (Burrow önce) |
| black-bear | Black Bear | 30 | hayır | hayır (Climb önce) |
| guardian-naga | Guardian Naga | 40 | hayır | hayır (Climb önce) |
| polar-bear | Polar Bear | 40 | hayır | evet |
| flying-snake | Flying Snake | 30 | hayır | evet |
| gibbering-mouther | Gibbering Mouther | 20 | hayır | evet |
| shambling-mound | Shambling Mound | 20 | hayır | evet |
| merfolk-skirmisher | Merfolk Skirmisher | 40 | evet (Amphibious) | evet |
| kraken | Kraken | 120 | evet (Amphibious) | evet |
| seahorse | Seahorse | 20 | evet (Water Breathing) | evet |
| green-hag | Green Hag | 30 | evet (Amphibious) | evet |
| archelon | Archelon | 80 | evet (Amphibious) | evet |
| chuul | Chuul | 30 | evet (Amphibious) | evet |
| hydra | Hydra | 40 | evet (Hold Breath) | evet |

- Listeler: 46 + 17 = 63 (veride yüzme hızı olan bütün canavarlar).
- Yüzme hızı olmayıp nefes tutan canavar: **0**. Dalma adayı üretilmez; karar kullanıcıda.

### 3. Call Lightning

- SRD 5.2.1: açık havada fırtınadayken büyü yeni bulut yaratmaz, fırtınanın kontrolünü verir; hasar +1d10.
- K73c'de (64) böyle: harita `storm` kuralı ya da Storm of Vengeance alanı, açık gök, `cloud.storm`.
- 66 testleri: fırtınada 4d10 + devralma, fırtınasız 3d10 + yeni bulut, süre ve konsantrasyon aynı, 65 = 66.

### 4. Yer altında uzaklaşma

- Kaçış kipi: can ≤ %15 (`k73f.kacisCan`) ve kimse yer altını sezemiyor.
- Kazıp bu tur hareket etmişse yalnız uzaklaşır ya da yer altında kalır; turun başında yer altındaysa çıkar.
- YZ'de tur içi sayaç yok (konum, can eşiği, motorun `movementUsed`'i).
- Eşik: %50 → kazan L9 64'e göre +14, %25 → +10, %15 → +7 (sınır 8).

## Sayılar

| Ölçüm | Sonuç |
|---|---|
| Regresyon 18 senaryo (4 × 30, duvarlı 6 × 50, katmanlı 8 × 20), eski ağaç 35acdbc | 65: 18/18 birebir; 66: 18/18 birebir (66'nın farklı olduğu senaryo yok) |
| `k73fRegresyon` 30 tohum | 65 = K73e altınları, 66 = 65 |
| Kazan L5 (64 / 65 / 66) | 47 / 43 / 47; zaman aşımı 0 |
| Kazan L9 (64 / 65 / 66) | 53 / 57 / 60; zaman aşımı 0 |
| Su altı, kıyı (K73e), fırtına L5/L9 | 66 = 65 (imza eşit) |
| Kıyı, 66 yüzücüleri (65 / 66) | 100 / 100; dalış 60 → 93 |
| Boğulma (bütün ölçümler) | 0 |
| YZ süresi (K73e sahneleri) | hepsi ≤ +%15; en yüksek su altı/parti +%5 |
| Ana parça | 374,74 kB (sınır 420) |
| `check:harita` / `check:ses` | 96/0, 15/0 |
| Tam paket (son koşu) | 368 dosya + 1 atlanan (`k73dOlcum`), 4314 test + 7 atlanan |

## Açık kalanlar

- Yüzme hızsız nefes tutan canavar veride yok; paket yaratıkları için dalış kararı kullanıcıda.
- Su altı ve kıyı karşılaşmaları kolay (%100).
- Yaklaşma kazması SRD verisinde pratikte tetiklenmiyor (K73e'den).
- `monsterTraits.ts` hız notunda yalnız ilk hıza bakıyor (Climb/Burrow önce gelince Swim okunmuyor). 66 listesiyle etkisiz; ayrıştırıcı düzeltilmedi.
