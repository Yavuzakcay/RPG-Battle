#!/usr/bin/env python3
"""KQ6-21: halesiz sayılan Celestial jetonlar (hale-halesiz.json bekleyen DIŞINDAKİLER) için doğrulama sayfaları: docs/sabah/halesiz-dogrulama/<sinif>.png.
Hücre: 256×256 ham halesiz sprite (yıldız tacı YOK, koyu zemin) + yanında baş bölgesi (üst %40, baş merkezine ±50 px) 3× büyütülmüş kırpık; satırda 6 jeton, dosya adı etiketli."""
import json, os, re
from PIL import Image, ImageDraw
D = 'public/characters'; OUT = 'docs/sabah/halesiz-dogrulama'
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
def main():
    os.makedirs(OUT, exist_ok=True)
    hold = set(json.load(open('data/hale-halesiz.json'))['bekleyen'])
    konum = json.load(open('data/hale-konum.json'))
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp') and f[:-5] not in hold)
    by = {c: [] for c in CLASSES}
    for n in names: by[re.match(r'celestial-(?:erkek|kadin|male|female)-([a-z]+)', n).group(1)].append(n)
    cell_w, cell_h, lab = 256 + 8 + 300, 306 + 14, 14; cols = 6
    for cls, ns in by.items():
        rows = max(1, (len(ns) + cols - 1) // cols)
        sheet = Image.new('RGB', (cols * cell_w, rows * cell_h), (28, 30, 38)); d = ImageDraw.Draw(sheet)
        for i, n in enumerate(ns):
            ox, oy = (i % cols) * cell_w, (i // cols) * cell_h
            t = Image.open(f'{D}/{n}.webp').convert('RGBA'); bg = Image.new('RGB', (256, 256), (28, 30, 38)); bg.paste(t, (0, 0), t)
            sheet.paste(bg, (ox, oy + lab))
            name = n[len('celestial-'):]; m = re.match(r'(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', name)
            g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1)); key = f'{m.group(2)}-{g}' + ('-gr' if m.group(3) == 'GR' else ('-genel' if not m.group(3) else ''))
            e = konum['jeton'].get(name) or konum['varsayilan'].get(key) or {'x': 128}
            x0 = int(max(0, min(256 - 100, e['x'] - 50))); crop = bg.crop((x0, 0, x0 + 100, 102)).resize((300, 306), Image.NEAREST)
            sheet.paste(crop, (ox + 264, oy + lab))
            d.text((ox + 2, oy + 1), name, fill=(255, 255, 255))
        sheet.save(f'{OUT}/{cls}.png')
    print(len(names), {c: len(v) for c, v in by.items()})
if __name__ == '__main__': main()
