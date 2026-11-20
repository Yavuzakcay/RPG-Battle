#!/usr/bin/env python3
"""İŞ 2 (önizleme): Celestial jeton halesi tespiti. Altın/sarı ince elips (halka) ⇒ hale maskesi; durum tam/kesik/yok.
Hale: üst bölgede, geniş-ince (en/boy ≥ 2,2), dolgu oranı düşük (halka), altın tonlu bileşen. Altın saç dolu kütledir, halka değildir.
"""
import colorsys, glob, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def gold(rgba):
    """Altın/sarı/limon tonlu parlak pikseller (hue 38–88°, doygun, parlak); halka bazı jetonlarda yeşilimsi sarıdır."""
    rgb = rgba[..., :3].astype(float) / 255.0
    mx = rgb.max(axis=2); mn = rgb.min(axis=2); d = mx - mn + 1e-9
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-9)
    return (rgba[..., 3] > 60) & (h >= 38) & (h <= 88) & (s > 0.20) & (mx > 0.66)

def runs(row):
    best = cur = 0
    for v in row:
        cur = cur + 1 if v else 0; best = max(best, cur)
    return best

def detect(rgba):
    """→ {'durum','mask','bbox'}. Hale = başın/şapkanın (ilk yoğun, altın olmayan satır) ÜSTÜNDEKİ altın/sarı pikseller (kesik noktalı ince
    halka). Yoğun satır: altın olmayan opak piksellerin ≥ 18 px'lik kesintisiz serisi (saç, şapka, kask). Hiç hale pikseli yoksa mask boş
    (hiçbir şey silinmez); halka bir şapka/kaskla örtüşüyorsa şapka pikseli (altın değil) korunur."""
    al = rgba[..., 3] > 60
    ys, xs = np.where(al)
    empty = {'durum': 'yok', 'mask': np.zeros(al.shape, bool), 'bbox': None}
    if not len(ys): return empty
    gm = gold(rgba); solid = al & ~gm
    dense = next((y for y in range(al.shape[0] - 4) if all(runs(solid[y + k]) >= 18 for k in range(5))), None)  # ≥ 5 satır kalınlığında dolu kütle (halka ince)
    if dense is None: return empty
    mask = gm.copy(); mask[dense + 2:] = False
    mask = mask & ndi.binary_dilation(mask, iterations=0) if False else mask
    # ince halka: dolgu oranı düşük, geniş-ince bileşenler (yalnız bunlar silinir)
    lab, n = ndi.label(ndi.binary_dilation(mask, iterations=2) & al)
    keep = np.zeros_like(mask)
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = mask & (lab == i); area = int(m.sum())
        if area < 12: continue
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        if w >= 14 and h <= 40: keep |= m
    if keep.sum() < 25: return empty
    ys2, xs2 = np.where(keep)
    bb = (int(xs2.min()), int(ys2.min()), int(xs2.max()) + 1, int(ys2.max()) + 1)
    top = ys.min()
    kesik = bb[1] <= 1 or (bb[2] - bb[0]) < 30
    return {'durum': 'kesik' if kesik else 'tam', 'mask': keep, 'bbox': bb}

if __name__ == '__main__':
    rows = []
    for f in sorted(glob.glob('public/characters/celestial-*.webp')):
        a = np.asarray(Image.open(f).convert('RGBA'))
        d = detect(a); rows.append((os.path.basename(f)[:-5], d['durum'], d['bbox']))
    json.dump(rows, open('/tmp/claude-0/s/hale.json', 'w'))
    import collections
    print(collections.Counter(r[1] for r in rows), len(rows))
