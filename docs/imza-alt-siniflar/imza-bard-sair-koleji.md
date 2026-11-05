# Şair Koleji / College of Poets: Bard imza alt sınıfı (ev kuralı, taslak v1, 2026-11-04)

## Çerçeve
- Ev kuralı: `houseRule("imza_sair_koleji")`, varsayılan KAPALI. Ad ve metin özgün; yalnız güç bütçesi SRD Bard alt sınıfı (College of Lore) ile kıyaslanır. Mevcut yayınlanmış alt sınıflardan (Lore, Glamour, Valor, Dance, Eloquence) kopya yok: Cutting Words ve Vicious Mockery'ye benzemeyen, kendi "mısra" mekaniği.
- Seçim 3. seviyede. Bard alt sınıf seviyeleri 3 / 6 / 14 (Lore düzeni); üç basamak.
- Evren içi: şiir meclisleri ve kolejler geleneği. Yurt kullanılmaz (yurt ırka bağlı); her ırktan Bard seçebilir. İsteğe bağlı yer bağı: Şakırdayan Zerafet ya da Saf Kent'teki şiir meclisleri. Kullanıcı onaylar.

## Kimlik
Sözün gücüne inanan şair: övgüyle dostunu ayağa kaldırır, hicivle düşmanını sarsar. Dizelerini aynı anda iki kişiye ulaştırmayı, ölecek dostunu bir mısrayla ayakta tutmayı öğrenir.

## Özellikler (TR / EN; sayılar JSON parametresi)
Alt sınıf özelliklerinin DC'si: 8 + yeterlilik bonusu + CHA modifiyesi. "Mısra zarı" = harcadığın Bardic Inspiration zarı.

- **S3 · Mısra / Verse** (Bonus eylem; bir Bardic Inspiration zarı harcar; 60 ft içinde, sesini duyan hedef):
  - *Övgü / Praise:* bir dostuna zar sonucu + CHA modifiyesi kadar geçici can verir ve **+1 Motivasyon** kazandırır (`motivasyonOvgu`). Dost savaşta Çökmüş ise (Motivasyon 0) Övgü ona **+2 Motivasyon** verir ve çökmeyi bitirir.
  - *Hiciv / Satire:* bir düşman WIS kurtulması atar; kaybederse zar sonucu + CHA modifiyesi kadar zihin hasarı alır ve bir sonraki saldırı zarında dezavantajlı olur (en çok 1 tur).
  - Mısra yapmak Bardic Inspiration vermez (zar harcanır). Zar harcamadan ya da kullanılmamış zarı geri almak yok.
- **S3 · Kalemin Gücü / Pen's Power:** İki beceride ustalık (herhangi ikisi ya da seçili şiir becerileri: Performance, Persuasion, History, Insight; zaten ustaysan Expertise).
- **S3 · Gece Şiiri / Night Verse** (Motivasyon sistemi açıkken): Kamp ya da han dinlenmesinde şiir okursun: dinlenen her dost, dinlenmenin normal Motivasyon kazancına **+1** ekler (parametre `geceSiiriBonus`). Her dinlenmede bir kez, ek kaynak harcamaz.
- **S6 · Nakarat / Refrain:** Mısran ikinci bir hedefe daha ulaşır: ilk hedefin 30 ft içinde başka bir dost ya da düşman, zar sonucunun yarısı kadar etki alır (aynı kurtulma kuralı). İkinci hedef dostsa Övgü'nün Motivasyon kazancını da alır (+1).
- **S14 · Ölümsüz Dize / Undying Verse** (tepki; uzun dinlenmede 1): 60 ft içinde bir dostun canı 0'a düşünce, ölmek yerine 1 canla ayakta kalır ve senin Bard seviyen kadar geçici can kazanır. **Motivasyon yönü:** savaş dışında bir dostun Motivasyonu 0'a düşecekse (Motivasyon ölümü), ölmek yerine 1 Motivasyon'la ayakta kalır. Aynı kullanım, ikisinden yalnız birine harcanır.
- **S14 · Usta Şair / Master Poet** (kısa dinlenmede 1): Bir Mısra'yı Bardic Inspiration zarı harcamadan yapabilirsin (zar d12 sayılır). Ek olarak uzun dinlenmede bir kez, tüm parti üyeleri **+1 Motivasyon** kazanır (`ustaSairParti`).

