# Gemini prompt — derinlikler-mezar-labirenti

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `derinlikler-mezar-labirenti`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/derinlikler/onizleme/derinlikler-mezar-labirenti-izgarasiz.png` (düz renk; ızgaralı sürüm `derinlikler-mezar-labirenti-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/yeralti/yeralti-zindan.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Mor tuğlalı mezar labirenti: dar koridorlar, tabutlar, sandıklar, yeşil ateşli mangallar, yer yer yeşil zehir sisi; batıda merdivenli çıkış, GD'de mağaraya açılan çıkış.
- Çıktıyı `assets-ham/harita/derinlikler/derinlikler-mezar-labirenti.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/derinlikler/gorsel/derinlikler-mezar-labirenti.jpg`) olarak kaydedip `npm run harita-gorsel -- derinlikler-mezar-labirenti` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `#` | #000000 | Harita dışı | solid dark rock or void |
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `j` | #8fd16a | Gizli tuzak (zemin gibi) | ordinary ground (the trap must not be visible) |
| `o` | #ffd23f | Kapı, geçit | an open door or gate opening in the wall |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #000000 = out of bounds: solid dark rock or void
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #8fd16a = hidden trap: ordinary ground (the trap must not be visible)
- #ffd23f = door / gateway: an open door or gate opening in the wall
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex

THEME: A purple-brick tomb labyrinth: narrow corridors, coffins, chests, green-flame braziers, patches of green poison mist; a stair exit in the west, a cave exit in the SE.
LIGHTING: Yeşil büyülü ateş, soğuk karanlık.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
