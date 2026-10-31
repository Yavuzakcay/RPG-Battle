# Gemini prompt — orman-kemik-acikligi (gece)

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `orman-kemik-acikligi`, 21 sütun × 11 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **1781 × 1096 px** (en-boy 1.625). Gemini başka boyut verirse oran aynı kalmalı (ör. 3562 × 2192); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/orman/onizleme/orman-kemik-acikligi-gece-izgarasiz.png` (düz renk; ızgaralı sürüm `orman-kemik-acikligi-gece-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/orman/orman-yol.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Kemik açıklığı: ortada iki büyük koyu ağaç, dev bir canavar iskeleti ve dağınık kafatasları, çalılar, devrik kütük, köşede bir çadır.
- Çıktıyı `assets-ham/harita/orman/orman-kemik-acikligi-gece.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/orman/gorsel/orman-kemik-acikligi-gece.jpg`) olarak kaydedip `npm run harita-gorsel -- orman-kemik-acikligi` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `a` | #0b5d1e | Ağaç (geçilmez, görüş keser) | one large tree canopy filling the hex, trunk centred in the hex |
| `g` | #c6e04a | Çalılık (zorlu, yarım örtü) | dense bushes or tall grass, low enough to see over |
| `k` | #b8b0a0 | Yıkık sütun | a toppled column |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #0b5d1e = tree: one large tree canopy filling the hex, trunk centred in the hex
- #c6e04a = brush: dense bushes or tall grass, low enough to see over
- #b8b0a0 = broken column: a toppled column
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable

THEME: A bone clearing: two huge dark trees in the middle, a giant monster skeleton and scattered skulls, bushes, a fallen log, a tent in a corner.
LIGHTING: Loş orman ışığı.

CONSTRAINTS:
- Output size 1781 x 1096 pixels (aspect ratio 1.625:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
