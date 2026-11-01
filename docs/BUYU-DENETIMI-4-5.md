# Büyü denetimi: SRD 5.2.1, 4–5. seviye (Görev K14; Aşama 2 boyutu)

`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`'dan üretilir (0–3. seviye denetimiyle aynı betik; elle düzenleme, betiği çalıştır). **Yalnızca denetim:** oyun verisine büyü eklenmedi. Durum 0–3. seviyedeki kuralla (oyunda kayıt yoksa **yok**). "İş türü" kaydı olmayan büyülerin Aşama 2'deki tahmini işi (elle sınıflandı): **savaş dışı** (yalnızca kart etiketi ve Game Master notu), **mevcut sistemle** (yalnızca `spells.json` kaydı; motor hazır), **küçük ek** (mevcut sisteme küçük motor eki), **yeni sistem**.

**Özet:** 72 büyü (4. seviye 34, 5. seviye 38) — tam 7, kısmi 19, savaş dışı 27, yok 19. Oyunda olanlar: Arcane Eye, Aura of Life, Black Tentacles, Blight, Charm Monster, Compulsion, Confusion, Conjure Minor Elementals, Conjure Woodland Beings, Control Water, Dimension Door, Divination, Fabricate, Fire Shield, Freedom of Movement, Greater Invisibility, Hallucinatory Terrain, Ice Storm, Locate Creature, Phantasmal Killer, Private Sanctum, Secret Chest, Stone Shape, Stoneskin, Vitriolic Sphere, Wall of Fire, Awaken, Cloudkill, Commune, Commune with Nature, Cone of Cold, Contact Other Plane, Creation, Dispel Evil and Good, Dream, Flame Strike, Geas, Greater Restoration, Hallow, Hold Monster, Insect Plague, Legend Lore, Mass Cure Wounds, Modify Memory, Passwall, Planar Binding, Raise Dead, Reincarnate, Scrying, Seeming, Summon Dragon, Telepathic Bond, Teleportation Circle.

| İş türü | Büyü |
|---|---:|
| savaş dışı (yalnızca not) | 27 |
| mevcut sistemle (yalnızca veri) | 11 |
| mevcut sistem + küçük ek | 18 |
| yeni sistem | 9 |

**Gereken motor sistemleri** (savaş dışı olanlar hariç; büyü sayısı):

| Sistem | Büyü | Büyüler |
|---|---:|---|
| süren etki | 6 | Aura of Life, Conjure Minor Elementals, Death Ward, Fire Shield, Freedom of Movement, Dispel Evil and Good |
| çağırma | 5 | Faithful Hound, Giant Insect, Animate Objects, Arcane Hand, Conjure Elemental |
| kalıcı zemin etkisi | 5 | Black Tentacles, Conjure Woodland Beings, Guardian of Faith, Antilife Shell, Cloudkill |
| alan/save hasarı | 4 | Blight, Ice Storm, Vitriolic Sphere, Flame Strike |
| geçici engel (duvar) | 3 | Wall of Fire, Wall of Force, Wall of Stone |
| zihin kontrolü | 3 | Charm Monster, Compulsion, Confusion |
| ışınlanma | 2 | Dimension Door, Tree Stride |
| tam yönetim (taraf değiştirme) | 2 | Dominate Beast, Dominate Person |
| biçim değiştirme | 1 | Polymorph |
| hapsetme (geçilmez küre) | 1 | Resilient Sphere |
| iyileştirme | 1 | Greater Restoration |
| nesne/yaratık taşıma (telekinezi) | 1 | Telekinesis |
| süreli tekrar (tur başı/sonu) | 1 | Phantasmal Killer |
| sürgün (savaştan geçici çıkış) | 1 | Banishment |
| uzun süreli hastalık (ikinci aşama) | 1 | Contagion |
| yanılsama (yönetilen ikiz) | 1 | Mislead |

