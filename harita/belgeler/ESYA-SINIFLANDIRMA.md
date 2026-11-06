# Eşya sınıflandırması (Kuyruk A5)

`node scripts/a5-esya-siniflandirma.mjs` üretir; elle düzenlenmez. Kaynak: `data/items.json` + `data/items-srd.json`, karar listesi `data/esya-siniflandirma.json`. Kararlar DECISIONS.md (Kuyruk A5).

- **(a) savaş dışı:** eşyada `offCombat` (gerekçe metni; görevdeki `savasDisi: true` bu alan, ikinci bir alan açılmadı).
- **(b) veriyle tanımlı:** savaşta etkisi mevcut şemayla veride (`kod`: bir sınıf özelliği eşyayı arar): `effects` (AC, save, yetenek), `passive` (süren etki alanları), `use` (iksir, fırlatma, sürme), `spells`/`charges` (yüklü büyü), `bonus` (+X), `onHit` (isabette ek zar), `attack`.
- **(c) kalıba uymayan — karar bekliyor:** mevcut ilkellerle tanımlanamayan; her birinde gereken kanca yazılı.

## Özet

| Sınıf | Sayı |
|---|---|
| (a) savaş dışı | 145 |
| (b) veriyle tanımlı | 235 |
| (c) kalıba uymayan (karar bekliyor) | 19 |
| sınıflanmamış (alan yok, karar yok) | 0 |
| **Toplam** | 399 |

Uyum (attunement) gerektiren: 175 (en çok 3 eşya; fazlası savaşa girmez: `MAX_ATTUNED`, `src/rules/stats.ts`). Sarf eşyası (`use`): 58 (savaşta "Eşya" menüsü, `use_item`; yapay zekâ yarı canın altında iyileştirme iksiri içer). Yüklü büyülü: 41.

## (c) Kalıba uymayanlar

| Kimlik | Ad | Veride olan | Gereken |
|---|---|---|---|
| bag-of-tricks | Bag of Tricks | — | rastgele hayvan çağırma — eşyadan çağırma yok |
| berserker-axe | Berserker Axe | bonus | lanet (uyum bozulmaz, kana susama WIS save) — eşya laneti ilkeli yok |
| defender | Defender | bonus | silah bonusunu tur başında AC'ye aktarma seçimi — eşya seçim kancası yok |
| energy-bow | Energy Bow | bonus | enerji oku (ok yaratma, menzil seçimi) — eşya saldırı biçimi kancası yok |
| figurine-of-wondrous-power | Figurine of Wondrous Power | — | heykelcikten yaratık — eşyadan çağırma yok (Game Master canavar ekler) |
| hat-of-many-spells | Hat of Many Spells | bonus | rastgele büyü tablosu — eşya büyüsünde rastgele sonuç yok |
| horn-of-valhalla | Horn of Valhalla | — | berserker ruhları çağırma — eşyadan çağırma yok |
| immovable-rod | Immovable Rod | — | havada sabit nesne — K53 geçici engelini eşyaya bağlama yok |
| nine-lives-stealer | Nine Lives Stealer | bonus | anında öldürme (HP ≤ 100, CON save, yük) — eşya isabet kancasında ölüm yok |
| quarterstaff-of-the-acrobat | Quarterstaff of the Acrobat | bonus | biçim değiştirme (sırık, yay) ve Acrobatics — eşya biçim kancası yok |
| rod-of-absorption | Rod of Absorption | — | büyüyü tepkiyle emme, yük biriktirme — eşya tepkisi yok (Counterspell yolu) |
| rod-of-lordly-might | Rod of Lordly Might | bonus | altı düğmeli biçim değişimi (silah, merdiven, kilit) — eşya biçim kancası yok |
| scimitar-of-speed | Scimitar of Speed | bonus | bonus eylemle bir saldırı — eşyadan bonus saldırı ilkeli yok |
| spell-scroll | Spell Scroll | — | parşömen: içerdiği büyü envanter kaydında değil (eşya başına büyü seçimi gerekir) — Game Master |
| staff-of-the-python | Staff of the Python | — | asayı Giant Constrictor Snake'e çevirme — eşyadan çağırma yok (R3 çağırma büyü yolunda) |
| talisman-of-pure-good | Talisman of Pure Good | bonus | kötü uyumlu tutana hasar, uçurum açma yükü — hizalanma savaşa girmez |
| talisman-of-ultimate-evil | Talisman of Ultimate Evil | bonus | iyi uyumlu tutana hasar, uçurum yükü — hizalanma savaşa girmez |
| vorpal-sword | Vorpal Sword | bonus | doğal 20'de kafa kesme — eşya isabet kancasında ölüm yok |
| wand-of-enemy-detection | Wand of Enemy Detection | — | 60 ft içindeki düşmanları sezme — gizlenme bilgisini eşyaya bağlama yok |

