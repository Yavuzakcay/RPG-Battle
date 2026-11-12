# Kuyruk SU1: Su hex denetimi (salt okuma)

Tarih: 2026-11-11. Kapsam: yalnızca okuma ve ölçüm. Kod, veri, harita, görsel, kural sürümü (66), `SAVE_VERSION`, yapay zekâ değişmedi; bu belge ve `DECISIONS.md`'ye tek satır dışında depoya dosya girmedi. Ölçüm betikleri depo dışı geçici klasörde tutuldu (yöntem aşağıda).

## 1. Kısa özet

1. Mekanik su ile doku suyu **aynı veriden** gelir ve ayrı bir "görsel su" verisi yoktur: ikisi de `state.map.tiles` içindeki `w` (ve yalnızca Game Master "Nehir geçilmez" açıksa `R`) harflerini okur. Mekanik ek olarak `n`'yi de su sayar (yıldırım zinciri, buhar, yüzey azalması, hendek kuralı), doku `n`'yi **çizmez**.
2. Kayma **hizalamadan değil**, veriden gelir: 29 su varyantının hepsinde yayımlanan WebP boyutu `artSize` hedefiyle piksel piksel aynı, oran farkı %0,00; ızgara ile resim arasında ölçülebilir sistematik ofset yok. Kırpma yalnızca 2 haritada var (Vaha %3,5, Mantar Mağarası %4,9) ve ≤ 0,2 altıgen eder.
3. Asıl kaynaklar üç tane: (a) `w` bilerek **derin çekirdek**, sığ halka `n` (resim suyunun büyük bölümü zaten `n`; Vaha'da eksiklerin 19'u, Heykel Gölü'nde 30'u); (b) `w` satırları görselin koordinatlı ızgarasından **elle** yazıldığı için kıyı hex'i dışa yuvarlanmış (kara üstüne taşan doku); (c) hendek/nehir gibi dar şeritlerde resim suyu verideki şeritten geniş (kale hendeği duvar `s` hex'lerinin altında, kanyon nehri kıyı sazlığında).
4. Görsel doğrulanmış 10 haritada (ana varyant) 439 `w` hex'in **44'ü (%10) kara üstünde** (görünür kusur), resim suyunun eksik kalan 148 hex'inin 62'si bilinçli `n` ve 30'u duvar `s` altında (görünür kusur sayılmaz).
5. Öneri: **(c) hafif hâli** (mekanik `w` değişmez; doku için hex bazında "çıkar" listesi, isteğe bağlı `n` halkası "ekle"), kural sürümü gerekmez; ayrıntı §5.

Kısaltmalar: **taşan** = verideki `w`/`R` hex'i ama resimde su değil (doku kara üstünde); **eksik** = resimde su ama `w`/`R` değil (doku yok).

## 2. Soru 1: Su hex'leri neye göre seçiliyor?

### 2.1 Efekt/doku suyu (`fxPlan.waterHexes`, `FxLayer.WaterLayer`; Kuyruk E4b)

