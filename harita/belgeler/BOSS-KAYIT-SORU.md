# BOSS-KAYIT-SORU: üç ana boss için kayıt biçimi (A: canavar stat bloğu / B: karakter kâğıdı)

Yalnız okuma (2026-11-28, `origin/birlesik`). Kod, veri, mekanik değişmedi. Sayı uydurulmadı; aşağıdaki her
değer depodan ya da SRD tablosundan okundu. Alt sınıf özellikleri dış pakette (`icerik/`, depoda yok), bu yüzden
"Kayıp" sütununda alt sınıf satırları **doğrulanamadı** diye işaretli.

## 1) Düşman tarafına karakter kâğıdı konabilir mi?

**Motor kabul eder, kurulum vermez.**

- `createMapBattle(participants, …)` (`src/app/setup.ts`) hazır `Combatant[]` alır, tarafı sormaz; yerleşimi
  `c.side`'a göre yapar. Kâğıttan kurulan düşman motorda geçerlidir: `src/battle/reactions.test.ts` (Wizard kâğıdı,
  `side: 'enemies', ownerId: null`) ve `lycanthrope.ts` (karakterden düşman tarafı) bunu zaten yapıyor. Düşman
  tarafının yetkisi Game Master'da (`ai.ts` satır 134: `side === 'enemies'` → `gm`).
- Kurulum düşmana kâğıt koymaz: `combatantFromSheet` tarafı her zaman `'party'` yazar (`create.ts`);
  `BattlePlan.enemies` yalnız `{ monster, count }`; `planParticipants` düşmanları yalnız `combatantFromMonster` ile kurar;
  Game Master seçicisi (`GmScreen.tsx` satır 141) yalnız SRD canavarlarını ve özel canavarları listeler; Serüven düşman
  listesi canavar kimliği → adet (`Record<string, number>`, `seruvenBattle.ts`).
- Eklemek için yaklaşık **6–8 dosya, orta boy iş**: boss kâğıtlarının verisi (yeni `data/` dosyası), `setup.ts`
  (`BattlePlan`'da kâğıt düşman, `planParticipants`'ta `side: 'enemies', ownerId: null`, doğrulama), `GmScreen.tsx`
  (seçici), `seruvenBattle.ts` (Serüven düğümü), `strings.ts` + `strings.en.ts`, bir test. Ayrıca kimliğe bağlı
  yollar kâğıt düşmanı görmez (bkz. 2 ve 5): Serüven XP'si (`battleEnemyXp` `c.monsterId` ister) ve Hex zırh tetiği.

## 2) Kâğıttan kurulan düşmanda efsanevi eylem, LR, boss yapay zekâsı çalışır mı?

**Hayır; hepsi canavar kimliğine ya da canavar kaydına bağlı.**

| Sistem | Neye bağlı | Kâğıt düşmanda |
|---|---|---|
| Efsanevi eylemler | `boss.ts` `legendaryOf`: `formMonsterId(c)` → `data/efsanevi.json` `monsters[id]` | yok (`monsterId` yok) |
| Legendary Resistance | `combatantFromMonster`: `traits` metninden `/Legendary Resistance \((\d+)\/Day/` → `resources.legendaryResistance`; kullanım `effectDice.ts` yalnız kaynağa bakar | yok; kaynak elle eklenirse çalışır (kurulum işi) |
| Uçan boss YZ | `ai.ts` `bossFlightMove`: `legendaryOf(...)` şartı | yok |
| Faz 2 | `combatantFromMonster` `monster.faz2` kopyası | yok |
| Katalog güçleri (aura, ekler, Out-of-Time…) | `katalog109Data.ts` `gucOf(s, monsterId)` → `data/katalog-gucler.json` | yok |
| Canavar tepkisi / büyüsü / yeteneği / Multiattack planı | `monster-reactions.json`, `canavar-buyuleri.json`, `canavar-yetenekleri.json`, `multiattack.json`, hepsi kimlikle | yok |

