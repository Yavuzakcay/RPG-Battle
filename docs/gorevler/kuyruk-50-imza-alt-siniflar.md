# Kuyruk K50: 12 imza alt sınıf (ev kuralı)

Başlık: K48 ve K49 `main`'e girdikten sonra başla (K48 Moral sistemi ve Karadul'u getirir, K49 Cleric adlarını yeniden yazar). Yeni dal `wip/k50` (`main`'den). Her alt sınıf ayrı commit; her aşama sonunda commit+push. Soru sorma: en makul kararı ver, `DECISIONS.md`'ye yaz. Goliath dosyalarına dokunma. Kural kaynağı SRD 5.2.1; imza alt sınıflar kullanıcının kendi içeriğidir, çekirdekte yalnız SRD alt sınıfları kalır. Kayıt anahtarlarına ve NOTICE'e dokunma. Yeni kayıt alanları eski kayıtta boş = eski davranış. Ana parça (`index`) 440 kB sınırında: yeni kod `index`'e değil tembel parçalara girsin.

## Kaynak belgeler (hepsi `docs/imza-alt-siniflar/` altında; önce `imza-alt-siniflar.md` dizinini oku)
Fighter İmparator, Bard Şair Koleji, Barbarian Geride Kalanın Yolu, Rogue İnfazcı, Ranger Çiftçi, Cleric Birlik Manastırı, Sorcerer Dunganga, Warlock Astrolog, Monk Yaşlı Bilge Disiplini, Paladin Hızır Yemini, Wizard Harita Öğretisi. Druid Karadul K48'de. Oyuncuya görünen sade metinler `imza-alt-siniflar-tum.md` içinde (kartta bunlar çıkar; TR/EN, "tur" birimi, terimsiz).

## Ortak kurallar
- Her alt sınıf ev kuralı: `data/ev-kurallari.json` + `houseRule("imza_<ad>")`, varsayılan KAPALI; kapalıyken oluşturucuda ve kayıtta görünmez. Ad ve metinler belgedeki gibi (TR/EN). Kimlikler belgedeki `imza_*` adlarıdır.
- Seçim 3. seviyede (etkin seviye = max(seviye,3)); özellik seviyeleri belgelerde. Sayılar JSON parametresi, kodda sabit değil. Belgelerdeki "açık sorular" için yazılan varsayılanı kullan.
- Alt sınıf seçilince sınıf özelliklerini değiştirme (Karadul hariç). Yeni durum ve kancaları mevcut altyapıdan türet; eksikse küçük kanca ekle.
- Her alt sınıf için denge ölçümü: aynı sınıfın SRD alt sınıflarıyla 100 tohum, ±5 puan; sonuçları `harita/belgeler/DENGE.md`'ye ekle. Aşırı sapmada JSON parametrelerini ayarla.
- Testler: ev kuralı kapalıyken görünmez, her özellik, eski kayıt/tekrar oynatma, oluşturucu duman testi.
- Moral sistemine bağlı özellikler (Motivasyon): K48'in `moralSistemi` anahtarı kapalıyken sessizce yok sayılır; kural sürümü gerekirse Moral'den sonraki numarayı al ve `DECISIONS.md`'ye yaz.

## Aşama A (yeni sistem gerektirmez)
Fighter İmparator, Rogue İnfazcı, Ranger Çiftçi, Sorcerer Dunganga (yeni hafif "Uykulu" durumu; Cesaret bağışıklık sayacı), Warlock Astrolog (açık gökyüzü: harita ortam verisinde dış mekân bayrağı; yoksa küçük bir bayrak ekle, `acikGokyuzuOrtamlari` JSON), Cleric Birlik Manastırı (K49'daki yeniden adlandırmayla birlikte: Ortak Can altyapısı yeniden kullanılır; havuz 0 → hepsi ölür kuralı `havuzSonuOlum`, uyarı ekranı).

## Aşama B (K48 Moral sistemi birleşmiş olmalı)
Barbarian Geride Kalanın Yolu (Yıpranma sayacı sistem kapalıyken), Bard Şair Koleji (Motivasyona çalışır), Cleric Birlik Manastırı'nın Motivasyon bölüşmesi ve Teselli Nöbeti kazancı, Monk Yaşlı Bilge Disiplini'nin Sakin Söz ve Son Ders Motivasyon kısımları, Warlock Astrolog'un Gök Rehberi Motivasyon kısmı.

## Aşama C (planlı sistemler gerektirir; mevcut değilse küçük sürümünü yap, raporla)
- **Monk Zihin Gücü:** itme/çarpma altyapısı. Nesne kaynağı Aşama 1: mevcut harita nesneleri + zemin türünden türeyen çevre enkazı (`enkazZeminleri` JSON tablosu); hiç nesne yoksa Monk bir taş "çağırır" ve fırlatır (3d6; ek maliyet yok). Harita verisine dokunma.
- **Paladin Hızır Yemini:** ışınlanma kancası (büyü altyapısı), isabet zarından önce saldırı yeniden hedefleme tepkisi, 0 HP/Çökmüş dostları işaretleme.
- **Wizard Harita Öğretisi:** süreli zemin değiştirme (yüzey etkileşim sistemi), geçici engel hex'i (HP/AC'li), dost yer takası, keşif yarıçapı çarpanı (K46 sis).
Bu aşamada eksik altyapıyı en küçük tam sürümle yaz; yetmeyen özelliği "çalışmıyor" işaretle, raporla, kullanıcı karar versin.

## Sıra ve rapor
A → B → C. Her alt sınıfın sonunda `npm test`, `npm run build`, typecheck, `check:*` temiz; `index` ≤ 440 kB. Sonda kısa rapor: alt sınıf → durum (tam/kısmi), kural sürümleri, denge sonuçları, açık kalanlar.

## Dışı
Alt sınıf sanatı ve özel jetonlar (mevcut sınıf jetonları yeter), Dungeondex girişleri, SRD dışı kitap alt sınıfları, ırk maskeleri.
