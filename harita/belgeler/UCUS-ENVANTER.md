# Uçuş envanteri (Kuyruk U1a, Görev 0)

Durum: kural sürümü 60 (`wip/k72`). Bu belge U1a'nın çıkış noktasıdır: uçuşun bugün nereden geldiği, nasıl çalıştığı ve
çelişkiler. Değişiklikler ve kararlar DECISIONS.md "Kuyruk U1a" girdisinde. Ek paket içeriği (`icerik/`) bu kopyada
yok: paket özellikleri yalnız kimlik/ad düzeyinde, ikinci el belgelerden.

## 1. Uçuşun çekirdeği

| Parça | Yer | Davranış |
|---|---|---|
| Uçuş hızı | `src/battle/flight.ts` `flySpeed` | Kendi `fly` (canavar/çağrı/biçim) ile süren etkilerin `fly`'ının en büyüğü. |
| Havada mı | `fliesOrHovers`, `isAirborne` | Uçuş hızı > 0 ya da `airborne` etkisi (Levitate); K68b'den beri tırmanma hızıyla duvarda. **İrtifa 0'daki uçan da havada sayılır.** |
| Zemin etkileri | `zones.ts` `affects` (`spec.ground`), `zoneMoveCost`, `maprules.ts` (`flying`: tehlikeli zemin, lav kenarı, batak, derin su, buz, tuzak, çukur), `surfaces.ts`, `hexResolver.ts`, `surfaceMix.ts`, `ignite.ts`, `wilds.ts`, `desert.ts`, `forest.ts`, `deepWater.ts` | Havadaki her şeyden muaf: zorlu arazi, zemin alanı, yüzey, lav, derin su, tuzak, çamur. Tek ayrım yok: "uçuyor" ya da "yerde". |
| İrtifa | `altitude.ts` (S2, sürüm 41+) | `altitudeFt`, `vertical_move`; komut sonunda `staysUp` değilse düşer (K71b `fall`, hasarlı). Levitate süzülerek iner. |
| Üst sınır | `altitudeCapFt`, `flyCapFt` | Tavanlı haritada tavan − boy; açık gökte `ucusUstFt` (varyant ya da `data/dikey.json` 60 ft). **Yaratık başına sınır yok.** |
| Prizma ızgarası (K71c, 58+) | `cells.ts`, `airMove.ts` | Düzey = ⌊irtifa / 5⌋; Medium 1 düzey. Birleşik uçuş `move.toFt` A* ile; engel tepesine yeten irtifada engelin üstünden geçer (K71a), duramaz. |
| Erişim (K9) | `altitude.ts` `reachFt` | Bant aralığı × 5 ft. Yerdeki Medium (düzey 0) ile 5 ft'teki Medium (düzey 1) arası 5 ft: 5 ft erişimle vurulur. |
| Yüksek zemin (K8, 59+) | `heights.ts` `highGroundK8`, `cover.ts` `highGroundOf` | İki uç yerde (irtifa 0) ise. İrtifa 0'daki uçan "yerde" sayılır ve avantaj alır/verir. |
| Duruş yüzeyi (K72, 60+) | `stand.ts` | Sur tepesi ve kat döşemesi; üstündeki yaratık yerde sayılır (düşmez). Döşeme uçuşu keser (`slabOk`). |

## 2. Uçuş kaynakları

### 2.1 Ek paket `ucus` ilkeli (Görev P0)
- Alanlar: `hizFt` (formül ya da `"yurume"`; varsayılan yürüme hızı), `sure` (tur ya da `"kalici"`). Ortak alanlar: `tetik` (`pasif`, `bonus`, `eylem`, `savasBasi`), `kaynak` (ayrı `kaynak` ilkeline başvuru), `kosul`, `ad`.
- Yorum: `paket/core.ts` `passiveBody` → süren etki `{ fly }`; düğmede `untilOf(sure)`.
- Yok: irtifa sınırı, hız çarpanı, dakika cinsinden süre, ilkelin kendi kullanım sayısı, zemin ayrımı, zorunlu iniş, seviye eşiği.
- Kurgusal fikstür: `tests/fixtures/paket-pilot.json` (bonus, 30 ft, 3 tur).

### 2.2 Büyüler (`data/spells*.json`, sürüm 60'ta aynen kalır)
| Büyü | Etki | Not |
|---|---|---|
| Fly (3) | `fly: 60`, 100 tur, konsantrasyon | Bitince düşer (K71b). Veri notu (`a8.sigmayan`) "yükseklik modeli yok" diyor: eskimiş. |
| Levitate (2) | `airborne`, `levitate`, `speedZero` | Uçuş hızı yok; yükselme `vertical_move`/`levitateRiseEvents`, bitince süzülerek iner. |
| Gaseous Form (3) | `fly: 10`, `speedZero`, direnç | Yürüme 0, uçuş 10. |
| Jump, Spider Climb | `jumpFt`, `climb` | Uçuş değil (karşılaştırma için). |

### 2.3 Sınıf ve alt sınıf
- **Wild Shape** (`druid.ts`): biçim tablosu `class-features.json` `forms` = `{2: [4, 1/4, uçuşsuz], 4: [6, 1/2, uçuşsuz], 8: [8, 1, uçuşlu]}`. Uçuş 8. seviyeden (SRD). Biçimin `fly`'ı `shape_changed` ile.
- **Draconic Sorcery: Dragon Wings** (14, `data/subclasses.json`, `kind: wings`, `apex.ts`): 60 ft, 1 saat; durum `calisir`. U1a'da dokunulmaz.
- Alt sınıflara bu kuyrukta uçuş verilmez (U1b).

