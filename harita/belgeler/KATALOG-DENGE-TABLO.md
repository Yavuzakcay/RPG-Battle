# KATALOG-DENGE-TABLO: katalog yaratıkları ve DMG CR tablosu

Üretici: `node scripts/katalog-denge-tablo.mjs` (elle düzenlenmez). CSV: `harita/belgeler/KATALOG-DENGE-TABLO.csv`. Canavar verisi değiştirilmedi.

- **Kapsam:** 54 kayıt: 30 Mühür Ruhu (`data/bosslar-muhur.json`) + 24 kadim ve mücevher kaydı (`data/canavarlar-kadim.json`; Dungeondex'te gizli varyantlar dahil).
- **DMG tablosu:** D&D 5e *Dungeon Master's Guide* (2014), Bölüm 9 "Creating a Monster", **"Monster Statistics by Challenge Rating"** (s. 274); Legendary Resistance etkin HP eki "Monster Features" tablosundan (s. 280–281). Değerler `data/dmg-cr-tablosu.json`'da. SRD 5.2.1'de bu tablo yok. Oyunun özel canavar tahmini (`data/cr-tahmini.json`) basitleştirilmiş ve CR 20 üstünde farklı olduğu için kullanılmadı.
- **Tablo dışı:** DMG tablosu CR 30'da biter. CR 30'un üstündekiler (dragon-of-hexonia-a CR 40, dragon-of-hexonia-b CR 40, kozmik-anka CR 32, kozmik-anka-savas CR 32, titan-of-nightmare CR 35) için DMG sütunları ve etkin CR "tablo dışı"; yalnız gerçek değerler var. Captive Dragon (`tutsak-dragon`) ve Ocean-Nightmare'in iki kaydı veride **CR 30** olduğundan tabloyla karşılaştırıldı.
- **Yöntem (yaklaşık):**
  - **Etkin HP:** HP + Legendary Resistance (kullanım başına CR 1–4: 10, 5–10: 20, 11–16: 30, 17+: 45) + Faz 2 geçici canı. Tek element bağışıklığı ve zayıflık etkin HP'ye katılmadı.
  - **Savunma CR'si:** etkin HP'nin satırı, AC farkının her 2 puanı 1 basamak.
  - **Tur hasarı (3 tur ortalaması):** 1. tur en güçlü alan/nefes saldırısı 2 hedefe (başarısız save, tam hasar) ya da çoklu saldırı, hangisi büyükse; 2–3. tur çoklu saldırı. Saldırı ekleri (`riders.extra`) dahil. Her tura efsanevi eylemler eklenir (puan kadar eylem, her eylem bir kez, en güçlüler; alanlı efsanevi eylem 2 hedef).
  - **Saldırı CR'si:** tur hasarının satırı, saldırı bonusu farkının her 2 puanı 1 basamak (yakın saldırısı olmayan kayıtta kurtarma DC'si).
  - **Etkin CR:** savunma ve saldırı CR'sinin ortalamasına en yakın basamak. "+" ve "(tavan)": değer CR 30 satırını aştı.
- **Fark sütunları:** HP ve tur hasarı için "bantta" ya da bandın kaç puan altında/üstünde olduğu; AC, saldırı bonusu ve DC için kayıt − DMG.

## A. Kimlik ve savunma

