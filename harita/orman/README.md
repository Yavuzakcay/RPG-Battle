<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Orman (`orman`)

Klasik orman (gündüz, gece) ve geniş orman yolu.

| Yol | İçerik |
|---|---|
| `<kimlik>.json` | Harita verisi (kural, zemin, varyantlar; kimlik = dosya adı, `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/orman/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<kimlik>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<kimlik>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<kimlik>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar:**

- `orman-yolu.json`: Orman yolu
- `orman.json`: Orman

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/orman/<ad>.png`, çıktı `public/maps/orman/<ad>.webp`):

- `orman-yol`
- `orman-klasik`
- `orman-klasik-gece`
