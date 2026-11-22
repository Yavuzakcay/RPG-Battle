#!/usr/bin/env python3
"""KQ6-17: halesiz varyant silme denetimi. Her Celestial jeton için halesiz varyant ile asıl jeton arasındaki silinen pikseller (asıl alfa>0, halesiz alfa=0).
Hale bölgesi = hale şekli (hale-oneri rings maskesi + kütleye karışan üst kısım) 5 px genişletilmiş; bu bölge DIŞINDA silinen piksel > 3 ise jeton "şüpheli".
Dışarıda silinenler baş üst kenarına (koyu kontur ilk satırı) ve baş merkezine göre ayrılır: üst (satır < baş üstü), sol (x < merkez), sağ.
Çıktı: docs/sabah/hale-silme-denetim.png (şüpheli: orijinal | halesiz | fark maskesi) ve docs/sabah/hale-silme-denetim.csv. Ayrıca halesizde hale kalıntısı kaldı mı (şekil temelli)."""
import csv, importlib.util, os, re
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
hv = load('hv', 'scripts/hale-v2.py'); ho = load('ho', 'scripts/hale-oneri.py')
D = 'public/characters'; N = 256; ESIK = 3

def halo_zone(o):
    """Hale bölgesi, silme işleminden BAĞIMSIZ: (1) hale-oneri şekil maskesi 5 px genişletilmiş, (2) kütleye karışan üst kısım, (3) baş üst kenarının (koyu kontur ilk satırı) üstünde, başa ±75 px içindeki bölge."""
    r = ho.rings(o); mi = r['mi']; z = np.zeros((N, N), bool)
    if r['sinif'] in ('var', 'belirsiz') and r['mask'].any(): z |= ndi.binary_dilation(r['mask'], iterations=7)
    if mi['merged'].any(): z |= ndi.binary_dilation(mi['merged'], iterations=7)
    top, cx = mi['top_px'], mi['cx']
    z[:max(0, top - 1), max(0, cx - 75):cx + 76] = True
    return z, mi

def halo_left(f):
    d = hv.analyse(f); r = ho.rings(f)
    return d['durum'] in ('tam', 'kesik') or r['sinif'] == 'var'

def main():
    hv.OPAQUE_R = 3
    names = sorted(f[:-5] for f in os.listdir(f'{D}/halesiz') if f.endswith('.webp'))
    rows = []; sus = []
    for n in names:
        o = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); f = np.array(Image.open(f'{D}/halesiz/{n}.webp').convert('RGBA'))
        rem = (o[..., 3] > 0) & (f[..., 3] == 0)
        zone, mi = halo_zone(o); out = rem & ~zone
        top, cx = mi['top_px'], mi['cx']
        yy, xx = np.mgrid[0:N, 0:N]
        ust = out & (yy < top - 1); alt = out & ~ust
        sol = int((alt & (xx < cx)).sum()); sag = int((alt & (xx >= cx)).sum()); u = int(ust.sum())
        rows.append((f'{n}.webp', int(out.sum()), sol, sag, u, int((rem & zone).sum()), 'evet' if halo_left(f) else 'hayir'))
        if out.sum() > ESIK: sus.append((n, o, f, rem, zone, out))
    with open('docs/sabah/hale-silme-denetim.csv', 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['dosya', 'hale_disinda_silinen_px', 'sol_px', 'sag_px', 'ust_px', 'hale_bolgesinde_silinen_px', 'halesizde_hale_kaldi'])
        w.writerows(rows)
    cols = 2; rws = (len(sus) + cols - 1) // cols; lab = 18
    sheet = Image.new('RGB', (cols * (N * 3 + 12), max(1, rws) * (N + lab)), (60, 64, 72)); dr = ImageDraw.Draw(sheet)
    for i, (n, o, f, rem, zone, out) in enumerate(sus):
        ox = (i % cols) * (N * 3 + 12); oy = (i // cols) * (N + lab)
        bg = np.full((N, N, 3), 96, np.uint8)
        for k, arr in enumerate((o, f)):
            im = Image.fromarray(arr); t = Image.new('RGB', (N, N), (96, 100, 112)); t.paste(im, (0, 0), im); sheet.paste(t, (ox + k * N, oy))
        m = np.full((N, N, 3), 40, np.uint8)
        al = (f[..., 3] > 0); m[al] = (110, 110, 118)            # kalan figür gri
        m[rem & zone] = (245, 215, 80); m[out] = (255, 40, 40)   # hale bölgesinde silinen sarı, dışarıda silinen kırmızı
        sheet.paste(Image.fromarray(m), (ox + 2 * N, oy))
        row = next(r for r in rows if r[0] == f'{n}.webp')
        dr.text((ox + 2, oy + N + 3), f'{n.replace("celestial-", "")}  disarida {row[1]} px (sol {row[2]} sag {row[3]} ust {row[4]})', fill=(255, 255, 255))
    sheet.save('docs/sabah/hale-silme-denetim.png')
    left = [r for r in rows if r[6] == 'evet']
    print(len(rows), 'jeton', len(sus), 'şüpheli', len(left), "halesizde hale kaldı")
    for r in sorted(rows, key=lambda r: -r[1])[:12]: print(r)

if __name__ == '__main__': main()
