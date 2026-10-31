<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Orman (`orman`)

Klasik orman (gündüz, gece) ve geniş orman yolu.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/orman/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `orman` | `orman-klasik` | Orman | `orman`, `gece` |
| `orman-yolu` | `orman-yol` | Orman yolu | `gunduz` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/orman/<ad>.png`, çıktı `public/maps/orman/<ad>.webp`):

- `orman-klasik`
- `orman-klasik-gece`
- `orman-yol`
