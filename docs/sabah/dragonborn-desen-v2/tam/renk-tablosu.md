# Dragonborn renk tablosu: önce / sonra (v2, oyuna bağlanmadı)

Bu adımda hiçbir tablo değişmedi: `data/soy-renkleri.json` aynı. "Sonra", önizlemede kullanılan ve onay bekleyen değerler.
v2 boyamasında renk yalnız **orta** tondan gelir (ton + doygunluk; parlaklık jetonun kendi gölgesinden). Açık ve koyu tonlar v2'de kullanılmıyor; pul dokusu ±5 L* oynamasından geliyor. Tablo kayıt için tam verildi.

## Önce / sonra (açık / orta / koyu)

Önce: ilk verilen başlangıç değerleri. Sonra: mavi referansın aralığıyla eşitlenmiş değerler (kalın = değişen). Mavi #315C83 ve Beyaz #C8CFD9 pul (orta) tonları senin değerin; Kırmızı açık ton #E86343 (eşitlenmiş), Kırmızı orta ve koyu sabit.

| Soy | Önce | Sonra |
|---|---|---|
| Siyah (black) | #5C5C68 / #3A3A44 / #1E1E25 | **#70707B** / #3A3A44 / **#13131D** |
| Mavi (blue) | #6698B8 / #315C83 / #112F56 | #6698B8 / #315C83 / #112F56 |
| Pirinç (brass) | #D0B25C / #A88A3C / #5E4A1C | **#EAC776** / #A88A3C / **#755C06** |
| Bronz (bronze) | #B8814A / #8C5A2B / #4A2D12 | **#CD9462** / #8C5A2B / **#593001** |
| Bakır (copper) | #CC7440 / #A24E24 / #5A2810 | **#E6885A** / #A24E24 / **#692500** |
| Altın (gold) | #E8C85A / #C9A030 / #7A5E14 | **#FFD268** / #C9A030 / **#927100** |
| Yeşil (green) | #58A862 / #2F7A3A / #17421E | **#6DB772** / #2F7A3A / **#014B17** |
| Kırmızı (red) | #D4412B / #A91101 / #5A0B02 | **#E86343** / #A91101 / #5A0B02 |
| Gümüş (silver) | #C0CAD4 / #8E9AA6 / #4E5964 | **#CCD8E5** / #8E9AA6 / **#5F6B77** |
| Beyaz (white) | #F0F4F8 / #C8CFD9 / #7C8696 | **#EFF6FF** / #C8CFD9 / **#969DA7** |

## Oyundaki tabloyla çelişenler (ayrı liste; değiştirilmedi)

Oyunda beyaz taban Dragonborn jetonları `data/soy-renkleri.json` `dragonborn.lineagesAlt.<soy>.multiply.renk` çarpma rengiyle boyanıyor. Çarpma rengi açık bir tene çarpıldığı için açıklığı yüksek; karşılaştırma ton (h) ve kroma (C) üzerinden.

| Soy | Sonra (orta) | Oyun çarpma rengi | Ton farkı | Durum |
|---|---|---|---|---|
| Siyah (black) | #3A3A44 (h 292, C 7) | #5b606e (h 279, C 9) | 13° | hafif fark: oyundaki daha mavimsi gri |
| Mavi (blue) | #315C83 (h 265, C 26) | #5f84e8 (h 287, C 57) | 22° | **çelişiyor**: oyunda canlı mor-mavi, kroma iki katı; kanat paleti de #7c9aec |
| Pirinç (brass) | #A88A3C (h 87, C 45) | #d9b25a (h 85, C 50) | 2° | uyumlu |
| Bronz (bronze) | #8C5A2B (h 65, C 38) | #b07a48 (h 66, C 39) | 1° | uyumlu |
| Bakır (copper) | #A24E24 (h 51, C 51) | #df7f58 (h 48, C 50) | 3° | uyumlu |
| Altın (gold) | #C9A030 (h 86, C 61) | #f6cc3c (h 89, C 72) | 3° | uyumlu |
| Yeşil (green) | #2F7A3A (h 143, C 47) | #58b068 (h 146, C 51) | 2° | uyumlu |
| Kırmızı (red) | #A91101 (h 41, C 75) | #e4524c (h 31, C 66) | 10° | hafif fark: oyundaki daha mercan/kiremit |
| Gümüş (silver) | #8E9AA6 (h 257, C 8) | #c4cad6 (h 272, C 7) | 15° | hafif fark: oyundaki daha mavimsi |
| Beyaz (white) | #C8CFD9 (h 265, C 6) | #ffffff (h 297, C 0) | 31° | **çelişiyor**: oyunda Beyaz soy boyanmıyor (#ffffff); v2 gri-mavi pul tonu verir |

Çelişen: **Mavi**, **Beyaz**. Hafif fark: Kırmızı, Siyah, Gümüş. Uyumlu: Pirinç, Bronz, Bakır, Altın, Yeşil.
