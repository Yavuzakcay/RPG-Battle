# Kuyruk E4: efekt ek sayfaları ve salt okunur denetim

Yalnız görsel ve belge: kural, sayı, yapay zekâ, kural sürümü (64) ve kayıt sürümü değişmedi. Bu belge elle yazıldı; sayılar
`npm run buyu-efekt-tablosu` ve `npx vite-node scripts/e2-dogrula.ts` çıktısından.

> **Kuyruk E4b güncellemesi (2026-11-10):** aşağıdaki "eksik sayfa", "su kararı çizim yolu" (bölüm 4) ve "açık kalanlar" (bölüm 5, madde 1–2) maddeleri E4b'de kapandı: altı sayfa içe aktarıldı ve bağlandı, su dokusu su altıgenlerine bağlandı, zemin dokusu altıgen maskesi eklendi. Ayrıntı ve harita tablosu `DECISIONS.md` (Kuyruk E4b). Kalanlar: levitate, telekinesis, earthquake, silence, daylight, power-word-kill hücreleri; dünya haritası suyu.

## E5 sayımı (2026-11-10)

> Kuyruk E5: `rozet-efekt-13` (13 tek kareli efekt, prosedürel 5–6 kare) içe aktarıldı ve 13 rozet-only büyüye bağlandı (ayrıntı ve bağlama tablosu `DECISIONS.md` Kuyruk E5). E4c "kalan genel" tablosunun ilk satırı (13 büyü) kapandı.

**(a) Dosyalar:** `public/efekt` 111 → **124** (+13 şerit `efekt-rozet-*`); `public/sprites` 81, `public/efektler` 13, `public/kaynak` 24 aynı → toplam 229 → **242**. Animasyonlu şerit 133 → **146** (142 kullanımda; "kullanılmıyor" 4 aynı).

**(b) Farklı efekt anahtarı:** 110 → **123** (+13: `rozet-resistance`, `rozet-bane`, `rozet-command`, `rozet-hizli-gerilis`, `rozet-uzun-adim`, `rozet-ziplama`, `rozet-siginak`, `rozet-zayiflatma`, `rozet-orumcek`, `rozet-su-uzeri`, `rozet-olum-korumasi`, `rozet-dans`, `rozet-akici-dil`).

| Durum (savaşta 225) | E4c sonu | **E5 sonu** |
|---|---|---|
| hazır | 210 | **223** |
| genel | 15 | **2** |
| eksik | 0 | **0** |

**(c) Kalan "genel" 2 büyü:** delayed-blast-fireball (boncuk dokusu yok; patlaması `alan-ates`), wish (kopyalanan büyünün efekti; kendi görseli yok, davranış doğru).

## E4c sayımı (2026-11-10)

> Kuyruk E4c: `efekt-eksik` (5 şerit) ve `kaynak-ikonlari` (8 ikon) içe aktarıldı ve bağlandı. Bölüm 5 madde 1 ve 3 (kaynak ikonları, Silence/Daylight/Levitate/Telekinesis/Earthquake/Power Word Kill) kapandı. Ayrıntı `DECISIONS.md` (Kuyruk E4c).

**(a) Dosyalar** (kuyruk sonu; şerit = animasyonlu sprite sayfası, simge = arayüz simgesi):

| Klasör | Dosya | Şerit (gerçek animasyon) | Arayüz simgesi / ikon | Diğer |
|---|---|---|---|---|
| `public/efekt` | 111 | 79 (4 "kullanılmıyor": `duvar-bicak-hilal`, `isin-prizma-yatay`, `zemin-kuyu-yeni`, `zemin-su-eski`) | 32 (16 işaret simgesi `efekt-isaret-*`, 16 sayı oku `efekt-ok-*`) | — |
| `public/sprites` | 81 | 41 (E1 şeritleri `efekt-*`) | 15 durum ikonu (`efekt-ikon-*`) | 25 yüzey/nesne sprite'ı (`yuzey-*`, `nesne-*`) |
| `public/efektler` | 13 | 13 (5 hasar, 7 durum döngüsü, 1 engel; Görev V) | — | — |
| `public/kaynak` (yeni) | 24 | — | 8 kaynak ikonu × 3 boy (192, 96, 64 px) | — |
| **Toplam** | **229** | **133** animasyonlu şerit (129 kullanımda) | 55 simge/ikon (16 işaret + 16 sayı oku + 15 durum + 8 kaynak) | 25 yüzey/nesne |

