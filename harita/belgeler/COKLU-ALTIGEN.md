# Çok altıgenli boyut (Görev A6)

Large, Huge ve Gargantuan yaratıkların birden çok altıgen kaplaması. Harita 15×7, flat-top, odd-q, 5 ft altıgen.
Kaynak SRD 5.2.1 (Size and Space: Large 10×10 ft, Huge 15×15 ft, Gargantuan 20×20 ft ya da daha büyük).

## Durum

**Bayrakla, varsayılan kapalı.** `BattleState.multiHex` (`startBattle(..., { multiHex: true })`). Kapalıyken (eski
kayıtlar, bütün senaryolar, arayüz) her yaratık tek altıgen; motorun bütün yardımcıları eski hesapla birebir aynı.
Bütün mevcut testler ve hızlı regresyon (4 senaryo × standart/paladin × 3./5. seviye) değişmedi. Arayüzde açma
anahtarı henüz yok (bkz. "Kalanlar"; SABAH-RAPORU "Karar bekleyenler").

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

### Kalanlar (bayrak açılmadan önce)

1. **Kurulumda otomatik yerleşim** (`src/app/setup.ts`): başlangıç bölgelerine yerleşim ayak izini bilmiyor; büyük
   yaratık bölgede sığacağı çapaya konmalı.
2. **Zemin etkileri ve büyü alanları** (`zones.ts`, harita kuralları: lav, batak, tuzak, Spirit Guardians yayılımı):
   şimdilik çapa altıgenine bakıyor; gövdenin herhangi bir altıgeniyle örtüşme sayılmalı.
3. **İtme ve çarpma** (`forced.ts`): itilen çok altıgenli gövdenin her altıgeni sığmalı; çarpma gövdeye.
4. **Görüş hattı ve siper** (`cover.ts`, `sight.ts`): çapadan çapaya; en iyi görüşlü iki altıgen seçilmeli.
5. **Yapay zekâ hedef seçimi**: yaklaşma hedefi çapaya göre (`distance`); `gap` ile sıralanmalı (29 çağrı yeri).
6. **Atlama, ışınlanma, uçuş inişi, yakalama sürüklemesi**: gövde sığma denetimi yok.
7. **Görsel**: gövde altıgenleri için taban gölgesi; hedef hüzmesi gövde ortasında.
8. **Arayüz**: Game Master kurulumunda "Büyük yaratıklar birden çok altıgen kaplar (deneysel)" anahtarı.

## Testler

- `src/rules/footprint.test.ts`: şekiller, mesafe, sığma.
- `src/battle/multihex.test.ts`: bayrak; doluluk; erişim gövdeye; hareket (engel, kenar, doluluk); fırsat saldırısı;
  Huge yerleştirme. Bayrak kapalıyken aynı konumlarda eski sonuç.
