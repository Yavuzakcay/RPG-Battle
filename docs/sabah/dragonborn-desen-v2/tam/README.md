# Dragonborn pul deseni v2: 264 jeton (onay bekliyor)

Oyuna bağlanmadı; `public/` ve `data/` değişmedi. Bütün jetonlar boyandı. Sızıntı şüphelisi jetonlar dışarıda bırakılmadı ve eski filtreye döndürülmedi; yalnız kırmızı çerçeveyle ve kodla işaretlendi. Elle düzeltme yok.
Üretim: `python scripts/dragonborn-desen-v2.py --tam` (≈ 5 dk; yalnız bu klasöre yazar).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `<soy>-01.webp` … `<soy>-09.webp` | 10 soy × 264 jeton kontak sayfaları: 4 sütun, 256 px, jeton adı altta; şüpheliler kırmızı çerçeve ve kod (WebP %90) |
| `savas-64.webp` | 64 px savaş boyutu: satır = jeton (iki blok), sütun = orijinal + 10 soy |
| `suphe.json` | jeton başına şüphe kodları, ölçüler ve maske bilgisi |
| `renk-tablosu.md` | renk tablosu önce/sonra ve oyundaki tabloyla çelişenler |

Soy dosya adları: siyah, mavi, pirinc, bronz, bakir, altin, yesil, kirmizi, gumus, beyaz. Klasör ≈ 38 MB.

## Yöntem (6 jetonluk v2 ile aynı, iki ek)

