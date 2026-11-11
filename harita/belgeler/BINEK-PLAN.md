# Kuyruk BINEK-PLAN — Binek (mount) sistemi (PLAN)

Yalnız plan: kod, veri ve test değişmedi. Taban `main` f740c07 (kural sürümü 66, `SAVE_VERSION` 22), dal `wip/binek-plan`.

**Kullanıcı kararı (2026-11-12):** binek mekaniği yapılacak. K57 donması yalnız bu iş için, sınırlı kalkacak (§7.1). Uygulama ayrı kuyrukta yapılacak.

**İlk kullanım:** Ranger **Ejder Muhafızı** (`ejder-muhafizi`, ek paket). 14. seviyede çağrılan ejderha Large olur ve **binek olarak uçar**: binici ejderhayla birlikte uçar. Ardından:

- Paladin/Druid yoldaş-binek büyüleri: Find Steed, Find Greater Steed (⚠ SRD'de yok), Phantom Steed.
- Faithful Steed.
- SRD binek kuralı.

**Paralel şeritler:** K62-ACIK (motor) ve SU (görsel). Bu planın dosyalarına dokunmaz; çakışma noktaları §7.3'te.

**İçerik notu:** `icerik/` kullanıcının kendi içeriğidir, depoya girmez ve bu bulut ortamında yoktur. Ejder Muhafızı için bu belgede yalnız kimlik, ad ve sayı var, özellik metni yok.

## Taban

| Ölçü | Değer |
|---|---|
| Tam test (`wip/binek-plan` = `main` f740c07) | **ölçüm sürüyor** (`npx vitest run`; sonuç sonraki commit'te) |
| Ana parça | 374 742 B (son ölçüm K73f, DECISIONS.md; sınır 420 kB, pay ≈ 45 kB). Bu planda build koşulmadı (kod değişmedi). |
| YZ karar süresi | Son ölçüm K73f: Mantar 1,99 ms, uçan 2,02 ms, katmanlı 1,94 ms (medyan) |
| Binek testi | 1 (`src/battle/k19items.test.ts` "Binek: bin, bineğin hareketiyle taşın, binek Prone olunca düş; kapalıyken binilemez") |

---

## 1. Bugünkü durum envanteri

### 1.1 `src/battle/mounted.ts` (Kuyruk 19, `srdK19` anahtarı, kural sürümü 16+; 86 satır)

| Parça | Ne yapıyor | SRD 5.2.1'e göre |
|---|---|---|
| `mountProblem` / `executeMount` | Bitişik, aynı taraf, en az bir boy büyük, binicisiz yaratığa biner. Maliyet `ceil(speed/10)` altıgen. Olay `mounted` (`cost`). | Boyut ✓, bitişiklik ✓. Maliyet yuvarlaması ⚠: SRD "half your Speed (round down)" der; 25 ft hızda kod 3 altıgen (15 ft) alıyor. Gönüllülük "aynı taraf" ile yaklaşık. "Appropriate anatomy" denetimi yok. |
| `executeDismount` | Bitişik boş altıgene iner, aynı maliyet. Olay `dismounted` (`at`, `cost`). | ✓. Havadan inme (irtifa) yok. |
| `syncRiders` (reducer sonu, `reduce.ts:333`) | Binicinin `pos`'unu bineğinkine eşitler. | ⚠ **Yalnız `pos`.** `altitudeFt` eşitlenmiyor: uçan binek yükselince binici yerde kalıyor, yalnız yatayda izliyor. |
| `riderCleanup` (komut sonu, `commands.ts:255`) | Binek 0 HP / Prone / Incapacitated / kaybolmuşsa binici DEX DC 10. Başarısızsa Prone. **Her durumda** bitişiğe iner. | ⚠ SRD: başarıda binici üstte kalır. Bineğin isteği dışında hareket ettirilmesi tetik değil, binicinin Prone olması da tetik değil. |
| `commands.ts:809` | Binici `move`, `jump` ve `shift_move` yapamaz. | `climb` ve `vertical_move` engelli değil. Binicinin kendi tırmanması `pos` eşitlemesiyle çelişir. |
| Arayüz (`MapBattle.tsx:1530`) | Menüde "Bin" (uygun binek varsa) ve "İn" (altıgen seç). Günlük `L.mounted`/`L.dismounted` (TR/EN var). | Jeton yığını yok: iki jeton aynı altıgende üst üste çiziliyor. |
| Kontrollü binek | **Yok.** Her binek bağımsız: kendi sırasında oynar. | SRD'nin asıl kipi eksik (§2). |
| YZ | **Yok.** `ai.ts` binmiyor, inmiyor, binekten saldırmıyor. | — |

**Kod okumasıyla bulunan olası hatalar** (test edilmedi; MB1'de testle doğrulanacak):

1. **Binicinin kendi ışınlanması geri alınıyor.** `teleported` binicinin `pos`'unu değiştirir, `riding` kalır, reducer sonunda `syncRiders` bineğin yerine geri çeker. Misty Step boşa gider.
2. **İtilen binici de geri çekiliyor.** Thunderwave ya da Shove binicide sonuçsuz kalıyor.
3. **Summon Dragon'ın ruhuna (Large, uçar, aynı taraf) bugün binilebiliyor.** Ruh uçunca binici yerde kalıyor ama yatayda izliyor (madde 1.1, `syncRiders`).
4. **Hücre doluluğu (K71c).** Binici ve binek aynı altıgende ve aynı bantta. `occupantAt` ikisini de dolu sayar. Bugün bir şey bozmuyor, çünkü `mounted.ts` kendi `occupied` işlevini kullanıyor. Ama `fillsBand` çakışma varsayımına aykırı: "aynı hücreyi iki yaratık paylaşamaz".
5. **Lance "Two-Handed (unless mounted)".** Veride `twoHandedUnlessMounted: true` (`data/weapons.json:531`, `src/data/types.ts:139`), ama kodda hiç okunmuyor. `docs/SRD-DENETIM.md` Lance'i "tam" yazıyor ⚠.

### 1.2 Çağırma (R3, `summons.ts`), yoldaş, Find Steed

- **Find Steed** (`data/spells.json`, `data/summons.json` `find-steed`):
  - Çalışır: `turn: after-owner`, Otherworldly Steed (L, hız 60), 4+ slotta `fly 60`.
  - Kuyruk 19 (`steed.ts`): Life Bond, Fell Glare, Fey Step, Healing Touch.
  - Yaratık kaydında `unsupported: ["binek olarak kullanma (mounted combat)"]`.
  - SRD metni: "shares your Initiative count, and it functions as a **controlled mount** while you ride it". Ayrıca: "If you have the Incapacitated condition, the steed takes its turn immediately after yours and acts independently". Fey Step: "teleports, **along with its rider**". Bugün `syncRiders` sayesinde binici de gider; bu tesadüfen doğru.
- **Faithful Steed** (Paladin 5): `partial`. Find Steed her zaman hazır ve uzun dinlenmede bir kez slotsuz (`class-features.json` `faithfulSteed`). Binek yok.
- **Phantom Steed** (`spells.json`): `offCombat` + Game Master notu ("savaşta binek kuralı yok"). SRD: Riding Horse stat bloğu, hız 100 ft, herhangi bir hasarla biter, döküm süresi 1 dakika (ritüel).
- **Find Greater Steed:** ⚠ **SRD 5.2.1'de yok** (`data/srd/spells.json`'da kayıt yok). Ancak ek paket ya da Game Master özel canavarı olarak gelebilir.
- **Ejder Muhafızı:** paket bu kopyada yok (`UCUS-ENVANTER.md` satır 60: "15 (kullanıcı: çağrılan ejderha uçar, binek yok)").
  - U1a'da doğrulandı: paket `cagir` + yaratık `hiz.ucma` → `Monster.fly` ile çağrılan yaratık `vertical_move` ve `move.toFt` ile uçar.
  - `hiz` alanı gevşek doğrulanıyor (DECISIONS.md U1a).
- **Diğer çağrılar:** `ownerBonus` (Flaming Sphere, ruh sürüsü) sahibin bonus eylemiyle taşınır. Bu, "kontrollü binek"e en yakın mevcut model: `nextActor` atlar, `summon_move`.

### 1.3 Gövde, irtifa, düşme, itme, fırsat saldırısı, uçuş

| Sistem | Dosya | Binekle ilgisi |
|---|---|---|
| Çok altıgen | `body.ts` (`bodyOf`, `covers`, `gap`, `footprintOf`, `reachToHex`), `rules/footprint.ts` | Binici bugün bineğin çapa altıgeninde. Gövdesi kendi boyundan (Medium 1 altıgen). |
| Prizma hücreleri | `cells.ts` (`bandOf`, `fillsBand`, `anyAloft` hızlı yolu) | Binici ve binek aynı bantta → "aynı hücre paylaşılmaz" varsayımı bozuk (madde 4). |
| İrtifa / dikey | `altitude.ts` (`altitudeCapFt`, `vertical_move`), `vertical.ts` (`mutlakFt`), `stand.ts` (K72 duruş yüzeyi, kat) | Binicinin irtifası eşitlenmiyor. Tavan ve kat denetimi yalnız bineğin boyuna göre. |
| Uçuş | `airMove.ts` (`airPath`, `executeAirMove`), `flight.ts` (`flySpeed`, `isAirborne`, `hovers`), `flightPrim.ts` (U1a `ucus`) | Binicinin taşınması yok. Binicinin `isAirborne` değeri bineğe bakmıyor. |
| Düşme | `fall.ts` `fall()` (tek işlev, K71b+), `landingSpot` | Binekten düşme bugün `fall` çağırmıyor: havadaki binekten düşen hasar almaz. |
| Zorla hareket | `motion.ts` `forcedMove`, `withArrival`; `forced.ts` | Bineğin itilmesinde binici save yapmıyor (SRD tetiği). Binicinin itilmesi `syncRiders` ile geri alınıyor. |
| Fırsat saldırısı | `movement.ts` `leavesReach` (3B, K71c/K73b) | Kontrollü bineğin hareketi bineğin kendi `move` komutu. Yalnız bineğe fırsat saldırısı yapılır (SRD 5.2.1 ile uyumlu, §2). |
| 3B bitişiklik | `adjacency.ts` (`adjacent3D`, `gap3D`) | Binicinin bandı tanımsız (bineğinkiyle aynı sayılıyor). |
| Su altı / kazma | `underwater.ts`, `underwaterCore.ts`, `burrow.ts` | Batan binekte binici yüzeyde kalıyor. Kazan bineği binici izlemiyor. |
| Kat değiştirme | `floors.ts` `change_floor` | Bütün parti taşınıyor; çift ayrılmaz. |

### 1.4 SRD 5.2.1 binek kuralı: depoda ne var, ne yok

| SRD parçası | Durum |
|---|---|
| Binek şartı: gönüllü, en az bir boy büyük, uygun anatomi | Kısmen. Anatomi yok; gönüllülük yerine "aynı taraf". |
| Binme/inme: hareketin yarısı (aşağı yuvarlama), 5 ft içinden | Var. Yuvarlama ⚠ (1.1). |
| Kontrollü binek: eğitimli; inisiyatif biniciye eşitlenir; binicinin turunda hareket eder; yalnız Dash/Disengage/Dodge; bindiği tur da hareket eder | **Yok** |
| Bağımsız binek: kendi sırası, istediğini yapar | Var (tek kip) |
| Düşme: bineği isteği dışında hareket ettiren etki → DEX 10, başarısızsa düşer, 5 ft içinde boş yere Prone iner | **Yok** |
| Düşme: binici ya da binek Prone olursa aynı save | Yalnız binek Prone. Başarıda da iniyor ⚠. |
| Lance iki elli (binekte değil) | Veri var, kod yok |
| Find Steed kontrollü binek; binici Incapacitated olunca bağımsız | Yok |

---

## 2. SRD 5.2.1 binek kuralı özeti (PDF'ten, "Mounted Combat", s. 15)

- **Binek olabilen:** "A willing creature that is at least one size larger than a rider and that has an appropriate anatomy".
- **Binme ve inme:** "During your move, you can mount a creature that is within 5 feet of you or dismount. Doing so costs an amount of movement equal to half your Speed (round down)."
  - 30 ft hız → 15 ft.
  - Izgarada 5'in katına aşağı yuvarlama önerisi: 25 ft → 10 ft (§8, B3).
- **Kontrollü binek:**
  - Binek yalnız "trained to accept a rider" ise kontrol edilir (evcil at, katır…).
  - İnisiyatifi bindiğin anda seninkine eşitlenir.
  - Senin turunda, senin yönlendirmenle hareket eder.
  - O turda yalnız üç eylem seçeneği vardır: Dash, Disengage, Dodge.
  - Bindiğin tur da hareket edip eylem yapabilir.
- **Bağımsız binek:** "lets you ride but ignores your control". Kendi inisiyatif sırasını korur, istediği gibi hareket eder ve davranır.
- **Düşme:** Bineği isteği dışında hareket ettirecek bir etkide binici DEX DC 10 save yapar. Başarısızsa düşer, bineğin 5 ft içinde boş bir yere Prone iner. Binici ya da binek Prone olursa aynı save.
- **SRD 5.2.1'de OLMAYANLAR** (eski 5.1 kuralları ya da metin dışı; her biri karar):
  - Fırsat saldırısında "saldıran binici ya da bineği seçer" kuralı **5.2.1'de yok**. 5.2.1'de Opportunity Attack, kendi hareketini/eylemini/bonus eylemini/tepkisini kullanmadan yer değiştireni tetiklemez. Binicinin hareketi kendi hareketi değildir; yalnız binek tetikler.
  - Bineğin ölümü ayrıca yazılmamış. 0 HP → Unconscious → Prone → save zinciriyle çözülür. Ölü binek (nesne) için karar gerekir.
  - Binicinin itilmesi ve ışınlanması, siper, yükseklik, tavan ve uçan binekten düşme yazılmamış. Bunlar "Falling" ve "Flying" sözlük maddeleriyle birleştirilir.
  - Binicinin bineğin alanını paylaşması yazılmamış. 2014 DMG'nin "rider occupies the mount's space" yaklaşımı SRD 5.2.1'de yok ⚠.

---

## 3. Önerilen veri modeli

### 3.1 Çift: iki savaşçı, tek yığın (öneri)

**İki savaşçı kalır.** Bugünkü `riding`/`rider` bağı korunur: iki can, iki stat bloğu, iki ekonomi. **Binici bineğe "takılı"** sayılır:

- **Konum:**
  - Binicinin `pos` ve `altitudeFt` değerleri bineğinkinden türetilir.
  - Reducer sonu `syncRiders` sürüm ≥ BİNEK'te irtifayı da eşitler, ayrıca `climbing`, batık ve yer altı durumunu da.
  - Kayıtta iki alan da tutulur (replay aynı kalır).
- **Doluluk:**
  - Binici hücre kaplamaz: `occupantAt` / `fillsBand` binicileri atlar, bugünkü `summon.noSpace` gibi.
  - Bineğin hücreleri yığının hücreleridir.
  - Kazanç: K71c "aynı hücre paylaşılmaz" varsayımı korunur, yerleştirme/varış denetimleri değişmez.
- **Gövde (hedeflenme, erişim, alan, aura):** binicinin gövdesi bineğin ayak izidir (`bodyOf(rider)` = `bodyOf(mount)`; multiHex kapalıyken tek altıgen).
  - Binici, bineğin her altıgeninden erişir ve hedef alınır.
  - Alan, bineğin herhangi bir altıgenine değince binici de içindedir.
  - Ayrı hedeftir, ayrı save yapar. Hasar bir kez atılır (bugünkü `areaSaveEvents`).
- **Bant (3B uzaklık):** binicinin bandı = bineğin bandı (`bandOf(rider)` → `bandOf(mount)`). Bkz. karar B6; alternatif "sırtta, bir düzey yukarıda".
- **Yığın boyu (tavan, kat döşemesi, Forcecage kutusu):** bineğin boyu + 5 ft (Small/Medium binici).
  - Örnek: Large binek 10 ft + 5 = 15 ft; `altitudeCapFt` bunu kullanır.
  - Large binici (Large Form Goliath gibi) Huge bineğe biner: + 10 ft (K68b `boyFt` tablosundan binicinin boyunun yarısı, 5'in katına yukarı).

**Neden tek jeton değil?** Tek savaşçı (birleşik stat) iki can havuzunu, iki ekonomiyi ve iki tarafın (bağımsız binek) ayrı kararını kaybeder. Ayrıca bütün `Combatant` tüketicilerini etkiler. Bugünkü model zaten iki savaşçılı. Değişiklik "türetilmiş konum + doluluk istisnası"yla dar kalır.

### 3.2 Kontrol kipi

Olay `mounted`'a isteğe bağlı alan: `control: 'kontrollu' | 'bagimsiz'`. Yoksa bağımsız; eski kayıtlar böyle oynar.

- **Kontrollü olabilecek binek**, sırayla:
  1. Çağrı tanımında `binek: { kontrol: 'kontrollu' }` (Find Steed, Phantom Steed, paket yaratığı).
  2. Yeni veri `data/binek.json` `egitimli`: eğitimli SRD canavar kimlikleri (Riding Horse, Warhorse, Draft Horse, Mule, Pony, Camel, Elephant; liste kullanıcıyla, B2).
  3. Game Master kurulumunda yaratık başına "eğitimli" anahtarı.
- **Bağımsız binek:** eğitimsiz, gönüllü ve yeterince büyük her dost yaratık (bugünkü davranış).
- **Find Steed:**
  - Binici Incapacitated iken bağımsız davranır (türetilmiş; olay yok).
  - Binilmemişken bugünkü `after-owner` aynen.

### 3.3 İnisiyatif ve tur (kontrollü binek)

**Öneri: birleşik tur (B4-A).**

- **Bindiğinde:**
  - Bineğin sıradaki yeri biniciye eşitlenir (sıra binicinin hemen ardına taşınır).
  - Binek `controlledBy: <binici>` alır.
  - `nextActor` onu atlar; bugünkü `ownerBonus` atlamasıyla aynı yol (`common.ts:67`).
- **Binicinin turunda:**
  - Arayüz ve YZ bineğe komut verir: `move` (`actorId` = binek), `dash`, `disengage`, `dodge`.
  - Tur denetimi: komutu veren savaşçı sıradaki ya da sıradakinin kontrol ettiği binek.
  - Binek başka eylem yapamaz: saldırı, büyü ve Otherworldly Slam reddedilir.
  - Bonus eylemleri ve tepkileri serbest: Fey Step bonus eylem, SRD üç seçeneği yalnız "action" için sayar.
  - Hareket ve eylem binicininkiyle iç içe olabilir: binek 30 ft gider, binici saldırır, binek kalan 30 ft'i gider.
- **Bineğin tur başı ve sonu kancaları** (etki süresi, tepki yenilenmesi, harita tur başı/sonu tehlikesi, yüzey, nefes) binicinin tur başı ve sonuyla aynı anda, bineğe ayrıca çalışır. `turn_started` ve `turn_ended` bineğe de üretilir: yeni olay türü yok, bugünkü olay iki kez.
- **İnince:** kontrol düşer. Binek bu turda tur almaz (zaten aldı) ve sonraki turdan itibaren binicinin hemen ardında oynar (SRD: inisiyatifi değişmiş kalır).
- **Alternatif B4-B (ucuz):** ardışık tur. Binek binicinin hemen ardında kendi turunu alır (`after-owner`), yalnız Dash/Disengage/Dodge. "Vur-kaç" (hareketin ortasında saldırı) yok.

### 3.4 Olay ve kayıt şeması

**Yeni olay türü yok** (öneri). Bugünküler isteğe bağlı alanlarla genişler:

| Olay | Yeni isteğe bağlı alan |
|---|---|
| `mounted` | `control`, `toFt` (havadaki bineğe binme: binicinin uçarken binmesi) |
| `dismounted` | `toFt` (havadan inme / düşme varış irtifası), `fell: true` (düşerek) |
| `save_resolved` | (aynı; etiket "Binekten düşme") |
| `fall` (K71b) | Bugünkü olay. Havadaki binekten düşen binici için. |

- `Combatant`'a yeni isteğe bağlı alan: `controlledBy`.
- Komut: `mount` ve `dismount`'a isteğe bağlı `toFt`. Kontrollü bineğin komutları bugünkü komut türleri.
- **SAVE_VERSION:** 22 kalır. U1a ve K73 ile aynı ilke: yeni olay türü yok, eski kayıtlar alan yokluğuyla eski kuralla oynar.
  - Yalnız uygulamada yeni olay türü gerekirse (örn. savaş içi kontrol kipi değişimi `mount_control`) 22 → 23.
  - O zaman `LOADABLE_VERSIONS` 3–23 olur.

### 3.5 Kural sürümü

- Bugün 66. Şerit B (K62-ACIK) **67'yi alabilir**. Öneri: binek ilk kuyruğu **68** (geçici numara).
- Tek sabit `src/battle/binekSurum.ts` `BINEK_SURUM`, `binekOn(state)` (K73f `k73fSurum.ts` kalıbı). Birleştirme anında numara çakışırsa yalnız bu sabit ve `data/kural-surumu.json` değişir.
- **Çakışma notu:**
  - 67'yi Şerit B almazsa binek 67 olabilir. Ama iki şerit aynı anda 67'ye yazarsa birleştirmede biri 68'e kayar.
  - Regresyon testlerinin altın imzası sürüm numarasına değil "binek öncesi ağaç"a bağlanmalı (K73c `K73C_TOHUM` kalıbı).
- **Alt kuyrukların her biri kendi sürümünü alır** (68, 69, 70…): "68 kayıtları MB1 kuralıyla" ayrımı korunur.
  - Alternatif: hepsini tek sürümde toplamak. Bu ancak MB1–MB4 tek birleştirmede gelirse olur. Öneri değil.
- **Anahtar:** binek kuralları SRD olduğu için `srdK19` Game Master anahtarı altında kalır (yeni ev kuralı yok; K57).
  - Sürüm < BİNEK: bugünkü `mounted.ts` birebir (16–67).

---

## 4. Etkileşimler (öneri; ⚠ = SRD'de yazılı değil ya da sapma)

| Konu | Öneri |
|---|---|
| **Uçan binek** | Yığın birlikte uçar: binici irtifası = bineğin irtifası. `airPath` ve `airReach` bineğin yığın boyuyla aranır (tavan). Bineğin uçuş sınırı (`flyCapFt`, U1a), süzülme (`hover`) ve zorunlu iniş (`pkGlide`) yığına uygulanır. Binicinin kendi uçuşu binekteyken kullanılmaz. |
| **Uçan binekten düşme** | Binici düşerse `fall(rider, mutlak irtifa, 'binek')`. Varış bineğin 5 ft içinde boş yer altıgeni (`landingSpot`), Prone. Binicinin kendi uçuşu ya da Feather Fall varsa düşmez/yavaşlar (bugünkü `fallReactions`). Yeni `FallCause` değeri `binek` (ölçüm etiketi, olay değil). |
| **Uçan binek Prone / Incapacitated / 0 HP** | Binek de düşer (SRD Flying: Incapacitated ya da Prone uçan düşer). İkisi ayrı `fall`. Binici önce DEX 10: başarıda bineğin üstünde kalır ve onunla düşer (aynı yükseklik hasarı). Başarısızsa ayrı düşer, Prone ⚠ (iki yol aynı hasar; fark iniş yeri ve "üstte kalma"). |
| **Yüzen binek** | Yığın birlikte batar (eksi irtifa): binici batık sayılır, nefes kuralı (K73c) binicide ayrı işler. Su soluyamayan binici için YZ dalışı reddeder. |
| **Kazan binek** | ⚠ Binici varken kazma reddedilir (`burrowProblem`: "Binici varken kazılamaz"). SRD yazmıyor; yer altında binici anlamsız. |
| **Tırmanan binek** (Spider Climb, tırmanma hızı) | Tırmanma hızı olan binek duvara çıkabilir; binici `climbing` sayılmaz, bineğe bağlı. K71b herkes-tırmanması (Çeviklik kontrolü) binici varken reddedilir ⚠. Binicinin kendi `climb`/`vertical_move` komutu reddedilir (1.1 madde 4 açığı kapanır). |
| **Bineğin isteği dışında hareketi** (itme, çekme, Gust of Wind, sürükleme, ani sel, konveyör, yarık kayması) | SRD: binici DEX 10. Başarıda bineğiyle gider, başarısızsa düşer: 5 ft içinde Prone, havadaysa `fall`. Tek kanca `forcedMove` ve `pushed` olayından sonra (`motion.ts`). Gönüllü hareket ve ışınlanma tetiklemez (Fey Step "along with its rider"). |
| **Binicinin itilmesi / çekilmesi** | ⚠ SRD yazmıyor. Öneri: itme normal işler ve binici **attan iner** (`dismounted` + `pushed`). Save yok, Prone yok. Havadaysa varışta düşme. Alternatif (B9): DEX 10 ile itmeye direnmek ⚠ ev yorumu. |
| **Binicinin ışınlanması** | Binici iner, varış yerine gider (Misty Step çalışır; 1.1 madde 1 kapanır). Binicinin kendi hareketi değil, maliyet yok. |
| **Yakalama** | Binici yakalanırsa (Grappled, hız 0) binek hareket edince bugünkü "yakalama erişim dışına çıkınca biter" kuralı işler (K73b sürmesi). Yakalanan binek hız 0 olur, yığın durur. Binici bineği, binek biniciyi yakalayamaz. |
| **Yere serme (Prone)** | Binici Prone olursa (Topple, Shove) DEX 10: başarıda Prone **olmaz** ve üstte kalır, başarısızsa düşer + Prone. ⚠ SRD "make the same save" der; başarıda Prone'un uygulanmaması yorum (B8). Binek Prone olursa aynı save; başarıda binici Prone bineğin üstünde kalır. |
| **Ölü binek** | Binek ölürse (`life: dead`) binici kendiliğinden iner, save yok. 0 HP Unconscious → Prone yolundan DEX 10 (başarıda bile iner: ölü/baygın binek "binek" değil) ⚠. |
| **Alan büyüleri** | İki ayrı hedef, iki save, hasar bir kez atılır (SRD "each creature in the area"). Çok altıgende binicinin gövdesi bineğinki (§3.1). |
| **Siper** | Binek biniciye siper vermez, binici bineğe de (SRD'de yok). Hedef seçici yığında ikisini ayrı gösterir. |
| **Fırsat saldırısı** | Yalnız binek tetikler (SRD 5.2.1). Binici, bineğin hareketiyle erişimden çıkınca tetiklemez ⚠ (5.1'in "binici ya da binek" seçimi alınmaz, B7). Binicinin kendi fırsat saldırısı: düşman binicinin erişiminden çıkınca bugünkü gibi. |
| **K8 yüksek zemin** | Yığın yer yüzeyindeyse binici yerde sayılır, binek boyu K8 vermez ⚠ (SRD'de yüksek zemin yok; K8 ev kuralı). Havadaki binekte binici havada (`aloft`), K8 yok. |
| **K9 / 3B erişim** | Binicinin bandı bineğinki (B6). Yerdeki Medium, Huge bineğin binicisine 5 ft erişimle vurabilir. Alternatif "sırt bandı" daha gerçekçi ama Huge binekte yerdeki yakın dövüşçüyü dışlar. |
| **Tavan ve alçak yer** | Yığın boyu (§3.1) tavanı aşıyorsa binilemez. Binek bu altıgene binicili giremez: `moveCostFn` yığın boyuyla; Large at + binici 15 ft, tünel 10 ft → binici inmeli. Hızlı yol: tavansız haritada denetim yok. |
| **Çok katlı bina (K72)** | Yığın tek katta (irtifadan). Merdiven `vertical_move` binekle yürünür; yığın boyu kat döşemesini aşarsa geçilmez. Delikten düşmede iki `fall`. `change_floor` çifti birlikte taşır, binici bineğin üstünde kalır. |
| **Dragonborn Draconic Flight / Celestial Kırık Kanat / paket `ucus`** | Binekteyken açılabilir, etkisi yok; binek uçarken binicinin uçuşu süre harcamaz. Havadaki binekten inme (`dismount toFt`) yalnız binicinin etkin uçuşu varsa, yoksa düşme. Kırık Kanat `pkGlide` (zorunlu iniş) binekteyken işlemez ⚠. |
| **Fey Step, çağrı ışınlanması** | Binek ışınlanınca binici gider (bugünkü `syncRiders`). Varış: yığın boyu ve multiHex gövdesi sığmalı. |
| **Polymorph / Wild Shape / Enlarge-Reduce** | Boyut değişimi binek şartını bozarsa (binek artık bir boy büyük değil) binici iner, save yok ⚠. Bineğe dönüşen Druid'e binilebilir (gönüllü, boyut tutuyorsa). |
| **Hedeflerde kaçış / bölge çıkışı (`explore`)** | Kontrollü binek binicisiyle birlikte sayılır (çift). |

---

## 5. Yapay zekâ

**Kapsam:**

- **Parti binicisi ("Yapay zekâ oynasın") ve düşman binicisi:**
  - Kontrollü binek: YZ binicinin turunda bineğin hareketini planlar. Aday yerler bineğin `speedHexes`/`airReach`'inden; ekonomi bineğin, Dash bineğin eylemi.
  - Saldırı yeri puanı bugünkü gibi; hareketin ortasında saldırı (vur-kaç) basit kalıp: önce git–vur, sonra kalan hareketle güvenli yere.
- **Binme kararı:**
  - Savaş içinde YZ binmez (MB5 ilk adım).
  - Düşman binicileri Game Master kurulumunda "binmiş başla" ile gelir (`battle_started` sonrası `mounted cost: 0`; kurulum olayı).
- **İnme kararı:**
  - Bineğin canı ≤ eşik (`data/yapay-zeka.json` `binek.inCan`).
  - Tavan/tünel yolu kesiyor.
  - Binici yakın dövüşçü ve hedef yalnız binek dışı bir katta.
- **Uçan binek (Ejder Muhafızı):** K73a `riseCommand`/`landCommand` yığına uygulanır: menzilli binici yerdeki yakın dövüşçünün erişim bandının üstüne çıkar, yakın dövüşçü binici iner.
- **Bağımsız binek:** kendi YZ'si bugünkü gibi. Binicisini "taşıyan" olarak yalnız risk hesabında: düşme riski, binicinin canı.

**Süre:**

- **Hızlı yol:** `anyRiders(state)` (cells `anyAloft` gibi), binicisiz savaşta tek tarama. **Tahmini maliyet +%0–1** (hedef ≤ +%15).
- **Binicili sahne:** bineğin hızı genelde yüksek (60 ft) → aday kümesi büyür (yarıçap 12, ≈ 470 altıgen; 30 ft'te ≈ 130).
  - Tahmin **+%10–25** (kontrollü binekte binici + binek tek plan).
  - Kapı: yeni `sim:yz-sure` sahnesi "binekli" (Kale, iki atlı + ejder binicisi). ≤ +%15 olmalı.
- **Önlem:** bineğin erişim kümesi bir karar içinde bir kez hesaplanıp binici planına paylaşılır. Adaylar bugünkü hızlı canavar sınırlamasıyla örneklenir.

---

## 6. Arayüz

- **Düğmeler:**
  - "Bin" (var). Kontrollü/bağımsız bilgi ipucunda.
  - "İn" (var). Havada: "Uç ve in" (etkin uçuş varsa) ya da yok.
  - Kontrollü binekte binicinin çekmecesinde **"Binek" bölümü:** Hareket (bineğin hızıyla), Koşu (Dash), Çekil (Disengage), Kaçın (Dodge); bineğin bonus eylemleri (Fey Step…).
- **Jeton:**
  - Yığın: binek jetonu altta; binici jetonu %70 ölçekte, üstte, hafif yukarı kaymış (`Avatar` katmanı).
  - Multihex bineğin çapa merkezinde.
  - Binicinin halka/hüzme işaretleri binicinin jetonunda. Havadaki yığın tek gölge (K71c çizimi).
- **Seçim:**
  - Yığın altıgenine dokunma sırayla binici ↔ binek seçer.
  - Hedef seçiminde iki ayrı hedef satırı (hamle önizleme kartı K58 ikisini ayrı gösterir).
- **Tur şeridi:** kontrollü binek binicinin kutusunda küçük rozet (🐎 yerine SVG `src/ui/icons.tsx`). Bağımsız binek kendi kutusunda.
- **Metin (TR/EN, `strings.ts` + `strings.en.ts`; savaş metinleri tembel `strings.tr2.ts`):**
  - `mountControlled`/`mountIndependent`, `mountMenu`, `mountDash`/`mountDisengage`/`mountDodge`.
  - `fellFromMount`, `dismountAir`, `mountTooTall` ("Tavan alçak: binekle geçilmez").
  - `mountTrained` (Game Master kurulumu), `startMounted`.
  - Neden metinleri `data/neden-metinleri.json`.
- **Mobil:** yığın dokunma döngüsü (uzun basma yok). "Binek" bölümü çekmecede ayrı sekme. 15×7 pencerede jeton ölçeği 0,7 en az 32 px (dokunma hedefi).
- **Game Master kurulumu:** jetonu bineğin üstüne bırakınca "binmiş başla" (uygunluk `mountProblem`'den). Yaratık kartında "Eğitimli binek" anahtarı.

---

## 7. Alt iş bölümü ve sıra

### 7.1 K57 sınırlı kaldırma kapsamı (önerilen metin `docs/MEKANIK-DONMA.md` istisnalarına)

"Kuyruk BİNEK (MB1–MB8): yalnız binek sistemi." Bunun kapsamı:

- `mount`/`dismount` komutlarına `toFt`.
- `mounted`/`dismounted` olaylarına isteğe bağlı alanlar.
- `Combatant.controlledBy`.
- `data/binek.json`.
- Çağrı ve paket yaratığında `binek` alanı (paket ilkeli değil, yaratık alanı).
- Find Steed / Phantom Steed savaş kolları.

Başka yeni mekanik yok. Yeni ev kuralı yok.

### 7.2 Alt kuyruklar

| Kod | Kapsam | Kural sürümü | Risk | Tahmini test | Ana parça | YZ süre kapısı |
|---|---|---|---|---|---|---|
| **MB1 Çekirdek SRD** | Yığın modeli (§3.1: türetilmiş `pos`+irtifa, binici hücre kaplamaz, gövde = bineğin ayak izi); maliyet aşağı yuvarlama; düşme tetikleri (isteği dışında hareket, binici/binek Prone; başarıda üstte kalır); binicinin ışınlanma/itme ile inmesi (1.1 madde 1–2); `climb`/`vertical_move` reddi; ölü binek; Lance; `anyRiders` hızlı yolu | 68 | Orta (reducer eşitlemesi, replay, hücre istisnası) | ≈ 25 + regresyon (`BINEK_TOHUM`: 4 × 30, duvarlı 6 × 50, katmanlı 8 × 20; binicisiz senaryoda 66/67 = 68) | ≈ 0 (motor tembel) | Binicisiz ≤ +%2 |
| **MB2 Kontrollü binek** | `control`, `controlledBy`, birleşik tur (§3.3), eylem kısıtı, tur kancaları, `data/binek.json` eğitimli listesi, Find Steed kontrollü + Incapacitated'da bağımsız | 69 | **Yüksek** (tur sırası, `nextActor`, tur başı/sonu kancaları, tepki yenilenmesi) | ≈ 20 | ≈ 0 | — (YZ dokunulmaz; MB5) |
| **MB3 Dikey** | Uçan/yüzen/tırmanan binekle taşıma, yığın boyu (tavan, K72 kat, Forcecage), havadan düşme (iki `fall`), havadan in/bin (`toFt`), Fey Step varışı, su altı nefesi | 70 | **Yüksek** (K71c hücre, `airPath`, `stand.ts`) | ≈ 20 + duvarlı/katmanlı regresyon | ≈ 0 | Uçan sahne ≤ +%5 |
| **MB4 Çok altıgen** | Binicinin gövdesi bineğin ayak izi, erişim/alan/aura, inişte gövde bitişiği, varış sığması (multiHex açıkken) | 71 (ya da MB3 ile aynı) | Orta | ≈ 10 | 0 | — |
| **MB5 YZ** | Parti/düşman binicisi, kontrollü binek planı, inme eşiği, uçan yığın (K73a), "binmiş başla" | 72 (yalnız YZ, K73a kalıbı) | Orta | ≈ 12 + `sim:yz-sure` binekli sahne | 0 | **≤ +%15** binekli sahne, binicisiz ≤ +%2 |
| **MB6 Arayüz** | Yığın jetonu, seçim döngüsü, "Binek" bölümü, kurulumda binmiş başla ve eğitimli anahtarı, TR/EN, mobil; tek ekran görüntüsü | — (görsel) | Düşük–orta | ≈ 8 arayüz testi | TR menü metni ≈ +0,3 kB (savaş metinleri tembel) | — |
| **MB7 Büyü ve paket** | Find Steed binek (`unsupported` kalkar), Faithful Steed `partial` → `ok` adayı, Phantom Steed savaşta (kurulumda ritüel, Riding Horse + hız 100, hasarla biter), paket yaratığında `binek` (§9), kurgusal fikstür `tests/fixtures/paket-binek.json`, `PAKET-ILKELLER.md` | 73 | Orta | ≈ 15 | 0 | — |
| **MB8 Denge ve kapanış** | Binekli senaryolar (`sim-senaryolar.json` atlı devriye, ejder binicisi 15. seviye), DENGE.md, tam paket, `check:harita`/`check:ses`, SRD-DENETIM Mounted Combat satırı, CLAUDE.md "Bilinen eksikler" satırı | — | Düşük | — | — | Son ölçüm |

Toplam tahmin: ≈ 110 test.

**Sıra:**

```
MB1 → MB2 → MB3 ∥ MB4 → MB7 → MB5 → MB6 → MB8
```

- MB6'nın "İn/Bin" asgari parçası MB1 ile birlikte kalabilir: bugünkü düğmeler zaten var.
- Ejder Muhafızı için en kısa yol **MB1 → MB3 → MB7(paket alanı)**. Bu yolda binek bağımsız kipte olur (MB2'siz, §9).

### 7.3 Bağımlılıklar ve çakışmalar

- **AS1 / AS2:** depoda bu adlarla belge yok; kullanıcının kuyruk adları.
  - Öneri: binek kuyruğu AS1/AS2 bittikten sonra başlar ya da MB1'i paralel yürütür.
  - Çakışma noktaları:
    - kural sürümü numarası (§3.5);
    - `ai.ts`;
    - `summons.ts`;
    - `content/ilkelSema.ts` (paket şeması);
    - `data/class-features.json` (Faithful Steed).
- **Denge turu:** MB8 binekli senaryoları ekler. Eski partilerin tam ölçümü yapılmaz (hafif doğrulama modu); "Dungeondex öncesi tam test turu"na kalır.
- **U1b:** Ejder Muhafızı'nın geçici çözümü U1b'de yazılabilir (§9). MB7 onu yükseltir; U1b, MB'yi beklemez.
- **K62-ACIK ve SU şeritleri:** dosya çakışması yalnız `data/kural-surumu.json` ve `src/battle/ruleVersion.ts` testlerinde beklenir.

---

## 8. Karar listesi

| # | Karar | Öneri | Artı | Eksi | SRD |
|---|---|---|---|---|---|
| B1 | Çift modeli | İki savaşçı + yığın (binici türetilmiş konum, hücre kaplamaz, gövde = bineğin ayak izi) | Bugünkü modelden dar değişiklik; iki can/ekonomi | Her doluluk tüketicisinde binici istisnası | Yazılmamış ⚠ (2014 DMG "aynı alan") |
| B2 | Kontrollü olabilecek binek | Çağrı/paket `binek.kontrol` + `data/binek.json` eğitimli listesi (7 SRD binek hayvanı) + Game Master anahtarı | Veriyle | Liste kullanıcı onayı ister | ✓ ("trained") |
| B3 | Binme maliyeti yuvarlaması | Hızın yarısı ft, 5'in katına aşağı; 0 ise 5 ft | SRD'ye yakın | 25 ft hızda 10 ft (bugün 15) | ✓ (round down) |
| B4 | Kontrollü bineğin turu | **A: birleşik tur** (vur-kaç mümkün) | SRD'ye tam | Tur kancaları karmaşık, MB2 yüksek risk | ✓ |
|  |  | B: ardışık tur (`after-owner`) | Mevcut altyapı | Vur-kaç yok | ⚠ sapma |
| B5 | Bineğin eylem kısıtı | Kontrollüde yalnız Dash/Disengage/Dodge; bonus eylem ve tepki serbest | SRD metni | Fey Step gibi bonus eylemler açık kalır | ✓ (metin yalnız "action") |
| B6 | Binicinin 3B bandı | Bineğin bandı (erişimde ayrım yok) | Basit; yerdeki yakın dövüşçü vurur | Huge binekte gerçekçi değil | ⚠ yazılmamış |
| B7 | Fırsat saldırısı | Yalnız binek tetikler | SRD 5.2.1 | 5.1 alışkanlığına aykırı | ✓ |
| B8 | Prone save'i başarısı | Başarıda binici Prone olmaz, üstte kalır | Okunur | "same save" yorumu | ⚠ yorum |
| B9 | Binicinin itilmesi | İtme işler, binici iner (save yok, Prone yok); havadaysa düşer | SRD'ye en az ek | Shove ile binekten indirmek kolay | ⚠ yazılmamış |
| B10 | Ölü ya da baygın binek | Binici her durumda iner; Unconscious (Prone) yolunda DEX 10 yalnız Prone'u belirler | Tutarlı | Başarılı save'de bile iniş | ⚠ |
| B11 | Yığın boyu (tavan) | Binek boyu + 5 ft (Large binici + 10); tavansız haritada denetim yok | Tünel/kat gerçekçi | Kale/mağara haritalarında binicinin inmesi gerekir | ⚠ (SRD'de boy yok) |
| B12 | Uçan binekten düşme | Ayrı `fall`, bineğin 5 ft içinde yere, Prone; binek de düşüyorsa başarılı binici bineğin üstünde düşer | SRD Falling + Flying | İki düşme olayı | ✓ (birleşim) |
| B13 | Kazan binek | Binici varken kazamaz | Basit | — | ⚠ |
| B14 | Tırmanma | Yalnız tırmanma hızlı binek binicili tırmanır; binicinin kendi tırmanması reddedilir | Açığı kapatır | — | ⚠ |
| B15 | Gönüllülük | Aynı taraf + Charmed/Dominate ile taraf değiştiren dahil; düşman bineğe binilmez | Bugünkü gibi | Çalınmış at senaryosu yok | ≈ ✓ |
| B16 | Anatomi | `data/binek.json` `binilmez` listesi (Ooze, bulut biçimi, Swarm…); yoksa serbest | Saçma binişleri keser | Liste bakımı | ✓ (metin) |
| B17 | Phantom Steed | Savaşta: kurulumda ritüel (Find Familiar gibi), Riding Horse + hız 100, kontrollü, hasarla biter | SRD | Yeni çağrı kaydı | ✓ |
| B18 | Find Greater Steed | Çekirdeğe girmez; yalnız ek paket ya da Game Master özel canavarı | SRD dışı kalmaz | Oyuncu beklentisi | ⚠ SRD'de yok |
| B19 | Kural sürümü | MB başına ayrı sürüm, tek sabit `BINEK_SURUM`; ilk 68 (Şerit B 67) | Replay ayrımı | Çok numara | — |
| B20 | SAVE_VERSION | 22 kalır (yeni olay türü yok); gerekirse 23 | Eski kayıt aynen | — | — |
| B21 | Anahtar | `srdK19` altında; yeni ev kuralı yok | K57 | Binekleri tek başına kapatma yok | ✓ |
| B22 | YZ binme | Savaş içi binme yok; "binmiş başla" kurulumda | Süre ve risk düşük | YZ atını kaybedince yeniden binmez | — |
| B23 | Lance | Binekteyken tek el (`twoHandedUnlessMounted` okunur) | Veri hazır | — | ✓ |
| B24 | Binicinin ışınlanması | İner, varışa gider | Hata kapanır | — | ✓ (doğal) |

---

## 9. Ejder Muhafızı (`ejder-muhafizi`): 14. seviye binek uçuşu

**U1b geçici çözümü (binek gelmeden):**

- Paket yaratığı (ejderha) 14. seviyede Large olur: `boyut` ya da `seviyeEsigi` kalıbı.
- Kendi uçuşu vardır: `hiz.ucma`, U1a'da çalışıyor.
- Binici yanında yürür ya da kendi uçuşuyla izler.
- Yaratık kaydına şimdiden `binek` alanı **yazılmaz**: U1b'de alan şemada yok, `ilkelAlan` hatası verir.
- ⚠ Bugün aynı taraf + Large olduğu için `mount` komutu ejderhaya zaten binmeye izin veriyor (1.1 madde 3). Uçunca binici yerde kalır.
- **Öneri:** U1b'de bu yol açık kalmasın.
  - Kural sürümü < BİNEK iken çağrılan paket yaratığına binme reddedilir.
  - Ancak bu bir davranış değişikliği, yani sürüm ister. U1b'nin kendi sürümüne girer ya da MB1'e bırakılır ve U1b belgesinde "ejderhaya binmeyin" notu düşülür.
  - Önerilen: MB1'e bırak, not düş.

**Binek gelince yükseltme (MB1 + MB3 + MB7):**

1. Paket şemasına yaratık alanı `binek: { minSeviye?: number, kontrol: 'kontrollu' | 'bagimsiz', yalnizSahip?: boolean }`.
   - Ejder Muhafızı için öneri: `{ "minSeviye": 14, "kontrol": "kontrollu", "yalnizSahip": true }`.
   - Kontrollü kip MB2'yi gerektirir. MB2 gelmeden `bagimsiz` ile başlanabilir: ejderha kendi sırasında uçar, binici üstünde taşınır.
2. `mountProblem` binek alanına bakar:
   - `minSeviye` sahibin sınıf seviyesinden;
   - `yalnizSahip`: yalnız `summon.by`;
   - alan yoksa çağrılan paket yaratığına binilmez (sürüm ≥ BİNEK).
3. Uçuş: yığın modeli (MB3) ile binici irtifası ejderhanınki olur. K73a yükselme kararı yığına (MB5).
4. Kayıt uyumu:
   - Paket kopyası savaşçıda (`Combatant.paket`), replay paketten bağımsız.
   - Eski sürüm savaşları alanı yok sayar.
   - Kullanıcının `icerik/` paketine yama: `docs/ek-yama/` kalıbında tek alanlık JSON yaması + `node scripts/ek-yama.mjs` (P7 kalıbı).
   - Paket metni depoya girmez.
5. Test: kurgusal fikstür (`tests/fixtures/paket-binek.json`; gerçek paket metni yok):
   - 13. seviyede binilmez, 14'te binilir;
   - sahip dışı binemez;
   - ejderha 30 ft'e uçar, binici irtifası 30;
   - ejderha Prone → iki düşme;
   - binici ışınlanınca iner;
   - replay aynı.

---

## 10. Açık sorular (kullanıcıya; plan bunları önerilerle varsayar)

1. B4: birleşik tur mu, ardışık tur mu?
2. B2 eğitimli binek listesi: Riding Horse, Warhorse, Draft Horse, Mule, Pony, Camel, Elephant. Mastiff (Small binici için) eklensin mi?
3. B6 / B11: binicinin bandı ve yığın boyu.
4. B9: binicinin itilmesinde save var mı?
5. Ejder Muhafızı ilk sürümü bağımsız kipte mi (MB2'siz, daha erken) yoksa kontrollü mü?
