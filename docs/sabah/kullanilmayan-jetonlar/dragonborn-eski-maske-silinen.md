# Eski Dragonborn ten maskelerinin silinmesi (Kuyruk KJ2)

**Kullanıcı kararı:** oyunda görünmeyecek dosyalar tutulmaz. KJ1 raporunda (`liste.md` §7) "çalışma anında okunmuyor görünen" 264 eski Dragonborn ten maskesi
(`public/characters/maske/dragonborn-<erkek|kadin>-<sınıf>-<hücre>.png`) için önce kimin okuduğu denetlendi, okuyan çıkmayınca dosyalar tek tek `git rm` ile silindi.
Bu belge denetimin kanıtını ve silinen listeyi verir. Yalnız görünüm/veri temizliği: kural ve kayıt sürümü değişmedi.

## Özet

| | Sayı |
|---|---:|
| **Silinen** (`git rm`, dosya dosya) | **264** (241.835 bayt ≈ 236 kB) |
| Bırakılan Dragonborn maskesi: sınıf-genel `maske/dragonborn-<male\|female>-<sınıf>.png` | 24 |
| Bırakılan diğer ırk `maske/` dosyası (elf 281, gnome 280, goliath 285, human 283, tiefling 287) | 1416 |
| `maske-pul/` (dokunulmadı) | 266 |
| `maske-el/` (dokunulmadı) | 0 |
| `maske/` klasörü | 1704 → **1440** |
| Güncellenen test | 2 dosya: `src/ui/tint.test.ts`, `src/battle/baglamaKq6.test.ts` (§4) |

**Sonuç:** oyunda (çözücü) ve üretim hattında (`maske-pul/` üreticisi) bu dosyaları okuyan yok; yalnız iki test dosya varlığı bekliyordu (güncellendi) ve 8 eski inceleme betiği
okuyordu (§1.1; maske yokken çökmeden devam ediyorlar, engel sayılmadı). Silinmeyen eski dosya yok: 264'ün hepsi silindi. Bırakılanlar ve nedenleri §6'da.

## 1. Kim okuyordu?

