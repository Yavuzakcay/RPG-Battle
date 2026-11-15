# NA1: nesne türü tablosu (ağırlık ve taşıma)

Üretim: `node scripts/na1-nesne-tablo.mjs` (veri: `data/nesneler.json` `agirlikLb`, `data/nesne-agirlik.json`). Ağırlıklar SRD değerlerine yakın makul sayılardır; SRD nesne ağırlığı vermeyen türlerde (varil, heykel…) gerçek dünya karşılığı. Kapasite = STR × 15 lb (Orta boy); "kaç kişi" STR 10 (150 lb) ve STR 16 (240 lb) için. Ağırlık sınıfı: hafif ≤ 50 lb, orta ≤ 150 lb, üstü ağır (itme çarpanı ve fırlatma menzili sınıf/ağırlıktan).

| Kimlik | TR ad | EN ad | Sprite | Taşınabilir (al) | İtilir/fırlatılır | Ağırlık (lb) | Sınıf | Kaç kişi (STR 10 / 16) | SRD |
|---|---|---|---|---|---|---|---|---|---|
| `oilBarrel` | Yağ fıçısı | Oil barrel | var | hayır | evet | 120 | orta | — |  |
| `powderKeg` | Barut fıçısı | Powder keg | var | hayır | evet | 40 | hafif | — |  |
| `chest` | Sandık | Chest | yok | evet | evet | 25 | hafif | 1 / 1 |  |
| `table` | Masa | Table | yok | hayır | evet | 60 | orta | — |  |
| `door` | Kapı | Door | yok | hayır | hayır | — | — | — |  |
| `gate` | Kale kapısı | Castle gate | yok | hayır | hayır | — | — | — |  |
| `brazier` | Mangal | Brazier | yok | hayır | evet | 75 | orta | — |  |
| `lever` | Kol | Lever | yok | hayır | hayır | — | — | — |  |
| `statueEye` | Heykelin gözü | Statue's eye | yok | hayır | hayır | — | — | — |  |
| `tent` | Çadır | Tent | yok | hayır | hayır | — | — | — |  |
| `tree` | Devrilebilir ağaç | Fellable tree | yok | hayır | hayır | — | — | — |  |
| `bridge` | Köprü | Bridge | yok | hayır | hayır | — | — | — |  |
| `bonePile` | Kemik yığını | Bone pile | yok | hayır | evet | 30 | hafif | — |  |
| `plaque` | Yazıtlı plaka | Inscribed plaque | yok | hayır | hayır | — | — | — |  |
| `boulderPile` | Kaya yığını | Boulder pile | yok | hayır | evet | 500 | ağır | — |  |
| `cauldron` | Cadı kazanı | Witch's cauldron | yok | hayır | evet | 200 | ağır | — |  |
| `iceSeal` | Buz mühür | Ice seal | yok | hayır | hayır | — | — | — |  |
| `crackedWall` | Çatlak duvar | Cracked wall | yok | hayır | hayır | — | — | — |  |
| `key` | Anahtar | Key | yok | evet | evet | 0.5 | hafif | 1 / 1 |  |
| `benchLeg` | Bank bacağı | Bench leg | yok | evet | evet | 5 | hafif | 1 / 1 |  |
| `chain` | Zincir | Chain | yok | evet | evet | 10 | hafif | 1 / 1 |  |
| `bucket` | Kova | Bucket | yok | evet | evet | 3 | hafif | 1 / 1 |  |
| `cudgel` | Nöbetçi sopası | Guard's cudgel | yok | evet | evet | 2 | hafif | 1 / 1 |  |
| `ballista` | Balista | Ballista | yok | hayır | hayır | — | — | — | SRD 5.2.1'de kuşatma silahı yok; değerler genel 5e balistası (AC 15, HP 50, +6, 120/480 ft, 3d10 delici; DECISIONS.md) |
| `frozenFall` | Donmuş şelale | Frozen waterfall | yok | hayır | hayır | — | — | — |  |
| `rock` | Taş | Stone | yok | hayır | evet | 20 | hafif | — |  |
| `droppedItem` | Yerdeki eşya | Dropped item | yok | evet | evet | 3 | hafif | 1 / 1 |  |
| `spellbook` | Büyü kitabı | Spellbook | yok | evet | evet | 3 | hafif | 1 / 1 |  |
| `sword` | Kılıç | Longsword | yok | evet | evet | 3 | hafif | 1 / 1 | weapons:longsword |
| `statue` | Heykel | Statue | yok | evet | evet | 600 | ağır | 4 / 3 | dekor |
| `potion` | Şifa iksiri | Potion of Healing | yok | evet | evet | 0.5 | hafif | 1 / 1 | magic-items:potions-of-healing |
| `wand` | Magic Missile değneği | Wand of Magic Missiles | yok | evet | evet | 1 | hafif | 1 / 1 | magic-items:wand-of-magic-missiles |
| `amulet` | Sağlık muskası | Amulet of Health | yok | evet | evet | 1 | hafif | 1 / 1 | magic-items:amulet-of-health |
| `ring` | Koruma yüzüğü | Ring of Protection | yok | evet | evet | 0.1 | hafif | 1 / 1 | magic-items:ring-of-protection |

## Sprite'sız nesneler

Sprite yoksa savaş haritasında nesnenin `icon` emojisi yer tutucudur (`src/MapBattle.tsx`); gerçek sprite gelince `data/sprite-esleme.json` `objects` altına eklenir.

`chest`, `table`, `door`, `gate`, `brazier`, `lever`, `statueEye`, `tent`, `tree`, `bridge`, `bonePile`, `plaque`, `boulderPile`, `cauldron`, `iceSeal`, `crackedWall`, `key`, `benchLeg`, `chain`, `bucket`, `cudgel`, `ballista`, `frozenFall`, `rock`, `droppedItem`, `spellbook`, `sword`, `statue`, `potion`, `wand`, `amulet`, `ring`
