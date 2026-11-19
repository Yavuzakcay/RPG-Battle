# Ana parça artışı (448,8 → 459,5 kB): denetim

Tarih: 2026-11-20. Kuyruk A İş 1; salt okunur, kod değişmedi.

## Yöntem

- Her ağaçta `vite build` çalıştırıldı ve giriş parçasının (`dist/assets/index-*.js`) modül dökümü alındı. Döküm, Rollup `generateBundle` içinde `chunk.modules[].renderedLength` alanından geldi; geçici betik `scripts/_bundle-dump.mjs`, commit edilmedi.
- Ölçülen ağaçlar: başlangıç `15ad4633` (WS87 öncesi; `paket-siniri.mjs` 448,82 kB) ve ondan sonraki 12 birleştirme dışı commit (2026-11-19).
- Toplam iki ölçüyle verildi:
  - "UTF-8 bayt": kodun UTF-8 uzunluğu.
  - `paket-siniri.mjs`: dosya boyutu / 1000. Bu ölçü dosya ekleri yüzünden ≈ 4,6 kB daha büyük çıkar, ama farklar aynı.
- Son 10 günün öteki commit'leri bu aralıktan önce. 448,8 kB, 2026-11-19 ölçümüdür (447,77 kB) ve aralığın başlangıcı da odur.

## Commit bazında (UTF-8 bayt, giriş parçası)

Dallar paralel ilerlediği için her commit kendi ağacında ölçüldü. Sıra tarihe göre; fark, aynı dal üzerindeki öncekine göre.

| Commit | İş | Toplam | Fark |
|---|---|---|---|
| `15ad4633` | başlangıç (D1 86 + Control Water 84 birleşik) | 442 925 | — |
| `922b420b` | girdap kancası yaprak modüle | 442 925 | 0 |
| `d7e212a2` | durum denetimi (belge) | 442 925 | 0 |
| `952d37d1` | WS87 Wild Shape (kural 87) | 443 160 | +235 (yalnız `strings.ts` `formSwim`, `formStale`) |
| `d13c2b9f` | D2 çağrı/kurulum (kural 88) | 442 925 | 0 (motor tembel) |
| `f9e32618` | Dragonborn kanadı (ilk) | 447 074 | +4 149 |
| `a572913a` | KW1 kanat kökü + ayna | 452 620 | +5 546 (ilk kanat dalına göre +9 695) |
| `85dcdc6f` / `7ce26366` | Dungeondex tasarım / ekran | 447 737 | +663 (kendi dalında; `Screens`, `App`, `icons`, `strings`) |
| `57c6b7a2` | Ready belgesi (birleşik ağaç) | 453 518 | birleşim |
| `e3b8262e` | kanat pençe ucu | 454 209 | +691 |
| `cfdacf5f` | Dungeondex Sınıflar | 453 527 | 0 (catalog tembel; fark birleşimden) |
| `00ccdcea` | kanat zar karışımı (HEAD) | 454 872 | +663 |

Toplam: **+11 947 bayt** (UTF-8). `paket-siniri.mjs` ölçüsünde 448,82 → 459,46 kB, yani +10,6 kB.

## Modül bazında (başlangıç → HEAD)

| Modül | Önce | Sonra | Fark | Kaynak iş |
|---|---|---|---|---|
| `data/dragonborn-kanat-kok.json` | — | 9 674 | **+9 674** | KW1 kanat kökü (jeton başına sol/sağ x) |
| `src/ui/Avatar.tsx` | 10 267 | 12 889 | +2 622 | KW1 `WingPairImage`, `wingPlacements`, rozet kanadı |
| `src/ui/lineageLook.ts` | 4 537 | 6 883 | +2 346 | KW1 `wingPlacements`, palet eşiği |
| `data/kanat-esleme.json` | 1 566 | 2 850 | +1 284 | KW1 kanat paletleri, omuz, pençe |
| `src/ui/wingRoot.ts` | — | 422 | +422 | KW1 |
| `src/ui/icons.tsx` | 2 715 | 3 066 | +351 | Dungeondex ana menü simgesi |
| `src/i18n/strings.ts` | 74 923 | 75 274 | +351 | Dungeondex ana menü metni + WS87 biçim kartı |
| `src/App.tsx` | 17 459 | 17 799 | +340 | Dungeondex tembel yönlendirmesi |
| `src/screens/Screens.tsx` | 33 117 | 33 437 | +320 | Dungeondex ana menü kartı |
| `src/ui/lookContext.ts` | — | 53 | +53 | KW1 |
| diğer (`soundPlan`, `haloCrown`, `data/index`, `rogue-jeton.json`, `WingFilter` −68) | | | −26 | |

Özet:

