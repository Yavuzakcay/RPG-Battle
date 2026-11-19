# Mekanik doğrulama matrisi (APK öncesi)

Üretim: `npx vite-node src/sim/mekanikMatris.ts -- --yaz` (tek süreç, ≈5 sn). Kural sürümü 89.
Satır satır sonuçlar: [`mekanik-matris.csv`](mekanik-matris.csv) (UTF-8, virgülle ayrılmış; sütunlar: tür, büyü/saldırı, seviye, sınıflar, mekanik, bağlam, bağlam sınıfı, beklenen, gerçek, sonuç, bulgu, not).

## Özet

- Toplam satır: **6606** (büyü 1851 satır / 339 büyü; silah 670 satır / 46 seçenek; canavar 4085 satır / 579 saldırı).
- Doğru oranı: **100.0%** (6606/6606); karar bekleyenler hariç 100.0%.
- Sonuçlar: doğru 6606 · yanlış 0 · çökme 0 · uygulanmıyor 0 · karar bekliyor 0.
- Kök nedene göre: 0 yanlış, 0 çökme, 0 uygulanmıyor, 0 karar bekleyen bulgu.

| Tür | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |
|---|---:|---:|---:|---:|---:|---:|---:|
| Büyü | 1851 | 1851 | 0 | 0 | 0 | 0 | 100.0% |
| Silah | 670 | 670 | 0 | 0 | 0 | 0 | 100.0% |
| Canavar | 4085 | 4085 | 0 | 0 | 0 | 0 | 100.0% |

## Önce / sonra (düzeltme turları)

| Aşama | Sürüm | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| İlk ölçüm (3116efd) | 82 | 6587 | 6312 | 235 | 9 | 2 | 29 | 95.8% |
| Kahin/ölçüm düzeltmesi, sürüm 82 | 82 | 6587 | 6321 | 235 | 0 | 2 | 29 | 96.0% |
| Grup 1 sonrası (Ç01, B01, B02, B03, B05) | 83 | 6587 | 6501 | 55 | 0 | 2 | 29 | 98.7% |
| Grup 2 sonrası (B07, B09, B11, B12, B17, B19, U01) | 83 | 6587 | 6514 | 43 | 0 | 1 | 29 | 98.9% |
| Grup 3 sonrası (B04, B06, B08, B10, B13, B14, B15, B16, B18, B20) | 83 | 6587 | 6554 | 3 | 0 | 1 | 29 | 99.5% |
| Karşılaştırma: sürüm 82, son kahinle | 82 | 6589 | 6340 | 247 | 0 | 2 | 0 | 96.2% |
| Kararlar sonrası (K01, K02, K03, K04) | 83 | 6587 | 6583 | 3 | 0 | 1 | 0 | 99.9% |
| Son ölçüm (B21, B22, B23, G02) | 83 | 6589 | 6588 | 0 | 0 | 1 | 0 | 100.0% |
| Control Water dört seçenek (+4 satır) | 84 | 6606 | 6606 | 0 | 0 | 0 | 0 | 100.0% |
| WS87 Wild Shape (sürüm 87) | 87 | 6606 | 6606 | 0 | 0 | 0 | 0 | 100.0% |

Bulgu başına doğru olmayan satır (aşama sırasıyla):

