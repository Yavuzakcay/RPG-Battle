# Seviye ilerlemesi denetimi (Görev L, 1. aşama)

Hedef: karakterler D&D 5E SRD 5.2.1'deki gibi 1–20. seviyede doğru oynasın. Bu belge bugünkü durumu çıkarır; kod değişikliği yok. Kaynaklar:
- kod: `src/rules/stats.ts`, `src/rules/builder.ts`, `src/battle/economy.ts`, `src/battle/features.ts`, `src/battle/spells.ts`, `src/battle/weapons.ts`, `src/sim/balance.ts`;
- veri: `data/classes.json`, `data/spells.json`, `data/spell-slots.json`, `data/items.json`, `data/weapons.json`, `data/armor.json`, `data/monsters.json`;
- SRD: `docs/SRD_CC_v5.2.1.pdf`. Sayılar PDF'ten metin olarak ayrıştırıldı; büyü ve eşya sayılarında birkaç adetlik sapma olabilir.

Kısaca:
- Sayısal iskelet (yeterlilik bonusu, HP, slot tabloları, Extra Attack, Sneak Attack zarı, cantrip ölçeklenmesi) 20. seviyeye kadar doğru.
- Ama 12 sınıftan 8'inin **1. seviye** ana özelliği yok: Rage, Martial Arts, Lay on Hands, Bardic Inspiration, Wild Shape, Sorcery Points/Metamagic, Eldritch Invocations, Arcane Recovery.
- Büyüler 3. seviyede bitiyor (82/≈318).
- Yetenek artışı (ASI) ve feat yok; skorlar 1. seviyedekiyle kalıyor.
- Gerçekçi "doğru çalışan" aralık: Fighter, Rogue ve Ranger için 1–4 (kısmen 5), diğerleri için hiçbir seviye tam değil.

---

## 1. Seviye aralığı

| Katman | Destek | Not |
|---|---|---|
| Oluşturucu | 1–20 | Seviye seçimi 1–20 (`characterProblems`: "Seviye 1–20 olmalı") |
| Yeterlilik bonusu | 1–20 doğru | `2 + ⌊(seviye − 1) / 4⌋` (`rules/abilities.ts`) |
| HP | 1–20 doğru (sabit ortalama) | 1. seviye tam zar + CON, sonra her seviye zar/2 + 1 + CON (SRD sabit değer). Dwarf'ın seviye başına +1'i var. Zarla HP atma seçeneği yok |
| Büyü slotları | 1–20 doğru | Tam, yarı ve Pact Magic tabloları SRD 5.2.1 ile birebir (aşağıda) |
| Büyü seçimi | Fiilen 1–5 (büyücü), 1–9 (yarı büyücü) | Veri 0–3. seviyede bitiyor. 7. seviye tam büyücünün 4. seviye slotları yalnızca 1–3. seviye büyüleri yukarı slotla atmaya yarıyor |
| Yetenek skorları | Yalnızca 1. seviye | Puan satın alma / standart dizi + geçmiş +2/+1. 4, 8, 12, 16 (ve 19) ASI ya da feat yok |
| Sınıf özellikleri | Sınıfa göre (bölüm 2) | Ölçeklenen birkaç özellik 20'ye kadar doğru (Extra Attack, Sneak Attack, Action Surge, Second Wind, Favored Enemy) |

**Motor hangi seviyeye kadar doğru:** Sayısal hesaplar 20'ye dek tutarlı ve hata vermiyor. Kurallara uygunluk sınıfa bağlı:
- **Fighter, Rogue, Ranger:** 1–4 neredeyse tam. Eksikler: Steady Aim; Ranger'da büyüler 1–2. seviye. Weapon Mastery ve Fighting Style Görev P0'da eklendi; Nick, Two-Weapon Fighting ve yan el (Light ek saldırısı) Görev P1'de.
- **Cleric, Wizard:** 1–5 büyü açısından kullanılabilir. Sınıf özellikleri (Channel Divinity, Arcane Recovery) eksik.
- **Barbarian:** 1–5 tam (Görev P-Barbarian; Primal Knowledge kısmen). 6+ (Mindless Rage, Feral Instinct, Brutal Strike…) yok.
- **Paladin:** 1–5 Görev P-Paladin'de (Lay On Hands, Paladin's Smite, Blessed Warrior, Channel Divinity, Sacred Weapon, yemin büyüleri; Faithful Steed çalışmıyor).
- **Monk:** 1–5 Görev P-Monk'ta (Martial Arts, Focus, Uncanny Metabolism, Deflect Attacks kısmen, Slow Fall, Stunning Strike, Open Hand Technique).
- **Bard, Druid, Sorcerer, Warlock:** 1. seviyede bile ana mekanikleri eksik.

