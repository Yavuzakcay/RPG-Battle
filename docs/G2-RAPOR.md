# G2 — İçerik paketi ve efekt eşleme denetimi (2026-11-01)

Kod değişikliği yok (yalnızca duman testi eklendi: `src/app/g2-smoke.test.ts`). İçerik dosyası commit edilmedi (`icerik/` gitignore).

## 1. `npm run check:icerik`

`icerik/` klasörü bu ortamda yok; `docs/ornek-paket/` denetlendi:

| Paket | Sonuç | Alt sınıf | Özellik durumu |
|---|---|---|---|
| `ornek-kurgusal` | geçerli (0 hata) | fighter/kehribar-muhafizi | 4 özellik: çalışır 1, planlı 1, hikâye 1, çalışmıyor 1 |
| | | rogue/sis-yolcusu | 2 özellik: çalışır 1, çalışmıyor 1 |

Toplam 2 özellik çalışmıyor. Gerçek paketler (`icerik/*.json`) yerelde aynı komutla denetlenir: `npm run check:icerik` (PowerShell'de aynı).

## 2. Motorun desteklediği mekanik (FeatureMechanic) — tam liste

Kaynak: `data/class-features.json` (`features`, `resources`, `feats`, `masteries`) ve doğrulayıcı `src/content/schema.ts`.

| Alan | Değerler |
|---|---|
| `type` | passive, resource, action, bonus, reaction, free |
| `status` | ok, partial, none (dış pakette durum etiketi: calisir / planli / hikaye / calismiyor) |
| `stat` | attacksPerAction, sneakAttackDice, speed, unarmoredDefense, expertise, spellcasting, featSlot, weaponMastery, saveAdvantage, classSkills, frenzy, martialArts, critOn, saveProficiency, extraBonusActions |
| `grants` | dash, disengage, hide |
| `openHand` | addle, push, topple |
| `reaction.kind` | shield, parry, halve, resist, deflect, reduce, slowFall, featherFall, counterspell, rebuke, retaliate, redirectAttack, gaze, cutting |
| `effect.kind` | healPool, buff, tempHp, condition, divineSpark, turnUndead, preserveLife, innate, inspire, wildShape, landsAid, leash |
| `trait` | ~90 bilinen işaret (`KNOWN_TRAITS`: tactical-mind, evasion, reliable-talent, colossus-slayer, eldritch-smite, resilience-<tür>…) |
| nesne alanları | rage, martialArts, metabolism, deflect, stunningStrike, reaction, effect, alwaysPrepared, metamagic |
| dizi alanları | skills, alternatives, focusActions, options, actions, invocations |
| sayı / metin / mantık | value, fallReduction, hpPerLevel · column, category, command, resource, note, trait, default · shield, melee · swap |

Durumlar: `class-features.json` 113 özellik (ok 77, partial 21, none 15); SRD alt sınıfları (`data/subclasses.json`) 58 özellik (çalışır 36, planlı 10, çalışmıyor 8, hikâye 4).

## 3. Çalışmayan / planlı özelliklerin sınıflandırması

Dış pakette yalnızca örnek paket olduğu için SRD alt sınıflarının ve sınıf özelliklerinin çalışmayanları da aynı ölçütle tarandı (toplam 36 özellik).

### 3a. Mevcut alanlarla "çalışır" yapılabilir (7)

| Özellik | Kaynak | Mevcut alan |
|---|---|---|
| Kehribar Kalkanı | örnek paket | `reaction.kind: shield` |
| Wholeness of Body | Open Hand | `effect.kind: healPool` (Martial Arts zarıyla) ya da `tempHp` yaklaşığı |
| Fleet Step | Open Hand | `focusActions` (Step of the Wind ile bonus) |
| Supreme Sneak | Thief | `options` / Cunning Strike seçeneği (`cunning`) |
| Dragon Wings | Draconic Sorcery | `effect.kind: buff` (uçuş hızı; süren etkide `fly` var) |
| Dragon Companion | Draconic Sorcery | `alwaysPrepared` + Summon Dragon (çağırma sistemi) |
| Wild Companion | Druid | Find Familiar çağırma (savaşta Magic eylemi `command` alanıyla) |

### 3b. Yeni kanca gerektirenler (öncelik sıralı; gruplar)

| Öncelik | Kanca türü | Özellik sayısı | Özellikler |
|---|---|---:|---|
| 1 | **Aura** (müttefiklere menzilli süren etki, kaynak yürüdükçe güncellenir) | 3 | Aura of Devotion, Smite of Protection, Holy Nimbus |
| 2 | **Özellikten alan** (save'li alan ya da bölge oluşturma; şimdi yalnızca büyü/nefes) | 3 | Intimidating Presence, Nature's Sanctuary, Sis Perdesi (örnek paket) |
| 3 | **Save/kontrol sonrası tetik** (başarısız save'e tepki, kontrol zarına ek) | 3 | Countercharm, Peerless Skill, Mindless Rage (öfkedeyken koşullu durum bağışıklığı) |
| 4 | **Tur başı / dinlenme kaynak yenilenmesi** | 3 | Heroic Warrior, Arcane Apotheosis, Eldritch Master |
| 5 | **Özel tetikli hasar / kaybolma** (oyuncunun sonradan tetiklediği gecikmeli hasar, hedefi geçici yok etme, en yüksek hasar) | 3 | Quivering Palm, Hurl Through Hell, Overchannel |
| 6 | **Oluşturucu ve seçim arayüzü** (liste genişlemesi, slotsuz büyü seçimi, saldırı başına ustalık seçimi) | 5 | Magical Discoveries, Magical Secrets, Spell Mastery, Signature Spells, Tactical Master |
| 7 | **4.–9. seviye büyüler** (büyü sistemine bağlı) | 4 | Divine Intervention, Greater Divine Intervention, Mystic Arcanum, Words of Creation |
| 8 | **Ek tur / inisiyatif** | 1 | Thief's Reflexes |
| — | Savaş dışı / hikâye (kanca gerekmez) | 3 | Thieves' Cant, Memorize Spell, Contact Patron |
| — | Belirsiz (açıklama "planlanan sistem") | 1 | Kehribar Çağrısı (örnek paket) |

## 4. Harita etkileri denetimi

Game Master anahtarı (`data/kural-kontrol.json`), kayıtta saklama (`map.ruleToggles/ruleParams`, `battle_started`) ve simde aç/kapa testi:

| Kural | Anahtar | Kayıtta | Simde aç/kapa testi | Haritalar |
|---|---|---|---|---|
| heat, sandstorm | var | evet | `ruleControl.test.ts` (sandstorm) | Çöl |
| lavaEdge, eruption, lavaRise | var | evet | yok (yalnızca denetlenebilirlik testi) | Volkan, Lav Salonu, Volkan Serüveni |
| wind | var | evet | `forest.test.ts` | Çöl akşam, Ork Kampı |
| waterfall, hornAlarm, hornReinforce, tentFire, treeFell, bridgeBreak, riverBlocked, boneRise, vineTrap, logCover | var | evet | `forest.test.ts` | Orman paketi |
| greaseFlammable, deepWaterLimit (her haritada) | var | evet | `ignite.test.ts`, `deepWater.test.ts` | hepsi |
| darkness, objective | isteğe bağlı (`options`, kurulum onay kutusu) | evet (`map.options`) | yok | Mağara, Derinlikler, Şehir, Taverna |
| sleepingDragon | ayrı kurulum (ejderha, uyanma kipi) | evet (`map.dragon`) | sim `dragonWake` | Volkan |
| **bog, climb, cold, ice, crenel, moat, gate, trap, hiddenTrap, highGround, stairShove, stairwellFall, conveyor, lavJump, storm, swell, deepWater (yüzme), night, stealth, loot, mudNote** | **yok** | — | yok | çeşitli (Bataklık, Dağ, Kale, Dungeon, Deniz, Volkan, Orman…) |

Eksikler: 21 kural türünün Game Master anahtarı yok (bunların bazıları bilgi/ışık kuralı: `night`, `stealth`, `loot`, `mudNote`). Yüzey tepkimeleri tek bayrakla (`yuzeyEtkilesimi`) ve ev kurallarıyla (`houseRules`: buhar, donma, erime, suda yıldırım, zehir patlaması, barut) yönetiliyor; nesneler (fıçı, kapı, masa) mekanik anahtarı taşımıyor (davranışları SRD nesne kuralı).

## 5. Duman testi

`src/app/g2-smoke.test.ts`: seçicide görünen her üst bölgeden ilk harita (Bataklık, Çöl, Dağ, Deniz, Kale, Orman, Şehir, Yeraltı, Volkan, Test ve vitrin; 10 bölge) için kurulum ekranının yolu (`createMapBattle` + `planParticipants`, örnek parti + 2 kurt) → `start_battle` → bir tur yapay zekâ oyunu: **10/10 geçti**.
