# Kuyruk K48: Bardic düzeltmesi, Moral mekaniği, Karadul alt sınıfı

Başlık: `main` güncel (K45–K47, K20, denge, ad değişikliği içeride). Yeni dal `wip/k48` (`main`'den). Her büyük adım sonrası commit+push. Soru sorma: en makul kararı ver, `DECISIONS.md`'ye yaz. Goliath dosyalarına dokunma. Kural kaynağı SRD 5.2.1. Kayıt anahtarlarına ve NOTICE'e dokunma. Yeni kayıt alanları eski kayıtta boş = eski davranış. Ana parça (`index`) şu an 433,76 kB ve sınır 440 kB: yeni kod `index`'e değil, ilgili tembel parçalara (Serüven, savaş, oluşturucu) girsin.

Sıra: Adım A (kısa), Adım B, Adım C. Her adım ayrı commit(ler). Her adımın sonunda `npm test`, `npm run build`, typecheck, ilgili `check:*` temiz olsun.

## Adım A. Bardic Inspiration hatası (küçük)
- `secondChances` özelliği olan karakterde Bardic Inspiration zarı yanlışlıkla düşürülüyor. Nedenini bul, düzelt, test ekle.
- Kural sürümü: eski kayıtlar AYNI sonucu vermeli (tekrar oynatma bozulmasın), düzeltme yeni sürümde. Mevcut en yüksek sürümü kontrol et (Celestial 18 aldı). Planda bu düzeltme "16" diye geçiyordu ama 18 alınmış; en makul numarayı seç ve `DECISIONS.md`'ye yaz. Moral (Adım B) bir sonraki sürümü alır.

## Adım B. Moral mekaniği (kural sürümü: Bardic'ten sonraki, tahmini 19)
Disco Elysium'daki Moral gibi ikinci can havuzu. Karakter başına ayrı. GM anahtarı `moralSistemi`, varsayılan KAPALI; iki mod: "hafif" (yalnız Serüven'de kayıp/kazanç tutar, savaşa etkisi yok) ve "tam" (savaşa etkili; kural sürümü gerektirir). Eski kayıtlar etkilenmez.

**Kesin kararlar (kullanıcı):**
1. Havuz karakter başı. Maksimum = 3 + WIS mod + yeterlilik bonusu (parametre, JSON).
2. Savaşta Moral 0: karakter bulunduğu yerde "Çökmüş" olur: hareket edemez, eylem yapamaz. Savaştan çıkmaz; arkadaşları korumak zorundadır.
3. Savaş dışında Moral 0: karakter ölür (Moral ölümü); diriltilmesi gerekir.
4. Çökmüş olup savaşı atlatırsa zafer etkisiyle +1 ya da +2 Moral alır.

