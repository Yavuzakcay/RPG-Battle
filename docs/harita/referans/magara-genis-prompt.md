# Gemini prompt — magara-genis

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `magara-genis`, 21 sütun × 11 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **1781 × 1096 px** (en-boy 1.625). Gemini başka boyut verirse oran aynı kalmalı (ör. 3562 × 2192); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/referans/magara-genis-izgarasiz.png` (düz renk; ızgaralı sürüm `magara-genis.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-magara-magara.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Mağara: batıdan ve doğudan giren dar geçitler, ortada geniş oda, yan cepler, birkaç sarkıt, sığ su birikintisi, iki ışıklı kristal kümesi.
- Çıktıyı `assets-ham/harita/magara-genis.png` (ya da .jpg/.webp) olarak kaydedip `npm run harita-gorsel -- magara-genis` çalıştırın.
- Harita aynalanabilir (oyun görseli yatay çevirebilir): görselde yazı, ok ya da yönlü işaret olmasın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `e` | #00f0ff | Işıklı kristal (geçilmez, ışık) | a cluster of glowing crystals casting soft light around it |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `v` | #b0a090 | Sarkıt, dikit (geçilmez) | a thick stalagmite column, impassable |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #00f0ff = glowing crystal: a cluster of glowing crystals casting soft light around it
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #b0a090 = stalagmite: a thick stalagmite column, impassable

THEME: An underground cave: narrow passages entering from the west and the east, a wide central chamber, side niches, a few stalagmites, a shallow pool, two glowing crystal clusters.
LIGHTING: Dark cave lit only by glowing cyan and violet crystals and faint bioluminescent mushrooms; areas far from crystals are dim but still readable.

CONSTRAINTS:
- Output size 1781 x 1096 pixels (aspect ratio 1.625:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
