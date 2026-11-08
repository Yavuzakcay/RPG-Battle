# K71a: 23 duvarlı açık harita için dikey veri önerisi (onay bekliyor)

Üreten: `python scripts/k71-dikey.py --oneri`. **Bu öneriler haritalara yazılmadı:** kullanıcı onayına dek bu 23 harita
K68c varsayılanıyla oynanır (duvar `s`/`O` 20 ft, ağaç 30 ft, diğer harfler `data/dikey.json`). Onaylanan değerler
`scripts/k71-dikey.py` `ONAYLI` tablosuna yazılır ve betik varyantlara `"dikey": {...}` satırı ekler.

⚠ Sur/bina boyları ve bina içi bölgeleri görselden doğrulanmalı; kapalı alan tespiti zemin harflerinden (duvar `s`,
kapalı kapı `O`, kapı/geçit `o`, harita dışı `#` geçilmez sayılarak kenardan ulaşılamayan alanlar). Kapısı açık
(`o` dışında geçiş olan) binalar kapalı alan çıkmaz: onlar için bölge elle verilir.

## 23 harita

### batak-kale (21×11, kategori: kale)

- **Önerilen duvar boyu:** 25 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: bataklık kalesi (yıkık sur).
- **Duvar bileşenleri** (5; sütun–satır aralığı, altıgen sayısı):
  - sütun 1–1, satır 2–4: 3 altıgen
  - sütun 1–2, satır 6–8: 3 altıgen
  - sütun 2–2, satır 1–1: 1 altıgen
  - sütun 4–4, satır 8–8: 1 altıgen
  - sütun 6–6, satır 8–8: 1 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### buzul-tapinak (21×11, kategori: tapinak)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: buzul tapınağı duvarı; tapınak içi.
- **Duvar bileşenleri** (10; sütun–satır aralığı, altıgen sayısı):
  - sütun 8–14, satır 0–4: 11 altıgen
  - sütun 3–7, satır 6–9: 7 altıgen
  - sütun 15–17, satır 4–8: 6 altıgen
  - sütun 1–2, satır 5–8: 5 altıgen
  - sütun 13–14, satır 6–8: 4 altıgen
  - sütun 7–7, satır 2–2: 1 altıgen
  - … 4 küçük bileşen daha
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### hapishane-dis-halka (21×11, kategori: hapishane)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: hapishane halka duvarı; nöbetçi odaları.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–9, satır 0–10: 60 altıgen
  - sütun 11–20, satır 0–10: 60 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### hapishane-iskele (21×11, kategori: hapishane)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: iskele binası duvarı.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–20, satır 0–3: 61 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### kale-avlu (31×17, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: avlu suru; avlu çevresi binalar.
- **Duvar bileşenleri** (5; sütun–satır aralığı, altıgen sayısı):
  - sütun 11–29, satır 1–15: 63 altıgen
  - sütun 21–27, satır 3–7: 17 altıgen
  - sütun 21–27, satır 9–13: 17 altıgen
  - sütun 27–27, satır 7–7: 1 altıgen
  - sütun 27–27, satır 9–9: 1 altıgen
- **Duvarla çevrili kapalı alanlar** (bina içi adayı; öneri tavan 15 ft, `tavanBolge`):
  - sütun 12–28, satır 2–14: 162 altıgen
  - sütun 22–24, satır 4–6: 9 altıgen
  - sütun 22–24, satır 10–12: 9 altıgen

### kale-baskini (31×17, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: kale suru ve kuleler; iç bina odaları.
- **Duvar bileşenleri** (5; sütun–satır aralığı, altıgen sayısı):
  - sütun 11–29, satır 1–15: 63 altıgen
  - sütun 21–27, satır 3–13: 26 altıgen
  - sütun 24–27, satır 9–13: 8 altıgen
  - sütun 27–27, satır 7–7: 1 altıgen
  - sütun 27–27, satır 9–9: 1 altıgen
- **Duvarla çevrili kapalı alanlar** (bina içi adayı; öneri tavan 15 ft, `tavanBolge`):
  - sütun 12–28, satır 2–14: 162 altıgen
  - sütun 22–24, satır 4–6: 9 altıgen
  - sütun 22–24, satır 10–12: 9 altıgen