**(b) Büyülerin kullandığı farklı efekt anahtarı** (savaşta 225 büyü, `BUYU-EFEKT-TABLOSU.md` anahtarlar sütunundan; `ton`/`<tür>` kalıpları sayılmadı): **105 → 110** farklı efekt anahtarı (E4b sonu → E4c sonu: +yukselen-toz, zemin-deprem-yarigi, zemin-sessizlik, zemin-gunisigi, durum-olum-sozu). Ayrı satırlar: yer tutucu (renkli altıgen) 1, CSS jeton filtresi 4, sayı oku rozeti 12, durum ikonu 1, ışık katmanı/kopya 4.

| Durum (savaşta 225) | E4 sonu | E4b sonu | **E4c sonu** |
|---|---|---|---|
| hazır | 199 | 204 | **210** |
| genel | 24 | 20 | **15** |
| eksik | 2 | 1 | **0** |

**(c) Kalan "genel" 15 büyü ve nedeni:**

| Büyü | Neden genel | Kodla çözülür mü |
|---|---|---|
| resistance, bane, command, expeditious-retreat, jump, longstrider, sanctuary, ray-of-enfeeblement, spider-climb, water-walk, death-ward, irresistible-dance, glibness (13) | Tek görsel: süren etkinin jetondaki sayı oku rozeti (`rozet:ok-*`); büyüye özel olay animasyonu yok (tablo tanımı: yalnız rozet = genel) | Evet, sayfa gerekmez: olay anında hedefte mevcut şerit (örn. `koruma-ruh`, `koruma-kutsama`) bağlanabilir; hangi büyüye hangi şerit kararı bekliyor |
| delayed-blast-fireball | Boncuk (zemin nesnesi) renkli altıgen yer tutucusu; patlaması `alan-ates` ile çizilir, boncuk dokusu yok | Kısmen: `alan-ates` boncuk yerine kullanılabilir (yaklaşık); özgün boncuk için yeni hücre |
| wish | Kopyalanan büyünün efekti (kendi görseli yok; kopya büyünün bağlaması çalışır, tablo "genel" sayar) | Gerekmez (davranış doğru); tablo ölçütü değişirse "hazır" |

## 0. Girdi durumu (önemli)

Görevde sayılan sayfaların **yalnız ikisi** depoda bulunabildi. `assets-ham/efekt/` içinde (wip/k73c ucunda) yeni sayfaların
hiçbiri yoktu; hiçbir uzak dalda da yoktu (`efekt-bicak`, `efekt-duvar-ek`, `efekt-su`, `efekt-prizma`, `efekt-yercekimi`,
`efekt-durum-ek`: adla tüm dallar tarandı). Eski boyalı sayfalardan `zemin-ek.jpg` ve `isin-ek.jpg` geçici dal `wip/e2-ham`'da duruyordu;
oradan `assets-ham/efekt/`'e alındı (görevin "eski" listesi). Eski `duvar-ek.jpg` kararınca hiç alınmadı.

| Sayfa | Durum |
|---|---|
| zemin-ek (eski, 6×4) | **içe aktarıldı**: 5 bağlı, su satırı "kullanılmıyor" |
| isin-ek (eski, 4×4) | **içe aktarıldı**: 4 şerit bağlı |
| efekt-bicak (Blade Barrier) | **YOK, atlandı** |
| efekt-duvar-ek (taş, diken, rüzgâr duvarı) | **YOK, atlandı** |
| efekt-su (SU-DALGA, SU-HAVUZ) | **YOK, atlandı** |
| efekt-prizma (prizma duvarı) | **YOK, atlandı** |
| efekt-yercekimi (ters yerçekimi) | **YOK, atlandı** |
| efekt-durum-ek (taşlaşma halkası) | **YOK, atlandı** |

