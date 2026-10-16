# Altıgen harita sistemi ve ilk iki harita (Çöl, Volkan)

Kararlar: altıgen ızgara, düz üstlü (flat-top), 15 sütun × 7 satır (13×7 yerine; 16:9 ekrana oturur), 1 altıgen = 5 ft (hız 30 ft = 6 altıgen), yatay ekran.
Oyuncular sol bölgede, düşmanlar sağ bölgede başlar (ilk 3 sütun / son 3 sütun), ortası serbest.

---

## 1. Yeni harita eklemek için gereken dört parça

Her yeni harita aynı dört parçadan oluşur. Kodda hiçbir şey değişmez, sadece yeni veri eklenir.

1. **Zemin görseli:** Yukarıdan bakan, ızgarasız, 16:9 resim.
2. **Zemin düzeni:** Her altıgenin ne olduğunu gösteren harf tablosu (aşağıdaki gibi).
3. **Harita kuralları:** Haritaya özel etkiler (sıcak, fırtına, patlama).
4. **Başlangıç bölgeleri:** Oyuncu ve düşman başlangıç altıgenleri.

## 2. Zemin türleri kataloğu (bütün haritalar paylaşır)

Yeni harita yeni tür ekleyebilir. Var olan türler yeniden kullanılır.

| Harf | Tür | Yükseklik | Hareket | Siper | Özel |
|---|---|---|---|---|---|
| `.` | Açık zemin | 0 | normal | yok | Kum haritasında gizlenme yapılabilir |
| `d` | Kum tepesi | 0 | normal | yarım | Gizlenme yapılabilir |
| `r` | Kaya kümesi | 0 | zorlu | 3/4 | Gölge verir |
| `c` | Ayakta sütun | 0 | engel | 3/4 | Gölge verir, içinden geçilmez |
| `k` | Yıkık sütun / moloz | 0 | zorlu | yarım | Gölge verir |
| `t` | Taşlık (çakıl) | 0 | zorlu | yok | Gizlenme yapılamaz |
| `L` | Alçak kül | 0 | normal | yok | Volkan alt seviyesi |
| `M` | Orta zemin | 1 | normal | yok | Volkan orta seviyesi |
| `H` | Yüksek bazalt | 1 | normal | yok | Yüksek zemin avantajı |
| `o` | Obsidyen kaya | 1 | engel | 3/4 | Keskin kenar, içinden geçilmez |
| `~` | Lav | - | ölümcül | - | Girene ölüm. Uçan yaratıklar güvende |
| `f` | Alev | - | normal | - | Girince veya turu orada bitirince 1d6 ateş hasarı (ölümcül değil) |

Sütun açıklamaları:
- **Hareket "zorlu":** o altıgene girmek 2 altıgenlik hareket harcar.
- **Siper:** yarım = +2 AC, 3/4 = +5 AC (5e kuralı).
- **Yükseklik:** mevcut yükseklik kuralını kullanır. Yüksek zeminden alçağa saldıran avantaj alır.

## 3. Çöl haritası

Düz, yükseklik yok. Strateji kum tepeleri, kayalar ve sütunların arkasına saklanmakla, bir de kumun altında gizlenmekle ilgili.

**Zemin düzeni (gönderdiğiniz görselden çıkarıldı, 15 × 7, sütun 1 solda):**
```
      1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
S1   r . . . d . . . . . . . d . .
S2   . . . . . r . . . r . . . d d
S3   d c k c k k c c r k r . . t t
S4   . d . . . . . c . . . r . t t
S5   r t c c k k c k k r r . . . r
S6   r t . . . t k . r . . . . d .
S7   r t . . . . . . . . . . . . d
```
Harfler: `.` açık kum, `d` kum tepesi, `r` kaya kümesi, `c` ayakta sütun, `k` yıkık sütun, `t` taşlık.
Nesneler yukarıdan eğik çizildiği için her nesnenin tabanı hangi altıgendeyse o altıgene yazıldı.

**Özet:** Merkezde yatay bir harabe şeridi var (3. ve 5. satırlarda sütunlar ve yıkıntılar). Sol kenarda kaya duvarı (1. sütun, 5-7. satırlar) ve taşlık. Sağ kenarda geniş bir taşlık (14-15. sütun, 3-5. satırlar). Kum tepeleri köşelerde.
**Denge notu:** Harita simetrik değil. Sol bölgede kaya ve sütunla çok siper var, sağ bölge taşlıkta başlıyor (zorlu zemin, yavaşlatır). Bu yüzden GM'e "haritayı yatay aynala" seçeneği vermek iyi olur. Aynalama sadece sütun numaralarını ters çevirmektir: arazi aynalanır, başlangıç sütunları sabit kalır (oyuncular yine solda), görsel de yatay çevrilir.

