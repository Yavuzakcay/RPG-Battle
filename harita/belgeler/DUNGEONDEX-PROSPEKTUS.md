# Dungeondex prospektüsü

Geri bildirim: Dungeondex kartları yetersizdi. Örneğin "Alchemist's fire" kartında yalnız "fırlat: alan/hedef" ve ağırlık vardı.
Bu belge her kaydı ilaç prospektüsü gibi gösteren bölüm şablonunu tanımlar. Yalnız arayüz değişti: kural ve kayıt sürümü
aynı, yeni mekanik yok. Kararlar `DECISIONS.md` "Dungeondex prospektüsü" başlığında.

- Saf modül: `src/dungeondex/prospektus/`. `esya.ts` kaydı bölüm listesine çevirir, tipler `types.ts`'te.
- Bileşen: `ProspektusSections.tsx`, kabuğa bağlı değil. Kabuk görevi onu sağ sayfaya bağlayacak.
- Veri: `data/prospektus/<kategori>-<tür>.json`.
- Metinler: `src/i18n/strings.tr2.ts` + `strings.en.ts`, `dex.pro`. Dungeondex metinleri zaten tembel TR parçasında.
- Test: `src/dungeondex/prospektus/prospektus.test.ts`.

## Bölüm şablonu

Sıra sabit (`PRO_ORDER`). Satırı olmayan bölüm hiç üretilmez, boş başlık görünmez. "Oyundaki durum" her zaman rozetle görünür.