- Maske, boyama ve doku: `../README.md` (ten tonu jetonun kendi başından; parlaklığı koruyan ton + doygunluk; pul 8 px, ±5 L*, Gümüş/Beyaz'da koyulaştırma).
- **Yoldaş çıkarma:** maskede çevresi ten olan küçük, doygun sıcak küme göz sayılıyor. Başın üst %30'unda, asıl başın merkezinden 45 px'ten uzak bir göz yoldaşın gözü kabul ediliyor; o göze daha yakın, en çok 45 px uzaktaki maske pikselleri çıkarılıyor. 264 jetonda yalnız iki Ranger ID4'te tetikleniyor. Yavru ejderhanın başı çıkıyor; kadın Ranger'da gövdesinden ince bir kalıntı kalıyor (YO).
- **Şüphe ölçütleri** (yalnız rapor; eşikler `suphe.json` `esikler`):
  - **TD:** boyanan bir parçanın (≥ 15 px) %40'ından azı jetonun kendi ten tonunda; toplam ≥ 60 px.
  - **AB:** maskeye bitişik, boyanmamış, açık ve soğuk tonlu (L* > 70, kroma < 10, b* ≤ 0) parçalar; ≥ 60 px'lik parçaların toplamı ≥ 100 px. Boynuz sarımsı olduğu için sayılmıyor.
  - **KP:** 25 px'ten küçük ayrık boyalı parça sayısı ≥ 12.

## Sonuç

Şüpheli: **89 / 264**. Bir jeton birden çok kod taşıyabilir.

- **MY** (13) Maske yok: başta ten örneği bulunamadı, boyanmadı (beyaz kaldı): `erkek-druid-ID4`, `erkek-rogue-ID4`, `erkek-sorcerer-SC-3`, `erkek-sorcerer-SC-5`, `erkek-warlock-WL-4`, `kadin-cleric-ID6`, `kadin-druid-ID4`, `kadin-fighter-ID8`, `kadin-rogue-GR`, `kadin-rogue-ID4`, `kadin-sorcerer-SC-3`, `kadin-sorcerer-SC-5`, `kadin-warlock-WL-8`
- **TD** (57) Ten tonu dışı boyalı parça (kıyafet, eşya, diş olabilir): `erkek-barbarian-ID1`, `erkek-barbarian-ID8`, `erkek-barbarian-ID9`, `erkek-cleric-ID3`, `erkek-cleric-ID5`, `erkek-cleric-ID6`, `erkek-cleric-ID7`, `erkek-fighter-ID11`, `erkek-fighter-ID2`, `erkek-fighter-ID7`, `erkek-fighter-ID9`, `erkek-monk-ID2`, `erkek-monk-ID7`, `erkek-monk-ID8`, `erkek-monk-ID9`, `erkek-paladin-ID2`, `erkek-paladin-ID4`, `erkek-paladin-ID5`, `erkek-paladin-ID6`, `erkek-paladin-ID7`, `erkek-paladin-ID8`, `erkek-ranger-ID1`, `erkek-rogue-ID3`, `erkek-rogue-ID7`, `erkek-warlock-WL-10`, `erkek-warlock-WL-2`, `erkek-warlock-WL-9`, `erkek-wizard-WZ-A1`, `erkek-wizard-WZ-A3`, `erkek-wizard-WZ-A6`, `erkek-wizard-WZ-B5`, `kadin-barbarian-ID1`, `kadin-barbarian-ID7`, `kadin-barbarian-ID9`, `kadin-bard-ID8`, `kadin-cleric-ID1`, `kadin-cleric-ID2`, `kadin-cleric-ID5`, `kadin-cleric-ID7`, `kadin-druid-ID7`, `kadin-fighter-GR`, `kadin-fighter-ID10`, `kadin-fighter-ID3`, `kadin-fighter-ID9`, `kadin-monk-ID9`, `kadin-paladin-ID10`, `kadin-paladin-ID2`, `kadin-paladin-ID4`, `kadin-paladin-ID7`, `kadin-rogue-ID3`, `kadin-warlock-WL-10`, `kadin-warlock-WL-2`, `kadin-warlock-WL-9`, `kadin-wizard-WZ-A1`, `kadin-wizard-WZ-A3`, `kadin-wizard-WZ-A6`, `kadin-wizard-WZ-B5`
- **AB** (23) Maskeye bitişik, boyanmamış açık bölge (kanat zarı, açık kıyafet olabilir): `erkek-barbarian-ID4`, `erkek-cleric-ID1`, `erkek-cleric-ID3`, `erkek-cleric-ID5`, `erkek-fighter-ID2`, `erkek-monk-ID2`, `erkek-paladin-ID4`, `erkek-paladin-ID5`, `erkek-paladin-ID8`, `erkek-ranger-ID4`, `erkek-sorcerer-SC-7`, `erkek-warlock-WL-10`, `erkek-wizard-WZ-A6`, `kadin-barbarian-ID1`, `kadin-barbarian-ID4`, `kadin-barbarian-ID7`, `kadin-barbarian-ID8`, `kadin-fighter-ID3`, `kadin-fighter-ID7`, `kadin-monk-ID9`, `kadin-ranger-ID4`, `kadin-warlock-WL-10`, `kadin-warlock-WL-11`
- **KP** (18) Çok sayıda küçük ayrık boyalı parça (12+ parça < 25 px): `erkek-barbarian-ID3`, `erkek-barbarian-ID6`, `erkek-barbarian-ID7`, `erkek-barbarian-ID8`, `erkek-cleric-ID3`, `erkek-cleric-ID5`, `erkek-warlock-WL-8`, `kadin-barbarian-ID1`, `kadin-barbarian-ID7`, `kadin-cleric-ID3`, `kadin-cleric-ID7`, `kadin-fighter-ID10`, `kadin-fighter-ID3`, `kadin-fighter-ID7`, `kadin-ranger-ID7`, `kadin-sorcerer-SC-7`, `kadin-sorcerer-SC-9`, `kadin-warlock-WL-7`
- **YO** (2) Yoldaş (yavru ejderha) maskeden çıkarıldı; gövdesinden kalıntı olabilir: `erkek-ranger-ID4`, `kadin-ranger-ID4`
- **GI** (2) 6 jetonluk incelemede görülen sızıntı (kemer, kılıç ağzı); ölçütler yakalamıyor: `erkek-ranger-ID4`, `kadin-fighter-ID4`

## Gözlemler

- Kemer ve kılıç ağzı tenle aynı tonda ve ince oldukları için ölçütler bunları yakalamıyor (yalnız GI ile işaretli). 264 jetonda bu türden başka sızıntı da olabilir; kontak sayfalarına göz atmak gerekiyor.
- MY jetonları (kostüm, ruh, iskelet, gölge biçimi ve maskeli yüzler) boyanmadı; oyuna bağlanırsa bunlar için eski filtre ya da hiçbir şey kararı gerekecek.
- 64 px'te renk ve gölge okunuyor, pul dokusu belirsiz.