**Başlangıç bölgeleri:** oyuncular 1-3. sütunlar, düşmanlar 13-15. sütunlar. Başlangıç yeri olarak sadece geçilebilir ve tehlikesiz altıgenler; engel, lav, alev ve 3/4 siperli kaya kümesi (`r`) başlangıç yeri sayılmaz, `t` ve `k` sayılır. Bu kuralla oyuncu bölgesinde 15, düşman bölgesinde 20 altıgen var.

**Haritaya özel kurallar:**

- **Kumun altına gizlenme:** Sadece `.` (açık kum) ve `d` (kum tepesi) altıgenlerinde, bir eylem harcayarak Gizlenme (Stealth) denenir. Başarılıysa yaratık kumun altındadır: dışarıdan görülmez, saldıranı veya hareket edeni ortaya çıkar. Ağır zırh giyen dezavantajla dener.
- **Gündüz (kavurucu sıcak):** Her yaratık kendi turunun sonunda, gölgede değilse ve ağır zırh giyiyorsa CON kurtarma atar (DC 12). Başarısızsa 1d4 ateş hasarı alır. Gölge: `r`, `c` ve `k` altıgenleri ve bunlara bitişik altıgenler.
- **Akşam (çöl fırtınası):** 4 altıgenden uzaktaki hedeflere yapılan saldırılar dezavantajlı olur ve 8 altıgenden uzak hiçbir şey görülmez. Gizlenme denemelerine avantaj. Sıcak hasarı yok.
- **Zaman seçimi:** GM savaş başında Gündüz veya Akşam seçer. İsteğe bağlı: "Gün batımı" modunda 4. turdan sonra fırtına başlar.

## 4. Volkan haritası (açık alan, lav nehirleri, ada ve adacıklar)

Köprü yok. Geniş ve açık bir volkan alanı: aralarından lav akan büyük adalar ve küçük adacıklar. Savaşçılar adalara sıkışır. Kimin nereye gideceği ve lavı nasıl aşacağı stratejidir.

**Zemin düzeni (gönderdiğiniz görselden çıkarıldı, 15 × 7, sütun 1 solda):**
```
      1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
S1   # . ~ ~ ~ . ~ ~ ~ ~ ~ ~ # . #
S2   ~ . . f ~ ~ ~ . ~ ~ . . . . ~
S3   ~ . . . ~ ~ ~ H ~ ~ ~ . . . ~
S4   ~ . . . . ~ H H H ~ . . . . ~
S5   ~ . . . ~ ~ . . . ~ ~ f . . ~
S6   ~ . . . ~ . ~ . ~ . ~ . . . ~
S7   # # . ~ ~ # ~ ~ ~ ~ ~ ~ . # #
```
Harfler: `.` zemin, `H` yüksek tepe, `~` lav (ölümcül), `f` alev, `#` dış kayalık (oyun alanı dışı, geçilmez).
Her altıgen, alanının çoğunluğu neyse o sayıldı. Ada kenarındaki altıgenler sınırda kalabilir, oynarken gerekirse elle düzeltiriz.

**Özet:** Sol ada 16, sağ ada 16 zemin altıgeni (sütun 2-4 ve 12-14). Ortada yüksek tepe: 7-9. sütunlarda 3. ve 4. satır civarı. Tek altıgenlik adacıklar: 6. sütun 1. satır, 8. sütun 2. satır, 5. sütun 4. satır, 11. sütun 4. satır ve benzerleri. Bu adacıklar basamak taşı görevi görür.

**Başlangıç bölgeleri:** Oyuncular sol büyük adada (sütun 2-4), düşmanlar sağ büyük adada (sütun 12-14). Her iki adada 16 altıgen var, simetrik.

**Haritaya özel kurallar:**

