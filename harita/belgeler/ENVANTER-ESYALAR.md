# Envanter: eşyalar

> A0 envanter denetimi (2026-11-05, dal `wip/a0`, kural sürümü 27). Salt-okunur: oyun kodu, veri ve testler değişmedi. Yoklama betikleri repo dışında çalıştırıldı (aşağıda "Yöntem").

## Yöntem

- **Veri:** `data/items-srd.json` (376) (denetlenen; `data/items.json` elle eklenen 23 kayıt bu tabloda yok, iksirleri `use` ile çalışır). Alanlar: `passive`, `use`, `spells`/`charges`, `bonus`, `onHit`, `effects` (AC), `offCombat`.
- **Kod:** savaş girişi `src/battle/create.ts` (`itemParts`, `src/battle/itemEffects.ts`; `srdK19` anahtarı), sarf eşyası `src/battle/items.ts` (`use_item`, arayüz `MapBattle.tsx` "Eşya" menüsü). Etki anahtarlarının hepsi motor kodunda okunuyor (ölü anahtar yok).
- **Savaş yoklaması:** her eşya tek başına 5. seviye Fighter (Longsword + Longbow, Chain Mail, kalkan) ve Wizard karakterine verildi; savaşçıda AC, etki, isabet eki, kaynak, sarf, silah seçenekleri, save/DC değişiyor mu.
- 199 "effects boş ve offCombat değil" kaydının hepsinde etki başka alanda (`passive`, `use`, `bonus`, `onHit`, `spells`): savaşçıya geçiyor.

## Özet

| Sınıf | Sayı |
|---|---|
| ÇALIŞIR | 212 |
| KISMİ | 11 |
| YOK | 8 |
| SAVAŞ DIŞI | 145 |
| **Toplam** | 376 |

### Kategori × sınıf

Kategori ad kalıbından (potion/oil/elixir → iksir, ring → yüzük, staff → asa, wand/rod → değnek, cloak/robe → pelerin, armor/shield → zırh, silah adları → silah).

| Kategori | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Toplam |
|---|---|---|---|---|---|
| iksir | 34 | 0 | 0 | 6 | 40 |
| yüzük | 27 | 0 | 0 | 6 | 33 |
| silah | 19 | 4 | 0 | 2 | 25 |
| zırh/kalkan | 36 | 0 | 0 | 0 | 36 |
| asa | 10 | 1 | 1 | 0 | 12 |
| değnek | 11 | 1 | 4 | 4 | 20 |
| pelerin | 11 | 0 | 0 | 2 | 13 |
| tüketilebilir | 9 | 0 | 0 | 5 | 14 |
| diğer | 55 | 5 | 3 | 120 | 183 |

## Boşluklar

- **Sarf eşyası YZ:** `use_item` yalnız oyuncu arayüzünde; yapay zekâ iksir/yağ/el bombası kullanmaz (CLAUDE.md "Yapay zekâ kullanmaz"). Etki: düşman ve YZ’li dostlar iksir taşısa da içmez. İş: küçük (YZ’de "yarı canın altında iksir" kuralı).
- **Yalnız +X olan özel silahlar (11):** Berserker Axe, Defender, Energy Bow, Hat of Many Spells, Nine Lives Stealer, Quarterstaff of the Acrobat, Rod of Lordly Might, Scimitar of Speed, Talisman of Pure Good, Talisman of Ultimate Evil, Vorpal Sword. SRD özel yetenekleri (Vorpal kafa kesme, Defender AC aktarımı, Scimitar of Speed bonus saldırı, Nine Lives Stealer anında öldürme, Berserker lanet…) yok. İş: orta (her biri ayrı kanca; `imzaHit` benzeri eşya saldırı kancası).
- **Savaşta anlamlı, savaş dışı işaretli:** Bag of Tricks: çağırma (R3 summons) — küçük/orta; Figurine of Wondrous Power: çağırma; şu an Game Master canavar ekler — orta; Horn of Valhalla: çağırma (berserker) — orta; Rod of Absorption: tepki büyü emme (Counterspell yolu) — orta; Staff of the Python: çağırma (Giant Constrictor Snake) — küçük; Immovable Rod: K53 geçici engel (sabit nesne) — küçük; Wand of Enemy Detection: gizli düşman bulma (Ara) — küçük; Rod of Resurrection: diriltme (revive) — küçük.
- **Kategori eşlemesi:** `src/rules/itemCategory.ts` görünüm kategorisi; savaş etkisini değiştirmez.

## Bütün eşyalar

