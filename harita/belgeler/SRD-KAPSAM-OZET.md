# SRD 5.2.1 kapsam özeti (bölüm başına tek satır)

Tarih: 2026-11-26 · Taban: `origin/birlesik` 598acd70 · Güncel kural sürümü 105, savaş kayıt sürümü 27. **Yalnız okuma:** kod, veri ve
test değişmedi; depoya yalnız bu belge girdi. Hiçbir denetim betiği yeniden çalıştırılmadı (ayrıntı "Yöntem").

## Yöntem

- **Sayıların tabanı** `harita/belgeler/SRD-KAPSAM.md` (2026-11-21, ikinci çalışma, kural sürümü 103; 1870 satır, SRD'nin
  içindekiler sırası). Bölüm sayıları o belgenin satırlarından yeniden sayıldı, belgenin kendi tablosuyla birebir aynı çıktı.
- **104–105 farkı elle işlendi.** SRD-KAPSAM'dan sonra gelen KARAR104 (2026-11-24/25), KARAR104-KALAN (2026-11-26) ve çoklu sınıf
  MC1–MC5 (2026-11-24/26, kural sürümü 105) maddeleri (`DECISIONS.md`) ile güncellenen denetim satırları (`BUYU-TAM-TARAMA.md`, `GENEL-SAVAS-DENETIM.md`, `TUR-FEAT-ESYA-DENETIM.md`,
  `ENVANTER-CANAVARLAR.md`) SRD-KAPSAM satırlarına tek tek eşlendi; yalnız **kısmi/yok nedeni tamamen kapanan** satırın durumu
  değiştirildi (liste aşağıda, 23 satır). Kodla denenmedi: bu sütunlar "105 tahmini"dir, SRD-KAPSAM yeniden üretilirse küçük fark
  çıkabilir.
- **Durum eşlemesi:** çalışır = SRD-KAPSAM "var-test edilmiş" + "var-testsiz"; kısmi = "kısmi" (bilinçli sapmalar dahil);
  savaş dışı / Game Master = "savaş dışı" (Game Master notlu olanlar dahil); yok = "yok". "Hiç olmayan" = yok + oyunda hiçbir
  karşılığı olmayan savaş dışı satır.
