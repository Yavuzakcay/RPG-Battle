# Geride Kalanın Yolu / Path of the Survivor: Barbarian imza alt sınıfı (ev kuralı, taslak v1.2, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_geride_kalan")`, varsayılan KAPALI. Ad ve metin özgün; yalnız güç bütçesi SRD Barbarian alt sınıfı (Path of the Berserker) ile kıyaslanır.
- Seçim 3. seviyede. Barbarian alt sınıf seviyeleri 3 / 6 / 10 / 14 (Berserker düzeni).
- **Genel mekanik, Serüven'e bağlı değil:** her modda ve her haritada çalışır (kullanıcı kararı 2026-11-04). Motivasyon sistemi (`moralSistemi`) kapalı olsa da alt sınıf seçilebilir; seçmek isteyen seçer.
- **İki çalışma biçimi, aynı sayılar:**
  - `moralSistemi` AÇIK: karakterin gerçek **Motivasyon** havuzu kullanılır (kayıplar/kazançlar Serüven ve savaş olay tablosundan).
  - `moralSistemi` KAPALI: yalnız bu karakter için **Yıpranma** havuzu (aynı üst sınır formülü ve cezalar), yalnız SAVAŞ olaylarından değişir (aşağıda). Serüven'de kayıp tablosu yok, dolayısıyla Motivasyon ölümü yok.
- Evren içi kaynak: herhangi bir büyük savaştan, yıkımdan ya da kuşatmadan sağ çıkmış biri (belirli bir yer yok; hikâyeyi oyuncu kurar). Yurt kullanılmaz: yurtlar ırka bağlıdır.
- **Hassasiyet notu:** konu travma sonrası yük (savaştan sağ çıkma). Oyun metinlerinde klinik terim (PTSD, hastalık, bozukluk) kullanılmaz; "savaşın yükü", "yıpranmak", "ayakta kalmak" gibi insani, saygılı bir dil. Betim ve ayrıntı yok, yaralanma ya da şiddet anlatılmaz. Zayıflık alay konusu yapılmaz; alt sınıf gücü kederden/yükten değil, ayakta kalma iradesinden gelir.

## Kimlik
Çok şey kaybetmiş, ayakta kalmayı öğrenmiş bir savaşçı. Umudu hiçbir zaman tam dolmaz, kolayca çöker. Karşılığında yıpranmışlığından güç alır: ne kadar hırpalanmışsa o kadar sert vurur, öfkeyle çökmeyi erteler.

## Özellikler (TR / EN; sayılar JSON parametresi)
Üst sınır = 3 + WIS modifiyesi + yeterlilik bonusu (parametre). "Eksik puan" = NORMAL üst sınır − mevcut puan. "Puan" Motivasyon (sistem açık) ya da Yıpranma (kapalı) demektir.

- **S3 · Yaralı Kalp / Wounded Heart:** Puan üst sınırı üçte bire iner (aşağı yuvarla, en az 1); hiçbir dinlenme, yemek, şarkı ya da iyileştirme bu sınırı aşamaz.
- **S3 · Yıpranmışlığın Gücü / Strength of the Worn:** Öfkedeyken hasar zarına eksik puanın yarısı kadar (aşağı yuvarla, en çok yeterlilik bonusu kadar, `yipranmaCarpani`) ek hasar eklersin. Eksik puan her zaman en az üst sınırın üçte ikisi kadar olduğu için bonus baştan vardır; daha da yıpranırsan artar.
- **S3 · Öfkeyle Ayakta / Standing in Rage:** Öfkedeyken puanın 0'a düşerse çökmezsin; Öfke bitince hâlâ 0 isen hemen Çökmüş olursun (savaşta çökme kuralı).
- **S6 · Dostunun Yası / Mourning Wrath** (tepki; yeterlilik bonusu kadar kez, uzun dinlenmede yenilenir): 30 ft içinde bir dostun 0 HP'ye düşer ya da Çökmüş olursa, Öfkeye hemen girersin (Öfke kullanımı harcamaz) ve 2 × Barbarian seviyesi kadar geçici can kazanırsın. Bedeli: 1 puan kaybedersin.
- **S10 · Alışkın Acı / Used to Grief:** Düşük puanın cezaları sana işlemez: WIS/CHA kurtulma eşiği düşmez, korku ve büyülenme kurtulmalarında dezavantajın olmaz. Ölüm kurtulma zarlarında avantajlısın.
- **S14 · Küllerden Doğan / Risen from Ashes** (uzun dinlenmede 1): 0 HP'ye düşünce 1 HP'de kalırsın ve Öfkeye girersin (kullanım harcamaz). 30 ft içindeki dostların +1 Motivasyon kazanır (sistem açıkken, üst sınırı aşmaz); sistem kapalıyken dostların bunun yerine Barbarian seviyen kadar geçici can alır (`kulerdenDostlarTempHp`).

