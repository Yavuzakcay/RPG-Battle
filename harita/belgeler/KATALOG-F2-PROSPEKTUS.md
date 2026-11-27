# KATALOG-F2-PROSPEKTUS: Kadim yaratıkların Dungeondex açıklamaları (durum: bekliyor)

Görev: Kadim yaratıkların Dungeondex Türkçe ve İngilizce açıklamaları. Yalnız metin; mekanik, kural sürümü (107) ve kayıt sürümü (28) değişmez.
Tarih: 2026-11-27. Dal: `origin/birlesik` ucundan (5459a162).

## Sonuç

**Yazılan açıklama: 0.** Kapsamdaki 21 yaratığın hepsi **bekliyor**. İki nedeni var:

1. **Canavar kaydı yok.** `data/monsters.json`, `data/canavar-ozellik.json` ve başka hiçbir veri dosyasında kadim yaratık ya da Mücevher Ejderhası kaydı yok. KATALOG-F2 veri görevi henüz yapılmadı. Uzak dallarda da kayıt yok (`birlesik`, `birlesik-toplu`, `claude/katalog-f-asama2`, `wip/gorev-f` tarandı).
2. **PDF depoda yok.** *Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu* (11 s.) depoya girmedi. Depodaki tek iz, `KATALOG-1-ENVANTER.md` §3.1'deki özet satırlar. Bu satırlarda DC, kurtarma zarı türü, saldırı bonusu ve çoğu hasar zarı yok.

Görev kuralı "değerler kayıttaki değerle birebir, metinden değer uydurma" diyor. Kayıt olmadan bu kural sağlanamaz.

Açıklama dosyalarına kayıtsız anahtar eklemek mevcut testleri de kırar:

- `src/dungeondex/canavarAciklama.test.ts`: her açıklama anahtarı `data/canavar-ozellik.json` listesinde olmalı. Liste 330 SRD canavarına eşit, 1318 satır.
- `src/data/aciklamalarEn.test.ts`: EN anahtarları TR ile aynı olmalı.

## Kapsam ve durum

| Yaratık | Faz / evre | Kayıt | Açıklama | Not |
|---|---|---|---|---|
| Kıta Ejderhası (V1) | tek | yok | bekliyor | Envanterde özet var (B4); DC'ler yok |
| Kadim Kıta Ruhu (V2) | tek | yok | bekliyor | Envanter B5. Sahne/müttefik varlığı önerisi (37 altıgen, motor tavanı 19) |
| Kozmik Anka Kuşu | Faz 1 + yeniden doğuş | yok | bekliyor | Envanter B6 |
| Kor Yumurtası | Anka'nın 2. evresi | yok | bekliyor | Envanterde yalnız "yumurta AC 22, 150 HP, 450 HP ile dirilir" |
| Uçurumun Yıldız-Kâbusu | Faz 1, Faz 2 | yok | bekliyor | Envanter B7 |
| Mücevher Ejderhası Alfa (Safir) | Yavru / Genç / Yetişkin | yok | bekliyor | Nefes hasar türü atanmadı |
| Mücevher Ejderhası Omega (Yakut) | Yavru / Genç / Yetişkin | yok | bekliyor | aynı |
| Mücevher Ejderhası Delta (Zümrüt) | Yavru / Genç / Yetişkin | yok | bekliyor | aynı |
| Mücevher Ejderhası Sigma (Altın) | Yavru / Genç / Yetişkin | yok | bekliyor | aynı |
| Mücevher Ejderhası Gamma (Gümüş) | Yavru / Genç / Yetişkin | yok | bekliyor | aynı |

Toplam: 5 kadim varlık + Kor Yumurtası + 5 hat × 3 evre = 21 stat bloğu.

## F2 veri görevine notlar

1. **Liste ve test.** `canavarAciklama.test.ts` listenin `monsters` dizisiyle (330) birebir aynı olmasını bekler. KATALOG-F-TASARIM §1, boss kayıtlarını ayrı bir dizide tutmayı öneriyor.
   - Kadim yaratıklar da ayrı dizide tutulursa iki şey gerekir: özellik listesi ayrı bölümde ya da ayrı dosyada olmalı, test bu bölümü de taramalı.
   - Açıklama anahtarı biçimi aynı kalır: `<kimlik>/<trait|action|bonus|reaction|legendary>:<ad-slug>`.
   - Alan icat edilmez. Fazlar ve evreler ayrı kimlikle ayrı kayıt olur (ör. Kor Yumurtası ayrı yaratık).
2. **Mücevher hatlarının adı.** Envanter §3.1, PDF'teki kümeyi Kristal (ışıltı), Topaz (nekrotik), Zümrüt (psişik), Safir (gök gürültüsü) ve Ametist (kuvvet) olarak yazıyor. Görevdeki hatlar ise Alfa (Safir), Omega (Yakut), Delta (Zümrüt), Sigma (Altın) ve Gamma (Gümüş).
   - Envanter madde 4'e göre eski tür–element eşlemesi SRD dışı D&D kümesiyle birebir.
   - Yeni hatların nefes hasar türü atanmadıkça açıklama yazılmaz (görev kuralı).
3. **Korumalı adlar.** Depoda yalnız `KATALOG-1-ENVANTER.md` satır 471 ve 746–749'da geçiyor: Zettaflare, Ancalagon, Thangorodrim, Bahamut, Placidusax, Cthulhu.
   - Veri dosyalarında hiçbiri yok. Belgeye dokunulmadı.
   - (`Tiamat` `data/srd/magic-items.json` ve `data/aciklamalar-en.json` içinde geçiyor. Bu SRD 5.2.1 metni, kapsam dışı.)
   - Kayıtta kullanılacak yeni adlar: Kıta Kuyruğu (Continent Tail), Kıta Hükmü Nefesi (Continent Judgment Breath), Kıta Ölçeği (Continent Scale), Yıldız-Kâbusu (Abyssal Star-Nightmare).
4. **Envanterin bulduğu tutarsızlıklar** (F2 kaydı yazılırken çözülmeli; açıklama kayda uyar):
   - Kıta I HP 740 ↔ formülle 758
   - Anka 780 ↔ 738/774
   - Yıldız-Kâbusu 1.150 ↔ 943
   - Kıta II alan "5×5+" ↔ "7×7"
   - Mücevher nefes DC'si "taşıyıcıyla ölçeklenir" diyor, tablo sabit DC veriyor.

## Kayıt gelince yazım kuralı (bu görevin sürdürülmesi)

- Biçim, örnek Adult Gold Dragon kaydıyla aynı: `data/aciklamalar-tr-canavar.json` `canavar["<anahtar>"]` ve `data/aciklamalar-en-canavar.json` aynı anahtarla.
- Adlar İngilizce (SD4), açıklama sade Türkçe. Sayılar kayıttaki değerle birebir: zar, isabet bonusu, DC, menzil. Süre tur cinsinden. En çok 560 karakter.
- Motorda yaklaşıklanan ya da çalışmayan güç `harita/belgeler/KATALOG-SIGMAYAN.md`'ye tek satırla yazılır.
- Testler kendiliğinden devreye girer:
  - açıklaması olan canavarın bütün satırları dolu olmalı
  - sayısal tutarlılık
  - EN karşılığı ve EN'de Türkçe harf olmaması
- Dungeondex önizleme görüntüsü (Kıta Ejderhası, dar ekran) kayıt gelince alınır.
