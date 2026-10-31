# Gemini prompt — isinlanma-salonu

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `isinlanma-salonu`, 21 sütun × 11 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **1781 × 1096 px** (en-boy 1.625). Gemini başka boyut verirse oran aynı kalmalı (ör. 3562 × 2192); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/referans/isinlanma-salonu-izgarasiz.png` (düz renk; ızgaralı sürüm `isinlanma-salonu.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-volkan.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Volkanik bir salon: ortada sekizgen kaide ve ışınlanma ünitesi, kuzeyde mühürlü rün kapısına çıkan merdiven, güneyde giriş merdiveni, iki yanda heykel kaideleri ve meşale sütunları, kenarlarda lav.
- Çıktıyı `assets-ham/harita/isinlanma-salonu.png` (ya da .jpg/.webp) olarak kaydedip `npm run harita-gorsel -- isinlanma-salonu` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `O` | #7a3e10 | Kapalı kapı | a closed door |
| `c` | #9c9c8c | Ayakta sütun | an intact column |
| `l` | #c9b07a | Alçak basamak | a low stair step |
| `m` | #6b4fa0 | Direk, sütun, çeşme (geçilmez) | a pillar, statue or well, impassable |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `~` | #ff3b00 | Lav | molten lava |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #7a3e10 = closed door: a closed door
- #9c9c8c = standing column: an intact column
- #c9b07a = low step: a low stair step
- #6b4fa0 = pillar / well: a pillar, statue or well, impassable
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #ff3b00 = lava: molten lava

THEME: A volcanic hall: an octagonal dais with a teleportation device in the middle, stairs north to a sealed rune door, entry stairs south, statue plinths and torch pillars on both sides, lava along the edges.
LIGHTING: Lavın kızıl ışığı, sıcak gölgeler.

CONSTRAINTS:
- Output size 1781 x 1096 pixels (aspect ratio 1.625:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
