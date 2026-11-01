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

### Kalanlar

1. **Atlama, ışınlanma, uçuş inişi, yakalama sürüklemesi**: gövde sığma denetimi yok.
2. **Görsel**: gövde altıgenleri için taban gölgesi; hedef hüzmesi gövde ortasında.
3. Serüven ve yolculuk savaşları bayrağı açmaz (yalnızca Game Master kurulumu); simülasyonda yok.

## Testler

- `src/rules/footprint.test.ts`: şekiller, mesafe, sığma.
- `src/battle/multihex.test.ts`: bayrak; doluluk; erişim gövdeye; hareket (engel, kenar, doluluk); fırsat saldırısı;
  Huge yerleştirme. Bayrak kapalıyken aynı konumlarda eski sonuç.
- `src/battle/k43multihex.test.ts` (Kuyruk 43): Gargantuan sınırı, otomatik yerleşim, alan tetiği gövdeye, itme, görüş, yapay zekâ hedef sırası.