Kâğıt savaşçıya sahte `monsterId` vermek bu yolları açar ama başka canavar aramalarını da (`getMonster`,
`srdD1`, tepkiler) tetikler; güvenli olduğu doğrulanmadı.

## 3) Çoklu sınıf kâğıdı motorda destekleniyor mu?

**Evet, kural sürümü 105'ten** (MC3 + MC4; şu anki sürüm 110). Ortak Spellcasting yuvası (`cok-sinif.json` `yuva`:
Wizard/Sorcerer `tam`, Paladin `yari`) + ayrı Pact Magic havuzu (`Combatant.pactSlots`, `cast_spell.pact`), büyünün sınıfı ve
sınıf başına DC/saldırı (`spellByClass`, `mc3.ts` `mcCastView`), kit/kaynak/Invocation sınıf başına o sınıfın seviyesiyle
(`mcImpl.ts`), `classLevels`, Channel Divinity `@<sınıf>`, Weapon Mastery en yüksek hak. En çok 3 sınıf
(`MAX_CLASSES`): üç boss sığar. SRD denetimi (`MC-SRD-DENETIM.md`): kesin sapma yok; kısmiler arayüz/sıra bilgisi
(AC seçimi yerine en yüksek; yapımdan sonraki turlarda DC okuyan az sayıda etki varsayılan sınıfı görür ⚠). Kalan MC8
(yeniden şekillenme) savaşı etkilemez.

Bu bosslar için yuva havuzu (SRD Multiclass Spellcaster tablosu): Mora 14 + 3 = 17. seviye büyücü + Warlock 3 Pact;
Hex 6 (Paladin 11 yarı, yukarı) + 4 = 10. seviye büyücü + Warlock 5 Pact; Tarvok yuvasız.

**⚠ Asıl engel paket:** sekiz alt sınıfın hepsi dış pakette (`aldatma-ogretisi`, `ceren-urperten`, `hortlak`,
`heybet-yolu`, `pehlivan`, `asi-yemin-bozan`, `kargisci`, `ilahi-kan`; `AS2-ENVANTER.md`). `icerik/` depoya girmez;
mobil/APK'da paket içe aktarılmadıkça bu alt sınıflar yok ("içerik eksik", alt sınıf özelliksiz). B seçeneğinde boss
cihazdan cihaza farklı güçte olur.

## 4) Stat bloğuna çevrilince ne taşınır, ne bozulur

Canavar karşılıkları motorda var olan alanlar: saldırı/`repeat`/Multiattack planı, `save`'li eylemler, direnç/bağışıklık,
`canavar-buyuleri.json` (`atWill` + `daily`, slot yok), `monster-reactions.json` (türler: `shield`, `counterspell`,
`parry`, `reduce`, `redirectAttack`…), `canavar-yetenekleri.json`, `efsanevi.json`, `faz2`, `katalog-gucler.json` auraları.

