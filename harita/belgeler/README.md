<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Harita klasörleri

Bir haritanın elle dokunulan her şeyi kendi bölge klasöründe: `harita/<bolge>/`. Tarayıcı yalnızca `public/`'ten okuduğu için üretilen görseller `public/maps/<bolge>/` altında.

| Yol | İçerik |
|---|---|
| `harita/<bolge>/<ad>.json` | Harita verisi (dosya adı = ad tabanı = ilk varyantın görsel adı; kimlik JSON'un `id` alanında; klasör = kaydın `bolge` alanı; test denetler). Varyantlı haritalar tek JSON. |
| `harita/<bolge>/gorsel/<bolge>-<ad>.jpg` | Kaynak görseller (`*-ornek.jpg` eski örnekler). |
| `harita/<bolge>/onizleme/<ad>-*.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `harita/<bolge>/prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `harita/<bolge>/duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |
| `harita/<bolge>/README.md` | Bölge özeti (`npm run varlik-indeks`). |
| `harita/belgeler/` | Denge (`DENGE.md`), görsel şartnamesi, görev ve tasarım belgeleri, `terrain-ek.json`, prototipler. |
| `harita/_ortak/` | Harita betiklerinin ortak verisi: `harita-bolgeleri.json`, `harita-referans.json`. |
| `public/maps/<bolge>/<bolge>-<ad>.webp` | **Üretilen** görseller (`npm run harita-gorsel`; elle düzenlenmez). |
| `assets-ham/harita/<bolge>/` | Ham Gemini çıktıları (depo dışı, `.gitignore`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı `<bolge>-<ad>` (klasik 15×7 haritalar `<bolge>-klasik`), çok görselli haritada ilk varyant `<gorsel>.webp`, diğerleri `<gorsel>-<varyant>.webp`. **Bir haritanın bütün dosyaları aynı `<ad>` tabanını taşır** (JSON, kaynak görsel, önizleme, prompt, düzeltme; ayrı görselli varyantta `<ad>-<varyant>`); kimlik yalnızca JSON'un `id` alanında. `harita/` içinde yalnızca bu alt klasörler açılır.

Bölgeler: `bataklik` (Bataklık), `buzul` (Buzul), `col` (Çöl), `dag` (Dağ), `deniz` (Deniz), `kale` (Kale), `orman` (Orman), `sehir` (Şehir), `yeralti` (Yeraltı), `volkan` (Volkan), `vitrin` (Vitrin), `derinlikler` (Derinlikler), `yerlesim` (Yerleşimler), `hapishane` (Hapishane Adası). Her haritanın durumu: `docs/VARLIK-HARITASI.md`.
