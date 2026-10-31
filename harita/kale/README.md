<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Kale (`kale`)

Klasik kale, kale ve avlu, Kale Baskını seferi.

| Yol | İçerik |
|---|---|
| `<kimlik>.json` | Harita verisi (kural, zemin, varyantlar; kimlik = dosya adı, `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/kale/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<kimlik>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<kimlik>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<kimlik>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar:**

- `kale-avlu.json`: Kale ve avlu
- `kale-baskini.json`: Kale Baskını
- `kale.json`: Kale

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/kale/<ad>.png`, çıktı `public/maps/kale/<ad>.webp`):

- `kale-avlu`
- `kale-baskini`
- `kale-klasik`
- `kale-klasik-gece`