| İş | Ana parçaya katkısı | Pay |
|---|---|---|
| Dragonborn kanadı (KW1 ve ekleri) | **+16 400** | %82 |
| Dungeondex giriş noktası (menü kartı, simge, yönlendirme, metin) | ≈ +1 300 | %7 |
| WS87 biçim kartı metinleri | +235 | %1 |
| Diğer (birleşim, küçük) | ≈ +200 | — |

## Tembel olması gerekirken ana parçaya giren var mı?

| Aday | Durum |
|---|---|
| Dungeondex (`src/screens/Dungeondex.tsx`, `src/dungeondex/catalog.ts`, `data/dungeondex.json`, `data/srd/classes.json`) | **Tembel** (`Dungeondex-*.js`, `classes-*.js`). Ana parçada yalnız menü kartı, simge ve `lazy()` yönlendirmesi (≈ 1,3 kB) |
| Kanat (`WingFilter.tsx`, `wingAnim.ts`, `wingRoot.ts`, `kanat-esleme.json`, `dragonborn-kanat-kok.json`) | **Ana parçada.** `Avatar.tsx` statik içe aktarıyor; `Avatar` giriş ekranındaki karakter listesinde rozet olarak çizildiği için ana parçada. Bayt olarak en büyüğü `dragonborn-kanat-kok.json` (9,7 kB) |
| Girdap (`girdap.ts`, `girdapSurum.ts`, `data/girdap.json`) | Tembel (savaş motoru parçası) |
| D1/D2 katmanları (`srdD1.ts`, `srdD2Surum.ts`, `monsterSetup.ts`), `data/srd-duzeltme.json` | Tembel (savaş motoru / `loadClassData`) |
| `strings.tr2.ts`, `strings.en.ts` | Tembel (ayrı parçalar; ana parçada yok) |
| Yeni veri dosyaları (`aciklamalar-tr.json` eklemeleri, `multiattack.json`, `summons.json`) | Tembel (`loadClassData` / savaş motoru) |

Aralıktan bağımsız olarak ana parçada duran büyük veri dosyaları da var. Taşınabilirlerse yer açarlar:
- `data/races.json` 21,6 k;
- `data/efekt-baglama.json` 18,6 k (yalnız savaştaki `FxLayer` kullanmalı; giriş ekranında neden var, ayrıca bakılmalı);
- `data/ses.json` 13,9 k;
- `data/hale-konum.json` 10,5 k;
- `data/weapons.json` 9,9 k;
- `data/backgrounds.json` 8,6 k;
- `data/soy-renkleri.json` 7,9 k.

## Düzeltme önerileri (uygulanmadı)

| # | Öneri | Yol | Kazanç | Risk |
|---|---|---|---|---|
| 1 | `dragonborn-kanat-kok.json`'u tembel yükle | `wingRoot.ts` kökü ilk kanatlı rozet/jeton çiziminde `import()` ile yükler. Yüklenene dek sınıf medyanı ya da slot varsayılanı kullanılır, `useSyncExternalStore` ile yeniden çizilir. Ya da yükleme `loadClassData`'ya bağlanır (karakter ekranları zaten bekliyor) | ≈ 9,7 kB | Düşük. İlk karede kanat kökü birkaç piksel kayabilir (rozet), savaşta veri hazır. Kanat önizleme betikleri de yolu kullanır |
| 2 | Kanat çizim kodunu (`WingPairImage`, `WingFilter`, `wingAnim`, `wingPlacements` ve palet hesabı) ayrı tembel bileşene taşı | `Avatar.tsx`'te `lazy(() => import('./WingLayer'))`, yalnız `look.wing` olan jetonda. `Suspense` yedeği boş | ≈ 4–5 kB | Orta. Rozet ve jeton aynı bileşeni paylaşıyor; testlerde `Suspense` ve SSR (`renderToStaticMarkup`) kanadı ilk çizimde göstermez. Kanat testlerine bekleme gerekir |
| 3 | `kanat-esleme.json` paletleri ve omuz verisini 1. öneriyle aynı tembel veriye birleştir | Tek tembel dosya (`kanat-veri.json`) | ≈ 2,8 kB | Düşük; `hasSubclassWing` (`battle/avatar.ts`) yalnız varlık bilgisi ister, küçük bir liste ana parçada kalmalı |
| 4 | `efekt-baglama.json`'un ana parçaya neden girdiğini bul; savaş parçasına taşı | Statik içe aktaranı bul (büyük olasılıkla rozet/ikon yolu), `FxLayer` tembel parçasına al | ≈ 18 kB | Düşük–orta; jeton rozet önceliği (`rozet`) giriş ekranında kullanılıyorsa o küçük alan ayrı tutulur |
| 5 | Dungeondex menü girişi | Değişmesin (1,3 kB, beklenen maliyet) | — | — |

Öneri 1 + 3 tek başına artışın büyük kısmını geri alır (≈ 12,5 kB → ≈ 447 kB). Öneri 4 ayrı bir kazanç kalemi. Hepsi yalnız görünüm/yükleme işidir; kural ve kayıt sürümü değişmez.