| id | kademe/evre | CR | boyut | hız (ft) | AC | HP | bağışıklık | direnç | zayıflık | DMG AC | DMG HP | AC farkı | HP farkı | LR | etkin HP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cim | Sv.1 (ates) | 3 | S | 40 | 14 | 75 | ateş | — | soğuk | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| cimbom | Sv.2 (ates) | 10 | L | 50 | 17 | 190 | ateş | — | soğuk | 17 | 206–220 | 0 | -16 (altında) | — | 190 |
| cimbombom | Sv.3 (ates) | 26 | H | 50 | 19 | 627 | ateş | — | soğuk | 19 | 626–670 | 0 | bantta | 3 | 762 |
| doggie | Sv.1 (soguk) | 2 | S | 40 | 13 | 60 | soğuk | — | ateş | 13 | 86–100 | 0 | -26 (altında) | — | 60 |
| wolfie | Sv.2 (soguk) | 8 | L | 50 | 16 | 150 | soğuk | — | ateş | 16 | 176–190 | 0 | -26 (altında) | — | 150 |
| wolfgang | Sv.3 (soguk) | 20 | H | 50 | 19 | 319 | soğuk | — | ateş | 19 | 356–400 | 0 | -37 (altında) | 3 | 454 |
| sparkle | Sv.1 (yildirim) | 2 | S | 60 | 13 | 60 | yıldırım | — | — | 13 | 86–100 | 0 | -26 (altında) | — | 60 |
| thunderse | Sv.2 (yildirim) | 8 | L | 70 | 16 | 150 | yıldırım | — | — | 16 | 176–190 | 0 | -26 (altında) | — | 150 |
| stormer | Sv.3 (yildirim) | 21 | L | 90 | 19 | 338 | yıldırım | — | — | 19 | 401–445 | 0 | -63 (altında) | 3 | 515 |
| twinkle | Sv.1 (gurultu) | 3 | S | 25 | 14 | 75 | gök gürültüsü | — | yıldırım | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| gongi | Sv.2 (gurultu) | 9 | L | 30 | 16 | 170 | gök gürültüsü | — | yıldırım | 16 | 191–205 | 0 | -21 (altında) | — | 170 |
| gongar | Sv.3 (gurultu) | 23 | H | 30 | 20 | 465 | gök gürültüsü | — | yıldırım | 19 | 491–535 | +1 | -26 (altında) | 3 | 600 |
| hydrop | Sv.1 (asit) | 2 | S | 20 / yüzme 30 | 13 | 60 | asit | — | ateş | 13 | 86–100 | 0 | -26 (altında) | — | 60 |
| hydras | Sv.2 (asit) | 8 | L | 30 / yüzme 40 | 16 | 150 | asit | — | ateş | 16 | 176–190 | 0 | -26 (altında) | — | 150 |
| hydraxe | Sv.3 (asit) | 22 | H | 30 / yüzme 40 | 19 | 419 | asit | — | ateş | 19 | 446–490 | 0 | -27 (altında) | 3 | 554 |
| sporlet | Sv.1 (zehir) | 2 | S | 10 / uçuş 30 | 13 | 60 | zehir | — | ışıl | 13 | 86–100 | 0 | -26 (altında) | — | 60 |
| mothcoon | Sv.2 (zehir) | 8 | L | 20 / uçuş 50 | 16 | 150 | zehir | — | ışıl | 16 | 176–190 | 0 | -26 (altında) | — | 150 |
| mothraq | Sv.3 (zehir) | 22 | H | 20 / uçuş 60 | 19 | 421 | zehir | — | ışıl | 19 | 446–490 | 0 | -25 (altında) | 3 | 556 |
| lumbo | Sv.1 (isilti) | 3 | S | 40 | 14 | 75 | ışıl | — | nekrotik | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| lighty | Sv.2 (isilti) | 9 | L | 50 | 16 | 170 | ışıl | — | nekrotik | 16 | 191–205 | 0 | -21 (altında) | — | 170 |
| lightaur | Sv.3 (isilti) | 23 | L | 50 | 19 | 432 | ışıl | — | nekrotik | 19 | 491–535 | 0 | -59 (altında) | 3 | 567 |
| cerbit | Sv.1 (nekrotik) | 3 | S | 40 | 14 | 75 | nekrotik | — | ışıl | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| cerbedo | Sv.2 (nekrotik) | 9 | L | 50 | 16 | 170 | nekrotik | — | ışıl | 16 | 191–205 | 0 | -21 (altında) | — | 170 |
| cerbones | Sv.3 (nekrotik) | 24 | H | 50 | 19 | 527 | nekrotik | — | ışıl | 19 | 536–580 | 0 | -9 (altında) | 3 | 662 |
| mirit | Sv.1 (psisik) | 3 | S | 35 | 14 | 75 | psişik | — | kuvvet | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| mirath | Sv.2 (psisik) | 9 | M | 40 | 16 | 170 | psişik | — | kuvvet | 16 | 191–205 | 0 | -21 (altında) | — | 170 |
| mirage | Sv.3 (psisik) | 24 | M | 40 | 19 | 525 | psişik | — | kuvvet | 19 | 536–580 | 0 | -11 (altında) | 3 | 660 |
| kongcuk | Sv.1 (kuvvet) | 3 | S | 30 | 14 | 75 | kuvvet | — | psişik | 13 | 101–115 | +1 | -26 (altında) | — | 75 |
| kongilla | Sv.2 (kuvvet) | 9 | L | 40 | 16 | 170 | kuvvet | — | psişik | 16 | 191–205 | 0 | -21 (altında) | — | 170 |
| kongark | Sv.3 (kuvvet) | 25 | H | 40 | 19 | 578 | kuvvet | — | psişik | 19 | 581–625 | 0 | -3 (altında) | 3 | 713 |
| tutsak-dragon | — | 30 | G | 50 / uçuş 100 / yüzme 50 | 24 | 697 | kuvvet, gök gürültüsü | ateş, soğuk, yıldırım, nekrotik | — | 19 | 806–850 | +5 | -109 (altında) | 4 | 877 |
| dragon-of-hexonia-a | — | 40 | G | 80 / uçuş 200 / yüzme 100 | 30 | 2500 | asit, soğuk, ateş, kuvvet, yıldırım, nekrotik, zehir, psişik, ışıl, gök gürültüsü | — | — | tablo dışı | tablo dışı | — | — | 6 | 2500 |
| dragon-of-hexonia-b | — | 40 | G | 80 / uçuş 200 / yüzme 100 | 30 | 2500 | asit, soğuk, ateş, kuvvet, yıldırım, nekrotik, zehir, psişik, ışıl, gök gürültüsü | — | — | tablo dışı | tablo dışı | — | — | 6 | 2500 |
| kozmik-anka | — | 32 | H | 40 / uçuş 150 | 26 | 780 | ateş, ışıl, nekrotik, psişik | — | — | tablo dışı | tablo dışı | — | — | 4 | 1230 |
| kozmik-anka-savas | — | 32 | H | 40 / uçuş 150 | 26 | 780 | ateş, ışıl, nekrotik, psişik | — | — | tablo dışı | tablo dışı | — | — | 4 | 1230 |
| ember-egg | — | 0 | M | 0 | 22 | 150 | ateş, ışıl | — | — | 13 | 1–6 | +9 | +144 (üstünde) | — | 150 |
| ocean-nightmare | — | 30 | G | 30 / yüzme 100 | 24 | 700 | soğuk, yıldırım | gök gürültüsü, ateş | — | 19 | 806–850 | +5 | -106 (altında) | 3 | 835 |
| ocean-nightmare-open-sea | — | 30 | G | 30 / yüzme 100 | 24 | 600 | soğuk, yıldırım | gök gürültüsü, ateş | — | 19 | 806–850 | +5 | -206 (altında) | 3 | 735 |
| titan-of-nightmare | — | 35 | G | 40 / uçuş 60 / yüzme 120 | 26 | 1150 | yıldırım, psişik, asit, soğuk | kuvvet, nekrotik, gök gürültüsü | — | tablo dışı | tablo dışı | — | — | 5 | 1150 |
| alphlet | Yavru (Alfa) | 7 | M | 20 / yüzme 60 | 17 | 155 | gök gürültüsü | — | — | 15 | 161–175 | +2 | -6 (altında) | — | 155 |
| alphyr | Genç (Alfa) | 19 | L | 30 / yüzme 80 | 20 | 310 | gök gürültüsü | — | — | 19 | 341–355 | +1 | -31 (altında) | — | 310 |
| alphadrake | Yetişkin (Alfa) | 28 | H | 30 / yüzme 90 | 24 | 585 | gök gürültüsü | — | — | 19 | 716–760 | +5 | -131 (altında) | — | 585 |
| omeglet | Yavru (Omega) | 6 | M | 40 | 16 | 135 | nekrotik | — | — | 15 | 146–160 | +1 | -11 (altında) | — | 135 |
| omegyr | Genç (Omega) | 17 | L | 40 | 19 | 265 | nekrotik | — | — | 19 | 311–325 | 0 | -46 (altında) | — | 265 |
| omegadrake | Yetişkin (Omega) | 26 | H | 50 | 23 | 515 | nekrotik | — | — | 19 | 626–670 | +4 | -111 (altında) | — | 515 |
| deltlet | Yavru (Delta) | 6 | M | 30 / uçuş 60 | 17 | 140 | psişik | — | — | 15 | 146–160 | +2 | -6 (altında) | — | 140 |
| deltyr | Genç (Delta) | 18 | L | 30 / uçuş 80 | 20 | 285 | psişik | — | — | 19 | 326–340 | +1 | -41 (altında) | — | 285 |
| deltadrake | Yetişkin (Delta) | 27 | H | 30 / uçuş 100 | 23 | 545 | psişik | — | — | 19 | 671–715 | +4 | -126 (altında) | — | 545 |
| sigmlet | Yavru (Sigma) | 5 | M | 30 / uçuş 60 | 16 | 120 | ışıl | — | — | 15 | 131–145 | +1 | -11 (altında) | — | 120 |
| sigmyr | Genç (Sigma) | 16 | L | 40 / uçuş 80 | 19 | 240 | ışıl | — | — | 18 | 296–310 | +1 | -56 (altında) | — | 240 |
| sigmadrake | Yetişkin (Sigma) | 25 | H | 40 / uçuş 80 | 22 | 480 | ışıl | — | — | 19 | 581–625 | +3 | -101 (altında) | — | 480 |
| gamlet | Yavru (Gamma) | 8 | M | 30 / uçuş 60 | 18 | 175 | kuvvet | — | — | 16 | 176–190 | +2 | -1 (altında) | — | 175 |
| gammyr | Genç (Gamma) | 20 | L | 40 / uçuş 80 | 21 | 340 | kuvvet | — | — | 19 | 356–400 | +2 | -16 (altında) | — | 340 |
| gammadrake | Yetişkin (Gamma) | 30 | H | 40 / uçuş 80 | 25 | 650 | kuvvet | — | — | 19 | 806–850 | +6 | -156 (altında) | — | 650 |

