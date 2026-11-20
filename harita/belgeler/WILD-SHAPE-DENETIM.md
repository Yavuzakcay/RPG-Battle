# Wild Shape denetimi (SRD 5.2.1 ↔ oyun)

Yalnız denetim: kod, veri, test ve DECISIONS.md değişmedi. Tarih 2026-11-20, kural sürümü 91 (güncel).

**Kaynak.** Kurallar SRD metninden çıkarıldı: `data/srd/classes.json` (Druid özellikleri ve Druid Features tablosunun "Wild Shape" sütunu), `data/srd/subclasses.json` (Circle of the Land) ve `docs/SRD_CC_v5.2.1.pdf` (`pdftotext -layout`).

| SRD bölümü | Sayfa |
|---|---|
| Primal Order, Wild Shape, Beast Shapes tablosu | s. 42 |
| Wild Shape kuralları ("Rules While Shape-Shifted"), Wild Companion, Wild Resurgence, Elemental Fury, Improved Elemental Fury, Beast Spells, Archdruid | s. 42–43 |
| Circle of the Land | s. 46 |

**Senaryolar.** D bölümündeki senaryolar geçici bir test dosyasıyla gerçek motorda çalıştırıldı; dosya sonra silindi.

**"Bilinen".** Önceki Wild Shape durum denetiminde bulunanlar burada tekrar açılmadı, "bilinen" diye işaretlendi:
- yutma (Swallow) hataları
- süre sayacının olmaması
- Multiattack bileşiminin olmaması
- arayüzde canavar yeteneği düğmesinin olmaması
- biçimdeki eşyanın (Objects) olmaması
- yapay zekânın biçime yalnız slotu bitince girmesi

## Özet

76 kural satırı:

| Durum | Sayı |
|---|---|
| Tam | 55 |
| Kısmi | 6 |
| Yok | 5 |
| Bilinçli sapma / kapsam dışı | 5 |
| Bilinen (önceki denetim) | 5 |

**Yeni bulgular** (önceki denetimde yoktu):
- `multiHex` açıkken Large biçim dolu altıgenle çakışabiliyor (sığma denetimi yok).
- Beast Spells'in malzeme istisnası yok: 18. seviyede biçimde Stoneskin (tüketilen, bedelli malzeme) yapılabiliyor.
- Wild Companion'ın familiar'ı Fey olmuyor.
- Eşyanın kurtarma eki biçimde korunuyor, AC eki korunmuyor (tutarsız).
- Wild Resurgence'la kazanılan slot savaş sonunda karaktere yazılmıyor.
- Yapay zekâ seçili biçimler arasında en güçlüyü değil veri sırasındaki ilkini alıyor ve biçimden hiç çıkmıyor.
- Savaş kurulumunda başlangıç biçimi yok.
- Uzun dinlenmede yalnız bir biçim değiştirme kuralı yok (oluşturucuda serbest).
- Biçim ve geçici HP savaşlar arasında sürmüyor.

