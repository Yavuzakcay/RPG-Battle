# Kapanış çizgisi (güncel: 2026-11-12)

Bu dosya `kapanis-cizgisi` belgesinin depodaki karşılığıdır (bu adla dosya yoktu; yeni açıldı, yalnız belge). Bekleyen işler `KUYRUK-SIRA.md`'de. Kaynaklar: DECISIONS.md, `harita/belgeler/*-SONUC.md`, `*-DENETIM.md`, `BINEK-PLAN.md`, CLAUDE.md. Kaynakta olmayan sayı yazılmadı; belirsiz olanlar "kaynakta yok" diye işaretli.

## Kural sürümü zinciri (dikey / su / kazma serisi)

| Kuyruk | Kural sürümü | Konu | Belge |
|---|---|---|---|
| K68a/b/c | 52 | dikey geometri, tavan, görüşte irtifa | `K68-PLAN.md` |
| K69 | 53 | çok altıgenli yaratıkların kalanları | `K69-DENETIM.md` |
| K70 | 54 | küçük SRD farkları | DECISIONS.md |
| Y1 | 55 | YZ kuyruğu + K70 artıkları | `Y1-ENVANTER.md` |
| K71a | 56 | dikey veri modeli | `K71-PLAN.md` |
| K71b | 57 | herkes için tırmanma, düşme tek işlev | DECISIONS.md |
| K71c | 58 | prizma hava ızgarası | `K71C-DENETIM.md` |
| K71d | 59 | katman + irtifa, K8 yüksek zemin | `K71D-DENETIM.md` |
| K72 | 60 | tavan bölgeleri, sur üstü, çok katlı bina | `K72-DENETIM.md` |
| U1a | 61 | uçuş ilkeli motor tarafı | `UCUS-ENVANTER.md` |
| K73a | 62 | YZ dikey taktiği | `K73A-DENETIM.md` |
| K73b | 63 | çok turlu sur, 3B bitişiklik, gönüllü düşme | `K73B-DENETIM.md` |
| K73c | 64 | kazma, su altı, havada merkezli alan | `K73C-DENETIM.md` |
| K73d | 64 (değişmedi) | K73c kapanışı | DECISIONS.md |
| K73e | 65 | YZ kazma ve dalış kararı | `K73E-DENETIM.md` |
| **K73f** | **66** | su ve atlama kalanları | `K73F-SONUC.md` |
| **K62-ACIK** | **67** | K62–K67 açık maddeleri | `K62ACIK-DENETIM.md` |

### K68–K73f kapanışı

- **K73d** (K73c kapanışı): tam paket 364 dosya + 1 atlanan, 4277 test + 5 atlanan; "☁ Hava"/"⌂ Kat" seçicilerinin balonla çakışması düzeltildi (balon z-index 7, boş kip dışında seçiciler gizli); yeni kuralların denge ölçümü (`k73dSenaryo.ts`, `k73dOlcum.test.ts`, `K73D_TOHUM`); YZ karar süreleri ≤ +%15. Açık: YZ o sırada kazmıyor/dalmıyor (K73e kapattı).
- **K73e** (65): YZ kazma/dalış kararı (`burrowCommand65`, `waterCommand65`, `data/yapay-zeka.json` `k73e`).
- **K73f** (66): batık/yer altı atlamada varış hücresi kendi katmanında boş olmalı; yüzme hızı olan 17 canavar yüzücü listesinde (liste 46 + 17 = 63); Call Lightning fırtına devralma 64'ten beri SRD metniyle aynı (66'da kod yok); YZ yer altında uzaklaşma (`k73f.kacisCan` 0,15). Regresyon 18 senaryoda 65 = 66; denge kayması 8 puanı aşmadı (kazan L5 43 → 47, L9 57 → 60); zaman aşımı 0, boğulma 0. Ana parça 374,74 kB; `check:harita` 96/0, `check:ses` 15/0; tam paket 368 dosya + 1 atlanan, 4314 test + 7 atlanan.
- **K73f açık kalanlar:** yüzme hızsız nefes tutan canavar yok (veride 0; karar kullanıcıda); su altı ve kıyı karşılaşmaları kolay (%100); yaklaşma kazması SRD verisinde pratikte tetiklenmiyor; `monsterTraits.ts` hız notu yalnız ilk hıza bakıyor (66 listesiyle etkisiz, ayrıştırıcı düzeltilmedi).
- K68–K73f'in her kuyruğunun ayrı açık kalanları ilgili DECISIONS.md girdisinde ve denetim belgesindedir; burada yeniden yazılmadı.

