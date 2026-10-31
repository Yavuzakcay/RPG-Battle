# Gemini prompt — lav-tapinagi

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `data/harita-referans.json`). Şartname: `docs/harita/gorsel-sartnamesi.md`.

- **Harita:** `lav-tapinagi`, 21 sütun × 11 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **1781 × 1096 px** (en-boy 1.625). Gemini başka boyut verirse oran aynı kalmalı (ör. 3562 × 2192); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `docs/harita/referans/lav-tapinagi-izgarasiz.png` (düz renk; ızgaralı sürüm `lav-tapinagi.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/harita-volkan.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Lav tapınağı: güneybatıda varış çemberi, kuzeybatıda yüksek taht odası, doğuda yüksek teras ve çıkış kapısı, ortada lav havuzlu halka, kuzeyde lav nehri, sütunlar.
- Çıktıyı `assets-ham/harita/lav-tapinagi.png` (ya da .jpg/.webp) olarak kaydedip `npm run harita-gorsel -- lav-tapinagi` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `c` | #9c9c8c | Ayakta sütun | an intact column |
| `h` | #e8c9a0 | Yükseltili zemin (+1) | raised platform, wall-walk or ledge one level above the ground |
| `l` | #c9b07a | Alçak basamak | a low stair step |
| `m` | #6b4fa0 | Direk, sütun, çeşme (geçilmez) | a pillar, statue or well, impassable |
| `o` | #ffd23f | Kapı, geçit | an open door or gate opening in the wall |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `~` | #ff3b00 | Lav | molten lava |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #9c9c8c = standing column: an intact column
- #e8c9a0 = raised ground: raised platform, wall-walk or ledge one level above the ground
- #c9b07a = low step: a low stair step
- #6b4fa0 = pillar / well: a pillar, statue or well, impassable
- #ffd23f = door / gateway: an open door or gate opening in the wall
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #ff3b00 = lava: molten lava

THEME: A lava temple: an arrival circle in the south-west, a raised throne room in the north-west, a raised terrace with an exit door in the east, a ring around a lava pool in the middle, a lava river to the north, pillars.
LIGHTING: Lavın kızıl ışığı, sıcak gölgeler.

CONSTRAINTS:
- Output size 1781 x 1096 pixels (aspect ratio 1.625:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