- **Okunan tek veri:** `state.map.tiles` (canlı zemin satırları; `tile_changed` yeni dizi üretir, önbellek `WeakMap<tiles>` ile yeniden hesaplanır) ve `state.map.id` (yalnızca iki liste için). Harita JSON'undaki varyant alanlarına, `zones`/yüzeylere, `n`'ye, `moat` kuralına, `effects` katmanına ve resme **bakmaz**.
- **Su harfleri:** `data/efekt-baglama.json` `su.harf` = `["w","R"]`; `nehirHarf` = `["R"]`.
- **Tür (dalga/havuz):** `R` = dalga; diğer su hex'i için kıyı = suda olmayan en yakın altıgen (sığ su `n` dahil, harita kenarı değil) `kiyiUzaklik` = 2 içindeyse dalga, değilse havuz. `havuzHaritalari` (`orman-heykel-golu`, `col-vaha`, `kale-onu`, `kale-ic-avlu`) bütün suyu havuz yapar; `denizHaritalari` (`ada`, `gemi`) kıyıyı yalnız gerçek karadan sayar (`n` kıyı değil). Tür **yalnızca topolojiye** bağlıdır; resimden bağımsızdır.
- **Çizim:** türün bütün hex'leri tek `path` (düzenli altıgen, yarıçap `hexW/2 × 1,03`) + tek desen; opaklık dalga 0,62 / havuz 0,58. Düzenli altıgenin yüksekliği 99,3 px, ızgara altıgeni 95,3 px (HH): dikeyde ≈ +2 px taşma, kayma nedeni değil.
- **Varyant:** hiçbir haritada varyantın `tiles` ezmesi yok (29 su varyantının hepsi aynı `tiles`); gündüz/gece/fırtına/loş aynı su hex'lerini kullanır.

### 2.2 Mekanik su

| Harf | Zemin (`terrain.ts`) | Su ile ilgili davranış |
|---|---|---|
| `w` | Derin su, zorlu, `rule: deepWater` | Yüzme/batma (`maprules.ts` `isUnderwater`/`sinkingWater`), çok derin su sınırı (`deepWater.ts`: kara = derin olmayan geçilebilir hex, yani `n` karadır), K73c su altı (`underwaterCore.inWater`), suya düşme (`fall.ts`), girdap (`terraform.ts`), `isLiquidTile`, Water Walk |
| `n` | Sığ su/çamur, zorlu | `surfaces.isWater` (yıldırım zinciri, buhar, donma: `data/yuzeyler.json` `waterTiles: [n, w]`), `waterSurfaceDecay` (gres/yağ/alev suda azalır), `moat` kuralı (`kale`, `kale-avlu` geniş, `kale-baskini`: hendek `n` + ağır zırh batması), `isLiquidTile` |
| `R` | Coşkun nehir, geçilmez, uçan geçer | Yalnızca `riverBlocked` (varsayılan kapalı, yalnız `orman-oduncu-kampi`) açıkken `w` → `R` (`forestStart.ts`); veride `R` yok |
| `b` | Derin batak (`rule: bog`) | Su değil; mekanik "batak", dokusu yok |

### 2.3 Aynı veri mi?

- **Ortak:** yalnızca `w` (+`R`) harfi. Ayrı bir "efekt suyu" listesi, resimden okunan bir alan ya da harita başına doku listesi **yok**; doku, mekanik zeminin birebir izdüşümüdür.
- **Ayrılan yerler:** (i) doku `n` çizmez, mekanik `n`'yi su sayar; (ii) `deepWater` `n`'yi kıyı sayar, doku `n`'yi kıyı sayar (deniz haritaları hariç); (iii) `moat` hendeği olan 3 Kale haritasında (`n`) doku yok, yerleşim haritalarında (`kale-onu`, `kale-ic-avlu`) hendek `w`, doku var (Kale ailesinde iki ayrı hendek kuralı); (iv) `n` içeren ama `w` içermeyen 11 haritada (`bataklik`, `yeralti-nehri`, `derinlikler-magara-karakol`, `kale`, `kale-avlu`, `kale-baskini`, `orman`, `orman-heykel-magarasi`, `magara`, `magara-genis`, `beyaz-sehir-saray-avlusu`) hiç doku yok.
- **Sınır durumları:** *köprü* (`p`) su üstünde su olmayan hex'tir: hem mekanikte yürünür hem dokuda delik; köprü çökerse `bridgeBreak` hex'i `u`'ya (uçurum) çevirir, doku **kalkar** (su yok sayılır), `riverBlocked` açıksa `R`'ye döner. *Nehir `R`*: dalga (yalnız Game Master anahtarıyla). *Vaha*: bütün `w` havuz. *Hendek*: `kale-onu`/`kale-ic-avlu` havuz. *Batak* (`b`): doku yok; `batak-*`'in `w`'si kıyıya ≤ 2 olduğu için dalga ağırlıklı (batak-adalar 122 dalga / 10 havuz). *Çalışma anı değişimi*: `terraform`, taşkın, donma `tiles`'ı değiştirir, doku mekaniği izler ama **resim sabit** kalır; bu tasarım gereği bir sapmadır (yeni haritada değil, olay sonrası).
- **Öncelik sırası (doku):** `havuzHaritalari` > `nehirHarf` (`R`) > kıyı uzaklığı. Resim hiçbir aşamada okunmaz.

