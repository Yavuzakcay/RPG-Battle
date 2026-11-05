# İnfazcı / Vigilante: Rogue imza alt sınıfı (ev kuralı, taslak v1, 2026-11-05)

## Çerçeve
- Ev kuralı: `houseRule("imza_infazci")`, varsayılan KAPALI. Ad ve metin özgün; yalnız güç bütçesi SRD Rogue alt sınıfı (Thief) ile kıyaslanır. Assassin ve Swashbuckler özelliklerinden kopya yok.
- Seçim 3. seviyede. Rogue alt sınıf seviyeleri 3 / 9 / 13 / 17 (Thief düzeni).
- Evren içi kaynak: mahkemelerin ve loncaların cezasız bıraktığı suçluları kendi adaletiyle cezalandıran, maskeli kanun dışı kanun koruyucular. Yurt kullanılmaz (yurt ırka bağlı). İsteğe bağlı yer bağı: Saf Kent (şehir mahkemeleri) ya da Khadyrga Limanı. Kullanıcı onaylar.

## Kimlik
Adaleti kendi eline alan gizli bir avcı: bir hedefe "hüküm" verir, o hedefe karşı çok daha ölümcül olur; suçluyu bırakmaz, kaçarsa peşinden gider, sonunda infaz eder. Hedef seçimi hikâyeden gelir (zarar vermiş ya da zarar verecek biri); oyun içinde zorlama yok.

## Özellikler (TR / EN; sayılar JSON parametresi)
Alt sınıf özelliklerinin DC'si: 8 + yeterlilik bonusu + DEX modifiyesi.

- **S3 · Hüküm / Verdict** (bonus eylem; 60 ft içinde, gördüğün bir hedef; 10 tur; aynı anda tek hedef; yeterlilik bonusu kadar kez, kısa dinlenmede yenilenir): Hedefe hüküm verirsin. **Hükümlüye karşı Sneak Attack zarların d6 yerine d8 olur** (`hukumZarBasamagi`). Hükümlü sıfır cana düşerse hüküm biter; kullanım harcamadan bir bonus eylemle yeni hedefe geçer (tur başına bir kez).
- **S3 · Maskeli Adalet / Masked Justice:** Kılık Değiştirme Takımı yeterliliği; ve İkna ya da Sezgi'de ustalık (birini seç). Zaten ustaysan Expertise.
- **S9 · Son Uyarı / Final Warning** (eylem; 30 ft içinde hükümlü; kısa dinlenmede 1): Hükümlü WIS kurtulması atar; kaybederse 2 tur korku (Frightened) altında kalır ve sana saldırırken dezavantajlı olur. Boss/efsanevi hedefte yalnız 1 tur.
- **S9 · Müdahale / Intervention** (tepki): Hükümlü, 30 ft içindeki bir dosta isabet ettirdiğinde, hızının yarısı kadar hareket edersin (fırsat saldırısı doğurmaz) ve hükümlüye tek bir silah saldırısı yaparsın. Tur başına bir kez; Uncanny Dodge ile aynı tepkiyi paylaşır.
- **S13 · Peşini Bırakmayan / Relentless Pursuit:** Hükümlü kaçınma (Disengage), ışınlanma ya da görünmezlik kullanırsa yerini bilirsin (60 ft, `knowsWhere` kancası: gizlenmiş olsa da hedef alınır). Hükümlü hareket ederse tepkini kullanmadan hızının yarısı kadar peşinden gidebilirsin (tur başına bir kez).
- **S17 · İnfaz / Execution** (uzun dinlenmede 1; hükümlüye isabet eden bir Sneak Attack): Vuruş kritik olur ve hasar zarları maksimum sayılır. Hedefin canı vuruştan sonra Rogue seviyenin 4 katından azsa ve hedef **efsanevi değilse** CON kurtulması atar (DC yukarıdaki); kaybederse ölür. Efsanevi/boss hedeflerde ölüm yok, yalnız kritik + maksimum hasar (mevcut `efsaneviEnCok:1` kuralıyla tutarlı).

## Oyuncuya görünen metin (sade)
- **Hüküm (3):** Gördüğün birini "hükümlü" ilan et: 10 tur boyunca ona karşı gizli saldırın çok daha sert vurur.
- **Maskeli Adalet (3):** Kılık değiştirmede ustasın; ikna ya da sezgide daha da iyisin.
- **Son Uyarı (9):** Hükümlüye bir uyarı yap: direnemezse korkar ve sana vurmakta zorlanır.
- **Müdahale (9):** Hükümlü dostuna vurursa hemen yetişir ve ona karşılık verirsin.
- **Peşini Bırakmayan (13):** Hükümlü kaçamaz; nerede olduğunu bilirsin ve peşinden gidersin.
- **İnfaz (17):** Hükümlüye bir kez, ölümcül bir vuruş yaparsın; zayıflamışsa bu vuruş onu öldürür.

## Motor ihtiyaçları
- İşaretleme: tek hedef, 10 tur, hedef düşünce biter, bonus eylemle devir (Hunter's Mark benzeri altyapı). Sneak Attack zar basamağı artırma kancası (hedefe özel).
- Müdahale: tepki + hareket + tek saldırı (Uncanny Dodge ile tepki paylaşımı); Peşini Bırakmayan: `knowsWhere` (Divine Sense) kancası + tepkisiz takip hareketi.
- Son Uyarı: korku durumu ve "sana saldırırken dezavantaj" etiketi (Hükümdar Sözü ile aynı etiket).
- İnfaz: kritik + maksimum hasar + yarı can eşiği + CON kurtulması; Karadul "Son Öpücük"ün öldürme kuralıyla paylaşılan altyapı.
- Alt sınıf seçilince sınıf özellikleri değişmez (yalnız ekleme).

## Denge
Thief ile 100 tohum karşılaştırma, ±5 puan (S3/S9/S13/S17). Riskler: Hüküm'ün d8 basamağı tek başına güçlü olabilir; Müdahale ek saldırı verir: tepki ekonomisi ve tur başına sınırla dengelenir. İnfaz'ın öldürme kuralı ayrıca ölçülür (minyon/orta CR).

## Açık sorular (varsayılan yazıldı)
1. İsteğe bağlı yer bağı: Saf Kent mi, Khadyrga Limanı mı?
2. Hüküm hedefi seçimi: hikâye gerekçesi şart mı, yoksa her hedefe serbest mi (varsayılan serbest)?
3. Sanat: simge (maske/tartı) ve renk; ilk sürümde mevcut Rogue jetonu yeter.