## E4–E5 (efekt/rozet; yalnız görsel, kural sürümü 64 ve `SAVE_VERSION` değişmedi)

- **E4:** `zemin-ek` ve `isin-ek` sayfaları içe aktarıldı, büyülere bağlandı; `e2Verify` 134 → 138/138; savaşta 225 büyü hazır/genel/eksik 196/26/3 → 199/24/2. Plan `E4-DENETIM.md`.
- **E4b:** duvar, bıçak, prizma, yerçekimi, taş halka, su sayfaları; su dokusu (`WaterLayer`, SU-DALGA/SU-HAVUZ); zemin dokusu altıgen `clipPath` maskesi; `e2Verify` 147/147; hazır 204, genel 20, eksik 1.
- **E4c:** `efekt-eksik` sayfası (yükselen toz, deprem yarığı, sessizlik, gün ışığı, ölüm sözü) ve kaynak ikonları (`npm run kaynak-ikon`, `ResourceChip`, ikon ≥ 32 px); `e2Verify` 153/153; hazır/genel/eksik **210/15/0**.
- **E5:** 13 rozet-only büyüye efekt (`rozet-efekt-13`, prosedürel canlandırma, `etkiHalka` ile Irresistible Dance döngüsü); `e2Verify` **166/166**; hazır/genel/eksik **223/2/0** (kalan genel: delayed-blast-fireball boncuğu, wish).
- **E4–E5 açık kalanlar** (DECISIONS.md): dünya haritası suyu; Control Water / `flashFlood` su yüzeyi dokusu; SU-HAVUZ aynalı desen simetrisi çok geniş gölde; kaynak ikonu için TR/EN ayrı etiket yok.

## SU şeridi

