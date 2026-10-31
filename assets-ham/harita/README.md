<!-- npm run varlik-indeks üretir (Kuyruk 19 D3); elle düzenlemeyin, data/harita-bolgeleri.json'u düzenleyin. -->
# Harita ham görselleri

Gemini (ya da başka araç) çıktıları **bölge klasörüne**, görselin adıyla: `assets-ham/harita/<bolge>/<bolge>-<ad>.png` (ya da .jpg/.jpeg/.webp). Ad kuralı: küçük harf, tire, yalnızca ASCII. Ad haritanın kaydındaki `gorsel` alanıdır (kimlik değil); çok varyantlı haritada `<gorsel>-<varyant>`. Bütün adlar ve durumları: `docs/VARLIK-HARITASI.md`.

```powershell
npm run harita-gorsel -- <kimlik> [<kimlik> ...]
```

Boyut ve en-boy oranı denetlenir, görsel `public/maps/<bolge>/<ad>.webp` olarak WebP'ye çevrilir. Ham görsel yoksa `docs/harita/referans/<bolge>/<ad>.jpg` (tam üstten çizilmiş referans) ortadan kırpılarak kullanılır; ikisi de yoksa yer tutucu yazılır. Hedef boyutlar, hizalama ve prompt'lar: `docs/harita/gorsel-sartnamesi.md`.

Bölgeler: `bataklik`, `col`, `dag`, `deniz`, `kale`, `orman`, `sehir`, `yeralti`, `volkan`, `vitrin`, `derinlikler`.