## B. Saldırı ve etkin CR

| id | CR | çoklu saldırı | ort. | bonus | DMG bonus | en güçlü alan (ort., DC) | DMG DC | DC farkı | efsanevi | 3 tur ort. | DMG tur hasarı | fark | Faz 2 | savunma CR | saldırı CR | etkin CR |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cim | 3 | Bite×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| cimbom | 10 | Bite×2 | 57 | +8 | +7 | Lesser Hellfire Roar: 18 (DC 16) | 16 | 0 | — | 57 | 63–68 | -6 (altında) | — | 8 | 9 | 8 |
| cimbombom | 26 | Bite + Claw×2 | 173 | +12 | +12 | Hellfire Roar: 105 (DC 21) | 21 | 0 | 3 eylem, 3 puan/tur (≈107 hasar/tur) | 292 | 231–248 | +44 (üstünde) | eşik %50; zayıflık kalkar (soğuk); nefes dolar; nefes alanı ×1,25 | 29 | 29 | 29 |
| doggie | 2 | Bite | 16 | +5 | +3 | — | 13 | — | — | 16 | 15–20 | bantta | — | 1/2 | 3 | 2 |
| wolfie | 8 | Bite×2 | 46 | +7 | +7 | Lesser Blizzard Breath: 14 (DC 16) | 16 | 0 | — | 46 | 51–56 | -5 (altında) | — | 6 | 7 | 6 |
| wolfgang | 20 | Bite + Claw | 91 | +10 | +10 | Blizzard Breath: 55 (DC 19) | 19 | 0 | 3 eylem, 3 puan/tur (≈60 hasar/tur) | 157 | 123–140 | +17 (üstünde) | eşik %50; zayıflık kalkar (ateş); nefes dolar; nefes alanı ×1,25 | 22 | 21 | 21 |
| sparkle | 2 | Hoof | 16 | +5 | +3 | — | 13 | — | — | 16 | 15–20 | bantta | — | 1/2 | 3 | 2 |
| thunderse | 8 | Hoof×2 | 46 | +7 | +7 | Lesser Lightning Gale: 14 (DC 16) | 16 | 0 | — | 46 | 51–56 | -5 (altında) | — | 6 | 7 | 6 |
| stormer | 21 | Hoof×2 | 113 | +11 | +11 | Lightning Gale: 66 (DC 20) | 20 | 0 | 3 eylem, 3 puan/tur (≈66 hasar/tur) | 185 | 141–158 | +27 (üstünde) | eşik %50; +42 geçici can; nefes dolar; nefes alanı ×1,25 | 23 | 23 | 23 |
| twinkle | 3 | Bell Slam×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| gongi | 9 | Bell Slam×2 | 50 | +7 | +7 | Lesser Bell Roar: 14 (DC 16) | 16 | 0 | — | 50 | 57–62 | -7 (altında) | — | 7 | 7 | 7 |
| gongar | 23 | Bell Slam×2 + Shell Ram | 140 | +11 | +11 | Bell Roar: 83 (DC 20) | 20 | 0 | 3 eylem, 3 puan/tur (≈82 hasar/tur) | 230 | 177–194 | +36 (üstünde) | eşik %50; zayıflık kalkar (yıldırım); nefes dolar; nefes alanı ×1,25 | 25 | 25 | 25 |
| hydrop | 2 | Bite | 16 | +5 | +3 | — | 13 | — | — | 16 | 15–20 | bantta | — | 1/2 | 3 | 2 |
| hydras | 8 | Bite×2 | 46 | +7 | +7 | Lesser Sulphur Spray: 14 (DC 16) | 16 | 0 | — | 46 | 51–56 | -5 (altında) | — | 6 | 7 | 6 |
| hydraxe | 22 | Bite×3 | 123 | +11 | +11 | Sulphur Spray: 72 (DC 20) | 20 | 0 | 3 eylem, 3 puan/tur (≈76 hasar/tur) | 206 | 159–176 | +30 (üstünde) | eşik %50; zayıflık kalkar (ateş); nefes dolar; nefes alanı ×1,25 | 24 | 24 | 24 |
| sporlet | 2 | Proboscis | 16 | +5 | +3 | — | 13 | — | — | 16 | 15–20 | bantta | — | 1/2 | 3 | 2 |
| mothcoon | 8 | Proboscis×2 | 46 | +7 | +7 | Lesser Spore Storm: 14 (DC 16) | 16 | 0 | — | 46 | 51–56 | -5 (altında) | — | 6 | 7 | 6 |
| mothraq | 22 | Proboscis + Wing×2 | 123 | +11 | +11 | Spore Storm: 72 (DC 20) | 20 | 0 | 3 eylem, 3 puan/tur (≈76 hasar/tur) | 206 | 159–176 | +30 (üstünde) | eşik %50; zayıflık kalkar (ışıl); nefes dolar; nefes alanı ×1,25 | 24 | 24 | 24 |
| lumbo | 3 | Gore×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| lighty | 9 | Gore×2 | 50 | +7 | +7 | Lesser Celestial Breath: 14 (DC 16) | 16 | 0 | — | 50 | 57–62 | -7 (altında) | — | 7 | 7 | 7 |
| lightaur | 23 | Gore + Hoof×2 | 140 | +11 | +11 | Celestial Breath: 83 (DC 20) | 20 | 0 | 3 eylem, 3 puan/tur (≈82 hasar/tur) | 230 | 177–194 | +36 (üstünde) | eşik %50; zayıflık kalkar (nekrotik); nefes dolar; nefes alanı ×1,25 | 24 | 25 | 24 |
| cerbit | 3 | Bite×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| cerbedo | 9 | Bite×2 | 50 | +7 | +7 | Lesser Crematorium Breath: 14 (DC 16) | 16 | 0 | — | 50 | 57–62 | -7 (altında) | — | 7 | 7 | 7 |
| cerbones | 24 | Bite×3 | 143 | +12 | +12 | Crematorium Breath: 88 (DC 21) | 21 | 0 | 3 eylem, 3 puan/tur (≈84 hasar/tur) | 237 | 195–212 | +25 (üstünde) | eşik %50; zayıflık kalkar (ışıl); nefes dolar; nefes alanı ×1,25 | 26 | 26 | 26 |
| mirit | 3 | Soul Claw×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| mirath | 9 | Soul Claw×2 | 50 | +7 | +7 | Lesser Mind Wave: 14 (DC 16) | 16 | 0 | — | 50 | 57–62 | -7 (altında) | — | 7 | 7 | 7 |
| mirage | 24 | Soul Claw×3 | 143 | +12 | +12 | Mind Wave: 88 (DC 21) | 21 | 0 | 3 eylem, 3 puan/tur (≈84 hasar/tur) | 237 | 195–212 | +25 (üstünde) | eşik %50; zayıflık kalkar (kuvvet); nefes dolar; nefes alanı ×1,25 | 26 | 26 | 26 |
| kongcuk | 3 | Fist×2 | 22 | +5 | +4 | — | 13 | — | — | 22 | 21–26 | bantta | — | 1 | 3 | 2 |
| kongilla | 9 | Fist×2 | 50 | +7 | +7 | Lesser Void Roar: 14 (DC 16) | 16 | 0 | — | 50 | 57–62 | -7 (altında) | — | 7 | 7 | 7 |
| kongark | 25 | Fist×2 + Grab | 156 | +12 | +12 | Void Roar: 99 (DC 21) | 21 | 0 | 3 eylem, 3 puan/tur (≈98 hasar/tur) | 268 | 213–230 | +38 (üstünde) | eşik %50; zayıflık kalkar (psişik); nefes dolar; nefes alanı ×1,25 | 27 | 28 | 27 |
| tutsak-dragon | 30 | Bite + Claw×2 | 87 | +19 | +14 | Continent Roar Breath: 68 (DC 26) | 23 | +3 | 2 eylem, 3 puan/tur (≈74 hasar/tur) | 177 | 303–320 | -126 (altında) | — | 30+ | 27 | 28 (tavan) |
| dragon-of-hexonia-a | 40 | World-Breaker Bite + Continent-Shaper Claw×2 + Continent Tail | 289 | +25 | tablo dışı | Continent Judgment Breath: 165 (DC 32) | tablo dışı | — | 3 eylem, 5 puan/tur (≈220 hasar/tur) | 522 | tablo dışı | — | — | tablo dışı | tablo dışı | tablo dışı |
| dragon-of-hexonia-b | 40 | World-Breaker Bite + Continent-Shaper Claw×2 + Continent Tail | 289 | +25 | tablo dışı | Continent Judgment Breath: 165 (DC 32) | tablo dışı | — | 3 eylem, 5 puan/tur (≈220 hasar/tur) | 522 | tablo dışı | — | — | tablo dışı | tablo dışı | tablo dışı |
| kozmik-anka | 32 | Cosmic Beak + Starfire Talons×2 | 128 | +19 | tablo dışı | Celestial Glide: 77 (DC 27) | tablo dışı | — | 1 eylem, 3 puan/tur (≈36 hasar/tur) | 172 | tablo dışı | — | eşik %5; +450 geçici can; nefes dolar | tablo dışı | tablo dışı | tablo dışı |
| kozmik-anka-savas | 32 | Cosmic Beak + Starfire Talons×2 | 128 | +19 | tablo dışı | Celestial Glide: 77 (DC 27) | tablo dışı | — | 1 eylem, 3 puan/tur (≈36 hasar/tur) | 172 | tablo dışı | — | eşik %5; +450 geçici can; nefes dolar | tablo dışı | tablo dışı | tablo dışı |
| ember-egg | 0 | — | 0 | — | +3 | — | 13 | — | — | 0 | 0–1 | bantta | — | 9 | 0 | 4 |
| ocean-nightmare | 30 | Tentacle×3 | 114 | +20 | +14 | Storm Lightning: 44 (DC 25) | 23 | +3 | 3 eylem, 3 puan/tur (≈102 hasar/tur) | 216 | 303–320 | -87 (altında) | — | 30 | 29 | 29 |
| ocean-nightmare-open-sea | 30 | Tentacle×3 | 114 | +20 | +14 | Storm Lightning: 44 (DC 25) | 23 | +3 | 3 eylem, 3 puan/tur (≈102 hasar/tur) | 216 | 303–320 | -87 (altında) | — | 30 | 29 | 29 |
| titan-of-nightmare | 35 | Eldritch Tentacle×3 | 144 | +22 | tablo dışı | Maddening Gaze: 44 (DC 27) | tablo dışı | — | 2 eylem, 4 puan/tur (≈44 hasar/tur) | 188 | tablo dışı | — | eşik %50 | tablo dışı | tablo dışı | tablo dışı |
| alphlet | 7 | Bite + Claw×2 | 36 | +6 | +6 | Thunder Breath: 36 (DC 16) | 15 | +1 | — | 48 | 45–50 | bantta | — | 7 | 7 | 7 |
| alphyr | 19 | Bite + Claw×2 | 73 | +10 | +10 | Thunder Breath: 54 (DC 21) | 19 | +2 | — | 84 | 117–122 | -33 (altında) | — | 17 | 14 | 15 |
| alphadrake | 28 | Bite + Claw×2 | 165 | +13 | +13 | Thunder Breath: 105 (DC 25) | 22 | +3 | 3 eylem, 3 puan/tur (≈199 hasar/tur) | 379 | 267–284 | +95 (üstünde) | — | 27 | 30+ | 28 (tavan) |
| omeglet | 6 | Bite + Claw×2 | 30 | +6 | +6 | Necrotic Breath: 32 (DC 15) | 15 | 0 | — | 41 | 39–44 | bantta | — | 5 | 6 | 5 |
| omegyr | 17 | Bite + Claw×2 | 63 | +10 | +10 | Necrotic Breath: 50 (DC 20) | 19 | +1 | — | 75 | 105–110 | -30 (altında) | — | 13 | 13 | 13 |
| omegadrake | 26 | Bite + Claw×2 | 147 | +12 | +12 | Necrotic Breath: 94 (DC 24) | 21 | +3 | 3 eylem, 3 puan/tur (≈173 hasar/tur) | 333 | 231–248 | +85 (üstünde) | — | 25 | 29+ | 27 (tavan) |
| deltlet | 6 | Bite + Claw×2 | 30 | +6 | +6 | Psychic Breath: 32 (DC 15) | 15 | 0 | — | 41 | 39–44 | bantta | — | 6 | 6 | 6 |
| deltyr | 18 | Bite + Claw×2 | 67 | +10 | +10 | Psychic Breath: 50 (DC 20) | 19 | +1 | — | 77 | 111–116 | -34 (altında) | — | 16 | 13 | 14 |
| deltadrake | 27 | Bite + Claw×2 | 159 | +13 | +13 | Psychic Breath: 99 (DC 24) | 22 | +2 | 3 eylem, 3 puan/tur (≈193 hasar/tur) | 365 | 249–266 | +99 (üstünde) | — | 26 | 30+ | 28 (tavan) |
| sigmlet | 5 | Bite + Claw×2 | 30 | +6 | +6 | Radiant Breath: 27 (DC 15) | 15 | 0 | — | 38 | 33–38 | bantta | — | 5 | 5 | 5 |
| sigmyr | 16 | Bite + Claw×2 | 63 | +9 | +9 | Radiant Breath: 45 (DC 19) | 18 | +1 | — | 72 | 99–104 | -27 (altında) | — | 13 | 11 | 12 |
| sigmadrake | 25 | Bite + Claw×2 | 132 | +12 | +12 | Radiant Breath: 88 (DC 23) | 21 | +2 | 3 eylem, 3 puan/tur (≈159 hasar/tur) | 305 | 213–230 | +75 (üstünde) | — | 23 | 29 | 26 |
| gamlet | 8 | Bite + Claw×2 | 30 | +7 | +7 | Force Breath: 36 (DC 16) | 16 | 0 | — | 44 | 51–56 | -7 (altında) | — | 8 | 6 | 7 |
| gammyr | 20 | Bite + Claw×2 | 81 | +10 | +10 | Force Breath: 54 (DC 22) | 19 | +3 | — | 90 | 123–140 | -33 (altında) | — | 19 | 15 | 17 |
| gammadrake | 30 | Bite + Claw×2 | 192 | +14 | +14 | Force Breath: 110 (DC 26) | 23 | +3 | 3 eylem, 3 puan/tur (≈222 hasar/tur) | 423 | 303–320 | +103 (üstünde) | — | 29 | 30+ | 29 (tavan) |

