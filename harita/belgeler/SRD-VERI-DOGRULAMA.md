# SRD veri doğrulama turu (salt okunur)

Tarih: 2026-11-19 · Dal: `birlesik` · Kaynak: `docs/SRD_CC_v5.2.1.pdf` (364 sayfa) · Satır satır sonuç: [`srd-veri-dogrulama.csv`](srd-veri-dogrulama.csv)

Bu turda yalnızca ölçüm yapıldı ve rapor yazıldı. Mekaniğe, veriye ve teste dokunulmadı. Düzeltmeler onaydan sonra yapılacak.

> **Güncelleme: D1 düzeltmeleri yapıldı (2026-11-19, kural sürümü 86).** Ayrıntı [§8](#8-d1-düzeltmeleri-kural-sürümü-86). CSV'ye her satırın D1 sonucunu gösteren `D1 (kural sürümü 86)` sütunu eklendi. Aşağıdaki §1–§7 denetim anını anlatır.
>
> **Güncelleme: D2 yapıldı (2026-11-19, kural sürümü 88).** Çağrı blokları ve savaş sırasında eklenen canavarlar: [§9](#9-d2-çağrı-blokları-ve-savaş-sırasında-eklenen-canavarlar-kural-sürümü-88). Denetim hatası düzeltmesi: Otherworldly Steed'in Life Bond'u ve bonus eylemleri motorda zaten vardı (§2.7 satırı yanlıştı).

## Özet

| Dosya | doğru | yanlış | yanlış (bilinen, düzeltiliyor) | PDF'te yok | oyunda alan yok |
|---|---:|---:|---:|---:|---:|
| `data/monsters.json` | 7078 | 30 | 0 | 0 | 1 |
| `data/canavar-turleri.json` | 307 | 19 | 4 | 0 | 0 |
| `data/yuzme-hizi.json` | 56 | 2 | 5 | 0 | 0 |
| `data/derin-su.json` | 63 | 0 | 0 | 0 | 0 |
| `data/canavar-yetenekleri.json` | 222 | 11 | 0 | 4 | 0 |
| `data/multiattack.json` | 95 | 1 | 0 | 0 | 0 |
| `data/summons.json` | 18 | 6 | 0 | 2 | 0 |
| `data/monster-ortamlari.json` | 330 | 0 | 0 | 330 | 0 |
| `data/efsanevi.json` | 30 | 0 | 0 | 0 | 0 |
| `data/binek.json` | 1 | 0 | 0 | 0 | 0 |
| `data/ele-gecirme.json` | 1 | 0 | 0 | 0 | 0 |
| `data/token-sizes.json` | 0 | 0 | 0 | 1 | 0 |
| **Toplam** | **8201** | **69** | **9** | **337** | **1** |

Sayım birimi kayıt × alandır. `monsters.json` için canavar başına 22 alan sayıldı: boyut, AC, HP, beş hız, hover, dört duyu, yetenek puanları, kurtarmalar, beceriler, CR, direnç, hasar bağışıklığı, zayıflık, durum bağışıklığı ve Multiattack metni. `monster-ortamlari.json`'da her kaydın CR'si doğrulandı (330 doğru); tema ve ortam ise PDF'te yok (330).

**Bilinenler (yeni bulgu sayılmadı, "bilinen, düzeltiliyor" diye işaretli):**
- Giant Eagle, Giant Owl, Giant Elk (Celestial) ve Death Dog (Monstrosity) türleri.
- `yuzme-hizi.json`'daki Reef Shark, Giant Venomous Snake, Archelon, Giant Shark ve Polar Bear hızları.
- Yüzme hızının `shapeStats`'a aktarılmaması.

**Yeni bulguların en önemlileri:**
1. **Yaratık türü:** 19 kayıt daha yanlış. Specter, Wight ve Wraith Undead sayılmıyor; Barbed Devil, Bone Devil ve Night Hag Fiend sayılmıyor; Efreeti Fiend sanılıyor; goblinoidler Humanoid sanılıyor (SRD'de Fey); Hill Giant Fey sanılıyor. 12 yanlış kayıt dosyada "PDF'ten okundu" diye işaretli, yani `temadan` listesi dışındaki kayıtlar da güvenilir değil.
2. **Durum bağışıklığı:** 23 canavarda SRD'deki durum bağışıklığı veride yok. Hepsi, SRD `Immunities` satırında `;` olmayan (yalnız durum içeren) bloklar; 6 sürü de bunlara dahil.
3. **Yetenek puanı:** Giant Centipede'in STR/INT değerleri 10/10 (SRD 5/1), Adult White Dragon'ın CON'u 10 (SRD 22), Young White Dragon'ın INT'i 10 (SRD 6). Bandit Captain'da WIS kurtarma yetkinliği eksik.
4. **Canavar yetenekleri:** Elephant Trample (DC 12 → 16, 2d10+4 → 2d10+6), Remorhaz Swallow (DC 17 → 19, ateş 5d6 → 3d6), Purple Worm Swallow (DEX → STR), Giant Frog ve Giant Toad Swallow (SRD'de kurtarma yok), Ice Mephit Death Burst (2d6 → 2d4), Cat atlaması.
5. **Yüzme hızı:** Dragon Turtle (40 → 50) ve Gibbering Mouther (10 → 20). Not: `monsters.json`'daki "Hız: Swim N ft" notları 330 kayıtta da doğru. Hatalar yalnız bellekten yazılan `yuzme-hizi.json`'da.
6. **Aktarım:** Savaş kurulduktan sonra çağrılan yaratıklara (Find Familiar, Animate Dead, Phantom Steed, Find Steed, Summon Dragon…) canavar özellikleri (durum bağışıklığı, tırmanma, Magic Resistance, Flyby, Spider Climb…) ve canavar yetenekleri işlenmiyor. Ayrıntı §6'da.

## Yöntem

- PDF `pdfplumber` ile her sayfa ortadan iki sütuna kırpılarak sütun sütun okundu. Böylece iki sütunlu düzenin karışması önlendi.
- 336 stat bloğu ayrıştırıldı: 330 canavar, ayrıca Animated Object, Otherworldly Steed, Giant Insect, Draconic Spirit ve iki eşya bloğu. Oyundaki 330 canavarın hepsi PDF'te adıyla bulundu.
- Hiçbir değer bellekten yazılmadı. Ayrıştırıcının "yanlış" ya da "kontrol" dediği her satır PDF metninde ayrıca okundu; sayfa numarası CSV'nin `SRD sayfası` sütununda.
- Ayrıştırıcının sınırları elle çözüldü:
  - Likantropların biçime bağlı hızı ("40 ft. (bear form only)") not olarak yazıldı.
  - Swarm of Insects'in "Climb or Fly 20 ft. (GM's choice)" hızında oyunun uçmayı seçmesi doğru sayıldı.
  - Spy'ın "Sleight of Hand" becerisi ilk geçişte yanlış okunmuştu; düzeltildi.
  - Archmage'in "Charmed (with Mind Blank)" bağışıklığı koşullu olduğu için motorun bunu uygulamaması doğru sayıldı.
- **PDF yazım hatası:** Young White Dragon'ın INT kurtarması "2" diye işaretsiz basılmış (değiştirici −2). Oyundaki INT 10 büyük olasılıkla bu satırın yanlış okunmasından geliyor.
- Saldırı bonusu ve hasar zarları bu turun kapsamında değil. Onlar MEKANIK-MATRIS saldırı denetiminde (`src/sim/matris/saldiri.ts`).

## 1. Kalıp taraması (`data/`, `src/`)

| Kalıp | Eşleşen dosya | Veri kökenli (kapsamda) | Kapsam dışı |
|---|---:|---|---|
| bellekten | 3 | `data/yuzme-hizi.json` `_not`: "BELLEKTEN yazıldı (⚠ doğrulanmalı)", 63 kayıt | `src/ui/audio/engine.ts` (ses belleği), `src/ui/Avatar.tsx` (önbellek) |
| temadan | 3 | `data/canavar-turleri.json` `_aciklama` + `temadan` dizisi, 67 kayıt | `src/ui/dice3d/Dice3D.tsx`, `src/ui/diceTheme.ts` (zar teması) |
| doğrulanmalı | 1 | `data/yuzme-hizi.json` | — |
| okunamadı | 3 | `data/canavar-turleri.json` | arayüz hata metinleri (`strings.tr2.ts`, `journeySave.ts`) |
| tahmin | 17 | yok (SRD verisi değil) | `data/cr-tahmini.json` (özel canavar CR formülü), harita etiket konumu, YZ hasar tahmini, kod yorumları |
| yaklaşık | 39 | yok (SRD verisi değil) | kural yaklaşıkları: `condition-effects.json` `approx` (14), `spells.json` (63), `spells-69.json` (5), `items.json` `weightApprox` (15, ağırlık), `canavar-ekleri-a2.json`; kod yorumları |
| TODO | 0 | — | — |

Kural yaklaşıkları (`approx`), SRD'den okunmuş ama savaş modelinde basitleştirilmiş kurallardır; değerleri bellekten ya da temadan değildir. Bu tur onları sınamadı.

## 2. Yanlış bulunanlar

### 2.1 Yaratık türü (`data/canavar-turleri.json`)

`temadan` listesindeki 67 kaydın 11'i yanlış (4'ü bilinen). PDF'ten okunduğu yazan 263 kaydın 12'si yanlış (1'i bilinen); bu 12 kayıt büyük olasılıkla komşu stat bloğunun tür satırı okunarak kaymış.

| Kayıt | Oyun | SRD | s. | Kaynak notu | Savaştaki etki |
|---|---|---|---:|---|---|
| specter | celestial | **undead** | 327 | PDF | Turn Undead etkilemiyor, Divine Smite +1d8 eksik |
| wight | dragon | **undead** | 341 | PDF | Turn Undead, Divine Smite, PfEG/Magic Circle/Hallow |
| wraith | monstrosity | **undead** | 342 | PDF | Turn Undead, Divine Smite, PfEG/Magic Circle/Hallow |
| barbed-devil | monstrosity | **fiend** | 262 | PDF | Divine Smite +1d8 eksik, koruma büyüleri korumuyor |
| bone-devil | dragon | **fiend** | 267 | PDF | Divine Smite +1d8 eksik, koruma büyüleri korumuyor |
| night-hag | fey | **fiend** | 311 | temadan | Divine Smite +1d8 eksik |
| efreeti | fiend | **elemental** | 283 | PDF | Divine Smite +1d8 yanlışlıkla ekleniyor |
| goblin-warrior | humanoid | **fey** | 290 | temadan | PfEG korumuyor; Charm Person, Dominate Person ve Ghost Possession yanlışlıkla etkiliyor |
| goblin-minion | humanoid | **fey** | 290 | temadan | aynı |
| hobgoblin-captain | humanoid | **fey** | 299 | temadan | aynı |
| hill-giant | fey | **giant** | 298 | PDF | PfEG, Magic Circle ve Hallow yanlışlıkla koruyor |
| pegasus | monstrosity | **celestial** | 313 | temadan | PfEG, Magic Circle ve Hallow korumuyor |
| guardian-naga | monstrosity | **celestial** | 296 | temadan | aynı |
| invisible-stalker | monstrosity | **elemental** | 301 | temadan | aynı |
| chuul | monstrosity | **aberration** | 273 | temadan | PfEG, Dispel Evil and Good ve Hallow korumuyor |
| otyugh | monstrosity | **aberration** | 313 | PDF | aynı |
| copper-dragon-wyrmling | monstrosity | **dragon** | 275 | PDF | düşük (Dragon türüne bakan kural yok denecek kadar az) |
| ancient-red-dragon | monstrosity | **dragon** | 319 | PDF | düşük |
| gray-ooze | dragon | **ooze** | 293 | PDF | düşük |
| giant-eagle | beast | celestial | 350 | PDF | *bilinen* |
| giant-owl | beast | celestial | 352 | temadan | *bilinen* |
| giant-elk | beast | celestial | 351 | temadan | *bilinen* |
| death-dog | beast | monstrosity | 279 | temadan | *bilinen* |

Hobgoblin Warrior, Bugbear Warrior/Stalker ve diğer goblinoidler veride zaten `fey`; doğru.

### 2.2 Yüzme hızı (`data/yuzme-hizi.json`, bellekten)

| Kayıt | Oyun (ft) | SRD (ft) | s. | Durum |
|---|---:|---:|---:|---|
| dragon-turtle | 40 | **50** | 281 | yeni |
| gibbering-mouther | 10 | **20** | 288 | yeni (oyunda suda yürüme hızıyla aynı, yüzme hızı etkisiz kalıyor) |
| archelon | 40 | 80 | 344 | bilinen |
| giant-shark | 50 | 60 | 353 | bilinen |
| giant-venomous-snake | 30 | 40 | 354 | bilinen |
| polar-bear | 30 | 40 | 359 | bilinen |
| reef-shark | 40 | 30 | 360 | bilinen |

Kalan 56 değer doğru ve SRD'de yüzme hızı olan her canavar listede var (eksik yok). `derin-su.json` `swimmers` ∪ `swimmers66` (63 kayıt) SRD'deki yüzücü kümesiyle birebir aynı.

### 2.3 Yetenek puanı ve kurtarma (`data/monsters.json`)

| Kayıt | Alan | Oyun | SRD | s. |
|---|---|---|---|---:|
| giant-centipede | STR / INT | 10 / 10 (kurtarma +0 / +0) | **5 / 1** (−3 / −5) | 349–350 (blok sayfa sonunda bölünmüş; varsayılan 10 kalmış) |
| adult-white-dragon | CON | 10 (kurtarma +0) | **22** (+6) | 340 |
| young-white-dragon | INT | 10 (kurtarma +0) | **6** (−2; PDF'te "2" işaretsiz basılmış) | 340 |
| bandit-captain | WIS kurtarma | +0 | **+2** (yetkin) | 261 |

HP değerleri bu kayıtlarda doğru. Hatalar yalnız değiştiricileri bozuyor: kurtarmalar, yetenek kontrolleri ve `strScore` (atlama, itme). Wild Shape ya da Polymorph'la Giant Centipede biçimine giren yaratık da STR +0 alıyor.

### 2.4 Durum bağışıklığı eksik (`data/monsters.json` `unsupported` "Durum bağışıklığı:" notu)

Motor bu notu `src/battle/monsterTraits.ts`'ten okuyor (`srdK19` açıkken). Aşağıdaki 23 canavarda not hiç yok, dolayısıyla bu durumlar onlara uygulanabiliyor. Ortak neden: SRD `Immunities` satırı yalnız durum içeriyor ya da hasar ile durum `;` ile ayrılmamış; üretici bunları atlamış.

| Kayıt | SRD durum bağışıklığı | s. |
|---|---|---:|
| swarm-of-bats, swarm-of-insects | Charmed, Frightened, Grappled, Paralyzed, Petrified, Prone, Restrained, Stunned | 361 |
| swarm-of-piranhas, swarm-of-rats, swarm-of-ravens, swarm-of-venomous-snakes | aynı | 362 |
| death-dog, ettin, hydra | Blinded, Charmed, Deafened, Frightened, Stunned, Unconscious | 279, 284, 300 |
| gray-ooze | Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Prone, Restrained | 293 |
| shrieker-fungus, violet-fungus | Blinded, Charmed, Deafened, Frightened | 286 |
| deva, planetar | Charmed, Exhaustion, Frightened | 279, 315 |
| rakshasa | Charmed, Frightened | 317 |
| gorgon | Exhaustion, Petrified | 292 |
| cockatrice | Petrified | 275 |
| gibbering-mouther | Prone | 288 |
| doppelganger, night-hag, vampire-familiar | Charmed (Vampire Familiar: "except from its vampire master") | 280, 311, 334 |
| knight, cloaker | Frightened | 302, 274 |

Etki örnekleri: sürüler yakalanıp yere düşürülebiliyor ve sersemletilebiliyor; Hydra ve Ettin kör edilip bayıltılabiliyor; Cockatrice ve Gorgon taşlaşabiliyor; Deva ve Planetar büyülenebiliyor.

### 2.5 Canavar yetenekleri (`data/canavar-yetenekleri.json`)

Adlar, DC, yeniden yüklenme, kullanım, zar, menzil, alan ve kurtarma yeteneği PDF metnindeki paragrafla karşılaştırıldı: 222 değer doğru. Eylem ve bonus eylem ayrımı da SRD bölümleriyle aynı (frog/toad Leap hariç).

| Kayıt | Alan | Oyun | SRD | s. | Sonuç |
|---|---|---|---|---:|---|
| elephant | Trample DC / hasar | 12 / 2d10+4 | **16 / 2d10+6** | 348 | yanlış |
| remorhaz | Swallow DC / ateş zarı | 17 / 5d6 | **19 / 3d6** (asit 3d6 + ateş 3d6) | 319 | yanlış |
| purple-worm | Swallow kurtarması | DEX | **STR** (DC 19) | 316 | yanlış |
| giant-frog | Swallow | STR DC 11 kurtarma | **kurtarma yok**: tuttuğu Small hedefi yutar; 2d4 Acid sonraki turunun sonunda, ölmezse kusar | 351 | yanlış |
| giant-toad | Swallow | STR DC 13 kurtarma | **kurtarma yok**: tuttuğu Medium hedefi yutar; her tur sonu 3d6 Acid | 354 | yanlış |
| ice-mephit | Death Burst zarı | 2d6 | **2d4** Cold | 307 | yanlış |
| cat | jump.long | 10 ft | Jumper: mesafe STR yerine DEX'ten (DEX 15 → koşarak 15 ft, durarak 7 ft) | 346 | yanlış |
| giant-frog, giant-toad | Leap (bonus eylem, 20 ft) | var | SRD'de bonus eylem yok; pasif Standing Leap (Long 20 / High 10 ft) | 351, 354 | PDF'te yok |
| giant-toad | Swallow escapeDc | 13 | yok (yalnız kurbağa ölünce 5 ft hareketle çıkılır) | 354 | PDF'te yok |
| frost-giant | War Cry rangeFt | 60 | menzil yok ("can see or hear it") | 285 | PDF'te yok |

### 2.6 Multiattack (`data/multiattack.json`, `monsters.json` metni)

178 Multiattack metni ve 96 planın 95'i SRD ile aynı. Tek yanlış: **clay-golem** planı her turda 3 Slam veriyor; SRD'ye göre 2 Slam, yalnız o tur Hasten kullandıysa 3 (s. 274).

### 2.7 Çağrı ve familiar verisi (`data/summons.json`)

| Kayıt | Alan | Oyun | SRD | s. | Sonuç |
|---|---|---|---|---:|---|
| find-familiar | forms | 11 adlandırılmış biçim | aynı 11 biçim + "or another Beast that has a CR of 0" | 130 | doğru; CR 0 seçeneği eksik (Baboon, Badger, Crab, Deer, Eagle, Giant Fire Beetle, Goat, Hyena, Jackal, Piranha, Scorpion, Seahorse, Vulture) |
| draconic-spirit | hız | 30, uçma 60 | + **Swim 30** | 166 | yanlış (veride `unsupported` olarak biliniyor) |
| draconic-spirit | duyu | Darkvision 60 | + **Blindsight 30** | 166 | yanlış (not "Duyu:" biçiminde değil, motor okumuyor) |
| draconic-spirit | durum bağışıklığı | — | Charmed, Frightened, Poisoned | 166 | yanlış (`unsupported`) |
| animated-object | duyu, bağışıklık | — | Blindsight 30; Poison, Psychic; Charmed, Exhaustion, Frightened, Paralyzed, Poisoned | 109 | yanlış |
| otherworldly-steed | özellikler | yok (veride) | Life Bond; Fell Glare, Fey Step, Healing Touch (bonus eylem) | 131 | ~~yanlış~~ **denetim hatası** (D2'de görüldü): hepsi `src/battle/steed.ts`'te (Kuyruk 19, `featuresK19`); denetim yalnız veri dosyasına baktı |
| arcane-hand | yetenek puanı, tür | 26/10/10/1/1/1, construct | yok (5.2.1'de el bir nesne) | 110 | PDF'te yok |
| flaming-sphere, spirit-pack, elemental-spirit | stat bloğu | AC 10, HP 1… | yok (büyü alanı) | — | PDF'te yok (oyun soyutlaması) |

Doğru bulunanlar: Otherworldly Steed (AC/HP formülü, hız, yetenek puanları, Slam), Draconic Spirit (AC/HP, direnç, yetenek puanları, saldırılar), Giant Insect (AC/HP, hız, yetenek puanları, saldırılar), Animated Object (AC, HP, hız, yetenek puanları, Slam), Arcane Hand (AC 20, HP = büyücünün en çok HP'si, 5d8 Force), Animate Dead biçimleri, Phantom Steed (Riding Horse, 100 ft).

## 3. PDF'te yok

- **`monster-ortamlari.json` tema/ortam (330 kayıt):** SRD 5.2.1 stat bloklarında yaşam alanı yok; bunlar oyun tasarımı. CR alanı 330 kayıtta doğru.
- **`token-sizes.json`:** yalnız görsel ölçek (SRD yalnız boyut alanını verir: 2,5 / 5 / 5 / 10 / 15 / 20 ft).
- **Canavar yetenekleri:** Frost Giant War Cry 60 ft menzili, Giant Toad yutma kaçış DC'si, Giant Frog/Toad "Leap" bonus eylemi.
- **Çağrılar:** Arcane Hand yetenek puanları ve türü; Flaming Sphere, Conjure Animals ve Conjure Elemental yaratık blokları.
- **Oyunda alan yok:** hizalama (330 kaydın hiçbirinde tutulmuyor; motor okumuyor, koruma büyüleri türe bakıyor).

## 4. Temiz çıkan alanlar

- `monsters.json` (330 kayıt): boyut, AC, HP, yürüme ve uçma hızı, hover, "Hız:" notlarındaki tırmanma/yüzme/kazma, darkvision, blindsight/tremorsense/truesight, CR, beceriler, direnç, hasar bağışıklığı ve zayıflık hepsi doğru. §2.3 ve §2.4 dışında yanlış yok.
- `derin-su.json` yüzücü listeleri: 63/63.
- `efsanevi.json`: 30 canavarın kullanım sayısı ve eylem adları stat bloğuyla aynı.
- `binek.json` `egitimli`: SRD "Mounts and Other Animals" tablosuyla aynı 8 hayvan (s. 100). "Eğitimli" yorumu oyuna ait.
- `ele-gecirme.json` ghost: Humanoid, 5 ft, bonus eylemle bırakma, 5 ft içinde belirme (s. 289).

## 5. Savaşta kullanım zinciri

| Yanlış alan | Okuyan kod | Bozulan kural |
|---|---|---|
| Yaratık türü (`canavar-turleri.json`) | `create.ts` `combatantFromMonster` → `creatureType`; `druid.ts` / `polymorph.ts` / `karadul.ts` `TYPES` | Divine Smite (`divine.ts`, Fiend/Undead +1d8); Protection from Evil and Good (`mind.ts`, `divine.ts`); Dispel Evil and Good; Magic Circle / Hallow (`possessionCore.ts`, `movement.ts`); Turn Undead (`cleric.ts`); Dismissal (`spells.ts`); `onlyTypes` büyüleri (Charm Person, Dominate Person: Humanoid; Animal Friendship, Dominate Beast: Beast); Ghost Possession (`possession.ts`, Humanoid); Wild Shape ve Polymorph biçim listesi (Beast); YZ (`ai.ts`: Turn Undead hedefi, Humanoid hedefli büyüler) |
| Yüzme hızı (`yuzme-hizi.json`) | `yuzme.ts` `swimSpeedOf` → `swimFt` | suda hareket hızı (`reduce.ts` max(yürüme, yüzme)), derin su yerleşimi (`movement.ts`); kural sürümü 82+ |
| Yetenek puanı ve kurtarma | `combatantFromMonster` `modifiers`, `saves`, `strScore` | kurtarma zarları (büyü, alan, durum), yetenek kontrolleri (kaçış, itme, atlama), Wild Shape / Polymorph STR/DEX/CON |
| Durum bağışıklığı notu | `monsterTraits.ts` `monsterTraitParts` → `immune` etkisi (`srdK19`) | reducer `immuneTo` bu durumları süzmüyor: Grappled, Prone, Stunned, Charmed, Frightened, Petrified vb. uygulanıyor; YZ hedef seçimi de buna göre |
| Canavar yetenekleri | `monsterAbilities.ts` (`srdK19`, savaş başında `withMonsterAbilities`) | Trample, Swallow, Death Burst kurtarma DC'si ve hasarı; Frog/Toad bonus eylemle bedava atlama |
| Multiattack (clay-golem) | Multiattack planı (`multiattack.plan`) | Clay Golem her turda bir fazla Slam |
| Çağrı blokları | `summons.ts` `creatureMonster` → `combatantFromMonster` | Draconic Spirit yüzemez, Blindsight'ı yok, büyülenebilir/korkutulabilir; Animated Object'in bağışıklığı ve duyusu yok |

Arayüzde de etkisi var:
- Oluşturucunun Wild Shape biçim listesi (`src/screens/builder/Features.tsx` → `eligibleForms`) Giant Eagle/Owl/Elk ve Death Dog'u yanlışlıkla sunuyor.
- Savaş menüsünde Charm Person, Dominate Person, Animal Friendship ve Dominate Beast'in hedef geçerliliği (`spells.ts` `onlyTypes`) türden geliyor; goblinoidler hedef olarak geçerli görünüyor.

## 6. Biçim ve çağrı aktarım zinciri

Kaynak kod: `druid.ts` `shapeStats` + reducer `shape_changed` (yalnız ac, speed, fly, size, modifiers, saves, weaponOptions, attacksPerAction, avatar; Polymorph'ta ayrıca attacks ve multiattack), `polymorph.ts`, `summons.ts` `summonedEvent` / `creatureMonster`, `create.ts` `combatantFromMonster`, `monsterTraits.ts` `withMonsterTraits` (yalnız `createMapBattle` içinde, `create.ts:101/800`).

✓ aktarılıyor · ✗ aktarılmıyor · — uygulanmaz

| Alan | Savaş başındaki canavar (referans) | Wild Shape (`shapeStats`) | Polymorph | Find Familiar · Animate Dead · Phantom Steed (`monsters.json` biçimi, sonradan) | Find Steed · Summon Dragon · Giant Insect · Animate Objects (`summons.json` bloğu) | Conjure Animals / Elemental · Flaming Sphere |
|---|---|---|---|---|---|---|
| Yürüme | ✓ | ✓ | ✓ | ✓ (Phantom Steed 100) | ✓ | ✓ (soyut) |
| Uçma | ✓ | ✓ | ✓ | ✓ | ✓ (seviye/biçim koşullu) | — |
| Hover | ✗ veri doğru, motor okumuyor | ✗ | ✗ | ✗ | — | — |
| Yüzme | ✓ `swimFt` + `gift-of-the-depths` | ✗ *bilinen* | ✗ | ◐ `swimFt` var, `gift-of-the-depths` yok | ✗ (Draconic Spirit 30) | — |
| Tırmanma | ✓ (`monsterTraits` climb) | ✗ | ✗ | ✗ | ✓ Giant Insect `climber` | — |
| Kazma | ✓ `burrowFt` | ✗ | ✗ | ✓ | — | — |
| Darkvision | ✓ | ✗ (druidinki kalır) | ✗ | ✓ | ✓ | — |
| Blindsight / Tremorsense / Truesight | ✓ | ✗ | ✗ | ✓ (`monsterSenses`) | ✗ (Draconic Spirit, Animated Object) | — |
| Direnç | ✓ | ✗ | ✗ | ✓ | ✓ (Draconic Spirit) | — |
| Hasar bağışıklığı / zayıflık | ✓ | ✗ | ✗ | ✓ | ✗ (Animated Object Poison, Psychic) | — |
| Durum bağışıklığı | ✓ (`monsterTraits`) | ✗ | ✗ | ✗ (`withMonsterTraits` yalnız savaş başında) | ✗ | — |
| Özellikler (Magic Resistance, Flyby, Spider Climb, Web Walker, Sunlight Sensitivity, Amphibious) | ✓ | ✗ | ✗ | ✗ (ör. Owl Flyby, Spider Web Walker) | ✗ (Life Bond) | — |
| Pack Tactics, phase, Undead Fortitude, regeneration | ✓ | ✗ | ✗ | ✓ (`combatantFromMonster`) | — | — |
| Canavar yetenekleri (`canavar-yetenekleri.json`) | ✓ (`withMonsterAbilities`) | ✗ | ✗ | ✗ | ✗ (Steed bonus eylemleri) | — |
| STR / DEX / CON | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| INT / WIS / CHA | ✓ | ✓ korunur (SRD doğru) | ✗ hedefinki kalıyor (SRD: biçimden) | ✓ | ✓ | — |
| Kurtarmalar | ✓ | ◐ STR/DEX/CON biçim değiştiricisi; SRD "yüksek olan" | ◐ INT/WIS/CHA hedefinki | ✓ | ✓ (değiştirici = SRD) | — |
| Beceriler | ✓ | ✗ (SRD: biçimin yetkinlikleri eklenir, yüksek olan) | ✗ | ✓ | — | — |
| AC / HP | ✓ | ✓ AC; HP korunur + geçici HP (SRD doğru) | ✓ AC; geçici HP = biçimin HP'si (SRD doğru) | ✓ | ✓ formül | soyut |
| Boyut | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tür | ✓ | ✓ korunur (SRD doğru) | ✓ korunur (5.2.1 doğru) | ✓ familiar seçimi; Animate Dead undead | ✓ seçim / `creatureType` | — |
| Saldırılar / Multiattack | ✓ | ◐ yalnız kurtarmasız, yeniden yüklenmesiz saldırılar | ✓ | familiar saldıramaz (SRD doğru) | ✓ | ✓ |

Aktarım zincirindeki ana açıklar (yeni):
1. **Sonradan eklenen canavar, canavar özelliği almıyor.** `withMonsterTraits` ve `withMonsterAbilities` yalnız savaş kurulurken (`createMapBattle`) çalışıyor. Şunlar `combatantFromMonster` ile sonradan eklenip durum bağışıklığı, tırmanma, Flyby, Spider Climb, Web Walker, Magic Resistance ve canavar yeteneklerini almıyor:
   - kurulumda ritüelle çağrılan familiar, Animate Dead ve Phantom Steed;
   - savaş içinde gelenler: Orman takviyesi ve kemik yığını Skeleton'ları (`forest.ts`), kum solucanı (`desert.ts`), mühür canavarları (`wilds.ts`), kat değişiminde gelenler (`floors.ts`), Animate Trees (`monsterAbilities.ts`), Finger of Death zombisi (`spells69.ts`).

   Etki örnekleri: Zombie ve Skeleton Poisoned olabiliyor (veride "Durum bağışıklığı: Exhaustion, Poisoned" var); Owl familiar Flyby'a rağmen fırsat saldırısı yiyor; Spider, Lizard, Rat ve Cat familiar tırmanamıyor.
2. **`creatureMonster` bazı alanları taşımıyor:** `immunities`, durum bağışıklığı, Blindsight (yalnız "Duyu:" biçimi okunuyor) ve yüzme. `swimSpeedOf` yalnız `monsters.json` kimliklerini tanıyor.
3. **`shapeStats` (Wild Shape, Polymorph, ele geçirme bedeni) yalnız AC, yürüme ve uçma hızı, boyut, STR/DEX/CON, kurtarmalar ve saldırıları taşıyor.** SRD 5.2.1 Wild Shape'te tür, HP, INT/WIS/CHA, sınıf özellikleri ve feat dışındaki her şey biçimden gelir: tırmanma, kazma, duyular, direnç/bağışıklık, özellikler, beceriler (yüksek olan). Yüzme hızı açığı biliniyor.
4. **Polymorph'ta INT/WIS/CHA ve ilgili kurtarmalar/beceriler hedefinkiler kalıyor.** SRD 5.2.1'e göre bunlar biçimin bloğundan gelir; yalnız hizalama, kişilik, tür, HP ve HD korunur.
5. **Monster hover verisi doğru ama motorda okunmuyor:** `flight.ts` `hovers` yalnız etkilere bakıyor.

## 7. Düzeltme önerileri (öncelik sırasıyla, onay bekliyor)

Savaşı doğrudan etkileyenler önce:

1. **`canavar-turleri.json`'u PDF'ten baştan üret** ve `temadan` listesini kaldır. Bu tur doğrulanmış SRD tür kümesini çıkardı (sayfa numaralı). Bilinen 4 kayda ek olarak 19 kayıt değişir. En kritikleri Undead (Specter, Wight, Wraith) ve Fiend (Barbed Devil, Bone Devil, Night Hag; Efreeti'nin Fiend'den çıkması): Turn Undead, Divine Smite ve koruma büyülerini doğrudan bozuyorlar. Bir test, türü PDF'ten üretilmiş bir tabloyla karşılaştırmalı.
2. **23 canavara "Durum bağışıklığı:" notu** (`monsters.json` `unsupported`). Kök neden üreticide: `;` içermeyen `Immunities` satırını durum olarak ayırmıyor. Üretici düzeltilip yeniden çalıştırılmalı.
3. **Yetenek puanları:** Giant Centipede STR 5 / INT 1, Adult White Dragon CON 22, Young White Dragon INT 6 (kurtarma −2), Bandit Captain WIS kurtarma +2.
4. **`canavar-yetenekleri.json`:** Elephant Trample DC 16 / 2d10+6; Remorhaz Swallow DC 19 / ateş 3d6; Purple Worm Swallow STR; Ice Mephit Death Burst 2d4; Giant Frog/Toad Swallow kurtarmasız. Giant Frog/Toad "Leap" bonus eylemi kaldırılıp yerine pasif Standing Leap gelmeli (karar). Cat atlaması DEX'ten hesaplanmalı.
5. **`yuzme-hizi.json`:** Dragon Turtle 50, Gibbering Mouther 20 (+ bilinen 5). Öneri: elle tutmak yerine `monsters.json` "Hız: Swim N ft" notlarından türetilsin (bu notlar 330 kayıtta doğru), bir test de ikisinin eşitliğini denetlesin.
6. **Çağrı ve takviye aktarımı:** savaş kurulduktan sonra eklenen her canavara (çağrı, takviye, kat değişimi) `monsterTraitParts` ve canavar yeteneklerini uygula; tek giriş noktası `combatantFromMonster` sonrası olabilir. `CreatureDef`'e `immunities`, durum bağışıklığı, `senses` ve `swimFt` ekle (Draconic Spirit, Animated Object).
7. **Wild Shape ve Polymorph aktarımı** (`shapeStats` + `ShapePrev`): tırmanma, kazma, yüzme (bilinen), duyular, direnç/bağışıklık/zayıflık, durum bağışıklığı, özellikler ve beceriler; Polymorph'ta INT/WIS/CHA.
8. **Clay Golem Multiattack:** 2 Slam, Hasten kullanılan turda 3.
9. **Find Familiar'a "CR 0 Beast" seçeneği** (13 biçim); Otherworldly Steed'in Life Bond ve bonus eylemleri.
10. **PDF'te olmayan oyun değerleri (karar):** Frost Giant War Cry 60 ft, Giant Toad kaçış DC'si, Arcane Hand yetenek puanları ve türü.
11. **Bilgi:** monster hover verisi doğru ama motor okumuyor; ayrı bir görev olabilir.

**Kural sürümü notu:** 1–8. maddeler savaş sonucunu değiştirir. Eski kayıtların ve replay'in aynı sonucu vermesi için kural sürümüne bağlanmaları gerekebilir. `monsters.json` düzeltmeleri denge amaçlı değil, SRD'ye uyum; CLAUDE.md'deki "denge için değiştirme" yasağına girmiyor, ama bu kararı onaylaman gerekiyor.

## 8. D1 düzeltmeleri (kural sürümü 86)

Tarih: 2026-11-19. Kullanıcı kararları (2026-11-19):
1. Düzeltmeler SRD'ye uyum içindir, denge değildir.
2. PDF'te karşılığı olmayan oyun değerleri değişmez; aşağıda "SRD dışı oyun değeri" olarak listelenir.
3. Savaş sonucunu değiştiren her düzeltme kural sürümüne bağlıdır.

Karar ve uygulama ayrıntısı DECISIONS.md'de ("SRD veri düzeltmeleri D1").

- **Yeni kural sürümü: 86** (`src/battle/srdD1Surum.ts` `SRD_D1_VERSION`). Başlarken depodaki en yüksek sürüm 83'tü; 84 (Control Water girdabı, birleştirmede geldi) ve 85 (Wild Shape) başka görevlere ayrılmıştı.
- **Uygulama:** veri dosyaları artık SRD değerini tutuyor. 85 ve altı savaşlar eski değerleri `data/srd-duzeltme.json`'dan okuyor: 77 kayıt, her biri dosya, kayıt, alan, eski, yeni ve sayfa ile.
- **Kaynak:** her değer PDF'ten. `scripts/srd-canavar.mjs` (`npm run srd:canavar`) 330 stat bloğunu `data/srd/monsters.json`'a çıkarıyor. Denetim turundaki bağımsız Python ayrıştırması ile 330 canavar × 15 alanda 0 fark var.

### Düzeltilenler (grup grup)

| Grup | Kayıt | Ayrıntı |
|---|---:|---|
| Yaratık türü (`canavar-turleri.json`) | 23 | 19 yeni + 4 bilinen. Dosya artık `npm run srd:canavar` ile üretiliyor ve `temadan` listesi kalktı. "PDF'ten" işaretli 263 kaydın hepsi yeniden doğrulandı: 12'si yanlıştı, düzeldi. |
| Durum bağışıklığı (`monsters.json` "Durum bağışıklığı:" notu) | 23 canavar | Kök neden: `;` içermeyen SRD `Immunities` satırı atlanmış. `monsters.json`'un üreticisi depoda yok. Kalıcı koruma: SRD çıkarıcısı bu satırı sözcüklerden ayırıyor, `src/data/srdCanavar.test.ts` 330 canavarın notunu SRD ile karşılaştırıyor. |
| Yetenek puanı / kurtarma (`monsters.json`) | 4 canavar, 5 alan | Giant Centipede STR 5 / INT 1; Adult White Dragon CON 22; Young White Dragon INT 6 (PDF'teki işaretsiz "2" kurtarma değiştirici −2 alındı); Bandit Captain WIS kurtarması +2. |
| Canavar yetenekleri (`canavar-yetenekleri.json`, üretici `k19-canavar-yetenek.py`) | 7 canavar, 16 alan | Elephant Trample DC 16 / 2d10+6; Remorhaz yutma DC 19 / ateş 3d6; Purple Worm yutma STR; Giant Frog yutma kurtarmasız, yalnız Small, sonraki turunun sonunda 2d4, ölmezse kusar; Giant Toad yutma kurtarmasız, her tur sonunda 3d6; Ice Mephit Death Burst 2d4; Cat Jumper DEX 15 → 15 ft. |
| Multiattack (`multiattack.json`, üretici `k19-multiattack.py`; `monsters.json`) | 1 canavar, 3 alan | Clay Golem 2 Slam, Hasten turunda 3 (`ifUsed`). `monsters.json` Slam tekrarı 5 → 2: plansız Multiattack düğmesi 5 Slam yapıyordu. |
| Yüzme hızı (`yuzme-hizi.json`) | 7 | 2 yeni + 5 bilinen. "Bellekten yazıldı" notu kalktı, kayıt başına sayfa eklendi. Dosya `npm run srd:canavar` ile üretiliyor. |

Denetim CSV'sinde: 72 "yanlış" satır düzeltildi (9'u bilinen), 6 "yanlış" satır kaldı (çağrı blokları, aşağıda). Raporun 25 şüphelisi (§2.5) kapandı: 11'i düzeltildi, 10'u zaten doğruydu, 4'ü SRD dışı oyun değeri olarak kaldı.

### SRD dışı oyun değerleri (değişmedi, kullanıcı kararı 2)

| Dosya | Kayıt | Değer | SRD |
|---|---|---|---|
| `canavar-yetenekleri.json` | frost-giant War Cry | `rangeFt` 60 | menzil yok ("can see or hear it") |
| `canavar-yetenekleri.json` | giant-frog, giant-toad | Leap bonus eylemi (20 ft) | pasif Standing Leap |
| `canavar-yetenekleri.json` | giant-frog, giant-toad | `escapeDc` 11 / 13 | kusma DC'si yok. `escapeDamage` 0 olduğu için motorda etkisiz |
| `summons.json` | arcane-hand | STR 26 … CHA 1, `creatureType` construct | 5.2.1'de el bir nesne, stat bloğu yok |
| `summons.json` | flaming-sphere, spirit-pack, elemental-spirit | AC 10, HP 1, hız, yetenekler | büyü alanı; SRD stat bloğu vermez |

### Kalan farklar (D1 kapsamı dışında, öneri)

- **(D2'de kapandı, §9)** **Çağrı blokları (CSV'de 6 "yanlış" satır):** Draconic Spirit'te yüzme 30, Blindsight 30 ve durum bağışıklıkları; Animated Object'te Blindsight 30 ve bağışıklıklar; Otherworldly Steed'te Life Bond ve üç bonus eylem; Find Familiar'da "CR 0 başka Beast" seçeneği.
- **Aktarım (§6):** ~~savaş kurulduktan sonra eklenen canavar (çağrı, takviye, kat değişimi) canavar özelliği ve yeteneği almıyor~~ (D2'de kapandı, §9). `shapeStats` (Wild Shape, Polymorph) yalnız AC, hız, uçma, STR/DEX/CON ve saldırıları taşıyor. Polymorph'ta INT/WIS/CHA hedefte kalıyor. Monster hover verisi motorda okunmuyor.
- **Ek bulgu:** Barbed Devil ve Medusa'da plansız Multiattack (Game Master düğmesi ya da `srdK19` kapalı) "ya / ya da" seçeneklerini toplayıp 4 / 6 saldırı yapıyor. YZ planı doğru (2 / 3). Öneri: plansız yolda planın ilk seçeneği kullanılsın.
- **Yaklaşık (bilerek):** Vampire Familiar "Charmed (except from its vampire master)" tam Charmed bağışıklığı sayıldı. Archmage "Charmed (with Mind Blank)" koşullu olduğu için uygulanmıyor (değişmedi).

### "PDF'te yok" 337 satırın özeti

| Satır | Ne |
|---:|---|
| 330 | `monster-ortamlari.json` tema ve ortam: SRD 5.2.1 stat bloğunda yaşam alanı yok. Oyun tasarımı (Game Master düşman seçicisinin süzgeci, bölge karşılaşma üreteci). CR alanı 330/330 doğru. |
| 1 | `token-sizes.json`: jeton görsel ölçeği (mekanik tek altıgen). |
| 4 | `canavar-yetenekleri.json`: Frost Giant War Cry menzili, Giant Toad kusma DC'si, Giant Frog ve Giant Toad Leap bonus eylemi. |
| 2 | `summons.json`: Arcane Hand puan ve türü; Flaming Sphere, Spirit Pack ve Elemental Spirit soyut blokları. |

Hizalama (1 satır, "oyunda alan yok") değişmedi: motor okumuyor.

### Doğrulama

- **Hızlı regresyon** `src/sim/srdD1Regresyon.test.ts`: 5. seviye standart parti, dört senaryo (Çöl, Kale, Mağara, Orman), D1'in dokunduğu canavarlarla (Death Dog, Giant Centipede, goblinoidler, Bandit Captain, Wight, Specter, Gray Ooze, sürüler, Cockatrice, Giant Frog/Toad).
  - **Sürüm 85:** imzalar D1'den önceki ağaçta (a26ef5c3) ölçülen altınla aynı; 1 tohum 4/4, 3 tohum 4/4.
  - **Sürüm 86:** çökmesiz. 3 tohumda Mağara imzası farklı (Specter/Wight Undead), Çöl, Kale ve Orman aynı (değişen değerler bu tohumlarda tetiklenmedi). Zafer 3/3 her senaryoda.
  - **Kurulum durumu:** 86'da D1 değerlerinin simülasyonda etkin olduğu ayrıca denetlendi (tür, bağışıklık, puan, kurtarma).
- **Birim testleri** `src/battle/srdD1.test.ts`:
  - katman tutarlılığı (77 kaydın her biri: veride yeni, 85 görünümünde eski);
  - tür (Turn Undead Specter'i 86'da döndürüyor, 85'te "Undead yok"; Wild Shape ve Polymorph biçim listeleri);
  - durum bağışıklığı (reducer süzüyor);
  - puan, kurtarma ve geri alma (idempotent);
  - yetenekler (Trample DC, yutma kurtarmasız / tur sonu / kusma, Clay Golem 2 → Hasten 3, 85'te 5);
  - yüzme hızı;
  - replay.
- **Veri testi** `src/data/srdCanavar.test.ts`: 330 canavarda boyut, AC, HP, CR, beş hız, hover, dört duyu, yetenek puanları, kurtarmalar, beceriler, direnç, bağışıklık, zayıflık ve durum bağışıklığı SRD tablosuyla aynı; tür ve yüzme dosyaları da.

## 9. D2: çağrı blokları ve savaş sırasında eklenen canavarlar (kural sürümü 88)

Tarih: 2026-11-19. Kullanıcı kararı: SRD 5.2.1'i izle. Karar ayrıntısı DECISIONS.md'de ("SRD farkları D2").

- **Kural sürümü 88** (`src/battle/srdD2Surum.ts` `SRD_D2_VERSION`). 85 ve 87 Wild Shape görevine ayrıldı.
- **Eski değerler:** D1 katmanında (`data/srd-duzeltme.json`, kayıtta `surum: 88`). Yeni katman açılmadı.

### Savaş sırasında canavar ekleyen yollar

| # | Yol | Kod | ≤ 87: canavar özellikleri / yetenek pasifleri | 88 |
|---:|---|---|---|---|
| 1 | Savaş başı (Game Master kurulumu, simülasyon, Serüven, yolculuk) | `create.ts` `startBattle` → `withMonsterTraits`, `withMonsterAbilities` | var | aynı (canavar başı işlevler `monsterTraitSetup`, `monsterAbilitySetup`) |
| 2 | Büyüyle çağrı, kurulum ritüeli dahil (Find Familiar, Animate Dead, Phantom Steed, Find Steed, Summon Dragon, Giant Insect, Animate Objects, Arcane Hand, Flaming Sphere, Conjure Animals/Elemental) | `summons.ts` `summonedEvent` | yok | var |
| 3 | Paket çağrısı (ödünç canavar, arketip, eşya kancası) | `paket/index.ts` | yok | var |
| 4 | Canavar yeteneğiyle çağrı (Animate Trees, Create Specter) | `monsterAbilities.ts` | yok | var (etkin yetenekleri bilerek yok: zincirleme çağrı olmaz) |
| 5 | Finger of Death zombisi | `spells69.ts` | yok | var |
| 6 | Orman boynuz takviyesi (`hornReinforce`) | `forest.ts` | yok | var |
| 7 | Orman kemik yığını (`boneRise`) | `forest.ts` | yok | var |
| 8 | Çöl kum pususu (`wormAmbush`) | `desert.ts` | yok | var |
| 9 | Buz mühür pusu (`iceSeal`) | `wilds.ts` | yok | var |
| 10 | Kat değişimi (`floorLink`, `floor_changed.added`) | `floors.ts` | yok | var (yeni katın haritasıyla; aura alanları kat olayından sonra) |
| 11 | Uyuyan ejderha | `create.ts` | var (savaş başı geçişlerinden önce eklenir) | aynı |

- **Zaten çalışanlar:** Multiattack planı ve etkin canavar yetenekleri çalışma anında `monsterId`'den okunuyordu; her yolda vardı. Görevin varsayımı bu noktada eksikti.
- **Bilerek dışarıda kalanlar:**
  - çağrılanın tepkileri (Görev R3 kararı);
  - savaş sırasında Game Master'ın canavar ekleme komutu (yok; Game Master canavarı kurulumda ekler, o da 1. yol);
  - alarm grupları (savaş başında üyeler);
  - Polymorph (biçim savaşa eklenmez, yalnız saldırıları alınır; kapsam dışı).
- **Tek giriş:** `src/battle/monsterSetup.ts` `setupMonster` (savaş başındaki iki canavar başı işlev), `lateMonster` (88 kapısı), `lateSummonEvents` (`summoned` olayı + aura `zone_created`). Savaş başı geçişleri aynı işlevleri, aynı sırayla çağırıyor; bu yüzden 87 ve altı bit bit aynı.

### Çağrı blokları (`data/summons.json`)

| Blok | Değişiklik | SRD | s. |
|---|---|---|---:|
| Draconic Spirit | yüzme 30 (`swimFt`); Blindsight 30 ve Charmed/Frightened/Poisoned bağışıklığı (`unsupported` notları, canavarla aynı biçim) | "Speed 30 ft., Fly 60 ft., Swim 30 ft." · "Immunities Charmed, Frightened, Poisoned" · "Senses Blindsight 30 ft., Darkvision 60 ft." | 166 |
| Animated Object | Poison ve Psychic bağışıklığı (`immunities`); Blindsight 30; Charmed, Exhaustion, Frightened, Paralyzed, Poisoned bağışıklığı | "Immunities Poison, Psychic; Charmed, Exhaustion, Frightened, Paralyzed, Poisoned" · "Senses Blindsight 30 ft." | 109 |
| Find Familiar | `forms` 11 → 24: SRD tablosundaki her CR 0 Beast (Baboon, Badger, Crab, Deer, Eagle, Giant Fire Beetle, Goat, Hyena, Jackal, Piranha, Scorpion, Seahorse, Vulture eklendi) | "Bat, Cat, Frog, … Weasel, or another Beast that has a Challenge Rating of 0" | 130 |
| Otherworldly Steed | **değişmedi: denetim hatası.** Life Bond ve Fell Glare / Fey Step / Healing Touch `src/battle/steed.ts`'te (Kuyruk 19) zaten vardı. D1 denetimi yalnız veri dosyasına baktığı için "yanlış" saymıştı. D2'de önce kopya bir uygulama yazıldı, mevcut kod bulununca geri alındı. Test: Life Bond 87 ve 88'de bir kez tetikleniyor, bonus eylemler aynı. | — | 131 |
| Animate Objects | SRD 5.2.1'de stat bloğu var (Animated Object, s. 109); blok Kuyruk 19'dan beri oyunda. D2 yalnız bağışıklık ve Blindsight'ı ekledi; boyut ve HP formülleri önceden doğruydu. | | 109 |
| Flaming Sphere, Spirit Pack, Elemental Spirit, Arcane Hand | değişmedi (SRD'de stat bloğu yok; oyun soyutlaması) | | |

Kalan fark: Draconic Spirit'in Shared Resistances'ı (çağıran bir direnç seçer) uygulanmıyor (`unsupported`).

### Doğrulama

- **Testler** `src/battle/srdD2.test.ts`:
  - katman (5 kayıt);
  - Find Familiar listesi SRD tablosundan;
  - çağrı blokları;
  - her ekleme yolu (Summon Dragon, Animate Objects, Find Familiar ritüeli, Animate Dead, Find Steed + Life Bond, Create Specter, Finger of Death, paket Staff of the Python, Orman kemik yığını, kum pususu, buz mühür, kat değişimi): 88'deki yaratık, 87'deki ham yaratığın `setupMonster`'dan geçmiş hâline eşit, 87'de kurulum yok, replay aynı.
- **Mekanik matris** (`npx vite-node src/sim/mekanikMatris.ts -- --buyu "…" --kural-surumu 87|88`): Find Familiar, Find Steed, Summon Dragon, Animate Dead, Animate Objects, Giant Insect, Conjure Animals/Celestial/Elemental/Fey/Minor Elementals/Woodland Beings, Flaming Sphere, Arcane Hand ve Phantom Steed'in 91 satırı iki sürümde de doğru. Matris dosyaları yeniden yazılmadı.
- **Hızlı regresyon** `src/sim/srdD2Regresyon.test.ts`: 5. seviye standart parti, savaş sırasında canavar eklenen dört senaryo.
  - **Sürüm 87:** imzalar D2'den önceki ağacın (083e4b93) altınıyla aynı; 1 tohum 4/4, 3 tohum 4/4.
  - **Sürüm 88, 3 tohum:**
    - **Ork Kampı (`orman-ork`) değişti:** 4 boynuz takviyesi (Tough, Berserker) artık Bloodied pasifleri ve kaynaklarıyla geliyor.
    - **Kemik Açıklığı (9 iskelet) ve Vaha (2 kum pususu):** canavarlar eklendi ve kuruldu, ama bu tohumlarda sonucu değiştirmedi (Poison/Exhaustion ya da yer altından geçiş devreye girmedi).
    - **Mağara Karakolu:** yapay zekâ kat değiştirmediği için canavar eklenmedi (yol birim testte denetlendi).
    - Zafer her senaryoda 3/3.
