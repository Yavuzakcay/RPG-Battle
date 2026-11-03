# Gemini prompt — yeralti-nehri

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `yeralti-nehri`, 21 sütun × 11 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **1781 × 1096 px** (en-boy 1.625). Gemini başka boyut verirse oran aynı kalmalı (ör. 3562 × 2192); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/col/onizleme/yeralti-nehri-izgarasiz.png` (düz renk; ızgaralı sürüm `yeralti-nehri-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-orman-orman.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** (veride tema yok; harita/_ortak/harita-referans.json maps alanına ekleyin)
- Çıktıyı `assets-ham/harita/col/yeralti-nehri.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/col/gorsel/yeralti-nehri.jpg`) olarak kaydedip `npm run harita-gorsel -- yeralti-nehri` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `#` | #000000 | Harita dışı | solid dark rock or void |
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #000000 = out of bounds: solid dark rock or void
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable

THEME: A battle map matching the layout above.
LIGHTING: Neutral daylight from the upper left.

CONSTRAINTS:
- Output size 1781 x 1096 pixels (aspect ratio 1.625:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
