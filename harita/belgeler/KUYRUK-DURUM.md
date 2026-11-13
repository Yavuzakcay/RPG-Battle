# Kuyruk durum denetimi (Görev DURUM)

Salt okuma. Taban `origin/main` 6691df1d (2026-11-12). Kod, veri, harita, görsel ve kural değişmedi. Kanıtlar: `git log`
(main + bütün uzak dallar; depo önce sığ klondu, `git fetch --unshallow` ile tam geçmiş alındı), DECISIONS.md (satır
numaraları bu denetimdeki dosyaya göre), `harita/belgeler/*`, kaynak dosyalar.

## Özet

- Kural sürümü **76** (K74, `data/kural-surumu.json`; denetim anında 74), `SAVE_VERSION` **22** (`src/app/battleSave.ts:31`). 60–74 zinciri kesintisiz, her sürümün DECISIONS.md kaydı var.
- SU1, SU2, SU3, K62-ACIK (1–4), K73e/f, binek hattı (MB1–MB8), SD1–SD3 main'de. Açık: Hallow ek etkileri (kullanıcı kararı), U1b Görev 1–4 (`icerik/` gerekli), motorda Truesight'ı bilmeyen 5 yol.
- Birleşmemiş uzak dal 8: biri iş (SD4, kullanıcı kararı bekliyor), biri yarım (U1b Görev 0), üçü ham görsel (geçici), üçü eski Görev F yığını (artık gereksiz).
- CLAUDE.md'deki kural sürümü cümlesi güncel (74). Donma maddesi zaten "kaldırıldı" diyordu; bu görevde istenen tek cümleye indirildi, `docs/MEKANIK-DONMA.md` başına aynı cümle eklendi.
- Bayat belgeler: `K62ACIK-DENETIM.md` ve `BINEK-PLAN.md` donmayı "geçerli" anlatır (tarihsel, o günün durumu); `BATAKLIK-TANI.md` "güncel 73" der (yazıldığında doğruydu, şimdi 74).

## Madde tablosu

