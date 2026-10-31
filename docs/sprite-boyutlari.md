# Sprite ve görsel boyutları

Kuyruk 14 SP1. Ölçüm `public/` altındaki dosyalardan (sharp ile), 2026-10-31.

## Mevcut görseller

| Klasör | Adet | Boyut (px) | Not |
|---|---:|---|---|
| `public/characters/` | 240 | 256×256 | oyuncu jetonları (pixel-art) |
| `public/characters/kucuk/` | 240 | 96×96 | rozet kopyaları (`npm run karakter-kucuk`) |
| `public/monsters/` | 352 | 256×256 | canavar jetonları (+ `-uyku` görselleri) |
| `public/masumlar/` | 8 | 128×128 | masum jetonları |
| `public/efektler/` | 13 | kare 128 (ya da 160) yükseklik, yatay şerit (768–1280 en) | hasar/durum döngüleri; kare sayısı `data/efekt-sprites.json` |
| `public/zarlar/klasik/` | 7 | 128×128 | zar yüzleri |
| `public/ikon/` | 1 | 180×180 | apple-touch-icon |
| `public/maps/` | 25 | 1280×715 (Klasik 15×7), 2616×1668 (31×17), 1781×1096 (21×11) | harita arka planları |

## Harita ölçüsü (dünya pikseli)

- Altıgen yarıçapı S = 1280 / 23 ≈ 55,7; altıgen eni 2S ≈ 111, boyu ≈ 95 (`src/ui/mapView.ts`).
- Jeton ekranda altıgenin ≈ %80'i (ölçeği `data/token-sizes.json`).

## Yeni sprite hedefleri (`npm run sprite-ice`)

| Ön ek | Hedef (en uzun kenar) | Çizim | Örnek ad |
|---|---|---|---|
| `yuzey-` | 128 px | altıgenden biraz büyük (ölçek `data/sprite-esleme.json`, varsayılan 1,15) ki komşu yamalar birleşsin | `yuzey-ag`, `yuzey-ag-2`, `yuzey-sis`, `yuzey-gres-1` |
| `nesne-` | 96 px | altıgen içinde, ≈ jeton boyu | `nesne-varil`, `nesne-barut-varili` |
| diğer | 128 px (`--boyut N`) | — | — |

- Küçültme yalnızca en yakın komşu (bulanıklık yok); kaynak hedeften küçükse büyütülmez, uyarı verilir.
- `-n` son eki varyanttır (`yuzey-ag-2`); altıgen başına varyant sütun/satırdan deterministik seçilir.
- Kaynaklar `assets-ham/sprite/` (Gemini çıktısı, #00FF00 ya da soluk yeşil zemin, JPG/PNG).
