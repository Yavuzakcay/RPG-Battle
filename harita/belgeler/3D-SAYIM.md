# 3D sayımı (Görev 3D-SAYIM)

Yalnız okuma; 2026-11-28, `origin/birlesik`. Kod, veri ve mekanik değişmedi. MB = 10⁶ bayt.

## 1) 3D gerektiren eşyalar

Kaynaklar (toplam 819 kayıt, çakışma yok):

- taban: `data/weapons.json` 38, `data/armor.json` 13 ("Zırhsız" hariç)
- SRD: `data/items-srd.json` 376 + `data/items.json` 23
- katalog: `data/items-katalog.json` 369

`public/esya/` altında 821 ikon var (`kucuk/` 820).

Sınıflandırma şöyle yapıldı:

- katalog eşyası: `katalog.tur` + `katalog.yuva`
- SRD eşyası: `data/esya-kategori.json` `srd` türü (Armor/Shield/Weapon/Staff/Wand/Rod/Potion/Ring/Wondrous) + ad sözcükleri
- taban silah: Club, Greatclub ve Quarterstaff asa-sopa sayıldı

| Kategori | Taban | SRD | Katalog | Toplam | Bunlardan SRD varyantı¹ |
|---|---:|---:|---:|---:|---:|
| Silah | 35 | 32 | 107 | **174** | 5 |
| Kalkan | 1 | 9 | 12 | **22** | 3 |
| Zırh | 12 | 28 | 41 | **81** | 21 |
| Asa / sopa / değnek | 3 | 35 | 16 | **54** | 3 |
| Enstrüman | 0 | 4 | 0 | **4** | 0 |
| Başlık / miğfer | 0 | 8 | 18 | **26** | 0 |
| Diğer görünür (pelerin, cüppe, çanta, kanat) | 0 | 19 | 11 | **30** | 0 |
| **Toplam görünür** | **51** | **135** | **205** | **391** | **32** |
| Sınırda (aşağıda) | 0 | 60 | 43 | **103** | — |
| 3D dışı | 0 | 204 | 121 | **325** | — |
| **Hepsi** | 51 | 399 | 369 | **819** | |

¹ SRD'de herhangi bir taban silaha, zırha ya da kalkana uygulanan kayıt (karar değil, bilgi):

- silah: Weapon +1/+2/+3, Vicious Weapon, Weapon of Warning
- zırh: Armor +1/+2/+3, Armor of Resistance ×13, Armor of Vulnerability ×3, Adamantine, Mithral
- kalkan: Shield +1/+2/+3
- asa: Wand of the War Mage +1/+2/+3

Kategori ayrıntıları:

- **Asa / sopa / değnek:**
  - SRD: Wand 15, Staff 12, Rod 6, Immovable Rod 1, Quarterstaff of the Acrobat 1
  - katalog: 13 asa, 2 sopa, Battering Ram Staff
- **Enstrüman:** Horn of Blasting, Horn of Valhalla, Pipes of Haunting, Pipes of the Sewers. SRD `tools.json`'daki tek "Musical Instrument" kaydı oyunda eşya olarak yok. Katalogda enstrüman yok.
- **Başlık:**
  - SRD: Helm ×4, Hat ×2, Circlet of Blasting, Headband of Intellect
  - katalog: 4 miğfer, 5 taç/diadem (circlet), 3 kukuleta/başlık, 2 taç (crown), 2 maske, 2 şapka
- **Diğer görünür:**
  - SRD: Backpack, Bag of Holding, Handy Haversack, Efficient Quiver, Cloak ×7, Cape of the Mountebank, Mantle of Spell Resistance, Robe ×5, Wings of Flying
  - katalog: 11 pelerin
- **3D dışı:** iksir, parşömen, yüzük, kolye/tılsım, mücevher yuvası taşları, cephane, katalog tüketilebilirleri (özel ok, kaplama, eliksir) ve savaş dışı donanım (ip, kürek, merdiven, kelepçe, zincir…).

