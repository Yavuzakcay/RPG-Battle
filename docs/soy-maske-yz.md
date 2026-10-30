# Yapay zekâ ile soy maskesi (Görev K24)

Soy boyaması yalnızca jetonun **ten maskesindeki** pikselleri boyar. Otomatik maske (K15) bazen zırhı, saçı ya da kürkü de alır; elle maske (K21) bunu düzeltir. Bu belge elle maskeyi **Gemini gibi bir görsel yapay zekâya çizdirip** oyuna almayı anlatır.

## Kısa akış

1. Şablonu üret: `npm run soy-incele` → `docs/sabah/soy-inceleme/sablon/<jeton>.png` (siyah zemin, %35 saydam jeton). Sayfada (`docs/sabah/soy-inceleme/index.html`) hangi jetonun maskesinin bozuk olduğuna bak.
2. Şablonu Gemini'ye ver ve aşağıdaki yönergeyle maskeyi iste.
3. Çıktıyı **jetonun adıyla** kaydet: `assets/soy-maske-ham/<jeton>.png` (JPG de olur). Ad birebir jeton adı: `<ırk>-<male|female>-<sınıf>`, örnek `goliath-male-barbarian.png`, `dragonborn-female-paladin.jpg`. Boyut ve biçim serbest.
4. İçe aktar:
   ```powershell
   npm run soy-maske-ice
   npm run soy-maske-ice -- --esik 100           # gri çıktılarda eşik (varsayılan 128)
   npm run soy-maske-ice -- goliath-male-barbarian  # yalnızca bu jeton
   npm run soy-maske-ice -- --zorla              # var olan elle maskeyi ez
   ```
   Çıktı `assets/soy-maske-el/<jeton>.png` (jetonla aynı boyut, gri, 0/255; K21 biçimi). Kayıt `data/soy-maske-yz.json`.
5. Uygula ve incele:
   ```powershell
   npm run soy-maske
   npm run soy-incele
   ```
   İnceleme sayfasında maske kaynağı **ELLE (yapay zekâ)** görünür; "ham maske" sütununda ham görsel, temizlenmiş maske ve jeton üstünde kırmızı örtü, uyarılar renkli etiketle (yeşil iyi, turuncu uyarı, kırmızı sorun).

## Gemini yönergesi (kopyala-yapıştır)

> Ekteki görsel bir pixel art karakter jetonunun şablonudur (siyah zemin üstünde yarı saydam karakter). Aynı boyutta ve **aynı hizada** bir siyah-beyaz maske üret: karakterin **yalnızca çıplak tenini** (yüz, kulaklar, boyun, açık kollar ve eller) **saf beyaz**, geri kalan her şeyi (saç, sakal, kask, zırh, giysi, kürk, silah, kalkan, arka plan) **saf siyah** yap. Gölge, gri ton, kenar yumuşatma, çerçeve, yazı, filigran ekleme. Karakteri kırpma, kaydırma, büyütme ya da yeniden çizme; şablondaki konumlar birebir korunmalı. Çıktı kare olsun.

İpuçları:
- Ejderha soyu (Dragonborn) için "pullu deri" de ten sayılır: "pullu yüz ve boyun da beyaz" diye ekle.
- Goliath'ın deri desenleri (dövme/işaret) ten sayılır; beyaz kalsın.
- Bir kerede olmazsa "beyaz alanı daralt: kask ve omuzluk siyah" gibi tek düzeltmeyle yeniden iste.

## Araç ne yapar

Sırayla: gri tona çevirir (saydam pikseller siyah) → kenardaki tekdüze gri/beyaz çerçeveyi kırpar; en-boy oranı jetonla uyuşmuyorsa uyarır ve uzun kenardaki siyah boşluğu kırpar; ham görselin oranı jetonun tuvaline değil de karakterin opak kutusuna uyuyorsa (yapay zekâ karakteri kırpmışsa) o kutuya oturtur → en yakın komşuyla jeton boyutuna getirir → eşikle ikili yapar → jetonun saydam piksellerindeki beyazı siler → 4 pikselden küçük beyaz parçaları siler, tek piksellik delikleri doldurur.

Kalite kontrolü (uyarılar `data/soy-maske-yz.json` ve inceleme sayfasında):
- **IoU** (otomatik maskeyle örtüşme): farklı olması normaldir; **0,3'ün altı "büyük olasılıkla hizasız"**.
- **Beyaz oranı**: jetonun opak alanının %2'sinden azı (boş maske, eşik yüksek) ya da %80'inden çoğu (zırh da beyaz) uyarı.
- **Taşma**: jeton dışına düşen beyaz silinir; çoksa (%5+) kayma uyarısı.
- **En-boy oranı** farklıysa uyarı (kırpma yapıldıysa belirtilir).

## Var olan maskeleri koruma

`assets/soy-maske-el/` içinde aynı adlı bir maske varsa araç onu **ezmez** ve uyarır; ezmek için `--zorla`. İstisna: dosya daha önce bu araçla yazılmış ve o günden beri değişmemişse (kayıttaki özet aynı) yeniden yazılır. Yapay zekâ maskesini elle düzeltirsen özet değişir; araç artık onu ezmez ve inceleme sayfasında kaynak "ELLE" görünür.

## Sık sorunlar

| Belirti | Neden | Çözüm |
|---|---|---|
| "büyük olasılıkla hizasız" (IoU < 0,3) | Yapay zekâ karakteri kaydırmış, büyütmüş ya da yeniden çizmiş | Yönergeyi "konumlar birebir korunmalı" vurgusuyla tekrarla; şablonu kare ve tam boyutta ver |
| Beyaz oranı %80+ | Zırh, giysi de beyaz | "Yalnızca çıplak ten beyaz, zırh siyah" diye yeniden iste |
| Beyaz oranı %2'den az | Maske çok koyu gri ya da boş | `--esik 90` gibi düşük eşik dene; ya da yeniden iste |
| En-boy uyarısı | Çıktı kare değil ya da kenar boşluğu var | Çoğunlukla otomatik kırpılır; hiza bozuksa kare çıktı iste |
| "jetonun dışına taşıyordu" | Kayma ya da kalın kontur | Örtüyü incele; kaymışsa yeniden iste |
| "ezilmedi" | Aynı adlı elle maske var | Bilerek ezmek için `--zorla` |
| "ad bir soylu jetonla eşleşmiyor" | Dosya adı yanlış (soy adı eklenmiş, `.webp` vb.) | `<ırk>-<male|female>-<sınıf>.png|jpg` |
