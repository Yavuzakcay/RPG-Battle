# Gemini prompt — derinlikler-magara-karakol

Üretici: `npm run harita-referans` (elle düzenlemeyin; tema metni `harita/_ortak/harita-referans.json`). Şartname: `harita/belgeler/gorsel-sartnamesi.md`.

- **Harita:** `derinlikler-magara-karakol`, 31 sütun × 17 satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **2616 × 1668 px** (en-boy 1.568). Gemini başka boyut verirse oran aynı kalmalı (ör. 5232 × 3336); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: `harita/derinlikler/onizleme/derinlikler-magara-karakol-izgarasiz.png` (düz renk; ızgaralı sürüm `derinlikler-magara-karakol-izgara.png` yalnızca senin kontrolün için).
  2. Stil örneği: `public/maps/yeralti/yeralti-magara.webp` (aynı oyunun Klasik harita görseli).
- **Tema:** Madenci mağarası ve taş karakol: üstte obruklu mağara bandı, solda mavi göletli mağara, KD'de yüzeye açılan mağara ağzı; GD'de taş karakol (aşağı inen merdivenli oda, kuyulu oda, sıralı salon, ray koridoru, maden odası).
- Çıktıyı `assets-ham/harita/derinlikler/derinlikler-magara-karakol.png` (ya da .jpg/.webp; tam üstten çizilmiş referans: `harita/derinlikler/gorsel/derinlikler-magara-karakol.jpg`) olarak kaydedip `npm run harita-gorsel -- derinlikler-magara-karakol` çalıştırın.

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
| `#` | #000000 | Harita dışı | solid dark rock or void |
| `.` | #8fd16a | Açık zemin (çimen / taban) | plain walkable ground: grass outdoors, packed earth or stone floor underground |
| `j` | #8fd16a | Gizli tuzak (zemin gibi) | ordinary ground (the trap must not be visible) |
| `l` | #c9b07a | Alçak basamak | a low stair step |
| `m` | #6b4fa0 | Direk, sütun, çeşme (geçilmez) | a pillar, statue or well, impassable |
| `n` | #7fd3e6 | Sığ su, çamur (zorlu) | shallow water or mud, ford stones visible, clearly wadeable |
| `p` | #d9a066 | Yol, kaldırım, tahta zemin, köprü | dirt road, cobbles, flagstones or wooden planks |
| `s` | #3a3a46 | Duvar (geçilmez) | solid stone wall or cave rock, clearly impassable |
| `u` | #1a1a1a | Uçurum | a deep chasm |
| `v` | #b0a090 | Sarkıt, dikit (geçilmez) | a thick stalagmite column, impassable |
| `x` | #a0522d | Varil, sandık, kütük (zorlu, yarım örtü) | crates, barrels or a fallen log occupying the hex |

## Prompt (İngilizce; olduğu gibi yapıştırın)

```text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
- #000000 = out of bounds: solid dark rock or void
- #8fd16a = open ground: plain walkable ground: grass outdoors, packed earth or stone floor underground
- #8fd16a = hidden trap: ordinary ground (the trap must not be visible)
- #c9b07a = low step: a low stair step
- #6b4fa0 = pillar / well: a pillar, statue or well, impassable
- #7fd3e6 = shallow water: shallow water or mud, ford stones visible, clearly wadeable
- #d9a066 = road / paving / planks: dirt road, cobbles, flagstones or wooden planks
- #3a3a46 = wall: solid stone wall or cave rock, clearly impassable
- #1a1a1a = chasm: a deep chasm
- #b0a090 = stalagmite: a thick stalagmite column, impassable
- #a0522d = crates / barrels / logs: crates, barrels or a fallen log occupying the hex

THEME: A miners' cave and a stone outpost: a cave band with sinkholes on top, a cave with blue pools on the left, a cave mouth to the surface in the NE; a stone outpost in the SE (a room with stairs leading down, a well room, a hall with benches, a rail corridor, a mine room).
LIGHTING: Meşale ışığı, karanlık mağara, mavi su parıltısı.

CONSTRAINTS:
- Output size 2616 x 1668 pixels (aspect ratio 1.568:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
```