| # | Madde | Durum | Kanıt |
|---|---|---|---|
| 1 | SU1 su hex denetimi | YAPILDI | `harita/belgeler/SU-HEX-DENETIM.md`; commit f740c07e; dal `claude/su-hex-denetim-ux0w7t` main'de (merge 9c7b6e41, `git branch -r --merged`); DECISIONS.md:358 |
| 2 | SU2 deprem efekti okunabilirliği | YAPILDI | commit 46423da2 + birleştirme b659f685; DECISIONS.md:312; `docs/su2/once-sonra.png`; `wip/deprem-efekt` uzakta artık yok (birleşip silinmiş) |
| 3 | SU3 su dokusu `haric`/`ekle` | YAPILDI | commit b9e79022; `data/efekt-baglama.json` `su` (haric 44 hex/4 harita, ekle Heykel Gölü 30 + Vaha 17); test `src/ui/fx/su3.test.ts`; DECISIONS.md:348. Açık: Kale Önü hendeği tamamen kıyı sayılıyor, piksel maskesi (SU1 seçenek b) kullanıcı kararı; düşük güvenli 5 harita "elle teyit gerekli" |
| 4a | Delayed Blast Fireball boncuk arayüzü | YAPILDI | K62-ACIK Madde 1 (sürümsüz), commit dd3b6ad0; `bead.ts` `beadThrowLanding`; test `src/battle/k62acik.test.ts`; `docs/k62acik/boncuk-firlat.png`. Boncuk **efekt dokusu** yok (bkz. 6) |
| 4b | Wall of Ice YZ hedeflemesi | YAPILDI | K62-ACIK Madde 2; `ai.ts` `wallBreakCands` canavar saldırısı, bağışıklık/zayıflık; `k62acik.test.ts` |
| 4c | Truesight eski YZ yolu | YAPILDI (YZ); motor K74'te (sürüm 75) | K62-ACIK Madde 3: `blindChoice`, kapı, haritasız hedef, Divine Sense. Motorda 5 yol hâlâ `!c.hidden`: fırsat saldırısı görme (`reactions.ts`), hareket algısı (`features.ts`), Cleave (`classTraits.ts`), mastery ikinci hedef (`mastery.ts`), ejderha Algısı (`dragon.ts`) (`K62ACIK-DENETIM.md` son bölüm; DECISIONS.md:325) |
| 4d | Magic Circle (isteyerek giriş, ışınlanmada CHA save) | YAPILDI | Kural sürümü 67, `src/battle/k62acikSurum.ts`, `possessionCore.ts` `wardStepBlocked`, `possession.ts` `wardTeleportEvents`; regresyon `src/sim/k62acikRegresyon.test.ts`. ⚠ save varıştan sonra (varıştaki alan etkisi geri alınmaz) |
| 4e | Hallow ek etkileri | KAPANDI (K74, sürüm 75: tek toplu koruma; Extra Effect kapsam dışı, kullanıcı kararı) | Girememe kolu 67'de yapıldı; **Extra Effect (10 seçenek) yapılmadı, kullanıcı kararı bekliyor** (DECISIONS.md:373, `K62ACIK-DENETIM.md` "Madde 5 ayrıntı"). Donma artık engel değil |
| 5a | K73e/f: nefes tutan (yüzme hızsız) yaratık | YAPILMADI (veride 0) | DECISIONS.md:387, 400: SRD verisinde yok; paket yaratığı için karar kullanıcıda |
| 5b | Su altı / kıyı karşılaşması kolay (%100) | YAPILMADI | DECISIONS.md:400, 457; K73f denge `harita/belgeler/DENGE.md` (kıyı 100 → 100); ayar "Dungeondex öncesi tam test turu"na |
| 5c | Yaklaşma kazması pratikte tetiklenmiyor | YAPILMADI | DECISIONS.md:400, 455; `K73E-DENETIM.md`; kod değişmedi |
| 5d | `monsterTraits` hız notu yalnız ilk hızı okur | YAPILMADI (etkisiz) | `src/battle/monsterTraits.ts:26` hâlâ `startsWith('Hız: Swim')`; 66'da `data/derin-su.json` `swimmers66` listesi açığı kapattığı için etkisiz (DECISIONS.md:400) |
| 6a | Havada merkezli küre/silindir | YAPILDI (motor) / KISMEN | K73c sürüm 64, `src/battle/airArea.ts`, commit 3ffd62ae. Açık: YZ havada merkez seçmez; 2B alanlar (ışık, karanlık, sessizlik, zorlu arazi, yüzey) havada merkezlenemez (DECISIONS.md:695–701) |
| 6b | Dünya haritası suyu | YAPILMADI | `E4-DENETIM.md:177`, `SU-HEX-DENETIM.md:155`; yalnız yüzme önizlemesi |
| 6c | Control Water ve `flashFlood` su dokusu | YAPILMADI | DECISIONS.md:554, 597, 600; `src/ui/fx/` içinde `flashFlood`/Control Water bağlaması yok |
| 6d | Boncuk efekt dokusu | YAPILMADI | DECISIONS.md:554; `data/efekt-baglama.json`'da `delayed-blast-fireball` yok (arayüz düğmesi 4a'da var) |
| 6e | Diğer efekt kalanları | YAPILMADI | E4b: levitate, telekinesis, earthquake yerçekimi hücresi, silence, daylight, power-word-kill (DECISIONS.md:600, 610) |
| 7 | U1b alt sınıf uçuş verisi | KISMEN (Görev 0) | Dal `origin/claude/u1b-alt-sinif-ucus-5nkqbp` (d3d816c3, birleşmemiş): `U1B-ENVANTER.md`, `scripts/u1b-envanter.mjs`, test. `u1b-sonuc` belgesi **yok**. Görev 1–4 başlamadı (`icerik/` bulut kopyasında yok). Kullanıcı kararlarından hiçbiri uygulanmadı; açık: Sorcerer "Pulkanat" listede yok, Ejder Muhafızı seviyesi 14 mi 15 mi, Yakamoz ışık koşulu, Ejderha Disiplini Focus kancası, Paratoner paylaşım. U1a'dan bekleyen onaylar (DECISIONS.md:985): alev zemini lav gibi, itilen süzülen lava, su altı süzülene işlemesi |
| 8 | Kural sürümü zinciri | YAPILDI | Aşağıdaki tablo |
| 9 | Birleşmemiş uzak dallar | — | Aşağıdaki tablo |
| 10 | CLAUDE.md / docs bayatlığı | YAPILDI (bu görev) | Kural sürümü cümlesi 74 ile güncel (CLAUDE.md "Kural sürümü" ve "Çalışma şekli"). Donma maddesi K57-KALDIR'da (9f01f864) zaten güncellenmişti; istenen tek cümleye indirildi. `docs/MEKANIK-DONMA.md` başında "KALDIRILDI" notu vardı; istenen cümle en başa eklendi, içerik silinmedi. Tarihsel belgeler (`K62ACIK-DENETIM.md`, `BINEK-PLAN.md` §7.1) donmayı o günkü hâliyle anlatır; `BATAKLIK-TANI.md:101` "güncel 73" (şimdi 74). SD4 birleşirse CLAUDE.md'deki SD3 satırı ("düz Türkçe adlar `data/ozellik-adlari.json`…") bayatlar |

## Kural sürümü tablosu (60 → 76)

`SAVE_VERSION` bütün aralıkta 22 (yeni olay türü yok; `LOADABLE_VERSIONS` 3–22).

