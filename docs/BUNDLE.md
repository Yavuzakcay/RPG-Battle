# Paket bütçesi (Kuyruk K57)

Ana parça (`dist/assets/index-*.js`, giriş ekranının yüklediği tek JavaScript dosyası) sınırı `data/paket-siniri.json`
`anaParcaKb`; `npm run build` sonunda `scripts/paket-siniri.mjs` denetler. K57'de sınır **500 → 420 kB**.

| | Önce (main 459ef5d + K57 Görev 1–2) | Sonra |
|---|---|---|
| Ana parça | 462,95 kB (gzip ≈144 kB) | **370,37 kB** (gzip ≈123 kB) |
| Değişiklik | — | `data/spells.json` (0–3. seviye büyüler, 120,7 kB işlenmiş) ana parçadan `loadClassData()`'ya taşındı (`spells-*.js` 93 kB) |

## Ana parçada ne var (sonra; Rollup işlenmiş boyut, bayt)

Toplam 472 298 bayt işlenmiş (küçültme sonrası 370 kB). Gruplar:

| Grup | Bayt | Not |
|---|---|---|
| React (react-dom, react, scheduler) | 146 993 | Ayrılamaz |
| `src/rules/*` | 80 003 | Oluşturucu yardımcıları (`builder.ts` 19,3 k, `classFeatures.ts` 12,9 k, `stats.ts`, `advancement.ts`, `characterRest.ts`, `backgrounds.ts`, `invocations.ts` …): karakter listesi, dinlenme ve kayıt göçleri giriş ekranından statik |
| `data/*.json` | 79 572 | `ses.json` 14,4 k, `races.json` 11,6 k, `weapons.json` 9,3 k, `backgrounds.json` 8,6 k, `items.json` 6,2 k, `classes.json` 6,2 k, `soy-renkleri.json` 6,0 k, `environments.json` 5,6 k, `soy-maske-rapor.json` 3,9 k … |
| `src/i18n` | 65 727 | `strings.ts` (TR çekirdek; savaş metinleri K34a'dan beri tembel `strings.tr2.ts`) |
| `src/ui` | 40 754 | `tint.ts` 8,7 k, `Avatar.tsx` 5,4 k, ses yönetimi (`audio/sound.tsx`, `soundPlan.ts`, `battleEnd.ts`), `MenuBackground.tsx`, simgeler |
| `src/screens/Screens.tsx` | 29 366 | Giriş, Oyuncu listesi, karakter kartı |
| `src/App.tsx`, `src/app/*`, `src/data/index.ts`, `src/battle/avatar.ts` | 26 093 | Yönlendirme, kayıt anahtarları, veri yükleyici |

En büyük 10 modül: react-dom 133,3 k · `strings.ts` 64,2 k · `Screens.tsx` 29,4 k · `builder.ts` 19,3 k · `ses.json` 14,4 k ·
`classFeatures.ts` 12,9 k · `App.tsx` 12,9 k · `races.json` 11,6 k · `weapons.json` 9,3 k · `tint.ts` 8,7 k.

## Tembel olanlar (K51–K56 ve K54 sonrası denetim)

Görevin andığı ağır parçaların hiçbiri ana parçada değil (önce de değildi):

| Parça | Nerede | Boyut (işlenmiş) |
|---|---|---|
| İmza motoru (`battle/imza.ts`, `imzaCore.ts`) | savaş motoru ortak parçası (`manualDice-*.js`) | 23,2 k |
| İmza verisi (`data/imza.json`) | `imza-*.js` (`loadClassData`) | 66,9 k |
| Hizalanma (`rules/alignment.ts`, `hizalanma.json`) | `AlignmentGrid-*.js`; `alignmentMoral.ts` + `AlignmentPanel.tsx` Game Master parçasında; rozet `AlignmentBadge-*.js` | 6,1 k + 10,1 k + 1,0 k |
| Etki çözücüsü (`battle/hexResolver.ts`, `yuzey-etkilesimleri.json`, `buyu-etiketleri.json`) | `session-*.js` (savaş oturumu) | 26,8 k |
| Arazi tabloları (`terrainSpell.ts`, `arazi-buyu-etkileri.json`, `zemin-etiketleri.json`) | `session-*.js` | 4,3 k |
| Moral (`battle/morale.ts`, `rules/moral.ts`, `moral.json`; `journey/moral.ts`) | savaş motoru parçası; Serüven parçası | 7,7 k + 3,6 k |
| Karadul (`battle/karadul.ts`, `karadul.json`) | savaş motoru parçası; `karadul-*.js` | 11,3 k + 6,3 k |
| Büyüler 0–3 / 4–5 / 6–9 | `spells-*.js` / `spells-45-*.js` / `spells-69-*.js` (hepsi `loadClassData`) | 93 / 40,5 / 28,7 kB |
| Canavarlar | `monsters-*.js` (`loadMonsters`) | 318 kB |

Ana parçada K51–K56'dan kalan tek parça `rules/alignmentRest.ts` (210 bayt; karakter listesindeki uzun dinlenme).

## Gecikme önlemi (önyükleme)

- **Sınıf + büyü verisi:** `App.tsx` `useClassData` uygulama açılınca (ilk çizimden sonra) `loadClassData()`'yı başlatır; büyü
  verisi bu yüklemeye katıldı. Giriş ekranı beklemez; Oyuncu, Game Master, Serüven ve savaş ekranları hazır olana dek
  "Yükleniyor" gösterir (eskisi gibi). Sınıf verisini `main.tsx`'te ilk çizimden önce başlatmak denendi: 4G'de açılış
  ≈170 ms gecikti (bant paylaşımı), geri alındı.
- **Karakter sihirbazı:** Oyuncu ekranına girilince `Builder` parçası (149 kB) boşta indirilir (`importBuilder`); "Yeni
  karakter" ilk dokunuşta beklemez.
- **Game Master ve savaş:** Game Master ekranına girilince savaş parçası zaten önyükleniyor (`useMonsters`, Görev I).

## Süre ölçümü (tek ekran)

`npx vite-node scripts/k57-olcum.ts 5` (üretim derlemesi, telefon görünümü, açılış ekranı/efektler kapalı, boş önbellek,
5 tekrarın medyanı, ms). "4G + 4×": 9 Mbit/s, 60 ms gecikme, 4× yavaş işlemci.

| Ölçüm | Kısıtsız önce | Kısıtsız sonra | 4G + 4× önce | 4G + 4× sonra |
|---|---|---|---|---|
| Açılış (giriş menüsü görünür) | 124 | 105 | 873 | 818 |
| Oyuncu listesi (menü görünür görünmez dokunuş) | 120 | 150 | 474 | 541 |
| Oyuncu listesi (menüde 1,5 sn sonra) | 65 | 114 | 176 | 260 |
| Yeni karakter (listeye girer girmez) | 279 | 145 | 1498 | 1405 |
| Yeni karakter (listede 1,5 sn sonra) | 156 | 66 | 1454 | 178 |
| Game Master harita seçicisi | 297 | 276 | 1915 | 1763 |
| Savaş başlangıcı ("Savaşa başla" → savaş ekranı) | 182 | 176 | 1145 | 1128 |

Yorum: açılış 4G'de ≈55 ms hızlandı (ana parça 93 kB küçük). Oyuncu listesi açılıştan hemen sonra dokunulursa 4G'de ≈70–85 ms
yavaşladı (büyü parçası sınıf verisiyle aynı anda iniyor; gerçek soğuk açılışta ≈4,5 sn'lik açılış ekranı bu süreyi örter).
Sihirbaz, önyükleme ipucuyla 4G'de 1,45 sn → 0,18 sn. Savaş başlangıcı değişmedi (savaş ekranı sınıf verisini zaten bekliyordu).
Ölçümler tek makinede; ±%10 gürültü.