| Okuyucu | Tür | Ne yapıyor | Sonuç |
|---|---|---|---|
| `src/ui/Avatar.tsx:125,208` `useTinted(src, avatar.tint)` → `src/ui/tint.ts:189-195` `maskUrlFor` | oyun (çalışma anı) | Dragonborn her zaman beyaz taban hücre jetonu + `pul` boyama alır (`src/battle/avatar.ts:186`, `beyazTaban` her Dragonborn'da açık); `pul` boyamada maske `maske-pul/`, `maske/` yalnız `pul` olmayan boyamada | **okumuyor** (§2) |
| `scripts/dragonborn-pul-maske.py` ve yüklediği `dragonborn-desen-v2.py`, `dragonborn-desen.py`, `dragonborn-desen-maske.py`, `dragonborn-desen-renk.py` | üretici (`maske-pul/`, `data/dragonborn-pul.json`) | yalnız jeton `.webp`, `data/dragonborn-pul-duzeltme.json`, `data/dragonborn-pul-kapali.json` okur; v1 modüllerinin gövdesi `__main__` korumalı | **okumuyor** (§3: `maske/` olmayınca ve olunca çıktı bayt bayt aynı) |
| `scripts/soy-maske.ts` (`npm run soy-maske`) | üretici | `--alt` döngüsü Dragonborn'u atlar (`:215`, "yedek maske" notu); ana döngü yalnız sınıf-genel `<ırk>-<male\|female>-<sınıf>` jetonlarını yazar (kalan 24 maske) | okumuyor, bu 264'ü yazmıyor |
| `scripts/soy-maske-dragonborn.ts` | eski üretici (npm betiği yok) | bu 264 dosyayı **yazar** (`:97`); jeton `.webp` ve `data/soy-maske-dragonborn-el.json` (dosya yok) okur | okuyan değil; yeniden çalıştırılırsa dosyaları geri üretir (§6) |
| `src/ui/tint.test.ts:18,47` | test | Dragonborn GR jetonu için `maskUrlFor(a.src)` ile `maske/…-GR.png` varlığını bekliyordu (24 dosya; çalışma anında istenen yol değil) | **güncellendi** (§4) |
| `src/battle/baglamaKq6.test.ts:13,55` | test | `maske/` listesini `data/soy-maske-dragonborn-rapor.json` `n ≥ 30` ile eşliyordu (264 dosya) | **güncellendi** (§4) |
| `data/soy-maske-dragonborn-rapor.json` (266 jeton; `n ≥ 30` olan 264 = silinen küme), `data/soy-maske-alt-rapor.json` (264 bayat Dragonborn girdisi), `data/soy-renkleri.json` `lineagesAltMaske` (10) ve `maskAlt` | veri | yalnız ad/sayı taşır, dosya okumaz; dragonborn-rapor'u yalnız `baglamaKq6.test.ts` okuyordu | dokunulmadı (§6) |

### 1.1 Eski inceleme betikleri (8): okuyor ama engel sayılmadı

Hepsi tek seferlik inceleme/rapor betiği; oyunun ya da üretim hattının girdisi değil. Maske yokken hata vermeden devam ediyorlar. Kullanıcı kararı (oyunda görünmeyen dosya tutulmaz) gereği silmeyi engellemediler; betikler **değiştirilmedi**.

| Betik | Okuma | Maske yokken |
|---|---|---|
| `scripts/_db-hepsi.ts:15` | `maske/<jeton>.png` | `.catch(() => null)`; ayrıca pul v2'den beri `tintPixels` `pul` boyamada 0 piksel değiştirir (`src/ui/tint.ts:76`), çıktısı zaten etkisiz |
| `scripts/dragonborn-teshis.ts:16` | aynı | aynı |
| `scripts/dragonborn-renk-sayfa.ts:16` | `karsilastir` modunun "maske" satırları; `lineageTint(…, 'maske')` çağıran tek uygulama dışı betik | `.catch(() => null)`; "çarpma" satırları zaten `pul` ile etkisiz |
| `scripts/dragonborn-desen.py:121-123`, `scripts/dragonborn-desen-maske.py:52` | v1 pul deseni prototipi (`__main__`) | `os.path.exists` → `maske yok`; v2 onaylanıp uygulandı (DECISIONS) |
| `scripts/cc-ten-denetim.py:18` | Gladyatör ten kayması denetimi, Dragonborn Fighter ID1–ID11 | maske yoksa baş bölgesi ton sezgisiyle ölçer (Orc'taki yol); yeniden çalıştırılırsa Dragonborn ölçümü bu yoldan gelir |
| `scripts/soy-benek-teshis.py:140` | `--irk hepsi/dragonborn` | `load_mask` → `None`, maskesiz ırk gibi |
| `scripts/baglama-teshis.py:13` | `os.path.exists` | Dragonborn hücre jetonlarını "maskesiz" raporlar (zaten `maske-pul/`'a bakmıyordu) |

## 2. Çözücü doğrulaması (gerçek kod)

Betik: `betik/dragonborn-maske-coz.ts` (`npx vite-node …`; salt okunur). Dragonborn için 2 cinsiyet × 12 sınıf × (121 alt sınıf kimliği + alt sınıfsız + bilinmeyen) × seviye 1–20 × (soysuz + 10 soy) = **649.440** `sheetAvatar` çağrısı; her sonucun zincirinin her halkası için (`Avatar.tsx` `useTinted` gibi) `maskUrlFor(url, avatar.tint)`.

| | Silmeden önce (`dragonborn-maske-coz-ozet-silme-oncesi.json`) | Sonra (`dragonborn-maske-coz-ozet.json`) |
|---|---:|---:|
| birincil jeton: hücreli / sınıf-genel | 649.440 / 0 | 649.440 / 0 |
| `avatar.tint` türü: `pul` / tint yok / `lch` ya da `gradient` | 590.400 / 59.040 / 0 | 590.400 / 59.040 / 0 |
| istenen `maske-pul/…` (hücreli) dosya | 266 (266'sı diskte) | 266 (266'sı diskte) |
| istenen **eski hücreli** `maske/dragonborn-<erkek\|kadin>-*` | **0** | **0** |
| istenen sınıf-genel `maske/dragonborn-<male\|female>-*` | 0 | 0 |

Eski yol yalnız `lineageTint('dragonborn', soy, cinsiyet, 'maske')` (`src/battle/avatar.ts:65`, `lineagesAltMaske`) ile erişilir (240 kombinasyon eski hücreli URL'ye çıkar); `rg` ile bu seçeneği çağıran: `scripts/dragonborn-renk-sayfa.ts:15` ve `src/battle/baglamaKq6.test.ts:65` (yalnız tablo sınaması, dosya okumaz). Uygulama kodu çağırmaz.
Yan bilgi (silmeden bağımsız, önceden de böyleydi): sınıf-genel jeton yedek zincirde `pul` boyamayla istenirse `maske-pul/dragonborn-<male|female>-<sınıf>.png` (24 dosya) yok, jeton boyanmadan gösterilir.

## 3. Üretici bağımsızlık deneyi

`dragonborn-pul-maske.py` ve modülleri iki kum havuzunda (depo dışı, jeton `.webp`'leri sembolik bağ) çalıştırıldı: **A** `public/characters/maske/` hiç yok, **B** gerçek `maske/` dizinine bağ var. Sonuç: 266/266 `maske-pul/*.png` **bayt bayt aynı** (A ↔ B), `data/dragonborn-pul.json` ve `DRAGONBORN-PUL-KAPI.md` aynı. Yani üretici eski maskelerden etkilenmiyor.
Depodakilerle karşılaştırma (A ↔ depo): 264/266 bayt özdeş; farklı olan yalnız `dragonborn-erkek-cleric-ID9` ve `dragonborn-kadin-cleric-ID9` (jeton görseli sonradan değişti; `DRAGONBORN-PUL-KAPI.md`'deki mevcut not). Eski maskelerle ilgisi yok (A ≡ B); bu görevde dokunulmadı.

## 4. Test güncellemeleri

Gerekçe: iki test, çalışma anında hiç istenmeyen eski `maske/dragonborn-*` dosyalarının **varlığını** bekliyordu; oyunun gerçekten kullandığı pul maskesini sınayacak şekilde güncellendi (sınanan şey aynı: "bağlı Dragonborn jetonunun ten maskesi var").

- `src/ui/tint.test.ts`: `masks` kümesine `maske-pul/*.png` eklendi ve kontrol `maskUrlFor(a.src)` yerine `maskUrlFor(a.src, a.tint)` oldu (oyunun isteyeceği URL; diğer ırklarda tint `maske/`'ye gittiği için sonuç aynı).
- `src/battle/baglamaKq6.test.ts`: Dragonborn adları için beklenti `maske/` + `soy-maske-dragonborn-rapor.json` yerine `PUL.has(name)` oldu (266 hücre jetonunun hepsinde var; aynı dosyada `:70-74` testi 266'sını ayrıca sınıyor); kullanılmayan `dragonRep` içe aktarması kalktı. Diğer ırklar aynı.
- `src/ui/avatar.test.ts` ve 24 sınıf-genel jeton: dokunulmadı.

## 5. Doğrulama

| Adım | Sonuç |
|---|---|
| `npm run typecheck` | temiz |
| jeton/ton/maskeyle ilgili 18 test dosyası (`rg` ile bulundu) | 18/18 geçti, 154 test |
| `src/ui src/data src/screens src/app src/content` (tamamı) | 123 dosya geçti, 1 atlandı; 930 test geçti, 4 atlandı |
| `npm run build` | tamam; ana parça 448,80 kB / sınır 500 kB |
| `npm run check:harita` (`PW_CHROMIUM=/opt/pw-browsers/chromium`) | çıkış kodu 0; 92 harita/varyant "tamam", 0 başarısız. Son satır: `Denenen 92, geçen 92, düşen 0.` |
| Çözücü (§2) | eski hücreli istek 0 |
| Tam `npm test` | çalıştırılmadı (yalnız görünüm varlığı silindi; CLAUDE.md hafif doğrulama modu) |

## 6. Bırakılanlar ve nedeni

- **24 sınıf-genel maske** (`maske/dragonborn-<male|female>-<sınıf>.png`): kullanıcı 24 sınıf-genel Dragonborn jetonuna ve `src/ui/avatar.test.ts`'e dokunulmamasını istedi; maskeleri `data/soy-maske-rapor.json` içinde 120 sprite arasında ve `npm run soy-maske` ana döngüsü onları yazıyor (`handMask.test.ts` 120 sayısını sınıyor). Çözücü bunları da hiç istemiyor (§2); ayrı bir karar konusu.
- **Diğer ırkların `maske/` dosyaları (1416), `maske-pul/` (266), `maske-el/`:** kapsam dışı, dokunulmadı.
- **Yetim kalan ama silinmeyen (bu görevin kapsamı değildi), onayınızı bekliyor** (KJ3'te onay gelip işlendi; sonuç §7.1'de):
  - `scripts/soy-maske-dragonborn.ts`: çalıştırılırsa 264 dosyayı geri üretir (npm betiği yok); emekli edilebilir.
  - 8 eski inceleme betiği (§1.1).
  - `data/soy-maske-dragonborn-rapor.json` (artık hiçbir test/kod okumuyor), `data/soy-maske-alt-rapor.json` içindeki 264 bayat Dragonborn girdisi (`baglamaKq6.test.ts:53` toplamı `6 * 264 + 10` diye sabitliyor), `data/soy-renkleri.json` `lineagesAltMaske`/`maskAlt` ve `lineageTint(…, 'maske')` seçeneği: eski yedek yol artık dosyasız.
  - `docs/VARLIK-ENVANTERI.md` yeniden üretilmedi (`npm run varlik-envanter`); KJ1 `liste.md` `6a1b6d8` durumunu anlatır (§7'deki 264 eski maske artık yok).

## 7. Geri alma

Silme tek commit'te; bir dosyayı geri getirmek için (silme commit'inin üst sürümünden):

```bash
git checkout <silme-commit>^ -- public/characters/maske/dragonborn-erkek-fighter-ID4.png
```

Ya da `npx vite-node scripts/soy-maske-dragonborn.ts [jeton…]` ile jetondan yeniden üretilir (eskisiyle aynı bayt çıkması garanti değil).

## 7.1 Devam: yetimlerin temizlenmesi (Kuyruk KJ3, kullanıcı onayı 2026-11-19)

§6'daki yetimler için onay geldi. Her dosya silinmeden önce içe aktaran/çağıran var mı denetlendi (`rg`, betik içe aktarmaları, CLAUDE.md/DECISIONS başvuruları, son değişiklik tarihi, canlı üreticiyle deneme). Sonuç:

| Öğe | Sonuç | Neden |
|---|---|---|
| `scripts/soy-maske-dragonborn.ts` | **silindi** | eski üretici; çağıranı yok (`soy-maske.ts`'te yalnız açıklama satırı vardı) |
| `data/soy-maske-dragonborn-rapor.json` | **silindi** | okuyan kalmadı (test KJ2'de pul maskesine bağlanmıştı) |
| `scripts/_db-hepsi.ts`, `scripts/dragonborn-teshis.ts`, `scripts/dragonborn-renk-sayfa.ts` | **silindi** | Dragonborn'a özel, çağıranı yok, son değişiklik 2026-11-17; `tintPixels` `pul` boyamada 0 piksel değiştirdiği için çıktıları zaten etkisizdi |
| `lineagesAltMaske` (`data/soy-renkleri.json`, 10 kayıt) ve `lineageTint(…, 'maske')` seçeneği | **silindi** | yalnız `races.dragonborn` içinde var (tabloda başka ırkta anahtar yok); çağıranlar silinen betik ve bir test iddiasıydı (kaldırıldı); `lineageTint` 4. parametresi artık `boolean` |
| `scripts/dragonborn-desen.py`, `scripts/dragonborn-desen-maske.py` | **kaldı** | canlı pul üreticisinin içe aktardığı modüller: `dragonborn-pul-maske.py` → `dragonborn-desen-v2.py` → `dragonborn-desen.py` → `dragonborn-desen-maske.py`. Negatif kontrol: ikisi olmadan üretici `FileNotFoundError` verir |
| `scripts/soy-benek-teshis.py` | **kaldı** | `scripts/soy-golge-teshis.py` içe aktarıyor (TG1); CLAUDE.md ve DECISIONS'ta TB1/TG1 aracı olarak belgeli; Tiefling/Goliath/Elf/Orc'a hizmet ediyor, yalnız `--irk dragonborn` dalı eski |
| `scripts/cc-ten-denetim.py` | **kaldı** | Tiefling/Goliath/Orc/Dragonborn Gladyatör denetimi, bugün (CC kesim adım 2) eklendi; çok ırklı |
| `scripts/baglama-teshis.py` | **kaldı** | bütün ırkların jeton bağlama teşhisi; bugün başka bir oturumca `formlar` için güncellendi, DECISIONS'ta 2 kez geçiyor |

**Düzeltme:** §1.1'de bu 8 betiğin hepsini "tek seferlik/eski inceleme betiği" diye anmıştım; 5'i için yanlıştı (içe aktarılan modüller ve bugün güncellenen çok ırklı araçlar). Üç çok ırklı aracın (`soy-benek-teshis.py`, `cc-ten-denetim.py`, `baglama-teshis.py`) Dragonborn dalı artık `maske/` bulamıyor (maskesiz ırk gibi ya da ton sezgisiyle işler); `maske-pul/`'a bağlamak ya da silmek ayrı karar.

**Doğrulama (çözücü ve üreticiler):**
- `dragonborn-pul-maske.py`, silmeler uygulanmış güncel `scripts/*.py` kümesiyle kum havuzunda (depo dışı) çalıştı: 266 `maske-pul/*.png` depodakilerle **bayt bayt aynı**, `data/dragonborn-pul.json` ve `DRAGONBORN-PUL-KAPI.md` aynı. (KJ2'deki iki Cleric ID9 farkı o arada başka oturumca yeniden üretilip işlendi.)
- `npm run soy-maske` ve `npm run soy-maske -- --alt`: geçici `git worktree`'de (depo dışı, HEAD `08578ec`) çalıştırıldı. `package.json` zinciri tek komut (`vite-node scripts/soy-maske.ts`); Dragonborn betiğini hiç çağırmıyor, `--alt` döngüsü Dragonborn'u zaten atlıyor. Sonuç: `maske/` altında Dragonborn **hücreli** dosya üretilmedi (0); 24 sınıf-genel Dragonborn maskesi önceki baytlarla aynı yeniden yazıldı; diğer ırkların maskeleri değişmedi. Silmeler ve düzenlemeler uygulanıp iki komut yeniden koşulunca çıktı bir öncekiyle **özdeş** (1710 dosya, 0 fark): Dark Elf ve diğer ırklar etkilenmiyor.
- Yan bulgular (Dragonborn ile ilgisiz, bu görevde dokunulmadı): (a) koşuda sekiz `*-cleric-ID9` maskesi depodakinden farklı çıktı (jeton görselleri Cleric ID9 halka işinde sonradan değişti; depodaki maskeler eski görselden); (b) `npm run soy-maske` `data/soy-maske-rapor.json`'u 120 yerine 144 sprite ile yazıyor (Human eklenir; depodaki dosya 2026-11-09'dan kalma), `src/ui/handMask.test.ts:34` 120 bekliyor: depoda `npm run soy-maske` çalıştırılırsa o test önce güncellenmeli.

| Adım | Sonuç |
|---|---|
| `npm run typecheck` | temiz |
| tint/bağlama/avatar/soy-maske testleri (`rg` ile bulunan 20 dosya, `scriptsWindows` dahil) | 20/20 geçti, 184 test |
| `src/ui src/data src/screens src/app src/content src/rules` (tamamı) | 155 dosya geçti, 1 atlandı; 1223 test geçti, 4 atlandı |
| `npm run build` | tamam; ana parça 448,07 kB / sınır 500 kB |
| `npm run check:harita` (`PW_CHROMIUM=/opt/pw-browsers/chromium`) | çıkış kodu 0; 92 harita/varyant "tamam", 0 başarısız. Son satır: `Denenen 92, geçen 92, düşen 0.` |

Hâlâ karar bekleyenler: üç çok ırklı aracın Dragonborn dalı (maske-pul'a bağlama ya da silme), v1 modüllerinin (`dragonborn-desen*.py`) v2'ye taşınıp silinmesi (üretici bağımlılığı, ayrı refaktör), Dragonborn'un ölü `maskAlt` kaydı (`soy-renkleri.json`; onaylı listede yoktu).

## 8. Silinen dosyalar (264)

`public/characters/maske/dragonborn-<cinsiyet>-<sınıf>-<hücre>.png`; hücre: `GR` Gariban, `ID` alt sınıf, `WL-`/`SC-`/`WZ-` Warlock/Sorcerer/Wizard hücreleri.

| Sınıf | Cinsiyet | Adet | Hücreler |
|---|---|---:|---|
| barbarian | erkek | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| barbarian | kadin | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| bard | erkek | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| bard | kadin | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| cleric | erkek | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| cleric | kadin | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| druid | erkek | 8 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7 |
| druid | kadin | 9 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8 |
| fighter | erkek | 13 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10, ID11, ID12 |
| fighter | kadin | 12 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10, ID12 |
| monk | erkek | 12 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10, ID11 |
| monk | kadin | 12 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10, ID11 |
| paladin | erkek | 11 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10 |
| paladin | kadin | 11 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9, ID10 |
| ranger | erkek | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| ranger | kadin | 10 | GR, ID1, ID2, ID3, ID4, ID5, ID6, ID7, ID8, ID9 |
| rogue | erkek | 10 | GR, ID1, ID2, ID3, ID5, ID6, ID7, ID8, ID9, ID10 |
| rogue | kadin | 10 | GR, ID1, ID2, ID3, ID5, ID6, ID7, ID8, ID9, ID10 |
| sorcerer | erkek | 10 | GR, SC-1, SC-2, SC-3, SC-4, SC-5, SC-6, SC-7, SC-8, SC-9 |
| sorcerer | kadin | 10 | GR, SC-1, SC-2, SC-3, SC-4, SC-5, SC-6, SC-7, SC-8, SC-9 |
| warlock | erkek | 12 | GR, WL-1, WL-2, WL-3, WL-4, WL-5, WL-6, WL-7, WL-8, WL-9, WL-10, WL-11 |
| warlock | kadin | 12 | GR, WL-1, WL-2, WL-3, WL-4, WL-5, WL-6, WL-7, WL-8, WL-9, WL-10, WL-11 |
| wizard | erkek | 16 | GR, WZ-A1, WZ-A2, WZ-A3, WZ-A4, WZ-A5, WZ-A6, WZ-A7, WZ-A8, WZ-B1, WZ-B2, WZ-B3, WZ-B4, WZ-B5, WZ-B6, WZ-B7 |
| wizard | kadin | 16 | GR, WZ-A1, WZ-A2, WZ-A3, WZ-A4, WZ-A5, WZ-A6, WZ-A7, WZ-A8, WZ-B1, WZ-B2, WZ-B3, WZ-B4, WZ-B5, WZ-B6, WZ-B7 |

Toplam 264. Tam liste (alfabetik):

```
public/characters/maske/dragonborn-erkek-barbarian-GR.png
public/characters/maske/dragonborn-erkek-barbarian-ID1.png
public/characters/maske/dragonborn-erkek-barbarian-ID2.png
public/characters/maske/dragonborn-erkek-barbarian-ID3.png
public/characters/maske/dragonborn-erkek-barbarian-ID4.png
public/characters/maske/dragonborn-erkek-barbarian-ID5.png
public/characters/maske/dragonborn-erkek-barbarian-ID6.png
public/characters/maske/dragonborn-erkek-barbarian-ID7.png
public/characters/maske/dragonborn-erkek-barbarian-ID8.png
public/characters/maske/dragonborn-erkek-barbarian-ID9.png
public/characters/maske/dragonborn-erkek-bard-GR.png
public/characters/maske/dragonborn-erkek-bard-ID1.png
public/characters/maske/dragonborn-erkek-bard-ID2.png
public/characters/maske/dragonborn-erkek-bard-ID3.png
public/characters/maske/dragonborn-erkek-bard-ID4.png
public/characters/maske/dragonborn-erkek-bard-ID5.png
public/characters/maske/dragonborn-erkek-bard-ID6.png
public/characters/maske/dragonborn-erkek-bard-ID7.png
public/characters/maske/dragonborn-erkek-bard-ID8.png
public/characters/maske/dragonborn-erkek-bard-ID9.png
public/characters/maske/dragonborn-erkek-cleric-GR.png
public/characters/maske/dragonborn-erkek-cleric-ID1.png
public/characters/maske/dragonborn-erkek-cleric-ID2.png
public/characters/maske/dragonborn-erkek-cleric-ID3.png
public/characters/maske/dragonborn-erkek-cleric-ID4.png
public/characters/maske/dragonborn-erkek-cleric-ID5.png
public/characters/maske/dragonborn-erkek-cleric-ID6.png
public/characters/maske/dragonborn-erkek-cleric-ID7.png
public/characters/maske/dragonborn-erkek-cleric-ID8.png
public/characters/maske/dragonborn-erkek-cleric-ID9.png
public/characters/maske/dragonborn-erkek-druid-GR.png
public/characters/maske/dragonborn-erkek-druid-ID1.png
public/characters/maske/dragonborn-erkek-druid-ID2.png
public/characters/maske/dragonborn-erkek-druid-ID3.png
public/characters/maske/dragonborn-erkek-druid-ID4.png
public/characters/maske/dragonborn-erkek-druid-ID5.png
public/characters/maske/dragonborn-erkek-druid-ID6.png
public/characters/maske/dragonborn-erkek-druid-ID7.png
public/characters/maske/dragonborn-erkek-fighter-GR.png
public/characters/maske/dragonborn-erkek-fighter-ID1.png
public/characters/maske/dragonborn-erkek-fighter-ID10.png
public/characters/maske/dragonborn-erkek-fighter-ID11.png
public/characters/maske/dragonborn-erkek-fighter-ID12.png
public/characters/maske/dragonborn-erkek-fighter-ID2.png
public/characters/maske/dragonborn-erkek-fighter-ID3.png
public/characters/maske/dragonborn-erkek-fighter-ID4.png
public/characters/maske/dragonborn-erkek-fighter-ID5.png
public/characters/maske/dragonborn-erkek-fighter-ID6.png
public/characters/maske/dragonborn-erkek-fighter-ID7.png
public/characters/maske/dragonborn-erkek-fighter-ID8.png
public/characters/maske/dragonborn-erkek-fighter-ID9.png
public/characters/maske/dragonborn-erkek-monk-GR.png
public/characters/maske/dragonborn-erkek-monk-ID1.png
public/characters/maske/dragonborn-erkek-monk-ID10.png
public/characters/maske/dragonborn-erkek-monk-ID11.png
public/characters/maske/dragonborn-erkek-monk-ID2.png
public/characters/maske/dragonborn-erkek-monk-ID3.png
public/characters/maske/dragonborn-erkek-monk-ID4.png
public/characters/maske/dragonborn-erkek-monk-ID5.png
public/characters/maske/dragonborn-erkek-monk-ID6.png
public/characters/maske/dragonborn-erkek-monk-ID7.png
public/characters/maske/dragonborn-erkek-monk-ID8.png
public/characters/maske/dragonborn-erkek-monk-ID9.png
public/characters/maske/dragonborn-erkek-paladin-GR.png
public/characters/maske/dragonborn-erkek-paladin-ID1.png
public/characters/maske/dragonborn-erkek-paladin-ID10.png
public/characters/maske/dragonborn-erkek-paladin-ID2.png
public/characters/maske/dragonborn-erkek-paladin-ID3.png
public/characters/maske/dragonborn-erkek-paladin-ID4.png
public/characters/maske/dragonborn-erkek-paladin-ID5.png
public/characters/maske/dragonborn-erkek-paladin-ID6.png
public/characters/maske/dragonborn-erkek-paladin-ID7.png
public/characters/maske/dragonborn-erkek-paladin-ID8.png
public/characters/maske/dragonborn-erkek-paladin-ID9.png
public/characters/maske/dragonborn-erkek-ranger-GR.png
public/characters/maske/dragonborn-erkek-ranger-ID1.png
public/characters/maske/dragonborn-erkek-ranger-ID2.png
public/characters/maske/dragonborn-erkek-ranger-ID3.png
public/characters/maske/dragonborn-erkek-ranger-ID4.png
public/characters/maske/dragonborn-erkek-ranger-ID5.png
public/characters/maske/dragonborn-erkek-ranger-ID6.png
public/characters/maske/dragonborn-erkek-ranger-ID7.png
public/characters/maske/dragonborn-erkek-ranger-ID8.png
public/characters/maske/dragonborn-erkek-ranger-ID9.png
public/characters/maske/dragonborn-erkek-rogue-GR.png
public/characters/maske/dragonborn-erkek-rogue-ID1.png
public/characters/maske/dragonborn-erkek-rogue-ID10.png
public/characters/maske/dragonborn-erkek-rogue-ID2.png
public/characters/maske/dragonborn-erkek-rogue-ID3.png
public/characters/maske/dragonborn-erkek-rogue-ID5.png
public/characters/maske/dragonborn-erkek-rogue-ID6.png
public/characters/maske/dragonborn-erkek-rogue-ID7.png
public/characters/maske/dragonborn-erkek-rogue-ID8.png
public/characters/maske/dragonborn-erkek-rogue-ID9.png
public/characters/maske/dragonborn-erkek-sorcerer-GR.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-1.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-2.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-3.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-4.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-5.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-6.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-7.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-8.png
public/characters/maske/dragonborn-erkek-sorcerer-SC-9.png
public/characters/maske/dragonborn-erkek-warlock-GR.png
public/characters/maske/dragonborn-erkek-warlock-WL-1.png
public/characters/maske/dragonborn-erkek-warlock-WL-10.png
public/characters/maske/dragonborn-erkek-warlock-WL-11.png
public/characters/maske/dragonborn-erkek-warlock-WL-2.png
public/characters/maske/dragonborn-erkek-warlock-WL-3.png
public/characters/maske/dragonborn-erkek-warlock-WL-4.png
public/characters/maske/dragonborn-erkek-warlock-WL-5.png
public/characters/maske/dragonborn-erkek-warlock-WL-6.png
public/characters/maske/dragonborn-erkek-warlock-WL-7.png
public/characters/maske/dragonborn-erkek-warlock-WL-8.png
public/characters/maske/dragonborn-erkek-warlock-WL-9.png
public/characters/maske/dragonborn-erkek-wizard-GR.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A1.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A2.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A3.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A4.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A5.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A6.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A7.png
public/characters/maske/dragonborn-erkek-wizard-WZ-A8.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B1.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B2.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B3.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B4.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B5.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B6.png
public/characters/maske/dragonborn-erkek-wizard-WZ-B7.png
public/characters/maske/dragonborn-kadin-barbarian-GR.png
public/characters/maske/dragonborn-kadin-barbarian-ID1.png
public/characters/maske/dragonborn-kadin-barbarian-ID2.png
public/characters/maske/dragonborn-kadin-barbarian-ID3.png
public/characters/maske/dragonborn-kadin-barbarian-ID4.png
public/characters/maske/dragonborn-kadin-barbarian-ID5.png
public/characters/maske/dragonborn-kadin-barbarian-ID6.png
public/characters/maske/dragonborn-kadin-barbarian-ID7.png
public/characters/maske/dragonborn-kadin-barbarian-ID8.png
public/characters/maske/dragonborn-kadin-barbarian-ID9.png
public/characters/maske/dragonborn-kadin-bard-GR.png
public/characters/maske/dragonborn-kadin-bard-ID1.png
public/characters/maske/dragonborn-kadin-bard-ID2.png
public/characters/maske/dragonborn-kadin-bard-ID3.png
public/characters/maske/dragonborn-kadin-bard-ID4.png
public/characters/maske/dragonborn-kadin-bard-ID5.png
public/characters/maske/dragonborn-kadin-bard-ID6.png
public/characters/maske/dragonborn-kadin-bard-ID7.png
public/characters/maske/dragonborn-kadin-bard-ID8.png
public/characters/maske/dragonborn-kadin-bard-ID9.png
public/characters/maske/dragonborn-kadin-cleric-GR.png
public/characters/maske/dragonborn-kadin-cleric-ID1.png
public/characters/maske/dragonborn-kadin-cleric-ID2.png
public/characters/maske/dragonborn-kadin-cleric-ID3.png
public/characters/maske/dragonborn-kadin-cleric-ID4.png
public/characters/maske/dragonborn-kadin-cleric-ID5.png
public/characters/maske/dragonborn-kadin-cleric-ID6.png
public/characters/maske/dragonborn-kadin-cleric-ID7.png
public/characters/maske/dragonborn-kadin-cleric-ID8.png
public/characters/maske/dragonborn-kadin-cleric-ID9.png
public/characters/maske/dragonborn-kadin-druid-GR.png
public/characters/maske/dragonborn-kadin-druid-ID1.png
public/characters/maske/dragonborn-kadin-druid-ID2.png
public/characters/maske/dragonborn-kadin-druid-ID3.png
public/characters/maske/dragonborn-kadin-druid-ID4.png
public/characters/maske/dragonborn-kadin-druid-ID5.png
public/characters/maske/dragonborn-kadin-druid-ID6.png
public/characters/maske/dragonborn-kadin-druid-ID7.png
public/characters/maske/dragonborn-kadin-druid-ID8.png
public/characters/maske/dragonborn-kadin-fighter-GR.png
public/characters/maske/dragonborn-kadin-fighter-ID1.png
public/characters/maske/dragonborn-kadin-fighter-ID10.png
public/characters/maske/dragonborn-kadin-fighter-ID12.png
public/characters/maske/dragonborn-kadin-fighter-ID2.png
public/characters/maske/dragonborn-kadin-fighter-ID3.png
public/characters/maske/dragonborn-kadin-fighter-ID4.png
public/characters/maske/dragonborn-kadin-fighter-ID5.png
public/characters/maske/dragonborn-kadin-fighter-ID6.png
public/characters/maske/dragonborn-kadin-fighter-ID7.png
public/characters/maske/dragonborn-kadin-fighter-ID8.png
public/characters/maske/dragonborn-kadin-fighter-ID9.png
public/characters/maske/dragonborn-kadin-monk-GR.png
public/characters/maske/dragonborn-kadin-monk-ID1.png
public/characters/maske/dragonborn-kadin-monk-ID10.png
public/characters/maske/dragonborn-kadin-monk-ID11.png
public/characters/maske/dragonborn-kadin-monk-ID2.png
public/characters/maske/dragonborn-kadin-monk-ID3.png
public/characters/maske/dragonborn-kadin-monk-ID4.png
public/characters/maske/dragonborn-kadin-monk-ID5.png
public/characters/maske/dragonborn-kadin-monk-ID6.png
public/characters/maske/dragonborn-kadin-monk-ID7.png
public/characters/maske/dragonborn-kadin-monk-ID8.png
public/characters/maske/dragonborn-kadin-monk-ID9.png
public/characters/maske/dragonborn-kadin-paladin-GR.png
public/characters/maske/dragonborn-kadin-paladin-ID1.png
public/characters/maske/dragonborn-kadin-paladin-ID10.png
public/characters/maske/dragonborn-kadin-paladin-ID2.png
public/characters/maske/dragonborn-kadin-paladin-ID3.png
public/characters/maske/dragonborn-kadin-paladin-ID4.png
public/characters/maske/dragonborn-kadin-paladin-ID5.png
public/characters/maske/dragonborn-kadin-paladin-ID6.png
public/characters/maske/dragonborn-kadin-paladin-ID7.png
public/characters/maske/dragonborn-kadin-paladin-ID8.png
public/characters/maske/dragonborn-kadin-paladin-ID9.png
public/characters/maske/dragonborn-kadin-ranger-GR.png
public/characters/maske/dragonborn-kadin-ranger-ID1.png
public/characters/maske/dragonborn-kadin-ranger-ID2.png
public/characters/maske/dragonborn-kadin-ranger-ID3.png
public/characters/maske/dragonborn-kadin-ranger-ID4.png
public/characters/maske/dragonborn-kadin-ranger-ID5.png
public/characters/maske/dragonborn-kadin-ranger-ID6.png
public/characters/maske/dragonborn-kadin-ranger-ID7.png
public/characters/maske/dragonborn-kadin-ranger-ID8.png
public/characters/maske/dragonborn-kadin-ranger-ID9.png
public/characters/maske/dragonborn-kadin-rogue-GR.png
public/characters/maske/dragonborn-kadin-rogue-ID1.png
public/characters/maske/dragonborn-kadin-rogue-ID10.png
public/characters/maske/dragonborn-kadin-rogue-ID2.png
public/characters/maske/dragonborn-kadin-rogue-ID3.png
public/characters/maske/dragonborn-kadin-rogue-ID5.png
public/characters/maske/dragonborn-kadin-rogue-ID6.png
public/characters/maske/dragonborn-kadin-rogue-ID7.png
public/characters/maske/dragonborn-kadin-rogue-ID8.png
public/characters/maske/dragonborn-kadin-rogue-ID9.png
public/characters/maske/dragonborn-kadin-sorcerer-GR.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-1.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-2.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-3.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-4.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-5.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-6.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-7.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-8.png
public/characters/maske/dragonborn-kadin-sorcerer-SC-9.png
public/characters/maske/dragonborn-kadin-warlock-GR.png
public/characters/maske/dragonborn-kadin-warlock-WL-1.png
public/characters/maske/dragonborn-kadin-warlock-WL-10.png
public/characters/maske/dragonborn-kadin-warlock-WL-11.png
public/characters/maske/dragonborn-kadin-warlock-WL-2.png
public/characters/maske/dragonborn-kadin-warlock-WL-3.png
public/characters/maske/dragonborn-kadin-warlock-WL-4.png
public/characters/maske/dragonborn-kadin-warlock-WL-5.png
public/characters/maske/dragonborn-kadin-warlock-WL-6.png
public/characters/maske/dragonborn-kadin-warlock-WL-7.png
public/characters/maske/dragonborn-kadin-warlock-WL-8.png
public/characters/maske/dragonborn-kadin-warlock-WL-9.png
public/characters/maske/dragonborn-kadin-wizard-GR.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A1.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A2.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A3.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A4.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A5.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A6.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A7.png
public/characters/maske/dragonborn-kadin-wizard-WZ-A8.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B1.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B2.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B3.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B4.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B5.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B6.png
public/characters/maske/dragonborn-kadin-wizard-WZ-B7.png
```
