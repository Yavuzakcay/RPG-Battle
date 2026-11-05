# Kuyruk K51b: Hizalanma tablo ve sınır ayarı (kısa)

Başlık: K51 `wip/k51`'de. Yeni dal `wip/k51b` ya da `wip/k51` üzerinde devam. `docs/hizalanma-sistemi-taslak.md` artık depoda (güncel sürüm; K51 sırasında yoktu, bu yüzden tabloları sen doldurmuştun). Bu kuyruk yalnız veri ve sınır ayarıdır; kod yapısı değişmez. Soru sorma; kararlar `DECISIONS.md`'ye. Ana parça ≤ 440 kB. Kural sürümü ve savaş kaydı değişmez.

## Yapılacaklar
1. **Başlangıç kırpma sınırı ±25 → ±50.** Eksen ±50 kalır (101 nokta), kutu eşiği ±17, histerezis 2 aynı. (Taslak: başlangıç sınırı ±50.)
2. **`data/hizalanma-baslangic.json` tablolarını taslaktaki değerlerle değiştir** (sınıf, geçmiş, alt sınıf, ırk; "Başlangıç konumu" bölümü). Taslakta bulunan her kalem taslaktaki değeri alır. Taslakta olmayan kalemleri (8 özgün geçmiş, 13 SRD alt sınıf) kendi mevcut değerlerinin yaklaşık ×1.6'sı olarak yuvarla; hiçbir kalem ±30'u geçmesin (İmparator −30 ve İnfazcı −26 taslaktaki bilinçli istisnalardır). Her satırda gerekçe kalsın; değiştirdiğin her kalemi `DECISIONS.md`'de listele.
3. **Uç build testleri** (taslaktaki "Uç buildler"): Paladin+Acolyte+Hızır Yemini+Celestial = (+45,+48); Bard+Criminal+Şair Koleji+Elf = (−36,+18); Fighter+Soldier+İmparator+Goliath = (+36,−36); Rogue+Criminal+İnfazcı+Tiefling = (−45,−48). Etiketler: Düzenli İyi, Kaotik İyi, Düzenli Kötü, Kaotik Kötü. Tablo bu sonuçları tam vermeli (test sabit beklenti).
4. **Eski testleri güncelle:** kırpma ±25 beklentileri, "Kabul etme" görünürlüğü (artık çoğu karakterde görünür olmalı), duman testi (12 sınıf × tüm geçmiş × ırk): hiçbir kombinasyon ±50'yi geçmesin, çökme olmasın.
5. **Dağılım raporu:** tüm (sınıf × geçmiş × ırk) kombinasyonlarında 3. seviye başlangıç etiketi dağılımını yaz (kaç tanesi Gerçek Tarafsız, kaçı uç). Gerçek Tarafsız oranı %60'ın üstündeyse raporda belirt (ayarlama yapma).
6. GM panelindeki ve oluşturucudaki ızgara/etiket metinleri değişmez; yalnız sayılar.

## Rapor
Değişen tablo kalemleri, uç build sonuçları, dağılım tablosu, açık kalanlar.
