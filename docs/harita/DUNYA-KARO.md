# Dünya haritası karoları (K45)

Kaynak `assets-ham/harita/dunya/dunya-final-v47.png` (13704×5998, ~49 MB) depoya girmez (`assets-ham/` `.gitignore`'da). Karoları yerelde üretip yalnızca çıktıyı (`public/maps/dunya/`, WebP) commit edin. Git LFS yok.

## Çalıştırma (PowerShell)

```powershell
npm install
# sharp kurulum betiği engellendiyse (npm 11 "install-scripts" uyarısı):
npm install-scripts approve sharp
npm rebuild sharp

npm run harita-karo                 # assets-ham/harita/dunya/dunya-final-v47.png → public/maps/dunya/
npm run harita-karo -- --dogrula    # 20 rastgele karoyu kaynaktan kesip kıyaslar + yeniden üretip bayt eşitliğine bakar
git add public/maps/dunya
git commit -m "K45: dünya haritası karoları (v47)"
```

Başka kaynak/klasör: `npm run harita-karo -- --kaynak <png> --cikti <klasör> [--kalite 80]`. Kaynak gerekmeyen kendi kendini sınama: `npm run harita-karo -- --oz-test`.

## Çıktı

- `public/maps/dunya/{z}/{x}/{y}.webp`: 512 px karo, WebP kalite 80, 6 zoom (z0 tüm harita ≈429×188, z5 1:1), kenar karoları kısmi boyutta.
- `public/maps/dunya/manifest.json`: tuval boyu, karo boyu, zoom başına boyut/sütun/satır, kaynak SHA-256 ve bayt, karo sayısı, toplam ve ilk yükleme (z0–z2) baytı.
- Beklenen karo sayısı (13704×5998): z0 1, z1 2, z2 4×2, z3 7×3, z4 14×6, z5 27×12 → 441.

## Bellek ve belirlenirlik

libvips Deep Zoom yazıcısı kaynağı akışla okur (`sequentialRead`, `limitInputPixels: false`); 82 MP görsel tek seferde açılmaz, 4 GB altı RAM'de çalışır. Aynı kaynak ve ayarla çıktı bayt bayt aynıdır (`--dogrula` denetler). Yollar `path.join` ile; Windows ve Linux aynı.