| Sürüm | Kuyruk | Kısa ad | Sabit / kapı | Commit (main) | DECISIONS.md |
|---|---|---|---|---|---|
| 60 | K72 | Tavan bölgeleri, sur üstünde durma, çok katlı bina | `stand.ts` | c5f05e1a … 30ab3f24 | :991 |
| 61 | U1a | Uçuş ilkeli kademeleri, süzülme | `flightPrim.ts` | 5025625e | :918 |
| 62 | K73a | YZ dikey taktiği | `ai/k73a.ts` | b842f965 | :826 |
| 63 | K73b | Çok turlu tırmanış, 3B bitişiklik, gönüllü düşme, suya düşme | `adjacency.ts`, `drop.ts` | 5e2fa0a6 | :703 |
| 64 | K73c | Kazma, su altı, havada merkezli alan, Call Lightning devri | `burrow.ts`, `airArea.ts` | b6b5090d, 3ffd62ae | :615 (K73d :459 sürüm değiştirmedi) |
| 65 | K73e | YZ kazma ve dalış | `k73eSurum.ts` | 85e177be | :402 |
| 66 | K73f | Su ve atlama kalanları, 17 yüzücü | `k73fSurum.ts` | 08fe2d67 | :376 |
| 67 | K62-ACIK | Magic Circle/Hallow girememe, ışınlanma save'i | `k62acikSurum.ts` | dd3b6ad0 | :362 |
| 68 | MB1 | Binek çekirdek SRD kuralları | `binekSurum.ts` `BINEK_VERSION` | d62bdab6 | :290 |
| 69 | MB3 | Binek dikey kuralları | `BINEK_MB3_VERSION` | 7492cdc3 | :234 |
| 70 | MB7 | Çağrılan binekler (Find/Phantom Steed, paket `binek`) | `BINEK_MB7_VERSION` | 05ecdfba | :197 |
| 71 | AS1b | Alt soy buff/debuff mekaniği | `altSoySurum.ts` | 18e5f8ee | :178 |
| 72 | MB4 | Çok altıgenli binek gövdesi | `BINEK_MB4_VERSION` | 64b6bfbb | :112 |
| 73 | MB5 | YZ binicisi, dar geçit | `binekMb5Surum.ts` | 369a728a | :97 |
| 74 | MB2 | Kontrollü binek turu | `binekMb2Surum.ts` | 91befdd0 | :44 |
| 75 | K74 | Truesight motor yolları, Hallow toplu koruma | `k74Surum.ts` `K74_VERSION` | (toplu dal) | K74 |
| 76 | K74b | Batıran çamur bedeli, tehlike katmanında çamur | `k74Surum.ts` `K74B_VERSION` | (toplu dal) | K74 |

