# Tiefling: koyu mor/gri tende "yarı boyalı" jetonlar (teşhis ve öneri)

Yalnız teşhis; oyun kodu ve veriler değişmedi. Üretim: `python scripts/tiefling-kalan.py <geçici>` (bkz. `../tiefling-elle-maske/README.md`).

## Ölçüt

Jetonun kendi ten tonu (oyun maskesinin doygun pikselleri) alınıyor. Bu tona ±22° yakın, kroması ≥ 6 ve L* 12–85 olan, oyun maskesine bağlı bileşenler "ten bölgesi" sayılıyor. Bu bölgenin oyunda boyanmayan payı ≥ %30 ve ≥ 250 px ise jeton "yarı boyalı". Boyanmayan piksellerin en az yarısı gri (kroma < 15) ya da koyu (L* < 25) ise türü **koyu/gri**, değilse **parlak/palet dışı**.

- **Koyu/gri: 70 jeton.** Liste aşağıda; hepsi `liste-koyu-gri.png`'de (oyun şimdi | boyanmayan ten camgöbeği).
- Parlak/palet dışı: 26 jeton (`olcum.json`).
- Teni kendisi gri ya da mor olan (ten kroması < 30 ya da ton 270–340°): `kadin-monk-ID10`, `kadin-warlock-WL-8`, `kadin-rogue-ID3`. Listenin geri kalanında kırmızı tenin koyu gölge yarısı boyanmıyor.
- **Uyarı:** ölçüt kaba. Ten tonuna yakın kumaş (kırmızı ceket, zırh) ve hayalet/ölümsüz biçimler de girebiliyor; liste gözle doğrulanmalı.

## 8× önce/sonra (`<jeton>.png`, ilk 8 koyu/gri)

Sütunlar: orijinal / oyun şimdi / boyanmayan ten (camgöbeği) / öneri (oyun maskesi ∪ ten bölgesi, oyunun lch formülü, Abyssal). Üstte 48×48 pencere 8×, altta tam jeton.

## Kroma eşiği neden yetmiyor

1. **Otomatik maske** (`soy-renkleri.json` `tiefling.mask`: C 15–70, palet `bright` 20 en parlak kümeler, ΔE ≤ 7) mutlak eşiklerle çalışıyor. Gri/koyu mor ten C 6–15 ya da en parlak kümelerden uzak koyu tonlarda. Bu pikseller ya kutunun dışında ya palet dışında kalıyor.
2. **TG1 gölge bandı** büyümeyi bitişik maskenin ortalama kroması ≥ `kromaKomsu` 32 ve bileşen kroması 15–70 olunca yapıyor. Bu, zırh/cüppe kenarına taşmayı önlemek için konmuş mutlak bir eşik. Teni kendisi az doygun olan jetonda doğru ten de bu eşiğin altında, büyüme hiç çalışmıyor.
3. Koyu yarı (L* < 25) çizgi mürekkebine yakın; açıklık alt sınırı (`golge` L 18) ve "dış sınırın çoğu mürekkep" koşulu da bazı gölge bileşenlerini eliyor.

## Öneri (kod değiştirilmedi)

- **Göreli eşik:** ırk başına mutlak kroma (15, `kromaKomsu` 32) yerine jetonun kendi ten kromasına göre eşik kullanılsın, ör. `kromaKomsu` = 0,7 × baştan örneklenen ten kroması ve maske alt sınırı = 0,4 × ten kroması (en az 6). Ton penceresi de baştan örneklenen tona ±20° olsun. Kırmızı tende bugünkü değerler değişmez, gri/mor tende eşik kendiliğinden iner.
- **Ya da Dragonborn v2 gibi önceden üretilmiş maske:** ten tonu jetonun kendi başından örneklenip maske dosyası çevrimdışı üretilir (çalışma anı onarım yerine). Kıyafet sızıntısını da (`../tiefling-elle-maske/`) aynı adımda azaltır. Kıyafeti tenle aynı tonda olan az sayıda jetona elle maske gerekir.
- **Hayalet/ölümsüz biçimli jetonlar** (ör. `kadin-monk-ID10` gri ölümsüz, `erkek/kadin-warlock-WL-10` buz ruhu): bilinçli boyamasız bırakılabilir, Dragonborn'daki maskesiz listesi gibi.

