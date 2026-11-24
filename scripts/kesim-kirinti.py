#!/usr/bin/env python3
"""KESIM-TEPE-SON (2026-11-23): jeton kenarındaki kesim kırıntılarını temizler (yalnız alfa sıfırlanır; figürün renkleri, yeri değişmez,
ten maskesi hizalı kalır).
  kopuk   en büyük bileşenden (alfa > 32, 8-komşu) `--uzak` px'ten (varsayılan 6) uzak ve `--alan` px'ten (varsayılan 150) küçük bileşenler
          (kopuk çizgi, nokta).
  macenta figürün dış kenarındaki (saydam komşulu) zemin anahtarı renkli pikseller (R ve B, G'den ≥ 60 yüksek): yeşil/macenta zeminin
          kenara sızması; bir katman bitince yeni kenar yeniden denetlenir (`--tur`, varsayılan 3).
  sizinti dış kenara `--bant` px (varsayılan 2) içindeki macenta yansıması kısılır (R ve B en çok G + 20; toplu-kesim.py `despill` mantığı, alfa daraltmasız:
          kontur silinmez, yalnız rengi düzelir) ve figür içindeki saf zemin anahtarı delikleri (macentaya uzaklık < 110) saydam olur.
Kullanım: python scripts/kesim-kirinti.py [--kopuk] [--macenta] [--sizinti] <jeton> ...   (public/characters/<ad>.webp yazılır; küçük kopya:
npm run karakter-kucuk -- <ad>). Eski dosya public/characters/_yedek-kesim-2026-11-22/ altına (yoksa) kopyalanır.
"""
import os, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
D, YEDEK = 'public/characters', 'public/characters/_yedek-kesim-2026-11-22'
arg = lambda k, v: int(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else v
VAL = ('--uzak', '--alan', '--tur', '--bant')
names = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] not in VAL]

def kopuk(a, uzak, alan):
    op = a[..., 3] > 32
    lab, n = ndi.label(op, structure=np.ones((3, 3)))
    if n < 2: return 0
    sz = np.bincount(lab.ravel()); sz[0] = 0; big = int(sz.argmax())
    dist = ndi.distance_transform_edt(lab != big)
    gone = 0
    for i in range(1, n + 1):
        if i == big or sz[i] >= alan: continue
        m = lab == i
        if dist[m].min() > uzak: a[m, 3] = 0; gone += int(m.sum())
    # kopuk bileşenlerin alfa ≤ 32 hale pikselleri de (komşusu artık saydam)
    faint = (a[..., 3] > 0) & (a[..., 3] <= 32) & ~ndi.binary_dilation(a[..., 3] > 32, iterations=2)
    a[faint, 3] = 0
    return gone

def macenta(a, tur):
    gone = 0
    for _ in range(tur):
        op = a[..., 3] > 0
        edge = op & ndi.binary_dilation(~op, structure=np.ones((3, 3)))
        r, g, b = (a[..., k].astype(int) for k in range(3))
        key = (r - g >= 60) & (b - g >= 60)
        m = edge & key
        if not m.any(): break
        a[m, 3] = 0; gone += int(m.sum())
    return gone

def sizinti(a, kroma=20, bant=2):
    al = a[..., 3] > 0
    band = al & ~ndi.binary_erosion(al, iterations=bant)
    rgb = a[..., :3].astype(int)
    mag = band & ((np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]) > kroma)
    lim = rgb[..., 1] + kroma
    a[..., 0] = np.where(mag, np.minimum(rgb[..., 0], lim), a[..., 0]); a[..., 2] = np.where(mag, np.minimum(rgb[..., 2], lim), a[..., 2])
    hole = al & (np.linalg.norm(rgb - np.array([255, 0, 255]), axis=2) < 110)
    a[hole, 3] = 0
    return int(mag.sum()), int(hole.sum())

for n in names:
    f = f'{D}/{n}.webp'; a = np.array(Image.open(f).convert('RGBA'))
    os.makedirs(YEDEK, exist_ok=True)
    if not os.path.exists(f'{YEDEK}/{n}.webp'): shutil.copy2(f, f'{YEDEK}/{n}.webp')
    g1 = kopuk(a, arg('--uzak', 6), arg('--alan', 150)) if '--kopuk' in sys.argv else 0
    g2 = macenta(a, arg('--tur', 3)) if '--macenta' in sys.argv else 0
    g3 = sizinti(a, bant=arg('--bant', 2)) if '--sizinti' in sys.argv else (0, 0)
    Image.fromarray(a, 'RGBA').save(f, 'WEBP', quality=92, alpha_quality=100, method=4)
    print(n, 'kopuk', g1, 'macenta', g2, 'sızıntı (renk, delik)', g3)
