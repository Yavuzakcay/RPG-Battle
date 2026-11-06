# Ek paket ilkelleri (Görev P0)

Bu belge `src/content/ilkelSema.ts` tablosundan üretilir (`npx vite-node scripts/paket-ilkeller-belge.ts`); elle düzenleme. Şema, doğrulayıcı (`npm run check:icerik`) ve savaş yorumlayıcısı (`src/battle/paket/`) aynı tabloyu okur. Örnekler kurgusal ve SRD tarzıdır.

## Özet

Ek paket alt sınıfının her özelliği `ilkeller` dizisi taşıyabilir: `"ilkeller": [{ "tur": "ekHasar", ... }, ...]`. Eski alanlar (`effect`: stat, trait, reaction, effect) aynen çalışır; ikisi birlikte de yazılabilir. Paket düzeyinde `yaratiklar` dizisi `cagir` ilkelinin çağırdığı yaratıkları tanımlar.

İlkeller (25):

| İlkel | Ne yapar | Tetikler | Mevcut sistem |
|---|---|---|---|
| `ekHasar` | Saldırı isabetinde ek hasar zarı. | `isabet` | Saldırı çözümü (`features.ts` `weaponAttackEvents`) → isabet kanca kaydı (`hitHooks.ts`); `ExtraDamage` (direnç/bağışıklık hedefe göre). |
| `direnc` | Hasar direnci, bağışıklığı ya da zaafı (koşula bağlı olabilir). | `pasif` | Süren etki `resist` / `immune` / `vulnerable` (`damageProfile`); koşullu olanlar komut sonu eşitlemesiyle eklenir/kalkar. |
| `aura` | Sahibiyle yürüyen aura (dost ya da düşmanlara etki). | `pasif`, `eylem`, `bonus` | K53 aura altyapısı (`auraCore.ts`; süren etkide `auras`, en güçlüsü uygulanır, turda bir). GM anahtarı `auraCore` kapalıysa sessiz etkisiz. |
| `tepki` | Tepkiyle çalışan koruma ya da karşılık. | `tepki` | Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate, dostaIsabet+acBonusu → `registerAllyHit`. Karar `askReaction` (oyuncuya sorulur). |
| `gecicCan` | Geçici can. | `eylem`, `bonus`, `serbest`, `savasBasi`, `turBasi`, `oldurunce`, `isabet`, `hasarAlinca` | `temp_hp` olayı (fazlası birikmez; yükseği kalır). |
| `iyilestirme` | İyileştirme (ve isteğe bağlı durum kaldırma). | `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce`, `isabet` | `healed` / `condition_ended` olayları (en çok HP aşılmaz; ölüyü kaldırmaz). |
| `hasar` | Doğrudan hasar (kurtulmalı ya da kurtulmasız). | `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce` | `save_resolved` olayı (imza eylemleriyle aynı yol: `resolveSave`, `saveDamage` Evasion, `adjustDamage`, `damageEffects`). |
| `durumUygula` | Durum uygular (kurtulmalı, süreli, tekrar kurtulmalı). | `eylem`, `bonus`, `isabet`, `oldurunce` | Süren etki `grants` + `repeatSave` (`effects.ts`), Cesaret `resistImmunityEvent` (`auraCore.ts`). |
| `isaret` | Hedefi işaretler; işaretliye avantaj ve diğer ilkellerin `isaretli:<id>` koşulu. | `bonus`, `eylem`, `isabet` | Hedefte süren etki (`attackedAdvBy` işaretleyene, `attackedAdv` herkese; `wardSources`). |
| `cagir` | Paketin `yaratiklar` tanımından yaratık çağırır. | `eylem`, `bonus`, `savasBasi` | R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü). |
| `boyut` | Büyüme (Large/Huge): ek hasar zarı, jeton ölçeği. | `bonus`, `eylem`, `pasif` | Süren etki `size` (+1) ve `hitDie` (Enlarge yolu). |
| `ucus` | Uçuş hızı. | `pasif`, `bonus`, `eylem`, `savasBasi` | Süren etki `fly` (`flight.ts` `flySpeed`, `isAirborne`). |
| `isinlan` | Kendini görülen boş altıgene ışınlar. | `bonus`, `eylem`, `serbest` | K53 tek ışınlanma girişi (`teleport.ts` `teleportEvent`, `motion.ts` `withArrival`). |
| `zorlaHareket` | İtme/çekme/yana kaydırma (isabette ya da eylemle). | `isabet`, `eylem`, `bonus` | K53 tek zorla hareket girişi (`motion.ts` `forcedMove`: çarpma, düşme, zemin tetikleri). |
| `olumdenDon` | 0 HP'ye düşecekken ayakta kalır. | `sifirCan` | Death Ward yolu (`damage-effects.ts` `deathWard` etkisi; kullanılınca kaynak harcanır, gerekirse `healed`). |
| `ekSaldiri` | Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle). | `bonus`, `oldurunce`, `eylem` | Kayıtlı saldırı yolu (`reactions.ts` `strikeApi`); dost: dostun tepkisi harcanır (`reactionUsed`), en zayıf düşmana. |
| `zarEtkisi` | Zar ve savunma eklentileri: AC, kurtulma, avantaj/dezavantaj, bonus zar, inisiyatif. | `pasif`, `bonus`, `eylem`, `isabet`, `savasBasi` | Süren etki alanları `ac`, `saveMod`, `saveAdv`, `attackAdv`, `checkAdv`, `attackDis`, `saveDis`, `dice` (`effectDice.ts`); inisiyatif `initiativeBonus`. |
| `kaynak` | Kullanım havuzu tanımı (diğer ilkeller `kaynak.id` ile harcar). | `pasif` | Sınıf kaynakları (`data/class-features.json` `resources` biçimi; `classResources`, `rechargeResources`, savaş sonu karaktere yazılır). |
| `bicim` | Süreli biçim (dönüşüm): geçici can, AC, hız, direnç, ek hasar, uçuş, avantaj. | `bonus`, `eylem` | Wild Shape/Karadul biçim yolu yerine tek süren etki (`tempHpNow`, `ac`, `speedFt`, `fly`, `resist`, `hitDie`, `attackAdv`); jeton değişmez. |
| `yuzeyOlustur` | Altıgenlere yüzey (yağ, buz, alev…) ya da geçici engel koyar. | `eylem`, `bonus` | Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler) ya da K53 geçici engel (`barriers.ts` `barrierEvents`). |
| `buyuVer` | Her an hazır büyüler; isteğe bağlı kaynakla slotsuz. | `pasif` | Sınıf kiti `alwaysPrepared` ve kaynak `freeSpellList` (Favored Enemy yolu). |
| `buyuDegisimi` | Büyü hasarına eklenti (türe/okula göre). | `pasif` | Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu). |
| `gorunmezlik` | Invisible durumu (saldırınca/büyü yapınca biter). | `bonus`, `eylem`, `oldurunce`, `hasarAlinca` | Süren etki `grants: ["Invisible"]` + `breakOnAct` (Invisibility yolu). |
| `moralEtkisi` | Moral havuzuna ekleme/çıkarma (K48; Moral kapalıyken sessiz yok sayılır). | `bonus`, `eylem`, `turBasi`, `oldurunce`, `isabet` | `moral_changed` olayı (`morale.ts` `moraleOn`). |
| `hiz` | Hız artışı (pasif ya da süreli). | `pasif`, `bonus`, `eylem`, `savasBasi` | Süren etki `speedFt`. |

