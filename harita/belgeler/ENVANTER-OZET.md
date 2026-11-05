# Envanter özeti (A0)

> 2026-11-05, dal `wip/a0` (wip/k54b'den), kural sürümü 27. **Salt-okunur denetim:** oyun kodu, veri ve testler değişmedi. Soru: "veride var ama savaşta gerçekten çalışıyor mu?"
>
> Ayrıntı: [ENVANTER-BUYULER.md](ENVANTER-BUYULER.md), [ENVANTER-ESYALAR.md](ENVANTER-ESYALAR.md), [ENVANTER-CANAVARLAR.md](ENVANTER-CANAVARLAR.md), [ENVANTER-DIGER.md](ENVANTER-DIGER.md).

## Yöntem

Her kayıt üç adımda denetlendi: (1) veride etki tanımı var mı, (2) motor kodunda kimliğiyle/adıyla işleniyor mu (arama), (3) mümkün olanlarda **kısa gerçek savaş yoklaması** (repo dışı betik; repo testlerine eklenmedi):

- **Büyüler:** 339 büyünün her biri 20. seviye büyücüyle, 16 hedef biçimiyle (düşman, insansı, hayvan, altıgen, dost, ölmekte/ölü dost, vurduktan sonra…) `cast_spell`.
- **Eşyalar:** 376 SRD eşyasının her biri tek başına Fighter ve Wizard karakterine verildi; savaşçıda AC/etki/isabet eki/kaynak/sarf değişiyor mu.
- **Canavarlar:** 61 canavar yeteneği (`monster_ability`) ve 56 canavarın 153 büyüsü gerçek savaşta.
- **Sınıf özellikleri:** 12 sınıf × SRD alt sınıfları × 5/11/20. seviye `use_feature`.

Sınıflar: **ÇALIŞIR** (savaşta etkisi oluşuyor), **KISMİ** (yaklaşık ya da bir parçası yok), **YOK** (savaşta anlamlı, motor karşılığı yok ya da hata), **SAVAŞ DIŞI** (savaşta anlamı yok). Koşullu olanlar (ritüel, tür kısıtı, önce isabet) koşul sağlanınca kodda yolu varsa ÇALIŞIR.

**Sınır:** yoklama etkinin oluştuğunu ölçer; sayıların SRD ile birebir doğruluğunu değil. Ek paket (`icerik/`) bu ortamda yok, ölçülemedi.

## Özet tablo

| Kategori | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Toplam |
|---|---|---|---|---|---|
| Büyüler (0–9) | 151 | 74 | 21 | 93 | 339 |
| Eşyalar (SRD) | 212 | 11 | 8 | 145 | 376 |
| Canavar `unsupported` kalemleri | 781 | 177 | 1 | 152 | 1.111 |
| Canavar saldırı ekleri | 240 | 29 | 56 | 0 | 325 |
| Canavar tepkileri | 26 | 0 | 0 | 1 | 27 |
| Canavar yetenekleri (yoklama) | 38 | 23 (koşullu, doğrulanmadı) | 0 | 0 | 61 |
| Canavar büyüleri (yoklama) | 141 | 12 (hedef koşulu) | 0 | 0 | 153 |
| Sınıf özellikleri | 131 | 2 | 0 | 4 | 137 |
| SRD alt sınıf özellikleri | 56 | 1 | 0 | 1 | 58 |
| İmza alt sınıf özellikleri (ev kuralı) | 57 | 0 | 9 | 0 | 66 |
| Tür özellikleri | 34 | 2 | 0 | 5 | 41 |
| Geçmişler | 12 | 0 | 0 | 0 | 12 |
| Feat'ler | 17 | 0 | 0 | 0 | 17 |
| Silah ustalıkları | 6 | 2 | 0 | 0 | 8 |
| Durumlar (SRD 15) | 13 | 2 | 0 | 0 | 15 |
| Harita/global kurallar (`kural-kontrol.json`) | 111 | 0 | 0 | 0 | 111 |
| Ev kuralları (`ev-kurallari.json`) | 22 canlı | — | 3 ölü | — | 25 |

## En önemli 25 boşluk (savaşta etkisi büyükten küçüğe)

| # | Boşluk | Kapsam | İş | Çözüm yolu |
|---|---|---|---|---|
| 1 | **Heal büyüsü motoru çökertiyor**: sabit `"70"` iyileştirme `"0d1+70"` zar ifadesine dönüşüp istisna fırlatıyor | 6. sv Cleric/Druid | küçük | sabit iyileştirme yolu (`healDice`) |
| 2 | **Eyebite hiçbir hedefle yapılamıyor**: "yalnızca büyücüyü etkiler" ve "kendini hedefleyemezsin" çelişiyor | 6. sv | küçük | hedef denetimi (`spells69.ts`) |
| 3 | Büyük canavarlar tek altıgen: çok altıgen bayrağı `multiHex` varsayılan kapalı | 156 canavar (Large 107, Huge 34, Gargantuan 15) | orta | A6 `body.ts` hazır; varsayılan kararı + denge ölçümü |
| 4 | Grappled: yakalananın, yakalayan dışındaki hedefe saldırı dezavantajı yok | bütün yakalamalar (canavar ve oyuncu) | küçük | `conditions.ts` saldırı kipi |
| 5 | Saldırı eki durum süresi ayrıştırılamadı | 25 saldırı | küçük | `conditionTimers` verisi (`attack-riders.json`) |
| 6 | Yapay zekâ sarf eşyası (iksir, yağ, el bombası) kullanmıyor | bütün YZ savaşçıları | küçük | `use_item` + YZ "yarı canın altında iksir" kuralı |
| 7 | Saldırı eki itme/çekme uygulanmıyor | 11 saldırı | küçük | **K53 `forcedMove`** (motor hazır) |
| 8 | Hız/eylem kısıtı ekleri (Slowing Breath vb.) | 12 saldırı | küçük | süren etki `slowed` (Slow yolu) |
| 9 | Nefes ikinci aşaması (Sleep/Paralyzing Breath "Second Failure") | 10 saldırı (ejderhalar) | küçük | A3 `escalate` (`condition-effects.json`) |
| 10 | Özel silahlar yalnız +X: Vorpal, Defender, Scimitar of Speed, Nine Lives Stealer, Berserker Axe… | 11 eşya | orta | eşya saldırı kancası (`imzaHit` kalıbı) |
| 11 | Savaş öncesi hazırlık büyüleri kurulumda yapılamıyor (Foresight, Heroes' Feast, Magic Circle, Glyph of Warding, Symbol, Contingency…) | 25 büyü | orta | R3 kurulum ritüel yolu (Find Familiar gibi) |
| 12 | İmza alt sınıf planlı özellikleri (Ferman, Yazgı Değişir, Nakarat, Ölümsüz Dize, Dostunun Yası…) | 9 özellik | orta | K53 aura/teleport, tepki kancaları (K54c) |
| 13 | Sürekli hasar ekleri (her tur) | 8 saldırı | küçük | süren etki `ongoing` / `dot` |
| 14 | HP eşiğiyle öldürme ekleri | 7 saldırı | küçük | İnfaz kalıbı (`imzaHit`) |
| 15 | Yanılsama büyüleri (Minor/Silent/Major Image, Project Image) savaşta etkisiz | 4 büyü | orta | K53 geçici engel `blocksSight` + Investigation |
| 16 | Kaçış/yer değiştirme büyüleri (Teleport, Word of Recall, Transport via Plants, Gate) | 4 büyü | küçük/orta | K53 `teleport` + savaştan çıkış; Gate için R3 çağırma |
| 17 | Arazi büyüleri (Passwall, Stone Shape, Control Water) | 3 büyü | orta | K53 `gecicEngel` / `tile_changed`; Kuyruk 19 girdap kodu |
| 18 | Lanet/kalıcı etki ekleri | 11 saldırı | orta | süren etki + dinlenme |
| 19 | 74 KISMİ büyü (yaklaşık; ör. Prismatic Spray, Wish, alan büyüleri) | 74 büyü | büyük (toplam) | tek tek; `docs/BUYU-DENETIMI*.md` |
| 20 | Savaşta anlamlı ama savaş dışı işaretli eşyalar (Bag of Tricks, Figurine, Horn of Valhalla, Staff of the Python, Rod of Absorption…) | 8 eşya | orta | R3 `summons`, tepki yolu |
| 21 | Invisible: "görmeyi gerektiren etki" denetimi genel değil | bütün görünmezler | orta | `sight.ts` hedefleme |
| 22 | Koşullu canavar yetenekleri (Swallow, Trample, Rampage, Reel…) savaşta doğrulanmadı | 23 yetenek | küçük | koşullu senaryo testleri |
| 23 | SRD görüş (`nightVision`) ve fırtına (`stormRules`) kuralları varsayılan kapalı | gece/fırtına haritaları | küçük (karar) | Game Master anahtarı varsayılanı |
| 24 | K55 tepkime önizlemesi oyuncuya gösterilmiyor (yalnız YZ) | bütün alan büyüleri | orta | `previewHexEffects` arayüzü (K58) |
| 25 | Ölü ev kuralı anahtarları panelde görünüyor ama etkisiz | 3 anahtar | küçük | kaldır ya da bağla |

Küçük ek boşluklar (ayrıntı belgelerde): Knock/Find Traps/Goodberry/Arcane Lock (küçük, mevcut nesne/tuzak/sarf yolları), ice-mephit Fog Cloud, Dropping Prone komutu, Push ustalığı (yalnız son saldırı), Dragon Companion kancası doğrulanmadı, tepki büyüleri (Shield/Counterspell/Feather Fall) eylemle yapılınca slot harcayıp etkisiz.

## "Ölü" ev kuralı anahtarları

| Anahtar | Varsayılan | Okuma | Not |
|---|---|---|---|
| `lair` | kapalı | 0 | in olayı harita kuralı `lairEruption` ile çalışıyor; ev kuralı anahtarı hiç okunmuyor |
| `asitHavuzu` | kapalı | 0 | yalnız bir testte geçiyor; motorda asit havuzu yüzeyi yok |
| `yuksekAvantaj` | kapalı | 0 | yükseklik avantajı global `heightCombat` ile; ev kuralı okunmuyor |

Diğer 22 anahtar canlı: 5'i K55 tablosunun `gate` alanından, 10 imza anahtarı `imzaOn` üstünden, hizalanma ikisi Ayarlar bayrağından okunuyor.

## Arayüzde erişilemeyen sistemler

K48–K55'in hepsinin oyunda bir yolu var (yalnız testte/simde kalan sistem yok). Eksik kalanlar:

- **K55 önizleme:** `previewHexEffects` yalnız YZ'de; oyuncu alan büyüsünü nişanlarken tepkimeyi (patlama, buhar, dostuna hasar) görmüyor.
- **Sarf eşyası:** oyuncu kullanabiliyor; YZ kullanmıyor.
- **K53 nesne fırlatma:** yalnız Yaşlı Bilge'nin Zihin Gücü'nde; genel "nesne fırlat" oyuncu komutu yok.
- **Moral diriltme** (`moral_dirilt`): yalnız Serüven ekranında.
- **İmza alt sınıflar:** Ayarlar'da ev kuralı açılmadıkça oluşturucuda görünmez (tasarım).

## Önerilen kuyruk sırası

1. **A1 hata paketi (küçük):** Heal çökmesi, Eyebite hedefi, Grappled dezavantajı, ölü ev kuralı anahtarları, tepki büyülerinin eylemle yapılmasını engelleme. Kural sürümü 28.
2. **A2 saldırı eki paketi (orta, en büyük kazanç):** itme/çekme (K53 `forcedMove`), süre ayrıştırma, ikinci aşama (`escalate`), hız/eylem kısıtı, sürekli hasar, HP eşiği. ~70 canavar saldırısı.
3. **A3 YZ paketi (küçük):** iksir kullanımı, koşullu canavar yeteneklerinin senaryo testleri.
4. **K54c** (zaten planlı): imza alt sınıfların kalan 9 özelliği.
5. **A4 büyü boşlukları (orta):** kaçış ışınlanmaları, yanılsamalar ve arazi büyüleri (K53 engel/teleport), Knock/Find Traps/Goodberry.
6. **A5 savaş öncesi hazırlık (orta):** kurulum ritüel yolu (Foresight, Heroes' Feast, Magic Circle, Glyph of Warding…).
7. **A6 özel eşyalar (orta):** 11 özel silahın kancaları, savaşta anlamlı 8 eşya (çağırma/tepki).
8. **A7 çok altıgen varsayılanı (orta):** `multiHex` açık varsayılanının denge ölçümü (156 canavar).
9. **K58:** K55 önizlemesinin arayüzü.
10. KISMİ büyülerin tek tek tamamlanması (büyük; Dungeondex öncesi tam test turuyla).
