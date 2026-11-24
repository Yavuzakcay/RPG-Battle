#!/usr/bin/env python3
"""CELESTIAL-KIRIK-KANAT-YENI (yalnız görünüm): düz macenta zeminli Kırık Kanat görselinden şeffaf kanat çifti üretir.
`python -X utf8 scripts/celestial-kirik-kanat.py [--kaynak <jpg>] [--cikti <webp>] [--en 768]`
- Zemin: renk anahtarı (macentalık m = min(R, B) − G); kanat içindeki yırtık delikler de aynı anahtarla şeffaf (taşma dolgusu değil).
- Kenar (despill): yarı saydam ve macentaya kaymış (m > 0) her piksel rengini en yakın temiz sepya pikselden alır (alfa anahtardan);
  temiz (opak, m ≤ 0) sepya piksellerine dokunulmaz.
- Küçük kırıntılar (JPG gürültüsü) atılır; iki kanat ve aralarındaki boşluk tek görselde kalır, kanatların ortak sınırına kırpılır.
- Ölçek: kırpılmış çift `--en` px genişliğe alan ortalamasıyla (premultiplied) küçültülür; kayıpsız WebP.
- Konsola `capa` (iki kanat kökünün ortası, görsel oranı) ve `enBoy` yazılır (`data/kanat-esleme.json` `celestial-kirik-kanat`)."""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OPAK = 40          # m ≤ OPAK: tam opak (sepya ve koyu çizgi m < 0)
SEFFAF = 200       # m ≥ SEFFAF: tam şeffaf (zemin m ≈ 251)
KIRINTI = 400      # bundan küçük opak bileşen (kaynak px) atılır
PAY = 4            # kırpma payı (çıkış px)
# Kanat kökleri (kaynak px, 2400×1792): sol kanadın gövdeye bakan omuz düğümü ve sağ kanadınki (yuvarlak kemik ucu).
KOK_SOL = (1290, 730)
KOK_SAG = (1430, 745)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kaynak', default=os.path.join(ROOT, 'assets-ham/kanat/celestial-kirik-kanat-yeni.jpg'))
    ap.add_argument('--cikti', default=os.path.join(ROOT, 'public/kanat/celestial-kirik-kanat.webp'))
    ap.add_argument('--en', type=int, default=768)
    a = ap.parse_args()
    rgb = np.asarray(Image.open(a.kaynak).convert('RGB')).astype(np.float64)
    h0, w0 = rgb.shape[:2]
    kenar = np.concatenate([rgb[:40].reshape(-1, 3), rgb[-40:].reshape(-1, 3), rgb[:, :40].reshape(-1, 3), rgb[:, -40:].reshape(-1, 3)])
    zemin = np.median(kenar, 0)
    m = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    alfa = np.clip((SEFFAF - m) / (SEFFAF - OPAK), 0, 1)
    # Kırıntı temizliği: yarıdan opak bileşenler; küçükler ve onlara bağlı yarı saydam hale atılır.
    lab, n = ndimage.label(alfa > 0.5)
    alan = ndimage.sum(np.ones_like(alfa), lab, range(1, n + 1))
    tut = np.zeros(n + 1, bool); tut[1:] = alan >= KIRINTI
    govde = ndimage.binary_dilation(tut[lab], iterations=3)
    alfa = np.where(govde, alfa, 0)
    alfa[alfa < 0.04] = 0
    # Un-premultiply: P = a·C + (1 − a)·K → C = (P − (1 − a)·K) / a.
    a3 = alfa[..., None]
    renk = np.where(a3 > 0, (rgb - (1 - a3) * zemin) / np.maximum(a3, 1e-6), 0)
    renk = np.clip(renk, 0, 255)
    # Taşma temizliği: JPG renk alt örneklemesi kenarda macentayı kırmızıya kaydırır; temiz olmayan (yarı saydam ya da m > 0)
    # her piksel rengini en yakın temiz sepya pikselden alır (alfa aynı kalır).
    temiz = (alfa >= 1) & (m <= 0)
    _, (iy, ix) = ndimage.distance_transform_edt(~temiz, return_indices=True)
    kirli = (alfa > 0) & ~temiz
    renk[kirli] = renk[iy[kirli], ix[kirli]]
    # Kırpma (kaynakta), sonra premultiplied alan ortalamasıyla küçültme.
    ys, xs = np.nonzero(alfa > 0)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    k = a.en / (x1 - x0 + 2 * PAY * (x1 - x0) / a.en)
    pay = int(round(PAY / k))
    x0, y0 = max(0, x0 - pay), max(0, y0 - pay); x1, y1 = min(w0, x1 + pay), min(h0, y1 + pay)
    cw, ch = x1 - x0, y1 - y0
    W = a.en; H = int(round(ch * W / cw))
    pre = np.dstack([renk[y0:y1, x0:x1] * alfa[y0:y1, x0:x1, None], alfa[y0:y1, x0:x1] * 255])
    kucuk = np.stack([np.asarray(Image.fromarray(pre[..., i].astype(np.float32), 'F').resize((W, H), Image.BOX)) for i in range(4)], -1)
    al = kucuk[..., 3]
    col = np.where(al[..., None] > 0, kucuk[..., :3] / np.maximum(al[..., None] / 255, 1e-6), 0)
    out = np.dstack([np.clip(col, 0, 255), np.clip(al, 0, 255)]).round().astype(np.uint8)
    out[out[..., 3] < 3] = 0
    Image.fromarray(out, 'RGBA').save(a.cikti, 'WEBP', lossless=True, quality=100, method=6)
    s = W / cw
    kx = ((KOK_SOL[0] + KOK_SAG[0]) / 2 - x0) * s; ky = ((KOK_SOL[1] + KOK_SAG[1]) / 2 - y0) * s
    print(f'zemin {zemin.round().astype(int).tolist()}, kırpma x {x0}..{x1} y {y0}..{y1} → {W}×{H}, {os.path.getsize(a.cikti) // 1024} KB')
    print(f'kökler (çıkış px): sol {((KOK_SOL[0] - x0) * s):.0f},{((KOK_SOL[1] - y0) * s):.0f}  sağ {((KOK_SAG[0] - x0) * s):.0f},{((KOK_SAG[1] - y0) * s):.0f}')
    print(f'capa = [{kx / W:.4f}, {ky / H:.4f}]  enBoy = {H / W:.4f}')


if __name__ == '__main__':
    main()
