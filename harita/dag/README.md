<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Dağ (`dag`)

Klasik dağ geçidi (yaz, kış) ve Kuyruk 29 Dağ paketi: Geçit Karakolu, Yüksek Kayalıklar, Uçurum Köprüsü, Sessiz Nöbetçi (21×11; gündüz ve gece).

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/dag/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `dag` | `dag-klasik` | Dağ | `yaz`, `kis` |
| `dag-karakol` | `dag-karakol` | Geçit Karakolu | `gunduz`, `gece` |
| `dag-kayalik` | `dag-kayalik` | Yüksek Kayalıklar | `gunduz`, `gece` |
| `dag-kopru` | `dag-kopru` | Uçurum Köprüsü | `gunduz`, `gece` |
| `dag-nobetci` | `dag-nobetci` | Sessiz Nöbetçi | `gunduz`, `gece` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/dag/<ad>.png`, çıktı `public/maps/dag/<ad>.webp`):

- `dag-karakol`
- `dag-karakol-gece`
- `dag-kayalik`
- `dag-kayalik-gece`
- `dag-klasik`
- `dag-klasik-kis`
- `dag-kopru`
- `dag-kopru-gece`
- `dag-nobetci`
- `dag-nobetci-gece`
