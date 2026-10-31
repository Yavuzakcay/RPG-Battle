<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Volkan (`volkan`)

Klasik Volkan (boss: uyuyan ejderha) ve Volkan Seferi haritaları; ödül sahnesi volkan-hazine.

| Yol | İçerik |
|---|---|
| `<kimlik>.json` | Harita verisi (kural, zemin, varyantlar; kimlik = dosya adı, `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/volkan/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<kimlik>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<kimlik>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<kimlik>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar:**

- `isinlanma-salonu.json`: Işınlanma Salonu
- `kanyon-koprusu.json`: Kanyon Köprüsü
- `lav-tapinagi.json`: Lav Tapınağı
- `volkan.json`: Volkan
- `volkanik-demirhane.json`: Volkanik Demirhane

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/volkan/<ad>.png`, çıktı `public/maps/volkan/<ad>.webp`):

- `volkan-portal-salonu`
- `volkan-kopru`
- `volkan-tapinak`
- `volkan-boss`
- `volkan-demirhane`
- `volkan-hazine`
