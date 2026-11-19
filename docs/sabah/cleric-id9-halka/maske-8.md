# Cleric ID9: bayat 8 ten maskesi yenilendi (Kuyruk KJ4, 2026-11-19)

Cleric ID9 (Birlik Manastırı 17+) jetonlarının halkası değişince sekiz ten maskesi eski görselden kalmıştı. Aynı sekiz dosya yeniden üretildi, halkayla kesişimi ve ten tonu dağılımı ölçüldü.
Yalnız ten maskesi dosyaları ve alt-rapor satırları: kural ve kayıt sürümü değişmedi.

## Neden bayattı

Maskeler `be660ec` (2026-11-17; Tiefling erkek `456a7d6`, 2026-11-19) tarihli, eski halkalı jetonlardan üretilmişti. Halka işinde jeton görselleri değişti (`f0687c9` onaylı 18 jeton, Tiefling erkek için `e2ba43b` kalın halka).
`NOT.md` ("Yazıldı" bölümü): Elf/Tiefling kadın maskeleri `npm run soy-maske -- --alt` ile yenilenmiş, toplu çalıştırmanın değiştirdiği "kapsam dışı 8 ID9 maskesi" eski hâline döndürülmüştü; bu sekiz dosya o sekiz.

## Yöntem

- `npm run soy-maske -- --alt`. Tek jeton filtresi yok (`--alt`'ın argümanı ırk filtresi), bu yüzden bütün alt maskeler yeniden yazıldı; **baytları değişen yalnız bu 8 PNG** ve `data/soy-maske-alt-rapor.json` içinde bu 8 jetonun `n` değeri (git ile doğrulandı).
  `maske-pul/` (Dragonborn pul maskeleri, 266), `maske-el/`, `bas/`, diğer ırkların ve sınıf-genel maskeler değişmedi. Depo dışı geçici `git worktree`'de aynı koşu bayt bayt aynı çıktıyı verdi. Dark Elf paleti ve `soy-olcum.json` bu komutun kapsamında değil, dokunulmadı.
- Ölçüm: `python3 scripts/cleric-id9-maske-olcum.py --once e2b70a1` (önce = `e2b70a1` sürümündeki maske, sonra = çalışma ağacı). Halka = `scripts/cleric-id9-halka.py` `split_ring` (jetondaki mevcut boncuk halkası). Ten dışı = baş bandı (baş tepesi + 80 satır) ten medyanına ΔE > 25 olan maske pikseli. Çıktılar: `maske-8-rapor.json`, `maske-8-once-sonra.png`.

## Sonuç

| Jeton | Maske px (önce → sonra) | Değişen px (+ / −) | Halka px | Halka ∩ maske (önce / sonra) | Ten ortalaması L a b (önce → sonra) | ΔE (ort.) | ΔE p50/p90 (önce → sonra) | Ten dışı px (önce → sonra) |
|---|---|---|---:|---|---|---:|---|---|
| elf-erkek | 4017 → 3951 | **232** (+83 / −149) | 906 | 0 / **0** | 69.0 27.7 29.1 → 69.3 27.7 29.4 | 0.36 | 9.4/18.3 → 9.1/18.0 | 291 → 261 |
| gnome-erkek | 2600 → 2601 | **533** (+267 / −266) | 888 | 0 / **0** | 75.8 23.1 31.9 → 75.7 23.1 32.2 | 0.29 | 6.9/13.1 → 6.6/13.3 | 0 → 0 |
| gnome-kadin | 3266 → 3217 | **545** (+248 / −297) | 898 | 0 / **0** | 73.1 21.6 21.9 → 73.0 22.0 22.3 | 0.61 | 6.7/15.4 → 6.5/15.4 | 34 → 14 |
| goliath-erkek | 1717 → 1679 | **126** (+44 / −82) | 805 | 0 / **0** | 58.5 -2.7 -5.7 → 58.4 -2.7 -5.7 | 0.17 | 10.5/16.1 → 10.8/16.7 | 0 → 0 |
| goliath-kadin | 1833 → 1651 | **320** (+69 / −251) | 793 | 0 / **0** | 66.1 1.1 -4.0 → 66.9 1.1 -4.2 | 0.77 | 9.5/16.7 → 8.9/16.0 | 110 → 85 |
| human-erkek | 3334 → 3668 | **440** (+387 / −53) | 1058 | 0 / **0** | 73.5 23.1 31.5 → 73.0 22.8 31.0 | 0.78 | 6.5/18.9 → 7.2/19.1 | 311 → 363 |
| human-kadin | 3945 → 3919 | **102** (+38 / −64) | 958 | 0 / **0** | 74.0 19.2 23.6 → 74.1 19.3 23.6 | 0.10 | 8.2/16.1 → 8.2/15.9 | 217 → 204 |
| tiefling-erkek | 2821 → 2611 | **810** (+300 / −510) | 247 | 0 / **0** | 35.5 48.4 10.4 → 36.0 49.4 10.8 | 1.18 | 11.8/18.6 → 10.8/18.8 | 196 → 140 |

Toplam 3108 piksel değişti (8 dosya).

- **Halka ∩ ten maskesi: sekizinde de 0** (önce de 0). Halkanın ±1 px komşuluğu da 0, yalnız human-kadin'de 1 px. Halkaya taşan maske çıkmadığı için halkayı dışlayan elle düzeltmeye (`maske-el`) gerek kalmadı; otomatik maske olduğu gibi kaldı.
- **Ten tonu:** ortalama renk kayması ΔE 0,1–1,2 (en büyüğü tiefling-erkek 1,18); piksellerin ortalamaya ΔE dağılımı (p50/p90) benzer. Eklenen ve silinen piksellerin eski ortalamaya ΔE'si ≈ 9–23: p90 aralığında (13–19), bir kısmı kenar pikseli olduğu için biraz üstünde.
- Görsel: `maske-8-once-sonra.png` (jeton | önce | sonra | fark; mavi halka, sarı = halka ∩ maske: yok).

**Notlar (halkayla ilgisiz, otomatik maskenin eski davranışı; düzeltme yapılmadı):** goliath-kadin'de kapsama parça parça (gri ten, kıyafet renk aralığıyla çakışıyor; önce de öyleydi); human-erkek'te baş bandı altında +174 px ve ten dışı +52 px (krem gömlek ve eller, önceki maskede de vardı, biraz arttı). İstenirse bu ikisi için elle maske çizilebilir.
Dragonborn Cleric ID9 pul maskeleri (`maske-pul/`) bu görevde değişmedi.

**Elle maske hattı (bilgi):** `applyHandMasks` yalnız 144 sınıf-genel sprite'ı (`<ırk>-<male|female>-<sınıf>`) tanır; hücreli jetonlar (`…-ID9`) için `maske-el` hattı bağlı değil (kaynak kümesine eklenmesi gerekir). Bu görevde gerekmedi.

## Doğrulama

| Adım | Sonuç |
|---|---|
| `npm run typecheck` | temiz |
| handMask, tint, baglama dahil 20 test dosyası (jeton/ton/maske/soy-renkleri) | 20/20 geçti, 184 test |
| `npm run build` | tamam; ana parça 448,80 kB / sınır 500 kB |
| `npm run check:harita` (`PW_CHROMIUM=/opt/pw-browsers/chromium`) | çıkış kodu 0; `Denenen 92, geçen 92, düşen 0.` |
| Değişen dosya denetimi (`git status`) | maske/ 8 PNG, `maske-pul/` 0, `maske-el/` 0, `bas/` 0; alt-rapor'da yalnız bu 8 girdi |

## Yeniden ölçmek

```bash
python3 scripts/cleric-id9-maske-olcum.py --once e2b70a1
```
