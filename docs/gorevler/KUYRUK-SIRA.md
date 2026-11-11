# CC kuyruk sırası (güncel: 2026-11-12)

Bu dosya `sistem-kuyruklari-sirasi` belgesinin depodaki karşılığıdır (bu adla dosya yok; en yakın eşdeğeri). Kapanan işler `KAPANIS-CIZGISI.md`'de. Kaynaklar: DECISIONS.md, `harita/belgeler/*-SONUC.md`, `*-DENETIM.md`, `BINEK-PLAN.md`, CLAUDE.md. Kaynakta olmayan sayı yazılmadı; belirsiz olanlar "kaynakta yok" diye işaretli.

## Kural

- **Mekanik donması kaldırıldı** (2026-11-12, Kuyruk K57-KALDIR; `docs/MEKANIK-DONMA.md` tarihsel kayıt). Yeni mekanik serbest.
- **Tek sürüm şeridi:** kural sürümü değişen her iş sürümü bir artırır; aynı anda yalnız bir şerit sürüm artırır. Güncel kural sürümü **67** (K62-ACIK), sıradaki şerit **68**.
- Yeni mekanik veriyle ve Game Master anahtarıyla gelir, eski kayıt/replay aynen oynar; ana parça 420 kB sınırı; hafif doğrulama modu aynen.

## Bekleyen kuyruk (sıra)