## A5'te tanımlananlar

| Kimlik | Tanım |
|---|---|
| rod-of-resurrection | Heal (1 yük; 6. seviye büyüler anahtarı `spells69` açıkken), 5 yük; Resurrection savaş dışı |

## (b) Veriyle tanımlı

| Kimlik | Ad | Alanlar |
|---|---|---|
| potion-of-greater-healing | Potion of Greater Healing | use |
| potion-of-healing | Potion of Healing | use |
| potion-of-superior-healing | Potion of Superior Healing | use |
| potion-of-supreme-healing | Potion of Supreme Healing | use |
| acid | Acid (vial) | use |
| alchemists-fire | Alchemist's fire | use |
| antitoxin | Antitoxin | use |
| healers-kit | Healer's kit | passive |
| holy-water | Holy water | use |
| amulet-of-health | Amulet of Health | effects |
| belt-of-hill-giant-strength | Belt of Hill Giant Strength | effects |
| boots-of-speed | Boots of Speed | use |
| bracers-of-defense | Bracers of Defense | effects |
| cloak-of-displacement | Cloak of Displacement | passive |
| cloak-of-protection | Cloak of Protection | effects |
| gauntlets-of-ogre-power | Gauntlets of Ogre Power | effects |
| headband-of-intellect | Headband of Intellect | effects |
| poisoners-kit | Poisoner's Kit | kod |
| ring-of-protection | Ring of Protection | effects |
| staff-of-healing | Staff of Healing | spells |
| wand-of-fireballs | Wand of Fireballs | spells |
| wand-of-magic-missiles | Wand of Magic Missiles | spells |
| poison-basic | Basic Poison | use |
| lantern-bullseye | Bullseye Lantern | passive |
| candle | Candle | passive |
| lantern-hooded | Hooded Lantern | passive |
| lamp | Lamp | passive |
| net | Net | use |
| torch | Torch | passive |
| adamantine-armor | Adamantine Armor | passive |
| ammunition-of-slaying | Ammunition of Slaying | onHit |
| ammunition-1 | Ammunition, +1 | bonus |
| ammunition-2 | Ammunition, +2 | bonus |
| ammunition-3 | Ammunition, +3 | bonus |
| animated-shield | Animated Shield | use |
| armor-of-invulnerability | Armor of Invulnerability | passive, use |
| armor-of-resistance-acid | Armor of Resistance (acid) | passive |
| armor-of-resistance-bludgeoning | Armor of Resistance (bludgeoning) | passive |
| armor-of-resistance-cold | Armor of Resistance (cold) | passive |
| armor-of-resistance-fire | Armor of Resistance (fire) | passive |
| armor-of-resistance-force | Armor of Resistance (force) | passive |
| armor-of-resistance-lightning | Armor of Resistance (lightning) | passive |
| armor-of-resistance-necrotic | Armor of Resistance (necrotic) | passive |
| armor-of-resistance-piercing | Armor of Resistance (piercing) | passive |
| armor-of-resistance-poison | Armor of Resistance (poison) | passive |
| armor-of-resistance-psychic | Armor of Resistance (psychic) | passive |
| armor-of-resistance-radiant | Armor of Resistance (radiant) | passive |
| armor-of-resistance-slashing | Armor of Resistance (slashing) | passive |
| armor-of-resistance-thunder | Armor of Resistance (thunder) | passive |
| armor-of-vulnerability-bludgeoning | Armor of Vulnerability (bludgeoning) | passive |
| armor-of-vulnerability-piercing | Armor of Vulnerability (piercing) | passive |
| armor-of-vulnerability-slashing | Armor of Vulnerability (slashing) | passive |
| armor-1 | Armor, +1 | effects |
| armor-2 | Armor, +2 | effects |
| armor-3 | Armor, +3 | effects |
| arrow-catching-shield | Arrow-Catching Shield | passive |
| bead-of-force | Bead of Force | spells |
| belt-of-cloud-giant-strength | Belt of Cloud Giant Strength | effects |
| belt-of-dwarvenkind | Belt of Dwarvenkind | passive |
| belt-of-fire-giant-strength | Belt of Fire Giant Strength | effects |
| belt-of-frost-giant-strength | Belt of Frost Giant Strength | effects |
| belt-of-stone-giant-strength | Belt of Stone Giant Strength | effects |
| belt-of-storm-giant-strength | Belt of Storm Giant Strength | effects |
| boots-of-elvenkind | Boots of Elvenkind | passive |
| boots-of-levitation | Boots of Levitation | spells |
| boots-of-striding-and-springing | Boots of Striding and Springing | passive |
| boots-of-the-winterlands | Boots of the Winterlands | passive |
| bracers-of-archery | Bracers of Archery | onHit |
| brooch-of-shielding | Brooch of Shielding | passive |
| broom-of-flying | Broom of Flying | passive |
| cape-of-the-mountebank | Cape of the Mountebank | spells |
| carpet-of-flying | Carpet of Flying | passive |
| circlet-of-blasting | Circlet of Blasting | spells, attack |
| cloak-of-arachnida | Cloak of Arachnida | passive, spells |
| cloak-of-elvenkind | Cloak of Elvenkind | passive |
| cloak-of-invisibility | Cloak of Invisibility | use |
| cloak-of-the-bat | Cloak of the Bat | passive, spells |
| cloak-of-the-manta-ray | Cloak of the Manta Ray | passive |
| cube-of-force | Cube of Force | spells |
| dagger-of-venom | Dagger of Venom | bonus, onHit |
| dancing-sword | Dancing Sword | bonus, onHit |
| demon-armor | Demon Armor | effects, onHit |
| dragon-scale-mail | Dragon Scale Mail | effects, passive |
| dragon-slayer | Dragon Slayer | bonus, onHit |
| dust-of-disappearance | Dust of Disappearance | use |
| dust-of-sneezing-and-choking | Dust of Sneezing and Choking | use |
| dwarven-plate | Dwarven Plate | effects |
| dwarven-thrower | Dwarven Thrower | bonus, onHit |
| elemental-gem | Elemental Gem | spells |
| elixir-of-health | Elixir of Health | use |
| elven-chain | Elven Chain | effects |
| eyes-of-charming | Eyes of Charming | spells |
| eyes-of-the-eagle | Eyes of the Eagle | passive |
| feather-token | Feather Token | spells |
| flame-tongue | Flame Tongue | passive, onHit |
| frost-brand | Frost Brand | passive, onHit |
| gem-of-brightness | Gem of Brightness | spells |
| giant-slayer | Giant Slayer | bonus, onHit |
| glamoured-studded-leather | Glamoured Studded Leather | effects |
| gloves-of-missile-snaring | Gloves of Missile Snaring | passive |
| goggles-of-night | Goggles of Night | passive |
| hammer-of-thunderbolts | Hammer of Thunderbolts | effects, bonus, onHit |
| helm-of-brilliance | Helm of Brilliance | passive, spells |
| helm-of-teleportation | Helm of Teleportation | spells |
| holy-avenger | Holy Avenger | passive, bonus, onHit |
| horn-of-blasting | Horn of Blasting | use |
| horseshoes-of-speed | Horseshoes of Speed | passive |
| horseshoes-of-a-zephyr | Horseshoes of a Zephyr | passive |
| ioun-stone | Ioun Stone | effects |
| iron-bands | Iron Bands | use |
| javelin-of-lightning | Javelin of Lightning | onHit |
| luck-blade | Luck Blade | effects, bonus |
| mace-of-disruption | Mace of Disruption | passive, onHit |
| mace-of-smiting | Mace of Smiting | bonus, onHit |
| mace-of-terror | Mace of Terror | spells |
| mantle-of-spell-resistance | Mantle of Spell Resistance | passive |
| mithral-armor | Mithral Armor | passive |
| necklace-of-adaptation | Necklace of Adaptation | passive |
| necklace-of-fireballs | Necklace of Fireballs | spells |
| necklace-of-prayer-beads | Necklace of Prayer Beads | spells |
| oathbow | Oathbow | onHit |
| oil-of-etherealness | Oil of Etherealness | use |
| oil-of-sharpness | Oil of Sharpness | use |
| oil-of-slipperiness | Oil of Slipperiness | use |
| periapt-of-health | Periapt of Health | passive |
| periapt-of-proof-against-poison | Periapt of Proof against Poison | passive |
| periapt-of-wound-closure | Periapt of Wound Closure | passive |
| plate-armor-of-etherealness | Plate Armor of Etherealness | use |
| potion-of-climbing | Potion of Climbing | use |
| potion-of-cloud-giant-strength | Potion of Cloud Giant Strength | use |
| potion-of-diminution | Potion of Diminution | use |
| potion-of-fire-giant-strength | Potion of Fire Giant Strength | use |
| potion-of-flying | Potion of Flying | use |
| potion-of-frost-giant-strength | Potion of Frost Giant Strength | use |
| potion-of-gaseous-form | Potion of Gaseous Form | use |
| potion-of-growth | Potion of Growth | use |
| potion-of-heroism | Potion of Heroism | use |
| potion-of-hill-giant-strength | Potion of Hill Giant Strength | use |
| potion-of-invisibility | Potion of Invisibility | use |
| potion-of-invulnerability | Potion of Invulnerability | use |
| potion-of-poison | Potion of Poison | use |
| potion-of-resistance-acid | Potion of Resistance (acid) | use |
| potion-of-resistance-bludgeoning | Potion of Resistance (bludgeoning) | use |
| potion-of-resistance-cold | Potion of Resistance (cold) | use |
| potion-of-resistance-fire | Potion of Resistance (fire) | use |
| potion-of-resistance-force | Potion of Resistance (force) | use |
| potion-of-resistance-lightning | Potion of Resistance (lightning) | use |
| potion-of-resistance-necrotic | Potion of Resistance (necrotic) | use |
| potion-of-resistance-piercing | Potion of Resistance (piercing) | use |
| potion-of-resistance-poison | Potion of Resistance (poison) | use |
| potion-of-resistance-psychic | Potion of Resistance (psychic) | use |
| potion-of-resistance-radiant | Potion of Resistance (radiant) | use |
| potion-of-resistance-slashing | Potion of Resistance (slashing) | use |
| potion-of-resistance-thunder | Potion of Resistance (thunder) | use |
| potion-of-speed | Potion of Speed | use |
| potion-of-stone-giant-strength | Potion of Stone Giant Strength | use |
| potion-of-storm-giant-strength | Potion of Storm Giant Strength | use |
| potion-of-vitality | Potion of Vitality | use |
| ring-of-evasion | Ring of Evasion | passive |
| ring-of-feather-falling | Ring of Feather Falling | passive |
| ring-of-free-action | Ring of Free Action | passive |
| ring-of-invisibility | Ring of Invisibility | use |
| ring-of-jumping | Ring of Jumping | spells |
| ring-of-mind-shielding | Ring of Mind Shielding | passive |
| ring-of-regeneration | Ring of Regeneration | passive |
| ring-of-resistance-acid | Ring of Resistance (acid) | passive |
| ring-of-resistance-bludgeoning | Ring of Resistance (bludgeoning) | passive |
| ring-of-resistance-cold | Ring of Resistance (cold) | passive |
| ring-of-resistance-fire | Ring of Resistance (fire) | passive |
| ring-of-resistance-force | Ring of Resistance (force) | passive |
| ring-of-resistance-lightning | Ring of Resistance (lightning) | passive |
| ring-of-resistance-necrotic | Ring of Resistance (necrotic) | passive |
| ring-of-resistance-piercing | Ring of Resistance (piercing) | passive |
| ring-of-resistance-poison | Ring of Resistance (poison) | passive |
| ring-of-resistance-psychic | Ring of Resistance (psychic) | passive |
| ring-of-resistance-radiant | Ring of Resistance (radiant) | passive |
| ring-of-resistance-slashing | Ring of Resistance (slashing) | passive |
| ring-of-resistance-thunder | Ring of Resistance (thunder) | passive |
| ring-of-shooting-stars | Ring of Shooting Stars | spells |
| ring-of-spell-turning | Ring of Spell Turning | passive |
| ring-of-swimming | Ring of Swimming | passive |
| ring-of-telekinesis | Ring of Telekinesis | spells |
| ring-of-warmth | Ring of Warmth | passive |
| ring-of-water-walking | Ring of Water Walking | passive |
| ring-of-the-ram | Ring of the Ram | use |
| robe-of-eyes | Robe of Eyes | passive |
| robe-of-scintillating-colors | Robe of Scintillating Colors | use |
| robe-of-stars | Robe of Stars | effects, spells |
| robe-of-the-archmagi | Robe of the Archmagi | effects, passive, bonus |
| rod-of-alertness | Rod of Alertness | passive |
| rod-of-resurrection | Rod of Resurrection | spells |
| rope-of-entanglement | Rope of Entanglement | use |
| scarab-of-protection | Scarab of Protection | passive |
| sentinel-shield | Sentinel Shield | passive |
| shield-of-missile-attraction | Shield of Missile Attraction | passive |
| shield-of-the-cavalier | Shield of the Cavalier | effects |
| shield-1 | Shield, +1 | effects |
| shield-2 | Shield, +2 | effects |
| shield-3 | Shield, +3 | effects |
| slippers-of-spider-climbing | Slippers of Spider Climbing | passive |
| spellguard-shield | Spellguard Shield | passive |
| staff-of-charming | Staff of Charming | spells |
| staff-of-fire | Staff of Fire | passive, spells |
| staff-of-frost | Staff of Frost | passive, spells |
| staff-of-power | Staff of Power | effects, spells, bonus |
| staff-of-striking | Staff of Striking | bonus, onHit |
| staff-of-swarming-insects | Staff of Swarming Insects | spells |
| staff-of-thunder-and-lightning | Staff of Thunder and Lightning | spells, bonus |
| staff-of-withering | Staff of Withering | onHit |
| staff-of-the-magi | Staff of the Magi | passive, spells, bonus |
| staff-of-the-woodlands | Staff of the Woodlands | spells, bonus |
| sun-blade | Sun Blade | passive, bonus, onHit |
| sword-of-life-stealing | Sword of Life Stealing | onHit |
| sword-of-sharpness | Sword of Sharpness | onHit |
| sword-of-wounding | Sword of Wounding | onHit |
| thunderous-greatclub | Thunderous Greatclub | effects, onHit |
| trident-of-fish-command | Trident of Fish Command | spells |
| vicious-weapon | Vicious Weapon | onHit |
| wand-of-binding | Wand of Binding | spells |
| wand-of-fear | Wand of Fear | spells |
| wand-of-lightning-bolts | Wand of Lightning Bolts | spells |
| wand-of-paralysis | Wand of Paralysis | spells |
| wand-of-polymorph | Wand of Polymorph | spells |
| wand-of-web | Wand of Web | spells |
| wand-of-wonder | Wand of Wonder | spells |
| wand-of-the-war-mage-1 | Wand of the War Mage, +1 | bonus |
| wand-of-the-war-mage-2 | Wand of the War Mage, +2 | bonus |
| wand-of-the-war-mage-3 | Wand of the War Mage, +3 | bonus |
| weapon-of-warning | Weapon of Warning | passive |
| weapon-1 | Weapon, +1 | bonus |
| weapon-2 | Weapon, +2 | bonus |
| weapon-3 | Weapon, +3 | bonus |
| wind-fan | Wind Fan | spells |
| winged-boots | Winged Boots | passive |
| wings-of-flying | Wings of Flying | use |

