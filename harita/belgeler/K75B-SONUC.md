# Kuyruk K75b — K75 doğrulama mührü ve parti jetonu yönü

Kural sürümü (79) ve kayıt sürümü (22) değişmedi. Yeni mekanik ve denge ayarı yok.

## 1a) check:ses kararlılığı (her biri 15 kontrol)

| Koşu | K75 sonrası (wip/k75b) | K75 öncesi (38ac632) |
|---|---|---|
| 1 | 15 tamam, 0 hata | 15 tamam, 0 hata |
| 2 | 15 tamam, 0 hata | 15 tamam, 0 hata |
| 3 | 15 tamam, 0 hata | 15 tamam, 0 hata |

Altı koşunun hepsi yeşil: bu ölçümde kararsızlık yok. Önceki dalgalanma (varsa) yük altında, paralel süreçlerle çakışma kaynaklı görünüyor; kök neden aranmadı. Görev 2'den sonraki kapı koşusu da 15/15, 0 hata.

## 1b) Regresyon 78 = 79 (binek yok, 3. seviye standart parti, 30 tohum)

| Senaryo | 78 kazanma | 79 kazanma | Tur ort. 78 / 79 | İmza farkı |
|---|---|---|---|---|
| Çöl | 23/30 | 23/30 | 11,63 / 11,63 | 0 |
| Kale | 24/30 | 24/30 | 9,30 / 9,30 | 0 |
| Mağara | 24/30 | 24/30 | 8,33 / 8,33 | 0 |
| Orman | 19/30 | 19/30 | 7,27 / 7,27 | 0 |

Birebir aynı (kazanma, tur, son durum imzası): K75'in üç değişikliği (Protection from Evil and Good süreli durum, P9 tepki save'i, sinkMud) bu senaryolarda iz bırakmıyor. Araç: `npx vite-node src/sim/k75bKarsilastir.ts -- 30`. `k74Regresyon`, `binekMb2Regresyon`, `binekMb5Regresyon` testleri yeşil.

## 1c) YZ süresi (simetrik sıra 78, 79, 79, 78)

| Ölçüm | 78 ort. ms | 79 ort. ms | Fark |
|---|---|---|---|
| Kale, büyücü, n=3 (23,9 / 26,6 ↔ 28,7 / 24,3) | 25,3 | 26,5 | +%5 |
| Kale, `--binek --kontrollu`, n=8 (23,2 / 22,9 ↔ 23,0 / 23,2) | 23,1 | 23,1 | %0 |

Karar imzası ve aday/önizleme/kuru çalıştırma sayaçları 78 ve 79'da aynı. Hedef (≤ +%15) tutuyor.

## 1d) Binekli denge (bağımsız binek, 5. seviye, 100 tohum)

| Senaryo | Kazanma 78 → 79 | Tur 78 → 79 | Binek canlı / hâlâ binici 78 → 79 |
|---|---|---|---|
| Çöl | %86 → %86 | 6,3 → 6,3 | 25% / 1% → 25% / 1% |
| Kale | %16 → %16 | 5,9 → 5,9 | 2% / 0% → 2% / 0% |
| Mağara | %80 → %80 | 9,4 → 9,3 | 25% / 0% → 26% / 0% |
| Orman | %45 → %45 | 6,2 → 6,2 | 13% / 0% → 13% / 0% |

Kazanma kayması 0 puan (> 8 puan sınırının çok altında). Not: ölçüm aracı ayrı "binme" ve "inme" olay sayısı yazmıyor; yalnız binek canlı / savaş sonunda hâlâ binili oranı var. Olay sayaçları istenirse ayrı küçük bir görev.

## 2) Parti jetonu yönü

`src/ui/tokenFacing.ts` `facesLeft`: parti ve düşman için tek saf işlev; eşit uzaklıkta zıt yönde hedefte ya da hedef yokken önceki yön, o da yoksa harita ortası. `MapBattle.tsx` yön önbelleği `useRef` (render'a özel, kayda girmez). Kanat katmanı `TokenFigure`'da figürle birlikte aynalanır. Sivil jetonlar, halka/rozet/efektler, `.body-base`, karakter listesi/sihirbaz rozetleri aynı. Ekran görüntüsü: `harita/belgeler/k75b-jeton-yonu-normal.png` (Kale, parti solda, kurtlar sağda ve sola bakıyor). Ters yerleşim (parti sağda) görsel olarak denenmedi: kayıt yeniden oynatıldığı için konum enjekte edilemedi; mantık birim testinde (`tokenFacing.test.ts`).
