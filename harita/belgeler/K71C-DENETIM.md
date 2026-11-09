# K71c denetimi: "bir altıgende bir yaratık" varsayımı (Görev 0)

Taban `wip/k71b` 1422229, kural sürümü 57. Kuyruk K71c (sürüm 58) prizma hava ızgarasını getirir.

- **Hücre ve düzey:** her altıgenin üstünde 5 ft'lik düzeyler (prizma hücreleri) vardır. Düzey = irtifa / 5, yer = 0, işaretli tamsayı.
- **Kaplama:** yaratık, ayak izi × [düzey, düzey + boy − 1] hücrelerini kaplar. Boy düzey olarak: Tiny/Small/Medium 1, Large 2, Huge 3, Gargantuan 4.
- **Paylaşım:** iki yaratığın hücreleri çakışmıyorsa aynı altıgende durabilirler.
- **Motor:** irtifayı yine sayı olarak tutar; ikinci harita verisi ya da kayıt biçimi yok.

Bu belge, motorda ve arayüzde altıgen başına tek yaratık varsayan yerleri listeler. Her satır için sürüm 58 kararı verilir: değişen, değişmeyen ya da sonraya kalan.

**Karar dili:**
- **58:** sürüm 58'de hücre çözücüsüne bağlandı.
- **aynı:** davranış zaten irtifalı ya da hücre bilgisi gerekmez.
- **açık:** sonraki kuyruğa kaldı (K71d / K72 / K73).

## Tek doluluk sorgusu

`movement.ts` `occupantAt(state, at, exceptId)`: altıgeni kaplayan (`covers`, çok altıgen dahil), hedef alınabilir ilk başka yaratık. 29 dosyada 59 çağrı var.

**58:** isteğe bağlı dördüncü parametre `band` (düzey aralığı) eklendi.
- Verilirse yalnız bandı çakışan yaratık doludur.
- Verilmezse yer bandı [0, 0] kullanılır: yerdeki yaratık doludur, havadaki (en alt hücresi ≥ 1) dolu değildir.
- Bütün eski çağrılar bu varsayılanla, yani "yere varış" anlamıyla çalışır: çağırma, yerleştirme, atlama inişi, ada atlaması, nesne fırlatma, imza haritaları, canavar yetenekleri, YZ yer taraması.
- Hareket eden yaratığın kendi bandı gereken yerler bandı açıkça verir; bunlar aşağıdaki tablodadır.
- Hızlı yol: savaşta irtifası 0 olmayan yaratık yoksa her şey eski koddan geçer. `cellStats.full` sayacı artmaz.

## Alan alan

