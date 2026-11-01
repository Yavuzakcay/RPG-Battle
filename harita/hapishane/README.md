<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Hapishane Adası (`hapishane`)

Kuyruk 36: Hapishane Adası (Serüven, Büyük suç zinciri): Hücre Platformu, Dış Halka, Müdür Kulesi, İskele. 21×11, tek loş varyant (mavi fenerli karanlık); seçicide gizli. Görseller harita/hapishane/gorsel/; zemin görsellerden okundu.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/hapishane/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `hapishane-dis-halka` | `hapishane-dis-halka` | Dış Halka | `los` |
| `hapishane-hucre-platformu` | `hapishane-hucre-platformu` | Hücre Platformu | `los` |
| `hapishane-iskele` | `hapishane-iskele` | İskele | `los` |
| `hapishane-mudur-kulesi` | `hapishane-mudur-kulesi` | Müdür Kulesi | `los` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/hapishane/<ad>.png`, çıktı `public/maps/hapishane/<ad>.webp`):

- `hapishane-dis-halka`
- `hapishane-hucre-platformu`
- `hapishane-iskele`
- `hapishane-mudur-kulesi`