## A) Wild Shape özelliği (SRD s. 42–43)

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| A1 | Bonus eylemle biçime girme | `wild_shape` bonus eylem harcar | tam | `economy.ts:324–325`; `druid.test.ts` "bonus eylemle biçim…" | 2026-10-30 Görev DRUID |
| A2 | Yalnız bu özellik için öğrenilmiş (bilinen) biçim | seçilmişse yalnız bilinen biçimler; 87+ geçersiz seçimler sayılmaz | tam | `druid.ts:142–146`, `:67–71` | WS87 |
| A3 | Kullanım sayısı tablodan (2. sv 2, 6. sv 3, 17. sv 4) | kaynak "Wild Shape" sütunundan | tam | `class-features.json:116` (`uses.column`), `data/srd/classes.json` tablo | Görev DRUID |
| A4 | Kısa dinlenmede bir kullanım geri gelir | `recharge.short: 1` | tam | `class-features.json:116`; D9 | Görev DRUID |
| A5 | Uzun dinlenmede hepsi geri gelir | `recharge.long: all` | tam | `characterRest.ts` `fullStatus`; D10 | Görev DRUID |
| A6 | Bilinen biçim sayısı 4 / 6 / 8 (2., 4., 8. sv) | veride tablo | tam | `class-features.json:1010–1026`, `druid.ts:42–47` | Görev DRUID |
| A7 | En yüksek CR 1/4 / 1/2 / 1 | aynı tablo | tam | `druid.ts:53`; `druid.test.ts` "biçim sınırları SRD tablosundan…" | Görev DRUID |
| A8 | Uçuş hızı olan biçim 8. seviyeden | `fly` sütunu | tam | `druid.ts:53`; `wildShape87.test.ts` "2/4/8 × uçan/yüzen" | WS87 |
| A9 | Yalnız Beast stat blokları | `creatureTypeAt === 'beast'` (Giant Eagle 5.2.1'de Celestial, alınamaz) | tam | `druid.ts:53`; `shape91.test.ts` "Giant Eagle artık uygun değil"; D1 | D1, WS87 |
| A10 | Uzun dinlenmede bilinen bir biçim değiştirilebilir | WS92: Serüven'de parti çubuğundan (`form_swap`): boş yere ekleme her zaman, dolu listede uzun dinlenmeden sonra bir değişim; Serüven dışında oluşturucuda serbest (bilinçli: savaşlar arası karakter düzenleme) | tam | `builder/Features.tsx:96–140` (`FormPicker`) | yok |
| A11 | Süre: Druid seviyesinin yarısı kadar saat | sayaç yok; biçim savaş sonunda biter (savaş saatlerden kısa) | bilinçli (kullanıcı kararı, WS92) | `druid.ts:170–172` (yalnız 0 HP / Incapacitated) | yok |
| A12 | Biter: yeniden Wild Shape kullanınca | biçimden biçime geçiş, kullanım düşer | tam | `druid.ts:158`; `shape91.test.ts` "Brown Bear…ayıdan örümceğe"; D7 | WS91 |
| A13 | Biter: Incapacitated | her komut sonunda | tam | `druid.ts:171`; `druid.test.ts` "Incapacitated olunca biçim biter"; D5 | Görev DRUID |
| A14 | Biter: ölüm | 0 HP'de biter (Unconscious da Incapacitated) | tam | `druid.ts:171`; D4 | Görev DRUID |
| A15 | Bonus eylemle erken çıkış | biçimsiz `wild_shape` | tam | `druid.ts:156`; D6 | Görev DRUID |
| A16 | Biçime girince Druid seviyesi kadar geçici HP | `temp_hp`; birikmez (büyüğü kalır) | tam | `druid.ts:165`, `reduce.ts:785–788`; D1, D7 | Görev DRUID |
| A17 | HP korunur; hasar önce geçici HP'den, kalan gerçek HP'den | biçim `hp`'ye dokunmaz; taşan hasar gerçek HP'ye, büyük hasarla anında ölüm | tam | `reduce.ts:919–950`; D4 | Görev DRUID |
| A18 | Yaratık türü korunur | biçim değerlerinde tür yok | tam | `druid.ts:85–93` | WS91 |
| A19 | Hit Points ve Hit Point Dice korunur | `hp`, `hitDice` biçimde değişmez | tam | `druid.test.ts` (`a.hp === c.hp`), `reduce.ts:919–950` | Görev DRUID |
| A20 | INT, WIS, CHA korunur | yalnız STR/DEX/CON biçimden | tam | `druid.ts:84`; D1 (WIS aynı) | WS87 |
| A21 | Oyun değerleri stat bloğundan: AC, hız, boyut, STR/DEX/CON | aynen | tam | `druid.ts:84–86`; D1 | Görev DRUID |
| A22 | Sınıf özellikleri korunur | özellikler biçimde de kullanılır (Land's Aid biçimde de) | tam | `features` dokunulmaz (`reduce.ts:919–950`) | Görev DRUID |
| A23 | Feat'ler korunur | işaretler birleşir; Savage Attacker canavar saldırısında yok (SRD: "weapon") | tam | `shapeMonster.ts:70`, `features.ts:85` | WS91 |
| A24 | Kişilik, anılar, konuşma, diller | mekanik karşılığı yok | bilinçli (savaş dışı) | — | Görev DRUID (Druidic savaş dışı) |
| A25 | Kurtarma yetkinliği korunur, PB ile; stat bloğu yüksekse o | `wildSaves` | tam | `druid.ts:120–127`; `wildShape87.test.ts` "Wild Shape: kurtarma yetkinliği korunur…" | WS87 |
| A26 | Beceri yetkinliği korunur; stat bloğu yüksekse o | `wildSkills` (89+) | tam | `druid.ts:103–114`; `srdD3.test.ts` "89: yetkinlik biçimin değiştiricisiyle…" | D3 |
| A27 | Biçimin yetkinlikleri de kazanılır | stat bloğu becerileri eklenir | tam | `druid.ts:112` | D3 |
| A28 | Duyular stat bloğundan (Darkvision, Blindsight…) | biçiminki | tam | `shapeMonster.ts:66`; `shape91.test.ts` "Wolf: Pack Tactics, Darkvision 60…" | WS91 |
| A29 | Direnç/bağışıklık/zayıflık stat bloğundan (tür özellikleri korunmaz) | kendi ∪ biçim; tür özellikleri ve tür etkileri (ör. Human Resourceful) kalır | bilinçli sapma ⚠ | `shapeMonster.ts:63–70`; D1 (`resourceful` işareti biçimde) | WS91 ⚠ |
| A30 | Durum bağışıklığı ve canavar özellikleri (Spider Climb, Web Walker, Pack Tactics) | canavar kurulumunun tek girişinden | tam | `shapeMonster.ts`; `shape91.test.ts` "Giant Spider: Spider Climb + Web Walker…" | WS91 |
| A31 | Yüzme hızı stat bloğundan | `bicimYuzme` (varsayılan açık) | tam | `druid.ts:130–134`; `wildShape87.test.ts` "Crocodile: yüzme 30 ft…"; D1 (Giant Frog 30) | WS87 |
| A32 | Tırmanma ve kazma hızı | biçimin etkisi ve `burrowFt` | tam | `shapeMonster.ts:74`; `shape91.test.ts` "Brown Bear: tırmanma…" | WS91 |
| A33 | Uçuş hızı | biçiminki | tam | `druid.ts:86` | Görev DRUID |
| A34 | Saldırılar stat bloğundan (saldırı bonusu bloktan) | saldırı zarlı saldırılar silah seçeneği | tam | `druid.ts:76–80`; D1 | Görev DRUID |
| A35 | Multiattack | yalnız saldırı sayısı (bileşim serbest) | bilinen | `druid.ts:81`, `shapeMonster.ts:82` | WS91 tablosu |
| A36 | Save'li / şarjlı eylemler (Web) | canavar saldırısı olarak | tam | `shapeMonster.ts:81`; D1 (Giant Spider Web) | WS91 |
| A37 | Saldırı ekleri (Grappled, Prone, zehir) | canavar saldırısıyla aynı yol | tam | `features.ts:268`, `:394–400`; `druid.test.ts` "K13: biçim saldırısının ek etkileri…" | Görev DRUID (K13) |
| A38 | Bonus eylemler ve yetenekler (Leap, Swallow) | motor ve YZ kullanır; arayüz Yetenek düğmesi (51f0b8cb); yutma WS92'de SRD'ye uydu | tam | `monsterAbilities.ts:82–86`; önceki denetim | WS91 "Kalanlar" |
| A39 | Tepkiler | kendi + biçim | tam | `shapeMonster.ts:76` | WS91 |
| A40 | Legendary eylemler | Beast stat bloklarında yok | kapsam dışı | — | — |
| A41 | Büyü yapamaz | reddedilir | tam | `spells.ts:543–544`; D2 | Görev DRUID |
| A42 | Biçim konsantrasyonu bozmaz, yapılmış büyüyü etkilemez | konsantrasyon ve alan sürer | tam | `spells.ts:543` (yorum); D3 | Görev DRUID |
| A43 | Nesneleri biçimin uzuvlarıyla tutma | eşya kullanımı/bırakma/alma biçimde engellenmiyor | bilinen | `items.ts`, `heldItems.ts` (biçim denetimi yok) | WS91 "Kalanlar" |
| A44 | Ekipman yere düşer, kaynaşır (etkisiz) ya da giyilir | WS92 (92+): eşya kaynaşır: AC ve kurtarma eki (Cloak of Protection) biçimde işlemez, biçim bitince geri gelir; "giyilir" seçeneği yok (⚠ GM kararı) | tam | `druid.ts:116–125` (yorum: "yetkinlik, eşya, özellik" eki korunur), `druid.ts:86` (AC) | yok (WS87 "diğer kurtarma ekleri korunur" diyor, eşya ayrımı yok) |
| A45 | Boyut ve haritada yer (multiHex kapalı) | tek altıgen | tam | `CLAUDE.md` "Görsel ile mekanik ayrı" | Görev A6 |
| A46 | multiHex açıkken Large/Huge biçimin sığması | sığma denetimi yok: Brown Bear gövdesi dolu altıgenle çakıştı; **ertelendi** (kullanıcı kararı, WS92) | yok | `druid.ts:136–167` (`bodyFitProblem` yok); D (çok altıgen) | yok |
| A47 | Prone/Grappled biçim değişiminde sürer | koşullara dokunulmaz | tam | `reduce.ts:919–950` | — |

## B) Bağlı Druid özellikleri

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| B1 | Primal Order Magician: ek cantrip, Arcana/Nature'a WIS (en az +1) | ek cantrip; kontrol bonusu savaş dışı | tam | `class-features.json:2187`; `druid.test.ts` "Primal Order: Warden… Magician…" | Görev DRUID |
| B2 | Primal Order Warden: Martial silah, Medium zırh | aynen | tam | aynı test | Görev DRUID |
| B3 | Wild Companion: Magic eylemi, slot ya da Wild Shape kullanımı, malzemesiz Find Familiar | savaşta Magic eylemi; "Slotsuz" = Wild Shape kullanımı (`featuresK19`) | tam | `economy.ts:84`, `:388–392`; `summons.ts:287` | Kuyruk 19 (DECISIONS ≈4548) |
| B4 | Wild Companion familiar'ı Fey; uzun dinlenmede kaybolur | WS92 (92+): slot ya da Wild Shape kullanımıyla çağrılan familiar Fey; kaybolma savaş dışı | tam | `summons.ts:283–320` (tür yazılmıyor) | yok |
| B5 | Wild Resurgence: kullanım yokken slotla bir kullanım, turda bir, eylemsiz | aynen | tam | `druid.ts:197–205`; `druid.test.ts` "Wild Resurgence…" | Görev DRUID |
| B6 | Wild Resurgence: kullanımla 1. seviye slot, uzun dinlenmede bir | savaşta aynen; WS92: harcanmayan slot savaş sonunda karaktere yazılır (üst sınır tablonun en çoğu) | tam | `druid.ts:206–210`; `partyStatus.ts:50` (`min`) | yok |
| B7 | Elemental Fury: Potent Spellcasting (Druid cantrip hasarına WIS) | aynen | tam | `cleric.ts:231` | Görev DRUID |
| B8 | Primal Strike: turda bir silah ya da Beast saldırısı isabetinde 1d8 Cold/Fire/Lightning/Thunder, isabette seçilir | otomatik: her isabette kullanılır, hedefe en iyi işleyen tür | bilinçli | `cleric.ts:233–244`; `druid.test.ts` "Primal Strike…(Beast saldırısı dahil)" | Görev DRUID |
| B9 | Improved Elemental Fury: Potent Spellcasting'te +300 ft | `featuresK19` | tam | `range.ts:188–190` | Kuyruk 19 |
| B10 | Improved Elemental Fury: Primal Strike 2d8 | aynen | tam | `cleric.ts:240` | Görev DRUID |
| B11 | Beast Spells: biçimde büyü | `beast-spells` işareti büyü yasağını kaldırır | tam | `spells.ts:544` | Görev DRUID |
| B12 | Beast Spells istisnası: bedeli yazılı ya da tüketilen malzemeli büyü yapılamaz | WS92 (92+): biçimde reddedilir (`spellComponents` `gp`/`consumed`) | tam | `spells.ts:544`; D2 | yok |
| B13 | Archdruid Evergreen Wild Shape: inisiyatifte kullanım yoksa bir kullanım | savaş başında | tam | `commands.ts:402`, `druid.ts:256–260`; D (Evergreen) | Görev DRUID |
| B14 | Archdruid Nature Magician: kullanımları tek slota (2 seviye/kullanım), uzun dinlenmede bir, eylemsiz | `featuresK19` | tam | `druid.ts:185–194` | Kuyruk 19 (DECISIONS ≈4486) |
| B15 | Archdruid Longevity (yavaş yaşlanma; listedeki "Timeless Body" 5.2.1'de bu adla) | mekanik yok | kapsam dışı | — | — |
| B16 | Circle of the Land Land's Aid: Magic eylemi, Wild Shape kullanımı; biçimde de (büyü değil) | aynen; biçimde engel yok | tam | `druid.ts:213–253`; fikstür `srd-alt-siniflar.json` (`resource: wildShape`); `druid.test.ts` "Land's Aid…" | Görev DRUID |
| B17 | Nature's Sanctuary: Wild Shape kullanımı | aynen | tam | fikstür (`resource: wildShape`) | Kuyruk 19 (DECISIONS ≈4500) |
| B18 | Nature's Ward biçimde sürer (sınıf özelliği): direnç + Poisoned bağışıklığı | direnç birleşimde kalır, Poisoned `naturesWard` | tam | `classFeatures.ts:302`, `reduce.ts:165` | Görev DRUID (Poisoned notu eski), Kuyruk 18 |

## C) Oyun akışı

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS |
|---|---|---|---|---|---|
| C1 | Oluşturucuda bilinen biçim seçimi | sayı/CR/uçuş/tür sınırlı, "artık uygun değil" notu, yüzme hızı, TR/EN | tam | `builder/Features.tsx:96–140`; `strings.ts:127`, `:203`; `strings.en.ts:411`, `:487` | WS87 |
| C2 | Seçim yoksa | savaşta en yüksek CR'li N biçim | tam | `druid.ts:262–272` | Görev DRUID |
| C3 | Savaş kurulumunda başlangıç biçimi | WS92 (92+): kurulumda "biçimde başla" (Game Master ve Serüven kurulumu; kullanım harcanır, kurulumda çıkış yok) | tam | `app/setup.ts`, `GmScreen.tsx` (karşılık yok) | yok |
| C4 | Arayüzde giriş/çıkış | "Hayvan formu: X" / "Normal hâle dön" düğmeleri | tam | `MapBattle.tsx:1648–1651`; `strings.tr2.ts:478`, `strings.en.ts:1203` | Görev DRUID |
| C5 | Biçim kartı | jeton biçimin; WS92: çekmecede "Wild Shape biçimi: X · geçici HP N · savaş sonunda biter" satırı (TR/EN) | tam | `druid.ts:90` (`avatar`), `MapBattle.tsx` `Drawer` | yok |
| C6 | Günlük satırları | girdi / döndü (nedenle), TR/EN | tam | `log.ts:152`; `strings.tr2.ts:320`, `strings.en.ts:936` | Görev DRUID |
| C7 | Replay ve kayıt | biçim değerleri olayda; replay veriden bağımsız; kayıt sürümü değişmedi | tam | `druid.test.ts` (`r.replays()`), `shape91.test.ts` replay | WS91 |
| C8 | Yapay zekâ biçime girişi | yalnız slotu bitince, konsantre değilken | bilinen | `ai.ts:2041–2046` | Görev DRUID, WS91 "Kalanlar" |
| C9 | Yapay zekânın biçim seçimi | WS92 (92+): seçili biçimler arasında da en güçlüsü (CR, sonra HP) | tam | `druid.ts:269–271`, `ai.ts:2043` | Görev DRUID ("en güçlü bilinen biçime girer" yalnız seçimsizde doğru) |
| C10 | Yapay zekânın biçimden çıkması | WS92 (92+): biçimin geçici HP'si bitmiş, slotu olan (Beast Spells'siz) druid bonus eylemle döner | tam | `ai.ts:2041–2046` | yok |
| C11 | Savaş sonrası | kullanımlar, HP ve Wild Resurgence slotu karaktere yazılır; biçim ve geçici HP savaş sonunda biter | bilinçli (kullanıcı kararı, WS92) | `partyStatus.ts:40–58`; D10 | yok |

## D) Senaryo sonuçları

Geçici test dosyasıyla gerçek motorda çalıştırıldı; dosya silindi.

| Senaryo | Sonuç |
|---|---|
| Wolf (2. sv) | girer; AC 12, hız 40, Bite, saldırı/eylem 1, Darkvision 60, geçici HP 2, STR/DEX/CON biçimden, WIS korunur |
| Giant Frog (2. sv) | girer; AC 11, hız 30, yüzme 30, Bite, Darkvision 30, geçici HP 2 |
| Giant Spider (8. sv) | girer; AC 14, Large, Bite + canavar saldırısı Web, geçici HP 8 |
| Brown Bear (8. sv) | girer; AC 11, hız 40, Large, Bite + Claw, saldırı/eylem 2 (bileşim serbest: bilinen) |
| Giant Eagle (8. sv) | reddedilir: "Bu biçim bu seviyede alınamaz." (5.2.1'de Celestial) |
| Biçimde büyü (Produce Flame) | reddedilir: "Wild Shape biçiminde büyü yapılamaz." |
| 18. sv Beast Spells + Stoneskin (tüketilen 100 GP malzeme) | **yapıldı** (SRD: yapılamaz; B12) |
| Fog Cloud (konsantrasyon) açıkken aynı turda biçim | biçime girer; konsantrasyon ve bulut alanı sürer |
| 0 HP ve taşan hasar | 38 HP + 5 geçici: 12 hasar → 31 HP, biçim sürer. HP + 2 hasar → 0 HP, ölmekte, Unconscious, biçim biter, AC Druid'inki. 82 hasar → anında ölüm (büyük hasar kuralı) |
| Incapacitated (Stunned) | komut sonunda biçim biter |
| Bonus eylemle çıkış | aynı turda bonus eylem harcandıysa reddedilir; sonraki turda çıkar, kalan geçici HP kalır |
| Biçimde yeniden Wild Shape (Wolf → Giant Frog) | geçer, kullanım düşer, geçici HP büyüğü (1 → 2) |
| Kullanım bitince | reddedilir: "Wild Shape: kullanım kalmadı." |
| Kısa dinlenme (5. sv, 0 kullanım) | 1, ikinci kısa dinlenmede 2 |
| Savaş sonrası (biçimdeyken biter) | karakterde kullanım 1, HP aynı; biçim ve geçici HP yazılmaz; uzun dinlenme → 2; bilinen biçim sayısı oluşturucuda |
| Evergreen (20. sv, 0 kullanım) | savaş başında 1 |
| Çok altıgen açık, iki komşu dolu, Brown Bear | **biçime girer; gövde 3 altıgen, dolu bir altıgenle çakışır** (A46) |

## Bilinen (önceki denetim; burada açılmadı)

- **Yutma (Swallow): düzeldi (WS92, sürüm 92).** Total Cover, yutarken Bite yasağı, ceset çıkışı (5 ft + Prone), yutulan midede yutanla taşınır, `grapple` alanı temizlenir; yapay zekâ Swallow'u seçiyor (yoklandı). Ayrıntı DECISIONS WS92.
- **Süre:** Wild Shape süresi tutulmuyor (A11); WS92 kullanıcı kararı: biçim savaş sonunda biter, sayaç yok.
- **Multiattack:** bileşim yok, yalnız saldırı sayısı (A35).
- **Arayüz:** canavar yeteneği düğmesi yok (A38).
- **Eşya:** biçimdeki eşya modeli (Objects) yok (A43).
- **Yapay zekâ:** biçime yalnız slotu bitince giriyor (C8); WS92'de en güçlü biçimi seçiyor ve slot kazanınca çıkıyor (C9, C10).

## Düzeltme önerileri (yalnız yeni bulgular)

| # | Öneri | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|
| 1 | A46: `wildShapeProblem`'e gövde sığma denetimi (`movement.ts` `bodyFitProblem`). Sığmıyorsa reddedilsin (yalnız `multiHex` açıkken) | orta (yalnız çok altıgen açıkken; Large biçimler 4. sv'den) | gerekir (yeni red) | küçük: tek denetim + test |
| 2 | B12: Beast Spells'te bedeli yazılı ya da tüketilen malzemeli büyüyü reddet. Veri hazır: `rules/spellComponents.ts` `material.gp` / `consumed` | düşük–orta (18. seviye) | gerekir | küçük |
| 3 | B4: Wild Companion'la çağrılan familiar'ın türü Fey (Protection from Evil and Good, Magic Circle, Hallow türe bakar) | düşük | gerekir | küçük (`summons.ts` çağrı olayında tür alanı) |
| 4 | A44: eşya kaynaklı kurtarma eki biçimde ya kalksın (kaynaşma) ya da "giyilen eşya çalışır" diye bilinçli kaydedilsin. Bugün AC eki gidiyor, kurtarma eki kalıyor | düşük | kod değişirse gerekir; yalnız kayıtsa gerekmez | orta (eşya ekini sınıf/yetkinlik ekinden ayırmak) ya da küçük (yalnız DECISIONS) |
| 5 | A10: "uzun dinlenmede bir biçim değişir" kuralı ya oluşturucuda uygulansın (Serüven'de uzun dinlenmeye bağlı) ya da serbest düzenleme bilinçli diye kaydedilsin | düşük | gerekmez | küçük (kayıt) / orta (kural) |
| 6 | B6: Wild Resurgence'la kazanılan, harcanmamış slot savaş sonunda karaktere yazılsın (`partyStatus.ts:50` `min` üst sınırı) | düşük | gerekmez (savaş dışı durum) | küçük |
| 7 | C9: yapay zekâ seçili biçimler arasında da en güçlüyü seçsin (CR, sonra HP) | düşük–orta | YZ kararı; sim imzası değişir, önceki YZ görevleri gibi sürümle | küçük |
| 8 | C10: yapay zekâ biçimden çıksın (slot kazanınca ya da biçim kötü durumdayken) | düşük | YZ kararı, sürümle | orta |
| 9 | C3: Game Master kurulumunda "biçimde başla" (pusu senaryoları) | düşük | gerekmez (kurulum komutu; olay aynı) | orta |
| 10 | C11: biçim ve geçici HP savaşlar arasında sürsün (Serüven zinciri) | düşük | gerekmez; karakter durumu şeması değişir | orta |
| 11 | C5: çekmecede biçim kartı (biçim adı, kalan geçici HP, biçimin yetenekleri) | düşük | gerekmez (yalnız arayüz) | küçük–orta |