| # | Alan | Dosya / işlev | Bugün (57) | 58 kararı | Fark |
|---|---|---|---|---|---|
| 1 | Yürüyüş varışı | `executeMove` hedef doluluğu | `occupantAt` (2B) | **58:** yürüyenin varış bandıyla | Uçan, yerdeki yaratığın üstündeki boş hücrede durur; yerdeki de havadakinin altında durur |
| 2 | Yürüyüşte geçiş | `hexCostFn` `enemyAt`/`allyAt` | Düşman altıgeni geçilmez, dost geçilir | **58:** düşman yalnız bantlar çakışıyorsa engel | Uçan, düşmanın üstünden geçer (K6: "geçer ama duramaz" kalktı, durabilir de) |
| 3 | Dikey hareket | `vertical_move` (uçuş, Levitate, tırmanma) | Doluluk denetimi yok | **58:** varış bandı başka yaratığın bandıyla çakışırsa red; yol boyunca düşman hücresinden geçilmez | Uçan, yerdeki yaratığın içine inemez |
| 4 | Birleşik hareket | `move` + `toFt` (yeni isteğe bağlı alan) | Yok: dikey ve yatay ayrı komut | **58:** (altıgen, düzey) uzayında 3B en ucuz yol; çapraz adım (altıgen + düzey) tek adım; uzaklık max(yatay, dikey) (K9) | Uçan bir komutla hem ilerler hem yükselir/alçalır |
| 5 | Uçuş üst sınırı | `altitudeCapFt` | Açık gökte 120 ft (`irtifa.maxFt`), tavanlıda tavan − boy | **58:** açık gökte `ucusUstFt` (varyant verisi; yoksa 60 ft = 12 düzey); tavanlıda aynı (K68b) | 60 ft üstü uçuş 58'de yok; eski kayıttaki 60 ft üstü irtifa komut sonunda sınıra iner |
| 6 | Fırsat saldırısı | `features.ts` `leavesReach` | 2B gövde aralığı; isabet `checkReach` irtifalı | **58:** 3B erişim: uzaklık = max(altıgen aralığı, düzey aralığı) × 5 ft. Dikey hareket ve birleşik adım da erişimden çıkarsa tetikler | Düşmanın yanından dikine yükselen uçan, fırsat saldırısı yer |
| 7 | Erişim / menzil | `altitude.ts` `reachFt` | max(yatay, \|Δirtifa\|) | **58:** dikey bileşen bant aralığı (alt hücre − üst hücre) | Large'ın (2 düzey) 10 ft üstündeki uçan 5 ft'te; Medium için aynı |
| 8 | İtme / çekme | `forced.ts` `pushOutcome`, `motion.ts` | Hedef altıgen doluysa durur, çarpar | **58:** itilenin bandıyla doluluk | Havadaki itilen yerdeki yaratığın üstüne itilebilir |
| 9 | Düşme | `fall.ts` `fall` | Varış altıgeni denetlenmez | **58:** iniş hücresi (yer bandı) doluysa en yakın boş altıgene iner, ek hasar yok (`map_effect.moveTo`) | Uçuşu biten yaratık alttakinin içine düşmez |
| 10 | Işınlanma | `teleport.ts` | `occupantAt` (yer) | **58:** ışınlananın bandıyla | Havadaki ışınlanan yerdekinin üstüne gelebilir |
| 11 | Çok altıgen varışı | `bodyFitProblem` (K69) | Gövde altıgenleri × doluluk | **58:** gövde × bant | Büyük uçan, küçüklerin üstünde durabilir |
| 12 | Tırmanan (K71b) | `climbing.ts`, `climbMove` | İrtifa sayısıyla duvarda | **58:** bandı hücre çözücüsünde (dikey tırmanma varışı ve duvar boyunca yürüyüş) | Duvarda iki tırmanıcı aynı hücrede olamaz; duvar tepesinde durma yine yasak (K5/K72) |
| 13 | Engel tepesi (K71a) | `obstacleTopFt` | Uçan irtifa ≥ tepe ise geçer | **aynı:** 20 ft duvar düzey 0–3'ü kaplar; uçan 4. düzeyden (20 ft) itibaren aşar | Yok |
| 14 | Alan büyüleri | `areaReachesAltitude`, `altitudeInZone` | Merkez zeminde; küre/küp yarıçap, silindir `heightFt`; yaratık irtifası ≤ tepe | **aynı** (kullanıcı kararı): aynı altıgendeki yer ve hava yaratığı ayrı ayrı denetlenir (hücre varlığı) | En alt hücre ≤ tepe ≡ irtifa ≤ tepe: sonuç farkı yok |
| 15 | Aura (`auraCore`, Spirit Guardians, Paladin) | `gap` (2B) | İrtifaya bakmaz | **açık** (K73): aura yarıçapı dikeyde ölçülmez | 30 ft yukarıdaki uçan 10 ft auranın içinde sayılır (değişmedi) |
| 16 | Siper / görüş | `cover.ts` `evaluateAlt` | Araya giren yaratık hat onun boyu içinden geçerse | **aynı:** zaten irtifa bantlı (K68c) | Yok |
| 17 | Hedefleme (motor) | `checkReach`, `lineOfFire` | Aynı altıgen: yatay 0 | **aynı:** yatay 0 + dikey bant aralığı | Hemen üstteki (5 ft) yaratığa yakın dövüş yapılabilir |
| 18 | Otomatik kritik (`withinFiveFt`) | `rules/conditions.ts` | 2B bitişik | **açık:** 2B bitişik kalır | Bitişik altıgenin 30 ft üstünden yakın dövüş zaten erişimde değil; menzilli saldırıda kritik yok |
| 19 | Yakalama / sürükleme | `grapple.ts` | İrtifaya bakmaz | **açık** (K73) | Yok |
| 20 | Yerleştirme (kurulum) | `executePlace`, `nearZone` | Altıgen başına bir | **aynı:** kurulumda herkes yerde | Yok |
| 21 | YZ yer taraması | `ai.ts` `reachable` | `occupantAt` | **58:** uçan için sınırlı düzey (yer, düşük, seyir) + birleşik hareket (Görev 3); diğerleri aynı | Uçmayan YZ değişmez |
| 22 | Arayüz jetonu | `MapBattle.tsx` jeton, `tokenCenter` | Altıgen merkezinde tek jeton; irtifa rozeti | **58:** havadaki jeton hafif yukarıda + yerde gölge; "Hava" görünümü ve düzey seçici | Yer görünümü aynı |
| 23 | Arayüz seçim | `onToken`, `onHex` | Jetona dokunma | **aynı:** üst üste jetonlar kaydırıldığından ikisi de dokunulur; Hava görünümünde seçili düzey dışı jetonlar soluk ve dokunulmaz | — |
| 24 | Kayıt | `battleSave.ts` | Olaylar | **aynı:** yeni olay türü yok; `move.toFt` komutta, olaylar `moved` + `altitude_changed`; `SAVE_VERSION` 22 | Yok |
| 25 | Eksi düzey | `fissure.ts` (yarık), `altitude` < 0 | Yarıkta eksi irtifa | **şema:** düzey işaretli tamsayı (`levelOf`), eksi düzey yalnız hücre sayımına girer, davranışı yok | Yok |

## Alan büyüleri farkı (istenen rapor)

- **Davranış aynı:**
  - Merkez zeminde.
  - Küre/küp yarıçapı dikeyde, silindir `heightFt`, çizgi 5 ft.
  - Yer alanı ve yüzey yalnız 0'da.
- **Eklenen tek şey:** aynı altıgende yerdeki ve havadaki yaratık artık birlikte bulunabildiği için ikisi de ayrı ayrı sayılır.
  - Bugünkü kod zaten yaratık başına denetliyordu, değişiklik gerekmedi.
- **Hücre yuvarlaması:** düzey = ⌊irtifa / 5⌋.
  - "En alt hücre ≤ tepe" ile "irtifa ≤ tepe" aynı sonucu verir; tepe hep 5'in katı.
- **Sonuç:** fark yok.
