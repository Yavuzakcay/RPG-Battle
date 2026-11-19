# Dragonborn pul deseni v2: oyuna bağlandı (264 jeton)

Yalnız görünüm; kural ve kayıt sürümü değişmedi. Eski çarpma filtresi bu jetonlarda kaldırıldı.

## Sonuç

- **Boyanan: 249 / 264.** Desen pul maskesine göre basılıyor: baş, kuyruk, eller, kollar, bacaklar, ayaklar, çıplak gövde, kanat zarı. Boynuz, kıyafet ve eşya maskede yok.
- **Beyaz kalan (maskesiz): 15.** Bunlarda desen uygulanmıyor, jeton olduğu gibi gösteriliyor:
- `dragonborn-erkek-druid-ID4`: başta ten örneği yok
- `dragonborn-erkek-monk-ID10`: maske boş (< 30 px)
- `dragonborn-erkek-rogue-GR`: maske boş (< 30 px)
- `dragonborn-erkek-rogue-ID4`: başta ten örneği yok
- `dragonborn-erkek-sorcerer-SC-3`: başta ten örneği yok
- `dragonborn-erkek-sorcerer-SC-5`: başta ten örneği yok
- `dragonborn-erkek-warlock-WL-4`: başta ten örneği yok
- `dragonborn-kadin-cleric-ID6`: başta ten örneği yok
- `dragonborn-kadin-druid-ID4`: başta ten örneği yok
- `dragonborn-kadin-fighter-ID8`: başta ten örneği yok
- `dragonborn-kadin-rogue-GR`: başta ten örneği yok
- `dragonborn-kadin-rogue-ID4`: başta ten örneği yok
- `dragonborn-kadin-sorcerer-SC-3`: başta ten örneği yok
- `dragonborn-kadin-sorcerer-SC-5`: başta ten örneği yok
- `dragonborn-kadin-warlock-WL-8`: başta ten örneği yok
- **Şüpheli (boyalı, dışlanmadı): 76.** Kırmızı çerçeveli; elle inceleme için.
- Yavru ejderha (erkek ve kadın Ranger ID4) maskeden çıkarıldı, boyanmıyor. Kadın Ranger'da yavrunun gövdesinden ince bir kalıntı kalıyor (YO).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `sinif-<sınıf>.webp` (12) | Satır = sınıfın jetonları (erkek + kadın), sütun = orijinal + 10 soy × önce/sonra, 128 px. Önce = eski çarpma filtresi, sonra = pul v2. |
| `supheli-01.webp` … `-08.webp` | Şüpheli jetonlar 256 px: orijinal / Kırmızı / Mavi / Beyaz; kırmızı çerçeve ve kod. |
| `savas-64.webp` | 264 jeton × 10 soy, 64 px (savaş boyutu). |
| `ozet.json` | Boyanan/maskesiz sayısı, şüpheliler ve kodları. |
| `suphe.json` | Şüphe ölçüleri (önceki tur). |
| `renk-tablosu.md` | Renk tablosu önce/sonra ve oyundaki eski tabloyla çelişenler. |

Önizlemeler oyunun kendi koduyla (`src/ui/scaleTint.ts`) üretildi: `npx vite-node scripts/dragonborn-pul-sayfa.ts`. Gerçek tarayıcıda da (`tintedUrl`) aynı yol denendi: maskeli jeton boyanıyor, maskesiz jeton orijinal kalıyor.

## Şüphe kodları

| Kod | Anlamı |
|---|---|
| TD | Ten tonu dışı boyalı parça (kıyafet, eşya, diş olabilir) |
| AB | Maskeye bitişik, boyanmamış açık bölge (kanat zarı, açık kıyafet olabilir) |
| KP | Çok sayıda küçük ayrık boyalı parça |
| YO | Yoldaş (yavru ejderha) maskeden çıkarıldı; kalıntı olabilir |
| GI | Önceki incelemede görülen sızıntı: kadın Fighter ID4 kemeri, erkek Ranger ID4 kılıç ağzı. Tenle aynı tonda ve ince oldukları için ölçütler yakalamıyor |

Kemer ve kılıç ağzı türü sızıntıları ölçütler yakalamadığı için bunlar ancak sınıf sayfalarında gözle görülebilir.

## Oyundaki yol

- Veri: `data/soy-renkleri.json` `dragonborn.lineagesAlt.<soy>` = `{ "pul": { "soy": "<soy>" } }`; ayar, karo ve renkler `data/dragonborn-pul.json`.
- Maske: `public/characters/maske-pul/<jeton>.png` (249 dosya, ≈ 234 kB).
- Üretim: `python scripts/dragonborn-pul-maske.py` (maske + veri).
- Çizim: `src/ui/tint.ts` `tintedUrl` → tembel `src/ui/scaleTint.ts` `scalePixels`.
- Küçük kopyada (96 px rozet) maske ve karo W/256 ölçekli.

Şüpheli jetonların tam tablosu: `supheli-liste.md` (76 jeton; elle düzeltilen 19 jeton yeşil çerçeveli, `../duzeltme/`).

Renk kapısı (pul v2 kapanışı): sayfalar kapı sonrası maskelerle; yöntem, önce/sonra taşma ölçümü ve kapatılan jetonlar `harita/belgeler/DRAGONBORN-PUL-KAPI.md`.
