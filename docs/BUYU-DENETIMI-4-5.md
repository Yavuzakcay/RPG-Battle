# Büyü denetimi: SRD 5.2.1, 4–5. seviye (Görev K14; Aşama 2 boyutu)

`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`'dan üretilir (0–3. seviye denetimiyle aynı betik; elle düzenleme, betiği çalıştır). **Yalnızca denetim:** oyun verisine büyü eklenmedi. Durum 0–3. seviyedeki kuralla (oyunda kayıt yoksa **yok**). "İş türü" kaydı olmayan büyülerin Aşama 2'deki tahmini işi (elle sınıflandı): **savaş dışı** (yalnızca kart etiketi ve Game Master notu), **mevcut sistemle** (yalnızca `spells.json` kaydı; motor hazır), **küçük ek** (mevcut sisteme küçük motor eki), **yeni sistem**.

**Özet:** 72 büyü (4. seviye 34, 5. seviye 38) — tam 49, kısmi 0, savaş dışı 23, yok 0. Oyunda olanlar: Arcane Eye, Aura of Life, Banishment, Black Tentacles, Blight, Charm Monster, Compulsion, Confusion, Conjure Minor Elementals, Conjure Woodland Beings, Control Water, Death Ward, Dimension Door, Divination, Dominate Beast, Fabricate, Faithful Hound, Fire Shield, Freedom of Movement, Giant Insect, Greater Invisibility, Guardian of Faith, Hallucinatory Terrain, Ice Storm, Locate Creature, Phantasmal Killer, Polymorph, Private Sanctum, Resilient Sphere, Secret Chest, Stone Shape, Stoneskin, Vitriolic Sphere, Wall of Fire, Animate Objects, Antilife Shell, Arcane Hand, Awaken, Cloudkill, Commune, Commune with Nature, Cone of Cold, Conjure Elemental, Contact Other Plane, Contagion, Creation, Dispel Evil and Good, Dominate Person, Dream, Flame Strike, Geas, Greater Restoration, Hallow, Hold Monster, Insect Plague, Legend Lore, Mass Cure Wounds, Mislead, Modify Memory, Passwall, Planar Binding, Raise Dead, Reincarnate, Scrying, Seeming, Summon Dragon, Telekinesis, Telepathic Bond, Teleportation Circle, Tree Stride, Wall of Force, Wall of Stone.

| İş türü | Büyü |
|---|---:|
| savaş dışı (yalnızca not) | 23 |
| mevcut sistemle (yalnızca veri) | 0 |
| mevcut sistem + küçük ek | 0 |
| yeni sistem | 0 |

**Gereken motor sistemleri** (savaş dışı olanlar hariç; büyü sayısı):

| Sistem | Büyü | Büyüler |
|---|---:|---|

