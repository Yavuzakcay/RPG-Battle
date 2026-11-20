#!/usr/bin/env python3
"""Gladyatör toplu sayfa hazırlığı: Fighter sayfalarının Sancaktar hücresi (4x3, satır 3 sütun 2) → 3x3 sayfalar.
Ham: assets-ham/karakter/fighter-<male|female>-<ırk>.jpg (depoya girmez; git checkout origin/wip/karakter-ham -- assets-ham/karakter).
Çıktı: docs/sabah/gladyator-sayfa/ (sancaktar-erkek.png, sancaktar-kadin.png, sancaktar-dragonborn.png, eslesme.csv). Var olan dosyanın üzerine yazmaz.
Çalıştırma: python3 scripts/gladyator-sayfa.py [ham_klasör]   (Pillow, numpy, scipy)"""
import csv, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RAW = sys.argv[1] if len(sys.argv) > 1 else 'assets-ham/karakter'
OUT = 'docs/sabah/gladyator-sayfa'
COLS, ROWS, CELL_COL, CELL_ROW = 4, 3, 1, 2      # Sancaktar = 10. hücre (satır 3, sütun 2)
CELL, FILL = 640, 0.65                            # çıktı hücre px; karakter en uzun kenarı = %65
GREEN, MAGENTA = (0, 255, 0), (255, 0, 255)
INSET, T = 10, 70                                 # hücre kenar payı (siyah çizgiler), zemin farkı eşiği
# Hızır sırası (İnsan hariç; 9. hücre dolgu olarak İnsan)
ORDER = ['tiefling', 'celestial', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'orc', 'human']
GENS = {'erkek': 'male', 'kadin': 'female'}

def cell_of(path):
    im = Image.open(path).convert('RGB'); W, H = im.size
    x0, x1 = round(W * CELL_COL / COLS), round(W * (CELL_COL + 1) / COLS)
    y0, y1 = round(H * CELL_ROW / ROWS), round(H * (CELL_ROW + 1) / ROWS)
    return np.asarray(im.crop((x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET))).astype(int)

def extract(a):
    """Hücrenin kendi zemin rengini kenardan örnekle, figürü çıkar → (RGBA kırpılmış, zemin rengi)."""
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    edge = edge[edge.max(axis=1) > 90]                      # koyu çizgi kırıntılarını sayma
    bg = np.median(edge, axis=0)
    d = np.linalg.norm(a - bg, axis=2)
    m = ndi.binary_opening(d > T, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=3))   # yakın parçalar (bayrak, uç) birlikte
    sizes = ndi.sum(m, lab, range(1, n + 1))
    ok = [i + 1 for i, v in enumerate(sizes) if v >= 0.03 * sizes.max()]   # kaynaktaki küçük lekeler atılır
    keep = m & np.isin(lab, ok)
    keep = ndi.binary_fill_holes(keep) & (d > T * 0.6) | keep
    band = keep & ~ndi.binary_erosion(keep, iterations=3)      # zemin halesi: kenar bandında zemine yakın renkler silinir
    keep &= ~(band & (d < 150))
    r_, g_, b_ = a[..., 0], a[..., 1], a[..., 2]
    tint = (g_ > np.maximum(r_, b_) + 45) if bg[1] > bg[0] else (np.minimum(r_, b_) > g_ + 45)   # zemin tonu kalıntısı (delik içi hale)
    keep &= ~(tint & (d < 110))
    keep = ndi.binary_opening(ndi.binary_erosion(keep, iterations=1), iterations=1)
    ys, xs = np.where(keep)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([a, keep * 255]).astype(np.uint8)[y0:y1, x0:x1]
    return Image.fromarray(rgba, 'RGBA'), tuple(int(v) for v in bg)

def page(cells, bgcolor, cols=3):
    rows = -(-len(cells) // cols)
    sheet = Image.new('RGB', (cols * CELL, rows * CELL), bgcolor)
    info = []
    for i, fig in enumerate(cells):
        w, h = fig.size; s = FILL * CELL / max(w, h)
        f = fig.resize((max(1, round(w * s)), max(1, round(h * s))), Image.NEAREST)
        cx, cy = (i % cols) * CELL, (i // cols) * CELL
        px, py = cx + (CELL - f.width) // 2, cy + (CELL - f.height) // 2
        sheet.paste(f, (px, py), f)
        info.append((f.width, f.height))
    return sheet, info

def safe_save(img, name):
    p = f'{OUT}/{name}'
    if os.path.exists(p): raise SystemExit(f'{p} var; üzerine yazılmaz')
    img.save(p)

def main():
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for gen, g in GENS.items():
        figs = []
        for i, race in enumerate(ORDER):
            src = f'fighter-{g}-{race}.jpg'
            fig, bg = extract(cell_of(f'{RAW}/{src}')); figs.append(fig)
            rows.append([f'sancaktar-{gen}.png', i + 1, race, gen, src, 'sancaktar (hücre 10)' + (' - dolgu: İnsan hariç tutulunca 9. hücre' if race == 'human' else ''), '#%02X%02X%02X' % bg])
        sheet, _ = page(figs, GREEN); safe_save(sheet, f'sancaktar-{gen}.png')
    figs = []
    for i, gen in enumerate(GENS):
        src = f'fighter-{GENS[gen]}-dragonborn.jpg'
        fig, bg = extract(cell_of(f'{RAW}/{src}')); figs.append(fig)
        rows.append(['sancaktar-dragonborn.png', i + 1, 'dragonborn', gen, src, 'sancaktar (hücre 10); zemin macenta (beyaz taban)', '#%02X%02X%02X' % bg])
    sheet, _ = page(figs, MAGENTA, cols=2); safe_save(sheet, 'sancaktar-dragonborn.png')
    p = f'{OUT}/eslesme.csv'
    if os.path.exists(p): raise SystemExit(f'{p} var')
    with open(p, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f); w.writerow(['yeni_sayfa', 'yeni_hucre', 'irk', 'cinsiyet', 'kaynak_dosya', 'not', 'kaynak_zemin']); w.writerows(rows)
main()