### kale (15×7, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: kale suru; iç bina odaları.
- **Duvar bileşenleri** (4; sütun–satır aralığı, altıgen sayısı):
  - sütun 8–8, satır 0–2: 3 altıgen
  - sütun 8–8, satır 4–6: 3 altıgen
  - sütun 13–13, satır 3–4: 2 altıgen
  - sütun 14–14, satır 1–1: 1 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### orman-heykel-golu (31×17, kategori: kalinti)

- **Önerilen duvar boyu:** 15 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: göl kıyısı kalıntı duvarı.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 13–30, satır 0–7: 84 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### orman-kemik-acikligi (21×11, kategori: cit)

- **Önerilen duvar boyu:** 10 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: yıkık taş çit/kalıntı.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 18–19, satır 2–2: 2 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### orman-oduncu-kampi (31×17, kategori: cit)

- **Önerilen duvar boyu:** 10 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: kamp çiti/kulübe duvarı.
- **Duvar bileşenleri** (6; sütun–satır aralığı, altıgen sayısı):
  - sütun 19–22, satır 1–5: 10 altıgen
  - sütun 25–26, satır 1–5: 7 altıgen
  - sütun 7–9, satır 8–9: 5 altıgen
  - sütun 23–25, satır 8–9: 4 altıgen
  - sütun 14–16, satır 4–4: 3 altıgen
  - sütun 23–23, satır 1–1: 1 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### orman-ork-kampi (21×11, kategori: cit)

- **Önerilen duvar boyu:** 10 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: ork kampı palisadı.
- **Duvar bileşenleri** (6; sütun–satır aralığı, altıgen sayısı):
  - sütun 15–20, satır 0–2: 13 altıgen
  - sütun 8–11, satır 10–10: 4 altıgen
  - sütun 5–7, satır 3–3: 3 altıgen
  - sütun 11–13, satır 3–3: 3 altıgen
  - sütun 2–4, satır 6–6: 3 altıgen
  - sütun 14–16, satır 6–6: 3 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### sehir-meydani (15×7, kategori: bina)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: meydan çevresi bina cepheleri.
- **Duvar bileşenleri** (4; sütun–satır aralığı, altıgen sayısı):
  - sütun 10–14, satır 4–6: 9 altıgen
  - sütun 0–4, satır 4–6: 8 altıgen
  - sütun 0–4, satır 0–2: 7 altıgen
  - sütun 10–14, satır 0–2: 7 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### ortamlar-diyari (31×17, kategori: vitrin)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: vitrin/test haritası; varsayılan.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 12–15, satır 0–3: 7 altıgen
  - sütun 7–10, satır 0–0: 4 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### volkanik-demirhane (31×17, kategori: acik-ustlu)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: açık üstlü demirhane (K68b kullanıcı kararı); duvar varsayılan.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 20–21, satır 0–0: 2 altıgen
  - sütun 26–27, satır 0–0: 2 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### kanyon-koprusu (21×11, kategori: kaya)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: kanyon duvarı/köprü korkuluğu (varsayılan).
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 18–20, satır 0–2: 5 altıgen
  - sütun 18–20, satır 8–8: 3 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### isinlanma-salonu (21×11, kategori: acik-ustlu)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: açık üstlü salon (K68b kullanıcı kararı); duvar varsayılan.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 9–11, satır 0–0: 3 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### lav-tapinagi (21×11, kategori: acik-ustlu)

- **Önerilen duvar boyu:** 20 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: açık üstlü tapınak (K68b kullanıcı kararı); duvar varsayılan.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–0, satır 0–1: 2 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### beyaz-sehir-dis-kapi (21×11, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: şehir suru ve kapı.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–9, satır 0–3: 36 altıgen
  - sütun 11–20, satır 0–3: 36 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### beyaz-sehir-saray-avlusu (21×11, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: saray avlusu duvarı; saray odaları yüksek tavan.
