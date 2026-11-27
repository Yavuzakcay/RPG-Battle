# BOSS-GORSEL-1: Mühür Ruhu görsellerinin kontrolü

Üretici: `node scripts/boss-gorsel.mjs --kaynak <assets-ham/boss klasörü>`. Kaynak depo dışında (ana checkout `assets-ham/boss/`). Çıktılar:

- **Görseller:** `public/boss/<kimlik>.webp`, uzun kenar 512 px, saydam zemin.
- **Eşleme:** `data/boss-gorsel.json`. Ölçek veride; Sv.1 0,25, Sv.2 0,6, Sv.3 1, boss yüksekliğine göre.
- **Kontrol sayfaları:**
  - `boss-gorsel-kontrol/sayfa-1.jpg`: Ateş, Soğuk, Yıldırım, Gürültü, Asit.
  - `boss-gorsel-kontrol/sayfa-2.jpg`: Zehir, Işıltı, Nekrotik, Psişik, Kuvvet.
  - Her yaratık için üç kare yan yana: ham, damalı zeminde sonuç, koyu zeminde sonuç.
- **Ölçüm dökümü:** `boss-gorsel-kontrol/olcum.json`.

## Ham dosyalar

Ham klasörde 30 dosya var; hiçbiri taşınmadı, yeniden adlandırılmadı ya da ezilmedi.

- `Kongark.jpg`, `Kongcuk.jpg`, `Kongilla.jpg` büyük harfle başlıyor. Betik dosya adını küçük harfe çevirerek okuyor; kimlikler `kongark`, `kongcuk`, `kongilla`.
- Görevin andığı adlandırma sorunları klasörde yok: `sSporlet.jpg`, `mothra.jpg` ve `Gemini_Generated_*` bulunmuyor. `sporlet.jpg`, `mothraq.jpg`, `mirit.jpg`, `mirath.jpg` ve `mirage.jpg` doğru adla duruyor.

## Yöntem

1. **Zemin:** Her görselde dört köşeden ayrı örneklenir (köşe başına medyan). Sabit `#FF00FF` varsayılmaz. Yerel zemin, köşelerin çift doğrusal karışımıdır; böylece hafif gradyanlı macenta (Cimbom, Sparkle/Thunderse, Kongcuk, Kongark) da doğru okunur.
2. **Eşik:** Köşe gürültüsünden hesaplanır (T0 = max(28, 2,5 × gürültü), T1 = T0 + 55). Saydamlık yalnız kenardan erişilen zemin benzeri bölgeye uygulanır. Böylece iç pembe/macenta çizim tonları korunur.
3. **Kapalı boşluklar:** Zemine çok yakın boşluklar kaldırılır (kaburga ve kristal araları). Gölgeli kapalı boşluklar da kaldırılır (koyu macenta): ince çizgi halkası değil, en az 15 "çekirdek" piksel taşıyan doygun macenta alanları.
4. **Kenar:** Yarı saydam kenarda renk zeminden ayrıştırılır. Saydama 3 px yakın piksellerde zemin tonunun fazlası bastırılır (despill). Erozyon yok, çizgi kalınlığı aynı.
5. **Küçük parçalar:** Zemine yakın renkli küçük yalıtılmış parçalar (pembe hale, kırıntı, JPEG lekesi) atılır. Zeminden uzak parçalar kalır: Kongilla/Kongark'ın siyah kristalleri, şimşek kıvılcımları, alev dilleri.

## Sonuçlar

Sütunlar: iç boşluk = kaldırılan kapalı zemin alanı sayısı; silinen parça = atılan küçük yalıtılmış parça sayısı.

