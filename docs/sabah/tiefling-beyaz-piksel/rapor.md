# Tiefling jetonlarında "beyaz benek": teşhis ve onarım (TB1)

Üretici: `scripts/soy-benek-teshis.py` (yalnız okur; jeton, maske ve veri dosyalarına yazmaz). Aynı klasördeki dosyalar:
`rapor.csv` (jeton başına sayılar), `el-duzeltme-listesi.csv`, `ozet.json`, `en-kotu-01…10-*.png` (8× önce/sonra),
`diger-irklar-<ırk>.csv` (yalnız rapor). Onarım kodu `src/ui/maskClose.ts` `fixSkinMask`, ayar `data/soy-renkleri.json` `races.tiefling.temizlik`.

## 1. Kısa sonuç

- **Hipotez yarı doğru.** Ten maskesinde delik var ve o pikseller boyanmadan özgün renginde kalıyor. Ama özgün renk **beyaz değil**: gölgedeki
  koyu/orta şarap-pembe ten pikselleri (açıklık medyanı L 33; hiçbiri L ≥ 85). Soy renginin (mavi, gri-mor, pembe-mor) üzerinde noktalı
  "benek" olarak görünüyorlar; boynuz, kuyruk, kol ve yüzde belirgin, 96 px küçük kopyada çok daha belirgin.
- Senin tanımınla ("neredeyse beyaz": R, G, B > 225 ve doygunluk < 0,12, şeffaf kenara ≥ 2 px içeride) 285 maskeli jetonda 113 689 piksel var;
  **hepsi meşru beyaz** (göz akı, diş, kıyafet, silah, kanat, zırh, rün). Maske deliğine düşen (a), maskede boyanmamış (b) ve kaynakta ten
  bağlamında beyaz benek (c) **0 piksel**.
