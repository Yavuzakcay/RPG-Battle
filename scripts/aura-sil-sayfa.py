#!/usr/bin/env python3
"""Barbarian Çılgın Yol (ID8) jetonları: 8 ırk (Celestial ve Dragonborn hariç) × erkek/kadın, 2 sayfa 3×3 (erkek, kadın; 9. hücre boş),
düz magenta #FF00FF zemin, hücre 512×512, ayak hizalı, alt %6 / yan ve üst %4 boşluk (assert). Çıktı docs/sabah/aura-sil-sayfa-01/02.png + aura-sil-eslesme.csv."""
import csv
import numpy as np
from PIL import Image
D = 'public/characters'
RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath']
CELL, ALT, YAN, UST = 512, 0.06, 0.04, 0.04
def bbox(img):
    a = np.array(img)[..., 3] > 8; ys, xs = np.where(a); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
def place(img, name):
    x0, y0, x1, y1 = bbox(img); w, h = x1 - x0, y1 - y0
    base = round(CELL * (1 - ALT)); sc = min(CELL * (1 - 2 * YAN) / w, (base - CELL * UST) / h)
    nw, nh = max(1, int(w * sc)), max(1, int(h * sc))
    crop = img.crop((x0, y0, x1, y1)).resize((nw, nh), Image.NEAREST)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); cell.paste(crop, ((CELL - nw) // 2, base - nh), crop)
    bx0, by0, bx1, by1 = bbox(cell)
    assert by1 <= base and bx0 >= CELL * YAN - 1 and bx1 <= CELL * (1 - YAN) + 1 and by0 >= CELL * UST - 1, f'marj: {name}'
    return cell
rows = []
for p, g in enumerate(['erkek', 'kadin']):
    sheet = Image.new('RGB', (1536, 1536), (255, 0, 255))
    for c, race in enumerate(RACES):
        f = f'{race}-{g}-barbarian-ID8.webp'
        img = Image.open(f'{D}/{f}').convert('RGBA')
        a = np.array(img)[..., 3] > 8
        assert not (a[0].any() or a[-1].any() or a[:, 0].any() or a[:, -1].any()), f'kırpık kaynak: {f}'
        cell = place(img, f); sheet.paste(cell, ((c % 3) * 512, (c // 3) * 512), cell)
        rows.append((f'{p + 1:02d}', c + 1, f, race, g))
    sheet.save(f'docs/sabah/aura-sil-sayfa-{p + 1:02d}.png')
with open('docs/sabah/aura-sil-eslesme.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'dosya', 'irk', 'cinsiyet']); w.writerows(rows)
print(len(rows))
