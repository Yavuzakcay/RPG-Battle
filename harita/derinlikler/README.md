<!-- npm run varlik-indeks üretir (Kuyruk 19 D3/19C); elle düzenlemeyin, harita/_ortak/harita-bolgeleri.json'u düzenleyin. -->
# Derinlikler (`derinlikler`)

Kuyruk 21: Derinlikler yeraltı seferi (dallanan): Mağara Karakolu, Mezar Labirenti, Mantar Mağarası, Lav Salonu; zemin `npm run harita-zemin` + duzeltme/. Planlananlar henüz kaydı olmayan adlar.

| Yol | İçerik |
|---|---|
| `<ad>.json` | Harita verisi (kural, zemin, varyantlar; dosya adı = ad tabanı, kimlik JSON'un `id` alanında; `bolge` = bu klasör). |
| `gorsel/<ad>.jpg` | Kaynak görseller (tam üstten çizilmiş; `npm run harita-gorsel -- <kimlik>` ortadan kırpıp `public/maps/derinlikler/<ad>.webp` üretir). `*-ornek.jpg`: eski örnekler (işlem hattı kullanmaz). |
| `onizleme/<ad>-izgara.png`, `-izgarasiz.png` | Üretilen önizlemeler (`npm run harita-referans`). |
| `prompt/<ad>.md` | Gemini prompt'ları (`npm run harita-referans`). |
| `duzeltme/<ad>.json` | Elle zemin düzeltmeleri (K20 aracı için; şimdilik yok). |

**Haritalar (kimlik → ad):** bir haritanın bütün dosyaları ad tabanını taşır (`<ad>.json`, `gorsel/<ad>.jpg`, `onizleme/<ad>-izgara.png`, `prompt/<ad>.md`, `duzeltme/<ad>.json`); kimlik JSON'un `id` alanında kalır.

| Kimlik | Ad (dosya tabanı) | Harita | Varyant |
|---|---|---|---|
| `derinlikler-lav-salonu` | `derinlikler-lav-salonu` | Lav Salonu | `varsayilan` |
| `derinlikler-magara-karakol` | `derinlikler-magara-karakol` | Mağara Karakolu | `varsayilan` |
| `derinlikler-mantar-magarasi` | `derinlikler-mantar-magarasi` | Mantar Mağarası | `varsayilan` |
| `derinlikler-mezar-labirenti` | `derinlikler-mezar-labirenti` | Mezar Labirenti | `varsayilan` |

**Görsel adları** (kaynak `gorsel/<ad>.jpg`, ham `assets-ham/harita/derinlikler/<ad>.png`, çıktı `public/maps/derinlikler/<ad>.webp`):

- `derinlikler-lav-salonu`
- `derinlikler-magara-karakol`
- `derinlikler-mantar-magarasi`
- `derinlikler-mezar-labirenti`
- `derinlikler-hazine-odasi`
- `derinlikler-tuzakli-salon`
