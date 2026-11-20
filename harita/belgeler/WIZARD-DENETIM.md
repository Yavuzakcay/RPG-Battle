# Wizard sınıfı denetimi: SRD 5.2.1 ↔ oyun (satır satır)

> 2026-11-20, kural sürümü 79. **Yalnız denetim:** kod, veri ve test değişmedi. Emin olunmayan satırlar geçici testle denendi
> (`src/battle/zzTmp*.test.ts`, iş bitince silindi; bu belge dışında depoya dosya girmedi).
> Kural listesi SRD metninden çıkarıldı: `data/srd/classes.json` (`wizard`), `data/srd/subclasses.json` (`evoker`),
> `data/srd/spells.json`, `docs/SRD_CC_v5.2.1.pdf` (`pdftotext`). Sayfa numaraları PDF sayfasıdır (SRD'deki basılı numarayla aynı;
> Ritual Adept hem JSON'da hem PDF'te s. 78). Kullanıcı ipucu listesindeki "hazırlanan büyü sayısı INT + seviye" 2014 kuralıdır;
> SRD 5.2.1'de sayı sınıf tablosundan gelir (Wizard Features, s. 77), oyun da böyle (A5).

## Kapsam notu ve sınırlar

- `icerik/` (gitignore) bu checkout'ta yok: **Evoker mekaniği depodaki fikstürden** okundu (`src/rules/fixtures/srd-alt-siniflar.json:1574`;
  CLAUDE.md: paketle "aynı kimlik ve mekanik"). Gerçek paketteki Türkçe adlar/metinler görülmedi; kitapçık–SRD seviye farkları
  `harita/belgeler/AS2-FARKLAR.md`'de ("Kayıt seviyesi korundu"). Mobil/APK'da `icerik/` olmadığı için Evoker paket
  içe aktarılmadıkça seçilemez (bilinen, DECISIONS AS2).
- Yalnız Wizard'a özel kurallar ve Wizard'ın dayandığı genel büyü kuralları (cantrip ölçeği, slot yükseltme, konsantrasyon, ritüel).
  Büyü bazlı mekanik farklar `harita/belgeler/BUYU-DURUM.md` / `ENVANTER-BUYULER.md` kapsamında (bilinen), burada tekrarlanmadı.
- Durum: **tam** / **kısmi** / **yok** / **sapma** (bilinçli sapma: karar kayıtlı ya da kayda alınması gereken). "Bilinen" = daha önce
  belgelenmiş konu (kaynak belirtildi).

## Özet

Toplam **52** satır: **tam 29**, **kısmi 11**, **yok 6**, **sapma 6**. Daha önce belgelenmiş ("bilinen") konu içeren satır: 11.

| Bölüm | tam | kısmi | yok | sapma | Toplam |
|---|---|---|---|---|---|
| A) Savaş içi | 11 | 6 | 2 | 2 | 21 |
| B) Oluşturucu / seviye atlama | 7 | 1 | 1 | 3 | 12 |
| C) Dinlenme, Serüven, kayıt | 6 | 0 | 2 | 1 | 9 |
| D) Yapay zekâ | 3 | 0 | 1 | 0 | 4 |
| E) Arayüz | 2 | 4 | 0 | 0 | 6 |

**Öne çıkan bulgular** (ayrıntı tabloda ve "Düzeltme önerileri"nde):

1. **Empowered Evocation çok zarlı büyülerde her zar için ekleniyor** (Magic Missile / Scorching Ray: +3×INT; SRD: bir hasar zarına). DECISIONS 4586 "büyü başına bir kez" diyor, kod farklı. (A19)
2. **Potent Cantrip yalnız save'li cantrip'te;** saldırı zarı ıskalayan Fire Bolt / Ray of Frost 0 hasar verir (SRD: yarı hasar). (A17)
3. **Evocation Savant yok:** Evoker kitabı SRD'ye göre 2–9 büyü eksik kalır (kitap sınırı artmıyor). (B5)
4. **Spell Mastery / Signature Spells** seçimi yalnız *hazırlanan* listeden; "her zaman hazır" değil (hazır sayısından yer kaplar), kitapta olup hazırlanmayan seçim sessizce düşer, "casting time Action" şartı yok, Signature'da iki kullanım ortak havuz. (A13–A15)
5. **Serüven'de büyücü büyülerini hiç değiştiremez ve seviye atlayınca kitap/hazır liste büyümez** (parti kaydı başlangıç anının kopyası). Bilinen (DECISIONS 3704), Wizard'da etkisi en belirgin. (C7, C8)
6. Ritual Adept (kitaptan hazırlamadan ritüel) **uygulanmıyor** (veride "ok"); Find Familiar/Phantom Steed için büyü hazırlanmış olmalı. (A10)