## Ortak kurallar

- **Tetik** (`tetik`): `pasif`, `eylem`, `bonus`, `serbest`, `isabet`, `turBasi`, `turSonu`, `savasBasi`, `oldurunce`, `hasarAlinca`, `sifirCan`, `tepki`. Yazılmazsa ilkelin ilk izinli tetiği.
- **Düğme:** aynı özellikte aynı düğme tetikli (`eylem`, `bonus`, `serbest`) ilkeller tek düğmede birleşir ve sırayla çalışır; düğme bir hedef (dost/düşman) ve/veya bir altıgen ister (ilkellerin ihtiyacına göre). Kaynağı düğmedeki ilk `kaynak` alanlı ilkel belirler; düğme başına bir kez harcanır. `eylem` eylem, `bonus` bonus eylem harcar, `serbest` harcamaz.
- **Otomatik tetikler:** `isabet` (kendi saldırın isabet edince; ek hasar zarı hasardan önce, diğerleri sonra), `turBasi`/`turSonu` (kendi turun), `savasBasi` (savaş başlarken), `oldurunce` (komutunla bir düşman 0 HP'ye düşünce), `hasarAlinca` (hasar alınca), `sifirCan` (0 HP'ye düşecekken), `tepki` (tepki hakkı; oyuncuya sorulur). `pasif` sürekli (koşullu olanlar her komut sonunda eşitlenir).
- **Formül:** sayı, zar ve belirteçler: `$pb (yeterlilik)`, `$pbYari (yarısı, en az 1)`, `$lvl (karakter seviyesi)`, `$lvl2 (iki katı)`, `$str…$cha (değiştirici, en az 0)`, `$buyu (büyü değiştiricisi)`. En çok bir zar terimi; yalnız `+` ve `-` (çarpma yok): `"1d8+$wis"`, `"$lvl+2"`. Seviye tablosu: `{ "3": "1d6", "11": "2d6" }` (karakter seviyesine göre en yüksek eşik).
- **Koşul** (`kosul`, hepsi doğru olmalı): `ofke`, `yarimCanAlti`, `zirhsiz`, `avantajli`, `dostBitisik`, `konsantrasyon`, `bicim:<id>` (bu özelliğin `bicim` ilkeli etkin), `isaretli:<id>` (hedef senin bu işaretinle işaretli).
- **Kaynak:** `{ "id": "...", "maliyet": 1 }`; kimlik aynı alt sınıftaki bir `kaynak` ilkelinin `id`'si ya da sınıf kaynağı (`rage`, `focus`, `channelDivinity`, `bardicInspiration`, `sorceryPoints`, `wildShape`, `layOnHands`…). Kaynak bitince düğme kapanır, otomatik tetik çalışmaz.
- **Süre:** tur sayısı ya da `"kalici"`. Kurtulma DC'si: `"buyu"`, sayı ya da yetenek listesi (8 + PB + en iyisi).
- **Kısmi:** tabloda **Kısmi** işaretli alanlar doğrulanır ama motorda yaklaşık uygulanır; böyle bir alan kullanan özellik `"kismi"` durumuyla yazılmalı (`check:icerik` uyarır).

### Ortak alanlar (her ilkelde)

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `tur` | metin | evet | — | İlkelin adı (aşağıdaki listeden). |
| `id` | kimlik | hayır | — | Bu ilkelin kimliği (özellik içinde benzersiz; `bicim:<id>`, `isaretli:<id>` koşulları ve `kaynak` tanımı buna başvurur). |
| `tetik` | seçenek: `pasif`, `eylem`, `bonus`, `serbest`, `isabet`, `turBasi`, `turSonu`, `savasBasi`, `oldurunce`, `hasarAlinca`, `sifirCan`, `tepki` | hayır | — | Ne zaman çalışır (ilkelin izin verdikleri; yazılmazsa ilki). |
| `hedef` | seçenek: `kendi`, `dost`, `dostVeyaKendi`, `dostlar`, `dusman`, `dusmanlar`, `bitisikDusmanlar`, `alan`, `vurulan` | hayır | — | Kime (ilkelin izin verdikleri; yazılmazsa ilki). |
| `kaynak` | kaynak başvurusu | hayır | — | Harcanan kaynak: `{ "id": "<kaynak ilkeli id ya da sınıf kaynağı (rage, focus, channelDivinity…)>", "maliyet": 1 }`. Düğmede yalnızca ilk kaynaklı ilkel harcar (düğme başına bir kez). |
| `kosul` | koşul listesi | hayır | — | Hepsi doğruysa çalışır: ofke, yarimCanAlti, zirhsiz, avantajli (isabet), dostBitisik (hedefe bitişik dost), konsantrasyon, bicim:<id>, isaretli:<id> (hedef bu işaretle işaretli). |
| `turdaBir` | true/false | hayır | `false` | Turda en çok bir kez (her savaşçının kendi turu sayılır). |
| `ad` | metin | hayır | — | Düğme/günlük adı (yoksa özelliğin TR adı). |