## (a) Savaş dışı

| Kimlik | Ad | Gerekçe |
|---|---|---|
| bag-of-holding | Bag of Holding | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ammunition | Ammunition | cephane savaşta sayılır (silah verisi, 20 adet) |
| arcane-focus | Arcane Focus | keşif/yolculuk eşyası (hikâye) |
| backpack | Backpack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| ball-bearings | Ball Bearings | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| barrel | Barrel | kap/giysi/araç; savaşta mekanik karşılığı yok |
| basket | Basket | kap/giysi/araç; savaşta mekanik karşılığı yok |
| bedroll | Bedroll | keşif/yolculuk eşyası (hikâye) |
| bell | Bell | keşif/yolculuk eşyası (hikâye) |
| blanket | Blanket | keşif/yolculuk eşyası (hikâye) |
| block-and-tackle | Block and Tackle | keşif/yolculuk eşyası (hikâye) |
| book | Book | keşif/yolculuk eşyası (hikâye) |
| bottle-glass | Bottle, Glass | kap/giysi/araç; savaşta mekanik karşılığı yok |
| bucket | Bucket | kap/giysi/araç; savaşta mekanik karşılığı yok |
| burglars-pack | Burglar’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| caltrops | Caltrops | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| case-crossbow-bolt | Case, Crossbow Bolt | kap/giysi/araç; savaşta mekanik karşılığı yok |
| case-map-or-scroll | Case, Map or Scroll | kap/giysi/araç; savaşta mekanik karşılığı yok |
| chain | Chain | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| chest | Chest | kap/giysi/araç; savaşta mekanik karşılığı yok |
| climbers-kit | Climber’s Kit | keşif/yolculuk eşyası (hikâye) |
| clothes-fine | Clothes, Fine | kap/giysi/araç; savaşta mekanik karşılığı yok |
| clothes-travelers | Clothes, Traveler’s | kap/giysi/araç; savaşta mekanik karşılığı yok |
| component-pouch | Component Pouch | kap/giysi/araç; savaşta mekanik karşılığı yok |
| costume | Costume | kap/giysi/araç; savaşta mekanik karşılığı yok |
| crowbar | Crowbar | keşif/yolculuk eşyası (hikâye) |
| diplomats-pack | Diplomat’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| druidic-focus | Druidic Focus | keşif/yolculuk eşyası (hikâye) |
| dungeoneers-pack | Dungeoneer’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| entertainers-pack | Entertainer’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| explorers-pack | Explorer’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| flask | Flask | kap/giysi/araç; savaşta mekanik karşılığı yok |
| grappling-hook | Grappling Hook | keşif/yolculuk eşyası (hikâye) |
| holy-symbol | Holy Symbol | keşif/yolculuk eşyası (hikâye) |
| hunting-trap | Hunting Trap | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| ink | Ink | keşif/yolculuk eşyası (hikâye) |
| ink-pen | Ink Pen | keşif/yolculuk eşyası (hikâye) |
| jug | Jug | kap/giysi/araç; savaşta mekanik karşılığı yok |
| ladder | Ladder | keşif/yolculuk eşyası (hikâye) |
| lock | Lock | keşif/yolculuk eşyası (hikâye) |
| magnifying-glass | Magnifying Glass | keşif/yolculuk eşyası (hikâye) |
| manacles | Manacles | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| map | Map | keşif/yolculuk eşyası (hikâye) |
| mirror | Mirror | keşif/yolculuk eşyası (hikâye) |
| oil | Oil | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| paper | Paper | keşif/yolculuk eşyası (hikâye) |
| parchment | Parchment | keşif/yolculuk eşyası (hikâye) |
| perfume | Perfume | keşif/yolculuk eşyası (hikâye) |
| pole | Pole | keşif/yolculuk eşyası (hikâye) |
| pot-iron | Pot, Iron | kap/giysi/araç; savaşta mekanik karşılığı yok |
| pouch | Pouch | kap/giysi/araç; savaşta mekanik karşılığı yok |
| priests-pack | Priest’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| quiver | Quiver | kap/giysi/araç; savaşta mekanik karşılığı yok |
| ram-portable | Ram, Portable | keşif/yolculuk eşyası (hikâye) |
| rations | Rations | keşif/yolculuk eşyası (hikâye) |
| robe | Robe | kap/giysi/araç; savaşta mekanik karşılığı yok |
| rope | Rope | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| sack | Sack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| scholars-pack | Scholar’s Pack | kap/giysi/araç; savaşta mekanik karşılığı yok |
| shovel | Shovel | keşif/yolculuk eşyası (hikâye) |
| signal-whistle | Signal Whistle | keşif/yolculuk eşyası (hikâye) |
| spikes-iron | Spikes, Iron | keşif/yolculuk eşyası (hikâye) |
| spyglass | Spyglass | keşif/yolculuk eşyası (hikâye) |
| string | String | keşif/yolculuk eşyası (hikâye) |
| tent | Tent | keşif/yolculuk eşyası (hikâye) |
| tinderbox | Tinderbox | keşif/yolculuk eşyası (hikâye) |
| vial | Vial | kap/giysi/araç; savaşta mekanik karşılığı yok |
| waterskin | Waterskin | keşif/yolculuk eşyası (hikâye) |
| amulet-of-proof-against-detection-and-location | Amulet of Proof against Detection and Location | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| amulet-of-the-planes | Amulet of the Planes | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| apparatus-of-the-crab | Apparatus of the Crab | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| bag-of-beans | Bag of Beans | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| bag-of-devouring | Bag of Devouring | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| bead-of-nourishment | Bead of Nourishment | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| bowl-of-commanding-water-elementals | Bowl of Commanding Water Elementals | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| brazier-of-commanding-fire-elementals | Brazier of Commanding Fire Elementals | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| candle-of-invocation | Candle of Invocation | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| censer-of-controlling-air-elementals | Censer of Controlling Air Elementals | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| chime-of-opening | Chime of Opening | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| crystal-ball | Crystal Ball | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| crystal-ball-of-mind-reading | Crystal Ball of Mind Reading | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| crystal-ball-of-telepathy | Crystal Ball of Telepathy | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| crystal-ball-of-true-seeing | Crystal Ball of True Seeing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| cubic-gate | Cubic Gate | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| decanter-of-endless-water | Decanter of Endless Water | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| deck-of-illusions | Deck of Illusions | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| dimensional-shackles | Dimensional Shackles | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| dragon-orb | Dragon Orb | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| dust-of-dryness | Dust of Dryness | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| efficient-quiver | Efficient Quiver | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| efreeti-bottle | Efreeti Bottle | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| eversmoking-bottle | Eversmoking Bottle | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| eyes-of-minute-seeing | Eyes of Minute Seeing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| folding-boat | Folding Boat | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| gem-of-seeing | Gem of Seeing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| gloves-of-swimming-and-climbing | Gloves of Swimming and Climbing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| gloves-of-thievery | Gloves of Thievery | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| handy-haversack | Handy Haversack | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| hat-of-disguise | Hat of Disguise | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| helm-of-comprehending-languages | Helm of Comprehending Languages | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| helm-of-telepathy | Helm of Telepathy | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| instant-fortress | Instant Fortress | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| iron-flask | Iron Flask | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| lantern-of-revealing | Lantern of Revealing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| manual-of-bodily-health | Manual of Bodily Health | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| manual-of-gainful-exercise | Manual of Gainful Exercise | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| manual-of-golems | Manual of Golems | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| manual-of-quickness-of-action | Manual of Quickness of Action | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| marvelous-pigments | Marvelous Pigments | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| medallion-of-thoughts | Medallion of Thoughts | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| mirror-of-life-trapping | Mirror of Life Trapping | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| mysterious-deck | Mysterious Deck | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| pearl-of-power | Pearl of Power | Pearl of Power: bir slot geri (savaş dışı ayin değil: bonus eylem — Game Master notu) |
| philter-of-love | Philter of Love | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| pipes-of-haunting | Pipes of Haunting | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| pipes-of-the-sewers | Pipes of the Sewers | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| portable-hole | Portable Hole | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| potion-of-animal-friendship | Potion of Animal Friendship | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| potion-of-clairvoyance | Potion of Clairvoyance | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| potion-of-longevity | Potion of Longevity | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| potion-of-mind-reading | Potion of Mind Reading | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| potion-of-water-breathing | Potion of Water Breathing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ring-of-animal-influence | Ring of Animal Influence | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ring-of-djinni-summoning | Ring of Djinni Summoning | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ring-of-elemental-command | Ring of Elemental Command | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ring-of-spell-storing | Ring of Spell Storing | dolduran büyücünün büyüleri; savaşta Game Master notu (büyü listesine eklenir) |
| ring-of-three-wishes | Ring of Three Wishes | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| ring-of-x-ray-vision | Ring of X-ray Vision | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| robe-of-useful-items | Robe of Useful Items | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| rod-of-rulership | Rod of Rulership | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| rod-of-security | Rod of Security | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| rope-of-climbing | Rope of Climbing | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| sending-stones | Sending Stones | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| sovereign-glue | Sovereign Glue | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| sphere-of-annihilation | Sphere of Annihilation | Game Master nesnesi (2d10 × 4 force); oyuncu envanteri değil |
| stone-of-controlling-earth-elementals | Stone of Controlling Earth Elementals | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| stone-of-good-luck | Stone of Good Luck (Luckstone) | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| talisman-of-the-sphere | Talisman of the Sphere | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| tome-of-clear-thought | Tome of Clear Thought | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| tome-of-leadership-and-influence | Tome of Leadership and Influence | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| tome-of-understanding | Tome of Understanding | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| universal-solvent | Universal Solvent | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| wand-of-magic-detection | Wand of Magic Detection | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| wand-of-secrets | Wand of Secrets | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| well-of-many-worlds | Well of Many Worlds | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
