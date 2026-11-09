# K72: bina içi tavan bölgeleri listesi

Üreten: `python scripts/k72-tavan-bolge.py --rapor`. Sürüm 60+ davranışı (varyant `dikey.odalar`).

**Otomatik tespit:**
- Kapalı alan (duvar `s`, kapalı kapı `O`, kapı/geçit `o`, harita dışı `#`) ve tek altıgenlik kapı aralığı (iki karşı yanında duvar).
- 3–40 altıgen ve kutu doluluğu ≥ 0.6: oda.
- 41–100: belirsiz. Daha büyüğü avlu (tavansız).

**Elle bölge:**
- `scripts/k72-tavan-bolge.py` `ONAYLI_BOLGE` tablosuna yazılır.
- Biçim: `'harita': [{'dikdortgen': (c0, r0, c1, r1)}]` ya da `{'altigenler': [(c, r), ...], 'ft': N}`.
- Sütun/satır 0 tabanlı, önizlemedeki etiketler. Duvar/kapı altıgenleri kendiliğinden düşülür.
- Sonra `python scripts/k72-tavan-bolge.py --rapor` çalıştırılır.

**Kalan (elle bölge bekleyen, 12):** `batak-kale`, `buzul-tapinak`, `hapishane-dis-halka`, `hapishane-iskele`, `kale`, `sehir-meydani`, `beyaz-sehir-dis-kapi`, `beyaz-sehir-saray-avlusu`, `kale-ic-avlu`, `kale-onu`, `kasaba-demirci-tapinak`, `kasaba-han`

## Haritalar

### batak-kale (21×11, tavan 15 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/bataklik/onizleme/batak-kale-oda.png`

### buzul-tapinak (21×11, tavan 20 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/buzul/onizleme/buzul-tapinak-oda.png`

### hapishane-dis-halka (21×11, tavan 12 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/hapishane/onizleme/hapishane-dis-halka-oda.png`

### hapishane-iskele (21×11, tavan 12 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/hapishane/onizleme/hapishane-iskele-oda.png`

### kale-avlu (31×17, tavan 15 ft)

- K71b odaları (tavanBolge, sürüm 56+): [22, 4, 24, 6], [22, 10, 24, 12]
- **Otomatik oda:** sütun 26–28, satır 4–6: 7 altıgen (doluluk 0.78)
- **Otomatik oda:** sütun 26–28, satır 10–12: 7 altıgen (doluluk 0.78)
- Avlu (tavansız): sütun 12–28, satır 2–14: 162 altıgen
- Avlu (tavansız): sütun 12–20, satır 2–14: 116 altıgen

### kale-baskini (31×17, tavan 15 ft)

- K71b odaları (tavanBolge, sürüm 56+): [22, 4, 24, 6], [22, 10, 24, 12]
- **Otomatik oda:** sütun 26–28, satır 4–6: 7 altıgen (doluluk 0.78)
- **Otomatik oda:** sütun 26–28, satır 10–12: 7 altıgen (doluluk 0.78)
- Avlu (tavansız): sütun 12–28, satır 2–14: 162 altıgen
- Avlu (tavansız): sütun 12–20, satır 2–14: 116 altıgen

### kale (15×7, tavan 15 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/kale/onizleme/kale-klasik-oda.png`

### sehir-meydani (15×7, tavan 15 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/sehir/onizleme/sehir-meydani-oda.png`

### beyaz-sehir-dis-kapi (21×11, tavan 15 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/yerlesim/onizleme/beyaz-sehir-dis-kapi-oda.png`

### beyaz-sehir-saray-avlusu (21×11, tavan 20 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/yerlesim/onizleme/beyaz-sehir-saray-avlusu-oda.png`

### kale-ic-avlu (21×11, tavan 15 ft)

- **Belirsiz:** sütun 2–18, satır 2–7: 93 altıgen (doluluk 0.91; salon mu avlu mu?)
- **Belirsiz:** sütun 2–18, satır 2–7: 91 altıgen (doluluk 0.89; salon mu avlu mu?)
- Önizleme: `harita/yerlesim/onizleme/kale-avlu-oda.png`

### kale-onu (21×11, tavan 15 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/yerlesim/onizleme/kale-onu-oda.png`

### kasaba-demirci-tapinak (21×11, tavan 12 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/yerlesim/onizleme/kasaba-demirci-tapinak-oda.png`

### kasaba-han (21×11, tavan 12 ft)

- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.
- Önizleme: `harita/yerlesim/onizleme/kasaba-han-oda.png`

