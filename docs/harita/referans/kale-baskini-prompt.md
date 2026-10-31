# Gemini prompt — kale-baskini

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `kale-baskini`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/referans/kale-baskini-izgarasiz.png` (düz renk; ızgaralı sürüm `kale-baskini.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-kale-gunduz.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Şafak vakti kale baskını: batıda sık ağaçlı orman kenarı ve çalılar, hendek ve açık dış kapı, taş döşeli avlu ortasında suyla çevrili kuyu, doğuda iç bina (koğuş, koridor, mahzen) ve iki köşe kulesi. Fıçılar, masa, sandık ve mangal yerlerinde.
- Çıktıyı `assets-ham/harita/kale-baskini.png` (ya da .jpg/.webp) olarak kaydedip `npm run harita-gorsel -- kale-baskini` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `a` | #0b5d1e | Ağaç (geçilmez, görüş keser) | one large tree canopy filling the hex, trunk centred in the hex |
| `g` | #c6e04a | Çalılık (zorlu, yarım örtü) | dense bushes or tall grass, low enough to see over |
| `h` | #e8c9a0 | Yükseltili zemin (+1) | raised platform, wall-walk or ledge one level above the ground |
| `m` | #6b4fa0 | Direk, sütun, çeşme (geçilmez) | a pillar, statue or well, impassable |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `o` | #ffd23f | Kapı, geçit | an open door or gate opening in the wall |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `r` | #8a8a8a | Kaya kümesi (zorlu, örtü) | a cluster of boulders inside the hex |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |
| `z` | #ff8c1a | Kule üstü (+2) | top of a tower, two levels above the ground, battlements at its edge |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #0b5d1e = tree: one large tree canopy filling the hex, trunk centred in the hex
- #c6e04a = brush: dense bushes or tall grass, low enough to see over
- #e8c9a0 = raised ground: raised platform, wall-walk or ledge one level above the ground
- #6b4fa0 = pillar / well: a pillar, statue or well, impassable
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #ffd23f = door / gateway: an open door or gate opening in the wall
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #8a8a8a = rock pile: a cluster of boulders inside the hex
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex
- #ff8c1a = tower top: top of a tower, two levels above the ground, battlements at its edge

THEME: A castle raid at dawn: a dense forest edge with brush in the west, a moat and an open outer gate, a flagstone courtyard with a well ringed by shallow water in the middle, an inner building in the east (barracks, corridor, cellar) and two corner towers. Barrels, a table, a chest and a brazier in place.
LIGHTING: Cool dawn light from the upper left, long soft shadows to the lower right, a faint warm glow from the brazier.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
