# Bölgeler arası yollar (K49 C5)

`python scripts/k49-bolge-yollari.py` üretir. Komşu bölge çiftleri `komsuluk-grafi.json` kenarlarından; temsilci yerleşimler betikteki `TEMSILCI` tablosunda. A* yürüme ızgarasında (maliyet birimi: hücre × ızgara değeri; 10 yol, 20 çim, 52 orman, 80 dağ), geçit kapılarından geçerek. "Yol ağı" mevcut `yol-katmani.json` çizgileri üstündeki en kısa uzunluk (px). Zayıf: yol ağıyla bağlı değil, yol ağı / A* uzunluğu > 1.6 ya da en ucuz yürüyüşün yol hücresi oranı < 0.5 (pahalı arazi).

| Çift | Geçit | A* maliyeti önce | sonra | A* uzunluğu (px) | Yol oranı önce | sonra | Yol ağı önce (px) | sonra | Durum |
|---|---|---|---|---|---|---|---|---|---|
| buzul – dag | kuzey gecidi (donmus yol) | 3175 | 1406 | 4553 | 36% | 100% | 1216 | 1226 | yol eklendi |
| buzul – dag | kale gecidi (kale kapisi ve kar yolu) | 547 | 433 | 1386 | 83% | 100% | 1216 | 1226 | zaten iyi |
| dag – bati_kiyi | dag patikasi (batiya inen yol) | 1447 | 1447 | 4632 | 100% | 100% | 4452 | 4452 | zaten iyi |
| dag – orman | vadi patikasi (nehir vadisi) | 1646 | 1646 | 3654 | 65% | 65% | 4761 | 4761 | zaten iyi |
| orman – bati_kiyi | orman yolu ve nehir (guney) | 524 | 524 | 1675 | 100% | 100% | 1633 | 1633 | zaten iyi |
| orman – bataklik | ciftlik yolu (bataklik kenari) | 692 | 692 | 2214 | 100% | 100% | 2155 | 2155 | zaten iyi |
| orman – buzul | orman ucurum koprusu | 2095 | 1890 | 5077 | 88% | 94% | 4959 | 4969 | zaten iyi |
| orman – col | nehir koprusu, Oduncu kampi, kumullar (iki parca) | 2172 | 2172 | 4488 | 66% | 66% | 5522 | 5522 | zaten iyi |
| buzul – col | kar yolu (Ork koyunden cole) | 1438 | 1316 | 2971 | 70% | 79% | 2841 | 2851 | zaten iyi |
| bataklik – kral_kalesi_yarimadasi | kanal kapisi | 822 | 822 | 2052 | 75% | 75% | 1605 | 1605 | zaten iyi |
| bati_kiyi – bati_liman | kiyi yolu (Beyaz Sehir - Liman) | 638 | 638 | 1905 | 94% | 94% | 1720 | 1720 | zaten iyi |
| bati_liman – orman | liman-elf sehri yolu | 699 | 699 | 2148 | 97% | 97% | 1978 | 1978 | zaten iyi |
| bati_liman – kral_kalesi_yarimadasi | kiyi yolu (Liman - Kral Kalesi, Hobbit koyu uzerinden) | 1165 | 1165 | 3455 | 93% | 93% | 2987 | 2987 | zaten iyi |

Eklenen yol: 1 (k49-buzul-dag-1). Görüntüleyicide `patika` türü ince çizgiyle çizilir.
