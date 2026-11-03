# SRD 5.2.1 tam denetim (Kuyruk 19, görev 7)

Üretim: `npx vite-node scripts/srd-denetim.ts`. Durum: **tam** (oyunda kural gibi çalışır), **kısmi**, **yok**, **savaş dışı** (savaşta mekanik karşılığı yok; gerekçe notta). Kuyruk 19 eklentileri Game Master anahtarı `srdK19` (kural sürümü 16) ile.

## Özet

- **Silah**: tam 38
- **Silah özelliği**: tam 9
- **Weapon Mastery**: tam 8
- **Zırh**: tam 13
- **Maceracı eşyası**: tam 14, savaş dışı 67
- **Sihirli eşya**: tam 171, savaş dışı 87
- **Feat**: tam 17
- **Tür özelliği**: tam 38, savaş dışı 2, kapsam dışı 1
- **Geçmiş**: tam 4
- **Savaş kuralı**: tam 8
- **Canavar yeteneği**: tam 131, savaş dışı 55, yok 8

## Tablo

| Kategori | Ad | Durum | Not |
|---|---|---|---|
| Silah | Club | tam | Light; ustalık Slow |
| Silah | Dagger | tam | Finesse, Light, Thrown (Range 20/60); ustalık Nick |
| Silah | Greatclub | tam | Two-Handed; ustalık Push |
| Silah | Handaxe | tam | Light, Thrown (Range 20/60); ustalık Vex |
| Silah | Javelin | tam | Thrown (Range 30/120); ustalık Slow |
| Silah | Light Hammer | tam | Light, Thrown (Range 20/60); ustalık Nick |
| Silah | Mace | tam | ; ustalık Sap |
| Silah | Quarterstaff | tam | Versatile (1d8); ustalık Topple |
| Silah | Sickle | tam | Light; ustalık Nick |
| Silah | Spear | tam | Thrown (Range 20/60), Versatile (1d8); ustalık Sap |
| Silah | Dart | tam | Finesse, Thrown (Range 20/60); ustalık Vex |
| Silah | Light Crossbow | tam | Ammunition (Range 80/320; Bolt), Loading, Two-Handed; ustalık Slow |
| Silah | Shortbow | tam | Ammunition (Range 80/320; Arrow), Two-Handed; ustalık Vex |
| Silah | Sling | tam | Ammunition (Range 30/120; Bullet); ustalık Slow |
| Silah | Battleaxe | tam | Versatile (1d10); ustalık Topple |
| Silah | Flail | tam | ; ustalık Sap |
| Silah | Glaive | tam | Heavy, Reach, Two-Handed; ustalık Graze |
| Silah | Greataxe | tam | Heavy, Two-Handed; ustalık Cleave |
| Silah | Greatsword | tam | Heavy, Two-Handed; ustalık Graze |
| Silah | Halberd | tam | Heavy, Reach, Two-Handed; ustalık Cleave |
| Silah | Lance | tam | Heavy, Reach, Two-Handed (unless mounted); ustalık Topple |
| Silah | Longsword | tam | Versatile (1d10); ustalık Sap |
| Silah | Maul | tam | Heavy, Two-Handed; ustalık Topple |
| Silah | Morningstar | tam | ; ustalık Sap |
| Silah | Pike | tam | Heavy, Reach, Two-Handed; ustalık Push |
| Silah | Rapier | tam | Finesse; ustalık Vex |
| Silah | Scimitar | tam | Finesse, Light; ustalık Nick |
| Silah | Shortsword | tam | Finesse, Light; ustalık Vex |
| Silah | Trident | tam | Thrown (Range 20/60), Versatile (1d10); ustalık Topple |
| Silah | Warhammer | tam | Versatile (1d10); ustalık Push |
| Silah | War Pick | tam | Versatile (1d10); ustalık Sap |
| Silah | Whip | tam | Finesse, Reach; ustalık Slow |
| Silah | Blowgun | tam | Ammunition (Range 25/100; Needle), Loading; ustalık Vex |
| Silah | Hand Crossbow | tam | Ammunition (Range 30/120; Bolt), Light, Loading; ustalık Vex |
| Silah | Heavy Crossbow | tam | Ammunition (Range 100/400; Bolt), Heavy, Loading, Two-Handed; ustalık Push |
| Silah | Longbow | tam | Ammunition (Range 150/600; Arrow), Heavy, Two-Handed; ustalık Slow |
| Silah | Musket | tam | Ammunition (Range 40/120; Bullet), Loading, Two-Handed; ustalık Slow |
| Silah | Pistol | tam | Ammunition (Range 30/90; Bullet), Loading; ustalık Vex |
| Silah özelliği | Finesse | tam | motor (weapons.ts, hands.ts) |
| Silah özelliği | Versatile | tam | motor (weapons.ts, hands.ts) |
| Silah özelliği | Reach | tam | motor (weapons.ts, hands.ts) |
| Silah özelliği | Thrown | tam | motor (weapons.ts, hands.ts) |
| Silah özelliği | Loading | tam | Kuyruk 19, srdK19 (Heavy dezavantajı, eylem başına tek atış, cephane sayımı) |
| Silah özelliği | Heavy | tam | Kuyruk 19, srdK19 (Heavy dezavantajı, eylem başına tek atış, cephane sayımı) |
| Silah özelliği | Light | tam | motor (weapons.ts, hands.ts) |
| Silah özelliği | Ammunition | tam | Kuyruk 19, srdK19 (Heavy dezavantajı, eylem başına tek atış, cephane sayımı) |
| Silah özelliği | Two-Handed | tam | motor (weapons.ts, hands.ts) |
| Weapon Mastery | Cleave | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Graze | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Nick | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Push | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Sap | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Slow | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Topple | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Weapon Mastery | Vex | tam | src/battle/mastery.ts; hak sayısı sınıf tablosundan |
| Zırh | Padded Armor | tam | AC 11 + Dex modifier; STR —; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Leather Armor | tam | AC 11 + Dex modifier; STR —; Stealth —; eğitimsiz ceza |
| Zırh | Studded Leather Armor | tam | AC 12 + Dex modifier; STR —; Stealth —; eğitimsiz ceza |
| Zırh | Hide Armor | tam | AC 12 + Dex modifier (max 2); STR —; Stealth —; eğitimsiz ceza |
| Zırh | Chain Shirt | tam | AC 13 + Dex modifier (max 2); STR —; Stealth —; eğitimsiz ceza |
| Zırh | Scale Mail | tam | AC 14 + Dex modifier (max 2); STR —; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Breastplate | tam | AC 14 + Dex modifier (max 2); STR —; Stealth —; eğitimsiz ceza |
| Zırh | Half Plate Armor | tam | AC 15 + Dex modifier (max 2); STR —; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Ring Mail | tam | AC 14; STR —; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Chain Mail | tam | AC 16; STR Str 13; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Splint Armor | tam | AC 17; STR Str 15; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Plate Armor | tam | AC 18; STR Str 15; Stealth Disadvantage; eğitimsiz ceza |
| Zırh | Shield | tam | +2 AC; eğitimsizse AC yok |
| Maceracı eşyası | Acid | tam | savaşta kullanım: throw |
| Maceracı eşyası | Alchemist’s Fire | tam | savaşta kullanım: throw |
| Maceracı eşyası | Ammunition | savaş dışı | cephane savaşta sayılır (silah verisi, 20 adet) |
| Maceracı eşyası | Antitoxin | tam | savaşta kullanım: effect |
| Maceracı eşyası | Arcane Focus | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Backpack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Ball Bearings | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Barrel | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Basket | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Bedroll | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Bell | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Blanket | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Block and Tackle | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Book | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Bottle, Glass | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Bucket | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Burglar’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Caltrops | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Candle | tam | taşınırken etki |
| Maceracı eşyası | Case, Crossbow Bolt | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Case, Map or Scroll | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Chain | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Chest | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Climber’s Kit | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Clothes, Fine | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Clothes, Traveler’s | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Component Pouch | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Costume | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Crowbar | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Diplomat’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Druidic Focus | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Dungeoneer’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Entertainer’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Explorer’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Flask | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Grappling Hook | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Healer’s Kit | tam | taşınırken etki |
| Maceracı eşyası | Holy Symbol | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Holy Water | tam | savaşta kullanım: throw |
| Maceracı eşyası | Hunting Trap | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Ink | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Ink Pen | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Jug | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Ladder | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Lamp | tam | taşınırken etki |
| Maceracı eşyası | Lantern, Bullseye | tam | taşınırken etki |
| Maceracı eşyası | Lantern, Hooded | tam | taşınırken etki |
| Maceracı eşyası | Lock | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Magnifying Glass | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Manacles | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Map | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Mirror | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Net | tam | savaşta kullanım: throw |
| Maceracı eşyası | Oil | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Paper | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Parchment | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Perfume | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Poison, Basic | tam | savaşta kullanım: coat |
| Maceracı eşyası | Pole | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Pot, Iron | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Potion of Healing | tam | sihirli eşya olarak |
| Maceracı eşyası | Pouch | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Priest’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Quiver | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Ram, Portable | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Rations | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Robe | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Rope | savaş dışı | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Maceracı eşyası | Sack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Scholar’s Pack | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Shovel | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Signal Whistle | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Spell Scroll | tam | sihirli eşya olarak |
| Maceracı eşyası | Spikes, Iron | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Spyglass | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | String | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Tent | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Tinderbox | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Maceracı eşyası | Torch | tam | taşınırken etki |
| Maceracı eşyası | Vial | savaş dışı | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Maceracı eşyası | Waterskin | savaş dışı | keşif/yolculuk eşyası (hikâye) |
| Sihirli eşya | Adamantine Armor | tam | kalıcı etki |
| Sihirli eşya | Ammunition, +1, +2, or +3 (3 çeşit) | tam | büyülü bonus |
| Sihirli eşya | Ammunition of Slaying | tam | isabet eki |
| Sihirli eşya | Amulet of Health | tam | AC/save/yetenek |
| Sihirli eşya | Amulet of Proof against Detection and Location | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Amulet of the Planes | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Animated Shield | tam | kullanım: effect |
| Sihirli eşya | Apparatus of the Crab | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Armor, +1, +2, or +3 (3 çeşit) | tam | AC/save/yetenek |
| Sihirli eşya | Armor of Invulnerability | tam | kalıcı etki; kullanım: effect |
| Sihirli eşya | Armor of Resistance (13 çeşit) | tam | kalıcı etki |
| Sihirli eşya | Armor of Vulnerability (3 çeşit) | tam | kalıcı etki |
| Sihirli eşya | Arrow-Catching Shield | tam | kalıcı etki |
| Sihirli eşya | Bag of Beans | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Bag of Devouring | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Bag of Holding | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Bag of Tricks | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Bead of Force | tam | yüklü büyü: Resilient Sphere |
| Sihirli eşya | Bead of Nourishment | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Belt of Dwarvenkind | tam | kalıcı etki |
| Sihirli eşya | Belt of Giant Strength (6 çeşit) | tam | AC/save/yetenek |
| Sihirli eşya | Berserker Axe | tam | büyülü bonus |
| Sihirli eşya | Boots of Elvenkind | tam | kalıcı etki |
| Sihirli eşya | Boots of Levitation | tam | yüklü büyü: Levitate |
| Sihirli eşya | Boots of Speed | tam | kullanım: effect |
| Sihirli eşya | Boots of Striding and Springing | tam | kalıcı etki |
| Sihirli eşya | Boots of the Winterlands | tam | kalıcı etki |
| Sihirli eşya | Bowl of Commanding Water Elementals | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Bracers of Archery | tam | isabet eki |
| Sihirli eşya | Bracers of Defense | tam | AC/save/yetenek |
| Sihirli eşya | Brazier of Commanding Fire Elementals | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Brooch of Shielding | tam | kalıcı etki |
| Sihirli eşya | Broom of Flying | tam | kalıcı etki |
| Sihirli eşya | Candle of Invocation | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Cape of the Mountebank | tam | yüklü büyü: Dimension Door |
| Sihirli eşya | Carpet of Flying | tam | kalıcı etki |
| Sihirli eşya | Censer of Controlling Air Elementals | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Chime of Opening | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Circlet of Blasting | tam | yüklü büyü: Scorching Ray |
| Sihirli eşya | Cloak of Arachnida | tam | kalıcı etki; yüklü büyü: Web |
| Sihirli eşya | Cloak of Displacement | tam | kalıcı etki |
| Sihirli eşya | Cloak of Elvenkind | tam | kalıcı etki |
| Sihirli eşya | Cloak of Invisibility | tam | kullanım: effect |
| Sihirli eşya | Cloak of Protection | tam | AC/save/yetenek |
| Sihirli eşya | Cloak of the Bat | tam | kalıcı etki; yüklü büyü: Polymorph |
| Sihirli eşya | Cloak of the Manta Ray | tam | kalıcı etki |
| Sihirli eşya | Crystal Ball | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Crystal Ball of Mind Reading | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Crystal Ball of Telepathy | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Crystal Ball of True Seeing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Cube of Force | tam | yüklü büyü: Wall of Force |
| Sihirli eşya | Cubic Gate | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Dagger of Venom | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Dancing Sword | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Decanter of Endless Water | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Deck of Illusions | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Defender | tam | büyülü bonus |
| Sihirli eşya | Demon Armor | tam | isabet eki; AC/save/yetenek |
| Sihirli eşya | Dimensional Shackles | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Dragon Orb | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Dragon Scale Mail | tam | kalıcı etki; AC/save/yetenek |
| Sihirli eşya | Dragon Slayer | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Dust of Disappearance | tam | kullanım: effect |
| Sihirli eşya | Dust of Dryness | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Dust of Sneezing and Choking | tam | kullanım: throw |
| Sihirli eşya | Dwarven Plate | tam | AC/save/yetenek |
| Sihirli eşya | Dwarven Thrower | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Efficient Quiver | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Efreeti Bottle | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Elemental Gem | tam | yüklü büyü: Conjure Minor Elementals |
| Sihirli eşya | Elixir of Health | tam | kullanım: effect |
| Sihirli eşya | Elven Chain | tam | AC/save/yetenek |
| Sihirli eşya | Energy Bow | tam | büyülü bonus |
| Sihirli eşya | Eversmoking Bottle | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Eyes of Charming | tam | yüklü büyü: Charm Person |
| Sihirli eşya | Eyes of Minute Seeing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Eyes of the Eagle | tam | kalıcı etki |
| Sihirli eşya | Feather Token | tam | yüklü büyü: Feather Fall |
| Sihirli eşya | Figurine of Wondrous Power | savaş dışı | çağrılan yaratık Game Master tarafından eklenir (canavar listesinden) |
| Sihirli eşya | Flame Tongue | tam | kalıcı etki; isabet eki |
| Sihirli eşya | Folding Boat | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Frost Brand | tam | kalıcı etki; isabet eki |
| Sihirli eşya | Gauntlets of Ogre Power | tam | AC/save/yetenek |
| Sihirli eşya | Gem of Brightness | tam | yüklü büyü: Daylight |
| Sihirli eşya | Gem of Seeing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Giant Slayer | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Glamoured Studded Leather | tam | AC/save/yetenek |
| Sihirli eşya | Gloves of Missile Snaring | tam | kalıcı etki |
| Sihirli eşya | Gloves of Swimming and Climbing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Gloves of Thievery | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Goggles of Night | tam | kalıcı etki |
| Sihirli eşya | Hammer of Thunderbolts | tam | büyülü bonus; isabet eki; AC/save/yetenek |
| Sihirli eşya | Handy Haversack | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Hat of Disguise | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Hat of Many Spells | tam | büyülü bonus |
| Sihirli eşya | Headband of Intellect | tam | AC/save/yetenek |
| Sihirli eşya | Helm of Brilliance | tam | kalıcı etki; yüklü büyü: Daylight, Fireball, Wall of Fire |
| Sihirli eşya | Helm of Comprehending Languages | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Helm of Telepathy | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Helm of Teleportation | tam | yüklü büyü: Misty Step |
| Sihirli eşya | Holy Avenger | tam | kalıcı etki; büyülü bonus; isabet eki |
| Sihirli eşya | Horn of Blasting | tam | kullanım: throw |
| Sihirli eşya | Horn of Valhalla | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Horseshoes of a Zephyr | tam | kalıcı etki |
| Sihirli eşya | Horseshoes of Speed | tam | kalıcı etki |
| Sihirli eşya | Immovable Rod | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Instant Fortress | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Ioun Stone | tam | AC/save/yetenek |
| Sihirli eşya | Iron Bands | tam | kullanım: throw |
| Sihirli eşya | Iron Flask | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Javelin of Lightning | tam | isabet eki |
| Sihirli eşya | Lantern of Revealing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Luck Blade | tam | büyülü bonus; AC/save/yetenek |
| Sihirli eşya | Mace of Disruption | tam | kalıcı etki; isabet eki |
| Sihirli eşya | Mace of Smiting | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Mace of Terror | tam | yüklü büyü: Fear |
| Sihirli eşya | Mantle of Spell Resistance | tam | kalıcı etki |
| Sihirli eşya | Manual of Bodily Health | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Manual of Gainful Exercise | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Manual of Golems | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Manual of Quickness of Action | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Marvelous Pigments | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Medallion of Thoughts | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Mirror of Life Trapping | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Mithral Armor | tam | kalıcı etki |
| Sihirli eşya | Mysterious Deck | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Necklace of Adaptation | tam | kalıcı etki |
| Sihirli eşya | Necklace of Fireballs | tam | yüklü büyü: Fireball |
| Sihirli eşya | Necklace of Prayer Beads | tam | yüklü büyü: Bless, Cure Wounds, Lesser Restoration |
| Sihirli eşya | Nine Lives Stealer | tam | büyülü bonus |
| Sihirli eşya | Oathbow | tam | isabet eki |
| Sihirli eşya | Oil of Etherealness | tam | kullanım: effect |
| Sihirli eşya | Oil of Sharpness | tam | kullanım: effect |
| Sihirli eşya | Oil of Slipperiness | tam | kullanım: effect |
| Sihirli eşya | Pearl of Power | savaş dışı | Pearl of Power: bir slot geri (savaş dışı ayin değil: bonus eylem — Game Master notu) |
| Sihirli eşya | Periapt of Health | tam | kalıcı etki |
| Sihirli eşya | Periapt of Proof against Poison | tam | kalıcı etki |
| Sihirli eşya | Periapt of Wound Closure | tam | kalıcı etki |
| Sihirli eşya | Philter of Love | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Pipes of Haunting | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Pipes of the Sewers | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Plate Armor of Etherealness | tam | kullanım: effect |
| Sihirli eşya | Portable Hole | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Potion of Animal Friendship | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Potion of Clairvoyance | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Potion of Climbing | tam | kullanım: effect |
| Sihirli eşya | Potion of Diminution | tam | kullanım: effect |
| Sihirli eşya | Potion of Flying | tam | kullanım: effect |
| Sihirli eşya | Potion of Gaseous Form | tam | kullanım: effect |
| Sihirli eşya | Potion of Giant Strength (6 çeşit) | tam | kullanım: effect |
| Sihirli eşya | Potion of Growth | tam | kullanım: effect |
| Sihirli eşya | Potions of Healing (4 çeşit) | tam | kullanım: heal |
| Sihirli eşya | Potion of Heroism | tam | kullanım: effect |
| Sihirli eşya | Potion of Invisibility | tam | kullanım: effect |
| Sihirli eşya | Potion of Invulnerability | tam | kullanım: effect |
| Sihirli eşya | Potion of Longevity | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Potion of Mind Reading | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Potion of Poison | tam | kullanım: effect |
| Sihirli eşya | Potion of Resistance (13 çeşit) | tam | kullanım: effect |
| Sihirli eşya | Potion of Speed | tam | kullanım: effect |
| Sihirli eşya | Potion of Vitality | tam | kullanım: effect |
| Sihirli eşya | Potion of Water Breathing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Quarterstaff of the Acrobat | tam | büyülü bonus |
| Sihirli eşya | Ring of Animal Influence | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Ring of Djinni Summoning | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Ring of Elemental Command | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Ring of Evasion | tam | kalıcı etki |
| Sihirli eşya | Ring of Feather Falling | tam | kalıcı etki |
| Sihirli eşya | Ring of Free Action | tam | kalıcı etki |
| Sihirli eşya | Ring of Invisibility | tam | kullanım: effect |
| Sihirli eşya | Ring of Jumping | tam | yüklü büyü: Jump |
| Sihirli eşya | Ring of Mind Shielding | tam | kalıcı etki |
| Sihirli eşya | Ring of Protection | tam | AC/save/yetenek |
| Sihirli eşya | Ring of Regeneration | tam | kalıcı etki |
| Sihirli eşya | Ring of Resistance (13 çeşit) | tam | kalıcı etki |
| Sihirli eşya | Ring of Shooting Stars | tam | yüklü büyü: Faerie Fire, Dancing Lights |
| Sihirli eşya | Ring of Spell Storing | savaş dışı | dolduran büyücünün büyüleri; savaşta Game Master notu (büyü listesine eklenir) |
| Sihirli eşya | Ring of Spell Turning | tam | kalıcı etki |
| Sihirli eşya | Ring of Swimming | tam | kalıcı etki |
| Sihirli eşya | Ring of Telekinesis | tam | yüklü büyü: Telekinesis |
| Sihirli eşya | Ring of the Ram | tam | kullanım: throw |
| Sihirli eşya | Ring of Three Wishes | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Ring of Warmth | tam | kalıcı etki |
| Sihirli eşya | Ring of Water Walking | tam | kalıcı etki |
| Sihirli eşya | Ring of X-ray Vision | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Robe of Eyes | tam | kalıcı etki |
| Sihirli eşya | Robe of Scintillating Colors | tam | kullanım: effect |
| Sihirli eşya | Robe of Stars | tam | yüklü büyü: Magic Missile; AC/save/yetenek |
| Sihirli eşya | Robe of the Archmagi | tam | kalıcı etki; büyülü bonus; AC/save/yetenek |
| Sihirli eşya | Robe of Useful Items | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Rod of Absorption | savaş dışı | büyü emme (tepki); Counterspell benzeri: Game Master notu |
| Sihirli eşya | Rod of Alertness | tam | kalıcı etki |
| Sihirli eşya | Rod of Lordly Might | tam | büyülü bonus |
| Sihirli eşya | Rod of Resurrection | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Rod of Rulership | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Rod of Security | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Rope of Climbing | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Rope of Entanglement | tam | kullanım: throw |
| Sihirli eşya | Scarab of Protection | tam | kalıcı etki |
| Sihirli eşya | Scimitar of Speed | tam | büyülü bonus |
| Sihirli eşya | Sending Stones | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Sentinel Shield | tam | kalıcı etki |
| Sihirli eşya | Shield, +1, +2, or +3 (3 çeşit) | tam | AC/save/yetenek |
| Sihirli eşya | Shield of Missile Attraction | tam | kalıcı etki |
| Sihirli eşya | Shield of the Cavalier | tam | AC/save/yetenek |
| Sihirli eşya | Slippers of Spider Climbing | tam | kalıcı etki |
| Sihirli eşya | Sovereign Glue | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Spellguard Shield | tam | kalıcı etki |
| Sihirli eşya | Spell Scroll | savaş dışı | parşömen: içerdiği büyü envanterde adıyla (Game Master); büyü listesinden slotsuz |
| Sihirli eşya | Sphere of Annihilation | savaş dışı | Game Master nesnesi (2d10 × 4 force); oyuncu envanteri değil |
| Sihirli eşya | Staff of Charming | tam | yüklü büyü: Charm Person, Command, Comprehend Languages |
| Sihirli eşya | Staff of Fire | tam | kalıcı etki; yüklü büyü: Burning Hands, Fireball, Wall of Fire |
| Sihirli eşya | Staff of Frost | tam | kalıcı etki; yüklü büyü: Cone of Cold, Fog Cloud, Ice Storm |
| Sihirli eşya | Staff of Healing | tam | yüklü büyü: Cure Wounds, Lesser Restoration, Mass Cure Wounds |
| Sihirli eşya | Staff of Power | tam | büyülü bonus; yüklü büyü: Cone of Cold, Fireball, Hold Monster, Levitate, Lightning Bolt, Magic Missile, Ray of Enfeeblement, Wall of Force; AC/save/yetenek |
| Sihirli eşya | Staff of Striking | tam | büyülü bonus; isabet eki |
| Sihirli eşya | Staff of Swarming Insects | tam | yüklü büyü: Giant Insect, Insect Plague |
| Sihirli eşya | Staff of the Magi | tam | kalıcı etki; büyülü bonus; yüklü büyü: Fireball, Lightning Bolt, Ice Storm, Wall of Fire, Dispel Magic, Flaming Sphere, Web, Knock |
| Sihirli eşya | Staff of the Python | savaş dışı | yılana dönüşen asa: çağırma (Giant Constrictor Snake) — Game Master |
| Sihirli eşya | Staff of the Woodlands | tam | büyülü bonus; yüklü büyü: Barkskin, Speak with Animals, Pass without Trace, Speak with Plants, Animal Friendship |
| Sihirli eşya | Staff of Thunder and Lightning | tam | büyülü bonus; yüklü büyü: Lightning Bolt, Thunderwave |
| Sihirli eşya | Staff of Withering | tam | isabet eki |
| Sihirli eşya | Stone of Controlling Earth Elementals | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Stone of Good Luck (Luckstone) | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Sun Blade | tam | kalıcı etki; büyülü bonus; isabet eki |
| Sihirli eşya | Sword of Life Stealing | tam | isabet eki |
| Sihirli eşya | Sword of Sharpness | tam | isabet eki |
| Sihirli eşya | Sword of Wounding | tam | isabet eki |
| Sihirli eşya | Talisman of Pure Good | tam | büyülü bonus |
| Sihirli eşya | Talisman of the Sphere | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Talisman of Ultimate Evil | tam | büyülü bonus |
| Sihirli eşya | Thunderous Greatclub | tam | isabet eki; AC/save/yetenek |
| Sihirli eşya | Tome of Clear Thought | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Tome of Leadership and Influence | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Tome of Understanding | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Trident of Fish Command | tam | yüklü büyü: Dominate Beast |
| Sihirli eşya | Universal Solvent | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Vicious Weapon | tam | isabet eki |
| Sihirli eşya | Vorpal Sword | tam | büyülü bonus |
| Sihirli eşya | Wand of Binding | tam | yüklü büyü: Hold Monster, Hold Person |
| Sihirli eşya | Wand of Enemy Detection | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Wand of Fear | tam | yüklü büyü: Command, Fear |
| Sihirli eşya | Wand of Fireballs | tam | yüklü büyü: Fireball |
| Sihirli eşya | Wand of Lightning Bolts | tam | yüklü büyü: Lightning Bolt |
| Sihirli eşya | Wand of Magic Detection | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Wand of Magic Missiles | tam | yüklü büyü: Magic Missile |
| Sihirli eşya | Wand of Paralysis | tam | yüklü büyü: Hold Person |
| Sihirli eşya | Wand of Polymorph | tam | yüklü büyü: Polymorph |
| Sihirli eşya | Wand of Secrets | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Wand of the War Mage, +1, +2, or +3 (3 çeşit) | tam | büyülü bonus |
| Sihirli eşya | Wand of Web | tam | yüklü büyü: Web |
| Sihirli eşya | Wand of Wonder | tam | yüklü büyü: Fireball, Lightning Bolt, Slow, Faerie Fire |
| Sihirli eşya | Weapon, +1, +2, or +3 (3 çeşit) | tam | büyülü bonus |
| Sihirli eşya | Weapon of Warning | tam | kalıcı etki |
| Sihirli eşya | Well of Many Worlds | savaş dışı | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sihirli eşya | Wind Fan | tam | yüklü büyü: Gust of Wind |
| Sihirli eşya | Winged Boots | tam | kalıcı etki |
| Sihirli eşya | Wings of Flying | tam | kullanım: effect |
| Feat | Alert (Origin) | tam | Initiative Proficiency uygulanıyor. Kuyruk 19 (featuresK19): Initiative Swap — 1. turda, ikisi de sırasını oynamamışken gönüllü bir dostla inisiyatif değiş tokuşu (sıra dışı komut, |
| Feat | Magic Initiate (Origin) | tam | Görev G1, F1: geçmişten ya da seviye yuvasından (her seferinde farklı liste); iki cantrip + bir 1. seviye büyü her zaman hazır; uzun dinlenmede bir kez slotsuz (kaynak magic-initia |
| Feat | Savage Attacker (Origin) | tam | F1: turda bir kez silah isabetinde silahın hasar zarları iki kez atılır, yüksek olan kullanılır (SRD 'either roll'; düşüğü seçmenin yararı yok). İki atış da zar defterine yazılır |
| Feat | Skilled (Origin) | tam |  |
| Feat | Ability Score Improvement (General) | tam |  |
| Feat | Grappler (General) | tam | Kuyruk 19 (featuresK19): Punch and Grab (Attack eylemindeki Unarmed Strike isabetinde hasar + Grapple, turda bir kez; kendiliğinden), Attack Advantage (yakaladığına saldırı avantaj |
| Feat | Archery (Fighting Style) | tam |  |
| Feat | Defense (Fighting Style) | tam |  |
| Feat | Great Weapon Fighting (Fighting Style) | tam | İki elle tutulan yakın dövüş silahı (Two-Handed ya da kalkansız Versatile): silahın hasar zarındaki 1 ve 2, 3 sayılır |
| Feat | Two-Weapon Fighting (Fighting Style) | tam | Light ek saldırısının (yan el) hasarına yetenek değiştiricisi eklenir |
| Feat | Boon of Combat Prowess (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Peerless Aim: ıskalanan saldırı isabet olur (kendiliğinden; sonraki turunun başına dek bir, doğal 1 hariç). |
| Feat | Boon of Dimensional Travel (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Blink Steps: Attack ya da Magic eylemini kullandığı turda 30 ft ışınlanma (eylemsiz; sonraki turuna dek bir). |
| Feat | Boon of Fate (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Improve Fate: 60 ft içindeki dostun başarısız D20 Testine +2d4, düşmanın başarılı D20 Testine −2d4; yalnızca sonucu değiştirebilecekse kull |
| Feat | Boon of Irresistible Offense (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Overcome Defenses (B/P/S direnci yok sayılır) ve Overwhelming Strike (doğal 20'de artırılan skor kadar ek hasar). |
| Feat | Boon of Spell Recall (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Free Casting: 1–4. seviye slotla büyüde 1d4 slot seviyesine eşitse slot harcanmaz. |
| Feat | Boon of the Night Spirit (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): Merge with Shadows (loşta/karanlıkta bonus eylemle Invisible; eylem, bonus eylem ya da tepkiyle biter) ve Shadowy Form (loşta/karanlıkta Ps |
| Feat | Boon of Truesight (Epic Boon) | tam | Yetenek artışı. Kuyruk 19 (featuresK19): 60 ft Truesight (görünmezliği ve büyülü karanlığı görür). |
| Tür özelliği | Dragonborn: Draconic Ancestry | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dragonborn: Breath Weapon | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dragonborn: Damage Resistance | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dragonborn: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dragonborn: Draconic Flight | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dwarf: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dwarf: Dwarven Resilience | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dwarf: Dwarven Toughness | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Dwarf: Stonecunning | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Elf: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Elf: Elven Lineage | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Elf: Fey Ancestry | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Elf: Keen Senses | tam | oluşturucuda beceri seçimi |
| Tür özelliği | Elf: Trance | savaş dışı | uzun dinlenme kısalığı (hikâye) |
| Tür özelliği | Gnome: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Gnome: Gnomish Cunning | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Gnome: Gnomish Lineage | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Gnome: Forest Gnome | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Gnome: Rock Gnome | savaş dışı | saat işi aygıtlar (hikâye) |
| Tür özelliği | Goliath: Giant Ancestry | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Cloud’s Jaunt (Cloud Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Fire’s Burn (Fire Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Frost’s Chill (Frost Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Hill’s Tumble (Hill Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Stone’s Endurance (Stone Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Storm’s Thunder (Storm Giant) | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Large Form | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Goliath: Powerful Build | kapsam dışı | taşıma ×2 ev kuralı bekliyor (görevde bilinçli kapsam dışı) |
| Tür özelliği | Halfling: Brave | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Halfling: Halfling Nimbleness | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Halfling: Luck | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Halfling: Naturally Stealthy | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Human: Resourceful | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Human: Skillful | tam | oluşturucuda beceri |
| Tür özelliği | Human: Versatile | tam | oluşturucuda köken feat'i |
| Tür özelliği | Orc: Adrenaline Rush | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Orc: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Orc: Relentless Endurance | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Tiefling: Darkvision | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Tiefling: Fiendish Legacy | tam | motor (species.ts, lineage.ts, giant.ts, breath) |
| Tür özelliği | Tiefling: Otherworldly Presence | tam | Thaumaturgy cantrip'i |
| Geçmiş | Acolyte | tam | köken feat'i magic-initiate; beceriler Insight, Religion; araç Calligrapher’s Supplies |
| Geçmiş | Criminal | tam | köken feat'i alert; beceriler Sleight of Hand, Stealth; araç Thieves’ Tools |
| Geçmiş | Sage | tam | köken feat'i magic-initiate; beceriler Arcana, History; araç Calligrapher’s Supplies |
| Geçmiş | Soldier | tam | köken feat'i savage-attacker; beceriler Athletics, Intimidation; araç Choose one kind of Gaming Set (see “Equipment”) |
| Savaş kuralı | Durumlar (15) | tam | src/rules/conditions.ts, kural sürümü 2+ (Blinded…Unconscious); Exhaustion 5.2.1 (−2×d20, −5 ft×, 6'da ölüm) |
| Savaş kuralı | Concentration | tam | hasar save'i DC max(10, yarı), Incapacitated bitirir |
| Savaş kuralı | Opportunity Attack istisnaları | tam | Disengage, ışınlanma, zorla hareket, görmediği hedef |
| Savaş kuralı | Cover (yarım, üç çeyrek, tam) | tam | cover.ts; Kuyruk 19: eşya/özellik yarım siperi |
| Savaş kuralı | Grapple / Shove | tam | oyuncu yakalama (Kuyruk 19), Shove itme/Prone |
| Savaş kuralı | Two-Weapon Fighting | tam | Light ek saldırısı, Nick, TWF stili |
| Savaş kuralı | Mounted Combat | tam | Kuyruk 19 (srdK19): bin/in (hızın yarısı), binici bineğiyle taşınır, binek düşünce DEX DC 10; bağımsız binek |
| Savaş kuralı | Underwater Combat | tam | yakın dövüş dezavantajı (piercing ve yüzme hızı istisna), menzilli dezavantaj ve menzil ötesi ıska; Kuyruk 19: su altındakine ateş direnci |
| Canavar yeteneği | Boyut (çok altıgen) (156) | tam | multiHex bayrağı (Görev A6) |
| Canavar yeteneği | Hız (107) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Duyu (101) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Multiattack (bileşim, yerine geçen, ek kullanım) (96) | tam | data/multiattack.json |
| Canavar yeteneği | Durum bağışıklığı (75) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Spellcasting (47) | tam | data/canavar-buyuleri.json (6.+ seviye büyüler görev 3+6 ile) |
| Canavar yeteneği | Magic Resistance (34) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Legendary Resistance (32) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Amphibious (31) | savaş dışı | nefes alma (savaşta boğulma yok) |
| Canavar yeteneği | Legendary Actions (30) | tam | data/efsanevi.json |
| Canavar yeteneği | Hız: Burrow (21) | tam | yer altından: yaratıkların altından geçer, zorlu arazi yok |
| Canavar yeteneği | Sabit hasar (21) | tam | savaş başında SRD sabit değeri (monsterAbilities.ts) |
| Canavar yeteneği | Hover (16) | savaş dışı | uçan yaratık düşmez (motor uçuşta düşürmez) |
| Canavar yeteneği | Spider Climb (14) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Shape-Shift (13) | savaş dışı | biçim değişimi yalnız görünüm/hız (stat bloğu aynı) |
| Canavar yeteneği | Water Breathing (9) | savaş dışı | nefes alma |
| Canavar yeteneği | Tepki: Parry (7) | tam | monster-reactions.json |
| Canavar yeteneği | Flyby (7) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Swarm (7) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Diabolical Restoration (7) | savaş dışı | günler sonra başka düzlemde dirilme |
| Canavar yeteneği | Bonus eylem: Divine Aid (6) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Hold Breath (6) | savaş dışı | nefes alma |
| Canavar yeteneği | Web Walker (5) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Sunlight Sensitivity (5) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Death Burst (5) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Illumination (5) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Bonus eylem: Leap (5) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Demonic Restoration (5) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Ice Walk (4) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Incorporeal Movement (4) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Siege Monster (4) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Fire Aura (4) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Immutable Form (4) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Swallow (4) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Amorphous (4) | savaş dışı | 1 inçlik aralıktan geçme (altıgen haritada dar geçit yok) |
| Canavar yeteneği | 1/Day saldırıları (3) | tam | savaşta bir kez (şarj olmaz) |
| Canavar yeteneği | Eylem: Invisibility (3) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Coven Magic (3) | savaş dışı | kehanet/keşif büyüleri (savaş dışı) |
| Canavar yeteneği | Bonus eylem: Trample (3) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Misty Step (3) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Protective Magic (3) | tam | monster-reactions.json |
| Canavar yeteneği | Exalted Restoration (3) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Bonus eylem: Teleport (3) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Standing Leap (3) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Charge (2) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Spellcasting alan şekli (2) | tam | büyüler motorun alan şekilleriyle |
| Canavar yeteneği | Mimicry (2) | savaş dışı | ses taklidi (hikâye) |
| Canavar yeteneği | Bonus eylem: Rampage (2) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Abduct (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Running Leap (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Cunning Action (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Tunneler (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Deathless Agility (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Ethereal Sight (2) | savaş dışı | Ethereal düzlemi görme (harita tek düzlem) |
| Canavar yeteneği | Air Form (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Earth Glide (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Petrifying Gaze (2) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Fiendish Restoration (2) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Elemental Restoration (2) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Wishes (2) | savaş dışı | Wish (hikâye) |
| Canavar yeteneği | Inscrutable (2) | savaş dışı | zihin okunamaz (hikâye) |
| Canavar yeteneği | Divine Awareness (2) | savaş dışı | yalanı sezme |
| Canavar yeteneği | Agile (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Tepki: Ink Cloud (2) | yok | açık iş |
| Canavar yeteneği | Saldırı yok (2) | savaş dışı | basit vuruş eklendi (savaş dışı yaratık) |
| Canavar yeteneği | Bloodied Fury (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Eylem: Swallow (2) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Corrosive Form (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Stench (2) | tam | monsterTraits.ts / önceki kuyruklar |
| Canavar yeteneği | Tepki: Split (2) | tam | monsterAbilities.ts |
| Canavar yeteneği | Berserk (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Lightning Absorption (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Vampire Weakness (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Forbiddance (2) | savaş dışı | davetsiz eve giremez |
| Canavar yeteneği | Running Water (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Stake to the Heart (2) | savaş dışı | kalbe kazık (hikâye, Game Master) |
| Canavar yeteneği | Sunlight (2) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Loathsome Limbs (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Telepathic Bond (1) | savaş dışı | telepati (hikâye) |
| Canavar yeteneği | Blurred Form (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Eylem: Darkness Aura (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Eylem: Sleep (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Eylem: Fog Cloud (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Speak with Beasts and Plants (1) | savaş dışı | iletişim |
| Canavar yeteneği | Bonus eylem: Tree Stride (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Redirect Attack (1) | yok | açık iş |
| Canavar yeteneği | Tepki: Burst of Ingenuity (1) | yok | açık iş |
| Canavar yeteneği | Bonus eylem: Trampling Charge (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Reel (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Aberrant Ground (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Gibbering (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Vile Appearance (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Illusory Appearance (1) | savaş dışı | Disguise Self (savaş dışı) |
| Canavar yeteneği | Ephemeral (1) | savaş dışı | eşya taşıyamaz |
| Canavar yeteneği | Bonus eylem: Consume Life (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Vanish (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Quick Grapple (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Read Thoughts (1) | savaş dışı | Detect Thoughts (savaş dışı) |
| Canavar yeteneği | Aura of Authority (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Confer Fire Resistance (1) | savaş dışı | binek bineğe direnç (binicilik `mounted.ts`; nightmare binek değil) |
| Canavar yeteneği | Eylem: Ethereal Stride (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Vampiric Connection (1) | savaş dışı | telepati |
| Canavar yeteneği | Shielded Mind (1) | savaş dışı | zihin okunamaz |
| Canavar yeteneği | Eylem: Etherealness (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Succubus Form (1) | savaş dışı | uzun dinlenmede biçim |
| Canavar yeteneği | Bonus eylem: Nightmare (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Incubus Form (1) | savaş dışı | uzun dinlenmede biçim |
| Canavar yeteneği | Eylem: Charm (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Prowl (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Barbed Hide (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Draconic Origin (1) | savaş dışı | Game Master seçimi (veride tür) |
| Canavar yeteneği | Eylem: Create Specter (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Magic of the Spider Queen (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Trait: Invisibility (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Captain’s Charm (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Riposte (1) | tam | monster-reactions.json |
| Canavar yeteneği | Bonus eylem: Invisibility (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Deflect Missile (1) | yok | açık iş |
| Canavar yeteneği | Evasion (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Tepki: Unnerving Gaze (1) | tam | monster-reactions.json |
| Canavar yeteneği | Light Sensitivity (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Moan (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Phantasms (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: War Cry (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Eylem: Animate Trees (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Eldritch Restoration (1) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Mucus Cloud (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Probing Telepathy (1) | savaş dışı | telepati |
| Canavar yeteneği | N/Day saldırıları (1) | tam | savaşta N kez |
| Canavar yeteneği | Celestial Restoration (1) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Bonus eylem: Slow (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Eylem: Storm Bolt (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Swoop (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Magic Rope (1) | savaş dışı | ip nesnesi (Entangling Rope saldırısı veride) |
| Canavar yeteneği | Eylem: Teleport (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Horror Nimbus (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Pursuit (1) | yok | açık iş |
| Canavar yeteneği | Greater Magic Resistance (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Eylem: Ice Wall (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Undead Restoration (1) | savaş dışı | 24 saat sonra dirilme |
| Canavar yeteneği | Tepki: Whirlwind of Sand (1) | yok | açık iş |
| Canavar yeteneği | Fire Absorption (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Roar (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Death Throes (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Fear Aura (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Spirit Jar (1) | savaş dışı | günler sonra dirilme |
| Canavar yeteneği | Reflective Carapace (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Jumper (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Training (1) | savaş dışı | beceri (keşif) |
| Canavar yeteneği | Hellish Restoration (1) | savaş dışı | Cehennem’de günler sonra dirilme |
| Canavar yeteneği | Compression (1) | savaş dışı | 1 inçlik aralık (dar geçit yok) |
| Canavar yeteneği | Eylem: Bubble Dash (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Tepki: Shriek (1) | savaş dışı | uyarı sesi (harita alarmına bağlı değil; hikâye) |
| Canavar yeteneği | Beast of Burden (1) | savaş dışı | taşıma kapasitesi |
| Canavar yeteneği | Bonus eylem: Bubble Dash (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Ignited Illumination (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Iron Scent (1) | savaş dışı | metal sezme (keşif) |
| Canavar yeteneği | Destroy Metal (1) | savaş dışı | giyilmeyen metal nesne (savaş dışı) |
| Canavar yeteneği | Tepki: Reflexive Antennae (1) | yok | açık iş |
| Canavar yeteneği | Blood Frenzy (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Limited Amphibiousness (1) | savaş dışı | nefes alma (4 saatte bir) |
| Canavar yeteneği | Shark Telepathy (1) | savaş dışı | telepatiyle köpekbalığı yönetme (hikâye) |
| Canavar yeteneği | Bonus eylem: Aquatic Charge (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Sunlight Weakness (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Shadow Stealth (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Troll Spawn (1) | savaş dışı | 24 saat sonra trol olma |
| Canavar yeteneği | Bloodied Frenzy (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Spiritual Weapon (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Ooze Cube (1) | savaş dışı | Engulf saldırısı veride |
| Canavar yeteneği | Transparent (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Adhesive (1) | savaş dışı | yalnızca nesne biçiminde (pusu; keşif) |
| Canavar yeteneği | Bonus eylem: Ethereal Jaunt (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Sense Magic (1) | savaş dışı | büyü sezme (keşif) |
| Canavar yeteneği | Fire Form (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Water Susceptibility (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Aversion to Fire (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Soul Bag (1) | savaş dışı | Nightmare Haunting (savaş dışı) |
| Canavar yeteneği | Nightmare Haunting (1) | savaş dışı | Dream (savaş dışı) |
| Canavar yeteneği | Eylem: Reel (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Bonus eylem: Unicorn’s Blessing (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Freeze (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Water Form (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Treasure Sense (1) | savaş dışı | hazine sezme (keşif) |
| Canavar yeteneği | Bound (1) | savaş dışı | muska bağı (hikâye) |
| Canavar yeteneği | Spell Storing (1) | savaş dışı | muska sahibinin büyü saklaması (kurulum) |
| Canavar yeteneği | Tepki: Protection (1) | yok | açık iş |
| Canavar yeteneği | Multiple Heads (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Reactive Heads (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Acid Absorption (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Hasten (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Heat Aura (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Misty Escape (1) | tam | monsterAbilities.ts (pasif) |
| Canavar yeteneği | Bonus eylem: Charm (1) | tam | monster_ability / Spellcasting |
| Canavar yeteneği | Reactive (1) | tam | monsterAbilities.ts (pasif) |
