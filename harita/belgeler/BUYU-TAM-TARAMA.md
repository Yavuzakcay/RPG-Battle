# Büyü tam taraması (gece kuyruğu Aşama 3a/3b)

SRD 5.2.1'in 339 büyüsü (cantrip–9) oyun verisiyle karşılaştırıldı. Kural sürümü 102 (`BUYU_TAM_VERSION`, büyü verisinde `b102`
bloğu). Bölüm 1 otomatik (`npx vite-node scripts/buyu-tam-tarama.ts`); bölüm 2–4 elle.

## Yöntem

1. **Otomatik fark** (`scripts/buyu-tam-tarama.ts`): her SRD kaydı (`data/srd/spells.json`) ile oyun kaydının güncel sürümde
   birleşik mekaniği (`mechanicsAt` + `upgrade`) alan alan: seviye, okul, sınıf listesi, döküm süresi, ritüel, konsantrasyon,
   menzil, alan şekli/boyu (metindeki ilk "N-foot … Sphere/Cone/Cube/Line/Cylinder/Emanation"), save yeteneği, saldırı türü,
   ilk hasar zarı ve türü, süre (tur), tur sonu tekrar save'i, yukarı slot metni ↔ `upcast.applied` (ve `applied` bayrağı
   olmadan uygulayan kod yolları), cantrip ölçeklemesi, maliyetli materyal. "Self (N-foot Cone)" menzili gösterim farkı sayılır.
2. **Elle doğrulama:** otomatik şüpheli ve kısmi satırların hepsi SRD metniyle (PDF) ve motor koduyla tek tek okundu (bölüm 2).
3. **Ölü veri alanı taraması:** büyülerin `effect`/`failEffect`/`selfBuff`/`zone` alt anahtarları motor kaynağında aranıp hiç
   okunmayanlar bulundu (207 anahtar, 5 okunmayan). İkisi gerçek hataydı (Etherealness `ethereal`, Earthquake
   `breakConcentration`); biri eksik mekanik (Storm of Vengeance `stages`); ikisi savaş dışı (Glibness `chaFloor`, Shapechange
   `keepMind`), biri savaş dışı süre (Befuddlement `repeatSaveEvery`, 30 günde bir).
4. **Sınır:** otomatik fark yapısal alanları kapsar; "başarıda/başarısızlıkta etki", her "seç" seçeneği ve ek etki cümleleri
   yalnız şüpheli/kısmi satırlarda ve ölü alan taramasında elle okundu; "tam (otomatik)" satırların anlatım cümleleri tek tek
   okunmadı (önceki denetimler: BUYU-DURUM, BUYU-KISMI, ENVANTER-BUYULER, M1-FARKLAR).

## 2. Elle doğrulama sonuçları

