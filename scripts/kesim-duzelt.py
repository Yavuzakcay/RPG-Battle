#!/usr/bin/env python3
"""KQ6-20: toplu kesim sonrası küçük kalıntı temizliği (yalnız figürden AYRI bileşenler silinir; en büyük bileşene ve renkli parçalara dokunulmaz).
Silinen: (a) neredeyse saydam (ortalama alfa ≤ 12) küçük parçalar, (b) küçük (≤ 80 px) koyu nötr/yeşilimsi nokta, (c) ince (≤ 8 px) uzun (≥ 12 px, en/boy ≥ 3) koyu çizgi.
Kullanım: python3 scripts/kesim-duzelt.py <jeton adı> ...  (public/characters/<ad>.webp + kucuk/ yeniden yazılır)"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = 'public/characters'

def clean(a):
    # görünmez (alfa ≤ 12) pikseller, opak kütleden 2 px uzaktaysa silinir (ayrı parçaları görünmez köprülerle bağlıyordu)
    solid = a[..., 3] > 100; near = ndi.binary_dilation(solid, iterations=2)
    faint = (a[..., 3] > 0) & (a[..., 3] <= 12) & ~near; a[faint, 3] = 0
    lab, k = ndi.label(a[..., 3] > 12, structure=np.ones((3, 3)))
    if k < 2: return a, []
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, k + 1)); big = 1 + int(np.argmax(sizes)); removed = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if i == big: continue
        m = lab == i; area = int(m.sum()); h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        px = a[m]; mx = px[:, :3].max(axis=1).mean(); spread = (px[:, :3].max(axis=1) - px[:, :3].min(axis=1)).mean(); al = px[:, 3].mean()
        dark = mx < 70
        faint = al <= 12 and area <= 120
        dot = area <= 80 and dark
        line = dark and min(h, w) <= 8 and max(h, w) >= 12 and max(h, w) >= 3 * min(h, w)
        if faint or dot or line: a[m, 3] = 0; removed.append((area, (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)))
    return a, removed

def main():
    for n in sys.argv[1:]:
        a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); a, rem = clean(a)
        Image.fromarray(a).save(f'{D}/{n}.webp', 'WEBP', quality=92, alpha_quality=100, method=4)
        Image.fromarray(a).resize((96, 96), Image.LANCZOS).save(f'{D}/kucuk/{n}.webp', 'WEBP', quality=82, method=4)
        print(n, len(rem), 'parça silindi', sum(r[0] for r in rem), 'px; görünür (alfa>12) olanlar:', [r for r in rem if r[0] > 20])

if __name__ == '__main__': main()