## Tablo

Kanıt biçimi: `dosya:satır`; "T#" = geçici test (aşağıda "Geçici test dökümü").

### A) Savaş içi (ve savaşta kullanılan sınıf kuralları)

| # | SRD kuralı (sayfa) | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| A1 | Büyü yeteneği INT; kayıt DC/saldırı (s. 77) | `casting.ability: int`; `spellSaveDc = 8 + yetkinlik + INT` | tam | `data/classes.json` (wizard), `src/battle/create.ts:326` | — |
| A2 | Cantrip sayısı 3 → 4 (4.) → 5 (10.) (s. 77) | Tablodan; 20 seviyenin hepsi SRD satırıyla aynı | tam | T8, `src/rules/builder.ts:159-170` | — |
| A3 | Cantrip hasarı 5/11/17. **karakter** seviyesinde artar (s. 25, büyü metinleri "Cantrip Upgrade") | `tierOf` toplam seviye: Fire Bolt 4→1, 5→2, 11→3, 17→4 zar; True Strike ek Radiant 1d6/2d6/3d6 | tam | T9, `src/battle/spells.ts:126`, `data/spells.json` `scalesWithLevel` | — |
| A4 | Slot tablosu 1–20 (s. 77–78) | `deriveStats.spellSlots` SRD ile 20/20 aynı; yetkinlik bonusu de aynı | tam | T8 | — |
| A5 | Hazır (prepared) sayısı: tablo sütunu (INT + seviye değil) | `spellLimits().prepared` tablodan, 20/20 aynı | tam | T8, `src/rules/builder.ts:168` | — |
| A6 | Savaşta yalnız hazırlanan büyüler yapılır; kitaptakiler yapılamaz | Savaşçının `spellNames` = hazırlananlar (+ her zaman hazır, soy, Invocation); kitaptaki hazırlanmamış büyü savaşta yok | tam | T6, `src/battle/create.ts:237-246` | — |
| A7 | Slot yükseltme: büyü slot seviyesinde yapılır (s. 104) | Wizard'ın 58 SRD büyüsünden (yukarı slot metinli, savaş dışı/çalışmıyor hariç) 50'sinde `upcast.applied`; Magic Missile (+1 dart), Scorching Ray (+1 ışın) doğrulandı. Uygulanmayanlar: Animate Dead, Confusion, Conjure Minor Elementals, Dispel Magic (veri var, uygulanmıyor); Dominate Monster/Person, Etherealness, Mass Suggestion (veri yok) | kısmi | T9, betik taraması (`data/spells*.json` ↔ `data/srd/spells.json`) | **bilinen** (Bilinen eksikler "Yukarı slot etkileri"; BUYU-DURUM) |
| A8 | Konsantrasyon: hasarda CON save DC max(10, yarı hasar) ≤ 30; başka konsantrasyon/eylemsizlik/ölüm bitirir (s. 179) | Aynen | tam | `src/battle/damage-effects.ts:84-94`, `src/battle/reduce.ts:140` | **bilinen** (genel) |
| A9 | Zırh eğitimi yoksa büyü yapılamaz; Wizard eğitimsiz (s. 77, 104) | `armorTraining: []`; eğitimsiz zırhta büyü yok | tam | `data/classes.json`, DECISIONS "K9d-kalkan" | **bilinen** |
| A10 | **Ritual Adept:** kitaptaki ritüel büyüyü hazırlamadan ritüel yap (s. 78; genel kural: ritüel için hazır olmalı, s. 104) | Uygulanmıyor. Savaşta "ritüel" yalnız kurulum çağırması (Find Familiar, Animate Dead, Phantom Steed) ve **büyü `spellNames`'te (hazır) olmalı**; kitapta olup hazırlanmayan Find Familiar kurulumda yok. Diğer ritüel büyüler savaş dışı (`offCombat`), Serüven'de savaş dışı büyü yapılmıyor. `class-features.json` durumu `ok` (not: "savaş dışı") | kısmi | T6, `data/class-features.json:1298`, `src/battle/economy.ts:381`, `src/MapBattle.tsx:3160` | DECISIONS 3290 (Kuyruk 19 (5): "savaş dışı gerekçeyle tamamlandı") |
| A11 | Ritüel bayrağı (SRD'de 29 büyü) | Oyun verisinde `ritual` alanı yok; `castingTime: 'ritual'` yalnız Find Familiar ve **Animate Dead** (SRD: Animate Dead "1 minute", ritüel değil; oyun savaşta yapılmasın diye aynı bayrağı kullanıyor) | sapma (düşük) | veri taraması (betik), `data/spells.json` | — (yeni gözlem) |
| A12 | **Spell Mastery** (18): seçilen 1. ve 2. seviye büyü en düşük seviyede slotsuz, istenildiği kadar; yüksek seviye için slot (s. 79) | `spellMastery` kaynağı (99 kullanım); slotLevel verilmezse kaynak harcanır, slotLevel verilirse slot | tam | T9b/T9c, `src/battle/economy.ts:81-95`, `src/battle/slots.ts:25` | DECISIONS 3230 |
| A13 | Spell Mastery büyüleri **kitaptan** seçilir ve **her zaman hazırdır** (hazır sayısından düşmez; s. 79, s. 77 "always prepared") | Seçim yalnız `spellNames` (hazır liste) içinden (`known=spellNames`); seçilen büyü hazır sayısından yer kaplar. Kitapta olup hazırlanmamış seçim savaşta sessizce düşer; o seviyede başka büyü de atanmaz | kısmi | T5b, `src/screens/builder/Features.tsx:208-216`, `src/screens/Builder.tsx:654`, `src/battle/create.ts:339-352` | DECISIONS 3230 ("seçilmezse hazırlanan ilk") |
| A14 | Spell Mastery büyüleri **casting time "Action"** olmalı (s. 79) | Kontrol yok; yalnız `reaction` dışlanır. Bonus eylemli Misty Step seçilebilir, seçim yoksa o seviyedeki ilk hazır büyü (Misty Step dahil) atanır. 1 saat/ritüel süreli büyü (Find Familiar) de uygun sayılır | yok | T5, `src/battle/create.ts:344-346` | — |
| A15 | **Signature Spells** (20): iki 3. seviye büyü, her biri kısa/uzun dinlenmede **bir kez** slotsuz; her zaman hazır (s. 79) | Ortak `signatureSpells` havuzu = 2 kullanım (aynı büyü iki kez, diğeri hiç yapılabilir); büyüler hazır listeden (A13); kısa dinlenmede yenilenir. Veri notu bunu açıkça söyler | kısmi | T5, T10, `data/class-features.json:625-640,1680` | DECISIONS 3230; veri notu |
| A16 | **Potent Cantrip** (Evoker 3): save'li cantrip başarıda yarı hasar | Uygulanıyor (alan ve tek hedef yolları) | tam | `src/battle/spells.ts:105,298,814`, `src/battle/wizard.test.ts:61` | DECISIONS 4586 |
| A17 | Potent Cantrip: **saldırı zarı ıskalayınca** yarı hasar (s. 82) | Uygulanmıyor: Fire Bolt ıska → 0 hasar (`potentCantrip` yalnız `saveDamage` çağrılarında) | yok | T1, `src/battle/spells.ts:105` (tek kullanım 298, 814); `src/battle/wizard.test.ts` ıska denemesi yok | DECISIONS 4586 yalnız "save'li" diyor; ıska boşluğu yazılı değil |
| A18 | **Sculpt Spells** (6): Evocation büyüsünde **görebildiğin** 1 + büyü seviyesi kadar yaratık save'i otomatik geçer, yarı hasar da almaz (s. 82) | Otomatik seçim; yalnız dostlar, sırayla ilk N (büyücü dahil: SRD "diğer yaratıklar"); "görebildiğin" denetimi yok; yalnız alan büyüsü yolunda (`executeAreaCast`): kalıcı alan/duvar/boncuk tetikleri bakmaz; kapsanan yaratık tamamen etkilenmez (hasar ve ek etki yok) | sapma | T3, `src/battle/spells.ts:209-211`, `src/battle/wizard.test.ts:61-70` | DECISIONS 4586 ("otomatik … büyücü dahil") |
| A19 | **Empowered Evocation** (10): Evocation büyüsünün **bir** hasar zarına INT eklenir (s. 82) | INT hasar ifadesine eklendiği için **her zar/ışın/dart'a** eklenir: Magic Missile (3 dart) +15, Scorching Ray (3 ışın) +15, Fireball +5 (INT +5). Okul kontrolü var, "Wizard büyüsü" (liste) kontrolü yok | kısmi (hatalı) | T2, `src/battle/spells.ts:115` (`damageExpr`), ışın döngüsü `:853-880` | DECISIONS 4586 "büyü başına bir kez: tek zar toplamına" → **kod kayıtla çelişiyor**; test yok |
| A20 | **Overchannel** (14): 1–5. seviye slotla hasar veren Wizard büyüsünde azami hasar; ilk kullanım bedelsiz; sonrakilerde slot seviyesi başına 2d12, her kullanımda +1d12 Necrotic, direnç/bağışıklık yok sayılır (s. 82) | Doğru: azami zar (Fireball 8d6 = 48), 2./3./4. kullanımda 2×/3×/4× slot-seviyesi d12 (slot 3: 6d12/9d12/12d12), Necrotic direnç+bağışıklıkla bile tam hasar; 6+ slot, cantrip, slotsuz yapım reddedilir; aç/kapa düğmesi | tam | T4, `src/battle/apex.ts:277-325`, `src/battle/spells.ts:438-448`, `src/battle/k19tier4b.test.ts:160` | DECISIONS 3244 |
| A21 | Epic Boon (19; "Boon of Spell Recall" önerilir) (s. 79) | Seçim var; Boon etkileri çoğunlukla yok | kısmi | Bilinen eksikler "Feat'ler" | **bilinen** |

### B) Oluşturucu ve seviye atlama seçimleri

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| B1 | Kitap: 6 (1. seviye) + her sonraki seviyede 2 (s. 77) | `spellbook = 6 + 2 × (seviye − 1)`, 20 seviyede doğru; kitap sayacı "Büyü kitabı N / M" | tam | T8, `src/rules/builder.ts:168`, `src/screens/Builder.tsx:1034` | — |
| B2 | Kitaba eklenen büyü, slotun olduğu seviyeden olmalı | `spellOptions` en yüksek slot seviyesine kırpılır; üstü seçilemez/uyarılı | tam | `src/rules/builder.ts:186-196,380-385` | — |
| B3 | Hazırlananlar kitaptan seçilir | Hazırla düğmesi kitapta değilse kapalı; kitaptan çıkarılan hazırdan da düşer; kayıt "kitapta değil" uyarısı verir | tam | `src/screens/Builder.tsx:1002-1019`, `src/rules/builder.ts:381-385` | — |
| B4 | Eski kayıt: kitap alanı yok | Kitap = hazırlananlar (`spellCounts`) | tam | `src/rules/builder.ts:183` | — |
| B5 | **Evocation Savant** (Evoker 3): kitaba 2 (≤ 2. seviye) Evocation büyüsü bedelsiz; yeni slot seviyesine erişince +1 (s. 82) | Yok (`status: none`/`hikaye`, "savaş dışı"). Kitap sınırı artmaz → Evoker 3. seviyede 2, 20. seviyede 9 büyü eksik (3. seviyede 2; 5, 7, 9, 11, 13, 15, 17'de +1) | yok | T13, `src/rules/fixtures/srd-alt-siniflar.json` (`evocation-savant` `hikaye`), `data/class-features.json` | **bilinen** (ENVANTER-DIGER.md:18, AS2-FARKLAR.md:83); sonucu (kitap kapasitesi) yazılı değil |
| B6 | **Scholar** (2): yetkinlik olduğun Arcana/History/Investigation/Medicine/Nature/Religion'dan birinde uzmanlık (s. 78) | Liste SRD ile aynı (Insight yok), yetkinlik şartı motor tarafında zorunlu (yetkinlik dışı uzmanlık hata), oluşturucu listeyi denetler | tam | `data/class-features.json:1309`, `src/rules/builder.ts:416-420`, `src/rules/stats.ts:229` | — |
| B7 | Spell Mastery / Signature Spells seçimi (kitaptan) | Seçici yalnız hazırlananları listeler; "otomatik" seçeneği var; kitaptan seçilemez (A13) | kısmi | `src/screens/builder/Features.tsx:208-216` | DECISIONS 3230 |
| B8 | ASI/feat 4/8/12/16, Epic Boon 19 yuvaları (s. 79) | Tablo yuvaları var, seçim paneli var | tam | `src/rules/advancement.ts`, T12 | **bilinen** (genel) |
| B9 | Wizard alt sınıfı 3. seviyede; SRD'de yalnız Evoker (s. 78, 82) | Evoker dış pakette/fikstürde; yeni karakterde varsayılan öneri `evoker` (`alt-sinif-gorunum.json varsayilan`); Evoker özellik seviyeleri (3/3/6/10/14) fikstürde SRD ile aynı | tam (paket görülemedi) | `data/alt-sinif-gorunum.json`, fikstür `:1574` | **bilinen** (AS2, APK'da paket yok) |
| B10 | Büyü kopyalama: kitaba 2 saat + 50 GP/seviye, kitaptan kitaba 1 saat + 10 GP/seviye, defter kaybı; Spell Scroll'dan kopyalama Arcana DC 10 + seviye (s. 78, 244) | Yok: altın/zaman ekonomisi ve defter nesnesi yok, büyü kitabı serbest seçim | sapma (bilinçli kapsam dışı) | `src/rules/builder.ts` (maliyet yok) | — (ayrı karar yazılı değil) |
| B11 | Hazır büyüleri uzun dinlenmede değiştir (herhangi sayıda), cantrip değiştir (uzun dinlenme), **Memorize Spell** (5, kısa dinlenmede 1 büyü) (s. 77, 79) | Dinlenme şartı yok: kayıtlı karakterde büyü listesi savaşlar arasında her an serbest düzenlenir | sapma | `data/class-features.json:1659` (not: "bu özelliği kapsar") | DECISIONS 4585 ("Memorize Spell savaş dışı"); not açık |
| B12 | Seviye atlarken kitaba 2 büyü | Oluşturucuda toplam sınır; hangi seviyede eklendiği izlenmez (retroaktif seçim mümkün, SRD'de seviye atlama anındaki slotlarla sınırlı) | sapma (düşük) | `src/rules/builder.ts:168` | — |

### C) Dinlenme, Serüven, kayıt

| # | SRD kuralı | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| C1 | **Arcane Recovery** (1): kısa dinlenmede, toplam seviyesi ≤ ⌈Wizard seviyesi / 2⌉, 6. seviye ve üstü slot yok; uzun dinlenmeye dek bir kez (s. 78) | Doğru: L5 → bütçe 3 (3. seviye slot geri), L18 5. seviye slotlar, L19 bütçe 10 → iki 5. seviye slot (üç tane eksik olsa da bütçe 10); kaynak 0'lanır, uzun dinlenmede 1'e döner | tam | T7, T7b–T7d, `src/rules/characterRest.ts:110-131,170-181`, `src/battle/wizard.test.ts:47` | DECISIONS 4585 |
| C2 | Arcane Recovery: **hangi slotların** geri geleceğini oyuncu seçer; kullanmak isteğe bağlı ("you can choose") | Otomatik, en yüksek slottan; **eksik slot varsa ilk kısa dinlenme hakkı yakar** (tek 1. seviye slot eksikken bile, T7); erteleme/seçim arayüzü yok | sapma | T7, `src/rules/characterRest.ts:114-118` | DECISIONS 4585 ("seçim arayüzü yok; en değerli slot önce") |
| C3 | Signature (kısa/uzun), Spell Mastery/Overchannel/Arcane Recovery (uzun) yenilenme | Kısa dinlenme: Signature 2'ye döner, AR/Overchannel/Mastery değişmez; uzun: hepsi dolar | tam | T10 | — |
| C4 | Eski kayıt (kaynak yok) | `currentStatus` eksik kaynağı en çok değerle ekler (K10) | tam | T11, `src/rules/characterRest.ts:60-75` | **bilinen** (K10) |
| C5 | Serüven kısa/uzun dinlenme (dinlenme düğümü, han) | Kısa: `shortRestStatus` (AR çalışır, 2 hak/uzun dinlenme ev kuralı); uzun: `longRestStatus` | tam | `src/journey/engine.ts:126-137`, `src/journey/seruven.ts:277` | — |
| C6 | Savaş sonrası slot/kaynak karakterde kalır | Aynı durum yolu | tam | `src/rules/characterRest.ts` (K10) | **bilinen** |
| C7 | Uzun dinlenmeden sonra hazır büyü/cantrip/Spell Mastery değiştirme (s. 77, 79) — Serüven | **Serüven'de yok:** parti, seçim anındaki `sheet` kopyası; Serüven içinde karakter düzenlenemez, dinlenmeden sonra liste sabit. (C-B11 serbest düzenleme yalnız Serüven dışı karakter ekranında) | yok | `src/journey/seruven.ts:225`, `src/screens/SeruvenScreen.tsx:169` | yeni (bilinen "seviye atlama" ile ilişkili) |
| C8 | Seviye atlarken kitaba +2 büyü, hazır sayı artışı, alt sınıf (3.), ASI | Serüven `level_up` yalnız `sheet.level` artırır: kitap/hazır liste/ASI/alt sınıf seçimi yok (kod okumasıyla, denenmedi: 1. seviyeden başlayan büyücü 3+'da alt sınıfsız, hazır sayısı eski kalır). Sınıf özellikleri seviyeye göre otomatik gelir | yok | `src/journey/seruven.ts:285-291,398`; `migrateSubclasses` yalnız kayıtlı karakter yüklenirken (`src/rules/builder.ts:454-462`) | **bilinen** (DECISIONS 3704 "Karar bekleyen") |
| C9 | Kaydet/yükle: Overchannel yeni olay türü üretmiyor (`feature_used`, `effect_tick`); yeni kaynaklar `currentStatus` ile tamamlanır | Kayıt sürümü gerekmedi | tam (replay denenmedi) | `src/battle/apex.ts:310-321` | — |

### D) Yapay zekâ

| # | Kural | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| D1 | Slotsuz (Spell Mastery/Signature) büyüler | `castable` slotsuz yapılabilen büyüyü uygun sayar; `slotLevel` verilmediği için önce serbest kaynak harcanır | tam | `src/battle/ai.ts:330`, T9c | — |
| D2 | Overchannel | YZ hiç kullanmaz (`overchannel` bayrağı yalnız arayüzden) | yok | `grep overchannel src/battle/ai*` boş | DECISIONS 3244 YZ'den söz etmiyor |
| D3 | Potent Cantrip / Sculpt Spells / Empowered Evocation | Pasif, YZ da etkilenir (A17–A19 hataları YZ büyücüsüne de geçer) | tam (A17–A19 kusurlarıyla) | `src/battle/spells.ts` | — |
| D4 | Arcane Recovery, Memorize Spell, hazırlık değişimi | Savaş dışı; YZ'nin işi yok | tam | — | — |

### E) Arayüz (kart, düğme, TR/EN metin)

| # | Konu | Oyunda | Durum | Kanıt | DECISIONS / bilinen |
|---|---|---|---|---|---|
| E1 | Kitap/hazır sayaçları ve düğmeler | "Kitaba ekle / Kitapta / Hazırla / Hazırlandı", "Büyü kitabı N / M" TR+EN | tam | `src/i18n/strings.ts:302-304`, `strings.en.ts:285-287` | — |
| E2 | Overchannel düğmesi ve açıklaması | Büyü seçicisinde aç/kapa, TR+EN metin | tam | `src/MapBattle.tsx:362-378`, `strings.tr2.ts:312`, `strings.en.ts:985` | — |
| E3 | Slot seçici: "alt seviye" düğmesi serbest kaynaklı büyüde **slotsuz** yapım demek (`onChange(l === levels[0] ? null : l)`), varsayılan işaretli düğme slot gösterir ama kaynak harcanır; slot harcayıp serbest kullanımı saklamak mümkün değil | yanıltıcı (Signature'da taktik seçenek kaybı) | kısmi (düşük) | `src/MapBattle.tsx:400-424` | — |
| E4 | Kaynak göstergeleri | Savaş kartında `Spell Mastery 99` (sınırsız yerine sayaç düşer 99→98…) ve savaşta kullanılamayan `Arcane Recovery 1` çipi | kısmi (düşük) | `src/MapBattle.tsx:450-451`, `src/rules/classFeatures.ts:359-366`, T10 | — |
| E5 | Dinlenme paneli | Arcane Recovery'nin hangi slotu geri verdiği bildirilmez (genel "kısa dinlenmede yenilenen kaynaklar doldu") | kısmi (düşük) | `src/i18n/strings.ts:100` | — |
| E6 | Özellik açıklamaları | TR: Ritual Adept "hazırlamadan ritüel olarak yaparsın" (A10'a aykırı vaat), Signature "birer kez" (ortak havuz), Arcane Recovery otomatik/6+ yasağı belirtilmiyor, Memorize Spell "kısa dinlenmede" (sınırsız); EN açıklamalar çoğunlukla ilk cümle | kısmi (düşük) | `data/aciklamalar.json:135-141,274-280` | — |

## Geçici test dökümü (silindi)

`npm ci` (yalnız `node_modules`, gitignore'da) sonrası `vitest` ile üç geçici dosya. Sonuçlar:

- **T1** `Fire Bolt` + `potent-cantrip`, saldırı ıskalar → `hit:false, appliedDamage:0`, hedef HP 60/60 (A17).
- **T2** INT +5, Evocation: Magic Missile 12 → 27 (+15), Scorching Ray 24 → 39 (+15), Fireball 32 → 37 (+5) (A19).
- **T3** Fireball + `sculpt-spells`: bitişik dost etkilenmez; alandaki büyücü ve dost kapsanır, etkilenen listesinde yalnız düşman (A18).
- **T4** Overchannel Fireball (3. slot): zarlar [6×8]; kullanım 1 bedelsiz, 2: 6d12 = 42, 3: 9d12 = 63, 4: 12d12 = 84 (Necrotic direnç+bağışıklık varken); 6. seviye slot "Overchannel 1–5…" reddi (A20).
- **T5/T5b** Seviye 20 sheet: `freeSpells` {Magic Missile, Misty Step → spellMastery; Fireball, Lightning Bolt → signatureSpells}; kitapta olup hazır olmayan Sleep seçimi → düşer; Misty Step (bonus eylem) seçimi kabul (A13–A15).
- **T6** Kitapta Find Familiar/Detect Magic var, hazır değil → savaşçı `spellNames` yalnız hazırlananlar (A10).
- **T7** Arcane Recovery uç durumlar; **T8** slot/cantrip/hazır/kitap/yetkinlik tablosu 20/20 SRD ile aynı; **T9** cantrip ölçeği ve yukarı slot; **T10** yenilenme; **T11** eski kayıt; **T12** seviyeye göre kazanılan özellikler; **T13** 3. seviye Evoker, 8 büyülük kitap → uyarı yok (kapasite 10).
- Büyü verisi taraması (betik): SRD Wizard listesi 218 büyü; oyunda yok yalnız tipografik apostrof farkı (`Arcanist’s Magic Aura`, `Dragon’s Breath` oyunda düz apostrofla var); `Wiz` etiketi eksik yok; konsantrasyon bayrağı farksız.

## Düzeltme önerileri

Etki = oyuncunun hissedeceği fark. "Kural sürümü" = hasar/sonuç değiştiği için (80) eski kayıt/replay kapısı gerekir mi.

| Sıra | Öneri | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|
| 1 | **Empowered Evocation tek zara** (A19): INT'i `damageExpr` yerine yalnız ilk hasar zarına/ışınına ekle; DECISIONS 4586 ile hizala; Magic Missile/Scorching Ray testi | orta (Evoker 10+ çok zarlı büyülerde ~3× fazla hasar) | **evet** (sonuç değişir; 80) | 0,5 gün |
| 2 | **Potent Cantrip ıskada yarı hasar** (A17): saldırı yolunda ıska olayına `potentCantrip` yarı hasar; "ek etki yok" (Chill Touch / Shocking Grasp ekleri) | orta-düşük | **evet** (1. ile aynı sürümde) | 0,5 gün |
| 3 | **Serüven'de büyücü yönetimi** (C7, C8): seviye atlamada kitap +2 / hazır sayı / alt sınıf seçimi, uzun dinlenmede hazır liste düzenleme (Serüven oturumunda karakter düzenleme kapısı). Önce kullanıcı kararı (DECISIONS 3704 "Karar bekleyen") | **yüksek** (Serüven oynayan her Wizard; sınıf mekaniği "doğru" ama kullanılamaz) | hayır (Serüven kaydı/oluşturucu; savaş sürümü değil) | 2–3 gün |
| 4 | **Evocation Savant** (B5): alt sınıf verisinde kitap bonusu alanı (`spellbookBonus`), `spellLimits` toplamı + oluşturucuda Evocation seçici; pakette (kullanıcı yerelinde `icerik/`) aynı alan | orta (Evoker kitabı 2–9 büyü eksik) | hayır (oluşturucu; savaşa yalnız hazırlananlar girer) | 1 gün + paket verisi |
| 5 | **Spell Mastery / Signature Spells** (A13–A15, B7): seçim kitaptan, seçilenler her zaman hazır (hazır sayısına girmez), Mastery'de "Action" casting time filtresi, Signature'da büyü başına ayrı kullanım (`signatureSpells:<büyü>`) | orta-düşük (yalnız 18+/20 ve "Üst seviye" açık) | Signature kaynak modeli için **evet**; filtre/seçim için hayır | 1–1,5 gün |
| 6 | **Ritual Adept** (A10): kitaptaki ritüel büyüler kurulum ritüelinde hazırlanmadan (Find Familiar, Phantom Steed); veri durumu `partial` ya da gerçek uygulama | düşük | hayır (savaş kurulumu) | 0,5 gün |
| 7 | **Arcane Recovery isteğe bağlı** (C2, E5): "Dinlenmede kurtar" onayı + slot seçimi (en az: yalnız eksik toplamı bütçeyi ≥ 1 aşıyorsa otomatik), sonucu bildir | düşük-orta | hayır | 0,5–1 gün |
| 8 | **YZ Overchannel** (D2): Evoker 14+ YZ büyücüsü, hasar büyüsünde bedelsiz ilk kullanımı (sonra bedel/can eşiği) kullansın | düşük | hayır (YZ kararı; denge için `sim -- --parti k18-wizard` 100 tohum) | 0,5–1 gün |
| 9 | **Arayüz** (E3–E6): slot seçici varsayılanı, sayaç "99" → "∞"/gizli, savaşta Arcane Recovery çipini gizle, açıklama metinlerini gerçek davranışa göre düzelt (TR/EN) | düşük | hayır | 0,5 gün |
| 10 | **Sculpt Spells** (A18): "görebildiğin" ve büyücü hariç kuralı, kalıcı alan/boncuk Evocation'ları için kapsam | düşük (kullanıcı kararı gerekli: otomatik seçim kayıtlı sapma) | evet (kapsam genişletirse) | 0,5 gün |
| 11 | Kitap kopyalama ekonomisi (B10) ve dinlenme şartlı hazırlık değişimi (B11) için **karar** yaz: bilinçli kapsam dışı mı; DECISIONS'a tek satır | bilgi | hayır | 15 dk |

Öneri sırası: 1–2 (kısa, sonucu değiştiren hatalar) → 3 (yüksek etki, karar gerekir) → 4 → 5–9. 1 ve 2 aynı kural sürümünde (80) birleştirilebilir.

## B93 düzeltmeleri (Görev B93, kural sürümü 93)

"Sürümlü": savaş davranışı değişti, 92 ve altı kayıt/replay eski davranışta. "Sürümsüz": veri, arayüz, oluşturucu ya da Serüven.

### A. Ortak

- A19 Empowered Evocation tek zara: **düzeldi** (sürümlü 93; `oneDieBonus.ts`; Magic Missile 3 dart +INT bir kez; test `b93.test.ts` A1).
- C7 / C8 Serüven'de seviye atlama (kitap +2, hazır sayı, alt sınıf, ASI) ve uzun dinlenmede hazır liste: **düzeldi** (sürümsüz; `levelChoices.ts`: cantrip dinlenmede 1, hazır liste dinlenmede hepsi, Spell Mastery seçimi dinlenmede 1, kitap yalnız eklenir). Memorize Spell (kısa dinlenme) Serüven'de yok: **ertelendi** (Serüven'de kısa dinlenme seçim penceresi yok).
