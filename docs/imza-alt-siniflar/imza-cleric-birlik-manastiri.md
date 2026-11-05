# Birlik Manastırı / Unity Monastery: Cleric imza alt sınıfı (v2.2, tamamen özgün, taslak 2026-11-05)

## Çerçeve
- Ev kuralı DEĞİL: kullanıcı kararıyla Cleric'in imza alt sınıfı; eski "Barış Alanı" (dış paket) kaydının yerine geçer. K49 adı "Birlik Manastırı" yapar; özellikleri bu belgeye göre yeniden yazar. Kimlikler/kayıtlı karakterler bozulmasın (eski özellik metinleri yeni sürümle değişir, kural sürümü gerekirse CC seçer).
- Seviyeler Cleric düzeninde 1/2/6/8/17; alt sınıf 3. seviyede seçilir, 1–2 birlikte açılır (etkin seviye = max(seviye,3)).
- DC (gerekirse) = 8 + yeterlilik + WIS.
- **Özgünlük taraması:** eski sürümdeki Cesaret Bağı (+1d4 bağ), Huzur Yürüyüşü (2d6+Wis şifa, fırsat saldırısı yok), Güçlü Tılsım (cantrip'e Wis hasarı) ve Barış Azizi (%50 direnç) yayınlanmış bir alt sınıfın özelliklerine çok benziyordu: dördü de atıldı. Yalnız "Ortak Can Havuzu" fikri (kullanıcının kendi tasarımı) kaldı. Özellik adları ve etkiler aşağıda yeni.

## Kimlik
Yükü paylaşan bir manastır: dostlarını birbirine bağlar, acıyı da cesareti de ortak taşır. Güç tek kişiden değil, kalabalığın dayanıklılığından gelir.

## Özellikler (TR / EN; sayılar JSON parametresi)
- **S1 · Bağ Kurma / Forge Bond** (bonus eylem; yeterlilik bonusu kadar kullanım, uzun dinlenmede yenilenir): 30 ft içinde en çok 3 dostu 10 tur boyunca "Bağlı" yaparsın (parametre `bagSayisi`). Aynı anda tek bağ grubu.
- **S1 · Omuz Ver / Lend a Shoulder** (tepki): Bağlı bir dost kurtulma zarında başarısız olursa, 30 ft içindeki başka bir Bağlı dost ona WIS modifiyesi kadar bonus verir. Zar değişir, başarısız kalırsa tepki harcanmaz. Tur başına bir kez.
- **S2 · Kanal Gücü: Teselli Nöbeti / Vigil of Solace:** Bağlı dostların her biri Cleric seviyesi kadar geçici can kazanır ve 1 Motivasyon kazanır (Motivasyon sistemi açıksa).
- **S6 · Birlik Can Havuzu / Shared Vitality** (eylem; uzun dinlenmede 1; 10 tur): Bağlı dostların canı tek bir Ortak Can Havuzunda toplanır; hasar bu havuzdan düşer. Mevcut Ortak Can altyapısı kullanılır. **Bilinçli risk (kullanıcı kararı): havuz sıfırlanırsa havuza bağlı herkes anında ölür** (ölüm kurtulma zarı yok; diriltme büyüleri ya da hizmeti gerekir). Havuz açılırken oyuncuya uyarı gösterilir. Havuzun gücü bu riskin karşılığıdır; ayar için parametre `havuzSonuOlum` (varsayılan açık).
- **S8 · Ortak Şifa / Common Cure:** Bir Bağlı dosta şifa büyüsü yaptığında, diğer Bağlı dostlar WIS modifiyesi kadar can kazanır (havuz açıksa havuza eklenir). Tur başına bir kez.
- **S17 · Yıkılmaz Birlik / Unbroken Union** (tepki; uzun dinlenmede 1): Ortak Can Havuzu sıfıra düşecekken (yani herkesi öldürecek hasar gelirken) havuz Cleric seviyesinin iki katı canla ayakta kalır ve tüm Bağlı dostların Motivasyonu tam dolar. Bu sürede bağ sende toplanır: bağ sayısı 6'ya çıkar (parametre).

## Havuz kuralı (KESİN, kullanıcı kararı 2026-11-05)
- Havuz boyutu = bağlı dostların toplam canı. Kim hasar alırsa hasar havuzdan düşer; şifa ve geçici can da havuza eklenir (havuz en çok toplam azami canı geçemez).
- Havuz 1 HP bile kalsa hepsi ayakta kalır (kendi canı 0 görünse de). Havuz 0 olursa hepsi ölür.
- Bu kural dışında havuz boyutu ayarı yok; denge ölçümü yalnız süre/kullanım/geçici can gibi diğer parametreleri ayarlar.

## Motivasyon ve Ortak Can Havuzu (karar)
- **Motivasyon kişisel kalır** (K48 kararı: karakter başına havuz). Ortak Can Havuzu yalnız HP'dir; Motivasyonu ne doldurur ne boşaltır. HP havuzu ile Motivasyon birbirine karışmaz.
- **Tek bağ:** Havuz açıkken Bağlı dostlar bir **Motivasyon kaybı** yaşarsa kayıp bağlı dostlar arasında eşit bölünür (aşağı yuvarlanır, kalan kaybı yaşayana yazılır). Kazançlar paylaşılmaz (yalnız Teselli Nöbeti ve Yıkılmaz Birlik herkese verir). Böylece birlik, acıyı hafifletir ama zinciri artırmaz.
- Biri Çökmüş (Motivasyon 0, savaşta) olursa havuzdan hasar almaya devam eder (canı havuzda); Çökmüş dost havuz bağından ÇIKARILMAZ. Savaş dışı Moral ölümü bağı keser, havuzdaki payı diğerlerine kalır.
- Sistem kapalıyken (Motivasyon yok): Teselli Nöbeti yalnız geçici can verir, Yıkılmaz Birlik'in Motivasyon kısmı yok sayılır.

## Oyuncuya görünen metin (sade)
- **Bağ Kurma (1):** Yakındaki üç dostunu birbirine bağlarsın, 10 tur sürer. **Omuz Ver:** Bağlı bir dost zar tutturamazsa yanındaki bir dost ona destek olur.
- **Teselli Nöbeti (2):** Bağlı dostların geçici can ve biraz cesaret kazanır.
- **Birlik Can Havuzu (6):** Bağlı dostların canı tek bir havuzda toplanır, hasar havuzdan düşer. Dikkat: havuz biterse bağlı herkes ölür.
- **Ortak Şifa (8):** Birini iyileştirince diğer bağlı dostlar da biraz iyileşir.
- **Yıkılmaz Birlik (17):** Havuz bitecekken ayakta kalır ve herkesin cesareti tazelenir.

## Motor ihtiyaçları
- Bağlı durumu (süreli, 10 tur), Omuz Ver tepki kancası (başarısız save sonrası bonus), geçici can toplu verme, Ortak Can altyapısı (A1, mevcut) + havuz bitince çıkış kuralı ve 1 HP tabanı, havuz sıfırlanınca toplu ölüm kuralı (uyarı ekranıyla) ve sıfır-önleme tepkisi, Motivasyon kaybı bölüştürme kancası (K48 Moral sistemine bağlı; K48'den sonra).
- Alt sınıf seçilince sınıf özelliklerini değiştirme: yok.

## Denge
SRD Cleric alt sınıflarıyla 100 tohum, ±5 puan (S3/S6/S8/S17). Toplu ölüm riski gücü dengeler: ölçümde "havuz bitti, parti öldü" oranı da raporlanır. Risk: Ortak Can Havuzu + Teselli Nöbeti birlikte çok sağlam; ilk ayar noktaları geçici can miktarı, bağ sayısı ve havuz süresi. Parti kurulumunda tek Birlik Manastırı rahibi (havuzlar çakışmaz).

## Açık sorular (varsayılan yazıldı)
1. Motivasyon kaybı bölüşmesi kalsın mı (varsayılan evet)?
2. Seçenek: yer bağı (yurt değil, isteğe bağlı bir manastır konumu).