**Yeni sistemler** (Aşama 2'nin en büyük işi): sürgün (savaştan geçici çıkış); tam yönetim (taraf değiştirme); hapsetme (geçilmez küre); geçici engel (duvar); uzun süreli hastalık (ikinci aşama); yanılsama (yönetilen ikiz); nesne/yaratık taşıma (telekinezi).

## 4. seviye — 34 büyü

| Büyü | Kimlik | Durum | İş türü | Sistem | Konsantrasyon | Not |
|---|---|---|---|---|---|---|
| Arcane Eye | `spells:arcane-eye` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | keşif gözü; savaşta etkisiz |
| Aura of Life | `spells:aura-of-life` | kısmi | mevcut sistemle (yalnızca veri) | süren etki | evet | yürüyen alan: Necrotic direnç, 0 HP'deki dosta tur başı 1 HP; HP maksimumu düşürme yok |
| Banishment | `spells:banishment` | yok | yeni sistem | sürgün (savaştan geçici çıkış) | evet | hedef savaştan geçici çıkar, konsantrasyon bitince döner (1 dakika sürerse yerli olmayan kalıcı); `gone` benzeri durum + dönüş konumu |
| Black Tentacles | `spells:black-tentacles` | kısmi | mevcut sistemle (yalnızca veri) | kalıcı zemin etkisi | evet | Entangle/Web gibi: zorlu arazi, giriş/tur başı DEX save → Restrained + 3d6 Bludgeoning, `escapeCheck` |
| Blight | `spells:blight` | kısmi | mevcut sistemle (yalnızca veri) | alan/save hasarı |  | 8d8 Necrotic CON (tek hedef); Plant yaratığa dezavantaj ve en yüksek hasar küçük ek (`onlyTypes` benzeri) |
| Charm Monster | `spells:charm-monster` | kısmi | mevcut sistemle (yalnızca veri) | zihin kontrolü |  | Charm Person ile aynı (`charm`, `breakOnDamage: casterSide`), tür sınırı yok; yukarı slotta hedef |
| Compulsion | `spells:compulsion` | kısmi | mevcut sistem + küçük ek | zihin kontrolü | evet | Command'ın zorlama hareketi (`compelEvents`), yönü büyücü her tur bonus eylemle seçer |
| Confusion | `spells:confusion` | kısmi | mevcut sistem + küçük ek | zihin kontrolü | evet | d10 davranış tablosu (rastgele hareket, tur kaybı, rastgele saldırı) + tur sonu save |
| Conjure Minor Elementals | `spells:conjure-minor-elementals` | kısmi | mevcut sistem + küçük ek | süren etki | evet | yürüyen alan zorlu arazi + büyücünün saldırılarına 2d8 ek hasar (Divine Favor gibi) |
| Conjure Woodland Beings | `spells:conjure-woodland-beings` | kısmi | mevcut sistemle (yalnızca veri) | kalıcı zemin etkisi | evet | Spirit Guardians benzeri yürüyen alan (5d8 Force WIS); bonus eylemle Disengage |
| Control Water | `spells:control-water` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | çoğu etki savaş dışı (sel, su yarma); girdap Game Master notu |
| Death Ward | `spells:death-ward` | yok | mevcut sistem + küçük ek | süren etki |  | ilk 0 HP'ye düşüşte 1 HP'de kalır (tek kullanım; Relentless Endurance yolu) |
| Dimension Door | `spells:dimension-door` | kısmi | mevcut sistemle (yalnızca veri) | ışınlanma |  | Misty Step yolu (`teleport`), 500 ft; bir dost birlikte (iki yaratık ışınlanması küçük ek) |
| Divination | `spells:divination` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Dominate Beast | `spells:dominate-beast` | yok | yeni sistem | tam yönetim (taraf değiştirme) | evet | Charmed hedefi büyücünün oyuncusu yönetir (taraf değiştirme), hasar alınca yeniden save (`damageSave`) |
| Fabricate | `spells:fabricate` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Faithful Hound | `spells:faithful-hound` | yok | mevcut sistem + küçük ek | çağırma |  | dokunulamaz bekçi (`intangible`): 30 ft içindeki düşmana tur başı 4d8 Piercing saldırı |
| Fire Shield | `spells:fire-shield` | kısmi | mevcut sistem + küçük ek | süren etki |  | Cold/Fire direnç + yakın dövüşte vurana 2d8 (tepkisiz karşılık; Retaliation yolu) ve ışık (`light`) |
| Freedom of Movement | `spells:freedom-of-movement` | kısmi | mevcut sistem + küçük ek | süren etki |  | zorlu arazi yok sayma, hız düşürme / Paralyzed / Restrained bağışıklığı, 5 ft hareketle yakalamadan kurtulma |
| Giant Insect | `spells:giant-insect` | yok | mevcut sistemle (yalnızca veri) | çağırma | evet | summons.json stat bloğu (centipede / spider / wasp), slotla ölçek |
| Greater Invisibility | `spells:greater-invisibility` | tam | — | süren etki | evet | Invisible; saldırınca bitmez (Invisibility'deki `breakOnAct` yok) |
| Guardian of Faith | `spells:guardian-of-faith` | yok | mevcut sistem + küçük ek | kalıcı zemin etkisi |  | sabit alan: 10 ft içine giren / turunu bitiren düşmana 20 Radiant DEX; toplam 60 hasarda biter (hasar sayacı) |
| Hallucinatory Terrain | `spells:hallucinatory-terrain` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Ice Storm | `spells:ice-storm` | kısmi | mevcut sistemle (yalnızca veri) | alan/save hasarı |  | 2d10 Bludgeoning + 4d6 Cold DEX; alan tur sonuna dek zorlu arazi (zone, iki hasar türü küçük ek) |
| Locate Creature | `spells:locate-creature` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | bilgi |
| Phantasmal Killer | `spells:phantasmal-killer` | kısmi | mevcut sistemle (yalnızca veri) | süreli tekrar (tur başı/sonu) | evet | WIS save → Frightened + tur sonu 4d10 Psychic (`repeatSave` + `ongoing`); ilk save dezavantajlı d20 Testleri |
| Polymorph | `spells:polymorph` | yok | mevcut sistem + küçük ek | biçim değiştirme | evet | Wild Shape biçim altyapısı (`shape_changed`) başka hedefe: geçici HP biçimin HP'si, 0'da biter; düşman hedefte WIS save |
| Private Sanctum | `spells:private-sanctum` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Resilient Sphere | `spells:resilient-sphere` | yok | yeni sistem | hapsetme (geçilmez küre) | evet | hedef hareket edemez; içeri/dışarı saldırı ve hasar geçmez (geçilmez küre) |
| Secret Chest | `spells:secret-chest` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | eşya |
| Stone Shape | `spells:stone-shape` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | taş şekillendirme (haritada zemin değişimi yok) |
| Stoneskin | `spells:stoneskin` | tam | — | süren etki | evet | Bludgeoning/Piercing/Slashing direnç (`resist`) |
| Vitriolic Sphere | `spells:vitriolic-sphere` | kısmi | mevcut sistemle (yalnızca veri) | alan/save hasarı |  | 10d4 Acid DEX + tur sonu 5d4 gecikmeli (`delayed`) |
| Wall of Fire | `spells:wall-of-fire` | kısmi | mevcut sistem + küçük ek | geçici engel (duvar) | evet | duvar biçimi (`wall`) + bir yüzden 5d8 Fire, giriş ve tur sonu tetiği |

## 5. seviye — 38 büyü

| Büyü | Kimlik | Durum | İş türü | Sistem | Konsantrasyon | Not |
|---|---|---|---|---|---|---|
| Animate Objects | `spells:animate-objects` | yok | mevcut sistem + küçük ek | çağırma | evet | Animated Object stat bloğu, sayı slotla (Animate Dead `count` gibi); boyuta göre birleştirme yok |
| Antilife Shell | `spells:antilife-shell` | yok | mevcut sistem + küçük ek | kalıcı zemin etkisi | evet | yürüyen alan (bağlı yaratık + yarıçap); yaratığın girişini engelleme (iten engel) yok |
| Arcane Hand | `spells:arcane-hand` | yok | mevcut sistem + küçük ek | çağırma | evet | Large el: Clenched Fist (5d8), Forceful Hand (itme), Grasping Hand (yakalama), Interposing Hand (siper); bonus eylemle taşıma (`ownerBonus`) |
| Awaken | `spells:awaken` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 8 saat |
| Cloudkill | `spells:cloudkill` | kısmi | mevcut sistem + küçük ek | kalıcı zemin etkisi | evet | zone: 5d8 Poison CON, yoğun örtü; bulutun her tur 10 ft uzaklaşması (alan kayması) yok |
| Commune | `spells:commune` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Commune with Nature | `spells:commune-with-nature` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Cone of Cold | `spells:cone-of-cold` | tam | — | alan/save hasarı |  | oyunda var |
| Conjure Elemental | `spells:conjure-elemental` | yok | mevcut sistem + küçük ek | çağırma | evet | dokunulamaz büyük ruh: bitişik yaratığa save → Restrained + 8d8 elementel hasar (yürüyen alan + yakalama) |
| Contact Other Plane | `spells:contact-other-plane` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Contagion | `spells:contagion` | yok | yeni sistem | uzun süreli hastalık (ikinci aşama) |  | Poisoned, üç başarısız save'e dek; sonra 7 gün süren etki (ikinci aşama / lanet sistemi yok) |
| Creation | `spells:creation` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Dispel Evil and Good | `spells:dispel-evil-and-good` | kısmi | mevcut sistem + küçük ek | süren etki | evet | türlere dezavantaj Protection from Evil and Good (`wardedFrom`) ile; Break Enchantment ve Dismissal (sürgün) yok |
| Dominate Person | `spells:dominate-person` | yok | yeni sistem | tam yönetim (taraf değiştirme) | evet | Dominate Beast ile aynı, Humanoid |
| Dream | `spells:dream` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Flame Strike | `spells:flame-strike` | kısmi | mevcut sistemle (yalnızca veri) | alan/save hasarı |  | silindir (küre sayılır) 5d6 Fire + 5d6 Radiant (iki hasar türü küçük ek) |
| Geas | `spells:geas` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Greater Restoration | `spells:greater-restoration` | kısmi | mevcut sistem + küçük ek | iyileştirme |  | Exhaustion −1, Charmed/Petrified, lanet, yetenek ve HP maksimumu azalması (`cure` genişletme) |
| Hallow | `spells:hallow` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 24 saat |
| Hold Monster | `spells:hold-monster` | tam | — | süreli tekrar (tur başı/sonu) | evet | Hold Person ile aynı (Paralyzed, `repeatSave`), tür sınırı yok |
| Insect Plague | `spells:insect-plague` | tam | — | kalıcı zemin etkisi | evet | zone: 4d10 Piercing CON, zorlu arazi, hafif örtü |
| Legend Lore | `spells:legend-lore` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Mass Cure Wounds | `spells:mass-cure-wounds` | tam | — | iyileştirme |  | Mass Healing Word gibi `healTargets` (6), 5d8 + değiştirici |
| Mislead | `spells:mislead` | yok | yeni sistem | yanılsama (yönetilen ikiz) | evet | Invisible + büyücünün yönettiği dokunulamaz ikiz; görüşü ikizden |
| Modify Memory | `spells:modify-memory` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | sosyal |
| Passwall | `spells:passwall` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | duvarda geçit (haritada duvar delme yok) |
| Planar Binding | `spells:planar-binding` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Raise Dead | `spells:raise-dead` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Reincarnate | `spells:reincarnate` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Scrying | `spells:scrying` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | 10 dakika |
| Seeming | `spells:seeming` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | görünüm |
| Summon Dragon | `spells:summon-dragon` | tam | — | çağırma | evet | oyunda var |
| Telekinesis | `spells:telekinesis` | yok | yeni sistem | nesne/yaratık taşıma (telekinezi) | evet | her tur eylemle yaratık taşıma (STR yarışı) ve Restrained; nesneler |
| Telepathic Bond | `spells:telepathic-bond` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, iletişim |
| Teleportation Circle | `spells:teleportation-circle` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Tree Stride | `spells:tree-stride` | yok | mevcut sistem + küçük ek | ışınlanma | evet | ağaç altıgenleri arası ışınlanma (haritada ağaç zemini) |
| Wall of Force | `spells:wall-of-force` | yok | yeni sistem | geçici engel (duvar) | evet | geçilmez görünmez duvar / kubbe: hareket ve saldırı engeli, Disintegrate dışında yok edilemez |
| Wall of Stone | `spells:wall-of-stone` | yok | yeni sistem | geçici engel (duvar) | evet | kalıcı taş altıgenler (yıkılabilir parçalar): harita zemini değişir, görüş ve hareket engeli |

## Sınıflara göre

SRD sınıf listeleri; parantez içinde iş türü kısaltması (n: savaş dışı, v: mevcut sistemle, e: küçük ek, y: yeni sistem, ✓: oyunda).

| Sınıf | 4. seviye | 5. seviye |
|---|---|---|
| Bard | Charm Monster (✓), Compulsion (✓), Confusion (✓), Dimension Door (✓), Freedom of Movement (✓), Greater Invisibility (✓), Hallucinatory Terrain (✓), Locate Creature (✓), Phantasmal Killer (✓), Polymorph (e) | Animate Objects (e), Awaken (✓), Dominate Person (y), Dream (✓), Geas (✓), Greater Restoration (✓), Hold Monster (✓), Legend Lore (✓), Mass Cure Wounds (✓), Mislead (y), Modify Memory (✓), Planar Binding (✓), Raise Dead (✓), Scrying (✓), Seeming (✓), Telepathic Bond (✓), Teleportation Circle (✓) |
| Cleric | Aura of Life (✓), Banishment (y), Control Water (✓), Death Ward (e), Divination (✓), Freedom of Movement (✓), Guardian of Faith (e), Locate Creature (✓), Stone Shape (✓) | Commune (✓), Contagion (y), Dispel Evil and Good (✓), Flame Strike (✓), Geas (✓), Greater Restoration (✓), Hallow (✓), Insect Plague (✓), Legend Lore (✓), Mass Cure Wounds (✓), Planar Binding (✓), Raise Dead (✓), Scrying (✓) |
| Druid | Blight (✓), Charm Monster (✓), Confusion (✓), Conjure Minor Elementals (✓), Conjure Woodland Beings (✓), Control Water (✓), Divination (✓), Dominate Beast (y), Fire Shield (✓), Freedom of Movement (✓), Giant Insect (v), Hallucinatory Terrain (✓), Ice Storm (✓), Locate Creature (✓), Polymorph (e), Stone Shape (✓), Stoneskin (✓), Wall of Fire (✓) | Antilife Shell (e), Awaken (✓), Commune with Nature (✓), Cone of Cold (✓), Conjure Elemental (e), Contagion (y), Geas (✓), Greater Restoration (✓), Insect Plague (✓), Mass Cure Wounds (✓), Planar Binding (✓), Reincarnate (✓), Scrying (✓), Tree Stride (e), Wall of Stone (y) |
| Paladin | Aura of Life (✓), Banishment (y), Death Ward (e), Locate Creature (✓) | Dispel Evil and Good (✓), Geas (✓), Greater Restoration (✓), Raise Dead (✓) |
| Ranger | Conjure Woodland Beings (✓), Dominate Beast (y), Freedom of Movement (✓), Locate Creature (✓), Stoneskin (✓) | Commune with Nature (✓), Greater Restoration (✓), Tree Stride (e) |
| Sorcerer | Banishment (y), Blight (✓), Charm Monster (✓), Confusion (✓), Dimension Door (✓), Dominate Beast (y), Fire Shield (✓), Greater Invisibility (✓), Ice Storm (✓), Polymorph (e), Stoneskin (✓), Vitriolic Sphere (✓), Wall of Fire (✓) | Animate Objects (e), Arcane Hand (e), Cloudkill (✓), Cone of Cold (✓), Creation (✓), Dominate Person (y), Hold Monster (✓), Insect Plague (✓), Seeming (✓), Telekinesis (y), Teleportation Circle (✓), Wall of Stone (y) |
| Warlock | Banishment (y), Blight (✓), Charm Monster (✓), Dimension Door (✓), Hallucinatory Terrain (✓) | Contact Other Plane (✓), Dream (✓), Hold Monster (✓), Mislead (y), Planar Binding (✓), Scrying (✓), Teleportation Circle (✓) |
| Wizard | Arcane Eye (✓), Banishment (y), Black Tentacles (✓), Blight (✓), Charm Monster (✓), Confusion (✓), Conjure Minor Elementals (✓), Control Water (✓), Dimension Door (✓), Divination (✓), Fabricate (✓), Faithful Hound (e), Fire Shield (✓), Greater Invisibility (✓), Hallucinatory Terrain (✓), Ice Storm (✓), Locate Creature (✓), Phantasmal Killer (✓), Polymorph (e), Private Sanctum (✓), Resilient Sphere (y), Secret Chest (✓), Stone Shape (✓), Stoneskin (✓), Vitriolic Sphere (✓), Wall of Fire (✓) | Animate Objects (e), Arcane Hand (e), Cloudkill (✓), Cone of Cold (✓), Conjure Elemental (e), Contact Other Plane (✓), Creation (✓), Dominate Person (y), Dream (✓), Geas (✓), Hold Monster (✓), Legend Lore (✓), Mislead (y), Modify Memory (✓), Passwall (✓), Planar Binding (✓), Scrying (✓), Seeming (✓), Summon Dragon (✓), Telekinesis (y), Telepathic Bond (✓), Teleportation Circle (✓), Wall of Force (y), Wall of Stone (y) |