- **Lav:** Lav altıgenine giren (kendi isteğiyle ya da itilerek) anında ölür. Ölüm kurtarması yok. Uçan yaratıklar etkilenmez.
- **Kanalı atlamak (5e uzun atlama kuralı):** Yürüyerek en az 10 ft koşu yapan karakter STR skoru kadar ft atlar, koşusuz yarısı kadar. 1 altıgen = 5 ft. Yani 1 altıgenlik kanalı neredeyse herkes atlar, 2 altıgenlik kanal için STR 10 ve üstü, 3 altıgenlik için STR 15 ve üstü gerekir. Mesafe yetmiyorsa atlamak lava düşmektir. Atlanan mesafe hareketten düşer.
- **Ada atlaması (`lavJump` kuralı, veri):**
  - Lav üstünden herhangi bir adanın herhangi bir boş altıgenine atlanır. Mesafe, hız ve koşu sınırı yok; düz doğrultu şart değil.
  - Aradaki altıgenler lav ya da kara olabilir, engel olamaz.
  - Hareketin yerine geçer: bu tur yürünmemiş olmalı, atlama tüm hareketi harcar.
  - Hedef adada (bağlı kara parçası) düşman varsa reddedilir (`foeIsland: "reject"`).
  - Uçanlar hariç d20 + Athletics atılır; DC = 10 + 2 × (aradaki lav altıgeni − 1), üst sınır yok.
  - Doğal 20 her zaman güvenli; toplam DC'ye yeterse güvenli iniş. Yetmezse hedefe iner ama kenarda yanar: 2d6 ateş + Burning (tur başında 1d6 ateş, DEX DC 10 ile söner). Doğal 1 lava düşer (anında ölüm).
  - Bütün sayılar `data/maps/volkan.json` → `lavJump` içinde. Lav üstünden geçmeyen atlama 5e uzun atlama (menzil, koşu), zarsız.
  - Arayüz: menüde "Atla" kipi. Seçilebilir ada altıgenleri turuncu yanar ve üstlerinde DC yazar. Üzerine gelince "DC X, N lav hex" görünür; dokununca şanslar ve onay çıkar.
- **Alan kimin işine yarar:** Atletik karakterler uzak adalara daha güvenle atlar, zayıf karakterler adalarında kalır, menzilli saldırı ve büyü kanallar üzerinden çalışır.
- **İtme (Shove):** Lava itmek ölümcüldür. Hedef en fazla bir boyut büyük olabilir.
- **Lav kenarı:** Lava bitişik altıgende tur başında durmak 1d6 ateş hasarı verir (sıcak dalga).
- **Lav yükselmesi (isteğe bağlı, sıkıştırma kuralı):** 4. turdan başlayarak her 2 turda bir GM, adaların kenarındaki 1 halka altıgeni lav yapar. Bir tur önceden kırmızı uyarıyla işaretlenir. Alan daralır, kaçacak yer azalır.
- **Yanardağ patlaması (isteğe bağlı):** Her 3. turun başında GM rastgele bir altıgen seçer. Merkezde ve çevresindeki 1 halkada herkes DEX kurtarma atar (DC 13). Başarısızsa 4d6 ateş hasarı, başarılıysa yarısı.

---

## 5. Gemini istemleri: Yukarıdan harita görselleri (hareketsiz)

Önemli: Gemini'dan altıgen ızgara **istemiyoruz**. Izgarayı kod çizer.

### 5a. Ortak blok (her istemin başına)
```
16-bit pixel art top-down battle map, orthographic bird's-eye view looking straight down, single still image, crisp hard pixel edges (no anti-aliasing, no blur), limited palette of about 24 colors, painterly dithering for shading, clearly separated terrain zones with strong color contrast so each terrain type is readable at a glance, nothing important in the outer 8% of the image, no grid lines, no hexagons, no overlay.
```

### 5b. Kaçınılacaklar bloğu (her istemin sonuna)
```
No characters, no creatures, no people, no text, no letters, no logos, no UI, no HUD, no grid, no hex pattern, no watermark, no realistic photo look, no 3D render look, no perspective distortion, no blur, no smooth gradients.
```

### 5c. Yön
```
Horizontal 16:9 aspect ratio, 1920x1080.
```

### 5d. Çöl, gündüz
```
[ortak blok]

SCENE: A flat open desert battlefield seen from directly above. Pale golden sand covers most of the image, with soft ripple patterns. Six small sand dunes scattered symmetrically as raised rounded mounds with a darker shaded side. Two clusters of brown rock in the middle top and middle bottom. Four broken ancient sandstone columns lying in two rows near the center, casting short shadows. Completely flat terrain, no cliffs, no height differences.
LIGHT: harsh bright midday sun, high-key lighting, short sharp shadows, pale gold and white sand, shimmering heat feeling.

[yön]
[kaçınılacaklar]
```