| Özellik | Canavar karşılığı | Kayıp |
|---|---|---|
| **Mora:** Wizard/Sorcerer büyü yuvaları (17. seviye) | `canavar-buyuleri.json` atWill/daily | Slot havuzu ve yukarı slot gider; günlük kullanım sayısına çevrilir (yaklaşık) |
| Shield, Counterspell | `monster-reactions` `shield`/`counterspell` | Yok gibi (slotsuz; kullanım sınırı veride) |
| Warlock Pact Magic (2 yuva) | daily kullanım | Kısa dinlenme yenilenmesi anlamsız (tek savaş): kayıp yok sayılır |
| Font of Magic / Metamagic | karşılık yok (genel ilkel yok) | Kayıp (ya da sabit Quickened/Twinned yeteneği elle) |
| Invocation'lar | çoğu sabit eylem ya da pasif | Kısmen; tek tek bakılmalı |
| Aldatma / Ceren Ürperten / Hortlak özellikleri | paket ilkelleri yalnız `Combatant.paket` (kâğıttan) | **Doğrulanamadı** (paket depoda yok); bilinen: Aldatma 10 "İkiz Büyüleme" (`buyuDegisimi.ikizOkul`) canavarda yok |
| **Tarvok:** Rage (direnç, hasar eki, STR avantajı) | sabit direnç + hasar zarı saldırıda | Aç/kapa, bonus eylem bedeli, bitme koşulları gider (hep açık sayılır) |
| Reckless Attack | karşılık yok (`marks` sınıf yolu) | Kayıp |
| Brutal Strike (9, 13) | karşılık yok (`brutal.ts` sınıf yolu) | Kayıp (ya da sabit rider) |
| Relentless Rage, Danger Sense, Feral Instinct, Fast Movement | kısmen: save avantajı, hız sabit; Relentless için karşılık doğrulanmadı | Kısmen |
| Extra Attack / Action Surge | Multiattack `repeat`; Action Surge için karşılık yok | Action Surge kayıp |
| Second Wind, Tactical Mind/Shift, Weapon Mastery | Weapon Mastery canavar saldırısında yok | Kayıp |
| Heybet Yolu / Pehlivan özellikleri | — | **Doğrulanamadı** (paket) |
| **Hex:** Paladin's Smite / Divine Smite | saldırıya sabit ek hasar (rider) | Slot harcayan seçim gider |
| Aura of Protection / Courage | `katalog-gucler.json` aura alanı (Kongark, Mirage örneği) | Kısmen; aura türü veride var mı tek tek bakılmalı |
| Lay On Hands, Channel Divinity, Abjure Foes | `canavar-yetenekleri.json` / efsanevi eylem | Kısmen (eylem olarak yeniden yazılır) |
| Radiant Strikes (11) | saldırıya ek radiant | Yok gibi |
| Warlock 5 Pact + Invocation, Sorcerer 4 Metamagic | yukarıdaki gibi | Mora satırları gibi |
| Asi / Kargışçı / İlahi Kan özellikleri | — | **Doğrulanamadı** (paket) |
| Eşyalar (Hex'in Paladin Zırhı, Kaltakkıran, mühür yuvaları) | eşya kancaları ve `withSockets` yalnız kâğıtta (`combatantFromSheet`) | Canavarda yok; etkileri stat bloğuna elle yazılır |

## 5) Mevcut boss veri kalıbı ve 5c tetiği

Örnek `titan-of-nightmare`, `dragon-of-hexonia-a/-b`. Dosyalar:

| Dosya | Alanlar |
|---|---|
| `data/canavarlar-kadim.json` | `canavarlar[]`: `id`, `name`, `size`, `ac`, `hp`, `speed`/`fly`/`swim`, `avatar`, `abilities`, `saves`, `skills`, `cr`, `multiattack`, `faz2` (`esik`, `not`), `attacks[]` (`bonus`, `damageDice`, `damageType`, `rider`, `reachFt`, `repeat`, `save`, `range`), `traits` (LR "(N/Day)" buradan); `dex` (tür, alignment, `conditionImmunities`), `yer`, `ozellikler` (Dungeondex satırları). Üretici `node scripts/katalog-f2-kadim.mjs` (kaynak `KATALOG-F2-OZELLIKLER.md`; elle düzenlenmez) |
| `data/efsanevi.json` | `monsters[id]`: `uses`, `actions[]` (`id`, `tr`/`en`, `kind` save/quake/teleport…, `oncePerTurn`, `save`, `dc`, `area`, `damage`, `damageType`) |
| `data/katalog-gucler.json` | `canavarlar[id]`: `auralar`, `faz2`, `ekler`, `saveEk`, `hedefSayisi`, `alanBirak`, `pasif`, `s110` (üretici `python scripts/katalog-gucler.py`) |
| `data/boss-gorsel.json` | jeton görseli (`ana`: `hex`, `tarvok`, `mora` zaten var) |
| `data/dungeondex-gorsel-esleme.json` | Dungeondex vitrini |

Kadim kayıtlar `katalogMonsters`'a yüklenir, `getMonster` bulur; Game Master seçicisinde yok (seçici yalnız SRD +
özel canavar), yani A'da da seçiciye küçük bir ekleme gerekir.