| Eşya | Kategori | Sınıf | Neden |
|---|---|---|---|
| Quarterstaff of the Acrobat | asa | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Staff of Charming | asa | ÇALIŞIR | savaşçıya geçiyor: spells |
| Staff of Fire | asa | ÇALIŞIR | savaşçıya geçiyor: passive, spells |
| Staff of Frost | asa | ÇALIŞIR | savaşçıya geçiyor: passive, spells |
| Staff of Power | asa | ÇALIŞIR | savaşçıya geçiyor: spells, bonus, effects |
| Staff of Striking | asa | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Staff of Swarming Insects | asa | ÇALIŞIR | savaşçıya geçiyor: spells |
| Staff of Thunder and Lightning | asa | ÇALIŞIR | savaşçıya geçiyor: spells, bonus |
| Staff of Withering | asa | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Staff of the Magi | asa | ÇALIŞIR | savaşçıya geçiyor: passive, spells, bonus |
| Staff of the Python | asa | YOK | savaşta anlamlı: çağırma (Giant Constrictor Snake) — küçük |
| Staff of the Woodlands | asa | ÇALIŞIR | savaşçıya geçiyor: spells, bonus |
| Immovable Rod | değnek | YOK | savaşta anlamlı: K53 geçici engel (sabit nesne) — küçük |
| Rod of Absorption | değnek | YOK | savaşta anlamlı: tepki büyü emme (Counterspell yolu) — orta |
| Rod of Alertness | değnek | ÇALIŞIR | savaşçıya geçiyor: passive |
| Rod of Lordly Might | değnek | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Rod of Resurrection | değnek | YOK | savaşta anlamlı: diriltme (revive) — küçük |
| Rod of Rulership | değnek | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Rod of Security | değnek | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Wand of Binding | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Enemy Detection | değnek | YOK | savaşta anlamlı: gizli düşman bulma (Ara) — küçük |
| Wand of Fear | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Lightning Bolts | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Magic Detection | değnek | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Wand of Paralysis | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Polymorph | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Secrets | değnek | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Wand of Web | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of Wonder | değnek | ÇALIŞIR | savaşçıya geçiyor: spells |
| Wand of the War Mage, +1 | değnek | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Wand of the War Mage, +2 | değnek | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Wand of the War Mage, +3 | değnek | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Amulet of Proof against Detection and Location | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Amulet of the Planes | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Apparatus of the Crab | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Arcane Focus | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Backpack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Bag of Beans | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Bag of Devouring | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Bag of Tricks | diğer | YOK | savaşta anlamlı: çağırma (R3 summons) — küçük/orta |
| Ball Bearings | diğer | SAVAŞ DIŞI | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Barrel | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Basic Poison | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Basket | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Bedroll | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Bell | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Belt of Cloud Giant Strength | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Belt of Dwarvenkind | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Belt of Fire Giant Strength | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Belt of Frost Giant Strength | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Belt of Stone Giant Strength | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Belt of Storm Giant Strength | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Blanket | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Block and Tackle | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Book | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Boots of Elvenkind | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Boots of Levitation | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Boots of Striding and Springing | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Boots of the Winterlands | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Bottle, Glass | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Bracers of Archery | diğer | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Brazier of Commanding Fire Elementals | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Broom of Flying | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Bucket | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Bullseye Lantern | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Burglar’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Caltrops | diğer | SAVAŞ DIŞI | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Candle | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Candle of Invocation | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Carpet of Flying | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Censer of Controlling Air Elementals | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Chain | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Chest | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Chime of Opening | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Circlet of Blasting | diğer | ÇALIŞIR | savaşçıya geçiyor: spells, attack |
| Climber’s Kit | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Clothes, Fine | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Clothes, Traveler’s | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Component Pouch | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Costume | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Crowbar | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Crystal Ball | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Crystal Ball of Mind Reading | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Crystal Ball of Telepathy | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Crystal Ball of True Seeing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Cube of Force | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Cubic Gate | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Decanter of Endless Water | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Deck of Illusions | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Defender | diğer | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Dimensional Shackles | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Diplomat’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Dragon Orb | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Dragon Slayer | diğer | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Druidic Focus | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Dungeoneer’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Dwarven Thrower | diğer | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Efficient Quiver | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Efreeti Bottle | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Elemental Gem | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Elven Chain | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Entertainer’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Eversmoking Bottle | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Explorer’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Eyes of Charming | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Eyes of Minute Seeing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Eyes of the Eagle | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Feather Token | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Figurine of Wondrous Power | diğer | YOK | savaşta anlamlı: çağırma; şu an Game Master canavar ekler — orta |
| Flame Tongue | diğer | ÇALIŞIR | savaşçıya geçiyor: passive, onHit |
| Flask | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Folding Boat | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Frost Brand | diğer | ÇALIŞIR | savaşçıya geçiyor: passive, onHit |
| Gem of Brightness | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Gem of Seeing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Giant Slayer | diğer | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Glamoured Studded Leather | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Gloves of Missile Snaring | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Gloves of Swimming and Climbing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Gloves of Thievery | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Goggles of Night | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Grappling Hook | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Handy Haversack | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Hat of Disguise | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Hat of Many Spells | diğer | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Helm of Brilliance | diğer | ÇALIŞIR | savaşçıya geçiyor: passive, spells |
| Helm of Comprehending Languages | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Helm of Telepathy | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Helm of Teleportation | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Holy Avenger | diğer | ÇALIŞIR | savaşçıya geçiyor: passive, bonus, onHit |
| Holy Symbol | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Hooded Lantern | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Horn of Blasting | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Horn of Valhalla | diğer | YOK | savaşta anlamlı: çağırma (berserker) — orta |
| Horseshoes of Speed | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Horseshoes of a Zephyr | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Hunting Trap | diğer | SAVAŞ DIŞI | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Ink | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Ink Pen | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Instant Fortress | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ioun Stone | diğer | ÇALIŞIR | savaşçıya geçiyor: effects |
| Iron Bands | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Iron Flask | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Jug | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Ladder | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Lamp | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Lantern of Revealing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Lock | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Magnifying Glass | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Manacles | diğer | SAVAŞ DIŞI | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Manual of Bodily Health | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Manual of Gainful Exercise | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Manual of Golems | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Manual of Quickness of Action | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Map | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Marvelous Pigments | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Medallion of Thoughts | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Mirror | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Mirror of Life Trapping | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Mysterious Deck | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Necklace of Adaptation | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Net | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Nine Lives Stealer | diğer | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Oil | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Paper | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Parchment | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Pearl of Power | diğer | SAVAŞ DIŞI | Pearl of Power: bir slot geri (savaş dışı ayin değil: bonus eylem — Game Master notu) |
| Perfume | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Periapt of Health | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Periapt of Proof against Poison | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Periapt of Wound Closure | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Pipes of Haunting | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Pipes of the Sewers | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Pole | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Portable Hole | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Pot, Iron | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Pouch | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Priest’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Quiver | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Ram, Portable | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Rations | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Rope | diğer | SAVAŞ DIŞI | Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz |
| Rope of Climbing | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Rope of Entanglement | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Sack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Scarab of Protection | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Scholar’s Pack | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Sending Stones | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Shovel | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Signal Whistle | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Slippers of Spider Climbing | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Sovereign Glue | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Sphere of Annihilation | diğer | SAVAŞ DIŞI | Game Master nesnesi (2d10 × 4 force); oyuncu envanteri değil |
| Spikes, Iron | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Spyglass | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Stone of Controlling Earth Elementals | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Stone of Good Luck (Luckstone) | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| String | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Talisman of Pure Good | diğer | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Talisman of Ultimate Evil | diğer | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Talisman of the Sphere | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Tent | diğer | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Thunderous Greatclub | diğer | ÇALIŞIR | savaşçıya geçiyor: onHit, effects |
| Tinderbox | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Tome of Clear Thought | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Tome of Leadership and Influence | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Tome of Understanding | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Torch | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Universal Solvent | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Vial | diğer | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Waterskin | diğer | SAVAŞ DIŞI | keşif/yolculuk eşyası (hikâye) |
| Well of Many Worlds | diğer | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Wind Fan | diğer | ÇALIŞIR | savaşçıya geçiyor: spells |
| Winged Boots | diğer | ÇALIŞIR | savaşçıya geçiyor: passive |
| Wings of Flying | diğer | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Elixir of Health | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Oil of Etherealness | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Oil of Sharpness | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Oil of Slipperiness | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Philter of Love | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Potion of Animal Friendship | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Potion of Clairvoyance | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Potion of Climbing | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Cloud Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Diminution | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Fire Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Flying | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Frost Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Gaseous Form | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Growth | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Heroism | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Hill Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Invisibility | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Invulnerability | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Longevity | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Potion of Mind Reading | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Potion of Poison | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (acid) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (bludgeoning) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (cold) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (fire) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (force) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (lightning) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (necrotic) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (piercing) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (poison) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (psychic) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (radiant) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (slashing) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Resistance (thunder) | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Speed | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Stone Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Storm Giant Strength | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Vitality | iksir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Potion of Water Breathing | iksir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Cape of the Mountebank | pelerin | ÇALIŞIR | savaşçıya geçiyor: spells |
| Cloak of Arachnida | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive, spells |
| Cloak of Elvenkind | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive |
| Cloak of Invisibility | pelerin | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Cloak of the Bat | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive, spells |
| Cloak of the Manta Ray | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive |
| Mantle of Spell Resistance | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive |
| Robe | pelerin | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Robe of Eyes | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive |
| Robe of Scintillating Colors | pelerin | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Robe of Stars | pelerin | ÇALIŞIR | savaşçıya geçiyor: spells, effects |
| Robe of Useful Items | pelerin | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Robe of the Archmagi | pelerin | ÇALIŞIR | savaşçıya geçiyor: passive, bonus, effects |
| Berserker Axe | silah | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Bowl of Commanding Water Elementals | silah | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Case, Crossbow Bolt | silah | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Dagger of Venom | silah | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Dancing Sword | silah | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Energy Bow | silah | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Hammer of Thunderbolts | silah | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit, effects |
| Javelin of Lightning | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Luck Blade | silah | ÇALIŞIR | savaşçıya geçiyor: bonus, effects |
| Mace of Disruption | silah | ÇALIŞIR | savaşçıya geçiyor: passive, onHit |
| Mace of Smiting | silah | ÇALIŞIR | savaşçıya geçiyor: bonus, onHit |
| Mace of Terror | silah | ÇALIŞIR | savaşçıya geçiyor: spells |
| Oathbow | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Scimitar of Speed | silah | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Sun Blade | silah | ÇALIŞIR | savaşçıya geçiyor: passive, bonus, onHit |
| Sword of Life Stealing | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Sword of Sharpness | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Sword of Wounding | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Trident of Fish Command | silah | ÇALIŞIR | savaşçıya geçiyor: spells |
| Vicious Weapon | silah | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Vorpal Sword | silah | KISMİ | yalnız +X saldırı/hasar; SRD özel yeteneği yok |
| Weapon of Warning | silah | ÇALIŞIR | savaşçıya geçiyor: passive |
| Weapon, +1 | silah | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Weapon, +2 | silah | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Weapon, +3 | silah | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Ammunition | tüketilebilir | SAVAŞ DIŞI | sıradan donanım (adı harita nesnesiyle çakışıyor; envanterden savaşa girmez) |
| Ammunition of Slaying | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: onHit |
| Ammunition, +1 | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Ammunition, +2 | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Ammunition, +3 | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: bonus |
| Bead of Force | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: spells |
| Bead of Nourishment | tüketilebilir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Case, Map or Scroll | tüketilebilir | SAVAŞ DIŞI | kap/giysi/araç; savaşta mekanik karşılığı yok |
| Dust of Disappearance | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Dust of Dryness | tüketilebilir | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Dust of Sneezing and Choking | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Necklace of Fireballs | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: spells |
| Necklace of Prayer Beads | tüketilebilir | ÇALIŞIR | savaşçıya geçiyor: spells |
| Spell Scroll | tüketilebilir | SAVAŞ DIŞI | parşömen: içerdiği büyü envanterde adıyla (Game Master); büyü listesinden slotsuz |
| Ring of Animal Influence | yüzük | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ring of Djinni Summoning | yüzük | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ring of Elemental Command | yüzük | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ring of Evasion | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Feather Falling | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Free Action | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Invisibility | yüzük | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Ring of Jumping | yüzük | ÇALIŞIR | savaşçıya geçiyor: spells |
| Ring of Mind Shielding | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Regeneration | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (acid) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (bludgeoning) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (cold) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (fire) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (force) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (lightning) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (necrotic) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (piercing) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (poison) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (psychic) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (radiant) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (slashing) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Resistance (thunder) | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Shooting Stars | yüzük | ÇALIŞIR | savaşçıya geçiyor: spells |
| Ring of Spell Storing | yüzük | SAVAŞ DIŞI | dolduran büyücünün büyüleri; savaşta Game Master notu (büyü listesine eklenir) |
| Ring of Spell Turning | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Swimming | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Telekinesis | yüzük | ÇALIŞIR | savaşçıya geçiyor: spells |
| Ring of Three Wishes | yüzük | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ring of Warmth | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of Water Walking | yüzük | ÇALIŞIR | savaşçıya geçiyor: passive |
| Ring of X-ray Vision | yüzük | SAVAŞ DIŞI | savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |
| Ring of the Ram | yüzük | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Adamantine Armor | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Animated Shield | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Armor of Invulnerability | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive, use (use_item; YZ kullanmaz) |
| Armor of Resistance (acid) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (bludgeoning) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (cold) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (fire) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (force) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (lightning) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (necrotic) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (piercing) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (poison) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (psychic) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (radiant) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (slashing) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Resistance (thunder) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Vulnerability (bludgeoning) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Vulnerability (piercing) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor of Vulnerability (slashing) | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Armor, +1 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Armor, +2 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Armor, +3 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Arrow-Catching Shield | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Brooch of Shielding | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Demon Armor | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: onHit, effects |
| Dragon Scale Mail | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive, effects |
| Dwarven Plate | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Mithral Armor | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Plate Armor of Etherealness | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: use (use_item; YZ kullanmaz) |
| Sentinel Shield | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Shield of Missile Attraction | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
| Shield of the Cavalier | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Shield, +1 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Shield, +2 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Shield, +3 | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: effects |
| Spellguard Shield | zırh/kalkan | ÇALIŞIR | savaşçıya geçiyor: passive |