| Anahtar | Başlık (TR / EN) | İçerik |
|---|---|---|
| `ne` | Ne işe yarar / What it does | Türkçe özet paragrafı (SRD'den) |
| `nasil` | Nasıl kullanılır / How to use | Türkçe paragraf + veriden: eylem, menzil, uyum, silah özellikleri, giyme süresi |
| `etken` | Etken içerik / Active ingredients | Veriden: hasar, kurtarma + DC, alan, durumlar, süre, bonus, isabette ek hasar, yüklü büyüler, yük, AC |
| `risk` | Riskler / Risks | Türkçe paragraf + veriden: Heavy, Loading, Stealth dezavantajı, Güç şartı |
| `kimler` | Kimler kullanamaz / Who cannot use it | Türkçe paragraf (uyum kısıtı, yetkinlik, hedef türü) |
| `maliyet` | Maliyet ve ağırlık / Cost and weight | Veriden: maliyet (SRD), nadirlik, ağırlık (≈ = SRD'de yazmayan varsayım) |
| `durum` | Oyundaki durum / In-game status | Rozet + varsa not (savaş dışı gerekçesi, Game Master notu, "Oyunda farklı") |

- **Rozet tonları:**
  - `ok`: Savaşta çalışır. Silahlar, zırhlar ve veriyle tanımlı eşyalar.
  - `gm`: Game Master işler (`data/esya-siniflandirma.json` `gm`).
  - `off`: Savaş dışı (`offCombat`).
  - `none`: Yalnız açıklama.
- **EN arayüz:** başlıklar ve veri satırları İngilizce. Türkçe paragraflar Türkçe kalır ve yanlarında "Description available in Turkish only." notu bulunur (SD4).
- **Görünüm:**
  - Geniş ekranda iki sütun. "Ne işe yarar" ve "Oyundaki durum" tam genişlikte.
  - 640 px altında tek sütun; etiketler değerin üstüne geçer.
  - Yazı en az 14 px.

## Kategori → alan eşlemesi

TR = Türkçe yazılacak paragraf (prospektüs verisi). Veri = mevcut alandan otomatik. — = bölüm yok.

| Kategori | Ne işe yarar | Nasıl kullanılır | Etken içerik | Riskler | Kimler kullanamaz | Maliyet ve ağırlık | Oyundaki durum |
|---|---|---|---|---|---|---|---|
| Silah | TR | TR + özellik açıklamaları (`ozellik`) | `damage`, `versatileDamage`, `damageType`, `category`, `range`, `reach`, özellikler, `ammo`, ustalık | Heavy/Loading açıklaması + TR | TR | `maliyet` (SRD `cost`), `weight` | hep `ok` |
| Zırh | TR | TR + giyme/çıkarma (SRD kategori adından) | `baseAc` + DEX (`dex`, `dexMax`) | `stealthDisadvantage`, `strength` + Güç şartı açıklaması + TR | zırh eğitimi açıklaması + TR | `maliyet`, `weight` | hep `ok` |
| Donanım | TR | TR + `use` (fırlat/iç/sür, eylem, menzil) | `use.damage`, `save`, `dc`, `radiusFt`, `burning`, `grants`, `escapeDc`, `rounds`, `tempHp` | TR | TR + `use.vs` | `maliyet` (SRD), `weight` | `offCombat`/`gm`/mekanik |
| Sihirli eşya | TR | TR + `attunement`, `use` | `bonus`, `effects`, `onHit`, `spells` (+ yük maliyeti), `charges`, `dc` | TR (lanet, yok olma…) | TR (uyum sınıfı, silah/zırh türü) | `nadirlik` (SRD `rarity`), `weight` | `offCombat`/`gm`/mekanik + `oyunFarki` |
| Büyü (Aşama 2) | TR (`aciklamalar-tr` `buyu` var, prospektüs ayrıntılı) | veri: `castingTime`, `rangeFt`, bileşenler | veri: `mechanics` (zar, save, alan, süre, konsantrasyon, upcast) | TR | veri: sınıf listesi | — (malzeme bedeli varsa TR) | `harita/belgeler/BUYU-DURUM.md` durumu |
| Sınıf özelliği (Aşama 2) | TR | veri: `class-features.json` türü (passive/action/bonus/reaction) | veri: kaynak, yenilenme, zar | TR | veri: sınıf, seviye | — | `status` (ok/partial/none/missing) |
| Feat (Aşama 2) | TR | TR | veri: `feats` etkisi, ASI | TR | veri: ön koşul, kategori | — | `feats` durumu |
| Tür özelliği (Aşama 2) | TR (`aciklamalar-tr` `tur` var) | TR | veri: zar, DC, kullanım sayısı | TR | veri: tür | — | denetim durumu (`docs/SRD-DENETIM.md`) |
| Alt sınıf (Aşama 2) | TR (yalnız bizim 12; paket metni depoya girmez) | — | özellik listesi (seviye) | — | `cinsiyet` kuralı | — | özellik durum etiketleri |
| Durum | TR (`aciklamalar-tr` `durum` var) | — | `data/conditions.json` etkileri | — | — | — | — |

## Mevcut karttaki boşluklar (Alchemist's fire örneği)

| Bilgi | Eski kart | Prospektüs |
|---|---|---|
| Ne yaptığı | yok (yalnız "fırlat" özeti) | "Ne işe yarar" paragrafı |
| Nasıl kullanılır | yok | Attack eylemindeki bir saldırının yerine, 20 ft |
| Etken içerik | yok | 1d4 ateş, DEX DC 8 + DEX + yeterlilik bonusu, yanma 1d4 |
| Riskler | yok | yanma her tur, nasıl söner (SRD Burning) |
| Maliyet | yok | 50 GP |
| Ağırlık | var | var |
| Oyundaki durum | yok | "Savaşta çalışır" |

Genel boşluklar:

- **Donanım ve silahta maliyet yoktu.** Oyun verisinde maliyet alanı yok; SRD'den prospektüs verisine alındı.
- **Sihirli eşyada nadirlik yoktu.**
- **Riskler ve kısıtlar hiç yoktu.** Uyum sınıfı, lanet ve son yükte yok olma bunlara örnek.
- **Bazı eşyalarda oyun verisi SRD'den ayrışıyor.** 23 kayıtta "Oyunda farklı" notu var.

## Kapsam ve sayılar

| Kategori | Kayıt | Dosya | Aşama | Durum |
|---|---|---|---|---|
| Silah | 38 | `data/prospektus/esya-silah.json` | 1 | yazıldı |
| Zırh | 12 | `data/prospektus/esya-zirh.json` | 1 | yazıldı |
| Donanım | 80 | `data/prospektus/esya-donanim.json` | 1 | yazıldı |
| Sihirli eşya | 319 | `data/prospektus/esya-sihirli.json` | 1 | yazıldı |
| Büyü | 339 | `data/prospektus/buyu.json` | 2 | bekliyor |
| Sınıf özelliği | ≈ 174 (SRD sınıf tablosu) | `data/prospektus/sinif-ozellik.json` | 2 | bekliyor |
| Feat | 17 | `data/prospektus/feat.json` | 2 | bekliyor |
| Tür özelliği | 41 | `data/prospektus/tur-ozellik.json` | 2 | bekliyor |
| Alt sınıf | 12 bizim (108 paket depoya girmez) | `data/prospektus/altsinif.json` | 2 | bekliyor |

Aşama 1'de 449 kayıt yazıldı. Aşama 2'nin tahmini yükü ≈ 583 kayıt.

## Kaynak ve denetim

- **Türkçe paragrafların kaynağı:**
  - SRD 5.2.1. Ana kaynak `data/srd/*.json`: `npm run srd` ile PDF'ten üretilir; sayfa numarası gösterilmez.
  - Tablo ve kesik metinler için `docs/SRD_CC_v5.2.1.pdf` (`pdftotext`).
  - Hiçbir değer bellekten yazılmadı.
- **Sayısal tutarlılık testi:** paragraftaki her değer kaydın SRD ya da oyun alanlarında birebir bulunmalı. Denetlenen değerler: zar (`2d6`), `DC N`, `N ft`, `N GP/SP/CP` ve `+N`.
  - Kaynakta "feet" yazar, karşılaştırmada ft'ye çevrilir.
  - Kaydın kendi alanında olmayan tablo sayıları yazılmadı; tablolar özetlendi.
- **SRD alanları ayrıca denetlenir:** maliyet, ustalık, nadirlik ve zırh giyme süresi `data/srd` ile aynı olmalı.
- **Ham metin testi:** SRD'nin İngilizce cümlesi hiçbir bölümde görünmez. Paragraf İngilizce görünürse (`looksEnglish`) test kırılır.
