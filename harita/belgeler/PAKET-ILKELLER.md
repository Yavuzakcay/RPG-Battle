# Ek paket ilkelleri (Görev P0)

Bu belge `src/content/ilkelSema.ts` tablosundan üretilir (`npx vite-node scripts/paket-ilkeller-belge.ts`); elle düzenleme. Şema, doğrulayıcı (`npm run check:icerik`) ve savaş yorumlayıcısı (`src/battle/paket/`) aynı tabloyu okur. Örnekler kurgusal ve SRD tarzıdır.

## Özet

Ek paket alt sınıfının her özelliği `ilkeller` dizisi taşıyabilir: `"ilkeller": [{ "tur": "ekHasar", ... }, ...]`. Eski alanlar (`effect`: stat, trait, reaction, effect) aynen çalışır; ikisi birlikte de yazılabilir. Paket düzeyinde `yaratiklar` dizisi `cagir` ilkelinin çağırdığı yaratıkları tanımlar.

İlkeller (45; P6: zarMuhru, engeldenGec eklendi):

| İlkel | Ne yapar | Tetikler | Mevcut sistem |
|---|---|---|---|
| `ekHasar` | Saldırı isabetinde ek hasar zarı. | `isabet` | Saldırı çözümü (`features.ts` `weaponAttackEvents`) → isabet kanca kaydı (`hitHooks.ts`); `ExtraDamage` (direnç/bağışıklık hedefe göre). |
| `direnc` | Hasar direnci, bağışıklığı ya da zaafı (koşula bağlı olabilir). | `pasif` | Süren etki `resist` / `immune` / `vulnerable` (`damageProfile`); koşullu olanlar komut sonu eşitlemesiyle eklenir/kalkar. |
| `aura` | Sahibiyle yürüyen aura (dost ya da düşmanlara etki). | `pasif`, `eylem`, `bonus` | K53 aura altyapısı (`auraCore.ts`; süren etkide `auras`, en güçlüsü uygulanır, turda bir). GM anahtarı `auraCore` kapalıysa sessiz etkisiz. |
| `tepki` | Tepkiyle çalışan koruma ya da karşılık. | `tepki` | P9: firsatSaldirisi/kurtulmaAttirildi komut sonu kancası (fırsat saldırısı `attack_resolved.opportunity`, `save_resolved.actorId`), isaretliVurdu/komsuHedefVuruldu saldırı sonrası kancası (`registerAfterAttack`), dusmanBuyuAtiyor büyü kancası (`registerCastHook`, Counterspell ile aynı an); hizSifir süren etki `speedZero` + `untilOwnTurnEnd` (yürüyüş fırsat saldırısından sonra durur, sürüm 38), hareketEt ışınlanma girişiyle yarı hız (`teleportEvent`; yol bulmaz, kısmi). Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate; dostaIsabet etkileri ve iskalat/yonlendir/kritikIptal isabet tepki kancasında (`registerAllyHit`, hasar değiştirebilir); zorlaSonuc ikinci şans girişinde (`effectDice.ts` `secondChances`, `ExtraDie.reroll` success/forceFail). Karar `askReaction` (oyuncuya sorulur). |
| `gecicCan` | Geçici can. | `eylem`, `bonus`, `serbest`, `savasBasi`, `turBasi`, `oldurunce`, `isabet`, `hasarAlinca` | `temp_hp` olayı (fazlası birikmez; yükseği kalır). |
| `iyilestirme` | İyileştirme (ve isteğe bağlı durum kaldırma). | `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce`, `isabet` | `healed` / `condition_ended` olayları (en çok HP aşılmaz; ölüyü kaldırmaz). |
| `hasar` | Doğrudan hasar (kurtulmalı ya da kurtulmasız). | `eylem`, `bonus`, `serbest`, `turBasi`, `oldurunce` | `save_resolved` olayı (imza eylemleriyle aynı yol: `resolveSave`, `saveDamage` Evasion, `adjustDamage`, `damageEffects`). |
| `durumUygula` | Durum uygular (kurtulmalı, süreli, tekrar kurtulmalı). | `eylem`, `bonus`, `isabet`, `oldurunce` | Süren etki `grants` + `repeatSave` (`effects.ts`), Cesaret `resistImmunityEvent` (`auraCore.ts`). |
| `isaret` | Hedefi işaretler; işaretliye avantaj ve diğer ilkellerin `isaretli:<id>` koşulu. | `bonus`, `eylem`, `isabet` | Hedefte süren etki (`attackedAdvBy` işaretleyene, `attackedAdv` herkese; `wardSources`). |
| `cagir` | Paketin `yaratiklar` tanımından yaratık çağırır. | `eylem`, `bonus`, `savasBasi`, `sifirCan`, `oldurunce` | R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü). |
| `boyut` | Büyüme (Large/Huge): ek hasar zarı, jeton ölçeği. | `bonus`, `eylem`, `pasif` | Süren etki `size` (+1) ve `hitDie` (Enlarge yolu). |
| `ucus` | Uçuş hızı. | `pasif`, `bonus`, `eylem`, `savasBasi` | Süren etki `fly` (`flight.ts` `flySpeed`, `isAirborne`). |
| `isinlan` | Kendini görülen boş altıgene ışınlar. | `bonus`, `eylem`, `serbest` | K53 tek ışınlanma girişi (`teleport.ts` `teleportEvent`, `motion.ts` `withArrival`). |
| `zorlaHareket` | İtme/çekme/yana kaydırma (isabette ya da eylemle). | `isabet`, `eylem`, `bonus` | K53 tek zorla hareket girişi (`motion.ts` `forcedMove`: çarpma, düşme, zemin tetikleri). |
| `olumdenDon` | 0 HP'ye düşecekken ayakta kalır. | `sifirCan` | Death Ward yolu (`damage-effects.ts` `deathWard` etkisi; kullanılınca kaynak harcanır, gerekirse `healed`). |
| `ekSaldiri` | Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle); pasifte Saldırı eylemindeki saldırı sayısı. | `bonus`, `oldurunce`, `eylem`, `pasif` | Kayıtlı saldırı yolu (`reactions.ts` `strikeApi`); dost: dostun tepkisi harcanır (`reactionUsed`), en zayıf düşmana. |
| `zarEtkisi` | Zar ve savunma eklentileri: AC, kurtulma, avantaj/dezavantaj, bonus zar, inisiyatif. | `pasif`, `bonus`, `eylem`, `isabet`, `savasBasi` | Süren etki alanları `ac`, `saveMod`, `saveAdv`, `attackAdv`, `checkAdv`, `attackDis`, `saveDis`, `dice` (`effectDice.ts`); inisiyatif `initiativeBonus`. |
| `kaynak` | Kullanım havuzu tanımı (diğer ilkeller `kaynak.id` ile harcar). | `pasif` | Sınıf kaynakları (`data/class-features.json` `resources` biçimi; `classResources`, `rechargeResources`, savaş sonu karaktere yazılır). |
| `bicim` | Süreli biçim (dönüşüm): geçici can, AC, hız, direnç, ek hasar, uçuş, avantaj. | `bonus`, `eylem` | Wild Shape/Karadul biçim yolu yerine tek süren etki (`tempHpNow`, `ac`, `speedFt`, `fly`, `resist`, `hitDie`, `attackAdv`); jeton değişmez. |
| `yuzeyOlustur` | Altıgenlere yüzey (yağ, buz, alev…) ya da geçici engel koyar. | `eylem`, `bonus`, `oldurunce`, `isabet`, `buyuYuvasi`, `turBasi` | Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler), K53 geçici engel (`barriers.ts` `barrierEvents`) ya da satır içi kurallı alan (`SpellZone.spec`: tur başı/sonu/giriş tetikleri, kurtulma, hasar, durum, zorlu arazi; `zones.ts`). |
| `buyuVer` | Her an hazır büyüler; isteğe bağlı kaynakla slotsuz. | `pasif` | Sınıf kiti `alwaysPrepared` ve kaynak `freeSpellList` (Favored Enemy yolu). |
| `buyuDegisimi` | Büyü hasarına eklenti (türe/okula göre). | `pasif` | Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu), yapım öncesi büyü dönüşümü (menzil, tür; Eldritch Spear/Transmuted yolu), kurtulma kipi (`durations.ts` `saveMode`). |
| `gorunmezlik` | Invisible durumu (saldırınca/büyü yapınca biter). | `bonus`, `eylem`, `oldurunce`, `hasarAlinca` | Süren etki `grants: ["Invisible"]` + `breakOnAct` (Invisibility yolu). |
| `moralEtkisi` | Moral havuzuna ekleme/çıkarma (K48; Moral kapalıyken sessiz yok sayılır). | `bonus`, `eylem`, `turBasi`, `oldurunce`, `isabet` | `moral_changed` olayı (`morale.ts` `moraleOn`). |
| `zarMuhru` | Savaş başında N adet d20 atılıp saklanır; bir d20 testinin doğal zarı saklı zarla değiştirilir (sonucu çevirecekse). | `pasif` | Savaş başında saklı zarlar sahibinde süren etki (`pkMuhur`, her zar ayrı etki); ikinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll` set/setSpoil); menzil reducer türetimi (`syncAuras` → `pkSans`). Harcanan zarın etkisi biter, kaynak düşer. |
| `engeldenGec` | Duvar, engel ve yaratıkların içinden geçer; fırsat saldırısı tetiklemez. | `bonus`, `eylem`, `pasif` | Engelden geçme (`phase.ts`: süren etki `phase`) ve `noProvoke`. |
| `hiz` | Hız artışı (pasif ya da süreli). | `pasif`, `bonus`, `eylem`, `savasBasi` | Süren etki `speedFt`. |
| `buyuluVurus` | Saldırılar büyülü sayılır: büyüsüz saldırıya direnç/bağışıklık (`buyusuzDirencler`) aşılır. | `pasif` | Süren etki `pkMagic`; hasar profili (`magicStrike.ts` `nonmagicalProfile`: silah ve canavar saldırısı). SRD 5.2.1 canavarlarında büyüsüz direnç yok; paket yaratıkları `buyusuzDirencler` ile tanımlar. |
| `zarDegistir` | İsabette hasar zarlarını değiştirir: en yükseğe çek, düşükleri yeniden at, ikiye katla ya da büyüt. | `isabet` | İsabet kancası (`hitHooks.ts`; bağlam artık saldırının zarlarını taşır): fark ek hasar olarak (`ExtraDamage`, direnç hedefe göre). Kurtulmalı büyü hasarı kapsam dışı (kısmi). |
| `koruma` | Pasif koruma: kritik vuruş bağışıklığı, konsantrasyon kurtulmasında avantaj, durumlara karşı kurtulma avantajı. | `pasif`, `bonus`, `eylem` | Süren etki `noCrit` (`rules/attack.ts`), `concAdv` (`damage-effects.ts` konsantrasyon), `saveAdvAgainst` (`effectDice.ts`). |
| `algi` | Algı: karanlık görüş, gerçek görüş (Truesight), görünmezi görme. | `pasif`, `bonus`, `eylem` | Süren etki `darkvision` (`darkvisionOf`), `pkTruesight` (`sight.ts` `senseSees`), `seeInvisible`. |
| `cagirGuclendir` | Sahibin çağırdığı her yaratık (büyü ya da paket) geçici can, AC ve isabette ek zar kazanır. | `pasif` | Komut sonu: bu komutta çağrılan (`summoned` olayı) ve sahibi bu ilkeli taşıyan yaratığa süren etki (`ac`, `hitDie`, `pkMagic`) ve `temp_hp`. |
| `ortakCan` | Dostları ortak can havuzuna bağlar (hasar havuzdan düşer). | `eylem`, `bonus` | Ortak can havuzu (`hpPool.ts`, `hp_pool_created`; A1). |
| `yuvaGeriKazan` | Bir büyü yuvası geri kazanılır (en çok `enCokSeviye`; büyücünün en yüksek uygun seviyesinde). | `bonus`, `eylem`, `oldurunce`, `turBasi`, `buyuYuvasi` | `slot_created` olayı (Flexible Casting yolu). Hangi yuvanın harcandığı bilinmez: uygun en yüksek seviye (kısmi değil, sınır veride). |
| `meydanOkuma` | Hedef senden başkasına saldırırken dezavantajlı. | `bonus`, `eylem`, `isabet` | Hedefte süren etki `tauntBy` (`divine.ts` `wardSources`). |
| `saldirmadanSave` | Sana saldırmak isteyen önce kurtulma atar; başarısızsa başka hedef seçer ya da saldırı boşa gider. | `pasif`, `bonus`, `eylem` | Sanctuary yolu (süren etki `sanctuary`, olay `sanctuary_save`). |
| `kaynakYenile` | Bir kaynaktan kullanım geri kazanılır. | `savasBasi`, `turBasi`, `oldurunce`, `isabet`, `bonus` | `feature_used` olayı (kalan artar); üst sınır savaşçıdaki `paket.kaynakBas`. |
| `tepkiHakki` | Ek tepki hakkı: her yaratığın turunda bir tepki (tur başına bir değil). | `pasif` | Süren etki `pkReactive` (reducer `turn_ended`: `reactive` özelliğiyle aynı yenilenme). Sürüm 38+. |
| `zarYenile` | Başarısız d20 testini yeniden attırır (kendin ya da menzildeki dost); ikiAtSec: iki zar atılır, iyisi seçilir. | `pasif` | İkinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll: d20` + `rerollMode: advantage`); menzil reducer türetimi (`syncAuras` → `pkSans`, tür `yenile`). Sürüm 38+. |
| `buyuPaylas` | Kendine yaptığın büyünün süren etkisi menzildeki bir dosta da uygulanır (aynı süre ve konsantrasyon). | `pasif` | Komut sonu: `cast_spell` ile büyücüye eklenen etki (`effect_added`, kaynak büyücü) en zayıf dosta kopyalanır (`…:pk-paylas`). Sürüm 38+. |
| `kontrolEt` | Düşmanı yönetir: kurtulmayı geçemezse süre boyunca senin tarafında savaşır. | `eylem`, `bonus`, `isabet`, `oldurunce` | Taraf değiştirme (`allegiance.ts`: süren etki `dominate`; Game Master anahtarı `allegianceSwap`). Sürüm 38+. |
| `zamanDurdur` | Zamanı durdurur: art arda N tur oynarsın (Time Stop yolu; başkasını etkileyince biter). | `eylem`, `bonus` | `time_stop` olayı (`spells69.ts` Time Stop ile aynı: art arda tur, başkasına etki edince biter). Sürüm 38+. |
| `flurryEk` | Flurry of Blows ek vuruş sayısı (vuruşlar farklı hedeflere dağıtılabilir; hedef her vuruşta seçilir). | `pasif` | Süren etki `pkFlurry` (`economy.ts` Flurry kalanı). Flurry vuruşuna bağlı etkiler `kosul: ["flurryVurusu"]` ile (ör. isabette `iyilestirme`). Sürüm 38+. |
| `olumZari` | Ölüm kurtulmasında başarı atınca can kazanırsın (ayağa kalkarsın). | `pasif` | Komut sonu: `death_save` (başarı) → `healed` (0 HP'den kalkış). Sürüm 38+. |
| `canArtisi` | Savaş başında en çok can artar (ve can). | `pasif` | Savaş kuruluşunda (`withPaket`) en çok can ve can artar (başlangıç olayı taşır; Aid yolu). Sürüm 38+. |

## Ortak kurallar

- **Tetik** (`tetik`): `pasif`, `eylem`, `bonus`, `serbest`, `isabet`, `turBasi`, `turSonu`, `savasBasi`, `oldurunce`, `hasarAlinca`, `sifirCan`, `tepki`, `buyuYuvasi`. Yazılmazsa ilkelin ilk izinli tetiği.
- **Düğme:** aynı özellikte aynı düğme tetikli (`eylem`, `bonus`, `serbest`) ilkeller tek düğmede birleşir ve sırayla çalışır; düğme bir hedef (dost/düşman) ve/veya bir altıgen ister (ilkellerin ihtiyacına göre). Kaynağı düğmedeki ilk `kaynak` alanlı ilkel belirler; düğme başına bir kez harcanır. `eylem` eylem, `bonus` bonus eylem harcar, `serbest` harcamaz.
- **Otomatik tetikler:** `isabet` (kendi saldırın isabet edince; ek hasar zarı hasardan önce, diğerleri sonra), `turBasi`/`turSonu` (kendi turun), `savasBasi` (savaş başlarken), `oldurunce` (komutunla bir düşman 0 HP'ye düşünce), `hasarAlinca` (hasar alınca), `sifirCan` (0 HP'ye düşecekken), `tepki` (tepki hakkı; oyuncuya sorulur). `pasif` sürekli (koşullu olanlar her komut sonunda eşitlenir).
- **Formül:** sayı, zar ve belirteçler: `$pb (yeterlilik)`, `$pbYari (yarısı, en az 1)`, `$lvl (karakter seviyesi)`, `$lvl2 (iki katı)`, `$str…$cha (değiştirici, en az 0)`, `$buyu (büyü değiştiricisi)`. En çok bir zar terimi; yalnız `+` ve `-` (çarpma yok): `"1d8+$wis"`, `"$lvl+2"`. Seviye tablosu: `{ "3": "1d6", "11": "2d6" }` (karakter seviyesine göre en yüksek eşik).
- **Koşul** (`kosul`, hepsi doğru olmalı): `ofke`, `yarimCanAlti`, `zirhsiz`, `avantajli`, `dostBitisik`, `konsantrasyon`, `buyuTurunda`, `seviyeliBuyuTurunda`, `hedefBuyuk`, `flurryVurusu`, `ilkTur`, `bicim:<id>` (bu özelliğin `bicim` ilkeli etkin), `isaretli:<id>` (hedef senin bu işaretinle işaretli).
- **Kaynak:** `{ "id": "...", "maliyet": 1 }`; kimlik aynı alt sınıftaki bir `kaynak` ilkelinin `id`'si ya da sınıf kaynağı (`rage`, `focus`, `channelDivinity`, `bardicInspiration`, `sorceryPoints`, `wildShape`, `layOnHands`…). Kaynak bitince düğme kapanır, otomatik tetik çalışmaz.
- **Süre:** tur sayısı ya da `"kalici"`. Kurtulma DC'si: `"buyu"`, sayı ya da yetenek listesi (8 + PB + en iyisi).
- **Kısmi:** tabloda **Kısmi** işaretli alan kalmadı (P6). Yaklaşık kalan birleşimler: tepkide `hasarAldim` yalnız `karsiVurus` ile, `kritikIptal` hasarı yarıya indirir (kritik zarları ayrıca bilinmez). Böyle bir birleşim kullanan özellik `"kismi"` yazılmalı (`check:icerik` uyarır).

### Ortak alanlar (her ilkelde)

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `tur` | metin | evet | — | İlkelin adı (aşağıdaki listeden). |
| `id` | kimlik | hayır | — | Bu ilkelin kimliği (özellik içinde benzersiz; `bicim:<id>`, `isaretli:<id>` koşulları ve `kaynak` tanımı buna başvurur). |
| `tetik` | seçenek: `pasif`, `eylem`, `bonus`, `serbest`, `isabet`, `turBasi`, `turSonu`, `savasBasi`, `oldurunce`, `hasarAlinca`, `sifirCan`, `tepki`, `buyuYuvasi` | hayır | — | Ne zaman çalışır (ilkelin izin verdikleri; yazılmazsa ilki). |
| `hedef` | seçenek: `kendi`, `dost`, `dostVeyaKendi`, `dostlar`, `dusman`, `dusmanlar`, `bitisikDusmanlar`, `alan`, `vurulan` | hayır | — | Kime (ilkelin izin verdikleri; yazılmazsa ilki). |
| `kaynak` | kaynak başvurusu | hayır | — | Harcanan kaynak: `{ "id": "<kaynak ilkeli id ya da sınıf kaynağı (rage, focus, channelDivinity…)>", "maliyet": 1 }`. Düğmede yalnızca ilk kaynaklı ilkel harcar (düğme başına bir kez). |
| `kosul` | koşul listesi | hayır | — | Hepsi doğruysa çalışır: ofke, yarimCanAlti, zirhsiz, avantajli (isabet), dostBitisik (hedefe bitişik dost), konsantrasyon, buyuTurunda (bu tur büyü yaptın), seviyeliBuyuTurunda (bu tur slotlu büyü), hedefBuyuk (hedef senden büyük), bicim:<id>, isaretli:<id> (hedef bu işaretle işaretli), harita:<bölge> (savaş haritasının bölgesi); P9: flurryVurusu (bu tur Flurry of Blows kullanıldı), ilkTur (savaşın 1. turu). |
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
| `etki` | seçenek: `kurtulmaBonusu`, `hasar`, `durum`, `durumBagisikligi`, `gecicCan`, `iyilestirmeYok`, `olumKurtulmaAvantaji`, `olumKurtulmaDezavantaji`, `moral`, `direnc`, `kurtulmaDezavantaji` | evet | — | Etki türü (P7: direnc = auradakilere `turler` direnci; kurtulmaDezavantaji = auradakilerin kurtulmaları dezavantajlı; ikisi de pasif). |
| `turler` | hasar türü listesi | hayır | — | direnc etkisinin türleri (P7). |
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
- Sistem ve kanca: P9: firsatSaldirisi/kurtulmaAttirildi komut sonu kancası (fırsat saldırısı `attack_resolved.opportunity`, `save_resolved.actorId`), isaretliVurdu/komsuHedefVuruldu saldırı sonrası kancası (`registerAfterAttack`), dusmanBuyuAtiyor büyü kancası (`registerCastHook`, Counterspell ile aynı an); hizSifir süren etki `speedZero` + `untilOwnTurnEnd` (yürüyüş fırsat saldırısından sonra durur, sürüm 38), hareketEt ışınlanma girişiyle yarı hız (`teleportEvent`; yol bulmaz, kısmi). Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate; dostaIsabet etkileri ve iskalat/yonlendir/kritikIptal isabet tepki kancasında (`registerAllyHit`, hasar değiştirebilir); zorlaSonuc ikinci şans girişinde (`effectDice.ts` `secondChances`, `ExtraDie.reroll` success/forceFail). Karar `askReaction` (oyuncuya sorulur).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `olay` | seçenek: `banaIsabet`, `dostaIsabet`, `hasarAldim`, `zarTesti`, `dostaVuruldu`, `firsatSaldirisi`, `dusmanBuyuAtiyor`, `isaretliVurdu`, `komsuHedefVuruldu`, `kurtulmaAttirildi` | hayır | `"banaIsabet"` | Tetikleyen olay: sana isabet, menzildeki dosta isabet, yakın dövüşte hasar aldın, menzildeki bir yaratığın d20 testi (yalnız zorlaSonuc), menzildeki dosta saldırı isabet edip hasar verdi (P7; saldırgana karşılık); P9: firsatSaldirisi (senin fırsat saldırın isabet etti; tepki zaten harcandı, ek tepki harcanmaz), dusmanBuyuAtiyor (menzildeki düşman büyü yapmaya başlıyor; Counterspell anı), isaretliVurdu (senin `isaret`inle işaretli düşman sana ya da dostuna isabet etti), komsuHedefVuruldu (sana bitişik düşmana bir dostun isabet etti), kurtulmaAttirildi (senin etkinle bir düşman kurtulma attı; `sonuc` ile süzülür). |
| `etki` | seçenek: `acBonusu`, `hasarAzalt`, `yariya`, `direnc`, `karsiVurus`, `iskalat`, `yonlendir`, `kritikIptal`, `zorlaSonuc`, `saldiriYap`, `yansit`, `hizSifir`, `hareketEt`, `buyuIptal`, `hasarEkle` | evet | — | Tepkinin etkisi: AC, hasar azaltma, yarıya, direnç (yarıya), karşı vuruş, ıskalatma, başka hedefe saptırma, kritiği normal vuruşa çevirme, d20 testini başarı/başarısızlık sayma; P7: saldiriYap (saldırgana silah saldırısı, erişimdeyse), yansit (alınan hasarın `oran` katı saldırgana; kurtulma verilirse yarıya); P9: hizSifir (olaydaki düşmanın hızı turunun sonuna dek 0; kurtulma verilirse başarısızlıkta), hareketEt (yarı hızın kadar fırsat saldırısı tetiklemeden uzaklaş; banaIsabet), buyuIptal (büyü boşa gider; kurtulma verilirse başarısızlıkta; eylem harcanır, yuva harcanmaz), hasarEkle (olaydaki düşmana `miktar` hasar, tür `hasarTuru`). |
| `hasarTuru` | hasar türü | hayır | `"force"` | P9 hasarEkle: hasar türü. |
| `iptal` | true/false | hayır | `false` | P9 dusmanBuyuAtiyor + saldiriYap: saldırı isabet ederse büyü boşa gider. |
| `oran` | sayı | hayır | `1` | yansit: hasarın oranı (0,5 = yarısı; P7). |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `miktar` | formül | hayır | — | acBonusu (sayı) ya da hasarAzalt zarı (`"1d10+$wis"`). |
| `saldiri` | seçenek: `hepsi`, `yakin`, `menzilli` | hayır | `"hepsi"` | Yalnız bu saldırılarda. |
| `turler` | hasar türü listesi | hayır | — | hasarAzalt/direnc yalnız bu türlerde. |
| `menzilFt` | tamsayı | hayır | `30` | dostaIsabet / zarTesti: yaratığa uzaklık; yonlendir: yeni hedefin asıl hedefe uzaklığı (ft). |
| `sonuc` | seçenek: `basari`, `basarisiz` | hayır | `"basari"` | zorlaSonuc: test başarı (dost/kendi) ya da başarısızlık (düşman) sayılır. |
| `kim` | seçenek: `dost`, `kendi`, `dusman` | hayır | `"dost"` | zorlaSonuc: kimin testi (dost kendini de kapsar). |
| `testler` | seçenek listesi: `saldiri`, `kurtulma`, `kontrol` | hayır | `["saldiri","kurtulma","kontrol"]` | zorlaSonuc: hangi d20 testleri. |

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
| `aktar` | true/false | hayır | `false` | P9: işaretli 0 cana düşünce işaret `menzilFt` içindeki en yakın düşmana geçer (lanet aktarımı; kalan süreyle). |

Örnek:

```json
{"tur":"isaret","id":"av","tetik":"bonus","menzilFt":60,"sure":10,"avantaj":"isaretleyen"}
```

## `cagir`

Paketin `yaratiklar` tanımından yaratık çağırır.

- Tetikler: `eylem`, `bonus`, `savasBasi`, `sifirCan`, `oldurunce` (varsayılan `eylem`).
- Sistem ve kanca: R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yaratik` | yaratık kimliği | evet | — | Paket `yaratiklar` kimliği. |
| `sayi` | formül | hayır | `1` | Kaç tane. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `konsantrasyon` | true/false | hayır | `false` | Konsantrasyon: çağıran konsantre olur (`concentration_started`; başka konsantrasyon ya da bozulma yaratığı kaldırır). |
| `mod` | seçenek: `normal`, `olenden` | hayır | `"normal"` | olenden: bu savaşta ölen yaratıkların karesinde diriltir (ceset başına bir kez). |
| `taraf` | seçenek: `hepsi`, `dusman`, `dost` | hayır | `"hepsi"` | olenden: hangi tarafın ölüleri. |
| `boyutSiniri` | seçenek: `L`, `T`, `S`, `M`, `H`, `G` | hayır | `"L"` | olenden: bu boyut ve küçükleri (varsayılan L). |
| `inisiyatif` | seçenek: `sahip`, `ayri` | hayır | `"sahip"` | sahip: sahibinin hemen ardından oynar; ayri: kendi inisiyatifi. |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `tekrar` | seçenek: `degistir`, `ekle` | hayır | `"degistir"` | Yeniden çağırınca: öncekiler kaybolur (degistir) ya da eklenir. |
| `rastgele` | yaratık kimliği listesi | hayır | — | P7: her çağırmada bu listeden zarla bir yaratık (`yaratik` yerine; eşit olasılık). |
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
| `erisimFt` | tamsayı | hayır | — | Yakın dövüş erişimine eklenen (ft; saldırı ve fırsat saldırısı). |

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
| `sonrasi` | seçenek: `yok`, `yereSer` | hayır | `"yok"` | P7: itmeden sonra (kurtulmayı geçemediyse) Prone. |
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

Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle); pasifte Saldırı eylemindeki saldırı sayısı.

- Tetikler: `bonus`, `oldurunce`, `eylem`, `pasif` (varsayılan `bonus`).
- Hedefler: `dusman`, `dost` (varsayılan `dusman`).
- Sistem ve kanca: Kayıtlı saldırı yolu (`reactions.ts` `strikeApi`); dost: dostun tepkisi harcanır (`reactionUsed`), en zayıf düşmana.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `menzilFt` | tamsayı | hayır | `60` | Hedef menzili (ft). |
| `saldiriSayisi` | tamsayı | hayır | — | Pasif: Saldırı eylemindeki saldırı sayısı (en az; ör. 2 = ikinci saldırı). |

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
| `inisiyatifAvantaji` | true/false | hayır | `false` | P9: inisiyatif avantajlı (yalnız koşulsuz pasif; savaş başında atılır). |
| `d20AltSinir` | tamsayı | hayır | — | d20 alt sınırı: doğal zar bundan küçükse bu sayılır (başarıya çevirecekse uygulanır). |
| `d20Icin` | seçenek listesi: `saldiri`, `kurtulma`, `kontrol` | hayır | `["saldiri","kurtulma","kontrol"]` | d20AltSinir hangi testlerde. |
| `kritikAralik` | tamsayı | hayır | — | Saldırıda doğal zar bu değer ve üstüyse kritik (ör. 19). |
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

- Tetikler: `eylem`, `bonus`, `oldurunce`, `isabet`, `buyuYuvasi`, `turBasi` (varsayılan `eylem`).
- Sistem ve kanca: Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler), K53 geçici engel (`barriers.ts` `barrierEvents`) ya da satır içi kurallı alan (`SpellZone.spec`: tur başı/sonu/giriş tetikleri, kurtulma, hasar, durum, zorlu arazi; `zones.ts`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yuzey` | seçenek: `oil`, `water`, `ice`, `fire`, `burningWeb`, `steam`, `slick`, `poison`, `engel:cizili-duvar`, `engel:dost-kalkani`, `engel:enkaz-yigini`, `alan` | evet | — | Yüzey türü (`data/yuzeyler.json`), `engel:<tür>` (`data/engeller.json`) ya da `alan` (yalnız zemin etkisi). |
| `yaricapFt` | tamsayı | hayır | `5` | Yarıçap (ft; 0 tek altıgen). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `sure` | süre | hayır | — | Süre (yoksa verideki). |
| `zaman` | seçenek listesi: `turBasi`, `turSonu`, `girince` | hayır | — | Zemin etkisi ne zaman işler (yuzey "alan" ya da yüzeye ek). |
| `hasar` | formül | hayır | — | Zemin hasarı. |
| `hasarTuru` | hasar türü | hayır | — | Zemin hasarının türü. |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `durum` | durum | hayır | — | Başarısız kurtulmada durum. |
| `zorluArazi` | true/false | hayır | `false` | Zorlu arazi (hız düşürme: altıgen başına 2 hareket). |
| `hedefler` | seçenek: `hepsi`, `dusmanlar`, `dostlar` | hayır | `"hepsi"` | Kimleri etkiler (P7: dostlar). |
| `iyilestir` | formül | hayır | — | P7: zaman tetiğinde alandaki (hedefler) yaratıkları iyileştirir (hasar yerine). |

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
- Sistem ve kanca: Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu), yapım öncesi büyü dönüşümü (menzil, tür; Eldritch Spear/Transmuted yolu), kurtulma kipi (`durations.ts` `saveMode`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `hasarEki` | formül | hayır | — | Büyü hasarına eklenti (bir kez). |
| `hasarTurleri` | hasar türü listesi | hayır | — | Yalnız bu türlerde. |
| `okul` | metin | hayır | — | Yalnız bu okul (Evocation…). |
| `kurtulmaDezavantaji` | true/false | hayır | `false` | Büyülerine ve alan etkilerine karşı kurtulmalar dezavantajlı. |
| `menzilEkiFt` | tamsayı | hayır | — | Menzilli (5 ft üstü) büyülerin menziline eklenen. |
| `yeniTur` | hasar türü | hayır | — | Hasar türünü değiştir (`hasarTurleri` verilirse yalnız onlardan). |

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

## `zarMuhru`

Savaş başında N adet d20 atılıp saklanır; bir d20 testinin doğal zarı saklı zarla değiştirilir (sonucu çevirecekse).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Savaş başında saklı zarlar sahibinde süren etki (`pkMuhur`, her zar ayrı etki); ikinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll` set/setSpoil); menzil reducer türetimi (`syncAuras` → `pkSans`). Harcanan zarın etkisi biter, kaynak düşer.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sayi` | formül | evet | — | Saklanan zar sayısı (kaynak verilirse kalan kullanım kadar, en çok bu). |
| `kim` | seçenek listesi: `kendi`, `dost`, `dusman` | hayır | `["kendi","dost","dusman"]` | Kimin testinde: kendi, dost (başarısızı başarıya), düşman (başarılıyı başarısıza). |
| `menzilFt` | tamsayı | hayır | `60` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"zarMuhru","sayi":2,"kim":["kendi","dost","dusman"],"kaynak":{"id":"kehanet","maliyet":1}}
```

## `engeldenGec`

Duvar, engel ve yaratıkların içinden geçer; fırsat saldırısı tetiklemez.

- Tetikler: `bonus`, `eylem`, `pasif` (varsayılan `bonus`).
- Sistem ve kanca: Engelden geçme (`phase.ts`: süren etki `phase`) ve `noProvoke`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sure` | süre | hayır | `1` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `firsatYok` | true/false | hayır | `true` | Fırsat saldırısı tetiklemez. |
| `zorluArazi` | true/false | hayır | `true` | Engel içi zorlu arazi. |

