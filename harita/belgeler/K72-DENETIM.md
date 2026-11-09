# K72 denetimi: tavan bölgeleri, sur üstü, çok katlı bina (Görev 0)

Taban `wip/k71d` ba70f21, kural sürümü 59. Kuyruk K72 (sürüm 60) üç şey ekler:
- bina içi tavan bölgeleri;
- duvar tepesinde durma (K5);
- çok katlı bina.

## Bugünkü durum (59)

| Konu | Dosya / işlev | Bugün |
|---|---|---|
| Harita tavanı | varyant `tavanFt` (K68b), `altitude.ts` `ceilingFt` | 14 iç mekân haritası; harita başına tek değer |
| Altıgen tavanı | `dikey.tavan` (altıgen), `dikey.tavanBolge` (dikdörtgen; K71a, sürüm 56+), `vertical.ts` `tavanEzme` | Yalnız kale-avlu ve kale-baskini'de iki 3×3 oda (15 ft); diğer iç tavanlar "elle bölge gerekir" diye bekliyor |
| Tavanın etkisi | `altitudeCapFt` (tavan − boy), `ceilingOver` (gövdenin en alçağı), görüşte çatı (`cover.ts` `groundBlock`), `obstacleTop56` | Tavanlı altıgende geçilmez engel tavana dek uzanır (sonsuz): tırmanılmaz, üstünden uçulmaz |
| Hava ızgarası | `cells.ts` (K71c) | Düzey = ⌊irtifa / 5⌋; yaratık bandı; aynı altıgende yer + hava |
| Engel tepesi | `cover.ts` `obstacleTopFt` (K71a) | Harf tablosu, varyant ezmesi, nesne `yukseklikFt`, panel 10 ft |
| Duvar tepesi | `movement.ts` (K71b `crossCarpan`), `executeMove` | Tırmanan/uçan duvarın **üstünden geçer, tepede DURAMAZ** (K5); varış geçilmez altıgen olamaz |
| Tırmanma işareti | `climbing` (`altitude_changed.climb`), `flight.ts` `isAirborne` | Duvardaki yaratık "havada" sayılır (uçuş muafiyetleri) |
| Komut sonu düşüş | `altitude.ts` `staysUp` | Uçmayan, tırmanmayan, irtifası 0 olmayan yaratık düşer |
| Düşme | `fall.ts` `fall` (K71b) | Tek işlev; iniş irtifası çağıranın verdiği (çoğunlukla 0); dolu hücrede yan altıgen (K71c) |
| Deprem | `quake.ts` (K66b), `fissure.ts` (K66a) | Yapı = kapı/kafes kapısı/çadır/çatlak duvar + panel; çöküş 12d6 + enkaz; duvar harfi yapı değil |
| Kat değişimi | `floors.ts` (Kuyruk 18 H4, `floorLink`) | **Ayrı harita**: bütün parti öbür kata geçer, iki kat aynı anda çizilmez (`offFloor`) |
| Merdiven benzeri | katman rampası (`ramps`), basamak zemini `l` (`stairs`), merdiven boşluğu (`stairwellFall`), basamaktan itme (`stairShove`), yürüyen merdiven `Y` | Hepsi tek yükseklik düzleminde; "altıgende iki yükseklik" yok |
| YZ | `ai.ts` `reachable`, `airSpots`, `climbToward`, `climbAi` | Yol bulma şimdiki irtifada; kat kavramı yok |
| Arayüz | "☁ Hava" düzey seçici (K71c) | Kat seçici yok |

## Öneri: tek model, "duruş yüzeyi"

PLAN K5 "sur yolu K72'de kat olarak" diyor. Buna göre sur tepesi ve üst kat tek kavram: **duruş yüzeyi**.

- **Tanım:** altıgenin üstünde durulabilen yükseklik. Tek işlev `standHeights(state, h)` (ft, altıgen zemininden, sürüm 60+). Üç kaynağı var:
  - **Zemin (0):** altıgen geçilmez değilse.
  - **Sur tepesi:** geçilmez duvar harfi varyantın `dikey.surUstu` listesindeyse; yükseklik engel tepesi (harf tablosu ya da ezme).
  - **Kat döşemesi:** varyantın `dikey.katlar[]` bölgesindeki altıgende `ft`. Delik altıgeninde döşeme yok; çöken döşeme yok.
- **Yaratığın katı:** ayrı alan yok. İrtifası, altıgeninin bir duruş yüksekliğine eşitse o yüzeyde durur (`standingOn`).
  - ⚠ PLAN'daki `kat` alanından sapma. Hücre ızgarası (K71c) zaten irtifadan bant çıkarıyor, kayıt biçimi aynı kalır.
