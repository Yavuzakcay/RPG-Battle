// Görev HG1: geniş harita görsel referansları. Çalıştırma:
//   npm run harita-referans                 # bütün geniş haritalar (15×7'den büyük)
//   npm run harita-referans -- orman-yolu   # yalnızca verilenler
// Her harita (ayrı görselli her varyant) için yazar (Kuyruk 19B M1; <anahtar> = kimlik ya da <kimlik>-<varyant>, `previewKey`):
//   harita/<bolge>/onizleme/<anahtar>-izgara.png    orijinal boyutta (dünya pikseli), zemin türleri belirgin renklerle + altıgen ızgarası
//   harita/<bolge>/onizleme/<anahtar>-izgarasiz.png aynı, ızgarasız düz renk
//   harita/<bolge>/prompt/<anahtar>.md              Gemini'ye verilecek hazır metin (tema, zemin anahtarı, ışık, stil, kısıtlar)
// Gemini çıktısının adı varyant görselinin adıdır (`maps/<bolge>/<ad>.webp`, `artName`). Renkler ve temalar harita/_ortak/harita-referans.json.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import ref from '../harita/_ortak/harita-referans.json';
import { RAW_MAPS, isWideMap } from '../src/map/maps';
import { artName, artSize, previewKey } from '../src/map/mapArt';
import { hexCenter, hexPoints } from '../src/ui/mapView';

const ROOT = path.join(import.meta.dirname ?? '.', '..');
const MAP_ROOT = path.join(ROOT, 'harita');
const want = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TERRAIN = ref.terrain as Record<string, { color: string; tr: string; en: string; draw: string }>;
const THEMES = ref.maps as Record<string, { style: string; tr: string; en: string; light: string } | undefined>;

const list = RAW_MAPS.filter((m) => isWideMap(m) && (want.length === 0 || want.includes(m.id)));
if (list.length === 0) throw new Error(`Geniş harita bulunamadı: ${want.join(', ') || '(hiç yok)'}`);


