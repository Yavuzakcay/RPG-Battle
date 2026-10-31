# Geniş harita görsel şartnamesi (Görev HG1)

Geniş haritaların (15×7'den büyük; şimdilik Orman yolu, Kale ve avlu, Mağara (orta)) arka plan görselini Gemini ile üretip oyuna koymak için gereken her şey bu belgede.

Kısa yol:

1. `docs/harita/referans/<harita>-prompt.md` dosyasını aç.
2. İçindeki iki görseli ve İngilizce metni Gemini'ye ver.
3. Çıktıyı `assets-ham/harita/<harita>.png` olarak kaydet.
4. `npm run harita-gorsel -- <harita>` çalıştır.

## 1. Boyut ve en-boy oranı

Görsel savaş ekranında haritanın **dünya boyutuna gerilerek** çizilir (`object-fit: fill`).

- **En-boy oranı** altıgen hizasını belirler. Yanlış oran görseli esnetir; kenardaki ağaçlar ve duvarlar altıgenlerden kayar.
- **Çözünürlük** yalnızca netliği etkiler.

| Harita | Izgara | Görsel (px) | En-boy |
|---|---|---|---|
| Orman yolu (`orman-yolu`) | 31 × 17 | **2616 × 1668** | 1,568 |
| Kale ve avlu (`kale-avlu`) | 31 × 17 | **2616 × 1668** | 1,568 |
| Mağara (orta) (`magara-genis`) | 21 × 11 | **1781 × 1096** | 1,625 |
| (karşılaştırma) Klasik | 15 × 7 | 1280 × 715 | 1,790 |
| (üst sınır) | 48 × 28 | 4035 × 2717 | 1,485 |

**Genel formül** (`src/map/mapArt.ts` `artSize`, savaş ekranıyla aynı: `src/ui/mapView.ts` `worldOf`):

- genişlik = S · (1,5 · sütun + 0,5)
- yükseklik = HH · (satır + 0,5)
- S = 1280 / 23 ≈ 55,652 px (altıgen yarı genişliği)
- HH = 715 / 7,5 ≈ 95,333 px (altıgen yüksekliği)

Sonuç en yakın tam piksele yuvarlanır.

**Gemini tam boyutu vermezse:**
- Aynı oranda büyük bir görsel kabul edilir. Örneğin 5232 × 3336 (tam 2×) sorunsuzdur; içe aktarma küçültür.
- Oran farkı %0,5'e kadar: sessizce kabul.
- %0,5–3: uyarı ("hafifçe esnetilecek", kenarda kaç px kayma olacağı yazılır).
- %3'ün üstü: **hata**, dosya yazılmaz.
- Kare (1:1) ya da 16:9 çıktı her zaman hatadır. Gemini'den oranı açıkça isteyin ya da çıktıyı kırpın.

## 2. Altıgen hizası

Izgara **flat-top** (düz üstlü) altıgenlerden oluşur, düzeni **odd-q**'dur. Sütun ve satır 0'dan başlar; sol üst altıgen (0, 0).

**Altıgen merkezi:**
- x = S + sütun · 1,5 · S
- y = HH/2 + satır · HH (tek sütunlarda + HH/2)

Yani tek numaralı sütunlar yarım altıgen aşağıdadır.

**Köşeler** (merkezden): (±S, 0), (±S/2, ±HH/2). Başlangıç köşesi sol uç (x − S, y); sıra saat yönünde: sol, sol üst, sağ üst, sağ, sağ alt, sol alt.

**Ölçüler:**
- Altıgen genişliği 2S ≈ 111,3 px.
- Sütun adımı 1,5S ≈ 83,5 px.
- Yükseklik HH ≈ 95,3 px. Düzgün altıgene göre %1,1 basıktır; çizimde fark edilmez.

**Kenar boşluğu yok:**
- Görselin sol kenarı (0, 0) altıgeninin sol köşesine, üst kenarı 0. sütunun tepesine değer.
- Sağ ve alt kenar son sütun ve satıra değer.
- Izgaranın dışında kalan küçük üçgen köşeler (çift sütunların altı, tek sütunların üstü) oyunda görünür. Bu yüzden resim kenardan kenara dolu olmalı: zemin bu köşelere doğal biçimde devam etmeli, siyah bırakılmamalı.

## 3. Izgara çizgileri

**Görselde altıgen çizgisi OLMAMALI.** Oyun ızgarayı kendisi çizer (`.hx`: beyaz, %45 opak, 1,2 px). Görseldeki çizgi ikinci, kaymış bir ızgara gibi görünür.

Görselde ayrıca şunlar da olmamalı: yazı, koordinat, simge, yaratık, jeton.

Tek altıgenlik nesneler (ağaç, kaya, sütun, kristal, sandık) kendi altıgeninin ortasında ve içinde kalmalı.

## 4. Stil

Mevcut Klasik görsellerle uyumlu olmalı:
- tam tepeden bakış, perspektif eğimi yok;
- 16-bit tarzı piksel sanatı, net piksel kümeleri;
- doğal ve hafif kısık palet;
- sol üstten ışık, sağ alta kısa yumuşak gölgeler.

Örnekler:

| Görsel | Stil |
|---|---|
| `public/maps/harita-orman-orman.webp` | ağaç tepeleri, çalılar, dere |
| `public/maps/harita-kale-gunduz.webp` | taş sur, avlu, sandık ve variller |
| `public/maps/harita-magara-magara.webp` | koyu mağara, camgöbeği/mor kristal ve mantar ışıkları |

Gemini'ye stil örneği olarak haritanın Klasik eşini verin; prompt dosyası hangisini vereceğinizi yazar. Aynalanabilir haritalarda (Orman yolu, Mağara) oyun görseli yatay çevirebilir; bu yüzden yönlü işaret ya da yazı olmamalı.

## 5. Referans görseller ve prompt'lar

`npm run harita-referans` her geniş harita (çok varyantlıysa her varyant) için `docs/harita/referans/` altına şunları üretir:

| Dosya | İçerik | Ne için |
|---|---|---|
| `<harita>.png` | orijinal boyutta, zemin türleri belirgin renklerle, altıgen ızgarası çizili; geçilmez tek nesnelerde (ağaç, sütun, kristal) merkez noktası | senin kontrolün: Gemini çıktısını bununla karşılaştır |
| `<harita>-izgarasiz.png` | aynı, ızgarasız düz renk; ızgara dışı köşeler kenardaki zemin renginde | **Gemini'ye yerleşim referansı olarak verilir** |
| `<harita>-prompt.md` | hedef boyut, verilecek görseller, zemin anahtarı (harf → renk → zemin), hazır İngilizce prompt | Gemini'ye yapıştırılır |

Renkler, zemin tarifleri ve harita temaları `data/harita-referans.json`'dadır; prompt dosyaları elle değil bu dosyadan üretilir. Renk anahtarı (yalnızca referansta; oyun bu renkleri kullanmaz):

| Renk | Zemin |
|---|---|
| açık yeşil `#8fd16a` | açık zemin |
| koyu yeşil `#0b5d1e` | ağaç |
| sarı-yeşil `#c6e04a` | çalılık |
| açık mavi `#7fd3e6` | sığ su |
| koyu mavi `#1f5fd1` | derin su |
| ten `#d9a066` | yol, kaldırım, tahta |
| gri `#8a8a8a` | kaya kümesi |
| kahve `#a0522d` | sandık, varil, kütük |
| antrasit `#3a3a46` | duvar |
| sarı `#ffd23f` | kapı |
| krem `#e8c9a0` | yükseltili zemin |
| turuncu `#ff8c1a` | kule üstü |
| mor `#6b4fa0` | sütun, kuyu |
| bej `#b0a090` | sarkıt |
| camgöbeği `#00f0ff` | ışıklı kristal |

## 6. Oyuna koyma

1. Gemini çıktısını kaydet: `assets-ham/harita/<harita>.png`.
   - `.jpg`, `.jpeg` ve `.webp` de olur.
   - `<harita>` = harita kimliği: `orman-yolu`, `kale-avlu`, `magara-genis`.
   - Birden çok varyantlı haritada `<kimlik>-<varyant>`.
2. Çalıştır:

   ```powershell
   npm run harita-gorsel -- orman-yolu
   ```

   - Boyut ve en-boy oranı denetlenir; uyarılar ve hatalar yazılır.
   - Görsel tam hedef boyuta getirilir ve WebP'ye çevrilir (kalite 82).
   - Sonuç haritanın JSON'undaki varyant `image` yoluna yazılır: `public/maps/harita-<kimlik>.webp`.
   - **Veri satırı değişmez.** Dosya adı ve yol zaten haritanın JSON'unda (`variants[].image`).
3. Oran hatası olursa (> %3) dosya yazılmaz, komut hata koduyla biter. Görseli yeniden üret ya da kırp. Bilerek yazmak için `--zorla`.
4. Kontrol: `npm run dev` → Game Master → "Geniş haritalar" → harita → savaşı aç → ⤢ (Tümünü göster). Ağaç, duvar ve su altıgenlerle örtüşmeli. Sonra `npm run check:harita`.

Yer tutucuya dönmek:
- `assets-ham/harita/<harita>.png` dosyasını silip aynı komutu çalıştır;
- ya da `npm run harita-gorsel -- <harita> --yer-tutucu`.

Yer tutucu, zemin harflerinden üretilen basit görseldir. Kullanıcı görseli koyana kadar mevcut yer tutucular kalır.

## 7. Format ve boyut sınırı

- **Girdi:** PNG, JPG/JPEG, WebP. En az hedefin 0,75 katı genişlik önerilir; altında "çözünürlük düşük" uyarısı çıkar. 3 katın üstü "küçültülecek" bilgisi verir.
- **Çıktı:** her zaman WebP, `public/maps/` altında. Çıktı dosyası 1024 kB'tan büyükse uyarı verilir (savaş açılışını yavaşlatır).
- **Yükleme:**
  - Harita görselleri `public/` altında düz dosyadır, JavaScript paketine girmez; ana parça boyutunu etkilemez.
  - Yalnızca savaş ekranı açılınca `<img>` ile yüklenir; savaş ekranı da ayrı, tembel parçadır.
  - Game Master kurulumundaki harita önizlemesi de aynı dosyayı küçük gösterir (ayrı küçük kopya yok).
- **Ham dosyalar:** `assets-ham/harita/` depoya girebilir (diğer `assets-ham` klasörleri gibi), ama büyükse yalnızca `public/` çıktısını commit etmek yeterlidir.

## 8. Yeni geniş harita eklenince

1. `data/maps/<kimlik>.json` dosyasını ekle.
   - `size` 15×7'den büyük olmalı.
   - Varyantın `image` alanı `maps/harita-<kimlik>.webp` olmalı.
2. `data/harita-referans.json` → `maps.<kimlik>` kaydını ekle: `tr`/`en` tema, `light`, `style` (Klasik stil örneği). Yoksa genel tarif kullanılır.
3. Yer tutucu görsel: `npm run harita-gorsel -- <kimlik>` (ham görsel yoksa yer tutucu üretir).
4. Referanslar: `npm run harita-referans -- <kimlik>`.
   - Test (`src/map/mapArt.test.ts`) her geniş haritanın üç referans dosyasını arar; unutulursa kırmızı olur.
5. Sonra 6. bölümdeki adımlar.

Yeni bir zemin harfi kullanılıyorsa `data/harita-referans.json` → `terrain` kaydına renk ve çizim tarifi eklenmeli; yoksa referansta macenta (`#ff00ff`) görünür.