## 3. Soru 2: Boyalı su ile hex suyu neden kayıyor?

### 3.1 Yöntem ve güvenilirlik

- **Kapsam:** `harita/*/*.json` içinde `w` ya da `R` geçen **17 harita, 29 varyant** (E4b tablosundaki 17'nin tamamı; başka su haritası yok, `R` hiçbirinde yok). Resim olarak oyunda gösterilen `public/maps/<bolge>/<ad>.webp` kullanıldı.
- **Resim suyu:** her harita varyantı için renk tabanlı iki bağımsız sınıflandırma. Birincil (B): harita başına renk histogramı (16 düzey/kanal) saf Bayes sınıflandırıcısı; su örneği `w` hex'lerinin iç %60'ı (tüm komşuları su olanlar; yoksa tüm `w`), kara örneği suya ≥ 3 altıgen uzak hex'ler (yoksa su dışı bütün hex'ler), sonuç hex ölçeğinde yumuşatıldı. İkinci (A): HSV renk tonu eşiği (150–245°, doygunluk ≥ 0,2). **A, koyu/yeşil sularda (bataklık, kanal) kullanılamaz** (kale hendeği ve ağaç yapraklarını da yakalar); yalnızca çapraz kontrol olarak tutuldu. `harita-zemin` önerisi ölçüt olarak kullanılamadı (bkz. §4, seçenek a).
- **Hex kararı:** bir hex'in su oranı = hex çokgeni içindeki su pikseli oranı; ≥ 0,5 (yarısı) = "resimde su". Eşik duyarlılığı (.35–.65) ve gündüz/gece farkı ölçüm gürültüsünü verir: aynı `w` verisi için gündüz ile gece uyumu ortalama %4,5, en çok %8,2 oynadı. **Rakamları ±%5 puan oku.**
- **Güven (G sütunu):** **Y** = gözle doğrulandı (kaplama görselleriyle hex hex), **O** = orta (sınıflandırıcı kısmen yanıltıcı), **D** = düşük (koyu bataklık/mağara/kanal; sınıflandırıcı güvenilmez, yalnız yön göstergesi), **P** = yer tutucu görsel (zemin harflerinden üretilmiş, kaynak jpg yok; uyum tanım gereği tam, ölçülmedi: `orman-yolu` 5 hex, `ortamlar-diyari` 6 hex).
- **Düzeltme:** Vaha'da sınıflandırıcı `#` (dış kayalık, kanyon duvarı) hex'lerini su saydı; `#` kara örneğine eklenip yeniden ölçüldü (tablodaki değerler son hâl).
- **Gece/fırtına varyantı:** B tek başına, bilgi amaçlı (Y yalnızca ana varyantta).


### 3.2 Harita tablosu

Sütunlar: *Su hex* = verideki `w`+`R` hex sayısı (doku bunları çizer); *Resim suyu* = resimde hex'in yarısından fazlası su olan hex sayısı; *Taşan/Eksik* yukarıdaki tanımlar (eksik, `n` dahil; parantezde bunun `n` olanı); *Uyum* = |W ∩ resim| / |W ∪ resim| (`n` dahil sütunu `n` hex'lerini de veri suyu sayar); *Aralık* = hex eşiği .35 ve .65 için uyum aralığı. `#` hex'leri (dış kayalık) su sayılmadı.