function svg(tiles: string[], size: { w: number; h: number }, grid: boolean): string {
  // Izgaranın dışında kalan köşe boşlukları: ızgaralıda siyah, ızgarasızda kenardaki en yaygın zeminin rengi (görsel
  // kenardan kenara dolsun; oyun bu köşeleri de gösterir).
  const edge = [...(tiles[0] ?? ''), ...(tiles[tiles.length - 1] ?? '')];
  const common = edge.sort((a, b) => edge.filter((x) => x === b).length - edge.filter((x) => x === a).length)[0] ?? '.';
  const parts = [`<rect width="${size.w}" height="${size.h}" fill="${grid ? '#000' : TERRAIN[common]?.color ?? '#000'}"/>`];
  tiles.forEach((line, row) => [...line].forEach((ch, col) => {
    const color = TERRAIN[ch]?.color ?? '#ff00ff';
    parts.push(`<polygon points="${hexPoints({ col, row }, grid ? 1 : 1.02)}" fill="${color}"${grid ? ' stroke="#000" stroke-width="2"' : ''}/>`);
    // Geçilmez ince nesneler (ağaç, sütun, kristal) ızgaralı sürümde merkez noktasıyla da işaretlenir.
    if (grid && ['a', 'm', 'v', 'e', 'c'].includes(ch)) { const c = hexCenter({ col, row }); parts.push(`<circle cx="${c.x}" cy="${c.y}" r="7" fill="#fff" opacity="0.8"/>`); }
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}">${parts.join('')}</svg>`;
}

function prompt(id: string, key: string, bolge: string, name: string, variant: string, tiles: string[], size: { cols: number; rows: number }, target: { w: number; h: number }, mirrorable: boolean): string {
  const theme = THEMES[id];
  const used = [...new Set(tiles.join(''))].sort();
  const legend = used.map((ch) => `| \`${ch}\` | ${TERRAIN[ch]?.color ?? '?'} | ${TERRAIN[ch]?.tr ?? '?'} | ${TERRAIN[ch]?.draw ?? '?'} |`).join('\n');
  const legendEn = used.map((ch) => `- ${TERRAIN[ch]?.color} = ${TERRAIN[ch]?.en}: ${TERRAIN[ch]?.draw}`).join('\n');
  const ref1 = `onizleme/${key}-izgarasiz.png`;
  return `# Gemini prompt — ${id}${variant ? ` (${variant})` : ''}

Üretici: \`npm run harita-referans\` (elle düzenlemeyin; tema metni \`harita/_ortak/harita-referans.json\`). Şartname: \`harita/belgeler/gorsel-sartnamesi.md\`.

- **Harita:** \`${id}\`, ${size.cols} sütun × ${size.rows} satır altıgen (flat-top, odd-q).
- **Hedef görsel boyutu:** **${target.w} × ${target.h} px** (en-boy ${(target.w / target.h).toFixed(3)}). Gemini başka boyut verirse oran aynı kalmalı (ör. ${target.w * 2} × ${target.h * 2}); içe aktarma küçültür.
- **Gemini'ye eklenecek görseller (bu sırayla):**
  1. Yerleşim: \`harita/${bolge}/onizleme/${key}-izgarasiz.png\` (düz renk; ızgaralı sürüm \`${key}-izgara.png\` yalnızca senin kontrolün için).
  2. Stil örneği: \`public/maps/${theme?.style ?? 'harita-orman-orman.webp'}\` (aynı oyunun Klasik harita görseli).
- **Tema:** ${theme?.tr ?? '(veride tema yok; harita/_ortak/harita-referans.json maps alanına ekleyin)'}
- Çıktıyı \`assets-ham/harita/${bolge}/${name}.png\` (ya da .jpg/.webp; tam üstten çizilmiş referans: \`harita/${bolge}/gorsel/${name}.jpg\`) olarak kaydedip \`npm run harita-gorsel -- ${id}\` çalıştırın.${mirrorable ? '\n- Harita aynalanabilir (oyun görseli yatay çevirebilir): görselde yazı, ok ya da yönlü işaret olmasın.' : ''}

## Zemin anahtarı (referans renkleri)

| Harf | Renk | Zemin | Çizim |
|---|---|---|---|
${legend}

## Prompt (İngilizce; olduğu gibi yapıştırın)

\`\`\`text
Create a top-down battle map illustration for a tactical fantasy RPG, in the exact art style of the second attached image (16-bit style pixel art seen straight from above, crisp pixel clusters, muted natural palette, soft drop shadows toward the lower right, no perspective tilt).

LAYOUT: Follow the first attached image exactly. It is a colour-coded layout of the same map at the same proportions: every coloured area must become the matching terrain in the same position and with the same shape. Do not move, add or remove terrain features. Colour key:
${legendEn}

THEME: ${theme?.en ?? 'A battle map matching the layout above.'}
LIGHTING: ${theme?.light ?? 'Neutral daylight from the upper left.'}

CONSTRAINTS:
- Output size ${target.w} x ${target.h} pixels (aspect ratio ${(target.w / target.h).toFixed(3)}:1), or an exact multiple of it. Do not crop, pad or add borders; the art must fill the whole canvas edge to edge.
- Do NOT draw any hex grid, grid lines, tile outlines, coordinates, labels, text, logos, UI, characters, creatures or tokens. The game draws its own grid on top.
- Each feature that occupies one hex in the layout (a tree, a boulder, a pillar, a crystal, a crate) must stay centred on that spot and roughly fit inside it, so it lines up with the game's hex grid.
- Walls, water and roads must keep their exact outlines from the layout; impassable areas must look clearly impassable, walkable areas clearly walkable.
- Keep contrast moderate so tokens and the grid stay readable on top of the art.
\`\`\`
`;
}

for (const m of list) {
  const target = artSize(m.size);
  const done = new Set<string>();
  for (const v of m.variants) {
    const tiles = v.tiles ?? m.tiles;
    const { bolge, name } = artName(v.image);
    if (done.has(name)) continue;
    done.add(name);
    const key = previewKey(m, v.id);
    const PREVIEW = path.join(MAP_ROOT, bolge, 'onizleme');
    const PROMPT = path.join(MAP_ROOT, bolge, 'prompt');
    fs.mkdirSync(PREVIEW, { recursive: true });
    fs.mkdirSync(PROMPT, { recursive: true });
    await sharp(Buffer.from(svg(tiles, target, true))).png().toFile(path.join(PREVIEW, `${key}-izgara.png`));
    await sharp(Buffer.from(svg(tiles, target, false))).png().toFile(path.join(PREVIEW, `${key}-izgarasiz.png`));
    fs.writeFileSync(path.join(PROMPT, `${key}.md`), prompt(m.id, key, bolge, name, m.variants.length > 1 ? v.id : '', tiles, m.size, target, !!m.mirrorable));
    console.log(`${m.id}${m.variants.length > 1 ? `/${v.id}` : ''}: ${target.w}×${target.h} → harita/${bolge}/onizleme/${key}-izgara.png, ${key}-izgarasiz.png, harita/${bolge}/prompt/${key}.md`);
  }
}