---

## 2. Sınıf × seviye aralığı

Durum: **tam**, **kısmi** ya da **yok**; sınıfın o aralıktaki SRD özelliklerine göre. Alt sınıflar SRD 5.2.1'deki tek alt sınıftır. Repoda **hiç alt sınıf yok**, alt sınıf seçimi de yok.

Uygulananlar (tamamı):
- Extra Attack: Fighter 5/11/20; Barbarian, Monk, Paladin, Ranger 5.
- Fighter: Second Wind (2/3/4 kullanım), Action Surge (2. seviyede 1, 17. seviyede 2).
- Rogue: Sneak Attack (⌈seviye/2⌉ d6), Cunning Action (2).
- Ranger: Favored Enemy (bedava Hunter's Mark, 2→6 kullanım).
- Unarmored Defense: Barbarian ve Monk. Fast Movement: Barbarian 5. Unarmored Movement: Monk.
- Spellcasting: slotlar, DC, saldırı; cantrip ölçeklenmesi 5/11/17; Eldritch Blast ışın sayısı.
- Konsantrasyon. Fırsat saldırısı.
- Spiritual Weapon ve Spirit Guardians (kalıcı). Hunter's Mark taşınması.

| Sınıf (SRD alt sınıfı) | 1–4 | 5–8 | 9–12 | 13–16 | 17–20 | Eksik başlıca özellikler |
|---|---|---|---|---|---|---|
| Barbarian (Path of the Berserker) | tam | kısmi | yok | yok | yok | 1–5 Görev P-Barbarian'da uygulandı (Rage, Danger Sense, Reckless Attack, Primal Knowledge kısmen, Frenzy). Eksik: Mindless Rage (6), Feral Instinct, Instinctive Pounce; Brutal Strike, Relentless Rage, Persistent Rage, Indomitable Might, Primal Champion |
| Bard (College of Lore) | kısmi | kısmi | yok | yok | yok | **Bardic Inspiration** (kaynak), Expertise, Jack of All Trades, Cutting Words, Font of Inspiration, Countercharm, Magical Secrets; 4–9. seviye büyüler |
| Cleric (Life Domain) | kısmi | kısmi | yok | yok | yok | Divine Order, **Channel Divinity** (Divine Spark, Turn Undead), Disciple of Life, Sear Undead, Blessed Strikes, Divine Intervention; 4–9. seviye büyüler |
| Druid (Circle of the Land) | kısmi | kısmi | yok | yok | yok | Primal Order, **Wild Shape** (kaynak, biçimler), Wild Companion, Land's Aid, Wild Resurgence, Elemental Fury, Archdruid; 4–9. seviye büyüler |
| Fighter (Champion) | kısmi | kısmi | kısmi | kısmi | kısmi | Fighting Style, Weapon Mastery, Tactical Mind/Shift/Master, **Improved/Superior Critical** (19–20 / 18–20), Remarkable Athlete, Indomitable (1→3), Studied Attacks, Heroic Warrior, Survivor |
| Monk (Warrior of the Open Hand) | tam | kısmi | kısmi | yok | yok | 1–5 Görev P-Monk: Martial Arts (Unarmed Strike, Monk silahı zarı, bonus vuruş; Grapple/Shove DC'sinde DEX yok), Unarmored Defense/Movement, Focus (Flurry of Blows, Patient Defense, Step of the Wind; atlama ikilemesi yok), Uncanny Metabolism, Deflect Attacks (kendiliğinden tepki; geri yöneltme yok), Slow Fall (tepki harcamaz), Extra Attack, Stunning Strike (başarılı save'de hız yarılanması yok), Open Hand Technique. Eksik: Empowered Strikes (6), Wholeness of Body, Evasion, Acrobatic Movement, Heightened Focus, Self-Restoration, Deflect Energy, Disciplined Survivor, Perfect Focus, Superior Defense, Body and Mind |
| Paladin (Oath of Devotion) | tam | kısmi | yok | yok | yok | 1–5 Görev P-Paladin: Lay On Hands, Weapon Mastery, Fighting Style (Blessed Warrior dahil), Paladin's Smite (Divine Smite), Channel Divinity (Sacred Weapon; Divine Sense etkisiz), yemin büyüleri, Extra Attack; Faithful Steed çalışmıyor (çağırma yok). Eksik: **Aura of Protection** (6), Abjure Foes, Aura of Courage/Devotion, Radiant Strikes, Restoring Touch, Aura Expansion; 3–5. seviye büyüler |
| Ranger (Hunter) | kısmi | kısmi | kısmi | yok | yok | Weapon Mastery, Fighting Style, Deft Explorer, **Hunter's Prey** (Colossus Slayer / Horde Breaker), Roving, Expertise, Tireless, Relentless Hunter, Defensive Tactics, Precise Hunter, Feral Senses, Foe Slayer; 4–5. seviye büyüler |
| Rogue (Thief) | kısmi | kısmi | kısmi | kısmi | kısmi | Expertise (motor destekliyor, oluşturucu seçtirmiyor), Weapon Mastery, Steady Aim, Fast Hands, **Cunning Strike**, **Uncanny Dodge**, **Evasion**, Reliable Talent, Devious Strikes, Slippery Mind, Elusive, Stroke of Luck. Sneak Attack zarı 20'ye dek doğru |
| Sorcerer (Draconic Sorcery) | kısmi | kısmi | yok | yok | yok | Innate Sorcery, **Font of Magic / Sorcery Points**, **Metamagic**, Draconic Resilience (AC 10 + DEX + CHA, HP), Elemental Affinity, Sorcerous Restoration, Sorcery Incarnate; 4–9. seviye büyüler |
| Warlock (Fiend Patron) | kısmi | kısmi | yok | yok | yok | **Eldritch Invocations** (Agonizing Blast vb.), Magical Cunning, Dark One's Blessing (geçici HP), Contact Patron, **Mystic Arcanum** (6–9. seviye, 11/13/15/17), Eldritch Master; 4–5. seviye büyüler (Pact slotu 5. seviyeye çıkıyor ama büyü yok) |
| Wizard (Evoker) | kısmi | kısmi | yok | yok | yok | Ritual Adept, **Arcane Recovery**, Scholar, Evocation Savant, **Potent Cantrip**, **Sculpt Spells**, Empowered Evocation, Overchannel, Memorize Spell, Spell Mastery, Signature Spells; 4–9. seviye büyüler |

**Sınıf kaynakları:** Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Focus (Ki), Lay on Hands, Sorcery Points ve Arcane Recovery yok. `Resources` tipinde yalnızca `actionSurge`, `secondWind`, `favoredEnemy` var (`economy.ts`).
**Bonus eylemler:** Yalnızca Rogue Cunning Action ve büyülerin bonus eylemi. Eksikler: Rage, Flurry of Blows, Martial Arts bonus vuruşu, Bardic Inspiration, Wild Shape (Druid 2024'te bonus eylem), Quickened Spell.
**Tepkiler:** Fırsat saldırısı var. Eksikler: Uncanny Dodge, Deflect Attacks, Shield / Counterspell akışı, Cutting Words, Hellish Rebuke (veride var, tepki akışı yok).
**2024'e özgü ortak eksikler:**
- Weapon Mastery: Barbarian, Fighter, Paladin, Ranger ve Rogue'un 1. seviye özelliği. Görev P0: uygulandı (silahın mastery'si SRD silah tablosundan); Nick Görev P1'de.
- Fighting Style ve Epic Boon (19).
- Alt sınıf seçimi (3. seviye).

---

## 3. Büyüler

### Veri ve motor (seviyeye göre)

| Büyü seviyesi | SRD 5.2.1 (≈) | Veride | Motorda mekaniği olan | Fark |
|---:|---:|---:|---:|---|
| 0 (cantrip) | 24 | 16 | 10 | 8 cantrip yok, 6'sı yalnızca not (`utility`) |
| 1 | 56 | 25 | 16 | 31 yok |
| 2 | 56 | 20 | 11 | 36 yok |
| 3 | 41 | 21 | 9 | 20 yok |
| 4 | 30 | 0 | 0 | hepsi yok |
| 5 | 33 | 0 | 0 | hepsi yok |
| 6 | 30 | 0 | 0 | hepsi yok |
| 7 | 18 | 0 | 0 | hepsi yok |
| 8 | 15 | 0 | 0 | hepsi yok |
| 9 | 15 | 0 | 0 | hepsi yok |
| **Toplam** | **≈318** | **82** | **46** | |

- **"Mekaniği olan"** saldırı, kurtarma, otomatik, iyileştirme, uyku ve işaret türleridir. 36 büyü `utility`: listede seçilir ama oyunda etkisi yoktur ya da yalnızca not düşer. Örnekler: Shield, Mage Armor, Bless, Haste, Counterspell, Misty Step, Fly, Revivify.
- **Süreli durum:** 6 büyü `data/condition-effects.json` ile uygulanıyor (Hold Person, Hideous Laughter, Blindness/Deafness, Fear, Entangle, Web).
- **Veri hataları (2014 değerleri):**
  - Cure Wounds 1d8 + mod (SRD 5.2.1: **2d8** + mod).
  - Healing Word 1d4 + mod (SRD 5.2.1: **2d4** + mod).
  - Diğer büyüler de 5.2.1'e göre yeniden gözden geçirilmeli.
- **Bilinen/hazırlanan büyü sayısı** denetlenmiyor: oluşturucu seviyeye uygun her büyüyü seçtiriyor. Cantrip sayısı ve hazırlanan büyü tablosu yok.

### Slot tabloları

| Tablo | Durum |
|---|---|
| Tam büyücü (Bard, Cleric, Druid, Sorcerer, Wizard) | Doğru: 1–20 SRD 5.2.1 ile birebir (`data/spell-slots.json` `full`) |
| Yarı büyücü (Paladin, Ranger) | Doğru: 2024 kuralı, 1. seviyeden büyü (`half`). 5. seviye slotları 17/19'da |
| Üçte bir büyücü | Gerekmiyor: SRD 5.2.1'deki alt sınıflarda (Champion, Thief) yok |
| Warlock Pact Magic | Doğru: slot sayısı 1/2/3/4 (1, 2, 11, 17. seviye); slot seviyesi 1→5 (`spellSlotsFor`). **Mystic Arcanum yok** |

### Yukarı seviye slotla atma (upcasting)
- **Motor:** `cast_spell` komutu `slotLevel` alıyor, yukarı slot harcanıyor.
- **Ek etki yalnızca 2 büyüde:** Spirit Guardians ve Spiritual Weapon (`upcastDice`). Diğer bütün büyülerde yukarı slot boşa gidiyor. Örnekler:
  - Fireball +1d6;
  - Magic Missile +1 dart;
  - Cure Wounds +2d8;
  - Hold Person +1 hedef.
- **Arayüz ve yapay zekâ slot seviyesi seçmiyor:** büyü hep en düşük uygun slotla atılıyor. Slot seçici yok.

### Konsantrasyon
- Var: tek büyü sınırı, yenisi eskisini bitirir.
- Hasar alınca CON kurtarma zarı (DC 10 ya da hasarın yarısı, en çok 30).
- 0 HP'de biter.
- War Caster gibi istisnalar yok (feat yok).

---

## 4. Eşyalar

| Tür | SRD 5.2.1 (≈) | Veride | Eksikler |
|---|---:|---:|---|
| Silah | 38 | 29 | Club, Dart, Sling, Lance, Pike, War Pick, Blowgun, Musket, Pistol. **Weapon Mastery** (Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex): Görev P0'da SRD tablosundan okunuyor; Nick Görev P1'de (yan el) |
| Zırh | 12 + kalkan | 8 + zırhsız + kalkan | Padded, Scale Mail, Ring Mail, Splint |
| Sihirli eşya | ≈249 (Common 2, Uncommon 75, Rare 82, Very Rare 52, Legendary 30, Artifact 1, değişken 7) | 13 + 4 iksir + 5 araç | Neredeyse tamamı; +1/+2/+3 silah/zırh yalnızca karakter verisindeki `enchant` alanıyla (oluşturucu seçtirmiyor) |

- **Uygulanan eşya etkileri:**
  - Ring/Cloak of Protection (+1 AC ve kurtarma).
  - Bracers of Defense.
  - Skor koyan eşyalar: Amulet of Health, Gauntlets of Ogre Power, Headband of Intellect, Belt of Hill Giant Strength.
- **Yalnızca not:** iksirler, Wand of Fireballs, Boots of Speed, Cloak of Displacement, Staff of Healing.
- **Nadirlik** verisi yok (`rarity` alanı boş).
- **Ayarlanma (attunement):** bilgi olarak var ama en çok 3 eşya sınırı denetlenmiyor.
- **Seviyeye göre uygunluk** yok. Örneğin 1. seviye karaktere Belt of Hill Giant Strength takılabiliyor; SRD'de seviyeye göre önerilen nadirlik ve büyülü eşya dağıtımı kılavuzu var.
- **Tüketilen eşyalar** (iksir, asa yükü) savaşta kullanılamıyor: "eşya kullan" eylemi yok.

---

## 5. Seviyeyle ölçeklenen genel kurallar

| Kural | Durum | Not |
|---|---|---|
| Yeterlilik bonusu | tam | +2 → +6 |
| HP (sabit ortalama) | tam | Zarla HP seçeneği yok; Dwarf +1/seviye var. Sorcerer Draconic Resilience (+1/seviye) yok (alt sınıf yok) |
| Yetenek artışı (ASI) 4/8/12/16 ve Fighter 6/14, Rogue 10 | **yok** | Skorlar 1. seviyede donuk; 20. seviye karakter 1. seviyenin skorlarıyla oynuyor |
| Feat (Origin, General, Fighting Style, Epic Boon) | **yok** | SRD 5.2.1 feat'leri: Alert, Magic Initiate, Savage Attacker, Skilled; Ability Score Improvement, Grappler; Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting; Boon of Combat Prowess, Dimensional Travel, Fate, Irresistible Offense, Spell Recall, the Night Spirit, Truesight |
| Beceri yeterliliği | kısmi | Sınıf seçimi (1. seviye) ve geçmiş/tür (en çok 3). Ranger 9. seviye Expertise gibi seviyeyle gelen ek beceriler yok |
| Uzmanlık (Expertise) | kısmi | Motor `expertise` alanını uyguluyor (simülasyondaki Rogue'da var). Oluşturucu seçtirmiyor: Rogue 1/6, Bard 2/9, Ranger 9 |
| Jack of All Trades, Reliable Talent, Remarkable Athlete | yok | |
| Kurtarma zarı yeterliliği | tam (sınıf) | Monk 14 Disciplined Survivor ve Paladin 6 Aura of Protection yok |
| Dinlenme ve kaynak yenilenmesi | kısmi | `rules/rest.ts` (Hit Dice) var, oyunda kullanılmıyor. Tek savaşlık oyunda sorun değil; seviye arttıkça kısa dinlenmeyle dolan kaynaklar önem kazanır |
| Cantrip ölçeklenmesi | tam | 5/11/17 (hasar zarı ya da ışın) |

---

## 6. Canavar tarafı

| CR | Canavar | Not |
|---|---:|---|
| 0–4 | 217 | |
| 5–8 | 52 | |
| 9–12 | 23 | Yalnızca 2'si efsanevi (Aboleth, Sphinx of Lore) |
| 13–16 | 18 | 10'u efsanevi |
| 17–20 | 8 | 6'sı efsanevi |
| 21+ | 12 | Hepsi efsanevi |

- Yüksek seviye parti için düşman **var** (CR 9+ 61 canavar).
- **Kırılganlık:** CR 13+'ın çoğu bugün oldukları kadar güçlü oynamıyor:
  - **Efsanevi eylem ve direnç** (62 not): ejderhalar, Lich, Vampire ve Balor turda yalnızca kendi sırasında hareket ediyor. "Kaybetme" sigortası olan Legendary Resistance da yok. Parti büyüleri (Hold Person vb.) tek kurtarma zarıyla etkisiz kalmıyor.
  - **Alan nefesi** (82 not): koni ve çizgi tek hedefe indirgeniyor. Ejderhanın en tehlikeli eylemi 4–6 hedef yerine bir hedefe vuruyor.
  - **Canavar büyüleri** (71) ve **tepkiler** (24) yok: Archmage, Lich, Rakshasa gibi büyücü düşmanlar yalnızca silah saldırısıyla oynuyor.
  - **Çok altıgenlik boyut** yok (Large 107, Huge 34 not): Huge/Gargantuan yaratık tek altıgende kolayca çevrelenip kuşatılıyor.
  - **Durum bağışıklığı** (75 canavar) yok. Yüksek seviye parti büyüleriyle (Hold Monster vb., henüz yok) birleşince bu daha önemli olur.
- **Sonuç:** Yüksek seviye savaşı şu an düşman lehine değil, **parti lehine** bozuk. Ama parti de 4+ seviye büyüleri, ASI ve sınıf özellikleri olmadan zayıf; iki yanlış birbirini kısmen dengeliyor. Ölçülen kazanma oranları bu yüzden yanıltıcı olur.
- **Ön koşul:** Efsanevi eylem/direnç ve alan nefesi tamamlanmadan CR 13+ dengesi ölçülmemeli.

---

## 7. Denge ölçümü

- **Bugün:** `npm run sim` partisi sabit 5. seviye: Bor (Fighter), Mira (Wizard), Tavi (Cleric), Sela (Rogue), Kael (Ranger) (`src/sim/balance.ts` `PARTY`).
  - Bütün senaryolar bu partiyle, hedef %55–85.
  - Seviye parametresi yok; düşman listeleri 5. seviyeye göre elle kuruldu (XP 2.400–5.200).
- **Yüksek seviye senaryosu için gerekenler:**
  1. **Seviyeli parti üreteci:** sınıf, seviye → skorlar (ASI dahil), donanım (seviyeye uygun +N silah/zırh, sihirli eşya), büyü listesi (her slot seviyesinden en iyi seçimler). Elle yazılmış 5 sayfa yerine `partyAt(level)`.
  2. **Seviye parametresi:** `npm run sim -- 200 --seviye 11 kale`. Senaryo kimliği aynı kalır, düşman listesi seviyeye göre ayrı tutulur.
  3. **Bütçe:** SRD 5.2.1 Combat Encounters, XP Budget per Character tablosu. Kitaptaki örnekler: 1. seviye düşük 50, 3. seviye orta 225, 15. seviye yüksek 7.800 XP/karakter. Senaryo XP'si bu tabloyla doğrulanır (bugün `scenarioXp` hesaplanıyor, tabloyla karşılaştırılmıyor).
  4. **Ölçüm noktaları:** her aşama için bir temsilci seviye (5, 8, 11, 15, 19), her biri için 3–4 harita.
  5. **Yapay zekâ:** yeni kaynakları kullanmalı (Rage açma, Flurry, Smite, Metamagic, yukarı slot seçimi, alan büyüsü hedeflemesi), yoksa simülasyon partiyi olduğundan zayıf ölçer.

---

## 8. Aşamalar ve öneri

İş yükü: **küçük** (≤ 1 görev), **orta** (2–3 görev), **büyük** (4+ görev). Her aşama kendi içinde oluşturucu + motor + yapay zekâ + test + denge ölçümünü kapsar.

### Aşama 0: Ortak altyapı (seviyeden bağımsız, önce) — orta
- Alt sınıf seçimi (3. seviye); sınıf/alt sınıf özellik tablosu veriye (`data/class-features.json`: seviye → özellik kimliği). Kodda `classId === 'fighter' && level >= 5` kalıplarının yerine.
- ASI / feat seçimi (4, 8, 12, 16, 19 ve sınıf istisnaları) ve oluşturucuda seviye geçmişi. En azından "her ASI'de +2 ya da feat" listesi.
- Genel sınıf kaynağı modeli: `resources` kaynak adı → kalan sayı, yenilenme (kısa/uzun dinlenme); Rage, Focus, Sorcery Points, Lay on Hands, Bardic Inspiration, Channel Divinity, Wild Shape aynı modelle.
- Büyü verisini SRD 5.2.1'e eşitleme (Cure Wounds 2d8, Healing Word 2d4…) ve upcast verisi (`upcastDice` / `upcastTargets` tüm büyülerde). Arayüz ve yapay zekâ için slot seçimi.
- Bağımlılık: yok. Diğer her şey buna dayanır.

### Aşama 1: Seviye 1–5 tam — büyük
- Her sınıfın 1–5 özellikleri: Rage, Reckless Attack, Martial Arts + Focus + Stunning Strike, Lay on Hands, Paladin's Smite, Bardic Inspiration, Wild Shape (sade: birkaç SRD hayvan biçimi), Channel Divinity, Sorcery Points + 2–3 Metamagic, Eldritch Invocations (Agonizing Blast, Repelling Blast), Arcane Recovery, Weapon Mastery, Fighting Style, Uncanny Dodge, Cunning Strike, Steady Aim, Hunter's Prey.
- Alt sınıfların 3. seviye özellikleri (Champion Improved Critical, Berserker Frenzy, Life Domain…).
- Büyüler: eksik 0–3. seviye büyülerin savaşta işe yarayanları (≈40–60; ritüel ve keşif büyüleri not olarak kalabilir).
- Origin feat'leri (CLAUDE.md'deki "Köken feat seçimi" maddesi).
- Denge: 5. seviye partiyi bu kurallarla yeniden ölç (bugünkü senaryolar).
- Bağımlılık: Aşama 0.

### Aşama 2: Seviye 6–10 — büyük
- Özellikler: Aura of Protection ve Aura of Courage, Evasion, Indomitable, Brutal Strike, Empowered Strikes, Magical Secrets, Wild Resurgence, Elemental Fury, Divine Intervention, Potent Cantrip / Sculpt Spells, Contact Patron.
- **4. ve 5. seviye büyüler** (≈63; savaşta etkili olanlar önce: Polymorph, Banishment, Wall of Fire, Cone of Cold, Hold Monster, Greater Invisibility…). Kalıcı alan büyüleri (duvarlar) ve koni/çizgi alanlar gerekli.
- Feat'ler (General ve Fighting Style).
- Denge: 8. seviye senaryoları (CR 5–9 düşmanlar; Young dragon'lar).
- Bağımlılık:
  - Aşama 1;
  - **koni/çizgi alan** (oyuncu büyüleri için de: Cone of Cold, Lightning Bolt zaten tek hedefe indirgenmişse düzeltilmeli);
  - kalıcı alan büyüsü altyapısı;
  - canavar durum bağışıklığı (Hold Monster, Banishment için).

### Aşama 3: Seviye 11–16 — büyük
- Özellikler: Fighter 3 saldırı (var), Relentless Rage, Persistent Rage, Mystic Arcanum (6–8), Reliable Talent, Superior Critical, Radiant Strikes, Self-Restoration, Disciplined Survivor.
- **6–8. seviye büyüler** (≈63; Disintegrate, Chain Lightning, Heal, Forcecage…).
- **Ön koşul: efsanevi eylem/direnç ve alan nefesi.** CR 13–16 düşmanlarının çoğu efsanevi; bunlar olmadan denge anlamsız.
- Yapay zekâ: ekonomi kararları (aura konumu, efsanevi eylemleri sırasıyla kullanma).
- Denge: 11 ve 15. seviye senaryoları (Adult dragon, golem, dev, şeytan).
- Bağımlılık: Aşama 2, efsanevi eylem/direnç, canavar büyüleri ve tepkileri (Archmage, Rakshasa, Lich).

### Aşama 4: Seviye 17–20 — orta–büyük
- **9. seviye büyüler** (≈15: Wish yalnızca kopyalama modunda, Meteor Swarm, Power Word Kill, Time Stop…).
- Epic Boon feat'leri (19) ve kapanış özellikleri (Primal Champion, Archdruid, Signature Spells, Foe Slayer, Stroke of Luck…).
- **Çok altıgenlik canavarlar:** Ancient dragon, Tarrasque ve Kraken Huge/Gargantuan; tek altıgende kuşatma onları çok zayıflatıyor.
- Denge: 19. seviye senaryoları (Ancient dragon, Lich, Pit Fiend, Balor).
- Bağımlılık: Aşama 3, çok altıgenlik boyut.

### Önerilen sıra

1. **Aşama 0** (alt sınıf, ASI/feat, kaynak modeli, büyü verisi eşitleme, slot seçimi). CLAUDE.md'deki "Büyü seviyesi tutarlılığı" maddesi buraya girer.
2. **Aşama 1** (1–5 tam). Bugünkü bütün senaryolar 5. seviyede olduğu için en hızlı ve en ölçülebilir kazanç. Oluşturucunun 1–20'ye izin verip 6+ seviyede yanlış oynaması sürdüğü sürece, oluşturucuya geçici olarak "6+ seviye deneysel" uyarısı konmalı.
3. **Efsanevi eylem/direnç + koni/çizgi alanlar** (canavar ve oyuncu için ortak). CLAUDE.md sırasında 3. madde; Aşama 2'den önce bitmeli.
4. **Aşama 2** (6–10) ve 4–5. seviye büyüler.
5. **Canavar büyüleri, tepkileri, durum bağışıklığı.**
6. **Aşama 3** (11–16).
7. **Çok altıgenlik canavarlar**, sonra **Aşama 4** (17–20).

Her aşamanın sonunda: seviyeli parti üreteciyle o aşamanın temsilci seviyesinde 200 tohumluk ölçüm (`docs/harita/DENGE.md`), hedef %55–85.