Ek olarak: `wip/k73c`, E2/E3 işini içermiyordu (ham sayfalar vardı ama `efekt-kesim.json`'da kaydı, `efekt-baglama.json` büyü
tabloları ve `BUYU-EFEKT-TABLOSU.md` yoktu). Görev bunlara dayandığı için `origin/wip/e2` (E3 dahil) `wip/e4`'e birleştirildi
(çakışmalar: K73c `airHexes` + E2 `shape`/`aim` birlikte; `DECISIONS.md`).

## 1. İçe aktarılan sayfalar

| Sayfa | Izgara | Kesim | Şerit (kare) | Çıktı |
|---|---|---|---|---|
| zemin-ek | 6 satır × 4 | `karanlik`, kare 192 px, 180 ms/kare, döngü | zemin-yag, zemin-dikenli, zemin-sulu-kar, zemin-bocek, zemin-su-eski (kullanılmıyor), zemin-dokunac (hepsi 4) | `public/efekt/efekt-*.webp` |
| isin-ek | 4 satır × 4 (gri ızgara çizgisi var, otomatik oluk bulma yalnız 2 sütun buldu) | `esit`, kenardan 6 px, şerit 256 px, 90 ms/kare, döngü, yön sağ | isin-prizma (3; ilk kare yalnız çıkış kıvılcımı, döngüde titrediği için atıldı: yeni `kareBasla`), isin-kuvvet, isin-nekrotik, isin-asit (4) | `public/efekt/` |

Kesici eklemeleri (`scripts/efekt-sayfa.mjs`): `kareBasla` (satırın ilk N karesini atar), `kullanilmiyor` (kayıtta işaret).
Kontrol görselleri (iletişim kâğıdı) üretildi, depoya girilmedi. Eski şeritler bayt bayt aynı yeniden üretildi (`git status` yalnız yeni dosyalar).
Çıktı klasörü görevdeki `public/efekt/**` ile aynı (E2 kuralı); ham sayfalar değişmedi.

## 2. Büyü bağlamaları

