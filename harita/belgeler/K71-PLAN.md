# Kuyruk K71 — Yükseklik modeli: 3B engel, herkes için tırmanma, katman + irtifa birleşmesi, altıgen tavanı (PLAN)

Yalnız plan: kod, veri ve test değişmedi. Taban `wip/y1` 84969e8 (kural sürümü 55), dal `wip/k71-plan`.

**Kapsam** (dikey ertelenenler listesi; K68 planı §8 ve karar 9, 10):

- **(3)** Duvar yüksekliği ve genel 3B engel: geçme, siper, atlama; uçanların duvarı aşması (K68 karar 10'un geri alınması).
- **(5)** Herkes için duvara tırmanma (K68 karar 9'un geri alınması).
- **(6)** Yükseklik katmanı ile irtifanın birleşmesi: tepe, uçurum, uçan.
- **(2)** Altıgen başına tavan.
- **(1)** Çok katlı bina: yalnız "K71 veri modeli buna engel olur mu, yardım eder mi" notu (§9).

**Kaynak notu:** görevde anılan `not-ileri-fikirler.md` depoda, hiçbir uzak dalda ve GitHub kod aramasında yok. Açık dünya bağı (§8) mevcut belgelerden kuruldu: `docs/gorevler/kuyruk-47-serbest-gezinti.md`, `komsuluk-grafi-ve-deniz-yollari.md`, `kuyruk-45-46-karo-ve-goruntuleyici.md`, `docs/yolculuk/TASARIM.md`, `docs/yerlesim/TASARIM.md`, `harita/belgeler/SEFER-TASARIMI.md` (§2, §6 "Harita 2.0"). Dosya verilirse §8 güncellenir.

**Taban:**

| Ölçü | Değer |
|---|---|
| Tam test (`wip/k71-plan`, 84969e8) | 340 dosya / 3981 test geçti |
| Ana parça | 374 742 bayt (sınır 420 kB, pay ≈ 45 kB) |
| YZ karar süresi (Mantar Mağarası, bayrak kapalı, Y1) | ortanca ≈ 1,65 ms |

## 1. SRD 5.2.1 metinleri (aynen, Rules Glossary)

- **Climbing:** "While you're climbing, each foot of movement costs 1 extra foot (2 extra feet in Difficult Terrain). You ignore this extra cost if you have a Climb Speed and use it to climb."
  - Metinde zar/DC yok. K68 planındaki "GM DC 15" SRD 5.2.1 sözlüğünde geçmiyor; Game Master'ın kaygan/dik yüzey takdiridir (⚠ karar K2).
- **Falling [Hazard]:** "1d6 Bludgeoning damage at the end of the fall for every 10 feet it fell, to a maximum of 20d6. When the creature lands, it has the Prone condition unless it avoids taking any damage." Suya düşüşte DC 15 STR (Athletics) ya da DEX (Acrobatics) ile yarı hasar (tepki).
- **Flying:** "you fall if you have the Incapacitated or Prone condition or your Fly Speed is reduced to 0."
- **High Jump:**
  - Yükseklik 3 + STR değiştiricisi ft (en az 0), 10 ft koşuyla; yerinde yarısı. Her ft hareket harcar.
  - "You can extend your arms half your height above yourself during the jump."
- **Long Jump:**
  - STR puanı kadar ft (10 ft koşuyla; yerinde yarısı). Zorlu araziye inişte DC 10 DEX (Acrobatics) ya da Prone.
  - "At your GM's option, you must succeed on a DC 10 Strength (Athletics) check to clear a low obstacle (no taller than a quarter of the jump's distance), such as a hedge or low wall. Otherwise, you hit the obstacle."
- **Cover:** yarım (+2 AC ve DEX save), 3/4 (+5), tam (doğrudan hedef alınamaz); birden fazla siperde en korumalısı.
- **Yok:**
  - Yüksek zemin avantajı (bugünkü `heightCombat` ev kuralı).
  - Yaratık boyu (boyut alan, yükseklik değil).
  - Duvar/tavan yüksekliği.
  - 3B uzaklık.
  - Uçanın başka yaratığın "üstünden" geçmesi: SRD'de alan (space) zeminde bir kare.

## 2. Bugünkü durum (envanter)

| Konu | Yer | Bugünkü davranış | Sınır |
|---|---|---|---|
| İrtifa | `altitude.ts` (`altitudeFt`, S2 sürüm 41) | Zeminin üstünde, 5'in katı; `reachFt` = max(yatay, \|Δirtifa\|); `vertical_move`; komut sonu düşüş/süzülme | Katman seviyesine eklenmez |
| Tavan | `tavanFt` varyantta (K68b, sürüm 52; 14 harita, `scripts/k68-tavan.py`) | `ceilingFt` (önbellekli), `altitudeCapFt` = tavan − boy (`irtifa.boyFt`), `atCeiling` | Harita başına tek sayı; karışık iç/dış haritalar (han, demirci, hapishane dış halka, iskele) tavansız |
| Duvar yüksekliği | `cover.ts` `obstacleTopFt` (K68c) | `s`/`O` açık alanda `irtifa.wallFt` = 20, tavanlı haritada sonsuz | Yalnız görüş; harita başına/altıgen başına değer yok |
| Nesne yüksekliği | `data/nesneler.json` `yukseklikFt` (K68a: kapı 10, kale kapısı 15, çadır 10, çatlak duvar 10) + nesnede ezme | Görüş tepesi (K68c), Earthquake çöküşü (K66b) | Hareket/geçme yok |
| Verisiz engeller | ağaç `a`, sütun `c`/`m`, sarkıt `v`, kristal `e`, dış kayalık `#`, geçici engel | Görüşte sonsuz yükseklik (tam engel) | Uçan üstünden geçemez, göremez |
| Görüş/siper | `cover.ts` `lineOfFire`/`coverFrom`/`sightBlockedBetween` | İki uç 0 irtifadaysa hızlı yol (2B, `losStats`); değilse `evaluateAlt` (göz `eyeFt` = irtifa + boy/2, doğrusal hat) | Katman seviyesi hatta girmez; ayrı `heightSightBlock`, `ledgeCover` (2B) |
| Hareket | `movement.ts` `moveCostFn` | 2B: `blocked` zemin herkese kapalı, uçana yalnız `flyersPass` (`u` yarık, `R` nehir) açık; uçan zorlu araziyi yok sayar; düşman altıgeni kapalı | İrtifa yol bulmaya girmez: 40 ft'teki uçan sütunun/duvarın/düşmanın üstünden geçemez |
| Tırmanma (duvar) | K68b `wallHex`/`nearWall`, `climbingAloft`, `climbCapFt` (açık alanda 20, tavanlıda tavan − boy) | Yalnız tırmanma hızı olanlar (karar 9): Spider Climb, `climber`, Roving, Acrobatic Movement | Herkes çift maliyetle tırmanamaz; duvarın üstünde durma/öte yana geçme yok |
| Yükseklik katmanı | `heights.ts`/`climb.ts` (Kuyruk 26, sürüm 6) | 9 harita (buzul ×4, dağ ×4, `kale-taht-salonu`); seviye × `levelFt` 10; `heightMove` (2+ seviye uçurum, rampa), `climb` komutu (Atletizm DC 12), `heightFall`, `heightCombat` (yüksek zemin ev kuralı, menzil eki, kenar siperi), `heightSight` | İrtifadan ayrı eksen (K68 karar 4): `reachFt` katmanı, `heightCombat` irtifayı görmez |
| Atlama | `executeJump`, `jumpRangeFeet` | Aradaki `blocked` altıgen engel (Jump büyüsüyle tek engel aşılır), K68a'dan beri `u` boşluk; K68b yerinde zıplama (`highJumpReachFt`) | Engel yüksekliği yok: alçak duvar/çit "Long Jump ile aş" kuralı yok |
| Düşme | `fallEffect`, `fallReactions`, `heightFall`, `CHASM_FEET` | SRD tablosu; katmanda seviye × 10 ft; yarıkta derinlik (K68a) | Duvar tepesinden düşme yok (duvar üstünde durulamaz) |
| Çok altıgen | `body.ts` (K69, sürüm 53) | Gövde altıgenleri; `nearWall` gövdeden | — |
| Ana parça | haritalar `MAP_FILES` eager glob | Harita JSON'u ana parçada | Altıgen ızgarası verisi bayt bütçesine girer (§5) |

## 3. Önerilen veri modeli

### 3.1 Tek dikey eksen: mutlak yükseklik

- **Tanım:** her altıgenin **zemin yüksekliği** `zeminFt(h)` (ft, 5'in katı).
  - Katmanlı haritada `heights[r][c] × levelFt`.
  - Diğerlerinde 0. Bugünkü H/h/z harfleri ancak katman yoksa ve `heightCombat` kuralında kullanılıyor; bu davranış aynen kalır.
- **Yaratığın mutlak yüksekliği** = `zeminFt(pos) + altitudeFt`.
  - `altitudeFt` "zeminin üstünde" kalır; kayıt biçimi ve olaylar değişmez.
- **Uzaklık** `reachFt` = max(yatay, |Δmutlak|) (K68 karar 4'ün max'ı korunur, yalnız eksen birleşir).

### 3.2 Engel tepesi

- `engelFt(h)` = altıgendeki engelin zeminden yüksekliği (ft). Okuma sırası:
  1. Alan (panel, geçici engel).
  2. Nesne `yukseklikFt` (tür + ezme; bugünkü gibi).
  3. Altıgen ezmesi.
  4. Zemin harfi tablosu.
- **Zemin harfi tablosu:** yeni `data/dikey.json` `harfFt`.
  - Öneri: `s` duvar 20, `O` kapalı kapı 10, `c` ayakta sütun 15, `m` direk/çeşme 10, `a` ağaç 30, `v` sarkıt/dikit 10, `e` kristal 10, `k` kaya 5.
  - `#` dış kayalık sonsuz (harita dışı). Bilinmeyen harf sonsuz (bugünkü tam engel).
- **Tavan:** tavanlı haritada engel tavana dek (bugünkü K68c kuralı).
- **Tek okuma işlevi:** `obstacleTopFt` genişler; görüş, hareket, atlama ve tırmanma aynı işlevi kullanır.

### 3.3 Tavan

- **Harita başına:** `tavanFt` aynen kalır (14 harita; `k68-tavan.py` tek kaynak).
- **Altıgen başına:** yeni isteğe bağlı `tavan` ezmesi.
  - Seyrek biçim `{ "sütun,satır": ft | 0 }`; 0 = açık gök.
  - Bölge biçimi `tavanBolge: [{ altıgenler | dikdörtgen, ft }]`. Karışık haritada yalnız bina içi.
- `ceilingFt(state)` → `ceilingAt(state, h)`: önce altıgen ezmesi, yoksa varyant `tavanFt`, yoksa null.
- **Değişen çağrı yerleri:**
  - `altitudeCapFt(state, c)` yaratığın altıgeninden (çok altıgende gövdenin en alçak tavanı).
  - `climbCapFt`, `atCeiling`, `obstacleTopFt`.
  - Call Lightning bulut tabanı (döküm altıgeni).

### 3.4 JSON şeması (varyant düzeyinde, hepsi isteğe bağlı)

```json
"dikey": {
  "harfFt": { "s": 30 },          // bu haritada harf varsayılanını ezer (sur 30 ft)
  "engel": { "10,4": 15 },        // altıgen ezmesi (ft; 0 = engel yok sayılır değil, "tepe 0"; null = sonsuz)
  "tavan": { "5,5": 12, "6,5": 12 },
  "tavanBolge": [{ "dikdortgen": [3, 2, 8, 6], "ft": 12 }],
  "tirmanilmaz": ["c", "e"]       // herkes için tırmanmada yüzey reddi (§4.1); harf ya da "sütun,satır"
}
```

- **Zemin yüksekliği:** mevcut `heights` (seviye ızgarası) aynen kalır, yeni ızgara yok. Seviye → ft dönüşümü `levelFt` (10). Yarım seviye gerekmiyor.
- **Geriye uyum:**
  - `dikey` yoksa harf tablosu + `tavanFt` + `heights` kullanılır.
  - Kural sürümü < 56 bugünkü kod (bkz. §6 sürüm kapıları).
  - Eski kayıt ve replay olaylardan aynı durumu üretir (irtifa göreli kaldığı için).
- **Doğrulama:**
  - Yükleyici (`src/map/maps.ts`) anahtar biçimi, 5'in katı, harita içi ve 0 ≤ ft ≤ 120 denetler.
  - Test: her harita için şema geçer.
- **Betik:**
  - `scripts/k71-dikey.py` tek kaynak (K68 tavan betiği gibi). Harita başına tablo + gerekçe, idempotent, üreticilerden sonra çalışır.
  - `k68-tavan.py` ya aynen kalır ya `k71-dikey.py`'ye taşınır (karar K14).

### 3.5 `tavanFt` ve `yukseklikFt` ile ilişki

- `tavanFt` varyantın varsayılan tavanı olarak kalır; altıgen ezmesi onu daraltır ya da açar.
- `yukseklikFt` (nesne) engel tepesinin ilk kaynağıdır; değişmez. Earthquake çöküş yarıçapı aynı değerden okunmaya devam eder.

## 4. Hareket, geçme, atlama, tırmanma kuralı

### 4.1 Herkes için tırmanma (karar 9 geri alınır)

- **Kim:** herkes (SRD Climbing). Tırmanma hızı olan ek maliyetsiz.
- **Maliyet:** hareketin iki katı, zorlu yüzeyde üç katı. Her 5 ft dikey bir altıgen sayılır, `vertical_move` ve `climbMove` bugünkü gibi.
- **Nereye:**
  - Duvar dibinden (`wallHex`) engel tepesine dek (`engelFt`).
  - Tavanlı yerde tavan − boy (bugünkü `climbCapFt`).
  - Tavana tutunmak yalnız tırmanma hızıyla (Spider Climb; SRD "upside down along ceilings"). Tırmanma hızı olmayan tavana tutunmaz.
- **Zar:**
  - Öneri: zar yok (SRD 5.2.1 metni).
  - İsteğe bağlı: `dikey.tirmanilmaz` yüzeylerde (cam, buz, sütun) tırmanma hızı olmayan reddedilir.
  - İsteğe bağlı ev kuralı: kaygan yüzeyde Atletizm DC (veride). ⚠ karar K2.
- **Elle tutunma:** tırmanırken iki elli silahla saldırı kısıtı yok (SRD söylemez).
  - Prone, Incapacitated ya da hız 0 → düşer (bugünkü `climberHolds`).
  - Hasar alınca düşme yok (SRD yok).
- **Bugünkü `climb` komutu** (katman, Atletizm DC 12) korunur. Katmanlı haritada 2+ seviye uçurum duvar sayılır, yeni tırmanma yolu da açılır (tek kural, karar K4).

### 4.2 Duvarın üstü ve öte yanı

- Duvar altıgeni yürünmez kalır. Duvarın tepesinde **durmak**, yalnız veride `ustYurunur` işaretli harflerde/altıgenlerde olur (sur yolu, kayalık sırtı).
  - Öneri: K71'de yok. K72 "sur üstü ayrı kat" ile gelir (karar K5).
- **Geçme:** tırmanan yaratık duvar tepesine (`engelFt`) çıkıp aynı hareketle öte yandaki altıgene iner.
  - Bir duvar altıgeni hareket olarak "üstünden atlama" sayılır.
  - Maliyet: tırmanma (yukarı) + inme (aşağı, tırmanma ya da atlayış = düşme).
- **Uçan:** irtifası engel tepesinden yüksek olan uçan engel altıgeninin üstünden geçer (karar 10 geri alınır).
  - Engel altıgeninde **duramaz** (yer yok); yalnız geçer.
  - Tavanlı haritada duvar tavana dek: geçilmez.
- **Yaratığın üstünden uçma:**
  - Öneri: irtifa − hedefin mutlak tepesi ≥ 5 ft ise düşman altıgeninin üstünden geçer, durmaz.
  - Fırsat saldırısı erişimi `reachFt` (3B) ile.
  - ⚠ SRD yaratık alanını yükseklikli tanımlamaz (karar K6).

### 4.3 Yükseklik farkı, düşme ve hasar

- **Tek düşme kuralı:** düşülen mutlak fark (eski mutlak − yeni zemin) için SRD Falling.
  - Duvar tepesinden, sırttan ya da uçuştan düşüş aynı işlevden geçer: `fallEffect` + `heightFall` birleşir.
- **Katmanlı haritada aşağı atlama** = gönüllü düşme (bugün). Sırt kenarından itilme: `pushOutcome` düşüş farkı = mutlak fark.
- **Suya düşme** SRD tepkisi zaten var (`fallReactions`).

### 4.4 Atlama

- **Long Jump:** aradaki engel altıgeninin `engelFt` ≤ atlama mesafesinin dörtte biri ise geçilir. SRD "GM'in isteğine bağlı" DC 10 STR (Athletics).
  - Öneri: zar yok, yalnız yükseklik sınırı (karar K7).
  - Daha yüksek engel bugünkü gibi aşılamaz. Jump büyüsü (×3) aynı kurala girer: "tek engel" sayacı kalkar, yükseklik sınırı gelir.
- **High Jump:** yerinde zıplama (K68b) aynen. Alçak duvarın (`engelFt` ≤ High Jump + kol uzanımı) üstüne tutunma yok (K71 dışı).

### 4.5 Yüksek zemin ve siper

- **Yüksek zemin:** `heightCombat` ev kuralı aynen kalır (SRD'de yok), ama katman seviyesi yerine **mutlak yükseklik farkı** ≥ 10 ft ile.
  - Uçan da yüksek zemin sayılır mı: öneri hayır. Kural "zemin" der; yalnız `zeminFt` farkı. Karar K8.
- **Siper:**
  - `ledgeCover` (kenar siperi) ve `heightSightBlock` (sırt) K68c'nin irtifalı hattına katılır.
  - Hat altıgendeki **zemin + engel tepesi** ile karşılaştırılır; sırt engeli zemin farkıdır.
  - Tek çekirdek `evaluateAlt`. 2B `heightSightBlock`/`ledgeCover` sürüm < 56'da kalır.

## 5. Görüş/siper ve YZ süresi

- **Çekirdek:** K68c `endsOf` → `evaluateAlt` aynen, yalnız uç yüksekliği = `zeminFt` + `eyeFt` ve engel tepesi = `zeminFt(h)` + `engelFt(h)`.
- **Hızlı yol (korunur, genişler):** iki uçta irtifa 0 **ve** harita katmansız **ve** harita `dikey` verisizse bugünkü 2B kod.
  - Katmanlı 9 haritada iki ucun zemin yüksekliği aynı ve yol üstünde daha yüksek altıgen yoksa da hızlı yol (ön denetim `maxZemin(path) ≤ zeminUçlar`).
  - Açık alanda duvar 20 ft varsayılanı yalnız bir uç havadayken önem taşır (bugün gibi).
- **Sıcak yol maliyeti tahmini:**
  - `evaluateAlt` K68c'de hat başına ~1,5–2× (sayaç `losStats.altPath`).
  - Katmanlı haritalarda yerdeki yaratık çiftlerinin bir kısmı hızlı yoldan çıkar: o haritalarda görüş çağrılarının tahminen %30–60'ı.
  - YZ adayı başına görüş çağrısı birkaç tane. Katmanlı haritada karar süresi tahmini +%10–25. Katmansız haritada +%0–3 (yalnız yeni `if`).
- **Hareket sıcak yolu:**
  - `moveCostFn` uçan için engel altıgeninde `engelFt` okuması (Map önbellek, durum başına) ve irtifa karşılaştırması. Uçmayan için değişiklik yok.
  - Tırmanma herkese açılınca yürüyüş Dijkstra'sına duvar dibi → üst geçiş kenarları eklenir. **Yalnız bir bayrak** (`dikey.gecis` ya da kural) açıkken ve yalnız "duvar tepesi < hız/2" olan duvarlarda.
  - Tahmin +%5–15 (Dijkstra düğüm sayısı artar). ⚠ en büyük risk.
- **Kapı:** her parçada YZ karar süresi ≤ +%15. Mantar sahnesi 1,65 → ≤ 1,90 ms; ek katmanlı sahne (`dag-karakol`) tabanı K71a başında ölçülür. Aşarsa önbellek/erken dönüş, yine aşarsa dur ve raporla.

## 6. Alt iş bölümü

| Parça | Kapsam | Kural sürümü | Risk | Tahmini test | Ana parça | YZ kapısı |
|---|---|---|---|---|---|---|
| **K71a** | Veri modeli (`data/dikey.json` harf tablosu, varyant `dikey` şeması + yükleyici doğrulaması, `scripts/k71-dikey.py`); tek `obstacleTopFt`/`zeminFt`/`ceilingAt`; görüşte zemin + engel tepesi (K68c genişlemesi, `heightSightBlock`/`ledgeCover` birleşmesi); **uçanın engel üstünden geçmesi** (karar 10 geri) ve yaratık üstünden uçma (K6); altıgen tavanı (2) | 56 | Orta: görüş ve uçuş yolu ortak motor; katmanlı haritada hızlı yol daralır | ~25 (şema, harf varsayılanı, tavan ezmesi, uçan geçiş/duramama/tavanlıda red, görüş katmanlı/katmansız, hızlı yol sayacı, 55 sabit) + 30 tohum 55 = 56 regresyonu (katmansız haritalar birebir) | +1–3 kB (harf tablosu + birkaç ezme; ızgara yok) | Mantar ≤ +%15, katmanlı sahne ölçülür |
| **K71b** | Herkes için tırmanma (SRD Climbing, karar 9 geri); duvar tepesinden öte yana geçiş; düşme tek işlevde; Long Jump engel yüksekliği (dörtte bir); `tirmanilmaz` yüzeyler | 56 (tek sürüm, K68 gibi) ya da 57 (karar K13) | Yüksek: yürüyüş Dijkstra'sı ve YZ yol bulma; denge (yakın dövüşçüler duvar aşar) | ~20 + hızlı regresyon 6 senaryo × 50 (denge değişir; ayar yok, rapor) | ≈ 0 | Mantar + duvarlı açık harita (`kale-avlu`) ≤ +%15 |
| **K71c** | Katman + irtifa birleşmesi (mutlak yükseklik, `reachFt` 3B, `heightCombat`/`heightFall` mutlak farkla; uçanın katman sırtını aşması); `climb` komutu ile herkes için tırmanmanın tek kurala inmesi | 56/57/58 (karar K13) | Orta–yüksek: 9 katmanlı harita (buzul, dağ, taht salonu) dengesi ve replay sabitliği | ~20 + katmanlı 8 harita × 30 tohum (`sim:k26`) önce/sonra | ≈ 0 | Katmanlı sahne ≤ +%15 |

- **Bağımlılık:** K71a → K71b (engel tepesi gerekli). K71c, K71a'nın `zeminFt` işlevine bağlı; K71b'den bağımsız.
- **Arayüz** (her parçada küçük; ekran görüntüsü 1):
  - altıgen bilgisinde "Duvar 20 ft, tırmanılır (×2)" ve "Tavan 12 ft (bu altıgen)";
  - uçuş yolunda engel üstü geçiş;
  - "Tırman" düğmesi herkese açık.
- **Belgeler:** DECISIONS.md, CLAUDE.md, `COKLU-ALTIGEN.md` (çok altıgende gövdenin en alçak tavanı).

## 7. Harita veri işi

| Grup | Haritalar | Değişiklik | Kullanıcı görsel doğrulaması |
|---|---|---|---|
| Tavanlı iç mekân (14) | dungeon, magara, magara-genis, kasaba-lagim, yeralti-nehri, 4 derinlikler, orman-heykel-magarasi, hapishane-hucre-platformu, hapishane-mudur-kulesi, taverna, kale-taht-salonu | Yok (duvar tavana dek). Sütun/sarkıt yükseklikleri tavana kırpılır | Gerekmez |
| Duvarlı açık alan (23) | batak-kale, buzul-tapinak, hapishane-dis-halka, hapishane-iskele, kale, kale-avlu, kale-baskini, kale-ic-avlu, kale-onu, beyaz-sehir-dis-kapi, beyaz-sehir-saray-avlusu, kasaba-han, kasaba-demirci-tapinak, sehir-meydani, orman-heykel-golu, orman-kemik-acikligi, orman-oduncu-kampi, orman-ork-kampi, volkanik-demirhane, kanyon-koprusu, isinlanma-salonu, lav-tapinagi, ortamlar-diyari | Varsayılan `s` 20 ft. Ezme önerisi: kale surları 30 (kale, kale-baskini, beyaz-sehir), ahşap çit/kamp duvarı 10 (ork, oduncu), bina duvarı + bina içi tavan (han, demirci, hapishane dış halka/iskele: `tavanBolge`) | **Gerekir:** sur/bina boyları ve bina içi bölgeleri görselden; betik önerir, kullanıcı onaylar |
| Katmanlı (9) | buzul ×4, dağ ×4, kale-taht-salonu | `heights` aynen; K71c'de ft'e çevrilir (×10) | Gerekmez (veri var); sırt/uçurum dengesi simle |
| Ağaçlı (orman paketi, bataklık, klasik orman) | ~10 | Ağaç `a` 30 ft varsayılan. Seyrek ağaçlarda uçan geçer | İsteğe bağlı (ağaç türü) |
| Diğer (çöl, buzul açık, volkan…) | kalan | Yok | Gerekmez |

- **Betik akışı:**
  - `python scripts/k71-dikey.py --kuru` öneri tablosu üretir: harita, harf sayıları, önerilen ezme, bina bölgesi adayı (`s` ile çevrili kapalı alan taşkın dolgusu).
  - Kullanıcı onaylar, `--yaz` ile yazılır.
  - Bina bölgesi otomatik tespiti öneri, onay elle.

## 8. Açık dünya ile bağ

Açık dünya (K45–K49 serbest gezinti, bölge yükleme, yerleşimler, kuşatma) belgelerinden:

| Madde | Açık dünya için | Gerekçe |
|---|---|---|
| (3) 3B engel, uçanın duvar aşması | **ŞART** | Açık dünyada uçan binek/uçuş var (K47: Göksel Ada, uçan binek); bölge savaşlarında uçan yaratık (harpy, ejderha, uçan binekli parti) duvar ve ağaç üstünden geçemezse bölge haritalarında kilitlenir. Kale/şehir surlarında (Kral Kalesi, Beyaz Şehir, Liman "büyük duvarlı") savaş doğal değil |
| (2) Altıgen başına tavan | **ŞART (yerleşimler için)** | Yerleşim haritaları karışık iç/dış (han, demirci, hapishane dış halka/iskele, liman); tek `tavanFt` yerleşimlerde ya hep açık ya hep kapalı |
| (6) Katman + irtifa birleşmesi | Ertelenebilir (orta) | Bölge haritaları buzul/dağ katmanlı; uçan ile sırt arasındaki erişim yaklaşık ama oynanır. Açık dünyada yeni dağ haritaları gelirse öncelik artar |
| (5) Herkes için tırmanma | Ertelenebilir | Kuşatma ve sur tırmanma (SEFER-TASARIMI §6) için gerekli; serbest gezinti için değil. Denge riski yüksek |
| (1) Çok katlı bina | Ertelenebilir (K72) | Kule içi, sur üstü katı, han üst katı: SEFER-TASARIMI "Harita 2.0" |

## 9. K72 (çok katlı bina) ve K73 (YZ dikey taktik) bağları

### K72: çok katlı bina

- **K71'den girdi:**
  - `zeminFt(h)` ve `ceilingAt(h)` işlevleri. K72'de kat dizinine bağlanır: `zeminFt(state, h, kat)`.
  - Altıgen tavan ezmesi: bina içi tavanı = üst katın zemini.
  - `ustYurunur` (sur yolu) işareti için yer: K71'de şemada ayrılır, motor kullanmaz.
- **Engel mi, yardım mı:**
  - **Yardım eder:** tek dikey eksen (mutlak yükseklik) ve okuma işlevleri, katı "aynı (sütun, satır)'da farklı zemin" olarak eklemeye izin verir.
  - **Engel olabilecek tek nokta:** `altitudeFt`'in "zeminin üstünde" tanımı. Çok katta yaratığın hangi katın zemininde durduğu ayrı alan ister (`kat`).
  - Öneri: K71 şemasında `zemin` tek değer kalsın, K72 `katlar[]` ekler. Bugünkü `floors.ts` (tek aktif kat, öbürleri `offFloor`) bununla uyumlu.
- **K71 çıktısı:** kat geçişi (merdiven/rampa = `ramps` + `floorLink`) değişmez. K72 "iki kat aynı anda çizim" ve kat arası görüşü ekler.

### K73: YZ dikey taktik

- **K71'den girdi:**
  - 3B `reachFt`;
  - uçanın engel üstü geçişi;
  - herkes için tırmanma maliyeti (yol bulmada);
  - mutlak yükseklikle yüksek zemin değeri;
  - görüşte duvar tepesi.
- **K71 çıktısı (YZ için):**
  - Yol bulma irtifayı durum uzayına **katmaz**; irtifa değişimi ayrı komut (`vertical_move`) kalır.
  - K73 "hangi irtifada dur" kararını bu işlevlerle verir: dalış, yükseğe çık, sur üstünden ateş, tırmanıp arkadan dolanma.
  - K71'de YZ yalnız yeni geçişleri yol bulmada kullanır (uçan duvarı aşar, tırmanan duvarı aşar); yeni taktik yok.
- **Bağımlılık sırası:** K71a → (K71b, K71c) → K73. K72 K71a'dan sonra herhangi bir zaman.

## 10. Karar listesi

Her karar için öneri, artı/eksi ve ⚠ SRD notu.

- **K1. Duvar ve engel yüksekliği kaynağı:** harf tablosu (`data/dikey.json`) + varyant/altıgen ezmesi.
  - **Öneri:** evet; ızgara yok.
  - **Artı:** ana parça bayt bütçesi korunur (+1–3 kB); 59 haritanın çoğu veri istemez.
  - **Eksi:** sur/bina boyları elle ezme ister (kullanıcı görsel doğrulaması).
  - ⚠ SRD duvar boyu vermez; değerler tasarım.
- **K2. Herkes için tırmanma zarı:**
  - **Öneri:** zar yok (SRD 5.2.1 Climbing metni); `tirmanilmaz` yüzey listesi veride; kaygan yüzey DC'si isteğe bağlı ev kuralı (varsayılan kapalı).
  - **Artı:** SRD'ye uygun, kural basit.
  - **Eksi:** her duvar tırmanılır; kuşatma/hapishane senaryolarında denge değişir.
  - ⚠ K68 karar 9'un geri alınması; "GM DC 15" SRD 5.2.1 metninde yok.
- **K3. Tırmanma maliyeti:**
  - **Öneri:** ×2 (zorlu yüzeyde ×3), tırmanma hızıyla ×1; her 5 ft dikey = 1 altıgen.
  - **Artı:** SRD aynen.
  - **Eksi:** 20 ft duvar = 4 + 4 (iniş) altıgen: yaya yaratık bir turda zor geçer (beklenen davranış).
- **K4. Katmandaki `climb` komutu (Atletizm DC 12):**
  - **Öneri:** sürüm 56+ tek tırmanma kuralına iner (zar yok, ×2), eski sürümde aynen.
  - **Artı:** iki tırmanma kuralı kalmaz.
  - **Eksi:** katmanlı 8 haritada denge değişir (K71c ölçümü).
  - ⚠ DC 12 zaten ev kuralıydı.
- **K5. Duvar tepesinde durma (sur yolu):**
  - **Öneri:** K71'de yok, şemada `ustYurunur` ayrılır; K72'de kat olarak.
  - **Artı:** hareket modelinde "altıgende iki yükseklik" yok.
  - **Eksi:** sur üstünden ok atma K72'ye kalır.
- **K6. Uçanın düşman üstünden geçmesi:**
  - **Öneri:** irtifa ≥ hedefin tepesi + 5 ft ise geçer, duramaz; fırsat saldırısı 3B erişimle.
  - **Artı:** uçuş anlamlı, kilitlenme azalır.
  - **Eksi:** SRD'de alan zeminde; yorum.
  - ⚠ SRD sapması (yorum).
- **K7. Long Jump ile alçak engel:**
  - **Öneri:** `engelFt` ≤ atlama mesafesi / 4 ise geçer, zar yok (SRD "GM's option" DC 10 STR kullanılmaz); Jump büyüsünün "tek engel" sayacı kalkar.
  - **Artı:** SRD sınırı, çit/alçak duvar anlamlı.
  - **Eksi:** zar seçeneği yok.
  - ⚠ isteğe bağlı SRD zarı atlandı.
- **K8. Yüksek zemin:**
  - **Öneri:** `heightCombat` ev kuralı kalır; ölçü mutlak zemin farkı ≥ 10 ft; uçan yüksek zemin sayılmaz.
  - **Artı:** bugünkü dengeye yakın, uçuşun gücü artmaz.
  - **Eksi:** sur üstündeki (K72) ile uçan farklı muamele görür.
  - ⚠ SRD'de yüksek zemin yok (ev kuralı).
- **K9. Uzaklık:**
  - **Öneri:** `reachFt` = max(yatay, |Δmutlak|) (K68 karar 4 max'ı korunur).
  - **Artı:** kod ve replay basit; ızgara mantığıyla uyumlu.
  - **Eksi:** çapraz uzaklık kısa.
  - ⚠ SRD 3B uzaklık yok.
- **K10. Görüşte engel ve zemin:**
  - **Öneri:** tek çekirdek `evaluateAlt` (zemin + engel tepesi); hızlı yol genişler (§5).
  - **Artı:** sırt, kenar siperi ve duvar tek kuralda.
  - **Eksi:** katmanlı haritada YZ süresi +%10–25 (tahmin).
- **K11. Altıgen tavanı biçimi:**
  - **Öneri:** seyrek ezme + dikdörtgen bölge; varyant `tavanFt` varsayılan.
  - **Artı:** bayt az, karışık haritalar.
  - **Eksi:** bölge tespiti elle onay ister.
  - ⚠ SRD tavan vermez.
- **K12. Ağaç yüksekliği:**
  - **Öneri:** `a` 30 ft; uçan üstünden geçer, ağaçtaki gizlenme değişmez.
  - **Artı:** orman haritalarında uçuş açılır.
  - **Eksi:** ağaç türü farkı yok.
  - ⚠ tasarım değeri.
- **K13. Kural sürümü:**
  - **Öneri:** K71a 56, K71b ve K71c aynı 56 (K68'deki gibi tek sürüm, parçalar yayınlanmadan birleşir) ya da yayın arası varsa 57/58.
  - **Artı:** sürüm az.
  - **Eksi:** 56'nın içeriği parça parça büyür.
- **K14. Betik:**
  - **Öneri:** `scripts/k71-dikey.py` tek kaynak (tavan + duvar + bölge); `k68-tavan.py` ona taşınır, eski betik yönlendirir.
  - **Artı:** dikey verinin tek yeri.
  - **Eksi:** K68 betiği değişir (çıktı aynı, test).
- **K15. Herkes tırmanması YZ'de:**
  - **Öneri:** K71b'de YZ yol bulma tırmanma kenarlarını yalnız "duvarsız yol ≥ 2× uzun" iken kullanır (K73'e kadar sezgisel kapı).
  - **Artı:** YZ süresi ve denge kontrollü.
  - **Eksi:** YZ en kısa yolu her zaman kullanmaz.
- **K16. Yaratık boyu ve engel:**
  - **Öneri:** boy (`irtifa.boyFt`) yalnız tavan ve görüşte; engel geçişinde uçanın irtifası ≥ engel tepesi yeterli (boy eklenmez).
  - **Artı:** basit.
  - **Eksi:** büyük uçan alçak sütunun üstünden geçer.
  - ⚠ yorum.

## 11. Riskler

- **YZ karar süresi:**
  - Tırmanma kenarları Dijkstra'yı büyütür (K71b).
  - Katmanlı haritada görüş hızlı yolu daralır (K71a/c).
  - Kapı her parçada ≤ +%15.
- **Denge:**
  - Herkes tırmanınca kale/hapishane/ork kampı haritalarında savunma değeri düşer.
  - Uçan düşmanlar (harpy, ejderha) duvar üstünden gelir.
  - Hızlı regresyon zorunlu, ayar yok.
- **Replay/kayıt:** irtifa göreli kaldığı sürece olay biçimi aynı (`SAVE_VERSION` 22); her davranış sürüm kapısında.
- **Harita veri doğruluğu:** 23 duvarlı açık haritada sur/bina boyu ve bina içi bölgeleri kullanıcı görsel doğrulaması ister.
- **Ana parça:** ızgara verisi seçilirse 59 harita × ~0,5–1 kB, sınıra yaklaşır. Seyrek biçim önerildi.
