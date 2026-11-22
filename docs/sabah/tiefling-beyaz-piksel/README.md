# Tiefling beyaz benek: teşhis ve v2 yöntemiyle yeniden boyama (önizleme)

Oyuna bağlanmadı; `public/` ve `data/` değişmedi.

## Üretim

1. Oyundaki boyamanın birebir kopyası (`src/ui/tint.ts` yolu; `node_modules` gerekir):
   `npx vite-node scripts/tiefling-beyaz-oyun.ts <geçici-klasör>`
2. Sayım ve yeni boyama (yalnız bu klasöre yazar):
   `python scripts/tiefling-beyaz.py <geçici-klasör>`

## Benek tanımı

Ten bölgesi = oyun maskesi, iki kez kapanmış, kapalı delikleri doldurulmuş. Benek, bu bölgede boyamanın hiç değiştirmediği, açık (L* > 65), ten tonunda ya da renksiz piksellerden oluşan, en çok 12 px'lik ve çevresinin en az %75'i ten olan parça.
Diş, gözbebeği ışığı, ak kaş, göz akı ve beyaz boya/yara izi çevresi ten olmadığı ya da büyük olduğu için sayılmıyor; yeni boyama da bunları boyamıyor.

## Teşhis (oyundaki boyama)

- 288 Tiefling jetonu; 3 jetonda maske yok (`tiefling-erkek-druid-ID4`, `tiefling-erkek-sorcerer-SC-5`, `tiefling-kadin-druid-ID4`), sayılmadı.
- **Neden:** oyunun otomatik ten maskesi (`soy-renkleri.json` `tiefling.mask`: L* 12–85, kroma 15–70) en açık ten ışıklarını (L* > 85 ya da düşük kroma) dışarıda bırakıyor. Yüz, göğüs ve kollardaki ışık noktaları kırmızı-pembe/beyaz kalıyor; çevresi mavi ya da mora boyandığı için beyaz benek olarak görünüyor.
- Benek: **45 jetonda 340 piksel** (her soyda aynı; maske soydan bağımsız).

| Jeton (en çok 15) | Oyun | Yeni |
|---|---|---|
| `tiefling-erkek-barbarian-ID6` | 60 | 0 |
| `tiefling-erkek-fighter-ID4` | 34 | 0 |
| `tiefling-erkek-fighter-ID2` | 29 | 0 |
| `tiefling-kadin-monk-ID5` | 28 | 0 |
| `tiefling-erkek-sorcerer-SC-7` | 25 | 0 |
| `tiefling-erkek-fighter-ID1` | 22 | 0 |
| `tiefling-erkek-sorcerer-SC-3` | 15 | 0 |
| `tiefling-erkek-warlock-WL-8` | 10 | 0 |
| `tiefling-kadin-barbarian-ID5` | 10 | 0 |
| `tiefling-kadin-warlock-WL-11` | 10 | 0 |
| `tiefling-kadin-warlock-WL-9` | 9 | 0 |
| `tiefling-erkek-monk-ID5` | 8 | 0 |
| `tiefling-erkek-barbarian-GR` | 7 | 0 |
| `tiefling-erkek-fighter-ID8` | 6 | 0 |
| `tiefling-erkek-warlock-WL-5` | 6 | 0 |

## Yeni yöntem (Dragonborn v2 ile aynı çekirdek)

- Ten tonu jetonun kendi başından örnekleniyor: oyun maskesinin baştaki kısmı.
- Tona yakın pikseller (±28°) ve açık ışık noktaları aday; ardından 3×3 kapama, küçük ve yalnız ışıktan oluşan bileşenleri atma, ≤ 12 px kapalı delikleri doldurma. Oyun maskesi bilinen ten olarak birleştiriliyor; göz (doygun sıcak) hariç.
- Renk değişmiyor: oyunun lch formülü birebir (hedef ton/kroma, hueKeep, chromaKeep, dL). Fark yalnız maskede.

## Sonuç

| Soy | Oyun | Yeni |
|---|---|---|
| abyssal | 340 px / 45 jeton | 2 px / 1 jeton |
| chthonic | 340 px / 45 jeton | 0 px / 0 jeton |
| winged | 340 px / 45 jeton | 2 px / 2 jeton |

- Hedef 0'a çok yakın. Kalan 2 piksel Wizard WZ-B7'nin dişi (ağız çizgisi ince olduğu için çevresi ten sayılıyor); ten beneği değil.
- Bilgi için büyük açık alanlar (göz akı, diş, ak kaş, beyaz boya; boyanmıyor): oyun 2581 px, yeni 239 px (abyssal).

## 6 örnek (oyunda en çok beneği olan, farklı sınıflardan)

Her dosyada 3 soy × orijinal / oyun / oyun benekleri (kırmızı) / yeni / yeni benekleri.

- `ornek/erkek-barbarian-ID6.png`: oyun 60 → yeni 0 (abyssal)
- `ornek/erkek-fighter-ID4.png`: oyun 34 → yeni 0 (abyssal)
- `ornek/kadin-monk-ID5.png`: oyun 28 → yeni 0 (abyssal)
- `ornek/erkek-sorcerer-SC-7.png`: oyun 25 → yeni 0 (abyssal)
- `ornek/erkek-warlock-WL-8.png`: oyun 10 → yeni 0 (abyssal)
- `ornek/kadin-wizard-WZ-B7.png`: oyun 6 → yeni 2 (abyssal)

## Ayrı bir gözlem (ölçüte girmiyor)

Bazı jetonlarda (ör. erkek Fighter ID4, lav dövmeli) parlak, turuncuya kayan ten ışıkları (göğüs, omuz) ne oyunda ne yeni yöntemde boyanıyor; boyalı tenin üstünde kırmızı lekeler olarak kalıyor. Beyaz olmadıkları için bu sayıma girmiyorlar. Ton aralığı genişletilirse lav dövmeleri de boyanır; bu ayrı bir karar.
