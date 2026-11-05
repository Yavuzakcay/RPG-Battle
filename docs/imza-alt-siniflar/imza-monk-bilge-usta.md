# Yaşlı Bilge Disiplini / Elder Sage Discipline: Monk imza alt sınıfı (ev kuralı, taslak v1.1, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_yasli_bilge")`, varsayılan KAPALI. Güç bütçesi SRD Monk alt sınıfı (Warrior of the Open Hand) ile kıyaslanır.
- Seçim 3. seviyede; özellikler **3 / 6 / 11 / 17**. DC = 8 + yeterlilik + WIS.
- **İlham (yalnız tasarım notu):** kullanıcı isteği: küçük, çok yaşlı, sabırlı ve bilge usta tipi (Yoda'dan esinlenme). Kullanıcı kararı (2026-11-05): nesne/yaratık hareket ettirme gibi MEKANİKLER serbest (oyun mekaniği telif konusu değildir), eklendi. Yine de karakterin adı, "The Force" markası/terimi, ışın kılıcı, konuşma tarzı ve görünüşü KULLANILMAZ; özellik adları ve metinler özgün (Zihin Gücü vb.).
- Evren içi: dağ manastırlarında yaşlanıp sabırla ustalaşmış yaşlı öğretmenler. Yurt kullanılmaz; her ırktan seçilebilir.

## Kimlik
Gücü kasından değil sabrından gelen yaşlı usta: rakibin hamlesini bekler, kendi gücünü ona yönlendirir, dostlarını sakinleştirir.

## Özellikler (TR / EN; sayılar JSON parametresi)
- **S3 · Yaşlı Bilgelik / Elder Wisdom:** İçgörü ve Tarih'ten birinde yeterlilik (ya da halihazırda varsa bir başka beceri).
- **S3 · Zihin Gücü / Mind Might** (bonus eylem; 1 Odak Puanı; menzil 30 ft): Bir yaratığı ya da gözetimsiz bir nesneyi zihninle iter ya da çekersin: yaratık (Large ya da küçük) STR kurtulması atar (DC = 8 + yeterlilik + WIS), başarısızsa 10 ft **itilir** (senden uzağa), **çekilir** (sana doğru) ya da yana kaydırılır (yönü sen seçersin); nesne aynı biçimde 10 ft hareket eder ve 50 lb'ye kadar olabilir. Hex haritada itme/çarpma altyapısı kullanılır (çarpma hasarı: duvar/engel 1d6).
- **S3 · Sabır / Patience** (tepki; 1 Odak Puanı): Bir düşmanın yakın dövüş saldırısı sana iskalarsa, tepkiyle silahsız bir saldırı yaparsın (Odak Puanı harcamazsan yalnız yeterlilik bonusu kadar kullanım, uzun dinlenmede yenilenir).
- **S6 · Sakin Söz / Calm Word** (bonus eylem; 1 Odak Puanı): 30 ft içinde bir dost, Frightened ve Charmed durumlarından kurtulur ve 1 Motivasyon kazanır (Motivasyon sistemi açıksa). Kendine de uygulayabilirsin.
- **S11 · Zihin Gücü genişler / Greater Mind Might:** Zihin Gücü'nün menzili 60 ft olur, nesne sınırı 200 lb'ye çıkar. Artık telekinezi gibi çalışır: hareket doğrultusu serbesttir; hedefi (yaratık ya da nesne) menzil içinde 20 ft'e kadar **boş herhangi bir hex'e** taşırsın (yaratık yine STR kurtulması atar; başarısızsa taşınır; havada ya da engelin içinden geçemez, çarpma kuralı geçerli). Ayrıca gözetimsiz bir nesneyi havalandırıp fırlatabilirsin (eylem; 2 Odak Puanı): 60 ft içindeki bir hedefe 3d6 ezme hasarı (DEX kurtulmasıyla yarım).
- **S11 · Çevik Yaşlı / Nimble Elder:** Hızın 10 ft artar ve bir düşmanla 5 ft içindeyken hareket etmen fırsat saldırısı doğurmaz. **Yönlendir / Redirect** (tepki; 2 Odak Puanı): Bir düşman sana yakın dövüş saldırısı yaptığında, saldırı 5 ft içindeki başka bir yaratığa (düşman dahil) yönelir; yeni hedefe yeni isabet zarı atılır.
- **S17 · Son Ders / Final Lesson** (eylem; uzun dinlenmede 1; 10 tur): 30 ft yarıçaplı bir dinginlik alanı; içindeki dostlar kurtulma zarlarına WIS modifiyesi kadar ek alır ve her turun başında 1 Motivasyon kazanır (sınır: tur başına 1, kişi başına). Alandaki düşmanların fırsat saldırıları dezavantajlıdır. Sen etkisiz olmadıkça sürer.

## Oyuncuya görünen metin (sade)
- **Yaşlı Bilgelik (3):** İçgörü ya da Tarih'te ustasın.
- **Zihin Gücü (3):** Zihninle bir düşmanı ya da bir nesneyi iter, çeker ya da yana kaydırırsın.
- **Sabır (3):** Bir düşman sana vurmayı kaçırırsa karşılık verirsin.
- **Sakin Söz (6):** Bir dostunun korkusunu ve büyüsünü dağıtır, cesaretini tazelersin.
- **Zihin Gücü genişler (11):** Daha uzağa, daha ağır şeyleri istediğin yöne taşırsın (telekinezi gibi); bir nesneyi fırlatıp hedefe çarpabilirsin.
- **Çevik Yaşlı (11):** Daha hızlısın, kaçarken vurulmazsın. Bir saldırıyı başka birine yönlendirebilirsin.
- **Son Ders (17):** 10 tur boyunca dostların etrafında dinginlik yayılır: daha dirençli, daha cesur olurlar.

## Motor ihtiyaçları
- Tepki: düşman yakın dövüş iskası → silahsız karşı saldırı (mevcut Reaction + saldırı kancası).
- Calm Word: durum temizleme (mevcut) + Motivasyon kazancı (K48 sonrası; sistem kapalıyken yok sayılır).
- Yönlendir: saldırı hedef değiştirme (yeni kanca; basit tepki kancası + hedef seçimi, "tek yönlendirme/tepki").
- Son Ders: aura altyapısı, tur başı Motivasyon, fırsat saldırısı dezavantaj bayrağı.
- Zihin Gücü: itme/çarpma altyapısı (planlı sistem); nesne taşıma/fırlatma için gözetimsiz nesne tanımı (haritada nesne/engel etiketi); fırlatma hasarı sabit 3d6, nesne yok olmaz.

## Nesne kaynağı (KARAR: Aşama 1 ONAYLI, kullanıcı 2026-11-05)
Zihin Gücü'nün nesne kısmı için haritalarda taşınabilir nesne gerekir. İki aşama:
1. **Aşama 1 (harita değişmeden):** nesne kaynağı = mevcut haritalardaki nesneler (varil, sandık vb. zaten var: Kale Baskını varili) + zemin türünden türeyen **çevre enkazı**: taş/enkaz/kaya/orman zemin altıgenlerinde "bir yığın taş ya da dal" her zaman bulunur (50 lb sınırı, fırlatma 3d6). Kum, su, buz, lav, ahşap zemin buna göre ayarlanır (JSON tablosu `enkazZeminleri`). Harita verisine dokunulmaz.
2. **Aşama 2 (sonra, isteğe bağlı):** harita başına "nesne katmanı": altıgen, tür, ağırlık, kırılabilirlik (JSON). Önemli haritalara elle eklenir; yeni haritalar bu katmanla gelir. Fırlatılan nesne ya yok olur ya da yere düşer (parametre).
Karar: Aşama 1 kuyruğa alınır (K48'den sonra); Aşama 2 yalnız ihtiyaç doğarsa. **En kötü durumda (hiç nesne/enkaz yoksa, örneğin su, lav, boşluk) Monk bir taş "çağırır" ve onu fırlatır:** nesne yoksa bile Zihin Gücü fırlatması çalışır (taş 3d6 hasar; çağırma ek maliyet yok). Böylece özellik hiçbir haritada boşa gitmez. Yaratıkları itmek/çekmek nesneden bağımsızdır ve Aşama 1 olmadan da çalışır.

## Denge
Warrior of the Open Hand ile 100 tohum, ±5 puan (S3/S6/S11/S17). Risk: Yönlendir ve Sabır hasar kazanımı; Odak Puanı baskısı ayar noktası. Parti kurulumunda tek Yaşlı Bilge (aura çakışmaz).

## Açık sorular (varsayılan yazıldı)
1. Yönlendir kalsın mı (yeni kanca gerektirir; olmazsa Sabır + Sakin Söz yeter)?
2. Sanat: simge (baston/dağ) ve renk; ilk sürümde mevcut Monk jetonu yeter.
