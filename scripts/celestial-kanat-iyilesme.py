#!/usr/bin/env python3
"""CELESTIAL-KANAT-IYILESME (yalnız görünüm): Kırık Kanat'ın iyileşmiş kanadı, melek efekt sayfasından.
`python -X utf8 scripts/celestial-kanat-iyilesme.py [--kaynak public/efekt/efekt-kanat-melek.webp] [--cikti public/kanat/celestial-kirik-kanat-iyi.webp] [--buyut 4]`
- Kaynak sayfa (dokunulmaz): 4 kare yan yana, şeffaf zemin. Kare 4 eşit parçaya bölünür; en opak kare (alfa > 200 piksel sayısı, eşitlikte
  ilk kare) seçilir, alfa > 0 sınırına sıkı kırpılır.
- Kare küçük (kanat çifti ≈151×59 px): `--buyut` tam sayı katıyla EN YAKIN KOMŞU büyütme (yumuşatma yok); 1 verilirse büyütme yok.
- Konsola `kok` (iki kanadın iç kökünün ortası, görsel oranı: her kanadın gövdeye bakan en iç sütunundaki opak piksellerin ortası) ve
  `enBoy` yazılır (`data/kanat-esleme.json` `celestial-kirik-kanat.iyilesme`)."""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kaynak', default=os.path.join(ROOT, 'public/efekt/efekt-kanat-melek.webp'))
    ap.add_argument('--cikti', default=os.path.join(ROOT, 'public/kanat/celestial-kirik-kanat-iyi.webp'))
    ap.add_argument('--kare', type=int, default=4)
    ap.add_argument('--buyut', type=int, default=4)
    a = ap.parse_args()
    sayfa = np.asarray(Image.open(a.kaynak).convert('RGBA'))
    w = sayfa.shape[1] // a.kare
    kareler = [sayfa[:, i * w:(i + 1) * w] for i in range(a.kare)]
    puan = [int((k[..., 3] > 200).sum()) for k in kareler]
    sec = int(np.argmax(puan))
    k = kareler[sec]
    ys, xs = np.nonzero(k[..., 3] > 0)
    k = k[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h0, w0 = k.shape[:2]
    # Kökler: iki büyük opak bileşen (sol/sağ kanat); sol kanadın en sağ, sağ kanadın en sol opak sütunu (alfa > 128) ortası.
    lab, n = ndimage.label(k[..., 3] > 128)
    alan = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    iki = sorted((np.argsort(alan)[-2:] + 1).tolist(), key=lambda i: np.nonzero(lab == i)[1].mean())
    def ic(i, sag):
        yy, xx = np.nonzero(lab == i)
        x = xx.max() if not sag else xx.min()
        return x + (1 if not sag else 0), yy[xx == x].mean()
    (lx, ly), (rx, ry) = ic(iki[0], False), ic(iki[1], True)
    kx, ky = (lx + rx) / 2 / w0, ((ly + ry) / 2 + 0.5) / h0
    img = Image.fromarray(k, 'RGBA')
    if a.buyut > 1: img = img.resize((w0 * a.buyut, h0 * a.buyut), Image.NEAREST)
    img.save(a.cikti, 'WEBP', lossless=True, quality=100, method=6)
    print(f'kare puanları (alfa>200) {puan} → seçilen kare {sec + 1}; kırpma {w0}×{h0} px, ×{a.buyut} en yakın komşu → {img.size[0]}×{img.size[1]}')
    print(f'kökler (kırpma px): sol {lx},{ly:.1f}  sağ {rx},{ry:.1f}; kök aralığı {(rx - lx) / w0:.4f} (genişlik oranı)')
    print(f'kok = [{kx:.4f}, {ky:.4f}]  enBoy = {h0 / w0:.4f}')


if __name__ == '__main__':
    main()
