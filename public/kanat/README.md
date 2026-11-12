# Kanat sprite'ları (Kuyruk AS1c, bağlama)

Savaş jetonunun ARKASINDA çizilen kanat katmanı (yalnız görünüm; kural sürümü değişmez). Eşleme `data/kanat-esleme.json`, çözücü `src/ui/lineageLook.ts` (`wingBox`), çizim `src/ui/Avatar.tsx` (savaş jetonu) ve `src/ui/LookFrame.tsx` (rozetler).

| Slot | Dosya | Çapa (x / y, görsel oranı) | Görünürlük | Başlangıç rengi |
|---|---|---|---|---|
| `tiefling-kanatli` | `tiefling-kanatli.webp` | 0.501 / 0.708 | yalnız havada (Kanat Süzülüşü) | koyu kırmızı-mor |
| `celestial-kirik-kanat` | `celestial-kirik-kanat.webp` | 0.568 / 0.438 (asimetrik, AYNALAMA YOK) | HER ZAMAN (`herZaman: true`) | beyaz |
| `dragonborn` | `dragonborn.webp` | 0.500 / 0.626 | yalnız havada (Draconic Flight), 5+ seviye | 10 renk (`renkFiltreleri`) |
| `melek-acik` (`altSinif: "melek"`) | `melek-acik.webp` (768×209) | 0.500 / 0.383 | yalnız havada; jetonun kapalı kanatları boyalı kalır | filtre yok |

Görsel şartı: şeffaf WebP, 768 px geniş, sol + sağ kanat tek görselde, BEYAZ-GRİ taban. Renk CSS `filter` ile verilir (`filtre`, Dragonborn için soya göre `renkFiltreleri`); filtre sırası `sepia → saturate → hue-rotate → brightness`.

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