**Yeni sistemler** (Aşama 2'nin en büyük işi): .

## 4. seviye — 34 büyü

| Büyü | Kimlik | Durum | İş türü | Sistem | Konsantrasyon | Not |
|---|---|---|---|---|---|---|
| Arcane Eye | `spells:arcane-eye` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | keşif gözü; savaşta etkisiz |
| Aura of Life | `spells:aura-of-life` | tam | — | süren etki | evet | yürüyen alan: Necrotic direnç, 0 HP'deki dosta tur başı 1 HP; HP maksimumu düşürme yok |
| Banishment | `spells:banishment` | tam | — | sürgün (savaştan geçici çıkış) | evet | hedef savaştan geçici çıkar, konsantrasyon bitince döner (1 dakika sürerse yerli olmayan kalıcı); `gone` benzeri durum + dönüş konumu |
| Black Tentacles | `spells:black-tentacles` | tam | — | kalıcı zemin etkisi | evet | Entangle/Web gibi: zorlu arazi, giriş/tur başı DEX save → Restrained + 3d6 Bludgeoning, `escapeCheck` |
| Blight | `spells:blight` | tam | — | alan/save hasarı |  | 8d8 Necrotic CON (tek hedef); Plant yaratığa dezavantaj ve en yüksek hasar küçük ek (`onlyTypes` benzeri) |
| Charm Monster | `spells:charm-monster` | tam | — | zihin kontrolü |  | Charm Person ile aynı (`charm`, `breakOnDamage: casterSide`), tür sınırı yok; yukarı slotta hedef |
| Compulsion | `spells:compulsion` | tam | — | zihin kontrolü | evet | Command'ın zorlama hareketi (`compelEvents`), yönü büyücü her tur bonus eylemle seçer |
| Confusion | `spells:confusion` | tam | — | zihin kontrolü | evet | d10 davranış tablosu (rastgele hareket, tur kaybı, rastgele saldırı) + tur sonu save |
| Conjure Minor Elementals | `spells:conjure-minor-elementals` | tam | — | süren etki | evet | yürüyen alan zorlu arazi + büyücünün saldırılarına 2d8 ek hasar (Divine Favor gibi) |
| Conjure Woodland Beings | `spells:conjure-woodland-beings` | tam | — | kalıcı zemin etkisi | evet | Spirit Guardians benzeri yürüyen alan (5d8 Force WIS); bonus eylemle Disengage |
| Control Water | `spells:control-water` | tam | — | savaş dışı (mekân/zaman/bilgi) | evet | çoğu etki savaş dışı (sel, su yarma); girdap Game Master notu |
| Death Ward | `spells:death-ward` | tam | — | süren etki |  | ilk 0 HP'ye düşüşte 1 HP'de kalır (tek kullanım; Relentless Endurance yolu) |
| Dimension Door | `spells:dimension-door` | tam | — | ışınlanma |  | Misty Step yolu (`teleport`), 500 ft; bir dost birlikte (iki yaratık ışınlanması küçük ek) |
| Divination | `spells:divination` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Dominate Beast | `spells:dominate-beast` | tam | — | tam yönetim (taraf değiştirme) | evet | Charmed hedefi büyücünün oyuncusu yönetir (taraf değiştirme), hasar alınca yeniden save (`damageSave`) |
| Fabricate | `spells:fabricate` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Faithful Hound | `spells:faithful-hound` | tam | — | çağırma |  | dokunulamaz bekçi (`intangible`): 30 ft içindeki düşmana tur başı 4d8 Piercing saldırı |
| Fire Shield | `spells:fire-shield` | tam | — | süren etki |  | Cold/Fire direnç + yakın dövüşte vurana 2d8 (tepkisiz karşılık; Retaliation yolu) ve ışık (`light`) |
| Freedom of Movement | `spells:freedom-of-movement` | tam | — | süren etki |  | zorlu arazi yok sayma, hız düşürme / Paralyzed / Restrained bağışıklığı, 5 ft hareketle yakalamadan kurtulma |
| Giant Insect | `spells:giant-insect` | tam | — | çağırma | evet | summons.json stat bloğu (centipede / spider / wasp), slotla ölçek |
| Greater Invisibility | `spells:greater-invisibility` | tam | — | süren etki | evet | Invisible; saldırınca bitmez (Invisibility'deki `breakOnAct` yok) |
| Guardian of Faith | `spells:guardian-of-faith` | tam | — | kalıcı zemin etkisi |  | sabit alan: 10 ft içine giren / turunu bitiren düşmana 20 Radiant DEX; toplam 60 hasarda biter (hasar sayacı) |
| Hallucinatory Terrain | `spells:hallucinatory-terrain` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Ice Storm | `spells:ice-storm` | tam | — | alan/save hasarı |  | 2d10 Bludgeoning + 4d6 Cold DEX; alan tur sonuna dek zorlu arazi (zone, iki hasar türü küçük ek) |
| Locate Creature | `spells:locate-creature` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | bilgi |
| Phantasmal Killer | `spells:phantasmal-killer` | tam | — | süreli tekrar (tur başı/sonu) | evet | WIS save → Frightened + tur sonu 4d10 Psychic (`repeatSave` + `ongoing`); ilk save dezavantajlı d20 Testleri |
| Polymorph | `spells:polymorph` | tam | — | biçim değiştirme | evet | Wild Shape biçim altyapısı (`shape_changed`) başka hedefe: geçici HP biçimin HP'si, 0'da biter; düşman hedefte WIS save |
| Private Sanctum | `spells:private-sanctum` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Resilient Sphere | `spells:resilient-sphere` | tam | — | hapsetme (geçilmez küre) | evet | hedef hareket edemez; içeri/dışarı saldırı ve hasar geçmez (geçilmez küre) |
| Secret Chest | `spells:secret-chest` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | eşya |
| Stone Shape | `spells:stone-shape` | tam | — | savaş dışı (mekân/zaman/bilgi) |  | taş şekillendirme (haritada zemin değişimi yok) |
| Stoneskin | `spells:stoneskin` | tam | — | süren etki | evet | Bludgeoning/Piercing/Slashing direnç (`resist`) |
| Vitriolic Sphere | `spells:vitriolic-sphere` | tam | — | alan/save hasarı |  | 10d4 Acid DEX + tur sonu 5d4 gecikmeli (`delayed`) |
| Wall of Fire | `spells:wall-of-fire` | tam | — | geçici engel (duvar) | evet | duvar biçimi (`wall`) + bir yüzden 5d8 Fire, giriş ve tur sonu tetiği |

## 5. seviye — 38 büyü

| Büyü | Kimlik | Durum | İş türü | Sistem | Konsantrasyon | Not |
|---|---|---|---|---|---|---|
| Animate Objects | `spells:animate-objects` | tam | — | çağırma | evet | Animated Object stat bloğu, sayı slotla (Animate Dead `count` gibi); boyuta göre birleştirme yok |
| Antilife Shell | `spells:antilife-shell` | tam | — | kalıcı zemin etkisi | evet | yürüyen alan (bağlı yaratık + yarıçap); yaratığın girişini engelleme (iten engel) yok |
| Arcane Hand | `spells:arcane-hand` | tam | — | çağırma | evet | Large el: Clenched Fist (5d8), Forceful Hand (itme), Grasping Hand (yakalama), Interposing Hand (siper); bonus eylemle taşıma (`ownerBonus`) |
| Awaken | `spells:awaken` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 8 saat |
| Cloudkill | `spells:cloudkill` | tam | — | kalıcı zemin etkisi | evet | zone: 5d8 Poison CON, yoğun örtü; bulutun her tur 10 ft uzaklaşması (alan kayması) yok |
| Commune | `spells:commune` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Commune with Nature | `spells:commune-with-nature` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Cone of Cold | `spells:cone-of-cold` | tam | — | alan/save hasarı |  | oyunda var |
| Conjure Elemental | `spells:conjure-elemental` | tam | — | çağırma | evet | dokunulamaz büyük ruh: bitişik yaratığa save → Restrained + 8d8 elementel hasar (yürüyen alan + yakalama) |
| Contact Other Plane | `spells:contact-other-plane` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, bilgi |
| Contagion | `spells:contagion` | tam | — | uzun süreli hastalık (ikinci aşama) |  | Poisoned, üç başarısız save'e dek; sonra 7 gün süren etki (ikinci aşama / lanet sistemi yok) |
| Creation | `spells:creation` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Dispel Evil and Good | `spells:dispel-evil-and-good` | tam | — | süren etki | evet | türlere dezavantaj Protection from Evil and Good (`wardedFrom`) ile; Break Enchantment ve Dismissal (sürgün) yok |
| Dominate Person | `spells:dominate-person` | tam | — | tam yönetim (taraf değiştirme) | evet | Dominate Beast ile aynı, Humanoid |
| Dream | `spells:dream` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Flame Strike | `spells:flame-strike` | tam | — | alan/save hasarı |  | silindir (küre sayılır) 5d6 Fire + 5d6 Radiant (iki hasar türü küçük ek) |
| Geas | `spells:geas` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Greater Restoration | `spells:greater-restoration` | tam | — | iyileştirme |  | Exhaustion −1, Charmed/Petrified, lanet, yetenek ve HP maksimumu azalması (`cure` genişletme) |
| Hallow | `spells:hallow` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 24 saat |
| Hold Monster | `spells:hold-monster` | tam | — | süreli tekrar (tur başı/sonu) | evet | Hold Person ile aynı (Paralyzed, `repeatSave`), tür sınırı yok |
| Insect Plague | `spells:insect-plague` | tam | — | kalıcı zemin etkisi | evet | zone: 4d10 Piercing CON, zorlu arazi, hafif örtü |
| Legend Lore | `spells:legend-lore` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 10 dakika |
| Mass Cure Wounds | `spells:mass-cure-wounds` | tam | — | iyileştirme |  | Mass Healing Word gibi `healTargets` (6), 5d8 + değiştirici |
| Mislead | `spells:mislead` | tam | — | yanılsama (yönetilen ikiz) | evet | Invisible + büyücünün yönettiği dokunulamaz ikiz; görüşü ikizden |
| Modify Memory | `spells:modify-memory` | tam | — | savaş dışı (mekân/zaman/bilgi) | evet | sosyal |
| Passwall | `spells:passwall` | tam | — | savaş dışı (mekân/zaman/bilgi) |  | duvarda geçit (haritada duvar delme yok) |
| Planar Binding | `spells:planar-binding` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Raise Dead | `spells:raise-dead` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Reincarnate | `spells:reincarnate` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 saat |
| Scrying | `spells:scrying` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) | evet | 10 dakika |
| Seeming | `spells:seeming` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | görünüm |
| Summon Dragon | `spells:summon-dragon` | tam | — | çağırma | evet | oyunda var |
| Telekinesis | `spells:telekinesis` | tam | — | nesne/yaratık taşıma (telekinezi) | evet | her tur eylemle yaratık taşıma (STR yarışı) ve Restrained; nesneler |
| Telepathic Bond | `spells:telepathic-bond` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | ritüel, iletişim |
| Teleportation Circle | `spells:teleportation-circle` | savaş dışı | savaş dışı (yalnızca not) | savaş dışı (mekân/zaman/bilgi) |  | 1 dakika |
| Tree Stride | `spells:tree-stride` | tam | — | ışınlanma | evet | ağaç altıgenleri arası ışınlanma (haritada ağaç zemini) |
| Wall of Force | `spells:wall-of-force` | tam | — | geçici engel (duvar) | evet | geçilmez görünmez duvar / kubbe: hareket ve saldırı engeli, Disintegrate dışında yok edilemez |
| Wall of Stone | `spells:wall-of-stone` | tam | — | geçici engel (duvar) | evet | kalıcı taş altıgenler (yıkılabilir parçalar): harita zemini değişir, görüş ve hareket engeli |

## Sınıflara göre

SRD sınıf listeleri; parantez içinde iş türü kısaltması (n: savaş dışı, v: mevcut sistemle, e: küçük ek, y: yeni sistem, ✓: oyunda).

| Sınıf | 4. seviye | 5. seviye |
|---|---|---|
| Bard | Charm Monster (✓), Compulsion (✓), Confusion (✓), Dimension Door (✓), Freedom of Movement (✓), Greater Invisibility (✓), Hallucinatory Terrain (✓), Locate Creature (✓), Phantasmal Killer (✓), Polymorph (✓) | Animate Objects (✓), Awaken (✓), Dominate Person (✓), Dream (✓), Geas (✓), Greater Restoration (✓), Hold Monster (✓), Legend Lore (✓), Mass Cure Wounds (✓), Mislead (✓), Modify Memory (✓), Planar Binding (✓), Raise Dead (✓), Scrying (✓), Seeming (✓), Telepathic Bond (✓), Teleportation Circle (✓) |
| Cleric | Aura of Life (✓), Banishment (✓), Control Water (✓), Death Ward (✓), Divination (✓), Freedom of Movement (✓), Guardian of Faith (✓), Locate Creature (✓), Stone Shape (✓) | Commune (✓), Contagion (✓), Dispel Evil and Good (✓), Flame Strike (✓), Geas (✓), Greater Restoration (✓), Hallow (✓), Insect Plague (✓), Legend Lore (✓), Mass Cure Wounds (✓), Planar Binding (✓), Raise Dead (✓), Scrying (✓) |
| Druid | Blight (✓), Charm Monster (✓), Confusion (✓), Conjure Minor Elementals (✓), Conjure Woodland Beings (✓), Control Water (✓), Divination (✓), Dominate Beast (✓), Fire Shield (✓), Freedom of Movement (✓), Giant Insect (✓), Hallucinatory Terrain (✓), Ice Storm (✓), Locate Creature (✓), Polymorph (✓), Stone Shape (✓), Stoneskin (✓), Wall of Fire (✓) | Antilife Shell (✓), Awaken (✓), Commune with Nature (✓), Cone of Cold (✓), Conjure Elemental (✓), Contagion (✓), Geas (✓), Greater Restoration (✓), Insect Plague (✓), Mass Cure Wounds (✓), Planar Binding (✓), Reincarnate (✓), Scrying (✓), Tree Stride (✓), Wall of Stone (✓) |
| Paladin | Aura of Life (✓), Banishment (✓), Death Ward (✓), Locate Creature (✓) | Dispel Evil and Good (✓), Geas (✓), Greater Restoration (✓), Raise Dead (✓) |
| Ranger | Conjure Woodland Beings (✓), Dominate Beast (✓), Freedom of Movement (✓), Locate Creature (✓), Stoneskin (✓) | Commune with Nature (✓), Greater Restoration (✓), Tree Stride (✓) |
| Sorcerer | Banishment (✓), Blight (✓), Charm Monster (✓), Confusion (✓), Dimension Door (✓), Dominate Beast (✓), Fire Shield (✓), Greater Invisibility (✓), Ice Storm (✓), Polymorph (✓), Stoneskin (✓), Vitriolic Sphere (✓), Wall of Fire (✓) | Animate Objects (✓), Arcane Hand (✓), Cloudkill (✓), Cone of Cold (✓), Creation (✓), Dominate Person (✓), Hold Monster (✓), Insect Plague (✓), Seeming (✓), Telekinesis (✓), Teleportation Circle (✓), Wall of Stone (✓) |
| Warlock | Banishment (✓), Blight (✓), Charm Monster (✓), Dimension Door (✓), Hallucinatory Terrain (✓) | Contact Other Plane (✓), Dream (✓), Hold Monster (✓), Mislead (✓), Planar Binding (✓), Scrying (✓), Teleportation Circle (✓) |
| Wizard | Arcane Eye (✓), Banishment (✓), Black Tentacles (✓), Blight (✓), Charm Monster (✓), Confusion (✓), Conjure Minor Elementals (✓), Control Water (✓), Dimension Door (✓), Divination (✓), Fabricate (✓), Faithful Hound (✓), Fire Shield (✓), Greater Invisibility (✓), Hallucinatory Terrain (✓), Ice Storm (✓), Locate Creature (✓), Phantasmal Killer (✓), Polymorph (✓), Private Sanctum (✓), Resilient Sphere (✓), Secret Chest (✓), Stone Shape (✓), Stoneskin (✓), Vitriolic Sphere (✓), Wall of Fire (✓) | Animate Objects (✓), Arcane Hand (✓), Cloudkill (✓), Cone of Cold (✓), Conjure Elemental (✓), Contact Other Plane (✓), Creation (✓), Dominate Person (✓), Dream (✓), Geas (✓), Hold Monster (✓), Legend Lore (✓), Mislead (✓), Modify Memory (✓), Passwall (✓), Planar Binding (✓), Scrying (✓), Seeming (✓), Summon Dragon (✓), Telekinesis (✓), Telepathic Bond (✓), Teleportation Circle (✓), Wall of Force (✓), Wall of Stone (✓) |
