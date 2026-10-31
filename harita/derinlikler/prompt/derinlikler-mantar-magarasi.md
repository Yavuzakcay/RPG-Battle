# Gemini prompt — derinlikler-mantar-magarasi

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `derinlikler-mantar-magarasi`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/derinlikler/onizleme/derinlikler-mantar-magarasi-izgarasiz.png` (düz renk; ızgaralı sürüm `derinlikler-mantar-magarasi-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/yeralti/yeralti-magara.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Mantar ve kristal mağarası: batıda merdivenli giriş, yeşil bitkili gölet, ortada çukuru saran halka tünel, KD'de camgöbeği, GD'de mor dev mantarlar, kırmızı/camgöbeği kristaller; en doğuda sunaklı oda ve sandık.
- Çıktıyı `assets-ham/harita/derinlikler/derinlikler-mantar-magarasi.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/derinlikler/gorsel/derinlikler-mantar-magarasi.jpg`) olarak kaydedip `npm run harita-gorsel -- derinlikler-mantar-magarasi` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `#` | #000000 | Harita dışı | solid dark rock or void |
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `e` | #00f0ff | Işıklı kristal (geçilmez, ışık) | a cluster of glowing crystals casting soft light around it |
| `l` | #c9b07a | Alçak basamak | a low stair step |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `u` | #1a1a1a | Uçurum | a deep chasm |
| `w` | #1f5fd1 | Derin su | deep dark water, no visible bottom |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #000000 = out of bounds: solid dark rock or void
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #00f0ff = glowing crystal: a cluster of glowing crystals casting soft light around it
- #c9b07a = low step: a low stair step
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #1a1a1a = chasm: a deep chasm
- #1f5fd1 = deep water: deep dark water, no visible bottom
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex

THEME: A mushroom and crystal cavern: a stair entrance in the west, a pond ringed with green growth, a ring tunnel around a central pit, giant cyan mushrooms in the NE and purple ones in the SE, red/cyan crystals; an altar room with a chest in the far east.
LIGHTING: Mantar ve kristal ışıltısı, koyu mağara.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
