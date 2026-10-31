# Sabah raporu

## Kuyruk 18 — Volkan Seferi (V0–V5), son özet (yapıştırılabilir)

**V0 atlandı, V1–V5 yapıldı.** Dal `claude/rpg-battle-project-wu0f4f`, kayıt sürümü artmadı.

| Görev | Commit | Ne yapıldı |
|---|---|---|
| V0 | — | `yuzey-alev-4` depoda yok, atlandı. |
| V1 | `9253852` | 4 harita: Işınlanma Salonu, Lav Tapınağı, Kanyon Köprüsü (21×11), Volkanik Demirhane (31×17; çıkışa yalnızca taş zinciri, 2 yağ havuzu, fıçılar). Seçicide "Volkan Seferi" grubu. Yeni hedef türü **VEYA** (düşmanları yen VEYA herkes çıkışa / salonda 3 malzemeyi üniteye taşı). Izgara görselleri `docs/sabah/v1-<ad>-izgara.png`. |
| V2 | `f3cbc0d`, `717a1c6`, `51dc56d` | Sefer motoru: `data/seferler.json` → yolculuk güzergâhı (ikinci motor yok; ilerleme yolculuk kaydında). Ejder düğümü mevcut Volkan "uyuyan ejderha" haritası + SRD Red Dragon Wyrmling; giriş/çıkış sefer verisinde. |
| V3+V4 | `0649a20` | Sefer düğüm haritası (renk şeritleri veriden, kesikli etiketli kenarlar, karanlık/parlak/güncel düğüm, parti işareti) ve ödül sahnesi ("Geri ışınla" seferi bitirir, ana ekrana döner). Game Master ekranında her zaman açık "Sefer" paneli; bayrak açıkken yolculuk listesinde de var. Ekran görüntüsü `docs/sabah/v4-sefer-ekrani.png`. |
| V5 | `f5ac528`, `5b43f29` | Denge (yalnızca düşman listeleri) + Sefer düğmesinin tarayıcı kontrollerini bozması düzeltildi. |

