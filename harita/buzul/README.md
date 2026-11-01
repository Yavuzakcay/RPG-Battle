<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Buzul (`buzul`)

Kuyruk 29 Buzul paketi: Karlı Kamp, Buzul Kayalıkları, Açık Buzul, Buz Tapınağı (21×11; gündüz ve gece).

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/buzul/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `buzul-acik` | `buzul-acik` | Açık Buzul | `gunduz`, `gece` |
| `buzul-kamp` | `buzul-kamp` | Karlı Kamp | `gunduz`, `gece` |
| `buzul-kayalik` | `buzul-kayalik` | Buzul Kayalıkları | `gunduz`, `gece` |
| `buzul-tapinak` | `buzul-tapinak` | Buz Tapınağı | `gunduz`, `gece` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/buzul/<ad>.png`, çıktı `public/maps/buzul/<ad>.webp`):

- `buzul-acik`
- `buzul-acik-gece`
- `buzul-kamp`
- `buzul-kamp-gece`
- `buzul-kayalik`
- `buzul-kayalik-gece`
- `buzul-tapinak`
- `buzul-tapinak-gece`
