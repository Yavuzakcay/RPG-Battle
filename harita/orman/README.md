<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Orman (`orman`)

Dere Kenarı (klasik orman: gündüz, gece), geniş Orman yolu, Kuyruk 23 Orman paketi: Heykel Gölü, Oduncu Kampı (31×17), Ork Kampı, Kemik Açıklığı (21×11; gündüz ve gece) ve Kuyruk 24 Heykel Mağarası (21×11, yeraltı, karanlık).

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
| `orman` | `orman-yol` | Dere Kenarı | `orman`, `gece` |
| `orman-heykel-golu` | `orman-heykel-golu` | Heykel Gölü | `gunduz`, `gece` |
| `orman-heykel-magarasi` | `orman-heykel-magarasi` | Heykel Mağarası | `karanlik` |
| `orman-kemik-acikligi` | `orman-kemik-acikligi` | Kemik Açıklığı | `gunduz`, `gece` |
| `orman-oduncu-kampi` | `orman-oduncu-kampi` | Oduncu Kampı | `gunduz`, `gece` |
| `orman-ork-kampi` | `orman-ork-kampi` | Ork Kampı | `gunduz`, `gece` |
| `orman-yolu` | `orman-genis-yol` | Orman yolu | `gunduz` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/orman/<ad>.png`, çıktı `public/maps/orman/<ad>.webp`):

- `orman-genis-yol`
- `orman-heykel-golu`
- `orman-heykel-golu-gece`
- `orman-heykel-magarasi`
- `orman-kemik-acikligi`
- `orman-kemik-acikligi-gece`
- `orman-oduncu-kampi`
- `orman-oduncu-kampi-gece`
- `orman-ork-kampi`
- `orman-ork-kampi-gece`
- `orman-yol`
- `orman-yol-gece`