| Kimlik | Çizgi | Kademe | Ham dosya | Ham boyut | Çıktı | Zemin (köşe ort.) | Köşe gürültüsü | İç boşluk | Silinen parça | Ölçek |
|---|---|---|---|---|---|---|---|---|---|---|
| `cim` | ates | Sv.1 | cim.jpg | 1984×2146 | 504×512 | #2f8052 | 3 | 2 | 4 | 0,25 |
| `cimbom` | ates | Sv.2 | cimbom.jpg | 2120×1984 | 512×455 | #fc05f7 | 14 | 23 | 131 | 0,6 |
| `cimbombom` | ates | Sv.3 | cimbombom.jpg | 2048×2048 | 496×512 | #fd01fd | 4 | 0 | 0 | 1 |
| `doggie` | soguk | Sv.1 | doggie.jpg | 1187×1536 | 499×512 | #fc02f1 | 4 | 2 | 178 | 0,25 |
| `wolfie` | soguk | Sv.2 | wolfie.jpg | 1583×1536 | 512×466 | #fb03f1 | 7 | 1 | 252 | 0,6 |
| `wolfgang` | soguk | Sv.3 | wolfgang.jpg | 2096×2016 | 512×484 | #fb00fd | 4 | 11 | 25 | 1 |
| `sparkle` | yildirim | Sv.1 | sparkle.jpg | 1339×1536 | 512×507 | #ea0ec1 | 3 | 9 | 9 | 0,25 |
| `thunderse` | yildirim | Sv.2 | thunderse.jpg | 1471×1536 | 512×506 | #e80fc1 | 5 | 2 | 2 | 0,6 |
| `stormer` | yildirim | Sv.3 | stormer.jpg | 1330×1251 | 512×512 | #fc00fc | 0 | 47 | 0 | 1 |
| `twinkle` | gurultu | Sv.1 | twinkle.jpg | 1306×1792 | 512×479 | #fc00fb | 5 | 9 | 112 | 0,25 |
| `gongi` | gurultu | Sv.2 | gongi.jpg | 1402×1792 | 500×512 | #fc03fb | 7 | 8 | 56 | 0,6 |
| `gongar` | gurultu | Sv.3 | gongar.jpg | 1359×1251 | 512×494 | #fc00fc | 1 | 3 | 2 | 1 |
| `hydrop` | asit | Sv.1 | hydrop.jpg | 1322×1536 | 512×484 | #fd01fd | 4 | 12 | 15 | 0,25 |
| `hydras` | asit | Sv.2 | hydras.jpg | 1532×1536 | 497×512 | #fc03fc | 7 | 22 | 36 | 0,6 |
| `hydraxe` | asit | Sv.3 | hydraxe.jpg | 1511×1472 | 512×511 | #f801fb | 4 | 3 | 142 | 1 |
| `sporlet` | zehir | Sv.1 | sporlet.jpg | 1492×1536 | 512×355 | #fd01fd | 4 | 3 | 29 | 0,25 |
| `mothcoon` | zehir | Sv.2 | mothcoon.jpg | 1337×1536 | 363×512 | #fc03fc | 7 | 3 | 98 | 0,6 |
| `mothraq` | zehir | Sv.3 | mothraq.jpg | 2016×2142 | 512×484 | #fc02fd | 4 | 4 | 8 | 1 |
| `lumbo` | isilti | Sv.1 | lumbo.jpg | 2752×1536 | 458×416 | #fb02fc | 7 | 0 | 1 | 0,25 |
| `lighty` | isilti | Sv.2 | lighty.jpg | 2752×1536 | 412×441 | #fb02fd | 7 | 0 | 1 | 0,6 |
| `lightaur` | isilti | Sv.3 | lightaur.jpg | 1561×1344 | 491×512 | #fc00fc | 5 | 6 | 92 | 1 |
| `cerbit` | nekrotik | Sv.1 | cerbit.jpg | 1312×1536 | 425×512 | #fc00fd | 5 | 14 | 138 | 0,25 |
| `cerbedo` | nekrotik | Sv.2 | cerbedo.jpg | 1671×1536 | 477×512 | #fe01fd | 4 | 27 | 213 | 0,6 |
| `cerbones` | nekrotik | Sv.3 | cerbones.jpg | 1610×1344 | 496×512 | #fc03fc | 7 | 22 | 286 | 1 |
| `mirit` | psisik | Sv.1 | mirit.jpg | 941×1248 | 380×512 | #fc01fc | 5 | 1 | 94 | 0,25 |
| `mirath` | psisik | Sv.2 | mirath.jpg | 1792×2400 | 295×512 | #fb02fc | 7 | 3 | 4 | 0,6 |
| `mirage` | psisik | Sv.3 | mirage.jpg | 1792×2400 | 408×512 | #fc01fc | 7 | 10 | 1 | 1 |
| `kongcuk` | kuvvet | Sv.1 | Kongcuk.jpg | 1103×1329 | 396×512 | #fb00fd | 0 | 1 | 25 | 0,25 |
| `kongilla` | kuvvet | Sv.2 | Kongilla.jpg | 1499×1689 | 484×512 | #fc01fe | 0 | 21 | 26 | 0,6 |
| `kongark` | kuvvet | Sv.3 | Kongark.jpg | 2058×2048 | 512×511 | #fd00fd | 2 | 23 | 1050 | 1 |

