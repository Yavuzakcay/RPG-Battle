# Kanat sprite'ları (Kuyruk AS1c, bağlama)

Savaş jetonunun ARKASINDA çizilen kanat katmanı (yalnız görünüm; kural sürümü değişmez). Eşleme `data/kanat-esleme.json`, çözücü `src/ui/lineageLook.ts` (`wingBox`), çizim `src/ui/Avatar.tsx` (savaş jetonu) ve `src/ui/LookFrame.tsx` (rozetler).

| Slot | Dosya | Çapa (x / y, görsel oranı) | Görünürlük | Başlangıç rengi |
|---|---|---|---|---|
| `tiefling-kanatli` | `tiefling-kanatli.webp` | 0.501 / 0.708 | yalnız havada (Kanat Süzülüşü) | koyu kırmızı-mor |
| `celestial-kirik-kanat` | `celestial-kirik-kanat.webp` (768×458; `scripts/celestial-kirik-kanat.py`) | 0.543 / 0.444 (iki kökün ortası, asimetrik, AYNALAMA YOK; `olcek` 1,15) | HER ZAMAN (`herZaman: true`) | kendi sepyası, filtresiz (uyanış sepyası yalnız gövdeye: `sepya.kanat: false`) |
| `dragonborn` | `dragonborn.webp` (TEK sağ kanat, 364×279; KW1) + `dragonborn-zar.webp`, `dragonborn-pence.webp` (aynı boyutta saydam katmanlar; KW2/KW3) | 0.058 / 0.448 (kök = omuz eklemi) | yalnız havada (Draconic Flight), 5+ seviye | 10 soy paleti (`renkPaletleri`: gövdeye uyumlu, eşikli) |
| `melek-acik` (`altSinif: "melek"`) | `melek-acik.webp` (768×209) | 0.500 / 0.383 | yalnız havada; jetonun kapalı kanatları boyalı kalır | filtre yok |

Görsel şartı: şeffaf WebP, BEYAZ-GRİ taban; kanat çifti slotlarında 768 px geniş, sol + sağ kanat tek görselde (Dragonborn: tek kanat, aşağıda). Renk CSS `filter` ile verilir (`filtre`); SD5'ten beri parlaklık→renk SVG paleti (`palet` / soya göre `renkPaletleri`: `golge`, `isik`, KW1'de isteğe bağlı `esik`); CSS filtre sırası `sepia → saturate → hue-rotate → brightness`.