## `ekHasar`

Saldırı isabetinde ek hasar zarı.

- Tetikler: `isabet` (varsayılan `isabet`).
- Sistem ve kanca: Saldırı çözümü (`features.ts` `weaponAttackEvents`) → isabet kanca kaydı (`hitHooks.ts`); `ExtraDamage` (direnç/bağışıklık hedefe göre).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `zar` | formül | evet | — | Ek hasar (`"1d8"`, `"2d6+$wis"`, seviye tablosu `{ "3": "1d6", "11": "2d6" }`); kritikte zarlar iki kat. |
| `hasarTuru` | hasar türü | hayır | `"silah"` | Hasar türü; "silah" saldırının türü. |
| `saldiri` | seçenek: `silah`, `yakin`, `menzilli`, `buyu`, `hepsi` | hayır | `"silah"` | Hangi saldırılar: silah (yakın+menzilli silah), yakin, menzilli, buyu (büyü saldırısı), hepsi. |

Örnek:

```json
{"tur":"ekHasar","zar":{"3":"1d6","11":"2d6"},"hasarTuru":"radiant","saldiri":"silah","turdaBir":true}
```

## `direnc`

Hasar direnci, bağışıklığı ya da zaafı (koşula bağlı olabilir).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `resist` / `immune` / `vulnerable` (`damageProfile`); koşullu olanlar komut sonu eşitlemesiyle eklenir/kalkar.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `turler` | hasar türü listesi | evet | — | Hasar türleri. |
| `tip` | seçenek: `direnc`, `bagisiklik`, `zaaf` | hayır | `"direnc"` | Direnç (yarı), bağışıklık (sıfır), zaaf (iki kat). |

Örnek:

```json
{"tur":"direnc","turler":["cold","necrotic"],"kosul":["ofke"]}
```

## `aura`

Sahibiyle yürüyen aura (dost ya da düşmanlara etki).