| Büyü | Bulgu | Sonuç |
|---|---|---|
| Confusion | Yukarı slot "radius increases by 5 feet" uygulanmıyordu (`upcast.other`) | **102 düzeltildi** (`b102.upcast.radiusFt` 5; `executeAreaCast`) |
| Etherealness | Etki `ethereal` alanı motor tarafından okunmuyordu: büyü kimseyi Ethereal yapmıyordu; yukarı slot hedefleri yok | **102 düzeltildi** (etkiye `ethereal`; slot başına +3 istekli yaratık, 10 ft, büyücü dahil) |
| Earthquake | "its Concentration is broken" veride `breakConcentration` (okunmayan ad); konsantrasyon bozulmuyordu | **102 düzeltildi** (`dropConcentration`) |
| Conjure Elemental | Alan 10 tur; SRD "Concentration, up to 10 minutes" | **102 düzeltildi** (100 tur) |
| Mass Cure Wounds | 6 hedef menzil içinde serbest; SRD "in a 30-foot-radius Sphere centered on a point within range" | **102 düzeltildi** (`healSphereFt` 30; `healSphereFits`) |
| Storm of Vengeance | 104 (KARAR104): tur 2–10 aşamaları `k104` `zone.stages` (`stormStage.ts`); yıldırım hedefleri otomatik ⚠ | **tam (104)** |
| Spare the Dying | Cantrip menzil kademesi | tam (GENEL96 `executeRestore` `spare96`; otomatik betik yanıldı) |
| Eldritch Blast, Shillelagh, True Strike | Cantrip ölçeklemesi | tam (`raysByLevel`, `weaponOverride.dice`, `weaponStrike.extra`) |
| Freedom of Movement, Hold Person/Monster, Blindness/Deafness | Yukarı slot hedefi; tur sonu save | tam (`effectTargetCount`, `data/condition-effects.json` `saveEnds`) |
| Dispel Magic, Animate Dead, Conjure Minor Elementals | Yukarı slot | tam (slot seviyesine dek otomatik bitirme; `summons.json` `count.perLevel`; `upcastDice`) |
| Dominate Beast/Person/Monster, Hex, Hunter's Mark, Mass Suggestion, Modify Memory | Yukarı slot yalnız süre/savaş dışı | tam (savaş ≤ 1 dakika; süre uzaması etkisiz) |
| Phantom Steed | Döküm 1 dakika/ritüel | tam (kurulumda ritüel; `summons.json` `setup`) |
| Telekinesis | Etki 1 tur | tam (her eylemde yenilenen tutuş; büyü süresi konsantrasyon) |
| Fire Storm | Alan "ten 10-foot Cubes" | tam (K65 serbest şekil, 40 altıgen) |
| Pass without Trace, Aura of Life, Holy Aura, Antimagic Field, Slow, Phantasmal Force, Conjure Minor Elementals, Prismatic Spray | "Alan tanımı yok" | tam (yayılım/küp etki alanlarında: `stealthAura`, `auraLife`, `allyAura`, `antimagic`, `cubeFt`, `illusionAt`, `withinFt`, `prismatic`) |
| Divine Favor, Ensnaring Strike, Ice Knife, Dimension Door, Power Word Kill, Arcane Hand, Wish | "Hasar/save yok" | tam (`selfBuff.extraDamage`, `smiteSave` + `ongoing`, `burst`, `teleport.companion` 4d6, `powerWord` 12d12, çağrı saldırısı 5d8; Wish stresi savaş dışı) |

## 3. Kapsam dışı / Game Master notlu (gerekçeli, değişmedi)

Önceki görevlerin `kapsamDisi`/`gmNoted` notları SRD'ye karşı yeniden okundu; savaş modelinde SRD'ye uygun karşılığı zaten var ya
da yeni sistem istiyor:

- **Hex** (seçilen yetenek): motor her yeteneği seçtirebiliyor (`cast_spell.choice`, `checkDis`); varsayılan STR/DEX. Tam.
- **Mage Armor** (zırh giyince biter), **Spider Climb** (eller serbest), **Entangle** (bitkilerin çekilmesi), **Web** (tutunma
  yeri), **Darkness/Daylight** (taşınmayan nesne), **Alter Self** (Change Appearance), **Plant Growth** (Enrichment), **Remove
  Curse** (lanetli eşya bağı), **Conjure Fey** (görünüş), **See Invisibility** (Ethereal görme), **Animate Dead** (24 saatlik
  kontrol), **Light/Continual Flame** (1 saat / kalıcı süre), **Jump** (havadaki yay), **Blindness/Deafness** (duymaya bağlı
  kontroller), **Fog Cloud/Stinking Cloud** (rüzgârla dağılma yüzey sistemiyle), **Enlarge/Reduce, Conjure Animals** (çok altıgen
  bayrağı kapalıyken tek altıgen): savaş içi etkileri tam; kalan parça savaş dışı ya da oyunun genel kuralı.
- **Dispel Magic** (sihirli eşyanın kendi büyüsü): SRD de dağıtmaz ("ongoing spell"); tam.
- **Wish** (serbest dilek): bölüm 4.

