<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Volkan (`volkan`)

Klasik Volkan (boss: uyuyan ejderha) ve Volkan Seferi haritaları; ödül sahnesi volkan-hazine.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/volkan/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `isinlanma-salonu` | `volkan-portal-salonu` | Portal Salonu | `varsayilan` |
| `kanyon-koprusu` | `volkan-kopru` | Kanyon Köprüsü | `varsayilan` |
| `lav-tapinagi` | `volkan-tapinak` | Lav Tapınağı | `varsayilan` |
| `volkan` | `volkan-boss` | Lav Adaları | `normal`, `uyuyan-ejderha` |
| `volkanik-demirhane` | `volkan-demirhane` | Volkanik Demirhane | `varsayilan` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/volkan/<ad>.png`, çıktı `public/maps/volkan/<ad>.webp`):

- `volkan-boss`
- `volkan-demirhane`
- `volkan-kopru`
- `volkan-portal-salonu`
- `volkan-tapinak`
- `volkan-hazine`
