<!-- npm run varlik-indeks üretir (Kuyruk 19 D3); elle düzenlemeyin, data/harita-bolgeleri.json'u düzenleyin. -->
# Harita klasörleri

| Yol | İçerik |
|---|---|
| `data/maps/<kimlik>.json` | Harita kayıtları (düz; bölge kayıttaki `bolge` alanında, görsel adı `gorsel`). Kimlik değişmez. |
| `data/maps/duzeltme/<kimlik>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik boş). |
| `docs/harita/referans/<bolge>/<bolge>-<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel` ortadan kırpar). `*-ornek.jpg` eski örnekler. |
| `public/maps/<bolge>/<bolge>-<ad>.webp` | İşlenmiş görseller (oyun bunları yükler). |
| `docs/harita/onizleme/<kimlik>-*.png` | Üretilen önizlemeler (`npm run harita-referans`: `-izgara.png`, `-izgarasiz.png`). |
| `docs/harita/prompt/<kimlik>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `docs/harita/` | Denge (`DENGE.md`), görsel şartnamesi, görev ve kural belgeleri, prototipler. |
| `assets-ham/harita/<bolge>/` | Ham Gemini çıktıları (depo dışı, `.gitignore`; beklenen adlar `docs/VARLIK-HARITASI.md`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı `<bolge>-<ad>` (klasik 15×7 haritalar `<bolge>-klasik`), çok görselli haritada ilk varyant `<gorsel>.webp`, diğerleri `<gorsel>-<varyant>.webp`. Önizleme ve prompt adı kimlikten (ayrı görselli varyantta `<kimlik>-<varyant>`). Başka harita klasörü açılmaz.

Bölgeler (`data/harita-bolgeleri.json`): `bataklik` (Bataklık), `col` (Çöl), `dag` (Dağ), `deniz` (Deniz), `kale` (Kale), `orman` (Orman), `sehir` (Şehir), `yeralti` (Yeraltı), `volkan` (Volkan), `vitrin` (Vitrin), `derinlikler` (Derinlikler). Her haritanın durumu: `docs/VARLIK-HARITASI.md` (`npm run varlik-indeks`).
