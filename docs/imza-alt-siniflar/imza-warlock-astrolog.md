# Astrolog / Astrologer: Warlock imza alt sınıfı (ev kuralı, taslak v1, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_astrolog")`, varsayılan KAPALI. Ad ve metin özgün; güç bütçesi SRD Warlock alt sınıfı (Fiend Patron) ile kıyaslanır.
- Seçim 3. seviyede; özellikler **3 / 6 / 10 / 14** (Warlock'ta alt sınıf özellikleri). DC = 8 + yeterlilik + CHA.
- Evren içi: uzak bir yıldızla sözleşme yapmış gökyüzü okuyucuları; yazgıyı yıldızlardan okur, bir kısmını bükerler. Yurt kullanılmaz (yurt ırka bağlı).
- Özgünlük: gök cisimleri ve kehanet serbest tema; takımyıldız biçimine girme (Circle of the Stars), önceden atılmış zarlar (Portent) ve Celestial Patron'un özellikleri KULLANILMADI. Yıldız Falı, Yazgı Değişir, Kuyruklu Yıldız ve Yazgı Mührü özgün mekaniklerdir.

## Kimlik
Yıldızları okuyup yazgıyı büken büyücü: dostlarına uğur, düşmanlarına uğursuzluk dağıtır; gökyüzü açıkken tehlikelidir, yer altında kör kalır.

## Genişletilmiş büyü listesi (SRD büyüleri; varlığı CC doğrular)
Seviye 1: Guiding Bolt, Faerie Fire · Seviye 2: Augury, Moonbeam · Seviye 3: Clairvoyance, Daylight · Seviye 4: Divination, Guardian of Faith · Seviye 5: Scrying, Flame Strike. SRD'de olmayan çıkarsa en yakın SRD büyüsüyle değiştir ve raporla.

## Açık gökyüzü kuralı
S10 ve S14 yalnız **açık gökyüzü** altında çalışır (harita ortamı verisinde açık hava/dış mekân; iç mekân, mağara, Derinlikler ve kapalı salonlar hariç). Gece ya da gündüz fark etmez. Kapalı alanda bu özellikler kapalıdır (bedel). Parametre: `acikGokyuzuOrtamlari` (JSON listesi).

## Özellikler (TR / EN; sayılar JSON parametresi)
- **S3 · Yıldız Falı / Star Reading** (bonus eylem; yeterlilik bonusu kadar kullanım, kısa dinlenmede yenilenir): 60 ft içinde bir yaratığı seç. Dostsa 2 tur boyunca ilk saldırı, kurtulma ya da beceri zarını avantajla atar ("Uğurlu"). Düşmansa WIS kurtulması atar; başarısızsa aynı süre ilk zarını dezavantajla atar ("Uğursuz"). Zar atıldığında etki biter.
- **S3 · Gök Rehberi / Sky Guide:** Arcana ya da Survival'da yeterlilik kazanırsın (birini seç). Gece açık havada geçen uzun dinlenmeden sonra tüm partin 1 Motivasyon kazanır (Motivasyon sistemi açıksa); serbest gezintide gece yürüyüşünde yön kaybı olmaz.
- **S6 · Yazgı Değişir / Fate Turned** (tepki; uzun dinlenmede 1): 60 ft içinde bir dost, kendisine isabet eden bir saldırıdan sonra "yazgı böyle değildi" dersin: saldırı iskalanmış sayılır. Bedel: sonraki turunun sonuna dek kendi saldırı zarlarında dezavantajlısın.
- **S10 · Kuyruklu Yıldız / Comet** (eylem; kısa dinlenmede 1; açık gökyüzü gerekir): 120 ft içinde bir noktaya yıldız düşür: 20 ft yarıçaplı alandaki yaratıklar DEX kurtulması atar; başarısızlıkta 6d10 ışıltı hasarı (başarıda yarısı).
- **S14 · Yazgı Mührü / Seal of Fate** (eylem; uzun dinlenmede 1; açık gökyüzü gerekir; 3 tur): 60 ft içinde bir düşmanı mühürlersin (WIS kurtulması; efsanevi hedefte başarılı kurtulma süreyi 1 tura indirir, mühürlenmez demez). Mühürlü düşmana: her turun ilk saldırısı kendiliğinden isabet eder (kritik sayılmaz), düşman kurtulma zarlarını CHA modifiyesi kadar düşük atar, ve onu hedef alan dostların saldırıları yeterlilik bonusu kadar hasar ekler.

## Oyuncuya görünen metin (sade)
- **Genişletilmiş büyüler (3):** Işık, ay ve kehanet büyüleri listene eklenir.
- **Yıldız Falı (3):** Bir dostuna uğur, bir düşmanına uğursuzluk getir: ilk zarı daha iyi ya da daha kötü gelir.
- **Gök Rehberi (3):** Arcana ya da Hayatta Kalma becerilerinden birinde ustasın. Yıldızlı gecede dinlenmek partinin cesaretini artırır, yolunu şaşırmazsın.
- **Yazgı Değişir (6):** Bir dostuna isabet eden saldırıyı iskaya çevirirsin; karşılığında sonraki turunda vurmak zorlaşır.
- **Kuyruklu Yıldız (10):** Açık havada gökten yıldız düşür: alandakiler ışıkla yanar. Kapalı yerde çalışmaz.
- **Yazgı Mührü (14):** Açık havada bir düşmanın yazgısını mühürle: ona vurmak kolaylaşır, o ise zor kurtulur.

## Motor ihtiyaçları
- "Uğurlu/Uğursuz": mevcut avantaj/dezavantaj bayrağı, bir zar sonrası düşen süreli etki.
- Yazgı Değişir: tepki; isabet sonrası iskalama kancası (Shield/Parry türü mevcut kanca) + kendine dezavantaj bayrağı.
- Açık gökyüzü: harita ortam verisinde dış mekân bayrağı (CC mevcut ortam alanını kontrol eder; yoksa küçük bir bayrak ekler).
- Kuyruklu Yıldız: R4 alan şekilleri (planlı) ve DEX kurtulma + ışıltı hasarı.
- Yazgı Mührü: otomatik isabet (nat-20 sayılmaz), hedef kurtulmalarına ceza, hedefe saldıran dostlara ek hasar bayrağı.
- Gök Rehberi: Motivasyon bağlantısı K48 sonrası; serbest gezinti kuralı yalnız bayrak.
- Alt sınıf seçilince sınıf özellikleri değişmez.

## Denge
Fiend Patron ile 100 tohum, ±5 puan. Risk: açık gökyüzü haritalarda çok güçlü, kapalıda zayıf; ölçüm iki ortam tipinde ayrı yapılır ve ortalama alınır (dış mekân/iç mekân oranı bölge dağılımına göre). Yazgı Mührü + Kuyruklu Yıldız aynı savaşta çok yıkıcı olabilir; kullanım sınırları ilk ayar noktası.

## Açık sorular (varsayılan yazıldı)
1. Açık gökyüzü bedeli kalsın mı (varsayılan evet)?
2. Sanat: simge (yıldız/pusula) ve renk; ilk sürümde mevcut Warlock jetonu yeter.