1. **U1b**: alt sınıf uçuş verisi, yerel iş (DECISIONS.md U1a: "U1b: alt sınıf uçuşları, liste kullanıcıyla"). Binek planı U1b'yi beklemez (BINEK-PLAN §7.3).
2. **MB1** (binek çekirdek SRD): **kural sürümü 68**. Sürüm numarası çakışması için tek sabit `BINEK_SURUM`; AS1 ile aynı şeritte sırayla (BINEK-PLAN §3.5, §7.3).
3. **MB3 + MB7**: MB3 dikey (uçan/yüzen/tırmanan binek; plan sürümü 70), MB7 büyü ve paket (Find Steed, Phantom Steed, paket yaratığında `binek`; plan sürümü 73). Planın en kısa Ejder Muhafızı yolu MB1 → MB3 → MB7 (binek bağımsız kipte, MB2'siz).
4. **AS1**: 41 alt soy; bir sonraki sürüm. Depoda AS1 belgesi yok (kullanıcının kuyruk adı); kural sürümü numarası 68 ya da sonrası, kaynakta kesin yok.
5. **AS2**: 120 paket yeniden yapılanması. Depoda AS2 belgesi yok; ayrıntı kaynakta yok.
6. **Hallow ek etkileri**: kullanıcı kararı bekliyor (K62ACIK-DENETIM Madde 5: Extra Effect 10 seçenek; kurulumda seçim ve alan kaydında yeni değer ister). Donma kalktığı için artık engel yok.
7. **Truesight motor yolları**: motorda Truesight'ı bilmeyen 5 yol (fırsat saldırısı görme, hareket algısı, Cleave, mastery ikinci hedef, ejderha Algısı); savaş sonucunu değiştirir (K62ACIK-DENETIM Madde 3).
8. **Denge turu** ("Dungeondex öncesi tam test turu": tam ölçüm, düzeltme, optimizasyon; kullanıcı vermeden yapılmaz, CLAUDE.md).
9. **Jeton eşleme**: kaynakta yok (kapsam DECISIONS.md/CLAUDE.md'de tanımlı değil).
10. **Ayarlar sadeleştirme + yerel Oda kur**: kaynakta yok.
11. **Dungeondex TR+EN**: kaynakta yok; yalnız "İngilizce SRD metni `data/srd/spells.json`'da (Dungeondex için)" notu var (DECISIONS.md B2/M1) ve "Kimlikler değişmez (ileride Dungeondex açıklamaları bunlara bağlanacak)" (CLAUDE.md).
12. **Final smoke + 200 tohum**: kaynakta yok (hafif doğrulama modu 200 tohumu bu tura bırakır, CLAUDE.md).
13. **APK1**: görseller bittikten sonra; kaynakta yok.

### Binek alt kuyrukları (`harita/belgeler/BINEK-PLAN.md` §7.2; öneri, karar kullanıcıda)

| Kod | Kapsam | Plan sürümü | Risk |
|---|---|---|---|
| MB1 Çekirdek SRD | yığın modeli, düşme tetikleri, ışınlanma/itme ile inme, Lance | **68** | Orta |
| MB2 Kontrollü binek | `control`, birleşik tur, `data/binek.json` | 69 | Yüksek |
| MB3 Dikey | uçan/yüzen/tırmanan binek, yığın boyu, havadan düşme | 70 | Yüksek |
| MB4 Çok altıgen | gövde = bineğin ayak izi (multiHex) | 71 (ya da MB3 ile aynı) | Orta |
| MB5 YZ | binici/binek kararı, K73a kalıbı | 72 (yalnız YZ) | Orta |
| MB6 Arayüz | yığın jetonu, "Binek" bölümü, TR/EN | görsel | Düşük–orta |
| MB7 Büyü ve paket | Find Steed, Phantom Steed, paket `binek` | 73 | Orta |
| MB8 Denge ve kapanış | binekli senaryolar, DENGE.md, tam paket | yok | Düşük |

- **Sıra (görev metni):** MB1 → MB3/MB4 → MB7 → MB5 → MB6 → MB8. Plan metnindeki sıra `MB1 → MB2 → MB3 ∥ MB4 → MB7 → MB5 → MB6 → MB8`; **MB2'nin sıradan çıkarılması planla farklı** (plan: Ejder Muhafızı yolunda MB2 yok, bağımsız kip). MB2'nin ertelendiğine dair karar kaynakta yok.
- MB4'ün sürümü planda "71 (ya da MB3 ile aynı)": sürüm numaraları, bundan önce başka bir şerit sürüm alırsa kayar (§3.5).
- Taban test: main f740c07, 375 dosya + 1 atlanan, 4410 test + 7 atlanan (DECISIONS.md BINEK-PLAN).

## Su şeridi (SU) ve efekt (yalnız görsel)

- **SU1** (su hex denetimi): yapıldı, salt okuma; `harita/belgeler/SU-HEX-DENETIM.md`.
- **SU3** (su dokusu `haric`/`ekle`, kıyı soldurma): görev metnine göre 44 hex `haric`, 4 harita; **Batak Adalar, Kale, Kamp, Kasaba Lağımı, Mantar Mağarası elle teyit bekliyor**. Kaynakta yok: depoda SU3 girdisi yok. SU-HEX-DENETIM bu işi "(c) hafif hâli, yeni kuyruk (SU2)" diye adlandırır (≈ 44 `haric`, kullanıcı onayı bekliyor; D haritalar batak, lağım, mantar elle teyit); adlandırma görev metniyle farklı.
- **SU2** (deprem efekti, çalışıyor/bitince): görev metnine göre. Kaynakta yok: depoda SU2 deprem efekti girdisi yok. İlgili mevcut kayıt: E4c `zemin-deprem-yarigi` (Earthquake, altıgen başına döşeme).

---

# Tarihsel: CC kuyruk sırası (2026-11-03)

Bu klasörü depoda `docs/gorevler/`, `data/harita/` olarak koy. Sıra:

0. Su Altı Geçidi (`su-alti-gecit-gorevi.md`): aynalı görsel `wip/k19`'a gelince tek commit; `sureGun` 0 (yapıldı, görselle birleşecek).
1. Denge notu: YAPILDI (aac86e0).
2. K45 + K46 (`kuyruk-45-46-karo-ve-goruntuleyici.md`): etiket/isim içeriği YOK.
3. K47 (`kuyruk-47-serbest-gezinti.md`).
4. K20 (`kuyruk-20-celestial-irki.md`).
5. Denge turu (`kuyruk-denge-turu.md`).

İsim/etiket işi ayrı, sonra gelecek: K46'daki etiket katmanı boş liste okuyan bileşen olarak kalır.
Her görevde: kendi dalı, her büyük adım sonrası commit+push, soru sorma (en makul kararı ver, DECISIONS.md), Goliath dosyalarına dokunma, kural kaynağı SRD 5.2.1.
