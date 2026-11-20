# Dragonborn pul deseni v2: önizleme raporu

Durum: **6 jetonda denendi, 264'e çıkarılmadı.** Oyuna bağlanmadı; `public/`, `data/` ve v1 klasörü değişmedi.
Üretim: `python scripts/dragonborn-desen-v2.py` (yalnız bu klasöre yazar, ≈ 15 sn).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `ozet.png` | 6 jeton × 10 soy, sonra (128 px) |
| `<jeton>.png` | 10 soy × orijinal / önce (oyundaki çarpma filtresi) / sonra, 256 px (2× gösterim) + 64 ve 96 px önce/sonra |
| `maske-<jeton>.png` | yeni maske (macenta) |
| `olcum.json` | parametreler, jeton başına ten tonu ve boyanan piksel |

Jetonlar: kadın Wizard WZ-B1, erkek Fighter ID4, erkek Barbarian ID2, kadın Monk ID1, erkek Ranger ID4 (kanat + yavru ejderha), kadın Fighter ID4 (çıplak kol/karın).

## Yöntem

- **A) Maske:** Ten tonu her jetonun kendi başından örneklenir (Lab tonu 289–308°, jetona göre değişiyor). Aday pikseller: tona ±16° yakın, kroma tenin 0,3–2,4 katı, ayrıca çok açık parlamalar. Ardından 3×3 kapama, 40 pikselden küçük ve koyu (ortalama L* < 62) bileşenler atılır, 160 pikselden küçük kapalı delikler doldurulur. İçeri çekme yok. Koyu kontur (L* < 42), göz ve ağız (doygun sıcak) ve sarımsı gri boynuz boyanmaz. Göğüs, karın, kollar, bacaklar, kuyruk ve kanat zarı tek parça.
- **B) Boyama:** Parlaklık korunur. L* tenin ortancasına göre farkıyla hedef orta tona taşınır, ton ve kroma tablodaki orta tondan alınır (uç ışık ve gölgede kroma en çok %40 düşer). Kas ve gölge detayı kalıyor.
- **C) Doku:** v1 karosu (pul 8 px), yalnız L* modülasyonu: koyu −5 / orta 0 / açık +5. Gümüş ve Beyaz'da koyulaştırma yönünde: 0 / −3 / −6. Siyah çizgi ve kavşak noktası yok.

## Sonuç (6 jeton)

| Jeton | Durum |
|---|---|
| erkek Fighter ID4 | temiz: göğüs ve karın bütün, kenar halkası yok |
| erkek Barbarian ID2 | temiz (buz ve ateş kolu büyü efekti, boyanmıyor) |
| kadın Monk ID1 | temiz |
| kadın Wizard WZ-B1 | temiz (cübbenin açık astarı boyanmıyor) |
| kadın Fighter ID4 | **sızıntı:** pantolonun açık gri kemeri boyanıyor |
| erkek Ranger ID4 | **sızıntı:** kılıç ağzı boyanıyor; kanadın açık zar panelleri boyanmıyor; yavru ejderha da boyanıyor (istenip istenmediği karar) |

- v1'deki dört sorun kalktı: gövde kesilmesi, beyaz kenar halkası, düzleşen gölge ve "balık ağı" yüz.
- Beyaz soyda sonuç orijinale çok yakın: hedef orta ton tenin kendisine yakın, pul ancak yakından seçiliyor.
- 64 px'te pul dokusu belirsizleşiyor, renk ve gölge kalıyor. 96 px'te pul seçiliyor.
- Oyundaki çarpma filtresi (önce) az doygun her pikseli boyuyor: siyah cübbe ve pantolonlar da renge kayıyor. Yeni yöntemde kıyafet olduğu gibi kalıyor.

## Karar için

1. 6'nın 4'ü temiz, 2'sinde jetona özgü küçük sızıntı var. Kurala göre bu iki jeton beyaz kalır. 264 jetona çıkılırsa her jetonda sızıntı denetimi (v1'deki gibi elle inceleme + liste) gerekecek; o tur ayrı iş.
2. Ya da plan gereği Dragonborn'da oyundaki düz renk çarpma filtresi kalır, pul dokusu release sonrasına.