**Uygulama varsayılanları (parametre/JSON, kodda sabit değil):**
- Çökmüş: incapacitated + hareket 0; HP'ye dokunmaz; ona yapılan saldırılar avantajlı; HP de 0'a düşerse mevcut ölüm/ölmek üzere kuralları çalışır.
- Zafer ödülü +1; çökmüş kalıp zaferle bitirdiyse +2. Parti yenilir ya da kaçarsa ödül yok, Moral 0'da kalır ve savaş dışı kural çalışır (ölüm). Kaçış kararı gerçek bedel taşır.
- Savaşta bir müttefik eylemiyle çökmüş dostuna +1 Moral verebilir (Bard/Cleric ek bonus). Moral ≥1 olunca çökme biter. Parametre `moralToparlamaEylem`.
- Diriltme: SRD diriltme büyüleri ya da han/tapınak hizmeti. Dirilen karakter Moral 1 ile döner; kalıcı ceza yok (parametre).
- Etkiler: Moral ≤ yarı: WIS ve CHA kurtulma/kontrollerinde eşik -1; Moral ≤ 1/3: korku ve büyülenme kurtulmalarında dezavantaj. Savaşa girişte Moral 0 ise "Bunalmış": ilk turda eylem yok, hız yarım (tam mod).
- Kayıplar (Serüven, parametre tablosu): başarısız kırmızı sosyal/zihinsel kontroller, dost 0 HP olması, yolculuk felaketleri (açlık, yorgunluk, sığınaksız gece), korku yerleri, sefer yenilgileri. Kazançlar: uzun dinlenme (han hepsi, kamp yarısı), yemek/müzik (Bard), başarılı beyaz kontrol, görev tamamlama. Tablodaki sayılar denge turunda ayarlanacak, burada makul varsayılanlar yeter.
- Moral ölümünün anlatım metni nötr ve dramatik olsun ("umudunu yitirdi, sönüp gitti"). Yöntem ya da sahne betimi YOK. TR ve EN.
- Arayüz: karakter kartında Moral çubuğu (HP'nin yanında, ayrı renk), çökmüş jetonda belirgin durum simgesi.

**Test:** havuz hesabı, kayıp/kazanç, savaşta 0 → çökme, müttefik toparlama, zafer ödülü (+1/+2), savaş dışı 0 → ölüm → diriltme, mod kapalı = eski davranış, eski kayıt/tekrar oynatma, hafif mod savaşa etki etmez.

## Adım C. Karadul (Black Widow) imza alt sınıfı (ev kuralı)
Özgün Druid alt sınıfı, yalnız kadınlar. Ev kuralı: `data/ev-kurallari.json` + `houseRule("karadulCemberi")`, varsayılan KAPALI. Seçim seviyesi 3; özellikler 3/6/10/14. Yalnız kadın kısıtı: karakter kâğıdındaki cinsiyet/hitap alanına bakar; yoksa oluşturucuya isteğe bağlı alan (Kadın / Erkek / Belirtmek istemiyorum). GM anahtarı `karadulKadinKisiti` (varsayılan AÇIK; yalnız oluşturucuda seçimi kapatır, savaşı etkilemez). Ek yeterlilikler (S3): Persuasion, Deception.

**Kimlik:** cazibe avcısı. Büyücülük yeteneği Wisdom kalır; alt sınıf özelliklerinin DC ve bonusları KARİZMA ile: DC = 8 + yeterlilik + CHA mod (her zaman İNSAN biçimindeki Karizma'dan, biçim değişince düşmez).

**Wild Shape yok:** Karadul Çemberi seçen Druid sınıfın Wild Shape'ini kaybeder (`wildShape:false`), yerine yalnız Örümcek Biçimi (`orumcekBicimi:true`). Karakter oluştururken uyarı göster. Alt sınıf seçilince sınıf özelliğini kapatmak için "kaldır/değiştir" kancası gerekir.

**Özellikler (sayılar JSON parametresi):**
- **S3 Büyüleyici Bakış / Bewitching Gaze:** Eylemle 30 ft içinde insansı ya da canavar hedef WIS save (DC Karizma). Atamazsa Charmed (1 saat); seni dost sayar. Seni ya da dostlarını zarar verirse/saldırırsa büyü bozulur (SENİN Örümcek Biçimi saldırın Tatlı Tuzak'tan önce bozmaz). Aynı anda en çok CHA mod hedef. Kullanım: yeterlilik bonusu, uzun dinlenmede yenilenir. S6'dan itibaren BONUS eylem.
- **S3 Örümcek Biçimi / Spider Shape:** Bonus eylemle SRD canavar verisinden Giant Wolf Spider (S6: Giant Spider; S10: Phase Spider varsa). Standart Wild Shape kuralları (süre seviye/2 saat, HP havuzu, biçim canı bitince geri dönme). Kullanım: yeterlilik bonusu, kısa dinlenmede yenilenir. Biçimdeyken büyü yok. Dönüşümü bonus eylemle bitirebilirsin.
  - **Skor takası:** biçim bayrağı açıkken ability okuyucu `STR↔CHA` ve `CON↔WIS` eşlemesi uygular (JSON `karadul.skorTakasi`, çiftler değiştirilebilir); DEX ve INT değişmez. Örnek: insan STR 8, CHA 16, WIS 15, CON 8 → örümcek STR 16, CON 15, CHA 8, WIS 8. Saldırı/hasar/kurtulma/beceri hesapları aktif biçimin skorlarını kullanır; yeterlilikler ve seviye bonusu aynen. Takas karakter kâğıdında görünür (iki skor sütunu). Biçimin canı ve AC'si canavarınki.
- **S3 Karadul Zehri:** Örümcek Biçimi vuruşları ek zehir hasarı (1d6, S10: 2d6). Hedef CON save atamazsa bir tur Poisoned.
- **S6 Tatlı Tuzak / Sweet Snare:** Charmed hedefe, Örümcek Biçimi'ne geçtiğin turdaki İLK saldırın **sürpriz vuruş**: avantaj + ek 2d8 zehir (S10: 3d8, S14: 4d8). Büyü bu vuruştan SONRA biter. Tur başına bir kez. Motor için "bu tur dönüşen karakterin ilk saldırısı" bayrağı yeterli.
- **S10 Ağ Duyusu / Web Sense:** Zehir hasarı ve Poisoned bağışıklığı. 30 ft titreşim algısı (algılama sistemi gelene kadar yalnız bağışıklık).
- **S14 Son Öpücük / Final Kiss:** Uzun dinlenmede bir kez. Charmed hedefe sürpriz vuruş isabet ederse **otomatik kritik**; hedef CON save (DC Karizma) atamazsa hasar zarları maksimum ve 1 tur Stunned. Vuruştan sonra hedefin canı yarının altındaysa ve hedef efsanevi DEĞİLSE ve CR ≤ seviyenin yarısıysa, save başarısızlığında ölür. Efsanevi/boss hedeflerde ölüm yok, yalnız hasar ve Stunned (mevcut `efsaneviEnCok:1` kuralıyla tutarlı).

**Motor notları:** Charmed durumu SRD; kırılma kuralı (dost saldırı/hasar) motorda yoksa küçük kanca ekle. Wild Shape altyapısı "planlı/onaylı" sistemdir; Karadul onun hafif kopyasını kullanır (tek canavar listesi, kısa dinlenme hakkı). Büyü hazırlığı/DC Druid'in WIS'ini insan biçiminde kullanır. Sanat: ilk sürümde mevcut canavar jetonları yeter.

**Denge ölçümü:** S3/S6/S10/S14 için SRD Druid alt sınıflarıyla (Land/Moon/Sea/Stars) 100 tohum, ±5 puan. Sürpriz vuruş çok güçlüyse DC ve zar sayıları JSON'dan ayarla. S14 öldürme kuralını ayrıca ölç (minyon/orta CR). Sonuçları `harita/belgeler/DENGE.md`'ye ekle.

**Test:** ev kuralı kapalıyken görünmez; kadın kısıtı açık/kapalı; Wild Shape kapanır; skor takası (dönüş/geri dönüş, DC insan CHA'dan); Charmed kırılma kuralı; sürpriz vuruş yalnız dönüşen turun ilk saldırısı; Son Öpücük efsanevi ayrımı; eski kayıt.

## Kabul
typecheck, ilgili testler, tam `npm test`, build, `check:*` temiz; ana parça `index` ≤ 440 kB; kısa rapor: üç adımda verilen kararlar, sürüm numaraları, denge sonuçları, açık kalanlar.

## Dışı
Moral kayıp tablosunun denge ayarı (denge turu), Düşünce Dolabı, Karadul sanatı ve özel jeton, diğer 11 sınıfın imza alt sınıfları, ırk maskeleri.
