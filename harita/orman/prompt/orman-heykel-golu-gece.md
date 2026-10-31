# Gemini prompt — orman-heykel-golu (gece)

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `orman-heykel-golu`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/orman/onizleme/orman-heykel-golu-gece-izgarasiz.png` (düz renk; ızgaralı sürüm `orman-heykel-golu-gece-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/orman/orman-yol.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Orman içinde göl: kuzeyde dev bir heykel yüzü oyulmuş kayalık ve doğuda şelale, ortada derin göl, kıyıda sığ su ve nilüferler, batıdan güneye kıvrılan toprak patika, yosunlu kayalar.
- Çıktıyı `assets-ham/harita/orman/orman-heykel-golu-gece.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/orman/gorsel/orman-heykel-golu-gece.jpg`) olarak kaydedip `npm run harita-gorsel -- orman-heykel-golu` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `a` | #0b5d1e | Ağaç (geçilmez, görüş keser) | one large tree canopy filling the hex, trunk centred in the hex |
| `g` | #c6e04a | Çalılık (zorlu, yarım örtü) | dense bushes or tall grass, low enough to see over |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `w` | #1f5fd1 | Derin su | deep dark water, no visible bottom |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #0b5d1e = tree: one large tree canopy filling the hex, trunk centred in the hex
- #c6e04a = brush: dense bushes or tall grass, low enough to see over
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #1f5fd1 = deep water: deep dark water, no visible bottom

THEME: A forest lake: a cliff carved with a giant statue face in the north and a waterfall in the east, a deep lake in the middle with shallow, lily-padded shores, a dirt path curving from west to south, mossy rocks.
LIGHTING: Gün ışığı, su parıltısı.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
