# Harita Öğretisi / Doctrine of the Map: Wizard imza alt sınıfı (ev kuralı, taslak v1, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_harita_ogretisi")`, varsayılan KAPALI. Güç bütçesi SRD Wizard alt sınıfı (Evoker) ile kıyaslanır.
- Wizard alt sınıf seviyeleri 2 / 6 / 10 / 14; alt sınıf 3. seviyede seçilir, S2 özellikleri 3'te açılır (etkin seviye = max(seviye,3)). DC = 8 + yeterlilik + INT.
- Evren içi: araziyi bir kitap gibi okuyup yeniden yazan haritacı büyücüler. Yurt kullanılmaz; her ırktan seçilebilir.
- Oyunun kendi sistemlerine dayanır: yüzey etkileşimleri (`yuzey-etkilesim.json`), zor zemin, geçici engel hex'i (planlı), itme/çarpma. Ad ve metin özgün.

## Kimlik
Savaş alanını bir sayfa gibi çeviren büyücü: zemini değiştirir, duvar çizer, dostlarının yerini değiştirir. Gücü hasardan çok yerleşimden gelir.

## Özellikler (TR / EN; sayılar JSON parametresi)
- **S2 (3'te açılır) · Arazi Okuma / Read the Land:** Nature ya da Survival'da yeterlilik. Serbest gezintide keşif yarıçapın %50 artar (sis açma; K46 sis sistemi). Savaşın başında 60 ft içindeki zemin türlerini ve tehlikeli yüzeyleri (lav, zehir, buz, çukur) ilk turunda kendiliğinden bilirsin.
- **S2 · Mevzi İşareti / Mark the Ground** (bonus eylem; yeterlilik bonusu kadar, uzun dinlenmede yenilenir): 60 ft içinde en çok 3 bitişik altıgen işaretlersin (10 tur). İşaretli altıgendeki dostlar zor zemin ve zemin hasarı (yüzey etkisi) yok sayar ve kurtulma zarlarına +1 alır.
- **S6 · Zemin Yeniden Yaz / Rewrite the Ground** (eylem; INT modifiyesi kadar, uzun dinlenmede yenilenir): 20 ft yarıçaplı alanın zemin türünü 10 tur değiştirirsin: (a) zor zemine çevir (düşmanı yavaşlat), (b) zor zemini ve zemin tehlikesini temizle (dost), (c) buz/çamur/taş yüzey etkisi ver (mevcut yüzey etkileşimi sistemi). Hedef kurtulması yok; alandaki yaratıklar tehlikeli zemin kuralına tabidir.
- **S10 · Çizili Duvar / Drawn Wall** (eylem; uzun dinlenmede 2; geçici engel hex'i): 60 ft içinde en çok 3 bitişik altıgene 10 tur dayanan bir engel çizersin. Her engel altıgeni 30 HP, AC 12'dir; geçilemez. Yaratığın üzerine çizilemez. Düşman yeniden çizim ya da hasarla yıkar.
- **S14 · Kuşbakışı Plan / Bird's-Eye Plan** (eylem; uzun dinlenmede 1; 10 tur): Savaş alanını tepeden görürsün. Her turun başında 60 ft içindeki isteyen iki dostun (ya da senin ve bir dostun) yerini değiştirirsin (fırsat saldırısı doğurmaz; isteksiz hedef WIS kurtulması atar). Dostların zor zemin ve zemin tehlikelerini yok sayar. Sen etkisiz kalmadıkça sürer.

## Oyuncuya görünen metin (sade)
- **Arazi Okuma (3):** Doğa ya da Hayatta Kalma'da ustasın. Haritada daha uzağı keşfedersin, savaşta tehlikeli zeminleri baştan bilirsin.
- **Mevzi İşareti (3):** Birkaç altıgeni işaretle: üzerindeki dostlar zemin engellerinden etkilenmez, daha dirençli olur.
- **Zemin Yeniden Yaz (6):** Bir alanın zeminini değiştir: düşmanı yavaşlat ya da dostlarının yolunu aç.
- **Çizili Duvar (10):** Yere duvar çiz: geçici bir engel yükselir.
- **Kuşbakışı Plan (14):** 10 tur boyunca savaşı tepeden yönet: dostlarını her tur istediğin gibi yerleştirirsin.

## Motor ihtiyaçları
- Zemin türü bilgisi ve yüzey etkileşimi (mevcut); alan içinde geçici zemin değiştirme (planlı "kalıcı zemin etkisi" sisteminin süreli sürümü).
- Geçici engel hex'i (planlı sistem): HP/AC'li engel, yok olma süresi.
- Dostların yerini değiştirme: hareketsiz konum takası kancası (fırsat saldırısı yok).
- Zemin hasarı/zor zemin yok sayma bayrağı (mevcut durum bayrağı benzeri).
- Keşif yarıçapı çarpanı: K46 sis sistemi parametresi.
- Savaş başında zemin tehlikesi gösterimi: arayüz işaretleri (mevcut yüzey katmanı).

## Denge
Evoker ile 100 tohum, ±5 puan (S2/S6/S10/S14). Risk: hasar yok, bu yüzden "kazanma oranı" ölçümü kontrol/konum etkisini ölçer; çok zayıf çıkarsa Çizili Duvar kullanımı ve Kuşbakışı süresi artar, çok güçlüyse engel HP/süre kısılır. Yüzey sistemine bağlı olduğu için K48/K49 sonrası ayrı kuyrukta yapılır.

## Açık sorular (varsayılan yazıldı)
1. Sanat: simge (harita/pusula) ve renk; ilk sürümde mevcut Wizard jetonu yeter.
