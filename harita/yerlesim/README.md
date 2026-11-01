<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Yerleşimler (`yerlesim`)

Kuyruk 34a: yerleşim savaş haritaları (Kral Kalesi önü, avlusu ve taht salonu; kasaba hanı; Beyaz Şehir dış kapısı ve saray avlusu). 21×11 (taht salonu 15×7, tek iç mekân), gündüz ve gece. Serüven yerleşim düğümleri K34b'de bağlanacak.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/yerlesim/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `beyaz-sehir-dis-kapi` | `beyaz-sehir-dis-kapi` | Beyaz Şehir Kapısı | `gunduz`, `gece` |
| `beyaz-sehir-saray-avlusu` | `beyaz-sehir-saray-avlusu` | Saray Avlusu | `gunduz`, `gece` |
| `kale-ic-avlu` | `kale-avlu` | Kale Avlusu | `gunduz`, `gece` |
| `kale-onu` | `kale-onu` | Kale Önü | `gunduz`, `gece` |
| `kale-taht-salonu` | `kale-taht-salonu` | Taht Salonu | `ic-mekan` |
| `kasaba-demirci-tapinak` | `kasaba-demirci-tapinak` | Demirci ve Tapınak | `gunduz`, `gece` |
| `kasaba-han` | `kasaba-han` | Kasaba Hanı | `gunduz`, `gece` |
| `kasaba-lagim` | `kasaba-lagim` | Kasaba Lağımı | `karanlik` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/yerlesim/<ad>.png`, çıktı `public/maps/yerlesim/<ad>.webp`):

- `beyaz-sehir-dis-kapi`
- `beyaz-sehir-dis-kapi-gece`
- `beyaz-sehir-saray-avlusu`
- `beyaz-sehir-saray-avlusu-gece`
- `kale-avlu`
- `kale-avlu-gece`
- `kale-onu`
- `kale-onu-gece`
- `kale-taht-salonu`
- `kasaba-demirci-tapinak`
- `kasaba-demirci-tapinak-gece`
- `kasaba-han`
- `kasaba-han-gece`
- `kasaba-lagim`