### 5e. Çöl, akşam fırtınası
Aynı sahne, ışık satırı şu şekilde değişir:
```
LIGHT: dusk, orange-red sky glow, long shadows, a thick sandstorm: wind-blown streaks of sand and a hazy orange-brown atmosphere across the whole image, reduced visibility, but the terrain shapes (dunes, rocks, columns) remain readable.
```

### 5f. Volkan (açık alan: lav nehirleri, ada ve adacıklar, köprü yok)

Ölçü rehberi (1 altıgen yaklaşık görüntü genişliğinin %7'si): 1 altıgenlik kanal %7, 2 altıgenlik %14, 3 altıgenlik %21.

**Sürüm A: Piksel sanatı (çöl görselleriyle aynı stil, önerilen)**
```
[ortak blok]

SCENE: An open volcanic battlefield seen from above. Cracked mid-dark gray basalt ground (clearly lighter than pure black, with visible crack lines) forms a few large islands and many small islets, surrounded by a network of glowing orange lava rivers with a bright yellow core. Lava flows in from the top center, splits into three winding rivers around the islands and merges again near the bottom; show the flow with curved streaks, currents and bright flow lines. There are NO bridges, NO ramps and NO land connections: every island is completely surrounded by lava. Layout: one very large island on the far left and a similar large island on the far right (starting areas, each about 20% of the image width and 45% of its height), one medium island in the center with a raised rocky mound (lighter rim, long shadow), and six to eight small islets of different sizes (from about 5% to 10% of the image width) scattered in the lava between them. Gaps between islands vary: some lava channels are narrow (about 7% of the image width), some medium (about 14%), a few wide (about 21%). Island shapes are organic and irregular, not geometric, each with a bright glowing rim and small red glowing cracks. Two or three small campfire-sized flames burn on the islands. The outer border of the image is dark ash and rubble, purely decorative, nothing important there.
LIGHT: dark scene lit mainly by the lava glow, orange-red light on rock edges, deep shadows but all islands stay readable, strong contrast between glowing lava and rock.

[yön]
[kaçınılacaklar]
```

**Sürüm B: El boyaması harita**
Ortak bloğun yerine şunu koyun, SCENE ve LIGHT aynı kalır:
```
Hand-painted top-down tabletop RPG battle map, dark fantasy, orthographic bird's-eye view looking straight down, highly detailed cracked basalt texture, soft glowing lava with bright core, dramatic lighting, clearly separated terrain zones with strong contrast, nothing important in the outer 8% of the image, no grid lines, no hexagons, no overlay.
```

İpucu: Gemini'ya 3-4 deneme yaptırın. Köprü veya kara bağlantısı çıkanı eleyin (görselde bir adadan diğerine kara şeridi olmamalı). Kanal genişlikleri hepsi aynıysa "channel widths clearly vary" cümlesini ekleyin.

---

## 6. Görsel geldikten sonra

1. Çıktıyı bana gönderin, ben kontrol ederim (bölgeler net mi, kenarlar boş mu, ışık uygun mu).
2. Ben görsele bakarak zemin düzenini (harf tablosunu) görsele göre yeniden çizerim. Böylece resimle mantık birebir uyar.
3. Boyut: 1920×1080 → 960×540 (NEAREST), WebP, hedef 150-300 KB. Dosya adı: `harita-col-gunduz.webp`, `harita-col-aksam.webp`, `harita-volkan.webp`.

## 7. Claude Code'a verilecek işler (sırayla)

1. `src/battle/hex.ts`: axial koordinat, mesafe, komşular, halka, yol bulma (zorlu zemin dahil) ve testleri.
2. Harita veri biçimi ve yükleyici: zemin katalogu, harf tablosu, başlangıç bölgeleri, harita kuralları.
3. Karakterlere altıgen konumu: başlangıçta yerleştirme, hareket komutu, menzil ve mesafe kontrolü.
4. Yükseklik ve siperin saldırıya yansıması (mevcut kuralla birleştirilerek).
5. Lav ölümü, itme (Shove) ve harita olayları (patlama, sıcak, fırtına).
6. Arayüz: yatay harita ekranı, altıgen çizimi, dokunma, yakınlaştırma.