- **SU1** (2026-11-11, salt okuma): `SU-HEX-DENETIM.md`. Doku suyu ile mekanik su aynı `tiles` harflerinden (`w`, `R`) gelir; görsel doğrulanmış 10 haritada 439 `w` hex'in 44'ü kara üstünde. Öneri: mekanik `w`'ye dokunmadan doku için hex bazında `haric`/`ekle` (yalnız görsel); `w`'yi resme göre yeniden türetmek önerilmez. Kural sürümü, `SAVE_VERSION`, veri, kod, görsel değişmedi.
- **SU3** (su dokusu `haric`/`ekle`, kıyı soldurma; görev metni): 44 hex `haric`, 4 harita. **Elle teyit bekliyor:** Batak Adalar, Kale, Kamp, Kasaba Lağımı, Mantar Mağarası. Kaynakta yok: depoda SU3 girdisi yok (yalnız SU-HEX-DENETIM'in önerisi var, orada "SU2" adıyla).
- **SU2** (deprem efekti; "çalışıyor/bitince" görev metninde): kaynakta yok; depoda SU2 deprem girdisi yok. Mevcut ilgili iş E4c `zemin-deprem-yarigi`.

## K62-ACIK (kural sürümü 67)

Taban `origin/main` f740c07; dal `wip/k62-acik`; `SAVE_VERSION` 22; 66 ve altı birebir.

1. **Boncuk arayüzü** (Delayed Blast Fireball): "Boncuğu fırlat"/"Boncuğa dokun", önizleme motorla aynı yoldan (`bead.ts` `beadThrowLanding`); sürümsüz.
2. **Wall of Ice YZ hedeflemesi:** canavar saldırısı da `attack_object` seçeneği; panel bağışıklığı (Cold/Poison/Psychic) elenir, zayıflıkta iki kat; sürümsüz.
3. **Truesight YZ yolları:** `blindChoice`, kapı açma, haritasız hedef seçimi, Divine Sense tetiği `truesightRange`/`hiddenFromTruesight` ile; sürümsüz.
4. **Magic Circle (67):** seçilen tür silindire isteyerek giremez, ters Magic Circle'dan çıkamaz; ışınlanarak giren/çıkan büyücünün DC'sine CHA save atar, başarısızlıkta geri döner. ⚠ Save varıştan sonra: aynı komutta tetiklenen alan etkileri geri alınmaz (yaklaşık).
5. **Hallow (kısmi):** "isteyerek giremez" yapıldı (67); **Extra Effect uygulanmadı, kullanıcı kararı bekliyor.**

- **Açık madde (Truesight, motor):** Truesight'ı bilmeyen 5 motor yolu açık: fırsat saldırısı görme, hareket algısı, Cleave, mastery ikinci hedef, ejderha Algısı. Savaş sonucunu değiştirir, K62-ACIK kapsamı dışında, denetimde listeli.
- Doğrulama: `src/battle/k62acik.test.ts` (11), `src/sim/k62acikRegresyon.test.ts` (66 = K73f altınları, 67 = 66); ana parça 376,78 kB; `check:harita` 96/0, `check:ses` 15/0; tam paket 377 dosya + 1 atlanan, 4425 test + 7 atlanan.

## K57-KALDIR (2026-11-12)

K57 mekanik donması (2026-11-06) kullanıcı kararıyla tamamen kaldırıldı; `docs/MEKANIK-DONMA.md` tarihsel kayıt, ev kuralı varsayılan tablosu başvuru olarak geçerli. Gerekçe: donma AS1, AS2, binek şeritleri, Hallow ek etkileri ve Truesight motor yollarını engelliyordu. Kalan kurallar: kural sürümü değişen her iş sürümü bir artırır, aynı anda yalnız bir şerit sürüm artırır (güncel 67, sıradaki 68); yeni mekanik veriyle ve Game Master anahtarıyla gelir; ana parça 420 kB; hafif doğrulama modu.

## BINEK-PLAN (yalnız plan; kod, veri, test değişmedi)

`harita/belgeler/BINEK-PLAN.md`; taban main f740c07 (kural sürümü 66, `SAVE_VERSION` 22). Kullanıcı kararı: binek mekaniği yapılacak; ilk kullanım Ranger Ejder Muhafızı (`ejder-muhafizi`, ek paket; depoda yok). Alt kuyruklar MB1–MB8, sıra MB1 → MB3/MB4 → MB7 → MB5 → MB6 → MB8 (görev metni; planda MB2 de var, bkz. `KUYRUK-SIRA.md`), **MB1 = kural sürümü 68**. Öneri modeli: iki savaşçı + yığın; yeni olay türü yok; `srdK19` altında, yeni ev kuralı yok. Bulunan açıklar (testle MB1'de doğrulanacak): `syncRiders` yalnız `pos` eşitliyor, binicinin ışınlanma/itilmesi geri alınıyor, `riderCleanup` başarılı save'de de indiriyor, Lance `twoHandedUnlessMounted` verisi okunmuyor, kontrollü binek ve YZ binek kararı yok. Find Greater Steed SRD 5.2.1'de yok (⚠).

## Kaynakta bulunamayanlar

- `kapanis-cizgisi.md` ve `sistem-kuyruklari-sirasi.md` depoda yok (karşılıkları bu dosya ve `KUYRUK-SIRA.md`).
- SU2 (deprem efekti) ve SU3 (su dokusu haric/ekle) için DECISIONS.md girdisi yok; SU3'ün 5 elle teyit haritası ve SU2'nin "çalışıyor/bitince" ifadesi yalnız görev metninde.
- AS1 (41 alt soy), AS2 (120 paket), jeton eşleme, Ayarlar sadeleştirme + yerel Oda kur, Dungeondex TR+EN, final smoke + 200 tohum, APK1: kapsam ve sayılar depoda tanımlı değil.
- U1b: yalnız "alt sınıf uçuşları, liste kullanıcıyla" notu var.
- Not: DECISIONS.md'de çözülmemiş birleştirme işaretleri (`<<<<<<< HEAD` … `>>>>>>> origin/wip/binek-plan`) duruyor; bu görevde dokunulmadı.
