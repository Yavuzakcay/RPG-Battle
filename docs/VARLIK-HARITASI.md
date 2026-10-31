# Varlık haritası (harita görselleri)

`npm run varlik-indeks` üretir (Kuyruk 19 D3/19C; elle düzenlenmez). Bölgeler `harita/_ortak/harita-bolgeleri.json`, haritalar `harita/<bolge>/<ad>.json` (`bolge`, `gorsel`, varyant `image`). Klasör haritası `harita/belgeler/README.md`.

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; `<bolge>-<ad>`. Harita **kimliği** değişmez (kayıt ve replay kimlikle çalışır); görsel adı kayıttaki `gorsel` alanında. İlk varyant `maps/<gorsel>.webp`; ayrı görseli olan diğer varyantlar `maps/<gorsel>-<varyant>.webp`.

**Kaynak ve çıktı:** `harita/<bolge>/gorsel/<ad>.jpg` (tam üstten çizilmiş kaynak; ortadan kırpılır) · `assets-ham/harita/<bolge>/<ad>.png|jpg|webp` (Gemini ham çıktısı; referanstan önce gelir) · `public/maps/<bolge>/<ad>.webp` (işlenmiş). İşlemek için: `npm run harita-gorsel -- <kimlik> [<kimlik> ...]` (kaynak yoksa mevcut görsel korunur, uyarı verilir; yer tutucu yalnızca görsel hiç yoksa ya da `--yer-tutucu` ile).

| Bölge | Harita | Görsel | Planlanan |
|---|---:|---:|---:|
| Bataklık (`bataklik`) | 1 | 1 | 0 |
| Çöl (`col`) | 1 | 2 | 0 |
| Dağ (`dag`) | 1 | 2 | 0 |
| Deniz (`deniz`) | 2 | 4 | 0 |
| Kale (`kale`) | 3 | 4 | 0 |
| Orman (`orman`) | 7 | 12 | 0 |
| Şehir (`sehir`) | 2 | 3 | 0 |
| Yeraltı (`yeralti`) | 3 | 5 | 0 |
| Volkan (`volkan`) | 5 | 5 | 0 |
| Vitrin (`vitrin`) | 1 | 1 | 0 |
| Derinlikler (`derinlikler`) | 4 | 4 | 2 |

## Bataklık (`bataklik`)

Sualtı/bataklık haritası.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `bataklik` | `bataklik-klasik` | `bataklik` | `harita/bataklik/bataklik-klasik.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Çöl (`col`)

Klasik çöl haritası (gündüz, akşam).

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `col` | `col-klasik` | `col` | `harita/col/col-klasik.json` | var | var | yok | yok | tamam; kaynak: referans; 2 görsel / 2 varyant |

## Dağ (`dag`)

Klasik dağ geçidi (yaz, kış).

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `dag` | `dag-klasik` | `dag` | `harita/dag/dag-klasik.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |

## Deniz (`deniz`)

Ada ve gemi haritaları (güneş, fırtına).

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `ada` | `deniz-ada` | `deniz` | `harita/deniz/deniz-ada.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |
| `gemi` | `deniz-gemi` | `deniz` | `harita/deniz/deniz-gemi.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |

## Kale (`kale`)

Klasik kale, kale ve avlu, Kale Baskını seferi.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `kale` | `kale-klasik` | `kale` | `harita/kale/kale-klasik.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |
| `kale-avlu` | `kale-avlu` | `kale` | `harita/kale/kale-avlu.json` | yok | var | var | var | tamam; kaynak: yok (mevcut görsel elle/eski) |
| `kale-baskini` | `kale-baskini` | `kale` | `harita/kale/kale-baskini.json` | yok | var | var | var | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Orman (`orman`)

Dere Kenarı (klasik orman: gündüz, gece), geniş Orman yolu, Kuyruk 23 Orman paketi: Heykel Gölü, Oduncu Kampı (31×17), Ork Kampı, Kemik Açıklığı (21×11; gündüz ve gece) ve Kuyruk 24 Heykel Mağarası (21×11, yeraltı, karanlık).

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `orman` | `orman-yol` | `orman` | `harita/orman/orman-yol.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |
| `orman-heykel-golu` | `orman-heykel-golu` | `orman` | `harita/orman/orman-heykel-golu.json` | var | var | var | var | tamam; kaynak: referans; 2 görsel / 2 varyant |
| `orman-heykel-magarasi` | `orman-heykel-magarasi` | `orman` | `harita/orman/orman-heykel-magarasi.json` | var | var | var | var | tamam; kaynak: referans |
| `orman-kemik-acikligi` | `orman-kemik-acikligi` | `orman` | `harita/orman/orman-kemik-acikligi.json` | var | var | var | var | tamam; kaynak: referans; 2 görsel / 2 varyant |
| `orman-oduncu-kampi` | `orman-oduncu-kampi` | `orman` | `harita/orman/orman-oduncu-kampi.json` | var | var | var | var | tamam; kaynak: referans; 2 görsel / 2 varyant |
| `orman-ork-kampi` | `orman-ork-kampi` | `orman` | `harita/orman/orman-ork-kampi.json` | var | var | var | var | tamam; kaynak: referans; 2 görsel / 2 varyant |
| `orman-yolu` | `orman-genis-yol` | `orman` | `harita/orman/orman-genis-yol.json` | yok | var | var | var | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Şehir (`sehir`)