## İstenen özel noktalar

| Yaratık | Durum |
|---|---|
| Cim (koyu yeşil zemin) | Zemin `#2f8052` doğru okundu. Kuyruktaki alevin tamamı ve kulak/pati çizgileri korundu. Yeşil sızıntı bastırıldı |
| Cimbom, Cimbombom | Alev yele ve kuyruk alevi bütün. Cimbom gradyan zemini (`#fc05f7` civarı) temiz |
| Lumbo, Lighty | Parlak vurgular ve kalpli lekeler korundu. Ham görseller geniş (2752×1536), çıktı figüre kırpıldı |
| Hidra çizgisi (Hydrop, Hydras, Hydraxe) | Kuyruk ve gövde tonları korundu. **Şüpheli:** Hydraxe'in ince asit damlalarının uçlarında hafif turuncu/pembe ton kalıyor (ince damla zeminle karışmış; despill kırmızı kanalı bıraktı) |
| Kongilla, Kongark | Uçuşan siyah kristal parçaları gövdeden kopuk ama korundu (zeminden uzak oldukları için). Kongark kenarındaki koyu hale temizlendi; zincirlerde çok hafif mor ton var (zincir metalinin kendi gölgesi olabilir) |
| Mirage, Mirath | Boynuz/kristal çevresinde pembe halka ya da kırıntı kalmadı (koyu zeminde kontrol edildi); boynuz kristalleri bütün |
| Mirit | Ham 941×1248 (en düşük çözünürlük), çıktı 380×512. Sv.1 ölçeği (0,25) için yeterli |
| Nekrotik çizgi (Cerbit, Cerbedo, Cerbones) | Kaburga aralarındaki gölgeli koyu macenta büyük ölçüde temizlendi. **Şüpheli:** Cerbit'in göğüs kafesinde birkaç küçük mor benek kalıyor (çok dar, gölgeli boşluklar) |
| Şimşek çizgisi (Sparkle, Thunderse, Stormer) | Şimşekler beyaz/sarı kaldı, pembe sızıntı bastırıldı. **Şüpheli:** Sparkle ve Thunderse'nin çok ince şimşek çizgilerinin bir kısmı zeminle birlikte inceldi |

## Yeniden üretim önerisi (Gemini)

Kullanıcı isterse aşağıdakiler yeniden üretilebilir. Hepsi kabul edilebilir durumda; yalnız yakından bakınca fark ediliyor.

- **Cerbit:** Göğüs kafesi içi zemin rengiyle değil, düz koyu bir gölge rengiyle çizilsin.
- **Hydraxe:** Damlalar daha kalın çizilsin.
- **Sparkle, Thunderse:** Şimşekler daha kalın çizilsin.

## Bağlama noktası (rapor; arayüz değişmedi)

- **Savaş jetonu:** `Monster.avatar` (`src/battle/avatar.ts` canavar yolu: `monster.avatar ?? monsters/<id>.webp`, `Avatar` `onError` yedek zinciri).
  - Bağlandı (F Aşama 2, ölçüm bittikten sonra): `scripts/katalog-f-bosslar.mjs` `data/boss-gorsel.json`'dan `gorsel` ve
    `avatar: "boss/<id>.webp"` yazar; dosyası olmayan kayıtta `gorsel: null`, avatar yok (yedek jeton). Test `src/data/bosslarMuhur.test.ts`.
  - Ölçek bağlandı (MUHUR-OLCEK): `olcek` çizginin Sv.3 bossunun jetonuna göre; üretici `jetonOlcek` (= `token-sizes.json` `scale[<Sv.3 boyutu>]` × `olcek`) yazar,
    `monsterAvatar` → `Avatar.scale` → `tokenScale`. Yalnız görünüm. Ekran: `boss-gorsel-kontrol/jeton-olcek.jpg` (üstte Mirit/Mirath/Mirage, altta Cim/Cimbom/Cimbombom).