- Tetikler: `pasif`, `eylem`, `bonus` (varsayılan `pasif`).
- Sistem ve kanca: K53 aura altyapısı (`auraCore.ts`; süren etkide `auras`, en güçlüsü uygulanır, turda bir). GM anahtarı `auraCore` kapalıysa sessiz etkisiz.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yaricapFt` | tamsayı | evet | — | Yarıçap (ft). |
| `suzgec` | seçenek: `dostlar`, `dusmanlar`, `hepsi`, `digerleri` | hayır | `"dostlar"` | Kimleri etkiler (dostlar sahibini de kapsar; digerleri sahibi hariç herkes). |
| `zaman` | seçenek: `pasif`, `turBasi`, `turSonu`, `girince` | hayır | `"pasif"` | Etki ne zaman işler (pasif: aura içindeyken sürekli). |
| `etki` | seçenek: `kurtulmaBonusu`, `hasar`, `durum`, `durumBagisikligi`, `gecicCan`, `iyilestirmeYok`, `olumKurtulmaAvantaji`, `olumKurtulmaDezavantaji`, `moral` | evet | — | Etki türü. |
| `miktar` | formül | hayır | — | kurtulmaBonusu / gecicCan / moral miktarı (en az 1). |
| `zar` | formül | hayır | — | hasar etkisinin zarı. |
| `hasarTuru` | hasar türü | hayır | — | hasar etkisinin türü. |
| `durum` | durum | hayır | — | durum etkisinin durumu. |
| `durumlar` | durum listesi | hayır | — | durumBagisikligi listesi. |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `cesaret` | tamsayı | hayır | — | Kurtulmayı başaran bu auraya N tur bağışık (Cesaret sayacı). |
| `sure` | süre | hayır | `10` | Eylem/bonus ile açılan auranın süresi. |

Örnek:

```json
{"tur":"aura","yaricapFt":10,"suzgec":"dostlar","etki":"kurtulmaBonusu","miktar":"$cha"}
```

## `tepki`

Tepkiyle çalışan koruma ya da karşılık.

- Tetikler: `tepki` (varsayılan `tepki`).
- Sistem ve kanca: Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate, dostaIsabet+acBonusu → `registerAllyHit`. Karar `askReaction` (oyuncuya sorulur).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `olay` | seçenek: `banaIsabet`, `dostaIsabet`, `hasarAldim` | hayır | `"banaIsabet"` | Tetikleyen olay: sana isabet, menzildeki dosta isabet, yakın dövüşte hasar aldın. |
| `etki` | seçenek: `acBonusu`, `hasarAzalt`, `yariya`, `direnc`, `karsiVurus` | evet | — | Tepkinin etkisi. |
| `miktar` | formül | hayır | — | acBonusu (sayı) ya da hasarAzalt zarı (`"1d10+$wis"`). |
| `saldiri` | seçenek: `hepsi`, `yakin`, `menzilli` | hayır | `"hepsi"` | Yalnız bu saldırılarda. |
| `turler` | hasar türü listesi | hayır | — | hasarAzalt yalnız bu türlerde. |
| `menzilFt` | tamsayı | hayır | `30` | dostaIsabet: dosta uzaklık (ft). |

Örnek:

```json
{"tur":"tepki","olay":"dostaIsabet","etki":"acBonusu","miktar":2,"menzilFt":30,"kaynak":{"id":"kalkan-sozu","maliyet":1}}
```

## `gecicCan`

Geçici can.

- Tetikler: `eylem`, `bonus`, `serbest`, `savasBasi`, `turBasi`, `oldurunce`, `isabet`, `hasarAlinca` (varsayılan `eylem`).
- Hedefler: `kendi`, `dost`, `dostVeyaKendi`, `dostlar` (varsayılan `kendi`).
- Sistem ve kanca: `temp_hp` olayı (fazlası birikmez; yükseği kalır).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `miktar` | formül | evet | — | Geçici can (`"1d8+$lvl"`). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |

Örnek:

```json
{"tur":"gecicCan","tetik":"oldurunce","miktar":"$lvl"}
```

## `iyilestirme`

İyileştirme (ve isteğe bağlı durum kaldırma).

- Tetikler: `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce`, `isabet` (varsayılan `eylem`).
- Hedefler: `dostVeyaKendi`, `kendi`, `dost`, `dostlar` (varsayılan `dostVeyaKendi`).
- Sistem ve kanca: `healed` / `condition_ended` olayları (en çok HP aşılmaz; ölüyü kaldırmaz).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `miktar` | formül | evet | — | İyileşen can. |
| `durumKaldir` | durum listesi | hayır | — | Varsa bu durumlar da kalkar. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |

Örnek:

```json
{"tur":"iyilestirme","tetik":"bonus","hedef":"dostVeyaKendi","miktar":"2d4+$wis","menzilFt":30,"kaynak":{"id":"sifa","maliyet":1}}
```

## `hasar`

Doğrudan hasar (kurtulmalı ya da kurtulmasız).

- Tetikler: `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce` (varsayılan `eylem`).
- Hedefler: `dusman`, `dusmanlar`, `bitisikDusmanlar`, `alan` (varsayılan `dusman`).
- Sistem ve kanca: `save_resolved` olayı (imza eylemleriyle aynı yol: `resolveSave`, `saveDamage` Evasion, `adjustDamage`, `damageEffects`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `zar` | formül | evet | — | Hasar. |
| `hasarTuru` | hasar türü | evet | — | Hasar türü. |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |
| `enCok` | tamsayı | hayır | — | En çok hedef (dusmanlar/alan). |

Örnek:

```json
{"tur":"hasar","tetik":"eylem","hedef":"alan","menzilFt":60,"yaricapFt":10,"zar":{"3":"2d8","11":"3d8"},"hasarTuru":"thunder","save":{"yetenek":"con","dc":"buyu","yari":true}}
```

## `durumUygula`

Durum uygular (kurtulmalı, süreli, tekrar kurtulmalı).

- Tetikler: `eylem`, `bonus`, `isabet`, `oldurunce` (varsayılan `eylem`).
- Hedefler: `dusman`, `dusmanlar`, `bitisikDusmanlar`, `alan`, `vurulan`, `kendi` (varsayılan `dusman`).
- Sistem ve kanca: Süren etki `grants` + `repeatSave` (`effects.ts`), Cesaret `resistImmunityEvent` (`auraCore.ts`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `durum` | durum | evet | — | SRD durumu. |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `sure` | süre | hayır | `1` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `tekrarKurtulma` | true/false | hayır | `false` | Hedef her tur sonunda yeniden kurtulma atar (başarıda biter). |
| `cesaret` | tamsayı | hayır | — | Kurtulmayı başaran N tur bağışık (K53 Cesaret sayacı). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |
| `enCok` | tamsayı | hayır | — | En çok hedef. |

Örnek:

```json
{"tur":"durumUygula","tetik":"isabet","hedef":"vurulan","durum":"Frightened","save":{"yetenek":"wis","dc":["cha"]},"sure":1,"turdaBir":true,"cesaret":10}
```

## `isaret`

Hedefi işaretler; işaretliye avantaj ve diğer ilkellerin `isaretli:<id>` koşulu.

- Tetikler: `bonus`, `eylem`, `isabet` (varsayılan `bonus`).
- Hedefler: `dusman`, `vurulan` (varsayılan `dusman`).
- Sistem ve kanca: Hedefte süren etki (`attackedAdvBy` işaretleyene, `attackedAdv` herkese; `wardSources`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `tek` | true/false | hayır | `true` | Aynı anda tek işaret (yenisi eskisini kaldırır). |
| `avantaj` | seçenek: `yok`, `isaretleyen`, `herkes` | hayır | `"yok"` | İşaretliye saldırı avantajı: yok, yalnız işaretleyen, herkes. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"isaret","id":"av","tetik":"bonus","menzilFt":60,"sure":10,"avantaj":"isaretleyen"}
```

## `cagir`

Paketin `yaratiklar` tanımından yaratık çağırır.

