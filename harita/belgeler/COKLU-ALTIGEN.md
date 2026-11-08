# Çok altıgenli boyut (Görev A6)

Large, Huge ve Gargantuan yaratıkların birden çok altıgen kaplaması. Harita 15×7, flat-top, odd-q, 5 ft altıgen.
Kaynak SRD 5.2.1 (Size and Space: Large 10×10 ft, Huge 15×15 ft, Gargantuan 20×20 ft ya da daha büyük).

## Durum

**Bayrakla, varsayılan kapalı.** `BattleState.multiHex` (`startBattle(..., { multiHex: true })`). Kapalıyken (eski
kayıtlar, bütün senaryolar, arayüz) her yaratık tek altıgen; motorun bütün yardımcıları eski hesapla birebir aynı.
Bütün mevcut testler ve hızlı regresyon (4 senaryo × standart/paladin × 3./5. seviye) değişmedi. Kuyruk 43'ten beri Game Master kurulumunda "deneysel" anahtar.

## Tasarım

### Şekiller (sabit, döndürme yok)

| Boyut | Altıgen | Şekil | Çapa |
|---|---|---|---|
| Tiny, Small, Medium | 1 | tek altıgen | kendisi |
| Large | 3 | üçgen: çapa + doğu (q+1) + alt (r+1) | sol üst köşe |
| Huge | 7 | çiçek: çapa + 6 komşu | orta |
| Gargantuan | 19 | çapa + iki halka (yarıçap 2) | orta |

Neden: altıgen ızgarada 10 ft karenin en yakın karşılığı 3 altıgenlik üçgen, 15 ft'nin 7'lik çiçek, 20 ft'nin 19'luk
yarıçap-2 kümesi. Döndürmesiz sabit şekil yol bulmayı tek çapa üzerinden bırakır (durum uzayı büyümez).
Kod: `src/rules/footprint.ts` (`SHAPES`, `footprint`, `footprintDistance`, `fits`).

### Konum ve gövde

- Konum (`Combatant.pos`) çapadır; kayıt biçimi değişmez. Gövde `bodyOf(state, c)` (`src/battle/body.ts`).
- Doluluk (`occupantAt`): altıgen bir yaratığın gövdesindeyse dolu.
- Mesafe (`gap`): iki gövdenin en yakın iki altıgeni arası; erişim, menzil, bitişiklik ve fırsat saldırısı bunu kullanır.

### Uygulananlar (bayrak açıkken)

| Konu | Kural | Yer |
|---|---|---|
| Yerleştirme | gövdenin her altıgeni harita içinde, geçilebilir, boş | `executePlace` |
| Doluluk | gövdenin her altıgeni dolu sayılır | `occupantAt` |
| Hareket maliyeti | çapanın adımı = gövdenin bütün altıgenlerinin adımı; maliyet en kötü altıgen (zemin, zorlu zemin, düşman, engel) | `moveCostFn` |
| Hareket bitişi | gövdenin her altıgeni harita içinde, lav/engel değil, boş | `executeMove` |
| Yol bulma ve yapay zekâ | aynı maliyet fonksiyonu (`findPath`, `costsFrom`, AI `reachable`) | — |
| Yakın dövüş erişimi, menzil | en yakın iki altıgen (`gap`) | `checkReach`, `enemyAdjacent` |
| Fırsat saldırısı | gövdeden erişimden çıkma | `leavesReach` |
| Tepki menzili | `gap` × 5 ft | `feetBetween` |
| Pack Tactics komşuluğu | `gap` ≤ 1 | `allyNextTo` |
| Alan büyüleri, nefesler | gövdenin bir altıgeni alandaysa etkilenir (hasar bir kez) | `pickArea` |
| Jeton çizimi | gövde altıgen merkezlerinin ortalaması; ölçek 1,5 / 2 / 3 (data/token-sizes.json); gövdenin her altıgeni tıklanır | `tokenCenter`, `MapBattle` |

### Kuyruk 43 eklemeleri (bayrak hâlâ deneysel, varsayılan kapalı)

| Konu | Kural | Yer |
|---|---|---|
| Gargantuan sınırı | 19 altıgen yalnızca orta/geniş haritada (en az 21×11); klasik haritada 7 (Huge şekli), `state.multiHexMax: 'H'` | `create.ts`, `bodySize` |
| Otomatik yerleşim | büyük gövdeler önce; bölgeye sığmazsa bölgenin en çok 3 altıgen yakınına | `createMapBattle` (`nearZone`) |
| Büyü alanları, yüzeyler | gövdenin herhangi bir altıgeni alandaysa giriş/tur başı/tur sonu/oluşum tetiklenir | `zones.ts` (`bodyInZone`) |
| Zemin tehlikeleri | yürürken gövdenin yeni girdiği altıgenler (aynı zemin harfi adımda bir kez); tur sonu tehlikesi gövdeden | `bodyEnterEvents`, `turnEndMapEvents` |
| İtme | itilen gövdenin her altıgeni harita içinde, boş, geçilebilir; yön saldıranın bitişiğindeki gövde altıgeninden; bitişiklik `gap` | `pushOutcome`, `shoveHex`, `executeShove` |
| Görüş ve siper | iki gövdenin karşı tarafa en yakın 7'şer altıgeni arasında saldıran için en iyi hat; araya giren büyük gövde siper | `lineOfFire`, `evaluate` |
| Karanlık | gövdenin bir altıgeni aydınlıksa görülür; görüş uzaklığı `gap` | `canSee`, `mapAttackSources` |
| Yapay zekâ | hedef sıralaması, bitişiklik, yaklaşma gövdeler arası (`gap`, `footprintDistance`) | `ai.ts` |
| Arayüz | Game Master kurulumunda "Büyük yaratıklar birden çok altıgen kaplar (deneysel)" | `GmScreen.tsx` |