**5c tetiği:** `data/esya-gorsel-varyant.json` `kaltakkirans-paladin-armor.bossYenilince = { boss: "hex", varyant: "hasarli" }`;
`src/app/itemVariant.ts` düşman tarafında, çağrılmamış, `c.monsterId === "hex"` ve 0 HP/ölü savaşçıyı arar. Beklenen
canavar kimliği **`hex`**. Kâğıt düşmanda `monsterId` olmadığından tetik çalışmaz.

## A / B karşılaştırması

| Ölçüt | A: canavar stat bloğu | B: karakter kâğıdı düşman |
|---|---|---|
| Efsanevi eylem, LR, Faz 2, katalog auraları, uçan boss YZ | çalışır (mevcut kalıp) | çalışmaz; her biri için kâğıt yoluna ek iş |
| Sınıf özellikleri (Rage, Smite, Metamagic, Action Surge…) | yaklaşık ya da kayıp (tablo 4) | kayıpsız (MC 105+) |
| Alt sınıf (8 paket alt sınıfı) | elle stat bloğuna yazılan kadar | yalnız `icerik/` olan cihazda; mobilde yok |
| İmza eşyalar ve mühür yuvaları | stat bloğuna elle | kancalarla kendiliğinden |
| Hex zırh tetiği (5c), Serüven XP | `hex` kimliğiyle kendiliğinden | çalışmaz; iki yere ek kod |
| Game Master seçicisi / Serüven düğümü | seçiciye küçük ekleme; Serüven listesi aynen | `BattlePlan`, seçici, Serüven yolu değişir (≈6–8 dosya) |
| Denge ölçümü | `sim:boss` (`data/sim-boss.json`) aynen | sim'de kâğıt düşman yolu yok |
| Kural/kayıt sürümü | veri eklemesi; davranış değişmez | kâğıt düşman kurulumu yeni giriş; sürüm gerekmeyebilir, doğrulanmalı |
| YZ | canavar YZ'si (sınanmış) | sınıf YZ'si yalnız parti tarafında sim'le sınanmış; düşman tarafında ölçülmedi |

## Öneri

**A (canavar stat bloğu), kimlikler `hex`, `tarvok`, `mora`**, `canavarlar-kadim.json` kalıbında (Titan/Hexonia gibi).
Gerekçe: bossu boss yapan her şey (efsanevi eylem, LR, Faz 2, katalog auraları, boss YZ, `sim:boss`, 5c tetiği, Serüven XP)
canavar kimliğine bağlı ve bugün çalışıyor; B bunların hepsini kâğıt yoluna yeniden bağlamayı ve paket bağımlılığını
(mobilde alt sınıf yok) getirir. Çoklu sınıf tasarım, stat bloğunun **kaynağı** olarak kalır: büyüler `canavar-buyuleri.json`'a
(17. / 10. seviye yuva tablosundan günlük sayıya), Shield/Counterspell `monster-reactions`'a, Rage/Smite/Radiant Strikes
saldırı eklerine, auralar `katalog-gucler.json`'a, imza eşya etkileri stat bloğuna yazılır.

Kullanıcı kararı gereken: (a) her bossun AC/HP/CR ve büyü listesi (depoda yok, uydurulmadı); (b) Metamagic, Action Surge,
Reckless Attack ve Brutal Strike'ın sabit yeteneğe mi çevrileceği yoksa düşürüleceği; (c) sekiz paket alt sınıfının hangi
özelliklerinin stat bloğuna gireceği (paket metni depoda olmadığından yerelde okunmalı).