- Tetikler: `eylem`, `bonus`, `savasBasi` (varsayılan `eylem`).
- Sistem ve kanca: R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yaratik` | yaratık kimliği | evet | — | Paket `yaratiklar` kimliği. |
| `sayi` | formül | hayır | `1` | Kaç tane. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `konsantrasyon` | true/false | hayır | `false` | Konsantrasyon (bozulunca kaybolur). **Kısmi:** konsantrasyon büyüsüz özellikte süre olarak işler. |
| `inisiyatif` | seçenek: `sahip`, `ayri` | hayır | `"sahip"` | sahip: sahibinin hemen ardından oynar; ayri: kendi inisiyatifi. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `tekrar` | seçenek: `degistir`, `ekle` | hayır | `"degistir"` | Yeniden çağırınca: öncekiler kaybolur (degistir) ya da eklenir. |
| `sahipOlunceKaybolur` | true/false | hayır | `true` | Sahibi ölünce kaybolur. |
| `komut` | seçenek: `serbest`, `bonus` | hayır | `"serbest"` | serbest: kendi turunda kendisi oynar; bonus: sahibi bonus eylemle emretmezse yalnız Kaçın. |

Örnek:

```json
{"tur":"cagir","tetik":"eylem","yaratik":"kul-kurdu","sayi":2,"sure":10,"inisiyatif":"sahip","kaynak":{"id":"cagri","maliyet":1}}
```

## `boyut`

Büyüme (Large/Huge): ek hasar zarı, jeton ölçeği.

- Tetikler: `bonus`, `eylem`, `pasif` (varsayılan `bonus`).
- Sistem ve kanca: Süren etki `size` (+1) ve `hitDie` (Enlarge yolu).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `boyut` | seçenek: `L`, `H` | hayır | `"L"` | Hedef boyut (jeton etiketi; tek altıgen). |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `ekHasar` | formül | hayır | — | Silah isabetinde ek zar (`"1d4"`). |
| `erisimFt` | tamsayı | hayır | — | Ek erişim (ft). **Kısmi:** erişim artışı uygulanmaz. |

Örnek:

```json
{"tur":"boyut","tetik":"bonus","boyut":"L","sure":10,"ekHasar":"1d4","kaynak":{"id":"dev-ofkesi","maliyet":1}}
```

## `ucus`

Uçuş hızı.

- Tetikler: `pasif`, `bonus`, `eylem`, `savasBasi` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `fly` (`flight.ts` `flySpeed`, `isAirborne`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `hizFt` | formül | hayır | `"yurume"` | Uçuş hızı (ft; "yurume" yürüme hızı kadar). |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |

Örnek:

```json
{"tur":"ucus","tetik":"bonus","hizFt":30,"sure":10}
```

## `isinlan`

Kendini görülen boş altıgene ışınlar.

- Tetikler: `bonus`, `eylem`, `serbest` (varsayılan `bonus`).
- Sistem ve kanca: K53 tek ışınlanma girişi (`teleport.ts` `teleportEvent`, `motion.ts` `withArrival`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `mesafeFt` | tamsayı | evet | — | En çok uzaklık (ft). |
| `gorus` | true/false | hayır | `true` | Varış görülmeli. |

Örnek:

```json
{"tur":"isinlan","tetik":"bonus","mesafeFt":30,"kaynak":{"id":"golge-adimi","maliyet":1}}
```

## `zorlaHareket`

İtme/çekme/yana kaydırma (isabette ya da eylemle).

- Tetikler: `isabet`, `eylem`, `bonus` (varsayılan `isabet`).
- Hedefler: `vurulan`, `dusman` (varsayılan `vurulan`).
- Sistem ve kanca: K53 tek zorla hareket girişi (`motion.ts` `forcedMove`: çarpma, düşme, zemin tetikleri).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yon` | seçenek: `it`, `cek`, `yana` | hayır | `"it"` | Yön (sahibine göre). |
| `mesafeFt` | tamsayı | evet | — | Uzaklık (ft). |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `boyutSiniri` | seçenek: `L`, `M`, `H`, `G` | hayır | `"L"` | Bu boyut ve küçükleri. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"zorlaHareket","tetik":"isabet","yon":"it","mesafeFt":10,"boyutSiniri":"L","turdaBir":true}
```

## `olumdenDon`

0 HP'ye düşecekken ayakta kalır.

- Tetikler: `sifirCan` (varsayılan `sifirCan`).
- Sistem ve kanca: Death Ward yolu (`damage-effects.ts` `deathWard` etkisi; kullanılınca kaynak harcanır, gerekirse `healed`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `hp` | formül | hayır | `"1"` | Kalan can ("1", "yari" = en çok canın yarısı, ya da formül). |

Örnek:

```json
{"tur":"olumdenDon","hp":"yari","kaynak":{"id":"son-nefes","maliyet":1}}
```

## `ekSaldiri`

Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle).

- Tetikler: `bonus`, `oldurunce`, `eylem` (varsayılan `bonus`).
- Hedefler: `dusman`, `dost` (varsayılan `dusman`).
- Sistem ve kanca: Kayıtlı saldırı yolu (`reactions.ts` `strikeApi`); dost: dostun tepkisi harcanır (`reactionUsed`), en zayıf düşmana.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `menzilFt` | tamsayı | hayır | `60` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"ekSaldiri","tetik":"bonus","hedef":"dusman","kaynak":{"id":"ofke-hamlesi","maliyet":1}}
```

## `zarEtkisi`

Zar ve savunma eklentileri: AC, kurtulma, avantaj/dezavantaj, bonus zar, inisiyatif.

- Tetikler: `pasif`, `bonus`, `eylem`, `isabet`, `savasBasi` (varsayılan `pasif`).
- Hedefler: `kendi`, `dost`, `dostVeyaKendi`, `dostlar`, `dusman`, `vurulan` (varsayılan `kendi`).
- Sistem ve kanca: Süren etki alanları `ac`, `saveMod`, `saveAdv`, `attackAdv`, `checkAdv`, `attackDis`, `saveDis`, `dice` (`effectDice.ts`); inisiyatif `initiativeBonus`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `acBonusu` | formül | hayır | — | AC eklentisi. |
| `kurtulmaBonusu` | formül | hayır | — | Kurtulma eklentisi. |
| `kurtulmalar` | yetenek listesi | hayır | — | kurtulmaBonusu/avantaj hangi yeteneklerde (yoksa hepsi). |
| `avantaj` | seçenek listesi: `saldiri`, `kurtulma`, `kontrol` | hayır | — | Avantaj (kurtulma/kontrol `kurtulmalar` yetenekleriyle). |
| `dezavantaj` | seçenek listesi: `saldiri`, `kurtulma` | hayır | — | Hedefe dezavantaj (saldırıları / kurtulmaları). |
| `zar` | formül | hayır | — | Bonus zar (`"1d4"`; Bless gibi), `zarYonu` ile çıkarılabilir. |
| `zarYonu` | seçenek: `arti`, `eksi` | hayır | `"arti"` | Bonus zarın yönü. |
| `zarIcin` | seçenek listesi: `saldiri`, `kurtulma`, `kontrol` | hayır | `["saldiri","kurtulma"]` | Bonus zar hangi d20 testlerine. |
| `inisiyatifBonusu` | formül | hayır | — | İnisiyatif eklentisi (yalnız pasif). |
| `d20AltSinir` | tamsayı | hayır | — | d20 alt sınırı. **Kısmi:** uygulanmaz. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |

Örnek:

```json
{"tur":"zarEtkisi","tetik":"pasif","kurtulmaBonusu":"$cha","kurtulmalar":["wis"],"kosul":["yarimCanAlti"]}
```

## `kaynak`

Kullanım havuzu tanımı (diğer ilkeller `kaynak.id` ile harcar).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Sınıf kaynakları (`data/class-features.json` `resources` biçimi; `classResources`, `rechargeResources`, savaş sonu karaktere yazılır).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `id` | kimlik | evet | — | Kaynak kimliği (alt sınıf içinde). |
| `sayi` | formül | evet | — | Kullanım: sayı, "$pb", "$str"…"$cha" (en az 1) ya da seviye tablosu `{ "3": 2, "11": 3 }`. |
| `yenilenme` | seçenek: `uzun`, `kisa`, `tur` | hayır | `"uzun"` | Yenilenme: uzun dinlenme, kısa (ve uzun) dinlenme, her tur başı. |

Örnek:

```json
{"tur":"kaynak","id":"cagri","sayi":"$pb","yenilenme":"uzun"}
```

## `bicim`

Süreli biçim (dönüşüm): geçici can, AC, hız, direnç, ek hasar, uçuş, avantaj.

- Tetikler: `bonus`, `eylem` (varsayılan `bonus`).
- Sistem ve kanca: Wild Shape/Karadul biçim yolu yerine tek süren etki (`tempHpNow`, `ac`, `speedFt`, `fly`, `resist`, `hitDie`, `attackAdv`); jeton değişmez.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `id` | kimlik | evet | — | Biçim kimliği (`bicim:<id>` koşulu). |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `gecicCan` | formül | hayır | — | Girişte geçici can. |
| `acBonusu` | formül | hayır | — | AC eklentisi. |
| `hizFt` | formül | hayır | — | Hız eklentisi (ft). |
| `ucusFt` | formül | hayır | — | Uçuş hızı (ft). |
| `direncler` | hasar türü listesi | hayır | — | Direnç türleri. |
| `ekHasar` | formül | hayır | — | Silah isabetinde ek zar. |
| `hasarTuru` | hasar türü | hayır | — | ekHasar türü (yoksa silahın). |
| `saldiriAvantaji` | true/false | hayır | `false` | Saldırılar avantajlı. |

Örnek:

```json
{"tur":"bicim","id":"gece","tetik":"bonus","sure":10,"gecicCan":"$lvl","acBonusu":1,"direncler":["necrotic"],"ekHasar":"1d6","hasarTuru":"necrotic","kaynak":{"id":"gece-bicimi","maliyet":1}}
```

## `yuzeyOlustur`

Altıgenlere yüzey (yağ, buz, alev…) ya da geçici engel koyar.