- **Duvar bileşenleri** (5; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–20, satır 0–1: 33 altıgen
  - sütun 8–8, satır 9–9: 1 altıgen
  - sütun 12–12, satır 9–9: 1 altıgen
  - sütun 9–9, satır 10–10: 1 altıgen
  - sütun 11–11, satır 10–10: 1 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### kale-ic-avlu (21×11, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: kale iç avlu suru; bina odaları.
- **Duvar bileşenleri** (1; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–20, satır 0–10: 121 altıgen
- **Duvarla çevrili kapalı alanlar** (bina içi adayı; öneri tavan 15 ft, `tavanBolge`):
  - sütun 2–18, satır 2–7: 93 altıgen

### kale-onu (21×11, kategori: kale)

- **Önerilen duvar boyu:** 30 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: dış sur ve kapı kuleleri.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–9, satır 0–2: 28 altıgen
  - sütun 11–20, satır 0–2: 27 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### kasaba-demirci-tapinak (21×11, kategori: bina)

- **Önerilen duvar boyu:** 15 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: demirci ve tapınak duvarları (tapınak içi daha yüksek olabilir).
- **Duvar bileşenleri** (7; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–7, satır 0–3: 28 altıgen
  - sütun 15–20, satır 0–4: 22 altıgen
  - sütun 4–7, satır 9–10: 5 altıgen
  - sütun 15–17, satır 10–10: 3 altıgen
  - sütun 13–13, satır 8–8: 1 altıgen
  - sütun 15–15, satır 8–8: 1 altıgen
  - … 1 küçük bileşen daha
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

### kasaba-han (21×11, kategori: bina)

- **Önerilen duvar boyu:** 15 ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: han binası duvarı; han içi tek kat.
- **Duvar bileşenleri** (2; sütun–satır aralığı, altıgen sayısı):
  - sütun 0–12, satır 0–4: 45 altıgen
  - sütun 14–20, satır 0–6: 29 altıgen
- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).

## Ek: 59 haritanın engel harfleri (harf tablosuyla)

Harf tablosu (ft): `s` 20, `O` 20, `a` 30, `c` 15, `m` 10, `v` 10, `e` 10, `r` 5, `k` 5, `x` 5, `d` 5, `g` 5.

| Harita | Boyut | Tavan (ft) | Katmanlı | Engel harfleri (sayı) |
|---|---|---|---|---|
| batak-adalar | 21×11 | — |  | `g` 18, `a` 12 |
| batak-cukur | 21×11 | — |  | `a` 9, `k` 8, `x` 4 |
| batak-kale | 21×11 | — |  | `g` 77, `s` 9, `a` 8, `m` 3, `x` 2, `r` 1 |
| batak-kamp | 21×11 | — |  | `g` 41, `a` 8, `x` 2 |
| bataklik | 15×7 | — |  | `a` 16, `g` 10 |
| buzul-acik | 21×11 | — | evet | `r` 14, `a` 13, `k` 13, `g` 3 |
| buzul-kamp | 21×11 | — | evet | `a` 40, `x` 2, `r` 1 |
| buzul-kayalik | 21×11 | — | evet | `v` 56, `r` 10, `a` 7 |
| buzul-tapinak | 21×11 | — | evet | `s` 38, `m` 4, `x` 3 |
| col-gemi-enkazi | 21×11 | — |  | `x` 20, `k` 19, `d` 4, `r` 3 |
| col-kanyon-nehri | 21×11 | — |  | `g` 16, `a` 5, `r` 4 |
| col | 15×7 | — |  | `r` 13, `k` 9, `c` 8, `d` 8 |
| col-sutun-harabesi | 21×11 | — |  | `k` 16, `r` 12, `c` 11 |
| col-vaha | 21×11 | — |  | `a` 29, `g` 17, `r` 8 |
| yeralti-nehri | 21×11 | 10 |  | — |
| dag-karakol | 21×11 | — | evet | `x` 12, `g` 12, `r` 2 |
| dag-kayalik | 21×11 | — | evet | `g` 10, `r` 8, `a` 4, `x` 1 |
| dag | 15×7 | — |  | `r` 4 |
| dag-kopru | 21×11 | — | evet | `a` 12 |
| dag-nobetci | 21×11 | — | evet | `a` 25, `v` 20, `m` 7, `r` 3, `x` 2 |
| ada | 15×7 | — |  | `a` 13, `r` 13 |
| gemi | 15×7 | — |  | `x` 27, `m` 2 |
| derinlikler-lav-salonu | 21×11 | 30 |  | `s` 52, `r` 6, `m` 4 |
| derinlikler-magara-karakol | 31×17 | 20 |  | `s` 126, `x` 11, `m` 5, `v` 5 |
| derinlikler-mantar-magarasi | 31×17 | 30 |  | `s` 162, `e` 17, `x` 2 |
| derinlikler-mezar-labirenti | 31×17 | 15 |  | `s` 147, `x` 5 |
| hapishane-dis-halka | 21×11 | — |  | `s` 120, `m` 8, `x` 8 |
| hapishane-hucre-platformu | 21×11 | 20 |  | `s` 43, `x` 19, `m` 2 |
| hapishane-iskele | 21×11 | — |  | `s` 61, `x` 7, `m` 2 |
| hapishane-mudur-kulesi | 21×11 | 15 |  | `s` 78, `x` 21, `m` 12 |
| kale-avlu | 31×17 | — |  | `s` 99, `g` 11, `x` 5, `r` 4, `m` 2 |
| kale-baskini | 31×17 | — |  | `s` 99, `g` 18, `a` 9, `r` 4, `x` 4, `m` 2 |
| kale | 15×7 | — |  | `x` 16, `s` 9, `r` 4, `m` 3 |
| orman-yolu | 31×17 | — |  | `a` 94, `g` 75, `x` 4, `r` 2 |
| orman-heykel-golu | 31×17 | — |  | `s` 84, `a` 22, `g` 7, `r` 5 |
| orman-heykel-magarasi | 21×11 | 20 |  | `c` 17, `e` 6, `r` 4 |
| orman-kemik-acikligi | 21×11 | — |  | `a` 37, `g` 11, `k` 4, `r` 3, `s` 2 |
| orman-oduncu-kampi | 31×17 | — |  | `a` 58, `s` 30, `r` 7, `g` 6 |
| orman-ork-kampi | 21×11 | — |  | `a` 36, `s` 29, `m` 5, `x` 5, `r` 1 |
| orman | 15×7 | — |  | `a` 24, `g` 7, `r` 3 |
| sehir-meydani | 15×7 | — |  | `s` 31, `x` 10, `a` 4, `m` 1 |
| taverna | 15×7 | 12 |  | `x` 24, `m` 4 |
| ortamlar-diyari | 31×17 | — |  | `d` 35, `g` 12, `s` 10, `a` 8, `r` 7, `v` 3, `k` 3, `x` 3, `O` 1, `c` 1, `m` 1, `e` 1 |
| volkan | 15×7 | — |  | — |
| volkanik-demirhane | 31×17 | — |  | `m` 9, `s` 4, `e` 1, `x` 1 |
| kanyon-koprusu | 21×11 | — |  | `v` 12, `s` 8, `r` 5, `m` 4 |
| isinlanma-salonu | 21×11 | — |  | `m` 12, `c` 4, `s` 2, `O` 1 |
| lav-tapinagi | 21×11 | — |  | `c` 5, `s` 2, `m` 1 |
| magara-genis | 21×11 | 20 |  | `s` 101, `v` 3, `r` 3, `e` 2 |
| magara | 15×7 | 20 |  | `v` 8, `e` 5, `r` 2 |
| dungeon | 15×7 | 15 |  | `m` 4, `k` 3, `x` 3 |
| beyaz-sehir-dis-kapi | 21×11 | — |  | `s` 72, `x` 27, `a` 5 |
| beyaz-sehir-saray-avlusu | 21×11 | — |  | `s` 37, `g` 21, `m` 18, `a` 14, `x` 6 |
| kale-ic-avlu | 21×11 | — |  | `s` 121, `x` 31, `m` 1 |
| kale-onu | 21×11 | — |  | `s` 55, `k` 12, `x` 10, `a` 4, `r` 2 |
| kale-taht-salonu | 15×7 | 30 | evet | `s` 30, `x` 12, `m` 7 |
| kasaba-demirci-tapinak | 21×11 | — |  | `s` 61, `x` 27, `a` 16, `g` 11, `m` 4 |
| kasaba-han | 21×11 | — |  | `s` 74, `x` 22, `a` 14, `g` 9, `r` 3, `m` 1 |
| kasaba-lagim | 21×11 | 10 |  | `s` 32, `x` 10 |
