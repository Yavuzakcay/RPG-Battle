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
| Tam test (`wip/binek-plan` = `main` f740c07) | **375 dosya geçti + 1 atlandı; 4410 test geçti + 7 atlandı; 0 kırık** (`npx vitest run`, 681 sn) |
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
| **MB5 YZ (tamam, 73)** | Parti/düşman binicisi, kontrollü binek planı, inme eşiği, uçan yığın (K73a), "binmiş başla" | 72 (yalnız YZ, K73a kalıbı) | Orta | ≈ 12 + `sim:yz-sure` binekli sahne | 0 | **≤ +%15** binekli sahne, binicisiz ≤ +%2 |
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

---

## 11. MB1 sonucu (kural sürümü 68)

**Görev 0, açıkların testle doğrulanması** (`src/battle/binekMb1.test.ts`; düzeltmeden önce sürüm 68 durumunda koşuldu):

| # | Açık (§1.1) | Sonuç |
|---|---|---|
| 1 | `syncRiders` irtifayı eşitlemiyor | **Doğrulandı** (uçan binek 20 ft'e çıktı, binici 0'da kaldı) |
| 2 | Binicinin ışınlanması geri alınıyor | **Doğrulandı** (Misty Step sonrası binici bineğin altıgeninde) |
| 3 | İtilen binici geri çekiliyor | **Doğrulandı** (Shove sonrası binici bineğin altıgeninde) |
| 4 | Hücre doluluğu (binici ve binek aynı bant) | **Doğrulandı, koşullu**: bugün gözlenmiyordu; irtifa eşitlemesiyle ortaya çıkıyor (istisna kapatılınca `occupantAt` bineğin hücresinde biniciyi döndürüyor) |
| 5 | `riderCleanup` başarılı save'de de indiriyor | **Doğrulandı** |
| 6 | Bineğin isteği dışında itilmesi tetik değil | **Doğrulandı** (save yok) |
| 7 | Binicinin Prone olması tetik değil | **Doğrulandı** |
| 8 | Binicinin `vertical_move`'u açık | **Doğrulandı** (kendi uçuşu olan binici bineğin üstünde 10 ft'e çıktı); `climb` ve `jump_down` aynı korumaya alındı |
| 9 | Binme maliyeti yukarı yuvarlanıyor | **Doğrulandı** (25 ft hızda 3 altıgen) |
| 10 | Ölü binekte save atılıyor | **Doğrulandı** (B10'a göre fark) |
| 11 | Lance `twoHandedUnlessMounted` okunmuyor | **Doğrulandı** (binekte değilken kalkanla saldırı kabul ediliyordu) |
| — | Summon Dragon ruhuna binilebiliyor | Doğrulandı (genel kural: aynı taraf, Large, uçar); MB1'de değişmedi, çağrı/paket binek alanı MB7 |
| — | Kontrollü binek ve YZ binek kararı yok | Doğru (kapsam MB2, MB5); test yazılmadı |

Doğrulanmayan açık yok.

**Yapılanlar (sürüm ≥ 68; 67 ve altı birebir):**

- **B1 yığın:** binici bineğin altıgenini ve irtifasını izler (`syncRiders(state, prev)`, `mounted` olayında irtifa). Bineğin üstündeki binici hücre kaplamaz (`riderCore.ts` `seatedRider`, `movement.ts` `occupantAt`). Komut sonu irtifa düşüşü ve kırpması biniciye işlemez (`altitude.ts`).
- **B3:** binme/inme hızın yarısı, 5 ft'e aşağı, en az 5 ft. Prone binemez (önce kalkar; `needsStand` kendiliğinden kaldırır).
- **B8 ⚠:** bineği yeni Prone olan ya da kendisi Prone olan binici DEX 10. Başarıda binici Prone olmaz (kalkar: `condition_changed present: false`, "Binekte kaldı"), üstte kalır. Başarısızsa bineğin 5 ft içinde boş altıgene düşer, Prone (`dismounted.fell`). Tetik yalnız komutta yeni Prone olunca (yerde yatan binekte sonraki komutlar save istemez).
- **SRD düşme:** bineği isteği dışında itilen (`pushed` olayı; itme, sürükleme, konveyör) binici DEX 10.
- **B9 ⚠, B24:** binicinin kendi konumu ya da irtifası bir olayla değişirse (ışınlanma, itme, Levitate) bineğe geri çekilmez; komut sonunda save'siz, bulunduğu yerde iner.
- **B10:** ölü ya da kaybolmuş binekten save'siz iniş. Baygın/Incapacitated binek: eski davranış (DEX 10 yalnız Prone'u belirler, her durumda iner).
- **Binicinin komutları:** `climb`, `jump_down`, kendi `vertical_move`'u reddedilir.
- **B11 ⚠ (MB1 parçası):** binme şartı: bineğin irtifası + bineğin boyu + binicinin boyu ≤ tavan. Binicisi üstündeki binekte `altitudeCapFt` yığın boyuyla (binicinin tam boyu: Medium +5, Large +10). Plandaki "binicinin boyunun yarısı" ifadesi plandaki sayılarla çelişiyordu; sayılar (Medium +5, Large +10) esas alındı.
- **B13 ⚠ (koruma):** binicisi üstündeki binek kazamaz (irtifa eşitlemesi kazmada tutarsız yer altı binicisi üretirdi); suya dalış serbest.
- **B23:** Lance (`AttackOption.unlessMounted`, `handBusy`): binekte değilken diğer el doluysa (kalkan, yan el) saldırı reddedilir; binekte diğer el doluyken Great Weapon Fighting uygulanmaz.
- **B6 ⚠ (kısmi):** binicinin bandı kendi boyuyla bineğin irtifasından (bineğin bandının alt düzeyi). Yerdeki yakın dövüşçü Huge bineğin binicisine 5 ft'ten vurur. Bineğin üst düzeylerindeki yaratıkla bant aralığı farkı MB3'e.
- **B7:** fırsat saldırısı yalnız bineğe (zaten öyleydi; sahne testiyle doğrulandı). Alan büyüsünde binici ve binek ayrı hedef (sahne testi).
- Yeni olay türü yok: `dismounted` olayına isteğe bağlı `fell`. `SAVE_VERSION` 22. Günlük: "X binekten düştü." (TR/EN).

