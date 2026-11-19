# Celestial final hale listesi (2026-11-19; yalnız rapor, jeton değiştirilmedi)

Üretici `scripts/celestial-final.py`, ölçüm `scripts/hale-olcum.py`. 290 Celestial jeton. Sınıf sayfaları bu klasörde (`<sınıf>.jpg`; kırmızı = haleli, turuncu = belirsiz), bütün ölçüm `olcum.csv`.

**Sonuç (ölçüm + görsel kontrol): halesiz 290, haleli 0, belirsiz 0.** Yalnız ölçüm: halesiz 285, haleli 5, belirsiz 0.

Ölçüm: başın tepesinde/üstünde ince elips halka ya da ince yay (skor 0–1; ≥ 0,5 haleli, 0,2–0,5 belirsiz). Duyarlılık sınırlı (kalibrasyonda bilinen halelerin ≈ %65’i), bu yüzden 12 sınıf sayfası ayrıca gözle tarandı; gözle görülen ek hale yok.

| Jeton | Sonuç | Ölçüm (skor, yöntem, ölçüler) | Görsel kontrol | Kazanan kaynak | Taç |
|---|---|---|---|---|---|
| celestial-erkek-warlock-WL-8 | **halesiz** | haleli 0.75 (sutun; yay_en 18, yay_y 8, kalinlik 2, bosluk 7, ust 8) | yanlış alarm: Gulyabani saç telleri (taç yok kararı ayrı) | yeni (warlock-male-celestial.jpg / 8) | yok (bekleyen) |
| celestial-erkek-wizard-WZ-B1 | **halesiz** | haleli 0.972 (halka; en 34, boy 6, kalinlik 1.0, doluluk 0.27, ic_saydam 0.5, ust_saydam 1.0, kapsama 0.72, ust_yay 0.97, px 56, y 23, ust 20) | yanlış alarm: rüzgâr parçacıkları (2360265b halesiz uygulandı) | duzeltme (git:2360265b / 1) | çizilir |
| celestial-female-bard | **halesiz** | haleli 1.0 (sutun; yay_en 27, yay_y 22, kalinlik 4, bosluk 10, ust 10) | yanlış alarm: şapka tüyü | taban (hale-gemini-sayfa-04.png / 7) | çizilir |
| celestial-kadin-wizard-WZ-B1 | **halesiz** | haleli 0.667 (halka; en 38, boy 7, kalinlik 1.0, doluluk 0.15, ic_saydam 0.43, ust_saydam 1.0, kapsama 0.58, ust_yay 0.83, px 40, y 27, ust 25) | yanlış alarm: rüzgâr parçacıkları | CC öncesi (değişmedi) | çizilir |
| celestial-male-bard | **halesiz** | haleli 1.0 (sutun; yay_en 25, yay_y 23, kalinlik 4, bosluk 2, ust 10) | yanlış alarm: şapka tüyü | taban (hale-gemini-sayfa-03.png / 5) | çizilir |

## Halesiz ama taç bekleme listesinde (oyunda yıldız tacı çizilmez)

Bilgi için: `data/hale-halesiz.json` `bekleyen` listesinde olup ölçüm + gözle halesiz görünen jetonlar. Jeton ve liste değiştirilmedi.

| Jeton | Neden listede | Kazanan kaynak |
|---|---|---|
| celestial-erkek-warlock-WL-8 | kullanıcı kararı: Gulyabani, taç yok | yeni (warlock-male-celestial.jpg / 8) |
| celestial-kadin-fighter-ID3 | CC taban: uyum düşük, uygulanmadı | CC öncesi (değişmedi) |
| celestial-kadin-fighter-ID4 | CC taban: Gemini çıktısı kaynakla aynı (hale silinmemiş sayıldı) | CC öncesi (değişmedi) |

Erkek Wizard WZ-B halesiz hâl araması: `wzb-arama.md`.