## 4. Karar gerekli

1. **Storm of Vengeance tur aşamaları (eksik):** SRD "On each of your turns until the spell ends": 2. tur asit (4d6), 3. tur altı
   yıldırım (DEX, 10d6), 4. tur dolu (2d6 Bludgeoning), 5–10. tur dondurucu yağmur + rüzgâr (zorlu arazi, yoğun örtü, 1d6 Cold,
   menzilli silah saldırısı yok). **Öneri:** alan kuralına `stages: [{ round, ... }]` dizisi ve büyücünün tur başı tetiğinde aşama
   sayacı (`zone.stage`); 9. seviye, tek büyü; denge etkisi küçük. Sürüm 103+ ile.
2. **Savaş dışı süreler** (Light, Continual Flame, Find Familiar 1 saat; Animate Dead 24 saat; keşif büyüleri): savaş biter,
   etki biter. **Öneri:** Serüven zaman modeli (saat/gün) gelince `data/yolculuk` süre alanıyla taşınsın.
3. **Eşya büyüleri** (Dispel Magic nesnede, Remove Curse lanetli eşya bağı, Magic Weapon kalıcı eşya ayrımı): eşya örneği/bağ
   şeması yok (TE99 K-D2 ile aynı). **Öneri:** eşya ↔ silah bağı şemasıyla birlikte.
4. **Wish serbest dilek:** savaşta yalnız 8. seviye ve altı büyü kopyası; serbest dilek Game Master'da. **Öneri:** sapma olarak kalsın.
5. **Maliyetli materyal (GP)** (Revivify 300 GP elmas, Holy Aura 1000 GP, Raise Dead…): oyunda bileşen/envanter modeli yok;
   büyüler materyalsiz yapılır. **Öneri:** eşya envanteri (Serüven dükkânı) gelince `components.costGp` denetimi.

<!-- otomatik:başla (npx vite-node scripts/buyu-tam-tarama.ts) -->
## 1. Otomatik fark (kural sürümü 102, 339 SRD büyüsü)

| Seviye | tam (otomatik) | kısmi (otomatik) | şüpheli | savaş dışı | eksik | Toplam |
|---|---:|---:|---:|---:|---:|---:|
| 0 | 19 | 0 | 0 | 8 | 0 | 27 |
| 1–3 | 106 | 6 | 0 | 44 | 0 | 156 |
| 4–5 | 44 | 5 | 0 | 23 | 0 | 72 |
| 6–9 | 45 | 5 | 0 | 34 | 0 | 84 |
| **Toplam** | 214 | 16 | 0 | 109 | 0 | 339 |

Fark türleri (şüpheli satırlarda): .

### Şüpheli ve kısmi satırlar