### Sınırda kalanlar (karar verilmedi)

| Grup | SRD | Katalog | Toplam | Kayıtlar |
|---|---:|---:|---:|---|
| Ayak (bot, sandalet, terlik, ayak sargısı) | 7 | 13 | 20 | Boots of Elvenkind, Boots of Levitation, Boots of Striding and Springing, Boots of the Winterlands, Slippers of Spider Climbing, Winged Boots, Boots of Speed; Gale Footwraps, Darkstep, Unyielding, Frostspike, Skyvault, Rushstrike, Stormstep, Steadyfocus, Springvault, Sparkstride, Mirestrider Boots, Waterskipper Sandals, Windstep Sandals |
| El / kol (eldiven, eldiven-zırh, bileklik, el sargısı) | 6 | 15 | 21 | Bracers of Archery, Bracers of Defense, Gloves of Missile Snaring, Gloves of Swimming and Climbing, Gloves of Thievery, Gauntlets of Ogre Power; Dryleaf Handwraps, Soulcatcher / Blazing Fist / Luminous Gauntlets, Daredevil Bracers, Compass / Spellquick / Skythunder / Slingmaster / Twinhand / Winterclaw / Warding Healer / Ichorous / Dexterous Silk / Sparkhand Gloves |
| Kemer | 7 | 0 | 7 | Belt of Hill / Stone / Frost / Fire / Cloud / Storm Giant Strength, Belt of Dwarvenkind |
| Göz (gözlük, mercek) | 4 | 0 | 4 | Eyes of Charming, Eyes of Minute Seeing, Eyes of the Eagle, Goggles of Night |
| Zırhsız giysi (katalog `zirh/zırhsız` + SRD giysi) | 4 | 10 | 14 | Robe, Clothes Fine, Clothes Traveler's, Costume; Weavewoven Robe, Resonant Caster Robe, Robe of Supreme Focus, Soulmender Monk Vest, Tidecaller Robe, Nimble Cat Tunic, Venomweaver Robe, Vigil Shroud Robe, Robe of the Blindspot, Champion's Crag Harness |
| Büyü odağı / kutsal simge / küre | 10 | 0 | 10 | Arcane Focus, Druidic Focus, Holy Symbol, Component Pouch, Crystal Ball ×4, Dragon Orb, Ioun Stone |
| Işık (meşale, fener, lamba) | 5 | 0 | 5 | Torch, Bullseye Lantern, Hooded Lantern, Lamp, Lantern of Revealing |
| Küçük çanta, kese, paket, sadak | 13 | 0 | 13 | Burglar's / Diplomat's / Dungeoneer's / Entertainer's / Explorer's / Priest's / Scholar's Pack, Pouch, Sack, Quiver, Bag of Beans, Bag of Devouring, Bag of Tricks |
| Binek benzeri | 2 | 0 | 2 | Broom of Flying, Carpet of Flying |
| Elde tutulan / fırlatılan diğer | 2 | 5 | 7 | Net, Wind Fan; Ember / Storm / Frost Perfume Bottle (katalog `silah`, simya şişesi), Gem Dragon Egg, Ember Egg |
| **Toplam** | **60** | **43** | **103** | |

## 2) Mevcut jeton boyutu

| Klasör | Dosya | Toplam | Not |
|---|---:|---:|---|
| `public/characters/` (alt klasörler dahil) | 8 086 | 83,71 MB | aşağıda dağılımı |
| ├ kök (jetonlar, 256×256) | 2 876 | 68,93 MB | ort. 23 966 B, medyan 20 158 B (11,7–83,9 kB) |
| ├ `kucuk/` (96×96) | 2 876 | 13,26 MB | ort. 4 610 B |
| ├ `maske/` | 2 024 | 1,26 MB | |
| ├ `maske-pul/` | 266 | 0,22 MB | |
| ├ `maske-el/` | 38 | 0,02 MB | |
| └ `bas/` | 6 | 0,02 MB | |
| `public/boss/` | 55 | 3,83 MB | ort. 69 635 B; uzun kenar ≈512 px (ör. 512×484, 496×512, 512×309) |
| `public/masumlar/` | 8 | 0,06 MB | 128×128 |
| **Üçü toplam** | **8 149** | **87,60 MB** | |
| (bilgi) `public/monsters/` | 352 | 6,54 MB | 256×256, ort. 18 586 B |

