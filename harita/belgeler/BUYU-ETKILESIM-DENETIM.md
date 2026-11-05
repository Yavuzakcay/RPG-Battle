# Büyü × yüzey etkileşim denetimi (Kuyruk K55 Görev 1)

Durum: K54 sonu (kural sürümü 25), K55 öncesi. Bu belge yalnız listedir; düzeltmeler K55 Görev 2–4'te
(`data/yuzey-etkilesimleri.json`, `src/battle/hexResolver.ts`, kural sürümü 26).

Proje kararları belgesindeki `harita-yuzey-etkilesimleri.md` depoda yok. Karşılaştırma için K55 Görev 4 listesi esas
alındı. Var olan açıklama tablosu `data/yuzey-etkilesim.json` (Kuyruk 18b) de satır satır karşılaştırıldı.

## 1. Tepkime noktaları (kodda nerede)

Bir komutun sonunda (`execute`, `src/battle/commands.ts` ~173–183) beş ayrı geçiş **sırayla** çalışır. Her geçiş kendi
"element dokunuşu" listesini kendi kuralıyla çıkarır.

| # | Geçiş | Dosya / fonksiyon | Dokunuş kaynağı | Tepkimeler |
|---|---|---|---|---|
| 1 | Eski yüzey tepkimeleri | `surfaces.ts` `surfaceReactionEvents` → `douseEvents`, `reactTo` | `spell_cast.area`, `area_used`, isabetli `attack_resolved` (yalnız ateş/soğuk/yıldırım) | söndürme (Sleet Storm `douses`), ateş+yağ, ateş+ağ, ateş+buz (erime), ateş+su (buhar), ateş+zehir (patlama), soğuk+su yüzeyi, soğuk+sığ su zemini, yıldırım+su (zincir) |
| 2 | Gres tutuşması | `ignite.ts` `greaseAfterEvents` → `greaseIgniteEvents` | yukarıdakiler **+** ateşli `save_resolved` ve ateşli `map_effect` (hasar alan yaratığın altıgeni) | ateş+gres |
| 3 | Kuyruk 18b karışımları | `surfaceMix.ts` `surfaceMixEvents` | `areaDamageOf` (her hasar türü) + isabetli `attack_resolved`; bu komutta oluşan `zone_created` | ateş+sis, yıldırım+buz, yıldırım+yağ/gres, soğuk+buhar, kuvvet/gök gürültüsü+su, asit+ağ; oluşan alev → bitişik yağ/gres (yayılma) ve üstündekilere hasar; oluşan yanan ağ → tutsak serbest + hasar; oluşan su → alev söner/buhar, gres kısalır, zehir kısalır, ağ çözülür |
| 4 | Nesneler | `objects.ts` `objectAreaEvents` → `damageObjectEvents` | `areaDamageOf` | alan hasarı nesnelere: yağ fıçısı kırılır (yağ yüzeyi; ateşle alev), barut patlar (`barutPatlama`), Wall of Stone paneli; asit + ahşap nesne |
| 5 | Orman / Buzul / Dağ | `forest.ts` `forestAfterEvents`, `wilds.ts` `wildsAfterEvents`, `highlands.ts` `highlandsAfterEvents` | kendi olay taramaları | çadır ateşle tutuşur (`tentFire`), buz mühür erir, donmuş şelale kırılır |

Komut dışı tepkime noktaları:

