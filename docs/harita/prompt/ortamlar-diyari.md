# Gemini prompt — ortamlar-diyari

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `ortamlar-diyari`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/onizleme/ortamlar-diyari-izgarasiz.png` (düz renk; ızgaralı sürüm `ortamlar-diyari-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-orman-orman.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** (veride tema yok; data/harita-referans.json maps alanına ekleyin)
- Çıktıyı `assets-ham/harita/vitrin/vitrin-ortamlar-diyari.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `docs/harita/referans/vitrin/vitrin-ortamlar-diyari.jpg`) olarak kaydedip `npm run harita-gorsel -- ortamlar-diyari` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `#` | #000000 | Harita dışı | solid dark rock or void |
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `H` | #4a4440 | Yüksek bazalt | raised basalt |
| `O` | #7a3e10 | Kapalı kapı | a closed door |
| `a` | #0b5d1e | Ağaç (geçilmez, görüş keser) | one large tree canopy filling the hex, trunk centred in the hex |
| `b` | #4f6b2a | Derin batak | deep bog |
| `c` | #9c9c8c | Ayakta sütun | an intact column |
| `d` | #f0d58c | Kum tepesi | a sand dune |
| `e` | #00f0ff | Işıklı kristal (geçilmez, ışık) | a cluster of glowing crystals casting soft light around it |
| `f` | #ff9a00 | Alev | burning ground |
| `g` | #c6e04a | Çalılık (zorlu, yarım örtü) | dense bushes or tall grass, low enough to see over |
| `h` | #e8c9a0 | Yükseltili zemin (+1) | raised platform, wall-walk or ledge one level above the ground |
| `i` | #d8f4ff | Buz | slick ice |
| `j` | #8fd16a | Gizli tuzak (zemin gibi) | ordinary ground (the trap must not be visible) |
| `k` | #b8b0a0 | Yıkık sütun | a toppled column |
| `l` | #c9b07a | Alçak basamak | a low stair step |
| `m` | #6b4fa0 | Direk, sütun, çeşme (geçilmez) | a pillar, statue or well, impassable |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `o` | #ffd23f | Kapı, geçit | an open door or gate opening in the wall |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `q` | #ffffff | Kar | deep snow |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `t` | #a89a80 | Taşlık | loose stones |
| `u` | #1a1a1a | Uçurum | a deep chasm |
| `v` | #b0a090 | Sarkıt, dikit (geçilmez) | a thick stalagmite column, impassable |
| `w` | #1f5fd1 | Derin su | deep dark water, no visible bottom |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |
| `y` | #a8905a | Yüksek basamak | a high stair landing |
| `z` | #ff8c1a | Kule üstü (+2) | top of a tower, two levels above the ground, battlements at its edge |
| `~` | #ff3b00 | Lav | molten lava |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #000000 = out of bounds: solid dark rock or void
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #4a4440 = basalt rise: raised basalt
- #7a3e10 = closed door: a closed door
- #0b5d1e = tree: one large tree canopy filling the hex, trunk centred in the hex
- #4f6b2a = bog: deep bog
- #9c9c8c = standing column: an intact column
- #f0d58c = dune: a sand dune
- #00f0ff = glowing crystal: a cluster of glowing crystals casting soft light around it
- #ff9a00 = flames: burning ground
- #c6e04a = brush: dense bushes or tall grass, low enough to see over
- #e8c9a0 = raised ground: raised platform, wall-walk or ledge one level above the ground
- #d8f4ff = ice: slick ice
- #8fd16a = hidden trap: ordinary ground (the trap must not be visible)
- #b8b0a0 = broken column: a toppled column
- #c9b07a = low step: a low stair step
- #6b4fa0 = pillar / well: a pillar, statue or well, impassable
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #ffd23f = door / gateway: an open door or gate opening in the wall
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #ffffff = snow: deep snow
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #a89a80 = scree: loose stones
- #1a1a1a = chasm: a deep chasm
- #b0a090 = stalagmite: a thick stalagmite column, impassable
- #1f5fd1 = deep water: deep dark water, no visible bottom
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex
- #a8905a = high step: a high stair landing
- #ff8c1a = tower top: top of a tower, two levels above the ground, battlements at its edge
- #ff3b00 = lava: molten lava

THEME: A battle map matching the layout above.
LIGHTING: Neutral daylight from the upper left.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
