<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Harita klasörleri

Bir haritanın elle dokunulan her şeyi kendi bölge klasöründe: `harita/<bolge>/`. Tarayıcı yalnızca `public/`'ten okuduğu için üretilen görseller `public/maps/<bolge>/` altında.

| Yol | İçerik |
|---|---|
| `harita/<bolge>/<kimlik>.json` | Harita verisi (kimlik = dosya adı; klasör = kaydın `bolge` alanı, test denetler). Varyantlı haritalar tek JSON. |
| `harita/<bolge>/gorsel/<bolge>-<ad>.jpg` | Kaynak görseller (`*-ornek.jpg` eski örnekler). |
| `harita/<bolge>/onizleme/<kimlik>-*.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `harita/<bolge>/prompt/<kimlik>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `harita/<bolge>/duzeltme/<kimlik>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |
| `harita/<bolge>/README.md` | Bölge özeti (`npm run varlik-indeks`). |
| `harita/belgeler/` | Denge (`DENGE.md`), görsel şartnamesi, görev ve tasarım belgeleri, `terrain-ek.json`, prototipler. |
| `harita/_ortak/` | Harita betiklerinin ortak verisi: `harita-bolgeleri.json`, `harita-referans.json`. |
| `public/maps/<bolge>/<bolge>-<ad>.webp` | **Üretilen** görseller (`npm run harita-gorsel`; elle düzenlenmez). |
| `assets-ham/harita/<bolge>/` | Ham Gemini çıktıları (depo dışı, `.gitignore`). |

**Ad kuralı:** küçük harf, rakam, tire, yalnızca ASCII; görsel adı `<bolge>-<ad>` (klasik 15×7 haritalar `<bolge>-klasik`), çok görselli haritada ilk varyant `<gorsel>.webp`, diğerleri `<gorsel>-<varyant>.webp`. Önizleme ve prompt adı kimlikten (ayrı görselli varyantta `<kimlik>-<varyant>`). `harita/` içinde yalnızca bu alt klasörler açılır.

Bölgeler: `bataklik` (Bataklık), `col` (Çöl), `dag` (Dağ), `deniz` (Deniz), `kale` (Kale), `orman` (Orman), `sehir` (Şehir), `yeralti` (Yeraltı), `volkan` (Volkan), `vitrin` (Vitrin), `derinlikler` (Derinlikler). Her haritanın durumu: `docs/VARLIK-HARITASI.md`.
