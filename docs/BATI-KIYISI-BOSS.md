# Batı Kıyısı ve boss paketi (Kuyruk 33)

## Batı Kıyısı Serüven sayfası

- Sayfa `bati-kiyisi` (`data/seruven.json`), arka plan `public/kita/kita-bati.webp` (2752×1536, oran veriden `boyut`).
- Sıra: Çöl çıkışı (y 0,46) → Batı Kıyısı girişi (1,00; 0,46) → Kral Kalesi (0,73; 0,20) → Beyaz Şehir (0,42; 0,33) → Liman (0,27; 0,72) → Derinlikler girişi (0,62; 0,74; sayfa çıkışı).
- Yerleşim düğümleri (`yerlesim`, `ad`): savaş başlatmaz, ödül/dinlenme yok; bilgi kartı "Yerleşim: savaş haritası henüz yok", Game Master (Serüven kuralları açıkken) "Yakında" etiketi ve K34 notu. Yolu kapatmaz: açılış kuralında geçilmiş sayılır. K34'te `yerlesim` kimliğiyle kart verisi (Kale önü → avlu → taht salonu…) bağlanacak.
- Çöl bitmeden (Gemi Enkazı + Sütun Harabesi) batıya geçilmez; "Serbest gezinti" anahtarı artık sayfa çıkışlarını da açar.
- Düğüm aracı (`#dugum`) ve `npm run seruven-dugum -- bati-kiyisi <düğüm|giris|cikis> x y` sayfayı tanır.
- Veri ve kod Serüven ekranının tembel parçasında (`SeruvenScreen`); ana parçaya yalnızca TR metinleri girer.

## Boss paketi (kural sürümü 11)

Kod `src/battle/boss.ts` (+ `ai.ts` `bossFlightMove`), veri `data/efsanevi.json`, harita kuralı `harita/volkan/volkan-boss.json` (`uyuyan-ejderha` varyantı `lairEruption`). Savaş motoru zaten tembel parçada (ana parça değişmez).

| Mekanik | Game Master anahtarı | Ne yapar |
|---|---|---|
| Efsanevi eylemler | `legendaryActions` (global, açık) | Boss başka bir yaratığın turunun hemen ardından bir kullanım harcar (olay `legendary_used`), kendi turunun başında yenilenir (`legendary_refresh`). SRD 5.2.1: Adult/Ancient Red Dragon 3 kullanım; Fiery Rays (Scorching Ray: 3/4 ışın, büyü saldırısı, 2d6 ateş; turda bir) ve Pounce (tek Rend). Yuvadaki Wyrmling/Young ejderhaya ev kuralı: 3 kullanım, yalnızca Pounce. |
| İn olayı | `lairEruption` (Volkan, açık) | Tur başında (inisiyatif 20) uyanık boss, yerdeki parti üyelerinden en çok 2'sinin altıgeninde lav püskürtür: DEX DC 15, 3d6 ateş (yarı), altıgen bir tur alev yüzeyi. |
| Uçan boss yapay zekâsı | `bossFlight` (global, açık) | Eylemini harcayan uçan boss kalan hareketiyle yer düşmanlarının erişiminden kalkar; lav üstü tercih edilir (uçan lava düşmez), en yakın düşmana 6 altıgen içinde kalır. Eylemden önce normal karar (yaklaşmak = inmek). |

- Hepsi yalnızca yeni savaşlarda (`kuralSurumu` ≥ 11); eski kayıt ve replay birebir aynı. Kayıt v20 (yeni olay türleri isteğe bağlı alanlar).
- Savaş ekranında boss kartı: kalan efsanevi eylem / toplam, eylem adları; in olayı satırı.
- Kısmi: Pounce'un yarım hız hareketi yok (yalnızca erişimdeki düşmana saldırı); Commanding Presence (Command) yok; Legendary Resistance yok; "in'de 4 kullanım" yok; ejderha her zaman havada sayılır (iniş/kalkış ayrı durum değil).
