# Gemini prompt — orman-yolu

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `orman-yolu`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/referans/orman-yolu-izgarasiz.png` (düz renk; ızgaralı sürüm `orman-yolu.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-orman-orman.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Gündüz orman yolu: batıdan doğuya kıvrılan toprak yol, ortadan kuzey-güney akan dere ve sığ geçit, açık çayır, iki yanda pusu çalılıkları ve ağaç kümeleri.
- Çıktıyı `assets-ham/harita/orman-yolu.png` (ya da .jpg/.webp) olarak kaydedip `npm run harita-gorsel -- orman-yolu` çalıştırın.
- Harita aynalanabilir (oyun görseli yatay çevirebilir): görselde yazı, ok ya da yönlü işaret olmasın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `a` | #0b5d1e | Ağaç (geçilmez, görüş keser) | one large tree canopy filling the hex, trunk centred in the hex |
| `g` | #c6e04a | Çalılık (zorlu, yarım örtü) | dense bushes or tall grass, low enough to see over |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `w` | #1f5fd1 | Derin su | deep dark water, no visible bottom |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #0b5d1e = tree: one large tree canopy filling the hex, trunk centred in the hex
- #c6e04a = brush: dense bushes or tall grass, low enough to see over
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #1f5fd1 = deep water: deep dark water, no visible bottom
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex

THEME: A daytime forest road: a dirt road winding west to east, a creek running north to south through the middle with a shallow ford, an open meadow, dense brush and tree clusters on both sides suitable for an ambush.
LIGHTING: Soft late-morning sunlight from the upper left, dappled light under the canopy, short soft shadows to the lower right.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
