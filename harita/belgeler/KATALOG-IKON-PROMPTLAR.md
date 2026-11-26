# KATALOG-IKON-HAZIRLIK — katalog eşyaları için Gemini ikon promptları

Görev KATALOG-IKON-HAZIRLIK (2026-11-26, dal `katalog-ikon`, `birlesik`'ten). Yalnız belge ve veri: motor kodu, betik ve kural sürümü değişmedi. Girdi `harita/belgeler/KATALOG-1-ENVANTER.md` (dal `katalog-1`) tablolarındaki **330 katalog eşyası** ve `docs/katalog/` altındaki 7 eşya kataloğunun (Silahlar Cilt 1 ve 2, Karanlık Yadigârlar, Zırhlar, Giyilebilirler, Yüzükler, Tüketilebilirler) "Ne işe yarar" satırındaki görünüm anlatımı. Boss ve kadim yaratık katalogları (Mora/Tarvok, Kadim Yaratıklar, Kaltakkıran) ile 19 boss ganimeti kapsam dışı: onların görseli ayrı iş.

Sayfa listesi ve hücre ↔ kimlik eşlemesi `data/katalog-ikon-sayfalar.json` (biçim `data/esya-ikon-sayfalar.json` ile aynı, her öğede ek alan `gorunum`). Aşağıdaki her prompt kopyala-yapıştır hazırdır: ortak üst blok + o sayfanın hücre tarifleri.

## 1. Özet

- **330 eşya, 323 hücre, 23 sayfa** (4 × 4; 22 normal + 1 bekleyen).
- Kategori sırası: silah (8 sayfa), zırh/kalkan (4), giyilebilir (4), yüzük/tılsım/mühür (3), tüketilebilir (3), bekleyen (1).
- Her sayfada tek kategori; sayfa içinde benzer boy ve biçimdeki nesneler bir arada (büyük kılıçlar, tek elli bıçaklar, saplı ezici silahlar, uzun saplılar, asalar, yaylar…). Dolu hücre 16'dan azsa boş hücreler sayfanın sonunda.
- Tek hücreye indirilen tekrarlar: 3 ortak hücre, 10 eşya (bölüm 4).
- Bekleyen: K7 adı kesinleşmemiş 6 eşya ayrı sayfada (bölüm 5).

| # | Dosya | Kategori | İçerik | Dolu hücre |
|---|---|---|---|---|
| 1 | `katalog-silah-01.jpg` | Silah | büyük kılıçlar ve uzun katanalar | 16 |
| 2 | `katalog-silah-02.jpg` | Silah | katana, uzun kılıç, meç ve pala | 16 |
| 3 | `katalog-silah-03.jpg` | Silah | kısa kılıç, hançer ve küçük silahlar | 16 |
| 4 | `katalog-silah-04.jpg` | Silah | balyoz, büyük balta ve savaş çekici | 16 |
| 5 | `katalog-silah-05.jpg` | Silah | tek elli balta, topuz, gürz ve kazma | 16 |
| 6 | `katalog-silah-06.jpg` | Silah | teber, kargı, mızrak ve üç dişli | 16 |
| 7 | `katalog-silah-07.jpg` | Silah | asalar, sopalar ve üfleç | 16 |
| 8 | `katalog-silah-08.jpg` | Silah | yay, arbalet, sapan ve sargılar | 10 |
| 9 | `katalog-zirh-01.jpg` | Zırh / kalkan | ağır plakalar | 16 |
| 10 | `katalog-zirh-02.jpg` | Zırh / kalkan | orta zırhlar ve çivili deriler | 16 |
| 11 | `katalog-zirh-03.jpg` | Zırh / kalkan | hafif zırhlar, ceketler ve cübbeler | 16 |
| 12 | `katalog-zirh-04.jpg` | Zırh / kalkan | kalkanlar | 12 |
| 13 | `katalog-giyilebilir-01.jpg` | Giyilebilir | miğfer, taç, maske ve şapka | 16 |
| 14 | `katalog-giyilebilir-02.jpg` | Giyilebilir | başlıklar ve pelerinler | 13 |
| 15 | `katalog-giyilebilir-03.jpg` | Giyilebilir | eldivenler ve bileklikler | 13 |
| 16 | `katalog-giyilebilir-04.jpg` | Giyilebilir | çizmeler ve sandaletler | 11 |
| 17 | `katalog-yuzuk-01.jpg` | Yüzük / tılsım / mühür | yüzükler | 15 |
| 18 | `katalog-yuzuk-02.jpg` | Yüzük / tılsım / mühür | tılsım, kolye ve muskalar | 15 |
| 19 | `katalog-yuzuk-03.jpg` | Yüzük / tılsım / mühür | mühür taşları ve zanaat eklentileri | 7 |
| 20 | `katalog-tuketilebilir-01.jpg` | Tüketilebilir | bombalar, küreler ve kaplamalar | 16 |
| 21 | `katalog-tuketilebilir-02.jpg` | Tüketilebilir | özel oklar ve çay | 13 |
| 22 | `katalog-tuketilebilir-03.jpg` | Tüketilebilir | zehirler, iksirler ve eliksirler | 16 |
| 23 | `katalog-bekleyen-01.jpg` | Bekleyen (K7) | Bekleyen (K7 adı bekleniyor) | 6 |

## 2. Kullanım

1. Sayfanın prompt bloğunu Gemini'ye olduğu gibi yapıştır. İsteğe bağlı: üslup için mevcut bir sayfayı (ör. `assets-ham/esya/sihirli-01.jpg`, `sihirli-10.jpg`) referans görsel olarak ekle; promptta "yalnız çizim üslubunu al, zemin rengini alma" satırı var.
2. Çıktıyı 2048 × 2048 ve tablodaki dosya adıyla kaydet (`assets-ham/esya/katalog-…jpg`; ham klasör depo dışı).
3. Kontrol: hücre sırası JSON'daki `ogeler` sırasıyla aynı mı, nesneler hücre sınırına değiyor mu, nesnede macenta/pembe/mor var mı, boş hücreler gerçekten boş mu. Yanlış hücre tek tek düzeltme sayfasıyla yeniden üretilir (eski hattaki `duzeltme-*` deseni).

## 3. Mevcut hat ve zemin notu

**Mevcut sayfaların üslubu** (`assets-ham/esya/sihirli-*.jpg`, `silah-*.jpg`, `donanim-*.jpg`; 2048 × 2048, 4 × 4, 512 px hücre): elle boyanmış RPG envanter ikonu, kalın koyu kahve/siyah kontur, yumuşak geçişli hücre gölgelemesi, metal ve taşta keskin parlama, ışık sol üstten. Üç çeyrek görünüm; uzun silahlar sol alttan sağ üste çapraz, çizme/bileklik gibi çiftler yan yana. Büyülü nesnede siluete yapışık ince renkli parıltı. Çerçeve, ızgara çizgisi, yazı, gölge yok; nesne hücrenin ≈ %75–80'ini kaplar, kenarda geniş boşluk. Zemin düz kroma yeşili.

**Betik macenta zemini kabul etmiyor** (`scripts/esya-ikon.mjs`, kod değiştirilmedi):

- Zemin rengi sayfanın dört köşesinden örnekleniyor (`zeminRengi`; renkten bağımsız) ve yarı saydam kenar ayrıştırması (unmix) da bu renge göre çalışıyor.
- Ama taşkın dolgu ve delik silme yalnız **yeşil baskın** pikselde ilerliyor: `anahtarla` içinde `yesil[i] = g > r + 20 && g > b + 20` ve `it()` bu bayrağı şart koşuyor. #FF00FF'de G = 0 olduğu için hiçbir zemin pikseli anahtarlanmaz; ikonlar macenta kutu olarak çıkar.
- Kenar taşması bastırma (despill) da yalnız yeşil kanal için (`G ≤ max(R, B)`); `tamDespill` de yeşile göre.
- Manifestteki `zemin` alanını betik okumuyor (eski dosyada `"kose-ornekle"` yalnız not).
- Depoda macenta için hazır çekirdek var: `scripts/lib/madalyon.mjs` (`isMagenta`: R − G > 90 ve B − G > 90; `edgeKeyMask` kenar tabanlı anahtar; `kaynak-ikon` ve `glif` hatları kullanıyor).
- Sonuç: bu sayfalar işlenmeden önce ya betiğe macenta anahtarı eklenmeli (ayrı görev: `yesil` bayrağının yerine zemin rengine göre "zemin baskın" sınaması ve macentada R/B taşması bastırma), ya da promptlardaki iki `#FF00FF` / "magenta" ifadesi kroma yeşiline çevrilip (ve "nesnede yeşil yok" kuralıyla) eski hat aynen kullanılır.

## 4. Tek hücreye indirilen tekrarlar

Aynı nesnenin yalnız element türüyle ayrışan sürümleri (SRD'deki "resistance türü" tekrarı gibi) tek hücre. Hücrenin kimliği ilk üye; kalanlar JSON'da `ayniGorsel`. Ayırt etme sonra ESYA-IKON-AYIRT yöntemiyle (`data/esya-ikon-ayirt.json` `hasar` grubu: doygun piksellere hasar türü tonu + köşede hasar glifi). Bu yüzden bu hücrelerde ton verilecek kısım (sıvı, taş) tek ve doygun renkle istendi.

| Hücre (`id`) | Üyeler | Ayırt etme |
|---|---|---|
| `ember-perfume-bottle` | Köz Parfüm Şişesi (`ember-perfume-bottle`, KY#32), Yıldırım Parfüm Şişesi (`storm-perfume-bottle`, KY#33), Ayaz Parfüm Şişesi (`frost-perfume-bottle`, KY#34) | ateş / yıldırım / soğuk |
| `ember-sigil-stone` | Kor Mühür Taşı (`ember-sigil-stone`, YT#34), Kırağı Mühür Taşı (`frost-sigil-stone`, YT#35), Fırtına Mühür Taşı (`storm-sigil-stone`, YT#36), Kaya Mühür Taşı (`stone-sigil-stone`, YT#37), Zehir Mühür Taşı (`venom-sigil-stone`, YT#38) | ateş / soğuk / yıldırım / asit / zehir |
| `umbral-sigil-stone` | Gölge Özü Mühür Taşı (`umbral-sigil-stone`, YT#40), Işıltı Özü Mühür Taşı (`radiant-sigil-stone`, YT#41) | nekrotik / ışıltı |

Tek hücreye indirilmeyenler (benzer ama ayrı eşya): Dönen Ocak Çekici ve Baltası (farklı silah), 5 eliksir ve 6 iksir (farklı etki ve PDF görünümü), Güç Çerçevesi ve Mistik Çerçeve (altın / gümüş, farklı etki), Usta Çelik Mühür Taşı ve Öz Çekirdeği Taşı (biçimleri ayrı). Katalogda +1/+2/+3 varyantı yok.

## 5. Bekleyen sayfa ve telif

**Bekleyen (K7):** BG3'e benzeyen 6 eşyanın EN adı kullanıcı seçimini bekliyor (`KATALOG-1-ENVANTER.md` 8.1). `katalog-bekleyen-01` sayfası ad seçilince gözden geçirilip üretilir; JSON'da `bekleyen` alanı. Tarifler değişmeyecek TR ada ve PDF anlatımına göre özgün yazıldı. Ad seçildikten sonra bu 6 hücre istenirse kendi kategorisinin boş hücrelerine de taşınabilir (silah 8: 6 boş, giyilebilir 3 ve 4: 3 ve 5 boş, yüzük 3: 9 boş).

| Kaynak | TR ad (değişmez) | Şimdiki EN-AD | Geçici `id` |
|---|---|---|---|
| S1#40 | Dev Kirişli Yay | Titanstring Longbow | `titanstring-longbow` |
| GY#27 | Alevli Yumruk Eldiveni | Helldusk Gauntlets | `helldusk-gauntlets` |
| GY#39 | Karanlık Adım Çizmeleri | Nightwalker Boots | `nightwalker-boots` |
| YT#6 | Yakıcı Asit Yüzüğü | Caustic Band | `caustic-band` |
| YT#7 | Işık Çağrısı Yüzüğü | Callous Glow Ring | `callous-glow-ring` |
| YT#13 | Sıçrayan Akım Yüzüğü | Strange Conduit Ring | `strange-conduit-ring` |

**Özgün tasarım kuralı:** promptlarda hiçbir eşya adı, oyun adı ya da "…'e benzer" ifadesi yok; her tarif PDF'in görünüm cümlesinden (yoksa eşyanın işlevinden) yazıldı. Bekleyen 6 eşya ile envanterin "mekaniği BG3 eşyasıyla birebir" dediği 9 eşya (Diadem of Spellstrike, Spellstrike Ring, Soulcatcher Gauntlets, Walking Bastion Shield, Duelist's Signet, Dawnseal Mace, High Command Ring, Armor of Fleetness, Weavewoven Robe) bilerek kendi biçimleriyle tarif edildi, hiçbiri bir oyun eşyasının görünümüne dayanmaz: ör. Şafak Mührü Topuzu beyaz taş mühür diskli flanşlı topuz, Yürüyen Hisar Kalkanı burçlu kale kapısı biçimli kule kalkanı, Düellocu Mührü korumasında mühür yüzüğü olan meç. Bu 9 eşya K7 ad listesinde olmadığı için normal sayfalarda.

**Renk uyarlamaları (macenta zemin kuralı):** PDF'te mor/pembe geçen görünümler başka renge çevrildi: Sıçrayan Akım Yüzüğü "mor kuvars" → duman mavisi-gri kuvars; Gölge Özü Mühür Taşı "siyah ametist" → ortak öz taşı hücresi (ton ayırt etmede); Büyü Bozan Zehir "mor özüt" ve Uyku Özü Zehri "koyu mor" → koyu lacivert; psişik parıltılar → soluk camgöbeği. Aşk Tozu Şişesi'ndeki gül, pembe değil koyu kırmızı.

**PDF'te görünüm cümlesi olmayan ya da sütun kaymasıyla okunamayan** eşyalar `-layout` metinden tamamlandı; yine de görünüm vermeyen iki eşya işlevinden tasarlandı: Örgü Dokuması Cübbe (ZK#32), Yıldız Taşı Sapanı (S2#55; ham metindeki satır Kıyı Orağı'nınki).

**Kimlik:** `id` geçici; PDF EN adının slug'ı, envanterin "id önerisi" ile aynı. P0'da gerçek kimlik atanınca eşlenir; K7 eşyalarında kimlik yeni EN addan türeyecek.

## 6. Ortak üst blok

Her sayfa promptunun başı bu bloktur (16 hücreli sayfa için). Dolu hücresi 16'dan az olan sayfada ilk satır hücre sayısını ve boş hücreleri söyler; aşağıdaki sayfa promptları bunu zaten içerir.

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. …
```

## 7. Sayfa promptları

### 7.1 `katalog-silah-01.jpg` — Silahlar 1: büyük kılıçlar ve uzun katanalar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Huge two-handed greatsword with a broad, slightly flared steel blade notched like a giant's broken tooth, a heavy square dark-iron crossguard, a long leather-wrapped grip and a round pommel, faint warm gold glow.
2. Two-handed greatsword forged from dark speckled meteorite steel with tiny glinting white star flecks along the blade, a crescent-shaped crossguard and a cool pale-teal glow along the edge.
3. Black-iron greatsword whose wide blade has a jagged, fang-like serrated section near the guard and blood-red channels along the fuller, with a dark red glow.
4. Plain heavy greatsword of matte dark grey alloy with an unpolished blade that seems to swallow light, a simple bar crossguard wrapped in grey cloth, no glow at all.
5. Greatsword with a dark steel blade whose central fuller glows like live embers, thin orange heat cracks along the edge, a soot-blackened iron crossguard and a soft orange glow.
6. Gleaming greatsword whose bright steel blade is covered in fine cracks leaking white light, with a red wax seal disc hanging on a cord from the crossguard.
7. Greatsword with a black blade veined with glowing crimson-orange lava-like cracks, thin flames being sucked into the blade, and a dark gold crossguard.
8. Greatsword with a pale silver blade curving gently like a crescent moon, frost crystals along the edge and a cold blue moonlight glow.
9. Heavy executioner's greatsword with a broad square-tipped blade decorated with red filigree inlay and a spiral corkscrew-shaped crossguard on a long two-handed grip.
10. Huge sword-shaped slab carved from a single piece of cracked grey ruin stone with worn ancient carvings, small stone chips floating around it and a faint pale-blue gravity glow.
11. Greatsword forged from golden bone: an ivory-gold blade with sunrise ray patterns, a winged gold crossguard and a warm radiant gold glow.
12. Wavy flame-shaped flamberge greatsword with a black blade burning with mixed black and white flames along its edges and a silver crossguard.
13. Perfectly balanced knight's greatsword with a polished steel blade, a straight gold crossguard and pommel, a gold-wrapped grip and a faint golden shimmer.
14. A matched pair of crossed greatswords forming an X, dark steel blades flecked with glinting white stars, gold crossguards and a faint pale-blue shimmer.
15. Exceptionally long, slim curved katana with a bright steel blade, a round guard, a long black-and-white wrapped grip and a pale cyan whirlwind spiraling around the blade.
16. Katana with a blue-tinted steel blade, a crescent-moon shaped guard, a dark blue wrapped grip and a thin line of pale blue-white light along the edge.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `giantbreaker-blade` | Devkıran Pala | S1#1 |
| 2 | `starcleave` | Yıldız Kesiği | S1#2 |
| 3 | `crimson-maw` | Kızıl Doymaz | S1#3 |
| 4 | `mute-iron` | Suskun Demir | S1#4 |
| 5 | `cinderheart-greatsword` | Korköz Büyük Kılıcı | S1#5 |
| 6 | `shattervow-greatsword` | Kırılgan Hüküm | S2#83 |
| 7 | `flame-siphon-greatsword` | Alev Sömüren Büyük Kılıç | KY#1 |
| 8 | `frostcrescent-greatsword` | Ayaz Hilal Büyük Kılıcı | KY#2 |
| 9 | `corkscrew-executioner-sword` | Burgu İnfaz Kılıcı | KY#3 |
| 10 | `riftbreaker-greatsword` | Yarık Çökerten Dev Kılıç | KY#4 |
| 11 | `horizonlight-greatsword` | Ufuk Işığı Büyük Kılıcı | KY#8 |
| 12 | `blackflame-oathblade` | Kara Alev Yemin Kılıcı | KY#9 |
| 13 | `golden-poise-greatsword` | Altın Denge İki Elli Kılıcı | KY#10 |
| 14 | `twin-starblades` | Yıldız Çifti Büyük Kılıçları | KY#12 |
| 15 | `whirlwind-katana` | Girdap Katanası | KY#5 |
| 16 | `mooncut-katana` | Aykesen Katana | KY#6 |

### 7.2 `katalog-silah-02.jpg` — Silahlar 2: katana, uzun kılıç, meç ve pala

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Cursed katana whose dark blade is coated in clotted red blood, with a black guard, a red-wrapped grip and red droplets falling from the tip.
2. Katana with a scale-patterned blade: one half of the edge glows with orange cinders, the other half is frosted icy blue, with a grey-wrapped grip.
3. Longsword with a polished steel blade pierced by a row of small round holes like a flute, a bell-shaped bronze crossguard and soft golden sound ripples around the blade.
4. Spellsword longsword with a silver-blue blade etched with storm-cloud patterns, a crossguard shaped like two lightning bolts and yellow-white sparks crackling along the edge.
5. Longsword with a dark grey blade engraved with a spiderweb pattern, a crossguard shaped like curled spider legs and strands of white sticky silk trailing from the tip.
6. Commander's longsword with a sturdy steel blade, a gold-trimmed hilt and a small square deep-red war banner tied to the crossguard.
7. Elegant rapier with a long needle-thin blade and a swept silver hilt that curls into a signet ring with a flat seal disc at the guard, black grip, faint smoky grey shimmer.
8. Thin rapier with a narrow blade and an open spiral wire cup-hilt shaped like a curled ear, a dark blue grip and faint pale-teal whisper wisps along the blade.
9. Rapier with a thin steel blade and a lyre-shaped swept hilt with tiny strings across the guard, faint golden musical ripples.
10. Needle-thin rapier with a dark red blade dripping bright yellow-green corrosive drops and a crimson cup hilt.
11. Light slender scimitar with a gently curved bright steel blade, a small feather-shaped guard and a pale cyan breeze curling around the blade.
12. Short balanced scimitar with a sharp curved blade, a guard shaped like a leaping stag's leg, a sand-colored leather grip and faint speed streaks behind it.
13. Scimitar with a mottled green-brown blade, swamp reeds and vines wrapped around the hilt and drops of green poison dripping from the edge.
14. Black scimitar with a matte dark blade and a thin silver edge, a guard shaped like a small set of judge's scales, and wisps of shadow.
15. Scimitar with a curved steel blade and a hilt of living wood that sprouts small green leaves, with a vine twisting around the guard.
16. Light scimitar whose curved blade is shaped like a feathered wing, dark night-blue metal sprinkled with glittering white stars, trailing faint blue-white stardust.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `bloodtide-katana` | Kızıl Akıntı Katanası | KY#7 |
| 2 | `cinderfrost-katana` | Küllü Ayaz Katanası | KY#11 |
| 3 | `dirge-blade` | Ağıt Kılıcı | S1#7 |
| 4 | `stormbrand` | Kıvılcım Kılıcı | S1#9 |
| 5 | `webrender-longsword` | Ağkesen Uzun Kılıç | S2#47 |
| 6 | `marshals-banner-longsword` | Sancak Komutanı Kılıcı | S2#84 |
| 7 | `duelists-signet` | Düellocu Mührü | S1#6 |
| 8 | `whispering-rapier` | Fısıltı Meçi | S1#10 |
| 9 | `harmonic-rapier` | Ahenk Meçi | S2#79 |
| 10 | `crimson-needle-rapier` | Kızıl İğne Mızrağı | KY#35 |
| 11 | `windpoise` | Rüzgâr Dengesi | S1#8 |
| 12 | `stride-scimitar` | İvme Palası | S1#11 |
| 13 | `mirefang-scimitar` | Bataklık Dişi Palası | S2#45 |
| 14 | `nightjudge-scimitar` | Gece Yargıcı Palası | S2#68 |
| 15 | `sylvan-voice-scimitar` | Orman Sesi Palası | S2#81 |
| 16 | `nebula-wing-scimitar` | Bulutsu Kanat Palası | KY#13 |

### 7.3 `katalog-silah-03.jpg` — Silahlar 3: kısa kılıç, hançer ve küçük silahlar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. A pair of short reverse-grip curved blades crossed in an X, dark steel with leather-wrapped grips and small knuckle-guard loops.
2. Short sword with a smoked dark-steel blade tapering into a fang-like point, a black iron guard and grip, and dark shadow smoke clinging to the blade.
3. Light shortsword with a bright steel leaf-shaped blade, a simple brass guard, a red leather grip and a single red drop at the tip.
4. Assassin's short sword with a slim deep-red blade, a black hilt with a small ruby pommel and a thin trail of red mist.
5. Short sword with a dull non-reflective dark blade, a leaf-shaped point, a compact guard and a grip wrapped in mottled green-brown cloth.
6. Narrow short sword with a slightly translucent pale-teal crystal blade and a silver hilt set with a small eye-shaped gem.
7. Curved dagger with a dark steel blade and a deep red channel down its center, an ornate gold crossguard shaped like bat wings, a black grip and a soft crimson glow.
8. Assassin's dagger with a wavy, wicked kris-style blade, a grip wrapped in black cord and a faint pale-teal haze swirling over the blade.
9. Parrying dagger with a frost-rimed steel blade, a wide side-ring guard, small ice crystals along the edge and an icy cyan glow.
10. Slender thin knife with a narrow blade marked by a small engraved seal near its base, a plain dark wooden handle and a bead of greenish liquid at the tip.
11. Curved dagger with a dark blade ending in a thorn-like barb, a grip wrapped in black thorny vine and a teardrop-shaped pale-teal gem in the pommel.
12. Plain hunting dagger with a blackened blade, a dark leather-wrapped wooden handle and a small owl-head pommel.
13. Ritual dagger with a curved glossy obsidian-black blade, a carved bone hilt and a thin red blood groove.
14. Sickle with a crescent blade of pale blue ice-steel, frost along the edge, a short driftwood handle and a few water droplets.
15. Slender silver throwing dart engraved with tiny abstract rune marks, with short silver fins and a bright silver shine.
16. Alchemical perfume-bottle weapon: a thick faceted glass bottle with a brass atomizer bulb and nozzle, filled with one bright saturated orange liquid (single hue, to be recolored per element later), a few small glowing sparks at the nozzle.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `blindspot-backhand-blades` | Kör Nokta İkiz Bıçakları | KY#24 |
| 2 | `gloomfang` | Karanlık Diş | S1#13 |
| 3 | `firstblood-shortsword` | İlk Kan Kısa Kılıcı | S1#17 |
| 4 | `crimson-whisper` | Kırmızı Fısıltı | S2#67 |
| 5 | `ambushers-shortsword` | Pusu Kısa Kılıcı | S2#70 |
| 6 | `mindrend-shortsword` | Akıl Kıran Kısa Kılıç | S2#73 |
| 7 | `blooddrinker` | Kan Susuzu | S1#12 |
| 8 | `spiteful-dagger` | Büyülü Kin Hançeri | S1#14 |
| 9 | `frostbite-dagger` | Ayaz Kesici | S1#15 |
| 10 | `seeping-knife` | Sızıntı Bıçağı | S1#16 |
| 11 | `sorrowthorn-dagger` | Keder Hançeri | S2#72 |
| 12 | `nightscout-dagger` | Gece İzci Hançeri | S2#74 |
| 13 | `bloodrite-dagger` | Kan Ayini Hançeri | S2#88 |
| 14 | `tide-sickle` | Kıyı Orağı | S2#56 |
| 15 | `silverneedle-dart` | Gümüş İğne Oku | S2#58 |
| 16 | `ember-perfume-bottle` | Köz Parfüm Şişesi / Yıldırım Parfüm Şişesi / Ayaz Parfüm Şişesi | KY#32, KY#33, KY#34 |

### 7.4 `katalog-silah-04.jpg` — Silahlar 4: balyoz, büyük balta ve savaş çekici

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Massive two-handed maul with a blocky iron head ending in a pointed crushing spike, chips of cracked stone stuck in its face, on a thick wooden haft.
2. Heavy two-handed maul with a bulky cylindrical head ringed by iron bands and copper coils, faint concentric shockwave rings around the head.
3. Heavy maul whose head is a block of translucent blue glacier ice bound with iron straps, on a frost-covered haft, with icy cyan mist.
4. Huge maul with a rough granite head bound by bronze bands, cracks across the stone glowing faint amber, on a thick wooden haft.
5. Giant maul with a red-hot glowing iron head whose underside is scorched and scraped, trailing embers, on a long sooty haft.
6. Heavy maul whose head is a petrified giant sunflower of dark grey stone with stone petals, faint gold light glowing from its center.
7. Heavy maul with an anvil-shaped head encrusted with jagged red crystals and dripping bright yellow-green acid.
8. Two-handed greataxe whose double head is shaped like an open furnace mouth glowing with orange embers inside, on a soot-blackened iron-banded haft.
9. Two-handed greataxe with twin opposed blades: one etched with glowing orange flame marks, the other with yellow lightning marks, sparks of both colors around the head.
10. Greataxe whose head is a large circular saw-toothed steel wheel mounted on a long haft, with faint spin lines.
11. Forged greataxe with a broad single blade bearing glowing orange forge runes (abstract marks), on a dark iron-shod haft.
12. Warhammer with a square steel head, broken chain links wrapped around the haft and a shattered shackle hanging below the head, faint pale-blue glow.
13. Warhammer with a cracked white marble head bound in steel bands, pale blue force light leaking from the cracks, on a steel haft.
14. Warhammer with a dark steel head bound to its haft by a glowing golden chain of linked abstract runes, small yellow lightning sparks around it.
15. Heavy throwing hammer with a smith's square head stamped with an anvil emblem and forge marks, a short iron haft and a faint orange heat glow.
16. Heavy war pick made from a rock monster's huge jawbone with a stone tooth as the spike, bound to a thick wooden haft with iron rings.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `shellbreaker-maul` | Zırh Kıran Balyoz | S1#24 |
| 2 | `shockwave-maul` | Sarsıntı Tokmağı | S1#27 |
| 3 | `glacierbreak-maul` | Buz Kıran Balyoz | S2#43 |
| 4 | `earthshatter-maul` | Çökertme Balyozu | S2#62 |
| 5 | `cinderdrag-maul` | Kor Sürükleyen Balyoz | KY#16 |
| 6 | `shadowbloom-maul` | Gölge Çiçeği Balyozu | KY#20 |
| 7 | `scarlet-anvil-maul` | Kızıl Çekiç | KY#21 |
| 8 | `embermaw-greataxe` | Kor Ağızlı Balta | S1#19 |
| 9 | `twinspark-greataxe` | Çift Kıvılcım Baltası | S2#41 |
| 10 | `sawtooth-wheel-greataxe` | Dişli Çark Baltası | KY#17 |
| 11 | `homing-forge-greataxe` | Dönen Ocak Baltası | KY#19 |
| 12 | `chainbreaker-warhammer` | Zincir Kıran Çekiç | S1#25 |
| 13 | `oathshatter-warhammer` | İnanç Kıran Savaş Çekici | S2#66 |
| 14 | `pactbound-warhammer` | Bağlı Savaş Çekici | S2#86 |
| 15 | `homing-forge-hammer` | Dönen Ocak Çekici | KY#18 |
| 16 | `meteor-jaw-war-pick` | Göktaşı Çene Kazması | KY#15 |

### 7.5 `katalog-silah-05.jpg` — Silahlar 5: tek elli balta, topuz, gürz ve kazma

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. One-handed battleaxe with a heavy bearded steel head inset with a dull grey anti-magic stone, a dark wooden haft with leather wrap, no glow.
2. Battleaxe whose dark steel head has a red-hot glowing edge with white steam rising from it, on a leather-wrapped wooden haft.
3. Small throwing handaxe with a bright copper blade edge, a short wooden handle and tiny yellow-white electric sparks on the edge.
4. Small throwing hammer with a compact steel head engraved with a spiral wind seal, a short wrapped handle and a pale cyan wind swirl.
5. Light hammer with a small square head etched with abstract runes, a short handle and blue-white sparks flying off it.
6. Flanged steel mace whose head carries a round white-stone seal disc stamped with a rising-sun emblem, white cloth ribbons tied below the head, soft pale-gold glow.
7. Mace whose head is a hollow ridged bronze bell with flanges, on an iron haft, with pale grey concentric sound rings.
8. Dark iron mace with a head covered in hooked spikes and wrapped in rusty barbed wire, with grey-black smoke.
9. Mace whose head is a heavy bronze bell with its clapper visible inside, on a dark wooden haft.
10. Morningstar with a polished gold spherical head bristling with sun-ray spikes, glowing warm white-gold daylight, on a white-wrapped steel haft.
11. Flail with three chains on one handle, each ending in a different spiked ball: one burning orange, one icy cyan, one dripping yellow-green acid.
12. Chain flail whose spiked iron ball is pitted and crusted with yellow sulfur, dripping dark oily liquid, with faint yellow fumes.
13. Brutal flail with a spiked iron ball stained dark red on a heavy chain, the handle wrapped in torn red cloth, with a red aura.
14. Flail with a short handle and two chains, each ending in a glowing pale blue-white star sphere trailing glittering stardust.
15. Coiled whip of linked glowing-hot steel chain covered in small barbs, ending in a hooked barb, with an iron handle and orange ember glow on the links.
16. Miner's war pick with a hardened dark steel pick head, a small lantern hook on its side and a sturdy oak haft with iron bands.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `spellbreaker-battleaxe` | Büyü Kıran Balta | S1#22 |
| 2 | `scaldstream-battleaxe` | Buharlı Savaş Baltası | S2#44 |
| 3 | `sparkling-handaxe` | Kıvılcımlı El Baltası | S2#49 |
| 4 | `gale-light-hammer` | İten Hafif Çekiç | S2#64 |
| 5 | `sparkforge-hammer` | Kıvılcım Dövme Çekici | KY#23 |
| 6 | `dawnseal-mace` | Şafak Mührü Topuzu | S1#23 |
| 7 | `thunderclap-mace` | Gök Gürültüsü Tokmağı | S2#46 |
| 8 | `scourge-of-torment-mace` | Kamçılayan Azap Topuzu | S2#87 |
| 9 | `bellringer-mace` | Çan Sesi Topuzu | KY#22 |
| 10 | `sunstar-morningstar` | Kutsal Yıldız Gürzü | S2#52 |
| 11 | `four-seasons-flail` | Dört Mevsim Gürzü | S1#26 |
| 12 | `brimstone-flail` | Sıçrayan Kükürt Gürzü | S2#42 |
| 13 | `frenzied-blood-flail` | Lanetli Çılgınlık Gürzü | S2#90 |
| 14 | `stardust-flail` | Yıldız Tozu Gürzü | KY#14 |
| 15 | `barbed-chain-whip` | Dikenli Zincir Kamçı | S2#51 |
| 16 | `delvers-war-pick` | Çukur Delen Savaş Kazması | S2#53 |

### 7.6 `katalog-silah-06.jpg` — Silahlar 6: teber, kargı, mızrak ve üç dişli

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Long halberd with a broad axe blade, a spear point and a rear hook, on a tall dark wooden shaft with iron bands, a small open-eye emblem on the blade.
2. Light glaive with a thin curved blade of pale silvery alloy on a slender pale-wood shaft, fluttering cloth ribbons below the blade and a faint cyan breeze.
3. Glaive whose curved blade emerges from a carved dragon-head socket, with five small gems (red, blue, yellow, green, white) set in the collar of a long dark shaft.
4. Glaive with a long curved blade and a large sharp back hook, on a long dark shaft with a coiled chain wrapped below the head.
5. Long balanced pike with a slim steel point, two small fin-like stabilizers below the head, a polished ash shaft and a faint circular pale-blue swirl.
6. Long pike with a slender, slightly bending pole shaft of layered pale wood, a narrow steel point and a padded grip at the middle.
7. Long pike with a spiraling twisted bronze point on a long dark wooden shaft, with a pale cyan wind spiral around the tip.
8. Long knight's lance with a tapered conical steel tip and a large flared hand guard painted blue and white, a small blank pennant tied below the tip.
9. Double-ended weapon: a central wrapped grip with a long golden blade at each end shaped like a spread wing, glowing warm gold.
10. Ornate trident with three silver tines, a swirling cloud motif at the socket, a dark blue shaft, and pale cyan wind with small yellow sparks around the tines.
11. Sea trident with three wave-curled bronze tines, shell and coral decorations at the socket, a weathered sea-green shaft and water spray around the head.
12. Large trident with three red-steel tines stamped with ritual seal marks, a black shaft, small orange flames and red blood drips at the tines.
13. Spear with a dark steel leaf-shaped head inlaid with a silver crescent moon, a black shaft wrapped in silver wire and a soft moonlight-blue glow.
14. Ancient spear with a gold-and-bronze head shaped like a dragon's fang, crackling with yellow-white lightning, on a dark shaft.
15. Throwing javelin with a bright steel head shaped like a lightning bolt on a slim pale-wood shaft, crackling with yellow electric light.
16. Flexible whip-sword made of thin linked steel ribbon segments curling in a loose S-shape, ending in a short sword hilt.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `vigil-halberd` | Nöbet Teberi | S1#18 |
| 2 | `breeze-glaive` | Esinti Tırpanı | S1#20 |
| 3 | `wyrmbreath-glaive` | Ejdernefes Kargısı | S1#21 |
| 4 | `hooklash-glaive` | Kancalı Tırpan Kargı | S2#63 |
| 5 | `homing-pike` | Geri Dönen Kargı | S1#31 |
| 6 | `vaulting-pike` | Sıçrama Kargısı | S2#65 |
| 7 | `windspiral-pike` | Rüzgâr Burgusu Kargısı | KY#28 |
| 8 | `lancers-charge-lance` | Süvari Hücum Kargısı | S2#50 |
| 9 | `luster-twinblade` | Işık Biriktiren Çift Mızrak | KY#25 |
| 10 | `tempest-trident` | Fırtına Zıpkını | S1#28 |
| 11 | `tidecaller-trident` | Dalga Zıpkını | S1#30 |
| 12 | `bloodrite-trident` | Kan Ayini Üç Dişli Mızrağı | KY#26 |
| 13 | `dusklight-spear` | Alacakaranlık Mızrağı | S1#29 |
| 14 | `skybolt-spear` | Gök Yıldırımı Mızrağı | KY#27 |
| 15 | `stormbolt-javelin` | Şimşek Ciriti | S2#61 |
| 16 | `ribbon-whip-blade` | Şerit Kamçı Kılıcı | KY#29 |

### 7.7 `katalog-silah-07.jpg` — Silahlar 7: asalar, sopalar ve üfleç

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Grand staff whose top is a knot of twisted silver and gold metal with five small orbs orbiting it (red fire, icy blue, yellow lightning, green acid, pale grey thunder), on a tall dark wooden shaft.
2. Staff of carved pale grey vertebrae bones topped with a small horned skull, dark grey-green smoke curling from its eye sockets.
3. Wizard staff topped with a large cluster of ice crystals, a frost-covered pale wooden shaft, an icy cyan glow and small snowflakes.
4. Arcane staff wrapped from top to bottom in shiny copper wire coils, topped with a small glass sphere holding a crackling yellow-white spark.
5. Short carved wooden wand-staff with flowing wave carvings, a small silver spout-like cap on top and clear water droplets spraying from it.
6. Heavy staff ending in a cast bronze ram's head with curled horns, on a thick iron-banded oak shaft.
7. Tall grand staff of polished white wood with an ornate gold cage at the top holding a large brilliant blue crystal and swirling blue arcane light.
8. Fire mage staff topped with a glowing red-orange ember stone gripped by black iron claws, small flames rising from it, on a charred wooden shaft.
9. Regal scepter-staff with a small gold crown on top encircling a pale-teal gem, on a white and gold shaft.
10. Staff topped with a silver tuning-fork-shaped head holding a small floating prism crystal, faint concentric rings of red, blue and yellow light.
11. Support staff of pale wood with a small golden halo ring floating above its top and white cloth ribbons, soft warm golden glow.
12. Simple apprentice staff of light wood with a small green glass crystal at the top dripping bright yellow-green acid.
13. Simple monk's bamboo staff with natural segments, cloth wraps at both ends and a small round balance charm hanging from a cord.
14. War torch club: a thick wooden cudgel with its end wrapped in pitch-soaked rags burning with a bright orange flame, an iron collar below the rags.
15. Light club carved from a petrified giant's bone, grey-white and stone-like with mineral veins, a knobby end and a simple leather grip.
16. Long thin blowgun tube of dark polished reed bound with black cord, a small mouthpiece, and three slim green-tipped needle darts tied to its side.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `staff-of-the-confluence` | Elementler Asası | S1#32 |
| 2 | `ashen-bone-staff` | Sönük Kemik Asası | S1#33 |
| 3 | `hoarfrost-staff` | Kırağı Asası | S1#34 |
| 4 | `sparkweave-staff` | Büyü Kıvılcımı Asası | S1#35 |
| 5 | `purging-wand-staff` | Arındırma Değneği | S1#36 |
| 6 | `battering-ram-staff` | Koçbaşı Asası | S2#60 |
| 7 | `archmages-conduit-staff` | Başbüyücü Odası Asası | S2#75 |
| 8 | `incandescent-ember-staff` | Kor Alev Asası | S2#76 |
| 9 | `sovereigns-staff` | Taç Asası | S2#77 |
| 10 | `resonance-staff` | Yankı Asası | S2#78 |
| 11 | `staff-of-arcane-benediction` | Kutsama Asası | S2#80 |
| 12 | `acidarrow-staff` | Asit Oku Asası | S2#82 |
| 13 | `unbound-balance-staff` | Zırhsız Denge Asası | S2#89 |
| 14 | `pitchtorch-club` | Yağlı Meşale Sopası | S2#48 |
| 15 | `giantcore-club` | Dev Özü Sopası | S2#57 |
| 16 | `silent-needle-blowgun` | Sessiz İğne Üfleci | S2#54 |

### 7.8 `katalog-silah-08.jpg` — Silahlar 8: yay, arbalet, sapan ve sargılar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 10 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 10 cells get an object; cells 11–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Tall longbow of white-gold wood with sun-ray carvings on the limbs and a string made of a glowing beam of golden light, bright warm gold glow.
2. Long sturdy longbow of dark yew with a brass sighting ring mounted above the grip, a green leather grip wrap and iron-tipped limbs.
3. Short bow of matte black-stained wood with no shine at all, a dark cord string and limbs wrapped in dark grey cloth strips.
4. Short bow of pale grey wood with wailing ghost-face carvings at the limb ends, a thin silvery string and pale ghostly mist.
5. Large heavy crossbow of dark steel and wood with a thick prod, a crank winch on the stock, loaded with a grappling-hook bolt trailing a coiled rope.
6. Compact one-handed crossbow of dark lacquered wood and steel, loaded with a glowing pale-blue bolt of pure force energy instead of a real bolt.
7. One-handed crossbow of blackened iron with horn-shaped limb tips, loaded with a burning bolt trailing orange flame and dark smoke.
8. Leather sling with long braided cords cradling a small round stone that glows pale blue-white like a star, with tiny sparkles.
9. A pair of cream linen hand wraps with dried brown leaves pressed into the cloth and loose trailing ends.
10. A pair of pale grey linen martial-arts foot wraps with spiral wind seals sewn on, a pale cyan wind swirl around them.
11–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `skylight-longbow` | Gök Işığı Uzun Yayı | S1#37 |
| 2 | `deadeye-longbow` | Keskin Nişancı Yayı | S1#38 |
| 3 | `shadowveil-shortbow` | Gölgeli Kısa Yay | S2#71 |
| 4 | `banshees-wail-shortbow` | Yakarış Uzun Yayı | S2#85 |
| 5 | `skyfall-heavy-crossbow` | Gök Düşüren Arbalet | S2#59 |
| 6 | `forcebolt-hand-crossbow` | Kuvvet Arbaleti | S1#39 |
| 7 | `hellcinder-hand-crossbow` | Kül Ateşi El Arbaleti | S2#69 |
| 8 | `starstone-sling` | Yıldız Taşı Sapanı | S2#55 |
| 9 | `dryleaf-handwraps` | Kuru Yaprak Dövüş Sargısı | KY#30 |
| 10 | `gale-footwraps` | Kasırga Tekme Sargısı | KY#31 |

### 7.9 `katalog-zirh-01.jpg` — Zırh 1: ağır plakalar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Full plate cuirass with pauldrons of crimson-red steel, horned shoulder plates and dark blood stains.
2. Plate cuirass of ivory bone ribs laid over dull steel, a broken crown motif on the chest.
3. Massive bulky plate armor of thick oxidized blue-green copper blocks with bronze rivets and huge square shoulders.
4. Ancient knight's plate armor covered in overlapping reddish-bronze scales with root-like engraved patterns.
5. Ceremonial dark grey full plate with tall smooth pauldrons, a lone-knight sigil on the chest and a long grey tabard.
6. Full plate of black infernal steel with glowing orange forge seams between the plates and small horn details, slight heat shimmer.
7. Very thick full plate cuirass of layered reinforced dull steel plates, broad pauldrons and a sturdy gorget.
8. Aggressive full plate reinforced with curved dragon rib bones wrapping the chest like a ribcage, ivory bones over dark steel.
9. Heavy black-iron fortress plate with a skull-like chest emblem, scythe-blade trims on the pauldrons and grey-black smoke.
10. Polished steel ceremonial battle plate with a blue enamel crest emblem on the chest, gold trims and a short blue cape.
11. Temple knight plate of white-enameled steel with a gold holy seal on the chest and blank parchment prayer strips hanging from it.
12. Heavy enclosed plate of smooth layered steel with a high protective gorget and a calm pale-teal gem set in the chest.
13. Double-layered splint armor of vertical steel strips with anvil-and-hammer embossing, dwarven geometric patterns and brass rivets.
14. Splint armor of scorched dark iron strips glowing warm orange from within at the seams.
15. Chain mail hauberk with concentric rippling rings of pale blue force energy across the steel links.
16. Half plate of smooth pale steel with a pale-teal glass gem at the center of the chest surrounded by soothing ripple engravings.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `crimson-fiend-plate` | Kızıl İblis Zırhı | KY#44 |
| 2 | `royal-remnant-plate` | Kraliyet Kalıntısı Zırhı | KY#49 |
| 3 | `verdigris-bastion-plate` | Yeşil Bakır Hisar Plakası | KY#51 |
| 4 | `primordial-knight-plate` | Kök Şövalye Zırhı | KY#53 |
| 5 | `solitude-knight-plate` | Yalnızlık Şövalyesi Plakası | KY#55 |
| 6 | `hellforge-plate` | Cehennem Ocağı Plakası | ZK#22 |
| 7 | `plate-of-endurance` | Sarsılmaz Yemin Plakası | ZK#23 |
| 8 | `devouring-bone-plate` | Yutucu Kemik Plakası | ZK#24 |
| 9 | `reapers-iron-plate` | Biçici Karanlık Plakası | ZK#25 |
| 10 | `marshals-crested-plate` | Mareşal Armalı Plakası | ZK#26 |
| 11 | `plate-of-devotion` | Adanmışlık Plakası | ZK#27 |
| 12 | `mindfortress-plate` | Zihin Kalesi Plakası | ZK#28 |
| 13 | `dwarven-anvil-splint` | Cüce Örsü Şerit Zırhı | ZK#29 |
| 14 | `scorched-iron-plate` | Kızgın Demir Plakası | ZK#30 |
| 15 | `forcewave-chain-mail` | Dalgalanan Kuvvet Zırhı | ZK#31 |
| 16 | `mindward-half-plate` | Psişik Kalkan Zırhı | ZK#18 |

### 7.10 `katalog-zirh-02.jpg` — Zırh 2: orta zırhlar ve çivili deriler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Medium breastplate wrapped in spiky iron bramble wire covered with sharp thorns.
2. Sleek light-plated medium armor of overlapping teal-enameled plates with swallow-wing shaped shoulder plates.
3. Half plate of matte blackened steel with almost no shine over a dark grey padded undercoat.
4. Scale armor of hardened dark green insect chitin plates with poison-yellow edge stripes.
5. Scale armor of blue-grey storm alloy scales with thin yellow lightning veins crackling between them.
6. Light flexible mail of overlapping green-brown lizard scales.
7. Breastplate made of hardened sacred oak bark plates with visible wood grain, bound with leather straps.
8. Light chain shirt of shiny copper rings with tiny yellow sparks jumping between the links.
9. Bright silver breastplate with a carved radiating sunburst on the chest and soft golden light.
10. Fine-ringed chain shirt with a slick oily sheen and a white healer's sash across it.
11. Medium hide armor layered with light fur and thick overlapping green and brown leaves.
12. Assassin's light armor of small silvery-grey sound-dampening scales sewn onto dark leather.
13. Studded black leather armor with silver studs, dark charcoal feather embroidery with a blue sheen and wing-shaped shoulder pieces.
14. Studded leather armor overgrown with living green forest moss and small ferns.
15. Studded leather armor fitted with bulbous brown and orange mushroom pouches on the shoulders and belt.
16. Sharp-edged dark red studded leather armor with angular cuts and blade-like trims.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `bramble-iron-plate` | Dikenli Çelik Zırhı | KY#42 |
| 2 | `armor-of-fleetness` | Çeviklik Zırhı | ZK#11 |
| 3 | `shadowknight-half-plate` | Gölge Şövalyesi Yarım Plakası | ZK#12 |
| 4 | `venomcarapace-scale` | Zehirli Kabuk Zırhı | ZK#13 |
| 5 | `stormplate-scale` | Ebedi Fırtına Pul Zırhı | ZK#14 |
| 6 | `serpentscale-mail` | Kertenkele Pulu Zırhı | ZK#15 |
| 7 | `barkweave-breastplate` | Ağaç Kabuğu Göğüslüğü | ZK#16 |
| 8 | `sparkmesh-chain-shirt` | Kıvılcım Yeleği | ZK#17 |
| 9 | `sunburst-breastplate` | Işık Dalgalı Göğüslük | ZK#19 |
| 10 | `slipstream-chain-shirt` | Sıyrılan Zincir Gömlek | ZK#20 |
| 11 | `briarwander-hide` | Çalılık Gezgini Zırhı | ZK#21 |
| 12 | `silentblade-scale` | Sessiz Bıçak Zırhı | KY#43 |
| 13 | `ravenwing-leather` | Kuzgun Kanadı Derisi | ZK#1 |
| 14 | `mossmantle-armor` | Yosun Örtüsü Zırhı | ZK#2 |
| 15 | `sporewarden-leather` | Spor Bekçisi Derisi | ZK#4 |
| 16 | `crimson-stalker-leather` | Kızıl Suikastçı Derisi | ZK#5 |

### 7.11 `katalog-zirh-03.jpg` — Zırh 3: hafif zırhlar, ceketler ve cübbeler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Light armored coat covered in overlapping glossy black raven feathers, held by leather straps.
2. Long battle-mage coat of dark blue leather with brass buttons engraved with abstract runes and reinforced shoulders.
3. Druidic hide armor of pale silvery moon-colored fur with crescent-moon motifs.
4. Leather armor dyed deep dusk blue fading into grey, with subtle star-shaped stitching.
5. Light armor woven from shimmering white-grey spider silk with a faint web pattern.
6. Flamboyant naval captain's long coat in deep red with gold trims, brass buttons and wide cuffs.
7. Embroidered bard's jerkin in teal and gold with lute and musical-note embroidery.
8. Reinforced studded leather armor in scarlet red with forest-green trim, for scouts.
9. Thin pale white hooded robe for death-watch vigils with soft silver trim and a faint warm light.
10. Ivory robe interlaced with glowing golden threads woven into knot patterns, with a high collar.
11. Shiny robe of rich deep blue silk with gold embroidery and a sparkling sheen.
12. Heavy layered silk robe in calm dark teal with a meditation-circle emblem on the chest.
13. Sleeveless monk vest in saffron orange with white embroidered spirit-swirl patterns.
14. Flowing sea-silk robe in ocean blue-green with wave patterns and small water droplets.
15. Short light acrobat's tunic in tan with black stripes and a small cat-face emblem.
16. Alchemist's robe of dark green waxed cloth with yellow-green trims and small glass vials hanging from the belt.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `raptor-feather-coat` | Yırtıcı Tüy Pelerini Zırhı | KY#41 |
| 2 | `spellblade-coat` | Savaş Büyücüsü Cübbe Zırhı | KY#52 |
| 3 | `moonshift-hide` | Ay Biçimi Derisi | ZK#3 |
| 4 | `twilight-leather` | Alacakaranlık Derisi | ZK#6 |
| 5 | `spidersilk-armor` | Örümcek İpeği Zırhı | ZK#7 |
| 6 | `corsair-captains-coat` | Korsan Kaptanı Ceketi | ZK#8 |
| 7 | `minstrels-favor-jerkin` | Ozanın İyilik Ceketi | ZK#9 |
| 8 | `scarlet-scout-leather` | Kızıl İzci Derisi | ZK#10 |
| 9 | `vigil-shroud-robe` | Şifa Örtüsü Cübbesi | KY#50 |
| 10 | `weavewoven-robe` | Örgü Dokuması Cübbe | ZK#32 |
| 11 | `resonant-caster-robe` | Karizmatik Büyücü Cübbesi | ZK#33 |
| 12 | `robe-of-supreme-focus` | Üstün Odak Cübbesi | ZK#34 |
| 13 | `soulmender-monk-vest` | Ruh Yenileyen Keşiş Yeleği | ZK#35 |
| 14 | `tidecaller-robe` | Dalga Anası Cübbesi | ZK#36 |
| 15 | `nimble-cat-tunic` | Atik Kedi Tuniği | ZK#37 |
| 16 | `venomweaver-robe` | Zehirci Cübbesi | ZK#38 |

### 7.12 `katalog-zirh-04.jpg` — Zırh 4: kalkanlar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 12 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 12 cells get an object; cells 13–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Steel kite shield with a long sword-like spike blade protruding from its pointed bottom and a sharp center boss.
2. Large tall shield whose whole face is a polished gold mirror, with an ornate rim set with small blue gems.
3. Heavy iron greatshield with a short cannon barrel built into its center like a single eye, rivets and a smoking muzzle.
4. Heavy shield with a large embossed face of a fiery giant's mask, glowing orange-red eyes and mouth, flames licking its edges.
5. Huge rectangular shield like a slab of ancient weathered stone carved with reliefs, studded with steel barbs and spikes.
6. Tall tower shield shaped like a miniature fortress gate with a crenellated top edge, stone-grey steel, a small portcullis relief and a soft blue ward glow.
7. Knight's heater shield with a mirror-polished steel face and a sloped ridge down the middle, a few bent arrows glancing off it with blue sparks.
8. Dark iron shield with an embossed horned dread-mask face with hollow eye sockets and drifting dark smoke.
9. Round carved bronze shield with a sun-disc and radiating ray pattern, faint golden glow.
10. Iron heater shield with grill-like slits through which orange flames rise from within, soot-blackened rim.
11. Long oval shield draped in dark grey shadow that drifts off its edges like smoke.
12. Round wooden shield woven from living roots and branches with green leaves and thorny briar vines around the rim.
13–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `piercing-knight-shield` | Delici Şövalye Kalkanı | KY#36 |
| 2 | `spellmirror-greatshield` | Büyü Yansıtan Büyük Kalkan | KY#37 |
| 3 | `one-eyed-mortar-shield` | Tek Gözlü Topçu Kalkanı | KY#38 |
| 4 | `flamevisage-greatshield` | Alev Yüzlü Kalkan | KY#39 |
| 5 | `barbed-monolith-shield` | Dikenli Parmak İzi Kalkanı | KY#40 |
| 6 | `walking-bastion-shield` | Yürüyen Hisar Kalkanı | ZK#39 |
| 7 | `deflector-knight-shield` | Saptıran Şövalye Kalkanı | ZK#40 |
| 8 | `dreadwall-shield` | Korku Kalkanı | ZK#41 |
| 9 | `sunward-shield` | Güneş Siperi Kalkanı | ZK#42 |
| 10 | `cinderback-shield` | Kor Karşılığı Kalkanı | ZK#43 |
| 11 | `shadecloak-greatshield` | Gölge Örtüsü Kalkanı | ZK#44 |
| 12 | `briarvine-shield` | Dikenli Asma Kalkanı | ZK#45 |

### 7.13 `katalog-giyilebilir-01.jpg` — Giyilebilir 1: miğfer, taç, maske ve şapka

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Heavy wizard's crown carved from pale grey stone, set with a central glowing blue star-shaped gem.
2. Face mask of liquid silver with a smooth flowing surface and a single silver teardrop under one eye.
3. War medic's pale porcelain half-mask with thin red crack lines and a small red drop on the cheek.
4. Crown woven from living underground mushrooms in tan and orange-brown, with softly glowing pale mushroom caps.
5. Wide-brimmed white winter witch hat with a fur band, frost on the brim and small snowflakes.
6. War helm covered in overlapping gold dragon scales, with a dragon-snout visor and two small swept-back horns.
7. Battle-mage steel helm engraved with abstract runes, with a blue gem set in the brow.
8. Thin silver circlet with a pure blue focus stone at the front.
9. Hunter's helm shaped like a raptor bird's head with a hooked beak visor and feather crest.
10. Horned dark iron circlet with red cloth wraps around the band.
11. Wide-brimmed storm-grey hat with a yellow lightning-bolt-shaped feather in its band.
12. Copper diadem with a tiny crossed-swords motif at the front and a small glowing spark gem.
13. Healer's circlet wrapped in gold wire with a pale warm sunrise-orange gem at the front.
14. Thick padded steel war helm with a reinforced brow ridge and cheek guards.
15. Light copper circlet engraved with abstract runes and a small yellow spark at the front.
16. Light brown leather runner's cap with small wing-shaped patches over the ears.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `starstone-crown` | Yıldız Taşı Tacı | KY#45 |
| 2 | `silvertear-mask` | Gümüş Damla Maskesi | KY#46 |
| 3 | `pale-blood-mask` | Soluk Kan Maskesi | KY#47 |
| 4 | `fungal-crown` | Mantar Taç Başlığı | KY#48 |
| 5 | `snow-witch-hat` | Kar Cadısı Şapkası | KY#54 |
| 6 | `vigilant-drake-helm` | Gözcü Ejderha Miğferi | GY#1 |
| 7 | `focus-surge-helm` | Odak Kıvılcımı Miğferi | GY#2 |
| 8 | `weavebound-circlet` | Örgü Tacı | GY#4 |
| 9 | `apex-stalker-helm` | Yırtıcı Miğfer | GY#6 |
| 10 | `crimson-fury-circlet` | Kızıl Hiddet Tacı | GY#7 |
| 11 | `stormsong-hat` | Gök Gürültüsü Şapkası | GY#8 |
| 12 | `diadem-of-spellstrike` | Kutsama Tacı | GY#9 |
| 13 | `dawnmender-circlet` | Göksel Şifa Çemberi | GY#10 |
| 14 | `mindshield-helm` | Düşünce Siperi Miğferi | GY#11 |
| 15 | `sparkcrest-circlet` | Kıvılcım Çemberi | GY#13 |
| 16 | `quickwit-cowl` | Hızlı Akıl Başlığı | GY#12 |

### 7.14 `katalog-giyilebilir-02.jpg` — Giyilebilir 2: başlıklar ve pelerinler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 13 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 13 cells get an object; cells 14–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Dark charcoal hooded cowl with a deep shadowed opening and a short shoulder cape.
2. Fire mage's deep red hood embroidered with orange flame patterns.
3. Long black cloak with a high collar, its lower edge dissolving into wisps of dark shadow smoke.
4. Heavy deep blue silk cloak whose folds shimmer with faint swirling magic-absorbing patterns.
5. Wide storm-grey cloak whose edges are made of wind-blown feathers.
6. Thick leather cloak with bulging yellow-green acid gland sacs along the hem, dripping acid.
7. Dark blood-red velvet ambush mantle with a deep hood.
8. Thick wool cloak covered in white frost rime with a cold icy mist.
9. Cloak with an ember moth-wing pattern in orange and black, small glowing embers along the edge.
10. Cloak of taut drum-hide leather with drumhead ring patterns and a thick braided cord clasp.
11. Damp green-grey cloak threaded with moss fibers, steam gently rising from it.
12. Light tan messenger cloak with a swept, wind-blown hem and a small running-boot clasp.
13. Healer's short shoulder mantle in pale green with small herb pouches and dried herb bundles.
14–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `shadowtracker-hood` | Gölge İzci Başlığı | GY#3 |
| 2 | `embercrown-hood` | Alev Yutan Başlık | GY#5 |
| 3 | `shadowstep-cloak` | Gölge Yürüyüşü Pelerini | GY#14 |
| 4 | `weavefold-cloak` | Örgü Kıvrımı Pelerini | GY#15 |
| 5 | `stormwing-cloak` | Kuzgun Kanadı Pelerini | GY#16 |
| 6 | `fleshrender-cloak` | Asit Püskürten Pelerin | GY#17 |
| 7 | `shadeblood-mantle` | Kanlı Gölge Örtüsü | GY#18 |
| 8 | `frostmist-cloak` | Buzul Sis Pelerini | GY#19 |
| 9 | `cindermoth-cloak` | Kül Güvesi Pelerini | GY#20 |
| 10 | `thunderskin-cloak` | Gök Gürültüsü Örtüsü | GY#21 |
| 11 | `steamshell-cloak` | Buhar Perdesi Pelerini | GY#22 |
| 12 | `trailblazer-cloak` | İvme Pelerini | GY#23 |
| 13 | `menders-mantle` | Şifacı Omuz Örtüsü | GY#24 |

### 7.15 `katalog-giyilebilir-03.jpg` — Giyilebilir 3: eldivenler ve bileklikler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 13 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 13 cells get an object; cells 14–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Pair of fingerless martial-arts gauntlets with white jade knuckle beads and a small glowing pale-teal spirit-wisp orb on the back of each hand.
2. Pair of tactical leather gloves embroidered with compass-rose direction marks on the backs.
3. Pair of thin, elegant silk wizard gloves in pale blue with fine silver stitching.
4. Pair of armored steel bracers for front-line spellcasters with a small blue focus gem set in each.
5. Pair of leather gloves stitched with storm patterns, faint blue-white thunder ripples around them.
6. Pair of throwing gloves with grippy padded fingertips and crossed leather straps.
7. Pair of gauntlets plated in bright sun-silver that glow with warm white-gold light.
8. Pair of perfectly balanced brown leather fighting gloves with matching brass knuckle plates on both hands.
9. Pair of frosted gloves with icy claw-like fingertips and an icy cyan glow.
10. Pair of white temple healer's gloves with protective padded steel cuffs and a small gold holy symbol.
11. Pair of thick alchemist's gloves stained with dripping yellow-green acid.
12. Pair of thin silk gloves woven with fine silver thread, sleek and shiny.
13. Pair of brawler's gloves with copper knuckle plates and tiny yellow sparks jumping across them.
14–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `soulcatcher-gauntlets` | Ruh Yakalayan Eldiven | GY#25 |
| 2 | `compass-gloves` | Pusula Eldiveni | GY#26 |
| 3 | `spellquick-gloves` | Hızlı Büyü Eldiveni | GY#28 |
| 4 | `daredevil-bracers` | Büyülü Hedef Eldiveni | GY#29 |
| 5 | `skythunder-gloves` | Yankı Göğü Eldiveni | GY#30 |
| 6 | `slingmaster-gloves` | Fırlatma Ustası Eldiveni | GY#31 |
| 7 | `luminous-gauntlets` | Işıltı Saçan Eldiven | GY#32 |
| 8 | `twinhand-gloves` | İki El Dengesi Eldiveni | GY#33 |
| 9 | `winterclaw-gloves` | Kış Pençesi Eldiveni | GY#34 |
| 10 | `warding-healer-gloves` | Şifacı Zırh Eldiveni | GY#35 |
| 11 | `ichorous-gloves` | Asit İzi Eldiveni | GY#36 |
| 12 | `dexterous-silk-gloves` | Büyülü Çeviklik Eldiveni | GY#37 |
| 13 | `sparkhand-gloves` | Kıvılcım Eldiveni | GY#38 |

### 7.16 `katalog-giyilebilir-04.jpg` — Giyilebilir 4: çizmeler ve sandaletler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 11 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 11 cells get an object; cells 12–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Pair of heavy marching boots with very thick soles and iron toe caps.
2. Pair of glacier boots with spiked iron cleats on the soles and frosted fur cuffs.
3. Pair of heavy jumping boots with red-hot glowing soles and small flames.
4. Pair of assault boots with mechanical heel locks and clasps, sleek dark leather.
5. Pair of boots with trembling layered soles and faint concentric sound rings below them.
6. Pair of spellcaster boots weighted with grey lead plates at the heels and ankles.
7. Pair of boots with springy coiled-spring soles.
8. Pair of copper-soled sandals with leather straps, small ripples of water beneath them.
9. Pair of light cloth sandals for monks with simple wraps.
10. Pair of light leather boots with crackling yellow static sparks around them.
11. Pair of wide-soled waterproof swamp boots, tall and slick.
12–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `boots-of-unyielding` | Sarsılmaz İnat Çizmeleri | GY#40 |
| 2 | `frostspike-boots` | Buz Çivili Avcı Çizmeleri | GY#41 |
| 3 | `skyvault-boots` | Gök Sıçrayışı Çizmeleri | GY#42 |
| 4 | `rushstrike-boots` | Süratli Akın Çizmeleri | GY#43 |
| 5 | `stormstep-boots` | Yankı Adımı Çizmeleri | GY#44 |
| 6 | `steadyfocus-boots` | Büyü Dengesi Çizmeleri | GY#45 |
| 7 | `springvault-boots` | Zıplama Yayı Çizmeleri | GY#46 |
| 8 | `waterskipper-sandals` | Suda Yürüyen Sandalet | GY#47 |
| 9 | `windstep-sandals` | Keşişin Hızlı Sandaletleri | GY#48 |
| 10 | `sparkstride-boots` | Kıvılcım Çizmeleri | GY#49 |
| 11 | `mirestrider-boots` | Bataklık Geçidi Çizmeleri | GY#50 |

### 7.17 `katalog-yuzuk-01.jpg` — Yüzük, tılsım, mühür 1: yüzükler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 15 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 15 cells get an object; cells 16–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Polished black ring set with a dark smoky stone that has a tiny white spark inside.
2. Heavy black-iron signet ring with a square ruby set flush into its face and a tiny engraved crown.
3. Gold ring whose setting holds a tiny ivory six-sided die.
4. Gold ring set with a radiant yellow sun crystal surrounded by a small halo of light rays.
5. Silver ring inlaid with an icy blue glacier sapphire, frost on the band.
6. Two interlinked bands, one steel and one copper, fused into a single double ring.
7. Dark ring with a glossy black obsidian stone shaped like an eye.
8. Gold priest's ring with engraved prayer lines (abstract marks) and a small white pearl.
9. Ring of grounded copper wire wrapped around a clear glass stone.
10. Plain light iron ring with a small throwing-axe emblem.
11. Battle-mage ring surrounded by five tiny gems: red, blue, yellow, green and white.
12. Alchemist's ring carved with green thorns, a small green poison drop gem.
13. Simple silver ring with a tiny lockpick and key motif.
14. Ring made of twisted living tree root with a small green bud.
15. Ring with a cracked clear quartz stone and faint sound-ripple lines.
16–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `shadowspark-ring` | Gölge Kıvılcımı Yüzüğü | YT#1 |
| 2 | `high-command-ring` | Yüksek Emir Yüzüğü | YT#2 |
| 3 | `gamblers-edge-ring` | Riskli Zar Yüzüğü | YT#3 |
| 4 | `dazzling-halo-ring` | Körleştiren Işık Yüzüğü | YT#4 |
| 5 | `snowburst-ring` | Ayaz Halka Yüzüğü | YT#5 |
| 6 | `spellstrike-ring` | Örgü Ahengi Yüzüğü | YT#8 |
| 7 | `eversight-shadow-ring` | Gölge Yürüyen Yüzüğü | YT#9 |
| 8 | `whispering-promise-ring` | Kutsanmış Şifa Yüzüğü | YT#10 |
| 9 | `sparkswall-ring` | Kıvılcım Halkası | YT#11 |
| 10 | `flinging-ring` | Kurnaz Fırlatış Yüzüğü | YT#12 |
| 11 | `elemental-infusion-ring` | Kül Ezgisi Yüzüğü | YT#14 |
| 12 | `venomthorn-ring` | Zehirli Diken Yüzüğü | YT#15 |
| 13 | `locksmiths-ring` | Tuzakçının Kilit Yüzüğü | YT#16 |
| 14 | `rootgrip-ring` | Çiftçi Kökü Yüzüğü | YT#17 |
| 15 | `fracture-ring` | Sarsıntı Kırığı Yüzüğü | YT#18 |

### 7.18 `katalog-yuzuk-02.jpg` — Yüzük, tılsım, mühür 2: tılsım, kolye ve muskalar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 15 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 15 cells get an object; cells 16–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Ruby amulet veined with gold, hanging on a gold chain, warm red glow.
2. Crystal pendant on a silver chain with a pure arcane blue spark trapped inside.
3. Small emerald phoenix idol rising from ashes, hanging on a dark chain.
4. Gold medallion stamped with a divine sun seal on a gold chain.
5. Wizard pendant with a twin knot of two sapphires on a silver chain.
6. Thin silver pendant shaped like a surgical needle with fine nerve-like silver lines.
7. Protective amulet of woven fey silver filigree around a pale green moonstone.
8. Tactical amulet bearing a glowing red-hot iron branding seal on a leather cord.
9. Alchemical pendant inlaid with a curved snake fang and a green venom drop.
10. Focus pendant with a cage holding four tiny swirling elemental motes (fire, ice, lightning, acid).
11. Pendant with a smooth calm grey-blue meditation stone on a cord.
12. Silver locket-capsule pendant with silver mist leaking from it.
13. Survival charm shaped like a raven's claw on a cord with a few black feathers.
14. Round field medic's silver locket with a white cross-shaped embossing and a silver needle and thread wrapped around it.
15. Battle talisman carved from black volcanic glass with a glowing orange heart inside.
16–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `lifespring-amulet` | Yaşam Kaynağı Tılsımı | YT#19 |
| 2 | `spellwell-amulet` | Yedek Yuva Kolyesi | YT#20 |
| 3 | `rebirth-idol-amulet` | Yeniden Doğuş Tılsımı | YT#21 |
| 4 | `devouts-medallion` | Adanmışlık Tılsımı | YT#22 |
| 5 | `spellspark-pendant` | Kıvılcım Düğümü Kolyesi | YT#23 |
| 6 | `subjugation-pendant` | Cerrahi Felç Kolyesi | YT#24 |
| 7 | `feyward-amulet` | Peri Duruşu Tılsımı | YT#25 |
| 8 | `brandbreaker-amulet` | Damgalayan Tılsım | YT#26 |
| 9 | `venomkiss-pendant` | Zehirli İntikam Kolyesi | YT#27 |
| 10 | `torment-conduit-amulet` | Element Kurbanı Kolyesi | YT#28 |
| 11 | `clearmind-pendant` | Berrak Zihin Kolyesi | YT#29 |
| 12 | `miststep-pendant` | Sis Adımı Kolyesi | YT#30 |
| 13 | `dreadwing-charm` | Karanlık Kanat Muskası | YT#31 |
| 14 | `silverthread-locket` | Gümüş İğne Muskası | YT#32 |
| 15 | `emberheart-talisman` | Kızgın Yürek Tılsımı | YT#33 |

### 7.19 `katalog-yuzuk-03.jpg` — Yüzük, tılsım, mühür 3: mühür taşları ve zanaat eklentileri

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 7 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 7 cells get an object; cells 8–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Faceted sigil stone gem in a small silver seal-shaped setting, the gem drawn in one bright saturated fire-red hue (single color, to be recolored per element later) with a glowing elemental core.
2. Sigil stone of polished pure steel with a sharpened faceted iron core, gleaming metallic grey.
3. Larger essence sigil stone: an elongated faceted crystal in an ornate gold setting, drawn in one bright saturated warm golden-white hue (single color, to be recolored per element later) with a glowing core.
4. Sphere of pure swirling cyan-white energy held in a gold clawed setting, legendary radiance.
5. Gold-inlaid empty gem mounting frame with an ornate setting and clasps.
6. Carved pure silver gem mounting frame with an ornate open setting.
7. Ancient weathered stone relic with glowing blue engraved patterns, a one-use imbuement charm.
8–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `ember-sigil-stone` | Kor Mühür Taşı / Kırağı Mühür Taşı / Fırtına Mühür Taşı / Kaya Mühür Taşı / Zehir Mühür Taşı | YT#34, YT#35, YT#36, YT#37, YT#38 |
| 2 | `masterwork-sigil-stone` | Usta Çelik Mühür Taşı | YT#39 |
| 3 | `umbral-sigil-stone` | Gölge Özü Mühür Taşı / Işıltı Özü Mühür Taşı | YT#40, YT#41 |
| 4 | `aether-core-stone` | Öz Çekirdeği Taşı | YT#42 |
| 5 | `mounting-of-power` | Güç Çerçevesi | YT#43 |
| 6 | `mystical-mounting` | Mistik Çerçeve | YT#44 |
| 7 | `ancient-imbuement-relic` | Kadim Efsun Kalıntısı | YT#45 |

### 7.20 `katalog-tuketilebilir-01.jpg` — Tüketilebilir 1: bombalar, küreler ve kaplamalar

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Small alchemical sphere of dark brass with a swirling vortex of dark blue gravity in a glass window.
2. Corked glass flask filled with sparkling yellow-white electric dust.
3. Glass sphere filled with swirling icy cyan liquid frost.
4. Small capsule of white paper and brass filled with bright magnesium light powder, glowing at the seams.
5. Sticky pouch of white spider silk bundled tight, with webbing strands.
6. Iron bomb studded with protruding steel nails and a lit fuse.
7. Heavy shock sphere with a stone core and iron bands, faint shock rings.
8. Brass censer bomb leaking dark grey nightmare smoke.
9. Bulbous fungal spore pod in orange and tan with puffs of golden spores.
10. Hard-cored pressurized metal canister for sieges, with rivets and a valve.
11. Glass vial filled with deep red rose petals and golden fairy dust.
12. Large cluster bomb of six linked black powder spheres with fuses.
13. Small glass vial of clear, glistening balancing oil with a cork stopper.
14. Clay jar of volatile orange fire resin with a bubbling surface.
15. Small vial of dark navy-blue spell-poisoning extract with a skull-shaped stopper.
16. Heavy flask of sulfur and phosphorus mixture, yellow-orange, smoking slightly.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `sinkhole-orb` | Çöküntü Küresi | TK#1 |
| 2 | `sparkburst-flask` | Sıçrayan Kıvılcım Şişesi | TK#2 |
| 3 | `rimeburst-orb` | Kırağı Küresi | TK#3 |
| 4 | `flashblind-capsule` | Körleştiren Flaş Kapsülü | TK#4 |
| 5 | `websac-bomb` | Ağ Kesesi Bombası | TK#5 |
| 6 | `shrapnel-nailbomb` | Gök Gürültüsü Çivisi | TK#6 |
| 7 | `tremor-sphere` | Sarsıntı Küresi | TK#7 |
| 8 | `dreadcenser-bomb` | Korku Buhuru Bombası | TK#8 |
| 9 | `haste-spore-pod` | Hızlandıran Spor Kesesi | TK#9 |
| 10 | `armor-piercing-canister` | Zırh Delen Şarapnel | TK#10 |
| 11 | `enthralling-mist-vial` | Aşk Tozu Şişesi | TK#11 |
| 12 | `cinder-cluster-bomb` | Kül Salkım Bombası | TK#12 |
| 13 | `oil-of-precision` | Keskin Nişan Yağı | TK#25 |
| 14 | `oil-of-combustion` | Yanıcı Reçine Yağı | TK#26 |
| 15 | `magebane-venom` | Büyü Bozan Zehir | TK#27 |
| 16 | `arsonists-tincture` | Kundakçı Yağı | TK#28 |

### 7.21 `katalog-tuketilebilir-02.jpg` — Tüketilebilir 2: özel oklar ve çay

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 13 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 13 cells get an object; cells 14–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Arrow with a small water-filled bladder tied at its tip, blue water sloshing inside.
2. Arrow with a capsule of hot water and lime at its tip, steam curling from it.
3. Arrow with a frozen icy blue tip and frost on the shaft.
4. Arrow with a hollow whistling flared tip and faint sound rings.
5. Arrow with a black bone tip and a dark grey smoky aura.
6. Arrow wrapped in copper wire with yellow lightning arcing at the tip.
7. Arrow whose head splits into three glowing pale-blue magical prongs.
8. Arrow with a glowing pale-blue spiral portal ring around its shaft.
9. Arrow with a silver-and-lead alloy tip engraved with anti-magic marks.
10. Hunting arrow with a heavy blunt iron knob head.
11. Arrow with a fragile glass capsule of holy water at its tip and a soft golden glow.
12. Black arrow branded with dark marks, wisps of shadow trailing behind.
13. Small porcelain teacup with a saucer filled with bright emerald-green tea and a few floating leaves.
14–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `watersplash-arrow` | Su Balonu Oku | TK#13 |
| 2 | `steamveil-arrow` | Buhar Bulutu Oku | TK#14 |
| 3 | `hoarfrost-arrow` | Kırağı Oku | TK#15 |
| 4 | `roaring-knockback-arrow` | Gürleyen İtme Oku | TK#16 |
| 5 | `blightbone-arrow` | Şifa Kesen Ok | TK#17 |
| 6 | `arcing-bolt-arrow` | Sıçrayan Yıldırım Oku | TK#18 |
| 7 | `splitflight-arrow` | Çoklu Hedef Oku | TK#19 |
| 8 | `transposition-arrow` | Işınlanma Oku | TK#20 |
| 9 | `spellsever-arrow` | Büyü Kıran Ok | TK#21 |
| 10 | `knockdown-blunt-arrow` | Deviren Küt Ok | TK#22 |
| 11 | `blessed-mending-arrow` | Kutsanmış Şifa Oku | TK#23 |
| 12 | `shadowpierce-arrow` | Örtü Aşan Gölge Oku | TK#24 |
| 13 | `emerald-tea-brew` | Zümrüt Çay Demlemesi | TK#45 |

### 7.22 `katalog-tuketilebilir-03.jpg` — Tüketilebilir 3: zehirler, iksirler ve eliksirler

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Small flask of glistening icy blue crystal oil with frost on the glass.
2. Small vial of dark root extract with a gnarled root stopper.
3. Small vial of dark navy-blue sleep poison distilled from mushrooms.
4. Small vial of thick yellow paralytic secretion with a cave-lizard emblem.
5. Legendary vial of glowing crimson worm toxin with a fang-shaped stopper.
6. Thick round potion bottle of dense grey-green stone-moss potion with a stone stopper.
7. Potion bottle of blue protective potion brewed with whisper herbs, small leaves floating.
8. Slim potion vial of mercury-clear silvery reflex potion.
9. Heavy squat bottle of thick earthy brown stone-skin potion.
10. Potion bottle of glowing golden liquid with a small golden fire flower inside.
11. Potion bottle of pale silver liquid with a silver feather floating in it.
12. Elixir bottle of dark red liquid with a wolf fang tied to its neck.
13. Elixir bottle of sharp amber spicy liquid with a small eye emblem.
14. Elixir bottle of dark shadow-root distillate, black liquid with a faint teal shimmer.
15. Elixir bottle of glowing blue arcane liquid with a small eye-shaped glass stopper.
16. Elixir bottle of clear liquid with floating green herb leaves.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `hoarfrost-coating` | Ayaz Kaplama Yağı | TK#29 |
| 2 | `oil-of-hexing` | Lanet Yağı | TK#30 |
| 3 | `drowsleep-venom` | Uyku Özü Zehri | TK#31 |
| 4 | `crawler-paralytic` | Sürüngen Felç Salgısı | TK#32 |
| 5 | `crimson-wyrm-toxin` | Kızıl Solucan Zehri | TK#33 |
| 6 | `ironhide-armour-potion` | Fiziksel Zırh İksiri | TK#34 |
| 7 | `spellward-armour-potion` | Büyü Zırhı İksiri | TK#35 |
| 8 | `nimble-tumble-potion` | Çevik Savuşturma İksiri | TK#36 |
| 9 | `stoneskin-draught` | Taş Deri İksiri | TK#37 |
| 10 | `strong-will-draught` | Sağlam İrade İksiri | TK#38 |
| 11 | `angelic-reprieve-potion` | Melek Uykusu İksiri | TK#39 |
| 12 | `elixir-of-bloodlust` | Kana Susamışlık Eliksiri | TK#40 |
| 13 | `elixir-of-vigilance` | Tetikte Olma Eliksiri | TK#41 |
| 14 | `elixir-of-viciousness` | Keskin Kritik Eliksiri | TK#42 |
| 15 | `elixir-of-battlemage-focus` | Savaş Büyücüsü Odak Eliksiri | TK#43 |
| 16 | `elixir-of-peerless-focus` | Eşsiz Odak Eliksiri | TK#44 |

### 7.23 `katalog-bekleyen-01.jpg` — Bekleyen (K7 adı bekleniyor)

> K7 adı seçilmeden üretme; ad seçilince tarifleri gözden geçir.

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 6 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 6 cells get an object; cells 7–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- A magical item may have a thin soft glow hugging its silhouette in the colour named in its description; keep the glow tight (no wide haze, no light rays reaching the cell edge).
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Massive heavy longbow of dark laminated wood and horn with thick limbs, a very thick braided pale sinew string, iron caps on the limb tips and a broad leather grip.
2. Pair of war gauntlets with blackened iron knuckle plates glowing orange from within like cooling forge metal, leather cuffs wrapped in brass wire.
3. Pair of tall soft charcoal suede boots with silver toe caps and a stitched star-map pattern, wisps of blue-grey shadow at the heels.
4. Thick bronze band holding a single emerald-green droplet-shaped gem in a claw setting, a bead of bright green acid on the band.
5. Hunter's ring of bone and gold with an amber cabochon glowing like a small lantern.
6. Focus ring with a smoky blue-grey quartz stone with a tiny pale-teal spark inside, on a dark silver band.
7–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | TR ad | Kaynak |
|---|---|---|---|
| 1 | `titanstring-longbow` | Dev Kirişli Yay | S1#40 |
| 2 | `helldusk-gauntlets` | Alevli Yumruk Eldiveni | GY#27 |
| 3 | `nightwalker-boots` | Karanlık Adım Çizmeleri | GY#39 |
| 4 | `caustic-band` | Yakıcı Asit Yüzüğü | YT#6 |
| 5 | `callous-glow-ring` | Işık Çağrısı Yüzüğü | YT#7 |
| 6 | `strange-conduit-ring` | Sıçrayan Akım Yüzüğü | YT#13 |