## Yazılı CR ile etkin CR'si farklı olanlar

Tablo içindeki 49 kayıttan 41 tanesinde etkin CR yazılı CR'den farklı (fark büyükten küçüğe). "Sıra": yazılı CR sırası → etkin CR sırası (aynı değerler aynı sırada).

| id | yazılı CR | etkin CR | fark | savunma CR | saldırı CR | sıra |
|---|---|---|---|---|---|---|
| alphyr | 19 | 15 | -4 | 17 | 14 | 13 → 10 |
| deltyr | 18 | 14 | -4 | 16 | 13 | 12 → 9 |
| ember-egg | 0 | 4 | +4 | 9 | 0 | 1 → 2 |
| omegyr | 17 | 13 | -4 | 13 | 13 | 11 → 8 |
| sigmyr | 16 | 12 | -4 | 13 | 11 | 10 → 7 |
| cimbombom | 26 | 29 | +3 | 29 | 29 | 20 → 19 |
| gammyr | 20 | 17 | -3 | 19 | 15 | 14 → 11 |
| cerbedo | 9 | 7 | -2 | 7 | 7 | 8 → 5 |
| cerbones | 24 | 26 | +2 | 26 | 26 | 18 → 16 |
| cimbom | 10 | 8 | -2 | 8 | 9 | 9 → 6 |
| gongar | 23 | 25 | +2 | 25 | 25 | 17 → 15 |
| gongi | 9 | 7 | -2 | 7 | 7 | 8 → 5 |
| hydras | 8 | 6 | -2 | 6 | 7 | 7 → 4 |
| hydraxe | 22 | 24 | +2 | 24 | 24 | 16 → 14 |
| kongark | 25 | 27 | +2 | 27 | 28 | 19 → 17 |
| kongilla | 9 | 7 | -2 | 7 | 7 | 8 → 5 |
| lighty | 9 | 7 | -2 | 7 | 7 | 8 → 5 |
| mirage | 24 | 26 | +2 | 26 | 26 | 18 → 16 |
| mirath | 9 | 7 | -2 | 7 | 7 | 8 → 5 |
| mothcoon | 8 | 6 | -2 | 6 | 7 | 7 → 4 |
| mothraq | 22 | 24 | +2 | 24 | 24 | 16 → 14 |
| stormer | 21 | 23 | +2 | 23 | 23 | 15 → 13 |
| thunderse | 8 | 6 | -2 | 6 | 7 | 7 → 4 |
| tutsak-dragon | 30 | 28 (tavan) | -2 | 30+ | 27 | 23 → 18 |
| wolfie | 8 | 6 | -2 | 6 | 7 | 7 → 4 |
| cerbit | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| cim | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| deltadrake | 27 | 28 (tavan) | +1 | 26 | 30+ | 21 → 18 |
| gamlet | 8 | 7 | -1 | 8 | 6 | 7 → 5 |
| gammadrake | 30 | 29 (tavan) | -1 | 29 | 30+ | 23 → 19 |
| kongcuk | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| lightaur | 23 | 24 | +1 | 24 | 25 | 17 → 14 |
| lumbo | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| mirit | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| ocean-nightmare | 30 | 29 | -1 | 30 | 29 | 23 → 19 |
| ocean-nightmare-open-sea | 30 | 29 | -1 | 30 | 29 | 23 → 19 |
| omegadrake | 26 | 27 (tavan) | +1 | 25 | 29+ | 20 → 17 |
| omeglet | 6 | 5 | -1 | 5 | 6 | 5 → 3 |
| sigmadrake | 25 | 26 | +1 | 23 | 29 | 19 → 16 |
| twinkle | 3 | 2 | -1 | 1 | 3 | 3 → 1 |
| wolfgang | 20 | 21 | +1 | 22 | 21 | 14 → 12 |