## Oyuncuya görünen metin (sade)
- **Mısra (3):** Bir dize söyle: dostuna dayanıklılık ve umut verir (Motivasyonu artar), düşmanı sözlerinle sarsar; direnemezse hasar görür ve bir sonraki saldırısını kötü yapar. Çökmüş dostunu ayağa kaldırır.
- **Gece Şiiri (3):** Dinlenirken şiir okursun, dostlarının Motivasyonu daha çok yenilenir.
- **Kalemin Gücü (3):** İki becerinde daha usta olursun.
- **Nakarat (6):** Dizen ikinci bir kişiye de ulaşır, ama etkisi daha zayıftır.
- **Ölümsüz Dize (14):** Bir dostun ölecekken ya da umudunu tümden yitirecekken dizenle ayakta kalır.
- **Usta Şair (14):** Bir mısra için artık ilham zarı harcamazsın (kısa dinlenmede bir kez); uzun dinlenmede tüm partinin Motivasyonu biraz yükselir.

## Motivasyon bağlantısı (kullanıcı kararı 2026-11-04)
Şair Koleji, Motivasyon sistemiyle (K48 Adım B, GM anahtarı `moralSistemi`) çalışan alt sınıftır: Bard zaten "dost Motivasyonu yükselten" sınıftır, bu alt sınıf bunu asıl işi yapar.
- **Anahtar kapalıyken** alt sınıf yine çalışır; yalnız Motivasyon satırları devre dışı (Övgü geçici can verir, Gece Şiiri ve parti bonusu işlemez, Ölümsüz Dize yalnız can yönüyle çalışır).
- **Kaynak sınırı:** Motivasyon kazançları kullanım başına sabit +1 (Çökmüş dosta +2); en yüksek havuz sınırını aşmaz.
- **Görünen ad:** Türkçe arayüzde "Motivasyon", EN "Morale" (iç ad `moral`, kullanıcı terimi Motivasyon). K48'de "Moral" yazan arayüz metinleri bu terimle hizalanmalı: sonraki kuyrukta CC'ye notlanır.
- **Denge:** Motivasyon etkisi küçük; asıl ölçü Lore ile ±5 puan (sistem kapalı), sistem açıkken Çökmüş sayısı ve ölüm oranı ayrıca ölçülür.

## Motor ihtiyaçları
- Bardic Inspiration zarı harcama + sonucu kullanma: mevcut kanca (savaş motoru). Mısra'nın Övgü'sü: geçici can verme; Hiciv'i: kurtulma zarı, zihin hasarı, "bir sonraki saldırıda dezavantaj" durumu (1 tur).
- Nakarat: ikinci hedef seçimi + yarı etki; yalnız ilk hedefin 30 ft'i.
- Ölümsüz Dize: 0 HP tepkisi (Indomitable/Undying benzeri), geçici can.
- Usta Şair: zar harcamayan Mısra kullanımı.
- Alt sınıf seçilince sınıf özellikleri değişmez (yalnız ekleme).

## Denge
College of Lore ile 100 tohum karşılaştırma, ±5 puan. Riskler: Nakarat + Hiciv çok hasar/kontrol verirse zar yarısı ve DC'den ayarlanır; Ölümsüz Dize tek kullanım olduğu için ölçümde Cleric/Paladin ile karşılaştırılır.

## Açık sorular (varsayılan yazıldı)
1. Ad: "Şair Koleji" (TR), "College of Poets" (EN).
2. İsteğe bağlı yer bağı (yurt değil): Şakırdayan Zerafet mi, Saf Kent mi?
3. Bard seviyeleri 3/6/14 (Lore düzeni); farklı istersen söyle.
4. Sanat: simge (kalem/yaprak) ve renk; ilk sürümde mevcut Bard jetonu yeter.