- **Bir jeton webp'inin ortalama boyutu:** 23 966 B ≈ **24,0 kB** (karakter jetonu, 256×256). Küçük kopyası 4,6 kB.
- **`public/` toplamı:** 11 563 dosya, **191,96 MB**; hepsi git'te izleniyor. `characters/` bunun %43,6'sı.
- **Paket / APK tahmini:**
  - `docs/BUNDLE.md` yalnız ana JS parçasını kaydediyor: 436,24 kB (2026-11-20; CLAUDE.md'deki son ölçüm 459,74 kB).
  - Toplam `dist/` ya da APK boyutu belgede yok. Görev kuralı gereği build çalıştırılmadı, yani ölçülmedi.
  - Paketin büyük kısmı `public/`: 191,96 MB + ölçülmemiş JS parçaları.

## 3) Mevcut jeton yapısı

- **Karakter jetonu tek görsel, tek kare, tek çizim yönü.**
  - Dosya `public/characters/<ırk>-<cinsiyet>-<sınıf>-<kod>.webp` (256×256); rozetler için 96 px'lik `kucuk/` kopyası.
  - Yön, aynı görselin SVG'de yatay aynalanmasıyla elde ediliyor (`scale(-1 1)`, `src/ui/Avatar.tsx` `TokenFigure`). Görünür iki yön var (sağ/sol), görsel bir tane.
  - Doğal yönü sola çizilmiş jetonlar (`data/jeton-ayna.json`, 4 satır) `naturalLeft` ile önce aynalanıyor.
  - Savaşta yön en yakın düşmana göre seçiliyor (`src/ui/tokenFacing.ts` `facesLeft`).
- **Kare animasyonu yok.**
  - Jeton yalnız CSS "breathe" ölçek nabzı alıyor (3,2 sn, %2–3,5; hareketi azaltta kapalı).
  - Durum efektleri jetonun üstünde ayrı katman (statusFx döngü sprite'ları, öfke sarsıntısı).
  - Kanat katmanı için kodda 8 karelik sayfa desteği var (`wing.sprite`), ama `data/kanat-esleme.json`'da bunu kullanan kanat yok.
- **Hareket ederken jeton sabit.**
  - Konum doğrudan altıgen merkezine yazılıyor (`cx`/`cy`); geçiş ya da ara kare yok, jeton yeni altıgende çiziliyor ve yönü yeniden hesaplanıyor.
  - Görsel yalnız durumla değişiyor:
    - uyuyan canavarda `-uyku` görseli
    - uçarken kanat katmanı
    - soy boyası / maske
    - mahkûm kıyafeti
    - durum filtreleri
- **`src/ui/sprites.ts` jetonla ilgili değil.** Yüzey ve nesne sprite'larını çiziyor (varyant, döndürme ve ayna altıgen hash'iyle).
- **Canavar ve boss jetonları aynı yapıda.**
  - Aynı yoldan çiziliyorlar (`AvatarCircle` → `TokenFigure`): tek kare, aynı ayna ve aynı breathe.
  - Canavar dosyası `public/monsters/<id>.webp` (256×256; 352 dosyanın 22'si `-uyku`). Boss dosyası `public/boss/*.webp` (55; kayıttaki `avatar` alanıyla).
  - `jetonOlcek` yalnız görsel ölçeği değiştiriyor.
  - Farkı: karakterin görünüm katmanları (soy boyası, kanat, taç) canavar ve boss jetonunda yok. Boss görselleri kare değil, uzun kenarı ≈512 px.
