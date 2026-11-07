# Hızır Yemini / Oath of Hızır: Paladin imza alt sınıfı (ev kuralı, taslak v1.1, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_yetisen")`, varsayılan KAPALI. Güç bütçesi SRD Paladin alt sınıfı (Oath of Devotion) ile kıyaslanır.
- Seçim 3. seviyede; özellikler **3 / 7 / 15 / 20**. DC = 8 + yeterlilik + CHA.
- **İlham (yalnız tasarım notu):** Türk halk kültüründeki "tam sıkıştığında yetişen gizemli yardımcı" motifi (Hızır'a atfedilen "imdada yetişme" geleneği). Kullanıcı kararı (2026-11-05): Hızır adı kullanılabilir (halk kültürüne ait; Türkiye'de ambulans hizmetine de "Hızır" adı verilmiş). Ad alt sınıfta "Hızır Yemini" olarak geçer; özellik adları ve metinler özgündür (Yetişen Mucize, Tam Zamanında vb.). Hızır oynanabilir ya da konuşan karakter olarak betimlenmez, yalnız yemin adı ve teması olur. Mağaza/avukat taramasında yine de dinî ad notu olarak işaretlenir.
- Evren içi: yolda kalmışa yetişen, adını söylemeyen gezgin muhafızların yemini. Yurt kullanılmaz; her ırktan seçilebilir.

## Kimlik
Kimse çağırmadan, tam gerektiğinde beliren paladin: ölümün eşiğindeki dostun yanında bitiverir, yükü paylaşır, sonra sessizce yoluna devam eder.

## Yemin büyüleri (SRD; varlığı CC doğrular)
Seviye 1: Healing Word, Sanctuary · Seviye 2: Aid, Misty Step · Seviye 3: Haste, Beacon of Hope · Seviye 4: Freedom of Movement, Death Ward · Seviye 5: Mass Cure Wounds, Greater Restoration. Her büyü, büyü seviyesine erişildiğinde açılır.

## Özellikler (TR / EN; sayılar JSON parametresi)
- **S3 · Kanal Gücü: Tam Zamanında / Just in Time** (tepki): 15 ft içinde (K59: 60 → 30, K60: 30 → 15) bir dost saldırıya uğrarken (isabet zarından önce) yanına ışınlanırsın (hedefin 5 ft yanına) ve saldırı sana yönelir; saldırı sana atılır ve isabet ederse hasarın yarısını sen alırsın (parametre `hasarPayi: 0.5`). Işınlanma altyapısı (planlı).
- **S3 · Muhtaç Sezgisi / Sense of Need:** 120 ft içinde 0 HP'de ya da Çökmüş (Motivasyon 0) olan dostları her zaman bilirsin (haritada belirir). Elle Şifa'yı bu dostlara bonus eylemle uygulayabilirsin ve şifa verdiğin Çökmüş dost 1 Motivasyon kazanır (sistem açıksa).
- **S7 · Dar Gün Aurası / Aura of Hard Times:** 10 ft aura (S18 benzeri büyümez): aura içindeki dostların canı yarının altındaysa ölüm kurtulma zarlarını avantajla atar ve her turun başında CHA modifiyesi (en az 1) geçici can kazanır. Sen etkisiz kalmadıkça sürer.
- **S15 · Yetişen Mucize / Miracle in Time** (tepki; uzun dinlenmede 1): 120 ft içinde bir dost ölümcül hasar alacakken yanına ışınlanır, hasarı kesersin: dost 1 HP'de kalır ve Motivasyonu tam dolar (sistem açıksa); hasarın yarısı sana geçer (en çok seviyen × 3).
- **S20 · Yetişen Yol / The Hastening Road** (eylem; uzun dinlenmede 1; 10 tur): Aura 30 ft olur. Her turun başında 60 ft içindeki bir dostun yanına ışınlanabilirsin (hareketinden harcamaz). Aura içindeki dostlar tüm hasar türlerine dirençli olur, sen ise tur başına bir kez dostlardan birinin aldığı hasarı kendi üzerine alabilirsin.

## Oyuncuya görünen metin (sade)
- **Yemin büyüleri (3):** İyileştirme ve koruma büyüleri listene eklenir.
- **Tam Zamanında (3):** Bir dostuna vurulurken yanına belirir, vuruşu sen karşılarsın.
- **Muhtaç Sezgisi (3):** Yere düşen ya da cesareti tükenen dostlarını her yerde bilirsin; onları hemen iyileştirebilirsin.
- **Dar Gün Aurası (7):** Zor durumdaki dostların ölüme daha dirençli olur ve geçici can kazanır.
- **Yetişen Mucize (15):** Ölecek dostunun yanına yetişir, ölümü engellersin.
- **Yetişen Yol (20):** 10 tur boyunca her an dostlarının yanındasın; hepsi daha dirençli.

## Motor ihtiyaçları
- Işınlanma: büyü altyapısı (planlı) ışınlanma kancası; saldırı yeniden hedefleme (isabet zarından önce) tepkisi.
- Çökmüş/0 HP dostları haritada işaretleme (hedef sezgisi); Motivasyon bağlantısı K48 sonrası.
- Hasar bölüşme: mevcut Ortak Can/hasar paylaşım altyapısı değil, tek seferlik hasar kısma kancası.
- Aura: mevcut Paladin aurası; Yetişen Yol tur başı ışınlanma.

## Denge
Oath of Devotion ile 100 tohum, ±5 puan (S3/S7/S15/S20). Risk: Tam Zamanında + Yetişen Mucize dostları fazla dayanıklı yapar; kullanım ve hasar payı ayar noktası. Parti kurulumunda tek Yetişen paladini.

## Açık sorular (varsayılan yazıldı)
1. EN adı: "Oath of Hızır" (varsayılan) mı, "Oath of the Timely Aid" mı? Mağaza taramasında dinî ad notu.
2. Sanat: simge (el/yol) ve renk; ilk sürümde mevcut Paladin jetonu yeter.