- **Dungeondex vitrini:** canavar görselleri `data/dungeondex-gorsel-esleme.json`'dan (`npm run dd-gorsel`). Katalog canavarları Dungeondex'e girdiğinde aynı `public/boss/<id>.webp` yolu kullanılabilir. Dungeondex arayüzüne dokunulmadı.

## GORSEL-MUCEVHER-EJDERHA: 15 mücevher ejderhası

Üretici aynı: `node scripts/boss-gorsel.mjs --kaynak <assets-ham/boss> --grup mucevher`. Eşleme `data/boss-gorsel.json` `mucevher`
(`hat`, `evre`, `kaynak`); ölçek yok, jeton boyutu boyut sınıfından. Bağlama `scripts/katalog-f2-kadim.mjs` (`avatar`, Dungeondex
eşlemesi `kaynak: jeton`); Dungeondex vitrini katalog canavarının `avatar`ını okur. Kontrol sayfası `boss-gorsel-kontrol/sayfa-mucevher.jpg`
(hat başına bir satır: Alfa, Omega, Delta, Sigma, Gamma).

- **Zemin:** düz koyu gri (≈ #50, köşe gürültüsü 1–2). Nötr zeminde dar eşik (T0 10, T1 45) ve büyük iç boşluk şartı; renkli zemin eşiği
  gövdenin gri tonlarını (Omega karnı, boynuzlar) siliyordu. Sonuç: yarı saydam piksel oranı %5–11 (Delta/Sigma duman ve kıvılcımı).
- **Bağlanmayan:** `dragon-alpha-adult-b.jpg` (yedek), `dragon-of-hexonia-a/-b.jpg` (bağlı değil, değiştirilmedi).

| Kimlik | Hat | Evre | Ham dosya | Ham boyut | Çıktı | Zemin | İç boşluk | Silinen parça |
|---|---|---|---|---|---|---|---|---|
| `alphlet` | alpha | Yavru | dragon-alpha-yavru.jpg | 2048×2048 | 512×402 | #42454c | 1 | 0 |
| `alphyr` | alpha | Genç | dragon-alpha-genc.jpg | 2048×2048 | 512×394 | #45464a | 1 | 0 |
| `alphadrake` | alpha | Yetişkin | dragon-alpha-adult-a.jpg | 2048×2048 | 488×512 | #43454c | 7 | 6 |
| `omeglet` | omega | Yavru | dragon-omega-yavru.jpg | 2048×2048 | 512×440 | #545354 | 0 | 22 |
| `omegyr` | omega | Genç | dragon-omega-genc.jpg | 2048×2048 | 512×469 | #4e4e4e | 0 | 33 |
| `omegadrake` | omega | Yetişkin | dragon-omega-adult.jpg | 2048×2048 | 512×475 | #515051 | 0 | 23 |
| `deltlet` | delta | Yavru | dragon-delta-yavru.jpg | 2048×2048 | 512×505 | #525151 | 2 | 10 |
| `deltyr` | delta | Genç | dragon-delta-genc.jpg | 2048×2048 | 512×498 | #4d4d4d | 3 | 20 |
| `deltadrake` | delta | Yetişkin | dragon-delta-adult.jpg | 2048×2048 | 512×510 | #505050 | 0 | 3 |
| `sigmlet` | sigma | Yavru | dragon-sigma-yavru.jpg | 2048×2048 | 512×453 | #505050 | 0 | 113 |
| `sigmyr` | sigma | Genç | dragon-sigma-genc.jpg | 2048×2048 | 512×473 | #4d4d4d | 0 | 10 |
| `sigmadrake` | sigma | Yetişkin | dragon-sigma-adult.jpg | 2528×1696 | 512×341 | #4c4c4b | 0 | 13 |
| `gamlet` | gamma | Yavru | dragon-gamma-yavru.jpg | 2048×2048 | 512×458 | #4f4e4f | 0 | 27 |
| `gammyr` | gamma | Genç | dragon-gamma-genc.jpg | 2048×2048 | 512×483 | #525152 | 1 | 16 |
| `gammadrake` | gamma | Yetişkin | dragon-gamma-adult.jpg | 2048×2048 | 512×481 | #515151 | 1 | 20 |
