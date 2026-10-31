# Sefer haritaları ve ortam sistemi — tasarım (Görev S0)

Durum: tasarım; ilk aşama (yüzey çekirdeği) Görev Y1. Tarih: 2026-10-30; kararlar 2026-10-31 (Görev Z3).

- **Kural çerçevesi:** SRD 5.2.1. SRD'de karşılığı olmayan her şey "**Ev kuralı**" diye işaretlidir.
- **İlham:** çok katmanlı yüzey/element etkileşimli taktik RPG'ler (DOS2 türü). Ad, metin, görsel ya da sayı kopyalanmaz; yalnızca "yüzeyler birbirine tepki verir" fikri alınır. Her yüzeyin kaynağı **mevcut SRD büyüleri, donanımı ya da harita nesneleridir**.
- **Konum:** motorda karşılığı olan katman `map.zones` (`SpellZone`, `src/battle/zones.ts`, Görev B2). Yüzeyler bu katmanın genellemesi olarak tasarlanır; yeni ve ayrı bir sistem kurulmaz.
- **Bağımlılık kısaltmaları:**
  - **H1/H2:** geniş harita (bitti).
  - **A6:** çok altıgenli boyut (motor bayrağı var, arayüzde yok).
  - **Gece B:** ışık/gece görselinin ikinci aşaması (karanlık, ışık kaynakları; yalnızca görsel).
  - **Boss paketi:** efsanevi eylem/direnç (S5) + A6 arayüzü + lair ev kuralı.
  - **Harita 2.0:** yükseklik ve katmanlı harita, nesne katmanı. Henüz yok.
- **Boyut ölçeği:** S < 1 gün, M 1–3 gün, L ≈ 1 hafta, XL > 1 hafta.


## Kararlar (Görev K13A, 2026-10-31; Z3'ün yerine)

