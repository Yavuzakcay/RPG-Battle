# Varlık haritası (harita görselleri)

`npm run varlik-indeks` üretir (Kuyruk 19 D3; elle düzenlenmez). Bölgeler `data/harita-bolgeleri.json`, haritalar `data/maps/*.json` (`bolge`, `gorsel`, varyant `image`).

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; `<bolge>-<ad>`. Harita **kimliği** değişmez (kayıt ve replay kimlikle çalışır); görsel adı kayıttaki `gorsel` alanında. İlk varyant `maps/<gorsel>.webp`; ayrı görseli olan diğer varyantlar `maps/<gorsel>-<varyant>.webp`.

**Üç kök:** `docs/harita/referans/<bolge>/<ad>.jpg` (tam üstten çizilmiş kaynak; ortadan kırpılır) · `assets-ham/harita/<bolge>/<ad>.png|jpg|webp` (Gemini ham çıktısı; referanstan önce gelir) · `public/maps/<bolge>/<ad>.webp` (işlenmiş). İşlemek için: `npm run harita-gorsel -- <kimlik> [<kimlik> ...]` (kaynak yoksa mevcut görsel korunur, uyarı verilir; yer tutucu yalnızca görsel hiç yoksa ya da `--yer-tutucu` ile).

| Bölge | Harita | Görsel | Planlanan |
|---|---:|---:|---:|
| Bataklık (`bataklik`) | 1 | 1 | 0 |
| Çöl (`col`) | 1 | 2 | 0 |
| Dağ (`dag`) | 1 | 2 | 0 |
| Deniz (`deniz`) | 2 | 4 | 0 |
| Kale (`kale`) | 3 | 4 | 0 |
| Orman (`orman`) | 2 | 3 | 0 |
| Şehir (`sehir`) | 2 | 3 | 0 |
| Yeraltı (`yeralti`) | 3 | 5 | 0 |
| Volkan (`volkan`) | 5 | 5 | 0 |
| Vitrin (`vitrin`) | 1 | 1 | 0 |
| Derinlikler (`derinlikler`) | 0 | 0 | 6 |

## Bataklık (`bataklik`)

Sualtı/bataklık haritası.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `bataklik` | Bataklık | 15×7 | `bataklik` | bataklik-klasik.webp (118 kB) | — | — | — | yok (mevcut görsel elle/eski) |

## Çöl (`col`)

Klasik çöl haritası (gündüz, akşam).

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `col` | Çöl | 15×7 | `gunduz` | col-klasik.webp (80 kB) | `docs/harita/referans/col/col-klasik.jpg` | — | — | referans |
| `col` | Çöl | 15×7 | `aksam` | col-klasik-aksam.webp (67 kB) | `docs/harita/referans/col/col-klasik-aksam.jpg` | — | — | referans |

## Dağ (`dag`)