**Doğrulama:**

- `binekMb1.test.ts`: 15 test.
- Regresyon (`binekRegresyon.test.ts`): 4 senaryo × 30 tohumda 67 = altın (MB1 öncesi ağaç) ve 68 = 67.
- Ana parça 376,78 kB. `check:harita` 96/0, `check:ses` 15/0.
- Tam paket: 379 dosya, 4444 test geçti (7 atlandı), 0 kırık.

**MB3'e bırakılan açıklar:**

- Uçan binekten düşen binici bineğin 5 ft içine düşer ve komut sonu irtifa düşüşüyle (`fall`) yere iner. Binek de düşüyorsa (Prone/Incapacitated uçan), binici save'i geçse bile bineğiyle birlikte **hasarsız** iner (eşitleme). İki ayrı `fall` (B12) MB3'te.
- Binicili binek tavanı alçak altıgene yürüyerek girebilir. Yığın boyu yalnız binmede ve irtifa üst sınırında. `moveCostFn` ve `airPath` (B11) MB3'te.
- Kat döşemesi ve Forcecage kutusunda yığın boyu yok (B11).
- Yüzen binek binicisiyle dalınca binici batık sayılır, ama nefes ve su soluma ayrıca denetlenmedi.
- Binicili tırmanma (B14) MB3'te.
- Fey Step varışı yığınla gider (eski davranış), tavan/multiHex sığması denetlenmiyor.
- Havadan inme/binme (`toFt`) MB3'te.
- B6'nın tamamı (binicinin bandı = bineğin bandı) MB3/MB4'te.
- Çok altıgende binicinin gövdesi bineğin ayak izi (MB4).

---

## 12. MB3 sonucu (kural sürümü 69)

Tek sabit `src/battle/binekSurum.ts` `BINEK_MB3_VERSION` (`binekMb3On`). 68 ve altı birebir.

**Görev 0, açıkların testle doğrulanması** (`src/battle/binekMb3.test.ts`; düzeltmeden önce sürüm 69 durumunda koşuldu):

