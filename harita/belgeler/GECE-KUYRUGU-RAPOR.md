# Gece kuyruğu raporu (2026-11-21)

## Özet tablo

| Aşama | Durum | Kural sürümü | Commit |
|---|---|---|---|
| 1 Yaşam Manastırı kaldırma | durduruldu (önkoşul 77fe3e69 yok, `icerik/` bulutta yok); depo tarafını başka oturum yaptı (`47dab278`) | — | `86e86155` (rapor) |
| 2 Karar kalanları | tamam (5e ertelendi) | 101 (kayıt sürümü 25) | `01622902`, `6a603efa` |
| 3 SRD büyüleri | tamam (Storm of Vengeance aşamaları ertelendi) | 102 | `1ce61a14` |
| 4 Canavar + sınıf açıkları | tamam (yapışma/likantropi/boğulma ertelendi) | 103 | `cba977ab` |
| 5 SRD-KAPSAM ikinci çalışma | tamam | — | `ad6edc1e` |
| 6 Eksik taraması | tamam | — | `524ff83b` |
| 7 Son doğrulama | tamam | — | `c23bdcc4` |

Yedi aşamalı gece kuyruğunun ilerleme kaydı. Ortam: bulut oturumu (taze klon), dal `birlesik` (`origin/birlesik` f799e851'den).
Bu ortamda depo dışı içerik yok: `icerik/` (gitignore), `docs/sabah/`, `public/Subclass/`, `zar-kuru.txt` ve RPG-Battle-motor
worktree'si bulunmuyor; hiçbirine dokunulmadı.

## Aşama 1: Yaşam Manastırı kaldırma, Birlik Manastırı yönlendirmesi — DURDURULDU (önkoşul yok)

- Önkoşul denetimi: `git fetch origin` sonrası `77fe3e69` (ad işi) hiçbir uzak dalda ve nesne deposunda yok
  (`git cat-file -t 77fe3e69` → "Not a valid object name"; `origin/birlesik` başı f799e851). Talimat: "değilse dur ve raporla".
- Ayrıca işin ana dosyası `icerik/ek-cleric.json` gitignore'lu ve bu bulut kopyasında yok; `check:icerik`, `as2.test` sayımı,
  dd-gorsel üretimi, `icerik-liste.txt` ile `icerik/` eşlemesi burada doğrulanamaz.
- Yapılan: hiçbir dosya değişmedi. Sonraki aşamalar (2–7) Aşama 1'in çıktısına bağlı değil; zincir sürdü.
- Karar gerekli (A1-1): ad işi (77fe3e69) yerelde push'lanınca Aşama 1'in `icerik/` kısmı yerel checkout'ta çalıştırılmalı.
- **Güncelleme (17:21):** başka bir oturum (`47dab278`, session_01VVQfWxxvBbP8rsaSvgbJBz) depo tarafını yaptı ve `birlesik`'e
  birleşti: `alt-sinif-gorunum.json` `kaldirilan` + `yedekKimlik` (life-domain → `imza_birlik`), Cleric varsayılanı `imza_birlik`,
  `migrateSubclasses` bir kerelik bildirim, test sayıları (görünen 120 → 119), dd-gorsel yeniden üretimi. Bu oturum o işe dokunmadı.
- Hâlâ açık: `icerik/ek-cleric.json`'dan life-domain kaydının silinmesi (depo dışı), `check:icerik` 108 → 107 sayımı, ve
  "Bağlılık Yemini Büyüleri" → "Sadakat Töresi Büyüleri" adı: depoda yalnız fikstürde (`src/rules/fixtures/srd-alt-siniflar.json`,
  alt sınıf adı da "Bağlılık Yemini"); alt sınıf adı ad işinde (77fe3e69, uzakta yok) değiştiği için özellik adı tek başına
  değiştirilmedi (tutarsız kalırdı). Ad işi gelince birlikte yapılmalı.

## Aşama 2: Karar kalanları SRD'ye göre (kural sürümü 101) — TAMAM

- Tek sabit `src/battle/karar101Surum.ts` (`KARAR101_VERSION` 101), motor `src/battle/karar101.ts`, testler
  `src/battle/karar101.test.ts` (22 test; her madde 100 ↔ 101 + replay). Kayıt sürümü 24 → 25 (`shield_changed`,
  `knocked_out`, `stone_endurance`). Ayrıntı DECISIONS.md "Görev KARAR101".
- Yapılan: (1) sürünme + zorlu arazi 3 ft/ft; (2) Knocking Out (oyuncu seçim istemi, yapay zekâ bayıltmaz, bayıltılan yenilmiş
  sayılır, HP/ilk yardımla uyanır); (3) Dash eki Dash anındaki hızdan (çoklu hız SRD "subtract the distance already moved");
  (4) `nightVision` 101+ savaşta varsayılan açık (`acikSurum`); (5a) yakalama tutarken Two-Handed yok / Versatile tek elle +
  `release_grapple`; (5b) High Jump "immediately before" (`walkStreak`); (5c) Stone's Endurance her hasarda; (5d) kalkan tak/çıkar
  (`shield_toggle`, Utilize); (8) Ready doğrulandı (kod değişmedi; kısmi: yanıt listesi, yapay zekâ); (9) Dropping Prone (`drop_prone`).
- Dokunulmadı: (6) Nick ve başkasının altıgeninde tur sonu Prone (SRD belirsiz); (7) CLAUDE.md'de paket sınırı zaten 500 kB.
- Ertelendi, karar gerekli: (5e) eşyayı silaha bağlama (SRD tanımlı; karakter şeması + oluşturucu seçimi gerekir).
- Değişen eski testler: `ruleVersion.test.ts`, `g6.test.ts` (sürüm 100 → 101); `SAVE_VERSION` 24 → 25 (`statusFx`, `areaView`, `s1`,
  `g1`; `ready.test` ≥ 24); `night.test.ts` gece gizlenme testleri `nightVision: false` ile (101'de varsayılan açık: görmeyen gözcü
  hiç görmez; testin konusu gece gizlenme kuralı).
- İlgili test turu (`src/battle src/ui src/app src/rules`, 369 dosya): 4792 geçti, 1 düştü (`night.test.ts`, düzeltildi); build
  450,06 / 500 kB; `check:harita` 92/92 geçti; `check:ses` 15 kontrol, 0 hata (Chromium yolu `PW_CHROMIUM`).
- Commit: `01622902` (birleştirme `95298494`).
- Hızlı regresyon 100 ↔ 101 (100 tohum): Çöl %81/%81, Kale %36/%36, Mağara %85/%85, Orman %64/%64 (aynı; gece senaryoları
  ölçülmedi, `DENGE.md` "ölçülecek").

## Aşama 3: SRD büyüleri ve büyü etkileri (kural sürümü 102) — TAMAM (1 eksik ertelendi)

- 3a: `scripts/buyu-tam-tarama.ts` → `harita/belgeler/BUYU-TAM-TARAMA.md`: 339 büyü (cantrip–9) alan alan; sonuç (102): tam 214,
  kısmi (otomatik not, elle doğrulandı) 16, şüpheli 0, savaş dışı 109, eksik 0. İlk çalıştırmada şüpheli 34 (çoğu gösterim farkı /
  `applied` bayrağısız uygulanan yukarı slot); elle doğrulamada 5 gerçek fark + ölü veri alanı taramasında 2 hata + 1 eksik bulundu.
- 3b düzeltmeler (`b102` bloğu, tek sabit `src/battle/buyuTamSurum.ts`): Confusion yukarı slot yarıçapı; Etherealness (etki hiç
  Ethereal yapmıyordu) + yukarı slot hedefleri; Earthquake konsantrasyon bozma (veri alanı okunmuyordu); Conjure Elemental 10
  dakika; Mass Cure Wounds 30 ft küre. Testler `src/battle/buyuTam102.test.ts` (6 test grubu, 101 ↔ 102 + replay).
- Eksik, ertelendi: Storm of Vengeance 2–10. tur aşamaları (BUYU-TAM-TARAMA §4.1, öneriyle).
- Karar gerekli (BUYU-TAM-TARAMA §4): savaş dışı süreler, eşya büyüleri, Wish serbest dilek, maliyetli materyal.
- 3c: `scripts/buyu-efekt-eksik.mjs` → `harita/belgeler/BUYU-EFEKT-EKSIK.md`: büyüye özgü efekt bağlaması olmayan 78 büyü (süren 42).
- Değişen eski testler: `ruleVersion.test.ts`, `g6.test.ts` (101 → 102); E2/E4c görsel doğrulama düzeninde büyücünün DEX save'i
  (gerekçe DECISIONS BUYU-TAM), `data/efekt-e2-dogrulama.json` yeniden üretildi.
- Test turu (`src/battle src/ui src/app src/rules src/data`, 387 dosya): 4922 geçti, 3 düştü (E2/E4c Earthquake görsel doğrulaması,
  düzeltildi; `src/ui/fx` 115/115). Hızlı regresyon 101 ↔ 102 aynı (Çöl %81, Kale %36, Mağara %85, Orman %64). Build
  451,00 / 500 kB; `check:harita` 92/92; `check:ses` 15/0.

## Aşama 4: Canavar verisi + sınıf açıkları (kural sürümü 103) — TAMAM (saldırı ekleri ertelendi)

- Tek sabit `src/battle/kapsam103Surum.ts`, testler `src/battle/kapsam103.test.ts` (8 test; 102 ↔ 103). Ayrıntı DECISIONS.md
  "Görev KAPSAM103".
- Yapılan: (1) canavar inisiyatifi SRD stat bloğundan (330/330 değer PDF'ten `scripts/srd-canavar.mjs`; 110 canavarda DEX'ten farklı;
  `data/monsters.json` `initiative`, `srdPage`); (2) Adult/Ancient Gold Dragon Weakening Breath (aktarımdaki "Spellcasting" adlı saldırı;
  `srd-duzeltme.json` surum 103), Cloud Giant Misty Step, Sphinx of Lore/Valor Weight of Years; (4) Empowered Evocation yalnız Wizard
  büyüsü + INT, Reliable Talent kilit açmada, Gift of the Depths su soluma, Evocation Savant `maxBaseLevel` (oluşturucu, sürümsüz);
  Thief's Reflexes "Surprised" SRD metninde yok (doğrulandı, değişiklik yok).
- Ertelendi, karar gerekli: (3) yapışma (Stirge, Darkmantle, Cloaker), likantrop laneti (5 canavar), boğulma (Rug, Water Elemental,
  Gelatinous Cube); SRD-12 sınıf özelliği sapmaları (Cutting Words ıskada, Quivering Palm vazgeçme, Holy Nimbus/Hurl Through Hell
  yenilenme, Dark One's Own Luck, Supreme Sneak siper zamanı, Fast Hands/Use Magic Device savaş dışı, otomatik seçimler) — gerekçeler DECISIONS.
- (5) SRD-KAPSAM kısmi canavar desenleri (128 satır): inisiyatif 110 + Weakening Breath 2 + Weight of Years 2 + Misty Step 1 kapandı;
  kalan: savaş dışı 53, Hurl Flame 2, boğulma 3, Vortex 1, dokunaç 1, Rotting Fist 1.
- `data/monsters.json` istisnası (SRD uyumu, denge değil) DECISIONS ve CLAUDE.md Yasaklar satırında.
- Değişen eski testler: `ruleVersion.test.ts`, `g6.test.ts` (102 → 103); `b93.test.ts` Magic Missile testi büyücü fikstürüne INT 4
  (103'te Empowered Evocation INT değiştiricisiyle; testin konusu "bir darta bir kez"); `ridersA2.test.ts` duman testi eski aktarım adını
  (`eskiAd`) güncel sürümde atlar. Ek verisi: `data/attack-riders.json` ve `data/canavar-ekleri-a2.json` Weakening Breath anahtarları.
- Test turu (`src/battle src/ui src/app src/rules src/data src/screens`, 418 dosya): 5124 geçti, 4 düştü (yukarıdaki üç dosya; düzeltildi).
- Hızlı regresyon 102 ↔ 103 (100 tohum): Çöl %81/%81, Kale %36/%32, Mağara %85/%78 (berabere %4), Orman %64/%68 — kural kaynaklı
  (canavar inisiyatifi), `DENGE.md` "ölçülecek".
- Build 451,53 / 500 kB; `check:harita` 92/92; `check:ses` 15/0.

## Aşama 5: SRD-KAPSAM.md ikinci çalışma (sürümsüz, yalnız belge) — TAMAM

- Belge baştan üretilmedi; Aşama 1–4'te değişen satırlar güncellendi (**[Gece kuyruğu]** işaretli). Önce → sonra (1870 satır):
  var-test edilmiş 715 → 775, var-testsiz 370 → 414, kısmi 427 → 324, yok 41 → 40, savaş dışı 317 → 317, hiç olmayan 95 → 94.
- En büyük değişim canavar/hayvan satırları (inisiyatif farkı 110 satırda; 94'ünde başka kısmi neden kalmadı).
- Yeni bulgu (kırılma değil): Storm of Vengeance 2–10. tur aşamaları yok (var-test edilmiş → kısmi). Aşama 1–4'te bozulan eski kural yok.
- "Test edilmiş" örnekleme doğrulaması (12 satır, tohum 103): 5 kuralı sınıyor, 4 yüzeysel, 1 yalnız veri, 2 test bulunamadı (≈ %42
  gerçek sınama); yöntem belgede.
- CLAUDE.md "Bilinen eksikler" kodla doğrulandı: Dinlenme satırı (Arcane Recovery/Sorcerous Restoration "yok") ve "Yapay zekânın
  gizlenmesi" ("yok") bayattı, düzeltildi; Ready ve Dropping Prone satırları doğru/güncel.

## Aşama 6: Eksik taraması (sürümsüz, yalnız belge) — TAMAM

- `harita/belgeler/EKSIK-TARAMA.md` ← `python3 scripts/eksik-tarama.py` (+ elle bölümler `scripts/eksik-tarama-elle.md`). Kaynaklar:
  SRD-KAPSAM, GENEL-SAVAS-DENETIM, DECISIONS, CLAUDE.md Bilinen eksikler, BUYU-TAM-TARAMA §4, BUYU-KISMI, PAKET-SIGMAYAN, 27 `*-DENETIM.md`.
- Ölçülmüş sayılar (tekil kaynak + konu 710): açık ve SRD'de 464, bilinçli ertelenen 126, karar gerektiren 26 (+ 16 elle soru),
  bayat 19 (kapanmış konu, kaynak belge güncellenmemiş: E8, E9, E13, D10, B35, A7, A44, H12, T27, Z9, Evocation Savant …),
  savaş dışı 75 (+ 12 sistem için tasarım adımı), probe 14. "Serüven öncesi mutlaka" 15 madde.

## Aşama 7: Son doğrulama ve rapor — TAMAM

- **Tam `npm test` (bir kez):** 527 dosya; 5776 geçti, 11 atlandı (yerel `icerik/` yok: AS2 sayımı ve benzerleri), **2 düştü**:
  1. `src/dungeondex/prospektus/buyu.test.ts` "oyundaki durum BUYU-DURUM ölçütüyle aynı": Aşama 3'ün `b102` bloğu Dungeondex'in
     `SPELL_BLOCKS` listesine eklenmemişti → **düzeltildi** (`src/dungeondex/prospektus/buyu.ts`; dosya tek başına yeşil).
  2. `src/dungeondex/dungeondex.test.tsx` "kategori listesi ve Lisanslar ve atıf" (`dex-tab-lisans` sekmesi yok): **önceden var olan**
     hata — gece kuyruğu başlangıç ağacında (`f799e851`, geçici worktree) da düşüyor (KALAN100 kaydında da). Başka oturumun Dungeondex
     kitap kabuğu işi; dokunulmadı.
  `surfaces.test` zaman aşımına düşmedi; `esyaIkon` testi atlandı/geçti (depo dışı ham dosya).
- **typecheck, build, check:harita, check:ses (son çalıştırma):** typecheck temiz; build ana parça 451,53 / 500 kB; `check:harita` 92/92;
  `check:ses` 15 kontrol, 0 hata (Chromium: `PW_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`). **check:icerik:** büyü betimlemeleri 339/339, 0 hata; `icerik/`
  klasörü bu bulut ortamında yok (paket doğrulaması yapılamadı).
- **Regresyon tabloları (hızlı, 100 tohum, 5. seviye standart parti):**

| Senaryo | 100 | 101 | 102 | 103 |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | %81 | %81 | %81 | %81 |
| Kale — Gündüz (Kale ve avlu) | %36 | %36 | %36 | %32 |
| Mağara — karanlık | %85 | %85 | %85 | %78 |
| Orman | %64 | %64 | %64 | %68 |

  101 ve 102 aynı (değişiklikler oyuncu komutları, gece varyantı ve büyü verisi; bu senaryolarda etkisiz). 103 farkı **kural kaynaklı**
  (canavar inisiyatifi SRD stat bloğundan; veri hatası değil). Altın imzalı regresyon testleri (`src/sim/*Regresyon.test.ts`) eski
  sürümleri sınadığı için düşmedi.
- **Değişen eski testler ve gerekçeleri:** `ruleVersion.test.ts`, `g6.test.ts` (güncel sürüm 100 → 103, her aşamada); `SAVE_VERSION`
  24 → 25 (`statusFx`, `areaView`, `s1`, `g1`; `ready.test` ≥ 24); `night.test.ts` (101'de `nightVision` varsayılan açık: gece gizlenme
  testleri anahtar kapalıyla); `e2Verify.ts` görsel doğrulama düzeni (Earthquake 102'de büyücünün kendi konsantrasyonunu bozar) +
  `data/efekt-e2-dogrulama.json`; `b93.test.ts` Magic Missile (103'te Empowered Evocation INT değiştiricisi); `ridersA2.test.ts` duman
  testi (eski aktarım adı `eskiAd`); `dungeondex/prospektus/buyu.ts` `SPELL_BLOCKS` (+ `b102`).

## Karar gerekli (numaralı, önerili)

1. **Aşama 1'in kalanı:** 77fe3e69 (ad işi) push'lanınca `icerik/ek-cleric.json`'dan life-domain silinsin ve "Bağlılık Yemini Büyüleri" →
   "Sadakat Töresi Büyüleri" adı alt sınıf adıyla birlikte değişsin. Öneri: yerel checkout'ta (icerik/ olan) tek adım.
2. **Eşyayı silaha bağlama** (KARAR101 5e; SRD tanımlı): oluşturucuda eşyaya silah seçimi mi, ana silah varsayılanı mı? Öneri: seçim + varsayılan.
3. **Knocking Out sonrası** (KARAR101): bayıltılan yenilmiş sayılıyor; Serüven'de esir alma olsun mu? Öneri: şimdilik yenilmiş, esir alma ayrı.
4. **`nightVision` varsayılan açık** (101): denge ölçümü (gece senaryoları) — tam turda ölçülsün mü, yoksa varsayılan geri mi? Öneri: ölç.
5. **103 inisiyatif dengesi:** Kale %36 → %32. Öneri: tam turda düşman listeleri yeniden ölçülsün (canavar verisi denge için değişmez).
6. **Storm of Vengeance aşamaları** (BUYU-TAM §4.1): alan tetikleyicisine aşama sayacı (sürüm 104+)? Öneri: evet.
7. **Yapışma / likantropi / boğulma** (KAPSAM103): yeni "bağlı yaratık" + `noBreath` + 0 HP biçim değişimi tek görevde mi? Öneri: evet.
8. **Savaş dışı süreler ve maliyetli materyal** (BUYU-TAM §4.2, §4.5): Serüven zaman/ekonomi modeline bağlansın mı? Öneri: Serüven ile.
9. **0 HP uzun dinlenme** (G6): Normal'de SRD'ye dönülsün mü? Öneri: Normal SRD, Kolay ev kuralı.
10. **Otomatik seçimlerin oyuncuya sorulması** (Preserve Life, Sculpt Spells, Stroke of Luck…; KAPSAM103 ertelenenler): `askChoice` ile
    hepsi "Sor" ayarına bağlansın mı? Öneri: evet, tek görev.

Ayrıntılı soru listesi `harita/belgeler/EKSIK-TARAMA.md` (bölüm 3, 16 soru) ve `BUYU-TAM-TARAMA.md` §4.

## Ertelenenler

KARAR101 5e (eşya ↔ silah bağı); Storm of Vengeance aşamaları; yapışma, likantrop laneti, boğulma; SRD-12 sınıf özelliği sapmaları
(Cutting Words ıskada, Quivering Palm vazgeçme, Holy Nimbus/Hurl Through Hell yenilenme, Dark One's Own Luck, Supreme Sneak, Fast
Hands/Use Magic Device savaş dışı, otomatik seçimler); Ready yanıt listesi ve YZ Ready; denge ölçümleri (101 gece, 103 inisiyatif).