Bu bölüm belgenin geri kalanından önce gelir; gövdeyle çeliştiği yerde **bu bölüm geçerlidir**. Hepsi kullanıcı kararıdır (K13A; Z3'ün "Claude kararı" maddeleri bunlarla değişti).

**Ev kuralları:**
- Her ev kuralı veride ayrı bayraktır. Game Master kurulumunda tek listede görünür ve oradan kapatılabilir.
- Açık gelenler: madde 2 ve 3.
- Yeni ev kuralları (barut fıçısı patlaması, alarm koşusu, lair olayları, asit havuzu) varsayılan **kapalıdır**. Yalnızca sefer haritasının bayrağıyla açılır; Klasik haritalarda ve mevcut senaryolarda kapalı kalır.

**Yüzeyler ve elementler:**
1. **Islak zayıflığı: kapalı.**
2. **Su yıldırımı yayar: açık** (≤ 7 altıgen).
3. **Tepkimeler: açık**, her biri ayrı ev kuralı bayrağı:
   - ateş + su = buhar;
   - soğuk + su = buz;
   - ateş + buz = su.
4. **Alevin yanıcı komşuya yayılması: kapalı.**
5. **Asit havuzu:** yalnızca harita nesnesi, ev kuralı.
6. Görev Y1'in eklediği zehir bulutu + ateş patlaması (ev kuralı) Y1 davranışıyla sürer.

**Nesneler ve yükseklik:**
7. **Yağ fıçısı SRD'ye uygun:** kırılınca yağ bırakır, ateşle alev olur.
8. **Barut fıçısı** ayrı nesnedir. Patlaması ev kuralıdır ve yalnızca sefer haritalarında açıktır.
9. **Yükseklik:** yalnızca yarım örtü verir. Yüksekten avantaj ev kuralı olarak var, kapalı.

**Sefer haritasına bağlı kurallar:**
10. **Lair olayları:** ev kuralı, haritadaki bayrakla yalnızca Ejder Yuvası'nda. SRD 5.2.1'de lair action yoktur.
11. **Alarm koşusu (haber taşıma):** eklenir, sefer haritası bayrağıyla açılır.

**Kapsam dışı:**
12. **Kuşatma silahları:** ilk sürümde yok.
13. **Yüzeyler yolculukta sonraki durağa taşınmaz.**

**Davranış:**
14. Yüzey hasarı zar modunu izler (otomatik/elle; zar defteri ve replay ile uyumlu).
15. Yapay zekâ "makul zeki":
    - tehlikeli yüzeyden kaçınır;
    - kazanç yeterliyse yüzeye girer;
    - itme/zorlamayı bilerek kullanabilir.

**Adlandırma:**
- "Gece B": ışık/gece görseli (karanlık ve ışık kaynaklarının görsel aşaması).
- "Boss paketi": efsanevi eylem ve direnç (S5) + A6 arayüzü + lair ev kuralı. Bağımlılık satırlarında bu ikisi ayrı yazılır.

---

## 1. Yüzey / element matrisi (ana bölüm)

### 1.1 Model

**Yüzey:** altıgen başına en çok **bir** yüzey + isteğe bağlı **bir** bulut.

- Bulutlar zemin yüzeyinin üstünde ayrı katmandadır (sis, zehir, buhar). Bir altıgen aynı anda "yağ + buhar" olabilir.
- Veri `data/yuzeyler.json` dosyasında. Her yüzey için: tür, kaynak listesi, süre, tetikler, save/hasar, yayılma, tepkiler, görsel anahtarı.
- Motorda her yüzey bir `SpellZone` olarak saklanır: `zone.surface: <tür>`, sahibi büyücü ya da `map`. Böylece mevcut kancalar aynen çalışır: `zoneStepEvents`, `zoneTurnEvents`, `moveCostFn`, `pruneZones`.

**Tepki:** iki element karşılaşınca tablodan sonuç çıkar. Tepki deterministiktir; zar yalnızca hasar ve save içindir.

- Sonucu `surface_reacted` olayı taşır: eski tür → yeni tür, altıgenler, kaynak.
- Reducer yalnızca olayı uygular. Replay ve zar defteri uyumludur.

**Hasar kipi zar kipini izler:** yüzey hasarı da `rollTag(rng, { by: 'map', kind: 'surface' })` ile atılır.

- Elle zar modunda "herkes" seçiliyse Game Master'dan istenir.
- Defter ve replay mevcut kalıpla aynıdır (`NeedDice`, `dice_rolled`).

**Varsayılan "ıslak":** **ıslak etkisi YOK.** Su yüzeyi yalnızca yıldırımı yayar ve ateşi söndürür.

- "Islak zayıflığı" (ıslak yaratık soğuk/yıldırıma karşı dezavantajlı save) **Ev kuralı** seçeneğidir, kapalı gelir. Bkz. Karar bekleyenler.

### 1.2 Yüzeyler

| Yüzey | Kaynak (yalnızca mevcut) | Süre | Hasar / save | Hareket | Yayılma |
|---|---|---|---|---|---|
| **Yağ** | SRD *Oil* "Dousing a Space" (5 ft kare, Utilize); haritada yağ fıçısı nesnesi (§2). *Grease* yağ **değildir** (SRD: "Nonflammable"); ayrı yüzey "kaygan" | Tutuşmazsa savaş boyu | Yok; tutuşunca → Alev | Normal (SRD yağı zorlu yapmaz) | Yok |
| **Kaygan** | *Grease* (mevcut zone) | Büyü süresi | DEX save ya da Prone (büyü metni) | Zorlu | Yok |
| **Su** | *Create or Destroy Water* (yağmur: 30 ft küp, alevleri söndürür), haritadaki sığ su `n`, derin su `w`, eriyen buz | Kalıcı (harita) / 1 dk (büyü) | Yok | `n` zorlu; `w` mevcut deepWater kuralı | Yok |
| **Buz** | *Sleet Storm* (zemin zorlu + DEX ya da Prone), *Ice Knife* sonrası (**Ev kuralı**, varsayılan kapalı), haritadaki `ice` kuralı (Dağ kış) | Büyü süresi / kalıcı | Girişte DEX save ya da Prone (Sleet Storm metni) | Zorlu | Yok |
| **Zehir bulutu** | *Stinking Cloud* (20 ft küre, Heavily Obscured, tur başı CON ya da Poisoned), *Poison Spray* bulut bırakmaz | Büyü süresi | Büyü metni | Normal | *Gust of Wind* dağıtır (SRD) |
| **Buhar** | Ateş + su tepkisi (**Ev kuralı**; SRD'de kaynak yok), *Fog Cloud* buhar değil sistir | 1 tur | Yok (yalnızca Heavily Obscured; **Ev kuralı**: 1d4 ateş seçeneği kapalı) | Normal | Gust dağıtır |
| **Alev** | Tutuşan yağ (SRD Oil: 5 ateş, giren ya da tur sonu, 2 tur), yanan ağ (SRD Web: 5 ft küp 1 turda yanar, 2d4), *Burning Hands*/*Fireball*'un tutuşturduğu yanıcı nesneler (§2), *Flaming Sphere* (mevcut), haritadaki `f` alev | Oil: 2 tur; Web: 1 tur; nesne: §2 | Oil 5 ateş (sabit); Web 2d4; Burning (SRD hazard) 1d4 tur başı | Normal (yapay zekâ kaçınır) | **Ev kuralı** (varsayılan kapalı): yanıcı komşuya tur sonunda yayılma |
| **Lav** | Yalnızca harita (`~`, Volkan) | Kalıcı | Mevcut lav kuralları (lavaEdge, lavJump…) | Girilemez | Yok (mevcut lavaRise) |
| **Asit** | *Acid Arrow* gecikmeli hasarı (yüzey bırakmaz), *Acid* şişesi (yüzey bırakmaz). SRD'de asit yüzeyi kaynağı **yok** → yalnızca harita nesnesi "asit havuzu" (**Ev kuralı**) | Kalıcı (harita) | 2d4 asit girişte / tur sonu (**Ev kuralı**, SRD tuzak ölçeği) | Zorlu | Yok |
| **Diken** | *Spike Growth* (mevcut zone: 5 ft başına 2d4 delici), *Plant Growth* (zorlu), *Caltrops* (SRD: 5 ft, DC 15 DEX ya da 1 delici + hız 0) | Büyü süresi; Caltrops kalıcı | Kaynağın metni | Zorlu / Caltrops normal | Yok |

### 1.3 Tepki sırası (tek tablo, yukarıdan aşağı ilk eşleşen)

1. **Söndürme:** su/yağmur/Sleet Storm, alev ya da Burning'e değerse → alev söner. SRD Burning: "doused, submerged". Yağ yüzeyi kalır, tutuşmamış olur.
2. **Tutuşma:** ateş hasarı ya da alev, yağa/ağa/yanıcı nesneye değerse → Alev. Kaynak: SRD Oil, Web, Burning Hands, Fireball "flammable objects".
3. **Yıldırım + su:** yıldırım hasarı su yüzeyindeki bir altıgene değerse, o su kümesindeki herkes aynı save'i yapar. Bağlı su altıgenlerinde BFS kullanılır, en çok 7 altıgen.
   - **Ev kuralı:** SRD'de yoktur; ama kullanıcı kararı "su yıldırımı yayar" bunu varsayılan yapar.
   - Hasar bir kez atılır. Save ve DC kaynak büyününkiyle aynıdır (`areaSaveEvents` yolu).
4. **Ateş + buz:** buz → su. **Ev kuralı**, SRD'de yok.
5. **Soğuk + su:** su → buz. **Ev kuralı**, varsayılan kapalı (yalnızca *Ray of Frost*, *Cone of Cold*, *Ice Knife*).
6. **Ateş + su:** buhar bulutu (1 tur). **Ev kuralı**, varsayılan kapalı.
7. **Rüzgâr:** *Gust of Wind* ya da *Wind Wall* bulutlara değerse → bulut dağılır. SRD Gust: "disperses gas or vapor".

**Sıra kuralı:**

- Bir komutun olayları önce hasar/save'i, sonra tepkileri üretir.
- Tepkiler altıgen sırasıyla (col, row) tek geçişte uygulanır. Zincir derinliği 1'dir: tepkiden doğan yüzey aynı komutta yeniden tepkiye girmez.
- Bu, sonsuz döngüyü ve sıra bağımlılığını önler; replay kararlı kalır.

### 1.4 Yapay zekâ ("makul zeki")

- **Yol maliyeti:** `moveCostFn`'e tehlike cezası eklenir: alev +6, diken +4, zehir bulutu +4, buz/kaygan +2. Ceza yalnızca yapay zekânın yol seçiminde kullanılır, kural maliyetinde değil.
- **Fırsat:**
  - Ateş büyüsü seçerken yağ ya da ağ içindeki düşman sayısı puana eklenir.
  - Yıldırımda su kümesindeki düşman/dost sayısı aynı `bestAim` hesabına girer (dost ateşi cezası mevcut).
- **Kendi tuzağına girmez.** Kendi alanı (`owner`) bile olsa tehlikeli yüzeyde tur bitirmez; mevcut Spike Growth davranışının genellemesi.
- **Sınır:** yapay zekâ yüzey **yaratmaz**. Yağ dökmez, ateş yakmak için nesne aramaz. İlk sürümde yalnızca var olanı kullanır.

### 1.5 Arayüz

- Yüzey: altıgen dolgu + desen.
  - Mevcut `.spell-zone` renkli altıgen yer tutucusu genişler: yağ koyu kahve parıltı, buz açık mavi çatlak, su dalga, diken siyah dikenler.
  - Bulut: altıgenlerin üstünde yarı saydam döngü (mevcut `EffectsLayer` `fog` türü, altıgen maskeli).
- Tepki: kısa efekt sprite'ı (`kind: damage`, tek seferlik) + günlük satırı ("Yağ tutuştu (3 altıgen)").
- Alan önizlemesi (R4) tutuşacak altıgenleri turuncu çerçeveyle gösterir.
- Bilgi kutusu (altıgen ⓘ): yüzey adı, kalan süre, etkisi (TR/EN).
- Hareketi azalt: statik desen.

### 1.6 Eksik görseller (sprite listesi)

| Anahtar | Tür | Durum |
|---|---|---|
| `yuzey-yag`, `yuzey-buz`, `yuzey-su`, `yuzey-asit`, `yuzey-diken`, `yuzey-kaygan` | zemin deseni (döşenebilir) | yok |
| `bulut-zehir`, `bulut-buhar` | döngü | yok (`fog` geçici) |
| `alev-zemin` | döngü | `f` harita görseli var; sprite yok |
| `tepki-tutusma`, `tepki-sonme`, `tepki-yildirim-su`, `tepki-donma` | tek seferlik | yok |
| `nesne-fici-yag`, `nesne-sandik`, `nesne-kapi-kirik` | nesne | yok (§2) |

**Motor etkisi:** `SpellZone`'a `surface` alanı, `surface_reacted` olayı, tepki tablosu (saf fonksiyon), hasar tetiklerinden tepki kancası (`damageEffects` sonrası), yapay zekâ ceza tablosu.

- `SAVE_VERSION` artar (yeni olay).
- **Boyut:** L (çekirdek M + görseller M).
- **Bağımlılık:** yok (zones var). Geniş haritada anlamlı: H1/H2.

**Alternatifler:**

- (a) Yalnızca SRD kaynaklı tepkiler: tutuşma, söndürme, rüzgâr. Ev kuralı yok; boyut M.
- (b) Önerilen: (a) + "su yıldırımı yayar".
- (c) Tam matris: tüm ev kuralları açık; denge riski yüksek.

---

## 2. Nesneler, yükseklik, gizlilik ve alarm

**Nesne katmanı:** `map.objects`. Her nesnede tür, altıgen, HP/AC (SRD "Object Armor Class / Hit Points" tablosu), yanıcı, taşınır ve örtü (yarım/üç çeyrek) bilgisi bulunur.

- Örnekler: yağ fıçısı, sandık, masa, kapı, şamdan, mangal.
- **Yağ fıçısı:** kırılınca 3 altıgen yağ (5 ft × 3; SRD Oil'in ölçeği), ateş hasarı alınca doğrudan Alev.
  - SRD'de patlayan fıçı yoktur; patlama hasarı **Ev kuralı** (kapalı).
- **Kapı:** mevcut `gate` kuralı genellenir: aç/kapa (Utilize), kilit (Thieves' Tools DC), kır (AC/HP).
- **Yükseklik:**
  - Mevcut `h`/`z` (yükseklik 1–2) ve `climb` korunur.
  - Yüksekten menzilli saldırıya avantaj SRD'de **yoktur** → öneri: yalnızca yarım örtü (alçaktaki hedefin önündeki siper sayılır). Avantaj seçeneği **Ev kuralı**.
  - Gerçek kat/merdiven **Harita 2.0**.
- **Gizlilik:** mevcut Hide (DC 15, pasif Algı, gece) aynen kalır. Nesne örtüsü `hide` alanına eklenir.
- **Alarm:** her düşman grubunda `alert: calm | suspicious | alarmed`.
  - **Tetikler:** görülen savaşçı (pasif Algı ≥ oyuncunun Stealth'i), gürültü (Thunder hasarı, *Thunderwave* "audible 300 ft", kırılan kapı), görülen ceset.
  - Gürültü yarıçapı veride.
  - `suspicious` → grup en yakın gürültüye yürür. `alarmed` → savaş sırasına girer (bkz. §4).

**Boyut:** nesneler L, alarm M. **Bağımlılık:** nesne çizimi H1 (dünya koordinatı); yükseklik Harita 2.0.

---

## 3. Hedef sistemi

- Mevcut `objective` kuralı (Görev 8c) genişler. Hedef listesi haritada ya da karşılaşmada tutulur:
  - `defeat`: tüm düşmanlar.
  - `reach`: altıgenlere ulaş (kaçış).
  - `protect`: masum/nesne N tur ayakta kalsın.
  - `destroy`: nesneyi yok et (§2).
  - `survive`: N tur dayan.
  - `retrieve`: nesneyi al ve çıkışa götür.
- Birden fazla hedef `all` / `any` ile birleşir. Başarısızlık koşulu ayrıdır: `fail` (masum ölümü, alarm…).
- Arayüz: üst şeritte hedef listesi (✓/✗), haritada hedef altıgeni hüzmesi (mevcut `beamFor`).
- Yapay zekâ: hedef türüne göre hedef seçimi. `protect`te düşman masuma yönelir; mevcut masum davranışı vardır.

**Boyut:** M. **Bağımlılık:** `destroy`/`retrieve` §2'ye bağlı.

---

## 4. Uyuyan gruplar ve alarm

- Mevcut "uyuyan ejderha" (Volkan) genellenir: karşılaşmada grup başına `state: asleep | calm | alarmed` ve `wake` koşulları.
  - Koşullar: gürültü, hasar, Algı.
  - Uyuyan yaratık SRD **Unconscious** değildir (doğal uyku): saldırı onu uyandırır. Uyuyanın Algısı dezavantajlı = pasif −5 (SRD "Passive Perception" dezavantaj kuralı).
- **Sıraya girme:** alarmlanan grup bir sonraki tur başında inisiyatif atar ve sıraya eklenir (mevcut `summoned` gibi `index`li ekleme).
  - SRD "Surprise": ilk turda inisiyatif dezavantajı (5.2.1). Uyandırılan grup buna uyar.
- **Yayılma:** alarmlanan grup komşu grupları (veride bağlantı) 1 tur sonra uyandırır. Haber taşıyan koşu **Ev kuralı**.
- Yapay zekâ: oyuncu partisi yapay zekâyken gizlenmez (bilinen eksik). Bu yüzden sim'de alarm ölçümü yapılamaz; yalnızca "hemen alarm" ve "hiç alarm" iki ucu ölçülür.

**Boyut:** M. **Bağımlılık:** §2 alarm, yapay zekâ gizlenmesi (yok).

---

## 5. Keşif ve sis

- **Savaş sisi:** oyuncu tarafının görmediği altıgenler karartılır. Görüş, mevcut `sight` + `darkness` (`litHexes`) ile hesaplanır.
  - "Görülmüş" altıgen soluk kalır (bellek); düşman yalnızca görülürken çizilir.
  - Game Master ekranında her şey görünür, ama tek ekranda paylaşımlı oyun var. Öneri: "Game Master görünümü" düğmesi (basılı tutunca).
- **Keşif turu (savaş dışı):** savaş başlamadan önce parti haritada hareket eder; sıra yoktur, adım başına zaman işler.
  - Alarm ya da görülme → inisiyatif.
  - SRD'de keşif "Exploration" bölümü serbest anlatım içindir. Bu kip **tasarım kararıdır**, kural değişikliği değildir.
- **Performans:** görüş hesabı her hareket adımında 31×17'de ≈527 altıgendir. Mevcut çizim yalnızca görünen ≈150 altıgeni çizer; sis maskesi tek SVG `mask` ile yapılır.

**Boyut:** sis M, keşif turu L. **Bağımlılık:** H1 (bitti), Gece B (ışık görseli), Harita 2.0 (çok katta görüş).

---

## 6. Kuşatma öğeleri ve Harita 2.0 sınırı

| Öğe | Şimdi (mevcut motor) | Harita 2.0'a kalır |
|---|---|---|
| Sur ve mazgal | `crenel` (örtü), `climb` | Sur üstü ayrı kat, merdiven |
| Kapı | `gate` kuralı, §2 kapı nesnesi | Kale kapısı/parmaklık mekanizması |
| Hendek | `moat` | Asma köprü |
| Kuşatma silahları | Nesne + "Utilize ile ateşle" (SRD'de kuşatma silahı yok → **Ev kuralı**, veriyle stat bloğu) | Mancınık yay yörüngesi, yıkılabilir duvar |
| Kule | `z` yükseklik 2 | Kule içi kat |

Öneri: kuşatma silahları ilk sürümde yok. Önce nesne + kapı + hedef (`destroy` kapı) yapılır; "Kale Baskını" (§8) bununla oynanabilir.

**Boyut:** şimdiki sütun M, Harita 2.0 sütunu XL.

---

## 7. Ejderha boss

- **Gövde:** A6 açıkken Huge 7 altıgen, Gargantuan 19. Boss haritası `multiHex` bayrağıyla açılır; arayüzde bayrak boss karşılaşması için görünür olur.
- **Efsanevi eylemler** (SRD: "Legendary Action Uses: 3 (4 in Lair)") ve **Legendary Resistance:** bilinen eksik. Boss'tan önce yapılmalı.
  - Model: başka yaratığın turu bitince `legendary_action` komutu, tepki sistemiyle aynı karar kancası (`askReaction` kalıbı).
- **Lair actions:** SRD 5.2.1'de **yok**. Yalnızca "in Lair" sayaç artışı var (efsanevi eylem 3→4, direnç 3→4).
  - Öneri: "in Lair" sayaç artışını uygula (SRD).
  - İnisiyatif 20'de ortam olayı (lav fışkırması, tavan çökmesi, yüzey yaratma) **Ev kuralı** olarak harita verisinde `lair` listesi; kapalı gelir.
- **Gece B:** ejderha yuvası karanlık. Işık kaynakları (`litHexes`) ve karanlık görüş mevcut. Gece B'nin görsel aşaması boss'un okunabilirliği için gerekli.
- **Uyandırma:** mevcut uyuyan ejderha + §4 alarm.
- **Denge:** ejderhalar efsanevi eylemsiz zayıf ölçülüyor (DENGE.md). Efsanevi eylemle yeniden ölçülmeli; canavar verisi değiştirilmez.

**Boyut:** efsanevi eylem/direnç L, lair (ev kuralı) S, A6 arayüzü M. **Bağımlılık:** Boss paketi (S5 + A6 + lair), Gece B (yuva karanlığının görseli), §1 (yuvada yüzey).

---

## 8. Örnek haritalar

### 8.1 Kale Baskını (31×17, Kale ve avlu türevi)

**Hedef:** `any(destroy: kapı-iç, reach: kule)` ve `fail: alarmed + 6 tur`.

**Düzen:**

- Batıda orman kenarı; parti başlangıcı burada (Hide yerleri).
- Hendek ve kapı.
- Avluda uyuyan muhafız grubu (§4) ve devriye.
- Kilerde yağ fıçıları (§2): avluyu Alev'e çevirme fırsatı.
- Doğuda kule (yükseklik 2).

**Yüzeyler:**

- Kiler yağı.
- Kuyu çevresinde su; *Shocking Grasp* ve *Lightning Bolt* fırsatı.
- Kış varyantında avlu buzu.

**Ölçüm:** iki uçta 30 tohum: "sessiz giriş" (alarm yok) ve "tam alarm".

**Gerekenler:** §1 (yağ, alev, su), §2, §3, §4. Harita 2.0 gerekmez.

### 8.2 Ejder Yuvası (31×17 ya da 48×28, Mağara türevi)

**Hedef:** `defeat(ejderha)` ya da `retrieve(hazine) + reach(çıkış)`.

**Düzen:**

- Dar giriş geçidi (Hide).
- Kristal ışıklı ön oda.
- Yuva salonunda Huge ejderha (A6, 7 altıgen).
- Lav yarıkları (`~`, mevcut lav kuralları).
- Hazine yığını nesnesi.

**Yüzeyler:**

- Kırmızı ejderha varyantında nefes, yanıcı nesneleri tutuşturur (Fire Breath "flammable objects" metni varsa; yoksa yok).
- Mavi varyantta su birikintisi + yıldırım nefesi (§1.3 kural 3).

**Lair (Ev kuralı, kapalı):** inisiyatif 20'de tavan çökmesi (DEX save, 2d6, zorlu zemin bırakır).

**Gerekenler:** §1, Boss paketi (§7: efsanevi eylem, A6, lair), Gece B (karanlık görseli).

---

## 9. Aşamalı yol haritası ve J0 ilişkisi

| Aşama | İçerik | Boyut | Bağımlılık | J0 aşaması |
|---|---|---|---|---|
| S1 | Yüzey çekirdeği: SRD tepkileri (tutuşma, söndürme, rüzgâr), yağ/alev/su/buz/kaygan/diken, olay + replay, yapay zekâ cezası | M–L | zones (var) | Y5'ten önce |
| S2 | Nesne katmanı (fıçı, kapı, sandık), Object AC/HP | L | H1 | Y3 (ganimet nesnesi) |
| S3 | Hedef sistemi genişletme | M | S2 (destroy/retrieve) | Y5 |
| S4 | Uyuyan gruplar + alarm | M | S2 | Y5 |
| S5 | Efsanevi eylem/direnç | L | — | Y5 (boss) |
| S6 | Boss paketi + Ejder Yuvası | M | Boss paketi (A6, S5, lair), Gece B | Y5 son durak |
| S7 | Sis + keşif turu | L | H1, Gece B | Y7 |
| S8 | Kuşatma, katlar | XL | Harita 2.0 | Y7 sonrası |

**İlk dilim:** "Kale Baskını" için S1 + S2 + S3 + S4 gerekir (yüzeyler, nesneler: fıçı ve kapı, hedefler: kapıyı yık ya da kuleye ulaş, uyuyan muhafızlar ve alarm). Bu dilim J0'ın Y1 doğrusal yolculuğuna bir "zor durak" olarak bağlanır. Boss paketi ve Gece B bu dilimde gerekmez.

---

## 10. Mevcut haritalara yükseltme (H3), kapsam dışı ve riskler

**H3:** her harita için tek satırlık yükseltme önerisi.

| Harita | Öneri |
|---|---|
| Ada | Kıyı suyu yüzey olur (yıldırım yayılır); fırtına varyantında yağmur alevleri söndürür |
| Bataklık | Sığ su `n` su yüzeyi; bataklık gazı bulutu (**Ev kuralı**, tutuşur) kapalı seçenek |
| Çöl | Kum fırtınası (mevcut) bulutları dağıtır; yüzey yok |
| Dağ | Kış varyantında buz yüzeyi (mevcut `ice` kuralı) yüzey modeline taşınır |
| Dungeon | Hazine odasında yağ fıçısı ve kapı nesnesi; tuzak (mevcut) nesne olur |
| Gemi | Güverte yağ fıçısı (patlama Ev kuralı kapalı); fırtınada yağmur |
| Kale | Kapı nesnesi + `gate` birleşir; mangal (yanıcı) |
| Mağara | Kristal ışığı (mevcut); su birikintisi yüzeyi |
| Orman | Çalı yanıcı (Burning Hands/Fireball "flammable objects"); gece varyantında yayılma kapalı |
| Şehir meydanı | Pazar tezgâhları nesne (örtü, yanıcı); çeşme suyu |
| Taverna | Masalar nesne (devrilir = yarım örtü), yağ lambaları kırılınca yağ |
| Volkan | Lav aynen kalır; lava değen buz/su → buhar (Ev kuralı kapalı) |
| Orman yolu / Kale ve avlu / Mağara (orta) | Sırasıyla dere suyu + yanıcı çalı; Kale Baskını tabanı; Ejder Yuvası tabanı |

**Kapsam dışı:**

- Rüzgârın yangını taşıması
- Element karışımlarının zincirleri (derinlik > 1)
- Fizik tabanlı akış (yağın yokuştan akması)
- Yaratıkların yüzeyden element kazanması (alevli silah vb.)
- Ağ üzerinden çok oyunculu sis

**Riskler:**

1. **Denge:** yüzeyler büyücü partisini güçlendirir (Fireball + yağ). Sim'de "yüzeyli/yüzeysiz" iki ölçüm gerekir.
2. **Performans:** her hasar olayında tepki taraması. Altıgen başına tek yüzey ve zincir derinliği 1 ile sınırlıdır.
3. **Replay:** tepkiler olaya yazılmazsa sürüm farkında farklı sonuç çıkar. Bu yüzden tepki sonucu olayda taşınır, yeniden hesaplanmaz.
4. **Okunabilirlik:** çok katman (yüzey + bulut + alan + efekt) küçük ekranda karışır. Öncelik sırası ve "hareketi azalt" statik desen gerekli.
5. **Kural kayması:** ev kuralları birikir. Her biri veride bayraklı ve kapalı gelir; Game Master kurulumunda tek liste.

---

## Karar bekleyenler

Kapandı (Görev Z3, K13A ile güncellendi): bütün maddeler yukarıdaki "Kararlar" bölümünde.