Yerleşim (kanat başına JSON'dan ayarlanır):
- `capa`: kanat kökü, görselin oranı olarak.
- `olcek`: kanat çifti genişliği / jeton genişliği (1.45).
- `omuz`: kökün jeton yüksekliğinde tepeden oranı (0.46); kök jetonun yatay merkezindedir.
- `enBoy`: görsel yüksekliği / genişliği (testte dosyadan doğrulanır).
- `herZaman`: havada olmasa da açık sprite. `dosyaKapali`: havada değilken görsel (yoksa katman yok).

Alt sınıfa bağlı slot (`altSinif`, isteğe bağlı): slotun içine alt sınıf kimliği yazılır, örn.

```json
"melek-acik": { "altSinif": "melek", "dosya": "melek-acik.webp", "capa": [0.5, 0.383], "enBoy": 0.2721, "olcek": 1.5, "omuz": 0.46, "filtre": "" }
```

Karakterin seçili alt sınıfı bu kimlikse (ve alt sınıf kayıtta yüklüyse; ek paket yoksa slot hiçbir etki yapmaz, hata vermez) slot ırk/alt soy kanadının yerine geçer. `altSinif` yoksa slot eskisi gibi ırk/alt soy/Göksel Uyanış eşlemesiyle seçilir. Genişlik `olcek` (jeton genişliğine oran; Melek için 1,5) ile ayarlanır.

Karakter ekranları (karakter listesi, oluşturucu önizlemesi): `LookFrame` `ability` ile uçma yeteneği olan karakter (slot soy/alt soy/alt sınıf ve seviyeyle eşleşiyorsa) havada olmadan da kanatlı görünür. Savaş jetonunda kural aynen: `herZaman` olmayan slot yalnız havadayken.

## Tek kanatlı slot: Dragonborn (KW1, yalnız görünüm)

`dragonborn.webp` TEK (sağ) kanattır; sol kanat çizimde sağın aynasıdır (`dragonborn.ayna`: `dx` kökün gövde merkezinden varsayılan uzaklığı, jeton genişliği oranı; `aci` kök etrafında dışa/yukarı dönüş, derece). Çift görselin sağ yarısından `python3 scripts/dragonborn-kanat-tek.py` üretir (çift görsel git geçmişinde: `d7e212a:public/kanat/dragonborn.webp`; sol yarı sağın birebir aynası, betik doğrular).

- `capa` kanadın KÖKÜ (omuz eklemi), görselin oranı olarak; `olcek` TEK kanadın jeton genişliğine oranı (0,6); `omuz` kökün jeton yüksekliğinde tepeden oranı (0,40: omuz hizası, omuz–dirsek bandının [%38–55] omuz tarafı).
- Kök gövdeye bağlıdır: sol ve sağ kökün x'i jetonun gövde siluetinin kenarının 6 px İÇİNDE (jeton uzayı 256 px), y `omuz`. Konum `data/dragonborn-kanat-kok.json` (`sinif`: `<sınıf>-<erkek|kadin>[-gr|-genel]` medyanı, `jeton`: gruptan > 5 px sapanlar için kayıt; çözücü `src/ui/wingRoot.ts`, üretici `python3 scripts/dragonborn-kanat-kok.py`). Kayıt yoksa `ayna.dx`.
- Katman sırası: kanat figürün ARKASINDA. Savaş jetonu ve karakter figürü (SVG): kanat figür görselinden önce çizilir (jeton saydam sprite'tır, daire yok). Rozet (HTML): kanat `AvatarBadge` içinde, kendi zemin dairesi ile figür arasındadır (`LookFrame` çözülmüş görünümü `LookContext` ile iner; `.avatar.has-wing` taşmaya izin verir, figür `clip-path: circle()` ile daireye kırpılır). Kanat kökü gövdenin arkasında kalır, yalnız siluetin dışına çıkan kısım görünür.
- Palet: soyun BOYANMIŞ gövde rengine (pul maskesi, `scalePixels`) yakın. `esik` (0–1): parlaklık eşiği, kanat görseli çok açık olduğu için (luma 0,72–1,0) palet aralığını tam kullansın diye eşikten gerilir. `npx vite-node scripts/dragonborn-kanat-palet.ts [--yaz]` ölçer ve çözer (White sıcak parlak beyaz, Silver soğuk metalik gri-mavi hedefleri betikte). Ölçüt ve ölçümler `docs/sabah/dragonborn-kanat/README.md`, test `src/ui/kanatKok.test.tsx`.
- Katmanlar (KW2/KW3): taban görselin (kol ve ön kenar kemiği: soy renginde) üstüne iki saydam katman, her biri kendi paletiyle, aynı kutu ve dönüşte: `zar` (kanat zarı: soy rengi + pembe karışımı) ve `pence` (iki pençe ucu + kanadın en ucundaki kemik ucu: beyaz). Veri: `katmanlar.zar.dosya` / `.etkin`, soy paletinde `zar` alt paleti, `pembe` (Lab: pembe rengi, `ab` renk karışım oranı, `aciklik` açıklık oranı), `katmanlar.pence.dosya` / `.palet`. `katmanlar.zar.etkin: false` zarı soy renginde bırakır; pençe her zaman beyaz. Katman görselleri `python3 scripts/dragonborn-kanat-katman.py` (bölgeler elle çokgen; kenarlar yumuşatılmış), paletler `npx vite-node scripts/dragonborn-kanat-palet.ts --yaz`. Pençe rengi jetonların boyanmamış boynuz piksellerinin ortalaması (Lab 80,4 / 0,2 / 2,8).