| Harita | Varyant | Su hex (`w`/`R`) | Resim suyu (hex) | Taşan | Eksik | (eksik: `n`) | Uyum % | Uyum % (`n` dahil) | Aralık (eşik .35–.65) | Güven |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| batak-adalar | gündüz | 132 | 127 | 26 | 21 | 7 | %69 | %72 | %68–70 | D |
| batak-adalar | gece | 132 | 136 | 20 | 24 | 8 | %72 | %75 | %64–74 | D |
| batak-cukur | gündüz | 35 | 25 | 10 | 0 | 0 | %71 | %71 | %66–81 | O |
| batak-cukur | gece | 35 | 44 | 4 | 13 | 0 | %65 | %65 | %50–76 | O |
| batak-kale | gündüz | 22 | 26 | 3 | 7 | 0 | %66 | %66 | %62–67 | D |
| batak-kale | gece | 22 | 25 | 4 | 7 | 0 | %62 | %62 | %56–69 | D |
| batak-kamp | gündüz | 15 | 34 | 2 | 21 | 1 | %36 | %28 | %28–38 | D |
| batak-kamp | gece | 15 | 27 | 3 | 15 | 1 | %40 | %30 | %31–40 | D |
| col-kanyon-nehri | gündüz | 22 | 45 | 0 | 23 | 4 | %49 | %57 | %42–58 | Y |
| col-kanyon-nehri | gece | 22 | 45 | 0 | 23 | 5 | %49 | %60 | %43–55 | Y |
| col-vaha | gündüz | 12 | 35 | 0 | 23 | 19 | %34 | %76 | %28–44 | Y |
| col-vaha | gece | 12 | 29 | 0 | 17 | 16 | %41 | %74 | %33–52 | Y |
| ada | güneş | 29 | 38 | 0 | 9 | 9 | %76 | %69 | %69–85 | Y |
| ada | fırtına | 29 | 50 | 0 | 21 | 14 | %58 | %69 | %47–63 | Y |
| gemi | güneş | 19 | 28 | 0 | 9 | 0 | %68 | %68 | %59–86 | Y |
| gemi | fırtına | 19 | 24 | 0 | 5 | 0 | %79 | %79 | %66–90 | Y |
| derinlikler-mantar-magarasi | varsayılan | 5 | 35 | 0 | 30 | 4 | %14 | %26 | %10–19 | D |
| hapishane-iskele | loş | 77 | 86 | 0 | 9 | 0 | %90 | %90 | %85–94 | Y |
| orman-yolu | gündüz | 5 | — | — | — | — | (yer tutucu) | — | — | P |
| orman-heykel-golu | gündüz | 111 | 134 | 16 | 39 | 30 | %63 | %79 | %63–65 | Y |
| orman-heykel-golu | gece | 111 | 157 | 13 | 59 | 33 | %58 | %75 | %58–60 | Y |
| orman-oduncu-kampi | gündüz | 87 | 73 | 16 | 2 | 0 | %80 | %80 | %62–94 | Y |
| orman-oduncu-kampi | gece | 87 | 73 | 16 | 2 | 0 | %80 | %80 | %63–94 | Y |
| ortamlar-diyari | gündüz | 6 | — | — | — | — | (yer tutucu) | — | — | P |
| kale-ic-avlu | gündüz | 14 | 27 | 0 | 13 | 0 | %52 | %52 | %34–52 | Y |
| kale-ic-avlu | gece | 14 | 13 | 4 | 3 | 0 | %59 | %59 | %44–72 | Y |
| kale-onu | gündüz | 33 | 52 | 2 | 21 | 0 | %57 | %57 | %47–63 | Y |
| kale-onu | gece | 33 | 67 | 0 | 34 | 0 | %49 | %49 | %39–49 | Y |
| kasaba-lagim | karanlık | 47 | 25 | 26 | 4 | 0 | %41 | %41 | %41–45 | D |