- **"Çalışır" bir üst sınırdır.** SRD-KAPSAM'ın örneklemesinde "var-test edilmiş" satırların ≈ %42'sinin testi kuralı gerçekten
  sınıyor (12 satırın 5'i); "var-testsiz" satırların kanıtı veri, probe ya da kod okuması.
- **Betikler:** `docs/SRD-DENETIM.md` (`scripts/srd-denetim.ts`) 2026-11-21'de SRD-KAPSAM görevinde yeniden üretilmiş ve birebir
  aynı çıkmıştı; bu çalışmada yeniden çalıştırılmadı (ayrı worktree'de `node_modules` yok, ana klasör işlenmemiş değişiklikli
  başka bir `birlesik`). `MEKANIK-MATRIS.md` (`--yaz` dosya yazar) ve `docs/MEKANIK-DURUM.md` da çalıştırılmadı; bayat oldukları
  aşağıda işaretli.
- **Kapsam dışı:** KATALOG-1 özgün eşyaları (330 eşya, 2026-11-26) ve 108 paket / 12 bizim alt sınıf SRD dışı; sayılmadı. SRD'nin 12
  alt sınıfı dış pakette (`icerik/`, gitignore) yaşar; satırlar fikstür mekaniğinden okunmuştur (`src/rules/fixtures/srd-alt-siniflar.json`).

## Bölüm tablosu

İşaret: **güncel** (son denetim 104–105'i ya da o sürümlerde değişmeyen bölümü kapsıyor) · **bayat** (kaynak denetim 104 değişikliklerini ya
da eski sürümü yansıtıyor) · **denetlenmemiş** (bölümün kendi denetim belgesi yok; yalnız SRD-KAPSAM satır taraması ya da veri
varlığı).

| SRD 5.2.1 bölümü (sayfa) | Madde (satır) | Çalışır | Kısmi | Savaş dışı / GM | Yok | Hiç olmayan | Son denetim (tarih, kural sürümü) | İşaret |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Playing the Game (s. 5–18) | 41 kural | 20 | 18 | 3 | 0 | 2 | GENEL-SAVAS-DENETIM 2026-11-20 (94) + KALAN100 (100) + KARAR104 A11 2026-11-25 (104); SRD-KAPSAM 2026-11-21 (103) | güncel |
| Character Creation (s. 19–27) | 13 kural | 7 | 2 | 3 | 1 | 3 | SRD-KAPSAM 2026-11-21 (103); MULTICLASS-INCELEME 2026-11-22 (uygulama öncesi); çoklu sınıf MC1–MC5 2026-11-26 (105), uygulama sonrası denetim yok | denetlenmemiş |
| Classes: 12 sınıf + SRD alt sınıfları (s. 28–82) | 280 özellik / seçenek | 180 | 93 | 7 | 0 | 5 | 12 sınıf denetimi 2026-11-20 (79–94; B93/B94/B95/B98 ve TE99 düzeltme bölümleriyle 99); SRD-KAPSAM (103); KARAR104-KALAN 104'te 7 satırı kapattı, sınıf belgelerine işlenmedi | bayat |
| Character Origins: geçmiş + tür (s. 83–86) | 72 (4 geçmiş, 9 tür, özellikler, kurallar) | 56 | 13 | 0 | 3 | 3 | TUR-FEAT-ESYA-DENETIM 2026-11-20 (97) + TE99 (99); SRD-KAPSAM (103) | güncel |
| Feats (s. 87–88) | 29 | 22 | 7 | 0 | 0 | 0 | TUR-FEAT-ESYA-DENETIM 2026-11-20 (97) + TE99 (99); SRD-KAPSAM (103) | güncel |
| Equipment (s. 89–103) | 254 | 118 | 40 | 91 | 5 | 33 | TUR-FEAT-ESYA-DENETIM 2026-11-25 (KARAR104 A10, 104); alet/araç/yaşam satırları yalnız SRD-KAPSAM (103) | güncel (silah, zırh) / denetlenmemiş (alet, araç, binek eşyası) |
| Spells 0–9 (s. 104–175) | 355 (339 büyü + 16 kural) | 215 | 26 | 114 | 0 | 0 | BUYU-TAM-TARAMA 2026-11-24 (104); BUYU-DURUM 2026-11-21 (102); MEKANIK-MATRIS 2026-11-20 (91) | güncel (MEKANIK-MATRIS bayat) |
| Rules Glossary: terimler + durumlar (s. 176–191) | 155 başlık | 94 | 49 | 10 | 2 | 9 | GENEL-SAVAS-DENETIM (B satırları durumlar) 2026-11-25 (104); SRD-KAPSAM (103) | güncel |
| Gameplay Toolbox (s. 192–203) | 54 | 5 | 17 | 6 | 26 | 32 | yalnız SRD-KAPSAM 2026-11-21 (103) | denetlenmemiş |
| Magic Items (s. 204–253) | 267 (258 eşya + 9 kural) | 169 | 17 | 81 | 0 | 3 | ESYA-SINIFLANDIRMA 2026-11-06 (34); ENVANTER-ESYALAR 2026-11-05 (27); TUR-FEAT-ESYA D satırları (≈30 eşya kuralı) 2026-11-25 (104); 142 satır yalnız veri varlığından | bayat |
| Monsters A–Z (s. 254–343) | 254 (234 canavar + 20 stat blok kuralı) | 228 | 24 | 2 | 0 | 1 | SRD-VERI-DOGRULAMA 2026-11-19 (89); ENVANTER-CANAVARLAR gövdesi A0 2026-11-05 (27), "A2'de kalan" satırları 2026-11-25 (104); SRD-KAPSAM (103) | güncel sayılar / ENVANTER-CANAVARLAR bayat |
| Animals (s. 344–364) | 96 | 96 | 0 | 0 | 0 | 0 | SRD-VERI-DOGRULAMA 2026-11-19 (89); WILD-SHAPE-BICIMLER-DENETIM 2026-11-20 (91, SWARM95 notu 95); SRD-KAPSAM (103) | güncel |
| **Toplam** | **1870** | **1210** | **306** | **317** | **37** | **91** | | |

330 SRD stat bloğu = Monsters'taki 234 canavar + Animals'taki 96. SRD-KAPSAM'daki 103 toplamı: çalışır 1189, kısmi 324, savaş dışı
317, yok 40, hiç olmayan 94.

## 104–105'te durumu değişen satırlar (SRD-KAPSAM 103 → bu özet)

| Bölüm | Satır | 103 | 105 | Kaynak |
|---|---|---|---|---|
| Character Creation | Multiclassing: önkoşullar (13 yetenek) | yok | çalışır | MC1–MC2, MC5 (`multiclassProblems`, oluşturucu "ön koşul: CHA en az 13") |
| Character Creation | Multiclassing: HP, HP zarları, PB, yetkinlikler, özellikler, ortak büyü yuvası, Pact Magic | yok | kısmi | MC2–MC4 (kural 105); ⚠ yaklaşıklar: Weapon Mastery tek havuz (K5, SRD'de açık değil), paket ilkellerinin `channelDivinity` başvurusu sınıfsız; MC5: Serüven'de yeni (yan) sınıf yalnız kutsal ayna yanında (ev kuralı) |
| Classes | Preserve Life (Life Domain) | kısmi | çalışır | KARAR104 A5 (`askPicks`, bölüşüm oyuncuya) |
| Classes | Land's Aid (Circle of the Land) | kısmi | çalışır | KARAR104 A5 |
| Classes | Superior Hunter's Prey (Hunter) | kısmi | çalışır | KARAR104 A5 |
| Classes | Quivering Palm (Warrior of the Open Hand) | kısmi | çalışır | KARAR104-KALAN A6 (yapay zekâ kullanmaz: durumu düşürmez) |
| Classes | Supreme Sneak (Thief) | kısmi | çalışır | KARAR104-KALAN A6 (tur sonu siper) |
| Classes | Dark One's Own Luck (Fiend Patron) | kısmi | çalışır | KARAR104-KALAN A6 |
| Classes | Hurl Through Hell (Fiend Patron) | kısmi | çalışır | KARAR104-KALAN A6 |
| Equipment | Weapon +1/+2/+3: o silahla (TUR-FEAT D26) | kısmi | çalışır | KARAR104 A10 (`silahBagi`) |
| Equipment | Diğer isabet ekli silahlar, 24 `onHit` (D31) | kısmi | çalışır | KARAR104 A10 |
| Spells | Storm of Vengeance | kısmi | çalışır | KARAR104 A1 + KARAR104-KALAN ⚠a (BUYU-TAM-TARAMA "tam (104)"; nesneler hedef değil ⚠) |
| Rules Glossary | Unconscious [Condition] (B40 eşya düşürme) | kısmi | çalışır | KARAR104-KALAN A7 (kalkan ve elde tutulan büyü etkileri ⚠ kapsam dışı) |
| Gameplay Toolbox | Curses: Cursed Creatures | yok | kısmi | KARAR104 A4 + KARAR104-KALAN ⚠e (likantropi savaşta; kurtarma, Remove Curse savaş dışı) |
| Monsters | Stirge, Darkmantle, Cloaker (yapışma) | kısmi | çalışır | KARAR104 A2 + ⚠b, ⚠c |
| Monsters | Water Elemental (Whelm boğulma) | kısmi | çalışır | KARAR104 A3 |
| Monsters | Werewolf, Wererat, Wereboar, Weretiger, Werebear (lanet) | kısmi | çalışır | KARAR104 A4 + KARAR104-KALAN ⚠e (Shape-Shift savaş dışı sayılıyordu) |

104'te ilerleyip **kısmi kalan** satırlar (başka nedeni sürüyor): Ready [Action] (yanıt listesi tamam; tetik yorumu A24 ve yapay
zekâ A27), Long Rest (0 HP kuralı tamam; G7 doğrulanmadı, G10, kesintiler G11), Death Saving Throws (1d4 saat tamam; D18), Rogue
Stroke of Luck (soru tamam; ölüm save'i A29, kritik yorumu A28), Wizard Sculpt Spells (seçim tamam; "görebildiğin" ve kalıcı alan),
Animated Rug of Smothering (boğulma tamam; "hasar yerine yakalama"), Gelatinous Cube (boğulma tamam; sözlü büyü yasağı, küple
taşınma), Bard Cutting Words (zaten çalışır sayılıyordu; ıskada hasar zarı eklendi).

## Alt kırılımlar

### Classes (sınıf başına, 105 tahmini; SRD alt sınıfı ve seçenek satırları dahil)

| Sınıf | Satır | Çalışır | Kısmi | Savaş dışı | Not |
|---|---:|---:|---:|---:|---|
| Barbarian | 23 | 18 | 5 | 0 | |
| Bard | 17 | 10 | 7 | 0 | |
| Cleric | 17 | 11 | 6 | 0 | Preserve Life 104 |
| Druid | 20 | 8 | 11 | 1 | en çok kısmi; Land's Aid 104 |
| Fighter | 21 | 13 | 8 | 0 | |
| Monk | 26 | 19 | 7 | 0 | Quivering Palm 104 |
| Paladin | 23 | 14 | 9 | 0 | |
| Ranger | 23 | 16 | 7 | 0 | Superior Hunter's Prey 104 |
| Rogue | 23 | 16 | 6 | 1 | Supreme Sneak 104; Thieves' Cant savaş dışı |
| Sorcerer | 26 | 16 | 10 | 0 | Metamagic seçenekleri dahil |
| Warlock | 43 | 27 | 12 | 4 | Invocation seçenekleri dahil; 4 savaş dışı Invocation |
| Wizard | 18 | 12 | 5 | 1 | |

### Equipment

| Alt başlık | Satır | Çalışır | Kısmi | Savaş dışı | Yok |
|---|---:|---:|---:|---:|---:|
| Silah (38 silah, özellikler, kurallar, 8 Mastery, yetkinlik) | 67 | 56 | 11 | 0 | 0 |
| Zırh (13 zırh + kurallar) | 41 | 36 | 4 | 0 | 1 |
| Adventuring Gear (81 eşya) | 81 | 11 | 7 | 63 | 0 |
| Eşya kullanım kuralları (TUR-FEAT D satırları) | 24 | 12 | 11 | 0 | 1 |
| Aletler | 26 | 1 | 2 | 23 | 0 |
| Binek ve araç (Mounts and Cargo, Saddles, Barding, Large Vehicles) | 4 | 0 | 1 | 0 | 3 |
| Para, yaşam, hizmet, üretim, uyum | 11 | 2 | 4 | 5 | 0 |

### Gameplay Toolbox

| Alt başlık | Satır | Çalışır | Kısmi | Savaş dışı | Yok |
|---|---:|---:|---:|---:|---:|
| Yolculuk (Travel Pace) | 5 | 0 | 4 | 0 | 1 |
| Geçmiş oluşturma | 1 | 0 | 0 | 1 | 0 |
| Lanetler | 4 | 1 | 2 | 1 | 0 |
| Büyülü salgınlar | 4 | 0 | 0 | 1 | 3 |
| Çevresel etkiler | 9 | 2 | 5 | 1 | 1 |
| Korku ve zihinsel stres | 3 | 1 | 0 | 1 | 1 |
| Zehirler (türler, satın alma, hasat, 14 örnek) | 17 | 0 | 1 | 1 | 15 |
| Tuzaklar (parçalar + 8 örnek) | 9 | 0 | 4 | 0 | 5 |
| Karşılaşma zorluğu, sorun giderme | 2 | 1 | 1 | 0 | 0 |

## Kaynak belgelerin tazeliği

| Belge | Son değişim | Kural sürümü | Durum |
|---|---|---|---|
| `harita/belgeler/SRD-KAPSAM.md` | 2026-11-21 | 103 | 104–105'in 23 satırı işlenmedi (yukarıdaki tablo); "Önemli bulgular" 5 çoklu sınıfı yok sayıyor |
| `harita/belgeler/EKSIK-TARAMA.md` | 2026-11-21 | 103 | "Serüven öncesi mutlaka" listesinin 2–12. ve 14. (çoklu sınıf) maddeleri 104–105'te kapandı, belgede açık |
| `harita/belgeler/MULTICLASS-INCELEME.md`, `MULTICLASS-PLAN.md` | 2026-11-22 / 11-24 | 103–104 | uygulama öncesi inceleme ve plan; MC1–MC5 sonrası SRD s. 24–26 karşılaştırması yok |
| `harita/belgeler/{12 sınıf}-DENETIM.md` | 2026-11-20 | 79–94 (+ B93–B98 bölümleri) | KARAR104 A5 ve KARAR104-KALAN A6 bölümü yok |
| `harita/belgeler/GENEL-SAVAS-DENETIM.md` | 2026-11-25 | 94 + KALAN100 + 104 (G6) | güncel; B40 (Unconscious) ve A23 (Ready) satırları KARAR104-KALAN'la güncellenmedi |
| `harita/belgeler/TUR-FEAT-ESYA-DENETIM.md` | 2026-11-25 | 97 + TE99 + 104 (D26, D31) | güncel |
| `harita/belgeler/BUYU-TAM-TARAMA.md` | 2026-11-24 | 102 + 104 (Storm of Vengeance) | güncel |
| `harita/belgeler/BUYU-DURUM.md` | 2026-11-21 | 102 | güncel (104'te büyü satırı yalnız Storm of Vengeance) |
| `harita/belgeler/MEKANIK-MATRIS.md` | 2026-11-20 | 91 | bayat (92–104 düzeltmeleri ölçülmedi) |
| `harita/belgeler/SRD-VERI-DOGRULAMA.md` | 2026-11-19 | 89 | güncel (veri değeri denetimi; 103 inisiyatif SRD-KAPSAM'da) |
| `harita/belgeler/ENVANTER-CANAVARLAR.md` | 2026-11-25 | gövde 27, ek satırlar 104 | bayat satır: likantrop "dönüşme yok" (KARAR104-KALAN'da uygulandı) |
| `harita/belgeler/ENVANTER-{BUYULER,ESYALAR,DIGER,OZET}.md` | 2026-11-05 … 11-20 | 27 | tarihsel (A0); SRD-KAPSAM aştı |
| `harita/belgeler/ESYA-SINIFLANDIRMA.md` | 2026-11-06 | 34 | bayat (TE99 ve 104 eşya düzeltmeleri yok) |
| `harita/belgeler/WILD-SHAPE-BICIMLER-DENETIM.md` | 2026-11-20 | 91 (+ SWARM95) | güncel; KARAR104-KALAN A8 (sürü varışı) notu yok |
| `docs/SRD-DENETIM.md` | 2026-11-20 | Kuyruk 19 (16) kapsamı | bayat kapsam (SRD-KAPSAM aştı); betik çıktısı 11-21'de değişmemişti |
| `docs/MEKANIK-DURUM.md` | 2026-11-03 | Kuyruk 18 (14–15) | bayat (SRD kapsamı değil, Game Master anahtarları durumu) |

## Denetlenmemiş ve bayat bölümler

| # | Bölüm / belge | Durum | Boşluk | Tahmini iş | Öneri |
|---|---|---|---|---|---|
| 1 | Gameplay Toolbox | denetlenmemiş | Kendi denetim belgesi yok; 54 satırın 26'sı yok (14 örnek zehir, 5 tuzak, 3 salgın, Extreme Heat, Mental Stress, Extended Travel, zehir hasadı); kısmi 17 satırın neden sütunu tek cümle | orta | Salt okuma bir TOOLBOX denetimi (GENEL-SAVAS biçiminde satır kimlikli): kısmi 17 satırın SRD metniyle tek tek okunması; yok satırlar zaten kesin, yeniden sayılması gerekmez |
| 2 | Magic Items | bayat | 258 eşyanın 142'si "var-testsiz" yalnız veri türünden (`passive`/`onHit`/`spells`/`bonus` var mı); eşya başına SRD metni okunmadı; ESYA-SINIFLANDIRMA sürüm 34'te | büyük | TUR-FEAT-ESYA D satırlarının yöntemiyle eşya başına denetim, önce savaşta kullanılan 169 eşya (en çok `onHit` ve yüklü büyü eşyaları); 81 savaş dışı satır yalnız örneklemle |
| 3 | Classes (sınıf belgeleri) | bayat | KARAR104 A5 ve KARAR104-KALAN A6'nın kapattığı 7 satır belgelerde hâlâ kısmi/bilinçli sapma; Cleric/Sorcerer/Wizard gövdesi 79–80'de okunmuş | küçük | 12 sınıf belgesine "KARAR104 / KARAR104-KALAN" düzeltme bölümü (yalnız belge) |
| 4 | SRD-KAPSAM.md | bayat | 104–105'in 23 satırı ve "Kısmi satırların içinde hiç uygulanmamış alt kurallar" listesi (B40, A23, G6, yapışma/likantropi/boğulma) güncel değil | küçük | Üçüncü çalışma: yalnız bu özetteki 23 satır + alt kural listesi; tam yeniden üretim gerekmez |
| 5 | MEKANIK-MATRIS.md | bayat | Sürüm 91; 92–104 düzeltmeleri (WS92, B93–B98, GENEL96, TE99, KALAN100, KARAR101, BUYU-TAM, KAPSAM103, KARAR104) matriste ölçülmedi | küçük | `npx vite-node src/sim/mekanikMatris.ts -- --yaz --etiket "104"` (≈5 sn; dosya yazdığı için ayrı görev) |
| 6 | ENVANTER-CANAVARLAR.md | bayat | Gövde A0 (sürüm 27); likantrop satırları "dönüşme yok" diyor | küçük | Satırlara KARAR104-KALAN ⚠e notu; başlığa "gövde tarihsel" notu |
| 7 | EKSIK-TARAMA.md | bayat | "Serüven öncesi mutlaka" 2–12 ve 14 ile karar soruları 2–3 104–105'te kapandı | küçük | `python3 scripts/eksik-tarama.py` yeniden üretimi (salt okuma betiği) ya da kapanış notu |
| 8 | Character Creation | denetlenmemiş | Çoklu sınıf 105'te geldi ama SRD s. 24–26'ya karşı uygulama sonrası denetimi yok (MULTICLASS-INCELEME uygulama öncesi); üst seviye başlangıç donanımı yok; diller, Tiers of Play, Trinkets savaş dışı | orta | Salt okuma çoklu sınıf denetimi (sınıf başına özellik tablosu, büyü yuvası tablosu, Pact Magic, Extra Attack/Unarmored Defense birikmezliği; MC ⚠'leri) |
| 9 | Equipment: alet, araç, binek eşyası, yaşam giderleri | denetlenmemiş | 23 alet ve 5 yaşam/üretim satırı savaş dışı etiketiyle geçti; Saddles, Barding, Large Vehicles yok | küçük | SRD-KAPSAM satırları yeterli; Serüven ekonomisi görevi açılınca birlikte denetlenmeli |
| 10 | ESYA-SINIFLANDIRMA.md, ENVANTER-* (A0), docs/SRD-DENETIM.md, docs/MEKANIK-DURUM.md | bayat (tarihsel) | SRD-KAPSAM ve sonraki denetimler aştı; kural sürümü 16–34 | küçük | Belge başına "tarihsel; güncel durum SRD-KAPSAM" notu ya da betikli olanların yeniden üretimi |
| 11 | Bütün bölümler: "çalışır" kalitesi | — | "Var-test edilmiş" satırlarda testin kuralı sınama oranı örneklemde ≈ %42; 414 + "var-testsiz" satırın testi yok | büyük | CLAUDE.md'deki "Dungeondex öncesi tam test turu"na: yüzeysel testlerin kural testine çevrilmesi |

**Önerilen sıra:** 3, 4, 6, 7 (küçük belge güncellemeleri, tek görevde) → 5 (matris yeniden üretimi) → 8 (çoklu sınıf denetimi) → 1 (Toolbox denetimi) →
2 (Magic Items denetimi) → 9 Serüven ekonomisiyle birlikte → 11 tam test turunda.