- **Duran yaratık:**
  - "Yerde"dir: havada değil, tırmanmıyor.
  - Aynı yükseklikteki yüzeye yürür (normal maliyet), yüzeyin kenarından yürüyerek inemez.
  - Komut sonunda düşmez; Prone olsa da düşmez.
- **Yüzeyler arası geçiş:**
  - Sur tepesi ↔ yer: `climb` komutu (tırmanma; K71b zarı ve maliyeti).
  - Duvar yüzünde tutunan tepeye yürür ve durur.
  - Kat ↔ kat: merdiven altıgeninde dikey hareket, normal yürüme maliyeti (5 ft = 1 altıgen). Başka yoldan geçilmez; döşeme engel tepesi gibi kesişi keser.
  - Uçan yalnız merdiven/delik altıgeninde döşemeyi geçer.
- **Tavan:** alt katın tavanı = üstteki döşeme. Üst sınır = tavan − boy (en yakın üst döşeme ya da altıgen/oda tavanı).
- **Oda tavanı:** varyant `dikey.odalar[]`: { ft, altıgenler }, yalnız 60+. Okuma sırası:
  1. altıgen `tavan`;
  2. oda;
  3. `tavanBolge`;
  4. `tavanFt`.
- **Düşme:** iniş yüksekliği aşağıdaki en yüksek duruş yüzeyi (yer ya da alt kat), tek `fall`.
- **Deprem:** kat döşemesi yapı sayılır (veride can). Çöken döşemenin altıgenleri yüzey olmaktan çıkar, üstündekiler tek `fall` ile düşer.
- **Görüş:** döşeme, iki ucu farklı tarafta kalan hattı keser ("döşeme"). Merdiven ve delik keser değil.
- **Sürüm:** hepsi 60+. 59 ve altında yeni veri alanları okunmaz.

## Çelişkiler (bugün)

1. **Duvar tepesinde durma yok (K5):** tırmanan, sur tepesinde yalnız üstünden öte yana geçer. Sur yolunda okçu yok.
2. **Tırmanma işareti "havada" demek:** sur tepesine çıkmış yaratık `climbing` ile `isAirborne` sayılırdı.
   - Zorlu arazi ve tuzak muafiyeti alır, K8'de yerde sayılmaz.
   - Duruş için işaretin kalkması gerekir: `altitude_changed` olayına isteğe bağlı `stand` alanı (yeni olay türü yok).
3. **Komut sonu düşüş:** uçmayan, tırmanmayan, irtifası 0 olmayan yaratık düşer. Üst kattaki yaratık her komutta düşerdi.
4. **Yürüyüş irtifayı yok sayar:** irtifası 0 olmayan yürüyen, zemin harflerine göre her yere yürür. Sur tepesindeki biri duvarın içinden "yürürdü" (`s` geçilmez), üst kattaki döşeme dışına yürürdü.
5. **Uçuş döşemeyi bilmez:** birleşik uçuş (A*) ve dikey hareket her düzeyden geçer; kat yok sayılır.
6. **Tavan tek değer:** altıgen tavanı kat bilmez. Üst kat yaratığının tavanı ile alt katınki aynı olurdu.
7. **Görüş döşemeyi bilmez:** alt kattaki üst kattakini döşemenin içinden görürdü.
8. **Düşme hep 0'a:** delikten düşen alt kat döşemesine değil zemine inerdi.
9. **Deprem döşemeyi bilmez:** yalnız nesne ve panel yapıdır.
10. **`floors.ts` ayrı harita:** iki kat aynı anda çizilmez, kattakiler `offFloor`. Bina içi katlar için uygun değil.
    - K72 katları aynı haritada üst üste duran yüzeyler olarak ekler. `floorLink` (Maden Ocağı ↔ Mezar Labirenti) aynen kalır.
11. **Oda tespiti:** K71b'nin kapalı alan tespiti yalnız kapısı kapalı ya da kapısız odaları bulur.
    - Kale grubu dışındaki haritalarda binalar dolu duvar bloğudur (iç mekân çizilmemiş).
    - İç tavanlar ancak kullanıcının vereceği bölgeyle (`ONAYLI_BOLGE`) işlenebilir.
12. **Tavanlı altıgende duvar sonsuz (K71a):** oda tavanı yalnız iç altıgenlere konmalı. Duvar altıgenleri tavansız kalmalı; yoksa sur dışarıdan tırmanılamaz, tepesi yürünemez.

## Değişmeyenler

- Katmansız ve işaretsiz haritalarda her şey 59 ile aynı: `surUstu`, `odalar`, `katlar` yoksa yeni yollar çalışmaz.
- Katman (K71d), hava ızgarası (K71c), tırmanma (K71b) ve `floorLink` aynen.
