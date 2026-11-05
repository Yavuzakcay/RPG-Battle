# Çiftçi / Farmer: Ranger imza alt sınıfı (ev kuralı, v1.3, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_ciftci")`, varsayılan KAPALI. Ad ve metin özgün; yalnız güç bütçesi SRD Ranger alt sınıfı (Hunter) ile kıyaslanır.
- Seçim 3. seviyede. Ranger alt sınıf seviyeleri 3 / 7 / 11 / 15 (Hunter düzeni); Çiftçi 3, 7 ve 11'de özellik verir, **15. seviyede özellik YOK** (kullanıcı kararı).
- **Savaşta ekin/tarla ekilmez** (kullanıcı kararı 2026-11-05): yeni yüzey ya da zemin mekaniği yok. Çiftçi ürünlerini dinlenmede hazırlar, savaşta hazır ürünü kullanır.
- Evren içi kaynak: toprağı işleyen, sürüsünü ve tarlasını korumak için silah kuşanmış köy halkı; her sınıf çiftçi olabilir. Yurt kullanılmaz (yurt ırka bağlı); her ırktan Ranger seçebilir. İsteğe bağlı yer bağı: Yeşil Höyük (tarım geleneği).

## Kimlik
Tarlayı koruyan çiftçi: dinlenirken ürününü hazırlar (başak ve mantar), savaşta dostunu besler ya da düşmanına zehirli mantar fırlatır; mantarlarla çalıştığı için zehire bağışıktır.

## Özellikler (TR / EN; sayılar JSON parametresi)
DC: 8 + yeterlilik + WIS.

- **S3 · Çiftlik Bilgisi / Farm Lore:** Hayvan Bakımı ya da Doğa'da ustalık (birini seç) ve Şifacı Takımı (Herbalism Kit) yeterliliği.
- **S3 · Erzak / Provisions:** Her uzun dinlenmede yeterlilik bonusu kadar **Ürün** hazırlarsın (Başak ya da Mantar, istediğin dağılımda; kullanılmayanlar sonraki uzun dinlenmeye kadar kalır). Bir Ürünü bonus eylemle kullanırsın:
  - *Başak / Grain:* 30 ft içindeki bir dost (ya da sen) 1d4 + WIS modifiyesi can kazanır.
  - *Mantar / Fungus:* 30 ft içindeki bir düşmana mantar fırlatırsın: 1d4 zehir hasarı alır ve bir sonraki turuna kadar hızı yarıya iner.
- **S7 · Hasat / Harvest** (bonus eylem; iki Ürün harcar; tur başına bir kez): Üç seçenekten biri:
  - **Besle:** 30 ft içindeki tüm dostlar 2d6 + WIS can kazanır.
  - **Orakla:** bitişik tüm düşmanlar kesici hasar (2d6 + WIS) alır (DEX kurtulmasıyla yarıya iner).
  - **Spor Saç:** bitişik tüm düşmanlar CON kurtulması atar; kaybedenler 2d6 zehir hasarı alır ve 2 tur Poisoned olur (başarıda yarı hasar). En az bir harcanan Ürün Mantar olmalı.
- **S7 · Mantar Tutkunu / Spore-Hardened:** Zehir hasarına ve Poisoned durumuna bağışıksın.
- **S11 · Bereket / Bounty:** Başak Ürünü yiyen dost 10 tur zehir hasarına dirençli olur ve Poisoned kurtulmalarında avantaj kazanır. Başak iyileştirmesi 1d4 yerine 1d8, Mantar hasarı 1d4 yerine 1d8 olur.

## Oyuncuya görünen metin (sade)
- **Çiftlik Bilgisi (3):** Hayvan Bakımı ya da Doğa'da ustalık (birini seç) ve Şifacı Takımı.
- **Erzak (3):** Dinlenirken ürün hazırlarsın: başak dostunu iyileştirir, mantar düşmanını zehirler ve yavaşlatır.
- **Hasat (7):** İki ürünü birden harca: yakındaki dostları iyileştirir, yanındaki düşmanları oraklarsın ya da mantar sporlarını saçıp zehirlersin.
- **Mantar Tutkunu (7):** Zehirden etkilenmezsin.
- **Bereket (11):** Ürünlerin daha güçlüdür; başağı yiyen dostların bir süre zehire karşı dirençli olur.

## Motor ihtiyaçları
- Kaynak: karakter başı "Ürün" sayacı (tür ayrımı: Başak/Mantar), uzun dinlenmede PB kadar hazırlanır. Yeni yüzey/zemin YOK.
- Başak: bonus eylem, tek hedefli iyileştirme (30 ft); Mantar: bonus eylem, tek hedefli zehir hasarı + hız yarıya inme (bir sonraki tura kadar).
- Hasat: iki Ürün harcayan seçenekli bonus eylem (alan iyileştirme, bitişik düşmanlara kesici hasar, bitişik düşmanlara zehir + Poisoned). Spor Saç en az bir Mantar ister.
- Zehir hasarı türü ve Poisoned durumu mevcut; S7'de Ranger'a bağışıklık, S11'de başak yiyen dosta 10 tur direnç + kurtulma avantajı.
- Alt sınıf seçilince sınıf özellikleri değişmez (yalnız ekleme).

## Denge
Hunter ile 100 tohum karşılaştırma, ±5 puan (S3/S7/S11). Riskler: Ürün sayısı PB ile (2–6) sınırlı, iyileştirme düşük; zayıfsa Ürün sayısı ya da zar artırılır. Hasat tur başına bir kez ve iki Ürün harcadığı için kaynak gerilimi var. Zehir bağışıklığı 7. seviyede sık görülen zehirli düşmanlarda (örümcek, yılan) ayrıca ölçülür.

## Açık sorular
1. İsteğe bağlı yer bağı: Yeşil Höyük kalsın mı?
2. Sanat: simge (başak/mantar) ve renk; ilk sürümde mevcut Ranger jetonu yeter.