| Büyü | Sv | Durum | Fark (otomatik) | Not |
|---|---:|---|---|---|
| Divine Favor (`divine-favor`) | 1 | kısmi (otomatik) |  | SRD 1d4 radiant hasarı; mekanikte `damage` yok |
| Ensnaring Strike (`ensnaring-strike`) | 1 | kısmi (otomatik) |  | menzil 5 ft ≠ SRD Self (gösterim: Self kökenli alan/dokunma); SRD 1d6 piercing hasarı; mekanikte `damage` yok |
| Ice Knife (`ice-knife`) | 1 | kısmi (otomatik) |  | SRD dex save; mekanikte `save` yok (tür attack) |
| Pass without Trace (`pass-without-trace`) | 2 | kısmi (otomatik) |  | SRD alanı emanation 30 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Phantasmal Force (`phantasmal-force`) | 2 | kısmi (otomatik) |  | SRD alanı cube 10 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Slow (`slow`) | 3 | kısmi (otomatik) |  | SRD alanı cube 40 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Aura of Life (`aura-of-life`) | 4 | kısmi (otomatik) |  | SRD alanı emanation 30 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Conjure Minor Elementals (`conjure-minor-elementals`) | 4 | kısmi (otomatik) |  | SRD alanı emanation 15 ft; oyunda alan tanımı yok (tek hedef ya da elle); yukarı slot ayrı kod yolunda (güçlendirme zarı: executeBuff `upcastDice`) |
| Dimension Door (`dimension-door`) | 4 | kısmi (otomatik) |  | SRD 4d6 force hasarı; mekanikte `damage` yok |
| Arcane Hand (`arcane-hand`) | 5 | kısmi (otomatik) |  | SRD melee büyü saldırısı; mekanik türü summon; SRD 5d8 force hasarı; mekanikte `damage` yok |
| Mass Cure Wounds (`mass-cure-wounds`) | 5 | kısmi (otomatik) |  | SRD alanı sphere 30 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Prismatic Spray (`prismatic-spray`) | 7 | kısmi (otomatik) |  | SRD alanı cone 60 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Antimagic Field (`antimagic-field`) | 8 | kısmi (otomatik) |  | SRD alanı emanation 10 ft; oyunda alan tanımı yok (tek hedef ya da elle) |
| Holy Aura (`holy-aura`) | 8 | kısmi (otomatik) |  | SRD alanı emanation 30 ft; oyunda alan tanımı yok (tek hedef ya da elle); maliyetli materyal 1000+ GP (oyunda bileşen modeli yok) |
| Power Word Kill (`power-word-kill`) | 9 | kısmi (otomatik) |  | SRD 12d12 psychic hasarı; mekanikte `damage` yok |
| Wish (`wish`) | 9 | kısmi (otomatik) |  | SRD 1d10 necrotic hasarı; mekanikte `damage` yok |

### Savaş dışı (gerekçe veride `gmNote`)

`druidcraft`, `elementalism`, `mage-hand`, `mending`, `message`, `minor-illusion`, `prestidigitation`, `thaumaturgy`, `alarm`, `comprehend-languages`, `create-or-destroy-water`, `detect-evil-and-good`, `detect-magic`, `detect-poison-and-disease`, `disguise-self`, `floating-disk`, `goodberry`, `identify`, `illusory-script`, `purify-food-and-drink`, `silent-image`, `speak-with-animals`, `unseen-servant`, `animal-messenger`, `arcane-lock`, `arcanists-magic-aura`, `augury`, `detect-thoughts`, `enhance-ability`, `enthrall`, `find-traps`, `gentle-repose`, `knock`, `locate-animals-or-plants`, `locate-object`, `magic-mouth`, `prayer-of-healing`, `rope-trick`, `zone-of-truth`, `clairvoyance`, `create-food-and-water`, `glyph-of-warding`, `magic-circle`, `major-image`, `meld-into-stone`, `nondetection`, `sending`, `speak-with-dead`, `speak-with-plants`, `tiny-hut`, `tongues`, `water-breathing`, `arcane-eye`, `divination`, `fabricate`, `hallucinatory-terrain`, `locate-creature`, `private-sanctum`, `secret-chest`, `awaken`, `commune`, `commune-with-nature`, `contact-other-plane`, `creation`, `dream`, `geas`, `hallow`, `legend-lore`, `planar-binding`, `raise-dead`, `reincarnate`, `scrying`, `seeming`, `telepathic-bond`, `teleportation-circle`, `contingency`, `create-undead`, `find-the-path`, `forbiddance`, `guards-and-wards`, `heroes-feast`, `instant-summons`, `magic-jar`, `move-earth`, `planar-ally`, `programmed-illusion`, `transport-via-plants`, `wind-walk`, `word-of-recall`, `magnificent-mansion`, `mirage-arcane`, `project-image`, `regenerate`, `resurrection`, `sequester`, `simulacrum`, `symbol`, `teleport`, `animal-shapes`, `antipathy-sympathy`, `clone`, `control-weather`, `demiplane`, `tsunami`, `astral-projection`, `foresight`, `gate`, `imprisonment`, `true-resurrection`

<!-- otomatik:bitir -->
