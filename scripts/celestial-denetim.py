#!/usr/bin/env python3
"""KQ6-16: Celestial jeton denetim sayfaları. docs/sabah/celestial-denetim/<sinif>.png (256×256 jeton, satırda 8, dosya adı etiketli) ve liste.csv
(dosya, hale_var_tahmini evet/hayir/belirsiz, kafa_ustu_bosluk_px, hale_kafa_merkez_farki_px). Tahminler şekil temelli (hale-v2 + hale-oneri); kesin değil, denetim yardımıdır.
Kafa üstü boşluk: hale varsa halenin en alt satırı ile (başa ±30 px içindeki) ilk opak baş/şapka satırı arasındaki saydam satır sayısı (hale başa değiyorsa 0); hale yoksa tuval üstünden başın ilk opak satırına kadar saydam satır sayısı.
Hale-kafa merkez farkı: hale mask'ının yatay merkezi − baş merkezi (px; işaretli: + hale sağda); hale yoksa boş."""
import csv, importlib.util, os, re
import numpy as np
from PIL import Image, ImageDraw
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
hv = load('hv', 'scripts/hale-v2.py'); ho = load('ho', 'scripts/hale-oneri.py')
D = 'public/characters'; OUT = 'docs/sabah/celestial-denetim'
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']

def analyse(a):
    d = hv.analyse(a); r = ho.rings(a); mi = r['mi']
    hv_has = d['durum'] in ('tam', 'kesik'); ring_has = r['sinif'] == 'var'
    if hv_has or ring_has: tahmin = 'evet'
    elif d['durum'] == 'yok' and r['sinif'] == 'yok' and hv.above_empty(a, d): tahmin = 'hayir'
    else: tahmin = 'belirsiz'
    cx = mi['cx']
    solid = a[:, max(0, cx - 30):cx + 31, 3] > 100
    mask = r['mask'] if ring_has else (d['rm'] if d['rm'].any() else (d['comp'] if hv_has else None))
    gap = 0
    if tahmin == 'evet' and mask is not None and mask.any():
        ys = np.where((mask & (a[..., 3] > 100)).any(axis=1))[0]; hb = int(ys.max()) if len(ys) else int(np.where(mask.any(axis=1))[0].max())
        nxt = next((y for y in range(hb + 1, 256) if solid[y].any()), 256); gap = max(0, nxt - hb - 1)   # halenin altı ile başın ilk opak satırı arası
    else:
        gap = next((y for y in range(256) if solid[y].any()), 0)                                       # hale yok: başın (şapka/saç) üstündeki saydam satırlar
    dx = ''
    if tahmin == 'evet' and mask is not None and mask.any():
        xs = np.where(mask.any(axis=0))[0]; dx = int(round((xs.min() + xs.max()) / 2 - cx))
    return tahmin, gap, dx

def main():
    os.makedirs(OUT, exist_ok=True)
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
    rows = []; by = {c: [] for c in CLASSES}
    for n in names:
        m = re.match(r'celestial-(?:erkek|kadin|male|female)-([a-z]+)(?:-|$)', n); cls = m.group(1)
        a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); t, g, dx = analyse(a)
        rows.append((f'{n}.webp', t, g, dx)); by[cls].append(n)
    with open(f'{OUT}/liste.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['dosya', 'hale_var_tahmini', 'kafa_ustu_bosluk_px', 'hale_kafa_merkez_farki_px']); w.writerows(rows)
    for cls, ns in by.items():
        cols = 8; rws = (len(ns) + cols - 1) // cols; cell = 256; lab = 16
        im = Image.new('RGB', (cols * cell, rws * (cell + lab)), (96, 100, 112)); d = ImageDraw.Draw(im)
        for i, n in enumerate(ns):
            ox, oy = (i % cols) * cell, (i // cols) * (cell + lab)
            t = Image.open(f'{D}/{n}.webp').convert('RGBA'); im.paste(t, (ox, oy), t)
            d.text((ox + 2, oy + cell + 2), n.replace('celestial-', '')[:40], fill=(255, 255, 255))
        im.save(f'{OUT}/{cls}.png')
    from collections import Counter
    print(len(rows), Counter(r[1] for r in rows), {c: len(v) for c, v in by.items()})

if __name__ == '__main__': main()