Sürüm değiştirmeyen işler (aynı dönem): K73d, E4–E5, SU1–SU3, K57-KALDIR, BINEK-PLAN, AS1a/AS1a-2, AS1c, MB6 (arayüz, 70'te), kanat, KG1, BK1, SD1, SD2, SD3 (:17, "kural sürümü 74, kayıt sürümü 22 değişmedi"), MB8 (:6, "74'te kaldı").

## Birleşmemiş uzak dallar (`git branch -r --no-merged origin/main`, tam geçmişle)

| Dal | Son commit | Main'den ileri | İçerik |
|---|---|---|---|
| `claude/simplify-character-creator-ffm9z1` | 2026-11-12 c13495c4 | 1 | SD4: adlar İngilizce, açıklamalar Türkçe (`data/aciklamalar-tr.json`), Alignment İngilizce, `characterIssues` i18n'e; SD3'ün Türkçe ad katmanını geri alır. Kural sürümü 74 aynı |
| `claude/u1b-alt-sinif-ucus-5nkqbp` | 2026-11-11 d3d816c3 | 2 | U1b Görev 0: uçuş envanteri betiği + `U1B-ENVANTER.md`; DECISIONS kaydı (birleşirse eski çakışma notu düzeltilmeli) |
| `wip/e4-ham` | 2026-11-10 78b12e40 | 3 | E4/E4c/E5 ham efekt sayfaları (`assets-ham/efekt/*.jpg`; geçici, işlenmiş hâli main'de) |
| `wip/e2-ham` | 2026-11-06 d3b02c94 | 1 | E2 ham efekt sayfaları (geçici) |
| `wip/e1-ham` | 2026-11-06 a5420580 | 1 | E1 ham efekt sayfaları (geçici) |
| `wip/gorev-f` | 2026-10-29 a899f397 | 1 | Görev F yarım iş (WIP); Görev F main'de tamamlandı (`src/battle/classTraits.ts`) |
| `wip/gorev-f-ilerleme` | 2026-10-29 79ff0dd2 | 2 | Görev F stash yığını (eski) |
| `wip/gorev-f-ilerleme-2` | 2026-10-29 911d73f8 | 2 | Görev F stash yığını 2 (eski) |

Not: sığ klonda 68 dal "birleşmemiş" görünüyordu (sahte sonuç); tam geçmişle 8.

## Kullanıcı kararı bekleyenler (DECISIONS.md son ~30 giriş)

| Madde | Kaynak giriş | Ne bekliyor |
|---|---|---|
| Hallow Extra Effect (10 seçenek) | K62-ACIK (:373) | Uygulanıp uygulanmayacağı ve kapsam (4'ü mevcut alan türlerine oturur, 4'ü yeni alan etkisi) |
| Truesight'ı bilmeyen 5 motor yolu | K57-KALDIR (:325), K62ACIK-DENETIM | Ayrı şerit onayı (savaş sonucunu değiştirir) |
| SD4 dalı | `claude/simplify-character-creator-ffm9z1` | SD3 Türkçe adlarını geri alan dalın birleştirilmesi |
| SD3 kalanları | SD3 (:37) | Eşya/büyü/tür adı çevirisi ayrı görev mi (SD4 İngilizce kararı ile çelişir) |
| Mastiff ve binek senaryoları | MB8 (:6–16) | `sim-senaryolar.json` binekli senaryo için "binmiş başla" kurulum alanı; YZ savaş içi binme/inme (B22) |
| Binek arayüzü MB6b | MB6 (:176), CLAUDE.md Binek | Çekmecede Binek bölümü, önizleme kartı binek satırı, tur şeridi, kurulum anahtarları |
| Human ten tonu gerçek renkleri | AS1b (:193) | `data/alt-soy-gorunum.json` `ten.tonlar[].hsl` yer tutucu |
| Goliath Hill ↔ Cloud ayrışması; Tiefling Kanatlı tinti | AS1a-2 İş 3 (:271–272) | Renk kararı |
| Kale Önü hendeği kıyı soluklaşması / piksel maskesi | SU3 (:355) | SU1 seçenek (b) yapılsın mı |
| SU3 düşük güvenli 5 harita | SU3 (:352) | Elle teyit |
| Uçan yakalayanın taşıması | K73c (:696) | Ertelendi (kullanıcı kararı) |
| Yüzme hızsız nefes tutan yaratık | K73f (:387, :400) | Paket yaratığı gelirse kural |
| U1a onayları | U1a (:985) | Alev zemini lav gibi, itilen süzülen lava girer mi, su altı süzülene işler mi |
| U1b alt sınıf listesi | U1a (:983), U1b dalı | Pulkanat adı, Ejder Muhafızı 14/15, `icerik/` ile yerelde çalışma |
| K72 tavan bölgeleri | K72 (:1053) | 12 harita `ONAYLI_BOLGE` (`scripts/k72-tavan-bolge.py:43` hâlâ boş) |
| Gerçek katlı haritalar | K72 (:1052) | Harita tasarımı kullanıcıyla |
| Denge kaymaları (Dağ — Karakol %20, su altı/kıyı %100) | K73a (:910), K73f (:400) | "Dungeondex öncesi tam test turu" |
| BK1 bataklık önerileri | `BATAKLIK-TANI.md` | 1 ve 3 K74'te yapıldı (sürüm 76); 2 ölü `sinkMud` ve zemin tehlike tablosu açık |
| SD1 ilke 5 yorumu | `SADELESTIRME-DENETIM.md:33` | Yapılamayanı gizle mi, soluk + neden mi |

## Önerilen sıradaki 5 CC işi (bağımlılık sırasıyla)

⚑ = kural sürümü artırır (aynı anda tek şerit; sıradaki 75).

1. **SD4 kararı ve birleştirme** (sürümsüz): dal hazır; birleşirse CLAUDE.md SD3 satırı güncellenir. Diğer arayüz işlerinden (MB6b) önce, çünkü ad katmanı ortak.
2. **MB6b binek arayüzü** (sürümsüz): motor ve YZ tamam, oyuncunun eli eksik. SD4'ten sonra (metinler).
3. **BK1 öneri 1, tehlike katmanına zemin** (sürümsüz, yalnız arayüz): öneri 2–3'ten bağımsız, hemen yapılabilir.
4. ⚑ **Truesight motor yolları** (75): fırsat saldırısı görme, hareket algısı, Cleave, mastery ikinci hedef, ejderha Algısı tek sorguya (`truesightSees`). Kullanıcı kararı gerekmez (SRD).
5. ⚑ **Hallow Extra Effect** (76, kullanıcı kararından sonra) ya da ⚑ **BK1 öneri 3, `sinkMud` bedeli** (aynı sürüm şeridi sırasıyla). U1b Görev 1–4 yalnız yerelde (`icerik/`) yapılabilir; bulut oturumuna verilmemeli.
