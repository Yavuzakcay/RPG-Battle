<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Yeraltı (`yeralti`)

Zindan, mağara ve geniş mağara.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/yeralti/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `dungeon` | `yeralti-zindan` | Dungeon | `mesale`, `merdiven`, `merdiven-yuruyen`, `hazine` |
| `magara` | `yeralti-magara` | Mağara | `magara` |
| `magara-genis` | `yeralti-magara-genis` | Mağara (orta) | `magara` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/yeralti/<ad>.png`, çıktı `public/maps/yeralti/<ad>.webp`):

- `yeralti-magara-genis`
- `yeralti-magara`
- `yeralti-zindan`
- `yeralti-zindan-merdiven`
- `yeralti-zindan-hazine`