- Gerçek kusur: **284/285 jetonda toplam 99 854 piksel** maske deliğinde boyanmamış kalıyor (jeton başına medyan 290 piksel; maskenin medyan %12'si).
- Onarım tek ortak adımda (kapama + maskenin çevrelediği delikler + maskeyle çevrili 1–3 px açık benek), dosyalar değişmeden, çalışma anında.
  İkinci geçiş yeni piksel bulmuyor. Elle düzeltme listesinde (Gemini'ye dönecek) **1 piksel** var.

## 2. Yöntem

Her jeton için çalışma anı gibi: ten maskesi (`maske/`, elle maske yoksa; Tiefling'de elle maske yok) → soy boyaması (`tintPixels`, `lch`).
Yakın-beyaz bileşenler (8-bağlantılı) şöyle sınıflandı (piksel sayısıyla):

| Sınıf | Tanım |
|---|---|
| a | maskenin DIŞINDA, maskenin çevrelediği delikte ya da 1 px kapama aralığında, ten bağlamında (2 px halkanın ≥ %35'i maskede ve < %25'i koyu: göz/çizgi komşuluğu değil) |
| b | maskenin İÇİNDE ve üç soydan (abyssal, chthonic, winged) birinde boyamadan sonra hâlâ yakın-beyaz |
| c | ≤ 12 px, 2 px halkanın ≥ %50'si maskede ve < %25'i koyu: kaynakta zaten beyaz benek |
| d | kalanı: meşru beyaz (dokunulmaz) |

Ten bağlamı için **yalnız maske üyeliği** kullanıldı: Tiefling'de ten renk kutusu (kırmızı-mor ton) mor/kırmızı kıyafet ve zırh pikselleriyle
çakışıyor (ilk sürümde bu yüzden zırh parlamaları, rün dövmeleri ve parlak sarı gözler yanlışlıkla "ten" sayıldı; gözle kontrolde yakalandı, bkz. §5).

## 3. Bulgular (Tiefling, 285 maskeli jeton; 3 jetonun maskesi yok)

| Ölçü | Piksel | Jeton |
|---|---:|---:|
| gövde (alfa ≥ 128) | 7073857 | 285 |
| ten maskesi | 761875 | 285 |
| yakın-beyaz (gövde içi) | 113689 | 285 |
| **a** maske deliği | 0 | 0 |
| **b** maskede boyanmamış | 0 | 0 |
| **c** kaynakta beyaz | 0 | 0 |
| **d** meşru beyaz | 113689 (%100) | 285 |
| **delik: maske boşluğunda boyanmamış ten pikseli** | 99854 | 284 |
| çevrelenmiş 1–3 px açık benek (maskede) | 12 | 8 |

- Delik piksellerinin rengi (özgün): açıklık L p5/p25/p50/p75/p95 = 14,9 / 24,1 / 32,8 / 38,8 / 46,6 (%79'u L < 40; **hiçbiri L ≥ 85**), kroma medyanı 44,7,
  ton medyanı 305° (kırmızı-mor). Yani koyu doygun şarap/magenta pikseller.
- 24 456 bitişik delik parçası: %46'sı tek piksel, medyan 2 px, en büyüğü 314 px (kapama ile birleşmiş). Jeton başına delik: medyan 290, ortalama 350, en çok 1259.
  Yalnız `tiefling-kadin-monk-ID10` deliksiz.
- 96 px küçük kopyalarda aynı kusur görünür; onarım jeton genişliğine ölçeklenir (§4) ve bu kopyalarda da çalışır.
- Üç soy (Abyssal, Chthonic, Winged) aynı maskeyi kullandığı için aynı delikleri gösterir; sayfalardaki görseller Abyssal (mavi) ile.

**Neden beyaz algılanıyor olabilir:** boyanmayan pikseller soy renginin yanında "ışıklı" ve doygun durur; küçük boyutta ve noktalı dağıldığı için ölü piksel
izlenimi verir. Senin yazdığın (b) çözümü (boyamayı parlaklığa bağlı yumuşatmak) gerekmedi: maske içindeki açık pikseller boyamadan sonra da renkli kalıyor.

## 4. Kök neden ve düzeltme

**Neden:** `scripts/soy-maske.ts` ten maskesini ten renk kutusu (L 12–85, C 15–70, ton) + k-means palet + ΔE ≤ 7 ile seçiyor. Yüzdeki gölge ve ara tonlar
paletin dışında kalınca maskenin içinde 1–80 pikselik delikler, kenarında 1 piksellik çentikler oluşuyor. Human ve Dark Elf'te çalışma anı temizliği
(SD5/SD6 `closeSkinHoles`) vardı, Tiefling'de yoktu.

**Düzeltme (tek kod yolu):** `tint.ts` `skinFixFor(jetonAdı)` ırkın `soy-renkleri.json` `races.<ırk>.temizlik` kaydı varsa (şimdilik yalnız Tiefling) tembel
`maskClose.ts` `fixSkinMask`'ı çağırır; yoksa SD5/SD6 aynen. Maske dosyaları ve boyama formülü değişmez. Adımlar:

1. 1 px kapama (3×3 genişlet–aşındır): yalnız ten renk kutusundaki pikseller eklenir (göz, mürekkep, beyaz dokunulmaz). Eklenen miktar özgün maskenin
   %50'sini aşarsa (ince yapı: boynuz/kuyruk ucu kalınlaşmasın) kapama yapılmaz, yalnız çevrelenmiş delikler dolar (jeton bazında sınır).
2. Kapanmış maskenin tamamen çevrelediği ≤ 80 px delikler (4-bağlantılı arka plan taraması; yine yalnız ten renk kutusundaki pikseller). Sıra önemli:
   kapama önce yapılınca ince kanallarla dışarı açık sanılan boşluklar çevrelenmiş olur, tek geçişte biter (ilk sürümde ikinci geçiş %6 daha delik buluyordu).
3. Maskeyle çevrili (komşu gövde piksellerinin ≥ %95'i maskede) 1–3 px açık (L ≥ 70) benek: parlaklık korunur, ton soya kayar.

Parametreler `soy-renkleri.json`'da (kodda sabit yok). Küçük kopyada (genişlik W) uzunluklar W/256 ile, alanlar karesiyle ölçeklenir (96 px: kapama 1, en çok 11 px delik, 1 px benek).
Dragonborn pul bölge mantığı (maskeli yol, `lineagesAltMaske`) etkilenmez: onarım yalnız `temizlik` kaydı olan ırkta çalışır.

## 5. Doğrulama

- Onarımın numpy portu (bu betik) TypeScript `fixSkinMask` ile **285 jetonda 256 px ve 285 jetonda 96 px maske çıktısında piksel piksel aynı** (0 fark;
  boyama çıktısı da üretim `tintPixels` ile 18 jeton×soy örneğinde bit bit aynı). Düzeltme sonrası aynı kuralı yeniden çalıştırınca **0 ek delik, 0 ek vurgu**.
- Yeni test: `src/ui/skinFix.test.ts` (14 test: delik, kenara açık çentik, ince yapı sınırı, göz/göz akı/mürekkep/rün/zırh/boynuz ucu korumaları,
  elle maske ağırlığı, 96 px ölçeği, kapsam yalnız Tiefling, Human/Dark Elf yolu değişmedi). Mevcut SD5/SD6/tint/avatar testleri yeşil.
- **Yakalanıp düzeltilen hata (ilk sürüm):** vurgu kuralı ten bağlamını renk kutusuyla da saydığı için warlock'ın parlak sarı gözlerini, barbarian-ID7'nin beyaz rünlerini
  ve fighter-ID3'ün mor zırh parlamalarını (toplam 3099 piksel, 87 jeton) boyuyordu. Kural yalnız maske bağlamına ve ≤ 3 px çevrelenmiş beneğe daraltıldı
  (12 piksel, 8 jeton); uç/kenar dalı kaldırıldı.

## 6. En kötü 10 jeton (8×, önce/sonra, koyu ve açık zemin)

Sıralama: onarımın boyadığı delik piksel sayısı. Her sayfa üstte tam jeton (1×), altta gövdenin üst/orta/alt bandında en yoğun 32×32 pencere (8×);
bantlar konuma göredir (üst ≈ baş/boynuz, orta ≈ gövde, alt ≈ kuyruk/ayak; kuyruk bazı jetonlarda orta banda düşer).

| # | Dosya | Maske px | Delik px | Maskeye oranı | Yakın-beyaz (d) | Açık benek |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `en-kotu-01-tiefling-erkek-barbarian-ID8.png` | 3456 | 1259 | %36 | 193 | 0 |
| 2 | `en-kotu-02-tiefling-erkek-sorcerer-SC-1.png` | 2954 | 1182 | %40 | 5 | 0 |
| 3 | `en-kotu-03-tiefling-kadin-warlock-WL-11.png` | 3533 | 1146 | %32 | 101 | 0 |
| 4 | `en-kotu-04-tiefling-erkek-barbarian-ID7.png` | 4767 | 1021 | %21 | 331 | 0 |
| 5 | `en-kotu-05-tiefling-kadin-bard-ID7.png` | 3157 | 999 | %32 | 398 | 0 |
| 6 | `en-kotu-06-tiefling-erkek-barbarian-ID4.png` | 3141 | 985 | %31 | 237 | 0 |
| 7 | `en-kotu-07-tiefling-kadin-barbarian-ID5.png` | 3338 | 971 | %29 | 353 | 0 |
| 8 | `en-kotu-08-tiefling-erkek-fighter-ID4.png` | 3072 | 958 | %31 | 10 | 3 |
| 9 | `en-kotu-09-tiefling-kadin-warlock-WL-5.png` | 3019 | 943 | %31 | 59 | 0 |
| 10 | `en-kotu-10-tiefling-erkek-barbarian-GR.png` | 3711 | 923 | %25 | 57 | 0 |

## 7. Elle düzeltme listesi (c: kaynakta beyaz)

`el-duzeltme-listesi.csv`: **1 bileşen, 1 jeton**: `tiefling-erkek-warlock-WL-1`, (152, 85), 1 px, maskeye 1 px yakın. Onarımın boyadığı 12 piksel dışında
ten bağlamında kaynakta beyaz benek yok; başka jeton Gemini'ye dönmüyor. (Bu piksel çevrelenme eşiğinin hemen altında kaldığı için kodla boyanmadı;
eşiği gevşetmek göz/diş parıltılarını da riske atar.)

## 8. Kapsam dışı gözlemler (düzeltilmedi)

- **Boynuz ve kuyruğun gölge yarısı** (ve bazı kol/gövde bölgeleri) maskede hiç yok (palet/ΔE eşiğinin dışında kalıyor görünüyor; nedeni ayrıca ölçülmedi): özgün şarap renginde
  kalıyor, "yarı boyalı" görünüyor (örnek: `tiefling-female-monk` boynuz ve kuyruk). Bu delik değil kapsam eksiği; çözümü maske üretiminde (palet genişletme ya da
  `grow`, `npm run soy-maske tiefling`) ve elle maske klasörüne dokunmadan yapılmalı. Ayrı görev önerisi.
- Maskesiz 3 Tiefling jetonu (`erkek-druid-ID4`, `erkek-sorcerer-SC-5`, `kadin-druid-ID4`): boyanmadan özgün gösterilir; bu görevden etkilenmez.
- Rün, göz, diş, zırh parlaması ve kıyafet beyazları kasıtlı olarak dokunulmadan bırakıldı.

## 9. Diğer soylu ırklar (yalnız rapor)

Aynı sınıflama; ırkın kendi `mask` renk kutusu, Tiefling `temizlik` parametreleri (yalnız ölçüm için). Elf için çalışma anındaki SD6 temizliği (`closeSkinHoles`)
uygulandıktan sonra ölçüldü (portu TS ile 280 jetonda aynı). Dragonborn'da hedef rengi zaten beyaza yakın `white` ve `silver` soyları (b) ölçümünde yok sayıldı.
"Delik" sütunu: Tiefling onarımının bu ırkta ekleyeceği piksel (kusur göstergesi; onarım uygulanmadı).

| Irk | Jeton (maskeli) | Yakın-beyaz px | a | b | c | d | Delik px (jeton) | Delik / maske |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Dragonborn | 288 (286) | 458072 | 34239 | 14 | 21007 | 402812 | 3581 (52) | %0,2 |
| Goliath | 288 (283) | 129198 | 1370 | 240 | 58 | 127530 | 32000 (276) | %5,2 |
| Dark Elf (Elf jetonları, SD6 sonrası) | 288 (280) | 132134 | 133 | 0 | 225 | 131776 | 5125 (271) | %0,7 |
| Orc (maskesiz, CSS filtresi) | 288 (0) | 126060 | n/a | n/a | 3697 | 122363 | n/a | n/a |

Yorum:
- **Goliath**'ta Tiefling'in kusuru aynı türde ve görünür boyutta: 276 jetonda 32 000 piksel maske deliği (maskenin %5,2'si; Tiefling'de %13,1). Boyama gri tonlu olduğu için
  daha az göze çarpıyor olabilir; aynı ortak adım `temizlik` kaydı eklenerek açılabilir (karar sende, bu görevde yapılmadı).
- **Dark Elf**: SD6 temizliği sonrası kalan delik %0,7 (271 jetonda 5125 piksel) küçük; a/c sayıları (133, 225) esas olarak `warlock-WL-10` ve `cleric-ID2` jetonlarında.
- **Dragonborn**: delik yok denecek kadar az (%0,2); yüksek a/c sayıları kusur değil, beyaz taban ve pul parlamaları (a: en çok `kadin-barbarian-GR` 2019 px; c: 256 jetonda
  küçük parlamalar). Görsel inceleme olmadan beneğe sayılmamalı.
- **Orc**: maske yok, boyama CSS `hue-rotate` filtresi; delik kavramı geçmez. "c" (renkli bağlamda ≤ 12 px beyaz) 145 jetonda 3697 piksel; sezgisel ve gözleri/dişleri de
  içerir, kusur sayısı olarak okunmamalı (en çok `erkek-barbarian-ID7` 156 px).
- Tam sayılar: `diger-irklar-<ırk>.csv` (jeton başına a/b/c/d, delik, vurgu).

## 10. Yeniden çalıştırma (PowerShell)

```powershell
python scripts/soy-benek-teshis.py                 # Tiefling: rapor.csv, el-duzeltme-listesi.csv, ozet.json, en-kotu-*.png
python scripts/soy-benek-teshis.py --irk hepsi     # + Dragonborn, Goliath, Elf, Orc: diger-irklar-<ırk>.csv
python scripts/soy-benek-teshis.py --gorsel 0      # görselsiz (hızlı)
npx vitest run src/ui/skinFix.test.ts              # onarımın testleri
```