| Bulgu | İlk ölçüm (3116efd) | Kahin/ölçüm düzeltmesi, sürüm 82 | Grup 1 sonrası (Ç01, B01, B02, B03, B05) | Grup 2 sonrası (B07, B09, B11, B12, B17, B19, U01) | Grup 3 sonrası (B04, B06, B08, B10, B13, B14, B15, B16, B18, B20) | Karşılaştırma: sürüm 82, son kahinle | Kararlar sonrası (K01, K02, K03, K04) | Son ölçüm (B21, B22, B23, G02) | Control Water dört seçenek (+4 satır) | WS87 Wild Shape (sürüm 87) | Düzeltme |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| B01 | 72 | 72 | 1 | 1 | 0 | 72 | 0 | 0 | 0 | 0 | sürüm 83: `saveMode` Restrained DEX dezavantajı (`srd83` işareti) |
| B02 | 38 | 38 | 0 | 0 | 0 | 38 | 0 | 0 | 0 | 0 | sürüm 83: görülmeyen hedef reddi, alanda görülmeyen etkilenmez (`data/gorme-gerekir.json`, `seenTargets.ts`) |
| Ç01 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | sürümsüz: sabit hasar tek sabit, yetenek değiştiricisi yok (SRD Damage Rolls) |
| B03 | 5 | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | sürüm 83: durdurulan büyüde yapım sonrası kancalar yok (`spell_cast.countered`); görünmez büyücüye Counterspell yok |
| B04 | 4 | 4 | 4 | 4 | 0 | 4 | 0 | 0 | 0 | 0 | sürüm 83: `castingTime: reaction` büyüleri `cast_spell` komutunda reddedilir; tetik akışı (`reactions.ts`) aynen |
| B21 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | sürüm 83: `zones.ts` `zoneDriftEnterEvents`: kayınca yeni kaplanan yaratığa giriş tetiği (`once`) |
| B05 | 68 | 68 | 0 | 0 | 0 | 65 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` bloğu; yapım anı tetiğinde siper, tek hasar zarı, eşzamanlı etki |
| B06 | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | sürümsüz: yanlış bulgu: motor zaten DEX save ve yarı hasar veriyor (`saveEffect`); ölçüm hatası (save `map_effect.roll` ile, d20 etiketsiz), motor değişmedi |
| B07 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: boyut kodu L/H/G ile karşılaştırma |
| B08 | 2 | 2 | 2 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `ignoresCover`; DEX save'e siper eklenmez |
| B09 | 6 | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `addCastingMod` |
| B10 | 14 | 14 | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | sürümsüz: arayüz: yapımda el etkisi seçici (`hand-cast-pick`); motor `cast_spell.choice` ile zaten uyguluyordu, arayüz ve ölçüm sormuyordu |
| B22 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 0 | 0 | 0 | sürüm 83: yumrukta büyücünün Charmed yasağı ve Frightened dezavantajı (`arcaneHand.ts`, `range.ts` `charmedAgainst`) |
| B23 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | sürüm 83: metal silah/zırh yoksa save yok (tepki de harcanmaz); silah yoksa ceza metal zırhın AC'sine (`reactions.ts` `corrodeEvents`) |
| B11 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | sürümsüz: yanlış bulgu: motor zaten yarı hasar veriyor; ölçüm hatası (ışın save'i `kind: save` etiketsiz), motor değişmedi |
| B12 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: sıçrama 3 + (slot − 6) |
| B13 | 3 | 3 | 3 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `allyAura`: büyücüde 30 ft yayılım, içindeki dostlar `syncAuras` ile yararlanır |
| B14 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `areaTargets: enemies` |
| B15 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `area83`: büyücü merkezli 30 ft yayılım, düşmanlar (`spellAreaAt`) |
| B16 | 4 | 4 | 4 | 4 | 0 | 2 | 0 | 0 | 0 | 0 | sürüm 83: süren buyruk (`commandPersist`) büyü süresince; Mass Suggestion `m83` Charmed |
| B17 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` 600 tur |
| B18 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` `smiteReveal`: hedefe konsantrasyona bağlı `revealed` |
| B19 | 3 | 3 | 3 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | sürüm 83: `spell_cast.area.parts`, yüzey çözücüsü her türü ayrı işler |
| B20 | 1 | 1 | 4 | 4 | 0 | 5 | 0 | 0 | 0 | 0 | sürüm 83: alan tetiği olaylarında `zoneId`, duvar kesmesi `wallCut`: `incomingOf` hasar türünde element üretir |
| U01 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | sürüm 83: büyü verisinde `m83` Charmed, yalnız DEX save dezavantajı |
| U02 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | sürüm 84: kullanıcı kararı (2026-11-19): girdap alanı hedef yaratığın altıgeninde (su gerekmez), slotla büyür, STR save, yakalanma, çekme; Game Master anahtarı `controlWaterWhirlpool` (`girdap.ts`); taşkın/hendek/akış savaş dışı |
| K01 | 20 | 20 | 20 | 20 | 22 | 26 | 0 | 0 | 0 | 0 | sürüm 83: kullanıcı kararı: `spellHarms` zarar vermeyen büyüyü ayırır, `checkReach` 83'te yasaklamaz |
| K02 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 0 | 0 | 0 | sürüm 83: kullanıcı kararı: `executeAreaCast` yayılım büyüsünde yapım anı save'i yok (`auraQuiet`) |
| K03 | 3 | 3 | 3 | 3 | 3 | 3 | 0 | 0 | 0 | 0 | sürüm 83: kullanıcı kararı: Prone ve otomatik kritik 5 ft gücün yerinden; Arcane Sword `m83` güç modeli (`lingering: weapon`, 30 ft) |
| K04 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 0 | 0 | 0 | sürüm 83: kullanıcı kararı: yakalama etkisinde `startSave.skip` (yakalandığı tur); ilk tekrar sonraki turda |

## Yanlış dağılımı

### Sınıflara göre (büyünün sınıf listesi; bir büyü birden çok sınıfta sayılır)

| Sınıf | Büyü satırı | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Yanlış oranı |
|---|---:|---:|---:|---:|---:|---:|
| Bard | 502 | 0 | 0 | 0 | 0 | 0.0% |
| Cleric | 445 | 0 | 0 | 0 | 0 | 0.0% |
| Druid | 638 | 0 | 0 | 0 | 0 | 0.0% |
| Paladin | 113 | 0 | 0 | 0 | 0 | 0.0% |
| Ranger | 148 | 0 | 0 | 0 | 0 | 0.0% |
| Sorcerer | 998 | 0 | 0 | 0 | 0 | 0.0% |
| Warlock | 369 | 0 | 0 | 0 | 0 | 0.0% |
| Wizard | 1184 | 0 | 0 | 0 | 0 | 0.0% |
| Silah (karakter) | 670 | 0 | 0 | 0 | 0 | 0.0% |
| Canavar saldırısı | 4085 | 0 | 0 | 0 | 0 | 0.0% |

### Bağlam sınıfına göre

| Bağlam sınıfı | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor |
|---|---:|---:|---:|---:|---:|---:|
| alan | 99 | 99 | 0 | 0 | 0 | 0 |
| durum | 1978 | 1978 | 0 | 0 | 0 | 0 |
| hasar türü | 1384 | 1384 | 0 | 0 | 0 | 0 |
| konsantrasyon | 157 | 157 | 0 | 0 | 0 | 0 |
| saldırı zarı | 634 | 634 | 0 | 0 | 0 | 0 |
| save | 239 | 239 | 0 | 0 | 0 | 0 |
| siper | 216 | 216 | 0 | 0 | 0 | 0 |
| tepki | 731 | 731 | 0 | 0 | 0 | 0 |
| yapım | 1027 | 1027 | 0 | 0 | 0 | 0 |
| yukarı slot | 113 | 113 | 0 | 0 | 0 | 0 |
| yüzey | 28 | 28 | 0 | 0 | 0 | 0 |

## Bulgular (kök nedene göre; öncelik sırası: yanlış → çökme → uygulanmıyor → karar bekliyor)

Düzeltilen bulgular (B01, B02, Ç01, B03, B04, B21, B05, B06, B07, B08, B09, B10, B22, B23, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, U01, U02, K01, K02, K03, K04) doğru olmayan satırı kalmadıysa aşağıda listelenmez; önce/sonra sayıları yukarıdaki tabloda.

### Yeni bulgular (düzeltme turlarında bulundu; matris satırı yok; onay bekliyor)

- **G01 — Save günlüğü durumdan gelen avantaj/dezavantajı göstermiyordu (görünüm; sonucu etkilemez) — düzeltildi.** `save_resolved.mode` motorun 41 save yolunun 27'sinde sabit 'normal'; Restrained, Dodge, Haste gibi kaynaklardan gelen kip yalnız atılan iki zarda görünüyordu. Öneri: Düzeltildi (2026-11-19, sürümsüz, yalnız görünüm): `saveMode` koşulları `saveModeWhy`'a taşındı; komut sonunda save olaylarına `modeWhy` (`src/battle/saveWhy.ts`), günlükte açılır ayrıntıda tek satır ("Dezavantaj: Restrained (DEX save)") ve kip rozeti aynı kaynaktan. 64 kurulum değişmedi.

## Büyü matrisi (büyü başına)

Sembol: ✓ doğru, ✗ yanlış, ‼ çökme, ∅ uygulanmıyor, ? karar bekliyor. Bağlamların ayrıntısı CSV'de.

| Büyü | Sv | Mekanik | Satır | ✓ | ✗ | ‼ | ∅ | ? | Bulgu |
|---|---:|---|---:|---:|---:|---:|---:|---:|---|
| Acid Arrow | 2 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Acid Splash | 0 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Aid | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Alarm | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Alter Self | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Animal Friendship | 1 | effect | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Animal Messenger | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animal Shapes | 8 | effect (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animate Dead | 3 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animate Objects | 5 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antilife Shell | 5 | zone+alan(emanation) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antimagic Field | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antipathy/Sympathy | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Eye | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Hand | 5 | summon | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Arcane Lock | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Sword | 7 | attack | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Arcanist's Magic Aura | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Astral Projection | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Augury | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Aura of Life | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Awaken | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Bane | 1 | effect | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Banishment | 4 | effect | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Barkskin | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Beacon of Hope | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Befuddlement | 8 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Bestow Curse | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Black Tentacles | 4 | save+alan(cube) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Blade Barrier | 6 | save+alan(wall) | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Bless | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Blight | 4 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Blindness/Deafness | 2 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Blink | 3 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Blur | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Burning Hands | 1 | save+alan(cone) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Call Lightning | 3 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Calm Emotions | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Chain Lightning | 6 | save | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Charm Monster | 4 | effect | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Charm Person | 1 | effect | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Chill Touch | 0 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Chromatic Orb | 1 | attack | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Circle of Death | 6 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Clairvoyance | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Clone | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Cloudkill | 5 | save+alan(sphere) | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Color Spray | 1 | save+alan(cone) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Command | 1 | effect | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Commune | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Commune with Nature | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Comprehend Languages | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Compulsion | 4 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Cone of Cold | 5 | save+alan(cone) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Confusion | 4 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Conjure Animals | 3 | summon+alan | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Conjure Celestial | 7 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Conjure Elemental | 5 | summon+alan | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Conjure Fey | 6 | attack | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Conjure Minor Elementals | 4 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Conjure Woodland Beings | 4 | save(emanation) | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Contact Other Plane | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Contagion | 5 | save | 12 | 12 | 0 | 0 | 0 | 0 |  |
| Contingency | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Continual Flame | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Control Water | 4 | girdap (alan, sürüm 84) | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Control Weather | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Counterspell | 3 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Create Food and Water | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Create or Destroy Water | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Create Undead | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Creation | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Cure Wounds | 1 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dancing Lights | 0 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Darkness | 2 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Darkvision | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Daylight | 3 | zone+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Death Ward | 4 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Delayed Blast Fireball | 7 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Demiplane | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Evil and Good | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Magic | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Poison and Disease | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Thoughts | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Dimension Door | 4 | teleport | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Disguise Self | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Disintegrate | 6 | save | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Dispel Evil and Good | 5 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dispel Magic | 3 | dispel | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Dissonant Whispers | 1 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Divination | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Divine Favor | 1 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Divine Smite | 1 | smite | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Divine Word | 7 | utility | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dominate Beast | 4 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dominate Monster | 8 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dominate Person | 5 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dragon's Breath | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dream | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Druidcraft | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Earthquake | 8 | save+alan(sphere) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Eldritch Blast | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Elementalism | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enhance Ability | 2 | effect (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enlarge/Reduce | 2 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Ensnaring Strike | 1 | smite | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Entangle | 1 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Enthrall | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Etherealness | 7 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Expeditious Retreat | 1 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Eyebite | 6 | save | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Fabricate | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Faerie Fire | 1 | save+alan(cube) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Faithful Hound | 4 | save+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| False Life | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Fear | 3 | save+alan(cone) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Feather Fall | 1 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Find Familiar | 1 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Find Steed | 2 | summon | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Find the Path | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Find Traps | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Finger of Death | 7 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Fire Bolt | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Fire Shield | 4 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Fire Storm | 7 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Fireball | 3 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Flame Blade | 2 | attack | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Flame Strike | 5 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Flaming Sphere | 2 | summon+alan | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Flesh to Stone | 6 | save | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Floating Disk | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Fly | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Fog Cloud | 1 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Forbiddance | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Forcecage | 7 | zone+alan | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Foresight | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Freedom of Movement | 4 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Freezing Sphere | 6 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Gaseous Form | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Gate | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Geas | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Gentle Repose | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Giant Insect | 4 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Glibness | 8 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Globe of Invulnerability | 6 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Glyph of Warding | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Goodberry | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Grease | 1 | zone+alan(cube) | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Greater Invisibility | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Greater Restoration | 5 | cure | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Guardian of Faith | 4 | save+alan(sphere) | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Guards and Wards | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Guidance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Guiding Bolt | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Gust of Wind | 2 | save+alan(line) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hallow | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Hallucinatory Terrain | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Harm | 6 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Haste | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heal | 6 | heal | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Healing Word | 1 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heat Metal | 2 | auto | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Hellish Rebuke | 1 | save | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Heroes’ Feast | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Heroism | 1 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Hex | 1 | mark | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hideous Laughter | 1 | effect | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hold Monster | 5 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Hold Person | 2 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Holy Aura | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Hunter's Mark | 1 | mark | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hypnotic Pattern | 3 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Ice Knife | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Ice Storm | 4 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Identify | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Illusory Script | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Imprisonment | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Incendiary Cloud | 8 | save+alan(sphere) | 22 | 22 | 0 | 0 | 0 | 0 |  |
| Inflict Wounds | 1 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Insect Plague | 5 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Instant Summons | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Invisibility | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Irresistible Dance | 6 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Jump | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Knock | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Legend Lore | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Lesser Restoration | 2 | cure | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Levitate | 2 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Light | 0 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Lightning Bolt | 3 | save+alan(line) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Locate Animals or Plants | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Creature | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Object | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Longstrider | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Mage Armor | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mage Hand | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Circle | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Jar | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Missile | 1 | auto | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Magic Mouth | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Weapon | 2 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Magnificent Mansion | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Major Image | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mass Cure Wounds | 5 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Heal | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mass Healing Word | 3 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Suggestion | 6 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Maze | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Meld into Stone | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mending | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Message | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Meteor Swarm | 9 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Mind Blank | 8 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mind Spike | 2 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Minor Illusion | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mirage Arcane | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mirror Image | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mislead | 5 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Misty Step | 2 | teleport | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Modify Memory | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Moonbeam | 2 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Move Earth | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Nondetection | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Pass without Trace | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Passwall | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Phantasmal Force | 2 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Phantasmal Killer | 4 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Phantom Steed | 3 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Ally | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Binding | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plane Shift | 7 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plant Growth | 3 | zone+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Poison Spray | 0 | attack | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Polymorph | 4 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Power Word Heal | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Power Word Kill | 9 | utility | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Power Word Stun | 8 | utility | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Prayer of Healing | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prestidigitation | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prismatic Spray | 7 | utility | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Prismatic Wall | 9 | zone+alan(wall) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Private Sanctum | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Produce Flame | 0 | attack | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Programmed Illusion | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Project Image | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Protection from Energy | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Protection from Evil and Good | 1 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Protection from Poison | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Purify Food and Drink | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Raise Dead | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Ray of Enfeeblement | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Ray of Frost | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Ray of Sickness | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Regenerate | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Reincarnate | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Remove Curse | 3 | dispel | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Resilient Sphere | 4 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Resistance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Resurrection | 7 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Reverse Gravity | 7 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Revivify | 3 | revive | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Rope Trick | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sacred Flame | 0 | save | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Sanctuary | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Scorching Ray | 2 | attack | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Scrying | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Searing Smite | 1 | smite | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Secret Chest | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| See Invisibility | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Seeming | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sending | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sequester | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Shapechange | 9 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Shatter | 2 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Shield | 1 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Shield of Faith | 1 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Shillelagh | 0 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Shining Smite | 2 | smite | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Shocking Grasp | 0 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Silence | 2 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Silent Image | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Simulacrum | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sleep | 1 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Sleet Storm | 3 | zone+alan(sphere) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Slow | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Sorcerous Burst | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Spare the Dying | 0 | revive | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Speak with Animals | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Speak with Dead | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Speak with Plants | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Spider Climb | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Spike Growth | 2 | auto+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Spirit Guardians | 3 | save(emanation) | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Spiritual Weapon | 2 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Starry Wisp | 0 | attack | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Stinking Cloud | 3 | save+alan(sphere) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Stone Shape | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Stoneskin | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Storm of Vengeance | 9 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Suggestion | 2 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Summon Dragon | 5 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Sunbeam | 6 | save+alan(line) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Sunburst | 8 | save+alan(sphere) | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Symbol | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Telekinesis | 5 | save+alan(cube) | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Telepathic Bond | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Teleport | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Teleportation Circle | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Thaumaturgy | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Thunderwave | 1 | save+alan(cube) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Time Stop | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Tiny Hut | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Tongues | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Transport via Plants | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Tree Stride | 5 | teleport | 3 | 3 | 0 | 0 | 0 | 0 |  |
| True Polymorph | 9 | effect | 6 | 6 | 0 | 0 | 0 | 0 |  |
| True Resurrection | 9 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| True Seeing | 6 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| True Strike | 0 | attack | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Tsunami | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Unseen Servant | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Vampiric Touch | 3 | attack | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Vicious Mockery | 0 | save | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Vitriolic Sphere | 4 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Wall of Fire | 4 | save+alan(wall) | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Wall of Force | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Ice | 6 | save+alan(wall) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Wall of Stone | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Thorns | 6 | save+alan(wall) | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Warding Bond | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Water Breathing | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Water Walk | 3 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Web | 2 | save+alan(cube) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Weird | 9 | save+alan(sphere) | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Wind Walk | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Wind Wall | 3 | zone+alan(wall) | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Wish | 9 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Word of Recall | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Zone of Truth | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |

## Silah matrisi

| Silah seçeneği | Özellik | Satır | ✓ | ✗ | ‼ | Bulgu |
|---|---|---:|---:|---:|---:|---|
| Club | yakın | 13 | 13 | 0 | 0 |  |
| Dagger | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Dagger (fırlatma) | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Greatclub | yakın | 13 | 13 | 0 | 0 |  |
| Handaxe | yakın | 13 | 13 | 0 | 0 |  |
| Handaxe (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Javelin | yakın | 13 | 13 | 0 | 0 |  |
| Javelin (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Light Hammer | yakın | 13 | 13 | 0 | 0 |  |
| Light Hammer (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Mace | yakın | 13 | 13 | 0 | 0 |  |
| Quarterstaff | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Sickle | yakın | 13 | 13 | 0 | 0 |  |
| Spear | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Spear (fırlatma) | menzilli, Versatile | 17 | 17 | 0 | 0 |  |
| Dart | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Dart (fırlatma) | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Light Crossbow | menzilli | 17 | 17 | 0 | 0 |  |
| Shortbow | menzilli | 17 | 17 | 0 | 0 |  |
| Sling | menzilli | 17 | 17 | 0 | 0 |  |
| Battleaxe | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Flail | yakın | 13 | 13 | 0 | 0 |  |
| Glaive | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Greataxe | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Greatsword | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Halberd | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Lance | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Longsword | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Maul | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Morningstar | yakın | 13 | 13 | 0 | 0 |  |
| Pike | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Rapier | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Scimitar | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Shortsword | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Trident | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Trident (fırlatma) | menzilli, Versatile | 17 | 17 | 0 | 0 |  |
| Warhammer | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| War Pick | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Whip | yakın, Finesse, Reach | 14 | 14 | 0 | 0 |  |
| Blowgun | menzilli | 17 | 17 | 0 | 0 |  |
| Hand Crossbow | menzilli | 17 | 17 | 0 | 0 |  |
| Heavy Crossbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Longbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Musket | menzilli | 17 | 17 | 0 | 0 |  |
| Pistol | menzilli | 17 | 17 | 0 | 0 |  |
| Unarmed Strike | yakın | 3 | 3 | 0 | 0 |  |

## Canavar saldırıları

579 saldırının 579 tanesinin bütün bağlamları doğru. Sorunlu olanlar:

| Saldırı | Mekanik | Satır | ✗ | Bulgu |
|---|---|---:|---:|---|

## Yöntem

- **Sahne:** düz 31×45 altıgen zemin (kale-onu haritası, "Düz zemin" ortamı: ortam kuralı yok; zemin, nesne ve alanlar temiz), güncel kural sürümü, varsayılan Game Master anahtarları ve ev kuralları. Ev kuralı `carpmaHasari` (varsayılan açık, SRD'de yok) itmeli alan bağlamlarına karışmasın diye ikinci düşman itme ekseninin dışında.
- **Büyücü:** 20. seviye, büyü DC 18, büyü saldırısı +10, büyü değiştiricisi +4, her seviyeden 4 slot, sınıf özelliği yok. **Hedef:** AC 15, 300 HP, save değiştiricileri 0, türü SRD metnine göre (Beast, Humanoid…). **Canavar saldırısının hedefi:** AC 15, 999 HP, save +5.
- **Zar (kancalı Rng):** motorun zar istekleri amaçla yanıtlanır. Büyü saldırısı d20 tek zarda 8, çift zarda 2/16 (silah ve canavarda 19 ve 5/19); kip, motorun tuttuğu doğal zardan doğrulanır. Kritik 20, ıska 1. Save d20: başarısız 1, başarılı 20; dezavantaj sondası 19/3; yarım siper sondası 16 (yalnız +2 ile geçer), ¾ siper sondası 14 (yalnız +5 ile geçer). Hasar zarları yüze bağlı sabit (⌊yüz/2⌋ + 1: d4 3, d6 4, d8 5, d10 6, d12 7): toplam yalnız zar sayısına bağlı; zar ifadesi kanonik biçimde (yüz başına toplam zar + sabit) karşılaştırılır. Tepki ve seçim istemleri kancayla (Shield, Counterspell, Hellish Rebuke kullanılır; diğer tepkiler kullanılmaz).
- **Kahin (beklenen):** SRD 5.2.1 kaydından (data/srd/spells.json, data/srd/weapons.json) otomatik ayrıştırma — saldırı/save türü, hasar zarı ve türü, yarı hasar, durumlar, süre, konsantrasyon, yukarı slot, kantrip kademesi, alan, hedef türü, "görebildiğin yaratık", "creatures of your choice", "Advantage if you or your allies are fighting it" — ve SRD metninden elle okunan özel tablo (`src/sim/matris/ozel.ts`: yapım anı ya da tetik davranışı, seçimli büyüler, Ice Knife patlaması, Acid Arrow ıskası…). Motor kodu kahinde kullanılmaz; motorun büyü verisi yalnız komutun biçimini (alan nişanı, seçim) belirlemek için okunur.
- **D&D kuralları (kahinde):** direnç ⌊/2⌋, zayıflık ×2, bağışıklık 0; başarılı save'de yarı hasar (kantripte 0), ardından direnç; kritikte zarlar iki kat, sabitler bir kez; avantaj ve dezavantaj birbirini götürür; siper +2/+5 AC ve DEX save'e; Prone hedefe 5 ft içinden avantaj, uzaktan dezavantaj; Restrained hedefe avantaj ve DEX save'inde dezavantaj; Invisible hedefe dezavantaj, "görmen gereken" etki yapılamaz; Frightened saldırana dezavantaj; Charmed büyüleyene saldıramaz; menzilli saldırıda yanında düşman ve uzun menzil dezavantaj; Heavy silahta STR/DEX < 13 dezavantaj; konsantrasyon DC'si max(10, ⌊hasar/2⌋), en çok 30; yeni konsantrasyon eskisini bitirir; Counterspell başarısızlığında büyü boşa gider ve slot harcanmaz; Shield +5 AC (tetikleyen saldırıya da) ve Magic Missile'i keser; Blindsight/Truesight menzilindeki görünmez hedefe dezavantaj yok; gün ışığında Sunlight Sensitivity/Weakness/Hypersensitivity ve Light Sensitivity dezavantajı.
- **Yüzey/zemin:** beklenen, oyunun kendi tablosu (data/yuzey-etkilesimleri.json element satırları: ateş→yağ `fireOil`, soğuk→su `coldWater`, yıldırım→su `lightningWater`, kuvvet/gök gürültüsü→su `forceWater`).
- **Canavar saldırıları:** beklenen data/monsters.json'dan (saldırı bonusu, zar, tür; SRD metnindeki sabit hasar, "Advantage ile" alternatif zar) ve yukarıdaki kurallardan. Ek etkiler (rider) bu matriste ölçülmez.
- **Sonuç sınıfları:** *doğru* = karşılaştırılan bütün alanlar eşit; *yanlış* = motor sonuç üretiyor ama değer SRD'den farklı ya da SRD'nin yasakladığını kabul ediyor; *çökme* = komut istisna fırlatıyor; *uygulanmıyor* = SRD etkisi motorda yok (savaş dışı işaretli ya da beklenen durum/etki hiç üretilmiyor); *karar bekliyor* = SRD metni iki türlü okunabiliyor (bulgu kaydında gerekçe).

## Kahin ve ölçüm düzeltmeleri

Kahin motoru haklı çıkarmak için değiştirilmez; her değişiklik SRD alıntısıyla ya da ölçümün kendisiyle gerekçelendirilir.

- **Sabit hasarlı silah (Blowgun):** SRD 5.2.1 Damage Rolls: "Unless a rule says otherwise, you don't add your ability modifier to a fixed damage amount that doesn't use a roll, such as the damage of a Blowgun." İlk ölçümde kahin 1 + DEX bekliyordu (motor çöktüğü için karşılaştırılmamıştı); şimdi 1, zar yok, kritikte de 1.
- **Save kipinin ölçümü:** `save_resolved.mode` alanı motorun 41 save yolunun 27'sinde sabit 'normal', kalanında yalnız ortam kipi (Restrained, Dodge, Haste gibi durum/etki kaynaklı avantaj-dezavantaj yazılmaz). Kip artık atılan zardan okunur: kancaya gelen d20 save isteğinin `mode` alanı (olaydaki zarlarla eşleşen istek). Beklenen değişmedi (SRD Restrained: "You have Disadvantage on Dexterity saving throws."). Bu değişiklik ilk ölçümdeki hiçbir satırın sonucunu değiştirmedi (sürüm 82 ölçümü: yalnız Ç01 farkı).
- **Etkilenen sayımı iyileşmeyi de içerir:** Conjure Celestial: "For each creature you can see in the Cylinder, choose which of these lights shines on it: Healing Light … Searing Light." Dost iyileştiyse etkilenmiştir (eskiden yalnız save ve saldırı sayılıyordu).
- **Haritayı kaplayan küre (Storm of Vengeance):** "spreading to a radius of 300 feet. Each creature under the cloud when it appears must succeed on a Constitution saving throw". Kürenin yarıçapı içindeki büyücü ve dost da etkilenenlere girer (yalnız küre biçimli, herkesi etkileyen alanlarda; duvarlar hariç).
- **B11 yanlış bulguydu (Prismatic Spray):** SRD Prismatic Rays: "Successful Save: Half as much damage." Motor zaten yarı hasar veriyor (`saveEffect` → `hurt(..., half = başarı)`); ışın save'i `kind: 'save'` etiketsiz atıldığı için kanca save planı veremiyor, d20 = 10 ile hep başarısız ölçülüyordu (G02). Motor değişmedi; ölçüm aşağıdaki `saveEtiketsiz` yoluyla.
- **Haritayı kaplayan küre kuralının sınırı:** yalnız yarıçapı haritanın boyunu (45 altıgen) aşan kürede (Storm of Vengeance) uygulanır; serbest şekilli Fire Storm'da (veride 25 ft küre, seçilen altıgenler) uygulanmaz. Grup 1 ölçümü bu sınırla ve B11 ölçümüyle yeniden yapıldı (yanlış 57 → 55; iki satır kahin kaynaklıydı).
- **Harita/özel save yolu ölçülüyor (B06 da yanlış bulguydu):** `saveEffect` save'i `save_resolved` yerine `map_effect.roll` ile yazar ve d20'yi `kind: 'save'` etiketsiz atar (G02). Matris artık `map_effect.roll` save'lerini save sayar; bu yoldan save atan büyülerde (Wall of Ice kesmesi, Prismatic Spray ışınları) kanca etiketsiz d20'yi save planıyla yanıtlar (`ozel.ts` `saveEtiketsiz`). SRD Wall of Ice: "the creature is pushed to one side of the wall … and makes a Dexterity saving throw, taking 10d6 Cold damage on a failed save or half as much damage on a successful one." Motor bunu zaten yapıyordu; motor değişmedi. Aynı ölçüm düzeltmesi Rust Monster Antennae'nin metal taşımayan hedefe de save attırdığını görünür kıldı (B23; ilk ölçümde save görünmediği için doğru sayılıyordu).
- **Arcane Hand yapımda etki seçer (B10):** SRD 5.2.1: "When you cast the spell and as a Bonus Action on your later turns, you can move the hand up to 60 feet and then cause one of the following effects". Motor yapım komutundaki `choice` ile etkiyi zaten uyguluyordu; ne arayüz ne ölçüm `choice` gönderiyordu. Ölçüm artık yapımda Clenched Fist seçer ve eli hedefin yanına koyar (`ozel.ts` `elYeri`); beklenen değişmedi.
- **Kendinden yayılım (Holy Aura, B13):** SRD 5.2.1: "Range: Self … you emit an aura in a 30-foot Emanation. While in the aura, creatures of your choice have Advantage on all saving throws". Komut artık hedefsiz (büyücü) gönderilir; dostun yararı yayılım kapsamından ölçülür (eski ölçüm dostu hedefliyordu, motorun eski hedef modeline göreydi). Kahin düzeltmesi: "when a Fiend or an Undead hits an affected creature with a melee attack roll, the attacker must succeed on a Constitution saving throw or have the Blinded condition" — Blinded saldırana konur; aurdaki dostta Blinded beklenmez (ilk ölçümde beklenmiyordu çünkü satır reddediliyordu).
- **Sınıflandırma (3. grup):** Suggestion ve Mass Suggestion'ın "büyücü Charmed (hedef büyüleyen)" satırları önceki aşamalarda B16'ya sayılıyordu; zarar vermeyen büyünün büyüleyene yapılıp yapılamayacağı K01 kararı olduğu için K01'e bağlandı (K01 20 → 22; satır sonucu değişmedi, "karar bekliyor").
- **K01 kararı (kahin):** SRD 5.2.1 Charmed: "You can't attack the charmer or target the charmer with damaging abilities or magical effects." Kullanıcı kararı: yalnız saldırı ve zarar veren yetenek/büyü yasak; zarar vermeyen büyüler serbest. Kahin: saldırı zarlı büyü her zaman red; diğerleri SRD metninde hasar ifadesi varsa red, yoksa kabul (`srd.ts` `zararVerir`). Eskiden etki büyülerinin bu satırları "karar bekliyor", save büyülerininki (Hold Person, Blindness/Deafness, Command, Eyebite, Flesh to Stone, Hold Monster) koşulsuz "red" bekliyordu; ikisi de karara çekildi.
- **K02 kararı (kahin):** Spirit Guardians "whenever the Emanation enters a creature's space and whenever a creature enters the Emanation or ends its turn there"; Conjure Woodland Beings aynı kalıp; yapım cümlesi yok. Kullanıcı kararı: save zamanı metne göre. Kahin yapımda hedefe etki beklemez (`ozel.ts` `yapim: { tur: 'yok' }`; eskiden "karar bekliyor").
- **Karşılaştırma satırı (sürüm 82, son kahinle):** aynı son kahin ve ölçümle eski kurallar (`--kural-surumu 82`): önce/sonra farkının yalnız motor düzeltmelerinden geldiğini gösterir (82: yanlış 245, 83: 3). İlk ölçümden (235) farkı kahin/ölçüm düzeltmeleri ve K01–K04 kararları: karar bekleyen 29 satır karara göre doğru/yanlış sayılır; B22/B23 yeni bulgu satırları.
- **Görünüm notu G01 (sonucu etkilemez; 2026-11-19 düzeltildi):** günlük save satırı kipi eskiden `mode` alanından "normal" yazıyordu; artık save olaylarındaki `modeWhy` ile kip rozeti ve neden satırı ("Dezavantaj: Restrained (DEX save)") gösteriliyor. Matris kipi yine atılan zardan ölçer.

## Kapsam ve sınırlar

- 339 büyünün hepsi matriste; savaş dışı işaretli (ya da SRD'de 1 dakika ve üstü yapım süreli) büyüler tek satır: SRD etkisi savaşta anlamlıysa *uygulanmıyor*, değilse *doğru*.
- Silah: SRD Weapons tablosunun 38 silahı + fırlatma biçimleri + Unarmed Strike, 5. seviye Fighter (STR 16, DEX 14), ustalık seçilmemiş (Graze, Topple… karışmasın diye).
- Ölçülmeyenler: canavar saldırı ek etkileri (A2 envanteri ayrı), Multiattack, sınıf özellikleri (Sneak Attack, Rage…), sihirli eşyalar, çok altıgen gövde, irtifa/dikey, büyülerin sonraki turlardaki tekrarı (`spell_followup`), süren etkilerin sonraki zarlardaki sayısal katkısı (Bless +1d4 gibi: yalnız etkinin varlığı, süresi, konsantrasyon bağı ölçüldü), alan geometrisinin kenar altıgenleri (yalnız açıkça içeride/dışarıda konumlar).
- Telekinesis'in STR save'i yapılandırılmış olay (`save_resolved`) yerine günlük notuyla kaydediliyor; yalnız durum sonucu karşılaştırıldı.
- "Doğru" bir senaryonun doğru olduğunu söyler; bütün zar kombinasyonlarını değil.
- Yeniden üretmek için: `npx vite-node src/sim/mekanikMatris.ts -- --yaz`; tek büyü/saldırı ayrıntısı: `npx vite-node src/sim/mekanikMatris.ts -- --buyu "Fireball" --hepsi`; eski sürümle ölçüm: `-- --kural-surumu 82`; önce/sonra tablosuna aşama ekleme: `-- --etiket "Grup 1 sonrası"`.
