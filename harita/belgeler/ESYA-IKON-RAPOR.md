# Eşya ikon raporu

`npm run esya-ikon` (scripts/esya-ikon.mjs) → `npm run esya-ikon:rapor` (scripts/esya-ikon-rapor.ts) üretir; elle düzenlenmez.
Manifest `data/esya-ikon-sayfalar.json`, ham sayfalar `assets-ham/esya/` (depo dışı), kontrol görselleri `harita/belgeler/ESYA-IKON-KONTROL/<sayfa>.png`.

## Belirsiz (manifestten)

- **duzeltme-5**: hücre 5 ring-of-free-action ve 6 wand-of-web tahmindir; 3 potion-of-animal-friendship (duzeltme-2'yi ezer)
- **silah-1#16**: çift ağızlı balta greataxe + battleaxe'a kopyalandı (battleaxe için ayrı ikon yok)
- **ikonsuz_beklenen**: `mace`, `light-crossbow`, `lance`
- **duzeltme-8**: hücre 1 spear (silah-1 #9'u ezer), 3 dart, 4 longsword, 6 war-pick (silah-2 #11'i ezer)

## Özet

- İşlenen sayfa: 38 (yoksayılan: `zirh-donanim`, `duzeltme-1`, `pilot`, `glif-1`, `glif-2`).
- Oyun eşya kaydı: 449 (sihirli 319 + donanım 80 + silah 38 + zırh 12); ikonlu **444**, ikonsuz **5**.
- `public/esya/`: yalnız oyun kayıtları, 444 × 256 px + 444 × 96 px, toplam **9.0 MB** (256 px 7319 kB, 96 px 1868 kB). Ana parçaya girmez.
- Varyant eşlendi **15**, eşleşmeyen **64**, belirsiz **0**; SRD üst kimliği kopyası **11** kimlik → 57 kayıt; kayıtsız (yazılmadı) **89** (64 eşleşmeyen varyant + 25 diğer).
- Ezilen hücre: 63. `ayniGorsel` uygulanamayan: potions-of-healing: kaynak kimliğin hücresi yok (potion-of-healing kopyalanmadı).
- Tam despill (cam içi yeşil ton): `potion-of-healing`, `potions-of-healing/greater`, `potions-of-healing/superior`.

## Yeniden üretilecek (2)

- **varyant-1#4** potions-of-healing/supreme: şişenin arkasında silah sapı; şişeye bitişik, bileşen ya da kırpmayla ayrılmıyor
- **donanim-05#3** spyglass: dürbünün arkasında balta ağzı; dürbüne bitişik, bileşen ya da kırpmayla ayrılmıyor

## İkonu olmayan oyun kayıtları (5)

- **sihirli** (0): —
- **donanım** (0): —
- **silah** (5): `dagger`, `mace`, `light-crossbow`, `warhammer`, `lance`
- **zırh** (0): —

Yeni Gemini sayfası bu liste için yazılacak.

## Varyant eşleme (15)

Kural (oyun kayıtlarından): `<ana>/<varyant>` → `srd` kimliği `<ana>` olan açılmış oyun kayıtlarından kimliğinde `<varyant>` tire sınırlı parça olarak geçen tek kayıt. Tek aday yoksa eşleşmez, birden çoksa belirsiz; ikisi de bağlanmaz.

| Manifest | Oyun kaydı |
|---|---|
| `potions-of-healing/greater` | `potion-of-greater-healing` |
| `potions-of-healing/superior` | `potion-of-superior-healing` |
| `potions-of-healing/supreme` | `potion-of-supreme-healing` |
| `potion-of-giant-strength/hill` | `potion-of-hill-giant-strength` |
| `potion-of-giant-strength/frost` | `potion-of-frost-giant-strength` |
| `potion-of-giant-strength/stone` | `potion-of-stone-giant-strength` |
| `potion-of-giant-strength/fire` | `potion-of-fire-giant-strength` |
| `potion-of-giant-strength/cloud` | `potion-of-cloud-giant-strength` |
| `potion-of-giant-strength/storm` | `potion-of-storm-giant-strength` |
| `belt-of-giant-strength/hill` | `belt-of-hill-giant-strength` |
| `belt-of-giant-strength/frost` | `belt-of-frost-giant-strength` |
| `belt-of-giant-strength/stone` | `belt-of-stone-giant-strength` |
| `belt-of-giant-strength/fire` | `belt-of-fire-giant-strength` |
| `belt-of-giant-strength/cloud` | `belt-of-cloud-giant-strength` |
| `belt-of-giant-strength/storm` | `belt-of-storm-giant-strength` |

### Eşleşmeyen (64; bağlanmadı)

- `elemental-gem/blue-sapphire`: oyunda açılmış varyant kaydı yok
- `elemental-gem/yellow-diamond`: oyunda açılmış varyant kaydı yok
- `elemental-gem/red-corundum`: oyunda açılmış varyant kaydı yok
- `elemental-gem/emerald`: oyunda açılmış varyant kaydı yok
- `bag-of-tricks/gray`: oyunda açılmış varyant kaydı yok
- `bag-of-tricks/rust`: oyunda açılmış varyant kaydı yok
- `horn-of-valhalla/silver`: oyunda açılmış varyant kaydı yok
- `horn-of-valhalla/brass`: oyunda açılmış varyant kaydı yok
- `horn-of-valhalla/bronze`: oyunda açılmış varyant kaydı yok
- `horn-of-valhalla/iron`: oyunda açılmış varyant kaydı yok
- `bag-of-tricks/tan`: oyunda açılmış varyant kaydı yok
- `ioun-stone/rose-prism`: oyunda açılmış varyant kaydı yok
- `ioun-stone/indigo-sphere`: oyunda açılmış varyant kaydı yok
- `ioun-stone/pearly-spindle`: oyunda açılmış varyant kaydı yok
- `ioun-stone/scarlet-and-blue-sphere`: oyunda açılmış varyant kaydı yok
- `ioun-stone/pale-prism`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/bronze-griffon`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/ebony-fly`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/golden-lions`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/ivory-goats`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/marble-elephant`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/obsidian-steed`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/onyx-dog`: oyunda açılmış varyant kaydı yok
- `figurine-of-wondrous-power/serpentine-owl`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/black`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/blue`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/brass`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/bronze`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/copper`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/gold`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/green`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/red`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/silver`: oyunda açılmış varyant kaydı yok
- `dragon-scale-mail/white`: oyunda açılmış varyant kaydı yok
- `ammunition/arrows`: oyunda açılmış varyant kaydı yok
- `ammunition/crossbow-bolts`: oyunda açılmış varyant kaydı yok
- `ammunition/sling-bullets`: oyunda açılmış varyant kaydı yok
- `ammunition/blowgun-needles`: oyunda açılmış varyant kaydı yok
- `arcane-focus/crystal`: oyunda açılmış varyant kaydı yok
- `arcane-focus/orb`: oyunda açılmış varyant kaydı yok
- `arcane-focus/rod`: oyunda açılmış varyant kaydı yok
- `arcane-focus/staff`: oyunda açılmış varyant kaydı yok
- `arcane-focus/wand`: oyunda açılmış varyant kaydı yok
- `druidic-focus/sprig-of-mistletoe`: oyunda açılmış varyant kaydı yok
- `druidic-focus/totem`: oyunda açılmış varyant kaydı yok
- `druidic-focus/wooden-staff`: oyunda açılmış varyant kaydı yok
- `druidic-focus/yew-wand`: oyunda açılmış varyant kaydı yok
- `holy-symbol/amulet`: oyunda açılmış varyant kaydı yok
- `holy-symbol/emblem`: oyunda açılmış varyant kaydı yok
- `holy-symbol/reliquary`: oyunda açılmış varyant kaydı yok
- `gaming-set/dice`: oyunda açılmış varyant kaydı yok
- `gaming-set/dragonchess`: oyunda açılmış varyant kaydı yok
- `gaming-set/playing-cards`: oyunda açılmış varyant kaydı yok
- `gaming-set/three-dragon-ante`: oyunda açılmış varyant kaydı yok
- `musical-instrument/bagpipes`: oyunda açılmış varyant kaydı yok
- `musical-instrument/drum`: oyunda açılmış varyant kaydı yok
- `musical-instrument/dulcimer`: oyunda açılmış varyant kaydı yok
- `musical-instrument/flute`: oyunda açılmış varyant kaydı yok
- `musical-instrument/horn`: oyunda açılmış varyant kaydı yok
- `musical-instrument/lute`: oyunda açılmış varyant kaydı yok
- `musical-instrument/lyre`: oyunda açılmış varyant kaydı yok
- `musical-instrument/pan-flute`: oyunda açılmış varyant kaydı yok
- `musical-instrument/shawm`: oyunda açılmış varyant kaydı yok
- `musical-instrument/viol`: oyunda açılmış varyant kaydı yok

### Belirsiz (0; bağlanmadı)

—

## SRD üst kimliği kopyaları (11)

Üst kimliğin ikonu, kendi varyant ikonu olmayan bütün açılmış kayıtlara kopyalanır.

- `ammunition-1-2-or-3` → `ammunition-1`, `ammunition-2`, `ammunition-3`
- `weapon-1-2-or-3` → `weapon-1`, `weapon-2`, `weapon-3`
- `armor-1-2-or-3` → `armor-1`, `armor-2`, `armor-3`
- `armor-of-resistance` → `armor-of-resistance-acid`, `armor-of-resistance-bludgeoning`, `armor-of-resistance-cold`, `armor-of-resistance-fire`, `armor-of-resistance-force`, `armor-of-resistance-lightning`, `armor-of-resistance-necrotic`, `armor-of-resistance-piercing`, `armor-of-resistance-poison`, `armor-of-resistance-psychic`, `armor-of-resistance-radiant`, `armor-of-resistance-slashing`, `armor-of-resistance-thunder`
- `armor-of-vulnerability` → `armor-of-vulnerability-bludgeoning`, `armor-of-vulnerability-piercing`, `armor-of-vulnerability-slashing`
- `shield-1-2-or-3` → `shield-1`, `shield-2`, `shield-3`
- `wand-of-the-war-mage-1-2-or-3` → `wand-of-the-war-mage-1`, `wand-of-the-war-mage-2`, `wand-of-the-war-mage-3`
- `ring-of-resistance` → `ring-of-resistance-acid`, `ring-of-resistance-bludgeoning`, `ring-of-resistance-cold`, `ring-of-resistance-fire`, `ring-of-resistance-force`, `ring-of-resistance-lightning`, `ring-of-resistance-necrotic`, `ring-of-resistance-piercing`, `ring-of-resistance-poison`, `ring-of-resistance-psychic`, `ring-of-resistance-radiant`, `ring-of-resistance-slashing`, `ring-of-resistance-thunder`
- `potion-of-giant-strength` → — (hepsinin kendi varyant ikonu var)
- `potion-of-resistance` → `potion-of-resistance-acid`, `potion-of-resistance-bludgeoning`, `potion-of-resistance-cold`, `potion-of-resistance-fire`, `potion-of-resistance-force`, `potion-of-resistance-lightning`, `potion-of-resistance-necrotic`, `potion-of-resistance-piercing`, `potion-of-resistance-poison`, `potion-of-resistance-psychic`, `potion-of-resistance-radiant`, `potion-of-resistance-slashing`, `potion-of-resistance-thunder`
- `belt-of-giant-strength` → — (hepsinin kendi varyant ikonu var)

## Kayıtsız (25 + 64 eşleşmeyen varyant)

Oyunda kaydı yok; ikon üretilir ama `public/esya/`'ya yazılmaz (kontrol görselinde gri "kayıtsız"): `alchemists-supplies`, `brewers-supplies`, `calligraphers-supplies`, `carpenters-tools`, `cartographers-tools`, `cobblers-tools`, `cooks-utensils`, `disguise-kit`, `forgery-kit`, `gaming-set`, `glassblowers-tools`, `herbalism-kit`, `jewelers-tools`, `leatherworkers-tools`, `masons-tools`, `musical-instrument`, `navigators-tools`, `painters-supplies`, `potters-tools`, `shield`, `smiths-tools`, `thieves-tools`, `tinkers-tools`, `weavers-tools`, `woodcarvers-tools`.

## SRD 258 ↔ oyun 319 sihirli eşya

SRD dosyasında 258 kayıt var; oyun (`data/items.json` + `data/items-srd.json`) bazı SRD kayıtlarını varyantlarına açıyor, birkaçını tek kayıt olarak yeniden adlandırıyor. Fark 319 − 258 = **61**.

| SRD kimliği | Oyun kayıtları | Fazla |
|---|---|---|
| `ammunition-1-2-or-3` | `ammunition-1`, `ammunition-2`, `ammunition-3` | 2 |
| `armor-1-2-or-3` | `armor-1`, `armor-2`, `armor-3` | 2 |
| `armor-of-resistance` | `armor-of-resistance-acid`, `armor-of-resistance-bludgeoning`, `armor-of-resistance-cold`, `armor-of-resistance-fire`, `armor-of-resistance-force`, `armor-of-resistance-lightning`, `armor-of-resistance-necrotic`, `armor-of-resistance-piercing`, `armor-of-resistance-poison`, `armor-of-resistance-psychic`, `armor-of-resistance-radiant`, `armor-of-resistance-slashing`, `armor-of-resistance-thunder` | 12 |
| `armor-of-vulnerability` | `armor-of-vulnerability-bludgeoning`, `armor-of-vulnerability-piercing`, `armor-of-vulnerability-slashing` | 2 |
| `belt-of-giant-strength` | `belt-of-hill-giant-strength`, `belt-of-cloud-giant-strength`, `belt-of-fire-giant-strength`, `belt-of-frost-giant-strength`, `belt-of-stone-giant-strength`, `belt-of-storm-giant-strength` | 5 |
| `potion-of-giant-strength` | `potion-of-cloud-giant-strength`, `potion-of-fire-giant-strength`, `potion-of-frost-giant-strength`, `potion-of-hill-giant-strength`, `potion-of-stone-giant-strength`, `potion-of-storm-giant-strength` | 5 |
| `potion-of-resistance` | `potion-of-resistance-acid`, `potion-of-resistance-bludgeoning`, `potion-of-resistance-cold`, `potion-of-resistance-fire`, `potion-of-resistance-force`, `potion-of-resistance-lightning`, `potion-of-resistance-necrotic`, `potion-of-resistance-piercing`, `potion-of-resistance-poison`, `potion-of-resistance-psychic`, `potion-of-resistance-radiant`, `potion-of-resistance-slashing`, `potion-of-resistance-thunder` | 12 |
| `potions-of-healing` | `potion-of-greater-healing`, `potion-of-healing`, `potion-of-superior-healing`, `potion-of-supreme-healing` | 3 |
| `ring-of-resistance` | `ring-of-resistance-acid`, `ring-of-resistance-bludgeoning`, `ring-of-resistance-cold`, `ring-of-resistance-fire`, `ring-of-resistance-force`, `ring-of-resistance-lightning`, `ring-of-resistance-necrotic`, `ring-of-resistance-piercing`, `ring-of-resistance-poison`, `ring-of-resistance-psychic`, `ring-of-resistance-radiant`, `ring-of-resistance-slashing`, `ring-of-resistance-thunder` | 12 |
| `shield-1-2-or-3` | `shield-1`, `shield-2`, `shield-3` | 2 |
| `wand-of-the-war-mage-1-2-or-3` | `wand-of-the-war-mage-1`, `wand-of-the-war-mage-2`, `wand-of-the-war-mage-3` | 2 |
| `weapon-1-2-or-3` | `weapon-1`, `weapon-2`, `weapon-3` | 2 |
| **Toplam** | | **61** |

## Ezilen hücreler (63)

Sonraki sayfa öncekini ezer (manifest sırası).

- `musket`: silah-2#15 → silah-3#5
- `pistol`: silah-2#16 → silah-3#6
- `bead-of-force`: sihirli-09#11 → duzeltme-2#1
- `handy-haversack`: sihirli-13#2 → duzeltme-2#2
- `mithral-armor`: sihirli-03#14 → duzeltme-2#3
- `boots-of-levitation`: sihirli-09#16 → duzeltme-2#4
- `potion-of-vitality`: sihirli-08#16 → duzeltme-2#5
- `amulet-of-proof-against-detection-and-location`: sihirli-09#4 → duzeltme-2#6
- `amulet-of-the-planes`: sihirli-09#5 → duzeltme-2#7
- `talisman-of-ultimate-evil`: sihirli-16#6 → duzeltme-2#8
- `ring-of-invisibility`: sihirli-06#11 → duzeltme-2#9
- `potion-of-invisibility`: sihirli-08#9 → duzeltme-2#10
- `cloak-of-invisibility`: sihirli-11#3 → duzeltme-2#11
- `sphere-of-annihilation`: sihirli-16#1 → duzeltme-2#12
- `potion-of-animal-friendship`: sihirli-07#16 → duzeltme-2#13
- `potion-of-giant-strength`: sihirli-08#6 → duzeltme-2#14
- `potion-of-diminution`: sihirli-08#3 → duzeltme-2#15
- `wand-of-paralysis`: sihirli-05#15 → duzeltme-2#16
- `wand-of-magic-detection`: sihirli-05#13 → duzeltme-3#1
- `ring-of-water-walking`: sihirli-07#9 → duzeltme-3#2
- `staff-of-thunder-and-lightning`: sihirli-05#6 → duzeltme-3#3
- `rod-of-alertness`: sihirli-04#7 → duzeltme-3#4
- `arrow-catching-shield`: sihirli-03#8 → duzeltme-3#5
- `ring-of-evasion`: sihirli-06#8 → duzeltme-3#6
- `dragon-slayer`: sihirli-01#7 → duzeltme-3#7
- `cubic-gate`: sihirli-11#9 → duzeltme-3#8
- `helm-of-comprehending-languages`: sihirli-13#7 → duzeltme-3#9
- `staff-of-healing`: sihirli-04#15 → duzeltme-3#10
- `potion-of-heroism`: sihirli-08#8 → duzeltme-3#11
- `potion-of-mind-reading`: sihirli-08#12 → duzeltme-3#12
- `brooch-of-shielding`: sihirli-10#8 → duzeltme-3#13
- `ring-of-mind-shielding`: sihirli-06#13 → duzeltme-3#14
- `rod-of-security`: sihirli-04#11 → duzeltme-3#15
- `vicious-weapon`: sihirli-02#14 → duzeltme-3#16
- `holy-water`: donanim-03#2 → duzeltme-4#1
- `case-crossbow-bolt`: donanim-02#1 → duzeltme-4#2
- `glassblowers-tools`: donanim-05#15 → duzeltme-4#3
- `acid`: donanim-01#1 → duzeltme-4#4
- `bottle-glass`: donanim-01#12 → duzeltme-4#5
- `lantern-hooded`: donanim-03#10 → duzeltme-4#6
- `magnifying-glass`: donanim-03#12 → duzeltme-4#7
- `jewelers-tools`: donanim-05#16 → duzeltme-4#8
- `poison-basic`: donanim-04#5 → duzeltme-4#9
- `lantern-hooded`: duzeltme-4#6 → duzeltme-5#1
- `efficient-quiver`: sihirli-12#1 → duzeltme-5#2
- `potion-of-animal-friendship`: duzeltme-2#13 → duzeltme-5#3
- `potion-of-heroism`: duzeltme-3#11 → duzeltme-5#4
- `ring-of-free-action`: sihirli-06#10 → duzeltme-5#5
- `wand-of-web`: sihirli-06#3 → duzeltme-5#6
- `potion-of-poison`: sihirli-08#13 → duzeltme-6#1
- `potion-of-healing`: varyant-1#1 → duzeltme-7#1
- `potion-of-greater-healing`: varyant-1#2 → duzeltme-7#2
- `potion-of-superior-healing`: varyant-1#3 → duzeltme-7#3
- `belt-of-hill-giant-strength`: varyant-2#1 → duzeltme-7#4
- `belt-of-frost-giant-strength`: varyant-2#2 → duzeltme-7#5
- `belt-of-stone-giant-strength`: varyant-2#3 → duzeltme-7#6
- `belt-of-fire-giant-strength`: varyant-2#4 → duzeltme-7#7
- `belt-of-cloud-giant-strength`: varyant-2#5 → duzeltme-7#8
- `belt-of-storm-giant-strength`: varyant-2#6 → duzeltme-7#9
- `spear`: silah-1#9 → duzeltme-8#1
- `dart`: silah-1#10 → duzeltme-8#3
- `trident`: silah-2#10 → duzeltme-8#5
- `war-pick`: silah-2#11 → duzeltme-8#6

## Kontak sayfaları (96 px)

Oyun kayıtları; mavi etiket: üst kimlikten kopya.

- [ESYA-IKON-KONTAK-1.png](ESYA-IKON-KONTAK-1.png)
- [ESYA-IKON-KONTAK-2.png](ESYA-IKON-KONTAK-2.png)
- [ESYA-IKON-KONTAK-3.png](ESYA-IKON-KONTAK-3.png)
- [ESYA-IKON-KONTAK-4.png](ESYA-IKON-KONTAK-4.png)
