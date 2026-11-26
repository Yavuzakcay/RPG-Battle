# KATALOG-IKON-DUZELTME — kusurlu katalog ikonları için düzeltme sayfaları

Görev KATALOG-IKON-AKTAR-2. `node scripts/katalog-ikon-kusur.mjs --duzeltme` üretir (elle düzenlenmez). Kaynak: `harita/belgeler/KATALOG-IKON-KUSUR.md`
kusur satırları (belirsizler dahil değil). 99 hücre, 7 sayfa; manifestte `katalog-duzeltme-NN` sayfaları en sonda,
üretilen görsel ilk sayfadaki hücrenin yerine geçer (sonraki sayfa ezer). Görsel yoksa betik sayfayı atlar.

Prompt = `KATALOG-IKON-PROMPTLAR.md` bölüm 6 ortak bloğu; tek değişiklik: "thin soft glow hugging its silhouette" satırının yerine
dış parıltı/hale yasağı (ışıltı yalnız silüetin içinde, zemin tek düz #FF00FF). Hücre tarifleri eski `gorunum` metni.

Kullanım: promptu Gemini'ye yapıştır, çıktıyı `assets-ham/esya/<dosya>` olarak kaydet, sonra
`npm run esya-ikon -- --manifest data/katalog-ikon-sayfalar.json --sayfa katalog-duzeltme-01`.

## 1. `katalog-duzeltme-01.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Huge two-handed greatsword with a broad, slightly flared steel blade notched like a giant's broken tooth, a heavy square dark-iron crossguard, a long leather-wrapped grip and a round pommel, faint warm gold glow.
2. Two-handed greatsword forged from dark speckled meteorite steel with tiny glinting white star flecks along the blade, a crescent-shaped crossguard and a cool pale-teal glow along the edge.
3. Greatsword with a dark steel blade whose central fuller glows like live embers, thin orange heat cracks along the edge, a soot-blackened iron crossguard and a soft orange glow.
4. Greatsword with a pale silver blade curving gently like a crescent moon, frost crystals along the edge and a cold blue moonlight glow.
5. Huge sword-shaped slab carved from a single piece of cracked grey ruin stone with worn ancient carvings, small stone chips floating around it and a faint pale-blue gravity glow.
6. Greatsword forged from golden bone: an ivory-gold blade with sunrise ray patterns, a winged gold crossguard and a warm radiant gold glow.
7. Perfectly balanced knight's greatsword with a polished steel blade, a straight gold crossguard and pommel, a gold-wrapped grip and a faint golden shimmer.
8. A matched pair of crossed greatswords forming an X, dark steel blades flecked with glinting white stars, gold crossguards and a faint pale-blue shimmer.
9. Katana with a scale-patterned blade: one half of the edge glows with orange cinders, the other half is frosted icy blue, with a grey-wrapped grip.
10. Thin rapier with a narrow blade and an open spiral wire cup-hilt shaped like a curled ear, a dark blue grip and faint pale-teal whisper wisps along the blade.
11. Rapier with a thin steel blade and a lyre-shaped swept hilt with tiny strings across the guard, faint golden musical ripples.
12. Black scimitar with a matte dark blade and a thin silver edge, a guard shaped like a small set of judge's scales, and wisps of shadow.
13. Light scimitar whose curved blade is shaped like a feathered wing, dark night-blue metal sprinkled with glittering white stars, trailing faint blue-white stardust.
14. Short sword with a smoked dark-steel blade tapering into a fang-like point, a black iron guard and grip, and dark shadow smoke clinging to the blade.
15. Assassin's dagger with a wavy, wicked kris-style blade, a grip wrapped in black cord and a faint pale-teal haze swirling over the blade.
16. Heavy maul whose head is a block of translucent blue glacier ice bound with iron straps, on a frost-covered haft, with icy cyan mist.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `giantbreaker-blade` | katalog-silah-01#1 | somon hale (%100) |
| 2 | `starcleave` | katalog-silah-01#2 | leylak/pembe hale (%25) |
| 3 | `cinderheart-greatsword` | katalog-silah-01#5 | somon hale (%69) |
| 4 | `frostcrescent-greatsword` | katalog-silah-01#8 | leylak/pembe hale (%61) |
| 5 | `riftbreaker-greatsword` | katalog-silah-01#10 | leylak/pembe hale (%77) |
| 6 | `horizonlight-greatsword` | katalog-silah-01#11 | somon hale (%98) |
| 7 | `golden-poise-greatsword` | katalog-silah-01#13 | somon hale (%83) |
| 8 | `twin-starblades` | katalog-silah-01#14 | leylak/pembe hale (%60) |
| 9 | `cinderfrost-katana` | katalog-silah-02#2 | leylak/pembe hale (%34) |
| 10 | `whispering-rapier` | katalog-silah-02#8 | leylak/pembe hale (%23) |
| 11 | `harmonic-rapier` | katalog-silah-02#9 | macenta cep (84 px) |
| 12 | `nightjudge-scimitar` | katalog-silah-02#14 | macenta cep (357 px) |
| 13 | `nebula-wing-scimitar` | katalog-silah-02#16 | leylak/pembe hale (%77) |
| 14 | `gloomfang` | katalog-silah-03#2 | macenta cep (120 px) |
| 15 | `spiteful-dagger` | katalog-silah-03#8 | leylak/pembe hale (%33) |
| 16 | `glacierbreak-maul` | katalog-silah-04#3 | leylak/pembe hale (%66) |

## 2. `katalog-duzeltme-02.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Heavy maul whose head is a petrified giant sunflower of dark grey stone with stone petals, faint gold light glowing from its center.
2. Warhammer with a square steel head, broken chain links wrapped around the haft and a shattered shackle hanging below the head, faint pale-blue glow.
3. Warhammer with a cracked white marble head bound in steel bands, pale blue force light leaking from the cracks, on a steel haft.
4. Warhammer with a dark steel head bound to its haft by a glowing golden chain of linked abstract runes, small yellow lightning sparks around it.
5. Heavy throwing hammer with a smith's square head stamped with an anvil emblem and forge marks, a short iron haft and a faint orange heat glow.
6. Flanged steel mace whose head carries a round white-stone seal disc stamped with a rising-sun emblem, white cloth ribbons tied below the head, soft pale-gold glow.
7. Morningstar with a polished gold spherical head bristling with sun-ray spikes, glowing warm white-gold daylight, on a white-wrapped steel haft.
8. Chain flail whose spiked iron ball is pitted and crusted with yellow sulfur, dripping dark oily liquid, with faint yellow fumes.
9. Flail with a short handle and two chains, each ending in a glowing pale blue-white star sphere trailing glittering stardust.
10. Long balanced pike with a slim steel point, two small fin-like stabilizers below the head, a polished ash shaft and a faint circular pale-blue swirl.
11. Double-ended weapon: a central wrapped grip with a long golden blade at each end shaped like a spread wing, glowing warm gold.
12. Ancient spear with a gold-and-bronze head shaped like a dragon's fang, crackling with yellow-white lightning, on a dark shaft.
13. Throwing javelin with a bright steel head shaped like a lightning bolt on a slim pale-wood shaft, crackling with yellow electric light.
14. Wizard staff topped with a large cluster of ice crystals, a frost-covered pale wooden shaft, an icy cyan glow and small snowflakes.
15. Tall grand staff of polished white wood with an ornate gold cage at the top holding a large brilliant blue crystal and swirling blue arcane light.
16. Staff topped with a silver tuning-fork-shaped head holding a small floating prism crystal, faint concentric rings of red, blue and yellow light.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `shadowbloom-maul` | katalog-silah-04#6 | somon hale (%66), kenara dayanan parıltı (%5) |
| 2 | `chainbreaker-warhammer` | katalog-silah-04#12 | leylak/pembe hale (%54) |
| 3 | `oathshatter-warhammer` | katalog-silah-04#13 | leylak/pembe hale (%21) |
| 4 | `pactbound-warhammer` | katalog-silah-04#14 | somon hale (%53) |
| 5 | `homing-forge-hammer` | katalog-silah-04#15 | somon hale (%24) |
| 6 | `dawnseal-mace` | katalog-silah-05#6 | somon hale (%32), kenara dayanan parıltı (%4) |
| 7 | `sunstar-morningstar` | katalog-silah-05#10 | somon hale (%63), kenara dayanan parıltı (%4) |
| 8 | `brimstone-flail` | katalog-silah-05#12 | somon hale (%34) |
| 9 | `stardust-flail` | katalog-silah-05#14 | leylak/pembe hale (%37) |
| 10 | `homing-pike` | katalog-silah-06#5 | leylak/pembe hale (%27) |
| 11 | `luster-twinblade` | katalog-silah-06#9 | somon hale (%99), kenara dayanan parıltı (%3) |
| 12 | `skybolt-spear` | katalog-silah-06#14 | somon hale (%23) |
| 13 | `stormbolt-javelin` | katalog-silah-06#15 | somon hale (%43) |
| 14 | `hoarfrost-staff` | katalog-silah-07#3 | leylak/pembe hale (%65), kenara dayanan parıltı (%17) |
| 15 | `archmages-conduit-staff` | katalog-silah-07#7 | leylak/pembe hale (%18), kenara dayanan parıltı (%11) |
| 16 | `resonance-staff` | katalog-silah-07#10 | leylak/pembe hale (%14) |

## 3. `katalog-duzeltme-03.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Support staff of pale wood with a small golden halo ring floating above its top and white cloth ribbons, soft warm golden glow.
2. War torch club: a thick wooden cudgel with its end wrapped in pitch-soaked rags burning with a bright orange flame, an iron collar below the rags.
3. Tall longbow of white-gold wood with sun-ray carvings on the limbs and a string made of a glowing beam of golden light, bright warm gold glow.
4. Short bow of pale grey wood with wailing ghost-face carvings at the limb ends, a thin silvery string and pale ghostly mist.
5. Compact one-handed crossbow of dark lacquered wood and steel, loaded with a glowing pale-blue bolt of pure force energy instead of a real bolt.
6. Full plate of black infernal steel with glowing orange forge seams between the plates and small horn details, slight heat shimmer.
7. Heavy enclosed plate of smooth layered steel with a high protective gorget and a calm pale-teal gem set in the chest.
8. Chain mail hauberk with concentric rippling rings of pale blue force energy across the steel links.
9. Light chain shirt of shiny copper rings with tiny yellow sparks jumping between the links.
10. Bright silver breastplate with a carved radiating sunburst on the chest and soft golden light.
11. Light armored coat covered in overlapping glossy black raven feathers, held by leather straps.
12. Long battle-mage coat of dark blue leather with brass buttons engraved with abstract runes and reinforced shoulders.
13. Druidic hide armor of pale silvery moon-colored fur with crescent-moon motifs.
14. Light armor woven from shimmering white-grey spider silk with a faint web pattern.
15. Flamboyant naval captain's long coat in deep red with gold trims, brass buttons and wide cuffs.
16. Embroidered bard's jerkin in teal and gold with lute and musical-note embroidery.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `staff-of-arcane-benediction` | katalog-silah-07#11 | somon hale (%99) |
| 2 | `pitchtorch-club` | katalog-silah-07#14 | somon hale (%22) |
| 3 | `skylight-longbow` | katalog-silah-08#1 | somon hale (%94), kenara dayanan parıltı (%6) |
| 4 | `banshees-wail-shortbow` | katalog-silah-08#4 | leylak/pembe hale (%43) |
| 5 | `forcebolt-hand-crossbow` | katalog-silah-08#6 | leylak/pembe hale (%22) |
| 6 | `hellforge-plate` | katalog-zirh-01#6 | somon hale (%44) |
| 7 | `mindfortress-plate` | katalog-zirh-01#12 | kenara dayanan parıltı (%53) |
| 8 | `forcewave-chain-mail` | katalog-zirh-01#15 | leylak/pembe hale (%55) |
| 9 | `sparkmesh-chain-shirt` | katalog-zirh-02#8 | macenta cep (45 px) |
| 10 | `sunburst-breastplate` | katalog-zirh-02#9 | somon hale (%99), kenara dayanan parıltı (%44) |
| 11 | `raptor-feather-coat` | katalog-zirh-03#1 | somon hale (%76), kenara dayanan parıltı (%28) |
| 12 | `spellblade-coat` | katalog-zirh-03#2 | kenara dayanan parıltı (%15) |
| 13 | `moonshift-hide` | katalog-zirh-03#3 | somon hale (%15), kenara dayanan parıltı (%20) |
| 14 | `spidersilk-armor` | katalog-zirh-03#5 | kenara dayanan parıltı (%7) |
| 15 | `corsair-captains-coat` | katalog-zirh-03#6 | kenara dayanan parıltı (%20) |
| 16 | `minstrels-favor-jerkin` | katalog-zirh-03#7 | somon hale (%61), kenara dayanan parıltı (%15) |

## 4. `katalog-duzeltme-04.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Thin pale white hooded robe for death-watch vigils with soft silver trim and a faint warm light.
2. Ivory robe interlaced with glowing golden threads woven into knot patterns, with a high collar.
3. Shiny robe of rich deep blue silk with gold embroidery and a sparkling sheen.
4. Heavy layered silk robe in calm dark teal with a meditation-circle emblem on the chest.
5. Sleeveless monk vest in saffron orange with white embroidered spirit-swirl patterns.
6. Flowing sea-silk robe in ocean blue-green with wave patterns and small water droplets.
7. Short light acrobat's tunic in tan with black stripes and a small cat-face emblem.
8. Alchemist's robe of dark green waxed cloth with yellow-green trims and small glass vials hanging from the belt.
9. Tall tower shield shaped like a miniature fortress gate with a crenellated top edge, stone-grey steel, a small portcullis relief and a soft blue ward glow.
10. Round carved bronze shield with a sun-disc and radiating ray pattern, faint golden glow.
11. Crown woven from living underground mushrooms in tan and orange-brown, with softly glowing pale mushroom caps.
12. Healer's circlet wrapped in gold wire with a pale warm sunrise-orange gem at the front.
13. Heavy deep blue silk cloak whose folds shimmer with faint swirling magic-absorbing patterns.
14. Thick wool cloak covered in white frost rime with a cold icy mist.
15. Pair of leather gloves stitched with storm patterns, faint blue-white thunder ripples around them.
16. Pair of gauntlets plated in bright sun-silver that glow with warm white-gold light.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `vigil-shroud-robe` | katalog-zirh-03#9 | somon hale (%64), kenara dayanan parıltı (%39) |
| 2 | `weavewoven-robe` | katalog-zirh-03#10 | somon hale (%49), kenara dayanan parıltı (%36) |
| 3 | `resonant-caster-robe` | katalog-zirh-03#11 | somon hale (%66), kenara dayanan parıltı (%21) |
| 4 | `robe-of-supreme-focus` | katalog-zirh-03#12 | leylak/pembe hale (%78), kenara dayanan parıltı (%24) |
| 5 | `soulmender-monk-vest` | katalog-zirh-03#13 | kenara dayanan parıltı (%21) |
| 6 | `tidecaller-robe` | katalog-zirh-03#14 | leylak/pembe hale (%79), kenara dayanan parıltı (%31) |
| 7 | `nimble-cat-tunic` | katalog-zirh-03#15 | kenara dayanan parıltı (%17) |
| 8 | `venomweaver-robe` | katalog-zirh-03#16 | kenara dayanan parıltı (%18) |
| 9 | `walking-bastion-shield` | katalog-zirh-04#6 | kenara dayanan parıltı (%7) |
| 10 | `sunward-shield` | katalog-zirh-04#9 | somon hale (%98) |
| 11 | `fungal-crown` | katalog-giyilebilir-01#4 | somon hale (%25) |
| 12 | `dawnmender-circlet` | katalog-giyilebilir-01#13 | somon hale (%49) |
| 13 | `weavefold-cloak` | katalog-giyilebilir-02#4 | leylak/pembe hale (%20) |
| 14 | `frostmist-cloak` | katalog-giyilebilir-02#8 | leylak/pembe hale (%81) |
| 15 | `skythunder-gloves` | katalog-giyilebilir-03#5 | leylak/pembe hale (%36) |
| 16 | `luminous-gauntlets` | katalog-giyilebilir-03#7 | somon hale (%14) |

## 5. `katalog-duzeltme-05.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Pair of frosted gloves with icy claw-like fingertips and an icy cyan glow.
2. Pair of thick alchemist's gloves stained with dripping yellow-green acid.
3. Pair of boots with trembling layered soles and faint concentric sound rings below them.
4. Pair of boots with springy coiled-spring soles.
5. Pair of light leather boots with crackling yellow static sparks around them.
6. Polished black ring set with a dark smoky stone that has a tiny white spark inside.
7. Heavy black-iron signet ring with a square ruby set flush into its face and a tiny engraved crown.
8. Gold ring whose setting holds a tiny ivory six-sided die.
9. Gold ring set with a radiant yellow sun crystal surrounded by a small halo of light rays.
10. Silver ring inlaid with an icy blue glacier sapphire, frost on the band.
11. Two interlinked bands, one steel and one copper, fused into a single double ring.
12. Dark ring with a glossy black obsidian stone shaped like an eye.
13. Gold priest's ring with engraved prayer lines (abstract marks) and a small white pearl.
14. Ring of grounded copper wire wrapped around a clear glass stone.
15. Plain light iron ring with a small throwing-axe emblem.
16. Battle-mage ring surrounded by five tiny gems: red, blue, yellow, green and white.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `winterclaw-gloves` | katalog-giyilebilir-03#9 | leylak/pembe hale (%19) |
| 2 | `ichorous-gloves` | katalog-giyilebilir-03#11 | somon hale (%78) |
| 3 | `stormstep-boots` | katalog-giyilebilir-04#5 | kenara dayanan parıltı (%21) |
| 4 | `springvault-boots` | katalog-giyilebilir-04#7 | macenta cep (123 px) |
| 5 | `sparkstride-boots` | katalog-giyilebilir-04#10 | somon hale (%40) |
| 6 | `shadowspark-ring` | katalog-yuzuk-01#1 | kenara dayanan parıltı (%5) |
| 7 | `high-command-ring` | katalog-yuzuk-01#2 | leylak/pembe hale (%27), kenara dayanan parıltı (%4) |
| 8 | `gamblers-edge-ring` | katalog-yuzuk-01#3 | kenara dayanan parıltı (%4) |
| 9 | `dazzling-halo-ring` | katalog-yuzuk-01#4 | kenara dayanan parıltı (%5) |
| 10 | `snowburst-ring` | katalog-yuzuk-01#5 | kenara dayanan parıltı (%4) |
| 11 | `spellstrike-ring` | katalog-yuzuk-01#6 | kenara dayanan parıltı (%4) |
| 12 | `eversight-shadow-ring` | katalog-yuzuk-01#7 | kenara dayanan parıltı (%5) |
| 13 | `whispering-promise-ring` | katalog-yuzuk-01#8 | kenara dayanan parıltı (%6) |
| 14 | `sparkswall-ring` | katalog-yuzuk-01#9 | kenara dayanan parıltı (%5) |
| 15 | `flinging-ring` | katalog-yuzuk-01#10 | kenara dayanan parıltı (%6) |
| 16 | `elemental-infusion-ring` | katalog-yuzuk-01#11 | kenara dayanan parıltı (%5) |

## 6. `katalog-duzeltme-06.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 16 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Alchemist's ring carved with green thorns, a small green poison drop gem.
2. Simple silver ring with a tiny lockpick and key motif.
3. Ring made of twisted living tree root with a small green bud.
4. Gold medallion stamped with a divine sun seal on a gold chain.
5. Wizard pendant with a twin knot of two sapphires on a silver chain.
6. Thin silver pendant shaped like a surgical needle with fine nerve-like silver lines.
7. Round field medic's silver locket with a white cross-shaped embossing and a silver needle and thread wrapped around it.
8. Larger essence sigil stone: an elongated faceted crystal in an ornate gold setting, drawn in one bright saturated warm golden-white hue (single color, to be recolored per element later) with a glowing core.
9. Ancient weathered stone relic with glowing blue engraved patterns, a one-use imbuement charm.
10. Small capsule of white paper and brass filled with bright magnesium light powder, glowing at the seams.
11. Arrow wrapped in copper wire with yellow lightning arcing at the tip.
12. Arrow whose head splits into three glowing pale-blue magical prongs.
13. Arrow with a glowing pale-blue spiral portal ring around its shaft.
14. Arrow with a fragile glass capsule of holy water at its tip and a soft golden glow.
15. Black arrow branded with dark marks, wisps of shadow trailing behind.
16. Small flask of glistening icy blue crystal oil with frost on the glass.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `venomthorn-ring` | katalog-yuzuk-01#12 | kenara dayanan parıltı (%5) |
| 2 | `locksmiths-ring` | katalog-yuzuk-01#13 | kenara dayanan parıltı (%5) |
| 3 | `rootgrip-ring` | katalog-yuzuk-01#14 | kenara dayanan parıltı (%4) |
| 4 | `devouts-medallion` | katalog-yuzuk-02#4 | somon hale (%94) |
| 5 | `spellspark-pendant` | katalog-yuzuk-02#5 | leylak/pembe hale (%27) |
| 6 | `subjugation-pendant` | katalog-yuzuk-02#6 | macenta cep (211 px) |
| 7 | `silverthread-locket` | katalog-yuzuk-02#14 | somon hale (%88) |
| 8 | `umbral-sigil-stone` | katalog-yuzuk-03#3 | somon hale (%100) |
| 9 | `ancient-imbuement-relic` | katalog-yuzuk-03#7 | leylak/pembe hale (%52) |
| 10 | `flashblind-capsule` | katalog-tuketilebilir-01#4 | somon hale (%63) |
| 11 | `arcing-bolt-arrow` | katalog-tuketilebilir-02#6 | somon hale (%36) |
| 12 | `splitflight-arrow` | katalog-tuketilebilir-02#7 | leylak/pembe hale (%26) |
| 13 | `transposition-arrow` | katalog-tuketilebilir-02#8 | leylak/pembe hale (%21) |
| 14 | `blessed-mending-arrow` | katalog-tuketilebilir-02#11 | somon hale (%65) |
| 15 | `shadowpierce-arrow` | katalog-tuketilebilir-02#12 | macenta cep (76 px) |
| 16 | `hoarfrost-coating` | katalog-tuketilebilir-03#1 | leylak/pembe hale (%43) |

## 7. `katalog-duzeltme-07.jpg`

```text
Create one square image, 2048 × 2048 px: a sprite sheet of 3 fantasy RPG inventory item icons placed in an invisible 4 × 4 grid (4 columns × 4 rows, every cell exactly 512 × 512 px). Fill the cells left to right, top to bottom, in the numbered order below. Only the first 3 cells get an object; cells 4–16 stay completely empty.

STYLE (identical on every cell):
- Hand-painted fantasy RPG inventory icon style: clean, bold dark-brown/black ink outlines, painterly cel shading with soft gradients, crisp highlights on metal and gems, rich but not neon colours, light from the upper left.
- Three-quarter view. Long items (swords, axes, spears, staves, bows, arrows) lie diagonally from lower-left to upper-right; paired items (gloves, boots, wraps) stand side by side as one pair.
- NO outer glow and NO halo of any kind: magical light stays strictly inside the object's silhouette (glowing runes, gems, cracks, edges); the background around every object is one flat, uniform pure magenta #FF00FF right up to the dark outline.
- Exactly one object (or one matched pair) per cell, centred, filling about 75–80 % of the cell, with at least 50 px of empty margin on every side. Nothing may touch the cell border or cross into a neighbouring cell.
- All icons share the same line weight, lighting and level of detail.
- If a reference image is attached, copy only its drawing style; ignore its background colour.

BACKGROUND (critical for automatic cutting):
- The whole background is one flat, uniform pure magenta #FF00FF: no gradient, no texture, no vignette, no noise, no floor, no cast shadow under the objects.
- Do NOT draw grid lines, cell borders, frames, panels, cards, plaques, labels, captions, numbers, letters, watermarks or signatures. Runes and symbols on objects are abstract marks, never letters or readable text.
- Do NOT use magenta, pink, purple, violet, lilac or lavender anywhere in the objects or their glows; these colours are reserved for the background. Use other colours instead (deep blue, teal, crimson red, black, grey).
- Empty cells are plain flat magenta with nothing in them.

CELLS:
1. Potion bottle of glowing golden liquid with a small golden fire flower inside.
2. Elixir bottle of glowing blue arcane liquid with a small eye-shaped glass stopper.
3. Hunter's ring of bone and gold with an amber cabochon glowing like a small lantern.
4–16. Empty: plain flat magenta, nothing drawn.
```

| Hücre | `id` | Eski hücre | Kusur |
|---|---|---|---|
| 1 | `strong-will-draught` | katalog-tuketilebilir-03#10 | somon hale (%85) |
| 2 | `elixir-of-battlemage-focus` | katalog-tuketilebilir-03#15 | leylak/pembe hale (%16) |
| 3 | `callous-glow-ring` | katalog-bekleyen-01#6 | somon hale (%21) |