### 2.4 Irk
- **Dragonborn Draconic Flight** (SRD 5.2.1, 5. seviye): **var.** `src/battle/species.ts` `speciesParts` (`srdK19` anahtarı, varsayılan açık): bonus eylem, `selfEffect` 100 tur (10 dk), `fly = speed`, kaynak `draconicFlight` 1 (uzun dinlenme). SRD kaydı `data/srd/species.json` `draconic-flight`. Dokunulmaz.
- **Celestial Kırık Kanat** (`src/battle/celestial.ts`, `data/celestial.json` `awakening.secenekler.kirik-kanat`, `flyFraction: 0.5`): Göksel Uyanış (3+, bonus eylem, 10 tur, uzun dinlenmede bir) seçeneği. Ana etkide `glide` (yürüme hızının yarısı, 5'e aşağı); kendi turunun başında alt etki `ev:celestial/glide` (`fly`), tur sonunda biter. Seviye eşiği yok.

### 2.5 Çağrılar
- R3 (`data/summons.json`, `summons.ts`): Draconic Spirit `fly: 60`; Otherworldly Steed `fly: 60` (yuva 4+); Giant Insect biçimleri (K19); familiar biçimleri canavar verisinden (hawk, owl, raven, bat uçar).
- Ek paket `cagir` + paket `yaratiklar`: `hiz: { "ucma": N }` → `Monster.fly` (`paket/index.ts` `creatureMonster`); `canavar: "<SRD id>"` verilirse canavarın kendi uçuşu.
- Çağrılan uçan yaratık sıradaki ayrı savaşçıdır: `flySpeed`, `vertical_move`, `move.toFt`, YZ hava seçimi (`airSpots`, `cruiseMove`) ona da işler (U1a testinde doğrulandı).

### 2.6 Canavar
- `data/monsters.json` `fly`; `monsterAbilities.ts` (yarı uçuşla kaçış), `boss.ts` `flyHalf`, uçan boss yapay zekâsı (`bossFlight`).

## 3. Ek paket uçuş özellikleri (yalnız kimlik)

`icerik/` bu kopyada yok; `harita/belgeler/ENVANTER-JETON-VE-BUYU.md` alt sınıf listesinden uçuşla ilgisi adından belli olanlar:

| Sınıf | Alt sınıf kimliği | Ad | Seviye |
|---|---|---|---|
| ranger | `ejder-muhafizi` | Ejder Muhafızı | 15 (kullanıcı: çağrılan ejderha uçar, binek yok) |
| monk | `ejderha-disiplini` | Ejderha Disiplini | bilinmiyor |

Kalan uçuş özelliklerinin listesi U1b'de kullanıcıdan gelecek (`npm run check:icerik` yerelde).

## 4. Çelişkiler

1. **`ucus` ilkelinde kademe yok.** Kalıcı, kısa süreli, süzülme ve zorunlu iniş aynı alanla yazılamıyor. Süre tur cinsinden (1 dk = 10 tur), kullanım ayrı `kaynak` ilkeli ister.
2. **Yaratık başına irtifa sınırı yok.** Bütün uçuşlar haritanın üst sınırını kullanıyor; "en çok 5 ft" yazılamıyor.
3. **"Havada" tek kip.** Uçan her zemin etkisinden muaf, lav ve derin su dahil. Süzülmenin "yere değmez ama lav ve derin su işler" ayrımı için ikinci bir kip gerekiyor.
4. **K8 ve irtifa 0'daki uçan.** `highGroundK8` yalnız irtifaya bakar: irtifa 0'da uçan yerde sayılır. Kullanıcı "süzülene K8 verilmez (uçanlar gibi)" diyor. Uçanlar yalnız irtifa > 0'dayken K8 dışı.
5. **Kırık Kanat "yere iner" yazar, motor düşürür.** Tur sonunda süzülme biter; havadaysa komut sonunda K71b `fall` (hasarlı). Oyuncu kendi turunda inmezse düşer: metindeki "inmen gerekir" zorunluluğu böyle uygulanıyor.
6. **Kırık Kanat seviyeden bağımsız.** 13. seviye geçişi yok.
7. **Fly büyüsünün veri notu eskimiş.** `a8.sigmayan` "uçuş bitince düşme yok, yükseklik modeli yok" diyor. K68/K71'den beri irtifa ve düşme var.
8. **Paket yaratık hızı gevşek doğrulanıyor.** `hiz` alanı tip `save` (serbest nesne): bilinmeyen anahtar (`ucus`) sessizce yok sayılır; doğru anahtar `ucma`.
9. **Gaseous Form'un hız düzeni.** `fly: 10` + `speedZero` uçuşu yürümeden ayırıyor. Süzülmenin "hız = yürüme hızı" kuralıyla aynı yolu kullanmamalı (süzülme yürümeyi değil uçuşu verir).
10. **Draconic Flight anahtara bağlı.** `srdK19` kapalıyken (Game Master) Dragonborn uçamaz. Kalıcı ırk özelliği olsa da eski kayıtlarla uyum için böyle kalır.
11. **Levitate + uçuş sınırı.** Levitate uçuş hızı vermez. Yaratık başına sınır gelirse Levitate'in yükselişini kısmamalı (kendi kuralı var).
12. **Sur tepesi ve kat (K72) ile sınır.** Duruş yüzeyindeki yaratık havada değil. Yaratık başına uçuş sınırı onu tepeden indirmemeli (sınır yalnız uçarken).
