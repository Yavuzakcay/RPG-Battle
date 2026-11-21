# Gece kuyruğu raporu (2026-11-21)

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
