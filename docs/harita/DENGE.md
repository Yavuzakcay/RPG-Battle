# Denge ölçümü (Adım 11)

5. seviye 5 kişilik parti (Bor, Mira, Tavi, Sela, Kael), her senaryo 200 savaş, tohum 1–200, iki taraf da yapay zekâ ile. Komut: `npm run sim -- 200`. Hedef: parti galibiyeti %60–80.

| Senaryo | XP | Savaş | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz (haritasız) | 4850 | 200 | 3% | 0% | 6.4 | 0.49 | 40% | 4.42 |
| Çöl (gündüz) | 4400 | 200 | 43% | 1% | 11.1 | 0.50 | 40% | 2.79 |
| Volkan | 4400 | 200 | 99% | 0% | 6.6 | 0.07 | 6% | 0.32 |
| Orman | 4550 | 200 | 39% | 2% | 10.2 | 0.68 | 49% | 2.67 |
| Mağara (karanlık) | 3950 | 200 | 40% | 6% | 12.9 | 0.80 | 51% | 2.53 |
| Kale (gündüz) | 3950 | 200 | 43% | 5% | 11.3 | 0.67 | 43% | 2.33 |
| Taverna (4 masum ortada) | 2550 | 200 | 21% | 0% | 2.3 | 0.04 | 4% | 0.10 |
| Taverna (4 masum parti arkasında) | 2550 | 200 | 79% | 1% | 7.1 | 0.22 | 18% | 0.89 |

"Ort. düşmüş PC": savaş sonunda 0 HP'de olup ölmemiş (ölmekte/stabil) karakter. "Berabere": 20 turda bitmedi.