Notlar: gündüz/gece (ve güneş/fırtına) satırları **aynı `tiles`** üstündedir; aralarındaki fark ölçüm gürültüsüdür. Yer tutucu görselli iki harita (`orman-yolu`, `ortamlar-diyari`) ölçülmedi. `orman-yolu` 5 `w`, `ortamlar-diyari` 6 `w`. Resim suyu içindeki gölgeli/ağaçla örtülü (köprü, ağaç tepesi) hex'ler hem taşan hem eksik sayılabilir.

### 3.3 En kötü 5 harita (ana varyant; yalnız Y/O güvenli kümeden)

**En düşük uyum (`w` ile resim suyu, `n` hariç):** (1) `col-vaha` %34 (`n` dahil %76: fark neredeyse tümüyle bilinçli sığ halka), (2) `col-kanyon-nehri` %49, (3) `kale-ic-avlu` %52, (4) `kale-onu` %57, (5) `orman-heykel-golu` %63 (`n` dahil %79).

**Görünür kusur, doku kara üstünde (taşan):** (1) `batak-cukur` 10/35 hex (%29), (2) `orman-oduncu-kampi` 16/87 (%18), (3) `orman-heykel-golu` 16/111 (%14), (4) `kale-onu` 2/33, (5) `kale-ic-avlu` ve geri kalan Y haritalar 0. Düşük güvenli kümede daha kötüsü var ama doğrulanamadı: `kasaba-lagim` 26/47 (çoğu köprü kemeri altı, bkz. aşağı), `batak-adalar` 26/132.

**Toplam (Y/O ana varyant, 10 harita):** 439 `w` hex; taşan 44 (%10,0; 32'si kıyı yuvarlaması, 12'si belirgin yanlış); eksik 148 (62 `n`, 30 duvar `s`, 22 kara `.`, 11 sazlık `g`, 7 köprü `p`, 6 ağaç `a`, 4 `x`, 4 `u`, 2 `h`).

### 3.4 Kaymanın kaynağı (harita başına)

