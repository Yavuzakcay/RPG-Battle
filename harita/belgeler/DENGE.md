# Denge ölçümü (Adım 11, yeniden ölçüm)

5. seviye 5 kişilik parti (Bor, Mira, Tavi, Sela, Kael), her senaryo 200 savaş, tohum 1–200, iki taraf da yapay zekâ ile. Komut: `npm run sim -- 200`. Hedef: parti galibiyeti %60–80. Canavar sayıları ve değerleri değiştirilmedi.

## Kuyruk Y1: YZ kuyruğu — hızlı regresyon ve Earthquake ölçümü (2026-11-08)

Hızlı regresyon (seviye 5, 50 tohum, YZ değişmeden önce / sonra, kural sürümü 55): **birebir aynı** (fark 0 puan).

| Senaryo | Standart önce | Standart sonra | Büyücü önce | Büyücü sonra |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 92% | 92% | 100% | 100% |
| Kale — Gündüz | 60% | 60% | 100% | 100% |
| Mağara — karanlık | 96% | 96% | 100% | 100% |
| Orman | 54% | 54% | 100% | 100% |
| Dungeon — Koridor | 100% | 100% | 100% | 100% |
| Derinlikler — Maden Ocağı | 90% | 90% | 100% | 100% |

Sim partilerinde Charm Person, Heightened Spell, Dancing Lights ya da düşman duvarı yok; yeni YZ yolları simde tetiklenmiyor.

Earthquake (denge kararı, yalnız ölçüm; 50 tohum; standart parti, rahibe Earthquake verildi; parti kazanma %):

| Senaryo | Kati (bugün) | Gevşek (`yz.deprem`) | Zorla (ilk tur) | Zorla − kati |
|---|---:|---:|---:|---:|
| Çöl, 15 | 56 | 56 | 40 | −16 |
| Kale, 15 | 54 | 54 | 64 | +10 |
| Kale, 20 | 86 | 86 | 78 | −8 |
| Mağara, 15 | 68 | 68 | 70 | +2 |
| Mağara, 20 | 14 | 14 | 14 | 0 |
| Orman, 15 | 98 | 98 | 98 | 0 |
| Ortalama | 62,7 | 62,7 | 60,7 | −2,0 |

Gevşek kuralda döküm 0: değerlendirici kendi tarafının Prone/yarık riskini cezalandırıyor. Zorla kolunda savaş ortalama %13 uzun. Karar kullanıcıda; ayar yapılmadı.

## Kuyruk K65a: Fire Storm serbest şekil (2026-11-08; ölçüm yok, yalnız not)

Kural sürümü 49. Fire Storm'un alanı SRD'ye uydu: tek 25 ft küre (yarıçap 5 altıgen, ≈91 altıgen) yerine en çok 40 altıgenlik serbest bitişik alan (10 küp × 4). Kapsanan alan yaklaşık yarıya iner; büyü dağınık gruplarda zayıflar, dostları dışarıda bırakarak şekillendirilebildiği için kalabalık ve karışık savaşta güçlenir. Denge ayarı yapılmadı (SRD uyumu); 13+ seviye büyücü partilerinin ölçümü "Dungeondex öncesi tam test turu"na kalır.

## Kuyruk K60: alt sınıf ince ayarı, yalnız sayılar (2026-11-07)

Kural sürümü 42 (değişmedi). Yöntem: alt sınıf başına bir seferde tek sayı; yalnız etkilenen seviyeler × Çöl/Orman/Mağara × 100 tohum (`npx vite-node src/sim/k59Denge.ts -- 100 --seviye … --sinif … --alt ozel`); SRD karşılığı K59 ölçümü (değişmedi). İki ölçümün farkında gürültü ≈ ±4: < 4 puanlık değişim iyileşme sayılmadı. Hedef ±8.

| Alt sınıf | Sv | K59 fark | Deneme 1 | Deneme 2 | Deneme 3 | Son fark | Durum |
|---|---:|---:|---|---|---|---:|---|
| İmparator | 15 | +27 | Yüce Taht dost etkisi 10 → 2 tur: +26 (etkisiz, geri) | Yüce Taht kendi direnci/geçici canı 10 → 2 tur: +11 | kendi süresi 2 → 1 tur: +9 | **+9** | sınırda (±8 dışı 1 puan) |
| İmparator | 20 | +17 | — | (2. deneme) +7 | (3. deneme) **+5** | **+5** | ✓ |
| İmparator | 11 | −9 | dokunulmadı (15+ özellikleri) | | | −9 | değişmedi |
| Hızır | 3 | +10 | Tam Zamanında 30 → 15 ft: +7 | | | **+7** | ✓ (değişim < 4: gürültü sınırında) |
| Hızır | 11 | +6 | (aynı) +5 | | | **+5** | ✓ |
| Hızır | 20 | +17 | (aynı) Çöl %94 → %93 (etkisiz) | Yetişen Yol süresi 10 → 3 tur: +10 | 3 → 1 tur: **+6** | **+6** | ✓ |
| Yaşlı Bilge | 11 | −21 | Fırlat 3d6 → 6d6: −19 (etkisiz, geri) | Zihin Gücü İt/Çek/Kaydır bedeli 1 → 2 odak: −17 (< 4, geri) | Fırlat bedeli 2 → 3 odak: **−12** | **−12** | yakınsamadı (3 deneme) |
| Yaşlı Bilge | 15 | −20 | (6d6) −18 | (bedel 2) −18 | (Fırlat 3) −18 | **−18** | yakınsamadı |
| Yaşlı Bilge | 20 | −12 | — | (bedel 2) −14 | (Fırlat 3) −11 | **−11** | yakınsamadı |
| Harita Öğretisi | 11 | −19 | Mevzi kurtulma +1 → +3: −18 (etkisiz, geri; 3. sv +1 → +3 bozulmadı) | — | — | **−19** | yakınsamadı |
| Harita Öğretisi | 15 | −22 | (Mevzi +3) −20 (etkisiz) | Kuşbakışı Yerleştir turda 2 → 4: −22 (etkisiz, geri) | — | **−22** | yakınsamadı |

Son değerler (senaryo Çöl / Orman / Mağara): İmparator 15: 55/84/28 = %56 (Şampiyon %47); 20: 75/64/10 = %50 (%45). Hızır 3: 52/17/43 = %37 (Bağlılık %30); 11: 67/65/0 = %44 (%39); 20: 75/0/9 = %28 (%22). Yaşlı Bilge 11: 80/68/0 = %49 (Açık El %61); 15: 37/73/1 = %37 (%55); 20: 69/0/23 = %31 (%42). Harita 11: K59 değeri %64 (Evokasyon %83); 15: %32 (%54).

Gerekçeler:
- **Yaşlı Bilge:** kullanım dökümü (11–15. sv, 16 savaş): savaş başına ~7 imza eylemi; eylem en çok "Zihin Gücü: Fırlat"a (eylem + 2 odak) gidiyor, Flurry az. Fırlat'ın bedelini artırmak 11'de eylemi saldırıya bıraktırdı (+9); 15/20'de Açık El'in 15+ gücü (Quivering Palm vb.) karşısında sayısal kol yetmiyor. Kalan fark YZ seçimine bağlı (Zihin Gücü kiplerinin değeri); bu kuyrukta YZ değişmedi.
- **Harita Öğretisi:** döküm: neredeyse yalnız büyü; 10+ imza eylemleri (Çizili Duvar 0 kullanım, Kuşbakışı seyrek) YZ'de seçilmiyor, bu yüzden onların sayıları sonucu oynatmıyor. 3. denemeye geçilmedi: kalan kolların hiçbiri kullanılan bir eylemde değil. Fark yapısal (Evokasyon'un hasar ekleri) + YZ.
- **Ölümsüz Taht** (İmparator 15) yarıçapı ve süresi kodda sabit (veri okunmuyor): sayısal kol olarak kullanılamadı.

Birleştirme öncesi duman (son verilerle, tam açık): 3 ve 7. sv 1.290, 11. sv 730, 15. sv 720, 20. sv 730 savaş; 14 geçersiz Multiattack + 1 havuz tutarsızlığı bulundu, ikisi düzeltildi (DECISIONS.md K60); düzeltme sonrası hatalı haritalarda 350 savaş 0 hata. Çökme/NaN/döngü/replay farkı 0.

## Kuyruk K59: tam açık duman testi, YZ düzeltmeleri ve denge turu (2026-11-07)

Kural sürümü 42 (değişmedi). Duman testi sonuçları DECISIONS.md (K59). Ölçümler YZ düzeltmelerinden (önizleme zar yüzdelikleri, etki içeriğine göre değer, Multiattack planı denetimi, Dunganga yaklaşması) sonra.

### Senaryo düşman listeleri (3. seviye, standart parti, 100 tohum)

`npm run sim -- 100 col orman magara dungeon --seviye 3`. Yalnız `data/sim-senaryolar.json` `enemies.3` değişti (canavar verisi değil).

| Senaryo | Önce (K59 YZ) | 1. ayar | 2. ayar | Son | Son liste |
|---|---:|---:|---:|---:|---|
| Çöl — Gündüz | 92% | 58% | **75%** | 75% | death-dog 3, gnoll-warrior 4, giant-hyena 2, scout 1 (+1 death-dog) |
| Orman | 96% | 60% | **71%** | 71% | owlbear 2, dire-wolf 3, giant-spider 1, wolf 2 (+1 owlbear, −1 wolf) |
| Mağara — karanlık | 91% | 84%¹ | **73%** | 73% | ghoul 1, giant-spider 2, ettercap 1, bugbear-warrior 2, ogre 2 (darkmantle ve bir ghoul yerine 2 ogre) |
| Dungeon — Koridor | 100% | 93% | 59% | **70%** | wight 1, ghoul 2, ghast 4, skeleton 3 (+1 wight, +1 ghast) |

¹ İlk deneme (10 düşman) haritanın düşman bölgesine sığmadı; sayı 8'de tutuldu.

### Zorluk (1. seviye standart parti, 100 tohum × Kale/Orman/Çöl/Mağara = 400 savaş; `npx vite-node src/sim/k59Zorluk.ts -- 100 --ayar … --seviye 1`)

| Ayar | Kale | Orman | Çöl | Mağara | Toplam | Fark (Normal'e göre, parti kazanma) |
|---|---:|---:|---:|---:|---:|---:|
| Normal | 70 | 82 | 65 | 74 | 72.8% | — |
| Parti Usta (K58 kodu + K59 yer seçimi) | 68 | 80 | 78 | 74 | 75.0% | +2.2 |
| Parti Usta (son: + temasız yer değiştirme) | 79 | 82 | 72 | 79 | **78.0%** | **+5.2** ✓ |
| Düşman Usta (son) | 70 | 73 | 71 | 66 | **70.0%** | **−2.8** (hedef −3) |
| Düşman Usta + temasız yer değiştirme | 76 | 73 | 71 | 81 | 75.3% | +2.5 (zayıflattı; kaldırıldı) |
| Düşman Usta, odak/kesin ×2 | 73 | 75 | 71 | 66 | 71.3% | −1.5 |
| Düşman Usta, 8 yer adayı + düşük yer maliyeti | 71 | 73 | 69 | 69 | 70.5% | −2.3 |

K58 ölçümü (30 tohum, 1. seviye): Normal %68, Düşman Usta %68. Parti tarafında hedef (Usta ≥ Normal + 3) tutuyor; düşman tarafında −2,8 puanla eşiğin hemen altında (400 savaşta standart hata ≈ 3 puan). "Deneysel" etiketi kalır, açıklaması ölçüme göre güncellendi.

### İmza alt sınıf kullanımı (7. seviye, k18 partisi, Çöl/Kale/Mağara/Orman × 5 tohum = 20 savaş; `npx vite-node src/sim/k59ImzaKullanim.ts -- 5`)

Sayım: eylem (`use_feature imza:`), tepki (`reaction_used imza-…`), pasif tetik (savaş sırasında imza karakterine bağlı imza izli olay, komut başına tekil), hazır imza büyüsü (alt sınıf `alwaysPrepared`; kullanıcı kararıyla toplamda). "Önce" = K58 YZ'si, K58 sayımı yalnız eylemi sayıyordu.

| Alt sınıf | K58 sayımı (eylem/savaş) | Önce: eylem / tepki / pasif / hazır büyü | Önce toplam / savaş | Sonra: eylem / tepki / pasif / hazır büyü | Sonra toplam / savaş | ≥ 1 |
|---|---:|---|---:|---|---:|---|
| İmparator | 3.05 | 61 / 0 / 57 / 0 | 5.90 | 54 / 0 / 42 / 0 | 4.80 | ✓ |
| İnfazcı | 2.90 | 58 / 0 / 28 / 0 | 4.30 | 56 / 0 / 27 / 0 | 4.15 | ✓ |
| Çiftçi | 1.10 | 22 / 0 / 0 / – | 1.10 | 20 / 0 / 0 / 0 | 1.00 | ✓ |
| Dunganga | 0.55 | 14 / 0 / 0 / 11 | 1.25 | 14 / 0 / 0 / 10 | 1.20 | ✓ (hazır büyüyle) |
| Astrolog | 2.35 | 47 / 19 / 18 / – | 4.20 | 42 / 18 / 16 / 1 | 3.85 | ✓ |
| Birlik Manastırı | 2.20 | 44 / 0 / 2 / – | 2.30 | 45 / 0 / 2 / 0 | 2.35 | ✓ |
| Geride Kalanın Yolu | 0.00 | 0 / 29 / 193 / – | 11.10 | 0 / 31 / 199 / 0 | 11.50 | ✓ |
| Şair Koleji | 3.80 | 76 / 0 / 0 / – | 3.80 | 77 / 0 / 0 / 0 | 3.85 | ✓ |
| Yaşlı Bilge Disiplini | 3.20 | 64 / 18 / 0 / – | 4.10 | 66 / 18 / 0 / 0 | 4.20 | ✓ |
| Hızır Yemini | 0.00 | 0 / 40 / 64 / – | 5.20 | 0 / 39 / 54 / 50 | 7.15 | ✓ |
| Harita Öğretisi | 1.10 | 22 / 0 / 20 / – | 2.10 | 20 / 0 / 20 / 0 | 2.00 | ✓ |

"Önce" satırlarında hazır büyü sütunu yalnız Dunganga için ölçüldü (sütun sonradan eklendi; "–"). Dunganga'ya yakın menzilli imza eylemi için yaklaşma (veride `yzYaklas`) eklendi; ölçülebilir fark yok (eylem 14 → 14). Hedef (≥ 1 imza etkisi / savaş) 11 alt sınıfın hepsinde tutuyor; Dunganga yalnız hazır imza büyüleri sayılınca (kullanıcı kararı).

### Alt sınıf denge ızgarası (tam: 3/7/11/15/20, 2026-11-07)

`npx vite-node src/sim/k59Denge.ts -- 100 --kap` (k18-<sınıf> partisi: sınıf + Bor/Tavi/Sela; SRD alt sınıfı ↔ imza alt sınıfı ya da Karadul (Toprak Çemberi), ev kuralı açık; Çöl/Orman/Mağara × 100 tohum = alt sınıf × seviye başına 300 savaş; 360 birim; tablo `node scripts/k59-denge-tablo.mjs <klasör>`). Ölçüt: SRD karşılığına göre ±5 puan. Hızır satırları Tam Zamanında 30 ft ayarından sonra (3. ve 7. sv yeniden ölçüldü). İki 300 savaşlık oranın farkında standart hata ≈ 4 puan.
Notlar: (1) Partinin 4 üyesinden yalnız biri değişir; fark seyreltik. (2) Taban etkisi: 7. seviyede çoğu sınıf, 20. seviyede bazıları Orman/Mağara'da %0 kazanıyor; o sınıflarda fark yalnız kalan senaryodan okunur. (3) Önceki kısmi tablodaki birkaç taban değeri yinelenen satırlarla fazla sayılmıştı (ör. Bağlılık 3. sv %34 → doğrusu %30); tekilleştirme sonra eklendi.

| Sınıf | Alt sınıf | SRD karşılığı | Sv | Senaryolar (Çöl/Orman/Mağara) | Kazanma | SRD | Fark | Durum |
|---|---|---|---:|---|---:|---:|---:|---|
| barbarian | Çılgın Savaşçı Yolu | — | 3 | 31 / 31 / 49 | 37% | 37% | — | SRD (taban) |
| barbarian | Geride Kalanın Yolu | Çılgın Savaşçı Yolu | 3 | 34 / 20 / 48 | 34% | 37% | -3 | aralıkta |
| barbarian | Çılgın Savaşçı Yolu | — | 7 | 11 / 0 / 0 | 4% | 4% | — | SRD (taban) |
| barbarian | Geride Kalanın Yolu | Çılgın Savaşçı Yolu | 7 | 11 / 0 / 0 | 4% | 4% | 0 | aralıkta |
| barbarian | Çılgın Savaşçı Yolu | — | 11 | 92 / 76 / 0 | 56% | 56% | — | SRD (taban) |
| barbarian | Geride Kalanın Yolu | Çılgın Savaşçı Yolu | 11 | 91 / 73 / 0 | 55% | 56% | -1 | aralıkta |
| barbarian | Geride Kalanın Yolu | Çılgın Savaşçı Yolu | 15 | 63 / 86 / 12 | 54% | 45% | +8 | güçlü (aralık dışı) |
| barbarian | Çılgın Savaşçı Yolu | — | 15 | 60 / 74 / 2 | 45% | 45% | — | SRD (taban) |
| barbarian | Geride Kalanın Yolu | Çılgın Savaşçı Yolu | 20 | 96 / 0 / 7 | 34% | 33% | +2 | aralıkta |
| barbarian | Çılgın Savaşçı Yolu | — | 20 | 90 / 0 / 8 | 33% | 33% | — | SRD (taban) |
| bard | Bilgi Koleji | — | 3 | 52 / 60 / 67 | 60% | 60% | — | SRD (taban) |
| bard | Şair Koleji | Bilgi Koleji | 3 | 48 / 46 / 51 | 48% | 60% | -11 | zayıf (aralık dışı) |
| bard | Bilgi Koleji | — | 7 | 35 / 0 / 0 | 12% | 12% | — | SRD (taban) |
| bard | Şair Koleji | Bilgi Koleji | 7 | 36 / 0 / 0 | 12% | 12% | +0 | aralıkta |
| bard | Şair Koleji | Bilgi Koleji | 11 | 64 / 79 / 0 | 48% | 47% | +0 | aralıkta |
| bard | Bilgi Koleji | — | 11 | 62 / 80 / 0 | 47% | 47% | — | SRD (taban) |
| bard | Bilgi Koleji | — | 15 | 21 / 71 / 9 | 34% | 34% | — | SRD (taban) |
| bard | Şair Koleji | Bilgi Koleji | 15 | 47 / 70 / 7 | 41% | 34% | +8 | güçlü (aralık dışı) |
| bard | Bilgi Koleji | — | 20 | 68 / 0 / 6 | 25% | 25% | — | SRD (taban) |
| bard | Şair Koleji | Bilgi Koleji | 20 | 75 / 0 / 13 | 29% | 25% | +5 | aralıkta |
| cleric | Yaşam Etki Alanı | — | 3 | 57 / 68 / 79 | 68% | 68% | — | SRD (taban) |
| cleric | Birlik Manastırı | Yaşam Etki Alanı | 3 | 62 / 73 / 79 | 71% | 68% | +3 | aralıkta |
| cleric | Yaşam Etki Alanı | — | 7 | 23 / 27 / 71 | 40% | 40% | — | SRD (taban) |
| cleric | Birlik Manastırı | Yaşam Etki Alanı | 7 | 4 / 17 / 64 | 28% | 40% | -12 | zayıf (aralık dışı) |
| cleric | Birlik Manastırı | Yaşam Etki Alanı | 11 | 6 / 15 / 27 | 16% | 31% | -15 | zayıf (aralık dışı) |
| cleric | Yaşam Etki Alanı | — | 11 | 11 / 28 / 55 | 31% | 31% | — | SRD (taban) |
| cleric | Yaşam Etki Alanı | — | 15 | 0 / 34 / 1 | 12% | 12% | — | SRD (taban) |
| cleric | Birlik Manastırı | Yaşam Etki Alanı | 15 | 0 / 29 / 0 | 10% | 12% | -2 | aralıkta |
| cleric | Yaşam Etki Alanı | — | 20 | 20 / 10 / 0 | 10% | 10% | — | SRD (taban) |
| cleric | Birlik Manastırı | Yaşam Etki Alanı | 20 | 5 / 5 / 2 | 4% | 10% | -6 | zayıf (aralık dışı) |
| druid | Toprak Çemberi | — | 3 | 48 / 34 / 68 | 50% | 50% | — | SRD (taban) |
| druid | Karadul Çemberi | Toprak Çemberi | 3 | 53 / 41 / 63 | 52% | 50% | +2 | aralıkta |
| druid | Toprak Çemberi | — | 7 | 42 / 30 / 53 | 42% | 42% | — | SRD (taban) |
| druid | Karadul Çemberi | Toprak Çemberi | 7 | 44 / 30 / 42 | 39% | 42% | -3 | aralıkta |
| druid | Karadul Çemberi | Toprak Çemberi | 11 | 64 / 77 / 39 | 60% | 63% | -3 | aralıkta |
| druid | Toprak Çemberi | — | 11 | 72 / 71 / 46 | 63% | 63% | — | SRD (taban) |
| druid | Karadul Çemberi | Toprak Çemberi | 15 | 38 / 85 / 5 | 43% | 41% | +1 | aralıkta |
| druid | Toprak Çemberi | — | 15 | 36 / 80 / 8 | 41% | 41% | — | SRD (taban) |
| druid | Karadul Çemberi | Toprak Çemberi | 20 | 51 / 38 / 3 | 31% | 38% | -7 | zayıf (aralık dışı) |
| druid | Toprak Çemberi | — | 20 | 71 / 37 / 5 | 38% | 38% | — | SRD (taban) |
| fighter | Şampiyon | — | 3 | 25 / 12 / 22 | 20% | 20% | — | SRD (taban) |
| fighter | İmparator | Şampiyon | 3 | 18 / 14 / 24 | 19% | 20% | -1 | aralıkta |
| fighter | Şampiyon | — | 7 | 57 / 48 / 85 | 63% | 63% | — | SRD (taban) |
| fighter | İmparator | Şampiyon | 7 | 50 / 47 / 94 | 64% | 63% | +0 | aralıkta |
| fighter | İmparator | Şampiyon | 11 | 73 / 68 / 83 | 75% | 84% | -9 | zayıf (aralık dışı) |
| fighter | Şampiyon | — | 11 | 89 / 81 / 81 | 84% | 84% | — | SRD (taban) |
| fighter | Şampiyon | — | 15 | 35 / 83 / 23 | 47% | 47% | — | SRD (taban) |
| fighter | İmparator | Şampiyon | 15 | 80 / 92 / 50 | 74% | 47% | +27 | güçlü (aralık dışı) |
| fighter | Şampiyon | — | 20 | 70 / 62 / 3 | 45% | 45% | — | SRD (taban) |
| fighter | İmparator | Şampiyon | 20 | 85 / 89 / 11 | 62% | 45% | +17 | güçlü (aralık dışı) |
| monk | Açık El Savaşçısı | — | 3 | 37 / 15 / 52 | 35% | 35% | — | SRD (taban) |
| monk | Yaşlı Bilge Disiplini | Açık El Savaşçısı | 3 | 22 / 14 / 52 | 29% | 35% | -5 | zayıf (aralık dışı) |
| monk | Açık El Savaşçısı | — | 7 | 37 / 0 / 0 | 12% | 12% | — | SRD (taban) |
| monk | Yaşlı Bilge Disiplini | Açık El Savaşçısı | 7 | 22 / 0 / 0 | 7% | 12% | -5 | zayıf (aralık dışı) |
| monk | Yaşlı Bilge Disiplini | Açık El Savaşçısı | 11 | 59 / 62 / 0 | 40% | 61% | -21 | zayıf (aralık dışı) |
| monk | Açık El Savaşçısı | — | 11 | 93 / 91 / 0 | 61% | 61% | — | SRD (taban) |
| monk | Açık El Savaşçısı | — | 15 | 78 / 84 / 4 | 55% | 55% | — | SRD (taban) |
| monk | Yaşlı Bilge Disiplini | Açık El Savaşçısı | 15 | 41 / 64 / 1 | 35% | 55% | -20 | zayıf (aralık dışı) |
| monk | Yaşlı Bilge Disiplini | Açık El Savaşçısı | 20 | 63 / 0 / 26 | 30% | 42% | -12 | zayıf (aralık dışı) |
| monk | Açık El Savaşçısı | — | 20 | 86 / 0 / 39 | 42% | 42% | — | SRD (taban) |
| paladin | Bağlılık Yemini | — | 3 | 39 / 10 / 40 | 30% | 30% | — | SRD (taban) |
| paladin | Hızır Yemini | Bağlılık Yemini | 3 | 50 / 18 / 50 | 39% | 30% | +10 | güçlü (aralık dışı) |
| paladin | Bağlılık Yemini | — | 7 | 18 / 0 / 6 | 8% | 8% | — | SRD (taban) |
| paladin | Hızır Yemini | Bağlılık Yemini | 7 | 16 / 2 / 5 | 8% | 8% | -0 | aralıkta |
| paladin | Bağlılık Yemini | — | 11 | 60 / 58 / 0 | 39% | 39% | — | SRD (taban) |
| paladin | Hızır Yemini | Bağlılık Yemini | 11 | 67 / 65 / 3 | 45% | 39% | +6 | güçlü (aralık dışı) |
| paladin | Bağlılık Yemini | — | 15 | 25 / 80 / 8 | 38% | 38% | — | SRD (taban) |
| paladin | Hızır Yemini | Bağlılık Yemini | 15 | 32 / 77 / 7 | 39% | 38% | +1 | aralıkta |
| paladin | Bağlılık Yemini | — | 20 | 57 / 0 / 8 | 22% | 22% | — | SRD (taban) |
| paladin | Hızır Yemini | Bağlılık Yemini | 20 | 94 / 0 / 21 | 38% | 22% | +17 | güçlü (aralık dışı) |
| ranger | Avcı | — | 3 | 27 / 17 / 33 | 26% | 26% | — | SRD (taban) |
| ranger | Çiftçi | Avcı | 3 | 21 / 19 / 35 | 25% | 26% | -1 | aralıkta |
| ranger | Çiftçi | Avcı | 7 | 23 / 0 / 0 | 8% | 6% | +1 | aralıkta |
| ranger | Avcı | — | 7 | 19 / 0 / 0 | 6% | 6% | — | SRD (taban) |
| ranger | Avcı | — | 11 | 71 / 67 / 0 | 46% | 46% | — | SRD (taban) |
| ranger | Çiftçi | Avcı | 11 | 67 / 68 / 0 | 45% | 46% | -1 | aralıkta |
| ranger | Avcı | — | 15 | 48 / 71 / 4 | 41% | 41% | — | SRD (taban) |
| ranger | Çiftçi | Avcı | 15 | 45 / 81 / 0 | 42% | 41% | +1 | aralıkta |
| ranger | Avcı | — | 20 | 70 / 0 / 1 | 24% | 24% | — | SRD (taban) |
| ranger | Çiftçi | Avcı | 20 | 68 / 0 / 4 | 24% | 24% | +0 | aralıkta |
| rogue | Hırsız | — | 3 | 22 / 12 / 33 | 22% | 22% | — | SRD (taban) |
| rogue | İnfazcı | Hırsız | 3 | 11 / 23 / 27 | 20% | 22% | -2 | aralıkta |
| rogue | Hırsız | — | 7 | 65 / 41 / 92 | 66% | 66% | — | SRD (taban) |
| rogue | İnfazcı | Hırsız | 7 | 64 / 41 / 87 | 64% | 66% | -2 | aralıkta |
| rogue | Hırsız | — | 11 | 86 / 79 / 89 | 85% | 85% | — | SRD (taban) |
| rogue | İnfazcı | Hırsız | 11 | 89 / 81 / 83 | 84% | 85% | -0 | aralıkta |
| rogue | Hırsız | — | 15 | 44 / 83 / 23 | 50% | 50% | — | SRD (taban) |
| rogue | İnfazcı | Hırsız | 15 | 45 / 84 / 31 | 53% | 50% | +3 | aralıkta |
| rogue | Hırsız | — | 20 | 65 / 51 / 2 | 39% | 39% | — | SRD (taban) |
| rogue | İnfazcı | Hırsız | 20 | 76 / 71 / 10 | 52% | 39% | +13 | güçlü (aralık dışı) |
| sorcerer | Ejderha Büyücülüğü | — | 3 | 37 / 18 / 41 | 32% | 32% | — | SRD (taban) |
| sorcerer | Dunganga | Ejderha Büyücülüğü | 3 | 24 / 19 / 29 | 24% | 32% | -8 | zayıf (aralık dışı) |
| sorcerer | Ejderha Büyücülüğü | — | 7 | 83 / 74 / 94 | 84% | 84% | — | SRD (taban) |
| sorcerer | Dunganga | Ejderha Büyücülüğü | 7 | 66 / 55 / 81 | 67% | 84% | -16 | zayıf (aralık dışı) |
| sorcerer | Ejderha Büyücülüğü | — | 11 | 79 / 97 / 87 | 88% | 88% | — | SRD (taban) |
| sorcerer | Dunganga | Ejderha Büyücülüğü | 11 | 73 / 80 / 70 | 74% | 88% | -13 | zayıf (aralık dışı) |
| sorcerer | Ejderha Büyücülüğü | — | 15 | 35 / 91 / 31 | 52% | 52% | — | SRD (taban) |
| sorcerer | Dunganga | Ejderha Büyücülüğü | 15 | 34 / 81 / 16 | 44% | 52% | -9 | zayıf (aralık dışı) |
| sorcerer | Ejderha Büyücülüğü | — | 20 | 64 / 75 / 6 | 48% | 48% | — | SRD (taban) |
| sorcerer | Dunganga | Ejderha Büyücülüğü | 20 | 65 / 54 / 2 | 40% | 48% | -8 | zayıf (aralık dışı) |
| warlock | İblis Hamisi | — | 3 | 52 / 16 / 43 | 37% | 37% | — | SRD (taban) |
| warlock | Astrolog | İblis Hamisi | 3 | 48 / 15 / 35 | 33% | 37% | -4 | aralıkta |
| warlock | İblis Hamisi | — | 7 | 42 / 9 / 21 | 24% | 24% | — | SRD (taban) |
| warlock | Astrolog | İblis Hamisi | 7 | 34 / 9 / 16 | 20% | 24% | -4 | aralıkta |
| warlock | İblis Hamisi | — | 11 | 88 / 65 / 54 | 69% | 69% | — | SRD (taban) |
| warlock | Astrolog | İblis Hamisi | 11 | 78 / 73 / 50 | 67% | 69% | -2 | aralıkta |
| warlock | İblis Hamisi | — | 15 | 49 / 84 / 12 | 48% | 48% | — | SRD (taban) |
| warlock | Astrolog | İblis Hamisi | 15 | 52 / 90 / 12 | 51% | 48% | +3 | aralıkta |
| warlock | Astrolog | İblis Hamisi | 20 | 84 / 52 / 42 | 59% | 56% | +3 | aralıkta |
| warlock | İblis Hamisi | — | 20 | 69 / 51 / 48 | 56% | 56% | — | SRD (taban) |
| wizard | Evokasyon Ustası | — | 3 | 16 / 13 / 23 | 17% | 17% | — | SRD (taban) |
| wizard | Harita Öğretisi | Evokasyon Ustası | 3 | 15 / 17 / 24 | 19% | 17% | +1 | aralıkta |
| wizard | Harita Öğretisi | Evokasyon Ustası | 7 | 38 / 37 / 54 | 43% | 62% | -19 | zayıf (aralık dışı) |
| wizard | Evokasyon Ustası | — | 7 | 51 / 45 / 89 | 62% | 62% | — | SRD (taban) |
| wizard | Evokasyon Ustası | — | 11 | 86 / 80 / 82 | 83% | 83% | — | SRD (taban) |
| wizard | Harita Öğretisi | Evokasyon Ustası | 11 | 67 / 69 / 56 | 64% | 83% | -19 | zayıf (aralık dışı) |
| wizard | Harita Öğretisi | Evokasyon Ustası | 15 | 19 / 73 / 3 | 32% | 54% | -22 | zayıf (aralık dışı) |
| wizard | Evokasyon Ustası | — | 15 | 44 / 87 / 30 | 54% | 54% | — | SRD (taban) |
| wizard | Evokasyon Ustası | — | 20 | 69 / 54 / 2 | 42% | 42% | — | SRD (taban) |
| wizard | Harita Öğretisi | Evokasyon Ustası | 20 | 57 / 39 / 0 | 32% | 42% | -10 | zayıf (aralık dışı) |

Aralık dışı: 28
- Geride Kalanın Yolu (barbarian) sv15: +8
- Şair Koleji (bard) sv3: -11
- Şair Koleji (bard) sv15: +8
- Birlik Manastırı (cleric) sv7: -12
- Birlik Manastırı (cleric) sv11: -15
- Birlik Manastırı (cleric) sv20: -6
- Karadul Çemberi (druid) sv20: -7
- İmparator (fighter) sv11: -9
- İmparator (fighter) sv15: +27
- İmparator (fighter) sv20: +17
- Yaşlı Bilge Disiplini (monk) sv3: -5
- Yaşlı Bilge Disiplini (monk) sv7: -5
- Yaşlı Bilge Disiplini (monk) sv11: -21
- Yaşlı Bilge Disiplini (monk) sv15: -20
- Yaşlı Bilge Disiplini (monk) sv20: -12
- Hızır Yemini (paladin) sv3: +10
- Hızır Yemini (paladin) sv11: +6
- Hızır Yemini (paladin) sv20: +17
- İnfazcı (rogue) sv20: +13
- Dunganga (sorcerer) sv3: -8
- Dunganga (sorcerer) sv7: -16
- Dunganga (sorcerer) sv11: -13
- Dunganga (sorcerer) sv15: -9
- Dunganga (sorcerer) sv20: -8
- Harita Öğretisi (wizard) sv7: -19
- Harita Öğretisi (wizard) sv11: -19
- Harita Öğretisi (wizard) sv15: -22
- Harita Öğretisi (wizard) sv20: -10

### Kabul edilen sapmalar (kullanıcı kararı bekliyor)

Sıra (DENGE kuralı): YZ → eksik/planlı özellik → küçük sayısal ayar. Bu kuyrukta uygulanan: Hızır Tam Zamanında 60 → 30 ft (3. sv +15 → +10), Dunganga yaklaşma (YZ; etkisiz), Şair ilham önceliği (YZ; etkisiz, geri alındı). Kalan farklar küçük adımla kapanmayacak kadar büyük ya da 300 savaşlık gürültü (±4) sınırında; ayrıntı ve öneriler:

| Alt sınıf | Seviye: fark | Olası neden | Öneri |
|---|---|---|---|
| Harita Öğretisi (Wizard) | 7: −19, 11: −19, 15: −22, 20: −10 | Evokasyon'un hazır hasar büyüleri (Empowered Evocation, Overchannel) ↔ Harita'nın konum/zemin eylemleri; YZ zemin/duvarın değerini hasar gibi ölçmüyor | YZ'de duvar/zemin eyleminin "önlenen hasar" değeri (ayrı kuyruk); sayısal: Çizili Duvar HP'si ya da kullanım sayısı |
| Dunganga (Sorcerer) | 3: −8, 7: −16, 11: −13, 15: −9, 20: −8 | Ejderha Büyücülüğü'nün Elemental Affinity hasarı ↔ Dunganga'nın kontrol eylemleri (30 ft); Sepet hasarla bozuluyor, dostlar sepetteki düşmana vuruyor | Ninni menzili 30 → 60 ft ya da Sepet'in hasarla bozulmaması (veri); YZ'de sepetteki hedefi atlama |
| Yaşlı Bilge Disiplini (Monk) | 3: −5, 7: −5, 11: −21, 15: −20, 20: −12 | 11+ seviyede Açık El'in (Quivering Palm vb.) gücü; Zihin Gücü kiplerinin değeri düşük | 11+ özelliklerinin YZ kullanımı incelenmeli; sayısal: Zihin Gücü hasar zarı |
| Birlik Manastırı (Cleric) | 7: −12, 11: −15, 20: −6 | Yaşam'ın iyileştirme ekleri ↔ Bağ/Havuz; havuz toplu hasarda erken bitebiliyor | Ortak Şifa seviyesi 8 → 6 ya da havuz koruması (Yıkılmaz Birlik) erken seviyede |
| Şair Koleji (Bard) | 3: −11, 15: +8 | 3. sv Bilgi'nin Cutting Words tepkisi ↔ Mısra'nın Bardic Inspiration harcaması; 15'te Ölümsüz Dize güçlü | Mısra: Hiciv'in ilham harcamaması ya da zarın +1 adım büyümesi (3. sv) |
| İmparator (Fighter) | 11: −9, 15: +27, 20: +17 | 15+ seviyede Ölümsüz Taht + Ferman zinciri çok güçlü (partiye avantaj aurası) | Ölümsüz Taht süresi 10 → 1 tur ya da yarıçap 30 → 15 ft (veri) |
| Hızır Yemini (Paladin) | 3: +10, 11: +6, 20: +17 | 3. sv Tam Zamanında (yarı hasar + dost koruması); 20. sv Yetişen Yol + Mucize | Tam Zamanında hasar payı 0,5 → 0,75 (kodda sabit; veriye bağlanmalı), Yetişen Yol direnci kısıt |
| İnfazcı (Rogue) | 20: +13 | 17+ İnfaz ölümü (zayıf hedefte kesin öldürme) | İnfaz eşiği (seviye × 4 → × 3) |
| Geride Kalanın Yolu (Barbarian) | 15: +8 | Öfkeyle Ayakta + Küllerden Doğan (14) | gürültü sınırında; izlenmeli |
| Karadul Çemberi (Druid) | 20: −7 | Toprak Çemberi'nin 20. sv büyüleri | gürültü sınırında |


## Kuyruk K58: savaş okunabilirliği ve yapay zekâ — regresyon ve zorluk (2026-11-06)

Ayar yok (denge K59). Kural sürümü 42 (değişmedi).

**Regresyon** (6 senaryo × 50 tohum, standart parti, 3. seviye, `npm run sim:tek -- 50 col kale magara orman dungeon taverna --seviye 3`; önce `wip/p11`, sonra `wip/k58`). Varsayılan yapay zekâ değişmediği için bütün satırlar aynı; 8 puandan büyük fark yok.

| Senaryo | Kazanma önce / sonra | Ort. tur önce / sonra | Ort. düşmüş PC önce / sonra |
|---|---|---|---|
| Çöl — Gündüz | 94% / 94% | 10.2 / 10.2 | 0.58 / 0.58 |
| Orman | 98% / 98% | 5.1 / 5.1 | 0.50 / 0.50 |
| Mağara — karanlık | 88% / 88% | 7.3 / 7.3 | 0.82 / 0.82 |
| Dungeon — Koridor (meşale) | 100% / 100% | 5.5 / 5.5 | 0.16 / 0.16 |
| Kale — Gündüz | 80% / 80% | 9.7 / 9.7 | 0.88 / 0.88 |
| Taverna — 4 masum ortada | 86% / 86% | 9.0 / 9.0 | 1.08 / 1.08 |

Aralık dışı (%60–80 hedefi): Çöl, Orman, Mağara, Dungeon (üstünde); düzeltme K59.

**Zorluk sıralaması** (`npx vite-node src/sim/k58Zorluk.ts -- 30 --seviye 1`; 1. seviye standart parti, 30 tohum; diğer taraf Normal). Parti yapay zekâsı: Kolay < Normal ≤ Usta. Düşman yapay zekâsı: Kolay düşmana karşı parti belirgin daha çok kazanıyor; Usta düşman Normal'den güçlü değil (Y2'deki "deneysel" notu geçerli).

| Ayar | Kale | Orman | Çöl | Mağara | Ort. |
|---|---|---|---|---|---|
| Parti Kolay | 57% | 67% | 43% | 43% | 53% |
| Normal | 67% | 80% | 60% | 67% | 68% |
| Parti Usta | 67% | 77% | 73% | 70% | 72% |
| Düşman Kolay | 73% | 90% | 87% | 80% | 83% |
| Düşman Usta | 63% | 80% | 63% | 67% | 68% |

**İmza alt sınıf eylemleri** (`npx vite-node src/sim/k58ImzaKullanim.ts -- 5`; 7. seviye `k18-<sınıf>` partisi, ev kuralı açık, Çöl/Kale/Mağara/Orman × 5 tohum = 20 savaş; imza karakterinin komutları).

| Alt sınıf | İmza eylemi | Büyü | Saldırı | İmza / savaş |
|---|---|---|---|---|
| İmparator | 61 | 0 | 264 | 3.05 |
| İnfazcı | 58 | 0 | 128 | 2.90 |
| Çiftçi | 22 | 72 | 140 | 1.10 |
| Dunganga | 11 | 155 | 0 | 0.55 |
| Astrolog | 47 | 155 | 0 | 2.35 |
| Birlik Manastırı | 44 | 152 | 7 | 2.20 |
| Geride Kalanın Yolu | 0 | 0 | 270 | 0.00 |
| Şair Koleji | 76 | 187 | 2 | 3.80 |
| Yaşlı Bilge Disiplini | 64 | 0 | 182 | 3.20 |
| Hızır Yemini | 0 | 199 | 47 | 0.00 |
| Harita Öğretisi | 22 | 121 | 0 | 1.10 |

Geride Kalanın Yolu ve Hızır Yemini `use_feature` imza eylemi hiç yapmıyor (Hızır'ın özellikleri çoğunlukla tepki/aura; tepkiler bu sayımda yok), Dunganga büyüyü tercih ediyor. Bulgu DECISIONS.md (K58); düzeltme K59.

## Kuyruk K56: arazi × büyü — hızlı regresyon (2026-11-06)

Ayar yok. Büyücü partisi, 5. seviye, 30 tohum, `npm run sim -- 30 col kale magara orman --seviye 5 --parti buyucu`; kural sürümü 32 (`KURAL_SURUMU=32`) ile 33 (arazi × büyü açık) aynı tohumlarda.

| Senaryo | Kazanma 32 / 33 | Ort. tur 32 / 33 | Ort. düşmüş PC 32 / 33 |
|---|---|---|---|
| Çöl — Gündüz | 100% / 100% | 3.4 / 3.4 | 0.00 / 0.00 |
| Kale — Gündüz | 100% / 100% | 3.9 / 3.6 | 0.07 / 0.03 |
| Mağara — karanlık | 100% / 100% | 3.5 / 3.5 | 0.00 / 0.00 |
| Orman | 100% / 100% | 3.4 / 3.4 | 0.03 / 0.03 |

Kale'de ateş büyüleri ahşap eşyalarda (`x`) kısa alev bırakıyor; savaş biraz kısalıyor. Aralık dışı (%100, hedef %60–80): büyücü partisi bu listelere karşı önceki ölçümlerdeki gibi güçlü; düzeltme "Dungeondex öncesi tam test turu"na.

## Kuyruk A4: kısmi büyülerin tamamlanması — hızlı regresyon (2026-11-06)

Ayar yok. Büyücü partisi, 5. seviye, 30 tohum, `npm run sim -- 30 col kale magara orman --seviye 5 --parti buyucu`; kural sürümü 31 (`KURAL_SURUMU=31`) ile 32 aynı tohumlarda. Fark yok: değişen büyüleri (Blur, Mirror Image, Hex, Bestow Curse, Color Spray, Fear, Expeditious Retreat, Beacon of Hope, Protection from Poison, Starry Wisp, Holy Aura) bu karşılaşmalarda yapay zekâ ya hiç seçmiyor ya da sonucu değiştirmiyor (düşmanlarda Blindsight/Truesight yok).

| Senaryo | Kazanma 31 | Kazanma 32 | Ort. tur 31 / 32 | Ort. düşmüş PC 31 / 32 |
|---|---:|---:|---|---|
| Çöl — Gündüz | 100% | 100% | 3.4 / 3.4 | 0.00 / 0.00 |
| Kale — Gündüz | 100% | 100% | 3.9 / 3.9 | 0.07 / 0.07 |
| Mağara — karanlık | 100% | 100% | 3.5 / 3.5 | 0.00 / 0.00 |
| Orman | 100% | 100% | 3.4 / 3.4 | 0.03 / 0.03 |

Aralık dışı (hedef %60–80'in üstü): dördü de %100 — büyücü partisi bu listelere karşı önceki ölçümlerdeki gibi güçlü; düzeltme "Dungeondex öncesi tam test turu"na.

## Kuyruk Y2: Y1 regresyon düzeltmesi — yapay zekâ davranışı, süre, Usta (2026-11-05)

Ayar yok (oyun sayıları değişmedi; yalnız YZ ağırlıkları `data/yz-roller.json` ve iki motor hatası). 100 tohum, aynı tohumlar. "Eski" = `YZ_ESKI=1` (Y1 öncesi zincir) **Y2 kodunda** (iki motor hatası düzeltilmiş: Trol uzvu kimliği, yerdeki Trol'e büyü saldırısı); "Y1" = `wip/a1` (`6062fce`) olduğu gibi; "Y2" = `wip/y2` (Normal). Kural sürümü değişmedi.

**SRD partisi** (`npm run sim -- 100 <senaryo> --seviye 5`, standart parti; kazanma / berabere / ort. tur):

| Senaryo | Eski | Y1 | Y2 | Y2 − eski | Y2 − Y1 |
|---|---|---|---|---:|---:|
| Düz — haritasız | 94% / 0% / 6.3 | 98% / 0% / 5.5 | 98% / 0% / 5.5 | +4 | 0 |
| Çöl — Gündüz | 89% / 1% / 6.3 | 90% / 0% / 7.0 | 89% / 0% / 7.0 | 0 | −1 |
| Orman | 65% / 0% / 5.5 | 73% / 0% / 5.9 | 73% / 0% / 6.0 | **+8** | 0 |
| Mağara — karanlık | 94% / 1% / 6.1 | 59% / 14% / 9.4 | 89% / 6% / 7.3 | −5 | **+30** |
| Dungeon — Koridor | 100% / 0% / 5.1 | 98% / 0% / 5.5 | 99% / 0% / 5.3 | −1 | +1 |
| Kale — Gündüz | 64% / 0% / 6.9 | 62% / 0% / 6.7 | 69% / 0% / 6.6 | +5 | +7 |

**İmza alt sınıflar** (`npm run sim:imza -- 100 --alt <id> --yalniz <id> --seviye 7 --senaryo <senaryo>`, 6 senaryo ortalaması):

| Alt sınıf | Eski | Y1 | Y2 | Y2 − eski | Y1 − eski |
|---|---:|---:|---:|---:|---:|
| Dunganga | 68.0% | 73.2% | 75.5% | **+7.5** | +5.2 |
| Harita Öğretisi | 60.2% | 59.8% | 61.3% | +1.1 | −0.4 |

Senaryo ayrıntısı (eski / Y1 / Y2): Dunganga Çöl 56/73/67, Dungeon 99/100/100, Düz 99/100/100, Kale 58/57/61, Mağara 60/64/72, Orman 36/45/53; Harita Çöl 34/38/33, Dungeon 98/100/99, Düz 94/100/100, Kale 44/41/44, Mağara 58/43/55, Orman 33/37/37.

**Zorluk** (parti `YZ_ZORLUK=usta`, düşman Normal; aynı 6 senaryo, 100 tohum): Usta − Normal = Düz −1, Çöl +1, Orman −6, Mağara 0, Dungeon +1, Kale −7; **ortalama −2,0** (Usta 84,2%, Normal 86,2%). Hedef (+5) tutmadı → Usta "deneysel" (DECISIONS.md).

Notlar:
- **Hedefler:** Mağara ve Kale eskinin ±8 puanı içinde (−5, +5); Mağara beraberliği %14 → %6 (eşik %6, aşılmadı). Orman kazancı korunuyor (+8; 100 tohumda Y1 de +8, 50 tohumdaki +14 gürültüydü). Dunganga ve Harita'nın eskiye göre kazancı Y1'den büyük (+7.5, +1.1; Y1'de +5.2, −0.4).
- Mağara'da eski YZ de motor hatasından etkileniyordu: hata düzeltilmeden (Y2 ilk koşusu) eski 79% / berabere 11%, Y2 74% / 12%. Y1 sütunu düzeltilmemiş motorla (Trol'e Fire Bolt boşa gidiyor); Mağara satırlarında Y1 − eski farkının bir kısmı motor hatası.
- İmza Mağara satırlarının "Y1" değeri de düzeltilmemiş motorla (Harita 43 → Y2 55).
- Ayrıntılı nedenler: YZ-DENETIM.md "Y2 bulguları".

**Süre** (`npm run sim:yz-sure -- 3 <senaryo> --parti buyucu`; 6 kişilik büyücü partisi, her `chooseCommand`; bu makine, tek süreç; "×4" telefon tahmini):

| Senaryo | Sürüm | Karar | Ort. ms | p50 | p95 | En çok | ×4 ort. | ×4 p95 | Aday/karar | Kuru çalıştırma/karar | tryCmd/karar (önbellek dışı) | Karar imzası |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Çöl — Gemi Enkazı (6 düşman) | önce (Y1) | 98 | 23.6 | 10.0 | 116.0 | 255.4 | 94.5 | 464.1 | – | – | – | 8e76e115 |
| Çöl — Gemi Enkazı (6 düşman) | sonra (Y2) | 98 | 20.8 | 9.2 | 97.6 | 204.2 | 83.4 | 390.6 | 7.4 | 13.2 | 231.0 (225.6) | 8e76e115 |
| Kale — Gündüz (17 düşman) | önce (Y1) | 303 | 26.7 | 10.3 | 119.5 | 211.5 | 106.9 | 477.9 | – | – | – | 4d84c004 |
| Kale — Gündüz (17 düşman) | sonra (Y2) | 299 | 24.1 | 8.5 | 109.1 | 162.0 | 96.4 | 436.5 | 7.8 | 14.2 | 112.2 (100.8) | e5a3f396 |

- **Bütçe** (ort. ≤ 60 ms, p95 ≤ 200 ms, bu makine): **tutuyor**, önce de tutuyordu; önbellekler ≈ %10 kısalttı. Gemi Enkazı'nda karar imzası aynı (aynı komut dizisi); Kale'de farklı çünkü G1 hareket düzeltmeleri kararı değiştiriyor (önbellek kararı değiştirmez: test `y2.test.ts`).
- **Telefon (×4):** ortalama 83–96 ms, p95 390–440 ms: tek karar bütçeyi aşar. Arayüzde düşman turları artık tek tek oynatılıyor ve aralarında bir çerçeve bırakılıyor (eskiden bütün düşman turları tek eşzamanlı adımdı); tek kararın içi bölünmedi (açık madde).
- Zamanın çoğu hareket yeri taramasında (`bestNow` her aday altıgende) ve motorun kendisinde; kuru çalıştırma (önizleme) karar başına ≈ 13–14 çalıştırma.

## Kuyruk Y1: ortak yapay zekâ değerlendiricisi — regresyon ve zorluk (2026-11-05)

Ayarlama yok (K59). Aynı kod (`wip/y1`), aynı tohumlar (50); "eski" = `YZ_ESKI=1` (Y1 öncesi kural zinciri), "yeni" = değerlendirici (Normal). Kural sürümü değişmedi (28; yapay zekâ kararı olay değil).

**SRD partisi** (`npm run sim -- 50 duz col orman magara kale dungeon --seviye 5`, standart parti):

| Senaryo | Eski kazanma | Yeni kazanma | Fark | Berabere (eski / yeni) | Ort. tur (eski / yeni) | Ort. düşmüş PC (eski / yeni) |
|---|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 94% | 98% | +4 | 0% / 0% | 6.5 / 5.5 | 0.44 / 0.16 |
| Çöl — Gündüz | 90% | 94% | +4 | 0% / 0% | 6.7 / 7.5 | 0.50 / 0.56 |
| Orman | 48% | 62% | **+14** | 0% / 0% | 5.8 / 6.1 | 2.62 / 2.12 |
| Mağara — karanlık | 74% | 56% | **−18** | 4% / 14% | 7.0 / 9.5 | 1.30 / 1.66 |
| Dungeon — Koridor (meşale) | 100% | 100% | 0 | 0% / 0% | 5.3 / 5.6 | 0.10 / 0.18 |
| Kale — Gündüz | 68% | 58% | **−10** | 0% / 0% | 6.9 / 6.5 | 1.78 / 2.24 |

**İmza alt sınıflar** (`npm run sim:imza -- 50 --alt <id> --seviye 7 --senaryo col,orman,magara,kale,duz,dungeon`; 6 senaryo ortalaması):

| Alt sınıf | Eski | Yeni | Fark | SRD karşılığı (eski / yeni) | Sapma (eski → yeni) |
|---|---:|---:|---:|---:|---:|
| Dunganga | 64% | 76% | **+12** | Ejderha Büyücülüğü 85% / 87% | −21 → −11 |
| Harita Öğretisi | 57% | 62% | +5 | Evokasyon Ustası 72% / 71% | −15 → −9 |

**Zorluk** (parti tarafı `YZ_ZORLUK`, düşman Normal; `npm run sim -- 50 col orman kale --seviye 5`):

| Senaryo | Kolay | Normal | Usta |
|---|---:|---:|---:|
| Çöl — Gündüz | 80% | 94% | 90% |
| Orman | 46% | 62% | 64% |
| Kale — Gündüz | 20% | 58% | 56% |
| Ortalama | 48.7% | 71.3% | 70.0% |

Notlar:
- **8 puandan büyük farklar** (rapor, ayar yok): Orman +14, Mağara −18, Kale −10 (SRD); Dunganga +12 (imza). Mağara'da beraberlik %4 → %14 ve ortalama tur 7.0 → 9.5: yeni yapay zekâ karanlıkta daha temkinli (tehlike/korunma puanı), 20 tur sınırına daha sık takılıyor. Kale'de düşmüş PC artıyor (1.78 → 2.24). İki tarafı da aynı yapay zekâ oynadığı için fark parti ya da düşman lehine tek yönlü değil; nedeni K59'da ayrıştırılmalı.
- İmza alt sınıfların SRD karşılığına sapması küçüldü (Dunganga −21 → −11, Harita −15 → −9): değerlendirici imza eylemlerini (kapılı ipuçları yerine) puanla seçiyor; K50/K54b sorununun hedeflenen sonucu.
- **Kolay ≤ Normal ≤ Usta:** Kolay < Normal her senaryoda (ortalama −22.6 puan). **Usta ≈ Normal** (−1.3 puan; satır farkları ±4, 50 tohumda standart hata ≈ ±7): Usta'nın bir adım ileri bakışı ölçülebilir kazanç getirmiyor; açık madde.
- Süre: yeni yapay zekâ senaryo başına ≈ 1,5–2,3× daha yavaş (ör. Kale 140 sn → 310 sn, 4 paralel süreç).

## Kuyruk K54c: K54 sonrası (tamamı) — 11 imza alt sınıf (2026-11-05)

Aynı ölçüm (K50): `npm run sim:imza -- 100 --alt <id> --seviye 7 --senaryo col,orman`, 100 tohum, kural sürümü 28, ev kuralı açık, **Y1 öncesi yapay zekâ** (ölçüm `wip/k54c` üzerinde). Ölçüt K50'deki gibi: SRD karşılığına göre −5'ten büyük düşüş "aralık dışı". Sayı ayarı yapılmadı (K59). Y1 değerlendiricisiyle Dunganga ve Harita'nın 6 senaryolu ölçümü "Kuyruk Y1" bölümünde (sapma −11 ve −9).

| İmza | SRD karşılığı | SRD | İmza | K50 sapması | Şimdiki sapma | Durum |
|---|---|---:|---:|---:|---:|---|
| Çiftçi (Ranger) | Avcı | %12 | %11 | -1 | -1 | aralıkta |
| Geride Kalanın Yolu (Barbarian) | Çılgın Savaşçı | %11 | %10 | -3 | -1 | aralıkta |
| Hızır Yemini (Paladin) | Bağlılık Yemini | %12 | %15 | +1 | +3 | aralıkta |
| İmparator (Fighter) | Şampiyon | %61 | %56 | -5 | -5 | aralıkta |
| Şair Koleji (Bard) | Bilgi Koleji | %27 | %21 | -4 | -6 | aralık dışı |
| İnfazcı (Rogue) | Hırsız | %65 | %61 | -6 | -4 | aralıkta |
| Yaşlı Bilge (Monk) | Açık El | %16 | %7 | -6 | -9 | aralık dışı |
| Astrolog (Warlock) | İblis Hamisi | %25 | %18 | -8 | -7 | aralık dışı |
| Birlik Manastırı (Cleric) | Yaşam | %23 | %16 | -7 | -7 | aralık dışı |
| Dunganga (Sorcerer) | Ejderha Büyücülüğü | %73 | %40 | -17 | -33 | aralık dışı |
| Harita Öğretisi (Wizard) | Evokasyon | %57 | %28 | -25 | -29 | aralık dışı |

- Aralık dışı 6 satır: 4'ü −6 ile −9 arası (Şair −6, Astrolog −7, Birlik −7, Yaşlı Bilge −9); İnfazcı −6 → −4 ile aralığa girdi. Büyük farklar yine Dunganga (−33) ve Harita (−29): bu ölçüm K54b'deki yapay zekâ kuralıyla (slot dururken kontrol ipuçları kısıtlı) yapıldı; Y1 değerlendiricisi farkı yarıya indiriyor (yukarı bölüm).
- Yaşlı Bilge K50'ye göre geriledi (−6 → −9): Zihin Gücü kipleri (K54) Y1 öncesi yapay zekâda tek kip (İt) olarak seçiliyordu; Y1'de kipler ayrı aday.
- Astrolog (−8 → −7), Şair (−4 → −6), Hızır (+1 → +3), Geride Kalan (−3 → −1): K54c eklemeleri 7. seviyede çoğunlukla yok (Yazgı Mührü 14, Ölümsüz Dize/Usta Şair 14, Küllerden Doğan 14, Ferman 10, Alışkın Acı 10); fark gürültü düzeyinde.

### K54c açık maddeler (K54 tablosundaki eksik, kısmi ya da YZ'nin kullanmadığı özellikler)

| Alt sınıf | Özellik | Durum | Not |
|---|---|---|---|
| Şair Koleji | Gece Şiiri | yok | Serüven dinlenmesi; Serüven kilitli |
| Şair Koleji | Usta Şair | kısmi | partiye uzun dinlenmede +1 Motivasyon yok (Serüven kilitli) |
| Şair Koleji | Ölümsüz Dize | kısmi | savaş dışı Moral ölümü yönü yok (Serüven kilitli) |
| Şair Koleji | Nakarat | kısmi | ikinci hedef otomatik (arayüzde seçim yok) |
| İmparator | Ferman | kısmi | dost otomatik seçilir; ek eylem Haste yolu (Dodge/Help yok) |
| İmparator | Buyruk: Yer değiştir | YZ kullanmıyor | |
| Astrolog | Gök Rehberi | yok | Serüven dinlenme Moral'i; Serüven kilitli |
| Astrolog | Yıldız Falı | kısmi | "beceri zarı" savaşta yok; yalnız ilk saldırı/kurtulma |
| Astrolog | Yazgı Mührü | kısmi | büyü saldırılarında yok |
| Geride Kalanın Yolu | Yaralı Kalp / Yıpranma | kısmi | savaşlar arası Yıpranma saklanmaz |
| Yaşlı Bilge | Zihin Gücü: Nesne, Fırlat | Y1'de YZ adayı | Y1 öncesi YZ kullanmıyordu |
| Hızır Yemini | Yetişen Yol: Adım | Y1'de YZ adayı | Y1 öncesi YZ kullanmıyordu |
| Dunganga | Ninni/Sepet | YZ zayıf | kontrolün değeri; sepetteki düşmana dostlar vurmaya devam ediyor (K59) |
| Harita Öğretisi, Dunganga | 10/14/18. seviye özellikleri | ölçülmedi | 7. seviye ölçümünde yok; 11/15. seviye ölçümü önerisi (K59) |
| Birlik Manastırı | Omuz Ver | seyrek | yalnız başarıya çevirecekse; Ortak Şifa 8'de |

## Kuyruk K55: altıgen etki çözücüsü — hızlı regresyon (2026-11-05)

Ayarlama yok (K59). `npm run sim -- 30 col kale magara orman --seviye 5 --parti buyucu`; sürüm 26 (çözücü) ile `KURAL_SURUMU=25` (eski geçişler) aynı tohumlar.

| Senaryo | Sürüm 25 kazanma | Sürüm 26 kazanma | Ort. tur (25 / 26) | Ort. düşmüş PC (25 / 26) |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 100% | 100% | 3.4 / 3.4 | 0.00 / 0.00 |
| Kale — Gündüz | 100% | 100% | 3.5 / 3.5 | 0.03 / 0.03 |
| Mağara — karanlık | 77% (17% berabere) | 77% (17% berabere) | 4.0 / 4.0 | 0.67 / 0.67 |
| Orman | 100% | 100% | 3.7 / 3.7 | 0.17 / 0.17 |

Fark yok: bu senaryolarda yüzey tepkimesi seyrek. Duman testi (12 sınıf × 3/7/11, yüzeyli Ortamlar Diyarı, `src/sim/k55smoke.test.ts`) çökmesiz.
Aralık dışı satır: Mağara 77% (beraberlik %17; K55 öncesiyle aynı, çözücüden bağımsız).

## Kuyruk K53: ortak savaş sistemleri (2026-11-05)

Denge ölçümü yapılmadı (denge turuna). Duman: 12 sınıf × 3/7/11. seviye, kural sürümü 24, Kale haritası, 6 tur: çökme yok (`src/sim/k53smoke.test.ts`).

Yapay zekâ: Misty Step ile kaçış (`teleportEscape`) ve lav/çukur/20+ ft düşüşe itme (`deadlyShove`) yeni girişlerden geçer (varış kancaları, `forcedMove`). Yapılmayanlar: (1) çarpma hasarı için itme: Shove engelde 1d6 verir ama YZ yalnız ölümcül itmeyi seçer, çünkü 1d6 bir silah saldırısının beklenen hasarının altında; (2) nesne fırlatma ve enkaz çağırma: bunları kullanan özellik (K50 C Monk Zihin Gücü, Wizard) henüz yok; (3) Cloud's Jaunt / Blink Steps ile kaçış (YZ yalnız teleport büyüsünü kullanıyor). Hepsi denge turunda ölçülüp eklenecek.

## Kuyruk K52: hizalanma ↔ Moral bağı duman testi (2026-11-05)

Standart parti, 3. seviye, 30 tohum, ev kuralı `moralSistemi` açık (Moral tam modu). "Kapalı": `hizalanma`/`hizalanmaMoral` kapalı; "Açık": ikisi de açık. Bağ savaş motoruna girmediği için sonuçlar birebir aynı olmalı; aynı (test `src/sim/k52moral.test.ts`).

| Senaryo | Kapalı (galibiyet / tur / ölü) | Açık (galibiyet / tur / ölü) |
|---|---|---|
| col | %77 / 8.9 / 0.27 | %77 / 8.9 / 0.27 |
| orman | %90 / 5.7 / 0.03 | %90 / 5.7 / 0.03 |
| magara | %83 / 7.3 / 0.37 | %83 / 7.3 / 0.37 |
| kale | %80 / 7.5 / 0.37 | %80 / 7.5 / 0.37 |

## Kuyruk K54b sonrası: Harita, Dunganga, Birlik, İnfazcı (2026-11-05)

Aynı ölçüm (K50): `npm run sim:imza -- 100 --alt <id> --seviye 7 --senaryo col,orman`, kural sürümü 27, ev kuralı açık. SRD satırları yeniden ölçüldü, değişmedi. Sayı ayarı yapılmadı (K59). 7. seviyede K54b eklemelerinin bir kısmı yok: Çizili Duvar (10), Kuşbakışı Plan (14), Kâbus (14), Dunganga Çağrısı (18), Ortak Şifa (8), Yıkılmaz Birlik (17), Müdahale (9), Peşini Bırakmayan (13).

| İmza | SRD | K50 (2. ölçüm) | K54b, YZ ipucu kısıtsız | K54b son | Sapma K50 → son | Durum |
|---|---|---|---|---|---|---|
| Harita Öğretisi (Wizard) | %57 | %32 | %9 | %28 | −25 → −29 | aralık dışı |
| Dunganga (Sorcerer) | %73 | %56 | %27 | %40 | −17 → −33 | aralık dışı |
| Birlik Manastırı (Cleric) | %23 | %16 | %16 | %16 | −7 → −7 | aralık dışı |
| İnfazcı (Rogue) | %65 | %59 | — | %61 | −6 → −4 | aralıkta |

- "YZ ipucu kısıtsız": ilk K54b yapay zekâsı Ninni/Sepet/Zor zemin/Çizili Duvar'ı büyü slotu dururken de kullanıyordu; güçlü alan büyüsünün yerine geçtiği için oran çöktü. Son ölçüm: 3.+ seviye slot dururken eylem harcayan kontrol/zemin ipuçları yalnız 30 ft (Zor zemin 20 ft) içinde ≥ 3 düşman varken; tek hedefli Sepet ve Çizili Duvar slotlar bitince. Bu bir yapay zekâ kuralıdır, sayı ayarı değildir.
- **Dunganga** hâlâ K50'nin 2. ölçümünün altında (−16). Olası neden: Ninni/Sepet, Ejderha Büyücülüğü'nün hasar büyülerine göre YZ değerlendirmesinde zayıf (kontrolün değeri hasar gibi ölçülmüyor; Sepet hasarla bozulur ve dostlar sepetteki düşmana vurmaya devam ediyor). YZ'nin sepetteki düşmanı atlaması ve kontrolün değerini ölçmesi K59'a. 7. seviyede Kâbus ve Çağrı yok.
- **Harita** K50'ye yakın (−4). Kalan fark: Evokasyon'un hazır hasar büyüleri; Harita'nın gücü 10/14. seviyede (Duvar, Kuşbakışı), bu ölçümde yok.
- **Birlik** değişmedi: Omuz Ver yalnız başarıya çevirecekse çalışıyor (seyrek); Ortak Şifa 8'de. 
- Önerilen ek ölçüm (K59): aynı dört alt sınıf 11 ve 15. seviyede.

## Kuyruk K50: imza alt sınıflar (2026-11-05)

`npm run sim:imza -- 100 --alt <id> --seviye 7 --senaryo col,orman`: k18-<sınıf> partisinde imza alt sınıf ↔ sınıfın SRD alt sınıfı, kural sürümü 23, ev kuralı açık. Ölçüt: SRD karşılığına göre −5 puandan fazla düşüş "aralık dışı". 2. ölçüm: yapay zekâ, büyü slotu dururken eylem harcayan imza özelliğini büyünün yerine kullanmıyor (`imzaAi`).

| İmza | SRD karşılığı | SRD | İmza (1. ölçüm) | İmza (2. ölçüm) | Durum |
|---|---|---|---|---|---|
| Çiftçi (Ranger) | Avcı | %12 | %11 | — | aralıkta |
| Geride Kalanın Yolu (Barbarian) | Çılgın Savaşçı | %11 | %8 | — | aralıkta |
| Hızır Yemini (Paladin) | Bağlılık Yemini | %12 | %13 | — | aralıkta |
| İmparator (Fighter) | Şampiyon | %61 | %56 | — | aralıkta |
| Şair Koleji (Bard) | Bilgi Koleji | %27 | %23 | — | aralıkta |
| İnfazcı (Rogue) | Hırsız | %65 | %59 | — | aralık dışı (−6) |
| Yaşlı Bilge (Monk) | Açık El | %16 | %10 | — | aralık dışı (−6) |
| Astrolog (Warlock) | İblis Hamisi | %22 | %14 | %14 | aralık dışı (−8) |
| Birlik Manastırı (Cleric) | Yaşam | %23 | %16 | %16 | aralık dışı (−7) |
| Dunganga (Sorcerer) | Ejderha Büyücülüğü | %73 | %33 | %56 | aralık dışı (−17) |
| Harita Öğretisi (Wizard) | Evokasyon | %57 | %12 | %32 | aralık dışı (−25) |

Not: sınıf partilerinin mutlak oranı düşük (k18 partileri 7. seviyede bu senaryolarda zorlanıyor); karşılaştırma yalnızca alt sınıf farkıdır. Kalan farkın çoğu planlı (henüz çalışmayan) özelliklerden ve SRD karşılıklarının hazır hasar büyülerinden (Evokasyon Empowered Evocation, Draconic Elemental Affinity); denge değişikliği belge sahibinin kararına bırakıldı.

## Denge turu (2026-11-03)

Standart parti (Bor Dwarf Fighter, Mira Elf Wizard, Tavi Human Cleric, Sela Halfling Rogue, Kael Elf Ranger), 30 tohum, kural sürümü 17 (Darkvision menzili yaratığın kendisinden). Hedef %60–80. Komutlar: `npm run sim:bolge`, `npm run sim:liste`, `npm run sim:zincir -- … --kisa-sinir N`.

### 1. Bölge × parti seviyesi (bölge karşılaşma üreteci, SRD "orta" bütçe, çarpan 1)

Her tohumda karşılaşma `data/bolge-karsilasma.json` kurallarıyla ayrı üretilir (bölge haritası = Serüven sayfasının ilk düğümü). Bu ölçüm efsanevi sınırı (`efsaneviEnCok`) eklenmeden önce alındı. **Kalın** = hedefte.

| Bölge | 1 | 5 | 9 | 13 | 17 | 20 |
|---|---:|---:|---:|---:|---:|---:|
| Buzul (Açık Buzul) | 97% | **73%** | 93% | 40% | 13% | 0% |
| Dağ (Geçit Karakolu) | 93% | 87% | 100% | 50% | 13% | 0% |
| Orman (Patika) | 100% | 83% | 87% | 50% | 23% | 0% |
| Çöl (Vaha) | **67%** | 100% | 93% | 47% | 83% | 20% |
| Bataklık (Kütük Adaları) | 100% | **80%** | 97% | **77%** | 43% | 0% |
| Batı Kıyısı (Kale Önü) | 97% | 100% | **70%** | 90% | 40% | 3% |
| Volkan (Portal Salonu) | **77%** | 93% | 93% | **63%** | 13% | 7% |

- Hedef dışı: 42 hücreden 36'sı. Eğilim: "orta" bütçe 1–9. seviyede kolay (ölüm oranı düşük), 13'te sınırda, 17–20'de çok zor.
- 17–20'de üreteç aynı karşılaşmaya 2–5 efsanevi canavar koyuyordu (ör. 3 Adult Gold Dragon + Ice Devil; 5 Adult Black Dragon). Her biri efsanevi eylem ve Legendary Resistance getiriyor. Düzeltme: `efsaneviEnCok: 1` (ölçüm aşağıda).
- Çöl 1 (%67) ölüm oranı %50: Venomous Snake zehri 1. seviyede ağır.
- Seviye çarpanı önerisi ve doğrulaması aşağıda (karar DECISIONS.md'de, onay bekliyor).

#### Doğrulama: tek efsanevi (`efsaneviEnCok: 1`) ve seviye çarpanı (Buzul, Orman, Volkan)

| Seviye | Çarpan | Buzul | Orman | Volkan |
|---:|---|---:|---:|---:|
| 1 | ×1 → ×1,5 | 97% → 90% | 100% → 100% | 77% → 50% |
| 5 | ×1 → ×1,3 | 73% → 90% | 83% → 80% | 93% → 50% |
| 9 | ×1 → ×1,3 | 93% → **70%** | 87% → **70%** | 93% → **73%** |
| 13 | ×1 (tek efsanevi) → ×0,8 | 40% → **77%** | 50% → **77%** | 63% → **73%** |
| 17 | ×1 (tek efsanevi) → ×0,7 | 13% → 43% (berabere %37) | 27% → **70%** | 20% → 47% (berabere %37) |
| 20 | ×1 (tek efsanevi) → ×0,6 | 0% → 40% | 47% → 47% | 7% → 57% |

- Tek efsanevi kuralı tek başına yalnızca Orman 20'yi düzeltti (%0 → %47; bütçe havuz yetmediği için %49 doluyor). Buzul/Volkan 17–20 yerine Planetar, Storm Giant, Marilith gibi efsanevi olmayan güçlü canavarlar geldi.
- Bütçe zorlukla doğrusal değil: 1–5. seviyede bütçe artınca liste "2 büyük" yerine "4 orta" canavara dönüyor; Buzul kolaylaşırken Volkan (Quasit, Hell Hound, zehir/ateş) zorlaşıyor.
- 9 ×1,3 ve 13 ×0,8 üç bölgede de hedefte. 17–20'de ×0,6–0,7 yetmiyor ve 30 tur sınırında beraberlik %37'ye çıkıyor (Ice Devil yenilenmesi).

### 2. Seviye dengesi (K19 karar 1): 11/15/20 listeleri

| Senaryo | Önce (K19, 100 tohum) | Ayar | Sonra (30 tohum) |
|---|---:|---|---:|
| Mağara 11 | 99% (sürüm 17'de 97%) | Behir + Aboleth + **Troll + Ettin** (2 Troll %57) | **63%** |
| Mağara 15 | 100% | Purple Worm + **2 Behir** + Aboleth + **Stone Golem** (1 Behir + golem %100) | **73%** |
| Kale 15 | 29% | Storm Giant + **1** Cloud Giant + **Stone Giant** + 4 Knight (yalnız 1 Cloud Giant %97) | **63%** |
| Orman 15 | 21% | Adult Green Dragon + **1** Treant | **63%** |
| Orman 20 | 38% | Ancient Green Dragon + **1 Troll** (Treant'sız %83, 2 Troll %47) | **70%** |

Hedef dışı kalan eski satırlar (bu görevde ayarlanmadı): Çöl 11 %92, Çöl 20 %95, Kale 11 %85, Mağara 20 %47, Orman 11 %92.

### 3. K18-3 senaryoları (5. seviye)

| Senaryo | Önce (sürüm 17) | Sonra | Liste |
|---|---:|---:|---|
| Buzul — Karlı Kamp | 97% | **70%** | 2 Bandit Captain, 3 Scout, 3 Bandit, **2 Winter Wolf, Ettin** |
| Dağ — Geçit Karakolu | 100% | **60%** | 2 Bandit Captain, 3 Scout, 4 Bandit, **Hill Giant, Manticore** |
| Dağ — Yüksek Kayalıklar | 100% | **73%** | **3** Griffon, 4 Harpy, **Wyvern** |
| Dağ — Sessiz Nöbetçi | 100% | 97% | 3 Ghoul, **2** Ghast, **2** Wight, **2 Gargoyle**, **Wraith** |

- Başlangıç bölgeleri 12 altıgen: ilk denemedeki 12+ düşmanlı listeler yerleşemedi (hata), listeler ≤ 11 düşman.
- Nöbetçi üç turda (+Wraith %100, +Ghast/Wight %97, iskelet → Gargoyle %97) hedefe inmedi; XP ≈ 5600 (SRD "yüksek" bütçe). Neden liste değil: düşmanların çoğu ölümsüz (Cleric'in Turn Undead'i) ve harita (heykel bakışı, yükseklik) partiyi kayırıyor. Öneri DECISIONS.md'de.

### 4. Darkvision menzili ve gece görüşü (`nightVision`, varsayılan kapalı)

Kural sürümü 17: karanlık görüş menzili yaratığın kendi değeri (`darkvisionRange`; eskiden herkes 60 ft = 12 altıgen). Canavar verisinde 130 × 60 ft, 58 × 120 ft, 3 × 90 ft, 2 × 150 ft, 8 × 30 ft. Blindsight/Truesight SRD anahtarı (`srdK19`) kapalıyken de okunuyor (K19 0f'den beri; test eklendi).

Irk etkisi: partinin karanlık görüşü sabitlenerek (`--parti-dv`), gece kuralı açık, 5. seviye.

| Senaryo | Kural kapalı | Açık (ırktan) | Açık, parti 0 ft | 60 ft | 120 ft |
|---|---:|---:|---:|---:|---:|
| Orman — Gece | 43% | 53% | 53% (berabere %10) | 43% | 43% |
| Kale — Gece | 73% | 90% | 90% | 90% | 97% |

- Kuralı açmak ırktan bağımsız olarak partiyi güçlendiriyor (Kale +17 puan). Nedeni düşman tarafında: Darkvision'sız Berserker/Warrior Veteran karanlıktaki partiyi göremiyor, yapay zekâ görmediğine saldırmıyor.
- Partinin karanlık görüşü sonucu ancak ±7–10 puan oynatıyor (30 tohumda gürültü ±9). Darkvision'lı ırkın gece üstünlüğü bu ölçümde belirgin değil; yapay zekâ ışık büyüsü ve gizlenme kullanmadığından fark küçük kalıyor.
- Gece kuralı KAPALI kalır (karar 7).

### 5. Dinlenme sıklığı ve Serüven zorluğu (zincir, 30 tohum)

Kısa dinlenme sınırı (iki uzun dinlenme arası; ev kuralı, Normal 2) ve dinlenme yerinde uzun dinlenme.

| Sefer | Sınır 0 | Sınır 1 | Sınır 2 (şimdiki) | Sınırsız | Uzun dinlenme kapalı |
|---|---:|---:|---:|---:|---:|
| Volkan, 3. seviye (5 savaş) | 0% (1,30 savaş) | 13% (2,10) | 20% (2,43) | 20% (2,43) | 20% |
| Derinlikler, 5. seviye (6 savaş) | 20% (4,53) | — | 57% (5,37) | **97%** (5,80) | 57% |

- İki seferde de uzun dinlenme sayısı 0: seferlerin dinlenme durakları (`kind: rest`, Kül Kampı) tasarım gereği uzun dinlenme açmıyor (V6: yalnızca sınıra sayılmayan kısa dinlenme). Uzun dinlenmeyi kapatmak bu yüzden fark etmiyor.
- Kısa dinlenme en güçlü kaldıraç: Derinlikler'de sınır 2 → sınırsız +40 puan. Volkan seferinin darboğazı 2. savaş (Lav Tapınağı: durak başına 0,77 ölüm), dinlenme değil.
- Eylem saati (K47) yok; ölçüm durak sayısıyla. Öneri DECISIONS.md'de.

#### Onaylanan ayarlar sonrası (2026-11-03, 30 tohum)

Volkan "Dinlenme" akşama varılır (13 saat yürüyüş) ve Derinlikler uzun yoluna "Gece Kampı" eklendi (ikisinde de uzun dinlenme açılır); Lav Tapınağı 3. seviye listesi 3 Scout + 2 Cultist + Mephit + Cultist Fanatic → 2 Scout + 3 Cultist + Mephit.

| Sefer | Önce | Sonra | Uzun dinlenme |
|---|---:|---:|---:|
| Volkan, 3. seviye | 20% | **80%** | 0 → 0,8 |
| Volkan, 5. seviye | — | 53% | 0,9 |
| Derinlikler 5 (Mantar dalı) | 57% | **97%** | 0 → 1,0 |
| Derinlikler 5 (Lav dalı, kısa yol) | — | 53% | 0 (durak yok) |

- Lav dalında uzun dinlenme durağı yok; darboğaz son savaş Lav Salonu (durak başına 0,70 ölüm, 3,00 düşmüş). Volkan 5'te Lav Tapınağı (0,40) ve Ejder Yuvası (0,43).

### 6. Büyücüsüz partiler (K18 karar 8)

Neden: Mağara ve Orman 9. seviye listelerindeki 2 Troll'ün Regeneration'ı yalnızca ateş/asit hasarıyla durur (SRD). Wizard'ı olmayan partide ateş/asit kaynağı yok, Troll ölmüyor.

| Liste (9. seviye) | k18-barbarian | Wizard'lı parti |
|---|---:|---:|
| Mağara (2 Troll) | 0% | 51% (a2-klasik, K18) |
| Mağara, Troll → Ettin | 97% | 100% (standart) |
| Orman (2 Troll) | 0% | 49% (a2-klasik, K18) |
| Orman, Troll → Ettin | 77% | 100% (standart) |

- Troll'ü listeden çıkarmak Wizard'lı partiyi %100'e taşıyor; listeler değişmedi. Bunun yerine Game Master kurulumunda uyarı: yenilenen düşman varken partide ateş/asit kaynağı (büyü, silah, nefes, Alchemist's Fire, Acid) yoksa "Bu karşılaşma ateş ya da asit hasarı ister" (`src/battle/encounterWarn.ts`).

## Gece görüşü kararı (2026-11-03, ölçüm yok)

Gece görüşü kuralı kapalı kalır; Giant Spider değişmez. Darkvision menzili (hep 60 ft) ve 1–2 numaralı denge maddeleri denge turuna ertelendi (DECISIONS.md).

## Kuyruk 19 (8–10) — 11/15/20. seviye, K18-3 düşmanları, gece görüşü (2026-11-03)

Kural: yalnızca kayıt, ayar yok. Standart parti (Bor Dwarf Fighter, Mira Elf Wizard, Tavi Human Cleric, Sela Halfling Rogue, Kael Elf Ranger).

**Ölçüm öncesi bulunan üç motor hatası (srdK19; DECISIONS.md):**
- Web Walker ve Ice Walk Freedom of Movement gibi çalışıyordu.
- Burrow'lu canavar bir turda sınırsız Multiattack yapıyordu.
- Treant Animate Trees zincirleme kopya üretiyordu.

Orman Gece 10 tohumda: K18 %80 → srdK19 hatalı %10 → düzeltmeden sonra %70. Aşağıdaki bütün sayılar düzeltmeden sonra.

### Görev 9 — K18-3 düşman eklemeleri (5. seviye, 30 tohum)

| Senaryo | Değişiklik | Kazanma |
|---|---|---:|
| Nöbetçi (Dağ) | + Ghast 1, + Wight 1 | 100% |
| Buzul Kamp | Bandit 3 → 5 | 97% |
| Dağ Karakol | Bandit 3 → 5 | 100% |
| Dağ Kayalık | Harpy 2 → 4 | 100% |

Dört senaryo da hâlâ hedefin (%60–80) üstünde. Ayar yapılmadı.

### Görev 10 — Gece görüşü kuralları (`nightVision`), 5. seviye, 30 tohum

| Senaryo | Kapalı | Açık | Ort. tur (kapalı → açık) | Ort. düşmüş PC (kapalı → açık) |
|---|---:|---:|---|---|
| Orman — Gece | 43% | 53% | 6.0 → 5.8 | 2.83 → 2.37 |
| Kale — Gece | 73% | 90% (berabere %10) | 7.1 → 8.5 | 1.43 → 0.60 |
| Büyük suç — soylu cinayeti (gece) | 100% | 100% | 2.7 → 3.2 | 0.00 → 0.07 |

- Kuralın açılması partiyi güçlendiriyor.
  - Partinin 3/5'inde Darkvision var. Görülmeyen saldırgan avantaj alıyor; ışıksız altıgende Darkvision'sız düşmanlar partiyi 2 altıgenden uzakta göremiyor ve saldıramıyor. Etki en çok Kale Gece'de (insan muhafızlar) görülüyor.
  - Yapay zekâ görmediği hedefe saldırmıyor.
- Irk etkisi: Darkvision'sız üyeler (Human Cleric, Halfling Rogue) karanlıkta 2 altıgen ötesini göremiyor. Işık kaynağı (Light, meşale) yoksa menzilli saldırıları dezavantajlı ya da hedefsiz kalıyor. Darkvision'lı ırklar (Dwarf, Elf, Orc, Tiefling, Gnome, Dragonborn, Celestial) belirgin üstünlük kazanıyor.
- Fırtına kuralları (`stormRules`) için gece haritası yok. Etki birim testinde doğrulandı (`k19vision.test.ts`).
- Orman Gece'nin kapalıyken %43'ü, K18'in 30 tohumluk %59–61'inin altında. Kalan fark srdK19 canavar özelliklerinden geliyor (Owlbear/Giant Spider tırmanma, Werewolf bağışıklıkları). Ayrı denge görevine kaldı.

### Görev 8 — 11/15/20. seviye karşılaşmaları (100 tohum)

Standart parti 11/15/20. seviyede (sim partisi üreteci, `levels.<N>` seçimleri yoksa SRD varsayılanları), 100 tohum, Normal. Hedef %60–80; ayar yapılmadı.

| Senaryo | Düşmanlar | 11 | 15 | 20 |
|---|---|---:|---:|---:|
| Çöl — Gündüz | 11: Adult Blue Dragon + 2 Mummy · 15: Adult Blue + 2 Young Blue · 20: Ancient Blue + 3 Mummy | 92% | **70%** ✓ | 95% |
| Kale — Gündüz | 11: Cloud Giant + 2 Stone Giant + 4 Knight · 15: Storm Giant + 2 Cloud Giant + 4 Knight · 20: Pit Fiend + Balor | 85% | 29% | **73%** ✓ |
| Mağara — karanlık | 11: Behir + Aboleth · 15: Purple Worm + Behir + Aboleth · 20: Lich + Mummy Lord | 99% | 100% | 47% |
| Orman | 11: Treant + Young Green Dragon + 3 Green Hag · 15: Adult Green Dragon + 2 Treant · 20: Ancient Green Dragon + Treant | 92% | 21% | 38% |

Aralıkta 2/12. Ortalama tur 4–9; ölen PC 0,02–1,22. Mağara 11/15 tek boss'a karşı çok kolay; Kale 15 ve Orman 15/20 zor (devlerin taş atışı ve iki Treant). Ayar ayrı denge görevine kaldı.

### Hızlı regresyon — SRD canavar tepkileri sonrası (5. seviye, 30 tohum)

| Senaryo | Kazanma | Berabere | Ort. tur | Ort. düşmüş PC |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 90% | 0% | 6.6 | 0.53 |
| Kale — Gündüz | 73% | 0% | 7.0 | 1.57 |
| Mağara — karanlık | 67% | 7% | 7.8 | 1.53 |
| Orman — Gece | 43% | 0% | 6.0 | 2.83 |

Orman — Gece yukarıdaki görev 10 ölçümüyle aynı (%43). Yeni tepkiler bu listelerdeki canavarlarda yok; sapma beklenmiyordu.

## Kuyruk 17 G1/G2 — hızlı regresyon (2026-11-02)

`npm run sim:a2 -- 30 --parti a2-klasik --seviye 9 --zorluk normal` (kural sürümü 13; yeni büyüler partide yok, yeni sınıf özellikleri Monk/Paladin 10'da). Önceki satır Kuyruk 43b (200 tohum). 30 tohumda ±9 puan gürültü; belirgin kırılma yok, ayar yapılmadı.

| Parti | Seviye | Zorluk | col | kale | magara | orman | Ortalama |
|---|---|---|---|---|---|---|---|
| a2-klasik | 9 | Normal (K17) | 80% | 87% | 53% (z2) | 37% | **64%** |
| a2-klasik | 9 | Normal (K43b, 200 tohum) | — | — | 52% (z5) | 46% (z2) | — |

## Kuyruk 18 — H9 sınıf dengesi, 9. seviye (2026-11-02)

`npx vite-node src/sim/a2Run.ts -- 100 --parti <parti> --seviye 9 --zorluk normal` (senaryolar Çöl, Kale, Mağara, Orman; 100 tohum; kural sürümü 15). Sınıf partisi `k18-<sınıf>` = sınıf üyesi + Fighter (Bor), Cleric (Tavi), Rogue (Sela), Wizard (Mira) çekirdeğinden aynı sınıf olmayan ilk üçü (Fighter partisi a2-klasik ile aynı); `k18-cleric` = Cleric, Paladin, Bard, Druid; `buyucu` = 6 kişi. Yalnızca kayıt (ayar yapılmadı). Hedef Normal %45–65.

| Parti | Seviye | Zorluk | Çöl | Kale | Mağara | Orman | Ortalama |
|---|---|---|---|---|---|---|---|
| k18-fighter | 9 | Normal | 78% | 84% (z1) | 51% (z4) | 49% | **66%** |
| k18-wizard | 9 | Normal | 80% | 85% (z1) | 54% (z1) | 49% (z2) | **67%** |
| k18-rogue | 9 | Normal | 84% | 79% (z2) | 46% (z1) | 48% (z4) | **64%** |
| k18-ranger | 9 | Normal | 44% | 77% (z4) | 0% (z3) | 0% (z1) | **30%** |
| k18-barbarian | 9 | Normal | 45% | 63% (z5) | 0% (z1) | 0% | **27%** |
| k18-paladin | 9 | Normal | 54% | 87% (z2) | 1% (z9) | 0% | **36%** |
| k18-monk | 9 | Normal | 81% | 74% (z3) | 0% | 0% | **39%** |
| k18-sorcerer | 9 | Normal | 85% | 99% | 79% (z5) | 71% (z1) | **84%** |
| k18-warlock | 9 | Normal | 63% | 71% (z3) | 3% (z10) | 1% (z1) | **35%** |
| k18-bard | 9 | Normal | 84% | 90% | 0% (z25) | 0% (z2) | **44%** |
| k18-druid | 9 | Normal | 88% | 89% (z2) | 34% (z30) | 26% (z15) | **59%** |
| k18-cleric | 9 | Normal | 83% | 100% | 48% (z28) | 60% (z14) | **73%** |
| buyucu | 9 | Normal | 100% | 100% | 80% (z19) | 80% (z20) | **90%** |
| a2-klasik | 9 | Normal | 78% | 84% (z1) | 51% (z4) | 49% | **66%** |

**Okuma:** Wizard'ı (Mira) çıkaran partiler (Ranger, Barbarian, Paladin, Monk, Warlock, Bard) Mağara ve Orman 9. seviye listelerinde %0–3: bu listeler (Troll, uçan/yenilenen düşmanlar) partide alan büyücüsü olmasını varsayıyor. Sorcerer partisi %84 ve 6 kişilik parti %90 hedefin üstünde; Cleric ağırlıklı parti %73 (çok berabere: iyileştirme savaşı uzatıyor). Öneri: Mağara/Orman 9 listelerini sınıftan bağımsız yapmak için yenilenme/uçuş düşmanlarını azaltmak (ayrı görev).

## Kuyruk 18 — H7 K26 dengesi, H5 yapay zekâ hedefleri (2026-11-02)

**H7** (`npm run sim:k26 -- 30`, 3. seviye standart parti, gündüz, kural sürümü 15): 3. seviye listeleri 5. seviye listelerine kaydırıldı (1. ölçüm), aralık dışındakiler bir adım ayarlandı (2. ölçüm). Hedef Normal %60–80.

| Senaryo | 1. ölçüm (5. sv listesi) | Son liste (3. sv) | Normal | Kolay | Not |
|---|---:|---|---:|---:|---|
| k29-buzul-acik | 50% | winter-wolf ×2, polar-bear ×1, wolf ×1 | 77% | 97% | aralıkta |
| k29-buzul-kamp | 30% | bandit-captain ×1, scout ×3, bandit ×3 | 83% | 93% | **aralık dışı** (+3) |
| k29-buzul-kayalik | 63% | winter-wolf ×2, ice-mephit ×3 | 63% | 63% | aralıkta (Kolay da 63) |
| k29-buzul-tapinak | 70% | ice-mephit ×3, ghoul ×2, winter-wolf ×1 | 70% | 87% | aralıkta |
| k29-dag-karakol | 87% | bandit-captain ×2, scout ×3, bandit ×4 | 83% | 87% | **aralık dışı** (+3) |
| k29-dag-kayalik | 93% | griffon ×2, harpy ×3 | 83% | 93% | **aralık dışı** (+3) |
| k29-dag-kopru | 97% | ogre ×2, hobgoblin-warrior ×4 | 67% | 97% | aralıkta (4 berabere) |
| k29-dag-nobetci | 100% | ghoul ×4, skeleton ×4 | 100% | 100% | **aralık dışı**: Undead ağırlığı yetmiyor; öneri bir Ghast ya da Wight |

**H5** (`npm run sim -- 30 kale-baskini orman-ork --seviye 3`): Kale Baskını %53 (7,6 tur). Ork Kampı: çadır hedeflemesi kapalı (`KURAL_KAPALI=aiTentTarget`) %93 (8,8 tur); koşulsuz hedefleme %43 (16,3 tur, %27 berabere; geri alındı); son kural (bitişikteki çadırı tutuştur, 4 altıgende düşman yokken saldır) **%80** (12,0 tur).

## Görev K26 — Buzul ve Dağ, ilk ölçüm (2026-11-02)

`npm run sim:k26 -- 30`: 3. seviye standart parti, gündüz varyantı, 30 tohum, kural sürümü 12 (K26 mekanikleri açık, dondurucu soğuk varsayılan kapalı). Normal = senaryo listesi; Kolay = en kalabalık düşmandan bir eksik. **Hepsi aralık dışı (fazla kolay; hedef Normal %60–80)**; görev gereği ayarlanmadı. Yapay zekâ kol, balista ve kaya yığını kullanmaz; çığ Kayalık'ta 4. turda geliyor ama savaşlar çoğunlukla 3–6 turda bitiyor.

| Senaryo | Seviye | Normal düşmanlar | Normal | Kolay düşmanlar | Kolay | Ort. tur (N) |
|---|---|---|---|---|---|---|
| k29-buzul-acik | 3 | winter-wolf ×1, wolf ×3 | 97% | winter-wolf ×1, wolf ×2 | 100% | 4.8 |
| k29-buzul-kamp | 3 | bandit-captain ×1, bandit ×4 | 100% | bandit-captain ×1, bandit ×3 | 97% | 7.6 |
| k29-buzul-kayalik | 3 | winter-wolf ×1, ice-mephit ×2 | 100% | winter-wolf ×1, ice-mephit ×1 | 100% | 3.8 |
| k29-buzul-tapinak | 3 | ice-mephit ×3, ghoul ×1 | 100% | ice-mephit ×2, ghoul ×1 | 100% | 2.7 |
| k29-dag-karakol | 3 | bandit-captain ×1, bandit ×2, scout ×2 | 100% | bandit-captain ×1, bandit ×1, scout ×2 | 100% | 5.6 |
| k29-dag-kayalik | 3 | harpy ×2, goblin-warrior ×2 | 100% | harpy ×1, goblin-warrior ×2 | 100% | 4.0 |
| k29-dag-kopru | 3 | hobgoblin-warrior ×3, goblin-warrior ×2 | 100% | hobgoblin-warrior ×2, goblin-warrior ×2 | 100% | 6.2 |
| k29-dag-nobetci | 3 | skeleton ×4, ghoul ×1 | 100% | skeleton ×3, ghoul ×1 | 100% | 5.1 |

## Kuyruk 43b — Hapishane zinciri, Mağara/Orman 7–9, Volkan (2026-11-01)

**Hapishane zinciri** (`npm run sim:hapishane -- 200 [--kolay]`, 3. seviye). Dış Halka 4 → 3 Guard; İskele 2 Guard → 1 Guard + 1 Bandit. Müdür Kulesi zincir listesi değişmedi.

| Zorluk | Önce (K43 sonu) | Yalnızca Dış Halka 3 Guard | Sonra (+ İskele Bandit) |
|---|---|---|---|
| Normal | 47% | 53% | **57%** (hedef 55–65) |
| Kolay | 72% | 85% | **86%** |

Sonra (Normal) aşamalar: Hücre 100%, Dış Halka 82%, Müdür (isteğe bağlı) 65%, İskele 70%. Denenen ve geri alınan: Dış Halka'da 1 Guard yerine Bandit, %52.

**Mağara / Orman 7–9** (`npm run sim:a2 -- 200 --senaryo magara,orman`; parantezde 30 tur beraberliği). Önce: Kuyruk 41b (100 tohum). Değişen yalnızca 9. seviye Kolay listeleri (Mağara ve Orman'da Troll 2 → 1). Normal hedef 45–65, Kolay 70–85 (görevde Mağara 9 Kolay için 60–75).

| Parti | Seviye | Zorluk | Mağara önce | Mağara sonra | Orman önce | Orman sonra |
|---|---|---|---|---|---|---|
| a2-klasik | 7 | Normal | 93% | 94% (z4) | 75% | 78% (z5) |
| a2-klasik | 7 | Kolay | 94% | 93% (z5) | 80% | 81% (z2) |
| a2-klasik | 9 | Normal | 51% | 52% (z5) | 49% | 46% (z2) |
| a2-klasik | 9 | Kolay | **34%** | **72%** (z48) | 54% | **78%** (z37) |
| a2-karma | 7 | Normal | 61% | 62% (z4) | 36% | 46% (z4) |
| a2-karma | 7 | Kolay | 72% | 73% (z3) | 59% | 59% (z4) |
| a2-karma | 9 | Normal | 44% | 48% (z34) | 37% | 44% (z11) |
| a2-karma | 9 | Kolay | 61% | **76%** (z46) | 47% | **81%** (z36) |
| a2-ates | 7 | Normal | 90% | 95% (z3) | 82% | 81% (z1) |
| a2-ates | 7 | Kolay | 96% | 98% (z1) | 93% | 95% (z1) |
| a2-ates | 9 | Normal | 66% | 75% (z6) | 60% | 68% (z3) |
| a2-ates | 9 | Kolay | 85% | 94% (z12) | 80% | **95%** (z10) |

Aralık dışı (parti güç farkı; görev gereği dokunulmadı): a2-ates ve a2-klasik 7. seviye %78–98; a2-karma Orman 7 Kolay %59; Orman 9 Kolay %78–95 (tek Troll ile hedefin üstü). Mağara 9 Kolay'da beraberlik %23–24 (Drider + Troll + Ogre 2: uzun savaş).

**Volkan** (`volkan-ejder`, 5. seviye, standart parti, 200 tohum): liste Wyvern 1 → Wyvern 1 + Magmin 2 (boss listesi). Parti kazandı %82 → **61%**; ejderha uyandı %40.

## Kuyruk 43 — Boss savaşları (2026-11-01)

`npm run sim:boss -- 200` (standart parti, tek savaş, tohum 1–200; listeler `data/sim-boss.json`). Hedef Normal %45–65, Kolay %70–85. Önce: senaryonun mevcut listesi. Motor kuralı değişmedi; yalnızca düşman listesi/sayısı ve Müdür Kulesi'nin düşman başlangıç altıgenleri (4 → 8, harita verisi).

| Boss | Seviye | Zorluk | Önce | Sonra | Liste |
|---|---|---|---|---|---|
| Beyaz Şehir — Saray Avlusu | 5 | Normal | 100% | **64%** | Gladiator 3, Knight 4, Warrior Veteran 3 |
| Beyaz Şehir — Saray Avlusu | 5 | Kolay | 100% | **84%** | Gladiator 2, Knight 4, Warrior Veteran 3, Guard 1 |
| Kral Kalesi — Taht Salonu | 5 | Normal | 100% | **55%** | Mage 2, Knight 3, Warrior Veteran 2, Guard 1 |
| Kral Kalesi — Taht Salonu | 5 | Kolay | 100% | **72%** | Mage 2, Knight 2, Warrior Veteran 2, Berserker 1 |
| Hapishane — Müdür Kulesi | 3 | Normal | 100% | **58%** | Gladiator 2, Knight 3, Warrior Veteran 2, Guard 1 |
| Hapishane — Müdür Kulesi | 3 | Kolay | 100% | **80%** | Gladiator 2, Knight 2, Warrior Veteran 2, Guard 2 |
| Volkan — uyuyan Young Red Dragon | 5 | Normal | 82% | **61%** | Wyvern 1, Magmin 2 (+ uyuyan ejderha) |
| Volkan — uyuyan Young Red Dragon | 5 | Kolay | 100%* | **82%** | Wyvern 1 (+ uyuyan ejderha) |

\* Önceki Kolay listesi senaryonun 3. seviye listesiydi. Müdür Kulesi'nde parti anahtarı kapıya taşıyarak da kazanır (hedef `veya`); bu yüzden 3. seviye parti güçlü listeye karşı da kazanabiliyor. Volkan'da gürültü ejderhayı uyandırır; ek düşman doğrudan ejderhanın uyanma olasılığını artırır. Kale ve Beyaz Şehir yerleşimlerinde oyunda henüz boss savaşı yok (hub savaşsız); bu listeler boss düğümü eklenince kullanılmak üzere. Müdür Kulesi'nin Serüven zincirindeki listesi değişmedi (zincir zaten %48; karar SABAH-RAPORU'nda).

## Kuyruk 41b — Hapishane Adası, kayalık çukur ve emanet iadesi sonrası (2026-11-01)

`npm run sim:hapishane -- 100`, 3. seviye, Normal. Dış Halka'nın ortası derin su yerine kayalık çukur (1d6 + tur kaybı, yapay zekâ kaçınır), emanet çıkışta geri.

| Hücre bloğu | Dış halka | Müdür kulesi (isteğe bağlı) | İskele | Zincir (kaçış) |
|---|---|---|---|---|
| 100% | 70% (önce 81%) | 71% | 69% (önce 77%) | **48%** (önce 62%; hedef 55–65, aralık dışı) |

Çukurdan kaçınan yol halkada uzuyor; devriyeyle daha uzun dövüş, iskeleye daha yorgun varış. Öneri (karar bekliyor): Dış Halka'da 4 Guard → 3.

## Kuyruk 41b — Yenilenme kesme + Üst seviyede 30 tur (2026-11-01)

`npm run sim:a2 -- 100 --senaryo magara,orman`; yapay zekâ yenilenen hedefe ateş/asit tercih eder, 0 HP'de yenilenmeyi bekleyen Trol'e ateş/asitle son vuruş yapar; 6+ seviyede tur sınırı 30 (önce 20). Galibiyet %, parantezde beraberlik (tur sınırı). Önceki değerler Kuyruk 41 tablosunda.

| Parti | Seviye | Zorluk | Mağara | Orman | Ort. | Önce (Mağara / Orman beraberlik) |
|---|---|---|---|---|---|---|
| klasik | 7 | Normal | 93% (z1) | 75% (z4) | **84%** | z7 / z10 |
| karma | 7 | Normal | 61% (z4) | 36% (z2) | **49%** | z15 / z13 |
| ates | 7 | Normal | 90% (z1) | 82% (z1) | **86%** | z5 / z3 |
| klasik | 7 | Kolay | 94% (z2) | 80% (z2) | **87%** | z11 / z9 |
| karma | 7 | Kolay | 72% (z2) | 59% (z1) | **66%** | z8 / z15 |
| ates | 7 | Kolay | 96% (z1) | 93% | **95%** | z6 / z3 |
| klasik | 9 | Normal | 51% (z4) | 49% | **50%** | z18 / z12 |
| karma | 9 | Normal | 44% (z18) | 37% (z5) | **41%** | z47 / z26 |
| ates | 9 | Normal | 66% (z1) | 60% (z1) | **63%** | z11 / z7 |
| klasik | 9 | Kolay | 34% (z1) | 54% (z5) | **44%** | z23 / z18 |
| karma | 9 | Kolay | 61% (z18) | 47% (z21) | **54%** | z48 / z38 |
| ates | 9 | Kolay | 85% (z1) | 80% (z2) | **83%** | z16 / z4 |

**Sonuç:** beraberlikler 7. seviyede neredeyse bitti, 9. seviyede karma partide yarıya indi (Mağara z47 → z18). Beraberliğin bir kısmı galibiyete, bir kısmı yenilgiye döndü: 9. seviye klasik Mağara Normal %74 → %51, Kolay %70 → %34 (Kolay listesi Normal'den zayıf olduğu hâlde düşük; drider + iki trol, 30 turda parti tükeniyor). Aralık dışı: klasik 9 Kolay Mağara %34 ve ates 7 Kolay %95 (karar bekliyor, sabah raporu).

## Kuyruk 41 — Üst seviye (7, 9) (2026-11-01)

`npm run sim:a2 -- 100 [--parti a2-klasik] [--seviye 7] [--zorluk kolay|normal] [--senaryo col,kale]`; "Üst seviye" açık, 100 tohum, dört senaryo (Çöl, Kale, Mağara, Orman), iki taraf da yapay zekâ, 20 tur sınırı (beraberlik = galibiyet değil, parantezde zN). Partiler `data/sim-partiler.json`: **klasik** Fighter + Cleric + Rogue + Wizard (bor, tavi, sela, mira), **karma** Paladin + Barbarian + Bard + Druid (aria, grum, lira, yara), **ates** Fighter + Sorcerer + Ranger + Cleric (dain, vex, rook, tavi). Normal listeler `data/sim-senaryolar.json` `enemies.7/9`, Kolay listeler `data/sim-a2.json`. Hedef: Normal %45–65, Kolay %70–85.

| Parti | Seviye | Zorluk | Çöl | Kale | Mağara | Orman | Ortalama |
|---|---|---|---|---|---|---|---|
| klasik | 7 | Normal | 70% | 75% (z11) | 90% (z7) | 75% (z10) | **78%** |
| karma | 7 | Normal | 21% (z1) | 76% (z4) | 58% (z15) | 34% (z13) | **47%** |
| ates | 7 | Normal | 75% | 100% | 84% (z5) | 78% (z3) | **84%** |
| klasik | 7 | Kolay | 95% | 83% (z11)* | 87% (z11) | 84% (z9) | **87%** |
| karma | 7 | Kolay | 74% | 88% (z2)* | 70% (z8) | 57% (z15) | **72%** |
| ates | 7 | Kolay | 94% | 100%* | 91% (z6) | 91% (z3) | **94%** |
| klasik | 9 | Normal | 78% | 84% (z2) | 74% (z18) | 65% (z12) | **75%** |
| karma | 9 | Normal | 56% | 79% (z6) | 36% (z47) | 30% (z26) | **50%** |
| ates | 9 | Normal | 80% | 100% | 63% (z11) | 55% (z7) | **75%** |
| klasik | 9 | Kolay | 97% | 93% (z3) | 70% (z23) | 74% (z18) | **84%** |
| karma | 9 | Kolay | 98% | 97% (z2) | 47% (z48) | 42% (z38) | **71%** |
| ates | 9 | Kolay | 100% | 100% | 81% (z16) | 78% (z4) | **90%** |

\* Kale Kolay 7 son listeyle (şövalye 1 → 2) yeniden ölçüldü; diğer hücreler aynı listelerle.

**Üç parti ortalaması:** Normal 7 %70, Normal 9 %67 (hedefin biraz üstü); Kolay 7 %84, Kolay 9 %82 (hedefte).

**Aralık dışı satırlar (karar bekliyor):**
- **Partiler arası fark** liste ayarıyla kapanmıyor: ates ve klasik her yerde hedefin üstünde (Normal %75–84), karma hedefin altında/sınırda (Normal %47–50). Ates Kolay 7 %94 (> %90). Ortak listeyi ates için zorlaştırmak karmayı %10'lara indiriyor (deneme: Kolay 7 Çöl'e +1 Giant Scorpion → ates %84, karma **%34**; geri alındı).
- **Kale** her seviyede kolay (ates %100); asker listeleri çok altıgende tek tek ölüyor.
- **Mağara/Orman beraberlikleri:** trol/drider rejenerasyonu ve karma partinin düşük hasarı yüzünden 20 tur sınırı (9. seviye karma Mağara z47). Tur sınırı ya da rejenerasyon durdurma (ateş/asit) yapay zekâsı ayrı iş.
- Mağara 7 Normal listesi yerleşim sınırı yüzünden en çok 8 canavar (Ghast çıkarıldı).

**Regresyon:** Üst seviye kapalı (1/3/5 partileri) — seviye 3 Çöl, Kale Baskını, Mağara, Orman, K40 öncesi (b94800e) ile birebir aynı.

## Kuyruk 36 — Hapishane Adası (2026-11-01)

`npm run sim:hapishane -- 100 [--kolay] [--parti buyucu]`; 3. seviye, Serüven katmanı uçtan uca (emanet, tasma, doğaçlama silahlar, mahkûm ve hücre arkadaşı NPC, alarm takviyesi, kısa ceza). Yapay zekâ her düğümde savaşır (gizlenmez): alarm her düğümde verilir (ort. 2), takviye en çok 1 Guard — oyuncu için en kötü durum.

| Parti, zorluk | Hücre bloğu (Perde 1) | Dış halka | Müdür kulesi (isteğe bağlı) | İskele | Zincir (kaçış) |
|---|---|---|---|---|---|
| Standart, Normal (100) | 100% | 81% | 78% | 77% | **62%** (hedef 55–65) |
| Standart, Kolay (100) | 100% | 90% | 83% | 99% | **89%** (hedef 75–85; +4) |
| Büyücü, Normal (50; görsel öncesi zemin) | 98% | 94% | 60% | 91% | 86% |

Görseller gelince zemin görsellerden yeniden okundu (`scripts/k36-hapishane.py`); son ölçüm bu zeminle: dış halka 4 Guard, iskele 2 Guard (3. seviye).

Ayar geçmişi (3. seviye): iskele 2 Guard + Warrior Veteran + 2 takviye → zincir %5; 3 Guard + 1 takviye → %45; 2 Guard + Bandit → %46; 2 Guard + 1 takviye → %66 (yer tutucu zemin); görsel zemininde %69 → dış halka 3 → **4 Guard: %62**. Büyücü partisi tasmaya rağmen Perde 1'i geçiyor: hücre arkadaşı (Tough) değiştirilmedi.

## Kuyruk 24b — Ork Kampı sürekli takviye (2026-10-31)

`npm run sim:tek -- 20 orman-ork --seviye N` (parti standart, gündüz; 4. seviye 5. seviye listesiyle). Kapalı: `KURAL_KAPALI=hornReinforce` (K24 tek seferlik boynuz). Ayar yapılmadı.

| Ork Kampı | 3. sv | 4. sv | 5. sv |
|---|---:|---:|---:|
| Sürekli takviye açık | 90% (9,3 tur) | 10% (10,9 tur) | 100% (5,2 tur) |
| Kapalı | 100% | – | 100% |

Aralık dışı: 4. seviye %10. Sim partisi çadırlara saldırmaz; takviye üst sınıra (12) ya da savaş sonuna dek sürer.

## Kuyruk 24 — Orman mekanikleri hızlı ölçüm (2026-10-31)

`npm run sim -- 20 orman orman-heykel orman-oduncu orman-ork orman-kemik orman-magara --seviye N` (parti standart, gündüz; 4. seviye 5. seviye listesiyle). Kapalı: `KURAL_KAPALI=waterfall,hornAlarm,tentFire,wind,treeFell,bridgeBreak,boneRise,vineTrap,logCover`. Ayar yapılmadı (yalnızca rapor).

| Harita | 3. sv | 4. sv | 5. sv | Kapalı 3. sv | Kapalı 5. sv |
|---|---:|---:|---:|---:|---:|
| Dere Kenarı (orman) | 95% | 10% | 70% | 100% | 75% |
| Heykel Gölü | 100% | 100% | 100% | 100% | 100% |
| Oduncu Kampı | 100% | 100% | 100% | 100% | 100% |
| Ork Kampı | 100% | 80% | 100% | 100% | 100% |
| Kemik Açıklığı | 90% | 95% | 100% | 100% | 100% |
| Heykel Mağarası | 100% | 100% | 100% | 100% | 100% |

Aralık dışı: Dere Kenarı 4. seviye %10 (5. seviye listesi), Ork Kampı 4. seviye %80; diğerleri hedefin üstünde (%100). Sim partisi Orman nesnelerini kullanmaz.

## Kuyruk 23 — Orman paketi hızlı ölçüm (2026-10-31)

`npm run sim:tek -- 20 orman-heykel orman-oduncu orman-ork orman-kemik --seviye 3|5`, parti standart, gündüz varyantı. Ayar yapılmadı (görev: yalnızca rapor). **Aralık dışı** (hedef %60–80): hepsi %100.

| Senaryo | 3. sv XP | 3. sv kazandı / ort. tur | 5. sv XP | 5. sv kazandı / ort. tur |
|---|---:|---:|---:|---:|
| Heykel Gölü (su ve pusu) | 950 | 100% / 3.6 | 2050 | 100% / 3.2 |
| Oduncu Kampı (köprü boğazı) | 750 | 100% / 3.9 | 1775 | 100% / 3.9 |
| Ork Kampı (ork akını) | 1300 | 100% / 6.0 | 2950 | 100% / 4.7 |
| Kemik Açıklığı (ölümsüz + orman canavarı) | 800 | 100% / 4.3 | 2200 | 100% / 3.7 |

## Kuyruk 21 D6 — Derinlikler seferi (dallanan), 5. ve 7. seviye (2026-10-31)

`npm run sim:zincir -- 20 --sefer derinlikler --seviye 5 --dal mantar|lav [--zorluk kolay]`, parti standart (5 kişi), 20 tohum; hedef Normal 45–65%, Kolay 70–85%. Mantar dalı 6 savaş (karakol, mezar, mantar, meşale, yürüyen merdiven, hazine), lav dalı 3 savaş (karakol, mezar, lav). Arada Dinlenme düğümü (yalnızca kısa dinlenme) ve tuzaklı sandık (anlatım, savaşsız).

| Deneme | Değişiklik | 5. sv Normal mantar / lav |
|---|---|---:|
| 0 (ilk listeler) | — | 95% / 95% |
| 1 | bütün düğümler ≈ +%40–60 XP; lav'a fire elemental | 45% / 90% |
| 2 | lav: magmin 3 + azer sentinel 2 + fire elemental; hazine hafifledi (wight 1) | 60% / 80% |
| 3 (son) | lav'a hell hound | **60% / 55%** |

**Son durum (deneme 3 listeleri):**

| Seviye, zorluk | Mantar dalı | Lav dalı | Not |
|---|---:|---:|---|
| 5, Normal | **60%** | **55%** | hedefte |
| 5, Kolay | 90% | 65% | **aralık dışı** (hedef 70–85; deneme hakkı bitti) |
| 7, Normal | 85% | 85% | **aralık dışı**; 7. seviye parti verisi eksik (`data/sim-partiler.json` yalnızca 5. seviyeye dek seçim içeriyor; 6–7. seviye yuvaları boş) |

Durak başına ölüm (5. sv Normal, mantar): 0.05 / 0.05 / 0.00 / 0.05 / 0.30 / 0.15; lav: 0.05 / 0.05 / 0.50.

**Son listeler (5. / 7. seviye):** karakol bandit 6, bandit-captain 2, skeleton 4, ghoul 2 / bandit 4, bandit-captain 2, skeleton 4, ghoul 3; mezar skeleton 4, zombie 4, ghast 2, wight 1 (ikisi de); mantar ettercap 2, giant-spider 3, violet-fungus 2, shrieker-fungus 1 (ikisi de); lav magmin 3, azer-sentinel 2, fire-elemental 1, hell-hound 1 / magmin 2, azer-sentinel 1, fire-elemental 1; meşale (sefer düğümü) ghoul 2, ghast 2, skeleton 4 / ghast 2, wight 1, skeleton 4, ghoul 1; yürüyen merdiven ghast 3, skeleton 4, wight 1 / ghast 3, wight 2, skeleton 2; hazine (sefer düğümü) wight 1, ghast 2, skeleton 3 / mummy 2, wight 1, ghast 2.

**Yürüyen merdiven (tek savaş, 5. sv, 20 tohum):** önce %85 (3 berabere: üst sahanlığa çıkan Ghast); yürüyen basamaktan yukarı çıkış ve yukarı atlayış yasaklanınca %100. `npm run sim:tek -- 30 dungeon-merdiven derin-merdiven --seviye 5`: eski merdiven 93%, yürüyen 90% (düzeltmeden önce).

## Kuyruk 19B V6 — "Dinlenme" düğümü (yalnızca kısa dinlenme) ve asıl kartlara doğru düşmanlar (2026-10-31)

"Kül Kampı" uzun dinlenme açtığı için sefer fazla kolaydı (Normal %73–78). Düğüm "Dinlenme" oldu (kimlik `kamp`): 1 saat yürüyüş, varış ≈10:00–12:00 (son uzun dinlenmeden 16 saat dolmaz, uzun dinlenme açılmaz); bir kez sınıra sayılmayan kısa dinlenme (`kisaDinlenme`; SRD: 1 saat, Hit Dice). 60 tohum, parti standart; hedef Normal 45–65%, Kolay 70–85%.

| Deneme | Değişiklik | 3. sv Normal / Kolay | 5. sv Normal / Kolay |
|---|---|---:|---:|
| 1 | tapınak +1 okçu (3/4 scout), köprü 3 skeleton (3. sv), demirhane +1 scout, ejder 2 kobold / 1 hell hound | 20% / 57% | **48% / 83%** |
| 2 | 3. sv: köprü 2 skeleton, demirhane 3 scout + 1 cultist + 1 mephit | 27% / 67% | — |
| 3 (son) | 3. sv ejder eşlikçisi 1 kobold | **50% / 80%** | — |

**Son durum: dört satır da hedefte.** Durak başına ölüm (3. sv Normal): salon 0.03, tapınak 0.38, köprü 0.12, demirhane 0.27, ejder 0.05.

**Son listeler:**

| Düğüm | 3. seviye | 5. seviye |
|---|---|---|
| Salon (6–8 küçük + 2 orta) | cultist 4, skeleton 2, cultist-fanatic 2 | cultist 4, skeleton 3, cultist-fanatic 2 |
| Tapınak (okçular + 2 barut varili haritada) | scout 3, cultist 2, magma-mephit 1, cultist-fanatic 1 | scout 4, cultist-fanatic 1, magma-mephit 2, hell-hound 1 |
| Köprü (kule + geçit) | skeleton 2, magmin 1, scout 2 | skeleton 4, minotaur-skeleton 1, magmin 1, scout 2 |
| Demirhane (menzilli ağırlıklı) | scout 3, cultist 1, magma-mephit 1 | scout 4, cultist-fanatic 2, magmin 1, priest 1 |
| Ejder | Red Dragon Wyrmling (uyuyor) + kobold-warrior 1 | Red Dragon Wyrmling (uyuyor) + hell-hound 1 |

**Tek savaş (dinlenmiş parti, 60 tohum):**

| Harita | 3. sv kazandı | ölen PC | 5. sv kazandı | ölen PC |
|---|---:|---:|---:|---:|
| Işınlanma Salonu | 98% | 0.03 | 100% | 0.00 |
| Lav Tapınağı | 97% | 0.33 | 88% | 0.57 |
| Kanyon Köprüsü | 100% | 0.02 | 100% | 0.07 |
| Volkanik Demirhane | 100% | 0.00 | 100% | 0.00 |
| Ejder Yuvası (ortak senaryo, asıl eşlikçilerle: 2 hell hound, 2 magmin, 2 kobold / wyvern, hell hound, 2 magmin) | 73% | 0.80 | 82% | 0.97 |

## Kuyruk 19 V6 — Volkan Seferi'ne dinlenme durağı (2026-10-31)

Köprü ile demirhane arasına "Kül Kampı" (`kind: rest`, 13 saat yürüyüş; varış 22:00, uzun dinlenme açık). 60 tohum, parti standart. Hedef: Normal 45–65%, Kolay 70–85%.

| Deneme | Demirhane | Ejder eşlikçisi (3. / 5. sv) | 3. sv Normal / Kolay | 5. sv Normal / Kolay |
|---|---|---|---:|---:|
| Kamp eklendi, listeler V5 | V5 (hafif) | 1 kobold / 1 hell hound | 87% / 90% | 88% / 93% |
| 1 | asıl liste | ortak senaryo (2 hell hound, 2 magmin, 2 kobold / wyvern, hell hound, 2 magmin) | 0% / 3% | 32% / 47% |
| 2 | V5 (hafif) | 1 hell hound + 1 kobold / 1 hell hound + 1 magmin | 30% / 43% | **73%** / 85% |
| 3 (son, yalnızca 3. sv) | V5 (hafif) | 2 kobold / — | **78%** / 85% | — |

**Son durum:** 3. sv Normal %78 / Kolay %85, 5. sv Normal %73 / Kolay %85. **Normal iki seviyede de aralığın üstünde (aralık dışı, bırakıldı).** Ejder savaşı eşlikçiye çok duyarlı: 3. sv'de bir hell hound bitirmeyi %78'den %30'a düşürüyor. Kamp öncesi üç savaş (salon, tapınak, köprü) değişmedi; ölümlerin çoğu tapınakta (durak başına 0.42).

## Kuyruk 18 V5 — Volkan Seferi (2026-10-31)

Parti standart, 4 kişi. Seferde dinlenme yeri yok: beş savaş uzun dinlenmesiz (yalnızca kısa dinlenme ve iksir). Bu yüzden zincir, tek savaşlardan çok daha zor. Ayar yalnızca düşman sayısı/bileşimiyle yapıldı: `sefer-*` senaryoları (`data/sim-senaryolar.json`) ve ejder düğümünün `dusmanlar` alanı (`data/seferler.json`; ortak `volkan-ejder-wyrmling` senaryosu değişmedi). Komut: `npm run sim:zincir -- 60 --sefer volkan --seviye 3 --zorluk normal`.

**Zincir (son ayar, 60 tohum).** Hedef: Normal 45–65%, Kolay 70–85%.

| Seviye | Zorluk | Bitirme | Ort. kazanılan savaş | Durak başına ölüm (salon / tapınak / köprü / demirhane / ejder) | Kalan slot | Kalan HP zarı |
|---|---|---:|---:|---|---:|---:|
| 3 | Normal | 53% | 3.97/5 | 0.03 / 0.42 / 0.05 / 0.22 / 0.07 | 51% | 31% |
| 3 | Kolay | 83% | 4.57/5 | 0.03 / 0.40 / 0.03 / 0.07 / 0.22 | 45% | 11% |
| 5 | Normal | 63% | 4.37/5 | 0.00 / 0.42 / 0.08 / 0.18 / 0.25 | 49% | 35% |
| 5 | Kolay | **90%** (aralık dışı) | 4.75/5 | 0.00 / 0.42 / 0.12 / 0.10 / 0.45 | 44% | 14% |

5. seviye Kolay hedefin üstünde: Kolay'da baygınlar sonraki durakta 1 HP ile kalkar ve kısa dinlenme sınırsızdır; Normal'i bozmadan düşürmek için düşman ayarı yetmiyor. Bırakıldı.

**İlk ölçüm (ayar öncesi, 30 tohum):** 3. sv Normal 0% / Kolay 0%, 5. sv Normal 0% / Kolay 0% (tapınakta ve demirhanede kopuyordu).

**Tek savaş (son listeler, 40 tohum, dinlenmiş parti):**

| Harita | 3. sv kazandı | 3. sv ölen PC | 5. sv kazandı | 5. sv ölen PC |
|---|---:|---:|---:|---:|
| Işınlanma Salonu | 100% | 0.03 | 100% | 0.00 |
| Lav Tapınağı | 100% | 0.38 | 98% | 0.38 |
| Kanyon Köprüsü | 100% | 0.00 | 100% | 0.03 |
| Volkanik Demirhane | 100% | 0.00 | 100% | 0.00 |
| Ejder Yuvası (ortak senaryo, sefer eşlikçisiz) | 70% | 0.85 | 85% | 0.97 |

**Ayar geçmişi:** (1) bütün sefer listeleri küçültüldü; (2) köprü ve demirhane (3. sv) küçültüldü; (3) tapınak fanatiksiz + ejder 5. sv yalnız magmin (5. sv %80/%93, fazla kolay); (4) ejder eşlikçisi 3. sv 1 kobold, 5. sv 1 hell hound; (5) 3. sv 1 kobold + 1 magmin denendi (%20, magmin patlaması ölümcül), geri alındı; tapınağa fanatik geri döndü. Son listeler:

| Düğüm | 3. seviye | 5. seviye |
|---|---|---|
| Salon | cultist 4, skeleton 2, cultist-fanatic 2 | cultist 4, skeleton 3, cultist-fanatic 2 |
| Tapınak | scout 2, cultist 2, magma-mephit 1, cultist-fanatic 1 | scout 3, cultist-fanatic 1, magma-mephit 2, hell-hound 1 |
| Köprü | skeleton 2, magmin 1, scout 2 | skeleton 4, minotaur-skeleton 1, magmin 1, scout 2 |
| Demirhane | scout 2, cultist 2, magma-mephit 1 | scout 3, cultist-fanatic 2, magmin 1, priest 1 |
| Ejder | Red Dragon Wyrmling (uyuyor) + kobold-warrior 1 | Red Dragon Wyrmling (uyuyor) + hell-hound 1 |

## Kuyruk 16 K16E — kural sürümü 2 (SRD durum düzeltmeleri): önce/sonra (2026-10-31)

30 tohum, 3. seviye; "önce" kural sürümü 1 (`KURAL_SURUMU=1`, HEAD ile bit bit aynı), "sonra" sürüm 2 (yeni savaşların varsayılanı). Ayar yapılmadı.

| Parti | Senaryo | Parti kazandı | Ort. tur | Ort. ölen PC |
|---|---|---|---|---|
| standart | Çöl — Gündüz | 100% → 100% | 9.0 → 9.0 | 0.03 → 0.03 |
| standart | Orman | 100% → 100% | 5.5 → 5.5 | 0.07 → 0.07 |
| standart | Kale — Gündüz | 93% → 93% | 8.8 → 8.8 | 0.53 → 0.53 |
| standart | Mağara — karanlık | 80% → 80% | 7.1 → 7.1 | 0.40 → 0.40 |
| monk | Çöl — Gündüz | 77% → 83% | 8.5 → 8.1 | 0.43 → 0.33 |
| monk | Orman | 77% → 77% | 5.8 → 5.7 | 0.43 → 0.37 |
| monk | Kale — Gündüz | 97% → 97% | 6.3 → 6.3 | 0.33 → 0.30 |
| monk | Mağara — karanlık | 60% → 63% | 6.7 → 6.7 | 0.57 → 0.53 |
| rogue | Çöl — Gündüz | 80% → 80% | 8.5 → 8.5 | 0.23 → 0.23 |
| rogue | Orman | 73% → 73% | 5.7 → 5.7 | 0.27 → 0.27 |
| rogue | Kale — Gündüz | 97% → 97% | 6.4 → 6.4 | 0.07 → 0.07 |
| rogue | Mağara — karanlık | 73% → 73% | 7.2 → 7.1 | 0.40 → 0.37 |

- Standart parti dört senaryoda değişmedi (Prone/Frightened bu partide ve düşman listelerinde nadir).
- Monk partisi: Çöl %77 → %83, Mağara %60 → %63 (Open Hand Technique'in Topple'ı: yerdeki hedefe bitişikten avantaj iki sürümde de; değişen, partinin bitişikten menzilli saldırısının dezavantajdan avantaja dönmesi ve 10 ft erişimli yakın dövüşün avantajdan dezavantaja dönmesi). Sapma 30 tohumun gürültüsü (±9) içinde.
- Rogue partisi: yalnızca Mağara'da tur/ölüm değerlerinde küçük oynama (Cunning Strike Trip nadiren tutuyor).
- Yeni baz: bu tablodaki "sonra" sütunu; eski tablolar sürüm 1'in değerleri olarak geçerli.

## Kuyruk 16 K16D — yapay zekâ hedef paketi: Kale Baskını (2026-10-31)

30 tohum, standart parti, alarm 6 tur, yapay zekâ gizlenmesi açık; hücre: hobgoblin kalesi / insan muhafızlar kazanma. Ayar yapılmadı.

| Durum | 3. seviye (hedef %35–55) | 5. seviye (hedef %70–90) |
|---|---|---|
| K15A (önce) | 40% / 57% | 93% / 80% |
| + taşıyıcı/çıkış kesme ve barut fıçısı (devriye rotası yok) | 60% / 60% | 97% / 83% |
| + devriye rotası (avluda 4 nokta, 1 tur durak) — **uygulanan** | **53% / 50%** | **87% / 80%** |

- Rotasız ara satır partiyi güçlendiriyor (düşmanlar kuleye en yakın kahramanı kovalarken öbürlerini bırakıyor); devriye avluda yürüyüp partiyi erken fark ettiği için rota eklenince dört değer de hedef aralıkta.
- Eski senaryolar (Çöl, Orman, Kale, Mağara; 3. seviye, 20 tohum) bit bit aynı.

## Kuyruk 15 K15B — yolculuk zinciri: dinlenme kuralı ve Mağara (2026-10-31)

30 tohum, standart parti, 3. seviye, "Kuzey yolu: ilk gün". Hedef Kolay %70–85, Normal %45–65 (TASARIM tek aralık %70–85 veriyordu; iki zorluk için kullanıcının yedek aralığı). (a) yol süreleri: kamp → mağara 5 sa, mağara → han 6 sa (handa 16 saat dolar, SRD 5.2.1 uzun dinlenme); (b) Mağara'da bir bugbear eksik; (c) ikisi.

| Seçenek | Zorluk | Bitirme | Kazanılan savaş | Ölüm (ort.) | Uzun dinlenme (ort.) |
|---|---|---|---|---|---|
| mevcut | Normal | 17% | 1.80/3 | 0.90 | 0.0 |
| mevcut | Kolay | 60% | 2.27/3 | 0.77 | 0.0 |
| a | Normal | 43% | 2.07/3 | 0.70 | 0.6 |
| a | Kolay | 53% | 2.20/3 | 0.63 | 0.7 |
| b | Normal | 23% | 2.10/3 | 1.03 | 0.0 |
| b | Kolay | 43% | 2.30/3 | 1.07 | 0.0 |
| **c** | **Normal** | **63%** | 2.50/3 | 0.63 | 0.9 |
| **c** | **Kolay** | **80%** | 2.67/3 | 0.60 | 0.9 |

- **Seçim: (c)**; tek başına (a) ve (b) hedefe ulaşmıyor. Uzun dinlenme 1'in altında: handa partinin bir kısmı ölü varılan tohumlarda dinlenme yok sayılmıyor ama savaş zaten kaybedilmiş.
- Kolay (a) %53 < mevcut %60: Kolay'da kısa dinlenme kapalı ve 30 tohumun gürültüsü (±9 puan).
- Yolculuk bayrağı varsayılan kapalı; motor testleri ve replay değişmedi.

## Kuyruk 15 K15A — Kale Baskını matrisi: alarm sayacı × yapay zekâ gizlenmesi (2026-10-31)

30 tohum, normal kip, standart parti; hücre: hobgoblin kalesi / insan muhafızlar kazanma. Hedef 3. seviye %35–55, 5. seviye %70–90. Ölçüm `npm run sim:tek -- 30 kale-baskini kale-baskini-muhafiz --seviye N --alarm-tur T --yz-gizlen acik|kapali`.

| Alarm sayacı | Gizlenme | 3. seviye | 5. seviye | Hedeften sapma (puan) |
|---|---|---|---|---|
| 6 | kapalı | 7% / 13% | 67% / 60% | 28 + 22 + 3 + 10 = 63 |
| 6 | **açık** | **40% / 57%** | **93% / 80%** | **0 + 2 + 3 + 0 = 5** |
| 7 | kapalı | 7% / 20% | 80% / 70% | 28 + 15 + 0 + 0 = 43 |
| 7 | açık | 53% / 67% | 93% / 87% | 0 + 12 + 3 + 0 = 15 |
| 8 | kapalı | 23% / 33% | 93% / 80% | 12 + 2 + 3 + 0 = 17 |
| 8 | açık | 60% / 73% | 93% / 90% | 5 + 18 + 3 + 0 = 26 |

- **Seçim: alarm 6 tur, gizlenme açık** (yalnızca sayaç değişti: 8 → 6, `data/alarm.json` `failRounds`). Hiçbir hücre dört değerin hepsini aralığa sokmuyor; en yakını bu (insan muhafızlar 3. seviye +2, hobgoblin 5. seviye +3; ikisi de 30 tohumun gürültüsü içinde, ±9 puan).
- Gizlenme koşulunu daraltmak gerekmedi: gizlenme kapalı her satır 3. seviyede aralığın çok altında.
- Hobgoblin kalesi 5. seviye gizlenmeli bütün hücrelerde %93: sayaç bu satırı oynatmıyor (parti 6 turdan önce bitiriyor). İstenirse liste ayarı (5. seviye) ayrı görev.
- Eski senaryolar bit bit aynı (Çöl, Orman, Kale; aşağıdaki regresyon).

## Kuyruk 14 Y4 — yolculuk zinciri: "Kuzey yolu: ilk gün" (2026-10-31)

`npm run sim:zincir -- 30 [--zorluk]`, standart parti, 3. seviye, 5 durak (Orman, kamp, Mağara, han, Kale; 3 savaş, aralarda yalnızca kısa dinlenme: güzergâh 06:00–19:00 sürdüğü için 16 saat kuralıyla uzun dinlenme yok). Dinlenme politikası: savaştan sonra yaralı varsa kısa dinlenme (hak varsa, HP zarı %80'e), yarı HP altındakine iksir.

| Zorluk | Bitirme | Ort. kazanılan savaş | Durak başına ölüm (O / M / K) | Durak başına düşmüş | Kalan slot | Kalan HP zarı | Kısa dinlenme |
|---|---:|---:|---|---|---:|---:|---:|
| Normal | **17%** | 1,80/3 | 0,07 / 0,43 / 0,40 | 0,73 / 2,37 / 1,83 | 47% | 45% | 1,7 |
| Kolay | **60%** | 2,27/3 | 0,07 / 0,37 / 0,33 | 0,73 / 2,23 / 0,80 | 46% | 38% | 2,5 |

- Hedef (TASARIM karar 5) %70–85; ikisi de altında. Ayar yapılmadı.
- Darboğaz ikinci savaş: Mağara (karanlık; tek başına %84) yıpranmış partiyle durak başına 2,4 düşmüş. Kısa dinlenme sınırı 2 ve günde uzun dinlenme olmaması, düşenlerin (0 HP) bir sonraki savaşa giremeyip HP zarıyla kalkmasını gerektiriyor.
- Öneriler (tek değişiklikle yeniden ölçülmeli): (a) güzergâhta Mağara yerine daha hafif bir karşılaşma ya da Mağara'nın 3. seviye listesinin 1. seviye listesi; (b) ilk gün güzergâhında hanı uzun dinlenme yeri yapmak (saat kuralı için yürüyüş süreleri ya da "gece konaklama" düğümü); (c) Normal'de kısa dinlenme sınırını 3'e çıkarmak.

## Kuyruk 14 K14A — Kale Baskını: alarm sayacı 8 tur, yapay zekâ gizlenmesi ve kapı açma (2026-10-31)

30 tohum, normal kip (alarm tetikleri açık), standart parti. Değişiklikler: alarm sayacı 6 → 8 tur (`data/alarm.json` `failRounds`); parti yapay zekâsı sızma haritasında gözcü yakınken gizlenir ve gizli ilerler (SRD Hide: yürümek gizlenmeyi bozmaz, yalnızca grup haritalarında); düşman yolundaki kapalı kapıyı açar.

| Seviye | Senaryo | K13 (6 tur, gizlenmesiz) | K14A | Beklenen |
|---|---|---|---|---|
| 3 | Hobgoblin kalesi | 7% | **60%** / 9,1 tur, ölüm 13% | 35–55% |
| 3 | İnsan muhafızlar | 13% | **73%** / 8,7 tur, ölüm 7% | 35–55% |
| 5 | Hobgoblin kalesi | 67% | **93%** / 5,9 tur | 70–90% |
| 5 | İnsan muhafızlar | 60% | **90%** / 6,3 tur | 70–90% |

- Aralık dışı: 3. seviye iki senaryoda da üstte (+5 ve +18 puan), 5. seviye hobgoblinde +3. Ayar yapılmadı.
- Öneri (ilk deneme sırasıyla): sayacı 7 tura indirmek; ya da devriyeye bir gözcü daha (kule grubu 3 kişi); ya da habersiz görüşü 60 → 80 ft. 5. seviye için tek değişiklik yeter gibi görünüyor; 3. seviye insan muhafızlarda gizlenme çok etkili (guard'ların pasif Algısı düşük).
- Eski senaryolar (Çöl, Orman, Kale, Taverna; 3. seviye, 30 tohum) K14A öncesiyle bit bit aynı.

## Görev KB — Kale Baskını, alarmın iki ucu ve yüzeyler (2026-10-31)

30 tohum, `sim:tek` (`--alarm yok|hemen`, `--yuzey-kapali`). Hedef: any(iç kapıyı kır, kuzeydoğu kulesine çık); başarısızlık alarmdan 6 tur sonra. "Sessiz giriş" = alarm tetikleri kapalı (`--alarm yok`); "sayaçsız zorluk ölçümü" (eski adı "tam alarm") = bütün gruplar baştan alarmda (`--alarm hemen`; alarm olayı olmadığı için sayaç işlemez: saf savaş zorluğu); "normal" = tetikler açık (yapay zekâ gizlenmediği için devriye ilk turda görür, sayaç 1. turda başlar).

| Parti, seviye | Senaryo | Sessiz giriş | Sayaçsız zorluk ölçümü (tam alarm) | Normal |
|---|---|---|---|---|
| standart 3 | Hobgoblin kalesi (1750 XP) | 100% / 6,8 tur | 87% (berabere 3%) / 10,9 tur, en az 1 ölüm 23% | 7% / 6,9 tur |
| standart 3 | İnsan muhafızlar (1700 XP) | 100% / 6,3 | 83% (berabere 10%) / 10,1, ölüm 17% | 13% / 6,8 |
| standart 5 | Hobgoblin kalesi (3600 XP) | 100% / 4,6 | 100% / 3,6 | 67% / 4,9 |
| standart 5 | İnsan muhafızlar (3100 XP) | 100% / 4,6 | 100% / 5,3 | 60% / 5,3 |

Yüzeyler (büyücü partisi, 5. seviye, normal alarm):

| Senaryo | Yüzey açık | Yüzey kapalı |
|---|---|---|
| Hobgoblin kalesi | 60% / 4,4 tur | 60% / 4,9 tur |
| İnsan muhafızlar | 80% / 4,3 | 70% / 4,8 |

- Aralık dışı: 3. seviyede normal kip %7–13 (alarm sayacı 6 tur, kule 7+ turda); 5. seviyede tam alarm %100 (kolay). Ayar yapılmadı (hafif doğrulama kuralı); öneriler Karar bekleyenlerde: alarm sayacı 3. seviyede 8 tur ya da kule hedefi daha yakın; yapay zekânın gizlenmesi gelince normal kip yeniden ölçülmeli.
- Yüzeyler büyücü partisini yavaşlatmıyor; insan muhafızlarda +10 puan (yağ/fıçı + ateş), fark 30 tohumda gürültü sınırında.

## Görev K13B — yapay zekâ buhar cezası, Stinking Cloud yüzeyi (2026-10-31)

5. seviye, 50 tohum; "Y1" = Y1 sonrası (`eb341eb`), "K13B" = buhar cezası (0,5) + Stinking Cloud zehir bulutu yüzeyi. Ayar yapılmadı.

| Senaryo | Parti | Y1 öncesi | Y1 | K13B |
|---|---|---|---|---|
| Orman | standart | 78 / 0 / 5,8 | 78 / 0 / 5,8 | 78 / 0 / 5,8 |
| Mağara — karanlık | standart | 90 / 10 / 7,5 | 82 / 16 / 9,0 | **86 / 12 / 8,6** |
| Kale — Gündüz | standart | 96 / 2 / 8,2 | 94 / 2 / 8,0 | 96 / 2 / 8,1 |
| Orman yolu — pusu | standart | 98 / 2 / 5,6 | 100 / 0 / 5,2 | 100 / 0 / 5,1 |
| Orman | büyücü | 100 / 0 / 3,5 | 100 / 0 / 3,5 | 100 / 0 / 3,4 |
| Mağara — karanlık | büyücü | 92 / 8 / 5,4 | 92 / 8 / 4,9 | **84 / 16 / 6,1** |
| Kale — Gündüz | büyücü | 98 / 2 / 5,0 | 98 / 2 / 5,0 | 98 / 2 / 4,8 |
| Orman yolu — pusu | büyücü | 100 / 0 / 3,7 | 100 / 0 / 3,9 | 100 / 0 / 3,8 |

(kazanma % / berabere % / ort. tur)

- **Mağara/standart:** düşüşün yarısı geri geldi (82 → 86 kazanma, berabere 16 → 12; Y1 öncesi 90 / 10).
- **Mağara/büyücü:** ceza açıkken 84 / 16. Ceza etkisizken (çarpan 1) 88 / 12.
  - Büyücü partisi suda duran düşmana ateş yerine daha zayıf büyü seçiyor.
  - Fark 50 tohumda 2–4 savaş; gürültü sınırında, yine de **aralık dışı** sayıldı.
  - Öneri: ceza yalnızca dostların o hedefe bu tur saldıracağı durumlarda uygulansın.

## Görev Y1 — yüzey sistemi hızlı regresyonu (2026-10-31)

5. seviye, 50 tohum, 4 senaryo. "Eski" Y1 öncesi (`8182c58`), "yeni" Y1 (yüzey tepkimeleri açık; Lightning Bolt artık `lightning` türünde, Z2 Cutting Words dahil). Ayar yapılmadı.

| Senaryo | Parti | Eski kazanma / berabere / tur | Yeni kazanma / berabere / tur |
|---|---|---|---|
| Orman | standart | 78% / 0% / 5,8 | 78% / 0% / 5,8 |
| Mağara — karanlık | standart | 90% / 10% / 7,5 | **82% / 16% / 9,0** |
| Kale — Gündüz | standart | 96% / 2% / 8,2 | 94% / 2% / 8,0 |
| Orman yolu — eşkıya pususu | standart | 98% / 2% / 5,6 | 100% / 0% / 5,2 |
| Orman | büyücü | 100% / 0% / 3,5 | 100% / 0% / 3,5 |
| Mağara — karanlık | büyücü | 92% / 8% / 5,4 | 92% / 8% / 4,9 |
| Kale — Gündüz | büyücü | 98% / 2% / 5,0 | 98% / 2% / 5,0 |
| Orman yolu — eşkıya pususu | büyücü | 100% / 0% / 3,7 | 100% / 0% / 3,9 |

- Mağara/standart, `--yuzey-kapali` ile eskisiyle birebir aynı (90% / 10% / 7,5). Fark yüzey tepkimelerinden: mağaranın sığ su altıgenlerinde duran düşmana atılan ateş buhar (1 tur yoğun örtü) bırakıyor; görüş kesilince savaş uzuyor (berabere +6 puan).
- Diğer satırlar ±4 puan içinde (50 tohumda gürültü düzeyi).
- **Aralık dışı:** Mağara/standart kazanma −8 puan. Öneri: yapay zekâ suda duran hedefe ateş seçerken buharı hesaba katsın, ya da buhar 1 tur yerine "turun sonuna dek" sürsün. Karar bekliyor; denge değiştirilmedi.

## Görev DENGE-4: büyücü partisi (Sorcerer, Warlock, Bard, Druid + Fighter, Cleric) (30.10)

100 tohum, tüm senaryolar, `--parti buyucu` (Bor, Tavi, Vex, Mor, Lira, Yara; **6 kişi**, diğer partiler 5). Parti kazandı %; ilk ölçüm → yapay zekâ düzeltmesinden sonra (Bard: slotla ilham yok, kontrol büyüsünde en yüksek seviye önce). Ejderha satırlarında parantez içinde uyanma oranı (son ölçüm). Hedef aralık 60–80.

| Senaryo | 3. seviye | 5. seviye |
|---|---:|---:|
| Düz — haritasız | 100% | 100% |
| Çöl — Gündüz | 100% | 100% |
| Volkan | 92% | 98% → 100% |
| Volkan — uyuyan Young Red Dragon | 15% (85% uyandı) | 96% (5% uyandı) |
| Volkan — uyuyan Adult Red Dragon | 3% (98% uyandı) | 95% (5% uyandı) |
| Volkan — uyuyan Ancient Red Dragon | 3% (98% uyandı) | 95% (5% uyandı) |
| Volkan — uyuyan Red Dragon Wyrmling | 62% (92% uyandı) | 97% → 98% (85% uyandı) |
| Volkan — uyuyan Young Red, dragonWake: chance (varsayılan %2) | 8% (92% uyandı) | 91% (9% uyandı) |
| Orman | 100% | 97% → 100% |
| Orman — Gece | 100% | 97% → 100% |
| Mağara — karanlık | 100% | 91% → 93% |
| Dungeon — Koridor (meşale) | 100% | 100% |
| Dungeon — Merdiven | 92% | 95% |
| Dungeon — Hazine odası | 100% | 100% |
| Kale — Gündüz | 99% | 100% |
| Kale — Gece | 99% | 100% |
| Taverna — 4 masum ortada | 100% | 100% |
| Taverna — 4 masum düşmandan uzakta, varsayılan | 100% | 100% |
| Taverna — 8 masum düşmandan uzakta | 100% | 100% |

**Aralık dışı:** neredeyse bütün senaryolar 80 üstü (6 kişilik parti, senaryoların XP bütçesi 5 kişilik partiye göre). Uyuyan ejderha 3. seviyede (Young/Adult/Ancient) aralık altı: diğer partilerle aynı (ejderha uyanınca kazanılmaz). 5. seviyede ejderha senaryoları %91–96: parti muhafızları ejderha uyanmadan yeniyor (uyanma %5–9; standart parti Young Red 5. seviye: %75 kazanma, %25 uyanma, aynı ölçümle). Düşman listesi değiştirilmedi (kural: düzeltme denemeleri tam test turunda).

**Üye başına hasar** (teşhis: 5. seviye, Kale/Mağara/Dungeon/Volkan/Orman × 15 tohum, düşmana verilen toplam hasar; alan büyüleri hedef başına sayılır): Vex (Sorcerer) 22 029, Mor (Warlock) 7 425, Yara (Druid) 6 334, Bor (Fighter) 3 237, Tavi (Cleric) 2 849, Lira (Bard) 2 807. Karşılaştırma, standart parti aynı örneklem: Mira (Wizard) 21 927, Kael 6 497, Sela 6 022, Tavi 4 616, Bor 4 240. Sorcerer Wizard düzeyinde; Bard'ın düşük hasarı destek rolünden (Bardic Inspiration, Hypnotic Pattern, Faerie Fire).

## Gece kuyruğu 5: K11, WARLOCK, BARD, DRUID (30.10)

Hızlı regresyon, 100 tohum, parti kazandı %; her görev bir öncekinin commit'iyle karşılaştırıldı (WARLOCK `03dc696`, BARD `dabdfe1`, DRUID `5c896e3`). Üç karşılaştırmada da 16 senaryo **birebir aynı**. Yeni sınıflar denge partilerinde olmadığı için yeni parti ölçümü yapılmadı (SABAH-RAPORU "Karar bekleyenler").

| Parti / seviye | Mağara | Dungeon | Kale | Volkan |
|---|---|---|---|---|
| standart 3 | 85 | 95 | 81 | 87 |
| standart 5 | 79 | 95 | 91 | 85 |
| paladin 3 | 80 | 93 | 95 | 80 |
| paladin 5 | 69 | 84 | 87 | 95 |

Aralık dışı (60–80): standart 3 Dungeon/Kale/Volkan, standart 5 Dungeon/Kale/Volkan, paladin 3 Dungeon/Kale, paladin 5 Dungeon/Kale/Volkan (kuyruk 4'teki gibi; düzeltme "tam test turu"na kaldı).

## Görev K12: Cleric dengesinin kaynağı (30.10)

100 tohum, standart parti, parti kazandı %. "Tam": şimdiki kod; diğer sütunlar o özellik kapalıyken. Taban: CLERIC öncesi (`5d37bbe`).

| Seviye / senaryo | Taban | Tam | Channel Divinity sezgisi yok | Preserve Life yok | Divine Spark yok | Life pasifleri yok | Hazır büyüler yok |
|---|---:|---:|---:|---:|---:|---:|---:|
| 3 Mağara | 77 | 85 | 78 | 85 | 85 | 87 | 85 |
| 3 Dungeon | 89 | 95 | 90 | 96 | 95 | 95 | 95 |
| 3 Kale | 78 | 81 | 74 | 80 | 81 | 82 | 82 |
| 3 Volkan | 64 | 87 | 60 | 74 | 87 | 88 | 86 |
| 5 Mağara | 79 | 79 | 77 | 83 | 79 | 80 | 79 |
| 5 Dungeon | 82 | 95 | 84 | 92 | 95 | 95 | 95 |
| 5 Kale | 84 | 91 | 86 | 88 | 91 | 92 | 91 |
| 5 Volkan | 81 | 85 | 83 | 81 | 85 | 83 | 85 |

- Sanctuary ve Warding Bond partide yok (sıfır etki). Fark Channel Divinity'nin iki kullanımından; SRD'ye uygun, değiştirilmedi (DECISIONS.md).

## Gece kuyruğu 4: CLERIC, WIZARD, SORCERER (30.10)

Hızlı regresyon (100 tohum; Mağara, Dungeon, Kale, Volkan; parti kazandı %). Düşman listeleri değişmedi.

**CLERIC** (taban `5d37bbe` → Cleric; Life Domain'li Tavi iki partide de var: Preserve Life, Divine Spark, Disciple of Life):

| Parti / seviye | Mağara | Dungeon | Kale | Volkan |
|---|---:|---:|---:|---:|
| standart 3 | 77 → 85 | 89 → 95 | 78 → 81 | 64 → 87 |
| standart 5 | 79 → 78 | 82 → 95 | 84 → 90 | 81 → 85 |
| paladin 3 | 67 → 80 | 80 → 93 | 86 → 95 | 79 → 80 |

Paladin 5 Cleric ölçümü yarıda kaldı (bellek); CLERIC sonrası değerleri aşağıdaki tablonun ilk sütunu.

**WIZARD + SORCERER** (taban `3d4cfd4`, CLERIC sonu → Hold Person düzeltmesi sonrası):

| Parti / seviye | Mağara | Dungeon | Kale | Volkan |
|---|---:|---:|---:|---:|
| standart 3 | 85 → 85 | 95 → 95 | 81 → 81 | 87 → 87 |
| standart 5 | 78 → 79 | 95 → 95 | 90 → 91 | 85 → 85 |
| paladin 3 | 80 → 80 | 93 → 93 | 95 → 95 | 80 → 80 |
| paladin 5 | 69 → 69 | 84 → 84 | 87 → 87 | 95 → 95 |

- Düzeltmeden önce WIZARD'ın Hold Person yapay zekâsı Kale 5'te paladin partisini 87 → 68, standart partiyi 90 → 84 düşürüyordu (17 humanoid düşmana Fireball yerine tek hedefli felç). Kural ≤3 düşmanla sınırlandı (DECISIONS.md).
- Cleric kazançları büyük (özellikle Volkan 3 ve Dungeon); aralık dışı satırlar: standart 3 Volkan 87, Dungeon 95 (iki parti), Kale paladin 3 95. Düşman listesi düzeltmesi "Dungeondex öncesi tam test turu"na kaldı.
- Sorcerer denge partilerinde yok; yeni parti eklenmedi.

## Gece kuyruğu 3: K9b ve K9d (30.10)

Hızlı regresyon (önceki commit'e karşı, 100 tohum; standart ve paladin × 3./5. seviye; Mağara, Dungeon, Kale, Volkan; parti galibiyeti).

- **K9b (yukarı slot ölçekleri uygulandı: Fireball, Cure Wounds, Bless…):** 16 satırın hepsi ±2 puan içinde (en büyük: paladin 3 Mağara 68 → 66). Standart 5 Mağara'da "en az 1 ölüm" %28 → %20 (iyileştirme büyüleri yukarı slotta güçlendi).
- **K9d (eğitimsiz zırh; Tavi Chain Mail → Half Plate, AC 18 → 17):** aralık dışı iki satır:

| Parti | Seviye | Senaryo | Önce | Sonra | Fark |
|---|---:|---|---:|---:|---:|
| standart | 3 | Kale — Gündüz | %84 | %78 | −6 |
| paladin | 3 | Kale — Gündüz | %90 | %86 | −4 |

Diğer 14 satır ±3 içinde (standart 3 Mağara −3, paladin 5 Dungeon −3, Volkan −3). Neden: Cleric'in AC'si 1 düştü; Kale'de okçu düşmanlar ön sıradaki Cleric'i daha çok vuruyor. İki satır da %60–80 hedef aralığında ya da üstünde; düşman listesi değiştirilmedi (hafif doğrulama modu).

## Gece kuyruğu B3–B5 ve CILA (30.10)

Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin × 3./5. seviye; Mağara, Dungeon, Kale, Volkan). B3, B4, B5: 16 satır HEAD ile birebir aynı (simülasyon partileri yeni büyüleri kullanmıyor). CILA (yapay zekâ zemin büyüleri, Haste ek eylemi, Entangle/Web eylemle kurtulma, çağrı taşıma): en büyük fark ±2 puan (standart 3 Volkan 62 → 63, Dungeon 91 → 90; paladin 5 Volkan 89 → 91). Hedef aralığı (%60–80) dışındaki satırlar CILA'dan önce de dışındaydı ve aynı kaldı: standart 3 Dungeon %90 (önce 91), Kale %83; standart 5 Dungeon %85, Kale %82, Volkan %81; paladin 3 Kale %90; paladin 5 Volkan %91 (önce 89). Düzeltme denemesi yapılmadı (kural: tam ölçüm "Dungeondex öncesi tam test turu"na).

## Görev B2: büyü alanları, geçici engel, çağırma (29.10)

Ortak motor değişti (haritada büyü alanları, hareket maliyeti ve adım tetikleri, saldırı denetiminde yoğun örtü ve rüzgâr duvarı, dokunulamaz çağrılar, tur başı/sonu alan tetikleri) ve Spike Growth alan büyüsüne dönüştü (simülasyonda Kael ve Rook'ta var). Hızlı regresyon: standart ve Paladin partileri × 3. ve 5. seviye × Mağara, Dungeon Koridor, Kale, Volkan × 100 savaş, Görev B1 commit'ine (256067c) karşı. **16 satırın hepsinde bütün sütunlar birebir aynı** (yalnızca süre farklı). Tam ölçüm yapılmadı.

## Görev B1: büyü sistemleri bölüm 1 (29.10)

Ortak motor değişti (süren etkinin yeni alanları, tur sonu etki olayları, `damageProfile`, save modunda etki avantajı, hasar cezası, süreli tekrar, ölüm turu). Hızlı regresyon: standart ve Paladin partileri × 3. ve 5. seviye × Mağara, Dungeon Koridor, Kale, Volkan × 100 savaş, Görev L5 commit'ine (7eb5f11) karşı. **16 satırın hepsinde bütün sütunlar birebir aynı** (yalnızca süre farklı; simülasyon partilerinde B1 büyüleri yok). Tam ölçüm yapılmadı.

## Görev S1: büyü altyapısı, ışınlanma, uçuş, Exhaustion (29.10)

Ortak motor değişti (uçuş denetimi `isAirborne`, hız hesabına etki ve bitkinlik, d20 Testlerine bitkinlik eklentisi, AC'ye etki, yeni büyü türleri, yapay zekâya Misty Step kaçışı ve Fly). Hızlı regresyon: standart ve Paladin partileri × 3. ve 5. seviye × Mağara, Dungeon Koridor, Kale, Volkan × 200 savaş, Görev V2 commit'ine (c607855) karşı. **Bütün sütunlar birebir aynı** (simülasyon partilerinde Misty Step ve Fly yok; yeni etki büyülerini yapay zekâ kendiliğinden yapmaz). Tam ölçüm yapılmadı.

## Görev F: Fighter, Rogue, Ranger partileri (29.10)

**Yeni partiler** (Bor yerine): `fighter` Dain (Champion, Greatsword, Great Weapon Fighting), `rogue` Nix (ikinci Thief), `ranger` Rook (yakın dövüş Hunter, Longsword + kalkan, Horde Breaker). Deneme 100 tohum, son ölçüm 200 tohum, 1/3/5. seviye × 19 senaryo. Hedef %55–85, ejderhada %60–80.

**Eski partiler** (standart, barbar, paladin, monk): Bor, Sela ve Kael Görev F özelliklerini aldı (Tactical Mind/Shift, Improved Critical, Steady Aim, Cunning Strike, Hunter's Prey, Deft Explorer, herkesin silahsız vuruşu); sonuçların değişeceği belli olduğu için hızlı regresyon yerine doğrudan tam ölçüm yapıldı (4 parti × 1/3/5 × 200). Partiler 3. seviyede belirgin güçlendi (standart Koridor 94, Taverna 8 masum 94, Çöl 91).

**Düşman listesi düzeltmeleri** (`data/sim-senaryolar.json`, 2 deneme; listeler 7 partide ortak, her deneme 7 partiyle 100 tohum):

| Seviye | Senaryo | Eski | Yeni | Önce (std / bar / pal / monk / fig / rog / ran) | Son, 200 tohum |
|---|---|---|---|---|---|
| 3 | Volkan | Magma Mephit 2 | Magma Mephit 3 | 77 / 93 / 90 / 81 / 85 / 88 / 89 | 62 / 82 / 78 / 62 / 62 / 71 / 82 |
| 3 | Wyrmling | Kobold Warrior 1 | Kobold Warrior 2 | 73 / 88 / 80 / 75 / 81 / 88 / 88 | 74 / 86 / 80 / 68 / 77 / 80 / 79 |
| 3 | Taverna uzakta | Bandit 2 | Bandit 3 | 87 / 83 / 91 / 86 / 80 / 87 / 84 | 82 / 70 / 83 / 64 / 75 / 72 / 79 |
| 3 | Taverna 8 masum | Bandit 3 | Bandit 4 (deneme 1: Tough 3 → Monk 54) | 94 / 83 / 94 / 84 / 90 / 96 / 91 | 88 / 76 / 85 / 81 / 71 / 81 / 82 |
| 5 | Taverna ortada | Tough Boss 3, Knight 4, Bandit Captain 2 | Tough Boss 4, Knight 5 (deneme 1: Knight 5, Captain 1 → yetmedi) | 86 / 76 / 87 / 86 / 92 / 85 / 95 | 83 / 75 / 80 / 77 / 82 / 80 / 86 |
| 5 | Kale (gündüz) | Goblin Warrior 5, Hobgoblin Warrior 3 | Goblin 4, Hobgoblin 4 (düşman eklemek haritaya sığmadı) | 89 / 82 / 85 / 83 / 82 / 77 / 86 | 86 / 80 / 78 / 81 / 80 / 70 / 85 |

**Yeni partiler, son ölçüm** (200 tohum):

| Seviye | Düz | Çöl | Volkan | Young | Adult | Ancient | Wyrmling | Şans | Orman | Orman Gece | Mağara | Koridor | Merdiven | Hazine | Kale | Kale Gece | Taverna ortada | Taverna uzakta | Taverna 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Fighter 1 | 59 | 79 | 76 | 73 | 63 | 63 | 76 | 74 | 67 | 67 | 76 | 72 | 78 | 73 | 83 | 83 | 64 | 75 | 77 |
| Fighter 3 | 73 | 80 | 62 | 73 | 79 | 79 | 77 | **81** | 70 | 70 | 65 | 82 | 73 | 69 | 73 | 73 | 73 | 75 | 71 |
| Fighter 5 | 76 | 79 | 80 | **82** | 79 | 79 | 80 | **83** | 63 | 63 | 85 | 75 | 82 | 83 | 80 | 82 | 82 | 72 | 85 |
| Rogue 1 | 56 | 64 | 68 | 77 | 63 | 63 | 78 | 78 | 72 | 72 | 76 | 67 | 79 | 77 | 69 | 69 | 69 | 71 | 75 |
| Rogue 3 | **52** | 68 | 71 | **84** | **84** | **84** | 80 | **87** | 67 | 67 | 56 | 68 | 66 | 74 | **86** | **86** | 74 | 72 | 81 |
| Rogue 5 | 66 | 68 | **87** | **84** | 80 | 80 | 62 | 80 | 84 | 84 | 76 | 73 | 82 | 80 | 70 | 77 | 80 | 74 | **91** |
| Ranger 1 | 72 | 78 | 83 | 78 | 68 | 68 | 76 | 73 | 71 | 71 | 72 | 70 | **86** | 80 | 80 | 80 | 69 | **91** | 85 |
| Ranger 3 | 79 | 78 | 82 | 80 | **86** | **86** | 79 | **90** | **86** | **86** | 56 | 73 | 74 | 77 | 84 | 84 | 74 | 79 | 82 |
| Ranger 5 | 81 | 82 | 85 | 77 | 72 | 72 | 71 | 74 | 80 | 80 | 78 | 84 | 85 | 79 | 85 | **88** | **86** | 77 | 82 |

**Aralık dışı kalanlar** (son ölçüm; 3 deneme sınırı içinde düzeltilmedi):
- **Rogue partisi Düz 3. seviye %52** (1. seviye 56): haritasız savaşta önde dövüşen yok (Bor yerine ikinci Rogue); diğer partiler aynı listede 71–92, liste kolaylaştırılmadı.
- **Ejderha senaryoları 3. seviyede üst sınırın üstünde** (Rogue/Ranger Adult–Ancient 84–86, şans 87–90; barbar 83–86): ejderha uyanmadan biten savaşlar arttı. Standart parti aynı listede 65; zorlaştırmak onu aralık dışına iter.
- **Rogue 5. seviye Volkan %87, Taverna 8 masum %91; Fighter ejderha (Young/şans) 81–83:** sınırın 1–6 puan üstü; diğer partiler aynı listede aralıkta.
- **Ranger 1. seviye Taverna uzakta %91, Merdiven %86; 3. seviye Orman %86; 5. seviye Kale Gece %88, Taverna ortada %86**: Rook'un kalkanlı AC'si ve Hunter's Mark; diğer partiler aralıkta.
- **Eskiden bilinenler**: 1. seviye Adult/Ancient (paladin 53, monk 55), 1. seviye Kale (paladin 86), Düz 3/5 (barbar 92/93), 5. seviye Volkan (barbar/paladin/monk 90–91), 5. seviye Orman (paladin 90), 3. seviye Mağara (monk 54).
- **Görev F ile yeni çıkan eski parti satırları** (standart): 3. seviye Çöl 91, Koridor 94; 5. seviye Hazine 91, Kale Gece 89, Taverna 8 masum 87; ejderha 81–84. Bor ve Sela'nın yeni özellikleri (Tactical Mind, Steady Aim, Cunning Strike) standart partiyi yukarı itti; tek partide aralık dışı olan ortak listeler değiştirilmedi.
- Kale Gece listesi Kale'den ayrı (`kale-gece`); yalnızca gündüz listesi değişti.

## Görev E1: jenerik alt sınıf şeması (29.10)

Denge değişmedi. Alt sınıflar yeni şemaya taşındı; 12 SRD alt sınıfının 1–20. seviye kitleri birebir aynı (test). Hızlı regresyon (4 parti × 3. ve 5. seviye × Mağara, Koridor, Merdiven, Kale × 200 savaş): bütün sütunlar HEAD ile aynı.

## Görev H: durum denetimi (29.10)

Değişen motor kuralları: Paralyzed/Unconscious otomatik kritiği "5 ft içinden" (bitişikten menzilli de kritik, 10 ft erişimden yakın dövüş kritik değil), Incapacitated/Stunned yaratık yürüyebilir (yapay zekâ yürümez, turunu bitirir), hız 0 tek listede. Hızlı regresyon: 4 parti × 3. ve 5. seviye × 4 senaryo (Mağara, Dungeon Koridor, Merdiven, Kale; ghoul ve ghast felci, Monk Stunning Strike) × 200 savaş, HEAD'e karşı. Tüm sütunlar (galibiyet, ölüm, tur, hasar…) birebir aynı; tam ölçüm yapılmadı.

## Görev R4: koni ve çizgi alan şekilleri (28.10)

Ortak motor ve canavar davranışı değişti: canavar nefesleri ve koni/çizgi saldırıları artık alandaki herkesi vurur (hasar bir kez, hedef başına save), koni SRD genişliğinde (Burning Hands 7 → 5 altıgen), yapay zekâ koni/çizgide en çok düşmanı kapsayan ve dost vurmayan yönü seçer. Noktadan çıkan alanlar (Fireball, Acid Splash) eskisi gibi düşmanın altıgenine atılır: her altıgeni deneyen akıllı nokta araması partiyi denge dışı güçlendirdi (standart 5. seviye Kale %80 → %97) ve kapalı (DECISIONS.md).

Tam ölçüm: 4 parti × 1/3/5. seviye × 19 senaryo × 200 savaş (paralel). Aşağıda yalnızca R2'ye göre en az 5 puan değişen ya da aralık dışı satırlar; değerler sırasıyla standart / barbar / paladin / monk. Hedef %55–85, ejderha senaryoları %60–80.

| Sv. | Senaryo | R2 (std / bar / pal / monk) | R4 ölçüm | Düzeltme sonrası | Hedef | Not |
|---|---|---|---|---|---|---|
| 1 | Volkan | 76 / 78 / 86 / 71 | 82 / 75 / 81 / 63 | — | 55–85 |  |
| 1 | Volkan — uyuyan Adult Red Dragon | 70 / 72 / 51 / 58 | 63 / 66 / 53 / 55 | — | 60–80 | aralık dışı (bilinen) |
| 1 | Volkan — uyuyan Ancient Red Dragon | 70 / 72 / 51 / 58 | 63 / 66 / 53 / 55 | — | 60–80 | aralık dışı (bilinen) |
| 1 | Volkan — uyuyan ejderha (şans) | 75 / 74 / 69 / 71 | 74 / 68 / 70 / 64 | — | 60–80 |  |
| 1 | Kale — Gündüz | 83 / 82 / 86 / 70 | 83 / 82 / 86 / 70 | — | 55–85 | aralık dışı (bilinen) |
| 1 | Kale — Gece | 83 / 82 / 86 / 70 | 83 / 82 / 86 / 70 | — | 55–85 | aralık dışı (bilinen) |
| 3 | Düz | 61 / 92 / 74 / 77 | 61 / 92 / 74 / 77 | — | 55–85 | aralık dışı (bilinen) |
| 3 | Volkan | 55 / 71 / 81 / 71 | 51 / 70 / 66 / 56 | 74 / 83 / 85 / 75 | 55–85 | düzeltildi |
| 3 | Volkan — uyuyan Young Red Dragon | 68 / 70 / 78 / 60 | 65 / 71 / 71 / 62 | — | 60–80 |  |
| 3 | Volkan — uyuyan Adult Red Dragon | 71 / 79 / 78 / 61 | 66 / 75 / 72 / 63 | — | 60–80 |  |
| 3 | Volkan — uyuyan Ancient Red Dragon | 71 / 79 / 78 / 61 | 66 / 75 / 72 / 63 | — | 60–80 |  |
| 3 | Volkan — uyuyan Red Dragon Wyrmling | 70 / 75 / 71 / 64 | 58 / 70 / 69 / 59 | 72 / 78 / 79 / 65 | 60–80 | düzeltildi |
| 3 | Orman | 85 / 85 / 79 / 69 | 84 / 88 / 84 / 72 | 73 / 83 / 69 / 65 | 55–85 | düzeltildi |
| 3 | Orman — Gece | 85 / 85 / 79 / 69 | 84 / 88 / 84 / 72 | 73 / 83 / 69 / 65 | 55–85 | düzeltildi |
| 3 | Dungeon — Hazine odası | 79 / 63 / 83 / 72 | 82 / 68 / 83 / 72 | — | 55–85 |  |
| 5 | Düz | 76 / 95 / 78 / 85 | 76 / 95 / 78 / 85 | — | 55–85 | aralık dışı (bilinen) |
| 5 | Volkan | 75 / 90 / 95 / 91 | 80 / 85 / 91 / 87 | — | 55–85 | aralık dışı (bilinen) |
| 5 | Volkan — uyuyan Young Red Dragon | 77 / 75 / 74 / 72 | 69 / 63 / 64 / 56 | 77 / 74 / 72 / 72 | 60–80 | düzeltildi |
| 5 | Volkan — uyuyan Adult Red Dragon | 76 / 73 / 75 / 68 | 74 / 70 / 70 / 66 | — | 60–80 |  |
| 5 | Volkan — uyuyan Red Dragon Wyrmling | 71 / 79 / 80 / 77 | 59 / 72 / 59 / 63 | 62 / 74 / 61 / 76 | 60–80 | düzeltildi |
| 5 | Volkan — uyuyan ejderha (şans) | 79 / 87 / 86 / 83 | 74 / 76 / 76 / 67 | — | 60–80 |  |
| 5 | Orman | 80 / 78 / 87 / 65 | 81 / 77 / 86 / 64 | — | 55–85 | aralık dışı (bilinen) |
| 5 | Orman — Gece | 80 / 78 / 87 / 65 | 81 / 77 / 86 / 64 | — | 55–85 | aralık dışı (bilinen) |


**Düzeltmeler** (`data/sim-senaryolar.json`, canavar verisine dokunulmadı; 2 deneme):
- 3. seviye Volkan: Imp çıktı (Hell Hound'un 15 ft konisi artık birden çok karakteri vuruyor).
- 3. seviye Wyrmling: Kobold Warrior 3 → 1 (deneme 1'de 2'ye inince monk 57 kaldı).
- 3. seviye Orman ve Orman gece: Wolf 2 → 3.
- 5. seviye Wyrmling: Imp çıktı. 5. seviye Young: Harpy çıktı.

Ejderha senaryolarında genel eğilim düşüş: nefes konisi birden çok karakteri vuruyor (5. seviye Wyrmling −12/−21, Young −8/−16). 5. seviye "şans" senaryosu bu yüzden aralığa girdi (barbar 87 → 76, paladin 86 → 76).

**Aralık dışı kalanlar** (R1/R2'den beri bilinen; bu görevde değişmedi ya da iyileşti): 1. seviye Adult/Ancient (paladin 53, monk 55; ejderha uyanınca düşük seviye parti yetişemiyor), 1. seviye Kale (paladin 86), Düz 3/5 (barbar 92/95), 5. seviye Volkan (paladin 91, monk 87; 95/91'den iyileşti), 5. seviye Orman (paladin 86).

## Görev R3: çağırma ve yoldaş (28.10)

Ortak motor değişti (çağırma olayları, kaybolma temizliği, ölüm save'i ve kazanan kuralında çağrılmış yaratık istisnası, büyü slotu modülü, Faithful Steed kaynağı). Partiler çağırma kullanmıyor (yapay zekâ çağırma büyüsü yapmaz), bu yüzden sonuçların birebir aynı kalması beklendi. **Hızlı regresyon** (tam ölçüm yerine): önceki commit (f272512) ile yeni kod aynı tohumlarla, 4 parti × 1. ve 5. seviye × 4 senaryo (Çöl, Orman, Dungeon, Kale) × 200 savaş. **Sonuç: 32 satırın hepsinde bütün sütunlar birebir aynı** (yalnızca süre farklı). Tam ölçüm atlandı; aşağıdaki tablo değişmeyen değerlerdir.

| Parti, seviye | Senaryo | Parti kazandı | Ort. tur | En az 1 ölüm |
|---|---|---:|---:|---:|
| standart L1 | Çöl — Gündüz | 84% | 8.2 | 35% |
| standart L1 | Orman | 78% | 5.7 | 30% |
| standart L1 | Dungeon — Koridor (meşale) | 82% | 6.0 | 24% |
| standart L1 | Kale — Gündüz | 83% | 9.9 | 39% |
| standart L5 | Çöl — Gündüz | 78% | 7.0 | 26% |
| standart L5 | Orman | 80% | 5.5 | 13% |
| standart L5 | Dungeon — Koridor (meşale) | 85% | 5.8 | 19% |
| standart L5 | Kale — Gündüz | 80% | 9.4 | 26% |
| barbar L1 | Çöl — Gündüz | 83% | 7.4 | 30% |
| barbar L1 | Orman | 70% | 5.6 | 32% |
| barbar L1 | Dungeon — Koridor (meşale) | 76% | 6.0 | 24% |
| barbar L1 | Kale — Gündüz | 82% | 8.5 | 31% |
| barbar L5 | Çöl — Gündüz | 67% | 6.6 | 26% |
| barbar L5 | Orman | 78% | 5.3 | 13% |
| barbar L5 | Dungeon — Koridor (meşale) | 73% | 6.5 | 32% |
| barbar L5 | Kale — Gündüz | 76% | 8.6 | 34% |
| paladin L1 | Çöl — Gündüz | 82% | 8.5 | 48% |
| paladin L1 | Orman | 74% | 6.2 | 44% |
| paladin L1 | Dungeon — Koridor (meşale) | 76% | 6.5 | 31% |
| paladin L1 | Kale — Gündüz | 86% | 8.6 | 28% |
| paladin L5 | Çöl — Gündüz | 67% | 8.0 | 30% |
| paladin L5 | Orman | 87% | 6.1 | 11% |
| paladin L5 | Dungeon — Koridor (meşale) | 79% | 8.0 | 30% |
| paladin L5 | Kale — Gündüz | 81% | 9.6 | 18% |
| monk L1 | Çöl — Gündüz | 67% | 8.0 | 55% |
| monk L1 | Orman | 57% | 5.7 | 55% |
| monk L1 | Dungeon — Koridor (meşale) | 67% | 6.3 | 40% |
| monk L1 | Kale — Gündüz | 70% | 9.1 | 48% |
| monk L5 | Çöl — Gündüz | 80% | 6.7 | 30% |
| monk L5 | Orman | 65% | 5.3 | 22% |
| monk L5 | Dungeon — Koridor (meşale) | 71% | 6.3 | 33% |
| monk L5 | Kale — Gündüz | 81% | 7.8 | 32% |

**Duman testi** (`src/sim/summonSmoke.test.ts`): Paladin partisi 5. seviyede Çöl, Orman, Dungeon ve Kale'de; Paladin ilk turunda Find Steed (Faithful Steed, slotsuz) yapar, savaşı yapay zekâ oynar. Her senaryoda 3 tohumda at çağrılıyor, saldırı yapıyor ve olaylar baştan oynatılınca aynı durum çıkıyor. Çağırma kullanan sim partisi yok (görev kapsamı); çağırmanın denge etkisi ölçülmedi.

## Görev R2: süren etkiler ve zar eklentileri (24.10)

**Ölçüm:** ortak motor değişti (saldırı/save/kontrol zarına eklenti, geçici HP, süregelen hasar). Dört parti 1/3/5. seviyede 200 tohumla, Görev R1'in son listeleriyle tam ölçüldü.

**Değişim:**
- Yalnızca Paladin partisi belirgin değişti: Aria 3. seviyeden Bless yapıyor, 5. seviyede Searing Smite süregelen hasar bırakıyor.
- Standart, Barbarian ve Monk partileri Görev R1'le ±2 puan içinde. Tavi 3. ve 5. seviyede Spiritual Weapon / Spirit Guardians'ı Bless'e yeğliyor; yapay zekâ konsantrasyonu bozmaz.

| Senaryo | Seviye | Paladin R1 → R2 |
|---|---:|---|
| Volkan | 3 | 85 → **90** |
| Düz | 3 | 79 → 74 |
| Young / Adult / Ancient | 3 | 73/74/74 → 78/78/78 |
| Wyrmling | 3 | 80 → 71 |
| Kale / Kale Gece | 3 | 77 → 81 |
| Taverna uzakta | 3 | 80 → 74 |
| Wyrmling | 5 | 69 → 80 |
| Mağara | 5 | 68 → 74 |
| Çöl | 5 | 72 → 67 |

**Düşman listesi düzeltmesi** (3 deneme, dört parti 200 tohum):

| Senaryo | Seviye | Eski | Denemeler (standart / Paladin / Barbarian / Monk) | Yeni |
|---|---:|---|---|---|
| Volkan | 3 | Hell Hound 1, Magmin 2, Imp 1, Magma Mephit 2 | + Magma Mephit: 50 / 71 / 64 / 66; + Steam Mephit: **55 / 81 / 71 / 71**; + Giant Fire Beetle: 69 / 90 / 83 / 77 | + Steam Mephit 1 |

**Son durum** (200 tohum, bütün senaryolar; Volkan 3. seviye yeni listeyle; kalın: aralık dışı):

| Parti | Seviye | Düz | Çöl | Volkan | Young | Adult | Ancient | Wyrmling | Şans | Orman | Orman Gece | Mağara | Koridor | Merdiven | Hazine | Kale | Kale Gece | Taverna ortada | Taverna uzakta | Taverna 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Standart | 1 | 66 | 84 | 76 | 76 | 70 | 70 | 78 | 75 | 78 | 78 | 83 | 82 | 71 | 83 | 83 | 83 | 72 | 82 | 81 |
| Standart | 3 | 61 | 80 | 55 | 68 | 71 | 71 | 70 | 76 | 85 | 85 | 69 | 83 | 77 | 79 | 72 | 72 | 65 | 73 | 80 |
| Standart | 5 | 76 | 78 | 75 | 77 | 76 | 74 | 71 | 79 | 80 | 80 | 80 | 85 | 85 | 85 | 80 | 80 | 79 | 66 | 71 |
| Paladin | 1 | 74 | 82 | **86** | 71 | **51** | **51** | 70 | 69 | 74 | 74 | 71 | 76 | 82 | 77 | **86** | **86** | 74 | 84 | 84 |
| Paladin | 3 | 74 | 74 | 81 | 78 | 78 | 78 | 71 | 78 | 79 | 79 | 57 | 77 | 79 | 83 | 81 | 81 | 67 | 74 | 79 |
| Paladin | 5 | 78 | 67 | **95** | 74 | 75 | 70 | 80 | **86** | **87** | **87** | 74 | 79 | 72 | 82 | 81 | 81 | 80 | 65 | 72 |
| Barbarian | 1 | 81 | 83 | 78 | 75 | 72 | 72 | 77 | 74 | 70 | 70 | 80 | 76 | 83 | 77 | 82 | 82 | 79 | 79 | 82 |
| Barbarian | 3 | **92** | 79 | 71 | 70 | 79 | 79 | 75 | 74 | 85 | 85 | 57 | 74 | 74 | 63 | 57 | 57 | 59 | 63 | 67 |
| Barbarian | 5 | **95** | 67 | **90** | 75 | 73 | 70 | 79 | **87** | 78 | 78 | 78 | 73 | 78 | 75 | 76 | 76 | 74 | 66 | 73 |
| Monk | 1 | 64 | 67 | 71 | 70 | **58** | **58** | 67 | 71 | 57 | 57 | 65 | 67 | 76 | 60 | 70 | 70 | 56 | 68 | 68 |
| Monk | 3 | 77 | 72 | 71 | 60 | 61 | 61 | 64 | 73 | 69 | 69 | 55 | 64 | 75 | 72 | 68 | 68 | 64 | 74 | 60 |
| Monk | 5 | 85 | 80 | **91** | 72 | 68 | 66 | 77 | **83** | 65 | 65 | 78 | 71 | 81 | 80 | 81 | 81 | 80 | 72 | 78 |

**Aralık dışı kalanlar:** hepsi Görev R1'den (ya da önceki görevlerden) kalan satırlar; R2 yeni bir aralık dışı bırakmadı.
- Paladin 5 Volkan %95 ve Barbarian 5 Volkan %90: Fiend'e karşı Divine Smite / Rage.
- Volkan şans 5: Barbarian ve Paladin %86–87, Monk %83 (Görev R1'de üç deneme).
- Paladin 5 Orman ve Orman Gece %87 (Görev R1'de 90'dan düşürüldü).
- Paladin 1 Volkan/Kale %86: 1 puan.
- Adult/Ancient 1. seviye: Paladin %51, Monk %58.
- Barbarian Düz 3/5.
- Monk Volkan 5 %91.

## Görev R1: tepki sistemi (24.10)

**Ölçüm:** ortak savaş motoru değişti. Dört parti (standart, Barbarian, Paladin, Monk) 1/3/5. seviyede 200 tohumla, Görev P-Monk'un listeleriyle tam ölçüldü.

**Kaymanın kaynakları:**
- Sela (Rogue 5) Uncanny Dodge: 5. seviyede bütün partiler güçlendi.
- Knight ve Bandit Captain'ın Parry'si: Taverna, yalnızca ıskaya çevirince kullanılıyor.
- Monk'un Deflect Attacks'i artık tepki ve hasarın tamamını azaltıyor; geri yöneltme var.
- Fırsat saldırısı davranışı aynı (yapay zekâ her zaman kullanır).

**Değişen sonuçlar** (önce → sonra, %; **(dış)** aralık dışı; Barbarian ve Paladin'in "önce" değerleri Görev P-Monk'ta değişen satırlarda eski listelerle):

| Parti | Seviye | Değişenler |
|---|---:|---|
| Standart | 1 | Çöl 83→84; Hazine 81→83 |
| Standart | 3 | Çöl 78→80; Young 69→68; Orman 84→85; OrmanG 84→85; Mağara 68→69; Koridor 75→74; Merdiven 79→77; TavOrt 68→65; TavUz 78→73; Tav8 82→80 |
| Standart | 5 | Düz 68→76; Çöl 75→78; Volkan 73→75; Young 75→77; Ancient 75→74; Wyrmling 69→71; Şans 80→79; Orman 82→84; OrmanG 82→84; Mağara 77→80; Merdiven 84→89 **(dış)**; Hazine 84→86 **(dış)**; Kale 79→80; KaleG 79→80; TavOrt 82→85; TavUz 77→79; Tav8 79→82 |
| Barbarian | 1 | Çöl 69→83; TavOrt 80→79; Tav8 57→82 |
| Barbarian | 3 | Düz 92→92 **(dış)**; Adult 81→79; Ancient 81→79; Hazine 47→63; TavOrt 63→59; TavUz 64→63; Tav8 51→67 |
| Barbarian | 5 | Düz 94→95 **(dış)**; Çöl 64→67; Volkan 93→90 **(dış)**; Young 75→76; Adult 75→73; Ancient 72→70; Wyrmling 83→79; Şans 73→87 **(dış)**; Orman 81→78; OrmanG 81→78; Mağara 81→78; Koridor 60→73; Merdiven 72→82; Hazine 73→79; Kale 70→76; KaleG 70→76; TavOrt 86→86 **(dış)**; TavUz 78→84; Tav8 80→78 |
| Paladin | 1 | Çöl 68→82; Volkan 86→86 **(dış)**; Adult 51→51 **(dış)**; Ancient 51→51 **(dış)**; Hazine 78→77; Kale 86→86 **(dış)**; KaleG 86→86 **(dış)**; TavOrt 78→74; Tav8 68→84 |
| Paladin | 3 | Çöl 73→70; Adult 71→74; Ancient 71→74; Wyrmling 79→80; Şans 81→81 **(dış)**; Orman 79→80; OrmanG 79→80; Mağara 56→55; Merdiven 80→79; Hazine 70→80; TavOrt 72→68; TavUz 82→80; Tav8 63→81 |
| Paladin | 5 | Düz 78→81; Çöl 67→72; Volkan 96→94 **(dış)**; Young 77→79; Adult 75→74; Ancient 72→71; Wyrmling 80→69; Şans 79→87 **(dış)**; Orman 82→90 **(dış)**; OrmanG 82→90 **(dış)**; Mağara 70→68; Koridor 71→82; Merdiven 68→78; Hazine 80→81; Kale 76→78; KaleG 76→78; TavOrt 84→83; TavUz 65→70; Tav8 77→74 |
| Monk | 1 | Adult 58→58 **(dış)**; Ancient 58→58 **(dış)** |
| Monk | 3 | Düz 75→77; Çöl 67→72; Volkan 80→82; Young 57→60; Adult 64→61; Ancient 64→61; Wyrmling 63→64; Şans 72→73; Orman 67→69; OrmanG 67→69; Mağara 61→55; Koridor 64→54 **(dış)**; Merdiven 70→75; Hazine 63→72; Kale 62→68; KaleG 62→68; TavOrt 59→64; TavUz 69→74; Tav8 70→60 |
| Monk | 5 | Düz 81→85; Çöl 74→80; Volkan 89→91 **(dış)**; Young 69→72; Adult 69→68; Ancient 68→66; Şans 80→83 **(dış)**; Orman 61→62; OrmanG 61→62; Mağara 75→78; Koridor 64→71; Merdiven 75→80; Hazine 73→79; Kale 72→81; KaleG 72→81; TavOrt 86→88 **(dış)**; TavUz 82→90 **(dış)**; Tav8 81→87 **(dış)** |

**Düşman listesi düzeltmeleri** (3 deneme; standart parti 200 tohum, diğerleri 100):

| Senaryo | Seviye | Eski | Yeni | Sonuç (standart / diğer) |
|---|---:|---|---|---|
| Koridor | 3 | Ghoul 2, Ghast 3, Skeleton 4 | Skeleton 3 | 74 → 83 / Monk 54 → 65 |
| Merdiven | 5 | Ghoul 1, Ghast 4, Wight 3, Skeleton 1, Bugbear Stalker 2 | Skeleton 2 | 89 → 85 |
| Hazine | 5 | Wight 3, Bugbear Stalker 1, Mummy 2, Ghast 3, Bugbear Warrior 2, Minotaur 1 | Mummy 3, Ghast 2 (Bugbear Warrior +1 haritaya sığmadı) | 86 → 85 |
| Taverna ortada | 5 | Tough Boss 3, Knight 3, Bandit Captain 2, Spy 1 | Knight 4, Spy yok | 85 → 79 / Monk 88 → 74, Barbarian 86 → 76 |
| Taverna uzakta | 5 | Tough Boss 2, Knight 3, Bandit Captain 3, Spy 1 | Tough Boss 3, Knight 4, Bandit Captain 2 | 79 → 66 / Monk 90 → 72 (1. deneme Knight 4: 71 / 87) |
| Taverna 8 masum | 5 | Tough Boss 2, Knight 3, Bandit Captain 3, Spy 1 | Knight 4, Spy yok | 82 → 71 / Monk 87 → 76 |
| Orman / Gece | 5 | … Dire Wolf 2 … | Dire Wolf 3 | 84 → 80 / Paladin 90 → 87, Monk 62 → 63 |

Denenip geri alınan: **Volkan şans 5. seviye** (Wyvern 1). Üç deneme yapıldı:
- \+ Magma Mephit: standart 61, Monk 56, Paladin 60, Barbarian 70.
- \+ Kobold Warrior: standart 83 (ejderha aralığı dışı), Paladin 84, Barbarian 83, Monk 69.
- \+ Steam Mephit: standart 59, Monk 54.

Üçü de standart partiyi aralık dışına çıkardığı için liste değişmedi (standart 79; Barbarian 87, Paladin 87, Monk 83).

**Aralık dışı kalanlar:**
- Barbarian: Düz 3. ve 5. seviye (%92, %95; önceden de dışarıdaydı), Volkan 5 (%90), Volkan şans 5 (%87).
- Paladin:
  - 1. seviye: Volkan, Kale ve Kale Gece %86 (1 puan); Adult/Ancient %51 (önceden de).
  - 3. seviye: Volkan şans %81.
  - 5. seviye: Volkan %94, Volkan şans %87, Orman %87.
- Monk: 1. seviye Adult/Ancient %58 (önceden de), 5. seviye Volkan %91 ve Volkan şans %83.
- Volkan'daki yüksek sonuçlar Paladin ve Barbarian'ın Fiend'e karşı gücünden (Görev P-Paladin notu). Standart parti %75'te; bir Hell Hound eklemek önceki denemede onu %34'e düşürmüştü.

## Görev P-Monk: Monk partisi (24.10)

**Monk partisi** (`--parti monk`): Bor yerine Lin.
- Human Monk, Warrior of the Open Hand, köken feat'i Alert. DEX 17 (4. seviyede 19), WIS 15. Zırhsız, kalkansız; Spear ve Dagger. Unarmored Defense ile AC 15 (4. seviyeden 16).
- Yapay zekâ: Attack eyleminden sonra Flurry of Blows (Topple), Focus yoksa bonus Unarmed Strike; 5. seviyede Stunning Strike.
- Deneme turları 100 tohum, son kabul 200 tohum. Hedef %55–85, ejderhada %60–80.

**Eski partilerin regresyonu (tam ölçüm):**
- Ortak savaş kodu değişti (guard'lı): fırsat saldırısı (Addled), canavar saldırısı (Deflect Attacks), düşme hasarı (Slow Fall), savaş başı (Uncanny Metabolism), silah seçeneği (Martial Arts).
- Standart, Barbarian ve Paladin partileri 1/3/5. seviyede 200 tohumla eski listelerle yeniden ölçüldü. Sonuç Görev P-Paladin ile birebir aynı (171 sayının hepsi).

**Düşman listesi düzeltmeleri** (3 deneme). Listeler partiler arasında ortak; her deneme Monk (100) ve standart parti (200) ile ölçüldü.

| Senaryo | Seviye | Eski | Yeni | Denemeler (Monk / standart) |
|---|---:|---|---|---|
| Çöl | 1 | Gnoll Warrior 3, Giant Wolf Spider 2, Scout 1, Giant Lizard 1 | Giant Lizard yerine Jackal | Lizard yok: 80 / **86**; Jackal: **72 / 83** |
| Taverna ortada | 1 | Bandit 4, Tough 2, Cultist 3 | Cultist 2, Giant Rat 1 | Cultist 2: 78 / **87**; + Giant Rat: **60 / 72** |
| Taverna 8 masum | 1 | Bandit 4, Tough 3 | Bandit 5, Tough 2 | Tough 2: 87 / **91**; Bandit 5: **68 / 81** |
| Volkan Adult / Ancient | 3 | Hell Hound 2, Magmin 2, Kobold Warrior 2 | Kobold Warrior 1 | **61 / 71** |
| Hazine | 3 | Ghoul 3, Ghast 3, Skeleton 3 | Skeleton 2 | **63 / 79** (200 tohum) |
| Taverna 8 masum | 3 | Tough 2, Bandit Captain 2, Spy 2, Bandit 2 | Spy 1, Bandit 3 | Spy 1: 78 / **91**; Bandit 3: **77 / 82** |
| Volkan | 5 | Hell Hound 2, Fire Elemental 1, Magmin 2, Imp 3, Magma Mephit 1 | Magma Mephit 2 | **88** / 73 (Imp 4 haritaya sığmadı) |
| Wyrmling | 5 | Wyvern 1, Hell Hound 1, Magmin 2 | + Imp 1 | Magmin 3: **89** / 78; Imp 1: **77 / 69** |
| Volkan şans | 5 | Wyvern 1, Imp 1 | Imp yok | **73 / 80** |
| Orman / Gece | 5 | Owlbear 2, Werewolf 2, Giant Spider 3, Dire Wolf 4, Ettercap 2, Wolf 2 | Dire Wolf 2 | Dire Wolf 3: **51** / 77; Dire Wolf 2: **61 / 82** |
| Koridor | 5 | Wight 3, Bugbear Stalker 1, Mummy 2, Ghast 3, Ghoul 2, Bugbear Warrior 2, Minotaur 1 | Ghoul 1 | **65 / 85** |
| Taverna ortada | 5 | Tough Boss 3, Knight 2, Bandit Captain 2, Spy 2 | Knight 3, Spy 1 | **84 / 82** |
| Taverna 8 masum | 5 | Tough Boss 2, Knight 2, Bandit Captain 3, Spy 2 | Knight 3, Spy 1 | **84 / 79** |

Denenip geri alınan: Volkan Young 3. seviyede Kobold Warrior 1 (Monk 55, standart 75; Monk'a yaramadı).

**Sonuç** (yalnızca değişen ve aralık dışı satırlar; Monk ilk ölçüm 100 tohum, son 200 tohum; Orman Gece standart ölçülmedi, listesi Orman'la aynı):

| Senaryo | Seviye | Monk ilk | Monk son | Standart önce | Standart son |
|---|---:|---:|---:|---:|---:|
| Çöl | 1 | **54** | 67 | 77 | 83 |
| Volkan Adult | 1 | **51** | **58** | 70 | 70 |
| Volkan Ancient | 1 | **51** | **58** | 70 | 70 |
| Taverna ortada | 1 | **54** | 56 | 77 | 72 |
| Taverna 8 masum | 1 | **47** | 68 | 61 | 81 |
| Volkan Young | 3 | 63 | **57** | 69 | 69 |
| Volkan Adult | 3 | **58** | 64 | 61 | 71 |
| Volkan Ancient | 3 | **58** | 64 | 61 | 71 |
| Hazine | 3 | 55 | 63 | 69 | 79 |
| Taverna 8 masum | 3 | **49** | 70 | 71 | 82 |
| Volkan | 5 | **92** | **89** | 83 | 73 |
| Wyrmling | 5 | **83** | 77 | 76 | 69 |
| Volkan şans | 5 | **53** | 80 | 74 | 80 |
| Orman | 5 | **46** | 61 | 77 | 82 |
| Orman Gece | 5 | **46** | 61 | 77 | – |
| Koridor | 5 | **54** | 64 | 79 | 85 |
| Taverna ortada | 5 | **88** | **86** | 85 | 82 |
| Taverna 8 masum | 5 | **89** | 81 | 85 | 79 |

Monk son ölçüm, bütün senaryolar (200 tohum, yeni listeler):

| Seviye | Düz | Çöl | Volkan | Young | Adult | Ancient | Wyrmling | Şans | Orman | Orman Gece | Mağara | Koridor | Merdiven | Hazine | Kale | Kale Gece | Taverna ortada | Taverna uzakta | Taverna 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 64 | 67 | 71 | 70 | **58** | **58** | 67 | 71 | 57 | 57 | 65 | 67 | 76 | 60 | 70 | 70 | 56 | 68 | 68 |
| 3 | 75 | 67 | 80 | **57** | 64 | 64 | 63 | 72 | 67 | 67 | 61 | 64 | 70 | 63 | 62 | 62 | 59 | 69 | 70 |
| 5 | 81 | 74 | **89** | 69 | 69 | 68 | 77 | 80 | 61 | 61 | 75 | 64 | 75 | 73 | 72 | 72 | **86** | 82 | 81 |

### Aralık dışı kalanlar (Monk partisi, son ölçüm)

- **Volkan, 5. seviye %89:** Paladin'deki gibi (%96). Haritaya bir düşman daha sığmıyor; standart parti %73'e indi, daha zorlaştırılmadı.
- **Volkan Adult ve Ancient, 1. seviye %58:** Paladin'le aynı neden (1. seviyede ejderha sık uyanıyor, uyanınca hep kayıp). Eşlik edenleri azaltmak standart partiyi aralık dışına çıkarıyordu.
- **Volkan Young, 3. seviye %57:** 100 tohumda %63'tü; bir Kobold Warrior çıkarmak Monk'a yaramadı (%55), geri alındı.
- **Taverna ortada, 5. seviye %86:** sınırın 1 puan üstü, gürültü düzeyinde.
- **Genel:** Monk partisi 1. ve 3. seviyede standarttan ~8 puan zayıf. Lin'in AC'si (15–16) ve HP'si Bor'dan düşük; Focus 1. seviyede yok, Stunning Strike 5. seviyede geliyor. Monk şişirilmedi.

## Görev P-Paladin: Paladin partisi ve alt sınıf düzeltmesi (24.10)

**Paladin partisi** (`--parti paladin`): Bor yerine Aria.
- Human Paladin, Oath of Devotion. STR 17 (5. seviyede 19), CHA 13.
- Chain Mail, kalkan, Longsword (Sap) ve Javelin (Slow). AC 18.
- 2. seviyede Blessed Warrior (Sacred Flame, Guidance), 4. seviyede ASI STR +2.
- Büyüler 5. seviyede: Cure Wounds, Searing Smite, Divine Favor, Bless (çalışmıyor), Magic Weapon, Shining Smite. Divine Smite ve yemin büyüleri her zaman hazır.
- Deneme turları 100 tohum, son kabul 200 tohum. Hedef %55–85, ejderhada %60–80; aralık dışı kalın.

**Eski partilerin regresyonu (tam ölçüm):**
- Ortak savaş kodu değişti: saldırıda AC ve koruma kaynakları, silah saldırısında güçlendirmeler, yakın dövüş isabet kaydı.
- Bu yüzden standart ve Barbarian partileri 1/3/5. seviyede 200 tohumla yeniden ölçüldü. Sonuç Görev B2 ile birebir aynı (114 sayının hepsi).
- Alt sınıf düzeltmesi de sonuçları değiştirmedi: sim partilerinde alt sınıf zaten seçili.

**Düşman listesi düzeltmeleri.** Listeler partiler arasında ortak; her deneme Paladin (100) ve standart parti (200) ile ölçüldü ve ikisinin de aralıkta kalması arandı.

| Senaryo | Seviye | Eski | Yeni | Denemeler (Paladin / standart) |
|---|---:|---|---|---|
| Düz | 1 | Gnoll Warrior 2, Worg 1, Wolf 2 | + Hyena 1 | Wolf +1: 58 / **47**; Hyena +1: **69 / 66** |
| Hazine | 1 | Skeleton 4, Zombie 3, Ghoul 1, Giant Rat 2 | Giant Rat yok | **75 / 81** |
| Wyrmling | 1 | Magmin 2, Magma Mephit 2, Kobold Warrior 3 | Kobold Warrior 2, Giant Fire Beetle 1 | Kobold 2: 69 / **81**; + Beetle: **64 / 78** |
| Volkan şans | 1 | Kobold Warrior 3, Magma Mephit 2 | Kobold Warrior 2 | **63 / 75** |
| Çöl | 3 | Death Dog 2, Gnoll Warrior 4, Giant Hyena 2, Scout 2 | Scout 1 | Scout 0: 81 / **91**; Scout 1: **66 / 78** |
| Orman / Gece | 3 | Owlbear 1, Dire Wolf 3, Giant Spider 2, Wolf 2 | Giant Spider 1 | **77 / 84** |
| Hazine | 3 | Ghoul 2, Ghast 3, Skeleton 3, Wight 1 | Ghoul 3, Ghast 3, Skeleton 3 | Wight yok: 79 / **88**; Ghoul +1: **69 / 69** |
| Wyrmling | 3 | Hell Hound 2, Magmin 2, Kobold Warrior 2 | Kobold Warrior 3 | **76 / 70** |
| Merdiven | 5 | Ghoul 1, Ghast 4, Wight 3, Skeleton 2, Bugbear Stalker 2 | Skeleton 1 | **65 / 84** |

### 1. seviye

| Senaryo | Paladin ilk (100) | Paladin son (200) | Standart önce | Standart son |
|---|---:|---:|---:|---:|
| Düz | **89** | 73 | 76 | 66 |
| Çöl | 69 | 68 | 77 | 77 |
| Volkan | 85 | **86** | 76 | 76 |
| Volkan Young | 65 | 71 | 76 | 76 |
| Volkan Adult | **46** | **51** | 70 | 70 |
| Volkan Ancient | **46** | **51** | 70 | 70 |
| Volkan Wyrmling | **59** | 70 | 74 | 78 |
| Volkan şans | **58** | 69 | 71 | 75 |
| Orman | 72 | 74 | 78 | 78 |
| Orman Gece | 72 | 74 | 78 | 78 |
| Mağara | 71 | 70 | 83 | 83 |
| Koridor | 80 | 76 | 82 | 82 |
| Merdiven | 81 | 82 | 71 | 71 |
| Hazine | **48** | 78 | 58 | 81 |
| Kale | 84 | **86** | 83 | 83 |
| Kale Gece | 84 | **86** | 83 | 83 |
| Taverna ortada | 75 | 78 | 77 | 77 |
| Taverna uzakta | 80 | 84 | 82 | 82 |
| Taverna 8 masum | 65 | 68 | 61 | 61 |

### 3. seviye

| Senaryo | Paladin ilk (100) | Paladin son (200) | Standart önce | Standart son |
|---|---:|---:|---:|---:|
| Düz | 82 | 79 | 61 | 61 |
| Çöl | **49** | 73 | 65 | 78 |
| Volkan | 83 | 85 | 74 | 74 |
| Volkan Young | 71 | 73 | 69 | 69 |
| Volkan Adult | 72 | 71 | 61 | 61 |
| Volkan Ancient | 72 | 71 | 61 | 61 |
| Volkan Wyrmling | **82** | 79 | 69 | 70 |
| Volkan şans | 78 | **81** | 76 | 76 |
| Orman | **50** | 79 | 55 | 84 |
| Orman Gece | **50** | 79 | 55 | 84 |
| Mağara | 59 | 56 | 68 | 68 |
| Koridor | 59 | 67 | 75 | 75 |
| Merdiven | 81 | 80 | 79 | 79 |
| Hazine | **47** | 70 | 64 | 69 |
| Kale | 75 | 77 | 72 | 72 |
| Kale Gece | 75 | 77 | 72 | 72 |
| Taverna ortada | 67 | 72 | 68 | 68 |
| Taverna uzakta | 83 | 82 | 78 | 78 |
| Taverna 8 masum | 63 | 63 | 71 | 71 |

### 5. seviye

| Senaryo | Paladin ilk (100) | Paladin son (200) | Standart önce | Standart son |
|---|---:|---:|---:|---:|
| Düz | 74 | 78 | 68 | 68 |
| Çöl | 60 | 67 | 75 | 75 |
| Volkan | **98** | **96** | 83 | 83 |
| Volkan Young | 70 | 77 | 75 | 75 |
| Volkan Adult | 75 | 75 | 76 | 76 |
| Volkan Ancient | 71 | 72 | 75 | 75 |
| Volkan Wyrmling | 80 | 80 | 76 | 76 |
| Volkan şans | 79 | 79 | 74 | 74 |
| Orman | 78 | 82 | 77 | 77 |
| Orman Gece | 78 | 82 | 77 | 77 |
| Mağara | 67 | 70 | 77 | 77 |
| Koridor | 74 | 71 | 79 | 79 |
| Merdiven | **54** | 68 | 78 | 84 |
| Hazine | 78 | 80 | 84 | 84 |
| Kale | 74 | 76 | 79 | 79 |
| Kale Gece | 74 | 76 | 79 | 79 |
| Taverna ortada | 81 | 84 | 85 | 85 |
| Taverna uzakta | 64 | 65 | 77 | 77 |
| Taverna 8 masum | 73 | 77 | 85 | 85 |

### Aralık dışı kalanlar (Paladin partisi, son ölçüm)

- **Volkan, 5. seviye %96 (1. seviye %86):**
  - Volkan'ın düşmanlarının çoğu Fiend: Hell Hound, Imp; Magma Mephit ve Magmin elemental.
  - Divine Smite Fiend'e +1d8 vuruyor. Protection from Evil and Good Fiend ve Elemental saldırılarına dezavantaj veriyor.
  - Liste değiştirilmedi: standart parti 5. seviyede %83'te. Önceki ölçümde bir Hell Hound eklemek standart partiyi %34'e düşürmüştü.
  - Paladin bu senaryoda gerçekten güçlü.
- **Volkan Adult ve Ancient, 1. seviye %51 (ilk ölçüm %46):**
  - 1. seviyede parti ejderhayı sık uyandırıyor; uyanınca hep kaybediyor.
  - Eşlik edenleri azaltmak standart partiyi %83'e çıkarıyordu (B2'deki 1. deneme). Düzeltilmedi.
  - Paladin'in 1. seviyede alan büyüsü yok (Bor'un yerine geçiyor), eşlik edenleri daha yavaş temizliyor.
- **Kale ve Kale Gece, 1. seviye %86:** sınırın 1 puan üstünde, gürültü düzeyinde. İlk ölçüm (100 tohum) %84'tü.
- **Volkan şans, 3. seviye %81:** sınırın 1 puan üstünde, gürültü düzeyinde.
- **Genel:** Paladin partisi standarttan biraz güçlü.
  - Lay On Hands düşen dostu kaldırıyor.
  - Divine Smite bir kez slotsuz, slotlu olanı kritikte ya da büyük hedefte.
  - Sacred Weapon +1 isabet.
- **Barbarian partisi** (değişen senaryolar, 200 tohum):
  - 1. seviye: Düz 81, Hazine 77, Wyrmling 77, Volkan şans 74.
  - 3. seviye: Çöl 79, Orman 85, Hazine 47 (önce 37), Wyrmling 75.
  - 5. seviye: Merdiven 72.
  - Hazine 3. seviyede hâlâ zayıf; nedeni B2'deki gibi.

## Görev B2: simülasyon partileri tamamlandı (24.10)

200 tohum, `npm run sim -- 200 --seviye 1|3|5 --parti standart|barbar`. Hedef standart partide %55–85, ejderhada %60–80; aralık dışı kalın. Sütunlar:
- "B1": Görev B1 sonu.
- "parti tamam": partiler tamamlandı, düşman listeleri değişmedi.
- "son": düşman listeleri düzeltildikten sonra.

**Tamamlanan eksikler** (`data/sim-partiler.json`, kod değişmedi):
- **Alt sınıf (3+):** Bor Champion, Mira Evoker, Tavi Life Domain, Sela Thief, Kael Hunter, Grum Path of the Berserker.
- **Köken feat'i (1):**
  - Bor ve Grum: Savage Attacker (Soldier).
  - Mira: Magic Initiate (Sage). Tavi: Magic Initiate (Acolyte).
  - Sela ve Kael: Alert (Criminal).
- **4. seviye yuvası:** herkese ASI +2, ana skora (STR, INT, WIS ya da DEX 17 → 19).
- **Büyüler SRD tablosu kadar:**
  - Mira ve Tavi 5. seviyede 4 cantrip + 9 hazır büyü (önce 2 + 5).
  - Kael 5. seviyede 6 hazır büyü (önce 1).
- **Scholar (Wizard 2):** Mira'ya Arcana uzmanlığı.
- **Test:** her parti, her seviyede köken feat'i, 3+ alt sınıf, 4. seviye yuvası, tablo kadar büyü ve yuva kurallarını denetliyor.

**Veride tamamlanamayan (motorda seçim ya da etki yok):**
- Etkisi oyunda olmayanlar: Savage Attacker ve Magic Initiate; alt sınıf özellikleri Frenzy dışında (Improved Critical, Potent Cantrip, Disciple of Life, Hunter's Prey, Fast Hands…).
- Divine Order seçimi yok: Tavi'nin Chain Mail'i için Protector varsayılıyor.
- Ranger'ın Deft Explorer uzmanlığı yok.
- İnsanın ikinci köken feat'i (Versatile) yok: sheet'te tek köken feat'i alanı var.
- Alt sınıf verisi 5. seviye sheet'inde durduğu için 1. seviye sheet'inde de görünüyor; özellikleri seviyeye göre açıldığı için etkisi yok.

**Frenzy (düzeltme):**
- B1'de "Frenzy hiç çalışmadı" yazılmıştı; bu yanlıştı.
- Motor, alt sınıf seçilmemişse SRD'deki tek alt sınıfı varsayılan alır (`gainedFeatures`). Grum'da Frenzy B1'de de açıktı.
- Doğrulama: 15 örnek savaşta (Düz, Kale, Orman; 5. seviye) 21 Frenzy isabeti oldu.
- Yeni test (`balance.test.ts`, "Frenzy simülasyonda çalışır") 3. ve 5. seviye Barbarian savaşlarında Frenzy isabetini sayıyor ve sayının sıfırdan büyük olmasını bekliyor.
- Barbarian sonuçlarındaki değişim bu yüzden Frenzy'den değil, ASI ve öbür üyelerin tamamlanmasından geliyor.

### 1. seviye

| Senaryo | Standart B1 | Standart, parti tamam | Standart son | Barbarian B1 | Barbarian son |
|---|---:|---:|---:|---:|---:|
| Düz | 76 | 76 | 76 | **93** | **93** |
| Çöl | 84 | **86** | 77 | **86** | 69 |
| Volkan | 78 | 76 | 76 | 77 | 78 |
| Volkan Young | 76 | 76 | 76 | 79 | 75 |
| Volkan Adult | 77 | **83** | 70 | 73 | 72 |
| Volkan Ancient | 77 | **83** | 70 | 73 | 72 |
| Volkan Wyrmling | 71 | 74 | 74 | 71 | 69 |
| Volkan şans | 66 | 71 | 71 | 60 | 68 |
| Orman | 76 | 78 | 78 | 73 | 70 |
| Orman Gece | 76 | 78 | 78 | 73 | 70 |
| Mağara | 85 | 83 | 83 | 80 | 80 |
| Koridor | 79 | 82 | 82 | 80 | 76 |
| Merdiven | 56 | **54** | 71 | 59 | 83 |
| Hazine | 58 | 58 | 58 | 55 | **51** |
| Kale | 80 | 83 | 83 | 83 | 82 |
| Kale Gece | 80 | 83 | 83 | 83 | 82 |
| Taverna ortada | 75 | 77 | 77 | 73 | 80 |
| Taverna uzakta | 81 | 82 | 82 | 79 | 79 |
| Taverna 8 masum | 66 | 61 | 61 | 59 | 57 |

### 3. seviye

| Senaryo | Standart B1 | Standart, parti tamam | Standart son | Barbarian B1 | Barbarian son |
|---|---:|---:|---:|---:|---:|
| Düz | 84 | **89** | 61 | **97** | **92** |
| Çöl | 62 | 65 | 65 | **54** | **50** |
| Volkan | 68 | 74 | 74 | 79 | 82 |
| Volkan Young | 80 | **85** | 69 | **85** | 70 |
| Volkan Adult | **59** | 61 | 61 | 75 | **81** |
| Volkan Ancient | **59** | 61 | 61 | 75 | **81** |
| Volkan Wyrmling | 79 | **82** | 69 | **87** | **83** |
| Volkan şans | 77 | 76 | 76 | 76 | 74 |
| Orman | 65 | 55 | 55 | 60 | 59 |
| Orman Gece | 65 | 55 | 55 | 60 | 59 |
| Mağara | 76 | 68 | 68 | 59 | 57 |
| Koridor | 79 | 75 | 75 | 63 | 59 |
| Merdiven | 75 | 79 | 79 | 73 | 74 |
| Hazine | 60 | 64 | 64 | **35** | **37** |
| Kale | 72 | 72 | 72 | **52** | 57 |
| Kale Gece | 72 | 72 | 72 | **52** | 57 |
| Taverna ortada | 65 | 68 | 68 | 57 | 63 |
| Taverna uzakta | 75 | 78 | 78 | 61 | 64 |
| Taverna 8 masum | 72 | 71 | 71 | **48** | **51** |

### 5. seviye

| Senaryo | Standart B1 | Standart, parti tamam | Standart son | Barbarian B1 | Barbarian son |
|---|---:|---:|---:|---:|---:|
| Düz | 63 | 68 | 68 | 81 | **94** |
| Çöl | 71 | 75 | 75 | 59 | 64 |
| Volkan | 69 | 83 | 83 | 79 | **93** |
| Volkan Young | 69 | **56** | 75 | 62 | 75 |
| Volkan Adult | 75 | 76 | 76 | 62 | 75 |
| Volkan Ancient | 75 | 75 | 75 | 62 | 72 |
| Volkan Wyrmling | 75 | **59** | 76 | 74 | **83** |
| Volkan şans | 67 | 74 | 74 | 64 | 73 |
| Orman | 68 | 77 | 77 | 67 | 81 |
| Orman Gece | 68 | 77 | 77 | 67 | 81 |
| Mağara | 77 | 77 | 77 | 68 | 81 |
| Koridor | 80 | 79 | 79 | 56 | 60 |
| Merdiven | 84 | **87** | 78 | **89** | 72 |
| Hazine | 80 | **90** | 84 | 69 | 73 |
| Kale | 77 | **88** | 79 | 66 | 70 |
| Kale Gece | 77 | **88** | 79 | 66 | 70 |
| Taverna ortada | 76 | 85 | 85 | 65 | **86** |
| Taverna uzakta | 80 | **87** | 77 | 74 | 78 |
| Taverna 8 masum | 79 | **89** | 85 | 72 | 80 |

### Düşman listesi düzeltmeleri

| Senaryo | Seviye | Eski | Yeni | Denemeler (standart) |
|---|---:|---|---|---|
| Merdiven | 1 | Skeleton 3, Giant Rat 2, Goblin Warrior 2 | Goblin Warrior 1 | 54 → **71** |
| Çöl | 1 | Gnoll Warrior 3, Giant Wolf Spider 2, Scout 1 | + Giant Lizard 1 | 86 → **77** |
| Volkan Adult / Ancient | 1 | Magmin 3, Magma Mephit 1, Kobold Warrior 3 | Magma Mephit 2 | 83 → **70** |
| Düz | 3 | Ogre 1, Gnoll Warrior 3, Worg 1, Wolf 2 | Gnoll Warrior 4 | 89 → **61** |
| Volkan Young | 3 | Hell Hound 1, Magmin 2, Imp 1, Kobold Warrior 2 | Imp 2 | 85 → **69** |
| Volkan Wyrmling | 3 | Hell Hound 2, Magmin 2 | + Kobold Warrior 2 | 82 → **69** |
| Volkan Young | 5 | Wyvern 1, Harpy 2 | Harpy 1 | 56 → **75** |
| Volkan Wyrmling | 5 | Wyvern 1, Hell Hound 2 | Hell Hound 1, Magmin 2 | 59 → **76** |
| Merdiven | 5 | Ghoul 1, Ghast 3, Bugbear Warrior 3, Skeleton 4, Bugbear Stalker 1 | Ghoul 1, Ghast 4, **Wight 3**, Skeleton 2, Bugbear Stalker 2 | 87 → 89 (Ghoul 2) → 91 (Ghast 4, Stalker 2) → **78** (3. deneme) |
| Hazine | 5 | Ghast 2 | Ghast 3 | 90 → **84** |
| Kale / Gece | 5 | Berserker 2 | Berserker 3 | 88 → **79** |
| Taverna uzakta | 5 | Tough Boss 2, Knight 2, Bandit Captain 2, Tough 1, Spy 2 | Tough Boss 2, Knight 3, Bandit Captain 3, Spy 1 | 87 → 89 → **77** |
| Taverna 8 masum | 5 | aynı | Tough Boss 2, Knight 2, Bandit Captain 3, Spy 2 | 89 → **85** |

- Haritada düşman yeri sınırlı: Taverna 9, Merdiven ve Hazine 12. Bu yüzden sayı artırmak yerine canavarlar değiştirildi.
- Merdiven 5. seviyede yakın dövüşçü eklemek işe yaramadı (%89, %91): merdivende parti yukarıdan ateş ediyor. Yaylı Wight'lar dengeyi getirdi.
- Ejderha senaryoları 5. seviyede zorlaştı (Young %56). Parti güçlenince savaş uzuyor ve ejderha daha sık uyanıyor; eşlik edenler azaltıldı.

### Aralık dışı kalanlar

- **Standart parti:** yok. 57 ölçümün hepsi aralıkta; sınıra yakınlar: Orman 3. seviye %55, Taverna 5. seviye %85.
- **Barbarian partisi** (şişirilmedi):
  - Zayıf: 1. seviye Hazine %51; 3. seviye Çöl %50, Hazine %37, Taverna 8 masum %51.
  - Güçlü: Düz %92–94; 5. seviye Volkan %93, Taverna ortada %86, Wyrmling %83; 3. seviye Adult/Ancient %81, Wyrmling %83.
  - Nedenleri:
    - Grum'un AC'si 14, Bor'un 19 (Defense, zincir zırh, kalkan). Grum hedef alınıp erken düşüyor.
    - Reckless Attack düşmana da avantaj veriyor; yapay zekâ bunu HP yarının üstündeyken her turda açıyor.
    - Action Surge ve Second Wind yok.
    - Hazine ve Çöl'de düşman sayısı ve çok saldırı yüksek; Taverna'da masumlar dağınık.
    - Düz ve Volkan'da (geniş, aynı yükseklik) Cleave ve Frenzy her turda çalıştığı için Barbarian standarttan güçlü.

## Görev B1: seviyeli senaryolar ve gerçek 1/3/5. seviye partiler (23.10)

200 tohum. Komut: `npm run sim -- 200 --seviye 1|3|5 --parti standart|barbar`. Senaryolar paralel koşar (4 süreç, seviye başına ~10 dk); tablo `sim-sonuc/` altına da yazılır. Hedef: standart partide %55–85, ejderha senaryolarında %60–80. Aralık dışı değerler kalın.

**Partiler** (`data/sim-partiler.json`):
- 1. ve 3. seviye büyü listeleri SRD tablosundaki sayı kadar dolu:
  - Mira: 3 cantrip; 4 / 6 hazır büyü (Burning Hands, Thunderwave, Shocking Grasp eklendi).
  - Tavi: 3 cantrip; 4 / 6 hazır büyü (Inflict Wounds, Hold Person…).
  - Kael: 2 / 3 hazır büyü (Hunter's Mark, Entangle).
- Skorlar 1–3. seviyede 5. seviyeyle aynı. İlk ASI 4. seviyede ve 5. seviye partisinde o yuva boş.
- Donanım SRD başlangıç altınıyla alınabilir: Bor 155 GP seçeneği, Tavi 110, Sela 100, Kael 150; Grum A seçeneği.
- **5. seviye sonuçları birebir aynı** (iki parti, 19 senaryo; Görev P1 tablosu). Bu yüzden 5. seviye partisinin eksikleri bilerek bırakıldı: Mira 2 cantrip, 4. seviye yuvaları boş, alt sınıf yok.
- Eski iskelet partiyle fark büyük: 1. seviyede alan büyüleri (Burning Hands, Thunderwave, Sleep) eski listeleri çok kolaylaştırdı (eski Koridor listesi %52 → %95, Hazine %98).

**Düşman listeleri** (`data/sim-senaryolar.json` `enemies.<seviye>`):
- Hepsi haritanın ortam listesinden (`data/monster-ortamlari.json`); test bunu denetler.
- XP bütçesi önceki görevlerdeki yöntemle: 5 kişilik parti için seviye başına "orta–zor" bütçe. 1. seviye ~250–600 XP, 3. seviye ~650–2600 XP; ejderha XP'si ayrıca sayılır.
- Liste başlangıç bölgesine sığmalı (Mağara'da en çok 8 düşman). Test her seviyeyi kurar.
- Eski 4 seviyeli listenin ortam dışı canavarları (Düz'deki Goblin ve Bugbear) değiştirildi.

| Senaryo | 1. seviye | 3. seviye |
|---|---|---|
| Düz | Gnoll Warrior 2, Worg 1, Wolf 2 | Ogre 1, Gnoll Warrior 3, Worg 1, Wolf 2 |
| Çöl | Gnoll Warrior 3, Giant Wolf Spider 2, Scout 1 | Death Dog 2, Gnoll Warrior 4, Giant Hyena 2, Scout 2 |
| Volkan | Magmin 2, Magma Mephit 2, Kobold Warrior 2, Steam Mephit 1 | Hell Hound 1, Magmin 2, Imp 1, Magma Mephit 2 |
| Volkan — Young | Magma Mephit 2, Kobold Warrior 3 | Hell Hound 1, Magmin 2, Imp 1, Kobold Warrior 2 |
| Volkan — Adult / Ancient | Magmin 3, Magma Mephit 1, Kobold Warrior 3 | Hell Hound 2, Magmin 2, Kobold Warrior 2 |
| Volkan — Wyrmling | Magmin 2, Magma Mephit 2, Kobold Warrior 3 | Hell Hound 2, Magmin 2 |
| Volkan — Young, şans | Kobold Warrior 3, Magma Mephit 2 | Hell Hound 1, Imp 1, Magmin 1 |
| Orman / Gece | Wolf 4, Goblin Warrior 4, Giant Spider 1 | Owlbear 1, Dire Wolf 3, Giant Spider 2, Wolf 2 |
| Mağara | Goblin Warrior 4, Grimlock 2, Darkmantle 2 | Ghoul 2, Giant Spider 2, Ettercap 1, Bugbear Warrior 2, Darkmantle 1 |
| Koridor | Skeleton 4, Zombie 2, Giant Rat 3 | Ghoul 2, Ghast 3, Skeleton 4 |
| Merdiven | Skeleton 3, Giant Rat 2, Goblin Warrior 2 | Ghoul 2, Ghast 2, Bugbear Warrior 1, Skeleton 3 |
| Hazine | Skeleton 4, Zombie 3, Ghoul 1, Giant Rat 2 | Ghoul 2, Ghast 3, Skeleton 3, Wight 1 |
| Kale / Gece | Goblin Warrior 4, Guard 2 | Hobgoblin Warrior 3, Goblin Warrior 3, Bugbear Warrior 1 |
| Taverna — ortada | Bandit 4, Tough 2, Cultist 3 | Tough 3, Bandit Captain 2, Spy 1, Bandit 2 |
| Taverna — uzakta | Bandit 4, Tough 2 | Tough 2, Bandit Captain 2, Spy 1, Bandit 2 |
| Taverna — 8 masum | Bandit 4, Tough 3 | Tough 2, Bandit Captain 2, Spy 2, Bandit 2 |

### 1. seviye

| Senaryo | XP | Standart | Barbarian |
|---|---:|---:|---:|
| Düz — haritasız | 400 | 76% | **93%** |
| Çöl — Gündüz | 500 | 84% | **86%** |
| Volkan | 500 | 78% | 77% |
| Volkan — Young (uyuyan) | 6175 (ejderha dahil) | 76% | 79% |
| Volkan — Adult (uyuyan) | 18475 | 77% | 73% |
| Volkan — Ancient (uyuyan) | 62475 | 77% | 73% |
| Volkan — Wyrmling (uyuyan) | 1575 | 71% | 71% |
| Volkan — Young, şans | 6175 | 66% | 60% |
| Orman | 600 | 76% | 73% |
| Orman — Gece | 600 | 76% | 73% |
| Mağara — karanlık | 500 | 85% | 80% |
| Dungeon — Koridor | 375 | 79% | 80% |
| Dungeon — Merdiven | 300 | 56% | 59% |
| Dungeon — Hazine | 600 | 58% | 55% |
| Kale — Gündüz | 250 | 80% | 83% |
| Kale — Gece | 250 | 80% | 83% |
| Taverna — 4 ortada | 375 | 75% | 73% |
| Taverna — 4 uzakta | 300 | 81% | 79% |
| Taverna — 8 uzakta | 400 | 66% | 59% |

### 3. seviye

| Senaryo | XP | Standart | Barbarian |
|---|---:|---:|---:|
| Düz — haritasız | 950 | 84% | **97%** |
| Çöl — Gündüz | 1400 | 62% | **54%** |
| Volkan | 1300 | 68% | 79% |
| Volkan — Young (uyuyan) | 7050 | 80% | **85%** |
| Volkan — Adult (uyuyan) | 19650 | **59%** | 75% |
| Volkan — Ancient (uyuyan) | 63650 | **59%** | 75% |
| Volkan — Wyrmling (uyuyan) | 2700 | 79% | **87%** |
| Volkan — Young, şans | 6900 | 77% | 76% |
| Orman | 1800 | 65% | 60% |
| Orman — Gece | 1800 | 65% | 60% |
| Mağara — karanlık | 1750 | 76% | 59% |
| Dungeon — Koridor | 1950 | 79% | 63% |
| Dungeon — Merdiven | 1650 | 75% | 73% |
| Dungeon — Hazine | 2600 | 60% | **35%** |
| Kale — Gündüz | 650 | 72% | **52%** |
| Kale — Gece | 650 | 72% | **52%** |
| Taverna — 4 ortada | 1450 | 65% | 57% |
| Taverna — 4 uzakta | 1350 | 75% | 61% |
| Taverna — 8 uzakta | 1550 | 72% | **48%** |

### 5. seviye (değişmedi)

| Senaryo | XP | Standart | Barbarian |
|---|---:|---:|---:|
| Düz — haritasız | 2150 | 63% | 81% |
| Çöl — Gündüz | 5200 | 71% | 59% |
| Volkan | 4100 | 69% | 79% |
| Volkan — Young (uyuyan) | 8600 | 69% | 62% |
| Volkan — Adult (uyuyan) | 20300 | 75% | 62% |
| Volkan — Ancient (uyuyan) | 64300 | 75% | 62% |
| Volkan — Wyrmling (uyuyan) | 4800 | 75% | 74% |
| Volkan — Young, şans | 8400 | 67% | 64% |
| Orman | 5200 | 68% | 67% |
| Orman — Gece | 5200 | 68% | 67% |
| Mağara — karanlık | 3450 | 77% | 68% |
| Dungeon — Koridor | 7050 | 80% | 56% |
| Dungeon — Merdiven | 3050 | 84% | **89%** |
| Dungeon — Hazine | 6200 | 80% | 69% |
| Kale — Gündüz | 4650 | 77% | 66% |
| Kale — Gece | 4650 | 77% | 66% |
| Taverna — 4 ortada | 6000 | 76% | 65% |
| Taverna — 4 uzakta | 5000 | 80% | 74% |
| Taverna — 8 uzakta | 5000 | 79% | 72% |

### Denemeler

| Senaryo | Seviye | Denemeler (XP → standart) |
|---|---:|---|
| Düz | 1 | 300 → 98%; 600 → 10%; **400 → 76%** |
| Çöl | 1 | 400 → 98%; 700 → 47%; **500 → 84%** |
| Volkan | 1 | 400 → 95%; 650 → 45%; **500 → 78%** |
| Volkan — Young | 1 | 4 kobold+mephit → 82%; **+1 mephit → 76%** |
| Volkan — Adult / Ancient | 1 | 92%; 92%; **77%** |
| Volkan — Wyrmling | 1 | 94%; 84%; **71%** |
| Volkan — şans | 1 | 82%; 86%; **66%** |
| Mağara | 1 | 400 → 88%; 550 → 92%; **500 (8 düşman) → 85%** |
| Koridor | 1 | 325 → 95%; 450 → 52%; **375 → 79%** |
| Hazine | 1 | 300 → 98%; 500 → 92%; **600 → 58%** |
| Taverna — ortada | 1 | 300 → 98%; 450 → 52%; **375 → 75%** |
| Taverna — 8 masum | 1 | 300 → 94%; **400 → 66%** |
| Düz | 3 | 1150 → 34%; **950 → 84%** |
| Çöl | 3 | 1200 → 86%; **1400 → 62%** |
| Volkan — Young | 3 | 6350 → 100%; **7050 → 80%** |
| Volkan — Adult / Ancient | 3 | 100%; 91%; **59%** (deneme bitti) |
| Volkan — Wyrmling | 3 | 98%; **79%** |
| Volkan — şans | 3 | 96%; **77%** |
| Mağara | 3 | 1000 → 97%; 1400 → 93%; **1750 → 76%** |
| Koridor | 3 | 1700 → 86%; **1950 → 79%** |
| Merdiven | 3 | 1200 → 90%; **1650 → 75%** |
| Hazine | 3 | 1450 → 97%; 2150 → 89%; **2600 → 60%** |
| Taverna — ortada | 3 | 1000 → 95%; **1450 → 65%** |
| Taverna — uzakta | 3 | 1100 → 91%; 1550 → 54%; **1350 → 75%** |
| Taverna — 8 masum | 3 | 1100 → 95%; **1550 → 72%** |

### Aralık dışı kalanlar

- **Standart, 3. seviye, Adult ve Ancient Red (%59, hedef %60–80):** 3 deneme bitti. 2. denemede %91, 3. denemede eşlik eden Hell Hound 1 → 2 ile %59 oldu; arada uygun canavar adımı yok. Ejderha uyanınca parti hep kaybediyor. Kazanma oranı eşlik edenlerin ne kadar sürede öldüğüne bağlı (uyanma %9 → %25).
- 1. seviye çok hassas: 100–200 XP fark %98'den %10'a indirebiliyor (Düz 300 → 600). Bir Ogre ya da Bugbear kadar fark sonucu belirliyor; listeler bu yüzden sınırlara yakın (Merdiven 56, Hazine 58).

### Barbarian partisi (not; parti şişirilmedi)

- 1. seviyede standarda yakın (ortalama ~1 puan düşük). Düz %93: haritasızda Cleave ve Reckless hep çalışıyor (5. seviyede de %81).
- 3. seviyede ortalama ~6 puan düşük. Aralık dışı:
  - Hazine %35, Taverna 8 masum %48, Kale %52, Çöl %54.
  - Ejderha senaryoları: Wyrmling %87, Young %85.
  - Düz %97.
- Nedenleri:
  - Grum'un AC'si 14, Bor'un 19.
  - Reckless Attack düşmana da avantaj veriyor.
  - ~~Grum'da alt sınıf seçili değil, Frenzy çalışmıyor~~ (yanlış; Görev B2: motor varsayılan alt sınıfı kullanıyor, Frenzy çalışıyordu).
- 5. seviyedeki sapmalar sürüyor: Koridor %56, Çöl %59, Merdiven %89.

## Görev P1: yan el, Nick, Two-Weapon Fighting, Versatile (23.10)

200 tohum, 5. seviye. "Önce" Görev P-Barbarian sonu. Yan el partisi (`--parti yanel`): Sela, Rapier yerine Shortsword (Vex) ile yan elde Dagger (Nick) kullanır; diğer üyeler standart.

| Senaryo | Standart önce | Standart sonra | Barbarian önce | Barbarian sonra | Yan el partisi |
|---|---:|---:|---:|---:|---:|
| Düz — haritasız | 63% | 63% | 81% | 81% | 64% |
| Çöl — Gündüz | 71% | 71% | 59% | 59% | 68% |
| Volkan | 69% | 69% | 79% | 79% | 66% |
| Volkan — Young | 69% | 69% | 62% | 62% | 68% |
| Volkan — Adult | 75% | 75% | 62% | 62% | 74% |
| Volkan — Ancient | 75% | 75% | 62% | 62% | 73% |
| Volkan — Wyrmling | 75% | 75% | 74% | 74% | 75% |
| Volkan — Young, şans | 67% | 67% | 64% | 64% | 64% |
| Orman | 68% | 68% | 67% | 67% | 67% |
| Orman — Gece | 68% | 68% | 67% | 67% | 67% |
| Mağara | 77% | 77% | 68% | 68% | 74% |
| Dungeon — Koridor | 79% | 80% | 56% | 56% | 82% |
| Dungeon — Merdiven | 84% | 84% | 89% | 89% | 83% |
| Dungeon — Hazine | 80% | 80% | 69% | 69% | 80% |
| Kale — Gündüz | 77% | 77% | 66% | 66% | 73% |
| Kale — Gece | 77% | 77% | 66% | 66% | 73% |
| Taverna — 4 ortada | 76% | 76% | 65% | 65% | 72% |
| Taverna — 4 uzakta | 80% | 80% | 74% | 74% | 79% |
| Taverna — 8 uzakta | 79% | 79% | 72% | 72% | 78% |

- **Standart ve Barbarian partisi değişmedi** (Koridor +1 puan, gürültü düzeyinde). Partilerde yan el silahı yok. Versatile yalnızca Mira'nın Quarterstaff'ını etkiliyor (1d8); Mira yakın dövüşe nadiren giriyor. Bor ve Tavi kalkanlı.
- **Aralık dışı senaryo yok.** Merdiven standart partide 84, sınırın içinde; düşman listesi değişmedi. Barbarian'ın Koridor (56) ve Merdiven (89) sapmaları P-Barbarian'dan kalıyor.
- **Yan el partisi standarda yakın** (−6…+3 puan). Rapier'in 1d8'i yerine 1d6 + 1d4 (yan elde değiştiricisiz) geliyor. Sela çoğu turda yay kullandığı için fark küçük.
- **Yapay zekâ yan el saldırısını kullanıyor.** 15 savaşlık örnekte (Düz, Kale, Orman) Nick ile 29 ek saldırı yapıldı. Yaylar yan eli engellemiyor (bkz. DECISIONS).

## Görev P-Barbarian: Barbarian 1–5 ve Barbarian partisi (23.10)

200 savaş × senaryo, tohum 1–200.
- **Standart parti:** Bor (Fighter), Mira, Tavi, Sela, Kael.
- **Barbarian partisi:** Bor yerine Grum.
  - Orc Barbarian, Path of the Berserker. STR 17, DEX 14, CON 14; zırhsız, AC 14 (Unarmored Defense).
  - Greataxe (Cleave) ve Handaxe (Vex). Komut: `npm run sim -- 200 --parti barbar`.
- Motor değişikliği standart partinin sonucunu değiştirmedi: düşman listeleri değişmeden önceki ölçüm Görev P0 tablosuyla birebir aynı.
- **Yapay zekâ:**
  - Rage: yaralıysa ya da 10 ft içinde düşman varsa; uzatma, eylemi bittiyse ve Rage o tur uzamadıysa.
  - Reckless Attack: HP yarıdan fazlaysa ve en iyi seçenek STR ile silah saldırısıysa.

### 5. seviye (19 senaryo)

Düşman listesi düzeltmeleri; canavar verisi ve oyuncu gücü değişmedi, canavarlar ortam listesinden:

| Senaryo | Eski | Yeni | Deneme |
|---|---|---|---|
| Volkan | Hell Hound 2, Imp 2 | Hell Hound 2, Imp **3** | 2 (1.: Hell Hound 3 → standart %34) |
| Dungeon — Merdiven | Ghoul 2, Ghast 2, Skeleton 4 | Ghoul **1**, Ghast **3**, Skeleton 4 | 2 (1.: Ghast 3, Skeleton 3 → %88 / %89) |
| Düz — haritasız | Ogre 1 | Ogre **2** | 1 |
| Volkan — Adult / Ancient | Wyvern 1, Harpy 2 | Wyvern 1 (Harpy yok) | 1 |

| Senaryo | Standart (önce → sonra) | Barbarian partisi |
|---|---:|---:|
| Düz — haritasız | 77% → **63%** | **81%** |
| Çöl — Gündüz | 71% | 59% |
| Volkan | 84% → **69%** | **79%** |
| Volkan — Young Red | 69% | 62% |
| Volkan — Adult Red | 67% → **75%** | **62%** |
| Volkan — Ancient Red | 66% → **75%** | **62%** |
| Volkan — Wyrmling | 75% | 74% |
| Volkan — Young Red, şans | 67% | 64% |
| Orman / Orman — Gece | 68% | 67% |
| Mağara — karanlık | 77% | 68% |
| Dungeon — Koridor | 79% | 56% |
| Dungeon — Merdiven | 84% → **84%** | **89%** |
| Dungeon — Hazine | 80% | 69% |
| Kale / Kale — Gece | 77% | 66% |
| Taverna — ortada | 76% | 65% |
| Taverna — uzakta | 80% | 74% |
| Taverna — 8 masum | 79% | 72% |

- Barbarian partisi standart partiden ortalama ~7 puan zayıf. Grum'un AC'si 14, Bor'un 19 (Defense, zincir zırh, kalkan); Action Surge ve Second Wind yok. Reckless Attack düşmanlara da avantaj veriyor.
  - Koridor'da 100 tohumluk deney: Reckless kapalı %53, AC 14 %49 (AC 13 iken %46). İkisi de tek başına küçük.
- **Kabul edilen sapma:** Merdiven Barbarian partisinde %89 (iki deneme bitti; standart partide %84).
- Düz (haritasız) Barbarian partisine çok uygun: aynı yükseklikteki herkes erişimde, Cleave ve Reckless hep çalışıyor.

### 1. ve 3. seviye (yeni `byLevel` listeleri)

5. seviye listeleri 1. ve 3. seviye partisine uygun değil (1. seviyede %0). Dört temsilî senaryoya seviyeye göre liste eklendi; XP bütçesi 1. seviyede ~250–450, 3. seviyede ~650–1700.
- Kalan 15 senaryonun 1. ve 3. seviye listesi yok.
- **Önemli:** 1. ve 3. seviyede parti iskelettir. Skorlar, donanım ve büyüler 5. seviye partisiyle aynı; yalnızca seviyeye bağlı özellikler ve büyüler kesiliyor.

| Senaryo | Seviye | XP (1. deneme → 2.) | Standart (1. → 2.) | Barbarian (1. → 2.) |
|---|---:|---:|---:|---:|
| Düz — haritasız | 1 | 300 | 73% | 81% → 87% |
| Orman | 1 | 300 → 450 | 100% → **91%** | 100% → **96%** |
| Dungeon — Koridor | 1 | 325 → 450 | 92% → **52%** | 92% → **41%** |
| Kale — Gündüz | 1 | 400 → 250 | 19% → 80% | 13% → 82% |
| Düz — haritasız | 3 | 800 → 1500 | 100% → 72% | 100% → **94%** |
| Orman | 3 | 750 → 1400 | 100% → **95%** | 100% → **98%** |
| Dungeon — Koridor | 3 | 800 → 1700 | 100% → 85% | 99% → 70% |
| Kale — Gündüz | 3 | 1000 → 650 | 41% → 72% | 23% → 52% |

- 1. seviye Düz'de Barbarian partisinin 1. ve 2. sonucu farklı. Aynı liste, ama Grum'un dizilimi AC 13'ten 14'e çıktı.
- **Kabul edilen sapmalar** (iki deneme bitti):
  - 1. seviye: Orman çok kolay (%91 / %96), Koridor çok zor (%52 / %41).
  - 3. seviye: Orman çok kolay (%95 / %98), Barbarian partisinde Düz %94 ve Kale %52.
- Öneri: 1. ve 3. seviye için bütün senaryolarda gerçek seviye partisi (seviyeye uygun skor ve donanım) ve liste tasarımı ayrı bir iş olmalı.

## Görev P0: Weapon Mastery, Fighting Style, düşman listesi düzeltmeleri (22.10)

200 savaş × 19 senaryo, tohum 1–200.
- **Önce:** Görev N sonu.
- **Ara:** parti mastery ve Fighting Style aldı, düşman listeleri aynı.
- **Sonra:** düzeltilen düşman listeleriyle.

**Parti değişikliği:**
- Bor: Defense (+1 AC → 19); mastery Longsword (Sap), Light crossbow (Slow) ve iki taşımadığı silah.
- Kael: Archery; mastery Longbow (Slow), Shortsword (Vex).
- Sela: mastery Rapier (Vex), Shortbow (Vex).
- Mira ve Tavi'nin mastery hakkı yok.
- Motor değişikliği masterysiz partide davranışı değiştirmedi: 30 tohumluk zar dizisi parmak izi 19 senaryoda birebir aynı.

**Düşman listesi düzeltmeleri** (canavar verisi değişmedi; yalnızca haritanın ortam listesinden canavarlar; senaryo başına en çok 2 deneme):

| Senaryo | Eski liste | Yeni liste | Deneme |
|---|---|---|---|
| Dungeon — Koridor | Wight 2, Ghast 2, … | Wight **3**, Ghast **3** (diğerleri aynı) | 1 |
| Dungeon — Hazine | Wight 2, Ghast 1, Ghoul 2, … | Wight **3**, Ghast **2**, Ghoul **0** | 2 (1.: 13 düşman başlangıç bölgesine sığmadı) |
| Volkan — Wyrmling | Wyvern 1, Hell Hound 1 | Hell Hound **2** | 1 |
| Taverna — 4 masum ortada | Tough Boss 2, Tough 1, … | Tough Boss **3**, Tough **0** | 2 (1.: Tough +1 bölgeye sığmadı) |

Taverna'da aynı değişiklik "uzakta" senaryolarına da denendi: %51'e düştüler. Bu yüzden yalnızca "ortada" senaryosunda kaldı. **Kabul edilen sapma:** üç Taverna senaryosu artık birebir aynı düşmanlarla karşılaştırılamıyor.

| Senaryo | XP (önce → sonra) | Parti kazandı (önce → ara → sonra) | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Kurtarılan masum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 1700 | 72% → 77% → **77%** | 1% | 5.9 | 0.28 | 19% | 1.17 | – |
| Çöl — Gündüz | 5200 | 57% → 71% → **71%** | 0% | 7.7 | 0.39 | 27% | 1.42 | – |
| Volkan | 3900 | 72% → 84% → **84%** | 3% | 9.6 | 0.78 | 53% | 0.86 | – |
| Volkan — uyuyan Young Red Dragon | 8600 | 68% → 69% → **69%** | 0% | 5.9 | 1.17 | 78% | 1.14 | – |
| Volkan — uyuyan Adult Red Dragon | 20700 | 66% → 67% → **67%** | 0% | 5.7 | 1.17 | 79% | 1.22 | – |
| Volkan — uyuyan Ancient Red Dragon | 64700 | 66% → 66% → **66%** | 0% | 5.4 | 1.47 | 81% | 0.93 | – |
| Volkan — uyuyan Red Dragon Wyrmling | 4100 → 4800 | 88% → 93% → **75%** | 0% | 6.7 | 1.08 | 77% | 1.33 | – |
| Volkan — uyuyan Young Red, dragonWake: chance | 8400 | 66% → 67% → **67%** | 0% | 5.6 | 1.02 | 68% | 1.25 | – |
| Orman | 5200 | 61% → 68% → **68%** | 1% | 5.9 | 0.24 | 20% | 1.57 | – |
| Orman — Gece | 5200 | 61% → 68% → **68%** | 1% | 5.9 | 0.24 | 20% | 1.57 | – |
| Mağara — karanlık | 3450 | 64% → 77% → **77%** | 13% | 9.8 | 0.31 | 24% | 0.93 | – |
| Dungeon — Koridor (meşale) | 5900 → 7050 | 86% → 89% → **79%** | 1% | 6.8 | 0.36 | 30% | 1.18 | – |
| Dungeon — Merdiven | 2800 | 86% → 84% → **84%** | 14% | 6.9 | 0.09 | 6% | 0.27 | – |
| Dungeon — Hazine odası | 5450 → 6200 | 85% → 87% → **80%** | 0% | 6.6 | 0.39 | 28% | 1.15 | – |
| Kale — Gündüz | 4650 | 64% → 77% → **77%** | 5% | 10.4 | 0.49 | 33% | 1.05 | – |
| Kale — Gece | 4650 | 64% → 77% → **77%** | 5% | 10.4 | 0.49 | 33% | 1.05 | – |
| Taverna — 4 masum ortada | 5000 → 6000 | 84% → 89% → **76%** | 1% | 9.4 | 0.75 | 49% | 1.47 | 0.00/4 |
| Taverna — 4 masum düşmandan uzakta | 5000 | 66% → 80% → **80%** | 2% | 8.9 | 0.69 | 45% | 1.29 | 3.51/4 |
| Taverna — 8 masum düşmandan uzakta | 5000 | 62% → 79% → **79%** | 3% | 9.4 | 0.69 | 45% | 1.33 | 5.29/8 |

- Mastery ve Fighting Style partiyi belirgin güçlendirdi: ortalama +7 puan; en çok Çöl (+14), Mağara (+13), Kale (+13), Taverna uzakta (+14/+17). Ejderha senaryoları neredeyse değişmedi: ejderha nefesi ve yüksek AC'de Sap/Vex/Slow'un etkisi az.
- Bütün senaryolar hedef aralıkta (%55–85). Volkan %84 ve Merdiven %84 üst sınıra yakın; bir sonraki parti güçlendirmesinde ilk bunlar aşar.

## Görev N: büyü verisi SRD 5.2.1'e eşitlendi, seviye altyapısı (22.10)

200 savaş × 19 senaryo, tohum 1–200. "Önce": Görev N öncesi (fab08f0). "Sonra": Görev N.

**Neden değişti:** Yalnızca büyü verisinin SRD 5.2.1 düzeltmeleri.
- Partinin kullandıkları: Cure Wounds 1d8 → 2d8 (Tavi, Kael), Healing Word 1d4 → 2d4 (Tavi), Sleep (Mira) 5d8 HP havuzu → WIS save ve Incapacitated (her tur sonu save).
- Altyapı değişiklikleri (özellik motoru, kaynak modeli, alt sınıf, ASI/feat, dinlenme, `--seviye`) çıktıyı değiştirmedi. Doğrulama: büyü düzeltmesinden sonra alınan ara ölçümle, Görev N sonundaki ölçüm 19 senaryonun hepsinde satır satır aynı. Ayrıca 30 tohumluk parmak izi (komut dizisi, zar dizisi, son HP'ler) her adımda birebir aynı.

| Senaryo | XP | Parti kazandı (önce → sonra) | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Kurtarılan masum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 1700 | 66% → **72%** | 0% → 1% | 5.6 → 5.8 | 0.28 → 0.26 | 22% → 18% | 1.70 → 1.44 | – |
| Çöl — Gündüz | 5200 | 57% → **57%** | 1% | 7.7 → 7.8 | 0.45 → 0.50 | 34% | 2.04 → 1.93 | – |
| Volkan | 3900 | 64% → **72%** | 9% → 7% | 11.0 → 10.6 | 0.98 → 0.91 | 58% → 55% | 1.36 → 1.14 | – |
| Volkan — uyuyan Young Red Dragon | 8600 | 70% → **68%** | 0% | 5.8 | 1.06 → 1.11 | 73% | 1.25 | – |
| Volkan — uyuyan Adult Red Dragon | 20700 | 67% → **66%** | 0% | 5.8 | 1.15 → 1.18 | 77% → 75% | 1.26 | – |
| Volkan — uyuyan Ancient Red Dragon | 64700 | 67% → **66%** | 0% | 5.5 | 1.42 → 1.44 | 78% | 0.99 → 1.00 | – |
| Volkan — uyuyan Red Dragon Wyrmling | 4100 | 88% → **88%** | 0% | 5.9 → 5.7 | 0.81 → 0.83 | 65% → 67% | 0.92 → 0.83 | – |
| Volkan — uyuyan Young Red, dragonWake: chance (varsayılan %2) | 8400 | 65% → **66%** | 1% | 5.5 | 1.01 → 0.97 | 68% → 66% | 1.33 → 1.32 | – |
| Orman | 5200 | 59% → **61%** | 0% | 5.7 → 5.8 | 0.23 → 0.18 | 19% → 15% | 2.08 → 2.06 | – |
| Orman — Gece | 5200 | 59% → **61%** | 0% | 5.7 → 5.8 | 0.23 → 0.18 | 19% → 15% | 2.08 → 2.06 | – |
| Mağara — karanlık | 3450 | 66% → **64%** | 12% → 16% | 10.1 → 10.3 | 0.57 → 0.58 | 39% | 1.50 → 1.32 | – |
| Dungeon — Koridor (meşale) | 5900 | 80% → **86%** | 0% | 6.2 → 6.1 | 0.36 → 0.25 | 28% → 21% | 1.23 → 1.07 | – |
| Dungeon — Merdiven | 2800 | 84% → **86%** | 13% → 12% | 6.8 → 6.6 | 0.08 → 0.07 | 7% → 6% | 0.34 → 0.28 | – |
| Dungeon — Hazine odası | 5450 | 84% → **85%** | 0% | 6.2 → 6.1 | 0.34 → 0.33 | 27% | 1.15 → 1.08 | – |
| Kale — Gündüz | 4650 | 61% → **64%** | 6% → 7% | 10.6 → 10.8 | 0.65 → 0.55 | 43% → 36% | 1.67 → 1.53 | – |
| Kale — Gece | 4650 | 61% → **64%** | 6% → 7% | 10.6 → 10.8 | 0.65 → 0.55 | 43% → 36% | 1.67 → 1.53 | – |
| Taverna — 4 masum ortada | 5000 | 82% → **84%** | 2% | 9.1 → 8.8 | 0.71 → 0.60 | 47% → 40% | 1.20 → 1.13 | 0.00/4 |
| Taverna — 4 masum düşmandan uzakta, varsayılan | 5000 | 60% → **66%** | 3% → 2% | 9.5 → 9.6 | 0.92 → 0.88 | 57% → 53% | 1.91 → 1.73 | 3.22/4 → 3.32/4 |
| Taverna — 8 masum düşmandan uzakta | 5000 | 61% → **62%** | 2% | 10.2 → 9.7 | 0.92 → 0.84 | 59% → 54% | 1.99 → 1.89 | 4.49/8 → 4.66/8 |

- Parti genelde biraz güçlendi (iyileştirme iki katına yakın). Ejderha senaryoları ve Mağara hafif düştü: Sleep artık yüksek HP'li düşmanı da etkileyebiliyor ama yalnızca Incapacitated veriyor ve her tur sonu kurtarma zarıyla bitiyor.
- Bütün senaryolar hedef aralıkta (%55–85; Dungeon Koridor %86 sınırda). Düşman listeleri değiştirilmedi.

## Eski ve yeni tablo

Eski: ilk ölçüm (29d06f0). Yeni: sınıf özellikleri (Sneak Attack, Action Surge, Second Wind, Hunter's Mark, konsantrasyon, kalıcı Spiritual Weapon ve Spirit Guardians, fırsat saldırısı) ve yeni masum kuralı ile.

**Taverna, yeni kazanma tanımı:** parti, düşmanlar yenilince kazanır. Masum ölümü sonucu etkilemez, yalnızca "kurtarılan masum" olarak sayılır. Eski taverna sayıları sıkı kuralla ölçüldü: masumların yarısı ölünce kaybediliyordu. Eski "parti arkasında" senaryosu artık varsayılan yerleşimdir: düşmandan en uzak.

| Senaryo | XP | Parti kazandı (eski → yeni) | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC | Ort. kurtarılan masum (yeni) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 4850 | 3% → **25%** | 0% → 4% | 6.4 → 8.6 | 0.49 → 0.60 | 40% → 43% | 4.42 → 3.48 | – |
| Çöl — Gündüz | 4400 | 43% → **61%** | 1% → 1% | 11.1 → 9.8 | 0.50 → 0.45 | 40% → 32% | 2.79 → 1.95 | – |
| Volkan | 4400 | 99% → **99%** | 0% → 0% | 6.6 → 5.6 | 0.07 → 0.09 | 6% → 7% | 0.32 → 0.36 | – |
| Orman | 4550 | 39% → **46%** | 2% → 1% | 10.2 → 8.9 | 0.68 → 0.61 | 49% → 47% | 2.67 → 2.60 | – |
| Mağara — karanlık | 3950 | 40% → **43%** | 6% → 8% | 12.9 → 11.9 | 0.80 → 0.78 | 51% → 51% | 2.53 → 2.44 | – |
| Kale — Gündüz | 3950 | 43% → **53%** | 5% → 4% | 11.3 → 10.3 | 0.67 → 0.69 | 43% → 47% | 2.33 → 1.89 | – |
| Taverna — 4 masum ortada | 2550 | 21% → **99%** | 0% → 0% | 2.3 → 5.5 | 0.04 → 0.15 | 4% → 12% | 0.10 → 0.44 | 0.72 / 4 |
| Taverna — 4 masum düşmandan uzakta, varsayılan | 2550 | 79% → **94%** | 1% → 0% | 7.1 → 6.5 | 0.22 → 0.42 | 18% → 28% | 0.89 → 0.88 | 3.68 / 4 |

- **Ort. düşmüş PC:** savaş sonunda 0 HP'de olup ölmemiş (ölmekte veya stabil) karakter.
- **Berabere:** 20 turda bitmedi.

## Güncel durum: yay kuralı düzeltildi + yapay zekâ yakın dövüşe yürüyor (16.10, f7dcd12)

8 senaryo × 200 tohum. Sütunlar sırayla: ilk ölçüm (29d06f0) → sınıf özellikleri → mağara ışığı ve itme (51aa65e) → ortamın yay kuralı düzeltildi (304de87) → parti yürüyerek daha iyi saldırıya ulaşıyorsa önce yürür (f7dcd12, **güncel**).

| Senaryo | XP | İlk | Sınıf öz. | Mağara+itme | Yay kuralı | **Güncel** | Berabere | Ort. ölen PC | En az 1 ölüm | Kurtarılan masum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz — haritasız | 4850 | 3% | 25% | 25% | 25% | **25%** | 4% | 0.60 | 43% | – |
| Çöl — Gündüz | 4400 | 43% | 61% | 61% | 35% | **46%** | 2% | 0.54 | 39% | – |
| Volkan | 4400 | 99% | 99% | 100% | 100% | **100%** (lavJump ile de 100%) | 0% | 0.05 | 5% | – |
| Orman | 4550 | 39% | 46% | 46% | 66% | **53%** | 5% | 0.54 | 41% | – |
| Mağara — karanlık | 3950 | 40% | 43% | 37% | 54% | **59%** | 5% | 0.64 | 39% | – |
| Kale — Gündüz | 3950 | 43% | 53% | 53% | 53% | **65%** | 2% | 0.54 | 38% | – |
| Taverna — 4 masum ortada | 2550 | 21%* | 99% | 99% | 99% | **99%** | 0% | 0.10 | 8% | 0.77 / 4 |
| Taverna — 4 masum düşmandan uzakta | 2550 | 79%* | 94% | 94% | 94% | **99%** | 0% | 0.13 | 11% | 3.97 / 4 |
| Taverna — 8 masum düşmandan uzakta | 2550 | – | – | – | – | **95%** | 0% | 0.24 | 19% | 6.29 / 8 |

\* Eski sıkı masum kuralıyla (masumların yarısı ölünce kayıp).

Masum sayısı artık GM ayarı (Taverna varsayılan 4, Şehir Meydanı 6, 0–12). 8 masumlu satır bu ayarla eklendi: kalabalık taverna masumları korumayı zorlaştırıyor (kurtarılan %79, 4 masumda %99), partiye etkisi küçük (95%).

**Yay kuralının etkisi:**
- **Çöl (61% → 35%):** Düşüşün nedeni kural değildi. Dezavantaj kalkınca savaşçı yakın dövüşe yürümeyi bırakıp arbaletle atmaya başladı; arbalet (1d8+1) kılıçtan (1d8+4) zayıf. Düşmanın menzilli saldırıları da güçlendi: Ogre'nin ciriti 2d6+4 ve goblin okları artık dezavantajsız.
- **Yapay zekâ düzeltmesi (f7dcd12):** Parti üyesi bu tur yürüyerek en az %25 daha iyi bir saldırıya güvenle ulaşabiliyorsa önce yürüyor. Çöl 46%'ya, Kale 65%'e, Taverna 99%'a çıktı.
- **Orman ve mağara:** Partinin okçuları artık dezavantajsız. Ormanda yakın dövüşe yürüme bir kısmını geri aldı (66% → 53%): ağaçlar arasında yakın dövüş, partiyi kalabalık düşman grubunun içine sokuyor.

**Sayı önerileri (güncel tabloya göre, uygulanmadı).** Hedef %60–80; canavar değerleri değişmesin, yalnızca senaryodaki düşman sayıları:

| Senaryo | Şu an | Öneri | Gerekçe |
|---|---:|---|---|
| Düz | 25% | Hill Giant çıkar (4850 → 3050 XP) | Haritasızda siper ve menzil yok; bütün düşmanlar ilk turdan vurur |
| Çöl | 46% | Minotaur of Baphomet çıkar (4400 → 3700) | Hedefin altında; en sert yakın dövüşçülerden biri |
| Volkan | 100% | Önce harita: düşman başlangıç bölgesi adacıklardan kara köprüsüne alınsın | Sayı artırmak sorunu çözmez |
| Orman | 53% | 2 Wolf ve 1 Giant Spider çıkar (4550 → 4250) | Hedefin hemen altında |
| Mağara | 59% | 1 Ghoul çıkar (3950 → 3750) | Neredeyse hedefte; berabere 5% |
| Kale | 65% | Değişiklik yok | Hedefte |
| Taverna | 99% | 1 Ogre ve 1 Bandit Captain ekle (2550 → 3450) | Masum kuralı değişince fazla kolay |

## Gece varyantları ve gizlenme kuralları (Görev K)

Yeni senaryolar `orman-gece` ve `kale-gece`; düşmanlar gündüzle aynı. Komut: `npm run sim -- 200 orman orman-gece kale kale-gece`. Hedef %55–85.

| Senaryo | XP | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | Durum |
|---|---:|---:|---:|---:|---:|---|
| Orman | 5200 | 59% | 0% | 5.7 | 0.23 | ✓ |
| Orman — Gece | 5200 | **59%** | 0% | 5.7 | 0.23 | ✓ |
| Kale — Gündüz | 4650 | 61% | 6% | 10.6 | 0.65 | ✓ |
| Kale — Gece | 4650 | **61%** | 6% | 10.6 | 0.65 | ✓ |

- Gece sonuçları gündüzle birebir aynı. Bu beklenen sonuç: gece kuralı (`night`) yalnızca gizlenmeyi etkiliyor, yapay zekâ ise hiçbir tarafta Gizlen kullanmıyor. Görüş sınırı (`darkness`) gece haritalarına eklenmedi (Şehir meydanı gecede isteğe bağlı kaldı).
- Yeniden kurmaya gerek olmadı (ikisi de aralıkta).
- Gece etkisi oyuncu gizlendiğinde ortaya çıkar; sayısal etkisi DECISIONS.md'de (Görev K): Stealth +5 bir karakterin gizlenme olasılığı gündüz %55 (keskin gözlü gözcüye karşı %40), gece ışıksız altıgende %80.
- Diğer senaryolar değişmedi: `npm run sim -- 30` çıktısı Görev J ile aynı (yalnızca iki yeni satır).

## Dungeon: Merdiven ve Hazine odası varyantları (16.10)

Aynı düşman grubu üç varyantta (Troll, Ogre, 4 Hobgoblin Warrior, 2 Ghoul; 3050 XP), 200 tohum:

| Varyant | Parti kazandı | Berabere (20 tur) | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Koridor (meşale) | 86% | 7% | 7.1 | 0.23 | 17% | 0.83 |
| Merdiven | **66%** | **22%** | 10.1 | 0.30 | 22% | 0.84 |
| Hazine odası | 89% | 7% | 7.2 | 0.18 | 14% | 0.68 |

- **Merdiven en zoru.** Düşmanlar sağdaki yüksek basamaklarda başlıyor (highGround avantajı).
  Parti dar basamaklardan ve merdiven boşluğunun kenarından tırmanıyor. Savaş uzuyor, beraberlik %22.
  Kayıp ise artmıyor; ölen PC sayısı Koridor'a yakın.
- **Hazine odası** Koridor'a yakın. Gizli tuzakları pasif Algı çoğu zaman yakalıyor.
- **Öneri (uygulanmadı):** Sayı değişikliği gerekmiyor.
  Merdiven'deki beraberliği azaltmak için önce harita düzeltilmeli: düşman bölgesine `l` basamaklarından birkaç altıgen eklenmeli, böylece düşmanlar aşağı inip çatışmaya girer.
  Sonra yeniden ölçülmeli.

## Masumlar eylemsiz (Görev F)

Masumlar artık hiçbir şey yapmıyor: kaçmıyor, sıraları atlanıyor. Yalnızca 3 Taverna senaryosu etkilendi; diğer senaryolarda masum yok ve varsayılan yerleşim birebir aynı (bütün harita/varyant/aynalama/masum kipleri eski ve yeni kodla karşılaştırıldı). 200 tohum, hedef %55–85.

| Senaryo | Önce (Görev E) | Sonra (aynı düşmanlar) | 1. deneme: Spy → Bandit Captain | 2. deneme: 1 Tough → Spy | **Son** | Kurtarılan masum (son) |
|---|---:|---:|---:|---:|---:|---:|
| Taverna, 4 masum ortada | 84% | 86% | 69% | 82% | **82%** ✓ | 0,00 / 4 |
| Taverna, 4 masum uzakta | 66% | 63% | 58% | 60% | **60%** ✓ | 3,22 / 4 |
| Taverna, 8 masum uzakta | 61% | 59% | 48% | 61% | **61%** ✓ | 4,49 / 8 |

- Son liste: 2 Tough Boss, 2 Knight, 2 Bandit Captain, 1 Tough, 2 Spy (4900 → 5000 XP). Taverna'nın 9 düşman yeri dolu; sayı artırılamadığı için güçlendirme bir canavarı değiştirerek yapıldı.
- **Ortadaki masumlar:** kaçmadıkları için hepsi ölüyor (0/4). Düşmanlar vuruşlarını onlara harcadığı için parti ortada daha kolay kazanıyor (%86 → %82 ancak liste güçlenince).

## Yakalama, Prone, hücum ve süreli hasar sonrası (Görev E)

Grappled (kaçış DC, sürükleme), Prone (boyut sınırı, kalkmak hızın yarısı), hücum (20+ ft düz koşu: ek hasar ve Prone), süreli durumlar ve süreli hasar artık uygulanıyor. 200 tohum. Hedef: normal %55–85, ejderhalar %60–80.

| Senaryo | Önce (Görev C) | Sonra (aynı düşmanlar) | Yeniden kurulum | **Son** |
|---|---:|---:|---|---:|
| Düz (haritasız) | 69% | 51% | 4 → 2 Wolf (1800 → 1700 XP) | **66%** ✓ |
| Çöl, gündüz | 64% | 57% | – | **57%** ✓ |
| Volkan, normal | 64% | 64% | – | **64%** ✓ |
| Orman | 59% | 59% | – | **59%** ✓ |
| Mağara, karanlık | 66% | 66% | – | **66%** ✓ |
| Dungeon, Koridor | 80% | 80% | – | **80%** ✓ |
| Dungeon, Merdiven | 84% | 84% | – | **84%** ✓ |
| Dungeon, Hazine odası | 83% | 84% | – | **84%** ✓ |
| Kale, gündüz | 61% | 61% | – | **61%** ✓ |
| Taverna, 4 masum ortada | 84% | 84% | – | **84%** ✓ |
| Taverna, 4 masum uzakta | 66% | 66% | – | **66%** ✓ |
| Taverna, 8 masum uzakta | 61% | 61% | – | **61%** ✓ |
| Ejderha: Young Red | 70% | 70% | – | **70%** ✓ |
| Ejderha: Adult Red | 67% | 67% | – | **67%** ✓ |
| Ejderha: Ancient Red | 67% | 67% | – | **67%** ✓ |
| Ejderha: Wyrmling | 88% | 88% | – | **88%** kabul edilen sapma (Görev C'den) |
| Ejderha: şans kipi (%2) | 65% | 65% | – | **65%** ✓ |

- **Düz:** 4 Wolf ve 2 Worg ısırığı Medium hedefi yere düşürüyor; Pack Tactics ve yerdeki hedefe yakın dövüş avantajıyla parti %51'e indi. Boar hücumu (+1d6, Prone) da etkili. 2 Wolf çıkınca %66.
- **Çöl:** Giant Scorpion kıskacı yakalıyor; yakalanan karakter kaçmak için eylemini harcıyor. %64 → %57, aralıkta.
- **Orman:** Dire Wolf ve Wolf savaş başına ~2 kez yere düşürüyor; ortalama ölen PC 0,18 → 0,23 arttı, kazanma oranı aynı kaldı (%59).
- Diğer senaryoların düşmanlarında yakalama, Prone ya da hücum rider'ı yok ya da çok az (Kale'de 10 savaşta 1 yakalama); sonuç değişmedi.

## Canavar saldırı ek etkileri (rider) uygulandıktan sonra (Görev C)

Ek hasarlar ("+ 1d6 necrotic", "+ 7d6 poison"), avantajlı koşullu hasar ve "Bloodied" hasar değişimi artık uygulanıyor (`data/attack-riders.json`). Düşmanlar belirgin güçlendi. Hedef: normal senaryolar %55–85, ejderhalar %60–80. 200 tohum.

| Senaryo | Önce (rider yok) | Sonra (aynı düşmanlar) | Yeniden kurulum | **Son** |
|---|---:|---:|---|---:|
| Düz (haritasız) | 69% | 69% | – | **69%** ✓ |
| Çöl, gündüz | 72% | 64% | – | **64%** ✓ |
| Volkan, normal | 81% | 64% | – | **64%** ✓ |
| Orman | 65% | 59% | – | **59%** ✓ |
| Mağara, karanlık | 62% | 50% | Phase Spider → Grimlock (4100 → 3450 XP) | **66%** ✓ |
| Dungeon, Koridor | 58% | 39% | Wraith ve 1 Bugbear Stalker çıktı (8400 → 5900 XP) | **80%** ✓ |
| Dungeon, Merdiven | 85% | 84% | – | **84%** ✓ |
| Dungeon, Hazine odası | 68% | 44% | Wraith ve 1 Bugbear Stalker çıktı, +1 Bugbear Warrior (7750 → 5450 XP) | **83%** ✓ |
| Kale, gündüz | 56% | 38% | 6 → 3 Hobgoblin Warrior (yayı +3d4 zehir), 2 → 5 Goblin Warrior, 3 → 2 Berserker (5250 → 4650 XP) | **61%** ✓ |
| Taverna, 4 masum ortada | 86% | 84% | – | **84%** ✓ (sapma bitti) |
| Taverna, 4 masum uzakta | 71% | 66% | – | **66%** ✓ |
| Taverna, 8 masum uzakta | 67% | 61% | – | **61%** ✓ |
| Ejderha: Young Red | 70% | 70% | – | **70%** ✓ |
| Ejderha: Adult Red | 66% | 67% | – | **67%** ✓ |
| Ejderha: Ancient Red | 66% | 67% | – | **67%** ✓ |
| Ejderha: Wyrmling | 76% | 45% | 1. deneme Wyvern + 2 Magma Mephit: 89%; 2. deneme Wyvern + Hell Hound: 88% | **88%** kabul edilen sapma (+8) |
| Ejderha: şans kipi (%2) | 60% | 56% | Wyvern + 2 Harpy → Wyvern + Imp | **65%** ✓ |

- Yeniden kurulan düşmanlar kendi haritasının ortam listesinden.
- Şans kipi ve Wyrmling'te Harpy (Volkan listesinde yok) yerine Volkan canavarları kullanıldı.
- **Wyrmling:** 2 Wyvern (iğne +7d6 zehir) partiyi eziyor (%45); tek Wyvern'le parti %88–89 kazanıyor. Ara bir değer Volkan listesinde yok.
  - Öneri (uygulanmadı): Wyvern + Hell Hound + Magma Mephit, ya da Wyvern + Salamander.

## Durum süreleri, Kaçın ve Yardım sonrası (16.10)

Süreli durumlar eklendi: canavar saldırı etkileri ve büyülerin "save ends" süresi. Kaçın ve Yardım oyuncu eylemi olarak eklendi; yapay zekâ bunları kullanmıyor. Düşman listeleri değişmedi.

200 tohum:

| Senaryo | Önce | **Sonra** | Fark | Hedef (%55–85) |
|---|---:|---:|---:|---|
| Düz (haritasız) | 69% | **69%** | 0 | ✓ |
| Çöl, gündüz | 72% | **72%** | 0 | ✓ |
| Volkan, normal | 81% | **81%** | 0 | ✓ |
| Orman | 63% | **65%** | +2 | ✓ |
| Mağara, karanlık | 63% | **62%** | −1 | ✓ |
| Dungeon, Koridor | 58% | **58%** | 0 | ✓ |
| Dungeon, Merdiven | 85% | **85%** | 0 | ✓ (sınırda) |
| Dungeon, Hazine odası | 69% | **68%** | −1 | ✓ |
| Kale, gündüz | 56% | **56%** | 0 | ✓ |
| Taverna, 4 masum ortada | 86% | **86%** | 0 | kabul edilen sapma |
| Taverna, 4 masum uzakta | 71% | **71%** | 0 | ✓ |
| Taverna, 8 masum uzakta | 67% | **67%** | 0 | ✓ |

- **Etki küçük.**
  - Ghoul ve Ghast felci (Claw) çoklu saldırının parçası değil; yapay zekâ çoğunlukla ısırık kombinasyonunu seçiyor.
  - Giant Spider ve Ettercap ağı (Restrained, her tur sonu STR save) ile Mummy bakışı (Frightened) birkaç puanlık oynama yaptı.
- **Aralık dışına çıkan yok.** Yeni öneri gerekmiyor.
- **Not:** Canavar saldırılarının ek hasar metinleri (`rider`, örn. "+ 7d6 poison", "+ 1d6 necrotic") hâlâ uygulanmıyor; yalnızca günlükte görünüyor. Uygulanırsa düşmanlar belirgin güçlenir ve dengenin yeniden ölçülmesi gerekir.

## Adım 11, son tur: hedef aralık ve son rosterler (16.10)

**Hedef aralık:**
- Normal senaryolar: parti kazanma **%55–85**.
- Ejderha senaryoları: **%60–80** (değişmedi).

Aralık dışı kalan üç senaryo, kendi haritasının ortam listesinden düzeltildi. En çok 2 deneme, 200 tohum.

| Senaryo | Önceki | Deneme 1 | Deneme 2 | **Sonuç** |
|---|---:|---|---|---:|
| Mağara, karanlık | 98% (3000 XP) | Darkmantle → Phase Spider (3600 XP): 96% | Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider (4100 XP) | **63%** ✓ |
| Dungeon, Koridor | 97% (5150 XP) | 2 Ghast → 2 Mummy, 1 Ghoul → Minotaur of Baphomet (6150 XP): 93% | 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith (8400 XP, 14 altıgen) | **58%** ✓ |
| Dungeon, Hazine odası | 95% (5150 XP) | Koridor deneme 1 ile aynı (6150 XP): 87% | 2 Wight, 2 Bugbear Stalker, 2 Mummy, Ghast, 2 Ghoul, Bugbear Warrior, Minotaur of Baphomet, Wraith (7750 XP, 12 altıgen) | **69%** ✓ |

- **Mağara'da önerilen "Darkmantle yerine Troll"** listesi önceki turun 2. denemesiyle (Troll, Minotaur, Bugbear Stalker…, 4700 XP) aynıydı ve %39 vermişti.
  - Bu yüzden deneme 1'de daha hafif bir değişim denendi (Phase Spider).
  - Deneme 2'de Troll tutuldu, Minotaur ve Bugbear Stalker çıkarıldı.
  - Mağara'da Troll belirleyici: karanlıkta yenilenme ve 94 HP.

### Son durum (normal senaryolar, 200 tohum)

| Senaryo | Düşmanlar | XP | Parti kazandı | Durum |
|---|---|---:|---:|---|
| Düz (haritasız) | Ogre, Bandit Captain, 4 Gnoll Warrior, 4 Wolf, 2 Worg, 2 Boar | 1800 | 69% | ✓ |
| Çöl, gündüz | 2 Giant Scorpion, 2 Mummy, 2 Manticore, 4 Gnoll Warrior, Giant Hyena, 2 Scout, Death Dog | 5200 | 72% | ✓ |
| Volkan, normal | 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, Magma Mephit | 3900 | 81% | ✓ |
| Orman | 2 Owlbear, 2 Werewolf, 3 Giant Spider, 4 Dire Wolf, 2 Ettercap, 2 Wolf | 5200 | 63% | ✓ |
| Mağara, karanlık | Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider | 4100 | 63% | ✓ |
| Dungeon, Koridor | 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith | 8400 | 58% | ✓ |
| Dungeon, Merdiven | 2 Ghoul, 2 Ghast, 3 Bugbear Warrior, 4 Skeleton, Bugbear Stalker | 2800 | 85% | ✓ (sınırda) |
| Dungeon, Hazine odası | 2 Wight, 2 Bugbear Stalker, 2 Mummy, Ghast, 2 Ghoul, Bugbear Warrior, Minotaur of Baphomet, Wraith | 7750 | 69% | ✓ |
| Kale, gündüz | 6 Hobgoblin Warrior, 2 Goblin Warrior, Hobgoblin Captain, Bugbear Stalker, 3 Berserker, 2 Warrior Veteran, 2 Bugbear Warrior | 5250 | 56% | ✓ |
| Taverna, 4 masum ortada | 2 Tough Boss, 2 Knight, 2 Bandit Captain, 2 Tough, Spy | 4900 | 86% | **kabul edilen sapma (+1)** |
| Taverna, 4 masum uzakta | aynı | 4900 | 71% | ✓ |
| Taverna, 8 masum uzakta | aynı | 4900 | 67% | ✓ |

- Bütün türler kendi haritasının ortam listesinde.
- Taverna'nın üç senaryosu aynı düşmanlarla; masum yerleşimi farkı kasıtlı (ortadaki masumlar düşmanı oyalıyor).
- Ejderha senaryoları %60–80 içinde (Young 70, Adult 66, Ancient 66, Wyrmling 76, şans kipi 60).

## Adım 11: düşmanlar haritanın ortam listesinden (16.10)

Her senaryonun düşmanları `data/monster-ortamlari.json`'daki kendi ortam listesinden yeniden kuruldu: Düz için `duz-zemin`, diğerleri haritanın kimliği. Canavar verisi ve ortam dosyası değişmedi.
- Her senaryo en çok 2 deneme. İkincide de %60–80 dışında kalırsa hedefe en yakın deneme bırakıldı (**kabul edilen sapma**).
- Ejderha senaryolarına dokunulmadı.
- Düşman sayısı haritanın düşman başlangıç altıgeniyle sınırlı: Volkan 10, Mağara 8, Merdiven ve Hazine 12, Taverna 9, Koridor 14, Orman 15, Kale 18, Çöl 20.

Komut: `npm run sim -- 200 <senaryo>`. 200 tohum.

### Eski ve yeni düşman listeleri

| Senaryo | Eski düşmanlar (XP) | Eski | Yeni düşmanlar (XP) | Deneme 1 | Deneme 2 | **Sonuç** |
|---|---|---:|---|---:|---:|---:|
| Düz (haritasız) | Troll, Hill Giant, Owlbear, Ogre, 2 Wolf (4850) | 25% | Ogre, Bandit Captain, 4 Gnoll Warrior, 4 Wolf, 2 Worg, 2 Boar (1800) | 22% (2950 XP) | **69%** | **69%** ✓ |
| Çöl, gündüz | Troll, Minotaur of Baphomet, Owlbear, Ogre, Bandit Captain, 4 Wolf, 2 Goblin Warrior (4400) | 46% | 2 Giant Scorpion, 2 Mummy, 2 Manticore, 4 Gnoll Warrior, Giant Hyena, 2 Scout, Death Dog (5200) | 97% (3300 XP) | **72%** | **72%** ✓ |
| Volkan, normal | Wyvern, Troll, 4 Wolf, 2 Goblin Warrior (4400) | 86% | 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, Magma Mephit (3900) | 57% (4450 XP) | **81%** | **81%** ~ |
| Orman | Troll, Owlbear, Minotaur of Baphomet, Ogre, 3 Giant Spider, 6 Wolf (4550) | 53% | 2 Owlbear, 2 Werewolf, 3 Giant Spider, 4 Dire Wolf, 2 Ettercap, 2 Wolf (5200) | 94% (3250 XP) | **63%** | **63%** ✓ |
| Mağara, karanlık | Troll, Owlbear, Ogre, 3 Giant Spider, 2 Ghoul (3950) | 59% | 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Minotaur of Baphomet, Ogre, Bugbear Stalker (3000) | **98%** | 39% (4700 XP) | **98%** ✗ |
| Dungeon, Koridor | Troll, Ogre, 4 Hobgoblin Warrior, 2 Ghoul (3050) | 86% | 2 Wight, 2 Bugbear Stalker, 3 Ghast, 3 Ghoul, 2 Bugbear Warrior (5150) | 100% (3450 XP) | **97%** | **97%** ✗ |
| Dungeon, Merdiven | aynı (3050) | 66% | 2 Ghoul, 2 Ghast, 3 Bugbear Warrior, 4 Skeleton, Bugbear Stalker (2800) | **85%** | 90% (3850 XP) | **85%** ~ |
| Dungeon, Hazine odası | aynı (3050) | 89% | Koridor ile aynı (5150) | 100% (3450 XP) | **95%** | **95%** ✗ |
| Kale, gündüz | Troll, 2 Ogre, Bandit Captain, 6 Hobgoblin Warrior, 4 Goblin Warrior (3950) | 65% | 6 Hobgoblin Warrior, 2 Goblin Warrior, Hobgoblin Captain, Bugbear Stalker, 3 Berserker, 2 Warrior Veteran, 2 Bugbear Warrior (5250) | 90% (3700 XP) | **56%** | **56%** ~ |
| Taverna, 4 masum ortada | 2 Bandit Captain, 4 Tough, Ogre, Minotaur of Baphomet, Hobgoblin Warrior (2550) | 99% | 2 Tough Boss, 2 Knight, 2 Bandit Captain, 2 Tough, Spy (4900) | 99% (3225 XP) | **86%** | **86%** ~ |
| Taverna, 4 masum uzakta | aynı | 99% | aynı | 95% | **71%** | **71%** ✓ |
| Taverna, 8 masum uzakta | aynı | 95% | aynı | 91% | **67%** | **67%** ✓ |

- **Deneme 1 rosterleri:**
  - Düz: 2 Ogre, Werewolf, Bandit Captain, 4 Gnoll, 4 Wolf, 2 Worg, 2 Boar.
  - Çöl: Giant Scorpion, Mummy, Manticore, 4 Gnoll, 2 Giant Hyena, 2 Scout, Death Dog.
  - Volkan: 2 Hell Hound, Fire Elemental, 2 Magmin, 2 Imp, 2 Magma Mephit, Azer Sentinel.
  - Orman: Owlbear, Werewolf, 3 Giant Spider, 3 Dire Wolf, 4 Wolf, Ettercap.
  - Koridor ve Hazine: 3 Ghoul, 2 Ghast, 2 Bugbear Warrior, 3 Skeleton, Bugbear Stalker, Wight.
  - Kale: 6 Hobgoblin Warrior, 4 Goblin Warrior, Goblin Boss, Hobgoblin Captain, 2 Bugbear Warrior, 2 Berserker, Warrior Veteran.
  - Taverna: 3 Tough, Bandit, 2 Bandit Captain, Tough Boss, Knight, Spy.
- **Deneme 2'de Mağara ve Merdiven:**
  - Mağara: Troll, Minotaur of Baphomet, Bugbear Stalker, Ettercap, Ogre, 2 Giant Spider, Ghoul.
  - Merdiven: 2 Ghoul, 3 Ghast, 3 Bugbear Warrior, Bugbear Stalker, Wight, 2 Skeleton.

### Ortam uygunluğu
- Yeni rosterlerdeki bütün türler kendi haritasının ortam listesinde (betikle denetlendi).
- Eski rosterlerde Troll, Owlbear, Ogre, Wolf, Goblin Warrior, Minotaur of Baphomet ve Hobgoblin Warrior çoğu haritanın listesinde değildi.
- Kale'de görev metnindeki örnek Ogre ve Bandit Captain `kale` listesinde yok; yerlerine Hobgoblin Captain, Berserker ve Warrior Veteran kullanıldı.
- Dokunulmayan ejderha senaryolarındaki Harpy `volkan` listesinde yok (`dag`, `ada`, `gemi`).

### Kabul edilen sapmalar
Hepsi 2 denemenin en yakını.

| Senaryo | Sonuç | Sapma | Not |
|---|---:|---:|---|
| Volkan, normal | 81% | +1 | Sınırda; Magma Mephit eklemek yeter gibi |
| Dungeon, Merdiven | 85% | +5 | Deneme 2 (3850 XP) daha kolay çıktı (%90): bu varyantta düşman sayısı ve Wight farkı belirleyici değil, basamaklar ve beraberlik (%8–14) baskın |
| Kale | 56% | −4 | Deneme 1 %90; aradaki değer (1 Berserker eksik) hedefe girer gibi |
| Taverna, 4 masum ortada | 86% | +6 | Masum yerleşimi farkı kasıtlı (ortada kolay); diğer iki Taverna hedefte |
| Dungeon, Hazine odası | 95% | +15 | Tema canavarları (ghoul, ghast, wight, bugbear) bu haritada XP'sine göre zayıf; Koridor'la aynı |
| Dungeon, Koridor | 97% | +17 | Aynı |
| Mağara, karanlık | 98% | +18 | Deneme 2'de Troll ve Minotaur ile %39'a düştü (−21); deneme 1 yakın olduğu için bırakıldı |

- Mağara ve Dungeon'da iki deneme hedefin iki yanına düştü ya da yetmedi.
- Bir sonraki adım için öneri (uygulanmadı):
  - Mağara: deneme 1'e yalnızca Troll ekle (8 altıgen sınırı: Darkmantle yerine).
  - Koridor ve Hazine: 2 Ghast → 2 Mummy, ya da +1 Minotaur of Baphomet (Koridor'da 14 yer var).

## Volkan: Wyrmling 2 Wyvern, şans kipi %2, üçüncü tur (16.10)

Değişiklikler:
- Wyrmling eşlikçisi: Wyvern + 3 Harpy → 2 Wyvern (Harpy yok).
- `dragonWake: chance` varsayılan eğilimi: %5 → %2 (Volkan JSON ve kod yedeği). Eşlikçi aynı (Wyvern + 2 Harpy).

200 tohum, ilk denemede ikisi de aralıkta; ikinci deneme gerekmedi:

| Senaryo | Önceki ölçümler | **Şimdi** | Uyandı | Uyumadan bitti | Uyanınca parti kazandı | Ejderha öldü (uyandıysa) |
|---|---|---:|---:|---:|---:|---:|
| Wyrmling (2 Wyvern) | W + 2H: 95%, W + 3H: 89%, 2W + 2H: 53% | **76%** ✓ | 43% | 58% | ~49% | 56% |
| Young Red, `chance` %2 | %25: 13%, %10: 35%, %5: 49% | **60%** ✓ (alt sınır) | 44% | 57% | ~7% | 8% |

**Volkan uyuyan ejderha, son durum** (hepsi %60–80 içinde):

| Seçenek | Eşlikçi (sim) | Parti kazandı |
|---|---|---:|
| Young Red | Wyvern + 2 Harpy | 70% |
| Adult Red | Wyvern + 2 Harpy | 66% |
| Ancient Red | Wyvern + 2 Harpy | 66% |
| Red Dragon Wyrmling | 2 Wyvern | 76% |
| Young Red, `chance` (varsayılan %2) | Wyvern + 2 Harpy | 60% |

- Şans kipi tam alt sınırda (%60). GM yüzdeyi kurulumda değiştirebilir: yükseltmek zorlaştırır.
- Canavar verisine dokunulmadı; eşlikçiler yalnızca sim senaryosu.

## Volkan: Wyrmling eşlikçisi ve şans kipi, ikinci tur (16.10)

Değişiklikler:
- Wyrmling eşlikçisi: 2 Wyvern + 2 Harpy → Wyvern + 3 Harpy.
- `dragonWake: chance` varsayılan eğilimi: %10 → %5 (Volkan JSON ve kod yedeği). Eşlikçi değişmedi (Wyvern + 2 Harpy).

Young, Adult ve Ancient değişmedi (%70, %66, %66; önceki tablo).

200 tohum:

| Senaryo | Önceki ölçümler | **Şimdi** | Uyandı | Uyumadan bitti | Ejderha öldü (uyandıysa) |
|---|---|---:|---:|---:|---:|
| Wyrmling (Wyvern + 3 Harpy) | W + 2H: 95%, 2W + 2H: 53% | **89%** ✗ | 34% | 66% | 69% |
| Young Red, `chance` %5 | %25: 13%, %10: 35% | **49%** ✗ | 54% | 46% | 6% |

- **Wyrmling:** Bir Harpy eklemek yalnızca %95 → %89 indirdi. İkinci Wyvern ise %53'e düşürüyor. Eşlikçideki Wyvern sayısı belirleyici, Harpy etkisi küçük.
- **Şans kipi:** Eğilim düştükçe kazanma artıyor (%13 → %35 → %49). Hiç uyandırmayan `never` kipi %70; hedefe çok düşük bir eğilimle varılıyor.
- **Yeni öneriler (uygulanmadı):**
  - **Wyrmling:** 2 Wyvern, Harpy'siz. 2 Wyvern + 2 Harpy'nin (%53) biraz daha hafifi; beklenen aralık %60–75.
  - **Şans kipi:** Varsayılan eğilim %2. %5'te %49, `never`'da %70; %2 ile %60 civarı beklenir.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan: eşlikçi önerileri uygulandı (16.10)

Değişiklikler (yalnızca sim senaryosu ve varyantın varsayılanı; canavar verisi değişmedi):
- Adult Red eşlikçisi: 3 Harpy → Wyvern + 2 Harpy (Young ile aynı).
- Wyrmling eşlikçisi: Wyvern + 2 Harpy → 2 Wyvern + 2 Harpy.
- `dragonWake: chance` varsayılan eğilimi: %25 → %10 (Volkan JSON ve kod yedeği).

Komut: `npx vite-node src/sim/ejderTeshis.ts 200 volkan-ejder volkan-ejder-adult volkan-ejder-ancient volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum.

| Ejderha (eşlikçi) | Önce | **Şimdi** | Uyandı | Uyumadan bitti | Uyanınca parti kazandı | Ejderha öldü (uyandıysa) |
|---|---:|---:|---:|---:|---:|---:|
| Young Red (Wyvern + 2 Harpy) | 70% | **70%** | 33% | 68% | 6% | 6% |
| Adult Red (Wyvern + 2 Harpy) | 97% | **66%** ✓ | 35% | 66% | 0% | 0% |
| Ancient Red (Wyvern + 2 Harpy) | 66% | **66%** ✓ | 35% | 66% | 0% | 0% |
| Wyrmling (2 Wyvern + 2 Harpy) | 95% | **53%** ✗ | 40% | 60% | 21% | 33% |
| Young Red, `chance` %10 | 13% (%25) | **35%** ✗ | 67% | 34% | 3% | 2% |

- **Aralıkta:** Young, Adult ve Ancient (%66–70).
- **Wyrmling %53, aralığın altında.** İkinci Wyvern fazla geldi: eşlikçiler partiyi yıpratıyor, uyanan Wyrmling artık %33'te ölüyor.
- **Şans kipi %35, aralığın altında.** %10 eğilimle bile uyanma %67: düşmanlar sık tur atıyor ve her turda yeni zar atılıyor.
- **Yeni öneriler (uygulanmadı):**
  - **Wyrmling:** ara değer olarak Wyvern + 3 Harpy (önceki iki ölçüm %95 ve %53, hedef bunların arasında).
  - **Şans kipi:** eğilim %5; ya da bu kipte eşlikçi 2 Harpy (Wyvern'siz), böylece savaş kısalır ve daha az zar atılır.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan: uyuyan ejderha teşhisi ve Ancient Red (16.10)

Komut: `npx vite-node src/sim/ejderTeshis.ts 200 volkan-ejder volkan-ejder-adult volkan-ejder-ancient volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum, Volkan haritası. Eşlikçiler `src/sim/balance.ts` senaryolarında.

| Ejderha (eşlikçi) | Parti kazandı | Uyandı | Uyanma turu | Uyanık tur | Ejderhanın hasarı | PC düşürme* | Nefes/savaş | PC'ye vardı | Ejderha öldü | Uyumadan bitti | Uyumadan bitince parti kazandı |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Young Red (Wyvern + 2 Harpy) | **70%** | 33% | 1.2 | 7.7 | 136 | 6.8 | 3.1 | 98% | 6% | 68% | 100% |
| Adult Red (3 Harpy) | **97%** | 4% | 1.4 | 6.7 | 157 | 6.1 | 3.7 | 100% | 0% | 97% | 100% |
| **Ancient Red (Wyvern + 2 Harpy), yeni** | **66%** | 35% | 1.1 | 6.0 | 132 | 6.0 | 2.6 | 90% | 0% | 66% | 100% |
| Wyrmling (Wyvern + 2 Harpy) | **95%** | 30% | 1.3 | 5.6 | 71 | 2.2 | 2.6 | 100% | 85% | 71% | 100% |
| Young Red, `chance` %25 | **13%** | 90% | 1.2 | 7.8 | 147 | 6.9 | 3.2 | 99% | 3% | 10% | 100% |

\* Uyandığı savaşlarda ortalama. Tekrar düşürmeler dahil: iyileşip yeniden düşen PC her seferinde sayılır.

- **Ejderhanın yapay zekâsı sorun değil.**
  - Uyanınca %90–100 bir karaktere varıyor (uçarak, adalar arasında).
  - Nefes silahını savaş başına 2.6–3.7 kez kullanıyor.
  - Young, Adult ve Ancient uyandıysa parti neredeyse hiç kazanmıyor (Adult ve Ancient hiç ölmedi).
- **Asıl sebep: kazanmanın büyük kısmı ejderha hiç uyanmadan.**
  - Uyumadan biten savaşların %100'ünü parti kazanıyor; kazanma oranı ≈ uyumadan bitme oranı.
  - Uyanma neredeyse yalnızca 1. tur sonundaki Algı ile oluyor (25 ft içinde gizlenmemiş karakter).
  - Parti yapay zekâsı o menzilden kaçıyor; uyanık eşlikçiler ölünce savaş bitiyor (tasarım gereği: "ejderha uyurken sıvışılır").
  - **Adult Red %97 çünkü eşlikçisi zayıf (3 Harpy).** Savaş ~2.3 turda bitiyor ve parti ejderhaya yaklaşmıyor.
- **Wyrmling'te sebep güç.** CR 4, 5 kişilik 5. seviye partiye karşı zayıf: uyandığı savaşların %85'inde ölüyor, uyanınca parti %83 kazanıyor.
- **Denenen ve geri alınan düzeltme: savaş gürültüsü.** Ejderhaya 30 ft içinde bir saldırı ya da save olunca turda bir kez Algı ≥ 18.
  - Ejderhalar %89–100 uyandı. Parti kazanma oranı: Young %8, Adult %5, Ancient %0, Wyrmling %77, chance %3.
  - Uyanınca ejderha kazandığı için bu kural "uyuyan ejderha" fikrini "her zaman ejderha savaşı"na çeviriyor ve hedef aralığı tutturmuyor. Bu yüzden kural eklenmedi.
- **Öneriler (uygulanmadı; yalnızca sim senaryosu, canavar verisi değil):**
  - **Adult Red (%97):** eşlikçi Young ile aynı yapılsın (Wyvern + 2 Harpy). Savaş uzar, parti ejderhanın Algı menziline girer. Young (%70) ve Ancient (%66) bu eşlikçiyle aralıkta; Adult'un da benzer çıkması beklenir.
  - **Wyrmling (%95):** eşlikçi güçlendirilsin: Wyvern + 2 Harpy yerine 2 Wyvern + 2 Harpy ya da Wyvern + Troll + 2 Harpy.
  - **`chance` %25 (%13):** varsayılan eğilim %10'a insin ya da bu kipte eşlikçi 2 Harpy olsun.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan (yeni harita, eski "Volkan Adaları", 16.10)

Eski Volkan haritası kaldırıldı. "Volkan" artık üç adalı harita. Komut: `npm run sim -- 200 volkan volkan-ejder volkan-ejder-adult volkan-ejder-wyrmling volkan-ejder-sans`. 200 tohum.

| Senaryo | Düşmanlar | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | Wyvern, Troll, 2 Kurt | 4400 | **86%** | 7.2 | 0.43 | 32% | – | – |
| Uyuyan Young Red | Wyvern + 2 Harpy | 8600 | **70%** | 5.9 | 1.14 | 75% | 33% | 6% |
| Uyuyan Adult Red | 3 Harpy | 18600 | **97%** | 2.3 | 0.14 | 10% | 4% | 0% |
| Uyuyan Wyrmling | Wyvern + 2 Harpy | 3800 | **95%** | 5.3 | 0.65 | 54% | 30% | 83% |
| Uyuyan Young Red, `dragonWake: chance` %25 | Wyvern + 2 Harpy | 8600 | **13%** | 8.2 | 1.79 | 91% | 90% | 3% |

- **Normal ve Young Red** hedef aralıkta, değişiklik gerekmiyor (%86 ve %70).
- **Adult Red** neredeyse hiç uyanmıyor (%4). 3 Harpy'yi parti 2–3 turda yeniyor, savaş fiilen ejderhasız geçiyor.
- **Wyrmling** uyansa da yeniliyor; uyanınca kazanma %83.
- **Şansa bağlı kip** çok zor: ejderha %90 uyanıyor ve Young Red uyanınca parti neredeyse hiç kazanmıyor.
- **Öneriler (uygulanmadı; yalnızca sim senaryosu, canavar verisi değil):**
  - Adult Red'e Young Red'deki gibi uçan bir eşlikçi (Wyvern + 2 Harpy).
  - Wyrmling'e bir eşlikçi daha (Wyvern + 3 Harpy).
  - Şans kipi: eşlikçi azaltılabilir (2 Harpy) ya da varsayılan eğilim %25'ten %10'a indirilebilir.
  - Her öneriden sonra yeniden ölçülmeli.

## Volkan Adaları (16.10; bu harita artık `volkan`)

200 tohum:

| Senaryo | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan Adaları (normal; eski Volkan'ın düşmanları) | 4400 | **86%** | 7.2 | 0.43 | 32% | – | – |
| Uyuyan Young Red, 3 Harpy | 6500 | 97% | 2.4 | 0.15 | 10% | 4% | 0% |
| **Uyuyan Young Red, Wyvern + 2 Harpy (seçilen)** | 8600 | **70%** | 5.9 | 1.14 | 75% | 33% | 6% |
| Deneme: Young Red, Wyvern + 3 Harpy | – | 66% | – | 1.10 | – | 37% | 5% |
| Deneme: Young Red, Wyvern + Troll + 2 Kurt | – | 65% | – | 1.05 | – | 32% | 5% |

- Normal varyant eski Volkan'a yakın (%82 → %86). Üç ada arasında 2 sütun lav var; kara düşmanları orta adadan geçerek ada ada geliyor.
- Ejderha (8,3) partinin başlangıcına eski haritadakinden uzak. 3 Harpy ile neredeyse hiç uyanmıyor (%4), parti %97. Uçan Wyvern eklenince partiyi menzil içinde yakalıyor; parti %70.
- Bu simülasyon senaryosu; canavar verisine dokunulmadı.

## Volkan: ada atlaması yeniden (jumpTargets, 16.10)

Kural:
- Başka bir adaya atlanır.
- Hatta kalkış ve hedef adanın karası engel değildir; adanın içinden atlanır.
- Üçüncü ada ya da kaya hattı keser.

200 tohum:

| Senaryo | Önceki (ada bazlı) | **Şimdi** | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | 81% | **82%** | 5.2 | 0.70 | 44% | – | – |
| Uyuyan Young Red (3 Harpy) | 69% | **75%** | 3.8 | 0.48 | 28% | 26% | 2% |
| Uyuyan Adult Red (3 Harpy) | 74% (2 Harpy) | **70%** | 3.8 | 0.60 | 32% | 30% | 0% |
| Uyuyan Wyrmling (Wyvern + 2 Harpy) | 77% (Wyvern + Harpy) | **78%** | 6.3 | 0.59 | 41% | 61% | 64% |

- Parti artık adasının içinden orta adaya ve küçük adalara atlayabiliyor. Teşhiste başlangıç yerinden geçerli hedef 0'dı, şimdi 13. Düşman adasına aradaki orta ada yüzünden doğrudan atlanamıyor; ada ada gidiliyor.
- Ejderha varyantlarında parti yapay zekâsı ejderhanın Algı menziline atlamıyor. Atlasaydı Young %33, Adult %46 olurdu (uyanma %55–69).

## Volkan: ada bazlı atlama (16.10)

Kural:
- Başka bir adaya, arası yalnızca lav olan düz hatla ulaşılabiliyorsa o adanın herhangi bir boş altıgenine atlanır.
- Kenarda duran yaratık hattı kesmez.
- Adayı atlayıp ötekine geçmek yasak.

200 tohum:

| Senaryo | Önce (ilk kara) | **Şimdi (ada bazlı)** | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal) | 100% | **81%** | 6.7 | 0.55 | 36% | – | – |
| Uyuyan Young Red (3 Harpy) | 75% | **69%** | 4.1 | 0.55 | 35% | 32% | 3% |
| Uyuyan Adult Red (2 Harpy; önce 3 Harpy) | 70% | **74%** | 3.4 | 0.54 | 26% | 27% | 0% |
| Uyuyan Wyrmling (Wyvern, Harpy) | 79% | **77%** | 5.8 | 0.64 | 37% | 55% | 57% |
| Uyuyan Young Red, `chance` %25 | 34% | 32% | 6.9 | 1.24 | 67% | 72% | 5% |

- **Normal Volkan sonunda zorlaştı (%100 → %81).** Kara düşmanları artık küçük adalara ve kenarında yaratık duran adaların içine atlayabiliyor; partiye daha çabuk ulaşıyorlar. Düşman listesine dokunulmadı.
- **Ejderha varyantları %65–80 bandında.** Adult Red %64'e düştüğü için eşliği 3 Harpy'den 2 Harpy'ye indirildi (%74). Bu bir simülasyon senaryosu; canavar verisine dokunulmadı.
- Simülasyon yavaşladı (Volkan 200 savaş ~17 → ~43 sn), çünkü yapay zekâ her adım ada hatlarını tarıyor.

## Volkan: Uyuyan ejderha varyantı (16.10)

Ejderha varyanttan gelir; eşlik edenler az. `dragonWake: never` (varsayılan). Her satır 200 tohum.

| Senaryo | Ejderha | Eşlik | XP | Parti kazandı | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ejderha uyandı | Uyanınca kazanma |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Volkan (normal, değişmedi) | – | Wyvern, Troll, 4 kurt, 2 goblin | 4400 | 100% | 4.5 | 0.08 | 7% | – | – |
| Uyuyan Young Red | Young Red Dragon (CR 10) | 3 Harpy | 6500 | **75%** | 3.6 | 0.45 | 28% | 26% | 2% |
| Uyuyan Adult Red | Adult Red Dragon (CR 17) | 3 Harpy | 18600 | **70%** | 3.8 | 0.52 | 31% | 30% | 0% |
| Uyuyan Wyrmling | Red Dragon Wyrmling (CR 4) | Wyvern, Harpy | 3600 | **79%** | 5.6 | 0.60 | 35% | 53% | 59% |
| Uyuyan Young Red, `chance` %25 | Young Red Dragon | 3 Harpy | 6500 | 34% | 6.7 | 1.19 | 65% | 69% | 4% |

- **Kazanma koşulu:** Uyanık düşmanlar yenilince parti kazanır; ejderha uyurken sıvışılır. Bu yüzden sonuç neredeyse tamamen uyanma oranına bağlı.
  - Young ve Adult uyanırsa bu parti kaybediyor (uyanınca kazanma %0–2).
  - Wyrmling uyanınca da yenilebiliyor (%59). Bu yüzden onun eşlikleri daha güçlü, uyanma oranı daha yüksek.
- **Uyanmanın kaynağı:** çoğunlukla tur sonu Algı zarı. Partinin başlangıç bölgesinin tamamı ejderhanın 25 ft'i içinde.
  - Parti yapay zekâsı ejderha uyurken menzilden çıkıyor. Yakın dövüşe girmiş karakter ise yerinde kalıyor.
  - Uçan eşlikler (Harpy, Wyvern) partiyi menzil içinde yakaladığında Algı zarı atılıyor.
- **`chance` %25:** Düşmanlar ejderhayı sık uyandırıyor (%69); parti %34. GM için "zor" ayar.
- **`gm` kipi:** Simülasyonda GM düğmesine basan yok, yapay zekâ `never` gibi davranır. Sonuç Young satırıyla aynı.
- XP sütunu ejderhanın XP'sini de içeriyor.

## Volkan: ada atlaması yalnızca en yakın karaya (16.10)

Kural: hattın içi baştan sona lav, iniş ilk kara; adalar tek tek geçilir. `foeIsland: allow`, dolu hedef reddi ve hareketin yerine geçme aynı.

Volkan, 200 tohum:

| Kural | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Önceki: her adaya sınırsız, düşmanlı adaya da (`allow`) | 87% | 0% | 5.6 | 0.68 | 41% | 0.72 |
| **Yeni: yalnızca ilk karaya** | **100%** | 0% | 4.5 | 0.08 | 7% | 0.42 |
| Deneme: ilk karaya ama yürüdükten sonra da atlanır (uygulanmadı) | 100% | 0% | 4.2 | 0.07 | 6% | 0.52 |

Savaş başına (40 tohum, ölçüm betiği):
- Düşmanların atlaması 1.0, lava düşen düşman 0.25.
- Düşmanın tur sonu konumu: kendi adası 4.7, orta ada 1.75, partinin adası 0.35.
- Yakın dövüş saldırısı: düşman 6.7, parti 31.5.

**Neden kolay:**
- Partinin ve düşmanların adası arasında iki kanal var; ortada bir ada.
- Kenara yürü → atla → karşı kenara yürü → atla en az 4 tur sürüyor. Başlangıç bölgesi adanın içinde olduğundan ilk tur hep yürüyüşe gidiyor.
- Bu sırada düşmanlar lav kenarında sıcak dalgaya (1d6) ve partinin menzilli saldırısına ve alan büyülerine açık.
- HP %40'a inen düşman artık atlamıyor.
- "Yürüdükten sonra da atlanabilsin" denemesi de %100 verdi; sorun hareket kuralı değil, iki kanallı geometri.

**Öneri (uygulanmadı, canavar sayısına dokunmadan):**
- Düşman başlangıç bölgesini orta adaya ya da sağ adanın lav kenarına almak (ilk tur atlama olur).
- Ya da orta adaya iki yandan kara köprüsü eklemek.
- Bu ikisi atlama kuralını bozmadan geçişi bir iki tur kısaltır. Sonra yeniden ölçmek.

## Volkan: sınırsız ada atlaması (16.10)

**Güncel (kullanıcı kararı):**
- `foeIsland` kapatıldı (`allow`): düşmanlı adaya da atlanabiliyor.
- Dolu hedef altıgen hâlâ reddediliyor; yapay zekâ kuralları aynı.
- Yeniden ölçüm (200 tohum): parti **%87**, berabere %0, ort. tur 5.6, ort. ölen PC 0.68, en az 1 ölüm %41.
- Hedeflenen ~%87'de kaldı; Volkan düşman listesine dokunulmadı.

Kural:
- Lav üstünden her adaya atlanır; mesafe sınırı yok.
- DC = 10 + 2 × (lav altıgeni − 1).
- Atlama hareketin yerine geçer.
- Hedef altıgen doluysa reddedilir; düşmanlı adaya da atlanır (`foeIsland: allow`).
- Yapay zekâ güvenli iniş şansı %60'ın altındaysa ya da HP %40 ve altındaysa atlamaz.

Volkan, 200 tohum:

| Kural | Parti kazandı | Berabere | Ort. tur | Ort. ölen PC | En az 1 ölüm | Ort. düşmüş PC |
|---|---:|---:|---:|---:|---:|---:|
| Önceki lavJump (sabit menzil, 5bdbeba) | 100% | 0% | 5.2 | 0.05 | 5% | – |
| İlk sürüm: düşmanlı adaya atlanmaz (`foeIsland: reject`) | 100% | 0% | 5.0 | 0.04 | 4% | 0.36 |
| **Güncel: düşmanlı adaya da atlanır (`foeIsland: allow`, uygulanan)** | **87%** | 0% | 5.6 | 0.68 | 41% | 0.72 |

Savaş başına (40 tohum):
- **İlk sürüm (`reject`):**
  - Düşmanlar 3.0 kez atlıyor, çoğu ortadaki boş adaya. 0.17'si lava düşüyor.
  - Taraf adaları kara ile bağlı değil; partinin adasına yalnızca uçan Wyvern ulaşıyor.
  - Kara düşmanları ortada kalıp menzilliyle eriyor: düşmanın yakın dövüş saldırısı 5.8, partininki 36.
- **Güncel (`allow`):**
  - Düşmanlar doğrudan partinin adasına atlıyor; yakın dövüş saldırısı 15.3'e çıkıyor.
  - Lava düşen düşman 1.65, parti 0.53 (atlama doğal 1 ve itme).

Önceki öneri uygulandı: (a) `foeIsland` kapatıldı.

## Volkan: riskli lav atlaması (`lavJump`, 5bdbeba)

Volkan 200 tohum: parti **100%** (değişmedi), berabere 0%, ort. ölen PC 0.05 (önce 0.04), en az 1 ölüm 5%, ort. tur 5.2.

Savaş başına (50 tohum):
- Düşmanlar 3.4 kez atlıyor. Bunların 2.2'si lav üstünden güvenli iniş, 1.1'i yanarak iniş (2d6 + Burning), 0.10'u doğal 1 ile lava düşme.
- İtmeyle birlikte lava düşen düşman savaş başına 0.32.
- Parti hiç atlamıyor: adasında kalıp gelenleri karşılıyor.

Kural düşmanların adacıklar arasındaki geçişini zorlaştırıyor: gelen düşman yanmış ve tek tek geliyor. Volkan zaten çok kolaydı. Öneri değişmedi: önce düşman başlangıç bölgesini kara köprüsüne almak, sonra yeniden ölçmek.

## Güncelleme: mağara ışığı, itme, gizlenme (16.10)

Aynı 8 senaryo × 200 tohum, kod d08eaf8'den önceki hâliyle (51aa65e). Yay kuralı değişmedi. Değişen satırlar:

| Senaryo | Parti kazandı (önce → şimdi) | Berabere | Ort. ölen PC | En az 1 ölüm | Neden |
|---|---:|---:|---:|---:|---|
| Volkan | 99% → **100%** | 0% → 0% | 0.09 → 0.04 | 7% → 4% | Parti, lav kenarındaki düşmanları lava itiyor |
| Mağara — karanlık | 43% → **37%** | 8% → 9% | 0.78 → 0.96 | 51% → 62% | Mağara artık %54 aydınlık (meşale yarıçapı 2): karanlıkta görülmeyen düşmanlar hedef alınamıyor, görünmeyen saldıran avantajlı (mağaradaki bütün canavarların karanlık görüşü var, partide Tavi ve Sela'nın yok) |

Diğer senaryolar aynı kaldı (Düz 25%, Çöl 61%, Orman 46%, Kale 53%, Taverna 99% / 94%).

**Mağara önerisi güncellendi:** 1 Giant Spider ve 1 Ghoul yerine Owlbear çıksın (3950 → 3250 XP); karanlık artık gerçekten etkili. Yay kuralı düzeltilince yeniden ölçülmeli.

## Özellik kullanımı (savaş başına ortalama, ilk 20 tohum)

| Senaryo | Sneak Attack | Hunter's Mark isabeti | Spiritual Weapon saldırısı | Spirit Guardians save'i | Action Surge | Second Wind | Fırsat saldırısı (parti / düşman) | Bozulan konsantrasyon |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Düz | 3.0 | 2.9 | 0.1 | 6.3 | 1.0 | 1.6 | 0 / 0 | 0.9 |
| Çöl | 1.1 | 1.6 | 6.0 | 0 | 1.0 | 2.3 | 0.5 / 0.5 | 1.6 |
| Volkan | 1.1 | 3.8 | 2.7 | 1.0 | 1.0 | 0.6 | 0 / 0.1 | 0.2 |
| Orman | 3.7 | 6.0 | 4.8 | 1.1 | 1.0 | 1.7 | 0.6 / 0.4 | 1.6 |
| Mağara | 4.3 | 1.7 | 4.6 | 0.8 | 1.0 | 1.0 | 0.8 / 1.1 | 1.3 |
| Kale | 0.1 | 4.0 | 5.5 | 0 | 1.0 | 1.1 | 0.1 / 0.3 | 1.9 |
| Taverna (ortada) | 1.9 | 3.6 | 3.5 | 0 | 1.0 | 0.6 | 0 / 0.1 | 0.7 |
| Taverna (uzakta) | 1.4 | 4.0 | 5.0 | 0 | 1.0 | 1.6 | 0.1 / 0 | 0.7 |

Haritasız savaşta fırsat saldırısı yalnızca yükseklik değiştirirken tetiklenir. Yapay zekâ yükseklik değiştirmediği için orada sıfır.

## Değişimin nedenleri

- **Düz (3% → 25%):** Bu savaş yakın dövüşte, hep aynı yükseklikte geçer, iki özellik de koşulsuz işler:
  - Spirit Guardians savaş başına ~6 save açar (yapılınca ve her düşmanın tur sonunda; haritasızda aynı yükseklikteki bütün düşmanlar yayılımda).
  - Sneak Attack'ın yandaş koşulu her turda tutar.

  Bunlara ek olarak Hunter's Mark ve Second Wind (savaş başına 1.6) partiyi ayakta tutuyor: ort. düşmüş PC 4.42 → 3.48. Yine de hedefin çok altında.
- **Çöl (43% → 61%):** En büyük katkı Spiritual Weapon'dan: savaş başına 6 ek büyü saldırısı. Yaylar çölde dezavantajlı olduğu için güç (yakın dövüş büyü saldırısı, yay değil) burada değerli. Bunu Second Wind (2.3) ve Action Surge izliyor. Sneak Attack azdır (1.1): Sela'nın yayı çölde dezavantajlı, dezavantajda Sneak Attack olmaz.
- **Volkan (99% → 99%):** Değişmedi. Neden hâlâ harita: kara düşmanları tek altıgenlik adacıklardan teker teker geliyor.
- **Orman (39% → 46%):**
  - Hunter's Mark (6 isabet) ve Sneak Attack (3.7): orman yakın dövüşe zorlar, yandaş koşulu sık tutar.
  - Spiritual Weapon (4.8).

  Kazancı kısmen yiyenler: düşmanların fırsat saldırıları ve konsantrasyonun sık bozulması (1.6).
- **Mağara (40% → 43%):** Az değişti:
  - Hunter's Mark karanlıkta görülmeyen hedefe taşınamıyor (1.7 isabet).
  - En çok fırsat saldırısını düşmanlar burada yapıyor (1.1). Dar geçitlerde parti erişimden çıkarken saldırı yiyor.
  - Berabere 6% → 8%: karanlıkta Spirit Guardians'ın hız yarılaması ve fırsat saldırısı korkusu yerinden kıpırdamayı azaltıyor.
- **Kale (43% → 53%):** Spiritual Weapon (5.5) ve Hunter's Mark (4.0). Sneak Attack neredeyse yok (0.1): Sela surdan uzak menzilde atıyor, hedefin yanında müttefik olmuyor.
- **Taverna ortada (21% → 99%):** Asıl neden kural değişikliği: masum ölümü artık kaybettirmiyor. Eski 21%'in neredeyse tamamı masum kaybıydı (eski ort. tur 2.3). Masumlar düşmanlara çok yakın ve ölüyor (0.72/4 kurtarılıyor). Düşmanlar ilk turlarını masumlara harcadığı için parti kolay kazanıyor.
- **Taverna uzakta (79% → 94%):** Kural değişikliği, eski 21% kaybın masum kaybından gelen kısmını kaldırdı. Spiritual Weapon ve Hunter's Mark kalanı getirdi. Masumların 3.68/4'ü kurtuluyor. Düşmanlar masum yerine partiye yöneldiği için ölen PC biraz arttı (0.22 → 0.42).

## Yay dezavantajı nereden geliyor (görev 3)

**Kaynak: veri güdümlü ortam kuralı. Yapay zekâ veya siper hesabı hatası değil.**

`data/environments.json` içinde şu ortamlarda bir kural var: `{"category": "weapon", "keywords": [...], "effect": "disadvantage"}`.

| Ortam (id) | Anahtar kelimeler | Not | Kullanan harita |
|---|---|---|---|
| Çöl / kavurucu sıcak (`l-kavurucu-s-cak`) | bow, crossbow | "Sıcak ve kum nişanı bozar" | çöl |
| Orman (`orman`) | bow, crossbow, javelin | "Ağaçlar atışı engeller" | orman |
| Yeraltı / mağara (`yeralt-ma-ara`) | bow, crossbow, javelin | "Dar alan ve karanlık atışı bozar" | mağara, zindan |
| Fırtına / yağmur (`f-rt-na-ya-mur`) | bow, crossbow, javelin, sling | "Rüzgâr ve yağmur atışı bozar" | ada ve gemi fırtınalı varyant |
| Sualtı / bataklık (`sualt-batakl-k`) | bow, crossbow, javelin, sling | "Suda atış güçleşir" | bataklık |
| Dağ / uçurum (`da-u-urum`) | bow, crossbow, javelin, sling | "Sert rüzgâr atışı saptırır" | dağ |

**Kod yolu:**
- `src/rules/modes.ts`, `environmentSources(env, tag)`: kuralın `keywords` listesini saldırının küçük harfli `tag` metninde alt dize olarak arar ve eşleşince dezavantaj kaynağı ekler.
- `tag` nereden gelir:
  - Karakterde silahtan: "ırk sınıf silah hasartürü", `weapons.ts`.
  - Canavarda: "ad saldırı hasar metni", `monsters.ts`.
- Kural haritanın her altıgeninde ve her mesafede uygulanır. Kaynağı konum değil, ortamdır.
- Yapay zekânın "kötü koşul" kontrolü (`poorOdds`) bu dezavantajı görür ve yakın dövüşe yürür. Bu bir tepki, kaynak değil.

**SRD 5.2.1 ile uyum** (Environmental Effects, s. 195; Underwater Combat, s. 16):
- **Dağ ve fırtına:** SRD'deki *Strong Wind* kuralı ile uyumlu: "ranged attack rolls with weapons" dezavantajlı. Sapan ve cirit dahil, doğru.
- **Sualtı / bataklık:** SRD'de sualtında menzilli silah saldırısı normal menzilde dezavantajlı, normal menzil ötesinde otomatik ıska. Bu kural yalnızca dezavantajı uyguluyor. Bataklığın tamamı "sualtı" sayılmamalı: SRD kuralı su altında savaşmak içindir.
- **Çöl, orman, mağara:** SRD'de karşılığı yok, ev kuralı:
  - Çöl sıcağı SRD'de yalnızca saatlik CON save ve Exhaustion.
  - Ormanın ve mağaranın etkisi SRD'de görüş (Lightly/Heavily Obscured) ve siperle verilir. Haritada bunu zaten siper altıgenleri, karanlık kuralı ve `sandstorm` kuralı yapıyor. Aynı etki iki kez sayılmış oluyor.

**Tasarımla uyum:** Harita sistemi siperi ve görüşü altıgen altıgen modelliyor. Ortamın yaylara harita boyu düz dezavantaj vermesi bunu gölgeliyor. Kael ve Sela çöl, orman ve mağarada savaş boyu dezavantajlı atıyor; Sela'nın Sneak Attack'ı da dezavantaj yüzünden tutmuyor.

**İki küçük kod bulgusu:**
- Eşleşme saldırının menzilli olup olmadığına bakmıyor. Javelin'in **yakın dövüş** seçeneği de ("javelin" kelimesi geçtiği için) orman, mağara, fırtına, bataklık ve dağda dezavantajlı oluyor.
- Kuraldaki `category: "weapon"` alanı kodda hiç kullanılmıyor.

**Düzeltme önerisi (uygulanmadı):**
1. Bu kural yalnızca menzilli saldırılara uygulansın: `environmentSources` çağrısına `ranged` bilgisi geçilsin, `category: "weapon"` kuralları yalnızca `ranged` iken eşleşsin.
2. Çöl, orman ve mağaradan bu kural kaldırılsın. Etkiyi harita kuralları zaten veriyor (siper, karanlık, kum fırtınası). İstenirse yalnızca "uzun menzilde ek dezavantaj" gibi daha dar bir ev kuralı yazılsın.
3. Fırtına ve dağ kalsın (SRD Strong Wind).
4. Sualtı / bataklık kuralı yalnızca sualtı altıgenlerine bağlansın ve SRD'deki "normal menzil ötesi otomatik ıska" eklensin.

## Sayı değişikliği önerileri (ilk yeniden ölçüme göre; yerini yukarıdaki güncel öneriler aldı)

Hedef %60–80. Canavar değerleri değişmesin; yalnızca senaryodaki düşman sayıları ayarlansın.

| Senaryo | Şu an | Öneri | Gerekçe |
|---|---:|---|---|
| Düz | 25% | Hill Giant çıkar (4850 → 3050 XP) | Haritasız savaşta siper, menzil ve kaçış yok; düşmanların hepsi ilk turdan vurur. 3050 XP, 5. seviye 5 kişi için "orta-yüksek" bütçe. |
| Çöl | 61% | Değişiklik yok | Hedefte. |
| Volkan | 99% | Önce harita: düşman başlangıç bölgesi adacıklardan kara köprüsüne alınsın; sonra gerekirse 2 Wolf yerine 1 Wyvern (uçan) | Kara düşmanları adacıklardan tek tek geliyor; yalnızca sayı artırmak sorunu çözmez. |
| Orman | 46% | Minotaur of Baphomet çıkar (4550 → 3850) | Yay dezavantajı düzeltilirse (yukarıdaki öneri) tek başına ~10 puan kazandırabilir; önce o, sonra yeniden ölç. |
| Mağara | 37% (9% berabere) | Owlbear çıkar (3950 → 3250) | Karanlık artık etkili (%54 aydınlık); yay dezavantajı düzeltilince yeniden ölç. Berabere oranı da düşmeli. |
| Kale | 53% | 2 Hobgoblin Warrior çıkar (3950 → 3750) | Hedefin hemen altında; küçük bir azaltma yeter. |
| Taverna (uzakta, varsayılan) | 94% | 1 Tough ekle ya da 1 Bandit Captain daha (2550 → ~2650–3000) | Kural değişikliğinden sonra fazla kolay. Ortadaki yerleşim (99%) aynı düşmanlarla. |

**Sıra:**
1. Önce yay kuralı düzeltilsin. Bu, çöl, orman ve mağarayı birlikte etkiler.
2. Sonra yeniden ölçülsün.
3. Ardından sayı değişiklikleri yapılsın.

## Görev K7: Magic Missile / Scorching Ray yukarı slot dartı (hızlı regresyon, 100 tohum)

HEAD'e karşı 4 senaryo (Mağara karanlık, Dungeon koridor, Kale gündüz, Volkan), standart ve paladin partisi, 3. ve 5. seviye. 3. seviyede değişiklik yok (2. seviye yuva yok). ±3 puanı aşan tek satır:

| Parti | Seviye | Senaryo | Önce | Sonra | Fark |
|---|---|---|---|---|---|
| paladin | 5 | Mağara — karanlık | 70% | 74% | +4 |

Diğer satırlar ±1 puan içinde (standart 5: Dungeon 84% → 83%). Neden: 5. seviye büyücü yukarı slotla atınca Magic Missile/Scorching Ray artık SRD'deki ek dartı/ışını alıyor.

## K20: Celestial ırkı, tür karşılaştırması (2026-11-03)

`npm run sim:irk -- 100 --senaryo col,kale` (standart parti, bütün üyeler aynı türde; Çöl + Kale; seviye başına 200 savaş; Celestial ev kuralı açık). Seviye 2 ve 4'te senaryoların kendi düşman listesi yok (5. seviye listesi kullanılır, oran ≈ %0), karşılaştırmaya alınmadı.

| Tür | Sv 1 | Sv 3 | Sv 5 | Sv 9 | Ort. |
|---|---|---|---|---|---|
| celestial | 74% | 87% | 74% | 55% | 72.5% |
| human | 84% | 90% | 76% | 60% | 77.5% |
| dwarf | 75% | 91% | 79% | 64% | 77.2% |
| elf | 68% | 79% | 36% | 43% | 56.5% |
| gnome | 68% | 82% | 71% | 59% | 70.0% |
| goliath | 69% | 83% | 68% | 62% | 70.5% |
| halfling | 72% | 85% | 71% | 62% | 72.5% |
| orc | 87% | 94% | 85% | 73% | 84.8% |
| tiefling | 86% | 96% | 71% | 81% | 83.5% |
| dragonborn | 86% | 84% | 77% | 83% | 82.5% |

Dokuz SRD türünün ortalaması %75.0; Celestial %72,5 (fark −2,5 puan): ±5 puan kabul aralığında, değer ayarı yapılmadı. Aralık dışı ama bu görevin konusu olmayan: Elf %56,5 (5. seviyede %36) ve Orc/Tiefling/Dragonborn %82–85 (ölçüm notu; tür ayarı yapılmadı).

## Denge turu (2): Elf yeniden ölçüm (yapay zekâ düzeltmesi sonrası, 2026-11-03)

`npm run sim:irk -- 100 --senaryo col,kale --seviye 1,3,5,9 --irk elf` (varsayılan soy Drow). Neden: dört Drow aynı düşmanlara sırayla Faerie Fire atıyor, Fireball ve Extra Attack yerine (DECISIONS.md "Denge turu (2)"); `controlArea` düzeltildi.

| Tür | Sv 1 | Sv 3 | Sv 5 | Sv 9 | Ort. |
|---|---|---|---|---|---|
| elf (önce) | 68% | 79% | 36% | 43% | 56,5% |
| elf (sonra) | 68% | 83% | 64% | 54% | 67,3% |

Dokuz SRD türü ortalamasının (%75,0) altında ama ±10 içinde; 9. seviye düşüklüğü Elf'e özgü değil (Celestial %55, insan %60). Orc (%84,8), Tiefling (%83,5), Dragonborn (%82,5) yüksek: SRD tür özellikleri (Relentless Endurance, soydan Fire Bolt, nefes silahı); değer değiştirilmedi.

## 2026-11-04 — Kuyruk K48 C: Karadul Çemberi ↔ Toprak Çemberi (k18-druid partisi, 100 tohum, Çöl/Kale/Mağara/Orman)

`npm run sim:karadul -- 100 --seviye N --alt <alt sınıf>`. Hedef: fark ±5 puan. SRD'de Druid'in tek alt sınıfı Toprak Çemberi (Moon/Sea/Stars SRD 5.2.1'de yok); karşılaştırma ona göre.

| Seviye | Toprak | Karadul (ilk) | Karadul (1. ayar) | Karadul (2. ayar, son) | Fark | Durum |
|---|---|---|---|---|---|---|
| 3 | %88 | %79 | %86 | %86 | −2 | aralıkta |
| 7 | %41 | %18 | — | %19 | −22 | **aralık dışı** |
| 11 | %47 | %31 | %32 | %40 | −7 | **aralık dışı** |
| 15 | %22 | %14 | %15 | %19 | −3 | aralıkta |

- 1. ayar: yapay zekâ örümcek biçiminden (tuzak turu değilse ve slot varken) çıkıp büyüye döner; Büyüleyici Bakış 3. seviyeden bonus eylem (`bakis.bonusSeviye` 6 → 3).
- 2. ayar: her zaman hazır Karadul büyüleri (Toprak'ın çember büyülerinin karşılığı): Ray of Sickness, Web (3), Stinking Cloud (5), Blight (7), Cloudkill (9).
- Açık: 7. seviyedeki büyük fark (6. seviyede gelen Giant Spider biçimi + Tatlı Tuzak döngüsü yakın dövüşe sokuyor olabilir). Ölçüm/ayar "Dungeondex öncesi tam test turu"na kaldı (hafif doğrulama modu: en çok birkaç deneme).

## Kuyruk A2: canavar saldırı ekleri hızlı regresyon (30 tohum, seviye 5, standart parti; sayı ayarı yok)

A2 bağlamalı canavar içeren 4 senaryo (Çöl: Mummy, Death Dog; Volkan: Fire Elemental, Magmin; Ork Kampı: Tough Boss, Worg; Mielikki Gölü: Merrow). Sürüm 30 (A2 ekleri açık) ile sürüm 29 (`KURAL_SURUMU=29`, eski davranış).

| Senaryo | Kazanma 29 → 30 | Ort. ölen PC 29 → 30 | En az 1 ölüm 29 → 30 | Ort. tur 29 → 30 |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 97% → 97% | 0,07 → 0,10 | 7% → 10% | 7,2 → 7,3 |
| Volkan | 97% → 97% | 0,27 → 0,27 | 17% → 17% | 6,3 → 6,3 |
| Orman — Ork Kampı | 100% → 100% | 0,03 → 0,00 | 3% → 0% | 5,9 → 5,6 |
| Orman — Mielikki Gölü | 100% → 100% | 0,00 → 0,00 | 0% → 0% | 3,2 → 3,2 |

Fark 30 tohumda gürültü içinde (en çok bir savaş); aralık dışı satır yok. Mummy laneti (HP kazanamaz) Çöl'de ölümleri hafif artırıyor görünüyor; 30 tohumda anlamlı değil.

## Görev P0: ek paket ilkelleri hızlı regresyon (30 tohum, seviye 5, standart parti; paket kapalı, sayı ayarı yok)

A2 ile aynı 4 senaryo, kural sürümü 30 (P0 sürüm değiştirmedi). Paket yüklü değilken ortak kancalar (isabet kancası, `attackedAdvBy`, büyü hasarı eklentisi) hiçbir şey üretmez.

| Senaryo | Kazanma A2 → P0 | Ort. ölen PC A2 → P0 | En az 1 ölüm A2 → P0 | Ort. tur A2 → P0 |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 97% → 97% | 0,10 → 0,10 | 10% → 10% | 7,3 → 7,3 |
| Volkan | 97% → 97% | 0,27 → 0,27 | 17% → 17% | 6,3 → 6,3 |
| Orman — Ork Kampı | 100% → 100% | 0,00 → 0,00 | 0% → 0% | 5,6 → 5,6 |
| Orman — Mielikki Gölü | 100% → 100% | 0,00 → 0,00 | 0% → 0% | 3,2 → 3,2 |

Sonuçlar A2 ile birebir aynı; aralık dışı satır yok.

## Kuyruk P6: ilkel genişletme hızlı regresyon (30 tohum, seviye 5, standart parti; paket kapalı, sayı ayarı yok)

Aynı 4 senaryo, kural sürümü 30 (değişmedi). Ortak kancalar (ikinci şans türleri, `pkSans` türetimi, isabet tepkisi hasar dönüşü, erişim eki, büyü dönüşümü) paketsiz savaşçıda hiçbir şey üretmez.

| Senaryo | Kazanma P0 → P6 | Ort. ölen PC P0 → P6 | En az 1 ölüm P0 → P6 | Ort. tur P0 → P6 |
|---|---:|---:|---:|---:|
| Çöl — Gündüz | 97% → 97% | 0,10 → 0,10 | 10% → 10% | 7,3 → 7,3 |
| Volkan | 97% → 97% | 0,27 → 0,27 | 17% → 17% | 6,3 → 6,3 |
| Orman — Ork Kampı | 100% → 100% | 0,00 → 0,00 | 0% → 0% | 5,6 → 5,6 |
| Orman — Mielikki Gölü | 100% → 100% | 0,00 → 0,00 | 0% → 0% | 3,2 → 3,2 |

Birebir aynı; aralık dışı satır yok.