| Büyü | Efekt | Yol |
|---|---|---|
| Grease | zemin-yag | `zemin` (alan dokusu; eski gres yüzeyinin üstüne biner, ikisi birlikte) |
| Spike Growth | zemin-dikenli | `zemin` (eski zemin-diken yerine; Entangle eskisini kullanmaya devam eder) |
| Sleet Storm | zemin-sulu-kar | `zemin` |
| Insect Plague | zemin-bocek | `zemin` |
| Black Tentacles | zemin-dokunac | `zemin` (eski zemin-girdap yerine) |
| Prismatic Spray | isin-prizma | `isin`: hedef başına bir ışın (özel yol hedefsiz `spell_cast` + hedef başına `map_effect "Prismatic Spray (Renk)"`; `fxPlan.spellRef`'e yalnız bu etiket eklendi) |
| Disintegrate | isin-kuvvet | `isin` (eski isin-isik + hue yerine) |
| Ray of Sickness | isin-nekrotik | `isin` (eski isin-isik + hue yerine) |
| Finger of Death | isin-nekrotik | `isin` (eski hedefte alan-nekrotik yerine) |
| Poison Spray | isin-asit | `isin` ("asit-zehir ışını"nı kimin kullanacağı belirtilmedi: zehir püskürtmesi seçildi; Acid Arrow uçan ok olarak kaldı) |
| (çizgi alan, tür) | acid/poison → isin-asit, necrotic → isin-nekrotik, force → isin-kuvvet | `B.isin` (daha önce bu türlerde çizgi alan hiçbir şey çizmiyordu) |

Doğrulama: her bağlama gerçek motorla dökülür (`src/ui/fx/e2Verify.ts`, `data/efekt-e2-dogrulama.json`): **138/138 efekt**
(134 → 138), 17/17 rozet. Testler `src/ui/fx/fxPlan.e4.test.ts`: kesim/dosya, her büyü için beklenen sprite çizimde, Prismatic Spray ışın sayısı,
durum ve `replay` değişmez. Blok karışımı: şeritler siyah zeminde parlaklıktan alfa (`screen`); su satırları olmadığı için normal karışım gerekmedi.
Hareketi azaltta ve efekt ayarı kapalıyken aynı bütçe kuralı (`allocate`) geçerli; aynı karede efekt tavanı değişmedi (ekran 12).
Kayıt/replay: motor olayına bu kuyrukta alan eklenmedi (E2'nin `spell_cast.area.shape/aim`'i dışında); `SAVE_VERSION` ve kural sürümü aynı.

Yapılmayanlar (sayfa yok): taş/diken/rüzgâr duvarı (Wall of Stone/Thorns/Wind Wall), Blade Barrier, Prismatic Wall, ters yerçekimi,
taşlaşma halkası (Flesh to Stone), su (SU-DALGA, SU-HAVUZ). Altıgen maskeli zemin dokusu da yapılmadı (aşağıda 5).

## 3. Aşama 3 denetimi

### (a) Kaynak ikonları

Arayüzde **hiçbir kaynağın ikonu yok**: kaynaklar yalnız metin ("Ad n"): savaş kartı `MapBattle.tsx` (`usableResources`), karakter listesi
`Screens.tsx`. Süren etkiler için sayı oku (`efekt-ok-*`, 16) ve işaret simgesi (`efekt-isaret-*`, 16) var; kaynak için yok.

`data/class-features.json` `resources` 65 kaynak + `data/imza.json` `kaynaklar` 29 imza kaynağı (+ ek paket `kaynak` ilkelleri `pk-<alt sınıf>-<id>`, bu kopyada paket yok).
İstenen ikon ailelerinin bugünkü karşılığı:

| İkon ihtiyacı | Kaynak anahtarları (ör.) | Arayüzde ikon | Elde kullanılabilir sprite | Dayanan özellikler |
|---|---|---|---|---|
| Ki / Odak | `focus`, `uncannyMetabolism`, `wholenessOfBody` | yok | yok | Monk (Focus, Flurry, Patient Defense, Step of the Wind, Stunning Strike), imza Sabır/Son Ders |
| İlham | `bardicInspiration`, imza `imzaUstaSair`, `imzaOlumsuzDize` | yok | `ok-zar-arti` (sayı oku, rozet) uyar ama kaynak değil | Bard (Bardic Inspiration, Superior Inspiration), Şair imzası |
| Üstünlük zarı (kaynaklı zar havuzu) | ek paket `zarHavuzu` + `kaynak` (`pk-*`); SRD'de yok | yok | yok | yalnız ek paket (P11 `zarHavuzu`, P12 `patlar`) |
| Kader d20 | `strokeOfLuck`, `darkOnesLuck`, imza `imzaFal`/`imzaYazgi` | yok | `isaret-d20` (hedef üstü işaret) | Rogue Stroke of Luck, Fiend Warlock Dark One's Own Luck, Astrolog imzası |
| Ruh kristali | ek paket kaynağı; SRD'de yok | yok | `isaret-kristal` (işaret) | yalnız ek paket |
| Büyü puanı | `sorceryPoints`, `innateSorcery`, `arcanum6-9` | yok (Sorcery Points'e özel düğme metni var) | yok | Sorcerer (Font of Magic, Metamagic), Warlock Mystic Arcanum |
| Şifa havuzu | `layOnHands`, `celestialHeal`, imza `imzaHavuz`, `imzaHukumdar` | yok | `ok-yenilenme`, `iyilestir-*` (olay efekti) | Paladin Lay On Hands, Celestial Şifa Eli, Birlik imzası |

Sonuç: kaynak ikonu için yeni görsel ve küçük bir arayüz kararı (kartta ikon + sayı) gerekiyor; mevcut işaret simgeleri (`d20`, `kristal`) yeniden kullanılabilir.
Bu kuyrukta değişiklik yok (öneri).

### (b) Silence küresi ve Daylight

İkisi de **bağlı değil**. Silence (`m.zone`, `silence: true`, renk #8a8fb8, simge 🔇) ve Daylight (`m.zone`, `light: 0`, renk #fff7d6, simge ☀)
yalnız genel `.spell-zone` yer tutucusunu (renkli altıgen + emoji) çizer; `zemin`, `auraBuyu`, `buyu` tablolarında yok. Daylight'ın ışığı
mekanikte var (`litHexes`, `hud.ts` ışık yarıçapı) ama görsel efekti yok. Eski E3 ailesi `zemin-kutu` (4 hücre) bu kuyrukta
zemin-ek ile sleet-storm ve insect-plague için kapandı; silence ve daylight kaldı (2 hücre, Gemini).

### (c) `BUYU-EFEKT-TABLOSU.md` bölüm 4 (Gemini bekleyenler)

Kuyruk öncesi (E2/E3 birleştirmesi sonrası): savaşta 225 büyü: **hazır 196, genel 26, eksik 3**; Gemini 5 sayfa / 12 hücre.
Kuyruk sonrası: **hazır 199, genel 24, eksik 2**; Gemini 5 sayfa / **9 hücre**:

| Sayfa | Hücre | Hücreler (büyüler) | Bu kuyruktaki sayfa karşılığı (gelirse) |
|---|---|---|---|
| efekt-yercekimi | 2 | ters yerçekimi yükselen toz sütunu (levitate, telekinesis, reverse-gravity); deprem yarığı zemin kutusu (earthquake) | `efekt-yercekimi` satır 2 ters yerçekimi: reverse-gravity (+levitate/telekinesis); **earthquake karşılanmaz** |
| efekt-zemin-kutu | 2 | sessizlik küresi (silence); gün ışığı küresi (daylight) | karşılanmaz |
| efekt-duvar-ek | 3 | taş duvar (wall-of-stone); bıçak bariyeri (blade-barrier); diken duvarı (wall-of-thorns) | `efekt-duvar-ek` taş, diken; `efekt-bicak` satır 1 (Blade Barrier) |
| efekt-durum-ek | 1 | ölüm sözü (power-word-kill) | **karşılanmaz** (kullanıcının efekt-durum-ek sayfası taşlaşma halkası, ölüm sözü değil) |
| efekt-prizma | 1 | prizma duvarı (prismatic-wall) | `efekt-prizma` satır 2 |

Yani sayfalar eksiksiz gelse bile hâlâ kapanmayacak hücreler: earthquake, silence, daylight, power-word-kill (4 hücre).
Kullanıcı sayfaları taşlaşma (Flesh to Stone `durum:restrained` genel) ve rüzgâr duvarı (Wind Wall şu an `duvar-kuvvet`) için de kullanacak.

### (d) Çizili duvar (`duvar-cizili`)

Kullanan: yalnız **Harita Öğretisi (wizard `imza_harita`) "Çizili Duvar"** (`src/battle/imzaHarita.ts`, K53 geçici engeli `data/engeller.json` `cizili-duvar`: 30 HP, AC 15,
hareket ve görüş keser, 10 tur) ve K53 `barrierEvents` (engel kimliği `barrier.kind`). `efekt-baglama.json` `duvar["cizili-duvar"] = "duvar-cizili"`
(+ ton #f2e3c4, kontur #1b140e). Hiçbir SRD büyüsü kullanmıyor.
Öneri (değişiklik yok): çizili duvar bir "çizilmiş taş/duvar" görünümü; yeni **taş duvar** (efekt-duvar-ek) gelince Wall of Stone ona bağlanır,
Çizili Duvar kendi görseliyle kalır (ev içeriği, kullanıcıya özgü). Taş duvar ile değiştirmek tutarlı ama özgün görseli (kontur + parşömen tonu) kaybettirir.

## 4. Su kararı için çıkarılan çizim yolu

Kullanıcı kararı: NEHİR ve KIYI → SU-DALGA; GÖL, VAHA, OKYANUS → SU-HAVUZ; büyülü su (Control Water, taşkın, hendek) → SU-HAVUZ.
Sayfa gelmediği için bağlanmadı. Çizim yolu (kodla çıkarıldı):

- **Savaş haritası**: nehir/göl/vaha/okyanus **haritanın arka plan resminde pişmiş** (`public/maps/<bölge>/...webp`). Arazi harfleri yalnız mantık:
  `w` derin su (`deepWater`), `n` sığ su/çamur, `b` derin batak, `R` coşkun nehir (geçilmez, varsayılan kapalı). Üstüne yalnız
  `src/map/effects.ts` hareketli efekt katmanı biner: `waveGlint` (`w` altıgenlerine), `waterSparkle` (`w`,`n`). 17 haritada `w`/`R` var
  (en çok: batak-adalar 132, orman-heykel-golu 111, orman-oduncu-kampi 87, hapishane-iskele 77, kasaba-lagim 47, batak-cukur 35, kale-onu 33,
  ada 29, batak-kale 22, col-kanyon-nehri 22, gemi 19, batak-kamp 15, kale-ic-avlu 14, col-vaha 12, ortamlar-diyari 6, orman-yolu 5, derinlikler-mantar-magarasi 5).
  Nehir (`col-kanyon-nehri`, orman nehirleri), kıyı (`ada`, `gemi`), göl (`orman-heykel-golu`), vaha (`col-vaha`) bu haritalarda.
- **Dünya haritası**: karolar tek baskılı görüntü (`public/maps/dunya/`); su yüzeyi dokusu yok, yalnız yüzme önizlemesinde (`WorldMapViewer`) yarı batık jeton ve halka dalgalar.
- Büyülü su: Control Water `utility`, alan yüzeyi yok (yalnız `terraform` modu); `place_surface` 'water' yüzeyi sprite-esleme'de (`yuzey-su`) var.

Plan (sayfa gelince): (1) `efekt-su` satır 1/2'yi `efekt-kesim.json`'a `klasor: efekt`, normal karışım (şerit kaydında `karisim: normal`, ~%60–65 opaklık; bugün kayıt
`screen` sabit okunuyor, `FxLayer` `blend` alanını kullanmıyor: küçük ekleme gerekir); (2) savaş haritasında `waveGlint`/`waterSparkle` efekt katmanına
altıgen maskeli (clip-path) iki tür: nehir/kıyı harfleri (`R` ve kıyıya komşu `w`) için DALGA, kıyıdan ≥ 3 uzak `w` ve vaha/göl haritaları (`orman-heykel-golu`, `col-vaha`) için HAVUZ;
(3) dünya haritasında yalnız yüzme önizlemesi; (4) Control Water ve taşkın (`flashFlood` yüzeyi) HAVUZ.

## 5. Açık kalanlar

1. Altı eksik sayfa (yukarı) ve içlerindeki bağlamalar: Wall of Stone/Thorns/Wind Wall, Prismatic Wall, Blade Barrier, Reverse Gravity (+Levitate/Telekinesis?), Flesh to Stone halkası, SU-DALGA/SU-HAVUZ.
2. "Zemin dokuları altıgene maskelenir": mevcut `FxGround` zemin dokusu alan merkezine büyük kare olarak çizilir (E2 yolu); altıgen kırpma uygulanmadı. Sayfalar zemin-ek'te (puddle, çalı, sulu kar, böcek, dokunaç) çok altıgenli büyük kareyle kabul edilebilir göründüğü için ayrı bırakıldı; maskeleme küçük ek iş (clip-path poligonu).
3. Grease: eski gres yüzeyi + yeni yağ dokusu üst üste (karar: eskisini kaldırmak sprite testlerini ve `surface:slick` tutarlılığını bozardı).
4. Kaynak ikonları (a) ve Silence/Daylight (b): yeni görsel + küçük arayüz kararı.
