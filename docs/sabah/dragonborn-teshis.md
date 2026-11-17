# Dragonborn boyama: teşhis ve yöntem karşılaştırması

Görseller: `dragonborn-renk/teshis-eski-maske.png` (24 Gariban jetonu: orijinal | maske kaplaması | boyalı Red; eski otomatik maske), `dragonborn-renk/teshis-yeni-maske.png` (aynısı, yeni pul bölgesi maskesi), `dragonborn-renk/karsilastirma-<jeton>.png` (4 satır: erkek çarpma, erkek maske, kadın çarpma, kadın maske × 10 renk).

## 1. Eski otomatik maske (Gariban jetonları, görsel inceleme)

| Sınıf | Erkek | Kadın | Not |
|---|---|---|---|
| Barbarian | yamalı | yamalı | kürk yaka ve beyaz kayış parçaları maskeye girmiş, pullar benekli boyanıyor |
| Bard | doğru | doğru | baş, kuyruk, eller tamam; yeşil kol çok küçük taşma |
| Cleric | doğru | doğru | |
| Druid | yamalı | yamalı | yaprak etek ve beyaz parçalar benekli |
| Fighter | doğru | doğru | |
| Monk | yamalı | yamalı | beyaz bandajlar ve kuşak maskede |
| Paladin | doğru | doğru | |
| Ranger | doğru | doğru | kapüşon içi küçük taşma |
| Rogue | doğru | doğru | koyu kıyafet ayrışıyor |
| Sorcerer | doğru | doğru | |
| Warlock | doğru | doğru | |
| Wizard | doğru | doğru | |

Gariban jetonlarında maske çoğunlukla doğruydu; asıl bozulma alt sınıf jetonlarında: beyaz/gümüş kıyafetin pul ile aynı renkte olması maskeyi ters seçtiriyor (Paladin ID10 beyaz pelerin, Cleric ID5 beyaz pelerin, Monk ID9 beyaz giysi, Fighter ID4/ID10 krem sancak, Warlock WL-10 hayalet; Cleric melek kanatları yalnız yarım). Üstüne boyama pul dokusunun gölge pikselleri maske dışında kaldığı için benekli ve yamalı görünüyordu (lch boyaması + delikli maske).

## 2. Denenen yollar

1. **Yeni pul bölgesi maskesi** (`scripts/soy-maske-dragonborn.ts`, yöntem a + c): baş pul paleti, kapatma, bağlı bileşenler (baş kafa+boyun ile sınırlı, kuyruk, eller; büyük gövde parçaları atılır), elle düzeltme dosyası `data/soy-maske-dragonborn-el.json` (boş). Delik/yama sorunu bitti (baş ve kuyruk dolu boyanıyor), ama beyaz/gümüş giysi ile pul aynı renkte olduğundan ~15 jetonda giysi yine maskeye giriyor, kanatlar yarım kalıyor ve çıplak gövdeli sınıflarda (Barbarian, Monk) gövde yalnız kısmen boyanıyor. Elle düzeltme gerektiren jeton sayısı yaklaşık 25 (beyaz giysili Paladin ID10, Cleric ID5/ID1/ID3, Monk ID9, Fighter ID4/ID10 sancak, Warlock WL-10 hayalet, Warlock WL-7 melek, Barbarian ID7 vb.).
2. **Çarpma filtresi (kullanıcı kararı, seçilen yöntem)**: maske yok; beyaz taban `renk` ile çarpılır (gölge/ışık korunur), piksel doygunluğu (max−min)/255 `muaf` (0,12) altında tam, `tam` (0,28) üstünde hiç uygulanmaz (pelerin, deri, dövme, efekt); veri `soy-renkleri.json` `dragonborn.lineagesAlt` (`multiply`), kod `src/ui/tint.ts` `multiplyPixels`. Kanat katmanı paleti aynı renklerden türetildi (`kanat-esleme.json`: gölge = renk × 0,5, ışık = renk + %18 beyaz).

## 3. Karşılaştırma ve karar

| Ölçüt | Çarpma filtresi | Maske (yeni) |
|---|---|---|
| Yamalı/benekli boyama | yok (her piksel tutarlı) | yok (dolu bölge) ama sınırda keskin |
| Gölge/ışık detayı | korunur | korunur |
| Beyaz/gümüş giysi, zırh | pul ile aynı renk alır (renkli pelerin) | ~25 jetonda yanlış seçim, geri kalanda nötr kalır |
| Kanatlar (jeton içi, beyaz) | boyanır | yarım/yok |
| Oyunda kanat katmanı | aynı renk paleti | aynı |
| Elle iş | yok | ~25 jeton elle maske |
| Çalışma maliyeti | piksel başına basit çarpma, maske yüklemesi yok | maske dosyası + kapatma |

**Çarpma filtresi daha iyi**: tutarlı, bakım gerektirmiyor, kanatlar ve çıplak gövdeler dahil bütün pullar soy rengini alıyor, maskenin ters/yamalı sorunu kalmıyor. Bilinen taviz: beyaz/açık gümüş giysi ve zırh da renk alıyor; doygun renkli giysiler (kahverengi, yeşil, kırmızı, altın) etkilenmiyor. Maske yolu yedek olarak duruyor (`lineageTint(..., 'maske')`, `lineagesAltMaske`, `public/characters/maske/dragonborn-*.png`).
