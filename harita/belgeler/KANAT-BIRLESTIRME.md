# Dragonborn kanat birleştirme doğrulaması (KB)

Tarih: 2026-11-20. Ölçülen sürüm: `birlesik` `f458a3f` (`git pull --no-rebase origin birlesik` sonrası). Kanat dosyaları `d62926d` ile `f458a3f` arasında değişmedi; bu yüzden geometri, çizim ve test ölçümleri (`d62926d`'de alındı) ikisi için de geçerli, testler `f458a3f`'te yeniden koşuldu, ana parça `f458a3f` ağacında yeniden ölçüldü. **Salt okunur denetim:** ürün koduna, veriye, görsele dokunulmadı; yalnız bu belge eklendi.

Hedef (kullanıcı kararı 2026-11-20): ikinci sekmenin pembe karışımlı sürümü (zar, soy rengiyle pembenin yarı yarıya karışımı; beyaz pençe ve kemik uçları). İlk sekmenin (`f9e3261`) kodu geri getirilmeyecek. Palet ΔE hedefleri artık geçerli değil (pembe karışım bilinçli tasarım); Siyah koyuluğu ve Beyaz/Gümüş ayrışması için gözle kontrol yeterli: `docs/sabah/dragonborn-kanat/karisim-ozet.webp`. Bu yüzden öneriler yalnız pembe karışımlı sürümü tamamlamaya yöneliktir.

Arka plan: aynı görev iki sekmede yapıldı. İlk sekme `f9e3261` ile kök tabanlı uygulamayı gönderdi; ikinci sekme çakışmayı çözerken ilk sekmenin kodunu çıkarıp kendi uygulamasını bıraktı (`18d86fc`), sonra pençe/zar katmanlarını ekledi (`e3b8262`, `00ccdce`).

## 0. Özet

| # | Bulgu |
|---|---|
| 1 | İlk sekmenin kodu tamamen çıkmış: `WingRootParts.tsx`, `wingRoot.test.tsx`, `kok`, `.look-bg`/`.winged`, `raceColor`, `LookFrame` `avatar` prop'u yok; `tsc` temiz. Çift modül ve çift veri yok. |
| 2 | 290 jetonun (266 hücreli + 24 sınıf-genel) hepsinde kanat gövdeye bağlı: kopuk 0, örtüşme en az 161 px. Gerçek çizimde (SVG savaş jetonu 290, rozet 40 hücre) kanatlı/kanatsız piksel farkıyla figürü kapatan piksel 0. |
| 3 | İlk sekmenin kök-içi ölçütü (3 px pay) bu sürümde **103/290** jetonda geçmiyor (hücreli 101/266, sınıf-genel 2/24); pay olmadan (nokta) **26/266**. Neden: bu sürümde kök bilinçli olarak siluet kenarında; ilk sekmede merkezde ve gövdenin derininde. 26 jetonun hepsi y düzeltmesiyle çözülür (jeton adıyla öneriler §2.3). İlk sekmenin %46'ya aldığı üç jetondan `male-bard` ve `male-warlock` bu sürümde sıkı ölçütte (K1) geçmiyor (K2 geçiyor; sıkı pay için önerilen y 0,391 / 0,387, yani ilk sekmenin tersine hafif yukarı), `erkek-wizard-WZ-B4` iki ölçütte de geçiyor. Erkek Bard/Warlock/Wizard'da K1'i geçmeyen 16 jeton adlarıyla §2.3'te. |
| 4 | Ana parça: sorulan 452,7 → 460,81 kB (+8,08) artışı: 452,7 ilk sekmenin ağacı (`f9e3261`: 452 731), 460,81 ikinci sekmenin ucu (`00ccdce`: 460 808; birleşik `d62926d`/`f458a3f`: 460 817). Kanat kodundan gelen kısım +7,14 kB (ilk sekmenin 3,91'inin yerine geçen 11,05); kalan +0,94 kanatla ilgisiz. Kanat işi tek başına +11,05 kB (kök verisi 6,92 + KW1 kod/palet 2,77 + KW2/KW3 katmanlar 1,35), birleşik artışın %92'si. Sınır 500 kB: 39 kB pay. Paralel `BUNDLE-ARTIS.md` ile parça bazında birebir uyumlu; başlık sayısı (459,5) ve kanat payı (%82) ölçüt farkından ayrışıyor (§3.1). |
| 5 | `wingRoot.test.tsx` yok; yedi testinin beşinin karşılığı var, ikisi kısmi (§4). Yazılacak 8 test listelendi. Güncel kanat testleri geçiyor (7 dosya / 97 test). |
| 6 | Ölü kod yok; bir kol hazır bekliyor (`WingRoot.y`, üreticisi yok). Belge ve veri kalıntıları: bayat `not` metni, bayat görseller, DECISIONS'ta bayat boyut sayısı, kullanılmayan `melek-acik.webp` (§5). |

## 1. Kod envanteri

### 1.1 İlk sekmeden ne çıktı, ne kaldı

İlk sekmenin commit'i `f9e3261`: 12 dosya, +328/−37 satır. Güncel ağaçta karşılıkları:

| Parça | İlk sekme (`f9e3261`) | Güncel (`f458a3f`) | Durum |
|---|---|---|---|
| Kök modeli ve yerleşim | `lineageLook.ts`: `WingRoot {gorsel, x, y, olcek, aci, duzeltme}`, `rootFor`, `wingRootLayout`, `wingRootBounds`. Çift görselin sağ yarısı `clipPath` ile; kök jeton merkezinden x 0,03, y 0,44, ölçek 1,25 (çift genişliği / jeton), 12° | `lineageLook.ts`: `WingMirror {dx, aci}`, `WingRoot {sol, sag, y?}`, `wingPlacements`, `placementTransform`, `placementBounds` (+78/−11 satır). TEK kanat görseli, sol ayna; kök jeton başına siluetten; y = `omuz` 0,40; ölçek 0,6; 20° | ilk sekmeninki çıkarıldı |
| Kök verisi | `kanat-esleme.json` `dragonborn.kok` (tek kayıt) + `duzeltme`: `dragonborn-male-bard`, `dragonborn-male-warlock`, `dragonborn-erkek-wizard-WZ-B4` y 0,46 | `data/dragonborn-kanat-kok.json` (975 satır, 11 KB: 72 grup + 170 jeton, `[sol, sag]` x) + `src/ui/wingRoot.ts` (25 satır; `y` döndürmez) | yerine geçti; **y düzeltmesi yok** (ilk sekmenin üç düzeltmesinin karşılığı yok) |
| Savaş jetonu ve karakter listesi (SVG) | `WingRootParts.tsx` (30 satır), `TokenFigure` `tokenSrc` prop'u, `CharacterFigure` `wingRootBounds` | `Avatar.tsx` (+50/−8): `WingPairImage` (kanat grubu: taban → zar → pençe), `TokenFigure` `wingRoot` prop'u, `wingExtent` | ilk sekmeninki çıkarıldı |
| Rozet (HTML) | `LookFrame` zemin dairesini `.look-bg` ile kendisi çizer, rozet zemini `!important` saydam, `.look-frame.winged`, `WingLayer` SVG kök dalı, `avatar` prop'u (`MapBattle.tsx` `framedBadge`), `battle/avatar.ts` `raceColor` | kanat `AvatarBadge` içinde: `.avatar` içi SVG `badge-wings`, zemin ile figür arası; `LookFrame` (+5/−2) yalnız `LookContext` (`lookContext.ts`, 9 satır) sağlar; CSS `.avatar.has-wing` (figür `clip-path`), `.badge-wings` (+8 satır) | ilk sekmeninki çıkarıldı (`MapBattle.tsx`, `battle/avatar.ts` eski hâlinde) |
| Palet / filtre | `WingPalet.orta/aralik`, 17 duraklı `feComponentTransfer` tablosu, `wingFilterId` orta/aralık içerir; kanat–gövde ΔE ≤ 0,5 | `WingPalet.esik` + `feColorMatrix` ölçek/ofset (`wingLumaMatrix`, `WingFilter.tsx` +3/−2), iki duraklı tablo; soy paleti golge/isik/esik + `zar` (pembe karışımı) | ilk sekmeninki çıkarıldı |
| Katmanlar (zar, pençe) | yok | `wingParts`, `WingPart`, `dragonborn-zar.webp` (22 KB), `dragonborn-pence.webp` (2 KB), `katmanlar`, `pembe` | yalnız güncel (KW2/KW3) |
| Kanat görseli | çift (768×281, 57 KB, değişmedi) | tek kanat 364×279 (28 KB); çift hâli git geçmişinde (`d7e212a`) | değişti |
| Test | `wingRoot.test.tsx` (101 satır, 7 test, görsel okumaz) | `kanatKok.test.tsx` (207 satır, 15 test) + `kanatKatman.test.tsx` (129 satır, 8 test); `as1cGorunum.test.tsx` eşleme testi güncellendi (+8/−2) | ilk sekmeninki çıkarıldı |
| Üreticiler ve önizleme | yok (ölçüm betiği depoda yok) | `scripts/dragonborn-kanat-{tek,kok,katman}.py`, `-palet.ts`; `onizleme-kanat.html` + `src/preview/kanatOnizleme.tsx` (dev) | yalnız güncel |
| Belge ve görsel | DECISIONS kaydı; `kontak.webp` (266 jeton, 96 px), `once-sonra.webp` | DECISIONS'ta iki kayıt (ilkine "çıkarıldı" notu); görseller `docs/sabah/dragonborn-kanat/oturum2-*/` alt klasöründe | arşiv |

### 1.2 Kalıntı taraması

- `grep` (`WingRootParts`, `wingRootLayout`, `wingRootBounds`, `raceColor`, `look-bg`, `.winged`, `look-wing-svg`, `dragonborn.kok`, `.kok`) `src/`, `data/`, `scripts/` altında 0 eşleşme (tek eşleşme Tiefling'in `winged` soy adı). `npm run typecheck` temiz.
- Kanat dışa aktarımlarının hepsi kullanılıyor (`TOKEN_SPACE`, `WingMirror`, `WingRoot`, `WingPart`, `WingPlacement`, `wingPlacements`, `placementTransform`, `placementBounds`, `wingParts` (içeride + test), `wingLumaMatrix`, `LookContext`, `wingRoot`).
- Eski yol canlı: `WingImage`, `WingLayer`, `wingBox` Tiefling, Celestial ve eski çift görselli slotlar için kullanılıyor; yinelenen kod değil.
- `src/ui/wingAnim.ts` (animasyonlu Anka kanadı, `7637fdf`) iki uygulamadan da bağımsız; `Avatar.tsx` onu yalnız sayfa (`wing.sprite`) kanatlarında kullanır (`useWingAnim(!!wing.sprite)`), Dragonborn yolu kullanmaz.

## 2. Kök, bağlantı ve kapatma ölçümü (290 jeton)

### 2.1 Yöntem ve ölçütler

Ölçüm betiği: **ilk sekmenin ölçüm betiği commit geçmişinde yok** (`f9e3261`'de betik yok, `git log --all` ile başka dalda da yok). Elde yalnız DECISIONS tarifi var: "siluet profilinde kök iki tarafta da gövdenin içinde (3 px pay): tek global konumla 287; kalan üçü (sınıf-genel Bard ve Warlock erkek, `dragonborn-erkek-wizard-WZ-B4`) o satırda kol boşluğuna denk geldiği için `y` 0,46". Tarife uyan varyantlar ilk sekmenin kendi modelinde (x = 128 ± 0,03×256, y = 0,44) denendi:

| Varyant | Geçmeyen | Adlar |
|---|---|---|
| nokta (alfa ≥ 128) | 1 | `male-bard` |
| satırda ±3 px | 4 | `erkek-fighter-ID11`, `erkek-wizard-WZ-B4`, `kadin-monk-ID4`, `male-bard` |
| 3 px yarıçaplı daireyle aşınmış silüet (**K1**) | 6 | + `kadin-wizard-WZ-B3`, `male-warlock` |
| 7×7 kare pay | 9 | + `erkek-fighter-ID2`, `erkek-monk-ID4`, `kadin-wizard-WZ-B4` |

Tarifteki üç jeton K1'de de geçmeyenler arasında ama K1 üçünü daha yakalıyor (`erkek-fighter-ID11`, `kadin-monk-ID4`, `kadin-wizard-WZ-B3`); üç düzeltmeyle K1 hâlâ 3 jeton, nokta 0 jeton veriyor. Yani "287/290" iddiası bire bir yeniden üretilemedi. **K1** (≥ 3 px pay, daire) tarife en yakın ve en sıkı ölçüt olarak alındı; nokta ölçütü (K2) ayrıca verilir.

Bu sürüme uygulanan ölçütler (jeton uzayı 256 px, silüet = alfa ≥ 128, kök satırı y = `omuz` × 256 = 102; betik Ek A):

- **K1** sıkı kök-içi: iki kök noktası da silüetin 3 px yarıçaplı daireyle aşındırılmış hâlinde.
- **K2** kök-içi (nokta): iki kök noktası silüet içinde.
- **K3** kopuk: dönmüş ve aynalı kanat maskesi, silüetin 1 px genişletilmişiyle kesişmiyor.
- **K4** bağlantı gücü: kanat ∩ silüet piksel sayısı ve kanadın silüet dışında kalan (görünen) payı.
- **K5** gerçek çizim: kanatlı ve kanatsız çizimin piksel farkı (Ek B). *Kapatma*: figürün tam opak (alfa ≥ 250, 2 px aşınmış) pikselinde fark varsa kanat figürün önüne geçmiştir. *Kopukluk*: fark pikselleri (görünen kanat), sol ve sağ yarıda silüetin 2 px genişletilmişiyle kesişmiyorsa kanat kopuktur.

### 2.2 Sonuç (güncel sürüm)

| Ölçüt | Sonuç |
|---|---|
| K1 sıkı kök-içi | **103/290 geçmiyor** (hücreli 101/266, sınıf-genel 2/24: `male-bard`, `male-warlock`) |
| K2 kök-içi (nokta) | **26/290 geçmiyor** (hepsi hücreli, 26/266) |
| K3 kopuk | **0** |
| K4 örtüşme (jeton başına en zayıf kanat) | en az 161 px (`kadin-bard-ID1`), ortanca 946; sol + sağ birlikte ortanca 1308 |
| K4 görünen oran (en zayıf kanat) | en az 0,455 (`erkek-cleric-ID1`), ortanca 0,83; ilk altı: `erkek-cleric-ID1` 0,455, `erkek-bard-ID7` 0,466, `female-barbarian` 0,489, `kadin-barbarian-ID1`, `erkek-paladin-ID5` 0,511, `kadin-sorcerer-SC-1` 0,516 |
| K5 kapatma (SVG savaş jetonu, 290 jeton) | **0 piksel** |
| K5 kapatma (HTML rozet, 40 hücre: 10 soy × Fighter ID12 / Wizard WZ-A1 × 256 / 96 px) | **0 piksel** |
| K5 kopuk (SVG 290 + rozet 40) | **0** |
| K5 görünen kanat pikseli | SVG (132 px jeton, Gold): kanat başına en az 1515, ortanca 2515; rozet: en az 1081 |

Yorum:

- K1'in büyük kısmı tasarım farkından: bu sürümde kök, 0,36–0,44 bandındaki orta koşunun kenarının 6 px içinde (siluet kenarına yakın); ilk sekmede kök merkezden ±0,03'te, gövdenin derininde. Kenara yakın kökte sıkı ölçüt tek satıra duyarlıdır. K1'i geçmeyen ama K2'yi geçen 77 jetonda kanat bağlı ve çizimde kusur görünmüyor (K3, K5 temiz): kozmetik.
- K2 (26 jeton) gerçek zayıflık: kök noktası kendi satırında silüet dışında (kol boşluğu, pelerin kenarı). Kanat yine bağlı (örtüşme ≥ 161 px) ama kanadın çıkış noktası siluetin dışında kalıyor.
- Aynalanan jetonlar (`data/jeton-ayna.json`: `warlock-WL-8`, Gulyabani; iki Dragonborn jeton): ölçümde maskenin de aynalanması gerekti (ilk koşuda maske aynalanmamıştı: bu iki jetonda 117 piksellik yanlış pozitif kapatma; aynalayınca 0). SVG yolunda kanat figürle birlikte aynalanıyor ve ölçüm temiz. Rozet yolu bu jeton için piksel olarak ölçülemedi (önizleme sayfası rozet için jeton seçemiyor); işaretleme düzeyinde doğrulandı (`--mirror:-1` + `badge-wings` + `has-wing`).

### 2.3 Geçmeyen jetonlar ve yükseklik düzeltmesi önerisi

Öneri biçimi: jeton adıyla `y` (jeton yüksekliği oranı; `omuz` ile aynı birim), kök x'leri aynen. Arama: kullanıcının özgün bandı %38–55 (satır 97–141) içinde 0,40'a en yakın satır; sıkı (K1) → 2 px pay → nokta sırasıyla. 103 önerinin hepsinde kanat bağlantısı korunuyor (önerilen satırda yeniden ölçüldü: kopuk yok, en az 165 px örtüşme, görünen oran ≥ 0,46).

**P1: kök noktası silüet dışında (K2), 26 jeton.** Hepsi y düzeltmesiyle sıkı ölçütü (K1) geçiyor.

| Jeton | Kök x (sol / sağ) | Önerilen y | Δy | Ölçüt | Not |
|---|---|---|---|---|---|
| `erkek-cleric-ID5` | 100 / 166 | 0.445 | +0.047 | sıkı |  |
| `erkek-druid-ID7` | 95 / 172 | 0.445 | +0.047 | sıkı |  |
| `erkek-fighter-ID3` | 116 / 180 | 0.434 | +0.035 | sıkı |  |
| `erkek-fighter-ID7` | 101 / 172 | 0.383 | -0.016 | sıkı |  |
| `erkek-paladin-ID10` | 93 / 176 | 0.449 | +0.051 | sıkı |  |
| `erkek-rogue-ID6` | 99 / 172 | 0.379 | -0.020 | sıkı |  |
| `erkek-sorcerer-SC-2` | 115 / 172 | 0.422 | +0.023 | sıkı |  |
| `erkek-wizard-WZ-A4` | 104 / 171 | 0.418 | +0.020 | sıkı |  |
| `erkek-wizard-WZ-B5` | 104 / 171 | 0.547 | +0.148 | sıkı | büyük |
| `kadin-bard-ID1` | 129 / 182 | 0.383 | -0.016 | sıkı |  |
| `kadin-bard-ID6` | 105 / 157 | 0.418 | +0.020 | sıkı |  |
| `kadin-bard-ID9` | 110 / 177 | 0.379 | -0.020 | sıkı |  |
| `kadin-druid-GR` | 99 / 169 | 0.383 | -0.016 | sıkı |  |
| `kadin-druid-ID1` | 97 / 151 | 0.414 | +0.016 | sıkı |  |
| `kadin-druid-ID2` | 96 / 160 | 0.445 | +0.047 | sıkı |  |
| `kadin-fighter-GR` | 103 / 172 | 0.461 | +0.062 | sıkı | büyük |
| `kadin-monk-GR` | 124 / 172 | 0.422 | +0.023 | sıkı |  |
| `kadin-monk-ID6` | 115 / 183 | 0.379 | -0.020 | sıkı |  |
| `kadin-ranger-ID1` | 99 / 168 | 0.551 | +0.152 | sıkı | büyük |
| `kadin-ranger-ID9` | 100 / 162 | 0.523 | +0.125 | sıkı | büyük |
| `kadin-sorcerer-GR` | 106 / 172 | 0.520 | +0.121 | sıkı | büyük |
| `kadin-sorcerer-SC-6` | 110 / 172 | 0.445 | +0.047 | sıkı |  |
| `kadin-warlock-WL-7` | 110 / 172 | 0.422 | +0.023 | sıkı |  |
| `kadin-wizard-WZ-A4` | 103 / 172 | 0.418 | +0.020 | sıkı |  |
| `kadin-wizard-WZ-B2` | 103 / 172 | 0.418 | +0.020 | sıkı |  |
| `kadin-wizard-WZ-B5` | 103 / 172 | 0.379 | -0.020 | sıkı |  |

**P2: yalnız K1 (pay yetersiz), 77 jeton:** önerilen y'ler Ek C'de ("P2"). Düzeltme büyüklüğü: 70 jetonda sıkı ölçütle, 4'ünde 2 px payla, 3'ünde yalnız noktayla çözülüyor; çözülemeyen yok. Tüm 103 öneride |Δy| ortanca 0,012, en çok 0,152.

**Büyük düzeltmeler (|Δy| > 0,06): 11 jeton** (P1'de 5, P2'de 6; hepsi aşağı yönde, yani kök omuz satırından gövdeye doğru iniyor): `erkek-sorcerer-SC-6`, `erkek-wizard-WZ-B5`, `kadin-barbarian-ID3`, `kadin-barbarian-ID4`, `kadin-fighter-GR`, `kadin-paladin-ID7`, `kadin-ranger-ID1`, `kadin-ranger-ID3`, `kadin-ranger-ID9`, `kadin-sorcerer-GR`, `kadin-wizard-WZ-B4`. Bunlarda kanat kökü omuz hizasından belirgin biçimde ayrılır ve komşu jetonlarla tutarsız görünebilir; P2'deki 6 jetonda kök zaten silüetin içinde (K2 geçiyor), dokunmamak daha doğru. P1'deki 5 jetonda y yerine kökü içeri (x) kaydırmak daha uygun olabilir (bu sürümde x'e dokunulmadı, ayrı ölçüm gerekir).

**Erkek Bard, Warlock ve Wizard (K1'i geçmeyenler; son satır ilk sekmenin düzelttiği üçüncü jeton):**

| Jeton | K1 | K2 | Önerilen y (Δy) |
|---|---|---|---|
| `erkek-bard-ID5` | geçmez | geçer | 0.395 (-0.004) |
| `erkek-bard-ID6` | geçmez | geçer | 0.395 (-0.004) |
| `erkek-warlock-GR` | geçmez | geçer | 0.406 (+0.008) |
| `erkek-warlock-WL-6` | geçmez | geçer | 0.434 (+0.035) |
| `erkek-warlock-WL-7` | geçmez | geçer | 0.391 (-0.008) |
| `erkek-warlock-WL-9` | geçmez | geçer | 0.395 (-0.004) |
| `erkek-wizard-GR` | geçmez | geçer | 0.406 (+0.008) |
| `erkek-wizard-WZ-A1` | geçmez | geçer | 0.434 (+0.035) |
| `erkek-wizard-WZ-A3` | geçmez | geçer | 0.402 (+0.004) |
| `erkek-wizard-WZ-A4` | geçmez | geçmez | 0.418 (+0.020) |
| `erkek-wizard-WZ-A6` | geçmez | geçer | 0.402 (+0.004) |
| `erkek-wizard-WZ-A8` | geçmez | geçer | 0.406 (+0.008) |
| `erkek-wizard-WZ-B2` | geçmez | geçer | 0.430 (+0.031) |
| `erkek-wizard-WZ-B5` | geçmez | geçmez | 0.547 (+0.148) |
| `male-bard` | geçmez | geçer | 0.391 (-0.008) |
| `male-warlock` | geçmez | geçer | 0.387 (-0.012) |
| `erkek-wizard-WZ-B4` | geçer | geçer | düzeltme gerekmiyor |

İlk sekme üç jetonun kökünü %46'ya (aşağı) almıştı: sınıf-genel `male-bard`, `male-warlock` ve `erkek-wizard-WZ-B4` (`dragonborn-` önekli adlarla). Karşılaştırma: `erkek-wizard-WZ-B4` bu sürümde iki ölçütte de geçiyor (düzeltme gerekmiyor); `male-bard` ve `male-warlock` K2'yi geçiyor, K1'de sıkı pay için önerilen y 0,391 / 0,387 (kök burada siluet kenarında; yön ilk sekmeninkinin tersi). Tabloda yalnız K1'i geçmeyen jetonlar var; erkek Warlock'ta 4 (`GR`, `WL-6`, `WL-7`, `WL-9`), erkek Bard'da 2 (`ID5`, `ID6`) hücreli jeton ve 8 erkek Wizard (`GR`, `WZ-A1`, `WZ-A3`, `WZ-A4`, `WZ-A6`, `WZ-A8`, `WZ-B2`, `WZ-B5`) var; K2'yi de geçmeyenler yalnız `erkek-wizard-WZ-A4` ve `erkek-wizard-WZ-B5` (P1'de).

Veri ve kod değişikliği (yapılmadı, bu denetimde kod değiştirilmiyor): `data/dragonborn-kanat-kok.json` `jeton` girdileri `[sol, sag, y]` (y jeton uzayı satırı, tamsayı; yoksa `omuz × 256`); `wingRoot()` `y`'yi döndürür (`WingRoot.y` ve `wingPlacements` `root.y` kolu zaten var).

## 3. Ana parça artışı (452,7 → 460,81 kB)

Sorulan artış: **452,7 kB** ilk sekmenin ağacı (`f9e3261`: 452 731 bayt), **460,81 kB** ikinci sekmenin ucu (`00ccdce`: 460 808 bayt; birleşik `d62926d` ve güncel `f458a3f` ağaçları 460 817 bayt) = **+8,08 kB**.

Yöntem: `git archive` ile geçici ağaçlar (depo değişmedi), `vite build`, `index-*.js` boyutu (`scripts/paket-siniri.mjs` ile aynı ölçüt: bayt / 1000; gzip `-9`). Kanat işini ayırmak için aynı ağaçta kanat dosyaları (`lineageLook.ts`, `Avatar.tsx`, `LookFrame.tsx`, `WingFilter.tsx`, `kanat-esleme.json`) `d7e212a` sürümüne döndürüldü, `wingRoot.ts`, `lookContext.ts`, `dragonborn-kanat-kok.json` silindi (ağaçlar arası fark `diff -rq` ile doğrulandı: yalnız bu dosyalar). Bu beş dosyayı `d7e212a`'dan beri yalnız kanat işi değiştirdi (`git log` doğrulandı).

| Ağaç | Ana parça (bayt) | gzip | Fark |
|---|---|---|---|
| `96883d0` (ilk sekmenin ebeveyni, kanatsız taban) | 448 817 | 147 179 | |
| `f9e3261` (ilk sekme) | 452 731 | 148 904 | **+3 914** (+1 725 gz): ilk sekmenin tek başına katkısı |
| `00ccdce` (ikinci sekmenin ucu, birleşim öncesi) | 460 808 | 150 726 | |
| `d62926d` (birleşik ağaç) | 460 817 | 150 713 | |
| `f458a3f` (güncel HEAD, bu belgenin ölçtüğü) | 460 817 | 150 731 | `d62926d` ile aynı (arada yalnız tembel savaş motoru, veri ve belge değişti) |
| `d62926d`, kanat işi geri alınmış | 449 768 | 147 535 | kanat işi = **+11 049** (+3 178 gz) |
| `d62926d`, yalnız KW2/KW3 katmanları geri alınmış (`a572913` sürümü) | 459 463 | 150 255 | KW2/KW3 = **+1 354** (+458 gz); KW1 = +9 695 (+2 720 gz) |
| `d62926d`, kök verisi boş | 453 896 | 149 094 | kök verisi JSON = **+6 921** (+1 619 gz) |

Dağılım (birleşik ağaç, `d62926d` ve `f458a3f`): 448 817 → 460 817 = +12 000 bayt. Bunun **11 049'u kanat işi** (%92: kök verisi 6 921, KW1 kod ve palet 2 774, KW2/KW3 katmanlar 1 354), kalan **951'i** kanatla ilgisiz (kanatsız ağaç ile taban farkı; `BUNDLE-ARTIS.md`'ye göre WS87 biçim kartı metinleri +235 ve Dungeondex ana menü girişi ≈ +0,7 kB, bu belgede ayrıca ölçülmedi). `npm run build` 460,81 kB bildirdi (ikinci sekmenin ucu; birleşik ağaçta 460,82; ±0,01 kB, yuvarlama).

Sorulan +8,08 kB'ın dökümü: ilk sekmenin kanat kodu +3,91 kB'dı; ikinci sekmenin kanat kodu +11,05 kB; yani **kanat kodundan gelen kısım +7,14 kB** (ilk sekmenin yerine geçen uygulamanın fazlası), kalan **+0,94 kB** kanatla ilgisiz. İlk sekmeden +7,1 kB fazla olmasının nedeni jeton başına kök tablosu (6,9 kB; ilk sekmede tek global kök + 3 düzeltme vardı).

### 3.1 Paralel denetimle karşılaştırma (`harita/belgeler/BUNDLE-ARTIS.md`, Kuyruk A İş 1, `b07a390`)

Aynı sorunun ikinci bir ölçümü bu belgeden önce commit edilmiş. Ölçümler aynı sonuca varıyor ama bir rakam ve bir ölçüt farkı var; iki belgeyi birlikte okurken bunlar karıştırılmamalı:

| Konu | `BUNDLE-ARTIS.md` | Bu belge (doğrudan ölçüm) | Yorum |
|---|---|---|---|
| Parça bazında kanat işi | KW1 +9 695, pençe +691, zar +663 (UTF-8 bayt, ağaç ağaç) | KW1 +9 695, KW2/KW3 +1 354 (= 691 + 663) | **birebir aynı**, iki yöntem birbirini doğruluyor |
| Başlık sayısı | 448,8 → **459,5** kB | 448,82 → **460,82** kB | 459,46, bu ölçümde KW2/KW3 olmayan ağacın boyutuyla aynı (459 463 bayt); `00ccdce` ağacının kendisi gerçekte 460 808 bayt. Başlıktaki sayı pençe + zar katmanlarını (+1,35 kB) içermiyor gibi görünüyor (olası neden; kaynak ölçüm betiği depoda yok) |
| Kanat payı | +16 400 bayt, **%82** (modül tablosu) | +11 049 bayt, **%92** (parça farkı) | modül tablosu Rollup `renderedLength` (minify öncesi) toplamı: +17,7 kB; parça farkı (minify sonrası) +11,9 kB. Kanat payı minify sonrası %92'dir; iki ölçü aynı tabloda toplanmamalı |
| Kök verisi | 9 674 (ham JSON) | 6 921 (minify sonrası, boşaltılarak ölçüldü) | gerçek kazanç bu |
| Kanat çizim kodu ve palet | ≈ 4–5 kB (Öneri 2) | KW1 kod ve palet 2 774 + katmanlar 1 354 = ≈ 4,1 kB | uyumlu |
| Öneri 1: kök verisi tembel yüklensin | ≈ 9,7 kB kazanç | ≈ 6,9 kB (gzip ≈ 1,6 kB) | yön aynı, kazanç minify sonrası daha küçük |

Seçenekler (bu belgenin önerisi D10): (a) olduğu gibi bırakmak (39 kB pay); (b) kök tablosunu tembel parçaya almak (`import()`; ilk karede varsayılan kök, ardından düzeliyor: görsel zıplama riski; `BUNDLE-ARTIS.md` Öneri 1 ve 3 aynı yolu tarif ediyor); (c) sapma eşiğini 5 px'ten 8 px'e çıkarmak (kayıt 170 → 126, ≈ −1,5 kB) ya da 12 px (88 kayıt, ≈ −2,8 kB; kök hassasiyeti düşer). Öneri: (a); bütçe 480 kB'a yaklaşırsa (b). Not: D1'in jeton başına `y` alanı tabloyu birkaç yüz bayt büyütür (103 jeton); tembel yükleme kararı bununla birlikte verilmeli.

## 4. Testler

Çalıştırma (`f458a3f`, `npx vitest run`): `src/ui/kanatKok.test.tsx` 15, `src/ui/kanatKatman.test.tsx` 8, `src/ui/as1cGorunum.test.tsx` 28, `src/rules/altSoy41.test.tsx` 24, `src/rules/as1bSurgun.test.tsx` 5, `src/ui/tint.test.ts` 12, `src/ui/avatar.test.ts` 5: **7 dosya, 97 test, hepsi geçti**. Tam `npm test` çalıştırılmadı (salt okunur kanat denetimi; kanatla ilgisiz motor testleri kapsam dışı). `src/ui/wingRoot.test.tsx` **yok** (ilk sekmenin dosyası birleştirmede silindi). `src/ui/wingRoot.ts` modülü var ama ilk sekmenin dosyasıyla ilgisiz: o `lineageLook.wingRootLayout`'u sınıyordu, bu modül jeton adından kök çözer (kendi testi `kanatKok.test.tsx` içinde).

### 4.1 İlk sekmenin yedi testinin güncel karşılığı

| # | İlk sekmenin testi | Güncel karşılık | Durum |
|---|---|---|---|
| 1 | kök omuz–dirsek bandında (y 0,38–0,55), merkeze yakın, görsel kökü sağ yarıda, dönüş 0–30° | `as1cGorunum` eşleme testi (`omuz` 0,4, `capa`, `olcek`, `ayna {dx 0,15, aci 20}` kesin değer); `kanatKok` kök verisi (kök aralığı 16–140 px, siluete bağlı) | var; bant eşitsizliği yazılı değil |
| 2 | düzeltme tablosu: anahtarlar gerçek jeton adı, değerler bantta | `kanatKok`: `sinif` anahtarları `crownKey` gruplarıyla aynı, `jeton` anahtarları var olan dosya, gruptan > 5 px sapıyor | var; y bandı koşulu yok (y verisi yok) |
| 3 | 10 soy paleti; Siyah koyu, Beyaz sıcak, Gümüş soğuk, Beyaz–Gümüş ΔE ≥ 12 | `kanatKok` palet (10 soy eşikli; taban palet–gövde ΔE, White/Silver); `kanatKatman` zar pembe karışımı | var; ΔE ölçütleri artık geçersiz (§6 D9) |
| 4 | kök (x, y) oranında; sol ayna; düzeltme jeton adından; sınır kutusu simetrik | `kanatKok` yerleşim (pivot, kök kutusu, ayna, dönüş, kök yoksa varsayılan) + `wingRoot` jeton adı çözümü | var; sınır kutusu (`wingExtent`) yok |
| 5 | eski palet (Tiefling) iki duraklı tablo aynen | `kanatKok` düz luma matrisi SD5 ile aynı + eşikli matris | var, kısmi (Tiefling tablosunun iki duraklı olduğu doğrudan yazılı değil) |
| 6 | rozet: zemin dairesi → kanat → figür sırası | `kanatKok`/`kanatKatman` rozet: kanat rozetin içinde, figürden önce, `badge-wings`, 7 `<image>`, ayrı kanat katmanı yok | var (mimari değişti) |
| 7 | 4. seviyede kanat yok; Tiefling eski çift görsel | `kanatKok` ("seviye < 5 kanat yok", "rozet çerçevesiz ve Tiefling eskisi gibi") + `as1cGorunum` | var |

### 4.2 Yazılacak testler

1. **Sıkı kök kontağı (K1/K2), 290 jeton, sharp ile:** yükseklik düzeltmeleri uygulandıktan sonra iki kök de 3 px yarıçaplı aşındırılmış silüette (mevcut test daha gevşek: ±6 satır, ±3 px).
2. **Jeton başına y verisi:** girdi `[sol, sag, y]`; y bandı 0,38–0,55; anahtarlar gerçek jeton adı; gruptan sapma; `wingRoot()` `y` döndürür.
3. **`wingPlacements(root.y)`:** kök `y` verilince pivot.y buna göre (px × ölçek), verilmezse `omuz`.
4. **`CharacterFigure` kutusu:** Dragonborn (`ability`) için `viewBox` iki kanadın sınırını kapsar ve simetrik (`wingExtent`).
5. **Doğal sola dönük jeton (Gulyabani, `warlock-WL-8`):** SVG `TokenFigure`/`AvatarCircle`'da kanat grubunda yalnız bir `scale(-1 1)` (flip XOR `naturalLeft`); rozette `--mirror:-1` + `badge-wings` + `has-wing`.
6. **CSS kuralı varlığı:** `.avatar.has-wing img { clip-path }`, `.badge-wings` (`as1cGorunum` CSS testi deseni).
7. **Tarayıcı çizim denetimi** (kapatma/kopukluk): vitest'te çalışmaz; `scripts/kanat-kontrol.mjs` (Playwright) + `npm run check:kanat`, yerelde (`check:harita` gibi). Ek B temel alınır.
8. **Tiefling `wingFilterTables` iki duraklı** (ilk sekmenin 5. testi doğrudan).

## 5. Ölü kod ve çift kalıntı

| Konu | Durum | Not |
|---|---|---|
| İlk sekme kodu | yok | §1.2 |
| Çift modül / dosya | yok | tek `wingRoot.ts`; eski `WingImage`/`WingLayer` başka slotlar için canlı |
| Çift veri | yok | `kok` anahtarı yok, tek kök tablosu |
| `WingRoot.y` (`wingPlacements` kolu) | üreticisi yok | `wingRoot()` `y` döndürmez; y düzeltmesiyle canlanır |
| `dragonborn.pembe` (Lab, `ab`, `aciklik`) | çalışma anında okunmuyor | yalnız tür tanımı (`WingSlotData`), üretici betik (`dragonborn-kanat-palet.ts`) ve test okur; ana parçada 45 bayt, kayıt amaçlı |
| `kanat-esleme.json` `not` metni | **bayat** | çift görsel, "AYNALAMA YOK" ve `olcek` = çift genişliği anlatıyor; `ayna`, `katmanlar`, `pembe`, `zar` yok |
| `public/kanat/melek-acik.webp` (135 KB) | hiçbir slotta bağlı değil | slot `a33577f` (IS3) ile kaldırıldı; dosya `public/kanat/README.md`, `not` metni ve eski-biçim test fikstüründe (`as1cGorunum.test.tsx`) anılıyor; birleştirmeyle ilgisiz, önceden var |
| `docs/sabah/dragonborn-kanat/once-sonra.webp` (878 KB), `kontak-290.webp` (809 KB), `kontrol.webp` (463 KB) | bayat | pembe zar ve beyaz uç öncesi; güncel: `karisim-ozet.webp`, `karisim-tam.webp`, `kok-kontrol.webp` |
| `docs/sabah/dragonborn-kanat/oturum2-*/` (ilk sekmenin görsel arşivi, 1,7 MB + README) | arşiv | ilk sekmenin kodu geri gelmeyecekse silinebilir (`f9e3261` git geçmişinde) |
| DECISIONS.md | KW1 kaydında "Ana parça 448,80 → 458,28 kB" (KW1 anının ölçümü; KW2/KW3 ve birleşimlerden sonra 460,82 kB, kanat işi toplamı +11,05 kB: güncel toplamı veren satır yok) | ilk sekmenin kaydı "çıkarıldı" notuyla duruyor |
| CLAUDE.md | kanat cümleleri (KW1–KW3) güncel; **bütçe cümlesi bayat** | "Ana parça 500 kB altında … şu an ≈448 kB (2026-11-19 ölçümü 447,77 kB)": güncel ölçüm 460,82 kB |
| `onizleme-kanat.html`, `src/preview/kanatOnizleme.tsx` | dev aracı, build girdisi değil | `?m=hepsi` jeton adını `data-token` ile veriyor (ölçüm bunu kullandı) |

## 6. Önerilen düzeltme listesi (pembe karışımlı sürümü tamamlamak için)

| # | Düzeltme | Kapsam | Öncelik |
|---|---|---|---|
| D1 | Jeton başına y: `jeton` girdileri `[sol, sag, y]`, `wingRoot()` `y` döndürsün; ilk uygulama P1'deki 26 jeton (§2.3), büyük 5'inde x kaydırmayı da değerlendir | `wingRoot.ts`, `dragonborn-kanat-kok.json` | yüksek |
| D2 | `scripts/dragonborn-kanat-kok.py`: y'yi K1 kuralıyla seç (sınır ±0,06; aşan jetonda x'i içeri kaydır), çıktı deterministik | betik | yüksek |
| D3 | P2'deki 77 jeton (yalnız K1): kozmetik, kanat bağlı; D2 otomatik uygulayacaksa dahil, değilse bırak | veri | düşük |
| D4 | §4.2 testleri 1–6 ve 8 | `kanatKok.test.tsx`, `wingRoot.test.tsx` (kök testlerini bu adla ayır) | orta |
| D5 | Tarayıcı çizim denetimi `scripts/kanat-kontrol.mjs` + `npm run check:kanat` (Ek B'nin temizlenmiş hâli); D1 sonrası K1/K2 = 0, K3/K5 = 0 yeniden koş | betik | orta |
| D6 | `kanat-esleme.json` `not` metnini güncelle (tek kanat + ayna, `katmanlar`, `pembe`, `zar`) | veri açıklaması | orta |
| D7 | Bütçe sayıları: CLAUDE.md "şu an ≈448 kB" → 460,8 kB (ölçüm tarihiyle) ve DECISIONS'a kanat işi toplamı (+11,05 kB: kök verisi 6,92, KW1 kod 2,77, KW2/KW3 1,35); `docs/BUNDLE.md` dökümü de yenilensin | belge | düşük |
| D8 | Belge/görsel temizliği: bayat üç görsel (`once-sonra`, `kontak-290`, `kontrol`) ve ilk sekmenin görsel arşivi (`oturum2-*/`) silinsin ya da arşivlensin; `melek-acik.webp` ayrı karar | `docs/`, `public/kanat/` | düşük |
| D9 | Palet testlerini parametrik yap: `kanatKok` "uyum" (taban palet–gövde ΔE) ve `kanatKatman` "açıklık ≤ 10, kayma ΔE ≥ 8, White ↔ Silver zar ≥ 12" `pembe` verisine bağlı olsun (oran değişince kırılmasın); Siyah/Beyaz–Gümüş gözle kontrolde `karisim-ozet.webp` | test | düşük |
| D10 | Paket: şimdilik işlem yok (39 kB pay); bütçe 480 kB'a yaklaşırsa kök tablosunu tembel parçaya al ya da eşiği 8 px'e çıkar | izleme | izle |

## Ek A: ölçüm betiği (K1–K4, geometri; depo kökünden çalışır, yazmaz)

`python3 kanat-olcum.py [--oneri]` (numpy, Pillow, scipy gerekir). Önerileri Ek C'ye yazan çıktı `--oneri` ile alındı.

```python
#!/usr/bin/env python3
"""Dragonborn kanat kökü ölçümü (salt okunur; depoya yazmaz). Depo kökünden: python3 kanat-olcum.py [--oneri]
Girdi: data/kanat-esleme.json (dragonborn: omuz, capa, olcek, enBoy, ayna.aci), data/dragonborn-kanat-kok.json, public/characters/dragonborn-*.webp (290), public/kanat/dragonborn.webp.
Silüet = alfa ≥ 128, jeton uzayı 256 px; kök satırı y = omuz × 256.
  K1 sıkı kök-içi: iki kök noktası da silüetin 3 px yarıçaplı daireyle aşındırılmış hâlinde (≥ 3 px pay).
  K2 kök-içi (nokta): iki kök noktası silüet içinde.
  K3 kopuk: dönmüş + aynalı kanat maskesi silüetin 1 px genişletilmişiyle kesişmiyor.
  K4 görünen oran: kanat maskesinin silüet dışında kalan payı; örtüşme = kanat ∩ silüet piksel sayısı.
--oneri: K1'i geçmeyen her jeton için, bant [0,38–0,55] içinde 0,40'a en yakın satırı (sıkı → 2 px → nokta) y düzeltmesi olarak yazar."""
import glob, json, math, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.getcwd()
ks = json.load(open(f'{ROOT}/data/kanat-esleme.json'))['slotlar']['dragonborn']
kok = json.load(open(f'{ROOT}/data/dragonborn-kanat-kok.json'))
kan = np.array(Image.open(f'{ROOT}/public/kanat/dragonborn.webp').convert('RGBA'))
H_, W_ = kan.shape[:2]
KOKPX = (ks['capa'][0] * W_, ks['capa'][1] * H_); OLCEK = ks['olcek'] * 256 / W_; ACI = ks['ayna']['aci']; Y0 = int(round(ks['omuz'] * 256))
CW, CH, OX, OY = 700, 420, 222, 100          # tuval, jetonun tuvaldeki yeri
def grup(ad):                                 # src/ui/haloCrown.ts crownKey ile aynı
    m = re.match(r'^(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', ad); g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1))
    return f"{m.group(2)}-{g}{'-gr' if m.group(3) == 'GR' else ('' if m.group(3) else '-genel')}"
def donustur(rx, ry, sol):
    """Tek kanadı kök (rx, ry) noktasına oturtup kök etrafında ACI° dışa/yukarı döndürür (lineageLook.wingPlacements ile aynı geometri); sol: kök hizasında ayna."""
    im = Image.fromarray(kan, 'RGBA'); w2, h2 = round(W_ * OLCEK), round(H_ * OLCEK); im = im.resize((w2, h2), Image.LANCZOS)
    k = (KOKPX[0] * OLCEK, KOKPX[1] * OLCEK); pad = int(math.hypot(w2, h2)) + 4
    can = Image.new('RGBA', (2 * pad, 2 * pad), (0, 0, 0, 0)); can.paste(im, (int(round(pad - k[0])), int(round(pad - k[1]))), im)
    can = can.rotate(ACI, resample=Image.BICUBIC, center=(pad, pad))
    cx = CW - (OX + rx) if sol else OX + rx
    out = Image.new('RGBA', (CW, CH), (0, 0, 0, 0)); out.paste(can, (int(round(cx - pad)), int(round(OY + ry - pad))), can)
    if sol: out = out.transpose(Image.FLIP_LEFT_RIGHT)
    return np.array(out)[..., 3] > 10
def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]; return (x * x + y * y) <= r * r
toks = {os.path.basename(f)[11:-5]: np.array(Image.open(f).convert('RGBA'))[..., 3] >= 128 for f in sorted(glob.glob(f'{ROOT}/public/characters/dragonborn-*.webp'))}
er = {r: {n: (ndi.binary_erosion(a, structure=disk(r), border_value=0) if r else a) for n, a in toks.items()} for r in (0, 2, 3)}
def roots(n):
    e = kok['jeton'].get(n) or kok['sinif'][grup(n)]; return int(round(e[0])), int(round(e[1]))
def ok(n, row, r): xl, xr = roots(n); m = er[r][n]; return bool(m[row, xl] and m[row, xr])
res = {}
for n, al in toks.items():
    xl, xr = roots(n); sil = np.zeros((CH, CW), bool); sil[OY:OY + 256, OX:OX + 256] = al; sild = ndi.binary_dilation(sil, iterations=1); c = {}
    for s, x in (('sol', xl), ('sag', xr)):
        wm = donustur(x, Y0, s == 'sol'); c[s] = (bool((wm & sild).any()), int((wm & sil).sum()), float((wm & ~sil).sum() / max(1, wm.sum())))
    res[n] = dict(k1=ok(n, Y0, 3), k2=ok(n, Y0, 0), c=c)
hucre = [n for n in res if n.split('-')[0] in ('erkek', 'kadin')]
print(f'jeton {len(res)} (hücreli {len(hucre)}, sınıf-genel {len(res) - len(hucre)}); kök satırı {Y0} (omuz {ks["omuz"]}), açı {ACI}°')
for ad, f in (('K1 sıkı kök-içi', 'k1'), ('K2 kök-içi (nokta)', 'k2')):
    bad = [n for n in res if not res[n][f]]; print(f'{ad}: geçmeyen {len(bad)}/{len(res)} (hücreli {sum(n in hucre for n in bad)}/{len(hucre)})')
print('K3 kopuk:', [n for n in res if not (res[n]['c']['sol'][0] and res[n]['c']['sag'][0])])
ov = [min(res[n]['c']['sol'][1], res[n]['c']['sag'][1]) for n in res]; vis = [min(res[n]['c']['sol'][2], res[n]['c']['sag'][2]) for n in res]
print(f'örtüşme px min/ortanca {min(ov)}/{int(np.median(ov))}; görünen oran min/ortanca {min(vis):.3f}/{np.median(vis):.3f}')
if '--oneri' in sys.argv:
    print('\n| jeton | kök x (sol / sağ) | önerilen y | Δy | ölçüt |\n|---|---|---|---|---|')
    for n in sorted(res):
        if res[n]['k1']: continue
        for r, ad in ((3, 'sıkı'), (2, '2 px'), (0, 'nokta')):
            row = next((q for q in sorted(range(97, 142), key=lambda q: (abs(q - Y0), q)) if ok(n, q, r)), None)
            if row is not None: break
        xl, xr = roots(n); print(f'| `{n}` | {xl} / {xr} | {row / 256:.3f} | {(row - Y0) / 256:+.3f} | {ad} |' if row is not None else f'| `{n}` | {xl} / {xr} | yok | | |')
```

## Ek B: gerçek çizim denetimi (K5)

Önizleme sunucusu (`npx vite --port 5199`, depodaki `onizleme-kanat.html`) çalışırken Playwright betiği kanatlı ve kanatsız (DOM'dan kanat grupları çıkarılarak) iki ekran görüntüsü alır; ikinci betik farkı jeton maskesiyle çözümler.

```js
// Gerçek bileşenlerle (önizleme sayfası, depodaki) iki geçiş: kanatlı / kanatsız (DOM'dan kanat grupları çıkarılır). Çıktı: png çiftleri + yerleşim json.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const OUT = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2950, height: 4300 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  // 1) savaş jetonu (SVG): 290 jeton
  await p.goto('http://127.0.0.1:5199/onizleme-kanat.html?m=hepsi&soy=gold');
  await p.waitForSelector('#sayfa', { timeout: 60000 });
  await p.waitForFunction(() => [...document.querySelectorAll('#sayfa image')].filter((i) => /^(blob|data):/.test(i.getAttribute('href') || '')).length >= 260, null, { timeout: 180000 }).catch((e) => console.log('TINT-BEKLEME'));
  await p.waitForTimeout(1500);
  const lay = await p.evaluate(() => { const o = document.querySelector('#sayfa').getBoundingClientRect(); return [...document.querySelectorAll('svg[data-token]')].map((s) => { const r = s.getBoundingClientRect(); return { n: s.getAttribute('data-token'), x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, wings: s.querySelectorAll('g[data-wing]').length }; }); });
  const el = await p.$('#sayfa');
  await el.screenshot({ path: `${OUT}/svg-A.png` });
  await p.evaluate(() => document.querySelectorAll('g[data-wing]').forEach((g) => g.remove()));
  await p.waitForTimeout(300);
  await el.screenshot({ path: `${OUT}/svg-B.png` });
  fs.writeFileSync(`${OUT}/svg-lay.json`, JSON.stringify(lay));
  console.log('svg jeton', lay.length, 'kanatlı', lay.filter((l) => l.wings === 2).length);
  // 2) rozet (HTML): 10 soy × 2 karakter × 2 boyut
  await p.goto('http://127.0.0.1:5199/onizleme-kanat.html?m=ab');
  await p.waitForSelector('#sayfa', { timeout: 60000 });
  await p.waitForFunction(() => { const av = [...document.querySelectorAll('.avatar img')]; return av.length >= 40 && av.every((i) => i.complete && /^(blob|data):/.test(i.src)); }, null, { timeout: 120000 }).catch(() => console.log('AB-BEKLEME'));
  await p.waitForTimeout(1200);
  const lay2 = await p.evaluate(() => { const o = document.querySelector('#sayfa').getBoundingClientRect(); return [...document.querySelectorAll('[data-cell]')].map((c) => { const i = c.querySelector('.avatar img'); const r = i.getBoundingClientRect(); return { cell: c.getAttribute('data-cell'), x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, wings: c.querySelectorAll('g[data-wing]').length }; }); });
  const el2 = await p.$('#sayfa');
  await el2.screenshot({ path: `${OUT}/rozet-A.png` });
  await p.evaluate(() => document.querySelectorAll('.badge-wings').forEach((g) => g.remove()));
  await p.waitForTimeout(300);
  await el2.screenshot({ path: `${OUT}/rozet-B.png` });
  fs.writeFileSync(`${OUT}/rozet-lay.json`, JSON.stringify(lay2));
  console.log('rozet hücre', lay2.length, 'kanatlı', lay2.filter((l) => l.wings === 2).length);
  await b.close();
})();
```

```python
"""KANAT-BIRLESTIRME ölçümü 4: gerçek bileşenlerle çizim denetimi (kanatlı/kanatsız piksel farkı). Salt okunur.
 - kapatma (overdraw): figürün tam opak (alfa ≥ 250, 2 px aşınmış) piksellerinde kanatlı ve kanatsız çizim farklıysa kanat figürün önüne geçmiştir.
 - kopukluk: farkın olduğu (kanat) pikseller, sol ve sağ yarıda ayrı ayrı, figür silüetinin 2 px genişletilmişiyle kesişmiyorsa kanat kopuktur."""
import json, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
D='render-olc'; REPO='/home/user/RPG-Battle'
def alpha(name):
    return np.array(Image.open(f'{REPO}/public/characters/{name}.webp').convert('RGBA'))[...,3]
def scaled(al,size):
    return np.array(Image.fromarray(al).resize((size,size),Image.BILINEAR))
def analyse(A,B,x0,y0,w,h,al_s,center):
    a=A[y0:y0+h,x0:x0+w].astype(int); b=B[y0:y0+h,x0:x0+w].astype(int)
    return a,b
SOLA={'erkek-warlock-WL-8','kadin-warlock-WL-8'}
# jeton-ayna.json sinifHucre anahtarı '<sınıf>-<hücre>': warlock-WL-8 (her iki cinsiyet, her ırk)
res_svg=[]
A=np.array(Image.open(f'{D}/svg-A.png').convert('RGB')); B=np.array(Image.open(f'{D}/svg-B.png').convert('RGB'))
lay=json.load(open(f'{D}/svg-lay.json'))
for t in lay:
    x0,y0=int(round(t['x'])),int(round(t['y'])); T,Hh=200,190
    a=A[y0:y0+Hh,x0:x0+T].astype(int); b=B[y0:y0+Hh,x0:x0+T].astype(int)
    diff=np.abs(a-b).max(-1)>6
    full=np.zeros((Hh,T),np.uint8); al=scaled(alpha(t['n']),132)
    if t['n'].replace('dragonborn-','') in SOLA: al=al[:, ::-1]   # data/jeton-ayna.json: doğal sola dönük jeton çözücüde aynalanır
    full[35:35+132,34:34+132]=al
    opak=ndi.binary_erosion(full>=250,iterations=2)
    sil=full>=128; sild=ndi.binary_dilation(sil,iterations=2)
    over=int((diff&opak).sum())
    L=diff.copy(); L[:,100:]=False; R=diff.copy(); R[:,:100]=False
    res_svg.append(dict(n=t['n'].replace('dragonborn-',''),over=over,wingL=int(L.sum()),wingR=int(R.sum()),touchL=bool((L&sild).any()),touchR=bool((R&sild).any())))
print('SVG savaş jetonu:',len(res_svg),'jeton')
print(' kapatma (overdraw) > 0:',[r['n'] for r in res_svg if r['over']>0][:20], 'toplam piksel', sum(r['over'] for r in res_svg))
print(' kopuk (sol/sağ kanat silüete değmiyor):',[r['n'] for r in res_svg if not(r['touchL'] and r['touchR'])][:20])
print(' kanat pikseli yok (görünmeyen kanat):',[r['n'] for r in res_svg if min(r['wingL'],r['wingR'])<200][:20],'| min/medyan görünen kanat px:',min(min(r['wingL'],r['wingR']) for r in res_svg),int(np.median([min(r['wingL'],r['wingR']) for r in res_svg])))
json.dump(res_svg,open('olc4-svg.json','w'))
# rozet
A=np.array(Image.open(f'{D}/rozet-A.png').convert('RGB')); B=np.array(Image.open(f'{D}/rozet-B.png').convert('RGB'))
lay2=json.load(open(f'{D}/rozet-lay.json'))
NAME={'f':'dragonborn-erkek-fighter-ID12','w':'dragonborn-kadin-wizard-WZ-A1'}
res_b=[]
for c in lay2:
    soy,ch,sz=c['cell'].split('-')
    x0,y0,w=int(round(c['x'])),int(round(c['y'])),int(round(c['w']))
    # kanatlar rozetin dışına taşar: bölge = rozet kutusu + 60% çevre
    pad=int(w*0.6); X0=max(0,x0-pad); Y0=max(0,y0-pad)
    a=A[Y0:y0+w+pad,X0:x0+w+pad].astype(int); b=B[Y0:y0+w+pad,X0:x0+w+pad].astype(int)
    diff=np.abs(a-b).max(-1)>6
    full=np.zeros(diff.shape,np.uint8); al=scaled(alpha(NAME[ch]),w)
    oy,ox=y0-Y0,x0-X0; full[oy:oy+w,ox:ox+w]=al
    opak=ndi.binary_erosion(full>=250,iterations=2); sild=ndi.binary_dilation(full>=128,iterations=2)
    over=int((diff&opak).sum()); cx=ox+w//2
    L=diff.copy(); L[:,cx:]=False; R=diff.copy(); R[:,:cx]=False
    res_b.append(dict(cell=c['cell'],over=over,wingL=int(L.sum()),wingR=int(R.sum()),touchL=bool((L&sild).any()),touchR=bool((R&sild).any())))
print('Rozet (HTML):',len(res_b),'hücre')
print(' kapatma (overdraw) > 0:',[(r['cell'],r['over']) for r in res_b if r['over']>0])
print(' kopuk:',[r['cell'] for r in res_b if not(r['touchL'] and r['touchR'])])
print(' min görünen kanat px (sol/sağ):',min(min(r['wingL'],r['wingR']) for r in res_b))
json.dump(res_b,open('olc4-rozet.json','w'))
```

## Ek C: K1'i geçmeyen 103 jeton ve yükseklik önerisi

P1: kök noktası silüet dışında (K2 de geçmiyor); P2: yalnız K1. "büyük": |Δy| > 0,06.

| Jeton | Kök x (sol / sağ) | Önerilen y | Δy | Ölçüt | Öncelik |
|---|---|---|---|---|---|
| `erkek-barbarian-GR` | 81 / 175 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-barbarian-ID4` | 84 / 165 | 0.410 | +0.012 | sıkı | P2 |
| `erkek-bard-ID5` | 96 / 182 | 0.395 | -0.004 | sıkı | P2 |
| `erkek-bard-ID6` | 108 / 163 | 0.395 | -0.004 | sıkı | P2 |
| `erkek-cleric-GR` | 100 / 177 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-cleric-ID1` | 108 / 172 | 0.391 | -0.008 | sıkı | P2 |
| `erkek-cleric-ID5` | 100 / 166 | 0.445 | +0.047 | sıkı | P1 |
| `erkek-druid-ID2` | 95 / 172 | 0.398 | +0.000 | 2 px | P2 |
| `erkek-druid-ID3` | 80 / 178 | 0.438 | +0.039 | sıkı | P2 |
| `erkek-druid-ID7` | 95 / 172 | 0.445 | +0.047 | sıkı | P1 |
| `erkek-fighter-ID11` | 119 / 176 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-fighter-ID12` | 88 / 172 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-fighter-ID3` | 116 / 180 | 0.434 | +0.035 | sıkı | P1 |
| `erkek-fighter-ID7` | 101 / 172 | 0.383 | -0.016 | sıkı | P1 |
| `erkek-monk-ID1` | 90 / 171 | 0.414 | +0.016 | sıkı | P2 |
| `erkek-monk-ID10` | 116 / 180 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-monk-ID11` | 92 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-paladin-GR` | 96 / 171 | 0.383 | -0.016 | sıkı | P2 |
| `erkek-paladin-ID1` | 93 / 176 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-paladin-ID10` | 93 / 176 | 0.449 | +0.051 | sıkı | P1 |
| `erkek-ranger-ID2` | 88 / 166 | 0.410 | +0.012 | sıkı | P2 |
| `erkek-ranger-ID3` | 103 / 172 | 0.398 | +0.000 | nokta | P2 |
| `erkek-ranger-ID7` | 103 / 172 | 0.391 | -0.008 | 2 px | P2 |
| `erkek-ranger-ID9` | 107 / 162 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-rogue-GR` | 97 / 181 | 0.418 | +0.020 | sıkı | P2 |
| `erkek-rogue-ID10` | 99 / 172 | 0.398 | +0.000 | nokta | P2 |
| `erkek-rogue-ID3` | 97 / 160 | 0.387 | -0.012 | sıkı | P2 |
| `erkek-rogue-ID6` | 99 / 172 | 0.379 | -0.020 | sıkı | P1 |
| `erkek-rogue-ID9` | 99 / 172 | 0.398 | +0.000 | nokta | P2 |
| `erkek-sorcerer-SC-2` | 115 / 172 | 0.422 | +0.023 | sıkı | P1 |
| `erkek-sorcerer-SC-3` | 116 / 177 | 0.395 | -0.004 | sıkı | P2 |
| `erkek-sorcerer-SC-5` | 95 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-sorcerer-SC-6` | 88 / 170 | 0.523 | +0.125 | sıkı | P2 (büyük) |
| `erkek-warlock-GR` | 113 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-warlock-WL-6` | 98 / 173 | 0.434 | +0.035 | sıkı | P2 |
| `erkek-warlock-WL-7` | 108 / 172 | 0.391 | -0.008 | sıkı | P2 |
| `erkek-warlock-WL-9` | 107 / 178 | 0.395 | -0.004 | sıkı | P2 |
| `erkek-wizard-GR` | 101 / 174 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-wizard-WZ-A1` | 104 / 171 | 0.434 | +0.035 | sıkı | P2 |
| `erkek-wizard-WZ-A3` | 84 / 154 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-wizard-WZ-A4` | 104 / 171 | 0.418 | +0.020 | sıkı | P1 |
| `erkek-wizard-WZ-A6` | 96 / 176 | 0.402 | +0.004 | sıkı | P2 |
| `erkek-wizard-WZ-A8` | 81 / 156 | 0.406 | +0.008 | sıkı | P2 |
| `erkek-wizard-WZ-B2` | 104 / 171 | 0.430 | +0.031 | sıkı | P2 |
| `erkek-wizard-WZ-B5` | 104 / 171 | 0.547 | +0.148 | sıkı | P1 (büyük) |
| `kadin-barbarian-GR` | 82 / 161 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-barbarian-ID2` | 111 / 172 | 0.402 | +0.004 | sıkı | P2 |
| `kadin-barbarian-ID3` | 98 / 172 | 0.465 | +0.066 | sıkı | P2 (büyük) |
| `kadin-barbarian-ID4` | 91 / 172 | 0.531 | +0.133 | sıkı | P2 (büyük) |
| `kadin-bard-GR` | 106 / 173 | 0.391 | -0.008 | sıkı | P2 |
| `kadin-bard-ID1` | 129 / 182 | 0.383 | -0.016 | sıkı | P1 |
| `kadin-bard-ID2` | 109 / 165 | 0.387 | -0.012 | sıkı | P2 |
| `kadin-bard-ID5` | 109 / 173 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-bard-ID6` | 105 / 157 | 0.418 | +0.020 | sıkı | P1 |
| `kadin-bard-ID9` | 110 / 177 | 0.379 | -0.020 | sıkı | P1 |
| `kadin-cleric-ID5` | 106 / 164 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-cleric-ID7` | 109 / 174 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-druid-GR` | 99 / 169 | 0.383 | -0.016 | sıkı | P1 |
| `kadin-druid-ID1` | 97 / 151 | 0.414 | +0.016 | sıkı | P1 |
| `kadin-druid-ID2` | 96 / 160 | 0.445 | +0.047 | sıkı | P1 |
| `kadin-druid-ID4` | 79 / 158 | 0.379 | -0.020 | sıkı | P2 |
| `kadin-druid-ID7` | 96 / 160 | 0.402 | +0.004 | sıkı | P2 |
| `kadin-fighter-GR` | 103 / 172 | 0.461 | +0.062 | sıkı | P1 (büyük) |
| `kadin-fighter-ID7` | 104 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-monk-GR` | 124 / 172 | 0.422 | +0.023 | sıkı | P1 |
| `kadin-monk-ID1` | 91 / 171 | 0.410 | +0.012 | sıkı | P2 |
| `kadin-monk-ID11` | 106 / 179 | 0.410 | +0.012 | sıkı | P2 |
| `kadin-monk-ID6` | 115 / 183 | 0.379 | -0.020 | sıkı | P1 |
| `kadin-monk-ID9` | 106 / 179 | 0.410 | +0.012 | sıkı | P2 |
| `kadin-paladin-GR` | 88 / 167 | 0.391 | -0.008 | sıkı | P2 |
| `kadin-paladin-ID1` | 90 / 175 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-paladin-ID10` | 90 / 175 | 0.426 | +0.027 | sıkı | P2 |
| `kadin-paladin-ID7` | 90 / 175 | 0.488 | +0.090 | sıkı | P2 (büyük) |
| `kadin-ranger-ID1` | 99 / 168 | 0.551 | +0.152 | sıkı | P1 (büyük) |
| `kadin-ranger-ID2` | 74 / 161 | 0.406 | +0.008 | 2 px | P2 |
| `kadin-ranger-ID3` | 99 / 168 | 0.547 | +0.148 | sıkı | P2 (büyük) |
| `kadin-ranger-ID9` | 100 / 162 | 0.523 | +0.125 | sıkı | P1 (büyük) |
| `kadin-rogue-ID1` | 109 / 179 | 0.391 | -0.008 | 2 px | P2 |
| `kadin-rogue-ID3` | 93 / 163 | 0.391 | -0.008 | sıkı | P2 |
| `kadin-sorcerer-GR` | 106 / 172 | 0.520 | +0.121 | sıkı | P1 (büyük) |
| `kadin-sorcerer-SC-1` | 106 / 165 | 0.379 | -0.020 | sıkı | P2 |
| `kadin-sorcerer-SC-3` | 114 / 179 | 0.387 | -0.012 | sıkı | P2 |
| `kadin-sorcerer-SC-5` | 110 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-sorcerer-SC-6` | 110 / 172 | 0.445 | +0.047 | sıkı | P1 |
| `kadin-sorcerer-SC-7` | 110 / 172 | 0.395 | -0.004 | sıkı | P2 |
| `kadin-sorcerer-SC-9` | 110 / 172 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-warlock-WL-1` | 97 / 172 | 0.383 | -0.016 | sıkı | P2 |
| `kadin-warlock-WL-2` | 91 / 149 | 0.410 | +0.012 | sıkı | P2 |
| `kadin-warlock-WL-3` | 91 / 177 | 0.395 | -0.004 | sıkı | P2 |
| `kadin-warlock-WL-5` | 97 / 172 | 0.395 | -0.004 | sıkı | P2 |
| `kadin-warlock-WL-6` | 88 / 169 | 0.426 | +0.027 | sıkı | P2 |
| `kadin-warlock-WL-7` | 110 / 172 | 0.422 | +0.023 | sıkı | P1 |
| `kadin-warlock-WL-9` | 103 / 165 | 0.402 | +0.004 | sıkı | P2 |
| `kadin-wizard-WZ-A1` | 109 / 171 | 0.395 | -0.004 | sıkı | P2 |
| `kadin-wizard-WZ-A3` | 82 / 168 | 0.402 | +0.004 | sıkı | P2 |
| `kadin-wizard-WZ-A4` | 103 / 172 | 0.418 | +0.020 | sıkı | P1 |
| `kadin-wizard-WZ-A6` | 96 / 162 | 0.402 | +0.004 | sıkı | P2 |
| `kadin-wizard-WZ-A8` | 82 / 157 | 0.406 | +0.008 | sıkı | P2 |
| `kadin-wizard-WZ-B2` | 103 / 172 | 0.418 | +0.020 | sıkı | P1 |
| `kadin-wizard-WZ-B4` | 115 / 176 | 0.547 | +0.148 | sıkı | P2 (büyük) |
| `kadin-wizard-WZ-B5` | 103 / 172 | 0.379 | -0.020 | sıkı | P1 |
| `male-bard` | 126 / 157 | 0.391 | -0.008 | sıkı | P2 |
| `male-warlock` | 111 / 142 | 0.387 | -0.012 | sıkı | P2 |