Nedenler: **V** veri girişi (el ile satır; belirgin yanlış ya da eksik hex), **K** kıyı yuvarlaması (hex'in yarısı su/yarısı kara; yönü hep "dışa"), **N** bilinçli `n` sığ halka, **S** duvar/kule `s` altında kalan su (mekanikte engel), **H** ızgara-resim hizası, **C** kırpma (`harita-gorsel`).

| Harita | Başlıca neden | Ayrıntı (gözle doğrulandı) |
|---|---|---|
| `orman-heykel-golu` (Y) | **N**, K, V | Eksik 39: 30 `n` kıyı halkası (bilinçli); 9 kara hex'i: 6'sı kuzeybatı derenin göle akan kısmı (resimde su, veride `.`: V), 3'ü güneydoğu/güney kıyı kenarı (K). Taşan 16: 6'sı doğuda heykel/şelale dibi (V: resimde taş/şelale, su oranı 0,0–0,49), 7'si güney kıyı şeridi (satır 13–14, K), 3'ü batı kıyısı (K). |
| `col-vaha` (Y) | **N**, C (≤ 0,2 hex) | `w` yalnız koyu 12 hex'lik çekirdek, açık turkuaz halka 19 `n`; taşan 0. Kırpma %3,5 (kaynak 1,568, hedef 1,624). |
| `col-kanyon-nehri` (Y) | **V/K** | Nehir resimde ≈ 2,5 hex, veride 1–2 hex orta şerit; kıyı sazlığı `g` 8, `.` 6, `a` 4, `n` 4 eksik. Taşan 0. |
| `ada` (Y) | **N** | `w` açık okyanus; eksik 9 = turkuaz sığ halka `n` (bilinçli). Fırtına varyantında 21 (köpük). |
| `gemi` (Y) | **K** | Eksik 9: gövde kenarı `p/x/h` (hex yarı gemi yarı su). Taşan 0. |
| `hapishane-iskele` (Y) | **K** | En iyi uyum (%90); eksik 9: ada kıyısı köpüğü (`u`, `.`, `p`). Taşan 0. |
| `orman-oduncu-kampi` (Y) | **K** | Taşan 16 (15'i kıyı): nehir şeridinin banka bakan hex'leri; eksik 2 (köprü `p`). Nehir 3 hex genişliğinde. |
| `kale-onu` (Y) | **S**, V | Eksik 21: 17'si duvar/kule `s` dibinde, hendek resimde kuleleri dolaşıyor; `w` yalnız önde 2 sıra. |
| `kale-ic-avlu` (Y) | **S** | Eksik 13, hepsi `s`: yalnız güney hendek `w`, doğu/batı/kuzey hendek duvar hex'lerinin altında. Taşan 0. |
| `batak-cukur` (O) | **V**, K | Taşan 10 (6 K, 4 V): gölet `w` üst-sol kayalık kenara taşıyor; eksik 0. |
| `batak-adalar` (D) | V | Taşan 26: kök/ağaç adacıkları ve gövde üstündeki hex'ler `w` yazılmış; eksik 21'in 8'i ağaç `a` hex'i (altında su görünüyor). Koyu yeşil suda sınıflandırıcı güvensiz. |
| `batak-kale`, `batak-kamp` (D) | V/K (belirsiz) | Resim suyu `w`'den geniş görünüyor (eksik 7 / 21) ama koyu su ayırt edilemiyor. |
| `kasaba-lagim` (D) | **V?** | Taşan 26 (21 "belirgin"): üst ve alttaki köprü kemerleri altında kanal sürüyor olabilir; resimde köprü örtüsü suyu gizliyor. Elle teyit gerekir. |
| `derinlikler-mantar-magarasi` (D) | belirsiz | `w` 5 hex; resimde siyah zemin üstünde mantar/yosun, sınıflandırıcı güvenilmez. Kırpma %4,9. |
| `orman-yolu`, `ortamlar-diyari` (P) | — | Görsel yer tutucu: su hex'i yer tutucu rengiyle çizili, kayma yok (ölçülmez). |

**Hizalama (H):** 29/29 su varyantında yayımlanan WebP, `artSize(boyut)` hedefiyle tam aynı piksel boyutunda ve `mapView.hexCenter` formülüyle çizilir (görsel dünya boyutuna `fill`). Ek olarak resim suyu maskesi ±0,5 altıgen (±56 × ±48 px) kaydırıldığında en iyi uyum artışı ortalama +%5,9 (medyan +%4,4; yalnız `kale-ic-avlu` gece +%27 aykırı), yön tutarsız (dx: 18 negatif, 9 pozitif, ortalama −6 px; dy: 16 negatif, 11 pozitif, ortalama −7 px; 1 altıgen = 111 × 95 px). Sistematik bir ofset yok; küçük kazançlar kıyı hex'i yuvarlamasıyla sınıflandırıcı gürültüsü.

**Kırpma (C):** `harita-gorsel` merkezden kırpar; kaynak jpg'si olan 13 haritanın 11'inde oran hedefle %0,0 farklı (`ada`/`gemi`/`orman-yolu`/`ortamlar-diyari`'nin depoda kaynak jpg'si yok; ilk ikisi `assets-ham`'dan, son ikisi yer tutucu). Yalnız `col-vaha` (%3,5, dikeyde kenarda ≤ 0,2 hex) ve `derinlikler-mantar-magarasi` (%4,9) kırpılıyor. Ölçülebilir katkı yok.

**Veri girişi (V) neden baskın:** `w` satırları görselin koordinatlı ızgarasından elle yazılıyor (`harita/<bolge>/duzeltme/<ad>.json` "tam satırlar" ya da `scripts/k34a-yerlesim.py`, `k36-hapishane.py` gibi betiklerin içindeki satırlar). İki yönlü yuvarlama kuralı yok: yazan kıyı hex'ini genelde "yarım su" yerine su sayıyor (taşan) ve kıyı sığlığını `n`'ye ya da kara harfine veriyor (eksik).

## 4. Soru 3: Düzeltme seçenekleri

Sayılar §3.2 tablosundan; "etkilenen" = ölçülen kusuru olan harita (yer tutucular hariç 15) ve varyantı.

| Seçenek | Etkilenen | Kural/replay riski | İş büyüklüğü | Değerlendirme |
|---|---|---|---|---|
| **(a) `w`'yi resme göre yeniden türet** (`harita-zemin` + `duzeltme/<ad>.json`) | 15 harita, 27 varyant (aynı `tiles`) | **Mekanik değişir**: yüzme/batma/boğulma (K73c), çok derin su sınırı, yol bulma, yapay zekâ, başlangıç bölgesi geçerliliği, hendek haritaları. **Kural sürümü gerekmez** (savaş kaydı `battle_started.state` içinde `tiles`'ı taşır, eski kayıt ve `replay` etkilenmez; yeni savaşlar yeni veriyi okur) ama sim altın imza testleri (`K73C_TOHUM`…) ve denge ölçümü etkilenir; "mekanik donması" belgesi hata düzeltmesi sayabilir, kullanıcı onayı şart | **Büyük** (15 harita elle + sim regresyon + denge yeniden ölçüm). **Otomatik türetme güvenilir değil**: `harita-zemin` paleti yalnız Derinlikler renklerinden; `duzeltme` olan haritalarda çıktı mevcut veriyle **%100 aynı** (döngüsel: düzeltme zaten elle girilmiş satırlar), `duzeltme` olmayanlarda sonuç kullanılamaz (`kale-onu` öneri 0 `w` / mevcut 33; `kale-ic-avlu` 0 / 14; `hapishane-iskele` 136 / 77, mevcutla uyum %0–4) | **Önerilmez**: kusurun çoğu mekanik açıdan doğru (derin çekirdek, duvar altı hendek). |
| **(b) Doku maskesini resim suyuna göre kes** (yalnız görsel) | 15 harita; maske dosyası ya da hex listesi harita başına | **Yok** (yalnız `FxLayer`; kural sürümü, `SAVE_VERSION`, replay değişmez) | **Orta**: piksel maskesi üretimi (bu belgedeki sınıflandırıcı koyu haritalarda yetmez, elle onay), 15 harita için maske varlığı (boyut tahmini ~20–60 kB/harita), `mask-image` desen üstünde başarım/uyumluluk riski | Taşanı çözer, **eksiği çözmez** (n halkası, nehir kıyısı dokusuz kalır). Piksel maskesi gereksiz ağır; hex bazlı "çıkar" listesi aynı sonucu ucuza verir (c'nin içinde). |
| **(c) Mekanik su ayrı, görsel su ayrı** | 15 harita; asıl kazanç 7–8 haritada | **Yok** (görsel ve veri alanı; `waterHexes` yalnız ek liste okur) | **Orta-küçük**: `data/efekt-baglama.json` `su` altına harita başına `haric` (taşan hex'ler) ve isteğe bağlı `ekle` (n halkası, nehir kıyısı) listesi; ≈ 44 çıkarma + ≈ 60–110 ekleme hex'i; liste bu ölçümden üretilir, Y/O haritalar gözle onaylanır, D haritalar (batak, lağım, mantar) önce elle teyit | **Önerilen** (hafif hâl). Mekanik `w` ile görsel su bağımsızlaşır; "doku = resim suyu" olur. |
| **(d) Hiçbiri** | — | — | Sıfır | Kabul edilebilir yedek: kusur sınırlı (Y/O kümede w'nin %10'u kara üstünde; eksik doku zararsız, resim zaten su gösteriyor). Yerelde sezilir: Oduncu Kampı, Heykel Gölü güney kıyısı, Bataklık Çukuru. |

## 5. Öneri

1. **(c) hafif hâli**, yeni kuyruk (SU2): yalnız görsel. `su.haric` (doku `w`'den düşer; ≈ 44 hex, çoğu `orman-oduncu-kampi`, `orman-heykel-golu`, `batak-cukur`) ve karar bekleyen `su.ekle` (sığ `n` halkasını doku alanına katar: Vaha, Heykel Gölü, Ada; alternatif olarak `su.harf`'e `n` eklemek tüm `n` hex'lerini çizdirir ve çamur/ford'u da kapsar, bu yüzden önerilmez). Önce Y haritalar (10), D haritalar elle teyitten sonra.
2. **`w` mekaniğine dokunma.** Derin çekirdek/sığ halka ayrımı, duvar altı hendek ve kıyı hex'leri mekanik açıdan geçerli; (a) seçeneği ancak kullanıcı denge/mekanik kararıyla ve sim regresyon yeniden üretimiyle ele alınmalı.
3. **Kural sürümü, `SAVE_VERSION`, yapay zekâ** değişmez (c için). Mekanik donması kapsamında "görsel/efekt" olarak serbest.
4. Veri girişi tarafında kalıcı önlem (isteğe bağlı, kod değil süreç): yeni harita `duzeltme` satırlarını yazarken kıyı hex'inde "yarıdan fazlası su değilse `w` yazma" kuralı; `harita-zemin` paletine su rengi örnekleri (şimdi yalnız mavi, yeşil bataklık yok) eklenirse (a) otomatiğe daha yakın olur.

## 5b. Uygulama (Kuyruk SU3)

Seçenek (c) hafif hâli uygulandı: `su.haric` 44 hex (4 harita), `su.ekle` 47 hex (Heykel Gölü, Vaha), kıyı soluklaştırma. Önce/sonra: `docs/su3/su3-once-sonra.jpg`. Düşük güvenli haritalar (Batak Adalar/Kale/Kamp, Kasaba Lağımı, Mantar Mağarası) elle teyit gerekli olarak bırakıldı. Ayrıntı DECISIONS.md.

## 6. Sınırlar ve açık noktalar

- Resim suyu sınıflandırması renge dayanır; **D** haritalarda (bataklık, lağım, mantar) rakamlar yalnız yön gösterir. Bunların taşan/eksik sayıları kesin sayılmamalı.
- Gece/fırtına/loş varyantlarının resim suyu ana varyanttan ayrı ölçüldü (renkler farklı), ama `w` verisi aynıdır; ölçüm gürültüsü ±%5 puan.
- Eşik: hex'in ≥ yarısı su. Kıyı hex'i tanımı gereği belirsizdir; aralık sütunu (.35–.65) bunu gösterir.
- `kasaba-lagim`: köprü kemerleri altı gerçekten su mu, elle teyit gerekir.
- Dünya haritası (karo resmi, `public/maps/dunya/`) su dokusuna sahip değil, kapsam dışı. `flashFlood`/Control Water yüzeyi dokusu E4b'den beri açık (ayrı konu).
- Ölçüm betikleri (Python, PIL + numpy) depo dışı; yöntem §3.1'de. Yeniden üretmek için aynı sınıflandırıcıyı (renk histogramı saf Bayes, hex çokgeni maskesi) kullanmak yeterli.

## 7. Doğrulama

- `npm run check:harita`: bir kez çalıştırıldı (`PW_CHROMIUM=/opt/pw-browsers/chromium`): **96 kontrol, 0 hata** (çıkış 0). Bu görevde yalnız belge değiştiği için sonuç beklenen.
- Kod değişmediği için typecheck/test/build çalıştırılmadı (görev kuralı).