Örnek:

```json
{"tur":"engeldenGec","tetik":"bonus","sure":1,"kaynak":{"id":"golge-adimi","maliyet":1}}
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

## `buyuluVurus`

Saldırılar büyülü sayılır: büyüsüz saldırıya direnç/bağışıklık (`buyusuzDirencler`) aşılır.

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `pkMagic`; hasar profili (`magicStrike.ts` `nonmagicalProfile`: silah ve canavar saldırısı). SRD 5.2.1 canavarlarında büyüsüz direnç yok; paket yaratıkları `buyusuzDirencler` ile tanımlar.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `kapsam` | seçenek listesi: `kendi`, `cagrilanlar` | hayır | `["kendi"]` | kendi saldırıları; cagrilanlar: çağırdığı yaratıkların saldırıları. |

Örnek:

```json
{"tur":"buyuluVurus","kapsam":["kendi","cagrilanlar"]}
```

## `zarDegistir`

İsabette hasar zarlarını değiştirir: en yükseğe çek, düşükleri yeniden at, ikiye katla ya da büyüt.

- Tetikler: `isabet` (varsayılan `isabet`).
- Sistem ve kanca: İsabet kancası (`hitHooks.ts`; bağlam artık saldırının zarlarını taşır): fark ek hasar olarak (`ExtraDamage`, direnç hedefe göre). Kurtulmalı büyü hasarı kapsam dışı (kısmi).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `mod` | seçenek: `maks`, `yenidenAt`, `carpan`, `zarBuyut` | evet | — | maks: zarlar en yüksek; yenidenAt: `esik` ve altı bir kez yeniden; carpan: zarlar bir kez daha eklenir; zarBuyut: her zar bir boy büyük (d6→d8). |
| `esik` | tamsayı | hayır | `2` | yenidenAt: bu değer ve altındaki zarlar (varsayılan 2). |
| `saldiri` | seçenek: `silah`, `yakin`, `menzilli`, `buyu`, `hepsi` | hayır | `"silah"` | Hangi saldırılar. |
| `hasarTurleri` | hasar türü listesi | hayır | — | Yalnız bu hasar türlerinde. |

Örnek:

```json
{"tur":"zarDegistir","mod":"maks","hasarTurleri":["lightning","thunder"],"kaynak":{"id":"focus","maliyet":1}}
```

## `koruma`

Pasif koruma: kritik vuruş bağışıklığı, konsantrasyon kurtulmasında avantaj, durumlara karşı kurtulma avantajı.

- Tetikler: `pasif`, `bonus`, `eylem` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `noCrit` (`rules/attack.ts`), `concAdv` (`damage-effects.ts` konsantrasyon), `saveAdvAgainst` (`effectDice.ts`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `kritikBagisikligi` | true/false | hayır | `false` | Kritik vuruş normal vuruş sayılır. |
| `konsantrasyonAvantaji` | true/false | hayır | `false` | Konsantrasyon kurtulması avantajlı. |
| `durumAvantaji` | durum listesi | hayır | — | Bu durumlara karşı kurtulmalar avantajlı. |
| `buyulereAvantaj` | true/false | hayır | `false` | Büyülere karşı kurtulmalar avantajlı. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |

Örnek:

```json
{"tur":"koruma","kritikBagisikligi":true,"konsantrasyonAvantaji":true}
```

## `algi`

Algı: karanlık görüş, gerçek görüş (Truesight), görünmezi görme.

- Tetikler: `pasif`, `bonus`, `eylem` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `darkvision` (`darkvisionOf`), `pkTruesight` (`sight.ts` `senseSees`), `seeInvisible`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `karanlikGorusFt` | tamsayı | hayır | — | Karanlık görüş (ft; büyüğü geçerli). |
| `gercekGorusFt` | tamsayı | hayır | — | Gerçek görüş (ft; görünmez ve büyülü karanlık). |
| `gorunmezGor` | true/false | hayır | `false` | Görünmezi görür. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |

Örnek:

```json
{"tur":"algi","karanlikGorusFt":120,"gercekGorusFt":30}
```

## `cagirGuclendir`

Sahibin çağırdığı her yaratık (büyü ya da paket) geçici can, AC ve isabette ek zar kazanır.

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Komut sonu: bu komutta çağrılan (`summoned` olayı) ve sahibi bu ilkeli taşıyan yaratığa süren etki (`ac`, `hitDie`, `pkMagic`) ve `temp_hp`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `gecicCan` | formül | hayır | — | Çağrılınca geçici can. |
| `acBonusu` | formül | hayır | — | AC eklentisi. |
| `ekHasar` | formül | hayır | — | İsabette ek zar (silah ve canavar saldırısı). |
| `buyuluVurus` | true/false | hayır | `false` | Saldırıları büyülü. |
| `turBasiCan` | formül | hayır | — | P9: çağrılan her yaratık kendi tur başında bu kadar geçici can alır (yükseği kalır). |

Örnek:

```json
{"tur":"cagirGuclendir","gecicCan":"$lvl","acBonusu":2,"ekHasar":"1d6"}
```

## `ortakCan`

Dostları ortak can havuzuna bağlar (hasar havuzdan düşer).

- Tetikler: `eylem`, `bonus` (varsayılan `eylem`).
- Hedefler: `dostlar` (varsayılan `dostlar`).
- Sistem ve kanca: Ortak can havuzu (`hpPool.ts`, `hp_pool_created`; A1).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yaricapFt` | tamsayı | hayır | `30` | Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde). |
| `enCok` | tamsayı | hayır | `4` | En çok üye (sahip dahil). |

