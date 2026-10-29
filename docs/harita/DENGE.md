# Denge ölçümü (Adım 11, yeniden ölçüm)

5. seviye 5 kişilik parti (Bor, Mira, Tavi, Sela, Kael), her senaryo 200 savaş, tohum 1–200, iki taraf da yapay zekâ ile. Komut: `npm run sim -- 200`. Hedef: parti galibiyeti %60–80. Canavar sayıları ve değerleri değiştirilmedi.

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