**Zincir (60 tohum, standart parti):** 3. sv Normal **%53** / Kolay **%83**; 5. sv Normal **%63** / Kolay **%90** (hedef 70–85'in üstünde, bırakıldı). İlk ölçümde hepsi %0'dı (seferde dinlenme yeri yok). Tek savaş (dinlenmiş, 40 tohum): salon/tapınak/köprü/demirhane 3. sv 100/100/100/100, 5. sv 100/98/100/100. Ayrıntı `docs/harita/DENGE.md`.

**Doğrulama:** tam test **158 dosya / 1521 test yeşil**; check:harita **208/0**, check:ses **15/0** (`5b43f29`); ana parça **420,8 kB**; yeni haritalarda ulaşılamaz altıgen yok (test), yapay zekâ her haritayı iki taraftan oynadı (simülasyon). VEYA'sız eski senaryolar bit bit aynı (Çöl/Orman/Kale/Kale Baskını).

### Karar bekleyenler

1. **Görseller yok:** `docs/harita/referans/<ad>.jpg` (4 harita + `odul-sahnesi.jpg`) depoda yoktu; haritalar verilen koordinatlarla kuruldu, görselleri yer tutucu. Gelince: `npm run harita-gorsel -- isinlanma-salonu lav-tapinagi kanyon-koprusu volkanik-demirhane odul-sahnesi` (ortadan kırpma hazır). Zemin, gerçek görsele göre yeniden gözden geçirilmeli (özellikle lav sınırları ve merdivenler).
2. **"Ejder Yuvası" haritası depoda yok** (bu dalda da main'de de). Ejder düğümü mevcut Volkan / uyuyan ejderha varyantını kullanıyor; giriş batı, çıkış doğu sefer verisinde. Gerçek harita gelirse yalnızca `data/seferler.json` düğümü değişir.
3. **Seferde dinlenme yeri yok:** beş savaş uzun dinlenmesiz. Düşmanlar bu yüzden epey hafif (ör. 3. sv demirhane 2 scout + 2 cultist + 1 mephit). Öneri: köprü ile demirhane arasına bir dinlenme düğümü; o zaman listeler büyütülebilir.
4. **5. sv Kolay %90:** Kolay'ın diriltme/sınırsız kısa dinlenme kuralından; düşman ayarıyla Normal bozulmadan düşmüyor.
5. **Ödül:** SRD'de hazine tablosu yok; sabit ödül (400 altın, 2 iksir, Cloak of Protection, Potion of Resistance). Eşyalar yolculuk kaydında kalıyor, karaktere/savaşa geçmiyor.
6. **Demirhane ikincil hedefi (fırını söndür) yapılmadı:** su/söndürme mekaniği nesnelerde yok.
7. **Ejder:** Red Dragon Wyrmling (SRD, CR 4), efsanevi eylem yok; uyuyor, eşlikçi 3. sv 1 kobold, 5. sv 1 hell hound.
8. **Kayıt tek yuva:** yolculuk sürerken seferi açmak o yolculuğu gösterir; ayrı sefer yuvası istenirse yeni anahtar gerekir.

## Kuyruk 16 — son özet (yapıştırılabilir)

**Beş görevden dördü yapıldı, biri atlandı** (K16A, K16B, K16D, K16E yapıldı; K16C: `yuzey-alev-4` depoda yok, atlandı). Her görev ayrı commit, `claude/rpg-battle-project-wu0f4f` dalında ve gönderildi; `wip/` dalı yok.

| Görev | Commit | Ne yapıldı |
|---|---|---|
| K16A | `eb6f939` | Sprite alanları tek katmanda: altıgen başına tek tür (öncelik alev > patlama > yağ > gres > buz > su > zehir > buhar > sis > ağ). Taban önbellekli tuvalde (yalnızca yüzey değişince): sıvı/katı tam opak (yağ 0,95, neredeyse siyah), dışa bulanık hale, 1 px iç kenar (su/buz açık, yağ/gres koyu). `sprite-ice`'a magenta anahtar halesi (sentetik test). |
| K16B | `2c317cd`, `5aa772d` | "Ortamlar Diyarı" 31×17 vitrin haritası: bütün 31 zemin harfi, 8 bölge, ortada 9 yüzey türü (3×3; su+buz ve yağ+alev bitişik), nesneler. Harita verisinde hazır yüzeyler (`surfaces`), seçicide "Test ve vitrin" grubu, denge dışı. Ek: ses eşlemesi ve canavar ortamları (tam testte yakalandı). |
| K16C | — | Atlandı: `yuzey-alev-4` yok. Gelince eşlemeye ağırlık 0,5 ile eklenir; alt kenara hizalı çizim için yükseklik oranı ayarı gerekecek. |
| K16D | `ea9e061` | Devriye (grup `route`/`pause`, `patrol_moved`), düşman YZ'si hedef koşucusunu/çıkışı keser, barut fıçısını (alanında ≥ 2 kahraman, 0 müttefik) hedefler. Kale Baskını devriyesine rota. |
| K16E | `050fce7` | Kural sürümü (`kuralSurumu`; yoksa 1). Sürüm 2: Prone saldırısı mesafeyle, Frightened yalnızca kaynak görüş hattındayken (saldırı + yetenek kontrolü, kaynağa yaklaşamaz), Invisible inisiyatif avantajı. |

**Doğrulama:**
- Tam test kuyruk sonunda: **156 dosya / 1511 test yeşil** (ilk koşuda 2 hata: yeni haritanın ses eşlemesi ve canavar ortamı eksikti; `5aa772d` ile düzeltildi, ikinci koşu yeşil).
- check:harita / check:ses: K16B (`2c317cd`) ve son kod commit'i (`5aa772d`) 192/0 ve 15/0 (yeni haritayla 4 kontrol fazla).
- Ana parça **419,1 kB** (≤ 440).
- Regresyon: K16B ve K16D'de Çöl/Orman/Kale/Mağara bit bit aynı; K16E'de `KURAL_SURUMU=1` ile HEAD'e bit bit aynı.

**K16A — kare süresi (headless Chromium, yazılım çizimi; 5 sn, ms):**

| Durum | Görsel | Ortalama | p95 | Hedef |
|---|---|---|---|---|
| 15×7, animasyon açık | 117 | **16,6** | 16,8 | ≤ 20 |
| 48×28 (bütün altıgenler), animasyon açık | 1964 | **23,6** | 50,0 | ≤ 30 |
| 48×28, animasyon kapalı | 1136 | 16,6 | 16,8 | — |

Maske yok (önceki denemede 71 ms); sis/zehir/buharın ikinci kopyası altıgenlerin yarısında (48×28: 34 → 23,6 ms).

**Ekran görüntüleri:** `docs/sabah/k16a-yuzeyler.png` (su 4×4, buz 4×4, yağ 3×3, alev 3×3, gres 3×3, sis 4×4, zehir 3×3), `docs/sabah/k16a-su-buz-sinir.png`, `docs/sabah/k16a-yag-alev-sinir.png`, `docs/sabah/k16a-zehir-yakin.png`; oyunda Ortamlar Diyarı: `docs/sabah/k16b-genel.png`, `k16b-meydan-ust.png`, `k16b-meydan-alt.png`, `k16b-orman-bataklik.png`, `k16b-kale-dag.png`, `k16b-kar-volkan.png`, `k16b-col-magara.png`.
Kabul: sıvı/katı iç altıgenlerde zemin görünmüyor, dış çevre zemine eriyor, türler birbirine binmiyor. **Zehir sprite'ının içinde ince magenta çizgiler duruyor** (depodaki dosya eski araçla işlenmiş): `npm run sprite-ice` ile ham görsel yeniden işlenince yeni magenta hale adımı temizler.

**K16D — Kale Baskını (30 tohum; hobgoblin / insan; hedef 3. sv %35–55, 5. sv %70–90; ayar yok):**

| Durum | 3. seviye | 5. seviye |
|---|---|---|
| K15A (önce) | 40% / 57% | 93% / 80% |
| + kesme ve barut (rota yok) | 60% / 60% | 97% / 83% |
| + devriye rotası (uygulanan) | **53% / 50%** | **87% / 80%** |

**K16E — durum denetimi önce/sonra (kural sürümü 1 → 2; 30 tohum, 3. seviye; parti kazanma):**

| Parti | Çöl | Orman | Kale | Mağara |
|---|---|---|---|---|
| standart | 100 → 100 | 100 → 100 | 93 → 93 | 80 → 80 |
| monk (Open Hand Technique) | 77 → 83 | 77 → 77 | 97 → 97 | 60 → 63 |
| rogue (Cunning Strike) | 80 → 80 | 73 → 73 | 97 → 97 | 73 → 73 |

Open Hand Technique: Monk bitişikten vurduğu için iki sürümde de avantajlı; değişen, partinin bitişikten menzilli saldırısı (dezavantaj → avantaj, yakın düşman dezavantajıyla normal) ve 10 ft erişimli yakın dövüş (avantaj → dezavantaj). Cunning Strike (Trip): uzaktan yay saldırısı iki sürümde de dezavantajlı; pratikte değişiklik yok.

**Karar bekleyenler (Kuyruk 16):**
- **Zehir sprite'ı:** magenta artığı dosyanın içinde; ham görseli yeni `sprite-ice` ile yeniden işle.
- **K16C:** `yuzey-alev-4` ekleyince haber ver (ağırlık 0,5 ve alt kenara hizalı çizim hazırlanacak).
- **Vitrin haritası bölge boyutu:** üst/alt banttaki 4 bölge 9×5/8×5 (6×6 yerine ≥ 40 altıgen); meydana iki sıra yüzey sığsın diye. İstenirse meydan tek sıraya inip bantlar 6 satıra çıkar.
- **Kayıt sürümü:** `kuralSurumu` isteğe bağlı alan olduğu için `SAVE_VERSION` artırılmadı (eski kayıt = sürüm 1). İstenirse 21.
- **Prone sürünme ve isteğe bağlı yere yatma** uygulanmadı (motor yürümeden önce ayağa kaldırır); ayrı görev olabilir.
- **Kale Baskını:** rotasız ara ölçümde parti güçleniyordu (düşmanlar kuleye en yakını kovalıyor); devriyeyle dengede. Başka sızma haritalarında kesme davranışı yeniden ölçülmeli.

## Kuyruk 17 — son özet (yapıştırılabilir)

**İki görev de bitti** (E1 → H). İkisi de daha önce yapılmıştı (Görev E1 `410cfa7`, Görev H `ef17f1c`); baştan yazılmadı, her madde koda ve SRD 5.2.1 metnine karşı yeniden denetlendi ve eksikler kapatıldı. Commit'ler `claude/rpg-battle-project-wu0f4f` dalında ve gönderildi; `wip/` dalı yok.

| Görev | Commit | Ne yapıldı |
|---|---|---|
| E1 | `96c6812`, `7ae610f` | Denetim: her madde yerinde. **Bulunan hata:** `npm run check:icerik` çöküyordu (EN metinleri ayrı parçaya ayrılınca `STRINGS` dışa aktarımı kalkmıştı); `STRINGS_TR` ile düzeltildi, betiği gerçekten çalıştıran test eklendi. |
| H | `fb48b0e` | Incapacitated/Stunned/Paralyzed SRD metniyle tam; eksik tek madde eklendi: inisiyatif atılırken Incapacitated (ve onu içeren durumlar) **dezavantajlı** atar. Frightened/Prone/Invisible raporu `docs/DURUM-DENETIMI.md`. |

**Doğrulama:** tam test kuyruk sonunda bir kez **153 dosya / 1490 test yeşil**; ana parça **418,7 kB** (≤ 440); check:harita 188/0 ve check:ses 15/0 (son commit `fb48b0e`). Hızlı regresyon (H motor değişikliği): Çöl, Orman, Kale, Mağara (3. seviye, 20 tohum) **bit bit aynı**.

**E1 — jenerik alt sınıf şeması (`src/content/schema.ts`, `data/subclasses.json`):**
- Alt sınıf: `id` (küçük harf/rakam/tire, 2–48; SRD ve yüklü paketlerle çakışırsa red, aynı görünen ad iki sınıfta olabilir), `class`, `name` ve `role` (TR/EN), `features`.
- Özellik: `level` (1–20), `name` ve `description` (TR/EN), `status` (`calisir` / `planli` / `hikaye` / `calismiyor`), isteğe bağlı `effect` (class-features.json mekanizmasıyla aynı biçim; bilinmeyen etki red, "çalışır" yalnızca uygulanan etkiyle).
- Etkin seviye = max(seviye, 3).
- Paket: `format`, `version`, `id`, `name`, `author?`, `subclasses`.

**Yükleyici sınırları (`LIMITS`):** dosya 256 KB, en çok 20 paket, paket başına 24 alt sınıf, alt sınıf başına 30 özellik, ad 60 karakter, metin 4000 karakter. Yalnızca JSON, kod çalıştırılmaz; bozuk dosya hata olarak döner, uygulamayı bozmaz; hatalar TR/EN. Ayarlar > Dış içerik: dosya ve klasör seçici, aç/kapa, sil; kayıtlı içerik açılışta yeniden doğrulanır. Silinen içerik: karakter bozulmaz, "içerik eksik", alt sınıf özelliksiz oynar. `.gitignore`: `data/custom/`, `icerik/`; testte yalnızca kurgusal paket (`src/content/fixtures/ornek-paket.json`: "Kehribar Muhafızı", "Sis Yolcusu").

**check:icerik çıktısı (kurgusal paket):** `fighter/kehribar-muhafizi: 4 özellik · çalışır 1, planlı 1, hikâye 1, çalışmıyor 1`, `rogue/sis-yolcusu: 2 özellik · çalışır 1, çalışmıyor 1`; bozuk JSON eklenince "1 hatalı", çıkış kodu 1.

**SRD 12 regresyonu:** 12 alt sınıf × 1–20. seviye kazanılan özellik ve sınıf kiti taşıma öncesi fikstürle birebir aynı (sonradan bilerek değiştirilen F/CLERIC/WIZARD/SORCERER/WARLOCK/BARD/DRUID alt sınıfları testte ayrıca belirtili); 13 içerik testi yeşil.

**H — durum denetimi:**

| Madde | Incap. | Stunned | Paralyzed |
|---|---|---|---|
| Eylem / bonus / tepki yok, konsantrasyon kesilir | ✓ | ✓ | ✓ |
| İnisiyatifte dezavantaj | **eklendi** | **eklendi** | **eklendi** |
| Hız 0 | — | — (5.2.1'de yok) | ✓ |
| STR/DEX save otomatik başarısız, saldırılar avantajlı | — | ✓ | ✓ |
| 5 ft içinden isabet kritik | — | — | ✓ |
| Bitiş (tur / save / kaynağın turu) | ✓ | ✓ | ✓ |

Yalnızca rapor (uygulanmadı):
- **Frightened:** dezavantaj görüş hattı koşulsuz; yetenek kontrollerinde dezavantaj yok; "kaynağa yaklaşamaz" yok.
- **Prone:** mesafe yerine saldırı türüne bakıyor (10 ft erişimli yakın dövüş avantaj alıyor, bitişikten menzilli dezavantaj alıyor; SRD tersini söylüyor).
- **Invisible:** inisiyatifte avantaj yok; "görmeyi gerektiren etki" denetimi genel değil.

Etkilenen özellikler: **6 alt sınıf özelliği** (Berserker Mindless Rage, Intimidating Presence; Land Nature's Sanctuary; Open Hand Technique; Thief Supreme Sneak; Fiend Hurl Through Hell) ve **11 sınıf özelliği** (Rage, Danger Sense, Countercharm, Channel Divinity, Wild Shape, Stunning Strike, Cunning Strike, Evasion, Elusive, Nature's Veil, Eldritch Invocations). Bu turun değişikliği hiçbirini etkilemez.

**Karar bekleyenler (Kuyruk 17):**
- **Kayıt sürümü artırılmadı:** görev "bir artır" diyordu; dış içerik alanı kayda Görev E1'de girmiş ve sürüm o zaman artmıştı (şimdi 20). Bu turda biçim değişmedi. İstenirse 21'e çıkarılır (içerik aynı).
- **Frightened / Prone / Invisible düzeltmeleri:** ayrı görev olarak verilsin mi? Prone ve Frightened düzeltmesi eski senaryoları değiştirebilir (Open Hand Technique, Cunning Strike Prone'u kullanıyor).
- **"Masaüstünde belirli bir klasörden okuma":** tarayıcı uygulaması diske kendiliğinden erişemez; klasör seçiciyle (bir kez seçilir, içindeki JSON'lar yüklenir) ve `npm run check:icerik` (varsayılan `icerik/`) ile karşılandı.

## Kuyruk 15 — son özet (yapıştırılabilir)

**Üç görev de bitti** (K15A → K15B → K15C), her biri ayrı commit, `claude/rpg-battle-project-wu0f4f` dalında ve gönderildi; `wip/` dalı yok.

| Görev | Commit | Ne yapıldı |
|---|---|---|
| K15A | `6c30f6b` | Kale Baskını matrisi (alarm 6/7/8 × parti YZ gizlenmesi açık/kapalı, 3. ve 5. seviye, iki grup, 30 tohum). Seçim: **alarm 6 tur, gizlenme açık** (yalnızca `data/alarm.json` `failRounds` 8 → 6). Yeni sim bayrakları `--alarm-tur`, `--yz-gizlen`. |
| K15B | `05ed749` | Yolculuk: yol oyun içi saat harcar (kamp → mağara 5, mağara → han 6 sa; handa SRD 16 saat kuralıyla uzun dinlenme). Mağara durağında bir bugbear eksik (`JourneyStop.enemies`). Bayrak varsayılan kapalı. |
| K15C | `89bfca5` | Gerçek 25 sprite eşlendi (eksiz ad = `-1`, ağırlık: su-3 0,3). Alan: baskın renkli bulanık taban + %50–75 büyük örtüşen yamalar (dönüş/ayna/varyant hash'ten), kenar yaması küçük ve yarı saydam. CSS animasyon (sis/zehir kayma, alev döngü + titreme, su/buz parlama, buhar yükselme), patlama tek seferlik (`surface_reacted`, barut fıçısı). "Efekt animasyonu" ayarı, hareketi azalt, sekme gizli. Betiklerde Windows `pathToFileURL` testi. |

**Doğrulama:**
- Tam test paketi kuyruk sonunda bir kez: **153 dosya / 1488 test yeşil**.
- check:harita / check:ses: K15A (`6c30f6b`) ve son commit (`89bfca5`) 188/0 ve 15/0.
- Ana parça **418,7 kB** (≤ 440). Savaş parçası 140,7 kB.
- Hızlı regresyon: K15A Çöl/Orman/Kale bit bit aynı (20 tohum). K15B ve K15C motoru değiştirmedi (K15C yalnızca görsel; K15B yalnızca yolculuk verisi ve durak düşman listesi).

**K15A — Kale Baskını (hobgoblin / insan kazanma, 30 tohum; hedef 3. sv %35–55, 5. sv %70–90):**

| Alarm | Gizlenme | 3. seviye | 5. seviye |
|---|---|---|---|
| 6 | kapalı | 7% / 13% | 67% / 60% |
| **6** | **açık** | **40% / 57%** | **93% / 80%** |
| 7 | kapalı | 7% / 20% | 80% / 70% |
| 7 | açık | 53% / 67% | 93% / 87% |
| 8 | kapalı | 23% / 33% | 93% / 80% |
| 8 | açık | 60% / 73% | 93% / 90% |

Tam uyan hücre yok; en yakını 6 + açık (sapma 5 puan: insan 3. sv +2, hobgoblin 5. sv +3; 30 tohum gürültüsü ±9). Hobgoblin 5. seviye gizlenmeli her hücrede %93: sayaç bu satırı oynatmıyor.

**K15B — yolculuk zinciri (3. seviye, 3 savaş, 30 tohum; hedef Kolay %70–85, Normal %45–65):**

| Seçenek | Normal | Kolay |
|---|---|---|
| mevcut | 17% | 60% |
| (a) yalnızca dinlenme/saat | 43% | 53% |
| (b) yalnızca hafif Mağara | 23% | 43% |
| **(c) ikisi (uygulandı)** | **63%** | **80%** |

**K15C — kare süresi (headless Chromium, yazılım çizimi = GPU'suz en kötü durum; 5 sn rAF aralıkları, ms):**

| Durum | Görsel sayısı | Ortalama | p95 | En kötü |
|---|---|---|---|---|
| 48×28, beş tür, bütün altıgenler, animasyon açık | 2246 | 27,1 | 66,6 | 66,8 |
| 48×28, animasyon kapalı | 1135 | 16,6 | 16,7 | 16,8 |
| 15×7 pencere (oyunda geniş harita bu kadarını çizer), animasyon açık | 137 | 17,3 | 16,8 | 33,4 |
| (denenen) bulanık maskeyle 15×7 | 137 | 71,0 | 133,3 | 283,4 |

Maske bu yüzden kaldırıldı; animasyonlar 1/6 sn tıkına hizalı adımlı (harita her karede değil, saniyede ≈6 kez yeniden çizilir).

**Ekran görüntüleri:** `docs/sabah/k15c-sprite-alanlar.png` (sis, su, alev, zehir, buhar), `docs/sabah/k15c-patlama.png`, `docs/sabah/k15c-zehir-yakin.png`, `docs/sabah/k15c-oyun-ici.png` (oyunda Game Master yüzey aracıyla su, alev, zehir, buhar).

**Sprite kenar artıkları:** sis, buhar, su, alev, buz, yağ temiz (yarı saydam kenar pikseli yok, yeşil/magenta yok). **Zehir 1/2'de magenta tonlu piksel %2,4 / %2,8** (bulut kenarlarında ince mor çizgiler, yakın görüntüde belli). Öneri: ham görsel yeşil zeminliyse bu çizim parçası olabilir; değilse `npm run sprite-ice -- --tolerans 90 yuzey-zehir-1 yuzey-zehir-2` ya da `sprite-ice`'a magenta hale temizliği (yeşil hale adımının aynısı, R ve B > G + 30 olan kenar pikseli → komşu ortalaması). Buhar için ayar gerekmiyor.

**Karar bekleyenler (Kuyruk 15):**
- **K15A:** hobgoblin kalesi 5. seviye %93 (hedef üstü +3). İstenirse 5. seviye düşman listesine bir hobgoblin; sayaç bu satırı etkilemiyor.
- **K15B hedef aralığı:** TASARIM tek aralık (%70–85) veriyordu; Kolay %70–85, Normal %45–65 olarak yazıldı. Onay.
- **K15B uzun dinlenme yeri:** "ikinci duraktan sonra" handa (4. durak) olarak yorumlandı; kampta (2. durak) istenirse yol saatleri yeniden düzenlenir ve ölçülür.
- **Zehir sprite'ı:** magenta artığı; ham görseli yeniden işle ya da magenta hale adımı eklensin mi.
- **Alev:** sprite geniş/basık (128×83), yamalar 1,75 ölçekte bile dikeyde turuncu tabanı gösteriyor; daha yüksek bir alev varyantı görünümü iyileştirir.

## Kuyruk 14 — son özet (yapıştırılabilir)

**Dört görev de bitti** (B1 → K14A → SP1 → Y0+Y1+Y4), her biri ayrı commit, `claude/rpg-battle-project-wu0f4f` dalında ve gönderildi; `wip/` dalı yok.

| Görev | Commit | Ne yapıldı |
|---|---|---|
| B1 | `282f9d2` | Eğitimsiz zırhta büyü engeli tek yerde (`castBarrier`). Büyü menüsünde engelli büyü gri + tek satır neden, hedef seçimine girilmiyor; Esc / haritada dışarı dokunma / "Vazgeç" her seçim kipinden çıkarıyor. Ritüel (kurulumda Find Familiar) engeli atlıyordu, düzeltildi. Oluşturucuda kuşanmadan önce uyarı + "Yine de kuşan", kartta "⚠ Eğitimsiz zırh" rozeti. |
| K14A | `131cadd` | Alarm sayacı 8 tur (veride). Sızma haritasında SRD Hide: yürümek gizlenmeyi bozmaz, uyanık düşman pasif Algıyla bulursa çıkar. Parti yapay zekâsı gözcü yakınken gizlenir, gizli ilerler. Düşman yolundaki kapalı kapıyı açar (kilitliyi değil). |
| SP1 | `2e3920c` | `npm run sprite-ice`: yeşil zemin + iç delik + hale + (`--golge-sil`) gölge temizliği, kırpma, en yakın komşu küçültme, WebP. `data/sprite-esleme.json` (sis, ağ, gres, yağ, alev, buhar, buz, su, zehir, patlama; varil, barut varili). Sprite varsa çizilir, yoksa görüntü aynı. Boyutlar `docs/sprite-boyutlari.md`. |
| Y0+Y1+Y4 | `e9eee09` | Yolculuk motoru (komut/olay/reducer, replay, ayrı kayıt `rpg-battle-yolculuk`), 5 duraklı doğrusal güzergâh, yolculuk ekranı (bayrak arkasında, varsayılan kapalı), zincir simülasyonu `npm run sim:zincir`. |

**Doğrulama:**
- Tam test paketi kuyruk sonunda bir kez: **152 dosya / 1482 test yeşil**.
- check:harita / check:ses: B1, K14A ve SP1 commit'lerinde 188/0 ve 15/0; Y commit'inin kontrolü raporun yazıldığı sırada sürüyordu (sonuç sohbette).
- Ana parça **418,4 kB** (≤ 440; kuyruk başında 415,3). Yolculuk ekranı ayrı parça (≈40 kB).
- Hızlı regresyon (eski senaryolar bit bit aynı): B1 (büyücü partisi Çöl/Orman/Mağara), K14A (Çöl/Orman/Kale/Taverna), Y (simulate ayrıştırması: Çöl/Mağara/Kale).
- Ekran görüntüleri: `docs/sabah/b1-zirh-buyu.png`, `docs/sabah/sp1-sprite.png` (sentetik sprite'larla; depoya sprite girmedi), `docs/sabah/y1-yolculuk.png`.

**Ölçümler (30 tohum):**

| | Senaryo | Sonuç | Beklenen |
|---|---|---|---|
| K14A, 3. seviye | Kale Baskını hobgoblin / insan | %60 / %73 | %35–55 |
| K14A, 5. seviye | Kale Baskını hobgoblin / insan | %93 / %90 | %70–90 |
| Y4 zincir, 3. seviye, 3 savaş | Normal / Kolay | %17 / %60 bitirme | %70–85 |

Aralık dışı; kural gereği ayar yapılmadı, öneriler `docs/harita/DENGE.md`'de.

**Karar bekleyenler (Kuyruk 14):**
- **K14A denge:** 3. seviye üstte. Öneri: sayaç 7 tur ya da kule grubuna bir gözcü ya da habersiz görüş 60 → 80 ft (birini seç, yeniden ölç).
- **Gizlenme her yerde SRD'ye geçsin mi?** Şimdi yalnızca uyuyan/habersiz grup olan haritalarda yürümek gizlenmeyi bozmuyor; diğer haritalarda eski kural (yürüyen ortaya çıkar) kaldı ki eski senaryolar değişmesin.
- **B1 kalkan uyarısı** SRD'ye göre "kalkanın AC bonusunu alamazsın" (istenen metindeki büyü/dezavantaj yalnızca zırh için geçerli).
- **SP1:** patlama tek seferlik efekt eşlemede ama çizimi yok (sonraki görev). Sprite gelince `npm run sprite-ice` yeterli.
- **Y4 zincir dengesi** (%17 Normal): (a) Mağara yerine hafif karşılaşma; (b) han uzun dinlenme yeri olsun (saat kuralı için gece konaklama düğümü); (c) Normal'de kısa dinlenme sınırı 3.
- **Yolculuk ↔ karakter deposu:** yolculuk karakter kopyalarıyla ilerliyor; yolculuk bitince sonuç (HP, seviye) depoya yazılsın mı? Seviye atlayan karakterin ASI/büyü seçimleri sihirbazda yapılmalı (Y2+).
- **Yolculukta fiziksel zar** yok (zarlar otomatik); istenirse zar akışı (`useDiceFlow`) bağlanır.

**Kullanıcıdan beklenenler:**
- Sprite'lar: Gemini çıktılarını `assets-ham/sprite/` altına ad kuralıyla (`yuzey-ag.png`, `yuzey-ag-2.png`, `yuzey-sis.png`, `yuzey-gres-1.png`…, `nesne-varil.png`, `nesne-barut-varili.png`) koyup `npm run sprite-ice` (gölgeli olanlar için `npm run sprite-ice -- --golge-sil`). Liste `data/sprite-esleme.json`.
- Yolculuğu denemek için Ayarlar → "Deneysel: Yolculuk".
- Kale Baskını arka planı (önceki kuyruktan): `docs/harita/referans/kale-baskini-prompt.md`.

---

**Gece kuyruğu 13 (K13A → K13B → S2 → S3 → S4 → KB):** altısı da bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok.
- **Commit'ler:** K13A `b581cf5`, K13B `2ac4e75`, S2 `1979151`, S3 `9ce4b0b`, S4 `ca1062b`, KB `90ecb90`, kuyruk sonu (rapor, DENGE, ses eşlemesi) son commit.
- **Doğrulama:**
  - Tam paket bir kez, kuyruk sonunda: **147 dosya / 1462 test yeşil** (KB'nin ses eşlemesi eksikti, kuyruk sonu commit'inde eklendi).
  - check:harita / check:ses: K13B, S2, S3 commit'lerinde 184/0 ve 15/0; KB sonucu aşağıda. S4'ün ayrı kontrolü çalışmadı (KB commit'i S4'ü içeriyor).
  - Ana parça **415,3 kB** (hedef ≤ 440; kuyruk başında 411,8).
  - Kayıt sürümü 20 kaldı (yeni olaylar eklendi, eski olay biçimi değişmedi).
- **Hızlı regresyon:** S2 (Çöl, Mağara, Orman), S3 (Taverna, Taverna arka, Kale, Mağara; masumlu eski `objective` dahil), S4 (Çöl, Orman, Volkan uyuyan ejderha) önceki commit'le **bit bit aynı**.
- **K13A:** S0/J0 karar düzeltmeleri belgelere işlendi (ev kuralı listesi, sefer bayrakları).
- **K13B:** yapay zekâ buhar cezası (suda duran hedefe ateş ×0,5; alan büyüsünde buhar varsa 3 düşman), Stinking Cloud = zehir bulutu yüzeyi, `data/ev-kurallari.json` + Game Master kurulumunda ev kuralları listesi, savaşta "Yüzey yerleştir" aracı (yağ, su, buz, alev, buhar, zehir bulutu, kaygan). Mağara ölçümü DENGE.md'de.
- **S2 — nesne katmanı** (`map.objects`): yağ fıçısı (kırılınca 3 altıgen yağ, ateşle alev), barut fıçısı (patlama ev kuralı: DC 13 DEX, 2d10 ateş, 10 ft; SRD Collapsing Roof ölçeği), sandık (taşınabilir), masa (devrilince yarım örtü), kapı (aç/kapa serbest, kilit DEX Sleight of Hand DC 15, kırılır), mangal (dökülünce alev). SRD nesne AC/HP. Nesne zemini değiştirir (hareket/örtü/görüş tek yerden). Game Master "Nesne yerleştir" aracı savaşta ve kurulumda. Ekran `docs/sabah/s2-nesneler.png`.
- **S3 — hedefler:** defeat, reach, protect, destroy, survive, retrieve; all/any; fail (tur, masum, nesne, korunan, alarm + N tur). Üst şerit ✓/✗, hedef hüzmesi, sonuç ekranı, günlük; Game Master hedef paneli (hazırlar dahil). Hedefsiz savaş eskisiyle aynı. Ekran `docs/sabah/s3-hedefler.png`.
- **S4 — uyuyan gruplar ve alarm:** grup alanı haritada; uyuyan/habersiz üyenin turu atlanır; hasar, gürültü (gök gürültüsü 100 ft, kapı 60 ft, patlama 120 ft) ve pasif Algı (uyuyan −5) alarm verir; alarmlanan grup dezavantajlı inisiyatifle sıraya girer (SRD Surprise); komşuya haber yalnızca ev kuralı `alarmKosusu`. Game Master grup paneli ve "grubunu alarmla". Sim `--alarm hemen|yok`.
- **KB — Kale Baskını** (`kale-baskini`, 31×17): orman kenarı, hendek ve dış kapı, avluda kuyu ve su, koğuş (uyuyor), devriye ve güneydoğu kulesi (habersiz), mahzende 3 yağ + 1 barut fıçısı, iç kapı (demir kale kapısı AC 19, HP 27, dışarıdan görünmez), kuzeydoğu kulesi hedef. Hedef any(iç kapıyı kır, kuleye çık), alarmdan 6 tur sonra başarısız; sefer bayrağı barut patlaması + alarm koşusu. İki karşılaşma × 3./5. seviye (1700–3600 XP). Yer tutucu görsel + Gemini referans paketi `docs/harita/referans/kale-baskini*`. Ekranlar `docs/sabah/kb-kale-baskini.png`, `docs/sabah/kb-kurulum.png` (S4 grup paneli de burada).
  - Yol üstünde bulunan iki açık düzeltildi: nesneye saldırıda görüş hattı yoktu (okçular duvar arkasındaki kapıyı vuruyordu); iç kapı dış kapıyla aynı hizadaydı.
- **30 tohum ölçümü** (`docs/harita/DENGE.md`):

| Parti, seviye | Senaryo | Sessiz giriş | Tam alarm | Normal |
|---|---|---|---|---|
| standart 3 | Hobgoblin kalesi | 100% | 87% (ölüm 23%) | 7% |
| standart 3 | İnsan muhafızlar | 100% | 83% (berabere 10%) | 13% |
| standart 5 | Hobgoblin kalesi | 100% | 100% | 67% |
| standart 5 | İnsan muhafızlar | 100% | 100% | 60% |

  Büyücü partisi, 5. seviye, yüzey açık/kapalı: hobgoblin 60%/60%, insan 80%/70%.

- **Eksik sprite listesi** (hepsi yer tutucu: renkli altıgen + emoji):
  - S0 §1.6 zemin desenleri: `yuzey-yag`, `yuzey-buz`, `yuzey-su`, `yuzey-asit`, `yuzey-diken`, `yuzey-kaygan`; döngüler `bulut-zehir`, `bulut-buhar`, `alev-zemin`; tek seferlik `tepki-tutusma`, `tepki-sonme`, `tepki-yildirim-su`, `tepki-donma`.
  - Nesneler (S2/KB): yağ fıçısı, barut fıçısı, sandık (yerde/taşınırken), masa (dik/devrik), kapı (açık/kapalı/kilitli/kırık), kale kapısı (açık/kapalı/kilitli/kırık), mangal (yanan/devrik); kırılma ve patlama efektleri.
  - S3/S4: hedef işareti (şimdilik mavi hüzme), habersiz jeton işareti (şimdilik "?"), alarm efekti.
  - KB arka planı: Gemini görseli kullanıcıda (`docs/harita/referans/kale-baskini-prompt.md`).

**Gece kuyruğu 12 (Z1 → Z2 → M2 → HG1 → Z3 → Z4 → Y1):** yedisi de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok (Z4'ün geçici `wip/main-birlestirme-denemesi` dalı silindi, gönderilmedi).
- **Commit'ler:** Z1 `11d7c27`, Z2 `483ae49`, M2 `5c66070`, HG1 `0cd083f`, Z3 `0a85ed7`, Z4 `8182c58`, Y1 `eb341eb`.
- **Doğrulama:**
  - Kayıt sürümü 20 kaldı.
  - Son tam paket: **143 dosya / 1431 test yeşil**.
  - check:harita / check:ses: M2, HG1, Z1, Y1 commit'lerinde 184/0 ve 15/0. Z2'nin kontrolü ayrıca çalışmadı; Y1 commit'i Z2'yi içeriyor.
  - Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0).
  - Ana parça **411,8 kB** (hedef ≤ 440).
- **Z1 — renk kararları:**
  - Drow varsayılan paleti **D** (gece-mavi).
  - Erkek Dragonborn White eski K8b yönteminde: tek veri satırı. Maskesiz olduğu için beyazlık kıyafete de yansır (K8b gibi).
  - Taşmalara dokunulmadı.
  - Goliath kafa görseli kutuyla ±2 px eşleşirse ölçeklenmez (×1); değilse eski ölçekleme ve uyarı. Mevcut görseller hâlâ ×1,93–2,1 ölçekleniyor ve uyarı veriyor.
  - Ekran görüntüsü `docs/sabah/z1-renk.png`. Renk işi kapandı.
- **Z2 — üç kural düzeltmesi:**
  - **Powerful Build:** SRD taşıma tablosundaki boyut çarpanıyla Goliath "bir boy büyük" (Medium → Large): kapasite, kademeli eşikler ve sürükleme/itme sınırı ×2. Hangi türün bu özelliği taşıdığı SRD tür metninden test ediliyor.
  - **Thirsting Blade:** zaten K13'te SRD'ye göre (pact silahıyla); kod değişmedi.
  - **Cutting Words:** Bard artık zarı atmadan önce "saldırı zarından" ya da "hasardan" düşmeyi seçiyor (SRD 5.2.1: iki ayrı tetik). Saldırıya uygulanan zar isabeti çeviremezse hasar azalmıyor; eskiden zar atıldıktan sonra en yararlısı seçiliyordu (cömertti).
- **M2:** mini haritada pencere sürüklenir (fare + dokunma), dışına dokunuş oraya gider, takip o tur durur. Dokunmatik sürüklemeden sonra sonraki dokunuşun kaybolması hatası bulundu ve düzeltildi. Ekran görüntüleri `docs/sabah/m2-mini-harita-masaustu.png`, `-mobil.png`.
- **HG1:**
  - Şartname `docs/harita/gorsel-sartnamesi.md`.
  - Her geniş harita için `docs/harita/referans/<harita>.png`, `-izgarasiz.png`, `-prompt.md` (`npm run harita-referans`).
  - `npm run harita-gorsel` `assets-ham/harita/<harita>.png` varsa boyut ve oranı denetler: %0,5–3 sapmada uyarı, %3 üstünde hata ve dosya yazılmaz. Sonra WebP'ye çevirir.
  - **Kullanıcının yapacakları:**
    1. Prompt dosyasını aç.
    2. Gemini'ye ızgarasız referansı, Klasik stil örneğini ve İngilizce metni ver.
    3. Çıktıyı `assets-ham/harita/<harita>.png` olarak kaydet.
    4. `npm run harita-gorsel -- <harita>` çalıştır ve oyunda ⤢ ile kontrol et.
- **Z3:** J0 ve S0 belgelerinin başına "Kararlar" yazıldı, "Karar bekleyenler" kapandı. Kullanıcının karar vermediği maddeler "Claude kararı" olarak işaretlendi: rota 6–8 durak, zincir dengesi %70–85, alev yayılması/fıçı patlaması/alarm koşusu/kuşatma yok, yüzeyler durağa taşınmaz. SRD dışı 97 alt sınıf varsayılan pakete girmez (DECISIONS).
- **Z4:** çatışma yok. main (`fca3ebe`) zaten bu dalın atası; `logo-mobil-zarsiz.jpg` main'de değil bu dalda (`e63837c`). main ← dal yönü çatışmasız birleşir (564 dosya). Ayrıntı aşağıda.
- **Y1 — yüzey sistemi çekirdeği** (`src/battle/surfaces.ts`, `data/yuzeyler.json`):
  - **Yüzeyler:** yağ, su, buz, alev, yanan ağ, buhar, zehir bulutu. Mevcut `map.zones` katmanında; girme ve tur tetikleri, zorlu zemin, örtü ve çizim aynı yoldan.
  - **Tepkimeler:**
    - yağ + ateş → alev;
    - ağ + ateş → yanan ağ (SRD);
    - buz + ateş → su;
    - su + ateş → buhar;
    - zehir bulutu (Stinking Cloud dahil) + ateş → patlama (2d6 ateş, DEX yarıya), bulut kalkar;
    - su + soğuk → buz;
    - su + yıldırım → bağlı ≤ 7 su altıgeni;
    - Sleet Storm alevi söndürür (SRD).
  - **Teknik:** tepkime derinliği 1. Olay tabanlı ve replay uyumlu; zarlar zar modunu izliyor (elle zar testi var). Bayrak `yuzeyEtkilesimi` varsayılan açık.
  - **Yapay zekâ:** tehlikeli yüzeyi risk olarak görür, 50'nin altında kaldığı için kazanç varsa girer.
  - **Arayüz:** geçici renkli yer tutucu + simge, bilgi baloncuğunda "yüzey: Buz (10 tur) — ev kuralı". Ekran görüntüsü `docs/sabah/y1-yuzeyler.png`.
  - **Testler:** 13 test (her tepkime, alev 5 ateş, buzda Prone, söndürme, bayrak, zar defteri, geniş haritada yayılım, yapay zekâ riski, kısa savaş).
  - **Regresyon:** tablo aşağıda.
  - **SRD'den sapmalar / kural dışı:**
    - Grease SRD'de yanmaz: yağ sayılmadı.
    - Yağ ve zehir bulutu yüzeyinin mevcut büyülerde kaynağı yok: Game Master `place_surface` komutu (arayüz düğmesi yok).
    - Ice Storm ve Wall of Fire oyunda yok.
    - Lightning Bolt verisindeki eksik `lightning` türü eklendi (dirençler artık işliyor).
    - Ev kuralları: su, buz, buhar, patlama, suda yıldırım.
    - Gust of Wind bulut dağıtmıyor.
    - Yanan ağ altıgenindeki Restrained bitmiyor.
  - **Eksik sprite'lar (üretilmedi, yer tutucu renk + emoji):**
    - zemin döngüleri: yağ birikintisi, su yüzeyi, buz, zemin alevi, yanan ağ, buhar bulutu, zehir bulutu;
    - tek seferlik tepkime efektleri: tutuşma, buharlaşma, donma, erime, patlama, suda yıldırım, söndürme.
    - Mevcut `burn`, `freeze`, `poison`, `acid` yalnızca yaratık durum efekti.
- **Y1 hızlı regresyonu** (5. seviye, 50 tohum; eski = Y1 öncesi `8182c58`, ayar yapılmadı; `docs/harita/DENGE.md`):

| Senaryo | Parti | Eski kazanma / berabere / tur | Yeni |
|---|---|---|---|
| Orman | standart | 78 / 0 / 5,8 | 78 / 0 / 5,8 |
| Mağara — karanlık | standart | 90 / 10 / 7,5 | **82 / 16 / 9,0** |
| Kale — Gündüz | standart | 96 / 2 / 8,2 | 94 / 2 / 8,0 |
| Orman yolu — pusu | standart | 98 / 2 / 5,6 | 100 / 0 / 5,2 |
| Orman | büyücü | 100 / 0 / 3,5 | 100 / 0 / 3,5 |
| Mağara — karanlık | büyücü | 92 / 8 / 5,4 | 92 / 8 / 4,9 |
| Kale — Gündüz | büyücü | 98 / 2 / 5,0 | 98 / 2 / 5,0 |
| Orman yolu — pusu | büyücü | 100 / 0 / 3,7 | 100 / 0 / 3,9 |

  Mağara/standart `--yuzey-kapali` ile eskisiyle birebir aynı: fark sığ sudaki düşmana atılan ateşin bıraktığı buhardan (görüş kesiliyor, savaş uzuyor).

**Z4 — main ile birleştirme denemesi (2026-10-31):** çatışma **yok**; birleştirilecek bir şey de yok.
- `origin/main`'in ucu `fca3ebe` ("Light mobil acilis arka plani: taht odasi videosu") bu dalın zaten atası: birleşme tabanı = main'in ucu (`git merge-base --is-ancestor origin/main HEAD` doğru). main daha önce `b76e02c` birleştirmesiyle bu dala girmiş.
- `assets-ham/logo/logo-mobil-zarsiz.jpg` main'de **yok**; bu dalda (`e63837c`, 2026-10-29) var. Kullanıcının "main'de" sandığı dosya aslında bu dala gönderilmiş.
- Deneme geçici `wip/main-birlestirme-denemesi` dalında, ayrı çalışma ağacında yapıldı:
  - `git merge origin/main --no-commit --no-ff` → "Already up to date", 0 dosya.
  - Ters yön (main'in ucuna bu dal, `--no-commit --no-ff`) → "Automatic merge went well": 564 dosya değişir, 0 çatışma. main bu dala fast-forward edilebilir.
- Deneme geri alındı. Geçici dal ve çalışma ağacı silindi (dal uzak depoya gönderilmedi); main'e ve çalışma dalına hiçbir şey birleştirilmedi.
- **Öneri:** PR açılırsa birleştirme çatışmasız olur (fast-forward ya da birleştirme commit'i). Kullanıcı main'e yeni commit atarsa deneme tekrarlanmalı.

**Gece kuyruğu 11 (R1 → DP → H1 → H2 → J0 → S0):** altısı da bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: R1 `3fb6ad5`, DP (DROW-PALET, kuyruktan önce yapılmıştı, atlandı) `88503ba`, H1 `8e5d73b`, H2 `08e931f` + `b5f7c0a` (ses eşlemesi; tam paket yakaladı), J0 `37c290f`, S0 `80a05f1`. Kayıt sürümü 20 kaldı (H1/H2 boyutu `tiles`'tan çıkarıyor; kayıt biçimi aynı). Son tam paket: **141 dosya / 1402 test yeşil**. Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0). check:harita / check:ses: R1 160/0, 15/0; H2 (`08e931f`) 184/0 (15 harita), 15/0; ses eşlemesinden sonra (`b5f7c0a`) check:ses 15/0.
- **R1:** jetonlardaki soy rozetleri kaldırıldı (kod, veri, stil); "rozet yok" testi. ΔE'si 15–20 arasında kalan çiftler (yalnızca renkle ayrışıyor):

| Soy | Çift (en düşük ΔE, sınıf) |
|---|---|
| Dragonborn kadın | brass/copper 17,4 (cleric) · brass/gold 18,6 (sorcerer) · black/silver 19,2 (wizard) · bronze/copper 19,7 (bard) |
| Dragonborn erkek | copper/red 16,5 (barbarian) · black/silver 17,0 (ranger) · silver/white 17,7 (barbarian) · brass/gold 19,7 (barbarian) |
| Elf kadın | high-elf/wood-elf 19,4 (cleric) |
| Goliath kadın | cloud/frost 18,5 (fighter) · hill/stone 18,8 · fire/hill 19,1 |
| Goliath erkek | hill/stone 18,2 · fire/hill 18,5 |

- **H1:** boyut veride serbest (5×5…48×28; kademeler 15×7, 21×11, 31×17), kamera (tekerlek, sürükleme, çimdik, klavye), takip, "Tümünü göster", mini harita, ekran dışı oklar; yalnızca görünen altıgenler çizilir. 15×7 savaş ekranı DOM'u H1 öncesiyle aynı tohumda birebir aynı. Ekran görüntüleri `docs/sabah/h1-genis-1280.png`, `h1-genis-844.png`, `h1-genis-390.png`.
- **H2:** üç geniş harita (Klasik 12'ye dokunulmadı), seçicide "Klasik / Geniş haritalar" grupları, ad + açıklama TR/EN, her haritada 2 örnek karşılaşma (1/3/5. seviye listeleri), erişilebilirlik testi (ulaşılamaz bölge ve çıkmaz başlangıç yok), taraf başına ≥ 19 başlangıç altıgeni. Görseller zemin harflerinden üretildi (elle çizim gelince değişir). Ekran görüntüsü (Tümünü göster) `docs/sabah/h2-genis-haritalar.png`.
- **J0:** `docs/yolculuk/TASARIM.md` (düğümlü güzergâh, SRD dinlenme ve zaman sayacı, XP/kilometre taşı, zincir dengesi, olay günlüklü kayıt + Supabase RLS taslağı, arayüz taslağı, Y0–Y8 yol haritası).
- **S0:** `docs/harita/SEFER-TASARIMI.md` (yüzey matrisi: yağ, kaygan, su, buz, zehir bulutu, buhar, alev, lav, asit, diken; yalnızca SRD kaynakları; tepki sırası tek tablo, zincir derinliği 1; "ıslak etkisi yok, su yıldırımı yayar"; nesneler, alarm, hedefler, uyuyan gruplar, sis, kuşatma/Harita 2.0 sınırı, ejderha boss, iki örnek harita, S1–S8 yol haritası, H3 harita başına tek satır). Not: SRD 5.2.1'de "lair action" yok; yalnızca "in Lair" sayaç artışı var.
- **Ölçümler:**

| Ölçüm | Değer |
|---|---|
| Ana parça (`index-*.js`) | 410,5 kB (gzip 131,5; hedef ≤ 440) |
| Yapay zekâ tur süresi (3 tohum, 4 goblin warrior + 2 kurt, 5. seviye parti; ort. / en uzun) | 15×7: 12,6 / 54 ms · 31×17: 17,9 / 64 ms · 48×28: 25,1 / 77 ms |
| Savaş açılışı | 31×17 ≈ 1,4 sn · 48×28 ≈ 1,9 sn |
| Kaydırma karesi | ≈ 31 ms (2 rAF); çizilen altıgen ≈ 145–155 |

- **Hızlı denge (H2; standart 5 kişilik parti, 3. seviye, 30 tohum, ince ayar yok):**

| Harita / karşılaşma | XP | Kazanma | Ort. tur | Ölüm (en az 1) | Başlangıç mesafesi (en az / ort. / en çok altıgen) |
|---|---:|---:|---:|---:|---|
| Orman yolu — eşkıya pususu | 850 | %100 | 6,7 | %0 | 26 / 27,9 / 31 |
| Kale ve avlu — muhafızlar | 900 | %100 | 8,0 | %10 | 12 / 19,5 / 30 |
| Mağara (orta) — derinlik yaratıkları | 850 | %100 | 3,5 | %0 | 13 / 17,0 / 20 |

- **Değişen eski testler:** `tint.test` (R1: rozet testi yerine "rozet yok"), `maps.test` (harita listesi 12 → 15, aynalanamayanlara `kale-avlu`), `mapView.test` (yalnızca test adı).

**Görev DROW-PALET:** Drow teni 7 duraklı, gölge/ışık detayını koruyan gradyanla (S-eğrisi kontrast, orijinal kroma sapmasının %35'i korunur). Dört palet seçilebilir: `data/soy-renkleri.json` → `elf.drowPalet` (A kömür-mavi, B mor-mavi, C kül-gri, D gece-mavi); geçersiz değer A'ya düşer ve uyarır. **Varsayılan A:** klasik Drow mavi-grisi, detaylı ve canlı; B Tiefling'e, C Goliath'a, D Dragonborn Blue'ya yaklaşıyor (DECISIONS.md). Hepsinde en açık vurgu L 56, High/Wood Elf'e ΔE ≥ 46, diğer ırkların çıktısı bit bit aynı. İnceleme sayfasında "Drow paletleri" bölümü (Monk, Barbarian, Sorcerer, Fighter, Rogue; kadın/erkek; yanında High Elf ve Wood Elf); ekran görüntüsü `docs/sabah/drow-paletleri.png`. Değişen eski testler: `tint.test` Drow ortalama açıklığı ≤ 33 → ≤ 40 ve en açık piksel ≤ 55 → ≤ 60 (bilerek daha geniş, detaylı skala; K19 sınırı L ≈ 60).

**Görev F1 (feat tamamlama + paket boyutu):** üç parça ayrı commit, bu dalda ve gönderildi. Commit'ler: Magic Initiate `3ab8eb8`, Savage Attacker `b078c11`, paket boyutu `02e5435`. Tam paket: 139 dosya / 1386 test yeşil. Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0). Kural kaynağı SRD 5.2.1 metni (`data/srd/feats.json`).
- **Magic Initiate:** 1. seviye büyü uzun dinlenmede bir kez slotsuz (slotu olmayan sınıfta da), sonra slotla; kaynak `magic-initiate-<liste>` mevcut kaynak sistemiyle (dinlenmede dolar). Yetenek INT/WIS/CHA seçilir (varsayılan Cleric/Druid → WIS, Wizard → INT); zorluk sınıfı ve saldırı bonusu büyü başına buna göre. Savaş menüsünde "bir kez, slotsuz". SRD'ye göre ASI/Epic Boon yuvasından da alınabilir (her seferinde farklı liste). **Spell Change** (seviye atlarken bir büyüyü değiştirme): seviye geçmişi tutulmadığından oluşturucuda seçimler her zaman değiştirilebilir (kuraldan geniş).
- **Savage Attacker:** turda bir kez silah isabetinde hasar zarları iki kez; SRD "either roll" diyor, oyun büyük olanı kullanır (düşüğü seçmenin yararı yok). İkinci atış zar defterine yazılır, elle zarda ayrıca istenir; replay testi var.
- **Açıklama kartları SRD ile karşılaştırıldı:** farklı bulunanlar düzeltildi: Magic Initiate (yetenek seçimi, her zaman hazır, slotla da kullanım, tekrar alınabilirlik eksikti), Alert (Incapacitated iken takas yok eksikti). Savage Attacker ve Skilled kartları SRD ile uyumlu. Geçmiş kartları (G1) SRD'deki yetenek/feat/beceri verisiyle test ediliyor.
- **Ana parça boyutu:**

| | Önce | Sonra |
|---|---|---|
| Ana parça (`index-*.js`) | 464,5 kB (gzip 150,8) | **408,8 kB** (gzip 130,7) |
| Çeviri tablosu ana parçada | 109,4 kB (TR + EN) | 54,6 kB (yalnızca TR) |
| İngilizce metinler | ana parçada | ayrı parça `strings.en-*.js` 56,2 kB (gzip 20,8), EN seçilince |
| react-dom | 227,4 kB | 227,4 kB (değişmez) |

  Feat açıklamaları ve sihirbaz zaten ayrı parçada; geçmiş verisi, K22/K24 yardımcıları ve harita adları ya küçük ya da zaten tembel olduğu için taşınmadı (DECISIONS.md). Kayıtlı dil EN ise ilk çizim EN tablosu yüklenince yapılır; TR açılışında fark yok.
- **Değişen eski testler:** `advancement.test` (ASI yuvası seçeneklerine köken feat'leri eklendi; SRD kuralı), `classFeatures.test` (feat kaynakları SRD feat'ine bağlanıyor), `g1.test` (Magic Initiate yeteneği), `strings.test` ve `k18.test` (EN tablosu ayrı dosyadan).

**Gece kuyruğu 10, bölüm 1 (N1 → G1 → K23, sonra K24):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: N1 `8689cf3`, G1 `b31ad24`, K23 `7c402aa`. Kayıt sürümü 19 → 20 (G1). Son tam paket: 136 dosya / 1367 test yeşil; ana parça 456,3 → 463,1 kB; check:harita 160/0 ve check:ses 15/0 (N1, G1, K23 commit'lerinin her birinde). Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0).
- **N1:** ad "Dice & Hex" (`APP_NAME`; başlık çubuğu, ana menü, açılış ekranı). Ana menü başlığı büyük harf "DICE & HEX", "&" vurgu renginde. Kayıt anahtarları ve dosya adları değişmedi. Gömülü yazı: logo görselleri zaten "DICE & HEX" yazıyor (yeni adla uyumlu); savaş sonu videolarında yalnızca ZAFER/BOZGUN/VICTORY/DEFEAT var, oyun adı yok. Ekran görüntüsü `docs/sabah/n1-ad.png`.
- **G1:** SRD 5.2.1 geçmişleri (s. 83; kullanıcının beklentisiyle birebir aynı). Karakter adımında dört kart, bonus yalnızca geçmişin üç yeteneğine, köken feat'i geçmişten (kilitli), iki beceri kilitli (sınıf ve Skilled çakışması uyarısı), Magic Initiate cantrip + 1. seviye büyü seçimi (slotsuz kullanım eksik), geçmiş değişince yok sayılan seçimler geri dönünce gelir, geçmişsiz eski kayıt eskisi gibi ("Geçmiş seç" önerisi). Yeni karakter Soldier ile başlar. 12 sınıf × 4 geçmiş duman testi çöken yok. Ekran görüntüsü `docs/sabah/g1-gecmis.png`.
- **K23:** Goliath Paladin/Fighter/Cleric'te kafa dışı boyanmaz (`govdeBoya: false`), boyun geçişi 2 px yumuşak; görünür dikiş yok. Kafa dışı maske pikselleri omuz zırhıymış (artık boyanmıyor); yüz dışında açık ten yok, el maskesi önerisi yok. ΔE yalnızca kafada: en düşük 18,2 (≥ 15); rozetler aynı. Yalnızca bu 6 jetonun ölçümü değişti. Ekran görüntüsü `docs/sabah/k23-goliath.png` (SRD'de Goliath'ın 6 dev soyu var: orijinal + 6 sütun).
- **K24 (ilk sürüm iptal edildi; yerine ham maske içe aktarma):** `npm run soy-maske-ice`: `assets/soy-maske-ham/<jeton>.png|jpg` (her boyut) → `assets/soy-maske-el/<jeton>.png` (256×256, 0/255). Çerçeve/boşluk kırpma, en-boy uyarısı, kırpılmış karakterde opak kutuya oturtma, eşik (`--esik`), saydam piksellerde sıfır, küçük bileşen ve delik temizliği; IoU < 0,3 hizasız, beyaz oranı %2–%80 dışı, taşma uyarıları. Var olan elle maske `--zorla` olmadan ezilmez. İnceleme sayfasında "ELLE (yapay zekâ)" ve "ham maske" sütunu. Belge `docs/soy-maske-yz.md` (Gemini yönergesi). Depoda yapay zekâ maskesi henüz yok; araç deneme girdisiyle doğrulandı (IoU 0,985), deneme dosyaları silindi. Ekran görüntüsü `docs/sabah/k24-ham-maske.png`.
- **Değişen eski testler:** `logo.test` ve `splash.test` (ad "Dice & Hex"), `statusFx.test`, `areaView.test`, `s1.test` (kayıt sürümü 20), `headOverlay.test` (kapsam kaydı `{ siniflar, govdeBoya }` biçimi).

**Gece kuyruğu 9 (K20 → M1 → K22; öncesinde K21):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K21 `4212ff3` (K20 ve M1 verilmeden önce çalıştı), K20 `0fc9b16`, M1 `2574e9d` + `945e998` (ses kontrol betiği seçicisi), K22 `497b205`. Uzak dala gelen kafa görselleri `de9687d` birleştirildi. Kayıt sürümü 19 kaldı. Son tam paket: 135 dosya / 1352 test yeşil; ana parça 456,3 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0).
- **K20:** köken feat'i ayrı kutu, 18 feat için "Ne yapar? / Örnek" (TR/EN), Skilled beceri seçimi ve kayıt engeli, "Dövüş Stili (Fighting Style)" etiketleri, adım hata sınırı + Durum ekranında hata günlüğü. **Duman testi: 180 kombinasyonda (12 sınıf × seviye 1/5/9 × 5 ırk) çöken yok;** bildirilen çökme yeniden üretilemedi. Ekran görüntüsü `docs/sabah/k20-ilerleme.png`.
- **M1:** yeni ana menü (masaüstü sol logo + sağ cam panel; mobil alta yapışık panel), arka planda karartma yok, SVG simgeler, kayıt özeti, sürüm satırı, ad "Hex & Dice". Ekran görüntüleri `docs/sabah/m1-masaustu.png` (kayıt var), `m1-mobil.png`, `m1-masaustu-acik.png` (kayıt yok, açık tema). Ana parça 448,0 → 454,2 kB (ilk denemede harita adları ana parçaya girip 479 kB olmuştu; tembel yüklemeyle düzeltildi).
- **K22:** Goliath Paladin/Fighter/Cleric kafa kaplaması (6 jeton, atlanan yok). Kafa görselleri opak siyah zeminliydi ve 1× çizilmiş (kadın 28×33, erkek 26×29 opak px; gereken ≈ 56×64 ve 48×59, ≈ ×2 ölçek). Goliath Hill'e rozet eklendi. Ekran görüntüsü `docs/sabah/k22-goliath.png`.
- **Değişen eski testler:** `advancement.test` (Skilled becerileri ayrı alan), `logo.test` ve `splash.test` (ad "Hex & Dice"), `tint.test` (Goliath Hill rozeti), K21'de `tint.test` (Drow mavi-gri).

**Gece kuyruğu 8 (K19 → A1 → A2 → A3 → A4 → A5 → A6):** yedisi de bitti (A6 kısmen, bayrak arkasında), her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K19 `20cd688`, A1 `c71fd6a`, A2 `90b1dc4`, A3 `c261da9`, A4 `0e5357e`, A5 `1988134`, A6 `8bb5d1e`. Kayıt sürümü 19 kaldı (yalnızca yeni olay türleri ve isteğe bağlı alanlar). Son tam paket: 131 dosya / 1337 test yeşil; ana parça 441,4 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0). Hızlı regresyon (4 senaryo × standart/paladin × 3./5. seviye, 100 tohum): A1, A2–A5 ve A6 sonrası birebir aynı (A1'de paladin 5 zaman sınırına takıldı, A2–A5 ölçümünde tam).
- **K19:** Dragonborn kadın maskesi delik doldurma + kapatma + sınırlı büyütme + açma (benek kalmadı, K8b'ye dönülmedi); erkek Blue/Brass/Bronze/Copper/Gold/Red/Silver K8b yönteminde (Copper tonu 14 → 20), Black/Green/White K15 yolunda; Goliath kadın Cloud dövme kontrastı; Drow ≈%32 koyu (en açık L 46). ΔE ≥ 15 her yerde (12'ye inmek gerekmedi). Rozetler cinsiyete göre. Ekran görüntüsü `docs/sabah/k19-soylar.png`.
- **A1:** ortak can havuzu (`create_hp_pool`, komut sonunda eşitleme). **A2:** engelden geçme (`phase`, Incorporeal Movement). **A3:** iki aşamalı durumlar veriyle (Sleep, Cockatrice). **A4:** tasma (`leash`). **A5:** ek bonus eylem kancası. **A6:** ayak izi + motor entegrasyonu, `multiHex` bayrağı varsayılan kapalı (tasarım ve kalanlar `docs/harita/COKLU-ALTIGEN.md`).
- **Değişen eski testler:** `tint.test` (rozetler cinsiyete göre), `riders.test` (Cockatrice: yok 61 → 60, süreli etki 16 → 17), `content.test` (kitteki yeni `extraBonus` alanı özet dışında, SRD'de 0).

**Gece kuyruğu 7 (K17 → K16 → K18 → K15):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K17 `a63ddf1`, K16 `7949349`, K18 `0d5bb3f`, K15 `4e92373`, kuyruk sonu `c186d59`. Kayıt sürümü 19 kaldı. Son tam paket: 124 dosya / 1304 test yeşil; ana parça 440,2 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, değişmedi (183: tam 62, kısmi 68, savaş dışı 53, yok 0).
- **K17:** sınıf değişince sınıfa bağlı seçimler sınıf başına taslakta saklanır, geri dönünce yalnızca seviyeye ve sınırlara uyanlar gelir; başka sınıfın seçimleri uyarı vermez, kayda yazılmaz.
- **K16:** Puanlar adımında yer değiştirme, "Önerilen dağılım" ve "Sıfırla" (`docs/sabah/k16-puanlar.png`).
- **K18:** Öğren/Hazırla/Kitaba ekle etiketleri, terim ipuçları, ustalık yıldızı, 137 özellik özeti ve renk açıklaması (tembel `data/aciklamalar.json`), Wild Shape biçim kartları (`docs/sabah/k18-ozellikler.png`, `k18-ustalik.png`).
- **K15:** sprite başına ten maskesi (120 maske, `npm run soy-maske`), LCh kaydırma, Drow üç duraklı gradyan, Wood Elf boyamasız, High Elf aynı; erkek Goliath artık değişiyor. Lab ΔE eşiği 15: eşik altında kalan yok (`docs/sabah/k15-soylar.png`). Rozetler: Dragonborn Brass/Bronze/Copper/Gold/Silver, Goliath Frost, Wood Elf.
- **Değişen eski testler:** `builder.test` ve `paladin.test` (K17: başka sınıfın büyüsü artık uyarı değil, sessizce düşer), `k6.test` (etiket "Hazır" → "Hazırla"), `tint.test` (HSL aralık testleri maskeli yola göre yeniden yazıldı; Wood Elf boyamasız; rozet listesi ölçüme göre).

**Gece kuyruğu 6 (K13 → K14 → DENGE-4 → U3):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K13 `79768fe`, K14 `d583380`, DENGE-4 `3283fab`, U3 `5565846` (videolar uzak dala `1c68b78` ile eklenmişti; `e5b1193` birleştirme). Kayıt sürümü 19 kaldı (olaya isteğe bağlı alan: `action_used.pactOnly`). Son tam paket: 121 dosya / 1286 test yeşil; ana parça 432,0 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, 0–3 aynı (183: tam 62, kısmi 68, savaş dışı 53, yok 0); yeni `BUYU-DENETIMI-4-5.md`: 72 büyü, oyunda 2; 27 savaş dışı, 16 yalnızca veri, 18 küçük ek, 9 yeni sistem.
- **K13:** Thirsting Blade yalnızca pact silahıyla; soy rozeti 12 zayıf soyda (Goliath 6, Gnome 2, Dragonborn Brass/Bronze/Gold, Wood Elf; `docs/sabah/k13-goliath-soy-rozeti.png`); Wild Shape biçim saldırılarında canavar ek etkileri (Prone, zehir/ek hasar, yakalama, hücum, süreli durum).
- **DENGE-4:** `--parti buyucu` (6 kişi). 3. ve 5. seviyede çoğu senaryo %90–100 (parti 6 kişi). Teşhiste Bard'ın slotla ilham verip kontrol büyüsü yapmadığı bulundu; iki yapay zekâ düzeltmesi (DECISIONS). Hızlı regresyon birebir aynı.
- **U3:** savaş sonu başlık videosu (`docs/sabah/u3-son-video.png`); dosyalar mp4 266–995 kB + webm yedeği 229–616 kB + poster; tek seferde yalnızca bir dosya indirilir. EndVideo tembel parça (1,7 kB).
- **Değişen eski testler:** `warlock.test` (Thirsting Blade: `attacksPerAction` 2 → 1 ve `pactAttacks` 2; SRD "with your pact weapon"). Diğer değişiklikler yeni testler.

**Gece kuyruğu 5 (K11 → K12 → WARLOCK → BARD → DRUID → U4 → U3):** altısı bitti, U3 atlandı (`assets-ham/son-videolar/` yok); hepsi bu dalda ve gönderildi, `wip/` dalı yok. Commit'ler: K11 `4ff57bd`, K12 `03dc696`, WARLOCK `dabdfe1` (+ ekran görüntüsü commit'i), BARD `5c896e3`, DRUID `e945d8e`, U4 `05accfb`. Kayıt sürümü 19 kaldı. Son tam paket: 120 dosya / 1276 test yeşil; ana parça 430,8 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, değişmedi (183: tam 62, kısmi 68, savaş dışı 53, yok 0). U4 açılış zar sesi `public/ses/acilis-zar.mp3`: 1,54 sn, 25 kB.
- **Değişen eski testler:** `classFeatures.test` (Bard 1–5 artık eksiksiz; `wildShape` kaynağı artık savaşta kullanılabilir), `content.test` alt sınıf regresyon özeti (Warlock, Bard, Druid bilerek değişti: listeye eklendi, aynı kalması gereken kayıt sayısı 60).
- **Denge** (DENGE.md "Görev K12" ve "Gece kuyruğu 5"): K12 Cleric kazancının tamamı Channel Divinity yapay zekâsından (Preserve Life); SRD'ye uygun, değiştirilmedi. WARLOCK, BARD, DRUID sonrası regresyon birebir aynı.
- Ekran görüntüsü: `docs/sabah/warlock-invocations.png`.

**Gece kuyruğu 4 (K8b → K9d-kalkan → K10 → CLERIC → WIZARD → SORCERER):** altı görev de bitti, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K8b `dea0ae9`, K9d-kalkan `29b6446`, K10 `5d37bbe`, CLERIC `cd807b6` + `9a518e0` + `3d4cfd4`, WIZARD `6e2a2d8`, SORCERER `c1d21c8`, büyü denetimi `9ff62e8`, Hold Person düzeltmesi `4ff59e6`, kuyruk sonu `fabd4fd`. Kayıt sürümü 19 kaldı. Son tam paket: 117 dosya / 1250 test yeşil; ana parça 423,6 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi: 183 büyü, tam 62, kısmi 68, savaş dışı 53, **yok 0**.
- **Değişen eski testler:** `characterRest.test` (K10: kaynak en çoğu), `k4.test`, `b5.test`, `spells.test` (CLERIC/WIZARD verisi), `content.test` alt sınıf regresyon özeti (Cleric, Wizard, Sorcerer bilerek değişti: 240 içinde 120 kayıt aynı kalmalı; yeni kit alanları diğer sınıflarda varsayılan değerde denetlenir).
- **Denge** (DENGE.md "Gece kuyruğu 4"): Cleric (Life Domain) +3…+23 puan; WIZARD + SORCERER ±1. Kuyruk sonu regresyonu WIZARD'ın Hold Person sezgisinin Kale 5'i 87 → 68 düşürdüğünü buldu; kural ≤3 düşmana sınırlandı, geri döndü.
- Ekran görüntüleri: `docs/sabah/k8b-dragonborn-soy.png`, `docs/sabah/sorcerer-metamagic.png`.

**Gece kuyruğu 3 (K9 → K2 → K8-inceleme):** dokuz görev de bitti, her biri ayrı commit, bu dalda; `wip/` dalı yok. Kayıt sürümü 19 kaldı (olaylara yalnızca isteğe bağlı alanlar: `jumped.traitTurns`). Ayrıntı aşağıda "Kuyruk 3" bölümünde.

**Gece kuyruğu 2 (K5 → K6 → K7):** üç görev de bitti, bu dalda ve gönderildi; `wip/` dalı yok. Öncesinde aynı oturumda L7, K3, H-SLOT ve K4 de bitti. Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar). Son tam paket: 107 dosya / 1184 test yeşil; ana parça 402,3 kB (sınır 500); check:harita 160/0, check:ses 15/0.

**Gece kuyruğu 1 (K1 → L6 → B3 → B4 → B5 → CILA):** önceki gece bitti (aşağıdaki bölümler).

## YARIM KALANLAR

Kuyruk 2'den (kısmi kalanlar; ayrıntı ilgili bölümde):
- **K5 — SRD sınırının savaştaki etkisi:** kapasiteyi aşan (yalnızca eski kayıtta olabilir) karakter savaşta cezasız; kademeli kuralda ağır yüklü sayılır.
- **K7 — Warlock Eldritch Invocations:** yok (Thirsting Blade'in ek saldırısı, Agonizing Blast…); denetimde ⚠️.
- **K7 — Flurry of Blows 10. seviye üçüncü vuruş** ve **Push** yalnızca son saldırıda (bilinen kısmi).

Kuyruk 1'den; görev bitti ama şu parçalar kısmi kaldı (ayrıntı ilgili bölümde ve `DECISIONS.md`'de):
- **CILA 4 — Wind Wall biçimi:** düz ve yay biçimi var; serbest çizim (50 ft'lik istenen yol) yok.
- **CILA 5 — Blindness/Deafness seçimi:** motor `choice` ile Deafened alır; arayüzde ve yapay zekâda seçim düğmesi yok (her zaman Blinded).
- **CILA 6 — Flaming Sphere çarpması:** yalnızca taşımanın sonunda bitişik yaratığa (yol üstündeki ilk yaratıkta durma yok).
- **B4 — Water Walk, Knock**: karar bekliyor (aşağıda). (B3 Sleep, B5 Sanctuary, Warding Bond ve Bestow Curse kuyruk 4'te çözüldü.)


## Karar bekleyenler (özet)

**Kuyruk 13:**

- **KB — denge:** normal kipte (alarm açık) 3. seviye %7–13: yapay zekâ gizlenmediği için devriye ilk turda görüyor, kule 7+ turda. Seçenekler: (a) alarm sayacı 3. seviyede 8 tur; (b) kule hedefi daha yakın ya da iç kapı daha zayıf; (c) yapay zekâya gizlenme gelince yeniden ölç. 5. seviyede tam alarm %100 (kolay; listeye bir kaptan eklenebilir).
- **KB — "tam alarm" ölçümü** sayaçsız (baştan alarmda olunca alarm olayı yok); sayaç baştan işlesin mi?
- **S4 — devriye yürüyüşü** yok (habersiz grup yerinde durur); `suspicious` (gürültüye yürüme) ara durumu yok.
- **S4 — gürültü yarıçapları** (100/60/120 ft) ve habersiz görüş 60 ft SRD'de sayı olarak yok; Game Master kararı olarak `data/alarm.json`'da.
- **S3 — düşman hedef davranışı:** düşmanlar taşıyıcıyı/çıkışı/kapıyı kesmeye çalışmıyor (yalnızca eski masum davranışı).
- **S3 — hedef bitince olay sırası:** günlükte "Hedef ✓" satırı "Savaş bitti"den sonra yazılıyor (görsel).
- **S2 — yağ fıçısı** ateş hasarında HP beklemeden tutuşuyor (basitleştirme); nesnelere save yok (SRD: nesne save'de başarısız, tam hasar).
- **S2 — yapay zekâ nesneyi kendiliğinden kullanmıyor** (barut fıçısını düşmanın yanında patlatma, kapı açma); yalnızca hedef nesneye vuruyor ve riskten kaçıyor. Yapay zekâ kapı açmadığı için KB'nin dış kapısı açık başlıyor.
- **S4 ekran görüntüsü** KB ile alındı (grup verisi olan ilk harita).

**Kuyruk 12:**

- **Y1 — Mağara buharı:** standart parti Mağara'da −8 puan (buhar görüşü kesiyor). Seçenekler:
  - (a) böyle kalsın;
  - (b) yapay zekâ suda duran hedefe ateş seçerken buharı hesaba katsın;
  - (c) buhar yalnızca "turun sonuna dek" sürsün.
- **Y1 — Game Master yüzey arayüzü:** yağ, su ve zehir bulutu için `place_surface` komutu var, kurulum ekranında düğmesi yok. Eklensin mi?
- **Y1 — sonraki adım:**
  - Gust of Wind bulutları dağıtsın mı?
  - Yapay zekâ yüzey yaratmayı ve itmeyle tehlikeye sokmayı bilerek seçsin mi (Z3 izin veriyor)?
  - Yanan ağ altıgenindeki Restrained bitsin mi?
- **Y1 — sprite'lar:** yedi zemin döngüsü + yedi tepkime efekti yok (liste yukarıda); üretilince `npm run efektler`.
- **Z2 — Cutting Words bilgi farkı:** motorda saldırı ve hasar aynı adımda atıldığı için istemde hasar da görünüyor (SRD'de saldırı tetiğinde Bard hasarı bilmez). Kabul edildi; istenirse saldırı seçeneğinde hasar gizlenebilir.
- **Z2 — Powerful Build:** Grappled'dan kurtulma avantajı yok (oyuncunun yakalama eylemi de yok). Sürükleme/itme sınırı hesaplanıyor ama gösterilmiyor.
- **Z3 — "tek oyunculu varyant"** ayrı bir tek kişilik mod olarak anlaşıldı (MVP dışı); MVP mevcut Game Master + oyuncular düzeninde. Yanlışsa düzeltilmeli.
- **Z1 — Goliath kafaları:** kullanıcı yeniden çizince `npm run soy-maske` yeterli (±2 px eşleşirse ölçekleme yok).
- **HG1:** üç geniş haritanın Gemini görselleri kullanıcıda.

**Kuyruk 11:**

- **H2 — Harita görselleri:** üç geniş haritanın arka planı zemin harflerinden üretilmiş yer tutucu (`npm run harita-gorsel`); elle çizim istenirse dünya boyutu 31×17 için 2616×1668, 21×11 için 1781×1096 px.
- **H2 — Denge:** üç karşılaşma 3. seviyede %100 (kolay); geniş haritalarda yaklaşma turları uzun. Liste ayarı "Dungeondex öncesi tam test turu"na bırakıldı.
- **(Z3'te kapandı) J0 (`docs/yolculuk/TASARIM.md` sonu, 8 madde):** XP mi kilometre taşı mı; savaş sonunda süren etkilerin düşmesi (ev kuralı); kısa dinlenme sınırı; ölüm kalıcılığı / "Kolay"da 1 HP; zincir denge hedefi %70–85; güzergâh uzunluğu; Supabase'in sırası; ilk sürümde eşya ganimeti.
- **(Z3'te kapandı) S0 (`docs/harita/SEFER-TASARIMI.md` sonu, 11 madde):** ıslak zayıflığı (varsayılan yok); su yıldırımı yayar (varsayılan açık, 7 altıgen sınırı); buhar/donma/erime tepkileri; alevin yayılması; asit havuzu (SRD kaynağı yok); fıçı patlaması; yükseklikten avantaj; lair (SRD 5.2.1'de yok); alarm koşusu; kuşatma silahları; yüzeylerin duraklar arası kalıcılığı.

**Kuyruk 10:**

- **(F1'de çözüldü) G1 — Magic Initiate slotsuz kullanım:** cantrip'ler ve 1. seviye büyü savaşta biliniyor, ama 1. seviye büyünün "uzun dinlenmede bir kez slotsuz" kullanımı yok (slotsuz sınıfta bu büyü yapılamaz). Kaynak sistemi büyü adını veride sabit bekliyor (`freeSpell`); seçilen büyüye göre kaynak için savaşçıda büyü → kaynak eşlemesi gerekir. Seçenekler: (a) savaşçıya `freeSpellOf` eşlemesi + `magicInitiate` kaynağı (dinlenme ve durum kaydı da güncellenir); (b) şimdilik böyle kalsın.
- **(F1'de çözüldü) G1 — Savage Attacker:** Soldier'ın feat'i veride `missing`; hasar zarını iki kez atıp iyisini seçme yok. Uygulanması küçük (turda bir kez silah isabetinde ikinci hasar atışı) ama elle zar akışında ikinci atış istenecek; onay bekliyor.
- **(F1'de çözüldü) G1 — Magic Initiate yetenek seçimi:** SRD'de büyü yeteneği INT/WIS/CHA'dan seçilir; şimdi büyücü sınıfta sınıfınki, değilse en yükseği (soy büyüleriyle aynı). İstenirse İlerleme adımında seçim eklenebilir.
- **G1 — Geçmiş kaldırma:** geçmiş seçildikten sonra "geçmişsiz"e dönüş yok (yalnızca dört geçmiş arasında geçiş). Eski kayıtlar geçmişsiz açılır; istenirse "Geçmiş yok (serbest köken feat'i)" seçeneği eklenebilir.

**Kuyruk 9:**

- **K22 — Kafa görselleri:** gelen dosyaların arka planı opak siyahtı (şeffaf değil) ve kafalar 1× çizilmiş (opak kafa kadın 28×33, erkek 26×29 px); ≈ ×2 en yakın komşuyla ölçekleniyor. Seçenekler: (a) böyle kalsın; (b) 2× boyutta (kadın ≈ 56×64, erkek ≈ 48×59 px) şeffaf zeminli yeniden çizim (`docs/soy-bas.md`). Fighter ve Paladin'de omuz plakaları hâlâ ten rengine boyanıyor (kafa dışında, bu görevin kapsamı dışında): `goliath-female-fighter`, `goliath-male-fighter`, `goliath-female-paladin`, `goliath-male-paladin`, `goliath-female-cleric`, `goliath-male-cleric` için elle maske önerilir (K21 akışı).
- **M1 — Açık tema başlığı:** (ad kararı N1'de verildi: "Dice & Hex".) Açık temada başlık metni parlak arka plan görselinde (açık tema görseli) yalnızca beyaz gölgeyle okunuyor; istenirse başlığa da cam zemin verilebilir.
- **K20 — Geçmiş (background) seçimi:** uygulamada geçmiş seçilemiyor, bu yüzden "geçmişin önerisi/verdiği feat" gösterilemiyor; köken feat'i serbest seçim. Seçenekler: (a) böyle kalsın; (b) SRD 5.2.1'in dört geçmişi (Acolyte, Criminal, Sage, Soldier) seçilebilir olsun: feat, beceriler ve yetenek bonusu kalıbı geçmişten gelsin, feat kilitli bilgi olsun (sihirbazda yeni alan, eski kayıtlar için göç).

**K21 (soy maskeleri) — kullanıcının yapması gerekenler:** `npm run soy-incele`, sayfayı açıp kırmızı örtüsü taşan jetonlara `docs/soy-maske-el.md`'deki gibi elle maske çizmek. Örtüsü ten dışına taşan (muhtemel) jetonlar:
- Goliath: `goliath-female-fighter`, `goliath-male-fighter`, `goliath-female-paladin`, `goliath-male-paladin`, `goliath-female-cleric`, `goliath-male-cleric` (omuz plakaları); `goliath-male-barbarian` (kürk/kemer), `goliath-female-barbarian` (balta sapı).
- Dragonborn: `dragonborn-male-barbarian`, `dragonborn-male-monk`, `dragonborn-female-monk` (kıyafet), `dragonborn-female-barbarian`, `dragonborn-female-sorcerer`, `dragonborn-female-druid` (saç, kürk), `dragonborn-male-druid`, `dragonborn-male-bard` (el/çalgı sınırı).
- Drow (elf): `elf-female-monk`, `elf-male-monk` (turuncu kıyafet), `elf-female-barbarian`, `elf-male-barbarian` (kürk/kemer), `elf-female-sorcerer`, `elf-male-sorcerer` (saç ucu).
Bu liste 128 px görüntüden; kesin karar inceleme sayfasında.

**Kuyruk 8:**

- **A6 — Çok altıgenli boyutu açmak:** motor bayrağı `multiHex` hazır ama varsayılan kapalı ve arayüzde yok; kalan işler `docs/harita/COKLU-ALTIGEN.md` "Kalanlar" (kurulumda otomatik yerleşim, zemin etkileri, itme, görüş hattı, yapay zekâ hedef sırası). Açılınca simülasyon senaryolarındaki Large+ canavarlar (ogre, ejderhalar…) değişir; denge yeniden ölçülmeli. Seçenekler: (a) kalanlar bitince Game Master kurulumunda "deneysel" anahtar, varsayılan kapalı; (b) kalanlar bitince varsayılan açık + denge turu; (c) kapalı kalsın.
- **A4 — Biat Yemini verisi:** SRD'de yok; genel `leash` etkisi ve özellik türü hazır. İçerik paketinde Biat Yemini S3 şöyle yazılır: `"effect": { "type": "action", "status": "ok", "effect": { "kind": "leash", "rangeFt": 30, "radiusFt": 30, "save": "wis", "rounds": 10 } }` (kaynak/kullanım sayısı paketin metnine göre). Kullanım bedeli (Channel Divinity mi?) ve süresi kitabın metninden doğrulanmalı.
- **A5 — Harp Koleji S10:** genel kanca hazır (`stat: extraBonusActions`, `value`). Harp verisi depoda yok; içerik paketinde S10 özelliğine bu satır eklenmeli; "her turda mı, kısa dinlenmede bir mi" kitaptan doğrulanmalı (kanca her tur yenileniyor).
- **K19 — erkek Dragonborn White:** istekte hem "eski yönteme dönsün" listesinde hem "yeni yolda kalsın" cümlesinde; yeni yolda (K15) bırakıldı. Eski yönteme almak tek satır veri (`byGender.male.lineages.white`: K8b `{h 200, s 0.03, l 1.45}`). Erkek Copper K8b değerinden tek sapma: ton 14 → 20 (Red ile ayrışsın diye).

**Kuyruk 7:**

- **K15 — Eşik altında kalan soy yok** (ΔE ≥ 15, 120 jetonun hepsinde). Sınırda kalanlar: Dragonborn Brass/Gold 16,0, Black/Silver 16,5, Brass/Copper 17,4 (rozet duruyor). Maske sınırları: Dragonborn boynuz ve kuyruğu, Tiefling boynuzları ten paletine yakın olduğu için boyanıyor; Goliath Cleric/Fighter/Paladin'de yalnızca baş boyanıyor (kol ve el zırhla aynı renkte); erkek Dragonborn Ranger ve kadın Druid'de el, asa/yay dışlama kutusunda kaldığı için boyanmıyor. Seçenekler: (a) böyle kalsın; (b) sorunlu jetonlar için elle çizilmiş maske; (c) soy başına ayrı görsel seti.
- **K17 — Taslağın kalıcılığı:** sınıf değişince eski seçimler yalnızca sihirbaz açıkken taslakta tutuluyor; kaydedip yeniden açınca eski sınıfın seçimleri yok (kayıt biçimi bozulmasın diye). Seçenekler: (a) böyle kalsın; (b) taslağı karaktere yaz (kayıt biçimi değişir).

**Kuyruk 6:**

- **DENGE-4 — Büyücü partisinin büyüklüğü:** görev "dört sınıf + Fighter ve Cleric" dediği için parti 6 kişi; senaryo bütçeleri 5 kişiye göre olduğundan sonuçlar diğer partilerle doğrudan karşılaştırılamaz. Seçenekler: (a) böyle kalsın (sınıf teşhisi üye başına hasarla yapıldı); (b) 5 kişilik varyant (ör. Bor çıkar) ekleyip yeniden ölç; (c) 6 kişilik partiler için senaryo düşmanlarını ölçekle.
- **DENGE-4 — Sorcerer yapay zekâsı Metamagic ve Font of Magic kullanmıyor:** Sorcerer zaten Wizard düzeyinde hasar verdiği için eklenmedi. Seçenekler: (a) kalsın; (b) basit kural (Quickened + cantrip, Careful dost alandayken) ve yeniden ölçüm.

- **K13 — Wild Shape biçim saldırılarında kapsam dışı kalanlar:** recharge'lı ve save'li saldırılar (Giant Spider Web, Swarm of Ravens Cacophony, Lion Roar, Constrictor Snake Constrict) ve alan saldırıları biçimde seçenek değil; Death Dog ısırığının hastalığı (lanet/ikinci aşama; canavarda da yok); sürülerin "kendi Bloodied" hasar değişimi Druid'in HP'sine bakar (biçimin ayrı HP'si yok, SRD 5.2.1). Seçenekler: (a) kalsın; (b) save'li biçim saldırıları için `monster_attack` benzeri ayrı komut.

**Kuyruk 5:**

- **U3 — Savaş sonu başlık videoları:** kuyruk 5'te klasör yoktu, atlandı; videolar eklendi, **kuyruk 6'da yapıldı** (aşağıda).
- **Yeni sınıflar için denge partisi:** Warlock, Bard ve Druid (ve Sorcerer) denge partilerinde yok; mevcut partiler birebir aynı sonuç verdi (DENGE.md). Seçenekler: (a) böyle kalsın; (b) dört sınıftan oluşan "büyücü" partisi (`data/sim-partiler.json`, SRD'ye göre eksiksiz 1/3/5 sayfaları) + 100 tohum.
- **DRUID — Wild Shape kuralı:** görevde "biçimin HP havuzu, taşan hasar asıl HP'ye" yazıyordu; bu 2014 kuralı. SRD 5.2.1'de Druid kendi HP'sini korur ve seviyesi kadar geçici HP alır; uygulama SRD 5.2.1'i izliyor. Seçenekler: (a) SRD 5.2.1 kalsın (önerilen; kaynak yalnızca SRD 5.2.1); (b) eski kural (SRD dışı, önerilmez).
- **DRUID — Beast saldırılarının ek etkileri:** biçimdeyken saldırılar silah seçeneği olarak; canavarın saldırı ek etkileri (Wolf'un yere düşürmesi, Giant Spider'ın zehri), recharge'lı ve save'li saldırılar yok. Seçenekler: (a) kalsın; (b) biçim saldırılarını canavar saldırısı yolundan (`monster_attack`, rider'lar) yürütmek.
- **WARLOCK — Thirsting/Devouring Blade:** ek saldırı pact silahıyla sınırlanmıyor. Seçenekler: (a) kalsın (Warlock'un tek yakın silahı çoğunlukla pact silahı); (b) saldırı başına silah denetimi.
- **BARD — Cutting Words zar seçimi:** SRD'de tepki anında saldırı ya da hasar zarı seçilir; oyunda zar atıldıktan sonra yararlı olana uygulanıyor; kontrol başarısı ve büyü hasarı tetikleri yok. Seçenekler: (a) kalsın; (b) oyuncuya "saldırı / hasar" seçimi sorulsun.
- **Song of Rest** SRD 5.2.1'de yok (2014 kuralı); eklenmedi.

**Kuyruk 4:**

- **CLERIC — Divine Intervention (10) ve Greater Divine Intervention (20):** veride `none`, Aşama 2 (5. seviyeye dek herhangi bir Cleric büyüsü / Wish; oyunda 4.+ seviye büyü yok). Seçenekler: (a) 4.+ seviye büyüler gelene dek kalsın; (b) şimdilik 0–3. seviye büyülerden birini slotsuz yapma (eksik bir uyarlama).
- **WIZARD — Spell Mastery (18) ve Signature Spells (20), Overchannel (Evoker 14):** veride Aşama 2 (1–3. seviye büyüler slotsuz / en yüksek hasar; Overchannel 1–5. seviye). Seçenekler: (a) kalsın; (b) Spell Mastery ve Signature Spells oluşturucuda büyü seçimiyle şimdi (büyüler 1–3. seviye olduğu için mümkün), Overchannel 1–3. seviyeye sınırlı.
- ~~**SORCERER — Seeking Spell ve Transmuted Spell:**~~ **Çözüldü (K11):** (b). SRD 5.2.1'de 10 Metamagic var; oyunda 8. Seeking (ıskalayan büyü saldırısını yeniden at, 1 SP) ve Transmuted (Acid/Cold/Fire/Lightning/Poison/Thunder arasında tür değiştir, 1 SP). Görevde yazılmadığı için eklenmedi. Seçenekler: (a) kalsın; (b) ikisi de eklensin (Seeking: saldırı yolunda ikinci d20; Transmuted: `damageChoices` kalıbıyla).
- **SORCERER — Elemental Affinity "renk":** SRD 5.2.1'de ejderha rengi yok; beş hasar türünden biri seçilir (tek seçim, varsayılan Fire). Seçenekler: (a) böyle kalsın; (b) Dragonborn soyuyla eşleşen tür varsayılan olsun (yalnızca öneri; seçim yine serbest).
- ~~**SORCERER — Innate Sorcery kapsamı:**~~ **Çözüldü (K11):** (b) `classSpells`. SRD "Sorcerer büyüleri"; oyunda karakterin bütün büyüleri (soy büyüleri dahil). Seçenekler: (a) kalsın (küçük sapma); (b) büyünün kaynağı (sınıf/soy) izlenip yalnızca sınıf büyülerine.
- **SORCERER — Font of Magic ve Metamagic yapay zekâsı:** yapay zekâ yalnızca Innate Sorcery kullanır. Seçenekler: (a) kalsın (denge partilerinde Sorcerer yok); (b) Sorcerer'lı yeni denge partisi + basit Metamagic sezgisi (Quickened cantrip, Twinned Hold Person, Careful Fireball).
- **K8b — Renk farkı yetersiz kalan soylar** (rozet mi, ek görsel mi): **Goliath'ın 6 soyu** (gri ten metal zırhla aynı tonda: ten az değişiyor, zırh renkleniyor; en zayıf), **Gnome Rock / Forest** (fark küçük, Rock temel görünüme çok yakın), **Dragonborn Brass / Bronze / Gold** (birbirine yakın sarı-kahve tonlar; altın süslü zırhta zırh da boyanıyor), **Wood Elf** (temel görünüme yakın). İyi ayrışanlar: Dragonborn Black/Blue/Green/Red/Copper/Silver/White, Tiefling üç soy, Drow, High Elf. Seçenekler: (a) böyle kalsın; (b) zayıf soylara köşe rozeti (yedek; veri rengi hazır); (c) Goliath (ve istenirse Gnome) için ayrı görsel seti (Goliath 120 görsel, ≈2,6 MB).

**Kuyruk 3:**

- **K8 — Alt ırk görselleri** (`docs/harita/ALT-IRK-GORSEL.md`): (1) yalnızca soy rozeti (0 görsel, ≈0 kB); (2) kodla palet değiştirme (CSS hue-rotate önerilmez; ten maskesiyle derlemede Dragonborn için 216 jeton, ≈5,6 MB depo); (3) tamamen ayrı görseller (456 görsel, ≈10 + 1,6 MB depo). Sayfa başına yük üçünde de değişmez. **Öneri:** şimdi (1), sonra yalnızca Dragonborn için (2) derlemede, Drow için istenirse (3).
- ~~**K9b — Karmaşık yukarı slot etkileri:**~~ **Çözüldü (WIZARD):** (b) yapıldı (`targetIds` ile çok hedefli save, Chromatic Orb sıçraması). Eski metin: Hold Person ve Blindness/Deafness slot başına +1 hedef (tek hedefli save komutu; çok hedef seçimi ve yapay zekâ hedef seçimi gerekir), Chromatic Orb sıçraması (aynı zar iki kez gelince yeni hedefe; slot seviyesi kadar). Seçenekler: (a) kalsın (veride, `applied` yok); (b) save büyülerine `targetIds` (Bless'teki çok hedef kalıbı) + Chromatic Orb için zincir hedef komutu.
- ~~**K9d — Kalkan:**~~ **Çözüldü (K9d-kalkan):** SRD metni birebir alıntılandı (DECISIONS.md): kalkan yalnızca AC'yi kaybettirir; davranış kaldı.
- **K9c — Jump maliyeti:** SRD "10 ft hareket harcayarak 30 ft'e kadar zıpla"; oyunda büyülü zıplama 2 altıgen harcar, yalnızca gerekince (engel, menzil ya da daha ucuz) ve turda bir kez. Seçenekler: (a) böyle kalsın; (b) zıplama her zaman yürüme maliyetiyle (görevdeki "ek maliyet yok" sözünün dar okuması).

**Önceki kuyruklar:**

Kuyruk 2 ve aynı gecenin görevleri: K3 (adım sayısı, soy büyüsü yeteneği, Goliath isabet yetenekleri, Stone's Endurance kapsamı, oyunda olmayan soy özellikleri), K4 (yetkin olunmayan zırh cezası, dağıtılmamış geçmiş bonusu), K7 (Eldritch Invocations; aşağıda). K5 ve K6'da karar bekleyen yok (sınıf tabloları eksiksiz).

- **K7 — Warlock Eldritch Invocations:** SRD 5.2.1'de 1. seviyeden seçilen yetenekler (Agonizing Blast, Pact of the Blade, Thirsting Blade: 5. seviyede Pact silahıyla Extra Attack…). Oyunda yok. Seçenekler: (a) yok kalsın (Warlock büyüleriyle oynar); (b) sihirbazda Invocation seçimi + en çok kullanılan birkaçının mekaniği (Agonizing Blast: Eldritch Blast hasarına CHA; Thirsting Blade: `attacksPerAction` 2; Repelling Blast: itme), diğerleri "oyunda yok" ⓘ ile.

- ~~**K1 — "Zarla" yöntemi:**~~ **Çözüldü (K2a):** (b) yapıldı, 4d6 en düşük atılır; otomatik ya da masa zarı.
- **K1 — "Aynı 4 alakasız alt sınıf" dolgusu depoda bulunamadı:** her sınıfın tam bir SRD alt sınıfı var. Olası kaynak tarayıcıdaki dış içerik paketi (Ayarlar → Dış içerik) ya da yerel `icerik/` klasörü. Sihirbaz kuralı genel uygulandı (veride alt sınıf yoksa "Yakında"; açılışta sınıfta olmayan alt sınıf temizlenir). Kaynak dış içerikse paketi Ayarlar'dan kaldırman yeterli.

- ~~**L6 — Açılış katman çözünürlüğü:**~~ **Çözüldü (K2b):** (b) 1800 px (kapalı katmanlar 1200).
- ~~**B3 — Sleep ikinci aşaması:**~~ **Çözüldü (WIZARD):** (b) `escalate` + `wakeOnDamage`. Eski metin: SRD 5.2.1'de başarısız save Incapacitated, sonraki tur sonunda ikinci başarısız save Unconscious. Oyunda yalnızca tur sonu save'le biten Incapacitated. Seçenekler: (a) böyle kalsın; (b) iki aşamalı zamanlayıcı (`conditionTimers`'a "ikinci başarısızlıkta durum değişir" alanı; "second failure" kalıbını canavar etkileri de kullanır, Bilinen eksikler'de).
- **B3 — Suggestion serbest metin:** oyunda iki öneri var ("savaşı bırak", "uzaklaş"). Seçenekler: (a) böyle kalsın; (b) Game Master'ın yazdığı öneri günlüğe yazılır, etki yine "turunu kaybeder" olur; (c) öneri listesi veride genişletilir (ör. "silahını bırak", "dostuna yaklaş").
- ~~**B3 — Charm Person/Animal Friendship hasarla bitme kaynağı:**~~ **Çözüldü (K2c):** (b) `casterSide`.
- **B4 — Water Walk:** haritalarda su, bataklık ve lav altıgenleri var (derin su geçilmez, bataklık zorlu). Seçenekler: (a) savaş dışı not kalsın (şimdiki); (b) süren etki `waterWalk`: sıvı altıgenleri düz zemin sayılır (derin su/bataklık kuralı atlanır, lavın hasarı sürer), 10 dosta kadar.
- **B4 — Knock:** Kale haritasında kapı kuralı (`gate`) var. Seçenekler: (a) savaş dışı not kalsın; (b) Knock kapıyı açar (kapı kuralına "açıldı" olayı; 300 ft'lik gürültü yok sayılır).
- **B4 — Ana parça büyüdü:** büyü verisi (`data/spells.json`; B3–B5'te 109 → 168 kayıt) ana parçada; 358 → 385 kB (sınır 500). Seçenekler: (a) böyle kalsın; (b) büyü verisini tembel yüklemeye geçir (`loadSpells()`, canavar ve sınıf verisi gibi; çağrı yerlerinde yükleme sırası gerekir).
- ~~**B5 — Sanctuary:**~~ **Çözüldü (CLERIC):** (b). Eski metin: seçenekler: (a) karar bekliyor kalsın; (b) saldırı/büyü hedeflenirken saldıran WIS save, başarısızsa saldırı boşa gider (eylem/saldırı harcanır; silah, canavar ve büyü yollarına ortak bir "hedef alma" denetimi); (c) basit yaklaşık: korunana saldırılar dezavantajlı (SRD'den uzak).
- ~~**B5 — Warding Bond:**~~ **Çözüldü (CLERIC):** (b). Eski metin: seçenekler: (a) karar bekliyor kalsın; (b) hedefe +1 AC/save ve direnç, hedef hasar alınca büyücüye aynı miktarda ikinci hasar olayı (bütün hasar yollarında ortak kanca); (c) bölüşmesiz (yalnızca güçlendirme; dengesiz).
- ~~**B5 — Jump / Spider Climb:**~~ **Çözüldü (K9c):** (b) yapıldı (ayrıntı DECISIONS.md).
- ~~**B5 — Bestow Curse'ün diğer üç seçeneği**~~ **Çözüldü (CLERIC):** (b). (saldırıya dezavantaj, tur başı WIS save ya da eylem kaybı, büyücünün isabetlerinde +1d8 necrotic): seçenekler: (a) yalnızca ilk seçenek kalsın; (b) üçü de `variants` ile eklensin (tur başı save için B3 zorlama kalıbına "save ile" eki gerekir).

- **K3 — Sihirbaz adım sayısı:** kimlik + tür + sınıf birleşince büyücüde 7, büyücü olmayanda 6 adım oldu (görevde 8/7 yazıyordu; üç adım birleşince iki adım düşer). Seçenekler: (a) 7/6 kalsın; (b) "Soy ve özellikler" gibi ayrı bir adım eklenip 8/7'ye çıkılsın.
- **K3 — Soy büyülerinin yeteneği:** SRD'de soy seçilirken INT/WIS/CHA seçilir; oyunda büyücü sınıfta sınıfın yeteneği, değilse en yükseği. Seçenekler: (a) böyle kalsın; (b) sihirbaza "soy büyüsü yeteneği" seçimi (kayıtta yeni isteğe bağlı alan; büyücü sınıfta ayrı DC gerekir).
- **K3 — Goliath isabet yetenekleri (Fire's Burn, Frost's Chill, Hill's Tumble):** oyunda silah isabetinde otomatik, turda bir kez; oyuncuya sorulmuyor, büyü saldırısında yok. Seçenekler: (a) böyle kalsın; (b) isabette oyuncuya sor (tepki istemi kalıbıyla "kullan / sakla"; yapay zekâ kural tabanlı); (c) büyü saldırılarına da açılsın.
- **K3 — Stone's Endurance kapsamı:** yalnızca saldırı isabetinin hasarında; büyü save'i, alan ve zemin hasarında yok. Seçenekler: (a) böyle kalsın; (b) bütün hasar yollarına ortak "hasar alınca" tepki kancası (Warding Bond ile aynı kanca).
- **K3 — Oyunda olmayan soy özellikleri:** Goliath Large Form (5. seviye) ve Powerful Build, High Elf'in uzun dinlenmede cantrip değiştirmesi, Rock Gnome'un mekanik aletleri. Seçenekler: (a) ⓘ notuyla kalsın; (b) Large Form süren etki olarak (boyut L, hız +10, STR avantajı; yalnızca görsel ölçek değişir), cantrip değiştirme dinlenme ekranında seçim.

- ~~**K4 — Yetkin olunmayan zırhın cezası:**~~ **Çözüldü (K9d):** (b) motorda ceza + sihirbaz uyarısı.
- ~~**K4 — Dağıtılmamış geçmiş bonusu:**~~ **Çözüldü (K9e):** (c) yumuşak uyarı, kaydı engellemez.

---

## K1: Karakter oluşturma sihirbazı

- Tek uzun form 9 adımlı sihirbaza çevrildi (Kimlik, Irk, Sınıf, Puanlar, Beceriler, İlerleme, Donanım, Büyüler, Özet); büyü seçemeyen sınıfta 8 adım.
- Veri, kayıt biçimi ve kurallar aynı: sorunlar `characterIssues` ile adımlara bağlandı (metinler aynı). Eksik "Devam"ı engellemez; Kaydet yalnızca Özet'te ve eksik yoksa çalışır. Eksikler kırmızı düğme, ilgili adıma götürür.
- Masaüstü: üstte adım çubuğu (✓ yeşil / turuncu geçerli / kırmızı "!"), sağda 290 px özet paneli. Mobil: "4 / 9 · Puanlar" başlığı, ilerleme çubuğu, alt özet çubuğu ("N eksik" açılır liste), 48 px Geri/Devam.
- Puanlar: altı kutu tek sırada (mobilde 2 sütun), "N temel + M geçmiş", standart dizide değer tek kutuda (yer değiştirme), puan satın almada "Kalan puan X / 27" çubuğu; geçmiş bonusu ve seviye artışı alttaki kutuda.
- Beceriler: 18 becerilik tek liste, Sınıf (turuncu) / Geçmiş (yeşil, kilitli) rozetleri, sayaçlar. Donanım: zırh türü düğmeleri + Kalkan, silah kartlarında ustalık düğmesi ("★ Nick"), "Silahlar: seçili N · Ustalık X / Y". Geliştirici etiketleri ⓘ ipucunda.
- Alt sınıfı veride olmayan sınıfta "Yakında" kutusu, eksik sayılmaz; kayıtlı geçersiz alt sınıf açılırken boşa çevrilir (bir kerelik not).
- Sihirbaz ayrı parça (`Builder`, 31,9 kB): ana parça **383 → 358 kB**.
- Testler: 7 yeni sihirbaz testi; tam paket 96 dosya / 1097 test; check:harita 160/0, check:ses 15/0.
- Ekran görüntüleri: `docs/sabah/k1-puanlar-masaustu.jpg`, `docs/sabah/k1-puanlar-mobil.jpg`.
- Commit 60186b6.
- Sapmalar: "Zarla" yöntemi yok (karar bekliyor); oyunda ayrı bir "geçmiş" varlığı olmadığı için geçmiş becerilerini oyuncu seçer (en çok 3), seçildiğinde kilitli rozetle gösterilir.

---

## L6: Açılışta kapalıdan açık kanada geçiş

- Kanıt toplandı: açılış dondurulup (Web Animations API) 2x ekran görüntüsü ve katman opaklık/z-sıraları alındı (masaüstü 1280×800, mobil 390×844).
- (a) Kapalı ve açık kanat ilk ≈160 ms'de aynı karede (0,9/0,06 → 0,1/1). Düzeltme: kapalı kanatlar açık kanatlardan önce tamamen söner (140 ms, `wing-at`'ta biter), açık kanatlar katlı pozdan ≈110 ms'de belirir. Sonra: 0 ms 0/0, 60 ms 0/0,84; iki siluet yok.
- (b) Kaynak görselde şerit/çentik yok. Canlı katmanda `will-change: transform` katlı pozda rasterleştirip büyütüyordu; kaldırıldı. Katman çözünürlüğü (1400 px) karar bekliyor.
- (c) Son logo karesinde çentik yok; açılış sırasında kanat katmanının kök kenarındaki dikey kesik (katman kutusu sınırı) kapalı gövdenin üstünde basamak gibi görünüyordu. Kök kenarına %3'lük yumuşak maske; tam açık görünüm aynı. Canlı zarın silueti bu bölgenin dışında (sorun zardan değil).
- Önce/sonra kareleri: `docs/sabah/l6-once-*.jpg`, `docs/sabah/l6-sonra-*.jpg` (0060 çift kanat, 0700 kök basamağı, 2000 son kare, mobil 0700), yakın plan `l6-kanat-koku-once/sonra.jpg`.
- Commit 5bc7f7d.
- Testler: açılış testleri (soğuk açılış, dönüş, atlama, hareketi azalt) yeşil + 1 yeni (kanat devri süresi). Tam paket 96 dosya / 1098 test; check:harita 160/0, check:ses 15/0. Ana parça 357,9 kB.

---

## B3: Zihin kontrolü ve yanılsama

- Yeni motor parçaları (`src/battle/mind.ts` + süren etki alanları): büyüleme (`charm`: büyüleyene saldırı yok), hasarla bitme (`breakOnDamage`), hasarla yeniden save (`damageSave`, Hideous Laughter avantajlı), zorlama hareketi (`compelEvents`: Command Approach/Flee, Fear kaçışı Dash ile, Suggestion "uzaklaş"; tur başında motorca, sonra tur biter), süren zorlama (`commandPersist`), büyücünün turunda hasar (`sourceTurnDamage`), Mirror Image kopyaları (`images`; isabette d6 ≥ 3 kopyaya), Protection from Evil and Good'un Charmed/Frightened koruması (`wardedFrom`, reducer).
- Büyüler: Charm Person, Animal Friendship (yeni), Command (5 sözcük; Drop yalnızca tur kaybı), Hideous Laughter, Fear, Hypnotic Pattern, Calm Emotions (yeni), Suggestion (yeni; iki seçenek), Mirror Image, Phantasmal Force (yeni), Protection from Evil and Good. Büyü sayısı 109 → 113.
- Savaş dışı işaretlenenler (denetimde "savaş dışı"): Minor Illusion, Prestidigitation, Disguise Self, Unseen Servant, Arcanist's Magic Aura, Silent Image, Major Image.
- **Denetim (0–3. seviye, 183 büyü):** önce tam 56 / kısmi 42 / yok 85 → sonra tam 56 / kısmi 47 / yok 80. Zihin kontrolü grubundaki büyülerin hepsi artık kısmi (sapmalar `approx` notunda); hiçbiri "tam" değil çünkü her birinde SRD'den küçük bir sapma var.
- Testler: `src/battle/b3.test.ts` 12 test (her büyü; konsantrasyon, süre, hasarla bitme, zorlama hareketi, replay). Kayıt uyumluluğu: olay biçimi değişmedi (yalnızca süren etkiye isteğe bağlı alanlar ve yeni hasar etkisi `effect_save`); `SAVE_VERSION` 19 kaldı, eski kayıt testleri yeşil.
- Teknik düzeltme: hasar profili takma adları (`const profileOf = damageProfile`) yeni döngüsel içe aktarmayla modül yüklenirken tanımsız kalıyordu; tembel sarmalayıcı yapıldı (7 dosya, davranış aynı).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (simülasyon partileri yeni büyüleri kullanmıyor).
- Commit d386872. Tam paket 97 dosya / 1110 test yeşil. Ana parça 361,3 kB. check:harita 160/0, check:ses 15/0.
- **Eksik sprite/ikon:** durum sprite'ları Charmed, Frightened, Incapacitated için var. Eksik: Mirror Image kopyaları (jetonda kopya göstergesi yok, yalnızca etki simgesi 👥), Phantasmal Force yanılsaması, Calm Emotions kayıtsızlığı, zorlama hareketi (Command/Fear kaçışı) için ayrı görsel; şimdilik etki simgeleri (emoji).

---

## B4: Aydınlatma, algılama, nesne büyüleri

- Işık: büyü ışıkları karanlık/gece haritalarının ışık listesine (`litHexes`) eklendi: süren etkide `light` (Light, Continual Flame, Flame Blade, Faerie Fire, Starry Wisp) ve alanda `zone.light` (Dancing Lights, Daylight). Yalnızca parlak ışık; ışıksız haritada etkisiz.
- Darkness: yoğun örtü alanı + büyülü karanlık (ışık aydınlatamaz, karanlık görüş içini göremez); Daylight örtüşen Darkness'ı kaldırır.
- Görünmezlik: Faerie Fire (DEX save; saldırılar avantajlı, Invisible yararı yok, ışık), Starry Wisp (isabette aynı işaret), See Invisibility (görünmeze dezavantaj yok). Ortak yer `src/battle/sight.ts`.
- Flame Blade (bonus eylemle hazır, saldırı "Büyüyü sürdür" ile aynı turda da; 3d6 + yetenek, slot başına +1d6), Sorcerous Burst (tür seçimi; patlayan zar yok).
- **Savaş dışı (Game Master'a not):** 25 büyü (Mage Hand, Thaumaturgy, Elementalism, Purify Food and Drink, Arcane Lock, Create Food and Water, Detect Magic, Detect Evil and Good, Detect Poison and Disease, Detect Thoughts, Find Traps, Locate Animals or Plants, Locate Object, Sending, Meld into Stone, Water Breathing, Water Walk, Knock + B3'ün 7 yanılsaması). Sihirbaz çipinde "savaş dışı" etiketi, savaş menüsünde "savaş dışı · Game Master", günlükte not. Ekran görüntüsü: `docs/sabah/b4-savas-disi.jpg`.
- **Denetim:** önce tam 56 / kısmi 47 / yok 80 → sonra tam 56 / kısmi 57 / savaş dışı 25 / yok 45 (yeni durum: savaş dışı). Büyü sayısı 113 → 145.
- Testler: `src/battle/b4.test.ts` 9 test (ışık, karanlık + Daylight, Dancing Lights konsantrasyonu, Faerie Fire, See Invisibility, Starry Wisp, Flame Blade, Sorcerous Burst, savaş dışı notu; replay). `spells.test.ts` yukarı slot listesine Flame Blade eklendi (veri değişikliği). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `zone_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (Mağara karanlık haritası dahil; simülasyon partileri yeni büyüleri kullanmıyor).
- Commit f869fbf. Tam paket 98 dosya / 1119 test yeşil. Ana parça 373,8 kB (+12,5 kB büyü verisi; karar bekliyor). check:harita 160/0, check:ses 15/0.

---

## B5: Özel mekanikli büyüler

- Denetimdeki "özel mekanik" grubunun 31 büyüsü (+ Alter Self; Detect Magic B4'te) tek tek ele alındı:
  - **Çalışıyor (14):** Color Spray, Expeditious Retreat, Ice Knife, Alter Self, Darkvision, Dragon's Breath, Enhance Ability, Pass without Trace, Protection from Poison, Bestow Curse, Dispel Magic, Remove Curse (çoğu kısmi, sapmalar `approx`'ta); Darkvision ve Pass without Trace tam.
  - **Savaş dışı (10):** Druidcraft, Comprehend Languages, Floating Disk, Goodberry, Speak with Animals, Animal Messenger, Enthrall, Gentle Repose, Speak with Dead, Tongues.
  - **Karar bekliyor (4):** Sanctuary, Warding Bond, Jump, Spider Climb (yukarıda seçenekler).
  - **Kısmi kaldı (5):** Hex, Mage Armor, Invisibility, Magic Weapon, Mind Spike.
- Küçük motor kancaları: `darkvisionOf`, `checkAdv` (`checkMode`), `stealthAuraFor`, `cureOnCast`, `burst`, `kind: dispel`. Yeni geniş sistem yok.
- **Denetim:** önce tam 56 / kısmi 57 / savaş dışı 25 / yok 45 → sonra tam 58 / kısmi 67 / savaş dışı 35 / yok 23. Büyü sayısı 145 → 168.
- Testler: `src/battle/b5.test.ts` 12 test (veri sınıflaması, Ice Knife patlaması ıskada da, Color Spray süresi, Dragon's Breath, Expeditious Retreat, Alter Self, Darkvision, Enhance Ability, Pass without Trace konsantrasyonu, Protection from Poison, Bestow Curse + Remove Curse, Dispel Magic; replay). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `effect_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı**.
- Commit 62eeb18. Tam paket 99 dosya / 1131 test yeşil. Ana parça 382,9 kB (büyü verisi +23 kayıt). check:harita 160/0, check:ses 15/0.

---

## CILA: B1/B2 sapmalarının düzeltmeleri

1. **Haste / Slow / Ray of Enfeeblement:** Haste'in ek eylemi ("Hızlı eylem", eylemden sonra; tek silah saldırısı, Dash, Disengage, Hide; yapay zekâ kullanır). Slow: DEX save −2, eylem ya da bonus eylem (ikisi değil), Attack tek saldırı. Ray of Enfeeblement: yakın dövüş (STR) saldırıları ve STR kontrolleri dezavantajlı. Ekran görüntüsü: `docs/sabah/cila-hizli-eylem.jpg`.
2. **Entangle/Web:** tur sonu save'i kalktı; eylemle ("Kurtul") Athletics kontrolü büyünün DC'sine karşı. Yapay zekâ tutulunca önce kurtulmayı dener.
3. **Sis içinden görüş:** iki taraf da örtünün dışındayken aradaki yoğun örtü iki tarafı görünmez yapar (avantaj ve dezavantaj birbirini götürür).
4. **Wind Wall:** menzilli silah saldırısı duvardan geçerken otomatik ıskalar (günlükte neden; yapay zekâ boşa atmaz); duvar düz ya da yay biçiminde (önizleme balonunda seçim).
5. **Acid Arrow** yukarı slotta gecikmeli hasar da +1d4; **Silence** içindeki yaratık Thunder'a bağışık; **Blindness/Deafness** Deafened seçilebilir (motor), Deafened Command ve Suggestion'ı engeller.
6. **Flaming Sphere ve ruh sürüsü:** kendi turları yok; sahibi bonus eylemle 30 ft taşır ("Çağrıyı taşı"); küre bitişik düşmana çarptırılır. Yapay zekâ basit kuralla taşır.
7. **Yapay zekâ zemin büyüleri:** Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud, Moonbeam: alanda en az iki düşman ve hiç dost yoksa.
- **Denetim:** önce tam 58 / kısmi 67 / savaş dışı 35 / yok 23 → sonra tam 59 / kısmi 66 / savaş dışı 35 / yok 23 (Acid Arrow tam). Kısmi kalanlardaki notlar daraldı (Haste, Slow, Ray of Enfeeblement, Entangle, Web, Fog Cloud, Wind Wall, Silence, Blindness/Deafness, Flaming Sphere, Conjure Animals).
- Testler: `src/battle/cila.test.ts` 11 test (her madde; replay). `b2.test.ts` ve `spells.test.ts` bilerek değişen davranışa göre güncellendi (commit mesajında gerekçe).
- **Hızlı regresyon** (HEAD'e karşı, 100 tohum; standart ve paladin × 3./5. seviye; Mağara, Dungeon, Kale, Volkan): en büyük fark ±2 puan (standart 3 Volkan 62 → 63, Dungeon 91 → 90; paladin 5 Volkan 89 → 91); aralık dışı satırlar önceden de dışındaydı (`docs/harita/DENGE.md`).
- Tam paket 100 dosya / 1142 test yeşil. Ana parça 384,8 kB. check:harita 160/0, check:ses 15/0. Kayıt sürümü 19 (yeni olaylar `haste_action`, `summon_steered`; eski kayıtlar yüklenir).
- Commit 1c745ed.

---

## L7: Son logo karesinde zarın omuzlarındaki çentik

- Kanıt (2x, son kare, koyu/açık, masaüstü/mobil): (A) L6'nın kök kenarı maskesi kaldırılınca omuzlardaki açık kırmızı çentik kayboluyor; fark yalnızca kanat kökünün %3'lük şeridinde (maske şeridi yarı saydam bırakıp alttaki geniş gövdenin hafif kaymış konturunu gösteriyordu). (B) Canlı zar/parlama/göz gizlenince omuzlarda değişen piksel yok. (C) Canlı zar son karede sönmüş (devir), silueti çentiğe katkı vermiyor; kaynak `logo-acilis.webp` omuzlarda temiz. **Neden: A (L6 maskesi).**
- Düzeltme: maske yalnızca kanatlar açılırken; tam açılınca maske kutusu büyüyüp saydam şerit katmanın dışına çıkıyor (`splash.css`, `splash-mask-off`). L6'nın açılış sırasındaki kök basamağı düzeltmesi korunuyor.
- Önce–sonra: `docs/sabah/l7-omuz-{dark,light}-{masaustu,mobil}.jpg` (2x, 5x/10x büyütme), tam kare `l7-once-masaustu-koyu.jpg` / `l7-sonra-masaustu-koyu.jpg`, deneyler `l7-deney-A-maske.jpg`, `l7-deney-B-zarsiz.jpg`.
- Açılış testleri 21/21 yeşil; typecheck ve build yeşil; check:harita 160 kontrol 0 hata, check:ses 15 kontrol 0 hata. Ana parça 384,8 kB (değişmedi). Kaynak görselde kusur yok (karar bekleyen yok).

## K3: Tek ilk adım ve tür soyları

- **İlk adım "Karakter":** kimlik (ad, seviye, görünüm), tür kartları ("Yetenek puanı bonusu türden değil, geçmişten gelir." notuyla), soy kartları, sınıf kartları, alt sınıf ve özellikler tek adımda. Adım sayısı büyücüde 7, büyücü olmayanda 6 (karar bekleyenlerde). Adım çubuğu, ilerleme çubuğu ve eksik düğmeleri yeni adıma gidiyor ("Ad boş" → Karakter).
- **Jeton önizlemesi:** jetonu tür, görünüm ve sınıf belirliyor; üçü de anında değiştiriyor (test). Masaüstünde sağ panelde büyük (200 px), mobilde üstte küçük yapışkan şerit. Görüntüler: `docs/sabah/k3-karakter-masaustu.jpg`, `docs/sabah/k3-karakter-mobil.jpg`.
- **Soy seçici:** açılır liste yerine kartlar (masaüstünde yan yana, mobilde alt alta); kartta ad ve yalnızca ayıran özelliklerin kısa özeti (veride `summary`, TR/EN). Aynı özet özet panelinde ve karakter kartında.
- **Dragonborn:** 10 ata türü nefes türünü ve direnci zaten doğru veriyordu (test eklendi). **Tiefling:** direnç vardı; soy büyüleri (Abyssal, Chthonic, Infernal; 3. ve 5. seviye) eklendi, Hellish Rebuke slotsuz tepki.
- **Elf** (Drow: karanlık görüş 120 ft, Dancing Lights, Faerie Fire, Darkness; High Elf: Prestidigitation, Detect Magic, Misty Step; Wood Elf: hız 35 ft, Druidcraft, Longstrider, Pass without Trace), **Gnome** (Forest: Minor Illusion, Speak with Animals yetkinlik bonusu kadar; Rock: Mending, Prestidigitation), **Goliath** (6 ata, yetkinlik bonusu kadar): mevcut sistemlerle bağlandı. Seviyeli soy büyüsü uzun dinlenmede bir kez slotsuz; büyücü olmayan karakterde büyü yeteneği INT/WIS/CHA'nın en yükseği.
- **Goliath:** Fire/Frost/Hill silah isabetinde otomatik (turda bir), Stone ve Storm tepki, Cloud bonus eylemle 30 ft ışınlanma (savaş menüsünde altıgen seçilir). Kısmi olanlar yalnızca ⓘ ipucunda.
- **Soy yetenekleri** özette ve savaş kartında soy adıyla ("Drow: Faerie Fire"); savaş dışı ya da oyunda olmayanlar ⓘ ile.
- **Eski kayıt:** soyu boş Elf/Gnome/Goliath karakter ilk soyu alır, bir kerelik not. Kayıt sürümü 19.
- **Celestial:** veride alt seçeneği yok, dokunulmadı.
- **Testler:** `src/battle/lineage.test.ts` (10: özet verisi, 10 Dragonborn atası, Tiefling/Elf/Gnome büyü ve kaynakları, Drow slotsuz Faerie Fire + replay, Goliath isabet/tepki/ışınlanma + replay, eski kayıt), `wizard.test.tsx` (+3: eksiklerin adımı, jeton önizlemesi, soy kartları ve özette soy). Değişen eski testler: adım adları ve sayıları, "miras" → "soy" metni.
- **Doğrulama:** typecheck, tam paket 101 dosya / 1155 test yeşil, build (ana parça 384,8 → 394,2 kB: tür ve kaynak verisi + soy modülü; sınır 500), check:harita 160/0, check:ses 15/0. Hızlı regresyon (HEAD'e karşı, 100 tohum, standart ve paladin, 3. ve 5. seviye, Mağara/Dungeon/Kale/Volkan): kazanma oranları ±2 puan içinde (Elf üyelere soy yazıldı).

## H-SLOT: Yarım büyücünün (Ranger, Paladin) büyü yuvası yok

- **Yeniden üretim:** (a) sihirbazla yeni Ranger/Paladin 1/3/5 ve (b) hazır örnekler savaşa doğru yuvayla giriyor (1: 2, 3: 3, 5: 4 + 2); (c) **kayıtlı durumu olan** karakter (boş formun varsayılanı Fighter iken dinlenmiş ya da savaşmış, sonra Ranger/Paladin yapılmış ya da seviye atlamış) savaşa 0 yuvayla giriyordu: menüde her büyü "slot yok".
- **Neden:** yuvalar kayda yazılmıyor, savaşa girişte sınıf tablosundan hesaplanıyor (tablo doğru, 1. seviyeden başlıyor; sihirbaz alanı yazmıyor). Savaşlar arası durum kalan yuvayı tutup yeni tabloyla "en az" alındığından kazanılan yuvalar kayboluyordu.
- **Düzeltme:** durumda en çok yuvalar da (`slotMax`) tutuluyor; harcanan düşülüyor. Eski kayıtlarda yuvalar açılışta bir kez tamamlanıyor, kısa not ("Büyü yuvaları sınıf ve seviyeye göre tamamlandı"). Kayıt sürümü 19.
- **Testler:** `src/rules/slots.test.ts` (her sınıf ve seviye 1–20 için yuva tablosu, sihirbazla oluşturulan Ranger/Paladin 1/3/5 savaşta, Fighter → Ranger ve seviye atlama, eski kayıt onarımı). Değişen eski test: savaş sonucu durumu artık `slotMax` içeriyor.
- **Ekran görüntüsü:** `docs/sabah/h-slot-ranger-buyu-menusu.jpg` (eski kayıtlı 5. seviye Ranger, onarımdan sonra büyü menüsü: hepsi seçilebilir).
- **Doğrulama:** typecheck, tam paket 102 dosya / 1159 test yeşil, build (ana parça 395,0 kB), check:harita 160/0, check:ses 15/0; hızlı regresyon (standart ve paladin, 3. ve 5. seviye, 4 senaryo) HEAD ile birebir aynı.

## K4: Karakter sihirbazı cilası

- **İlerleme adımı:** yetenek artışı her ASI yuvasının kendi kartında (altı yetenek −/+, "Kalan puan n / 2", önce → sonra skoru; +2 / +1+1, 20 sınırı aynı). Puanlar adımında yalnızca temel puan ve geçmiş bonusu.
- **Puanlar:** standart dizide açılır liste yok; kutuya dokun, değer çipini seç (başka kutudaki değer soluk, seçilirse yer değiştirir). Geçmiş bonusu tek satır; mobilde ≥ 44 px.
- **Beceriler:** Türkçe adlar (İngilizce adı yanında küçük), düğmeler ≥ 44 px, mobilde okunaklı düzen.
- **Donanım:** zırh/kalkan/silahta "yetkin / yetkin değil" rozeti (zırh eğitimi SRD sınıf tablosundan `armorTraining`), "Yalnızca yetkin olduklarım" süzgeci (varsayılan açık). Zırh cezası motorda olmadığı için uyarı konmadı (karar bekleyenlerde).
- **Uyum sınırı:** motor bütün uyumlu eşyaları uyguluyordu; artık en çok 3 (ilk 3). Dördüncü seçilemez, sayaç "uyum n / 3"; eski kayıtta fazlası Donanım eksiği.
- **Özet:** tek Kaydet; dağıtılmamış geçmiş bonusu satırı kaldırıldı (eksik sayılmıyor; karar bekleyenlerde).
- **Alt sınıf adları:** "Evokasyon Ustası (Evoker)", "Yaşam Etki Alanı (Life Domain)", "Bilgi Koleji (College of Lore)"; listede TR + SRD adı.
- **Testler:** `src/screens/k4.test.tsx` (8: değer çipleri, uyum sınırı sorun/etki/arayüz, zırh eğitimi, rozet ve süzgeç, tek Kaydet, Türkçe adlar), `asi-ui.test.tsx` yeni yere göre yeniden yazıldı; wizard testinde beceri adı ve kutu sınıfı güncellendi. Tam paket 103 dosya / 1168 test yeşil; build (ana parça 396,7 kB), check:harita 160/0, check:ses 15/0; hızlı regresyon HEAD ile birebir aynı.
- **Ekran görüntüleri:** `docs/sabah/k4-ilerleme-masaustu.jpg`, `docs/sabah/k4-ilerleme-mobil.jpg`.

## K5: Taşıma kapasitesi

- **Veri:** bütün silah, zırh ve eşyalarda `weight` (lb); silah/zırh SRD tablolarından, eşyalar SRD Adventuring Gear tablosundan; SRD'de ağırlığı olmayan sihirli eşyalarda varsayım `weightApprox: true` (DECISIONS.md). Kalkan 6 lb ve eşikler `data/tasima.json`.
- **Kural:** kapasite Güç × 15 lb. Ayarlar'da "Taşıma yükü kuralı": Kapalı / SRD sınırı (varsayılan) / Kademeli (Güç × 5 üstü Yüklü −10 ft; Güç × 10 üstü Ağır yüklü −20 ft + STR/DEX/CON testleri, kurtarmalar ve saldırılarda dezavantaj).
- **Sihirbaz:** Donanım adımında "Taşınan x / y lb" çubuğu (kademelide eşik çizgileri), aşınca kırmızı uyarı; kartlarda ağırlık. SRD sınırında aşan karakter Özet'te eksik (Kaydet kapalı). Eski kayıt açılır, listede ve savaş kartında "⚖" rozeti.
- **Testler:** `src/rules/carry.test.ts` (5: veri, kapasite/yük, SRD sınırı ve eski kayıt, kademeli hız ve dezavantaj, kapalı kural), `src/screens/k5.test.tsx` (2: çubuk ve ağırlıklar, aşınca uyarı ve Özet'te eksik). Tam paket 105 dosya / 1175 test; check:harita 160/0, check:ses 15/0. Hızlı regresyon HEAD ile birebir aynı (simülasyonda kural kapalı).
- **Boyut:** ana parça 396,7 → 400,4 kB (ağırlık verisi, taşıma modülü ve metinler).
- **Sapmalar:** savaşta SRD sınırının (kapasiteyi aşmanın) etkisi yok; aşan karakter yalnızca eski kayıtta olabilir.
- **Ekran görüntüleri:** `docs/sabah/k5-donanim-masaustu.jpg` (kademeli kural), `docs/sabah/k5-donanim-mobil.jpg` (SRD sınırı).

## K6: Büyü seçim sınırları ve sınıf büyü listeleri

- **Sınırlar SRD sınıf tablolarından** (eksik tablo yok): Cantrip, Hazırlanan (Prepared Spells), en yüksek büyü seviyesi; Wizard büyü kitabı 6 + 2/seviye; Warlock'ta 2024 kuralı (Prepared Spells sütunu, Pact Magic yuvaları).
- **Büyüler adımı:** cantrip ve seviye grupları, sayaçlar ("Cantrip 3 / 4", "Hazırlanan 7 / 9", "Büyü kitabı 10 / 14"), sınırda seçim kapalı, erişilemeyen seviyeler kilitli, oyunda olmayan SRD büyüleri soluk ("oyunda yok"). Wizard'da Kitap → Hazır. `savaş dışı` etiketleri ve büyü kartları aynı.
- **Sınıf listeleri:** 8 sınıfın SRD 5.2.1 listesi kimlikle bağlı (`data/sinif-buyuleri.json`, yalnızca oluşturucu parçasında).
- **Fazla seçim:** seviye/sınıf değişince ayıklanmıyor; Özet'te "Hazırlanan büyü fazla (n / m)" eksiği (eski kayıt da açılır, eksik olarak işaretlenir).
- **Savaş:** menü yalnızca hazırlanan + cantrip (+ her zaman hazır, soy). Bonus eylem büyü kuralı: SRD 5.2.1'deki karşılığı "turda tek yuvalı büyü" zaten uygulanıyordu (test eklendi); 2014'teki "yalnızca eylemlik cantrip" kısıtı 5.2.1'de yok (DECISIONS.md).
- **Testler:** `src/screens/k6.test.tsx` (6: 8 sınıf × 1–5 tablo sayıları, listelerin SRD ile aynılığı, Wizard 5 sayaçları ve kilitli seviyeler, sınırda kapalı düğmeler ve kitap şartı, eski kayıtta fazla seçim, turda tek yuvalı büyü). Tam paket 106 dosya / 1181 test; check:harita 160/0, check:ses 15/0; hızlı regresyon HEAD ile birebir aynı.
- **Boyut:** ana parça 402,3 kB; oluşturucu parçası 68,5 kB (sınıf listeleri burada).
- **Ekran görüntüleri:** `docs/sabah/k6-buyuler-masaustu.jpg`, `docs/sabah/k6-buyuler-mobil.jpg` (Wizard 5).

## Kuyruk 3: K9a–K9e, K2a–K2c, K8

| Görev | Commit | Özet |
|---|---|---|
| K9a | `553c464` | 18 savaş dışı büyü, Game Master notu TR/EN (`gmNoteEn`); denetimde "yok" 23 → 5 |
| K9b | `c6a0f05` | `docs/harita/UPCAST.md` (61 büyü: 54 uygulanıyor, 1 kısmen, 2 yalnızca süre, 4 karar/ayrı iş, 0 uygulanmayan). Fireball, Cure Wounds, Bless… kod hazırdı, `applied` bayrağı eksikti; Fog Cloud yarıçapı, Ice Knife patlaması, Dragon's Breath, Enhance Ability, Magic Weapon +2/+3, Bestow Curse süre/konsantrasyon |
| K9c | `4d0444c` | Dikey hareket bayrağı (`ignoresHeight`/`climbs`); Spider Climb ve Jump süren etki; Fly/Levitate/Gaseous Form zaten yükseklik ve zemin engelini yok sayıyordu |
| K9d | `25f1736` | Eğitimsiz zırh: STR/DEX saldırı/save/kontrol dezavantajı, büyü yok; eğitimsiz kalkan AC vermez (SRD); sihirbaz uyarısı. **Örnek karakter:** Tavi (Cleric) Chain Mail → Half Plate (AC 18 → 17) |
| K9e | `cc4d78f` | Özet'te yumuşak uyarı, kaydı engellemez, eksik sayılmaz |
| K2a | `0eb251f` | "Zarla (4d6)": otomatik ya da masa zarı (elle zar defteri), yeniden atma yok, kutu seçimiyle yerleştirme |
| K2b | `1ce29d6` | Açılış 1400 → 1800 px, kapalı katmanlar 900 → 1200; açılış dosyaları 243 → 328 kB; ana parça etkilenmedi |
| K2c | `165fe75` | Charm Person / Animal Friendship `breakOnDamage: 'casterSide'` |
| K8 | `6bfcb23` | `docs/harita/ALT-IRK-GORSEL.md` (yalnız inceleme) |

- **Değişen eski testler:** `spells.test.ts` (uygulanan yukarı slot listesi 18 → 55; Fireball beklentisinde `applied`), `b5.test.ts` (Jump/Spider Climb artık süren etki), `k6.test.tsx` ("oyunda yok" örneği kilitli 4+ seviyede), `k4.test.tsx` (eğitimsiz zırh uyarısı var; geçmiş bonusu yumuşak uyarısı var), `logo.test.tsx` (logo-acilis genişliği 1800), `b3.test.ts` (Animal Friendship `breakOnDamage: 'casterSide'`).
- **Denge** (`docs/harita/DENGE.md`): K9b 16 satır ±2 içinde. K9d aralık dışı iki satır: standart 3 Kale %84 → %78 (−6), paladin 3 Kale %90 → %86 (−4); neden Tavi'nin AC'si. K9c ve K2c sim partilerini etkilemiyor (ölçülmedi, gerekçe DECISIONS.md'de).
- **Ekran görüntüleri:** `docs/sabah/k2a-zarla.png`, `k9d-zirh-uyari.png`, `k9e-gecmis-bonusu.png`.
- **Kuyruk sonu:** tam paket 111 dosya / 1205 test yeşil; check:harita 160/0, check:ses 15/0; ana parça 412,9 kB (sınır 500).
- **Not:** gece boyunca bir kez işçi süreci yeniden başladı (bellek); yarıda kalan K9d regresyonu ve kontroller baştan, sırayla koşuldu. Kayıp yok.

---

## K7: Saldırı ve büyü sayısı denetimi

- **Denetim:** `docs/harita/SALDIRI-DENETIMI.md` (her sınıf 1–5. seviye Attack eylemi saldırısı, Fighter 11/20; bonus eylem ve tepki saldırıları, ustalıklar; cantrip ölçeği, ışın sayıları, tur sınırları, Haste/Slow, turda tek yuva).
- **Sonuç:** Extra Attack sayıları, Light/Nick, Martial Arts/Flurry, fırsat saldırısı, Cleave, Sneak Attack turda bir, Spirit Guardians, Divine Smite, Haste tek saldırı, cantrip ölçeği ve Eldritch Blast ışınları SRD ile uyumlu.
- **Düzeltilen:** Magic Missile ve Scorching Ray'in yukarı slot dartı/ışını uygulanmıyordu (slot başına +1); düzeltildi, test `src/battle/k7.test.ts` (dart/ışın sayıları, Eldritch Blast 1/5/11/17, Extra Attack tablosu).
- **Regresyon:** paladin 5 Mağara 70 → 74 (+4; `docs/harita/DENGE.md`), diğer satırlar ±1 içinde.
- **Değişen eski test:** `spells.test.ts` uygulanan yukarı slot listesi (Magic Missile, Scorching Ray eklendi).
- **Karar bekleyen:** Eldritch Invocations (yukarıda). Tam paket 107 dosya / 1184 test; ana parça 402,3 kB; check:harita 160/0, check:ses 15/0.