Klasik dağ geçidi (yaz, kış).

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `dag` | Dağ | 15×7 | `yaz` | dag-klasik.webp (101 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `dag` | Dağ | 15×7 | `kis` | dag-klasik-kis.webp (72 kB) | — | — | — | yok (mevcut görsel elle/eski) |

## Deniz (`deniz`)

Ada ve gemi haritaları (güneş, fırtına).

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `ada` | Ada | 15×7 | `gunes` | deniz-ada.webp (108 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `ada` | Ada | 15×7 | `firtina` | deniz-ada-firtina.webp (84 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `gemi` | Güverte | 15×7 | `gunes` | deniz-gemi.webp (126 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `gemi` | Güverte | 15×7 | `firtina` | deniz-gemi-firtina.webp (99 kB) | — | — | — | yok (mevcut görsel elle/eski) |

## Kale (`kale`)

Klasik kale, kale ve avlu, Kale Baskını seferi.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `kale` | Kale | 15×7 | `gunduz` | kale-klasik.webp (70 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `kale` | Kale | 15×7 | `gece` | kale-klasik-gece.webp (56 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `kale-avlu` | Kale ve avlu | 31×17 | `gunduz` | kale-avlu.webp (73 kB) | — | — | var | yok (mevcut görsel elle/eski) |
| `kale-baskini` | Kale Baskını | 31×17 | `gunduz` | kale-baskini.webp (78 kB) | — | — | var | yok (mevcut görsel elle/eski) |

## Orman (`orman`)

Klasik orman (gündüz, gece) ve geniş orman yolu.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `orman` | Orman | 15×7 | `orman` | orman-klasik.webp (102 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `orman` | Orman | 15×7 | `gece` | orman-klasik-gece.webp (72 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `orman-yolu` | Orman yolu | 31×17 | `gunduz` | orman-yol.webp (95 kB) | — | — | var | yok (mevcut görsel elle/eski) |

## Şehir (`sehir`)

Şehir meydanı ve taverna.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `sehir-meydani` | Şehir Meydanı | 15×7 | `gun` | sehir-meydani.webp (231 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `sehir-meydani` | Şehir Meydanı | 15×7 | `gece` | sehir-meydani-gece.webp (132 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `taverna` | Taverna | 15×7 | `ic-mekan` | sehir-taverna.webp (109 kB) | — | — | — | yok (mevcut görsel elle/eski) |

## Yeraltı (`yeralti`)

Zindan, mağara ve geniş mağara.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `dungeon` | Dungeon | 15×7 | `mesale` | yeralti-zindan.webp (69 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `dungeon` | Dungeon | 15×7 | `merdiven` | yeralti-zindan-merdiven.webp (62 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `dungeon` | Dungeon | 15×7 | `hazine` | yeralti-zindan-hazine.webp (103 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `magara` | Mağara | 15×7 | `magara` | yeralti-magara.webp (91 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `magara-genis` | Mağara (orta) | 21×11 | `magara` | yeralti-magara-genis.webp (26 kB) | — | — | var | yok (mevcut görsel elle/eski) |

## Volkan (`volkan`)

Klasik Volkan (boss: uyuyan ejderha) ve Volkan Seferi haritaları; ödül sahnesi volkan-hazine.

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `isinlanma-salonu` | Işınlanma Salonu | 21×11 | `varsayilan` | volkan-portal-salonu.webp (34 kB) | — | — | var | yok (mevcut görsel elle/eski) |
| `kanyon-koprusu` | Kanyon Köprüsü | 21×11 | `varsayilan` | volkan-kopru.webp (34 kB) | — | — | var | yok (mevcut görsel elle/eski) |
| `lav-tapinagi` | Lav Tapınağı | 21×11 | `varsayilan` | volkan-tapinak.webp (31 kB) | — | — | var | yok (mevcut görsel elle/eski) |
| `volkan` | Volkan | 15×7 | `normal` | volkan-boss.webp (112 kB) | — | — | — | yok (mevcut görsel elle/eski) |
| `volkan` | Volkan | 15×7 | `uyuyan-ejderha` | (aynı görsel) | | | | |
| `volkanik-demirhane` | Volkanik Demirhane | 31×17 | `varsayilan` | volkan-demirhane.webp (62 kB) | — | — | var | yok (mevcut görsel elle/eski) |

**Sahneler (harita değil):**

| Ad | Görsel | Kaynak referans | İşlenmiş | Veri |
|---|---|---|---|---|
| Volkan Seferi ödül sahnesi | `volkan-hazine` | — | bekleniyor (yer tutucu degrade) | data/seferler.json odulSahnesi |

## Vitrin (`vitrin`)

Test/vitrin haritası Ortamlar Diyarı (denge dışı).

| Kimlik | Ad | Boyut | Varyant | İşlenmiş (`public/maps/`) | Kaynak referans | Ham | Önizleme (`docs/harita/onizleme/`) | Kaynak |
|---|---|---|---|---|---|---|---|---|
| `ortamlar-diyari` | Ortamlar Diyarı | 31×17 | `gunduz` | vitrin-ortamlar-diyari.webp (78 kB) | — | — | var | yok (mevcut görsel elle/eski) |

## Derinlikler (`derinlikler`)

Planlanan bölge: kayıtları henüz yok; görseller geldiğinde bu adlarla konur.

**Planlanan (kayıt yok):**

| Ad | Kaynak referans | Ham | İşlenmiş |
|---|---|---|---|
| `derinlikler-lav-salonu` | — | — | bekleniyor |
| `derinlikler-mezar-labirenti` | — | — | bekleniyor |
| `derinlikler-mantar-magarasi` | — | — | bekleniyor |
| `derinlikler-magara-karakol` | — | — | bekleniyor |
| `derinlikler-hazine-odasi` | — | — | bekleniyor |
| `derinlikler-tuzakli-salon` | — | — | bekleniyor |