Şehir meydanı ve taverna.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `sehir-meydani` | `sehir-meydani` | `sehir` | `harita/sehir/sehir-meydani.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 görsel / 2 varyant |
| `taverna` | `sehir-taverna` | `sehir` | `harita/sehir/sehir-taverna.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Yeraltı (`yeralti`)

Zindan, mağara ve geniş mağara.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `dungeon` | `yeralti-zindan` | `yeralti` | `harita/yeralti/yeralti-zindan.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 3 görsel / 4 varyant |
| `magara` | `yeralti-magara` | `yeralti` | `harita/yeralti/yeralti-magara.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski) |
| `magara-genis` | `yeralti-magara-genis` | `yeralti` | `harita/yeralti/yeralti-magara-genis.json` | yok | var | var | var | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Volkan (`volkan`)

Klasik Volkan (boss: uyuyan ejderha) ve Volkan Seferi haritaları; ödül sahnesi volkan-hazine.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `isinlanma-salonu` | `volkan-portal-salonu` | `volkan` | `harita/volkan/volkan-portal-salonu.json` | var | var | var | var | tamam; kaynak: referans |
| `kanyon-koprusu` | `volkan-kopru` | `volkan` | `harita/volkan/volkan-kopru.json` | var | var | var | var | tamam; kaynak: referans |
| `lav-tapinagi` | `volkan-tapinak` | `volkan` | `harita/volkan/volkan-tapinak.json` | var | var | var | var | tamam; kaynak: referans |
| `volkan` | `volkan-boss` | `volkan` | `harita/volkan/volkan-boss.json` | yok | var | yok | yok | tamam; kaynak: yok (mevcut görsel elle/eski); 2 varyant |
| `volkanik-demirhane` | `volkan-demirhane` | `volkan` | `harita/volkan/volkan-demirhane.json` | var | var | var | var | tamam; kaynak: referans |

**Sahneler (harita değil):**

| Ad | Görsel | Kaynak referans | İşlenmiş | Veri |
|---|---|---|---|---|
| Volkan Seferi ödül sahnesi | `volkan-hazine` | `harita/volkan/gorsel/volkan-hazine.jpg` | volkan-hazine.webp (178 kB) | data/seferler.json odulSahnesi |

## Vitrin (`vitrin`)

Test/vitrin haritası Ortamlar Diyarı (denge dışı).

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `ortamlar-diyari` | `vitrin-ortamlar-diyari` | `vitrin` | `harita/vitrin/vitrin-ortamlar-diyari.json` | yok | var | var | var | tamam; kaynak: yok (mevcut görsel elle/eski) |

## Derinlikler (`derinlikler`)

Kuyruk 21: Derinlikler yeraltı seferi (dallanan): Mağara Karakolu, Mezar Labirenti, Mantar Mağarası, Lav Salonu; zemin `npm run harita-zemin` + duzeltme/. Planlananlar henüz kaydı olmayan adlar.

| Kimlik | Ad | Bölge | JSON | Görsel (jpg) | Webp | Önizleme | Prompt | Durum |
|---|---|---|---|---|---|---|---|---|
| `derinlikler-lav-salonu` | `derinlikler-lav-salonu` | `derinlikler` | `harita/derinlikler/derinlikler-lav-salonu.json` | var | var | var | var | tamam; kaynak: referans |
| `derinlikler-magara-karakol` | `derinlikler-magara-karakol` | `derinlikler` | `harita/derinlikler/derinlikler-magara-karakol.json` | var | var | var | var | tamam; kaynak: referans |
| `derinlikler-mantar-magarasi` | `derinlikler-mantar-magarasi` | `derinlikler` | `harita/derinlikler/derinlikler-mantar-magarasi.json` | var | var | var | var | tamam; kaynak: referans |
| `derinlikler-mezar-labirenti` | `derinlikler-mezar-labirenti` | `derinlikler` | `harita/derinlikler/derinlikler-mezar-labirenti.json` | var | var | var | var | tamam; kaynak: referans |

**Planlanan (kayıt yok):**

| Ad | Kaynak referans | Ham | İşlenmiş |
|---|---|---|---|
| `derinlikler-hazine-odasi` | — | — | bekleniyor |
| `derinlikler-tuzakli-salon` | — | — | bekleniyor |