- Tetikler: `eylem`, `bonus` (varsayılan `eylem`).
- Sistem ve kanca: Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler) ya da K53 geçici engel (`barriers.ts` `barrierEvents`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yuzey` | seçenek: `oil`, `water`, `ice`, `fire`, `burningWeb`, `steam`, `slick`, `poison`, `engel:cizili-duvar`, `engel:dost-kalkani`, `engel:enkaz-yigini` | evet | — | Yüzey türü (`data/yuzeyler.json`) ya da `engel:<tür>` (`data/engeller.json`). |
| `yaricapFt` | tamsayı | hayır | `5` | Yarıçap (ft; 0 tek altıgen). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `sure` | süre | hayır | — | Engel süresi (yoksa verideki). **Kısmi:** yüzeyde süre verideki. |

Örnek:

```json
{"tur":"yuzeyOlustur","tetik":"eylem","yuzey":"ice","yaricapFt":5,"menzilFt":30}
```

## `buyuVer`

Her an hazır büyüler; isteğe bağlı kaynakla slotsuz.

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Sınıf kiti `alwaysPrepared` ve kaynak `freeSpellList` (Favored Enemy yolu).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `buyular` | büyü adı listesi | evet | — | Büyü adları (SRD adı, `data/spells*.json`). |
| `bedava` | kaynak başvurusu | hayır | — | Bu kaynak kaldıkça slotsuz (`{ "id": "<kaynak>" }`). |

Örnek:

```json
{"tur":"buyuVer","buyular":["Misty Step","Shield"],"bedava":{"id":"sis-adimi"}}
```

## `buyuDegisimi`

Büyü hasarına eklenti (türe/okula göre).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `hasarEki` | formül | hayır | — | Büyü hasarına eklenti (bir kez). |
| `hasarTurleri` | hasar türü listesi | hayır | — | Yalnız bu türlerde. |
| `okul` | metin | hayır | — | Yalnız bu okul (Evocation…). |
| `kurtulmaDezavantaji` | true/false | hayır | `false` | Hedefler kurtulmada dezavantajlı. **Kısmi:** uygulanmaz. |
| `menzilEkiFt` | tamsayı | hayır | — | Menzil eki. **Kısmi:** uygulanmaz. |
| `yeniTur` | hasar türü | hayır | — | Hasar türünü değiştir. **Kısmi:** uygulanmaz. |

Örnek:

```json
{"tur":"buyuDegisimi","hasarEki":"$buyu","hasarTurleri":["fire","cold"]}
```

## `gorunmezlik`

Invisible durumu (saldırınca/büyü yapınca biter).

- Tetikler: `bonus`, `eylem`, `oldurunce`, `hasarAlinca` (varsayılan `bonus`).
- Hedefler: `kendi`, `dost` (varsayılan `kendi`).
- Sistem ve kanca: Süren etki `grants: ["Invisible"]` + `breakOnAct` (Invisibility yolu).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sure` | süre | hayır | `1` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `saldirincaBiter` | true/false | hayır | `true` | Saldırı/büyüyle biter. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"gorunmezlik","tetik":"hasarAlinca","sure":1,"turdaBir":true,"kaynak":{"id":"sis-perde","maliyet":1}}
```

## `moralEtkisi`

Moral havuzuna ekleme/çıkarma (K48; Moral kapalıyken sessiz yok sayılır).

- Tetikler: `bonus`, `eylem`, `turBasi`, `oldurunce`, `isabet` (varsayılan `bonus`).
- Hedefler: `kendi`, `dost`, `dostVeyaKendi`, `dostlar`, `dusman`, `vurulan` (varsayılan `kendi`).
- Sistem ve kanca: `moral_changed` olayı (`morale.ts` `moraleOn`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `miktar` | formül | evet | — | Moral değişimi (eksi olabilir). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `yaricapFt` | tamsayı | hayır | `10` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |

Örnek:

```json
{"tur":"moralEtkisi","tetik":"oldurunce","hedef":"dostlar","yaricapFt":30,"miktar":1}
```

## `hiz`

Hız artışı (pasif ya da süreli).

- Tetikler: `pasif`, `bonus`, `eylem`, `savasBasi` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `speedFt`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `artiFt` | formül | evet | — | Hıza eklenen (ft). |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |

Örnek:

```json
{"tur":"hiz","artiFt":10,"kosul":["zirhsiz"]}
```

## Çağrı yaratığı (`yaratiklar`)

Paket düzeyinde (alt sınıfların yanında) `"yaratiklar": [ ... ]`. `cagir` ilkeli `yaratik` alanıyla buna başvurur. Yaratık R3 çağırma yolundan sıraya girer (`summoned` olayı yaratığın tamamını taşır: replay ve kayıt paket silinse de aynı). Biçim SRD canavar şemasıyla aynı alanların Türkçe karşılığı.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `id` | kimlik | evet | — | Paket içinde benzersiz kimlik (`cagir.yaratik`). |
| `ad` | metin | evet | — | `{ "tr": "...", "en": "..." }`. |
| `boyut` | seçenek: `T`, `S`, `M`, `L`, `H`, `G` | hayır | `"M"` | Boyut (T, S, M, L, H, G). |
| `tur` | metin | hayır | `"beast"` | Yaratık türü (beast, fey, undead, construct, elemental, celestial, fiend, dragon, plant, aberration…). |
| `ac` | formül | evet | — | Zırh sınıfı (sayı ya da formül: `"13+$pb"`). |
| `hp` | formül | evet | — | Can (sayı, formül `"5+$lvl2"` ya da seviye tablosu `{ "3": 20, "11": 45 }`; çarpma yok). |
| `hiz` | nesne | hayır | — | `{ "yurume": 30, "ucma": 0, "yuzme": 0, "tirmanma": 0 }` (ft). |
| `yetenekler` | nesne | evet | — | `{ "str": 12, "dex": 14, "con": 12, "int": 6, "wis": 12, "cha": 6 }`. |
| `saldirilar` | nesne | hayır | — | Saldırılar (aşağıda). |
| `cokluSaldiri` | tamsayı | hayır | `1` | Saldırı eylemiyle kaç saldırı (Multiattack; 1 yok). |
| `direncler` | hasar türü listesi | hayır | — | Direnç. |
| `bagisikliklar` | hasar türü listesi | hayır | — | Bağışıklık. |
| `durumBagisikliklari` | durum listesi | hayır | — | Durum bağışıklıkları. |
| `karanlikGorus` | tamsayı | hayır | — | Karanlık görüş (ft). |
| `ozellikler` | seçenek listesi: `tirmanici`, `surudeTaktik` | hayır | — | Motorun bildiği özellikler: tirmanici (Spider Climb), surudeTaktik (Pack Tactics). |
| `eylemler` | seçenek listesi: `saldiri`, `kacin`, `yardim` | hayır | `["saldiri","kacin","yardim"]` | Eylem seçenekleri; `saldiri` yoksa saldıramaz (familiar gibi). |
| `jeton` | nesne | hayır | — | Jeton: `{ "gorsel": "<canavar kimliği ya da arketip>", "ton": 0–359 (renk tonu kaydırma, derece), "halka": "#rrggbb" }`. |

### Saldırı (`saldirilar[]`)

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `ad` | metin | evet | — | Saldırı adı (TR). |
| `tur` | seçenek: `yakin`, `menzilli` | hayır | `"yakin"` | Yakın dövüş ya da menzilli. |
| `bonus` | formül | hayır | `"sahip"` | İsabet bonusu: sayı, formül ya da "sahip" (sahibinin büyü saldırı bonusu). |
| `hasar` | formül | evet | — | Hasar (`"1d8+$pb"`). |
| `hasarTuru` | hasar türü | evet | — | Hasar türü. |
| `erisimFt` | tamsayı | hayır | `5` | Erişim (ft). |
| `menzil` | nesne | hayır | — | `[normal, uzun]` (ft; menzilli). |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `ek` | nesne | hayır | — | Saldırı eki (`data/attack-riders.json` biçimi: `prone`, `grapple`, `conditions`, `extra`…). |

### Jeton

Yeni görsel dosyası gerekmez. `jeton.gorsel` mevcut bir canavar kimliği (`public/monsters/<id>.webp`) ya da arketiptir; `ton` renk tonunu kaydırır (CSS `hue-rotate`, derece), `halka` jetonun altına renkli halka çizer (çizim anında; `src/ui/Avatar.tsx`). Görsel yoksa ya da tanınmazsa yedek arketip (`yaratik`) kullanılır; bu hata değil uyarıdır (`check:icerik` "jetonYedek").

| Arketip | Ödünç görsel |
|---|---|
| `ejderha` | `red-dragon-wyrmling` |
| `element` | `fire-elemental` |
| `ruzgar` | `air-elemental` |
| `kurt` | `dire-wolf` |
| `kopek` | `mastiff` |
| `bocek` | `giant-spider` |
| `golem` | `animated-armor` |
| `melek` | `deva` |
| `peri` | `sprite` |
| `binek` | `draft-horse` |
| `kus` | `hawk` |
| `zombi` | `zombie` |
| `iskelet` | `skeleton` |
| `hayalet` | `specter` |
| `bitki` | `awakened-tree` |
| `dokunac` | `roper` |
| `seytan` | `imp` |
| `kukla` | `homunculus` |
| `yaratik` | `wolf` |

Örnek:

```json
{"id":"kul-kurdu","ad":{"tr":"Kül Kurdu","en":"Ash Wolf"},"boyut":"M","tur":"beast","ac":"12+$pbYari","hp":{"3":15,"11":40},"hiz":{"yurume":40},"yetenekler":{"str":12,"dex":15,"con":12,"int":3,"wis":12,"cha":6},"saldirilar":[{"ad":"Isırık","tur":"yakin","bonus":"sahip","hasar":"1d6+$pb","hasarTuru":"piercing","ek":{"prone":{"maxSize":"M","save":{"ability":"str","dc":11}},"status":"uygulandı"}}],"ozellikler":["surudeTaktik"],"jeton":{"gorsel":"kurt","ton":200,"halka":"#7fb3ff"}}
```

## Kalıba uymayan (ilkel olmayan) kalıplar: ilk tahmin

| Kalıp | Neden ilkel değil | Yol |
|---|---|---|
| Yapışma (attach): hedefle birlikte hareket, her tur hasar, eylemle sökme | Canavar tarafında 3 kalem (ENVANTER 7d), alt sınıflarda tekil. | Arcane Hand Grasping / yakalama sürüklemesi üstüne ortak ilkel (P1 adayı). |
| Taraf değiştirme / ele geçirme (Dominate, likantrop laneti) | Savaş dengesi büyük; alt sınıf özelliklerinde nadir. | `allegianceSwap` (Kuyruk 18); ev kuralı anahtarıyla özel. |
| Yanılsama nesnesi (görüş keser, geçilir, incelemeyle bozulur) | Büyülerde 6 kalem, alt sınıfta Aldatma tarzı birkaç özellik; motorda yanılsama nesnesi yok. | K53 geçici engel `blocksSight` + bozulma eylemi (P1 adayı). |
| Biçim değişiminde jeton ve stat bloğu değişimi (gerçek Wild Shape) | `bicim` ilkeli yalnız süren etki; stat bloğu değişmez. | Wild Shape `shape_changed` yolu (canavar kimliğiyle) ileride `bicim.canavar` alanı. |
| Yeniden atma / yeniden attırma (Lucky, Portent tarzı) | Tepki kararı d20 sonrası; tek yol `ExtraDie.reroll` sınıf özelliklerine bağlı. | `secondChance` yolu genelleştirilince `zarEtkisi.yenidenAt` alanı. |
| Tepkide yönlendirme (saldırıyı başka hedefe çevirme) | Yalnız canavar tepkisi `redirectAttack` var; oyuncu yolu yok. | Tepki `yonlendir` etkisi (P1). |
| Büyü kurtulmasına dezavantaj, büyü menzili, hasar türü değişimi | `buyuDegisimi` alanları kabul edilir ama motorda tek kanca yok. | Büyü save ve hedefleme kancası (P1); şimdilik kısmi. |
| Savaş dışı yetenekler (sosyal, keşif, zanaat, dil, ritüel) | Savaş motoru dışı. | `hikaye` durumu. |
| Erişim (reach) artışı | Silah erişimi saldırı seçeneğinden; süren etki alanı yok. | `boyut.erisimFt` kısmi (P1). |
| Eşya üretme / sarf eşyası (iksir, ok, bomba yaratma) | `consumables` savaş başında karakterden. | `use_item` + süreli sarf eşyası ilkeli (P1 adayı). |

## Yazım kılavuzu

1. Özelliği oku; savaşta ne yaptığını tek cümleyle yaz (tetik + hedef + etki). Savaş dışıysa `"status": "hikaye"`, ilkel yazma.
2. Kullanım sınırı varsa önce bir `kaynak` ilkeli yaz (`id`, `sayi`, `yenilenme`) ya da sınıf kaynağını kullan.
3. Etkiyi yukarıdaki ilkellerden kur: bir düğmede birden çok ilkel olabilir (örn. `isinlan` + `gecicCan`, ikisi `"tetik": "bonus"`). Koşulları `kosul` ile, sınırları `turdaBir` ve `kaynak` ile ver.
4. Yaratık çağırıyorsa paket düzeyinde `yaratiklar` tanımla, `cagir.yaratik` ile başvur; jeton için arketip ya da canavar kimliği, isteğe bağlı `ton`/`halka`.
5. Durum etiketi: ilkeller özelliği tam karşılıyorsa `"calisir"`; bir kısmı eksik ya da **Kısmi** alan kullanıyorsa `"kismi"`; ilkelle karşılanamıyorsa `"calismiyor"` (motorda sistem bekliyorsa `"planli"`, savaş dışıysa `"hikaye"`). `calisir`/`kismi` yalnız `ilkeller` (ya da ok/partial `effect`) varken geçerlidir; ilkelsiz `calisir` hata verir.
6. `npm run check:icerik` çalıştır. Çıktıda hata satırı `alt-sinif/ozellik ilkeller[2].zar ilkelDeger` biçimindedir: alt sınıf ve özellik kimliği, ilkelin dizideki sırası, alan adı ve hata kodu (metin yazılmaz).

### Hata kodları

| Kod | Anlamı |
|---|---|
| `ilkelTur` | bilinmeyen ilkel adı (`tur`) |
| `ilkelAlan` | ilkelde (ya da yaratıkta) bilinmeyen alan |
| `ilkelDeger` | geçersiz değer (tip, seçenek, formül sözdizimi, tetik/hedef bu ilkelde izinli değil) |
| `ilkelEksik` | zorunlu alan yok |
| `yaratikRef` | `cagir.yaratik` paketin yaratıklarında yok |
| `kaynakRef` | `kaynak.id` alt sınıfın kaynaklarında ya da sınıf kaynaklarında yok |
| `effectStatus` | `calisir`/`kismi` ama ilkel ya da çalışan etki yok (ya da tersi) |
| `jetonYedek` | (uyarı) jeton görseli yok ya da tanınmadı; yedek arketip |