| Jeton | Boyanmayan pay | Boyanmayan px | Koyu/gri payı | Boyanmayan kroma (medyan) | Boyanmayan L* (medyan) | Ten kroması |
|---|---:|---:|---:|---:|---:|---:|
| `kadin-monk-ID10` | 99% | 7154 | 100% | 9.1 | 22.9 | 16.2 |
| `erkek-monk-ID3` | 70% | 4922 | 80% | 17.4 | 19.0 | 44.1 |
| `erkek-warlock-WL-6` | 70% | 2835 | 66% | 26.8 | 21.2 | 42.8 |
| `erkek-fighter-ID8` | 64% | 2365 | 54% | 31.3 | 24.0 | 40.2 |
| `kadin-fighter-ID4` | 64% | 4569 | 59% | 35.3 | 24.0 | 48.3 |
| `kadin-fighter-ID5` | 62% | 5381 | 54% | 21.0 | 25.4 | 48.4 |
| `kadin-warlock-WL-8` | 60% | 2588 | 89% | 10.8 | 38.6 | 29.1 |
| `kadin-warlock-WL-7` | 59% | 3791 | 66% | 31.1 | 21.3 | 53.6 |
| `kadin-sorcerer-SC-1` | 56% | 4968 | 56% | 36.7 | 21.8 | 44.3 |
| `kadin-fighter-ID1` | 55% | 3420 | 87% | 14.8 | 23.7 | 45.7 |
| `erkek-monk-ID1` | 52% | 4658 | 77% | 40.9 | 21.5 | 43.3 |
| `kadin-monk-ID3` | 52% | 4619 | 82% | 17.8 | 19.2 | 44.4 |
| `erkek-bard-ID5` | 51% | 4763 | 64% | 34.2 | 21.7 | 41.4 |
| `erkek-bard-ID4` | 50% | 4292 | 98% | 11.1 | 21.1 | 40.8 |
| `kadin-paladin-ID9` | 50% | 3201 | 66% | 37.6 | 18.9 | 45.9 |
| `kadin-fighter-ID8` | 49% | 1431 | 60% | 38.3 | 23.2 | 50.2 |
| `kadin-fighter-ID2` | 47% | 2345 | 73% | 27.8 | 20.6 | 46.0 |
| `kadin-warlock-WL-1` | 47% | 4117 | 78% | 34.1 | 18.2 | 44.7 |
| `erkek-paladin-ID9` | 46% | 3000 | 61% | 37.5 | 20.7 | 43.6 |
| `erkek-warlock-WL-1` | 46% | 3496 | 80% | 30.9 | 18.9 | 44.9 |
| `kadin-ranger-ID9` | 46% | 1969 | 60% | 43.2 | 23.1 | 53.5 |
| `erkek-warlock-WL-4` | 45% | 3713 | 63% | 26.0 | 22.6 | 38.5 |
| `erkek-ranger-ID8` | 43% | 2352 | 80% | 36.2 | 18.4 | 47.1 |
| `kadin-bard-ID4` | 43% | 2754 | 85% | 12.9 | 18.0 | 41.8 |
| `kadin-monk-ID5` | 43% | 2924 | 83% | 22.1 | 21.1 | 43.1 |
| `kadin-rogue-ID3` | 42% | 1652 | 94% | 12.8 | 19.8 | 17.9 |
| `kadin-warlock-WL-2` | 42% | 3570 | 77% | 26.2 | 17.5 | 42.8 |
| `kadin-bard-ID5` | 41% | 2283 | 53% | 32.4 | 25.8 | 42.2 |
| `kadin-fighter-ID10` | 41% | 1951 | 66% | 34.4 | 22.0 | 46.9 |
| `erkek-barbarian-ID3` | 40% | 4209 | 67% | 31.8 | 22.9 | 44.6 |
| `erkek-warlock-WL-2` | 40% | 3334 | 61% | 33.6 | 19.9 | 42.6 |
| `kadin-fighter-ID9` | 39% | 1971 | 67% | 37.6 | 20.8 | 48.6 |
| `kadin-rogue-ID4` | 38% | 1363 | 83% | 34.8 | 18.3 | 47.1 |
| `erkek-monk-ID5` | 37% | 1728 | 67% | 29.5 | 23.0 | 43.9 |
| `erkek-wizard-WZ-B2` | 37% | 1916 | 73% | 33.3 | 18.2 | 45.6 |
| `kadin-fighter-ID7` | 37% | 2040 | 65% | 36.8 | 21.4 | 46.7 |
| `kadin-paladin-ID6` | 37% | 1899 | 68% | 38.8 | 21.4 | 48.1 |
| `kadin-ranger-ID2` | 37% | 1410 | 78% | 34.5 | 22.0 | 50.5 |
| `erkek-barbarian-ID4` | 36% | 3133 | 74% | 23.2 | 21.8 | 42.4 |
| `erkek-monk-ID9` | 36% | 1150 | 59% | 33.0 | 23.2 | 46.0 |
| `erkek-warlock-WL-11` | 36% | 2559 | 74% | 28.8 | 17.9 | 42.9 |
| `erkek-wizard-WZ-A4` | 36% | 1899 | 69% | 39.5 | 19.9 | 48.3 |
| `kadin-ranger-ID5` | 36% | 1643 | 72% | 35.3 | 22.4 | 51.3 |
| `kadin-warlock-WL-11` | 36% | 2854 | 74% | 26.8 | 19.2 | 42.6 |
| `erkek-barbarian-ID5` | 35% | 2726 | 80% | 24.2 | 20.3 | 43.1 |
| `erkek-fighter-ID11` | 35% | 1369 | 79% | 33.9 | 17.7 | 45.7 |
| `erkek-warlock-WL-3` | 35% | 1826 | 90% | 24.7 | 17.9 | 44.4 |
| `female-fighter` | 35% | 1246 | 65% | 35.2 | 21.9 | 45.6 |
| `kadin-monk-ID1` | 35% | 2394 | 76% | 35.3 | 22.1 | 44.0 |
| `erkek-wizard-WZ-A3` | 34% | 2134 | 64% | 45.0 | 23.4 | 44.4 |
| `kadin-fighter-ID6` | 34% | 1398 | 81% | 36.9 | 17.9 | 47.0 |
| `kadin-monk-ID7` | 34% | 2252 | 82% | 26.0 | 19.5 | 43.9 |
| `kadin-rogue-ID9` | 34% | 2066 | 66% | 32.8 | 25.5 | 47.7 |
| `erkek-barbarian-ID9` | 33% | 1931 | 91% | 15.0 | 18.8 | 43.2 |
| `erkek-ranger-ID3` | 33% | 1354 | 65% | 34.9 | 21.6 | 46.8 |
| `kadin-bard-ID7` | 33% | 2189 | 69% | 24.1 | 26.7 | 40.6 |
| `kadin-warlock-WL-9` | 33% | 2411 | 89% | 25.8 | 17.9 | 43.4 |
| `kadin-wizard-GR` | 33% | 1250 | 85% | 29.5 | 21.3 | 43.5 |
| `erkek-barbarian-ID8` | 32% | 3000 | 88% | 16.3 | 18.8 | 42.2 |
| `erkek-druid-ID3` | 32% | 1839 | 97% | 13.1 | 15.9 | 44.7 |
| `erkek-warlock-WL-9` | 32% | 2210 | 82% | 24.3 | 18.5 | 41.9 |
| `kadin-monk-ID2` | 32% | 1737 | 64% | 33.5 | 23.1 | 46.9 |
| `erkek-barbarian-ID6` | 31% | 2659 | 83% | 17.0 | 18.2 | 42.0 |
| `erkek-sorcerer-SC-7` | 31% | 1627 | 60% | 29.9 | 24.0 | 45.5 |
| `kadin-druid-ID3` | 31% | 1557 | 87% | 15.1 | 21.3 | 47.5 |
| `kadin-ranger-ID1` | 31% | 876 | 66% | 38.2 | 21.9 | 52.6 |
| `kadin-sorcerer-SC-8` | 31% | 1557 | 93% | 25.0 | 18.2 | 46.7 |
| `erkek-druid-ID1` | 30% | 1136 | 81% | 37.5 | 17.3 | 45.5 |
| `kadin-rogue-ID6` | 30% | 1934 | 88% | 36.2 | 19.2 | 50.5 |
| `kadin-rogue-ID8` | 30% | 1864 | 91% | 31.5 | 17.8 | 48.0 |
