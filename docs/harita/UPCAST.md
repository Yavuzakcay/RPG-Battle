# Yukarı slot (upcast) taraması (Görev K9b)

`data/spells.json`'daki ve SRD 5.2.1'de "Using a Higher-Level Spell Slot" metni olan büyüler (savaş dışı olanlar hariç). Betikle üretildi
(`node scripts/upcast-tarama.cjs`; veri `mechanics.upcast`, `applied: true` motorun uyguladığı). Toplam 61: uygulanıyor 52, kısmen 1,
savaşta etkisiz 2, karar/ayrı iş 6, uygulanmıyor 0.

| Seviye | Büyü | Durum | SRD |
|---|---|---|---|
| 1 | Burning Hands | uygulanıyor | The damage increases by 1d6 for each spell slot level above 1. |
| 1 | Magic Missile | uygulanıyor | The spell creates one more dart for each spell slot level above 1. |
| 1 | Thunderwave | uygulanıyor | The damage increases by 1d8 for each spell slot level above 1. |
| 1 | Chromatic Orb | kısmen: zar ölçeği uygulanıyor; aynı zar çıkınca sıçrama (slot seviyesi kadar) yok | The damage increases by 1d8 for each spell slot level above 1. The orb can leap a maximum number of times equal to the level of the slot expended, and a creatur |
| 1 | Ray of Sickness | uygulanıyor | The damage increases by 1d8 for each spell slot level above 1. |
| 1 | Charm Person | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 1 | Hideous Laughter | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 1 | Dissonant Whispers | uygulanıyor | The damage increases by 1d6 for each spell slot level above 1. |
| 1 | Bane | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 1 | Bless | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 1 | Command | uygulanıyor | You can affect one additional creature for each spell slot level above 1. |
| 1 | Cure Wounds | uygulanıyor | The healing increases by 2d8 for each spell slot level above 1. |
| 1 | Healing Word | uygulanıyor | The healing increases by 2d4 for each spell slot level above 1. |
| 1 | Guiding Bolt | uygulanıyor | The damage increases by 1d6 for each spell slot level above 1. |
| 1 | Inflict Wounds | uygulanıyor | The damage increases by 1d10 for each spell slot level above 1. |
| 1 | Searing Smite | uygulanıyor | All the damage increases by 1d6 for each spell slot level above 1. |
| 1 | Hunter's Mark | savaşta etkisiz (yalnızca süre) | Your Concentration can last longer with a spell slot of level 3–4 (up to 8 hours) or 5+ (up to 24 hours). |
| 1 | Hex | savaşta etkisiz (yalnızca süre) | Your Concentration can last longer with a spell slot of level 2 (up to 4 hours), 3–4 (up to 8 hours), or 5+ (24 hours). |
| 1 | Hellish Rebuke | uygulanıyor | The damage increases by 1d10 for each spell slot level above 1. |
| 2 | Scorching Ray | uygulanıyor | You create one additional ray for each spell slot level above 2. |
| 2 | Shatter | uygulanıyor | The damage increases by 1d8 for each spell slot level above 2. |
| 2 | Invisibility | uygulanıyor | You can target one additional creature for each spell slot level above 2. |
| 2 | Hold Person | karar/ayrı iş: Tek hedefli save büyüsü; çok hedef komut ve arayüz ister | You can target one additional Humanoid for each spell slot level above 2. |
| 2 | Acid Arrow | uygulanıyor | The damage (both initial and later) increases by 1d4 for each spell slot level above 2. |
| 2 | Flaming Sphere | uygulanıyor | The damage increases by 1d6 for each spell slot level above 2. |
| 2 | Moonbeam | uygulanıyor | The damage increases by 1d10 for each spell slot level above 2. |
| 2 | Heat Metal | uygulanıyor | The damage increases by 1d8 for each spell slot level above 2. |
| 2 | Blindness/Deafness | karar/ayrı iş: Tek hedefli save büyüsü; çok hedef komut ve arayüz ister | You can target one additional creature for each spell slot level above 2. |
| 2 | Spiritual Weapon | uygulanıyor | The damage increases by 1d8 for every slot level above 2. |
| 2 | Aid | uygulanıyor | Each target’s Hit Points increase by 5 for each spell slot level above 2. |
| 2 | Shining Smite | uygulanıyor | The damage increases by 1d6 for each spell slot level above 2. |
| 3 | Fireball | uygulanıyor | The damage increases by 1d6 for each spell slot level above 3. |
| 3 | Lightning Bolt | uygulanıyor | The damage increases by 1d6 for each spell slot level above 3. |
| 3 | Fly | uygulanıyor | You can target one additional creature for each spell slot level above 3. |
| 3 | Vampiric Touch | uygulanıyor | The damage increases by 1d6 for each spell slot level above 3. |
| 3 | Bestow Curse | uygulanıyor | If you cast this spell using a level 4 spell slot, you can maintain Concentration on it for up to 10 minutes. If you use a level 5+ spell slot, the spell doesn’ |
| 3 | Dispel Magic | karar/ayrı iş: Slot seviyesine göre otomatik bitirme `kind: dispel` kendi kuralında (B5) | You automatically end a spell on the target if the spell’s level is equal to or less than the level of the spell slot you use. |
| 3 | Spirit Guardians | uygulanıyor | The damage increases by 1d8 for each spell slot level above 3. |
| 3 | Mass Healing Word | uygulanıyor | The healing increases by 1d4 for each spell slot level above 3. |
| 3 | Call Lightning | uygulanıyor | The damage increases by 1d10 for each spell slot level above 3. |
| 3 | Conjure Animals | uygulanıyor | The damage increases by 1d10 for each spell slot level above 3. |
| 1 | Divine Smite | uygulanıyor | The damage increases by 1d8 for each spell slot level above 1. |
| 1 | Heroism | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 2 | Find Steed | uygulanıyor | Use the spell slot’s level for the spell’s level in the stat block. |
| 2 | Magic Weapon | uygulanıyor | The bonus increases to +2 with a level 3–5 spell slot. The bonus increases to +3 with a level 6+ spell slot. |
| 5 | Summon Dragon | uygulanıyor | Use the spell slot’s level for the spell’s level in the stat block. |
| 5 | Cone of Cold | uygulanıyor | The damage increases by 1d8 for each spell slot level above 5. |
| 3 | Animate Dead | karar/ayrı iş: Yukarı slotla çok yaratık zaten (çağırma verisi `count`); SRD "iki ek Undead" ile sayı uyumu ayrı denetim | You animate or reassert control over two additional Undead creatures for each spell slot level above 3. Each of the creatures must come from a different corpse  |
| 1 | False Life | uygulanıyor | You gain 5 additional Temporary Hit Points for each spell slot level above 1. |
| 1 | Longstrider | uygulanıyor | You can target one additional creature for each spell slot level above 1. |
| 2 | Mind Spike | uygulanıyor | The damage increases by 1d8 for each spell slot level above 2. |
| 1 | Ensnaring Strike | uygulanıyor | The damage increases by 1d6 for each spell slot level above 1. |
| 3 | Gaseous Form | uygulanıyor | You can target one additional creature for each spell slot level above 3. |
| 1 | Fog Cloud | uygulanıyor | The fog’s radius increases by 20 feet for each spell slot level above 1. |
| 1 | Animal Friendship | uygulanıyor | You can target one additional Beast for each spell slot level above 1. |
| 2 | Flame Blade | uygulanıyor | The damage increases by 1d6 for each spell slot level above 2. |
| 1 | Ice Knife | uygulanıyor | The Cold damage increases by 1d6 for each spell slot level above 1. |
| 2 | Dragon's Breath | uygulanıyor | The damage increases by 1d6 for each spell slot level above 2. |
| 2 | Enhance Ability | uygulanıyor | You can target one additional creature for each spell slot level above 2. You can choose a different ability for each target. |
| 1 | Jump | karar/ayrı iş: Görev K9c | You can target one additional creature for each spell slot level above 1. |
| 2 | Spider Climb | karar/ayrı iş: Görev K9c | You can target one additional creature for each spell slot level above 2. |