| Nokta | Dosya | Ne |
|---|---|---|
| Tur başı rüzgâr | `surfaceMix.ts` `windDriftEvents` (`commands.ts` ~474) | sis/zehir/buhar/Stinking Cloud sürüklenir; şiddetli rüzgârda süre kısalır |
| Tur başı su | `waterDecay.ts` `waterDecayEvents` | suda yüzey azalması (`waterSurfaceDecay`) |
| Gust of Wind | `surfaceMix.ts` `disperseEvents` (`spells.ts` 165) | çizgiye değen bulutlar biter (`gustDisperse`) |
| Nesne olayları | `surfaces.ts` `elementReactionEvents` (`objects.ts` 112, 136, 233) | yıkılan mangal, yanan fıçı, barut: ateş dokunuşu (geçiş 1'in `reactTo` yolu) |
| Alevli hane hedefleme | `ignite.ts` `executeFireHex` | ateşli tek hedef büyüsü yanıcı haneye |
| Boss lav | `boss.ts` 235 | alev yüzeyi oluşturur (tepkime geçişlerinden geçer) |
| Çakışan büyü alanları | `zones.ts` (aynı büyü → en yüksek DC) | aynı büyünün alanları toplanmaz |
| Konsantrasyon | `reduce.ts` `pruneZones` | konsantrasyonu düşen alan biter; tepkimeden doğan yüzey bağlı değil |
| Auralar | `auraCore.ts` `strongest` (K53) | aynı türden en güçlüsü |

## 2. İkili tablosu (Görev 4 listesine göre)

Durum: **var**: kodda var ve tabloda yazılı; **eksik**: kodda yok; **farklı**: kodda var ama listeden ya da diğer
yoldan farklı davranıyor; **değişmez**: kural gereği etkileşim yok (tabloda açıkça yazılı).

| İkili | Durum | Nerede | Not |
|---|---|---|---|
| alev + gres | var / **farklı** | `ignite.ts` (geçiş 2) | Dokunuş kaynağı diğerlerinden geniş (tek hedef ateş save'i ve harita ateşi de tutuşturur; yağ tutuşmaz) |
| alev + yağ | var | `surfaces.ts` (geçiş 1) | bütün birikinti; yayılma ayrı satır (geçiş 3) |
| alev + ağ | var | `surfaces.ts` | değen altıgenler yanan ağ; tutsak serbest geçiş 3 |
| alev + sis | var | `surfaceMix.ts` `mixFireFog` | |
| alev + buz | var | `surfaces.ts` (`erime`) | eriyen altıgen aynı geçişte buhara da döner (zincir derinliği gizli 2) |
| alev + su | var | `surfaces.ts` (`buhar`) | su yüzeyi kalır, üstüne buhar (iki yüzey aynı altıgende) |
| alev + barut | var | `objects.ts` (`barutPatlama`) | nesne katmanı |
| su + gres | var | `surfaceMix.ts` `mixWaterGrease` | yalnız oluşan su yüzeyiyle |
| su + yağ | değişmez | tabloda | yağ suyun üstünde kalır (iki zemin yüzeyi aynı altıgende) |
| su + zehir | var | `mixWaterPoison` | |
| su + ağ | var | `mixWaterWeb` | |
| su + buz | değişmez | tabloda | |
| soğuk + su | var | `surfaces.ts` (`donma`) | su yüzeyi + sığ su zemini |
| soğuk + buhar | var | `mixColdSteam` | |
| yıldırım + su | var | `surfaces.ts` (`suYildirim`) | zincir en çok 7 altıgen |
| yıldırım + buz | var | `mixLightningIce` | |
| yıldırım + yağ | var | `mixLightningIgnite` | |
| yıldırım + gres | var | `mixLightningIgnite` → `greaseIgniteEvents` | |
| rüzgâr + sis | var | `windDriftEvents` (tur başı) | |
| rüzgâr + zehir | var | `windDriftEvents` | |
| rüzgâr + buhar | var | `windDriftEvents` | |
| kuvvet + su | var | `mixForceWater` | gök gürültüsü de |
| asit + ağ | var | `mixAcidWeb` | |
| asit + ahşap | var | `objects.ts` | nesne hasarı |
| yağ + hareket | var | yüzey verisi `oil.zone` (`mixOilSlip`) | |
| gres + hareket | var | Grease büyü alanı (SRD) | |
| ateş + zehir bulutu | **farklı** | `surfaces.ts` (`zehirPatlama`) ↔ `mixPoisonInert` | iki kural çatışıyor: ev kuralı patlatır, 18b anahtarı (varsayılan açık) kapatır |

Eksik ikili: Görev 4 listesinin hepsi kodda var (ya da kuralla "değişmez"). Tablo dışında kalan ve listede de istenmeyen
ikililer (ör. ışık + karanlık, nekrotik/psişik + yüzey) etkileşimsiz sayılır.

## 3. Çelişkiler ve tutarsızlıklar

1. **Dört farklı dokunuş tanımı.** Geçiş 1 yalnız alan + isabetli saldırı (3 element). Geçiş 2 bunlara ateşli save ve harita
   ateşini ekler. Geçiş 3 her hasar türü. Nesneler yalnız alan. Aynı Fire Bolt isabeti gresi tutuşturur ama yağı
   tutuşturmaz.
2. **Ateş + zehir bulutu:** `zehirPatlama` (ev kuralı, açık) ile `mixPoisonInert` (açık) zıt. Bugün sonuç "patlamaz";
   eski savaşta (sürüm < 15) patlar.
3. **Derinlik "1" yazıyor ama değil:** erime → buhar aynı geçişte. Oluşan alev → bitişik yağ (geçiş 3, bir adım daha).
   Oluşan su → alev söner (geçiş 3, geçiş 1'in ürettiği suya da bakar). Tek bir derinlik sayacı yok.
4. **Katman yok:** aynı altıgende su + yağ + alev + buhar birlikte durabilir. Yeni yüzey eskisinin yerine geçmez.
5. **Sıra olay sırasına bağlı:** geçiş içinde yüzeyler alan listesi sırasıyla, altıgen sırası yok. Zar atan patlama ve
   zincir sırası alan kimliğine göre değişebilir (replay yine aynı, çünkü sonuç olaylara yazılıyor).
6. **Engel denetimi yok:** Wall of Stone/Force paneli ya da K53 geçici engel arkasındaki yüzey, alan altıgenlerine girmişse
   tepkimeye girer (alan seçimi görüşe bakıyor ama engel altıgeninin kendisi tepkime listesinde).
7. **Aynı kaynaktan çift hasar:** yağdan doğan alev üstündekilere hemen hasar verir. Aynı komutta gres tutuşması da hasar
   verir. Gres + yağ aynı altıgendeyse aynı ateş kaynağından iki alev hasarı alınabilir.
8. **Konsantrasyon:** konsantrasyonlu ağdan (Web) doğan yanan ağ konsantrasyon bitince kalır (1 tur; pratikte etkisiz).

## 4. Sayım

- Kodlu tepkime ikilisi: 28. Bunlar 22 element/yüzey satırı, 3 rüzgâr satırı ve 3 hareket satırıdır.
  - Nesne tepkimeleri (barut, asit + ahşap, fıçı) ayrıca sayılır.
- Eksik (Görev 4 listesine göre): 0.
- Farklı / çelişkili: 2 ikili (alev + gres dokunuş kaynağı; ateş + zehir) ve 6 genel tutarsızlık (§3: 1, 3–7).