| # | Açık (§11 "MB3'e bırakılan") | Sonuç |
|---|---|---|
| 1 | B12: binek düşerken save'i geçen binici bineğiyle hasarsız iniyor | **Doğrulandı** (binici binekte kaldı, can 40/40) |
| 2 | Yığın boyu yürüyüş/uçuşta yok (B11) | **Doğrulandı** (10 ft tavanlı altıgene binicili Large binek girdi; 15 ft tavanda 5 ft'te uçarak girdi) |
| 3a | Kat döşemesinde yığın boyu yok | **Doğrulandı** (10 ft döşemenin altına girdi; döşeme altında binildi) |
| 3b | Forcecage küpünde yığın boyu yok | **Doğrulandı** (10 ft kutuda binici itilmedi) |
| 4 | Bineği dalan binicinin nefesi | **Doğrulandı, farklı nedenle**: binicili binek hiç dalamıyordu (`verticalCellProblem` biniciyi dolu hücre sayıyordu: "Hücre dolu: A"). Engel kalkınca nefes sayacı binicinin kendi tur sonunda zaten işliyor (ayrı düzeltme gerekmedi). Aynı hücre hatası binicili uçan bineğin 5 ft alçalmasını da engelliyordu. |
| 5 | B14: binicili tırmanma | **Doğrulandı** (tırmanma hızı olmayan binek binicisiyle duvara tırmandı) |
| 6 | Havadan binme/inme | **Doğrulandı** (20 ft'teki bineğe yerden binildi: 2B bitişiklik) |
| 7 | Fey Step varışında yığın | **Doğrulandı** (10 ft tavanlı altıgene ışınlandı) |
| 8 | B6: binicinin bandı = bineğin bandı | **Doğrulandı** (15 ft'teki uçan, Huge bineğin binicisine bitişik değildi) |
| 9 | B13: bütün kazma girişleri | **Doğrulandı** (`canBurrow` binicili bineğe true; kazmış bineğe binildi) |

Doğrulanmayan açık yok.

**Yapılanlar (sürüm ≥ 69):**

- **B12:** komut sonu irtifa denetimi (`altitude.ts`), düşecek bineğin binicisini önce bineğin 5 ft içine indirir (`dismounted.fell`, `riderCore.ts` `fallOffSpot`). Sonra ikisi ayrı ayrı düşer: ayrı hasar, ayrı düşme tepkileri (Feather Fall, Slow Fall), ayrı Prone. Binicinin DEX 10 save'i (MB1) yalnız bineğin üstünde kalıp kalmayacağını belirler; binek düşüyorsa binici her durumda ayrılır. Levitate biten binek süzülerek inerse binici üstünde kalır. Kendi uçuşu olan binici ayrılır, düşmez.
- **B11 ⚠ (yığın boyu):** `movement.ts` `stackFitProblem` (bineğin irtifası + bineğin boyu + binicinin tam boyu; MB1 yorumu: Medium +5, Large +10):
  - `moveCostFn`: yürüyüş ve birleşik uçuş (`airMove.ts` aynı işlevi kullanır), altıgen tavanı ve kat döşemesi.
  - `slabProblem`: dikey harekette döşeme.
  - `airMove.ts` `slabOk`: uçuş aramasında döşeme.
  - `mountProblem`: döşeme altında binme.
  - `teleportProblem`: bütün ışınlanma varışları, Fey Step dahil.
  - Forcecage (`forcecage.ts` `cageOpenEvents`): yığın küpün kenarından (`data/binek.json` `kafesBoyuFt`: kutu 10, kafes 20 ft) uzunsa binici dökümde dışarı itilir, binek tutsak kalır (⚠ yorum: SRD "too large to fit" bineğe değil yığına uygulandı).
- **Dikey hücre:** bineğin üstündeki binici `verticalCellProblem`'de hücre kaplamaz (MB1 `occupantAt` istisnasının dikey eşi). Dalış ve alçalma çalışır. Dalan binicinin nefesi kendi tur sonunda (`breathTurnEndEvents`).
- **B14 ⚠:** tırmanma hızı olmayan binek binicisiyle tırmanamaz: `climb` komutu, yukarı `vertical_move` (uçuş, Levitate, merdiven ve suda yükselme hariç), K71b Çeviklik tırmanışı (`dexClimber` false). Tırmanma hızlı binek tırmanır, binici irtifasını izler.
- **Havada binme/inme:**
  - `mountProblem`: 3B bitişiklik (`adjacent3D`). Yer altındaki ya da duvarda tutunan (tırmanma hızı olmayan) bineğe binilmez.
  - `dismount.toFt`: varış hücresi binicinin bandında boş olmalı. Farklı irtifa yalnız uçabilene, bineğin bandının 5 ft yakınında ve tavan altında. Olay `dismounted.toFt`.
  - Uçamayan binici havadaki binekten bineğin irtifasında iner ve komut sonunda düşer.
- **B6 ⚠:** binicinin dikey bandı bineğin bandı (`riderCore.ts` `bandSizeOf` → `vertical.ts` `absBand`, `altitude.ts` `reachFt`). Kapsadığı yollar:
  - 3B uzaklık (`gap3D`): yakın dövüş, otomatik kritik, fırsat saldırısı, auralar, menzil (`rangeGap`).
- **B13 ⚠:** `burrow.ts` `canBurrow` binicisi üstündeki binekte false. Kapsadığı yollar: komut (`vertical_move`), YZ kazma adayları (`burrowCommand`, `burrowCommand65`).
- Yeni olay türü yok: `dismounted.toFt` isteğe bağlı alan, komut `dismount.toFt`. `SAVE_VERSION` 22. Günlük metni yeni değil (MB1 "binekten düştü").

**Doğrulama:**

- `binekMb3.test.ts`: 15 test (Görev 0'ın 9 açığı + 4 sahne + 68 eski davranış), uçtan uca senaryolarda replay aynı.
- Regresyon `src/sim/binekMb3Regresyon.test.ts`: 68 altın (MB3 öncesi ağaç `main` b659f68), 69 = 68. Çöl, Kale, Mağara, Orman × 1 ve × 30 tohum.
- Ana parça 376,78 kB. `check:harita` 96/0, `check:ses` 15/0.
- Tam paket: 382 dosya, 4473 test geçti (7 atlandı), 0 kırık.

**Kalan açıklar:**

- **MB4 (çok altıgen):**
  - Binicinin gövdesi bineğin ayak izi.
  - `stackFitProblem` ve tavan denetimi yalnız çapa altıgeninde; çok altıgenli bineğin gövdesinin bütün altıgenlerinde değil.
  - `fallOffSpot` bineğin çapasının komşusunda (gövdenin dışında olmayabilir).
  - Forcecage'de çok altıgenli binek + binici.
- **MB7:**
  - Find Steed / Phantom Steed binek kolları (Otherworldly Steed `unsupported` kalkar).
  - Paket yaratığında `binek` alanı (Ejder Muhafızı: 14. seviyeden yalnız sahibi biner).
  - Çağrılan paket yaratığına binme kısıtı.
- **MB2:** kontrollü binek turu (B4), eğitimli binek listesi.
- **MB5:** YZ binicisi.
  - Uçan yığının yükselme kararı (K73a) bineğin kendi kararıyla çalışıyor; binicinin hedefine göre değil.
  - YZ dalışı su soluyamayan biniciyi gözetmiyor (bineğin nefesine bakıyor).
- **MB6:** havada inme irtifası seçicisi (arayüz `dismount` `toFt` göndermiyor; varsayılan bineğin irtifası).

---

## 13. MB7 sonucu (kural sürümü 70)

Tek sabit `src/battle/binekSurum.ts` `BINEK_MB7_VERSION` (`binekMb7On`). 69 ve altı birebir.

**Görev 0, açıkların testle doğrulanması** (`src/battle/binekMb7.test.ts`; düzeltmeden önce sürüm 70 durumunda koşuldu):

| # | Açık | Sonuç |
|---|---|---|
| 1 | Find Steed / Faithful Steed atının binek bağı yok; kuralı olmayan çağrıya (Summon Dragon ruhu) binilebiliyor | **Doğrulandı** (at `summon.mount` taşımıyordu; ruha binilmesi reddedilmiyordu) |
| 2 | Phantom Steed savaşta yok | **Doğrulandı** (kurulumda "Savaş henüz başlamadı" ile reddedildi; büyü savaş dışı notu) |
| 3 | Paket yaratığında `binek` alanı yok | **Doğrulandı** (şema `ilkelAlan` hatası verdi; paket yüklenemedi) |

Doğrulanmayan açık yok.

**Yapılanlar (sürüm ≥ 70):**

- **Binek kuralı (`SummonInfo.mount` = `MountRule`):** çağrılan yaratığa yalnız binek kuralı varsa binilir (`mountProblem`). Alanlar:
  - `ownerOnly`: yalnız çağıran biner.
  - `maxRider`: binicinin en büyük boyutu.
  - `minLevel`: çağıranın seviye eşiği.
  - Veri `data/summons.json` `mount` ve paket yaratığında `binek`; dönüştürücü `riderCore.ts` `mountRuleOf`.
  - Binme/inme, düşme, uçan binek ve yığın kuralları MB1/MB3'ten aynen.
  - Kuralı olmayan çağrıya (Summon Dragon ruhu, paket yaratığı, canavar yeteneği çağrısı) binilmez.
- **Find Steed / Faithful Steed:**
  - At `mount: { kural: dost }` taşır: çağıran ve dostları biner (⚠ yorum).
  - Faithful Steed'in slotsuz Find Steed'i aynı yoldan.
  - Otherworldly Steed'in `unsupported` listesinden "binek" çıktı.
  - Kontrollü binek turu (B4) MB2'ye kaldı. At bugünkü gibi sahibinin ardından kendi turunu oynar (bağımsız binek gibi).
- **Phantom Steed** (büyü verisinde `mb7` bloğu, `spells.ts` `LATER`, `summons.json` `phantom-steed`):
  - Kurulumda ritüel (slotsuz; 1 dakika döküm süresi savaş içine sığmaz).
  - Riding Horse stat bloğu, yürüme hızı 100 ft (`speedFt`), uçmaz.
  - Kendi inisiyatifini atmaz, sahibinin hemen ardından oynar (`after-owner`; ⚠ yorum).
  - 1 saat (600 tur).
  - Herhangi bir hasarda kaybolur (`endsOnDamage` → `summon_vanished` `damaged`; günlük TR/EN "hasar aldı"/"took damage"). Binici save'siz iner (MB1 B10 kaybolan binek).
  - 69 ve altında büyü eskisi gibi savaş dışı; kurulum kapısı sürüme bağlı mekaniğe bakar (`executeSetupSummon`).
  - Arayüz notu ve oluşturucudaki "savaş dışı" etiketi güncel mekanikten.
- **Paket `binek` alanı** (`ilkelSema.ts` `YARATIK_ALANLARI`, doğrulama `yaratikErrors`, belge `PAKET-ILKELLER.md` yeniden üretildi; `check:icerik` tanır):
  - Biçim: `{ "kural": "sahip" | "dost", "enBuyukBinici": "T"–"G", "biniciSayisi": 1, "minSeviye": 1–20 }`.
  - `biniciSayisi` şimdilik yalnız 1.
  - Kurgusal fikstür `tests/fixtures/paket-binek.json`: Titan Ejder (`binek` var, 14. seviye, yalnız sahip) ve Yaban Kurdu (`binek` yok).

**Doğrulama:**

- `binekMb7.test.ts`: 7 test (Görev 0'ın 3 maddesi + 3 paket + 69 eski davranış), replay aynı.
- `summons.test.ts` veri testi güncel sürümün mekaniğine bakacak biçimde güncellendi (Phantom Steed 70+ çağırma; biçimi Riding Horse).
- Regresyon `src/sim/binekMb7Regresyon.test.ts`: 69 altın (MB7 öncesi ağaç `main` b493a10), 70 = 69. Çöl, Kale, Mağara, Orman × 1 ve × 30 tohum.
- Ana parça 388,92 kB (MB7 öncesi main ile aynı). `check:harita` 96/0, `check:ses` 15/0.
- Tam paket: 385 dosya, 4506 test geçti (7 atlandı), 0 kırık.

**Kalan açıklar:**

- **MB2:**
  - Kontrollü binek turu (Find Steed SRD: "functions as a controlled mount while you ride it"; binici Incapacitated olunca bağımsız).
  - Phantom Steed'in kontrollü binek olarak binicinin turunda hareketi.
  - Eğitimli binek listesi.
- **MB4:** çok altıgenli bineğin gövdesi (MB3 §12 kalanları).
- **MB5:** YZ binicisi. YZ çağrılan bineğe binmez; Phantom Steed'i kurulumda yapmaz.
- **MB6:** arayüz:
  - Binme menüsü çağrılan bineği gösterir, ama binek kuralı nedenlerinin metni yalnız Türkçe (motor gerekçeleri).
  - Havada inme irtifası.
- **Paket (Ejder Muhafızı):** gerçek paketin (`icerik/ek-ranger.json`) yaması ayrıca yapılacak (bu oturumda `icerik/` yok). Binek kuralı çağrılan yaratığın boyutunu değiştirmez: Medium binici için ejderhanın 14. seviyede Large olması gerekir (MB1: binek en az bir boy büyük).

---

## 14. MB6 sonucu (yalnız arayüz; kural sürümü 70'te kalır)

`git diff -- src/battle data/kural-surumu.json` boş: kural dosyaları değişmedi. Yeni komut, olay ve Ayarlar anahtarı yok.

**Yapılanlar:**

- **Havada inme irtifa seçici** (`src/ui/dismountOptions.ts`, `src/ui/DismountPicker.tsx`, `MapBattle.tsx`):
  - Uçabilen binici "Binekten in" ipucunda 5 ft adımlı irtifa seçer; seçim `dismount.toFt` olarak gider (bineğin irtifasıyla aynıysa gönderilmez).
  - Seçenekler MB3 motor sınırlarını okur (bineğin bandının 5 ft yakınında, tavan/uçuş üst sınırı altında, yerin altına inmeden); her seçenek geçerli komut, dışındakiler reddedilir.
  - Uçamayan biniciye seçici yok; havadaysa kısa uyarı. 68 ve altında seçici yok.
- **Ret nedenleri TR/EN:** motor metinleri değişmedi; `data/neden-metinleri.json`'a 33 kalıp. Test kaynak metinlerini tarayıp kalıpsız binek gerekçesini yakalar. Binemeyen biniciye menüde neden satırı.
- **Göstergeler:** binici ve bineğinde tek 🐎 rozeti (rozet önceliğinin sonunda, 3 + "+N" bütçesi aynen); altıgen bilgisinde "binek: <ad>" / "üstünde: <binici>".
- **Kurulum:** Phantom Steed kurulum çağırma kutusunda listelenmiyordu (kutu `castingTime: ritual` süzüyordu); `summons.json` `setup` bayrağına çevrildi, binek çağırmalar için doğru TR/EN ritüel notu.

**Doğrulama:** `binekMb6.test.tsx` 12 test (seçici, seçenek–motor bire bir, ret kalıpları, rozet bütçesi, kurulum notu, menü neden satırı, tur sırası); ekran görüntüsü `docs/mb6/hava-inme-secici.png`; ana parça 389,14 kB; `check:harita` 96/0, `check:ses` 15/0; tam paket 386 dosya, 4523 test geçti (7 atlandı), 0 kırık.

**Kalan:** MB2 (kontrollü binek turu), MB4 (çok altıgen), MB5 (YZ binicisi). Hamle önizleme kartında binek satırı yok.

---

## 15. MB4 sonucu (kural sürümü 72)

Not: görev metni bu kaydı "§14" diye anar; §14 MB6'ya ayrılmış olduğu için MB4 §15'te.

Yalnız Game Master anahtarı "Çok altıgenli büyük yaratıklar" (`multiHex`) açıkken ve sürüm 72+ (`src/battle/binekSurum.ts` `BINEK_MB4_VERSION`, `binekMb4On`). Anahtar kapalıyken ve 71'de birebir eski kod.

**Yapılanlar:**

- **Binicinin yeri (⚠ karar):** binici bineğin çapa altıgeninde, tek altıgen. Hedefleme, menzil, görüş, siper ve alan isabeti için binicinin tek altıgeni çapa. `body.ts` `isMultiHex` bineğindeki binicide yanlış döner (Large binici de tek altıgen). Binicinin ayak altı bineğin gövdesidir: `bodyLeaf.ts` `footSize`, mutlak yükseklik ve katman seviyesi bineğinkiyle aynı.
- **Binme:** gövdenin herhangi bir altıgenine bitişikten (K69 `gap` ve MB3 `adjacent3D` zaten gövdeden; test kilitler). Döşeme denetimi gövdenin bütün altıgenlerinde; tavan denetimi zaten gövdeden (`ceilingOver`).
- **İnme ve düşme:** binici gövdenin dışına, gövdeye bitişik boş altıgene iner (çapaya en yakın; `riderCore.ts` `bodyOutsideSpots`). Elle seçilen altıgen gövdeye bitişik olmalı (çapaya değil). Large binicinin kendi gövdesi sığmalı (`bodyFitProblem`). Düşen binici de gövdenin dışına düşer (`riderCleanup` ve B12 `fallOffSpot(..., mount)`). Maliyet MB1 (hızın yarısı).
- **Hareket:** gövde K69 sığma kurallarıyla yürür, binici çapayla taşınır. Dar geçitte gövde sığmazsa ret: "Dar geçit: <binek> gövdesiyle <altıgen> yoluna sığmıyor." (TR/EN kalıbı `data/neden-metinleri.json`). Döndürme yok: K69 şekilleri sabit.
- **Fırsat saldırısı ve erişim:** bineğin gövdesinden (K69); saldırı yalnız bineğe (B7). Değişiklik gerekmedi, test kilitler.
- **İtme:** gövde K69 kurallarıyla itilir, binici çapayla gider; B8/B9 aynen.
- **Yığın boyu (B11):** tavan ve kat döşemesi gövdenin bütün altıgenlerinde (`movement.ts` `stackFitProblem`). Yürüyüş, uçuş, ışınlanma (Fey Step) ve binme bu tek denetimden geçer. MB3'te yalnız çapadaydı.
- **Zorla varış (B24):** itme, kafes ya da gövdenin en yakın sığdığı yere konması sonunda yığın gövdenin bir altıgeninde tavana/döşemeye sığmıyorsa binici save'siz, gövdenin dışına iner. Binek itildiği yerde kalır. Işınlanan binici MB1'deki gibi iner. Bineğin komutlu ışınlanmasında gövde ve yığın sığmazsa ret.
- **Bant:** uçan bineğin binicisinde bant bineğin çapa bandı (MB3 B6; Huge 3 düzey). Test kilitler.
- **Alan:** binek gövdesiyle (`bodyInZone`), binici çapasıyla; ikisi ayrı ve birer kez save. Test kilitler.
- **Kazma, tırmanma, yüzme:** MB3 B13/B14 kuralları gövdeyle aynen; gövde sığmazsa K69 reddeder.
- **YZ:** yeni taktik yok (MB5). K69 tek sayım aynen.
- **Arayüz:** binicinin jetonu ve rozeti bineğin çapa altıgeninde (`tokenCenter`; tek altıgen). Hedef bilgi satırı aynen. Yeni Ayarlar anahtarı yok.

**Doğrulama:**

- **Testler:** `src/battle/binekMb4.test.ts` 17 test.
  - Görev 0: 72 durumunda gövdenin dışına inme ve düşme, dar geçit nedeni, gövdede yığın boyu ve zorla varışta B24 başarısızdı.
  - Öteki maddeler K69 + MB1/MB3 ile zaten doğruydu; testler bunları kilitler.
- **Regresyon:** `src/sim/binekMb4Regresyon.test.ts`, binekli dört senaryo (Çöl, Kale, Mağara, Orman; partinin ilk üyesi Warhorse'un üstünde başlar; kurulum `src/sim/binekStart.ts`), çok altıgen kapalı, 30 tohum.
  - Sürüm 71, MB4 öncesi ağaçtan (`main` 95a1189) alınan altın imzalarla aynı.
  - Sürüm 72 = 71.
- **YZ süresi:** `npm run sim:yz-sure -- 3 col --binek --coklu --kural-surumu 71|72`, ABBA sırası.
  - Karar başına ortalama: 71'de 42,9 ve 40,9 ms; 72'de 41,9 ve 41,0 ms.
  - 41,9 → 41,45 ms (−%1; sınır +%15).
- **Paket boyutu:** ana parça değişmedi (`vite build` 385,42 kB → 385,42 kB; `paket-siniri` ölçüsü 389,88 kB). Savaş parçası +1,72 kB, neden metinleri +0,30 kB.
- **Tarayıcı kontrolleri:** `check:harita` 96/0, `check:ses` 15/0.
- **Tam paket:** 390 dosya, 4586 test geçti (7 atlandı), 0 kırık.
- **Kayıt:** `SAVE_VERSION` 22'de kaldı (yeni olay alanı yok).

**Kalan:**

- **MB5:** YZ binicisi.
  - Büyük bineğin dar geçitten kaçınma planı.
  - Binicinin gövde kenarından saldırı yeri seçimi.
- **MB2:** kontrollü binek turu.
- **MB8:** binekli senaryolar ve denge, tam ölçüm.
- **Çok altıgen genel kalanları** (`harita/belgeler/COKLU-ALTIGEN.md`): döndürme, Large'ın 3 altıgeni.

## 16. MB5 sonucu (kural sürümü 73) — tamam

Yalnız YZ kararı (yeni komut/olay yok; `SAVE_VERSION` aynı). `src/battle/binekMb5Surum.ts` `BINEK_MB5_VERSION`, `binekMb5On`; yardımcılar `src/battle/ai/binekMb5.ts`; 72 ve altında eski karar.

**Yapılanlar:**

- **YZ binicisi (iki taraf):** binici (`riding`) yürüyüş/atlama adayı üretmez (`reachable`; bineğin hareketiyle taşınır). Karar 72 ile aynı; fark kuru çalıştırma sayısında: binicinin turu 98 → 1 reddedilen deneme (`aiStats.tryMisses`). Binicinin eylemi (erişimdeki düşmana saldırı) aynen, bineğin kendi sırasındaki hareketi aynen.
- **Dar geçit:** çok altıgenli yaratığın gövdesi sığmayan çapalar (`bodyFitProblem`: dar geçit, gövde altıgeninde dost) saldırı/yaklaşma yeri sayılmaz (`reachable`). Gövde ve yığın boyu zaten `moveCostFn` ve K73a yaklaşma alanında (`approachField`) hesaba katılıyordu; yol yoksa alan sonsuz kalır ve eski davranış (düz mesafe) sürer.
- **Zorla yer değiştirme:** B24 (biniciyi kayıpsız indirme) dokunulmadı.

**Denendi, eklenmedi (⚠ karar):** "binicisi yakın dövüşçü bineğin saldırı yeri puanında binicinin erişebildiği yeri tercih" (binici çapada tek altıgen, `meleeOf` erişimi). 525 bineğin/düşmanın konumunda (Large ve Huge) 72 ile 73 kararı hiç ayrışmadı, puan 4'ten 40'a çıkarılınca da: bineğin en ucuz saldırı yeri zaten çapanın önde olduğu yöndür; ters yönde çapa bitişik yer gövdeye sığmaz. Ölü kod olacağından kaldırıldı. Huge bineğin binicisi 5 ft erişimle gövde kenarındaki düşmana zaten vuramaz (MB4 tek altıgen modeli).

**Doğrulama:** `src/battle/binekMb5.test.ts` 9 test; regresyon `src/sim/binekMb5Regresyon.test.ts` (4 senaryo, 1 tohum: binekli olmayan 72 imzası `main`'den alınan altınla aynı, 73 = 72; binekli çok altıgen kapalı 73 = 72).

**Kalan:** MB2 (kontrollü binek turu), MB6 (arayüz), MB8 (denge). Binekli ejderha binicisi / "binmiş başla" YZ kararı ve inme eşiği MB5'e alınmadı (yeni komut gerektirir).

---

## 17. MB2 sonucu (kural sürümü 74)

Tek sabit `src/battle/binekMb2Surum.ts` (`BINEK_MB2_VERSION`, `binekMb2On`), kurallar `src/battle/binekMb2.ts`. B4 için seçilen yol **B4-A, birleşik tur**. Sürüm 73 ve altında bütün binekler bağımsız (eski davranış).

**Yapılanlar:**

- **Kontrol türü veriden** (yaratık adıyla koşul yok; `mountControlled`):
  - Çağrıda `data/summons.json` `mount.kontrol: "kontrollu"`: Find Steed (SRD "functions as a controlled mount") ve Phantom Steed (Riding Horse).
  - Paket yaratığında `binek.kontrol` (`kontrollu`/`bagimsiz`, varsayılan bağımsız; şema `ilkelSema.ts`).
  - Çağrı olmayan binek: `data/binek.json` `egitimli`. B2 listesi: Riding Horse, Warhorse, Draft Horse, Mule, Pony, Camel, Elephant.
  - Summon Dragon ruhuna zaten binilmez (MB7).
- **Binme:** kontrollü bineğe binince `mounted.control: "kontrollu"`, bineğe `controlledBy`.
  - Sırası binicinin hemen ardına alınır, inisiyatifi binicininki olur. Geçerli savaşçı değişmez (reducer `controlMount`).
  - Binek bu turda henüz oynamadıysa hareketi ve ekonomisi tazelenir, tur başı kancaları çalışır. SRD: binildiği tur da hareket edebilir.
- **Tur (B4-A):** kontrollü binek kendi turunu almaz (`nextActorPlain` → `mountSkipsTurn`).
  - Binicinin turunun başında bineğin hareketi ve ekonomisi tazelenir (`refreshControlledMounts`, `ridTurn`).
  - Bineğin tur başı ve sonu kancaları binicininkiyle aynı anda çalışır: süreli durumlar, süren etkiler, alanlar, harita tur başı/sonu.
  - Bunun için `end_turn`'ün satır içi kanca zincirleri `turnStartChain`/`turnEndChain` işlevlerine çıkarıldı. Sıra aynı; yeni olay türü yok.
- **Eylem kısıtı (B5):** kontrollü binek yalnız hareket komutları, Dash, Disengage, Dodge ve bineğin bonus eylemleri (`steed_action`: Fey Step…) yapar. Saldırı, büyü ve tur bitirme reddedilir (`controlledCommandProblem`).
  - Komutları yalnız binicinin turunda alır. Binicinin oyuncusu da yönetir (`commands.ts` `controlledGate`).
  - Binicinin `move`/`jump` komutu kontrollü bineğine gider: arayüzün mevcut "yürü" dokunuşu bineği yürütür.
- **Fırsat saldırısı:** yalnız binek tetikler (B7, MB1'den aynen). Disengage'li binekte fırsat saldırısı yok.
- **Bağımsıza dönüş:** inince kontrol düşer.
  - `ridTurn` bu turda bineği atlatır, çift tur olmaz.
  - Sonraki turdan itibaren binek binicinin hemen ardında kendi turunu oynar (SRD: inisiyatifi değişmiş kalır).
  - Binici Incapacitated ya da 0 HP iken binek bağımsız davranır ve binicinin ardından kendi turunu alır.
  - ⚠ Bu, SRD Find Steed kuralının bütün kontrollü bineklere genellenmesidir.
- **B8–B10, B24, B23:** aynen. Binek ölünce binici iner ve kontrol düşer. İtilen bineğin binicisi DEX 10 atar. Lance binekte tek elle kullanılır.
- **YZ (MB5 ile uyumlu):** binici bu adımda bir şey yapamıyorsa kontrollü bineğini yürütür (`ai.ts` `controlledMountStep`).
  - Bineğin yaklaşma, Dash, Disengage ve Dodge kararı bineğin YZ'sinden, binicinin turunda gelir. Binici sonraki adımda saldırır.
  - MB5'in binici aday süzmesi (`riderStays`) aynen.
- **⚠ Yorumlar:**
  - Binildiği turda henüz oynamamış bineğin tur başı kancaları binme anında çalışır. Önceden oynamış bineğin ekonomisi tazelenmez: kalan hareketini kullanır.
  - Bineğin süren etkisi turunu aldırıyorsa (Command) bu, binicinin turunda yok sayılır.
  - Kontrollü bineğin hedef seçimi bineğin kendi YZ'sinden gelir; binici tek altıgende çapada olduğundan sonuç binicinin yakın dövüşüyle örtüşür.

**Doğrulama:**

- **Testler:** `src/battle/binekMb2.test.ts` 16 test.
- **Regresyon:** `src/sim/binekMb2Regresyon.test.ts`, 4 senaryo × 30 tohum.
  - Binekli olmayan savaşta 73, MB2 öncesi ağaçtan (`main` 4b0e400d) alınan altın imzalarla aynı; 74 = 73.
  - Bağımsız binekli savaşta 74 = 73.
  - Kontrollü binekli savaş (74) çökmeden biter.
- **YZ süresi:** `npm run sim:yz-sure -- 3 col --binek --kontrollu --kural-surumu 73|74`, 73/74/74/73 sırası.
  - Karar başına ortalama 28,95 → 26,35 ms (−%9).
  - Karar sayısı 238 → 288 (bineğin adımları); savaş başına toplam süre ≈ +%10.
- **Paket boyutu:** ana parça değişmedi (`vite build` 387,29 kB). Savaş parçası +2,46 kB.
- **Tarayıcı kontrolleri:** `check:harita` 96/0, `check:ses` 15/0.
- **Tam paket:** 395 dosya, 4644 test geçti (7 atlandı), 0 kırık.
- **Kayıt:** `SAVE_VERSION` 22'de kaldı. Yeni olay türü yok; `mounted` olayına isteğe bağlı alan, `Combatant`'a isteğe bağlı `controlledBy`/`ridTurn`.

**Arayüz işi (bu görevde yapılmadı, SD2 eylem menüsüyle):**

- Binicinin çekmecesinde "Binek" bölümü: bineğin Dash, Disengage ve Dodge'u. Motor komutları hazır, `actorId` = binek.
- Hareket önizlemesi bineğin hızıyla. Bugün yürüme dokunuşu bineği yürütür, ama erişim gölgesi binicinin hızından çiziliyor.
- Tur şeridinde kontrollü bineğin binicinin kutusunda gösterilmesi. Bugün binek tur şeridinde kendi yerinde duruyor ama atlanıyor.
- Game Master kurulumunda "eğitimli binek" anahtarı ve "binmiş başla".

**Kalan:** MB6 arayüz işleri (yukarıda), MB8 (denge ve kapanış).


---

## 18. MB8 sonucu ve binek hattının kapanışı (kural sürümü 74'te kaldı)

Planda MB8 için kural değişikliği yazılı değil (§7.2 "Kural sürümü —"); sürüm **74'te kaldı**. Yeni komut, olay, ilkel ya da Ayarlar anahtarı yok; `SAVE_VERSION` 22.

**Yapılanlar (MB8):**

- **Denge ölçümü (hafif mod):** 5. seviye standart parti, 100 tohum, Çöl/Kale/Mağara/Orman × binicisiz/bağımsız/kontrollü; koşucu `src/sim/binekDengeRun.ts` (`binekStart.ts` + `balance.ts`). Tablo ve bulgular `harita/belgeler/DENGE.md` "Kuyruk MB8". Özet: binek Kale'de (71 → 16/22) ve Orman'da (67 → 45/42) partiyi zayıflatıyor; neden YZ: at düşman hattına dalıyor, üstündeki menzilli binici odak oluyor. Düzeltme denenmedi, canavar verisi değişmedi.
- **YZ süresi:** kontrollü binekli Çöl, 73 ↔ 74: karar başına −%5, savaş başına toplam +%14,6 (sınır +%15).
- **Açık soru 2 (Mastiff):** eklendi (`data/binek.json` `egitimli`). SRD 5.2.1 s. 15 (bir boy büyük binek; "horses, mules, and similar creatures"), s. 100 (Mounts and Other Animals tablosu), s. 357 (Medium Beast). Boy kuralı motorda: yalnız Small/Tiny binici. Kontrol `mounted.control` olayında taşındığından replay değişmez. Karar DECISIONS.md.
- **SRD denetimi:** `scripts/srd-denetim.ts` Mounted Combat satırı ve Phantom Steed (MB7 bloğu) güncel; `docs/SRD-DENETIM.md` yeniden üretildi.
- **CLAUDE.md:** binek paragrafı ve "Bilinen eksikler" binek satırı.

**Doğrulama:** typecheck; binek testleri (`binekMb2.test.ts` 17 test: Mastiff testi eklendi); build ana parça 392,39 kB (sınır 420); `check:harita` 96/0, `check:ses` 15/0; tam paket 396 dosya, 4668 test geçti (7 atlandı), 0 kırık. Sürüm değişmediğinden `ruleVersion.test.ts`/`g6.test.ts` ve regresyon testi gerekmedi.

**Binek hattı toplamı (MB1–MB8):**

| Kuyruk | Sürüm | Konu |
|---|---|---|
| MB1 | 68 | Yığın modeli, bin/in maliyeti, düşme tetikleri, ışınlanma/itmeyle iniş, Lance |
| MB3 | 69 | Dikey: yığın boyu, havadan düşme, tırmanma/kazma, havada bin/in |
| MB7 | 70 | Çağrılan binekler: Find Steed, Phantom Steed, paket `binek` |
| MB6 | — | Arayüz: havada inme seçici, ret nedenleri, 🐎 rozeti, kurulum notu |
| MB4 | 72 | Çok altıgenli binek gövdesi (`multiHex`) |
| MB5 | 73 | YZ binicisi, dar geçit |
| MB2 | 74 | Kontrollü binek, birleşik tur (B4-A) |
| MB8 | — | Denge ölçümü, Mastiff, kapanış |

**Bilerek yapılmayanlar:**

- `data/sim-senaryolar.json` binekli senaryoları (atlı devriye, ejder binicisi 15. seviye): senaryo verisinde "binmiş başla" alanı yok; eklemek yeni kurulum alanı demek. Ölçüm `mountedStart` ile yapıldı.
- YZ'nin savaş içinde binmesi ve inme eşiği (B22; yeni komut/karar). Binek YZ'sinin binicinin rolüne bakması (menzilli binici geride kalsın): DENGE.md bulgusu; sonraki YZ kuyruğuna öneri.
- Find Greater Steed (B18; SRD'de yok), çalınmış/düşman bineği (B15), çok altıgende döndürme.
- ⚠ Yorumlar §8'deki gibi kalır (B1, B6, B8–B11, B13, B14 ve MB2'nin Find Steed genellemesi).

**Arayüz işleri (MB6b):**

- Binicinin çekmecesinde "Binek" bölümü: bineğin Dash, Disengage, Dodge'u ve bonus eylemleri (motor komutları hazır, `actorId` = binek).
- Hareket önizlemesi ve erişim gölgesi bineğin hızıyla.
- Tur şeridinde kontrollü binek binicinin kutusunda.
- Game Master kurulumunda "eğitimli binek" anahtarı ve "binmiş başla".
- Hamle önizleme kartında binek satırı.

Binek hattı (MB1–MB8) kapandı; kalan yalnız MB6b arayüzü ve YZ önerisi.