## Yıpranma havuzu (yalnız `moralSistemi` KAPALIYKEN)
Yalnız bu alt sınıfın karakteri için, yalnız savaşta işler.
- Üst sınır: yukarıdaki formül (üçte biri). Her uzun dinlenmede üst sınıra döner; kısa dinlenmede +1.
- **Kayıp (−1, olay başına bir kez, parametre):** 30 ft içinde bir dost 0 HP'ye düşer; sen ilk kez canının yarısının altına inersin (savaş başına bir kez); kritik vuruş yersin.
- **Kazanç (+1):** savaşı kazanırsın; Dostunun Yası sonrası zafer.
- **Çökme:** savaşta 0 olursun → Çökmüş (hareket edemez, eylem yapamaz; Öfkeyle Ayakta ertelemesi geçerli). Savaş dışında 0 olmaz (kayıp yalnız savaş olayı), dolayısıyla ölüm yok. Savaş sonunda Çökmüş ve ayakta kaldıysan +1 puan.
- Cezalar (puan ≤ yarı: WIS/CHA eşik −1; ≤ üçte bir: korku/büyülenme dezavantajı) yine uygulanır. Üst sınır üçte bir olduğundan BU İKİ CEZA DA SÜREKLİ geçerlidir (bilinçli: "hep sınırda"); 10. seviyedeki Alışkın Acı bunları kaldırır. 3.–9. seviye bedeli ağırdır, ölçümde ayrıca bakılır.

## Oyuncuya görünen metin (sade)
- **Yaralı Kalp (3):** Umudun hiçbir zaman tam dolmaz; en çok üçte birine kadar toparlanırsın.
- **Yıpranmışlığın Gücü (3):** Ne kadar yıpranmışsan, öfkeyle o kadar sert vurursun.
- **Öfkeyle Ayakta (3):** Öfkedeyken umudun bitse bile yıkılmazsın; öfken bitince yıkılırsın.
- **Dostunun Yası (6):** Bir dostun düşünce öfken taşar: hemen öfkelenir, dayanıklılık kazanırsın; bir miktar umudunu yitirirsin.
- **Alışkın Acı (10):** Yıpranmışlığın seni artık zayıflatmaz; ölümün eşiğinde daha dirençlisin.
- **Küllerden Doğan (14):** Ölecekken bir kez ayağa kalkarsın; dostlarına güç verirsin.
(Motivasyon sistemi kapalıyken kartta "umut" yerine "dayanma" sayacı gösterilir; sayılar aynıdır.)

## Motor ihtiyaçları
- Karakter başı havuz: sistem açıkken mevcut Motivasyon (K48), kapalıyken alt sınıf yerel `yipranma` alanı (kayıtta karakter başı; alan yoksa = tam üst sınır). Aynı okuyucu iki kaynağı soyutlar.
- Üst sınır çarpanı bayrağı `moralUstSinirCarpani: 0.333` ve kazançların kesilmesi.
- Öfke hasarına dinamik ek hasar; Öfke içinde çökme erteleme; tepkiyle Öfkeye girme (kullanım harcamadan) ve geçici can; 0 HP'de 1 HP + Öfke (Relentless Rage benzeri kanca); ceza yok sayma kancası.
- Savaş olaylarından Yıpranma kaybı/kazancı (dost düştü, yarı can, kritik, zafer) kancaları.
- Kural sürümü: yeni alt sınıf kayıt alanları; eski kayıt etkilenmez.

## Denge
Berserker ile 100 tohum karşılaştırma, ±5 puan; İKİ mod ayrı ölçülür: Motivasyon "tam" modu ve Yıpranma (sistem kapalı). Bedel (üçte bir havuz, çökme riski, 10. seviyeye dek sürekli cezalar) ve güç (Yıpranmışlığın Gücü, Öfkeyle Ayakta, Dostunun Yası) birbirini dengelemeli: güç fazla çıkarsa çarpan ve en çok sınırı, bedel fazla çıkarsa (özellikle 3.–9. seviyede sürekli cezalar) üst sınır oranı (0.333 → 0.4) ya da ceza eşikleri ayarlanır. Çökme sayısı ayrı ölçülür.

## Kararlar (kullanıcı, 2026-11-05)
- Üst sınır ÜÇTE BİR. Sistem kapalıyken Yıpranma kayıpları kabul.

## Açık sorular
1. Sanat: simge ve renk; ilk sürümde mevcut Barbarian jetonu yeter.