Örnek:

```json
{"tur":"ortakCan","tetik":"eylem","yaricapFt":30,"enCok":3,"kaynak":{"id":"cagri","maliyet":1}}
```

## `yuvaGeriKazan`

Bir büyü yuvası geri kazanılır (en çok `enCokSeviye`; büyücünün en yüksek uygun seviyesinde).

- Tetikler: `bonus`, `eylem`, `oldurunce`, `turBasi`, `buyuYuvasi` (varsayılan `bonus`).
- Sistem ve kanca: `slot_created` olayı (Flexible Casting yolu). Hangi yuvanın harcandığı bilinmez: uygun en yüksek seviye (kısmi değil, sınır veride).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `enCokSeviye` | tamsayı | hayır | `3` | Yuva seviyesi sınırı. |

Örnek:

```json
{"tur":"yuvaGeriKazan","tetik":"bonus","enCokSeviye":2,"kaynak":{"id":"kehanet","maliyet":1}}
```

## `meydanOkuma`

Hedef senden başkasına saldırırken dezavantajlı.

- Tetikler: `bonus`, `eylem`, `isabet` (varsayılan `bonus`).
- Hedefler: `dusman`, `vurulan` (varsayılan `dusman`).
- Sistem ve kanca: Hedefte süren etki `tauntBy` (`divine.ts` `wardSources`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sure` | süre | hayır | `1` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `save` | nesne | hayır | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |

Örnek:

```json
{"tur":"meydanOkuma","tetik":"isabet","hedef":"vurulan","sure":1,"save":{"yetenek":"wis","dc":"buyu"}}
```

## `saldirmadanSave`

Sana saldırmak isteyen önce kurtulma atar; başarısızsa başka hedef seçer ya da saldırı boşa gider.

- Tetikler: `pasif`, `bonus`, `eylem` (varsayılan `pasif`).
- Sistem ve kanca: Sanctuary yolu (süren etki `sanctuary`, olay `sanctuary_save`).

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `save` | nesne | evet | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |

Örnek:

```json
{"tur":"saldirmadanSave","save":{"yetenek":"wis","dc":"buyu"}}
```

## `kaynakYenile`

Bir kaynaktan kullanım geri kazanılır.

- Tetikler: `savasBasi`, `turBasi`, `oldurunce`, `isabet`, `bonus` (varsayılan `savasBasi`).
- Sistem ve kanca: `feature_used` olayı (kalan artar); üst sınır savaşçıdaki `paket.kaynakBas`.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `yenile` | kaynak başvurusu | evet | — | Geri kazanılan kaynak `{ "id": "<kaynak>", "maliyet": <miktar> }` (maliyet = kazanılan, varsayılan 1). |
| `enCok` | formül | hayır | — | Üst sınır (yoksa savaş başındaki değer). |

Örnek:

```json
{"tur":"kaynakYenile","tetik":"savasBasi","yenile":{"id":"focus","maliyet":1}}
```

## `tepkiHakki`

Ek tepki hakkı: her yaratığın turunda bir tepki (tur başına bir değil).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `pkReactive` (reducer `turn_ended`: `reactive` özelliğiyle aynı yenilenme). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `herTur` | true/false | hayır | `true` | Her yaratığın turunda tepki yenilenir (Marilith Reactive yolu). |

Örnek:

```json
{"tur":"tepkiHakki","herTur":true}
```

## `zarYenile`

Başarısız d20 testini yeniden attırır (kendin ya da menzildeki dost); ikiAtSec: iki zar atılır, iyisi seçilir.

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: İkinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll: d20` + `rerollMode: advantage`); menzil reducer türetimi (`syncAuras` → `pkSans`, tür `yenile`). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `kim` | seçenek listesi: `kendi`, `dost` | hayır | `["kendi"]` | Kimin testinde (dost kendini kapsamaz). |
| `testler` | seçenek listesi: `saldiri`, `kurtulma`, `kontrol` | hayır | `["saldiri","kurtulma","kontrol"]` | Hangi d20 testleri. |
| `mod` | seçenek: `yenidenAt`, `ikiAtSec` | hayır | `"yenidenAt"` | yenidenAt: bir zar yeniden; ikiAtSec: iki zar, yüksek olan (avantajla yeniden atış). |
| `tepkiyle` | true/false | hayır | `false` | Tepki harcar (verilmezse yalnız kaynak; kaynak da yoksa sınırsız: turdaBir ile sınırla). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |

Örnek:

```json
{"tur":"zarYenile","kim":["kendi","dost"],"testler":["saldiri","kurtulma"],"mod":"ikiAtSec","kaynak":{"id":"kehanet","maliyet":1}}
```

## `buyuPaylas`

Kendine yaptığın büyünün süren etkisi menzildeki bir dosta da uygulanır (aynı süre ve konsantrasyon).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Komut sonu: `cast_spell` ile büyücüye eklenen etki (`effect_added`, kaynak büyücü) en zayıf dosta kopyalanır (`…:pk-paylas`). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `enCokSeviye` | tamsayı | hayır | `9` | Yalnız bu seviye ve altı büyüler. |

Örnek:

```json
{"tur":"buyuPaylas","menzilFt":30,"enCokSeviye":3,"kaynak":{"id":"cagri","maliyet":1}}
```

## `kontrolEt`

Düşmanı yönetir: kurtulmayı geçemezse süre boyunca senin tarafında savaşır.

- Tetikler: `eylem`, `bonus`, `isabet`, `oldurunce` (varsayılan `eylem`).
- Hedefler: `dusman`, `vurulan` (varsayılan `dusman`).
- Sistem ve kanca: Taraf değiştirme (`allegiance.ts`: süren etki `dominate`; Game Master anahtarı `allegianceSwap`). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `save` | nesne | evet | — | Kurtulma: `{ "yetenek": "wis", "dc": "buyu" \| 14 \| ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar. |
| `sure` | süre | hayır | `10` | Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu). |
| `menzilFt` | tamsayı | hayır | `30` | Hedef menzili (ft). |
| `turler` | metin | hayır | — | Yalnız bu yaratık türleri (virgüllü: "undead,beast"). |
| `tekrarKurtulma` | true/false | hayır | `false` | Her tur sonunda yeniden kurtulma (başarıda biter). |

Örnek:

```json
{"tur":"kontrolEt","tetik":"eylem","hedef":"dusman","save":{"yetenek":"wis","dc":"buyu"},"sure":10,"turler":"undead","kaynak":{"id":"cagri","maliyet":1}}
```

## `zamanDurdur`

Zamanı durdurur: art arda N tur oynarsın (Time Stop yolu; başkasını etkileyince biter).

- Tetikler: `eylem`, `bonus` (varsayılan `eylem`).
- Sistem ve kanca: `time_stop` olayı (`spells69.ts` Time Stop ile aynı: art arda tur, başkasına etki edince biter). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `sayi` | formül | evet | — | Ek tur sayısı (zar olabilir: "1d4+1"). |

Örnek:

```json
{"tur":"zamanDurdur","tetik":"eylem","sayi":2,"kaynak":{"id":"kehanet","maliyet":1}}
```

## `flurryEk`

Flurry of Blows ek vuruş sayısı (vuruşlar farklı hedeflere dağıtılabilir; hedef her vuruşta seçilir).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Süren etki `pkFlurry` (`economy.ts` Flurry kalanı). Flurry vuruşuna bağlı etkiler `kosul: ["flurryVurusu"]` ile (ör. isabette `iyilestirme`). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `ekVurus` | tamsayı | evet | — | Ek vuruş. |

Örnek:

```json
{"tur":"flurryEk","ekVurus":2}
```

## `olumZari`

Ölüm kurtulmasında başarı atınca can kazanırsın (ayağa kalkarsın).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Komut sonu: `death_save` (başarı) → `healed` (0 HP'den kalkış). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `iyilestir` | formül | evet | — | Kazanılan can. |

Örnek:

```json
{"tur":"olumZari","iyilestir":"1d4+$con","kaynak":{"id":"son-nefes","maliyet":1}}
```

## `canArtisi`

Savaş başında en çok can artar (ve can).

- Tetikler: `pasif` (varsayılan `pasif`).
- Sistem ve kanca: Savaş kuruluşunda (`withPaket`) en çok can ve can artar (başlangıç olayı taşır; Aid yolu). Sürüm 38+.

| Alan | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `miktar` | formül | evet | — | Artış (formül; ör. "$lvl"). |

Örnek:

```json
{"tur":"canArtisi","miktar":"$lvl"}
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
| `buyusuzDirencler` | hasar türü listesi | hayır | — | P7: büyüsüz saldırılara direnç (büyülü vuruş aşar). |
| `canavar` | metin | hayır | — | P7: SRD canavar kimliği (`data/monsters.json`); verilirse stat bloğu oradan (ac/hp/yetenekler/saldırılar gerekmez). |
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
| Zarı yeniden attırma (rakibe yeni d20) | P6 zar mührü ve zorla sonuç d20 testini değiştirir; "rakip yeniden atsın, kötüsünü alsın" ayrı bir karar anı ister. | `ExtraDie.reroll` `worse` yolu genelleştirilince. |
| Savaş dışı yetenekler (sosyal, keşif, zanaat, dil, ritüel) | Savaş motoru dışı. | `hikaye` durumu. |
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
