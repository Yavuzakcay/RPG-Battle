#!/usr/bin/env python3
"""KW1 (yalnız görünüm): Dragonborn kanat ÇİFTİNDEN (768×281, sol kanat sağın birebir aynası) TEK (sağ) kanadı kırpar: public/kanat/dragonborn.webp.
Sol kanat çizimde sağın aynasıdır (`data/kanat-esleme.json` `dragonborn.ayna`); kök (omuz eklemi) çifti iki yandan gövdeye bağlayan nokta.
`python3 scripts/dragonborn-kanat-tek.py [--cift <çift görsel>] [--cikti <dosya>]`
- Çift görsel verilmezse git geçmişindeki çift hâl okunur (CIFT_REF: KW1'den önceki ağaç, `public/kanat/dragonborn.webp`).
- Çıkış: kırpılmış sağ kanat (alfa > 10 sınırlarına), kayıpsız WebP; konsola `capa` (kök, görsel oranı) ve `enBoy` yazılır (veriye girilir).
- Doğrulama: sol yarının alfa kanalı sağın aynasıyla birebir aynı olmalı (değilse durur)."""
import argparse, io, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIFT_REF = 'd7e212a'            # KW1 öncesi ağaç (çift görsel burada)
ORTA = 384                      # çiftin yatay ortası (768 / 2)
KOK_CIFT = (425, 125)           # çift görselde sağ kanadın omuz eklemi (kemik düğümü; kanadın gövdeye bakan üst ucu)
ALFA_ESIK = 10                  # kırpma sınırı (bundan şeffaf kenar atılır)

def cift_yukle(yol):
    if yol: return Image.open(yol).convert('RGBA')
    b = subprocess.check_output(['git', '-C', ROOT, 'show', f'{CIFT_REF}:public/kanat/dragonborn.webp'])
    return Image.open(io.BytesIO(b)).convert('RGBA')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cift', help='kanat çifti görseli (varsayılan: git geçmişi)')
    ap.add_argument('--cikti', default=os.path.join(ROOT, 'public/kanat/dragonborn.webp'))
    a = ap.parse_args()
    cift = np.array(cift_yukle(a.cift))
    if cift.shape[1] != 2 * ORTA: sys.exit(f'beklenen genişlik {2 * ORTA}, gelen {cift.shape[1]}')
    sol, sag = cift[:, :ORTA][:, ::-1], cift[:, ORTA:]
    fark = int(np.abs(sol[..., 3].astype(int) - sag[..., 3].astype(int)).max())
    if fark: sys.exit(f'sol kanat sağın aynası değil (alfa farkı {fark})')
    xs = np.where((sag[..., 3] > ALFA_ESIK).any(0))[0]; ys = np.where((sag[..., 3] > ALFA_ESIK).any(1))[0]
    ox, oy = ORTA + int(xs.min()), int(ys.min())
    tek = sag[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = tek.shape[:2]
    kok = (KOK_CIFT[0] - ox, KOK_CIFT[1] - oy)
    Image.fromarray(tek, 'RGBA').save(a.cikti, 'WEBP', lossless=True, quality=100, method=6)
    print(f'kırpma: x {ox}..{ox + w - 1}, y {oy}..{oy + h - 1} → {w}×{h} px, dosya {os.path.getsize(a.cikti) // 1024} KB')
    print(f'kök (kırpmada): {kok}  capa = [{kok[0] / w:.4f}, {kok[1] / h:.4f}]  enBoy = {h / w:.4f}')

if __name__ == '__main__': main()
