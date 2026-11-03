# Kuyruk K20: Celestial (Düşmüş) oynanabilir ırkı (ev kuralı)

Başlık: K19 birleştirilmiş, Su Altı Geçidi ve denge notu işlenmiş olmalı. Yeni dal `wip/k20`. Her büyük görev sonrası commit+push. Goliath dosyalarına dokunma. Kural kaynağı SRD 5.2.1; bu ırk SRD dışıdır, EV KURALI olarak `data/ev-kurallari.json` + `houseRule()` anahtarıyla eklenir, varsayılan KAPALI açılabilir.

## Telif kuralı (önemli)
Aasimar PHB 2024'te vardır, SRD 5.2.1'de YOKTUR. Aasimar'ın adları ve metni KOPYALANMAZ. Yalnızca güç bütçesi (sayılar ve etki türleri) kıyas alınır; özellikler özgün ad ve özgün metinle yazılır. TR ve EN metin ikisi de özgün.

## Girdiler
Karakter oluşturucuda "Celestial" zaten VAR, jetonlar da var: yeni ırk kaydı AÇMA, mevcut kaydı ve jetonları yeniden kullan. Yapılacak: (a) mevcut kaydın mekaniğini bütçeye göre düzelt, (b) metinleri hikâyesel yeniden yaz, (c) ev kuralı anahtarına bağla. Kimliği (id) değiştirme; eski karakterler aynı kalsın; mekanik değişiklik kural sürümüne bağlı (yeni karakterler yeni mekanik).

## Hikâye metni (TR / EN, özgün)
Ad: **Celestial** (alt başlık: Düşmüş / Fallen).
TR: «Göksel Ada'nın yedi yüzen adasında doğdun. Bir gün kanatların kırıldı, gökten düştün ve kıtada sıfırdan başlıyorsun. Gökyüzü hâlâ içinde: karanlıkta görürsün, ışık ve gölge sana pek işlemez, dokunuşun yaralıları iyileştirir. Ama düşüş iz bıraktı: kanatların artık seni taşımaz, yalnızca süzülürsün. Yedi erdemi kıtada yeniden kanıtlarsan evinin yolu açılır.»
EN: «You were born on one of the seven floating islands of the Celestial Isle. One day your wings broke and you fell, and now you start again on the continent with nothing. The sky is still in you: you see in the dark, light and shadow barely touch you, and your hands mend the wounded. But the fall left its mark: your wings no longer carry you, they only let you glide. Prove the seven virtues again and the way home will open.»
Özellik adları (TR / EN): Düşmüşün Görüşü / Fallen Sight (karanlık görüş), Gök ve Gölge Direnci / Sky and Shadow Resistance, Işık Hilesi / Light Trick (Light), Şifa Eli / Healing Touch, **Göksel Uyanış / Celestial Awakening**: Parlayan Ruh / Radiant Soul, Gece Gözyaşı / Night Tears, Kırık Kanat / Broken Wing.
Kırık Kanat metni: «Kanatların açılır ama seni taşımaz: hareketinin yarısı kadar süzülürsün ve turun sonunda yere inmen gerekir.»

## Mekanik (güç bütçesi Aasimar ile eşit)
- Karanlık görüş 60 ft (darkvision menzili düzeltmesi denge turunda, mevcut alanı kullan).
- Ölümsüz (necrotic) ve ışıltı (radiant) hasarına direnç.
- Küçük hile: Light (Karizma ile).
- **Şifa Eli:** eylemle dokunarak iyileştirme, zar sayısı yeterlilik bonusu kadar, uzun dinlenmede yenilenir.
- **Seviye 3, Göksel Uyanış** (bonus eylem, 1 dakika, uzun dinlenmede bir kez): üç seçenekten biri; her seçenekte tur başına bir kez hedefe ek hasar (yeterlilik bonusu):
  1. Parlayan Ruh: çevreye ışıltı; yakındaki düşmanlara tur sonunda hasar, kendinden aydınlık.
  2. Gece Gözyaşı: yakın düşmanları korkutur (WIS save), ek ölümsüz hasar.
  3. Kırık Kanat: süzülme ve kısa uçuş, SINIRLI: hareketin yarısı, turun sonunda yere inmek zorunda. Tam uçuş verme.
- Parametreler (DC, hasar, süre, yarıçap) JSON'da, kodda sabit olmasın. **Açık parametreleri CC kendi seçsin** (öneri: Parlayan Ruh yarıçapı 10 ft, tur sonu hasar = yeterlilik bonusu ışıltı; Gece Gözyaşı 10 ft, DC 8+yeterlilik+Karizma, korku 1 tur, süre 1 dakika; sonra denge ölçümüyle ayarla) ve DECISIONS.md'ye yaz.

## Hikâye bağı
Yurt: Göksel Ada (kaybedilmiş, kovulma teması), oyuna Batı Kıyısı / Liman'da başlar. Kefaret yolu (yedi erdem sınavı) şimdilik YAPMA, yalnızca ırk verisinde `yurt` ve başlangıç bölgesi alanı.

## Yapılacaklar
1. Irk kaydı (seçici, oluşturucu adımı, TR/EN, sıralama), ev kuralı anahtarı, Göksel Uyanış seçimi (seviye 3, seçim arayüzü Mystic Arcanum seçicisi gibi genel yapıdan).
2. Yeni ırk eski kayıtları etkilemez (ev kuralı kapalıyken seçilemez).
3. Testler: açık/kapalı, eski kayıt, her seçenek, Kırık Kanat sınırı, direnç, Şifa Eli yenilenme, oluşturucu duman testi.
4. Denge ölçümü: 9 SRD ırkı + Celestial, 100 tohum, seviye 1–5 ve 9, kazanma oranı ±5 puan içinde. Ağır sapmada değerleri ayarla (ev kuralı), karar DECISIONS.md.

## Kabul
typecheck, ilgili testler, build, check:harita, check:ses temiz; ana parça ≤440 kB; kısa rapor: denge tablosu, açık bırakılanlar.