### Kuyruk K69 eklemeleri (kural sürümü 53; yalnız bayrak açıkken, sürüm 52 ve altı değişmez)

Ortak ayak izi çözücüsü `src/battle/body.ts`: `isMultiHex53`, `footprintOf`, `touches`/`touchesHexes` (yaratık başına bir
kez), `reachToHex` (gövdenin en yakın altıgeninden), `auraGap`; sığma `movement.ts` `bodyFitProblem`. Denetim
`harita/belgeler/K69-DENETIM.md`.

| Konu | Kural | Yer |
|---|---|---|
| Gargantuan sınırı | Game Master seçicisi bayrak açıkken 15×7'de Gargantuan'ı reddeder (neden satırı); motorun Huge'a küçültmesi (`multiHexMax`) eski kayıtlar için kaldı | `app/setup.ts` `gargantuanTooBig`, `GmScreen.tsx` |
| Varış sığması | ışınlanma, çağırma (en yakın sığan yer), atlama inişi, yakalama sürüklemesi: gövdenin her altıgeni harita içinde, geçilebilir, boş; yoksa neden satırı | `teleport.ts`, `summons.ts`, `movement.ts`, `grapple.ts` |
| Menzil | ışınlanma, çağırma ve alan noktası menzili büyük yaratığın gövdesinin en yakın altıgeninden | `reachToHex` |
| Yüzey/zemin tetikleri | patlama, yüzey karışımı, tutuşma, `hexResolver` hasarı, Orman/Buzul/Dağ/Bataklık/Çöl mekanikleri gövdenin herhangi bir altıgeninde, yaratık başına bir kez | `touches` |
| Tur sonu tehlike | gövdedeki tehlikelerin en kötüsü (ortalama hasar), bir kez | `turnEndMapEvents` |
| İtme | gövdenin bir altıgeni açık yarıkta → tek düşme (derinlik kadar, çapa en yakın yarık altıgenine); bir altıgeni lavsa lav; çarpma ön kenardaki ilk yaratıkla | `pushOutcome`, `forcedMove` |
| Alan siperi | büyük hedefte origine en yakın 7 gövde altıgeninin en iyi hattı | `coverFrom` |
| Aura | merkez sahibinin çapası, kapsama hedefin ayak izi | `auraGap` |
| Tırmanma | gövdenin herhangi bir altıgeni duvar dibindeyse tutunur | `altitude.ts` `nearWall` |
| Yapay zekâ | alan puanında büyük yaratık bir kez | `ai.ts` |
| Arayüz | gövde tabanı (`.body-base`), hareket nişanında gövde izi, hedef bilgisinde "Huge: 7 altıgen" (TR/EN), anahtar "Çok altıgenli büyük yaratıklar (deneysel)" | `MapBattle.tsx`, `mapView.ts` |

### Kalanlar

1. **Large şekli 3 altıgen** (K69 isteği 4; A6 şekli korundu): 4 altıgenlik karşılık simetrik değil, çapa ve yol bulma
   değişirdi. Aura merkezi Large'da üçgenin köşesi (çapa).
2. **Yarığa düşen gövde**: çapa en yakın yarık altıgenine iner; gövdenin geri kalanının sığması denetlenmez.
3. **Uçuş bitişi**: havadaki büyük gövde indiğinde altındaki zemin (lav, yarık) yeniden denetlenmez.
4. **Koni/çizgi çıkışı** büyük yaratıkta çapadan (gövde kenarından değil); gizlenme yeri, bataklık çapadan (bilerek tek altıgen).
5. Serüven ve yolculuk savaşları bayrağı açmaz (yalnızca Game Master kurulumu); simülasyonda yok.
6. Yeni taktik yok (K73): büyük yaratık için ayrı yaklaşma/çevreleme davranışı.

## Testler

- `src/rules/footprint.test.ts`: şekiller, mesafe, sığma.
- `src/battle/multihex.test.ts`: bayrak; doluluk; erişim gövdeye; hareket (engel, kenar, doluluk); fırsat saldırısı;
  Huge yerleştirme. Bayrak kapalıyken aynı konumlarda eski sonuç.
- `src/battle/k43multihex.test.ts` (Kuyruk 43): Gargantuan sınırı, otomatik yerleşim, alan tetiği gövdeye, itme, görüş, yapay zekâ hedef sırası.
- `src/battle/k69.test.ts` (Kuyruk K69): şekiller, Gargantuan 15×7 reddi, varış sığması, zemin bir kez, tur sonu, yarık, lav,
  çarpma, siper, alan, aura, yakalama, tırmanma, dar geçit, fırsat saldırısı, YZ sayımı, hızlı yol sayacı, kayıt.
- `src/sim/k69Regresyon.test.ts`: bayrak kapalı sürüm 52 = 53 (4 senaryo; `K69_TOHUM=30` tam ölçüm).
